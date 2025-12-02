package iuh.fit.server.repository;

import iuh.fit.server.model.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
    
    /**
     * Lấy danh sách product_id và tổng quantity đã bán, sắp xếp theo quantity giảm dần
     * Chỉ tính các đơn hàng có trạng thái thanh toán thành công (PAID)
     * @param limit Số lượng sản phẩm top bán chạy cần lấy
     * @return List của Object[] với [0] = productId, [1] = totalQuantity
     */
    @Query("SELECT oi.product.productId, SUM(oi.quantity) as totalQuantity " +
           "FROM OrderItem oi " +
           "JOIN oi.order o " +
           "JOIN o.payment p " +
           "WHERE p.status = 'PAID' " +
           "GROUP BY oi.product.productId " +
           "ORDER BY totalQuantity DESC")
    List<Object[]> findBestSellingProducts();
    
    /**
     * Lấy danh sách product_id và tổng quantity đã bán với limit
     * Chỉ tính các đơn hàng có trạng thái thanh toán thành công (PAID)
     * @param limit Số lượng sản phẩm top bán chạy cần lấy
     * @return List của Object[] với [0] = productId, [1] = totalQuantity
     */
    @Query(value = "SELECT oi.product_id, SUM(oi.quantity) as total_quantity " +
           "FROM order_item oi " +
           "INNER JOIN `order` o ON oi.order_id = o.order_id " +
           "INNER JOIN payment p ON o.order_id = p.order_id " +
           "WHERE p.status = 'PAID' " +
           "GROUP BY oi.product_id " +
           "ORDER BY total_quantity DESC " +
           "LIMIT :limit", nativeQuery = true)
    List<Object[]> findBestSellingProductsWithLimit(@Param("limit") int limit);
}

