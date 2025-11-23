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
     * Tìm sản phẩm theo ID
     */

}

