import { test, Page } from "@playwright/test";
import { admin_dashboard_next as project } from "../utils/projects";
import { pause, humanScroll, humanClick, closeTour } from "./_tour-utils";

const TITLE = project.title;
const BASE = project.projectUrl;
const EMAIL = process.env.MONITOR_EMAIL ?? "monitor@nexus.test";
const PASSWORD = process.env.MONITOR_PASSWORD ?? "Nexus-Monitor-1!";

// The dashboard scrolls its inner <main> container, not the window, so we hover
// over the content and use wheel scrolling to reveal the dense sections.
async function revealContent(page: Page, downs = 2): Promise<void> {
  await page.mouse.move(960, 420);
  for (let i = 0; i < downs; i++) {
    await humanScroll(page, 650);
    await pause(page, 700);
  }
  await humanScroll(page, -650 * downs);
  await pause(page, 500);
}

// Enter the dashboard from the login page — demo mode has an "Enter dashboard"
// button; configured mode signs in (creating the monitor account on first run).
async function enterApp(page: Page): Promise<void> {
  const enter = page.getByRole("button", { name: "Enter dashboard" });
  if (await enter.isVisible().catch(() => false)) {
    await humanClick(page, enter);
  } else {
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await humanClick(page, page.getByRole("button", { name: "Sign in" }));
    const ok = await page
      .waitForURL(/\/dashboard/, { timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    if (!ok) {
      await page.getByRole("tab", { name: "Create account" }).click();
      await page.getByLabel("Name").fill("Monitor Bot");
      await page.getByLabel("Email").fill(EMAIL);
      await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
      await humanClick(
        page,
        page.getByRole("button", { name: "Create account" }),
      );
    }
  }
  await page.waitForURL(/\/dashboard/, { timeout: 20000 });
}

test(`tour: ${TITLE}`, async ({ page, context }) => {
  // Login — split-screen brand panel
  await page.goto(`${BASE}/login`, { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  await pause(page, 2500);

  // Into the dashboard — the whole board updates live every second
  await enterApp(page);
  await page.waitForLoadState("networkidle");
  await pause(page, 2500);

  // Crank the simulation speed so the live updates pop
  const speed = page.getByRole("button", { name: /Simulation speed/ });
  await humanClick(page, speed);
  await pause(page, 800);
  await humanClick(page, speed);
  await pause(page, 2500);
  await revealContent(page, 3);

  // Revenue analytics — flip the range filter
  await page.goto(`${BASE}/dashboard/analytics/revenue`, { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  await pause(page, 1500);
  await humanClick(page, page.getByRole("button", { name: "Year" }));
  await pause(page, 1800);
  await revealContent(page, 2);

  // Users — generic data table
  await page.goto(`${BASE}/dashboard/users`, { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  await pause(page, 2200);

  // Products — generic data table
  await page.goto(`${BASE}/dashboard/products`, { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  await pause(page, 2200);

  // Activity — live event feed streaming in
  await page.goto(`${BASE}/dashboard/activity`, { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  await pause(page, 4000);

  await closeTour(context, page, TITLE);
});
