import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from "@playwright/test/reporter";
import { ProjectStatus, Summary } from "../utils/types";
import { promises as fs } from "fs";

class ProjectsReporter implements Reporter {
  summary: Summary;
  projects: ProjectStatus[];

  constructor() {
    this.projects = [];
  }

  onBegin(config: FullConfig<{}, {}>, suite: Suite): void {
    console.log("Test run started at: " + new Date().toUTCString());
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    let skipProject,
      skipTest = false;
    const testName = test.title;
    const projectName = test.title.split(" - ")[0];
    const status = result.status;
    const duration = result.duration;
    const startTime = result.startTime;

    console.log(testName + " - " + status);

    for (const project of this.projects) {
      if (project.name === projectName) {
        for (const test of project.tests) {
          if (test.name === testName) {
            test.status = status;
            test.duration = duration;
            test.startTime = startTime;
            skipTest = true;
          }
        }
        if (!skipTest) {
          project.tests.push({ name: testName, status, duration, startTime });
        }
        skipProject = true;
      }
    }

    if (!skipProject) {
      this.projects.push({
        name: projectName,
        status: "passed",
        startTime,
        passed: 0,
        failed: 0,
        duration: 0,
        tests: [{ name: testName, status, duration, startTime }],
      });
    }
  }

  onEnd(result: FullResult) {
    let passed = 0;
    let failed = 0;
    let duration = 0;

    for (const project of this.projects) {
      for (const test of project.tests) {
        if (test.status === "passed") {
          project.passed++;
        } else {
          project.failed++;
        }
        project.duration += test.duration;
      }

      if (project.passed === 0) {
        project.status = "failed";
        project.color = "red";
      } else if (project.passed > 0 && project.failed > 0) {
        project.status = "warning";
        project.color = "yellow";
      } else {
        project.status = "passed";
        project.color = "green";
      }

      project.badge = {
        schemaVersion: 1,
        label: "tests",
        message: project.status,
        color: project.color,
        style: "for-the-badge",
        namedLogo: "github",
      };

      if (project.status === "passed") {
        passed++;
      } else {
        failed++;
      }
      duration += project.duration;
    }

    this.summary = {
      projects_count: this.projects.length,
      last_update: new Date().toUTCString(),
      passed,
      failed,
      duration,
    };

    console.log("Test run finished at: " + new Date().toUTCString());
    console.log("Results: " + JSON.stringify(result));
  }

  onExit(): Promise<void> {
    console.log("Saving report to file");
    return new Promise(async (resolve) => {
      const [raw_data, projects_data] = await Promise.all([
        fs.readFile("./data/report.json", { encoding: "utf-8" }),
        fs.readFile("./data/projects.json", { encoding: "utf-8" }),
      ]);
      const { projects } = (await JSON.parse(projects_data)).pop();
      const json = await JSON.parse(raw_data);

      for (const project of this.projects) {
        project.repo = projects.find((p) => p.title === project.name).repo;
        await fs.writeFile(
          `./data/${project.repo}.json`,
          JSON.stringify(project.badge, null, 2),
          {
            encoding: "utf-8",
          }
        );
      }

      if (json.length > 90) json.shift();
      json.push({ summary: this.summary, projects: this.projects });

      await fs.writeFile("./data/report.json", JSON.stringify(json, null, 2), {
        encoding: "utf-8",
      });

      resolve();
    });
  }
}

export default ProjectsReporter;
