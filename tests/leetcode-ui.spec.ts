import { test, expect } from "@playwright/test";
import { leetcode_ui as project } from "../utils/projects";
import { navigateWithRetry } from "../utils/nav";

const TITLE = project.title;
const URL_PATH = project.projectUrl;

type Page = Parameters<typeof navigateWithRetry>[0];

// Helper: wait for /api/insights - must be registered BEFORE the action that triggers it.
const waitForInsights = (page: Page) =>
  page.waitForResponse(
    (res) => res.url().includes("/api/insights") && res.status() === 200,
    { timeout: 30000 },
  );

// DOM-based: at least one problem row link is visible.
// Safe against rate-limit empty responses; does not rely on "Showing" text.
const waitForProblemRows = async (page: Page) => {
  await expect(page.locator("a[href*='/problem/']").first()).toBeVisible({
    timeout: 30000,
  });
};

test.beforeEach(async ({ page }) => {
  // Clear persisted view state BEFORE navigation so every test starts in list mode.
  await page.addInitScript(() => localStorage.removeItem("dashboard-view"));
  await navigateWithRetry(page, URL_PATH);
});

test(`${TITLE} - Navbar`, async ({ page }) => {
  await expect(page.locator("nav")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /My LeetCode Tracker/i }),
  ).toBeVisible();
  await expect(page.getByText("@wrujel")).toBeVisible();
  await expect(page.getByRole("link", { name: /wrujel\.com/i })).toBeVisible();
});

test(`${TITLE} - Stat cards`, async ({ page }) => {
  const section = page.locator("section").first();
  await expect(section).toBeVisible();
  await expect(page.getByText("Solved").first()).toBeVisible();
  await expect(page.getByText("Easy").first()).toBeVisible();
  await expect(page.getByText("Medium").first()).toBeVisible();
  await expect(page.getByText("Hard").first()).toBeVisible();
});

test(`${TITLE} - View switcher`, async ({ page }) => {
  // Wait for problem rows - confirms React hydrated and data loaded
  await waitForProblemRows(page);

  const listBtn = page
    .locator("button[aria-pressed]")
    .filter({ hasText: /^list$/i });
  const chartsBtn = page
    .locator("button[aria-pressed]")
    .filter({ hasText: /^charts$/i });

  await expect(listBtn).toBeVisible();
  await expect(chartsBtn).toBeVisible();
  await expect(listBtn).toHaveAttribute("aria-pressed", "true");

  // Register BEFORE clicking - then click
  const insightsReq = waitForInsights(page);
  await chartsBtn.click();
  await insightsReq;
  await expect(chartsBtn).toHaveAttribute("aria-pressed", "true");

  // Register BEFORE clicking - then click
  const problemsReq = page.waitForResponse(
    (res) => res.url().includes("/api/problems") && res.status() === 200,
    { timeout: 30000 },
  );
  await listBtn.click();
  await problemsReq;
  await expect(listBtn).toHaveAttribute("aria-pressed", "true");
});

test(`${TITLE} - Problem list`, async ({ page }) => {
  await waitForProblemRows(page);

  await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  await expect(page.getByText("Two sum").first()).toBeVisible();
});

test(`${TITLE} - Difficulty filter`, async ({ page }) => {
  await waitForProblemRows(page);

  const easyFilter = page
    .getByRole("button", { name: "Easy", exact: true })
    .first();

  // Register listener BEFORE clicking the filter
  const filtered = page.waitForResponse(
    (res) => res.url().includes("/api/problems") && res.status() === 200,
    { timeout: 30000 },
  );
  await easyFilter.click();
  await filtered;
  await expect(page.getByText("Easy").first()).toBeVisible();
});

test(`${TITLE} - Search functionality`, async ({ page }) => {
  await waitForProblemRows(page);

  const searchInput = page.getByPlaceholder(/search/i);

  // Register listener BEFORE filling (fill triggers debounced fetch)
  const searched = page.waitForResponse(
    (res) => res.url().includes("/api/problems") && res.status() === 200,
    { timeout: 30000 },
  );
  await searchInput.fill("Two sum");
  await searched;
  await expect(page.getByText("Two sum").first()).toBeVisible();
});

test(`${TITLE} - Pagination`, async ({ page }) => {
  await waitForProblemRows(page);

  const page2Btn = page.getByRole("button", { name: "2", exact: true });
  if (await page2Btn.isVisible()) {
    // Register BEFORE clicking the page button
    const nextPage = page.waitForResponse(
      (res) => res.url().includes("/api/problems") && res.status() === 200,
      { timeout: 30000 },
    );
    await page2Btn.click();
    await nextPage;
    await waitForProblemRows(page);
  }
});

test(`${TITLE} - Problem detail page`, async ({ page }) => {
  await page.goto(`${URL_PATH}/problem/1`);
  await page.waitForLoadState("load");

  await expect(
    page.getByRole("heading", { name: /Two sum/i }).first(),
  ).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("Easy").first()).toBeVisible();

  await expect(
    page.getByRole("heading", { name: /solution/i }).first(),
  ).toBeVisible({ timeout: 10000 });
});

test(`${TITLE} - Problem detail navigation`, async ({ page }) => {
  await page.goto(`${URL_PATH}/problem/1`);
  await page.waitForLoadState("load");

  await expect(
    page.getByRole("heading", { name: /Two sum/i }).first(),
  ).toBeVisible({ timeout: 10000 });

  const nextBtn = page.getByRole("link", { name: /next/i }).first();
  if (await nextBtn.isVisible()) {
    await nextBtn.click();
    await page.waitForLoadState("load");
    await expect(
      page.getByRole("heading", { name: /Add two numbers/i }).first(),
    ).toBeVisible({ timeout: 10000 });
  }
});

test(`${TITLE} - Charts view`, async ({ page }) => {
  await waitForProblemRows(page);

  const chartsBtn = page
    .locator("button[aria-pressed]")
    .filter({ hasText: /^charts$/i });
  await expect(chartsBtn).toBeVisible();

  // Register BEFORE clicking
  const insightsReq = waitForInsights(page);
  await chartsBtn.click();
  await insightsReq;

  await expect(chartsBtn).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".recharts-wrapper").first()).toBeVisible({
    timeout: 15000,
  });
});

test(`${TITLE} - Footer links`, async ({ page }) => {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(
    page.getByRole("link", { name: /github/i }).first(),
  ).toBeVisible();
});

test(`${TITLE} - 404 page`, async ({ page }) => {
  await page.goto(`${URL_PATH}/nonexistent-page-xyz`);
  await page.waitForLoadState("load");
  await expect(page.getByText(/404|not found/i).first()).toBeVisible({
    timeout: 10000,
  });
});
