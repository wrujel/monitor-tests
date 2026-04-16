import { promises as fs } from "fs";
import {
  PLACEHOLDER_SUMMARY,
  PLACEHOLDER_TABLE,
  PLACEHOLDER_TABLE_TESTS,
  PLACEHOLDER_CHART,
} from "../utils/constants";
import { Project, ProjectStatus, Report, Summary } from "../utils/types";
import { cloud_badges } from "../utils/badges.data";

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

const buildProjectLookup = (projects: Project[]): Map<string, Project> => {
  const map = new Map<string, Project>();
  for (const p of projects) {
    map.set(p.title.replace(/-/g, " ").toLowerCase(), p);
  }
  return map;
};

const generateTableHTML = (
  projectsStatus: ProjectStatus[],
  projects: Project[],
) => {
  const lookup = buildProjectLookup(projects);

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
                  const matched = lookup.get(project.name.replace(/-/g, " ").toLowerCase());
                  let badge_url = "";
                  if (matched) {
                    for (const badge of cloud_badges) {
                      if (matched.url.includes(badge.name)) {
                        badge_url = badge.badge;
                        break;
                      }
                    }
                  }

                  return `<tr>
                    <td><a href="${matched?.url ?? ""}">${project.name}</a></td>
                    <td><a href="${matched?.repoUrl ?? ""}">Link</a></td>
                    <td><img src="${badge_url}" alt="cloud"/></td>
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
  const chartHeight = 200;
  const barWidth = Math.max(4, Math.floor((chartWidth - 60) / maxSlots));
  const paddingLeft = 40;
  const paddingBottom = 30;
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
    const { passed = 0, failed = 0 } = entry.summary;
    const warning = entry.summary.projects_count - passed - failed;

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

  // Legend
  const legend = `
    <rect x="${paddingLeft}" y="2" width="10" height="10" fill="#43a047" rx="2"/>
    <text x="${paddingLeft + 14}" y="11" font-size="10" fill="#666">Passed</text>
    <rect x="${paddingLeft + 60}" y="2" width="10" height="10" fill="#fdd835" rx="2"/>
    <text x="${paddingLeft + 74}" y="11" font-size="10" fill="#666">Warning</text>
    <rect x="${paddingLeft + 140}" y="2" width="10" height="10" fill="#e53935" rx="2"/>
    <text x="${paddingLeft + 154}" y="11" font-size="10" fill="#666">Failed</text>
  `;

  const totalWidth = paddingLeft + maxSlots * barWidth + 10;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${chartHeight}" viewBox="0 0 ${totalWidth} ${chartHeight}">
      <rect width="${totalWidth}" height="${chartHeight}" fill="#fff" rx="6"/>
      ${legend}
      ${yAxisLabels}
      <line x1="${paddingLeft}" y1="${chartHeight - paddingBottom}" x2="${totalWidth}" y2="${chartHeight - paddingBottom}" stroke="#ccc" stroke-width="1"/>
      ${bars}
    </svg>`;
};

(async () => {
  const [template, raw_data, data_projects] = await Promise.all([
    fs.readFile("./templates/README.md.tpl", { encoding: "utf-8" }),
    fs.readFile("./data/report.json", { encoding: "utf-8" }),
    fs.readFile("./data/projects.json", { encoding: "utf-8" }),
  ]);

  const reportEntries: Report[] = JSON.parse(raw_data);
  const projects: Project[] = JSON.parse(data_projects);

  const report = reportEntries[reportEntries.length - 1];
  if (!report) {
    console.log("No report entries found, skipping README generation");
    return;
  }

  const svgContent = generateChartSVGContent(reportEntries);
  if (svgContent) {
    await fs.writeFile("./data/chart.svg", svgContent);
  }
  const chartImg = svgContent
    ? `<img src="./data/chart.svg" alt="Last 90 days chart"/>`
    : "";

  const newReadme = template
    .replace(PLACEHOLDER_SUMMARY, generateSummaryHTML(report.summary))
    .replace(PLACEHOLDER_CHART, chartImg)
    .replace(PLACEHOLDER_TABLE, generateTableHTML(report.projects, projects))
    .replace(PLACEHOLDER_TABLE_TESTS, generateTestsTableHTML(report.projects));

  await fs.writeFile("./README.md", newReadme);
  console.log("README.md generated");
})();
