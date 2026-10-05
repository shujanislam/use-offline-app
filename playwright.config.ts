import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// Offline behavior must be tested against a production build:
// `next dev` doesn't prefetch the same way and the Service Worker is disabled.
export default defineConfig({
  testDir: "./e2e",
  // Tests share one in-memory demo backend.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
