export type Summary = {
  projects_count: Number;
  last_update: String;
  passed: Number;
  failed: Number;
};

export type ProjectStatus = {
  name: String;
  status: String;
  startTime: Date;
  tests: TestStatus[];
};

type TestStatus = {
  name: String;
  status: String;
  duration: Number;
  startTime: Date;
};
