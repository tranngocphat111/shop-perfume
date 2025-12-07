package iuh.fit.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import iuh.fit.server.dto.request.BrandRequest;
import iuh.fit.server.dto.response.BrandResponse;
import iuh.fit.server.services.BrandService;
import jakarta.validation.Valid;
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

/**
 * REST Controller xử lý các request liên quan đến Brand
 * URL: http://localhost:8080/api/brands
 */
@RestController
@RequestMapping("/brands")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Brand Management", description = "APIs for managing brands")
public class BrandController {

    private final BrandService brandService;

    /**
     * GET /api/brands - Lấy tất cả brands
     */
    @GetMapping
    @Operation(summary = "Get all brands", description = "Retrieve all brands from database")
    public ResponseEntity<List<BrandResponse>> getAllBrands() {
        log.info("REST request to get all brands");
        List<BrandResponse> brands = brandService.findAll();
        return ResponseEntity.ok(brands);
    }

    /**
     * GET /api/brands/page - Lấy brands theo phân trang (cho admin)
     */
    @GetMapping("/page")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get paginated brands", description = "Retrieve brands with pagination and search for admin")
    public ResponseEntity<Page<BrandResponse>> getBrandsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) String search) {

        log.info("REST request to get brands page: page={}, size={}, sortBy={}, direction={}, search={}",
                page, size, sortBy, direction, search);

        // Build pageable with sorting
        Pageable pageable;
        if (sortBy != null && direction != null) {
            Sort.Direction sortDirection = direction.equalsIgnoreCase("DESC")
                    ? Sort.Direction.DESC
                    : Sort.Direction.ASC;
            pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        } else {
            pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "brandId"));
        }

        Page<BrandResponse> brands = brandService.findAllPaginated(pageable, search);
        return ResponseEntity.ok(brands);
    }

    /**
     * GET /api/brands/{id} - Lấy brand theo ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get brand by ID", description = "Retrieve a single brand by its ID")
    public ResponseEntity<BrandResponse> getBrandById(@PathVariable int id) {
        log.info("REST request to get brand by id: {}", id);
        BrandResponse brand = brandService.findById(id);
        return ResponseEntity.ok(brand);
    }

    /**
     * POST /api/brands - Tạo brand mới
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create new brand", description = "Create a new brand")
    public ResponseEntity<BrandResponse> createBrand(@Valid @RequestBody BrandRequest request) {
        log.info("REST request to create brand: {}", request.getName());
        BrandResponse brand = brandService.createBrand(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(brand);
    }

    /**
     * PUT /api/brands/{id} - Cập nhật brand
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update brand", description = "Update an existing brand")
    public ResponseEntity<BrandResponse> updateBrand(
            @PathVariable int id,
            @Valid @RequestBody BrandRequest request) {
        log.info("REST request to update brand id {}: {}", id, request.getName());
        BrandResponse brand = brandService.updateBrand(id, request);
        return ResponseEntity.ok(brand);
    }

    /**
     * DELETE /api/brands/{id} - Xóa brand
     * Kiểm tra brand có được sử dụng trong sản phẩm ACTIVE hay không
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete brand", description = "Delete a brand if it's not used by any ACTIVE products")
    public ResponseEntity<Void> deleteBrand(@PathVariable int id) {
        log.info("REST request to delete brand id: {}", id);
        brandService.deleteBrand(id);
        return ResponseEntity.noContent().build();
    }
}
