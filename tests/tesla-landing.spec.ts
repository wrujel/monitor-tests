import { test, expect } from "@playwright/test";
import { tesla_landing as project } from "../utils/projects";

const TITLE = project.title;
const URL_PATH = project.projectUrl;

test.beforeEach(async ({ page }) => {
  await page.goto(URL_PATH);
});

test(`${TITLE} - Test home`, async ({ page }) => {
  await expect(page.locator("#landing-header div").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Model S" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Model 3" })).toBeVisible();
  await expect(page.getByText("Shop Account Menu")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Experience Tesla" })
  ).toBeVisible();
  await expect(
    page
      .locator("section")
      .filter({ hasText: "Experience Tesla Schedule a" })
      .locator("div")
      .nth(3)
  ).toBeVisible();
});

test(`${TITLE} - Test second section`, async ({ page }) => {
  await expect(
    page.locator(
      "div:nth-child(2) > .landing-section > .relative > .flex > div > .text-white"
    )
  ).toBeVisible();
  await expect(page.locator(".text-\\[\\#393c41\\]").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Model 3" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Model Y" })).toBeVisible();
  await expect(
    page.locator(
      "div:nth-child(3) > .landing-section > .relative > .flex > div > .text-white"
    )
  ).toBeVisible();
  await expect(
    page.locator(
      "div:nth-child(3) > .landing-section > .relative > .flex > div > .text-\\[\\#393c41\\]"
    )
  ).toBeVisible();
});

test(`${TITLE} - Test last section`, async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Accessories" })
  ).toBeVisible();
  await expect(
    page.locator("div").filter({ hasText: "Shop Now" }).nth(4)
  ).toBeVisible();
});
