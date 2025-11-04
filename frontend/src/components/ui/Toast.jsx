import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const Toast = ({ message, type = "success", duration = 3000, onClose }) => {
  const { isDark } = useTheme();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} className="text-green-500" />;
      case "error":
        return <XCircle size={20} className="text-red-500" />;
      case "warning":
        return <AlertCircle size={20} className="text-yellow-500" />;
      default:
        return <CheckCircle size={20} className="text-blue-500" />;
    }
  };

  const getStyles = () => {
    const baseStyles = `rounded-lg shadow-lg border ${
      isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    }`;

    return baseStyles;
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <div
        className={`${getStyles()} flex items-center gap-3 px-4 py-3 min-w-[300px] max-w-md`}
      >
        {getIcon()}
        <p
          className={`flex-1 text-sm font-medium ${
            isDark ? "text-gray-200" : "text-gray-800"
          }`}
        >
          {message}
        </p>
        <button
          onClick={handleClose}
          className={`p-1 rounded hover:bg-opacity-10 transition-colors ${
            isDark
              ? "text-gray-400 hover:bg-gray-600"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// Toast container component to manage multiple toasts
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
};

export default Toast;
