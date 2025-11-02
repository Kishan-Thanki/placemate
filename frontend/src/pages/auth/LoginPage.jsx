import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import logoUrl from "../../assets/placemate.png";
import { fetchJSON } from "../../lib/api";
import RoleSelectionModal from "../../components/RoleSelectionModal";

export default function LoginPage() {
  const { toggleTheme, isDark } = useTheme();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const data = new FormData(e.target);
    const email = data.get("email");
    const password = data.get("password");

    try {
      const { ok, data: result } = await fetchJSON("/api/v1/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Important for cookies
      });

      console.log("🔍 Login API Full Response:", { ok, result });

      if (ok && result?.success) {
        console.log("🔍 Login API Response:", result);

        // Check if role selection is required
        if (
          result.data?.requires_role_selection &&
          result.data?.available_roles
        ) {
          // Multiple roles - show role selection modal
          setUserId(result.data.user_id);
          setUserEmail(result.data.email);
          setAvailableRoles(result.data.available_roles);
          setShowRoleModal(true);
          setLoading(false);
        } else {
          // Single role - direct login
          // For single role, backend doesn't return user_id/email in response
          // We need to use the email from the form
          setUserId(null); // Backend doesn't provide this for single role
          setUserEmail(email); // Use the email from login form
          handleSuccessfulLogin(result);
        }
      } else {
        console.error("❌ Login failed:", result);
        setErrorMsg(
          result?.message || result?.error || "Invalid email or password."
        );
        setLoading(false);
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setErrorMsg("Network error. Please try again later.");
      setLoading(false);
    }
  };

  const handleRoleSelection = async (selectedRole) => {
    setLoading(true);
    setErrorMsg("");

    try {
      const { ok, data: result } = await fetchJSON(
        "/api/v1/users/auth/select-role/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            role: selectedRole,
          }),
          credentials: "include", // Important for cookies
        }
      );

      if (ok && result?.success) {
        console.log("🔍 Role Selection API Response:", result);
        handleSuccessfulLogin(result, selectedRole);
      } else {
        setErrorMsg(result?.message || "Failed to select role.");
        setShowRoleModal(false);
        setLoading(false);
      }
    } catch (err) {
      console.error("Role selection error:", err);
      setErrorMsg("Network error during role selection.");
      setShowRoleModal(false);
      setLoading(false);
    }
  };

  const handleSuccessfulLogin = (result, selectedRole = null) => {
    console.log("📝 handleSuccessfulLogin called with:", {
      result,
      selectedRole,
    });

    // Extract user data and tokens
    const activeRole = selectedRole || result.data?.active_role;
    const availableRoles = result.data?.available_roles || [];

    // Note: result.data.user is an array of role objects, not user data
    // User info was captured during initial login or role selection
    console.log("🔍 Extracted data:", {
      activeRole,
      availableRoles,
      userId,
      userEmail,
    });

    // Note: Tokens are stored as httpOnly cookies by the backend
    // They are NOT in the response and cannot be accessed by JavaScript
    // This is more secure - cookies are automatically sent with each request
    console.log(
      "✅ Tokens are stored as httpOnly cookies (not accessible via JS)"
    );

    // Prepare user object using the email and userId captured during login
    const storedUser = {
      id: userId,
      email: userEmail,
      firstName: result.data?.first_name || "", // May not be in response
      lastName: result.data?.last_name || "", // May not be in response
      roles: availableRoles,
      activeRole: activeRole,
    };

    console.log("👤 Stored user object:", storedUser);

    // Use AuthContext login
    login(storedUser);

    // Close modal if open
    setShowRoleModal(false);

    // Navigate based on active role
    redirectBasedOnRole(activeRole);
  };

  const redirectBasedOnRole = (role) => {
    const normalizedRole = role?.toLowerCase();

    if (normalizedRole === "admin") {
      navigate("/admin");
    } else if (normalizedRole === "student placement cell") {
      // Temporary: redirect to admin dashboard (same as admin)
      navigate("/admin");
    } else if (normalizedRole === "student") {
      navigate("/student");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="w-full lg:w-full flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <header className="flex items-center justify-between mb-6">
            {/* Theme toggle button */}
            <button
              onClick={toggleTheme}
              className={`
                absolute top-4 right-4 p-3 rounded-lg transition-colors cursor-pointer
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
            <div className="flex flex-col items-center gap-2 mb-4">
              <img
                src={logoUrl}
                alt="Placemate Logo"
                className="h-16 w-16 rounded-xl object-cover shadow-lg"
              />
              <h2 className="text-2xl font-semibold">Welcome to Placemate</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Ready to continue?
              </p>
            </div>

            {errorMsg && (
              <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md p-2 mb-3 text-center">
                {errorMsg}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">
                  Email ID
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Enter your Registered Email"
                  className="w-full border rounded-md px-3 py-2 bg-transparent text-[var(--text-primary)] border-[var(--border-color)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Enter your Password"
                  className="w-full border rounded-md px-3 py-2 bg-transparent text-[var(--text-primary)] border-[var(--border-color)]"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link
                  to="/auth/forgot"
                  className="text-[var(--text-secondary)]"
                >
                  Forgot Password?
                </Link>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full rounded-md py-2 font-medium transition-colors text-white flex items-center justify-center gap-2
                    ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-[var(--primary-500)] hover:bg-[var(--primary-600)] cursor-pointer"
                    }
                  `}
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  )}
                  {loading ? "Logging in..." : "Log In"}
                </button>
              </div>
            </form>
          </div>

          <footer className="mt-6 text-xs text-[var(--text-secondary)] text-center">
            © {new Date().getFullYear()} Placemate
          </footer>
        </div>
      </div>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <RoleSelectionModal
          roles={availableRoles}
          onSelectRole={handleRoleSelection}
          onClose={() => {
            setShowRoleModal(false);
            setLoading(false);
          }}
          loading={loading}
        />
      )}
    </div>
  );
}
