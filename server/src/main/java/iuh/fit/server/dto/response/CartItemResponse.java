package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {
    private int cartItemId;
    private int cartId;
    private int quantity;
    private double unitPrice;
    private double subtotal;
    private ProductResponse product;
}
