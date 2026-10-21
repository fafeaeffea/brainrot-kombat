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
