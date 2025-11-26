/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authService } from "../services/auth.service";
import type { AuthResponse } from "../services/auth.service";
import { resetRefreshAttempts } from "../services/api";

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Validate and potentially refresh token on mount
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

  // Periodically check token expiration and refresh if needed
  // Note: We don't auto-logout on refresh failure - let the API handle 401 errors
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(async () => {
      try {
        // Only refresh if token is expiring soon (within 2 minutes)
        if (authService.isTokenExpiringSoon()) {
          console.log("Token expiring soon, attempting refresh...");
          const success = await authService.refreshToken();
          if (success) {
            // Update user state with new token info
            const updatedUser = authService.getUser();
            if (updatedUser) {
              setUser(updatedUser);
            }
          } else {
            // Don't auto-logout - let API 401 handler deal with it
            console.warn(
              "Token refresh failed, but not logging out. Will retry on next API call."
            );
          }
        }
      } catch (error) {
        // Don't auto-logout on error - let API 401 handler deal with it
        console.error("Token refresh error (non-fatal):", error);
      }
    }, 5 * 60000); // Check every 5 minutes instead of every minute

    return () => clearInterval(intervalId);
  }, [user]);

  const login = async (token: string, userData: AuthResponse, mergeCart?: () => Promise<void>) => {
    authService.setToken(token);
    authService.setRefreshToken(userData.refreshToken);
    authService.setUser(userData);
    setUser(userData);
    // Reset refresh attempts on successful login
    resetRefreshAttempts();
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
