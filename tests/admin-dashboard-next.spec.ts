import { test, expect } from "@playwright/test";
import { adminDashboardNextProject } from "../src/constants";

const TITLE = adminDashboardNextProject.title;
const URL_PATH = adminDashboardNextProject.projectUrl;

test.beforeEach(async ({ page }) => {
  await page.goto(URL_PATH);
});

test(`${TITLE} - Test sidebar and search`, async ({ page }) => {
  await await expect(page.getByText("Admin", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Products" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Help" })).toBeVisible();
  await expect(page.getByPlaceholder("Search...")).toBeVisible();
});

test(`${TITLE} - Test dashboard page`, async ({ page }) => {
  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByText("Total Users").first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Latest Transactions" })
  ).toBeVisible();
  await expect(
    page
      .getByRole("row", { name: "Avatar John Doe Pending 23.01.2024 $" })
      .locator("div")
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Weekly Recap" })
  ).toBeVisible();
  await expect(page.getByText("🔥 Available Now")).toBeVisible();
  await expect(page.getByRole("img", { name: "Rocket" })).toBeVisible();
});

test(`${TITLE} - Test users page`, async ({ page }) => {
  await page.getByRole("link", { name: "Users" }).click();
  await expect(
    page.locator("div").filter({ hasText: /^Admin$/ })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "View" }).first()
  ).toBeVisible();
});

test(`${TITLE} - Test products page`, async ({ page }) => {
  await page.getByRole("link", { name: "Products" }).click();
  await expect(page.getByText("Camera", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "A professional-grade DSLR" })
  ).toBeVisible();
});
