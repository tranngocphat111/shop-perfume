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
     * Sepay typically sends JSON, but we support both JSON and form-urlencoded
     */
    @PostMapping(value = "/sepay", consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    public ResponseEntity<?> handleSepayWebhook(
            @RequestBody(required = false) SepayWebhookRequest webhookRequest,
            @RequestParam(required = false) java.util.Map<String, String> params,
            HttpServletRequest request) {
        try {
            // Log webhook received (use System.out for visibility)
            System.out.println("=== SEPAY WEBHOOK RECEIVED ===");
            System.out.println("Time: " + new java.util.Date());
            System.out.println("Content-Type: " + request.getContentType());
            
            // Verify API Key from Authorization header
            String authHeader = request.getHeader("Authorization");
            System.out.println("Authorization header: " + (authHeader != null ? "Present" : "Missing"));
            
            if (!verifyApiKey(authHeader)) {
                System.out.println("❌ API KEY VERIFICATION FAILED");
                System.out.println("Expected: " + sepayApiKey);
                System.out.println("Received: " + authHeader);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new WebhookResponse("error", "Invalid API key"));
            }
            
            System.out.println("✅ API KEY VERIFIED");
            
            // Handle form-urlencoded if JSON body is null
            if (webhookRequest == null && params != null && !params.isEmpty()) {
                System.out.println("Converting form-urlencoded to DTO");
                webhookRequest = convertParamsToWebhookRequest(params);
            }
            
            // Check if request body is null
            if (webhookRequest == null) {
                System.out.println("❌ REQUEST BODY IS NULL");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new WebhookResponse("error", "Request body is required"));
            }
            
            // Log webhook details
            System.out.println("Transaction ID: " + webhookRequest.getId());
            System.out.println("Content: '" + webhookRequest.getContent() + "'");
            System.out.println("Transfer Type: " + webhookRequest.getTransferType());
            System.out.println("Transfer Amount: " + webhookRequest.getTransferAmount());
            System.out.println("Reference Code: " + webhookRequest.getReferenceCode());
            System.out.println("Code: " + webhookRequest.getCode());
            
            // Process the webhook and update payment status
            boolean processed = orderService.processSepayWebhook(webhookRequest);
            
            if (processed) {
                System.out.println("✅ WEBHOOK PROCESSED SUCCESSFULLY");
                // Sepay requires response: HTTP 200/201 with {"success": true}
                return ResponseEntity.ok().body(new WebhookSuccessResponse(true, "Webhook processed successfully"));
            } else {
                System.out.println("❌ WEBHOOK NOT PROCESSED - No matching order found");
                System.out.println("Check if content contains order ID in format: STNP_XXX");
                // Still return success to prevent retry, but with success: false
                return ResponseEntity.ok().body(new WebhookSuccessResponse(false, "Webhook received but no matching order found"));
            }
        } catch (Exception e) {
            System.out.println("❌ WEBHOOK ERROR: " + e.getMessage());
            e.printStackTrace();
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
     */
    @GetMapping("/sepay/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok().body(new WebhookResponse("ok", "Webhook endpoint is active"));
    }

    /**
     * Test endpoint to manually test webhook processing
     * Usage: POST /api/webhooks/sepay/test with sample webhook data
     * This endpoint bypasses API key check for testing
     */
    @PostMapping("/sepay/test")
    public ResponseEntity<?> testWebhook(@RequestBody SepayWebhookRequest testRequest) {
        try {
            // Log test request details for debugging
            System.out.println("=== TEST WEBHOOK REQUEST ===");
            System.out.println("ID: " + testRequest.getId());
            System.out.println("Content: " + testRequest.getContent());
            System.out.println("Transfer Type: " + testRequest.getTransferType());
            System.out.println("Transfer Amount: " + testRequest.getTransferAmount());
            System.out.println("Reference Code: " + testRequest.getReferenceCode());
            System.out.println("Code: " + testRequest.getCode());
            System.out.println("============================");
            
            boolean processed = orderService.processSepayWebhook(testRequest);
            if (processed) {
                System.out.println("✅ TEST WEBHOOK: Processed successfully");
                return ResponseEntity.ok().body(new WebhookSuccessResponse(true, "Test webhook processed successfully"));
            } else {
                System.out.println("❌ TEST WEBHOOK: No matching order found");
                return ResponseEntity.ok().body(new WebhookSuccessResponse(false, "Test webhook received but no matching order found. Check content field for order ID."));
            }
        } catch (Exception e) {
            System.out.println("❌ TEST WEBHOOK ERROR: " + e.getMessage());
            e.printStackTrace();
            log.error("Error processing test webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new WebhookResponse("error", "Error processing test webhook: " + e.getMessage()));
        }
    }

    private record WebhookResponse(String status, String message) {}
    
    /**
     * Response format required by Sepay
     * Must return: {"success": true} with HTTP 200/201
     */
    private record WebhookSuccessResponse(boolean success, String message) {}
}
