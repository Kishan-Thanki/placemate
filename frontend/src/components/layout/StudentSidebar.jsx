import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Briefcase, Moon, Sun, UserRound, HomeIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import RoleSwitcher from '../RoleSwitcher';

/**
 * Sidebar navigation component for the student dashboard
 * Includes navigation items and supports desktop/mobile views with collapse functionality
 */
export function StudentSidebar({ isOpen, onClose }) {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  // Sync active item with current route
  useEffect(() => {
    const path = location.pathname;
    
    // Match the path to navigation items
    if (path === "/student" || path === "/student/") {
      setActiveItem("dashboard");
    } else if (path.startsWith("/student/drives")) {
      setActiveItem("drives");
    } else if (path.startsWith("/student/applications")) {
      setActiveItem("applications");
    } else if (path.startsWith("/student/profile")) {
      setActiveItem("profile");
    }
  }, [location.pathname]);

  // Load collapsed state from localStorage on mount (desktop only)
  useEffect(() => {
    const saved = localStorage.getItem("placemate-student-sidebar-collapsed");
    if (saved && window.innerWidth >= 1024) {
      setCollapsed(saved === "true");
    }
  }, []);

  // Persist collapsed state to localStorage (desktop only)
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      localStorage.setItem("placemate-student-sidebar-collapsed", String(collapsed));
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
      id: 'dashboard',
      name: 'Dashboard',
      icon: <HomeIcon size={18} />,
      href: '/student',
    },
    {
      id: 'drives',
      name: 'Company-Drives',
      icon: <Briefcase size={18} />,
      href: '/student/drives',
    },
    {
      id: 'applications',
      name: 'Applications',
      icon: <FileText size={18} />,
      href: '/student/applications',
    },
    {
      id: 'profile',
      name: 'Profile',
      icon: <UserRound size={18} />,
      href: '/student/profile',
    },
  ];

  // Quick actions for sidebar
  const quickActions = [];

  const handleItemClick = (itemId, href) => {
    setActiveItem(itemId);
    if (href) navigate(href);
    if (window.innerWidth < 1024) onClose(); // Only close on mobile
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

      {/* Sidebar - Visible on both mobile and desktop */}
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
            {/* Menu text */}
            {!collapsed && (
              <h2
                className={`text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Menu
              </h2>
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
          <nav className={`flex-1 ${
              collapsed ? "px-2" : "px-4"
            } py-6 space-y-6 overflow-y-auto`}>
            {/* Main Navigation */}
            <div>
              {!collapsed && (
                <h3
                  className={`px-3 text-xs font-semibold uppercase tracking-wider mb-3 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Navigation
                </h3>
              )}
              {mainNavLinks.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id, item.href)}
                  className={`
                    w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${collapsed ? "justify-center" : ""}
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
                  title={collapsed ? item.name : ""}
                >
                  <span className={collapsed ? "" : "mr-3"}>{item.icon}</span>
                  {!collapsed && <span>{item.name}</span>}
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            {quickActions.length > 0 && (
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
                      w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${collapsed ? "justify-center" : ""}
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
                    title={collapsed ? item.name : ""}
                  >
                    <span className={collapsed ? "" : "mr-3"}>{item.icon}</span>
                    {!collapsed && <span>{item.name}</span>}
                  </button>
                ))}
              </div>
            )}
          </nav>

          {/* Sidebar Footer: Role switcher + theme toggle + profile */}
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

            <div
              className={`${isDark ? "bg-gray-700" : "bg-gray-50"} rounded-lg ${
                collapsed
                  ? "p-2 flex justify-center"
                  : "px-3 py-2 flex items-center gap-3"
              }`}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                <span className="text-white text-sm font-semibold leading-none">
                  {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'S'}
                </span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {user?.firstName || user?.email?.split('@')[0] || 'Student'}
                  </p>
                  <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user?.activeRole || 'Student'}
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