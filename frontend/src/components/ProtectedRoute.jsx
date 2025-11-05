import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

/**
 * ProtectedRoute component that checks authentication and role-based access
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component to render if authorized
 * @param {string|string[]} props.allowedRoles - Role(s) allowed to access this route
 * @param {boolean} props.requireAuth - Whether authentication is required (default: true)
 */
export const ProtectedRoute = ({
  children,
  allowedRoles = [],
  requireAuth = true,
}) => {
  const { user, loading, isActiveRole, isLoggingOut, isSwitchingRole } =
    useAuth();
  const { isDark } = useTheme();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p
            className={`mt-4 text-sm ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !user) {
    // Don't redirect with error if user is actively logging out
    if (isLoggingOut) {
      return null; // Return nothing during logout to prevent error flash
    }

    // Store the attempted URL to redirect after login
    return (
      <Navigate
        to="/"
        state={{ from: location, error: "Please login to continue" }}
        replace
      />
    );
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && user) {
    const rolesArray = Array.isArray(allowedRoles)
      ? allowedRoles
      : [allowedRoles];

    // Log for debugging
    console.log("🔐 ProtectedRoute Check:", {
      path: location.pathname,
      userActiveRole: user.activeRole,
      userRoles: user.roles,
      allowedRoles: rolesArray,
    });

    const hasRequiredRole = rolesArray.some((role) => isActiveRole(role));

    if (!hasRequiredRole) {
      // Don't redirect with error if user is actively switching roles
      if (isSwitchingRole) {
        return null; // Return nothing during role switch to prevent error flash
      }

      console.error("❌ Access Denied:", {
        userActiveRole: user.activeRole,
        requiredRoles: rolesArray,
      });

      // User doesn't have the required role
      return (
        <Navigate
          to="/"
          state={{
            from: location,
            error: `Access denied. This page requires ${rolesArray.join(
              " or "
            )} role.`,
          }}
          replace
        />
      );
    }

    console.log("✅ Access Granted");
  }

  // User is authenticated and has required role
  return children;
};

/**
 * Higher-order component version of ProtectedRoute
 * Usage: const ProtectedAdmin = withAuth(AdminComponent, ['admin']);
 */
export const withAuth = (Component, allowedRoles = [], requireAuth = true) => {
  return (props) => (
    <ProtectedRoute allowedRoles={allowedRoles} requireAuth={requireAuth}>
      <Component {...props} />
    </ProtectedRoute>
  );
};
