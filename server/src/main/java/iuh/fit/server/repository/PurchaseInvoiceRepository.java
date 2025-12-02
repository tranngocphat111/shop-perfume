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
           "(:isNumeric = false AND (" +
           "CAST(pi.purchaseInvoiceId AS string) LIKE CONCAT('%', :searchTerm, '%') OR " +
           "LOWER(pi.supplier.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(CAST(pi.status AS string)) LIKE LOWER(CONCAT('%', :searchTerm, '%'))" +
           ")) OR " +
           "(:isNumeric = true AND pi.totalAmount >= :numericValue)")
    Page<PurchaseInvoice> searchPurchaseInvoices(
            @Param("searchTerm") String searchTerm,
            @Param("isNumeric") boolean isNumeric,
            @Param("numericValue") Double numericValue,
            Pageable pageable);
}
