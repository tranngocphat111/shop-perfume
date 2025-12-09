package iuh.fit.server.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "webhook_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WebhookLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gateway_transaction_id")
    private String gatewayTransactionId;

    @Column(name = "order_code")
    private String orderCode;

    @Column(name = "transaction_date")
    private String transactionDate;

    @Column(name = "account_number")
    private String accountNumber;

    @Column(name = "sub_account")
    private String subAccount;

    @Column(name = "amount_in")
    private Double amountIn;

    @Column(name = "amount_out")
    private Double amountOut;

    @Column(name = "accumulated")
    private Double accumulated;

    @Column(name = "code")
    private String code;

    @Column(name = "transaction_content", columnDefinition = "TEXT")
    private String transactionContent;

    @Column(name = "reference_number")
    private String referenceNumber;

    @Column(name = "body", columnDefinition = "TEXT")
    private String body;

    @Column(name = "order_id")
    private Integer orderId;

    @Column(name = "status")
    private String status; // SUCCESS, FAILED, PENDING

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    // Additional fields used by SepayWebhookController
    @Column(name = "gateway")
    private String gateway;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "transfer_type")
    private String transferType;

    @Column(name = "transfer_amount")
    private Double transferAmount;

    @Column(name = "reference_code")
    private String referenceCode;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "raw_request", columnDefinition = "TEXT")
    private String rawRequest;

    @Column(name = "remote_address")
    private String remoteAddress;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "processed")
    private Boolean processed = false;

    @Column(name = "extracted_order_id")
    private Integer extractedOrderId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
