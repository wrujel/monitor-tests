import { test, expect } from "@playwright/test";
import { portfolio_web as project } from "../utils/projects";
import util from "util";

const TITLE = project.title;
const URL_PATH = project.projectUrl;

test.beforeEach(async ({ page }) => {
  await page.goto(URL_PATH);
});

test(`${TITLE} - Home page`, async ({ page }) => {
  await expect(page.getByRole("link", { name: "CodeDev" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Avatar" })).toBeVisible();
  await expect(page.getByText("Welcome to my digital realm!")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Imagine it, then code it" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Contact" })).toBeVisible();
});

test(`${TITLE} - Sidebar`, async ({ page }) => {
  const LINK_XPATH = "//a//*[contains(text(),'%s')]/../..";
  await expect(page.locator(util.format(LINK_XPATH, "home"))).toBeVisible();
  await expect(page.locator(util.format(LINK_XPATH, "about"))).toBeVisible();
  await expect(page.locator(util.format(LINK_XPATH, "Services"))).toBeVisible();
  await expect(page.locator(util.format(LINK_XPATH, "Projects"))).toBeVisible();
  await expect(
    page.locator(util.format(LINK_XPATH, "customers"))
  ).toBeVisible();
});

test(`${TITLE} - About page`, async ({ page }) => {
  await page.goto(page.url() + "/about", { waitUntil: "load" });
  await expect(page.getByText("Creating webs with ")).toBeVisible();
  await expect(page.getByText("Hello! I'm a passionate web")).toBeVisible();
  await expect(page.getByText("Dedicated to continuous")).toBeVisible();
  await expect(page.getByText("SkillsExperienceEducationAwards")).toBeVisible();
  await expect(page.getByText("Frontend Developer - 2017Full")).toBeVisible();
});

test(`${TITLE} - Services page`, async ({ page }) => {
  await page.goto(page.url() + "/services", { waitUntil: "load" });
  await expect(
    page.getByRole("heading", { name: "My services" })
  ).toBeVisible();
  await expect(page.getByText("Offering a suite of web")).toBeVisible();
  await expect(page.locator(".swiper-pagination")).toBeVisible();
});

test(`${TITLE} - Projects page`, async ({ page }) => {
  await page.goto(page.url() + "/projects", { waitUntil: "load" });
  await expect(
    page.getByRole("heading", { name: "My latest Projects" })
  ).toBeVisible();
  await expect(
    page
      .locator("div")
      .filter({ hasText: /^Local Eats$/ })
      .nth(2)
  ).toBeVisible();
  await expect(
    page
      .locator("div")
      .filter({ hasText: /^Local Eats$/ })
      .nth(2)
  ).toBeVisible();
  await expect(
    page
      .locator("div")
      .filter({ hasText: /^Artisan Gallery$/ })
      .nth(2)
  ).toBeVisible();
});

test(`${TITLE} - Costumers page`, async ({ page }) => {
  await page.goto(page.url() + "/customers", { waitUntil: "load" });
  await expect(page.getByText("Reviews from our customers")).toBeVisible();
  await expect(page.locator(".swiper-pagination")).toBeVisible();
});

test(`${TITLE} - Contact page`, async ({ page }) => {
  await page.goto(page.url() + "/contacts", { waitUntil: "load" });
  await expect(
    page.getByRole("heading", { name: "Let's chat. Tell me about" })
  ).toBeVisible();
  await expect(
    page.locator("div").filter({ hasText: "Send us a messageNameEmail" }).nth(3)
  ).toBeVisible();
});
