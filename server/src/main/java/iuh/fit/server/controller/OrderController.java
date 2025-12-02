package iuh.fit.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import iuh.fit.server.dto.request.OrderCreateRequest;
import iuh.fit.server.dto.response.OrderResponse;
import iuh.fit.server.dto.response.RevenueStatsResponse;
import iuh.fit.server.services.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import iuh.fit.server.repository.UserRepository;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@Slf4j
// CORS is configured globally in WebConfig.java
// Note: context-path=/api, so full path is /api/orders/...
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get total size of orders", description = "Retrieve total size of orders from database")

    public ResponseEntity<Long> getSizeOfPendingOrders() {
        return ResponseEntity.ok(orderService.getSizeOfPendingOrders());
    }

    /**
     * Get total size of orders
     * Chỉ ADMIN mới có quyền xem thống kê
     */
    @GetMapping("/size")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get total size of orders", description = "Retrieve total size of orders from database")
    public ResponseEntity<Long> getTotalSize() {
        log.info("REST request to get total size of orders");
        Long totalSize = orderService.getTotalSize();
        return ResponseEntity.ok(totalSize);
    }

    /**
     * Get total revenue
     * Chỉ ADMIN mới có quyền xem thống kê
     */
    @GetMapping("/totalRevenue")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get total revenue", description = "Retrieve total revenue from database")
    public ResponseEntity<Double> getTotalRevenue() {
        log.info("REST request to total revenue");
        double totalSize = orderService.getTotalRevenue();
        return ResponseEntity.ok(totalSize);
    }

    /**
     * Get revenue statistics by period (monthly/quarterly/yearly)
     * Chỉ ADMIN mới có quyền xem thống kê
     */
    @GetMapping("/stats/revenue")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get revenue statistics", description = "Retrieve revenue statistics by period (monthly/quarterly/yearly)")
    public ResponseEntity<RevenueStatsResponse> getRevenueStats(
            @RequestParam String period,
            @RequestParam(required = false) Integer year) {
        log.info("REST request to get revenue stats - period: {}, year: {}", period, year);
        iuh.fit.server.dto.response.RevenueStatsResponse stats = orderService.getRevenueStatsByPeriod(period, year);
        return ResponseEntity.ok(stats);
    }

    /**
     * Create a new order
     * Public endpoint - Guest có thể đặt hàng
     */
    @PostMapping("/create")
    @Operation(summary = "Create order", description = "Create a new order (guest checkout supported)")
    public ResponseEntity<?> createOrder(@Valid @RequestBody OrderCreateRequest request) {
        try {
            log.info("Received order creation request for: {}", request.getFullName());
            OrderResponse response = orderService.createOrder(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Error creating order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Có lỗi xảy ra khi tạo đơn hàng: " + e.getMessage()));
        }
    }

    
    /**
     * Cancel order if timeout (for QR payment orders)
     * Public endpoint - Guest có thể hủy đơn hàng của mình
     */
    @PostMapping("/{orderId}/cancel-timeout")
    @Operation(summary = "Cancel order if timeout", description = "Cancel order if payment timeout (public for guest checkout)")
    public ResponseEntity<?> cancelOrderIfTimeout(@PathVariable Integer orderId) {
        try {
            log.info("Checking timeout for order: {}", orderId);
            orderService.cancelOrderIfTimeout(orderId);
            boolean isCancelled = orderService.isOrderCancelled(orderId);
            return ResponseEntity.ok(new CancelResponse(isCancelled, 
                    isCancelled ? "Đơn hàng đã bị hủy do quá thời gian thanh toán" : "Đơn hàng vẫn còn hiệu lực"));
        } catch (Exception e) {
            log.error("Error cancelling order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Có lỗi xảy ra khi hủy đơn hàng: " + e.getMessage()));
        }
    }
    
    /**
     * Cancel order (for pending orders)
     * User can cancel their own pending orders
     */
    @PostMapping("/{orderId}/cancel")
    @Operation(summary = "Cancel order", description = "Cancel a pending order")
    public ResponseEntity<?> cancelOrder(@PathVariable Integer orderId) {
        try {
            log.info("Cancelling order: {}", orderId);
            orderService.cancelOrder(orderId);
            return ResponseEntity.ok(new CancelResponse(true, "Đơn hàng đã được hủy thành công"));
        } catch (RuntimeException e) {
            log.error("Error cancelling order: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error cancelling order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Có lỗi xảy ra khi hủy đơn hàng: " + e.getMessage()));
        }
    }
    
    /**
     * Get orders by authenticated user or email
     * Supports both authenticated users and guest users searching by email
     * Public endpoint - Guest có thể tìm đơn hàng bằng email
     */
    @GetMapping("/my-orders")
    @Operation(summary = "Get orders by user ID or email", description = "Get orders by authenticated user ID or guest email (public)")
    public ResponseEntity<?> getMyOrders(
            @RequestParam(required = false) String email,
            Authentication authentication) {
        try {
            List<OrderResponse> orders;
            
            // Nếu user đã đăng nhập, dùng userId
            log.info("🔵 [getMyOrders] Authentication check: authentication={}, isAuthenticated={}", 
                    authentication != null ? "present" : "null",
                    authentication != null ? authentication.isAuthenticated() : false);
            
            if (authentication != null && authentication.isAuthenticated() && 
                !authentication.getPrincipal().equals("anonymousUser")) {
                try {
                    UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                    String userEmail = userDetails.getUsername();
                    log.info("🔵 [getMyOrders] User email from token: {}", userEmail);
                    
                    // Tìm user từ email để lấy userId
                    Optional<iuh.fit.server.model.entity.User> userOpt = userRepository.findByEmail(userEmail);
                    if (userOpt.isPresent()) {
                        Integer userId = userOpt.get().getUserId();
                        log.info("✅ [getMyOrders] Getting orders by userId: {} (email: {})", userId, userEmail);
                        orders = orderService.getOrdersByUserId(userId);
                        log.info("✅ [getMyOrders] Found {} orders for userId: {}", orders.size(), userId);
                        // Luôn trả về danh sách (có thể rỗng), không phải lỗi
                        return ResponseEntity.ok(orders);
                    } else {
                        log.warn("⚠️ [getMyOrders] User not found in database for email: {}", userEmail);
                        // Trả về empty list thay vì lỗi
                        return ResponseEntity.ok(new java.util.ArrayList<>());
                    }
                } catch (Exception e) {
                    log.error("❌ [getMyOrders] Error getting orders by userId: {}", e.getMessage(), e);
                    // Fallback về email search
                }
            } else {
                log.info("ℹ️ [getMyOrders] No authentication or anonymous user - will use email search");
            }
            
            // Nếu có email parameter hoặc không đăng nhập, dùng email
            String searchEmail = null;
            if (email != null && !email.isEmpty()) {
                searchEmail = email;
            } else if (authentication != null && authentication.isAuthenticated()) {
                UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                searchEmail = userDetails.getUsername();
            } else {
                // Guest không có email param → trả về empty list
                return ResponseEntity.ok(new java.util.ArrayList<>());
            }
            
            // Get orders by email (for guest or fallback)
            log.info("Getting orders by email: {}", searchEmail);
            orders = orderService.getOrdersByEmail(searchEmail);
            
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            log.error("Error getting orders", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Có lỗi xảy ra khi lấy danh sách đơn hàng: " + e.getMessage()));
        }
    }

    // Error Response DTO
    private record ErrorResponse(String message) {}
    
    // Cancel Response DTO
    private record CancelResponse(boolean cancelled, String message) {}
}

