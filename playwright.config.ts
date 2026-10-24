import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const URL = `http://localhost:${PORT}`;

/**
 * Browser suite (PLAYBOOK §15) against a PRODUCTION build with its own throwaway
 * database (.data/e2e), seeded with the demo preset. Never touches dev data.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: URL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm seed:reset && pnpm build && pnpm start -p ${PORT}`,
    url: `${URL}/api/health`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      PGLITE_DIR: ".data/e2e",
      UPLOAD_DIR: ".data/e2e-uploads",
      APP_URL: URL,
      BETTER_AUTH_URL: URL,
      BETTER_AUTH_SECRET: "e2e-only-secret-not-used-anywhere-else-0123456789",
      // The suite signs in many times from one IP; production keeps the 5/min default.
      AUTH_RATE_LIMIT: "1000",
      // Sign-up needs a verified email (D-010); the suite reads links from the local mail sink.
      MAIL_SINK: "1",
    },
  },
});
