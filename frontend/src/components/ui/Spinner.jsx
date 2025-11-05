import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * Simple animated spinner for inline loading states
 */
export const Spinner = ({ size = "md", className = "" }) => {
  const { isDark } = useTheme();

  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
    xl: "w-16 h-16 border-4",
  };

  return (
    <div
      className={`${
        sizeClasses[size]
      } border-t-transparent rounded-full animate-spin ${
        isDark ? "border-blue-400" : "border-blue-600"
      } ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

/**
 * Pulsing dots animation for subtle loading states
 */
export const PulsingDots = ({ className = "" }) => {
  const { isDark } = useTheme();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full animate-pulse ${
            isDark ? "bg-blue-400" : "bg-blue-600"
          }`}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  );
};

/**
 * Full-screen loading overlay with animated spinner
 */
export const LoadingOverlay = ({ message = "Loading..." }) => {
  const { isDark } = useTheme();

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm ${
        isDark ? "bg-gray-900/80" : "bg-white/80"
      }`}
    >
      <Spinner size="xl" />
      {message && (
        <p
          className={`mt-4 text-lg font-medium ${
            isDark ? "text-gray-200" : "text-gray-700"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

/**
 * Skeleton loader for table rows
 */
export const TableRowSkeleton = ({ columns = 6 }) => {
  const { isDark } = useTheme();

  return (
    <tr className={isDark ? "bg-gray-800" : "bg-gray-50"}>
      {[...Array(columns)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className={`h-4 rounded animate-pulse ${
              isDark ? "bg-gray-700" : "bg-gray-200"
            }`}
            style={{ width: `${60 + Math.random() * 40}%` }}
          />
        </td>
      ))}
    </tr>
  );
};

/**
 * Skeleton loader for cards
 */
export const CardSkeleton = ({ className = "" }) => {
  const { isDark } = useTheme();

  return (
    <div
      className={`rounded-lg border p-6 ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } ${className}`}
    >
      <div
        className={`h-6 w-3/4 rounded mb-4 animate-pulse ${
          isDark ? "bg-gray-700" : "bg-gray-200"
        }`}
      />
      <div
        className={`h-4 w-full rounded mb-2 animate-pulse ${
          isDark ? "bg-gray-700" : "bg-gray-200"
        }`}
      />
      <div
        className={`h-4 w-5/6 rounded animate-pulse ${
          isDark ? "bg-gray-700" : "bg-gray-200"
        }`}
      />
    </div>
  );
};

/**
 * Loading button state with spinner
 */
export const LoadingButton = ({
  loading,
  children,
  disabled,
  className = "",
  ...props
}) => {
  const { isDark } = useTheme();

  return (
    <button
      disabled={loading || disabled}
      className={`relative ${className} ${
        loading ? "cursor-not-allowed opacity-75" : ""
      }`}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" />
        </span>
      )}
      <span className={loading ? "invisible" : ""}>{children}</span>
    </button>
  );
};

/**
 * Content placeholder with pulse effect
 */
export const ShimmerPlaceholder = ({ className = "", lines = 3 }) => {
  const { isDark } = useTheme();

  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={`h-4 rounded animate-pulse ${
            isDark ? "bg-gray-700" : "bg-gray-200"
          }`}
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
  );
};

export default {
  Spinner,
  PulsingDots,
  LoadingOverlay,
  TableRowSkeleton,
  CardSkeleton,
  LoadingButton,
  ShimmerPlaceholder,
};
