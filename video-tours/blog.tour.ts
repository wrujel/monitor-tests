import { test } from "@playwright/test";
import { blog as project } from "../utils/projects";
import { pause, closeTour, humanScroll, humanScrollToBottom, humanClick } from "./_tour-utils";
import dotenv from "dotenv";
dotenv.config();

const TITLE = project.title;

async function scrollToTop(page: Parameters<typeof humanScroll>[0]) {
  const scrollY = await page.evaluate(() => window.scrollY);
  if (scrollY > 10) await humanScroll(page, -scrollY);
}

test(`tour: ${TITLE}`, async ({ page, context }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });
  if (process.env.HTTP_HEADER && process.env.HTTP_HEADER_VALUE) {
    await page.setExtraHTTPHeaders({
      [process.env.HTTP_HEADER]: process.env.HTTP_HEADER_VALUE,
      "x-vercel-set-bypass-cookie": "samesitenone",
    });
  }

  // ── Home page ──────────────────────────────────────────────────────────────
  await page.goto(project.projectUrl, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  const themeBtn = page
    .locator(
      "button[aria-label*='theme' i], button[aria-label*='dark' i], button[aria-label*='light' i], button[title*='theme' i]"
    )
    .first();
  await humanClick(page, themeBtn);
  await pause(page, 1800);

  await humanClick(page, themeBtn);
  await pause(page, 1800);

  await humanScrollToBottom(page);
  await pause(page, 1500);

  await scrollToTop(page);
  await pause(page, 1500);

  // ── Explore page ───────────────────────────────────────────────────────────
  await page.goto(`${project.projectUrl}/explore`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  await humanScrollToBottom(page);
  await pause(page, 1500);

  const paginationLink = page
    .locator(
      "nav[aria-label*='pagination' i] a, [class*='pagination'] a, a[aria-label*='next' i], a[aria-label*='page 2' i]"
    )
    .first();
  const hasPagination = await paginationLink.isVisible({ timeout: 5000 }).catch(() => false);
  if (hasPagination) {
    await humanClick(page, paginationLink);
    await page.waitForLoadState("networkidle");
    await pause(page, 2000);
  } else {
    await pause(page, 1000);
  }

  await scrollToTop(page);
  await pause(page, 1000);

  const categoryLink = page
    .locator(
      "a[href*='categor' i], a[href*='tag' i], button[class*='categor' i], button[class*='tag' i]"
    )
    .first();
  await humanClick(page, categoryLink);
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  // ── Detail / post page ─────────────────────────────────────────────────────
  await scrollToTop(page);
  await pause(page, 1000);

  const firstPost = page
    .locator("article a, [class*='post'] a, [class*='card'] a")
    .first();
  await humanClick(page, firstPost);
  await page.waitForLoadState("load");
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  await humanScrollToBottom(page);
  await pause(page, 1500);

  // ── Ending ─────────────────────────────────────────────────────────────────
  await scrollToTop(page);
  await pause(page, 1200);

  await page.goto(project.projectUrl, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  await closeTour(context, page, TITLE);
});
