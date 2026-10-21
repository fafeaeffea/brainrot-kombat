'use strict';
// Пиксельный растеризатор и скелетная отрисовка бойцов
const SPR_W = 150, SPR_H = 132, SPR_OX = 75, SPR_OY = 118;

class Raster {
  constructor(w, h) {
    this.w = w; this.h = h;
    [this.cv, this.ctx] = mkCanvas(w, h);
    this.img = this.ctx.createImageData(w, h);
    this.d = new Uint32Array(this.img.data.buffer);
    this.tmp = new Uint32Array(w * h);
  }
  clear() { this.d.fill(0); }
  px(x, y, c) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.d[y * this.w + x] = c; }
  get(x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0; return this.d[y * this.w + x]; }
  disk(cx, cy, r, c) {
    if (r <= 0.3) { this.px(cx, cy, c); return; }
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
    const dx = x2 - x1, dy = y2 - y1, n = Math.max(1, Math.ceil(Math.hypot(dx, dy) * 1.4));
    for (let i = 0; i <= n; i++) { const t = i / n; this.disk(x1 + dx * t, y1 + dy * t, r1 + (r2 - r1) * t, c); }
  }
  line(x1, y1, x2, y2, c) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1))));
    for (let i = 0; i <= n; i++) { const t = i / n; this.px(Math.floor(x1 + (x2 - x1) * t), Math.floor(y1 + (y2 - y1) * t), c); }
  }
  rect(x, y, w, h, c) {
    x = Math.round(x); y = Math.round(y);
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++)
      for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++) this.d[j * this.w + i] = c;
  }
  poly(pts, c) {
    let minY = 1e9, maxY = -1e9;
    for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
    const n = pts.length;
    for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(this.h - 1, Math.ceil(maxY)); y++) {
      const sy = y + 0.5, xs = [];
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        if ((a[1] <= sy && b[1] > sy) || (b[1] <= sy && a[1] > sy)) xs.push(a[0] + (sy - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x <= Math.min(this.w - 1, Math.floor(xs[k + 1] - 0.5)); x++) this.d[y * this.w + x] = c;
    }
  }
  outline(oc) {
    const w = this.w, h = this.h, d = this.d, t = this.tmp;
    t.set(d);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (d[i] === 0 && ((x > 0 && d[i - 1]) || (x < w - 1 && d[i + 1]) || (y > 0 && d[i - w]) || (y < h - 1 && d[i + w]))) t[i] = oc;
    }
    d.set(t);
  }
  // Поворот другого растра (ближайший сосед) с опорной точкой
  blitRot(src, sx, sy, dx, dy, ang, flipY) {
    if (Math.abs(ang) < 0.14) ang = 0;
    const s = Math.sin(ang), co = Math.cos(ang), sw = src.w, sh = src.h, sd = src.d, w = this.w, d = this.d;
    const R = Math.ceil(Math.hypot(Math.max(sx, sw - sx), Math.max(sy, sh - sy)));
    for (let y = Math.max(0, Math.floor(dy - R)); y <= Math.min(this.h - 1, Math.ceil(dy + R)); y++) {
      for (let x = Math.max(0, Math.floor(dx - R)); x <= Math.min(w - 1, Math.ceil(dx + R)); x++) {
        const rx = x + 0.5 - dx, ry = y + 0.5 - dy;
        let u = rx * co + ry * s, v = -rx * s + ry * co;
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
const S = (col, k) => k ? shade(col, k) : col;
function limb(R, a, b, r1, r2, col, k = 0) {
  const base = S(col, k), dk = shade(base, -0.42), lt = shade(base, 0.32);
  R.capsule(a.x, a.y, b.x, b.y, r1, r2, c32(dk));
  R.capsule(a.x - 0.45, a.y - 0.55, b.x - 0.45, b.y - 0.55, r1 - 0.85, r2 - 0.85, c32(base));
  if (r1 > 2.2) R.capsule(a.x - r1 * 0.4, a.y - r1 * 0.45, b.x - r2 * 0.4, b.y - r2 * 0.45, r1 * 0.24, r2 * 0.24, c32(lt));
}
function ball(R, x, y, r, col, k = 0) {
  const base = S(col, k);
  R.disk(x, y, r, c32(shade(base, -0.42)));
  R.disk(x - 0.4, y - 0.5, r - 0.8, c32(base));
  if (r > 2) R.disk(x - r * 0.35, y - r * 0.4, r * 0.3, c32(shade(base, 0.35)));
}
function torsoPerp(J) { return { x: Math.cos(J.ta), y: Math.sin(J.ta) }; }   // поперёк корпуса (вперёд)
function torsoAxis(J) { return { x: Math.sin(J.ta), y: -Math.cos(J.ta) }; }   // вдоль корпуса (вверх)
// точка в системе корпуса: u — вперёд, v — вверх от бедра
function TP(J, u, v) { const a = torsoAxis(J), p = torsoPerp(J); return { x: J.hip.x + p.x * u + a.x * v, y: J.hip.y + p.y * u + a.y * v }; }

const HEAD_R = new Raster(56, 56);
const WEP_R = new Raster(96, 40);

// ---------- части тела по умолчанию ----------
function drawArm(R, ch, J, side, P, k, f) {
  const m = ch.build.limb, sh = J['sh' + side], el = J['el' + side], hd = J['hd' + side];
  limb(R, sh, el, 3.1 * m, 2.6 * m, P.sleeve || P.skin, k);
  limb(R, el, hd, 2.6 * m, 2.2 * m, P.fore || P.skin, k);
  if (P.bracer) limb(R, lp(el, hd, 0.35), lp(el, hd, 0.85), 2.8 * m, 2.6 * m, P.bracer, k);
  if (side === 'F' && ch.weapon) drawWeapon(R, ch, J, P, f);
  if (ch.fin) { // плавник вместо кулака
    const d = Math.atan2(hd.y - el.y, hd.x - el.x);
    R.poly([[hd.x + Math.cos(d - 1.3) * 2.5, hd.y + Math.sin(d - 1.3) * 2.5], [hd.x + Math.cos(d) * 5.5, hd.y + Math.sin(d) * 5.5], [hd.x + Math.cos(d + 1.3) * 2.5, hd.y + Math.sin(d + 1.3) * 2.5]], c32(S(shade(P.glove || P.skin, -0.2), k)));
    ball(R, hd.x, hd.y, 2.6 * m, P.glove || P.skin, k);
  } else ball(R, hd.x, hd.y, 2.9 * m, P.glove || P.skin, k);
}
function drawLeg(R, ch, J, side, P, k) {
  const m = ch.build.limb, hp = J['hip' + side], kn = J['kn' + side], ft = J['ft' + side];
  limb(R, hp, kn, 3.7 * m, 3.1 * m, P.pants, k);
  limb(R, kn, ft, 3.1 * m, 2.5 * m, P.pants, k);
  const sd = { x: (ft.x - kn.x), y: (ft.y - kn.y) }, l = Math.hypot(sd.x, sd.y) || 1;
  const fd = { x: sd.y / l, y: -sd.x / l };
  const toe = { x: ft.x + fd.x * 4.6 * m, y: ft.y + fd.y * 4.6 * m };
  if (P.boots) limb(R, lp(kn, ft, ch.bootTop || 0.45), ft, 3.1 * m, 2.7 * m, P.boots, k);
  limb(R, { x: ft.x - fd.x * 0.8, y: ft.y - fd.y * 0.8 }, toe, 2.5 * m, 1.9 * m, P.shoes || P.boots || P.pants, k);
  if (P.sole) R.capsule(ft.x - fd.x + sd.x / l * 1.6, ft.y - fd.y + sd.y / l * 1.6, toe.x + sd.x / l * 1.2, toe.y + sd.y / l * 1.2, 0.9, 0.9, c32(S(P.sole, k)));
  if (P.stripe) R.line(ft.x - fd.x * 0.5, ft.y - fd.y * 0.5 - 1, toe.x - fd.x * 1.5, toe.y - fd.y * 1.5 - 0.5, c32(S(P.stripe, k)));
}
function drawTorsoDefault(R, ch, J, P) {
  const b = ch.build;
  limb(R, J.hip, J.neck, b.waist, b.chest, P.main);
  if (P.belt) {
    const a = TP(J, -b.waist + 0.5, 1.5), c = TP(J, b.waist - 0.5, 1.5);
    R.capsule(a.x, a.y, c.x, c.y, 1.4, 1.4, c32(P.belt));
    if (P.beltKnot) { const kk = TP(J, b.waist - 1, 0); R.capsule(kk.x, kk.y, kk.x + 1, kk.y + 5, 1, 0.7, c32(P.belt)); }
  }
}
function drawNeck(R, ch, J, P) {
  const b = ch.build, base = TP(J, 0, b.torso - 1);
  limb(R, base, lp(base, J.head, 0.6), 2.4, 2.2, P.neckCol || P.skin);
}
function drawHeadDefault(H, P) { const C = 28; ball(H, C, C, 6, P.skin); }

function drawWeapon(R, ch, J, P, f) {
  const el = J.elF, hd = J.hdF;
  const ang = Math.atan2(hd.y - el.y, hd.x - el.x) + ((f && f.wa) || 0) * DEG;
  WEP_R.clear();
  WEAPONS[ch.weapon](WEP_R, P, f);
  R.blitRot(WEP_R, 16, 20, hd.x, hd.y, ang);
}
const WEAPONS = {
  katana(Rw, P) {
    Rw.rect(8, 19, 10, 2, c32('#2a2030')); for (let x = 9; x < 18; x += 2) Rw.px(x, 19, c32('#c9a227'));
    Rw.rect(17, 17, 2, 6, c32('#c9a227'));
    for (let x = 19; x < 52; x++) { const yo = Math.round(((x - 19) / 33) ** 2 * -2); Rw.px(x, 19 + yo, c32('#f2f7ff')); Rw.px(x, 20 + yo, c32('#9fb3c8')); if (x % 3 === 0) Rw.px(x, 21 + yo, c32('#57e1ff')); }
    Rw.px(52, 17, c32('#ffffff'));
  },
  axe(Rw, P) {
    Rw.rect(2, 19, 34, 3, c32('#6a4422')); Rw.rect(2, 19, 34, 1, c32('#8a5a30'));
    Rw.rect(5, 18, 2, 5, c32('#3a2a1a')); Rw.rect(12, 18, 2, 5, c32('#3a2a1a'));
    Rw.poly([[28, 18], [36, 16], [38, 7], [43, 9], [44, 24], [40, 32], [35, 30], [36, 23], [28, 23]], c32('#59616b'));
    Rw.poly([[30, 19], [35, 18], [38, 10], [41, 11], [42, 23], [39, 29], [37, 28], [37, 22], [30, 22]], c32('#aab3bd'));
    Rw.line(42, 10, 43, 24, c32('#eef3f8')); Rw.line(43, 24, 40, 30, c32('#eef3f8'));
  },
  bat(Rw, P) {
    Rw.capsule(4, 20, 40, 20, 1.3, 3.6, c32('#8a5a30'));
    Rw.capsule(4, 19.5, 40, 19.3, 0.8, 2.7, c32('#d9a66a'));
    Rw.capsule(10, 18.6, 38, 18, 0.3, 0.9, c32('#f0cf9a'));
    Rw.rect(3, 18, 2, 5, c32('#5a3a1e'));
  },
  staff(Rw, P) {
    Rw.rect(-2, 19, 44, 2, c32('#3b2440'));
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
function renderFighter(R, ch, pose, f) {
  R.clear();
  const ox = SPR_OX, oy = SPR_OY, P = ch.pal;
  const J0 = solvePose(ch, pose), J = {};
  for (const k in J0) J[k] = typeof J0[k] === 'object' ? { x: J0[k].x + ox, y: J0[k].y + oy } : J0[k];
  const t = (f && f.anim) || 0, ctx = { t, pose, f };
  if (f && f.skeleton) { drawSkeleton(R, ch, J); R.outline(c32('#120a10')); R.flush(); return J; }
  const D = ch.draw || {};
  if (D.back) D.back(R, J, P, ctx);
  drawLeg(R, ch, J, 'B', P, -0.3);
  drawArm(R, ch, J, 'B', P, -0.3, null);
  if (D.torso) D.torso(R, J, P, ctx); else drawTorsoDefault(R, ch, J, P);
  if (D.midBack) D.midBack(R, J, P, ctx);
  drawLeg(R, ch, J, 'F', P, 0);
  if (D.mid) D.mid(R, J, P, ctx);
  if (!ch.headless) {
    drawNeck(R, ch, J, P);
    HEAD_R.clear();
    (D.head || drawHeadDefault)(HEAD_R, P, ctx);
    R.blitRot(HEAD_R, 28, 28, J.head.x, J.head.y, J.ha);
  }
  if (D.preArm) D.preArm(R, J, P, ctx);
  drawArm(R, ch, J, 'F', P, 0, pose);
  if (D.front) D.front(R, J, P, ctx);
  R.outline(c32(P.outline || '#140c18'));
  if (f) {
    if (f.tint) R.tint(f.tint, f.tintK == null ? 1 : f.tintK);
    if (f.flash) R.tint('flash', 0.75);
  }
  R.flush();
  return J;
}
