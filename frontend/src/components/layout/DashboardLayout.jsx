import React, { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * Main dashboard layout component that combines sidebar, navbar, and content area
 * Provides responsive behavior and theme-aware styling
 */
export function DashboardLayout({ children, title = "Dashboard" }) {
  const { isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle sidebar toggle
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div
      className={`flex flex-col h-screen ${
        isDark ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      {/* Navbar - Fixed at top */}
      <Navbar onMenuClick={toggleSidebar} />

      {/* Content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Below navbar */}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            {/* Page header */}
            <div
              className={`
            border-b px-4 sm:px-6 lg:px-8 py-6
            ${
              isDark
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            }
          `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`
                  text-2xl font-bold
                  ${isDark ? "text-white" : "text-gray-900"}
                `}
                  >
                    {title}
                  </h1>
                  <p
                    className={`
                  text-sm mt-1
                  ${isDark ? "text-gray-400" : "text-gray-500"}
                `}
                  >
                    {title === "Placement Dashboard"
                      ? `Welcome back! Here's the placement status as of ${new Date().toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}.`
                      : title === "Registered Companies"
                      ? "Manage and view all companies registered in the placement portal."
                      :title === "Manage Applications"
                      ?"Review and manage student job applications"
                      : title === "Placement Drives"
                      ? "Browse and manage all placement drives and opportunities."
                      : title === "Registered Students"
                      ? "View and manage all students registered for placements."
                      : title === "Register Student"
                      ? "Add new student to the placemate"
                      : title === "Manage SPC Roles"
                      ? "Assign and manage SPC roles for students"
                      : `Last updated: ${new Date().toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}`}
                  </p>
                </div>

                {/* Page actions can be added here */}
                <div className="flex items-center space-x-3">
                  {/* Add any page-specific actions */}
                </div>
              </div>
            </div>

            {/* Page content */}
            <div className="px-4 sm:px-6 lg:px-8 py-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * Page wrapper component for consistent spacing and styling
 */
export function PageContainer({ children, className = "" }) {
  return <div className={`space-y-6 ${className}`}>{children}</div>;
}

/**
 * Section component for organizing content within pages
 */
export function Section({
  title,
  description,
  children,
  action = null,
  className = "",
}) {
  const { isDark } = useTheme();

  return (
    <div className={`${className}`}>
      {(title || description || action) && (
        <div className="flex items-center justify-between mb-6">
          <div>
            {title && (
              <h2
                className={`
                text-lg font-semibold
                ${isDark ? "text-white" : "text-gray-900"}
              `}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                className={`
                text-sm mt-1
                ${isDark ? "text-gray-400" : "text-gray-600"}
              `}
              >
                {description}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
