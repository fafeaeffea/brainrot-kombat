'use strict';
// Фаталити: у каждого бойца своё добивание
function bolt(ctx, x1, y1, x2, y2, col, segs = 8, jit = 8, th = 1) {
  ctx.fillStyle = col; let px = x1, py = y1;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs, nx = lerp(x1, x2, t) + (i < segs ? rand(-jit, jit) : 0), ny = lerp(y1, y2, t) + (i < segs ? rand(-jit * 0.4, jit * 0.4) : 0);
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(nx - px), Math.abs(ny - py))));
    for (let k = 0; k <= n; k++) ctx.fillRect(Math.round(lerp(px, nx, k / n)), Math.round(lerp(py, ny, k / n)), th, th);
    px = nx; py = ny;
  }
}
function snapCanvas(f) { const [cv, c] = mkCanvas(SPR_W, SPR_H); c.drawImage(f.R.cv, 0, 0); return cv; }
const BIG_R = new Raster(96, 40);

const FATALITIES = {
  burn: {
    dur: 175,
    update(g, a, v, t) {
      if (t === 1) { a.forcePose = mkPose(POSES.thrust); Sound.play('fire'); }
      if (t > 8 && t < 120) { const k = t < 90 ? 6 : 3; for (let i = 0; i < k; i++) FX.fire(v.x + rand(-9, 9), v.y - rand(0, t < 90 ? 62 : 20), 1, 1, 1.6); if (t % 12 === 0) Sound.play('fire'); }
      if (t === 30) a.forcePose = null, a.st = 'idle';
      if (t < 85) { v.tint = 'char'; v.tintK = clamp((t - 15) / 60, 0, 1); const s = Math.sin(t * 0.5); v.forcePose = mkPose({ hF: [2, -22 + s * 4], hB: [-2, -20 - s * 4], torso: s * 15, head: s * 20, hy: 3, fF: [7, 0], fB: [-7, 0] }); }
      if (t === 85) { v.skeleton = true; v.tint = null; Sound.play('gore'); }
      if (t > 85 && t < 118) v.forcePose = blendPose(ANIM.dizzy(v.ch, t), mkPose(POSES.lie), ease((t - 85) / 30));
      if (t === 120) { FX.burst(v, { power: 0.6, vyMin: -1.5, vyMax: 0.3, g: 0.15, tint: '#3a3030', tintK: 0.35, spread: 1.2 }); v.hidden = true; FX.smoke(v.x, GROUND - 4, 20); Sound.play('crunch'); g.impact(); }
    }
  },
  shatter: {
    dur: 160,
    update(g, a, v, t) {
      if (t === 1) { a.forcePose = mkPose(POSES.thrust); Sound.play('ice'); }
      if (t > 2 && t < 30) for (let i = 0; i < 4; i++) { const k = Math.random(); FX.p('px', lerp(a.x + a.facing * 20, v.x, k), lerp(a.y - 48, v.y - 35, k) + rand(-3, 3), 0, 0, 10, choice(['#ffffff', '#9fe6ff', '#3a8ad8']), 1, 0); }
      if (t === 22) { v.tint = 'ice'; v.forcePose = v.pose; Sound.play('freeze'); for (let i = 0; i < 30; i++) FX.p('px', v.x + rand(-12, 12), v.y - rand(0, 64), rand(-0.5, 0.5), rand(-0.5, 0.5), 40, '#dff6ff', 1, 0); }
      if (t === 40) a.forcePose = null;
      if (t > 40 && t < 58) { a.st = 'walk'; a.x += a.facing * Math.max(0, (Math.abs(v.x - a.x) - 26) * 0.15); a.forcePose = ANIM.walk(a.ch, t * 2); }
      if (t === 58) a.forcePose = mkPose(stanceOf(a.ch), MOVE_POSES.uppercut.wind);
      if (t === 64) { a.forcePose = movePose(a.ch, 'uppercut', 0, 1); FX.burst(v, { radial: true, power: 3.8, tint: '#bfe8ff', tintK: 0.55, g: 0.25, vyMin: -3, vyMax: 0 }); v.hidden = true; Sound.play('shatter'); g.shake(9); g.flashA = 0.6; }
      if (t === 95) a.forcePose = null;
    }
  },
  laser: {
    dur: 165,
    update(g, a, v, t) {
      if (t === 1) a.forcePose = mkPose({ hF: [5, -9], eF: { x: 1, y: 0 }, hB: [7, -3], torso: 0, head: 10 });
      if (t < 34 && t % 8 === 0) Sound.play('move');
      if (t === 36) { Sound.play('laser'); g.flashA = 0.8; g.shake(6); }
      if (t > 36 && t < 90) { v.tint = 'flash'; v.tintK = clamp((t - 36) / 20, 0, 1); g.shake(2); if (t % 2 === 0) FX.spark(v.x + rand(-10, 10), v.y - rand(0, 60), 2, '#bff6ff'); v.forcePose = mkPose(POSES.hit, { hF: [0, -22], hB: [-4, -20], head: -30 }); }
      if (t === 64) { FX.burst(v, { power: 0, spread: 0.6, vyMin: -2.4, vyMax: -0.4, g: -0.01, tint: '#ffffff', tintK: 0.5, floor: false, lifeMin: 50, lifeMax: 110, fade: true }); v.hidden = true; g.impact(); }
      if (t === 90) { for (let x = -14; x <= 14; x++) FX.decals.push({ x: Math.round(v.x + x), y: GROUND + randi(0, 3), col: '#1a1416', sz: 1 }); a.forcePose = mkPose({ hF: [7, -12], eF: { x: 1, y: -0.2 }, hB: [2, 13], torso: 0, fF: [5, 0], fB: [-5, 0] }); }
      if (t > 90 && t % 3 === 0) FX.smoke(v.x + rand(-8, 8), GROUND - 2, 1);
    },
    front(ctx, cx, g, a, v, t) {
      if (t < 36) { const x = Math.round(v.x - cx), y = Math.round(v.y - 32), s = 14 + Math.sin(t * 0.3) * 2; if ((t >> 2) & 1) { ctx.fillStyle = '#ff2a2a'; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.fillRect(x + sx * s - (sx > 0 ? 4 : 0), y + sy * s, 5, 1); ctx.fillRect(x + sx * s, y + sy * s - (sy > 0 ? 4 : 0), 1, 5); } ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); } }
      if (t >= 36 && t < 100) {
        const k = t < 46 ? (t - 36) / 10 : t > 85 ? 1 - (t - 85) / 15 : 1, w = Math.max(1, Math.round(16 * k)), x = Math.round(v.x - cx);
        ctx.globalAlpha = 0.5; ctx.fillStyle = '#2a6aff'; ctx.fillRect(x - w - 3, 0, w * 2 + 6, GROUND + 2);
        ctx.globalAlpha = 1; ctx.fillStyle = '#7fe8ff'; ctx.fillRect(x - w, 0, w * 2, GROUND + 2);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x - Math.ceil(w / 2), 0, Math.ceil(w / 2) * 2, GROUND + 2);
        pdisk(ctx, x, GROUND, w + 6 + Math.sin(t) * 2, '#bff6ff');
      }
    }
  },
  slice: {
    dur: 175,
    update(g, a, v, t, s) {
      const dir = Math.sign(v.x - a.x) || 1;
      if (t === 1) a.forcePose = mkPose(stanceOf(a.ch), { hF: [-4, -14], torso: -6, wa: -150 });
      if (t === 16) { s.x0 = a.x; a.x = v.x + dir * 42; a.forcePose = mkPose(POSES.cut, { wa: 40 }); Sound.play('slash'); g.flashA = 0.5; for (let i = 0; i < 6; i++) g.ghostTrail(a, lerp(s.x0, a.x, i / 6)); }
      if (t === 40) { a.facing = -dir; a.forcePose = mkPose(stanceOf(a.ch), { hF: [6, 2], wa: 80 }); Sound.play('block'); }
      if (t === 45) {
        const img = snapCanvas(v), cut = SPR_OY - 34;
        s.top = { img, sy: 0, sh: cut, x: v.x, y: v.y - (SPR_OY - cut), vx: dir * 0.35, vy: 0, rot: 0, vr: dir * 0.012, f: v.facing };
        s.bot = { img, sy: cut, sh: SPR_H - cut, x: v.x, y: v.y, vx: 0, vy: 0, rot: 0, vr: 0, f: v.facing };
        v.hidden = true; Sound.play('gore'); g.impact(); FX.blood(v.x, v.y - 34, dir, 30, 2);
      }
      if (s.top) {
        const T = s.top; T.x += T.vx; T.rot += T.vr; if (Math.abs(T.rot) > 0.25) { T.vy += 0.25; T.y += T.vy; T.vx *= 0.98; }
        if (T.y > GROUND - 8 && T.vy > 0) { T.y = GROUND - 8; T.vy = 0; T.vx = 0; T.vr = 0; }
        if (t < 150) FX.gush(T.x + Math.sin(T.rot) * 4, T.y + Math.cos(T.rot) * 0 - 2 + (SPR_OY - (SPR_OY - 34)) * 0, 2, 3);
        if (t > 80) { s.bot.rot = clamp(s.bot.rot - dir * 0.03, -1.45, 1.45); }
        if (t < 160 && t % 2 === 0) FX.gush(s.bot.x - Math.sin(s.bot.rot) * 34, s.bot.y - Math.cos(s.bot.rot) * 34, 3, 4.5);
      }
    },
    front(ctx, cx, g, a, v, t, s) {
      if (t >= 16 && t < 45) { const y = Math.round(v.y - 34), x = Math.round(v.x - cx); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 30, y, 60, 1); ctx.fillStyle = '#ff3a5a'; ctx.fillRect(x - 24, y + 1, 48, 1); }
      for (const P of [s.bot, s.top]) {
        if (!P) continue;
        ctx.save(); ctx.translate(Math.round(P.x - cx), Math.round(P.y)); ctx.rotate(P.rot); ctx.scale(P.f, 1);
        ctx.drawImage(P.img, 0, P.sy, SPR_W, P.sh, -SPR_OX, P === s.top ? -P.sh : -(SPR_OY - P.sy), SPR_W, P.sh); ctx.restore();
      }
    }
  },
  hammer: {
    dur: 165, zoom: 1.25,
    update(g, a, v, t, s) {
      if (t === 1) { a.forcePose = mkPose(POSES.raise); }
      if (t === 8 || t === 18) { Sound.play('thunder'); g.flashA = 0.7; s.bolt = 4; }
      if (t === 24) { s.hy = -120; s.vy = 0; Sound.play('whooshH'); }
      if (s.hy != null && !s.hit) { s.vy += 0.9; s.hy += s.vy; if (s.hy >= v.y - 70) { s.hy = v.y - 34; s.hit = true; } }
      if (s.hit && !s.done) { s.done = true; v.scaleY = 0.16; FX.blood(v.x, GROUND - 6, -1, 40, 2); FX.blood(v.x, GROUND - 6, 1, 40, 2); FX.dust(v.x, GROUND, 30); g.shake(14); Sound.play('crunch'); Sound.play('explode'); g.flashA = 0.5; }
      if (t > 110 && s.hy != null) s.hy -= (t - 110) * 0.5;
      if (t === 60) a.forcePose = null;
    },
    front(ctx, cx, g, a, v, t, s) {
      if (s.bolt > 0) { s.bolt--; bolt(ctx, a.x - cx + a.facing * 4 + rand(-30, 30), 0, a.x - cx + a.facing * 4, a.y - 80, '#cfe8ff', 10, 10, 2); bolt(ctx, a.x - cx + 4, 0, a.x - cx + 4, a.y - 80, '#ffffff', 10, 6, 1); }
      if (s.hy != null) {
        const x = Math.round(v.x - cx), y = Math.round(s.hy);
        ctx.fillStyle = '#4a3020'; ctx.fillRect(x - 4, y - 70, 8, 70); ctx.fillStyle = '#7a5030'; ctx.fillRect(x - 3, y - 70, 3, 70);
        for (let i = 0; i < 6; i++) { ctx.fillStyle = '#2a1a10'; ctx.fillRect(x - 4, y - 66 + i * 9, 8, 2); }
        ctx.fillStyle = '#2a2e36'; ctx.fillRect(x - 32, y - 6, 64, 40); ctx.fillStyle = '#7a8290'; ctx.fillRect(x - 30, y - 4, 60, 36); ctx.fillStyle = '#aab3bd'; ctx.fillRect(x - 30, y - 4, 60, 6); ctx.fillStyle = '#5a6270'; ctx.fillRect(x - 30, y + 26, 60, 6);
        ctx.fillStyle = '#7fd0ff'; const runes = [[-20, 8], [-6, 12], [8, 8], [18, 14]]; for (const [rx, ry] of runes) { ctx.fillRect(x + rx, y + ry, 1, 7); ctx.fillRect(x + rx, y + ry, 4, 1); ctx.fillRect(x + rx + 3, y + ry + 3, 1, 4); }
      }
    }
  },
  souls: {
    dur: 180,
    update(g, a, v, t, s) {
      if (t === 1) { a.forcePose = mkPose(POSES.cast); }
      a.y = GROUND - Math.min(14, t * 0.3); a.forcePose = mkPose(POSES.cast, { fF: [5, 4], fB: [-4, 6] });
      if (t === 10 || t === 40) { Sound.play('thunder'); g.flashA = 0.4; }
      if (t > 10 && t < 75) { v.tint = (t >> 1) & 1 ? 'shadow' : 'flash'; v.tintK = 0.7; v.forcePose = mkPose(POSES.hit, { hF: [6, -20 + Math.sin(t) * 3], hB: [-6, -18], head: -30 + Math.sin(t * 0.7) * 10 }); }
      if (t === 55) { s.ghost = snapCanvas(v); s.gx = v.x; s.gy = v.y; }
      if (t === 75) { v.tint = null; v.skeleton = true; Sound.play('skull'); }
      if (t > 75 && t < 110) v.forcePose = blendPose(ANIM.dizzy(v.ch, t), mkPose(POSES.lie), ease((t - 75) / 30));
      if (t === 112) { FX.burst(v, { power: 0.5, vyMin: -1, vyMax: 0.4, g: 0.12, tint: '#8a7a9a', tintK: 0.4 }); v.hidden = true; Sound.play('crunch'); g.impact(); }
      if (t === 150) a.y = GROUND;
    },
    front(ctx, cx, g, a, v, t, s) {
      if (t > 10 && t < 75 && t % 2 === 0) { for (let i = 0; i < 2; i++) { bolt(ctx, a.x - cx + a.facing * 16, a.y - 64, v.x - cx + rand(-6, 6), v.y - rand(20, 50), '#c06bff', 9, 7, 2); bolt(ctx, a.x - cx + a.facing * 16, a.y - 64, v.x - cx, v.y - 40, '#f6e8ff', 9, 5, 1); } }
      if (s.ghost && t < 140) {
        const k = clamp((t - 55) / 85, 0, 1), x = lerp(s.gx, a.x + a.facing * 12, ease(k)) - cx, y = lerp(s.gy, a.y - 30, ease(k)) - Math.sin(k * Math.PI) * 30, sc = 1 - k * 0.8;
        ctx.globalAlpha = 0.45 * (1 - k * 0.5); ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(v.facing * sc, sc); ctx.filter = 'brightness(3) saturate(0)'; ctx.drawImage(s.ghost, -SPR_OX, -SPR_OY); ctx.restore(); ctx.filter = 'none'; ctx.globalAlpha = 1;
        if (t % 2 === 0) FX.p('fire', x + cx + rand(-6, 6), y - rand(10, 40), 0, -0.3, 20, choice(['#efe0ff', '#c06bff']), 1, 0);
      }
    }
  },
  bite: {
    dur: 160,
    update(g, a, v, t, s) {
      if (t === 1) a.forcePose = mkPose({ hF: [18, -10], hB: [8, 0], torso: 10, head: -10 });
      if (t < 30) { g.shake(1.5); if (t % 3 === 0) FX.p('px', v.x + rand(-26, 26), GROUND - 1, rand(-1, 1), -rand(1, 3), 30, choice(['#ffffff', '#4fc3ff', '#9fdfff']), 1, 0.2); v.forcePose = mkPose(POSES.hit, { head: 20, torso: 10 }); }
      s.rise = t < 26 ? 0 : t < 36 ? (t - 26) / 10 : t < 95 ? 1 : Math.max(0, 1 - (t - 95) / 25);
      s.open = t < 38 ? 1 : t < 44 ? 1 - (t - 38) / 6 : t < 90 ? Math.abs(Math.sin((t - 44) * 0.25)) * 0.12 : 0;
      if (t === 26) { Sound.play('wave'); for (let i = 0; i < 40; i++) FX.p('px', v.x + rand(-30, 30), GROUND - 2, rand(-2, 2), -rand(2, 6), 50, choice(['#ffffff', '#4fc3ff']), 1, 0.25); }
      if (t === 44) { v.hidden = true; FX.blood(v.x, GROUND - 60, -1, 30, 1.6); FX.blood(v.x, GROUND - 60, 1, 30, 1.6); Sound.play('bite'); g.shake(10); }
      if (t > 44 && t < 90 && t % 6 === 0) { Sound.play('crunch'); FX.gush(v.x + rand(-10, 10), GROUND - 60, 6, 3); }
      if (t === 60) a.forcePose = null;
    },
    back(ctx, cx, g, a, v, t, s) { this.jaw(ctx, cx, v, s, true); },
    front(ctx, cx, g, a, v, t, s) { this.jaw(ctx, cx, v, s, false); },
    jaw(ctx, cx, v, s, back) {
      if (!s.rise) return;
      const X = Math.round(v.x - cx), cy = Math.round(GROUND + 46 - s.rise * 62), op = Math.max(0.08, s.open);
      const rx = 42, ry = 54 * op + 6, irx = 35, iry = 47 * op;
      ctx.save(); ctx.beginPath(); ctx.rect(-50, -50, W + 100, GROUND + 52); ctx.clip();
      const ell = (rxx, ryy, col, y0, y1) => { ctx.fillStyle = col; for (let y = Math.max(-ryy, y0); y <= Math.min(ryy, y1); y++) { const w = Math.round(rxx * Math.sqrt(Math.max(0, 1 - (y * y) / (ryy * ryy)))); ctx.fillRect(X - w, cy + y, w * 2 + 1, 1); } };
      if (back) {
        ell(rx + 2, ry + 2, '#2a3a4a', -200, 200); ell(rx, ry, '#6d8fae', -200, 200); ell(rx - 3, ry - 3, '#86a6c4', -200, -ry * 0.4);
        ell(irx, iry, '#5a1020', -200, 200); ell(irx - 8, iry * 0.7, '#2a0810', -200, 200);
        ctx.fillStyle = '#ffffff';
        for (let a = 200; a <= 340; a += 12) { const r = a * DEG, tx = X + Math.cos(r) * irx, ty = cy + Math.sin(r) * iry; for (let k = 0; k < 5; k++) ctx.fillRect(Math.round(tx - (2 - k * 0.4)), Math.round(ty + k * 1.2 * Math.sign(-Math.sin(r))), Math.max(1, Math.round(4 - k * 0.8)), 1); }
        for (const ex of [-26, 26]) { ctx.fillStyle = '#0c0c14'; ctx.fillRect(X + ex - 2, cy - ry - 2, 5, 4); ctx.fillStyle = '#ffffff'; ctx.fillRect(X + ex - 1, cy - ry - 2, 1, 1); }
      } else {
        ctx.fillStyle = '#6d8fae';
        for (let y = 0; y <= ry; y++) { const wo = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))), wi = y < iry ? Math.round(irx * Math.sqrt(Math.max(0, 1 - (y * y) / (iry * iry)))) : 0; ctx.fillRect(X - wo, cy + y, wo - wi, 1); ctx.fillRect(X + wi, cy + y, wo - wi + 1, 1); }
        ctx.fillStyle = '#eef2f4';
        for (let a = 20; a <= 160; a += 12) { const r = a * DEG, tx = X + Math.cos(r) * irx, ty = cy + Math.sin(r) * iry; for (let k = 0; k < 5; k++) ctx.fillRect(Math.round(tx - (2 - k * 0.4)), Math.round(ty - k * 1.2), Math.max(1, Math.round(4 - k * 0.8)), 1); }
      }
      ctx.restore();
      if (!back) { ctx.fillStyle = '#e8f8ff'; for (let i = 0; i < 12; i++) ctx.fillRect(X - 60 + i * 11 + Math.round(Math.sin(i + cy) * 2), GROUND, 6, 1); }
    }
  },
  bombs: {
    dur: 185, zoom: 1.15,
    update(g, a, v, t, s) {
      if (!s.b) { s.b = []; s.ax = a.x; }
      if (t === 1) { a.forcePose = ANIM.victory(a.ch, 0); a.forcePose = mkPose(POSES.leapUp); Sound.play('plane'); }
      if (t < 30) { a.y -= t * 0.5; a.jet = true; FX.fire(a.x, a.y - 30, 2, 3, 0.5); }
      if (t === 30) a.hidden = true;
      if (t >= 34 && t <= 84 && t % 10 === 4) { s.b.push({ x: v.x + rand(-14, 14), y: -20, vy: 2 }); Sound.play('dive'); }
      for (const b of s.b) if (!b.done) { b.vy += 0.3; b.y += b.vy; if (b.y >= GROUND - 6) { b.done = true; FX.explosion(b.x, GROUND - 8, 1); Sound.play('explode'); g.shake(7); v.flash = 4; FX.blood(v.x, v.y - 30, b.x < v.x ? 1 : -1, 10); } }
      if (t < 95) v.forcePose = mkPose(POSES.hit, { torso: Math.sin(t * 0.6) * 20, head: Math.sin(t * 0.9) * 25 });
      if (t === 96) { FX.explosion(v.x, v.y - 30, 2); FX.burst(v, { radial: true, power: 4.5, g: 0.25, vyMin: -3, vyMax: 0, tint: '#2a1a1a', tintK: 0.25 }); FX.blood(v.x, v.y - 30, 1, 40, 2.5); FX.blood(v.x, v.y - 30, -1, 40, 2.5); v.hidden = true; Sound.play('explode'); Sound.play('gore'); g.shake(14); g.flashA = 0.8; }
      if (t === 120) { a.hidden = false; a.y = -40; a.x = s.ax; a.forcePose = mkPose(POSES.dive); }
      if (t > 120 && a.y < GROUND) { a.y = Math.min(GROUND, a.y + 6); if (a.y >= GROUND) { a.forcePose = null; a.jet = false; FX.dust(a.x, GROUND, 14); Sound.play('land'); } }
    },
    front(ctx, cx, g, a, v, t, s) {
      if (!s.b) return;
      for (const b of s.b) if (!b.done) { const x = Math.round(b.x - cx), y = Math.round(b.y); ctx.fillStyle = '#5a5a5a'; ctx.fillRect(x - 3, y - 10, 2, 5); ctx.fillRect(x + 1, y - 10, 2, 5); pdisk(ctx, x, y, 4, '#18181c'); pdisk(ctx, x - 1, y - 1, 2.5, '#3a3a44'); ctx.fillStyle = '#c8323c'; ctx.fillRect(x - 4, y - 2, 8, 1); }
    }
  },
  bat: {
    dur: 160, zoom: 1.2,
    update(g, a, v, t, s) {
      const dir = Math.sign(v.x - a.x) || 1; s.dir = dir;
      if (t === 1 || t === 11 || t === 21) { Sound.play('tun'); FX.text(a.x, a.y - 80 - (t / 10) * 6, 'ТУН!', 2, ['#fff6b0', '#ff9a1a'], 40); a.forcePose = ANIM.victory(a.ch, (t % 20) + 15); }
      if (t === 30) a.forcePose = mkPose(POSES.raise, { wa: -10 });
      const hits = [44, 70, 96];
      let ang = -1.6;
      for (let i = 0; i < 3; i++) { const h = hits[i]; if (t >= h - 14 && t < h) ang = lerp(-1.6, 0, easeIn((t - (h - 14)) / 14)); else if (t >= h && t < h + 12) ang = lerp(0, -1.6, (t - h) / 12); if (t === h) { const sc = [0.7, 0.42, 0.14][i]; v.scaleY = sc; FX.blood(v.x, GROUND - 40 * sc, -1, 14 + i * 10, 1.5); FX.blood(v.x, GROUND - 40 * sc, 1, 14 + i * 10, 1.5); g.shake(6 + i * 4); Sound.play('tun'); Sound.play('crunch'); FX.text(v.x, GROUND - 90, 'ТУН!', 3, ['#ffffff', '#ffd36a', '#ff6a1a'], 36); FX.dust(v.x, GROUND, 10); } }
      s.ang = t >= 30 && t < 110 ? ang : null;
      if (t < 44) v.forcePose = ANIM.dizzy(v.ch, t * 2);
      if (t === 110) a.forcePose = null;
    },
    front(ctx, cx, g, a, v, t, s) {
      if (s.ang == null) return;
      WEP_R.clear(); WEAPONS.bat(WEP_R); WEP_R.outline(c32('#140c18')); WEP_R.flush();
      const d = s.dir, px = v.x - cx + d * 64, py = GROUND - 160, hit = Math.atan2(GROUND - 18 - py, (v.x - cx) - px);
      const th = hit - d * (-s.ang) * 1.0, sc = 3.6;
      ctx.save(); ctx.translate(Math.round(px), py); ctx.rotate(th);
      ctx.drawImage(WEP_R.cv, 0, 10, 48, 20, -3 * sc, -10 * sc, 48 * sc, 20 * sc); ctx.restore();
    }
  },
  tornado: {
    dur: 180, zoom: 1.08,
    update(g, a, v, t, s) {
      a.visFlip = t < 110 ? ((t >> 2) & 1) === 1 : false;
      a.forcePose = t < 110 ? mkPose(POSES.spinA) : null;
      if (t % 10 === 0 && t < 110) Sound.play('spin');
      s.k = t < 25 ? t / 25 : t < 120 ? 1 : Math.max(0, 1 - (t - 120) / 20);
      if (t > 25 && t < 100) { v.offY = -Math.pow((t - 25) / 75, 1.6) * 230; v.visFlip = ((t >> 1) & 1) === 1; v.forcePose = mkPose(POSES.fall, { rot: t * 25 }); }
      if (t === 100) v.hidden = true;
      if (t > 110 && t < 160 && t % 2 === 0) { FX.p('blood', v.x + rand(-40, 40), -5, rand(-0.3, 0.3), rand(1, 3), 120, choice(BLOOD_COLS), Settings.blood ? randi(1, 2) : 1, 0.12); if (t % 8 === 0) FX.p('px', v.x + rand(-30, 30), -5, 0, 2, 120, '#ece6d2', 2, 0.15, { floor: true }); }
      if (t === 130) { Sound.play('gore'); g.impact(); }
    },
    back(ctx, cx, g, a, v, t, s) {
      if (!s.k) return;
      const X = v.x - cx;
      for (let y = 0; y < 220; y += 2) {
        const yy = GROUND - y, w = (6 + y * 0.28) * s.k, ph = t * 0.4 + y * 0.12;
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = y % 8 < 2 ? '#ffc2db' : '#d8d0e0';
        ctx.fillRect(Math.round(X + Math.sin(ph) * w), yy, Math.max(1, Math.round(w * 0.5)), 2);
        ctx.fillStyle = '#8a8098'; ctx.fillRect(Math.round(X - Math.sin(ph) * w), yy, 2, 1);
      }
      ctx.globalAlpha = 1;
    }
  }
};
