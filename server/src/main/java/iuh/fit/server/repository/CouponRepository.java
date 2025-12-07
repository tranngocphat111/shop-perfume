package iuh.fit.server.repository;

import iuh.fit.server.model.entity.Coupon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Integer> {

    /**
     * Find coupon by code (case-insensitive)
     */
    Optional<Coupon> findByCodeIgnoreCase(String code);

    /**
     * Find all active coupons that are currently valid (within date range)
     */
    @Query("SELECT c FROM Coupon c WHERE c.isActive = true AND c.startDate <= :currentDate AND c.endDate >= :currentDate")
    List<Coupon> findAllActiveCoupons(Date currentDate);

    /**
     * Check if coupon exists and is active
     */
    @Query("SELECT c FROM Coupon c WHERE UPPER(c.code) = UPPER(:code) AND c.isActive = true AND c.startDate <= :currentDate AND c.endDate >= :currentDate")
    Optional<Coupon> findValidCouponByCode(String code, Date currentDate);

    /**
     * Search coupons by code or description
     */
    Page<Coupon> findByCodeContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            String code, String description, Pageable pageable);
}
