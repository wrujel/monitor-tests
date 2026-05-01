import { spawnSync } from "child_process";
import { existsSync } from "fs";
import path from "path";

const project = process.argv[2];
const localUrl = process.argv[3];
if (!project) {
  console.error(
    "Usage: bun ./src/run-project.ts <project-name> [local-url]",
  );
  process.exit(1);
}

const childEnv = { ...process.env };
if (localUrl) {
  childEnv.LOCAL_PROJECT = project;
  childEnv.LOCAL_URL = localUrl;
  console.log(`Overriding ${project} URL with ${localUrl}`);
}

const specPath = path.join("tests", `${project}.spec.ts`);
const tourPath = path.join("video-tours", `${project}.tour.ts`);

if (!existsSync(specPath)) {
  console.error(`Test file not found: ${specPath}`);
  process.exit(1);
}
if (!existsSync(tourPath)) {
  console.error(`Tour file not found: ${tourPath}`);
  process.exit(1);
}

console.log(`\n=== Running test: ${specPath} ===\n`);
const testResult = spawnSync(
  "npx",
  ["playwright", "test", specPath, "--project=chromium"],
  { stdio: "inherit", shell: true, env: childEnv },
);
const testOk = testResult.status === 0;
if (!testOk) {
  console.warn("\nTest reported failures — continuing to video tour...\n");
}

console.log(`\n=== Running tour: ${project} ===\n`);
const tourResult = spawnSync("bun", ["./video-tours/run.ts", project], {
  stdio: "inherit",
  shell: true,
  env: childEnv,
});
const tourOk = tourResult.status === 0;

if (!testOk || !tourOk) {
  console.error(
    `\nFinished with failures — test: ${testOk ? "ok" : "failed"}, tour: ${tourOk ? "ok" : "failed"}`,
  );
  process.exit(1);
}
console.log("\nAll done.");
