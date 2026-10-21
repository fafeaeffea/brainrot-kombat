'use strict';
// Клавиатура, геймпады, сенсорное управление
const Input = {
  keys: {}, menuQ: [], rawQ: [], touch: { l: 0, r: 0, u: 0, d: 0, p: 0, k: 0, b: 0, sp1: 0, sp2: 0, fat: 0 }, padPrev: [{}, {}], anyKey: false,
  GAME_KEYS: new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Tab']),
  init() {
    addEventListener('keydown', e => {
      if (this.GAME_KEYS.has(e.code)) e.preventDefault();
      if (this.capture) { e.preventDefault(); if (!e.repeat) { const f = this.capture; this.capture = null; f(e.code); } return; }
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
// Раскладки можно переназначить в меню «Управление»; хранятся в localStorage
const ACTIONS = ['l', 'r', 'u', 'd', 'p', 'k', 'b', 'sp1', 'sp2', 'fat'];
const DEFAULT_KEYS = [
  { l: 'KeyA', r: 'KeyD', u: 'KeyW', d: 'KeyS', p: 'KeyF', k: 'KeyG', b: 'KeyH', sp1: 'KeyR', sp2: 'KeyT', fat: 'KeyY' },
  { l: 'ArrowLeft', r: 'ArrowRight', u: 'ArrowUp', d: 'ArrowDown', p: 'KeyK', k: 'KeyL', b: 'Semicolon', sp1: 'KeyO', sp2: 'KeyP', fat: 'KeyI' }
];
const P2_NUMPAD = { Numpad1: 'p', Numpad2: 'k', Numpad3: 'b', Numpad4: 'sp1', Numpad5: 'sp2', Numpad6: 'fat' };
const KEYS = [0, 1].map(i => Object.assign({}, DEFAULT_KEYS[i], Store.get('keys' + (i + 1), {})));
const KEYMAP1 = {}, KEYMAP2 = {};
function rebuildKeymaps() {
  for (const [m, i] of [[KEYMAP1, 0], [KEYMAP2, 1]]) { for (const k in m) delete m[k]; for (const a of ACTIONS) m[KEYS[i][a]] = a; }
  const used = new Set(Object.values(KEYS[0]).concat(Object.values(KEYS[1])));
  for (const c in P2_NUMPAD) if (!used.has(c)) KEYMAP2[c] = P2_NUMPAD[c];
  for (const i of [0, 1]) for (const a of ['l', 'r', 'u', 'd']) Input.GAME_KEYS.add(KEYS[i][a]);
}
function saveKeys() { Store.set('keys1', KEYS[0]); Store.set('keys2', KEYS[1]); rebuildKeymaps(); }
// назначить клавишу; если она уже занята — поменять местами
function bindKey(pl, act, code) {
  const old = KEYS[pl][act];
  for (const i of [0, 1]) for (const a of ACTIONS) if (KEYS[i][a] === code && !(i === pl && a === act)) KEYS[i][a] = old;
  KEYS[pl][act] = code; saveKeys();
}
function resetKeys() { for (const i of [0, 1]) Object.assign(KEYS[i], DEFAULT_KEYS[i]); saveKeys(); }
function keyName(code) {
  if (!code) return '—';
  const sp = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: 'ПРОБЕЛ', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: 'BSLASH', Backquote: 'TILDE', Enter: 'ENTER', NumpadEnter: 'NUM ENTER', ShiftLeft: 'L SHIFT', ShiftRight: 'R SHIFT', ControlLeft: 'L CTRL', ControlRight: 'R CTRL', AltLeft: 'L ALT', AltRight: 'R ALT', Tab: 'TAB', CapsLock: 'CAPS', Backspace: 'BKSP' };
  if (sp[code]) return sp[code];
  return code.replace(/^Key/, '').replace(/^Digit/, '').replace(/^Numpad/, 'NUM ').toUpperCase().slice(0, 9);
}
rebuildKeymaps();

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
