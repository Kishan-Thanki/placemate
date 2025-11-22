import { fetchJSON } from "./api";

/**
 * Centralized logout utility function
 * Handles API logout call, token cleanup, and local state clearing
 *
 * @param {Function} logoutCallback - The logout function from AuthContext
 * @returns {Promise<void>}
 */
/**
 * Centralized logout utility function
 * Handles API logout call, token cleanup, and local state clearing
 *
 * Note: Tokens are stored as httpOnly cookies by the backend,
 * so they're automatically sent with requests and we don't need
 * to manually add Authorization headers.
 *
 * @param {Function} logoutCallback - The logout function from AuthContext
 * @returns {Promise<void>}
 */
export async function performLogout(logoutCallback) {
  try {
    console.log("🔐 Starting logout process...");

    // Call logout API - uses proxy in development, direct in production
    // Tokens are in httpOnly cookies, sent automatically via credentials: 'include'
    const response = await fetchJSON("/api/v1/logout/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // This is crucial - sends cookies with the request
    });

    console.log("✅ Logout API response:", response);
  } catch (err) {
    console.error("❌ Error logging out from API:", err);
    // Continue with local logout even if API call fails
  } finally {
    // Clear any tokens from localStorage (if they exist)
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    console.log("🧹 Cleared local storage");

    // Use AuthContext logout callback (handles user state and navigation)
    logoutCallback();
  }
}

/**
 * Add Authorization header with access token to API requests
 *
 * @param {Object} headers - Existing headers object
 * @returns {Object} Headers with Authorization added if token exists
 */
export function addAuthHeader(headers = {}) {
  const accessToken = localStorage.getItem("access_token");

  if (accessToken) {
    return {
      ...headers,
      Authorization: `Bearer ${accessToken}`,
    };
  }

  return headers;
}

/**
 * Check if user is authenticated (has valid access token)
 *
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!localStorage.getItem("access_token");
}

/**
 * Get the current access token
 *
 * @returns {string|null}
 */
export function getAccessToken() {
  return localStorage.getItem("access_token");
}

/**
 * Get the current refresh token
 *
 * @returns {string|null}
 */
export function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

/**
 * Clear all authentication tokens
 */
export function clearAuthTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}
