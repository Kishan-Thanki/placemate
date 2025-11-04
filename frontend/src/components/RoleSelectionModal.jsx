import React from "react";
import { useTheme } from "../contexts/ThemeContext";

/**
 * RoleSelectionModal component for selecting a role when user has multiple roles
 * @param {Object} props
 * @param {string[]} props.roles - Available roles for the user
 * @param {Function} props.onSelectRole - Callback when a role is selected
 * @param {Function} props.onClose - Callback to close the modal
 * @param {boolean} props.loading - Loading state during role selection
 */
export default function RoleSelectionModal({
  roles = [],
  onSelectRole,
  onClose,
  loading = false,
}) {
  const { isDark } = useTheme();

  const handleRoleClick = (role) => {
    if (!loading) {
      onSelectRole(role);
    }
  };

  const getRoleIcon = (role) => {
    const roleNormalized = role.toLowerCase();
    if (roleNormalized.includes("admin")) {
      return (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      );
    } else if (roleNormalized.includes("placement cell")) {
      return (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
    } else {
      return (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      );
    }
  };

  const getRoleDescription = (role) => {
    const roleNormalized = role.toLowerCase();
    if (roleNormalized.includes("admin")) {
      return "Full access to all administrative features";
    } else if (roleNormalized.includes("placement cell")) {
      return "Manage placement drives and student applications";
    } else if (roleNormalized.includes("student")) {
      return "View drives and manage your applications";
    }
    return "Access role-specific features";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div
        className={`
        relative w-full max-w-md rounded-xl shadow-2xl
        ${isDark ? "bg-gray-800" : "bg-white"}
        transform transition-all
      `}
      >
        {/* Header */}
        <div
          className={`
          px-6 py-4 border-b
          ${isDark ? "border-gray-700" : "border-gray-200"}
        `}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Select Your Role
              </h2>
              <p
                className={`text-sm mt-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                You have access to multiple roles
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className={`
              p-2 rounded-lg transition-colors
              ${
                isDark
                  ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }
              ${loading ? "opacity-50 cursor-not-allowed" : ""}
            `}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Role Options */}
        <div className="px-6 py-6 space-y-3">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => handleRoleClick(role)}
              disabled={loading}
              className={`
              w-full p-4 rounded-lg border-2 transition-all text-left
              flex items-start gap-4 group
              ${
                isDark
                  ? "border-gray-700 hover:border-blue-500 hover:bg-gray-700/50"
                  : "border-gray-200 hover:border-blue-500 hover:bg-blue-50"
              }
              ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
            >
              <div
                className={`
                p-2 rounded-lg
                ${
                  isDark
                    ? "bg-gray-700 text-blue-400 group-hover:bg-blue-900/30"
                    : "bg-gray-100 text-blue-600 group-hover:bg-blue-100"
                }
              `}
              >
                {getRoleIcon(role)}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`font-semibold text-base ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {role}
                </div>
                <div
                  className={`text-sm mt-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {getRoleDescription(role)}
                </div>
              </div>
              <svg
                className={`
                w-5 h-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity
                ${isDark ? "text-blue-400" : "text-blue-600"}
              `}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ))}
        </div>

        {/* Footer */}
        {loading && (
          <div
            className={`
            px-6 py-4 border-t
            ${isDark ? "border-gray-700" : "border-gray-200"}
          `}
          >
            <div className="flex items-center justify-center gap-2 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                Logging in...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
