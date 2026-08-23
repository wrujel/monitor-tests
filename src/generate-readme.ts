import { promises as fs } from "fs";
import {
  PLACEHOLDER_SUMMARY,
  PLACEHOLDER_TABLE,
  PLACEHOLDER_TABLE_TESTS,
  PLACEHOLDER_CHART,
  PLACEHOLDER_LINE_CHART,
} from "../utils/constants";
import { ProjectBadge, ProjectStatus, Report, Summary } from "../utils/types";
import { cloud_badges } from "../utils/badges.data";
import {
  SLOTS,
  StatusStyles,
  buildOverviewCard,
  buildStripCard,
} from "../utils/cards";

/**
 * Render README.md (+ the charts and the shields badge endpoints) from
 * data/report.json.
 *
 * data/report.json is the ONLY input now. The tests that produce it run in the
 * scheduler container over in the platform-content workspace, which pushes each
 * settled run here — that push is what triggers this script's workflow. It also
 * writes the deployed/repo URLs onto every project entry, so the old
 * data/projects.json join is gone.
 */

const generateSummaryHTML = (summary: Summary) => {
  return `<p><ul>
            <li><span>Total Projects: ${summary.projects_count}</span></li>
            <li><span>Last Update: ${new Date(
              summary.last_update,
            ).toUTCString()}</span></li>
            <li><span>Passed: ${summary.passed}</span></li>
            <li><span>Failed: ${summary.failed}</span></li>
            <li><span>Duration: 
              ${(summary.duration / 1000).toFixed(2)} sec
            </span></li>
          </ul></p>
  `;
};

type CloudBadge = (typeof cloud_badges)[number];

/**
 * The badge for the vendor the scheduler now PUBLISHES on each project entry
 * ("Vercel", "Cloudflare Workers"), taken from the project's tech stack.
 *
 * Exact name first, then the longest badge name the vendor starts with:
 * "Cloudflare Workers" has no badge of its own, so it lands on Cloudflare
 * rather than on nothing.
 */
const byVendor = (vendor: string): CloudBadge | null => {
  const name = vendor.trim().toLowerCase();
  if (!name) return null;
  const exact = cloud_badges.find((b) => b.name.toLowerCase() === name);
  if (exact) return exact;
  return (
    cloud_badges
      .filter((b) => name.startsWith(`${b.name.toLowerCase()} `))
      .sort((a, b) => b.name.length - a.name.length)[0] ?? null
  );
};

/**
 * The fallback: read the host out of the deployed URL. It only ever worked when
 * the vendor was IN the hostname (*.vercel.app, *.onrender.com) — a custom
 * domain such as blog.wrujel.com reveals nothing, which is why the vendor is
 * published now. Kept because it is still the ONLY source for the entries that
 * predate that field, and for a project whose stack names no host.
 */
const byUrl = (url: string): CloudBadge | null => {
  const target = url.toLowerCase();
  if (!target) return null;
  for (const badge of cloud_badges) {
    if (target.includes(badge.name.toLowerCase())) return badge;
  }
  return null;
};

/** Where a project is deployed, as a shields badge — or null when neither the
 *  published vendor nor the URL says. */
const cloudBadgeFor = (project: ProjectStatus): CloudBadge | null =>
  (project.vendor ? byVendor(project.vendor) : null) ??
  byUrl(project.url ?? "");

const generateTableHTML = (projectsStatus: ProjectStatus[]) => {
  return `<table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Repo</th>
                <th>Deployed</th>
                <th>Status</th>
                <th>Passed</th>
                <th>Duration(s)</th>
              </tr>
            </thead>
            <tbody>
              ${projectsStatus
                .map((project) => {
                  const cloud = cloudBadgeFor(project);

                  return `<tr>
                    <td>${project.url ? `<a href="${project.url}">${project.name}</a>` : project.name}</td>
                    <td>${project.repoUrl ? `<a href="${project.repoUrl}">Link</a>` : "-"}</td>
                    <td>${cloud ? `<img src="${cloud.badge}" alt="${cloud.name}"/>` : "-"}</td>
                    <td>${
                      project.status === "passed"
                        ? "✅"
                        : project.status === "warning"
                          ? "⚠️"
                          : "❌"
                    }</td>
                    <td>${project.passed}/${
                      project.passed + project.failed
                    }</td>
                    <td align='right'>${(project.duration / 1000).toFixed(
                      2,
                    )}</td>
                  </tr>`;
                })
                .join("")}
            </tbody>
          </table>
  `;
};

const generateTestsTableHTML = (projects: ProjectStatus[]) => {
  return `<table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Tests</th>
                <th>Status</th>
                <th>Duration(s)</th>
              </tr>
            </thead>
            <tbody>
              ${projects
                .map((project) => {
                  return project.tests
                    .map(
                      (test) =>
                        `<tr>
                          <td>${project.name}</td>
                          <td>${test.name.split(" - ")[1]}</td>
                          <td>${test.status === "passed" ? "✅" : "❌"}</td>
                          <td align='right'>${(test.duration / 1000).toFixed(
                            2,
                          )}</td>
                        </tr>`,
                    )
                    .join("");
                })
                .join("")}
            </tbody>
          </table>
  `;
};

/* ── Charts ────────────────────────────────────────────────────────────────
 *
 * Both charts are the status-page card drawn in utils/cards.ts: 90 day-bars
 * under a title and a state badge, with the uptime over that window written
 * between "90 days ago" and "Today". All this module supplies is what our
 * three run outcomes look like and how a run maps onto a day.
 */

const TEST_STYLES: StatusStyles = {
  passed: {
    bar: "#9fd8a3",
    badge: "#2da44e",
    label: "Normal",
    legend: "Passed",
    glyph: "check",
  },
  warning: {
    bar: "#d4a72c",
    badge: "#bf8700",
    label: "Degraded",
    legend: "Warning",
    glyph: "bang",
  },
  failed: {
    bar: "#e5534b",
    badge: "#cf222e",
    label: "Failing",
    legend: "Failed",
    glyph: "cross",
  },
};

/** Stacked bottom to top, so a failure sits at the base of the day's bar. */
const STACK_ORDER = ["failed", "warning", "passed"];

const normalize = (status: string) =>
  status in TEST_STYLES ? status : "failed";

/** Tests passed over tests run — null when the window holds no tests at all. */
const uptimeOf = (passed: number, failed: number) =>
  passed + failed > 0 ? (passed / (passed + failed)) * 100 : null;

/**
 * Every project on one strip: each day is a full-height bar split between
 * failed, warning and passed in proportion to how the projects settled, so a
 * single amber sliver still reads at a glance.
 */
const generateChartSVGContent = (reportEntries: Report[]) => {
  const entries = reportEntries.slice(-SLOTS);
  if (entries.length === 0) return "";

  const days: (Record<string, number> | null)[] = new Array(SLOTS).fill(null);
  const startSlot = SLOTS - entries.length;
  let passed = 0;
  let failed = 0;

  entries.forEach((entry, i) => {
    const counts: Record<string, number> = {};
    for (const proj of entry.projects) {
      const status = normalize(proj.status);
      counts[status] = (counts[status] ?? 0) + 1;
      passed += proj.passed;
      failed += proj.failed;
    }
    days[startSlot + i] = counts;
  });

  const latest = entries[entries.length - 1].projects;
  const status = latest.some((p) => p.status === "failed")
    ? "failed"
    : latest.some((p) => p.status === "warning")
      ? "warning"
      : "passed";

  return buildOverviewCard({
    title: "All Projects",
    days,
    order: STACK_ORDER,
    status,
    uptime: uptimeOf(passed, failed),
    styles: TEST_STYLES,
    legend: ["passed", "warning", "failed"],
  });
};

/**
 * One card per project, written to the ./data/chart-<repo>.svg paths the
 * project READMEs already embed, and laid out two per row so the markdown
 * table's own cell borders draw the grid.
 */
const generatePerProjectCharts = async (
  reportEntries: Report[],
): Promise<string> => {
  const entries = reportEntries.slice(-SLOTS);
  if (entries.length === 0) return "";

  const latestEntry = entries[entries.length - 1];
  const startSlot = SLOTS - entries.length;

  const cells: string[] = [];

  for (const proj of latestEntry.projects) {
    const repo = proj.repo ?? proj.name.toLowerCase().replace(/\s+/g, "-");

    // Left to right is oldest to newest; a day the project did not run stays
    // undefined and is drawn as the "no data" grey.
    const days: (string | undefined)[] = new Array(SLOTS).fill(undefined);
    let passed = 0;
    let failed = 0;

    entries.forEach((entry, i) => {
      const p = entry.projects.find((p) => p.name === proj.name);
      if (!p) return;
      days[startSlot + i] = normalize(p.status);
      passed += p.passed;
      failed += p.failed;
    });

    const svg = buildStripCard({
      title: repo,
      days,
      status: normalize(proj.status),
      uptime: uptimeOf(passed, failed),
      styles: TEST_STYLES,
    });

    await fs.writeFile(`./data/chart-${repo}.svg`, svg);
    cells.push(`<td><img src="./data/chart-${repo}.svg" alt="${repo}"/></td>`);
  }

  if (cells.length === 0) return "";

  const cols = 2;
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += cols) {
    rows.push(`<tr>${cells.slice(i, i + cols).join("")}</tr>`);
  }
  return `<table>${rows.join("")}</table>`;
};

const BADGE_COLORS: Record<string, string> = {
  passed: "green",
  warning: "yellow",
  failed: "red",
};

/**
 * The shields.io endpoint badges every project README embeds
 * (img.shields.io/endpoint?url=…/monitor-tests/main/data/<repo>.json). The
 * scheduler container deliberately does not write these — it publishes only
 * report.json — so they are derived here from the newest entry.
 */
const writeBadges = async (report: Report): Promise<void> => {
  for (const project of report.projects) {
    const repo = project.repo;
    if (!repo) {
      console.error(`  ERROR: no repo for "${project.name}" — skipping badge`);
      continue;
    }
    const badge: ProjectBadge = {
      schemaVersion: 1,
      label: "tests",
      message: project.status,
      color: project.color ?? BADGE_COLORS[project.status] ?? "lightgrey",
      style: "for-the-badge",
      namedLogo: "github",
    };
    await fs.writeFile(`./data/${repo}.json`, JSON.stringify(badge, null, 2), {
      encoding: "utf-8",
    });
    console.log(`  Wrote data/${repo}.json (${project.status})`);
  }
};

(async () => {
  const [template, raw_data] = await Promise.all([
    fs.readFile("./templates/README.md.tpl", { encoding: "utf-8" }),
    fs.readFile("./data/report.json", { encoding: "utf-8" }),
  ]);

  const reportEntries: Report[] = JSON.parse(raw_data);

  const report = reportEntries[reportEntries.length - 1];
  if (!report) {
    console.log("No report entries found, skipping README generation");
    return;
  }
  console.log(
    `Rendering from ${reportEntries.length} entries, newest ${report.summary.last_update}`,
  );

  const svgContent = generateChartSVGContent(reportEntries);
  if (svgContent) {
    await fs.writeFile("./data/chart.svg", svgContent);
  }
  const chartImg = svgContent
    ? `<img src="./data/chart.svg" alt="Last 90 days chart"/>`
    : "";

  const lineChartHTML = await generatePerProjectCharts(reportEntries);

  const newReadme = template
    .replace(PLACEHOLDER_SUMMARY, generateSummaryHTML(report.summary))
    .replace(PLACEHOLDER_CHART, chartImg)
    .replace(PLACEHOLDER_LINE_CHART, lineChartHTML)
    .replace(PLACEHOLDER_TABLE, generateTableHTML(report.projects))
    .replace(PLACEHOLDER_TABLE_TESTS, generateTestsTableHTML(report.projects));

  await fs.writeFile("./README.md", newReadme);
  console.log("README.md generated");

  await writeBadges(report);
})();
