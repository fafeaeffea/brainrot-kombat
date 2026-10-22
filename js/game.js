'use strict';
const FAT_PRE = 72, OUT_K = 2, SK = 2; // SK — масштаб сцены: спрайты бойцов рисуются в двойном разрешении
// Игровой цикл, раунды, камера, HUD, победа
const Game = {
  f: [null, null], ai: [null, null], inp: [null, null], projs: [], ghosts: [],
  state: 'demo', phase: 'none', pt: 0, frame: 0, camX: (STAGE_W - W) / 2, zoom: 1, zx: W / 2, zy: H / 2,
  shakeAmp: 0, flashA: 0, dim: 0, dimT: 0, hitstop: 0, slow: 0, wins: [0, 0], round: 1, timer: 99, tsub: 0,
  ann: null, cabK: 1, zones: [], cine: 0, punch: 0, impactT: 0, impactCd: 0, redA: 0, splats: [], banner: null, combos: [null, null], stageState: {}, paused: false, adPause: false, cfg: null, fat: null, finisher: null, loser: null, winner: null, result: null,
  init() {
    this.cv = document.getElementById('game'); this.cv.width = W * OUT_K; this.cv.height = H * OUT_K; this.ctx = this.cv.getContext('2d'); this.ctx.imageSmoothingEnabled = false;
    [this.scene, this.sctx] = mkCanvas(W * SK, H * SK);
    this.inp[0] = new PlayerInput([KEYMAP1], 0, true);
    this.inp[1] = new PlayerInput([KEYMAP2], 1, false);
    this.last = performance.now(); this.acc = 0;
    requestAnimationFrame(t => this.loop(t));
  },
  // ---------- запуск ----------
  startMatch(cfg) {
    this.cfg = cfg;
    this.stageIdx = cfg.stage != null ? cfg.stage : randi(0, STAGES.length - 1); Stage.set(this.stageIdx);
    this.f = [new Fighter(cfg.p1, 0, this), new Fighter(cfg.p2, 1, this)];
    this.ai = [cfg.ai1 ? new AI(this.f[0], cfg.ai1) : null, cfg.ai2 ? new AI(this.f[1], cfg.ai2) : null];
    this.inp[0].maps = cfg.mode === '2p' ? [KEYMAP1] : [KEYMAP1, KEYMAP2];
    this.inp[0].pad = 0; this.inp[1].pad = 1;
    this.wins = [0, 0]; this.round = 1; this.result = null; this.paused = false;
    Sound.setQuiet(cfg.mode === 'demo');
    if (cfg.mode === 'demo') { this.state = 'match'; this.startRound(); }
    else {
      // экран «против»: бой начнётся, только когда диктор договорит оба имени
      this.state = 'vs'; this.vsT = 0; this.vsDone = false; Sound.play('gong'); Sound.music('fight', this.stageIdx); Sound.ambient(this.stageIdx);
      Sound.say(cfg.p1.name + '! против! ' + cfg.p2.name + '!', 'big', () => { this.vsDone = true; });
    }
  },
  startRound() {
    this.state = 'match';
    this.f[0].reset(STAGE_W / 2 - 62, 1); this.f[1].reset(STAGE_W / 2 + 62, -1);
    this.camX = (STAGE_W - W) / 2; this.zoom = 1; this.projs = []; this.ghosts = []; FX.clear(); this.stageState = {}; this.zones = []; this.splats = []; this.cine = 0; this.banner = null; this.impactT = 0; this.pops = [];
    this.timer = Settings.time || 0; this.tsub = 0; this.phase = 'intro'; this.pt = 0; this.ann = null; this.fat = null; this.dim = 0; this.dimT = 0;
    this.finisher = this.loser = this.winner = null; this.supS = null; this.combos = [null, null]; this.inp.forEach(i => i.clear());
    if (this.cfg.mode !== 'demo') Sound.music('fight', this.stageIdx);
  },
  get demo() { return this.cfg && this.cfg.mode === 'demo'; },
  announce(lines, dur = 70) { this.ann = { lines, t: 0, dur }; },
  shake(a) { this.shakeAmp = Math.max(this.shakeAmp, a); if (a >= 9 && this.phase === 'fatality' && this.fat && this.fat.pre >= FAT_PRE) this.impact(); },
  // кадр удара в фаталити: стоп-кадр, двухцветная вспышка, кровь на «объективе»
  impact() {
    if (this.impactCd > 0) return;
    this.impactT = 6; this.impactCd = 14; this.hitstop = Math.max(this.hitstop, 7); this.punch = 0.14; this.redA = 0.35;
    Sound.sting('impact');
    if (Settings.blood && this.splats.length < 4) for (let i = 0, n = randi(1, 2); i < n; i++) this.splats.push({ x: rand(20, W - 20), y: rand(10, H * 0.6), r: rand(5, 13), life: 300, t: 0, dots: Array.from({ length: randi(8, 16) }, () => { const a = rand(0, 6.283), d = rand(0.6, 2.4); return [Math.cos(a) * d, Math.sin(a) * d * 0.8, rand(0.5, 2.5)]; }), drips: Array.from({ length: randi(1, 3) }, () => ({ dx: rand(-0.6, 0.6), len: 0, sp: rand(0.15, 0.5) })) });
  },
  other(f) { return this.f[1 - f.idx]; },
  projOf(f) { return this.projs.some(p => p.owner === f && !p.dead); },
  projThreat(f) { return this.projs.some(p => p.owner !== f && !p.dead && Math.sign(f.x - p.x) === Math.sign(p.vx) && Math.abs(f.x - p.x) < 140); },
  spawnProj(f, type) { this.projs.push(new Proj(f, type)); Sound.play(PROJ[type].snd); },
  ghostTrail(f, x) { this.ghosts.push({ img: snapCanvas(f), x: x != null ? x : f.x, y: f.y, fc: f.facing, life: 14, col: f.ch.pal.fx }); },
  // ---------- цикл ----------
  loop(ts) {
    requestAnimationFrame(t => this.loop(t));
    this.acc += Math.min(100, ts - this.last); this.last = ts;
    let n = 0;
    while (this.acc >= 1000 / 60 && n < 4) { this.step(); this.acc -= 1000 / 60; n++; }
    if (n === 4) this.acc = 0;
    this.render();
  },
  step() {
    Input.pollPads();
    const q = Input.takeMenu(), raw = Input.takeRaw();
    if (UI.active()) UI.handle(q, raw);
    else for (const m of q) this.gameKey(m);
    UI.tick();
    if (this.paused || this.adPause) return;
    this.update();
  },
  gameKey(m) {
    if (this.state === 'match' && !this.demo) {
      if (m === 'back' || m === 'pause') { if (this.phase !== 'victory') this.pause(true); }
      if ((m === 'ok' || m === 'ok2') && this.phase === 'victory' && this.pt > 150) this.endMatch();
    }
  },
  pause(on) {
    if (this.demo || this.state !== 'match') return;
    this.paused = on; if (on) { UI.show('pause'); YA.gameStop(); Sound.mute('pause', true); } else { YA.gameStart(); Sound.mute('pause', false); }
  },
  ctlFor(i) {
    const f = this.f[i], ph = this.phase;
    const live = ph === 'fight' || ph === 'finish' || ph === 'finishWait';
    if (!live) { if (!this.ai[i]) this.inp[i].poll(this.frame, f.facing); return null; }
    if (this.ai[i]) return this.ai[i].get(this);
    const c = this.inp[i].poll(this.frame, f.facing);
    // фаталити — только стрелками: срабатывает на последней стрелке последовательности
    if (ph === 'finish' && this.finisher === f) {
      const fa = f.ch.fatal, near = Math.abs(this.loser.x - f.x) <= 120;
      if (c.arrows) {
        const A = c.arrows; let k = 0;
        for (let n = Math.min(A.length, fa.seq.length); n > 0; n--) { let ok = true; for (let j = 0; j < n; j++) if (A[A.length - n + j] !== fa.seq[j]) { ok = false; break; } if (ok) { k = n; break; } }
        this.fatProg = k;
        if (k === fa.seq.length && near) { c.special = 'fatal'; this.inp[i].clear(); this.fatProg = 0; }
      }
      // вблизи стрелки не двигают бойца — можно спокойно набрать комбинацию
      if (near) c.l = c.r = c.u = c.d = 0;
      if (c.special) return c;
    }
    if (c.p || c.k) {
      if (c.p && seqMatch(c.seq, ['D', 'B'])) c.special = 'unique';
      else if (c.p && seqMatch(c.seq, ['B', 'F'])) c.special = 'proj';
      else if (c.k && seqMatch(c.seq, ['D', 'F'])) c.special = 'dash';
      if (c.special) { c.p = c.k = 0; this.inp[i].clear(); }
    }
    return c;
  },
  update() {
    this.frame++;
    if (this.flashA > 0) this.flashA = Math.max(0, this.flashA - 0.06);
    this.shakeAmp *= 0.85; if (this.shakeAmp < 0.3) this.shakeAmp = 0;
    this.dim = lerp(this.dim, this.dimT, 0.08);
    this.cine = lerp(this.cine, this.phase === 'fatality' ? 1 : 0, 0.1);
    if (this.impactT > 0) this.impactT--; if (this.impactCd > 0) this.impactCd--;
    if (this.redA > 0) this.redA = Math.max(0, this.redA - 0.03);
    for (const sp of this.splats) { sp.t++; for (const d of sp.drips) if (d.len < 70) d.len += d.sp; }
    this.splats = this.splats.filter(sp => sp.t < sp.life);
    if (this.banner) this.banner.t++;
    if (this.state === 'vs') { if (++this.vsT > 150 && (this.vsDone || this.vsT > 600)) { this.startRound(); } return; }
    if (this.state !== 'match') return;
    if (this.ann) this.ann.t++;
    if (this.hitstop > 0) { this.hitstop--; return; }
    if (this.slow > 0) { this.slow--; if (this.slow % 3 !== 0) { FX.update(); return; } }
    this.pt++;
    if (Stage.cur.amb) Stage.cur.amb(this, this.frame);
    const [a, b] = this.f;
    this.phaseLogic();
    if (this.phase === 'fatality') this.fatalityStep();
    else if (this.supS) { this.superStep(); for (const f of this.f) { if (f.flash > 0) f.flash--; f.anim++; f.computePose(); } }
    else {
      const c0 = this.ctlFor(0), c1 = this.ctlFor(1);
      a.update(c0); b.update(c1);
    }
    this.separate();
    for (const f of this.f) { f.x = clamp(f.x, 14, STAGE_W - 14); if (f.dhp > f.hp) f.dhp = Math.max(f.hp, f.dhp - 0.5); else f.dhp = f.hp; }
    if (this.phase !== 'fatality' && this.phase !== 'victory' && !this.supS) { this.melee(a, b); this.melee(b, a); }
    if (!this.supS) { for (const p of this.projs) p.update(this); this.zoneStep(); }
    this.projCollisions();
    this.projs = this.projs.filter(p => !p.dead);
    for (const gh of this.ghosts) gh.life--; this.ghosts = this.ghosts.filter(g => g.life > 0);
    FX.update();
    this.camera();
    for (const c of this.combos) if (c) c.t++;
    if (this.pops) { for (const p of this.pops) p.t++; this.pops = this.pops.filter(p => p.t < 70); }
  },
  camera() {
    const [a, b] = this.f;
    if (this.phase === 'victory' && this.winner) {
      const w = this.winner;
      this.zoom = lerp(this.zoom, 2.1, 0.05);
      this.zx = lerp(this.zx, w.x - this.camX, 0.08); this.zy = lerp(this.zy, w.y - 44, 0.08);
      return;
    }
    if (this.supS && this.supS.foc) {
      const S = this.supS;
      this.camX = lerp(this.camX, clamp(S.foc.x - W / 2, 0, STAGE_W - W), 0.15);
      if (S.snap) { this.zoom = S.z; this.zx = S.foc.x - this.camX; this.zy = S.foc.y; S.snap = false; }
      else { this.zoom = lerp(this.zoom, S.z, 0.12); this.zx = lerp(this.zx, S.foc.x - this.camX, 0.14); this.zy = lerp(this.zy, S.foc.y, 0.14); }
      return;
    }
    if (this.phase === 'fatality' && this.fat) {
      const F = this.fat, mid = (F.a.x + F.v.x) / 2, zt = F.pre < FAT_PRE ? lerp(1, 1.6, ease(F.pre / FAT_PRE)) : (F.sc.zoom || 1.38);
      this.camX = lerp(this.camX, clamp(mid - W / 2, 0, STAGE_W - W), 0.15);
      this.zoom = lerp(this.zoom, zt + this.punch, 0.12); this.punch *= 0.85;
      const fo = F.pre >= FAT_PRE && F.s.foc;
      if (fo) {
        if (F.s.snap) { this.zx = fo.x - this.camX; this.zy = fo.y; F.s.snap = false; }
        else { this.zx = lerp(this.zx, fo.x - this.camX, 0.14); this.zy = lerp(this.zy, fo.y, 0.14); }
      } else { this.zx = mid - this.camX; this.zy = GROUND - 56; }
      return;
    }
    // камера приближается к бойцам: чем ближе они друг к другу, тем крупнее
    const vis = [a, b].filter(f => !f.hidden && f.y > -40);
    const mid = vis.length ? vis.reduce((s, f) => s + f.x, 0) / vis.length : this.camX + W / 2;
    let zt = 1.2;
    if (vis.length) {
      const xs = vis.map(f => f.x), spread = Math.max(...xs) - Math.min(...xs), top = Math.min(...vis.map(f => f.y + (f.offY || 0))) - 98;
      zt = clamp(Math.min(W / (spread + 150), H / (GROUND + 22 - top)), 1.2, 1.75);
    }
    this.zoom = lerp(this.zoom, zt, 0.07);
    const tgt = clamp(mid - W / 2, 0, STAGE_W - W);
    this.camX = lerp(this.camX, tgt, 0.15);
    const vw = W / this.zoom, vh = H / this.zoom;
    this.zx = clamp(mid - this.camX, vw / 2, W - vw / 2); this.zy = clamp(GROUND + 22 - vh / 2, vh / 2, H - vh / 2);
    if (vis.length === 2 && this.phase !== 'fatality') { const lo = this.camX + this.zx - vw / 2 + 12, hi = this.camX + this.zx + vw / 2 - 12; for (const f of this.f) f.x = clamp(f.x, lo, hi); }
  },
  separate() {
    const [a, b] = this.f;
    if (a.hidden || b.hidden || a.st === 'thrown' || b.st === 'thrown' || this.phase === 'fatality') return;
    if ((a.st === 'dash' && a.dash.pass) || (b.st === 'dash' && b.dash.pass)) return;
    if (a.st === 'down' || b.st === 'down' || a.st === 'dead' || b.st === 'dead') return;
    if (Math.abs(a.y - b.y) > 44) return;
    const dx = b.x - a.x, minD = 21;
    if (Math.abs(dx) < minD) { const s = dx === 0 ? (a.facing === 1 ? 1 : -1) : Math.sign(dx), push = (minD - Math.abs(dx)) / 2; a.x -= s * push; b.x += s * push; }
  },
  zoneStep() {
    for (const z of this.zones) {
      z.t++;
      if (z.vx) z.x += z.vx;
      if (z.ring) z.w = 10 + z.t * 9;
      if (z.boom && z.t === z.on) { FX.explosion(z.x, GROUND - 8, 0.9); Sound.play('explode'); this.shake(4); }
      if (z.sfx && z.t === z.on && !z.boom) Sound.play(z.sfx);
      if (!z.hit || z.done || z.t < z.on || z.t >= z.off) continue;
      const v = this.other(z.owner), hb = v.hurtBox(); if (!hb) continue;
      if (z.ground && v.air) continue;
      const zx = z.x - z.w / 2, [x2, y2, w2, h2] = hb;
      if (zx > x2 + w2 || x2 > zx + z.w || z.y > y2 + h2 || y2 > z.y + z.h) continue;
      z.done = true;
      const dir = Math.sign(v.x - z.x) || z.owner.facing, res = v.receive(z.hit, dir);
      if (res === 'miss') continue;
      const hx = v.x, hy = v.y - 34;
      if (res === 'block') { Sound.play('block'); FX.spark(hx, hy, 6, '#cfe6ff'); this.hitstop = 4; continue; }
      const a = z.owner; a.combo++; this.combos[a.idx] = { n: a.combo, t: 0 };
      Sound.play(z.hit.snd || 'heavy'); FX.blood(hx, hy, dir, 12, 1.3); FX.spark(hx, hy, 6); FX.hitFlash(hx, hy, true); this.hitstop = 7; this.shake(4);
      this.afterHit(a, v, z.hit);
    }
    this.zones = this.zones.filter(z => z.t < z.life);
  },
  melee(a, b) {
    const ab = a.attackBox(); if (!ab) return;
    const hb = b.hurtBox(); if (!hb) return;
    const [x1, y1, w1, h1] = ab.box, [x2, y2, w2, h2] = hb;
    if (x1 > x2 + w2 || x2 > x1 + w1 || y1 > y2 + h2 || y2 > y1 + h1) return;
    const m = ab.m;
    a.hitDone = true; a.lastHitMt = a.mt;
    if (m.throw) {
      if (!b.canBeThrown()) return;
      a.setSt('throwing'); b.setSt('thrown'); b.thrower = a; Sound.play('grab'); return;
    }
    const isSpecial = a.st === 'dash' || a.st === 'unique';
    const h = Object.assign({}, m, { chip: isSpecial });
    const res = b.receive(h, a.facing);
    if (res === 'miss') return;
    const hx = (Math.max(x1, x2) + Math.min(x1 + w1, x2 + w2)) / 2, hy = (Math.max(y1, y2) + Math.min(y1 + h1, y2 + h2)) / 2;
    if (res === 'block') { Sound.play('block'); FX.spark(hx, hy, 6, '#cfe6ff'); FX.hitFlash(hx, hy, false); this.hitstop = 4; if (b.lastBlockCrouch !== undefined) { } return; }
    if ((a.st === 'dash' && a.dash.multi) || a.st === 'unique') a.hits = (a.hits || 0) + 1;
    a.combo++; this.combos[a.idx] = { n: a.combo, t: 0 };
    Sound.play(m.heavy || m.kd || m.launch ? 'heavy' : (m.snd || 'hit'));
    FX.blood(hx, hy, a.facing, m.heavy || m.kd ? 14 : 7, m.heavy ? 1.4 : 1); FX.spark(hx, hy, 6); FX.hitFlash(hx, hy, m.heavy);
    this.hitstop = m.heavy || m.kd || m.launch ? 8 : 5; if (m.heavy || m.kd) this.shake(4);
    this.afterHit(a, b, m);
  },
  projCollisions() {
    const ps = this.projs;
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
      const p = ps[i], q = ps[j]; if (p.dead || q.dead || p.owner === q.owner) continue;
      const [x1, y1, w1, h1] = p.box(), [x2, y2, w2, h2] = q.box();
      if (x1 < x2 + w2 && x2 < x1 + w1 && y1 < y2 + h2 && y2 < y1 + h1) { p.dead = q.dead = true; FX.explosion((p.x + q.x) / 2, (p.y + q.y) / 2, 0.6); Sound.play('explode'); }
    }
    for (const p of ps) {
      if (p.dead) continue;
      const v = p.owner.opp, hb = v.hurtBox(); if (!hb) continue;
      const [x1, y1, w1, h1] = p.box(), [x2, y2, w2, h2] = hb;
      if (x1 < x2 + w2 && x2 < x1 + w1 && y1 < y2 + h2 && y2 < y1 + h1) { if (p.s.explode) p.explode(this); else this.projHit(p, v); }
    }
  },
  projHit(p, v, fromExplosion) {
    p.dead = true;
    const h = Object.assign({}, p.s, { chip: true, bs: 14 });
    const dir = Math.sign(p.vx) || p.dir;
    const res = v.receive(h, dir);
    if (res === 'miss') return;
    if (!fromExplosion) FX.hitFlash(p.x, p.y, true);
    if (res === 'block') { Sound.play('block'); FX.spark(p.x, p.y, 8, '#cfe6ff'); return; }
    const a = p.owner; a.combo++; this.combos[a.idx] = { n: a.combo, t: 0 };
    Sound.play('heavy'); FX.blood(p.x, p.y, dir, 10); this.hitstop = 6; this.shake(3);
    if (p.type === 'fire') FX.fire(v.x, v.y - 30, 16, 8, 1.5);
    if (p.type === 'coffee') for (let i = 0; i < 12; i++) FX.p('px', p.x, p.y, rand(-2, 2), rand(-3, 0), 40, choice(['#7a4a2a', '#e7cfa6']), 1, 0.2);
    this.afterHit(a, v, h);
  },
  afterHit(a, b, m) {
    if (b.hp > 0) return;
    if (this.phase === 'fight') this.ko(b, a);
    else if ((this.phase === 'finish' || this.phase === 'finishWait') && b === this.loser) {
      b.finishMe = false; b.dead = true; if (b.st !== 'fall') { b.setSt('fall'); b.vy = -4; b.vx = a.facing * 2; b.y = GROUND - 1; }
      this.phase = 'finished'; this.pt = 0; this.slow = 30; Sound.play('heavy');
    }
  },
  ko(loser, winner) {
    this.loser = loser; this.winner = winner;
    this.wins[winner.idx]++;
    if (this.wins[winner.idx] >= 2) {
      loser.finishMe = true; loser.dead = false; this.finisher = winner;
      this.phase = 'finishWait'; this.pt = 0; this.slow = 45;
      if (loser.st !== 'fall') { loser.setSt('hit'); loser.stun = 30; }
    } else {
      loser.dead = true; if (loser.st !== 'fall') { loser.setSt('fall'); loser.vy = -3; loser.vx = winner.facing * 2; loser.y = GROUND - 1; }
      this.phase = 'ko'; this.pt = 0; this.slow = 45;
    }
    YA.gameStop();
  },
  tryFatality(f) {
    if (this.phase !== 'finish' || f !== this.finisher) return false;
    const v = this.loser; if (Math.abs(v.x - f.x) > 120 || v.st !== 'dizzy') return false;
    this.startFatality(f, v); return true;
  },
  startFatality(a, v) {
    const sc = FATALITIES[a.ch.fatal.type];
    const dir = Math.sign(v.x - a.x) || 1;
    a.x = clamp(v.x - dir * 44, 20, STAGE_W - 20); a.facing = dir; v.facing = -dir;
    a.setSt('script'); v.setSt('script');
    a.forcePose = null; v.forcePose = f => ANIM.dizzy(f.ch, f.anim);
    this.projs = []; this.zones = [];
    this.fat = { sc, t: 0, a, v, s: {}, pre: 0 };
    this.phase = 'fatality'; this.pt = 0; this.dimT = 0.62; this.ann = null;
    Sound.stopMusic(); Sound.play('fatal'); Sound.sting('big'); this.redA = 0.5;
    Store.set('fatalities', Store.get('fatalities', 0) + (this.demo ? 0 : 1));
  },
  fatalityStep() {
    const F = this.fat;
    if (F.pre < FAT_PRE) {
      const p = ++F.pre, a = F.a, col = a.ch.pal.fx;
      for (const f of this.f) { f.t++; f.anim++; f.computePose(); }
      if (p % 34 === 1) Sound.sting('heart');
      if (p === 14) { a.forcePose = mkPose(POSES.raise); this.banner = { t: 0, name: a.ch.name, fat: a.ch.fatal.name, col }; Sound.play('whooshH'); }
      if (p > 14) for (let i = 0; i < 3; i++) FX.p('px', a.x + rand(-16, 16), a.y - rand(0, 70), rand(-0.2, 0.2), -rand(0.6, 1.8), randi(18, 34), choice([col, col, '#ffffff', '#ffd040']), 1, -0.01, { floor: false, fade: true });
      if (p === 58) { this.boltT = 8; this.boltX = a.x; this.boltY = a.y - 70; this.flashA = 0.5; this.shakeAmp = 8; Sound.play('thunder'); FX.ring(a.x, a.y - 40, col, 44, 22); FX.ring(a.x, a.y - 40, '#ffffff', 28, 14); FX.dust(a.x, GROUND, 14); }
      if (p === FAT_PRE) a.forcePose = null;
      return;
    }
    F.t++;
    F.sc.update(this, F.a, F.v, F.t, F.s);
    for (const f of this.f) { f.t++; f.anim++; if (f.flash > 0) f.flash--; f.computePose(); }
    if (F.t === F.sc.dur - 30) { this.announce([{ txt: 'ФАТАЛИТИ', s: 5, col: ['#ff6a5a', '#c0101a', '#5a0008'], slam: true }, { txt: F.a.ch.fatal.name, s: 1, col: '#ffd0c0' }], 120); Sound.play('gong'); Sound.say('Фаталити!', 'big'); this.redA = 0.6; this.impactCd = 0; this.shake(10); F.drip = true; }
    if (F.drip && F.t % 2 === 0 && Settings.blood) FX.p('blood', this.camX + W / 2 + rand(-90, 90), 120, 0, rand(0.2, 1), 90, choice(BLOOD_COLS), 1, 0.08);
    if (F.t >= F.sc.dur + 60) { this.dimT = 0.25; this.startVictory(F.a, true); }
  },
  phaseLogic() {
    const ph = this.phase, t = this.pt, [a, b] = this.f;
    if (ph === 'intro') {
      if (t === 12) { this.announce([{ txt: 'РАУНД ' + this.round, s: 4, col: ['#fff3a0', '#ffb030', '#c05010'] }], 55); Sound.play('round'); if (!this.demo) Sound.say('Раунд ' + ['один', 'два', 'три', 'четыре', 'пять'][Math.min(4, this.round - 1)] + '!', 'name'); }
      if (t === 72) { this.announce([{ txt: 'БОЙ!', s: 6, col: ['#ffffff', '#ffd040', '#e02010'] }], 45); Sound.play('gong'); if (!this.demo) Sound.say('Бой!', 'impact'); }
      if (t >= 80) { this.phase = 'fight'; this.pt = 0; if (!this.demo) YA.gameStart(); }
    } else if (ph === 'fight') {
      if (this.timer > 0 && !this.supS && ++this.tsub >= 60) { this.tsub = 0; this.timer--; if (this.timer === 0) this.timeUp(); }
    } else if (ph === 'ko') {
      if (this.loser.st === 'dead' && !this.koT) this.koT = t;
      if (t === 40) { const w = this.winner; this.announce([{ txt: w.ch.name, s: 3, col: ['#fff3a0', '#ffb030'] }, { txt: 'ПОБЕЖДАЕТ', s: 2, col: '#ffffff' }].concat(w.roundDmg === 0 ? [{ txt: 'БЕЗУПРЕЧНАЯ ПОБЕДА', s: 2, col: ['#a0f0ff', '#3a8ad8'] }] : []), 110); if (!this.demo) Sound.say(w.ch.name + '... побеждает!', 'name'); }
      if (t > 60 && this.winner.canAct()) { this.winner.setSt('victory'); }
      if (t >= 170) { this.round++; this.startRound(); }
    } else if (ph === 'drawWait') {
      if (t >= 120) { this.round++; this.startRound(); }
    } else if (ph === 'finishWait') {
      if (this.loser.st === 'dizzy') { this.phase = 'finish'; this.pt = 0; this.finishT = 12 * 60; this.fatProg = 0; const her = this.loser.ch.g === 'f'; this.announce([{ txt: her ? 'ДОБЕЙ ЕЁ!' : 'ДОБЕЙ ЕГО!', s: 4, col: ['#ffd0c0', '#e02010', '#7a0008'] }], 80); Sound.play('fatal'); if (!this.demo) Sound.say(her ? 'Добей её!' : 'Добей его!', 'big'); }
    } else if (ph === 'finish') {
      if (--this.finishT <= 0) { const l = this.loser; l.finishMe = false; l.dead = true; l.setSt('fall'); l.vy = -1; l.vx = 0; l.y = GROUND - 1; this.phase = 'finished'; this.pt = 0; }
    } else if (ph === 'finished') {
      if (this.loser.st === 'dead' && t > 40) this.startVictory(this.finisher, false);
    } else if (ph === 'victory') {
      this.victoryFx();
      if (this.demo && t > 260) this.demoNext();
      if (!this.demo && t === 230) UI.showResult();
    }
  },
  timeUp() {
    const [a, b] = this.f;
    Sound.play('gong'); this.projs = [];
    if (a.hp === b.hp) {
      this.announce([{ txt: 'НИЧЬЯ', s: 4, col: ['#ffffff', '#a0a0a0'] }], 100);
      this.phase = 'drawWait'; this.pt = 0; YA.gameStop();
      return;
    }
    const loser = a.hp < b.hp ? a : b, winner = this.other(loser);
    this.announce([{ txt: 'ВРЕМЯ ВЫШЛО', s: 3, col: ['#fff3a0', '#ffb030'] }], 60);
    this.loser = loser; this.winner = winner; this.wins[winner.idx]++;
    if (this.wins[winner.idx] >= 2) { loser.finishMe = true; loser.setSt('dizzy'); this.finisher = winner; this.phase = 'finishWait'; this.pt = 0; }
    else { loser.dead = true; loser.setSt('fall'); loser.vy = -1; loser.y = GROUND - 1; this.phase = 'ko'; this.pt = 0; }
  },
  startVictory(w, fatal) {
    this.phase = 'victory'; this.pt = 0; this.winner = w; this.fat = null; this.banner = null;
    w.forcePose = null; w.hidden = false; w.alpha = 1; w.y = GROUND; w.setSt('victory'); w.jet = false;
    this.loser.forcePose = this.loser.hidden ? null : f => mkPose(POSES.lie);
    const flawless = w.hp >= 100;
    this.vic = { fatal, flawless };
    Sound.play('win'); setTimeout(() => this.phase === 'victory' && Sound.music('win'), 900);
    if (!this.demo) Sound.say(w.ch.name + '... побеждает!', 'big');
    const humanWon = this.cfg.mode === '2p' ? true : !this.ai[w.idx];
    this.result = { winner: w, winnerIdx: w.idx, fatal, flawless, humanWon };
    if (!this.demo) { Store.set('wins', Store.get('wins', 0) + (humanWon && this.cfg.mode !== '2p' ? 1 : 0)); YA.gameStop(); }
  },
  endMatch() { if (this.result && !this.result.shown) UI.showResult(); },
  victoryFx() {
    const w = this.winner, t = this.pt, x = w.x, y = w.y;
    if (t === 10 || t === 60) { for (let i = 0; i < 50; i++) FX.p('px', x + rand(-10, 10), y - 60, rand(-3, 3), rand(-5, -1), randi(80, 140), choice(['#ffd040', '#fff3a0', '#ff6a3a', '#ffffff', w.ch.pal.fx]), 1, 0.08, { floor: true, drag: 0.98 }); }
        if (t % 40 === 0 && t > 30) { const fx = this.camX + rand(40, W - 40), fy = rand(20, 90), col = choice(['#ffd040', '#ff4a8a', '#4ae0ff', '#7dff6a', w.ch.pal.fx]); FX.ring(fx, fy, col, 24, 26); for (let i = 0; i < 30; i++) { const a2 = rand(0, 6.28), s = rand(0.5, 2.2); FX.p('px', fx, fy, Math.cos(a2) * s, Math.sin(a2) * s, randi(40, 70), col, 1, 0.03, { floor: false, drag: 0.97, fade: true }); } }
    switch (w.ch.win) {
      case 'fist': if (t % 2 === 0) FX.fire(x + rand(-22, 22), y - rand(0, 10), 2, 3, 2); break;
      case 'bow': if (t % 2 === 0) { const a2 = t * 0.1; FX.p('px', x + Math.cos(a2) * 24, y - 30 + Math.sin(a2) * 30, 0, -0.3, 40, choice(['#ffffff', '#9fe6ff']), 1, 0); } break;
      case 'salute': if (t % 5 === 0) FX.p('px', x + rand(-30, 30), y, 0, -rand(0.5, 1.5), 60, '#7dff6a', 1, 0); break;
      case 'sword': if (t % 4 === 0) FX.p('px', this.camX + rand(0, W), -2, rand(-0.5, 0), rand(0.4, 0.8), 300, choice(['#ff3a5a', '#ff9ab0']), 1, 0); if (t % 30 === 0) FX.spark(x + w.facing * 4, y - 90, 8, '#ffffff'); break;
      case 'roar': if (t === 30 || t === 90 || t === 150) { this.boltT = 8; this.boltX = x + w.facing * 8; this.boltY = y - 86; this.flashA = 0.6; Sound.play('thunder'); this.shake(6); } break;
      case 'dance': if (t % 30 === 0) FX.text(x + rand(-20, 20), y - 90, choice(['ТРАЛАЛА!', 'ТРАЛАЛЕРО!', 'ПОРКО ДИО!']), 1, ['#ffffff', '#4fc3ff'], 50); if (t % 3 === 0) FX.p('px', x + rand(-20, 20), y, rand(-1, 1), -rand(1, 3), 40, choice(['#4fc3ff', '#ffffff']), 1, 0.1); break;
      case 'fly': if (t % 35 === 10) { FX.explosion(this.camX + rand(20, W - 20), GROUND - rand(0, 10), 0.8); Sound.play('explode'); } if (t === 40) FX.text(x, y - 100, 'БОМБАРДИРО!', 2, ['#ffffff', '#ffb84a'], 70); break;
      case 'drum': if (t % 24 === 15) { FX.text(x + w.facing * 22, y - 70, 'ТУН!', 2, ['#fff6b0', '#ff9a1a'], 30); Sound.play('tun'); this.shake(2); FX.dust(x + w.facing * 22, GROUND, 6); } break;
      case 'spin': if (t % 3 === 0) FX.p('px', x + rand(-30, 30), y - rand(10, 70), rand(-1, 1), -rand(0.2, 1), 50, choice(['#ff6aa0', '#ffc2db', '#7a4a2a', '#ffffff']), 2, 0.02); break;
    }
  },
  demoNext() {
    const a = choice(CHARS); let b = choice(CHARS); while (b === a) b = choice(CHARS);
    this.startMatch({ mode: 'demo', p1: a, p2: b, ai1: 3, ai2: 3 });
  },
  startDemo() { Sound.music('menu'); Sound.ambient(null); this.demoNext(); },
  // ---------- отрисовка ----------
  render() {
    this.render0();
    const tgt = typeof UI !== 'undefined' && UI.cur === 'menu' && !UI.zooming ? 1 : 0;
    this.cabK += (tgt - this.cabK) * 0.14; if (Math.abs(tgt - this.cabK) < 0.002) this.cabK = tgt;
    if (this.cabK > 0.002) Cabinet.compose(this);
  },
  render0() {
    const c = this.sctx, ctx = this.ctx;
    c.setTransform(SK, 0, 0, SK, 0, 0); c.imageSmoothingEnabled = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    const OW = W * OUT_K, OH = H * OUT_K;
    if (this.state === 'vs') { this.drawVS(c); ctx.drawImage(this.scene, 0, 0, OW, OH); return; }
    if (!this.f[0]) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); ctx.drawImage(this.scene, 0, 0, OW, OH); return; }
    const cx = Math.round(this.camX), sx = this.shakeAmp ? Math.round(rand(-1, 1) * this.shakeAmp) : 0, sy = this.shakeAmp ? Math.round(rand(-1, 1) * this.shakeAmp) : 0;
    c.save(); c.translate(sx, sy);
    Stage.drawBg(c, cx, this.frame, this);
    if (this.dim > 0.01) { c.fillStyle = `rgba(6,0,10,${this.dim})`; c.fillRect(-10, -10, W + 20, H + 20); }
    if (this.cine > 0.02) { c.fillStyle = `rgba(110,0,12,${0.38 * this.cine})`; c.fillRect(-10, -10, W + 20, H + 20); }
    FX.drawDecals(c, cx);
    for (const f of this.f) if (!f.hidden && f.alpha > 0.1) { const hgt = GROUND - f.y, w = Math.max(6, 22 - hgt * 0.1); c.globalAlpha = 0.35; c.fillStyle = '#000'; c.fillRect(Math.round(f.x - cx - w / 2), GROUND - 1, Math.round(w), 3); c.fillRect(Math.round(f.x - cx - w / 2 + 2), GROUND - 2, Math.round(w - 4), 5); c.globalAlpha = 1; }
    if (this.phase === 'victory' && this.winner) this.drawRays(c, cx);
    if (this.boltT > 0) { this.boltT--; this.boltY = null; }
    if (this.fat && this.fat.sc.back) this.fat.sc.back(c, cx, this, this.fat.a, this.fat.v, this.fat.t, this.fat.s);
    for (const gh of this.ghosts) { c.globalAlpha = gh.life / 14 * 0.5; c.save(); c.translate(Math.round(gh.x - cx), 0); c.scale(gh.fc, 1); c.drawImage(gh.img, -SPR_OX, Math.round(gh.y) - SPR_OY, SPR_W, SPR_H); c.restore(); }
    c.globalAlpha = 1;
    const order = this.f.slice().sort((p, q) => (p.st === 'attack' || p.st === 'dash' || p.st === 'script' && this.fat && this.fat.a === p ? 1 : 0) - (q.st === 'attack' || q.st === 'dash' || q.st === 'script' && this.fat && this.fat.a === q ? 1 : 0));
    for (const f of order) f.draw(c, cx);
    for (const p of this.projs) p.draw(c, cx);
    for (const z of this.zones) if (z.draw) z.draw(c, cx, z);
    FX.draw(c, cx);
    if (this.fat && this.fat.sc.front) this.fat.sc.front(c, cx, this, this.fat.a, this.fat.v, this.fat.t, this.fat.s);
    if (this.supS) drawSuperFx(c, cx, this);
    c.restore();
    if (this.flashA > 0) { c.globalAlpha = this.flashA; c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    // камера с приближением
    if (this.zoom > 1.01) {
      const z = this.zoom, vw = W / z, vh = H / z, x0 = clamp(this.zx - vw / 2, 0, W - vw), y0 = clamp(this.zy - vh / 2, 0, H - vh);
      ctx.drawImage(this.scene, x0 * SK, y0 * SK, vw * SK, vh * SK, 0, 0, OW, OH);
    } else ctx.drawImage(this.scene, 0, 0, OW, OH);
    ctx.setTransform(OUT_K, 0, 0, OUT_K, 0, 0);
    // мягкая виньетка: взгляд собирается на бойцах
    if (!this.vig) { const g = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.35, W / 2, H * 0.55, W * 0.62); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,10,0.42)'); this.vig = g; }
    ctx.fillStyle = this.vig; ctx.fillRect(0, 0, W, H);
    if (this.impactT > 0) this.drawImpact(ctx);
    if (this.redA > 0) { ctx.globalAlpha = this.redA; ctx.fillStyle = '#c00010'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    if (this.cine > 0.02) this.drawCine(ctx);
    if (this.splats.length) this.drawSplats(ctx);
    if (this.phase === 'fatality') { this.drawAnn(ctx); return; }
    if (!this.demo) this.drawHUD(ctx); else this.drawDemoHUD(ctx);
  },
  drawImpact(ctx) {
    const img = ctx.getImageData(0, 0, this.cv.width, this.cv.height), d = img.data, inv = this.impactT <= 3;
    for (let i = 0; i < d.length; i += 4) {
      const l = (d[i] * 3 + d[i + 1] * 4 + d[i + 2]) >> 3;
      let r, g, b;
      if (l > 150) { r = 255; g = 250; b = 235; } else if (l > 70) { r = 200; g = 0; b = 20; } else { r = 10; g = 0; b = 4; }
      if (inv) { r = 255 - r; g = 255 - g; b = 255 - b; if (l > 70 && l <= 150) { r = 255; g = 230; b = 60; } }
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }
    ctx.putImageData(img, 0, 0);
    // радиальные линии скорости
    const F = this.fat; if (!F) return;
    const z = this.zoom, vw = W / z, vh = H / z, x0 = clamp(this.zx - vw / 2, 0, W - vw), y0 = clamp(this.zy - vh / 2, 0, H - vh);
    const cx = (F.v.x - this.camX - x0) * z, cy = (F.v.y - 40 - y0) * z;
    ctx.fillStyle = inv ? '#000000' : '#ffffff';
    for (let i = 0; i < 40; i++) { const a = rand(0, 6.283), r0 = rand(60, 120), r1 = r0 + rand(60, 200); for (let r = r0; r < r1; r += 2) ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1 + (r > r0 + 40 ? 1 : 0), 1); }
  },
  drawCine(ctx) {
    const k = this.cine, bh = Math.round(24 * k);
    // виньетка
    const g = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 280); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(30,0,0,${0.75 * k})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh);
    ctx.fillStyle = '#5a0008'; ctx.fillRect(0, bh, W, 1); ctx.fillRect(0, H - bh - 1, W, 1);
    const B = this.banner;
    if (B && B.t < 70) {
      const t = B.t, slide = t < 10 ? easeOut(t / 10) : t > 56 ? 1 - easeIn((t - 56) / 14) : 1, off = Math.round((1 - slide) * (t < 30 ? -W : W));
      const y = 92;
      ctx.save(); ctx.translate(off, 0);
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.beginPath(); ctx.moveTo(0, y - 18); ctx.lineTo(W, y - 30); ctx.lineTo(W, y + 26); ctx.lineTo(0, y + 38); ctx.closePath(); ctx.fill();
      ctx.fillStyle = B.col; ctx.fillRect(0, y + 36, W, 1); ctx.fillRect(0, y - 20, W, 1);
      drawText(ctx, 'ПОСЛЕДНИЙ ПРИЁМ: ' + B.name.toUpperCase(), W / 2, y - 6, 1, '#ffd0c0');
      drawText(ctx, B.fat.toUpperCase(), W / 2 + (t < 14 ? rand(-2, 2) : 0), y + 14, 3, ['#ffe0d0', '#ff3a2a', '#6a0008']);
      ctx.restore();
    }
  },
  drawSplats(ctx) {
    for (const sp of this.splats) {
      const a = sp.t > sp.life - 60 ? (sp.life - sp.t) / 60 : 1, k = Math.min(1, sp.t / 3);
      ctx.globalAlpha = 0.85 * a;
      for (const dr of sp.drips) { ctx.fillStyle = '#6a0008'; const dx = Math.round(sp.x + dr.dx * sp.r); ctx.fillRect(dx - 1, Math.round(sp.y), 3, Math.round(dr.len)); pdisk(ctx, dx, Math.round(sp.y + dr.len), 2, '#6a0008'); }
      pdisk(ctx, sp.x, sp.y, sp.r * k, '#6a0008');
      for (const [dx, dy, r] of sp.dots) pdisk(ctx, Math.round(sp.x + dx * sp.r * k), Math.round(sp.y + dy * sp.r * k), r * (dx * dx + dy * dy > 3 ? 0.6 : 1), '#6a0008');
      pdisk(ctx, sp.x - sp.r * 0.3, sp.y - sp.r * 0.3, sp.r * 0.45 * k, '#a8101c');
      ctx.fillStyle = '#ff8a8a'; ctx.fillRect(Math.round(sp.x - sp.r * 0.45), Math.round(sp.y - sp.r * 0.5), 2, 1);
    }
    ctx.globalAlpha = 1;
  },
  drawRays(c, cx) {
    const w = this.winner, x = w.x - cx, y = w.y - 40, t = this.pt, k = clamp(t / 40, 0, 1);
    c.save(); c.globalAlpha = 0.22 * k; c.fillStyle = '#ffd86a';
    for (let i = 0; i < 14; i++) {
      const a0 = t * 0.006 + i * Math.PI * 2 / 14;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a0) * 400, y + Math.sin(a0) * 400); c.lineTo(x + Math.cos(a0 + 0.17) * 400, y + Math.sin(a0 + 0.17) * 400); c.closePath(); c.fill();
    }
    c.globalAlpha = 0.35 * k; pdisk(c, x, y, 26 + Math.sin(t * 0.1) * 3, '#fff3c0'); c.globalAlpha = 1; c.restore();
  },
  drawHUD(ctx) {
    const [a, b] = this.f;
    if (this.phase === 'victory') { this.drawAnn(ctx); this.drawVictoryText(ctx); return; }
    this.bar(ctx, 12, 10, 196, a, false); this.bar(ctx, W - 12 - 196, 10, 196, b, true);
    // нанесённый урон за матч
    drawText(ctx, 'УРОН ' + b.taken, 12 + 196 - 3, 30, 1, ['#ffe0b0', '#ff8a3a'], 'right');
    drawText(ctx, 'УРОН ' + a.taken, W - 12 - 196 + 3, 30, 1, ['#ffe0b0', '#ff8a3a'], 'left');
    // таймер
    ctx.fillStyle = '#140a14'; ctx.fillRect(W / 2 - 17, 6, 34, 22); ctx.fillStyle = '#5a3a2a'; ctx.fillRect(W / 2 - 16, 7, 32, 20); ctx.fillStyle = '#241418'; ctx.fillRect(W / 2 - 15, 8, 30, 18);
    const tv = this.phase === 'finish' ? Math.ceil(this.finishT / 60) : (Settings.time ? this.timer : '--');
    drawText(ctx, String(tv), W / 2, 17, 2, this.phase === 'finish' ? ['#ffd0c0', '#e02010'] : ['#fff3a0', '#e0a020']);
    // победы в раундах
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const x = i === 0 ? 14 + j * 11 : W - 22 - j * 11, y = 52;
      if (j < this.wins[i]) { pdisk(ctx, x + 4, y, 4.5, '#5a3a10'); pdisk(ctx, x + 4, y, 3.5, '#ffd040'); ctx.fillStyle = '#c08010'; ctx.fillRect(x + 3, y - 1, 3, 3); ctx.fillStyle = '#fff6c0'; ctx.fillRect(x + 2, y - 3, 2, 1); }
      else { pdisk(ctx, x + 4, y, 4.5, '#1a1218'); pdisk(ctx, x + 4, y, 3.5, '#3a2a30'); }
    }
    for (let i = 0; i < 2; i++) {
      const c = this.combos[i];
      if (c && c.n >= 2 && c.t < 70) {
        const n = c.n, word = n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 > 20) ? 'УДАРА' : 'УДАРОВ';
        const x = i === 0 ? 16 : W - 16, al = i === 0 ? 'left' : 'right';
        ctx.globalAlpha = c.t > 55 ? (70 - c.t) / 15 : 1;
        drawText(ctx, n + ' ' + word, x, 66, 2, ['#ffffff', '#ffd040'], al);
        ctx.globalAlpha = 1;
      }
    }
    if (this.phase === 'fight' || this.phase === 'intro') this.drawSuperBars(ctx);
    this.drawSuperBanner(ctx);
    this.drawAnn(ctx);
    if (this.phase === 'finish' && !this.ai[this.finisher.idx]) {
      if (Settings.hints !== false) this.drawFatHint(ctx, this.finisher.ch.fatal, this.fatProg || 0);
    }
    this.drawDmgPops(ctx);
    if (this.phase === 'victory') this.drawVictoryText(ctx);
  },
  // подсказка фаталити: крупные стрелки, набранные подсвечиваются
  drawFatHint(ctx, fa, prog) {
    const n = fa.seq.length, bw = 22, gap = 5, tw = n * bw + (n - 1) * gap, x0 = Math.round(W / 2 - tw / 2), y0 = H - 62, t = this.frame;
    ctx.fillStyle = 'rgba(10,0,4,0.72)'; ctx.fillRect(x0 - 10, y0 - 13, tw + 20, bw + 21);
    ctx.fillStyle = '#7a0a10'; ctx.fillRect(x0 - 10, y0 - 13, tw + 20, 1); ctx.fillRect(x0 - 10, y0 + bw + 7, tw + 20, 1);
    drawText(ctx, 'ФАТАЛИТИ: ' + fa.name.toUpperCase(), W / 2, y0 - 7, 1, ['#ffd0c0', '#ff6a5a']);
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (bw + gap), y = y0, on = i < prog, nxt = i === prog && (t >> 4) & 1;
      ctx.fillStyle = on ? '#ffd040' : nxt ? '#a02020' : '#3a1418'; ctx.fillRect(x, y, bw, bw);
      ctx.fillStyle = on ? '#fff6c0' : '#5a2a2a'; ctx.fillRect(x, y, bw, 1); ctx.fillRect(x, y, 1, bw);
      ctx.fillStyle = '#000'; ctx.fillRect(x, y + bw - 1, bw, 1); ctx.fillRect(x + bw - 1, y, 1, bw);
      this.drawArrow(ctx, x + bw / 2, y + bw / 2, fa.seq[i], on ? '#5a0a00' : '#ffffff');
    }
    drawText(ctx, 'ТОЛЬКО СТРЕЛКИ, ВБЛИЗИ', W / 2, y0 + bw + 2, 1, '#c09090');
  },
  drawArrow(ctx, cx, cy, d, col) {
    // стрелка вправо, повёрнутая по направлению (F/B — относительно взгляда бойца)
    const f = this.finisher, right = (d === 'F') === (f ? f.facing === 1 : true);
    const ang = d === 'U' ? -Math.PI / 2 : d === 'D' ? Math.PI / 2 : right ? 0 : Math.PI;
    ctx.save(); ctx.translate(Math.round(cx), Math.round(cy)); ctx.rotate(ang); ctx.fillStyle = col;
    ctx.fillRect(-7, -2, 8, 5); for (let i = 0; i < 6; i++) ctx.fillRect(1 + i, -6 + i, 1, 13 - i * 2);
    ctx.restore();
  },
  // всплывающий урон — под полоской здоровья получившего удар
  dmgPop(f, v, blocked) {
    if (!this.pops) this.pops = [];
    const old = this.pops.find(p => p.f === f && p.t < 20);
    if (old) { old.v += v; old.t = 0; old.blocked = blocked && old.blocked; return; }
    this.pops.push({ f, v, t: 0, blocked });
  },
  drawDmgPops(ctx) {
    if (!this.pops) return;
    for (const p of this.pops) {
      const f = p.f, right = f.idx === 1, bx = right ? W - 12 - 196 : 12, edge = right ? bx + 196 - Math.round(196 * f.hp / 100) : bx + Math.round(196 * f.hp / 100);
      const k = p.t < 6 ? 1 + (6 - p.t) * 0.15 : 1, x = clamp(edge, bx + 14, bx + 196 - 14), y = 36 + Math.min(6, p.t * 0.25);
      ctx.globalAlpha = p.t > 50 ? (70 - p.t) / 20 : 1;
      const sp = textSprite('-' + p.v, 2, p.blocked ? ['#e0f0ff', '#7ab0ff'] : ['#ffffff', '#ff4a2a'], '#000', '#000');
      const w = Math.round(sp.width * k), h = Math.round(sp.height * k);
      ctx.drawImage(sp, Math.round(x - w / 2), Math.round(y), w, h);
      if (p.blocked) drawText(ctx, 'БЛОК', Math.round(x), Math.round(y + h + 5), 1, '#a0c8ff');
      ctx.globalAlpha = 1;
    }
  },
  drawDemoHUD(ctx) { this.drawAnn(ctx); if (this.phase === 'victory') this.drawVictoryText(ctx); },
  bar(ctx, x, y, w, f, right) {
    const h = 11;
    ctx.fillStyle = '#0c060a'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#c0a060'; ctx.fillRect(x - 1, y - 1, w + 2, 1); ctx.fillRect(x - 1, y + h, w + 2, 1); ctx.fillRect(x - 1, y - 1, 1, h + 2); ctx.fillRect(x + w, y - 1, 1, h + 2);
    ctx.fillStyle = '#5a0a10'; ctx.fillRect(x, y, w, h);
    const dw = Math.round(w * f.dhp / 100), hw = Math.round(w * f.hp / 100);
    ctx.fillStyle = '#ffd040'; ctx.fillRect(right ? x + w - dw : x, y, dw, h);
    const low = f.hp < 30 && (this.frame >> 3) & 1;
    for (let j = 0; j < h; j++) { ctx.fillStyle = low ? (j < 4 ? '#ff8a6a' : '#d03a2a') : j < 2 ? '#a8ffb0' : j < 6 ? '#3ad04a' : j < 9 ? '#22a034' : '#167024'; ctx.fillRect(right ? x + w - hw : x, y + j, hw, 1); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 8; i < w; i += 8) ctx.fillRect(x + i, y + h - 3, 1, 3);
    drawText(ctx, f.ch.name, right ? x + w - 3 : x + 3, y + h + 9, 1, '#ffffff', right ? 'right' : 'left');
    // готовность коронного приёма
    const k = 1 - clamp((f.uCd || 0) / UNIQUE_CD, 0, 1), gw = 40, gx = right ? x + w - gw : x, gy = y + h + 15, ready = k >= 1;
    ctx.fillStyle = '#0c060a'; ctx.fillRect(gx - 1, gy - 1, gw + 2, 5);
    ctx.fillStyle = ready ? ((this.frame >> 3) & 1 ? '#ffe070' : '#ffb030') : '#6a4a20'; ctx.fillRect(right ? gx + gw - Math.round(gw * k) : gx, gy, Math.round(gw * k), 3);
    drawText(ctx, ready ? 'КОРОННЫЙ!' : 'КОРОННЫЙ', right ? gx - 3 : gx + gw + 3, gy + 2, 1, ready ? '#ffe070' : '#8a7050', right ? 'right' : 'left');
  },
  drawAnn(ctx) {
    const A = this.ann; if (!A || A.t > A.dur) return;
    let y = 100 - A.lines.length * 6;
    const fade = A.t > A.dur - 10 ? (A.dur - A.t) / 10 : 1;
    ctx.globalAlpha = fade;
    for (const L of A.lines) {
      const sp = textSprite(L.txt, L.s, L.col, '#000', '#000');
      const k = L.slam ? (A.t < 10 ? 1 + (10 - A.t) * 0.3 : 1) : A.t < 6 ? 1 + (6 - A.t) * 0.12 : 1, sw = Math.round(sp.width * k), sh = Math.round(sp.height * k);
      let s = L.s; while (sw > W - 10 && s > 1) { s--; break; }
      if (sp.width > W - 8) { const sp2 = textSprite(L.txt, Math.max(1, L.s - 2), L.col); ctx.drawImage(sp2, Math.round(W / 2 - sp2.width / 2), Math.round(y)); y += sp2.height + 2; continue; }
      ctx.drawImage(sp, Math.round(W / 2 - sw / 2), Math.round(y + (sp.height - sh) / 2), sw, sh); y += sp.height + 2;
    }
    ctx.globalAlpha = 1;
  },
  drawVictoryText(ctx) {
    const t = this.pt, w = this.winner, v = this.vic || {};
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    if (t > 40) { const k = clamp((t - 40) / 15, 0, 1); ctx.fillRect(0, 0, W, Math.round(40 * k)); ctx.fillRect(0, H - Math.round(40 * k), W, Math.round(40 * k)); }
    let y = 54;
    if (v.fatal) { drawText(ctx, 'ФАТАЛИТИ', W / 2, 18, 3, ['#ff6a5a', '#c0101a', '#5a0008']); }
    if (t > 50) {
      const name = w.ch.name.toUpperCase(), sc = name.length > 12 ? 3 : 4;
      const shown = Math.min(name.length, Math.floor((t - 50) / 3));
      const full = textSprite(name, sc, ['#fff6c0', '#ffc030', '#c06010']);
      const part = name.slice(0, shown);
      if (part) { const sp = textSprite(part, sc, ['#fff6c0', '#ffc030', '#c06010']); const x0 = Math.round(W / 2 - full.width / 2); ctx.drawImage(sp, x0, y - sp.height / 2 + (shown < name.length ? rand(-1, 1) : 0)); }
      if (t > 50 + name.length * 3 + 6) drawText(ctx, 'ПОБЕЖДАЕТ', W / 2, y + 26, 2, ['#ffffff', '#ffb0a0']);
    }
    if (t > 110 && v.flawless) drawText(ctx, 'БЕЗУПРЕЧНАЯ ПОБЕДА', W / 2, y + 44, 2, ['#c0f6ff', '#3a8ad8']);
    if (t > 130) drawText(ctx, '"' + w.ch.quote + '"', W / 2, H - 26, 1, '#ffe8c0');
    if (t > 150 && !this.demo && (t >> 4) & 1 && !(this.result && this.result.shown)) drawText(ctx, 'ENTER / ТАП — ПРОДОЛЖИТЬ', W / 2, H - 12, 1, '#ffffff');
  },
  drawVS(c) {
    const t = this.vsT, [a, b] = this.f;
    if (!this._vsBg) { const [bv, bc] = mkCanvas(W, H); ditherV(bc, 0, 0, W, H, ['#1a0410', '#4a0a1a', '#1a0410']); this._vsBg = bv; }
    c.drawImage(this._vsBg, 0, 0, W, H);
    c.globalAlpha = 0.2; c.fillStyle = '#ff6a1a'; for (let i = 0; i < 16; i++) { const yy = (i * 23 + t * 2) % H; c.fillRect(0, yy, W, 1); } c.globalAlpha = 1;
    // вместо молний: мягкая энергетическая волна от центра раз в секунду
    { const ph = (t % 60) / 60, r = 10 + ph * 220; c.globalAlpha = 0.45 * (1 - ph); c.strokeStyle = '#ffb040'; c.lineWidth = 3 * (1 - ph) + 1; c.beginPath(); c.ellipse(W / 2, H / 2, r, r * 0.55, 0, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1;
      const gl = 0.25 + 0.15 * Math.sin(t * 0.12); c.globalAlpha = gl; c.fillStyle = '#ff7a20'; c.fillRect(W / 2 - 2, 0, 4, H); c.globalAlpha = gl * 0.5; c.fillRect(W / 2 - 6, 0, 12, H); c.globalAlpha = 1; }
    if (t === 30) Sound.play('heavy');
    const k = easeOut(t / 30);
    for (const f of [a, b]) {
      const left = f.idx === 0, R = f.R;
      renderFighter(R, f.ch, ANIM.victory(f.ch, t), { anim: t });
      const x = left ? lerp(-100, 120, k) : lerp(W + 100, W - 120, k);
      c.save(); c.translate(Math.round(x), 250); c.scale(left ? 2 : -2, 2); c.drawImage(R.cv, -SPR_OX, -SPR_OY, SPR_W, SPR_H); c.restore();
      drawText(c, f.ch.name, left ? 20 : W - 20, 30, f.ch.name.length > 12 ? 2 : 3, ['#fff6c0', '#ffb030'], left ? 'left' : 'right');
      drawText(c, f.ch.title + ', ' + f.ch.world, left ? 20 : W - 20, 50, 1, '#ffd0c0', left ? 'left' : 'right');
    }
    if (t > 25) { const s = t < 35 ? 9 - Math.floor((t - 25) / 2) : 6; drawText(c, 'VS', W / 2 + (t < 40 ? rand(-2, 2) : 0), 130, Math.max(5, s), ['#ffffff', '#ffd040', '#e02010']); }
    drawText(c, 'АРЕНА: ' + Stage.cur.name, W / 2, H - 14, 1, '#ffffff');
  }
};
