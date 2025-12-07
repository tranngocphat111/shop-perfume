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
  token?: string; // Optional - tokens now stored in HTTP-only cookies
  accessToken?: string;
  refreshToken?: string;
  type: string;
  userId: number;
  name: string;
  email: string;
  role: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken?: string;
  type: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/**
 * AuthService - sử dụng HTTP-only cookies cho JWT tokens
 *
 * Với HTTP-only cookies:
 * - Tokens được lưu trong cookies (không accessible từ JavaScript)
 * - Browser tự động gửi cookies với mỗi request (credentials: 'include')
 * - Chỉ lưu user_info vào localStorage để hiển thị UI
 * - Không thể kiểm tra token expiration từ frontend (vì không đọc được)
 * - Sử dụng /auth/me để kiểm tra authentication status
 */
class AuthService {
  private readonly USER_KEY = "user_info";

  // Lưu trạng thái authentication trong memory
  private isAuthenticatedCache: boolean | null = null;

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      "/auth/login",
      credentials
    );

    // Chỉ lưu thông tin user vào localStorage (không lưu token)
    // Token được lưu trong HTTP-only cookie bởi backend
    this.setUser(response);
    this.isAuthenticatedCache = true;

    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      "/auth/register",
      userData
    );

    // Chỉ lưu thông tin user vào localStorage
    this.setUser(response);
    this.isAuthenticatedCache = true;

    return response;
  }

  async logout(): Promise<void> {
    try {
      // Gọi API logout để revoke tokens và clear cookies
      try {
        await apiService.post("/auth/logout", {});
      } catch (error) {
        // Ignore errors - user might already be logged out
        console.log(
          "Logout API call failed (user may already be logged out):",
          error
        );
      }
    } catch (error) {
      console.log("Error during logout:", error);
    } finally {
      // Clear localStorage (chỉ user_info)
      localStorage.removeItem(this.USER_KEY);
      this.isAuthenticatedCache = false;
    }
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
    // Lưu user info nhưng không lưu tokens (chúng được quản lý bởi cookies)
    const userToStore = {
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      type: user.type,
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(userToStore));
  }

  /**
   * Kiểm tra authentication status
   * Với HTTP-only cookies, không thể đọc token từ JavaScript
   * Phải kiểm tra bằng cách:
   * 1. Kiểm tra cache (nhanh)
   * 2. Kiểm tra localStorage có user_info không (nhanh)
   * 3. Gọi /auth/me để verify với server (chính xác nhất)
   */
  isAuthenticated(): boolean {
    // Quick check: có user_info trong localStorage không?
    const user = this.getUser();
    if (!user) {
      this.isAuthenticatedCache = false;
      return false;
    }

    // Nếu có user_info, assume authenticated
    // Backend sẽ reject request nếu cookie invalid
    if (this.isAuthenticatedCache !== null) {
      return this.isAuthenticatedCache;
    }

    // Default: có user_info = authenticated
    return true;
  }

  /**
   * Kiểm tra authentication status với server
   * Gọi /auth/me để verify token trong cookie
   */
  async checkAuthStatus(): Promise<boolean> {
    try {
      await apiService.get("/auth/me");
      this.isAuthenticatedCache = true;
      return true;
    } catch {
      this.isAuthenticatedCache = false;
      localStorage.removeItem(this.USER_KEY);
      return false;
    }
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === "ADMIN";
  }

  /**
   * Refresh token
   * Với HTTP-only cookies, browser tự động gửi refresh_token cookie
   */
  async refreshToken(): Promise<boolean> {
    const refreshed = await refreshTokenManager.refreshToken();

    if (!refreshed) {
      this.isAuthenticatedCache = false;
      return false;
    }

    this.isAuthenticatedCache = true;
    return true;
  }

  /**
   * Validate và refresh token khi app load
   */
  async validateAndRefreshToken(): Promise<boolean> {
    // Với HTTP-only cookies, kiểm tra bằng cách gọi /auth/me
    const user = this.getUser();
    if (!user) {
      return false;
    }

    return await this.checkAuthStatus();
  }

  /**
   * Gửi yêu cầu quên mật khẩu
   */
  async forgotPassword(email: string): Promise<void> {
    const request: ForgotPasswordRequest = { email };
    await apiService.post("/auth/forgot-password", request);
  }

  /**
   * Đặt lại mật khẩu với token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const request: ResetPasswordRequest = { token, newPassword };
    await apiService.post("/auth/reset-password", request);
  }

  /**
   * Đăng nhập bằng Google
   */
  async signInWithGoogle(idToken: string): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      "/auth/google-signin",
      { idToken }
    );

    // Chỉ lưu thông tin user vào localStorage
    this.setUser(response);
    this.isAuthenticatedCache = true;

    return response;
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await apiService.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  }
}

export const authService = new AuthService();
