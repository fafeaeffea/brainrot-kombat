'use strict';
// Синтезированные звуки и чиптюн-музыка (без внешних файлов)
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
      this.apply();
      if (this.wantTrack) this.music(this.wantTrack);
    } catch (e) { this.ctx = null; }
  },
  mute(reason, on) { if (on) this.muteReasons.add(reason); else this.muteReasons.delete(reason); this.apply(); },
  apply() {
    if (!this.ctx) return;
    const m = this.muteReasons.size > 0;
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.02);
    this.sfx.gain.value = Settings.sfx ? 1 : 0;
    this.mus.gain.value = Settings.music ? 0.32 : 0;
    if (m && window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) { }
  },
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
  say(text) {
    if (!Settings.voice || this.muteReasons.size || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ru-RU'; u.rate = 0.85; u.pitch = 0.45; u.volume = 1;
      const v = speechSynthesis.getVoices().find(v => /^ru/i.test(v.lang)); if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) { }
  },
  // ----- музыка: простая трекерная схема -----
  TRACKS: {
    menu: { bpm: 112, bass: [45, 0, 45, 0, 48, 0, 45, 0, 43, 0, 43, 0, 41, 0, 40, 0], lead: [69, 0, 72, 0, 76, 0, 74, 72, 67, 0, 71, 0, 72, 71, 69, 0], drum: 'k...s...k.k.s...' },
    fight: { bpm: 150, bass: [33, 33, 45, 33, 33, 45, 33, 45, 36, 36, 48, 36, 31, 31, 43, 31], lead: [69, 0, 0, 72, 0, 0, 76, 0, 74, 0, 72, 0, 71, 0, 67, 0], drum: 'k.h.s.h.k.k.s.hh' },
    win: { bpm: 130, bass: [36, 0, 43, 0, 48, 0, 43, 0, 41, 0, 45, 0, 43, 0, 47, 0], lead: [72, 76, 79, 84, 79, 76, 72, 0, 77, 81, 84, 81, 79, 0, 83, 0], drum: 'k...s...k...s.s.' }
  },
  music(name) {
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
  }
};
