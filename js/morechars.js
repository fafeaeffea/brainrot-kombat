'use strict';
// Ещё четверо: сумоист Ёкодзуна, оса Веспа, северянин Хольм и капитан Барракуда

const MORE = [
  {
    id: 'sumo', name: 'Ёкодзуна', title: 'Великий сумоист', world: 'Арена Рёгоку', g: 'm',
    desc: 'Непобедимый чемпион сумо. Один толчок его ладони сносит стену.',
    pal: { skin: '#e8b48a', main: '#e8b48a', sleeve: '#e8b48a', fore: '#e8b48a', glove: '#e8b48a', pants: '#e8b48a', boots: '#e8b48a', mawashi: '#2a2a7a', rope: '#f4eee0', hair: '#141018', eye: '#2a1a10', fx: '#ffffff' },
    build: BUILD({ chest: 9.4, waist: 9.8, limb: 1.32, torso: 18, leg1: 13, leg2: 13, arm1: 11, arm2: 11, shDrop: 4 }),
    stance: { hF: [12, 4], hB: [10, 6], torso: 10, hy: 4, fF: [11, 0], fB: [-12, 0] },
    draw: {
      torso(R, J, P) {
        const b = this.build;
        tube(R, J.hip, J.neck, b.waist, b.chest, P.skin);
        const bl = TP(J, 2.2, 7); sphere(R, bl.x, bl.y, 8.2, P.skin);               // живот
        const sk = ramp(P.skin); TL(R, J, 2, b.torso - 6, b.chest - 1, b.torso - 7, sk[1]); TPx(R, J, 4, 6, sk[0]);
        // маваси: пояс и передний клапан
        plate(R, TPoly(J, [[-b.waist - 0.8, -1.5], [b.waist + 2.6, -1.5], [b.waist + 2.6, 3.5], [-b.waist - 0.8, 3.5]]), P.mawashi);
        const mr = ramp(P.mawashi); TL(R, J, -b.waist, 0, b.waist + 2, 0, mr[3]);
        plate(R, TPoly(J, [[1, -1.5], [5, -1.5], [4.5, -9], [1.5, -9]]), P.mawashi, -0.1);
        for (let i = 0; i < 4; i++) TL(R, J, 1.4 + i, -2, 1.6 + i, -8.5, C32(P.rope));
      },
      head(H, P, c) {
        const C = HC, hr = ramp(P.hair);
        sphere(H, C - 1.5, C - 1, 6.4, hr);
        faceMan(H, P, { brow: '#141018' });
        ovoid(H, C + 3, C + 4, 4.6, 3, P.skin);                                       // пухлые щёки
        H.fline(C + 4.2, C + 5, C + 6.6, C + 4.8, C32('#8a4a3a'));
        tube(H, { x: C - 1, y: C - 6 }, { x: C + 3, y: C - 10 }, 1.4, 1.8, P.hair); sphere(H, C + 3.5, C - 10.5, 2, hr); // пучок тёммагэ
      }
    },
    proj: 'salt', dash: 'sumopush', fatal: { seq: ['D', 'B', 'B', 'F'], type: 'hammer', name: 'Сокрушительный толчок' },
    win: 'fist', quote: 'Ты вылетел за круг. Навсегда.'
  },
  {
    id: 'vespa', name: 'Веспа', title: 'Королева ос', world: 'Янтарный улей', g: 'f',
    desc: 'Повелительница роя с ядовитым жалом. Её крылья гудят перед смертельным ударом.',
    pal: { skin: '#f0cfa8', main: '#f4c020', top: '#1a1410', sleeve: '#1a1410', fore: '#1a1410', glove: '#1a1410', pants: '#1a1410', hipCol: '#f4c020', boots: '#1a1410', belt: '#1a1410', hair: '#1a1410', eye: '#c05a10', wing: '#cfeeff', fx: '#ffd040' },
    build: BUILD({ chest: 6.1, waist: 3.3, hips: 5.6, limb: 0.82, torso: 18.5, leg1: 16, leg2: 16 }),
    stance: { hF: [11, 4], hB: [7, 8], wa: -20 },
    weapon: 'stinger',
    draw: {
      tex: { main: (s, v, ti) => (ti >= 1 && (s % 3.2) < 1.4) ? C32('#1a1410') : ti },
      back(R, J, P, c) { // прозрачные крылья, быстро машут
        const s = TP(J, -2, this.build.torso - 3), fl = Math.sin(c.t * 1.6) * 4;
        for (const [dx, dy, k] of [[-14, -14 + fl, 0], [-12, -2 - fl * 0.6, -0.15]]) {
          plate(R, [[s.x, s.y], [s.x + dx, s.y + dy], [s.x + dx * 0.8, s.y + dy + 6], [s.x - 1, s.y + 3]], P.wing, k);
          R.fline(s.x, s.y, s.x + dx * 0.9, s.y + dy + 2, C32('#7aa0c0'));
        }
      },
      mid(R, J, P) { // брюшко-юбка в полоску
        const b = this.build, a = TP(J, -b.waist - 1.5, 1.5), e = TP(J, b.waist + 1, 1.5), kf = lp(J.hipF, J.knF, 0.4), kb = lp(J.hipB, J.knB, 0.4);
        plate(R, [[a.x, a.y], [e.x, e.y], [kf.x + 2, kf.y], [kb.x - 2, kb.y]], P.main);
        R.line(kb.x - 2, kb.y - 2, kf.x + 2, kf.y - 2, C32('#1a1410'));
      },
      head(H, P, c) {
        const C = HC, hr = ramp(P.hair), t = c.t || 0;
        sphere(H, C - 2, C - 1, 6.6, hr);
        headHero(H, P, c, { style: 'wasp', lips: '#b02030', liner: '#1a1410' });
        plate(H, [[C - 6, C - 4], [C + 1, C - 8.5], [C + 6.5, C - 5.5], [C + 2, C - 4], [C - 1, C - 2]], hr);
        H.frect(C - 3, C - 6, 10, 1, C32('#f4c020'));
        // усики
        for (const k of [0, 1]) { const sw = Math.sin(t * 0.2 + k) * 1; H.fline(C + 1 + k * 2, C - 7, C + 5 + k * 3 + sw, C - 15, C32('#1a1410')); sphere(H, C + 5 + k * 3 + sw, C - 15, 0.9, '#f4c020'); }
      }
    },
    proj: 'sting', dash: 'buzz', fatal: { seq: ['F', 'B', 'D', 'F'], type: 'tornado', name: 'Смертельный рой' },
    win: 'bow', quote: 'Одно жало, и ты уже не встанешь.'
  },
  {
    id: 'holm', name: 'Хольм', title: 'Повелитель льда', world: 'Ледяной Север', g: 'm',
    desc: 'Сын северных ветров. Замораживает кровь врагов одним касанием.',
    pal: { skin: '#e6c0a0', main: '#2a4a6a', sleeve: '#2a4a6a', fore: '#d8e8f4', glove: '#9fe6ff', pants: '#3a4a5a', boots: '#e8e2d4', belt: '#8a6a4a', fur: '#f0ece2', hair: '#e8eef4', eye: '#7fdcff', fx: '#7fdcff' },
    build: BUILD({ chest: 7.2, waist: 5.6, limb: 1.05 }),
    stance: { hF: [11, 3], hB: [8, 6] },
    draw: {
      tex: { sleeve: foldTex(5, 3, 10), pants: foldTex(4, 3, 13), boots: (s, v, ti) => (s < 3 && ti > 1) ? 4 : ti },
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build;
        const n = TP(J, 1, b.torso - 0.5); ovoid(R, n.x, n.y, 6.8, 3.2, P.fur);          // меховой ворот
        TL(R, J, 1.5, b.torso - 2, 1.5, 1, C32(P.fur)); TL(R, J, 2.2, b.torso - 2, 2.2, 1, ramp(P.fur)[1]);
        const a = TP(J, 4, b.torso - 9); plate(R, [[a.x, a.y - 2.5], [a.x + 1.6, a.y], [a.x, a.y + 2.5], [a.x - 1.6, a.y]], '#9fe6ff'); R.dot(a.x, a.y - 1, C32('#ffffff'));
      },
      arm(R, J, side, P, k, sh, el, hd) { // ледяные шипы на перчатках
        const q = lp(el, hd, 0.7); R.dot(q.x, q.y - 2, C32('#ffffff')); plate(R, [[q.x - 1, q.y - 1], [q.x + 1, q.y - 1], [q.x, q.y - 4]], '#cff4ff', k);
      },
      head(H, P, c) {
        const C = HC, hr = ramp(P.hair);
        tube(H, { x: C - 4, y: C - 2 }, { x: C - 8, y: C + 9 }, 2, 1.2, P.hair);
        sphere(H, C - 1.5, C - 1, 6.2, hr);
        faceMan(H, P, { brow: '#c8d4e0' });
        plate(H, [[C + 1, C + 2], [C + 7, C + 2.5], [C + 6, C + 9], [C + 2.5, C + 10], [C, C + 6]], hr);   // борода
        H.fline(C + 3.5, C + 4, C + 6.4, C + 4, C32('#8a5a4a'));
        // меховая шапка с рогами
        ovoid(H, C, C - 6, 7, 3, P.fur);
        for (const s of [-1, 1]) { const bx = C + (s < 0 ? -4 : 4); tube(H, { x: bx, y: C - 7 }, { x: bx + s * 3, y: C - 12 }, 1.2, 0.5, '#d8cfb8'); }
        H.dot(C + 4, C - 0.5, C32('#ffffff'));
      }
    },
    proj: 'ice', dash: 'icepath', fatal: { seq: ['D', 'B', 'F', 'F'], type: 'shatter', name: 'Вечная мерзлота' },
    win: 'fist', quote: 'Север не прощает слабых.'
  },
  {
    id: 'barracuda', name: 'Капитан Барракуда', title: 'Гроза семи морей', world: 'Проклятый фрегат', g: 'm',
    desc: 'Пират, продавший душу морскому дьяволу. Сабля, пистоль и пушки всегда при нём.',
    pal: { skin: '#c8906a', main: '#8a1a1a', sleeve: '#8a1a1a', fore: '#8a1a1a', glove: '#3a2a1a', pants: '#2a2430', boots: '#2a1a12', belt: '#3a2a1a', gold: '#e3b341', hat: '#1a1418', hair: '#140e10', eye: '#2a1a10', fx: '#ffb040' },
    build: BUILD({ chest: 7, waist: 5.6 }),
    stance: { hF: [11, 3], hB: [8, 6], wa: -50 },
    weapon: 'cutlass',
    draw: {
      tex: { main: foldTex(5, 4, 16), sleeve: foldTex(5, 3, 10), boots: (s, v, ti) => (s > 6 && s < 8) ? 4 : ti },
      back(R, J, P, c) { // полы камзола
        const b = this.build, a = TP(J, -b.waist, 1), w = Math.sin(c.t * 0.1) * 1;
        const kb = lp(J.hipB, J.knB, 0.75);
        plate(R, [[a.x, a.y], [J.hip.x, J.hip.y], [kb.x + 1 + w, kb.y + 2], [kb.x - 5 + w, kb.y + 1]], P.main, -0.18);
      },
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build, gd = C32(P.gold);
        plate(R, TPoly(J, [[-1, b.torso + 0.5], [5.4, b.torso - 0.5], [3, b.torso - 10]]), '#efe6d6');      // рубаха
        for (let i = 0; i < 3; i++) TPx(R, J, b.chest - 1.5, b.torso - 5 - i * 3, gd);
        plate(R, TPoly(J, [[-b.waist - 0.5, 0], [b.waist + 0.6, 0], [b.waist + 0.6, 3], [-b.waist - 0.5, 3]]), P.belt);
        const bk = TP(J, 2, 1.5); R.frect(bk.x - 1, bk.y - 1, 4, 3, gd);
        // перевязь через грудь
        TL(R, J, -b.waist, 2, b.chest - 1, b.torso - 2, C32('#3a2a1a'));
      },
      head(H, P) {
        const C = HC, hr = ramp(P.hair), h = ramp(P.hat);
        sphere(H, C - 1.5, C, 6, hr);
        faceMan(H, P, { brow: '#140e10' });
        plate(H, [[C + 1, C + 2], [C + 7, C + 2.5], [C + 6.5, C + 8], [C + 2, C + 9], [C - 0.5, C + 5]], hr);  // борода
        H.fline(C + 3.5, C + 4.5, C + 6.5, C + 4.3, C32('#6a2a1a'));
        // повязка на глаз
        H.frect(C + 3.5, C - 1, 4, 3, C32('#0a0608')); H.fline(C - 4, C - 4, C + 7, C - 1, C32('#0a0608'));
        // треуголка с черепом
        plate(H, [[C - 9, C - 4], [C + 9, C - 5], [C + 6, C - 8], [C + 2, C - 13], [C - 4, C - 12], [C - 7, C - 8]], h);
        H.fline(C - 9, C - 4.5, C + 9, C - 5.5, C32('#e3b341'));
        sphere(H, C, C - 9, 1.4, '#efe6d6'); H.dot(C - 0.5, C - 9.2, C32('#0a0608')); H.dot(C + 0.6, C - 9.2, C32('#0a0608'));
        H.dot(C - 2, C + 2.5, C32('#e3b341'));                                                               // серьга
      }
    },
    proj: 'shot', dash: 'board', fatal: { seq: ['B', 'D', 'D', 'F'], type: 'bombs', name: 'Бортовой залп' },
    win: 'sword', quote: 'Йо-хо-хо! На дно тебя, сухопутная крыса!'
  },
];

Object.assign(WEAPONS, {
  stinger(Rw) {
    // жало: чёрное древко и янтарный ядовитый наконечник
    Rw.capsule(-6, 20.5, 26, 20, 1, 1, c32('#1a1410'));
    for (let x = -4; x < 26; x += 4) Rw.rect(x, 19.4, 1.5, 1.4, c32('#f4c020'));
    Rw.poly([[26, 17.5], [44, 20], [26, 22.5]], c32('#e8a020')); Rw.poly([[26, 17.8], [44, 20], [28, 19.6]], c32('#ffe070'));
    Rw.dot(43, 20, c32('#ffffff')); Rw.dot(45, 21, c32('#7dff6a'));
  },
  cutlass(Rw) {
    // абордажная сабля с золотой гардой-чашей
    Rw.rect(8, 19, 9, 3, c32('#3a2a1a')); Rw.disk(17.5, 20.5, 2.6, c32('#e3b341')); Rw.dot(17, 19.5, c32('#fff1a8'));
    for (let i = 0; i <= 26; i++) { const x = 20 + i, y = 20.5 - (i * i) * 0.008; Rw.rect(x, y - 1.6 + i * 0.02, 1.2, 2.8 - i * 0.05, c32('#c8d0dc')); Rw.dot(x, y - 1.6, c32('#ffffff')); }
  }
});
Object.assign(PROJ, {
  salt: { vx: 4.4, y: -44, dmg: 9, hs: 18, kb: 4, r: 8, snd: 'throw', name: 'Горсть соли',
    draw(ctx, x, y, d, t) { ctx.fillStyle = '#ffffff'; for (let i = 0; i < 14; i++) { const a = i * 0.45 + t * 0.2; ctx.fillRect(Math.round(x + Math.cos(a) * (2 + i % 5)), Math.round(y + Math.sin(a) * (2 + i % 4)), 1, 1); } ctx.fillStyle = '#e8e8f0'; ctx.fillRect(x - 1, y - 1, 3, 3); },
    trail(x, y, d, t) { FX.p('px', x - d * 4, y + rand(-3, 3), -d * 0.2, rand(0, 0.5), 14, '#ffffff', 1, 0.05); } },
  sting: { vx: 6.6, y: -46, dmg: 8, hs: 16, kb: 2, r: 5, snd: 'slash', name: 'Ядовитое жало', poison: true,
    draw(ctx, x, y, d, t) { ctx.fillStyle = '#1a1410'; ctx.fillRect(Math.round(x - d * 7), y - 1, 8, 2); ctx.fillStyle = '#f4c020'; ctx.fillRect(Math.round(x - d * 4), y - 1, 2, 2); ctx.fillStyle = '#e8a020'; ctx.fillRect(Math.round(x + (d > 0 ? 1 : -4)), y - 1, 4, 2); ctx.fillStyle = '#7dff6a'; ctx.fillRect(Math.round(x + d * 4), y, 1, 1); },
    trail(x, y, d, t) { if (t % 2 === 0) FX.p('px', x - d * 6, y, 0, 0.2, 12, '#7dff6a', 1, 0); } },
  shot: { vx: 7.4, y: -50, dmg: 9, hs: 18, kb: 3, r: 4, snd: 'explode', name: 'Выстрел из пистоля',
    draw(ctx, x, y, d, t) { pdisk(ctx, x, y, 2, '#2a2a30'); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - 1, 1, 1); },
    trail(x, y, d, t) { FX.p('smoke', x - d * 6, y, 0, -0.2, 18, '#c8c0b8', 1, 0); } },
});
Object.assign(DASH, {
  sumopush: Object.assign({}, DASH.charge, { name: 'Толчок сумо', dmg: 13 }),
  buzz: Object.assign({}, DASH.jet, { jet: false, ghost: true, name: 'Жалящий бросок' }),
  icepath: Object.assign({}, DASH.slide, { name: 'Ледяная дорожка' }),
  board: Object.assign({}, DASH.dashcut, { name: 'Абордаж' }),
});
Object.assign(UNIQUE, {
  sumo: { name: 'Шико: топот', kind: 'quake' },
  vespa: { name: 'Рой ос', kind: 'flurry' },
  holm: { name: 'Ледяной разлом', kind: 'counter' },
  barracuda: { name: 'Залп пушек', kind: 'strike', style: 'bombs' },
});

(function () {
  const at = CHARS.findIndex(c => c.meme);
  CHARS.splice(at < 0 ? CHARS.length : at, 0, ...MORE);
  for (const c of MORE) { CHAR_BY_ID[c.id] = c; for (const k in c.draw) if (typeof c.draw[k] === 'function') c.draw[k] = c.draw[k].bind(Object.assign(c.draw, { build: c.build })); }
})();
