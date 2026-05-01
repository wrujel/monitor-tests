export const admin_dashboard_next = {
  title: "admin-dashboard-next",
  projectUrl: "https://admin-dashboard-next-roan.vercel.app",
  repoUrl: "https://github.com/wrujel/admin-dashboard-next",
};
export const airbnb_clone = {
  title: "airbnb-clone",
  projectUrl: "https://demo-airbnb-clone-three-phi-45.vercel.app/",
  repoUrl: "https://github.com/wrujel/airbnb-clone",
};
export const clock_app = {
  title: "clock-app",
  projectUrl: "https://clock-app-wrujel.vercel.app",
  repoUrl: "https://github.com/wrujel/clock-app",
};
export const django_crud_react = {
  title: "django-crud-react",
  projectUrl: "https://django-crud-react.onrender.com",
  repoUrl: "https://github.com/wrujel/django-crud-react",
};
export const github_history = {
  title: "github-history",
  projectUrl: "https://github-history.vercel.app",
  repoUrl: "https://github.com/wrujel/github-history",
};
export const movies_search = {
  title: "movies-search",
  projectUrl: "https://movies-search-five.vercel.app",
  repoUrl: "https://github.com/wrujel/movies-search",
};
export const netflix_clone = {
  title: "netflix-clone",
  projectUrl: "https://movies-app-o2ff-git-main-wrujels-projects.vercel.app",
  repoUrl: "https://github.com/wrujel/netflix-clone",
};
export const portfolio_web_template = {
  title: "portfolio-web-template",
  projectUrl: "https://portfolio-web-wrujel.vercel.app",
  repoUrl: "https://github.com/wrujel/portfolio-web-template",
};
export const rest_api_et = {
  title: "rest-api-et",
  projectUrl: "https://rest-api-et.onrender.com",
  repoUrl: "https://github.com/wrujel/rest-api-et",
};
export const slider_static = {
  title: "slider-static",
  projectUrl: "https://ephemeral-zuccutto-49ec06.netlify.app",
  repoUrl: "https://github.com/wrujel/slider-static",
};
export const tesla_landing = {
  title: "tesla-landing",
  projectUrl: "https://sage-daffodil-4904c3.netlify.app",
  repoUrl: "https://github.com/wrujel/tesla-landing",
};
export const tetris_javascript = {
  title: "tetris-javascript",
  projectUrl: "https://tetris-javascript-pi.vercel.app",
  repoUrl: "https://github.com/wrujel/tetris-javascript",
};
export const webpage_gpt = {
  title: "webpage-gpt",
  projectUrl: "https://webpage-gpt-wrujels-projects.vercel.app/",
  repoUrl: "https://github.com/wrujel/webpage-gpt",
};
export const blog = {
  title: "blog",
  projectUrl: "https://blog.wrujel.com",
  repoUrl: "",
};
export const leetcode_ui = {
  title: "leetcode-ui",
  projectUrl: "https://leetcode-tracker-qvf.pages.dev",
  repoUrl: "",
};
export const portfolio = {
  title: "portfolio",
  projectUrl: "https://wrujel.com",
  repoUrl: "",
};

// When LOCAL_PROJECT + LOCAL_URL are set, override the matching project's URL
// so the same spec/tour can run against a local dev server.
const _localProject = process.env.LOCAL_PROJECT;
const _localUrl = process.env.LOCAL_URL;
if (_localProject && _localUrl) {
  const all = [
    admin_dashboard_next,
    airbnb_clone,
    clock_app,
    django_crud_react,
    github_history,
    movies_search,
    netflix_clone,
    portfolio_web_template,
    rest_api_et,
    slider_static,
    tesla_landing,
    tetris_javascript,
    webpage_gpt,
    blog,
    leetcode_ui,
    portfolio,
  ];
  for (const p of all) {
    if (p.title === _localProject) p.projectUrl = _localUrl;
  }
}
