package iuh.fit.server.repository;

import iuh.fit.server.model.entity.PurchaseInvoiceDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface PurchaseInvoiceDetailRepository extends JpaRepository<PurchaseInvoiceDetail, Integer> {
    List<PurchaseInvoiceDetail> findByPurchaseInvoice_PurchaseInvoiceId(Integer purchaseInvoiceId);

    @Query("SELECT d FROM PurchaseInvoiceDetail d WHERE " +
           "CAST(d.purchaseInvoiceDetailId AS string) LIKE CONCAT('%', :searchTerm, '%') OR " +
           "CAST(d.quantity AS string) LIKE CONCAT('%', :searchTerm, '%') OR " +
           "CAST(d.importPrice AS string) LIKE CONCAT('%', :searchTerm, '%') OR " +
           "CAST(d.subTotal AS string) LIKE CONCAT('%', :searchTerm, '%') OR " +
           "LOWER(d.product.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(d.product.brand.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(d.product.category.name) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<PurchaseInvoiceDetail> searchPurchaseInvoiceDetails(@Param("searchTerm") String searchTerm, Pageable pageable);
}
