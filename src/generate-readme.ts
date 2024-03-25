import { promises as fs } from "fs";
import { PLACEHOLDER_SUMMARY, PLACEHOLDER_TABLE } from "../utils/constants";
import { ProjectStatus, Report, Summary } from "../utils/types";

const generateSummaryHTML = (summary: Summary) => {
  return `<p><ul>
            <li><span>Total Projects: ${summary.projects_count}</span></li>
            <li><span>Last Update: ${new Date(
              summary.last_update
            ).toUTCString()}</span></li>
            <li><span>Passed: ${summary.passed}</span></li>
            <li><span>Failed: ${summary.failed}</span></li>
            <li><span>Duration: ${summary.duration}</span></li>
          </ul></p>
  `;
};

const generateTableHTML = (projects: ProjectStatus[]) => {
  return `<table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Passed/Total</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              ${projects
                .map(
                  (project) =>
                    `<tr>
                    <td>${project.name}</td>
                    <td>${project.status === "passed" ? "✅" : "❌"}</td>
                    <td>${project.passed}/${
                      project.passed + project.failed
                    }</td>
                    <td>${(project.duration / 1000).toFixed(2)}s</td>
                  </tr>`
                )
                .join("")}
            </tbody>
          </table>
  `;
};

(async () => {
  const [template, raw_data] = await Promise.all([
    fs.readFile("./templates/README.md.tpl", { encoding: "utf-8" }),
    fs.readFile("./data/report.json", { encoding: "utf-8" }),
  ]);

  const report: Report = (await JSON.parse(raw_data)).pop();

  const newReadme = template
    .replace(PLACEHOLDER_SUMMARY, generateSummaryHTML(report.summary))
    .replace(PLACEHOLDER_TABLE, generateTableHTML(report.projects));

  await fs.writeFile("./README.md", newReadme);
})();
