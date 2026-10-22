'use strict';
// Боец: состояния, удары, спецприёмы
const GRAV = 0.36, JUMP_V = -7.4;
const MOVES = {
  jab: { st: 4, act: 3, rec: 9, dmg: 5, hs: 15, bs: 8, kb: 1.8, box: [6, -54, 31, 12], snd: 'punch', chain: ['cross', 'kick', 'uppercut', 'sweep', 'roundhouse'] },
  cross: { st: 5, act: 3, rec: 11, dmg: 6, hs: 17, bs: 9, kb: 2.4, box: [6, -54, 34, 12], snd: 'punch', chain: ['kick', 'uppercut', 'roundhouse', 'sweep'] },
  kick: { st: 7, act: 4, rec: 13, dmg: 8, hs: 18, bs: 10, kb: 3, box: [8, -64, 36, 20], snd: 'kick', chain: ['uppercut', 'roundhouse'] },
  roundhouse: { st: 9, act: 5, rec: 18, dmg: 12, kb: 5, kd: true, bs: 12, box: [6, -68, 38, 22], snd: 'kick', heavy: true },
  uppercut: { st: 6, act: 5, rec: 20, dmg: 13, launch: [-7.6, 2.2], bs: 12, box: [2, -80, 26, 38], snd: 'heavy', heavy: true },
  sweep: { st: 7, act: 5, rec: 16, dmg: 7, trip: true, low: true, bs: 10, box: [4, -14, 40, 14], snd: 'kick', crouch: true },
  airP: { st: 3, act: 8, rec: 4, dmg: 7, hs: 16, kb: 2, bs: 8, box: [4, -48, 28, 22], air: true, snd: 'punch' },
  airK: { st: 4, act: 10, rec: 4, dmg: 9, hs: 18, kb: 3, bs: 9, box: [4, -42, 34, 22], air: true, snd: 'kick' },
  throw: { st: 3, act: 2, rec: 22, dmg: 12, box: [4, -58, 18, 44], throw: true },
  backfist: { st: 8, act: 4, rec: 14, dmg: 9, hs: 20, bs: 11, kb: 4, box: [4, -62, 36, 16], snd: 'heavy', heavy: true, spin: true, chain: ['kick', 'sweep'] },
  pushkick: { st: 7, act: 4, rec: 15, dmg: 7, hs: 16, bs: 10, kb: 7.5, box: [6, -48, 38, 18], snd: 'kick' },
  overhead: { st: 13, act: 4, rec: 14, dmg: 10, hs: 20, bs: 12, kb: 3, box: [6, -68, 32, 38], snd: 'heavy', heavy: true, overhead: true },
  divekick: { st: 3, act: 40, rec: 6, dmg: 9, hs: 18, kb: 3.5, bs: 10, box: [2, -26, 24, 22], air: true, dive: true, snd: 'kick' },
};
MOVES.jab.chain.push('backfist', 'overhead', 'pushkick'); MOVES.cross.chain.push('backfist', 'pushkick'); MOVES.kick.chain.push('pushkick');
// дополнительные комбо-связки
MOVES.kick.chain.push('sweep', 'backfist'); MOVES.backfist.chain.push('uppercut', 'roundhouse');
MOVES.sweep.chain = ['uppercut', 'kick']; MOVES.pushkick.chain = ['jab', 'cross', 'roundhouse']; MOVES.overhead.chain = ['sweep', 'kick', 'uppercut'];
// для оружия чуть дальше достаёт
for (const k of ['jab', 'cross']) MOVES[k + 'W'] = Object.assign({}, MOVES[k], { box: [6, -60, 44, 24], dmg: MOVES[k].dmg + 1, snd: 'slashHit' });

const UNIQUE_CD = 240; // 4 секунды между коронными приёмами
const DASH = {
  teleport: { kind: 'tele', col: 'fire', dmg: 11, kd: true, box: [4, -54, 20, 12], name: 'Огненный телепорт' },
  warp: { kind: 'tele', col: 'souls', dmg: 11, kd: true, kick: true, box: [4, -62, 24, 16], name: 'Теневой шаг' },
  slide: { kind: 'rush', v: 5.8, dur: 20, box: [2, -14, 26, 14], dmg: 10, trip: true, pose: 'slide', name: 'Ледяное скольжение' },
  jet: { kind: 'rush', v: 6.3, dur: 16, box: [2, -56, 22, 32], dmg: 11, kd: true, pose: 'rush', jet: true, name: 'Реактивный таран' },
  dashcut: { kind: 'rush', v: 8.5, dur: 11, box: [-6, -60, 34, 40], dmg: 12, kd: true, pose: 'cut', ghost: true, pass: true, name: 'Рывок-разрез' },
  charge: { kind: 'rush', v: 5.2, dur: 20, box: [2, -58, 20, 42], dmg: 12, kd: true, pose: 'rush', name: 'Таран берсерка' },
  torpedo: { kind: 'rush', v: 6.4, dur: 18, box: [0, -50, 28, 22], dmg: 11, kd: true, pose: 'torpedo', lift: 16, name: 'Акулья торпеда' },
  pirouette: { kind: 'rush', v: 3.3, dur: 32, box: [-6, -54, 28, 40], dmg: 4, hs: 12, multi: 8, pose: 'spin', name: 'Вихрь-пируэт' },
  leap: { kind: 'leap', dmg: 13, kd: true, box: [2, -76, 30, 76], name: 'Прыжок с битой' },
  dive: { kind: 'dive', dmg: 13, kd: true, box: [-2, -48, 28, 40], name: 'Пике' },
};

class Fighter {
  constructor(ch, idx, game) { this.ch = ch; this.idx = idx; this.g = game; this.R = new Raster(SPR_W, SPR_H); this.taken = 0; this.sup = 0; this.reset(STAGE_W / 2, 1); }
  reset(x, facing) { this.uCd = 0; this.dCd = 0; this.pCd = 0;
    Object.assign(this, {
      x, y: GROUND, vx: 0, vy: 0, facing, hp: 100, dhp: 100, st: 'idle', t: 0, anim: randi(0, 100), move: null, moveName: '', mt: 0, hitDone: false,
      stun: 0, combo: 0, juggle: 0, alpha: 1, hidden: false, tint: null, tintK: 1, flash: 0, frozen: 0, invul: 0, altPunch: false, airAttacked: false,
      finishMe: false, dead: false, skeleton: false, forcePose: null, jet: false, thrower: null, scaleY: 1, rotExtra: 0, roundDmg: 0, visFlip: false,
      jdir: 0, walkDir: 1, dash: null, hitLow: false, ghost: 0, autoBlock: false, lastBlockCrouch: false, aura: null, offY: 0
    });
    this.pose = stanceOf(this.ch);
  }
  get air() { return this.y < GROUND - 0.5; }
  get opp() { return this.g.f[1 - this.idx]; }
  face() { const o = this.opp; if (Math.abs(o.x - this.x) > 3) this.facing = o.x > this.x ? 1 : -1; }
  setSt(s) { this.st = s; this.t = 0; }
  setStIf(s) { if (this.st !== s) this.setSt(s); }
  canAct() { return this.st === 'idle' || this.st === 'walk' || this.st === 'crouch' || this.st === 'block' || this.st === 'cblock'; }
  canBeThrown() { return !this.air && this.invul <= 0 && !['fall', 'down', 'getup', 'thrown', 'dead', 'throwing', 'jsquat', 'dizzy'].includes(this.st); }
  toNeutral() {
    if (this.finishMe) { this.setSt('dizzy'); this.vx = 0; return; }
    if (this.st === 'hit' || this.st === 'bstun' || this.st === 'getup' || this.st === 'frozen') { this.opp.combo = 0; this.juggle = 0; }
    this.setSt('idle'); this.vx = 0;
  }
  physics() {
    if (this.air || this.vy < 0) {
      this.vy += GRAV; this.x += this.vx; this.y += this.vy;
      if (this.y >= GROUND) this.y = GROUND;
    }
  }
  land() { this.y = GROUND; this.vy = 0; this.vx = 0; this.setSt('land'); Sound.play('land'); FX.dust(this.x, GROUND, 4); }

  update(ctl) {
    this.t++; this.anim++;
    if (this.flash > 0) this.flash--;
    if (this.invul > 0) this.invul--;
    if (this.uCd > 0) this.uCd--; if (this.dCd > 0) this.dCd--; if (this.pCd > 0) this.pCd--;
    if (this.ghost > 0) this.ghost--;
    // супер можно начать и из начала удара/блока: H, F, G почти никогда не жмутся в один кадр
    if (ctl && ctl.special === 'super' && /^(attack|block|cblock|crouch)$/.test(this.st) && !(this.st === 'attack' && (this.move.air || this.mt > this.move.st + 4)) && this.trySpecial('super')) return;
    if (this.st === 'frozen') {
      this.physics();
      if (--this.frozen <= 0) { this.tint = null; this.setSt('hit'); this.stun = 6; FX.burst && Sound.play('shatterS'); for (let i = 0; i < 14; i++) FX.p('px', this.x + rand(-8, 8), this.y - rand(5, 60), rand(-2, 2), rand(-2, 0), 30, choice(['#ffffff', '#9fe6ff', '#4f9fe0']), 1, 0.2); }
      this.computePose(); return;
    }
    const fwd = ctl ? (this.facing === 1 ? ctl.r : ctl.l) : false, back = ctl ? (this.facing === 1 ? ctl.l : ctl.r) : false;
    switch (this.st) {
      case 'idle': case 'walk': case 'crouch': case 'block': case 'cblock': this.neutral(ctl, fwd, back); break;
      case 'jsquat': if (this.t >= 3) { this.vy = JUMP_V; this.vx = this.jdir * 2.5; this.airAttacked = false; this.setSt('jump'); Sound.play('jump'); } break;
      case 'jump':
        if (ctl && !this.airAttacked) { if (ctl.p) { this.startMove('airP'); break; } if (ctl.k) { if (ctl.d && this.vy > -3) { this.startMove('divekick'); this.vx = this.facing * 3.8; break; } this.startMove('airK'); break; } }
        this.physics(); if (!this.air && this.t > 2) this.land(); break;
      case 'land': if (this.t >= 5) this.toNeutral(); break;
      case 'attack': this.attackUpdate(ctl, fwd, back); break;
      case 'special': this.specialUpdate(); break;
      case 'dash': this.dashUpdate(); break;
      case 'unique': this.uniqueUpdate(); break;
      case 'hit': case 'bstun': this.vx *= 0.82; this.x += this.vx; if (this.air) this.physics(); if (--this.stun <= 0) this.toNeutral(); break;
      case 'fall':
        this.physics();
        if (!this.air && this.t > 2) {
          this.y = GROUND; Sound.play('land'); this.g.shake(2); FX.dust(this.x, GROUND, 8); this.vx = 0; this.vy = 0;
          this.setSt(this.dead ? 'dead' : 'down');
        }
        break;
      case 'down': this.vx = 0; if (this.t >= 28) { this.setSt('getup'); this.invul = 22; } break;
      case 'getup': if (this.t >= 20) this.toNeutral(); break;
      case 'thrown': this.thrownUpdate(); break;
      case 'throwing': if (this.t >= 24) this.toNeutral(); break;
      case 'victory': this.victoryUpdate(); break;
    }
    this.computePose(ctl);
  }
  neutral(ctl, fwd, back) {
    this.face();
    if (!ctl) { this.setStIf('idle'); return; }
    if (ctl.special && this.trySpecial(ctl.special)) return;
    if (ctl.p) {
      if (ctl.d) { this.startMove('uppercut'); return; }
      const o = this.opp;
      if (fwd && Math.abs(o.x - this.x) < 34 && o.canBeThrown()) { this.startMove('throw'); return; }
      if (back) { this.startMove('backfist'); return; }
      if (fwd) { this.startMove('overhead'); return; }
      this.startMove(this.altPunch ? 'cross' : 'jab'); this.altPunch = !this.altPunch; return;
    }
    if (ctl.k) {
      if (ctl.d) { this.startMove('sweep'); return; }
      if (back) { this.startMove('roundhouse'); return; }
      if (fwd) { this.startMove('pushkick'); return; }
      this.startMove('kick'); return;
    }
    // блок кнопкой или удержанием «назад», когда соперник атакует
    const threat = this.opp.isThreat() && Math.abs(this.opp.x - this.x) < 110 || this.g.projThreat(this);
    if (ctl.b || (back && threat)) { this.setStIf(ctl.d ? 'cblock' : 'block'); this.lastBlockCrouch = !!ctl.d; return; }
    if (ctl.u) { this.jdir = fwd ? this.facing : back ? -this.facing : 0; this.setSt('jsquat'); return; }
    if (ctl.d) { this.setStIf('crouch'); return; }
    if (fwd) { this.setStIf('walk'); this.x += 1.75 * this.facing; this.walkDir = 1; return; }
    if (back) { this.setStIf('walk'); this.x -= 1.4 * this.facing; this.walkDir = -1; return; }
    this.setStIf('idle');
  }
  isThreat() { return this.st === 'attack' || this.st === 'dash' || (this.st === 'special' && this.mt < 12) || (this.st === 'unique' && this.mt < 24) || this.st === 'jsquat'; }
  startMove(name) {
    if (this.ch.weapon && (name === 'jab' || name === 'cross')) name += 'W';
    this.move = MOVES[name]; this.moveName = name.replace('W', ''); this.mt = 0; this.hitDone = false; this.setSt('attack');
    if (this.move.air) this.airAttacked = true;
    if (this.move.throw) Sound.play('grab'); else Sound.play(this.move.heavy ? 'whooshH' : 'whoosh');
  }
  attackUpdate(ctl, fwd, back) {
    const m = this.move; this.mt++;
    if (m.dive) this.vy = 4.6;
    if (m.spin) this.visFlip = this.mt < m.st * 0.7;
    if (m.air) { this.physics(); if (!this.air) { this.visFlip = false; this.land(); return; } }
    else { this.vx *= 0.8; this.x += this.vx; if (this.mt === m.st && !m.throw) this.x += this.facing * 2; }
    if (this.hitDone && ctl && this.mt >= m.st + 1 && !m.air) {
      if (ctl.special && this.trySpecial(ctl.special)) return;
      let next = null;
      if (ctl.p) next = ctl.d ? 'uppercut' : back ? 'backfist' : fwd ? 'overhead' : (this.moveName === 'jab' ? 'cross' : 'jab');
      else if (ctl.k) next = ctl.d ? 'sweep' : back ? 'roundhouse' : fwd ? 'pushkick' : 'kick';
      if (next && m.chain && m.chain.includes(next)) { this.startMove(next); return; }
    }
    if (this.mt >= m.st + m.act + m.rec) { this.visFlip = false; if (m.air && this.air) this.setSt('jump'); else this.toNeutral(); }
  }
  trySpecial(kind) {
    if (this.air) return false;
    if (kind === 'proj') { if (this.g.projOf(this) || this.pCd > 0) return false; this.pCd = 50; this.face(); this.setSt('special'); this.mt = 0; Sound.play('cast'); return true; }
    if (kind === 'dash') { if (this.dCd > 0) return false; this.face(); this.startDash(); this.dCd = 70; return true; }
    if (kind === 'fatal') return this.g.tryFatality(this);
    if (kind === 'super') return this.g.startSuper ? this.g.startSuper(this) : false;
    // коронный приём — с перезарядкой, чтобы его нельзя было спамить
    if (kind === 'unique') { if (this.uCd > 0) return false; this.landT = 0; this.burst = false; this.countered = false; const ok = this.startUnique(); if (ok) this.uCd = UNIQUE_CD; return ok; }
    return false;
  }
  specialUpdate() {
    this.mt++;
    const tp = this.ch.proj;
    if (this.mt === 11) { this.g.spawnProj(this, tp); }
    if (this.mt < 11 && this.mt % 2 === 0) {
      const hx = this.x + this.facing * 6, hy = this.y - 46;
      if (tp === 'fire') FX.fire(hx, hy, 2, 4, 1); else if (tp === 'skull') FX.p('fire', hx + rand(-5, 5), hy + rand(-5, 5), 0, -0.5, 18, choice(['#c06bff', '#efe0ff']), 1, 0);
      else if (tp === 'ice') FX.p('px', hx + rand(-6, 6), hy + rand(-6, 6), 0, 0, 16, '#9fe6ff', 1, 0);
      else if (tp === 'plasma') FX.p('px', hx + rand(-6, 6), hy + rand(-6, 6), 0, 0, 12, '#7dff6a', 1, 0);
    }
    if (this.mt >= 30) this.toNeutral();
  }
  startDash() {
    const d = DASH[this.ch.dash];
    this.dash = d; this.setSt('dash'); this.mt = 0; this.hitDone = false; this.hits = 0;
    if (d.kind === 'tele') { Sound.play('teleport'); }
    else if (d.kind === 'rush') { Sound.play(d.pose === 'spin' ? 'spin' : 'dash'); if (d.lift) this.y = GROUND - 1; }
    else if (d.kind === 'leap') { this.vy = -6.6; this.vx = 3.4 * this.facing; this.y = GROUND - 1; Sound.play('jump'); }
    else if (d.kind === 'dive') { this.vy = -7.2; this.vx = 1.2 * this.facing; this.y = GROUND - 1; Sound.play('plane'); }
  }
  dashActive() {
    const d = this.dash, m = this.mt;
    if (!d) return false;
    if (d.kind === 'tele') return m >= 16 && m < 22;
    if (d.kind === 'rush') return m >= 3 && m < d.dur;
    if (d.kind === 'leap') return this.vy > -1 && this.air;
    if (d.kind === 'dive') return m >= 16 && this.air;
    return false;
  }
  dashUpdate() {
    const d = this.dash; this.mt++;
    const o = this.opp, m = this.mt;
    if (d.kind === 'tele') {
      if (m < 12) { this.alpha = 1 - m / 12; if (m % 2 === 0) this.teleFx(); }
      if (m === 12) {
        const side = Math.sign(o.x - this.x) || 1;
        this.x = clamp(o.x + side * 30, this.g.camX + 16, this.g.camX + W - 16);
        this.face(); Sound.play('teleport');
      }
      if (m > 12 && m <= 16) { this.alpha = (m - 12) / 4; this.teleFx(); }
      if (m >= 34) { this.alpha = 1; this.toNeutral(); }
    } else if (d.kind === 'rush') {
      if (m < d.dur) {
        this.x += d.v * this.facing;
        if (d.lift) this.y = GROUND - d.lift;
        if (d.jet || d.pose === 'torpedo') { this.jet = true; if (m % 2 === 0) FX.fire(this.x - this.facing * 14, this.y - 40 + (d.lift || 0) * 0.5, 2, 2, 0.3); }
        if (d.ghost && m % 2 === 0) this.g.ghostTrail(this);
        if (d.pose === 'slide' && m % 2 === 0) FX.p('px', this.x + rand(-6, 6), GROUND - 1, -this.facing * rand(0.5, 1.5), -rand(0.5, 1.5), 20, choice(['#ffffff', '#cfefff']), 1, 0.1);
        if (d.pose === 'spin') { this.visFlip = ((m >> 2) & 1) === 1; if (m % 3 === 0) FX.p('px', this.x + rand(-14, 14), this.y - rand(10, 50), rand(-1, 1), rand(-1, 1), 20, choice(['#ffc2db', '#ffffff', '#c98a5a']), 1, 0); }
        if (d.multi && this.hitDone && this.hits < 4 && m - this.lastHitMt >= d.multi) this.hitDone = false;
      } else { this.jet = false; this.visFlip = false; if (d.lift) this.y = GROUND; }
      if (m >= d.dur + 12) { this.jet = false; this.toNeutral(); }
    } else if (d.kind === 'leap') {
      if (this.air) { this.physics(); if (!this.air) { this.y = GROUND; this.vx = 0; this.landT = m; FX.dust(this.x + this.facing * 20, GROUND, 14); FX.ring(this.x + this.facing * 22, GROUND - 2, '#ffd36a', 22, 14); this.g.shake(5); Sound.play('tun'); } }
      else if (m - (this.landT || 0) >= 14) this.toNeutral();
    } else if (d.kind === 'dive') {
      if (m === 16) { this.vx = 5.2 * this.facing; this.vy = 5.6; Sound.play('dive'); }
      if (m < 16) this.physics();
      else if (this.air) { this.x += this.vx; this.y = Math.min(GROUND, this.y + this.vy); if (m % 2 === 0) FX.smoke(this.x - this.facing * 10, this.y - 30, 1, '#8a8a8a'); if (this.y >= GROUND) { this.landT = m; FX.explosion(this.x + this.facing * 12, GROUND - 6, 0.7); Sound.play('explode'); this.g.shake(5); this.vx = 0; } }
      else if (m - (this.landT || 0) >= 14) this.toNeutral();
      if (m > 120) { this.y = GROUND; this.toNeutral(); }
    }
  }
  teleFx() {
    if (this.dash.col === 'fire') FX.fire(this.x + rand(-6, 6), this.y - rand(0, 60), 3, 3, 1.4);
    else for (let i = 0; i < 3; i++) FX.p('fire', this.x + rand(-8, 8), this.y - rand(0, 60), 0, -rand(0.3, 1), 22, choice(['#c06bff', '#5a2a8a', '#efe0ff']), 1, 0);
  }
  thrownUpdate() {
    const a = this.thrower, k = this.t / 22;
    this.x = lerp(a.x + a.facing * 14, a.x - a.facing * 30, k);
    this.y = GROUND - Math.sin(Math.min(1, k) * Math.PI) * 34;
    if (k >= 1) {
      const dmg = 12; this.hp = Math.max(0, this.hp - dmg); this.roundDmg += dmg; this.taken += dmg; this.flash = 4; if (this.g.dmgPop) this.g.dmgPop(this, dmg, false);
      this.g.shake(6); Sound.play('heavy'); FX.blood(this.x, GROUND - 10, -a.facing, 12); FX.dust(this.x, GROUND, 12);
      this.setSt('fall'); this.vy = -2.5; this.vx = -a.facing * 1.4; this.y = GROUND - 2;
      a.combo = 1; this.g.afterHit(a, this, { dmg });
    }
  }
  victoryUpdate() {
    const w = this.ch.win, t = this.t;
    if (w === 'fly' && t > 30) { this.y = GROUND - Math.min(70, (t - 30) * 1.1) + Math.sin(t * 0.1) * 2; this.jet = true; if (t % 2 === 0) FX.fire(this.x - this.facing * 10, this.y - 36, 1, 2, 0.4); }
    if (w === 'levitate') { this.y = GROUND - Math.min(18, t * 0.4) + Math.sin(t * 0.08) * 2; if (t % 3 === 0) FX.p('fire', this.x + rand(-12, 12), this.y - rand(0, 50), 0, -0.6, 30, choice(['#c06bff', '#8a3ad0', '#efe0ff']), 1, 0); }
    if (w === 'spin') this.visFlip = ((t >> 3) & 1) === 1;
  }
  // ---------- коробки столкновений ----------
  hurtBox() {
    const s = this.st;
    if (s === 'down' || s === 'dead' || s === 'getup' || s === 'thrown' || this.invul > 0 || this.hidden || (this.dash && s === 'dash' && this.dash.kind === 'tele' && this.mt < 16)) return null;
    let b;
    if (s === 'crouch' || s === 'cblock' || (s === 'attack' && this.move.crouch) || (s === 'dash' && this.dash.pose === 'slide')) b = [-10, -38, 20, 38];
    else if (this.air || s === 'fall') b = [-10, -56, 20, 46];
    else b = [-9, -62, 18, 62];
    return [this.x + b[0], this.y + b[1], b[2], b[3]];
  }
  attackBox() {
    let m = null;
    if (this.st === 'attack') { const mv = this.move; if (this.mt >= mv.st && this.mt < mv.st + mv.act && !this.hitDone) m = mv; }
    else if (this.st === 'dash' && !this.hitDone && this.dashActive()) m = this.dash;
    else if (this.st === 'unique' && !this.hitDone && this.uBox) m = Object.assign({ box: this.uBox }, this.uHit);
    if (!m) return null;
    const b = m.box, y0 = this.y + b[1];
    const x0 = this.facing === 1 ? this.x + b[0] : this.x - b[0] - b[2];
    return { box: [x0, y0, b[2], b[3]], m };
  }
  receive(h, dir) {
    if (this.invul > 0 && !h.fatal) return 'miss';
    if (this.tryCounter && this.tryCounter(h)) return 'miss';
    let blocking = (this.st === 'block' || this.st === 'cblock' || this.st === 'bstun') && !h.throw && !this.air && Math.sign(this.opp.x - this.x) === this.facing;
    if (blocking && h.overhead && (this.st === 'cblock' || (this.st === 'bstun' && this.lastBlockCrouch))) blocking = false;
    if (blocking && h.low && (this.st === 'block' || (this.st === 'bstun' && !this.lastBlockCrouch))) blocking = false;
    // блок снижает урон на 30%; если блокируемый удар добивает — проходит как обычный
    const bd = Math.max(1, Math.round(h.dmg * 0.7));
    if (blocking && this.hp - bd > 0) {
      this.setSt('bstun'); this.stun = h.bs || 12; this.vx = dir * Math.max(1.5, (h.kb || 2) * 0.9);
      this.hp -= bd; this.roundDmg += bd; this.taken += bd;
      if (this.g.dmgPop) this.g.dmgPop(this, bd, true);
      this.sup = Math.min(100, this.sup + bd * 0.8 / 1.3); this.opp.sup = Math.min(100, this.opp.sup + bd * 0.6 / 1.3);
      return 'block';
    }
    const bot = this.g.ai && this.g.ai[this.opp.idx];
    let dmg = h.dmg * (bot && bot.dmgK ? bot.dmgK : 1);
    // удары подряд в одной серии: каждый следующий слабее на 15%
    const cn = this.opp.combo || 0; if (cn > 0) dmg *= Math.pow(0.85, cn);
    const airborne = this.air || this.st === 'fall';
    if (airborne) { this.juggle++; dmg *= Math.pow(0.72, this.juggle); }
    dmg = Math.max(1, Math.round(dmg));
    this.sup = Math.min(100, this.sup + dmg * 1.1 / 1.3); this.opp.sup = Math.min(100, this.opp.sup + dmg * 1.7 / 1.3);
    this.hp = Math.max(0, this.hp - dmg); this.roundDmg += dmg; this.taken += dmg; this.flash = 4;
    if (this.g.dmgPop) this.g.dmgPop(this, dmg, false);
    this.frozen = 0; this.tint = null; this.alpha = 1; this.visFlip = false; this.jet = false;
    if (h.freeze && this.hp > 0 && !airborne) { this.frozen = h.freeze; this.tint = 'ice'; this.setSt('frozen'); this.vx = 0; Sound.play('freeze'); return 'hit'; }
    if (h.launch || airborne) { this.setSt('fall'); this.vy = h.launch ? h.launch[0] : -3.6; this.vx = dir * (h.launch ? h.launch[1] : 2); this.y = Math.min(this.y, GROUND - 1); }
    else if (h.kd || h.trip || this.hp <= 0) { this.setSt('fall'); this.vy = h.trip ? -2.6 : -4.4; this.vx = dir * (h.kb || 3) * 0.8; this.y = GROUND - 1; }
    else { this.setSt('hit'); this.stun = h.hs || 16; this.vx = dir * (h.kb || 2); this.hitLow = !!h.low; }
    return 'hit';
  }
  // ---------- позы ----------
  computePose(ctl) {
    const ch = this.ch, t = this.t; let p, snap = false;
    if (this.forcePose) { p = typeof this.forcePose === 'function' ? this.forcePose(this) : this.forcePose; snap = true; }
    else switch (this.st) {
      case 'idle': p = ANIM.idle(ch, this.anim); break;
      case 'walk': p = ANIM.walk(ch, this.anim * this.walkDir); break;
      case 'crouch': p = ANIM.crouch(ch); break;
      case 'block': p = mkPose(POSES.block); break;
      case 'cblock': p = mkPose(POSES.cblock); break;
      case 'bstun': p = mkPose(this.lastBlockCrouch ? POSES.cblock : POSES.block, { hx: -2 }); break;
      case 'jsquat': case 'land': p = mkPose(POSES.land); break;
      case 'jump': {
        const rel = this.jdir * this.facing;
        if (rel !== 0) { p = mkPose(POSES.tuck, { rot: rel * Math.min(360, this.t * 10) }); if (this.t > 34) p = blendPose(p, mkPose(POSES.jump), Math.min(1, (this.t - 34) / 5)); }
        else p = mkPose(POSES.jump, { fF: [6, -13 + Math.min(4, this.t * 0.2)] });
        snap = true; break;
      }
      case 'attack': {
        const m = this.move, mt = this.mt; let ph, k;
        if (mt < m.st) { ph = 0; k = mt / m.st; } else if (mt < m.st + m.act) { ph = 1; k = 0; } else { ph = 2; k = (mt - m.st - m.act) / m.rec; }
        p = movePose(ch, this.moveName, k, ph); if (ph < 2) snap = true; break;
      }
      case 'special': {
        const k = this.mt, wind = mkPose(stanceOf(ch), MOVE_POSES.proj.wind), th = mkPose(POSES.thrust, ch.weapon ? { wa: 0 } : {});
        p = k < 10 ? blendPose(stanceOf(ch), wind, ease(k / 10)) : k < 20 ? th : blendPose(th, stanceOf(ch), ease((k - 20) / 10));
        snap = k >= 9 && k < 13; break;
      }
      case 'dash': p = this.dashPose(); snap = true; break;
      case 'unique': p = this.uniquePose(); snap = this.mt < 3; break;
      case 'hit': p = mkPose(this.hitLow ? POSES.hitLow : POSES.hit); if (t < 2) snap = true; break;
      case 'fall': p = mkPose(POSES.fall, { rot: -clamp(this.t * 5, 0, 80) }); snap = true; break;
      case 'down': case 'dead': p = mkPose(POSES.lie); snap = true; break;
      case 'getup': p = blendPose(mkPose(POSES.lie), ANIM.crouch(ch), ease(t / 20)); snap = true; break;
      case 'thrown': p = mkPose(POSES.fall, { rot: -t * 12 }); snap = true; break;
      case 'throwing': p = t < 8 ? mkPose(stanceOf(ch), MOVE_POSES.throw.wind) : t < 18 ? mkPose(stanceOf(ch), MOVE_POSES.throw.hit) : blendPose(mkPose(stanceOf(ch), MOVE_POSES.throw.hit), stanceOf(ch), (t - 18) / 6); break;
      case 'dizzy': p = ANIM.dizzy(ch, this.anim); break;
      case 'victory': p = ANIM.victory(ch, this.t); break;
      case 'frozen': p = this.pose; snap = true; break;
      default: p = ANIM.idle(ch, this.anim);
    }
    this.pose = snap ? p : blendPose(this.pose, p, 0.42);
  }
  dashPose() {
    const d = this.dash, m = this.mt, ch = this.ch;
    if (d.kind === 'tele') return m < 16 ? stanceOf(ch) : d.kick ? movePose(ch, 'kick', 0, 1) : mkPose(POSES.thrust);
    if (d.kind === 'rush') {
      if (m >= d.dur) return blendPose(mkPose(POSES[d.pose === 'spin' ? 'spinA' : d.pose]), stanceOf(ch), (m - d.dur) / 12);
      return mkPose(POSES[d.pose === 'spin' ? 'spinA' : d.pose]);
    }
    if (d.kind === 'leap') return this.air ? (this.vy < 0 ? mkPose(POSES.leapUp) : blendPose(mkPose(POSES.leapUp), mkPose(POSES.smash), clamp(this.vy / 4, 0, 1))) : mkPose(POSES.smash);
    if (d.kind === 'dive') return !this.air && m > 16 ? mkPose(POSES.land) : m < 16 ? mkPose(POSES.tuck) : mkPose(POSES.dive);
    return stanceOf(ch);
  }
  draw(ctx, cx) {
    if (this.hidden || this.alpha <= 0.02) return;
    renderFighter(this.R, this.ch, this.pose, this);
    const fc = this.facing * (this.visFlip ? -1 : 1), dx = Math.round(this.x - cx), dy = Math.round(this.y + this.offY);
    ctx.globalAlpha = this.alpha;
    if (this.scaleY !== 1) {
      ctx.save(); ctx.translate(dx, dy); ctx.scale(fc * (2 - this.scaleY * 0.6 - 0.4), this.scaleY);
      ctx.drawImage(this.R.cv, -SPR_OX, -SPR_OY, SPR_W, SPR_H); ctx.restore();
    } else if (fc === 1) ctx.drawImage(this.R.cv, dx - SPR_OX, dy - SPR_OY, SPR_W, SPR_H);
    else { ctx.save(); ctx.translate(dx, 0); ctx.scale(-1, 1); ctx.drawImage(this.R.cv, -SPR_OX, dy - SPR_OY, SPR_W, SPR_H); ctx.restore(); }
    ctx.globalAlpha = 1;
  }
}
