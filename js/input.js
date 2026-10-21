'use strict';
// Клавиатура, геймпады, сенсорное управление
const Input = {
  keys: {}, menuQ: [], rawQ: [], touch: { l: 0, r: 0, u: 0, d: 0, p: 0, k: 0, b: 0, sp1: 0, sp2: 0, fat: 0 }, padPrev: [{}, {}], anyKey: false,
  GAME_KEYS: new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Tab']),
  init() {
    addEventListener('keydown', e => {
      if (this.GAME_KEYS.has(e.code)) e.preventDefault();
      if (!e.repeat) this.keys[e.code] = true;
      this.anyKey = true;
      const m = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Enter: 'ok', Space: 'ok', NumpadEnter: 'ok', KeyF: 'ok', KeyK: 'ok2', Escape: 'back', Backspace: 'back', KeyP: 'pause' }[e.code];
      if (m) this.menuQ.push(m);
      if (!e.repeat || /Arrow|Key[WASD]/.test(e.code)) this.rawQ.push(e.code);
      Sound.init();
    }, { passive: false });
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; for (const k in this.touch) this.touch[k] = 0; });
    addEventListener('pointerdown', () => Sound.init(), { passive: true });
    addEventListener('contextmenu', e => e.preventDefault());
  },
  pollPads() {
    let pads = [];
    try { pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : []; } catch (e) { }
    this.pads = pads;
    pads.slice(0, 2).forEach((p, i) => {
      const prev = this.padPrev[i];
      const st = { up: p.axes[1] < -0.5 || (p.buttons[12] && p.buttons[12].pressed), down: p.axes[1] > 0.5 || (p.buttons[13] && p.buttons[13].pressed), left: p.axes[0] < -0.5 || (p.buttons[14] && p.buttons[14].pressed), right: p.axes[0] > 0.5 || (p.buttons[15] && p.buttons[15].pressed), ok: p.buttons[0] && p.buttons[0].pressed, back: p.buttons[1] && p.buttons[1].pressed, pause: p.buttons[9] && p.buttons[9].pressed };
      for (const k in st) if (st[k] && !prev[k]) { this.menuQ.push(k); this.rawQ.push('P' + i + ':' + k); Sound.init(); }
      this.padPrev[i] = st;
    });
  },
  padState(i) {
    const p = this.pads && this.pads[i]; if (!p) return null;
    const b = n => p.buttons[n] && p.buttons[n].pressed ? 1 : 0;
    return { l: p.axes[0] < -0.5 || b(14) ? 1 : 0, r: p.axes[0] > 0.5 || b(15) ? 1 : 0, u: p.axes[1] < -0.6 || b(12) ? 1 : 0, d: p.axes[1] > 0.6 || b(13) ? 1 : 0, p: b(2) | b(3), k: b(0), b: b(1) | b(6) | b(7), sp1: b(4), sp2: b(5), fat: 0 };
  },
  takeMenu() { const q = this.menuQ; this.menuQ = []; return q; },
  takeRaw() { const q = this.rawQ; this.rawQ = []; return q; }
};
const KEYMAP1 = { KeyA: 'l', KeyD: 'r', KeyW: 'u', KeyS: 'd', KeyF: 'p', KeyG: 'k', KeyH: 'b', KeyR: 'sp1', KeyT: 'sp2', KeyY: 'fat' };
const KEYMAP2 = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd', KeyK: 'p', Numpad1: 'p', KeyL: 'k', Numpad2: 'k', Semicolon: 'b', Numpad3: 'b', KeyO: 'sp1', Numpad4: 'sp1', KeyP: 'sp2', Numpad5: 'sp2', KeyI: 'fat', Numpad6: 'fat' };

class PlayerInput {
  constructor(maps, pad, touch) { this.maps = maps; this.pad = pad; this.touch = touch; this.prev = {}; this.buf = []; }
  poll(frame, facing) {
    const h = { l: 0, r: 0, u: 0, d: 0, p: 0, k: 0, b: 0, sp1: 0, sp2: 0, fat: 0 };
    for (const m of this.maps) for (const code in m) if (Input.keys[code]) h[m[code]] = 1;
    if (this.touch) for (const k in h) h[k] |= Input.touch[k];
    if (this.pad != null) { const ps = Input.padState(this.pad); if (ps) for (const k in h) h[k] |= ps[k]; }
    const pr = {}; for (const k in h) pr[k] = h[k] && !this.prev[k];
    this.prev = h;
    for (const d of ['l', 'r', 'u', 'd']) if (pr[d]) this.buf.push({ d, f: frame });
    while (this.buf.length && frame - this.buf[0].f > 50) this.buf.shift();
    const c = { l: h.l, r: h.r, u: h.u, d: h.d, b: h.b, p: pr.p, k: pr.k, special: null, seq: null };
    if (pr.sp1) c.special = 'proj'; else if (pr.sp2) c.special = 'dash'; else if (pr.fat) c.special = 'fatal';
    if (c.p || c.k) c.seq = this.buf.map(e => e.d === 'u' ? 'U' : e.d === 'd' ? 'D' : ((e.d === 'r') === (facing === 1) ? 'F' : 'B'));
    return c;
  }
  clear() { this.buf = []; }
}
function seqMatch(seq, pat) {
  if (!seq || seq.length < pat.length) return false;
  for (let i = 0; i < pat.length; i++) if (seq[seq.length - pat.length + i] !== pat[i]) return false;
  return true;
}
