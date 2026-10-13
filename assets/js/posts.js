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
    id: "rotation-matrices",
    date: "2026-10-13",
    title: "Learning rotation matrices by turning a ball",
    text: "I'm learning rotation matrices, so I built a ball cut into 8 octants by three dotted rings, with yaw, pitch, and roll sliders. Next to it are the matrices from class, typed out and expanded, plus a corner widget with the fixed axes and the ball's own axes. The big lesson: the same angles in a different order land in a different orientation, and a sequence about moving axes equals the reverse sequence about fixed ones. I added a second mode where every drag turns the ball about its own x′, y′, or z′, and wrote up what I learned underneath.",
    image: "assets/img/posts/rotation-matrices.jpg",
    alt: "A ball with colored dotted rings and an axis widget, beside the typed-out yaw, pitch, and roll rotation matrices",
    link: "projects/pid.html#rotations",
  },
  {
    id: "controls-tooling",
    date: "2026-10-09",
    title: "Controls Tooling: my old Python sims now play in the browser",
    text: "I gathered my controls projects into one page, Controls Tooling, with a tab for each tool. My first PID demo and the Zero-G flight simulator started as Python and Tkinter programs, so I ported both to the browser with the same constants and update order. Now anyone can drag Kp, Ki, and Kd and watch the dot overshoot and settle without installing anything.",
    image: "assets/img/posts/pid-demo-browser.jpg",
    alt: "The PID demo in the browser: a red trail from a blue dot settling onto a target line, with Kp, Ki, and Kd sliders below",
    link: "projects/pid.html#pid-demo",
  },
  {
    id: "root-locus-explorer",
    date: "2026-10-09",
    title: "Built a PID root locus explorer",
    text: "Move a PID gain and watch the root locus, the closed-loop poles, and the step response change together. MATLAB shows the locus but hides why it moves, so I made a tool that shows the link between pole location and behavior. It also runs a Routh–Hurwitz check, which catches systems where every coefficient is positive but poles are still in the right half-plane. It now has a guide that explains damping, what Ki adds, and how to read the plot, and you can pan and zoom the locus yourself.",
    image: "assets/img/posts/root-locus-explorer.png",
    alt: "The PID Root Locus Explorer showing a root locus plot, step response, and Routh array",
    link: "projects/pid.html#root-locus",
  },
];
