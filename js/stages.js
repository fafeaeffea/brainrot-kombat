'use strict';
// Арены: многослойный параллакс, процедурный пиксель-арт
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function layerW(p) { return Math.ceil(W + (STAGE_W - W) * p) + 2; }
function ridge(ctx, w, base, amp, col, r, rough = 3, step = 2) {
  ctx.fillStyle = col; let h = base - amp * 0.5;
  for (let x = 0; x < w; x += step) { h += (r() - 0.5) * rough * 2; h = clamp(h, base - amp, base - 4); if (r() < 0.04) h -= amp * 0.3 * r(); ctx.fillRect(x, Math.round(h), step, H - Math.round(h)); }
}
function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function stoneFloor(ctx, w, y0, cols, r) {
  for (let y = y0; y < H; y++) { const k = (y - y0) / (H - y0); rect(ctx, 0, y, w, 1, cols[Math.min(cols.length - 1, Math.floor(k * cols.length))]); }
  // плитки в перспективе
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  let y = y0 + 3, hh = 4;
  while (y < H) { ctx.fillRect(0, y, w, 1); y += hh; hh += 2; }
  for (let x = -400; x < w + 400; x += 36) { for (let yy = y0; yy < H; yy++) { const xx = x + (x - w / 2) * (yy - y0) / 60; ctx.fillRect(Math.round(xx), yy, 1, 1); } }
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 200; i++) ctx.fillRect(Math.floor(r() * w), y0 + Math.floor(r() * (H - y0)), 2, 1);
  rect(ctx, 0, y0, w, 1, 'rgba(255,255,255,0.18)');
}

const STAGES = [
  {
    id: 'temple', name: 'Храм Заката',
    build() {
      const r = rng(11), L = [];
      let [cv, c] = mkCanvas(layerW(0.08), H);
      ditherV(c, 0, 0, cv.width, 210, ['#1c0c34', '#4a1650', '#9a2a50', '#e0583a', '#ffa848', '#ffd890']);
      rect(c, 0, 210, cv.width, 60, '#ffd890');
      for (let i = 0; i < 40; i++) { const y = 150 - i; const w2 = Math.sqrt(Math.max(0, 1600 - (i - 40) * (i - 40))) | 0; if ((i % 6) < 4 || i > 24) rect(c, 270 - w2, y, w2 * 2, 1, i > 30 ? '#fff4c0' : '#ffe08a'); }
      c.globalAlpha = 0.5; for (let i = 0; i < 6; i++) rect(c, r() * cv.width, 40 + r() * 70, 40 + r() * 70, 2, '#ffb0a0'); c.globalAlpha = 1;
      L.push({ cv, p: 0.08 });
      [cv, c] = mkCanvas(layerW(0.2), H);
      ridge(c, cv.width, 175, 70, '#5a1e4e', r, 3, 2); ridge(c, cv.width, 190, 50, '#3a1238', r, 2.5, 2);
      L.push({ cv, p: 0.2 });
      [cv, c] = mkCanvas(layerW(0.5), H);
      const cx = cv.width / 2;
      for (let i = 0; i < 14; i++) { const tx = r() * cv.width, ty = 200 + r() * 10, s = 8 + r() * 10; rect(c, tx - 1, ty - s, 3, s + 20, '#2a0e22'); for (let j = 0; j < 14; j++) rect(c, tx - s + r() * s * 2, ty - s - r() * s, 4 + r() * 5, 3 + r() * 3, j % 3 ? '#c84a7a' : '#ff8ab0'); }
      const tier = (y, w2, h2) => {
        rect(c, cx - w2 / 2 + 6, y, w2 - 12, h2, '#5a1a1a');
        for (let x = cx - w2 / 2 + 10; x < cx + w2 / 2 - 10; x += 8) rect(c, x, y, 3, h2, '#a8282a');
        rect(c, cx - w2 / 2 + 6, y + h2 - 3, w2 - 12, 3, '#3a1010');
        for (let i = 0; i < 9; i++) rect(c, cx - w2 / 2 - i * 0.8 + 2, y - 8 + i, w2 - 4 + i * 1.6 - 4, 1, i < 2 ? '#3a2a2a' : '#1e1418');
        rect(c, cx - w2 / 2 - 6, y - 10, 6, 2, '#1e1418'); rect(c, cx + w2 / 2, y - 10, 6, 2, '#1e1418');
        rect(c, cx - w2 / 2 - 8, y - 12, 3, 2, '#1e1418'); rect(c, cx + w2 / 2 + 5, y - 12, 3, 2, '#1e1418');
      };
      tier(196, 150, 20); tier(170, 120, 18); tier(146, 92, 16); tier(124, 64, 14);
      rect(c, cx - 2, 96, 4, 20, '#1e1418'); for (let i = 0; i < 4; i++) rect(c, cx - 4 + i % 2, 100 + i * 4, 8 - (i % 2) * 2, 2, '#e3b341');
      rect(c, cx - 90, 214, 180, 16, '#4a3a40'); for (let i = 0; i < 5; i++) rect(c, cx - 70 + i * 6, 214 + i * 3, 140 - i * 12, 3, i % 2 ? '#5a4a50' : '#6a5a60');
      L.push({ cv, p: 0.5, lanterns: [cx - 70, cx + 70, cx - 52, cx + 52] });
      [cv, c] = mkCanvas(STAGE_W, H);
      stoneFloor(c, STAGE_W, 226, ['#6a5a5e', '#5a4a50', '#4a3c42', '#3a2e34'], r);
      for (const x of [40, STAGE_W - 40]) { rect(c, x - 3, 160, 6, 68, '#2a1e22'); rect(c, x - 6, 156, 12, 6, '#4a3a3e'); rect(c, x - 7, 226, 14, 4, '#2a1e22'); }
      L.push({ cv, p: 1, torches: [40, STAGE_W - 40] });
      return { L, ground: 226 };
    },
    amb(g, t) {
      if (t % 9 === 0) FX.p('px', g.camX + rand(-20, W + 20), -4, rand(-0.6, -0.1), rand(0.3, 0.7), 400, choice(['#ff9ac0', '#ffc0d8', '#e86a9a']), 1, 0.0, { floor: true, drag: 1, sway: true });
      for (const x of this.data.L[3].torches) if (t % 2 === 0) FX.fire(x, 152, 2, 3, 1.2);
    },
    drawExtra(ctx, cx, t) {
      const Lm = this.data.L[2], off = -cx * 0.5;
      for (const lx of Lm.lanterns) { const sw = Math.sin(t * 0.04 + lx) * 1.5, y = 186; rect(ctx, off + lx + sw - 3, y, 6, 8, '#ff5a2a'); rect(ctx, off + lx + sw - 2, y + 1, 4, 6, '#ffc060'); ctx.globalAlpha = 0.25 + Math.sin(t * 0.2 + lx) * 0.05; pdisk(ctx, off + lx + sw, y + 4, 9, '#ffb060'); ctx.globalAlpha = 1; }
    }
  },
  {
    id: 'ice', name: 'Ледяная Цитадель',
    build() {
      const r = rng(23), L = [];
      let [cv, c] = mkCanvas(layerW(0.05), H);
      ditherV(c, 0, 0, cv.width, 220, ['#02040e', '#081430', '#12305a', '#1e5080', '#3a7aa8']);
      for (let i = 0; i < 160; i++) rect(c, r() * cv.width, r() * 150, 1, 1, r() < 0.2 ? '#ffffff' : '#8fb0d8');
      pdisk(c, 380, 50, 14, '#e8f4ff'); pdisk(c, 384, 47, 12, '#c8dcf0'); pdisk(c, 376, 46, 2, '#a8bcd8'); pdisk(c, 382, 54, 3, '#a8bcd8');
      L.push({ cv, p: 0.05, aurora: true });
      [cv, c] = mkCanvas(layerW(0.18), H);
      for (let k = 0; k < 2; k++) {
        const base = k ? 205 : 185, col = k ? '#5a8ab8' : '#3a5a88', snow = k ? '#e8f4ff' : '#b8d0ec';
        let x = -20; while (x < cv.width) { const w2 = 60 + r() * 80, hh = 50 + r() * 60 - k * 20; for (let i = 0; i < w2; i++) { const yy = base - hh * (1 - Math.abs(i - w2 / 2) / (w2 / 2)); rect(c, x + i, yy, 1, H - yy, col); if (i % 1 === 0 && yy < base - hh * 0.55) rect(c, x + i, yy, 1, 2 + (i % 3), snow); } x += w2 * 0.6; }
      }
      L.push({ cv, p: 0.18 });
      [cv, c] = mkCanvas(layerW(0.5), H);
      for (let i = 0; i < 9; i++) {
        const x = 30 + i * (cv.width - 60) / 8 + r() * 20, hh = 50 + r() * 70, w2 = 10 + r() * 8;
        c.fillStyle = '#2a6aa0'; c.beginPath(); for (let y = 0; y < hh; y++) { const ww = w2 * (y / hh); rect(c, x - ww / 2, 224 - hh + y, ww, 1, y % 7 === 0 ? '#9fdcff' : '#4a9ad0'); rect(c, x - ww / 2, 224 - hh + y, 1, 1, '#cfefff'); }
      }
      rect(c, 0, 214, cv.width, 12, '#3a6a98'); for (let x = 0; x < cv.width; x += 14) rect(c, x, 208 + (x * 7 % 5), 8, 8, '#5a8ab8');
      L.push({ cv, p: 0.5 });
      [cv, c] = mkCanvas(STAGE_W, H);
      stoneFloor(c, STAGE_W, 226, ['#d8eef8', '#b8dcf0', '#9ccae6', '#7ab0d8'], r);
      c.fillStyle = '#6aa0c8'; for (let i = 0; i < 30; i++) { let x = r() * STAGE_W, y = 230 + r() * 36; for (let j = 0; j < 8; j++) { c.fillRect(Math.round(x), Math.round(y), 1, 1); x += r() * 3 - 1; y += r() * 2 - 0.5; } }
      L.push({ cv, p: 1 });
      return { L };
    },
    amb(g, t) { if (t % 2 === 0) FX.p('snow', g.camX + rand(-30, W + 30), -3, rand(-0.4, 0.2), rand(0.4, 0.9), 400, Math.random() < 0.5 ? '#ffffff' : '#cfe6ff', Math.random() < 0.2 ? 2 : 1, 0); },
    drawFar(ctx, cx, t) {
      for (let k = 0; k < 3; k++) {
        const col = ['#2affb0', '#3ad8ff', '#a06aff'][k];
        ctx.globalAlpha = 0.16;
        for (let x = 0; x < W; x += 2) { const y = 40 + k * 14 + Math.sin(x * 0.02 + t * 0.01 + k) * 12 + Math.sin(x * 0.05 - t * 0.02) * 4; ctx.fillStyle = col; ctx.fillRect(x, Math.round(y), 2, 18 + Math.round(Math.sin(x * 0.03 + t * 0.015) * 8)); }
      }
      ctx.globalAlpha = 1;
    }
  },
  {
    id: 'city', name: 'Неоновый Город',
    build() {
      const r = rng(37), L = [];
      let [cv, c] = mkCanvas(layerW(0.05), H);
      ditherV(c, 0, 0, cv.width, 230, ['#05030c', '#120624', '#2a0a3e', '#5a1458', '#8a2a6a']);
      pdisk(c, 90, 60, 22, '#ffd0f0'); pdisk(c, 90, 60, 20, '#ffe8f8'); for (let i = 0; i < 6; i++) rect(c, 68, 52 + i * 5, 44, 1, '#e8b0d8');
      L.push({ cv, p: 0.05 });
      [cv, c] = mkCanvas(layerW(0.2), H);
      let x = 0; while (x < cv.width) { const w2 = 18 + r() * 30, hh = 70 + r() * 90; rect(c, x, 230 - hh, w2, hh, '#140a24'); for (let wy = 230 - hh + 4; wy < 228; wy += 5) for (let wx = x + 3; wx < x + w2 - 3; wx += 4) if (r() < 0.35) rect(c, wx, wy, 2, 2, r() < 0.5 ? '#ffd86a' : '#6ad8ff'); if (r() < 0.4) rect(c, x + w2 / 2, 230 - hh - 12, 1, 12, '#140a24'); x += w2 + 2; }
      L.push({ cv, p: 0.2 });
      [cv, c] = mkCanvas(layerW(0.5), H);
      const signs = [];
      x = -10; while (x < cv.width) {
        const w2 = 40 + r() * 46, hh = 90 + r() * 80; rect(c, x, 226 - hh, w2, hh, '#22122e'); rect(c, x, 226 - hh, 2, hh, '#3a2246');
        for (let wy = 226 - hh + 6; wy < 220; wy += 8) for (let wx = x + 5; wx < x + w2 - 5; wx += 7) rect(c, wx, wy, 4, 4, r() < 0.3 ? '#ffb86a' : '#1a0c22');
        if (r() < 0.75) signs.push({ x: x + 6 + r() * (w2 - 30), y: 226 - hh + 14 + r() * 40, txt: choice(['РАМЕН', 'БАР', 'КИБЕР', 'ОТЕЛЬ', 'НЕОН', '24/7', 'СУШИ']), col: choice(['#ff3aa8', '#3af0ff', '#ffe23a', '#7aff5a']) });
        x += w2 + 8;
      }
      L.push({ cv, p: 0.5, signs });
      [cv, c] = mkCanvas(STAGE_W, H);
      stoneFloor(c, STAGE_W, 226, ['#2a2234', '#221a2c', '#1a1424', '#14101c'], r);
      for (let i = 0; i < 9; i++) { const px = r() * STAGE_W, py = 236 + r() * 26; c.fillStyle = 'rgba(120,200,255,0.18)'; c.fillRect(Math.round(px), Math.round(py), 30 + Math.round(r() * 30), 2); }
      for (let i = 0; i < 4; i++) { const vx = 80 + i * 200; rect(c, vx, 206, 26, 20, '#3a3446'); rect(c, vx + 2, 208, 22, 2, '#5a5468'); rect(c, vx + 2, 213, 22, 2, '#5a5468'); rect(c, vx + 2, 218, 22, 2, '#5a5468'); }
      L.push({ cv, p: 1 });
      return { L };
    },
    amb(g, t) {
      for (let i = 0; i < 2; i++) FX.p('line', g.camX + rand(-20, W + 40), rand(-10, 200), -0.8, 7, 34, '#8ab0e8', randi(3, 6), 0);
      if (Math.random() < 0.003) { g.flashA = 0.5; Sound.play('thunder'); }
    },
    drawExtra(ctx, cx, t) {
      const Lm = this.data.L[2], off = -cx * 0.5;
      for (const s of Lm.signs) { const on = Math.sin(t * 0.05 + s.x) > -0.9 || (t % 7 > 3); if (!on) continue; const w2 = textWidth(s.txt) + 6; rect(ctx, off + s.x - 1, s.y - 1, w2 + 2, 11, s.col); rect(ctx, off + s.x, s.y, w2, 9, '#14081c'); drawText(ctx, s.txt, off + s.x + w2 / 2, s.y + 4.5, 1, s.col, 'center', null, null); }
    }
  },
  {
    id: 'beach', name: 'Пляж Брейнрота', farIdx: 1,
    build() {
      const r = rng(51), L = [];
      let [cv, c] = mkCanvas(layerW(0.05), H);
      ditherV(c, 0, 0, cv.width, 170, ['#2a6ad0', '#4a90e8', '#7ab8f8', '#b8e0ff', '#e8f6ff']);
      pdisk(c, 400, 40, 18, '#fff6c0'); pdisk(c, 400, 40, 14, '#ffffff');
      for (let i = 0; i < 7; i++) { const x = r() * cv.width, y = 20 + r() * 80; for (let j = 0; j < 5; j++) pdisk(c, x + j * 7, y - (j % 2) * 4, 6 + (j % 2) * 3, '#ffffff'); rect(c, x - 4, y + 3, 40, 3, '#d8ecff'); }
      L.push({ cv, p: 0.05 });
      [cv, c] = mkCanvas(layerW(0.15), H);
      rect(c, 0, 168, cv.width, 60, '#1a6ab0');
      const vx = cv.width * 0.7; for (let i = 0; i < 50; i++) rect(c, vx - 50 + i, 168 - i * 1.1, 100 - i * 2, 2, i > 44 ? '#5a3a2a' : '#4a7a3a');
      for (let i = 0; i < 12; i++) rect(c, vx - 30 + i * 5, 150 + (i % 3) * 4, 4, 5, choice(['#ffffff', '#ffd8a0', '#ff9a6a']));
      L.push({ cv, p: 0.15, sea: true });
      [cv, c] = mkCanvas(layerW(0.45), H);
      for (let i = 0; i < 5; i++) {
        const px = 30 + i * cv.width / 5 + r() * 30, hh = 70 + r() * 30, bend = (r() - 0.5) * 30;
        for (let y = 0; y < hh; y++) { const xx = px + bend * (y / hh) * (y / hh); rect(c, xx - 2, 224 - y, 5, 1, y % 5 === 0 ? '#6a4a2a' : '#8a6a3a'); }
        const tx = px + bend, ty = 224 - hh;
        for (let a = 0; a < 7; a++) { const ang = -Math.PI + a * Math.PI / 6 + 0.2; for (let l = 0; l < 26; l++) { const lx = tx + Math.cos(ang) * l, ly = ty + Math.sin(ang) * l * 0.5 + l * l * 0.03; rect(c, lx, ly, 3, 2, l > 20 ? '#4a9a3a' : '#2a7a2a'); } }
        pdisk(c, tx, ty + 3, 3, '#6a4a2a');
      }
      L.push({ cv, p: 0.45 });
      [cv, c] = mkCanvas(STAGE_W, H);
      for (let y = 222; y < H; y++) rect(c, 0, y, STAGE_W, 1, y < 228 ? '#f8e0a8' : y < 245 ? '#f0d090' : '#e0bc78');
      c.fillStyle = '#d0a868'; for (let i = 0; i < 400; i++) c.fillRect(Math.floor(r() * STAGE_W), 224 + Math.floor(r() * 46), 1, 1);
      for (let i = 0; i < 12; i++) { const sx = r() * STAGE_W, sy = 238 + r() * 28; rect(c, sx, sy, 3, 2, '#ffb0a0'); rect(c, sx + 1, sy - 1, 1, 1, '#ffffff'); }
      rect(c, 120, 170, 2, 58, '#5a4a3a'); for (let i = 0; i < 18; i++) rect(c, 121 - (18 - i) * 1.8, 170 + i * 0.6, (18 - i) * 3.6, 1, i % 4 < 2 ? '#e83a3a' : '#ffffff');
      rect(c, 640, 214, 40, 6, '#3a8ad8'); rect(c, 640, 214, 40, 2, '#5aaaf8'); rect(c, 676, 208, 6, 8, '#ffffff');
      L.push({ cv, p: 1 });
      return { L };
    },
    amb(g, t) { if (t % 240 === 0) g.stageState.fin = { x: g.camX * 0.15 - 30, t: 0 }; },
    drawFar(ctx, cx, t, g) {
      const off = -cx * 0.15;
      for (let i = 0; i < 10; i++) { const y = 172 + i * 5; for (let x = (t * (0.2 + i * 0.05)) % 24 - 24; x < W; x += 24) rect(ctx, x + i * 7, y, 10 + i, 1, i % 2 ? '#5ab0f0' : '#bfe6ff'); }
      const fin = g.stageState.fin;
      if (fin) { fin.t++; const fx = off + fin.x + fin.t * 0.6; if (fx > W + 20) g.stageState.fin = null; else { ctx.fillStyle = '#4a6a8a'; for (let i = 0; i < 8; i++) ctx.fillRect(Math.round(fx + i * 0.5), 196 - 8 + i, Math.max(1, 8 - i), 1); ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(fx) - 3, 197, 12, 1); } }
      for (let i = 0; i < 3; i++) { const gx = (t * 0.4 + i * 170) % (W + 40) - 20, gy = 60 + i * 18 + Math.sin(t * 0.05 + i) * 4, wf = (t >> 3) & 1; rect(ctx, gx, gy, 2, 1, '#ffffff'); rect(ctx, gx - 3, gy - wf, 3, 1, '#ffffff'); rect(ctx, gx + 2, gy - wf, 3, 1, '#ffffff'); }
    }
  },
  {
    id: 'pit', name: 'Мост над Бездной',
    build() {
      const r = rng(77), L = [];
      let [cv, c] = mkCanvas(layerW(0.06), H);
      ditherV(c, 0, 0, cv.width, H, ['#0a0408', '#1a080c', '#3a0e10', '#6a1a10', '#b8381a']);
      for (let i = 0; i < 80; i++) rect(c, r() * cv.width, r() * 120, 1, 1, '#5a2a2a');
      L.push({ cv, p: 0.06 });
      [cv, c] = mkCanvas(layerW(0.25), H);
      for (let k = 0; k < 2; k++) { let x = 0; while (x < cv.width) { const w2 = 8 + r() * 26, hh = 60 + r() * 120; const col = k ? '#1e0c10' : '#2e1418'; for (let y = 0; y < hh; y++) { const ww = w2 * (1 - y / hh * 0.8); rect(c, x + (w2 - ww) / 2, 250 - y - k * 10, ww, 1, col); } x += w2 * (0.7 + r()); } }
      L.push({ cv, p: 0.25 });
      [cv, c] = mkCanvas(layerW(0.55), H);
      for (let i = 0; i < 16; i++) { const x = r() * cv.width, len = 20 + r() * 80; for (let y = 0; y < len; y += 3) { rect(c, x, y, 2, 2, '#4a4048'); rect(c, x + 1, y + 1, 1, 1, '#7a7078'); } if (r() < 0.5) { pdisk(c, x + 1, len + 3, 3.5, '#d8d0c0'); rect(c, x - 1, len + 2, 1, 1, '#1a0a0a'); rect(c, x + 2, len + 2, 1, 1, '#1a0a0a'); } }
      for (let i = 0; i < 26; i++) { const x = r() * cv.width; for (let y = 0; y < 18; y++) rect(c, x - (18 - y) / 4, 240 - 18 + y, (18 - y) / 2, 1, '#3a2a30'); }
      L.push({ cv, p: 0.55 });
      [cv, c] = mkCanvas(STAGE_W, H);
      for (let y = 228; y < 252; y++) rect(c, 0, y, STAGE_W, 1, y < 230 ? '#7a6a6a' : y < 248 ? (y % 6 === 0 ? '#3a3034' : '#4e4246') : '#2a2024');
      for (let x = 0; x < STAGE_W; x += 22) { rect(c, x, 230, 1, 18, '#2a2024'); }
      for (let x = 10; x < STAGE_W; x += 44) { rect(c, x, 204, 4, 26, '#3a3034'); rect(c, x - 1, 202, 6, 3, '#5a5054'); }
      rect(c, 0, 210, STAGE_W, 2, '#5a4a40');
      L.push({ cv, p: 1, lava: true });
      return { L };
    },
    amb(g, t) { if (t % 3 === 0) FX.p('fire', g.camX + rand(0, W), H + 2, rand(-0.3, 0.3), -rand(0.6, 1.6), randi(60, 120), choice(['#ffb84a', '#ff6a1a', '#ffd86a']), 1, 0); },
    drawExtra(ctx, cx, t) {
      for (let x = 0; x < W; x += 2) { const y = 254 + Math.round(Math.sin(x * 0.07 + t * 0.06) * 2 + Math.sin(x * 0.13 - t * 0.04)); rect(ctx, x, y, 2, H - y, '#ff6a1a'); rect(ctx, x, y, 2, 1, '#ffd86a'); if ((x + t) % 40 < 6) rect(ctx, x, y + 3, 2, 2, '#ffd86a'); }
      ctx.globalAlpha = 0.1 + Math.sin(t * 0.05) * 0.04; rect(ctx, 0, 200, W, 70, '#ff4a1a'); ctx.globalAlpha = 1;
    }
  }
];
const Stage = {
  cur: null,
  set(i) { const s = STAGES[i]; if (!s.data) s.data = s.build(); this.cur = s; },
  drawBg(ctx, cx, t, g) {
    const s = this.cur, L = s.data.L;
    for (let i = 0; i < L.length; i++) {
      const l = L[i];
      if (l.p === 1) { if (s.drawExtraBehindFloor) s.drawExtraBehindFloor(ctx, cx, t, g); }
      ctx.drawImage(l.cv, -Math.round(cx * l.p), 0);
      if (i === (s.farIdx || 0) && s.drawFar) s.drawFar(ctx, cx, t, g);
      if (i === L.length - 2 && s.drawExtra && s.id !== 'pit') s.drawExtra(ctx, cx, t, g);
    }
    if (s.id === 'pit') s.drawExtra(ctx, cx, t, g);
  }
};

// ===================== Новые арены =====================
(function () {
  const R = Math.round, OL = '#0a0710';
  // дизеринговый градиент в произвольный прямоугольник (с сохранением прозрачности вокруг)
  function grad(c, x, y, w, h, cols) { w = R(w); h = R(h); if (w <= 0 || h <= 0) return; const [t, tc] = mkCanvas(w, h); ditherV(tc, 0, 0, w, h, cols); c.drawImage(t, R(x), R(y)); }
  // коробка с контуром, бликом и тенью
  function obox(c, x, y, w, h, col, ol = OL) { rect(c, x - 1, y - 1, w + 2, h + 2, ol); rect(c, x, y, w, h, col); rect(c, x, y, w, 1, shade(col, 0.3)); rect(c, x, y, 1, h, shade(col, 0.15)); rect(c, x, y + h - 1, w, 1, shade(col, -0.35)); rect(c, x + w - 1, y, 1, h, shade(col, -0.25)); }
  function speck(c, x, y, w, h, col, n, r, sz = 1) { c.fillStyle = col; for (let i = 0; i < n; i++) c.fillRect(Math.floor(x + r() * w), Math.floor(y + r() * h), sz, sz); }
  function tline(c, x0, y0, x1, y1, col, wd = 1) { const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); c.fillStyle = col; const o = (wd - 1) / 2; for (let i = 0; i <= n; i++) c.fillRect(R(x0 + (x1 - x0) * i / n - o), R(y0 + (y1 - y0) * i / n - o), R(wd), R(wd)); }
  // пиксельное свечение с упорядоченным дизерингом (кэш)
  const _gl = {};
  function glowSpr(rad, col, a = 0.5) {
    rad = R(rad); const k = rad + col + a; if (_gl[k]) return _gl[k];
    const s = rad * 2 + 1, [cv, c] = mkCanvas(s, s), img = c.createImageData(s, s), d = new Uint32Array(img.data.buffer);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const dd = Math.hypot(x - rad, y - rad) / rad; if (dd >= 1) continue;
      const v = (1 - dd) * (1 - dd) * 4, b = Math.floor(v), th = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
      const lv = Math.min(4, b + (v - b > th ? 1 : 0)); if (lv) d[y * s + x] = c32(col, R(lv / 4 * a * 255));
    }
    c.putImageData(img, 0, 0); return (_gl[k] = cv);
  }
  function glow(ctx, x, y, rad, col, a = 0.5, al = 1) { const g = glowSpr(rad, col, a); if (al !== 1) ctx.globalAlpha = clamp(al, 0, 1); ctx.drawImage(g, R(x - g.width / 2), R(y - g.height / 2)); ctx.globalAlpha = 1; }
  // пол в перспективе: дизеринг-градиент, швы, блики
  function pfloor(c, w, y0, cols, o = {}) {
    grad(c, 0, y0, w, H - y0, cols);
    const sp = o.sp || 36, k = o.k || 60;
    c.fillStyle = o.seam || 'rgba(0,0,0,0.28)';
    if (o.h !== false) { let y = y0 + 3, hh = o.hh || 4; while (y < H) { c.fillRect(0, y, w, 1); y += hh; hh += o.hg || 2; } }
    if (o.v !== false) for (let x = -400; x < w + 400; x += sp) for (let yy = y0; yy < H; yy++) { const xx = x + (x - w / 2) * (yy - y0) / k; c.fillRect(R(xx), yy, 1, 1); }
    if (o.r) { c.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 260; i++) c.fillRect(Math.floor(o.r() * w), y0 + Math.floor(o.r() * (H - y0)), 2, 1); }
    rect(c, 0, y0, w, 1, o.hi || 'rgba(255,255,255,0.2)');
  }
  function dummy() { return { cv: mkCanvas(1, 1)[0], p: 1 }; }
  // плавный шум для процедурных текстур
  function vnoise(seed, N = 64) {
    const r = rng(seed), g = new Float32Array(N * N); for (let i = 0; i < g.length; i++) g[i] = r();
    const f = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); const a = (xx, yy) => g[((yy % N + N) % N) * N + ((xx % N + N) % N)]; return lerp(lerp(a(xi, yi), a(xi + 1, yi), sx), lerp(a(xi, yi + 1), a(xi + 1, yi + 1), sx), sy); };
    return (x, y) => f(x, y) * 0.5 + f(x * 2.1, y * 2.1) * 0.3 + f(x * 4.3, y * 4.3) * 0.2;
  }
  // мёртвое дерево — рекурсивные ветви
  function branch(c, x, y, len, ang, wd, depth, col, r) {
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    tline(c, x, y, x2, y2, col, Math.max(1, wd));
    if (depth <= 0 || len < 3) return;
    const n = 2 + (r() < 0.3 ? 1 : 0);
    for (let i = 0; i < n; i++) branch(c, x2, y2, len * (0.58 + r() * 0.22), ang + (i - (n - 1) / 2) * 0.62 + (r() - 0.5) * 0.6, wd * 0.62, depth - 1, col, r);
  }
  // пальма
  function palm(c, px, base, hh, bend, r, tc = ['#7a5a32', '#5a3e22'], lc = ['#2a6a2a', '#3a8a32', '#5aa83a']) {
    for (let y = 0; y < hh; y++) { const t = y / hh, xx = px + bend * t * t; rect(c, xx - 2, base - y, 5, 1, (y >> 1) % 3 === 0 ? tc[1] : tc[0]); rect(c, xx - 2, base - y, 1, 1, '#3a2814'); rect(c, xx + 2, base - y, 1, 1, shade(tc[0], 0.25)); }
    const tx = px + bend, ty = base - hh;
    for (let a = 0; a < 9; a++) {
      const ang = -Math.PI - 0.15 + a * (Math.PI + 0.3) / 8, ln = 22 + r() * 10;
      for (let l = 0; l < ln; l++) { const lx = tx + Math.cos(ang) * l, ly = ty + Math.sin(ang) * l * 0.55 + l * l * 0.028; rect(c, lx, ly, 2, 2, lc[l > ln * 0.7 ? 2 : l > ln * 0.3 ? 1 : 0]); if (l % 3 === 0 && l > 4) { rect(c, lx, ly + 2, 1, 2 + (l >> 3), lc[0]); } }
    }
    pdisk(c, tx - 2, ty + 3, 2, '#4a3014'); pdisk(c, tx + 2, ty + 4, 2, '#5a3a18');
  }

  // ---------------------------------------------------------------- 1. МЕТРО
  function mkTrain() {
    const carW = 196, gap = 8, n = 3, tw = n * carW + (n - 1) * gap, th = 98;
    const [cv, c] = mkCanvas(tw + 4, th);
    for (let i = 0; i < n; i++) {
      const x0 = i * (carW + gap) + 2;
      rect(c, x0 + 2, 0, carW - 4, 2, '#5a6068'); rect(c, x0, 2, carW, 6, '#8a929c'); rect(c, x0, 2, carW, 1, '#b8c0c8');
      grad(c, x0, 8, carW, 56, ['#3a6ec0', '#2c5aa6', '#244c92']);
      rect(c, x0, 8, carW, 1, '#6a9ae0');
      rect(c, x0, 60, carW, 6, '#e0e4ec'); rect(c, x0, 61, carW, 1, '#ffffff'); rect(c, x0, 65, carW, 1, '#8a909c');
      grad(c, x0, 66, carW, 16, ['#1e3f7a', '#162e5a']);
      rect(c, x0, 8, 1, 74, OL); rect(c, x0 + carW - 1, 8, 1, 74, OL); rect(c, x0, 81, carW, 1, OL);
      const doors = [x0 + 38, x0 + carW - 58];
      for (const dx of doors) {
        obox(c, dx, 12, 20, 68, '#3266b4', '#16305e'); rect(c, dx + 9, 12, 2, 68, '#16305e');
        for (const wx of [dx + 3, dx + 12]) { rect(c, wx, 20, 5, 26, '#fff0b0'); rect(c, wx, 20, 5, 3, '#fffbe0'); rect(c, wx, 43, 5, 3, '#e8c870'); }
      }
      for (let wx = x0 + 6; wx < x0 + carW - 22; wx += 26) {
        if (doors.some(dx => wx + 22 > dx - 2 && wx < dx + 22)) continue;
        rect(c, wx - 1, 17, 24, 30, '#14284a'); grad(c, wx, 18, 22, 28, ['#fff6c8', '#ffe896', '#f0c860']);
        if ((wx * 7 + i * 13) % 3) { const hx = wx + 4 + (wx * 3 % 12); pdisk(c, hx, 30, 3, '#6a5040'); rect(c, hx - 5, 34, 11, 12, '#7a5a8a'); }
        rect(c, wx, 18, 22, 1, '#ffffff'); rect(c, wx, 31, 22, 1, '#d8b860');
      }
      rect(c, x0 + 4, 84, carW - 8, 8, '#18181c');
      for (const bx of [x0 + 26, x0 + 46, x0 + carW - 46, x0 + carW - 26]) { pdisk(c, bx, 90, 6, '#2a2a30'); pdisk(c, bx, 90, 3, '#4a4a52'); rect(c, bx - 1, 89, 2, 2, '#7a7a84'); }
      rect(c, x0 + 60, 82, carW - 120, 6, '#222228'); rect(c, x0 + 64, 84, 10, 4, '#3a3a42'); rect(c, x0 + carW - 74, 84, 10, 4, '#3a3a42');
      if (i < n - 1) { rect(c, x0 + carW, 30, gap, 40, '#18181e'); for (let k = 0; k < 40; k += 4) rect(c, x0 + carW, 30 + k, gap, 2, '#2e2e36'); }
    }
    // кабина головного вагона
    rect(c, 2, 8, 30, 52, '#18304e'); grad(c, 4, 16, 24, 26, ['#2a5a8a', '#9ad0ff', '#4a7ab0']); rect(c, 4, 16, 24, 1, '#d8f0ff');
    obox(c, 4, 64, 6, 4, '#fff8d0'); obox(c, 20, 64, 6, 4, '#fff8d0');
    drawText(c, '7', 16, 51, 1, '#ffe23a', 'center', '#000', null);
    obox(c, tw - 6, 64, 4, 4, '#ff2a2a');
    return cv;
  }
  const metro = {
    id: 'metro', name: 'Метро', farIdx: 0,
    build() {
      const r = rng(1001), L = [];
      // дальняя стена с плиткой
      let [cv, c] = mkCanvas(layerW(0.45), H); let w = cv.width;
      grad(c, 0, 0, w, 46, ['#07080b', '#11131a', '#1c2029', '#2a2f3a']);
      for (let x = 10; x < w; x += 56) { rect(c, x, 0, 7, 46, '#0a0b0f'); rect(c, x + 7, 0, 1, 46, '#353a46'); }
      rect(c, 0, 42, w, 5, '#40454f'); rect(c, 0, 42, w, 1, '#6a707c'); rect(c, 0, 47, w, 2, '#14161c');
      const tileCol = ['#d6d2c2', '#cfcbba', '#dbd8c8', '#c9c5b3'], bandCol = ['#2a6a54', '#24604c', '#307660'];
      for (let y = 49; y < 192; y += 6) for (let x = (y / 6 & 1) * 5; x < w; x += 10) {
        const band = (y >= 61 && y < 73) || (y >= 163 && y < 175);
        rect(c, x - 10, y, 10, 6, '#8e8a7c'); rect(c, x - 9, y, 9, 5, band ? bandCol[(r() * 3) | 0] : tileCol[(r() * 4) | 0]);
        if (r() < 0.25) rect(c, x - 9, y, 9, 1, band ? '#3a8a6e' : '#ece8da');
      }
      for (let y = 120; y < 192; y += 2) { c.globalAlpha = (y - 120) / 72 * 0.45; rect(c, 0, y, w, 2, '#2a241c'); } c.globalAlpha = 1;
      speck(c, 0, 140, w, 52, '#6a604c', 260, r);
      for (let x = 30; x < w; x += 112) { c.drawImage(glowSpr(46, '#fff4d8', 0.22), x - 46, 26); }
      // таблички станции
      const plate = (px) => { obox(c, px - 84, 86, 168, 22, '#14241e', '#060a08'); rect(c, px - 82, 88, 164, 1, '#3a5a4e'); drawText(c, 'БРЕЙНРОТСКАЯ', px, 97, 2, ['#fff4c8', '#d8c088'], 'center', '#000', null); };
      plate(w * 0.27); plate(w * 0.77);
      // постеры
      const poster = (px, kind) => {
        obox(c, px, 82, 44, 58, '#7a7a80', '#1a1a1e'); const x = px + 3, y = 85;
        if (kind === 0) { grad(c, x, y, 38, 52, ['#ffd23a', '#ff9a2a']); rect(c, x + 14, y + 14, 10, 28, '#8a5a2a'); rect(c, x + 14, y + 14, 10, 2, '#c08a4a'); rect(c, x + 16, y + 20, 2, 2, '#000'); rect(c, x + 20, y + 20, 2, 2, '#000'); rect(c, x + 6, y + 28, 8, 2, '#8a5a2a'); drawText(c, 'ТУН ТУН', x + 19, y + 7, 1, '#ffffff', 'center', '#3a1a00', null); }
        else if (kind === 1) { rect(c, x, y, 38, 52, '#f2f0e8'); const lc = ['#e83a3a', '#2a8a3a', '#2a5ad8', '#e8a020', '#8a3ab0']; for (let k = 0; k < 5; k++) { let lx = x + 4, ly = y + 6 + k * 9; for (let s = 0; s < 6; s++) { const nx = lx + 5 + r() * 2, ny = clamp(ly + (r() - 0.5) * 10, y + 3, y + 48); tline(c, lx, ly, nx, ny, lc[k], 2); lx = nx; ly = ny; } } for (let k = 0; k < 8; k++) obox(c, x + 4 + r() * 30, y + 4 + r() * 42, 2, 2, '#ffffff', '#000'); }
        else { grad(c, x, y, 38, 52, ['#3a1a6a', '#8a2a9a', '#ff6ab0']); pdisk(c, x + 19, y + 24, 9, '#ffe0f0'); pdisk(c, x + 19, y + 24, 6, '#ff9ad0'); rect(c, x + 16, y + 22, 2, 2, '#2a0a2a'); rect(c, x + 21, y + 22, 2, 2, '#2a0a2a'); drawText(c, 'КИНО', x + 19, y + 44, 1, '#ffffff', 'center', '#2a0a3a', null); }
        rect(c, x, y, 38, 1, 'rgba(255,255,255,0.4)'); c.globalAlpha = 0.18; for (let k = 0; k < 8; k++) rect(c, x + 4 + k * 4, y + 2 + k * 6, 6, 1, '#ffffff'); c.globalAlpha = 1;
      };
      poster(w * 0.02 + 6, 0); poster(w * 0.52 - 22, 1); poster(w * 0.95 - 30, 2);
      obox(c, w * 0.52 - 20, 60, 40, 10, '#101010', '#3a3a3a'); drawText(c, '12:34', w * 0.52, 65, 1, '#ff3a2a', 'center', '#3a0000', null);
      // кабели и пути
      for (let k = 0; k < 4; k++) { const yy = 180 + k * 3; for (let x = 0; x < w; x++) rect(c, x, yy + R(Math.sin(x * 0.05 + k) * 1.2), 1, 1, k % 2 ? '#141418' : '#22222a'); }
      grad(c, 0, 192, w, 34, ['#1a1a1e', '#0e0e10', '#08080a']);
      rect(c, 0, 192, w, 2, '#3a3a40');
      speck(c, 0, 200, w, 26, '#2a2622', 500, r);
      for (let x = 0; x < w; x += 9) rect(c, x, 208, 5, 14, '#2a1e16');
      rect(c, 0, 206, w, 3, '#4a4a52'); rect(c, 0, 206, w, 1, '#a8acb4'); rect(c, 0, 216, w, 3, '#4a4a52'); rect(c, 0, 216, w, 1, '#a8acb4');
      rect(c, 0, 199, w, 2, '#3a3020'); rect(c, 0, 199, w, 1, '#6a5a3a');
      L.push({ cv, p: 0.45 });
      // колонны и балка с лампами
      [cv, c] = mkCanvas(layerW(0.75), H); w = cv.width;
      grad(c, 0, 0, w, 12, ['#2a2e38', '#1a1d24']); rect(c, 0, 12, w, 2, '#0c0d10'); rect(c, 0, 0, w, 1, '#4a505c');
      const lamps = [];
      for (let x = 40; x < w; x += 150) {
        const cw = 28;
        rect(c, x - 2, 0, cw + 4, 224, OL);
        grad(c, x, 18, cw, 192, ['#c8c0b0', '#b8b0a0', '#a89e8c']);
        rect(c, x, 18, 3, 192, '#e0dace'); rect(c, x + cw - 6, 18, 6, 192, '#7a7264'); rect(c, x + cw - 2, 18, 2, 192, '#5a5448');
        for (let v = 0; v < 6; v++) { let vx = x + 4 + r() * (cw - 10), vy = 20 + r() * 150; for (let s = 0; s < 14; s++) { rect(c, vx, vy, 1, 1, '#8a8274'); vx += (r() - 0.5) * 2; vy += 1 + r() * 2; } }
        obox(c, x - 4, 12, cw + 8, 8, '#d8d0c0'); obox(c, x - 2, 20, cw + 4, 3, '#b8b0a0');
        obox(c, x - 3, 206, cw + 6, 18, '#3a3634'); rect(c, x - 3, 210, cw + 6, 1, '#5a5650');
        lamps.push(x + cw / 2 + 75);
      }
      for (const lx of lamps) { rect(c, lx - 1, 12, 2, 8, '#14161a'); obox(c, lx - 16, 20, 32, 4, '#4a505a'); }
      L.push({ cv, p: 0.75, lamps });
      // перрон
      [cv, c] = mkCanvas(STAGE_W, H);
      pfloor(c, STAGE_W, 230, ['#7a7672', '#66625e', '#55524e', '#46433f'], { sp: 40, r });
      for (let i = 0; i < 40; i++) { let vx = r() * STAGE_W, vy = 232 + r() * 36; for (let s = 0; s < 10; s++) { rect(c, vx, vy, 1, 1, 'rgba(255,255,255,0.12)'); vx += 1 + r() * 2; vy += (r() - 0.5) * 2; } }
      for (let x = 20; x < STAGE_W; x += 150) { c.globalAlpha = 0.12; for (let y = 232; y < H; y += 2) rect(c, x + (x - 400) * (y - 230) / 120, y, 14, 1, '#fff8e0'); c.globalAlpha = 1; }
      rect(c, 0, 219, STAGE_W, 1, '#2a2a2a'); rect(c, 0, 220, STAGE_W, 2, '#b8b4a8'); rect(c, 0, 222, STAGE_W, 2, '#6a665e');
      rect(c, 0, 224, STAGE_W, 6, '#e8bc2a'); rect(c, 0, 224, STAGE_W, 1, '#fff07a'); rect(c, 0, 229, STAGE_W, 1, '#a07a10');
      for (let x = 1; x < STAGE_W; x += 3) { rect(c, x, 226, 1, 1, '#b08a18'); rect(c, x + 1, 228, 1, 1, '#b08a18'); }
      // урны и скамьи по краям
      for (const bx of [24, STAGE_W - 56]) { obox(c, bx, 212, 32, 4, '#8a5a32'); obox(c, bx + 2, 205, 28, 3, '#9a6a3a'); rect(c, bx + 3, 216, 3, 12, '#2a2a2e'); rect(c, bx + 26, 216, 3, 12, '#2a2a2e'); }
      L.push({ cv, p: 1 });
      return { L, train: mkTrain() };
    },
    amb(g, t) {
      const s = g.stageState;
      if (!s.train && t % 640 === 340) s.train = { x: g.camX * 0.6 + W + 30 };
      if (s.train) {
        s.train.x -= 15;
        if (s.train.x + this.data.train.width < g.camX * 0.6 - 40) s.train = null;
        else if (t % 3 === 0) FX.p('px', g.camX + rand(0, W), rand(200, 240), -rand(1.5, 3.5), -rand(0, 0.4), 50, choice(['#c8c0a8', '#8a8478', '#e8e0d0']), 1, 0.02, { fade: true });
      }
      if (t % 5 === 0) FX.p('smoke', g.camX + rand(0, W), rand(30, 200), rand(-0.1, 0.1), rand(-0.05, 0.05), 80, '#a8a090', 1, 0);
    },
    drawFar(ctx, cx, t, g) {
      const s = g.stageState.train;
      if (s) {
        const x = R(s.x - cx * 0.6); ctx.drawImage(this.data.train, x, 118);
        glow(ctx, x - 6, 184, 40, '#fff6c8', 0.35);
        ctx.globalAlpha = 0.25; for (let i = 0; i < 6; i++) rect(ctx, x + this.data.train.width + i * 18, 130 + i * 12, 30 + i * 10, 1, '#c8d0e0'); ctx.globalAlpha = 1;
      }
    },
    drawExtra(ctx, cx, t) {
      const off = -cx * 0.75;
      this.data.L[1].lamps.forEach((lx, i) => {
        const flick = i === 2 ? (((t >> 2) * 2654435761 >>> 0) % 7 < 2 || (t % 300 < 30 && t % 6 < 3)) : (i === 4 && (t % 420) < 12 && t % 4 < 2);
        const x = R(off + lx);
        if (x < -40 || x > W + 40) return;
        rect(ctx, x - 14, 24, 28, 2, flick ? '#5a6262' : '#f4fff8');
        if (!flick) glow(ctx, x, 26, 30, '#e8fff0', 0.3);
      });
    }
  };

  // ---------------------------------------------------------------- 2. АРКАДНЫЙ КЛУБ
  function neon(txt, s, col) {
    const sp = textSprite(txt, s, ['#ffffff', col], null, null), pad = 6;
    const [cv, c] = mkCanvas(sp.width + pad * 2, sp.height + pad * 2);
    const tint = textSprite(txt, s, col, null, null);
    c.globalAlpha = 0.09; for (let dy = -4; dy <= 4; dy += 2) for (let dx = -4; dx <= 4; dx += 2) if (dx * dx + dy * dy <= 20) c.drawImage(tint, pad + dx, pad + dy);
    c.globalAlpha = 1; c.drawImage(sp, pad, pad); return cv;
  }
  const CAB_COLS = [['#d8283a', '#ffe23a'], ['#2a4ad8', '#3af0ff'], ['#2a9a3a', '#ffe23a'], ['#8a2ad8', '#ff6ad8'], ['#e87a1a', '#ffffff'], ['#1a1a2a', '#3aff8a']];
  function cabinet(c, x, base, s, col, r, list, kind) {
    const cw = R(40 * s), ch = R(108 * s), y = base - ch;
    rect(c, x - 1, y - 1, cw + 2, ch + 1, OL);
    grad(c, x, y, cw, ch, [col[0], shade(col[0], -0.3), shade(col[0], -0.55)]);
    rect(c, x, y, 2, ch, shade(col[0], 0.25)); rect(c, x + cw - 3, y, 3, ch, shade(col[0], -0.6));
    const mh = R(14 * s); obox(c, x + 2, y + 2, cw - 4, mh, col[1]);
    for (let k = 0; k < 4; k++) rect(c, x + 4 + r() * (cw - 12), y + 4 + r() * (mh - 5), R(3 * s) + 1, 2, shade(col[1], -0.4 - r() * 0.3));
    const sx = x + R(5 * s), sy = y + mh + R(6 * s), sw = cw - R(10 * s), sh = R(30 * s);
    rect(c, sx - 2, sy - 2, sw + 4, sh + 4, '#101018'); rect(c, sx - 1, sy - 1, sw + 2, sh + 2, '#2a2a36');
    rect(c, sx, sy, sw, sh, '#02040a');
    list.push({ x: sx, y: sy, w: sw, h: sh, k: kind });
    const py = sy + sh + R(6 * s);
    rect(c, x - 2, py, cw + 4, R(10 * s), '#1a1a22'); rect(c, x - 2, py, cw + 4, 1, '#5a5a6a');
    rect(c, x + R(8 * s), py + 2, 2, R(5 * s), '#2a2a2a'); pdisk(c, x + R(9 * s), py + 1, Math.max(1, 2 * s), '#e83a3a');
    for (let b = 0; b < 3; b++) pdisk(c, x + R((20 + b * 6) * s), py + R(4 * s), Math.max(1, 1.5 * s), ['#ffe23a', '#3af0ff', '#ff3aa8'][b]);
    const dy = py + R(18 * s); obox(c, x + R(12 * s), dy, R(16 * s), R(14 * s), shade(col[0], -0.6));
    rect(c, x + R(15 * s), dy + 3, 2, R(3 * s), '#ff3a2a'); rect(c, x + R(22 * s), dy + 3, 2, R(3 * s), '#ff3a2a');
  }
  function claw(c, x, base, r) {
    const cw = 52, ch = 116, y = base - ch;
    obox(c, x, y, cw, 16, '#ff6ad8'); drawText(c, 'ПРИЗ', x + cw / 2, y + 8, 1, '#ffffff', 'center', '#6a0a5a', null);
    rect(c, x - 1, y + 16, cw + 2, 62, OL); grad(c, x, y + 16, cw, 62, ['#2a3a6a', '#1a2448']);
    for (let i = 0; i < 9; i++) { const tx = x + 6 + r() * (cw - 14), ty = y + 62 + r() * 12; pdisk(c, tx, ty, 4, choice(['#ffd23a', '#ff6a8a', '#6ad8ff', '#8aff6a', '#c08a5a'])); rect(c, tx - 2, ty - 1, 1, 1, '#000'); rect(c, tx + 1, ty - 1, 1, 1, '#000'); }
    rect(c, x + 24, y + 18, 2, 18, '#c8c8d0'); rect(c, x + 20, y + 36, 10, 2, '#e8e8f0'); rect(c, x + 19, y + 38, 2, 5, '#e8e8f0'); rect(c, x + 29, y + 38, 2, 5, '#e8e8f0');
    c.globalAlpha = 0.22; for (let k = 0; k < 4; k++) tline(c, x + 4 + k * 4, y + 60, x + 16 + k * 4, y + 20, '#ffffff'); c.globalAlpha = 1;
    rect(c, x + 1, y + 18, 2, 58, '#c8d8ff');
    obox(c, x, y + 78, cw, 38, '#ff6ad8'); rect(c, x + 4, y + 84, cw - 8, 10, '#3a0a3a'); obox(c, x + 6, y + 98, 12, 10, '#1a0a1a');
    pdisk(c, x + 38, y + 88, 3, '#ffe23a');
  }
  function screen(ctx, x, y, w, h, k, t) {
    const T = t + k * 37;
    switch (k % 5) {
      case 0: { rect(ctx, x, y, w, h, '#000814'); const ox = ((T >> 4) % 4); for (let j = 0; j < 3; j++) for (let i = 0; i < Math.floor(w / 4) - 1; i++) rect(ctx, x + 1 + ox + i * 4, y + 2 + j * 3, 2, 2, ['#ff3aa8', '#3af0ff', '#7aff5a'][j]); const px = x + 2 + Math.abs(((T >> 1) % (2 * (w - 6))) - (w - 6)); rect(ctx, px, y + h - 3, 4, 2, '#7aff5a'); rect(ctx, px + 1, y + h - 4 - ((T * 2) % (h - 6)), 1, 2, '#ffffff'); break; }
      case 1: { rect(ctx, x, y, w, h, '#000000'); for (let yy = 0; yy < h; yy += 3) rect(ctx, x + (w >> 1), y + yy, 1, 2, '#5a5a5a'); const bx = Math.abs((T % (2 * (w - 2))) - (w - 2)), by = Math.abs(((T * 0.7 | 0) % (2 * (h - 2))) - (h - 2)); rect(ctx, x + bx, y + by, 2, 2, '#ffffff'); rect(ctx, x + 1, y + clamp(by - 3, 0, h - 7), 1, 7, '#ffffff'); rect(ctx, x + w - 2, y + clamp(by - 2, 0, h - 7), 1, 7, '#ffffff'); break; }
      case 2: { rect(ctx, x, y, w, h, '#1a7a2a'); rect(ctx, x, y, w, 3, '#3a8aff'); const m = x + (w >> 1); for (let yy = 3; yy < h; yy++) { const hw = 2 + (yy * (w * 0.4)) / h; rect(ctx, m - hw, y + yy, hw * 2, 1, '#5a5a62'); if (((yy + (T >> 1)) % 6) < 2) rect(ctx, m, y + yy, 1, 1, '#ffffff'); } rect(ctx, m - 3 + R(Math.sin(T * 0.05) * 2), y + h - 5, 6, 4, '#ff2a2a'); break; }
      case 3: { rect(ctx, x, y, w, h, '#0a0a2a'); const cols = ['#ff3a3a', '#3aff6a', '#3a8aff', '#ffe23a', '#ff8a2a']; for (let i = 0; i < w - 2; i += 3) { const hh = ((i * 7 + k) % 4) + 1; rect(ctx, x + 1 + i, y + h - hh * 3, 3, hh * 3, cols[(i + k) % 5]); } const fy = (T >> 3) % (h - 12); rect(ctx, x + (w >> 1) - 3, y + fy, 6, 3, '#c83aff'); rect(ctx, x + (w >> 1), y + fy + 3, 3, 3, '#c83aff'); break; }
      case 4: { const cols = ['#ff3aa8', '#ffe23a', '#3af0ff', '#7aff5a', '#8a3aff']; for (let i = 0; i < h; i += 2) rect(ctx, x, y + i, w, 2, cols[((i >> 1) + (T >> 3)) % 5]); if ((T >> 5) & 1) { rect(ctx, x + 2, y + (h >> 1) - 3, w - 4, 7, '#000'); rect(ctx, x + 4, y + (h >> 1) - 1, w - 8, 3, '#ffffff'); } break; }
    }
    rect(ctx, x, y, 2, 1, 'rgba(255,255,255,0.6)');
  }
  const arcade = {
    id: 'arcade', name: 'Аркадный клуб', farIdx: 1,
    build() {
      const r = rng(2002), L = [];
      let [cv, c] = mkCanvas(layerW(0.1), H); let w = cv.width;
      grad(c, 0, 0, w, 226, ['#06030c', '#0e0620', '#170a2c', '#20103a', '#281444']);
      c.fillStyle = 'rgba(0,0,0,0.22)'; for (let y = 24; y < 226; y += 6) { c.fillRect(0, y, w, 1); for (let x = (y / 6 & 1) * 7; x < w; x += 14) c.fillRect(x, y, 1, 6); }
      rect(c, 0, 0, w, 20, '#0a0612'); for (let x = 0; x < w; x += 24) { tline(c, x, 0, x + 12, 18, '#2a2238'); tline(c, x + 24, 0, x + 12, 18, '#2a2238'); } rect(c, 0, 18, w, 2, '#3a3048');
      for (let x = 40; x < w; x += 96) { obox(c, x - 3, 20, 6, 5, '#4a4458'); c.drawImage(glowSpr(36, '#a06aff', 0.18), x - 36, 8); }
      const signs = [];
      const addSign = (txt, s, col, x, y) => { const on = neon(txt, s, col); const off = textSprite(txt, s, shade(col, -0.65), null, null); c.drawImage(off, R(x - off.width / 2), R(y - off.height / 2)); signs.push({ cv: on, x: R(x - on.width / 2), y: R(y - on.height / 2), ph: signs.length }); };
      addSign('АРКАДА', 3, '#ff3aa8', w * 0.5, 48); addSign('ИГРЫ 24/7', 2, '#3af0ff', w * 0.16, 62); addSign('8-БИТ', 2, '#ffe23a', w * 0.84, 60);
      addSign('ВСТАВЬ МОНЕТУ', 1, '#7aff5a', w * 0.5, 74);
      L.push({ cv, p: 0.1, signs });
      // задний ряд автоматов
      [cv, c] = mkCanvas(layerW(0.3), H); w = cv.width; const back = [];
      rect(c, 0, 206, w, 20, '#120a1e');
      for (let x = 4, i = 0; x < w - 30; x += 30, i++) cabinet(c, x, 212, 0.66, CAB_COLS[(i * 5 + 1) % 6], r, back, i * 3 + 1);
      c.globalAlpha = 0.3; rect(c, 0, 0, w, H, '#0a0418'); c.globalAlpha = 1;
      L.push({ cv, p: 0.3, scr: back });
      // передний ряд
      [cv, c] = mkCanvas(layerW(0.6), H); w = cv.width; const front = [];
      const slots = [10, 54, 300, 344, 560, 604];
      slots.forEach((x, i) => { if (x + 44 < w) cabinet(c, x, 222, 1, CAB_COLS[(i * 2 + 1) % 6], r, front, i * 2); });
      claw(c, 142, 222, r); claw(c, 462, 222, r);
      c.drawImage(glowSpr(24, '#ff6ad8', 0.2), 144, 196); c.drawImage(glowSpr(24, '#ff6ad8', 0.2), 464, 196);
      L.push({ cv, p: 0.6, scr: front });
      // ковролин
      [cv, c] = mkCanvas(STAGE_W, H);
      const P = 48, pat = new Uint32Array(P * P), bg = c32('#1a1232'), bg2 = c32('#140e28'), pc = ['#ff3aa8', '#3af0ff', '#ffe23a', '#7aff5a', '#8a5aff'].map(x => c32(x));
      for (let i = 0; i < P * P; i++) pat[i] = ((i % P) + ((i / P) | 0)) % 4 ? bg : bg2;
      const put = (x, y, col) => { pat[((y % P + P) % P) * P + ((x % P + P) % P)] = col; };
      for (let i = 0; i < 8; i++) {
        const cx0 = ((i % 4) * 12 + (r() * 6) | 0), cy0 = ((i >> 2) * 24 + (r() * 10) | 0), col = pc[i % 5], kind = i % 4;
        if (kind === 0) for (let j = 0; j < 7; j++) for (let q = 0; q <= j; q++) if (q === 0 || q === j || j === 6) { put(cx0 + q, cy0 + j, col); put(cx0 + q + 1, cy0 + j, col); }
        if (kind === 1) for (let j = 0; j < 10; j++) { const yy = cy0 + R(Math.sin(j * 0.8) * 2); put(cx0 + j, yy, col); put(cx0 + j, yy + 1, col); }
        if (kind === 2) for (let a = 0; a < 24; a++) { put(cx0 + R(Math.cos(a / 24 * 6.283) * 3.5), cy0 + R(Math.sin(a / 24 * 6.283) * 3.5), col); }
        if (kind === 3) for (let j = 0; j < 6; j++) { put(cx0 + j, cy0 + j, col); put(cx0 + 5 - j, cy0 + j, col); }
      }
      const y0 = 222, img = c.createImageData(STAGE_W, H - y0), d = new Uint32Array(img.data.buffer);
      let v = 0;
      for (let j = 0; j < H - y0; j++) {
        const sc = 0.7 + j / (H - y0) * 0.8; v += 0.75 / sc;
        for (let x = 0; x < STAGE_W; x++) { const u = (x - STAGE_W / 2) / sc + 4800; d[j * STAGE_W + x] = pat[((v | 0) % P) * P + ((u | 0) % P)]; }
      }
      c.putImageData(img, 0, y0);
      c.globalAlpha = 0.35; grad(c, 0, y0, STAGE_W, 14, ['#000000', '#141026']); c.globalAlpha = 1;
      rect(c, 0, y0, STAGE_W, 2, '#3a2a5a'); rect(c, 0, y0, STAGE_W, 1, '#8a6aff');
      for (let x = 0; x < STAGE_W; x += 44) c.drawImage(glowSpr(26, '#6ad8ff', 0.12), x, 210);
      L.push({ cv, p: 1 });
      return { L };
    },
    drawFar(ctx, cx, t) {
      const L0 = this.data.L[0], o0 = -R(cx * 0.1);
      for (const s of L0.signs) { const on = ((t + s.ph * 97 + 150) % 400) > 14 || ((t >> 1) & 1); if (on) ctx.drawImage(s.cv, o0 + s.x, s.y); }
      const L1 = this.data.L[1], o1 = -R(cx * 0.3);
      for (const s of L1.scr) { const x = o1 + s.x; if (x > -20 && x < W) { screen(ctx, x, s.y, s.w, s.h, s.k, t); ctx.globalAlpha = 0.3; rect(ctx, x, s.y, s.w, s.h, '#0a0418'); ctx.globalAlpha = 1; } }
    },
    drawExtra(ctx, cx, t) {
      const L2 = this.data.L[2], o = -R(cx * 0.6);
      for (const s of L2.scr) { const x = o + s.x; if (x > -40 && x < W) { screen(ctx, x, s.y, s.w, s.h, s.k, t); glow(ctx, x + s.w / 2, s.y + s.h / 2, 26, '#8ad8ff', 0.14); } }
    }
  };

  // ---------------------------------------------------------------- 3. КРЫША НЕБОСКРЁБА
  function skyline(c, w, base, minH, maxH, col, winCols, r, wsz, dens) {
    const ant = [];
    let x = -4;
    while (x < w) {
      const bw = 14 + r() * 30, bh = minH + r() * (maxH - minH), top = base - bh;
      rect(c, x, top, bw, bh + 40, col);
      rect(c, x, top, 1, bh, shade(col, 0.12));
      if (r() < 0.3) { rect(c, x + 2, top - 4, bw - 4, 4, col); }
      if (r() < 0.3) { const ax = x + bw / 2; rect(c, ax, top - 14, 1, 14, col); ant.push([R(ax), R(top - 15)]); }
      for (let wy = top + 3; wy < H; wy += wsz + 2) for (let wx = x + 2; wx < x + bw - wsz - 1; wx += wsz + 2) if (r() < dens) rect(c, wx, wy, wsz, wsz, winCols[(r() * winCols.length) | 0]);
      x += bw + 1 + r() * 3;
    }
    return ant;
  }
  const roof = {
    id: 'roof', name: 'Крыша небоскрёба', farIdx: 2,
    build() {
      const r = rng(3003), L = [];
      let [cv, c] = mkCanvas(layerW(0.03), H); let w = cv.width;
      ditherV(c, 0, 0, w, H, ['#03040c', '#070c22', '#0e1838', '#1c2450', '#3a2e62', '#6a3a6a', '#a8506a']);
      for (let i = 0; i < 140; i++) rect(c, r() * w, r() * 120, 1, 1, r() < 0.2 ? '#ffffff' : '#7a8ac0');
      pdisk(c, 380, 42, 12, '#fff4d0'); pdisk(c, 386, 38, 11, '#070c22');
      c.drawImage(glowSpr(30, '#fff4d0', 0.15), 350, 12);
      for (let i = 0; i < 5; i++) { const x = r() * w, y = 70 + r() * 50; for (let j = 0; j < 6; j++) rect(c, x + j * 9 - r() * 5, y + (j % 2) * 2, 30 + r() * 20, 2, j % 2 ? '#3a2e5a' : '#2a2a50'); }
      L.push({ cv, p: 0.03 });
      [cv, c] = mkCanvas(layerW(0.12), H); w = cv.width;
      skyline(c, w, 200, 30, 90, '#141a38', ['#5a5a7a', '#8a7a5a', '#4a6a8a'], r, 1, 0.3);
      c.globalAlpha = 0.25; grad(c, 0, 150, w, 70, ['#3a2e62', '#a8506a']); c.globalAlpha = 1;
      L.push({ cv, p: 0.12 });
      [cv, c] = mkCanvas(layerW(0.25), H); w = cv.width;
      const ant = skyline(c, w, 214, 40, 140, '#0a0e22', ['#ffd86a', '#ffe8a0', '#6ad8ff', '#ff9a5a', '#1a2040'], r, 2, 0.38);
      ['КОЛА', 'ТУН', 'ШОУ'].forEach((txt, i) => { const bx = 40 + i * w / 3 + r() * 60, by = R(120 + r() * 30), col = ['#ff3a8a', '#3af0ff', '#ffe23a'][i], bw = textWidth(txt) + 10; c.drawImage(glowSpr(22, col, 0.18), bx + bw / 2 - 22, by + 6 - 22); obox(c, bx, by, bw, 13, '#100818', col); drawText(c, txt, bx + bw / 2, by + 6.5, 1, col, 'center', null, null); rect(c, bx + 3, by + 14, 1, 10, '#0a0e22'); rect(c, bx + bw - 4, by + 14, 1, 10, '#0a0e22'); });
      c.globalAlpha = 0.5; grad(c, 0, 190, w, 40, ['#0a0e22', '#ffb05a']); c.globalAlpha = 1;
      L.push({ cv, p: 0.25, ant });
      // строения на крыше
      [cv, c] = mkCanvas(layerW(0.6), H); w = cv.width;
      const tx = w * 0.72;
      for (const lx of [-22, -8, 8, 22]) { rect(c, tx + lx - 1, 124, 3, 92, '#1e1a1e'); rect(c, tx + lx, 124, 1, 92, '#3a3236'); }
      tline(c, tx - 22, 140, tx + 22, 176, '#2a2428', 2); tline(c, tx + 22, 140, tx - 22, 176, '#2a2428', 2); tline(c, tx - 22, 176, tx + 22, 210, '#2a2428', 2); tline(c, tx + 22, 176, tx - 22, 210, '#2a2428', 2);
      rect(c, tx - 30, 122, 60, 4, '#2a2024');
      rect(c, tx - 27, 62, 54, 62, OL); grad(c, tx - 26, 64, 52, 58, ['#7a5236', '#5e3c26', '#4a2e1c']);
      for (let x = tx - 24; x < tx + 26; x += 5) rect(c, x, 64, 1, 58, '#3a2414'); rect(c, tx - 26, 64, 4, 58, '#9a6a44'); rect(c, tx + 18, 64, 8, 58, '#3a2214');
      for (const yy of [74, 94, 114]) { rect(c, tx - 27, yy, 54, 2, '#2a2a30'); rect(c, tx - 27, yy, 54, 1, '#6a6a74'); }
      for (let i = 0; i < 18; i++) { const ww = 56 - i * 3.2; rect(c, tx - ww / 2, 62 - i, ww, 1, i < 2 ? '#2a1a14' : i % 3 ? '#4a3020' : '#6a4630'); }
      rect(c, tx, 38, 1, 8, '#2a2024');
      drawText(c, 'БРЕЙН', tx, 104, 1, '#d8c8a0', 'center', null, null);
      // лестничная будка
      const sx = w * 0.18; obox(c, sx, 150, 60, 66, '#5a5a62'); rect(c, sx - 3, 146, 66, 5, '#3a3a42'); rect(c, sx - 3, 146, 66, 1, '#7a7a84');
      for (let y = 154; y < 214; y += 4) rect(c, sx + 1, y, 58, 1, '#4a4a52');
      obox(c, sx + 20, 176, 18, 40, '#3a4a5a'); rect(c, sx + 34, 196, 2, 2, '#c8c8c8'); obox(c, sx + 24, 162, 10, 6, '#ffe8a0');
      c.drawImage(glowSpr(18, '#ffe8a0', 0.25), sx + 11, 147);
      // антенна-тарелка
      const dx = w * 0.42; rect(c, dx, 180, 3, 36, '#4a4a52'); for (let i = 0; i < 12; i++) rect(c, dx - 14 + i, 168 + Math.abs(i - 6) * 0.8 - i * 0.6, 3, 16 - Math.abs(i - 6), i < 6 ? '#c8ccd4' : '#9a9ea8'); rect(c, dx + 6, 166, 1, 10, '#2a2a30');
      const ac2 = (x, y) => { obox(c, x, y, 34, 22, '#7a7e86'); for (let k = 0; k < 4; k++) rect(c, x + 3, y + 4 + k * 4, 16, 2, '#4e525a'); pdisk(c, x + 26, y + 11, 6, '#3a3e46'); rect(c, x + 25, y + 6, 2, 11, '#22262e'); };
      ac2(w * 0.3, 192); ac2(w * 0.3 + 38, 192); ac2(w * 0.56, 192);
      const vx = w * 0.5; obox(c, vx, 196, 8, 18, '#6a6e76'); for (let i = 0; i < 5; i++) rect(c, vx - 6 + i, 190 + i, 20 - i * 2, 1, i ? '#8a8e96' : '#b8bcc4');
      const mx2 = w * 0.92; rect(c, mx2, 96, 2, 118, '#2a2a30'); for (let y = 100; y < 210; y += 8) { tline(c, mx2 - 4, y, mx2 + 6, y + 8, '#2a2a30'); tline(c, mx2 + 6, y, mx2 - 4, y + 8, '#2a2a30'); }
      rect(c, 0, 212, w, 2, '#2a2a30'); for (let x = 0; x < w; x += 40) rect(c, x, 210, 6, 4, '#3a3a42');
      L.push({ cv, p: 0.6, beacon: [mx2 + 1, 95] });
      // крыша (пол)
      [cv, c] = mkCanvas(STAGE_W, H);
      pfloor(c, STAGE_W, 226, ['#4a4a52', '#3e3e46', '#33333a', '#28282e'], { sp: 60, r, seam: 'rgba(0,0,0,0.18)' });
      speck(c, 0, 228, STAGE_W, 42, '#5e5e66', 900, r); speck(c, 0, 228, STAGE_W, 42, '#22222a', 600, r);
      for (let i = 0; i < 6; i++) { const px = r() * STAGE_W, py = 236 + r() * 28; c.fillStyle = 'rgba(120,160,220,0.14)'; c.fillRect(R(px), R(py), 20 + R(r() * 30), 2); }
      // парапет
      grad(c, 0, 210, STAGE_W, 16, ['#6a6a72', '#55555c', '#44444a']); rect(c, 0, 208, STAGE_W, 3, '#8a8a92'); rect(c, 0, 208, STAGE_W, 1, '#b8b8c0'); rect(c, 0, 225, STAGE_W, 1, '#1e1e24');
      for (let x = 0; x < STAGE_W; x += 32) rect(c, x, 211, 1, 14, '#3a3a40');
      // кондиционеры
      const ac = (x, y) => { obox(c, x, y, 46, 30, '#8a8e96'); for (let k = 0; k < 6; k++) rect(c, x + 4, y + 4 + k * 4, 22, 2, '#5a5e66'); pdisk(c, x + 36, y + 14, 8, '#3a3e46'); pdisk(c, x + 36, y + 14, 6, '#5a5e66'); rect(c, x + 35, y + 8, 2, 13, '#2a2e36'); rect(c, x + 30, y + 13, 13, 2, '#2a2e36'); rect(c, x + 2, y + 30, 4, 3, '#2a2a30'); rect(c, x + 40, y + 30, 4, 3, '#2a2a30'); };
      ac(30, 196); ac(84, 200); ac(STAGE_W - 80, 196);
      obox(c, STAGE_W - 140, 186, 14, 40, '#7a7e86'); obox(c, STAGE_W - 144, 182, 22, 6, '#9a9ea6');
      for (let x = 0; x < STAGE_W; x += 2) rect(c, x, 222 - (x % 120 < 60 ? 0 : 0), 2, 2, '#1e1e24');
      L.push({ cv, p: 1, vents: [STAGE_W - 133] });
      L.push(dummy());
      return { L };
    },
    heli(t) { const hx = 240 + Math.sin(t * 0.004) * 170, hy = 42 + Math.sin(t * 0.011) * 8; return [hx, hy]; },
    amb(g, t) { if (t % 6 === 0) FX.smoke(this.data.L[4].vents[0], 180, 1, '#8a8a96'); },
    drawFar(ctx, cx, t) {
      const L = this.data.L[2], off = -R(cx * 0.25);
      for (const [ax, ay] of L.ant) if (((t + ax * 13) % 90) < 45) { const x = off + ax; if (x > -4 && x < W + 4) { rect(ctx, x - 1, ay - 1, 3, 3, '#ff2a2a'); glow(ctx, x, ay, 6, '#ff3a3a', 0.4); } }
      const [hx, hy] = this.heli(t), dir = Math.cos(t * 0.004) > 0 ? 1 : -1;
      ctx.fillStyle = '#05060c'; ctx.fillRect(R(hx - 10), R(hy - 3), 18, 7); ctx.fillRect(R(hx - 6), R(hy - 5), 10, 3); ctx.fillRect(R(hx - 26 * dir) - (dir < 0 ? 0 : 0), R(hy - 1), 0, 0);
      for (let i = 0; i < 18; i++) ctx.fillRect(R(hx - dir * (8 + i)), R(hy - 1), 1, 2);
      ctx.fillRect(R(hx - dir * 26), R(hy - 4), 2, 5); ctx.fillRect(R(hx - 8), R(hy + 5), 16, 1);
      const bl = (t >> 1) & 3; ctx.fillStyle = '#3a3a48'; ctx.fillRect(R(hx - 2 - (bl < 2 ? 14 : 6)), R(hy - 6), bl < 2 ? 28 : 12, 1);
      if ((t >> 4) & 1) rect(ctx, R(hx + dir * 8), R(hy), 2, 2, '#ff3a3a');
      if (((t >> 4) + 1) & 1) rect(ctx, R(hx - 1), R(hy - 6), 2, 1, '#ffffff');
      const b = this.data.L[3].beacon; if ((t % 70) < 35) { const x = R(b[0] - cx * 0.6); rect(ctx, x - 1, b[1] - 1, 3, 3, '#ff2a2a'); glow(ctx, x, b[1], 10, '#ff3a3a', 0.45); }
    },
    drawExtra(ctx, cx, t) {
      const [hx, hy] = this.heli(t), bx = hx + Math.sin(t * 0.017) * 140;
      ctx.globalAlpha = 0.09; ctx.fillStyle = '#e8f0ff';
      ctx.beginPath(); ctx.moveTo(hx, hy + 3); ctx.lineTo(bx - 34, 246); ctx.lineTo(bx + 34, 246); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(hx, hy + 3); ctx.lineTo(bx - 16, 246); ctx.lineTo(bx + 16, 246); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.16; ctx.beginPath(); ctx.ellipse(bx, 246, 36, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; rect(ctx, hx - 1, hy + 2, 3, 2, '#ffffff');
    }
  };

  // ---------------------------------------------------------------- 4. КЛАДБИЩЕ
  function grave(c, x, base, kind, r) {
    const st = ['#7a8088', '#6a7078', '#5e646c'][(r() * 3) | 0], dk = shade(st, -0.45), lt = shade(st, 0.3);
    if (kind === 0) { const w = 16 + R(r() * 6), h = 22 + R(r() * 10); rect(c, x - 1, base - h - 1, w + 2, h + 1, OL); rect(c, x, base - h + 4, w, h - 4, st); for (let i = 0; i < 5; i++) { const ww = R(Math.sqrt(25 - (5 - i) * (5 - i)) / 5 * w / 2); rect(c, x + w / 2 - ww, base - h + i, ww * 2, 1, st); rect(c, x + w / 2 - ww - 1, base - h + i, 1, 1, OL); rect(c, x + w / 2 + ww, base - h + i, 1, 1, OL); } rect(c, x, base - h + 4, 2, h - 4, dk); rect(c, x + w - 2, base - h + 4, 2, h - 4, lt); rect(c, x + w / 2 - 1, base - h + 6, 2, 8, dk); rect(c, x + w / 2 - 3, base - h + 8, 6, 2, dk); for (let i = 0; i < 2; i++) rect(c, x + 3, base - h + 17 + i * 3, w - 6, 1, dk); }
    else if (kind === 1) { const h = 28 + R(r() * 8); rect(c, x - 1, base - h - 1, 6, h + 1, OL); rect(c, x, base - h, 4, h, st); rect(c, x - 7, base - h + 6, 18, 6, OL); rect(c, x - 6, base - h + 7, 16, 4, st); rect(c, x + 3, base - h, 1, h, lt); rect(c, x - 6, base - h + 10, 16, 1, dk); }
    else if (kind === 2) { const h = 40 + R(r() * 10); rect(c, x - 6, base - 8, 16, 8, OL); rect(c, x - 5, base - 7, 14, 7, st); for (let i = 0; i < h - 8; i++) { const ww = 3 + R(i / (h - 8) * 3); rect(c, x + 2 - ww, base - 8 - (h - 8) + i, ww * 2, 1, st); rect(c, x + 2 + ww - 2, base - 8 - (h - 8) + i, 2, 1, lt); rect(c, x + 2 - ww, base - 8 - (h - 8) + i, 1, 1, dk); } }
    else { const w = 18, h = 16; rect(c, x - 1, base - h - 1, w + 2, h + 1, OL); rect(c, x, base - h, w, h, st); rect(c, x, base - h, w, 2, lt); rect(c, x, base - h, 2, h, dk); tline(c, x + 5, base - h + 2, x + 9, base - 3, dk); }
    for (let i = 0; i < 6; i++) rect(c, x + r() * 14 - 2, base - 2 - r() * 10, 2, 1, '#3a5a32');
    for (let i = -4; i < 20; i += 2) rect(c, x + i, base - 2 - R(r() * 3), 1, 4, '#2a3a26');
  }
  const graveyard = {
    id: 'graveyard', name: 'Кладбище', farIdx: 0,
    build() {
      const r = rng(4004), L = [];
      let [cv, c] = mkCanvas(layerW(0.03), H); let w = cv.width;
      ditherV(c, 0, 0, w, H, ['#04040a', '#0a0e1c', '#121c2e', '#1e2e40', '#2e4450', '#3e5a5a']);
      for (let i = 0; i < 120; i++) rect(c, r() * w, r() * 130, 1, 1, r() < 0.2 ? '#e8f0ff' : '#6a7a9a');
      c.drawImage(glowSpr(70, '#c8e0d8', 0.25), 330 - 70, 64 - 70);
      pdisk(c, 330, 64, 30, '#e8ecd8'); pdisk(c, 334, 62, 27, '#f6f8e8');
      for (const [mx, my, mr] of [[320, 54, 6], [340, 74, 5], [344, 52, 3], [318, 74, 3], [330, 64, 2.5]]) { pdisk(c, mx, my, mr, '#c8ccb8'); pdisk(c, mx + 1, my + 1, mr - 1.5, '#d8dcc8'); }
      L.push({ cv, p: 0.03 });
      [cv, c] = mkCanvas(layerW(0.12), H); w = cv.width;
      ridge(c, w, 200, 60, '#0e1622', r, 2, 2);
      for (let i = 0; i < 10; i++) { const tx = r() * w; branch(c, tx, 180 + r() * 10, 18 + r() * 10, -Math.PI / 2, 3, 5, '#0a1018', r); }
      const ch = w * 0.25; rect(c, ch - 20, 136, 40, 60, '#0a1018'); for (let i = 0; i < 16; i++) rect(c, ch - 20 + i * 1.25, 136 - i, 40 - i * 2.5, 1, '#0a1018'); rect(c, ch + 8, 96, 14, 44, '#0a1018'); for (let i = 0; i < 18; i++) rect(c, ch + 15 - i / 2.4, 78 + i, i / 1.2, 1, '#0a1018'); rect(c, ch + 14, 70, 2, 10, '#0a1018'); rect(c, ch + 11, 73, 8, 2, '#0a1018');
      rect(c, ch + 12, 110, 4, 6, '#d8c86a'); rect(c, ch - 8, 160, 4, 8, '#d8c86a'); rect(c, ch + 2, 160, 4, 8, '#5a5020');
      L.push({ cv, p: 0.12 });
      [cv, c] = mkCanvas(layerW(0.3), H); w = cv.width;
      ridge(c, w, 212, 24, '#141c24', r, 1.2, 2);
      for (let x = 0; x < w; x += 7) { rect(c, x, 168, 2, 44, '#0c1016'); for (let i = 0; i < 4; i++) rect(c, x - 1 + (i & 1), 166 - i, 4 - (i & 1) * 2 - (i > 1 ? 1 : 0), 1, '#0c1016'); }
      rect(c, 0, 174, w, 2, '#0c1016'); rect(c, 0, 198, w, 2, '#0c1016');
      for (let i = 0; i < 4; i++) { const tx = 40 + i * w / 4 + r() * 50; branch(c, tx, 212, 30 + r() * 16, -Math.PI / 2 + (r() - 0.5) * 0.3, 5, 6, '#121820', r); }
      for (let i = 0; i < 14; i++) { c.globalAlpha = 0.85; grave(c, r() * w, 212, (r() * 4) | 0, r); } c.globalAlpha = 1;
      c.globalAlpha = 0.45; rect(c, 0, 0, w, H, '#0e1a26'); c.globalAlpha = 1;
      L.push({ cv, p: 0.3 });
      [cv, c] = mkCanvas(layerW(0.55), H); w = cv.width;
      // склеп
      const kx = w * 0.62, kb = 222;
      rect(c, kx - 51, kb - 76, 102, 76, OL); grad(c, kx - 50, kb - 75, 100, 75, ['#6a7076', '#565c62', '#44494e']);
      for (let y = kb - 72; y < kb; y += 6) for (let x = kx - 50 + ((y / 6) & 1) * 7; x < kx + 50; x += 14) { rect(c, x, y, 1, 6, '#3a3e44'); rect(c, kx - 50, y, 100, 1, '#3a3e44'); }
      for (let i = 0; i < 22; i++) { const ww = 112 - i * 5; rect(c, kx - ww / 2, kb - 78 - i, ww, 1, i === 0 ? '#2a2e34' : i % 4 ? '#5a6066' : '#767c82'); rect(c, kx - ww / 2 - 1, kb - 78 - i, 1, 1, OL); rect(c, kx + ww / 2, kb - 78 - i, 1, 1, OL); }
      rect(c, kx - 58, kb - 80, 116, 4, '#7a8086'); rect(c, kx - 58, kb - 80, 116, 1, '#9aa0a6'); rect(c, kx - 58, kb - 77, 116, 1, OL);
      pdisk(c, kx, kb - 88, 5, '#2a2e34'); pdisk(c, kx, kb - 88, 3, '#3ad86a');
      for (const px of [kx - 42, kx - 28, kx + 20, kx + 34]) { obox(c, px, kb - 74, 8, 66, '#8a9096'); rect(c, px + 2, kb - 72, 1, 62, '#6a7076'); rect(c, px + 5, kb - 72, 1, 62, '#6a7076'); obox(c, px - 2, kb - 76, 12, 3, '#9aa0a6'); obox(c, px - 2, kb - 8, 12, 4, '#7a8086'); }
      rect(c, kx - 13, kb - 60, 26, 60, OL); rect(c, kx - 12, kb - 58, 24, 58, '#0a0c10');
      for (let i = 0; i < 6; i++) { const ww = R(Math.sqrt(36 - (6 - i) * (6 - i)) * 2); rect(c, kx - ww, kb - 64 + i, ww * 2, 1, '#0a0c10'); }
      for (let x = kx - 10; x < kx + 12; x += 4) rect(c, x, kb - 58, 1, 58, '#4a4a40'); rect(c, kx - 12, kb - 40, 24, 1, '#4a4a40');
      rect(c, kx - 30, kb - 4, 60, 4, '#5a6066'); rect(c, kx - 36, kb, 72, 2, '#4a5056');
      for (let i = 0; i < 40; i++) rect(c, kx - 50 + r() * 100, kb - 76 + r() * 70, 2, 1, '#4a6a3a');
      for (let i = 0; i < 10; i++) { let vx = kx - 50 + r() * 100, vy = kb - 78; for (let s = 0; s < 18; s++) { rect(c, vx, vy, 1, 1, '#2a4a26'); if (s % 4 === 0) rect(c, vx + 1, vy, 2, 1, '#3a6a32'); vx += (r() - 0.5) * 2; vy += 1; } }
      // большое мёртвое дерево
      const tx = w * 0.16; for (let y = 0; y < 60; y++) { const ww = 9 - y / 10; rect(c, tx - ww / 2, 222 - y, ww, 1, '#1a1612'); rect(c, tx - ww / 2, 222 - y, 2, 1, '#2e2820'); }
      branch(c, tx, 166, 30, -Math.PI / 2 - 0.3, 6, 6, '#1a1612', r); branch(c, tx, 170, 26, -Math.PI / 2 + 0.6, 5, 5, '#1a1612', r); branch(c, tx, 180, 22, -Math.PI + 0.4, 4, 4, '#1a1612', r);
      rect(c, tx + 26, 150, 1, 18, '#a8a090'); rect(c, tx + 23, 168, 7, 10, '#3a2a1a'); rect(c, tx + 24, 170, 5, 6, '#ffb84a');
      const gr = []; for (let i = 0; i < 9; i++) { const gx = r() * w; if (Math.abs(gx - kx) > 66 && Math.abs(gx - tx) > 16) gr.push(gx); }
      for (const gx of gr) grave(c, gx, 222, (r() * 4) | 0, r);
      L.push({ cv, p: 0.55, lamp: [tx + 26, 173], crypt: [kx, kb - 88] });
      [cv, c] = mkCanvas(STAGE_W, H);
      pfloor(c, STAGE_W, 224, ['#2e3428', '#262c22', '#1e221a', '#161a14'], { sp: 80, seam: 'rgba(0,0,0,0.12)', v: false });
      speck(c, 0, 226, STAGE_W, 44, '#3a4232', 700, r); speck(c, 0, 226, STAGE_W, 44, '#12140e', 500, r);
      for (let i = 0; i < 160; i++) { const gx = r() * STAGE_W, gy = 226 + r() * 44, hh = 2 + R(r() * 4); for (let k = 0; k < 3; k++) rect(c, gx + k * 2 - 2 + (k - 1) * (hh > 4 ? 1 : 0), gy - hh + (k === 1 ? 0 : 1), 1, hh, k === 1 ? '#5a6a42' : '#3e4a32'); }
      for (let i = 0; i < 6; i++) { const bx = r() * STAGE_W, by = 236 + r() * 28; rect(c, bx, by, 6, 2, '#c8c0a8'); rect(c, bx - 1, by - 1, 2, 4, '#d8d0b8'); rect(c, bx + 5, by - 1, 2, 4, '#d8d0b8'); }
      pdisk(c, 690, 252, 4, '#d8d0b8'); rect(c, 688, 251, 2, 2, '#1a1612'); rect(c, 691, 251, 2, 2, '#1a1612'); rect(c, 688, 255, 5, 1, '#8a8270');
      rect(c, 0, 224, STAGE_W, 1, '#4a5a3a');
      for (const gx of [30, 770]) grave(c, gx, 232, 0, r);
      L.push({ cv, p: 1 });
      L.push(dummy());
      // туман
      const [fv, fc] = mkCanvas(W + 160, 40);
      for (let i = 0; i < 70; i++) { const x = r() * (W + 160 - 40) + 20, y = 14 + r() * 14, rr = 8 + r() * 14; fc.drawImage(glowSpr(R(rr), '#9ab0b8', 0.35), x - rr, y - rr); }
      fc.globalCompositeOperation = 'destination-in'; fc.fillStyle = '#000'; fc.fillRect(0, 0, W + 160, 40);
      return { L, fog: fv };
    },
    amb(g, t) { if (t % 50 === 0) FX.p('px', g.camX + rand(0, W), rand(180, 240), rand(-0.2, 0.2), -rand(0.05, 0.2), 160, '#9aff8a', 1, 0, { fade: true }); },
    drawFar(ctx, cx, t) {
      for (let i = 0; i < 5; i++) {
        const bx = ((t * (0.5 + i * 0.13) + i * 140) % (W + 60)) - 30, by = 40 + i * 14 + Math.sin(t * 0.06 + i * 2) * 8, wf = ((t >> 2) + i) & 1;
        ctx.fillStyle = '#06060a'; ctx.fillRect(R(bx) - 1, R(by), 3, 2);
        if (wf) { ctx.fillRect(R(bx) - 5, R(by) - 2, 4, 1); ctx.fillRect(R(bx) + 2, R(by) - 2, 4, 1); ctx.fillRect(R(bx) - 2, R(by) - 1, 1, 1); ctx.fillRect(R(bx) + 2, R(by) - 1, 1, 1); }
        else { ctx.fillRect(R(bx) - 5, R(by) + 1, 4, 1); ctx.fillRect(R(bx) + 2, R(by) + 1, 4, 1); }
      }
      ctx.globalAlpha = 0.5;
      const cl = (t * 0.15) % 600;
      for (let k = 0; k < 2; k++) { const x = 600 - cl - k * 300 - cx * 0.05; rect(ctx, x, 70 + k * 18, 70, 3, '#1a2434'); rect(ctx, x + 10, 67 + k * 18, 46, 3, '#1a2434'); rect(ctx, x + 6, 73 + k * 18, 50, 2, '#2a3a4a'); }
      ctx.globalAlpha = 1;
    },
    drawExtra(ctx, cx, t) {
      const L3 = this.data.L[3], off = -cx * 0.55;
      glow(ctx, off + L3.lamp[0], L3.lamp[1], 22, '#ffb84a', 0.28, 0.8 + Math.sin(t * 0.3) * 0.2);
      glow(ctx, off + L3.crypt[0], L3.crypt[1], 16, '#3aff6a', 0.35, 0.6 + Math.sin(t * 0.05) * 0.4);
      const fog = this.data.fog;
      for (let k = 0; k < 2; k++) { const sp = k ? 0.35 : 0.2, y = k ? 226 : 196, ox = -((t * sp + cx * (k ? 1 : 0.5)) % 160); ctx.globalAlpha = k ? 0.55 : 0.75; ctx.drawImage(fog, R(ox), y); ctx.drawImage(fog, R(ox + fog.width), y); }
      ctx.globalAlpha = 1;
    }
  };

  // ---------------------------------------------------------------- 5. КОСМИЧЕСКАЯ СТАНЦИЯ
  function earth(c, ex, ey, rad) {
    const n1 = vnoise(77, 32), n2 = vnoise(91, 32), x0 = Math.floor(ex - rad - 8), y0 = Math.floor(ey - rad - 8), s = R(rad * 2 + 16);
    const img = c.getImageData(x0, y0, s, s), d = new Uint32Array(img.data.buffer);
    const Lx = 0.75, Ly = -0.45, Lz = 0.5, ln = Math.hypot(Lx, Ly, Lz);
    const OC = ['#061234', '#0c2a6a', '#1a4a9a', '#2a6ac0'], LA = ['#0a1a10', '#1e4a24', '#3a7a34', '#8a8a4a'], CL = ['#2a3448', '#8a9ab8', '#d8e4f4', '#ffffff'];
    for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) {
      const nx = (x0 + i - ex) / rad, ny = (y0 + j - ey) / rad, dd = nx * nx + ny * ny, th = (BAYER[(j & 3) * 4 + (i & 3)] + 0.5) / 16;
      if (dd > 1) { const e = Math.sqrt(dd); if (e < 1.07) { const a = (1.07 - e) / 0.07; if (a * 0.9 > th) d[j * s + i] = c32(a > 0.6 ? '#9ad8ff' : '#4a8ad8'); } continue; }
      const z = Math.sqrt(1 - dd), u = nx / (z + 0.5) * 2.2 + 3, v = ny / (z + 0.5) * 2.2 + 5;
      let li = (nx * Lx + ny * Ly + z * Lz) / ln; li = clamp(li * 1.3 + 0.1, 0, 1);
      const q = Math.min(3, Math.floor(li * 3 + th));
      const land = n1(u * 1.6, v * 1.6) > 0.56, cloud = n2(u * 3 + 7, v * 6) > 0.6;
      let col = cloud ? CL[q] : land ? LA[q] : OC[q];
      if (q === 0 && land && !cloud && ((i * 7 + j * 13) % 11 === 0)) col = '#ffd86a';
      if (e2(dd) && q > 0) col = '#8ac8ff';
      d[j * s + i] = c32(col);
    }
    function e2(dd) { return dd > 0.93; }
    c.putImageData(img, x0, y0);
  }
  const station = {
    id: 'station', name: 'Космическая станция', farIdx: 0,
    build() {
      const r = rng(5005), L = [];
      let [cv, c] = mkCanvas(layerW(0.04), H); let w = cv.width;
      ditherV(c, 0, 0, w, H, ['#010108', '#03041a', '#070a26', '#0a0a2a']);
      for (let i = 0; i < 6; i++) c.drawImage(glowSpr(40 + R(r() * 30), choice(['#6a2a9a', '#2a4aaa', '#9a2a6a']), 0.18), r() * w - 50, r() * 160 - 40);
      for (let i = 0; i < 260; i++) rect(c, r() * w, r() * H, 1, 1, r() < 0.15 ? '#ffffff' : r() < 0.5 ? '#9aa8d8' : '#5a6488');
      for (let i = 0; i < 10; i++) { const sx = r() * w, sy = r() * 180; rect(c, sx - 1, sy, 3, 1, '#ffffff'); rect(c, sx, sy - 1, 1, 3, '#ffffff'); }
      earth(c, w * 0.55, 250, 120);
      pdisk(c, w * 0.22, 60, 9, '#a8a8a0'); pdisk(c, w * 0.22 + 2, 58, 7, '#c8c8c0'); pdisk(c, w * 0.22 - 3, 62, 2, '#8a8a84');
      const tw = []; for (let i = 0; i < 24; i++) tw.push([R(r() * w), R(r() * 160)]);
      L.push({ cv, p: 0.04, tw });
      // стена с иллюминатором
      [cv, c] = mkCanvas(layerW(0.45), H); w = cv.width;
      grad(c, 0, 0, w, 226, ['#2a3240', '#3a4454', '#323a48', '#262c38']);
      for (let x = 0; x < w; x += 48) { rect(c, x, 0, 1, 226, '#161a22'); rect(c, x + 1, 0, 1, 226, '#4e5a6a'); }
      for (let y = 30; y < 226; y += 38) { rect(c, 0, y, w, 1, '#161a22'); rect(c, 0, y + 1, w, 1, '#4e5a6a'); }
      for (let x = 4; x < w; x += 48) for (let y = 34; y < 226; y += 38) { rect(c, x, y, 1, 1, '#7a8698'); rect(c, x + 40, y, 1, 1, '#7a8698'); rect(c, x, y + 32, 1, 1, '#7a8698'); rect(c, x + 40, y + 32, 1, 1, '#7a8698'); }
      grad(c, 0, 0, w, 24, ['#1a1e28', '#2a303c']);
      for (let k = 0; k < 3; k++) { rect(c, 0, 6 + k * 6, w, 4, ['#5a6474', '#7a5a3a', '#4a5a6a'][k]); rect(c, 0, 6 + k * 6, w, 1, '#9aa4b4'); }
      for (let x = 20; x < w; x += 70) { rect(c, x, 4, 4, 22, '#2a2e36'); }
      const wx0 = R(w / 2 - 170), wx1 = R(w / 2 + 170), wy0 = 34, wy1 = 186, ch = 22;
      const inside = (x, y) => x >= wx0 && x < wx1 && y >= wy0 && y < wy1 && (x - wx0) + (y - wy0) >= ch && (wx1 - 1 - x) + (y - wy0) >= ch && (x - wx0) + (wy1 - 1 - y) >= ch && (wx1 - 1 - x) + (wy1 - 1 - y) >= ch;
      // рамка: рисуем рамку как расширенный октагон
      const oct = (pad, col) => { c.fillStyle = col; for (let y = wy0 - pad; y < wy1 + pad; y++) { const dy = Math.min(y - (wy0 - pad), (wy1 + pad - 1) - y), cut = Math.max(0, ch + pad * 0.6 - dy); c.fillRect(wx0 - pad + cut, y, (wx1 - wx0) + pad * 2 - cut * 2, 1); } };
      oct(12, OL); oct(11, '#5a6676'); oct(8, '#7a8698'); oct(6, '#4a5464'); oct(2, '#1a1e26');
      c.save(); c.globalCompositeOperation = 'destination-out'; oct(0, '#000'); c.restore();
      for (let k = 0; k < 2; k++) { const mx = R(wx0 + (wx1 - wx0) * (k + 1) / 3); rect(c, mx - 3, wy0, 6, wy1 - wy0, '#4a5464'); rect(c, mx - 3, wy0, 1, wy1 - wy0, '#7a8698'); rect(c, mx + 2, wy0, 1, wy1 - wy0, '#2a303c'); }
      for (let y = wy0 - 6; y < wy1 + 6; y += 14) { rect(c, wx0 - 9, y, 2, 2, '#aab4c4'); rect(c, wx1 + 7, y, 2, 2, '#aab4c4'); }
      c.globalAlpha = 0.09; for (let k = 0; k < 3; k++) { const gx = wx0 + 30 + k * 110; for (let i = 0; i < 150; i++) rect(c, gx + i * 0.5, wy0 + i, 10 - (k & 1) * 6, 1, '#bfe0ff'); } c.globalAlpha = 1;
      // люки по бокам
      for (const hx of [24, w - 84]) { obox(c, hx, 96, 60, 110, '#4a5464'); obox(c, hx + 6, 102, 48, 98, '#36404e'); rect(c, hx + 29, 102, 2, 98, '#1e242e'); for (let y = 110; y < 196; y += 10) { rect(c, hx + 10, y, 16, 4, '#e8c030'); rect(c, hx + 34, y, 16, 4, '#e8c030'); for (let q = 0; q < 16; q += 4) { rect(c, hx + 10 + q, y, 2, 4, '#1a1a1a'); rect(c, hx + 34 + q, y, 2, 4, '#1a1a1a'); } } obox(c, hx + 22, 84, 16, 8, '#2a2e36'); }
      grad(c, 0, 200, w, 26, ['#1e232c', '#14181e']);
      for (let x = 0; x < w; x += 6) rect(c, x, 204, 3, 18, '#262c36');
      L.push({ cv, p: 0.45, door: [[54, 88], [w - 54, 88]] });
      // пульты
      [cv, c] = mkCanvas(layerW(0.8), H); w = cv.width; const lights = [], scrs = [];
      const console_ = (x, cw) => {
        const y = 170; rect(c, x - 1, y - 1, cw + 2, 57, OL); grad(c, x, y, cw, 56, ['#5a6676', '#4a5464', '#3a4250']); rect(c, x, y, cw, 1, '#9aa4b4');
        for (let i = 0; i < 8; i++) rect(c, x - 4 + i, y - 16 + i * 2, cw + 8 - i * 2, 2, i < 1 ? '#8a96a8' : '#2a303c');
        rect(c, x + 2, y - 16, cw - 4, 14, '#202630');
        for (let k = 0; k < Math.floor((cw - 8) / 34); k++) { const sx = x + 6 + k * 34, sy = y + 6; rect(c, sx - 1, sy - 1, 30, 22, '#14181e'); rect(c, sx, sy, 28, 20, '#041a10'); scrs.push({ x: sx, y: sy, k }); }
        for (let i = 0; i < cw - 12; i += 6) { lights.push({ x: x + 6 + i, y: y - 12 + (i % 12 ? 0 : 6), c: choice(['#ff3a3a', '#3aff6a', '#ffd23a', '#3ad8ff']), ph: (r() * 100) | 0, sp: 8 + ((r() * 30) | 0) }); rect(c, x + 6 + i, y - 12 + (i % 12 ? 0 : 6), 3, 2, '#1a1e24'); }
        for (let i = 0; i < 5; i++) obox(c, x + 6 + i * 10, y + 34, 6, 4, ['#c83a3a', '#3a8ac8', '#c8a83a', '#5a6676', '#3ac85a'][i]);
        rect(c, x + 6, y + 44, cw - 12, 1, '#2a303c');
      };
      console_(10, 110); console_(w - 124, 110); console_(R(w / 2 - 40), 80);
      L.push({ cv, p: 0.8, lights, scrs });
      [cv, c] = mkCanvas(STAGE_W, H);
      pfloor(c, STAGE_W, 228, ['#6a7484', '#5a6474', '#4a5262', '#3a4252'], { sp: 48, r });
      c.fillStyle = 'rgba(255,255,255,0.1)'; for (let y = 230; y < H; y += 3) for (let x = (y % 6) * 2; x < STAGE_W; x += 12) c.fillRect(x, y, 2, 1);
      rect(c, 0, 226, STAGE_W, 5, '#e8c030'); for (let x = 0; x < STAGE_W; x += 12) for (let k = 0; k < 5; k++) rect(c, x + k, 226 + k, 5, 1, '#1a1a1a'); rect(c, 0, 225, STAGE_W, 1, '#1a1e24'); rect(c, 0, 231, STAGE_W, 1, '#2a303c');
      for (let x = 40; x < STAGE_W; x += 120) { rect(c, x, 262, 40, 2, '#3ad8ff'); rect(c, x, 261, 40, 1, '#aaf0ff'); c.drawImage(glowSpr(20, '#3ad8ff', 0.25), x, 243); }
      L.push({ cv, p: 1 });
      return { L };
    },
    drawFar(ctx, cx, t) {
      const L0 = this.data.L[0], off = -R(cx * 0.04);
      for (let i = 0; i < L0.tw.length; i++) { const [x, y] = L0.tw[i], v = (t + i * 23) % 120; if (v < 20) { rect(ctx, off + x, y, 1, 1, '#ffffff'); if (v > 6 && v < 14) { rect(ctx, off + x - 1, y, 3, 1, '#cfe0ff'); rect(ctx, off + x, y - 1, 1, 3, '#cfe0ff'); } } }
      const st = (t % 900); if (st < 60) { const sx = W - st * 9, sy = 20 + st * 2; rect(ctx, sx, sy, 6, 1, '#ffffff'); ctx.globalAlpha = 0.4; rect(ctx, sx + 6, sy - 1, 10, 1, '#9ad8ff'); ctx.globalAlpha = 1; }
      const sat = ((t * 0.12) % (W + 300)) - 60, sy2 = 50 + Math.sin(t * 0.002) * 6;
      rect(ctx, sat, sy2, 6, 4, '#c8c8d0'); rect(ctx, sat - 10, sy2 + 1, 9, 2, '#2a4ad8'); rect(ctx, sat + 7, sy2 + 1, 9, 2, '#2a4ad8'); if ((t >> 4) & 1) rect(ctx, sat + 2, sy2 - 1, 1, 1, '#ff3a3a');
    },
    drawExtra(ctx, cx, t) {
      const Lw = this.data.L[1], o1 = -R(cx * 0.45);
      for (const [dx, dy] of Lw.door) if ((t >> 5) & 1) { rect(ctx, o1 + dx - 4, dy, 8, 3, '#ff3a3a'); glow(ctx, o1 + dx, dy + 1, 10, '#ff3a3a', 0.35); }
      const L = this.data.L[2], off = -R(cx * 0.8);
      for (const l of L.lights) { const x = off + l.x; if (x < -4 || x > W) continue; if (((t + l.ph) % (l.sp * 2)) < l.sp) rect(ctx, x, l.y, 3, 2, l.c); }
      for (const s of L.scrs) {
        const x = off + s.x; if (x < -30 || x > W) continue;
        if (s.k % 2 === 0) { for (let i = 0; i < 26; i += 2) { const v = Math.sin((i + t * 0.2) * 0.5) * 5 + Math.sin((i * 1.7 + t * 0.13)) * 3; rect(ctx, x + 1 + i, s.y + 10 + R(v), 2, 1, '#3aff8a'); } rect(ctx, x, s.y + 10, 28, 1, 'rgba(58,255,138,0.25)'); }
        else { const a = t * 0.06, cxx = x + 14, cyy = s.y + 10; ctx.fillStyle = '#1a6a3a'; ctx.fillRect(cxx - 9, cyy, 19, 1); ctx.fillRect(cxx, cyy - 9, 1, 19); for (let k = 0; k < 9; k++) rect(ctx, cxx + Math.cos(a) * k, cyy + Math.sin(a) * k, 1, 1, '#3aff8a'); if (((t * 0.06) % 6.283) < 2) rect(ctx, cxx + 5, cyy - 4, 2, 2, '#ff3a3a'); }
      }
    }
  };

  // ---------------------------------------------------------------- 6. ПИРАТСКИЙ КОРАБЛЬ
  const ship = {
    id: 'ship', name: 'Пиратский корабль', farIdx: 1,
    build() {
      const r = rng(6006), L = [];
      let [cv, c] = mkCanvas(layerW(0.03), H); let w = cv.width;
      ditherV(c, 0, 0, w, 200, ['#07090e', '#10141c', '#1a2028', '#283038', '#3a4446', '#56605a']);
      rect(c, 0, 200, w, 70, '#56605a');
      L.push({ cv, p: 0.03 });
      [cv, c] = mkCanvas(layerW(0.12), H); w = cv.width;
      { const n = vnoise(613, 64), ch = 170, img = c.createImageData(w, ch), d = new Uint32Array(img.data.buffer), tones = ['#3e484c', '#2c343a', '#20272d', '#151a20'].map(x => c32(x)), hi = c32('#5a6466');
        const den = (x, y) => n(x / 46, y / 15) * 1.25 - Math.max(0, (y - 70) / 100) * 0.55 - (y < 50 ? 0 : 0) + 0.05;
        for (let y = 0; y < ch; y++) for (let x = 0; x < w; x++) {
          const dd = den(x, y); if (dd < 0.5) continue; const th = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
          const lv = Math.min(3, Math.floor((dd - 0.5) * 9 + th));
          d[y * w + x] = (den(x, y - 3) < 0.5 && y > 3) ? hi : tones[lv];
        }
        c.putImageData(img, 0, 0); }
      for (let i = 0; i < 18; i++) { const x = r() * w, y = 120 + r() * 30; for (let k = 0; k < 3; k++) rect(c, x + k * 8 - r() * 6, y + k * 2, 40 + r() * 30, 2, k % 2 ? '#262e34' : '#323c40'); }
      // далёкий корабль-призрак
      const gx = w * 0.3; for (let i = 0; i < 26; i++) rect(c, gx - 26 + i * 0.4, 160 + i * 0.3, 52 - i * 0.8, 1, '#1a2024'); rect(c, gx - 2, 128, 2, 32, '#1a2024'); rect(c, gx - 12, 134, 20, 14, '#2a3236'); rect(c, gx + 10, 140, 1, 20, '#1a2024'); rect(c, gx + 4, 142, 12, 10, '#2a3236');
      L.push({ cv, p: 0.12 });
      // море (для drawFar)
      const [sv, sc] = mkCanvas(layerW(0.15), 120); ditherV(sc, 0, 0, sv.width, 120, ['#3a5a5a', '#1e3a40', '#12282e', '#0a1a20', '#06121a']);
      for (let i = 0; i < 300; i++) { const x = r() * sv.width, y = r() * 110, ww = 3 + r() * 10; rect(sc, x, y, ww, 1, y < 30 ? '#5a7a76' : '#2a4a50'); }
      // палуба
      [cv, c] = mkCanvas(STAGE_W, H);
      // мачты, реи, паруса
      const mast = (mx, top, sails) => {
        rect(c, mx - 6, top, 12, 200 - top, OL); grad(c, mx - 5, top, 10, 200 - top, ['#6a4626', '#5a3a1e']); rect(c, mx - 5, top, 3, 200 - top, '#8a6036'); rect(c, mx + 3, top, 2, 200 - top, '#3a2412');
        for (let y = top + 20; y < 200; y += 34) { rect(c, mx - 6, y, 12, 3, '#2a2a2a'); rect(c, mx - 6, y, 12, 1, '#5a5a5a'); }
        for (const [sy, sw, sh] of sails) {
          rect(c, mx - sw / 2 - 2, sy - 2, sw + 4, 5, OL); rect(c, mx - sw / 2, sy - 1, sw, 3, '#7a5230');
          for (let y = 0; y < sh; y++) { const bulge = Math.sin(y / sh * Math.PI) * 8, ww = sw - 8 + bulge * 0.8, x0 = mx - ww / 2; rect(c, x0 - 1, sy + 2 + y, ww + 2, 1, OL); rect(c, x0, sy + 2 + y, ww, 1, y < sh * 0.2 ? '#e0d4b0' : '#d0c29a'); rect(c, x0, sy + 2 + y, 4 + bulge * 0.5, 1, '#a89a76'); rect(c, x0 + ww - 3 - bulge * 0.3, sy + 2 + y, 3 + bulge * 0.3, 1, '#ece2c4'); }
          for (let k = 1; k < 4; k++) for (let y = 0; y < sh; y += 2) rect(c, mx - sw / 2 + 4 + k * (sw - 8) / 4 + Math.sin(y / sh * Math.PI) * 2 * (k - 2), sy + 3 + y, 1, 1, '#b8aa84');
          for (let i = 0; i < 4; i++) { const px = mx - sw / 3 + r() * sw * 0.6, py = sy + 6 + r() * (sh - 14); rect(c, px, py, 7, 6, '#b8a880'); rect(c, px, py, 7, 1, '#9a8a66'); }
        }
      };
      mast(250, 8, [[24, 120, 62], [104, 140, 70]]);
      mast(640, 30, [[46, 96, 50], [116, 112, 56]]);
      // череп на парусе
      const kx = 250, ky = 140; pdisk(c, kx, ky, 11, '#1a1414'); pdisk(c, kx, ky, 10, '#2a2020'); pdisk(c, kx - 4, ky - 1, 3, '#d0c29a'); pdisk(c, kx + 4, ky - 1, 3, '#d0c29a'); rect(c, kx - 1, ky + 3, 2, 2, '#d0c29a'); for (let i = -4; i <= 4; i += 2) rect(c, kx + i, ky + 7, 1, 2, '#d0c29a');
      tline(c, kx - 16, ky + 12, kx + 16, ky + 22, '#1a1414', 3); tline(c, kx + 16, ky + 12, kx - 16, ky + 22, '#1a1414', 3);
      // воронье гнездо
      obox(c, 236, 4, 28, 10, '#6a4626'); for (let x = 238; x < 262; x += 4) rect(c, x, 5, 1, 8, '#3a2412');
      // такелаж
      for (const [ax, ay, bx2] of [[250, 10, 120], [250, 10, 380], [640, 32, 520], [640, 32, 760], [250, 60, 160], [640, 70, 720]]) tline(c, ax, ay, bx2, 198, '#1a1410');
      for (let i = 0; i < 9; i++) tline(c, 120 + i * 14, 198 - i * 2, 130 + i * 14, 198 - i * 2 - 2, '#2a2018');
      // фальшборт
      rect(c, 0, 194, STAGE_W, 32, OL);
      grad(c, 0, 197, STAGE_W, 28, ['#6a4224', '#5a361c', '#4a2c16']);
      for (let y = 201; y < 225; y += 6) rect(c, 0, y, STAGE_W, 1, '#2e1a0c');
      for (let x = 0; x < STAGE_W; x += 40) { rect(c, x, 197, 4, 28, '#3a2210'); rect(c, x, 197, 1, 28, '#7a5232'); }
      rect(c, 0, 192, STAGE_W, 5, '#8a5a32'); rect(c, 0, 192, STAGE_W, 1, '#b8844e'); rect(c, 0, 196, STAGE_W, 1, '#3a2210');
      speck(c, 0, 198, STAGE_W, 26, '#7a4e2c', 300, r);
      // пушки
      for (const gx2 of [150, 470]) { rect(c, gx2 - 12, 206, 30, 10, '#3a2412'); obox(c, gx2 - 10, 208, 26, 8, '#5a3a1e'); pdisk(c, gx2 - 6, 218, 4, '#2a1a0c'); pdisk(c, gx2 + 12, 218, 4, '#2a1a0c'); rect(c, gx2 - 14, 201, 32, 8, OL); grad(c, gx2 - 13, 202, 30, 6, ['#4a4a52', '#2a2a30', '#1a1a1e']); rect(c, gx2 - 13, 202, 30, 1, '#7a7a84'); pdisk(c, gx2 - 14, 205, 4, '#1a1a1e'); }
      // бочки и ящики
      const barrel = (bx, by) => { rect(c, bx - 1, by - 1, 18, 24, OL); grad(c, bx, by, 16, 22, ['#9a6a3a', '#7a4e26', '#5a3418']); rect(c, bx + 2, by, 1, 22, '#b8844e'); rect(c, bx + 12, by, 2, 22, '#4a2a12'); for (const yy of [3, 18]) { rect(c, bx, by + yy, 16, 2, '#3a3a40'); rect(c, bx, by + yy, 16, 1, '#7a7a84'); } };
      barrel(18, 204); barrel(36, 206); barrel(STAGE_W - 40, 204); obox(c, STAGE_W - 76, 204, 26, 24, '#8a6a3a'); tline(c, STAGE_W - 76, 204, STAGE_W - 51, 227, '#5a3e1e', 2); tline(c, STAGE_W - 51, 204, STAGE_W - 76, 227, '#5a3e1e', 2);
      // штурвал
      const hx = 700, hy = 186; for (let a = 0; a < 8; a++) tline(c, hx, hy, hx + Math.cos(a * Math.PI / 4) * 17, hy + Math.sin(a * Math.PI / 4) * 17, '#5a3a1e', 2); pring(c, hx, hy, 12, '#7a5230', 3); pring(c, hx, hy, 12, '#9a6a3a', 1); pdisk(c, hx, hy, 3, '#c8a050'); rect(c, hx - 3, hy + 10, 6, 16, '#4a2e16');
      // палуба
      for (let y = 226; y < H; y++) { const k = (y - 226) / 44; rect(c, 0, y, STAGE_W, 1, mix('#8a5e34', '#4e3018', k)); }
      let y = 227, hh = 3; const seams = []; while (y < H) { seams.push(y); y += hh; hh += 1; }
      for (const sy of seams) { rect(c, 0, sy, STAGE_W, 1, '#2e1a0c'); rect(c, 0, sy + 1, STAGE_W, 1, 'rgba(255,220,160,0.12)'); }
      for (let i = 0; i < seams.length - 1; i++) { const sy = seams[i], h2 = seams[i + 1] - sy, len = 60 + i * 20; for (let x = (i * 37) % len; x < STAGE_W; x += len) { rect(c, x, sy, 1, h2, '#2e1a0c'); rect(c, x + 3, sy + (h2 >> 1), 1, 1, '#1e1008'); } }
      speck(c, 0, 228, STAGE_W, 42, 'rgba(0,0,0,0.25)', 800, r);
      for (let i = 0; i < 14; i++) { const px = r() * STAGE_W, py = 232 + r() * 32; c.fillStyle = 'rgba(180,210,220,0.13)'; c.fillRect(R(px), R(py), 20 + R(r() * 40), 1); }
      rect(c, 0, 225, STAGE_W, 2, '#2a1608');
      L.push({ cv, p: 1 });
      return { L, sea: sv };
    },
    amb(g, t) {
      for (let i = 0; i < 3; i++) FX.p('line', g.camX + rand(-20, W + 60), rand(-10, 220), -1.4, 8, 30, '#9ab0c0', randi(4, 7), 0);
      const s = g.stageState; if (s.bolt && --s.bolt.life <= 0) s.bolt = null;
      if (Math.random() < 0.004) { g.flashA = 0.4; s.bolt = { x: rand(30, W - 30), seed: randi(1, 9999), life: 9 }; Sound.play('thunder'); }
    },
    drawFar(ctx, cx, t, g) {
      const bob = Math.sin(t * 0.025) * 3, y0 = R(166 + bob), off = -R(cx * 0.15);
      ctx.drawImage(this.data.sea, off, y0);
      for (let i = 0; i < 9; i++) { const y = y0 + 2 + i * i * 0.9 + i * 2, sp = 0.3 + i * 0.08, gap = 26 + i * 6; for (let x = ((t * sp + i * 17) % gap) - gap; x < W; x += gap) { rect(ctx, x, R(y + Math.sin(x * 0.05 + t * 0.05) * 1), 6 + i, 1, i < 3 ? '#8aa8a4' : '#4a6a6a'); if (i > 3 && (x + i * 3) % 3 === 0) rect(ctx, x + 2, R(y - 1), 3, 1, '#c8dcd8'); } }
      const bo = g.stageState.bolt;
      if (bo) { const rr = rng(bo.seed); let x = bo.x, y = 10; ctx.globalAlpha = Math.min(1, bo.life / 4); glow(ctx, bo.x, 90, 70, '#cfe8ff', 0.25); while (y < 166) { const nx = x + (rr() - 0.5) * 16, ny = y + 6 + rr() * 10; tline(ctx, x, y, nx, ny, '#cfe8ff', 2); tline(ctx, x, y, nx, ny, '#ffffff'); if (rr() < 0.2) tline(ctx, nx, ny, nx + (rr() - 0.5) * 30, ny + 14, '#9ac8ff'); x = nx; y = ny; } ctx.globalAlpha = 1; }
      // флаг
      const fx = 640 - cx + 6, fy = 28;
      if (fx > -40 && fx < W + 4) for (let i = 0; i < 22; i++) { const wv = Math.sin(t * 0.15 - i * 0.4) * 2 * (i / 22); rect(ctx, fx + i, R(fy + 4 + wv), 1, 12, '#121214'); if (i > 7 && i < 13) rect(ctx, fx + i, R(fy + 7 + wv), 1, 4, '#e8e0d0'); }
    }
  };

  // ---------------------------------------------------------------- 7. ПУСТЫНЯ ФАРАОНОВ
  function pyramid(c, cx, base, hw, hh, lit, sh, step) {
    for (let y = 0; y < hh; y++) { const ww = hw * (y / hh), yy = base - hh + y; rect(c, cx - ww, yy, ww, 1, sh); rect(c, cx, yy, ww, 1, lit); if (step && (y % step === 0)) { rect(c, cx - ww, yy, ww, 1, shade(sh, -0.15)); rect(c, cx, yy, ww, 1, shade(lit, -0.12)); } }
  }
  const desert = {
    id: 'desert', name: 'Пустыня фараонов', farIdx: 0,
    build() {
      const r = rng(7007), L = [];
      let [cv, c] = mkCanvas(layerW(0.06), H); let w = cv.width;
      ditherV(c, 0, 0, w, 200, ['#3a7ac8', '#5a9ad8', '#8ab8e0', '#c8d0c8', '#f0d0a0', '#ffc888']);
      rect(c, 0, 200, w, 70, '#ffc888');
      c.drawImage(glowSpr(80, '#fff4c0', 0.4), 400 - 80, 50 - 80); pdisk(c, 400, 50, 20, '#fff8d8'); pdisk(c, 400, 50, 17, '#ffffff');
      for (const [hx, hw2] of [[w * 0.2, 60], [w * 0.42, 40], [w * 0.75, 70]]) pyramid(c, hx, 196, hw2, hw2 * 0.8, '#f0c896', '#d8a878', 0);
      c.globalAlpha = 0.35; grad(c, 0, 150, w, 50, ['#ffc888', '#ffe0b0']); c.globalAlpha = 1;
      L.push({ cv, p: 0.06 });
      [cv, c] = mkCanvas(layerW(0.2), H); w = cv.width;
      pyramid(c, w * 0.34, 206, 110, 100, '#e8b878', '#a8744a', 4);
      for (let i = 0; i < 10; i++) rect(c, w * 0.34 - 1 + (i < 5 ? 0 : 0), 106 + i, 1, 1, '#ffe8a0'); pyramid(c, w * 0.34, 116, 11, 10, '#ffe066', '#c89a2a', 0);
      pyramid(c, w * 0.66, 210, 76, 66, '#e0b070', '#a06e44', 4);
      // сфинкс
      const sx = w * 0.84, sb = 208, sc = '#c8945a', sd = '#9a6a3e';
      rect(c, sx - 40, sb - 14, 64, 14, sc); rect(c, sx - 40, sb - 14, 64, 2, '#e0b070'); rect(c, sx - 46, sb - 4, 20, 4, sc); rect(c, sx + 14, sb - 30, 14, 20, sc); rect(c, sx + 12, sb - 34, 18, 10, sd); rect(c, sx + 26, sb - 26, 4, 6, sd); rect(c, sx + 13, sb - 32, 4, 18, '#3a5a8a'); rect(c, sx + 16, sb - 32, 1, 18, '#d8b040');
      for (let x = sx - 38; x < sx + 22; x += 6) rect(c, x, sb - 10, 1, 8, sd);
      c.globalAlpha = 0.25; rect(c, 0, 0, w, H, '#ffd8a0'); c.globalAlpha = 1;
      L.push({ cv, p: 0.2 });
      [cv, c] = mkCanvas(layerW(0.4), H); w = cv.width;
      for (let k = 0; k < 2; k++) {
        const base = 206 + k * 10, amp = 14 - k * 3, ph = r() * 6, col = k ? '#e4a85e' : '#d89a54', dk = k ? '#c0844a' : '#b47a44';
        for (let x = 0; x < w; x++) { const y = R(base - amp * (0.5 + 0.5 * Math.sin(x * 0.018 + ph)) - 4 * Math.sin(x * 0.05 + ph * 2)); const sl = Math.cos(x * 0.018 + ph) + 0.25 * Math.cos(x * 0.05 + ph * 2); rect(c, x, y, 1, H - y, sl > 0 ? dk : col); rect(c, x, y, 1, 1, sl > 0 ? shade(dk, -0.1) : '#f8d090'); if ((x + y) % 7 === 0) rect(c, x, y + 4 + (x % 5), 2, 1, sl > 0 ? shade(dk, -0.12) : shade(col, -0.08)); }
      }
      L.push({ cv, p: 0.4 });
      [cv, c] = mkCanvas(layerW(0.65), H); w = cv.width;
      palm(c, 40, 222, 92, 18, r); palm(c, 70, 222, 74, -12, r); palm(c, w - 60, 222, 96, -20, r); palm(c, w - 30, 222, 70, 10, r);
      // обелиск
      const ox = w * 0.36; for (let y = 0; y < 120; y++) { const ww = 9 - y / 30; rect(c, ox - ww, 222 - y, ww, 1, '#b07848'); rect(c, ox, 222 - y, ww, 1, '#e0a868'); }
      for (let i = 0; i < 6; i++) rect(c, ox - 6 + (i & 1) * 4, 104 - i * 3, 4 - (i & 1) * 2, 1, i < 3 ? '#ffe066' : '#d8a040');
      for (let y = 112; y < 214; y += 8) { const gl = (y / 8) % 4; rect(c, ox + 2, y, 3, gl === 0 ? 4 : 2, '#8a5a30'); if (gl === 1) pdisk(c, ox + 3, y + 2, 1.5, '#8a5a30'); if (gl === 2) rect(c, ox + 1, y + 2, 5, 1, '#8a5a30'); }
      // разрушенные колонны
      const col = (x, hh) => { rect(c, x - 9, 222 - hh, 18, hh, OL); grad(c, x - 8, 223 - hh, 16, hh - 1, ['#e8c08a', '#d0a470']); rect(c, x - 8, 223 - hh, 4, hh - 1, '#f4d8a8'); rect(c, x + 4, 223 - hh, 4, hh - 1, '#a87a4a'); for (let y = 228 - hh; y < 222; y += 10) rect(c, x - 8, y, 16, 1, '#a07040'); for (let i = 0; i < 4; i++) rect(c, x - 8 + i * 4, 222 - hh - (i % 2) * 3, 4, 3 + (i % 2) * 3, '#d8b080'); obox(c, x - 12, 216, 24, 6, '#c89a68'); };
      col(w * 0.6, 70); col(w * 0.66, 44); col(w * 0.52, 30);
      obox(c, w * 0.55, 210, 30, 10, '#d0a470'); rect(c, w * 0.55 + 4, 213, 3, 4, '#8a5a30'); rect(c, w * 0.55 + 10, 213, 6, 1, '#8a5a30'); pdisk(c, w * 0.55 + 22, 215, 2, '#8a5a30');
      L.push({ cv, p: 0.65 });
      [cv, c] = mkCanvas(STAGE_W, H);
      grad(c, 0, 224, STAGE_W, 46, ['#f0c888', '#e4b674', '#d4a262', '#c08e52']);
      for (let i = 0; i < 70; i++) { const x0 = r() * STAGE_W, y0 = 228 + r() * 40, ln = 14 + r() * 26; for (let k = 0; k < ln; k++) rect(c, x0 + k, R(y0 + Math.sin(k * 0.3) * 1.2), 1, 1, i % 2 ? '#c08e52' : '#fae0a8'); }
      // каменные плиты
      for (let x = 150; x < 660; x += 34) { const yy = 236 + R(r() * 3); rect(c, x, yy, 30, 6, '#b08458'); rect(c, x, yy, 30, 1, '#d8b080'); rect(c, x, yy + 5, 30, 1, '#7a5634'); if (r() < 0.4) rect(c, x + 8, yy + 1, 1, 4, '#7a5634'); rect(c, x - 2 + r() * 34, yy - 1, 10, 2, '#e4b674'); }
      speck(c, 0, 226, STAGE_W, 44, '#a87a48', 500, r); speck(c, 0, 226, STAGE_W, 44, '#fff0c8', 300, r);
      rect(c, 0, 224, STAGE_W, 1, '#fff0c8');
      for (const bx of [24, STAGE_W - 60]) { obox(c, bx, 214, 40, 12, '#c89a68'); for (let i = 0; i < 4; i++) rect(c, bx + 4 + i * 9, 217, 4, 6, '#8a5a30'); }
      const sk = 680; pdisk(c, sk, 240, 5, '#f4ecd8'); rect(c, sk - 3, 239, 2, 2, '#3a2a1a'); rect(c, sk + 1, 239, 2, 2, '#3a2a1a'); rect(c, sk - 9, 236, 5, 1, '#f4ecd8'); rect(c, sk + 4, 236, 5, 1, '#f4ecd8');
      L.push({ cv, p: 1 });
      return { L };
    },
    amb(g, t) {
      if (t % 2 === 0) FX.p('px', g.camX + W + 10, rand(150, 250), -rand(2, 4), rand(-0.1, 0.2), 200, choice(['#e8c088', '#d4a262', '#fff0c8']), 1, 0, { fade: true });
    },
    drawFar(ctx, cx, t) {
      const cv = this.data.L[0].cv, off = -R(cx * 0.06);
      for (let y = 150; y < 200; y += 2) { const dx = R(Math.sin(y * 0.4 + t * 0.09) * 1.2); if (dx) ctx.drawImage(cv, 0, y, cv.width, 2, off + dx, y, cv.width, 2); }
      for (let i = 0; i < 3; i++) { const a = t * 0.012 + i * 2.1, vx = 160 + Math.cos(a) * 60 + i * 60, vy = 60 + Math.sin(a) * 14 + i * 8, wf = Math.sin(t * 0.1 + i) > 0; ctx.fillStyle = '#3a2a1a'; ctx.fillRect(R(vx) - 1, R(vy), 3, 1); ctx.fillRect(R(vx) - 5, R(vy) - (wf ? 1 : 0), 4, 1); ctx.fillRect(R(vx) + 2, R(vy) - (wf ? 1 : 0), 4, 1); }
    }
  };

  // ---------------------------------------------------------------- 8. ПОДВОДНЫЙ КУПОЛ
  function fishSpr(body, fin, stripe, len) {
    const [cv, c] = mkCanvas(len + 6, 9);
    for (let i = 0; i < len; i++) { const hh = R(Math.sin((i + 0.5) / len * Math.PI) * 3.5); rect(c, i + 4, 4 - hh, 1, hh * 2 + 1, body); if (stripe && (i % 4 === 1)) rect(c, i + 4, 4 - hh, 1, hh * 2 + 1, stripe); rect(c, i + 4, 4 - hh, 1, 1, shade(body, 0.35)); rect(c, i + 4, 4 + hh, 1, 1, shade(body, -0.3)); }
    rect(c, 0, 1, 2, 7, fin); rect(c, 2, 2, 2, 5, fin); rect(c, len + 1, 3, 1, 1, '#000'); rect(c, len / 2 + 2, 0, 3, 2, fin);
    const [fl, fc] = mkCanvas(cv.width, 9); fc.scale(-1, 1); fc.drawImage(cv, -cv.width, 0);
    return [cv, fl];
  }
  const dome = {
    id: 'dome', name: 'Подводный купол', farIdx: 1,
    build() {
      const r = rng(8008), L = [];
      let [cv, c] = mkCanvas(layerW(0.05), H); let w = cv.width;
      ditherV(c, 0, 0, w, H, ['#3ab8d8', '#1a8ab8', '#0e6494', '#0a4878', '#06305a', '#041e40']);
      c.globalAlpha = 0.07; for (let k = 0; k < 9; k++) { const x0 = r() * w, ww = 10 + r() * 24; for (let y = 0; y < 220; y += 2) rect(c, x0 + y * 0.35, y, ww + y * 0.1, 2, '#e8ffff'); } c.globalAlpha = 1;
      for (let x = 0; x < w; x += 3) rect(c, x, R(4 + Math.sin(x * 0.07) * 2), 3, 1, '#9ae8ff');
      // затонувший корабль-силуэт
      const wx = w * 0.7; for (let i = 0; i < 20; i++) rect(c, wx - 40 + i, 190 + i * 0.5, 80 - i * 1.5, 1, '#0a2e4e'); rect(c, wx - 4, 150, 3, 42, '#0a2e4e'); tline(c, wx - 4, 152, wx + 20, 176, '#0a2e4e', 2);
      L.push({ cv, p: 0.05 });
      [cv, c] = mkCanvas(layerW(0.2), H); w = cv.width;
      ridge(c, w, 214, 30, '#0c3a5a', r, 2, 2);
      for (let i = 0; i < 18; i++) { const x = r() * w, y = 196 + r() * 18, rr = 6 + r() * 10; pdisk(c, x, y, rr, '#14486a'); pdisk(c, x - 2, y - 2, rr - 3, '#1e5a7a'); }
      for (let i = 0; i < 12; i++) { const x = r() * w, base = 214 - r() * 6, col = choice(['#ff6a8a', '#ff9a4a', '#c86aff', '#ffd25a']); branch(c, x, base, 6 + r() * 6, -Math.PI / 2, 3, 3, col, r); }
      for (let i = 0; i < 10; i++) { const x = r() * w, y = 208 + r() * 10; pdisk(c, x, y, 4, '#e86a3a'); for (let a = 0; a < 6; a++) rect(c, x + Math.cos(a) * 5, y + Math.sin(a) * 3 - 2, 2, 2, '#ff9a5a'); }
      speck(c, 0, 210, w, 30, '#2a6a8a', 300, r);
      const weeds = []; for (let i = 0; i < 16; i++) weeds.push({ x: R(r() * w), h: 14 + R(r() * 26), ph: r() * 6, col: choice(['#2a8a4a', '#3aa85a', '#1e7a3a']) });
      L.push({ cv, p: 0.2, weeds });
      // купол
      [cv, c] = mkCanvas(layerW(0.55), H); w = cv.width;
      const mx = w / 2, ay = 8, rx = w * 0.62, by = 200;
      c.fillStyle = 'rgba(140,230,255,0.07)'; c.fillRect(0, 0, w, by);
      for (let y = 0; y < by; y++) { const t2 = (by - y) / (by - ay); const ww = t2 >= 1 ? 0 : rx * Math.sqrt(1 - t2 * t2); if (mx - ww > 0) { rect(c, 0, y, mx - ww, 1, '#1a2a38'); rect(c, mx + ww, y, w - mx - ww, 1, '#1a2a38'); rect(c, mx - ww - 4, y, 4, 1, '#5a7a8a'); rect(c, mx + ww, y, 4, 1, '#3a5a6a'); rect(c, mx - ww - 5, y, 1, 1, OL); rect(c, mx + ww + 4, y, 1, 1, OL); } }
      for (let k = -4; k <= 4; k++) { if (!k) continue; const bx = mx + k * rx / 4.5; let px = bx, py = by; for (let y = by; y > ay; y--) { const t2 = (by - y) / (by - ay); const x = mx + (bx - mx) * Math.sqrt(Math.max(0, 1 - t2 * t2)); rect(c, x - 1, y, 3, 1, '#4a6a7a'); rect(c, x - 1, y, 1, 1, '#8ab0c0'); if (y % 24 === 0) rect(c, x - 2, y, 5, 2, '#2a4a5a'); px = x; } }
      rect(c, mx - 1, ay, 3, by - ay, '#4a6a7a');
      for (const ry of [70, 140]) { const t2 = (by - ry) / (by - ay), ww = rx * Math.sqrt(1 - t2 * t2); for (let x = -ww; x < ww; x++) { const yy = ry + (x * x) / (ww * ww) * 6; rect(c, mx + x, yy, 1, 3, '#3a5a6a'); rect(c, mx + x, yy, 1, 1, '#7aa0b0'); } }
      c.globalAlpha = 0.18; for (let k = 0; k < 3; k++) { const sx = mx - 160 + k * 26; for (let i = 0; i < 80; i++) rect(c, sx + i * 0.8, 30 + i * 1.6, 4 - (k % 2) * 2, 2, '#ffffff'); } c.globalAlpha = 1;
      // основание
      rect(c, 0, by - 1, w, 28, OL); grad(c, 0, by, w, 26, ['#6a8a9a', '#4a6a7a', '#34505e']); rect(c, 0, by, w, 1, '#aac8d4');
      for (let x = 30; x < w; x += 90) { pdisk(c, x, by + 12, 8, '#2a4050'); pdisk(c, x, by + 12, 6, '#0a5a8a'); pdisk(c, x - 2, by + 10, 2, '#9ae8ff'); pring(c, x, by + 12, 8, '#8aa8b8'); }
      for (let x = 0; x < w; x += 12) rect(c, x, by + 2, 1, 1, '#9ab8c4');
      L.push({ cv, p: 0.55 });
      [cv, c] = mkCanvas(STAGE_W, H);
      pfloor(c, STAGE_W, 226, ['#d8eef0', '#b8d8e0', '#98c0cc', '#7aa6b4'], { sp: 30, r, seam: 'rgba(30,70,90,0.35)' });
      c.globalAlpha = 0.25; for (let i = 0; i < 70; i++) { const x = r() * STAGE_W, y = 230 + r() * 38, s = 6 + r() * 10; tline(c, x, y, x + s, y + 1, '#ffffff'); tline(c, x + s, y + 1, x + s + 3, y + 4, '#ffffff'); } c.globalAlpha = 1;
      rect(c, 0, 226, STAGE_W, 3, '#5a7a8a'); rect(c, 0, 226, STAGE_W, 1, '#c8e8f0');
      for (const px of [36, STAGE_W - 60]) { obox(c, px, 196, 24, 30, '#4a6a7a'); pdisk(c, px + 12, 208, 7, '#2a4050'); pdisk(c, px + 12, 208, 5, '#3ad8ff'); }
      L.push({ cv, p: 1 });
      const fish = [];
      const species = [['#ffd23a', '#ff9a2a', null, 9], ['#ff7a2a', '#ffffff', '#ffffff', 8], ['#3a8aff', '#ffe23a', null, 11], ['#c8d8e0', '#8aa0b0', '#6a8090', 7]];
      const sprs = species.map(s => fishSpr(s[0], s[1], s[2], s[3]));
      for (let i = 0; i < 12; i++) fish.push({ s: sprs[i % 4], y: 40 + r() * 140, sp: (0.3 + r() * 0.5) * (r() < 0.5 ? 1 : -1), ph: r() * 1000, p: 0.12 + r() * 0.2 });
      return { L, fish };
    },
    amb(g, t) { if (t % 12 === 0) { const x = choice([48, STAGE_W - 48]); FX.p('px', x + rand(-3, 3), 200, rand(-0.1, 0.1), -rand(0.4, 0.8), 200, '#bff4ff', choice([1, 2]), 0, { fade: true }); } },
    drawFar(ctx, cx, t) {
      for (const f of this.data.fish) { const span = W + 80; let x = ((f.ph + t * f.sp) % span + span) % span - 40 - cx * f.p * 0.2; const y = f.y + Math.sin(t * 0.04 + f.ph) * 4; ctx.drawImage(f.sp > 0 ? f.s[0] : f.s[1], R(x), R(y)); }
      const wh = (t % 1500); if (wh < 700) { const x = W + 60 - wh * 0.9, y = 70; ctx.fillStyle = '#0a3a5c'; for (let i = 0; i < 70; i++) { const hh = Math.sin(i / 70 * Math.PI) * 12 + 2; ctx.fillRect(R(x + i), R(y - hh * 0.6), 1, R(hh * 1.4)); } ctx.fillRect(R(x + 70), R(y - 8), 4, 6); ctx.fillRect(R(x + 70), R(y + 2), 4, 6); ctx.fillRect(R(x + 20), R(y + 8), 8, 4); }
      const L = this.data.L[1], off = -cx * 0.2;
      for (const wd of L.weeds) { const bx = off + wd.x; if (bx < -20 || bx > W + 20) continue; for (let s = 0; s < wd.h; s += 2) { const sw = Math.sin(t * 0.03 + wd.ph + s * 0.12) * s * 0.18; rect(ctx, bx + sw, 214 - s, 2, 2, wd.col); if (s % 6 === 0) rect(ctx, bx + sw + (s % 12 ? 2 : -2), 214 - s, 2, 1, shade(wd.col, 0.2)); } }
      for (let i = 0; i < 14; i++) { const by = 220 - ((t * (0.4 + (i % 4) * 0.15) + i * 47) % 230), bx = (i * 67) % W + Math.sin(t * 0.05 + i) * 3; rect(ctx, R(bx), R(by), 2, 2, '#bff4ff'); rect(ctx, R(bx), R(by), 1, 1, '#ffffff'); }
    }
  };

  // ---------------------------------------------------------------- 9. КУЗНИЦА-ЗАВОД
  const forge = {
    id: 'forge', name: 'Кузница-завод', farIdx: 1,
    build() {
      const r = rng(9009), L = [];
      let [cv, c] = mkCanvas(layerW(0.15), H); let w = cv.width;
      ditherV(c, 0, 0, w, H, ['#060404', '#120a08', '#20120c', '#2e1a10', '#3e2412']);
      for (let y = 30; y < 226; y += 5) for (let x = ((y / 5) & 1) * 6; x < w; x += 12) { rect(c, x, y, 11, 4, r() < 0.5 ? '#2a1610' : '#341c12'); rect(c, x, y, 11, 1, '#40261a'); }
      c.globalAlpha = 0.5; grad(c, 0, 30, w, 196, ['#000000', '#1a0a04', '#3a1a08']); c.globalAlpha = 1;
      for (let x = 30; x < w; x += 90) { rect(c, x - 1, 40, 32, 60, OL); grad(c, x, 41, 30, 58, ['#ff9a3a', '#c84a10', '#5a1a08']); rect(c, x + 14, 41, 2, 58, OL); rect(c, x, 69, 30, 2, OL); }
      for (let x = 0; x < w; x += 4) tline(c, x, 0, x + 2, 26, '#1a0e0a'); rect(c, 0, 26, w, 4, '#2a1a12'); for (let x = 0; x < w; x += 40) { tline(c, x, 26, x + 20, 4, '#3a2418', 2); tline(c, x + 40, 26, x + 20, 4, '#3a2418', 2); } rect(c, 0, 2, w, 3, '#3a2418');
      L.push({ cv, p: 0.15 });
      // печь и ковш
      [cv, c] = mkCanvas(layerW(0.4), H); w = cv.width;
      const fx = w * 0.3;
      rect(c, fx - 61, 50, 122, 176, OL); grad(c, fx - 60, 51, 120, 175, ['#4a3a34', '#3a2c26', '#2a1e1a']);
      for (let y = 56; y < 226; y += 8) for (let x = fx - 60 + ((y / 8) & 1) * 8; x < fx + 60; x += 16) { rect(c, x, y, 1, 8, '#1e1410'); rect(c, fx - 60, y, 120, 1, '#1e1410'); }
      for (let i = 0; i < 34; i++) { const ww = 132 - i * 2.6; rect(c, fx - ww / 2 - 1, 50 - i, ww + 2, 1, OL); rect(c, fx - ww / 2, 50 - i, ww, 1, i % 8 === 0 ? '#6a5a52' : '#4a3e3a'); rect(c, fx - ww / 2, 50 - i, 4, 1, '#6a5a52'); rect(c, fx + ww / 2 - 6, 50 - i, 6, 1, '#2a201c'); if (i % 8 === 4) for (let x = fx - ww / 2 + 4; x < fx + ww / 2 - 4; x += 8) rect(c, x, 50 - i, 1, 1, '#8a7a6e'); }
      rect(c, fx - 15, 0, 30, 17, OL); grad(c, fx - 14, 0, 28, 17, ['#3a302c', '#4a3e3a']); rect(c, fx - 14, 0, 4, 17, '#5a4e48');
      rect(c, fx - 64, 48, 128, 5, '#5a4a42'); rect(c, fx - 64, 48, 128, 1, '#8a7a6e');
      // устье печи
      for (let i = 0; i < 18; i++) { const ww = R(Math.sqrt(324 - (18 - i) * (18 - i)) * 2); rect(c, fx - ww, 130 + i, ww * 2, 1, '#1a0a04'); } rect(c, fx - 36, 148, 72, 50, '#1a0a04');
      for (let k = 0; k < 4; k++) rect(c, fx - 44 + k, 198 - k * 0, 88 - k * 2, 2, '#6a5a52');
      // трубы
      for (const [px, pw] of [[w * 0.62, 18], [w * 0.7, 12], [w * 0.92, 22]]) { rect(c, px - 1, 0, pw + 2, 226, OL); grad(c, px, 0, pw, 226, ['#5a4a42', '#3a2e28']); rect(c, px, 0, 3, 226, '#7a6a5e'); rect(c, px + pw - 3, 0, 3, 226, '#241a16'); for (let y = 20; y < 226; y += 46) { rect(c, px - 2, y, pw + 4, 5, '#4a3a32'); rect(c, px - 2, y, pw + 4, 1, '#8a7a6e'); } }
      tline(c, w * 0.62, 34, w * 0.45, 34, '#3a2e28', 8); rect(c, w * 0.45, 30, w * 0.17, 1, '#7a6a5e');
      // шестерня
      const gx = w * 0.82, gy = 90; pdisk(c, gx, gy, 26, '#2a201c'); for (let a = 0; a < 12; a++) { const an = a * Math.PI / 6; rect(c, gx + Math.cos(an) * 26 - 3, gy + Math.sin(an) * 26 - 3, 7, 7, '#3a2e28'); } pdisk(c, gx, gy, 22, '#4a3a32'); pdisk(c, gx, gy, 18, '#3a2e28'); pdisk(c, gx, gy, 6, '#6a5a50'); for (let a = 0; a < 4; a++) tline(c, gx, gy, gx + Math.cos(a * 1.57 + 0.4) * 18, gy + Math.sin(a * 1.57 + 0.4) * 18, '#5a4a42', 3);
      // ковш с металлом
      const lx = w * 0.52, ly = 60; tline(c, lx - 18, ly, lx, 0, '#2a2422', 2); tline(c, lx + 18, ly, lx, 0, '#2a2422', 2);
      for (let i = 0; i < 26; i++) { const ww = 22 - i * 0.35; rect(c, lx - ww, ly + i, ww * 2, 1, i < 2 ? '#7a6a62' : '#3a302c'); rect(c, lx - ww, ly + i, 2, 1, '#5a4a44'); }
      rect(c, lx - 21, ly, 42, 3, '#ffb03a'); rect(c, lx - 21, ly, 42, 1, '#fff0a0');
      rect(c, lx + 18, ly - 4, 8, 6, '#3a302c');
      // изложница
      for (let i = 0; i < 30; i++) { const ww = 26 - Math.max(0, i - 20) * 1.2; rect(c, lx + 33 - ww - 1, 160 + i, ww * 2 + 2, 1, OL); rect(c, lx + 33 - ww, 160 + i, ww * 2, 1, i < 3 ? '#6a5a52' : '#3a302c'); rect(c, lx + 33 - ww, 160 + i, 3, 1, '#5a4e48'); }
      rect(c, lx + 9, 161, 48, 3, '#ff9a2a'); rect(c, lx + 9, 161, 48, 1, '#ffe080'); for (let k = 0; k < 3; k++) { rect(c, lx + 10 + k * 18, 190, 4, 6, '#2a201c'); }
      L.push({ cv, p: 0.4, mouth: [fx, 170], pour: [lx + 26, 58], mold: [lx + 33, 161] });
      // конвейер
      [cv, c] = mkCanvas(layerW(0.7), H); w = cv.width;
      const cy = 196;
      rect(c, 0, cy - 1, w, 14, OL); grad(c, 0, cy, w, 12, ['#4a4a50', '#2a2a30']); rect(c, 0, cy, w, 1, '#8a8a92');
      for (let x = 10; x < w; x += 60) { rect(c, x, cy + 12, 6, 226 - cy - 12, '#2a2a30'); rect(c, x, cy + 12, 1, 226 - cy - 12, '#5a5a62'); obox(c, x - 4, 222, 14, 4, '#3a3a42'); }
      for (let x = 0; x < w; x += 8) pdisk(c, x + 4, cy + 7, 3, '#1a1a1e');
      for (let i = 0; i < 6; i++) { const ax = 30 + i * 110 + r() * 20; if (ax > w) break; }
      // наковальня и крюки
      const ax = w * 0.86; obox(c, ax - 20, 176, 40, 8, '#3a3a42'); rect(c, ax - 28, 176, 10, 4, '#3a3a42'); obox(c, ax - 10, 184, 20, 12, '#2a2a30');
      rect(c, ax - 6, 168, 3, 8, '#5a3a1e'); obox(c, ax - 12, 164, 14, 5, '#5a5a62');
      L.push({ cv, p: 0.7, belt: cy, chains: [[w * 0.12, 130], [w * 0.4, 100], [w * 0.68, 150]] });
      [cv, c] = mkCanvas(STAGE_W, H);
      pfloor(c, STAGE_W, 226, ['#4a3e3a', '#3a302c', '#2c2420', '#201a16'], { sp: 44, r, seam: 'rgba(0,0,0,0.4)' });
      for (let x = 0; x < STAGE_W; x += 44) for (let y = 229; y < H; y += 9) rect(c, x + (x - 400) * (y - 226) / 60 + 3, y, 1, 1, '#6a5a52');
      for (let i = 0; i < 12; i++) { c.drawImage(glowSpr(20, '#ff6a1a', 0.18), r() * STAGE_W - 20, 236 + r() * 20); }
      // канал с расплавом
      rect(c, 0, 264, STAGE_W, 6, '#1a0a04'); rect(c, 0, 265, STAGE_W, 5, '#ff7a1a'); for (let x = 0; x < STAGE_W; x += 3) rect(c, x, 265 + (x % 7 === 0 ? 1 : 0), 2, 1, '#ffd060');
      rect(c, 0, 263, STAGE_W, 1, '#6a5a52');
      for (const bx of [30, STAGE_W - 60]) { obox(c, bx, 196, 30, 30, '#3a302c'); rect(c, bx + 3, 198, 24, 3, '#ff8a2a'); rect(c, bx + 3, 198, 24, 1, '#ffe080'); for (let k = 0; k < 3; k++) rect(c, bx, 206 + k * 7, 30, 2, '#2a201c'); }
      rect(c, 0, 226, STAGE_W, 1, '#8a6a52');
      L.push({ cv, p: 1, crucibles: [45, STAGE_W - 45] });
      return { L };
    },
    amb(g, t) {
      const Lm = this.data.L[1], cx = g.camX;
      if (t % 2 === 0) { const sx = Lm.mold[0] + cx * 0.6; FX.spark(sx + rand(-4, 4), Lm.mold[1], 1, choice(['#fff6b0', '#ffb03a', '#ff7a1a'])); }
      if (t % 4 === 0) FX.p('fire', cx + rand(0, W), 266, rand(-0.2, 0.2), -rand(0.5, 1.2), randi(30, 60), null, 1, 0);
      for (const bx of this.data.L[3].crucibles) if (t % 9 === 0) FX.p('fire', bx + rand(-10, 10), 196, rand(-0.2, 0.2), -rand(0.3, 0.8), randi(20, 40), null, 1, 0);
      if (t % 14 === 0) FX.smoke(cx + rand(0, W), 40, 1, '#3a2e28');
    },
    drawFar(ctx, cx, t) {
      const Lm = this.data.L[1], off = -cx * 0.4;
      const [mx, my] = Lm.mouth, fl = 0.75 + Math.sin(t * 0.2) * 0.1 + Math.sin(t * 0.53) * 0.08;
      glow(ctx, off + mx, my, 60, '#ff6a1a', 0.5, fl);
      for (let i = 0; i < 7; i++) { const h = 12 + R(Math.sin(t * 0.17 + i * 1.9) * 5 + Math.sin(t * 0.41 + i) * 3), bx = off + mx - 30 + i * 10; for (let y = 0; y < h; y++) { const ww = Math.max(1, R(7 * (1 - y / h))); rect(ctx, bx - (ww >> 1) + R(Math.sin(t * 0.3 + y * 0.4 + i) * (y / h) * 2), my + 26 - y, ww, 1, y > h * 0.6 ? '#ff6a1a' : y > h * 0.3 ? '#ffb03a' : '#fff0a0'); } }
      rect(ctx, off + mx - 34, my + 18, 68, 10, '#ffb03a'); rect(ctx, off + mx - 34, my + 26, 68, 2, '#ff6a1a');
      const [px, py] = Lm.pour, my2 = Lm.mold[1];
      for (let y = py; y < my2; y += 2) { const ww = 3 + (((y + t * 4) % 12) < 3 ? 1 : 0); rect(ctx, off + px - (ww >> 1), y, ww, 2, ((y - t * 3) % 10 + 10) % 10 < 3 ? '#fff6c0' : '#ffb03a'); }
      glow(ctx, off + px, my2, 30, '#ffa03a', 0.5, 0.9);
      glow(ctx, off + Lm.pour[0] - 26, py + 2, 26, '#ff8a2a', 0.35);
    },
    drawExtra(ctx, cx, t) {
      const L2 = this.data.L[2], off = -cx * 0.7, w = L2.cv.width, cy = L2.belt;
      const sh = (t >> 1) % 8;
      for (let x = -sh; x < W + 8; x += 8) rect(ctx, x, cy + 1, 3, 2, '#5a5a62');
      for (let i = 0; i < 6; i++) { const x = ((i * 120 - t * 0.5) % (w + 40) + w + 40) % (w + 40) - 20 + off; if (x < -30 || x > W) continue; rect(ctx, x, cy - 7, 24, 7, '#1a0a04'); rect(ctx, x + 1, cy - 6, 22, 5, '#ff8a2a'); rect(ctx, x + 1, cy - 6, 22, 1, '#ffe080'); glow(ctx, x + 12, cy - 4, 18, '#ff7a1a', 0.3); }
      for (const [chx, len] of L2.chains) {
        const x0 = off + chx; if (x0 < -40 || x0 > W + 40) continue; const sw = Math.sin(t * 0.03 + chx) * 0.12;
        for (let k = 0; k < len; k += 4) { const x = x0 + Math.sin(sw) * k, odd = (k >> 2) & 1; rect(ctx, x - (odd ? 1 : 2), k, odd ? 3 : 5, 4, '#1a1414'); rect(ctx, x - (odd ? 0 : 1), k + 1, odd ? 1 : 3, 2, odd ? '#6a6a72' : '#4a4a52'); }
        const hx = x0 + Math.sin(sw) * len; rect(ctx, hx - 1, len, 3, 6, '#3a3a42'); rect(ctx, hx - 5, len + 6, 3, 6, '#3a3a42'); rect(ctx, hx - 5, len + 10, 9, 3, '#3a3a42'); rect(ctx, hx + 3, len + 6, 2, 5, '#3a3a42'); rect(ctx, hx - 4, len + 10, 7, 1, '#7a7a84');
      }
    }
  };

  // ---------------------------------------------------------------- 10. ТРОННЫЙ ЗАЛ
  function banner(c, x, y, bw, bh, col, r) {
    rect(c, x - 3, y - 2, bw + 6, 3, '#c8a040'); rect(c, x - 3, y - 2, bw + 6, 1, '#ffe080'); pdisk(c, x - 3, y - 1, 2, '#ffe080'); pdisk(c, x + bw + 3, y - 1, 2, '#ffe080');
    for (let yy = 0; yy < bh; yy++) { const tip = yy > bh - 12 ? (yy - (bh - 12)) : 0; const x0 = x + tip * (bw / 24), x1 = x + bw - tip * (bw / 24); rect(c, x0 - 1, y + 1 + yy, x1 - x0 + 2, 1, OL); rect(c, x0, y + 1 + yy, x1 - x0, 1, col); rect(c, x0, y + 1 + yy, 2, 1, '#e8b840'); rect(c, x1 - 2, y + 1 + yy, 2, 1, '#e8b840'); rect(c, x0 + 3, y + 1 + yy, 2, 1, shade(col, 0.2)); rect(c, x1 - 6, y + 1 + yy, 3, 1, shade(col, -0.35)); }
    const cx = x + bw / 2, cy = y + bh * 0.42;
    rect(c, cx - 7, cy, 14, 6, '#e8b840'); for (const dx of [-7, -2, 3]) rect(c, cx + dx, cy - 5, 4, 5, '#e8b840'); rect(c, cx - 6, cy + 2, 2, 2, '#ff3a3a'); rect(c, cx + 4, cy + 2, 2, 2, '#3a8aff'); rect(c, cx - 1, cy + 2, 2, 2, '#3aff6a'); rect(c, cx - 7, cy, 14, 1, '#fff0a0');
  }
  const throne = {
    id: 'throne', name: 'Тронный зал', farIdx: 0,
    build() {
      const r = rng(1010), L = [];
      let [cv, c] = mkCanvas(layerW(0.2), H); let w = cv.width; const m = w / 2;
      grad(c, 0, 0, w, 226, ['#120a10', '#1e1218', '#2a1a20', '#342026']);
      for (let y = 0; y < 226; y += 8) for (let x = ((y / 8) & 1) * 10; x < w; x += 20) { rect(c, x, y, 19, 7, r() < 0.5 ? '#2e1e22' : '#382428'); rect(c, x, y, 19, 1, '#44302e'); rect(c, x, y + 7, 20, 1, '#140a0e'); }
      c.globalAlpha = 0.5; grad(c, 0, 0, w, 226, ['#000000', '#140a10', '#2a1a1e']); c.globalAlpha = 1;
      // витражи
      const wins = [];
      const window_ = (wx, wy, ww, wh) => {
        rect(c, wx - 4, wy - 4, ww + 8, wh + 8, '#5a4a4a'); rect(c, wx - 3, wy - 3, ww + 6, wh + 6, OL);
        for (let yy = 0; yy < wh; yy++) { const cut = yy < ww / 2 ? R(ww / 2 - Math.sqrt((ww / 2) * (ww / 2) - (ww / 2 - yy) * (ww / 2 - yy))) : 0; for (let xx = cut; xx < ww - cut; xx++) { const a = xx + yy, b = xx - yy + 400, dx = Math.abs(xx - ww / 2), cell = ((a >> 3) * 3 + (b >> 3)) % 4; let col = dx < 4 && yy > 12 && yy < wh - 10 ? '#e8b840' : yy < ww * 0.6 ? ['#c83a4a', '#e8b840', '#c83a4a', '#8a3ac8'][cell] : ['#3a6ad8', '#2a4aa8', '#3ab86a', '#5a8ae8'][cell]; if ((a & 7) === 0 || (b & 7) === 0) col = '#1a1014'; if (yy === (ww >> 1) + 2 || yy === wh - 8) col = '#3a2a2a'; c.fillStyle = col; c.fillRect(wx + xx, wy + yy, 1, 1); } }
        c.globalAlpha = 0.3; rect(c, wx, wy, ww / 2, wh, '#ffffff'); c.globalAlpha = 1;
        wins.push([wx + ww / 2, wy + wh, ww]);
      };
      window_(m - 150, 30, 30, 90); window_(m + 120, 30, 30, 90); window_(m - 15, 20, 30, 70); window_(28, 40, 24, 70); window_(w - 52, 40, 24, 70);
      // гобелены по бокам трона
      banner(c, m - 74, 92, 30, 86, '#a01828', r); banner(c, m + 44, 92, 30, 86, '#a01828', r);
      // помост и трон
      for (let k = 0; k < 4; k++) { const sw = 150 - k * 22, sy = 222 - k * 6; obox(c, m - sw / 2, sy, sw, 6, k % 2 ? '#5a4448' : '#6a5458'); }
      rect(c, m - 56, 216, 112, 6, '#8a1a24');
      const ty = 198;
      rect(c, m - 24, ty - 82, 48, 84, OL); grad(c, m - 23, ty - 81, 46, 82, ['#ffe080', '#e8b840', '#a87a20']);
      for (const dx of [-23, -12, -1, 10]) { rect(c, m + dx, ty - 92, 4, 11, OL); rect(c, m + dx + 1, ty - 91, 2, 10, '#e8b840'); rect(c, m + dx + 1, ty - 94, 2, 2, '#ff3a3a'); }
      rect(c, m - 16, ty - 72, 32, 52, '#8a1020'); rect(c, m - 16, ty - 72, 32, 2, '#c02030'); for (let y = ty - 66; y < ty - 22; y += 8) for (let x = m - 12; x < m + 14; x += 8) rect(c, x, y, 1, 1, '#ffd860');
      pdisk(c, m, ty - 78, 4, '#3ad8ff'); pdisk(c, m - 1, ty - 79, 1.5, '#ffffff');
      obox(c, m - 30, ty - 20, 60, 8, '#c8982a'); rect(c, m - 26, ty - 22, 52, 4, '#a01828');
      obox(c, m - 34, ty - 34, 8, 18, '#c8982a'); obox(c, m + 26, ty - 34, 8, 18, '#c8982a'); pdisk(c, m - 30, ty - 35, 4, '#e8b840'); pdisk(c, m + 30, ty - 35, 4, '#e8b840');
      obox(c, m - 26, ty - 12, 6, 16, '#a87a20'); obox(c, m + 20, ty - 12, 6, 16, '#a87a20');
      L.push({ cv, p: 0.2, wins });
      // колонны
      [cv, c] = mkCanvas(layerW(0.55), H); w = cv.width;
      const torches = [];
      for (let x = 20; x < w; x += 128) {
        const cw = 30;
        rect(c, x - 1, 22, cw + 2, 200, OL); grad(c, x, 22, cw, 200, ['#d8ccc0', '#c8bcb0', '#b0a498']);
        for (let f = 3; f < cw - 2; f += 5) { rect(c, x + f, 30, 2, 186, '#9a8e84'); rect(c, x + f + 2, 30, 1, 186, '#ece4d8'); }
        rect(c, x + cw - 6, 22, 6, 200, 'rgba(40,20,30,0.35)'); rect(c, x, 22, 2, 200, '#f4ece0');
        obox(c, x - 6, 12, cw + 12, 6, '#d8ccc0'); obox(c, x - 3, 18, cw + 6, 6, '#c8bcb0'); for (let k = 0; k < 4; k++) pdisk(c, x - 2 + k * 11, 21, 2, '#a89c90');
        obox(c, x - 5, 208, cw + 10, 8, '#b0a498'); obox(c, x - 8, 216, cw + 16, 8, '#9a8e84');
        // факел
        const tx = x + cw / 2; obox(c, tx - 2, 110, 4, 16, '#4a3a2a'); obox(c, tx - 4, 106, 8, 4, '#c8a040'); torches.push([tx, 104]);
        if (x + 64 < w) banner(c, x + cw + 34, 22, 30, 70, x % 256 < 128 ? '#2a3a8a' : '#a01828', r);
      }
      rect(c, 0, 0, w, 14, OL); grad(c, 0, 0, w, 13, ['#3a2a2e', '#4a3438']); rect(c, 0, 12, w, 1, '#6a5458');
      L.push({ cv, p: 0.55, torches });
      [cv, c] = mkCanvas(STAGE_W, H);
      // мраморная шахматка
      const y0 = 224;
      for (let j = 0, v = 0; y0 + j < H; j++) { const sc = 0.5 + j / 46 * 1.0; v += 1 / sc; for (let x = 0; x < STAGE_W; x += 2) { const u = (x - STAGE_W / 2) / sc; const chk = ((Math.floor(u / 24) + Math.floor(v / 8)) & 1); rect(c, x, y0 + j, 2, 1, chk ? (j < 8 ? '#3a2a30' : '#2a1e24') : (j < 8 ? '#c8bcb0' : '#e0d6cc')); } }
      c.globalAlpha = 0.25; grad(c, 0, y0, STAGE_W, 10, ['#000000', '#3a2a30']); c.globalAlpha = 1;
      c.globalAlpha = 0.12; for (let x = 60; x < STAGE_W; x += 140) for (let y = y0 + 2; y < H; y += 2) rect(c, x + (x - 400) * (y - y0) / 80, y, 18, 1, '#ffffff'); c.globalAlpha = 1;
      // красная дорожка
      rect(c, 0, 233, STAGE_W, 1, OL); rect(c, 0, 234, STAGE_W, 2, '#e8b840'); grad(c, 0, 236, STAGE_W, 22, ['#b01c2a', '#981624', '#80101c']); rect(c, 0, 258, STAGE_W, 2, '#c8982a'); rect(c, 0, 260, STAGE_W, 1, OL);
      for (let x = 0; x < STAGE_W; x += 24) { rect(c, x + 10, 239, 4, 1, '#d8a838'); rect(c, x + 8, 241, 8, 1, '#d8a838'); rect(c, x + 10, 243, 4, 1, '#d8a838'); rect(c, x, 252, 24, 1, '#6a0a14'); }
      rect(c, 0, 236, STAGE_W, 1, '#d83a48');
      for (let i = 0; i < 300; i++) rect(c, r() * STAGE_W, 237 + r() * 20, 1, 1, 'rgba(0,0,0,0.2)');
      rect(c, 0, y0, STAGE_W, 1, '#8a7a72');
      for (const bx of [40, STAGE_W - 40]) { obox(c, bx - 3, 176, 6, 52, '#6a5a3a'); for (let i = 0; i < 8; i++) rect(c, bx - 10 + i * 0.6, 168 + i, 20 - i * 1.2, 1, i < 2 ? '#e8b840' : '#a87a20'); obox(c, bx - 8, 224, 16, 4, '#4a3a2a'); }
      L.push({ cv, p: 1, braz: [40, STAGE_W - 40] });
      return { L };
    },
    amb(g, t) {
      for (const x of this.data.L[2].braz) if (t % 2 === 0) FX.fire(x, 166, 2, 4, 1.3);
      if (t % 20 === 0) FX.p('px', g.camX + rand(0, W), rand(40, 200), rand(-0.1, 0.1), rand(0.02, 0.1), 260, '#fff0c0', 1, 0, { fade: true });
    },
    drawFar(ctx, cx, t) {
      const L0 = this.data.L[0], off = -cx * 0.2;
      ctx.globalAlpha = 0.07 + Math.sin(t * 0.01) * 0.015; ctx.fillStyle = '#ffe8c0';
      for (const [wx, wy, ww] of L0.wins) { const x = off + wx; ctx.beginPath(); ctx.moveTo(x - ww / 2, wy - 60); ctx.lineTo(x + ww / 2, wy - 60); ctx.lineTo(x + ww * 1.6 + 30, 226); ctx.lineTo(x - ww * 0.4 + 10, 226); ctx.closePath(); ctx.fill(); }
      ctx.globalAlpha = 1;
    },
    drawExtra(ctx, cx, t) {
      const L1 = this.data.L[1], off = -cx * 0.55;
      for (const [tx, ty] of L1.torches) {
        const x = R(off + tx); if (x < -30 || x > W + 30) continue; const fl = Math.sin(t * 0.3 + tx) * 0.5 + Math.sin(t * 0.71 + tx * 2) * 0.5;
        glow(ctx, x, ty - 4, 28, '#ffa040', 0.35, 0.75 + fl * 0.2);
        for (let i = 0; i < 4; i++) { const h = 8 - i * 2 + R(fl * 2), ww = 6 - i * 1.3; rect(ctx, x - ww / 2 + (i === 3 ? R(Math.sin(t * 0.5) * 1) : 0), ty - h, ww, h, ['#c83a10', '#ff7a1a', '#ffc040', '#fff4c0'][i]); }
      }
    }
  };

  STAGES.push(metro, arcade, roof, graveyard, station, ship, desert, dome, forge, throne);
})();
