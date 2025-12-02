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

    Long getLowStockItem();

    /**
     * Lấy tất cả sản phẩm
     */
    List<InventoryResponse> findAll();

    /**
     * Lấy sản phẩm có phân trang
     */
    Page<InventoryResponse> findAllPaginated(Pageable pageable);
    
    /**
     * Tìm kiếm inventory với phân trang
     * @param searchTerm Từ khóa tìm kiếm (hỗ trợ "ID xxx" để tìm theo inventory ID)
     * @param pageable Thông tin phân trang
     * @return Page inventory tìm được
     */
    Page<InventoryResponse> searchInventories(String searchTerm, Pageable pageable);

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

    /**
     * Tính số lượng hàng có sẵn (available stock)
     * = quantity trong inventory - số lượng đang reserve trong pending QR orders
     * @param productId ID của sản phẩm
     * @return Số lượng hàng có sẵn
     */
    Integer getAvailableStock(Integer productId);

}

