/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { authService } from "../services/auth.service";
import type { AuthResponse } from "../services/auth.service";

export type UserRole = "GUEST" | "CUSTOMER" | "ADMIN";

interface AuthContextType {
  user: AuthResponse | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  isGuest: boolean;
  userRole: UserRole;
  isLoading: boolean;
  login: (
    token: string,
    userData: AuthResponse,
    mergeCart?: () => Promise<void>
  ) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Wrap logout trong useCallback để tránh dependency issues
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
      // Clear tokens anyway
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_info");
    } finally {
      setUser(null);
      setIsLoading(false);
      // Just reload the current page, no redirect
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    // Load user info from localStorage on mount
    const initAuth = async () => {
      try {
        const savedUser = authService.getUser();
        if (savedUser) {
          // Validate token and refresh if needed
          const isValid = await authService.validateAndRefreshToken();

          if (isValid) {
            setUser(savedUser);
          } else {
            // Token is invalid and couldn't be refreshed
            authService.logout();
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        authService.logout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Smart token refresh - tính toán thời gian chính xác thay vì check định kỳ
  useEffect(() => {
    if (!user) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isRefreshing = false;
    let isMounted = true;

    const scheduleRefresh = () => {
      if (!isMounted) return;

      try {
        // Clear existing timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        const token = authService.getToken();
        const refreshToken = authService.getRefreshToken();

        if (!token || !refreshToken) {
          return;
        }

        // Tính toán thời gian còn lại của token
        let timeRemaining: number | null = null;
        try {
          timeRemaining = authService.getTokenTimeRemaining();
        } catch (error) {
          console.error("Error calculating token time remaining:", error);
          // Nếu không tính được, schedule lại sau 1 phút
          if (isMounted) {
            timeoutId = setTimeout(() => {
              if (isMounted) {
                scheduleRefresh();
              }
            }, 60000);
          }
          return;
        }

        if (timeRemaining === null || timeRemaining <= 0) {
          // Token đã hết hạn, refresh ngay
          performRefresh();
          return;
        }

        // Refresh khi còn 5 phút (300000ms)
        // Nếu token còn ít hơn 5 phút, refresh ngay
        // Nếu token còn nhiều hơn, schedule refresh sau (timeRemaining - 5 phút)
        const refreshThreshold = 5 * 60 * 1000; // 5 minutes
        const timeUntilRefresh = Math.max(0, timeRemaining - refreshThreshold);

        if (timeUntilRefresh === 0) {
          // Token sắp hết hạn, refresh ngay
          performRefresh();
        } else {
          // Schedule refresh khi còn đúng 5 phút
          timeoutId = setTimeout(() => {
            if (isMounted) {
              performRefresh();
            }
          }, timeUntilRefresh);
        }
      } catch (error) {
        console.error("Error in scheduleRefresh:", error);
        // Nếu có lỗi, thử lại sau 1 phút
        if (isMounted) {
          timeoutId = setTimeout(() => {
            if (isMounted) {
              scheduleRefresh();
            }
          }, 60000); // Retry after 1 minute
        }
      }
    };

    const performRefresh = async () => {
      if (!isMounted) return;

      // Tránh multiple refresh cùng lúc (race condition protection)
      if (isRefreshing) {
        return;
      }

      try {
        isRefreshing = true;

        if (!authService.getToken() || !authService.getRefreshToken()) {
          return;
        }

        // Chỉ refresh nếu token sắp hết hạn
        if (authService.isTokenExpiringSoon()) {
          console.log("🔄 Auto-refreshing token...");
          const success = await authService.refreshToken(true); // delayClear = true để tránh clear khi đang refresh

          if (success && isMounted) {
            console.log("✅ Token refreshed successfully");
            // Update user info với token mới
            const updatedUser = authService.getUser();
            if (updatedUser) {
              setUser(updatedUser);
            }
            // Schedule next refresh với token mới
            scheduleRefresh();
          } else if (!success && isMounted) {
            console.error("❌ Failed to refresh token");
            // Don't call logout here to avoid infinite loop, just clear user
            setUser(null);
            // Clear tokens silently
            try {
              authService.logout();
            } catch (err) {
              console.error("Error clearing tokens:", err);
            }
          }
        } else if (isMounted) {
          // Token chưa sắp hết hạn, schedule lại
          scheduleRefresh();
        }
      } catch (error) {
        console.error("Token refresh error:", error);
        if (isMounted) {
          // Don't call logout to avoid infinite loop
          setUser(null);
          // Clear tokens silently
          try {
            authService.logout();
          } catch (err) {
            console.error("Error clearing tokens:", err);
          }
        }
      } finally {
        isRefreshing = false;
      }
    };

    // Schedule refresh ban đầu
    scheduleRefresh();

    // Cleanup
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user]);

  const login = async (token: string, userData: AuthResponse) => {
    try {
      authService.setToken(token);
      if (userData.refreshToken) {
        authService.setRefreshToken(userData.refreshToken);
      }
      authService.setUser(userData);
      setUser(userData);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const { userService } = await import("../services/user.service");
      const userInfo = await userService.getCurrentUser();
      if (userInfo) {
        const currentUser = authService.getUser();
        if (currentUser) {
          const updatedUser: AuthResponse = {
            ...currentUser,
            name: userInfo.name,
            email: userInfo.email,
            loyaltyPoints: userInfo.loyaltyPoints,
          };
          authService.setUser(updatedUser);
          setUser(updatedUser);
          console.log('[AuthContext] ✅ User refreshed, loyaltyPoints:', userInfo.loyaltyPoints);
        }
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  // Determine user role
  const userRole: UserRole =
    !user || isLoading ? "GUEST" : user.role === "ADMIN" ? "ADMIN" : "CUSTOMER";

  const isAdmin = userRole === "ADMIN";
  const isCustomer = userRole === "CUSTOMER" || userRole === "ADMIN"; // Admin can do everything Customer can
  const isGuest = userRole === "GUEST";
  const isAuthenticated = !!user && !isLoading;

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    isCustomer,
    isGuest,
    userRole,
    isLoading,
    login,
    refreshUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
