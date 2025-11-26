package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryResponse {
    private int inventoryId;
    private int quantity;
    private Date lastUpdated;
    private ProductResponse product;

}

