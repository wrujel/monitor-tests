export type Summary = {
  projects_count: Number;
  last_update: string;
  passed: Number;
  failed: Number;
};

export type ProjectStatus = {
  name: string;
  status: string;
  startTime: Date;
  tests: TestStatus[];
};

type TestStatus = {
  name: string;
  status: string;
  duration: Number;
  startTime: Date;
};

export type Project = {
  repo: string;
  title: string;
  repoUrl: string;
  url: string;
};
