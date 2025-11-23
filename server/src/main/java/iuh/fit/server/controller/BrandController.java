package iuh.fit.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import iuh.fit.server.dto.response.BrandResponse;
import iuh.fit.server.services.BrandService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}

