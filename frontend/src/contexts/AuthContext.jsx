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
  const navigate = useNavigate();

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse stored user:", err);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
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
    logout,
    hasRole,
    isActiveRole,
    hasAnyRole,
    canAccessAdminPanel,
    canAccessStudentPanel,
    loading,
    isLoggingOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
