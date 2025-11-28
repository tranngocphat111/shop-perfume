package iuh.fit.server.services;

import iuh.fit.server.dto.response.UserCouponResponse;

import java.util.List;

public interface UserCouponService {
    
    /**
     * Lấy danh sách coupon có thể sử dụng của user
     * @param userId User ID
     * @return List of available coupons
     */
    List<UserCouponResponse> getAvailableCoupons(Integer userId);
    
    /**
     * Sử dụng coupon cho đơn hàng
     * @param userCouponId ID của user_coupon
     * @param userId User ID (để verify ownership)
     * @param orderId Order ID
     * @return true if successful
     */
    boolean useCoupon(Integer userCouponId, Integer userId, Integer orderId);
    
    /**
     * Tặng coupon cho user
     * @param userId User ID
     * @param couponId Coupon ID
     * @return true if successful
     */
    boolean giveCouponToUser(Integer userId, Integer couponId);
    
    /**
     * Tự động tặng coupon cho user dựa trên giá trị đơn hàng
     * @param userId User ID
     * @param orderValue Giá trị đơn hàng
     */
    void autoGiveCouponsAfterOrder(Integer userId, Double orderValue);
    
    /**
     * Validate coupon của user trước khi sử dụng
     * @param userCouponId ID của user_coupon
     * @param userId User ID
     * @param totalAmount Tổng tiền đơn hàng
     * @return Thông tin validation
     */
    UserCouponResponse validateUserCoupon(Integer userCouponId, Integer userId, Double totalAmount);
}

