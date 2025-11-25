package iuh.fit.server.controller;

import iuh.fit.server.dto.request.SepayWebhookRequest;
import iuh.fit.server.services.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

/**
 * Controller to handle Sepay webhook callbacks
 * Endpoint: /api/webhooks/sepay
 */
@RestController
@RequestMapping("/webhooks")
@RequiredArgsConstructor
@Slf4j
public class SepayWebhookController {

    private final OrderService orderService;

    @Value("${sepay.webhook.api-key:PASS_KEY}")
    private String sepayApiKey;

    /**
     * Handle Sepay webhook callback for payment verification
     * This endpoint receives notifications when a payment is received
     * 
     * Sepay sends webhook with header: "Authorization": "Apikey YOUR_API_KEY"
     */
    @PostMapping("/sepay")
    public ResponseEntity<?> handleSepayWebhook(
            @RequestBody SepayWebhookRequest webhookRequest,
            HttpServletRequest request) {
        try {
            // Log all headers for debugging
            log.info("=== Sepay Webhook Received ===");
            log.info("Headers: {}", request.getHeaderNames());
            request.getHeaderNames().asIterator().forEachRemaining(headerName -> {
                log.info("Header {}: {}", headerName, request.getHeader(headerName));
            });
            log.info("Request Body: {}", webhookRequest);
            log.info("==============================");
            
            // Verify API Key from Authorization header
            String authHeader = request.getHeader("Authorization");
            if (!verifyApiKey(authHeader)) {
                log.warn("Invalid or missing API key. Authorization header: {}", authHeader);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new WebhookResponse("error", "Invalid API key"));
            }
            
            log.info("API key verified successfully");
            log.info("Processing webhook: transactionId={}, amount={}, content={}, status={}", 
                    webhookRequest.getId(), webhookRequest.getAmount(), 
                    webhookRequest.getContent(), webhookRequest.getStatus());
            
            // Process the webhook and update payment status
            boolean processed = orderService.processSepayWebhook(webhookRequest);
            
            if (processed) {
                log.info("Successfully processed Sepay webhook for transaction: {}", webhookRequest.getId());
                return ResponseEntity.ok().body(new WebhookResponse("success", "Webhook processed successfully"));
            } else {
                log.warn("Could not process Sepay webhook for transaction: {}", webhookRequest.getId());
                return ResponseEntity.ok().body(new WebhookResponse("ignored", "Webhook received but no matching order found"));
            }
        } catch (Exception e) {
            log.error("Error processing Sepay webhook", e);
            // Return 200 to prevent Sepay from retrying
            return ResponseEntity.ok().body(new WebhookResponse("error", "Error processing webhook: " + e.getMessage()));
        }
    }

    /**
     * Verify API Key from Authorization header
     * Format: "Authorization": "Apikey YOUR_API_KEY"
     */
    private boolean verifyApiKey(String authHeader) {
        if (!StringUtils.hasText(authHeader)) {
            log.warn("Authorization header is missing");
            return false;
        }
        
        // Check if header starts with "Apikey "
        if (!authHeader.startsWith("Apikey ") && !authHeader.startsWith("apikey ")) {
            log.warn("Authorization header format is incorrect. Expected 'Apikey YOUR_KEY', got: {}", authHeader);
            return false;
        }
        
        // Extract API key from header
        String providedKey = authHeader.substring(7).trim(); // Remove "Apikey " prefix
        
        // Compare with configured API key
        boolean isValid = sepayApiKey.equals(providedKey);
        
        if (!isValid) {
            log.warn("API key mismatch. Expected: {}, Provided: {}", sepayApiKey, providedKey);
        }
        
        return isValid;
    }

    /**
     * Health check endpoint for webhook
     */
    @GetMapping("/sepay/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok().body(new WebhookResponse("ok", "Webhook endpoint is active"));
    }

    private record WebhookResponse(String status, String message) {}
}
