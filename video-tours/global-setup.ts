import { promises as fs } from "fs";

export default async function globalSetup() {
  await fs.rm("videos", { recursive: true, force: true });
  await fs.mkdir("videos", { recursive: true });
}
