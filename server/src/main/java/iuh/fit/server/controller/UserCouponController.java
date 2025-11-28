package iuh.fit.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import iuh.fit.server.dto.response.UserCouponResponse;
import iuh.fit.server.services.UserCouponService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller xử lý các request liên quan đến User Coupon
 * URL: http://localhost:8080/api/user-coupons
 * Chỉ dành cho user đã đăng nhập
 */
@RestController
@RequestMapping("/user-coupons")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Coupon Management", description = "APIs for managing user's coupons")
public class UserCouponController {

    private final UserCouponService userCouponService;
    private final iuh.fit.server.repository.UserRepository userRepository;

    /**
     * GET /api/user-coupons/my-coupons - Lấy danh sách coupon có thể sử dụng của user
     * Requires authentication
     */
    @GetMapping("/my-coupons")
    @Operation(summary = "Get my available coupons", description = "Get all available coupons for current logged-in user")
    public ResponseEntity<List<UserCouponResponse>> getMyCoupons() {
        Integer userId = getCurrentUserId();
        if (userId == null) {
            log.warn("User not authenticated when trying to get coupons");
            return ResponseEntity.status(401).build();
        }
        
        log.info("REST request to get available coupons for user: {}", userId);
        List<UserCouponResponse> coupons = userCouponService.getAvailableCoupons(userId);
        return ResponseEntity.ok(coupons);
    }

    /**
     * POST /api/user-coupons/{userCouponId}/validate - Validate coupon trước khi sử dụng
     * Requires authentication
     */
    @PostMapping("/{userCouponId}/validate")
    @Operation(summary = "Validate user coupon", description = "Validate if user coupon can be used for the order")
    public ResponseEntity<UserCouponResponse> validateCoupon(
            @PathVariable Integer userCouponId,
            @RequestParam Double totalAmount) {
        Integer userId = getCurrentUserId();
        if (userId == null) {
            log.warn("User not authenticated when trying to validate coupon");
            return ResponseEntity.status(401).build();
        }
        
        log.info("REST request to validate coupon: userCouponId={}, userId={}, totalAmount={}", 
                userCouponId, userId, totalAmount);
        UserCouponResponse validation = userCouponService.validateUserCoupon(userCouponId, userId, totalAmount);
        return ResponseEntity.ok(validation);
    }

    /**
     * Helper method to get current user ID from security context
     */
    private Integer getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || 
            authentication.getPrincipal().equals("anonymousUser")) {
            log.debug("No authentication found");
            return null;
        }
        
        try {
            Object principal = authentication.getPrincipal();
            if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
                String email = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
                log.debug("Getting user ID for email: {}", email);
                
                // Lookup user by email to get userId
                return userRepository.findByEmail(email)
                        .map(iuh.fit.server.model.entity.User::getUserId)
                        .orElse(null);
            }
        } catch (Exception e) {
            log.error("Error getting user ID from security context", e);
        }
        return null;
    }
}

