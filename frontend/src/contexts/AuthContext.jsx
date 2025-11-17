import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

// 🆕 Helper function to normalize roles (extract name from objects)
const normalizeRole = (role) => {
  if (!role) return null;
  if (typeof role === 'object' && role !== null) {
    return role.name ? String(role.name).toLowerCase() : null;
  }
  return String(role).toLowerCase();
};

// 🆕 Helper function to extract role names from role objects
const extractRoleNames = (roles) => {
  if (!roles || !Array.isArray(roles)) return [];
  return roles.map(role => 
    typeof role === 'object' && role !== null ? role.name : role
  );
};

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

        // 🆕 Extract role names from role objects if needed
        if (parsedUser.roles && Array.isArray(parsedUser.roles)) {
          parsedUser.roles = extractRoleNames(parsedUser.roles);
        }

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
    // 🆕 Extract role names from role objects if needed
    if (userData.roles && Array.isArray(userData.roles)) {
      userData.roles = extractRoleNames(userData.roles);
    }

    // Ensure activeRole is set during login
    if (!userData.activeRole && userData.roles && userData.roles.length > 0) {
      // 🆕 Extract active role name if it's an object
      let activeRole = userData.activeRole;
      if (activeRole && typeof activeRole === 'object') {
        activeRole = activeRole.name;
      }

      if (!activeRole) {
        // Prioritize admin/cell member roles over student
        if (
          userData.roles.includes("admin") ||
          userData.roles.includes("student placement cell")
        ) {
          activeRole = userData.roles.includes("admin")
            ? "admin"
            : "student placement cell";
        } else if (userData.roles.includes("student")) {
          activeRole = "student";
        } else {
          activeRole = userData.roles[0]; // Fallback to first role
        }
      }
      
      userData.activeRole = activeRole;
    }

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const switchRole = (newRole) => {
    setIsSwitchingRole(true);
    // 🆕 Extract role name if it's an object
    const normalizedRole = typeof newRole === 'object' ? newRole.name : newRole;
    
    // Update user with new active role
    const updatedUser = {
      ...user,
      activeRole: normalizedRole,
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
    const targetRole = normalizeRole(role);
    return user.roles.some((r) => normalizeRole(r) === targetRole);
  };

  const isActiveRole = (role) => {
    if (!user || !user.activeRole) return false;
    return normalizeRole(user.activeRole) === normalizeRole(role);
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