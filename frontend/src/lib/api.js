// Centralized API helpers
// Use empty string in development to use proxy, or full URL in production
const API_BASE = import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL || "";

// Global handler for authentication errors
let authErrorHandler = null;

export function setAuthErrorHandler(handler) {
  authErrorHandler = handler;
}

export function getApiBase() {
  return API_BASE.replace(/\/+$/, "");
}

export function buildUrl(path) {
  const base = getApiBase();
  if (!path) return base;
  // Ensure path starts with /
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function fetchJSON(path, options = {}) {
  const url = path.startsWith("http") ? path : buildUrl(path);
  console.log("🌐 Fetching URL:", url);

  // Ensure credentials are included by default for cookie-based auth
  const fetchOptions = {
    credentials: 'include',
    ...options,
  };

  // Safe logging that handles FormData
  const bodyLog = fetchOptions.body
    ? fetchOptions.body instanceof FormData
      ? "[FormData]"
      : JSON.parse(fetchOptions.body)
    : null;

  console.log("📤 Request options:", {
    method: fetchOptions.method || "GET",
    headers: fetchOptions.headers,
    credentials: fetchOptions.credentials,
    hasBody: !!fetchOptions.body,
    body: bodyLog,
  });

  // Debug: Log cookies being sent (helps debug auth issues)
  console.log("🍪 Current cookies:", document.cookie || "(none)");

  const res = await fetch(url, fetchOptions);

  // Check for authentication errors (401 Unauthorized)
  // Only handle 401 if it's not a login/logout/password-reset endpoint
  if (res.status === 401 && 
      !path.includes('/login') && 
      !path.includes('/logout') && 
      !path.includes('/password-reset')) {
    console.error("🚨 401 Unauthorized - Session expired");
    if (authErrorHandler) {
      authErrorHandler();
    }
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // If response isn’t JSON (e.g. empty body)
    data = null;
  }

  // Try to extract a clean message from response
  let message = null;
  if (data) {
    if (typeof data === "string") {
      message = data;
    } else if (data.errors && typeof data.errors === "object") {
      // PRIORITY 1: Placemate ValidationErrorResponse format with specific field errors
      // { errors: { password: ["error1", "error2"], email: ["error3"] } }
      message = Object.entries(data.errors)
        .map(([, msgs]) => {
          const messages = Array.isArray(msgs) ? msgs : [msgs];
          return messages.join("\n");
        })
        .join("\n");
    } else if (data.password && Array.isArray(data.password)) {
      // PRIORITY 2: django-rest-passwordreset specific format for password errors
      message = data.password.join("\n");
    } else if (data.token && Array.isArray(data.token)) {
      // PRIORITY 3: django-rest-passwordreset specific format for token errors
      message = data.token.join("\n");
    } else if (data.email && Array.isArray(data.email)) {
      // PRIORITY 4: django-rest-passwordreset specific format for email errors
      message = data.email.join("\n");
    } else if (data.detail) {
      // PRIORITY 5: DRF default error format
      message = data.detail;
    } else if (data.message) {
      // PRIORITY 6: Placemate custom API response format (generic message)
      message = data.message;
    } else if (data.error) {
      // PRIORITY 7: Generic error field
      message = data.error;
    } else {
      // LAST RESORT: try to extract all field errors
      const fieldErrors = Object.entries(data)
        .filter(
          ([key]) =>
            !["success", "timestamp", "data", "error_code"].includes(key)
        )
        .map(([, value]) => {
          if (Array.isArray(value)) {
            return value.join("\n");
          }
          return String(value);
        })
        .filter(Boolean);

      if (fieldErrors.length > 0) {
        message = fieldErrors.join("\n");
      }
    }
  }

  console.log("📥 API Response:", {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    extractedMessage: message,
    rawData: data,
    rawDataString: JSON.stringify(data, null, 2),
  });

  return {
    ok: res.ok,
    status: res.status,
    message,
    data,
  };
}

export default {
  getApiBase,
  buildUrl,
  fetchJSON,
  setAuthErrorHandler,
};
