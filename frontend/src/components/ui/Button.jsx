import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Reusable Button component with multiple variants and sizes
 * Supports theme-aware styling and dark mode
 */
export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  onClick,
  type = 'button',
  ...props 
}) {
  const { isDark } = useTheme();

  // Base button styles
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}
  `;

  // Size variants
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
    xl: 'px-8 py-4 text-lg gap-3',
  };

  // Color variants
  const variantStyles = {
    primary: `
      bg-transparent text-blue-600 border border-blue-200
      hover:bg-blue-600 hover:text-white
      focus:ring-blue-500
    `,
    secondary: `
      ${isDark 
        ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
        : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
      }
      focus:ring-gray-500
    `,
    success: `
      bg-transparent text-green-600 border border-green-200
      hover:bg-green-600 hover:text-white
      focus:ring-green-500
    `,
    warning: `
      bg-transparent text-yellow-600 border border-yellow-200
      hover:bg-yellow-600 hover:text-white
      focus:ring-yellow-500
    `,
    danger: `
      bg-transparent text-red-600 border border-red-200
      hover:bg-red-600 hover:text-white
      focus:ring-red-500
    `,
    outline: `
      ${isDark 
        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
      }
      border bg-transparent focus:ring-blue-500
    `,
    ghost: `
      ${isDark 
        ? 'text-gray-300 hover:bg-gray-700' 
        : 'text-gray-600 hover:bg-gray-100'
      }
      bg-transparent focus:ring-gray-500
    `,
  };

  const buttonClass = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <button
      type={type}
      className={buttonClass}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}