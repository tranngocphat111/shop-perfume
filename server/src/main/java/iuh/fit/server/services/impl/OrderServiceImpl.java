package iuh.fit.server.services.impl;

import iuh.fit.server.dto.request.OrderCreateRequest;
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
        log.info("Creating order for guest: {}, phone: {}", request.getFullName(), request.getPhone());

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

        log.info("Order created successfully with ID: {}", savedOrder.getOrderId());

        // Map to response using OrderMapper
        return orderMapper.toResponse(savedOrder);
    }

    @Override
    public PaymentCheckResponse checkQRPayment(String orderId) {
        log.info("Checking QR payment for order ID: {}", orderId);
        
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
            log.error("Invalid order ID format: {}", orderId);
        }
        
        // In a real implementation, this would check with the bank API
        // For now, we'll return a mock response
        // TODO: Implement actual payment verification with bank API
        
        PaymentCheckResponse response = new PaymentCheckResponse();
        response.setPaid(false); // Change to true when payment is verified
        response.setOrderId(orderId);
        
        return response;
    }
    
    @Override
    @Transactional
    public void cancelOrderIfTimeout(Integer orderId) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            log.warn("Order not found: {}", orderId);
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
            log.warn("Order {} has no creation date", orderId);
            return;
        }
        
        long timeElapsed = System.currentTimeMillis() - orderDate.getTime();
        if (timeElapsed > QR_PAYMENT_TIMEOUT_MS) {
            // Cancel the order by setting payment status to FAILED
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            log.info("Order {} cancelled due to QR payment timeout ({} minutes elapsed)", 
                    orderId, TimeUnit.MILLISECONDS.toMinutes(timeElapsed));
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
        log.info("Getting orders for email: {}", email);
        List<Order> orders = orderRepository.findByGuestEmailOrderByOrderDateDesc(email);
        return orders.stream()
                .map(orderMapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<OrderResponse> getOrdersByUserId(Integer userId) {
        log.info("Getting orders for user ID: {}", userId);
        List<Order> orders = orderRepository.findByUserIdOrderByOrderDateDesc(userId);
        return orders.stream()
                .map(orderMapper::toResponse)
                .collect(Collectors.toList());
    }

}

