package iuh.fit.server.services.impl;

import iuh.fit.server.dto.request.PurchaseInvoiceDetailRequest;
import iuh.fit.server.dto.request.PurchaseInvoiceRequest;
import iuh.fit.server.dto.response.PurchaseInvoiceDetailResponse;
import iuh.fit.server.dto.response.PurchaseInvoiceResponse;
import iuh.fit.server.exception.ResourceNotFoundException;
import iuh.fit.server.mapper.PurchaseInvoiceDetailMapper;
import iuh.fit.server.mapper.PurchaseInvoiceMapper;
import iuh.fit.server.model.entity.*;
import iuh.fit.server.repository.*;
import iuh.fit.server.services.PurchaseInvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PurchaseInvoiceServiceImpl implements PurchaseInvoiceService {
    
    private final PurchaseInvoiceRepository purchaseInvoiceRepository;
    private final PurchaseInvoiceDetailRepository detailRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final PurchaseInvoiceMapper purchaseInvoiceMapper;
    private final PurchaseInvoiceDetailMapper purchaseInvoiceDetailMapper;


    @Override
    public List<PurchaseInvoiceDetailResponse> findByPurchaseDetail_PurchaseInvoiceId(int id) {
        return detailRepository.findByPurchaseInvoice_PurchaseInvoiceId(id).stream()
                .map(purchaseInvoiceDetailMapper::toResponse)
                .collect(Collectors.toList());
    }


    @Override
    @Transactional(readOnly = true)
    public List<PurchaseInvoiceResponse> findAll() {
        log.info("Finding all purchase invoices");
        return purchaseInvoiceRepository.findAll().stream()
                .map(purchaseInvoiceMapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseInvoiceResponse> findAllPaginated(Pageable pageable) {
        log.info("Finding purchase invoices with pagination: {}", pageable);
        return purchaseInvoiceRepository.findAll(pageable)
                .map(purchaseInvoiceMapper::toResponse);
    }
    
    @Override
    @Transactional(readOnly = true)
    public PurchaseInvoiceResponse findById(Integer id) {
        log.info("Finding purchase invoice by id: {}", id);
        PurchaseInvoice invoice = purchaseInvoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase invoice not found with id: " + id));
        return purchaseInvoiceMapper.toResponse(invoice);
    }
    
    @Override
    public PurchaseInvoiceResponse create(PurchaseInvoiceRequest request) {
        log.info("Creating new purchase invoice with {} details", request.getDetails().size());
        
        // Validate supplier
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + request.getSupplierId()));
        
        // Create invoice
        PurchaseInvoice invoice = purchaseInvoiceMapper.toEntity(request);
        invoice.setSupplier(supplier);
        invoice.setTotalAmount(0.0);
        
        // Save invoice first to get ID
        PurchaseInvoice savedInvoice = purchaseInvoiceRepository.save(invoice);
        
        // Create details and update inventory
        List<PurchaseInvoiceDetail> details = new ArrayList<>();
        double totalAmount = 0.0;
        
        for (PurchaseInvoiceDetailRequest detailReq : request.getDetails()) {
            // Find product
            Product product = productRepository.findById(detailReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + detailReq.getProductId()));
            
            // Create detail
            PurchaseInvoiceDetail detail = new PurchaseInvoiceDetail();
            detail.setPurchaseInvoice(savedInvoice);
            detail.setProduct(product);
            detail.setQuantity(detailReq.getQuantity());
            detail.setImportPrice(detailReq.getImportPrice());
            detail.setSubTotal(detailReq.getQuantity() * detailReq.getImportPrice());
            
            details.add(detail);
            totalAmount += detail.getSubTotal();
            
            // Update inventory quantity
            Inventory inventory = inventoryRepository.findByProductId(product.getProductId());
            if (inventory != null) {
                inventory.setQuantity(inventory.getQuantity() + detailReq.getQuantity());
                inventoryRepository.save(inventory);
                log.info("Updated inventory for product {} from {} to {}", 
                        product.getProductId(), 
                        inventory.getQuantity() - detailReq.getQuantity(), 
                        inventory.getQuantity());
            } else {
                // Create new inventory if not exists
                Inventory newInventory = new Inventory();
                newInventory.setProduct(product);
                newInventory.setQuantity(detailReq.getQuantity());
                inventoryRepository.save(newInventory);
                log.info("Created new inventory for product {} with quantity {}", 
                        product.getProductId(), detailReq.getQuantity());
            }
        }
        
        // Save all details
        detailRepository.saveAll(details);
        
        // Update total amount
        savedInvoice.setTotalAmount(totalAmount);
        savedInvoice.setDetails(details);
        PurchaseInvoice updated = purchaseInvoiceRepository.save(savedInvoice);
        
        log.info("Purchase invoice created successfully with id: {}, total: {}", 
                updated.getPurchaseInvoiceId(), updated.getTotalAmount());
        
        return purchaseInvoiceMapper.toResponse(updated);
    }
    
    @Override
    public PurchaseInvoiceResponse update(Integer id, PurchaseInvoiceRequest request) {
        log.info("Updating purchase invoice id: {}", id);
        
        PurchaseInvoice existing = purchaseInvoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase invoice not found with id: " + id));
        
        // Validate supplier
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + request.getSupplierId()));
        
        // Update basic info
        existing.setSupplier(supplier);
        existing.setEmail(request.getEmail());
        existing.setStatus(request.getStatus());
        
        // Note: This is simplified. A full implementation should handle:
        // - Reverting old inventory changes
        // - Applying new inventory changes
        // - Deleting old details
        // - Creating new details
        
        PurchaseInvoice updated = purchaseInvoiceRepository.save(existing);
        return purchaseInvoiceMapper.toResponse(updated);
    }
    
    @Override
    public void delete(Integer id) {
        log.info("Deleting purchase invoice: {}", id);
        
        if (!purchaseInvoiceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Purchase invoice not found with id: " + id);
        }
        
        // Note: Should also handle inventory rollback if needed
        purchaseInvoiceRepository.deleteById(id);
        log.info("Purchase invoice deleted successfully: {}", id);
    }
}
