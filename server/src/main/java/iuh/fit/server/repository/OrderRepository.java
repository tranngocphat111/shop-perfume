package iuh.fit.server.repository;

import iuh.fit.server.model.entity.Order;
import iuh.fit.server.model.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    // Find orders by user email (for guest orders) - with fetch join to avoid lazy initialization
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH oi.product LEFT JOIN FETCH o.payment LEFT JOIN FETCH o.shipment WHERE o.guestEmail = :email ORDER BY o.orderDate DESC")
    List<Order> findByGuestEmailOrderByOrderDateDesc(@Param("email") String email);
    
    // Find orders by user ID - with fetch join to avoid lazy initialization
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH oi.product LEFT JOIN FETCH o.payment LEFT JOIN FETCH o.shipment WHERE o.user.userId = :userId ORDER BY o.orderDate DESC")
    List<Order> findByUserIdOrderByOrderDateDesc(@Param("userId") Integer userId);


    @Query("SELECT SUM(o.totalAmount) FROM Order o join o.payment p where p.status = :status")
    double getTotalRevenue(@Param("status") PaymentStatus status);
}
