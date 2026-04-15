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
  // random drift (feels like thinking)
  fish.vx += (Math.random() - 0.5) * 0.1;
  fish.vy += (Math.random() - 0.5) * 0.1;

  // speed limit
  let speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
  let maxSpeed = 1;

  if (speed > maxSpeed) {
    fish.vx = (fish.vx / speed) * maxSpeed;
    fish.vy = (fish.vy / speed) * maxSpeed;
  }

  // movement
  fish.x += fish.vx;
  fish.y += fish.vy;
}

// 🎬 loop = life
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updateFish();
  drawFish(fish.x, fish.y);

  requestAnimationFrame(animate);
}

animate();
