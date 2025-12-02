package iuh.fit.server.repository;

import iuh.fit.server.model.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {
    // Tìm review theo user và product
    Optional<Review> findByUserUserIdAndProductProductId(Integer userId, Integer productId);
    
    // Tìm tất cả review của một sản phẩm
    List<Review> findByProductProductIdOrderByCreatedAtDesc(Integer productId);
    
    // Tìm tất cả review của một user
    List<Review> findByUserUserIdOrderByCreatedAtDesc(Integer userId);
    
    // Kiểm tra user đã đánh giá sản phẩm chưa
    boolean existsByUserUserIdAndProductProductId(Integer userId, Integer productId);
    
    // Kiểm tra user đã mua sản phẩm chưa (có order với status PAID)
    @Query("SELECT COUNT(oi) > 0 FROM OrderItem oi " +
           "JOIN oi.order o " +
           "JOIN o.payment p " +
           "WHERE o.user.userId = :userId " +
           "AND oi.product.productId = :productId " +
           "AND p.status = 'PAID'")
    boolean hasUserPurchasedProduct(@Param("userId") Integer userId, @Param("productId") Integer productId);
}

