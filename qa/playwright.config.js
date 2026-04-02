import { defineConfig } from "@playwright/test";

const frontendBaseUrl = process.env.FRONTEND_BASE_URL || "http://127.0.0.1:5173";

export default defineConfig({
  testDir: "./ui",
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL: frontendBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
});
