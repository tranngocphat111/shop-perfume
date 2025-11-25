package iuh.fit.server.repository;

import iuh.fit.server.model.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    // Find orders by user email (for guest orders)
    List<Order> findByGuestEmailOrderByOrderDateDesc(String email);
    
    // Find orders by user ID
    @Query("SELECT o FROM Order o WHERE o.user.userId = :userId ORDER BY o.orderDate DESC")
    List<Order> findByUserIdOrderByOrderDateDesc(@Param("userId") Integer userId);
}
