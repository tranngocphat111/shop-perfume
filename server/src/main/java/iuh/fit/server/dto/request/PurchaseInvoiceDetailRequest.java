package iuh.fit.server.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseInvoiceDetailRequest {
    private Integer productId;
    private Integer quantity;
    private Double importPrice;
}
