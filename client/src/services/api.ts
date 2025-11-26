// const API_BASE_URL = "http://13.251.125.90:8080/api";
const API_BASE_URL = "http://localhost:8080/api";

interface ApiError {
  message: string;
  status: number;
  response?: {
    data?: any;
  };
}

// Track if we're currently refreshing the token
let isRefreshing = false;
let refreshAttempts = 0; // Track number of refresh attempts to prevent infinite loops
const MAX_REFRESH_ATTEMPTS = 1; // Only allow 1 refresh attempt per session
const retryAttempts = new Map<string, number>(); // Track retry attempts per endpoint to prevent infinite loops
const MAX_RETRY_ATTEMPTS = 1; // Only allow 1 retry per endpoint after refresh
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

// Reset refresh attempts (useful after successful login)
export const resetRefreshAttempts = () => {
  refreshAttempts = 0;
  retryAttempts.clear(); // Also clear retry attempts
};

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

// Helper function to determine correct login page based on current route
const getLoginPath = (): string => {
  const currentPath = window.location.pathname;
  // If we're on an admin route, redirect to admin login
  if (currentPath.startsWith("/admin")) {
    return "/admin/login";
  }
  return "/login";
};

// Handle 401 errors and token refresh
const handle401Error = async (
  originalRequest: () => Promise<any>
): Promise<any> => {
  if (isRefreshing) {
    // If already refreshing, queue this request
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    })
      .then(() => originalRequest())
      .catch((err) => Promise.reject(err));
  }

  isRefreshing = true;

  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    processQueue(new Error("No refresh token"));
    isRefreshing = false;
    // Clear auth and redirect to appropriate login page
    try {
      const { authService } = await import("./auth.service");
      authService.clearAuth();
    } catch (e) {
      // If import fails, manually clear localStorage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_info");
    }
    window.location.href = getLoginPath();
    return Promise.reject(new Error("No refresh token"));
  }

  try {
    // Import dynamically to avoid circular dependency
    const { authService } = await import("./auth.service");
    const success = await authService.refreshToken();

    if (success) {
      processQueue();
      isRefreshing = false;
      // Reset refresh attempts after successful refresh to allow future refreshes
      refreshAttempts = 0;
      console.log("[API] ✅ Token refreshed successfully. Retrying request...");

      // Small delay to ensure token is fully stored in localStorage
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify new token is available and log it
      const newToken = localStorage.getItem("auth_token");
      if (!newToken) {
        console.error("[API] ❌ New token not found after refresh!");
        throw new Error("Token not stored after refresh");
      }

      // Log token preview to verify it's the new token
      const tokenPreview =
        newToken.length > 30
          ? `${newToken.substring(0, 20)}...${newToken.substring(
              newToken.length - 10
            )}`
          : newToken.substring(0, 30);
      console.log("[API] 🔄 Retrying request with new token:", tokenPreview);

      // Force clear any cached token by reading directly from localStorage again
      // This ensures we use the fresh token
      const freshToken = localStorage.getItem("auth_token");
      console.log(
        "[API] 🔑 Fresh token from localStorage:",
        freshToken
          ? `${freshToken.substring(0, 20)}...${freshToken.substring(
              freshToken.length - 10
            )}`
          : "NOT FOUND"
      );

      // Retry request với token mới (không dùng originalRequest vì nó có closure với token cũ)
      // Check if we've already retried this endpoint to prevent infinite loops
      const retryCount = retryAttempts.get(endpoint) || 0;
      if (retryCount >= MAX_RETRY_ATTEMPTS) {
        console.error(
          "[API] ❌ Max retry attempts reached for endpoint:",
          endpoint
        );
        console.log("[API] 🔄 Reloading page...");
        window.location.reload();
        return Promise.reject(new Error("Max retry attempts reached"));
      }

      // Increment retry count for this endpoint
      retryAttempts.set(endpoint, retryCount + 1);

      try {
        if (method === "GET") {
          return await apiService.get<T>(endpoint);
        } else if (method === "POST") {
          return await apiService.post<T>(endpoint, body);
        } else if (method === "PUT") {
          return await apiService.put<T>(endpoint, body);
        } else if (method === "DELETE") {
          return await apiService.delete<T>(endpoint);
        }
        return originalRequest();
      } catch (retryError) {
        // If retry still fails with 401, reload the page instead of redirecting
        if ((retryError as ApiError).status === 401) {
          console.error(
            "[API] ❌ Request still unauthorized after token refresh. Endpoint:",
            endpoint
          );
          console.error(
            "[API] ❌ This may indicate:",
            "- Backend rejected the new token",
            "- User role changed or token doesn't have required permissions",
            "- Token not properly stored or used in retry"
          );
          console.log("[API] 🔄 Reloading page...");
          // Reload the current page instead of redirecting
          window.location.reload();
          return Promise.reject(retryError);
        }
        throw retryError;
      } finally {
        // Clear retry count on success (will be cleared when request succeeds)
        // But keep it if failed to prevent infinite retries
      }
    } else {
      throw new Error("Token refresh failed");
    }
  } catch (error) {
    processQueue(error);
    isRefreshing = false;

    // Check if error is 500 from refresh endpoint - this indicates backend issue
    const apiError = error as ApiError;
    if (apiError.status === 500) {
      console.error(
        "[API] ❌ Backend error during token refresh (500). This may indicate:"
      );
      console.error("- Database connection issue");
      console.error("- Hibernate session issue");
      console.error("- Server internal error");
      console.error("[API] 🔄 Clearing auth and redirecting to login...");
      clearAuthData();
      // Redirect to login page
      window.location.href = "/admin/login";
      return Promise.reject(error);
    }

    // Clear auth but don't redirect for other errors
    console.error("[API] ❌ Token refresh failed:", error);
    console.error(
      "[API] 🔄 Token refresh failed. Auth cleared but not redirecting."
    );
    // authService.refreshToken() already clears auth on failure
    // Ensure auth is cleared (refreshToken already cleared it, but double-check)
    clearAuthData();
    return Promise.reject(error);
  }
};

export const apiService = {
  async get<T>(endpoint: string): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const headers = { ...(await getAuthHeaders()) }; // Get auth headers

      // Reduced logging - only log errors, not every request

      const response = await fetch(fullUrl, {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[API] ❌ GET Error:", {
          url: fullUrl,
          status: response.status,
          error: errorData,
        });

        // Handle 401 Unauthorized
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(makeRequest);
        }

        throw {
          message:
            errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          response: { data: errorData },
        } as ApiError & { response?: { data?: any } };
      }

      const data = await response.json();

      // Only log important responses (payment status changes)
      const isPollingRequest = endpoint.includes("/payment/check-qr");
      if (isPollingRequest && (data.paid || data.cancelled)) {
        console.log("[API] ✅ Payment status changed:", {
          url: fullUrl,
          status: response.status,
        });
      }

      return data;
    };

    try {
      return await makeRequest();
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      console.error("[API] ❌ GET Network Error:", error);
      throw new Error("Network error. Please check your connection.");
    }
  },

  async post<T>(
    endpoint: string,
    data: unknown,
    options?: { headers?: Record<string, string> }
  ): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const isFormData = data instanceof FormData;
      const headers: Record<string, string> = {
        ...(await getAuthHeaders()), // Get auth headers
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options?.headers,
      };

      // Reduced logging to avoid noise
      // console.log("[API] 🔵 POST Request:", fullUrl);

      const response = await fetch(fullUrl, {
        method: "POST",
        headers,
        body: isFormData ? data : JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[API] ❌ POST Error:", {
          url: fullUrl,
          status: response.status,
          error: errorData,
          requestData: isFormData ? "[FormData]" : data,
        });

        // Handle 401 Unauthorized
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(makeRequest);
        }

        throw {
          message:
            errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          response: { data: errorData },
        } as ApiError & { response?: { data?: any } };
      }

      const responseData = await response.json();
      // Reduced logging - only log errors or important responses
      // console.log("[API] ✅ POST Response:", { url: fullUrl, status: response.status });

      return responseData;
    };

    try {
      return await makeRequest();
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      console.error("[API] ❌ POST Network Error:", error);
      throw new Error("Network error. Please check your connection.");
    }
  },

  async put<T>(
    endpoint: string,
    data: unknown,
    options?: { headers?: Record<string, string> }
  ): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const isFormData = data instanceof FormData;
      const headers: Record<string, string> = {
        ...getAuthHeaders(),
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
          return handle401Error(makeRequest);
        }

        throw {
          message:
            errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          response: { data: errorData },
        } as ApiError & { response?: { data?: any } };
      }
      return response.json();
    };

    try {
      return await makeRequest();
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  async delete<T>(endpoint: string): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle 401 Unauthorized
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(makeRequest);
        }

        throw {
          message:
            errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          response: { data: errorData },
        } as ApiError & { response?: { data?: any } };
      }
      return response.json();
    };

    try {
      return await makeRequest();
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },
};
