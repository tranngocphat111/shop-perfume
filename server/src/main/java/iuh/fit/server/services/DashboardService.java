package iuh.fit.server.services;

import iuh.fit.server.dto.response.*;

import java.util.List;

public interface DashboardService {
    DashboardStatsResponse getDashboardStats(String period, Integer year);
    
    List<TopProductResponse> getTopProducts(int limit);
    
    List<RecentOrderResponse> getRecentOrders(int limit);
    
    List<LowStockProductResponse> getLowStockProducts();
    
    CategoryDistributionResponse getCategoryDistribution(String period, Integer year);
    
    List<TopBrandResponse> getTopBrands(int limit, String period, Integer year);
}
