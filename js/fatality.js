'use strict';
// Фаталити в мультяшном стиле: победитель сам подбегает, устраивает «драку в облаке пыли»,
// хватает соперника за шкирку и добивает его своими руками.
function bolt(ctx, x1, y1, x2, y2, col, segs = 8, jit = 8, th = 1) {
  ctx.fillStyle = col; let px = x1, py = y1;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs, nx = lerp(x1, x2, t) + (i < segs ? rand(-jit, jit) : 0), ny = lerp(y1, y2, t) + (i < segs ? rand(-jit * 0.4, jit * 0.4) : 0);
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(nx - px), Math.abs(ny - py))));
    for (let k = 0; k <= n; k++) ctx.fillRect(Math.round(lerp(px, nx, k / n)), Math.round(lerp(py, ny, k / n)), th, th);
    px = nx; py = ny;
  }
}
// снимок спрайта в полном (тонком) разрешении: SPR_W*RS × SPR_H*RS; рисовать с явным размером SPR_W×SPR_H
function snapCanvas(f) { const [cv, c] = mkCanvas(f.R.w, f.R.h); c.drawImage(f.R.cv, 0, 0); return cv; }

// ---------- общие помощники ----------
const FZ = { z: 1.4 };                      // текущий зум камеры фаталити (читается через getter zoom)
const INTRO = 100;                          // длина общего вступления (разбег + облако драки + хватка)
const sxOf = sy => sy === 1 ? 1 : 2 - sy * 0.6 - 0.4;   // как Fighter.draw растягивает по X при scaleY
const objPose = p => p && typeof p === 'object' ? p : {};
// мировая точка сустава бойца для позы pose
function jw(f, pose, key) {
  const J = solvePose(f.ch, pose), p = J[key], sy = f.scaleY || 1, fc = f.facing * (f.visFlip ? -1 : 1);
  return { x: f.x + fc * p.x * sxOf(sy), y: f.y + (f.offY || 0) + p.y * sy };
}
// ставим бойца так, чтобы сустав key его позы оказался в мировой точке P
function pin(f, pose, key, P) {
  f.forcePose = pose;
  const J = solvePose(f.ch, pose), q = J[key], sy = f.scaleY || 1, fc = f.facing * (f.visFlip ? -1 : 1);
  f.x = P.x - fc * q.x * sxOf(sy); f.y = P.y - (f.offY || 0) - q.y * sy;
}
// подправить позу так, чтобы кисть side ('F'/'B') тянулась к мировой точке P
function reach(a, pose, side, P) {
  const J = solvePose(a.ch, pose), sh = J['sh' + side];
  pose['h' + side] = [(P.x - a.x) * a.facing - sh.x, (P.y - a.y - (a.offY || 0)) - sh.y];
  return pose;
}
// угол оружия в «правосторонней» системе (0 — вперёд, + — вниз)
function blade(a, pose, deg) {
  const J = solvePose(a.ch, pose), fa = Math.atan2(J.hdF.y - J.elF.y, J.hdF.x - J.elF.x) / DEG;
  pose.wa = deg - fa; return pose;
}
function headOf(f, pose) {
  const J = solvePose(f.ch, pose || f.pose), fc = f.facing * (f.visFlip ? -1 : 1), sy = f.scaleY || 1;
  const p = f.ch.headless ? { x: J.neck.x + 2, y: J.neck.y + 6 } : J.head;
  return { x: f.x + fc * p.x * sxOf(sy), y: f.y + (f.offY || 0) + p.y * sy };
}
function drawF(ctx, cx, f) { const h = f.hidden; f.hidden = false; f.draw(ctx, cx); f.hidden = h; }
// падение под действием тяжести; true — коснулся пола
function drop(f, s, g = 0.45) { s.fvy = (s.fvy || 0) + g; f.y += s.fvy; if (f.y >= GROUND) { f.y = GROUND; s.fvy = 0; return true; } return false; }
// «запекаем» нарисованное в декали пола, чтобы останки пережили экран победы
function bake(draw) {
  const y0 = GROUND - 110, h = 124, [cv, c] = mkCanvas(STAGE_W, h);
  c.translate(0, -y0); draw(c);
  const d = c.getImageData(0, 0, STAGE_W, h).data;
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < STAGE_W) {
      const i = (y * STAGE_W + x) * 4;
      if (d[i + 3] < 140) { x++; continue; }
      const col = rgb2hex(d[i], d[i + 1], d[i + 2]); let x2 = x + 1;
      while (x2 < STAGE_W) { const j = (y * STAGE_W + x2) * 4; if (d[j + 3] < 140 || d[j] !== d[i] || d[j + 1] !== d[i + 1] || d[j + 2] !== d[i + 2]) break; x2++; }
      FX.decals.push({ x, y: y + y0, col, sz: x2 - x - 1 }); x = x2;
    }
  }
}
function bakeF(f) { bake(c => drawF(c, 0, f)); f.hidden = true; }
// пиксельная «конечность» с контуром (кулаки/ноги из облака драки)
function plimb(ctx, x1, y1, x2, y2, r, col) {
  const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1)));
  for (let i = 0; i <= n; i++) pdisk(ctx, lerp(x1, x2, i / n), lerp(y1, y2, i / n), r + 1, '#140c18');
  for (let i = 0; i <= n; i++) pdisk(ctx, lerp(x1, x2, i / n), lerp(y1, y2, i / n), r, col);
}
function star(ctx, x, y, r, col, core = '#ffffff') {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = '#140c18'; ctx.fillRect(x - r - 1, y - 1, 2 * r + 3, 3); ctx.fillRect(x - 1, y - r - 1, 3, 2 * r + 3);
  ctx.fillStyle = col; ctx.fillRect(x - r, y, 2 * r + 1, 1); ctx.fillRect(x, y - r, 1, 2 * r + 1);
  if (r >= 2) { ctx.fillRect(x - 1, y - 1, 3, 3); ctx.fillStyle = core; ctx.fillRect(x, y, 1, 1); }
}
// ---------- комиксные надписи со «взрывом» позади ----------
const POP_STYLES = [
  { t: ['#ffffff', '#ffe14a', '#ff6a1a'], b: '#d0103a' },
  { t: ['#ffffff', '#fff3a0', '#ffb030'], b: '#2a5adf' },
  { t: ['#fff6b0', '#ff3a3a', '#7a0010'], b: '#ffe14a' },
  { t: ['#ffffff', '#9ff0ff', '#2a8aff'], b: '#ff4ab0' },
  { t: ['#ffffff', '#d0ff8a', '#2aa040'], b: '#7a2adf' },
  { t: ['#ffffff', '#ffc2f0', '#e0206a'], b: '#1aa0c0' },
];
function pop(s, x, y, str, o = {}) {
  const st = o.style != null ? POP_STYLES[o.style % POP_STYLES.length] : choice(POP_STYLES);
  s.pops.push({ x, y, str, t: 0, life: Math.round((o.life || 40) * 0.85), sz: Math.max(1, Math.round((o.sz || 3) * 0.7)), tc: o.col || st.t, bc: o.burst === false ? null : (o.bcol || st.b), rot: o.rot != null ? o.rot : rand(-0.2, 0.2), vy: o.vy != null ? o.vy : -0.25, cv: null });
}
function popCanvas(p) {
  const sp = textSprite(p.str, p.sz, p.tc, '#140c18', '#140c18');
  if (!p.bc) return sp;
  const w = sp.width + 8 + p.sz * 7, h = sp.height + 8 + p.sz * 6, R = new Raster(w, h, 1), cx = w / 2, cy = h / 2, N = 14, pts = [], inner = [];
  for (let i = 0; i < N * 2; i++) {
    const an = i / (N * 2) * Math.PI * 2, k = i % 2 === 0 ? rand(0.92, 1.05) : 0.7;
    pts.push([cx + Math.cos(an) * (w / 2 - 2) * k, cy + Math.sin(an) * (h / 2 - 2) * k]);
    inner.push([cx + Math.cos(an) * (w / 2 - 2) * k * 0.82, cy + Math.sin(an) * (h / 2 - 2) * k * 0.82]);
  }
  R.poly(pts, c32(p.bc)); R.poly(inner, c32(shade(p.bc, 0.28)));
  R.outline(c32('#140c18')); R.flush();
  R.ctx.drawImage(sp, Math.round(cx - sp.width / 2), Math.round(cy - sp.height / 2));
  return R.cv;
}
function updPops(s) { for (const p of s.pops) { p.t++; p.y += p.vy; } s.pops = s.pops.filter(p => p.t < p.life); }
function drawPops(ctx, cx, s) {
  for (const p of s.pops) {
    if (!p.cv) p.cv = popCanvas(p);
    const t = p.t, sc = t < 3 ? 0.4 + t * 0.35 : t < 7 ? 1.45 - (t - 3) * 0.1 : 1, jx = t < 8 ? rand(-1, 1) : 0;
    ctx.globalAlpha = clamp((p.life - t) / 8, 0, 1);
    ctx.save(); ctx.translate(Math.round(p.x - cx + jx), Math.round(p.y)); ctx.rotate(p.rot); ctx.scale(sc, sc);
    ctx.drawImage(p.cv, -Math.round(p.cv.width / 2), -Math.round(p.cv.height / 2)); ctx.restore();
  }
  ctx.globalAlpha = 1;
}
// ---------- позы ----------
// хватка за шкирку: front-рукой, или back-рукой у бойцов с оружием
function holdPose(a, s, o) {
  const grip = s.hand === 'B' ? { hB: [18, -13], eB: { x: 0.3, y: 1 } } : { hF: [17, -14], eF: { x: 0.3, y: 1 }, wa: 0 };
  return mkPose(stanceOf(a.ch), { torso: 4, head: -6, fF: [9, 0], fB: [-9, 0] }, grip, o || {});
}
// болтается в руке: ноги висят, голова набок
function dangle(t, k = 1, o) {
  const s1 = Math.sin(t * 0.13), s2 = Math.sin(t * 0.21);
  return mkPose({ hx: 0, hy: 1, torso: 8 + s1 * 4 * k, head: 22 + s2 * 10 * k, hF: [2 + s1 * 3 * k, 15], hB: [-2 - s1 * 2 * k, 16], eF: { x: -0.3, y: 1 }, eB: { x: -0.3, y: 1 }, fF: [3 + s2 * 3 * k, 1], fB: [-2 - s2 * 3 * k, 2], rot: s1 * 5 * k }, o || {});
}
const STIFF = { hx: 0, hy: 0, torso: 0, head: 0, hF: [2, 15], hB: [-1, 16], fF: [3, 0], fB: [-3, 0], eF: { x: -0.2, y: 1 }, eB: { x: -0.2, y: 1 } };
// держим: поза победителя + жертва подвешена суставом key к его кисти
function hold(a, v, s, apose, vpose, key = 'neck', dx = s.hand === 'B' ? 7 : 3, dy = 0) {
  a.forcePose = apose;
  const h = jw(a, apose, 'hd' + s.hand);
  pin(v, vpose, key, { x: h.x + dx * a.facing, y: h.y + dy });
}
// мигающие глазки на обугленной жертве
function drawEyes(ctx, cx, f, t, x, y) {
  const h = x != null ? { x, y } : headOf(f), fc = f.facing, shut = t % 46 < 5;
  for (const k of [0, 4]) {
    const X = Math.round(h.x - cx + fc * (k - 1) - (fc < 0 ? 2 : 0)), Y = Math.round(h.y - 2);
    if (shut) { ctx.fillStyle = '#9a9090'; ctx.fillRect(X, Y + 1, 3, 1); continue; }
    ctx.fillStyle = '#ffffff'; ctx.fillRect(X, Y, 3, 3); ctx.fillStyle = '#000000'; ctx.fillRect(X + (fc > 0 ? 2 : 0), Y + 1, 1, 1);
  }
}

// ---------- общее вступление: разбег → облако драки → хватка за шкирку ----------
const CLOUD_WORDS = ['БАМ!', 'ХРЯСЬ!', 'ПОУ!', 'БАЦ!', 'ТРАХ!', 'ШМЯК!'];
function intro(g, a, v, t, s) {
  const d = s.dir;
  v.facing = -d;
  if (t === 1) { s.x0 = a.x; Sound.play('jump'); }
  if (t <= 16) {   // замах: присел, отклонился, ноги «колесом»
    const k = ease(t / 16), run = t > 5, ph = (t >> 1) & 1;
    a.forcePose = mkPose(stanceOf(a.ch), { torso: -26 * k, head: 16 * k, hy: 7 * k, hF: [-8, -4], hB: [-10, -1], eF: { x: -1, y: 0.4 }, wa: -60, fF: run ? (ph ? [13, -8] : [-5, -2]) : [8, 0], fB: run ? (ph ? [-7, -1] : [11, -9]) : [-9, 0] });
    a.scaleY = 1 - 0.18 * k; a.x = s.x0 - d * 8 * k;
    if (run && t % 2 === 0) { FX.dust(a.x - d * 8, GROUND, 2); Sound.play('move'); }
    if (t === 6) pop(s, a.x - d * 4, a.y - 90, '!', { sz: 3, life: 14, burst: false, col: ['#ffffff', '#ffe14a', '#ff6a1a'] });
  }
  if (t === 17) { s.x1 = a.x; s.x2 = v.x - d * 12; Sound.play('dash'); Sound.play('whooshH'); pop(s, lerp(a.x, v.x, 0.35), a.y - 84, 'ВЖУХ!', { sz: 3, style: 3 }); FX.dust(a.x, GROUND, 16); }
  if (t >= 17 && t <= 24) {
    const k = (t - 16) / 8;
    a.x = lerp(s.x1, s.x2, k); a.forcePose = mkPose(POSES.rush); a.scaleY = 0.84;
    g.ghostTrail(a); FX.dust(a.x - d * 10, GROUND, 2);
    v.forcePose = mkPose(POSES.hit, { head: -34, hF: [6, -20], hB: [-6, -18] });
    if (t === 20) pop(s, v.x + d * 8, v.y - 86, '?!', { sz: 2, life: 16, burst: false, col: ['#ffffff', '#fff3a0'] });
  }
  if (t === 25) {
    s.cl = { x: (a.x + v.x) / 2, y: GROUND - 34, t: 0, limbs: [], stars: [], fade: 0 };
    a.hidden = v.hidden = true; a.scaleY = 1; g.shake(7); Sound.play('heavy'); FX.dust(s.cl.x, GROUND, 26);
  }
  const c = s.cl;
  if (c) {
    c.t++;
    if (t < 89) {
      if (t % 2 === 0) c.limbs.push({ ang: rand(0, Math.PI * 2), t: 0, life: randi(4, 7), foot: Math.random() < 0.38, who: Math.random() < 0.55 ? a : v });
      if (t % 3 === 0) c.stars.push({ ang: rand(0, 6.283), r: rand(26, 38), t: 0, life: randi(6, 11) });
      if (t % 5 === 0) { Sound.play(choice(['punch', 'kick', 'hit', 'heavy'])); g.shake(3); FX.dust(c.x + rand(-30, 30), GROUND, 3); }
      if (t % 9 === 0) FX.p('px', c.x + rand(-10, 10), c.y - 10, rand(-2.5, 2.5), rand(-4, -2), 70, '#ffffff', 2, 0.25, { floor: true });  // выбитый зуб
      const wi = [30, 40, 50, 59, 68, 77].indexOf(t);
      if (wi >= 0) pop(s, c.x + (wi % 2 ? 1 : -1) * rand(22, 46), c.y - rand(14, 46), CLOUD_WORDS[wi], { sz: 3, style: wi });
      if (t === 85) { pop(s, c.x, c.y - 30, 'БУМ!', { sz: 5, style: 0, life: 36 }); g.impact(); Sound.play('explode'); g.shake(6); }
    }
    for (const L of c.limbs) L.t++; c.limbs = c.limbs.filter(L => L.t < L.life);
    for (const S of c.stars) S.t++; c.stars = c.stars.filter(S => S.t < S.life);
    if (t >= 89) c.fade = (t - 88) / 12;
    if (t >= 100) s.cl = null;
  }
  if (t === 89) {
    a.hidden = v.hidden = false; a.x = c.x - d * 14; s.stars = true; v.flash = 3;
    FX.smoke(c.x, c.y, 26, '#d8d0c0'); Sound.play('whoosh'); Sound.play('grab');
  }
  if (t >= 89) hold(a, v, s, holdPose(a, s), dangle(t));
  if (t === 93) { const h = headOf(v, v.forcePose); pop(s, h.x + d * 12, h.y - 18, '#%*!', { sz: 2, life: 30, style: 2 }); }
}
function drawIntro(ctx, cx, g, a, v, t, s) {
  const d = s.dir;
  if (t > 5 && t <= 16) {  // ноги-колесо
    const X = a.x - cx, Y = GROUND - 9;
    for (let k = 0; k < 3; k++) {
      const a0 = t * 0.9 + k * 2.1;
      for (let an = a0; an < a0 + 2.4; an += 0.1) { ctx.fillStyle = k === 1 ? '#6a6070' : '#e8e0d0'; ctx.fillRect(Math.round(X + Math.cos(an) * 13), Math.round(Y + Math.sin(an) * 9), 1, 1); }
    }
  }
  if (t >= 17 && t <= 30) {  // линии скорости
    const k = t <= 24 ? 1 : 1 - (t - 24) / 6;
    ctx.globalAlpha = 0.85 * k;
    for (let i = 0; i < 14; i++) {
      const y = Math.round(GROUND - rand(4, 74)), len = Math.round(rand(16, 60)), x0 = Math.round((t <= 24 ? a.x : s.x2) - cx - d * rand(10, 24));
      ctx.fillStyle = i % 3 ? '#ffffff' : '#ffe8a0'; ctx.fillRect(d > 0 ? x0 - len : x0, y, len, 1);
    }
    ctx.globalAlpha = 1;
  }
  const c = s.cl; if (!c) return;
  const X = c.x - cx + Math.sin(c.t * 0.9) * 2, Y = c.y + Math.sin(c.t * 1.3) * 1.5, f = c.fade, R = 26 * (1 + f * 0.7);
  if (!f) for (const L of c.limbs) {  // кулаки и ноги торчат из облака
    const k = Math.sin(L.t / L.life * Math.PI), P = L.who.ch.pal, ca = Math.cos(L.ang), sa = Math.sin(L.ang);
    const ex = X + ca * (R * 1.2 + 16 * k), ey = Y + sa * (R * 0.75 + 12 * k);
    plimb(ctx, X + ca * 10, Y + sa * 6, ex, ey, L.foot ? 2.6 : 2.2, L.foot ? P.pants : (P.sleeve || P.main || P.skin));
    if (L.foot) { pdisk(ctx, ex + ca * 2, ey + sa * 2, 4.2, '#140c18'); pdisk(ctx, ex + ca * 2, ey + sa * 2, 3.2, P.shoes || P.boots || P.pants); }
    else { pdisk(ctx, ex, ey, 4.4, '#140c18'); pdisk(ctx, ex, ey, 3.4, P.glove || P.skin); ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(ex - 1), Math.round(ey - 2), 1, 1); }
  }
  ctx.globalAlpha = 1 - f;
  const pts = [];
  for (let i = 0; i < 11; i++) { const an = i / 11 * 6.283 + c.t * 0.22, rr = R * (0.72 + 0.22 * Math.sin(c.t * 0.6 + i * 2.3)); pts.push([X + Math.cos(an) * rr * 1.25, Y + Math.sin(an) * rr * 0.8, 10 + 3 * Math.sin(c.t * 0.9 + i * 1.3) + f * 6]); }
  pts.push([X, Y, 18 + f * 8]);
  for (const p of pts) pdisk(ctx, p[0], p[1], p[2] + 1.5, '#3a3036');
  for (const p of pts) pdisk(ctx, p[0], p[1], p[2], '#d9cfbe');
  for (const p of pts) pdisk(ctx, p[0] - 2, p[1] - 2, p[2] * 0.6, '#f6f0e4');
  ctx.fillStyle = '#9a8e7c';
  for (let k = 0; k < 3; k++) { const a0 = -c.t * 0.35 + k * 2.1; for (let an = a0; an < a0 + 1.6; an += 0.08) ctx.fillRect(Math.round(X + Math.cos(an) * (8 + k * 6)), Math.round(Y + Math.sin(an) * (5 + k * 4)), 1, 1); }
  ctx.globalAlpha = 1;
  if (!f) for (const S of c.stars) star(ctx, X + Math.cos(S.ang) * S.r * 1.3, Y + Math.sin(S.ang) * S.r * 0.8 - S.t, S.t < 3 ? 3 : 2, choice(['#ffe14a', '#ffffff', '#ff9a1a']));
}
// звёздочки вокруг головы оглушённой жертвы
function drawDizzy(ctx, cx, v, t) {
  const h = headOf(v);
  for (let i = 0; i < 3; i++) { const an = t * 0.16 + i * 2.094; star(ctx, h.x - cx + Math.cos(an) * 11, h.y - 11 + Math.sin(an) * 3, 2, i === 1 ? '#7ff0ff' : '#ffe14a'); }
}

// Обёртка: каждое фаталити = общее вступление + своё добивание
function mkFat(def) {
  return {
    dur: INTRO + def.dur,
    get zoom() { return FZ.z; },
    update(g, a, v, t, s) {
      if (t === 1) { s.pops = []; s.dir = Math.sign(v.x - a.x) || 1; s.hand = def.hand || (a.ch.weapon ? 'B' : 'F'); FZ.z = 1.46; }
      if (!s.pops) return;
      if (t <= INTRO) intro(g, a, v, t, s);
      else {
        const u = t - INTRO;
        if (u === 1) s.z = def.zoom || 1.4;
        def.update.call(def, g, a, v, u, s);
        if (u >= def.dur - 30) {   // финальная поза победителя, пока висит «ФАТАЛИТИ»
          if (u === def.dur - 30) { a.scaleY = 1; a.visFlip = false; a.offY = 0; a.tint = null; a.hidden = false; a.alpha = 1; a.facing = s.dir; }
          a.y = lerp(a.y, GROUND, 0.3); a.forcePose = ANIM.victory(a.ch, u - (def.dur - 30));
        }
        FZ.z = s.z;
      }
      updPops(s);
    },
    back(ctx, cx, g, a, v, t, s) { if (s.pops && t > INTRO && def.back) def.back.call(def, ctx, cx, g, a, v, t - INTRO, s); },
    front(ctx, cx, g, a, v, t, s) {
      if (!s.pops) return;
      if (t <= INTRO) drawIntro(ctx, cx, g, a, v, t, s);
      else if (def.front) def.front.call(def, ctx, cx, g, a, v, t - INTRO, s);
      if (s.stars && !v.hidden) drawDizzy(ctx, cx, v, t);
      drawPops(ctx, cx, s);
    }
  };
}

// ---------- рисованные предметы ----------
function drawBlaster(ctx, x, y, fc, glow) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(fc, 1);
  ctx.fillStyle = '#140c18'; ctx.fillRect(-4, -4, 19, 7); ctx.fillRect(-2, 2, 5, 6);
  ctx.fillStyle = '#3b3f45'; ctx.fillRect(-3, -3, 12, 5); ctx.fillRect(-1, 2, 3, 5);
  ctx.fillStyle = '#8e979f'; ctx.fillRect(-3, -3, 12, 1);
  ctx.fillStyle = '#2b2f35'; ctx.fillRect(9, -2, 5, 3);
  ctx.fillStyle = glow ? '#ffffff' : '#7dff6a'; ctx.fillRect(14, -2, 2, 3); ctx.fillStyle = '#7dff6a'; ctx.fillRect(2, -1, 4, 1);
  ctx.restore();
}
function drawBomb(ctx, x, y, t, fc = 1, fuse = 1) {
  x = Math.round(x); y = Math.round(y);
  pdisk(ctx, x, y, 5.5, '#140c18'); pdisk(ctx, x, y, 4.5, '#24242c'); pdisk(ctx, x - 1.5, y - 1.5, 1.8, '#5a5a6a'); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 2, y - 3, 1, 1);
  ctx.fillStyle = '#8a8a8a'; ctx.fillRect(x - 1, y - 6, 3, 2);
  const fl = Math.round(5 * fuse);
  ctx.fillStyle = '#c8a060'; for (let i = 0; i < fl; i++) ctx.fillRect(x + fc * Math.round(i * 0.6), y - 7 - i, 1, 1);
  star(ctx, x + fc * Math.round(fl * 0.6), y - 7 - fl, (t >> 1) & 1 ? 2 : 1, (t >> 1) & 1 ? '#fff6a0' : '#ff8a1a');
}
function drawBone(ctx, x, y, ang) {
  const c = Math.cos(ang) * 5, s = Math.sin(ang) * 5;
  for (const [col, r] of [['#140c18', 1.8], ['#ece6d2', 1]]) {
    for (let i = -5; i <= 5; i++) pdisk(ctx, x + c * i / 5, y + s * i / 5, r * 0.8, col);
    for (const e of [-1, 1]) { pdisk(ctx, x + c * e - s * 0.3, y + s * e + c * 0.3, r + 0.6, col); pdisk(ctx, x + c * e + s * 0.3, y + s * e - c * 0.3, r + 0.6, col); }
  }
}
// огромная акулья пасть (растр, потом масштаб)
const JAW_R = new Raster(80, 80);
function renderJaw(open) {
  const R = JAW_R, hx = 22, hy = 40, A = open * 44 * DEG; R.clear();
  const rot = (pts, an) => pts.map(([x, y]) => [hx + x * Math.cos(an) - y * Math.sin(an), hy + x * Math.sin(an) + y * Math.cos(an)]);
  const up = -A, lo = A, main = '#6d8fae';
  R.ellipse(hx - 4, hy, 16, 14, c32(shade(main, -0.1)));
  R.poly([[hx - 2, hy]].concat(rot([[52, -1]], up), rot([[50, 1]], lo)), c32('#5a1020'));
  R.ellipse(hx + 8, hy, 6, 2 + open * 10, c32('#2a0810'));
  R.poly(rot([[4, 2], [30, 4], [22, 9], [6, 7]], lo), c32('#d0506a'));
  R.poly(rot([[0, 0], [50, 1], [44, 8], [24, 13], [2, 10], [-10, 6]], lo), c32('#eef2f4'));
  R.poly(rot([[0, 0], [54, -1], [47, -9], [30, -17], [8, -17], [-12, -10]], up), c32(main));
  R.poly(rot([[4, -14], [30, -15], [44, -9], [28, -12]], up), c32('#9ab8d4'));
  for (let x = 8; x <= 46; x += 5) {
    R.poly(rot([[x, 0], [x + 4, 0], [x + 2, 5]], up), c32('#ffffff'));
    if (x < 44) R.poly(rot([[x + 1, 0], [x + 5, 0], [x + 3, -5]], lo), c32('#ffffff'));
  }
  const e = rot([[20, -11]], up)[0]; R.disk(e[0], e[1], 2.6, c32('#0c0c14')); R.px(e[0] - 1, e[1] - 1, c32('#ffffff'));
  for (let i = 0; i < 3; i++) { const p = rot([[4 - i * 3, -12], [4 - i * 3, -5]], up); R.line(p[0][0], p[0][1], p[1][0], p[1][1], c32(shade(main, -0.45))); }
  R.outline(c32('#140c18')); R.flush();
  return { hx, hy };
}
// пиксельный ледяной блок
function drawIceBlock(ctx, x, y, w, h, rot, t) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(rot);
  const X = -Math.round(w / 2), Y = -Math.round(h / 2);
  ctx.globalAlpha = 0.5; ctx.fillStyle = '#9fe6ff'; ctx.fillRect(X, Y, w, h);
  ctx.globalAlpha = 1; ctx.fillStyle = '#e8fbff'; ctx.fillRect(X, Y, w, 1); ctx.fillRect(X, Y, 1, h);
  ctx.fillStyle = '#3a8ad8'; ctx.fillRect(X, Y + h - 1, w, 1); ctx.fillRect(X + w - 1, Y, 1, h);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 6; i++) ctx.fillRect(X + 3 + i, Y + 4 + i * 2, 1, 2);
  ctx.fillRect(X + w - 6, Y + 6, 1, 6); ctx.fillRect(X + 4, Y + h - 10, 4, 1);
  if ((t >> 3) % 4 === 0) star(ctx, X + w - 5, Y + 4, 2, '#ffffff', '#ffffff');
  ctx.restore();
}

// ================= ДОБИВАНИЯ (u — время от конца вступления) =================
const FIN = {
  // Кайро: дышит огнём на жертву в руке → уголёк с глазками → кучка пепла
  burn: {
    dur: 175,
    update(g, a, v, u, s) {
      const d = s.dir;
      if (u <= 20) {
        const k = ease(u / 20);
        hold(a, v, s, holdPose(a, s, { torso: -14 * k, head: -24 * k }), dangle(u + 100));
        a.scaleY = 1 - 0.1 * k;
        if (u === 3) { Sound.play('whooshH'); pop(s, a.x - d * 10, a.y - 92, 'ВДОХ...', { sz: 2, burst: false, col: ['#ffffff', '#ffd0a0'] }); }
      } else if (u <= 72) {
        const ap = holdPose(a, s, { torso: 16, head: 4 }); a.scaleY = u < 26 ? 1.12 : 1;
        const sh = Math.sin(u * 1.7);
        hold(a, v, s, ap, mkPose(dangle(u + 100, 0.3), { hF: [6 + sh * 4, -22], hB: [-6 - sh * 4, -20], head: -10 + sh * 10, fF: [8 + sh * 5, -4], fB: [-8 - sh * 5, -2], rot: sh * 4 }));
        const m = jw(a, ap, 'head'); m.x += d * 6; m.y += 2;
        for (let i = 0; i < 7; i++) FX.p('fire', m.x + d * rand(0, 4), m.y + rand(-2, 2), d * rand(2.5, 5), rand(-0.7, 0.7), randi(9, 16), null, randi(1, 3), -0.02, { drag: 0.95 });
        for (let i = 0; i < 3; i++) FX.fire(v.x + rand(-10, 10), v.y - rand(4, 64), 1, 2, 1.4);
        if (u % 10 === 1) Sound.play('fire'); g.shake(1.5);
        v.tint = 'char'; v.tintK = clamp((u - 22) / 40, 0, 1);
        if (u === 24) pop(s, m.x + d * 30, m.y - 26, 'ПЫХ!', { sz: 4, style: 0 });
        if (u === 46) pop(s, v.x + d * 18, v.y - 80, 'ФРРРХ!', { sz: 3, style: 2 });
        if (u === 60) pop(s, v.x - d * 4, v.y - 92, 'АЙ-АЙ!', { sz: 2, style: 4 });
      } else if (u <= 104) {
        hold(a, v, s, holdPose(a, s, { head: -10 }), mkPose(STIFF, { rot: Math.sin(u * 0.2) * 2 }));
        a.scaleY = 1; v.tint = 'char'; v.tintK = 1; s.eyes = true; s.stars = false;
        if (u % 4 === 0) FX.smoke(v.x + rand(-6, 6), v.y - rand(30, 70), 1, '#4a4448');
        if (u === 92) { const h = headOf(v); pop(s, h.x + d * 14, h.y - 10, 'МОРГ', { sz: 1, life: 24, burst: false, col: '#ffffff' }); }
      } else if (u <= 140) {
        if (u === 105) Sound.play('throw');
        a.forcePose = blendPose(holdPose(a, s), stanceOf(a.ch), ease((u - 105) / 8));
        if (v.y < GROUND && drop(v, s)) { FX.dust(v.x, GROUND, 8); Sound.play('land'); }
        v.forcePose = STIFF;
        if (u % 5 === 0) FX.smoke(v.x + rand(-6, 6), v.y - rand(30, 70), 1, '#4a4448');
        if (u >= 116 && u < 128) { const p = reach(a, mkPose(stanceOf(a.ch), { torso: 12 }), 'F', { x: v.x - d * 4, y: v.y - 40 }); p.wa = 0; a.forcePose = p; }
        if (u === 120) { pop(s, v.x - d * 6, v.y - 52, 'ТЫК', { sz: 2, style: 1, life: 26 }); Sound.play('block'); }
        if (u === 128) {
          s.eyePos = headOf(v); s.eyePos.y = GROUND - 6; s.eyes = false;
          FX.burst(v, { power: 0.35, spread: 0.7, vyMin: -1, vyMax: 0.3, g: 0.2, tint: '#2a2224', tintK: 0.65 });
          v.hidden = true; FX.smoke(v.x, GROUND - 10, 24, '#3a3438'); Sound.play('crunch'); Sound.play('land'); g.impact();
          pop(s, v.x, GROUND - 60, 'ХРУСТЬ!', { sz: 4, style: 2 }); s.pile = 0;
        }
      }
      if (s.pile != null && s.pile < 1) s.pile = Math.min(1, s.pile + 0.06);
      if (u === 140) { bake(c => this.pile(c, 0, v.x, 1)); s.pile = null; }
    },
    pile(ctx, cx, x, k) {
      const X = Math.round(x - cx), h = Math.round(9 * k);
      for (let y = 0; y < h; y++) { const w = Math.round(16 * Math.sqrt(1 - y / Math.max(1, h))); ctx.fillStyle = y === h - 1 ? '#5a5258' : (y + X) % 3 ? '#2a2224' : '#3e3438'; ctx.fillRect(X - w, GROUND + 1 - y, w * 2, 1); }
    },
    front(ctx, cx, g, a, v, u, s) {
      if (s.pile != null) this.pile(ctx, cx, v.x, s.pile);
      if (s.eyes && !v.hidden) drawEyes(ctx, cx, v, u);
      if (s.eyePos) drawEyes(ctx, cx, v, u, s.eyePos.x, s.eyePos.y);
    }
  },
  // Юки: дует морозом в лицо → ледяная глыба → подбрасывает и разбивает пинком
  shatter: {
    dur: 165,
    update(g, a, v, u, s) {
      const d = s.dir;
      if (u <= 50) {
        const k = ease(Math.min(1, u / 10));
        const ap = holdPose(a, s, { torso: 4 + 14 * k, head: -6 + 10 * k });
        if (u < 46) hold(a, v, s, ap, mkPose(dangle(u + 100, 1 - clamp((u - 12) / 30, 0, 1)), { hx: Math.sin(u * 2.2) * 0.8 }));
        if (u >= 12 && u < 44) {
          const m = jw(a, ap, 'head'); m.x += d * 6; m.y += 3;
          for (let i = 0; i < 4; i++) FX.p('px', m.x, m.y + rand(-1, 1), d * rand(1.6, 3.4), rand(-0.6, 0.6), 14, choice(['#ffffff', '#cfefff', '#7fdcff']), 1, 0, { floor: false });
          if (u % 9 === 3) Sound.play('ice');
          v.tint = 'ice'; v.tintK = clamp((u - 12) / 30, 0, 0.9);
        }
        if (u === 14) pop(s, a.x - d * 8, a.y - 94, 'ФУУУХ!', { sz: 3, style: 3 });
        if (u === 46) {
          s.fp = Object.assign({}, objPose(v.forcePose)); v.tint = 'ice'; v.tintK = 1; s.block = true; s.stars = false; Sound.play('freeze');
          for (let i = 0; i < 30; i++) FX.p('px', v.x + rand(-14, 14), v.y - rand(0, 66), rand(-0.5, 0.5), rand(-0.5, 0.5), 40, '#dff6ff', 1, 0, { floor: false });
          pop(s, v.x + d * 22, v.y - 76, 'БРРР!', { sz: 3, style: 3 });
        }
        if (u >= 46) hold(a, v, s, ap, s.fp);
      } else if (!s.kicked) {
        if (u === 51) { s.vy = -6.6; s.rot = 0; s.tx = a.x + d * 30; Sound.play('throw'); pop(s, a.x - d * 4, a.y - 90, 'ОП!', { sz: 3, style: 1 }); }
        s.vy += 0.3; v.y += s.vy; v.x = lerp(v.x, s.tx, 0.08); s.rot += 0.14 * d;
        v.forcePose = mkPose(s.fp, { rot: s.rot / DEG });
        const ctr = this.center(v);
        a.forcePose = u < 62 ? mkPose(stanceOf(a.ch), { hF: [4, -26], hB: [1, -25], eF: { x: 1, y: 0 }, torso: -8, head: -18 }) : s.vy > 2.2 ? mkPose(stanceOf(a.ch), MOVE_POSES.roundhouse.wind, { torso: -20 }) : stanceOf(a.ch);
        if ((s.vy > 0 && ctr.y >= GROUND - 52) || u > 120) {
          s.kicked = u; a.forcePose = movePose(a.ch, 'roundhouse', 0, 1);
          FX.burst(v, { radial: true, power: 4, vx: d * 2.2, tint: '#bfe8ff', tintK: 0.55, g: 0.25, vyMin: -3, vyMax: 0 });
          for (let i = 0; i < 50; i++) FX.p('px', ctr.x + rand(-14, 14), ctr.y + rand(-30, 30), d * rand(1, 6) + rand(-1.5, 1.5), rand(-5, 1), randi(50, 110), choice(['#ffffff', '#cfefff', '#7fdcff', '#3a8ad8']), randi(1, 3), 0.25, { floor: true });
          FX.blood(ctr.x, ctr.y, d, 24, 1.8);
          v.hidden = true; s.block = false; Sound.play('shatter'); Sound.play('kick'); g.impact(); g.shake(8);
          pop(s, ctr.x + d * 10, ctr.y - 30, 'ДЗЫНЬ!', { sz: 5, style: 3, life: 50 });
        }
      } else {
        const k = u - s.kicked;
        a.forcePose = k < 18 ? movePose(a.ch, 'roundhouse', 0, 1) : blendPose(movePose(a.ch, 'roundhouse', 0, 1), stanceOf(a.ch), ease((k - 18) / 10));
        if (k === 26) pop(s, a.x - d * 4, a.y - 88, 'ХА!', { sz: 2, style: 1, life: 26 });
      }
    },
    center(v) { const J = solvePose(v.ch, mkPose(objPose(v.forcePose), { rot: 0 })); return { x: v.x + v.facing * J.hip.x, y: v.y + J.hip.y - 8 }; },
    front(ctx, cx, g, a, v, u, s) {
      if (!s.block || v.hidden) return;
      const c = this.center(v);
      drawIceBlock(ctx, c.x - cx, c.y + 3, 34, 86, (s.rot || 0) * v.facing, u);
    }
  },
  // Вольт: бластер в живот → БЗЗЗТ с рентгеном → пыль и дымящиеся ботинки
  laser: {
    dur: 165, hand: 'B',
    update(g, a, v, u, s) {
      const d = s.dir;
      const ap = holdPose(a, s, { hF: [6, -14], eF: { x: 1, y: 0.2 } });
      let vp = dangle(u + 100);
      if (u >= 14 && u < 92) {
        const bel = jw(v, objPose(v.forcePose), 'hip');
        reach(a, ap, 'F', { x: bel.x - d * (u < 20 ? (20 - u) * 1.5 + 7 : 7), y: bel.y - 4 });
        ap.torso = 12;
      }
      if (u === 4) { Sound.play('block'); pop(s, a.x - d * 8, a.y - 92, 'ЩЁЛК!', { sz: 2, style: 1, life: 28 }); }
      if (u === 20) { Sound.play('punch'); pop(s, v.x + d * 14, v.y - 46, 'ТЫК!', { sz: 3, style: 0, life: 30 }); s.stars = false; }
      if (u >= 20 && u < 26) vp = mkPose(dangle(u + 100, 0.2), { torso: 30, head: 14, hF: [8, 6], hB: [6, 8] });
      if (u >= 26 && u < 92) {
        const j = () => rand(-3, 3);
        vp = mkPose(STIFF, { hF: [12 + j(), -18 + j()], hB: [-12 + j(), -16 + j()], eF: { x: 0, y: -1 }, eB: { x: 0, y: -1 }, fF: [10 + j(), 0], fB: [-10 + j(), 0], head: -20 + j() * 3, torso: j(), hx: j() * 0.4 });
        v.skeleton = ((u >> 2) & 1) === 1; v.tint = v.skeleton ? null : 'flash'; v.tintK = 0.45;
        if (u === 26) Sound.play('laser'); if (u % 8 === 2) Sound.play('plasma');
        g.shake(2.5); FX.spark(v.x + rand(-12, 12), v.y - rand(10, 70), 2, choice(['#bff6ff', '#7dff6a', '#ffffff']));
        s.zap = true;
        if (u === 30) pop(s, v.x + d * 18, v.y - 82, 'БЗЗЗТ!', { sz: 4, style: 1, rot: -0.15 });
        if (u === 52) pop(s, v.x - d * 22, v.y - 92, 'БЗЗЗТ!', { sz: 3, style: 4, rot: 0.15 });
        if (u === 74) pop(s, v.x + d * 4, v.y - 100, 'ВЖЖЖ!', { sz: 3, style: 3 });
      }
      if (u < 92) hold(a, v, s, ap, vp);
      if (u === 92) {
        v.skeleton = false; v.tint = 'char'; v.tintK = 0.6; s.zap = false;
        s.shoe = { x: v.x, y: v.y, pal: v.ch.pal, f: v.facing };
        FX.burst(v, { radial: true, power: 1.3, spread: 0.8, vyMin: -1.6, vyMax: 0.4, g: 0.1, tint: '#4a4448', tintK: 0.7, lifeMin: 50, lifeMax: 120, fade: true });
        FX.smoke(v.x, v.y - 34, 34, '#3a3438'); v.hidden = true; Sound.play('explode'); g.impact();
        pop(s, v.x, v.y - 60, 'ПУФ!', { sz: 5, style: 1, life: 46 });
      }
      if (u > 92) {
        const S = s.shoe;
        if (S.y < GROUND) { S.vy = (S.vy || 0) + 0.4; S.y = Math.min(GROUND, S.y + S.vy); if (S.y >= GROUND) Sound.play('land'); }
        if (u % 5 === 0 && u < 160) FX.smoke(S.x + rand(-6, 6), GROUND - 4, 1, '#77707a');
        const k = clamp((u - 100) / 10, 0, 1);
        const p = mkPose(stanceOf(a.ch), { hF: [lerp(18, 6, k), lerp(-8, -20, k)], eF: { x: 1, y: 0 }, hB: [6, 2], torso: lerp(10, -4, k), head: -8 });
        a.forcePose = p;
        if (u > 112 && u < 136 && u % 3 === 0) { const hd = jw(a, p, 'hdF'); FX.smoke(hd.x + d * 2, hd.y - 8, 1, '#c8c0c8'); }
        if (u === 114) { const hd = jw(a, p, 'hdF'); pop(s, hd.x - d * 4, hd.y - 22, 'ФУХ', { sz: 1, life: 26, burst: false, col: '#ffffff' }); Sound.play('whoosh'); }
        if (u === 128) bake(c => this.shoes(c, 0, S));
      }
    },
    shoes(ctx, cx, sh) {
      const P = sh.pal, col = P.shoes || P.boots || P.pants;
      for (const ox of [-6, 5]) { const X = Math.round(sh.x - cx + ox), Y = Math.round(sh.y); ctx.fillStyle = '#140c18'; ctx.fillRect(X - 1, Y - 5, 8, 6); ctx.fillStyle = col; ctx.fillRect(X, Y - 4, 6, 4); ctx.fillStyle = shade(col, 0.3); ctx.fillRect(X, Y - 4, 3, 1); ctx.fillStyle = '#2a2224'; ctx.fillRect(X, Y - 4, 3, 2); }
    },
    front(ctx, cx, g, a, v, u, s) {
      if (!a.hidden && u < 140) { const hd = jw(a, a.pose, 'hdF'); drawBlaster(ctx, hd.x - cx, hd.y - (u > 100 ? 4 : 0), a.facing, s.zap && u % 2 === 0); }
      if (s.zap && !v.hidden) {
        const hd = jw(a, a.pose, 'hdF'), x = hd.x - cx + a.facing * 15, y = hd.y;
        for (let i = 0; i < 2; i++) { bolt(ctx, x, y, v.x - cx + rand(-14, 14), v.y - rand(10, 70), '#7ff0ff', 6, 6, 1); bolt(ctx, x, y, v.x - cx + rand(-14, 14), v.y - rand(10, 70), '#ffffff', 6, 4, 1); }
      }
      if (s.shoe && u < 128) this.shoes(ctx, cx, s.shoe);
    }
  },
  // Ронин-9: подбрасывает, шквал разрезов в воздухе, жертва падает кусками
  slice: {
    dur: 180,
    update(g, a, v, u, s) {
      const d = s.dir;
      if (u < 12) { hold(a, v, s, holdPose(a, s), dangle(u + 100)); if (u === 3) pop(s, a.x - d * 6, a.y - 92, 'ХЕ!', { sz: 2, style: 1, life: 24 }); }
      if (u === 12) { s.vy = -6.2; s.stars = false; Sound.play('throw'); pop(s, v.x, v.y - 90, 'ОП!', { sz: 3, style: 0 }); s.vx0 = v.x; }
      if (u >= 12 && u < 88) {
        if (s.vy < 0) { v.y += s.vy; s.vy += 0.36; } else s.vy = 0;
        v.forcePose = mkPose(POSES.hit, { hF: [8, -22], hB: [-8, -20], head: -30, fF: [10, -6], fB: [-8, -2] });
        if (u < 22) a.forcePose = mkPose(stanceOf(a.ch), { hB: [3, -24], eB: { x: 1, y: 0 }, torso: -6, head: -16 });
      }
      if (u === 22) Sound.play('jump');
      if (u >= 22 && u < 30) { const k = (u - 22) / 8; a.y = lerp(GROUND, v.y + 4, easeOut(k)); a.forcePose = mkPose(POSES.tuck); }
      if (u >= 30 && u < 64) {   // шквал разрезов
        const i = (u - 30) >> 2, side = i % 2 ? 1 : -1;
        if ((u - 30) % 4 === 0) {
          a.x = v.x + side * d * 24 * (i % 3 === 2 ? 0.6 : 1); a.facing = -side * d; a.y = v.y + 4 + (i % 3) * 4;
          const p = mkPose(POSES.cut); blade(a, p, i % 2 ? -30 : 30); a.forcePose = p;
          g.ghostTrail(a); Sound.play('slash'); v.flash = 2; FX.spark(v.x, v.y - 40, 4, '#ffffff');
          const an = rand(-0.9, 0.9) + (i % 2 ? Math.PI / 2 : 0), y0 = v.y - rand(16, 62);
          (s.cuts = s.cuts || []).push({ x: v.x, y: y0, an, t: 0 });
          if (i % 2) FX.blood(v.x, y0, side, 4, 1);
        }
        if (u === 34) pop(s, v.x + d * 30, v.y - 70, 'ВЖИК!', { sz: 3, style: 3 });
        if (u === 46) pop(s, v.x - d * 30, v.y - 40, 'ВЖИК!', { sz: 3, style: 5 });
        if (u === 58) pop(s, v.x + d * 16, v.y - 92, 'ВЖИК!', { sz: 3, style: 0 });
      }
      if (u >= 64 && u < 74) {   // приземлился в позу
        const k = (u - 64) / 10;
        a.x = lerp(a.x, s.vx0 - d * 34, 0.35); a.facing = d; a.y = lerp(v.y + 4, GROUND, easeIn(k));
        a.forcePose = mkPose(POSES.land, { hF: [12, 4], wa: 150 });
        if (u === 73) { FX.dust(a.x, GROUND, 10); Sound.play('land'); }
      }
      if (u >= 74 && u < 120) { a.y = GROUND; a.forcePose = mkPose(POSES.land, { hF: [12, 4], wa: 150, head: -20 }); }
      if (u === 82) { Sound.play('block'); pop(s, a.x - d * 4, a.y - 70, 'ЩЁЛК', { sz: 2, style: 1, life: 30 }); }
      if (u === 88) {   // и только теперь жертва разваливается
        renderFighter(v.R, v.ch, v.pose, v);
        const img = snapCanvas(v), cuts = [SPR_OY - 86, SPR_OY - 50, SPR_OY - 32, SPR_OY - 15, SPR_OY + 2];
        s.pcs = [];
        for (let i = 0; i < 4; i++) {
          const sy = cuts[i], sh = cuts[i + 1] - sy;
          s.pcs.push({ img, sy, sh, x: v.x + (i % 2 ? 2 : -2), y: v.y + (sy + sh / 2 - SPR_OY), vx: (i % 2 ? 1 : -1) * rand(0.8, 2) + (i - 1.5) * 0.4 * d, vy: -rand(0.5, 2.5), rot: 0, vr: rand(-0.16, 0.16), f: v.facing, rest: false });
        }
        v.hidden = true; Sound.play('gore'); g.impact(); FX.blood(v.x, v.y - 40, 1, 20, 1.6); FX.blood(v.x, v.y - 40, -1, 20, 1.6);
        pop(s, v.x, v.y - 96, 'ЧИК-ЧИК!', { sz: 3, style: 2 });
      }
      if (s.pcs) {
        for (const P of s.pcs) {
          if (P.rest) continue;
          P.vy += 0.32; P.x += P.vx; P.y += P.vy; P.rot += P.vr;
          if (u % 2 === 0) FX.gush(P.x, P.y, 1, 2);
          const hh = Math.max(3, Math.abs(Math.sin(P.rot)) * 10 + Math.abs(Math.cos(P.rot)) * P.sh / 2 - 2);
          if (P.y + hh >= GROUND + 2) {
            P.y = GROUND + 2 - hh;
            if (Math.abs(P.vy) > 2) { P.vy *= -0.3; P.vx *= 0.5; P.vr *= 0.5; } else P.rest = true;
            if (!s.landed) { s.landed = true; Sound.play('crunch'); g.shake(5); pop(s, P.x, GROUND - 40, 'ШМЯК!', { sz: 3, style: 2 }); }
          }
        }
      }
      if (u === 140 && s.pcs) { const pcs = s.pcs; bake(c => this.drawPcs(c, 0, pcs)); s.pcs = null; }
    },
    drawPcs(ctx, cx, pcs) {
      for (const P of pcs) { ctx.save(); ctx.translate(Math.round(P.x - cx), Math.round(P.y)); ctx.rotate(P.rot); ctx.scale(P.f, 1); ctx.drawImage(P.img, 0, P.sy * RS, SPR_W * RS, P.sh * RS, -SPR_OX, -Math.round(P.sh / 2), SPR_W, P.sh); ctx.restore(); }
    },
    front(ctx, cx, g, a, v, u, s) {
      if (s.cuts) {
        for (const C of s.cuts) {
          if (u >= 88 && u < 90) C.t = 0;   // все разрезы вспыхивают разом при развале
          C.t++; if (C.t > 7) continue;
          const len = 40 - C.t * 3, ca = Math.cos(C.an), sa = Math.sin(C.an), X = C.x - cx, Y = C.y;
          for (let i = -len; i <= len; i++) { ctx.fillStyle = Math.abs(i) > len - 6 ? '#ff3a5a' : '#ffffff'; ctx.fillRect(Math.round(X + ca * i), Math.round(Y + sa * i), 1, 2); }
        }
      }
      if (s.pcs) this.drawPcs(ctx, cx, s.pcs);
    }
  },
  // Бьорн: хватает за ногу и лупит о землю туда-сюда, потом расплющивает в блин
  hammer: {
    dur: 190, hand: 'B', zoom: 1.24,
    KEYS: [[0, 30], [10, 100], [19, 'F'], [24, 'F'], [36, 'B'], [40, 'B'], [51, 'F'], [54, 'F'], [64, 'B'], [67, 'B'], [76, 'F'], [86, 'F']],
    update(g, a, v, u, s) {
      const d = s.dir;
      if (u === 1) { s.stars = false; Sound.play('grab'); pop(s, a.x - d * 4, a.y - 96, 'ХВАТЬ!', { sz: 3, style: 1 }); s.ax = a.x; s.phiF = this.findHit(a, v, s, 1); s.phiB = this.findHit(a, v, s, -1); }
      if (u <= 86) {
        const val = p => p === 'F' ? s.phiF : p === 'B' ? s.phiB : p;
        let phi = 30;
        for (let i = 0; i < this.KEYS.length - 1; i++) {
          const [t0, p0] = this.KEYS[i], [t1, p1] = this.KEYS[i + 1];
          if (u >= t0 && u <= t1) { const k = (u - t0) / (t1 - t0); phi = lerp(val(p0), val(p1), i === 0 ? ease(k) : k * k); break; }
        }
        this.swing(a, v, s, phi);
        const hitIdx = [19, 36, 51, 64, 76].indexOf(u);
        if (hitIdx >= 0) {
          const h = headOf(v, v.forcePose), words = ['БАХ!', 'БУМ!', 'ХРЯСЬ!', 'БАМ!', 'ШМЯК!'];
          FX.dust(h.x, GROUND, 16); FX.blood(h.x, GROUND - 6, d * (hitIdx % 2 ? -1 : 1), 8, 1.2); v.flash = 3;
          for (let i = -1; i <= 1; i += 2) for (let k = 0; k < 10; k++) FX.decals.push({ x: Math.round(h.x + i * (3 + k * 1.6)), y: GROUND + 1 + Math.round(Math.sin(k * 1.7 + hitIdx) * 1.5 + k * 0.3), col: '#2a1c18', sz: 0 });
          Sound.play('heavy'); Sound.play('crunch'); g.shake(hitIdx === 4 ? 9 : 6);
          pop(s, h.x + (hitIdx % 2 ? -1 : 1) * d * 10, GROUND - 50 - hitIdx * 4, words[hitIdx], { sz: 3 + (hitIdx > 2 ? 1 : 0), style: hitIdx });
        }
        if ([12, 28, 44, 58, 70].includes(u)) Sound.play('whooshH');
      }
      if (u === 87) { v.facing = -d; Sound.play('land'); s.vx = v.x; }
      if (u > 86 && u < 104) {   // жертва отскакивает на ноги и шатается
        const k = clamp((u - 87) / 8, 0, 1);
        v.x = lerp(v.x, s.ax + d * 34, 0.3); v.y = GROUND - Math.sin(k * Math.PI) * 26; v.scaleY = k < 1 ? 1.15 : 1;
        v.forcePose = k < 1 ? mkPose(POSES.tuck, { rot: k * 360 }) : ANIM.dizzy(v.ch, u * 3);
        a.forcePose = stanceOf(a.ch); s.stars = k >= 1;
      }
      if (u >= 104 && u < 130) {   // прыжок с топором и удар плашмя сверху
        const top = headOf(v), k = (u - 104) / 18;
        if (u === 104) { Sound.play('jump'); pop(s, a.x - d * 8, a.y - 100, 'ХРРР!', { sz: 2, style: 2, life: 26 }); }
        if (u < 122) {
          a.y = GROUND - Math.sin(k * Math.PI) * 30;
          const p = mkPose(POSES.leapUp, { fF: [6, -10], fB: [-6, -6] }), q = clamp((k - 0.75) * 4, 0, 1);
          const hp = { x: lerp(a.x + d * 2, top.x - d * 8, q), y: lerp(a.y - 76, top.y - 6, q) };
          reach(a, p, 'F', hp); blade(a, p, lerp(-100, 15, q)); a.forcePose = p;
        }
        if (u === 122) {
          a.y = GROUND; const p = mkPose(POSES.smash); reach(a, p, 'F', { x: v.x - d * 10, y: GROUND - 8 }); blade(a, p, 12); a.forcePose = p;
          v.forcePose = mkPose(STIFF, { hF: [14, -2], hB: [-14, -3], fF: [12, 0], fB: [-12, 0], head: 0 });
          v.scaleY = 0.14; s.stars = false; FX.dust(v.x, GROUND, 30); FX.blood(v.x, GROUND - 3, 1, 22, 2); FX.blood(v.x, GROUND - 3, -1, 22, 2);
          Sound.play('explode'); Sound.play('crunch'); g.impact(); g.shake(8);
          pop(s, v.x, GROUND - 60, 'БЛИН!', { sz: 5, style: 0, life: 50 });
        }
        if (u > 122) v.scaleY = 0.14 + Math.sin((u - 122) * 0.9) * 0.04 * Math.max(0, 1 - (u - 122) / 8);
      }
      if (u === 132) pop(s, v.x + d * 18, GROUND - 26, 'ПЛЮХ', { sz: 2, style: 3, life: 30 });
      if (u >= 130 && u < 160) { v.scaleY = 0.14; a.forcePose = blendPose(objPose(a.forcePose), stanceOf(a.ch), 0.15); }
      if (u === 145) bakeF(v);
    },
    swing(a, v, s, phi) {
      const d = s.dir, cp = Math.cos(phi * DEG), sp = Math.sin(phi * DEG), R = 20;
      const ap = mkPose(stanceOf(a.ch), { torso: 6 + 26 * cp, head: -10, hF: [6, 6], fF: [12, 0], fB: [-11, 0], hB: [R * cp, -R * sp - 4], eB: { x: -cp, y: 0.3 } });
      a.forcePose = ap;
      const h = jw(a, ap, 'hdB');
      v.facing = -d;
      const r = Math.atan2(d * cp * v.facing, sp) / DEG;
      pin(v, mkPose({ hx: 0, hy: 0, torso: 0, head: 0, hF: [3, -25], hB: [-3, -24], eF: { x: 0.3, y: -1 }, eB: { x: 0.3, y: -1 }, fF: [1, 0], fB: [-3, 2], rot: r }), 'ftF', h);
    },
    findHit(a, v, s, side) {   // угол взмаха, при котором голова касается земли
      for (let k = 0; k <= 100; k += 2) {
        const phi = side > 0 ? 30 - k : 150 + k;
        this.swing(a, v, s, phi);
        if (headOf(v, v.forcePose).y >= GROUND - 7) return phi;
      }
      return side > 0 ? -60 : 240;
    }
  },
  // Морена: держит за лицо, вытягивает душу, тело осыпается скелетом
  souls: {
    dur: 175,
    update(g, a, v, u, s) {
      const d = s.dir;
      if (u < 125) a.y = GROUND - Math.min(10, u * 0.5) - 34 * (u < 80 ? ease((u - 16) / 30) : 1 - ease((u - 80) / 30)) + Math.sin(u * 0.08) * 1.5;
      if (u % 3 === 0 && u < 125) FX.p('fire', a.x + rand(-12, 12), a.y - rand(0, 50), 0, -0.6, 30, choice(['#c06bff', '#8a3ad0', '#efe0ff']), 1, 0);
      if (u <= 16) {
        hold(a, v, s, holdPose(a, s, { hF: [18, -18] }), mkPose(dangle(u + 100), { head: -8 }), 'head', 4, 0);
        if (u === 2) { Sound.play('cast'); pop(s, a.x - d * 8, a.y - 94, 'ХИ-ХИ!', { sz: 2, style: 4, life: 30 }); }
        if (u === 16) { renderFighter(v.R, v.ch, v.pose, v); s.ghost = this.ghostOf(v); s.stars = false; s.ax0 = a.x; s.fvy = 0; }
      }
      if (u > 16 && u < 80) {    // тянет душу, тело упирается
        const k = ease((u - 16) / 54), hp = mkPose(stanceOf(a.ch), { torso: 6 + 8 * k, head: -20, eF: { x: 1, y: 0 }, hB: [-8, -12], fF: [9, 0], fB: [-11, 0] });
        reach(a, hp, 'F', { x: v.x - d * 8, y: GROUND - 84 - 20 * k }); a.forcePose = hp;
        if (v.y < GROUND) drop(v, s, 0.3);
        v.x = lerp(v.x, s.ax0 + d * 26, 0.12);
        v.forcePose = mkPose(POSES.hit, { torso: -26 - Math.sin(u * 0.6) * 6, head: -30, hF: [10, -6], hB: [12, -4], fF: [12, 0], fB: [-6, 0] });
        v.tint = 'shadow'; v.tintK = 0.25 + 0.35 * k * (0.7 + 0.3 * Math.sin(u));
        if (u % 8 === 0) Sound.play('skull'); g.shake(1.2);
        if (u === 24) pop(s, v.x - d * 18, v.y - 96, 'ВУУУ!', { sz: 3, style: 4 });
        if (u === 50) pop(s, a.x - d * 14, a.y - 92, 'НУ ЖЕ!', { sz: 2, style: 1, life: 30 });
        s.pull = jw(a, hp, 'hdF');
      }
      if (u === 80) {
        Sound.play('gore'); Sound.play('skull'); g.impact();
        pop(s, (s.pull.x + v.x) / 2, v.y - 98, 'ЧПОК!', { sz: 4, style: 5, life: 44 });
        v.skeleton = true; v.tint = null; v.forcePose = mkPose(STIFF, { head: -10 });
      }
      if (u > 80 && u < 125) {
        const hp = mkPose(stanceOf(a.ch), { torso: -8, head: -18, hF: [8, lerp(-32, -22, clamp((u - 80) / 20, 0, 1))], eF: { x: 1, y: 0 }, hB: [-6, -14] });
        a.forcePose = hp; s.pull = jw(a, hp, 'hdF');
        if (u === 104) { Sound.play('bite'); pop(s, s.pull.x, s.pull.y - 24, 'ГЛОТЬ!', { sz: 3, style: 4, life: 34 }); }
      }
      if (u === 92) { Sound.play('crunch'); pop(s, v.x + d * 4, v.y - 60, 'БРЯК!', { sz: 3, style: 2 }); }
      if (u > 92 && u < 110) {   // скелет осыпается
        const k = ease((u - 92) / 14);
        v.forcePose = blendPose(mkPose(STIFF, { head: -10 }), mkPose(POSES.lie, { hy: 36 }), k); v.scaleY = lerp(1, 0.7, k);
        if (u === 108) { FX.dust(v.x, GROUND, 12); Sound.play('land'); }
      }
      if (u === 128) bakeF(v);
    },
    ghostOf(f) {
      const [cv, c] = mkCanvas(f.R.w, f.R.h); c.drawImage(f.R.cv, 0, 0);
      const im = c.getImageData(0, 0, f.R.w, f.R.h), dd = im.data;
      for (let i = 0; i < dd.length; i += 4) { if (!dd[i + 3]) continue; const L = (dd[i] * 3 + dd[i + 1] * 4 + dd[i + 2]) / 8 / 255; dd[i] = lerp(150, 255, L); dd[i + 1] = lerp(210, 255, L); dd[i + 2] = 255; }
      c.putImageData(im, 0, 0); return cv;
    },
    front(ctx, cx, g, a, v, u, s) {
      if (!s.ghost || u < 17 || u > 106) return;
      const fc = v.facing, gx = v.x, gy = v.y, P = s.pull || { x: gx, y: gy - 50 };
      if (u < 80) {   // «ириска» души между телом и рукой
        const k = ease((u - 16) / 54);
        for (let i = 6; i >= 1; i--) {
          const q = i / 6, x = lerp(gx, P.x + a.facing * 4, q * k + 0.02), y = lerp(gy, P.y + 62, q * k) + Math.sin(u * 0.4 + i) * 2;
          ctx.globalAlpha = 0.12 + 0.22 * q; ctx.save(); ctx.translate(Math.round(x - cx), Math.round(y)); ctx.scale(fc * (1 - k * 0.45 * Math.sin(q * Math.PI)), 1 - 0.25 * q * k); ctx.drawImage(s.ghost, -SPR_OX, -SPR_OY, SPR_W, SPR_H); ctx.restore();
        }
      } else {        // душа в кулаке, извивается и уменьшается
        const k = clamp((u - 80) / 26, 0, 1), sc = Math.max(0.01, (1 - k) * (0.85 + Math.sin(u * 0.8) * 0.12));
        ctx.globalAlpha = 0.8; ctx.save(); ctx.translate(Math.round(P.x - cx + a.facing * 2), Math.round(P.y + 28 * sc)); ctx.scale(fc * sc, sc + Math.sin(u * 0.7) * 0.08 * sc); ctx.drawImage(s.ghost, -SPR_OX, -SPR_OY, SPR_W, SPR_H); ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  },
  // Тралалеро: поднимает над собой, пасть раздувается до огромной, ЧАВК, «ИК!» и косточка
  bite: {
    dur: 175,
    update(g, a, v, u, s) {
      const d = s.dir;
      s.open = 0; s.size = 0;
      if (u <= 52) {
        const k = ease(Math.min(1, u / 16));
        const ap = holdPose(a, s, { hF: [lerp(17, 19, k), lerp(-14, -26, k)], torso: lerp(4, -6, k), head: lerp(-6, -24, k) });
        hold(a, v, s, ap, u > 20 ? mkPose(dangle(u + 100, 0.3), { hF: [8 + Math.sin(u) * 3, -20], hB: [-8, -22], fF: [8, -6 + Math.sin(u * 1.3) * 3], fB: [-6, -3], head: -26 }) : dangle(u + 100));
        if (u === 3) { Sound.play('wave'); pop(s, a.x - d * 10, a.y - 96, 'ТРАЛАЛА!', { sz: 2, style: 3, life: 30 }); }
        if (u > 18) { s.size = easeOut((u - 18) / 14); s.open = Math.min(1, (u - 18) / 10); }
        if (u === 22) { Sound.play('dive'); s.stars = false; }
        if (u === 26) { const h = headOf(v, v.forcePose); pop(s, h.x + d * 14, h.y - 20, 'МАМА!', { sz: 2, style: 4, life: 26 }); }
        if (u > 40) s.open = 1 + Math.sin(u * 0.9) * 0.05;
        if (u >= 46) s.open = Math.max(0, 1 - (u - 46) / 4);
        if (u === 50) {
          v.hidden = true; Sound.play('bite'); Sound.play('crunch'); g.impact();
          const m = this.hinge(a, ap); FX.blood(m.x + d * 30, m.y, d, 20, 1.5); FX.blood(m.x + d * 30, m.y, -d, 14, 1.2);
          pop(s, m.x + d * 40, m.y - 30, 'ЧАВК!', { sz: 5, style: 2, life: 46 });
        }
      } else {
        const k = clamp((u - 52) / 40, 0, 1);
        s.size = u < 92 ? 1 - easeIn(k) * 0.999 : 0; s.open = u < 92 ? Math.abs(Math.sin((u - 52) * 0.35)) * 0.22 : 0;
        if (u < 122) a.forcePose = mkPose(stanceOf(a.ch), { hF: [6, 6], hB: [4, 8], head: -10 + Math.sin(u * 0.7) * 6, torso: 6 });
        if (u < 92) a.scaleY = 1 - Math.abs(Math.sin((u - 52) * 0.35)) * 0.08;
        if (u < 92 && u % 9 === 0) { Sound.play('crunch'); FX.gush(this.hinge(a, a.forcePose).x + d * 8, a.y - 62, 2, 2); }
        if (u === 60 || u === 76) pop(s, a.x + d * (u === 60 ? 26 : -22), a.y - 90 - (u - 60) * 0.5, 'ХРУМ!', { sz: 2, style: u === 60 ? 1 : 5, life: 26 });
        if (u === 104) { a.scaleY = 0.78; Sound.play('skull'); pop(s, a.x + d * 10, a.y - 96, 'ИК!', { sz: 5, style: 4, life: 46 }); FX.ring(a.x + d * 8, a.y - 64, '#d0ff8a', 10, 16); FX.smoke(a.x + d * 8, a.y - 64, 6, '#a8c890'); }
        if (u > 104 && u < 120) a.scaleY = lerp(a.scaleY, 1, 0.25);
        if (u === 120) a.scaleY = 1;
        if (u === 122) {
          a.forcePose = mkPose(stanceOf(a.ch), { head: 14, torso: 14 });
          const m = jw(a, a.forcePose, 'head'); s.bone = { x: m.x + d * 6, y: m.y + 2, vx: d * 2.4, vy: -3.2, an: 0 };
          Sound.play('throw'); pop(s, m.x + d * 4, m.y - 22, 'ТЬФУ!', { sz: 3, style: 1, life: 32 });
        }
        if (u > 122 && u < 140) a.forcePose = blendPose(mkPose(stanceOf(a.ch), { head: 14, torso: 14 }), stanceOf(a.ch), (u - 122) / 18);
        if (s.bone && !s.bone.rest) {
          const B = s.bone; B.vy += 0.25; B.x += B.vx; B.y += B.vy; B.an += 0.4 * d;
          if (B.y >= GROUND - 2) { B.y = GROUND - 2; if (B.vy > 1.5) { B.vy *= -0.4; B.vx *= 0.6; Sound.play('block'); } else { B.rest = true; B.an = 0.15; bake(c => drawBone(c, B.x, B.y, B.an)); pop(s, B.x, GROUND - 22, 'ДЗЫНЬ', { sz: 1, life: 24, burst: false, col: '#ffffff' }); } }
        }
        if (s.bone && s.bone.rest) s.bone = null;
        if (u === 150 && s.bone) { const B = s.bone; B.y = GROUND - 2; bake(c => drawBone(c, B.x, B.y, B.an)); s.bone = null; }
      }
    },
    hinge(a, pose) { const h = jw(a, pose || a.pose, 'head'); return { x: h.x - a.facing * 6, y: h.y - 2 }; },
    front(ctx, cx, g, a, v, u, s) {
      if (s.size > 0.02) {
        const hh = this.hinge(a), o = renderJaw(Math.max(0.06, s.open)), sc = 0.3 + 1.05 * s.size;
        ctx.save(); ctx.translate(Math.round(hh.x - cx), Math.round(hh.y)); ctx.scale(a.facing * sc, sc); ctx.rotate(-0.42 * Math.min(1, s.size * 1.4));
        ctx.drawImage(JAW_R.cv, -o.hx, -o.hy, JAW_R.lw, JAW_R.lh); ctx.restore();
        if (!v.hidden) drawF(ctx, cx, v);   // жертва видна внутри пасти
      }
      if (s.bone) drawBone(ctx, s.bone.x - cx, s.bone.y, s.bone.an);
    }
  },
  // Бомбардиро: запихивает горящую бомбу в рот, затыкает уши — БАБАХ — уголёк с глазками
  bombs: {
    dur: 175, hand: 'B',
    update(g, a, v, u, s) {
      const d = s.dir;
      if (u <= 26) {
        const ap = holdPose(a, s, { hF: [12, -14], eF: { x: 1, y: 0 } });
        if (u >= 12) { const h = headOf(v, objPose(v.forcePose)); reach(a, ap, 'F', { x: h.x + d * 3, y: h.y + 2 }); ap.torso = 10; }
        hold(a, v, s, ap, mkPose(dangle(u + 100), u >= 12 ? { head: -20 } : {}));
        if (u === 2) { Sound.play('cast'); pop(s, a.x - d * 8, a.y - 96, 'ХЕ-ХЕ!', { sz: 2, style: 0, life: 30 }); }
        if (u % 4 === 0) Sound.play('move');
        if (u === 22) { Sound.play('grab'); s.inMouth = true; s.stars = false; pop(s, v.x + d * 22, v.y - 86, 'ГЛОТЬ!', { sz: 3, style: 1 }); }
      }
      if (u > 26 && u < 120) {
        if (v.y < GROUND && drop(v, s)) { FX.dust(v.x, GROUND, 6); Sound.play('land'); }
        if (u < 80) v.forcePose = mkPose(STIFF, { head: -14 + Math.sin(u * 0.3) * 4, hF: [6, 2], hB: [4, 4] });
        if (u < 44) { a.x -= d * 1.6; a.y = GROUND - Math.abs(Math.sin((u - 26) * 0.35)) * 6; a.forcePose = ANIM.walk(a.ch, -u * 4); }   // отбегает
        else if (u < 80) { a.y = GROUND; a.facing = d; a.forcePose = mkPose(POSES.crouch, { hF: [1, -14], hB: [-1, -13], eF: { x: 1, y: 0.2 }, eB: { x: 1, y: 0.2 }, head: 8 + Math.sin(u * 0.9) * 2, torso: 14 }); }   // затыкает уши
        if (u === 50 || u === 62) { Sound.play('block'); const h = headOf(v); pop(s, h.x + d * 12, h.y - 16, u === 50 ? 'ТИК' : 'ТАК', { sz: 2, life: 14, burst: false, col: ['#ffffff', '#ffe14a'] }); }
        if (u === 72) { const h = headOf(v); pop(s, h.x - d * 10, h.y - 16, 'ОЙ...', { sz: 1, life: 14, burst: false, col: '#ffffff' }); }
        if (u > 30 && u < 80 && u % 3 === 0) { const h = headOf(v); FX.spark(h.x + v.facing * 6, h.y - 4, 1, '#fff6a0'); }
        if (u === 80) {
          const h = headOf(v); s.inMouth = false;
          FX.explosion(h.x, h.y, 1.6); FX.blood(h.x, h.y, 1, 10, 1.2); FX.blood(h.x, h.y, -1, 10, 1.2);
          v.tint = 'char'; v.tintK = 1; s.eyes = true; Sound.play('explode'); Sound.play('explode'); g.impact(); g.shake(8);
          pop(s, h.x, h.y - 30, 'БАБАХ!', { sz: 5, style: 0, life: 50 });
        }
        if (u > 80) {
          v.forcePose = mkPose(STIFF, { head: -4 });
          if (u % 4 === 0) FX.smoke(v.x + rand(-6, 6), v.y - rand(40, 66), 1, '#4a4448');
          a.forcePose = blendPose(objPose(a.forcePose), mkPose(stanceOf(a.ch), { head: -6 }), 0.2); a.facing = d;
        }
        if (u === 100) { const h = headOf(v); FX.smoke(h.x + v.facing * 5, h.y + 2, 8, '#6a6470'); FX.ring(h.x + v.facing * 6, h.y + 2, '#a09aa0', 6, 14); Sound.play('whoosh'); pop(s, h.x + v.facing * 18, h.y - 12, 'КХЕ!', { sz: 2, style: 5, life: 26 }); }
      }
      if (u >= 120 && u < 136) {
        v.forcePose = blendPose(mkPose(STIFF), mkPose(POSES.lie), easeIn((u - 120) / 14));
        if (u === 135) { FX.dust(v.x, GROUND, 14); Sound.play('land'); g.shake(4); pop(s, v.x - d * 10, GROUND - 40, 'БРЯК!', { sz: 3, style: 2 }); }
      }
      if (u >= 136) v.forcePose = mkPose(POSES.lie);
    },
    front(ctx, cx, g, a, v, u, s) {
      if (u <= 22 && !a.hidden) { const hd = jw(a, a.pose, 'hdF'); drawBomb(ctx, hd.x - cx + a.facing * 3, hd.y - 4, u, a.facing); }
      if (s.inMouth && !v.hidden) { const h = headOf(v), fuse = clamp(1 - (u - 22) / 58, 0.1, 1); drawBomb(ctx, h.x - cx + v.facing * 5, h.y + 3, u, v.facing, fuse); }
      if (s.eyes && !v.hidden) drawEyes(ctx, cx, v, u);
    }
  },
  // Тун Тун Сахур: держит за макушку и вколачивает битой в землю, как гвоздь
  bat: {
    dur: 180, hand: 'B',
    HITS: [36, 66, 92],
    update(g, a, v, u, s) {
      const d = s.dir;
      if (u === 1) { s.sink = 0; s.sq = 1; s.vx = a.x + d * 30; s.stars = true; Sound.play('throw'); }
      v.x = lerp(v.x, s.vx, 0.4); v.y = lerp(v.y, GROUND + s.sink, 0.5); v.facing = -d; v.hidden = true;
      s.sq = lerp(s.sq, 1, 0.25); v.scaleY = s.sq;
      if (s.sink < 80) v.forcePose = s.sink ? mkPose(STIFF, { head: Math.sin(u * 0.2) * 6 }) : ANIM.dizzy(v.ch, u * 2);
      const top = { x: s.vx, y: GROUND + s.sink - this.height(v) };
      // замах и удар битой сверху по макушке
      let ang = -120, hp = { x: a.x - d * 2, y: a.y - 84 };
      for (let i = 0; i < 3; i++) {
        const h = this.HITS[i], w0 = h - (i ? 16 : 22);
        if (u >= w0 && u < h) { const k = easeIn((u - w0) / (h - w0)); ang = lerp(-120, 18, k); hp = { x: lerp(a.x - d * 2, top.x - d * 16, k), y: lerp(a.y - 84, top.y - 8, k) }; }
        else if (u >= h && u < h + 10) { ang = 18; hp = { x: top.x - d * 16, y: top.y - 8 + (u - h) }; }
      }
      if (u < 104) {
        const p = mkPose(stanceOf(a.ch), { torso: ang > 0 ? 24 : -6, head: -10 });
        reach(a, p, 'F', hp); blade(a, p, ang);
        if (u < this.HITS[0]) reach(a, p, 'B', { x: top.x - d * 2, y: top.y + 3 });   // придерживает за макушку, как гвоздь
        a.forcePose = p; a.x = lerp(a.x, s.vx - d * 34, 0.3);
      } else a.forcePose = ANIM.victory(a.ch, u);
      for (let i = 0; i < 3; i++) if (u === this.HITS[i]) {
        s.sink = [24, 46, 80][i]; s.sq = 0.62; v.flash = 3; s.stars = i < 2;
        FX.dust(s.vx, GROUND, 14 + i * 6);
        for (let k = 0; k < 14; k++) FX.p('px', s.vx + rand(-12, 12), GROUND - 1, rand(-2, 2), -rand(1, 3.5), randi(30, 60), choice(['#6a4a2a', '#8a6a40', '#3a2a1a']), randi(1, 2), 0.25, { floor: true });
        FX.blood(s.vx, GROUND - 4, 1, 4 + i * 4, 1); FX.blood(s.vx, GROUND - 4, -1, 4 + i * 4, 1);
        Sound.play('tun'); Sound.play('heavy'); if (i === 2) { Sound.play('crunch'); g.impact(); } g.shake(5 + i * 2);
        pop(s, s.vx + d * (i - 1) * 14, GROUND - 92 - i * 8, 'ТУН!', { sz: 3 + i, style: [1, 0, 2][i], life: 40 });
        for (let k = -12; k <= 12; k++) if (Math.abs(k) > 6 || i === 2) FX.decals.push({ x: Math.round(s.vx + k), y: GROUND + 1 + (Math.abs(k) % 3 === 0 ? 1 : 0), col: '#2a1c14', sz: 0 });
      }
      if (u >= 110 && u < 140) { s.flag = Math.min(1, (u - 110) / 8); if (u === 112) { Sound.play('jump'); pop(s, s.vx + d * 16, GROUND - 46, 'СДАЮСЬ!', { sz: 1, life: 30, burst: false, col: '#ffffff' }); } }
      if (u === 140) { Sound.play('tun'); s.flagDown = true; pop(s, s.vx, GROUND - 60, 'ТУН.', { sz: 2, style: 1, life: 26 }); }
      if (s.flagDown) s.flag = Math.max(0, s.flag - 0.15);
      if (u === 146) bake(c => this.hole(c, 0, s.vx));
    },
    height(v) { const J = solvePose(v.ch, mkPose(STIFF)); return -(v.ch.headless ? J.neck.y - 4 : J.head.y - v.ch.build.headR); },
    hole(ctx, cx, x) { const X = Math.round(x - cx); ctx.fillStyle = '#140c10'; ctx.fillRect(X - 9, GROUND, 18, 2); ctx.fillRect(X - 7, GROUND + 2, 14, 1); ctx.fillStyle = '#5a3a20'; ctx.fillRect(X - 12, GROUND - 1, 4, 1); ctx.fillRect(X + 8, GROUND - 1, 4, 1); },
    back(ctx, cx, g, a, v, u, s) {
      if (s.sink == null) return;
      if (s.sink < 80 || v.y < GROUND + 76) { ctx.save(); ctx.beginPath(); ctx.rect(-50, -50, W + 100, GROUND + 51); ctx.clip(); drawF(ctx, cx, v); ctx.restore(); }
      if (s.sink > 0 && u < 146) this.hole(ctx, cx, s.vx);
      if (s.stars && s.sink < 60) drawDizzy(ctx, cx, v, u);
      if (s.flag > 0) {   // рука с белым флажком из ямы
        const X = Math.round(s.vx - cx), y1 = GROUND - Math.round(16 * s.flag), P = v.ch.pal;
        plimb(ctx, X, GROUND, X + Math.round(Math.sin(u * 0.5) * 2), y1, 1.6, P.sleeve || P.skin); pdisk(ctx, X, y1, 2.4, P.glove || P.skin);
        ctx.fillStyle = '#8a6a40'; ctx.fillRect(X + 1, y1 - 12, 1, 12); ctx.fillStyle = '#ffffff'; ctx.fillRect(X + 2, y1 - 12, 7 + Math.round(Math.sin(u * 0.6)), 5); ctx.fillStyle = '#c8c8c8'; ctx.fillRect(X + 2, y1 - 8, 7, 1);
      }
    }
  },
  // Балерина: берёт за руки, раскручивает, отпускает — улетает звездой в небо и падает обратно
  tornado: {
    dur: 205,
    update(g, a, v, u, s) {
      const d = s.dir;
      if (u === 1) { s.cx = a.x + d * 14; s.th = 0; s.w = 0; s.stars = false; Sound.play('grab'); pop(s, a.x - d * 8, a.y - 96, 'ПОТАНЦУЕМ?', { sz: 1, life: 28, burst: false, col: '#ffffff' }); }
      if (u < 64) {   // кружатся, держась за руки
        s.w = Math.min(0.62, s.w + 0.012); s.th += s.w;
        const c = Math.cos(s.th), sn = Math.sin(s.th), ext = Math.max(0.15, Math.abs(c));
        a.x = s.cx - c * 6 * d; a.facing = (c >= 0 ? 1 : -1) * d; a.visFlip = false; a.y = GROUND - 2;
        const ap = mkPose(POSES.spinA, { hF: [20 * ext, -10], hB: [18 * ext, -8], eF: { x: 0, y: 1 }, eB: { x: 0, y: 1 }, fF: [3, -16], fB: [0, 0], torso: -4, head: -8 });
        a.forcePose = ap;
        const hd = jw(a, ap, 'hdF');
        v.facing = -a.facing; s.vFront = sn > 0;
        const r = Math.min(1, s.w / 0.45) * 82;
        pin(v, mkPose(STIFF, { hF: [16, -6], hB: [16, -4], eF: { x: 0, y: 1 }, fF: [6 + Math.sin(u * 0.7) * 3, 0], fB: [-6, 2], head: -18, rot: r }), 'hdF', { x: hd.x + a.facing * 2, y: hd.y });
        v.hidden = s.vFront;
        if (u % 8 === 0) Sound.play('spin');
        if (u % 3 === 0) FX.p('px', s.cx + rand(-30, 30), GROUND - rand(4, 70), rand(-1, 1), rand(-1, 1), 20, choice(['#ffc2db', '#ffffff', '#c98a5a']), 1, 0, { floor: false });
        if (u % 4 === 0) FX.dust(s.cx + rand(-14, 14), GROUND, 2);
        if (u === 20) pop(s, s.cx - d * 30, GROUND - 100, 'ВЖУХ!', { sz: 2, style: 5, life: 26 });
        if (u === 36) pop(s, s.cx + d * 30, GROUND - 110, 'УИИИ!', { sz: 3, style: 3, life: 30 });
      }
      if (u === 64) {   // отпускает
        a.facing = d; v.hidden = false; s.vFront = false; v.facing = -d;
        s.vvx = d * 2.6; s.vvy = -10.5; s.spin = 0; Sound.play('whooshH'); Sound.play('throw');
        pop(s, a.x - d * 10, a.y - 96, 'ЧАО!', { sz: 3, style: 5, life: 36 });
      }
      if (u > 64 && u < 126) {
        a.forcePose = ANIM.victory(a.ch, u); a.visFlip = ((u >> 3) & 1) === 1; a.y = GROUND;
        s.z = lerp(s.z, 1.0, 0.15);
        if (!s.sky) {
          v.x += s.vvx; v.y += s.vvy; s.vvy += 0.12; s.spin += 30;
          v.forcePose = mkPose(POSES.fall, { rot: s.spin });
          if (v.y < 110 || u > 90) { s.sky = { x: v.x, y: v.y, k: 1 }; v.hidden = true; renderFighter(v.R, v.ch, v.pose, v); s.img = snapCanvas(v); }
        } else {
          const S = s.sky;
          if (u < 92) { S.y = lerp(S.y, 50, 0.12); S.x += s.vvx * 0.5; S.k = Math.max(0.08, S.k * 0.88); }
          if (u === 92) { Sound.play('ice'); S.tw = 1; pop(s, S.x + d * 22, 58, 'ДЗИНЬ!', { sz: 2, style: 1, life: 30 }); }
          if (S.tw) S.tw++;
          if (u === 108) Sound.play('dive');
          if (u === 112) pop(s, S.x - d * 26, 84, 'А-А-А!', { sz: 2, style: 4, life: 20 });
          if (u >= 108) { S.x += d * 0.8; S.y += (u - 107) * 0.6; S.k = Math.min(1, S.k * 1.14); }
        }
      }
      if (u === 126) {   // втыкается головой в землю
        const x = s.sky ? s.sky.x : v.x;
        s.sky = null; s.img = null; v.hidden = true; s.stuck = true; s.z = 1.4; a.visFlip = false;
        v.facing = -d; v.scaleY = 1; v.x = x;
        pin(v, mkPose(STIFF, { rot: 180 }), 'hip', { x, y: GROUND - 8 });
        FX.dust(x, GROUND, 30); FX.blood(x, GROUND - 2, 1, 16, 1.6); FX.blood(x, GROUND - 2, -1, 16, 1.6);
        for (let k = 0; k < 16; k++) FX.p('px', x + rand(-10, 10), GROUND - 1, rand(-2.5, 2.5), -rand(1.5, 4), randi(30, 60), choice(['#6a4a2a', '#8a6a40', '#3a2a1a']), randi(1, 2), 0.25, { floor: true });
        Sound.play('explode'); Sound.play('crunch'); g.impact(); g.shake(8);
        pop(s, x, GROUND - 70, 'БАБАХ!', { sz: 5, style: 0, life: 50 });
      }
      if (u > 126 && u < 160) {
        const tw = u < 150 ? Math.sin(u * 1.4) * 4 : 0;
        v.forcePose = mkPose(STIFF, { rot: 180, fF: [6 + tw, 0], fB: [-6 - tw, 0] });
        a.forcePose = mkPose(stanceOf(a.ch), { hF: [6, -20], hB: [6, -18], eF: { x: 1, y: 0 }, head: 10 });
        if (u === 134) pop(s, v.x + d * 16, GROUND - 52, 'ДРЫГ', { sz: 1, life: 20, burst: false, col: '#ffffff' });
        if (u === 142) pop(s, a.x - d * 10, a.y - 92, 'УПС!', { sz: 2, style: 3, life: 28 });
      }
      if (u === 160) { bake(c => { c.save(); c.beginPath(); c.rect(0, 0, STAGE_W, GROUND + 1); c.clip(); drawF(c, 0, v); c.restore(); this.dirt(c, 0, v.x); }); s.stuck = false; }
    },
    dirt(ctx, cx, x) { const X = Math.round(x - cx); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(X - 12, GROUND - 1, 24, 2); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(X - 14, GROUND - 2, 5, 2); ctx.fillRect(X + 9, GROUND - 2, 5, 2); ctx.fillRect(X - 6, GROUND - 2, 3, 1); },
    swirl(ctx, cx, s, u, front) {
      const X = s.cx - cx;
      for (let y = 0; y < 90; y += 3) {
        const ph = u * 0.5 + y * 0.15, w = 22 + y * 0.12;
        if ((Math.cos(ph) > 0) !== front) continue;
        ctx.globalAlpha = (front ? 0.55 : 0.35) * Math.min(1, s.w * 3);
        ctx.fillStyle = y % 9 < 3 ? '#ffc2db' : '#ffffff';
        ctx.fillRect(Math.round(X + Math.sin(ph) * w), GROUND - y, front ? 4 : 3, 1);
      }
      ctx.globalAlpha = 1;
    },
    back(ctx, cx, g, a, v, u, s) {
      if (u < 64 && s.w) this.swirl(ctx, cx, s, u, false);
      if (s.stuck) { ctx.save(); ctx.beginPath(); ctx.rect(-50, -50, W + 100, GROUND + 51); ctx.clip(); drawF(ctx, cx, v); ctx.restore(); this.dirt(ctx, cx, v.x); }
    },
    front(ctx, cx, g, a, v, u, s) {
      if (s.vFront && u < 64) drawF(ctx, cx, v);
      if (u < 64 && s.w) this.swirl(ctx, cx, s, u, true);
      const S = s.sky;
      if (S && s.img) {
        if (!S.tw || S.tw > 14) { ctx.save(); ctx.translate(Math.round(S.x - cx), Math.round(S.y)); ctx.rotate(u * 0.5); ctx.scale(S.k, S.k); ctx.drawImage(s.img, -SPR_OX, -SPR_OY + 40, SPR_W, SPR_H); ctx.restore(); }
        if (S.tw && S.tw < 22) { const r = S.tw < 11 ? S.tw : 22 - S.tw; star(ctx, S.x - cx, S.y, Math.max(1, Math.round(r * 0.8)), '#ffffff', '#fff6a0'); if (r > 4) star(ctx, S.x - cx, S.y, Math.round(r * 0.4), '#ffe14a'); }
      }
    }
  }
};

const FATALITIES = {};
for (const k in FIN) FATALITIES[k] = mkFat(FIN[k]);
