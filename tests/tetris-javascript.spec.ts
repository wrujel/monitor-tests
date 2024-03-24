import { test, expect } from "@playwright/test";
import { tetris_javascript as project } from "../utils/projects";

const TITLE = project.title;
const URL_PATH = project.projectUrl;

test.beforeEach(async ({ page }) => {
  await page.goto(URL_PATH);
});

test(`${TITLE} - Test home`, async ({ page }) => {
  await page.getByText("Start Game").click();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByText("Score:")).toBeVisible();
  await expect(page.getByText("Level:")).toBeVisible();
});
