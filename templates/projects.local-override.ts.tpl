
// When LOCAL_PROJECT + LOCAL_URL are set, override the matching project's URL
// so the same spec/tour can run against a local dev server.
const _localProject = process.env.LOCAL_PROJECT;
const _localUrl = process.env.LOCAL_URL;
if (_localProject && _localUrl) {
  const all = [
%{{projectList}}%
  ];
  for (const p of all) {
    if (p.title === _localProject) p.projectUrl = _localUrl;
  }
}
