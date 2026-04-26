import { test } from "@playwright/test";
import { portfolio_web_template as project } from "../utils/projects";
import { pause, closeTour } from "./_tour-utils";

const TITLE = project.title;
const BASE = project.projectUrl;

test(`tour: ${TITLE}`, async ({ page, context }) => {
  await page.goto(BASE);
  await page.waitForLoadState("networkidle");
  await pause(page, 3000);

  await page.goto(`${BASE}/about`, { waitUntil: "load" });
  await pause(page, 3000);

  await page.goto(`${BASE}/services`, { waitUntil: "load" });
  await pause(page, 3000);

  await page.goto(`${BASE}/projects`, { waitUntil: "load" });
  await pause(page, 3000);

  await page.goto(`${BASE}/customers`, { waitUntil: "load" });
  await pause(page, 3000);

  await closeTour(context, page, TITLE);
});
