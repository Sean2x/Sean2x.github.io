// Posts — what I've been working on. Feeds the "Recent posts" box on the home
// page and the full list at posts/.
//
// To add a post: put a new entry at the TOP of the list (newest first), and
// drop its photo in assets/img/posts/. The home page shows the first 3.
//
// Fields (paths are relative to the site root, no leading slash):
//   id     short unique name, used as the link anchor (posts/#<id>)
//   date   YYYY-MM-DD
//   title  headline
//   text   a few sentences on what you worked on
//   image  photo path, e.g. "assets/img/posts/my-photo.jpg"
//   alt    short description of the photo (for screen readers)
//   link   optional "Read more" target (a project page, video, ...)
const POSTS = [
  {
    id: "root-locus-explorer",
    date: "2026-10-09",
    title: "Built a PID root locus explorer",
    text: "Move a PID gain and watch the root locus, the closed-loop poles, and the step response change together. MATLAB shows the locus but hides why it moves, so I made a tool that shows the link between pole location and behavior. It also runs a Routh–Hurwitz check, which catches systems where every coefficient is positive but poles are still in the right half-plane.",
    image: "assets/img/posts/root-locus-explorer.png",
    alt: "The PID Root Locus Explorer showing a root locus plot, step response, and Routh array",
    link: "projects/pid.html#root-locus",
  },
];
