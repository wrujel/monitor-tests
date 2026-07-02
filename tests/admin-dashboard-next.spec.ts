import { test, expect } from "@playwright/test";
import { admin_dashboard_next as project } from "../utils/projects";
import { navigateWithRetry } from "../utils/nav";

const TITLE = project.title;
const URL = project.projectUrl;

// The redesigned "Nexus" dashboard. These assertions target the app in its
// default demo mode (open dashboard). If real auth is enabled on the deployment
// (MONGO_URI + BETTER_AUTH_SECRET), the dashboard routes redirect to /login and
// a sign-in step would be needed first.

test(`${TITLE} - Login page`, async ({ page }) => {
  await navigateWithRetry(page, `${URL}/login`);
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await expect(page.getByText("Nexus").first()).toBeVisible();
  await expect(page.getByText(/Protected by Better Auth/)).toBeVisible();
});

test(`${TITLE} - Dashboard overview`, async ({ page }) => {
  await navigateWithRetry(page, `${URL}/dashboard`);
  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Products" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Activity" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText("Total Revenue")).toBeVisible();
  await expect(page.getByText("Revenue & profit")).toBeVisible();
  await expect(page.getByText("Recent transactions")).toBeVisible();
});

test(`${TITLE} - Users table`, async ({ page }) => {
  await navigateWithRetry(page, `${URL}/dashboard/users`);
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  await expect(page.getByPlaceholder("Search users…")).toBeVisible();
  await expect(page.getByRole("link", { name: "Add user" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Email" })).toBeVisible();
});

test(`${TITLE} - Products table`, async ({ page }) => {
  await navigateWithRetry(page, `${URL}/dashboard/products`);
  await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
  await expect(page.getByPlaceholder("Search products…")).toBeVisible();
  await expect(page.getByRole("link", { name: "Add product" })).toBeVisible();
});

test(`${TITLE} - Revenue analytics`, async ({ page }) => {
  await navigateWithRetry(page, `${URL}/dashboard/analytics/revenue`);
  await expect(
    page.getByRole("heading", { name: "Revenue", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Revenue by channel")).toBeVisible();
  await expect(page.getByText("Revenue by region")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "30D", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Year" })).toBeVisible();
});
