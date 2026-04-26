import { test } from "@playwright/test";
import { admin_dashboard_next as project } from "../utils/projects";
import { pause, closeTour, humanClick } from "./_tour-utils";

const TITLE = project.title;

test(`tour: ${TITLE}`, async ({ page, context }) => {
  await page.goto(project.projectUrl);
  await page.waitForLoadState("networkidle");
  await pause(page, 500);

  await humanClick(page, page.getByRole("link", { name: "Dashboard" }));
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  await humanClick(page, page.getByRole("link", { name: "Users" }));
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  await humanClick(page, page.getByRole("link", { name: "Products" }));
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  await closeTour(context, page, TITLE);
});
