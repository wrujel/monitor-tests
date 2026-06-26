import { test, expect } from "@playwright/test";
import { movies_search as project } from "../utils/projects";
import { navigateWithRetry } from "../utils/nav";

const TITLE = project.title;
const URL_PATH = project.projectUrl;

test.beforeEach(async ({ page }) => {
  await navigateWithRetry(page, URL_PATH);
});

test(`${TITLE} - Test page`, async ({ page }) => {
  // Hero + intro
  await expect(
    page.getByRole("heading", { name: /Discover your next/i }),
  ).toBeVisible();
  await expect(page.getByText("Powered by OMDB")).toBeVisible();

  // Search box renders, is empty, and no result cards are shown yet
  const search = page.getByLabel("Search for movies");
  await expect(search).toBeVisible();
  await expect(search).toHaveValue("");
  await expect(page.getByRole("listitem")).toHaveCount(0);
});

test(`${TITLE} - Test search`, async ({ page }) => {
  // Debounced search — typing alone triggers the request (no submit button)
  await page.getByLabel("Search for movies").fill("marvel");

  // Results resolve into a grid of cards, each carrying a favourite toggle
  await expect(
    page.getByRole("button", { name: /favourites/i }).first(),
  ).toBeVisible({ timeout: 15000 });
  expect(await page.getByRole("listitem").count()).toBeGreaterThan(0);

  // The filter toolbar only appears once results are shown
  await expect(page.getByText("Filters")).toBeVisible();
});

test(`${TITLE} - Test movie details modal`, async ({ page }) => {
  await page.getByLabel("Search for movies").fill("batman");

  const firstCard = page.getByRole("listitem").first();
  await expect(firstCard).toBeVisible({ timeout: 15000 });

  // Dismiss the autocomplete dropdown, then open the card's details modal
  await page.keyboard.press("Escape");
  await firstCard.getByRole("button").first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: /favourites/i })).toBeVisible(
    { timeout: 15000 },
  );

  // Close it again
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
});
