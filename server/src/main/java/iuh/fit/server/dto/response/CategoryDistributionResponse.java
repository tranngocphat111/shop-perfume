package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDistributionResponse {
    private List<CategoryStat> categories;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryStat {
        private String categoryName;
        private Long orderCount;
        private Double revenue;
        private Double percentage;
    }
}
