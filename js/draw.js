// Drawing for the snowy meadow. Fleky herself is the painted kitten
// (white fur, purple-gray spots, pink ears, purple collar). The gold
// "FLEKY" tag is drawn on top so the letters stay readable when she
// turns around.

// Collar point and lowest paw, measured on each bitmap.
export const CAT = {
  idle: { ax: 0.673, ay: 0.6035, foot: 0.9909, w: 772, h: 659 },
  runA: { ax: 0.666, ay: 0.5687, foot: 0.994, w: 397, h: 333 },
  runB: { ax: 0.6799, ay: 0.5869, foot: 0.991, w: 391, h: 333 },
  jump: { ax: 0.646, ay: 0.5355, foot: 0.9819, w: 397, h: 331 },
  roll: { ax: 0.6824, ay: 0.6738, foot: 0.9929, w: 389, h: 281 },
};

const RAINBOW = ["#ff5d7a", "#ff8c42", "#ffd447", "#7ad86a", "#3ec8ff", "#7c7bff", "#e16bff"];

// Where the hoop, yarn, and cat sit for this screen size.
export function geometry(view) {
  const ground = view.ground;
  // Big enough to hug, small enough to fit through the hoop.
  const catH = Math.max(120, Math.min(view.w * 0.26, ground - Math.min(150, view.h * 0.2)));
  const hoopR = Math.min(catH * 0.86, view.w * 0.17);
  const margin = Math.max(28, view.w * 0.03);
  const hoopX = view.w - margin - hoopR;
  const hoopY = ground - hoopR * 0.92;
  const yarnR = Math.max(26, catH * 0.155);
  return { ground, catH, hoopR, hoopX, hoopY, yarnR, w: view.w, h: view.h };
}

// Collar, in screen pixels. The whole cat is placed from this point.
export function collarPosition(state, geom) {
  const drop = (CAT.idle.foot - CAT.idle.ay) * geom.catH;
  return {
    x: state.cat.x,
    y: geom.ground - drop - state.cat.lift + (state.cat.bob || 0),
  };
}

function pointOnCat(nx, ny, pose) {
  let dx = (nx - pose.ax) * pose.w;
  const dy = (ny - pose.ay) * pose.h;
  dx *= pose.facing;
  const c = Math.cos(pose.rot);
  const s = Math.sin(pose.rot);
  return {
    x: pose.x + dx * c - dy * s,
    y: pose.y + dx * s + dy * c,
  };
}

export function drawWorld(ctx, view, state, images) {
  const geom = geometry(view);
  const collar = collarPosition(state, geom);
  const inHoop = catIsInHoop(state, geom, collar);

  drawSky(ctx, view, state);
  drawHills(ctx, view, geom.ground);
  drawPines(ctx, view, geom);
  drawGround(ctx, view, geom.ground);
  drawFlowers(ctx, geom);
  drawHoop(ctx, geom, state, inHoop ? "back" : "all");
  drawStrand(ctx, geom, state);
  drawPrints(ctx, state);
  drawShadow(ctx, state, geom);
  drawYarn(ctx, geom, state);
  drawCat(ctx, state, geom, images, collar);
  // The near rim paints over her so she reads as jumping through.
  if (inHoop) drawHoop(ctx, geom, state, "front");
  drawParticles(ctx, state);
  drawCheers(ctx, state);
  drawSnow(ctx, view, state, true);
}

function catIsInHoop(state, geom, collar) {
  if (state.cat.action !== "jump" || state.cat.frame !== "jump") return false;
  const dx = collar.x - geom.hoopX;
  const dy = collar.y - geom.hoopY;
  return dx * dx + dy * dy < geom.hoopR * geom.hoopR * 0.72;
}

function drawSky(ctx, view, state) {
  const sky = ctx.createLinearGradient(0, 0, 0, view.h);
  sky.addColorStop(0, "#9ad8ff");
  sky.addColorStop(0.45, "#d7f2ff");
  sky.addColorStop(1, "#eef9ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, view.w, view.h);

  const sunX = view.w * 0.18;
  const sunY = view.h * 0.16;
  const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 90);
  glow.addColorStop(0, "rgba(255, 252, 220, 0.95)");
  glow.addColorStop(1, "rgba(255, 252, 220, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
  ctx.fill();

  drawCloud(ctx, ((state.time * 14) % (view.w + 260)) - 130, view.h * 0.12, 1);
  drawCloud(ctx, ((state.time * 8 + 400) % (view.w + 300)) - 160, view.h * 0.2, 0.72);
  drawSnow(ctx, view, state, false);
}

function drawCloud(ctx, x, y, s) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  blob(ctx, x, y, 34 * s, 22 * s);
  blob(ctx, x + 28 * s, y + 6 * s, 28 * s, 18 * s);
  blob(ctx, x - 26 * s, y + 8 * s, 24 * s, 16 * s);
  blob(ctx, x + 8 * s, y - 10 * s, 22 * s, 16 * s);
}

function blob(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHills(ctx, view, ground) {
  hill(ctx, view, ground - 70, "#e7f6ff", 18, 0.5);
  hill(ctx, view, ground - 36, "#f4fbff", 12, 1.4);
}

function hill(ctx, view, y, color, amp, phase) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, view.h);
  ctx.lineTo(0, y);
  for (let x = 0; x <= view.w; x += 18) {
    ctx.lineTo(x, y + Math.sin(x * 0.012 + phase) * amp);
  }
  ctx.lineTo(view.w, view.h);
  ctx.fill();
}

function drawPines(ctx, view, geom) {
  const trees = [
    { x: 0.05, s: 1.05 },
    { x: 0.14, s: 0.72 },
    { x: 0.22, s: 0.48 },
    { x: 0.58, s: 0.42 },
    { x: 0.9, s: 0.95 },
    { x: 0.97, s: 0.62 },
  ];
  trees.forEach((tree) => {
    const h = Math.min(geom.ground * 0.72, view.h * 0.46) * tree.s;
    drawPine(ctx, view.w * tree.x, geom.ground - 10, h);
  });
}

function drawPine(ctx, x, ground, h) {
  ctx.fillStyle = "#7a5340";
  roundRect(ctx, x - h * 0.035, ground - h * 0.16, h * 0.07, h * 0.18, 3);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const base = ground - h * 0.12 - i * h * 0.2;
    const width = h * (0.46 - i * 0.09);
    const top = base - h * 0.3;
    ctx.fillStyle = i === 1 ? "#217a48" : "#2f9a58";
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + width, base);
    ctx.lineTo(x - width, base);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
    ctx.beginPath();
    ctx.moveTo(x, top + 2);
    ctx.lineTo(x + width * 0.42, base - h * 0.08);
    ctx.quadraticCurveTo(x + width * 0.1, base - h * 0.12, x - width * 0.05, top + h * 0.08);
    ctx.fill();
  }
}

function drawGround(ctx, view, ground) {
  const g = ctx.createLinearGradient(0, ground - 50, 0, view.h);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.55, "#f7fbff");
  g.addColorStop(1, "#e5f3ff");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, view.h);
  ctx.lineTo(0, ground - 24);
  for (let x = 0; x <= view.w; x += 16) {
    const y = ground - 28 + Math.sin(x * 0.02) * 7 + Math.sin(x * 0.007 + 1) * 10;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(view.w, view.h);
  ctx.fill();

  ctx.fillStyle = "rgba(190, 216, 236, 0.35)";
  for (let i = 0; i < 8; i++) {
    const x = (i * 173 + 40) % view.w;
    blob(ctx, x, ground + 18 + (i % 3) * 8, 50 + (i % 4) * 16, 10);
  }
}

function drawFlowers(ctx, geom) {
  flower(ctx, 46, geom.ground - 18, "#c084fc");
  flower(ctx, geom.w * 0.1, geom.ground - 34, "#fb7185");
  flower(ctx, geom.w * 0.16, geom.ground - 12, "#a78bfa");
  berries(ctx, geom.w - 42, geom.ground - 16);
  berries(ctx, geom.w * 0.93, geom.ground - 32);
}

function flower(ctx, x, y, color) {
  ctx.fillStyle = "#3aaa5c";
  ctx.beginPath();
  ctx.ellipse(x - 10, y + 4, 9, 4, -0.7, 0, Math.PI * 2);
  ctx.ellipse(x + 10, y + 4, 9, 4, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * 8, y + Math.sin(a) * 8, 6, 4, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#ffe36b";
  ctx.beginPath();
  ctx.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

function berries(ctx, x, y) {
  ctx.strokeStyle = "#2f8a45";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y + 16);
  ctx.quadraticCurveTo(x - 4, y + 4, x, y);
  ctx.stroke();
  ctx.fillStyle = "#3aaa5c";
  ctx.beginPath();
  ctx.ellipse(x - 8, y + 2, 8, 4, -0.4, 0, Math.PI * 2);
  ctx.ellipse(x + 8, y + 1, 7, 3.5, 0.5, 0, Math.PI * 2);
  ctx.fill();
  const dots = [
    [0, 0, 6],
    [9, -6, 5],
    [-8, -3, 5],
    [5, 7, 4],
  ];
  dots.forEach(([dx, dy, r]) => {
    ctx.fillStyle = "#e23d4a";
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.beginPath();
    ctx.arc(x + dx - 1.5, y + dy - 1.5, 1.4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawHoop(ctx, geom, state, part) {
  const { hoopX: x, hoopY: y, hoopR: r, ground } = geom;
  const glow = state.hoopGlow || 0;
  const drawBack = part === "all" || part === "back";
  const drawFront = part === "all" || part === "front";

  if (drawBack) {
    ctx.fillStyle = "rgba(130, 160, 190, 0.22)";
    blob(ctx, x, ground - 4, r * 0.7, 10);

    const postW = Math.max(12, r * 0.13);
    ctx.fillStyle = "#7a5cff";
    roundRect(ctx, x - r * 0.62, y + r * 0.55, postW, Math.max(8, ground - (y + r * 0.55)), 8);
    ctx.fill();
    roundRect(ctx, x + r * 0.62 - postW, y + r * 0.55, postW, Math.max(8, ground - (y + r * 0.55)), 8);
    ctx.fill();
    ctx.fillStyle = "#6846ea";
    roundRect(ctx, x - r * 0.78, ground - 16, r * 1.56, 16, 8);
    ctx.fill();
  }

  ctx.lineCap = "butt";
  const bands = RAINBOW.length * 4;
  const width = r * 0.16;
  for (let i = 0; i < bands; i++) {
    const a0 = -Math.PI / 2 + (i / bands) * Math.PI * 2;
    const a1 = a0 + (Math.PI * 2) / bands + 0.02;
    const mid = (a0 + a1) / 2;
    const front = Math.sin(mid) > 0.2;
    if (front && !drawFront) continue;
    if (!front && !drawBack) continue;
    ctx.strokeStyle = RAINBOW[i % RAINBOW.length];
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(x, y, r, a0, a1);
    ctx.stroke();
  }

  if (drawBack) {
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = width * 0.22;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();

    // Small paws and flakes on the ring, like the sketch.
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i % 2 === 0) drawPaw(ctx, px, py, Math.max(0.7, r * 0.011), a + Math.PI / 2, "rgba(255,255,255,0.95)");
      else drawFlake(ctx, px, py, Math.max(4, r * 0.045), a, 0.95);
    }
  }

  if (glow > 0) {
    ctx.strokeStyle = `rgba(255,255,255,${glow})`;
    ctx.lineWidth = width * 0.85;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawStrand(ctx, geom, state) {
  const y0 = geom.ground - 18;
  const x0 = 70;
  const x1 = state.yarn.x;
  const y1 = geom.ground - geom.yarnR * 0.75;
  const steps = 16;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(5, geom.yarnR * 0.16);
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const wave = (t) => Math.sin(t * Math.PI * 3 + state.time * 2) * 12 * Math.sin(t * Math.PI);
    ctx.strokeStyle = RAINBOW[i % RAINBOW.length];
    ctx.beginPath();
    ctx.moveTo(x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0 + wave(t0));
    ctx.lineTo(x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1 + wave(t1));
    ctx.stroke();
  }
}

function drawYarn(ctx, geom, state) {
  const r = geom.yarnR * (0.65 + 0.35 * Math.min(1, state.yarn.pop));
  const x = state.yarn.x;
  const y = geom.ground - r * 0.72 + Math.sin(state.time * 3) * 3;
  ctx.save();
  ctx.fillStyle = "rgba(120, 155, 185, 0.25)";
  blob(ctx, x, geom.ground - 4, r * 0.8, r * 0.22);
  ctx.translate(x, y);
  const ball = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
  ball.addColorStop(0, "#fff");
  ball.addColorStop(0.45, "#ffe1f2");
  ball.addColorStop(1, "#f2b6de");
  ctx.fillStyle = ball;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  for (let i = 0; i < 7; i++) {
    ctx.strokeStyle = RAINBOW[i % RAINBOW.length];
    ctx.lineWidth = r * 0.22;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.05, r * 0.42, i * 0.7, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  blob(ctx, x - r * 0.3, y - r * 0.34, r * 0.2, r * 0.11);
  drawStar(ctx, x + r * 0.95, y - r * 0.85, 6, state.time, "#fff7b0");
  drawStar(ctx, x - r * 0.1, y - r * 1.2, 4, -state.time * 1.3, "#ffffff");
}

function drawShadow(ctx, state, geom) {
  const air = Math.min(1, state.cat.lift / (geom.catH * 0.7));
  ctx.save();
  ctx.translate(state.cat.x, geom.ground - 2);
  ctx.scale(1 - air * 0.4, 1);
  ctx.fillStyle = `rgba(120, 155, 185, ${0.28 - air * 0.16})`;
  blob(ctx, 0, 0, geom.catH * 0.26, geom.catH * 0.045);
  ctx.restore();
}

function drawCat(ctx, state, geom, images, collar) {
  const key = state.cat.frame || "idle";
  const spec = CAT[key] || CAT.idle;
  const img = images[key];
  if (!img || !img.complete || !img.naturalWidth) return;

  const dh = geom.catH * (state.cat.scale || 1);
  const dw = dh * (spec.w / spec.h);
  // Keep every pose's paws on the snow. The jump is lined up by the collar.
  const restDrop = CAT.idle.foot - CAT.idle.ay;
  const sit = key === "jump" ? 0 : (restDrop - (spec.foot - spec.ay)) * geom.catH;
  const pose = {
    x: collar.x,
    y: collar.y + sit,
    w: dw,
    h: dh,
    ax: spec.ax,
    ay: spec.ay,
    facing: state.cat.facing,
    rot: state.cat.rot || 0,
  };

  ctx.save();
  ctx.translate(pose.x, pose.y);
  ctx.rotate(pose.rot);
  ctx.scale(pose.facing, 1);
  ctx.drawImage(img, -spec.ax * dw, -spec.ay * dh, dw, dh);
  ctx.restore();

  const tag = pointOnCat(spec.ax, spec.ay + 0.055, pose);
  drawTag(ctx, tag.x, tag.y, pose.rot, dh);
}

function drawTag(ctx, x, y, rot, catH) {
  const w = catH * 0.16;
  const h = catH * 0.1;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = "#6a48d8";
  ctx.lineWidth = Math.max(2, catH * 0.012);
  ctx.beginPath();
  ctx.arc(0, -h * 0.62, h * 0.2, 0, Math.PI * 2);
  ctx.stroke();
  const gold = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  gold.addColorStop(0, "#fff6c8");
  gold.addColorStop(0.45, "#ffd24a");
  gold.addColorStop(1, "#e79b18");
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c48416";
  ctx.lineWidth = Math.max(1.5, catH * 0.008);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  blob(ctx, -w * 0.12, -h * 0.18, w * 0.16, h * 0.1);
  ctx.fillStyle = "#7a3f12";
  ctx.font = `700 ${Math.max(10, Math.round(catH * 0.046))}px Fredoka, "Trebuchet MS", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("FLEKY", 0, h * 0.04);
  ctx.restore();
}

function drawPrints(ctx, state) {
  state.prints.forEach((p) => {
    drawPaw(ctx, p.x, p.y, 1.1, p.rot, `rgba(125, 160, 195, ${p.life * 0.45})`);
  });
}

function drawPaw(ctx, x, y, s, rot, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  blob(ctx, 0, 2.2 * s, 6 * s, 5 * s);
  [
    [-5, -5.5],
    [0, -8],
    [5, -5.5],
  ].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(dx * s, dy * s, 2.2 * s, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawParticles(ctx, state) {
  state.particles.forEach((p) => {
    const alpha = Math.max(0, p.life);
    if (p.kind === "puff") {
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.85})`;
      blob(ctx, p.x, p.y, p.size * (1.4 - alpha), p.size * 0.7);
    } else {
      drawStar(ctx, p.x, p.y, p.size, p.rot, withAlpha(p.color, alpha));
    }
  });
}

function drawCheers(ctx, state) {
  state.cheers.forEach((c) => {
    const alpha = Math.max(0, Math.min(1, c.life * 1.4));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `700 ${c.size}px Fredoka, "Trebuchet MS", sans-serif`;
    ctx.textAlign = "center";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#fff";
    ctx.fillStyle = c.color;
    ctx.strokeText(c.text, c.x, c.y);
    ctx.fillText(c.text, c.x, c.y);
    ctx.restore();
  });
}

function drawStar(ctx, x, y, r, rot, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const b = a + Math.PI / 5;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(b) * r * 0.42, Math.sin(b) * r * 0.42);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSnow(ctx, view, state, front) {
  state.flakes.forEach((flake) => {
    if (Boolean(flake.front) !== front) return;
    const x = flake.x;
    const y = flake.y;
    if (flake.kind === "dot") {
      ctx.fillStyle = `rgba(255,255,255,${flake.a})`;
      ctx.beginPath();
      ctx.arc(x, y, flake.r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      drawFlake(ctx, x, y, flake.r * 2.2, flake.spin + state.time * 0.4, flake.a);
    }
  });
}

function drawFlake(ctx, x, y, r, rot, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = Math.max(1.2, r * 0.28);
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.stroke();
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function withAlpha(hex, alpha) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
