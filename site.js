// Shared page behavior: mobile menu, project cards, hover previews, scroll reveal.
// Load after projects.js (when the page lists projects).

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

function projectCard(p) {
  const page = `projects/${p.slug}.html`;
  const still = p.image
    ? `<img src="${escapeHtml(p.image)}" alt="" loading="lazy" />`
    : `<i class="bi bi-${escapeHtml(p.icon || "code-slash")}"></i>`;
  const video = p.video
    ? `<video src="${escapeHtml(p.video)}" muted loop playsinline preload="none"></video>`
    : "";
  const play = p.play
    ? `<a class="btn-terminal" href="${escapeHtml(p.play)}">Play <i class="bi bi-play-fill"></i></a>`
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
        <h3><a class="project-link" href="${page}">${escapeHtml(p.title)}</a></h3>
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
  });
}

// Play a card's preview clip while hovered; show the still image otherwise
function setupHoverPreviews() {
  document.querySelectorAll(".project-card").forEach((card) => {
    const video = card.querySelector(".project-media video");
    if (!video) return;
    video.addEventListener("playing", () => card.classList.add("previewing"));
    card.addEventListener("mouseenter", () => video.play().catch(() => {}));
    card.addEventListener("mouseleave", () => {
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
setupHoverPreviews();
setupReveal();
