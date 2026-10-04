// Writes the project cards into the HTML of index.html and projects/index.html,
// so search engines and AI crawlers that don't run JavaScript still see them.
//
// The cards come from the same template the browser uses (projectCard in
// assets/js/site.js) and the same data (assets/js/projects.js). In the
// browser, site.js still re-renders them from projects.js, so the live site is
// always current; this file only refreshes the static copy.
//
// Runs automatically on every deploy (.github/workflows/static.yml).
// To run it yourself:  node tools/prerender.js

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const FAKE_ORIGIN = "https://prerender.invalid/";
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

// Just enough of a browser for site.js to load without touching a real page
const sandbox = {
  document: {
    currentScript: { src: FAKE_ORIGIN + "assets/js/site.js" },
    querySelector: () => null,
    querySelectorAll: () => [],
  },
  matchMedia: () => ({ matches: true }),
  requestAnimationFrame: () => {},
  IntersectionObserver: class {
    observe() {}
  },
  URL,
};
vm.createContext(sandbox);
const { PROJECTS, projectCard } = vm.runInContext(
  read("assets/js/projects.js") +
    "\n" +
    read("assets/js/site.js") +
    "\n;({ PROJECTS, projectCard });",
  sandbox,
);

const START = /(<!-- prerender:start[^>]*-->)[\s\S]*?(\s*<!-- prerender:end -->)/;

// [page, prefix from that page back to the site root]
const PAGES = [
  ["index.html", ""],
  ["projects/index.html", "../"],
];

for (const [file, rootPrefix] of PAGES) {
  let html = read(file);
  const limitMatch = html.match(/data-projects(?:="(\d+)")?>\s*<!-- prerender:start/);
  if (!limitMatch || !START.test(html)) {
    throw new Error(`${file}: prerender markers not found`);
  }
  const limit = parseInt(limitMatch[1], 10) || PROJECTS.length;
  const cards = PROJECTS.slice(0, limit)
    .map((p) => projectCard(p).split(FAKE_ORIGIN).join(rootPrefix))
    .join("")
    .replace(/^\n/, "")
    .replace(/^/gm, "      "); // indent to sit inside the list

  html = html.replace(START, (_, start, end) => `${start}\n${cards}${end}`);
  fs.writeFileSync(path.join(ROOT, file), html);
  console.log(`${file}: ${Math.min(limit, PROJECTS.length)} cards`);
}
