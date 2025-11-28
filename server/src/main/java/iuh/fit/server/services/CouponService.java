package iuh.fit.server.services;

import iuh.fit.server.dto.request.CouponValidationRequest;
import iuh.fit.server.dto.response.CouponResponse;
import iuh.fit.server.dto.response.CouponValidationResponse;

import java.util.List;

public interface CouponService {
    
    /**
     * Validate coupon code and check if it can be applied to the order
     * @param request Validation request containing code and total amount
     * @return Validation response with coupon details if valid
     */
    CouponValidationResponse validateCoupon(CouponValidationRequest request);
    
    /**
     * Get all active and valid coupons
     * @return List of active coupons
     */
    List<CouponResponse> getAvailableCoupons();
    
    /**
     * Get coupon by code
     * @param code Coupon code
     * @return Coupon response if found
     */
    CouponResponse getCouponByCode(String code);
}

