// Shared page behavior: mobile menu, project cards, hover previews,
// write-up prev/next links, scroll reveal.
// Load after projects.js (on pages that list projects).

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
    ? `<a class="btn-terminal" href="${fromRoot(p.play)}">Play <i class="bi bi-play-fill"></i></a>`
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

// Play a card's preview clip while hovered with a mouse; touch devices keep
// the still (a tap navigates, so it shouldn't start a download)
function setupHoverPreviews() {
  document.querySelectorAll(".project-card").forEach((card) => {
    const video = card.querySelector(".project-media video");
    if (!video) return;
    video.addEventListener("playing", () => card.classList.add("previewing"));
    card.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") video.play().catch(() => {});
    });
    card.addEventListener("pointerleave", () => {
      card.classList.remove("previewing");
      video.pause();
      video.currentTime = 0;
    });
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
  document
    .querySelectorAll(".apple-fade")
    .forEach((el) => observer.observe(el));
}

renderProjects();
renderPostNav();
setupHoverPreviews();
setupReveal();
