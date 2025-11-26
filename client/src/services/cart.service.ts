import { apiService } from './api';
import type { CartItem } from '../types';

export interface CartResponse {
  cartId: number;
  items: CartItem[];
}

export interface CartItemRequest {
  productId: number;
  quantity: number;
}

export const cartService = {
  // Get or create cart by user ID
  getOrCreateCart: async (userId: number): Promise<CartResponse> => {
    return apiService.get<CartResponse>(`/carts/user/${userId}`);
  },

  // Merge session cart items with user's cart
  mergeCart: async (userId: number, sessionCartItems: CartItemRequest[]): Promise<CartResponse> => {
    return apiService.post<CartResponse>(`/carts/user/${userId}/merge`, sessionCartItems);
  },

  // Add item to cart
  addToCart: async (productId: number, quantity: number = 1) => {
    return apiService.post<CartItem[]>('/cart/add', { productId, quantity });
  },

  // Get cart items
  getCart: async () => {
    return apiService.get<CartItem[]>('/cart');
  },

  // Update cart item quantity
  updateCartItem: async (productId: number, quantity: number) => {
    return apiService.put<CartItem[]>(`/cart/update`, { productId, quantity });
  },

  // Remove item from cart
  removeFromCart: async (productId: number) => {
    return apiService.post<CartItem[]>('/cart/remove', { productId });
  },

  // Clear cart
  clearCart: async () => {
    return apiService.post<void>('/cart/clear', {});
  },
};
