import { apiService } from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  type: string;
  userId: number;
  name: string;
  email: string;
  role: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
  type: string;
}

class AuthService {
  private readonly TOKEN_KEY = "auth_token";
  private readonly REFRESH_TOKEN_KEY = "refresh_token";
  private readonly USER_KEY = "user_info";
  private refreshPromise: Promise<TokenRefreshResponse> | null = null;

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      "/auth/login",
      credentials
    );

    // Lưu token và thông tin user vào localStorage
    this.setToken(response.token);
    this.setRefreshToken(response.refreshToken);
    this.setUser(response);

    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      "/auth/register",
      userData
    );

    // Lưu token và thông tin user vào localStorage
    this.setToken(response.token);
    this.setRefreshToken(response.refreshToken);
    this.setUser(response);

    return response;
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        // Call logout API to revoke refresh token
        await apiService.post("/auth/logout", { refreshToken });
      }
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      // Always clear local storage
      this.clearAuth();
    }
  }

  clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  getUser(): AuthResponse | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  setUser(user: AuthResponse): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Check if token is expired
    if (this.isTokenExpired()) {
      return false;
    }
    
    return true;
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === "ADMIN";
  }

  // Check if token is expired by parsing JWT
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Decode JWT token (without verification, just to check expiration)
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      // Add 30 seconds buffer to refresh before actual expiration
      return Date.now() >= expirationTime - 30000;
    } catch {
      return true; // If can't parse, consider it expired
    }
  }

  // Check if token will expire soon (within 5 minutes)
  isTokenExpiringSoon(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = payload.exp * 1000;
      const fiveMinutes = 5 * 60 * 1000;
      return Date.now() >= expirationTime - fiveMinutes;
    } catch {
      return true;
    }
  }

  // Get valid token (refresh if needed)
  async getValidToken(): Promise<string | null> {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }

    // If token is expired, try to refresh
    if (this.isTokenExpired()) {
      const refreshed = await this.refreshToken();
      return refreshed ? this.getToken() : null;
    }

    return token;
  }

  // Refresh access token using refresh token
  async refreshToken(): Promise<boolean> {
    // If there's already a refresh in progress, wait for it
    if (this.refreshPromise) {
      try {
        await this.refreshPromise;
        return true;
      } catch {
        return false;
      }
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearAuth();
      return false;
    }

    try {
      // Create a promise for this refresh attempt
      this.refreshPromise = apiService.post<TokenRefreshResponse>(
        "/auth/refresh",
        { refreshToken }
      );

      const response = await this.refreshPromise;

      // Update tokens
      this.setToken(response.accessToken);
      this.setRefreshToken(response.refreshToken);

      console.log("Token refreshed successfully");
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.clearAuth();
      return false;
    } finally {
      this.refreshPromise = null;
    }
  }

  // Validate token on app load
  async validateAndRefreshToken(): Promise<boolean> {
    const token = this.getToken();
    
    if (!token) {
      return false;
    }

    // If token is expired or expiring soon, refresh it
    if (this.isTokenExpired() || this.isTokenExpiringSoon()) {
      return await this.refreshToken();
    }

    return true;
  }
}

export const authService = new AuthService();
