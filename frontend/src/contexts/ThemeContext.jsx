import React, { createContext, useContext, useEffect, useState } from 'react';
import { generateCSSVariables } from '../theme';

// Create theme context
const ThemeContext = createContext();

// Theme provider component
export function ThemeProvider({ children }) {
  // Initialize theme from localStorage or default to 'light'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('placemate-theme');
      return savedTheme || 'light';
    }
    return 'light';
  });

  // Toggle between light and dark themes
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    const cssVariables = generateCSSVariables(theme);
    
    // Apply CSS custom properties
    Object.entries(cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // Add theme class to document
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Save theme preference
    localStorage.setItem('placemate-theme', theme);
    
    // Update document meta theme-color for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', cssVariables['--navbar-bg']);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = cssVariables['--navbar-bg'];
      document.head.appendChild(meta);
    }
  }, [theme]);

  // Detect system preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('placemate-theme');
    
    // Only use system preference if no saved preference exists
    if (!savedTheme) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      setTheme(systemTheme);
      
      // Listen for system theme changes
      const handleChange = (e) => {
        if (!localStorage.getItem('placemate-theme')) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const value = {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

// Higher-order component for theme-aware components
export function withTheme(Component) {
  return function ThemedComponent(props) {
    const themeProps = useTheme();
    return <Component {...props} {...themeProps} />;
  };
}