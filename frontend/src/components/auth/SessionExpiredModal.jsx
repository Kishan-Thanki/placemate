import { useNavigate } from "react-router-dom";
import { AlertCircle, LogIn } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { Button } from "../ui/Button";

const SessionExpiredModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleLogin = () => {
    // Clear all localStorage
    localStorage.clear();

    // Clear all sessionStorage
    sessionStorage.clear();

    // Clear specific auth items (redundant but explicit)
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    console.log("🧹 Cleared all cache and auth data");

    // Force page reload to clear any in-memory state, then redirect
    window.location.href = "/auth/login";

    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - blocks all interactions */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        onClick={(e) => e.stopPropagation()} // Prevent click-through
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          className={`w-full max-w-md rounded-lg shadow-2xl ${
            isDark ? "bg-gray-800" : "bg-white"
          } p-6 animate-in fade-in zoom-in duration-200`}
        >
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div
              className={`p-4 rounded-full ${
                isDark ? "bg-red-900/30" : "bg-red-100"
              }`}
            >
              <AlertCircle
                size={48}
                className={isDark ? "text-red-400" : "text-red-600"}
              />
            </div>
          </div>

          {/* Title */}
          <h2
            className={`text-2xl font-bold text-center mb-2 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Session Expired
          </h2>

          {/* Message */}
          <p
            className={`text-center mb-6 ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Your session has expired or authentication is required. Please log
            in again to continue.
          </p>

          {/* Login Button */}
          <Button onClick={handleLogin} variant="primary" className="w-full">
            <LogIn size={20} className="mr-2" />
            Go to Login
          </Button>
        </div>
      </div>
    </>
  );
};

export default SessionExpiredModal;
