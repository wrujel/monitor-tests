import { expect, test } from "@playwright/test";
import { webpage_gpt as project } from "../utils/projects";

const TITLE = project.title;
const URL_PATH = project.projectUrl;

test.beforeEach(async ({ page }) => {
  await page.goto(URL_PATH);
});

test(`${TITLE} - Test project`, async ({ page }) => {
  await page.goto("https://webpage-gpt-wrujels-projects.vercel.app/");
  await expect(page.getByText("Sign in")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Let's Build Something amazing" })
  ).toBeVisible();
  await expect(page.getByText("GPT-4o is a powerful AI model")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The Future is Now and You" })
  ).toBeVisible();
  await expect(page.getByText("With GPT-4, the limits of")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A lot is happening, We are" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Do you want to step in to the" })
  ).toBeVisible();
  await expect(page.getByText("OpenAI © 2015 –")).toBeVisible();
  await expect(page.getByText("This site is protected by")).toBeVisible();
  await expect(page.getByRole("img", { name: "ai" })).toBeVisible();
});
