const styles = getComputedStyle(document.documentElement);

const fishColor = styles.getPropertyValue("--Fish");
const sharkColor = styles.getPropertyValue("--Shark");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let fish = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  vx: 0,
  vy: 0,
};

let mouse = {
  x: canvas.width / 2,
  y: canvas.height / 2,
};

window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

function drawFish(x, y) {
  ctx.fillStyle = fishColor; // tomato color for the fish

  ctx.beginPath();
  ctx.moveTo(x + 20, y); // front tip
  ctx.lineTo(x - 20, y - 10); // top back
  ctx.lineTo(x - 20, y + 10); // bottom back
  ctx.closePath();

  ctx.fill();
}

function drawShark(x, y) {
  ctx.fillStyle = sharkColor; // tomato color for the fish

  ctx.beginPath();
  ctx.moveTo(x + 40, y); // front tip
  ctx.lineTo(x - 40, y - 30); // top back
  ctx.lineTo(x - 40, y + 30); // bottom back
  ctx.closePath();

  ctx.fill();
}

function updateFish() {
  let dx = fish.x - mouse.x;
  let dy = fish.y - mouse.y;

  let dist = Math.sqrt(dx * dx + dy * dy);

  // fear radius
  let fearRadius = 250;

  if (dist < fearRadius && dist > 0) {
    // normalize direction away from mouse
    fish.vx += (dx / dist) * 0.8;
    fish.vy += (dy / dist) * 0.8;
  }

  // tiny random drift (keeps it alive)
  fish.vx += (Math.random() - 0.5) * 0.2;
  fish.vy += (Math.random() - 0.5) * 0.2;

  // speed limit
  let speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
  let maxSpeed = 1.5;

  if (speed > maxSpeed) {
    fish.vx = (fish.vx / speed) * maxSpeed;
    fish.vy = (fish.vy / speed) * maxSpeed;
  }

  let margin = 40; // how far it "feels" walls
  // left wall
  if (fish.x < margin) {
    fish.vx += 0.3;
  }
  // right wall
  if (fish.x > canvas.width - margin) {
    fish.vx -= 0.3;
  }
  // top wall
  if (fish.y < margin) {
    fish.vy += 0.3;
  }
  // bottom wall
  if (fish.y > canvas.height - margin) {
    fish.vy -= 0.3;
  }

  // movement application
  fish.x += fish.vx;
  fish.y += fish.vy;

  //boundaries
  if (fish.x < 0) fish.x = 0;
  if (fish.x > canvas.width) fish.x = canvas.width;

  if (fish.y < 0) fish.y = 0;
  if (fish.y > canvas.height) fish.y = canvas.height;
}

// 🎬 loop = life
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updateFish();
  drawFish(fish.x, fish.y);

  requestAnimationFrame(animate);
}

window.addEventListener("load", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  animate();
});
