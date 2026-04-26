import { test } from "@playwright/test";
import { slider_static as project } from "../utils/projects";
import { pause, closeTour, humanClick } from "./_tour-utils";

const TITLE = project.title;

test(`tour: ${TITLE}`, async ({ page, context }) => {
  await page.goto(project.projectUrl);
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  await humanClick(page, page.getByRole("button", { name: ">" }));
  await pause(page, 1500);
  await humanClick(page, page.getByRole("button", { name: ">" }));
  await pause(page, 1500);
  await humanClick(page, page.getByRole("button", { name: "<" }));
  await pause(page, 1500);

  await closeTour(context, page, TITLE);
});
