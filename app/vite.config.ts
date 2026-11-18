import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Same-origin /api keeps the session cookie first-party in development.
    proxy: {
      "/api": {
        changeOrigin: true,
        target: process.env.API_ORIGIN ?? "http://127.0.0.1:8788",
      },
    },
  },
});
