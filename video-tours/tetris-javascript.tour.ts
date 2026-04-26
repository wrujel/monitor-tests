import { test, Page } from "@playwright/test";
import { tetris_javascript as project } from "../utils/projects";
import { pause, closeTour, humanClick } from "./_tour-utils";

const TITLE = project.title;

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Simulate one Tetris piece: rotate 0-2 times, shift left/right, then drop
async function playPiece(page: Page): Promise<void> {
  const rotations = rand(0, 2);
  for (let i = 0; i < rotations; i++) {
    await page.keyboard.press("ArrowUp");
    await pause(page, rand(80, 160));
  }

  const direction = Math.random() < 0.5 ? "ArrowLeft" : "ArrowRight";
  const moves = rand(0, 4);
  for (let i = 0; i < moves; i++) {
    await page.keyboard.press(direction);
    await pause(page, rand(60, 140));
  }

  // Sometimes soft-drop a bit before hard-dropping
  if (Math.random() < 0.4) {
    const softDrops = rand(2, 6);
    for (let i = 0; i < softDrops; i++) {
      await page.keyboard.press("ArrowDown");
      await pause(page, rand(40, 100));
    }
  }

  // Hard drop with Space
  await page.keyboard.press("Space");

  // Brief pause before the next piece spawns
  await pause(page, rand(300, 600));
}

test(`tour: ${TITLE}`, async ({ page, context }) => {
  await page.goto(project.projectUrl);
  await page.waitForLoadState("networkidle");
  await pause(page, 2000);

  await humanClick(page, page.getByText("Start Game"));
  await page.locator("canvas").waitFor({ state: "visible" });
  await pause(page, 1500);

  // Play ~20 pieces — roughly 40–50 seconds of realistic gameplay
  for (let piece = 0; piece < 20; piece++) {
    await playPiece(page);
  }

  await pause(page, 2000);
  await closeTour(context, page, TITLE);
});
