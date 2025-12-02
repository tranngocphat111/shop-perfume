package iuh.fit.server.services;

import iuh.fit.server.dto.request.ReviewRequest;
import iuh.fit.server.dto.response.ReviewResponse;

import java.util.List;

public interface ReviewService {
    /**
     * Tạo review mới
     * @param userId ID của user
     * @param request Review request
     * @return Review response
     */
    ReviewResponse createReview(Integer userId, ReviewRequest request);
    
    /**
     * Lấy tất cả review của một sản phẩm
     * @param productId ID của sản phẩm
     * @return Danh sách review
     */
    List<ReviewResponse> getReviewsByProduct(Integer productId);
    
    /**
     * Lấy tất cả review của một user
     * @param userId ID của user
     * @return Danh sách review
     */
    List<ReviewResponse> getReviewsByUser(Integer userId);
    
    /**
     * Kiểm tra user đã đánh giá sản phẩm chưa
     * @param userId ID của user
     * @param productId ID của sản phẩm
     * @return true nếu đã đánh giá
     */
    boolean hasUserReviewedProduct(Integer userId, Integer productId);
    
    /**
     * Kiểm tra user đã mua sản phẩm chưa (có order với status PAID)
     * @param userId ID của user
     * @param productId ID của sản phẩm
     * @return true nếu đã mua
     */
    boolean hasUserPurchasedProduct(Integer userId, Integer productId);
}

