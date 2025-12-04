import { apiService } from './api';
import type { Order, Address, OrderResponse, PageResponse } from '../types';

export interface CheckoutData {
  shippingAddress: Address;
  paymentMethod: 'COD' | 'VNPAY';
}

export interface RevenueStatsResponse {
  labels: string[];
  revenues: number[];
  orderCounts: number[];
}

export const orderService = {
  async getSizeOfPendingOrders(): Promise<number> {
    return await apiService.get("/orders/pending");
  },

  async getTotalSize(): Promise<number> {
    return await apiService.get<number>('/orders/size');
  },

  async getTotalRevenue(): Promise<number> {
    return apiService.get<number>("/orders/totalRevenue");
  },

  async getRevenueStatsByPeriod(period: 'monthly' | 'quarterly' | 'yearly', year?: number): Promise<RevenueStatsResponse> {
    let url = `/orders/stats/revenue?period=${period}`;
    if (year) {
      url += `&year=${year}`;
    }
    return apiService.get<RevenueStatsResponse>(url);
  },

  // Place order
  placeOrder: async (data: CheckoutData) => {
    return apiService.post<Order>('/checkout/place-order', data);
  },

  // Get user orders
  getUserOrders: async () => {
    return apiService.get<Order[]>('/orders');
  },

  // Get order by id
  getOrderById: async (orderId: number): Promise<OrderResponse> => {
    return apiService.get<OrderResponse>(`/orders/${orderId}`);
  },

  // Get orders with pagination (Admin)
  getOrdersPage: async (
    page: number,
    size: number,
    sortBy?: string,
    direction?: string,
    search?: string
  ): Promise<PageResponse<OrderResponse>> => {
    let url = `/orders/page?page=${page}&size=${size}`;

    if (sortBy && direction) {
      url += `&sortBy=${sortBy}&direction=${direction}`;
    }

    if (search && search.trim() !== "") {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    return apiService.get<PageResponse<OrderResponse>>(url);
  },

  // VNPay payment
  createVNPayPayment: async (amount: number, orderInfo: string) => {
    return apiService.post<{ paymentUrl: string }>('/payment/vnpay/create', {
      amount,
      orderInfo,
    });
  },

  // VNPay return
  handleVNPayReturn: async (params: Record<string, string>) => {
    return apiService.post<{ success: boolean; message: string }>(
      '/payment/vnpay/return',
      params
    );
  },

  // Update shipment status (Admin)
  updateShipmentStatus: async (orderId: number, status: string): Promise<void> => {
    return apiService.put(`/orders/${orderId}/shipment-status?status=${status}`, {});
  },

  // Update payment status (Admin)
  updatePaymentStatus: async (orderId: number, status: string): Promise<void> => {
    return apiService.put(`/orders/${orderId}/payment-status?status=${status}`, {});
  },
};
