import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright/tests",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --port 8080 --strictPort",
    port: 8080,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
