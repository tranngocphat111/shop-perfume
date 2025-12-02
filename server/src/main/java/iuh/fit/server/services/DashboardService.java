package iuh.fit.server.services;

import iuh.fit.server.dto.response.*;

import java.util.List;

public interface DashboardService {
    DashboardStatsResponse getDashboardStats(java.time.LocalDate startDate, java.time.LocalDate endDate);
    
    List<TopProductResponse> getTopProducts(int limit);
    
    List<RecentOrderResponse> getRecentOrders(int limit);
    
    List<LowStockProductResponse> getLowStockProducts();
    
    CategoryDistributionResponse getCategoryDistribution(java.time.LocalDate startDate, java.time.LocalDate endDate);
    
    List<TopBrandResponse> getTopBrands(int limit, java.time.LocalDate startDate, java.time.LocalDate endDate);
}
