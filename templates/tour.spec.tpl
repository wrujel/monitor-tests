import { test } from "@playwright/test";
import { %{{repo}}% as project } from "../utils/projects";
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

async function scrollToTop(page: Parameters<typeof humanScroll>[0]) {
  const scrollY = await page.evaluate(() => window.scrollY);
  if (scrollY > 10) await humanScroll(page, -scrollY);
}

test(`tour: ${TITLE}`, async ({ page, context }) => {
  test.setTimeout(180000);
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
  await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
  await pause(page, 1500);

  // add tour interactions here

  await humanScrollToBottom(page);
  await pause(page, 1500);

  // ── Ending ─────────────────────────────────────────────────────────────────
  await scrollToTop(page);
  await pause(page, 1000);

  await page.goto(project.projectUrl, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
  await pause(page, 1200);

  await closeTour(context, page, TITLE);
});
