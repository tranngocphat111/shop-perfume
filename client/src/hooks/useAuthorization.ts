import { useAuth } from "../contexts/AuthContext";
import type { UserRole } from "../contexts/AuthContext";

/**
 * Hook để check authorization và permissions
 * Hỗ trợ 3 cấp độ: GUEST, CUSTOMER, ADMIN
 * 
 * Hierarchy:
 * - GUEST: Chỉ có thể xem public content
 * - CUSTOMER: Có thể làm mọi thứ GUEST làm + authenticated features
 * - ADMIN: Có thể làm mọi thứ CUSTOMER làm + admin features
 */
export const useAuthorization = () => {
  const { userRole, isAuthenticated, isAdmin, isCustomer, isGuest, user } = useAuth();

  /**
   * Check if user has required role or higher
   * @param requiredRole - Minimum role required
   * @returns true if user has required role or higher
   */
  const hasRole = (requiredRole: UserRole): boolean => {
    const roleHierarchy: Record<UserRole, number> = {
      GUEST: 0,
      CUSTOMER: 1,
      ADMIN: 2,
    };

    const userLevel = roleHierarchy[userRole];
    const requiredLevel = roleHierarchy[requiredRole];

    return userLevel >= requiredLevel;
  };

  /**
   * Check if user can access a specific feature
   * @param requiredRole - Minimum role required for the feature
   * @returns true if user can access
   */
  const canAccess = (requiredRole: UserRole): boolean => {
    return hasRole(requiredRole);
  };

  /**
   * Check if user is exactly a specific role (not higher)
   * @param role - Exact role to check
   * @returns true if user is exactly this role
   */
  const isExactly = (role: UserRole): boolean => {
    return userRole === role;
  };

  /**
   * Check if user is at least a specific role
   * @param role - Minimum role
   * @returns true if user is at least this role
   */
  const isAtLeast = (role: UserRole): boolean => {
    return hasRole(role);
  };

  return {
    userRole,
    isAuthenticated,
    isAdmin,
    isCustomer,
    isGuest,
    user,
    hasRole,
    canAccess,
    isExactly,
    isAtLeast,
  };
};

