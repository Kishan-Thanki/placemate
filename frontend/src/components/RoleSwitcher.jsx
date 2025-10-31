import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { fetchJSON } from "../lib/api";

/**
 * RoleSwitcher component - Allows users with multiple roles to switch between them
 */
export default function RoleSwitcher() {
  const { user, login } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Don't show if user doesn't have multiple roles
  if (!user || !user.roles || user.roles.length <= 1) {
    return null;
  }

  const handleRoleSwitch = async (selectedRole) => {
    if (selectedRole === user.activeRole) {
      setIsOpen(false);
      return;
    }

    setSwitching(true);

    try {
      const { ok, data: result } = await fetchJSON(
        "/api/v1/users/auth/select-role/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            role: selectedRole,
          }),
          credentials: "include", // Important for cookies
        }
      );

      if (ok && result?.success) {
        // Update user with new active role
        const updatedUser = {
          ...user,
          activeRole: selectedRole,
        };

        login(updatedUser);
        setIsOpen(false);

        // Navigate to appropriate dashboard
        const normalizedRole = selectedRole.toLowerCase();
        if (normalizedRole === "admin") {
          navigate("/admin");
        } else if (normalizedRole === "student placement cell") {
          navigate("/admin");
        } else if (normalizedRole === "student") {
          navigate("/student");
        }
      }
    } catch (err) {
      console.error("Role switch error:", err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm
          ${
            isDark
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
          }
        `}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span className="font-medium">{user.activeRole}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div
            className={`
              absolute right-0 mt-2 w-64 rounded-lg shadow-lg z-40
              ${
                isDark
                  ? "bg-gray-800 border border-gray-700"
                  : "bg-white border border-gray-200"
              }
            `}
          >
            <div
              className={`
                px-4 py-3 border-b
                ${isDark ? "border-gray-700" : "border-gray-200"}
              `}
            >
              <p
                className={`text-xs font-medium ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Switch Role
              </p>
            </div>

            <div className="py-2">
              {user.roles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  disabled={switching}
                  className={`
                    w-full px-4 py-2 text-left text-sm flex items-center justify-between
                    transition-colors
                    ${
                      role === user.activeRole
                        ? isDark
                          ? "bg-blue-900/30 text-blue-400"
                          : "bg-blue-50 text-blue-600"
                        : isDark
                        ? "hover:bg-gray-700 text-gray-300"
                        : "hover:bg-gray-50 text-gray-700"
                    }
                    ${switching ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  <span>{role}</span>
                  {role === user.activeRole && (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {switching && (
              <div
                className={`
                  px-4 py-2 border-t flex items-center gap-2 text-xs
                  ${
                    isDark
                      ? "border-gray-700 text-gray-400"
                      : "border-gray-200 text-gray-600"
                  }
                `}
              >
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
                <span>Switching role...</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
