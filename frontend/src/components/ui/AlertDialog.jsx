import React from "react";
import { X, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

export function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "info",
  confirmText = "OK",
  cancelText = "Cancel",
  showCancel = false,
}) {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle className="w-12 h-12 text-green-500" />,
    error: <XCircle className="w-12 h-12 text-red-500" />,
    warning: <AlertTriangle className="w-12 h-12 text-yellow-500" />,
    info: <Info className="w-12 h-12 text-blue-500" />,
    confirm: <AlertTriangle className="w-12 h-12 text-orange-500" />,
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div
        className={`
          relative w-full max-w-md rounded-xl shadow-2xl animate-scaleIn
          ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white"}
        `}
      >
        {/* Close button */}
        <button
          onClick={handleCancel}
          className={`
            absolute top-4 right-4 p-1 rounded-lg transition-colors
            ${isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}
          `}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6 pt-8">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {icons[type]}
          </div>

          {/* Title */}
          {title && (
            <h3
              className={`
                text-xl font-bold text-center mb-3
                ${isDark ? "text-white" : "text-gray-900"}
              `}
            >
              {title}
            </h3>
          )}

          {/* Message */}
          <p
            className={`
              text-center text-sm leading-relaxed
              ${isDark ? "text-gray-300" : "text-gray-600"}
            `}
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className={`
          flex gap-3 p-6 pt-0
          ${showCancel || type === "confirm" ? "justify-center" : "justify-center"}
        `}>
          {(showCancel || type === "confirm") && (
            <button
              onClick={handleCancel}
              className={`
                px-6 py-2.5 rounded-lg font-medium transition-all min-w-[100px]
                ${isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                }
              `}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`
              px-6 py-2.5 rounded-lg font-medium transition-all min-w-[100px]
              ${type === "error" || type === "confirm"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : type === "success"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : type === "warning"
                ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
              }
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for easy alert/confirm usage
 */
export function useAlert() {
  const [alertState, setAlertState] = React.useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "OK",
    cancelText: "Cancel",
    onConfirm: null,
  });

  const showAlert = ({ type = "info", title, message, confirmText = "OK" }) => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        type,
        title,
        message,
        confirmText,
        cancelText: "Cancel",
        onConfirm: () => {
          resolve(true);
        },
      });
    });
  };

  const showConfirm = ({
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "confirm",
  }) => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        type,
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: () => {
          resolve(true);
        },
      });
    });
  };

  const closeAlert = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  };

  const AlertComponent = () => (
    <AlertDialog
      isOpen={alertState.isOpen}
      onClose={closeAlert}
      onConfirm={alertState.onConfirm}
      type={alertState.type}
      title={alertState.title}
      message={alertState.message}
      confirmText={alertState.confirmText}
      cancelText={alertState.cancelText}
      showCancel={alertState.type === "confirm"}
    />
  );

  return { showAlert, showConfirm, AlertComponent };
}
