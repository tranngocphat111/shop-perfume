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

  // Validate coupon code (client-side validation)
  validateCoupon: async (code: string, totalAmount: number): Promise<CouponValidationResponse> => {
    try {
      // Get coupon information from backend
      const coupon = await apiService.get<Coupon>(`/coupons/code/${code}`);
      
      if (!coupon) {
        return {
          valid: false,
          message: 'Mã khuyến mãi không tồn tại',
        };
      }

      // Validate on client-side
      const now = new Date();
      const startDate = new Date(coupon.startDate);
      const endDate = new Date(coupon.endDate);

      // Check if coupon is active
      if (!coupon.isActive) {
        return {
          valid: false,
          message: 'Mã khuyến mãi không còn hiệu lực',
        };
      }

      // Check date validity
      if (now < startDate) {
        return {
          valid: false,
          message: 'Mã khuyến mãi chưa có hiệu lực',
        };
      }

      if (now > endDate) {
        return {
          valid: false,
          message: 'Mã khuyến mãi đã hết hạn',
        };
      }

      // Check minimum order value
      if (totalAmount < coupon.minOrderValue) {
        return {
          valid: false,
          message: `Đơn hàng tối thiểu ${coupon.minOrderValue.toLocaleString('vi-VN')}₫ để áp dụng mã này`,
        };
      }

      // Calculate discount
      const discountAmount = (totalAmount * coupon.discountPercent) / 100;

      return {
        valid: true,
        coupon,
        message: 'Mã khuyến mãi hợp lệ',
        discountAmount,
      };
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      return {
        valid: false,
        message: 'Mã khuyến mãi không tồn tại',
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

