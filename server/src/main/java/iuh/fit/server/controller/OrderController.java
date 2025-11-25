package iuh.fit.server.controller;

import iuh.fit.server.dto.request.OrderCreateRequest;
import iuh.fit.server.dto.response.OrderResponse;
import iuh.fit.server.dto.response.PaymentCheckResponse;
import iuh.fit.server.services.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
// CORS is configured globally in WebConfig.java
public class OrderController {

    private final OrderService orderService;

    /**
     * Create a new order
     */
    @PostMapping("/orders/create")
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
     * Check QR payment status
     */
    @GetMapping("/payment/check-qr")
    public ResponseEntity<?> checkQRPayment(@RequestParam String orderId) {
        try {
            log.info("Checking QR payment for order: {}", orderId);
            PaymentCheckResponse response = orderService.checkQRPayment(orderId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error checking QR payment", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Có lỗi xảy ra khi kiểm tra thanh toán: " + e.getMessage()));
        }
    }

    // Error Response DTO
    private record ErrorResponse(String message) {}
}

