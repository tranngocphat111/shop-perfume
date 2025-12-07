package iuh.fit.server.services.impl;

import iuh.fit.server.dto.request.CouponRequest;
import iuh.fit.server.dto.request.CouponValidationRequest;
import iuh.fit.server.dto.response.CouponResponse;
import iuh.fit.server.dto.response.CouponValidationResponse;
import iuh.fit.server.model.entity.Coupon;
import iuh.fit.server.model.entity.User;
import iuh.fit.server.repository.CouponRepository;
import iuh.fit.server.repository.OrderRepository;
import iuh.fit.server.repository.UserRepository;
import iuh.fit.server.services.CouponService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

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

        // Không cần check minimum order value nữa - coupon áp dụng cho tất cả đơn hàng

        // Calculate discount
        double discountAmount = (request.getTotalAmount() * coupon.getDiscountPercent()) / 100.0;

        // Build success response
        CouponResponse couponResponse = convertToResponse(coupon, null);
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
                .map(c -> convertToResponse(c, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CouponResponse> getAvailableCoupons(Integer userId) {
        log.info("Fetching all available coupons for user: {}", userId);
        Date currentDate = new Date();
        List<Coupon> coupons = couponRepository.findAllActiveCoupons(currentDate);

        Integer userPoints = 0;
        boolean hasPlacedOrder = false;
        if (userId != null) {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                userPoints = userOpt.get().getLoyaltyPoints();
                hasPlacedOrder = orderRepository.hasUserPlacedOrder(userId);
            }
        }

        final Integer finalUserPoints = userPoints;
        final boolean finalHasPlacedOrder = hasPlacedOrder;

        return coupons.stream()
                .filter(c -> {
                    // Filter WELCOME5: chỉ hiển thị cho user chưa từng đặt hàng và chưa sử dụng
                    if ("WELCOME5".equalsIgnoreCase(c.getCode())) {
                        if (userId == null) {
                            return false; // Guest không được dùng
                        }
                        // Nếu user đã đặt hàng hoặc đã sử dụng WELCOME5 thì không hiển thị
                        if (finalHasPlacedOrder || orderRepository.hasUserUsedCoupon(userId, c.getCouponId())) {
                            log.info("Filtering WELCOME5 for user {}: hasPlacedOrder={}, hasUsedCoupon={}",
                                    userId, finalHasPlacedOrder,
                                    orderRepository.hasUserUsedCoupon(userId, c.getCouponId()));
                            return false;
                        }
                    }
                    return true;
                })
                .map(c -> convertToResponse(c, finalUserPoints))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CouponResponse getCouponByCode(String code) {
        log.info("Fetching coupon by code: {}", code);
        String normalizedCode = code.trim().toUpperCase();
        Optional<Coupon> couponOpt = couponRepository.findByCodeIgnoreCase(normalizedCode);
        return couponOpt.map(c -> convertToResponse(c, null)).orElse(null);
    }

    /**
     * Convert Coupon entity to CouponResponse DTO
     */
    private CouponResponse convertToResponse(Coupon coupon, Integer userPoints) {
        CouponResponse response = new CouponResponse();
        response.setCouponId(coupon.getCouponId());
        response.setCode(coupon.getCode());
        response.setDescription(coupon.getDescription());
        response.setDiscountPercent(coupon.getDiscountPercent());
        response.setRequiredPoints(coupon.getRequiredPoints() != null ? coupon.getRequiredPoints() : 0);
        response.setStartDate(coupon.getStartDate());
        response.setEndDate(coupon.getEndDate());
        response.setActive(coupon.isActive());

        // Audit fields
        response.setCreatedAt(coupon.getCreatedAt());
        response.setLastUpdated(coupon.getLastUpdated());
        response.setCreatedBy(coupon.getCreatedBy());
        response.setLastUpdatedBy(coupon.getLastUpdatedBy());

        // Check if user can use this coupon (has enough points)
        if (userPoints != null) {
            response.setCanUse(userPoints >= response.getRequiredPoints());
        } else {
            response.setCanUse(false);
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public CouponValidationResponse validateCouponWithPoints(Integer couponId, Integer userId, Double totalAmount) {
        log.info("Validating coupon with points: couponId={}, userId={}, totalAmount={}",
                couponId, userId, totalAmount);

        Optional<Coupon> couponOpt = couponRepository.findById(couponId);
        if (couponOpt.isEmpty()) {
            return new CouponValidationResponse(false, "Mã giảm giá không tồn tại");
        }

        Coupon coupon = couponOpt.get();
        Date currentDate = new Date();

        // Check if coupon is active
        if (!coupon.isActive()) {
            return new CouponValidationResponse(false, "Mã giảm giá không còn hiệu lực");
        }

        // Check date validity
        if (currentDate.before(coupon.getStartDate()) || currentDate.after(coupon.getEndDate())) {
            return new CouponValidationResponse(false, "Mã giảm giá không còn hiệu lực");
        }

        // Không cần check minimum order value nữa - coupon áp dụng cho tất cả đơn hàng

        // Check user's loyalty points
        if (userId == null) {
            return new CouponValidationResponse(false, "Vui lòng đăng nhập để sử dụng mã giảm giá");
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return new CouponValidationResponse(false, "Người dùng không tồn tại");
        }

        User user = userOpt.get();
        int requiredPoints = coupon.getRequiredPoints() != null ? coupon.getRequiredPoints() : 0;

        if (user.getLoyaltyPoints() < requiredPoints) {
            return new CouponValidationResponse(
                    false,
                    String.format("Bạn cần %d điểm để sử dụng mã này. Hiện tại bạn có %d điểm",
                            requiredPoints, user.getLoyaltyPoints()));
        }

        // Calculate discount
        double discountAmount = (totalAmount * coupon.getDiscountPercent()) / 100.0;

        // Build success response
        CouponResponse couponResponse = convertToResponse(coupon, user.getLoyaltyPoints());
        CouponValidationResponse response = new CouponValidationResponse();
        response.setValid(true);
        response.setMessage("Mã khuyến mãi hợp lệ");
        response.setCoupon(couponResponse);
        response.setDiscountAmount(discountAmount);

        log.info("Coupon validated successfully: couponId={}, discount={}%",
                couponId, coupon.getDiscountPercent());

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CouponResponse> getAllCoupons(Pageable pageable) {
        log.info("Fetching all coupons with pagination");
        Page<Coupon> coupons = couponRepository.findAll(pageable);
        return coupons.map(c -> convertToResponse(c, null));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CouponResponse> searchCoupons(String query, Pageable pageable) {
        log.info("Searching coupons with query: {}", query);
        Page<Coupon> coupons = couponRepository
                .findByCodeContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query, pageable);
        return coupons.map(c -> convertToResponse(c, null));
    }

    @Override
    @Transactional(readOnly = true)
    public CouponResponse getCouponById(Integer id) {
        log.info("Fetching coupon by ID: {}", id);
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found with ID: " + id));
        return convertToResponse(coupon, null);
    }

    @Override
    @Transactional
    public CouponResponse createCoupon(CouponRequest request) {
        log.info("Creating new coupon with code: {}", request.getCode());

        // Check if code already exists
        String normalizedCode = request.getCode().trim().toUpperCase();
        if (couponRepository.findByCodeIgnoreCase(normalizedCode).isPresent()) {
            throw new RuntimeException("Coupon code already exists: " + normalizedCode);
        }

        // Validate dates
        if (request.getEndDate().before(request.getStartDate())) {
            throw new RuntimeException("End date must be after start date");
        }

        Coupon coupon = new Coupon();
        coupon.setCode(normalizedCode);
        coupon.setDescription(request.getDescription());
        coupon.setDiscountPercent(request.getDiscountPercent());
        coupon.setRequiredPoints(request.getRequiredPoints());
        coupon.setStartDate(request.getStartDate());
        coupon.setEndDate(request.getEndDate());
        coupon.setActive(request.getIsActive());

        Coupon savedCoupon = couponRepository.save(coupon);
        log.info("Coupon created successfully with ID: {}", savedCoupon.getCouponId());

        return convertToResponse(savedCoupon, null);
    }

    @Override
    @Transactional
    public CouponResponse updateCoupon(Integer id, CouponRequest request) {
        log.info("Updating coupon with ID: {}", id);

        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found with ID: " + id));

        // Check if code is being changed and new code already exists
        String normalizedCode = request.getCode().trim().toUpperCase();
        if (!coupon.getCode().equalsIgnoreCase(normalizedCode)) {
            if (couponRepository.findByCodeIgnoreCase(normalizedCode).isPresent()) {
                throw new RuntimeException("Coupon code already exists: " + normalizedCode);
            }
            coupon.setCode(normalizedCode);
        }

        // Validate dates
        if (request.getEndDate().before(request.getStartDate())) {
            throw new RuntimeException("End date must be after start date");
        }

        coupon.setDescription(request.getDescription());
        coupon.setDiscountPercent(request.getDiscountPercent());
        coupon.setRequiredPoints(request.getRequiredPoints());
        coupon.setStartDate(request.getStartDate());
        coupon.setEndDate(request.getEndDate());
        coupon.setActive(request.getIsActive());

        Coupon updatedCoupon = couponRepository.save(coupon);
        log.info("Coupon updated successfully with ID: {}", updatedCoupon.getCouponId());

        return convertToResponse(updatedCoupon, null);
    }

    @Override
    @Transactional
    public void deleteCoupon(Integer id) {
        log.info("Deleting coupon with ID: {}", id);

        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found with ID: " + id));

        // Check if coupon has been used in any orders
        if (orderRepository.existsByCoupon_CouponId(id)) {
            throw new RuntimeException("Cannot delete coupon that has been used in orders");
        }

        couponRepository.delete(coupon);
        log.info("Coupon deleted successfully with ID: {}", id);
    }
}
