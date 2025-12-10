package iuh.fit.server.services;

import iuh.fit.server.dto.response.*;

import java.util.List;

public interface DashboardService {
    DashboardStatsResponse getDashboardStats();
    
    List<TopProductResponse> getTopProducts(int limit);
    
    List<RecentOrderResponse> getRecentOrders(int limit);
    
    List<LowStockProductResponse> getLowStockProducts();
    
    CategoryDistributionResponse getCategoryDistribution();
    
    List<TopBrandResponse> getTopBrands(int limit);
}
