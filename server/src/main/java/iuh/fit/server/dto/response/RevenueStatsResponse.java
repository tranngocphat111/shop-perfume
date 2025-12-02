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
public class RevenueStatsResponse {
    private List<String> labels;
    private List<Double> revenues;
    private List<Long> orderCounts;
}
