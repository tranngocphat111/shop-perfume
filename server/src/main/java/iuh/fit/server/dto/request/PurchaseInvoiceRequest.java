package iuh.fit.server.dto.request;

import iuh.fit.server.model.enums.PurchaseInvoiceStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseInvoiceRequest {
    private Integer supplierId;
    private String email;
    private PurchaseInvoiceStatus status;
    private List<PurchaseInvoiceDetailRequest> details;
}
