const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMessage = document.getElementById("overlay-message");
const startBtn = document.getElementById("start");
const restartBtn = document.getElementById("restart");

const tile = 28;
const rows = 20;
const cols = 20;

const levelTemplate = [
  "####################",
  "#........##........#",
  "#.####.#.##.#.####.#",
  "#o#  #.#.##.#.#  #o#",
  "#.####.######.####.#",
  "#..................#",
  "#.####.##++##.####.#",
  "#......##++##......#",
  "######.##++##.######",
  "     #.      .#     ",
  "######.##--##.######",
  "#......######......#",
  "#.####.######.####.#",
  "#o...#....##....#o.#",
  "###.#.##.##.##.#.###",
  "#...#............#.#",
  "#.#####.####.#####.#",
  "#..................#",
  "#.################.#",
  "####################",
];

const directions = {
  ArrowUp: { x: 0, y: -1 },
  w: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  s: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  a: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  d: { x: 1, y: 0 },
};

let state;
let last = 0;
let running = false;

function initState() {
  const map = levelTemplate.map((r) => r.split(""));
  state = {
    map,
    score: 0,
    lives: 3,
    pellets: countPellets(map),
    pacman: {
      x: 10,
      y: 15,
      dir: { x: 0, y: 0 },
      next: { x: 0, y: 0 },
      mouth: 0,
    },
    ghosts: [
      ghost(9, 10, "#ff4f8b"),
      ghost(10, 10, "#5cf5ff"),
      ghost(9, 11, "#ffd45c"),
      ghost(10, 11, "#8bff77"),
    ],
    powerMode: 0,
  };
  syncHud();
}

function ghost(x, y, color) {
  return { x, y, dir: randomDir(), color };
}

function randomDir() {
  return [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ][Math.floor(Math.random() * 4)];
}

function countPellets(map) {
  return map.flat().filter((c) => c === "." || c === "o").length;
}

function isWall(x, y) {
  if (y < 0 || y >= rows || x < 0 || x >= cols) return true;
  const cell = state.map[y][x];
  return cell === "#" || cell === "+" || cell === "-";
}

function wrap(entity) {
  if (entity.x < 0) entity.x = cols - 1;
  if (entity.x >= cols) entity.x = 0;
}

function movePacman() {
  const p = state.pacman;
  if (!isWall(p.x + p.next.x, p.y + p.next.y)) p.dir = p.next;
  if (!isWall(p.x + p.dir.x, p.y + p.dir.y)) {
    p.x += p.dir.x;
    p.y += p.dir.y;
  }
  wrap(p);

  const cell = state.map[p.y][p.x];
  if (cell === ".") {
    state.map[p.y][p.x] = " ";
    state.score += 10;
    state.pellets--;
  }
  if (cell === "o") {
    state.map[p.y][p.x] = " ";
    state.score += 50;
    state.pellets--;
    state.powerMode = 360;
  }

  p.mouth = (p.mouth + 0.18) % 1;
}

function moveGhost(g) {
  const options = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ].filter((d) => !isWall(g.x + d.x, g.y + d.y));

  const towards = options
    .slice()
    .sort((a, b) => {
      const da = Math.hypot(state.pacman.x - (g.x + a.x), state.pacman.y - (g.y + a.y));
      const db = Math.hypot(state.pacman.x - (g.x + b.x), state.pacman.y - (g.y + b.y));
      return state.powerMode > 0 ? db - da : da - db;
    })[0];

  g.dir = Math.random() < 0.75 ? towards : options[Math.floor(Math.random() * options.length)] || g.dir;
  if (!isWall(g.x + g.dir.x, g.y + g.dir.y)) {
    g.x += g.dir.x;
    g.y += g.dir.y;
  }
  wrap(g);
}

function collide() {
  const p = state.pacman;
  for (const g of state.ghosts) {
    if (g.x === p.x && g.y === p.y) {
      if (state.powerMode > 0) {
        state.score += 200;
        g.x = 10;
        g.y = 10;
      } else {
        state.lives--;
        if (state.lives <= 0) {
          gameOver(false);
          return;
        }
        state.pacman.x = 10;
        state.pacman.y = 15;
        state.pacman.dir = { x: 0, y: 0 };
      }
    }
  }
}

function update() {
  movePacman();
  state.ghosts.forEach(moveGhost);
  collide();

  if (state.powerMode > 0) state.powerMode--;
  if (state.pellets <= 0) gameOver(true);

  syncHud();
}

function syncHud() {
  scoreEl.textContent = state.score;
  livesEl.textContent = state.lives;
  const best = Number(localStorage.getItem("neo-pacman-best") || 0);
  if (state.score > best) localStorage.setItem("neo-pacman-best", state.score);
  bestEl.textContent = localStorage.getItem("neo-pacman-best") || 0;
}

function drawBoard() {
  ctx.fillStyle = "#060816";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = state.map[y][x];
      const px = x * tile;
      const py = y * tile;
      if (cell === "#") {
        const grad = ctx.createLinearGradient(px, py, px + tile, py + tile);
        grad.addColorStop(0, "#2333ff");
        grad.addColorStop(1, "#5c9bff");
        ctx.fillStyle = grad;
        ctx.fillRect(px + 3, py + 3, tile - 6, tile - 6);
      } else if (cell === "." || cell === "o") {
        ctx.fillStyle = cell === "o" ? "#fff2a1" : "#e7efff";
        ctx.beginPath();
        ctx.arc(px + tile / 2, py + tile / 2, cell === "o" ? 5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawPacman() {
  const p = state.pacman;
  const centerX = p.x * tile + tile / 2;
  const centerY = p.y * tile + tile / 2;
  const angle = Math.abs(Math.sin(p.mouth * Math.PI)) * 0.7;
  const dirAngle = Math.atan2(p.dir.y, p.dir.x) || 0;

  ctx.fillStyle = "#ffe15c";
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, tile / 2 - 3, dirAngle + angle, dirAngle - angle + Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

function drawGhost(g) {
  const x = g.x * tile;
  const y = g.y * tile;
  const scared = state.powerMode > 0;

  ctx.fillStyle = scared ? "#5c72ff" : g.color;
  ctx.beginPath();
  ctx.arc(x + tile / 2, y + tile / 2, tile / 2 - 4, Math.PI, 0);
  ctx.lineTo(x + tile - 4, y + tile - 4);
  ctx.lineTo(x + tile - 9, y + tile - 8);
  ctx.lineTo(x + tile - 14, y + tile - 4);
  ctx.lineTo(x + tile - 19, y + tile - 8);
  ctx.lineTo(x + 4, y + tile - 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(x + 10, y + 12, 3, 0, Math.PI * 2);
  ctx.arc(x + 18, y + 12, 3, 0, Math.PI * 2);
  ctx.fill();
}

function render() {
  drawBoard();
  drawPacman();
  state.ghosts.forEach(drawGhost);
}

function loop(ts) {
  if (!running) return;
  if (ts - last > 95) {
    update();
    render();
    last = ts;
  }
  requestAnimationFrame(loop);
}

function showOverlay(title, message) {
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  overlay.classList.remove("hidden");
}

function startGame() {
  overlay.classList.add("hidden");
  initState();
  render();
  running = true;
  requestAnimationFrame(loop);
}

function gameOver(win) {
  running = false;
  showOverlay(win ? "Wygrałeś!" : "Koniec gry", win ? "Czyścisz planszę jak mistrz!" : "Spróbuj jeszcze raz.");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !running) {
    startGame();
    return;
  }
  const d = directions[e.key];
  if (!d || !state) return;
  state.pacman.next = d;
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

showOverlay("Neo Pac-Man", "Naciśnij Enter lub Start, aby zacząć.");
initState();
render();
