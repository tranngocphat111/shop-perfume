package iuh.fit.server.services.impl;

import iuh.fit.server.dto.request.OrderCreateRequest;
import iuh.fit.server.dto.request.SepayWebhookRequest;
import iuh.fit.server.dto.response.OrderResponse;
import iuh.fit.server.dto.response.PaymentCheckResponse;
import iuh.fit.server.mapper.OrderMapper;
import iuh.fit.server.model.entity.*;
import iuh.fit.server.model.enums.Method;
import iuh.fit.server.model.enums.PaymentStatus;
import iuh.fit.server.model.enums.ShipmentStatus;
import iuh.fit.server.repository.OrderRepository;
import iuh.fit.server.repository.PaymentRepository;
import iuh.fit.server.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements iuh.fit.server.services.OrderService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;
    private final OrderMapper orderMapper;
    
    // Timeout for QR payment: 30 minutes in milliseconds
    private static final long QR_PAYMENT_TIMEOUT_MS = 30 * 60 * 1000;

    @Transactional
    @Override
    public OrderResponse createOrder(OrderCreateRequest request) {

        // Create Order entity
        Order order = new Order();
        order.setOrderDate(new Date());
        order.setTotalAmount(request.getTotalAmount());
        order.setGuestName(request.getFullName());
        order.setGuestEmail(request.getEmail());
        order.setGuestPhone(request.getPhone());
        order.setGuestAddress(request.getAddress());
        order.setCreatedAt(new Date());

        // Create OrderItems
        List<OrderItem> orderItems = request.getCartItems().stream().map(cartItem -> {
            OrderItem orderItem = new OrderItem();
            
            // Fetch product from database
            Product product = productRepository.findById(cartItem.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + cartItem.getProductId()));
            
            orderItem.setProduct(product);
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setUnitPrice(product.getUnitPrice());
            orderItem.setSubTotal(product.getUnitPrice() * cartItem.getQuantity());
            orderItem.setOrder(order);
            
            return orderItem;
        }).collect(Collectors.toList());

        order.setOrderItems(orderItems);

        // Create Payment
        Payment payment = new Payment();
        payment.setAmount(request.getTotalAmount());
        payment.setPaymentDate(new Date());
        payment.setOrder(order);

        // Set payment method based on request
        switch (request.getPaymentMethod().toLowerCase()) {
            case "cod":
                payment.setMethod(Method.COD);
                payment.setStatus(PaymentStatus.PENDING);
                break;
            case "qr-payment":
                payment.setMethod(Method.E_WALLET);
                payment.setStatus(PaymentStatus.PENDING); // QR payment starts as PENDING until verified
                break;
            case "bank-transfer":
                payment.setMethod(Method.BANK_TRANSFER);
                payment.setStatus(PaymentStatus.PENDING);
                break;
            default:
                payment.setMethod(Method.COD);
                payment.setStatus(PaymentStatus.PENDING);
        }

        order.setPayment(payment);

        // Create Shipment
        Shipment shipment = new Shipment();
        shipment.setStatus(ShipmentStatus.PENDING);
        shipment.setOrder(order);
        order.setShipment(shipment);

        // Save order (cascade will save orderItems, payment, and shipment)
        Order savedOrder = orderRepository.save(order);


        // Map to response using OrderMapper
        return orderMapper.toResponse(savedOrder);
    }

    @Override
    public PaymentCheckResponse checkQRPayment(String orderId) {
        // First, check if order should be cancelled due to timeout
        try {
            Integer orderIdInt = Integer.parseInt(orderId);
            cancelOrderIfTimeout(orderIdInt);
            
            // Check if order was cancelled
            if (isOrderCancelled(orderIdInt)) {
                PaymentCheckResponse response = new PaymentCheckResponse();
                response.setPaid(false);
                response.setOrderId(orderId);
                response.setCancelled(true);
                return response;
            }
        } catch (NumberFormatException e) {
            // Invalid order ID format
        }
        
        // Check actual payment status from database
        PaymentCheckResponse response = new PaymentCheckResponse();
        response.setOrderId(orderId);
        response.setPaid(false);
        response.setCancelled(false);
        
        try {
            Integer orderIdInt = Integer.parseInt(orderId);
            Optional<Order> orderOpt = orderRepository.findById(orderIdInt);
            
            if (orderOpt.isEmpty()) {
                return response;
            }
            
            Order order = orderOpt.get();
            Payment payment = order.getPayment();
            
            if (payment == null) {
                return response;
            }
            
            // Check if payment is PAID
            if (payment.getStatus() == PaymentStatus.PAID) {
                response.setPaid(true);
                response.setAmount(payment.getAmount());
                response.setPaymentDate(payment.getPaymentDate());
            } 
            // Check if payment is FAILED (cancelled due to timeout)
            else if (payment.getStatus() == PaymentStatus.FAILED) {
                response.setCancelled(true);
            }
            
        } catch (NumberFormatException e) {
            // Invalid order ID format
        } catch (Exception e) {
            log.error("Error checking QR payment for order: {}", orderId, e);
        }
        
        return response;
    }
    
    @Override
    @Transactional
    public void cancelOrderIfTimeout(Integer orderId) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            return;
        }
        
        Order order = orderOpt.get();
        Payment payment = order.getPayment();
        
        // Only cancel QR payment orders that are still PENDING
        if (payment == null || payment.getStatus() != PaymentStatus.PENDING) {
            return;
        }
        
        // Check if payment method is QR payment (E_WALLET)
        if (payment.getMethod() != Method.E_WALLET) {
            return;
        }
        
        // Check if order was created more than 30 minutes ago
        Date orderDate = order.getCreatedAt() != null ? order.getCreatedAt() : order.getOrderDate();
        if (orderDate == null) {
            return;
        }
        
        long timeElapsed = System.currentTimeMillis() - orderDate.getTime();
        if (timeElapsed > QR_PAYMENT_TIMEOUT_MS) {
            // Cancel the order by setting payment status to FAILED
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }
    }
    
    @Override
    public boolean isOrderCancelled(Integer orderId) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            return false;
        }
        
        Order order = orderOpt.get();
        Payment payment = order.getPayment();
        
        return payment != null && payment.getStatus() == PaymentStatus.FAILED;
    }
    
    @Override
    public List<OrderResponse> getOrdersByEmail(String email) {
        List<Order> orders = orderRepository.findByGuestEmailOrderByOrderDateDesc(email);
        return orders.stream()
                .map(orderMapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<OrderResponse> getOrdersByUserId(Integer userId) {
        List<Order> orders = orderRepository.findByUserIdOrderByOrderDateDesc(userId);
        return orders.stream()
                .map(orderMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public boolean processSepayWebhook(SepayWebhookRequest webhookRequest) {
        try {
            // Only process "in" transactions (money in = payment received)
            // "out" = money out (withdrawal), we ignore these
            if (webhookRequest.getTransferType() == null || !webhookRequest.getTransferType().equalsIgnoreCase("in")) {
                return false;
            }
            
            // Extract order ID from content
            // Format: "STNP_123", "Thanh toan don hang #123", "LAN_123", or "123"
            Integer orderId = extractOrderIdFromContent(webhookRequest.getContent());
            if (orderId == null) {
                // Try to extract from referenceCode if content fails
                if (webhookRequest.getReferenceCode() != null) {
                    orderId = extractOrderIdFromContent(webhookRequest.getReferenceCode());
                }
                // Also try code field (Sepay auto-recognized payment code)
                if (orderId == null && webhookRequest.getCode() != null) {
                    orderId = extractOrderIdFromContent(webhookRequest.getCode());
                }
                if (orderId == null) {
                    return false;
                }
            }
            
            // Find the order
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) {
                return false;
            }
            
            Order order = orderOpt.get();
            Payment payment = order.getPayment();
            
            if (payment == null) {
                return false;
            }
            
            // Verify amount matches (allow small difference for rounding)
            double amountDifference = Math.abs(payment.getAmount() - webhookRequest.getTransferAmount());
            if (amountDifference > 1000) { // Allow 1000 VND difference
                return false;
            }
            
            // Only update if payment is still pending
            if (payment.getStatus() == PaymentStatus.PENDING) {
                payment.setStatus(PaymentStatus.PAID);
                payment.setPaymentDate(new Date());
                paymentRepository.save(payment);
                return true;
            }
            
            return false;
            
        } catch (Exception e) {
            log.error("Error processing Sepay webhook", e);
            return false;
        }
    }
    
    /**
     * Extract order ID from webhook content
     * Supports formats: "Thanh toan don hang #123", "STNP_123", "LAN_123", "123"
     */
    private Integer extractOrderIdFromContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return null;
        }
        
        try {
            // Try to find order ID pattern: #123, STNP_123, LAN_123, or just number
            String trimmed = content.trim();
            
            // Pattern 1: "Thanh toan don hang #123"
            if (trimmed.contains("#")) {
                String[] parts = trimmed.split("#");
                if (parts.length > 1) {
                    String idStr = parts[1].trim().split("\\s+")[0]; // Get first word after #
                    return Integer.parseInt(idStr);
                }
            }
            
            // Pattern 2: "STNP_123" (new format)
            if (trimmed.contains("STNP_") || trimmed.contains("stnp_")) {
                String[] parts = trimmed.split("_");
                if (parts.length > 1) {
                    String idStr = parts[1].trim().split("\\s+")[0];
                    return Integer.parseInt(idStr);
                }
            }
            
            // Pattern 3: "LAN_123" (legacy format for backward compatibility)
            if (trimmed.contains("LAN_") || trimmed.contains("lan_")) {
                String[] parts = trimmed.split("_");
                if (parts.length > 1) {
                    String idStr = parts[1].trim().split("\\s+")[0];
                    return Integer.parseInt(idStr);
                }
            }
            
            // Pattern 4: Just a number
            String numberOnly = trimmed.replaceAll("[^0-9]", "");
            if (!numberOnly.isEmpty()) {
                return Integer.parseInt(numberOnly);
            }
            
        } catch (NumberFormatException e) {
            // Silent fail - return null
        }
        
        return null;
    }

}

