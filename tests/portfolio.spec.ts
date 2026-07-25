import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import { portfolio as project } from "../utils/projects";
import { navigateWithRetry } from "../utils/nav";

dotenv.config();

const TITLE = project.title;
const URL_PATH = project.projectUrl;
const ORIGIN = new URL(URL_PATH).origin;

/**
 * Add the WAF bypass headers to same-origin requests ONLY.
 * setExtraHTTPHeaders would also stamp them on the cross-origin fetch to the
 * LeetCode insights API, turning it into a preflighted CORS request that the
 * API rejects — the stats then render their "unable to load" fallback.
 */
const applyBypassHeaders = async (page: import("@playwright/test").Page) => {
  if (!process.env.HTTP_HEADER || !process.env.HTTP_HEADER_VALUE) return;
  await page.route(`${ORIGIN}/**`, async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        [process.env.HTTP_HEADER!]: process.env.HTTP_HEADER_VALUE!,
        "x-vercel-set-bypass-cookie": "samesitenone",
      },
    });
  });
};

test.beforeEach(async ({ page }) => {
  // Mask automation fingerprints before any navigation so Vercel WAF
  // bot detection doesn't flag the headless browser.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  await applyBypassHeaders(page);

  await navigateWithRetry(page, URL_PATH);
});

/* ─────────────── HOME PAGE ─────────────────────────────── */

test(`${TITLE} - Hero section`, async ({ page }) => {
  const hero = page.locator("#top");
  await expect(
    page.getByRole("heading", {
      name: "Software Engineer based in Latam",
      level: 1,
    }),
  ).toBeVisible();
  await expect(hero.getByText("Hi! I'm Wilfredo Rujel")).toBeVisible();
  await expect(
    hero.getByRole("button", { name: /Contact/i }).first(),
  ).toBeVisible();
  // The resume button exposes no accessible name (icon + text node), match text
  await expect(hero.getByText("Resume", { exact: true }).first()).toBeVisible();
  // Location chip links out to the interactive 3D globe page
  await expect(
    hero.getByRole("link", { name: /view on interactive globe/i }),
  ).toHaveAttribute("href", /\/about\/location$/);
});

test(`${TITLE} - Navbar links`, async ({ page }) => {
  const nav = page.locator("nav#navbar");
  // Menu items are labelled "Navigate to <section>" — getByRole matches on a
  // case-insensitive substring, so the plain section name is enough.
  const sections = [
    "About",
    "Projects",
    "Case Studies",
    "Skills",
    "LeetCode",
    "Services",
  ];
  for (const section of sections) {
    await expect(
      nav.getByRole("menuitem", { name: section }).first(),
    ).toBeVisible();
  }
  await expect(nav.getByText("My Blog").first()).toBeVisible();
  await expect(
    nav.getByRole("button", { name: /Switch to (dark|light) mode/i }),
  ).toBeVisible();
});

test(`${TITLE} - About section`, async ({ page }) => {
  const about = page.locator("#about");
  await about.scrollIntoViewIfNeeded();
  await expect(
    about.getByRole("heading", { name: "About Me", level: 2 }),
  ).toBeVisible();
  await expect(about.getByText("Introduction")).toBeVisible();
  await expect(about.getByText(/Full stack Engineer/i).first()).toBeVisible();
  // Experience / education / award highlight cards
  const highlights = about.getByRole("list", { name: "About me highlights" });
  await expect(highlights.getByRole("listitem")).not.toHaveCount(0);
  await expect(
    about.getByRole("heading", { name: "Top skills", level: 4 }),
  ).toBeVisible();
  // Deep link to the full bio page
  await expect(
    about.getByRole("link", { name: "More about me" }),
  ).toHaveAttribute("href", "/about");
});

test(`${TITLE} - Projects section`, async ({ page }) => {
  const projects = page.locator("#projects");
  await projects.scrollIntoViewIfNeeded();
  await expect(
    projects.getByRole("heading", { name: "My top projects", level: 2 }),
  ).toBeVisible();
  await expect(projects.getByText("My Portfolio")).toBeVisible();
  // Four curated cards, each linking to its own detail page
  const cards = projects
    .getByRole("list", { name: "Featured projects" })
    .getByRole("link");
  await expect(cards).toHaveCount(4);
  await expect(cards.first()).toHaveAttribute("href", /^\/projects\//);
  const viewAll = projects.getByRole("link", { name: "View more projects" });
  await expect(viewAll).toHaveAttribute("href", "/projects");
  await expect(viewAll).toContainText(/View all \d+ projects/);
});

test(`${TITLE} - Case studies section`, async ({ page }) => {
  const caseStudies = page.locator("#case-studies");
  await caseStudies.scrollIntoViewIfNeeded();
  await expect(
    caseStudies.getByRole("heading", { name: "Case Studies", level: 2 }),
  ).toBeVisible();
  await expect(caseStudies.getByText("Deep Dives")).toBeVisible();
  const studies = caseStudies
    .getByRole("list", { name: "Case studies" })
    .getByRole("listitem");
  await expect(studies).not.toHaveCount(0);
  await expect(studies.first()).toContainText("Read case study");
});

test(`${TITLE} - Case study dialog`, async ({ page }) => {
  const caseStudies = page.locator("#case-studies");
  await caseStudies.scrollIntoViewIfNeeded();
  await caseStudies
    .getByRole("listitem", { name: /Read case study/i })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: /Case Study/i });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close case study" }).click();
  await expect(dialog).toBeHidden();
});

test(`${TITLE} - Skills section`, async ({ page }) => {
  const skills = page.locator("#skills");
  await skills.scrollIntoViewIfNeeded();
  await expect(
    skills.getByRole("heading", { name: "Skills & Technologies", level: 2 }),
  ).toBeVisible();
  await expect(skills.getByText("My Expertise")).toBeVisible();
  const categories = skills
    .getByRole("list", { name: "Skill categories" })
    .getByRole("listitem");
  await expect(categories).not.toHaveCount(0);
});

test(`${TITLE} - LeetCode section`, async ({ page }) => {
  const leetcode = page.locator("#leetcode");
  await leetcode.scrollIntoViewIfNeeded();
  await expect(
    leetcode.getByRole("heading", { name: "My LeetCode Insights", level: 2 }),
  ).toBeVisible();
  await expect(leetcode.getByText("Coding Practice")).toBeVisible();
  // Stats come from the external dashboard API — allow for a slow response;
  // a failure here means the insights endpoint is down, not a layout break.
  await expect(leetcode.getByText("Total Solved")).toBeVisible({
    timeout: 30000,
  });
  await expect(
    leetcode.getByRole("link", { name: "View full LeetCode dashboard" }),
  ).toBeVisible();
  await expect(
    leetcode.getByRole("link", { name: "View LeetCode profile" }),
  ).toHaveAttribute("href", /leetcode\.com/);
});

test(`${TITLE} - Services section`, async ({ page }) => {
  const services = page.locator("#services");
  await services.scrollIntoViewIfNeeded();
  await expect(
    services.getByRole("heading", { name: "My Services", level: 2 }),
  ).toBeVisible();
  await expect(services.getByText("What I offer")).toBeVisible();
  const offered = services
    .getByRole("list", { name: "Services offered" })
    .getByRole("listitem");
  await expect(offered).not.toHaveCount(0);
});

test(`${TITLE} - Contact section`, async ({ page }) => {
  const contact = page.locator("#contact");
  await contact.scrollIntoViewIfNeeded();
  await expect(
    contact.getByRole("heading", { name: "Get in Touch", level: 2 }),
  ).toBeVisible();
  await expect(contact.getByText("Connect with me")).toBeVisible();
  await expect(contact.getByLabel("Name")).toBeVisible();
  await expect(contact.getByLabel("Email")).toBeVisible();
  await expect(contact.getByLabel("Enter your message")).toBeVisible();
  // Send stays disabled until the reCAPTCHA widget is ready
  await expect(contact.getByRole("button", { name: "Send" })).toBeVisible();
});

test(`${TITLE} - AI chat assistant`, async ({ page }) => {
  const openChat = page.getByRole("button", { name: "Open AI chat assistant" });
  await expect(openChat).toBeVisible();
  await openChat.click();
  const chat = page.getByRole("dialog", { name: "AI Chat Assistant" });
  await expect(chat).toBeVisible();
  await expect(chat.getByText("Wilfredo's Assistant")).toBeVisible();
  // Panel only — never send a prompt, that would bill the live AI endpoint
  await chat.getByRole("button", { name: "Close chat" }).click();
  await expect(chat).toBeHidden();
});

test(`${TITLE} - Footer`, async ({ page }) => {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(
    page.getByText(/Crafting products that feel simple/i),
  ).toBeVisible();
  await expect(
    page.getByText(/Wilfredo Rujel. All rights reserved./i),
  ).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Social media links" }).last(),
  ).toBeVisible();
});

test(`${TITLE} - Theme toggle`, async ({ page }) => {
  // next-themes writes data-theme on <html>; Tailwind's dark variant keys off
  // that attribute, not a .dark class
  const theme = () =>
    page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  const toggle = page.getByRole("button", {
    name: /Switch to (dark|light) mode/i,
  });
  const before = await theme();
  await toggle.click();
  await expect.poll(theme).toBe(before === "dark" ? "light" : "dark");
  await expect(toggle).toHaveAttribute(
    "aria-pressed",
    before === "dark" ? "false" : "true",
  );
});

/* ─────────────── PROJECTS ──────────────────────────────── */

test(`${TITLE} - Projects page`, async ({ page }) => {
  await page.goto(`${URL_PATH}/projects`);
  await expect(
    page.getByRole("heading", { name: "My Projects", level: 1 }),
  ).toBeVisible();
  // Breadcrumb replaced the old "Back to home" button: Home › Projects
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(breadcrumb.getByText("Projects", { exact: true })).toBeVisible();
  await expect(page.getByText(/\d+ projects/i).first()).toBeVisible();
  // Every project is server-rendered as a card; cards are div[role=link]
  await expect(page.locator("article")).not.toHaveCount(0);
});

test(`${TITLE} - Projects page language filter`, async ({ page }) => {
  await page.goto(`${URL_PATH}/projects`);
  const filters = page.getByRole("group", {
    name: "Filter projects by language",
  });
  await expect(filters).toBeVisible();
  const total = await page.locator("article").count();
  // First chip after "All" is the most common language — filtering must narrow
  const language = filters.getByRole("button").nth(1);
  await language.click();
  await expect(language).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.locator("article").count()).toBeLessThan(total);
  await filters.getByRole("button", { name: "All" }).click();
  await expect.poll(() => page.locator("article").count()).toBe(total);
});

test(`${TITLE} - Project detail page`, async ({ page }) => {
  await page.goto(`${URL_PATH}/projects/portfolio`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(
    breadcrumb.getByRole("link", { name: "Projects" }),
  ).toHaveAttribute("href", "/projects");
  // README-driven content renders on the page
  await expect(
    page.getByRole("heading", { name: "Tech Stack" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Related Projects" }),
  ).toBeVisible();
});

/* ─────────────── ABOUT ─────────────────────────────────── */

test(`${TITLE} - About page`, async ({ page }) => {
  await page.goto(`${URL_PATH}/about`);
  await expect(
    page.getByRole("heading", { name: "Wilfredo Rujel", level: 1 }),
  ).toBeVisible();
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(breadcrumb.getByText("About", { exact: true })).toBeVisible();
  // Live stats strip
  await expect(page.getByText("Years of experience")).toBeVisible();
  await expect(page.getByText("Projects shipped")).toBeVisible();
  // Section headings (Education/Certifications are uppercased via CSS only)
  for (const section of [
    "About me",
    "Work Experience",
    "Education",
    "Certifications",
    "Skills & Technologies",
    "Honors & Awards",
  ]) {
    await expect(
      page.getByRole("heading", { name: section }).first(),
    ).toBeVisible();
  }
});

test(`${TITLE} - Location page`, async ({ page }) => {
  await page.goto(`${URL_PATH}/about/location`);
  await expect(
    page.getByRole("heading", { name: /Location/i, level: 1 }),
  ).toBeVisible();
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb.getByRole("link", { name: "About" })).toHaveAttribute(
    "href",
    "/about",
  );
  await expect(page.getByText(/Lima, Peru/i).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Center on location" }),
  ).toBeVisible();
  // WebGL globe mounts its own canvas
  await expect(page.locator("canvas")).toBeAttached({ timeout: 30000 });
});

/* ─────────────── LOCALES & ERRORS ──────────────────────── */

test(`${TITLE} - Locale - Spanish`, async ({ page }) => {
  await page.goto(`${URL_PATH}/es`);
  await expect(page).toHaveURL(/\/es/);
  await expect(
    page.getByRole("heading", {
      name: "Ingeniero de Software con sede en Latam",
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page
      .locator("nav#navbar")
      .getByRole("menuitem", { name: "Proyectos" })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Casos de Estudio", level: 2 }),
  ).toBeVisible();
});

test(`${TITLE} - Not found page`, async ({ page }) => {
  await page.goto(`${URL_PATH}/this-route-does-not-exist`);
  await expect(page.getByText("404")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Back to Home/i })).toBeVisible();
});
