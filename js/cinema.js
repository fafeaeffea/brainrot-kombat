'use strict';
// Кинематографичные фаталити в духе Мортал Комбат: медленный подход, жёсткая серия
// со стоп-кадрами, монтажные «склейки» камеры, замедление и финальное добивание.
// Заменяет мультяшные FATALITIES из fatality.js.

const CINE_OP = 66;   // общая часть: подход и серия из трёх ударов
const CC = { z: 1.6 };
// склейка: мгновенно сменить план (зум и точку фокуса)
function cut(g, s, z, x, y) { s.z = z; g.zoom = z; s.foc = { x, y }; s.snap = true; }
function pan(s, z, x, y) { s.z = z; s.foc = { x, y }; }
// свежий снимок спрайта бойца в текущей позе
function snapNow(f) { f.computePose(); renderFighter(f.R, f.ch, f.pose, f); return snapCanvas(f); }
function chest(f) { return { x: f.x, y: f.y - 46 }; }
function hit(g, v, d, n = 18, pw = 1.6) { const c = chest(v); FX.blood(c.x, c.y, d, n, pw); FX.hitFlash(c.x, c.y, true); g.shake(10); }
// поза «сломлен»: стоит, шатаясь, почти на коленях
const BROKEN = t => ({ hx: -2, hy: 9 + Math.sin(t * 0.08), torso: 26, head: 24 + Math.sin(t * 0.13) * 6, hF: [4, 12], hB: [-1, 14], fF: [8, 0], fB: [-9, 0], eF: { x: -0.3, y: 1 }, eB: { x: -0.3, y: 1 } });
const SCREAM = (t, k = 1) => ({ hy: 1, torso: -16 * k, head: -28 * k + Math.sin(t * 1.3) * 6 * k, hF: [6 + Math.sin(t * 0.9) * 3, -22], hB: [-6, -20 + Math.sin(t * 1.1) * 3], fF: [8, 0], fB: [-8, 0] });

function opener(g, a, v, u, s) {
  const d = s.dir;
  if (u === 1) { s.ax0 = a.x; v.forcePose = f => ANIM.dizzy(f.ch, f.anim); cut(g, s, 1.55, (a.x + v.x) / 2, GROUND - 52); Sound.sting('heart'); }
  if (u <= 22) {  // медленный хищный подход
    const tx = v.x - d * 28; a.x = lerp(s.ax0, tx, ease(u / 22));
    a.forcePose = ANIM.walk ? ANIM.walk(a.ch, u * 0.6) : stanceOf(a.ch);
    if (u % 8 === 4) { Sound.play('land'); FX.dust(a.x, GROUND, 3); }
    pan(s, 1.75, (a.x + v.x) / 2, GROUND - 56);
  }
  if (u === 23) { a.forcePose = movePose(a.ch, 'cross', 0, 1); v.forcePose = mkPose(POSES.hitLow, { torso: 44, head: 30 }); hit(g, v, d); Sound.play('heavy'); Sound.play('crunch'); cut(g, s, 2.3, v.x, v.y - 48); }
  if (u > 23 && u < 36) v.x += d * 0.4;
  if (u === 36) { a.forcePose = movePose(a.ch, 'backfist', 0, 1); v.forcePose = mkPose(POSES.hit, { head: -40, torso: -26 }); hit(g, v, d, 14); Sound.play('heavy'); cut(g, s, 1.9, (a.x + v.x) / 2 + d * 10, v.y - 60); }
  if (u === 48) { a.forcePose = movePose(a.ch, 'uppercut', 0, 1); v.forcePose = mkPose(POSES.fall); hit(g, v, d, 24, 2); g.slow = 36; Sound.play('heavy'); Sound.play('crunch'); cut(g, s, 2.1, v.x, v.y - 60); s.vy = -4.2; }
  if (u > 48 && s.vy != null) {
    s.vy += 0.42; v.y += s.vy; v.x += d * 0.5;
    if (v.y >= GROUND) { v.y = GROUND; s.vy = null; FX.dust(v.x, GROUND, 10); Sound.play('land'); g.shake(4); }
  }
  if (u > 52) a.forcePose = blendPose(movePose(a.ch, 'uppercut', 0, 1), stanceOf(a.ch), ease(Math.min(1, (u - 52) / 10)));
  if (u >= 56 && s.vy == null) v.forcePose = BROKEN(u);
  if (u === CINE_OP) pan(s, 1.6, (a.x + v.x) / 2, GROUND - 56);
}

function mkCine(def) {
  return {
    dur: CINE_OP + def.dur,
    get zoom() { return CC.z || 1.6; },
    update(g, a, v, t, s) {
      if (t === 1) { s.dir = Math.sign(v.x - a.x) || 1; s.z = 1.55; v.facing = -s.dir; a.facing = s.dir; }
      if (t <= CINE_OP) opener(g, a, v, t, s);
      else {
        const u = t - CINE_OP;
        def.update.call(def, g, a, v, u, s);
        if (u >= def.dur - 30) {
          if (u === def.dur - 30) { a.scaleY = 1; a.visFlip = false; a.offY = 0; a.tint = null; a.hidden = false; a.alpha = 1; a.facing = s.dir; pan(s, 2, a.x, a.y - 50); }
          a.y = lerp(a.y, GROUND, 0.3); a.forcePose = ANIM.victory(a.ch, u - (def.dur - 30));
        }
      }
      CC.z = s.z;
    },
    back(ctx, cx, g, a, v, t, s) { if (t > CINE_OP && def.back) def.back.call(def, ctx, cx, g, a, v, t - CINE_OP, s); },
    front(ctx, cx, g, a, v, t, s) { if (t > CINE_OP && def.front) def.front.call(def, ctx, cx, g, a, v, t - CINE_OP, s); }
  };
}
// кисть атакующего в мире
const handOf = (a, side = 'F') => jw(a, a.forcePose && typeof a.forcePose === 'object' ? a.forcePose : stanceOf(a.ch), 'hd' + side);
const aimPose = (a, v, dy = -46) => { const p = reach(a, mkPose(POSES.cast, { torso: 4, head: -4 }), 'F', { x: v.x, y: v.y + dy }); p.wa = 0; return p; };
// клиппинг-полигон половинки спрайта (в координатах спрайта, x — вперёд)
function drawHalf(ctx, cx, img, x, y, fc, rot, poly) {
  ctx.save(); ctx.translate(Math.round(x - cx), Math.round(y)); ctx.scale(fc, 1); ctx.rotate(rot);
  ctx.beginPath(); poly.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.clip();
  ctx.drawImage(img, -SPR_OX, -SPR_OY, SPR_W, SPR_H); ctx.restore();
}
function embers(v, n = 2, col) { for (let i = 0; i < n; i++) FX.p('px', v.x + rand(-30, 30), GROUND - rand(0, 60), rand(-0.3, 0.3), -rand(0.3, 1), randi(30, 70), col || choice(['#ff8a1a', '#ffd04a', '#ff4a1a']), 1, -0.01, { floor: false, fade: true }); }

const CINE = {
  // огненный столб: жертва горит заживо и рассыпается пеплом
  burn: {
    dur: 160,
    update(g, a, v, u, s) {
      const d = s.dir;
      if (u === 1) { cut(g, s, 2.2, a.x, a.y - 56); a.forcePose = mkPose(POSES.raise, { hF: [4, -26] }); Sound.play('whooshH'); }
      if (u < 26) { const h = handOf(a); FX.fire(h.x, h.y, 3, 3, 1.4); if (u % 6 === 0) Sound.play('fire'); v.forcePose = BROKEN(u); }
      if (u === 26) { cut(g, s, 1.5, v.x, GROUND - 60); a.forcePose = mkPose(POSES.smash, { hF: [16, 12], hB: [12, 12] }); g.shake(10); Sound.play('explode'); FX.ring(v.x, GROUND - 4, '#ffb030', 40, 18); }
      if (u >= 26 && u < 96) {
        const k = (u - 26) / 70;
        for (let i = 0; i < 9; i++) FX.p('fire', v.x + rand(-14, 14), GROUND - rand(0, 20), rand(-0.6, 0.6), -rand(2, 5.5), randi(16, 34), null, randi(1, 3), -0.03);
        FX.fire(v.x + rand(-10, 10), v.y - rand(10, 80), 3, 6, 2);
        v.forcePose = SCREAM(u, 1); v.tint = 'char'; v.tintK = clamp(k * 1.5, 0, 1);
        if (u % 7 === 0) Sound.play('fire'); g.shake(2);
        if (u === 50) { cut(g, s, 2.5, v.x, v.y - 70); g.slow = 40; Sound.play('skull'); }
        if (u === 76) cut(g, s, 1.7, (a.x + v.x) / 2, GROUND - 56);
      }
      if (u === 96) {
        FX.burst(v, { power: 0.8, spread: 0.6, vyMin: -1.6, vyMax: 0, g: 0.06, tint: '#1e1618', tintK: 0.85, drag: 0.97 });
        v.hidden = true; FX.smoke(v.x, GROUND - 30, 30, '#2a2426'); Sound.play('crunch'); g.shake(10); cut(g, s, 1.9, v.x, GROUND - 30); g.slow = 30;
        bake(c => FIN.burn.pile(c, 0, v.x, 1));
      }
      if (u > 96) embers(v, 1);
    }
  },
  // ледяное дыхание, жертва замерзает и разлетается от удара ногой
  shatter: {
    dur: 150,
    update(g, a, v, u, s) {
      const d = s.dir;
      if (u === 1) { cut(g, s, 2.3, a.x + d * 8, a.y - 56); a.forcePose = aimPose(a, v); Sound.play('ice'); }
      if (u < 44) {
        const h = handOf(a);
        for (let i = 0; i < 5; i++) FX.p('px', h.x, h.y + rand(-2, 2), d * rand(2, 4.5), rand(-0.8, 0.8), 18, choice(['#ffffff', '#cfefff', '#7fdcff']), randi(1, 2), 0, { floor: false });
        v.forcePose = blendPose(BROKEN(u), mkPose(SCREAM(u, 0.6), { hy: 0 }), Math.min(1, u / 20)); v.tint = 'ice'; v.tintK = clamp(u / 40, 0, 1);
        if (u % 9 === 0) Sound.play('freeze');
        if (u === 14) cut(g, s, 1.7, (a.x + v.x) / 2, GROUND - 56);
      }
      if (u === 44) { s.fp = Object.assign({}, objPose(v.forcePose)); cut(g, s, 2.6, v.x, v.y - 64); Sound.play('freeze'); for (let i = 0; i < 40; i++) FX.p('px', v.x + rand(-14, 14), v.y - rand(0, 70), 0, 0, 30, '#ffffff', 1, 0, { floor: false, fade: true }); }
      if (u >= 44 && !s.gone) v.forcePose = s.fp;
      if (u === 70) { cut(g, s, 1.6, (a.x + v.x) / 2, GROUND - 56); a.forcePose = mkPose(stanceOf(a.ch), MOVE_POSES.roundhouse.wind); }
      if (u === 82) {
        a.forcePose = movePose(a.ch, 'roundhouse', 0, 1); g.slow = 45; s.gone = true;
        FX.burst(v, { radial: true, power: 4.5, vx: d * 2.4, tint: '#bfe8ff', tintK: 0.5, g: 0.22, vyMin: -3, vyMax: 0 });
        for (let i = 0; i < 60; i++) FX.p('px', v.x + rand(-14, 14), v.y - rand(10, 70), d * rand(1, 7) + rand(-1.5, 1.5), rand(-5, 1), randi(60, 120), choice(['#ffffff', '#cfefff', '#7fdcff', '#3a8ad8']), randi(1, 3), 0.25, { floor: true });
        FX.blood(v.x, v.y - 40, d, 30, 2); v.hidden = true; Sound.play('shatter'); Sound.play('kick'); g.shake(12); cut(g, s, 2, v.x, GROUND - 50);
      }
      if (u > 82 && u < 110) a.forcePose = movePose(a.ch, 'roundhouse', 0, 1);
      if (u === 110) a.forcePose = stanceOf(a.ch);
    }
  },
  // энергетический луч: рентген-вспышки, скелет и распад
  laser: {
    dur: 160,
    update(g, a, v, u, s) {
      const d = s.dir;
      if (u === 1) { a.x = v.x - d * 70; cut(g, s, 2.4, a.x + d * 14, a.y - 50); a.forcePose = aimPose(a, v); Sound.play('plasma'); }
      if (u < 30) { s.charge = u / 30; v.forcePose = BROKEN(u); if (u % 6 === 0) Sound.play('plasma'); }
      if (u === 30) { cut(g, s, 1.55, (a.x + v.x) / 2, GROUND - 56); s.beam = true; Sound.play('explode'); g.shake(10); }
      if (s.beam && u < 92) {
        v.forcePose = SCREAM(u, 1); const c = chest(v);
        FX.spark(c.x, c.y, 3, a.ch.pal.fx); if (u % 3 === 0) FX.blood(c.x, c.y, d, 3, 1.4);
        v.skeleton = (u >> 1) % 3 === 0 && u > 40; v.tint = 'char'; v.tintK = clamp((u - 30) / 60, 0, 0.8);
        if (u % 5 === 0) Sound.play('plasma'); g.shake(2);
        if (u === 56) { cut(g, s, 2.6, v.x, v.y - 56); g.slow = 36; }
      }
      if (u === 92) { s.beam = false; v.skeleton = true; v.tint = null; cut(g, s, 2.1, v.x, v.y - 50); FX.smoke(v.x, v.y - 40, 16, '#3a3438'); }
      if (u > 92 && u < 112) { v.forcePose = mkPose(STIFF, { rot: Math.sin(u * 0.6) * 2 }); if (u % 3 === 0) FX.smoke(v.x + rand(-8, 8), v.y - rand(20, 70), 1, '#4a4448'); }
      if (u === 112) { FX.burst(v, { power: 0.6, spread: 1.2, vyMin: -2, vyMax: 0.5, g: 0.3 }); v.hidden = true; Sound.play('crunch'); Sound.play('land'); g.shake(9); }
    },
    front(ctx, cx, g, a, v, u, s) {
      const h = handOf(a), fx = a.ch.pal.fx;
      if (u < 30) { const r = 1 + s.charge * 6 + Math.sin(u) * 0.8; ctx.globalAlpha = 0.5; pdisk(ctx, h.x - cx, h.y, r + 3, fx); ctx.globalAlpha = 1; pdisk(ctx, h.x - cx, h.y, r, '#ffffff'); }
      if (s.beam && u < 92) {
        const y = h.y, x0 = h.x - cx, len = 600 * d0(s), w = 5 + Math.sin(u * 1.7) * 2;
        ctx.fillStyle = fx; ctx.globalAlpha = 0.55; ctx.fillRect(Math.min(x0, x0 + len), Math.round(y - w), Math.abs(len), Math.round(w * 2)); ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.min(x0, x0 + len), Math.round(y - w * 0.4), Math.abs(len), Math.max(1, Math.round(w * 0.8)));
        pdisk(ctx, x0, y, w + 3, '#ffffff');
      }
    }
  },
  // молниеносный разрез: тишина, тонкая линия крови — и тело распадается надвое
  slice: {
    dur: 170,
    update(g, a, v, u, s) {
      const d = s.dir;
      if (u === 1) { cut(g, s, 2.4, a.x, a.y - 50); a.forcePose = mkPose(POSES.cut, { hF: [-6, 6], torso: 20, wa: -150 }); v.forcePose = BROKEN(u); Sound.play('whooshH'); }
      if (u < 30) v.forcePose = BROKEN(u);
      if (u === 30) {
        s.slash = 10; a.x = v.x + d * 46; a.forcePose = mkPose(POSES.cut, { wa: 20 }); g.flashA = 0.7; g.slow = 30;
        Sound.play('slash'); Sound.play('whooshH'); cut(g, s, 1.7, (a.x + v.x) / 2, GROUND - 56); g.ghostTrail(a, v.x - d * 20);
      }
      if (s.slash > 0) s.slash--;
      if (u > 30 && u < 70) v.forcePose = mkPose(BROKEN(30), { head: 10 });
      if (u === 50) { cut(g, s, 2.6, v.x, v.y - 50); s.line = 1; Sound.play('block'); }
      if (u === 70) {
        s.img = snapNow(v); s.vx = v.x; s.vy0 = v.y; s.fc = v.facing; v.hidden = true;
        s.up = { x: 0, y: 0, vx: d * 0.9, vy: -0.6, r: 0 }; s.lo = { r: 0 };
        Sound.play('crunch'); Sound.play('heavy'); g.shake(10); cut(g, s, 1.8, v.x, v.y - 44); g.slow = 40;
      }
      if (s.up) {
        const U = s.up; U.vy += 0.25; U.x += U.vx; U.y += U.vy; if (U.r < 1.2) U.r += 0.035;
        if (U.y > 34) { U.y = 34; U.vy = 0; U.vx *= 0.8; }
        if (u > 82) s.lo.r = Math.max(s.lo.r - 0.04, -1.45);
        if (u < 130) { FX.gush(s.vx + U.x * 0.5, s.vy0 - 34, 3, 4.5); if (u % 4 === 0) FX.blood(s.vx, s.vy0 - 34, d, 4, 1.6); }
      }
    },
    back(ctx, cx, g, a, v, u, s) {
      if (!s.up) return;
      const Y = -SPR_OY, B = SPR_H - SPR_OY, cutA = [[-80, Y], [80, Y], [80, -44], [-80, -28]], cutB = [[-80, -28], [80, -44], [80, B], [-80, B]];
      // нижняя часть оседает назад, верхняя соскальзывает по линии разреза
      drawHalf(ctx, cx, s.img, s.vx, s.vy0, s.fc, s.lo.r, cutB);
      drawHalf(ctx, cx, s.img, s.vx + s.up.x, s.vy0 + s.up.y, s.fc, s.up.r, cutA);
    },
    front(ctx, cx, g, a, v, u, s) {
      if (s.slash > 0) { ctx.fillStyle = '#ffffff'; const y = GROUND - 36; ctx.globalAlpha = s.slash / 10; ctx.fillRect(-10, y - 1, W + 20, 3); ctx.globalAlpha = 1; ctx.fillStyle = a.ch.pal.fx; ctx.fillRect(-10, y + 2, W + 20, 1); }
      if (s.line && !s.up) { const x = v.x - cx; ctx.fillStyle = '#a8101c'; for (let i = -12; i <= 12; i++) ctx.fillRect(Math.round(x + i), Math.round(v.y - 36 - i * 0.5), 1, 1); }
    }
  },
  // подъём над головой и сокрушительный бросок о землю
  hammer: {
    dur: 160,
    update(g, a, v, u, s) {
      const d = s.dir;
      if (u === 1) { a.x = v.x - d * 18; cut(g, s, 2, (a.x + v.x) / 2, GROUND - 70); Sound.play('grab'); }
      if (u <= 40) {
        const k = ease(Math.min(1, u / 24)), ap = mkPose(stanceOf(a.ch), { hF: [6, -14 - 12 * k], hB: [4, -14 - 12 * k], torso: -6 * k, head: -12 * k, wa: -90 });
        a.forcePose = ap; const h = jw(a, ap, 'hdF');
        pin(v, mkPose(STIFF, { rot: -90 * k * d * v.facing, head: 10, hF: [4, 14 + Math.sin(u * 0.7) * 3], fF: [6 + Math.sin(u) * 4, 0] }), 'hip', { x: h.x, y: h.y - 4 * k });
        if (u === 24) { cut(g, s, 2.5, a.x, a.y - 80); Sound.play('whooshH'); }
      }
      if (u > 40 && u <= 48) {
        const k = (u - 40) / 8; a.forcePose = mkPose(POSES.smash, { wa: -60 });
        pin(v, mkPose(STIFF, { rot: -90 * d * v.facing }), 'hip', { x: lerp(v.x, a.x + d * 26, 0.4), y: lerp(GROUND - 100, GROUND - 6, k * k) });
      }
      if (u === 48) {
        g.slow = 45; g.shake(13); cut(g, s, 1.9, v.x, GROUND - 26); Sound.play('crunch'); Sound.play('heavy'); Sound.play('explode');
        FX.ring(v.x, GROUND - 2, '#e8d8c0', 50, 20); FX.dust(v.x, GROUND, 40); FX.gush(v.x, GROUND - 10, 40, 6);
        for (let i = 0; i < 24; i++) FX.p('px', v.x + rand(-20, 20), GROUND - 2, rand(-3, 3), -rand(2, 6), randi(40, 80), choice(['#5a4a3a', '#7a6a58', '#3a2e24']), randi(1, 3), 0.3, { floor: true });
        v.forcePose = mkPose(POSES.lie); v.x = a.x + d * 26; v.y = GROUND - 6; v.scaleY = 0.8;
      }
      if (u > 48 && u < 90) a.forcePose = mkPose(POSES.smash, { wa: -60 });
      if (u === 90) { a.forcePose = mkPose(POSES.raise, { fF: [6, -18] }); cut(g, s, 1.7, (a.x + v.x) / 2, GROUND - 50); }
      if (u === 104) {
        a.forcePose = mkPose(POSES.smash, { fF: [16, 0] }); a.x = v.x - d * 4;
        FX.burst(v, { radial: true, power: 3.5, g: 0.3, vyMin: -4, vyMax: -1, tint: '#7a0010', tintK: 0.35 });
        FX.gush(v.x, GROUND - 6, 60, 7); v.hidden = true; g.shake(12); g.slow = 30; Sound.play('crunch'); Sound.play('land'); cut(g, s, 2.1, v.x, GROUND - 30);
      }
    }
  },
  // тёмная сила поднимает жертву и вырывает душу
  souls: {
    dur: 160,
    update(g, a, v, u, s) {
      const d = s.dir;
      if (u === 1) { cut(g, s, 2.2, a.x, a.y - 56); a.forcePose = aimPose(a, v, -70); Sound.play('skull'); s.vy0 = v.y; }
      if (u < 100 && !s.dead) {
        const k = ease(Math.min(1, u / 30)); v.y = s.vy0 - 34 * k + Math.sin(u * 0.2) * 2; v.forcePose = mkPose(SCREAM(u, k), { fF: [4, 4], fB: [-4, 6] });
        for (let i = 0; i < 2; i++) FX.p('px', v.x + rand(-16, 16), v.y + rand(-80, 0), rand(-0.3, 0.3), -rand(0.3, 1), 30, choice([a.ch.pal.fx, '#2a0a3a', '#ffffff']), 1, 0, { floor: false, fade: true });
        if (u === 30) { cut(g, s, 1.6, (a.x + v.x) / 2, GROUND - 70); s.img = snapNow(v); s.soul = 0; Sound.play('skull'); }
        if (s.soul != null) { s.soul = Math.min(1, s.soul + 0.014); v.tint = 'char'; v.tintK = s.soul * 0.85; if (u % 10 === 0) Sound.play('skull'); g.shake(1.5); }
        if (u === 60) { cut(g, s, 2.5, lerp(v.x, a.x, 0.5), v.y - 60); g.slow = 36; }
      }
      if (u === 100) {
        s.dead = true; s.soul = null; cut(g, s, 1.8, (a.x + v.x) / 2, GROUND - 56); FX.ring(handOf(a).x, handOf(a).y, a.ch.pal.fx, 30, 16); a.flash = 4; Sound.play('freeze'); g.shake(10);
        v.forcePose = mkPose(POSES.fall);
      }
      if (s.dead && !v.hidden) { s.fvy = (s.fvy || 0) + 0.45; v.y += s.fvy; if (v.y >= GROUND) { v.y = GROUND; FX.burst(v, { power: 0.5, spread: 1, vyMin: -1.5, vyMax: 0, g: 0.1, tint: '#3a3438', tintK: 0.7 }); FX.smoke(v.x, GROUND - 20, 20, '#2a2430'); v.hidden = true; Sound.play('crunch'); g.shake(9); } }
    },
    front(ctx, cx, g, a, v, u, s) {
      if (s.soul == null || !s.img) return;
      const h = handOf(a), k = ease(s.soul), x = lerp(v.x, h.x, k), y = lerp(v.y, h.y + 40, k);
      ctx.globalAlpha = 0.55 * (1 - k * 0.5);
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(Math.round(x - cx - s.dir * i * 6 * k), Math.round(y)); ctx.scale(v.facing * (1 - k * 0.5), 1 - k * 0.4); ctx.drawImage(s.img, -SPR_OX, -SPR_OY, SPR_W, SPR_H); ctx.restore(); ctx.globalAlpha *= 0.5; }
      ctx.globalAlpha = 1;
      FX.p('px', x + rand(-8, 8), y - rand(10, 60), 0, -0.4, 16, a.ch.pal.fx, 1, 0, { floor: false, fade: true });
    }
  },
  // гигантская пасть вырывается из-под земли
  bite: {
    dur: 150,
    update(g, a, v, u, s) {
      const d = s.dir;
      if (u === 1) { cut(g, s, 1.6, v.x, GROUND - 50); a.forcePose = mkPose(POSES.raise); Sound.play('wave'); }
      if (u < 36) { g.shake(3); if (u % 4 === 0) FX.dust(v.x + rand(-30, 30), GROUND, 4); v.forcePose = mkPose(BROKEN(u), { head: -10 }); if (u % 12 === 0) Sound.play('land'); }
      if (u === 36) { s.jaw = 0; cut(g, s, 1.8, v.x, GROUND - 60); Sound.play('explode'); g.shake(12); for (let i = 0; i < 30; i++) FX.p('px', v.x + rand(-26, 26), GROUND, rand(-2, 2), -rand(3, 7), 60, choice(['#5a4a3a', '#7a6a58']), randi(1, 3), 0.3, { floor: true }); }
      if (s.jaw != null) s.jaw++;
      if (s.jaw === 14) { v.hidden = true; FX.gush(v.x, GROUND - 50, 80, 8); g.slow = 45; Sound.play('crunch'); Sound.play('heavy'); g.shake(12); cut(g, s, 2.4, v.x, GROUND - 60); }
      if (s.jaw > 14 && s.jaw < 60 && s.jaw % 3 === 0) FX.gush(v.x + rand(-6, 6), GROUND - 40 + s.jaw * 0.6, 4, 3);
    },
    front(ctx, cx, g, a, v, u, s) {
      if (s.jaw == null || s.jaw > 80) return;
      const j = s.jaw, rise = j < 10 ? ease(j / 10) : j < 50 ? 1 : 1 - ease((j - 50) / 30), open = j < 10 ? 1 : j < 14 ? 1 - (j - 10) / 4 : 0;
      const o = renderJaw(open), sc = 1.8;
      ctx.save(); ctx.translate(Math.round(v.x - cx), Math.round(GROUND + 30 - 150 * rise)); ctx.rotate(-Math.PI / 2); ctx.scale(sc, sc); ctx.filter = 'brightness(0.55) contrast(1.4) saturate(0.6)';
      ctx.drawImage(JAW_R.cv, -o.hx, -o.hy, 80, 80); ctx.filter = 'none'; ctx.restore();
      ctx.fillStyle = '#2a1a14'; ctx.fillRect(Math.round(v.x - cx - 36), GROUND, 72, 3);
    }
  },
  // авиаудар: ракеты с неба и огненный шквал
  bombs: {
    dur: 160,
    update(g, a, v, u, s) {
      const d = s.dir;
      if (u === 1) { a.x = v.x - d * 80; cut(g, s, 2.2, a.x, a.y - 56); a.forcePose = mkPose(POSES.raise); Sound.play('whooshH'); s.m = []; }
      if (u === 20) cut(g, s, 1.4, v.x, GROUND - 70);
      if (u < 100) v.forcePose = mkPose(BROKEN(u), { head: -30 });
      for (const t0 of [24, 40, 56, 72]) if (u === t0) s.m.push({ x: v.x + (t0 === 72 ? 0 : rand(-40, 40)), y: -20, big: t0 === 72 });
      for (const m of s.m) {
        if (m.done) continue; m.y += 9;
        FX.smoke(m.x, m.y - 6, 1, '#6a6068');
        if (m.y >= GROUND - 4) {
          m.done = true; FX.explosion(m.x, GROUND - 8, m.big ? 2.6 : 1.2); g.shake(m.big ? 13 : 8); Sound.play('explode');
          if (!m.big) { FX.blood(v.x, v.y - 40, Math.sign(v.x - m.x) || 1, 8, 1.4); v.flash = 3; }
          else { FX.burst(v, { radial: true, power: 5, g: 0.25, vyMin: -5, vyMax: -1, tint: '#2a1a14', tintK: 0.5 }); FX.gush(v.x, GROUND - 30, 60, 8); v.hidden = true; g.slow = 50; cut(g, s, 1.9, v.x, GROUND - 50); }
        }
      }
      if (v.hidden) embers(v, 2);
    },
    front(ctx, cx, g, a, v, u, s) {
      for (const m of s.m || []) if (!m.done) { const x = Math.round(m.x - cx), y = Math.round(m.y); ctx.fillStyle = '#ffd04a'; ctx.fillRect(x - 1, y - 18, 3, 10); ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - 2, y - 8, 5, 10); ctx.fillStyle = '#d02a2a'; ctx.fillRect(x - 2, y + 1, 5, 2); }
    }
  },
  // три удара битой и финальный хоум-ран
  bat: {
    dur: 170,
    update(g, a, v, u, s) {
      const d = s.dir;
      const slam = (t, z) => {
        if (u === t - 12) { a.forcePose = mkPose(POSES.raise, { hF: [-2, -26], wa: -40 }); Sound.play('whooshH'); }
        if (u === t) { a.forcePose = mkPose(POSES.smash); hit(g, v, d, 20, 1.2); FX.gush(v.x, v.y - 60, 14, 3); Sound.play('heavy'); Sound.play('crunch'); cut(g, s, z, v.x, v.y - 50); g.slow = 18; }
      };
      if (u === 1) { a.x = v.x - d * 30; cut(g, s, 1.8, (a.x + v.x) / 2, GROUND - 56); }
      slam(20, 2.3); slam(46, 1.9);
      if (u >= 20 && u < 46) v.forcePose = mkPose(BROKEN(u), { hy: 16, torso: 40 });
      if (u >= 46 && u < 92) v.forcePose = mkPose(POSES.crouch, { torso: 50, head: 40, hF: [6, 8], hB: [2, 8] });
      if (u === 72) { a.forcePose = mkPose(stanceOf(a.ch), { torso: -20, hF: [-12, -6], hB: [-10, -4], wa: -170 }); cut(g, s, 2.4, a.x, a.y - 50); Sound.play('whooshH'); }
      if (u === 92) {
        a.forcePose = mkPose(POSES.cut, { wa: 10 }); hit(g, v, d, 30, 2.2); g.slow = 50; Sound.play('heavy'); Sound.play('crunch'); Sound.play('tun');
        s.fly = { vx: d * 7, vy: -7, r: 0 }; cut(g, s, 1.4, v.x + d * 60, GROUND - 80);
      }
      if (s.fly) {
        const F = s.fly; F.vy += 0.3; v.x += F.vx; v.y += F.vy; F.r += 24 * d;
        v.forcePose = mkPose(POSES.fall, { rot: F.r }); if (u % 2 === 0) FX.blood(v.x, v.y - 30, -d, 2, 0.6);
        pan(s, 1.4, lerp(a.x, v.x, 0.6), GROUND - 80);
        if (v.y >= GROUND && F.vy > 0) { FX.burst(v, { radial: true, power: 2.5, g: 0.3, vyMin: -3, vyMax: 0 }); FX.gush(v.x, GROUND - 6, 30, 5); FX.dust(v.x, GROUND, 20); v.hidden = true; s.fly = null; g.shake(10); Sound.play('crunch'); Sound.play('land'); }
        if (Math.abs(v.x - a.x) > 360) { v.hidden = true; s.fly = null; g.shake(6); Sound.play('explode'); }
      }
    }
  },
  // вихрь поднимает жертву и стирает её в песок
  tornado: {
    dur: 160,
    update(g, a, v, u, s) {
      const d = s.dir;
      if (u === 1) { cut(g, s, 2.2, a.x, a.y - 56); a.forcePose = aimPose(a, v, -60); Sound.play('wave'); s.vy0 = v.y; s.col = a.ch.pal.fx; }
      if (u < 110) {
        const k = ease(Math.min(1, u / 50));
        s.tw = k; v.y = s.vy0 - 60 * k; v.visFlip = ((u >> 2) & 1) === 1 && u > 20;
        v.forcePose = mkPose(SCREAM(u, 1), { rot: Math.sin(u * 0.3) * 20 * k });
        for (let i = 0; i < 6; i++) { const an = rand(0, 6.283), r = rand(10, 34); FX.p('px', v.x + Math.cos(an) * r, GROUND - rand(0, 110), -Math.sin(an) * 2.5, -rand(0.5, 2), 20, choice(['#d8b070', '#a88a50', s.col, '#ffffff']), 1, 0, { floor: false }); }
        if (u > 40 && u % 3 === 0) FX.blood(v.x, v.y - 40, choice([-1, 1]), 2, 1);
        if (u % 10 === 0) Sound.play('wave'); g.shake(2);
        if (u === 20) cut(g, s, 1.45, v.x, GROUND - 76);
        if (u === 70) { cut(g, s, 2.5, v.x, v.y - 50); g.slow = 40; }
      }
      if (u === 110) {
        FX.burst(v, { radial: true, power: 4, g: 0.15, vyMin: -2, vyMax: 1, tint: '#d8b070', tintK: 0.6, drag: 0.97 }); FX.gush(v.x, v.y - 40, 40, 4);
        v.hidden = true; s.tw = null; g.shake(12); Sound.play('crunch'); Sound.play('explode'); cut(g, s, 1.7, v.x, GROUND - 60);
      }
    },
    back(ctx, cx, g, a, v, u, s) {
      if (!s.tw) return;
      const X = v.x - cx;
      ctx.globalAlpha = 0.5 * s.tw;
      for (let y = 0; y < 130; y += 3) { const w = 10 + y * 0.32, an = u * 0.5 + y * 0.12; ctx.fillStyle = y % 2 ? '#c8a060' : '#8a6a40'; ctx.fillRect(Math.round(X + Math.cos(an) * w) - 2, GROUND - y, 4, 2); ctx.fillRect(Math.round(X - Math.cos(an) * w) - 2, GROUND - y, 3, 1); }
      ctx.globalAlpha = 1;
    }
  },
};
function d0(s) { return s.dir; }

for (const k in CINE) FATALITIES[k] = mkCine(CINE[k]);
