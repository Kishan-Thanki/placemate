import React from 'react';
import { Card } from './Card';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * StatCard component for displaying key statistics in the dashboard
 * Matches the design from the admin dashboard screenshot
 */
export function StatCard({ 
  title, 
  value, 
  icon = null,
  trend = null,
  trendDirection = null, // 'up', 'down', 'neutral'
  color = 'blue',
  className = '',
  ...props 
}) {
  const { isDark } = useTheme();

  // Color variants for different stat types
  const colorVariants = {
    blue: {
      bg: '',
      border: '',
      icon: 'text-blue-600 dark:text-blue-400',
      text: 'text-blue-600 dark:text-blue-400',
      bar: 'bg-blue-600 dark:bg-blue-400',
    },
    green: {
      bg: '',
      border: '',
      icon: 'text-green-600 dark:text-green-400',
      text: 'text-green-600 dark:text-green-400',
      bar: 'bg-green-600 dark:bg-green-400',
    },
    red: {
      bg: '',
      border: '',
      icon: 'text-red-600 dark:text-red-400',
      text: 'text-red-600 dark:text-red-400',
      bar: 'bg-red-600 dark:bg-red-400',
    },
    yellow: {
      bg: '',
      border: '',
      icon: 'text-yellow-600 dark:text-yellow-400',
      text: 'text-yellow-600 dark:text-yellow-400',
      bar: 'bg-yellow-500 dark:bg-yellow-400',
    },
    purple: {
      bg: '',
      border: '',
      icon: 'text-purple-600 dark:text-purple-400',
      text: 'text-purple-600 dark:text-purple-400',
      bar: 'bg-purple-600 dark:bg-purple-400',
    },
  };

  const colors = colorVariants[color] || colorVariants.blue;

  // Trend direction styling
  const getTrendStyles = () => {
    if (!trend || !trendDirection) return '';
    
    switch (trendDirection) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      case 'neutral':
        return 'text-gray-500 dark:text-gray-400';
      default:
        return '';
    }
  };

  const getTrendIcon = () => {
    if (!trendDirection) return null;
    
    switch (trendDirection) {
      case 'up':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'neutral':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <Card 
      withBorder={false}
      className={`relative ${colors.bg} hover:shadow-lg transition-all duration-200 ${className}`} 
      padding="lg"
      {...props}
    >
      {/* Blended left accent that melts into the rounded corner */}
      <span
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${colors.bar}`}
        style={{ borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }}
        aria-hidden="true"
      />
      {/* Soft glow to blend with card curve */}
      <span
        className={`absolute left-0 top-0 bottom-0 w-3 opacity-20 ${colors.bar}`}
        style={{ filter: 'blur(8px)', borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }}
        aria-hidden="true"
      />
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>
            {title}
          </p>
          <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${getTrendStyles()}`}>
              {getTrendIcon()}
              <span className="ml-1">{trend}</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className={`flex-shrink-0 ${colors.icon}`}>
            <div className="text-2xl">
              {icon}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Stats Grid component for organizing multiple stat cards
 */
export function StatsGrid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {children}
    </div>
  );
}