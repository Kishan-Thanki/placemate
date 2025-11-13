// Centralized API helpers
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
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function fetchJSON(path, options = {}) {
  const url = path.startsWith("http") ? path : buildUrl(path);
  console.log("Fetching URL:", url);

  const finalOptions = {
    credentials: 'include', // Critical for cookie-based auth
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Safe logging that handles FormData
  const bodyLog = finalOptions.body
    ? finalOptions.body instanceof FormData
      ? "[FormData]"
      : JSON.parse(finalOptions.body)
    : null;

  console.log("Request options:", {
    method: finalOptions.method || "GET",
    headers: finalOptions.headers,
    hasBody: !!finalOptions.body,
    body: bodyLog,
    credentials: finalOptions.credentials,
  });

  const res = await fetch(url, finalOptions);

  // Check for authentication errors
  if (res.status === 401) {
    console.error("401 Unauthorized - Token expired or invalid");
    if (authErrorHandler) {
      authErrorHandler();
    }
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  // Extract clean message from response
  let message = null;
  if (data) {
    if (typeof data === "string") {
      message = data;
    } else if (data.errors && typeof data.errors === "object") {
      // ValidationErrorResponse format
      message = Object.entries(data.errors)
        .map(([, msgs]) => {
          const messages = Array.isArray(msgs) ? msgs : [msgs];
          return messages.join("\n");
        })
        .join("\n");
    } else if (data.password && Array.isArray(data.password)) {
      message = data.password.join("\n");
    } else if (data.token && Array.isArray(data.token)) {
      message = data.token.join("\n");
    } else if (data.email && Array.isArray(data.email)) {
      message = data.email.join("\n");
    } else if (data.detail) {
      message = data.detail;
    } else if (data.message) {
      message = data.message;
    } else if (data.error) {
      message = data.error;
    } else {
      // Extract all field errors
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

  console.log("API Response:", {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    extractedMessage: message,
    rawData: data,
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