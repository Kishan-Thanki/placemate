import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { LayoutDashboard, Building2, CalendarDays, Users, Plus, FileText, Briefcase, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';

/**
 * Sidebar navigation component for the admin dashboard
 * Includes navigation items matching the design from the screenshot
 */
export function Sidebar({ isOpen, onClose }) {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('placemate-sidebar-collapsed');
    if (saved) setCollapsed(saved === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('placemate-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  // Navigation items as shown in the screenshot
  const navigationItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
      href: '/admin',
    },
    {
      id: 'companies',
      name: 'Companies',
      icon: <Building2 size={18} />,
      href: '/admin/companies',
    },
    {
      id: 'drives',
      name: 'Drives',
      icon: <CalendarDays size={18} />,
      href: '/admin/drives',
    },
    {
      id: 'students',
      name: 'Students',
      icon: <Users size={18} />,
      href: '/admin/students',
    },
  ];

  // Additional menu items (sub-navigation from the screenshot)
  const quickActions = [
    {
      id: 'add-drive',
      name: 'Add Drive',
      icon: <Plus size={18} />,
      href: '/admin/drives/new',
    },
    {
      id: 'register-student',
      name: 'Register Student',
      icon: <Users size={18} />,
      href: '/admin/students/register',
    },
    {
      id: 'basic-details',
      name: 'Basic Details',
      icon: <FileText size={18} />,
      href: '/admin/settings/basic',
    },
    {
      id: 'job-details',
      name: 'Job Details',
      icon: <Briefcase size={18} />,
      href: '/admin/jobs',
    },
  ];

  const handleItemClick = (itemId, href) => {
    setActiveItem(itemId);
    // Navigate using React Router
    if (href) navigate(href);
    
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 z-50 h-full ${collapsed ? 'w-16' : 'w-64'} transform transition-all duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
        }
        border-r
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header with Menu label and collapse */}
          <div className={`flex items-center justify-between ${collapsed ? 'px-2' : 'px-4'} py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {!collapsed && (
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>Menu</span>
            )}
            <div className="flex items-center gap-2">
              {/* Close button for mobile */}
              <button
                onClick={onClose}
                className={`lg:hidden p-2 rounded-lg ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className={`p-2 rounded-md ${isDark ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50'}`}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-4'} py-6 space-y-2`}>
            {/* Main Navigation */}
            <div>
              {!collapsed && (
                <h3 className={`px-3 text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Navigation
                </h3>
              )}
              
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id, item.href)}
                  className={`
                    w-full flex items-center ${collapsed ? 'justify-center' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${activeItem === item.id
                      ? isDark
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : isDark
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className={`${collapsed ? '' : 'mr-3'}`}>{item.icon}</span>
                  {!collapsed && item.name}
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="pt-6">
              {!collapsed && (
                <h3 className={`px-3 text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Quick Actions
                </h3>
              )}
              
              {quickActions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id, item.href)}
                  className={`
                    w-full flex items-center ${collapsed ? 'justify-center' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${activeItem === item.id
                      ? isDark
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-700'
                      : isDark
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className={`${collapsed ? '' : 'mr-3'}`}>{item.icon}</span>
                  {!collapsed && item.name}
                </button>
              ))}
            </div>
          </nav>

          {/* Sidebar Footer: theme toggle + profile */}
          <div className={`px-3 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} space-y-2`}>
            <button
              onClick={toggleTheme}
              className={`w-full ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} px-3 py-2 rounded-md flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              {!collapsed && (isDark ? 'Light Mode' : 'Dark Mode')}
            </button>

            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg ${collapsed ? 'p-2 flex justify-center' : 'px-3 py-2 flex items-center gap-3'}`}>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                <span className="text-white text-sm font-semibold leading-none">A</span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>Admin</p>
                  <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>System Administrator</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}