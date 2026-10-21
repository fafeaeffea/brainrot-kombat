'use strict';
// Синтезированные звуки, чиптюн-музыка и записанный диктор (snd/*.mp3, с откатом на speechSynthesis)
const Sound = {
  ctx: null, master: null, sfx: null, mus: null, noiseBuf: null, muteReasons: new Set(), musicOn: false, track: null, step: 0, nextT: 0, timer: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { }); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain(); this.sfx.connect(this.master);
      this.mus = this.ctx.createGain(); this.mus.gain.value = 0.32; this.mus.connect(this.master);
      const n = this.ctx.sampleRate; this.noiseBuf = this.ctx.createBuffer(1, n, n);
      const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.vox = this.ctx.createGain(); this.vox.gain.value = 1; this.vox.connect(this.master);
      this.apply();
      if (this.wantTrack) this.music(this.wantTrack);
      setTimeout(() => this.loadVoice(), 0);
    } catch (e) { this.ctx = null; }
  },
  mute(reason, on) { if (on) this.muteReasons.add(reason); else this.muteReasons.delete(reason); this.apply(); },
  apply() {
    if (!this.ctx) return;
    const m = this.muteReasons.size > 0;
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.02);
    this.sfx.gain.value = Settings.sfx ? 1 : 0;
    this.mus.gain.value = Settings.music ? 0.32 : 0;
    if (m) this.stopVoice();
  },
  // тихий режим (меню): играют только звуки интерфейса
  quiet: false, UI_SOUNDS: { select: 1, move: 1, back: 1 },
  setQuiet(on) { this.quiet = !!on; },
  tone(f, dur, type = 'square', vol = 0.2, f2 = null, delay = 0, dest = null) {
    const c = this.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest || this.sfx); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol = 0.3, freq = 1200, type = 'lowpass', delay = 0, f2 = null, dest = null) {
    const c = this.ctx, t = c.currentTime + delay, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; fl.type = type; fl.frequency.setValueAtTime(freq, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || this.sfx); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  play(name) {
    if (!this.ctx || !Settings.sfx) return;
    if (this.quiet && !this.UI_SOUNDS[name]) return;
    try {
      switch (name) {
        case 'whoosh': this.noise(0.12, 0.12, 2500, 'bandpass', 0, 600); break;
        case 'whooshH': this.noise(0.2, 0.18, 1800, 'bandpass', 0, 400); break;
        case 'punch': case 'kick': case 'hit': this.noise(0.09, 0.5, 1400); this.tone(140, 0.1, 'square', 0.25, 50); break;
        case 'slashHit': this.noise(0.12, 0.35, 4000, 'highpass'); this.tone(900, 0.08, 'sawtooth', 0.1, 200); this.noise(0.1, 0.4, 1200); break;
        case 'heavy': this.noise(0.18, 0.7, 900); this.tone(110, 0.22, 'square', 0.35, 35); break;
        case 'block': this.tone(900, 0.06, 'square', 0.12, 500); this.noise(0.05, 0.2, 3000, 'highpass'); break;
        case 'jump': this.tone(220, 0.12, 'square', 0.08, 440); break;
        case 'land': this.noise(0.08, 0.25, 500); break;
        case 'grab': this.noise(0.08, 0.3, 700); break;
        case 'cast': this.tone(300, 0.2, 'triangle', 0.12, 900); break;
        case 'fire': this.noise(0.4, 0.4, 900, 'lowpass', 0, 300); this.tone(180, 0.3, 'sawtooth', 0.12, 70); break;
        case 'ice': case 'freeze': this.tone(1800, 0.25, 'triangle', 0.12, 3000); this.tone(1200, 0.3, 'sine', 0.1, 2400, 0.05); this.noise(0.25, 0.15, 6000, 'highpass'); break;
        case 'plasma': this.tone(1400, 0.2, 'sawtooth', 0.12, 200); break;
        case 'laser': this.tone(2200, 1.0, 'sawtooth', 0.15, 120); this.noise(1.0, 0.3, 3000, 'bandpass', 0, 300); break;
        case 'slash': this.noise(0.2, 0.3, 5000, 'highpass', 0, 1500); this.tone(1200, 0.15, 'sawtooth', 0.06, 300); break;
        case 'axe': this.noise(0.25, 0.25, 1500, 'bandpass', 0, 500); break;
        case 'skull': this.tone(200, 0.4, 'sawtooth', 0.12, 80); this.tone(205, 0.4, 'square', 0.08, 82); break;
        case 'wave': this.noise(0.5, 0.35, 800, 'lowpass', 0, 3000); break;
        case 'throw': this.tone(500, 0.15, 'triangle', 0.1, 250); break;
        case 'explode': this.noise(0.7, 0.9, 1200, 'lowpass', 0, 80); this.tone(80, 0.5, 'square', 0.3, 30); break;
        case 'tun': this.tone(160, 0.18, 'sine', 0.6, 60); this.noise(0.08, 0.4, 600); this.tone(320, 0.08, 'square', 0.1, 120); break;
        case 'coffee': this.noise(0.3, 0.3, 2000, 'bandpass', 0, 600); break;
        case 'teleport': this.tone(200, 0.25, 'sine', 0.14, 1600); break;
        case 'dash': this.noise(0.25, 0.25, 1200, 'bandpass', 0, 3000); break;
        case 'spin': for (let i = 0; i < 4; i++) this.noise(0.08, 0.15, 3000, 'bandpass', i * 0.1, 1000); break;
        case 'plane': this.tone(90, 0.6, 'sawtooth', 0.12, 160); break;
        case 'dive': this.tone(900, 0.5, 'square', 0.1, 200); break;
        case 'thunder': this.noise(1.2, 0.8, 600, 'lowpass', 0, 60); this.noise(0.2, 0.5, 4000, 'highpass'); break;
        case 'shatter': case 'shatterS': for (let i = 0; i < 6; i++) this.tone(rand(1500, 4000), 0.15, 'triangle', 0.08, rand(800, 2000), i * 0.03); this.noise(0.3, 0.4, 5000, 'highpass'); break;
        case 'crunch': this.noise(0.25, 0.8, 700); this.tone(90, 0.2, 'square', 0.3, 40); this.noise(0.1, 0.5, 2500, 'bandpass', 0.08); break;
        case 'bite': this.noise(0.12, 0.8, 1000); this.tone(70, 0.3, 'square', 0.4, 30); break;
        case 'gore': this.noise(0.4, 0.5, 500, 'lowpass', 0, 200); break;
        case 'select': this.tone(660, 0.07, 'square', 0.12); this.tone(990, 0.1, 'square', 0.12, null, 0.06); break;
        case 'move': this.tone(440, 0.04, 'square', 0.08); break;
        case 'back': this.tone(440, 0.07, 'square', 0.1, 220); break;
        case 'round': this.tone(110, 0.5, 'sawtooth', 0.2, 55); this.noise(0.4, 0.4, 400); break;
        case 'gong': this.tone(98, 1.6, 'sine', 0.5, 90); this.tone(147, 1.4, 'triangle', 0.2, 140); this.tone(262, 1.0, 'sine', 0.1, 255); this.noise(0.3, 0.3, 800); break;
        case 'fatal': this.tone(55, 1.4, 'sawtooth', 0.3, 40); this.tone(58, 1.4, 'square', 0.15, 41); this.noise(1.2, 0.35, 300); break;
        case 'win': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.25, 'square', 0.12, null, i * 0.12)); this.tone(1047, 0.8, 'triangle', 0.15, null, 0.5); break;
        case 'lose': [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.3, 'square', 0.12, null, i * 0.18)); break;
      }
    } catch (e) { }
  },
  // ----- эпичный диктор: низкий голос + хор, удар и эхо под ним -----
  voices: null,
  pickVoice() {
    if (!window.speechSynthesis) return null;
    const vs = speechSynthesis.getVoices().filter(v => /^ru/i.test(v.lang));
    if (!vs.length) return null;
    const male = /pavel|dmitr|yuri|maxim|artem|ivan|boris|filipp|mikhail|male|муж|павел|дмитр|юр|максим|артём|иван/i;
    const fem = /female|жен|milena|irina|anna|elena|katya|alena|ekaterina|svetlana|tatyana|daria|dariya|xenia|милена|ирина|анна|елена|алена|алёна|катя/i;
    return vs.find(v => male.test(v.name) && !fem.test(v.name)) || vs.find(v => !fem.test(v.name)) || vs[0];
  },
  ensureVerb() {
    if (this.verb || !this.ctx) return this.verb;
    const c = this.ctx, len = Math.floor(c.sampleRate * 2.6), buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    this.verb = c.createConvolver(); this.verb.buffer = buf;
    const g = c.createGain(); g.gain.value = 0.55; this.verb.connect(g); g.connect(this.master);
    return this.verb;
  },
  pad(freqs, dur, vol, delay = 0) {
    const c = this.ctx, t = c.currentTime + delay, out = c.createGain(), lp = c.createBiquadFilter(), verb = this.ensureVerb();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(400, t); lp.frequency.linearRampToValueAtTime(2200, t + dur * 0.3); lp.frequency.linearRampToValueAtTime(600, t + dur);
    out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(vol, t + 0.12); out.gain.setValueAtTime(vol, t + dur * 0.55); out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lp.connect(out); out.connect(this.sfx); if (verb) out.connect(verb);
    for (const f of freqs) for (const det of [-9, 0, 9]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + dur + 0.05); }
  },
  sting(kind) {
    if (!this.ctx || !Settings.sfx) return;
    if (this.quiet && kind !== 'swell') return;
    try {
      const verb = this.ensureVerb();
      if (kind === 'name') {
        this.noise(0.5, 0.25, 3000, 'highpass', 0, 9000, verb);
        this.tone(70, 1.2, 'sine', 0.8, 30); this.tone(140, 0.4, 'square', 0.15, 50); this.noise(0.4, 0.6, 500, 'lowpass', 0, 60);
        this.pad([110, 164.8, 220, 261.6], 2.2, 0.05);
      } else if (kind === 'big') {
        this.tone(55, 1.8, 'sine', 0.9, 28); this.noise(0.8, 0.7, 700, 'lowpass', 0, 50); if (verb) this.noise(1.2, 0.4, 1500, 'lowpass', 0, 200, verb);
        this.pad([73.4, 110, 146.8, 174.6, 220], 3, 0.06);
      } else if (kind === 'heart') {
        this.tone(60, 0.18, 'sine', 0.9, 35); this.tone(55, 0.2, 'sine', 0.7, 32, 0.22);
      } else if (kind === 'impact') {
        this.tone(45, 0.9, 'sine', 1, 25); this.noise(0.6, 0.9, 900, 'lowpass', 0, 60); if (verb) this.noise(0.9, 0.5, 2500, 'bandpass', 0, 300, verb);
      } else if (kind === 'swell') {
        const c = this.ctx, t = c.currentTime, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
        s.buffer = this.noiseBuf; s.loop = true; fl.type = 'bandpass'; fl.frequency.setValueAtTime(300, t); fl.frequency.exponentialRampToValueAtTime(5000, t + 1.1);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 1.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        s.connect(fl); fl.connect(g); g.connect(this.sfx); if (verb) g.connect(verb); s.start(t); s.stop(t + 1.25);
      }
    } catch (e) { }
  },
  // ----- записанный диктор: фразы -> клипы snd/<key>.mp3 -----
  VOICE_DIR: 'snd/',
  VOICE_MAP: {
    'кайро': 'n_kairo', 'киоми': 'n_kiomi', 'нефера': 'n_nefera', 'нова': 'n_nova', 'юки': 'n_yuki', 'сержант вольт': 'n_volt', 'вольт': 'n_volt',
    'ронин 9': 'n_ronin', 'ронин девять': 'n_ronin', 'бьорн': 'n_bjorn', 'морена': 'n_morena',
    'тралалеро тралала': 'n_tralalero', 'бомбардиро крокодило': 'n_bombardiro',
    'тун тун сахур': 'n_tung', 'балерина капучина': 'n_ballerina',
    'раунд один': 'r1', 'раунд 1': 'r1', 'раунд два': 'r2', 'раунд 2': 'r2', 'раунд три': 'r3', 'раунд 3': 'r3',
    'раунд четыре': 'r4', 'раунд 4': 'r4', 'раунд пять': 'r5', 'раунд 5': 'r5',
    'бой': 'fight', 'фаталити': 'fatality', 'добей его': 'finish_him', 'добей ее': 'finish_her',
    'против': 'vs', 'побеждает': 'wins', 'безупречная победа': 'flawless', 'ничья': 'draw',
    'время вышло': 'timeup', 'безупречно ты чемпион': 'champion',
    'выбери режим': 'pick_mode', 'выбери бойца': 'pick_fighter'
  },
  clips: {}, voiceLoading: false, voiceSrc: [], voiceTok: 0, _lastClips: null, _lastSay: null,
  loadVoice() {
    if (this.voiceLoading || !this.ctx || !window.fetch) return;
    this.voiceLoading = true;
    const keys = [...new Set(Object.values(this.VOICE_MAP))];
    // по очереди (по 3 одновременно), чтобы не мешать загрузке игры
    let i = 0;
    const next = () => {
      if (i >= keys.length) return;
      const k = keys[i++];
      fetch(this.VOICE_DIR + k + '.mp3').then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then(ab => new Promise((res, rej) => { const p = this.ctx.decodeAudioData(ab, res, rej); if (p && p.catch) p.catch(rej); }))
        .then(buf => { this.clips[k] = buf; }).catch(() => { this.clips[k] = null; }).then(next);
    };
    for (let j = 0; j < 3; j++) next();
  },
  normPhrase(text) {
    return String(text).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, ' ').trim();
  },
  // разбивает фразу на известные клипы (жадно, самые длинные куски); null — если что-то не распознано
  phraseClips(text) {
    const w = this.normPhrase(text).split(' ').filter(Boolean), out = [];
    if (!w.length) return null;
    for (let i = 0; i < w.length;) {
      let hit = 0;
      for (let n = Math.min(4, w.length - i); n > 0; n--) { const k = this.VOICE_MAP[w.slice(i, i + n).join(' ')]; if (k) { out.push(k); hit = n; break; } }
      if (!hit) return null;
      i += hit;
    }
    return out;
  },
  duck(on) {
    if (!this.mus || !this.ctx) return;
    this.mus.gain.setTargetAtTime(Settings.music ? (on ? 0.1 : 0.32) : 0, this.ctx.currentTime, on ? 0.05 : 0.3);
  },
  stopVoice() {
    this.voiceTok++;
    for (const s of this.voiceSrc) try { s.stop(); } catch (e) { }
    this.voiceSrc = [];
    if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) { }
  },
  playClips(keys, delay) {
    const c = this.ctx, verb = this.ensureVerb(), tok = this.voiceTok;
    const g = c.createGain(); g.gain.value = 1.15; g.connect(this.vox);
    if (verb) { const s = c.createGain(); s.gain.value = 0.3; g.connect(s); s.connect(verb); }
    let t = c.currentTime + delay;
    const t0 = t;
    for (const k of keys) {
      const b = this.clips[k], src = c.createBufferSource();
      src.buffer = b; src.connect(g); src.start(t); this.voiceSrc.push(src);
      t += Math.max(0.4, b.duration - 0.05); // пауза между словами, чтобы диктор не торопился
    }
    const end = t + 0.15;
    setTimeout(() => { if (tok === this.voiceTok) this.duck(true); }, Math.max(0, (t0 - c.currentTime) * 1000));
    setTimeout(() => { if (tok === this.voiceTok) { this.duck(false); this.voiceSrc = []; } }, (end - c.currentTime) * 1000);
    return end - c.currentTime;
  },
  // onDone вызывается один раз, когда фраза договорена (или сразу, если голос выключен)
  sayDur(text) {
    const keys = this.phraseClips(text);
    if (keys && keys.every(k => this.clips[k])) return keys.reduce((a, k) => a + Math.max(0.4, this.clips[k].duration - 0.05), 0.3) * 1000;
    return 600 + String(text).length * 85;
  },
  say(text, sting, onDone) {
    let fired = false; const done = () => { if (!fired) { fired = true; if (onDone) onDone(); } };
    if (onDone) setTimeout(done, this.sayDur(text) + 2500);
    if (sting) this.sting(sting === true ? 'name' : sting);
    if (!Settings.voice || this.muteReasons.size) { if (onDone) setTimeout(done, 300); return; }
    this.stopVoice();
    const keys = this.phraseClips(text);
    const ready = !!(keys && this.ctx && keys.every(k => this.clips[k]));
    this._lastClips = ready ? keys : null;
    this._lastSay = { text, keys, ready };
    if (ready) { try { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { }); const d = this.playClips(keys, sting ? 0.12 : 0.02); if (onDone) setTimeout(done, d * 1000); return; } catch (e) { } }
    if (!window.speechSynthesis) { if (onDone) setTimeout(done, this.sayDur(text)); return; }
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ru-RU'; u.rate = 0.75; u.pitch = 0; u.volume = 1;
      const v = this.pickVoice(); if (v) u.voice = v;
      // музыка приглушается, пока говорит диктор
      u.onstart = () => this.duck(true);
      u.onend = u.onerror = () => { this.duck(false); done(); };
      setTimeout(() => { try { speechSynthesis.speak(u); } catch (e) { } }, sting ? 120 : 0);
    } catch (e) { }
  },
  // ----- музыка: простая трекерная схема -----
  TRACKS: {
    menu: { bpm: 112, bass: [45, 0, 45, 0, 48, 0, 45, 0, 43, 0, 43, 0, 41, 0, 40, 0], lead: [69, 0, 72, 0, 76, 0, 74, 72, 67, 0, 71, 0, 72, 71, 69, 0], drum: 'k...s...k.k.s...' },
    fight: { bpm: 150, bass: [33, 33, 45, 33, 33, 45, 33, 45, 36, 36, 48, 36, 31, 31, 43, 31], lead: [69, 0, 0, 72, 0, 0, 76, 0, 74, 0, 72, 0, 71, 0, 67, 0], drum: 'k.h.s.h.k.k.s.hh' },
    menu2: { bpm: 96, scale: 'minor', bass: [38, 0, 38, 50, 0, 38, 0, 41, 43, 0, 43, 55, 0, 41, 0, 40], lead: [62, 0, 65, 69, 0, 67, 65, 0, 64, 0, 62, 0, 60, 62, 0, 0], drum: 'k..hs..hk.k.s..h' },
    menu3: { bpm: 124, bass: [40, 40, 52, 40, 43, 43, 55, 43, 45, 45, 57, 45, 47, 47, 59, 47], lead: [76, 0, 79, 0, 83, 0, 81, 79, 76, 0, 74, 0, 76, 0, 0, 0], drum: 'k.h.s.h.k.hhs.h.' },
    heavy: { bpm: 160, bass: [28, 28, 40, 28, 28, 40, 31, 31, 28, 28, 40, 28, 34, 33, 31, 30], lead: [64, 0, 0, 67, 0, 0, 70, 0, 69, 0, 67, 0, 64, 0, 63, 0], drum: 'kks.kks.kks.k.ss' },
    synth: { bpm: 128, bass: [36, 48, 36, 48, 39, 51, 39, 51, 34, 46, 34, 46, 38, 50, 38, 50], lead: [72, 75, 79, 0, 82, 0, 79, 75, 70, 0, 74, 77, 0, 74, 0, 0], drum: 'k.h.s.h.k.h.s.hh' },
    mellow: { bpm: 100, bass: [41, 0, 0, 48, 0, 0, 45, 0, 43, 0, 0, 50, 0, 0, 48, 0], lead: [72, 0, 0, 76, 0, 79, 0, 0, 77, 0, 0, 74, 0, 72, 0, 0], drum: 'k...h...s...h..h' },
    shanty: { bpm: 138, bass: [38, 0, 45, 0, 38, 0, 45, 0, 36, 0, 43, 0, 36, 0, 43, 0], lead: [62, 62, 64, 66, 67, 0, 66, 64, 62, 0, 60, 0, 59, 60, 62, 0], drum: 'k..sk..sk..sk.ss' },
    arabic: { bpm: 140, bass: [38, 0, 38, 39, 0, 38, 0, 42, 43, 0, 42, 39, 0, 38, 0, 0], lead: [62, 63, 66, 67, 69, 0, 67, 66, 63, 0, 62, 0, 66, 63, 62, 0], drum: 'k.hsk.h.k.hsk.ss' },
    chip: { bpm: 156, bass: [45, 57, 45, 57, 48, 60, 48, 60, 50, 62, 50, 62, 52, 64, 52, 64], lead: [81, 84, 88, 84, 81, 0, 79, 81, 84, 0, 88, 91, 88, 0, 86, 0], drum: 'k.hhs.hhk.hhs.hh' },
    win: { bpm: 130, bass: [36, 0, 43, 0, 48, 0, 43, 0, 41, 0, 45, 0, 43, 0, 47, 0], lead: [72, 76, 79, 84, 79, 76, 72, 0, 77, 81, 84, 81, 79, 0, 83, 0], drum: 'k...s...k...s.s.' }
  },
  // арена → настроение музыки
  STAGE_MUSIC: { temple: 'fight', ice: 'mellow', city: 'synth', beach: 'chip', pit: 'heavy', metro: 'synth', arcade: 'chip', roof: 'fight', graveyard: 'heavy', station: 'synth', ship: 'shanty', desert: 'arabic', dome: 'mellow', forge: 'heavy', throne: 'fight' },
  music(name, stage) {
    if (name === 'menu' && this.track && this.track.startsWith('menu')) return;
    if (name === 'menu') name = choice(['menu', 'menu2', 'menu3']);
    if (name === 'fight' && stage != null && typeof STAGES !== 'undefined' && STAGES[stage]) name = this.STAGE_MUSIC[STAGES[stage].id] || 'fight';
    this.wantTrack = name;
    if (!this.ctx) return;
    if (this.track === name) return;
    this.track = name; this.step = 0; this.nextT = this.ctx.currentTime + 0.05;
    if (!this.timer) this.timer = setInterval(() => this.tick(), 50);
  },
  stopMusic() { this.track = null; this.wantTrack = null; },
  tick() {
    if (!this.ctx || !this.track) return;
    const tr = this.TRACKS[this.track], dt = 60 / tr.bpm / 4, c = this.ctx;
    while (this.nextT < c.currentTime + 0.15) {
      const i = this.step % 16, bar = Math.floor(this.step / 16) % 4, d = this.nextT - c.currentTime;
      const tr2 = bar === 3 ? 3 : bar === 2 ? -2 : 0;
      try {
        const b = tr.bass[i]; if (b) this.tone(440 * Math.pow(2, (b + tr2 - 69) / 12), dt * 1.8, 'square', 0.16, null, d, this.mus);
        const l = tr.lead[i]; if (l && bar !== 1) this.tone(440 * Math.pow(2, (l + tr2 - 69) / 12), dt * 1.5, 'triangle', 0.14, null, d, this.mus);
        if (l && bar === 1) this.tone(440 * Math.pow(2, (l + tr2 - 57) / 12), dt * 1.2, 'square', 0.05, null, d, this.mus);
        const dr = tr.drum[i];
        if (dr === 'k') this.tone(150, 0.12, 'sine', 0.6, 40, d, this.mus);
        else if (dr === 's') this.noise(0.12, 0.35, 1800, 'bandpass', d, null, this.mus);
        else if (dr === 'h') this.noise(0.04, 0.12, 7000, 'highpass', d, null, this.mus);
      } catch (e) { }
      this.nextT += dt; this.step++;
    }
  },
  // ----- звуки арен: зацикленный шумовой фон + случайные события -----
  AMB: {
    temple: { bed: [500, 'bandpass', 0.05], ev: ['chime', 0.006] }, ice: { bed: [700, 'bandpass', 0.09], ev: ['gust', 0.008] },
    city: { bed: [3000, 'highpass', 0.11], ev: ['drip', 0.04] }, beach: { bed: [400, 'lowpass', 0.12], ev: ['gull', 0.004] },
    pit: { bed: [160, 'lowpass', 0.22], ev: ['bubble', 0.06] }, metro: { bed: [120, 'lowpass', 0.12], ev: ['train', 0.0015] },
    arcade: { bed: [900, 'bandpass', 0.04], ev: ['bleep', 0.05] }, roof: { bed: [600, 'bandpass', 0.1], ev: ['gust', 0.01] },
    graveyard: { bed: [500, 'bandpass', 0.06], ev: ['crow', 0.004] }, station: { bed: [90, 'lowpass', 0.1], ev: ['beep', 0.012] },
    ship: { bed: [2600, 'highpass', 0.12], ev: ['creak', 0.008] }, desert: { bed: [800, 'bandpass', 0.08], ev: ['gust', 0.01] },
    dome: { bed: [200, 'lowpass', 0.1], ev: ['bubble', 0.03] }, forge: { bed: [180, 'lowpass', 0.14], ev: ['anvil', 0.012] },
    throne: { bed: [300, 'lowpass', 0.08], ev: ['crackle', 0.06] }
  },
  amb: null,
  ambient(stage) {
    if (this.amb) { const a = this.amb; this.amb = null; clearInterval(a.iv); try { a.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4); setTimeout(() => { try { a.src.stop(); } catch (e) { } }, 2000); } catch (e) { } }
    if (stage == null || !this.ctx || typeof STAGES === 'undefined' || !STAGES[stage]) return;
    const id = STAGES[stage].id, P = this.AMB[id]; if (!P) return;
    const c = this.ctx, src = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noiseBuf; src.loop = true; fl.type = P.bed[1]; fl.frequency.value = P.bed[0]; g.gain.value = 0;
    g.gain.setTargetAtTime(P.bed[2], c.currentTime, 0.8);
    src.connect(fl); fl.connect(g); g.connect(this.sfx); src.start();
    const a = { src, g, id, iv: setInterval(() => { if (this.amb === a && !this.quiet && !this.muteReasons.size && Math.random() < P.ev[1] * 6) this.ambEvent(P.ev[0]); }, 100) };
    this.amb = a;
  },
  ambEvent(k) {
    try {
      const r = Math.random;
      switch (k) {
        case 'bubble': this.tone(120 + r() * 200, 0.12, 'sine', 0.12, 400 + r() * 300); if (r() < 0.3) this.noise(0.3, 0.12, 200, 'lowpass'); break;
        case 'drip': this.tone(1800 + r() * 1500, 0.04, 'sine', 0.05, 900); break;
        case 'gust': this.noise(1.6, 0.12, 400 + r() * 500, 'bandpass', 0, 1200); break;
        case 'chime': this.tone(1320 * (r() < 0.5 ? 1 : 1.5), 1.4, 'sine', 0.05); break;
        case 'gull': this.tone(1500, 0.25, 'triangle', 0.05, 900); this.tone(1400, 0.2, 'triangle', 0.04, 850, 0.3); break;
        case 'train': this.noise(4, 0.3, 140, 'lowpass', 0, 60); this.tone(55, 3.5, 'sawtooth', 0.06, 45); break;
        case 'bleep': this.tone([523, 659, 784, 1046][Math.floor(r() * 4)], 0.06, 'square', 0.03); break;
        case 'crow': this.noise(0.18, 0.12, 900, 'bandpass'); this.noise(0.16, 0.1, 850, 'bandpass', 0.25); break;
        case 'beep': this.tone(880, 0.08, 'sine', 0.04); this.tone(660, 0.08, 'sine', 0.03, null, 0.12); break;
        case 'creak': this.tone(90 + r() * 40, 0.5, 'sawtooth', 0.03, 70); break;
        case 'anvil': this.tone(1600, 0.4, 'square', 0.04, 1500); this.noise(0.06, 0.15, 3000, 'highpass'); break;
        case 'crackle': this.noise(0.03, 0.12, 2500, 'highpass'); break;
      }
    } catch (e) { }
  }
};
