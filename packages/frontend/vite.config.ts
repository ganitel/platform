import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite";

// React Router v7 framework mode. SSR is configured via react-router.config.ts.
// `@vitejs/plugin-react` is bundled inside `@react-router/dev/vite`; do not
// register it again here or routes will hot-reload twice and break.
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    allowedHosts: true,
    proxy: {
      // /api/auth/* is handled by better-auth in the React Router SSR process.
      // All other /api/* routes proxy to the FastAPI backend.
      "^/api/(?!auth)": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // The vitest test runner doesn't understand the reactRouter plugin, so swap
  // it out for plain `@vitejs/plugin-react` when running tests.
  plugins: mode === "test" ? [tailwindcss()] : [tailwindcss(), reactRouter()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./client/shared/test/setup.ts",
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**", "**/build/**"],
  },
}));
