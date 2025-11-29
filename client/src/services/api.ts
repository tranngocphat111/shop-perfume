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

// Helper function to get auth headers
const getAuthHeaders = (endpoint: string = ""): Record<string, string> => {
  const headers: Record<string, string> = {};

  // Don't send token for public endpoints
  if (isPublicEndpoint(endpoint)) {
    return headers;
  }

  const token = localStorage.getItem("auth_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

// Helper to refresh token (avoid circular dependency)
const attemptTokenRefresh = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    // Update tokens
    localStorage.setItem("auth_token", data.accessToken);
    localStorage.setItem("refresh_token", data.refreshToken);

    // Update user info
    const userInfo = localStorage.getItem("user_info");
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        user.token = data.accessToken;
        user.refreshToken = data.refreshToken;
        localStorage.setItem("user_info", JSON.stringify(user));
      } catch {
        // Ignore parse errors
      }
    }

    return true;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
};

// Check if endpoint is public (doesn't require authentication)
// NOTE: /orders/create and /orders/my-orders are NOT in this list
// - We want to send token if user is logged in
// - Backend allows guest access (permitAll), but if token is present, it will use userId
const isPublicEndpoint = (endpoint: string): boolean => {
  // /auth/me requires authentication, so it's not public
  if (endpoint === "/auth/me" || endpoint.includes("/auth/me")) {
    return false;
  }
  const publicEndpoints = [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/payment/check-qr",
    "/products/",
    "/brands/",
    "/categories/",
    "/webhooks/",
  ];

  // Check if endpoint matches any public endpoint pattern
  return (
    publicEndpoints.some((publicPath) => endpoint.includes(publicPath)) ||
    /\/orders\/\d+\/cancel-timeout/.test(endpoint)
  );
};

// Handle 401 errors - try refresh token first, then redirect
const handle401Error = async <T>(
  endpoint: string,
  originalRequest?: () => Promise<T>
): Promise<T> => {
  // If this is a public endpoint, don't logout - just reject the error
  if (isPublicEndpoint(endpoint)) {
    console.warn(`401 on public endpoint ${endpoint} - not logging out`);
    return Promise.reject(new Error("Unauthorized"));
  }

  // Try to refresh token first
  const refreshed = await attemptTokenRefresh();

  if (refreshed && originalRequest) {
    // Retry the original request with new token
    try {
      return await originalRequest();
    } catch (retryError) {
      // If retry still fails, proceed to logout
      console.error("Request failed after token refresh:", retryError);
    }
  }

  // If refresh failed or retry failed, clear auth and redirect
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
      const headers = getAuthHeaders(endpoint);
      const response = await fetch(fullUrl, { headers });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);

        // Handle 401 Unauthorized - try refresh token first
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(endpoint, makeRequest);
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
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(endpoint, makeRequest);
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
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(endpoint, makeRequest);
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
      const headers = getAuthHeaders(endpoint);

      const response = await fetch(fullUrl, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);

        // Handle 401 Unauthorized - try refresh token first
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(endpoint, makeRequest);
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
};
