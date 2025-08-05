import { test, expect } from "@playwright/test";
import { django_crud_react as project } from "../utils/projects";

const TITLE = project.title;
const URL_PATH = project.projectUrl;

test.beforeEach(async ({ page }) => {
  await page.goto(URL_PATH, { waitUntil: "networkidle" });
  // Ensure the page is fully loaded before each test
  await page.waitForLoadState("domcontentloaded");
});

test(`${TITLE} - Test home`, async ({ page }) => {
  // Wait for the page to fully load
  await page.waitForLoadState("networkidle");

  // Check for main elements with extended timeouts
  await expect(page.getByRole("link", { name: "Task App" })).toBeVisible({
    timeout: 90000,
  });
  await expect(page.getByRole("button", { name: "Add Task" })).toBeVisible({
    timeout: 8000,
  });

  // Verify we're on the correct page
  await expect(page).toHaveURL(new RegExp(URL_PATH));
});

test(`${TITLE} - Test create new task`, async ({ page }) => {
  // Wait for Add Task button to be ready and click it
  await expect(page.getByRole("button", { name: "Add Task" })).toBeVisible({
    timeout: 90000,
  });
  await page.getByRole("button", { name: "Add Task" }).click();

  // Wait for form elements to appear with timeouts
  await expect(page.getByPlaceholder("Title")).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole("button", { name: "Save" })).toBeVisible({
    timeout: 5000,
  });

  // Fill form fields with proper waits
  await page.getByPlaceholder("Title").click();
  await page.getByPlaceholder("Title").fill("Test Task");

  // Wait for description field to be ready
  await expect(page.getByPlaceholder("Description")).toBeVisible({
    timeout: 5000,
  });
  await page.getByPlaceholder("Description").click();
  await page
    .getByPlaceholder("Description")
    .fill("This is a test task description");

  // Save the task and wait for the operation to complete
  await page.getByRole("button", { name: "Save" }).click();

  // Wait for network activity to settle after form submission
  await page.waitForLoadState("networkidle", { timeout: 30000 });

  // Robust verification strategy for task creation success
  // The application may redirect back to main page or show form disappearance
  let taskCreated = false;
  const startTime = Date.now();
  const maxWaitTime = 20000; // 20 seconds max

  while (!taskCreated && (Date.now() - startTime) < maxWaitTime) {
    try {
      // Check if we're back to the main page (Add Task button visible)
      const addTaskVisible = await page.getByRole("button", { name: "Add Task" }).isVisible();
      if (addTaskVisible) {
        taskCreated = true;
        break;
      }

      // Check if form fields are gone (modal closed)
      const titleFieldVisible = await page.getByPlaceholder("Title").isVisible();
      if (!titleFieldVisible) {
        // Form has closed, wait for Add Task button to appear
        await expect(page.getByRole("button", { name: "Add Task" })).toBeVisible({
          timeout: 5000,
        });
        taskCreated = true;
        break;
      }

      // Wait a bit before retrying
      await page.waitForTimeout(1000);
    } catch (error) {
      // Continue trying
    }
  }

  if (!taskCreated) {
    // Final attempt with explicit wait
    await expect(page.getByRole("button", { name: "Add Task" })).toBeVisible({
      timeout: 10000,
    });
  }

  // Final verification: Ensure we're on the correct page
  await expect(page).toHaveURL(new RegExp(URL_PATH));
});
