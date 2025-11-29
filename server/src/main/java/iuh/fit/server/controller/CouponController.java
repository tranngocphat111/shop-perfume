package iuh.fit.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import iuh.fit.server.dto.response.CouponResponse;
import iuh.fit.server.dto.response.CouponValidationResponse;
import iuh.fit.server.services.CouponService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import iuh.fit.server.repository.UserRepository;

import java.util.List;
import java.util.Optional;

/**
 * REST Controller xử lý các request liên quan đến Coupon
 * URL: http://localhost:8080/api/coupons
 */
@RestController
@RequestMapping("/coupons")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Coupon Management", description = "APIs for managing coupons")
public class CouponController {

    private final CouponService couponService;
    private final UserRepository userRepository;

    /**
     * GET /api/coupons/available - Lấy tất cả coupons đang có hiệu lực (với check điểm tích lũy nếu đã đăng nhập)
     */
    @GetMapping("/available")
    @Operation(summary = "Get all available coupons", description = "Retrieve all active and valid coupons with loyalty points check")
    public ResponseEntity<List<CouponResponse>> getAvailableCoupons(Authentication authentication) {
        log.info("REST request to get all available coupons");
        
        Integer userId = null;
        if (authentication != null && authentication.isAuthenticated() && 
            !authentication.getPrincipal().equals("anonymousUser")) {
            try {
                UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                String email = userDetails.getUsername();
                Optional<iuh.fit.server.model.entity.User> userOpt = userRepository.findByEmail(email);
                if (userOpt.isPresent()) {
                    userId = userOpt.get().getUserId();
                }
            } catch (Exception e) {
                log.warn("Error getting user ID from authentication", e);
            }
        }
        
        List<CouponResponse> coupons = couponService.getAvailableCoupons(userId);
        return ResponseEntity.ok(coupons);
    }
    
    /**
     * POST /api/coupons/{couponId}/validate - Validate coupon với điểm tích lũy
     */
    @PostMapping("/{couponId}/validate")
    @Operation(summary = "Validate coupon with loyalty points", description = "Validate if user can use coupon based on loyalty points")
    public ResponseEntity<CouponValidationResponse> validateCoupon(
            @PathVariable Integer couponId,
            @RequestParam Double totalAmount,
            Authentication authentication) {
        log.info("REST request to validate coupon: couponId={}, totalAmount={}", couponId, totalAmount);
        
        Integer userId = null;
        if (authentication != null && authentication.isAuthenticated() && 
            !authentication.getPrincipal().equals("anonymousUser")) {
            try {
                UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                String email = userDetails.getUsername();
                Optional<iuh.fit.server.model.entity.User> userOpt = userRepository.findByEmail(email);
                if (userOpt.isPresent()) {
                    userId = userOpt.get().getUserId();
                }
            } catch (Exception e) {
                log.warn("Error getting user ID from authentication", e);
            }
        }
        
        CouponValidationResponse response = couponService.validateCouponWithPoints(couponId, userId, totalAmount);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/coupons/code/{code} - Lấy coupon theo mã
     */
    @GetMapping("/code/{code}")
    @Operation(summary = "Get coupon by code", description = "Retrieve coupon information by code")
    public ResponseEntity<CouponResponse> getCouponByCode(@PathVariable String code) {
        log.info("REST request to get coupon by code: {}", code);
        CouponResponse coupon = couponService.getCouponByCode(code);
        if (coupon == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(coupon);
    }
}

