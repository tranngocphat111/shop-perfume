package iuh.fit.server.services;

import iuh.fit.server.dto.response.InventoryResponse;
import iuh.fit.server.dto.response.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Interface định nghĩa các phương thức business logic cho Product
 */
public interface InventoryService {

    /**
     * Lấy tất cả sản phẩm
     */
    List<InventoryResponse> findAll();

    /**
     * Lấy sản phẩm có phân trang
     */
    Page<InventoryResponse> findAllPaginated(Pageable pageable);

    /**
     * Tìm inventory theo ID
     * @param inventoryId ID của inventory
     * @return InventoryResponse hoặc null nếu không tìm thấy
     */
    InventoryResponse findById(Integer inventoryId);

    /**
     * Lấy danh sách sản phẩm bán chạy nhất dựa trên tổng quantity từ order_item
     * @param limit Số lượng sản phẩm cần lấy (mặc định 20)
     * @return Danh sách inventory của sản phẩm bán chạy nhất
     */
    List<InventoryResponse> findBestSellers(int limit);

    /**
     * Tìm inventory theo productId
     * @param productId ID của sản phẩm
     * @return InventoryResponse hoặc null nếu không tìm thấy
     */
    InventoryResponse findByProductId(Integer productId);

    /**
     * Cập nhật số lượng tồn kho
     * @param inventoryId ID của inventory
     * @param quantity Số lượng mới
     * @return InventoryResponse đã cập nhật
     */
    InventoryResponse updateQuantity(Integer inventoryId, Integer quantity);

}

