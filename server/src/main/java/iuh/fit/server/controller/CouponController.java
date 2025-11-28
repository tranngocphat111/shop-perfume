package iuh.fit.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import iuh.fit.server.dto.response.CouponResponse;
import iuh.fit.server.services.CouponService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    /**
     * GET /api/coupons/available - Lấy tất cả coupons đang có hiệu lực
     */
    @GetMapping("/available")
    @Operation(summary = "Get all available coupons", description = "Retrieve all active and valid coupons")
    public ResponseEntity<List<CouponResponse>> getAvailableCoupons() {
        log.info("REST request to get all available coupons");
        List<CouponResponse> coupons = couponService.getAvailableCoupons();
        return ResponseEntity.ok(coupons);
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

