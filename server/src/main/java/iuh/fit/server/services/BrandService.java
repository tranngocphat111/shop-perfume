package iuh.fit.server.services;

import iuh.fit.server.dto.request.BrandRequest;
import iuh.fit.server.dto.response.BrandResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Interface định nghĩa các phương thức business logic cho Brand
 */
public interface BrandService {

    /**
     * Lấy tất cả brands
     */
    List<BrandResponse> findAll();

    /**
     * Lấy brands theo phân trang
     */
    Page<BrandResponse> findAllPaginated(Pageable pageable, String search);

    /**
     * Lấy brand theo ID
     */
    BrandResponse findById(int id);

    /**
     * Tạo brand mới
     */
    BrandResponse createBrand(BrandRequest request);

    /**
     * Cập nhật brand
     */
    BrandResponse updateBrand(int id, BrandRequest request);

    /**
     * Xóa brand (kiểm tra có sản phẩm ACTIVE hay không)
     */
    void deleteBrand(int id);
}
