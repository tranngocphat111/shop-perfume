package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SupplierResponse {
    private int supplierId;
    private String name;
    private String email;
    private String phone;
    private String address;
    private Date createdAt;
    private Date lastUpdated;
    private String createdBy;
    private String lastUpdatedBy;
}
