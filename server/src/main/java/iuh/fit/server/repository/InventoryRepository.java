package iuh.fit.server.repository;

import iuh.fit.server.model.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

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
}

