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
            
            // Always set amount (even if not paid yet) so frontend can display it
            response.setAmount(payment.getAmount());
            
            // Check if payment is PAID
            if (payment.getStatus() == PaymentStatus.PAID) {
                response.setPaid(true);
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
        log.info("=== Processing Sepay Webhook ===");
        try {
            // Only process "in" transactions (money in = payment received)
            // "out" = money out (withdrawal), we ignore these
            if (webhookRequest.getTransferType() == null || !webhookRequest.getTransferType().equalsIgnoreCase("in")) {
                log.info("⏭️ Skipping webhook: Transfer type is not 'in'. Type: {}", webhookRequest.getTransferType());
                return false;
            }
            
            log.info("✅ Transfer type is 'in' - processing payment");
            
            // Extract order ID from content
            // Format: "STNP_123", "STNP123", "Thanh toan don hang #123", "LAN_123", or "123"
            Integer orderId = extractOrderIdFromContent(webhookRequest.getContent());
            log.info("Extracted order ID from content '{}': {}", webhookRequest.getContent(), orderId);
            
            if (orderId == null) {
                // Try to extract from referenceCode if content fails
                if (webhookRequest.getReferenceCode() != null) {
                    log.info("Trying to extract from referenceCode: {}", webhookRequest.getReferenceCode());
                    orderId = extractOrderIdFromContent(webhookRequest.getReferenceCode());
                    log.info("Extracted order ID from referenceCode: {}", orderId);
                }
                // Also try code field (Sepay auto-recognized payment code)
                if (orderId == null && webhookRequest.getCode() != null) {
                    log.info("Trying to extract from code: {}", webhookRequest.getCode());
                    orderId = extractOrderIdFromContent(webhookRequest.getCode());
                    log.info("Extracted order ID from code: {}", orderId);
                }
                // Also try description field (full SMS content)
                if (orderId == null && webhookRequest.getDescription() != null) {
                    log.info("Trying to extract from description: {}", webhookRequest.getDescription());
                    orderId = extractOrderIdFromContent(webhookRequest.getDescription());
                    log.info("Extracted order ID from description: {}", orderId);
                }
                if (orderId == null) {
                    log.error("❌ Could not extract order ID from any field!");
                    log.error("  Content: {}", webhookRequest.getContent());
                    log.error("  ReferenceCode: {}", webhookRequest.getReferenceCode());
                    log.error("  Code: {}", webhookRequest.getCode());
                    log.error("  Description: {}", webhookRequest.getDescription());
                    return false;
                }
            }
            
            log.info("🔍 Looking for order ID: {}", orderId);
            
            // Find the order
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) {
                log.error("❌ Order not found: {}", orderId);
                return false;
            }
            
            Order order = orderOpt.get();
            Payment payment = order.getPayment();
            
            if (payment == null) {
                log.error("❌ Payment not found for order: {}", orderId);
                return false;
            }
            
            log.info("📊 Order found: ID={}, Payment Status={}, Payment Amount={}", 
                    orderId, payment.getStatus(), payment.getAmount());
            log.info("💰 Webhook Amount: {}", webhookRequest.getTransferAmount());
            
            // Verify amount matches (allow small difference for rounding)
            double amountDifference = Math.abs(payment.getAmount() - webhookRequest.getTransferAmount());
            log.info("💵 Amount difference: {} VND", amountDifference);
            
            if (amountDifference > 1000) { // Allow 1000 VND difference
                log.error("❌ Amount mismatch! Order amount: {}, Webhook amount: {}, Difference: {}", 
                        payment.getAmount(), webhookRequest.getTransferAmount(), amountDifference);
                return false;
            }
            
            log.info("✅ Amount matches (difference: {} VND)", amountDifference);
            
            // Only update if payment is still pending
            if (payment.getStatus() == PaymentStatus.PENDING) {
                log.info("✅ Payment is PENDING - updating to PAID");
                payment.setStatus(PaymentStatus.PAID);
                payment.setPaymentDate(new Date());
                paymentRepository.save(payment);
                log.info("🎉 Payment status updated successfully! Order ID: {}", orderId);
                return true;
            } else {
                log.warn("⚠️ Payment status is not PENDING. Current status: {}. Order ID: {}", 
                        payment.getStatus(), orderId);
                return false;
            }
            
        } catch (Exception e) {
            log.error("❌ Error processing Sepay webhook", e);
            log.error("Exception: {}", e.getMessage(), e);
            return false;
        } finally {
            log.info("=== End Processing Sepay Webhook ===");
        }
    }
    
    @Override
    public Integer extractOrderIdFromWebhook(SepayWebhookRequest webhookRequest) {
        if (webhookRequest == null) {
            return null;
        }
        
        // Try to extract from content first
        Integer orderId = extractOrderIdFromContent(webhookRequest.getContent());
        if (orderId != null) {
            return orderId;
        }
        
        // Try referenceCode
        if (webhookRequest.getReferenceCode() != null) {
            orderId = extractOrderIdFromContent(webhookRequest.getReferenceCode());
            if (orderId != null) {
                return orderId;
            }
        }
        
        // Try code field
        if (webhookRequest.getCode() != null) {
            orderId = extractOrderIdFromContent(webhookRequest.getCode());
            if (orderId != null) {
                return orderId;
            }
        }
        
        // Try description field
        if (webhookRequest.getDescription() != null) {
            orderId = extractOrderIdFromContent(webhookRequest.getDescription());
            if (orderId != null) {
                return orderId;
            }
        }
        
        return null;
    }
    
    /**
     * Extract order ID from webhook content
     * Supports formats: 
     * - "STNP_123" or "STNP_ 123" (with underscore)
     * - "STNP123" (without underscore) - Real format from Sepay
     * - "stnp123" (case insensitive)
     * - "LAN_123" (legacy format)
     * - "Thanh toan don hang #123"
     * - "123" (just number)
     */
    private Integer extractOrderIdFromContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return null;
        }
        
        try {
            String trimmed = content.trim();
            String upperTrimmed = trimmed.toUpperCase();
            
            // Pattern 1: "STNP_123" or "STNP_ 123" (with underscore and optional space)
            if (upperTrimmed.contains("STNP_")) {
                int index = upperTrimmed.indexOf("STNP_");
                String afterStnp = trimmed.substring(index + 5).trim(); // Get text after "STNP_"
                // Extract first number sequence
                String numberStr = afterStnp.replaceAll("[^0-9]", "").split("\\s+")[0];
                if (!numberStr.isEmpty()) {
                    return Integer.parseInt(numberStr);
                }
            }
            
            // Pattern 2: "STNP123" (without underscore) - Real format from Sepay
            // Use regex to find "STNP" followed immediately by digits
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("STNP(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Matcher matcher = pattern.matcher(trimmed);
            if (matcher.find()) {
                String numberStr = matcher.group(1);
                if (!numberStr.isEmpty()) {
                    return Integer.parseInt(numberStr);
                }
            }
            
            // Pattern 3: "LAN_123" (legacy format)
            if (upperTrimmed.contains("LAN_")) {
                int index = upperTrimmed.indexOf("LAN_");
                String afterLan = trimmed.substring(index + 4).trim();
                String numberStr = afterLan.replaceAll("[^0-9]", "").split("\\s+")[0];
                if (!numberStr.isEmpty()) {
                    return Integer.parseInt(numberStr);
                }
            }
            
            // Pattern 4: "Thanh toan don hang #123"
            if (trimmed.contains("#")) {
                String[] parts = trimmed.split("#");
                if (parts.length > 1) {
                    String idStr = parts[1].trim().split("\\s+")[0];
                    return Integer.parseInt(idStr);
                }
            }
            
            // Pattern 5: Just extract all numbers (fallback)
            String numberOnly = trimmed.replaceAll("[^0-9]", "");
            if (!numberOnly.isEmpty() && numberOnly.length() <= 10) { // Reasonable order ID length
                return Integer.parseInt(numberOnly);
            }
            
        } catch (NumberFormatException | StringIndexOutOfBoundsException e) {
            // Silent fail - return null
        }
        
        return null;
    }

}

