package iuh.fit.server.controller;

import iuh.fit.server.dto.request.SepayWebhookRequest;
import iuh.fit.server.services.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
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

    /**
     * Handle Sepay webhook callback for payment verification
     * This endpoint receives notifications when a payment is received
     */
    @PostMapping("/sepay")
    public ResponseEntity<?> handleSepayWebhook(@RequestBody SepayWebhookRequest webhookRequest) {
        try {
            log.info("Received Sepay webhook: {}", webhookRequest);
            
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
     * Health check endpoint for webhook
     */
    @GetMapping("/sepay/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok().body(new WebhookResponse("ok", "Webhook endpoint is active"));
    }

    private record WebhookResponse(String status, String message) {}
}

