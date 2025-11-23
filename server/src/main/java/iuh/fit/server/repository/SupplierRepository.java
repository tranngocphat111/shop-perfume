package iuh.fit.server.repository;

import iuh.fit.server.model.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository interface cho Supplier entity
 * Spring Data JPA tự động implement các method
 */
@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Integer> {
    
    /**
     * Tìm kiếm nhà cung cấp theo tất cả các thuộc tính
     * Hỗ trợ tìm kiếm theo: supplierId, name, email, phone, address, createdBy, lastUpdatedBy
     */
    @Query("SELECT s FROM Supplier s WHERE " +
           "CAST(s.supplierId AS string) LIKE CONCAT('%', :searchTerm, '%') OR " +
           "LOWER(s.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(s.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(s.phone) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(s.address) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(s.createdBy) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(s.lastUpdatedBy) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Supplier> searchSuppliers(@Param("searchTerm") String searchTerm, Pageable pageable);
}
