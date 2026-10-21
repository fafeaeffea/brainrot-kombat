'use strict';
// Главное меню внутри аркадного автомата: экран автомата показывает игру
const Cabinet = {
  SCR: { x: 56, y: 22, w: 368, h: 207 },
  cv: null, buf: null, joy: 0, joyT: 0, btnT: 0, coinT: 0,
  build() {
    const [cv, c] = mkCanvas(W, H), r = rng(77), S = this.SCR;
    // зал аркад
    ditherV(c, 0, 0, W, 236, ['#0a0614', '#160a28', '#24103a', '#1a0c2a']);
    for (const [y, col] of [[18, '#ff3a8a'], [24, '#3ae0ff']]) { c.globalAlpha = 0.25; rect(c, 0, y - 2, W, 5, col); c.globalAlpha = 1; rect(c, 0, y, W, 1, col); }
    // соседние автоматы
    for (const [x0, scol] of [[-46, '#3affb0'], [8, '#ffd040'], [414, '#ff5a8a'], [468, '#5ab0ff']]) {
      rect(c, x0, 70, 60, 170, '#0e0818'); rect(c, x0 + 2, 72, 56, 166, '#1a1028');
      rect(c, x0 + 6, 76, 48, 12, scol); c.globalAlpha = 0.3; rect(c, x0 - 4, 70, 68, 22, scol); c.globalAlpha = 1;
      rect(c, x0 + 8, 96, 44, 34, '#05040a'); c.globalAlpha = 0.5; for (let y = 98; y < 128; y += 2) rect(c, x0 + 9, y, 42, 1, scol); c.globalAlpha = 1;
      rect(c, x0 + 4, 140, 52, 12, '#2a1a3a'); pdisk(c, x0 + 16, 145, 3, '#c01010'); pdisk(c, x0 + 32, 145, 2, '#ffd040'); pdisk(c, x0 + 40, 145, 2, '#3a8aff');
    }
    // пол — ковёр с узором
    rect(c, 0, 236, W, 34, '#120a1e');
    for (let i = 0; i < 160; i++) { c.fillStyle = choice(['#ff3a8a', '#3ae0ff', '#ffd040', '#7dff6a', '#8a5aff']); const x = Math.floor(r() * W), y = 238 + Math.floor(r() * 32); c.fillRect(x, y, r() < 0.5 ? 2 : 1, 1); }
    c.globalAlpha = 0.5; rect(c, 60, 236, 360, 34, '#000'); c.globalAlpha = 1;
    // корпус
    const X0 = S.x - 18, X1 = S.x + S.w + 18;
    rect(c, X0 - 6, 0, 10, 270, '#06030a'); rect(c, X1 - 4, 0, 10, 270, '#06030a');
    rect(c, X0 - 2, 0, 6, 270, '#ff2a6a'); rect(c, X1 - 4, 0, 6, 270, '#ff2a6a'); rect(c, X0 - 1, 0, 2, 270, '#ffa0c0'); rect(c, X1 - 3, 0, 2, 270, '#ffa0c0');
    ditherV(c, X0 + 4, 0, X1 - X0 - 8, 270, ['#3a0610', '#5a0a18', '#3a0610']);
    // вывеска
    rect(c, X0 + 8, 0, X1 - X0 - 16, 17, '#c0c4cc'); rect(c, X0 + 10, 1, X1 - X0 - 20, 15, '#1a0408');
    ditherV(c, X0 + 12, 2, X1 - X0 - 24, 12, ['#ffe070', '#ff9a2a', '#e0401a']);
    drawText(c, 'БРЕЙНРОТ КОМБАТ', W / 2, 8, 1, ['#ffffff', '#ffe8a0', '#ffb030'], 'center', '#3a0408', '#3a0408');
    // рамка экрана
    rect(c, S.x - 10, S.y - 4, S.w + 20, S.h + 10, '#0a0a10'); rect(c, S.x - 8, S.y - 2, S.w + 16, S.h + 6, '#14141c');
    c.clearRect(S.x, S.y, S.w, S.h);
    // наклейки на рамке
    // пульт
    const py = S.y + S.h + 6;
    for (let y = py; y < py + 30; y++) { const k = (y - py) / 30, ext = Math.round(k * 10); rect(c, X0 - ext, y, X1 - X0 + ext * 2, 1, y < py + 3 ? '#5a4a6a' : k < 0.5 ? '#2a1a34' : '#20142a'); }
    rect(c, X0 - 10, py + 30, X1 - X0 + 20, 3, '#ff2a6a');
    // рисунок на пульте: молнии
    c.globalAlpha = 0.35; for (let i = 0; i < 4; i++) bolt(c, X0 + 20 + i * 80, py + 5, X0 + 50 + i * 80, py + 30, '#ffd040', 5, 6, 1); c.globalAlpha = 1;
    
    // монетоприёмник
    const cy = py + 38;
    rect(c, 196, cy, 88, 270 - cy, '#4a4a54'); rect(c, 198, cy + 2, 84, 270 - cy, '#6a6a76'); rect(c, 198, cy + 2, 84, 1, '#9a9aa6');
    for (const x of [214, 254]) { rect(c, x, cy + 4, 14, 12, '#2a2a30'); rect(c, x + 6, cy + 6, 2, 8, '#000'); }
    this.cv = cv;
  },
  compose(g) {
    if (!this.cv) this.build();
    const ctx = g.ctx, cv = g.cv, K = OUT_K, S = this.SCR, k = ease(clamp(g.cabK, 0, 1)), t = g.frame;
    if (!this.buf || this.buf.width !== cv.width) [this.buf, this.bctx] = mkCanvas(cv.width, cv.height);
    this.bctx.drawImage(cv, 0, 0);
    const rx = lerp(0, S.x, k), ry = lerp(0, S.y, k), rw = lerp(W, S.w, k), rh = lerp(H, S.h, k), s = rw / S.w, ox = rx - S.x * s, oy = ry - S.y * s;
    ctx.setTransform(K * s, 0, 0, K * s, K * ox, K * oy); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.cv, 0, 0);
    this.drawLive(ctx, t);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.buf, 0, 0, cv.width, cv.height, Math.round(rx * K), Math.round(ry * K), Math.round(rw * K), Math.round(rh * K));
    // ЭЛТ: строки развёртки, блик, затемнение краёв
    if (k > 0.05) {
      ctx.globalAlpha = 0.16 * k; ctx.fillStyle = '#000';
      const step = Math.max(2, Math.round(2 * s));
      for (let y = Math.round(ry * K); y < (ry + rh) * K; y += step) ctx.fillRect(Math.round(rx * K), y, Math.round(rw * K), 1);
      const gr = ctx.createRadialGradient((rx + rw / 2) * K, (ry + rh / 2) * K, rh * K * 0.3, (rx + rw / 2) * K, (ry + rh / 2) * K, rw * K * 0.62);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.9)');
      ctx.globalAlpha = k; ctx.fillStyle = gr; ctx.fillRect(rx * K, ry * K, rw * K, rh * K);
      ctx.globalAlpha = 0.07 * k; ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(rx * K, ry * K); ctx.lineTo((rx + rw * 0.45) * K, ry * K); ctx.lineTo((rx + rw * 0.2) * K, (ry + rh) * K); ctx.lineTo(rx * K, (ry + rh) * K); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.setTransform(K, 0, 0, K, 0, 0);
  },
  // мигающие лампы, джойстик и кнопки реагируют на управление
  drawLive(c, t) {
    const S = this.SCR, py = S.y + S.h + 6;
    for (let i = 0; i < 24; i++) { const on = ((t >> 3) + i) % 3 === 0; c.fillStyle = on ? '#fff6c0' : '#7a4a10'; c.fillRect(56 + i * 16, 16, 3, 1); }
    if (this.joyT > 0) this.joyT--; if (this.btnT > 0) this.btnT--;
    const jx = 150, jy = py + 16, tilt = this.joyT > 0 ? this.joy : 0;
    pdisk(c, jx, jy + 4, 9, '#0a0a10'); pdisk(c, jx, jy + 3, 7, '#2a2a34');
    c.fillStyle = '#c0c0c8'; c.fillRect(jx - 1, jy - 10 + (tilt ? 2 : 0), 2, 13);
    pdisk(c, jx, jy - 12 + tilt * 4, 6, '#c01010'); pdisk(c, jx - 2, jy - 14 + tilt * 4, 2, '#ff8a8a');
    const cols = ['#e02020', '#ffd020', '#2a8aff', '#20c040', '#e02020', '#ffd020'];
    for (let i = 0; i < 6; i++) {
      const bx = 228 + (i % 3) * 22 + (i >= 3 ? 6 : 0), by = py + 8 + (i >= 3 ? 10 : 0), dn = this.btnT > 0 && i === 0;
      pdisk(c, bx, by + 2, 7, '#0a0a10'); pdisk(c, bx, by + (dn ? 2 : 0), 6, cols[i]); if (!dn) pdisk(c, bx - 2, by - 2, 2, '#ffffff');
    }
    for (const [x, col] of [[318, '#ff6a3a'], [340, '#3aa8ff']]) { pdisk(c, x, py + 11, 4, (t >> 4) & 1 ? col : '#3a2a2a'); }
    drawText(c, '1P', 318, py + 22, 1, '#ffb0a0'); drawText(c, '2P', 340, py + 22, 1, '#a0d0ff');
    const cy = py + 38;
    for (const x of [214, 254]) { c.fillStyle = (t >> 4) & 1 ? '#ff3a2a' : '#7a1a10'; c.fillRect(x + 1, cy + 17, 12, 4); }
    if ((t >> 5) & 1) drawText(c, 'ВСТАВЬ МОНЕТУ', 240, cy + 26, 1, ['#ffffff', '#ffd040']);
  },
  nudge(m) {
    if (m === 'up' || m === 'left') { this.joy = -1; this.joyT = 8; }
    else if (m === 'down' || m === 'right') { this.joy = 1; this.joyT = 8; }
    else if (m === 'ok' || m === 'ok2') this.btnT = 10;
  }
};
