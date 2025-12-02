package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopProductResponse {
    private Integer productId;
    private String productName;
    private String brandName;
    private String imageUrl;
    private Long totalSold;
    private Integer stockQuantity;
    private Double revenue;
    private Double unitPrice;
    private Integer volumeMl;
}
