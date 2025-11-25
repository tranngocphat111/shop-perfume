package iuh.fit.server.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemRequest {
    
    @NotNull(message = "Mã sản phẩm không được để trống")
    @Positive(message = "Mã sản phẩm phải là số dương")
    private Integer productId;
    
    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 200, message = "Tên sản phẩm không được quá 200 ký tự")
    private String productName;
    
    @NotNull(message = "Giá sản phẩm không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá sản phẩm phải lớn hơn 0")
    private Double unitPrice;
    
    @Size(max = 500, message = "URL hình ảnh không được quá 500 ký tự")
    private String imageUrl;
    
    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn hoặc bằng 1")
    @Max(value = 1000, message = "Số lượng không được vượt quá 1000")
    private Integer quantity;
}

