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
  if (!_portraits[key]) {
    const R = new Raster(SPR_W, SPR_H);
    renderFighter(R, ch, stanceOf(ch), { anim: 0 });
    const [cv, c] = mkCanvas(size, size);
    const top = ch.headless ? SPR_OY - 72 : SPR_OY - 72;
    c.drawImage(R.cv, SPR_OX - size / 2 + 2, top, size, size, 0, 0, size, size);
    _portraits[key] = cv;
  }
  const [cv, c] = mkCanvas(size, size); c.drawImage(_portraits[key], 0, 0);
  cv.style.width = (size / 10) + 'em'; cv.style.height = (size / 10) + 'em'; cv.className = 'px';
  return cv;
}
function el(tag, cls, parent, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); if (html != null) e.innerHTML = html; return e; }
const IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

const UI = {
  cur: null, prev: null, focus: 0, items: [], S: {},
  init() {
    this.root = document.getElementById('ui');
    for (const k of ['menu', 'select', 'tower', 'moves', 'controls', 'settings', 'pause', 'result', 'ending']) { const e = el('div', 'scr', this.root); e.id = 's-' + k; this.S[k] = { el: e }; }
    this.buildMenu(); this.buildSelect(); this.buildMoves(); this.buildControls(); this.buildSettings(); this.buildPause();
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
    document.getElementById('touch').classList.remove('on');
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
    b.appendChild(pxCanvas(label, 2, ['#fff6d0', '#ffc040']));
    b.onclick = e => { e.stopPropagation(); Sound.init(); Sound.play('select'); fn(); };
    b.onpointerenter = () => { const i = this.items.indexOf(b); if (i >= 0 && i !== this.focus) { this.setFocus(i); } };
    return b;
  },
  handle(q, raw) {
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
    const S = this.S.menu, e = S.el;
    const logo = el('div', 'logo', e);
    logo.appendChild(pxCanvas('БРЕЙНРОТ', 4, ['#fff3a0', '#ff8a1a', '#c01010']));
    logo.appendChild(pxCanvas('КОМБАТ', 5, ['#ffffff', '#ffd040', '#a04010']));
    logo.appendChild(pxCanvas('ПИКСЕЛЬНЫЙ ФАЙТИНГ С ФАТАЛИТИ', 1, '#ffd0c0'));
    const col = el('div', 'menu-col', e);
    this.btn(col, 'БАШНЯ', () => this.startSelect('tower'));
    this.btn(col, 'БОЙ С БОТОМ', () => this.startSelect('cpu'));
    this.btn(col, 'ДВА ИГРОКА', () => this.startSelect('2p'));
    this.btn(col, 'СПИСОК УДАРОВ', () => this.show('moves'));
    this.btn(col, 'УПРАВЛЕНИЕ', () => this.show('controls'));
    this.btn(col, 'НАСТРОЙКИ', () => this.show('settings'));
    S.stats = el('div', 'stats', e);
    S.onShow = () => { S.stats.innerHTML = ''; S.stats.appendChild(pxCanvas('ПОБЕД: ' + Store.get('wins', 0) + '    ФАТАЛИТИ: ' + Store.get('fatalities', 0), 1, '#c0a0a0')); };
  },
  // ---------- выбор бойца ----------
  buildSelect() {
    const S = this.S.select, e = S.el;
    S.title = el('div', 'sel-title', e);
    S.side = [el('div', 'side left', e), el('div', 'side right', e)];
    S.prev = [];
    S.side.forEach((sd, i) => {
      const tag = el('div', 'ptag', sd); S['tag' + i] = tag;
      const [cv] = mkCanvas(80, 96); cv.className = 'px prev'; sd.appendChild(cv); S.prev.push(cv);
      S['info' + i] = el('div', 'info', sd);
    });
    const grid = el('div', 'grid', e); S.cells = [];
    const lab1 = el('div', 'glab', grid); lab1.appendChild(pxCanvas('ГЕРОИ РАЗНЫХ МИРОВ', 1, '#ffd0a0'));
    const r1 = el('div', 'grow', grid);
    const lab2 = el('div', 'glab', grid); lab2.appendChild(pxCanvas('ИТАЛЬЯНСКИЙ БРЕЙНРОТ', 1, '#a0e0ff'));
    const r2 = el('div', 'grow', grid);
    const list = CHARS.concat([null]);
    list.forEach((ch, i) => {
      const c = el('div', 'cell', i < 6 ? r1 : r2);
      if (ch) c.appendChild(portrait(ch, 30)); else c.appendChild(pxCanvas('?', 3, ['#ffffff', '#ffd040']));
      c.onclick = () => { Sound.init(); this.selClick(i); };
      S.cells.push(c);
    });
    S.hint = el('div', 'hint', e);
    const bb = el('div', 'backbtn', e); this.btn(bb, 'НАЗАД', () => this.selBack());
    S.R = new Raster(SPR_W, SPR_H);
    S.handle = (q, raw) => { this.selInput(raw); for (const m of q) if (m === 'back') this.selBack(); return true; };
    S.tick = () => this.selTick();
  },
  startSelect(mode) {
    this.mode = mode;
    const S = this.S.select;
    S.cur = [Store.get('last1', 0), Store.get('last2', 6)]; S.lock = [false, false]; S.step = 0; S.t = 0; S.rnd = [null, null];
    S.title.innerHTML = ''; S.title.appendChild(pxCanvas(mode === 'tower' ? 'БАШНЯ: ВЫБЕРИ БОЙЦА' : mode === '2p' ? 'ДВА ИГРОКА' : 'БОЙ С БОТОМ', 3, ['#fff6c0', '#ffb030']));
    S.hint.innerHTML = '';
    S.hint.appendChild(pxCanvas(mode === '2p' ? 'ИГРОК 1: WASD + F. ИГРОК 2: СТРЕЛКИ + K.' : 'СТРЕЛКИ ИЛИ WASD - ВЫБОР. ENTER ИЛИ F - ПОДТВЕРДИТЬ.', 1, '#c0b0b0', 200, 'center'));
    S.side[1].style.visibility = mode === 'tower' ? 'hidden' : 'visible';
    this.show('select');
    this.selRefresh();
  },
  selActive() { const S = this.S.select; return this.mode === '2p' ? null : S.step; },
  selMove(p, dx, dy) {
    const S = this.S.select; if (S.lock[p]) return;
    let i = S.cur[p], row = i < 6 ? 0 : 1, col = row ? i - 6 : i;
    if (dy) { row = clamp(row + dy, 0, 1); col = Math.min(col, row ? 4 : 5); }
    if (dx) { const n = row ? 5 : 6; col = (col + dx + n) % n; }
    S.cur[p] = row ? 6 + col : col; Sound.play('move'); this.selRefresh();
  },
  selConfirm(p) {
    const S = this.S.select; if (S.lock[p]) return;
    let i = S.cur[p];
    if (i === 10) { i = randi(0, 9); S.rnd[p] = i; } else S.rnd[p] = null;
    S.lock[p] = true; S.pick = S.pick || []; S.pick[p] = CHARS[i];
    Sound.play('select'); Sound.say(CHARS[i].name);
    Store.set(p ? 'last2' : 'last1', S.cur[p]);
    if (this.mode === 'tower') { this.startTower(CHARS[i]); return; }
    if (this.mode === 'cpu' && p === 0) { S.step = 1; if (S.cur[1] === S.cur[0]) S.cur[1] = (S.cur[0] + 1) % 10; }
    this.selRefresh();
    if (S.lock[0] && S.lock[1]) setTimeout(() => this.launch({ mode: this.mode, p1: S.pick[0], p2: S.pick[1], ai2: this.mode === 'cpu' ? Settings.diff : null }), 500);
  },
  selBack() {
    const S = this.S.select;
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
    const P1 = { KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0], 'P0:up': [0, -1], 'P0:down': [0, 1], 'P0:left': [-1, 0], 'P0:right': [1, 0] };
    const P2 = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], 'P1:up': [0, -1], 'P1:down': [0, 1], 'P1:left': [-1, 0], 'P1:right': [1, 0] };
    const OK1 = ['KeyF', 'KeyG', 'Space', 'P0:ok'], OK2 = ['KeyK', 'KeyL', 'Enter', 'NumpadEnter', 'Numpad1', 'P1:ok'];
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
        info.appendChild(pxCanvas(ch.name, ch.name.length > 12 ? 1 : 2, ['#fff6c0', '#ffb030'], 130, p ? 'right' : 'left'));
        info.appendChild(pxCanvas(ch.title + ', ' + ch.world, 1, '#ffd0c0', 120, p ? 'right' : 'left'));
        info.appendChild(pxCanvas(ch.desc, 1, '#c8b8c0', 120, p ? 'right' : 'left'));
      } else info.appendChild(pxCanvas('СЛУЧАЙНЫЙ БОЕЦ', 2, ['#fff6c0', '#ffb030'], 130, p ? 'right' : 'left'));
      if (S.lock[p]) info.appendChild(pxCanvas('ГОТОВ!', 2, ['#a8ffb0', '#22a034'], 130, p ? 'right' : 'left'));
    }
  },
  selTick() {
    const S = this.S.select; S.t++;
    for (let p = 0; p < 2; p++) {
      const i = S.lock[p] && S.rnd[p] != null ? S.rnd[p] : S.cur[p];
      const cv = S.prev[p], c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height);
      let ch = CHARS[i];
      if (!ch) ch = CHARS[Math.floor(S.t / 8) % CHARS.length];
      const pose = S.lock[p] ? ANIM.victory(ch, S.t) : ANIM.idle(ch, S.t);
      renderFighter(S.R, ch, pose, { anim: S.t, tint: CHARS[i] ? null : 'shadow', tintK: 0.85 });
      c.save(); if (p === 1) { c.translate(80, 0); c.scale(-1, 1); }
      c.drawImage(S.R.cv, SPR_OX - 40, SPR_OY - 92, 80, 96, 0, 0, 80, 96); c.restore();
    }
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
    const S = this.S.result, e = S.el; e.innerHTML = '';
    const cfg = Game.cfg, mode = cfg.mode;
    let title, col;
    if (mode === '2p') { title = 'ИГРОК ' + (r.winnerIdx + 1) + ' ПОБЕДИЛ!'; col = ['#fff6c0', '#ffb030']; }
    else if (r.humanWon) { title = 'ПОБЕДА!'; col = ['#a8ffb0', '#22a034']; }
    else { title = 'ПОРАЖЕНИЕ'; col = ['#ffd0c0', '#c01010']; }
    const box = el('div', 'rbox', e);
    box.appendChild(pxCanvas(title, 4, col, 0, 'center'));
    if (r.fatal) box.appendChild(pxCanvas('ФАТАЛИТИ: ' + r.winner.ch.fatal.name, 1, '#ff8a7a', 0, 'center'));
    const bc = el('div', 'menu-col', box);
    if (mode === 'tower') {
      const T = this.tower;
      if (r.humanWon) {
        T.idx++;
        if (T.idx >= T.list.length) { Store.set('towers', Store.get('towers', 0) + 1); this.btn(bc, 'ФИНАЛ', () => this.showEnding()); }
        else this.btn(bc, 'СЛЕДУЮЩИЙ БОЙ', () => YA.showAd(() => this.showTower()));
      } else this.btn(bc, 'ПОВТОРИТЬ БОЙ', () => this.launch(Object.assign({}, cfg)));
    } else {
      this.btn(bc, 'РЕВАНШ', () => this.launch(Object.assign({}, cfg, { stage: null })));
      this.btn(bc, 'ДРУГИЕ БОЙЦЫ', () => YA.showAd(() => this.startSelect(mode)));
    }
    this.btn(bc, 'ГЛАВНОЕ МЕНЮ', () => YA.showAd(() => this.toMenu()));
    S.back = null;
    this.show('result');
  },
  showEnding() {
    const S = this.S.ending, e = S.el; e.innerHTML = '';
    const box = el('div', 'rbox big', e);
    box.appendChild(pxCanvas('ЧЕМПИОН!', 6, ['#ffffff', '#ffd040', '#c06010'], 0, 'center'));
    box.appendChild(portrait(this.tower.ch, 32)).style.cssText += ';width:6.4em;height:6.4em';
    box.appendChild(pxCanvas(this.tower.ch.name + ' ПРОШЁЛ БАШНЮ ИСПЫТАНИЙ И СТАЛ ЛЕГЕНДОЙ КОМБАТА!', 1, '#ffe8c0', 260, 'center'));
    box.appendChild(pxCanvas('ПРОЙДЕНО БАШЕН: ' + Store.get('towers', 1), 1, '#c0a0a0', 0, 'center'));
    const bc = el('div', 'menu-col', box);
    this.btn(bc, 'ГЛАВНОЕ МЕНЮ', () => YA.showAd(() => this.toMenu()));
    Sound.play('win'); Sound.say('Безупречно! Ты чемпион!');
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
    const mc = el('div', 'mcol', S.body); const [cv] = mkCanvas(90, 96); cv.className = 'px mprev'; mc.appendChild(cv); S.cv = cv; S.head = el('div', 'mhead', mc);
    S.list = el('div', 'mlist', S.body);
    const bb = el('div', 'backbtn', e); this.btn(bb, 'НАЗАД', () => this.backTo());
    S.R = new Raster(SPR_W, SPR_H); S.t = 0; S.sel = 0;
    S.back = () => this.backTo();
    S.onShow = ch => { this.movesSel(ch ? CHARS.indexOf(ch) : S.sel); };
    S.defFocus = 0;
    S.handle = q => {
      for (const m of q) {
        if (m === 'left' || m === 'up') this.movesSel((S.sel + 9) % 10); else if (m === 'right' || m === 'down') this.movesSel((S.sel + 1) % 10);
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
      const c = S.cv.getContext('2d'); c.clearRect(0, 0, 90, 96); c.drawImage(S.R.cv, SPR_OX - 38, SPR_OY - 92, 90, 96, 0, 0, 90, 96);
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
    row(PROJ[ch.proj].name, '← → + РУКА  (R)');
    row(DASH[ch.dash].name, '↓ → + НОГА  (T)');
    sec('ФАТАЛИТИ (ВО ВРЕМЯ «ДОБЕЙ!», ВБЛИЗИ)');
    row(ch.fatal.name, arr(ch.fatal.seq) + ' + ' + (ch.fatal.btn === 'p' ? 'РУКА' : 'НОГА') + '  (Y)', '#ff8a7a');
    sec('БАЗОВЫЕ УДАРЫ');
    row('Удар рукой / серия', 'РУКА, РУКА');
    row('Удар ногой', 'НОГА');
    row('Апперкот', '↓ + РУКА');
    row('Подсечка', '↓ + НОГА');
    row('Круговой удар', '← + НОГА');
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
    const rows = [['ДЕЙСТВИЕ', 'ИГРОК 1', 'ИГРОК 2', 'ГЕЙМПАД'], ['ДВИЖЕНИЕ / ПРЫЖОК', 'W A S D', 'СТРЕЛКИ', 'КРЕСТОВИНА'], ['РУКА', 'F', 'K / NUM1', 'X / Y'], ['НОГА', 'G', 'L / NUM2', 'A'], ['БЛОК', 'H', '; / NUM3', 'B / RT'], ['СНАРЯД', 'R', 'O / NUM4', 'LB'], ['РЫВОК', 'T', 'P / NUM5', 'RB'], ['ФАТАЛИТИ', 'Y', 'I / NUM6', '—'], ['ПАУЗА', 'ESC', 'ESC', 'START']];
    rows.forEach((r, i) => { const tr = el('div', 'crow' + (i ? '' : ' chead'), tb); r.forEach((c, j) => { const td = el('div', 'ccell', tr); td.appendChild(pxCanvas(c, 1, i === 0 ? '#8ad0ff' : j === 0 ? '#ffffff' : '#ffd040')); }); });
    const n = el('div', 'cnote', e);
    n.appendChild(pxCanvas('В ОДИНОЧНОЙ ИГРЕ РАБОТАЮТ ОБЕ РАСКЛАДКИ. НА ТЕЛЕФОНЕ — ЭКРАННЫЕ КНОПКИ.', 1, '#c0b0b0', 380, 'center'));
    const bb = el('div', 'backbtn', e); this.btn(bb, 'НАЗАД', () => this.backTo());
    S.back = () => this.backTo();
  },
  // ---------- настройки ----------
  buildSettings() {
    const S = this.S.settings, e = S.el;
    el('div', 'sel-title', e).appendChild(pxCanvas('НАСТРОЙКИ', 3, ['#fff6c0', '#ffb030']));
    const col = el('div', 'menu-col set', e);
    const opts = [
      ['diff', 'СЛОЖНОСТЬ БОТА', [[1, 'ЛЁГКАЯ'], [2, 'СРЕДНЯЯ'], [3, 'ВЫСОКАЯ']]],
      ['time', 'ВРЕМЯ РАУНДА', [[60, '60 СЕК'], [99, '99 СЕК'], [0, 'БЕЗ ЛИМИТА']]],
      ['blood', 'КРОВЬ', [[true, 'ВКЛ'], [false, 'ВЫКЛ']]],
      ['music', 'МУЗЫКА', [[true, 'ВКЛ'], [false, 'ВЫКЛ']]],
      ['sfx', 'ЗВУКИ', [[true, 'ВКЛ'], [false, 'ВЫКЛ']]],
      ['voice', 'ГОЛОС ДИКТОРА', [[true, 'ВКЛ'], [false, 'ВЫКЛ']]],
      ['hints', 'ПОДСКАЗКА ФАТАЛИТИ', [[true, 'ВКЛ'], [false, 'ВЫКЛ']]],
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
    mk('tp', 'Р', 'p'); mk('tk', 'Н', 'k'); mk('tbk', 'Б', 'b'); mk('ts1', 'СНАРЯД', 'sp1'); mk('ts2', 'РЫВОК', 'sp2');
    this.fatBtn = mk('tfat', 'ФАТАЛИТИ', 'fat');
    const ps = el('div', 'tpause', T); ps.appendChild(pxCanvas('II', 2, '#ffffff')); ps.addEventListener('pointerdown', e => { e.preventDefault(); if (Game.phase === 'victory') Game.endMatch(); else Game.pause(true); });
  },
  updTouch() {
    const on = IS_TOUCH && Game.state !== 'demo' && Game.cfg && Game.cfg.mode !== 'demo' && !this.cur;
    document.getElementById('touch').classList.toggle('on', !!on);
  }
};
