import { test, expect } from "@playwright/test";
import { github_history as project } from "../utils/projects";

const TITLE = project.title;
const URL_PATH = project.projectUrl;

test.beforeEach(async ({ page }) => {
  await page.goto(URL_PATH);
});

test(`${TITLE} - Test home`, async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Github History App" })
  ).toBeVisible();
  await expect(page.locator("#username")).toBeVisible();
  await expect(page.locator("#repos")).toBeVisible();
  await expect(page.locator("#branches")).toBeVisible();
});

test(`${TITLE} - Test select a repo`, async ({ page }) => {
  await page.locator("#repos").selectOption("admin-dashboard-next");
  await expect(page.getByText("Github History AppGITHUB")).toBeVisible();
});
