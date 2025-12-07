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
  const logout = useCallback(async (redirectTo?: string) => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
      // Clear localStorage anyway (cookies sẽ được clear bởi backend)
      localStorage.removeItem("user_info");
    } finally {
      setUser(null);
      setIsLoading(false);
      // Redirect to specified page or default login page
      const redirectPath = redirectTo || "/login";
      window.location.href = redirectPath;
    }
  }, []);

  useEffect(() => {
    // Load user info from localStorage on mount
    // Với HTTP-only cookies, validate bằng cách gọi /auth/me
    const initAuth = async () => {
      try {
        const savedUser = authService.getUser();
        if (savedUser) {
          // Validate token bằng cách gọi /auth/me
          const isValid = await authService.validateAndRefreshToken();

          if (isValid) {
            setUser(savedUser);
          } else {
            // Token invalid - clear user
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (_token: string, userData: AuthResponse) => {
    try {
      // Với HTTP-only cookies, không cần lưu token vào localStorage
      // Token được lưu trong cookie bởi backend
      // Chỉ cần lưu user info để hiển thị UI
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
          };
          authService.setUser(updatedUser);
          setUser(updatedUser);
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
  const isCustomer = userRole === "CUSTOMER" || userRole === "ADMIN";
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
