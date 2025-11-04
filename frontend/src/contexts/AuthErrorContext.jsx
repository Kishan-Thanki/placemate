import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { setAuthErrorHandler } from "../lib/api";
import SessionExpiredModal from "../components/auth/SessionExpiredModal";
import AccessDeniedModal from "../components/auth/AccessDeniedModal";

const AuthErrorContext = createContext();

export const useAuthError = () => {
  const context = useContext(AuthErrorContext);
  if (!context) {
    throw new Error("useAuthError must be used within AuthErrorProvider");
  }
  return context;
};

export const AuthErrorProvider = ({ children }) => {
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  const handleAuthError = useCallback(() => {
    console.log(
      "🚨 Authentication error detected - showing session expired modal"
    );
    setShowSessionExpired(true);
  }, []);

  const handleAccessDenied = useCallback(() => {
    console.log("🚫 Access denied - showing access denied modal");
    setShowAccessDenied(true);
  }, []);

  const closeSessionExpiredModal = useCallback(() => {
    setShowSessionExpired(false);
  }, []);

  const closeAccessDeniedModal = useCallback(() => {
    setShowAccessDenied(false);
  }, []);

  // Register the auth error handler with the API module
  useEffect(() => {
    setAuthErrorHandler(handleAuthError);
    console.log("✅ Auth error handler registered with API");
  }, [handleAuthError]);

  return (
    <AuthErrorContext.Provider value={{ handleAuthError, handleAccessDenied }}>
      {children}
      <SessionExpiredModal
        isOpen={showSessionExpired}
        onClose={closeSessionExpiredModal}
      />
      <AccessDeniedModal
        isOpen={showAccessDenied}
        onClose={closeAccessDeniedModal}
      />
    </AuthErrorContext.Provider>
  );
};
