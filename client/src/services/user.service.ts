import { apiService } from './api';

export interface UserInfo {
  userId: number;
  name: string;
  email: string;
  loyaltyPoints: number;
  role: string;
}

export const userService = {
  /**
   * Get current user info including loyalty points
   */
  getCurrentUser: async (): Promise<UserInfo | null> => {
    try {
      console.log('🔄 [userService] Calling /auth/me...');
      const result = await apiService.get<UserInfo>('/auth/me');
      console.log('✅ [userService] Got user info:', result);
      return result;
    } catch (error: any) {
      console.error('❌ [userService] Error fetching user info:', error);
      console.error('Error status:', error?.status);
      console.error('Error message:', error?.message);
      return null;
    }
  },
};

