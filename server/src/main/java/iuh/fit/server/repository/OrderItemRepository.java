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
     * @param limit Số lượng sản phẩm top bán chạy cần lấy
     * @return List của Object[] với [0] = productId, [1] = totalQuantity
     */
    @Query("SELECT oi.product.productId, SUM(oi.quantity) as totalQuantity " +
           "FROM OrderItem oi " +
           "GROUP BY oi.product.productId " +
           "ORDER BY totalQuantity DESC")
    List<Object[]> findBestSellingProducts();
    
    /**
     * Lấy danh sách product_id và tổng quantity đã bán với limit
     * @param limit Số lượng sản phẩm top bán chạy cần lấy
     * @return List của Object[] với [0] = productId, [1] = totalQuantity
     */
    @Query(value = "SELECT product_id, SUM(quantity) as total_quantity " +
           "FROM order_item " +
           "GROUP BY product_id " +
           "ORDER BY total_quantity DESC " +
           "LIMIT :limit", nativeQuery = true)
    List<Object[]> findBestSellingProductsWithLimit(@Param("limit") int limit);
}

