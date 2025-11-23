package iuh.fit.server.dto.request;

import iuh.fit.server.model.enums.ProductStatus;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho request tạo hoặc cập nhật Product
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {   
    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(min = 3, max = 200, message = "Tên sản phẩm phải từ 3-200 ký tự")
    private String name;

    @Size(max = 10000, message = "Mô tả không được quá 10000 ký tự")
    private String description;

    private String perfumeLongevity;

    private String perfumeConcentration;

    private String releaseYear;

    @Min(value = 1, message = "Dung tích phải lớn hơn 0")
    private int columeMl;

    @NotNull(message = "Trạng thái không được để trống")
    private ProductStatus status;

    @DecimalMin(value = "0.0", inclusive = false, message = "Giá phải lớn hơn 0")
    private double unitPrice;

    @NotNull(message = "Brand ID không được để trống")
    private Integer brandId;

    @NotNull(message = "Category ID không được để trống")
    private Integer categoryId;
}

