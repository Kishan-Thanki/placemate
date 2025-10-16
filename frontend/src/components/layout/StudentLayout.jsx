// src/components/layout/StudentLayout.jsx
import React, { useState, useEffect } from "react";
import { StudentNavbar } from "./StudentNavbar";
import { StudentSidebar } from "./StudentSidebar";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * Student-specific layout (Dashboard + Drives + Applications + Profile)
 * Keeps consistent spacing and theme behavior as the main DashboardLayout
 */
export function StudentLayout({ children, title = "Dashboard" }) {
  const { isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Responsive sidebar toggle
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={`flex h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Sidebar */}
      <StudentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Navbar */}
        <StudentNavbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Header */}
        <main className="flex-1 overflow-y-auto">
          

          {/* Content */}
          <div className="px-4 sm:px-6 lg:px-8 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
