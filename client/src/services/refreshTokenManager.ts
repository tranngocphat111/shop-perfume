// const API_BASE_URL = "http://13.251.125.90:8080/api";
const API_BASE_URL = "http://localhost:8080/api";

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken?: string; // Optional - backend may not return refresh token in body
  type: string;
}

// Shared refresh promise to prevent concurrent refresh requests
let refreshPromise: Promise<boolean> | null = null;
// Track if we're currently refreshing to prevent recursive calls
let isRefreshing = false;

const USER_KEY = "user_info";

/**
 * Shared refresh token manager
 * Với HTTP-only cookies:
 * - Refresh token được lưu trong cookie (không accessible từ JS)
 * - Browser tự động gửi cookie khi gọi /auth/refresh
 * - Backend set cookie mới sau khi refresh thành công
 */
export const refreshTokenManager = {
  /**
   * Refresh the access token using the refresh token cookie
   * Returns true if refresh was successful, false otherwise
   * If a refresh is already in progress, waits for it to complete
   */
  async refreshToken(): Promise<boolean> {
    // Protection: If already refreshing, wait for the existing promise
    if (isRefreshing && refreshPromise) {
      try {
        return await refreshPromise;
      } catch {
        refreshPromise = null;
        isRefreshing = false;
        return false;
      }
    }

    // Additional protection: If flag is set but no promise, something went wrong
    if (isRefreshing) {
      console.warn("Refresh flag set but no promise, resetting...");
      isRefreshing = false;
    }

    // Set refreshing flag before starting
    isRefreshing = true;

    try {
      // Create a promise for this refresh attempt
      refreshPromise = (async () => {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include', // QUAN TRỌNG: Để gửi refresh_token cookie
          // Body rỗng vì refresh token được gửi qua cookie
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error(`Refresh failed: ${response.status}`);
        }

        // Response có thể chứa user info, nhưng token được set qua cookie
        const data = await response.json() as TokenRefreshResponse;

        // Update user info in localStorage (chỉ lưu thông tin user, không lưu token)
        const userInfo = localStorage.getItem(USER_KEY);
        if (userInfo) {
          try {
            const user = JSON.parse(userInfo);
            // Không lưu token vào localStorage nữa
            // Token được quản lý bởi HTTP-only cookies
            if (data.accessToken) {
              // Chỉ cập nhật nếu có accessToken mới trong response body (cho backward compatibility)
              delete user.token;
              delete user.refreshToken;
            }
            localStorage.setItem(USER_KEY, JSON.stringify(user));
          } catch {
            // Ignore parse errors
          }
        }

        console.log("Token refreshed successfully via HTTP-only cookie");
        return true;
      })();

      const result = await refreshPromise;

      // Clear promise and flag on success
      refreshPromise = null;
      isRefreshing = false;
      return result;
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Clear promise and flag on error
      refreshPromise = null;
      isRefreshing = false;
      return false;
    }
  },

  /**
   * Clear the refresh promise (useful for testing or forced refresh)
   */
  clearRefreshPromise(): void {
    refreshPromise = null;
    isRefreshing = false;
  },
};

