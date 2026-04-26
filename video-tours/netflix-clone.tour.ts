import { test } from "@playwright/test";
import { netflix_clone as project } from "../utils/projects";
import { pause, closeTour, humanScroll, humanScrollToBottom, humanScrollToElement, humanType, humanClick } from "./_tour-utils";
import dotenv from "dotenv";
dotenv.config();

const TITLE = project.title;

test(`tour: ${TITLE}`, async ({ page, context }) => {
  await page.goto(project.projectUrl);
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  await humanType(page, page.getByLabel("Email"), process.env.EMAIL_TEST!);
  await humanType(page, page.getByLabel("Password"), process.env.PASSWORD_TEST!);
  await pause(page, 1000);

  await Promise.all([
    page
      .waitForResponse(
        (response) =>
          (response.url().includes("api") ||
            response.url().includes("login") ||
            response.url().includes("auth")) &&
          [200, 201, 302].includes(response.status()),
      )
      .catch(() => null),
    humanClick(page, page.getByRole("button", { name: "Login" })),
  ]);

  await page.waitForLoadState("networkidle", { timeout: 20000 });
  await page
    .getByRole("heading", { name: "Who is watching" })
    .waitFor({ state: "visible", timeout: 20000 });
  await pause(page, 2500);

  await humanClick(page, page.getByRole("img", { name: "Avatar" }));
  await page.waitForLoadState("networkidle", { timeout: 20000 });
  await pause(page, 3000);

  // scroll to the bottom of the page
  await humanScrollToBottom(page);
  await pause(page, 2000);

  // scroll back up to browse cards
  await humanScroll(page, -1500);
  await pause(page, 1000);

  // hover over cards in the Action section to show preview popups
  // cards are direct div children of the .grid inside each section
  const container = page.locator(".space-y-8");
  const actionSection = container.locator("> div").filter({
    has: page.locator("p", { hasText: /^Action$/ }),
  });
  const actionCards = actionSection.locator(".grid > div");
  for (let i = 0; i < 3; i++) {
    await actionCards.nth(i).hover();
    await pause(page, 1000);
  }

  // scroll to the Sci-Fi section
  const sciFiSection = container.locator("> div").filter({
    has: page.locator("p", { hasText: /^Sci-Fi$/ }),
  });
  await humanScrollToElement(page, sciFiSection);
  await pause(page, 800);

  // hover the 3rd Sci-Fi card and stay there
  const thirdCard = sciFiSection.locator(".grid > div").nth(2);
  await thirdCard.hover();
  await pause(page, 1500);

  // click the chevron (last div.rounded-full inside the hover panel) to open the modal
  // it is a div, not a button — the 3 circular controls are: play, add(+), chevron(v)
  await humanClick(page, thirdCard.locator("div.rounded-full").last());
  await pause(page, 2000);

  // click Play inside the modal — scoped to the modal overlay to avoid the hero Play button
  await humanClick(page, page.locator(".z-50.fixed button", { hasText: "Play" }));
  await pause(page, 7000);

  // click the back arrow SVG in the player nav to return (modal will still be open)
  await humanClick(page, page.locator("nav svg").first());
  await page.waitForLoadState("networkidle", { timeout: 15000 });
  await pause(page, 1500);

  // click X to close the modal (div.absolute.top-3.right-3)
  await humanClick(page, page.locator(".absolute.top-3.right-3"));
  await pause(page, 1500);

  // sign out
  await humanClick(page, page.getByRole("navigation").getByRole("img").nth(4));
  await page.getByText("Sign out of Netflix").waitFor({ state: "visible" });
  await Promise.all([
    page.waitForLoadState("networkidle", { timeout: 20000 }),
    humanClick(page, page.getByText("Sign out of Netflix")),
  ]);
  await pause(page, 1500);

  await closeTour(context, page, TITLE);
});
