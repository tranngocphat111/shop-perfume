package iuh.fit.server.services;

import iuh.fit.server.dto.request.SupplierRequest;
import iuh.fit.server.dto.response.SupplierResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Interface định nghĩa các phương thức business logic cho Supplier
 */
public interface SupplierService {

    /**
     * Lấy tất cả nhà cung cấp
     */
    List<SupplierResponse> findAll();

    /**
     * Lấy nhà cung cấp có phân trang
     */
    Page<SupplierResponse> findAllPaginated(Pageable pageable);

    /**
     * Tìm kiếm nhà cung cấp theo tất cả các thuộc tính
     */
    Page<SupplierResponse> searchSuppliers(String searchTerm, Pageable pageable);

    /**
     * Tìm nhà cung cấp theo ID
     */
    SupplierResponse findById(int supplierId);

    /**
     * Tạo nhà cung cấp mới
     */
    SupplierResponse create(SupplierRequest request);

    /**
     * Cập nhật nhà cung cấp
     */
    SupplierResponse update(int supplierId, SupplierRequest request);

    /**
     * Xóa nhà cung cấp
     */
    void delete(int supplierId);
}
