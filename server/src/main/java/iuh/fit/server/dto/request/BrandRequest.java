package iuh.fit.server.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho request tạo hoặc cập nhật Brand
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BrandRequest {

    @NotBlank(message = "Tên thương hiệu không được để trống")
    @Size(min = 2, max = 100, message = "Tên thương hiệu phải từ 2-100 ký tự")
    private String name;

    @Size(max = 100, message = "Quốc gia không được quá 100 ký tự")
    private String country;

    @Size(max = 5000, message = "Mô tả không được quá 5000 ký tự")
    private String description;

    @Size(max = 500, message = "URL không được quá 500 ký tự")
    private String url;
}
