import { promises as fs } from "fs";
import { PLACEHOLDER_SUMMARY, PLACEHOLDER_TABLE } from "../utils/constants";

const generateSummaryHTML = (summary) => {
  const { projects_count, last_update, passed, failed } = summary;
  return `<p><ul>
            <li><span>Number of Projects: ${projects_count}</span></li>
            <li><span>Last Update: ${new Date(
              last_update
            ).toUTCString()}</span></li>
            <li><span>Passed: ${passed}</span></li>
            <li><span>Failed: ${failed}</span></li>
          </ul></p>
  `;
};

const generateTableHTML = (projects) => {
  return `<table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${projects
                .map(
                  (project) => `<tr>
                                  <td>${project.name}</td>
                                  <td>${project.status} ${
                    project.status === "passed" ? "✅" : "❌"
                  }</td>
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

  const { summary, projects } = (await JSON.parse(raw_data)).pop();

  const newReadme = template
    .replace(PLACEHOLDER_SUMMARY, generateSummaryHTML(summary))
    .replace(PLACEHOLDER_TABLE, generateTableHTML(projects));

  await fs.writeFile("./README.md", newReadme);
})();
