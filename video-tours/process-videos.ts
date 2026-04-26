import { readdirSync, readFileSync } from "fs";
import { unlink, rename } from "fs/promises";
import { spawnSync } from "child_process";
import ffmpegStatic from "ffmpeg-static";

const FFMPEG = ffmpegStatic ?? "ffmpeg";

export interface VideoCustomization {
  cutAt?: number; // seconds from start — overrides auto-detection entirely
  cutAtAuto?: number; // seconds added on top of the auto-detected cut point
  speed?: number; // playback speed multiplier (e.g. 1.5 = 1.5x faster)
}

export type Customizations = Record<string, VideoCustomization>;

export function loadCustomizations(
  path = "video-tours/customizations.json",
): Customizations {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

const FRAME_W = 160;
const FRAME_H = 90;
const FRAME_BYTES = FRAME_W * FRAME_H * 3;
const FPS = 30;
const VARIANCE_THRESHOLD = 200;
const STABLE_FRAMES = 5; // ~0.17s at 30fps

function frameVariance(buf: Buffer, offset: number): number {
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let p = offset; p < offset + FRAME_BYTES; p += 9) {
    const v = (buf[p] + buf[p + 1] + buf[p + 2]) / 3;
    sum += v;
    sumSq += v * v;
    count++;
  }
  const mean = sum / count;
  return sumSq / count - mean * mean;
}

function findContentStart(videoPath: string): number {
  const result = spawnSync(
    FFMPEG,
    [
      "-i",
      videoPath,
      "-t",
      "30",
      "-vf",
      `fps=${FPS},scale=${FRAME_W}:${FRAME_H}`,
      "-f",
      "rawvideo",
      "-pix_fmt",
      "rgb24",
      "pipe:1",
    ],
    { maxBuffer: 100 * 1024 * 1024 },
  );

  const buf = result.stdout as Buffer;
  if (!buf || buf.length < FRAME_BYTES) return 5;

  const frameCount = Math.floor(buf.length / FRAME_BYTES);
  let streak = 0;
  let streakStart = 0;

  for (let i = 0; i < frameCount; i++) {
    if (frameVariance(buf, i * FRAME_BYTES) > VARIANCE_THRESHOLD) {
      if (streak === 0) streakStart = i;
      streak++;
      if (streak >= STABLE_FRAMES) return streakStart / FPS;
    } else {
      streak = 0;
    }
  }
  return 5;
}

function getDuration(filePath: string): number {
  // ffmpeg always prints "Duration: HH:MM:SS.ms" to stderr when reading a file
  const result = spawnSync(FFMPEG, ["-i", filePath], { encoding: "utf8" });
  const match = (result.stderr ?? "").match(/Duration:\s+(\d+):(\d+):([\d.]+)/);
  if (!match) return 0;
  return (
    parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3])
  );
}

export interface Result {
  title: string;
  raw: number;
  cutAt: number;
  final: number;
  speed: number;
  ok: boolean;
}

export async function processVideo(
  rawPath: string,
  override?: VideoCustomization,
): Promise<Result> {
  const title = rawPath.replace(/^videos[\\/]/, "").replace(/\.raw\.webm$/, "");
  const destPath = `videos/${title}.webm`;

  const raw = getDuration(rawPath);
  let cutAt: number;
  let cutSource: string;
  if (override?.cutAt !== undefined) {
    cutAt = override.cutAt;
    cutSource = "manual";
  } else {
    const detected = findContentStart(rawPath);
    const offset = override?.cutAtAuto ?? 0;
    cutAt = Math.min(detected + offset, raw * 0.4);
    cutSource = `detected: ${detected.toFixed(2)}s${offset !== 0 ? `${offset > 0 ? "+" : "-"} ${offset.toFixed(2)}s` : ""}`;
  }
  console.log(
    `[${title}] raw: ${raw.toFixed(2)}s | ${cutSource} | cut at: ${cutAt.toFixed(2)}s`,
  );

  const isCI = !!process.env.CI;
  const result = spawnSync(
    FFMPEG,
    [
      "-y",
      ...(isCI ? ["-loglevel", "error"] : []),
      "-i",
      rawPath,
      // hqdn3d: temporal denoiser that smooths VP8 blockiness in dynamic backgrounds
      "-vf",
      `select=gte(t\\,${cutAt}),setpts=(PTS-STARTPTS)/${override?.speed ?? 1.5},hqdn3d=2:2:4:4`,
      "-c:v",
      "libvpx-vp9",
      "-crf",
      "33", // visually transparent for screencasts (0–63 scale, lower = better)
      "-b:v",
      "0", // VBR mode driven purely by CRF
      "-deadline",
      "good", // quality-focused encoder preset
      "-cpu-used",
      "4", // 0=best/slowest … 8=fastest/worst
      "-g",
      "30", // keyframe every ~1s; limits artifact accumulation in motion areas
      "-fps_mode",
      "vfr",
      "-an",
      destPath,
    ],
    { stdio: "inherit" },
  );

  const speed = override?.speed ?? 1.5;
  if (result.status === 0) {
    await unlink(rawPath);
    const final = getDuration(destPath);
    console.log(`[${title}] final: ${final.toFixed(2)}s\n`);
    return { title, raw, cutAt, final, speed, ok: true };
  } else {
    await rename(rawPath, destPath).catch(() => {});
    console.log(`[${title}] ffmpeg failed, kept raw\n`);
    return { title, raw, cutAt, final: raw, speed, ok: false };
  }
}

export function printSummary(results: Result[]): void {
  const w = Math.max(...results.map((r) => r.title.length));
  const ok = results.filter((r) => r.ok).length;
  console.log("─".repeat(w + 49));
  console.log(
    `${"project".padEnd(w)}  ${"raw".padStart(6)}  ${"cut at".padStart(6)}  ${"final".padStart(6)}  ${"speed".padStart(5)}  status`,
  );
  console.log("─".repeat(w + 49));
  for (const r of results) {
    const status = r.ok ? "ok" : "FAILED";
    console.log(
      `${r.title.padEnd(w)}  ${(r.raw.toFixed(2) + "s").padStart(6)}  ${(r.cutAt.toFixed(2) + "s").padStart(6)}  ${(r.final.toFixed(2) + "s").padStart(6)}  ${(r.speed.toFixed(1) + "x").padStart(5)}  ${status}`,
    );
  }
  console.log("─".repeat(w + 49));
  console.log(`${ok}/${results.length} processed successfully`);
}

async function main(): Promise<void> {
  const rawFiles = readdirSync("videos").filter((f) => f.endsWith(".raw.webm"));
  if (rawFiles.length === 0) {
    console.log("No raw videos found in videos/");
    return;
  }
  console.log(`Processing ${rawFiles.length} video(s)...\n`);
  const results: Result[] = [];
  for (const file of rawFiles) {
    results.push(await processVideo(`videos/${file}`));
  }
  console.log("\n=== Summary ===");
  printSummary(results);
}

if (require.main === module) {
  main();
}
