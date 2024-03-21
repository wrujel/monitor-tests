import { test, expect } from "@playwright/test";
import { movies_search as project } from "../utils/projects";

const TITLE = project.title;
const URL_PATH = project.projectUrl;

test.beforeEach(async ({ page }) => {
  await page.goto(URL_PATH);
});

test(`${TITLE} - Test page`, async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Movie Search" })
  ).toBeVisible();
  await expect(page.getByPlaceholder("Search for movies")).toBeVisible();
  await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
  await expect(page.getByText("No movies found!")).toBeVisible();
  await expect(page.getByText("Sort by year")).toBeVisible();
  await expect(page.getByPlaceholder("Search for movies")).toBeEmpty();
});

test(`${TITLE} - Test search`, async ({ page }) => {
  await page.getByPlaceholder("Search for movies").fill("marvel");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.locator("//ul/li").first()).toBeVisible();
});
