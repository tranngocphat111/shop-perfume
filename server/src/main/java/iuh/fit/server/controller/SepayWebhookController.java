package iuh.fit.server.controller;

import iuh.fit.server.dto.request.SepayWebhookRequest;
import iuh.fit.server.services.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
    @PostMapping(value = "/sepay", consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    public ResponseEntity<?> handleSepayWebhook(
            @RequestBody(required = false) SepayWebhookRequest webhookRequest,
            HttpServletRequest request) {
        try {
            // Verify API Key from Authorization header
            String authHeader = request.getHeader("Authorization");
            
            if (!verifyApiKey(authHeader)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new WebhookResponse("error", "Invalid API key"));
            }
            
            // Check if request body is null
            if (webhookRequest == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new WebhookResponse("error", "Request body is required"));
            }
            
            // Process the webhook and update payment status
            boolean processed = orderService.processSepayWebhook(webhookRequest);
            
            if (processed) {
                // Sepay requires response: HTTP 200/201 with {"success": true}
                return ResponseEntity.ok().body(new WebhookSuccessResponse(true, "Webhook processed successfully"));
            } else {
                // Still return success to prevent retry, but with success: false
                return ResponseEntity.ok().body(new WebhookSuccessResponse(false, "Webhook received but no matching order found"));
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
            return false;
        }
        
        // Check if header starts with "Apikey "
        if (!authHeader.startsWith("Apikey ") && !authHeader.startsWith("apikey ")) {
            return false;
        }
        
        // Extract API key from header
        String providedKey = authHeader.substring(7).trim(); // Remove "Apikey " prefix
        
        // Compare with configured API key
        return sepayApiKey.equals(providedKey);
    }

    /**
     * Health check endpoint for webhook
     */
    @GetMapping("/sepay/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok().body(new WebhookResponse("ok", "Webhook endpoint is active"));
    }

    private record WebhookResponse(String status, String message) {}
    
    /**
     * Response format required by Sepay
     * Must return: {"success": true} with HTTP 200/201
     */
    private record WebhookSuccessResponse(boolean success, String message) {}
}
