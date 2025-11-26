package iuh.fit.server.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.util.Date;

/**
 * Entity to store webhook logs for debugging
 * This allows querying webhook history without accessing server logs
 */
@Entity
@Table(name = "webhook_log")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class WebhookLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    private Date receivedAt;

    private String gateway;
    private String transactionDate;
    private String accountNumber;
    private String code;
    private String content;
    private String transferType;
    private Double transferAmount;
    private String referenceCode;
    private String description;
    
    @Column(length = 1000)
    private String rawRequest; // Store raw JSON request for debugging
    
    private Integer extractedOrderId; // Order ID extracted from content
    private Boolean processed; // Whether webhook was successfully processed
    private String errorMessage; // Error message if processing failed
    private String remoteAddress; // IP address of webhook sender
    private String contentType; // Content-Type of the request
}

