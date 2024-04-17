export type Summary = {
  projects_count: number;
  last_update: string;
  passed: number;
  failed: number;
  duration: number;
};

export type ProjectStatus = {
  name: string;
  repo?: string;
  status: string;
  color?: string;
  startTime: Date;
  passed: number;
  failed: number;
  duration: number;
  tests: TestStatus[];
  badge?: ProjectBadge;
};

type ProjectBadge = {
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
  startTime: Date;
};

export type Project = {
  repo: string;
  title: string;
  repoUrl: string;
  url: string;
};

export type Report = {
  summary: Summary;
  projects: ProjectStatus[];
};
