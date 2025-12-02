package iuh.fit.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import iuh.fit.server.dto.request.ReviewRequest;
import iuh.fit.server.dto.response.ReviewResponse;
import iuh.fit.server.repository.UserRepository;
import iuh.fit.server.services.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
@Slf4j
public class ReviewController {
    
    private final ReviewService reviewService;
    private final UserRepository userRepository;
    
    /**
     * POST /api/reviews - Tạo review mới
     * Chỉ user đã đăng nhập và đã mua sản phẩm mới có thể đánh giá
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create a new review", description = "Create a review for a product. User must have purchased the product.")
    public ResponseEntity<ReviewResponse> createReview(
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {
        log.info("REST request to create review for product {}", request.getProductId());
        
        // Get user ID from authentication
        Integer userId = getUserIdFromAuthentication(authentication);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        ReviewResponse response = reviewService.createReview(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * GET /api/reviews/product/{productId} - Lấy tất cả review của một sản phẩm
     */
    @GetMapping("/product/{productId}")
    @Operation(summary = "Get reviews by product", description = "Retrieve all reviews for a specific product")
    public ResponseEntity<List<ReviewResponse>> getReviewsByProduct(@PathVariable Integer productId) {
        log.info("REST request to get reviews for product {}", productId);
        List<ReviewResponse> reviews = reviewService.getReviewsByProduct(productId);
        return ResponseEntity.ok(reviews);
    }
    
    /**
     * GET /api/reviews/user/{userId} - Lấy tất cả review của một user
     */
    @GetMapping("/user/{userId}")
    @Operation(summary = "Get reviews by user", description = "Retrieve all reviews by a specific user")
    public ResponseEntity<List<ReviewResponse>> getReviewsByUser(@PathVariable Integer userId) {
        log.info("REST request to get reviews for user {}", userId);
        List<ReviewResponse> reviews = reviewService.getReviewsByUser(userId);
        return ResponseEntity.ok(reviews);
    }
    
    /**
     * GET /api/reviews/check/{productId} - Kiểm tra user đã đánh giá sản phẩm chưa
     */
    @GetMapping("/check/{productId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Check if user has reviewed product", description = "Check if the authenticated user has already reviewed a product")
    public ResponseEntity<Boolean> hasUserReviewedProduct(
            @PathVariable Integer productId,
            Authentication authentication) {
        log.info("REST request to check if user has reviewed product {}", productId);
        
        Integer userId = getUserIdFromAuthentication(authentication);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        boolean hasReviewed = reviewService.hasUserReviewedProduct(userId, productId);
        return ResponseEntity.ok(hasReviewed);
    }
    
    /**
     * Helper method to get user ID from authentication
     */
    private Integer getUserIdFromAuthentication(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            Optional<iuh.fit.server.model.entity.User> userOpt = userRepository.findByEmail(email);
            return userOpt.map(iuh.fit.server.model.entity.User::getUserId).orElse(null);
        } catch (Exception e) {
            log.warn("Error getting user ID from authentication", e);
            return null;
        }
    }
}

