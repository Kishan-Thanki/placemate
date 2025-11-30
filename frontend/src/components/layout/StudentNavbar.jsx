import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import logoUrl from "../../assets/placemate.png";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { performLogout } from "../../lib/auth";
import { LoadingOverlay } from "../ui/Spinner";
import { Moon, Sun } from "lucide-react";

/**
 * Main navigation bar for the student dashboard
 * Includes logo, navigation items, notifications, and user profile
 */
export function StudentNavbar({ onMenuClick }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Handle sign out
  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await performLogout(logout);
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <nav
      className={`
      z-50 border-b transition-all duration-200
      ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
    `}
    >
      <div className="px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-20 py-2">
          {/* Left section: Logo + mobile menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={onMenuClick}
              className={`
                lg:hidden p-2 rounded-md transition-colors cursor-pointer
                ${
                  isDark
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }
              `}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <img
                src={logoUrl}
                alt="Placemate Logo"
                className="h-12 w-12 sm:h-14 sm:w-14 object-contain my-1"
              />
              <span
                className={`text-lg sm:text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Placemate
              </span>
            </div>
          </div>

          {/* Center section: Navigation links */}
          <div className="flex-1 flex items-center justify-center mx-4">
            {/* Mobile: Show in sidebar, Desktop: Show in navbar */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              {[
                {
                  id: "dashboard",
                  label: "Dashboard",
                  to: "/student",
                  end: true,
                },
                { id: "drives", label: "Drives", to: "/student/drives" },
                { id: "applications", label: "Applications", to: "/student/applications" },
                { id: "profile", label: "Profile", to: "/student/profile" },
              ].map((item) => (
                <NavLink
                  key={item.id}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `
                    text-sm font-medium pb-1 border-b-2 transition-colors whitespace-nowrap
                    ${
                      isActive
                        ? isDark
                          ? "text-blue-400 border-blue-400"
                          : "text-blue-600 border-blue-600"
                        : isDark
                        ? "text-gray-300 border-transparent hover:text-white"
                        : "text-gray-600 border-transparent hover:text-gray-900"
                    }
                  `}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right section: Profile */}
          <div className="flex items-center justify-end space-x-1 sm:space-x-3">
            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`
                  flex items-center space-x-2 p-2 rounded-lg transition-colors cursor-pointer
                  ${
                    isDark
                      ? "text-gray-300 hover:text-white hover:bg-gray-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }
                `}
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "S"}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {user?.firstName || user?.email?.split('@')[0] || "Student"}
                </span>
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Profile dropdown menu */}
              {showProfileMenu && (
                <div
                  className={`
                  absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50
                  ${
                    isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }
                  border
                `}
                >
                  <div className="py-2">
                    <div
                      className={`px-4 py-2 border-b ${
                        isDark ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <p
                        className={`text-sm font-medium ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {user?.firstName || user?.email || "Student"}
                      </p>
                      <p
                        className={`text-xs ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {user?.email || "student@placemate.com"}
                      </p>
                    </div>
                    <div
                      className={`border-t ${
                        isDark ? "border-gray-700" : "border-gray-200"
                      } pt-2`}
                    >
                      {/* Theme Toggle Button */}
                      <button
                        onClick={toggleTheme}
                        className={`
                        flex items-center gap-2 w-full text-left px-4 py-2 text-sm transition-colors
                        ${
                          isDark
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }
                      `}
                      >
                        {isDark ? (
                          <>
                            <Sun size={16} />
                            <span>Light Mode</span>
                          </>
                        ) : (
                          <>
                            <Moon size={16} />
                            <span>Dark Mode</span>
                          </>
                        )}
                      </button>

                      {/* Sign Out Button */}
                      <button
                        onClick={handleSignOut}
                        disabled={isLoggingOut}
                        className={`
                        flex items-center gap-2 w-full text-left px-4 py-2 text-sm transition-colors
                        ${
                          isDark
                            ? "text-red-400 hover:bg-gray-700"
                            : "text-red-600 hover:bg-gray-100"
                        }
                        ${
                          isLoggingOut
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }
                      `}
                      >
                        {isLoggingOut ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                            <span>Logging out...</span>
                          </>
                        ) : (
                          <>
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
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            <span>Sign Out</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowProfileMenu(false);
          }}
        />
      )}

      {/* Loading overlay during logout */}
      {isLoggingOut && <LoadingOverlay message="Logging out..." />}
    </nav>
  );
}
