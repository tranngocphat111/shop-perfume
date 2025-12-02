import { apiService } from './api';

export interface Review {
  reviewId: number;
  rating: number;
  comment: string;
  createdAt: string;
  lastUpdated: string;
  userId: number;
  userName: string;
  productId: number;
  productName: string;
}

export interface ReviewRequest {
  productId: number;
  rating: number;
  comment?: string;
}

export const reviewService = {
  /**
   * Tạo review mới
   */
  createReview: async (request: ReviewRequest): Promise<Review> => {
    return apiService.post<Review>('/reviews', request);
  },

  /**
   * Lấy tất cả review của một sản phẩm
   */
  getReviewsByProduct: async (productId: number): Promise<Review[]> => {
    return apiService.get<Review[]>(`/reviews/product/${productId}`);
  },

  /**
   * Lấy tất cả review của một user
   */
  getReviewsByUser: async (userId: number): Promise<Review[]> => {
    return apiService.get<Review[]>(`/reviews/user/${userId}`);
  },

  /**
   * Kiểm tra user đã đánh giá sản phẩm chưa
   */
  hasUserReviewedProduct: async (productId: number): Promise<boolean> => {
    return apiService.get<boolean>(`/reviews/check/${productId}`);
  },
};

