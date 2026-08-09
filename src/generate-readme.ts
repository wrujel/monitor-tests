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

const generateChartSVGContent = (reportEntries: Report[]) => {
  const maxSlots = 90;
  const chartWidth = 800;
  const chartHeight = 230;
  const barWidth = Math.max(4, Math.floor((chartWidth - 60) / maxSlots));
  const paddingLeft = 40;
  const paddingBottom = 50;
  const plotHeight = chartHeight - paddingBottom - 10;

  const entries = reportEntries.slice(-maxSlots);
  if (entries.length === 0) return "";

  const maxProjects = Math.max(
    ...entries.map((e) => e.summary.projects_count),
    1,
  );

  const startSlot = maxSlots - entries.length;

  let bars = "";
  entries.forEach((entry, i) => {
    const x = paddingLeft + (startSlot + i) * barWidth;
    let passed = 0,
      warning = 0,
      failed = 0;
    for (const proj of entry.projects) {
      if (proj.status === "passed") passed++;
      else if (proj.status === "warning") warning++;
      else failed++;
    }

    // Stacked bars (bottom to top): failed (red), warning (yellow), passed (green)
    const failedH = (failed / maxProjects) * plotHeight;
    const warningH = (warning / maxProjects) * plotHeight;
    const passedH = (passed / maxProjects) * plotHeight;

    let y = chartHeight - paddingBottom;

    if (failedH > 0) {
      bars += `<rect x="${x}" y="${y - failedH}" width="${barWidth - 1}" height="${failedH}" fill="#e53935" rx="1"/>`;
      y -= failedH;
    }
    if (warningH > 0) {
      bars += `<rect x="${x}" y="${y - warningH}" width="${barWidth - 1}" height="${warningH}" fill="#fdd835" rx="1"/>`;
      y -= warningH;
    }
    if (passedH > 0) {
      bars += `<rect x="${x}" y="${y - passedH}" width="${barWidth - 1}" height="${passedH}" fill="#43a047" rx="1"/>`;
    }
  });

  // Y-axis labels
  const yLabels = [0, Math.round(maxProjects / 2), maxProjects];
  const yAxisLabels = yLabels
    .map((v) => {
      const y = chartHeight - paddingBottom - (v / maxProjects) * plotHeight;
      return `<text x="${paddingLeft - 5}" y="${y + 4}" text-anchor="end" font-size="10" fill="#666">${v}</text>`;
    })
    .join("");

  const totalWidth = paddingLeft + maxSlots * barWidth + 10;

  // Legend at bottom right
  const legendRectY = chartHeight - paddingBottom + 38;
  const legendTextY = legendRectY + 9;
  const legendStartX = totalWidth - 210;
  const legend = `
    <rect x="${legendStartX}" y="${legendRectY}" width="10" height="10" fill="#43a047" rx="2"/>
    <text x="${legendStartX + 14}" y="${legendTextY}" font-size="10" fill="#666">Passed</text>
    <rect x="${legendStartX + 60}" y="${legendRectY}" width="10" height="10" fill="#fdd835" rx="2"/>
    <text x="${legendStartX + 74}" y="${legendTextY}" font-size="10" fill="#666">Warning</text>
    <rect x="${legendStartX + 140}" y="${legendRectY}" width="10" height="10" fill="#e53935" rx="2"/>
    <text x="${legendStartX + 154}" y="${legendTextY}" font-size="10" fill="#666">Failed</text>
  `;

  // X-axis date labels: one every ~15 slots
  const baselineY = chartHeight - paddingBottom;
  const dateLabelY = baselineY + 14;
  const dateStep = 15;
  const xAxisDates = entries
    .reduce<string[]>((acc, entry, i) => {
      if (i % dateStep !== 0) return acc;
      const x = paddingLeft + (startSlot + i + 0.5) * barWidth;
      const dateStr = new Date(entry.summary.last_update).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric" },
      );
      acc.push(
        `<line x1="${x.toFixed(1)}" y1="${baselineY}" x2="${x.toFixed(1)}" y2="${baselineY + 4}" stroke="#bbb" stroke-width="1"/>` +
          `<text x="${x.toFixed(1)}" y="${dateLabelY}" text-anchor="middle" font-size="9" fill="#888">${dateStr}</text>`,
      );
      return acc;
    }, [])
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${chartHeight}" viewBox="0 0 ${totalWidth} ${chartHeight}">
      <rect width="${totalWidth}" height="${chartHeight}" fill="#fff" rx="6"/>
      ${legend}
      ${yAxisLabels}
      <line x1="${paddingLeft}" y1="${baselineY}" x2="${totalWidth}" y2="${baselineY}" stroke="#ccc" stroke-width="1"/>
      ${bars}
      ${xAxisDates}
    </svg>`;
};

const generatePerProjectCharts = async (
  reportEntries: Report[],
): Promise<string> => {
  const maxSlots = 90;
  const chartW = 380;
  const chartH = 110;
  const paddingLeft = 30;
  const paddingTop = 22;
  const paddingBottom = 20;
  const paddingRight = 6;
  const plotW = chartW - paddingLeft - paddingRight;
  const plotH = chartH - paddingTop - paddingBottom;
  const slotWidth = plotW / maxSlots;

  const entries = reportEntries.slice(-maxSlots);
  if (entries.length === 0) return "";

  const latestEntry = entries[entries.length - 1];
  const startSlot = maxSlots - entries.length;
  const baseline = paddingTop + plotH;

  const cells: string[] = [];

  for (const proj of latestEntry.projects) {
    const repo = proj.repo ?? proj.name.toLowerCase().replace(/\s+/g, "-");

    const maxTests = Math.max(
      ...entries.map((e) => {
        const p = e.projects.find((p) => p.name === proj.name);
        return p ? p.passed + p.failed : 0;
      }),
      1,
    );

    const passedPts: string[] = [];
    const failedPts: string[] = [];

    entries.forEach((entry, i) => {
      const p = entry.projects.find((p) => p.name === proj.name);
      if (!p) return;
      const x = paddingLeft + (startSlot + i + 0.5) * slotWidth;
      passedPts.push(
        `${x.toFixed(1)},${(paddingTop + plotH * (1 - p.passed / maxTests)).toFixed(1)}`,
      );
      if (p.failed > 0) {
        failedPts.push(
          `${x.toFixed(1)},${(paddingTop + plotH * (1 - p.failed / maxTests)).toFixed(1)}`,
        );
      }
    });

    let passedArea = "";
    if (passedPts.length >= 2) {
      const [fx] = passedPts[0].split(",");
      const [lx] = passedPts[passedPts.length - 1].split(",");
      passedArea = `<polygon points="${passedPts.join(" ")} ${lx},${baseline} ${fx},${baseline}" fill="#43a047" opacity="0.15"/>`;
    }

    const passedLine =
      passedPts.length >= 2
        ? `<polyline points="${passedPts.join(" ")}" fill="none" stroke="#43a047" stroke-width="1.5" stroke-linejoin="round"/>`
        : passedPts.length === 1
          ? `<circle cx="${passedPts[0].split(",")[0]}" cy="${passedPts[0].split(",")[1]}" r="2" fill="#43a047"/>`
          : "";

    const failedLine =
      failedPts.length >= 2
        ? `<polyline points="${failedPts.join(" ")}" fill="none" stroke="#e53935" stroke-width="1.5" stroke-linejoin="round"/>`
        : failedPts.length === 1
          ? `<circle cx="${failedPts[0].split(",")[0]}" cy="${failedPts[0].split(",")[1]}" r="2" fill="#e53935"/>`
          : "";

    const yLabels = [0, maxTests]
      .map((v) => {
        const y = paddingTop + plotH * (1 - v / maxTests);
        return `<text x="${paddingLeft - 3}" y="${y + 4}" text-anchor="end" font-size="8" fill="#888">${v}</text>`;
      })
      .join("");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${chartW}" height="${chartH}" viewBox="0 0 ${chartW} ${chartH}">
      <rect width="${chartW}" height="${chartH}" fill="#fafafa" rx="4"/>
      <text x="${chartW / 2}" y="13" text-anchor="middle" font-size="10" font-weight="bold" fill="#333">${repo}</text>
      <line x1="${paddingLeft}" y1="${paddingTop}" x2="${paddingLeft}" y2="${baseline}" stroke="#e0e0e0" stroke-width="1"/>
      <line x1="${paddingLeft}" y1="${baseline}" x2="${paddingLeft + plotW}" y2="${baseline}" stroke="#e0e0e0" stroke-width="1"/>
      <line x1="${paddingLeft}" y1="${paddingTop}" x2="${paddingLeft + plotW}" y2="${paddingTop}" stroke="#f0f0f0" stroke-width="1"/>
      ${yLabels}
      ${passedArea}
      ${passedLine}
      ${failedLine}
    </svg>`;

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
