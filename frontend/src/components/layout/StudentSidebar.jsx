import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Briefcase, Moon, Sun, UserRound, HomeIcon } from 'lucide-react';

/**
 * Sidebar navigation component for the admin dashboard
 * Includes navigation items matching the design from the screenshot
 */
export function StudentSidebar({ isOpen, onClose }) {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('dashboard');

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
      name: 'Drives',
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
    onClose(); // Always close on mobile since sidebar is mobile-only
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

      {/* Sidebar - Only visible on mobile, hidden on desktop */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-full w-64 transform transition-all duration-300 ease-in-out
          lg:hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
          border-r shadow-xl
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div
            className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
          >
            <span
              className={`${
                isDark ? "text-gray-300" : "text-gray-600"
              } text-sm font-medium`}
            >
              Menu
            </span>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${
                isDark
                  ? "text-gray-400 hover:bg-gray-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
            {/* Main Navigation */}
            <div>
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
            {quickActions.length > 0 && (
              <div>
                <h3
                  className={`px-3 text-xs font-semibold uppercase tracking-wider mb-3 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Quick Actions
                </h3>
                {quickActions.map((item) => (
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
            )}
          </nav>

          {/* Sidebar Footer: theme toggle + profile */}
          <div className={`px-3 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} space-y-2`}>
            <button
              onClick={toggleTheme}
              className={`w-full ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} px-3 py-2 rounded-md flex items-center gap-2`}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>

            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg px-3 py-2 flex items-center gap-3`}>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                <span className="text-white text-sm font-semibold leading-none">
                  {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'S'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user?.firstName || user?.email?.split('@')[0] || 'Student'}
                </p>
                <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Student</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}