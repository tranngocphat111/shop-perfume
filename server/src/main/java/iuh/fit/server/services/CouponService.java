package iuh.fit.server.services;

import iuh.fit.server.dto.request.CouponRequest;
import iuh.fit.server.dto.request.CouponValidationRequest;
import iuh.fit.server.dto.response.CouponResponse;
import iuh.fit.server.dto.response.CouponValidationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CouponService {

    /**
     * Validate coupon code and check if it can be applied to the order
     * 
     * @param request Validation request containing code and total amount
     * @return Validation response with coupon details if valid
     */
    CouponValidationResponse validateCoupon(CouponValidationRequest request);

    /**
     * Get all active and valid coupons
     * 
     * @return List of active coupons
     */
    List<CouponResponse> getAvailableCoupons();

    /**
     * Get coupon by code
     * 
     * @param code Coupon code
     * @return Coupon response if found
     */
    CouponResponse getCouponByCode(String code);

    /**
     * Get available coupons with user's loyalty points check
     * 
     * @param userId User ID (optional, null for guest)
     * @return List of coupons with canUse flag
     */
    List<CouponResponse> getAvailableCoupons(Integer userId);

    /**
     * Validate coupon with user's loyalty points
     * 
     * @param couponId    Coupon ID
     * @param userId      User ID
     * @param totalAmount Order total amount
     * @return Validation response
     */
    CouponValidationResponse validateCouponWithPoints(Integer couponId, Integer userId, Double totalAmount);

    /**
     * Get all coupons with pagination
     * 
     * @param pageable Pagination information
     * @return Page of coupons
     */
    Page<CouponResponse> getAllCoupons(Pageable pageable);

    /**
     * Search coupons by code or description
     * 
     * @param query    Search query
     * @param pageable Pagination information
     * @return Page of matching coupons
     */
    Page<CouponResponse> searchCoupons(String query, Pageable pageable);

    /**
     * Get coupon by ID
     * 
     * @param id Coupon ID
     * @return Coupon response
     */
    CouponResponse getCouponById(Integer id);

    /**
     * Create new coupon
     * 
     * @param request Coupon request
     * @return Created coupon
     */
    CouponResponse createCoupon(CouponRequest request);

    /**
     * Update existing coupon
     * 
     * @param id      Coupon ID
     * @param request Coupon request
     * @return Updated coupon
     */
    CouponResponse updateCoupon(Integer id, CouponRequest request);

    /**
     * Delete coupon
     * 
     * @param id Coupon ID
     */
    void deleteCoupon(Integer id);
}
