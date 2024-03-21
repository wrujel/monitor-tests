import { promises as fs } from "fs";
import { Project } from "../utils/types";
import {
  PLACEHOLDER_PROJECT_URL,
  PLACEHOLDER_REPO,
  PLACEHOLDER_REPO_URL,
  PLACEHOLDER_TITLE,
} from "../utils/constants";

const generateNewProject = (template: any, project: Project) => {
  return template
    .replace(PLACEHOLDER_REPO, project.repo.replaceAll("-", "_"))
    .replace(PLACEHOLDER_TITLE, project.title)
    .replace(PLACEHOLDER_PROJECT_URL, project.url)
    .replace(PLACEHOLDER_REPO_URL, project.repoUrl);
};

const generateNewTest = (template: any, repo: string, title: string) => {
  return template
    .replace(PLACEHOLDER_REPO, repo.replaceAll("-", "_"))
    .replace(PLACEHOLDER_TITLE, title);
};

(async () => {
  const tests = (await fs.readdir("tests"))
    .filter((file) => file.endsWith(".spec.ts"))
    .map((file) => file.split(".")[0]);

  const [data1, data2, data3] = await Promise.all([
    fs.readFile("./data/projects.json", { encoding: "utf-8" }),
    fs.readFile("./templates/test.spec.tpl", { encoding: "utf-8" }),
    fs.readFile("./templates/projects.ts.tpl", { encoding: "utf-8" }),
  ]);
  const projects: Project[] = (await JSON.parse(data1)).pop().projects;
  const testTemplate = data2;
  const projectsTemplate = data3;

  let newProjects = "";
  for (const project of projects) {
    newProjects += generateNewProject(projectsTemplate, project);

    if (!tests.includes(project.repo)) {
      //TODO: notify new test is created
      await fs.writeFile(
        `./tests/${project.repo}.spec.ts`,
        generateNewTest(testTemplate, project.repo, project.title)
      );
    }
  }

  await fs.writeFile("./utils/projects.ts", newProjects);
})();
