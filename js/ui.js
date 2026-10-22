'use strict';
// Интерфейс: меню, выбор бойца, башня, список ударов, настройки
function pxCanvas(str, s = 1, col = '#ffffff', maxW = 0, align = 'left') {
  const words = String(str).split(' '), lines = [];
  if (maxW) { let cur = ''; for (const w of words) { const tst = cur ? cur + ' ' + w : w; if (textWidth(tst, s) > maxW && cur) { lines.push(cur); cur = w; } else cur = tst; } if (cur) lines.push(cur); }
  else lines.push(String(str));
  const sps = lines.map(l => textSprite(l, s, col));
  const w = Math.max(...sps.map(p => p.width)), lh = 7 * s + 3 + Math.ceil(s / 2), h = lh * (sps.length - 1) + sps[sps.length - 1].height;
  const [cv, c] = mkCanvas(w, h);
  sps.forEach((p, i) => c.drawImage(p, align === 'center' ? Math.round((w - p.width) / 2) : align === 'right' ? w - p.width : 0, i * lh));
  cv.style.width = (w / 10) + 'em'; cv.style.height = (h / 10) + 'em'; cv.className = 'px';
  return cv;
}
const _portraits = {};
function portrait(ch, size = 32) {
  const key = ch.id + size;
  if (!_portraits[key] && typeof renderPortrait === 'function') {
    const src = renderPortrait(ch, 96), [cv, c] = mkCanvas(size * 2, size * 2);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(src, 0, 0, size * 2, size * 2);
    _portraits[key] = cv;
  }
  if (!_portraits[key]) {
    const R = new Raster(SPR_W, SPR_H);
    renderFighter(R, ch, stanceOf(ch), { anim: 0 });
    const [cv, c] = mkCanvas(size, size);
    const top = ch.headless ? SPR_OY - 72 : SPR_OY - 72;
    const k = R.cv.width / SPR_W;
    c.drawImage(R.cv, (SPR_OX - size / 2 + 2) * k, top * k, size * k, size * k, 0, 0, size, size);
    _portraits[key] = cv;
  }
  const src = _portraits[key], [cv, c] = mkCanvas(src.width, src.height); c.drawImage(src, 0, 0);
  cv.style.width = (size / 10) + 'em'; cv.style.height = (size / 10) + 'em'; cv.className = 'px';
  return cv;
}
function el(tag, cls, parent, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); if (html != null) e.innerHTML = html; return e; }
const IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
// экранные кнопки: по выбору игрока (ПК / телефон), до выбора — по типу устройства
const usePhone = () => Settings.device ? Settings.device === 'phone' : IS_TOUCH;

const UI = {
  cur: null, prev: null, focus: 0, items: [], S: {},
  init() {
    this.root = document.getElementById('ui');
    for (const k of ['device', 'menu', 'modes', 'select', 'arena', 'tower', 'moves', 'controls', 'settings', 'pause', 'result', 'ending']) { const e = el('div', 'scr', this.root); e.id = 's-' + k; this.S[k] = { el: e }; }
    this.buildMenu(); this.buildModes(); this.buildSelect(); this.buildArena(); this.buildMoves(); this.buildControls(); this.buildSettings(); this.buildPause(); this.buildDevice();
    this.buildTouch();
    document.getElementById('game').addEventListener('pointerdown', () => { if (Game.phase === 'victory' && !Game.demo && Game.pt > 120 && !this.cur) Game.endMatch(); });
  },
  active() { return !!this.cur; },
  show(name, arg) {
    for (const k in this.S) this.S[k].el.classList.toggle('on', k === name);
    if (this.cur && this.cur !== name) this.prev = this.cur;
    this.cur = name;
    const sc = this.S[name];
    if (sc.onShow) sc.onShow(arg);
    this.refreshItems(); this.setFocus(sc.defFocus || 0);
    document.getElementById('touch').classList.remove('on'); if (this.hudEl) this.hudEl.classList.remove('on');
  },
  hide() { for (const k in this.S) this.S[k].el.classList.remove('on'); this.cur = null; this.updTouch(); },
  refreshItems() { this.items = [...this.S[this.cur].el.querySelectorAll('.btn')].filter(b => !b.classList.contains('dis') && b.offsetParent !== null); },
  setFocus(i) {
    if (!this.items.length) return;
    this.focus = (i + this.items.length) % this.items.length;
    this.items.forEach((b, j) => b.classList.toggle('foc', j === this.focus));
  },
  btn(parent, label, fn, cls = '') {
    const b = el('div', 'btn ' + cls, parent);
    b.appendChild(pxCanvas(label, cls.includes('big') ? 3 : 2, ['#fff6d0', '#ffc040']));
    b.onclick = e => { e.stopPropagation(); Sound.init(); Sound.play('select'); fn(); };
    b.onpointerenter = () => { const i = this.items.indexOf(b); if (i >= 0 && i !== this.focus) { this.setFocus(i); } };
    return b;
  },
  // наезд камеры в экран автомата
  enterArcade(cb) {
    if (this.zooming) return;
    this.zooming = true; this.S.menu.el.classList.add('fade'); Sound.sting('swell');
    setTimeout(() => { this.zooming = false; this.S.menu.el.classList.remove('fade'); cb(); }, 430);
  },
  handle(q, raw) {
    if (this.zooming) return;
    if (this.cur === 'menu') for (const m of q) Cabinet.nudge(m);
    const sc = this.S[this.cur];
    if (sc.handle && sc.handle(q, raw)) return;
    for (const m of q) {
      if (m === 'up' || (m === 'left' && !sc.lr)) { this.setFocus(this.focus - 1); Sound.play('move'); }
      else if (m === 'down' || (m === 'right' && !sc.lr)) { this.setFocus(this.focus + 1); Sound.play('move'); }
      else if ((m === 'left' || m === 'right') && sc.lr) { sc.lr(this.items[this.focus], m === 'left' ? -1 : 1); }
      else if (m === 'ok' || m === 'ok2') { const b = this.items[this.focus]; if (b) b.click(); }
      else if ((m === 'back' || m === 'pause') && sc.back) { Sound.play('back'); sc.back(); }
    }
  },
  tick() { const sc = this.cur && this.S[this.cur]; if (sc && sc.tick) sc.tick(); },
  // ---------- главное меню ----------
  buildMenu() {
    const S = this.S.menu, e = el('div', 'cabscreen', S.el);
    const logo = el('div', 'logo', e);
    logo.appendChild(pxCanvas('БРЕЙНРОТ', 4, ['#fff3a0', '#ff8a1a', '#c01010']));
    logo.appendChild(pxCanvas('КОМБАТ', 5, ['#ffffff', '#ffd040', '#a04010']));
    logo.appendChild(pxCanvas('ПИКСЕЛЬНЫЙ ФАЙТИНГ С ФАТАЛИТИ', 1, '#ffd0c0'));
    const col = el('div', 'menu-col', e);
    this.btn(col, 'ИГРАТЬ', () => this.enterArcade(() => this.showModes(null)), 'big');
    this.btn(col, 'СПИСОК УДАРОВ', () => this.enterArcade(() => this.show('moves')), 'big');
    this.btn(col, 'УПРАВЛЕНИЕ', () => this.enterArcade(() => this.show('controls')), 'big');
    this.btn(col, 'НАСТРОЙКИ', () => this.enterArcade(() => this.show('settings')), 'big');
    S.stats = el('div', 'stats', e);
    S.onShow = () => { S.stats.innerHTML = ''; S.stats.appendChild(pxCanvas('ПОБЕД: ' + Store.get('wins', 0) + '    ФАТАЛИТИ: ' + Store.get('fatalities', 0), 1, '#c0a0a0')); };
  },
  // ---------- выбор режима (из меню и после каждого боя) ----------
  buildModes() {
    const S = this.S.modes, e = S.el;
    S.head = el('div', 'mhead2', e);
    const row = el('div', 'mcards', e); S.cards = [];
    const defs = [['tower', 'БАШНЯ', '6 БОЁВ ПОДРЯД И БОСС'], ['cpu', 'БОЙ С БОТОМ', 'ОДИН НА ОДИН С КОМПЬЮТЕРОМ'], ['2p', 'ДВА ИГРОКА', 'НА ОДНОЙ КЛАВИАТУРЕ']];
    for (const [mode, name, desc] of defs) {
      const c = el('div', 'btn mcard', row); c._mode = mode;
      const [cv] = mkCanvas(128, 96); cv.className = 'px mart'; c.appendChild(cv); c._cv = cv;
      c.appendChild(pxCanvas(name, 2, ['#fff6d0', '#ffc040']));
      c.appendChild(pxCanvas(desc, 1, '#d0b8b0', 124, 'center'));
      c.onclick = e2 => { if (e2) e2.stopPropagation(); Sound.init(); Sound.play('select'); this.pickMode(mode); };
      c.onpointerenter = () => { const i = this.items.indexOf(c); if (i >= 0 && i !== this.focus) this.setFocus(i); };
      S.cards.push(c);
    }
    S.btns = el('div', 'mbtns', e);
    // отдельный выбор сложности после «БОЙ С БОТОМ»
    S.dp = el('div', 'mdiff', e);
    S.dp.appendChild(pxCanvas('СЛОЖНОСТЬ БОТА', 3, ['#fff6c0', '#ffb030'], 0, 'center'));
    const dr = el('div', 'mdrow', S.dp);
    for (const [v, lab, sub, col] of [[1, 'ЛЕГКО', 'ДЛЯ РАЗМИНКИ', ['#d0ffd0', '#40c040']], [2, 'НОРМА', 'ЧЕСТНЫЙ БОЙ', ['#fff6c0', '#ffb030']], [3, 'НЕВОЗМОЖНО', 'БОТ ЧИТАЕТ КАЖДЫЙ УДАР', ['#ffd0c0', '#e02010']]]) {
      const b = el('div', 'btn mdbtn', dr); b._v = v;
      b.appendChild(pxCanvas(lab, 3, col)); b.appendChild(pxCanvas(sub, 1, '#d0b8b0', 0, 'center'));
      b.onclick = e2 => { if (e2) e2.stopPropagation(); Sound.init(); Sound.play('select'); this.diffPicked(v); };
      b.onpointerenter = () => { const i = this.items.indexOf(b); if (i >= 0 && i !== this.focus) this.setFocus(i); };
    }
    S.R = new Raster(SPR_W, SPR_H); S.t = 0;
    S.tick = () => this.modesTick();
  },
  // r — результат матча (или null, если открыто из меню)
  diffClose() { const S = this.S.modes; S.diffOn = false; S.el.classList.remove('dsel'); S.back = S.back0; this.refreshItems(); this.setFocus(1); },
  diffPicked(v) { const S = this.S.modes; Settings.diff = v; saveSettings(); S.el.classList.remove('dsel'); S.back = S.back0; S.diffOn = true; this.pickMode('cpu'); },
  showModes(r) {
    const S = this.S.modes; S.res = r; S.diffOn = false; S.el.classList.remove('dsel'); Sound.setQuiet(true); Sound.say('Выбери режим');
    S.head.innerHTML = ''; S.btns.innerHTML = '';
    if (r) {
      S.head.appendChild(pxCanvas(r.title, 3, r.col, 0, 'center'));
      S.head.appendChild(pxCanvas(r.sub || 'ВЫБЕРИ РЕЖИМ ДЛЯ СЛЕДУЮЩЕГО БОЯ', 1, r.sub ? '#ff8a7a' : '#d0c0c0', 0, 'center'));
      for (const [label, fn] of r.actions) this.btn(S.btns, label, fn);
    } else {
      S.head.appendChild(pxCanvas('ВЫБЕРИ РЕЖИМ', 3, ['#fff6c0', '#ffb030'], 0, 'center'));
      this.btn(S.btns, 'НАЗАД', () => this.show('menu'));
    }
    S.back = r ? null : () => this.show('menu');
    S.defFocus = 0;
    this.show('modes');
    Sound.sting('swell');
  },
  pickMode(mode) {
    const S = this.S.modes;
    if (mode === 'cpu' && !S.diffOn) {
      S.diffOn = true; S.el.classList.add('dsel'); S.back0 = S.back; S.back = () => this.diffClose();
      Sound.say('Выбери сложность'); this.refreshItems(); this.setFocus((Settings.diff || 2) - 1); return;
    }
    S.diffOn = false;
    if (S.res) YA.showAd(() => { Game.paused = false; Sound.mute('pause', false); YA.gameStop(); Game.startDemo(); this.startSelect(mode); });
    else this.startSelect(mode);
  },
  modesTick() {
    const S = this.S.modes, t = ++S.t, R = S.R;
    const p1 = CHARS[Store.get('last1', 0)] || CHARS[0], p2 = CHARS[Store.get('last2', 6)] || CHARS[6];
    const fighter = (c, ch, x, gy, flip, pose, opt) => {
      renderFighter(R, ch, pose, Object.assign({ anim: t }, opt || {}));
      c.save(); c.translate(x, gy); if (flip) c.scale(-1, 1); c.drawImage(R.cv, -SPR_OX, -SPR_OY, SPR_W, SPR_H); c.restore();
    };
    for (const card of S.cards) {
      const c = card._cv.getContext('2d'), W2 = 128, H2 = 96, foc = card.classList.contains('foc');
      c.imageSmoothingEnabled = false;
      if (card._mode === 'tower') {
        ditherV(c, 0, 0, W2, H2, ['#120820', '#3a1440', '#a0401a']);
        // луна и звёзды
        pdisk(c, 100, 18, 9, '#ffe8b0'); pdisk(c, 103, 16, 8, '#3a1440');
        for (let i = 0; i < 14; i++) { if ((i * 7 + (t >> 4)) % 5) { c.fillStyle = '#fff6d0'; c.fillRect((i * 37) % W2, (i * 23) % 40, 1, 1); } }
        // башня
        const tx = 74;
        c.fillStyle = '#1a0c18'; c.fillRect(tx - 15, 22, 30, 74); c.fillRect(tx - 19, 18, 38, 6);
        for (let i = -19; i < 19; i += 6) c.fillRect(tx + i, 13, 4, 5);
        c.fillStyle = '#2e1828'; for (let y = 26; y < 96; y += 6) for (let x = tx - 14 + ((y / 6) & 1) * 4; x < tx + 13; x += 8) c.fillRect(x, y, 6, 1);
        for (let i = 0; i < 4; i++) { const on = ((t >> 3) + i) % 7 !== 0; c.fillStyle = on ? '#ffc040' : '#5a2a10'; c.fillRect(tx - 3, 30 + i * 15, 6, 8); c.fillStyle = on ? '#fff3a0' : '#3a1a10'; c.fillRect(tx - 2, 31 + i * 15, 2, 3); }
        // пламя на вершине
        for (let i = 0; i < 6; i++) { const fx = tx + Math.sin(t * 0.3 + i) * 5, fy = 10 - ((t * 0.7 + i * 5) % 14); c.fillStyle = ['#fff3a0', '#ffb030', '#ff5a1a', '#c01010'][i % 4]; c.fillRect(Math.round(fx), Math.round(fy), 3, 3); }
        if (t % 90 < 4) { bolt(c, tx + 30, 0, tx + 8, 18, '#e0f0ff', 6, 6, 1); }
        c.fillStyle = '#0c0610'; c.fillRect(0, 90, W2, 6);
        fighter(c, p1, 30, 92, false, ANIM.idle(p1, t));
      } else if (card._mode === 'cpu') {
        ditherV(c, 0, 0, W2, H2, ['#0a0612', '#2a0a14', '#5a1010']);
        c.globalAlpha = 0.25; c.fillStyle = '#ff2a2a'; for (let y = 0; y < H2; y += 4) c.fillRect(0, y + ((t >> 1) % 4), W2, 1); c.globalAlpha = 1;
        c.fillStyle = '#140608'; c.fillRect(0, 88, W2, 8);
        const op = CHARS[(Math.floor(t / 80) + 3) % CHARS.length];
        fighter(c, p1, 34, 90, false, ANIM.idle(p1, t));
        fighter(c, op, 94, 90, true, ANIM.idle(op, t + 20), { tint: 'shadow', tintK: 0.92 });
        // горящие глаза бота
        const blink = (t % 70) < 3; if (!blink) { c.fillStyle = '#ff3a2a'; c.fillRect(88, 31, 3, 1); c.fillRect(93, 31, 3, 1); c.globalAlpha = 0.4; c.fillRect(86, 30, 12, 3); c.globalAlpha = 1; }
        c.fillStyle = '#1a2a1a'; c.fillRect(100, 4, 24, 12); c.fillStyle = '#3aff6a'; drawText(c, 'CPU', 112, 10, 1, '#3aff6a');
      } else {
        // два игрока: диагональ огня и льда
        for (let y = 0; y < H2; y++) { const sp = 64 + (y - 48) * 0.4; c.fillStyle = '#3a1008'; c.fillRect(0, y, Math.round(sp), 1); c.fillStyle = '#081a3a'; c.fillRect(Math.round(sp), y, W2 - Math.round(sp), 1); }
        c.globalAlpha = 0.5; for (let i = 0; i < 10; i++) { c.fillStyle = '#ff6a1a'; c.fillRect((i * 13 + t) % 64, 90 - ((i * 29 + t * 2) % 90), 1, 2); c.fillStyle = '#4ad0ff'; c.fillRect(64 + (i * 17 + t) % 64, 90 - ((i * 31 + t * 2) % 90), 1, 2); } c.globalAlpha = 1;
        c.fillStyle = '#0a060a'; c.fillRect(0, 88, W2, 8);
        fighter(c, p1, 36, 90, false, ANIM.idle(p1, t));
        fighter(c, p2, 92, 90, true, ANIM.idle(p2, t + 15));
        const k = 1 + Math.sin(t * 0.15) * 0.1; drawText(c, 'VS', 64, 50, k > 1.05 ? 3 : 2, ['#ffffff', '#ffd040', '#e02010']);
        drawText(c, 'P1', 10, 8, 1, '#ff9a7a'); drawText(c, 'P2', 118, 8, 1, '#8ad0ff');
      }
      if (!foc) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, 0, W2, H2); }
    }
  },
  // ---------- выбор бойца ----------
  buildSelect() {
    const S = this.S.select, e = S.el;
    S.title = el('div', 'sel-title', e);
    S.side = [el('div', 'side left', e), el('div', 'side right', e)];
    S.prev = [];
    S.side.forEach((sd, i) => {
      const tag = el('div', 'ptag', sd); S['tag' + i] = tag;
      const [cv] = mkCanvas(160, 160); cv.className = 'px prev'; sd.appendChild(cv); S.prev.push(cv);
      S['info' + i] = el('div', 'info', sd);
    });
    const grid = el('div', 'grid', e); S.cells = [];
    // ряды: герои по 5 в ряд, затем брейнрот-мемы и «случайный»
    const heroes = CHARS.map((c, i) => i).filter(i => !CHARS[i].meme), memes = CHARS.map((c, i) => i).filter(i => CHARS[i].meme);
    S.rows = []; for (let i = 0; i < heroes.length; i += 6) S.rows.push(heroes.slice(i, i + 6));
    S.rows.push(memes.concat([CHARS.length]));
    const rowEl = {};
    S.rows.forEach((row, ri) => {
      if (ri === 0) el('div', 'glab', grid).appendChild(pxCanvas('ГЕРОИ РАЗНЫХ МИРОВ', 1, '#ffd0a0'));
      if (ri === S.rows.length - 1) el('div', 'glab', grid).appendChild(pxCanvas('ИТАЛЬЯНСКИЙ БРЕЙНРОТ', 1, '#a0e0ff'));
      const r = el('div', 'grow', grid); for (const i of row) rowEl[i] = r;
    });
    const list = CHARS.concat([null]);
    list.forEach((ch, i) => {
      const c = el('div', 'cell', rowEl[i]);
      if (ch) c.appendChild(portrait(ch, 30)); else c.appendChild(pxCanvas('?', 3, ['#ffffff', '#ffd040']));
      c.onclick = () => { Sound.init(); this.selClick(i); };
      S.cells.push(c);
    });
    S.hint = el('div', 'hint', e);
    const bb = el('div', 'backbtn', e); this.btn(bb, 'НАЗАД', () => this.selBack());
    S.R = new Raster(SPR_W, SPR_H);
    S.handle = (q, raw) => { if (S.going) return true; this.selInput(raw); for (const m of q) if (m === 'back') this.selBack(); return true; };
    S.tick = () => this.selTick();
  },
  startSelect(mode) {
    this.mode = mode;
    const S = this.S.select;
    S.cur = [Store.get('last1', 0), Store.get('last2', 6)].map(i => i <= CHARS.length ? i : 0); S.lock = [false, false]; S.step = 0; S.t = 0; S.rnd = [null, null]; S.going = false;
    S.title.innerHTML = ''; S.title.appendChild(pxCanvas(mode === 'tower' ? 'БАШНЯ: ВЫБЕРИ БОЙЦА' : mode === '2p' ? 'ДВА ИГРОКА' : 'БОЙ С БОТОМ', 3, ['#fff6c0', '#ffb030']));
    S.hint.innerHTML = '';
    const K1 = KEYS[0], K2 = KEYS[1], dirs = K => keyName(K.u) + keyName(K.l) + keyName(K.d) + keyName(K.r);
    S.hint.appendChild(pxCanvas(mode === '2p' ? 'ИГРОК 1: ' + dirs(K1) + ' + ' + keyName(K1.p) + '. ИГРОК 2: ' + dirs(K2) + ' + ' + keyName(K2.p) + '.' : 'СТРЕЛКИ ИЛИ ' + dirs(K1) + ' - ВЫБОР. ENTER ИЛИ ' + keyName(K1.p) + ' - ПОДТВЕРДИТЬ.', 1, '#c0b0b0', 300, 'center'));
    S.side[1].style.visibility = mode === 'tower' ? 'hidden' : 'visible';
    Sound.say('Выбери бойца');
    this.show('select');
    this.selRefresh();
  },
  selActive() { const S = this.S.select; return this.mode === '2p' ? null : S.step; },
  selMove(p, dx, dy) {
    const S = this.S.select; if (S.lock[p]) return;
    const rows = S.rows; let row = rows.findIndex(r => r.includes(S.cur[p])); if (row < 0) row = 0;
    let col = rows[row].indexOf(S.cur[p]); if (col < 0) col = 0;
    if (dy) { row = clamp(row + dy, 0, rows.length - 1); col = Math.min(col, rows[row].length - 1); }
    if (dx) { const n = rows[row].length; col = (col + dx + n) % n; }
    S.cur[p] = rows[row][col]; Sound.play('move'); this.selRefresh();
  },
  selConfirm(p) {
    const S = this.S.select; if (S.lock[p]) return;
    let i = S.cur[p];
    if (i === CHARS.length) { i = randi(0, CHARS.length - 1); S.rnd[p] = i; } else S.rnd[p] = null;
    S.lock[p] = true; S.pick = S.pick || []; S.pick[p] = CHARS[i]; (S.lockT = S.lockT || [])[p] = S.t;
    Sound.play('select');
    Store.set(p ? 'last2' : 'last1', S.cur[p]);
    const both = this.mode === 'tower' || (S.lock[0] && S.lock[1]);
    if (both) S.going = true;
    // имя звучит полностью; следующий экран — только после того, как диктор договорит
    this.sayQ(CHARS[i].name + '!', 'name', both ? () => {
      if (this.cur !== 'select') return;
      if (this.mode === 'tower') this.startTower(S.pick[0]);
      else this.showArena({ mode: this.mode, p1: S.pick[0], p2: S.pick[1], ai2: this.mode === 'cpu' ? Settings.diff : null });
    } : null);
    if (this.mode === 'cpu' && p === 0) { S.step = 1; if (S.cur[1] === S.cur[0]) S.cur[1] = (S.cur[0] + 1) % CHARS.length; }
    this.selRefresh();
  },
  // очередь фраз диктора: следующая начинается, когда закончилась предыдущая
  sayQ(text, sting, cb) {
    const run = () => {
      this.vBusy = true;
      let done = false;
      const fin = () => { if (done) return; done = true; this.vBusy = false; if (cb) cb(); const n = this.vq.shift(); if (n) n(); };
      const est = Sound.sayDur ? Sound.sayDur(text) : 700 + text.length * 70;
      setTimeout(fin, est + 2500);
      Sound.say(text, sting, () => setTimeout(fin, 250));
      if (!Settings.voice) setTimeout(fin, 400);
    };
    this.vq = this.vq || [];
    if (this.vBusy) this.vq.push(run); else run();
  },
  selBack() {
    const S = this.S.select; if (S.going) return;
    if (this.mode === 'cpu' && S.step === 1 && !S.lock[1]) { S.step = 0; S.lock[0] = false; this.selRefresh(); return; }
    if (S.lock[1] && this.mode === '2p') { S.lock[1] = false; this.selRefresh(); return; }
    if (S.lock[0] && this.mode === '2p') { S.lock[0] = false; this.selRefresh(); return; }
    this.show('menu');
  },
  selClick(i) {
    const S = this.S.select;
    const p = this.mode === '2p' ? (S.lock[0] ? 1 : 0) : S.step;
    if (S.lock[p]) return;
    if (S.cur[p] === i) this.selConfirm(p); else { S.cur[p] = i; Sound.play('move'); this.selRefresh(); }
  },
  selInput(raw) {
    const two = this.mode === '2p', S = this.S.select;
    const K1 = KEYS[0], K2 = KEYS[1];
    const P1 = { [K1.u]: [0, -1], [K1.d]: [0, 1], [K1.l]: [-1, 0], [K1.r]: [1, 0], 'P0:up': [0, -1], 'P0:down': [0, 1], 'P0:left': [-1, 0], 'P0:right': [1, 0] };
    const P2 = { [K2.u]: [0, -1], [K2.d]: [0, 1], [K2.l]: [-1, 0], [K2.r]: [1, 0], 'P1:up': [0, -1], 'P1:down': [0, 1], 'P1:left': [-1, 0], 'P1:right': [1, 0] };
    if (!two) Object.assign(P1, { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0] });
    const OK1 = [K1.p, K1.k, 'Space', 'P0:ok'], OK2 = [K2.p, K2.k, 'Enter', 'NumpadEnter', 'Numpad1', 'P1:ok'];
    for (const k of raw) {
      let p = null, d = null, ok = false;
      if (P1[k]) { p = 0; d = P1[k]; } else if (P2[k]) { p = 1; d = P2[k]; } else if (OK1.includes(k)) { p = 0; ok = true; } else if (OK2.includes(k)) { p = 1; ok = true; }
      if (p == null) continue;
      if (!two) p = S.step;
      if (d) this.selMove(p, d[0], d[1]); else if (ok) this.selConfirm(p);
    }
  },
  selRefresh() {
    const S = this.S.select;
    S.cells.forEach((c, i) => {
      const a = S.cur[0] === i && (this.mode === '2p' || S.step === 0 || S.lock[0]), b = S.cur[1] === i && (this.mode === '2p' || S.step === 1);
      c.classList.toggle('p1', a); c.classList.toggle('p2', b); c.classList.toggle('lk', (a && S.lock[0]) || (b && S.lock[1]));
    });
    for (let p = 0; p < 2; p++) {
      const i = S.lock[p] && S.rnd[p] != null ? S.rnd[p] : S.cur[p], ch = CHARS[i] || null, info = S['info' + p];
      S['tag' + p].innerHTML = '';
      S['tag' + p].appendChild(pxCanvas(this.mode === 'cpu' && p === 1 ? 'СОПЕРНИК' : 'ИГРОК ' + (p + 1), 1, p ? '#8ad0ff' : '#ff9a7a'));
      info.innerHTML = '';
      if (ch) {
        info.appendChild(pxCanvas(ch.name, ch.name.length > 12 ? 1 : 2, ['#fff6c0', '#ffb030'], 112, p ? 'right' : 'left'));
        info.appendChild(pxCanvas(ch.title + ', ' + ch.world, 1, '#ffd0c0', 92, p ? 'right' : 'left'));
        info.appendChild(pxCanvas(ch.desc, 1, '#c8b8c0', 108, p ? 'right' : 'left'));
      } else info.appendChild(pxCanvas('СЛУЧАЙНЫЙ БОЕЦ', 2, ['#fff6c0', '#ffb030'], 112, p ? 'right' : 'left'));
      if (S.lock[p]) info.appendChild(pxCanvas('ГОТОВ!', 2, ['#a8ffb0', '#22a034'], 112, p ? 'right' : 'left'));
    }
  },
  selTick() {
    const S = this.S.select; S.t++;
    for (let p = 0; p < 2; p++) {
      const i = S.lock[p] && S.rnd[p] != null ? S.rnd[p] : S.cur[p];
      const cv = S.prev[p], c = cv.getContext('2d');
      let ch = CHARS[i];
      if (!ch) ch = CHARS[Math.floor(S.t / 8) % CHARS.length];
      this.drawAvatar(c, ch, S, p, !CHARS[i]);
    }
  },
  // квадратная аватарка: фон в цветах бойца, лучи, рамка
  drawAvatar(c, ch, S, p, rnd) {
    const t = S.t, N = 100, col = rnd ? '#8a8a9a' : ch.pal.fx || '#ffb030', lock = S.lock[p];
    c.setTransform(c.canvas.width / N, 0, 0, c.canvas.width / N, 0, 0);
    c.imageSmoothingEnabled = false;
    ditherV(c, 0, 0, N, N, ['#08040c', mix('#08040c', col, 0.25), mix('#140810', col, 0.55)]);
    c.save(); c.globalAlpha = lock ? 0.35 : 0.16; c.fillStyle = mix(col, '#ffffff', 0.4);
    for (let k = 0; k < 10; k++) { const a = t * 0.01 + k * 0.628; c.beginPath(); c.moveTo(50, 62); c.lineTo(50 + Math.cos(a) * 120, 62 + Math.sin(a) * 120); c.lineTo(50 + Math.cos(a + 0.22) * 120, 62 + Math.sin(a + 0.22) * 120); c.fill(); }
    c.restore();
    c.globalAlpha = 0.5; pdisk(c, 50, 58, 30 + Math.sin(t * 0.08) * 2, mix(col, '#000000', 0.35)); c.globalAlpha = 0.35; pdisk(c, 50, 58, 22, mix(col, '#ffffff', 0.2)); c.globalAlpha = 1;
    c.globalAlpha = 0.45; c.fillStyle = '#000'; c.fillRect(32, 93, 36, 3); c.fillRect(36, 92, 28, 5); c.globalAlpha = 1;
    if (typeof renderPortrait === 'function') {
      // детальный пиксельный портрет лица; лёгкое «дыхание» и вспышка при выборе
      const P = renderPortrait(ch, 160), K = c.canvas.width / N, bob = Math.round(Math.sin(t * 0.06) * 1.5);
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      if (p === 1) { c.translate(c.canvas.width, 0); c.scale(-1, 1); }
      if (rnd) { c.globalAlpha = 0.9; c.filter = 'brightness(0) opacity(.85)'; }
      c.drawImage(P, Math.round((c.canvas.width - 160) / 2), c.canvas.height - 160 + 4 * K + bob);
      c.filter = 'none'; c.restore();
    } else {
      const pose = lock ? ANIM.victory(ch, t) : ANIM.idle(ch, t);
      renderFighter(S.R, ch, pose, { anim: t, tint: rnd ? 'shadow' : null, tintK: 0.85 });
      const k = S.R.cv.width / SPR_W;
      c.save(); if (p === 1) { c.translate(N, 0); c.scale(-1, 1); }
      c.drawImage(S.R.cv, (SPR_OX - 50) * k, (SPR_OY - 92) * k, N * k, 96 * k, 0, 0, N, 96); c.restore();
    }
    if (lock && S.lockT && S.lockT[p] != null && t - S.lockT[p] < 12) { c.globalAlpha = (12 - (t - S.lockT[p])) / 12 * 0.7; c.fillStyle = '#ffffff'; c.fillRect(0, 0, N, N); c.globalAlpha = 1; }
    if (rnd) drawText(c, '?', 50, 46, 5, ['#ffffff', '#ffd040']);
    // рамка с заклёпками
    c.fillStyle = '#000'; c.fillRect(0, 0, N, 3); c.fillRect(0, N - 3, N, 3); c.fillRect(0, 0, 3, N); c.fillRect(N - 3, 0, 3, N);
    const gold = lock ? '#ffe070' : '#c08a30';
    c.fillStyle = gold; c.fillRect(1, 1, N - 2, 1); c.fillRect(1, N - 2, N - 2, 1); c.fillRect(1, 1, 1, N - 2); c.fillRect(N - 2, 1, 1, N - 2);
    c.fillStyle = p ? '#3aa8ff' : '#ff6a3a'; c.fillRect(3, 3, N - 6, 1); c.fillRect(3, N - 4, N - 6, 1);
    for (const [x, y] of [[4, 4], [N - 6, 4], [4, N - 6], [N - 6, N - 6]]) { c.fillStyle = gold; c.fillRect(x, y, 2, 2); c.fillStyle = '#fff6c0'; c.fillRect(x, y, 1, 1); }
    c.globalAlpha = 0.08; c.fillStyle = '#fff'; for (let y = 4; y < N - 4; y += 2) c.fillRect(4, y, N - 8, 1); c.globalAlpha = 1;
  },
  // ---------- выбор арены ----------
  buildArena() {
    const S = this.S.arena, e = S.el;
    el('div', 'sel-title', e).appendChild(pxCanvas('ВЫБЕРИ АРЕНУ', 3, ['#fff6c0', '#ffb030']));
    const [pv] = mkCanvas(W, H); pv.className = 'px aprev'; e.appendChild(pv); S.pv = pv;
    S.name = el('div', 'aname', e);
    const grid = el('div', 'agrid', e); S.cells = [];
    for (let i = 0; i <= STAGES.length; i++) {
      const c = el('div', 'btn acell', grid);
      const [cv] = mkCanvas(96, 54); cv.className = 'px'; c.appendChild(cv); c._cv = cv; c._i = i;
      c.onclick = ev => { if (ev) ev.stopPropagation(); Sound.init(); if (S.sel === i) this.arenaGo(); else this.arenaSel(i); };
      c.onpointerenter = () => { const k = this.items.indexOf(c); if (k >= 0 && k !== this.focus) { this.setFocus(k); this.arenaSel(i, true); } };
      S.cells.push(c);
    }
    // сложность бота прямо перед боем
    S.diff = el('div', 'adiff', e); S.diff.appendChild(pxCanvas('СЛОЖНОСТЬ', 1, '#8ad0ff', 0, 'center')); S.dbtns = [];
    for (const [v, lab, col] of [[1, 'ЛЕГКО', ['#d0ffd0', '#40c040']], [2, 'НОРМА', ['#fff6c0', '#ffb030']], [3, 'НЕВОЗМОЖНО', ['#ffd0c0', '#e02010']]]) {
      const b = el('div', 'dbtn', S.diff); b.appendChild(pxCanvas(lab, 1, col)); b._v = v;
      b.onclick = ev => { if (ev) ev.stopPropagation(); Sound.init(); Sound.play('select'); this.arenaDiff(v); };
      S.dbtns.push(b);
    }
    S.diff.appendChild(pxCanvas('КЛАВИША K - СМЕНИТЬ', 1, '#a090a0', 0, 'center'));
    const bb = el('div', 'backbtn crow2', e);
    this.btn(bb, 'НАЗАД', () => this.arenaBack());
    this.btn(bb, 'В БОЙ!', () => this.arenaGo());
    S.back = () => this.arenaBack();
    S.handle = q => {
      if (S.going) return true;
      const n = S.cells.length, cols = 8;
      for (const m of q) {
        let i = S.sel;
        if (m === 'left') i = (i + n - 1) % n; else if (m === 'right') i = (i + 1) % n;
        else if (m === 'up') i = i - cols >= 0 ? i - cols : i; else if (m === 'down') i = Math.min(n - 1, i + cols);
        else if (m === 'ok') { this.arenaGo(); continue; }
        else if (m === 'ok2') { if (S.cfg.mode === 'cpu') { Sound.play('move'); this.arenaDiff(Settings.diff % 3 + 1); } continue; }
        else if (m === 'back' || m === 'pause') { Sound.play('back'); this.arenaBack(); continue; }
        if (i !== S.sel) this.arenaSel(i);
      }
      return true;
    };
    S.tick = () => this.arenaTick();
  },
  // миниатюра арены: рисуем фон, не трогая текущую арену демо-боя
  stageThumb(i, cv, t) {
    const c = cv.getContext('2d'), s = STAGES[i], prev = Stage.cur;
    if (!s.data) s.data = s.build();
    if (!this._sbuf) this._sbuf = mkCanvas(W, H);
    const [bc, bx] = this._sbuf, g = this._sg || (this._sg = { camX: (STAGE_W - W) / 2, stageState: {}, flashA: 0, frame: 0, f: [] });
    g.frame = t;
    Stage.cur = s; bx.clearRect(0, 0, W, H);
    try { Stage.drawBg(bx, (STAGE_W - W) / 2, t, g); } catch (err) { }
    Stage.cur = prev;
    c.imageSmoothingEnabled = cv.width < W; c.imageSmoothingQuality = 'high';
    c.drawImage(bc, 0, 0, cv.width, cv.height);
  },
  showArena(cfg) {
    const S = this.S.arena; S.cfg = cfg; S.going = false; S.t = 0;
    S.diff.style.display = cfg.mode === 'cpu' ? 'flex' : 'none'; if (cfg.mode === 'cpu') this.arenaDiff(Settings.diff || 2);
    const last = Store.get('lastStage', STAGES.length); S.sel = last <= STAGES.length ? last : STAGES.length;
    S.cells.forEach((c, i) => {
      if (i < STAGES.length) this.stageThumb(i, c._cv, 0);
      else { const x = c._cv.getContext('2d'); ditherV(x, 0, 0, 96, 54, ['#1a0c24', '#4a1a40', '#8a3a3a']); drawText(x, '?', 48, 27, 4, ['#ffffff', '#ffd040']); }
    });
    S.defFocus = S.sel;
    this.show('arena');
    this.arenaSel(S.sel, true);
  },
  arenaSel(i, silent) {
    const S = this.S.arena; S.sel = i;
    if (!silent) Sound.play('move');
    S.cells.forEach((c, j) => c.classList.toggle('sel', j === i));
    const k = this.items.indexOf(S.cells[i]); if (k >= 0) this.setFocus(k);
    S.name.innerHTML = '';
    S.name.appendChild(pxCanvas(i < STAGES.length ? STAGES[i].name.toUpperCase() : 'СЛУЧАЙНАЯ АРЕНА', 2, ['#fff6c0', '#ffb030'], 0, 'center'));
  },
  arenaDiff(v) {
    const S = this.S.arena; Settings.diff = v; saveSettings(); if (S.cfg && S.cfg.mode === 'cpu') S.cfg.ai2 = v;
    S.dbtns.forEach(b => b.classList.toggle('on', b._v === v));
  },
  arenaTick() {
    const S = this.S.arena; S.t++;
    const i = S.sel;
    if (i < STAGES.length) this.stageThumb(i, S.pv, S.t);
    else if (S.t % 30 === 1) this.stageThumb(randi(0, STAGES.length - 1), S.pv, S.t);
  },
  arenaGo() {
    const S = this.S.arena; if (S.going) return; S.going = true;
    Store.set('lastStage', S.sel); Sound.play('select');
    const stage = S.sel < STAGES.length ? S.sel : randi(0, STAGES.length - 1);
    this.launch(Object.assign({}, S.cfg, { stage }));
  },
  arenaBack() {
    if (this.S.arena.going) return;
    const S = this.S.select; S.lock[1] = false; S.going = false; if (this.mode === 'cpu') S.step = 1;
    this.show('select'); this.selRefresh();
  },
  // ---------- башня ----------
  startTower(ch) {
    const others = CHARS.filter(c => c !== ch);
    for (let i = others.length - 1; i > 0; i--) { const j = randi(0, i); [others[i], others[j]] = [others[j], others[i]]; }
    this.tower = { ch, list: others.slice(0, 6), idx: 0 };
    this.showTower();
  },
  showTower() {
    const T = this.tower, S = this.S.tower, e = S.el; e.innerHTML = '';
    el('div', 'sel-title', e).appendChild(pxCanvas('БАШНЯ ИСПЫТАНИЙ', 3, ['#fff6c0', '#ffb030']));
    const col = el('div', 'tower', e);
    for (let i = T.list.length - 1; i >= 0; i--) {
      const row = el('div', 'trow' + (i === T.idx ? ' cur' : i < T.idx ? ' done' : ''), col);
      row.appendChild(pxCanvas(String(i + 1), 2, '#ffd040'));
      row.appendChild(portrait(T.list[i], 24));
      row.appendChild(pxCanvas(i === T.list.length - 1 ? T.list[i].name + ' (БОСС)' : T.list[i].name, 1, i < T.idx ? '#7a6a6a' : '#ffffff'));
      if (i === T.idx) { const me = el('div', 'tme', row); me.appendChild(pxCanvas('ТЫ', 1, '#ff9a7a')); me.appendChild(portrait(T.ch, 24)); }
      if (i < T.idx) row.appendChild(pxCanvas('ПОБЕЖДЁН', 1, '#a8ffb0'));
    }
    const bc = el('div', 'menu-col low', e);
    this.btn(bc, 'В БОЙ!', () => { const lv = T.idx < 2 ? Math.max(1, Settings.diff - 1) : T.idx < 5 ? Settings.diff : Math.min(3, Settings.diff + 1); this.launch({ mode: 'tower', p1: T.ch, p2: T.list[T.idx], ai2: lv }); });
    this.btn(bc, 'В МЕНЮ', () => this.toMenu());
    this.S.tower.back = () => this.toMenu();
    this.show('tower');
  },
  launch(cfg) {
    YA.showAd(() => { this.hide(); Game.startMatch(cfg); this.updTouch(); });
  },
  toMenu() { Game.paused = false; Sound.mute('pause', false); YA.gameStop(); Game.startDemo(); this.show('menu'); },
  // ---------- результат ----------
  showResult() {
    const r = Game.result; if (!r || r.shown) return; r.shown = true;
    const cfg = Game.cfg, mode = cfg.mode;
    let title, col;
    if (mode === '2p') { title = 'ИГРОК ' + (r.winnerIdx + 1) + ' ПОБЕДИЛ!'; col = ['#fff6c0', '#ffb030']; }
    else if (r.humanWon) { title = 'ПОБЕДА!'; col = ['#a8ffb0', '#22a034']; }
    else { title = 'ПОРАЖЕНИЕ'; col = ['#ffd0c0', '#c01010']; }
    const sub = r.fatal ? 'ФАТАЛИТИ: ' + r.winner.ch.fatal.name : null;
    if (mode === 'tower' && r.humanWon) {
      const T = this.tower; T.idx++;
      const S = this.S.result, e = S.el; e.innerHTML = '';
      const box = el('div', 'rbox', e);
      box.appendChild(pxCanvas(title, 4, col, 0, 'center'));
      if (sub) box.appendChild(pxCanvas(sub, 1, '#ff8a7a', 0, 'center'));
      const bc = el('div', 'menu-col', box);
      if (T.idx >= T.list.length) { Store.set('towers', Store.get('towers', 0) + 1); this.btn(bc, 'ФИНАЛ', () => this.showEnding()); }
      else this.btn(bc, 'СЛЕДУЮЩИЙ БОЙ', () => YA.showAd(() => this.showTower()));
      this.btn(bc, 'ГЛАВНОЕ МЕНЮ', () => YA.showAd(() => this.toMenu()));
      S.back = null;
      this.show('result');
      return;
    }
    const actions = mode === 'tower'
      ? [['ПОВТОРИТЬ БОЙ', () => this.launch(Object.assign({}, cfg))]]
      : [['РЕВАНШ', () => this.launch(Object.assign({}, cfg, { stage: null }))], ['ДРУГИЕ БОЙЦЫ', () => YA.showAd(() => { Game.startDemo(); this.startSelect(mode); })]];
    actions.push(['ГЛАВНОЕ МЕНЮ', () => YA.showAd(() => this.toMenu())]);
    this.showModes({ title, col, sub, actions });
  },
  showEnding() {
    const S = this.S.ending, e = S.el; e.innerHTML = '';
    const box = el('div', 'rbox big', e);
    box.appendChild(pxCanvas('ЧЕМПИОН!', 6, ['#ffffff', '#ffd040', '#c06010'], 0, 'center'));
    box.appendChild(portrait(this.tower.ch, 32)).style.cssText += ';width:6.4em;height:6.4em';
    box.appendChild(pxCanvas(this.tower.ch.name + ' ПРОШЁЛ БАШНЮ ИСПЫТАНИЙ И СТАЛ ЛЕГЕНДОЙ КОМБАТА!', 1, '#ffe8c0', 260, 'center'));
    box.appendChild(pxCanvas('ПРОЙДЕНО БАШЕН: ' + Store.get('towers', 1), 1, '#c0a0a0', 0, 'center'));
    const bc = el('div', 'menu-col', box);
    this.btn(bc, 'ДАЛЬШЕ', () => YA.showAd(() => { Game.startDemo(); this.showModes({ title: 'ЧЕМПИОН!', col: ['#ffffff', '#ffd040', '#c06010'], sub: null, actions: [['ГЛАВНОЕ МЕНЮ', () => this.toMenu()]] }); }));
    Sound.play('win'); Sound.say('Безупречно! Ты... чемпион!', 'big');
    this.show('ending');
  },
  // ---------- пауза ----------
  buildPause() {
    const S = this.S.pause, e = S.el;
    const box = el('div', 'rbox', e);
    box.appendChild(pxCanvas('ПАУЗА', 5, ['#fff6c0', '#ffb030'], 0, 'center'));
    const bc = el('div', 'menu-col', box);
    this.btn(bc, 'ПРОДОЛЖИТЬ', () => { this.hide(); Game.pause(false); });
    this.btn(bc, 'СПИСОК УДАРОВ', () => this.show('moves', Game.f[0] && Game.f[0].ch));
    this.btn(bc, 'УПРАВЛЕНИЕ', () => this.show('controls'));
    this.btn(bc, 'ВЫЙТИ В МЕНЮ', () => YA.showAd(() => this.toMenu()));
    S.back = () => { this.hide(); Game.pause(false); };
  },
  backTo() { this.show(Game.paused ? 'pause' : 'menu'); },
  // ---------- список ударов ----------
  buildMoves() {
    const S = this.S.moves, e = S.el;
    el('div', 'sel-title', e).appendChild(pxCanvas('СПИСОК УДАРОВ', 3, ['#fff6c0', '#ffb030']));
    const tabs = el('div', 'mtabs', e); S.tabs = [];
    CHARS.forEach((ch, i) => { const t = el('div', 'btn mtab', tabs); t.appendChild(portrait(ch, 30)); t.onclick = () => { Sound.play('move'); this.movesSel(i); }; t.onpointerenter = () => { const k = this.items.indexOf(t); if (k >= 0) this.setFocus(k); }; S.tabs.push(t); });
    S.body = el('div', 'mbody', e);
    const mc = el('div', 'mcol', S.body); const [cv] = mkCanvas(180, 192); cv.className = 'px mprev'; mc.appendChild(cv); S.cv = cv; S.head = el('div', 'mhead', mc);
    S.list = el('div', 'mlist', S.body);
    const bb = el('div', 'backbtn', e); this.btn(bb, 'НАЗАД', () => this.backTo());
    S.R = new Raster(SPR_W, SPR_H); S.t = 0; S.sel = 0;
    S.back = () => this.backTo();
    S.onShow = ch => { this.movesSel(ch ? CHARS.indexOf(ch) : S.sel); };
    S.cvScale = 1;
    S.defFocus = 0;
    S.handle = q => {
      for (const m of q) {
        const n = CHARS.length; if (m === 'left' || m === 'up') this.movesSel((S.sel + n - 1) % n); else if (m === 'right' || m === 'down') this.movesSel((S.sel + 1) % n);
        else if (m === 'back' || m === 'ok' || m === 'ok2') { Sound.play('back'); this.backTo(); }
      }
      return true;
    };
    S.tick = () => {
      S.t++;
      const ch = CHARS[S.sel], seq = ['jab', 'cross', 'kick', 'uppercut', 'sweep', 'roundhouse', 'proj', 'idle'], cyc = Math.floor(S.t / 34) % seq.length, k = (S.t % 34) / 34, mv = seq[cyc];
      let pose;
      if (mv === 'idle') pose = ANIM.idle(ch, S.t);
      else if (mv === 'proj') pose = k < 0.3 ? blendPose(stanceOf(ch), mkPose(stanceOf(ch), MOVE_POSES.proj.wind), k / 0.3) : k < 0.7 ? mkPose(POSES.thrust) : blendPose(mkPose(POSES.thrust), stanceOf(ch), (k - 0.7) / 0.3);
      else { const ph = k < 0.25 ? 0 : k < 0.45 ? 1 : 2; pose = movePose(ch, mv, ph === 0 ? k / 0.25 : ph === 2 ? (k - 0.45) / 0.55 : 0, ph); }
      renderFighter(S.R, ch, pose, { anim: S.t });
      const c = S.cv.getContext("2d"), rk = S.R.cv.width / SPR_W; c.imageSmoothingEnabled = false; c.clearRect(0, 0, S.cv.width, S.cv.height); c.drawImage(S.R.cv, (SPR_OX - 38) * rk, (SPR_OY - 92) * rk, 90 * rk, 96 * rk, 0, 0, S.cv.width, S.cv.height);
    };
  },
  movesSel(i) {
    const S = this.S.moves; S.sel = i;
    S.tabs.forEach((t, j) => t.classList.toggle('sel', j === i));
    const ch = CHARS[i], L = S.list; L.innerHTML = '';
    const head = S.head; head.innerHTML = '';
    head.appendChild(pxCanvas(ch.name, ch.name.length > 10 ? 1 : 2, ['#fff6c0', '#ffb030'], 112));
    head.appendChild(pxCanvas(ch.title + ', ' + ch.world, 1, '#ffd0c0', 112));
    head.appendChild(pxCanvas(ch.desc, 1, '#a898a8', 112));
    const arr = s => s.map(x => x === 'F' ? '→' : x === 'B' ? '←' : x === 'D' ? '↓' : '↑').join(' ');
    const sec = (t) => { const d = el('div', 'msec', L); d.appendChild(pxCanvas(t, 1, '#8ad0ff')); };
    const row = (name, inp, col = '#ffffff') => { const r = el('div', 'mrow', L); r.appendChild(pxCanvas(name, 1, col)); r.appendChild(pxCanvas(inp, 1, '#ffd040')); };
    sec('ОСОБЫЕ ПРИЁМЫ');
    row(PROJ[ch.proj].name, '← → + РУКА  (' + keyName(KEYS[0].sp1) + ')');
    row(DASH[ch.dash].name, '↓ → + НОГА  (' + keyName(KEYS[0].sp2) + ')');
    row(uniqueOf(ch).name + ' (КОРОННЫЙ)', '↓ ← + РУКА  (' + keyName(KEYS[0].sp3) + ')', '#ffd040');
    sec('ФАТАЛИТИ (ПРИ «ДОБЕЙ!», ТОЛЬКО СТРЕЛКИ)');
    row(ch.fatal.name, arr(ch.fatal.seq) + '  (ИЛИ ' + keyName(KEYS[0].fat) + ')', '#ff8a7a');
    sec('БАЗОВЫЕ УДАРЫ');
    row('Удар рукой / серия', 'РУКА, РУКА');
    row('Удар ногой', 'НОГА');
    row('Апперкот', '↓ + РУКА');
    row('Подсечка', '↓ + НОГА');
    row('Круговой удар', '← + НОГА');
    row('Разворотный кулак', '← + РУКА');
    row('Удар сверху (пробивает присед)', '→ + РУКА');
    row('Толчок ногой', '→ + НОГА');
    row('Удар в пике', 'В ПРЫЖКЕ ↓ + НОГА');
    row('Бросок (вплотную)', '→ + РУКА');
    row('Удары в прыжке', '↑ ЗАТЕМ РУКА / НОГА');
    row('Блок', 'БЛОК ИЛИ ДЕРЖАТЬ ←');
    row('Комбо', 'РУКА, РУКА, НОГА  ИЛИ  РУКА, РУКА, ↓+РУКА', '#8ad0ff');
    const note = el('div', 'msec', L); note.appendChild(pxCanvas('→ ВПЕРЁД К СОПЕРНИКУ, ← НАЗАД. В СКОБКАХ - БЫСТРАЯ КЛАВИША ИГРОКА 1.', 1, '#a090a0', 250));
    if (this.cur === 'moves') this.items.forEach((b, j) => b.classList.toggle('foc', b === S.tabs[i]));
  },
  // ---------- управление ----------
  buildControls() {
    const S = this.S.controls, e = S.el;
    el('div', 'sel-title', e).appendChild(pxCanvas('УПРАВЛЕНИЕ', 3, ['#fff6c0', '#ffb030']));
    const tb = el('div', 'ctable', e);
    const names = { l: 'ВЛЕВО', r: 'ВПРАВО', u: 'ПРЫЖОК', d: 'ПРИСЕД', p: 'РУКА', k: 'НОГА', b: 'БЛОК', sp1: 'СНАРЯД', sp2: 'РЫВОК', sp3: 'КОРОННЫЙ', fat: 'ФАТАЛИТИ' };
    const pad = { l: 'КРЕСТ ←', r: 'КРЕСТ →', u: 'КРЕСТ ↑', d: 'КРЕСТ ↓', p: 'X', k: 'A', b: 'B / RT', sp1: 'LB', sp2: 'RB', sp3: 'Y', fat: '—' };
    const head = el('div', 'crow chead', tb);
    for (const h of ['ДЕЙСТВИЕ', 'ИГРОК 1', 'ИГРОК 2', 'ГЕЙМПАД']) el('div', 'ccell', head).appendChild(pxCanvas(h, 1, '#8ad0ff'));
    S.cells = [];
    for (const act of ACTIONS) {
      const tr = el('div', 'crow', tb);
      el('div', 'ccell', tr).appendChild(pxCanvas(names[act], 1, '#ffffff'));
      for (const pl of [0, 1]) {
        const b = el('div', 'btn kbtn', tr); b._pl = pl; b._act = act; S.cells.push(b);
        b.onclick = ev => { if (ev) ev.stopPropagation(); Sound.init(); this.ctlCapture(b); };
        b.onpointerenter = () => { const i = this.items.indexOf(b); if (i >= 0) this.setFocus(i); };
      }
      el('div', 'ccell', tr).appendChild(pxCanvas(pad[act], 1, '#a898a8'));
    }
    S.note = el('div', 'cnote', e);
    const bb = el('div', 'backbtn crow2', e);
    this.btn(bb, 'ПО УМОЛЧАНИЮ', () => { resetKeys(); this.ctlRefresh(); });
    this.btn(bb, 'НАЗАД', () => this.backTo());
    S.back = () => this.backTo();
    S.onShow = () => this.ctlRefresh();
  },
  ctlRefresh(waiting) {
    const S = this.S.controls;
    for (const b of S.cells) {
      b.innerHTML = '';
      const w = b === waiting;
      b.classList.toggle('wait', w);
      b.appendChild(pxCanvas(w ? 'НАЖМИ...' : keyName(KEYS[b._pl][b._act]), 1, w ? '#ff8a6a' : '#ffd040'));
    }
    S.note.innerHTML = '';
    S.note.appendChild(pxCanvas(waiting ? 'НАЖМИ НОВУЮ КЛАВИШУ. ESC - ОТМЕНА.' : 'ВЫБЕРИ КЛЕТКУ И НАЖМИ ENTER ИЛИ КЛИКНИ, ЧТОБЫ НАЗНАЧИТЬ КЛАВИШУ.', 1, waiting ? '#ffd0c0' : '#c0b0b0', 400, 'center'));
  },
  ctlCapture(b) {
    this.ctlRefresh(b);
    Input.capture = code => {
      if (code !== 'Escape') { bindKey(b._pl, b._act, code); Sound.play('select'); } else Sound.play('back');
      Input.menuQ = []; Input.rawQ = [];
      this.ctlRefresh();
    };
  },
  // ---------- первый запуск: на чём играем ----------
  buildDevice() {
    const S = this.S.device, e = S.el;
    el('div', 'sel-title', e).appendChild(pxCanvas('НА ЧЁМ ТЫ ИГРАЕШЬ?', 3, ['#fff6c0', '#ffb030']));
    const row = el('div', 'devrow', e);
    for (const [v, lab, sub] of [['pc', 'КОМПЬЮТЕР', 'КЛАВИАТУРА, БЕЗ КНОПОК НА ЭКРАНЕ'], ['phone', 'ТЕЛЕФОН', 'КНОПКИ УПРАВЛЕНИЯ НА ЭКРАНЕ']]) {
      const b = el('div', 'btn mdbtn devbtn', row);
      const [cv, c] = mkCanvas(64, 40); cv.className = 'px devic'; c.imageSmoothingEnabled = false; this.devIcon(c, v); b.appendChild(cv);
      b.appendChild(pxCanvas(lab, 3, ['#fff6d0', '#ffc040'])); b.appendChild(pxCanvas(sub, 1, '#d0b8b0', 0, 'center'));
      b.onclick = e2 => { if (e2) e2.stopPropagation(); Sound.init(); Sound.play('select'); this.pickDevice(v); };
      b.onpointerenter = () => { const i = this.items.indexOf(b); if (i >= 0 && i !== this.focus) this.setFocus(i); };
    }
    el('div', 'devnote', e).appendChild(pxCanvas('ПОМЕНЯТЬ МОЖНО В НАСТРОЙКАХ', 1, '#a090a0', 0, 'center'));
    S.defFocus = IS_TOUCH ? 1 : 0;
  },
  devIcon(c, v) {
    const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    if (v === 'pc') {
      R(10, 2, 44, 26, '#140c18'); R(12, 4, 40, 22, '#3a8ad8'); R(12, 4, 40, 4, '#7ab8f8'); R(28, 28, 8, 4, '#5a5a6a'); R(20, 32, 24, 2, '#8a8a9a');
      R(4, 35, 56, 5, '#5a5a6a'); for (let i = 0; i < 9; i++) R(6 + i * 6, 36, 4, 2, '#d0d0dc');
    } else {
      R(20, 0, 24, 40, '#140c18'); R(22, 2, 20, 34, '#2a2a3a'); R(23, 5, 18, 27, '#3ad8a8'); R(23, 5, 18, 4, '#9affd8'); R(30, 37, 4, 2, '#8a8a9a');
      R(25, 24, 4, 4, '#ffffff'); R(35, 24, 4, 4, '#ff6a3a');
    }
  },
  pickDevice(v) { Settings.device = v; saveSettings(); this.updTouch(); this.show('menu'); },
  // ---------- настройки ----------
  buildSettings() {
    const S = this.S.settings, e = S.el;
    el('div', 'sel-title', e).appendChild(pxCanvas('НАСТРОЙКИ', 3, ['#fff6c0', '#ffb030']));
    const col = el('div', 'menu-col set', e);
    const opts = [
      ['diff', 'СЛОЖНОСТЬ БОТА', [[1, 'ЛЕГКО'], [2, 'НОРМА'], [3, 'НЕВОЗМОЖНО']]],
      ['time', 'ВРЕМЯ РАУНДА', [[60, '60 СЕК'], [99, '99 СЕК'], [0, 'БЕЗ ЛИМИТА']]],
      ['blood', 'КРОВЬ', [[true, 'ВКЛ'], [false, 'ВЫКЛ']]],
      ['music', 'МУЗЫКА', [[true, 'ВКЛ'], [false, 'ВЫКЛ']]],
      ['sfx', 'ЗВУКИ', [[true, 'ВКЛ'], [false, 'ВЫКЛ']]],
      ['voice', 'ГОЛОС ДИКТОРА', [[true, 'ВКЛ'], [false, 'ВЫКЛ']]],
      ['hints', 'ПОДСКАЗКА ФАТАЛИТИ', [[true, 'ВКЛ'], [false, 'ВЫКЛ']]],
      ['device', 'УСТРОЙСТВО', [['pc', 'ПК (БЕЗ КНОПОК)'], ['phone', 'ТЕЛЕФОН (КНОПКИ)']]],
    ];
    if (Settings.hints === undefined) Settings.hints = true;
    const draw = (b, o) => {
      b.innerHTML = '';
      const cur = o[2].find(x => x[0] === Settings[o[0]]) || o[2][0];
      b.appendChild(pxCanvas(o[1], 1, '#ffffff')); b.appendChild(pxCanvas('◀ '.replace('◀', '<') + cur[1] + ' >', 1, '#ffd040'));
    };
    const change = (b, d) => {
      const o = b._o, i = o[2].findIndex(x => x[0] === Settings[o[0]]);
      Settings[o[0]] = o[2][((i < 0 ? 0 : i) + d + o[2].length) % o[2].length][0];
      saveSettings(); Sound.apply(); draw(b, o); Sound.play('move');
    };
    for (const o of opts) { const b = el('div', 'btn srow', col); b._o = o; draw(b, o); b.onclick = () => change(b, 1); b.onpointerenter = () => { const k = this.items.indexOf(b); if (k >= 0) this.setFocus(k); }; }
    S.lr = (b, d) => { if (b && b._o) change(b, d); };
    const bb = el('div', 'backbtn', e); this.btn(bb, 'НАЗАД', () => this.backTo());
    S.back = () => this.backTo();
  },
  // ---------- сенсорное управление ----------
  buildTouch() {
    const T = document.getElementById('touch');
    const stick = el('div', 'stick', T), knob = el('div', 'knob', stick);
    let sid = null;
    const setStick = (e) => {
      const r = stick.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2);
      const t = Input.touch; t.l = dx < -0.35 ? 1 : 0; t.r = dx > 0.35 ? 1 : 0; t.u = dy < -0.5 ? 1 : 0; t.d = dy > 0.45 ? 1 : 0;
      const m = Math.min(1, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
      knob.style.transform = `translate(${Math.cos(a) * m * 60}%, ${Math.sin(a) * m * 60}%)`;
    };
    const clr = () => { sid = null; const t = Input.touch; t.l = t.r = t.u = t.d = 0; knob.style.transform = ''; };
    stick.addEventListener('pointerdown', e => { sid = e.pointerId; stick.setPointerCapture(e.pointerId); setStick(e); e.preventDefault(); });
    stick.addEventListener('pointermove', e => { if (e.pointerId === sid) setStick(e); });
    stick.addEventListener('pointerup', clr); stick.addEventListener('pointercancel', clr);
    const pad = el('div', 'tbtns', T);
    const mk = (cls, label, key) => {
      const b = el('div', 'tb ' + cls, pad); b.appendChild(pxCanvas(label, label.length > 2 ? 1 : 2, '#ffffff'));
      b.addEventListener('pointerdown', e => { Input.touch[key] = 1; b.classList.add('dn'); e.preventDefault(); Sound.init(); });
      const up = () => { Input.touch[key] = 0; b.classList.remove('dn'); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
      return b;
    };
    mk('tp', 'Р', 'p'); mk('tk', 'Н', 'k'); mk('tbk', 'Б', 'b'); mk('ts1', 'СНАРЯД', 'sp1'); mk('ts2', 'РЫВОК', 'sp2'); mk('ts3', 'КОРОНА', 'sp3');
    this.fatBtn = mk('tfat', 'ФАТАЛИТИ', 'fat');
    // кнопки в бою (для мыши и пальца): пауза и список приёмов своего бойца
    const hb = el('div', 'hudbtns', document.getElementById('stage')); this.hudEl = hb;
    const b1 = el('div', 'hbtn', hb); b1.appendChild(pxCanvas('II ПАУЗА', 1, '#ffffff'));
    const b2 = el('div', 'hbtn', hb); b2.appendChild(pxCanvas('ПРИЁМЫ', 1, '#ffd040'));
    b1.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Sound.init(); if (Game.phase === 'victory') Game.endMatch(); else Game.pause(true); });
    b2.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Sound.init(); if (Game.phase === 'victory') return; Game.pause(true); if (Game.paused) this.show('moves', Game.f[0] && Game.f[0].ch); });
    const ps = el('div', 'tpause', T); ps.style.display = 'none'; ps.appendChild(pxCanvas('II', 2, '#ffffff')); ps.addEventListener('pointerdown', e => { e.preventDefault(); if (Game.phase === 'victory') Game.endMatch(); else Game.pause(true); });
  },
  updTouch() {
    const live = Game.state !== 'demo' && Game.cfg && Game.cfg.mode !== 'demo' && !this.cur, on = usePhone() && live;
    document.getElementById('touch').classList.toggle('on', !!on);
    if (this.hudEl) this.hudEl.classList.toggle('on', !!live && Game.state !== 'vs');
  }
};
