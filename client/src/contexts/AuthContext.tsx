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
  login: (
    token: string,
    userData: AuthResponse,
    mergeCart?: () => Promise<void>
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user info from localStorage on mount
    const initAuth = async () => {
      try {
        const savedUser = authService.getUser();
        if (savedUser) {
          setUser(savedUser);
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

  const login = async (token: string, userData: AuthResponse) => {
    authService.setToken(token);
    authService.setUser(userData);
    setUser(userData);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      authService.logout();
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
