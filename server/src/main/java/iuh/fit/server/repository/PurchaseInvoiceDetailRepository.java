package iuh.fit.server.repository;

import iuh.fit.server.model.entity.PurchaseInvoiceDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseInvoiceDetailRepository extends JpaRepository<PurchaseInvoiceDetail, Integer> {
    List<PurchaseInvoiceDetail> findByPurchaseInvoice_PurchaseInvoiceId(Integer purchaseInvoiceId);
}
