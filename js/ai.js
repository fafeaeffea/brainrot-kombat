'use strict';
// Бот: читает атаки соперника, блокирует верх/низ, наказывает промахи,
// сбивает прыжки апперкотом, бьёт комбо-цепочками и добивает
const AI_COMBOS = [
  [{ p: 1 }, { p: 1 }, { d: 1, p: 1 }],                 // джеб, кросс, апперкот
  [{ p: 1 }, { p: 1 }, { k: 1 }, { d: 1, p: 1 }],       // джеб, кросс, нога, апперкот
  [{ p: 1 }, { k: 1 }, { B: 1, k: 1 }],                 // джеб, нога, круговой
  [{ p: 1 }, { p: 1 }, { d: 1, k: 1 }],                 // в подсечку
  [{ p: 1 }, { B: 1, p: 1 }, { d: 1, k: 1 }],           // разворотный кулак, подсечка
  [{ p: 1 }, { p: 1 }, { F: 1, k: 1 }],                 // толчок
];
class AI {
  constructor(f, level) {
    this.f = f; this.lv = clamp(level, 1, 3); this.q = []; this.cool = 20; this.t = 0; this.combo = null; this.seenAtk = null; this.decided = null; this.fatT = 0; this.after = null;
    const L = this.lv - 1;
    this.react = [9, 5, 2][L];            // кадров до реакции на атаку
    this.blockP = [0.45, 0.75, 0.93][L];  // шанс заблокировать увиденную атаку
    this.readLow = [0.5, 0.8, 0.95][L];   // правильно угадать верх/низ
    this.punishP = [0.35, 0.7, 0.92][L];
    this.aaP = [0.3, 0.65, 0.9][L];       // анти-эйр
    this.aggr = [0.45, 0.65, 0.85][L];
    this.think = [16, 9, 4][L];           // пауза между решениями
    this.comboLen = [2, 3, 4][L];
    this.fatalP = [0.5, 0.85, 1][L];
  }
  push(n, c) { this.q.push({ n, c, first: true }); }
  dirs(c, s) {
    const f = this.f, fw = f.facing === 1 ? 'r' : 'l', bk = f.facing === 1 ? 'l' : 'r';
    const o = Object.assign({}, s); if (o.F) { o[fw] = 1; delete o.F; } if (o.B) { o[bk] = 1; delete o.B; }
    return Object.assign(c, o);
  }
  get(g) {
    const f = this.f, o = f.opp, c = { l: 0, r: 0, u: 0, d: 0, b: 0, p: 0, k: 0, special: null };
    this.t++;
    const dist = Math.abs(o.x - f.x), fw = f.facing === 1 ? 'r' : 'l', bk = f.facing === 1 ? 'l' : 'r';
    if (g.phase === 'finish') {
      if (g.finisher === f) {
        this.fatT++;
        if (dist > 44) c[fw] = 1;
        else if (this.fatT > 50 && this.fatT % 20 === 0) { if (Math.random() < this.fatalP) c.special = 'fatal'; else { c.d = 1; c.p = 1; } }
      }
      return c;
    }
    this.fatT = 0;
    if (g.phase !== 'fight') { this.q = []; this.combo = null; return c; }
    // продолжение комбо: следующий удар, как только предыдущий коснулся
    if (this.combo && f.st === 'attack') {
      if (f.hitDone && f.mt >= f.move.st + 1) {
        if (o.st === 'bstun' && this.lv > 1 && Math.random() < 0.6) { this.combo = null; return c; } // не раскрываться в блок
        const nx = this.firstOf();
        this.dirs(c, nx);
        if (!this.combo && nx.d && nx.p && this.lv > 1 && Math.random() < 0.6) this.after = Math.random() < 0.5 ? 'proj' : 'dash';
      }
      return c;
    }
    if (f.st !== 'attack') this.combo = null;
    // жонглирование после апперкота
    if (this.after && f.canAct()) { if (o.st === 'fall' && o.air) c.special = this.after === 'proj' && !g.projOf(f) ? 'proj' : 'dash'; this.after = null; return c; }
    if (!f.canAct() && f.st !== 'jump') { this.q = []; return c; }
    if (this.q.length) {
      const s = this.q[0];
      for (const k in s.c) { if (k === 'p' || k === 'k' || k === 'special') { if (s.first) c[k] = s.c[k]; } else c[k] = s.c[k]; }
      s.first = false;
      if (--s.n <= 0) this.q.shift();
      return c;
    }
    if (f.st === 'jump') return c;
    const atk = o.st === 'attack' ? o.move : null;
    // --- защита: атака соперника видна после «реакции» ---
    if (atk && dist < 95) {
      if (this.seenAtk !== o.move || o.mt <= 1) { this.seenAtk = o.move; this.decided = null; }
      const inStart = o.mt < atk.st + atk.act;
      if (inStart && o.mt >= this.react && this.decided == null) this.decided = Math.random() < this.blockP;
      if (inStart && this.decided) {
        let low = !!atk.low; if (Math.random() > this.readLow) low = !low; if (atk.overhead) low = this.lv < 3 && Math.random() < 0.4;
        c.b = 1; c.d = low ? 1 : 0; return c;
      }
      // соперник в восстановлении после промаха или блока — наказать
      if (!inStart && dist < 60 && this.decided !== 'done' && Math.random() < this.punishP) {
        this.decided = 'done';
        if (dist >= 42) { c[fw] = 1; c.k = 1; return this.cooled(c); }
        this.startCombo(randi(0, 1)); return this.dirs(c, this.firstOf());
      }
    } else this.seenAtk = null;
    if (o.st === 'dash' && dist < 120 && Math.random() < this.blockP) { c.b = 1; c.d = o.dash && o.dash.trip ? 1 : 0; return c; }
    if (o.st === 'unique' && dist < 140 && Math.random() < this.blockP * 0.8) { c.b = 1; return c; }
    if (g.projThreat(f) && Math.random() < this.blockP) {
      if (this.lv >= 2 && dist < 170 && Math.random() < 0.35) { this.push(2, { u: 1, [fw]: 1 }); this.push(14, {}); this.push(1, { d: 1, k: 1 }); }
      else this.push(12, { b: 1 });
      return c;
    }
    // анти-эйр: соперник прыгает на бота
    if (o.air && o.st !== 'fall' && dist < 70 && (dist < 50 || Math.sign(o.vx || 0) === Math.sign(f.x - o.x))) {
      if (o.vy > -3 && this.aaDone !== o.t && Math.random() < this.aaP) { this.aaDone = o.t; c.d = 1; c.p = 1; return c; }
      if (dist < 50) { c.b = 1; return c; }
    }
    // беспомощный соперник — полное комбо
    if (o.st === 'dizzy' || o.st === 'frozen') { if (dist > 34) c[fw] = 1; else { this.startCombo(1); return this.dirs(c, this.firstOf()); } return c; }
    // встаёт с земли — подойти и встретить блоком
    if (o.st === 'getup' || o.st === 'down') { if (dist > 40) c[fw] = 1; else c.b = 1; return c; }
    if (this.cool > 0) { this.cool--; if (dist > 60 && this.t % 2 === 0) c[fw] = 1; else if (dist < 26 && this.t % 3 === 0) c[bk] = 1; return c; }
    if (!f.canAct()) return c;
    const r = Math.random();
    if (dist > 150) {
      if (r < 0.35 && !g.projOf(f)) c.special = 'proj';
      else if (r < 0.48) c.special = 'dash';
      else if (r < 0.56) c.special = 'unique';
      else this.push(14 + randi(0, 14), { [fw]: 1 });
    } else if (dist > 50) {
      if (r < 0.14 && !g.projOf(f)) c.special = 'proj';
      else if (r < 0.28) c.special = 'dash';
      else if (r < 0.36) c.special = 'unique';
      else if (r < 0.44) { this.push(2, { u: 1, [fw]: 1 }); this.push(14, {}); this.push(1, Math.random() < 0.5 ? { d: 1, k: 1 } : { k: 1 }); }
      else if (r < 0.5 && dist < 70) { c[fw] = 1; c.p = 1; }
      else if (r < 0.56) this.push(10, { [bk]: 1 });
      else this.push(8 + randi(0, 10), { [fw]: 1 });
    } else {
      if (o.st === 'block' || o.st === 'cblock') {
        // соперник в блоке: бросок, удар сверху или подсечка
        if (dist < 32 && r < 0.45) { c[fw] = 1; c.p = 1; return this.cooled(c); }
        if (r < 0.7) { if (o.st === 'cblock') { c[fw] = 1; c.p = 1; } else { c.d = 1; c.k = 1; } return this.cooled(c); }
      }
      if (r < this.aggr * 0.6) { this.startCombo(); return this.cooled(this.dirs(c, this.firstOf())); }
      else if (r < this.aggr * 0.72) { c.d = 1; c.k = 1; }
      else if (r < this.aggr * 0.82) { c[bk] = 1; c.k = 1; }
      else if (r < this.aggr * 0.9) { c[fw] = 1; c.k = 1; }
      else if (r < 0.9) this.push(10, { b: 1 });
      else this.push(10, { [bk]: 1 });
    }
    return this.cooled(c);
  }
  cooled(c) { this.cool = this.think + randi(0, this.think); return c; }
  startCombo(i) {
    const pick = AI_COMBOS[i != null ? i : randi(0, AI_COMBOS.length - 1)];
    this.combo = pick.slice(0, Math.max(2, Math.min(pick.length, this.comboLen))).map(x => Object.assign({}, x));
  }
  firstOf() { const s = this.combo.shift(); if (!this.combo.length) this.combo = null; return s; }
}
