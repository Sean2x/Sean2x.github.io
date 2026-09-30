// Matrix rain background. Needs <canvas id="matrixCanvas"> on the page.
// Runs at ~30fps, pauses while the tab is hidden, and stays off for
// visitors who prefer reduced motion.

(function () {
  const canvas = document.getElementById("matrixCanvas");
  if (!canvas) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d");
  const css = getComputedStyle(document.documentElement);
  const light = css.getPropertyValue("--lightMain").trim();
  const dark = css.getPropertyValue("--darkMain").trim();

  const chars = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const fontSize = 19;
  const frameMs = 33;
  let drops = [];
  let gradient;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Keep existing columns, add/remove at the right edge
    const columns = Math.floor(canvas.width / fontSize);
    drops = Array.from({ length: columns }, (_, i) => drops[i] ?? 1);
    gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, light);
    gradient.addColorStop(1, dark);
  }

  function draw() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = gradient;
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  // requestAnimationFrame stops on its own while the tab is hidden
  let last = 0;
  function loop(now) {
    if (now - last >= frameMs) {
      last = now;
      draw();
    }
    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(loop);
})();
