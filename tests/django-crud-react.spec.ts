import { test, expect } from "@playwright/test";
import { django_crud_react as project } from "../utils/projects";

const TITLE = project.title;
const URL_PATH = project.projectUrl;

test.beforeEach(async ({ page }) => {
  await page.goto(URL_PATH);
});

test(`${TITLE} - Test home`, async ({ page }) => {
  await expect(page.getByRole("link", { name: "Task App" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add Task" })).toBeVisible();
});

test(`${TITLE} - Test create new task`, async ({ page }) => {
  await page.getByRole("button", { name: "Add Task" }).click();
  await expect(page.getByPlaceholder("Title")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  await page.getByPlaceholder("Title").click();
  await page.getByPlaceholder("Title").fill("Test");
  await page.getByPlaceholder("Description").click();
  await page.getByPlaceholder("Description").fill("test");
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByPlaceholder("Title").press("CapsLock");
});
