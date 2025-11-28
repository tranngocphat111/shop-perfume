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
      // Kiểm tra token trước khi gọi API
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('No auth token found - skipping coupon load');
        return [];
      }
      
      return await apiService.get<UserCoupon[]>('/user-coupons/my-coupons');
    } catch (error: any) {
      console.error('Error fetching user coupons:', error);
      // Nếu 401, throw lỗi để CartSummary xử lý
      if (error?.status === 401) {
        throw error;
      }
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

