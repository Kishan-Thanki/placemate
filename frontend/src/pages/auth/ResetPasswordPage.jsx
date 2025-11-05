import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { LoadingOverlay } from "../../components/ui/Spinner";
import logoUrl from "../../assets/placemate.png";
import { authService } from "../../services/authService";

export default function ResetPasswordPage() {
  const { toggleTheme, isDark } = useTheme();
  const { token } = useParams(); // Extract token from URL params

  const [changed, setChanged] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Invalid reset link. Please request a new password reset.");
        setValidatingToken(false);
        setTokenValid(false);
        return;
      }

      try {
        await authService.validatePasswordResetToken(token);
        setTokenValid(true);
        setValidatingToken(false);
      } catch (err) {
        console.error("❌ Token validation failed:", err);
        setError(
          "This reset link is invalid or has expired. Please request a new password reset."
        );
        setTokenValid(false);
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const data = new FormData(e.target);
    const password = data.get("password");
    const confirm = data.get("confirm");

    console.log("🔐 Password reset form submission:", {
      token: token,
      tokenLength: token?.length,
      passwordLength: password?.length,
      passwordsMatch: password === confirm,
    });

    // Client-side validation
    if (!password || password.length < 8) {
      setError("Password should be at least 8 characters");
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await authService.confirmPasswordReset(token, password);
      console.log("✅ Password reset successful");
      setChanged(true);
    } catch (err) {
      console.error("❌ Password reset failed:", err);
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Loading Overlay */}
      {(loading || validatingToken) && (
        <LoadingOverlay
          message={
            validatingToken
              ? "Validating reset link..."
              : "Resetting password..."
          }
        />
      )}

      <div className="w-full lg:w-full flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <header className="flex items-center justify-between mb-6">
            {/* Theme toggle button */}
            <button
              onClick={toggleTheme}
              className={`
          absolute top-4 right-4 p-3 rounded-lg transition-colors
          ${
            isDark
              ? "text-gray-300 hover:text-white hover:bg-gray-700"
              : "text-gray-600 hover:text-gray-900 hover:bg-white"
          }
        `}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
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
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
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
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          </header>

          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-8 shadow-md">
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="rounded-full p-0.5 flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt="Placemate Logo"
                  className="h-16 w-16 rounded-xl object-cover shadow-lg"
                />
              </div>
              <h2 className="text-2xl font-semibold">Reset your password</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Choose a new password for your account.
              </p>
            </div>

            {validatingToken ? (
              // Show loading state while validating token
              <div className="flex flex-col items-center justify-center py-8">
                <svg
                  className="animate-spin h-8 w-8 text-[var(--primary-500)]"
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
                <p className="mt-4 text-sm text-[var(--text-secondary)]">
                  Validating reset link...
                </p>
              </div>
            ) : !tokenValid ? (
              // Show error if token is invalid
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error || "This reset link is invalid or has expired."}
                </div>
                <Link
                  to="/auth/forgot"
                  className="block w-full text-center bg-[var(--primary-500)] hover:bg-[var(--primary-600)] text-white rounded-md py-2 font-medium transition-colors"
                >
                  Request New Reset Link
                </Link>
              </div>
            ) : !changed ? (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm space-y-1">
                    {error.split("\n").map((line, index) => (
                      <div key={index}>{line}</div>
                    ))}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">
                    New Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    disabled={loading}
                    placeholder="Enter new password (min 8 characters)"
                    className="w-full border rounded-md px-3 py-2 bg-transparent text-[var(--text-primary)] border-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">
                    Confirm Password
                  </label>
                  <input
                    name="confirm"
                    type="password"
                    required
                    disabled={loading}
                    placeholder="Confirm new password"
                    className="w-full border rounded-md px-3 py-2 bg-transparent text-[var(--text-primary)] border-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[var(--primary-500)] hover:bg-[var(--primary-600)] text-white rounded-md py-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Reset Password
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] text-center">
                <p className="font-medium">Password changed successfully</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  You can now log in with your new password.
                </p>
                <div className="mt-4">
                  <Link
                    to="/auth/login"
                    className="inline-block px-4 py-2 bg-[var(--primary-500)] text-white rounded-md"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            )}
          </div>

          <footer className="mt-6 text-xs text-[var(--text-secondary)] text-center">
            © {new Date().getFullYear()} Placemate
          </footer>
        </div>
      </div>
    </div>
  );
}
