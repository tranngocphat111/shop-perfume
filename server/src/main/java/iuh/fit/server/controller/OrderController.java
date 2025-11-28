package iuh.fit.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import iuh.fit.server.dto.request.OrderCreateRequest;
import iuh.fit.server.dto.response.OrderResponse;
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

import java.util.List;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@Slf4j
// CORS is configured globally in WebConfig.java
// Note: context-path=/api, so full path is /api/orders/...
public class OrderController {

    private final OrderService orderService;

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
     * Get orders by authenticated user or email
     * Supports both authenticated users and guest users searching by email
     * Public endpoint - Guest có thể tìm đơn hàng bằng email
     */
    @GetMapping("/my-orders")
    @Operation(summary = "Get orders by email", description = "Get orders by authenticated user or guest email (public)")
    public ResponseEntity<?> getMyOrders(
            @RequestParam(required = false) String email,
            Authentication authentication) {
        try {
            List<OrderResponse> orders;
            String searchEmail = null;
            
            // If email parameter is provided, use it (for guest search or authenticated user searching different email)
            if (email != null && !email.isEmpty()) {
                searchEmail = email;
            } else if (authentication != null && authentication.isAuthenticated()) {
                // If user is authenticated and no email param, use authenticated user's email
                UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                searchEmail = userDetails.getUsername();
            } else {
                // No email and not authenticated
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse("Vui lòng nhập email để tìm kiếm đơn hàng"));
            }
            
            // Get orders by email
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

