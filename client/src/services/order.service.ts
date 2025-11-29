import { apiService } from './api';
import type { Order, Address } from '../types';

export interface CheckoutData {
  shippingAddress: Address;
  paymentMethod: 'COD' | 'VNPAY';
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

  // Place order
  placeOrder: async (data: CheckoutData) => {
    return apiService.post<Order>('/checkout/place-order', data);
  },

  // Get user orders
  getUserOrders: async () => {
    return apiService.get<Order[]>('/orders');
  },

  // Get order by id
  getOrderById: async (orderId: number) => {
    return apiService.get<Order>(`/orders/${orderId}`);
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
};
