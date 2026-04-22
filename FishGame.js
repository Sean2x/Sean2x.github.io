const styles = getComputedStyle(document.documentElement);

const fishColor = styles.getPropertyValue("--Fish");
const sharkColor = styles.getPropertyValue("--Shark");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const FIXED_DT = 1 / 240;

// =====================
// ASSETS
// =====================

const assets = {
  body: new Image(),
  tail: new Image(),
  fins: new Image(),
  bubble: new Image(),

  eyes: {
    calm: new Image(),
    panic: new Image(),
    squeeze: new Image(),
    happy: new Image(),
  },

  mouth: {
    open: new Image(),
    closed: new Image(),
  },
};

assets.body.src = "Images/BibblesAsset/GoldfishAssets_Body.png";
assets.tail.src = "Images/BibblesAsset/GoldfishAssets_Tail.png";
assets.fins.src = "Images/BibblesAsset/GoldfishAssets_Fins.png";

assets.eyes.calm.src = "Images/BibblesAsset/GoldfishAssets_EyesCalm.png";
assets.eyes.panic.src = "Images/BibblesAsset/GoldfishAssets_EyesPanic.png";
assets.eyes.squeeze.src = "Images/BibblesAsset/GoldfishAssets_EyesSqueeze.png";
assets.eyes.happy.src = "Images/BibblesAsset/GoldfishAssets_EyesHappy.png";

assets.bubble.src = "Images/BibblesAsset/GoldfishAssets_BubbleEye.png";

assets.mouth.open.src = "Images/BibblesAsset/GoldfishAssets_Mouth1.png";
assets.mouth.closed.src = "Images/BibblesAsset/GoldfishAssets_Mouth2.png";

// =====================
// CONFIG (ALL TUNING HERE)
// =====================
const CONFIG = {
  panicRadius: 40,
  alertRadius: 250,

  speed: {
    calm: 0.5,
    alert: 1.5,
    panic: 2.5,
  },

  force: {
    alert: 0.01,
    panic: 0.1,
  },

  drift: {
    calm: 0.04,
    alert: 0.02,
    panic: 0.01,
  },

  damping: {
    calm: 0.998,
    alert: 1,
    panic: 1,
  },

  swarm: {
    radius: 200,
    separationWeight: 0.15,
    alignmentWeight: 0.01,
    cohesionWeight: 1.5,
  },
};

// =====================
// ENTITY
// =====================

function createFish(x, y, name) {
  return {
    name,

    x,
    y,
    vx: 0,
    vy: 0,
    angle: 0,
    state: "calm",

    wanderTarget: null,
    nextWanderTime: 0,

    tailPhase: 0,
    finPhase: 0,
    blinkTimer: 0,
    mouthTimer: 0,
    mouthOpen: false,
    blinking: false,

    dx: 0,
    dy: 0,
    dist: 0,
  };
}

function setTarget(x, y) {
  mouse.x = x;
  mouse.y = y;
  
}

let mouse = {
  x: canvas.width,
  y: canvas.height,
  active: false,
};
// =====================
// Listeners
// =====================
// 🖱️ Desktop
window.addEventListener("mousemove", (e) => {
  setTarget(e.clientX, e.clientY);
});

// 👆 Mobile start
window.addEventListener(
  "touchstart",
  (e) => {
    const t = e.touches[0];
    setTarget(t.clientX, t.clientY);
  },
  { passive: false },
);

// 👆 Mobile move
window.addEventListener(
  "touchmove",
  (e) => {
    const t = e.touches[0];
    setTarget(t.clientX, t.clientY);
    active: true;
    e.preventDefault(); // 🔥 critical
  },
  { passive: false },
);

window.addEventListener("touchend", () => {
  mouse.active = false;
});
// =====================
// DRAW
// =====================
function drawFish(fish) {
  ctx.save();
  ctx.translate(fish.x, fish.y);
  ctx.rotate(fish.angle - Math.PI / 2);

  const bodyWidth = 50;
  const bodyHeight = bodyWidth * 1.25;

  const bodyScale = 0.7;

  const bw = bodyWidth * bodyScale;
  const bh = bodyHeight;

  // =====================
  // 🐟 TAIL
  // =====================
  ctx.save();

  const tailAnchorX = 0;
  const tailAnchorY = -bodyWidth * 0.6;

  const tailW = bodyWidth * 1;
  const tailH = bodyHeight * 0.4;

  const tailSwing = Math.sin(fish.tailPhase) * 0.2;

  ctx.translate(tailAnchorX, tailAnchorY);
  ctx.rotate(tailSwing);

  ctx.drawImage(assets.tail, -tailW / 2, -tailH / 2, tailW, tailH);

  ctx.restore();

  // =====================
  // 🐟 FINS (mid layer)
  // =====================
  ctx.save();

  const finX = bw * 0;
  const finY = bh * 0.1;
  const finSizeX = bw * 1.5;
  const finSizeY = bh * 0.175;

  ctx.translate(finX, finY);

  ctx.drawImage(assets.fins, -finSizeX / 2, -finSizeY / 2, finSizeX, finSizeY);

  ctx.restore();

  // =====================
  // Eye Bubbles
  // =====================

  ctx.save();

  const BubbleX = bw * 0;
  const BubbleY = bh * 0.37;
  const BubbleSizeX = bw * 1.5;
  const BubbleSizeY = bh * 0.35;

  ctx.translate(BubbleX, BubbleY);

  ctx.drawImage(
    assets.bubble,
    -BubbleSizeX / 2,
    -BubbleSizeY / 2,
    BubbleSizeX,
    BubbleSizeY,
  );

  ctx.restore();

  // =====================
  // 🐟 BODY
  // =====================
  ctx.save();

  ctx.drawImage(assets.body, -bw / 2, -bh / 2, bw, bh);

  ctx.restore();

  // =====================
  // Eyes
  // =====================

  ctx.save();

  const EyeImg = fish.blinking
    ? assets.eyes.squeeze
    : fish.state === "alert" || fish.state === "panic"
      ? assets.eyes.panic
      : assets.eyes.calm;

  const EyeX = bw * 0;
  const EyeY = bh * 0.35;
  const EyeSizeX = bw * 1.2;
  const EyeSizeY = bh * 0.25;

  ctx.translate(EyeX, EyeY);

  ctx.drawImage(EyeImg, -EyeSizeX / 2, -EyeSizeY / 2, EyeSizeX, EyeSizeY);

  ctx.restore();

  // =====================
  // 🐟 Mouth
  // =====================

  ctx.save();

  const mouthImg = fish.mouthOpen ? assets.mouth.open : assets.mouth.closed;

  const mouthY = bh * 0.5;
  const mouthW = bw * 0.5;
  const mouthH = mouthW * 0.55;

  ctx.translate(0, mouthY);

  ctx.drawImage(mouthImg, -mouthW / 2, -mouthH / 2, mouthW, mouthH);

  ctx.restore();
  ctx.restore();

  drawNametag(fish);
}

function drawNametag(fish) {
  ctx.save();
  const name = fish.name;

  const boxWidth = 70;
  const boxHeight = 18;
  const offsetY = 40;

  // NO translate/rotate based on fish angle
  ctx.translate(fish.x, fish.y);

  // optional floating animation
  const bob = Math.sin(performance.now() * 0.003) * 1.5;

  const bx = -boxWidth / 2;
  const by = offsetY + bob;

  // background
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillRect(bx, by, boxWidth, boxHeight);

  // text
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, 0, by + boxHeight / 2);

  ctx.restore();
}

// =====================
// UPDATE
// =====================
function updateFish(fish, dt) {
  senseMouse(fish, dt);
  applyBrain(fish, dt);
  applySwarm(fish, fishes, dt);
  applyPhysics(fish, dt);
  applyConstraints(fish);
  AnimateFish(fish);
}

// =====================
// Fish Logic
// =====================

function senseMouse(fish, dt) {
  let dx = fish.x - mouse.x;
  let dy = fish.y - mouse.y;
  let dist = Math.sqrt(dx * dx + dy * dy);

  fish.dx = dx;
  fish.dy = dy;
  fish.dist = dist;

  if (dist < CONFIG.panicRadius) fish.state = "panic";
  else if (dist < CONFIG.alertRadius) fish.state = "alert";
  else fish.state = "calm";
}
function applyBrain(fish, dt) {
  const state = fish.state;

  if (!mouse.active) {
    fish.state = "calm";
    return;
  }

  const force =
    state === "panic"
      ? CONFIG.force.panic
      : state === "alert"
        ? CONFIG.force.alert
        : 0;

  // =========================
  // REACTION (existing)
  // =========================
  if (force > 0 && fish.dist > 0) {
    fish.vx += (fish.dx / fish.dist) * dt * 240;
    fish.vy += (fish.dy / fish.dist) * dt * 240;
  }

  if (state === "calm") {
    fish.vx += (Math.random() - 0.5) * 0.02 * dt * 240;
    fish.vy += (Math.random() - 0.5) * 0.02 * dt * 240;
  }

  
}

function applySwarm(fish, fishes, dt) {
  let separation = { x: 0, y: 0 };
  let alignment = { x: 0, y: 0 };
  let cohesion = { x: 0, y: 0 };

  let swarmFactor =
    fish.state === "panic" ? 0.1 : fish.state === "alert" ? 0.5 : 1;

  let count = 0;

  for (let other of fishes) {
    if (other === fish) continue;

    let dx = fish.x - other.x;
    let dy = fish.y - other.y;
    let dist = Math.hypot(dx, dy);

    if (dist < CONFIG.swarm.radius && dist > 0) {
      // separation (push away)
      separation.x += dx / dist;
      separation.y += dy / dist;

      // alignment (match velocity)
      alignment.x += other.vx;
      alignment.y += other.vy;

      // cohesion (move toward center)
      cohesion.x += other.x;
      cohesion.y += other.y;

      count++;
    }
  }

  if (count > 0) {
    // average
    separation.x /= count;
    separation.y /= count;

    alignment.x /= count;
    alignment.y /= count;

    cohesion.x /= count;
    cohesion.y /= count;

    // cohesion target direction
    cohesion.x = cohesion.x - fish.x;
    cohesion.y = cohesion.y - fish.y;

    if (fish.state === "panic" || fish.state === "alert") return;

    // apply forces
    fish.vx +=
      separation.x * CONFIG.swarm.separationWeight * swarmFactor * dt * 240;
    fish.vy +=
      separation.y * CONFIG.swarm.separationWeight * swarmFactor * dt * 240;

    fish.vx +=
      alignment.x * CONFIG.swarm.alignmentWeight * swarmFactor * dt * 240;
    fish.vy +=
      alignment.y * CONFIG.swarm.alignmentWeight * swarmFactor * dt * 240;

    fish.vx +=
      cohesion.x * 0.001 * CONFIG.swarm.cohesionWeight * swarmFactor * dt * 240;
    fish.vy +=
      cohesion.y * 0.001 * CONFIG.swarm.cohesionWeight * swarmFactor * dt * 240;
  }
}

function applyPhysics(fish, dt) {
  const state = fish.state;

  fish.vx *= CONFIG.damping[state];
  fish.vy *= CONFIG.damping[state];

  let speed = Math.hypot(fish.vx, fish.vy);

  if (speed > CONFIG.speed[state]) {
    fish.vx = (fish.vx / speed) * CONFIG.speed[state];
    fish.vy = (fish.vy / speed) * CONFIG.speed[state];
  }

  fish.x += fish.vx * dt * 240;
  fish.y += fish.vy * dt * 240;

  // rotation
  let targetAngle = Math.atan2(fish.vy, fish.vx);
  let diff = Math.atan2(
    Math.sin(targetAngle - fish.angle),
    Math.cos(targetAngle - fish.angle),
  );

  fish.angle += diff * 0.08 * dt * 240;
}
function applyConstraints(fish) {
  //Wall margin
  const margin = 40;

  //Walls
  if (fish.x < margin) fish.vx += 0.3;
  if (fish.x > canvas.width - margin) fish.vx -= 0.3;
  if (fish.y < margin) fish.vy += 0.3;
  if (fish.y > canvas.height - margin) fish.vy -= 0.3;

  // Tp back inside
  fish.x = Math.max(0, Math.min(canvas.width, fish.x));
  fish.y = Math.max(0, Math.min(canvas.height, fish.y));
}
function AnimateFish(fish) {
  fish.tailPhase += Math.hypot(fish.vx, fish.vy) * 0.1;
  fish.finPhase += 0.08;

  // 👁️ blink logic
  fish.blinkTimer--;

  if (fish.blinkTimer <= 0) {
    fish.blinking = true;
    fish.blinkTimer = 120 + Math.random() * 200; // random blink delay
  }

  if (fish.blinking) {
    if (Math.random() < 0.1) fish.blinking = false;
  }

  // 👄 mouth random movement
  fish.mouthTimer--;

  if (fish.mouthTimer <= 0) {
    fish.mouthOpen = !fish.mouthOpen;
    fish.mouthTimer = 200 + Math.random() * 120;
  }
}

// =====================
// LOOP
// =====================
let lastTime = performance.now();

function animate() {
  const start = performance.now();

  const now = performance.now();

  // ✅ delta time in seconds
  const dt = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let fish of fishes) {
    updateFish(fish, dt); // ✅ pass dt in
    drawFish(fish);
  }

  frameCount++;

  // FPS update
  if (now - lastFpsUpdate >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFpsUpdate = now;
  }

  // CPU per frame
  const cpu = performance.now() - start;

  // versionEl.textContent = `v1.9 | FPS:${fps} | Fish:${fishes.length} | CPU:${cpu.toFixed(1)}ms | dt:${(dt * 1000).toFixed(1)}ms`;

  requestAnimationFrame(animate);
}

let versionEl;

window.addEventListener("load", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  versionEl = document.getElementById("version");
  animate();
});

let fishes = [];

const fishNames = ["Fred", "Dora", "Demetrius", "Memo", "Oscar"];

for (let i = 0; i < fishNames.length; i++) {
  fishes.push(
    createFish(
      canvas.width / 2 + Math.random() * 200 - 100,
      canvas.height / 2 + Math.random() * 200 - 100,
      fishNames[i],
    ),
  );
}

let fps = 0;
let frameCount = 0;
let lastFpsUpdate = performance.now();
