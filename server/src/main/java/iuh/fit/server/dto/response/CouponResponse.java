package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CouponResponse {
    private int couponId;
    private String code;
    private String description;
    private double discountPercent;
    private Integer requiredPoints;
    private Date startDate;
    private Date endDate;
    private boolean isActive;
    private Boolean canUse; // Whether user has enough points to use this coupon
}

