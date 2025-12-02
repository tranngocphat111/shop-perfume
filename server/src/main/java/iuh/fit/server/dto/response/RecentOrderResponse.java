package iuh.fit.server.dto.response;

import iuh.fit.server.model.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentOrderResponse {
    private Integer orderId;
    private String customerName;
    private String customerEmail;
    private String mainProduct; // First product in order
    private Double totalAmount;
    private PaymentStatus status;
    private Date orderDate;
    private Integer itemCount; // Number of items in order
}
