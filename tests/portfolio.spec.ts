import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import { portfolio as project } from "../utils/projects";

dotenv.config();

const TITLE = project.title;
const URL_PATH = project.projectUrl;

test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({
    [process.env.HTTP_HEADER ?? ""]: process.env.HTTP_HEADER_VALUE ?? "",
  });
  await page.goto(URL_PATH);
});

test(`${TITLE} - Hero section`, async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Software Engineer based in Latam" }),
  ).toBeVisible();
  await expect(page.getByText("Hi! I'm Wilfredo Rujel")).toBeVisible();
  await expect(page.getByRole("button", { name: /Contact/i })).toBeVisible();
  await expect(page.getByText("Resume", { exact: true }).first()).toBeVisible();
});

test(`${TITLE} - Navbar links`, async ({ page }) => {
  await expect(
    page.locator("nav").getByRole("menuitem", { name: "About" }).first(),
  ).toBeVisible();
  await expect(
    page.locator("nav").getByRole("menuitem", { name: "Projects" }).first(),
  ).toBeVisible();
  await expect(
    page.locator("nav").getByRole("menuitem", { name: "Skills" }).first(),
  ).toBeVisible();
  await expect(
    page.locator("nav").getByRole("menuitem", { name: "LeetCode" }).first(),
  ).toBeVisible();
  await expect(
    page.locator("nav").getByRole("menuitem", { name: "Services" }).first(),
  ).toBeVisible();
});

test(`${TITLE} - About section`, async ({ page }) => {
  await page.locator("#about").scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "About Me" })).toBeVisible();
  await expect(page.getByText("Introduction")).toBeVisible();
  await expect(page.getByText(/Full stack Engineer/i).first()).toBeVisible();
});

test(`${TITLE} - Projects section`, async ({ page }) => {
  await page.locator("#projects").scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("heading", { name: "My top projects" }),
  ).toBeVisible();
  await expect(page.getByText("My Portfolio")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /View more projects/i }),
  ).toBeVisible();
});

test(`${TITLE} - Skills section`, async ({ page }) => {
  await page.locator("#skills").scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("heading", { name: "Skills & Technologies" }),
  ).toBeVisible();
  await expect(page.getByText("My Expertise")).toBeVisible();
});

test(`${TITLE} - LeetCode section`, async ({ page }) => {
  await page.locator("#leetcode").scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: /LeetCode/i })).toBeVisible();
});

test(`${TITLE} - Services section`, async ({ page }) => {
  await page.locator("#services").scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("heading", { name: "My Services" }),
  ).toBeVisible();
  await expect(page.getByText("What I offer")).toBeVisible();
});

test(`${TITLE} - Contact section`, async ({ page }) => {
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("heading", { name: "Get in Touch" }),
  ).toBeVisible();
  await expect(page.getByText("Connect with me")).toBeVisible();
  await expect(page.getByLabel("Name")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
});

test(`${TITLE} - Footer`, async ({ page }) => {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(
    page.getByText(/Crafting products that feel simple/i),
  ).toBeVisible();
  await expect(
    page.getByText(/Wilfredo Rujel. All rights reserved./i),
  ).toBeVisible();
});

test(`${TITLE} - Projects page`, async ({ page }) => {
  await page.goto(`${URL_PATH}/projects`);
  await expect(
    page.getByRole("heading", { name: "My Projects" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Back to home/i }).last(),
  ).toBeVisible();
});

test(`${TITLE} - Locale - Spanish`, async ({ page }) => {
  await page.goto(`${URL_PATH}/es`);
  await expect(page).toHaveURL(/\/es/);
  await expect(
    page.getByRole("heading", {
      name: "Ingeniero de Software con sede en Latam",
    }),
  ).toBeVisible();
});
