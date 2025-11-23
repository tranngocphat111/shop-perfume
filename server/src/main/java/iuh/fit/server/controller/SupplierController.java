package iuh.fit.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import iuh.fit.server.dto.request.SupplierRequest;
import iuh.fit.server.dto.response.SupplierResponse;
import iuh.fit.server.services.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller xử lý các request liên quan đến Supplier
 * URL: http://localhost:8080/api/admin/suppliers
 */
@RestController
@RequestMapping("/admin/suppliers")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Supplier Management", description = "APIs for managing suppliers")
public class SupplierController {

    private final SupplierService supplierService;

    /**
     * GET /api/admin/suppliers/all - Lấy tất cả nhà cung cấp
     */
    @GetMapping("/all")
    @Operation(summary = "Get all suppliers", description = "Retrieve all suppliers from database")
    public ResponseEntity<List<SupplierResponse>> getAllSuppliers() {
        log.info("REST request to get all suppliers");
        List<SupplierResponse> suppliers = supplierService.findAll();
        return ResponseEntity.ok(suppliers);
    }

    /**
     * GET /api/admin/suppliers - Lấy nhà cung cấp có phân trang
     * Supports:
     * - ?page=0&size=10&sortBy=supplierId&direction=DESC
     * - ?page=0&size=10&search=keyword (tìm kiếm theo tất cả thuộc tính)
     */
    @GetMapping
    @Operation(summary = "Get suppliers with pagination", description = "Retrieve suppliers with pagination and search")
    public ResponseEntity<Page<SupplierResponse>> getSuppliersPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) String search
    ) {
        log.info("REST request to get suppliers with pagination - page: {}, size: {}, search: {}", page, size, search);

        // Parse sort parameters
        String fieldName = sortBy != null && !sortBy.isEmpty() ? sortBy : "supplierId";
        Sort.Direction sortDirection = Sort.Direction.ASC;
        
        if (direction != null && direction.equalsIgnoreCase("DESC")) {
            sortDirection = Sort.Direction.DESC;
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, fieldName));
        
        // If search term provided, use search method
        Page<SupplierResponse> suppliers;
        if (search != null && !search.trim().isEmpty()) {
            suppliers = supplierService.searchSuppliers(search.trim(), pageable);
        } else {
            suppliers = supplierService.findAllPaginated(pageable);
        }
        
        return ResponseEntity.ok(suppliers);
    }

    /**
     * GET /api/admin/suppliers/{id} - Lấy nhà cung cấp theo ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get supplier by ID", description = "Retrieve a supplier by its ID")
    public ResponseEntity<SupplierResponse> getSupplierById(@PathVariable Integer id) {
        log.info("REST request to get supplier by id: {}", id);
        SupplierResponse supplier = supplierService.findById(id);
        return ResponseEntity.ok(supplier);
    }

    /**
     * POST /api/admin/suppliers - Tạo nhà cung cấp mới
     */
    @PostMapping
    @Operation(summary = "Create new supplier", description = "Create a new supplier")
    public ResponseEntity<SupplierResponse> createSupplier(
            @Valid @RequestBody SupplierRequest request
    ) {
        log.info("REST request to create supplier: {}", request);
        SupplierResponse supplier = supplierService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(supplier);
    }

    /**
     * PUT /api/admin/suppliers/{id} - Cập nhật nhà cung cấp
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update supplier", description = "Update an existing supplier")
    public ResponseEntity<SupplierResponse> updateSupplier(
            @PathVariable Integer id,
            @Valid @RequestBody SupplierRequest request
    ) {
        log.info("REST request to update supplier {}: {}", id, request);
        SupplierResponse supplier = supplierService.update(id, request);
        return ResponseEntity.ok(supplier);
    }

    /**
     * DELETE /api/admin/suppliers/{id} - Xóa nhà cung cấp
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete supplier", description = "Delete a supplier by its ID")
    public ResponseEntity<Void> deleteSupplier(@PathVariable Integer id) {
        log.info("REST request to delete supplier: {}", id);
        supplierService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
