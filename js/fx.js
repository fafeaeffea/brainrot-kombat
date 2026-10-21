'use strict';
// Частицы, кровь, снаряды
const Settings = Object.assign({ diff: 2, time: 99, blood: true, music: true, sfx: true, voice: true }, Store.get('settings', {}));
function saveSettings() { Store.set('settings', Settings); }

const _hexOf = new Map();
function hexOf32(c) {
  let s = _hexOf.get(c);
  if (!s) { s = rgb2hex(c & 255, (c >> 8) & 255, (c >> 16) & 255); _hexOf.set(c, s); }
  return s;
}
function pdisk(ctx, cx, cy, r, col) {
  ctx.fillStyle = col; cx = Math.round(cx); cy = Math.round(cy);
  const ri = Math.ceil(r);
  for (let dy = -ri; dy <= ri; dy++) { const w = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy))); if (w > 0 || Math.abs(dy) < r) ctx.fillRect(cx - w, cy + dy, w * 2 + 1, 1); }
}
function pring(ctx, cx, cy, r, col, th = 1) {
  ctx.fillStyle = col;
  const n = Math.max(8, Math.floor(r * 6));
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), th, th); }
}
const BLOOD_COLS = ['#b0000f', '#d4161d', '#7a0008', '#e8303a'];
const FIRE_RAMP = ['#ffffff', '#fff3a0', '#ffd23a', '#ff9a1a', '#ff5a10', '#d02a10', '#7a2020', '#3a2a2a'];

const FX = {
  parts: [], decals: [],
  clear() { this.parts.length = 0; this.decals.length = 0; },
  add(o) { if (this.parts.length < 5000) this.parts.push(o); return o; },
  p(type, x, y, vx, vy, life, col, sz = 1, g = 0, extra) { return this.add(Object.assign({ type, x, y, vx, vy, life, max: life, col, sz, g, drag: 1 }, extra)); },
  blood(x, y, dir, n, pw = 1) {
    if (!Settings.blood) { this.spark(x, y, Math.ceil(n / 2), '#ffffff'); return; }
    for (let i = 0; i < n; i++) this.p('blood', x + rand(-3, 3), y + rand(-3, 3), dir * rand(0.5, 3.5) * pw + rand(-1, 1), rand(-3.5, 0.5) * pw, randi(40, 90), choice(BLOOD_COLS), Math.random() < 0.3 ? 2 : 1, 0.22);
  },
  gush(x, y, n, up = 4) {
    if (!Settings.blood) { this.spark(x, y, Math.ceil(n / 3), '#ffffff'); return; }
    for (let i = 0; i < n; i++) this.p('blood', x + rand(-2, 2), y, rand(-1.6, 1.6), -rand(1, up), randi(50, 100), choice(BLOOD_COLS), Math.random() < 0.4 ? 2 : 1, 0.2);
  },
  spark(x, y, n, col = '#fff6b0') {
    for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), s = rand(1.5, 4.5); this.p('spark', x, y, Math.cos(a) * s, Math.sin(a) * s, randi(6, 14), col, 1, 0, { drag: 0.85 }); }
  },
  hitFlash(x, y, big) { this.p('flash', x, y, 0, 0, big ? 8 : 6, '#ffffff', big ? 12 : 8); },
  fire(x, y, n, spread = 4, up = 1.5) {
    for (let i = 0; i < n; i++) this.p('fire', x + rand(-spread, spread), y + rand(-spread, spread), rand(-0.5, 0.5), -rand(0.3, up), randi(14, 34), null, Math.random() < 0.4 ? 2 : 1, -0.02);
  },
  smoke(x, y, n, col = '#55505a') { for (let i = 0; i < n; i++) this.p('smoke', x + rand(-4, 4), y + rand(-3, 3), rand(-0.4, 0.4), -rand(0.2, 0.8), randi(30, 60), col, randi(2, 4), -0.005); },
  dust(x, y, n) { for (let i = 0; i < n; i++) this.p('smoke', x + rand(-8, 8), y - rand(0, 3), rand(-1.2, 1.2), -rand(0.1, 0.6), randi(16, 30), '#a89a88', randi(1, 3), 0); },
  ring(x, y, col, r = 20, life = 16) { this.p('ring', x, y, 0, 0, life, col, r); },
  explosion(x, y, s = 1) {
    this.ring(x, y, '#fff6b0', 26 * s, 14);
    this.p('flash', x, y, 0, 0, 7, '#ffffff', 18 * s);
    for (let i = 0; i < 40 * s; i++) { const a = rand(0, Math.PI * 2), v = rand(0.5, 4) * s; this.p('fire', x, y, Math.cos(a) * v, Math.sin(a) * v - 0.6, randi(16, 40), null, randi(1, 3), -0.03, { drag: 0.9 }); }
    this.smoke(x, y - 4, 12 * s);
    for (let i = 0; i < 10 * s; i++) this.p('px', x, y, rand(-4, 4), rand(-6, -1), randi(30, 60), choice(['#3a2a2a', '#6a5040', '#ffb84a']), 1, 0.25, { floor: true });
  },
  text(x, y, str, s, col, life = 50, vy = -0.6) { return this.p('text', x, y, 0, vy, life, col, s, 0, { str }); },
  // Разлёт спрайта бойца на пиксели
  burst(f, o = {}) {
    const R = f.R, w = R.w, h = R.h, d = R.d, step = o.step || 1, out = [];
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
      const c = d[y * w + x]; if (!c) continue;
      const wx = f.x + (f.facing === 1 ? x - SPR_OX : SPR_OX - x), wy = f.y + (y - SPR_OY) * (f.scaleY || 1);
      if (o.region && !o.region(x, y)) continue;
      let col = hexOf32(c);
      if (o.tint) col = mix(col, o.tint, o.tintK || 0.6);
      const cx = f.x, cy = f.y - 30, dx = wx - cx, dy = wy - cy, dist = Math.hypot(dx, dy) || 1;
      const pw = o.power == null ? 3 : o.power;
      const vx = (o.radial ? dx / dist * pw * rand(0.4, 1.2) : 0) + rand(-(o.spread || 1), o.spread || 1) + (o.vx || 0);
      const vy = (o.radial ? dy / dist * pw * rand(0.4, 1.2) : 0) + rand(o.vyMin == null ? -1 : o.vyMin, o.vyMax == null ? 1 : o.vyMax);
      out.push(this.p('px', wx, wy, vx, vy, randi(o.lifeMin || 80, o.lifeMax || 160), col, step, o.g == null ? 0.2 : o.g, { floor: o.floor !== false, drag: o.drag || 1, fade: o.fade }));
    }
    return out;
  },
  update() {
    const ps = this.parts;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.vx *= p.drag; p.vy *= p.drag; p.vy += p.g; p.x += p.vx; p.y += p.vy;
      if ((p.type === 'blood' || p.type === 'px') && p.y >= GROUND + (p.depth || (p.depth = rand(0, 7))) && p.vy > 0) {
        if (p.type === 'blood') { if (this.decals.length < 900) this.decals.push({ x: Math.round(p.x), y: Math.round(p.y), col: p.col, sz: p.sz }); p.life = 0; }
        else if (p.floor) { p.y = GROUND + p.depth; p.vy *= -0.25; p.vx *= 0.6; if (Math.abs(p.vy) < 0.4) { p.vy = 0; p.g = 0; p.vx *= 0.5; } }
      }
      if (--p.life <= 0) { ps[i] = ps[ps.length - 1]; ps.pop(); }
    }
  },
  drawDecals(ctx, cx) {
    for (const d of this.decals) { ctx.fillStyle = d.col; ctx.fillRect(d.x - cx, d.y, d.sz + 1, 1); }
  },
  draw(ctx, cx) {
    for (const p of this.parts) {
      const x = Math.round(p.x - cx), y = Math.round(p.y), k = p.life / p.max;
      switch (p.type) {
        case 'px': case 'blood':
          if (p.fade && k < 0.3) ctx.globalAlpha = k / 0.3;
          ctx.fillStyle = p.col; ctx.fillRect(x, y, p.sz, p.sz); ctx.globalAlpha = 1; break;
        case 'spark': ctx.fillStyle = p.col; ctx.fillRect(x, y, 1, 1); ctx.fillRect(Math.round(x - p.vx), Math.round(y - p.vy), 1, 1); break;
        case 'fire': ctx.fillStyle = p.col || FIRE_RAMP[Math.min(FIRE_RAMP.length - 1, Math.floor((1 - k) * FIRE_RAMP.length))]; ctx.fillRect(x, y, p.sz, p.sz); break;
        case 'smoke': ctx.globalAlpha = k * 0.6; ctx.fillStyle = p.col; ctx.fillRect(x, y, p.sz + Math.floor((1 - k) * 3), p.sz + Math.floor((1 - k) * 3)); ctx.globalAlpha = 1; break;
        case 'ring': pring(ctx, x, y, p.sz * (1 - k * k), p.col, 1); break;
        case 'flash': ctx.globalAlpha = k; pdisk(ctx, x, y, p.sz * (0.5 + k * 0.5), p.col); ctx.globalAlpha = 1; break;
        case 'text': ctx.globalAlpha = Math.min(1, k * 3); drawText(ctx, p.str, x, y, p.sz, p.col); ctx.globalAlpha = 1; break;
        case 'snow': ctx.fillStyle = p.col; ctx.fillRect(x, y, p.sz, p.sz); break;
        case 'line': ctx.fillStyle = p.col; ctx.globalAlpha = k; ctx.fillRect(x, y, 1, p.sz); ctx.globalAlpha = 1; break;
      }
    }
  }
};

// ---------- Снаряды ----------
const PROJ = {
  fire: { vx: 4.2, y: -44, dmg: 10, hs: 20, kb: 3, r: 6, snd: 'fire', name: 'Огненный шар' },
  ice: { vx: 3.8, y: -44, dmg: 7, freeze: 80, r: 6, snd: 'ice', name: 'Ледяной осколок' },
  plasma: { vx: 6.2, y: -46, dmg: 8, hs: 16, kb: 2.5, r: 5, snd: 'plasma', name: 'Плазменный выстрел' },
  slash: { vx: 5.4, y: -40, dmg: 10, hs: 18, kb: 3, r: 9, snd: 'slash', name: 'Волна клинка' },
  axe: { vx: 4.4, vy: -3, g: 0.13, y: -52, dmg: 11, hs: 20, kb: 3, r: 7, snd: 'axe', name: 'Метательный топор' },
  skull: { vx: 2.9, y: -44, dmg: 12, hs: 22, kb: 3, r: 6, snd: 'skull', name: 'Проклятый череп' },
  wave: { vx: 3.6, y: -8, dmg: 9, trip: true, r: 8, snd: 'wave', name: 'Волна Тралала' },
  bomb: { vx: 3.1, vy: -4.6, g: 0.2, y: -50, dmg: 13, kd: true, explode: true, r: 5, snd: 'throw', name: 'Бомба' },
  tun: { vx: 3.6, y: -36, dmg: 9, hs: 18, kb: 7, life: 36, r: 11, snd: 'tun', name: 'Звуковая волна «ТУН!»' },
  coffee: { vx: 4.4, vy: -1.6, g: 0.08, y: -46, dmg: 8, hs: 22, kb: 2, r: 5, snd: 'coffee', name: 'Горячий капучино' },
};
const _axeR = new Raster(56, 56);

class Proj {
  constructor(owner, type) {
    const s = PROJ[type];
    this.owner = owner; this.type = type; this.s = s; this.dir = owner.facing;
    this.x = owner.x + owner.facing * 18; this.y = owner.y + s.y;
    this.vx = s.vx * this.dir; this.vy = s.vy || 0; this.t = 0; this.life = s.life || 260; this.dead = false;
  }
  box() { const r = this.s.r; return [this.x - r, this.y - r, r * 2, r * 2]; }
  update(g) {
    const s = this.s; this.t++;
    this.vy += s.g || 0; this.x += this.vx; this.y += this.vy;
    if (s.y > -10) this.y = GROUND - 8;
    if (this.type === 'skull') this.y += Math.sin(this.t * 0.15) * 0.6;
    const T = this.type, x = this.x, y = this.y;
    if (T === 'fire') { FX.fire(x - this.dir * 4, y, 2, 2.5, 0.6); }
    else if (T === 'ice' && this.t % 2 === 0) FX.p('px', x - this.dir * 5, y + rand(-2, 2), -this.dir * 0.4, rand(-0.3, 0.3), 16, choice(['#ffffff', '#9fe6ff']), 1, 0);
    else if (T === 'plasma') FX.p('px', x - this.dir * 4, y + rand(-2, 2), -this.dir * 0.6, 0, 12, choice(['#7dff6a', '#d8ffd0']), 1, 0);
    else if (T === 'skull' && this.t % 2 === 0) FX.p('fire', x - this.dir * 5, y + rand(-3, 3), -this.dir * 0.3, -0.3, 20, choice(['#c06bff', '#8a3ad0', '#efe0ff']), 1, -0.01);
    else if (T === 'wave' && this.t % 2 === 0) FX.p('px', x + rand(-6, 6), y - 6, rand(-0.6, 0.6), -rand(1, 2.5), 26, choice(['#ffffff', '#9fdfff', '#4fc3ff']), 1, 0.15, { floor: false });
    else if (T === 'coffee' && this.t % 2 === 0) FX.p('px', x, y, rand(-0.5, 0.5), rand(-0.5, 0.5), 30, choice(['#7a4a2a', '#c98a5a']), 1, 0.15, { floor: false });
    else if (T === 'bomb' && this.t % 3 === 0) FX.smoke(x - this.dir * 3, y - 4, 1, '#77707a');
    if (s.explode && this.y >= GROUND - 4) { this.explode(g); return; }
    if (--this.life <= 0 || this.x < -40 || this.x > STAGE_W + 40) this.dead = true;
  }
  explode(g) {
    this.dead = true;
    FX.explosion(this.x, Math.min(this.y, GROUND - 6), 1);
    Sound.play('explode'); g.shake(6);
    const o = this.owner.opp;
    if (Math.abs(o.x - this.x) < 30 && Math.abs((o.y - 30) - this.y) < 40) g.projHit(this, o, true);
  }
  draw(ctx, cx) {
    const x = Math.round(this.x - cx), y = Math.round(this.y), d = this.dir, t = this.t;
    switch (this.type) {
      case 'fire':
        pdisk(ctx, x, y, 6.5, '#a01800'); pdisk(ctx, x + d, y, 5.2, '#ff5a10'); pdisk(ctx, x + d * 2, y - 1, 3.6, '#ffc030'); pdisk(ctx, x + d * 2, y - 1, 1.8, '#fffbe0');
        ctx.fillStyle = '#ff9a1a'; ctx.fillRect(x - d * 7 - (d < 0 ? 2 : 0), y - 2 + (t >> 2) % 2, 3, 2); break;
      case 'ice':
        ctx.fillStyle = '#1f4fa0'; for (let i = -7; i <= 7; i++) { const hh = Math.round(3.5 - Math.abs(i) * 0.45); ctx.fillRect(x + i * d, y - hh, 1, hh * 2 + 1); }
        ctx.fillStyle = '#7fdcff'; for (let i = -6; i <= 6; i++) { const hh = Math.round(2.5 - Math.abs(i) * 0.4); ctx.fillRect(x + i * d, y - hh, 1, hh * 2); }
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x + d * 2 - (d < 0 ? 3 : 0), y - 1, 4, 1); break;
      case 'plasma': {
        const r = 5 + Math.sin(t * 0.6); pdisk(ctx, x, y, r, '#1a7a2a'); pdisk(ctx, x, y, r - 1.3, '#7dff6a'); pdisk(ctx, x, y, 2, '#f0fff0');
        pring(ctx, x, y, r + 2 + (t % 4), '#bfffb0'); break;
      }
      case 'slash':
        for (let a = -75; a <= 75; a += 5) {
          const r1 = 10, rr = a * DEG;
          ctx.fillStyle = Math.abs(a) > 55 ? '#ff3a5a' : '#ffffff';
          ctx.fillRect(Math.round(x + Math.cos(rr) * r1 * d * 0.6), Math.round(y + Math.sin(rr) * r1), 2, 1);
          ctx.fillStyle = '#ff3a5a'; ctx.fillRect(Math.round(x + Math.cos(rr) * (r1 - 2.5) * d * 0.6), Math.round(y + Math.sin(rr) * (r1 - 2)), 1, 1);
        }
        break;
      case 'axe': {
        WEP_R.clear(); WEAPONS.axe(WEP_R); _axeR.clear(); _axeR.blitRot(WEP_R, 26, 20, 28, 28, t * 0.45 * d); _axeR.outline(c32('#140c18')); _axeR.flush();
        ctx.drawImage(_axeR.cv, x - 28, y - 28); break;
      }
      case 'skull': {
        const fl = (t >> 2) & 1;
        pdisk(ctx, x, y, 6.5, '#5a2a8a'); pdisk(ctx, x, y - 1, 5, '#efeaff');
        ctx.fillStyle = '#efeaff'; ctx.fillRect(x - 3, y + 2, 7, 3);
        ctx.fillStyle = fl ? '#c06bff' : '#2a1638'; ctx.fillRect(x + (d > 0 ? 0 : -3), y - 2, 2, 2); ctx.fillRect(x + (d > 0 ? 3 : -6) + (d > 0 ? 0 : 0), y - 2, 2, 2);
        ctx.fillStyle = '#2a1638'; ctx.fillRect(x - 2, y + 3, 1, 2); ctx.fillRect(x, y + 3, 1, 2); ctx.fillRect(x + 2, y + 3, 1, 2); break;
      }
      case 'wave': {
        for (let i = -9; i <= 9; i++) {
          const hgt = Math.round(10 - Math.abs(i + d * 3) * 0.7 + Math.sin(t * 0.4 + i) * 1.2);
          if (hgt <= 0) continue;
          ctx.fillStyle = '#1f4fc0'; ctx.fillRect(x + i, GROUND - hgt, 1, hgt);
          ctx.fillStyle = '#4fc3ff'; ctx.fillRect(x + i, GROUND - hgt + 1, 1, Math.max(1, hgt - 3));
          ctx.fillStyle = '#ffffff'; ctx.fillRect(x + i, GROUND - hgt, 1, 1);
        }
        break;
      }
      case 'bomb':
        ctx.fillStyle = '#5a5a5a'; ctx.fillRect(x - d * 6 - (d < 0 ? 2 : 0), y - 3, 3, 6);
        pdisk(ctx, x, y, 4.5, '#141418'); pdisk(ctx, x - 1, y - 1, 3, '#3a3a44'); ctx.fillStyle = '#9a9aa8'; ctx.fillRect(x - 2, y - 3, 1, 1);
        ctx.fillStyle = (t >> 1) & 1 ? '#fff6a0' : '#ff8a1a'; ctx.fillRect(x + d * 3, y - 6, 2, 2); break;
      case 'tun': {
        const k = t / 36;
        for (let j = 0; j < 3; j++) {
          const r = 6 + j * 4 + k * 6;
          ctx.fillStyle = j === 0 ? '#ffffff' : j === 1 ? '#ffd36a' : '#c98a2a';
          for (let a = -60; a <= 60; a += 6) ctx.fillRect(Math.round(x - d * 8 + Math.cos(a * DEG) * r * d), Math.round(y + Math.sin(a * DEG) * r), 1, 2);
        }
        drawText(ctx, 'ТУН!', x, y - 18 - Math.round(k * 4), 1, ['#fff6b0', '#ff9a1a']);
        break;
      }
      case 'coffee':
        pdisk(ctx, x, y, 4.5, '#4a2a14'); pdisk(ctx, x, y, 3.5, '#7a4a2a'); pdisk(ctx, x - d, y - 1, 2, '#e7cfa6'); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - d * 2, y - 2, 1, 1);
        if (t % 6 < 3) { ctx.fillStyle = '#e8e8e8'; ctx.fillRect(x - 2, y - 8, 1, 2); ctx.fillRect(x + 1, y - 10, 1, 2); }
        break;
    }
  }
}
