package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseInvoiceDetailResponse {
    private int purchaseInvoiceDetailId;
    private Integer quantity;
    private Double importPrice;
    private Double subTotal;
    private ProductResponse product;
}
