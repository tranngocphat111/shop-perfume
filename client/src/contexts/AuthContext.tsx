/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authService } from "../services/auth.service";
import type { AuthResponse } from "../services/auth.service";

interface AuthContextType {
  user: AuthResponse | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (token: string, userData: AuthResponse, mergeCart?: () => Promise<void>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthResponse | null>(null);

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
            authService.clearAuth();
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        authService.clearAuth();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Removed periodic token refresh - let API handle 401 errors and refresh automatically
  // This prevents race conditions and multiple refresh attempts
  // The API will automatically refresh token when it expires and returns 401

    const intervalId = setInterval(async () => {
      try {
        if (authService.getToken() && authService.getRefreshToken()) {
          // Only refresh if token is actually expiring soon
          if (authService.isTokenExpiringSoon()) {
            const success = await authService.refreshToken();
            if (!success) {
              console.error("Failed to refresh token");
              await logout();
            }
          }
        }
      } catch (error) {
        console.error("Token refresh error:", error);
        await logout();
      }
    }, 5 * 60000); // Check every 5 minutes instead of every minute

    return () => clearInterval(intervalId);
  }, [user]);

  const login = (token: string, userData: AuthResponse) => {
    authService.setToken(token);
    // REFRESH TOKEN - COMMENTED OUT
    // authService.setRefreshToken(userData.refreshToken);
    authService.setUser(userData);
    setUser(userData);
    // REFRESH TOKEN - COMMENTED OUT
    // Reset refresh attempts on successful login
    resetRefreshAttempts();
    // Merge cart if callback provided
    if (mergeCart) {
      try {
        await mergeCart();
      } catch (error) {
        console.error('Error merging cart on login:', error);
      }
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsLoading(false);
      // Redirect to login page
      window.location.href = "/login";
    }
  };

  const value = {
    user,
    isAuthenticated: !!user && !isLoading,
    isAdmin: user?.role === "ADMIN",
    isLoading,
    login,
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
