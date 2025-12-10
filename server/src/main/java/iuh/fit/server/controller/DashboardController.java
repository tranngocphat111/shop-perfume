package iuh.fit.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import iuh.fit.server.dto.response.*;
import iuh.fit.server.services.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Slf4j
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * Get all dashboard statistics
     * Chỉ ADMIN mới có quyền xem
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get dashboard statistics", description = "Retrieve all dashboard statistics")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        log.info("REST request to get dashboard statistics");
        DashboardStatsResponse stats = dashboardService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Get top selling products
     */
    @GetMapping("/top-products")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get top products", description = "Retrieve top selling products")
    public ResponseEntity<java.util.List<TopProductResponse>> getTopProducts(
            @RequestParam(defaultValue = "10") int limit) {
        log.info("REST request to get top {} products", limit);
        return ResponseEntity.ok(dashboardService.getTopProducts(limit));
    }

    /**
     * Get recent orders
     */
    @GetMapping("/recent-orders")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get recent orders", description = "Retrieve recent orders")
    public ResponseEntity<java.util.List<RecentOrderResponse>> getRecentOrders(
            @RequestParam(defaultValue = "10") int limit) {
        log.info("REST request to get recent {} orders", limit);
        return ResponseEntity.ok(dashboardService.getRecentOrders(limit));
    }

    /**
     * Get low stock products
     */
    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get low stock products", description = "Retrieve products with low stock")
    public ResponseEntity<List<LowStockProductResponse>> getLowStockProducts() {
        log.info("REST request to get low stock products");
        return ResponseEntity.ok(dashboardService.getLowStockProducts());
    }

    /**
     * Get category distribution
     */
    @GetMapping("/category-distribution")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get category distribution", description = "Retrieve sales distribution by category")
    public ResponseEntity<CategoryDistributionResponse> getCategoryDistribution() {
        log.info("REST request to get category distribution");
        return ResponseEntity.ok(dashboardService.getCategoryDistribution());
    }

    /**
     * Get top brands
     */
    @GetMapping("/top-brands")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get top brands", description = "Retrieve top selling brands")
    public ResponseEntity<List<TopBrandResponse>> getTopBrands(
            @RequestParam(defaultValue = "10") int limit) {
        log.info("REST request to get top {} brands", limit);
        return ResponseEntity.ok(dashboardService.getTopBrands(limit));
    }
}
