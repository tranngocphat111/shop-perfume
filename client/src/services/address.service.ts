/**
 * Address Service
 * Manages user saved addresses using API
 */

import { apiService } from './api';

export interface Address {
  id: number;
  addressId?: number; // For API response
  recipientName: string;
  phone: string;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddressRequest {
  recipientName: string;
  phone: string;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
  isDefault?: boolean;
}

export const addressService = {
  /**
   * Get all saved addresses for the authenticated user
   */
  getAddresses: async (): Promise<Address[]> => {
    try {
      const response = await apiService.get<Address[]>('/addresses');
      // Map addressId to id for backward compatibility
      return (response || []).map(addr => ({
        ...addr,
        id: addr.addressId || addr.id,
      }));
    } catch (error) {
      console.error('Error loading addresses:', error);
      return [];
    }
  },

  /**
   * Create a new address
   */
  createAddress: async (request: AddressRequest): Promise<Address> => {
    try {
      const response = await apiService.post<Address>('/addresses', request);
      return {
        ...response,
        id: response.addressId || response.id,
      };
    } catch (error: any) {
      console.error('Error creating address:', error);
      throw new Error(error.response?.data?.message || 'Không thể tạo địa chỉ');
    }
  },

  /**
   * Update an existing address
   */
  updateAddress: async (addressId: number, request: AddressRequest): Promise<Address> => {
    try {
      const response = await apiService.put<Address>(`/addresses/${addressId}`, request);
      return {
        ...response,
        id: response.addressId || response.id,
      };
    } catch (error: any) {
      console.error('Error updating address:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật địa chỉ');
    }
  },

  /**
   * Delete an address
   */
  deleteAddress: async (addressId: number): Promise<void> => {
    try {
      await apiService.delete(`/addresses/${addressId}`);
    } catch (error: any) {
      console.error('Error deleting address:', error);
      throw new Error(error.response?.data?.message || 'Không thể xóa địa chỉ');
    }
  },

  /**
   * Set an address as default
   */
  setDefaultAddress: async (addressId: number): Promise<Address> => {
    try {
      const response = await apiService.put<Address>(`/addresses/${addressId}/set-default`, {});
      return {
        ...response,
        id: response.addressId || response.id,
      };
    } catch (error: any) {
      console.error('Error setting default address:', error);
      throw new Error(error.response?.data?.message || 'Không thể đặt địa chỉ mặc định');
    }
  },

  /**
   * Get default address
   */
  getDefaultAddress: async (): Promise<Address | null> => {
    try {
      const addresses = await addressService.getAddresses();
      return addresses.find(a => a.isDefault) || addresses[0] || null;
    } catch (error) {
      console.error('Error getting default address:', error);
      return null;
    }
  },
};

