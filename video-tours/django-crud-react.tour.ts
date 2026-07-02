import { test } from "@playwright/test";
import { django_crud_react as project } from "../utils/projects";
import { navigateWithRetry } from "../utils/nav";
import { pause, closeTour, humanType, humanClick } from "./_tour-utils";

const TITLE = project.title;
const TASK_TITLE = "Plan the product launch";

// Render free tier can take up to 5 min to spin up
test.setTimeout(10 * 60 * 1000);

test(`tour: ${TITLE}`, async ({ page, context }) => {
  await navigateWithRetry(page, project.projectUrl);
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  const newButton = page.getByRole("button", { name: "New", exact: true });
  await newButton.waitFor({ state: "visible", timeout: 90000 });
  await pause(page, 1500);

  // Create a task with a priority and a due date
  await humanClick(page, newButton);
  const dialog = page.getByRole("dialog", { name: "New task" });
  await dialog.waitFor({ state: "visible" });
  await humanType(page, dialog.getByPlaceholder("Title"), TASK_TITLE);
  await humanType(
    page,
    dialog.getByPlaceholder("Description"),
    "Draft the announcement, brief the team, and schedule the social posts.",
  );
  await pause(page, 600);

  // Pick High priority from the custom dropdown
  await humanClick(page, dialog.getByRole("button", { name: "Priority" }));
  await page
    .getByRole("listbox", { name: "Priority" })
    .waitFor({ state: "visible" });
  await pause(page, 700);
  await humanClick(
    page,
    page.getByRole("option", { name: "High" }).locator("button"),
  );
  await pause(page, 500);

  // Pick today's date from the calendar
  await humanClick(page, dialog.getByRole("button", { name: "Due date" }));
  await page
    .getByRole("dialog", { name: "Due date" })
    .waitFor({ state: "visible" });
  await pause(page, 900);
  await humanClick(page, page.getByRole("button", { name: "Today" }));
  await pause(page, 700);

  await humanClick(page, dialog.getByRole("button", { name: "Save" }));
  await dialog.waitFor({ state: "hidden", timeout: 20000 });
  await pause(page, 1800);

  // Toggle it complete (stats animate), then back to active
  const card = page
    .getByRole("article")
    .filter({ hasText: TASK_TITLE })
    .first();
  await humanClick(page, card.getByRole("checkbox"));
  await pause(page, 2000);
  await humanClick(page, card.getByRole("checkbox"));
  await pause(page, 1200);

  // Live search
  const search = page.getByPlaceholder("Search tasks…");
  await humanType(page, search, "launch");
  await pause(page, 2200);
  await search.click({ clickCount: 3 });
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Delete");
  await pause(page, 1400);

  // Switch to the list view and nudge a row with the reorder arrows
  await humanClick(page, page.getByRole("button", { name: "List view" }));
  await pause(page, 1600);
  const moveDown = page.getByRole("button", { name: "Move down" }).first();
  if (await moveDown.isEnabled()) {
    await humanClick(page, moveDown);
    await pause(page, 1600);
  }

  // Back to the grid, then tidy up: delete the task we created
  await humanClick(page, page.getByRole("button", { name: "Grid view" }));
  await pause(page, 1400);
  const createdCard = page
    .getByRole("article")
    .filter({ hasText: TASK_TITLE })
    .first();
  await humanClick(
    page,
    createdCard.getByRole("button", { name: "Delete task" }),
  );
  await page
    .getByRole("heading", { name: "Delete task?" })
    .waitFor({ state: "visible" });
  await pause(page, 900);
  await humanClick(
    page,
    page.getByRole("button", { name: "Delete", exact: true }),
  );
  await pause(page, 2000);

  await closeTour(context, page, TITLE);
});
