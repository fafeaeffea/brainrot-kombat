'use strict';
// Супер-удары: шкала копится от ударов, при полной шкале — БЛОК + РУКА + НОГА одновременно.
// Сначала заставка-вспышка (в это время соперник может успеть закрыться блоком), затем
// своя анимация бойца. Попадание снимает 30% здоровья. У каждого вида — своя дальность.
const SUPER_DMG = 30, SUPER_START = 36;
// kind: rush — серия в рывке, grab — захват и бросок, beam — луч, pillar — столб из-под земли,
// meteor — падение с неба, spin — вихрь. min/max — дальность от бойца до соперника.
const SUPER_KIND = {
  rush: { min: 0, max: 120, dur: 56, range: 'БЛИЖНИЙ' },
  grab: { min: 0, max: 60, dur: 48, range: 'ВПЛОТНУЮ' },
  spin: { min: 0, max: 100, dur: 54, range: 'БЛИЖНИЙ' },
  pillar: { min: 70, max: 170, dur: 54, range: 'СРЕДНИЙ' },
  beam: { min: 110, max: 520, dur: 64, range: 'ДАЛЬНИЙ' },
  meteor: { min: 150, max: 300, dur: 50, range: 'ДАЛЬНИЙ' },
};
const SUPERS = {
  kairo: ['Драконий шквал', 'rush'], yuki: ['Ледяной гейзер', 'pillar'], volt: ['Орбитальная пушка', 'beam'],
  ronin: ['Тысяча клинков', 'rush'], bjorn: ['Медвежий бросок', 'grab'], morena: ['Могильный столб', 'pillar'],
  kiyomi: ['Вихрь лепестков', 'spin'], nefera: ['Гнев пустыни', 'pillar'], nova: ['Неоновый луч', 'beam'],
  taiga: ['Падение духа-медведя', 'meteor'], lobo: ['Супер-суплекс', 'grab'], lira: ['Луч рассвета', 'beam'],
  sumo: ['Удар горы', 'grab'], vespa: ['Жалящий вихрь', 'spin'], holm: ['Северное сияние', 'beam'], barracuda: ['Бортовой залп', 'beam'],
  tralalero: ['Акулья мясорубка', 'rush'], bombardiro: ['Ковровая бомба', 'meteor'], tung: ['ТУН-ТУН-ТУН', 'rush'],
  ballerina: ['Смертельный пируэт', 'spin'], chimp: ['Банановый метеор', 'meteor'], patapim: ['Корни древа', 'pillar'],
};
function superOf(ch) { const s = SUPERS[ch.id] || ['Супер-удар', 'rush']; return Object.assign({ name: s[0], kind: s[1] }, SUPER_KIND[s[1]]); }

Object.assign(Game, {
  startSuper(a) {
    if (this.phase !== 'fight' || this.supS || a.sup < 100 || a.air) return false;
    const v = a.opp; a.sup = 0; a.face();
    this.supS = { a, v, t: 0, def: superOf(a.ch), s: {}, dimWas: this.dimT };
    a.setSt('script'); this.projs = this.projs.filter(p => p.owner === v);
    return true;
  },
  superStep() {
    const S = this.supS, a = S.a, v = S.v, D = S.def, s = S.s; S.t++;
    const t = S.t, d = S.dir || (S.dir = Math.sign(v.x - a.x) || 1), col = a.ch.pal.fx || '#ffd040';
    if (t === 1) {
      S.d0 = Math.abs(v.x - a.x); a.facing = d; S.ax = a.x; S.vx0 = v.x;
      S.blk = (v.st === 'block' || v.st === 'cblock') && !v.air;
      this.dimT = 0.7; this.flashA = 0.6; this.redA = 0.2; Sound.sting('big'); Sound.play('whooshH'); Sound.play('cast');
      S.z = 2.3; S.foc = { x: a.x, y: a.y - 52 }; S.snap = true;
      FX.ring(a.x, a.y - 44, col, 40, 20); FX.ring(a.x, a.y - 44, '#ffffff', 24, 14);
    }
    if (t <= SUPER_START) {
      a.forcePose = mkPose(POSES.raise, { hF: [4, -26] });
      for (let i = 0; i < 3; i++) FX.p('px', a.x + rand(-16, 16), a.y - rand(0, 80), rand(-0.3, 0.3), -rand(0.8, 2), randi(14, 26), choice([col, '#ffffff', '#ffd040']), 1, -0.01, { floor: false, fade: true });
      // соперник успевает закрыться блоком во время вспышки
      if (!S.blk && !v.air && v.canAct()) {
        const ai = this.ai[v.idx];
        if (ai) { if (t === Math.max(4, ai.react + 6) && Math.random() < ai.blockP * 0.85) S.blk = true; }
        else { const c = this.inp[v.idx].poll(this.frame, v.facing); if (c.b) S.blk = true; }
      }
      v.forcePose = S.blk ? mkPose(v.ch.weapon ? POSES.block : POSES.block) : null; v.computePose();
      if (t === SUPER_START) {
        S.res = S.d0 < D.min || S.d0 > D.max ? 'miss' : S.blk ? 'block' : 'hit';
        S.z = 1.6; S.foc = { x: (a.x + v.x) / 2, y: GROUND - 56 }; this.dimT = 0.45;
      }
      return;
    }
    const u = t - SUPER_START;
    SUPER_ANIM[D.kind](this, S, u, d, col);
    if (u >= D.dur) this.endSuper();
  },
  // удар супер-приёма: финальный (fin) — урон и падение, иначе лёгкий эффект
  superHit(S, fin) {
    const a = S.a, v = S.v, d = S.dir, hx = v.x - d * 4, hy = v.y - 46;
    if (S.res === 'miss') return;
    if (S.res === 'block') {
      Sound.play('block'); FX.spark(hx, hy, 8, '#cfe6ff'); FX.hitFlash(hx, hy, fin); this.shake(fin ? 6 : 2);
      if (fin && !S.done) { S.done = true; const chip = 3; v.hp = Math.max(1, v.hp - chip); v.roundDmg += chip; v.taken += chip; this.dmgPop(v, chip, true); this.announce([{ txt: 'ЗАБЛОКИРОВАНО!', s: 2, col: ['#c0f0ff', '#3a8ad8'] }], 50); }
      return;
    }
    Sound.play(fin ? 'heavy' : choice(['punch', 'hit', 'kick'])); FX.blood(hx, hy, d, fin ? 22 : 6, fin ? 1.8 : 1); FX.spark(hx, hy, 6, S.a.ch.pal.fx); FX.hitFlash(hx, hy, fin); v.flash = 3;
    this.shake(fin ? 8 : 3);
    if (fin && !S.done) {
      S.done = true; v.hp = Math.max(0, v.hp - SUPER_DMG); v.roundDmg += SUPER_DMG; v.taken += SUPER_DMG; this.dmgPop(v, SUPER_DMG, false);
      a.combo = 0; this.hitstop = 10; this.redA = 0.35;
      this.announce([{ txt: 'СУПЕР-УДАР!', s: 3, col: ['#ffffff', '#ffd040', '#e02010'] }, { txt: '-30%', s: 2, col: ['#ffd0c0', '#ff3a2a'] }], 60);
    }
  },
  endSuper() {
    const S = this.supS, a = S.a, v = S.v, d = S.dir;
    a.forcePose = null; a.visFlip = false; a.hidden = false; a.alpha = 1; a.y = GROUND; a.offY = 0; a.setSt('idle'); a.face();
    v.forcePose = null; v.visFlip = false;
    if (S.res === 'hit') { v.setSt('fall'); v.vy = -4.6; v.vx = d * 3.2; v.y = Math.min(v.y, GROUND - 1); }
    else if (S.res === 'block') { v.setSt('bstun'); v.stun = 22; v.vx = d * 3; v.y = GROUND; }
    else { v.y = GROUND; v.toNeutral(); this.announce([{ txt: 'ПРОМАХ!', s: 2, col: ['#ffffff', '#a0a0b0'] }], 40); }
    this.dimT = S.dimWas || 0; this.supS = null;
    if (S.res === 'hit') this.afterHit(a, v, {});
  },
  drawSuperBanner(ctx) {
    const S = this.supS; if (!S || S.t > SUPER_START + 6) return;
    const t = S.t, a = S.a, sl = t < 8 ? easeOut(t / 8) : t > SUPER_START - 4 ? 1 - easeIn((t - SUPER_START + 4) / 10) : 1, left = a.idx === 0, off = Math.round((1 - sl) * (left ? -W : W));
    const y = 196; ctx.save(); ctx.translate(off, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.82)'; ctx.beginPath(); ctx.moveTo(0, y - 20); ctx.lineTo(W, y - 28); ctx.lineTo(W, y + 22); ctx.lineTo(0, y + 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = a.ch.pal.fx || '#ffd040'; ctx.fillRect(0, y + 28, W, 1); ctx.fillRect(0, y - 22, W, 1);
    const pc = renderPortrait(a.ch, 96); ctx.drawImage(pc, left ? 16 : W - 16 - 46, y - 23, 46, 46);
    drawText(ctx, 'СУПЕР-УДАР: ' + a.ch.name.toUpperCase(), W / 2, y - 8, 1, '#ffd0c0');
    drawText(ctx, S.def.name.toUpperCase(), W / 2 + (t < 12 ? rand(-2, 2) : 0), y + 10, 3, ['#ffffff', '#ffd040', '#e06010']);
    ctx.restore();
  },
  // шкала супера внизу экрана; при полной — подсказка, как его применить
  drawSuperBars(ctx) {
    const phone = typeof usePhone === 'function' && usePhone(), y = phone ? 76 : H - 14, w = 120;
    for (let i = 0; i < 2; i++) {
      const f = this.f[i], x = i === 0 ? 12 : W - 12 - w, k = clamp(f.sup / 100, 0, 1), full = k >= 1, bl = (this.frame >> 3) & 1;
      ctx.fillStyle = '#140a14'; ctx.fillRect(x - 1, y - 1, w + 2, 8); ctx.fillStyle = '#2a1a24'; ctx.fillRect(x, y, w, 6);
      const fw = Math.round(w * k);
      ctx.fillStyle = full ? (bl ? '#ffffff' : '#ffd040') : '#3a8ad8'; ctx.fillRect(i === 0 ? x : x + w - fw, y, fw, 6);
      ctx.fillStyle = full ? '#fff6c0' : '#7ab8f8'; ctx.fillRect(i === 0 ? x : x + w - fw, y, fw, 1);
      for (let q = 1; q < 4; q++) { ctx.fillStyle = '#140a14'; ctx.fillRect(x + Math.round(w * q / 4), y, 1, 6); }
      drawText(ctx, 'СУПЕР', i === 0 ? x + w + 4 : x - 4, y + 3, 1, full ? ['#ffffff', '#ffd040'] : '#8ab0d0', i === 0 ? 'left' : 'right');
      if (full && !this.supS) {
        const ai = this.ai[i], K = KEYS[i];
        const tip = ai ? 'СУПЕР ГОТОВ!' : phone && i === 0 ? 'СУПЕР ГОТОВ: КНОПКА «СУПЕР»' : 'СУПЕР ГОТОВ: ' + keyName(K.b) + ' + ' + keyName(K.p) + ' + ' + keyName(K.k) + ' ВМЕСТЕ';
        ctx.globalAlpha = bl ? 1 : 0.75; drawText(ctx, tip, i === 0 ? x : x + w, y - 8, 1, ['#ffffff', '#ffd040'], i === 0 ? 'left' : 'right'); ctx.globalAlpha = 1;
      }
    }
  },
});

// ---------- анимации ----------
const SUPER_ANIM = {
  rush(g, S, u, d, col) {
    const a = S.a, v = S.v, reach = S.res === 'miss' ? Math.min(S.d0 + 60, S.def.max + 30) : S.d0 - 24, tx = S.ax + d * reach;
    if (u <= 8) { a.x = lerp(S.ax, tx, ease(u / 8)); a.forcePose = mkPose(POSES.rush); g.ghostTrail(a); if (u === 1) Sound.play('dash'); }
    else if (u < 46) {
      const k = Math.floor((u - 9) / 6), names = ['jab', 'cross', 'kick', 'backfist', 'roundhouse', 'pushkick', 'jab'];
      a.forcePose = movePose(a.ch, names[k % names.length], 0, 1);
      if ((u - 9) % 6 === 0) { g.superHit(S, false); if (S.res === 'hit') v.x += d * 1.5; }
      if (u % 3 === 0) FX.p('px', a.x + d * 20, a.y - rand(30, 70), d * rand(1, 3), rand(-1, 1), 10, col, 1, 0, { floor: false });
      if (S.res === 'hit') v.forcePose = (u >> 2) & 1 ? mkPose(POSES.hit) : mkPose(POSES.hitLow);
      if (u === 20) { S.z = 2.2; S.foc = { x: (a.x + v.x) / 2, y: GROUND - 56 }; S.snap = true; }
    } else {
      a.forcePose = movePose(a.ch, 'uppercut', 0, 1);
      if (u === 46) { g.superHit(S, true); g.slow = 24; S.z = 1.8; S.foc = { x: v.x, y: GROUND - 70 }; FX.ring(v.x, v.y - 50, col, 30, 16); }
      if (S.res === 'hit') { v.y = GROUND - Math.sin(Math.min(1, (u - 46) / 10) * Math.PI / 2) * 30; v.forcePose = mkPose(POSES.fall); }
    }
  },
  grab(g, S, u, d, col) {
    const a = S.a, v = S.v, hit = S.res !== 'miss';
    if (u <= 8) { a.x = lerp(S.ax, hit ? v.x - d * 18 : S.ax + d * 40, ease(u / 8)); a.forcePose = mkPose(POSES.rush); if (u === 6) Sound.play('grab'); return; }
    if (S.res === 'block') { // блок: захват сорван, соперник отталкивает
      a.forcePose = mkPose(POSES.hit); if (u === 9) g.superHit(S, true); a.x -= d * 1.5; return;
    }
    if (!hit) { a.forcePose = mkPose(POSES.thrust); return; }
    if (u <= 30) {
      const k = ease((u - 8) / 22), ap = mkPose(stanceOf(a.ch), { hF: [6, -14 - 12 * k], hB: [4, -14 - 12 * k], torso: -6 * k, head: -12 * k, wa: -90 });
      a.forcePose = ap; const h = jw(a, ap, 'hdF');
      pin(v, mkPose(STIFF, { rot: -90 * k * d * v.facing, head: 10 }), 'hip', { x: h.x, y: h.y - 4 * k });
      if (u === 18) { S.z = 2.3; S.foc = { x: a.x, y: a.y - 80 }; S.snap = true; Sound.play('whooshH'); }
    } else if (u <= 36) {
      const k = (u - 30) / 6; a.forcePose = mkPose(POSES.smash, { wa: -60 });
      pin(v, mkPose(STIFF, { rot: -90 * d * v.facing }), 'hip', { x: a.x + d * 26, y: lerp(GROUND - 100, GROUND - 8, k * k) });
    } else {
      a.forcePose = mkPose(POSES.smash, { wa: -60 });
      if (u === 37) { g.superHit(S, true); g.slow = 24; FX.ring(v.x, GROUND - 2, '#e8d8c0', 46, 18); FX.dust(v.x, GROUND, 30); S.z = 1.9; S.foc = { x: v.x, y: GROUND - 30 }; S.snap = true; Sound.play('crunch'); }
      v.forcePose = mkPose(POSES.lie); v.y = GROUND - 6;
    }
  },
  spin(g, S, u, d, col) {
    const a = S.a, v = S.v, reach = S.res === 'miss' ? S.def.max + 20 : S.d0 - 22;
    a.x = lerp(S.ax, S.ax + d * reach, ease(Math.min(1, u / 30)));
    a.visFlip = ((u >> 1) & 1) === 1; a.forcePose = mkPose(POSES.spinA, { rot: Math.sin(u) * 6 });
    for (let i = 0; i < 3; i++) { const an = u * 0.7 + i * 2.1; FX.p('px', a.x + Math.cos(an) * 22, a.y - 40 + Math.sin(an) * 30, 0, 0, 10, choice([col, '#ffffff']), 1, 0, { floor: false }); }
    if (u % 5 === 0) Sound.play('whoosh');
    if (u > 14 && u < 46 && u % 6 === 0) { g.superHit(S, false); if (S.res === 'hit') v.forcePose = mkPose(POSES.hit, { rot: rand(-8, 8) }); }
    if (u === 24) { S.z = 2.2; S.foc = { x: (a.x + v.x) / 2, y: GROUND - 56 }; S.snap = true; }
    if (u === 48) { a.visFlip = false; a.forcePose = movePose(a.ch, 'roundhouse', 0, 1); g.superHit(S, true); g.slow = 20; FX.ring(v.x, v.y - 44, col, 34, 16); }
  },
  pillar(g, S, u, d, col) {
    const a = S.a, v = S.v, px = S.ax + d * (S.def.min + S.def.max) / 2, hw = (S.def.max - S.def.min) / 2;
    S.px = px; S.hw = hw;
    a.forcePose = mkPose(POSES.cast, { hF: [10, -6], hB: [8, -4] });
    if (u < 16) { for (let i = 0; i < 4; i++) FX.p('px', px + rand(-hw, hw), GROUND - 1, 0, -rand(0.2, 0.6), 14, col, 1, 0, { floor: false }); if (u % 4 === 0) { g.shake(2); Sound.play('land'); } }
    if (u === 16) { Sound.play('explode'); g.shake(8); S.z = 1.5; S.foc = { x: px, y: GROUND - 80 }; S.snap = true; }
    if (u >= 16 && u < 46) {
      for (let i = 0; i < 10; i++) FX.p('px', px + rand(-hw * 0.7, hw * 0.7), GROUND - rand(0, 10), rand(-0.4, 0.4), -rand(3, 7), randi(14, 26), choice([col, '#ffffff', shade(col, -0.3)]), randi(1, 2), -0.02, { floor: false });
      if (u % 7 === 0) g.superHit(S, false);
      if (S.res === 'hit') { v.y = GROUND - Math.min(50, (u - 16) * 2.5); v.forcePose = mkPose(POSES.fall, { rot: (u - 16) * 8 }); }
    }
    if (u === 46) { g.superHit(S, true); g.slow = 20; FX.ring(px, GROUND - 60, col, 40, 18); }
  },
  beam(g, S, u, d, col) {
    const a = S.a, v = S.v, p = reach(a, mkPose(POSES.cast, { torso: 4, head: -4 }), 'F', { x: a.x + d * 60, y: a.y - 50 }); p.wa = 0;
    a.forcePose = p; S.beamFrom = a.x + d * S.def.min;
    if (u < 22) { if (u % 6 === 0) Sound.play('plasma'); S.charge = u / 22; return; }
    if (u === 22) { Sound.play('explode'); g.shake(8); S.beam = true; S.z = 1.45; S.foc = { x: a.x + d * 160, y: GROUND - 60 }; S.snap = true; }
    if (u < 56) { if (u % 6 === 0) g.superHit(S, false); if (S.res === 'hit') { v.forcePose = mkPose(POSES.hit, { head: -30 }); v.x += d * 0.4; } g.shake(1.5); }
    if (u === 56) { S.beam = false; g.superHit(S, true); g.slow = 16; }
  },
  meteor(g, S, u, d, col) {
    const a = S.a, v = S.v, lx = S.ax + d * (S.def.min + S.def.max) / 2;
    S.lx = lx;
    if (u <= 14) { a.y = GROUND - u * u * 1.4; a.forcePose = mkPose(POSES.leapUp); if (u === 1) { Sound.play('jump'); FX.dust(a.x, GROUND, 14); } g.ghostTrail(a); return; }
    if (u < 34) { a.hidden = true; S.shadow = (u - 14) / 20; if (u === 16) { S.z = 1.5; S.foc = { x: lx, y: GROUND - 70 }; S.snap = true; Sound.play('whooshH'); } return; }
    a.hidden = false; a.x = lx - d * 6;
    if (u < 40) { a.y = lerp(GROUND - 260, GROUND, (u - 34) / 6); a.forcePose = mkPose(POSES.dive, { rot: 40 }); g.ghostTrail(a); for (let i = 0; i < 4; i++) FX.p('fire', a.x + rand(-6, 6), a.y - rand(0, 30), 0, -rand(0.5, 2), 16, null, 2, -0.02); return; }
    if (u === 40) {
      a.y = GROUND; a.forcePose = mkPose(POSES.smash); S.shadow = 0; FX.explosion(lx, GROUND - 6, 1.6); FX.ring(lx, GROUND - 4, col, 60, 20); g.shake(10); Sound.play('explode');
      if (Math.abs(v.x - lx) < 70 || S.res !== 'miss') g.superHit(S, true); g.slow = 20;
    }
  },
};
// отрисовка в мире (поверх бойцов)
function drawSuperFx(c, cx, g) {
  const S = g.supS; if (!S) return;
  const a = S.a, d = S.dir, col = a.ch.pal.fx || '#ffd040';
  if (S.def.kind === 'beam') {
    const h = jw(a, a.forcePose, 'hdF');
    if (!S.beam && S.charge) { const r = 2 + S.charge * 7; c.globalAlpha = 0.5; pdisk(c, h.x - cx, h.y, r + 3, col); c.globalAlpha = 1; pdisk(c, h.x - cx, h.y, r, '#ffffff'); }
    if (S.beam) {
      const x0 = h.x - cx, x1 = S.beamFrom - cx, y = h.y, w = 6 + Math.sin(S.t * 1.7) * 2, end = d > 0 ? W + 20 : -20;
      c.globalAlpha = 0.6; c.fillStyle = col; c.fillRect(Math.min(x0, x1), y - 2, Math.abs(x1 - x0), 4);   // тонкий «запал» до точки раскрытия
      c.fillRect(Math.min(x1, end), Math.round(y - w), Math.abs(end - x1), Math.round(w * 2)); c.globalAlpha = 1;
      c.fillStyle = '#ffffff'; c.fillRect(Math.min(x1, end), Math.round(y - w * 0.4), Math.abs(end - x1), Math.max(1, Math.round(w * 0.8)));
      pdisk(c, x1, y, w + 4, '#ffffff'); pdisk(c, x0, y, 4, col);
    }
  }
  if (S.def.kind === 'pillar' && S.px != null && S.t > SUPER_START + 14 && S.t < SUPER_START + 50) {
    const X = S.px - cx; c.globalAlpha = 0.35; c.fillStyle = col; c.fillRect(Math.round(X - S.hw * 0.7), 0, Math.round(S.hw * 1.4), GROUND); c.globalAlpha = 0.6; c.fillStyle = '#ffffff'; c.fillRect(Math.round(X - S.hw * 0.25), 0, Math.round(S.hw * 0.5), GROUND); c.globalAlpha = 1;
  }
  if (S.def.kind === 'pillar' && S.px != null && S.t > SUPER_START && S.t <= SUPER_START + 16) { c.fillStyle = col; c.globalAlpha = 0.5; c.fillRect(Math.round(S.px - cx - S.hw), GROUND - 2, Math.round(S.hw * 2), 3); c.globalAlpha = 1; }
  if (S.def.kind === 'meteor' && S.shadow) { const X = S.lx - cx, r = 6 + S.shadow * 22; c.globalAlpha = 0.5; c.fillStyle = '#000'; c.fillRect(Math.round(X - r), GROUND - 1, Math.round(r * 2), 3); c.globalAlpha = 1; }
}
