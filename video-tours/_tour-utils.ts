import { Page, Locator, BrowserContext } from "@playwright/test";
import { promises as fs } from "fs";

export const pause = (page: Page, ms: number) => page.waitForTimeout(ms);

function randNormal(mean: number, stdDev: number): number {
  const u1 = Math.random() || Number.EPSILON;
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Smooth scroll by deltaY pixels with natural easing and mouse-wheel steps
export async function humanScroll(
  page: Page,
  deltaY: number,
  options?: { steps?: number; duration?: number }
): Promise<void> {
  const absDelta = Math.abs(deltaY);
  const steps = options?.steps ?? clamp(Math.round(absDelta / 25), 8, 40);
  const duration = options?.duration ?? clamp(absDelta * 0.9, 350, 1400);
  const stepDelay = duration / steps;
  const sign = deltaY > 0 ? 1 : -1;

  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const stepAmount = (easeInOut(t1) - easeInOut(t0)) * absDelta;
    await page.mouse.wheel(0, sign * stepAmount);
    const jitter = (Math.random() - 0.5) * stepDelay * 0.25;
    await page.waitForTimeout(Math.max(0, stepDelay + jitter));
  }
}

// Scroll to the bottom of the page smoothly
export async function humanScrollToBottom(page: Page): Promise<void> {
  const scrollNeeded = await page.evaluate(
    () => document.body.scrollHeight - window.innerHeight - window.scrollY
  );
  if (scrollNeeded > 10) {
    await humanScroll(page, scrollNeeded);
  }
  await page.waitForTimeout(clamp(randNormal(500, 100), 300, 800));
}

// Scroll to bring an element into view with natural motion
export async function humanScrollToElement(
  page: Page,
  locator: Locator | string
): Promise<void> {
  const el = typeof locator === "string" ? page.locator(locator) : locator;
  const scrollNeeded = await el.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const vh = window.innerHeight;
    if (rect.top >= 50 && rect.bottom <= vh - 50) return 0;
    return rect.top + rect.height / 2 - vh / 2;
  });
  if (Math.abs(scrollNeeded) > 10) {
    await humanScroll(page, scrollNeeded);
  }
  await page.waitForTimeout(clamp(randNormal(400, 80), 200, 650));
}

// Type text character by character with natural cadence (~70 WPM default)
export async function humanType(
  page: Page,
  locator: Locator | string,
  text: string,
  options?: { wpm?: number }
): Promise<void> {
  const el = typeof locator === "string" ? page.locator(locator) : locator;
  await el.click({ force: true });
  await page.waitForTimeout(clamp(randNormal(180, 50), 80, 350));

  const wpm = options?.wpm ?? 170;
  const msPerChar = 60000 / (wpm * 5);

  for (const char of text) {
    await page.keyboard.type(char);
    const isHesitation = Math.random() < 0.04;
    const delay = isHesitation
      ? clamp(randNormal(msPerChar * 4, msPerChar), msPerChar * 2, msPerChar * 7)
      : clamp(randNormal(msPerChar, msPerChar * 0.4), msPerChar * 0.25, msPerChar * 2.5);
    await page.waitForTimeout(delay);
  }
}

// Move mouse to element center (with slight natural offset) and click
export async function humanClick(
  page: Page,
  locator: Locator | string,
  options?: { hoverMs?: number }
): Promise<void> {
  const el = typeof locator === "string" ? page.locator(locator) : locator;
  const box = await el.boundingBox();
  if (!box) {
    await el.click();
    return;
  }
  const x = box.x + box.width / 2 + (Math.random() - 0.5) * Math.min(box.width * 0.25, 8);
  const y = box.y + box.height / 2 + (Math.random() - 0.5) * Math.min(box.height * 0.25, 5);
  await page.mouse.move(x, y, { steps: clamp(Math.round(randNormal(18, 5)), 8, 30) });
  const hoverMs = options?.hoverMs ?? clamp(randNormal(160, 55), 70, 380);
  await page.waitForTimeout(hoverMs);
  await page.mouse.click(x, y);
}

// End a tour with a safety buffer, then close context and save the video
export async function closeTour(
  context: BrowserContext,
  page: Page,
  title: string,
  bufferMs = 3000
): Promise<void> {
  await page.waitForTimeout(bufferMs);
  await context.close();
  await saveVideo(page, title);
}

export async function saveVideo(page: Page, title: string): Promise<void> {
  await fs.mkdir("videos", { recursive: true });
  const video = page.video();
  if (!video) return;

  const uuidPath = await video.path();
  const rawPath = `videos/${title}.raw.webm`;

  await video.saveAs(rawPath);
  if (uuidPath !== rawPath) {
    await fs.unlink(uuidPath).catch(() => {});
  }
}
