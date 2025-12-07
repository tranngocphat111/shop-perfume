package iuh.fit.server.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CouponRequest {

    @NotBlank(message = "Coupon code is required")
    @Size(min = 3, max = 50, message = "Coupon code must be between 3 and 50 characters")
    @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Coupon code must contain only uppercase letters, numbers, underscores and hyphens")
    private String code;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotNull(message = "Discount percent is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Discount percent must be greater than 0")
    @DecimalMax(value = "100.0", message = "Discount percent must not exceed 100")
    private Double discountPercent;

    @Min(value = 0, message = "Required points must be at least 0")
    private Integer requiredPoints = 0;

    @NotNull(message = "Start date is required")
    private Date startDate;

    @NotNull(message = "End date is required")
    private Date endDate;

    @NotNull(message = "Active status is required")
    private Boolean isActive;
}
