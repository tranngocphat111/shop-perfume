import { apiService } from './api';

export interface UserInfo {
  userId: number;
  name: string;
  email: string;
  loyaltyPoints: number;
  role: string;
}

export interface UpdateUserRequest {
  name: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
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

  /**
   * Update user profile (name)
   */
  updateProfile: async (request: UpdateUserRequest): Promise<UserInfo> => {
    try {
      const response = await apiService.put<UserInfo>('/auth/me', request);
      return response;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      // Handle different error formats
      let errorMessage = 'Không thể cập nhật thông tin';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Change password
   */
  changePassword: async (request: ChangePasswordRequest): Promise<void> => {
    try {
      await apiService.put('/auth/change-password', request);
    } catch (error: any) {
      console.error('Error changing password:', error);
      let errorMessage = 'Không thể đổi mật khẩu';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      throw new Error(errorMessage);
    }
  },
};

