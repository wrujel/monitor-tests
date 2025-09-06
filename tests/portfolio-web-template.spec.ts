import { test, expect } from '@playwright/test';
import { portfolio_web_template as project } from "../utils/projects";
    
const TITLE = project.title;
const URL_PATH = project.projectUrl;
    
test.beforeEach(async ({ page }) => {
  await page.goto(URL_PATH);
});
    
test(`${TITLE} - Test project`, async ({ page }) => {
  // add code here
});