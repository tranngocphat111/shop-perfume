package iuh.fit.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import iuh.fit.server.dto.response.InventoryResponse;
import iuh.fit.server.services.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

import java.util.List;

/**
 * REST Controller xử lý các request liên quan đến Product
 * URL: http://localhost:8080/api/products
 * CORS is configured globally in CorsConfig.java
 */
@RestController
@RequestMapping("/inventories")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Product Management", description = "APIs for managing products")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/lowStock")
    @Operation(summary = "Get size of low stock items", description = "Retrieve number of low stock items from database")
    public ResponseEntity<Long> getLowStockItem() {
        return ResponseEntity.ok(inventoryService.getLowStockItem());
    }

    /**
     * GET /api/products - Lấy tất cả sản phẩm
     */
    @GetMapping
    @Operation(summary = "Get all inventories", description = "Retrieve all products from database")
    public ResponseEntity<List<InventoryResponse>> getAllProducts() {
        log.info("REST request to get all products");
        List<InventoryResponse> inventoryResponses = inventoryService.findAll();
        return ResponseEntity.ok(inventoryResponses);
    }

    /**
     * GET /api/products/page OR /api/products/paginated - Lấy sản phẩm có phân trang
     * Supports both formats:
     * - ?page=0&size=10&sort=productId,desc
     * - ?page=0&size=10&sortBy=productId&direction=DESC
     */
    @GetMapping({"/page", "/paginated"})
    public ResponseEntity<Page<InventoryResponse>> getProductsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String direction
    ) {
        log.info("REST request to get products with pagination - page: {}, size: {}", page, size);

        // Parse sort parameter (format: "field,direction" or just "field")
        String fieldName = "product.productId";
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
        Page<InventoryResponse> inventoryResponses =  inventoryService.findAllPaginated(pageable);
        return ResponseEntity.ok(inventoryResponses);
    }

    /**
     * GET /api/inventories/best-sellers - Lấy danh sách sản phẩm bán chạy nhất
     * Dựa trên tổng quantity từ order_item table
     */
    @GetMapping("/best-sellers")
    @Operation(summary = "Get best selling products", description = "Retrieve best selling products based on total quantity sold from order_item")
    public ResponseEntity<List<InventoryResponse>> getBestSellers(
            @RequestParam(defaultValue = "20") int limit
    ) {
        log.info("REST request to get best sellers with limit: {}", limit);
        List<InventoryResponse> bestSellers = inventoryService.findBestSellers(limit);
        return ResponseEntity.ok(bestSellers);
    }

    /**
     * GET /api/inventories/{id} - Lấy inventory theo ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get inventory by ID", description = "Retrieve inventory information by inventory ID")
    public ResponseEntity<InventoryResponse> getInventoryById(
            @PathVariable Integer id
    ) {
        log.info("REST request to get inventory by id: {}", id);
        InventoryResponse inventory = inventoryService.findById(id);
        if (inventory == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(inventory);
    }

    /**
     * GET /api/inventories/product/{productId} - Lấy inventory theo productId
     */
    @GetMapping("/product/{productId}")
    @Operation(summary = "Get inventory by product ID", description = "Retrieve inventory information for a specific product")
    public ResponseEntity<InventoryResponse> getInventoryByProductId(
            @PathVariable Integer productId
    ) {
        log.info("REST request to get inventory by productId: {}", productId);
        InventoryResponse inventory = inventoryService.findByProductId(productId);
        if (inventory == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(inventory);
    }

    /**
     * PUT /api/inventories/{id} - Cập nhật số lượng tồn kho
     */
    @org.springframework.web.bind.annotation.PutMapping("/{id}")
    @Operation(summary = "Update inventory quantity", description = "Update the quantity of an inventory item")
    public ResponseEntity<InventoryResponse> updateInventory(
            @PathVariable Integer id,
            @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, Integer> request
    ) {
        log.info("REST request to update inventory {}: {}", id, request);
        Integer quantity = request.get("quantity");
        if (quantity == null || quantity < 0) {
            return ResponseEntity.badRequest().build();
        }
        InventoryResponse updated = inventoryService.updateQuantity(id, quantity);
        return ResponseEntity.ok(updated);
    }

}

