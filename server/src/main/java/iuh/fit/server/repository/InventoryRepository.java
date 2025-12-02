package iuh.fit.server.repository;

import iuh.fit.server.model.entity.Inventory;
import iuh.fit.server.model.enums.Method;
import iuh.fit.server.model.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Integer> {

    // Tính tổng số lượng tồn kho của tất cả sản phẩm
    @Query("SELECT COALESCE(SUM(i.quantity), 0) FROM Inventory i")
    Long getTotalQuantity();

    // Đếm số sản phẩm hết hàng
    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.quantity = 0")
    Long countOutOfStock();

    // Đếm số sản phẩm sắp hết hàng (quantity <= 10)
    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.quantity > 0 AND i.quantity <= 10")
    Long countLowStock();

    // Lấy inventories theo danh sách product IDs, giữ nguyên thứ tự
    @Query("SELECT i FROM Inventory i WHERE i.product.productId IN :productIds")
    List<Inventory> findByProductIds(@Param("productIds") List<Integer> productIds);

    // Lấy inventory theo productId
    @Query("SELECT i FROM Inventory i WHERE i.product.productId = :productId")
    Inventory findByProductId(@Param("productId") Integer productId);

    @Query("SELECT COUNT(i.inventoryId) FROM Inventory i WHERE i.quantity < 20")
    Long getLowStockItem();

    /**
     * Tính số lượng hàng đang được reserve trong các đơn hàng pending
     * (chỉ tính các đơn hàng có payment status PENDING và payment method QR_CODE)
     */
    @Query("SELECT COALESCE(SUM(oi.quantity), 0) " +
           "FROM OrderItem oi " +
           "JOIN oi.order o " +
           "JOIN o.payment p " +
           "WHERE oi.product.productId = :productId " +
           "AND p.status = :paymentStatus " +
           "AND p.method = :paymentMethod")
    Long getReservedQuantityForProduct(
            @Param("productId") Integer productId,
            @Param("paymentStatus") PaymentStatus paymentStatus,
            @Param("paymentMethod") Method paymentMethod);
}

