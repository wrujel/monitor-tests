import { test, expect } from "@playwright/test";
import { clock_app as project } from "../utils/projects";

const TITLE = project.title;
const URL_PATH = project.projectUrl;

test.beforeEach(async ({ page }) => {
  await page.goto(URL_PATH);
});

test(`${TITLE} - Test home page`, async ({ page }) => {
  await expect(
    page.locator("//div[contains(@class, 'page_quote-text')]")
  ).toBeVisible();
  await expect(
    page.locator("//h4[contains(@class, 'page_greet-text')]")
  ).toBeVisible();
  await expect(
    page.locator("//h1[contains(@class, 'page_hour-text')]")
  ).toBeVisible();
});
