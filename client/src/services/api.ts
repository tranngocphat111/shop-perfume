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
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_info");
};

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

// Handle 401 errors - redirect to login
const handle401Error = async <T>(endpoint: string): Promise<T> => {
  clearAuthData();
  // Redirect to admin login if it's an admin endpoint, otherwise regular login
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
    try {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const headers = getAuthHeaders();

      const response = await fetch(fullUrl, { headers });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);

        // Handle 401 Unauthorized
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(endpoint);
        }

        throw createApiError(errorData, response.status);
      }

      const data = await response.json();
      return data;
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
    try {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const isFormData = data instanceof FormData;
      const headers: Record<string, string> = {
        ...getAuthHeaders(),
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

        // Handle 401 Unauthorized
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(endpoint);
        }

        throw createApiError(errorData, response.status);
      }

      const responseData = await response.json();
      return responseData;
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
    try {
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
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);

        // Handle 401 Unauthorized
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(endpoint);
        }

        throw createApiError(errorData, response.status);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  async delete<T>(endpoint: string): Promise<T> {
    try {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const headers = getAuthHeaders();

      const response = await fetch(fullUrl, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);

        // Handle 401 Unauthorized
        if (response.status === 401 && !endpoint.includes("/auth/")) {
          return handle401Error(endpoint);
        }

        throw createApiError(errorData, response.status);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },
};
