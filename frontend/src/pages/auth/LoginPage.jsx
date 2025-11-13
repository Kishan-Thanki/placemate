import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { LoadingOverlay } from "../../components/ui/Spinner";
import logoUrl from "../../assets/placemate.png";
import { fetchJSON } from "../../lib/api";
import RoleSelectionModal from "../../components/RoleSelectionModal";
import { login } from "../../lib/auth"; // 🆕 IMPORT THE UPDATED LOGIN FUNCTION

export default function LoginPage() {
  const { toggleTheme, isDark } = useTheme();
  const { login: authLogin } = useAuth(); // 🆕 RENAME TO AVOID CONFLICT
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [mobileGuide, setMobileGuide] = useState(null); // 🆕 ADD MOBILE GUIDE STATE

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setMobileGuide(null); // 🆕 RESET MOBILE GUIDE
    setLoading(true);

    const data = new FormData(e.target);
    const email = data.get("email");
    const password = data.get("password");

    try {
      // 🆕 USE THE UPDATED LOGIN FUNCTION WITH MOBILE DETECTION
      const result = await login(email, password);

      // 🆕 HANDLE MOBILE ISSUE
      if (result.mobileIssue) {
        setMobileGuide({
          browser: result.browser,
          message: result.error
        });
        setLoading(false);
        return;
      }

      if (result.success) {
        if (result.requiresRoleSelection && result.userData?.available_roles) {
          // Store user info from role selection response
          setUserId(result.userData.user_id);
          setUserEmail(result.userData.email || email);
          setAvailableRoles(result.userData.available_roles);
          setShowRoleModal(true);
          setLoading(false);
        } else {
          // Store user info for single role login
          setUserId(result.userData?.user_id || null);
          setUserEmail(result.userData?.email || email);
          handleSuccessfulLogin(result);
        }
      } else {
        setErrorMsg(result.error || "Invalid email or password.");
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg(err.message || "Network error. Please try again later.");
      setLoading(false);
    }
  };

  const handleRoleSelection = async (selectedRole) => {
    setLoading(true);
    setErrorMsg("");

    try {
      const {
        ok,
        message,
        data: result,
      } = await fetchJSON("/api/v1/users/auth/select-role/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          role: selectedRole,
        }),
        credentials: "include",
      });

      if (ok && result?.success) {
        handleSuccessfulLogin(result, selectedRole);
      } else {
        setErrorMsg(message || "Failed to select role.");
        setShowRoleModal(false);
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg(err.message || "Network error during role selection.");
      setShowRoleModal(false);
      setLoading(false);
    }
  };

  const handleSuccessfulLogin = async (result, selectedRole = null) => {
    const activeRole = selectedRole || result.data?.active_role;
    const availableRoles = result.data?.available_roles || [];

    try {
      // Fetch current user details from /me endpoint
      const { ok, data: userResponse } = await fetchJSON("/api/v1/users/me/", {
        method: "GET",
        credentials: "include",
      });

      if (ok && userResponse?.data) {
        const userData = userResponse.data;

        const storedUser = {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name || "",
          middleName: userData.middle_name || "",
          lastName: userData.last_name || "",
          phoneNumber: userData.phone_number || "",
          roles: availableRoles,
          activeRole: activeRole,
        };

        console.log("✅ User data stored:", storedUser);
        authLogin(storedUser);
        setShowRoleModal(false);
        redirectBasedOnRole(activeRole);
      } else {
        // Fallback if /me endpoint fails - use minimal data
        console.warn("⚠️ Failed to fetch user details, using minimal data");
        const storedUser = {
          id: userId,
          email: userEmail,
          firstName: "",
          lastName: "",
          roles: availableRoles,
          activeRole: activeRole,
        };
        authLogin(storedUser);
        setShowRoleModal(false);
        redirectBasedOnRole(activeRole);
      }
    } catch (err) {
      console.error("❌ Error fetching user details:", err);
      // Fallback on error
      const storedUser = {
        id: userId,
        email: userEmail,
        firstName: "",
        lastName: "",
        roles: availableRoles,
        activeRole: activeRole,
      };
      authLogin(storedUser);
      setShowRoleModal(false);
      redirectBasedOnRole(activeRole);
    }
  };

  const redirectBasedOnRole = (role) => {
    const normalizedRole = role?.toLowerCase();

    if (normalizedRole === "admin") navigate("/admin");
    else if (normalizedRole === "student placement cell") navigate("/admin");
    else if (normalizedRole === "student") navigate("/student");
    else navigate("/");
  };

  return (
    <div className="min-h-screen flex items-stretch bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Loading Overlay */}
      {loading && <LoadingOverlay message="Logging in..." />}

      <div className="w-full lg:w-full flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {/* Back to Home button */}
              <Link
                to="/"
                className="px-3 py-1 rounded-md bg-transparent border border-[var(--border-color)] text-[var(--text-secondary)]"
              >
                Back to Home
              </Link>
            </div>

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
              <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md p-2 mb-3 space-y-1">
                {errorMsg.split("\n").map((line, index) => (
                  <div key={index} className="text-center">
                    {line}
                  </div>
                ))}
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
                  Log In
                </button>
              </div>
            </form>
          </div>

          <footer className="mt-6 text-xs text-[var(--text-secondary)] text-center">
            © {new Date().getFullYear()} Placemate
          </footer>
        </div>
      </div>

      {/* 🆕 MOBILE GUIDANCE MODAL */}
      {mobileGuide && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            margin: '20px'
          }}>
            <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>
              Mobile Browser Compatibility
            </h3>
            <p style={{ 
              whiteSpace: 'pre-line',
              margin: '15px 0',
              lineHeight: '1.5'
            }}>
              {mobileGuide.message}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setMobileGuide(null)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                Understand
              </button>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

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