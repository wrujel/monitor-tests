import { test } from "@playwright/test";
import { portfolio as project } from "../utils/projects";
import {
  pause,
  closeTour,
  humanScrollToElement,
  humanScrollToBottom,
  humanClick,
} from "./_tour-utils";
import dotenv from "dotenv";
dotenv.config();

const TITLE = project.title;

test(`tour: ${TITLE}`, async ({ page, context }) => {
  if (process.env.HTTP_HEADER && process.env.HTTP_HEADER_VALUE) {
    await page.setExtraHTTPHeaders({
      [process.env.HTTP_HEADER]: process.env.HTTP_HEADER_VALUE,
    });
  }

  await page.goto(project.projectUrl);
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  await humanClick(
    page,
    page.locator('button[aria-label="Switch to light mode"]'),
  );
  await pause(page, 1500);
  await humanClick(
    page,
    page.locator('button[aria-label="Switch to dark mode"]'),
  );
  await pause(page, 1000);

  // await humanScrollToElement(page, page.locator("#about"));
  // await pause(page, 1200);

  // await humanScrollToElement(page, page.locator("#projects"));
  // await pause(page, 1200);

  // await humanScrollToElement(page, page.locator("#skills"));
  // await pause(page, 1200);

  // await humanScrollToElement(page, page.locator("#contact"));
  // await pause(page, 1200);

  await humanScrollToBottom(page);
  await pause(page, 1200);

  await closeTour(context, page, TITLE);
});
