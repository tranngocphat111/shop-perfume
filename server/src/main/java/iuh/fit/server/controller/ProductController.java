package iuh.fit.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import iuh.fit.server.dto.request.ProductRequest;
import iuh.fit.server.dto.response.ProductResponse;
import iuh.fit.server.mapper.ProductMapper;
import iuh.fit.server.model.entity.Inventory;
import iuh.fit.server.services.ProductService;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * REST Controller xử lý các request liên quan đến Product
 * URL: http://localhost:8080/api/products
 * CORS is configured globally in CorsConfig.java
 */
@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Product Management", description = "APIs for managing products")
public class ProductController {

    private final ProductService productService;
    private final ProductMapper productMapper;

    /**
     * GET /api/products - Lấy tất cả sản phẩm
     */
    @GetMapping
    @Operation(summary = "Get all products", description = "Retrieve all products from database")
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        log.info("REST request to get all products");
        List<ProductResponse> products = productService.findAll();
        return ResponseEntity.ok(products);
    }

    /**
     * GET /api/products/page OR /api/products/paginated - Lấy sản phẩm có phân trang
     * Supports both formats:
     * - ?page=0&size=10&sort=productId,desc
     * - ?page=0&size=10&sortBy=productId&direction=DESC
     * - ?page=0&size=10&search=keyword (tìm kiếm theo tất cả thuộc tính)
     */
    @GetMapping({"/page", "/paginated"})
    public ResponseEntity<Page<ProductResponse>> getProductsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) Integer brandId,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) String search
    ) {
        log.info("REST request to get products with pagination - page: {}, size: {}, brandId: {}, categoryId: {}, search: {}", 
                page, size, brandId, categoryId, search);

        // Parse sort parameter (format: "field,direction" or just "field")
        String fieldName = "productId";
        Sort.Direction sortDirection = Sort.Direction.ASC;

        if (sort != null && !sort.isEmpty()) {
            String[] sortParams = sort.split(",");
            fieldName = sortParams[0];
            if (sortParams.length > 1) {
                sortDirection = sortParams[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
            }
        } else if (sortBy != null && !sortBy.isEmpty()) {
            fieldName = sortBy;
            if (direction != null && direction.equalsIgnoreCase("DESC")) {
                sortDirection = Sort.Direction.DESC;
            }
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, fieldName));
        
        // Use filter method to support brandId, categoryId and search
        Page<ProductResponse> products = productService.filterProducts(brandId, categoryId, search, pageable);
        
        return ResponseEntity.ok(products);
    }

    /**
     * GET /api/products/best-sellers - Lấy danh sách sản phẩm bán chạy nhất
     * Dựa trên tổng quantity từ order_item table
     */
    @GetMapping("/best-sellers")
    @Operation(summary = "Get best selling products", description = "Retrieve best selling products based on total quantity sold from order_item")
    public ResponseEntity<List<ProductResponse>> getBestSellers(
            @RequestParam(defaultValue = "20") int limit
    ) {
        log.info("REST request to get best sellers with limit: {}", limit);
        List<ProductResponse> bestSellers = productService.findBestSellers(limit);
        return ResponseEntity.ok(bestSellers);
    }

    /**
     * GET /api/products/{id} - Lấy sản phẩm theo ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID", description = "Retrieve a product by its ID")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Integer id) {
        log.info("REST request to get product by id: {}", id);
        ProductResponse product = productService.findById(id);
        return ResponseEntity.ok(product);
    }

    /**
     * POST /api/products - Tạo sản phẩm mới (với upload ảnh)
     */
    @PostMapping(consumes = {"multipart/form-data"})
    @Operation(summary = "Create new product with images", description = "Create a new product with multiple images")
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @ModelAttribute ProductRequest request,
            @RequestParam(value = "images", required = true) List<MultipartFile> images,
            @RequestParam(value = "primaryImageIndex", defaultValue = "0") int primaryImageIndex
    ) {
        log.info("REST request to create product with {} images", images.size());
        
        // Validation: Ít nhất phải có 1 ảnh
        if (images == null || images.isEmpty()) {
            throw new IllegalArgumentException("Phải có ít nhất 1 ảnh sản phẩm");
        }
        
        // Validation: primaryImageIndex phải hợp lệ
        if (primaryImageIndex < 0 || primaryImageIndex >= images.size()) {
            throw new IllegalArgumentException("primaryImageIndex không hợp lệ");
        }
        
        ProductResponse product = productService.createWithImages(request, images, primaryImageIndex);

        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }

    /**
     * PUT /api/products/{id} - Cập nhật sản phẩm (không cập nhật ảnh)
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update product", description = "Update an existing product")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Integer id,
            @Valid @RequestBody ProductRequest request
    ) {
        log.info("REST request to update product {}: {}", id, request);
        ProductResponse product = productService.update(id, request);
        return ResponseEntity.ok(product);
    }

    /**
     * PUT /api/products/{id}/images - Cập nhật ảnh sản phẩm
     */
    @PutMapping(value = "/{id}/images", consumes = {"multipart/form-data"})
    @Operation(summary = "Update product images", description = "Update product with new images and manage existing ones")
    public ResponseEntity<ProductResponse> updateProductImages(
            @PathVariable Integer id,
            @Valid @ModelAttribute ProductRequest request,
            @RequestParam(value = "images", required = false) List<MultipartFile> newImages,
            @RequestParam(value = "imagesToDelete", required = false) List<Integer> imagesToDelete,
            @RequestParam(value = "primaryImageId", required = false) Integer primaryImageId
    ) {
        log.info("REST request to update product {} with images", id);
        ProductResponse product = productService.updateWithImages(id, request, newImages, imagesToDelete, primaryImageId);
        return ResponseEntity.ok(product);
    }

    /**
     * DELETE /api/products/{id} - Xóa sản phẩm
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete product", description = "Delete a product by its ID")
    public ResponseEntity<Void> deleteProduct(@PathVariable Integer id) {
        log.info("REST request to delete product: {}", id);
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

}

