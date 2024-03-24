import { test, expect } from "@playwright/test";
import { slider_static as project } from "../utils/projects";

const TITLE = project.title;
const URL_PATH = project.projectUrl;

test.beforeEach(async ({ page }) => {
  await page.goto(URL_PATH);
});

test(`${TITLE} - Test home`, async ({ page }) => {
  await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Contacts" })).toBeVisible();
  await expect(page.locator("img").first()).toBeVisible();
  await expect(page.locator(".thumbnail > div > img").first()).toBeVisible();
  await expect(
    page.locator(".thumbnail > div:nth-child(2) > img")
  ).toBeVisible();
  await expect(
    page.locator(".thumbnail > div:nth-child(3) > img")
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "<" })).toBeVisible();
  await expect(page.getByRole("button", { name: ">" })).toBeVisible();
});
