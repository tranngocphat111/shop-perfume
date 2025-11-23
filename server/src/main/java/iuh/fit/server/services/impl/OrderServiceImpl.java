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
import iuh.fit.server.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements iuh.fit.server.services.OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final OrderMapper orderMapper;

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
                payment.setStatus(PaymentStatus.PAID); // Assume already paid via QR
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
        // In a real implementation, this would check with the bank API
        // For now, we'll return a mock response
        log.info("Checking QR payment for order ID: {}", orderId);
        
        // TODO: Implement actual payment verification with bank API
        // For demo purposes, we'll simulate a successful payment check
        
        PaymentCheckResponse response = new PaymentCheckResponse();
        response.setPaid(false); // Change to true when payment is verified
        response.setOrderId(orderId);
        
        return response;
    }

}

