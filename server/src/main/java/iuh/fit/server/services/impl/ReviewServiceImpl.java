package iuh.fit.server.services.impl;

import iuh.fit.server.dto.request.ReviewRequest;
import iuh.fit.server.dto.response.ReviewResponse;
import iuh.fit.server.exception.BadRequestException;
import iuh.fit.server.exception.ResourceNotFoundException;
import iuh.fit.server.mapper.ReviewMapper;
import iuh.fit.server.model.entity.Product;
import iuh.fit.server.model.entity.Review;
import iuh.fit.server.model.entity.User;
import iuh.fit.server.repository.ProductRepository;
import iuh.fit.server.repository.ReviewRepository;
import iuh.fit.server.repository.UserRepository;
import iuh.fit.server.services.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReviewServiceImpl implements ReviewService {
    
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ReviewMapper reviewMapper;
    
    @Override
    public ReviewResponse createReview(Integer userId, ReviewRequest request) {
        log.info("Creating review for user {} and product {}", userId, request.getProductId());
        
        // Validate user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        // Validate product exists
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));
        
        // Check if user has purchased the product
        if (!reviewRepository.hasUserPurchasedProduct(userId, request.getProductId())) {
            throw new BadRequestException("Bạn chỉ có thể đánh giá sản phẩm đã mua");
        }
        
        // Check if user has already reviewed this product
        if (reviewRepository.existsByUserUserIdAndProductProductId(userId, request.getProductId())) {
            throw new BadRequestException("Bạn đã đánh giá sản phẩm này rồi");
        }
        
        // Create review
        Review review = new Review();
        review.setUser(user);
        review.setProduct(product);
        review.setRating(request.getRating());
        review.setComment(request.getComment() != null ? request.getComment().trim() : null);
        
        Review savedReview = reviewRepository.save(review);
        log.info("Review created successfully with id: {}", savedReview.getReviewId());
        
        return reviewMapper.toResponse(savedReview);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByProduct(Integer productId) {
        log.info("Getting reviews for product {}", productId);
        List<Review> reviews = reviewRepository.findByProductProductIdOrderByCreatedAtDesc(productId);
        return reviews.stream()
                .map(reviewMapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByUser(Integer userId) {
        log.info("Getting reviews for user {}", userId);
        List<Review> reviews = reviewRepository.findByUserUserIdOrderByCreatedAtDesc(userId);
        return reviews.stream()
                .map(reviewMapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean hasUserReviewedProduct(Integer userId, Integer productId) {
        return reviewRepository.existsByUserUserIdAndProductProductId(userId, productId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean hasUserPurchasedProduct(Integer userId, Integer productId) {
        return reviewRepository.hasUserPurchasedProduct(userId, productId);
    }
}

