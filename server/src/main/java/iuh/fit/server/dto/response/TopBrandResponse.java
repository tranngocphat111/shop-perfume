package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopBrandResponse {
    private String brandName;
    private Long totalSold;
    private Double revenue;
}
