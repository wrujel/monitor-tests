import { test, type Page } from "@playwright/test";
import { portfolio as project } from "../utils/projects";
import {
  pause,
  closeTour,
  humanScroll,
  humanScrollToBottom,
  humanScrollToElement,
  humanClick,
} from "./_tour-utils";
import dotenv from "dotenv";
dotenv.config();

const TITLE = project.title;

async function scrollToTop(page: Page) {
  const scrollY = await page.evaluate(() => window.scrollY);
  if (scrollY > 10) await humanScroll(page, -scrollY);
}

// Click only when the target actually rendered — a missing element must not
// abort the tour (no video gets saved when the test throws).
async function clickIfVisible(
  page: Page,
  locator: ReturnType<Page["locator"]>,
) {
  const visible = await locator.isVisible({ timeout: 5000 }).catch(() => false);
  if (visible) await humanClick(page, locator);
  return visible;
}

// The site animates continuously, so networkidle rarely fires — cap the wait
async function settle(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
}

// Drag across the globe so the Earth spins on camera
async function humanDrag(page: Page, from: [number, number], dx: number) {
  await page.mouse.move(from[0], from[1], { steps: 12 });
  await page.mouse.down();
  await page.mouse.move(from[0] + dx, from[1], { steps: 40 });
  await page.mouse.up();
}

test(`tour: ${TITLE}`, async ({ page, context }) => {
  // Long tour: 9 sections + 4 routes. customizations.json speeds it up 3× in
  // post, so the wall-clock budget here is generous on purpose.
  test.setTimeout(420000);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });
  // Same-origin only: setExtraHTTPHeaders would also stamp these on the
  // cross-origin LeetCode insights fetch, which the API rejects at CORS
  // preflight — the stats section would film its "unable to load" fallback.
  if (process.env.HTTP_HEADER && process.env.HTTP_HEADER_VALUE) {
    const origin = new URL(project.projectUrl).origin;
    await page.route(`${origin}/**`, async (route) => {
      await route.continue({
        headers: {
          ...route.request().headers(),
          [process.env.HTTP_HEADER!]: process.env.HTTP_HEADER_VALUE!,
          "x-vercel-set-bypass-cookie": "samesitenone",
        },
      });
    });
  }

  // ── Home: hero ─────────────────────────────────────────────────────────────
  await page.goto(project.projectUrl, { waitUntil: "domcontentloaded" });
  await settle(page);
  await pause(page, 2000);

  // Theme round-trip. Tours run with colorScheme: "dark", so the toggle starts
  // as "Switch to light mode" — match either label so the tour survives a flip.
  const themeBtn = page.locator('button[aria-label*="Switch to" i]').first();
  await clickIfVisible(page, themeBtn);
  await pause(page, 1200);
  await clickIfVisible(page, themeBtn);
  await pause(page, 800);

  // ── Home: sections ─────────────────────────────────────────────────────────
  await humanScrollToElement(page, page.locator("#about"));
  await pause(page, 1400);

  await humanScrollToElement(page, page.locator("#projects"));
  await pause(page, 1500);

  await humanScrollToElement(page, page.locator("#case-studies"));
  await pause(page, 1200);

  // Open the first case study, let the dialog breathe, then close it
  const firstStudy = page.locator('#case-studies [role="listitem"]').first();
  if (await clickIfVisible(page, firstStudy)) {
    await pause(page, 2000);
    const dialog = page.locator('[role="dialog"][aria-modal="true"]').last();
    await dialog
      .locator('button[aria-label*="Close case study" i]')
      .click()
      .catch(() => page.keyboard.press("Escape"));
    await pause(page, 800);
  }

  await humanScrollToElement(page, page.locator("#skills"));
  await pause(page, 1200);

  // Expand a skill category card
  await clickIfVisible(page, page.locator("#skills [role='listitem']").first());
  await pause(page, 1400);

  // The LeetCode counters animate as the section enters the viewport
  await humanScrollToElement(page, page.locator("#leetcode"));
  await pause(page, 2500);

  await humanScrollToElement(page, page.locator("#services"));
  await pause(page, 1300);

  await humanScrollToElement(page, page.locator("#contact"));
  await pause(page, 1300);

  await humanScrollToBottom(page);
  await pause(page, 1000);

  // ── Projects page ──────────────────────────────────────────────────────────
  await page.goto(`${project.projectUrl}/projects`, {
    waitUntil: "domcontentloaded",
  });
  await settle(page);
  await pause(page, 1500);

  // Filter by the most-used language, then clear the filter
  const filters = page.locator('[role="group"][aria-label*="Filter" i]');
  await clickIfVisible(page, filters.locator("button").nth(1));
  await pause(page, 1500);
  await clickIfVisible(page, filters.locator("button").first());
  await pause(page, 800);

  await humanScroll(page, 900);
  await pause(page, 1000);
  await scrollToTop(page);
  await pause(page, 600);

  // ── Project detail page ────────────────────────────────────────────────────
  // Cards navigate via router.push on div[role="link"], not an anchor
  await clickIfVisible(page, page.locator('div[role="link"]').first());
  await settle(page);
  await pause(page, 1500);

  await humanScroll(page, 1300);
  await pause(page, 1200);
  await scrollToTop(page);
  await pause(page, 600);

  // ── About page ─────────────────────────────────────────────────────────────
  await page.goto(`${project.projectUrl}/about`, {
    waitUntil: "domcontentloaded",
  });
  await settle(page);
  await pause(page, 1500);

  await humanScrollToElement(
    page,
    page.getByRole("heading", { name: "Work Experience" }),
  );
  await pause(page, 1500);
  await humanScroll(page, 1400);
  await pause(page, 1200);

  // ── Location page: the interactive globe ───────────────────────────────────
  await page.goto(`${project.projectUrl}/about/location`, {
    waitUntil: "domcontentloaded",
  });
  await settle(page);
  // The Earth scene needs a beat to finish its intro flight
  await pause(page, 3000);

  await humanDrag(page, [960, 540], 320);
  await pause(page, 1500);

  await clickIfVisible(
    page,
    page.locator('button[aria-label*="Center on location" i]'),
  );
  await pause(page, 2000);

  // ── AI assistant ───────────────────────────────────────────────────────────
  // Panel only — sending a prompt would bill the live AI endpoint on every run
  const aiButton = page.locator('button[aria-label*="AI chat" i]');
  if (await clickIfVisible(page, aiButton)) {
    await pause(page, 2500);
    await clickIfVisible(page, aiButton);
    await pause(page, 800);
  }

  // ── Ending ─────────────────────────────────────────────────────────────────
  await page.goto(project.projectUrl, { waitUntil: "domcontentloaded" });
  await settle(page);
  await pause(page, 1500);

  await closeTour(context, page, TITLE);
});
