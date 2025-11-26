package iuh.fit.server.controller;

import iuh.fit.server.dto.request.SepayWebhookRequest;
import iuh.fit.server.services.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
     * 
     * Sepay sends webhook as JSON (no authentication required)
     * We support both JSON and form-urlencoded
     */
    @PostMapping(value = "/sepay", consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE, MediaType.ALL_VALUE})
    public ResponseEntity<?> handleSepayWebhook(
            @RequestBody(required = false) SepayWebhookRequest webhookRequest,
            @RequestParam(required = false) java.util.Map<String, String> params,
            HttpServletRequest request) {
        try {
            // Handle form-urlencoded if JSON body is null
            if (webhookRequest == null && params != null && !params.isEmpty()) {
                webhookRequest = convertParamsToWebhookRequest(params);
            }
            
            // Check if request body is null
            if (webhookRequest == null) {
                log.error("Sepay webhook request body is null. Content-Type: {}", request.getContentType());
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
     * Convert form-urlencoded parameters to SepayWebhookRequest DTO
     */
    private SepayWebhookRequest convertParamsToWebhookRequest(java.util.Map<String, String> params) {
        SepayWebhookRequest request = new SepayWebhookRequest();
        
        if (params.containsKey("id")) {
            try {
                request.setId(Long.parseLong(params.get("id")));
            } catch (NumberFormatException e) {
                // Ignore
            }
        }
        request.setGateway(params.get("gateway"));
        request.setTransactionDate(params.get("transactionDate"));
        request.setAccountNumber(params.get("accountNumber"));
        request.setCode(params.get("code"));
        request.setContent(params.get("content"));
        request.setTransferType(params.get("transferType"));
        if (params.containsKey("transferAmount")) {
            try {
                request.setTransferAmount(Double.parseDouble(params.get("transferAmount")));
            } catch (NumberFormatException e) {
                // Ignore
            }
        }
        if (params.containsKey("accumulated")) {
            try {
                request.setAccumulated(Double.parseDouble(params.get("accumulated")));
            } catch (NumberFormatException e) {
                // Ignore
            }
        }
        request.setSubAccount(params.get("subAccount"));
        request.setReferenceCode(params.get("referenceCode"));
        request.setDescription(params.get("description"));
        
        return request;
    }

    /**
     * Health check endpoint for webhook
     * Sepay can use this to verify the endpoint is accessible
     */
    @GetMapping("/sepay/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok().body(new WebhookResponse("ok", "Webhook endpoint is active"));
    }
    
    /**
     * Simple GET endpoint to test if Sepay can reach the server
     * This helps verify webhook URL configuration in Sepay dashboard
     */
    @GetMapping("/sepay")
    public ResponseEntity<?> testConnection() {
        return ResponseEntity.ok().body(new WebhookResponse("ok", "Webhook endpoint is reachable. URL: /api/webhooks/sepay"));
    }

    /**
     * Test endpoint to manually test webhook processing
     * Usage: POST /api/webhooks/sepay/test with sample webhook data
     * This endpoint bypasses API key check for testing
     */
    @PostMapping("/sepay/test")
    public ResponseEntity<?> testWebhook(@RequestBody SepayWebhookRequest testRequest) {
        try {
            boolean processed = orderService.processSepayWebhook(testRequest);
            if (processed) {
                return ResponseEntity.ok().body(new WebhookSuccessResponse(true, "Test webhook processed successfully"));
            } else {
                return ResponseEntity.ok().body(new WebhookSuccessResponse(false, "Test webhook received but no matching order found. Check content field for order ID."));
            }
        } catch (Exception e) {
            log.error("Error processing test webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new WebhookResponse("error", "Error processing test webhook: " + e.getMessage()));
        }
    }
    
    /**
     * Manual webhook trigger from real transaction
     * Use this when Sepay doesn't send webhook automatically
     * Usage: POST /api/webhooks/sepay/manual with orderId and amount
     * This endpoint bypasses API key check for manual processing
     * Supports both form-urlencoded and JSON
     */
    @PostMapping(value = "/sepay/manual", consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE, MediaType.ALL_VALUE})
    public ResponseEntity<?> manualWebhook(
            @RequestParam(required = false) Integer orderId,
            @RequestParam(required = false) Double amount,
            @RequestParam(required = false) String transactionDate,
            @RequestBody(required = false) java.util.Map<String, Object> jsonBody) {
        try {
            // Support both form-urlencoded (@RequestParam) and JSON (@RequestBody)
            if (jsonBody != null && !jsonBody.isEmpty()) {
                orderId = jsonBody.containsKey("orderId") ? Integer.valueOf(jsonBody.get("orderId").toString()) : orderId;
                amount = jsonBody.containsKey("amount") ? Double.valueOf(jsonBody.get("amount").toString()) : amount;
                transactionDate = jsonBody.containsKey("transactionDate") ? jsonBody.get("transactionDate").toString() : transactionDate;
            }
            
            if (orderId == null || amount == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new WebhookResponse("error", "orderId and amount are required"));
            }
            
            // Create webhook request from transaction data
            SepayWebhookRequest webhookRequest = new SepayWebhookRequest();
            webhookRequest.setId(System.currentTimeMillis()); // Use timestamp as ID
            webhookRequest.setGateway("MBBank");
            webhookRequest.setTransactionDate(transactionDate != null ? transactionDate : java.time.LocalDateTime.now().toString());
            webhookRequest.setAccountNumber("0963360910");
            webhookRequest.setCode("STNP" + orderId);
            webhookRequest.setContent("STNP" + orderId);
            webhookRequest.setTransferType("in");
            webhookRequest.setTransferAmount(amount);
            webhookRequest.setDescription("STNP" + orderId);
            
            boolean processed = orderService.processSepayWebhook(webhookRequest);
            if (processed) {
                return ResponseEntity.ok().body(new WebhookSuccessResponse(true, "Manual webhook processed successfully for order " + orderId));
            } else {
                return ResponseEntity.ok().body(new WebhookSuccessResponse(false, "Manual webhook failed. Order " + orderId + " not found or amount mismatch."));
            }
        } catch (Exception e) {
            log.error("Error processing manual webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new WebhookResponse("error", "Error processing manual webhook: " + e.getMessage()));
        }
    }

    private record WebhookResponse(String status, String message) {}
    
    /**
     * Response format required by Sepay
     * Must return: {"success": true} with HTTP 200/201
     */
    private record WebhookSuccessResponse(boolean success, String message) {}
}
