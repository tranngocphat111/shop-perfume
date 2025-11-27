import { apiService } from './api';

export interface Coupon {
  couponId: number;
  code: string;
  description: string;
  discountPercent: number;
  minOrderValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface CouponValidationResponse {
  valid: boolean;
  coupon?: Coupon;
  message?: string;
  discountAmount?: number;
}

export const couponService = {
  // Get all available coupons
  getAvailableCoupons: async (): Promise<Coupon[]> => {
    try {
      return await apiService.get<Coupon[]>('/coupons/available');
    } catch (error) {
      console.error('Error fetching available coupons:', error);
      return [];
    }
  },

  // Validate coupon code
  validateCoupon: async (code: string, totalAmount: number): Promise<CouponValidationResponse> => {
    try {
      return await apiService.post<CouponValidationResponse>('/coupons/validate', {
        code,
        totalAmount,
      });
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      return {
        valid: false,
        message: error?.response?.data?.message || 'Mã giảm giá không hợp lệ',
      };
    }
  },

  // Get coupon by code
  getCouponByCode: async (code: string): Promise<Coupon | null> => {
    try {
      return await apiService.get<Coupon>(`/coupons/code/${code}`);
    } catch (error) {
      console.error('Error fetching coupon by code:', error);
      return null;
    }
  },
};

