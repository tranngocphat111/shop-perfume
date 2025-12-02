import { refreshTokenManager } from "./refreshTokenManager";

const API_BASE_URL = "http://13.251.125.90:8080/api";
// const API_BASE_URL = "http://localhost:8080/api";

interface ApiError {
  message: string;
  status: number;
  response?: {
    data?: unknown;
  };
}

// Helper function to clear auth without importing authService (avoid circular dependency)
const clearAuthData = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_info");
};

// Helper function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expirationTime;
  } catch {
    return true; // If can't parse, consider it expired
  }
};

// Helper function to check if token will expire soon (within 5 minutes)
const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expirationTime = payload.exp * 1000;
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    return Date.now() >= expirationTime - fiveMinutes;
  } catch {
    return true; // If can't parse, consider it expired
  }
};

// Ensure token is valid before making request (proactive refresh)
// This prevents 401 errors by refreshing token before it expires
const ensureValidToken = async (): Promise<void> => {
  const token = localStorage.getItem("auth_token");

  // If no token, nothing to do (request will fail with 401, which is handled)
  if (!token) {
    return;
  }

  // Check if token is expired or expiring soon
  if (isTokenExpired(token) || isTokenExpiringSoon(token)) {
    // Try to refresh token proactively
    await refreshTokenManager.refreshToken();
  }
};

// Helper function to get auth headers
const getAuthHeaders = (endpoint: string = ""): Record<string, string> => {
  const headers: Record<string, string> = {};

  // Special handling for order endpoints - always send token if available
  // Backend allows guest access, but if token is present, it will use userId
  const isOrderEndpoint = endpoint.includes("/orders/create") || 
                         endpoint.includes("/orders/my-orders");
  
  if (isOrderEndpoint) {
    // Always send token if available (even though endpoint is public)
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  // Don't send token for other public endpoints
  if (isPublicEndpoint(endpoint)) {
    return headers;
  }

  const token = localStorage.getItem("auth_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

// Check if endpoint is public (doesn't require authentication)
// NOTE: /orders/create and /orders/my-orders are NOT in this list
// - We want to send token if user is logged in
// - Backend allows guest access (permitAll), but if token is present, it will use userId
const isPublicEndpoint = (endpoint: string): boolean => {
  // Public endpoints that don't require authentication (check these FIRST)
  // Special public order endpoints (guest can access)
  if (
    endpoint.includes("/orders/my-orders") ||
    endpoint.includes("/orders/create") ||
    /\/orders\/\d+\/cancel-timeout/.test(endpoint)
  ) {
    return true; // Public - guest can search orders by email or create order
  }

  // Public endpoints that don't require authentication
  const publicEndpoints = [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/payment/check-qr",
    "/brands/",
    "/categories/",
    "/webhooks/",
  ];

  if (publicEndpoints.some((publicPath) => endpoint.includes(publicPath))) {
    return true;
  }

  // Protected endpoints that require authentication - always send token
  const protectedEndpoints = [
    "/auth/me",
    "/auth/change-password",
    "/auth/update",
    "/admin/", // All admin endpoints require ADMIN role
    "/dashboard/", // Dashboard requires ADMIN role
    "/products/", // Products: POST/PUT/DELETE require ADMIN, GET is public but send token anyway
    "/inventories/", // Inventories: PUT requires ADMIN, GET is public but send token anyway
    "/addresses/", // All addresses endpoints require authentication
    "/carts/", // All cart endpoints require authentication
    "/reviews/", // Review endpoints require authentication
    "/users/me", // User profile requires authentication
    "/coupons/", // Coupon endpoints require authentication
  ];

  // If endpoint matches any protected pattern, it's NOT public
  if (
    protectedEndpoints.some((protectedPath) => endpoint.includes(protectedPath))
  ) {
    return false; // Not public, send token
  }

  // Default: if endpoint contains /orders/ but not in public list above, it's protected
  if (endpoint.includes("/orders/")) {
    return false; // Protected, send token
  }

  // Default: not public
  return false;
};

// Handle 401 errors - try refresh token first, then redirect
// retryCount: 0 = first attempt, 1 = already retried once, prevent infinite loop
const handle401Error = async <T>(
  endpoint: string,
  originalRequest?: () => Promise<T>,
  retryCount: number = 0
): Promise<T> => {
  // CRITICAL: If this is /auth/refresh endpoint, never try to refresh again
  // This prevents infinite loop if /auth/refresh itself returns 401
  if (endpoint.includes("/auth/refresh")) {
    console.error("Refresh token endpoint returned 401, logging out");
    clearAuthData();
    const isAdminEndpoint = endpoint.includes("/admin/");
    window.location.href = isAdminEndpoint ? "/admin/login" : "/login";
    return Promise.reject(new Error("Refresh token invalid"));
  }

  // If this is a public endpoint, don't logout - just reject the error
  if (isPublicEndpoint(endpoint)) {
    console.warn(`401 on public endpoint ${endpoint} - not logging out`);
    return Promise.reject(new Error("Unauthorized"));
  }

  // If already retried once, don't retry again to prevent infinite loop
  if (retryCount > 0) {
    console.error("Request failed after retry, logging out");
    clearAuthData();
    const isAdminEndpoint = endpoint.includes("/admin/");
    window.location.href = isAdminEndpoint ? "/admin/login" : "/login";
    return Promise.reject(new Error("Unauthorized after retry"));
  }

  // Try to refresh token first using shared refresh manager
  const refreshed = await refreshTokenManager.refreshToken();

  if (refreshed && originalRequest) {
    // Retry the original request with new token (only once)
    // getAuthHeaders() will automatically use the new token from localStorage
    try {
      return await originalRequest();
    } catch (retryError) {
      // If retry still fails, call handle401Error again with retryCount=1 to prevent further retries
      console.error("Request failed after token refresh:", retryError);
      // Check if it's still a 401 error
      if ((retryError as ApiError).status === 401) {
        return handle401Error(endpoint, originalRequest, 1);
      }
      // For other errors, throw them
      throw retryError;
    }
  }

  // If refresh failed, clear auth and redirect
  clearAuthData();
  const isAdminEndpoint = endpoint.includes("/admin/");
  window.location.href = isAdminEndpoint ? "/admin/login" : "/login";
  return Promise.reject(new Error("Unauthorized"));
};

// Helper to parse error response
const parseErrorResponse = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

// Helper to create ApiError
const createApiError = (
  errorData: unknown,
  status: number
): ApiError & { response?: { data?: unknown } } => {
  const data = errorData as { message?: string };
  return {
    message: data?.message || `HTTP error! status: ${status}`,
    status,
    response: { data: errorData },
  };
};

export const apiService = {
  async get<T>(endpoint: string): Promise<T> {
    // Ensure token is valid before making request (proactive refresh)
    // Skip for public endpoints
    if (!endpoint.includes("/auth/")) {
      await ensureValidToken();
    }

    const makeRequest = async (): Promise<T> => {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const headers = getAuthHeaders(endpoint);
      const response = await fetch(fullUrl, { headers });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);

        // Handle 401 Unauthorized - try refresh token first
        // Exclude /auth/refresh to prevent infinite loop
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(endpoint, makeRequest, 0);
        }

        throw createApiError(errorData, response.status);
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

  async post<T>(
    endpoint: string,
    data: unknown,
    options?: { headers?: Record<string, string> }
  ): Promise<T> {
    // Ensure token is valid before making request (proactive refresh)
    // Skip for public endpoints
    if (!endpoint.includes("/auth/")) {
      await ensureValidToken();
    }

    const makeRequest = async (): Promise<T> => {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const isFormData = data instanceof FormData;
      const headers: Record<string, string> = {
        ...getAuthHeaders(endpoint),
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options?.headers,
      };

      const response = await fetch(fullUrl, {
        method: "POST",
        headers,
        body: isFormData ? data : JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);

        // Handle 401 Unauthorized - try refresh token first
        // Exclude /auth/refresh to prevent infinite loop
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(endpoint, makeRequest, 0);
        }

        throw createApiError(errorData, response.status);
      }

      // Handle empty response (no content)
      const text = await response.text();

      if (!text || text.trim() === "") {
        return {} as T; // Return empty object for void responses
      }

      // Try to parse as JSON
      try {
        return JSON.parse(text) as T;
      } catch {
        // If not JSON, return as text (shouldn't happen with our API)
        return text as unknown as T;
      }
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

  async put<T>(
    endpoint: string,
    data: unknown,
    options?: { headers?: Record<string, string> }
  ): Promise<T> {
    // Ensure token is valid before making request (proactive refresh)
    // Skip for public endpoints
    if (!endpoint.includes("/auth/")) {
      await ensureValidToken();
    }

    const makeRequest = async (): Promise<T> => {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const isFormData = data instanceof FormData;
      const headers: Record<string, string> = {
        ...getAuthHeaders(endpoint),
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options?.headers,
      };

      const response = await fetch(fullUrl, {
        method: "PUT",
        headers,
        body: isFormData ? data : JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);

        // Handle 401 Unauthorized - try refresh token first
        // Exclude /auth/refresh to prevent infinite loop
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(endpoint, makeRequest, 0);
        }

        throw createApiError(errorData, response.status);
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
    // Ensure token is valid before making request (proactive refresh)
    // Skip for public endpoints
    if (!endpoint.includes("/auth/")) {
      await ensureValidToken();
    }

    const makeRequest = async (): Promise<T> => {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const headers = getAuthHeaders(endpoint);

      const response = await fetch(fullUrl, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);

        // Handle 401 Unauthorized - try refresh token first
        // Exclude /auth/refresh to prevent infinite loop
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(endpoint, makeRequest, 0);
        }

        throw createApiError(errorData, response.status);
      }

      // Handle 204 No Content (successful delete with no body)
      if (response.status === 204 || response.status === 200) {
        const contentType = response.headers.get("content-type");
        // Only parse JSON if there's actually content
        if (contentType && contentType.includes("application/json")) {
          const text = await response.text();
          return text ? JSON.parse(text) : (null as T);
        }
        return null as T;
      }

      // For other success statuses, try to parse JSON
      return response.json();
    };

    try {
      return await makeRequest();
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      // Check if it's a JSON parse error from empty response
      if (error instanceof SyntaxError && error.message.includes("JSON")) {
        // This is likely a 204 No Content response, which is actually success
        return null as T;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },
};
