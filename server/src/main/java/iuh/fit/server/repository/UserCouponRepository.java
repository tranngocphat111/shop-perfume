package iuh.fit.server.repository;

import iuh.fit.server.model.entity.UserCoupon;
import iuh.fit.server.model.enums.CouponStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserCouponRepository extends JpaRepository<UserCoupon, Integer> {
    
    /**
     * Lấy tất cả coupon AVAILABLE của user
     */
    @Query("SELECT uc FROM UserCoupon uc " +
           "JOIN FETCH uc.coupon c " +
           "WHERE uc.user.userId = :userId " +
           "AND uc.status = 'AVAILABLE' " +
           "AND c.isActive = true " +
           "AND c.startDate <= :currentDate " +
           "AND c.endDate >= :currentDate " +
           "ORDER BY c.discountPercent DESC")
    List<UserCoupon> findAvailableCouponsByUserId(@Param("userId") Integer userId, @Param("currentDate") Date currentDate);
    
    /**
     * Lấy tất cả coupon của user (bao gồm cả đã dùng)
     */
    List<UserCoupon> findByUser_UserId(Integer userId);
    
    /**
     * Tìm UserCoupon cụ thể
     */
    @Query("SELECT uc FROM UserCoupon uc " +
           "JOIN FETCH uc.coupon c " +
           "WHERE uc.id = :userCouponId " +
           "AND uc.user.userId = :userId " +
           "AND uc.status = 'AVAILABLE'")
    Optional<UserCoupon> findAvailableUserCoupon(@Param("userCouponId") Integer userCouponId, @Param("userId") Integer userId);
    
    /**
     * Đếm số lượng coupon user đã nhận theo coupon_id
     */
    @Query("SELECT COUNT(uc) FROM UserCoupon uc WHERE uc.user.userId = :userId AND uc.coupon.couponId = :couponId")
    Long countByUserIdAndCouponId(@Param("userId") Integer userId, @Param("couponId") Integer couponId);
    
    /**
     * Kiểm tra user đã có coupon chưa
     */
    boolean existsByUser_UserIdAndCoupon_CouponId(Integer userId, Integer couponId);
}

