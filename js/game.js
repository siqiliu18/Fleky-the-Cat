// Fleky's Snow Day
//
// One meadow, three big buttons:
//   Chase Yarn — she runs to the ball. Catching it adds 1 to the counter.
//   Jump       — she leaps through the rainbow hoop.
//   Roll Over  — she tumbles, then pops up on her back.
//
// Nothing to lose. Every button does its trick right away.

import { unlock, setMuted, isMuted, play } from "./audio.js";
import { CAT, collarPosition, drawWorld, geometry } from "./draw.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const scoreBox = document.getElementById("scorebox");
const soundBtn = document.getElementById("btn-sound");

const view = { w: 800, h: 600, ground: 460, prevW: 0 };
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const images = {};
const state = {
  time: 0,
  cat: {
    x: 200,
    lift: 0,
    facing: 1,
    rot: 0,
    action: "idle",
    actionT: 0,
    frame: "idle",
    bob: 0,
    scale: 1,
    jump: null,
    roll: null,
  },
  yarn: { x: 420, pop: 1 },
  score: 0,
  particles: [],
  cheers: [],
  prints: [],
  flakes: [],
  hoopGlow: 0,
  placed: false,
};

const SPIN = 0.85;
const BELLY = 0.5;

function makeSnow() {
  const count = reduceMotion ? 18 : 46;
  state.flakes = [];
  for (let i = 0; i < count; i++) {
    state.flakes.push({
      x: Math.random() * view.w,
      y: Math.random() * view.h,
      r: 1.2 + Math.random() * 3.2,
      speed: 16 + Math.random() * 36,
      drift: Math.random() * Math.PI * 2,
      a: 0.45 + Math.random() * 0.5,
      kind: Math.random() < 0.35 ? "flake" : "dot",
      front: Math.random() < 0.28,
      spin: Math.random() * 6,
    });
  }
}

function loadImages() {
  const files = {
    idle: "assets/fleky-idle.png",
    runA: "assets/fleky-run-a.png",
    runB: "assets/fleky-run-b.png",
    jump: "assets/fleky-jump.png",
    roll: "assets/fleky-roll.png",
  };
  return Promise.all(
    Object.keys(files).map(
      (key) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = files[key];
          images[key] = img;
        }),
    ),
  );
}

function measure() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  const dock = document.querySelector(".dock").getBoundingClientRect();
  view.w = w;
  view.h = h;
  view.ground = Math.max(140, dock.top - 4);
  if (!state.flakes.length) makeSnow();
  if (!state.placed) {
    placeFirstYarn();
    state.placed = true;
  } else if (view.prevW && Math.abs(view.prevW - w) > 1) {
    const scale = w / view.prevW;
    state.cat.x *= scale;
    state.yarn.x *= scale;
  }
  view.prevW = w;
  keepInside();
}

function placeFirstYarn() {
  const g = geometry(view);
  state.cat.x = view.w * 0.22;
  state.cat.facing = 1;
  // Far enough that the first chase is a real run, still clear of the hoop.
  state.yarn.x = Math.max(state.cat.x + g.catH, g.hoopX - g.hoopR - g.yarnR - 30);
  state.yarn.pop = 1;
}

// A new ball, not right under her nose, and not inside the hoop.
function placeYarn(avoidX) {
  const g = geometry(view);
  const minX = 80;
  const maxX = Math.max(minX + 30, g.hoopX - g.hoopR - g.yarnR - 28);
  let x = (minX + maxX) / 2;
  for (let i = 0; i < 10; i++) {
    const tryX = minX + Math.random() * (maxX - minX);
    x = tryX;
    if (Math.abs(tryX - avoidX) > Math.min(280, (maxX - minX) * 0.4)) break;
  }
  state.yarn.x = x;
  state.yarn.pop = 0;
}

function keepInside() {
  const g = geometry(view);
  state.cat.x = clamp(state.cat.x, 60, view.w - 60);
  const maxYarn = Math.max(90, g.hoopX - g.hoopR - g.yarnR - 20);
  state.yarn.x = clamp(state.yarn.x, 70, maxYarn);
}

function reachX() {
  const g = geometry(view);
  return state.cat.x + state.cat.facing * g.catH * 0.28;
}

function setScore(n) {
  state.score = n;
  scoreEl.textContent = String(n);
  scoreBox.setAttribute("aria-label", n === 1 ? "1 yarn" : n + " yarns");
  scoreEl.classList.remove("pop");
  // Restart the pop animation.
  void scoreEl.offsetWidth;
  scoreEl.classList.add("pop");
}

function cheer(text, x, y, color) {
  state.cheers.push({
    text,
    x,
    y,
    vy: -36,
    life: 1.15,
    size: Math.max(28, geometry(view).catH * 0.16),
    color,
  });
}

function burst(x, y) {
  const colors = ["#fff7b0", "#ff9ec8", "#9ad8ff", "#ffffff", "#d7c4ff"];
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = 70 + Math.random() * 160;
    state.particles.push({
      kind: "star",
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 30,
      life: 0.65 + Math.random() * 0.35,
      rot: Math.random() * 6,
      color: colors[i % colors.length],
      size: 6 + Math.random() * 8,
    });
  }
}

function puff(x, y) {
  state.particles.push({
    kind: "puff",
    x,
    y,
    vx: (Math.random() - 0.5) * 40,
    vy: -20 - Math.random() * 30,
    life: 0.45,
    size: 10 + Math.random() * 8,
  });
}

function startAction(name) {
  document.body.classList.add("played");
  unlock();
  if (name === "chase") startChase();
  else if (name === "jump") startJump();
  else if (name === "roll") startRoll();
}

function startChase() {
  const dist = Math.abs(state.yarn.x - reachX());
  state.cat.action = "chase";
  state.cat.actionT = 0;
  state.cat.rot = 0;
  state.cat.jump = null;
  state.cat.roll = null;
  if (dist > 70) play("pounce");
}

function startJump() {
  const g = geometry(view);
  const fromX = state.cat.x;
  // A short leap that starts just left of the ring and ends just right of it,
  // so the highest point is the middle of the hoop.
  const takeoffX = g.hoopX - g.hoopR * 0.9;
  const landX = Math.min(view.w - 70, g.hoopX + g.hoopR * 0.7);
  const speed = Math.max(240, view.w * 0.42);
  const runDur = Math.abs(takeoffX - fromX) < 12 ? 0 : Math.abs(takeoffX - fromX) / speed;
  const airDur = 0.95;
  const span = Math.max(40, landX - takeoffX);
  const uHoop = clamp((g.hoopX - takeoffX) / span, 0.2, 0.8);
  const drop = (CAT.idle.foot - CAT.idle.ay) * g.catH;
  const collarRest = g.ground - drop;
  const needed = Math.max(48, collarRest - g.hoopY);
  state.cat.action = "jump";
  state.cat.actionT = 0;
  state.cat.roll = null;
  state.cat.jump = { fromX, takeoffX, landX, runDur, airDur, uHoop, needed, celebrated: false };
  play("jump");
}

function startRoll() {
  const g = geometry(view);
  if (state.cat.x < 130) state.cat.facing = 1;
  else if (state.cat.x > g.hoopX - g.hoopR - 40) state.cat.facing = -1;
  state.cat.action = "roll";
  state.cat.actionT = 0;
  state.cat.jump = null;
  state.cat.roll = { fromX: state.cat.x, dir: state.cat.facing };
  play("roll");
}

function update(dt) {
  state.time += dt;
  state.hoopGlow = Math.max(0, state.hoopGlow - dt * 1.4);
  state.yarn.pop = Math.min(1, state.yarn.pop + dt * 3);

  if (state.cat.action === "chase") updateChase(dt);
  else if (state.cat.action === "jump") updateJump(dt);
  else if (state.cat.action === "roll") updateRoll(dt);
  else updateIdle();

  // Jump and roll set their own height. Everything else settles to the snow.
  if (state.cat.action !== "jump" && state.cat.action !== "roll") {
    state.cat.lift += (0 - state.cat.lift) * Math.min(1, dt * 8);
  }

  state.flakes.forEach((flake) => {
    flake.y += flake.speed * dt;
    flake.x += Math.sin(state.time + flake.drift) * 12 * dt;
    if (flake.y > view.h + 8) {
      flake.y = -8;
      flake.x = Math.random() * view.w;
    }
    if (flake.x < -10) flake.x = view.w + 10;
    if (flake.x > view.w + 10) flake.x = -10;
  });

  state.particles.forEach((p) => {
    p.vy += (p.kind === "puff" ? 40 : 90) * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    p.rot = (p.rot || 0) + dt * 3;
  });
  state.particles = state.particles.filter((p) => p.life > 0);

  state.cheers.forEach((c) => {
    c.y += c.vy * dt;
    c.life -= dt;
  });
  state.cheers = state.cheers.filter((c) => c.life > 0);

  state.prints.forEach((p) => {
    p.life -= dt * 0.35;
  });
  state.prints = state.prints.filter((p) => p.life > 0);

  keepInside();
}

function updateIdle() {
  state.cat.frame = "idle";
  state.cat.rot = Math.sin(state.time * 1.6) * 0.03;
  state.cat.bob = Math.sin(state.time * 2.3) * (reduceMotion ? 1 : 4);
  state.cat.scale = 1;
}

function updateChase(dt) {
  state.cat.actionT += dt;
  const g = geometry(view);
  const target = state.yarn.x;
  const dir = Math.sign(target - state.cat.x) || state.cat.facing;
  state.cat.facing = dir;
  const speed = Math.max(220, view.w * 0.34);
  const prev = state.cat.x;
  state.cat.x += dir * speed * dt;
  // Don't run past the ball.
  if ((dir > 0 && state.cat.x > target) || (dir < 0 && state.cat.x < target)) {
    state.cat.x = target;
  }
  state.cat.frame = Math.floor(state.time * 7) % 2 === 0 ? "runA" : "runB";
  state.cat.bob = Math.sin(state.time * 14) * 5;
  state.cat.rot = 0;
  state.cat.scale = 1;

  if (Math.abs(state.cat.x - prev) > 26 && state.prints.length < 16) {
    state.prints.push({
      x: state.cat.x - dir * 20,
      y: g.ground - 6,
      rot: dir > 0 ? -0.4 : 0.4,
      life: 1,
    });
  }

  const caught = Math.abs(reachX() - state.yarn.x) < g.yarnR + g.catH * 0.08;
  if (caught || state.cat.actionT > 4) {
    collectYarn();
  }
}

function collectYarn() {
  const g = geometry(view);
  const x = state.yarn.x;
  const y = g.ground - g.yarnR;
  setScore(state.score + 1);
  burst(x, y);
  cheer("+1", x, y - 20, "#7d68c4");
  play("yarn");
  placeYarn(state.cat.x);
  state.cat.action = "idle";
  state.cat.frame = "idle";
  state.cat.bob = 0;
}

function updateJump(dt) {
  const jump = state.cat.jump;
  if (!jump) return;
  state.cat.actionT += dt;
  const t = state.cat.actionT;
  if (t < jump.runDur) {
    const u = jump.runDur === 0 ? 1 : t / jump.runDur;
    state.cat.x = jump.fromX + (jump.takeoffX - jump.fromX) * u;
    state.cat.facing = Math.sign(jump.takeoffX - jump.fromX) || 1;
    state.cat.lift = 0;
    state.cat.rot = 0;
    state.cat.frame = Math.floor(state.time * 7) % 2 === 0 ? "runA" : "runB";
    state.cat.bob = Math.sin(state.time * 14) * 4;
    return;
  }
  const u = Math.min(1, (t - jump.runDur) / jump.airDur);
  state.cat.x = jump.takeoffX + (jump.landX - jump.takeoffX) * u;
  state.cat.lift = jumpHeight(u, jump.uHoop, jump.needed);
  state.cat.facing = 1;
  state.cat.rot = -Math.sin(Math.PI * u) * 0.28;
  state.cat.frame = "jump";
  state.cat.bob = 0;
  if (!jump.celebrated && u >= jump.uHoop) {
    jump.celebrated = true;
    const g = geometry(view);
    state.hoopGlow = 0.85;
    burst(g.hoopX, g.hoopY);
    cheer("Whee!", g.hoopX, g.hoopY - g.hoopR - 18, "#3eb4ff");
    play("hoop");
  }
  if (u >= 1) {
    state.cat.action = "idle";
    state.cat.lift = 0;
    state.cat.rot = 0;
    state.cat.frame = "idle";
    play("land");
  }
}

function updateRoll(dt) {
  const roll = state.cat.roll;
  if (!roll) return;
  state.cat.actionT += dt;
  const t = state.cat.actionT;
  if (t < SPIN) {
    const u = t / SPIN;
    const eased = 0.5 - 0.5 * Math.cos(Math.PI * u);
    state.cat.rot = roll.dir * eased * Math.PI * 2;
    state.cat.x = roll.fromX + roll.dir * 110 * eased;
    state.cat.facing = roll.dir;
    state.cat.frame = "idle";
    state.cat.bob = 0;
    // Tuck in and hop a little so the tumble stays above the buttons.
    state.cat.scale = 0.78;
    state.cat.lift = Math.sin(u * Math.PI) * 36;
    if (Math.floor(t * 12) !== Math.floor((t - dt) * 12)) {
      puff(state.cat.x, view.ground - 8);
    }
    return;
  }
  if (t < SPIN + BELLY) {
    const u = (t - SPIN) / BELLY;
    state.cat.rot = 0;
    state.cat.frame = "roll";
    state.cat.x = roll.fromX + roll.dir * 110;
    state.cat.bob = Math.sin(u * Math.PI) * -8;
    state.cat.scale = 1;
    return;
  }
  state.cat.action = "idle";
  state.cat.rot = 0;
  state.cat.frame = "idle";
  state.cat.bob = 0;
  state.cat.scale = 1;
  const collar = collarPosition(state, geometry(view));
  cheer("Yay!", collar.x, collar.y - 70, "#ff78b3");
  play("meow");
}

// Peaks at `center` (the hoop) instead of halfway along the leap.
function jumpHeight(u, center, needed) {
  const safe = clamp(center, 0.15, 0.85);
  const t = u <= safe ? (u / safe) * 0.5 : 0.5 + ((u - safe) / (1 - safe)) * 0.5;
  return needed * Math.sin(Math.PI * clamp(t, 0, 1));
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function draw() {
  const dpr = canvas.width / view.w;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawWorld(ctx, view, state, images);
}

let last = 0;
function loop(now) {
  if (!last) last = now;
  const dt = Math.min(0.034, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function press(button) {
  button.classList.add("is-down");
  startAction(button.dataset.action);
}

document.querySelectorAll(".action").forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    press(button);
  });
});

window.addEventListener("pointerup", () => {
  document.querySelectorAll(".action").forEach((button) => button.classList.remove("is-down"));
});

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  const keys = { KeyR: "roll", KeyJ: "jump", KeyC: "chase", Digit1: "roll", Digit2: "jump", Digit3: "chase" };
  const name = keys[event.code];
  if (!name) return;
  event.preventDefault();
  const button = document.querySelector('[data-action="' + name + '"]');
  if (button) press(button);
  window.setTimeout(() => button && button.classList.remove("is-down"), 140);
});

soundBtn.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  unlock();
  setMuted(!isMuted());
  const off = isMuted();
  soundBtn.classList.toggle("is-muted", off);
  soundBtn.setAttribute("aria-pressed", off ? "true" : "false");
  soundBtn.setAttribute("aria-label", off ? "Sound off" : "Sound on");
});

document.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });
document.addEventListener("gesturestart", (event) => event.preventDefault());

window.addEventListener("resize", measure);
if (window.visualViewport) window.visualViewport.addEventListener("resize", measure);

measure();
loadImages().then(() => {
  window.flekyReady = true;
});
requestAnimationFrame(loop);

// Lets a parent (or a test) peek at the score without reading the canvas.
window.fleky = {
  get score() {
    return state.score;
  },
  get action() {
    return state.cat.action;
  },
  get lift() {
    return state.cat.lift;
  },
};
