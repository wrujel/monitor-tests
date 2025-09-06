import { test, expect } from "@playwright/test";
import { netflix_clone as project } from "../utils/projects";
import { generateCredentials } from "../utils/random";
import dotenv from "dotenv";
dotenv.config();

const TITLE = project.title;
const URL_PATH = project.projectUrl;
const EMAIL_TEST = process.env.EMAIL_TEST;
const PASSWORD_TEST = process.env.PASSWORD_TEST;
const GITHUB_TEST = process.env.GITHUB_TEST;
const GMAIL_TEST = process.env.GMAIL_TEST;
const GMAIL_USERNAME_TEST = process.env.GMAIL_USERNAME_TEST;
const credentials = generateCredentials();

test.beforeEach(async ({ page }) => {
  await page.goto(URL_PATH);
});

test(`${TITLE} - Test home without logging in`, async ({ page }) => {
  await expect(page.getByRole("img", { name: "Logo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  await expect(page.locator(".w-10").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  await expect(page.getByText("Create an account")).toBeVisible();
});

test(`${TITLE} - Test email register`, async ({ page }) => {
  await page.getByText("Create an account").click();
  await expect(page.getByRole("heading", { name: "Register" })).toBeVisible();
  await expect(page.getByLabel("Username")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign up" })).toBeVisible();
  await page.getByLabel("Username").fill(credentials.username);
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(PASSWORD_TEST);
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(
    page.getByRole("heading", { name: "Who is watching" })
  ).toBeVisible();
  await expect(page.getByText(credentials.username)).toBeVisible();
});

test(`${TITLE} - Test google login`, async ({ page }) => {
  await page.locator("#google-login").first().click();

  //expect google form
  // await expect(page.getByLabel("Email or phone")).toBeVisible();
  // await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
  // await expect(page.getByLabel("Email or phone")).toBeVisible();
  // await expect(page.getByText("Sign in", { exact: true })).toBeVisible();
  // await page.getByLabel("Email or phone").click();
  // await page.getByLabel("Email or phone").fill(GMAIL_TEST);
  // await page.getByRole("button", { name: "Next" }).click();
  // await expect(page.getByLabel("Enter your password")).toBeVisible();
  // await page.getByLabel("Enter your password").click();
  // await page.getByLabel("Enter your password").fill(PASSWORD_TEST);
  // await page.getByRole("button", { name: "Next" }).click();
  // await page
  //   .getByRole("button", { name: "Next" })
  //   .waitFor({ state: "detached" });
  // if (
  //   await page.getByRole("heading", { name: "Who is watching" }).isVisible()
  // ) {
  //   await expect(
  //     page.getByRole("heading", { name: "Who is watching" })
  //   ).toBeVisible();
  //   await expect(page.getByText(GMAIL_USERNAME_TEST)).toBeVisible();
  //   await page.getByRole("img", { name: "Avatar" }).click();
  //   await page.getByRole("navigation").getByRole("img").nth(4).click();
  //   await page.getByText("Sign out of Netflix").click();
  //   await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  // }
});

test(`${TITLE} - Test github login`, async ({ page }) => {
  await page.locator("#github-login").click();
  await page
    .locator("div:nth-child(4) > div:nth-child(2)")
    .waitFor({ state: "detached" });

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
  //   await expect(page.getByText("Sign in to GitHub to continue")).toBeVisible();
  //   await expect(page.getByLabel("Username or email address")).toBeVisible();
  //   await expect(page.getByLabel("Password")).toBeVisible();
  //   await expect(
  //     page.getByRole("button", { name: "Sign in", exact: true })
  //   ).toBeVisible();
  //   await page.getByLabel("Username or email address").click();
  //   await page.getByLabel("Username or email address").fill(GITHUB_TEST);
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
  //   if (
  //     await page.getByRole("heading", { name: "Who is watching" }).isVisible()
  //   ) {
  //     await expect(
  //       page.getByRole("heading", { name: "Who is watching" })
  //     ).toBeVisible();
  //     await expect(page.getByText(GITHUB_TEST)).toBeVisible();
  //     await page.getByRole("img", { name: "Avatar" }).click();
  //     await page.getByRole("navigation").getByRole("img").nth(4).click();
  //     await page.getByText("Sign out of Netflix").click();
  //     await expect(
  //       page.getByRole("heading", { name: "Sign In" })
  //     ).toBeVisible();
  //   }
  // }
});

test(`${TITLE} - Test home logged in`, async ({ page }) => {
  // Fill login credentials
  await page.getByLabel("Email").fill(EMAIL_TEST);
  await page.getByLabel("Password").fill(PASSWORD_TEST);

  // Wait for login response and navigation with improved response detection
  await Promise.all([
    page
      .waitForResponse(
        (response) =>
          (response.url().includes("api") ||
            response.url().includes("login") ||
            response.url().includes("auth")) &&
          [200, 201, 302].includes(response.status())
      )
      .catch(() => null), // Don't fail if no specific login response
    page.getByRole("button", { name: "Login" }).click(),
  ]);

  // Wait for profile selection page to load with increased timeout
  await page.waitForLoadState("networkidle", { timeout: 20000 });
  await expect(
    page.getByRole("heading", { name: "Who is watching" })
  ).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("wrujel")).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("img", { name: "Avatar" })).toBeVisible({
    timeout: 10000,
  });

  // Navigate to main app
  await page.getByRole("img", { name: "Avatar" }).click();

  // Wait for main page to load completely with increased timeout
  await page.waitForLoadState("networkidle", { timeout: 20000 });
  await expect(page.getByRole("img", { name: "Logo" })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText("HomeSeriesFilmsNew &")).toBeVisible({
    timeout: 10000,
  });
  await expect(page.locator(".px-4 > div:nth-child(4)")).toBeVisible({
    timeout: 10000,
  });

  // Wait for video content to load with increased timeout
  await expect(page.locator("video")).toBeVisible({ timeout: 25000 });
  await expect(page.locator("p").filter({ hasText: "Action" })).toBeVisible({
    timeout: 10000,
  });
  await expect(page.locator("p").filter({ hasText: "Sci-Fi" })).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByText("Other")).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("button", { name: "More Info" })).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible({
    timeout: 10000,
  });

  // Test more info functionality with increased timeout
  await page.getByRole("button", { name: "More Info" }).click();
  await expect(page.locator(".cursor-pointer").first()).toBeVisible({
    timeout: 10000,
  });
  await page.locator(".cursor-pointer").first().click();

  // Sign out process with increased timeouts
  await page.getByRole("navigation").getByRole("img").nth(4).click();
  await expect(page.getByText("Sign out of Netflix")).toBeVisible({
    timeout: 10000,
  });

  // Wait for sign out to complete with increased timeout
  await Promise.all([
    page.waitForLoadState("networkidle", { timeout: 20000 }),
    page.getByText("Sign out of Netflix").click(),
  ]);

  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible({
    timeout: 15000,
  });
});
