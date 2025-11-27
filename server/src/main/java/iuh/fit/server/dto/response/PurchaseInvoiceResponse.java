package iuh.fit.server.dto.response;

import iuh.fit.server.model.enums.PurchaseInvoiceStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseInvoiceResponse {
    private int purchaseInvoiceId;
    private Double totalAmount;
    private String email;
    private PurchaseInvoiceStatus status;
    private Date createdAt;
    private Date lastUpdated;
    private String createdBy;
    private String lastUpdatedBy;
    private SupplierResponse supplier;
//    private List<PurchaseInvoiceDetailResponse> details;
}
