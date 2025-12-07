package iuh.fit.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import iuh.fit.server.dto.request.CouponRequest;
import iuh.fit.server.dto.response.CouponResponse;
import iuh.fit.server.dto.response.CouponValidationResponse;
import iuh.fit.server.services.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
     * GET /api/coupons/available - Lấy tất cả coupons đang có hiệu lực (với check
     * điểm tích lũy nếu đã đăng nhập)
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

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * GET /api/coupons/admin - Get all coupons with pagination (ADMIN)
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all coupons", description = "Admin: Get all coupons with pagination and sorting")
    public ResponseEntity<Page<CouponResponse>> getAllCoupons(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "couponId") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        log.info("REST request to get all coupons: page={}, size={}, sortBy={}, direction={}",
                page, size, sortBy, direction);

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<CouponResponse> coupons = couponService.getAllCoupons(pageable);
        return ResponseEntity.ok(coupons);
    }

    /**
     * GET /api/coupons/admin/search - Search coupons (ADMIN)
     */
    @GetMapping("/admin/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search coupons", description = "Admin: Search coupons by code or description")
    public ResponseEntity<Page<CouponResponse>> searchCoupons(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "couponId") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        log.info("REST request to search coupons: query={}, page={}, size={}", query, page, size);

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<CouponResponse> coupons = couponService.searchCoupons(query, pageable);
        return ResponseEntity.ok(coupons);
    }

    /**
     * GET /api/coupons/admin/{id} - Get coupon by ID (ADMIN)
     */
    @GetMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get coupon by ID", description = "Admin: Get coupon details by ID")
    public ResponseEntity<CouponResponse> getCouponById(@PathVariable Integer id) {
        log.info("REST request to get coupon by ID: {}", id);
        try {
            CouponResponse coupon = couponService.getCouponById(id);
            return ResponseEntity.ok(coupon);
        } catch (RuntimeException e) {
            log.error("Error getting coupon: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * POST /api/coupons/admin - Create new coupon (ADMIN)
     */
    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create coupon", description = "Admin: Create a new coupon")
    public ResponseEntity<?> createCoupon(@Valid @RequestBody CouponRequest request) {
        log.info("REST request to create coupon: {}", request.getCode());
        try {
            CouponResponse createdCoupon = couponService.createCoupon(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdCoupon);
        } catch (RuntimeException e) {
            log.error("Error creating coupon: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * PUT /api/coupons/admin/{id} - Update coupon (ADMIN)
     */
    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update coupon", description = "Admin: Update an existing coupon")
    public ResponseEntity<?> updateCoupon(
            @PathVariable Integer id,
            @Valid @RequestBody CouponRequest request) {
        log.info("REST request to update coupon: {}", id);
        try {
            CouponResponse updatedCoupon = couponService.updateCoupon(id, request);
            return ResponseEntity.ok(updatedCoupon);
        } catch (RuntimeException e) {
            log.error("Error updating coupon: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * DELETE /api/coupons/admin/{id} - Delete coupon (ADMIN)
     */
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete coupon", description = "Admin: Delete a coupon")
    public ResponseEntity<?> deleteCoupon(@PathVariable Integer id) {
        log.info("REST request to delete coupon: {}", id);
        try {
            couponService.deleteCoupon(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting coupon: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
