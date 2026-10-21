'use strict';
// Бот: реакция, блоки, комбо и добивания зависят от уровня сложности
class AI {
  constructor(f, level) {
    this.f = f; this.lv = clamp(level, 1, 3); this.q = []; this.cool = 30; this.t = 0;
    const L = this.lv - 1;
    this.react = [26, 15, 7][L]; this.blockP = [0.2, 0.5, 0.82][L]; this.aggr = [0.3, 0.55, 0.8][L]; this.fatalP = [0.35, 0.7, 0.95][L];
  }
  push(n, c) { this.q.push({ n, c, first: true }); }
  get(g) {
    const f = this.f, o = f.opp, c = { l: 0, r: 0, u: 0, d: 0, b: 0, p: 0, k: 0, special: null };
    this.t++;
    const dist = Math.abs(o.x - f.x), fw = f.facing === 1 ? 'r' : 'l', bk = f.facing === 1 ? 'l' : 'r';
    if (g.phase === 'finish') {
      if (g.finisher === f) {
        if (dist > 44) c[fw] = 1;
        else if (this.t % 25 === 0) { if (Math.random() < this.fatalP) c.special = 'fatal'; else { c.d = 1; c.p = 1; } }
      }
      return c;
    }
    if (g.phase !== 'fight' || !f.canAct() && f.st !== 'attack' && f.st !== 'jump') { this.q = []; return c; }
    if (this.q.length) {
      const s = this.q[0];
      for (const k in s.c) { if (k === 'p' || k === 'k' || k === 'special') { if (s.first) c[k] = s.c[k]; } else c[k] = s.c[k]; }
      s.first = false;
      if (--s.n <= 0) this.q.shift();
      return c;
    }
    // реакции на угрозы
    const projT = g.projThreat(f);
    if ((o.isThreat() && dist < 85) || projT) {
      if (this.t % 3 === 0 && Math.random() < this.blockP) {
        if (projT && this.lv >= 2 && Math.random() < 0.35 && f.canAct()) { this.push(2, { u: 1, [fw]: 1 }); this.push(14, {}); this.push(1, { k: 1 }); }
        else this.push(14 + randi(0, 8), { b: 1, d: o.move && o.move.low ? 1 : 0 });
        return c;
      }
    }
    if (o.air && dist < 64 && o.vy > -2 && Math.random() < this.aggr * 0.25 && f.canAct()) { c.d = 1; c.p = 1; this.cool = this.react; return c; }
    if (o.st === 'dizzy' || o.st === 'frozen') { if (dist > 34) c[fw] = 1; else { this.push(1, { p: 1 }); this.push(7, {}); this.push(1, { d: 1, p: 1 }); } return c; }
    if (this.cool > 0) { this.cool--; if (dist > 70 && this.lv > 1 && this.t % 2 === 0) c[fw] = 1; return c; }
    if (!f.canAct()) return c;
    const r = Math.random();
    if (dist > 150) {
      if (r < 0.3 && !g.projOf(f)) c.special = 'proj';
      else if (r < 0.42) c.special = 'dash';
      else this.push(20 + randi(0, 20), { [fw]: 1 });
    } else if (dist > 52) {
      if (r < 0.18 && !g.projOf(f)) c.special = 'proj';
      else if (r < 0.3) c.special = 'dash';
      else if (r < 0.45) { this.push(2, { u: 1, [fw]: 1 }); this.push(16, {}); this.push(1, { k: 1 }); }
      else if (r < 0.52) this.push(16, { [bk]: 1 });
      else this.push(12 + randi(0, 12), { [fw]: 1 });
    } else {
      if (r < this.aggr * 0.45) { this.push(1, { p: 1 }); this.push(6, {}); this.push(1, { p: 1 }); this.push(7, {}); this.push(1, this.lv > 1 && Math.random() < 0.5 ? { d: 1, p: 1 } : { k: 1 }); }
      else if (r < this.aggr * 0.6) c.k = 1;
      else if (r < this.aggr * 0.72) { c.d = 1; c.k = 1; }
      else if (r < this.aggr * 0.82) { c.d = 1; c.p = 1; }
      else if (r < this.aggr * 0.9 && dist < 32) { c[fw] = 1; c.p = 1; }
      else if (r < 0.85) { c[bk] = 1; c.k = 1; }
      else this.push(12, { [bk]: 1 });
    }
    this.cool = this.react + randi(0, 12);
    return c;
  }
}
