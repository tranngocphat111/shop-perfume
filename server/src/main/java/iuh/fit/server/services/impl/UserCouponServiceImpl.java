package iuh.fit.server.services.impl;

import iuh.fit.server.dto.response.UserCouponResponse;
import iuh.fit.server.model.entity.Coupon;
import iuh.fit.server.model.entity.Order;
import iuh.fit.server.model.entity.User;
import iuh.fit.server.model.entity.UserCoupon;
import iuh.fit.server.model.enums.CouponStatus;
import iuh.fit.server.repository.CouponRepository;
import iuh.fit.server.repository.OrderRepository;
import iuh.fit.server.repository.UserCouponRepository;
import iuh.fit.server.repository.UserRepository;
import iuh.fit.server.services.UserCouponService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserCouponServiceImpl implements UserCouponService {
    
    private final UserCouponRepository userCouponRepository;
    private final CouponRepository couponRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    
    @Override
    @Transactional(readOnly = true)
    public List<UserCouponResponse> getAvailableCoupons(Integer userId) {
        log.info("Getting available coupons for user: {}", userId);
        Date currentDate = new Date();
        List<UserCoupon> userCoupons = userCouponRepository.findAvailableCouponsByUserId(userId, currentDate);
        
        return userCoupons.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public boolean useCoupon(Integer userCouponId, Integer userId, Integer orderId) {
        log.info("Using coupon: userCouponId={}, userId={}, orderId={}", userCouponId, userId, orderId);
        
        Optional<UserCoupon> userCouponOpt = userCouponRepository.findAvailableUserCoupon(userCouponId, userId);
        if (userCouponOpt.isEmpty()) {
            log.warn("UserCoupon not found or not available: {}", userCouponId);
            return false;
        }
        
        UserCoupon userCoupon = userCouponOpt.get();
        
        // Get order
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            log.warn("Order not found: {}", orderId);
            return false;
        }
        
        // Mark as used
        userCoupon.setStatus(CouponStatus.USED);
        userCoupon.setUsedAt(new Date());
        userCoupon.setOrder(orderOpt.get());
        userCouponRepository.save(userCoupon);
        
        log.info("Coupon used successfully: {}", userCouponId);
        return true;
    }
    
    @Override
    @Transactional
    public boolean giveCouponToUser(Integer userId, Integer couponId) {
        log.info("Giving coupon to user: userId={}, couponId={}", userId, couponId);
        
        // Check if user exists
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.warn("User not found: {}", userId);
            return false;
        }
        
        // Check if coupon exists
        Optional<Coupon> couponOpt = couponRepository.findById(couponId);
        if (couponOpt.isEmpty() || !couponOpt.get().isActive()) {
            log.warn("Coupon not found or inactive: {}", couponId);
            return false;
        }
        
        Coupon coupon = couponOpt.get();
        
        // Check max per user limit
        if (coupon.getMaxPerUser() != null) {
            Long currentCount = userCouponRepository.countByUserIdAndCouponId(userId, couponId);
            if (currentCount >= coupon.getMaxPerUser()) {
                log.warn("User has reached max limit for this coupon: userId={}, couponId={}, limit={}", 
                        userId, couponId, coupon.getMaxPerUser());
                return false;
            }
        }
        
        // Create new UserCoupon
        UserCoupon userCoupon = new UserCoupon();
        userCoupon.setUser(userOpt.get());
        userCoupon.setCoupon(coupon);
        userCoupon.setStatus(CouponStatus.AVAILABLE);
        userCoupon.setReceivedAt(new Date());
        
        userCouponRepository.save(userCoupon);
        log.info("Coupon given successfully to user: userId={}, couponId={}", userId, couponId);
        return true;
    }
    
    @Override
    @Transactional
    public void autoGiveCouponsAfterOrder(Integer userId, Double orderValue) {
        log.info("Auto giving coupons after order: userId={}, orderValue={}", userId, orderValue);
        
        // Find all coupons with trigger condition
        Date currentDate = new Date();
        List<Coupon> eligibleCoupons = couponRepository.findAll().stream()
                .filter(c -> c.isActive())
                .filter(c -> c.getTriggerOrderValue() != null)
                .filter(c -> c.getTriggerOrderValue() <= orderValue)
                .filter(c -> c.getStartDate().before(currentDate) && c.getEndDate().after(currentDate))
                .collect(Collectors.toList());
        
        for (Coupon coupon : eligibleCoupons) {
            // Check if user already has this coupon or reached limit
            Long currentCount = userCouponRepository.countByUserIdAndCouponId(userId, coupon.getCouponId());
            
            if (coupon.getMaxPerUser() == null || currentCount < coupon.getMaxPerUser()) {
                boolean success = giveCouponToUser(userId, coupon.getCouponId());
                if (success) {
                    log.info("Auto gave coupon {} to user {}", coupon.getCode(), userId);
                }
            }
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public UserCouponResponse validateUserCoupon(Integer userCouponId, Integer userId, Double totalAmount) {
        log.info("Validating user coupon: userCouponId={}, userId={}, totalAmount={}", 
                userCouponId, userId, totalAmount);
        
        Optional<UserCoupon> userCouponOpt = userCouponRepository.findAvailableUserCoupon(userCouponId, userId);
        
        if (userCouponOpt.isEmpty()) {
            UserCouponResponse response = new UserCouponResponse();
            response.setValid(false);
            response.setMessage("Mã giảm giá không tồn tại hoặc đã được sử dụng");
            return response;
        }
        
        UserCoupon userCoupon = userCouponOpt.get();
        Coupon coupon = userCoupon.getCoupon();
        Date currentDate = new Date();
        
        // Validate date
        if (currentDate.before(coupon.getStartDate())) {
            UserCouponResponse response = convertToResponse(userCoupon);
            response.setValid(false);
            response.setMessage("Mã giảm giá chưa có hiệu lực");
            return response;
        }
        
        if (currentDate.after(coupon.getEndDate())) {
            UserCouponResponse response = convertToResponse(userCoupon);
            response.setValid(false);
            response.setMessage("Mã giảm giá đã hết hạn");
            return response;
        }
        
        // Validate minimum order value
        if (totalAmount < coupon.getMinOrderValue()) {
            UserCouponResponse response = convertToResponse(userCoupon);
            response.setValid(false);
            response.setMessage(String.format("Đơn hàng tối thiểu %.0f₫ để sử dụng mã này", 
                    coupon.getMinOrderValue()));
            return response;
        }
        
        // Calculate discount
        double discountAmount = (totalAmount * coupon.getDiscountPercent()) / 100.0;
        
        UserCouponResponse response = convertToResponse(userCoupon);
        response.setValid(true);
        response.setMessage("Mã giảm giá hợp lệ");
        response.setDiscountAmount(discountAmount);
        
        return response;
    }
    
    /**
     * Convert UserCoupon entity to UserCouponResponse DTO
     */
    private UserCouponResponse convertToResponse(UserCoupon userCoupon) {
        Coupon coupon = userCoupon.getCoupon();
        UserCouponResponse response = new UserCouponResponse();
        response.setUserCouponId(userCoupon.getId());
        response.setCouponId(coupon.getCouponId());
        response.setCode(coupon.getCode());
        response.setDescription(coupon.getDescription());
        response.setDiscountPercent(coupon.getDiscountPercent());
        response.setMinOrderValue(coupon.getMinOrderValue());
        response.setStartDate(coupon.getStartDate());
        response.setEndDate(coupon.getEndDate());
        response.setStatus(userCoupon.getStatus().name());
        response.setReceivedAt(userCoupon.getReceivedAt());
        response.setUsedAt(userCoupon.getUsedAt());
        return response;
    }
}

