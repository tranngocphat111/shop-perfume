package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO nhẹ chỉ chứa productId và name cho dropdown/select list
 * Tối ưu hóa performance khi chỉ cần hiển thị tên sản phẩm
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductSummaryResponse {
    private Integer productId;
    private String name;
}
