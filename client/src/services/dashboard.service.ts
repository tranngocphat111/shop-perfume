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
    async getDashboardStats(period?: string, year?: number): Promise<DashboardStats> {
        const params = new URLSearchParams();
        if (period) params.append('period', period);
        if (year) params.append('year', year.toString());
        return apiService.get<DashboardStats>(`/dashboard/stats?${params.toString()}`);
    },

    async getCategoryDistribution(period?: string, year?: number): Promise<CategoryDistributionResponse> {
        const params = new URLSearchParams();
        if (period) params.append('period', period);
        if (year) params.append('year', year.toString());
        return apiService.get<CategoryDistributionResponse>(`/dashboard/category-distribution?${params.toString()}`);
    },

    async getTopBrands(limit: number = 10, period?: string, year?: number): Promise<TopBrandResponse[]> {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        if (period) params.append('period', period);
        if (year) params.append('year', year.toString());
        return apiService.get<TopBrandResponse[]>(`/dashboard/top-brands?${params.toString()}`);
    },
};