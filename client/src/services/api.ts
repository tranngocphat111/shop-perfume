const API_BASE_URL = "http://13.251.125.90:8080/api";
// const API_BASE_URL = "http://localhost:8080/api";

interface ApiError {
  message: string;
  status: number;
  response?: {
    data?: unknown;
  };
}

// REFRESH TOKEN - COMMENTED OUT
// Track if we're currently refreshing the token
// let isRefreshing = false;
// let refreshAttempts = 0; // Track number of refresh attempts to prevent infinite loops
// const MAX_REFRESH_ATTEMPTS = 1; // Only allow 1 refresh attempt per session
// let failedQueue: Array<{
//   resolve: (value?: unknown) => void;
//   reject: (reason?: unknown) => void;
// }> = [];

// Reset refresh attempts (useful after successful login)
// export const resetRefreshAttempts = () => {
//   refreshAttempts = 0;
//   console.log("[API] 🔄 Refresh attempts reset");
// };
export const resetRefreshAttempts = () => {
  // No-op when refresh token is disabled
};

// REFRESH TOKEN - COMMENTED OUT
// const processQueue = (error: unknown = null) => {
//   failedQueue.forEach((prom) => {
//     if (error) {
//       prom.reject(error);
//     } else {
//       prom.resolve();
//     }
//   });
//   failedQueue = [];
// };

// Helper function to clear auth without importing authService (avoid circular dependency)
const clearAuthData = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_info");
};

// Helper function to get auth headers
const getAuthHeaders = async (
  debug: boolean = false
): Promise<Record<string, string>> => {
  const token = localStorage.getItem("auth_token");

  if (!token) {
    if (debug) {
      console.warn("[API] ⚠️ No token found in localStorage");
    }
    // REFRESH TOKEN - COMMENTED OUT
    // Reset refresh attempts if no token - user needs to login again
    // refreshAttempts = 0;
    return {};
  }

  // REFRESH TOKEN - COMMENTED OUT
  // Reset refresh attempts if we have a valid token (not expired)
  // This allows refresh to work again after user has a valid token
  // if (refreshAttempts > 0) {
  //   try {
  //     const payload = JSON.parse(atob(token.split(".")[1]));
  //     const expirationTime = payload.exp * 1000;
  //     const now = Date.now();
  //     // If token is still valid (not expired), reset attempts
  //     if (now < expirationTime) {
  //       if (debug) {
  //         console.log("[API] 🔄 Resetting refresh attempts - token is valid");
  //       }
  //       refreshAttempts = 0;
  //     }
  //   } catch {
  //     // If can't parse token, don't reset
  //   }
  // }

  // Don't auto-refresh here - let the API call fail with 401 and handle401Error will refresh
  // This prevents race conditions and multiple refresh attempts

  if (token) {
    if (debug) {
      // Log token prefix for debugging (first 20 chars + last 10 chars)
      const tokenPreview =
        token.length > 30
          ? `${token.substring(0, 20)}...${token.substring(token.length - 10)}`
          : token.substring(0, 30);
      console.log("[API] 🔑 Using token:", tokenPreview);
    }
    return { Authorization: `Bearer ${token}` };
  }

  return {};
};

// Helper function removed - no longer redirecting on 401

// REFRESH TOKEN - COMMENTED OUT
// Handle 401 errors and token refresh
const handle401Error = async <T>(
  _originalRequest: () => Promise<T>,
  endpoint: string
): Promise<T> => {
  // REFRESH TOKEN DISABLED - Just redirect to login on 401
  console.error("[API] ❌ Unauthorized (401). Redirecting to login...");
  clearAuthData();
  // Redirect to admin login if it's an admin endpoint, otherwise regular login
  const isAdminEndpoint = endpoint.includes("/admin/");
  window.location.href = isAdminEndpoint ? "/admin/login" : "/login";
  return Promise.reject(new Error("Unauthorized"));

  // REFRESH TOKEN CODE - COMMENTED OUT
  // // Prevent infinite loops: if we've already tried refreshing, redirect to login
  // if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
  //   console.error(
  //     "[API] ❌ Max refresh attempts reached. Redirecting to login..."
  //   );
  //   clearAuthData();
  //   // Redirect to admin login if it's an admin endpoint, otherwise regular login
  //   const isAdminEndpoint = endpoint.includes("/admin/");
  //   window.location.href = isAdminEndpoint ? "/admin/login" : "/login";
  //   return Promise.reject(new Error("Max refresh attempts reached"));
  // }

  // if (isRefreshing) {
  //   // If already refreshing, queue this request
  //   return new Promise((resolve, reject) => {
  //     failedQueue.push({ resolve, reject });
  //   })
  //     .then(() => {
  //       // After refresh, retry with new token (only if refresh was successful)
  //       if (refreshAttempts < MAX_REFRESH_ATTEMPTS) {
  //         if (method === "GET") {
  //           return apiService.get<T>(endpoint);
  //         } else if (method === "POST") {
  //           return apiService.post<T>(endpoint, body);
  //         } else if (method === "PUT") {
  //           return apiService.put<T>(endpoint, body);
  //         } else if (method === "DELETE") {
  //           return apiService.delete<T>(endpoint);
  //         }
  //       }
  //       return originalRequest();
  //     })
  //     .catch((err) => Promise.reject(err));
  // }

  // isRefreshing = true;
  // refreshAttempts++;

  // const refreshToken = localStorage.getItem("refresh_token");
  // if (!refreshToken) {
  //   processQueue(new Error("No refresh token"));
  //   isRefreshing = false;
  //   // Clear auth but don't redirect
  //   console.error(
  //     "[API] ❌ No refresh token available. Clearing auth but not redirecting."
  //   );
  //   clearAuthData();
  //   return Promise.reject(new Error("No refresh token"));
  // }

  // try {
  //   // Import dynamically to avoid circular dependency
  //   const { authService } = await import("./auth.service");
  //   // Pass delayClear=true để delay clear auth, cho phép user xem log trước
  //   const success = await authService.refreshToken(true);

  //   if (success) {
  //     processQueue();
  //     isRefreshing = false;
  //     // Reset refresh attempts after successful refresh to allow future refreshes
  //     refreshAttempts = 0;
  //     console.log("[API] ✅ Token refreshed successfully. Retrying request...");

  //     // Small delay to ensure token is fully stored in localStorage
  //     await new Promise((resolve) => setTimeout(resolve, 100));

  //     // Verify new token is available and log it
  //     const newToken = localStorage.getItem("auth_token");
  //     if (!newToken) {
  //       console.error("[API] ❌ New token not found after refresh!");
  //       throw new Error("Token not stored after refresh");
  //     }

  //     // Log token preview to verify it's the new token
  //     const tokenPreview =
  //       newToken.length > 30
  //         ? `${newToken.substring(0, 20)}...${newToken.substring(
  //             newToken.length - 10
  //           )}`
  //         : newToken.substring(0, 30);
  //     console.log("[API] 🔄 Retrying request with new token:", tokenPreview);

  //     // Force clear any cached token by reading directly from localStorage again
  //     // This ensures we use the fresh token
  //     const freshToken = localStorage.getItem("auth_token");
  //     console.log(
  //       "[API] 🔑 Fresh token from localStorage:",
  //       freshToken
  //         ? `${freshToken.substring(0, 20)}...${freshToken.substring(
  //             freshToken.length - 10
  //           )}`
  //         : "NOT FOUND"
  //     );

  //     // Retry request với token mới (không dùng originalRequest vì nó có closure với token cũ)
  //     // Only retry once - if it fails again, we'll reload the page
  //     try {
  //       if (method === "GET") {
  //         return await apiService.get<T>(endpoint);
  //       } else if (method === "POST") {
  //         return await apiService.post<T>(endpoint, body);
  //       } else if (method === "PUT") {
  //         return await apiService.put<T>(endpoint, body);
  //       } else if (method === "DELETE") {
  //         return await apiService.delete<T>(endpoint);
  //       }
  //       return originalRequest();
  //     } catch (retryError) {
  //       // If retry still fails with 401, reload the page instead of redirecting
  //       if ((retryError as ApiError).status === 401) {
  //         console.error(
  //           "[API] ❌ Request still unauthorized after token refresh. Endpoint:",
  //           endpoint
  //         );
  //         console.error(
  //           "[API] ❌ This may indicate:",
  //           "- Backend rejected the new token",
  //           "- User role changed or token doesn't have required permissions",
  //           "- Token not properly stored or used in retry"
  //         );
  //         console.log("[API] 🔄 Reloading page...");
  //         // Reload the current page instead of redirecting
  //         window.location.reload();
  //         return Promise.reject(retryError);
  //       }
  //       throw retryError;
  //     }
  //   } else {
  //     throw new Error("Token refresh failed");
  //   }
  // } catch (error) {
  //   processQueue(error);
  //   isRefreshing = false;
  //   // Don't reset refreshAttempts here - keep it to prevent infinite loops
  //   // It will be reset on successful login or when token is valid

  //   // Check if error is 500 from refresh endpoint - this indicates backend issue
  //   const apiError = error as ApiError;
  //   if (apiError.status === 500) {
  //     console.error(
  //       "[API] ❌ Backend error during token refresh (500). This may indicate:"
  //     );
  //     console.error("- Database connection issue");
  //     console.error("- Hibernate session issue");
  //     console.error("- Server internal error");
  //     console.error("[API] 🔄 Clearing auth and redirecting to login...");
  //     clearAuthData();
  //     refreshAttempts = 0; // Reset on redirect
  //     // Redirect to login page
  //     const isAdminEndpoint = endpoint.includes("/admin/");
  //     window.location.href = isAdminEndpoint ? "/admin/login" : "/login";
  //     return Promise.reject(error);
  //   }

  //   // Clear auth but don't redirect for other errors
  //   console.error("[API] ❌ Token refresh failed:", error);
  //   console.error(
  //     "[API] 🔄 Token refresh failed. Auth cleared but not redirecting."
  //   );
  //   // authService.refreshToken() already clears auth on failure
  //   // Ensure auth is cleared (refreshToken already cleared it, but double-check)
  //   clearAuthData();
  //   return Promise.reject(error);
  // }
};

export const apiService = {
  async get<T>(endpoint: string): Promise<T> {
    try {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const headers = { ...(await getAuthHeaders(true)) }; // Enable debug for admin endpoints

      // Log admin endpoints for debugging
      if (endpoint.includes("/admin/")) {
        console.log("[API] 🔵 GET Request:", fullUrl);
        console.log("[API] 🔵 Headers:", headers);
      }

      const response = await fetch(fullUrl, {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[API] ❌ GET Error:', {
          url: fullUrl,
          status: response.status,
          error: errorData
        });

        // Handle 401 Unauthorized
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(makeRequest, endpoint);
        }

        throw {
          message:
            errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          response: { data: errorData },
        } as ApiError & { response?: { data?: unknown } };
      }

      const data = await response.json();

      // Only log non-polling requests or if payment status changed
      if (!isPollingRequest || (data.paid || data.cancelled)) {
        console.log('[API] ✅ GET Response:', {
          url: fullUrl,
          status: response.status,
          data: data
        });
      }

      return data;
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      console.error('[API] ❌ GET Network Error:', error);
      throw new Error("Network error. Please check your connection.");
    }
  },

  async post<T>(
    endpoint: string,
    data: unknown,
    options?: { headers?: Record<string, string> }
  ): Promise<T> {
    try {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const isFormData = data instanceof FormData;
      const headers: Record<string, string> = {
        ...getAuthHeaders(),
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options?.headers,
      };

      console.log('[API] 🔵 POST Request:', fullUrl);
      console.log('[API] 🔵 Request Data:', isFormData ? '[FormData]' : data);
      console.log('[API] 🔵 Headers:', headers);

      const response = await fetch(fullUrl, {
        method: "POST",
        headers,
        body: isFormData ? data : JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[API] ❌ POST Error:', {
          url: fullUrl,
          status: response.status,
          error: errorData,
          requestData: isFormData ? '[FormData]' : data
        });

        // Handle 401 Unauthorized
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(makeRequest, endpoint);
        }

        throw {
          message:
            errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          response: { data: errorData },
        } as ApiError & { response?: { data?: unknown } };
      }

      const responseData = await response.json();
      console.log('[API] ✅ POST Response:', {
        url: fullUrl,
        status: response.status,
        data: responseData
      });

      return responseData;
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      console.error('[API] ❌ POST Network Error:', error);
      throw new Error("Network error. Please check your connection.");
    }
  },

  async put<T>(
    endpoint: string,
    data: unknown,
    options?: { headers?: Record<string, string> }
  ): Promise<T> {
    try {
      const isFormData = data instanceof FormData;
      const headers: Record<string, string> = {
        ...(await getAuthHeaders()), // Await async call
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options?.headers,
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "PUT",
        headers,
        body: isFormData ? data : JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle 401 Unauthorized
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(makeRequest, endpoint);
        }

        throw {
          message:
            errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          response: { data: errorData },
        } as ApiError & { response?: { data?: unknown } };
      }
      return response.json();
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: {
          ...(await getAuthHeaders()), // Await async call
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle 401 Unauthorized
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(makeRequest, endpoint);
        }

        throw {
          message:
            errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          response: { data: errorData },
        } as ApiError & { response?: { data?: unknown } };
      }
      return response.json();
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },
};
