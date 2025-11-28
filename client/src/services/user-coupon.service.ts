import { apiService } from './api';

export interface UserCoupon {
  userCouponId: number;
  couponId: number;
  code: string;
  description: string;
  discountPercent: number;
  minOrderValue: number;
  startDate: string;
  endDate: string;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
  receivedAt: string;
  usedAt?: string;
}

export interface UserCouponValidation {
  valid: boolean;
  message: string;
  userCouponId?: number;
  couponId?: number;
  code?: string;
  discountPercent?: number;
  discountAmount?: number;
}

export const userCouponService = {
  /**
   * Lấy danh sách coupon của user hiện tại
   */
  getMyCoupons: async (): Promise<UserCoupon[]> => {
    try {
      return await apiService.get<UserCoupon[]>('/user-coupons/my-coupons');
    } catch (error) {
      console.error('Error fetching user coupons:', error);
      return [];
    }
  },

  /**
   * Validate coupon trước khi sử dụng
   */
  validateCoupon: async (userCouponId: number, totalAmount: number): Promise<UserCouponValidation> => {
    try {
      const response = await apiService.post<UserCouponValidation>(
        `/user-coupons/${userCouponId}/validate?totalAmount=${totalAmount}`,
        {}
      );
      return response;
    } catch (error: any) {
      console.error('Error validating user coupon:', error);
      return {
        valid: false,
        message: error?.response?.data?.message || 'Không thể validate mã giảm giá',
      };
    }
  },
};

