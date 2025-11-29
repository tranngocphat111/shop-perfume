package iuh.fit.server.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CouponValidationRequest {
    
    @NotBlank(message = "Mã khuyến mãi không được để trống")
    private String code;
    
    @Positive(message = "Tổng tiền phải lớn hơn 0")
    private double totalAmount;
}

