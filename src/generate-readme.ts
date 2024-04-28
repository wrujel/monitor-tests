import { promises as fs } from "fs";
import {
  PLACEHOLDER_SUMMARY,
  PLACEHOLDER_TABLE,
  PLACEHOLDER_TABLE_TESTS,
} from "../utils/constants";
import { Project, ProjectStatus, Report, Summary } from "../utils/types";
import { cloud_badges } from "../utils/badges.data";

const generateSummaryHTML = (summary: Summary) => {
  return `<p><ul>
            <li><span>Total Projects: ${summary.projects_count}</span></li>
            <li><span>Last Update: ${new Date(
              summary.last_update
            ).toUTCString()}</span></li>
            <li><span>Passed: ${summary.passed}</span></li>
            <li><span>Failed: ${summary.failed}</span></li>
            <li><span>Duration: 
              ${(summary.duration / 1000).toFixed(2)} sec
            </span></li>
          </ul></p>
  `;
};

const generateTableHTML = (
  projectsStatus: ProjectStatus[],
  projects: Project[]
) => {
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
                  let badge_url = "";
                  cloud_badges.forEach((badge) => {
                    if (
                      projects
                        .find((p) => p.title === project.name)
                        .url.includes(badge.name)
                    ) {
                      badge_url = badge.badge;
                    }
                  });

                  return `<tr>
                    <td><a href="${
                      projects.find((p) => p.title === project.name).url
                    }">${project.name}</a></td>
                    <td><a href="${
                      projects.find((p) => p.title === project.name).repoUrl
                    }">Link</a></td>
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
                      2
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
                            2
                          )}</td>
                        </tr>`
                    )
                    .join("");
                })
                .join("")}
            </tbody>
          </table>
  `;
};

(async () => {
  const [template, raw_data, data_projects] = await Promise.all([
    fs.readFile("./templates/README.md.tpl", { encoding: "utf-8" }),
    fs.readFile("./data/report.json", { encoding: "utf-8" }),
    fs.readFile("./data/projects.json", { encoding: "utf-8" }),
  ]);

  const report: Report = (await JSON.parse(raw_data)).pop();
  const projects: Project[] = (await JSON.parse(data_projects)).pop().projects;

  const newReadme = template
    .replace(PLACEHOLDER_SUMMARY, generateSummaryHTML(report.summary))
    .replace(PLACEHOLDER_TABLE, generateTableHTML(report.projects, projects))
    .replace(PLACEHOLDER_TABLE_TESTS, generateTestsTableHTML(report.projects));

  await fs.writeFile("./README.md", newReadme);
})();
