package iuh.fit.server.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * DTO for Sepay Webhook callback
 * Based on Sepay webhook documentation: https://docs.sepay.vn/tich-hop-webhooks.html
 * 
 * Format from Sepay:
 * {
 *     "id": 92704,
 *     "gateway":"Vietcombank",
 *     "transactionDate":"2023-03-25 14:02:37",
 *     "accountNumber":"0123499999",
 *     "code":null,
 *     "content":"chuyen tien mua iphone",
 *     "transferType":"in",
 *     "transferAmount":2277000,
 *     "accumulated":19077000,
 *     "subAccount":null,
 *     "referenceCode":"MBVCB.3278907687",
 *     "description":""
 * }
 */
@Data
public class SepayWebhookRequest {
    
    @JsonProperty("id")
    private Long id; // Transaction ID from Sepay (number, not string)
    
    @JsonProperty("gateway")
    private String gateway; // Bank name (e.g., "Vietcombank", "MBBank")
    
    @JsonProperty("transactionDate")
    private String transactionDate; // Transaction date/time (format: "2023-03-25 14:02:37")
    
    @JsonProperty("accountNumber")
    private String accountNumber; // Bank account number
    
    @JsonProperty("code")
    private String code; // Payment code (Sepay auto-recognized, can be null)
    
    @JsonProperty("content")
    private String content; // Transfer content (usually contains order ID like "STNP_108")
    
    @JsonProperty("transferType")
    private String transferType; // Transaction type: "in" (money in) or "out" (money out)
    
    @JsonProperty("transferAmount")
    private Double transferAmount; // Amount transferred
    
    @JsonProperty("accumulated")
    private Double accumulated; // Account balance (cumulative)
    
    @JsonProperty("subAccount")
    private String subAccount; // Sub account (virtual account), can be null
    
    @JsonProperty("referenceCode")
    private String referenceCode; // Reference code from SMS
    
    @JsonProperty("description")
    private String description; // Full SMS content
}

