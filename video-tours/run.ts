import { spawnSync } from "child_process";
import {
  readdirSync,
  mkdirSync,
  copyFileSync,
  unlinkSync,
  rmdirSync,
  existsSync,
} from "fs";
import { rename } from "fs/promises";
import mailgun from "mailgun-js";
import dotenv from "dotenv";
import {
  processVideo,
  printSummary,
  loadCustomizations,
} from "./process-videos";

dotenv.config();

const VIDEOS_DIR = "videos";
const BACKUP_DIR = "_video_backup";

// Playwright names its internal temp video files with hex hashes (e.g. c59a4e07…).
// These are NOT project videos — they appear when a test fails before saveVideo()
// renames them to <project>.raw.webm. We must skip them everywhere they'd be
// mistaken for real tours.
function isPlaywrightTempFile(title: string): boolean {
  return /^[a-f0-9]{20,}$/.test(title);
}

function backupVideos(filterTitles?: Set<string>): Map<string, string> {
  const map = new Map<string, string>();
  mkdirSync(BACKUP_DIR, { recursive: true });
  let files: string[] = [];
  try {
    files = readdirSync(VIDEOS_DIR);
  } catch {}
  for (const f of files) {
    if (f.endsWith(".webm") && !f.endsWith(".raw.webm")) {
      const title = f.replace(/\.webm$/, "");
      if (isPlaywrightTempFile(title)) continue;
      if (filterTitles && !filterTitles.has(title)) continue;
      const src = `${VIDEOS_DIR}/${f}`;
      const dst = `${BACKUP_DIR}/${f}`;
      try {
        copyFileSync(src, dst);
        map.set(title, dst);
      } catch {}
    }
  }
  return map;
}

function cleanTempFiles(): void {
  let files: string[] = [];
  try {
    files = readdirSync(VIDEOS_DIR);
  } catch {}
  for (const f of files) {
    if (f.endsWith(".webm") && !f.endsWith(".raw.webm")) {
      if (isPlaywrightTempFile(f.replace(/\.webm$/, ""))) {
        try {
          unlinkSync(`${VIDEOS_DIR}/${f}`);
        } catch {}
      }
    }
  }
}

function cleanVideos(filterTitles?: Set<string>): void {
  let files: string[] = [];
  try {
    files = readdirSync(VIDEOS_DIR);
  } catch {}
  for (const f of files) {
    if (!f.endsWith(".webm")) continue;
    if (filterTitles) {
      const title = f.replace(/\.raw\.webm$/, "").replace(/\.webm$/, "");
      if (isPlaywrightTempFile(title)) continue;
      if (!filterTitles.has(title)) continue;
    }
    try {
      unlinkSync(`${VIDEOS_DIR}/${f}`);
    } catch {}
  }
}

function buildGrep(cliTours: string[]): string | undefined {
  if (cliTours.length > 0) {
    const escaped = cliTours.map((t) =>
      t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );
    return `tour: (${escaped.join("|")})`;
  }
  return process.env.VIDEO_GREP;
}

function runPlaywright(grep: string | undefined): boolean {
  const args = [
    "playwright",
    "test",
    "--project=video-tours",
    "--reporter=line",
  ];
  if (grep) args.push("--grep", grep);
  const result = spawnSync("npx", args, { stdio: "inherit", shell: true });
  return result.status === 0;
}

async function restoreFromBackup(
  title: string,
  backupMap: Map<string, string>,
): Promise<void> {
  const backupPath = backupMap.get(title);
  if (backupPath && existsSync(backupPath)) {
    await rename(backupPath, `${VIDEOS_DIR}/${title}.webm`).catch(() => {});
    console.log(`[${title}] restored from backup`);
  }
}

function cleanupBackupDir(): void {
  try {
    for (const f of readdirSync(BACKUP_DIR)) {
      try {
        unlinkSync(`${BACKUP_DIR}/${f}`);
      } catch {}
    }
    rmdirSync(BACKUP_DIR);
  } catch {}
}

async function sendNotification(
  playwrightFailed: boolean,
  failures: string[],
): Promise<void> {
  const DOMAIN = process.env.MAILGUN_DOMAIN;
  const API_KEY = process.env.MAILGUN_API_KEY;
  if (!DOMAIN || !API_KEY) {
    console.warn("Mailgun not configured, skipping notification.");
    return;
  }

  const lines: string[] = [];
  if (playwrightFailed) {
    lines.push("<p><strong>Playwright</strong> reported test failures.</p>");
  }
  if (failures.length > 0) {
    lines.push(
      `<p>The following video tours failed:</p><ul>${failures.map((f) => `<li>${f}</li>`).join("")}</ul>`,
    );
  }

  if (!process.env.FROM_EMAIL || !process.env.TO_EMAIL) {
    console.warn("Email addresses not configured, skipping notification.");
    return;
  }

  const mg = mailgun({ apiKey: API_KEY, domain: DOMAIN });
  try {
    await mg.messages().send({
      from: process.env.FROM_EMAIL,
      to: process.env.TO_EMAIL,
      subject: "Monitor Tests - Video Tour Failures",
      html: lines.join(""),
    });
    console.log("Failure notification sent.");
  } catch (err) {
    console.error("Failed to send notification:", err);
  }
}

async function main(): Promise<void> {
  const cliTours = process.argv.slice(2);
  const grep = buildGrep(cliTours);
  const isFiltered = !!grep;
  const filterTitles =
    cliTours.length > 0 ? new Set(cliTours) : undefined;
  if (cliTours.length > 0) {
    console.log(`Running only: ${cliTours.join(", ")}`);
  }

  // 1. Backup existing processed videos before touching anything
  //    When a subset of tours is requested, only back up those — leave the
  //    other project videos in place untouched.
  console.log("Backing up existing videos...");
  const backupMap = backupVideos(filterTitles);
  const backedUp = [...backupMap.keys()];
  console.log(
    `Backed up ${backedUp.length} video(s)${backedUp.length ? ": " + backedUp.join(", ") : ""}`,
  );

  // 2. Clear old .webm files so playwright writes fresh raw videos.
  //    With a filter, only remove the targeted titles so unrelated videos stay.
  mkdirSync(VIDEOS_DIR, { recursive: true });
  cleanVideos(filterTitles);

  // 3. Run playwright — continue even if some tests fail
  console.log("\nRunning playwright video tours...");
  const playwrightOk = runPlaywright(grep);
  if (!playwrightOk) {
    console.warn(
      "\nPlaywright reported failures — continuing to post-process whatever was generated...",
    );
  }

  // 4. Discover which raws were generated this run
  let rawFiles: string[] = [];
  try {
    rawFiles = readdirSync(VIDEOS_DIR).filter((f) => f.endsWith(".raw.webm"));
  } catch {}
  const generatedTitles = new Set(
    rawFiles.map((f) => f.replace(/\.raw\.webm$/, "")),
  );

  // 5. For backed-up titles that playwright didn't generate, restore immediately
  const playwrightFailures: string[] = [];
  for (const title of backupMap.keys()) {
    if (!generatedTitles.has(title)) {
      if (!isFiltered) playwrightFailures.push(title);
      await restoreFromBackup(title, backupMap);
    }
  }

  // 6. Post-process only the videos that were generated; restore backup on ffmpeg failure
  const customizations = loadCustomizations();
  const postFailures: string[] = [];
  if (rawFiles.length > 0) {
    console.log(`\nPost-processing ${rawFiles.length} video(s)...\n`);
    const results = [];
    for (const file of rawFiles) {
      const title = file.replace(/\.raw\.webm$/, "");
      const result = await processVideo(
        `${VIDEOS_DIR}/${file}`,
        customizations[title],
      );
      results.push(result);
      if (!result.ok) {
        postFailures.push(result.title);
        await restoreFromBackup(result.title, backupMap);
      }
    }
    console.log("\n=== Summary ===");
    printSummary(results);
  } else {
    console.log("\nNo raw videos to post-process.");
  }

  // 7. Clean up the temp backup dir and any hash-named temp files playwright left behind
  cleanupBackupDir();
  cleanTempFiles();

  // 8. Notify on any failure
  const allFailures = [...new Set([...playwrightFailures, ...postFailures])];
  const anyFailure = !playwrightOk || allFailures.length > 0;
  if (anyFailure) {
    console.log(
      `\nFailed tours: ${allFailures.join(", ") || "(see playwright output)"}`,
    );
    await sendNotification(!playwrightOk, allFailures);
  } else {
    console.log("\nAll video tours completed successfully!");
  }
}

main();
