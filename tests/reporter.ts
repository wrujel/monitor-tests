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
    console.log("=".repeat(60));
    console.log("Test run started at: " + new Date().toUTCString());
    console.log("Workers: " + config.workers);
    console.log("Retries: " + (config.projects[0]?.retries ?? 0));
    const allTests = suite.allTests();
    console.log("Total tests to run: " + allTests.length);
    const files = [...new Set(allTests.map((t) => t.location.file))];
    console.log("Test files (" + files.length + "):");
    files.forEach((f) => console.log("  - " + f));
    console.log("=".repeat(60));
  }

  onTestBegin(test: TestCase): void {
    console.log("\n>>> START: " + test.title);
    console.log("    file: " + test.location.file + ":" + test.location.line);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    let skipProject,
      skipTest = false;
    const testName = test.title;
    const projectName = test.title.split(" - ")[0];
    const status = result.status;
    const duration = result.duration;
    const startTime = result.startTime;

    const durationSec = (duration / 1000).toFixed(2) + "s";
    const retryLabel = result.retry > 0 ? ` (retry ${result.retry})` : "";
    console.log(
      `<<< END:   ${testName} — ${status.toUpperCase()}${retryLabel} [${durationSec}]`,
    );

    if (status !== "passed") {
      console.log("--- FAILURE DETAILS ---");
      for (const error of result.errors) {
        if (error.message) {
          // Strip ANSI colour codes for cleaner GitHub logs
          console.log(
            "  message: " +
              error.message.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, ""),
          );
        }
        if (error.snippet) {
          console.log(
            "  snippet: " +
              error.snippet.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, ""),
          );
        }
        if (error.stack) {
          // Print only the first 10 stack frames to avoid noise
          const stackLines = error.stack
            .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "")
            .split("\n")
            .slice(0, 10)
            .join("\n");
          console.log("  stack:\n" + stackLines);
        }
      }
      if (result.attachments.length > 0) {
        console.log("  attachments:");
        for (const att of result.attachments) {
          console.log(
            `    [${att.contentType}] ${att.name}: ${att.path ?? att.body ?? ""}`,
          );
        }
      }
      console.log("-".repeat(40));
    }

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

    console.log("\n" + "=".repeat(60));
    console.log("Test run finished at: " + new Date().toUTCString());
    console.log(
      `Overall: ${passed} passed, ${failed} failed — ${(duration / 1000).toFixed(1)}s`,
    );
    console.log("\nPer-project summary:");
    for (const project of this.projects) {
      const icon =
        project.status === "passed"
          ? "✓"
          : project.status === "warning"
            ? "~"
            : "✗";
      console.log(
        `  ${icon} ${project.name}: ${project.passed} passed, ${project.failed} failed — ${(project.duration / 1000).toFixed(1)}s`,
      );
      for (const t of project.tests) {
        if (t.status !== "passed") {
          console.log(`      ✗ ${t.name} [${t.status}]`);
        }
      }
    }
    console.log("=".repeat(60));
  }

  onExit(): Promise<void> {
    console.log("\nSaving report to file...");
    return new Promise(async (resolve) => {
      try {
        const [raw_data, projects_data] = await Promise.all([
          fs.readFile("./data/report.json", { encoding: "utf-8" }),
          fs.readFile("./data/projects.json", { encoding: "utf-8" }),
        ]);
        console.log("  Read data/report.json and data/projects.json");

        const { projects } = (await JSON.parse(projects_data)).pop();
        console.log(
          "  projects.json contains " + projects.length + " projects",
        );
        const json = await JSON.parse(raw_data);
        console.log("  report.json contains " + json.length + " entries");

        for (const project of this.projects) {
          const match = projects.find((p) => p.title === project.name);
          if (!match) {
            console.error(
              `  ERROR: no matching project found for "${project.name}" — skipping badge write`,
            );
            continue;
          }
          project.repo = match.repo;
          await fs.writeFile(
            `./data/${project.repo}.json`,
            JSON.stringify(project.badge, null, 2),
            { encoding: "utf-8" },
          );
          console.log(`  Wrote data/${project.repo}.json (${project.status})`);
        }

        if (json.length > 90) {
          console.log("  Trimming oldest entry from report (limit 90)");
          json.shift();
        }
        json.push({ summary: this.summary, projects: this.projects });

        await fs.writeFile(
          "./data/report.json",
          JSON.stringify(json, null, 2),
          {
            encoding: "utf-8",
          },
        );
        console.log("  Wrote data/report.json (" + json.length + " entries)");
      } catch (err) {
        console.error("  ERROR during onExit file writes: " + err);
      }

      resolve();
    });
  }
}

export default ProjectsReporter;
