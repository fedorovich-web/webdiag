
import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:4183";
const upstream = "http://127.0.0.1:4184";

export default defineConfig({
  testDir: "./e2e-owner",
  workers: 1,
  reporter: "line",
  outputDir: "../../.webdiag/owner-test-results",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
  },
  webServer: [
    {
      command: "node ../../scripts/run-python.mjs apps/api/tests/fixtures/owner_admin_demo.py",
      url: upstream + "/health",
      reuseExistingServer: false,
    },
    {
      command: "npm run start",
      url: baseURL,
      reuseExistingServer: false,
      env: {
        PORT: "4183",
        HOSTNAME: "127.0.0.1",
        WEBDIAG_API_INTERNAL_URL: upstream,
        WEBDIAG_ACCOUNT_PUBLIC_ORIGIN: baseURL,
        RESEND_API_KEY: "",
      },
    },
  ],
});
