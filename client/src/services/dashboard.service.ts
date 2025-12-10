import { apiService } from './api';

export interface DashboardStats {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    lowStockItems: number;
    totalCustomers: number;
    pendingOrders: number;
    failedOrders: number;
    refundedOrders: number;
    completedOrders: number;
    totalCategories: number;
    totalBrands: number;
    averageOrderValue: number;
    newCustomers: number;
    newOrders: number;
    refundRate: number;
}

export interface CategoryStat {
    categoryName: string;
    orderCount: number;
    revenue: number;
    percentage: number;
}

export interface CategoryDistributionResponse {
    categories: CategoryStat[];
}

export interface TopBrandResponse {
    brandName: string;
    totalSold: number;
    revenue: number;
}

export const dashboardService = {
    async getDashboardStats(): Promise<DashboardStats> {
        return apiService.get<DashboardStats>('/dashboard/stats');
    },

    async getCategoryDistribution(): Promise<CategoryDistributionResponse> {
        return apiService.get<CategoryDistributionResponse>('/dashboard/category-distribution');
    },

    async getTopBrands(limit: number = 10): Promise<TopBrandResponse[]> {
        return apiService.get<TopBrandResponse[]>(`/dashboard/top-brands?limit=${limit}`);
    },
};