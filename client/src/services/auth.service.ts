import { apiService } from "./api";
import { refreshTokenManager } from "./refreshTokenManager";

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
  refreshToken?: string;
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

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      "/auth/login",
      credentials
    );

    // Lưu token và thông tin user vào localStorage
    this.setToken(response.token);
    if (response.refreshToken) {
      this.setRefreshToken(response.refreshToken);
    }
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
    if (response.refreshToken) {
      this.setRefreshToken(response.refreshToken);
    }
    this.setUser(response);

    return response;
  }

  async logout(): Promise<void> {
    try {
      // Gọi API logout để revoke tất cả refresh tokens trên server
      const token = this.getToken();
      if (token) {
        // Try to call logout endpoint, but don't fail if it errors
        // (user might already be logged out or token expired)
        try {
          await apiService.post("/auth/logout", {});
        } catch (error) {
          // Ignore errors - user might already be logged out
          console.log(
            "Logout API call failed (user may already be logged out):",
            error
          );
        }
      }
    } catch (error) {
      // Ignore errors - clear local storage anyway
      console.log("Error during logout:", error);
    } finally {
      // Always clear local storage
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
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

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
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
    const user = this.getUser(); // Get user from localStorage
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
      return Date.now() >= expirationTime;
    } catch {
      return true; // If can't parse, consider it expired
    }
  }

  // Check if token will expire soon (within 5 minutes)
  // Với access token 30 phút, refresh khi còn 5 phút để đảm bảo không bị gián đoạn
  isTokenExpiringSoon(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = payload.exp * 1000;
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
      return Date.now() >= expirationTime - fiveMinutes;
    } catch {
      return true;
    }
  }

  // Tính toán thời gian còn lại của token (milliseconds)
  getTokenTimeRemaining(): number | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = payload.exp * 1000;
      const remaining = expirationTime - Date.now();
      return remaining > 0 ? remaining : 0;
    } catch {
      return null;
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
  // Race condition được xử lý bởi refreshTokenManager: nếu đang refresh, các request khác sẽ chờ
  async refreshToken(_delayClear: boolean = false): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      // If delayClear is true, don't clear auth here - let handle401Error do it
      if (!_delayClear) {
        this.logout();
      }
      return false;
    }

    // Use shared refresh token manager to prevent race conditions
    const refreshed = await refreshTokenManager.refreshToken();

    if (!refreshed) {
      // If delayClear is true, don't clear auth here - let handle401Error do it
      if (!_delayClear) {
        this.logout();
      }
      return false;
    }

    // Token has been updated by refreshTokenManager
    // Update user info with new token (keep other user data)
    const user = this.getUser();
    if (user) {
      const newToken = this.getToken();
      if (newToken) {
        user.token = newToken;
        this.setUser(user);
      }
    }

    return true;
  }

  // Validate token on app load
  async validateAndRefreshToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    // If token is expired, try to refresh it
    if (this.isTokenExpired()) {
      const refreshed = await this.refreshToken();
      return refreshed;
    }

    return true;
  }
}

export const authService = new AuthService();
