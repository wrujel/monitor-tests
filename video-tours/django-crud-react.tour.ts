import { test } from "@playwright/test";
import { django_crud_react as project } from "../utils/projects";
import { navigateWithRetry } from "../utils/nav";
import { pause, closeTour, humanType, humanClick } from "./_tour-utils";

const TITLE = project.title;

// Render free tier can take up to 5 min to spin up
test.setTimeout(10 * 60 * 1000);

test(`tour: ${TITLE}`, async ({ page, context }) => {
  await navigateWithRetry(page, project.projectUrl);
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  await page.getByRole("button", { name: "Add Task" }).waitFor({
    state: "visible",
    timeout: 90000,
  });
  await pause(page, 1000);

  // Add first task
  await humanClick(page, page.getByRole("button", { name: "Add Task" }));
  await page.getByPlaceholder("Title").waitFor({ state: "visible" });
  await humanType(page, page.getByPlaceholder("Title"), "Buy groceries for the week");
  await humanType(page, page.getByPlaceholder("Description"), "Pick up vegetables, fruits, milk, and bread from the supermarket before Friday.");
  await pause(page, 1500);
  await humanClick(page, page.getByRole("button", { name: "Save" }));
  await page.waitForLoadState("networkidle", { timeout: 30000 });
  await page.getByRole("button", { name: "Add Task" }).waitFor({
    state: "visible",
    timeout: 20000,
  });
  await pause(page, 2000);

  // Add second task
  await humanClick(page, page.getByRole("button", { name: "Add Task" }));
  await page.getByPlaceholder("Title").waitFor({ state: "visible" });
  await humanType(page, page.getByPlaceholder("Title"), "Schedule dentist appointment");
  await humanType(page, page.getByPlaceholder("Description"), "Call the clinic to book a check-up for next week. Remember to ask about the cleaning.");
  await pause(page, 1500);
  await humanClick(page, page.getByRole("button", { name: "Save" }));
  await page.waitForLoadState("networkidle", { timeout: 30000 });
  await page.getByRole("button", { name: "Add Task" }).waitFor({
    state: "visible",
    timeout: 20000,
  });
  await pause(page, 2000);

  // Update the first task
  await humanClick(page, page.getByText("Buy groceries for the week").first());
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => {
    const input = document.querySelector('input[placeholder="Title"]') as HTMLInputElement;
    return input && input.value.length > 0;
  });
  await page.getByPlaceholder("Title").waitFor({ state: "visible" });
  await page.getByPlaceholder("Title").click({ clickCount: 3 });
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Delete");
  await humanType(page, page.getByPlaceholder("Title"), "Buy groceries and cook dinner");
  await page.getByPlaceholder("Description").click({ clickCount: 3 });
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Delete");
  await humanType(page, page.getByPlaceholder("Description"), "Get groceries from the store and prepare a pasta dish for the family tonight.");
  await pause(page, 1500);
  await humanClick(page, page.getByRole("button", { name: "Save" }));
  await page.waitForLoadState("networkidle", { timeout: 30000 });
  await page.getByRole("button", { name: "Add Task" }).waitFor({
    state: "visible",
    timeout: 20000,
  });
  await pause(page, 2000);

  await closeTour(context, page, TITLE);
});
