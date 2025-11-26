import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/auth.service';
import type { AuthResponse } from '../services/auth.service';

interface AuthContextType {
  user: AuthResponse | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, userData: AuthResponse, mergeCart?: () => Promise<void>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthResponse | null>(null);

  useEffect(() => {
    // Load user info from localStorage on mount
    const savedUser = authService.getUser();
    if (savedUser && authService.isAuthenticated()) {
      setUser(savedUser);
    }
  }, []);

  const login = async (token: string, userData: AuthResponse, mergeCart?: () => Promise<void>) => {
    authService.setToken(token);
    authService.setUser(userData);
    setUser(userData);
    
    // Merge cart after login if mergeCart function is provided
    if (mergeCart) {
      try {
        await mergeCart();
      } catch (error) {
        console.error('Error merging cart on login:', error);
      }
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    // Clear sessionStorage cart on logout
    sessionStorage.removeItem('perfume_shop_cart');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

