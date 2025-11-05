import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const navigate = useNavigate();

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        // Ensure activeRole is set - if missing, set it based on available roles
        if (
          !parsedUser.activeRole &&
          parsedUser.roles &&
          parsedUser.roles.length > 0
        ) {
          // Prioritize admin/cell member roles over student
          if (
            parsedUser.roles.includes("admin") ||
            parsedUser.roles.includes("student placement cell")
          ) {
            parsedUser.activeRole = parsedUser.roles.includes("admin")
              ? "admin"
              : "student placement cell";
          } else if (parsedUser.roles.includes("student")) {
            parsedUser.activeRole = "student";
          } else {
            parsedUser.activeRole = parsedUser.roles[0]; // Fallback to first role
          }
          // Update localStorage with corrected data
          localStorage.setItem("user", JSON.stringify(parsedUser));
        }

        setUser(parsedUser);
      } catch (err) {
        console.error("Failed to parse stored user:", err);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    // Ensure activeRole is set during login
    if (!userData.activeRole && userData.roles && userData.roles.length > 0) {
      // Prioritize admin/cell member roles over student
      if (
        userData.roles.includes("admin") ||
        userData.roles.includes("student placement cell")
      ) {
        userData.activeRole = userData.roles.includes("admin")
          ? "admin"
          : "student placement cell";
      } else if (userData.roles.includes("student")) {
        userData.activeRole = "student";
      } else {
        userData.activeRole = userData.roles[0]; // Fallback to first role
      }
    }

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const switchRole = (newRole) => {
    setIsSwitchingRole(true);
    // Update user with new active role
    const updatedUser = {
      ...user,
      activeRole: newRole,
    };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    // Reset switching flag after a brief delay
    setTimeout(() => setIsSwitchingRole(false), 200);
  };

  const logout = () => {
    setIsLoggingOut(true); // Set logging out flag BEFORE clearing user
    setUser(null);
    localStorage.removeItem("user");
    // Navigate to home with logout flag to prevent showing error messages
    navigate("/", { replace: true, state: { fromLogout: true } });
    // Reset logging out flag after navigation
    setTimeout(() => setIsLoggingOut(false), 100);
  };

  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    // Case-insensitive comparison
    return user.roles.some((r) => r.toLowerCase() === role.toLowerCase());
  };

  const isActiveRole = (role) => {
    if (!user || !user.activeRole) return false;
    // Case-insensitive comparison
    return user.activeRole.toLowerCase() === role.toLowerCase();
  };

  const hasAnyRole = (roles) => {
    if (!user || !user.roles) return false;
    return roles.some((role) => hasRole(role));
  };

  const canAccessAdminPanel = () => {
    return isActiveRole("admin") || isActiveRole("student placement cell");
  };

  const canAccessStudentPanel = () => {
    return isActiveRole("student");
  };

  const value = {
    user,
    login,
    switchRole,
    logout,
    hasRole,
    isActiveRole,
    hasAnyRole,
    canAccessAdminPanel,
    canAccessStudentPanel,
    loading,
    isLoggingOut,
    isSwitchingRole,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
