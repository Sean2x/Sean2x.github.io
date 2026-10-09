// Vertical tabs: <div data-tabs> containing [role=tablist] > [role=tab] (with
// data-hash) and matching [role=tabpanel]s. Up/Down arrows move between tabs,
// the URL hash selects a tab, and panels may hold an <iframe data-src> that
// only loads the first time its tab opens.
(function () {
  document.querySelectorAll("[data-tabs]").forEach((root) => {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const panelOf = (tab) => document.getElementById(tab.getAttribute("aria-controls"));

    function select(tab, { focus = false, updateHash = true } = {}) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", on);
        t.tabIndex = on ? 0 : -1;
        panelOf(t).hidden = !on;
      });
      const frame = panelOf(tab).querySelector("iframe[data-src]");
      if (frame) {
        frame.src = frame.dataset.src;
        frame.removeAttribute("data-src");
      }
      if (focus) tab.focus();
      if (updateHash) history.replaceState(null, "", `#${tab.dataset.hash}`);
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (e) => {
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (step) {
          e.preventDefault();
          select(tabs[(i + step + tabs.length) % tabs.length], { focus: true });
        } else if (e.key === "Home" || e.key === "End") {
          e.preventDefault();
          select(tabs[e.key === "Home" ? 0 : tabs.length - 1], { focus: true });
        }
      });
    });

    const fromHash = () =>
      tabs.find((t) => `#${t.dataset.hash}` === location.hash) || tabs[0];
    select(fromHash(), { updateHash: false });
    window.addEventListener("hashchange", () => select(fromHash(), { updateHash: false }));
  });
})();
