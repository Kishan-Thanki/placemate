import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logoUrl from "../../../src/assets/placemate.png";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { Bell } from "lucide-react";
import { fetchJSON } from "../../lib/api";
import { performLogout } from "../../lib/auth";


/**
 * Main navigation bar for the dashboard
 * Includes logo, navigation items, dark mode toggle, notifications, and user profile
 */
export function Navbar({ onMenuClick }) {
  const { isDark } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Refs for click-outside detection
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  // Get user info from AuthContext
  const fullName = user
    ? `${user.firstName || user.first_name || ""} ${
        user.lastName || user.last_name || ""
      }`.trim()
    : "";
  const email = user?.email || "";

  // Debug logging
  useEffect(() => {
    console.log("🔍 Navbar - Current user:", user);
    console.log("🔍 Navbar - User activeRole:", user?.activeRole);
    console.log("🔍 Navbar - Full name:", fullName);
    console.log("🔍 Navbar - Email:", email);
  }, [user, fullName, email]);

  // Generate initials from name, fallback to email, then 'U'
  const initials = fullName
    ? fullName
        .split(" ")
        .filter((n) => n.length > 0)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) // Take max 2 letters
    : email
    ? email[0].toUpperCase()
    : "U";

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
                  to: "/admin",
                  end: true,
                  roles: ["Admin", "Student Placement Cell"], // Admin and SPC
                },
                { id: "companies", label: "Companies", to: "/admin/companies", roles: ["Admin", "Student Placement Cell"] }, // Admin and SPC
                {
                  id: "placement-drives",
                  label: "Placement Drives",
                  to: "/admin/placement-drives",
                  roles: ["Admin"], // Admin only
                },
                { id: "drives", label: "Company-Drives", to: "/admin/drives", roles: ["Admin", "Student Placement Cell"] }, // Admin and SPC
                { id: "applications", label: "Applications", to: "/admin/applications", roles: ["Admin", "Student Placement Cell"] }, // Admin and SPC
                { id: "students", label: "Students", to: "/admin/students", roles: ["Admin", "Student Placement Cell"] }, // Admin and SPC
              ]
              .filter(item => {
                // If no roles specified, show to everyone
                if (!item.roles || item.roles.length === 0) return true;
                // If user role not available yet, show all items (will re-render when user loads)
                if (!user?.activeRole) return true;
                // Check if user's role is in the allowed roles
                return item.roles.includes(user.activeRole);
              })
              .map((item) => (
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
            <div className="relative" ref={profileRef}>
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
                    {initials}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {fullName || "User"}
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

              {showProfileMenu && (
                <div
                  className={`
                  absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50
                  ${
                    isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  } border
                  max-h-[calc(100vh-100px)] overflow-y-auto
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
                        {fullName || "User"}
                      </p>
                      <p
                        className={`text-xs ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {email || "No Email"}
                      </p>
                    </div>
                    
                    
                    <div>
                      <button
                        onClick={handleSignOut}
                        disabled={isLoggingOut}
                        className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm transition-colors ${
                          isDark
                            ? "text-red-400 hover:bg-gray-700"
                            : "text-red-600 hover:bg-gray-100"
                        } ${
                          isLoggingOut
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
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
      {(showProfileMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowProfileMenu(false);
            setShowNotifications(false);
          }}
        />
      )}

    </nav>
  );
}
