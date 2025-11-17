import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { LoadingOverlay } from "../../components/ui/Spinner";
import logoUrl from "../../assets/placemate.png";
import { fetchJSON } from "../../lib/api";
import RoleSelectionModal from "../../components/RoleSelectionModal";
import { login } from "../../lib/auth";

// 🆕 Helper function to normalize roles (extract name from objects)
const normalizeRole = (role) => {
  if (!role) return null;
  if (typeof role === 'object' && role !== null) {
    return role.name ? String(role.name).toLowerCase() : null;
  }
  return String(role).toLowerCase();
};

// 🆕 Helper function to extract role names from role objects
const extractRoleNames = (roles) => {
  if (!roles || !Array.isArray(roles)) return [];
  return roles.map(role => 
    typeof role === 'object' && role !== null ? role.name : role
  );
};

// 🆕 ADD DEBUG COMPONENT
function DebugAuth() {
  const { user } = useAuth();
  
  React.useEffect(() => {
    console.log("🔍 DEBUG AUTH - Current user:", user);
    console.log("🔍 DEBUG AUTH - LocalStorage user:", localStorage.getItem('user'));
  }, [user]);
  
  return null;
}

export default function LoginPage() {
  const { toggleTheme, isDark } = useTheme();
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [mobileGuide, setMobileGuide] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setMobileGuide(null);
    setLoading(true);

    const data = new FormData(e.target);
    const email = data.get("email");
    const password = data.get("password");

    console.log("🔐 LOGIN START - Email:", email);

    try {
      const result = await login(email, password);

      // 🆕 BETTER LOGGING
      console.log("🔐 LOGIN RESULT:", result);

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
          console.log("🔄 Role selection required, userData:", result.userData);
          setUserId(result.userData.user_id);
          setUserEmail(result.userData.email || email);
          
          // 🆕 Extract role names properly
          const availableRoles = extractRoleNames(result.userData.available_roles);
          setAvailableRoles(availableRoles);
          
          setShowRoleModal(true);
          setLoading(false);
        } else {
          console.log("✅ Single role login, userData:", result.userData);
          // 🎯 FIX: Pass the single role immediately for processing
          let singleRole = result.userData?.available_roles?.[0] || null;
          
          // 🆕 Extract role name if it's an object
          if (singleRole && typeof singleRole === 'object') {
            singleRole = singleRole.name;
          }
          
          setUserId(result.userData?.user_id || null);
          setUserEmail(result.userData?.email || email);
          
          // Pass the determined single role to the successful handler
          handleSuccessfulLogin(result, singleRole);
        }
      } else {
        console.log("❌ Login failed:", result.error);
        setErrorMsg(result.error || "Invalid email or password.");
        setLoading(false);
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setErrorMsg(err.message || "Network error. Please try again later.");
      setLoading(false);
    }
  };

  const handleRoleSelection = async (selectedRole) => {
    console.log("🎯 Role selected:", selectedRole);
    setLoading(true);
    setErrorMsg("");

    try {
      const { ok, message, data: result } = await fetchJSON("/api/v1/users/auth/select-role/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role: selectedRole }),
        credentials: "include",
      });

      console.log("🎯 Role selection response:", { ok, message, result });

      if (ok && result?.success) {
        handleSuccessfulLogin(result, selectedRole);
      } else {
        setErrorMsg(message || "Failed to select role.");
        setShowRoleModal(false);
        setLoading(false);
      }
    } catch (err) {
      console.error("❌ Role selection error:", err);
      setErrorMsg(err.message || "Network error during role selection.");
      setShowRoleModal(false);
      setLoading(false);
    }
  };

  const handleSuccessfulLogin = async (result, selectedRole = null) => {
    console.log("🎯 handleSuccessfulLogin called with:", { result, selectedRole });
    
    try {
      // Fetch current user details from /me endpoint
      const { ok, data: userResponse } = await fetchJSON("/api/v1/users/me/", {
        method: "GET",
        credentials: "include",
      });

      console.log("👤 /me endpoint response:", { ok, userResponse });

      if (ok && userResponse?.data) {
        const userData = userResponse.data;
        console.log("👤 User data from /me:", userData);

        // 🆕 CRITICAL FIX: Extract role names properly from objects
        const availableRoles = extractRoleNames(userData.roles) || 
                              extractRoleNames(result.userData?.available_roles) || 
                              [];

        // 🆕 CRITICAL FIX: Get active role as string, not object
        let activeRoleString = null;
        
        if (selectedRole) {
          // If role was selected, extract name if it's an object
          activeRoleString = typeof selectedRole === 'object' 
            ? selectedRole.name 
            : selectedRole;
        } else if (userData.active_role) {
          // If active_role exists in response, extract the name
          activeRoleString = typeof userData.active_role === 'object' 
            ? userData.active_role.name 
            : userData.active_role;
        } else if (availableRoles.length === 1) {
          // Single role user
          activeRoleString = availableRoles[0];
        } else if (availableRoles.length > 0) {
          // Multiple roles, use first one as default
          activeRoleString = availableRoles[0];
        }

        console.log("🎯 Extracted role data:", {
          availableRoles,
          activeRoleString,
          userActiveRole: userData.active_role
        });

        const storedUser = {
          id: userData.id || userId,
          email: userData.email || userEmail,
          firstName: userData.first_name || "",
          middleName: userData.middle_name || "",
          lastName: userData.last_name || "",
          phoneNumber: userData.phone_number || "",
          roles: availableRoles,
          // 🆕 STORE AS STRING, NOT OBJECT
          activeRole: activeRoleString,
        };

        console.log("✅ FINAL User data to store in AuthContext:", storedUser);
        
        if (!storedUser.roles || storedUser.roles.length === 0) {
          console.error("🚨 CRITICAL: No roles found for user!");
        }
        if (!storedUser.activeRole) {
          console.warn("⚠️ WARNING: No activeRole set for user");
        }

        authLogin(storedUser);
        setShowRoleModal(false);
        redirectBasedOnRole(storedUser.activeRole);
      } else {
        // Fallback case with proper role extraction
        console.warn("⚠️ /me endpoint failed, using fallback");
        
        // 🆕 Extract role names from the login result
        const availableRoles = extractRoleNames(result.userData?.available_roles) || 
                              extractRoleNames(result.data?.user) || [];
        
        let activeRoleString = selectedRole;
        if (activeRoleString && typeof activeRoleString === 'object') {
          activeRoleString = activeRoleString.name;
        }
        if (!activeRoleString && availableRoles.length === 1) {
          activeRoleString = availableRoles[0];
        }

        const storedUser = {
          id: userId,
          email: userEmail,
          firstName: "",
          lastName: "",
          roles: availableRoles,
          activeRole: activeRoleString,
        };
        
        console.log("✅ FALLBACK User data to store:", storedUser);
        authLogin(storedUser);
        setShowRoleModal(false);
        redirectBasedOnRole(storedUser.activeRole);
      }
    } catch (err) {
      console.error("❌ Error in handleSuccessfulLogin:", err);
      // Final error fallback
      const storedUser = {
        id: userId,
        email: userEmail,
        firstName: "",
        lastName: "",
        roles: [],
        activeRole: selectedRole && typeof selectedRole === 'object' ? selectedRole.name : selectedRole,
      };
      
      console.log("✅ ERROR FALLBACK User data to store:", storedUser);
      authLogin(storedUser);
      setShowRoleModal(false);
      redirectBasedOnRole(storedUser.activeRole);
    }
  };

  const redirectBasedOnRole = (role) => {
    // 🆕 ENHANCED: Handle both string and object roles safely
    const normalizedRole = normalizeRole(role);

    console.log("🔄 Redirecting based on role:", { 
      original: role, 
      normalized: normalizedRole 
    });
    
    if (normalizedRole === "admin") {
      console.log("➡️ Redirecting to /admin");
      navigate("/admin");
    } else if (normalizedRole === "student placement cell") {
      console.log("➡️ Redirecting to /admin");
      navigate("/admin");
    } else if (normalizedRole === "student") {
      console.log("➡️ Redirecting to /student");
      navigate("/student");
    } else {
      console.log("➡️ No valid role, redirecting to /");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* 🆕 ADD DEBUG COMPONENT */}
      <DebugAuth />
      
      {/* Loading Overlay */}
      {loading && <LoadingOverlay message="Logging in..." />}

      <div className="w-full lg:w-full flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="px-3 py-1 rounded-md bg-transparent border border-[var(--border-color)] text-[var(--text-secondary)]"
              >
                Back to Home
              </Link>
            </div>

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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </header>
          
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-8 shadow-md">
            <div className="flex flex-col items-center gap-2 mb-4">
              <img src={logoUrl} alt="Placemate Logo" className="h-16 w-16 rounded-xl object-cover shadow-lg" />
              <h2 className="text-2xl font-semibold">Welcome to Placemate</h2>
              <p className="text-sm text-[var(--text-secondary)]">Ready to continue?</p>
            </div>

            {errorMsg && (
              <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md p-2 mb-3 space-y-1">
                {errorMsg.split("\n").map((line, index) => (
                  <div key={index} className="text-center">{line}</div>
                ))}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Email ID</label>
                <input name="email" type="email" required placeholder="Enter your Registered Email" className="w-full border rounded-md px-3 py-2 bg-transparent text-[var(--text-primary)] border-[var(--border-color)]" />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Password</label>
                <input name="password" type="password" required placeholder="Enter your Password" className="w-full border rounded-md px-3 py-2 bg-transparent text-[var(--text-primary)] border-[var(--border-color)]" />
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link to="/auth/forgot" className="text-[var(--text-secondary)]">Forgot Password?</Link>
              </div>

              <div>
                <button type="submit" disabled={loading} className={`w-full rounded-md py-2 font-medium transition-colors text-white flex items-center justify-center gap-2 ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-[var(--primary-500)] hover:bg-[var(--primary-600)] cursor-pointer"
                }`}>
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

      {/* Mobile Guidance Modal */}
      {mobileGuide && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', maxWidth: '400px', margin: '20px' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>Mobile Browser Compatibility</h3>
            <p style={{ whiteSpace: 'pre-line', margin: '15px 0', lineHeight: '1.5' }}>{mobileGuide.message}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setMobileGuide(null)} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>
                Understand
              </button>
              <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
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