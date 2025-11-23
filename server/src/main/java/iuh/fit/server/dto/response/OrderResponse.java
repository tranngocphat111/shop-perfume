package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Integer orderId;
    private Date orderDate;
    private Double totalAmount;
    private String guestName;
    private String guestEmail;
    private String guestPhone;
    private String guestAddress;
    private PaymentResponse payment;
    private ShipmentResponse shipment;
    private List<OrderItemResponse> orderItems;
}

