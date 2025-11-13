import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load env variables from `.env` files
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    
    // 🆕 UNIVERSAL SPA CONFIGURATION - Works everywhere
    build: {
      // Ensure clean build output
      outDir: 'dist',
      // Generate source maps for debugging
      sourcemap: true,
      // Optimize build for production
      minify: 'esbuild',
      // Rollup configuration for SPA
      rollupOptions: {
        input: './index.html',
        output: {
          // Better chunking for performance
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['lucide-react']
          }
        }
      }
    },
    
    // 🆕 PREVIEW SERVER CONFIG - Critical for production hosting
    preview: {
      host: true,
      port: parseInt(env.VITE_PORT) || 3000,
      // 🎯 CRITICAL: Serve index.html for all routes (SPA behavior)
      historyApiFallback: {
        disableDotRule: true,
        rewrites: [
          { from: /\/api\/.*/, to: '' }, // Don't rewrite API calls
          { from: /./, to: '/index.html' } // Rewrite everything else to index.html
        ]
      },
      // Enable CORS for all origins in preview
      cors: true,
      // Proxy configuration for preview mode
      proxy: {
        "/api": {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path,
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              console.log("🔄 Preview Proxying:", req.method, req.url);
              if (req.headers.cookie) {
                proxyReq.setHeader("cookie", req.headers.cookie);
              }
            });
            proxy.on("proxyRes", (proxyRes, req, res) => {
              const cookies = proxyRes.headers["set-cookie"];
              if (cookies) {
                proxyRes.headers["set-cookie"] = cookies.map((cookie) => {
                  return cookie
                    .replace(/; Secure/gi, "")
                    .replace(/; SameSite=None/gi, "; SameSite=Lax")
                    .replace(/; SameSite=Strict/gi, "; SameSite=Lax");
                });
              }
            });
          },
        },
      },
    },

    // DEVELOPMENT SERVER CONFIG
    server: {
      host: env.VITE_HOST || "127.0.0.1",
      port: parseInt(env.VITE_PORT) || 3000,
      // 🆕 SPA fallback for development
      historyApiFallback: {
        disableDotRule: true,
        rewrites: [
          { from: /\/api\/.*/, to: '' },
          { from: /./, to: '/index.html' }
        ]
      },
      // Development proxy configuration
      proxy: {
        "/api": {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path,
          // Forward cookies between frontend and backend
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              // Log for debugging
              console.log("🔄 Dev Proxying:", req.method, req.url);

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

    // 🆕 OPTIMIZATION CONFIG
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom']
    },
    
    // 🆕 ENVIRONMENT VARIABLES CONFIG
    define: {
      'process.env': {}
    }
  };
});