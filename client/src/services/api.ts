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
const clearAuthData = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user_info");
};

// Helper function to get auth headers
const getAuthHeaders = async (
  debug: boolean = false
): Promise<Record<string, string>> => {
  const token = localStorage.getItem("auth_token");

// Handle 401 errors - redirect to login
const handle401Error = async <T>(endpoint: string): Promise<T> => {
  console.error("[API] ❌ Unauthorized (401). Redirecting to login...");
  clearAuthData();
  // Redirect to admin login if it's an admin endpoint, otherwise regular login
  const isAdminEndpoint = endpoint.includes("/admin/");
  window.location.href = isAdminEndpoint ? "/admin/login" : "/login";
  return Promise.reject(new Error("Unauthorized"));
};

export const apiService = {
  async get<T>(endpoint: string): Promise<T> {
    try {
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
        console.error('[API] ❌ GET Error:', {
          url: fullUrl,
          status: response.status,
          error: errorData
        });

        // Handle 401 Unauthorized
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(endpoint);
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
      if (!isPollingRequest || data.paid || data.cancelled) {
        console.log("[API] ✅ GET Response:", {
          url: fullUrl,
          status: response.status,
          data: data,
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
        console.error('[API] ❌ POST Error:', {
          url: fullUrl,
          status: response.status,
          error: errorData,
          requestData: isFormData ? '[FormData]' : data
        });

        // Handle 401 Unauthorized
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(endpoint);
        }

        throw {
          message:
            errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          response: { data: errorData },
        } as ApiError & { response?: { data?: unknown } };
      }

      const responseData = await response.json();
      console.log("[API] ✅ POST Response:", {
        url: fullUrl,
        status: response.status,
        data: responseData,
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
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const isFormData = data instanceof FormData;
      const headers: Record<string, string> = {
        ...(await getAuthHeaders()), // Await async call
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options?.headers,
      };

      const response = await fetch(fullUrl, {
        method: "PUT",
        headers,
        body: isFormData ? data : JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle 401 Unauthorized
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(endpoint);
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
          return handle401Error(endpoint);
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
