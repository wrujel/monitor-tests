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
    console.log("Starting test run");
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    let skipped = false;
    const testName = test.title;
    const projectName = test.title.split(" - ")[0];
    const status = result.status;
    const duration = result.duration;
    const startTime = result.startTime;

    for (const project of this.projects) {
      if (project.name === projectName) {
        if (project.status !== status) {
          project.status = status;
        }
        project.tests.push({ name: testName, status, duration, startTime });
        skipped = true;
      }
    }

    if (!skipped) {
      this.projects.push({
        name: projectName,
        status,
        startTime,
        tests: [{ name: testName, status, duration, startTime }],
      });
    }
  }

  onEnd(result: FullResult) {
    let passed = 0;
    let failed = 0;

    for (const project of this.projects) {
      if (project.status === "passed") {
        passed++;
      } else {
        failed++;
      }
    }

    this.summary = {
      projects_count: this.projects.length,
      last_update: new Date().toUTCString(),
      passed,
      failed,
    };

    console.log("Test run finished");
  }

  onExit(): Promise<void> {
    console.log("Saving report to file");
    return new Promise(async (resolve) => {
      const [raw_data] = await Promise.all([
        fs.readFile("./data/report.json", { encoding: "utf-8" }),
      ]);

      const json = await JSON.parse(raw_data);

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
