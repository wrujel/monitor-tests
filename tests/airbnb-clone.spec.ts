import { test, expect } from "@playwright/test";
import { airbnb_clone as project } from "../utils/projects";
import { generateCredentials } from "../utils/random";
import dotenv from "dotenv";
dotenv.config();

const TITLE = project.title;
const URL_PATH = project.projectUrl;
const PASSWORD_TEST = process.env.PASSWORD_TEST;
const GMAIL_TEST = process.env.GMAIL_TEST;
const GITHUB_TEST1 = process.env.GITHUB_TEST1;
const EMAIL_TEST = process.env.EMAIL_TEST;
const credentials = generateCredentials();

test.beforeEach(async ({ page }) => {
  await page.goto(URL_PATH);
});

test(`${TITLE} - Test home without logging in`, async ({ page }) => {
  await page.goto("https://rental-app-delta.vercel.app/");
  await expect(page.getByRole("img", { name: "logo" })).toBeVisible();
  await expect(
    page
      .locator("div")
      .filter({ hasText: /^AnywhereAny WeekAdd Guests$/ })
      .first()
  ).toBeVisible();
  await expect(page.getByText("Airbnb your home")).toBeVisible();
  await expect(page.locator(".p-4")).toBeVisible();
  await expect(
    page.getByText(
      "BeachWindmillsModernCountrysidePoolsIslandsLakeSkiingCastlesCavesCampingArcticDe"
    )
  ).toBeVisible();
  const count = await page.locator("//img[contains(@alt,'Listing')]").count();
  expect(count).toBeGreaterThan(10);
});

test(`${TITLE} - Test email register`, async ({ page }) => {
  await expect(page.locator(".p-4")).toBeVisible();
  await page.locator(".p-4").click();
  await page.getByText("Sign up").click();
  await expect(page.getByText("Welcome to Airbnb")).toBeVisible();
  await expect(page.getByText("Create your account")).toBeVisible();
  await expect(page.locator("#email")).toBeVisible();
  await expect(page.locator("#name")).toBeVisible();
  await expect(page.locator("#password")).toBeVisible();
  await page.locator("#email").click();
  await page.locator("#email").fill(credentials.email);
  await page.locator("#name").click();
  await page.locator("#name").fill(credentials.username);
  await page.locator("#password").click();
  await page.locator("#password").fill(PASSWORD_TEST);
  await expect(
    page.getByRole("button", { name: "Continue", exact: true })
  ).toBeVisible();
  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("register") && res.status() === 200
    ),
    page.getByRole("button", { name: "Continue", exact: true }).click(),
  ]);
  await expect(page.getByText("Login").first()).toBeVisible();
});

test(`${TITLE} - Test gmail login`, async ({ page }) => {
  await page.locator(".p-4").click();
  await page.getByText("Login").click();
  await expect(
    page.getByRole("button", { name: "Continue with Google" })
  ).toBeVisible();
  await expect(page.getByText("Login").first()).toBeVisible();
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await page
    .getByRole("button", { name: "Continue with Google" })
    .waitFor({ state: "detached" });

  //expect google form
  await expect(page.getByLabel("Email or phone")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
  // await page.getByLabel("Email or phone").click();
  // await page.getByLabel("Email or phone").fill(GMAIL_TEST);
  // await page.getByRole("button", { name: "Next" }).click();
  // await page.getByLabel("Enter your password").click();
  // await page.getByLabel("Enter your password").fill(PASSWORD_TEST);
  // await page.getByRole("button", { name: "Next" }).click();
  // await page
  //   .getByRole("button", { name: "Next" })
  //   .waitFor({ state: "detached" });
  // if (await page.locator(".p-4").isVisible()) {
  //   await expect(page.locator(".p-4")).toBeVisible();
  //   await page.locator(".p-4").click();
  //   await expect(page.getByText("My trips")).toBeVisible();
  //   await page.getByText("Logout").click();
  //   await expect(page.getByText("My trips")).not.toBeVisible();
  // }
});

test(`${TITLE} - Test github login`, async ({ page }) => {
  await expect(page.locator(".p-4")).toBeVisible();
  await page.locator(".p-4").click();
  await expect(page.getByText("Login")).toBeVisible();
  await page.getByText("Login").click();
  await expect(
    page.getByRole("button", { name: "Continue with Github" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue with Github" }).click();
  await page.getByRole("button", { name: "Continue with Github" }).waitFor({
    state: "detached",
  });

  //expect github form
  await expect(page.getByText("Sign in to GitHub to continue")).toBeVisible();
  await expect(page.getByLabel("Username or email address")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true })
  ).toBeVisible();
  // if (
  //   await page.getByRole("button", { name: "Sign in", exact: true }).isVisible()
  // ) {
  //   await page.getByLabel("Username or email address").click();
  //   await page.getByLabel("Username or email address").fill(GITHUB_TEST1);
  //   await page.getByLabel("Username or email address").click();
  //   await page.getByLabel("Password").click();
  //   await page.getByLabel("Password").fill(PASSWORD_TEST);
  //   await page.getByRole("button", { name: "Sign in", exact: true }).click();
  //   await page
  //     .getByRole("button", { name: "Sign in", exact: true })
  //     .waitFor({ state: "detached" });
  //   if (await page.getByRole("button", { name: "Ask me later" }).isVisible()) {
  //     await page.getByRole("button", { name: "Ask me later" }).click();
  //     await page.getByRole("button", { name: "Ask me later" }).waitFor({
  //       state: "detached",
  //     });
  //   }
  //   if (await page.getByRole("button", { name: "Authorize" }).isVisible()) {
  //     await page.getByRole("button", { name: "Authorize" }).click();
  //     await page.getByRole("button", { name: "Authorize" }).waitFor({
  //       state: "detached",
  //     });
  //   }
  //   if (await page.locator(".p-4").isVisible()) {
  //     await expect(page.locator(".p-4")).toBeVisible();
  //     await page.locator(".p-4").click();
  //     await expect(page.getByText("My trips")).toBeVisible();
  //     await page.getByText("Logout").click();
  //   }
  // }
});

test(`${TITLE} - Test home logged in`, async ({ page }) => {
  let count = 0;
  do {
    await page.reload();
    await page.locator(".p-4").click();
    await page.getByText("Login").click();
    await page.locator("#email").fill(EMAIL_TEST);
    await page.locator("#password").fill(PASSWORD_TEST);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).waitFor({
      state: "detached",
    });
    count++;
  } while (!(await page.getByText("My trips").isVisible()) && count < 5);

  await expect(page.getByText("My trips")).toBeVisible();
  await expect(page.getByText("My favorites")).toBeVisible();
  await expect(page.getByText("My reservations")).toBeVisible();
  await expect(page.getByText("My properties")).toBeVisible();
  await expect(page.getByText("Airbnb my home")).toBeVisible();
  await page
    .locator("div")
    .filter({ hasText: /^AnywhereAny WeekAdd Guests$/ })
    .first()
    .click();
  await expect(page.getByText("Filters")).toBeVisible();
  await expect(page.getByText("Where do you wanna go?")).toBeVisible();
  await expect(
    page
      .locator("div")
      .filter({ hasText: /^\+− Leaflet$/ })
      .first()
  ).toBeVisible();
});
