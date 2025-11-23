const API_BASE_URL = "http://localhost:8080/api";

export const apiService = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async post<T>(endpoint: string, data: unknown, options?: { headers?: Record<string, string> }): Promise<T> {
    const isFormData = data instanceof FormData;
    const headers: Record<string, string> = isFormData
      ? {}
      : { "Content-Type": "application/json", ...options?.headers };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: isFormData ? data : JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async put<T>(endpoint: string, data: unknown, options?: { headers?: Record<string, string> }): Promise<T> {
    const isFormData = data instanceof FormData;
    const headers: Record<string, string> = isFormData
      ? {}
      : { "Content-Type": "application/json", ...options?.headers };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers,
      body: isFormData ? data : JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
};
