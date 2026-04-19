import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import { blog as project } from "../utils/projects";

dotenv.config();

const TITLE = project.title;
const URL_PATH = project.projectUrl;

test.beforeEach(async ({ page }) => {
  if (process.env.HTTP_HEADER && process.env.HTTP_HEADER_VALUE) {
    await page.setExtraHTTPHeaders({
      [process.env.HTTP_HEADER]: process.env.HTTP_HEADER_VALUE,
    });
  }
  await page.goto(URL_PATH);
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
