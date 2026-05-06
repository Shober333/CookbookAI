/**
 * Playwright Configuration
 *
 * Docs: https://playwright.dev/docs/test-configuration
 *
 * Usage:
 *   npx playwright test              # Run all tests
 *   npx playwright test --debug      # Debug mode
 *   npx playwright test --ui         # Interactive UI
 *   npx playwright test --project=chromium  # Single browser
 */

import { defineConfig, devices } from "@playwright/test";

const e2ePort = Number(process.env.PORT ?? 3100);
const liveBaseURL = process.env.LIVE_BASE_URL;
const baseURL = liveBaseURL ?? `http://localhost:${e2ePort}`;

export default defineConfig({
  // Look for test files in the tests/e2e directory
  testDir: "./tests/e2e",

  // Maximum time a test can run
  timeout: 45_000,

  // Next dev cold-compiles route bundles during E2E; URL and visibility
  // assertions need enough room for first-hit navigations.
  expect: {
    timeout: 15_000,
  },

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Reporter
  reporter: process.env.CI ? "github" : "html",

  // Shared settings for all projects
  use: {
    baseURL,

    // Collect trace on first retry
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",
  },

  // Browser projects
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Uncomment to test additional browsers:
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "mobile",
    //   use: { ...devices["iPhone 14"] },
    // },
  ],

  webServer: liveBaseURL
    ? undefined
    : {
        command: `PORT=${e2ePort} NEXTAUTH_URL=http://localhost:${e2ePort} AUTH_URL=http://localhost:${e2ePort} npm run dev`,
        port: e2ePort,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
