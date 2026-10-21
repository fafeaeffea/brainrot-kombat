'use strict';
// Пиксельный растеризатор и скелетная отрисовка бойцов
const SPR_W = 150, SPR_H = 132, SPR_OX = 75, SPR_OY = 118;

// Глобальный масштаб спрайтов: растр хранит w*RS × h*RS «тонких» пикселей,
// а все примитивы принимают логические (1x) координаты (дробные — адресуют тонкий пиксель).
const RS = 2;
class Raster {
  constructor(lw, lh, s = RS) {
    this.s = s; this.lw = lw; this.lh = lh;
    const w = Math.round(lw * s), h = Math.round(lh * s);
    this.w = w; this.h = h;
    [this.cv, this.ctx] = mkCanvas(w, h);
    this.img = this.ctx.createImageData(w, h);
    this.d = new Uint32Array(this.img.data.buffer);
    this.tmp = new Uint32Array(w * h);
  }
  clear() { this.d.fill(0); }
  // прямоугольник в тонких пикселях [X0,X1)×[Y0,Y1)
  blk(X0, Y0, X1, Y1, c) {
    X0 = X0 < 0 ? 0 : X0; Y0 = Y0 < 0 ? 0 : Y0; X1 = X1 > this.w ? this.w : X1; Y1 = Y1 > this.h ? this.h : Y1;
    const w = this.w, d = this.d;
    for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) d[y * w + x] = c;
  }
  // логический пиксель (блок s×s)
  px(x, y, c) { const s = this.s, X = Math.floor(x * s), Y = Math.floor(y * s), n = Math.max(1, Math.round(s)); this.blk(X, Y, X + n, Y + n, c); }
  // один тонкий пиксель
  // «тонкий» пиксель = 1/RS логического; в растре крупнее (портреты) он растёт пропорционально
  get fn() { return Math.max(1, Math.round(this.s / RS)); }
  dot(x, y, c) { const n = this.fn, X = Math.floor(x * this.s), Y = Math.floor(y * this.s); if (n === 1) { if (X < 0 || Y < 0 || X >= this.w || Y >= this.h) return; this.d[Y * this.w + X] = c; } else this.blk(X, Y, X + n, Y + n, c); }
  get(x, y) { const X = Math.floor(x * this.s), Y = Math.floor(y * this.s); if (X < 0 || Y < 0 || X >= this.w || Y >= this.h) return 0; return this.d[Y * this.w + X]; }
  disk(cx, cy, r, c) {
    if (r <= 0.3) { this.px(cx, cy, c); return; }
    const s = this.s; cx *= s; cy *= s; r *= s;
    const x0 = Math.floor(cx - r), x1 = Math.ceil(cx + r), y0 = Math.floor(cy - r), y1 = Math.ceil(cy + r), rr = r * r, w = this.w;
    for (let y = Math.max(0, y0); y <= Math.min(this.h - 1, y1); y++) {
      const dy = y + 0.5 - cy;
      for (let x = Math.max(0, x0); x <= Math.min(w - 1, x1); x++) {
        const dx = x + 0.5 - cx;
        if (dx * dx + dy * dy <= rr) this.d[y * w + x] = c;
      }
    }
  }
  ellipse(cx, cy, rx, ry, c) {
    const s = this.s; cx *= s; cy *= s; rx *= s; ry *= s;
    const x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx), y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry), w = this.w;
    for (let y = Math.max(0, y0); y <= Math.min(this.h - 1, y1); y++) {
      const dy = (y + 0.5 - cy) / ry;
      for (let x = Math.max(0, x0); x <= Math.min(w - 1, x1); x++) {
        const dx = (x + 0.5 - cx) / rx;
        if (dx * dx + dy * dy <= 1) this.d[y * w + x] = c;
      }
    }
  }
  capsule(x1, y1, x2, y2, r1, r2, c) {
    const s = this.s; x1 *= s; y1 *= s; x2 *= s; y2 *= s; r1 *= s; r2 *= s;
    const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy, rm = Math.max(r1, r2), w = this.w, d = this.d;
    if (L2 < 0.01) { this.disk(x1 / s, y1 / s, rm / s, c); return; }
    const X0 = Math.max(0, Math.floor(Math.min(x1, x2) - rm)), X1 = Math.min(w - 1, Math.ceil(Math.max(x1, x2) + rm));
    const Y0 = Math.max(0, Math.floor(Math.min(y1, y2) - rm)), Y1 = Math.min(this.h - 1, Math.ceil(Math.max(y1, y2) + rm)), dr = r2 - r1;
    for (let y = Y0; y <= Y1; y++) {
      const py = y + 0.5 - y1;
      for (let x = X0; x <= X1; x++) {
        const px = x + 0.5 - x1;
        let t = (px * dx + py * dy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const ex = px - dx * t, ey = py - dy * t, r = r1 + dr * t;
        if (ex * ex + ey * ey <= r * r) d[y * w + x] = c;
      }
    }
  }
  // линия толщиной в логический пиксель (сглаженная лесенка на тонкой сетке)
  line(x1, y1, x2, y2, c) {
    const s = this.s, n0 = Math.max(1, Math.round(s));
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * s));
    for (let i = 0; i <= n; i++) { const t = i / n, X = Math.floor((x1 + (x2 - x1) * t) * s), Y = Math.floor((y1 + (y2 - y1) * t) * s); this.blk(X, Y, X + n0, Y + n0, c); }
  }
  // тонкая линия в один тонкий пиксель
  fline(x1, y1, x2, y2, c) {
    const s = this.s, n = Math.max(1, Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * s));
    for (let i = 0; i <= n; i++) { const t = i / n; this.dot(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, c); }
  }
  rect(x, y, w, h, c) {
    const s = this.s, X = Math.round(x * s), Y = Math.round(y * s);
    this.blk(X, Y, X + Math.round(w * s), Y + Math.round(h * s), c);
  }
  // прямоугольник в тонких пикселях с логическим началом (для мелких деталей)
  frect(x, y, fw, fh, c) { const n = this.fn, X = Math.floor(x * this.s), Y = Math.floor(y * this.s); this.blk(X, Y, X + fw * n, Y + fh * n, c); }
  poly(pts, c) {
    const s = this.s;
    let minY = 1e9, maxY = -1e9;
    for (const p of pts) { minY = Math.min(minY, p[1] * s); maxY = Math.max(maxY, p[1] * s); }
    const n = pts.length, xs = [];
    for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(this.h - 1, Math.ceil(maxY)); y++) {
      const sy = y + 0.5; xs.length = 0;
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % n], ay = a[1] * s, by = b[1] * s;
        if ((ay <= sy && by > sy) || (by <= sy && ay > sy)) xs.push(a[0] * s + (sy - ay) / (by - ay) * (b[0] - a[0]) * s);
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x <= Math.min(this.w - 1, Math.floor(xs[k + 1] - 0.5)); x++) this.d[y * this.w + x] = c;
    }
  }
  // Контровой свет: тонкая цветная кромка по заднему и верхнему краю силуэта (под контуром)
  rim(col, a) {
    const w = this.w, h = this.h, d = this.d, t = this.tmp; t.set(d);
    const cr = col & 255, cg = (col >> 8) & 255, cb = (col >> 16) & 255;
    for (let y = 2; y < h; y++) for (let x = 2; x < w; x++) {
      const i = y * w + x, c = t[i]; if (!c) continue;
      let k = 0;
      if (!t[i - 2] && t[i - 1]) k = a; else if (!t[i - 2 * w] && t[i - w]) k = a * 0.55;
      if (!k) continue;
      const r = c & 255, g = (c >> 8) & 255, b = (c >> 16) & 255;
      d[i] = (c & 0xff000000) | ((b + (cb - b) * k) << 16) | ((g + (cg - g) * k) << 8) | (r + (cr - r) * k);
    }
  }
  // Выборочный (цветной) контур в один тонкий пиксель: тёмный, но с оттенком соседнего пикселя;
  // сверху/слева чуть светлее, снизу/справа — почти чистый тёмный
  outline(oc) {
    const w = this.w, h = this.h, d = this.d, t = this.tmp;
    t.set(d);
    const oR = oc & 255, oG = (oc >> 8) & 255, oB = (oc >> 16) & 255;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        const i = row + x;
        if (d[i] !== 0) continue;
        let c = 0, k = 0;
        if (x < w - 1 && d[i + 1]) { c = d[i + 1]; k = 0.3; }
        else if (y < h - 1 && d[i + w]) { c = d[i + w]; k = 0.26; }
        else if (x > 0 && d[i - 1]) { c = d[i - 1]; k = 0.1; }
        else if (y > 0 && d[i - w]) { c = d[i - w]; k = 0.06; }
        if (!c) continue;
        const j = 1 - k;
        t[i] = (0xff000000 | (((oB * j + ((c >> 16) & 255) * k) | 0) << 16) | (((oG * j + ((c >> 8) & 255) * k) | 0) << 8) | ((oR * j + (c & 255) * k) | 0)) >>> 0;
      }
    }
    d.set(t);
  }
  // Затемнить уже нарисованные пиксели внутри «таблетки» (ambient occlusion / падающая тень)
  shadowCapsule(x1, y1, x2, y2, r1, r2, amt = 0.7) {
    const s = this.s; x1 *= s; y1 *= s; x2 *= s; y2 *= s; r1 *= s; r2 *= s;
    const dx = x2 - x1, dy = y2 - y1, L2 = Math.max(0.01, dx * dx + dy * dy), rm = Math.max(r1, r2), w = this.w, d = this.d;
    const X0 = Math.max(0, Math.floor(Math.min(x1, x2) - rm)), X1 = Math.min(w - 1, Math.ceil(Math.max(x1, x2) + rm));
    const Y0 = Math.max(0, Math.floor(Math.min(y1, y2) - rm)), Y1 = Math.min(this.h - 1, Math.ceil(Math.max(y1, y2) + rm)), dr = r2 - r1;
    const a = amt, rb = (1 - a) * 22, gb = (1 - a) * 10, bb = (1 - a) * 40;
    for (let y = Y0; y <= Y1; y++) {
      const py = y + 0.5 - y1;
      for (let x = X0; x <= X1; x++) {
        const i = y * w + x, c = d[i];
        if (!c) continue;
        const px = x + 0.5 - x1;
        let t = (px * dx + py * dy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const ex = px - dx * t, ey = py - dy * t, r = r1 + dr * t;
        if (ex * ex + ey * ey <= r * r)
          d[i] = ((c & 0xff000000) | ((((c >> 16) & 255) * a + bb) << 16) | ((((c >> 8) & 255) * a + gb) << 8) | (((c & 255) * a + rb) | 0)) >>> 0;
      }
    }
  }
  // Ограничивающий прямоугольник непустых пикселей (в тонких пикселях)
  bounds() {
    const w = this.w, h = this.h, d = this.d;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) if (d[row + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; }
    }
    return x1 < 0 ? null : [x0, y0, x1 + 1, y1 + 1];
  }
  // Поворот другого растра (ближайший сосед) с опорной точкой; sx,sy — в логических координатах src, dx,dy — в логических своих
  blitRot(src, sx, sy, dx, dy, ang, flipY) {
    if (Math.abs(ang) < 0.1) ang = 0;
    const bb = src.bounds(); if (!bb) return;
    const S = this.s, k = src.s / S;
    sx *= src.s; sy *= src.s; dx *= S; dy *= S;
    const s = Math.sin(ang), co = Math.cos(ang), sw = src.w, sh = src.h, sd = src.d, w = this.w, d = this.d;
    let mx0 = 1e9, my0 = 1e9, mx1 = -1e9, my1 = -1e9;
    for (let q = 0; q < 4; q++) {
      const u = ((q & 1 ? bb[2] : bb[0]) - sx) / k, v0 = ((q & 2 ? bb[3] : bb[1]) - sy) / k, v = flipY ? -v0 : v0;
      const X = u * co - v * s, Y = u * s + v * co;
      if (X < mx0) mx0 = X; if (X > mx1) mx1 = X; if (Y < my0) my0 = Y; if (Y > my1) my1 = Y;
    }
    for (let y = Math.max(0, Math.floor(dy + my0 - 1)); y <= Math.min(this.h - 1, Math.ceil(dy + my1 + 1)); y++) {
      const ry = y + 0.5 - dy;
      for (let x = Math.max(0, Math.floor(dx + mx0 - 1)); x <= Math.min(w - 1, Math.ceil(dx + mx1 + 1)); x++) {
        const rx = x + 0.5 - dx;
        let u = (rx * co + ry * s) * k, v = (-rx * s + ry * co) * k;
        if (flipY) v = -v;
        const ix = Math.floor(u + sx), iy = Math.floor(v + sy);
        if (ix < 0 || iy < 0 || ix >= sw || iy >= sh) continue;
        const c = sd[iy * sw + ix];
        if (c) d[y * w + x] = c;
      }
    }
  }
  tint(mode, k = 1) {
    const d = this.d;
    for (let i = 0; i < d.length; i++) {
      const c = d[i]; if (!c) continue;
      const r = c & 255, g = (c >> 8) & 255, b = (c >> 16) & 255, a = c >>> 24;
      const L = (r * 0.3 + g * 0.59 + b * 0.11);
      let R2, G2, B2;
      if (mode === 'flash') { R2 = lerp(r, 255, k); G2 = lerp(g, 255, k); B2 = lerp(b, 255, k); }
      else if (mode === 'ice') { R2 = lerp(r, L * 0.55 + 40, k); G2 = lerp(g, L * 0.8 + 70, k); B2 = lerp(b, L * 0.6 + 140, k); }
      else if (mode === 'char') { R2 = lerp(r, L * 0.25 + 10, k); G2 = lerp(g, L * 0.2 + 6, k); B2 = lerp(b, L * 0.2 + 8, k); }
      else if (mode === 'gold') { R2 = lerp(r, L * 0.9 + 80, k); G2 = lerp(g, L * 0.75 + 50, k); B2 = lerp(b, L * 0.3, k); }
      else if (mode === 'shadow') { R2 = lerp(r, 20, k); G2 = lerp(g, 10, k); B2 = lerp(b, 40, k); }
      else if (mode === 'poison') { R2 = lerp(r, L * 0.5, k); G2 = lerp(g, L * 0.9 + 60, k); B2 = lerp(b, L * 0.4, k); }
      else continue;
      d[i] = ((a << 24) | (clamp(B2 | 0, 0, 255) << 16) | (clamp(G2 | 0, 0, 255) << 8) | clamp(R2 | 0, 0, 255)) >>> 0;
    }
  }
  flush() { this.ctx.putImageData(this.img, 0, 0); }
}

function ik(a, t, l1, l2, pref) {
  let dx = t.x - a.x, dy = t.y - a.y, d = Math.hypot(dx, dy);
  const max = l1 + l2 - 0.01;
  let tx = t.x, ty = t.y;
  if (d > max) { tx = a.x + dx / d * max; ty = a.y + dy / d * max; d = max; }
  if (d < 0.5) d = 0.5;
  const base = Math.atan2(dy, dx), A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const j1 = { x: a.x + Math.cos(base + A) * l1, y: a.y + Math.sin(base + A) * l1 };
  const j2 = { x: a.x + Math.cos(base - A) * l1, y: a.y + Math.sin(base - A) * l1 };
  const s1 = (j1.x - a.x) * pref.x + (j1.y - a.y) * pref.y, s2 = (j2.x - a.x) * pref.x + (j2.y - a.y) * pref.y;
  return { j: s1 >= s2 ? j1 : j2, end: { x: tx, y: ty } };
}
function rotP(p, c, a) {
  const s = Math.sin(a), co = Math.cos(a), dx = p.x - c.x, dy = p.y - c.y;
  return { x: c.x + dx * co - dy * s, y: c.y + dx * s + dy * co };
}
const lp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

function solvePose(ch, p) {
  const b = ch.build;
  const hip = { x: p.hx || 0, y: -(b.leg1 + b.leg2) + (p.hy || 0) };
  const ta = (p.torso || 0) * DEG, sx = Math.sin(ta), cy = Math.cos(ta);
  const neck = { x: hip.x + sx * b.torso, y: hip.y - cy * b.torso };
  const ha = ((p.torso || 0) + (p.head || 0)) * DEG;
  const hd = b.neck + b.headR;
  const head = { x: neck.x + Math.sin(ha) * hd, y: neck.y - Math.cos(ha) * hd };
  const sh = { x: neck.x - sx * b.shDrop, y: neck.y + cy * b.shDrop };
  const shF = { x: sh.x + 1, y: sh.y }, shB = { x: sh.x - 2, y: sh.y - 0.5 };
  const hF = p.hF || [10, -3], hB = p.hB || [8, 1];
  const eP = { x: -0.45, y: 1 };
  const aF = ik(shF, { x: shF.x + hF[0], y: shF.y + hF[1] }, b.arm1, b.arm2, p.eF || eP);
  const aB = ik(shB, { x: shB.x + hB[0], y: shB.y + hB[1] }, b.arm1, b.arm2, p.eB || eP);
  const hipF = { x: hip.x + 1.5, y: hip.y }, hipB = { x: hip.x - 1.5, y: hip.y };
  const kP = { x: 1, y: -0.15 }, fF = p.fF || [8, 0], fB = p.fB || [-8, 0];
  const lF = ik(hipF, { x: fF[0], y: fF[1] }, b.leg1, b.leg2, p.kF || kP);
  const lB = ik(hipB, { x: fB[0], y: fB[1] }, b.leg1, b.leg2, p.kB || kP);
  const J = { hip, neck, head, shF, shB, elF: aF.j, hdF: aF.end, elB: aB.j, hdB: aB.end, hipF, hipB, knF: lF.j, ftF: lF.end, knB: lB.j, ftB: lB.end };
  let rot = (p.rot || 0) * DEG;
  if (rot) {
    const c = { x: hip.x, y: hip.y - 8 };
    for (const k in J) J[k] = rotP(J[k], c, rot);
  }
  J.ta = ta + rot; J.ha = ha + rot; J.rot = rot;
  return J;
}

// ---------- примитивы с затенением ----------
// Свет сверху-слева-спереди. Рампа материала: 0 тёмный контур, 1 тень, 2 база, 3 свет, 4 блик, 5 отражённый (холодный) свет
const S = (col, k) => k ? shade(col, k) : col;
const LX = -0.5, LY = -0.62, LZ = 0.6;
const _ramps = {};
function ramp(col, k = 0) {
  const key = col + k;
  let r = _ramps[key];
  if (r) return r;
  const b = k ? shade(col, k) : col;
  r = _ramps[key] = [c32(shade(b, -0.58)), c32(shade(b, -0.3)), c32(b), c32(shade(b, 0.24)), c32(shade(b, 0.5)), c32(mix(shade(b, -0.16), '#8fb4ff', 0.28))];
  return r;
}
// tex(s, v, ti, t) — текстура: s — пиксели вдоль оси, v — поперёк (-1..1, + к «спине» отрезка), ti — тон;
// возвращает индекс тона (0..5) или готовый цвет (> 15)
// Все шейдеры работают на тонкой сетке растра, а tex-колбэки получают логические координаты.
// DI — лёгкий шахматный дизеринг на границах тонов (пиксель-арт градиент)
const DI = 0.028;
function tube(R, a, b, r1, r2, col, k, tex, flat) {
  const rp = typeof col === 'string' ? ramp(col, k || 0) : col, S = R.s, is = 1 / S;
  const ax = a.x * S, ay = a.y * S, bx = b.x * S, by = b.y * S, R1 = r1 * S, R2 = r2 * S;
  const dx = bx - ax, dy = by - ay, L2 = Math.max(0.01, dx * dx + dy * dy), len = Math.sqrt(L2);
  const rmL = Math.max(r1, r2), rm = rmL * S, w = R.w, d = R.d, dr = R2 - R1, big = rmL >= 2.6, huge = rmL >= 5;
  const X0 = Math.max(0, Math.floor(Math.min(ax, bx) - rm)), X1 = Math.min(w - 1, Math.ceil(Math.max(ax, bx) + rm));
  const Y0 = Math.max(0, Math.floor(Math.min(ay, by) - rm)), Y1 = Math.min(R.h - 1, Math.ceil(Math.max(ay, by) + rm));
  const qx = -dy / len, qy = dx / len, rim = 0.62 * S, rim2 = 1.7 * S;
  for (let y = Y0; y <= Y1; y++) {
    const py = y + 0.5 - ay;
    for (let x = X0; x <= X1; x++) {
      const px = x + 0.5 - ax;
      let t = (px * dx + py * dy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const ex = px - dx * t, ey = py - dy * t, r = R1 + dr * t, d2 = ex * ex + ey * ey;
      if (d2 > r * r) continue;
      const dd = Math.sqrt(d2), nx = ex / r, ny = ey / r, n2 = nx * nx + ny * ny;
      const I = nx * LX + ny * LY + (n2 < 1 ? Math.sqrt(1 - n2) : 0) * LZ + (((x + y) & 1) ? DI : -DI);
      let ti;
      if (flat) ti = 2;
      else if (r >= 1.7 * S && dd > r - rim && I < 0.12) ti = 0;
      else if (big && I > 0.94) ti = 4;
      else if (I > 0.74) ti = 3;
      else if (I > 0.3) ti = 2;
      else if (huge && dd > r - rim2 && I < 0) ti = 5;
      else ti = 1;
      if (tex) { ti = tex(t * len * is, (ex * qx + ey * qy) / r, ti, t); if (ti < 0) continue; if (ti > 15) { d[y * w + x] = ti; continue; } }
      d[y * w + x] = rp[ti];
    }
  }
}
function sphere(R, cx, cy, r, col, k, tex) {
  const rp = typeof col === 'string' ? ramp(col, k || 0) : col, S = R.s, is = 1 / S, w = R.w, d = R.d, big = r >= 2.4;
  if (r <= 0.6) { R.px(cx, cy, rp[2]); return; }
  const rl = r; cx *= S; cy *= S; r *= S;
  const rim = 0.62 * S, rim2 = 1.6 * S;
  for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(R.h - 1, Math.ceil(cy + r)); y++) {
    const ny0 = (y + 0.5 - cy);
    for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(w - 1, Math.ceil(cx + r)); x++) {
      const nx0 = x + 0.5 - cx, d2 = nx0 * nx0 + ny0 * ny0;
      if (d2 > r * r) continue;
      const dd = Math.sqrt(d2), nx = nx0 / r, ny = ny0 / r, n2 = nx * nx + ny * ny;
      const I = nx * LX + ny * LY + Math.sqrt(Math.max(0, 1 - n2)) * LZ + (((x + y) & 1) ? DI : -DI);
      let ti;
      if (rl >= 1.7 && dd > r - rim && I < 0.12) ti = 0;
      else if (big && I > 0.94) ti = 4;
      else if (I > 0.74) ti = 3;
      else if (I > 0.3) ti = 2;
      else if (rl >= 5 && dd > r - rim2 && I < 0) ti = 5;
      else ti = 1;
      if (tex) { ti = tex(nx0 * is, ny0 * is, ti); if (ti < 0) continue; if (ti > 15) { d[y * w + x] = ti; continue; } }
      d[y * w + x] = rp[ti];
    }
  }
}
// Эллипсоид (освещён как сфера)
function ovoid(R, cx, cy, rx, ry, col, k, tex) {
  const rp = typeof col === 'string' ? ramp(col, k || 0) : col, S = R.s, is = 1 / S, w = R.w, d = R.d, mn = Math.min(rx, ry), big = mn >= 2.4, ek = (1 - 0.62 / mn) ** 2;
  cx *= S; cy *= S; rx *= S; ry *= S;
  for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(R.h - 1, Math.ceil(cy + ry)); y++) {
    const ny = (y + 0.5 - cy) / ry;
    for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(w - 1, Math.ceil(cx + rx)); x++) {
      const nx = (x + 0.5 - cx) / rx, n2 = nx * nx + ny * ny;
      if (n2 > 1) continue;
      const I = nx * LX + ny * LY + Math.sqrt(1 - n2) * LZ + (((x + y) & 1) ? DI : -DI);
      const edge = n2 > ek;
      let ti;
      if (edge && mn >= 1.7 && I < 0.12) ti = 0;
      else if (big && I > 0.94) ti = 4;
      else if (I > 0.74) ti = 3;
      else if (I > 0.3) ti = 2;
      else ti = 1;
      if (tex) { ti = tex((x + 0.5 - cx) * is, (y + 0.5 - cy) * is, ti); if (ti < 0) continue; if (ti > 15) { d[y * w + x] = ti; continue; } }
      d[y * w + x] = rp[ti];
    }
  }
}
// Пластина-многоугольник с фаской: светлая грань к свету, тёмная — от света
function plate(R, pts, col, k, tex, bev) {
  const rp = typeof col === 'string' ? ramp(col, k || 0) : col, n = pts.length, w = R.w, d = R.d, S = R.s, is = 1 / S;
  const P = pts.map(p => [p[0] * S, p[1] * S]), bv = (bev == null ? 0.8 : bev) * S, B2 = bv * bv;
  let area = 0, minY = 1e9, maxY = -1e9;
  for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; if (a[1] < minY) minY = a[1]; if (a[1] > maxY) maxY = a[1]; }
  const sg = area > 0 ? 1 : -1, E = [];
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey) || 1;
    const nx = ey / l * sg, ny = -ex / l * sg; // наружная нормаль
    const L = nx * LX + ny * LY;
    E.push([a[0], a[1], ex / l, ey / l, l, L > 0.25 ? 3 : L < -0.3 ? 0 : 1]);
  }
  const xs = [];
  for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(R.h - 1, Math.ceil(maxY)); y++) {
    const sy = y + 0.5; xs.length = 0;
    for (let i = 0; i < n; i++) {
      const a = P[i], b = P[(i + 1) % n];
      if ((a[1] <= sy && b[1] > sy) || (b[1] <= sy && a[1] > sy)) xs.push(a[0] + (sy - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
    }
    xs.sort((p, q) => p - q);
    for (let q = 0; q + 1 < xs.length; q += 2)
      for (let x = Math.max(0, Math.ceil(xs[q] - 0.5)); x <= Math.min(w - 1, Math.floor(xs[q + 1] - 0.5)); x++) {
        const sx = x + 0.5;
        let best = B2, bt = 2;
        for (let e = 0; e < n; e++) {
          const Ee = E[e], px = sx - Ee[0], py = sy - Ee[1];
          let t = px * Ee[2] + py * Ee[3]; t = t < 0 ? 0 : t > Ee[4] ? Ee[4] : t;
          const qx = px - Ee[2] * t, qy = py - Ee[3] * t, dd = qx * qx + qy * qy;
          if (dd < best) { best = dd; bt = Ee[5]; }
        }
        let ti = bt;
        if (tex) { ti = tex(sx * is, sy * is, ti); if (ti < 0) continue; if (ti > 15) { d[y * w + x] = ti; continue; } }
        d[y * w + x] = rp[ti];
      }
  }
}
// совместимость: старые limb/ball теперь объёмные
function limb(R, a, b, r1, r2, col, k = 0, tex) { tube(R, a, b, r1, r2, col, k, tex); }
function ball(R, x, y, r, col, k = 0, tex) { sphere(R, x, y, r, col, k, tex); }
// мягкая тень от детали на уже нарисованное (свет сверху-слева → тень вниз-вправо)
function ao(R, a, b, r1, r2, amt = 0.72, ox = 1.1, oy = 1.3) { R.shadowCapsule(a.x + ox, a.y + oy, b.x + ox, b.y + oy, r1, r2, amt); }
// пиксель/линия в системе координат корпуса
function TPx(R, J, u, v, c) { const p = TP(J, u, v); R.px(p.x, p.y, c); }
function TL(R, J, u1, v1, u2, v2, c) { const a = TP(J, u1, v1), b = TP(J, u2, v2); R.line(a.x, a.y, b.x, b.y, c); }
function TPoly(J, arr) { return arr.map(q => { const p = TP(J, q[0], q[1]); return [p.x, p.y]; }); }
function torsoPerp(J) { return { x: Math.cos(J.ta), y: Math.sin(J.ta) }; }   // поперёк корпуса (вперёд)
function torsoAxis(J) { return { x: Math.sin(J.ta), y: -Math.cos(J.ta) }; }   // вдоль корпуса (вверх)
// точка в системе корпуса: u — вперёд, v — вверх от бедра
function TP(J, u, v) { const a = torsoAxis(J), p = torsoPerp(J); return { x: J.hip.x + p.x * u + a.x * v, y: J.hip.y + p.y * u + a.y * v }; }

const HEAD_R = new Raster(56, 56);
const WEP_R = new Raster(96, 40);

// ---------- части тела по умолчанию ----------
function drawFist(R, el, hd, r, col, k) {
  const rp = ramp(col, k), dx = hd.x - el.x, dy = hd.y - el.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  sphere(R, hd.x, hd.y, r, rp);
  if (r < 2.2) return;
  // костяшки и большой палец
  const fx = hd.x + ux * (r - 1.5), fy = hd.y + uy * (r - 1.5), qx = -uy, qy = ux;
  R.line(fx + qx * (r - 1.2), fy + qy * (r - 1.2), fx - qx * (r - 1.6), fy - qy * (r - 1.6), rp[1]);
  R.px(hd.x - qx * 1.4 + ux * 0.3, hd.y - qy * 1.4 + uy * 0.3, rp[3]);
}
function drawArm(R, ch, J, side, P, k, f) {
  const m = ch.build.limb, sh = J['sh' + side], el = J['el' + side], hd = J['hd' + side], D = ch.draw || {}, tx = D.tex || {};
  tube(R, sh, el, 3.1 * m, 2.6 * m, P.sleeve || P.skin, k, tx.sleeve);
  ao(R, el, lp(el, hd, 0.3), 2.4 * m, 2.3 * m, 0.8, 0.6, 0.8);
  tube(R, el, hd, 2.6 * m, 2.2 * m, P.fore || P.skin, k, tx.fore);
  if (P.bracer) tube(R, lp(el, hd, 0.35), lp(el, hd, 0.85), 2.8 * m, 2.6 * m, P.bracer, k, tx.bracer);
  if (D.arm) D.arm(R, J, side, P, k, sh, el, hd);
  if (side === 'F' && ch.weapon && !(f && f.portrait)) drawWeapon(R, ch, J, P, f);
  if (ch.fin) { // плавник вместо кулака
    const d = Math.atan2(hd.y - el.y, hd.x - el.x), gc = P.glove || P.skin;
    plate(R, [[hd.x + Math.cos(d - 1.3) * 2.6, hd.y + Math.sin(d - 1.3) * 2.6], [hd.x + Math.cos(d - 0.15) * 6.5, hd.y + Math.sin(d - 0.15) * 6.5], [hd.x + Math.cos(d + 0.5) * 4.5, hd.y + Math.sin(d + 0.5) * 4.5], [hd.x + Math.cos(d + 1.3) * 2.6, hd.y + Math.sin(d + 1.3) * 2.6]], gc, k - 0.1);
    const c = ramp(gc, k);
    R.line(hd.x, hd.y, hd.x + Math.cos(d - 0.2) * 5, hd.y + Math.sin(d - 0.2) * 5, c[1]);
    sphere(R, hd.x, hd.y, 2.6 * m, gc, k);
  } else drawFist(R, el, hd, 2.9 * m, P.glove || P.skin, k);
}
function drawLeg(R, ch, J, side, P, k) {
  const m = ch.build.limb, hp = J['hip' + side], kn = J['kn' + side], ft = J['ft' + side], D = ch.draw || {}, tx = D.tex || {};
  tube(R, hp, kn, 3.7 * m, 3.1 * m, P.pants, k, tx.pants);
  ao(R, kn, lp(kn, ft, 0.25), 2.9 * m, 2.8 * m, 0.82, 0.5, 0.9);
  tube(R, kn, ft, 3.1 * m, 2.5 * m, P.shin || P.pants, k, tx.shin || tx.pants);
  const sd = { x: (ft.x - kn.x), y: (ft.y - kn.y) }, l = Math.hypot(sd.x, sd.y) || 1;
  const fd = { x: sd.y / l, y: -sd.x / l };
  const toe = { x: ft.x + fd.x * 4.6 * m, y: ft.y + fd.y * 4.6 * m };
  if (P.boots) tube(R, lp(kn, ft, ch.bootTop || 0.45), ft, 3.1 * m, 2.7 * m, P.boots, k, tx.boots);
  const sc = P.shoes || P.boots || P.pants;
  tube(R, { x: ft.x - fd.x * 0.8, y: ft.y - fd.y * 0.8 }, toe, 2.5 * m, 1.9 * m, sc, k, tx.shoes);
  const ux = sd.x / l, uy = sd.y / l;
  if (P.sole) R.capsule(ft.x - fd.x * 1.4 + ux * 1.6, ft.y - fd.y * 1.4 + uy * 1.6, toe.x + ux * 1.2, toe.y + uy * 1.2, 0.9, 0.9, ramp(P.sole, k)[2]);
  else R.line(ft.x - fd.x * 1.6 + ux * 2.1, ft.y - fd.y * 1.6 + uy * 2.1, toe.x + ux * 1.4 - fd.x * 0.6, toe.y + uy * 1.4 - fd.y * 0.6, ramp(sc, k)[0]);
  if (P.stripe && k > -0.2) R.line(ft.x - fd.x * 0.5, ft.y - fd.y * 0.5 - 1, toe.x - fd.x * 1.5, toe.y - fd.y * 1.5 - 0.5, ramp(P.stripe, k)[2]);
  if (D.leg) D.leg(R, J, side, P, k, hp, kn, ft, toe);
}
function drawTorsoDefault(R, ch, J, P) {
  const b = ch.build, tx = (ch.draw && ch.draw.tex) || ch.tex || {};
  if (b.hips) {
    // женский силуэт: тонкая талия, округлые бёдра и мягкий контур груди
    const wy = b.torso * 0.42, w = TP(J, 0.2, wy);
    tube(R, J.hip, w, b.waist, b.waist * 0.82, P.main, 0, tx.main);
    tube(R, w, J.neck, b.waist * 0.82, b.chest, P.main, 0, tx.main);
    const bu = TP(J, b.chest * 0.62, b.torso - 6.2); sphere(R, bu.x, bu.y, b.bust || 2.3, P.top || P.main, 0);
    ovoid(R, J.hip.x + Math.cos(J.ta) * 0.2, J.hip.y + 0.5, b.hips, b.hips * 0.72, P.hipCol || P.pants, 0);
  } else tube(R, J.hip, J.neck, b.waist, b.chest, P.main, 0, tx.main);
  if (P.belt) {
    const a = TP(J, -b.waist + 0.5, 1.5), c = TP(J, b.waist - 0.5, 1.5);
    tube(R, a, c, 1.5, 1.5, P.belt, 0);
    if (P.beltKnot) {
      const kk = TP(J, b.waist - 1, 1.2), rp = ramp(P.belt);
      sphere(R, kk.x, kk.y, 1.7, rp);
      tube(R, kk, TP(J, b.waist + 0.6, -4), 1, 0.8, rp); tube(R, kk, TP(J, b.waist - 1.8, -5.5), 1, 0.7, rp);
    }
  }
}
function drawNeck(R, ch, J, P) {
  const b = ch.build, base = TP(J, 0, b.torso - 1);
  tube(R, base, lp(base, J.head, 0.6), 2.4, 2.2, P.neckCol || P.skin, -0.12);
}
function drawHeadDefault(H, P) { const C = 28; sphere(H, C, C, 6, P.skin); }

function drawWeapon(R, ch, J, P, f) {
  const el = J.elF, hd = J.hdF;
  const ang = Math.atan2(hd.y - el.y, hd.x - el.x) + ((f && f.wa) || 0) * DEG;
  WEP_R.clear();
  WEAPONS[ch.weapon](WEP_R, P, f);
  R.blitRot(WEP_R, 16, 20, hd.x, hd.y, ang);
}
const WEAPONS = {
  katana(Rw, P) {
    // рукоять с оплёткой ито, золотая цуба и хабаки
    Rw.rect(6, 18, 12, 3, c32('#1c1626'));
    for (let x = 7; x < 17; x++) { const ph = (x - 7) % 3; Rw.px(x, 18 + (ph === 0 ? 0 : ph === 1 ? 1 : 2), c32('#b9b2c8')); if (ph === 1) Rw.px(x, 19, c32('#e6e0f0')); }
    Rw.rect(5, 18, 2, 3, c32('#c9a227')); Rw.px(5, 18, c32('#fff1a8'));
    Rw.rect(17, 16, 2, 7, c32('#a07a18')); Rw.rect(17, 16, 1, 6, c32('#e3b341')); Rw.px(17, 16, c32('#fff1a8')); Rw.px(18, 22, c32('#5a400c'));
    Rw.rect(19, 18, 2, 3, c32('#e3b341')); Rw.px(19, 18, c32('#fff1a8'));
    // клинок: обух, тело, линия хамона, режущая кромка с неоновым свечением
    for (let x = 21; x < 54; x++) {
      const yo = Math.round(((x - 19) / 35) ** 2 * -2.5);
      Rw.px(x, 18 + yo, c32('#6f7c8f'));
      Rw.px(x, 19 + yo, c32(x > 26 && x < 31 ? '#ffffff' : '#dfe7f1'));
      const hw = Math.sin(x * 0.9) > 0.2;
      Rw.px(x, 20 + yo, c32(hw ? '#ffffff' : '#b5c4d6'));
      Rw.px(x, 21 + yo, c32(x % 4 === 0 ? '#9ff0ff' : '#eef6ff'));
      if (x % 6 === 2) Rw.px(x, 22 + yo, c32('#57e1ff'));
    }
    Rw.px(54, 16, c32('#dfe7f1')); Rw.px(54, 17, c32('#ffffff')); Rw.px(55, 16, c32('#ffffff')); Rw.px(54, 18, c32('#eef6ff'));
  },
  axe(Rw, P) {
    // топорище: дерево с волокнами и кожаная обмотка
    Rw.rect(2, 19, 34, 3, c32('#6a4422')); Rw.rect(2, 19, 34, 1, c32('#94643a')); Rw.rect(2, 21, 34, 1, c32('#45280f'));
    for (let x = 4; x < 34; x += 5) Rw.px(x, 20, c32('#7d522c'));
    for (let x = 8; x < 17; x++) { Rw.px(x, 19 + ((x >> 1) & 1) * 2, c32('#2e1f12')); Rw.px(x, 20, c32((x & 1) ? '#5a4030' : '#3a2a1a')); }
    Rw.rect(1, 18, 2, 5, c32('#8e979f')); Rw.px(1, 18, c32('#e6ebf0'));
    // лезвие с фаской и рунами
    Rw.poly([[27, 17], [36, 16], [38, 7], [43, 9], [44, 24], [40, 32], [35, 30], [36, 24], [27, 24]], c32('#3f4650'));
    Rw.poly([[29, 18], [35, 17.5], [38, 10], [41.5, 11], [42.5, 23.5], [39.5, 29.5], [37, 28.5], [37, 23], [29, 23]], c32('#8e98a3'));
    Rw.poly([[31, 18.5], [36, 18], [38.5, 12], [40, 13], [40.5, 22], [38.5, 26], [38, 22], [31, 22]], c32('#b4bdc7'));
    Rw.line(42, 10, 43, 24, c32('#f4f8fb')); Rw.line(43, 24, 40, 31, c32('#f4f8fb')); Rw.line(41, 10, 42, 12, c32('#ffffff'));
    Rw.rect(28, 17, 3, 7, c32('#59616b')); Rw.rect(28, 17, 3, 1, c32('#aab3bd'));
    Rw.px(29, 18, c32('#e3b341')); Rw.px(29, 22, c32('#e3b341'));
    const rn = c32('#9fd8ff');
    Rw.line(38, 14, 38, 18, rn); Rw.px(39, 15, rn); Rw.px(39, 17, rn);
    Rw.line(39, 21, 39, 25, rn); Rw.px(38, 22, rn); Rw.px(40, 23, rn);
  },
  bat(Rw, P) {
    // бита: волокна дерева, обмотка ручки, гвозди
    Rw.capsule(3, 20, 41, 19.6, 1.4, 3.9, c32('#5a361a'));
    tube(Rw, { x: 3, y: 20 }, { x: 41, y: 19.6 }, 1.4, 3.6, '#c48c52', 0, (s, v, ti) => {
      if (ti < 2) return ti;
      const g = v * 3 + Math.sin(s * 0.35) * 0.6;
      return (Math.abs(g - Math.round(g)) < 0.13 && s > 10) ? 1 : ti;
    });
    Rw.rect(2, 18, 9, 4, c32('#2a2030'));
    for (let x = 3; x < 11; x += 2) { Rw.px(x, 18, c32('#5a4a60')); Rw.px(x + 1, 21, c32('#5a4a60')); }
    Rw.disk(2, 20, 2.2, c32('#5a361a')); Rw.px(1, 19, c32('#c48c52'));
    const nh = c32('#e6ebf0'), ns = c32('#7d868f');
    for (const [x, y] of [[29, 15], [34, 24], [38, 15], [33, 15]]) { Rw.px(x, y, nh); Rw.px(x, y + (y < 20 ? -1 : 1), ns); }
  },
  staff(Rw, P) {
    Rw.rect(-2, 19, 44, 2, c32('#3b2440')); Rw.rect(-2, 19, 44, 1, c32('#5b3a64'));
    Rw.disk(42, 19.5, 3.2, c32('#2a1630')); Rw.disk(42, 19.5, 2.2, c32('#c06bff')); Rw.px(41, 18, c32('#ffffff'));
  }
};

function drawSkeleton(R, ch, J) {
  const bone = c32('#ece6d2'), dk = c32('#9c947c');
  const L = (a, b, r) => { R.capsule(a.x, a.y, b.x, b.y, r + 0.6, r + 0.6, dk); R.capsule(a.x, a.y, b.x, b.y, r, r, bone); };
  L(J.shB, J.elB, 0.8); L(J.elB, J.hdB, 0.7); L(J.hipB, J.knB, 1); L(J.knB, J.ftB, 0.9);
  L(J.hip, J.neck, 1);
  for (let i = 0; i < 4; i++) { const a = TP(J, -3, ch.build.torso - 5 - i * 3), b2 = TP(J, 4, ch.build.torso - 6 - i * 3); R.capsule(a.x, a.y, b2.x, b2.y, 0.7, 0.7, bone); }
  R.ellipse(J.hip.x, J.hip.y, 3.5, 2.2, bone);
  L(J.hipF, J.knF, 1); L(J.knF, J.ftF, 0.9);
  R.disk(J.head.x, J.head.y, 5.2, dk); R.disk(J.head.x - 0.3, J.head.y - 0.4, 4.6, bone);
  R.rect(J.head.x + 1, J.head.y + 2, 4, 3, bone);
  R.rect(J.head.x + 1, J.head.y - 1, 2, 2, c32('#1a0f10')); R.px(J.head.x + 4, J.head.y - 1, c32('#1a0f10'));
  R.px(J.head.x + 2, J.head.y + 3, c32('#1a0f10')); R.px(J.head.x + 4, J.head.y + 3, c32('#1a0f10'));
  L(J.shF, J.elF, 0.8); L(J.elF, J.hdF, 0.7);
}

// Главная функция: рисует бойца в растр (смотрит вправо)
// цвет контрового света под освещение арены
const RIM_COL = { pit: '#ff8a3a', forge: '#ffa04a', ice: '#c8f2ff', city: '#ff7ad8', station: '#8affff', metro: '#fff0a0', arcade: '#ff6ae0', dome: '#7ae8ff', graveyard: '#a8ffb8', ship: '#c0d8ff', desert: '#ffd890', throne: '#ffc070', roof: '#ffb0a0', temple: '#ffb070', beach: '#fff4c0' };
function renderFighter(R, ch, pose, f) {
  R.clear();
  const ox = SPR_OX, oy = SPR_OY, P = ch.pal;
  const J0 = solvePose(ch, pose), J = {};
  for (const k in J0) J[k] = typeof J0[k] === 'object' ? { x: J0[k].x + ox, y: J0[k].y + oy } : J0[k];
  const t = (f && f.anim) || 0, ctx = { t, pose, f };
  if (f && f.skeleton) { drawSkeleton(R, ch, J); R.outline(c32('#120a10')); R.flush(); return J; }
  const D = ch.draw || {}, m = ch.build.limb;
  if (D.back) D.back(R, J, P, ctx);
  drawLeg(R, ch, J, 'B', P, -0.3);
  drawArm(R, ch, J, 'B', P, -0.3, null);
  if (D.torso) D.torso(R, J, P, ctx); else drawTorsoDefault(R, ch, J, P);
  if (D.midBack) D.midBack(R, J, P, ctx);
  // падающие тени: передняя нога на корпус/заднюю ногу
  ao(R, J.hipF, J.knF, 3.7 * m, 3.1 * m); ao(R, J.knF, J.ftF, 3.1 * m, 2.5 * m);
  drawLeg(R, ch, J, 'F', P, 0);
  if (D.mid) D.mid(R, J, P, ctx);
  if (!ch.headless) {
    ao(R, J.head, J.head, ch.build.headR * 0.85, ch.build.headR * 0.85, 0.75, 1, 2.2);
    drawNeck(R, ch, J, P);
    const HR = R.headR || HEAD_R;
    HR.clear();
    (D.head || drawHeadDefault)(HR, P, ctx);
    R.blitRot(HR, 28, 28, J.head.x, J.head.y, J.ha);
  }
  if (D.preArm) D.preArm(R, J, P, ctx);
  // тень от передней руки на корпус
  ao(R, J.shF, J.elF, 3.1 * m, 2.6 * m, 0.7); ao(R, J.elF, J.hdF, 2.6 * m, 2.9 * m, 0.7);
  drawArm(R, ch, J, 'F', P, 0, pose);
  if (D.front) D.front(R, J, P, ctx);
  R.outline(c32(P.outline || '#140c18'));
  if (f && f.g && typeof Stage !== 'undefined' && Stage.cur) R.rim(c32(RIM_COL[Stage.cur.id] || '#ffe6b8'), 0.5);
  if (f) {
    if (f.tint) R.tint(f.tint, f.tintK == null ? 1 : f.tintK);
    if (f.flash) R.tint('flash', 0.75);
  }
  R.flush();
  return J;
}

// Детальный портрет-бюст для экрана выбора: тот же персонаж, но растр в высоком разрешении
const _bust = {};
function renderPortrait(ch, size) {
  const key = ch.id + ':' + size; if (_bust[key]) return _bust[key];
  const span = 27, sc = size / span, R = new Raster(SPR_W, SPR_H, sc);
  R.headR = new Raster(56, 56, sc);
  const pose = mkPose(stanceOf(ch), { hF: [3, 17], hB: [1, 17], torso: 2, head: -2, eF: { x: -1, y: 0.2 }, eB: { x: -1, y: 0.2 } });
  const J = renderFighter(R, ch, pose, { anim: 0, portrait: true });
  const hx = J ? J.head.x : SPR_OX + 2, hy = J ? J.head.y : SPR_OY - 62;
  const [cv, c] = mkCanvas(size, size);
  c.imageSmoothingEnabled = false;
  c.drawImage(R.cv, Math.round((hx - span * 0.45) * sc), Math.round((hy - span * 0.42) * sc), size, size, 0, 0, size, size);
  _bust[key] = cv; return cv;
}
