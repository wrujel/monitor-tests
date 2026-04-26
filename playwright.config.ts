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
  /* Global timeout: extended for video tours (slow hosts + pauses per project) */
  globalTimeout: process.env.VIDEO_TOUR ? 90 * 60 * 1000 : 10 * 60 * 1000,
  /* Video tours are intentionally slow — suppress the warning */
  reportSlowTests: process.env.VIDEO_TOUR ? null : { max: 5, threshold: 15000 },
  /* Clear videos/ before each tour run */
  globalSetup: process.env.VIDEO_TOUR ? "./video-tours/global-setup.ts" : undefined,
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

    /* Launch options to reduce automation fingerprinting detected by Vercel WAF */
    launchOptions: {
      args: [
        "--disable-features=BlockInsecurePrivateNetworkRequests",
        /* Remove the AutomationControlled flag exposed to JS */
        "--disable-blink-features=AutomationControlled",
        /* Prevent navigator.webdriver from being set by Chrome */
        "--no-default-browser-check",
        "--no-first-run",
      ],
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
    {
      name: "video-tours",
      testDir: "./video-tours",
      testMatch: "**/*.tour.ts",
      use: {
        ...devices["Desktop Chrome"],
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        bypassCSP: true,
        launchOptions: {
          args: [
            "--disable-features=BlockInsecurePrivateNetworkRequests",
            "--disable-blink-features=AutomationControlled",
            "--no-default-browser-check",
            "--no-first-run",
            // Render at 2× DPR so the screencast downsamples from 3840×2160 → 1920×1080,
            // effectively supersampling text and edges for sharper video.
            "--force-device-scale-factor=2",
          ],
        },
        colorScheme: "dark",
        viewport: { width: 1920, height: 1080 },
        contextOptions: {
          recordVideo: { dir: "videos/", size: { width: 1920, height: 1080 } },
        },
      },
    },
  ],
});
