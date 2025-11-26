package iuh.fit.server.controller;

import iuh.fit.server.dto.response.PaymentCheckResponse;
import iuh.fit.server.services.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
     * Add ?debug=true to get detailed debug information
     */
    @GetMapping("/check-qr")
    public ResponseEntity<?> checkQRPayment(
            @RequestParam String orderId,
            @RequestParam(required = false, defaultValue = "false") boolean debug) {
        log.info("🔍 Checking payment status for orderId: {}, debug: {}", orderId, debug);
        try {
            PaymentCheckResponse response = orderService.checkQRPayment(orderId, debug);
            log.info("✅ Payment check response: paid={}, cancelled={}, orderId={}", 
                    response.getPaid(), response.getCancelled(), response.getOrderId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Error checking QR payment for orderId: {}", orderId, e);
            log.error("Exception details: {}", e.getMessage(), e);
            // Return error response but still with 200 status to avoid breaking frontend
            PaymentCheckResponse errorResponse = new PaymentCheckResponse();
            errorResponse.setOrderId(orderId);
            errorResponse.setPaid(false);
            errorResponse.setCancelled(false);
            if (debug) {
                errorResponse.setErrorMessage("Error: " + e.getMessage());
                errorResponse.setDebugMessage("Exception occurred while checking payment");
            }
            return ResponseEntity.ok(errorResponse);
        }
    }
    
    /**
     * Debug endpoint to get detailed payment information
     * GET /api/payment/debug?orderId=123
     */
    @GetMapping("/debug")
    public ResponseEntity<?> debugPayment(@RequestParam String orderId) {
        PaymentCheckResponse response = orderService.checkQRPayment(orderId, true);
        return ResponseEntity.ok(response);
    }
}

