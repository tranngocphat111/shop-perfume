package iuh.fit.server.repository;

import iuh.fit.server.model.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
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

    // Lấy inventory theo productId (không lock - dùng cho read-only)
    @Query("SELECT i FROM Inventory i WHERE i.product.productId = :productId")
    Inventory findByProductId(@Param("productId") Integer productId);
    
    // Lấy inventory theo productId với PESSIMISTIC_WRITE lock (dùng khi cần update)
    // Lock này đảm bảo chỉ 1 transaction có thể đọc và update tại 1 thời điểm
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.product.productId = :productId")
    Inventory findByProductIdWithLock(@Param("productId") Integer productId);

    @Query("SELECT COUNT(i.inventoryId) FROM Inventory i WHERE i.quantity < 20")
    Long getLowStockItem();
    
    Long countByQuantityLessThan(Integer quantity);
    
    List<Inventory> findByQuantityLessThanOrderByQuantityAsc(Integer quantity);
}

