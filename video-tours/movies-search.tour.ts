import { test } from "@playwright/test";
import { movies_search as project } from "../utils/projects";
import { pause, closeTour, humanType, humanClick, humanScroll, humanScrollToBottom, humanScrollToElement } from "./_tour-utils";

const TITLE = project.title;

test(`tour: ${TITLE}`, async ({ page, context }) => {
  await page.goto(project.projectUrl);
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  // Search for marvel
  await humanType(page, page.getByPlaceholder("Search for movies"), "marvel");
  await humanClick(page, page.getByRole("button", { name: "Search" }));
  await page.locator("//ul/li").first().waitFor({ state: "visible" });
  await pause(page, 2500);

  // Scroll to bottom
  await humanScrollToBottom(page);
  await pause(page, 2000);

  // Scroll back to top
  await humanScroll(page, -99999);
  await pause(page, 2000);

  // Clear search and type harry potter
  await page.getByPlaceholder("Search for movies").fill("");
  await humanType(page, page.getByPlaceholder("Search for movies"), "harry potter");
  await humanClick(page, page.getByRole("button", { name: "Search" }));
  await page.locator("//ul/li").first().waitFor({ state: "visible" });
  await pause(page, 2000);

  // Click the "Sort by year" checkbox
  const sortCheckbox = page.locator("input[type='checkbox'][name='sort']");
  await humanScrollToElement(page, sortCheckbox);
  await pause(page, 800);
  await humanClick(page, sortCheckbox);
  await pause(page, 2000);

  // Scroll 50% down then go back to top
  const scrollAmount = await page.evaluate(() => document.body.scrollHeight * 0.5);
  await humanScroll(page, scrollAmount);
  await pause(page, 2000);
  await humanScroll(page, -scrollAmount);
  await pause(page, 1500);

  await closeTour(context, page, TITLE);
});
