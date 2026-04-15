const styles = getComputedStyle(document.documentElement);

const fishColor = styles.getPropertyValue("--Fish");
const sharkColor = styles.getPropertyValue("--Shark");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// =====================
// CONFIG (ALL TUNING HERE)
// =====================
const CONFIG = {
  panicRadius: 60,
  alertRadius: 150,

  speed: {
    calm: 2,
    alert: 3,
    panic: 4,
  },

  force: {
    alert: 0.6,
    panic: 1.2,
  },

  drift: {
    calm: 0.1,
    alert: 0.06,
    panic: 0.03,
  },

  damping: {
    calm: 0.995,
    alert: 1,
    panic: 1,
  },
};

// =====================
// ENTITY
// =====================
let fish = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  vx: 0,
  vy: 0,
  angle: 0,
  state: "calm",
};

let mouse = {
  x: canvas.width / 2,
  y: canvas.height / 2,
};

function setTarget(x, y) {
  mouse.x = x;
  mouse.y = y;
}

// Desktop
window.addEventListener("mousemove", (e) => {
  setTarget(e.clientX, e.clientY);
});

// Mobile (touch)
window.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  setTarget(t.clientX, t.clientY);
});

window.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  setTarget(t.clientX, t.clientY);
});
// =====================
// DRAW
// =====================
function drawFish(x, y, angle) {
  ctx.fillStyle = fishColor;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(-20, -10);
  ctx.lineTo(-20, 10);
  ctx.closePath();

  ctx.fill();

  ctx.restore();
}

// =====================
// UPDATE
// =====================
function updateFish() {
  let dx = fish.x - mouse.x;
  let dy = fish.y - mouse.y;
  let dist = Math.sqrt(dx * dx + dy * dy);

  // ---------------------
  // STATE (clean separation)
  // ---------------------
  if (dist < CONFIG.panicRadius) fish.state = "panic";
  else if (dist < CONFIG.alertRadius) fish.state = "alert";
  else fish.state = "calm";

  // ---------------------
  // PARAMETERS (derived once)
  // ---------------------
  const state = fish.state;

  const maxSpeed = CONFIG.speed[state];
  const driftStrength = CONFIG.drift[state];
  const damping = CONFIG.damping[state];

  // ---------------------
  // FORCE SYSTEM
  // ---------------------
  if (state !== "calm" && dist > 0) {
    const force = state === "panic" ? CONFIG.force.panic : CONFIG.force.alert;

    fish.vx += (dx / dist) * force;
    fish.vy += (dy / dist) * force;
  }

  // ---------------------
  // DRIFT (life noise)
  // ---------------------
  fish.vx += (Math.random() - 0.5) * driftStrength;
  fish.vy += (Math.random() - 0.5) * driftStrength;

  // ---------------------
  // DAMPING (stability control)
  // ---------------------
  fish.vx *= damping;
  fish.vy *= damping;

  // ---------------------
  // SPEED LIMIT
  // ---------------------
  let speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);

  if (speed > maxSpeed) {
    fish.vx = (fish.vx / speed) * maxSpeed;
    fish.vy = (fish.vy / speed) * maxSpeed;
  }

  // ---------------------
  // WALL AVOIDANCE
  // ---------------------
  const margin = 40;

  if (fish.x < margin) fish.vx += 0.3;
  if (fish.x > canvas.width - margin) fish.vx -= 0.3;
  if (fish.y < margin) fish.vy += 0.3;
  if (fish.y > canvas.height - margin) fish.vy -= 0.3;

  // ---------------------
  // APPLY MOVEMENT
  // ---------------------
  fish.x += fish.vx;
  fish.y += fish.vy;

  // ---------------------
  // ROTATION (smooth steering)
  // ---------------------
  let targetAngle = Math.atan2(fish.vy, fish.vx);

  let diff = targetAngle - fish.angle;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));

  fish.angle += diff * 0.08;

  // ---------------------
  // BOUNDS CLAMP
  // ---------------------
  fish.x = Math.max(0, Math.min(canvas.width, fish.x));
  fish.y = Math.max(0, Math.min(canvas.height, fish.y));
}

// =====================
// LOOP
// =====================
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updateFish();
  drawFish(fish.x, fish.y, fish.angle);

  requestAnimationFrame(animate);
}

window.addEventListener("load", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  animate();
});
