package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserCouponResponse {
    private Integer userCouponId;
    private Integer couponId;
    private String code;
    private String description;
    private Double discountPercent;
    private Double minOrderValue;
    private Date startDate;
    private Date endDate;
    private String status; // AVAILABLE, USED, EXPIRED
    private Date receivedAt;
    private Date usedAt;
    
    // For validation
    private Boolean valid;
    private String message;
    private Double discountAmount;
}

