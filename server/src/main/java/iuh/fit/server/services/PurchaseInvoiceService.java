package iuh.fit.server.services;

import iuh.fit.server.dto.request.PurchaseInvoiceRequest;
import iuh.fit.server.dto.response.PurchaseInvoiceDetailResponse;
import iuh.fit.server.dto.response.PurchaseInvoiceResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PurchaseInvoiceService {


    List<PurchaseInvoiceDetailResponse> findByPurchaseDetail_PurchaseInvoiceId(int id);

    List<PurchaseInvoiceResponse> findAll();
    
    Page<PurchaseInvoiceResponse> findAllPaginated(Pageable pageable);
    
    Page<PurchaseInvoiceResponse> searchPurchaseInvoices(String searchTerm, Pageable pageable);
    
    PurchaseInvoiceResponse findById(Integer id);
    
    PurchaseInvoiceResponse create(PurchaseInvoiceRequest request);
    
    PurchaseInvoiceResponse update(Integer id, PurchaseInvoiceRequest request);
    
    void delete(Integer id);
}
