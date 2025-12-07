import { refreshTokenManager } from "./refreshTokenManager";

// Auto-detect environment and use appropriate API URL
const getApiBaseUrl = (): string => {
  // Production on Vercel: use Vercel proxy
  if (
    typeof window !== "undefined" &&
    window.location.hostname.includes("vercel.app")
  ) {
    return "/api";
  }

  // Development & Local: call deployed backend directly
  return "http://13.251.125.90:8080/api";
};

const API_BASE_URL = getApiBaseUrl();

console.log(
  "🌐 API Base URL:",
  API_BASE_URL,
  "| Environment:",
  import.meta.env.MODE
);

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

// Helper function to get auth headers (method-aware)
const getAuthHeaders = (
  endpoint: string = "",
  method: string = "GET"
): Record<string, string> => {
  const headers: Record<string, string> = {};

  // Debug logging (only during development) to help trace auth header decisions
  const isDev = import.meta.env.MODE !== "production";
  const tokenPresent = !!localStorage.getItem("auth_token");

  // Special handling for order endpoints - always send token if available
  // Backend allows guest access, but if token is present, it will use userId
  const isOrderEndpoint =
    endpoint.includes("/orders/create") ||
    endpoint.includes("/orders/my-orders");

  if (isOrderEndpoint) {
    // Always send token if available (even though endpoint is public)
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (isDev)
      console.debug("api:getAuthHeaders (order endpoint)", {
        endpoint,
        method,
        tokenPresent: !!localStorage.getItem("auth_token"),
      });
    return headers;
  }

  // Don't send token for other public endpoints (respect method)
  const publicDecision = isPublicEndpoint(endpoint, method);
  if (isDev)
    console.debug("api:getAuthHeaders", {
      endpoint,
      method,
      publicDecision,
      tokenPresent,
    });
  if (publicDecision) {
    return headers;
  }

  const token = localStorage.getItem("auth_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

// Check if endpoint is public (doesn't require authentication)
// Accept HTTP method to avoid treating non-GET methods to product URLs as public
const isPublicEndpoint = (
  endpoint: string,
  method: string = "GET"
): boolean => {
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
    "/auth/google-signin",
    "/payment/check-qr",
    "/webhooks/",
  ];

  if (publicEndpoints.some((publicPath) => endpoint.includes(publicPath))) {
    return true;
  }

  // Brands and categories - only GET is public, POST/PUT/DELETE require ADMIN
  if (
    method.toUpperCase() === "GET" &&
    (endpoint.includes("/brands") || endpoint.includes("/categories"))
  ) {
    return true;
  }

  // GET requests for products and inventories are public (viewing products doesn't require auth)
  // Only treat these patterns as public for GET requests
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

  if (
    method.toUpperCase() === "GET" &&
    publicProductPatterns.some((pattern) => pattern.test(endpoint))
  ) {
    return true; // Public for GET - guest can view products and inventories
  }

  // Protected endpoints that require authentication - always send token
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
    return false; // Not public, send token
  }

  // Default: if endpoint contains /orders/ but not in public list above, it's protected
  if (endpoint.includes("/orders/")) {
    return false; // Protected, send token
  }

  // Default: not public
  return false;
};

// Defensive helper: if for some reason header wasn't attached, but this endpoint
// is likely protected for non-GET methods, attach auth if token exists.
const shouldAttachAuthFallback = (endpoint: string, method: string) => {
  const m = method.toUpperCase();
  if (m === "GET") return false;
  // Admin endpoints should always have Authorization for non-GET
  if (endpoint.includes("/admin/")) return true;
  // Product modifications (PUT/DELETE) should be protected
  if (/^\/products\/\d+$/.test(endpoint)) return true;
  // Other endpoints that are typically protected
  if (endpoint.includes("/carts/") || endpoint.includes("/addresses/"))
    return true;
  return false;
};

// Handle 401 errors - try refresh token first, then redirect
// retryCount: 0 = first attempt, 1 = already retried once, prevent infinite loop
const handle401Error = async <T>(
  endpoint: string,
  originalRequest?: () => Promise<T>,
  retryCount: number = 0,
  method: string = "GET"
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

  // If this is a public endpoint (for the given method), don't logout - just reject the error
  if (isPublicEndpoint(endpoint, method)) {
    console.warn(`401 on public endpoint ${endpoint} - not logging out`);
    return Promise.reject(new Error("Unauthorized"));
  }

  // Check if user has a refresh token (i.e., was previously authenticated)
  // If no refresh token exists, this is likely a guest user trying to access a protected endpoint
  // Don't redirect to login for guests - just reject the error
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    console.warn(
      `401 on endpoint ${endpoint} but no refresh token - user is guest, not redirecting`
    );
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
        return handle401Error(endpoint, originalRequest, 1, method);
      }
      // For other errors, throw them
      throw retryError;
    }
  }

  // If refresh failed, clear auth and redirect (only if user was previously authenticated)
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
    // Skip for public endpoints AND /auth/refresh to prevent infinite loop
    if (
      !isPublicEndpoint(endpoint, "GET") &&
      !endpoint.includes("/auth/refresh")
    ) {
      await ensureValidToken();
    }

    const makeRequest = async (): Promise<T> => {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const headers = getAuthHeaders(endpoint, "GET");
      const response = await fetch(fullUrl, { headers });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);

        // Handle 401 Unauthorized - try refresh token first
        // Exclude /auth/refresh to prevent infinite loop
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(endpoint, makeRequest, 0, "GET");
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
    // Ensure token is valid before making request (proactive refresh)
    // Skip for public endpoints AND /auth/refresh to prevent infinite loop
    if (
      !isPublicEndpoint(endpoint, "POST") &&
      !endpoint.includes("/auth/refresh")
    ) {
      await ensureValidToken();
    }

    const makeRequest = async (): Promise<T> => {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const isFormData = data instanceof FormData;
      const headers: Record<string, string> = {
        ...getAuthHeaders(endpoint, "POST"),
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options?.headers,
      };

      // Defensive fallback: attach token if endpoint looks protected but header missing
      try {
        if (
          !headers["Authorization"] &&
          shouldAttachAuthFallback(endpoint, "POST")
        ) {
          const t = localStorage.getItem("auth_token");
          if (t) headers["Authorization"] = `Bearer ${t}`;
        }
      } catch {
        // ignore
      }

      // Set timeout (default 60 seconds, 300 seconds for order creation to allow time for lock waiting)
      // Backend transaction timeout is 60s, but when locked, multiple requests may need to wait
      // We set 300s (5 minutes) to ensure enough time for all queued requests to complete
      // This prevents premature timeout when requests are waiting for lock release
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
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await parseErrorResponse(response);

          // Handle 401 Unauthorized - try refresh token first
          // Exclude /auth/refresh to prevent infinite loop
          if (response.status === 401 && !endpoint.includes("/auth/")) {
            return handle401Error(endpoint, makeRequest, 0, "POST");
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
          return {} as T; // Return empty object if not valid JSON
        }
      } catch (error: unknown) {
        clearTimeout(timeoutId);

        // Narrow error to an object with optional fields
        const err = error as {
          name?: string;
          message?: string;
          status?: number;
        };

        // Handle timeout/abort error
        if (err && (err.name === "AbortError" || err.name === "TimeoutError")) {
          const timeoutError = createApiError(
            {
              message: "Request timeout. Vui lòng thử lại.",
              isFrontendTimeout: true,
            },
            408
          );
          // Remove response.data to indicate this is a frontend timeout
          delete timeoutError.response;
          throw timeoutError;
        }

        // Re-throw if it's already an ApiError-like object
        if (err && typeof err.status === "number") {
          throw error;
        }

        // Handle network errors
        throw createApiError(
          {
            message:
              err?.message || "Network error. Please check your connection.",
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
    // Ensure token is valid before making request (proactive refresh)
    // Skip for public endpoints AND /auth/refresh to prevent infinite loop
    if (
      !isPublicEndpoint(endpoint, "PUT") &&
      !endpoint.includes("/auth/refresh")
    ) {
      await ensureValidToken();
    }

    const makeRequest = async (): Promise<T> => {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const isFormData = data instanceof FormData;
      const headers: Record<string, string> = {
        ...getAuthHeaders(endpoint, "PUT"),
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options?.headers,
      };

      try {
        if (
          !headers["Authorization"] &&
          shouldAttachAuthFallback(endpoint, "PUT")
        ) {
          const t = localStorage.getItem("auth_token");
          if (t) headers["Authorization"] = `Bearer ${t}`;
        }
      } catch {
        // ignore
      }

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
          return handle401Error(endpoint, makeRequest, 0, "PUT");
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
    // Skip for public endpoints AND /auth/refresh to prevent infinite loop
    if (
      !isPublicEndpoint(endpoint, "DELETE") &&
      !endpoint.includes("/auth/refresh")
    ) {
      await ensureValidToken();
    }

    const makeRequest = async (): Promise<T> => {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const headers = getAuthHeaders(endpoint, "DELETE");

      try {
        if (
          !headers["Authorization"] &&
          shouldAttachAuthFallback(endpoint, "DELETE")
        ) {
          const t = localStorage.getItem("auth_token");
          if (t) headers["Authorization"] = `Bearer ${t}`;
        }
      } catch {
        // ignore
      }

      const response = await fetch(fullUrl, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);

        // Handle 401 Unauthorized - try refresh token first
        // Exclude /auth/refresh to prevent infinite loop
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(endpoint, makeRequest, 0, "DELETE");
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
      throw new Error("Network error. Please check your connection.");
    }
  },
};
