package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LowStockProductResponse {
    private Integer productId;
    private String productName;
    private String brandName;
    private Integer volumeMl;
    private Integer stockQuantity;
    private String status; // "OUT_OF_STOCK", "LOW_STOCK", "CRITICAL"
    private String imageUrl;
}
