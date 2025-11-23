package iuh.fit.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import iuh.fit.server.dto.response.BrandResponse;
import iuh.fit.server.dto.response.CategoryResponse;
import iuh.fit.server.services.BrandService;
import iuh.fit.server.services.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}

