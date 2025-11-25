package iuh.fit.server.services;

import iuh.fit.server.dto.request.ProductRequest;
import iuh.fit.server.dto.response.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Interface định nghĩa các phương thức business logic cho Product
 */
public interface ProductService {

    /**
     * Lấy tất cả sản phẩm
     */
    List<ProductResponse> findAll();

    /**
     * Lấy sản phẩm có phân trang
     */
    Page<ProductResponse> findAllPaginated(Pageable pageable);

    /**
     * Tìm kiếm sản phẩm theo tất cả các thuộc tính
     */
    Page<ProductResponse> searchProducts(String searchTerm, Pageable pageable);

    /**
     * Tìm sản phẩm theo ID
     */
    ProductResponse findById(int productId);

    /**
     * Tạo sản phẩm mới
     */
    ProductResponse create(ProductRequest request);

    /**
     * Tạo sản phẩm mới kèm upload ảnh
     */
    ProductResponse createWithImages(ProductRequest request, List<MultipartFile> images, int primaryImageIndex);

    /**
     * Cập nhật sản phẩm
     */
    ProductResponse update(int productId, ProductRequest request);

    /**
     * Cập nhật sản phẩm kèm quản lý ảnh
     */
    ProductResponse updateWithImages(int productId, ProductRequest request, List<MultipartFile> newImages, List<Integer> imagesToDelete, Integer primaryImageId);

    /**
     * Xóa sản phẩm
     */
    void delete(int productId);

    /**
     * Lấy danh sách sản phẩm bán chạy nhất dựa trên tổng quantity từ order_item
     * @param limit Số lượng sản phẩm cần lấy (mặc định 20)
     * @return Danh sách sản phẩm bán chạy nhất
     */
    List<ProductResponse> findBestSellers(int limit);

    /**
     * Lọc sản phẩm theo brand, category và search term
     */
    Page<ProductResponse> filterProducts(Integer brandId, Integer categoryId, String searchTerm, Pageable pageable);

}

