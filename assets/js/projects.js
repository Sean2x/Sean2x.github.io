// Project list — the single source for the home page, projects/index.html,
// and the previous/next links at the bottom of each write-up.
//
// To add a project:
//   1. Add an entry below. Order matters: the home page shows the first 3.
//   2. Copy projects/_template.html to projects/<slug>.html and write it up.
//   3. Put media in assets/img/projects/<slug>.png and
//      assets/video/projects/<slug>.mp4.
//
// Fields (paths are relative to the site root, no leading slash):
//   slug     file name of the write-up page in projects/ (no .html)
//   title    card + page title
//   summary  one or two sentences shown on the card
//   tags     short labels shown under the title
//   light    color of the terminal status light: "green" | "yellow" | "red" | "main"
//   image    static thumbnail; if empty, `icon` is shown instead
//   icon     Bootstrap Icons name used when there's no image
//   video    optional short muted clip that plays on hover — it only
//            downloads on first hover, but smaller is better
//   play     optional link to a live demo, shown as a button on the card
//   playLabel optional button text (default "Play")
const PROJECTS = [
  {
    slug: "pid",
    title: "Controls Tooling",
    summary:
      "Control-systems tools you can play with in the browser: a root locus explorer that shows why poles move when you turn a PID gain, a PID tuning demo, and a Zero-G flight simulator.",
    tags: ["TypeScript", "Controls", "Canvas", "PID"],
    light: "green",
    image: "assets/img/projects/pid.png",
    icon: "sliders",
    video: "",
    play: "projects/pid.html#root-locus",
    playLabel: "Try it",
  },
  {
    slug: "fish-swarm",
    title: "Fish Simulator",
    summary:
      "A browser fish swarm where simple local rules add up to a school that feels alive—and reacts to your mouse.",
    tags: ["JavaScript", "Canvas", "Game"],
    light: "yellow",
    image: "assets/img/projects/fish-swarm.png",
    icon: "water",
    video: "assets/video/projects/fish-swarm.mp4",
    play: "games/fish-swarm/",
  },
  {
    slug: "lexicon",
    title: "Lexicon",
    summary:
      "A browser spelling game inspired by Bookworm Adventures. 10+ players kept coming back for 7+ days straight—and started competing with each other.",
    tags: ["HTML", "CSS", "JavaScript", "Game"],
    light: "green",
    image: "assets/img/projects/lexicon.png",
    icon: "spellcheck",
    video: "assets/video/projects/lexicon.mp4",
    play: "games/lexicon/",
  },
  {
    slug: "portfolio-website",
    title: "Personal Website",
    summary:
      "My home base—built from zero web experience and shaped by feedback from ~10 test users. Make it exist first, then make it good.",
    tags: ["HTML", "CSS", "JavaScript", "Git"],
    light: "green",
    image: "assets/img/projects/portfolio-website.png",
    icon: "code-slash",
    video: "assets/video/projects/portfolio-website.mp4",
    play: "",
  },
];
