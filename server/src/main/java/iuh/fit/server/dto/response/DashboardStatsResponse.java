package iuh.fit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    // Core KPIs
    private Long totalProducts;
    private Long totalOrders;
    private Double totalRevenue;
    private Double averageOrderValue;
    private Long newCustomers; // Customers registered in current period
    private Long newOrders; // Orders placed in last 30 days
    private Double refundRate; // Percentage (0-100) - based on REFUNDED status
    
    // Operational metrics
    private Long lowStockItems;
    private Long totalCustomers;
    private Long pendingOrders;
    private Long failedOrders;
    private Long refundedOrders;
    private Long completedOrders;
    
    // Product categories
    private Long totalCategories;
    private Long totalBrands;
}
