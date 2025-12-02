package iuh.fit.server.services.impl;

import iuh.fit.server.dto.request.OrderCreateRequest;
import iuh.fit.server.dto.request.SepayWebhookRequest;
import iuh.fit.server.dto.response.OrderResponse;
import iuh.fit.server.dto.response.PaymentCheckResponse;
import iuh.fit.server.dto.response.RevenueStatsResponse;
import iuh.fit.server.mapper.OrderMapper;
import iuh.fit.server.model.entity.*;
import iuh.fit.server.model.enums.Method;
import iuh.fit.server.model.enums.PaymentStatus;
import iuh.fit.server.model.enums.ShipmentStatus;
import iuh.fit.server.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.ArrayList;
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
    private final UserRepository userRepository;
    private final OrderMapper orderMapper;
    private final CouponRepository couponRepository;
    private final InventoryRepository inventoryRepository;
    
    // Timeout for QR payment: 30 minutes in milliseconds
    private static final long QR_PAYMENT_TIMEOUT_MS = 30 * 60 * 1000;
    private final InventoryRepository inventoryRepository;

    /**
     * Helper method to restore inventory for an order
     * Only restore if payment status is PENDING (to avoid double restore)
     */
    private void restoreInventoryForOrder(Order order) {
        Payment payment = order.getPayment();
        
        // Only restore if payment is still PENDING
        if (payment == null || payment.getStatus() != PaymentStatus.PENDING) {
            log.info("⚠️ [restoreInventory] Order {} payment status is {}, skipping restore", 
                    order.getOrderId(), payment != null ? payment.getStatus() : "null");
            return;
        }
        
        // Restore inventory for all order items
        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
            for (OrderItem orderItem : order.getOrderItems()) {
                iuh.fit.server.model.entity.Inventory inventory = 
                        inventoryRepository.findByProductId(orderItem.getProduct().getProductId());
                if (inventory != null) {
                    int restoredQuantity = inventory.getQuantity() + orderItem.getQuantity();
                    inventory.setQuantity(restoredQuantity);
                    inventoryRepository.save(inventory);
                    log.info("✅ [restoreInventory] Restored {} units of product {} (new quantity: {})", 
                            orderItem.getQuantity(), orderItem.getProduct().getProductId(), restoredQuantity);
                } else {
                    log.warn("⚠️ [restoreInventory] Inventory not found for product {}", 
                            orderItem.getProduct().getProductId());
                }
            }
        }
    }


    @Override
    public Long getSizeOfPendingOrders() {
        return orderRepository.getSizeOfOrdersHaveStatus(PaymentStatus.PENDING);
    }

    @Override
    public Long getTotalSize() {
        Long totalSize = orderRepository.count();
        log.info("Get total size: {}", totalSize);
        return totalSize;
    }

    @Override
    public double getTotalRevenue() {
        return orderRepository.getTotalRevenue(PaymentStatus.PAID);
    };

    @Override
    public RevenueStatsResponse getRevenueStatsByPeriod(String period, Integer year) {
        List<Object[]> results;
        List<String> labels = new ArrayList<>();
        List<Double> revenues = new ArrayList<>();
        List<Long> orderCounts = new ArrayList<>();
        
        switch (period.toLowerCase()) {
            case "monthly":
                if (year == null) {
                    year = java.time.Year.now().getValue();
                }
                results = orderRepository.getMonthlyRevenueStats(year, PaymentStatus.PAID);
                
                // Initialize all 12 months with zero values
                for (int i = 1; i <= 12; i++) {
                    labels.add(getMonthName(i));
                    revenues.add(0.0);
                    orderCounts.add(0L);
                }
                
                // Fill in actual data
                for (Object[] result : results) {
                    int month = (Integer) result[0];
                    double revenue = ((Number) result[1]).doubleValue();
                    long orderCount = ((Number) result[2]).longValue();
                    
                    revenues.set(month - 1, revenue);
                    orderCounts.set(month - 1, orderCount);
                }
                break;
                
            case "quarterly":
                if (year == null) {
                    year = Year.now().getValue();
                }
                results = orderRepository.getQuarterlyRevenueStats(year, PaymentStatus.PAID);
                
                // Initialize all 4 quarters with zero values
                for (int i = 1; i <= 4; i++) {
                    labels.add("Q" + i);
                    revenues.add(0.0);
                    orderCounts.add(0L);
                }
                
                // Fill in actual data
                for (Object[] result : results) {
                    int quarter = (Integer) result[0];
                    double revenue = ((Number) result[1]).doubleValue();
                    long orderCount = ((Number) result[2]).longValue();
                    
                    revenues.set(quarter - 1, revenue);
                    orderCounts.set(quarter - 1, orderCount);
                }
                break;
                
            case "yearly":
                results = orderRepository.getYearlyRevenueStats(PaymentStatus.PAID);
                
                for (Object[] result : results) {
                    int resultYear = (Integer) result[0];
                    double revenue = ((Number) result[1]).doubleValue();
                    long orderCount = ((Number) result[2]).longValue();
                    
                    labels.add(String.valueOf(resultYear));
                    revenues.add(revenue);
                    orderCounts.add(orderCount);
                }
                break;
                
            default:
                throw new IllegalArgumentException("Invalid period: " + period + ". Use 'monthly', 'quarterly', or 'yearly'");
        }
        
        return RevenueStatsResponse.builder()
                .labels(labels)
                .revenues(revenues)
                .orderCounts(orderCounts)
                .build();
    }
    
    private String getMonthName(int month) {
        String[] monthNames = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        return monthNames[month - 1];
    }

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
        
        // Lấy userId từ SecurityContext nếu user đã đăng nhập
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            log.info("🔍 [createOrder] Authentication check: authentication={}, isAuthenticated={}", 
                    authentication != null ? "present" : "null",
                    authentication != null ? authentication.isAuthenticated() : false);
            
            if (authentication != null && authentication.isAuthenticated() && 
                !authentication.getPrincipal().equals("anonymousUser")) {
                Object principal = authentication.getPrincipal();
                log.info("🔍 [createOrder] Principal type: {}", principal.getClass().getName());
                
                if (principal instanceof UserDetails) {
                    String email = ((UserDetails) principal).getUsername();
                    log.info("🔍 [createOrder] User email from token: {}", email);
                    
                    Optional<User> userOpt = userRepository.findByEmail(email);
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        order.setUser(user);
                        log.info("✅ [createOrder] Set user_id={} for order (authenticated user: {})", 
                                user.getUserId(), email);
                    } else {
                        log.warn("⚠️ [createOrder] User not found in database for email: {}", email);
                    }
                } else {
                    log.warn("⚠️ [createOrder] Principal is not UserDetails: {}", principal.getClass().getName());
                }
            } else {
                log.info("ℹ️ [createOrder] No authentication or anonymous user - creating guest order");
            }
        } catch (Exception e) {
            log.error("❌ [createOrder] Error setting user for order: {}", e.getMessage(), e);
            // Continue as guest order if cannot get user
        }

        // Validate stock và trừ inventory cho TẤT CẢ đơn hàng (không phân biệt loại thanh toán)
        for (iuh.fit.server.dto.request.OrderItemRequest cartItem : request.getCartItems()) {
            Product product = productRepository.findById(cartItem.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + cartItem.getProductId()));
            
            iuh.fit.server.model.entity.Inventory inventory = inventoryRepository.findByProductId(cartItem.getProductId());
            if (inventory == null) {
                throw new RuntimeException("Inventory not found for product: " + cartItem.getProductId());
            }
            
            // Validate stock - check quantity trong inventory
            if (inventory.getQuantity() < cartItem.getQuantity()) {
                String errorMsg = String.format(
                    "Sản phẩm '%s' không đủ hàng. Số lượng trong kho: %d, yêu cầu: %d", 
                    product.getName(), inventory.getQuantity(), cartItem.getQuantity()
                );
                log.error("❌ [createOrder] Stock validation failed: {}", errorMsg);
                throw new RuntimeException(errorMsg);
            }
            
            // Trừ số lượng từ inventory ngay lập tức (cho tất cả loại thanh toán)
            int newQuantity = inventory.getQuantity() - cartItem.getQuantity();
            inventory.setQuantity(newQuantity);
            inventoryRepository.save(inventory);
            
            log.info("✅ [createOrder] Deducted {} units of product {} (new quantity: {})", 
                    cartItem.getQuantity(), cartItem.getProductId(), newQuantity);
        }

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
            case "qr_code":
                payment.setMethod(Method.QR_CODE);
                payment.setStatus(PaymentStatus.PENDING); // QR payment starts as PENDING until verified
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

        // Xử lý coupon và điểm tích lũy nếu user đã đăng nhập
        User orderUser = order.getUser();
        if (orderUser != null && request.getCouponId() != null) {
            try {
                log.info("Processing coupon: couponId={}, userId={}", 
                        request.getCouponId(), orderUser.getUserId());
                
                Optional<Coupon> couponOpt = couponRepository.findById(request.getCouponId());
                
                if (couponOpt.isPresent()) {
                    Coupon coupon = couponOpt.get();
                    Date currentDate = new Date();
                    
                    // Validate coupon
                    if (!coupon.isActive()) {
                        log.warn("⚠️ Coupon is not active: {}", request.getCouponId());
                    } else if (currentDate.before(coupon.getStartDate()) || currentDate.after(coupon.getEndDate())) {
                        log.warn("⚠️ Coupon is expired or not yet valid: {}", request.getCouponId());
                    } else if (orderUser.getLoyaltyPoints() < coupon.getRequiredPoints()) {
                        log.warn("⚠️ User has {} points, but coupon requires {} points", 
                                orderUser.getLoyaltyPoints(), coupon.getRequiredPoints());
                    } else {
                        // Apply coupon discount
                        double discountAmount = (request.getTotalAmount() * coupon.getDiscountPercent()) / 100.0;
                        double finalAmount = request.getTotalAmount() - discountAmount;
                        order.setTotalAmount(finalAmount);
                        
                        // Set coupon reference
                        order.setCoupon(coupon);
                        
                        // Deduct loyalty points
                        int newPoints = orderUser.getLoyaltyPoints() - coupon.getRequiredPoints();
                        orderUser.setLoyaltyPoints(newPoints);
                        userRepository.save(orderUser);
                        
                        log.info("✅ Coupon applied: discount={}, points deducted={}, remaining points={}", 
                                discountAmount, coupon.getRequiredPoints(), newPoints);
                    }
                } else {
                    log.warn("⚠️ Coupon not found: {}", request.getCouponId());
                }
            } catch (Exception e) {
                log.error("❌ Error processing coupon", e);
                // Don't fail order creation if coupon processing fails
            }
        }

        // Save order first (cascade will save orderItems, payment, and shipment)
        Order savedOrder = orderRepository.save(order);


        // Map to response using OrderMapper
        return orderMapper.toResponse(savedOrder);
    }

    @Override
    public PaymentCheckResponse checkQRPayment(String orderId) {
        return checkQRPayment(orderId, false);
    }
    
    @Override
    public PaymentCheckResponse checkQRPayment(String orderId, boolean debug) {
        log.info("🔍 [checkQRPayment] Checking payment for orderId: {}, debug: {}", orderId, debug);
        
        // Check actual payment status from database
        PaymentCheckResponse response = new PaymentCheckResponse();
        response.setOrderId(orderId);
        response.setPaid(false);
        response.setCancelled(false);
        
        if (debug) {
            response.setDebugMessage("Debug mode enabled");
        }
        
        try {
            Integer orderIdInt = Integer.parseInt(orderId);
            log.info("🔍 [checkQRPayment] Parsed orderId to integer: {}", orderIdInt);
            
            // First, check if order should be cancelled due to timeout
            cancelOrderIfTimeout(orderIdInt);
            
            // Check if order was cancelled
            if (isOrderCancelled(orderIdInt)) {
                log.warn("⚠️ [checkQRPayment] Order {} is cancelled", orderIdInt);
                response.setCancelled(true);
                if (debug) {
                    response.setDebugMessage("Order is cancelled due to timeout");
                }
                return response;
            }
            
            Optional<Order> orderOpt = orderRepository.findById(orderIdInt);
            
            if (orderOpt.isEmpty()) {
                log.warn("⚠️ [checkQRPayment] Order {} not found", orderIdInt);
                if (debug) {
                    response.setOrderExists(false);
                    response.setDebugMessage("Order not found in database");
                }
                return response;
            }
            
            if (debug) {
                response.setOrderExists(true);
            }
            
            Order order = orderOpt.get();
            Payment payment = order.getPayment();
            
            if (payment == null) {
                log.warn("⚠️ [checkQRPayment] Payment not found for order {}", orderIdInt);
                if (debug) {
                    response.setPaymentExists(false);
                    response.setDebugMessage("Payment not found for this order");
                }
                return response;
            }
            
            if (debug) {
                response.setPaymentExists(true);
                response.setPaymentStatus(payment.getStatus().toString());
            }
            
            log.info("📊 [checkQRPayment] Order {} found. Payment status: {}, Amount: {}", 
                    orderIdInt, payment.getStatus(), payment.getAmount());
            
            // Always set amount (even if not paid yet) so frontend can display it
            response.setAmount(payment.getAmount());
            
            // Check if payment is PAID
            if (payment.getStatus() == PaymentStatus.PAID) {
                log.info("✅ [checkQRPayment] Payment is PAID for order {}", orderIdInt);
                response.setPaid(true);
                response.setPaymentDate(payment.getPaymentDate());
                if (debug) {
                    response.setDebugMessage("Payment is PAID");
                }
            } 
            // Check if payment is FAILED (cancelled due to timeout)
            else if (payment.getStatus() == PaymentStatus.FAILED) {
                log.warn("⚠️ [checkQRPayment] Payment is FAILED for order {}", orderIdInt);
                response.setCancelled(true);
                if (debug) {
                    response.setDebugMessage("Payment is FAILED (cancelled due to timeout)");
                }
            } else {
                log.info("⏳ [checkQRPayment] Payment is {} for order {}", payment.getStatus(), orderIdInt);
                if (debug) {
                    response.setDebugMessage("Payment status: " + payment.getStatus() + " (waiting for webhook)");
                }
            }
            
        } catch (NumberFormatException e) {
            log.error("❌ [checkQRPayment] Invalid order ID format: {}", orderId);
            if (debug) {
                response.setErrorMessage("Invalid order ID format: " + orderId);
                response.setDebugMessage("Failed to parse orderId as integer");
            }
        } catch (Exception e) {
            log.error("❌ [checkQRPayment] Error checking QR payment for order: {}", orderId, e);
            log.error("Exception: {}", e.getMessage(), e);
            if (debug) {
                response.setErrorMessage("Exception: " + e.getMessage());
                response.setDebugMessage("Error occurred while checking payment");
            }
        }
        
        log.info("📤 [checkQRPayment] Returning response: paid={}, cancelled={}, orderId={}", 
                response.getPaid(), response.getCancelled(), response.getOrderId());
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
        
        // Check if payment method is QR payment (QR_CODE)
        if (payment.getMethod() != Method.QR_CODE) {
            return;
        }
        
        // Check if order was created more than 30 minutes ago
        Date orderDate = order.getCreatedAt() != null ? order.getCreatedAt() : order.getOrderDate();
        if (orderDate == null) {
            return;
        }
        
        long timeElapsed = System.currentTimeMillis() - orderDate.getTime();
        if (timeElapsed > QR_PAYMENT_TIMEOUT_MS) {
            // Restore inventory và cancel order
            restoreInventoryForOrder(order);
            
            // Cancel the order by setting payment status to FAILED
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            
            log.info("✅ [cancelOrderIfTimeout] Order {} cancelled due to timeout, inventory restored", orderId);
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
    @Transactional
    public void cancelOrder(Integer orderId) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            throw new RuntimeException("Không tìm thấy đơn hàng với ID: " + orderId);
        }
        
        Order order = orderOpt.get();
        Payment payment = order.getPayment();
        
        if (payment == null) {
            throw new RuntimeException("Đơn hàng không có thông tin thanh toán");
        }
        
        // Chỉ cho phép hủy đơn hàng chưa thanh toán
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new RuntimeException("Chỉ có thể hủy đơn hàng đang chờ thanh toán");
        }
        
        // Restore inventory cho tất cả loại thanh toán (vì đã trừ inventory khi tạo order)
        restoreInventoryForOrder(order);
        
        // Hủy đơn hàng bằng cách đặt trạng thái thanh toán thành FAILED
        payment.setStatus(PaymentStatus.FAILED);
        paymentRepository.save(payment);
        
        log.info("✅ Order {} has been cancelled, inventory restored", orderId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByEmail(String email) {
        List<Order> orders = orderRepository.findByGuestEmailOrderByOrderDateDesc(email);
        return orders.stream()
                .map(orderMapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
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
                
                // Tích điểm cho user khi đơn hàng được thanh toán
                // Quy tắc: 1 điểm = 10,000 VND
                if (order.getUser() != null) {
                    try {
                        User user = order.getUser();
                        int pointsToAdd = (int) Math.floor(order.getTotalAmount() / 10000.0);
                        int newPoints = user.getLoyaltyPoints() + pointsToAdd;
                        user.setLoyaltyPoints(newPoints);
                        userRepository.save(user);
                        
                        log.info("🎁 Added {} points to user {} (total: {} points) after order {}", 
                                pointsToAdd, user.getUserId(), newPoints, orderId);
                    } catch (Exception e) {
                        log.error("❌ Error adding loyalty points", e);
                        // Don't fail the payment if points adding fails
                    }
                }
                
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

