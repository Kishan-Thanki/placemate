import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Reusable Card component with customizable padding and styling
 * Supports theme-aware styling and dark mode
 */
export function Card({ 
  children, 
  className = '', 
  padding = 'md',
  shadow = 'md',
  hover = false,
  withBorder = true,
  onClick = null,
  ...props 
}) {
  const { isDark } = useTheme();

  // Base card styles
  const baseStyles = `
    rounded-lg transition-all duration-200 ease-in-out
    ${isDark 
      ? `bg-gray-800 ${withBorder ? 'border border-gray-700' : ''}` 
      : `bg-white ${withBorder ? 'border border-gray-200' : ''}`
    }
    ${onClick ? 'cursor-pointer' : ''}
  `;

  // Padding variants
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  // Shadow variants
  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  // Hover effects
  const hoverStyles = hover ? `
    hover:shadow-lg hover:-translate-y-0.5
    ${isDark ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}
  ` : '';

  const cardClass = `
    ${baseStyles}
    ${paddingStyles[padding]}
    ${shadowStyles[shadow]}
    ${hoverStyles}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  const CardComponent = onClick ? 'button' : 'div';

  return (
    <CardComponent
      className={cardClass}
      onClick={onClick}
      {...props}
    >
      {children}
    </CardComponent>
  );
}

/**
 * Card Header component for consistent card headers
 */
export function CardHeader({ children, className = '' }) {
  const cardHeaderClass = `pb-3 border-b border-gray-200 dark:border-gray-700 ${className}`;
  
  return (
    <div className={cardHeaderClass}>
      {children}
    </div>
  );
}

/**
 * Card Body component for card content areas
 */
export function CardBody({ children, className = '' }) {
  const cardBodyClass = `py-3 ${className}`;
  
  return (
    <div className={cardBodyClass}>
      {children}
    </div>
  );
}

/**
 * Card Footer component for card footers
 */
export function CardFooter({ children, className = '' }) {
  const cardFooterClass = `pt-3 border-t border-gray-200 dark:border-gray-700 ${className}`;
  
  return (
    <div className={cardFooterClass}>
      {children}
    </div>
  );
}