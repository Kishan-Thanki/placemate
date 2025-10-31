import React, { useState } from "react";
import { fetchJSON } from "../../lib/api";

export default function TestAuth() {
  const [result, setResult] = useState(null);
  const [cookies, setCookies] = useState("");

  const checkAuth = async () => {
    try {
      const response = await fetchJSON("/api/v1/companies/", {
        method: "GET",
        credentials: "include",
      });
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  const checkCookies = () => {
    // Check what's in localStorage
    const user = localStorage.getItem("user");

    // Check browser cookies (won't show httpOnly cookies)
    const allCookies = document.cookie;

    setCookies(`
LocalStorage user: ${user || "None"}

Browser cookies: ${allCookies || "None (httpOnly cookies won't show here)"}

To see all cookies:
1. Open DevTools (F12)
2. Go to Application tab
3. Click Cookies → http://127.0.0.1:3000
    `);
  };

  const testLogin = async () => {
    try {
      const response = await fetchJSON("/api/v1/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com", // Replace with your test credentials
          password: "password123",
        }),
        credentials: "include",
      });
      setResult("Login Response:\n" + JSON.stringify(response, null, 2));

      if (response.ok) {
        alert("Login successful! Now check cookies and try Get Companies.");
      }
    } catch (error) {
      setResult(`Login Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>🔐 Authentication Test Page</h1>

      <div style={{ marginBottom: "20px" }}>
        <h2>Step 1: Check Current State</h2>
        <button
          onClick={checkCookies}
          style={{ padding: "10px", marginRight: "10px" }}
        >
          Check Cookies & Storage
        </button>
        {cookies && (
          <pre
            style={{
              background: "#f5f5f5",
              padding: "10px",
              marginTop: "10px",
            }}
          >
            {cookies}
          </pre>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h2>Step 2: Test Login</h2>
        <button
          onClick={testLogin}
          style={{ padding: "10px", background: "#4CAF50", color: "white" }}
        >
          Test Login (Update credentials in code first!)
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h2>Step 3: Test API Call</h2>
        <button
          onClick={checkAuth}
          style={{ padding: "10px", background: "#2196F3", color: "white" }}
        >
          Get Companies (Should work after login)
        </button>
      </div>

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h3>Result:</h3>
          <pre
            style={{
              background: result.includes("Error") ? "#ffebee" : "#e8f5e9",
              padding: "15px",
              overflow: "auto",
              maxHeight: "400px",
            }}
          >
            {result}
          </pre>
        </div>
      )}

      <div
        style={{
          marginTop: "30px",
          padding: "15px",
          background: "#fff3cd",
          border: "1px solid #ffc107",
        }}
      >
        <h3>📋 Debugging Checklist:</h3>
        <ol>
          <li>Open Browser DevTools (F12)</li>
          <li>
            Go to <strong>Console</strong> tab - look for proxy logs (🔄
            Proxying, 📤 Forwarding cookies, etc.)
          </li>
          <li>
            Go to <strong>Network</strong> tab - check if cookies are in request
            headers
          </li>
          <li>
            Go to <strong>Application</strong> tab → Cookies → Check if cookies
            exist
          </li>
          <li>
            After login, cookies should appear and subsequent API calls should
            include them
          </li>
        </ol>
      </div>
    </div>
  );
}
