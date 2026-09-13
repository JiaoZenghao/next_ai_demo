import { defineConfig, devices } from "@playwright/test";
import { join } from "node:path";

const port = process.env.E2E_PORT || "3100";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm start",
    env: { PORT: port, HOSTNAME: "127.0.0.1", AI_SETTINGS_DIR: join(process.cwd(), ".next", "e2e-settings") },
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
