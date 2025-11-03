import { fetchJSON } from "../lib/api";

/**
 * Authentication Service
 * Handles all API calls related to authentication operations
 */

const AUTH_ENDPOINT = "/api/v1";

export const authService = {
  /**
   * Request password reset email
   * @param {string} email - User's email address
   * @returns {Promise<Object>} Response from the API
   */
  requestPasswordReset: async (email) => {
    try {
      const { ok, data, status } = await fetchJSON(
        `${AUTH_ENDPOINT}/password-reset/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(
          data?.detail || 
          data?.message || 
          `Failed to send password reset email (${status})`
        );
      }

      console.log("✅ Password reset email sent:", data);
      return data;
    } catch (error) {
      console.error("❌ Password reset request failed:", error);
      throw error;
    }
  },

  /**
   * Confirm password reset with token
   * @param {string} token - Reset token from email
   * @param {string} password - New password
   * @returns {Promise<Object>} Response from the API
   */
  confirmPasswordReset: async (token, password) => {
    try {
      const { ok, data, status } = await fetchJSON(
        `${AUTH_ENDPOINT}/password-reset/confirm/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, password }),
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(
          data?.detail || 
          data?.message || 
          data?.password?.[0] ||
          `Failed to reset password (${status})`
        );
      }

      console.log("✅ Password reset successful:", data);
      return data;
    } catch (error) {
      console.error("❌ Password reset confirmation failed:", error);
      throw error;
    }
  },

  /**
   * Validate password reset token
   * @param {string} token - Reset token from email
   * @returns {Promise<Object>} Response from the API
   */
  validatePasswordResetToken: async (token) => {
    try {
      const { ok, data, status } = await fetchJSON(
        `${AUTH_ENDPOINT}/password-reset/validate_token/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
          credentials: "include",
        }
      );

      if (!ok) {
        throw new Error(
          data?.detail || 
          data?.message || 
          `Invalid or expired token (${status})`
        );
      }

      console.log("✅ Token is valid:", data);
      return data;
    } catch (error) {
      console.error("❌ Token validation failed:", error);
      throw error;
    }
  },
};

export default authService;
