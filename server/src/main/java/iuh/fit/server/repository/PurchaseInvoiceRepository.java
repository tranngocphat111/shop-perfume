package iuh.fit.server.repository;

import iuh.fit.server.model.entity.PurchaseInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PurchaseInvoiceRepository extends JpaRepository<PurchaseInvoice, Integer> {
    @Query("SELECT pi FROM PurchaseInvoice pi WHERE " +
           "CAST(pi.purchaseInvoiceId AS string) LIKE CONCAT('%', :searchTerm, '%') OR " +
           "LOWER(pi.supplier.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(pi.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(pi.status) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "CAST(pi.totalAmount AS string) LIKE CONCAT('%', :searchTerm, '%') OR " +
           "LOWER(pi.createdBy) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(pi.lastUpdatedBy) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<PurchaseInvoice> searchPurchaseInvoices(@Param("searchTerm") String searchTerm, Pageable pageable);
}
