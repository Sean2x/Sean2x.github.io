// Project list — the single source for the home page and projects.html.
//
// To add a project:
//   1. Add an entry below. Order matters: the home page shows the first 3.
//   2. Copy a page in projects/ (e.g. projects/fish-swarm.html) to
//      projects/<slug>.html and write it up.
//
// Fields (paths are relative to the site root):
//   slug     file name of the write-up page in projects/ (no .html)
//   title    card + page title
//   summary  one or two sentences shown on the card
//   tags     short labels shown under the title
//   light    color of the terminal status light: "green" | "yellow" | "red" | "main"
//   image    static thumbnail; if empty, `icon` is shown instead
//   icon     Bootstrap Icons name used when there's no image
//   video    optional short muted clip (.mp4/.webm) that plays on hover —
//            keep it small (a few MB) since it downloads on first hover
//   play     optional link to a live demo, shown as a button on the card
const PROJECTS = [
  {
    slug: "portfolio-website",
    title: "Portfolio Website",
    summary:
      "My first serious dive into the raw mechanics of the web—learning how HTML structures ideas, CSS shapes them visually, and JavaScript gives them motion and behavior.",
    tags: ["HTML", "CSS", "JavaScript"],
    light: "green",
    image: "",
    icon: "code-slash",
    video: "",
    play: "",
  },
  {
    slug: "lexicon",
    title: "Lexicon",
    summary:
      "A spelling game built with HTML, CSS, and JavaScript—an interactive way for players to test their spelling.",
    tags: ["HTML", "CSS", "JavaScript", "Game"],
    light: "green",
    image: "",
    icon: "spellcheck",
    video: "",
    play: "Lexicon.html",
  },
  {
    slug: "fish-swarm",
    title: "Fish Swarm",
    summary:
      "Ever wondered what it would be like to be a fish? Chase a swarm of fish that try to dodge your cursor—be quick and strategic to catch them all.",
    tags: ["JavaScript", "Canvas", "Game"],
    light: "yellow",
    image: "Images/Goldfish.png",
    icon: "water",
    video: "",
    play: "FishGame.html",
  },
];
