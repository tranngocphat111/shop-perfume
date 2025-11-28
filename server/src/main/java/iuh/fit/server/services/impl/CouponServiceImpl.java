package iuh.fit.server.services.impl;

import iuh.fit.server.dto.request.CouponValidationRequest;
import iuh.fit.server.dto.response.CouponResponse;
import iuh.fit.server.dto.response.CouponValidationResponse;
import iuh.fit.server.model.entity.Coupon;
import iuh.fit.server.repository.CouponRepository;
import iuh.fit.server.services.CouponService;
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
public class CouponServiceImpl implements CouponService {
    
    private final CouponRepository couponRepository;
    
    @Override
    @Transactional(readOnly = true)
    public CouponValidationResponse validateCoupon(CouponValidationRequest request) {
        log.info("Validating coupon: code={}, totalAmount={}", request.getCode(), request.getTotalAmount());
        
        // Normalize code to uppercase
        String normalizedCode = request.getCode().trim().toUpperCase();
        Date currentDate = new Date();
        
        // Find coupon by code
        Optional<Coupon> couponOpt = couponRepository.findValidCouponByCode(normalizedCode, currentDate);
        
        if (couponOpt.isEmpty()) {
            log.warn("Coupon not found or expired: {}", normalizedCode);
            return new CouponValidationResponse(false, "Mã khuyến mãi không tồn tại hoặc đã hết hạn");
        }
        
        Coupon coupon = couponOpt.get();
        
        // Check if coupon is active
        if (!coupon.isActive()) {
            log.warn("Coupon is not active: {}", normalizedCode);
            return new CouponValidationResponse(false, "Mã khuyến mãi không còn hiệu lực");
        }
        
        // Check date validity
        if (currentDate.before(coupon.getStartDate())) {
            log.warn("Coupon not started yet: {}", normalizedCode);
            return new CouponValidationResponse(false, "Mã khuyến mãi chưa có hiệu lực");
        }
        
        if (currentDate.after(coupon.getEndDate())) {
            log.warn("Coupon expired: {}", normalizedCode);
            return new CouponValidationResponse(false, "Mã khuyến mãi đã hết hạn");
        }
        
        // Check minimum order value
        if (request.getTotalAmount() < coupon.getMinOrderValue()) {
            log.warn("Order total {} is less than minimum required {}", 
                    request.getTotalAmount(), coupon.getMinOrderValue());
            return new CouponValidationResponse(
                false, 
                String.format("Đơn hàng tối thiểu %.0f₫ để áp dụng mã này", coupon.getMinOrderValue())
            );
        }
        
        // Calculate discount
        double discountAmount = (request.getTotalAmount() * coupon.getDiscountPercent()) / 100.0;
        
        // Build success response
        CouponResponse couponResponse = convertToResponse(coupon);
        CouponValidationResponse response = new CouponValidationResponse();
        response.setValid(true);
        response.setMessage("Mã khuyến mãi hợp lệ");
        response.setCoupon(couponResponse);
        response.setDiscountAmount(discountAmount);
        
        log.info("Coupon validated successfully: code={}, discount={}%", 
                normalizedCode, coupon.getDiscountPercent());
        
        return response;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CouponResponse> getAvailableCoupons() {
        log.info("Fetching all available coupons");
        Date currentDate = new Date();
        List<Coupon> coupons = couponRepository.findAllActiveCoupons(currentDate);
        return coupons.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public CouponResponse getCouponByCode(String code) {
        log.info("Fetching coupon by code: {}", code);
        String normalizedCode = code.trim().toUpperCase();
        Optional<Coupon> couponOpt = couponRepository.findByCodeIgnoreCase(normalizedCode);
        return couponOpt.map(this::convertToResponse).orElse(null);
    }
    
    /**
     * Convert Coupon entity to CouponResponse DTO
     */
    private CouponResponse convertToResponse(Coupon coupon) {
        CouponResponse response = new CouponResponse();
        response.setCouponId(coupon.getCouponId());
        response.setCode(coupon.getCode());
        response.setDescription(coupon.getDescription());
        response.setDiscountPercent(coupon.getDiscountPercent());
        response.setMinOrderValue(coupon.getMinOrderValue());
        response.setStartDate(coupon.getStartDate());
        response.setEndDate(coupon.getEndDate());
        response.setActive(coupon.isActive());
        return response;
    }
}

