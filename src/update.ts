import { promises as fs } from "fs";
import { Project } from "../utils/types";
import {
  PLACEHOLDER_PROJECT_URL,
  PLACEHOLDER_REPO,
  PLACEHOLDER_REPO_URL,
  PLACEHOLDER_TITLE,
} from "../utils/constants";
import mailgun from "mailgun-js";
import dotenv from "dotenv";
dotenv.config();

const DOMAIN = process.env.MAILGUN_DOMAIN;
const API_KEY = process.env.MAILGUN_API_KEY;

const generateMessage = (repos: string[], type: string) => {
  const subject = type === "new" ? "New Tests Created" : "Empty Tests";
  const body = type === "new" ? "has been created" : "are empty";
  return {
    from: process.env.FROM_EMAIL,
    to: process.env.TO_EMAIL,
    subject: `Monitor Tests - ${subject}`,
    html: `<p>The following tests ${body}:</p><ul>${repos
      .map((repo) => `<li>${repo}</li>`)
      .join("")}</ul>`,
  };
};

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

const verifyEmptyTest = async (
  project: Project,
  template: any
): Promise<boolean> => {
  const data = await fs.readFile(`./tests/${project.repo}.spec.ts`, {
    encoding: "utf-8",
  });
  return data === template ? true : false;
};

const sendEmail = async (repos: string[], type: string) => {
  const mg = mailgun({
    apiKey: API_KEY,
    domain: DOMAIN,
  });
  const message = generateMessage(repos, type);
  try {
    await mg.messages().send(message);
  } catch (error) {
    console.error(error);
  }
};

(async () => {
  const tests = (await fs.readdir("tests"))
    .filter((file) => file.endsWith(".spec.ts"))
    .map((file) => file.split(".")[0]);

  const [data1, testTemplate, projectsTemplate] = await Promise.all([
    fs.readFile("./data/projects.json", { encoding: "utf-8" }),
    fs.readFile("./templates/test.spec.tpl", { encoding: "utf-8" }),
    fs.readFile("./templates/projects.ts.tpl", { encoding: "utf-8" }),
  ]);
  const projects: Project[] = (await JSON.parse(data1)).pop().projects;

  let newProjects = "";
  let newTests = [];
  let emptyTest = [];
  for (const project of projects) {
    newProjects += generateNewProject(projectsTemplate, project);

    const newTestTemplate = generateNewTest(
      testTemplate,
      project.repo,
      project.title
    );
    if (!tests.includes(project.repo)) {
      newTests.push(project.repo);
      await fs.writeFile(`./tests/${project.repo}.spec.ts`, newTestTemplate);
    } else if (await verifyEmptyTest(project, newTestTemplate)) {
      emptyTest.push(project.repo);
    }
  }

  if (newTests.length > 0) sendEmail(newTests, "new");
  if (emptyTest.length > 0) sendEmail(emptyTest, "empty");

  await fs.writeFile("./utils/projects.ts", newProjects);
})();
