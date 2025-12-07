package iuh.fit.server.controller;

import iuh.fit.server.dto.request.SepayWebhookRequest;
import iuh.fit.server.model.entity.WebhookLog;
import iuh.fit.server.repository.WebhookLogRepository;
import iuh.fit.server.services.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    private final WebhookLogRepository webhookLogRepository;
    
    @Value("${sepay.webhook.api-key:PASS_KEY}")
    private String expectedApiKey;

    /**
     * Handle Sepay webhook callback for payment verification
     * This endpoint receives notifications when a payment is received
     * 
     * Sepay sends webhook as JSON with API Key authentication
     * Format: Header "Authorization": "Apikey YOUR_API_KEY"
     * We support both JSON and form-urlencoded
     */
    @PostMapping(value = "/sepay", consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE, MediaType.ALL_VALUE})
    public ResponseEntity<?> handleSepayWebhook(
            @RequestBody(required = false) SepayWebhookRequest webhookRequest,
            @RequestParam(required = false) java.util.Map<String, String> params,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            HttpServletRequest request) {
        
        WebhookLog webhookLog = new WebhookLog();
        String rawRequestBody = null;
        Integer extractedOrderId = null;
        Boolean processed = false;
        String errorMessage = null;
        
        // Log incoming webhook request details
        log.info("=== SEPAY WEBHOOK RECEIVED ===");
        log.info("Request Method: {}", request.getMethod());
        log.info("Request URI: {}", request.getRequestURI());
        log.info("Content-Type: {}", request.getContentType());
        log.info("Remote Address: {}", request.getRemoteAddr());
        log.info("Authorization Header: {}", authorizationHeader != null ? "Present" : "Missing");
        
        // Verify API Key if provided (optional for backward compatibility)
        if (authorizationHeader != null && !authorizationHeader.isEmpty()) {
            String providedApiKey = authorizationHeader.replace("Apikey ", "").trim();
            if (!expectedApiKey.equals(providedApiKey)) {
                log.warn("⚠️ Invalid API Key provided. Expected: {}, Got: {}", expectedApiKey, providedApiKey);
                // Still process the webhook but log the warning
            } else {
                log.info("✅ API Key verified successfully");
            }
        } else {
            log.info("ℹ️ No Authorization header provided (webhook may work without it)");
        }
        
        try {
            // Try to read raw body for debugging
            try {
                java.io.BufferedReader reader = request.getReader();
                StringBuilder body = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    body.append(line);
                }
                if (body.length() > 0) {
                    rawRequestBody = body.toString();
                    log.info("Raw request body: {}", rawRequestBody);
                }
            } catch (Exception e) {
                log.warn("Could not read raw request body: {}", e.getMessage());
            }
            
            // Handle form-urlencoded if JSON body is null
            if (webhookRequest == null && params != null && !params.isEmpty()) {
                log.info("Converting form-urlencoded params to webhook request. Params: {}", params);
                webhookRequest = convertParamsToWebhookRequest(params);
            }
            
            // Check if request body is null
            if (webhookRequest == null) {
                log.error("❌ Sepay webhook request body is null. Content-Type: {}", request.getContentType());
                log.error("Params map: {}", params);
                
                // Save log with error
                webhookLog.setRawRequest(rawRequestBody);
                webhookLog.setProcessed(false);
                webhookLog.setErrorMessage("Request body is null");
                webhookLog.setRemoteAddress(request.getRemoteAddr());
                webhookLog.setContentType(request.getContentType());
                webhookLogRepository.save(webhookLog);
                
                // Still return 200 to prevent Sepay from retrying
                return ResponseEntity.ok().body(new WebhookSuccessResponse(false, "Request body is null"));
            }
            
            // Populate webhook log
            webhookLog.setGateway(webhookRequest.getGateway());
            webhookLog.setTransactionDate(webhookRequest.getTransactionDate());
            webhookLog.setAccountNumber(webhookRequest.getAccountNumber());
            webhookLog.setCode(webhookRequest.getCode());
            webhookLog.setContent(webhookRequest.getContent());
            webhookLog.setTransferType(webhookRequest.getTransferType());
            webhookLog.setTransferAmount(webhookRequest.getTransferAmount());
            webhookLog.setReferenceCode(webhookRequest.getReferenceCode());
            webhookLog.setDescription(webhookRequest.getDescription());
            webhookLog.setRawRequest(rawRequestBody);
            webhookLog.setRemoteAddress(request.getRemoteAddr());
            webhookLog.setContentType(request.getContentType());
            
            // Log webhook request details
            log.info("Webhook Request Details:");
            log.info("  - ID: {}", webhookRequest.getId());
            log.info("  - Gateway: {}", webhookRequest.getGateway());
            log.info("  - Transaction Date: {}", webhookRequest.getTransactionDate());
            log.info("  - Account Number: {}", webhookRequest.getAccountNumber());
            log.info("  - Code: {}", webhookRequest.getCode());
            log.info("  - Content: {}", webhookRequest.getContent());
            log.info("  - Transfer Type: {}", webhookRequest.getTransferType());
            log.info("  - Transfer Amount: {}", webhookRequest.getTransferAmount());
            log.info("  - Reference Code: {}", webhookRequest.getReferenceCode());
            log.info("  - Description: {}", webhookRequest.getDescription());
            
            // Process the webhook and update payment status
            processed = orderService.processSepayWebhook(webhookRequest);
            
            // Extract order ID for logging
            extractedOrderId = orderService.extractOrderIdFromWebhook(webhookRequest);
            webhookLog.setExtractedOrderId(extractedOrderId);
            webhookLog.setProcessed(processed);
            
            if (processed) {
                log.info("✅ Webhook processed successfully! Payment status updated.");
                // Sepay requires response: HTTP 200/201 with {"success": true}
                webhookLogRepository.save(webhookLog);
                return ResponseEntity.ok().body(new WebhookSuccessResponse(true, "Webhook processed successfully"));
            } else {
                log.warn("⚠️ Webhook received but no matching order found or already processed");
                log.warn("  - Content: {}", webhookRequest.getContent());
                log.warn("  - Amount: {}", webhookRequest.getTransferAmount());
                webhookLog.setErrorMessage("No matching order found or already processed");
                webhookLogRepository.save(webhookLog);
                // Still return success to prevent retry, but with success: false
                return ResponseEntity.ok().body(new WebhookSuccessResponse(false, "Webhook received but no matching order found"));
            }
        } catch (Exception e) {
            log.error("❌ Error processing Sepay webhook", e);
            log.error("Exception details: {}", e.getMessage(), e);
            errorMessage = e.getMessage();
            webhookLog.setProcessed(false);
            webhookLog.setErrorMessage(errorMessage);
            webhookLog.setExtractedOrderId(extractedOrderId);
            webhookLog.setRawRequest(rawRequestBody);
            webhookLog.setRemoteAddress(request.getRemoteAddr());
            webhookLog.setContentType(request.getContentType());
            webhookLogRepository.save(webhookLog);
            // Return 200 to prevent Sepay from retrying
            return ResponseEntity.ok().body(new WebhookSuccessResponse(false, "Error processing webhook: " + e.getMessage()));
        } finally {
            log.info("=== END SEPAY WEBHOOK PROCESSING ===");
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
            // Use format "STNP_{orderId}" to match client QR code generation
            SepayWebhookRequest webhookRequest = new SepayWebhookRequest();
            webhookRequest.setId(System.currentTimeMillis()); // Use timestamp as ID
            webhookRequest.setGateway("MBBank");
            webhookRequest.setTransactionDate(transactionDate != null ? transactionDate : java.time.LocalDateTime.now().toString());
            webhookRequest.setAccountNumber("0963360910");
            webhookRequest.setCode("STNP_" + orderId);
            webhookRequest.setContent("STNP_" + orderId);
            webhookRequest.setTransferType("in");
            webhookRequest.setTransferAmount(amount);
            webhookRequest.setDescription("STNP_" + orderId);
            
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

    /**
     * Get webhook logs for debugging
     * GET /api/webhooks/sepay/logs?orderId=123&limit=10
     */
    @GetMapping("/sepay/logs")
    public ResponseEntity<?> getWebhookLogs(
            @RequestParam(required = false) Integer orderId,
            @RequestParam(required = false, defaultValue = "20") int limit) {
        try {
            List<WebhookLog> logs;
            if (orderId != null) {
                logs = webhookLogRepository.findByExtractedOrderIdOrderByCreatedAtDesc(orderId);
            } else {
                Pageable pageable = PageRequest.of(0, limit);
                Page<WebhookLog> page = webhookLogRepository.findAllByOrderByCreatedAtDesc(pageable);
                logs = page.getContent();
            }
            return ResponseEntity.ok().body(logs);
        } catch (Exception e) {
            log.error("Error fetching webhook logs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new WebhookResponse("error", "Error fetching logs: " + e.getMessage()));
        }
    }
    
    /**
     * Get failed webhook logs
     * GET /api/webhooks/sepay/logs/failed?limit=10
     */
    @GetMapping("/sepay/logs/failed")
    public ResponseEntity<?> getFailedWebhookLogs(
            @RequestParam(required = false, defaultValue = "20") int limit) {
        try {
            Pageable pageable = PageRequest.of(0, limit);
            List<WebhookLog> logs = webhookLogRepository.findFailedWebhooks(pageable);
            return ResponseEntity.ok().body(logs);
        } catch (Exception e) {
            log.error("Error fetching failed webhook logs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new WebhookResponse("error", "Error fetching failed logs: " + e.getMessage()));
        }
    }

    private record WebhookResponse(String status, String message) {}
    
    /**
     * Response format required by Sepay
     * Must return: {"success": true} with HTTP 200/201
     */
    private record WebhookSuccessResponse(boolean success, String message) {}
}
