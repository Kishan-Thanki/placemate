// Theme configuration for Placemate Admin Dashboard
export const theme = {
  colors: {
    // Primary brand colors
    primary: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9", // Main primary color
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
    },

    // Secondary colors (purple accent)
    secondary: {
      50: "#faf5ff",
      100: "#f3e8ff",
      200: "#e9d5ff",
      300: "#d8b4fe",
      400: "#c084fc",
      500: "#a855f7",
      600: "#9333ea",
      700: "#7c3aed",
      800: "#6b21a8",
      900: "#581c87",
    },

    // Neutral grays
    gray: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
    },

    // Status colors
    success: {
      50: "#f0fdf4",
      100: "#dcfce7",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
    },

    warning: {
      50: "#fffbeb",
      100: "#fef3c7",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
    },

    danger: {
      50: "#fef2f2",
      100: "#fee2e2",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
    },

    info: {
      50: "#eff6ff",
      100: "#dbeafe",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
    },
  },

  // Light and Dark mode configurations
  modes: {
    light: {
      background: {
        primary: "#ffffff",
        secondary: "#f8fafc",
        tertiary: "#f1f5f9",
      },
      text: {
        primary: "#1e293b",
        secondary: "#64748b",
        tertiary: "#94a3b8",
      },
      border: "#e2e8f0",
      shadow: "rgba(0, 0, 0, 0.1)",
      cardBg: "#ffffff",
      navbarBg: "#ffffff",
      sidebarBg: "#ffffff",
    },

    dark: {
      background: {
        primary: "#0f172a",
        secondary: "#1e293b",
        tertiary: "#334155",
      },
      text: {
        primary: "#f1f5f9",
        secondary: "#cbd5e1",
        tertiary: "#94a3b8",
      },
      border: "#334155",
      shadow: "rgba(0, 0, 0, 0.3)",
      cardBg: "#1e293b",
      navbarBg: "#1e293b",
      sidebarBg: "#1e293b",
    },
  },

  // Spacing system
  spacing: {
    xs: "0.5rem", // 8px
    sm: "0.75rem", // 12px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
    "3xl": "4rem", // 64px
  },

  // Typography
  typography: {
    fontSizes: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
    },
    fontWeights: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },

  // Border radius
  borderRadius: {
    sm: "0.25rem", // 4px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px
    xl: "0.75rem", // 12px
    "2xl": "1rem", // 16px
    full: "9999px",
  },

  // Shadows
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },

  // Animations and transitions
  transitions: {
    fast: "150ms ease-in-out",
    normal: "300ms ease-in-out",
    slow: "500ms ease-in-out",
  },
};

// CSS custom properties for dynamic theming
export const generateCSSVariables = (mode = "light") => {
  const modeColors = theme.modes[mode];

  return {
    // Background colors
    "--bg-primary": modeColors.background.primary,
    "--bg-secondary": modeColors.background.secondary,
    "--bg-tertiary": modeColors.background.tertiary,

    // Text colors
    "--text-primary": modeColors.text.primary,
    "--text-secondary": modeColors.text.secondary,
    "--text-tertiary": modeColors.text.tertiary,

    // UI colors
    "--border-color": modeColors.border,
    "--shadow-color": modeColors.shadow,
    "--card-bg": modeColors.cardBg,
    "--navbar-bg": modeColors.navbarBg,
    "--sidebar-bg": modeColors.sidebarBg,

    // Primary brand colors
    "--primary-50": theme.colors.primary[50],
    "--primary-100": theme.colors.primary[100],
    "--primary-500": theme.colors.primary[500],
    "--primary-600": theme.colors.primary[600],
    "--primary-700": theme.colors.primary[700],

    // Secondary colors
    "--secondary-500": theme.colors.secondary[500],
    "--secondary-600": theme.colors.secondary[600],

    // Status colors
    "--success-500": theme.colors.success[500],
    "--warning-500": theme.colors.warning[500],
    "--danger-500": theme.colors.danger[500],
    "--info-500": theme.colors.info[500],
  };
};
