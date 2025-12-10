package iuh.fit.server.repository;

import iuh.fit.server.model.entity.Order;
import iuh.fit.server.model.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
       // Find orders by user email (for guest orders) - with fetch join to avoid lazy
       // initialization
       @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH oi.product LEFT JOIN FETCH o.payment LEFT JOIN FETCH o.shipment WHERE o.guestEmail = :email ORDER BY o.orderDate DESC")
       List<Order> findByGuestEmailOrderByOrderDateDesc(@Param("email") String email);

       // Find orders by user ID - with fetch join to avoid lazy initialization
       @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH oi.product LEFT JOIN FETCH o.payment LEFT JOIN FETCH o.shipment WHERE o.user.userId = :userId ORDER BY o.orderDate DESC")
       List<Order> findByUserIdOrderByOrderDateDesc(@Param("userId") Integer userId);

       @Query("SELECT SUM(o.totalAmount) FROM Order o join o.payment p where p.status = :status")
       double getTotalRevenue(@Param("status") PaymentStatus status);

       /**
        * Tính tổng tiền đã mua của user (chỉ tính các đơn đã thanh toán)
        */
       @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o " +
                     "JOIN o.payment p " +
                     "WHERE o.user.userId = :userId AND p.status = :status")
       Double getTotalSpentByUser(@Param("userId") Integer userId, @Param("status") PaymentStatus status);

       /**
        * Kiểm tra user đã có đơn hàng chưa
        */
       @Query("SELECT COUNT(o) > 0 FROM Order o WHERE o.user.userId = :userId")
       boolean hasUserPlacedOrder(@Param("userId") Integer userId);

       @Query("SELECT COUNT(o) FROM Order o join o.payment p WHERE p.status = :paymentStatus")
       Long getSizeOfOrdersHaveStatus(@PathVariable("paymentStatus") PaymentStatus paymentStatus);

       /**
        * Count orders placed after a specific date
        */
       @Query("SELECT COUNT(o) FROM Order o WHERE o.orderDate >= :date")
       Long countByOrderDateAfter(@Param("date") java.sql.Timestamp date);

       /**
        * Get revenue and order count by month for a specific year
        */
       @Query("SELECT MONTH(o.orderDate) as month, " +
                     "COALESCE(SUM(o.totalAmount), 0) as revenue, " +
                     "COUNT(o) as orderCount " +
                     "FROM Order o JOIN o.payment p " +
                     "WHERE YEAR(o.orderDate) = :year AND p.status = :status " +
                     "GROUP BY MONTH(o.orderDate) " +
                     "ORDER BY MONTH(o.orderDate)")
       List<Object[]> getMonthlyRevenueStats(@Param("year") Integer year, @Param("status") PaymentStatus status);

       /**
        * Get revenue and order count by quarter for a specific year
        */
       @Query("SELECT QUARTER(o.orderDate) as quarter, " +
                     "COALESCE(SUM(o.totalAmount), 0) as revenue, " +
                     "COUNT(o) as orderCount " +
                     "FROM Order o JOIN o.payment p " +
                     "WHERE YEAR(o.orderDate) = :year AND p.status = :status " +
                     "GROUP BY QUARTER(o.orderDate) " +
                     "ORDER BY QUARTER(o.orderDate)")
       List<Object[]> getQuarterlyRevenueStats(@Param("year") Integer year, @Param("status") PaymentStatus status);

       /**
        * Get revenue and order count by year
        */
       @Query("SELECT YEAR(o.orderDate) as year, " +
                     "COALESCE(SUM(o.totalAmount), 0) as revenue, " +
                     "COUNT(o) as orderCount " +
                     "FROM Order o JOIN o.payment p " +
                     "WHERE p.status = :status " +
                     "GROUP BY YEAR(o.orderDate) " +
                     "ORDER BY YEAR(o.orderDate)")
       List<Object[]> getYearlyRevenueStats(@Param("status") PaymentStatus status);

       /**
        * Get top selling products
        */
       @Query("SELECT p.productId, p.name, b.name, " +
                     "SUM(oi.quantity) as totalSold, " +
                     "SUM(oi.subTotal) as revenue, " +
                     "p.unitPrice, p.columeMl, i.quantity " +
                     "FROM OrderItem oi " +
                     "JOIN oi.product p " +
                     "JOIN p.brand b " +
                     "LEFT JOIN Inventory i ON i.product.productId = p.productId " +
                     "JOIN oi.order o " +
                     "JOIN o.payment pay " +
                     "WHERE pay.status = :status " +
                     "GROUP BY p.productId, p.name, b.name, p.unitPrice, p.columeMl, i.quantity " +
                     "ORDER BY totalSold DESC")
       List<Object[]> getTopSellingProducts(@Param("status") PaymentStatus status,
                     org.springframework.data.domain.Pageable pageable);

       /**
        * Get recent orders with limit
        */
       @Query("SELECT DISTINCT o FROM Order o " +
                     "LEFT JOIN FETCH o.orderItems oi " +
                     "LEFT JOIN FETCH oi.product " +
                     "LEFT JOIN FETCH o.payment " +
                     "LEFT JOIN FETCH o.user " +
                     "ORDER BY o.orderDate DESC")
       List<Order> findTopByOrderByOrderDateDesc(org.springframework.data.domain.Pageable pageable);

       /**
        * Get category distribution
        */
       @Query("SELECT c.name, COUNT(DISTINCT o.orderId), SUM(oi.subTotal) " +
                     "FROM OrderItem oi " +
                     "JOIN oi.product p " +
                     "JOIN p.category c " +
                     "JOIN oi.order o " +
                     "JOIN o.payment pay " +
                     "WHERE pay.status = :status " +
                     "AND (:startDate IS NULL OR o.orderDate >= :startDate) " +
                     "AND (:endDate IS NULL OR o.orderDate <= :endDate) " +
                     "GROUP BY c.categoryId, c.name " +
                     "ORDER BY SUM(oi.subTotal) DESC")
       List<Object[]> getCategoryDistribution(@Param("status") PaymentStatus status,
                     @Param("startDate") java.sql.Timestamp startDate,
                     @Param("endDate") java.sql.Timestamp endDate);

       /**
        * Get top selling brands
        */
       @Query("SELECT b.name, " +
                     "SUM(oi.quantity) as totalSold, " +
                     "SUM(oi.subTotal) as revenue " +
                     "FROM OrderItem oi " +
                     "JOIN oi.product p " +
                     "JOIN p.brand b " +
                     "JOIN oi.order o " +
                     "JOIN o.payment pay " +
                     "WHERE pay.status = :status " +
                     "AND (:startDate IS NULL OR o.orderDate >= :startDate) " +
                     "AND (:endDate IS NULL OR o.orderDate <= :endDate) " +
                     "GROUP BY b.brandId, b.name " +
                     "ORDER BY revenue DESC")
       List<Object[]> getTopBrands(@Param("status") PaymentStatus status,
                     @Param("startDate") java.sql.Timestamp startDate,
                     @Param("endDate") java.sql.Timestamp endDate,
                     org.springframework.data.domain.Pageable pageable);

       // Search orders by guest name, email, phone, or orderId
       @Query("SELECT o FROM Order o LEFT JOIN o.payment p WHERE " +
                     "LOWER(o.guestName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
                     "LOWER(o.guestEmail) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
                     "LOWER(o.guestPhone) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
                     "CAST(o.orderId AS string) LIKE CONCAT('%', :searchTerm, '%')")
       Page<Order> searchOrders(@Param("searchTerm") String searchTerm, Pageable pageable);

       /**
        * Count orders between date range
        */
       @Query("SELECT COUNT(o) FROM Order o WHERE o.orderDate BETWEEN :startDate AND :endDate")
       Long countByOrderDateBetween(@Param("startDate") java.sql.Timestamp startDate,
                                     @Param("endDate") java.sql.Timestamp endDate);

       /**
        * Get total revenue by date range and payment status
        */
       @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o JOIN o.payment p " +
              "WHERE p.status = :status AND o.orderDate BETWEEN :startDate AND :endDate")
       Double getTotalRevenueByDateRange(@Param("status") PaymentStatus status,
                                         @Param("startDate") java.sql.Timestamp startDate,
                                         @Param("endDate") java.sql.Timestamp endDate);

       /**
        * Count orders by payment status and date range
        */
       @Query("SELECT COUNT(o) FROM Order o JOIN o.payment p " +
              "WHERE p.status = :status AND o.orderDate BETWEEN :startDate AND :endDate")
       Long countByPaymentStatusAndOrderDateBetween(@Param("status") PaymentStatus status,
                                                     @Param("startDate") java.sql.Timestamp startDate,
                                                     @Param("endDate") java.sql.Timestamp endDate);
}
