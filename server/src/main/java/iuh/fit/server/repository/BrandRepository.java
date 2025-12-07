package iuh.fit.server.repository;

import iuh.fit.server.model.entity.Brand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Integer> {

    /**
     * Tìm kiếm brand theo tên hoặc quốc gia (không phân biệt hoa thường)
     */
    Page<Brand> findByNameContainingIgnoreCaseOrCountryContainingIgnoreCase(
            String name, String country, Pageable pageable);
}
