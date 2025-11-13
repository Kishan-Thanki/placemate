import { fetchJSON } from "./api";

// Comprehensive mobile device detection
export function isMobileDevice() {
  const userAgent = navigator.userAgent.toLowerCase();
  const mobilePatterns = [
    /android/, /webos/, /iphone/, /ipad/, /ipod/, /blackberry/,
    /windows phone/, /mobile/, /tablet/, /samsung/, /huawei/,
    /xiaomi/, /oppo/, /vivo/, /realme/, /oneplus/, /pixel/
  ];

  return mobilePatterns.some(pattern => pattern.test(userAgent));
}

// Get specific browser info
export function getBrowserInfo() {
  const userAgent = navigator.userAgent;
  let browser = "unknown";

  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
    browser = "chrome";
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    browser = "safari";
  } else if (userAgent.includes("Firefox")) {
    browser = "firefox";
  } else if (userAgent.includes("Edg")) {
    browser = "edge";
  }

  return { browser };
}

/**
 * Provide specific guidance based on browser
 */
function getMobileBrowserGuidance(browser) {
  const guidance = {
    safari: "Safari has strict privacy settings. Please:\n• Use Chrome browser instead\n• Or enable 'Cross-Site Tracking' in Safari Settings\n• Or use 'Request Desktop Website' option",
    chrome: "Chrome mobile may block cookies. Please:\n• Try using incognito mode\n• Or disable 'Block third-party cookies' in settings",
    firefox: "Please try using Chrome browser for best compatibility",
    edge: "Please try using Chrome browser for best compatibility",
    unknown: "Your mobile browser has strict privacy settings. Please:\n• Try using Chrome browser\n• Or use desktop mode\n• Or try on laptop/desktop"
  };

  return guidance[browser] || guidance.unknown;
}

/**
 * Verify that mobile session actually works
 */
async function verifyMobileSession() {
  try {
    const response = await fetchJSON("/api/v1/users/me/");
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Main login function with mobile handling
 */
export async function login(email, password) {
  const isMobile = isMobileDevice();
  const browserInfo = getBrowserInfo();

  console.log("🔐 Login - Mobile:", isMobile, "Browser:", browserInfo.browser);

  // Try normal login first
  const response = await fetchJSON("/api/v1/users/token/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (response.ok) {
    console.log("✅ Login successful");

    // Check if role selection is required
    if (response.data.requires_role_selection) {
      console.log("🔄 Role selection required");
      return {
        success: true,
        requiresRoleSelection: true,
        userData: response.data
      };
    }

    // If mobile, verify the session actually works
    if (isMobile) {
      console.log("📱 Mobile login succeeded, verifying session...");
      const verified = await verifyMobileSession();

      if (!verified) {
        console.log("🔄 Mobile session verification failed");
        return {
          success: false,
          error: getMobileBrowserGuidance(browserInfo.browser),
          mobileIssue: true,
          browser: browserInfo.browser
        };
      }
    }

    return {
      success: true,
      requiresRoleSelection: false,
      userData: response.data
    };
  }

  console.error("❌ Login failed:", response.message);
  return {
    success: false,
    error: response.message
  };
}

/**
 * Handle role selection for multi-role users
 */
export async function selectRole(userId, role) {
  console.log("🎯 Selecting role:", role);

  const response = await fetchJSON("/api/v1/users/auth/select-role/", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, role }),
  });

  if (response.ok) {
    console.log("✅ Role selected successfully");
    return {
      success: true,
      userData: response.data
    };
  }

  console.error("❌ Role selection failed:", response.message);
  return {
    success: false,
    error: response.message
  };
}

/**
 * Centralized logout utility function
 * Handles API logout call and cookie clearing
 */
export async function performLogout(logoutCallback) {
  try {
    console.log("🔐 Starting logout process...");

    // Call logout API - cookies are automatically sent via credentials: 'include'
    const response = await fetchJSON("/api/v1/users/logout/", {
      method: "POST",
    });

    console.log("✅ Logout API response:", response);
  } catch (err) {
    console.error("❌ Error logging out from API:", err);
    // Continue with local logout even if API call fails
  } finally {
    // 🆕 REMOVED: No need to clear localStorage tokens (they don't exist anymore)
    console.log("🧹 Logout process completed");

    // Use AuthContext logout callback (handles user state and navigation)
    if (logoutCallback) {
      logoutCallback();
    }
  }
}

/**
 * 🆕 DEPRECATED - No longer needed with cookie-based auth
 * Tokens are automatically sent via cookies, no manual header management
 */
export function addAuthHeader(headers = {}) {
  console.warn("⚠️ addAuthHeader is deprecated - cookies handle authentication automatically");
  return headers; // Just return headers as-is
}

/**
 * Check if user is authenticated
 * 🆕 UPDATED: With cookies, we can't check tokens directly
 * This should now rely on checking if user data exists in context
 * or making a lightweight API call to verify authentication
 */
export function isAuthenticated() {
  console.warn("⚠️ isAuthenticated can't check cookies directly - use context/user data instead");
  return false; // This should be handled by your AuthContext
}

/**
 * 🆕 DEPRECATED - Tokens are in HTTP-only cookies, not accessible
 */
export function getAccessToken() {
  console.warn("⚠️ getAccessToken is deprecated - tokens are in HTTP-only cookies");
  return null;
}

export function getRefreshToken() {
  console.warn("⚠️ getRefreshToken is deprecated - tokens are in HTTP-only cookies");
  return null;
}

/**
 * 🆕 DEPRECATED - No localStorage tokens to clear
 */
export function clearAuthTokens() {
  console.warn("⚠️ clearAuthTokens is deprecated - tokens are managed by backend cookies");
  // No action needed - cookies are cleared by backend on logout
}

/**
 * 🆕 NEW: Verify authentication by making a lightweight API call
 */
export async function verifyAuthentication() {
  try {
    const response = await fetchJSON("/api/v1/users/me/");
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * 🆕 NEW: Refresh token (handled automatically by browser)
 * The browser will automatically send refresh_token cookie
 * when access_token expires and backend handles rotation
 */
export async function refreshToken() {
  try {
    const response = await fetchJSON("/api/v1/users/token/refresh/", {
      method: "POST",
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}