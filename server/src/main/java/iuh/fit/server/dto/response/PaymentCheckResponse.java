package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCheckResponse {
    private Boolean paid;
    private String orderId;
    private String transactionId;
    private Double amount;
    private Date paymentDate;
    private Boolean cancelled; // Indicates if order was cancelled due to timeout
    
    // Debug information (only populated when debug=true)
    private String debugMessage;
    private String paymentStatus;
    private Boolean orderExists;
    private Boolean paymentExists;
    private String errorMessage;
}

