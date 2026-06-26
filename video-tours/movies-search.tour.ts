import { test } from "@playwright/test";
import { movies_search as project } from "../utils/projects";
import {
  pause,
  closeTour,
  humanType,
  humanClick,
  humanScroll,
  humanScrollToBottom,
  humanScrollToElement,
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
  await pause(page, 1800);

  const search = page.getByLabel("Search for movies");

  // ── Search ─────────────────────────────────────────────────────────────────
  await humanType(page, search, "interstellar");
  await page
    .getByRole("listitem")
    .first()
    .waitFor({ state: "visible", timeout: 15000 })
    .catch(() => {});
  await page.keyboard.press("Escape"); // dismiss the autocomplete dropdown
  await pause(page, 2200);

  // ── Sort filter ────────────────────────────────────────────────────────────
  const sortButton = page.getByRole("button", { name: /Sort/ }).first();
  if (await sortButton.isVisible().catch(() => false)) {
    await humanScrollToElement(page, sortButton);
    await humanClick(page, sortButton);
    await pause(page, 900);
    const newestFirst = page.getByRole("option", { name: "Newest first" });
    if (await newestFirst.isVisible().catch(() => false)) {
      await humanClick(page, newestFirst);
    }
    await page.keyboard.press("Escape"); // close the filter popover
    await pause(page, 1800);
  }

  // ── Browse results (infinite scroll loads more) ────────────────────────────
  await humanScrollToBottom(page);
  await pause(page, 1800);
  await scrollToTop(page);
  await pause(page, 1200);

  // ── Open a movie's details ─────────────────────────────────────────────────
  const firstCard = page
    .getByRole("listitem")
    .first()
    .getByRole("button")
    .first();
  if (await firstCard.isVisible().catch(() => false)) {
    await humanScrollToElement(page, firstCard);
    await humanClick(page, firstCard);
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
    await pause(page, 3000);

    const closeBtn = dialog.getByRole("button", { name: "Close" });
    if (await closeBtn.isVisible().catch(() => false)) {
      await humanClick(page, closeBtn);
    } else {
      await page.keyboard.press("Escape");
    }
    await pause(page, 1500);
  }

  // ── Ending ─────────────────────────────────────────────────────────────────
  await scrollToTop(page);
  await pause(page, 800);

  await page.goto(project.projectUrl, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
  await pause(page, 1200);

  await closeTour(context, page, TITLE);
});
