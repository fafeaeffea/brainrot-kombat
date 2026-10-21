'use strict';
// Коронные приёмы: у каждого бойца свой (↓ ← + РУКА)
const UNIQUE = {
  kairo: { name: 'Восходящий дракон', kind: 'rise' },
  yuki: { name: 'Ледяное зеркало', kind: 'counter' },
  volt: { name: 'Орбитальный удар', kind: 'strike', style: 'laser' },
  ronin: { name: 'Тысяча порезов', kind: 'flurry' },
  bjorn: { name: 'Удар грома', kind: 'quake' },
  morena: { name: 'Руки мертвецов', kind: 'erupt', style: 'hands' },
  tralalero: { name: 'Акулий круг', kind: 'burrow' },
  bombardiro: { name: 'Ковровый налёт', kind: 'strike', style: 'bombs' },
  tung: { name: 'ТУН-волна', kind: 'stomp' },
  ballerina: { name: 'Кофейный гейзер', kind: 'erupt', style: 'coffee' },
};
const uniqueOf = ch => UNIQUE[ch.id] || UNIQUE.kairo;

// зона удара на расстоянии: появляется, предупреждает, бьёт один раз
function makeZone(owner, o) {
  return Object.assign({ owner, t: 0, on: 0, off: 9999, life: 60, w: 24, h: 80, ground: false, done: false, hit: null, draw: null, update: null }, o);
}

Object.assign(Fighter.prototype, {
  startUnique() {
    const u = uniqueOf(this.ch);
    this.u = u; this.face(); this.setSt('unique'); this.mt = 0; this.hitDone = true; this.hits = 0; this.lastHitMt = 0; this.uBox = null;
    Sound.play('cast');
    if (u.kind === 'counter') { Sound.play('ice'); }
    return true;
  },
  uniqueUpdate() {
    const u = this.u, m = ++this.mt, o = this.opp, g = this.g, f = this.facing;
    const end = n => { if (m >= n) { this.uBox = null; this.hidden = false; this.visFlip = false; this.jet = false; this.toNeutral(); } };
    switch (u.kind) {
      case 'rise': {
        if (m === 7) { this.vy = -8.2; this.vx = f * 1.6; this.y = GROUND - 1; this.hitDone = false; Sound.play('fire'); g.shake(2); }
        if (m >= 7 && this.air) {
          this.physics();
          this.uBox = this.vy < 1 ? [0, -84, 24, 70] : null;
          this.uHit = this.hits >= 2 ? { dmg: 8, launch: [-6.5, 2.6], heavy: true, snd: 'heavy' } : { dmg: 6, launch: [-7.6, 0.6], snd: 'punch' };
          if (this.hitDone && this.hits < 3 && m - this.lastHitMt >= 4) this.hitDone = false;
          FX.fire(this.x + f * 6, this.y - rand(20, 70), 2, 3, 1.2);
          if (!this.air || this.y >= GROUND) { this.y = GROUND; this.vx = 0; this.landT = m; FX.dust(this.x, GROUND, 6); }
        } else if (m > 8) { this.uBox = null; if (m - (this.landT || m) >= 12 || m > 80) end(m); }
        break;
      }
      case 'counter': {
        if (m % 3 === 0) FX.p('px', this.x + rand(-14, 14), this.y - rand(0, 64), 0, -0.4, 18, choice(['#ffffff', '#9fe6ff']), 1, 0);
        end(this.countered ? 30 : 46);
        break;
      }
      case 'strike': {
        if (m === 10) {
          const tx = o.x;
          if (u.style === 'laser') {
            g.zones.push(makeZone(this, { x: tx, y: 0, w: 26, h: GROUND, on: 36, off: 48, life: 60, hit: { dmg: 14, kd: true, kb: 3, heavy: true, chip: true }, draw: drawZone.laser, sfx: 'laser' }));
          } else {
            [-30, 0, 30].forEach((dx, i) => g.zones.push(makeZone(this, { x: tx + dx, y: GROUND - 40, w: 30, h: 40, on: 30 + i * 9, off: 34 + i * 9, life: 40 + i * 9, hit: i === 2 ? { dmg: 7, kd: true, kb: 3, heavy: true, chip: true } : { dmg: 5, hs: 18, kb: 2, chip: true }, draw: drawZone.bomb, sfx: 'explode', boom: true })));
            Sound.play('plane');
          }
        }
        end(34);
        break;
      }
      case 'flurry': {
        if (m < 8) { this.x += f * 4; if (m % 2 === 0) g.ghostTrail(this); }
        if (m === 8) { this.hitDone = false; Sound.play('slash'); }
        if (m >= 8 && m < 34) {
          this.uBox = [-2, -66, 36, 54];
          this.uHit = this.hits >= 5 ? { dmg: 6, kd: true, kb: 4, heavy: true, snd: 'slashHit' } : { dmg: 3, hs: 14, kb: 0.4, snd: 'slashHit' };
          if (this.hitDone && this.hits < 6 && m - this.lastHitMt >= 4) this.hitDone = false;
          if (m % 4 === 0) { Sound.play('slash'); for (let i = 0; i < 6; i++) FX.p('px', this.x + f * rand(10, 36), this.y - rand(20, 60), f * rand(1, 3), rand(-2, 2), 8, choice(['#ffffff', '#ff3a8a', '#7fe8ff']), 1, 0); }
        } else this.uBox = null;
        end(46);
        break;
      }
      case 'quake': {
        if (m === 4) { this.vy = -6.4; this.vx = 0; this.y = GROUND - 1; Sound.play('jump'); }
        if (m >= 4 && (this.air || this.vy < 0)) {
          this.physics();
          if (!this.air && this.vy >= 0) {
            this.y = GROUND; this.landT = m; g.shake(8); Sound.play('crunch'); Sound.play('thunder'); FX.dust(this.x, GROUND, 20); FX.ring(this.x, GROUND - 2, '#ffd36a', 30, 16);
            g.flashA = 0.3; g.boltT = 6; g.boltX = this.x; g.boltY = GROUND;
            g.zones.push(makeZone(this, { x: this.x + f * 20, y: GROUND - 20, w: 22, h: 20, on: 0, off: 34, life: 34, vx: f * 5.5, ground: true, hit: { dmg: 12, trip: true, low: true, kb: 3, chip: true, snd: 'heavy' }, draw: drawZone.quake }));
          }
        }
        if (this.landT) end(this.landT + 18);
        if (m > 90) end(m);
        break;
      }
      case 'erupt': {
        if (m === 12) {
          const coffee = u.style === 'coffee';
          g.zones.push(makeZone(this, { x: o.x, y: GROUND - 90, w: 28, h: 90, on: 22, off: 32, life: 50, hit: { dmg: coffee ? 11 : 12, launch: [-7.2, 1], heavy: true, chip: true }, draw: coffee ? drawZone.coffee : drawZone.hands, sfx: coffee ? 'wave' : 'skull' }));
        }
        end(34);
        break;
      }
      case 'burrow': {
        if (m === 6) { this.hidden = true; Sound.play('wave'); FX.dust(this.x, GROUND, 10); for (let i = 0; i < 16; i++) FX.p('px', this.x + rand(-10, 10), GROUND - 2, rand(-2, 2), -rand(1, 4), 30, choice(['#ffffff', '#4fc3ff']), 1, 0.25); g.zones.push(makeZone(this, { follow: true, life: 200, draw: drawZone.fin })); }
        if (this.hidden && !this.burst) {
          const d = o.x - this.x;
          if (Math.abs(d) > 6 && m < 56) this.x += Math.sign(d) * 4.5;
          else {
            this.burst = true; this.hidden = false; this.facing = Math.sign(o.x - this.x) || f; this.y = GROUND - 1; this.vy = -7; this.vx = 0; Sound.play('bite'); g.shake(5);
            for (let i = 0; i < 30; i++) FX.p('px', this.x + rand(-14, 14), GROUND - 2, rand(-2.5, 2.5), -rand(2, 6), 40, choice(['#ffffff', '#4fc3ff', '#9fdfff']), 1, 0.25);
            g.zones.push(makeZone(this, { x: this.x, y: GROUND - 80, w: 30, h: 80, on: 0, off: 8, life: 8, hit: { dmg: 13, launch: [-7.4, 1.5], heavy: true, chip: true, snd: 'bite' } }));
          }
        }
        if (this.burst) { this.physics(); if (!this.air) { this.y = GROUND; if (!this.landT) this.landT = m; } }
        if (this.landT && m - this.landT >= 10) { this.burst = false; this.landT = 0; end(m); }
        if (m > 140) { this.burst = false; this.landT = 0; this.y = GROUND; end(m); }
        break;
      }
      case 'stomp': {
        if (m === 16) {
          Sound.play('tun'); Sound.play('crunch'); g.shake(7); FX.dust(this.x + f * 20, GROUND, 16); FX.text(this.x + f * 20, this.y - 80, 'ТУН!', 3, ['#ffffff', '#ffd36a', '#ff6a1a'], 40);
          g.zones.push(makeZone(this, { x: this.x + f * 22, y: GROUND - 18, w: 10, h: 18, on: 0, off: 22, life: 24, ring: true, ground: true, hit: { dmg: 11, kd: true, kb: 4, heavy: true, chip: true, snd: 'tun' }, draw: drawZone.ring }));
        }
        end(36);
        break;
      }
    }
  },
  uniquePose() {
    const u = this.u, m = this.mt, ch = this.ch;
    switch (u.kind) {
      case 'rise': return m < 7 ? blendPose(stanceOf(ch), mkPose(MOVE_POSES.uppercut.wind), m / 7) : this.air ? mkPose(MOVE_POSES.uppercut.hit, { hy: -2, fF: [4, -10], fB: [-6, -4] }) : mkPose(POSES.land);
      case 'counter': return this.countered ? mkPose(MOVE_POSES.kick.hit) : mkPose(POSES.block, { torso: 4, head: -4, hF: [10, -16], hB: [12, -12] });
      case 'strike': return u.style === 'laser' ? mkPose({ hF: [5, -9], eF: { x: 1, y: 0 }, hB: [7, -3], torso: 0, head: 10 }) : mkPose(POSES.raise);
      case 'flurry': return m < 8 ? mkPose(POSES.cut, { wa: -60 }) : (m >> 2) & 1 ? mkPose(POSES.cut, { wa: 40 }) : mkPose(stanceOf(ch), { hF: [-4, -14], torso: -6, wa: -150 });
      case 'quake': return this.air ? mkPose(POSES.leapUp) : mkPose(POSES.smash);
      case 'erupt': return m < 12 ? blendPose(stanceOf(ch), mkPose(POSES.cast), m / 12) : mkPose(POSES.cast, { hF: [10, -6], hB: [8, -4] });
      case 'burrow': return this.burst ? mkPose(POSES.torpedo, { rot: -70 }) : mkPose(POSES.crouch);
      case 'stomp': return m < 16 ? blendPose(stanceOf(ch), mkPose(POSES.raise, { wa: -10 }), m / 16) : mkPose(POSES.smash);
    }
    return stanceOf(ch);
  },
  // Юки: удар во время стойки — уходит за спину и замораживает
  tryCounter(h) {
    if (this.st !== 'unique' || !this.u || this.u.kind !== 'counter' || this.countered || this.mt > 40 || h.throw || h.fatal) return false;
    const a = this.opp; this.countered = true; this.mt = 0;
    const side = Math.sign(a.x - this.x) || 1;
    this.x = clamp(a.x + side * 26, 20, STAGE_W - 20); this.face();
    Sound.play('shatter'); Sound.play('freeze'); this.g.flashA = 0.4; this.g.shake(4);
    for (let i = 0; i < 30; i++) FX.p('px', a.x + rand(-12, 12), a.y - rand(0, 64), rand(-2, 2), rand(-2, 1), 30, choice(['#ffffff', '#9fe6ff', '#3a8ad8']), 1, 0.1);
    FX.text(this.x, this.y - 84, 'ЗЕРКАЛО!', 1, ['#ffffff', '#9fe6ff'], 40);
    const res = a.receive({ dmg: 7, freeze: 70 }, this.facing);
    if (res === 'hit') { this.combo++; this.g.combos[this.idx] = { n: this.combo, t: 0 }; this.g.afterHit(this, a, {}); }
    return true;
  }
});

const drawZone = {
  laser(c, cx, z) {
    const x = Math.round(z.x - cx), t = z.t;
    if (t < z.on) { if ((t >> 2) & 1) { c.fillStyle = '#ff2a2a'; const s = 10; c.fillRect(x - s, GROUND - 2, s * 2, 1); c.fillRect(x, GROUND - s * 2, 1, s * 2); pring(c, x, GROUND - 4, 8 - (t % 8) * 0.5, '#ff4a3a'); } c.globalAlpha = 0.25; c.fillStyle = '#7fe8ff'; c.fillRect(x, 0, 1, GROUND); c.globalAlpha = 1; return; }
    if (t >= z.off + 6) return;
    const k = t < z.on + 3 ? (t - z.on + 1) / 3 : t > z.off ? 1 - (t - z.off) / 6 : 1, w = Math.max(1, Math.round(12 * k));
    c.globalAlpha = 0.5; c.fillStyle = '#2a6aff'; c.fillRect(x - w - 3, 0, w * 2 + 6, GROUND + 2); c.globalAlpha = 1;
    c.fillStyle = '#7fe8ff'; c.fillRect(x - w, 0, w * 2, GROUND + 2); c.fillStyle = '#ffffff'; c.fillRect(x - Math.ceil(w / 2), 0, Math.ceil(w / 2) * 2, GROUND + 2);
    pdisk(c, x, GROUND, w + 5, '#bff6ff');
  },
  bomb(c, cx, z) {
    if (z.t >= z.on) return;
    const k = z.t / z.on, x = Math.round(z.x - cx), y = Math.round(lerp(-20, GROUND - 8, k * k));
    c.fillStyle = '#5a5a5a'; c.fillRect(x - 3, y - 10, 2, 5); c.fillRect(x + 1, y - 10, 2, 5);
    pdisk(c, x, y, 4, '#18181c'); pdisk(c, x - 1, y - 1, 2, '#3a3a44'); c.fillStyle = '#c8323c'; c.fillRect(x - 4, y - 2, 8, 1);
    c.globalAlpha = 0.3; c.fillStyle = '#000'; c.fillRect(x - 4 * k - 2, GROUND - 1, 8 * k + 4, 2); c.globalAlpha = 1;
  },
  hands(c, cx, z) {
    const x = Math.round(z.x - cx), t = z.t;
    if (t < z.on) { c.globalAlpha = 0.4 + 0.3 * Math.sin(t * 0.6); pdisk(c, x, GROUND, 10 + t * 0.3, '#5a2a8a'); c.globalAlpha = 1; if (t % 3 === 0) FX.p('fire', z.x + rand(-10, 10), GROUND - 2, 0, -0.6, 18, choice(['#c06bff', '#efe0ff']), 1, 0); return; }
    const k = clamp((t - z.on) / 5, 0, 1) * (t > z.off + 8 ? Math.max(0, 1 - (t - z.off - 8) / 8) : 1);
    for (const [ox, hh] of [[-9, 34], [0, 46], [9, 30]]) {
      const h = Math.round(hh * k), bx = x + ox;
      c.fillStyle = '#2a1a2a'; c.fillRect(bx - 3, GROUND - h, 6, h); c.fillStyle = '#e8e0d0'; c.fillRect(bx - 2, GROUND - h, 4, h); c.fillStyle = '#b8b0a0'; c.fillRect(bx + 1, GROUND - h, 1, h);
      for (let i = 0; i < 4; i++) { c.fillStyle = '#e8e0d0'; c.fillRect(bx - 4 + i * 2.5, GROUND - h - 6 - (i === 1 || i === 2 ? 2 : 0), 1, 6); }
    }
  },
  coffee(c, cx, z) {
    const x = Math.round(z.x - cx), t = z.t;
    if (t < z.on) { if (t % 2 === 0) FX.p('px', z.x + rand(-10, 10), GROUND - 2, 0, -rand(0.5, 1.5), 14, choice(['#7a4a2a', '#e7cfa6']), 1, 0.05); c.globalAlpha = 0.5; pdisk(c, x, GROUND, 8 + t * 0.4, '#4a2a14'); c.globalAlpha = 1; return; }
    const k = clamp((t - z.on) / 4, 0, 1) * (t > z.off + 6 ? Math.max(0, 1 - (t - z.off - 6) / 10) : 1), h = Math.round(92 * k);
    for (let y = 0; y < h; y += 2) { const w = 7 + Math.sin(y * 0.3 + t) * 2; c.fillStyle = y % 6 < 2 ? '#a06a3a' : '#6a3a1a'; c.fillRect(Math.round(x - w), GROUND - y, Math.round(w * 2), 2); }
    if (h > 4) { pdisk(c, x, GROUND - h, 11, '#f2e2c4'); pdisk(c, x - 4, GROUND - h - 3, 6, '#ffffff'); }
  },
  quake(c, cx, z) {
    const x = Math.round(z.x - cx);
    for (let i = 0; i < 4; i++) { const h = 8 + ((z.t + i * 3) % 5) * 3; c.fillStyle = '#4a3a30'; c.fillRect(x - 8 + i * 4, GROUND - h, 4, h); c.fillStyle = '#7a6a58'; c.fillRect(x - 8 + i * 4, GROUND - h, 2, 2); }
    if (z.t % 2 === 0) FX.dust(z.x, GROUND, 2);
  },
  ring(c, cx, z) {
    const x = Math.round(z.x - cx), r = z.w / 2;
    c.fillStyle = '#ffd36a'; for (let a = 0; a < 6.283; a += 0.08) c.fillRect(Math.round(x + Math.cos(a) * r), Math.round(GROUND - 2 + Math.sin(a) * r * 0.18), 2, 1);
    c.globalAlpha = 0.35; c.fillStyle = '#fff6b0'; for (let a = 0; a < 6.283; a += 0.12) c.fillRect(Math.round(x + Math.cos(a) * (r - 3)), Math.round(GROUND - 2 + Math.sin(a) * (r - 3) * 0.18), 1, 1); c.globalAlpha = 1;
  },
  fin(c, cx, z) {
    const f = z.owner; if (!f.hidden) { z.t = z.life; return; }
    const x = Math.round(f.x - cx), d = f.facing;
    c.fillStyle = '#2a3a4a'; for (let i = 0; i < 12; i++) c.fillRect(x - d * 6 + d * Math.round(i * 0.5), GROUND - 2 - i, Math.max(1, 10 - i), 1);
    c.fillStyle = '#6d8fae'; for (let i = 0; i < 10; i++) c.fillRect(x - d * 5 + d * Math.round(i * 0.5), GROUND - 2 - i, Math.max(1, 7 - i), 1);
    c.fillStyle = '#e8f8ff'; c.fillRect(x - 12, GROUND - 1, 24, 1);
    if (z.t % 2 === 0) FX.p('px', f.x - d * 8, GROUND - 2, -d * rand(0.5, 1.5), -rand(0.5, 2), 16, '#ffffff', 1, 0.15);
  }
};
