import { test, Page } from "@playwright/test";
import { admin_dashboard_next as project } from "../utils/projects";
import { pause, humanScroll, closeTour } from "./_tour-utils";

const TITLE = project.title;
const BASE = project.projectUrl;

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

test(`tour: ${TITLE}`, async ({ page, context }) => {
  // Login — split-screen brand panel
  await page.goto(`${BASE}/login`, { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  await pause(page, 2500);

  // Dashboard overview — KPIs, charts, live transactions & activity
  await page.goto(`${BASE}/dashboard`, { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  await pause(page, 1800);
  await revealContent(page, 3);

  // Revenue analytics — range filter, channel/category/region breakdowns
  await page.goto(`${BASE}/dashboard/analytics/revenue`, { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  await pause(page, 1500);
  await revealContent(page, 2);

  // Users — generic data table
  await page.goto(`${BASE}/dashboard/users`, { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  await pause(page, 2200);

  // Products — generic data table
  await page.goto(`${BASE}/dashboard/products`, { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  await pause(page, 2200);

  // Activity — live feed ticking (pause to capture the simulator)
  await page.goto(`${BASE}/dashboard/activity`, { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  await pause(page, 4000);

  await closeTour(context, page, TITLE);
});
