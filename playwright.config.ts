import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./.",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Global timeout for the entire test suite */
  globalTimeout: 10 * 60 * 1000,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Limit how long each action (click, fill, etc.) can take. */
    actionTimeout: 30000,

    /* Bypass CSP to avoid issues with Cross-Origin-Opener-Policy headers */
    bypassCSP: true,

    /* Custom user agent to avoid Vercel bot protection */
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",

    /* Launch options to handle COOP/COEP headers that break navigation detection */
    launchOptions: {
      args: ["--disable-features=BlockInsecurePrivateNetworkRequests"],
    },
  },
  expect: {
    /* Increase assertion timeout from the default 5s so Vercel cold-starts
       don't cause false negatives. */
    timeout: 15000,
  },
  timeout: 120000,

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        /* Override device user-agent so headless Chrome on CI doesn't
           expose an automation fingerprint to Vercel bot protection. */
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    },
  ],
});
