import { test } from "@playwright/test";
import { leetcode_ui as project } from "../utils/projects";
import { navigateWithRetry } from "../utils/nav";
import { pause, closeTour, humanScrollToBottom, humanType, humanClick } from "./_tour-utils";

const TITLE = project.title;

test(`tour: ${TITLE}`, async ({ page, context }) => {
  await page.addInitScript(() => localStorage.removeItem("dashboard-view"));
  await navigateWithRetry(page, project.projectUrl);

  // wait for problem rows to confirm data loaded
  await page.locator("a[href*='/problem/']").first().waitFor({
    state: "visible",
    timeout: 30000,
  });
  await pause(page, 2000);

  // search for a problem
  const searchInput = page.getByPlaceholder(/search/i);
  const searched = page.waitForResponse(
    (res) => res.url().includes("/api/problems") && res.status() === 200,
    { timeout: 30000 },
  );
  await humanType(page, searchInput, "Two sum");
  await searched;
  await pause(page, 1500);

  // clear search
  const cleared = page.waitForResponse(
    (res) => res.url().includes("/api/problems") && res.status() === 200,
    { timeout: 30000 },
  );
  await searchInput.clear();
  await cleared;
  await page.locator("a[href*='/problem/']").first().waitFor({
    state: "visible",
    timeout: 30000,
  });
  await pause(page, 1000);

  // navigate to problem detail
  await page.goto(`${project.projectUrl}/problem/1`);
  await page.waitForLoadState("load");
  await pause(page, 2000);

  // go back to list
  await page.goBack();
  await page.locator("a[href*='/problem/']").first().waitFor({
    state: "visible",
    timeout: 30000,
  });
  await pause(page, 1000);

  // switch to charts view
  const chartsBtn = page
    .locator("button[aria-pressed]")
    .filter({ hasText: /^charts$/i });
  const insightsReq = page.waitForResponse(
    (res) => res.url().includes("/api/insights") && res.status() === 200,
    { timeout: 30000 },
  );
  await humanClick(page, chartsBtn);
  await insightsReq;
  await pause(page, 2000);

  // scroll to footer
  await humanScrollToBottom(page);
  await pause(page, 1500);

  await closeTour(context, page, TITLE);
});
