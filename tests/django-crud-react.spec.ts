import { test, expect } from "@playwright/test";
import { django_crud_react as project } from "../utils/projects";
import { navigateWithRetry, waitForRenderInterstitial } from "../utils/nav";

const TITLE = project.title;
const URL_PATH = project.projectUrl;

test.beforeEach(async ({ page }) => {
  await navigateWithRetry(page, URL_PATH);
  await waitForRenderInterstitial(page);
  await page.waitForLoadState("domcontentloaded");
});

test(`${TITLE} - Test home`, async ({ page }) => {
  await page.waitForLoadState("networkidle");

  // Brand link + primary action (Render free tier may cold-start, hence the
  // generous first timeout).
  await expect(page.getByRole("link", { name: "Task Manager" })).toBeVisible({
    timeout: 90000,
  });
  await expect(
    page.getByRole("button", { name: "New", exact: true }),
  ).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole("heading", { name: "Your tasks" })).toBeVisible({
    timeout: 8000,
  });

  // Verify we're on the correct page
  await expect(page).toHaveURL(new RegExp(URL_PATH));
});

test(`${TITLE} - Test create and delete task`, async ({ page }) => {
  // Unique title so re-runs never collide with leftovers from earlier runs.
  const taskTitle = `Monitor check ${Date.now()}`;

  const newButton = page.getByRole("button", { name: "New", exact: true });
  await expect(newButton).toBeVisible({ timeout: 90000 });
  await newButton.click();

  // The task form opens in a modal
  const dialog = page.getByRole("dialog", { name: "New task" });
  await expect(dialog).toBeVisible({ timeout: 8000 });
  await dialog.getByPlaceholder("Title").fill(taskTitle);
  await dialog
    .getByPlaceholder("Description")
    .fill("Automated end-to-end monitor check.");
  await dialog.getByRole("button", { name: "Save" }).click();

  // Modal closes and the created task appears in the grid
  await expect(dialog).toBeHidden({ timeout: 20000 });
  const heading = page.getByRole("heading", { name: taskTitle });
  await expect(heading).toBeVisible({ timeout: 20000 });
  await expect(page).toHaveURL(new RegExp(URL_PATH));

  // Clean up: delete the task we just created so the demo data stays tidy
  const card = page.getByRole("article").filter({ hasText: taskTitle });
  await card.getByRole("button", { name: "Delete task" }).click();
  await expect(page.getByRole("heading", { name: "Delete task?" })).toBeVisible(
    { timeout: 8000 },
  );
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(heading).toBeHidden({ timeout: 20000 });
});
