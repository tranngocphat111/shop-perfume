package iuh.fit.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import iuh.fit.server.dto.request.CategoryRequest;
import iuh.fit.server.dto.response.CategoryResponse;
import iuh.fit.server.services.CategoryService;
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
 * REST Controller xử lý các request liên quan đến Category
 * URL: http://localhost:8080/api/categories
 */
@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Category Management", description = "APIs for managing categories")
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * GET /api/categories - Lấy tất cả categories
     */
    @GetMapping
    @Operation(summary = "Get all categories", description = "Retrieve all categories from database")
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        log.info("REST request to get all categories");
        List<CategoryResponse> categories = categoryService.findAll();
        return ResponseEntity.ok(categories);
    }

    /**
     * GET /api/categories/page - Lấy categories có phân trang
     */
    @GetMapping("/page")
    @Operation(summary = "Get categories with pagination", description = "Retrieve categories with pagination and search")
    public ResponseEntity<Page<CategoryResponse>> getCategoriesPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) String search) {
        log.info("REST request to get categories page: page={}, size={}, sortBy={}, direction={}, search={}",
                page, size, sortBy, direction, search);

        Pageable pageable;
        if (sortBy != null && direction != null) {
            Sort.Direction sortDirection = "DESC".equalsIgnoreCase(direction) ? Sort.Direction.DESC
                    : Sort.Direction.ASC;
            pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        } else {
            pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "categoryId"));
        }

        Page<CategoryResponse> categories = categoryService.findAllPaginated(pageable, search);
        return ResponseEntity.ok(categories);
    }

    /**
     * GET /api/categories/{id} - Lấy category theo ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get category by ID", description = "Retrieve a specific category by its ID")
    public ResponseEntity<CategoryResponse> getCategoryById(@PathVariable int id) {
        log.info("REST request to get category by id: {}", id);
        CategoryResponse category = categoryService.findById(id);
        return ResponseEntity.ok(category);
    }

    /**
     * POST /api/categories - Tạo mới category
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create new category", description = "Create a new category (ADMIN only)")
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        log.info("REST request to create category: {}", request.getName());
        CategoryResponse created = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/categories/{id} - Cập nhật category
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update category", description = "Update an existing category (ADMIN only)")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable int id,
            @Valid @RequestBody CategoryRequest request) {
        log.info("REST request to update category id {}: {}", id, request.getName());
        CategoryResponse updated = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/categories/{id} - Xóa category
     * Kiểm tra category có được sử dụng trong sản phẩm ACTIVE hay không
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete category", description = "Delete a category if it's not used by any ACTIVE products")
    public ResponseEntity<Void> deleteCategory(@PathVariable int id) {
        log.info("REST request to delete category id: {}", id);
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
