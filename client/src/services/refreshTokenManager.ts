const API_BASE_URL = "http://13.251.125.90:8080/api";
// const API_BASE_URL = "http://localhost:8080/api";

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
  type: string;
}

// Shared refresh promise to prevent concurrent refresh requests
let refreshPromise: Promise<TokenRefreshResponse> | null = null;
// Track if we're currently refreshing to prevent recursive calls
let isRefreshing = false;

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user_info";

/**
 * Shared refresh token manager
 * Prevents race conditions by ensuring only one refresh request at a time
 * Can be used by both api.ts and auth.service.ts
 */
export const refreshTokenManager = {
  /**
   * Refresh the access token using the refresh token
   * Returns true if refresh was successful, false otherwise
   * If a refresh is already in progress, waits for it to complete
   */
  async refreshToken(): Promise<boolean> {
    // Protection: If already refreshing, wait for the existing promise
    // This prevents concurrent refresh requests and infinite loops
    if (isRefreshing && refreshPromise) {
      try {
        await refreshPromise;
        // Check if token was successfully updated
        const newToken = localStorage.getItem(TOKEN_KEY);
        return newToken !== null && !isTokenExpired(newToken);
      } catch {
        // If refresh failed, clear promise and return false
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

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return false;
    }

    // Set refreshing flag before starting
    isRefreshing = true;

    try {
      // Create a promise for this refresh attempt
      refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Refresh failed: ${response.status}`);
        }
        return response.json() as Promise<TokenRefreshResponse>;
      });

      const data = await refreshPromise;

      // Update tokens in localStorage
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);

      // Update user info with new token
      const userInfo = localStorage.getItem(USER_KEY);
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          user.token = data.accessToken;
          user.refreshToken = data.refreshToken;
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        } catch {
          // Ignore parse errors
        }
      }

      console.log("Token refreshed successfully");

      // Clear promise and flag on success
      refreshPromise = null;
      isRefreshing = false;
      return true;
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

/**
 * Helper function to check if a token is expired
 */
function isTokenExpired(token: string): boolean {
  try {
    // Decode JWT token (without verification, just to check expiration)
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expirationTime;
  } catch {
    return true; // If can't parse, consider it expired
  }
}
