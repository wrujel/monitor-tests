import { test } from "@playwright/test";
import { airbnb_clone as project } from "../utils/projects";
import { pause, closeTour, humanScroll, humanScrollToBottom, humanType, humanClick } from "./_tour-utils";
import dotenv from "dotenv";
dotenv.config();

const TITLE = project.title;

test(`tour: ${TITLE}`, async ({ page, context }) => {
  await page.goto(project.projectUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.locator(".p-4").waitFor({ state: "visible", timeout: 60000 });
  await pause(page, 2000);

  await humanScroll(page, 400);
  await pause(page, 1200);

  // open menu and login
  await humanClick(page, page.locator(".p-4"));
  await humanClick(page, page.getByText("Login"));
  await page.locator("#email").waitFor({ state: "visible" });
  await humanType(page, page.locator("#email"), process.env.EMAIL_TEST!);
  await humanType(page, page.locator("#password"), process.env.PASSWORD_TEST!);
  await pause(page, 1000);

  await Promise.all([
    page
      .waitForResponse(
        (res) =>
          (res.url().includes("api") ||
            res.url().includes("login") ||
            res.url().includes("auth")) &&
          [200, 201, 302].includes(res.status()),
      )
      .catch(() => null),
    humanClick(page, page.getByRole("button", { name: "Continue", exact: true })),
  ]);
  await page.getByRole("button", { name: "Continue", exact: true }).waitFor({
    state: "detached",
    timeout: 20000,
  });
  await page.waitForLoadState("networkidle", { timeout: 20000 });
  await pause(page, 2000);

  // show search bar
  await humanClick(
    page,
    page
      .locator("div")
      .filter({ hasText: /^AnywhereAny WeekAdd Guests$/ })
      .first()
  );
  await pause(page, 2000);

  // type Peru into react-select and pick first matching option
  // react-select uses Emotion CSS-in-JS — class names like css-*-menu / css-*-option
  const locationInput = page.locator("input[id*='react-select']");
  await locationInput.waitFor({ state: "visible", timeout: 10000 });
  await humanType(page, locationInput, "Peru");
  await page.locator("[class*='-menu']").waitFor({ state: "visible", timeout: 5000 });
  await pause(page, 800);
  await humanClick(
    page,
    page.locator("[class*='-option']").filter({ hasText: "Peru" }).first()
  );
  await pause(page, 1500);

  // click next twice (date steps)
  await humanClick(page, page.getByRole("button", { name: "Next" }).first());
  await pause(page, 1000);
  await humanClick(page, page.getByRole("button", { name: "Next" }).first());
  await pause(page, 1000);

  // click search
  await humanClick(page, page.getByRole("button", { name: "Search" }).first());
  await page.waitForLoadState("networkidle", { timeout: 20000 });
  await pause(page, 2500);

  // click on first listing card
  const firstCard = page.locator("div.col-span-1.cursor-pointer.group").first();
  await firstCard.waitFor({ state: "visible", timeout: 10000 });
  await humanClick(page, firstCard);
  await page.waitForLoadState("networkidle", { timeout: 20000 });
  await pause(page, 2000);

  // scroll to bottom of detail page
  await humanScrollToBottom(page);
  await pause(page, 2000);

  // click logo img (uses onClick router.push("/"), not an <a> tag)
  await humanClick(page, page.locator("img[alt='logo']").first());
  await page.waitForLoadState("networkidle", { timeout: 20000 });
  await pause(page, 2000);

  await closeTour(context, page, TITLE);
});
