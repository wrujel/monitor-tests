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
  status: string;
  startTime: Date;
  passed: number;
  failed: number;
  duration: number;
  tests: TestStatus[];
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
