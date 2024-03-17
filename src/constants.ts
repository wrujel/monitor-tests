export const adminDashboardNextProject = {
  title: "Admin Dashboard Next",
  repoUrl: "https://github.com/wrujel/admin-dashboard-next",
  projectUrl: "https://admin-dashboard-next-roan.vercel.app/",
};

export const moviesSearchProject = {
  title: "Movies Search",
  repoUrl: "https://github.com/wrujel/movies-search",
  projectUrl: "https://movies-search-five.vercel.app/",
};

export const portfolioWebProject = {
  title: "Portfolio Web",
  repoUrl: "https://github.com/wrujel/portfolio-web",
  projectUrl: "https://portfolio-web-wrujel.vercel.app/",
};

export const projects = [
  adminDashboardNextProject,
  moviesSearchProject,
  portfolioWebProject,
];

export const PLACEHOLDER_SUMMARY = "%{{summary}}%";
export const PLACEHOLDER_TABLE = "%{{table}}%";

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
