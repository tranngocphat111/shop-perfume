const API_BASE_URL = "http://13.251.125.90:8080/api";
// const API_BASE_URL = "http://localhost:8080/api";

interface ApiError {
  message: string;
  status: number;
  response?: {
    data?: any;
  };
}

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

export const apiService = {
  async get<T>(endpoint: string): Promise<T> {
    try {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const headers = { ...getAuthHeaders() };
      
      console.log('[API] 🔵 GET Request:', fullUrl);
      console.log('[API] 🔵 Headers:', headers);
      
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
        throw {
          message:
            errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          response: { data: errorData },
        } as ApiError & { response?: { data?: any } };
      }
      
      const data = await response.json();
      console.log('[API] ✅ GET Response:', {
        url: fullUrl,
        status: response.status,
        data: data
      });
      
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
        throw {
          message:
            errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          response: { data: errorData },
        } as ApiError & { response?: { data?: any } };
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
        throw {
          message:
            errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          response: { data: errorData },
        } as ApiError & { response?: { data?: any } };
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
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message:
            errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          response: { data: errorData },
        } as ApiError & { response?: { data?: any } };
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
