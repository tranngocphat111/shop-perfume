package iuh.fit.server.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreateRequest {
    private String fullName;
    private String phone;
    private String email;
    private String city;
    private String district;
    private String ward;
    private String address;
    private String note;
    private String paymentMethod; // "cod", "qr-payment", "bank-transfer"
    private List<OrderItemRequest> cartItems;
    private Double totalAmount;
}

