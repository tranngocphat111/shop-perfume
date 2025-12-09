import { apiService } from "./api";

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

import type { UserDetailResponse, PageResponse } from "../types";

export const userService = {
  /**
   * Get current user info including loyalty points
   */
  getCurrentUser: async (): Promise<UserInfo | null> => {
    try {
      console.log("🔄 [userService] Calling /auth/me...");
      const result = await apiService.get<UserInfo>("/auth/me");
      console.log("✅ [userService] Got user info:", result);
      return result;
    } catch (error: any) {
      console.error("❌ [userService] Error fetching user info:", error);
      console.error("Error status:", error?.status);
      console.error("Error message:", error?.message);
      return null;
    }
  },

  /**
   * Get users with pagination (Admin)
   */
  getUsersPage: async (
    page: number,
    size: number,
    sortBy?: string,
    direction?: string,
    search?: string
  ): Promise<PageResponse<UserDetailResponse>> => {
    let url = `/admin/users/page?page=${page}&size=${size}`;

    if (sortBy && direction) {
      url += `&sortBy=${sortBy}&direction=${direction}`;
    }

    if (search && search.trim() !== "") {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    return apiService.get<PageResponse<UserDetailResponse>>(url);
  },

  /**
   * Get user by ID (Admin)
   */
  getUserById: async (userId: number): Promise<UserDetailResponse> => {
    return apiService.get<UserDetailResponse>(`/admin/users/${userId}`);
  },

  /**
   * Update user profile (name)
   */
  updateProfile: async (request: UpdateUserRequest): Promise<UserInfo> => {
    try {
      const response = await apiService.put<UserInfo>("/auth/me", request);
      return response;
    } catch (error: any) {
      console.error("Error updating profile:", error);
      // Handle different error formats
      let errorMessage = "Không thể cập nhật thông tin";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
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
      await apiService.post("/auth/change-password", request);
    } catch (error: any) {
      console.error("Error changing password:", error);
      let errorMessage = "Không thể đổi mật khẩu";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Update user status (Admin)
   */
  updateUserStatus: async (userId: number, status: string): Promise<void> => {
    return apiService.put(`/admin/users/${userId}/status?status=${status}`, {});
  },

  /**
   * Update user roles (Admin)
   */
  updateUserRoles: async (userId: number, roles: string[]): Promise<void> => {
    return apiService.put(`/admin/users/${userId}/roles`, { roles });
  },
};
