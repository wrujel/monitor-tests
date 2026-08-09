export type Summary = {
  projects_count: number;
  last_update: string;
  passed: number;
  failed: number;
  duration: number;
};

export type ProjectStatus = {
  name: string;
  repo: string;
  /** the deployed URL and the GitHub repo. Written by the scheduler container
   *  from its own registry — which is why data/projects.json is gone. Optional
   *  because the 90 entries already in report.json predate them. */
  url?: string;
  repoUrl?: string;
  /** where it is deployed ("Vercel", "Cloudflare Workers"), from the project's
   *  tech stack in the studio. Optional for the same reason as the two above,
   *  plus one more: a stack that names no host leaves the vendor to be read off
   *  the URL, which is all a *.onrender.com project has ever needed. */
  vendor?: string;
  status: string;
  color?: string;
  startTime?: string | null;
  passed: number;
  failed: number;
  duration: number;
  tests: TestStatus[];
};

/** A shields.io endpoint payload — written to data/<repo>.json for the status
 *  badge every project README embeds. */
export type ProjectBadge = {
  schemaVersion: 1;
  label: string;
  message: string;
  color?: string;
  labelColor?: string;
  isError?: boolean;
  namedLogo?: string;
  logoSvg?: string;
  logoColor?: string;
  style?: string;
};

type TestStatus = {
  name: string;
  status: string;
  duration: number;
  startTime?: string;
};

export type Report = {
  summary: Summary;
  projects: ProjectStatus[];
};
