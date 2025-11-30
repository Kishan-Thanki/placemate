import { fetchJSON } from "../lib/api";



const AUTH_ENDPOINT = "/api/v1";

export const authService = {
 
  requestPasswordReset: async (email) => {
  try {
    console.log("🔄 Requesting password reset for:", email);

    const { ok, message, status, raw } = await fetchJSON(
      `${AUTH_ENDPOINT}/password-reset/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      }
    );

    console.log("📥 Password reset response:", { ok, status, message, raw });

    if (!ok) {
      const errorMessage =
        message || `Failed to send password reset email (${status})`;
      throw new Error(errorMessage);
    }

    console.log("✅ Password reset email sent successfully!");
    return { message: message || "Reset email sent successfully" };
  } catch (error) {
    console.error("❌ Password reset request failed:", error);
    throw error; // Pass error to UI
  }
},



 
  confirmPasswordReset: async (token, newPassword) => {
  try {
    console.log("🔄 Confirming password reset with token:", token);

    const { ok, message, status, data } = await fetchJSON(
      `${AUTH_ENDPOINT}/password-reset/confirm/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword }),
        credentials: "include",
      }
    );

    console.log("📥 Confirm reset response:", { ok, status, message, data });

    if (!ok) {
      throw new Error(message || `Password reset failed (${status})`);
    }

    return data;
  } catch (error) {
    console.error("❌ Password reset confirmation failed:", error);
    throw error;
  }
},


  
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
        console.error("❌ Token validation failed - Full data:", data);
        
        let errorMessage = null;
        if (data) {
          if (data.token && Array.isArray(data.token)) {
            errorMessage = data.token.join('\n');
          } else if (data.token && typeof data.token === 'string') {
            errorMessage = data.token;
          } else if (data.detail) {
            errorMessage = data.detail;
          } else if (data.message) {
            errorMessage = data.message;
          }
        }
        
        throw new Error(errorMessage || `Invalid or expired token (${status})`);
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
