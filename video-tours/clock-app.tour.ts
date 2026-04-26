import { test } from "@playwright/test";
import { clock_app as project } from "../utils/projects";
import { pause, closeTour, humanClick } from "./_tour-utils";

const TITLE = project.title;

test(`tour: ${TITLE}`, async ({ page, context }) => {
  await page.goto(project.projectUrl);
  await page.waitForLoadState("networkidle");
  await pause(page, 3000);

  await humanClick(page, page.locator("[class*='refresh']"));
  await page.locator("[class*='quote-text']").waitFor({ state: "visible" });
  await pause(page, 2000);

  await humanClick(page, page.getByRole("button", { name: /more/i }));
  await page.locator("[class*='section-bottom']").waitFor({ state: "visible" });
  await pause(page, 3000);

  await closeTour(context, page, TITLE);
});
