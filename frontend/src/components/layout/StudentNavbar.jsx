import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logoUrl from '../../assets/placemate.png';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui';
import { Bell } from 'lucide-react';

/**
 * Main navigation bar for the admin dashboard
 * Includes logo, navigation items, search, dark mode toggle, and user profile
 */
export function StudentNavbar({ onMenuClick }) {
  const { isDark } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock notifications (replace with real data later)
  const notifications = [
    { id: 1, title: 'New job application', message: 'John Doe applied for Software Engineer', time: '2m ago' },
    { id: 2, title: 'Drive reminder', message: 'TCS drive starts tomorrow', time: '1h ago' },
    { id: 3, title: 'Interview scheduled', message: 'Interview with Google at 3 PM', time: '2h ago' },
  ];

  return (
    <nav className={`
      sticky top-0 z-50 border-b transition-all duration-200
      ${isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
      }
    `}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 items-center h-16 gap-4">
          {/* Left section - Logo and Menu button */}
          <div className="col-span-12 lg:col-span-4 flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className={`
                lg:hidden p-2 rounded-md transition-colors
                ${isDark 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img 
                src={logoUrl} 
                alt="Placemate Logo" 
                className="h-8 w-8 rounded"
              />
              <span className={`
                text-xl font-bold hidden sm:block
                ${isDark ? 'text-white' : 'text-gray-900'}
              `}>
                Placemate
              </span>
            </div>
          </div>

          {/* Center section - Nav links + Search (hidden some parts on mobile) */}
          <div className="hidden md:flex col-span-12 lg:col-span-4 items-center">
            {/* Top nav tabs */}
            


          {/* Right section - Actions and Profile */}
          </div>
          {/* Close center section wrapper */}
          
          {/* Right section - Actions and Profile */}
          <div className="col-span-12 lg:col-span-4 flex items-center justify-end space-x-3">

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`
                  p-2 rounded-lg transition-colors relative
                  ${isDark 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <Bell size={18} />
                {/* Notification badge */}
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className={`
                  absolute right-0 mt-2 w-80 rounded-lg shadow-lg z-50
                  ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                  border
                `}>
                  <div className="p-4">
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Notifications
                    </h3>
                    <div className="mt-3 space-y-3">
                      {notifications.map((notification) => (
                        <div key={notification.id} className={`
                          p-3 rounded-lg transition-colors cursor-pointer
                          ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}
                        `}>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {notification.title}
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {notification.time}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <button className={`
                        text-sm w-full text-center py-2 rounded-lg transition-colors
                        ${isDark 
                          ? 'text-blue-400 hover:bg-gray-700' 
                          : 'text-blue-600 hover:bg-gray-50'
                        }
                      `}>
                        View all notifications
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`
                  flex items-center space-x-2 p-2 rounded-lg transition-colors
                  ${isDark 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">S</span>
                </div>
                <span className="hidden md:block text-sm font-medium">Student</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile dropdown menu */}
              {showProfileMenu && (
                <div className={`
                  absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50
                  ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                  border
                `}>
                  <div className="py-2">
                    <div className={`px-4 py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Student
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        student@placemate.com
                      </p>
                    </div>
                    <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-2`}>
                      <button className={`
                        block w-full text-left px-4 py-2 text-sm transition-colors
                        ${isDark 
                          ? 'text-red-400 hover:bg-gray-700' 
                          : 'text-red-600 hover:bg-gray-100'
                        }
                      `}>
                        Sign Out
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