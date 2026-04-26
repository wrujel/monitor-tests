import { test } from "@playwright/test";
import { github_history as project } from "../utils/projects";
import { pause, closeTour, humanType, humanClick, humanScroll } from "./_tour-utils";

const TITLE = project.title;

test(`tour: ${TITLE}`, async ({ page, context }) => {
  await page.goto(project.projectUrl);
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  // clear default text and type username
  const usernameInput = page.locator("input[type='text']").first();
  await usernameInput.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await humanType(page, usernameInput, "torvalds");
  await pause(page, 800);

  // click repositories button (or press Enter) and wait for list
  const reposButton = page
    .locator("button")
    .filter({ hasText: /repositor|repos|fetch|search|get/i })
    .first();
  const reposButtonVisible = await reposButton.isVisible({ timeout: 3000 }).catch(() => false);
  if (reposButtonVisible) {
    await humanClick(page, reposButton);
  } else {
    await usernameInput.press("Enter");
  }
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => null);
  await page.locator("ul li, [data-repo], .repo-item, #repos option, [class*='repo'], [id*='repo']").first().waitFor({
    state: "visible",
    timeout: 30000,
  });
  await pause(page, 1500);

  // click the first repository and wait for commits to load
  const repoSelector = "ul li, [data-repo], .repo-item, [class*='repo'], [id*='repo']";
  const firstRepo = page.locator(repoSelector).first();
  const firstRepoVisible = await firstRepo.isVisible({ timeout: 5000 }).catch(() => false);
  if (firstRepoVisible) {
    await humanClick(page, firstRepo);
  }
  await page.locator("ul li, .commit, [data-commit], [class*='commit']").nth(2).waitFor({
    state: "visible",
    timeout: 30000,
  }).catch(() => null);
  await pause(page, 1500);

  // scroll to 50% of page height
  const scrollTo50 = await page.evaluate(
    () => (document.body.scrollHeight - window.innerHeight) * 0.5
  );
  await humanScroll(page, scrollTo50);
  await pause(page, 1500);

  // scroll back to top
  await humanScroll(page, -scrollTo50);
  await pause(page, 1000);

  await closeTour(context, page, TITLE);
});
