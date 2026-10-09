// Shared page behavior: mobile menu, project cards, post cards, hover previews,
// write-up prev/next links, scroll reveal.
// Load after projects.js / posts.js (on pages that list them).

// Site root, derived from this script's own URL (assets/js/site.js), so
// project paths resolve the same from any folder depth
const SITE_ROOT = new URL("../../", document.currentScript.src);
const fromRoot = (path) => new URL(path, SITE_ROOT).href;

function toggleMenu() {
  document.querySelector(".nav").classList.toggle("active");
}

const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

const projectPage = (p) => fromRoot(`projects/${p.slug}.html`);

function projectCard(p) {
  const still = p.image
    ? `<img src="${fromRoot(p.image)}" alt="" loading="lazy" />`
    : `<i class="bi bi-${escapeHtml(p.icon || "code-slash")}"></i>`;
  const video = p.video
    ? `<video src="${fromRoot(p.video)}" muted loop playsinline preload="none"></video>`
    : "";
  const play = p.play
    ? `<a class="btn-terminal" href="${fromRoot(p.play)}">${escapeHtml(p.playLabel || "Play")} <i class="bi bi-play-fill"></i></a>`
    : "";

  return `
    <article class="project-card terminal-window apple-fade">
      <div class="terminal-window-top">
        <div class="terminal-btn is-${escapeHtml(p.light || "main")}"></div>
        <div class="terminal-btn"></div>
        <div class="terminal-btn"></div>
        <span>${escapeHtml(p.slug)}</span>
      </div>
      <div class="project-media">${still}${video}</div>
      <div class="project-info">
        <h3><a class="project-link" href="${projectPage(p)}">${escapeHtml(p.title)}</a></h3>
        <p class="project-tags">${p.tags.map(escapeHtml).join(" · ")}</p>
        <p class="project-summary">${escapeHtml(p.summary)}</p>
        <div class="project-actions">
          <span class="read-more">Read more <i class="bi bi-arrow-right"></i></span>
          ${play}
        </div>
      </div>
    </article>`;
}

const formatDate = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

// One post: photo, date, title, text. `compact` is the small version used in
// the home page box (links to the full post on posts/).
function postCard(p, compact) {
  const href = compact ? fromRoot(`posts/#${p.id}`) : "";
  const photo = p.image
    ? `<img src="${fromRoot(p.image)}" alt="${escapeHtml(p.alt || "")}" loading="lazy" />`
    : `<i class="bi bi-journal-text"></i>`;
  const more =
    !compact && p.link
      ? `<a class="read-more-link" href="${fromRoot(p.link)}">Read more <i class="bi bi-arrow-right"></i></a>`
      : "";
  const title = compact
    ? `<a class="post-card-link" href="${href}">${escapeHtml(p.title)}</a>`
    : escapeHtml(p.title);
  return `
    <article class="post-card${compact ? " compact" : ""}" id="${compact ? "" : escapeHtml(p.id)}">
      <div class="post-card-media">${photo}</div>
      <div class="post-card-body">
        <time datetime="${escapeHtml(p.date)}">${formatDate(p.date)}</time>
        <h3>${title}</h3>
        <p>${escapeHtml(p.text)}</p>
        ${more}
      </div>
    </article>`.replace(' id=""', "");
}

// Fill every [data-posts] container; the attribute value is an optional limit
function renderPosts() {
  if (typeof POSTS === "undefined") return;
  const lists = document.querySelectorAll("[data-posts]");
  lists.forEach((list) => {
    const limit = parseInt(list.dataset.posts, 10) || POSTS.length;
    const compact = list.hasAttribute("data-compact");
    list.innerHTML = POSTS.slice(0, limit)
      .map((p) => postCard(p, compact))
      .join("");
  });
  // Posts are rendered after load, so honor a #id in the URL by hand
  if (lists.length && location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

// Fill every [data-projects] container; the attribute value is an optional limit
function renderProjects() {
  if (typeof PROJECTS === "undefined") return;
  document.querySelectorAll("[data-projects]").forEach((list) => {
    const limit = parseInt(list.dataset.projects, 10) || PROJECTS.length;
    list.innerHTML = PROJECTS.slice(0, limit).map(projectCard).join("");
    // Stagger cards that reveal together
    list.querySelectorAll(".project-card").forEach((card, i) => {
      card.style.setProperty("--delay", `${(i % 3) * 0.15}s`);
    });
  });
}

// Previous/next links at the end of a write-up: <nav data-post-nav="slug">
function renderPostNav() {
  const nav = document.querySelector("[data-post-nav]");
  if (!nav || typeof PROJECTS === "undefined") return;
  const i = PROJECTS.findIndex((p) => p.slug === nav.dataset.postNav);
  if (i < 0) return;
  const link = (p, dir) =>
    p
      ? `<a class="post-nav-link ${dir}" href="${projectPage(p)}">
           <span>${dir === "prev" ? "← Previous" : "Next →"}</span>
           <strong>${escapeHtml(p.title)}</strong>
         </a>`
      : "<span></span>";
  nav.innerHTML = link(PROJECTS[i - 1], "prev") + link(PROJECTS[i + 1], "next");
}

// Preview clips: with a mouse they play on hover; on touch screens (no
// hover) they play while the card is mostly on screen. The still shows
// otherwise, and reduced-motion visitors only ever see the still.
function setupHoverPreviews() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const touch = matchMedia("(hover: none)").matches;

  const start = (video) => video.play().catch(() => {});
  const stop = (card, video) => {
    card.classList.remove("previewing");
    video.pause();
    video.currentTime = 0;
  };

  const inView = touch
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach(({ target: card, isIntersecting }) => {
            const video = card.querySelector(".project-media video");
            isIntersecting ? start(video) : stop(card, video);
          });
        },
        { threshold: 0.6 },
      )
    : null;

  document.querySelectorAll(".project-card").forEach((card) => {
    const video = card.querySelector(".project-media video");
    if (!video) return;
    video.addEventListener("playing", () => card.classList.add("previewing"));

    if (touch) {
      inView.observe(card);
      return;
    }
    card.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") start(video);
    });
    card.addEventListener("pointerleave", () => stop(card, video));
  });
}

// Reveal .apple-fade elements once as they scroll into view
function setupReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );
  const all = [...document.querySelectorAll(".apple-fade")];

  // The intro is the first screen, so its pieces animate on load. Waiting
  // for them to scroll into view fails on phones: they start 70px low,
  // fully clipped by the panel, so they'd never count as visible.
  const intro = all.filter((el) => el.closest(".hero"));
  requestAnimationFrame(() =>
    requestAnimationFrame(() => intro.forEach((el) => el.classList.add("show"))),
  );

  all.filter((el) => !el.closest(".hero")).forEach((el) => observer.observe(el));
}

renderProjects();
renderPosts();
renderPostNav();
setupHoverPreviews();
setupReveal();
