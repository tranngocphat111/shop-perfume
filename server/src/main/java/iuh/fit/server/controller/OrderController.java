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
            
            log.info("🔵 [getMyOrders] Authentication check: authentication={}, isAuthenticated={}, email param={}", 
                    authentication != null ? "present" : "null",
                    authentication != null ? authentication.isAuthenticated() : false,
                    email);
            
            // ƯU TIÊN: Nếu có email parameter, luôn search theo email (cho cả authenticated và guest)
            if (email != null && !email.trim().isEmpty()) {
                log.info("✅ [getMyOrders] Email parameter provided, searching by email: {}", email);
                orders = orderService.getOrdersByEmail(email.trim());
                log.info("✅ [getMyOrders] Found {} orders for email: {}", orders.size(), email);
                return ResponseEntity.ok(orders);
            }
            
            // Nếu không có email parameter và user đã đăng nhập, dùng userId
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
                    // Trả về empty list thay vì lỗi
                    return ResponseEntity.ok(new java.util.ArrayList<>());
                }
            } else {
                // Không có email parameter và không đăng nhập → trả về empty list
                log.info("ℹ️ [getMyOrders] No email parameter and not authenticated - returning empty list");
                return ResponseEntity.ok(new java.util.ArrayList<>());
            }
        } catch (Exception e) {
            log.error("Error getting orders", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Có lỗi xảy ra khi lấy danh sách đơn hàng: " + e.getMessage()));
        }
    }
    
    /**
     * GET /api/orders/{orderId} - Get order by ID (Admin only)
     */
    @GetMapping("/{orderId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get order by ID", description = "Retrieve order details by ID (Admin only)")
    public ResponseEntity<?> getOrderById(@PathVariable Integer orderId) {
        try {
            log.info("REST request to get order by ID: {}", orderId);
            OrderResponse order = orderService.getOrderById(orderId);
            return ResponseEntity.ok(order);
        } catch (RuntimeException e) {
            log.error("Error getting order by ID: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error getting order by ID", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Có lỗi xảy ra khi lấy thông tin đơn hàng: " + e.getMessage()));
        }
    }

    /**
     * GET /api/orders/page - Get orders with pagination and search (Admin only)
     */
    @GetMapping({"/page", "/paginated"})
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get orders with pagination", description = "Retrieve orders with pagination and search (Admin only)")
    public ResponseEntity<org.springframework.data.domain.Page<OrderResponse>> getOrdersPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) String search) {
        log.info("REST request to get orders with pagination - page: {}, size: {}, search: {}", page, size, search);
        
        // Parse sort parameter
        String fieldName = "orderId";
        org.springframework.data.domain.Sort.Direction sortDirection = org.springframework.data.domain.Sort.Direction.DESC;
        
        if (sort != null && !sort.isEmpty()) {
            String[] sortParams = sort.split(",");
            fieldName = sortParams[0];
            if (sortParams.length > 1) {
                sortDirection = sortParams[1].equalsIgnoreCase("desc") 
                        ? org.springframework.data.domain.Sort.Direction.DESC 
                        : org.springframework.data.domain.Sort.Direction.ASC;
            }
        } else if (sortBy != null && !sortBy.isEmpty()) {
            fieldName = sortBy;
            if (direction != null && direction.equalsIgnoreCase("DESC")) {
                sortDirection = org.springframework.data.domain.Sort.Direction.DESC;
            } else if (direction != null && direction.equalsIgnoreCase("ASC")) {
                sortDirection = org.springframework.data.domain.Sort.Direction.ASC;
            }
        }
        
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                page, size, org.springframework.data.domain.Sort.by(sortDirection, fieldName));
        
        org.springframework.data.domain.Page<OrderResponse> orders = orderService.getOrdersPage(pageable, search);
        
        return ResponseEntity.ok(orders);
    }

    /**
     * Update shipment status (Admin only)
     */
    @PutMapping("/{orderId}/shipment-status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update shipment status", description = "Update shipment status for an order (Admin only)")
    public ResponseEntity<?> updateShipmentStatus(
            @PathVariable Integer orderId,
            @RequestParam String status) {
        try {
            log.info("REST request to update shipment status for order: {} to status: {}", orderId, status);
            orderService.updateShipmentStatus(orderId, status);
            return ResponseEntity.ok(new UpdateResponse(true, "Shipment status updated successfully"));
        } catch (RuntimeException e) {
            log.error("Error updating shipment status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating shipment status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Có lỗi xảy ra khi cập nhật trạng thái giao hàng: " + e.getMessage()));
        }
    }

    /**
     * Update payment status (Admin only)
     */
    @PutMapping("/{orderId}/payment-status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update payment status", description = "Update payment status for an order (Admin only)")
    public ResponseEntity<?> updatePaymentStatus(
            @PathVariable Integer orderId,
            @RequestParam String status) {
        try {
            log.info("REST request to update payment status for order: {} to status: {}", orderId, status);
            orderService.updatePaymentStatus(orderId, status);
            return ResponseEntity.ok(new UpdateResponse(true, "Payment status updated successfully"));
        } catch (RuntimeException e) {
            log.error("Error updating payment status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating payment status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Có lỗi xảy ra khi cập nhật trạng thái thanh toán: " + e.getMessage()));
        }
    }

    // Error Response DTO
    private record ErrorResponse(String message) {}
    
    // Cancel Response DTO
    private record CancelResponse(boolean cancelled, String message) {}
    
    // Update Response DTO
    private record UpdateResponse(boolean success, String message) {}
}

