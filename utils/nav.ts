import { Page } from "@playwright/test";

enum SlowHost {
  Render = "onrender.com",
}

const SLOW_HOST_TIMEOUT = 5 * 60 * 1000; // 5 minutes per attempt
const DEFAULT_TIMEOUT = 30 * 1000; // 30 seconds
const SLOW_HOST_RETRIES = 3;
const RETRY_BASE_BACKOFF_MS = 10 * 1000; // 10s, 20s, 40s...

const exponentialBackoffMs = (attempt: number): number =>
  RETRY_BASE_BACKOFF_MS * (1 << (attempt - 1));

export const isSlowHost = (url: string): boolean =>
  Object.values(SlowHost).some((host) => url.includes(host));

/**
 * Navigate to a URL with automatic retry and exponential backoff.
 * For slow hosts (e.g. Render free tier), retries up to 3 times with
 * 10s/20s/40s delays. Falls back to an HTTP HEAD probe to distinguish
 * "deployment down" from "bot-blocked" page loads.
 */
export const navigateWithRetry = async (
  page: Page,
  url: string,
): Promise<void> => {
  const timeout = isSlowHost(url) ? SLOW_HOST_TIMEOUT : DEFAULT_TIMEOUT;
  const retries = isSlowHost(url) ? SLOW_HOST_RETRIES : 1;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[nav] [attempt ${attempt}/${retries}] navigating to ${url}`);
      const response = await page.goto(url, { timeout, waitUntil: "load" });
      if (response?.ok()) {
        console.log(`[nav] PASSED (status: ${response.status()})`);
        return;
      }
      throw new Error(`HTTP ${response?.status()}`);
    } catch (e) {
      lastError = e as Error;
      console.log(
        `[nav] attempt ${attempt}/${retries} failed: ${lastError.message}`,
      );
      if (attempt < retries) {
        const delay = exponentialBackoffMs(attempt);
        console.log(`[nav] retrying in ${delay / 1000}s...`);
        await page.waitForTimeout(delay);
        await page.reload({ timeout, waitUntil: "load" });
      }
    }
  }

  // Fallback: lightweight HTTP HEAD probe to distinguish "deployment down"
  // from browser-level failures (CSP, bot protection, etc.)
  try {
    const probe = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
    });
    if (probe.status < 500) {
      console.log(
        `[nav] HTTP probe passed (status: ${probe.status}) — deployment is alive`,
      );
      return;
    }
    console.log(`[nav] HTTP probe returned server error: ${probe.status}`);
  } catch (probeError) {
    console.log(
      `[nav] HTTP probe also failed: ${(probeError as Error).message}`,
    );
  }

  throw lastError;
};
