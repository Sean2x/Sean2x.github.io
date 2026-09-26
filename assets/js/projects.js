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
const PROJECTS = [
  {
    slug: "fish-swarm",
    title: "Fish Swarm",
    summary:
      "Ever wondered what it would be like to be a fish? Chase a swarm of fish that try to dodge your cursor—be quick and strategic to catch them all.",
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
      "A spelling game built with HTML, CSS, and JavaScript—an interactive way for players to test their spelling.",
    tags: ["HTML", "CSS", "JavaScript", "Game"],
    light: "green",
    image: "assets/img/projects/lexicon.png",
    icon: "spellcheck",
    video: "assets/video/projects/lexicon.mp4",
    play: "games/lexicon/",
  },
  {
    slug: "portfolio-website",
    title: "Portfolio Website",
    summary:
      "My first serious dive into the raw mechanics of the web—learning how HTML structures ideas, CSS shapes them visually, and JavaScript gives them motion and behavior.",
    tags: ["HTML", "CSS", "JavaScript"],
    light: "green",
    image: "assets/img/projects/portfolio-website.png",
    icon: "code-slash",
    video: "assets/video/projects/portfolio-website.mp4",
    play: "",
  },
];
