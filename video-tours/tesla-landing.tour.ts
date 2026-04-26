import { test } from "@playwright/test";
import { tesla_landing as project } from "../utils/projects";
import { pause, closeTour } from "./_tour-utils";

const TITLE = project.title;

test(`tour: ${TITLE}`, async ({ page, context }) => {
  await page.goto(project.projectUrl);
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  const viewport = page.viewportSize()!;
  await page.mouse.move(viewport.width / 2, viewport.height / 2);

  // Page uses snap-y snap-mandatory on inner <main> — window scroll has no effect.
  // scrollBy on the container triggers one snap per call.
  for (let i = 0; i < 7; i++) {
    await page.evaluate(() => {
      const container = document.querySelector<HTMLElement>("main.snap-y");
      container?.scrollBy({ top: window.innerHeight, behavior: "smooth" });
    });
    await pause(page, 2200);
  }

  await closeTour(context, page, TITLE);
});
