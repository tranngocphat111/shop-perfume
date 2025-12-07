import { refreshTokenManager } from "./refreshTokenManager";

// const API_BASE_URL = "http://13.251.125.90:8080/api";
const API_BASE_URL = "http://localhost:8080/api";

interface ApiError {
  message: string;
  status: number;
  response?: {
    data?: unknown;
  };
}

// Helper function to clear auth without importing authService (avoid circular dependency)
// Chỉ xóa user_info từ localStorage - tokens được quản lý bởi HTTP-only cookies
const clearAuthData = () => {
  localStorage.removeItem("user_info");
  // Cookies sẽ được clear bởi backend khi gọi /auth/logout
};

// Với HTTP-only cookies, không cần kiểm tra token expiration ở frontend
// Backend sẽ tự động reject request nếu token hết hạn
// Frontend chỉ cần handle 401 error và gọi refresh

// Helper function to get auth headers
// Với HTTP-only cookies, không cần gửi Authorization header
// Cookies sẽ được browser tự động gửi khi credentials: 'include'
const getAuthHeaders = (): Record<string, string> => {
  // Không cần thêm Authorization header khi dùng HTTP-only cookies
  // Browser sẽ tự động gửi cookies với credentials: 'include'
  return {};
};

const isPublicEndpoint = (endpoint: string): boolean => {
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
    "/auth/google-signin",
    "/payment/check-qr",
    "/brands/",
    "/categories/",
    "/webhooks/",
  ];

  if (publicEndpoints.some((publicPath) => endpoint.includes(publicPath))) {
    return true;
  }

  // GET requests for products and inventories are public (viewing products doesn't require auth)
  const publicProductPatterns = [
    /^\/products\/\d+$/, // GET /products/{id}
    /^\/products\/category\/\d+$/, // GET /products/category/{id}
    /^\/products\/brand\/\d+$/, // GET /products/brand/{id}
    /^\/products\/search/, // GET /products/search
    /^\/products\/page/, // GET /products/page
    /^\/products$/, // GET /products
    /^\/inventories\/product\/\d+$/, // GET /inventories/product/{id}
    /^\/inventories\/product\/\d+\/available$/, // GET /inventories/product/{id}/available
    /^\/inventories\/best-sellers/, // GET /inventories/best-sellers
    /^\/inventories\/lowStock$/, // GET /inventories/lowStock
    /^\/inventories\/page/, // GET /inventories/page
    /^\/inventories$/, // GET /inventories
  ];

  if (publicProductPatterns.some((pattern) => pattern.test(endpoint))) {
    return true; // Public - guest can view products and inventories
  }

  // Protected endpoints that require authentication
  const protectedEndpoints = [
    "/auth/me",
    "/auth/change-password",
    "/auth/update",
    "/admin/", // All admin endpoints require ADMIN role
    "/dashboard/", // Dashboard requires ADMIN role
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
    return false; // Not public
  }

  // Default: if endpoint contains /orders/ but not in public list above, it's protected
  if (endpoint.includes("/orders/")) {
    return false; // Protected
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
    try {
      return await originalRequest();
    } catch (retryError) {
      console.error("Request failed after token refresh:", retryError);
      if ((retryError as ApiError).status === 401) {
        return handle401Error(endpoint, originalRequest, 1);
      }
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
    const makeRequest = async (): Promise<T> => {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const headers = getAuthHeaders();

      const response = await fetch(fullUrl, {
        headers,
        credentials: 'include', // QUAN TRỌNG: Để gửi/nhận HTTP-only cookies
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);

        // Handle 401 Unauthorized - try refresh token first
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
    options?: { headers?: Record<string, string>; timeout?: number }
  ): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const isFormData = data instanceof FormData;
      const headers: Record<string, string> = {
        ...getAuthHeaders(),
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options?.headers,
      };

      // Set timeout (default 60 seconds, 300 seconds for order creation)
      const timeout =
        options?.timeout ||
        (endpoint.includes("/orders/create") ? 300000 : 60000);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(fullUrl, {
          method: "POST",
          headers,
          body: isFormData ? data : JSON.stringify(data),
          signal: controller.signal,
          credentials: 'include', // QUAN TRỌNG: Để gửi/nhận HTTP-only cookies
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await parseErrorResponse(response);

          // Handle 401 Unauthorized - try refresh token first
          if (response.status === 401 && !endpoint.includes("/auth/")) {
            return handle401Error(endpoint, makeRequest, 0);
          }

          throw createApiError(errorData, response.status);
        }

        // Handle empty response (no content)
        const text = await response.text();

        if (!text || text.trim() === "") {
          return {} as T;
        }

        // Try to parse as JSON
        try {
          return JSON.parse(text) as T;
        } catch {
          return {} as T;
        }
      } catch (error: unknown) {
        clearTimeout(timeoutId);

        // Handle timeout/abort error
        const err = error as { name?: string; message?: string };
        if (err.name === "AbortError" || err.name === "TimeoutError") {
          const timeoutError = createApiError(
            {
              message: "Request timeout. Vui lòng thử lại.",
              isFrontendTimeout: true,
            },
            408
          );
          delete timeoutError.response;
          throw timeoutError;
        }

        // Re-throw if it's already an ApiError
        if ((error as ApiError).status) {
          throw error;
        }

        // Handle network errors
        throw createApiError(
          {
            message:
              err.message || "Network error. Please check your connection.",
          },
          0
        );
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
    const makeRequest = async (): Promise<T> => {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const isFormData = data instanceof FormData;
      const headers: Record<string, string> = {
        ...getAuthHeaders(),
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options?.headers,
      };

      const response = await fetch(fullUrl, {
        method: "PUT",
        headers,
        body: isFormData ? data : JSON.stringify(data),
        credentials: 'include', // QUAN TRỌNG: Để gửi/nhận HTTP-only cookies
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);

        // Handle 401 Unauthorized - try refresh token first
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
    const makeRequest = async (): Promise<T> => {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const headers = getAuthHeaders();

      const response = await fetch(fullUrl, {
        method: "DELETE",
        headers,
        credentials: 'include', // QUAN TRỌNG: Để gửi/nhận HTTP-only cookies
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);

        // Handle 401 Unauthorized - try refresh token first
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(endpoint, makeRequest, 0);
        }

        throw createApiError(errorData, response.status);
      }

      // Handle 204 No Content (successful delete with no body)
      if (response.status === 204 || response.status === 200) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const text = await response.text();
          return text ? JSON.parse(text) : (null as T);
        }
        return null as T;
      }

      return response.json();
    };

    try {
      return await makeRequest();
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      if (error instanceof SyntaxError && error.message.includes("JSON")) {
        return null as T;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },
};
