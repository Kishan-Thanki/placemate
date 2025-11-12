import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load env variables from `.env` files
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      host: env.VITE_HOST || "127.0.0.1",
      port: parseInt(env.VITE_PORT) || 3000,
      proxy: {
        // Proxy API requests to Render backend
        "/api": {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path,
          // Forward cookies between frontend and backend
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              // Log for debugging
              console.log("🔄 Proxying:", req.method, req.url);

              // Ensure cookies are forwarded to backend
              if (req.headers.cookie) {
                proxyReq.setHeader("cookie", req.headers.cookie);
                console.log(
                  "📤 Forwarding cookies to backend:",
                  req.headers.cookie
                );
              }
            });

            proxy.on("proxyRes", (proxyRes, req, res) => {
              // Forward Set-Cookie headers from backend to frontend
              const cookies = proxyRes.headers["set-cookie"];
              if (cookies) {
                console.log("📥 Received cookies from backend:", cookies);
                proxyRes.headers["set-cookie"] = cookies.map((cookie) => {
                  // Fix cookies for local development:
                  // 1. Remove Secure flag (http:// doesn't support it)
                  // 2. Change SameSite=None to SameSite=Lax (more permissive in dev)
                  // 3. Keep other attributes
                  return cookie
                    .replace(/; Secure/gi, "")
                    .replace(/; SameSite=None/gi, "; SameSite=Lax")
                    .replace(/; SameSite=Strict/gi, "; SameSite=Lax");
                });
                console.log(
                  "✅ Modified cookies for frontend:",
                  proxyRes.headers["set-cookie"]
                );
              }
            });
          },
        },
      },
    },
  };
});
