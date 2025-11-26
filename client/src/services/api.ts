const API_BASE_URL = "http://13.251.125.90:8080/api";
// const API_BASE_URL = "http://localhost:8080/api";

interface ApiError {
  message: string;
  status: number;
  response?: {
    data?: any;
  };
}

// Track if we're currently refreshing the token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
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
      return originalRequest();
    } else {
      throw new Error("Token refresh failed");
    }
  } catch (error) {
    processQueue(error);
    isRefreshing = false;
    // Clear auth and redirect to appropriate login page
    // authService.refreshToken() already clears auth on failure, but ensure it's cleared
    try {
      const { authService } = await import("./auth.service");
      // refreshToken() already clears auth, but ensure it's cleared
      if (!authService.getToken()) {
        authService.clearAuth();
      }
    } catch (e) {
      // If import fails, manually clear localStorage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_info");
    }
    window.location.href = getLoginPath();
    return Promise.reject(error);
  }
};

export const apiService = {
  async get<T>(endpoint: string): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const headers = { ...getAuthHeaders() };

      // Only log non-polling requests (payment check is called frequently)
      const isPollingRequest = endpoint.includes("/payment/check-qr");
      if (!isPollingRequest) {
        console.log("[API] 🔵 GET Request:", fullUrl);
      }

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

      // Only log non-polling requests or if payment status changed
      if (!isPollingRequest || data.paid || data.cancelled) {
        console.log("[API] ✅ GET Response:", {
          url: fullUrl,
          status: response.status,
          data: data,
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
        ...getAuthHeaders(),
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options?.headers,
      };

      console.log("[API] 🔵 POST Request:", fullUrl);
      console.log("[API] 🔵 Request Data:", isFormData ? "[FormData]" : data);
      console.log("[API] 🔵 Headers:", headers);

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
      console.log("[API] ✅ POST Response:", {
        url: fullUrl,
        status: response.status,
        data: responseData,
      });

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
