import { test, expect } from "@playwright/test";
import { rest_api_et as project } from "../utils/projects";
import { generateCredentials, generateProduct } from "../utils/random";
import dotenv from "dotenv";
dotenv.config();

const TITLE = project.title;
const URL_PATH = project.projectUrl;
const EMAIL_TEST = process.env.EMAIL_TEST;
const PASSWORD_TEST = process.env.PASSWORD_TEST;
const credentials = generateCredentials();
const product = generateProduct();

test.beforeEach(async ({ page }) => {
  await page.goto(URL_PATH, { waitUntil: "networkidle" });
  // Ensure the page is fully loaded before each test
  await page.waitForLoadState("domcontentloaded");
});

test(`${TITLE} - Test home without logging in`, async ({ page }) => {
  // Wait for the page to fully load by checking for a key element
  await page.waitForLoadState("networkidle");

  // Wait for navigation to be visible with longer timeout
  await expect(page.getByRole("link", { name: "Home" })).toBeVisible({
    timeout: 90000,
  });
  await expect(page.getByRole("link", { name: "Login" })).toBeVisible({
    timeout: 5000,
  });
  await expect(page.getByRole("link", { name: "Register" })).toBeVisible({
    timeout: 5000,
  });

  // Additional verification that the page is in the expected state
  await expect(page).toHaveURL(new RegExp(URL_PATH));
});

test(`${TITLE} - Test register and login`, async ({ page }) => {
  //register
  await page.getByRole("link", { name: "Register" }).click();
  await expect(page.locator("mat-card-title")).toBeVisible();
  await expect(
    page.locator("div").filter({ hasText: "Username" }).nth(1)
  ).toBeVisible();
  await expect(
    page.locator("div").filter({ hasText: "Email" }).nth(1)
  ).toBeVisible();
  await expect(
    page.locator("div").filter({ hasText: "Enter your password" }).nth(1)
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Register" })).toBeVisible();
  await page.locator("div").filter({ hasText: "Username" }).nth(1).click();
  await page.getByLabel("Username").fill(credentials.username);
  await page.locator("div").filter({ hasText: "Email" }).nth(1).click();
  await page.getByLabel("Email").fill(credentials.email);
  await page.locator("div").filter({ hasText: "Enter your" }).nth(1).click();
  await page.getByLabel("Enter your password").fill(PASSWORD_TEST);
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.locator("//div[contains(@class,'success')]")).toBeVisible();

  //login
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  await page.locator("div").filter({ hasText: "Email" }).nth(1).click();
  await page.getByLabel("Email").fill(credentials.email);
  await page
    .locator("div")
    .filter({ hasText: "Enter your password" })
    .nth(1)
    .click();
  await page.getByLabel("Enter your password").fill(PASSWORD_TEST);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(
    page.locator("h1").filter({ hasText: "Products" })
  ).toBeVisible();
});

test(`${TITLE} - Test crud products`, async ({ page }) => {
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  await page.locator("div").filter({ hasText: "Email" }).nth(1).click();
  await page.getByLabel("Email").fill(EMAIL_TEST);
  await page
    .locator("div")
    .filter({ hasText: "Enter your password" })
    .nth(1)
    .click();
  await page.getByLabel("Enter your password").fill(PASSWORD_TEST);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(
    page.locator("h1").filter({ hasText: "Products" })
  ).toBeVisible();

  //get all
  await expect(page.getByRole("button", { name: "Get" })).toBeVisible();
  await page.getByRole("button", { name: "Get" }).click();
  await page.locator("//mat-spinner").waitFor({ state: "hidden" });
  await expect(page.getByRole("button", { name: "Clear" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Description" })
  ).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "User" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Email" })).toBeVisible();
  await expect(page.locator("//table/tbody/tr[1]")).toBeVisible();

  //create
  await expect(page.getByRole("button", { name: "New" })).toBeVisible();
  await page.getByRole("button", { name: "New" }).click();
  await page
    .locator("div")
    .filter({ hasText: /^Name$/ })
    .first()
    .click();
  await page.getByPlaceholder("Name").fill(product.name);
  await page.locator("div").filter({ hasText: "Price$" }).nth(3).click();
  await page.getByPlaceholder("0").fill(product.price);
  await page
    .locator("div")
    .filter({ hasText: /^Description$/ })
    .first()
    .click();
  await page.getByPlaceholder("Description").fill(product.description);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(
    page.locator(
      "//div[contains(@class,'mat-mdc-snack-bar-label mdc-snackbar__label')]"
    )
  ).toHaveText("Created");
  await expect(
    page.locator(
      "//div[contains(@class,'mat-mdc-snack-bar-label mdc-snackbar__label')]"
    )
  ).toBeHidden();

  //update
  await expect(
    page.getByText("Update a Product", { exact: true })
  ).toBeVisible();
  await page
    .locator(
      ".mat-mdc-card-header > .mat-mdc-form-field > .mat-mdc-text-field-wrapper"
    )
    .first()
    .click();
  await page.getByRole("option", { name: product.name }).click();
  await page
    .locator(
      "app-api-card:nth-child(5) > .card-wrapper > .mat-mdc-card > .mat-mdc-card-content > div > .form > mat-form-field:nth-child(3) > .mat-mdc-text-field-wrapper"
    )
    .click();
  await page.locator("#mat-input-7").fill(product.name);
  await page.getByRole("button", { name: "Update" }).click();
  await expect(
    page.locator(
      "//div[contains(@class,'mat-mdc-snack-bar-label mdc-snackbar__label')]"
    )
  ).toHaveText("Updated");
  await expect(
    page.locator(
      "//div[contains(@class,'mat-mdc-snack-bar-label mdc-snackbar__label')]"
    )
  ).toBeHidden();

  //delete
  await expect(
    page.getByText("Delete a Product", { exact: true })
  ).toBeVisible();
  await page
    .locator(
      "app-api-card:nth-child(6) > .card-wrapper > .mat-mdc-card > .mat-mdc-card-header > .mat-mdc-form-field > .mat-mdc-text-field-wrapper"
    )
    .click();
  await page.getByRole("option", { name: product.name }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(
    page.locator(
      "//div[contains(@class,'mat-mdc-snack-bar-label mdc-snackbar__label')]"
    )
  ).toHaveText("Deleted");
});
