import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import { blog as project } from "../utils/projects";

dotenv.config();

const TITLE = project.title;
const URL_PATH = project.projectUrl;

test.beforeEach(async ({ page }) => {
  // Mask automation fingerprints before any navigation so Vercel WAF
  // bot detection doesn't flag the headless browser.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    // @ts-ignore
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    // @ts-ignore
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    // @ts-ignore
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
  });

  const hasBypass = !!(
    process.env.HTTP_HEADER && process.env.HTTP_HEADER_VALUE
  );
  console.log(`[blog] bypass header configured: ${hasBypass}`);
  if (hasBypass) {
    console.log(
      `[blog] setting header: ${process.env.HTTP_HEADER?.substring(0, 4)}...`,
    );
    await page.setExtraHTTPHeaders({
      [process.env.HTTP_HEADER!]: process.env.HTTP_HEADER_VALUE!,
      "x-vercel-set-bypass-cookie": "samesitenone",
    });
  }

  const response = await page.goto(URL_PATH, { waitUntil: "domcontentloaded" });
  console.log(
    `[blog] goto ${URL_PATH} — status: ${response?.status()}, url: ${response?.url()}`,
  );

  if (response?.status() === 429) {
    console.log("[blog] 429 received — response headers:", response.headers());
  }

  await page.waitForLoadState("networkidle");

  const title = await page.title();
  const bodyText = await page
    .locator("body")
    .innerText()
    .catch(() => "(empty)");
  console.log(`[blog] page title: "${title}"`);
  console.log(
    `[blog] body length: ${bodyText.length}, preview: ${bodyText.slice(0, 200)}`,
  );
  console.log(`[blog] nav found: ${await page.locator("nav").count()}`);
});

test(`${TITLE} - Navbar`, async ({ page }) => {
  await expect(page.locator("nav")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /wrujel/i }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /search/i }).first(),
  ).toBeVisible();
});

test(`${TITLE} - Hero section`, async ({ page }) => {
  await expect(page.locator("article").first()).toBeVisible();
  await expect(
    page.locator("article").first().getByRole("heading").first(),
  ).toBeVisible();
  await expect(
    page.locator("article").first().getByRole("link").first(),
  ).toBeVisible();
});

test(`${TITLE} - Category showcase`, async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: /category/i }).first(),
  ).toBeVisible();
  await expect(
    page
      .locator("section")
      .filter({ has: page.getByText(/category/i) })
      .first(),
  ).toBeVisible();
});

test(`${TITLE} - Latest articles`, async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: /latest/i }).first(),
  ).toBeVisible();
  await expect(
    page
      .locator('[class*="grid"]')
      .filter({ has: page.locator("a") })
      .first(),
  ).toBeVisible();
});

test(`${TITLE} - Subscribe section`, async ({ page }) => {
  const subscribe = page.locator("#subscribe");
  await subscribe.scrollIntoViewIfNeeded();
  await expect(subscribe).toBeVisible();
  await expect(subscribe.getByRole("textbox")).toBeVisible();
  await expect(subscribe.getByRole("button")).toBeVisible();
});

test(`${TITLE} - Footer`, async ({ page }) => {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator("footer")).toBeVisible();
  await expect(page.getByText(/©/)).toBeVisible();
});

test(`${TITLE} - Explore page`, async ({ page }) => {
  await page.goto(`${URL_PATH}/explore`);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await expect(page.locator("article").first()).toBeVisible({ timeout: 10000 });
});

test(`${TITLE} - Blog post page`, async ({ page }) => {
  // Click the first article link from the home page
  const firstArticle = page
    .locator("article")
    .first()
    .getByRole("link")
    .first();
  await firstArticle.click();
  await page.waitForLoadState("load");
  await expect(page.locator("article").first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("heading").first()).toBeVisible();
});

test(`${TITLE} - Locale - Spanish`, async ({ page }) => {
  await page.goto(`${URL_PATH}/es`);
  await expect(page).toHaveURL(/\/es/);
  await expect(page.locator("article").first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator("nav")).toBeVisible();
});

test(`${TITLE} - Theme toggle`, async ({ page }) => {
  const themeButton = page.getByRole("button", { name: /theme/i }).first();
  if (await themeButton.isVisible()) {
    await themeButton.click();
    await expect(themeButton).toBeVisible();
  }
});
