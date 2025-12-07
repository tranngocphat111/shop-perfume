import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { UserRole } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Minimum role required to access
   * - "GUEST": Anyone can access (public)
   * - "CUSTOMER": Requires authentication (customer or admin)
   * - "ADMIN": Requires admin role
   */
  requiredRole?: UserRole;
  /**
   * @deprecated Use requiredRole="ADMIN" instead
   */
  requireAdmin?: boolean;
  /**
   * Redirect path if unauthorized (default: based on requiredRole)
   */
  redirectTo?: string;
}

/**
 * ProtectedRoute - Route protection based on user role
 *
 * Hierarchy:
 * - GUEST: Public access
 * - CUSTOMER: Requires authentication (customer or admin can access)
 * - ADMIN: Requires admin role
 */
export const ProtectedRoute = ({
  children,
  requiredRole = "GUEST",
  requireAdmin = false, // Backward compatibility
  redirectTo,
}: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin } = useAuth();

  // Backward compatibility: if requireAdmin is true, use ADMIN role
  const minRole: UserRole = requireAdmin ? "ADMIN" : requiredRole;

  // Determine if user can access
  let canAccess = false;
  switch (minRole) {
    case "GUEST":
      canAccess = true; // Everyone can access
      break;
    case "CUSTOMER":
      canAccess = isAuthenticated; // Customer or Admin
      break;
    case "ADMIN":
      canAccess = isAdmin; // Only Admin
      break;
  }

  if (!canAccess) {
    // Determine redirect path
    let redirectPath = redirectTo;
    if (!redirectPath) {
      if (minRole === "ADMIN") {
        redirectPath = "/admin/login";
      } else if (minRole === "CUSTOMER") {
        redirectPath = "/login";
      } else {
        redirectPath = "/";
      }
    }

    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

/**
 * GuestRoute - Public route, anyone can access
 */
export const GuestRoute = ({ children }: { children: ReactNode }) => {
  return <ProtectedRoute requiredRole="GUEST">{children}</ProtectedRoute>;
};

/**
 * CustomerRoute - Requires authentication (customer or admin)
 */
export const CustomerRoute = ({ children }: { children: ReactNode }) => {
  return <ProtectedRoute requiredRole="CUSTOMER">{children}</ProtectedRoute>;
};

/**
 * AdminRoute - Requires admin role
 */
export const AdminRoute = ({ children }: { children: ReactNode }) => {
  return <ProtectedRoute requiredRole="ADMIN">{children}</ProtectedRoute>;
};

/**
 * UnauthenticatedRoute - Only allows unauthenticated users (not logged in)
 * If user is already authenticated, redirects based on their role:
 * - ADMIN → /admin
 * - CUSTOMER/GUEST → /
 */
export const UnauthenticatedRoute = ({
  children,
  redirectTo,
}: {
  children: ReactNode;
  redirectTo?: string;
}) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  // Wait for auth to finish loading
  if (isLoading) {
    return null; // or a loading spinner
  }

  // If user is already authenticated, redirect them away
  if (isAuthenticated) {
    let redirectPath = redirectTo;
    if (!redirectPath) {
      if (isAdmin) {
        redirectPath = "/admin"; // Admin already logged in, go to dashboard
      } else {
        redirectPath = "/"; // Customer/Guest already logged in, go to homepage
      }
    }
    return <Navigate to={redirectPath} replace />;
  }

  // User is not authenticated, allow access
  return <>{children}</>;
};
