import { test } from "@playwright/test";
import { rest_api_et as project } from "../utils/projects";
import { navigateWithRetry } from "../utils/nav";
import { generateProduct } from "../utils/random";
import { pause, closeTour, humanType, humanClick } from "./_tour-utils";
import dotenv from "dotenv";
dotenv.config();

const TITLE = project.title;
const product = generateProduct();
const updatedProduct = generateProduct();

// Render free tier can take up to 5 min to spin up
test.setTimeout(10 * 60 * 1000);

test(`tour: ${TITLE}`, async ({ page, context }) => {
  await navigateWithRetry(page, project.projectUrl);
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  // logout if already logged in
  const isLoggedIn = await page
    .locator("h1")
    .filter({ hasText: "Products" })
    .isVisible();
  if (isLoggedIn) {
    await humanClick(page, page.getByRole("link", { name: "Logout" }));
    await page.waitForLoadState("networkidle");
    await pause(page, 1000);
  }

  // login with existing account
  await page.getByLabel("Email").waitFor({ state: "visible", timeout: 90000 });
  await humanType(page, page.getByLabel("Email"), process.env.EMAIL_TEST!);
  await humanType(
    page,
    page.getByLabel("Enter your password"),
    process.env.PASSWORD_TEST!,
  );
  await pause(page, 1000);
  await humanClick(page, page.getByRole("button", { name: "Log in" }));

  await page.locator("h1").filter({ hasText: "Products" }).waitFor({
    state: "visible",
    timeout: 30000,
  });
  await pause(page, 2000);

  // load products list — unlocks the Update and Delete cards
  await humanClick(page, page.getByRole("button", { name: "Get" }));
  await page.locator("//mat-spinner").waitFor({ state: "hidden" });
  await pause(page, 2000);

  // create a product
  await humanClick(page, page.getByRole("button", { name: "New" }));
  await humanType(page, page.getByPlaceholder("Name"), product.name);
  await humanType(page, page.getByPlaceholder("0"), product.price);
  await humanType(
    page,
    page.getByPlaceholder("Description"),
    product.description,
  );
  await pause(page, 1500);
  await humanClick(page, page.getByRole("button", { name: "Create" }));
  await page
    .locator(
      "//div[contains(@class,'mat-mdc-snack-bar-label mdc-snackbar__label')]",
    )
    .waitFor({ state: "visible" });
  await pause(page, 2000);
  // create auto-refreshes the list; wait for spinner to finish
  await page.locator("//mat-spinner").waitFor({ state: "hidden" });

  // update the created product — select from dropdown in the Update card
  const updateCard = page
    .locator("app-api-card")
    .filter({ hasText: "Update a Product" });
  await updateCard.scrollIntoViewIfNeeded();
  await pause(page, 500);
  await updateCard.locator("mat-select").click();
  await page
    .getByRole("option", { name: product.name, exact: true })
    .waitFor({ state: "visible" });
  await page.getByRole("option", { name: product.name, exact: true }).click();
  await pause(page, 1000);
  await updateCard.getByPlaceholder("Name").waitFor({ state: "visible" });
  await updateCard.getByPlaceholder("Name").click({ clickCount: 3 });
  await updateCard.getByPlaceholder("Name").fill("");
  await humanType(
    page,
    updateCard.getByPlaceholder("Name"),
    updatedProduct.name,
  );
  await updateCard.getByPlaceholder("0").click({ clickCount: 3 });
  await updateCard.getByPlaceholder("0").fill("");
  await humanType(
    page,
    updateCard.getByPlaceholder("0"),
    updatedProduct.price,
  );
  await pause(page, 1500);
  await humanClick(page, updateCard.getByRole("button", { name: "Update" }));
  await page
    .locator(
      "//div[contains(@class,'mat-mdc-snack-bar-label mdc-snackbar__label')]",
    )
    .waitFor({ state: "visible" });
  await pause(page, 2000);
  // update auto-refreshes the list; wait for spinner
  await page.locator("//mat-spinner").waitFor({ state: "hidden" });

  // delete the updated product — select from dropdown in the Delete card
  const deleteCard = page
    .locator("app-api-card")
    .filter({ hasText: "Delete a Product" });
  await deleteCard.scrollIntoViewIfNeeded();
  await pause(page, 500);
  await deleteCard.locator("mat-select").click();
  await page
    .getByRole("option", { name: updatedProduct.name, exact: true })
    .waitFor({ state: "visible" });
  await page.getByRole("option", { name: updatedProduct.name, exact: true }).click();
  await pause(page, 1000);
  await humanClick(page, deleteCard.getByRole("button", { name: "Delete" }));
  await page
    .locator(
      "//div[contains(@class,'mat-mdc-snack-bar-label mdc-snackbar__label')]",
    )
    .waitFor({ state: "visible" });
  await pause(page, 2000);

  // logout
  await humanClick(page, page.getByRole("link", { name: "Logout" }));
  await page.waitForLoadState("networkidle");
  await pause(page, 1000);

  await closeTour(context, page, TITLE);
});
