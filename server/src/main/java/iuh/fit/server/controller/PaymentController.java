package iuh.fit.server.controller;

import iuh.fit.server.dto.response.PaymentCheckResponse;
import iuh.fit.server.services.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
@Slf4j
// CORS is configured globally in WebConfig.java
// Note: context-path=/api, so full path is /api/payment/...
public class PaymentController {

    private final OrderService orderService;

    /**
     * Check QR payment status
     */
    @GetMapping("/check-qr")
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

