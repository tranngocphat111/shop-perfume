import { apiService } from './api';
import type { CartItem } from '../types';

export const cartService = {
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
