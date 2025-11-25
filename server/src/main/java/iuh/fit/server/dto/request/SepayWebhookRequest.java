package iuh.fit.server.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * DTO for Sepay Webhook callback
 * Based on Sepay webhook documentation
 */
@Data
public class SepayWebhookRequest {
    
    @JsonProperty("id")
    private String id; // Transaction ID from Sepay
    
    @JsonProperty("amount")
    private Double amount; // Amount transferred
    
    @JsonProperty("content")
    private String content; // Transfer content (usually contains order ID)
    
    @JsonProperty("account_number")
    private String accountNumber; // Bank account number
    
    @JsonProperty("account_name")
    private String accountName; // Account holder name
    
    @JsonProperty("bank")
    private String bank; // Bank name
    
    @JsonProperty("transaction_date")
    private String transactionDate; // Transaction date/time
    
    @JsonProperty("reference")
    private String reference; // Reference number
    
    @JsonProperty("status")
    private String status; // Transaction status (e.g., "success", "pending", "failed")
}

