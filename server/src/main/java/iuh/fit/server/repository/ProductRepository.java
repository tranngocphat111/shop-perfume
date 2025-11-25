package iuh.fit.server.repository;

import iuh.fit.server.model.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface cho Product entity
 * Spring Data JPA tự động implement các method
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    
    // Tìm kiếm sản phẩm theo tên (case-insensitive)
    List<Product> findByNameContainingIgnoreCase(String name);

    // Tìm theo category
    List<Product> findByCategoryCategoryId(int categoryId);

    // Tìm theo brand
    List<Product> findByBrandBrandId(int brandId);

    // Tìm theo khoảng giá
    List<Product> findByUnitPriceBetween(double minPrice, double maxPrice);

    /**
     * Tìm kiếm sản phẩm theo tất cả các thuộc tính
     * Hỗ trợ tìm kiếm theo: productId, name, description, perfumeLongevity, 
     * perfumeConcentration, releaseYear, columeMl, status, unitPrice, 
     * createdBy, lastUpdatedBy, brand.name, category.name
     */
    @Query("SELECT p FROM Product p WHERE " +
           "CAST(p.productId AS string) LIKE CONCAT('%', :searchTerm, '%') OR " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.perfumeLongevity) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.perfumeConcentration) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.releaseYear) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "CAST(p.columeMl AS string) LIKE CONCAT('%', :searchTerm, '%') OR " +
           "LOWER(CAST(p.status AS string)) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "CAST(p.unitPrice AS string) LIKE CONCAT('%', :searchTerm, '%') OR " +
           "LOWER(p.createdBy) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.lastUpdatedBy) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.brand.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.category.name) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Product> searchProducts(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Lọc sản phẩm theo brand, category và search term
     * Hỗ trợ filter kết hợp: có thể filter theo brand, category hoặc cả hai
     */
    @Query("SELECT p FROM Product p WHERE " +
           "(:brandId IS NULL OR p.brand.brandId = :brandId) AND " +
           "(:categoryId IS NULL OR p.category.categoryId = :categoryId) AND " +
           "(:searchTerm IS NULL OR :searchTerm = '' OR " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.brand.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.category.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Product> filterProducts(
        @Param("brandId") Integer brandId,
        @Param("categoryId") Integer categoryId,
        @Param("searchTerm") String searchTerm,
        Pageable pageable
    );
}
