package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CouponValidationResponse {
    private boolean valid;
    private String message;
    private CouponResponse coupon;
    private Double discountAmount;
    
    public CouponValidationResponse(boolean valid, String message) {
        this.valid = valid;
        this.message = message;
    }
}

