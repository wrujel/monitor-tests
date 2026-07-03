import { test, expect, Page } from "@playwright/test";
import { admin_dashboard_next as project } from "../utils/projects";
import { navigateWithRetry } from "../utils/nav";

const TITLE = project.title;
const URL = project.projectUrl;

// A monitor account used when the deployment runs with real auth enabled.
// Override via env if you provisioned a specific account.
const EMAIL = process.env.MONITOR_EMAIL ?? "monitor@nexus.test";
const PASSWORD = process.env.MONITOR_PASSWORD ?? "Nexus-Monitor-1!";

/**
 * Get into the dashboard regardless of deployment mode:
 * - Demo mode (no MONGO_URI/secret): the login page offers an "Enter dashboard"
 *   button — just click it.
 * - Configured mode: sign in with the monitor account, creating it on first run.
 */
async function authenticate(page: Page): Promise<void> {
  await navigateWithRetry(page, `${URL}/login`);

  const enter = page.getByRole("button", { name: "Enter dashboard" });
  if (await enter.isVisible().catch(() => false)) {
    await enter.click();
    await page.waitForURL(/\/dashboard/, { timeout: 20000 });
    return;
  }

  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  const signedIn = await page
    .waitForURL(/\/dashboard/, { timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  if (signedIn) return;

  // First run (or missing account) — create it, which auto-signs in.
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Monitor Bot");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20000 });
}

test(`${TITLE} - Login page`, async ({ page }) => {
  await navigateWithRetry(page, `${URL}/login`);
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await expect(page.getByText("Nexus").first()).toBeVisible();
  await expect(page.getByText(/Protected by Better Auth/)).toBeVisible();
});

test(`${TITLE} - Dashboard, tables & analytics`, async ({ page }) => {
  await authenticate(page);

  // Overview
  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText("Total Revenue")).toBeVisible();
  await expect(page.getByText("Revenue & profit")).toBeVisible();

  // Live simulation controls (start/pause + speed cycle)
  await expect(
    page.getByRole("button", { name: "Pause live simulation" }),
  ).toBeVisible();
  const speed = page.getByRole("button", { name: /Simulation speed/ });
  await expect(speed).toHaveText("1×");
  await speed.click();
  await expect(speed).toHaveText("2×");

  // Users table
  await page.getByRole("link", { name: "Users" }).click();
  await expect(
    page.getByRole("heading", { name: "Users", level: 2 }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("Search users…")).toBeVisible();
  await expect(page.getByRole("link", { name: "Add user" })).toBeVisible();

  // Products table
  await page.getByRole("link", { name: "Products" }).click();
  await expect(
    page.getByRole("heading", { name: "Products", level: 2 }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("Search products…")).toBeVisible();

  // Revenue analytics (via the Analytics accordion)
  await page.getByRole("button", { name: "Analytics" }).click();
  await page.getByRole("link", { name: "Revenue" }).click();
  await expect(
    page.getByRole("heading", { name: "Revenue", exact: true, level: 2 }),
  ).toBeVisible();
  await expect(page.getByText("Revenue by channel")).toBeVisible();
  await expect(page.getByRole("button", { name: "Year" })).toBeVisible();
});
