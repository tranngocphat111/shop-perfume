package iuh.fit.server.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemRequest {
    private Integer productId;
    private String productName;
    private Double unitPrice;
    private String imageUrl;
    private Integer quantity;
}

