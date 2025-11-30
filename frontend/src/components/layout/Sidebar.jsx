import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import RoleSwitcher from "../RoleSwitcher";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Users,
  Plus,
  FileText,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  HomeIcon,
  Shield,
  Clipboard,
} from "lucide-react";

export function Sidebar({ isOpen, onClose }) {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  // ✅ Load user info from localStorage
  const [user, setUser] = useState(null);
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      console.log("🔍 Sidebar - Loaded user from localStorage:", parsedUser);
    } else {
      console.log("⚠️ Sidebar - No user found in localStorage");
    }
  }, []);

  // Persist collapsed state (only for desktop)
  useEffect(() => {
    const saved = localStorage.getItem("placemate-sidebar-collapsed");
    if (saved && window.innerWidth >= 1024) {
      setCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      localStorage.setItem("placemate-sidebar-collapsed", String(collapsed));
    }
  }, [collapsed]);

  // Force expand on mobile when sidebar opens
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      setCollapsed(false);
    }
  }, [isOpen]);

  // Main navigation links (shown on mobile instead of navbar)
  const mainNavLinks = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      href: "/admin",
    },
    {
      id: "companies",
      name: "Companies",
      icon: <Building2 size={18} />,
      href: "/admin/companies",
    },
    {
      id: "drives",
      name: "Drives",
      icon: <CalendarDays size={18} />,
      href: "/admin/drives",
    },
    {
      id: "applications",
      name: "Applications",
      icon: <Clipboard size={18} />,
      href: "/admin/applications",
    },
    {
      id: "students",
      name: "Students",
      icon: <Users size={18} />,
      href: "/admin/students",
    },
  ];

  const quickActions = [
    {
      id: "register-company",
      name: "Register Company",
      icon: <Building2 size={18} />,
      href: "/admin/companies/register",
    },
    {
      id: "add-drive",
      name: "Add Drive",
      icon: <Plus size={18} />,
      href: "/admin/drives/new",
    },
    {
      id: "register-student",
      name: "Register Student",
      icon: <Users size={18} />,
      href: "/admin/students/register",
    },
    {
      id: "spc-management",
      name: "Manage SPC Roles",
      icon: <Shield size={18} />,
      href: "/admin/spc",
    },
  ];

  const handleItemClick = (itemId, href) => {
    setActiveItem(itemId);
    if (href) navigate(href);
    if (window.innerWidth < 1024) onClose();
  };

  return (
    <>
      {/* Mobile overlay - appears behind sidebar but above everything else */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 h-full ${
            collapsed && window.innerWidth >= 1024 ? "w-16" : "w-64"
          } transform transition-all duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
          border-r shadow-xl lg:shadow-none
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div
            className={`flex items-center justify-between ${
              collapsed ? "px-2" : "px-4"
            } py-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
          >
            {!collapsed && (
              <span
                className={`${
                  isDark ? "text-gray-300" : "text-gray-600"
                } text-sm font-medium`}
              >
                Menu
              </span>
            )}
            <div className="flex items-center gap-2">
              {/* X button - only on mobile */}
              <button
                onClick={onClose}
                className={`lg:hidden p-2 rounded-lg ${
                  isDark
                    ? "text-gray-400 hover:bg-gray-700"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
                title="Close"
              >
                ✕
              </button>
              {/* Chevron button - only on desktop */}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className={`hidden lg:block p-2 rounded-md ${
                  isDark
                    ? "text-blue-400 hover:bg-gray-700"
                    : "text-blue-600 hover:bg-blue-50"
                }`}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <ChevronRight size={22} />
                ) : (
                  <ChevronLeft size={22} />
                )}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav
            className={`flex-1 ${
              collapsed ? "px-2" : "px-4"
            } py-6 space-y-6 overflow-y-auto`}
          >
            {/* Main Navigation - Visible on mobile (<md), hidden on desktop where navbar shows them */}
            <div className="md:hidden">
              <h3
                className={`px-3 text-xs font-semibold uppercase tracking-wider mb-3 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Navigation
              </h3>
              {mainNavLinks.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id, item.href)}
                  className={`
                    w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${
                      activeItem === item.id
                        ? isDark
                          ? "bg-blue-600 text-white"
                          : "bg-blue-50 text-blue-600"
                        : isDark
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div>
              {!collapsed && (
                <h3
                  className={`px-3 text-xs font-semibold uppercase tracking-wider mb-3 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Quick Actions
                </h3>
              )}
              {quickActions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id, item.href)}
                  className={`
                    w-full flex items-center ${
                      collapsed ? "justify-center px-2" : "px-3"
                    } py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${
                      activeItem === item.id
                        ? isDark
                          ? "bg-blue-600 text-white"
                          : "bg-blue-50 text-blue-700"
                        : isDark
                        ? "text-gray-300 hover:text-white hover:bg-gray-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                >
                  <span className={collapsed ? "" : "mr-3"}>{item.icon}</span>
                  {!collapsed && <span>{item.name}</span>}
                </button>
              ))}
            </div>
          </nav>

          {/* ✅ Sidebar Footer: Role switcher + Theme toggle + Profile */}
          <div
            className={`${collapsed ? "px-2" : "px-3"} py-3 border-t ${
              isDark ? "border-gray-700" : "border-gray-200"
            } space-y-2`}
          >
            {/* Role Switcher - Only show if not collapsed and user has multiple roles */}
            {!collapsed && (
              <div className="mb-2">
                <RoleSwitcher />
              </div>
            )}

            <button
              onClick={toggleTheme}
              className={`w-full ${
                isDark
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-700 hover:bg-gray-100"
              } px-3 py-2 rounded-md flex items-center ${
                collapsed ? "justify-center" : "gap-2"
              }`}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              {!collapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
            </button>

            {/* ✅ Dynamic user info */}
            <div
              className={`${isDark ? "bg-gray-700" : "bg-gray-50"} rounded-lg ${
                collapsed
                  ? "p-2 flex justify-center"
                  : "px-3 py-2 flex items-center gap-3"
              }`}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                <span className="text-white text-sm font-semibold leading-none">
                  {(() => {
                    const firstName = user?.firstName || user?.first_name || "";
                    const lastName = user?.lastName || user?.last_name || "";
                    const email = user?.email || "";

                    if (firstName) {
                      return `${firstName[0]}${
                        lastName ? lastName[0] : ""
                      }`.toUpperCase();
                    }
                    return email ? email[0].toUpperCase() : "U";
                  })()}
                </span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {(() => {
                      const firstName =
                        user?.firstName || user?.first_name || "";
                      const lastName = user?.lastName || user?.last_name || "";
                      const fullName = `${firstName} ${lastName}`.trim();
                      return fullName || user?.email || "Unknown User";
                    })()}
                  </p>
                  <p
                    className={`text-xs truncate ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {user?.activeRole || user?.roles?.[0] || "No Role"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
