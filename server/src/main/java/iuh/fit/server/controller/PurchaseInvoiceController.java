package iuh.fit.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import iuh.fit.server.dto.request.PurchaseInvoiceRequest;
import iuh.fit.server.dto.response.PurchaseInvoiceDetailResponse;
import iuh.fit.server.dto.response.PurchaseInvoiceResponse;
import iuh.fit.server.services.PurchaseInvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/purchase-invoices")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Purchase Invoice Management", description = "APIs for managing purchase invoices")
public class PurchaseInvoiceController {
    
    private final PurchaseInvoiceService purchaseInvoiceService;

    /**
     * Get purchase invoice details by ID
     * Chỉ ADMIN mới có quyền xem
     */
    @GetMapping("{id}/details")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all purchase details of invoice's id")
    public ResponseEntity<List<PurchaseInvoiceDetailResponse>> getPurchaseInvoiceDetailById(@PathVariable int id) {
        log.info("REST request to get details's purchase invoice having id : {}", id);
        List<PurchaseInvoiceDetailResponse> responseList = purchaseInvoiceService.findByPurchaseDetail_PurchaseInvoiceId(id);
        return ResponseEntity.ok(responseList);
    }

    /**
     * Get all purchase invoices
     * Chỉ ADMIN mới có quyền xem
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all purchase invoices")
    public ResponseEntity<List<PurchaseInvoiceResponse>> getAllInvoices() {
        log.info("REST request to get all purchase invoices");
        return ResponseEntity.ok(purchaseInvoiceService.findAll());
    }
    
    /**
     * Get purchase invoices with pagination and search
     * Chỉ ADMIN mới có quyền xem
     */
    @GetMapping("/page")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get purchase invoices with pagination and search")
    public ResponseEntity<Page<PurchaseInvoiceResponse>> getInvoicesPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) String search
    ) {
        log.info("REST request to get purchase invoices with pagination - page: {}, size: {}, search: {}", page, size, search);
        
        String fieldName = sortBy != null ? sortBy : "purchaseInvoiceId";
        Sort.Direction sortDirection = "DESC".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, fieldName));
        
        // If search term is provided, use search method
        if (search != null && !search.trim().isEmpty()) {
            return ResponseEntity.ok(purchaseInvoiceService.searchPurchaseInvoices(search.trim(), pageable));
        }
        
        return ResponseEntity.ok(purchaseInvoiceService.findAllPaginated(pageable));
    }
    
    /**
     * Get purchase invoice by ID
     * Chỉ ADMIN mới có quyền xem
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get purchase invoice by ID")
    public ResponseEntity<PurchaseInvoiceResponse> getInvoiceById(@PathVariable Integer id) {
        log.info("REST request to get purchase invoice by id: {}", id);
        return ResponseEntity.ok(purchaseInvoiceService.findById(id));
    }
    
    /**
     * Create new purchase invoice
     * Chỉ ADMIN mới có quyền tạo
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create new purchase invoice")
    public ResponseEntity<PurchaseInvoiceResponse> createInvoice(@RequestBody PurchaseInvoiceRequest request) {
        log.info("REST request to create purchase invoice");
        PurchaseInvoiceResponse created = purchaseInvoiceService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    /**
     * Update purchase invoice
     * Chỉ ADMIN mới có quyền cập nhật
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update purchase invoice")
    public ResponseEntity<PurchaseInvoiceResponse> updateInvoice(
            @PathVariable Integer id,
            @RequestBody PurchaseInvoiceRequest request
    ) {
        log.info("REST request to update purchase invoice id: {}", id);
        return ResponseEntity.ok(purchaseInvoiceService.update(id, request));
    }
    
    /**
     * Delete purchase invoice
     * Chỉ ADMIN mới có quyền xóa
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete purchase invoice")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Integer id) {
        log.info("REST request to delete purchase invoice: {}", id);
        purchaseInvoiceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
