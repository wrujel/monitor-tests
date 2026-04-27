import crypto from "crypto";
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
} from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const VIDEOS_DIR = "videos";
const ASSETS_FILE = "data/cloudinary_assets.json";
const FOLDER = "monitor-tests";

const args = process.argv.slice(2);
const force = args.includes("--force");
const projectFilter = new Set(
  args.filter((a) => !a.startsWith("--")).map((a) => a.replace(/\.webm$/, "")),
);

if (!process.env.CLOUDINARY_URL) {
  console.error(
    "[upload] CLOUDINARY_URL env var is required.\n" +
      "  Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME",
  );
  process.exit(1);
}

const parsedUrl = new URL(process.env.CLOUDINARY_URL);
const cloudName = parsedUrl.hostname;
const apiKey = decodeURIComponent(parsedUrl.username);
const apiSecret = decodeURIComponent(parsedUrl.password);
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

console.log(
  `[upload] cloud: ${cloudName}  force: ${force}` +
    (projectFilter.size > 0
      ? `  projects: ${[...projectFilter].join(", ")}`
      : ""),
);

function signParams(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(sorted + apiSecret).digest("hex");
}

function cloudinaryUrl(repoName: string, version?: number): string {
  const vSegment = version ? `v${version}/` : "";
  return `https://res.cloudinary.com/${cloudName}/video/upload/${vSegment}${FOLDER}/${repoName}`;
}

async function uploadFile(localPath: string, publicId: string): Promise<any> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const params = {
    public_id: publicId,
    overwrite: force ? "true" : "false",
    timestamp,
  };
  const signature = signParams(params);

  const fileBuffer = readFileSync(localPath);
  const form = new FormData();
  form.append(
    "file",
    new Blob([fileBuffer], { type: "video/webm" }),
    path.basename(localPath),
  );
  form.append("public_id", publicId);
  form.append("overwrite", force ? "true" : "false");
  form.append("timestamp", timestamp);
  form.append("api_key", apiKey);
  form.append("signature", signature);

  const res = await fetch(UPLOAD_URL, { method: "POST", body: form });
  const result = (await res.json()) as any;
  if (!res.ok) throw new Error(result?.error?.message || JSON.stringify(result));
  return result;
}

async function main() {
  let assets: Record<string, string> = {};
  if (existsSync(ASSETS_FILE)) {
    assets = JSON.parse(readFileSync(ASSETS_FILE, "utf-8"));
  }

  let videos: string[] = [];
  try {
    videos = readdirSync(VIDEOS_DIR).filter(
      (f) => f.endsWith(".webm") && !f.endsWith(".raw.webm"),
    );
  } catch {}

  if (projectFilter.size > 0) {
    const before = videos.length;
    videos = videos.filter((f) => projectFilter.has(f.replace(/\.webm$/, "")));
    const missing = [...projectFilter].filter(
      (p) => !videos.includes(`${p}.webm`),
    );
    if (missing.length > 0) {
      console.warn(`[upload] not found in ${VIDEOS_DIR}/: ${missing.join(", ")}`);
    }
    console.log(`[upload] filtered: ${videos.length}/${before} videos`);
  }

  if (videos.length === 0) {
    console.log("[upload] no processed videos found.");
    process.exit(0);
  }

  let uploaded = 0,
    skipped = 0,
    errors = 0;

  for (const file of videos) {
    const repoName = file.replace(/\.webm$/, "");

    if (!force && assets[repoName]) {
      console.log(`  ⊘ skip (exists): ${repoName}`);
      skipped++;
      continue;
    }

    const localPath = `${VIDEOS_DIR}/${file}`;
    const publicId = `${FOLDER}/${repoName}`;

    try {
      console.log(`  ⟳ uploading: ${repoName}...`);
      const result = await uploadFile(localPath, publicId);
      assets[repoName] = cloudinaryUrl(repoName, result.version);
      const mb = (result.bytes / 1024 / 1024).toFixed(2);
      console.log(`  ✓ uploaded: ${repoName}  (${mb} MB)`);
      uploaded++;
    } catch (err) {
      console.error(
        `  ✗ error: ${repoName}:`,
        err instanceof Error ? err.message : err,
      );
      errors++;
    }
  }

  mkdirSync(path.dirname(ASSETS_FILE), { recursive: true });
  writeFileSync(ASSETS_FILE, JSON.stringify(assets, null, 2), "utf-8");
  console.log(`\n📄 written: ${ASSETS_FILE}`);
  console.log(
    `[upload] done — uploaded: ${uploaded}  skipped: ${skipped}  errors: ${errors}`,
  );

  if (errors > 0) process.exit(1);
}

main();
