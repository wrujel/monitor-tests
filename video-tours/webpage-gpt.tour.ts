import { test } from "@playwright/test";
import { webpage_gpt as project } from "../utils/projects";
import { pause, closeTour, humanScroll, humanScrollToBottom } from "./_tour-utils";

const TITLE = project.title;

test(`tour: ${TITLE}`, async ({ page, context }) => {
  await page.goto(project.projectUrl);
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  await humanScroll(page, 500);
  await pause(page, 1500);
  await humanScroll(page, 500);
  await pause(page, 1500);
  await humanScrollToBottom(page);
  await pause(page, 1500);

  await closeTour(context, page, TITLE);
});
