'use strict';
// Персонажи: 6 бойцов из разных миров + 4 героя итальянского брейнрота
const BUILD = o => Object.assign({ leg1: 15, leg2: 15, torso: 19, arm1: 11, arm2: 11, neck: 3, headR: 6, chest: 6.5, waist: 5.3, limb: 1, shDrop: 3 }, o);
const HC = 28; // центр растра головы

// ---------- общие детали костюмов ----------
const C32 = h => c32(h);
function rivet(R, x, y, col) { const r = ramp(col); R.px(x, y, r[4]); R.px(x + 1, y + 1, r[0]); }
// V-образные заломы ткани поперёк конечности (s — вдоль, v — поперёк)
const foldTex = (per, from, to) => (s, v, ti) => (ti >= 2 && s > from && s < to && Math.abs(v) < 0.75 && ((s + Math.abs(v) * 2.4) % per) < 0.9) ? ti - 1 : ti;
// обмотка/бинты: диагональные полосы
const wrapTex = (per, from, to) => (s, v, ti) => (s > from && s < to && ti > 0 && (((s + v * 2.2) % per) + per) % per < 1) ? ti - 1 : ti;
// чешуя: шахматные «пятна»
const scaleTex = (s, v, ti) => { if (ti < 2) return ti; const a = Math.floor(s / 2.2), b = Math.floor((v + 1) * 2.2 + (a & 1) * 0.5); return ((a + b) & 1) && ((s % 2.2) < 1.1) ? ti - 1 : ti; };
// древесные волокна вдоль оси
const grainTex = (sc, thr) => (s, v, ti) => { if (ti < 1) return ti; const g = v * sc + Math.sin(s * 0.11 + v * 1.5) * 0.35, f = g - Math.floor(g); return f < thr ? ti - 1 : ti; };
const combo = (...fs) => (s, v, ti, t) => { for (const f of fs) ti = f(s, v, ti, t); return ti; };

function headNinja(H, P, c, o) {
  const C = HC, t = c.t, hr = ramp(P.hood), mr = ramp(P.mask), sk = ramp(P.skin);
  if (o.band) { // хвосты повязки
    const br = ramp(o.band);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 10; i++) {
      const y = C - 3 + j * 2 + Math.round(Math.sin(t * 0.25 + i * 0.7 + j) * 1.2 + i * (0.35 + j * 0.25));
      H.rect(C - 6 - i, y, 1, 2, br[i > 6 ? 3 : (i + j) & 1 ? 1 : 2]);
    }
    sphere(H, C - 6, C - 2, 1.8, br);
  }
  if (o.pony) {
    const sw = Math.sin(t * 0.12) * 1.5, hc = ramp(P.hair);
    tube(H, { x: C - 4, y: C - 4 }, { x: C - 11, y: C + 1 + sw }, 2.6, 2.1, hc, -0.1);
    tube(H, { x: C - 11, y: C + 1 + sw }, { x: C - 15, y: C + 10 + sw * 1.5 }, 2.1, 0.9, hc);
    H.line(C - 6, C - 4, C - 11, C + sw, hc[4]); H.line(C - 11, C + 1 + sw, C - 14, C + 8 + sw * 1.5, hc[3]);
    H.line(C - 10, C + 2 + sw, C - 13, C + 9 + sw * 1.5, hc[1]);
    sphere(H, C - 5, C - 4, 2.3, P.mask); H.px(C - 6, C - 5, mr[4]);
  }
  sphere(H, C, C, 6.4, hr);
  // шов капюшона
  H.line(C - 2, C - 6, C - 4, C + 3, hr[1]);
  // нижняя маска со складками
  H.rect(C - 1, C, 7, 5, mr[2]); H.rect(C + 5, C + 1, 2, 2, mr[2]); H.rect(C - 1, C, 7, 1, mr[3]);
  H.rect(C, C + 2, 6, 1, mr[1]); H.rect(C - 1, C + 4, 6, 1, mr[1]); H.px(C + 6, C + 1, mr[3]); H.px(C + 6, C + 2, mr[1]);
  H.line(C - 1, C, C - 1, C + 4, mr[0]);
  // глазная прорезь
  H.rect(C, C - 3, 6, 3, sk[2]); H.rect(C, C - 1, 6, 1, sk[1]);
  H.rect(C, C - 4, 6, 1, hr[0]); H.px(C + 6, C - 3, hr[1]);
  const ec = c32(P.eye), pc = c32(o.pupil || P.eye);
  H.px(C + 2, C - 2, ec); H.px(C + 3, C - 2, ec); H.px(C + 4, C - 2, pc); H.px(C + 5, C - 2, sk[1]);
  H.px(C + 2, C - 3, hr[0]); H.px(C + 3, C - 3, sk[1]); // нахмуренная бровь
  if (o.glow) { H.px(C + 1, C - 2, c32(o.glow)); H.px(C + 3, C - 2, c32('#ffffff')); }
  if (o.lash) { H.px(C + 5, C - 3, c32('#1a1530')); H.px(C + 3, C - 2, c32('#ffffff')); }
}

const CHARS = [
  {
    id: 'kairo', name: 'Кайро', title: 'Огненный ниндзя', world: 'Мир Теней', g: 'm',
    desc: 'Изгнанный ниндзя клана Пламени. Его ярость горит жарче вулкана.',
    pal: { skin: '#d9a06f', main: '#e8a628', sleeve: '#e8a628', fore: '#2a2433', glove: '#2a2433', pants: '#e8a628', boots: '#2a2433', belt: '#1e1a24', beltKnot: true, hood: '#e8a628', mask: '#1e1a24', eye: '#fff6c8', fx: '#ff6a1a' },
    build: BUILD({}),
    draw: {
      tex: { sleeve: foldTex(5, 3, 10), pants: foldTex(5, 4, 13), fore: wrapTex(3, 1, 11), boots: wrapTex(3, 0, 8) },
      midBack(R, J, P) { // свёрнутая верёвка с кунаем на бедре
        const q = TP(J, -this.build.waist + 0.5, -1), rp = ramp('#8a6a44', -0.1);
        ovoid(R, q.x, q.y, 2.6, 3, rp); R.ellipse(q.x + 0.3, q.y + 0.3, 1, 1.4, rp[0]);
        const k1 = { x: q.x - 0.5, y: q.y + 3 }, k2 = { x: q.x - 1.5, y: q.y + 8 };
        tube(R, k1, k2, 0.9, 0.6, '#aab3bd');
      },
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build, mr = ramp(P.mask), my = ramp(P.main);
        // V-вырез: тёмная поддёвка-кольчуга
        plate(R, TPoly(J, [[-2.5, b.torso + 0.5], [5.8, b.torso - 1], [3, b.torso - 9]]), mr);
        TL(R, J, -2.5, b.torso - 0.5, 2.8, b.torso - 9, my[4]);
        TL(R, J, 5.8, b.torso - 1.5, 3.4, b.torso - 8.5, my[0]);
        TL(R, J, -1, 9, 2, 6, my[1]);
        // пряжка с эмблемой пламени
        const bk = TP(J, 1.8, 1.5);
        plate(R, [[bk.x - 2, bk.y - 2], [bk.x + 2, bk.y - 2], [bk.x + 2, bk.y + 2], [bk.x - 2, bk.y + 2]], '#8e979f');
        R.px(bk.x, bk.y, C32(P.fx)); R.px(bk.x, bk.y - 1, C32('#ffd34a')); R.px(bk.x - 1, bk.y + 0.5, C32('#c8401a'));
      },
      head(H, P, c) { headNinja(H, P, c, { band: P.mask, glow: '#ff8a2a' }); }
    },
    proj: 'fire', dash: 'teleport', fatal: { seq: ['B', 'F', 'F'], btn: 'p', type: 'burn', name: 'Пепел к пеплу' },
    win: 'fist', quote: 'Твоя душа сгорит дотла!'
  },
  {
    id: 'yuki', name: 'Юки', title: 'Ледяная куноити', world: 'Северный храм', g: 'f',
    desc: 'Хранительница вечной мерзлоты. Замораживает врагов одним взглядом.',
    pal: { skin: '#f1c7a6', main: '#2f7fd0', sleeve: '#2f7fd0', fore: '#d6efff', glove: '#d6efff', pants: '#2f7fd0', boots: '#d6efff', belt: '#d6efff', beltKnot: true, hood: '#2f7fd0', mask: '#d6efff', eye: '#ffffff', pupil: '#2a6fd0', hair: '#231d3d', fx: '#7fdcff' },
    build: BUILD({ chest: 6, waist: 4.7, limb: 0.92 }),
    draw: {
      tex: { sleeve: foldTex(5, 3, 10), pants: foldTex(6, 4, 13), fore: wrapTex(3, 2, 10), boots: wrapTex(3, 1, 7) },
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build, mr = ramp(P.mask), my = ramp(P.main);
        // запахнутый ворот с белой окантовкой
        TL(R, J, -1.5, b.torso, 3, b.torso - 8, mr[2]); TL(R, J, -0.5, b.torso, 4, b.torso - 8, mr[1]);
        TL(R, J, 4.5, b.torso - 1, 3.5, b.torso - 7, my[0]);
        TL(R, J, -3, 9, 0, 6, my[1]);
      },
      mid(R, J, P) { // набедренная накидка со снежинкой
        const b = this.build, sw = Math.sin(((J.knF.x - J.knB.x) || 0) * 0.08) * 1.5;
        const pts = TPoly(J, [[0.5, 1], [b.waist + 0.5, 1], [b.waist + 1 + sw, -9], [1.5 + sw, -9.5]]);
        plate(R, pts, shade(P.main, -0.12));
        const w = C32('#d6efff');
        const l1 = TP(J, 1.5 + sw, -9.2), l2 = TP(J, b.waist + 1 + sw, -8.7); R.line(l1.x, l1.y, l2.x, l2.y, w); R.line(l1.x, l1.y - 1, l2.x, l2.y - 1, ramp('#d6efff')[1]);
      },
      front(R, J, P) { // ледяной наплечник-кристалл
        const s = J.shF, ir = ramp('#9fdcff');
        plate(R, [[s.x - 4, s.y - 1], [s.x - 2, s.y - 5], [s.x - 0.5, s.y - 2.5], [s.x + 1.5, s.y - 6], [s.x + 3.5, s.y - 1.5], [s.x + 2.5, s.y + 2], [s.x - 3, s.y + 2]], ir);
        R.line(s.x - 2, s.y - 4, s.x - 1, s.y + 1, ir[4]); R.px(s.x + 1.5, s.y - 5, C32('#ffffff'));
      },
      head(H, P, c) { headNinja(H, P, c, { pony: true, pupil: P.pupil, lash: true }); }
    },
    proj: 'ice', dash: 'slide', fatal: { seq: ['F', 'D', 'F'], btn: 'k', type: 'shatter', name: 'Ледяная скульптура' },
    win: 'bow', quote: 'Зима пришла за тобой.'
  },
  {
    id: 'volt', name: 'Сержант Вольт', title: 'Космодесантник', world: 'Галактика 2299', g: 'm',
    desc: 'Ветеран звёздных войн в силовой броне. Плазма решает всё.',
    pal: { skin: '#c58c63', main: '#4f6b30', sleeve: '#4f6b30', fore: '#3a4c28', glove: '#7b848d', pants: '#3a4c28', boots: '#3b3f45', belt: '#2b2f35', armor: '#86ad50', metal: '#8e979f', visor: '#3fe0ff', fx: '#7dff6a' },
    build: BUILD({ chest: 8, waist: 6.4, limb: 1.16 }),
    bootTop: 0.3,
    draw: {
      tex: { boots: (s, v, ti) => (ti >= 1 && s > 1 && (s | 0) % 4 === 0) ? ti - 1 : ti },
      back(R, J, P, c) { // ранец с реактивным соплом
        const b = this.build, a = TP(J, -b.chest - 1, b.torso - 3), e = TP(J, -b.chest - 1, b.torso - 13), mt = ramp(P.metal);
        tube(R, a, e, 3.8, 3.4, P.metal);
        for (let i = 0; i < 3; i++) { const q = lp(a, e, 0.2 + i * 0.22); R.line(q.x - 2, q.y, q.x + 1, q.y, mt[0]); }
        const cl = lp(a, e, 0.12); R.px(cl.x - 2, cl.y, C32(P.fx)); R.px(cl.x - 2, cl.y + 1, C32('#2a8a2a'));
        const nz = TP(J, -b.chest - 1, b.torso - 16); tube(R, e, nz, 2.2, 1.8, '#3b3f45'); R.px(nz.x, nz.y + 1, C32('#ff8a3a'));
        if (c.f && c.f.jet) { for (let i = 0; i < 6; i++) R.disk(nz.x + rand(-1, 1), nz.y + 2 + i * 1.5, 2.4 - i * 0.35, c32(i < 2 ? '#ffffff' : i < 4 ? '#7fe0ff' : '#2f6bff')); }
      },
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build, ar = ramp(P.armor);
        // нагрудник с фаской
        plate(R, TPoly(J, [[0, b.torso - 0.5], [b.chest + 0.3, b.torso - 2.5], [b.chest - 0.3, 9.5], [0.8, 9]]), ar);
        // ворот-горжет
        tube(R, TP(J, -3, b.torso - 0.5), TP(J, 4, b.torso), 1.6, 1.6, '#3b3f45');
        // пресс: сегменты
        for (let i = 0; i < 2; i++) plate(R, TPoly(J, [[1.2, 8.4 - i * 3.2], [b.waist + 0.2, 8.4 - i * 3.2], [b.waist - 0.2, 6 - i * 3.2], [1.4, 6 - i * 3.2]]), ar, -0.12);
        // шевроны и заклёпки
        const ys = TP(J, b.chest - 3.2, b.torso - 4.5); R.rect(ys.x - 1, ys.y - 1, 3, 1, C32('#ffe27a')); R.rect(ys.x - 1, ys.y, 3, 1, C32('#d8a820'));
        const r1 = TP(J, 1.6, b.torso - 2.2); rivet(R, r1.x, r1.y, P.metal);
        // подсумок на поясе
        const q = TP(J, -3.5, 1.2); plate(R, [[q.x - 2, q.y - 2], [q.x + 2, q.y - 2], [q.x + 2, q.y + 2.2], [q.x - 2, q.y + 2.2]], '#6b6a3a');
      },
      arm(R, J, side, P, k, sh, el, hd) { // наручи
        const m = 1.16;
        tube(R, lp(el, hd, 0.25), lp(el, hd, 0.78), 2.9 * m, 2.7 * m, P.armor, k);
      },
      leg(R, J, side, P, k, hp, kn, ft) { // наколенники и носок ботинка
        sphere(R, kn.x + 0.5, kn.y - 0.3, 2.7, P.armor, k);
      },
      front(R, J, P) { // наплечник с шевронами
        const s = J.shF, ar = ramp(P.armor);
        sphere(R, s.x - 0.5, s.y - 0.8, 5, ar);
        R.line(s.x - 4.5, s.y + 2.5, s.x + 3.5, s.y + 2.5, ar[0]); R.line(s.x - 4, s.y + 1.5, s.x + 3, s.y + 1.5, ar[1]);
        const y = C32('#ffd34a'), d = C32('#2b2f35');
        for (let i = 0; i < 2; i++) { R.px(s.x - 2, s.y - 1 + i * 2, y); R.px(s.x - 1, s.y + i * 2, y); R.px(s.x, s.y - 1 + i * 2, y); }
        R.px(s.x + 2, s.y - 3, d); R.px(s.x + 2, s.y - 4, C32('#e6ebf0'));
      },
      head(H, P, c) {
        const C = HC, ar = ramp(P.armor), mt = ramp(P.metal), vr = ramp(P.visor);
        H.line(C - 4, C - 5, C - 7, C - 12, mt[0]); H.line(C - 3, C - 5, C - 6, C - 12, mt[3]);
        H.px(C - 7, C - 13, c32((c.t >> 4) & 1 ? '#ff3a3a' : '#7a1010')); H.px(C - 6, C - 13, c32((c.t >> 4) & 1 ? '#ffb0b0' : '#7a1010'));
        sphere(H, C, C, 7, ar);
        // гребень и шов шлема
        tube(H, { x: C - 5, y: C - 5 }, { x: C + 2, y: C - 7 }, 1.1, 1.1, mt);
        H.line(C - 2, C - 4, C - 3, C + 5, ar[1]); H.px(C - 4, C - 3, ar[4]); H.px(C - 5, C - 2, ar[3]);
        // ушной модуль
        sphere(H, C - 2, C + 1, 2.6, mt); H.px(C - 2, C + 1, C32(P.fx)); H.px(C - 1, C + 1, C32('#2a8a2a'));
        // визор с бликом и отражением
        H.rect(C, C - 4, 8, 4, C32('#1a2228'));
        H.rect(C + 1, C - 3, 6, 1, vr[3]); H.rect(C + 1, C - 2, 6, 1, vr[2]); H.rect(C + 1, C - 1, 6, 1, vr[1]);
        H.px(C + 2, C - 3, C32('#ffffff')); H.px(C + 3, C - 3, C32('#ffffff')); H.px(C + 5, C - 2, vr[4]); H.px(C + 6, C - 3, vr[4]);
        // респиратор
        H.rect(C + 2, C + 1, 5, 4, mt[2]); H.rect(C + 2, C + 1, 5, 1, mt[3]); H.rect(C + 6, C + 2, 1, 3, mt[0]);
        H.rect(C + 3, C + 2, 1, 2, C32('#2b2f35')); H.rect(C + 5, C + 2, 1, 2, C32('#2b2f35'));
      }
    },
    proj: 'plasma', dash: 'jet', fatal: { seq: ['D', 'D', 'F'], btn: 'p', type: 'laser', name: 'Орбитальный удар' },
    win: 'salute', quote: 'Цель ликвидирована. Конец связи.'
  },
  {
    id: 'ronin', name: 'Ронин-9', title: 'Кибер-самурай', world: 'Неон-Токио', g: 'm',
    desc: 'Андроид-самурай без хозяина. Клинок режет даже свет.',
    pal: { skin: '#d7a27b', main: '#262630', sleeve: '#262630', fore: '#d6dbe3', glove: '#3a3a46', pants: '#262630', boots: '#d6dbe3', belt: '#c0283a', armor: '#c0283a', metal: '#d6dbe3', eye: '#ff2a4a', gold: '#e3b341', fx: '#ff3a5a' },
    build: BUILD({ chest: 6.8 }),
    weapon: 'katana',
    stance: { hF: [10, -6], hB: [9, -4], wa: -40 },
    draw: {
      tex: {
        main: (s, v, ti) => (ti >= 2 && (s | 0) % 3 === 0) ? ti - 1 : ti,
        pants: (s, v, ti) => (ti >= 2 && (s | 0) % 3 === 0 && s > 2) ? ti - 1 : ti,
        fore: (s, v, ti) => (Math.abs(v + 0.15) < 0.14 && s > 2) ? 1 : ti,
        boots: (s, v, ti) => (Math.abs(v + 0.1) < 0.13) ? 1 : ti
      },
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build, gd = C32(P.gold);
        // до (кираса) из ламелей с золотой шнуровкой
        plate(R, TPoly(J, [[-2, b.torso - 0.5], [b.chest - 0.3, b.torso - 2], [b.chest - 1, 8], [-3, 8]]), P.armor);
        for (let i = 0; i < 3; i++) {
          const v = 10.5 + i * 3; TL(R, J, -2.5, v, b.chest - 1, v, ramp(P.armor)[0]);
          for (let u = -1.5; u < b.chest - 1; u += 2) TPx(R, J, u, v + 0.6, gd);
        }
        // светящееся ядро
        const g = TP(J, b.chest - 2.5, b.torso - 4.5);
        R.px(g.x, g.y, C32('#ffd0d8')); R.px(g.x, g.y + 1, C32(P.eye)); R.px(g.x - 1, g.y, C32(P.eye)); R.px(g.x + 1, g.y + 1, C32('#7a1020'));
      },
      mid(R, J, P) { // кусадзури — три пластины юбки
        const b = this.build, gd = C32(P.gold);
        for (let i = 0; i < 3; i++) {
          const u0 = -b.waist - 1.5 + i * (b.waist * 2 + 3) / 3, u1 = u0 + (b.waist * 2 + 3) / 3 - 0.3;
          plate(R, TPoly(J, [[u0, 2], [u1, 2], [u1 + 0.6 + i * 0.4, -7], [u0 + i * 0.4 - 0.4, -7]]), P.armor, -0.12 - (2 - i) * 0.06);
          for (let v = -1; v > -7; v -= 2.5) TPx(R, J, (u0 + u1) / 2 + 0.3, v, gd);
        }
        tube(R, TP(J, -b.waist - 1.5, 1.8), TP(J, b.waist + 2, 1.8), 1.2, 1.2, P.gold);
        const kn = TP(J, b.waist, 0.5); sphere(R, kn.x, kn.y, 1.5, P.gold); tube(R, kn, TP(J, b.waist + 1, -4), 0.7, 0.5, P.gold);
      },
      arm(R, J, side, P, k, sh, el, hd) { // кибер-предплечье: стык и индикатор
        sphere(R, el.x, el.y, 2.3, '#3a3a46', k);
        const q = lp(el, hd, 0.55); R.px(q.x, q.y, C32(side === 'F' ? P.eye : '#7a1020'));
      },
      leg(R, J, side, P, k, hp, kn, ft) {
        sphere(R, kn.x, kn.y, 2.6, '#3a3a46', k); R.px(kn.x, kn.y, C32(side === 'F' ? P.eye : '#7a1020'));
      },
      front(R, J, P) { // соде — наплечник из трёх пластин
        const s = J.shF;
        for (let i = 2; i >= 0; i--) {
          plate(R, [[s.x - 4, s.y - 2.5 + i * 2.2], [s.x + 3.5, s.y - 2.5 + i * 2.2], [s.x + 3.8, s.y + 0.2 + i * 2.2], [s.x - 4.3, s.y + 0.2 + i * 2.2]], P.armor, -i * 0.1);
          R.line(s.x - 4, s.y + 0.2 + i * 2.2, s.x + 3.6, s.y + 0.2 + i * 2.2, C32(P.gold));
        }
      },
      head(H, P, c) {
        const C = HC, ar = ramp(P.armor), gd = ramp(P.gold);
        // сикоро — назатыльник из пластин
        for (let i = 2; i >= 0; i--) {
          plate(H, [[C - 3, C - 1 + i * 2.2], [C - 10 + i * 0.4, C + 2.5 + i * 2.4], [C - 9.5 + i * 0.6, C + 4.6 + i * 2.4], [C - 2.5, C + 1.2 + i * 2.2]], ar, -0.15 * i);
          H.line(C - 9.5 + i * 0.6, C + 4.6 + i * 2.4, C - 3, C + 1.2 + i * 2.2, gd[2]);
        }
        sphere(H, C, C, 6.3, ar);
        for (const x of [-3, 0, 3]) H.line(C + x, C - 5 + Math.abs(x) * 0.3, C + x * 1.1, C - 3, ar[1]);
        H.rect(C - 6, C - 2, 13, 1, gd[2]); H.rect(C - 6, C - 3, 12, 1, gd[3]); H.px(C - 5, C - 3, gd[4]);
        // мэмпо и визор
        H.rect(C, C - 2, 7, 7, C32('#1b1b22')); H.rect(C, C - 2, 7, 1, C32('#3a3a46'));
        H.rect(C + 1, C - 1, 5, 1, C32(P.eye)); H.px(C + 3, C - 1, C32('#ffd0d8')); H.px(C + 4, C - 1, C32('#ffffff')); H.px(C + 6, C - 1, C32('#ff9aa8'));
        H.rect(C + 1, C + 2, 5, 1, C32('#3a3a46')); H.rect(C + 1, C + 4, 4, 1, C32('#3a3a46'));
        H.px(C + 2, C + 2, C32('#6a6a7a')); H.px(C + 4, C + 2, C32('#6a6a7a')); H.px(C + 6, C + 1, C32('#55555f'));
        // маэдатэ — золотые рога и камень
        tube(H, { x: C + 1, y: C - 6 }, { x: C + 5, y: C - 12 }, 0.8, 0.6, gd); tube(H, { x: C + 1, y: C - 6 }, { x: C - 2, y: C - 12 }, 0.8, 0.6, gd);
        H.px(C + 5, C - 12, gd[4]); H.px(C - 2, C - 12, gd[4]);
        sphere(H, C + 1, C - 6, 1.4, '#c0283a'); H.px(C + 1, C - 7, C32('#ffd0d8'));
      }
    },
    proj: 'slash', dash: 'dashcut', fatal: { seq: ['F', 'F', 'B'], btn: 'k', type: 'slice', name: 'Идеальный разрез' },
    win: 'sword', quote: 'Мой клинок не знает пощады.'
  },
  {
    id: 'bjorn', name: 'Бьорн', title: 'Викинг-берсерк', world: 'Северные саги', g: 'm',
    desc: 'Берсерк из страны фьордов. Его топор помнит сотню битв.',
    pal: { skin: '#e6b089', main: '#8a2b2b', sleeve: '#e6b089', fore: '#e6b089', bracer: '#5a3c22', glove: '#e6b089', pants: '#5b4733', boots: '#4a3020', belt: '#3a2412', fur: '#8b6a44', beard: '#d0702a', metal: '#b9c0c8', horn: '#efe6cf', fx: '#9fd8ff' },
    build: BUILD({ chest: 8.6, waist: 7, limb: 1.2 }),
    weapon: 'axe',
    stance: { hF: [9, -5], hB: [8, 0], wa: -50, torso: 14 },
    draw: {
      tex: {
        main: foldTex(6, 2, 14),
        bracer: (s, v, ti) => (ti >= 1 && Math.abs(v + 0.1) < 0.12 && ((s | 0) & 1)) ? 4 : ti,
        // перекрёстная обмотка штанин
        pants: (s, v, ti, t) => ti,
        boots: (s, v, ti) => ti
      },
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build, mr = ramp(P.main);
        // вышитый подол туники
        for (let u = -b.waist; u < b.waist; u += 2) TPx(R, J, u + 0.5, 3.6, C32('#e3b341'));
        TL(R, J, -b.waist + 0.5, 4.4, b.waist - 0.5, 4.4, mr[3]);
        // перевязь через грудь с заклёпками
        tube(R, TP(J, -4, b.torso - 2), TP(J, 5, 4), 1.3, 1.3, '#5a3c22');
        for (let i = 1; i < 4; i++) { const q = lp(TP(J, -4, b.torso - 2), TP(J, 5, 4), i / 4); rivet(R, q.x, q.y - 0.5, P.metal); }
        // большая пряжка и кошель
        const bk = TP(J, b.waist - 2, 1.5);
        plate(R, [[bk.x - 2.2, bk.y - 2], [bk.x + 2.2, bk.y - 2], [bk.x + 2.2, bk.y + 2], [bk.x - 2.2, bk.y + 2]], '#e3b341'); R.px(bk.x, bk.y, C32('#5a3c22'));
        const pu = TP(J, -3, -0.5); plate(R, [[pu.x - 2, pu.y - 1.5], [pu.x + 2, pu.y - 1.5], [pu.x + 1.6, pu.y + 3], [pu.x - 1.6, pu.y + 3]], '#7a5232'); R.line(pu.x - 2, pu.y - 0.5, pu.x + 2, pu.y - 0.5, C32('#3a2412'));
        // меховой воротник
        for (let i = -2; i <= 2; i++) {
          const q = TP(J, i * 2.4, b.torso - 1 + (i === 0 ? 1 : 0));
          sphere(R, q.x, q.y, 2.9, P.fur, 0, (x, y, ti) => ti >= 2 && ((x * 2 + y) & 3) === 0 ? 1 : ti);
        }
      },
      arm(R, J, side, P, k, sh, el, hd) { // татуировка-узор на плече
        if (side !== 'F') return;
        const a = lp(sh, el, 0.35), b2 = lp(sh, el, 0.7), t = C32('#3a5a8a');
        R.line(a.x - 1, a.y, b2.x - 1, b2.y, t); R.px(a.x, a.y + 1, t); R.px(b2.x, b2.y - 1, t); R.px((a.x + b2.x) / 2 + 1, (a.y + b2.y) / 2, t);
        rivet(R, lp(el, hd, 0.5).x, lp(el, hd, 0.5).y - 1, P.metal);
      },
      leg(R, J, side, P, k, hp, kn, ft) { // крест-накрест обмотки и меховой отворот сапог
        const lr = ramp('#b8a07a', k), a = lp(kn, ft, 0.1), b2 = lp(kn, ft, 0.45);
        for (let i = 0; i < 2; i++) { const p1 = lp(a, b2, i / 2), p2 = lp(a, b2, (i + 1) / 2); R.line(p1.x - 2.5, p1.y, p2.x + 2.5, p2.y, lr[i ? 1 : 2]); }
        const q = lp(kn, ft, 0.5); tube(R, { x: q.x - 3.3, y: q.y }, { x: q.x + 3.3, y: q.y + 0.4 }, 1.6, 1.6, P.fur, k);
      },
      head(H, P, c) {
        const C = HC, mt = ramp(P.metal), bd = ramp(P.beard), sk = ramp(P.skin), hn = ramp(P.horn);
        // рога с кольцами
        const hornTex = (s, v, ti) => ((s | 0) % 3 === 2 && ti > 0) ? ti - 1 : ti;
        tube(H, { x: C - 4, y: C - 5 }, { x: C - 9, y: C - 9 }, 1.9, 1.4, hn, 0, hornTex); tube(H, { x: C - 9, y: C - 9 }, { x: C - 8, y: C - 14 }, 1.4, 0.5, hn);
        tube(H, { x: C + 3, y: C - 5 }, { x: C + 8, y: C - 9 }, 1.9, 1.4, hn, 0, hornTex); tube(H, { x: C + 8, y: C - 9 }, { x: C + 7, y: C - 14 }, 1.4, 0.5, hn);
        sphere(H, C, C, 6, sk);
        H.px(C - 2, C, sk[1]); H.px(C - 2, C + 1, sk[1]); H.px(C - 3, C, sk[3]); // ухо
        // борода с прядями, коса с кольцами, усы
        sphere(H, C + 2, C + 3.8, 4.7, bd, 0, (x, y, ti) => ti >= 2 && (((x * 2 + y * 3) | 0) % 4 === 0) ? 1 : ti);
        tube(H, { x: C + 3, y: C + 6 }, { x: C + 3, y: C + 12 }, 1.5, 1, bd, 0, (s, v, ti) => ((s * 1.3 + v * 1.5) | 0) & 1 ? Math.max(1, ti - 1) : ti);
        H.px(C + 3, C + 9, C32('#e3b341')); H.px(C + 2, C + 9, C32('#a07a18')); H.px(C + 4, C + 9, C32('#fff1a8'));
        tube(H, { x: C + 2, y: C + 1.2 }, { x: C + 7.2, y: C + 1.6 }, 1.1, 1, bd); H.px(C + 7, C + 3, bd[2]); H.px(C + 1, C + 3, bd[1]);
        H.px(C + 5, C + 3, C32('#5a1a1a')); H.px(C + 6, C + 3, C32('#5a1a1a'));
        // нос, глаз, шрам
        H.px(C + 6, C - 1, sk[3]); H.px(C + 6, C, sk[1]); H.px(C + 7, C - 1, sk[2]);
        H.rect(C + 2, C - 2, 4, 1, sk[0]);
        H.px(C + 3, C - 1, C32('#1a1018')); H.px(C + 4, C - 1, C32('#e8f2ff'));
        H.line(C + 2, C - 2, C + 4, C + 1, C32('#c86a5a')); H.px(C + 4, C + 1, C32('#e89a8a'));
        // шлем: купол, обод с заклёпками, наносник
        sphere(H, C, C - 1, 6.9, mt, 0, (x, y, ti) => y > -3 ? -1 : ti);
        H.line(C - 1, C - 8, C - 1, C - 4, mt[3]); H.line(C, C - 8, C, C - 4, mt[1]);
        H.rect(C - 7, C - 3, 14, 2, mt[1]); H.rect(C - 7, C - 3, 14, 1, mt[3]);
        for (const x of [-5, -2, 1, 4]) H.px(C + x, C - 2, C32('#e3b341'));
        H.rect(C + 5, C - 2, 1, 3, mt[2]); H.px(C + 5, C + 1, mt[0]);
      }
    },
    proj: 'axe', dash: 'charge', fatal: { seq: ['D', 'F', 'D'], btn: 'p', type: 'hammer', name: 'Молот богов' },
    win: 'roar', quote: 'Вальхалла ждёт, но не тебя!'
  },
  {
    id: 'morena', name: 'Морена', title: 'Некромантка', world: 'Королевство Мглы', g: 'f',
    desc: 'Повелительница мёртвых. Каждая победа — новая душа в коллекцию.',
    pal: { skin: '#d9d2ea', main: '#4b2a6e', sleeve: '#4b2a6e', fore: '#d9d2ea', glove: '#d9d2ea', pants: '#2f1a45', boots: '#2a1a33', belt: '#c9a227', robe: '#4b2a6e', trim: '#c9a227', hair: '#efeaff', eye: '#d07bff', fx: '#c06bff' },
    build: BUILD({ chest: 6, waist: 4.8, limb: 0.92 }),
    draw: {
      back(R, J, P, c) {
        const b = this.build, sw = Math.sin(c.t * 0.1) * 2, rb = ramp(P.robe, -0.4);
        const a = TP(J, -2, b.torso), e = TP(J, -5, b.torso - 3);
        const h1 = { x: J.hip.x - 15 + sw, y: J.hip.y + 27 }, h2 = { x: J.hip.x - 8 + sw * 0.5, y: J.hip.y + 29 };
        plate(R, [[a.x, a.y], [e.x, e.y], [h1.x, h1.y], [h2.x, h2.y], [J.hip.x - 2, J.hip.y + 10]], rb);
        // складки плаща
        R.line(e.x - 1, e.y + 4, h1.x + 3, h1.y - 1, rb[0]); R.line(a.x - 3, a.y + 8, h2.x - 2, h2.y - 1, rb[1]);
        R.line(h1.x, h1.y, h2.x, h2.y, C32(P.trim)); R.line(h1.x + 1, h1.y - 1, h2.x, h2.y - 1, ramp(P.trim)[0]);
        // стоячий воротник за головой
        const n = TP(J, -1, b.torso + 1);
        plate(R, [[n.x - 1, n.y + 2], [n.x - 6, n.y - 7], [n.x - 2, n.y - 9], [n.x + 2, n.y - 2]], P.robe, -0.25);
        R.line(n.x - 6, n.y - 7, n.x - 2, n.y - 9, C32(P.trim));
      },
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build, t = C32(P.trim);
        TL(R, J, -1.5, b.torso, 2.5, b.torso - 7, t); TL(R, J, 5, b.torso - 1, 2.5, b.torso - 7, ramp(P.trim)[1]);
        // брошь-череп
        const q = TP(J, 2.5, b.torso - 7.5), w = C32('#efe6cf');
        R.px(q.x - 1, q.y, w); R.px(q.x, q.y, w); R.px(q.x + 1, q.y, w); R.px(q.x, q.y + 1, C32('#9c947c')); R.px(q.x - 1, q.y + 1, C32('#2a1630')); R.px(q.x + 1, q.y + 1, C32('#2a1630'));
        R.px(q.x, q.y - 1, w);
      },
      mid(R, J, P) {
        const b = this.build, a = TP(J, -b.waist - 0.5, 3), e = TP(J, b.waist + 0.5, 3);
        const kf = { x: J.knF.x + 3, y: J.knF.y + 3 }, kb = { x: J.knB.x - 3, y: J.knB.y + 3 };
        const rr = ramp(P.robe);
        plate(R, [[a.x, a.y], [e.x, e.y], [kf.x, kf.y], [kb.x, kb.y]], rr);
        // складки юбки
        for (let i = 1; i < 4; i++) { const p1 = lp(a, e, i / 4), p2 = lp(kb, kf, i / 4 + 0.05); R.line(p1.x, p1.y + 2, p2.x, p2.y - 1, rr[i & 1 ? 1 : 3]); }
        R.line(kb.x, kb.y, kf.x, kf.y, C32(P.trim)); R.line(kb.x, kb.y - 1, kf.x, kf.y - 1, ramp(P.trim)[0]);
        // руны у подола
        const g = C32(P.fx);
        for (let i = 1; i < 4; i++) { const p = lp(kb, kf, i / 4); R.px(p.x, p.y - 3, g); R.px(p.x + (i & 1 ? 1 : -1), p.y - 2, g); R.px(p.x, p.y - 4, C32('#f0d0ff')); }
        const m1 = TP(J, 1, b.torso - 2), m2 = TP(J, 1, 2); R.line(m1.x, m1.y, m2.x, m2.y, C32(P.trim));
        // пояс-цепь с черепком
        tube(R, TP(J, -b.waist, 3), TP(J, b.waist, 3), 1, 1, P.trim);
        const ch = TP(J, b.waist - 1, 1); for (let i = 0; i < 3; i++) R.px(ch.x + i * 0.3, ch.y + i * 1.5, ramp(P.trim)[i & 1 ? 1 : 3]);
        sphere(R, ch.x + 1, ch.y + 5, 1.6, '#efe6cf'); R.px(ch.x + 1.5, ch.y + 5, C32('#2a1630'));
      },
      arm(R, J, side, P, k, sh, el, hd) { // раструб рукава с золотой каймой
        const m = 0.92, q = lp(el, hd, 0.5);
        tube(R, lp(sh, el, 0.6), q, 2.8 * m, 3.6 * m, P.robe, k);
        const d = { x: hd.x - el.x, y: hd.y - el.y }, l = Math.hypot(d.x, d.y) || 1, px = -d.y / l * 3.2, py = d.x / l * 3.2;
        R.line(q.x + px, q.y + py, q.x - px, q.y - py, ramp(P.trim, k)[2]);
        const n = { x: hd.x + d.x / l * 2.6, y: hd.y + d.y / l * 2.6 }; R.px(n.x, n.y, C32('#2a1638'));
      },
      head(H, P, c) {
        const C = HC, rr = ramp(P.robe), sk = ramp(P.skin), hr = ramp(P.hair);
        plate(H, [[C - 5, C - 4], [C - 11, C - 10], [C - 2, C - 6.5]], rr, -0.2);
        sphere(H, C, C, 6.6, rr);
        // кромка капюшона и тень внутри
        H.ellipse(C + 2.8, C + 0.5, 4.2, 5.2, rr[3]);
        H.ellipse(C + 3, C + 0.6, 3.6, 4.6, C32('#1a0e24'));
        H.ellipse(C + 3.4, C + 0.9, 3, 4.1, sk[2]);
        H.rect(C + 1, C - 2, 1, 6, sk[1]); H.px(C + 5, C + 1, sk[3]); H.px(C + 5, C, sk[3]);
        // глаза со свечением и тенями
        H.rect(C + 2, C - 2, 5, 1, C32('#3a1a4a'));
        H.px(C + 3, C - 1, C32(P.eye)); H.px(C + 5, C - 1, C32(P.eye)); H.px(C + 5, C - 2, C32('#f4d0ff')); H.px(C + 3, C - 2, C32('#8a3aa0'));
        H.px(C + 6, C + 1, sk[1]); H.px(C + 4, C + 3, C32('#4a1040')); H.px(C + 5, C + 3, C32('#7a2a6a'));
        // серебряные пряди и диадема
        for (let i = 0; i < 4; i++) H.line(C - 1 + i * 0.5, C - 3, C - 2 + i, C + 9 + (i & 1), hr[i & 1 ? 3 : 1]);
        H.line(C + 2, C - 3, C + 1, C + 5, hr[2]); H.px(C + 1, C + 6, hr[1]);
        H.px(C + 4, C - 4, C32('#c06bff')); H.px(C + 3, C - 4, C32(P.trim)); H.px(C + 5, C - 4, C32(P.trim)); H.px(C + 4, C - 5, C32('#f4d0ff'));
      }
    },
    proj: 'skull', dash: 'warp', fatal: { seq: ['B', 'B', 'D'], btn: 'k', type: 'souls', name: 'Жатва душ' },
    win: 'levitate', quote: 'Твоя душа теперь принадлежит мне.'
  },
  {
    id: 'tralalero', name: 'Тралалеро Тралала', title: 'Акула в кроссовках', world: 'Итальянский брейнрот', g: 'm', meme: true,
    desc: 'Трёхногая акула в синих кроссах. Тралалеро тралала, порко дио!',
    pal: { skin: '#6d8fae', main: '#6d8fae', sleeve: '#6d8fae', fore: '#6d8fae', glove: '#6d8fae', pants: '#6d8fae', shoes: '#2f6bff', sole: '#ffffff', stripe: '#ffffff', belly: '#eef2f4', fx: '#4fc3ff' },
    build: BUILD({ chest: 7.2, waist: 6.2, limb: 1.05, headR: 7, neck: 1 }),
    fin: true,
    draw: {
      back(R, J, P, c) {
        const b = this.build, sw = Math.sin(c.t * 0.18) * 2, mr = ramp(P.main, -0.25);
        // хвост с раздвоенным плавником
        const a = TP(J, -b.waist + 1, 3), t1 = TP(J, -b.waist - 10, 9 + sw), t2 = TP(J, -b.waist - 12, -2 + sw), t3 = TP(J, -b.waist - 7, 2.5 + sw * 0.5);
        plate(R, [[a.x, a.y], [t1.x, t1.y], [t3.x, t3.y], [t2.x, t2.y], [a.x + 1, a.y + 4]], mr);
        R.line(a.x - 1, a.y + 1, t1.x + 2, t1.y + 1, mr[3]);
        // спинной плавник с выщербиной
        const f1 = TP(J, -b.chest + 2, b.torso - 3), f2 = TP(J, -b.chest - 8, b.torso + 5), f3 = TP(J, -b.chest + 1, b.torso - 11), fn = TP(J, -b.chest - 3.5, b.torso - 1);
        plate(R, [[f1.x, f1.y], [f2.x, f2.y], [fn.x, fn.y + 1.5], [f3.x, f3.y]], P.main, -0.12);
        R.line(f1.x - 1, f1.y, f2.x + 1, f2.y + 1, ramp(P.main)[3]);
        // третья нога в кроссовке
        const hm = { x: J.hip.x - 0.5, y: J.hip.y + 0.5 };
        const tg = Math.abs(J.rot) > 0.3 ? lp(J.ftB, J.ftF, 0.45) : { x: J.ftB.x * 0.55 + J.ftF.x * 0.45, y: Math.max(J.ftB.y, J.ftF.y) };
        const lg = ik(hm, tg, b.leg1, b.leg2, { x: 1, y: -0.15 });
        drawLeg(R, { build: b, draw: this }, { hipM: hm, knM: lg.j, ftM: lg.end }, 'M', P, -0.45);
      },
      tex: { pants: (s, v, ti) => ti, fore: (s, v, ti) => ti },
      leg(R, J, side, P, k, hp, kn, ft, toe) { // шнурки
        if (k < -0.2) return;
        const w = ramp('#ffffff', k), l = lp(ft, toe, 0.3);
        R.rect(l.x, l.y - 2.5, 2, 1, w[2]);
      },
      torso(R, J, P) {
        const b = this.build;
        tube(R, J.hip, J.neck, b.waist, b.chest, P.main);
        const a = TP(J, 2.6, 3), e = TP(J, 3.2, b.torso - 4);
        tube(R, a, e, 3.6, 4, P.belly, -0.05, (s, v, ti) => ti >= 2 && (s | 0) % 4 === 3 && v < 0.6 ? 1 : ti);
        // жабры-шрамы на груди
        const sc = ramp(P.main);
        for (let i = 0; i < 2; i++) TL(R, J, -3 + i * 1.6, b.torso - 3, -2.4 + i * 1.6, b.torso - 7, sc[0]);
      },
      head(H, P, c) {
        const C = HC, mr = ramp(P.main), bl = ramp(P.belly);
        plate(H, [[C - 3, C - 5], [C + 2, C - 6], [C - 7, C - 15], [C - 5, C - 10]], mr, -0.15);
        ovoid(H, C + 2.6, C - 0.5, 9.8, 6.4, mr);
        ovoid(H, C + 4.5, C + 3.4, 7.6, 2.8, bl);
        // пасть: дёсны и зубы
        H.line(C + 3, C + 0.5, C + 12, C + 1, C32('#3a1520'));
        H.line(C + 4, C + 2, C + 11, C + 2, C32('#5a1a2a'));
        for (let x = C + 5; x < C + 12; x += 2) { H.px(x, C + 2, C32('#ffffff')); H.px(x + 1, C + 1, C32('#ffffff')); }
        H.px(C + 2, C, C32('#3a1520')); H.px(C + 2, C - 1, C32('#3a1520'));
        // глаз и злая бровь
        H.rect(C + 5, C - 3, 2, 2, C32('#0c0c14')); H.px(C + 5, C - 3, C32('#ffffff'));
        H.line(C + 4, C - 5, C + 7, C - 4, mr[0]);
        H.px(C + 10, C - 2, mr[0]); // ноздря
        for (let i = 0; i < 3; i++) { H.line(C - 2 - i * 2, C - 1, C - 1 - i * 2, C + 2, mr[0]); H.px(C - 3 - i * 2, C - 1, mr[3]); }
      }
    },
    proj: 'wave', dash: 'torpedo', fatal: { seq: ['F', 'B', 'F'], btn: 'k', type: 'bite', name: 'Акулья пасть' },
    win: 'dance', quote: 'Тралалеро тралала! Порко дио!'
  },
  {
    id: 'bombardiro', name: 'Бомбардиро Крокодило', title: 'Крокодил-бомбардировщик', world: 'Итальянский брейнрот', g: 'm', meme: true,
    desc: 'Наполовину крокодил, наполовину бомбардировщик. Бомбит всё, что движется.',
    pal: { skin: '#4f8a3a', main: '#7d868f', sleeve: '#4f8a3a', fore: '#4f8a3a', glove: '#4f8a3a', pants: '#4f8a3a', shoes: '#2c4a22', belly: '#c9d78a', metal: '#7d868f', cap: '#6a4a2a', glass: '#7fd0ff', fx: '#ffb84a' },
    build: BUILD({ chest: 7.4, waist: 6, limb: 1.05, headR: 6 }),
    draw: {
      tex: { sleeve: scaleTex, fore: scaleTex, pants: scaleTex, shoes: (s, v, ti) => ti },
      back(R, J, P, c) {
        const b = this.build, sw = Math.sin(c.t * 0.12) * 1.5;
        const t0 = TP(J, -b.waist + 1, 4), t1 = TP(J, -b.waist - 7, -4 + sw), t2 = TP(J, -b.waist - 13, -12 + sw);
        tube(R, t0, t1, 3.6, 2.6, P.skin, -0.2, scaleTex); tube(R, t1, t2, 2.6, 1.2, P.skin, -0.2, scaleTex);
        // гребни-щитки на хвосте
        const sr = ramp(P.skin, -0.05);
        for (let i = 0; i < 5; i++) { const q = lp(t0, t2, 0.1 + i * 0.18), r = 3 - i * 0.45; R.px(q.x - r * 0.7, q.y - r * 0.7, sr[3]); R.px(q.x - r * 0.7 - 1, q.y - r * 0.7, sr[1]); }
        this.wing(R, J, P, c, -0.35, 3);
      },
      wing(R, J, P, c, k, up) {
        const b = this.build, mr = ramp(P.metal, k);
        const A = TP(J, 1, b.torso - 3 + up), B = TP(J, -24, b.torso + 12 + up), C2 = TP(J, -27, b.torso + 8 + up), D = TP(J, -4, b.torso - 10 + up);
        plate(R, [[A.x, A.y], [B.x, B.y], [C2.x, C2.y], [D.x, D.y]], mr);
        // элерон, панели, заклёпки
        const e1 = TP(J, -14, b.torso - 2 + up), e2 = TP(J, -25, b.torso + 6 + up); R.line(e1.x, e1.y, e2.x, e2.y, mr[1]);
        const l1 = TP(J, -2, b.torso - 5 + up), l2 = TP(J, -24, b.torso + 10 + up); R.line(l1.x, l1.y, l2.x, l2.y, mr[3]);
        for (let i = 1; i < 6; i++) { const q = lp(l1, l2, i / 6); R.px(q.x, q.y + 2, mr[i & 1 ? 0 : 4]); }
        // бомба под крылом
        const bp = TP(J, -18, b.torso + 2 + up), bo = { x: bp.x, y: bp.y + 4 };
        R.line(bp.x, bp.y, bo.x, bo.y - 1, mr[0]);
        tube(R, { x: bo.x - 3.5, y: bo.y }, { x: bo.x + 3, y: bo.y }, 1.6, 1.8, '#4a5a32', k);
        R.px(bo.x + 4.5, bo.y, C32('#c8323c')); R.px(bo.x - 5, bo.y - 1.5, C32('#3a4428')); R.px(bo.x - 5, bo.y + 1.5, C32('#3a4428'));
        R.line(bo.x - 1, bo.y - 1, bo.x - 1, bo.y + 1, C32('#e3b341'));
        // мотогондола и винт
        const e = TP(J, -11, b.torso + 1 + up); tube(R, TP(J, -15, b.torso + 3.5 + up), e, 2.5, 2.3, '#5b636b', k);
        const pr = TP(J, -8.5, b.torso - 0.5 + up), ph = (c.t >> 1) & 3;
        if (ph < 2) R.line(pr.x - 1, pr.y - 4, pr.x + 1, pr.y + 4, C32('#2a2a2a')); else R.line(pr.x - 3, pr.y + 1, pr.x + 3, pr.y - 1, C32('#2a2a2a'));
        R.px(pr.x - 2, pr.y - 3, C32('#8a8a8a')); R.px(pr.x + 2, pr.y + 3, C32('#8a8a8a'));
        sphere(R, pr.x, pr.y, 1.3, '#c8323c', k);
        if (k === 0) { const r = TP(J, -20, b.torso + 7 + up); R.disk(r.x, r.y, 2.3, C32('#c8323c')); R.disk(r.x, r.y, 1.4, C32('#ffffff')); R.px(r.x, r.y, C32('#2a4fa0')); }
      },
      torso(R, J, P) {
        const b = this.build;
        // фюзеляж: кольцевые панели и заклёпки
        tube(R, J.hip, J.neck, b.waist, b.chest, P.main, 0, (s, v, ti) => ti >= 1 && (s % 5) < 0.8 ? ti - 1 : (ti >= 2 && (s % 5) > 4 && Math.abs(v * 4 % 2) < 0.4) ? 4 : ti);
        const a = TP(J, 2.5, 3), e = TP(J, 3, b.torso - 5);
        tube(R, a, e, 3.2, 3.6, P.belly, 0, (s, v, ti) => ti >= 2 && (s % 3) < 0.9 ? 1 : ti);
        for (let i = 0; i < 4; i++) { const q = TP(J, -3, 4 + i * 4); rivet(R, q.x, q.y, '#b9c2ca'); }
        // кабина с бликом
        const w = TP(J, -1, b.torso - 3);
        plate(R, [[w.x - 2, w.y - 1.5], [w.x + 2, w.y - 1.5], [w.x + 2.5, w.y + 1.5], [w.x - 2, w.y + 1.5]], P.glass);
        R.px(w.x - 1, w.y - 1, C32('#ffffff')); R.px(w.x, w.y, C32('#e0f6ff'));
        // бортовой номер
        const n = TP(J, -4, 9); R.px(n.x, n.y, C32('#ffd34a')); R.px(n.x, n.y + 1, C32('#ffd34a')); R.px(n.x + 1, n.y - 0.2, C32('#ffd34a'));
      },
      preArm(R, J, P, c) { this.wing(R, J, P, c, 0, 0); },
      head(H, P, c) {
        const C = HC, sk = ramp(P.skin), cp = ramp(P.cap);
        // морда: верхняя и нижняя челюсти
        tube(H, { x: C + 2, y: C + 3 }, { x: C + 12, y: C + 3.5 }, 1.6, 1.2, P.belly);
        tube(H, { x: C + 2, y: C + 0.5 }, { x: C + 13, y: C + 1.5 }, 3.2, 2.3, sk, 0, (s, v, ti) => ti >= 2 && v < -0.2 && ((s | 0) % 3 === 0) ? 3 : ti);
        for (let x = C + 4; x < C + 14; x += 2) { H.px(x, C + 2 + ((x >> 1) & 1), C32('#ffffff')); H.px(x + 1, C + 3, C32('#e6e8d0')); }
        H.line(C + 3, C + 2.4, C + 13, C + 2.6, C32('#2a1a14'));
        sphere(H, C + 13, C - 0.5, 1.6, sk); H.px(C + 13, C - 1, C32('#14200f')); H.px(C + 12, C - 1, C32('#14200f'));
        sphere(H, C - 1, C, 5.6, sk, 0, (x, y, ti) => ti >= 2 && ((x + y * 2 + 20) | 0) % 4 === 0 ? 1 : ti);
        // надбровная шишка и глаз рептилии
        sphere(H, C + 4, C - 1.5, 2.2, sk);
        H.px(C + 4, C - 1, C32('#ffe14a')); H.px(C + 5, C - 1, C32('#14200f')); H.px(C + 5, C - 2, C32('#ffe14a')); H.px(C + 3, C - 3, sk[4]);
        // кожаный шлем пилота с ушами и швом
        ovoid(H, C - 1, C - 3, 5.6, 3.6, cp);
        H.line(C - 5, C - 4, C + 2, C - 6, cp[1]);
        plate(H, [[C - 6, C - 2], [C - 2, C - 2], [C - 2, C + 3], [C - 6, C + 2]], cp);
        H.px(C - 4, C + 1, C32('#e3b341'));
        // очки-консервы
        sphere(H, C + 1, C - 4.5, 2.4, '#5a4a3a'); H.disk(C + 1, C - 4.5, 1.5, C32(P.glass)); H.px(C, C - 5, C32('#ffffff')); H.px(C + 2, C - 4, C32('#3a8ac0'));
        sphere(H, C - 2.5, C - 5, 1.9, '#5a4a3a'); H.disk(C - 2.5, C - 5, 1.1, C32(shade(P.glass, -0.2)));
      }
    },
    proj: 'bomb', dash: 'dive', fatal: { seq: ['D', 'B', 'F'], btn: 'p', type: 'bombs', name: 'Ковровая бомбардировка' },
    win: 'fly', quote: 'Бомбардиро Крокодило летит за тобой!'
  },
  {
    id: 'tung', name: 'Тун Тун Сахур', title: 'Бревно с битой', world: 'Итальянский брейнрот', g: 'm', meme: true,
    desc: 'Тун-тун-тун-тун-тун-тун-тун-тун-тун Сахур! Приходит, если не проснулся.',
    pal: { skin: '#c48c52', main: '#c48c52', bark: '#8a5a30', ring: '#e9c38c', sleeve: '#c48c52', fore: '#c48c52', glove: '#c48c52', pants: '#c48c52', shoes: '#7a4a24', fx: '#ffd36a' },
    build: BUILD({ leg1: 13, leg2: 13, torso: 21, chest: 8.4, waist: 8.2, limb: 0.72, arm1: 10, arm2: 10, shDrop: 5 }),
    headless: true, weapon: 'bat',
    stance: { hF: [10, -7], hB: [8, -2], wa: -35, torso: 4 },
    draw: {
      tex: { sleeve: grainTex(0.8, 0.3), fore: grainTex(0.8, 0.3), pants: grainTex(0.8, 0.3) },
      torso(R, J, P, c) {
        const b = this.build, a = TP(J, 0, -2), e = TP(J, 0, b.torso + 11);
        tube(R, a, e, 8.6, 8.2, P.main, 0, grainTex(2.2, 0.3));
        // сучки
        for (const [u, v] of [[-4.5, 9], [5, 22]]) { const q = TP(J, u, v); ovoid(R, q.x, q.y, 1.6, 1.2, P.bark, -0.1); R.px(q.x, q.y, C32('#4a2a12')); R.px(q.x - 1, q.y - 1, ramp(P.ring)[2]); }
        const ck = TP(J, -6.5, 15); R.line(ck.x, ck.y, ck.x + 1, ck.y + 4, C32('#5a3418'));
        // спил с годовыми кольцами
        const top = TP(J, 0, b.torso + 12.5), rg = ramp(P.ring);
        R.ellipse(top.x, top.y, 7.6, 2.5, C32(P.bark));
        R.ellipse(top.x - 0.3, top.y - 0.2, 6.8, 2, rg[2]);
        R.ellipse(top.x, top.y, 4.8, 1.4, rg[1]); R.ellipse(top.x, top.y, 4, 1.05, rg[3]);
        R.ellipse(top.x, top.y, 2.2, 0.75, rg[1]); R.px(top.x, top.y, C32(P.bark));
        R.line(top.x + 1, top.y, top.x + 5, top.y + 1, C32('#8a5a30'));
        // лицо
        HEAD_R.clear();
        const C = HC, H = HEAD_R;
        H.disk(C, C, 2.9, C32('#1a1010')); H.disk(C, C, 2.3, C32('#ffffff')); H.disk(C + 6, C, 2.9, C32('#1a1010')); H.disk(C + 6, C, 2.3, C32('#ffffff'));
        H.px(C - 1, C + 1, C32('#d8d8e0')); H.px(C + 5, C + 1, C32('#d8d8e0'));
        H.rect(C + 1, C - 1, 1, 2, C32('#120a0a')); H.rect(C + 7, C - 1, 1, 2, C32('#120a0a')); H.px(C, C - 1, C32('#ffffff'));
        H.line(C - 3, C - 5, C + 2, C - 3, C32('#3a2010')); H.line(C - 3, C - 4, C + 1, C - 3, C32('#3a2010'));
        H.line(C + 4, C - 3, C + 9, C - 5, C32('#3a2010')); H.line(C + 5, C - 3, C + 9, C - 4, C32('#3a2010'));
        H.px(C + 3, C + 2, C32('#8a5a30')); H.px(C + 3, C + 3, C32('#6a3a18'));
        H.rect(C, C + 5, 7, 3, C32('#3a1010')); H.rect(C + 1, C + 5, 5, 1, C32('#ffffff')); H.px(C + 3, C + 7, C32('#c84a4a')); H.px(C + 2, C + 7, C32('#a03030'));
        H.px(C - 1, C + 5, C32('#5a3418')); H.px(C + 7, C + 4, C32('#5a3418'));
        const fp = TP(J, 2.5, b.torso + 4);
        R.blitRot(H, C + 3, C + 1, fp.x, fp.y, J.ta);
      }
    },
    proj: 'tun', dash: 'leap', fatal: { seq: ['F', 'F', 'F'], btn: 'p', type: 'bat', name: 'Тун-Тун-Тун!' },
    win: 'drum', quote: 'Тун! Тун! Тун! Сахуууур!'
  },
  {
    id: 'ballerina', name: 'Балерина Капучина', title: 'Балерина с чашкой', world: 'Итальянский брейнрот', g: 'f', meme: true,
    desc: 'Изящная балерина с головой-капучино. Её пируэты бодрят сильнее эспрессо.',
    pal: { skin: '#f2c7a5', main: '#f08cb8', sleeve: '#f2c7a5', fore: '#f2c7a5', glove: '#f2c7a5', pants: '#f9dbe6', shoes: '#f08cb8', tutu: '#ffc2db', cup: '#f6f3ee', coffee: '#7a4a2a', foam: '#e7cfa6', fx: '#c98a5a' },
    build: BUILD({ chest: 5.6, waist: 4.3, limb: 0.85, leg1: 16, leg2: 16, torso: 17, headR: 7, neck: 3 }),
    stance: { hF: [6, -14], hB: [-2, -15], torso: 2, fF: [6, -1], fB: [-6, 0], eF: { x: -0.2, y: -1 }, eB: { x: 0.2, y: -1 } },
    draw: {
      tex: { main: (s, v, ti) => (ti >= 2 && s > 11 && ((s + v * 3) | 0) % 3 === 0) ? 3 : ti },
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build, mr = ramp(P.main);
        // лиф с кружевным вырезом
        TL(R, J, -3, b.torso - 1, 1, b.torso - 5, C32('#ffffff')); TL(R, J, 1, b.torso - 5, 4.5, b.torso - 1.5, ramp('#ffffff')[1]);
        TL(R, J, -3, 6, 4, 6, mr[1]);
        // бантик на талии
        const q = TP(J, 2, 3.5);
        plate(R, [[q.x, q.y], [q.x - 3, q.y - 1.8], [q.x - 3, q.y + 1.8]], '#e0609a'); plate(R, [[q.x, q.y], [q.x + 3, q.y - 1.8], [q.x + 3, q.y + 1.8]], '#e0609a');
        R.px(q.x, q.y, C32('#ffe0ec'));
      },
      leg(R, J, side, P, k, hp, kn, ft) { // пуанты: ленты крест-накрест
        const rr = ramp(P.shoes, k), a = lp(kn, ft, 0.55);
        R.line(a.x - 2, a.y, ft.x + 1.5, ft.y - 1, rr[2]); R.line(a.x + 2, a.y + 1, ft.x - 1.5, ft.y - 1.5, rr[3]);
        R.px(a.x - 2, a.y, rr[4]);
      },
      mid(R, J, P, c) { // пачка из трёх ярусов с волнистым краем
        const t = TP(J, 0, 1), tr = ramp(P.tutu);
        ovoid(R, t.x, t.y + 0.8, 12.5, 3.6, P.tutu, -0.22);
        for (let i = -11; i <= 10; i += 3) R.rect(t.x + i, t.y + 3.6, 2, 1, tr[0]);
        ovoid(R, t.x - 0.5, t.y - 0.2, 10.5, 2.6, P.tutu);
        for (let i = -8; i <= 8; i += 3) R.rect(t.x + i, t.y + 1.6, 2, 1, tr[1]);
        ovoid(R, t.x - 1, t.y - 1.2, 7, 1.5, P.tutu, 0.15);
      },
      head(H, P, c) {
        const C = HC, cr = ramp(P.cup);
        // ручка и блюдце
        sphere(H, C - 7, C, 3, cr, -0.1); H.disk(C - 7, C, 1.6, 0);
        // чашка с фаской
        plate(H, [[C - 6.5, C - 5], [C + 6.5, C - 5], [C + 5, C + 5], [C - 5, C + 5]], cr);
        H.rect(C - 4, C - 3, 2, 6, C32('#ffffff'));
        H.line(C - 6, C - 4, C + 6, C - 4, cr[1]);
        // кофе с пенкой и латте-сердечком
        H.ellipse(C, C - 5, 6.6, 1.8, C32(P.coffee)); H.ellipse(C, C - 5.2, 5.4, 1.2, C32(P.foam));
        const ht = C32('#9a6a3a'); H.px(C - 1, C - 6, ht); H.px(C + 1, C - 6, ht); H.px(C, C - 5, ht); H.px(C - 1, C - 5, ht); H.px(C + 1, C - 5, ht);
        ovoid(H, C, C + 6, 8.4, 1.6, P.cup, -0.12);
        H.line(C - 7, C + 7, C + 7, C + 7, cr[0]);
        // пар
        const st = c.t * 0.08;
        for (let i = 0; i < 3; i++) { const x1 = C + 3 + Math.sin(st + i * 0.9) * 1.3, x2 = C + 3 + Math.sin(st + i * 0.9 + 0.9) * 1.3; H.line(x1, C - 7 - i * 2, x2, C - 9 - i * 2, c32(i < 2 ? '#ffffff' : '#d8e2ec')); }
        // лицо: ресницы, глаза, румянец, улыбка
        H.rect(C + 2, C - 1, 1, 2, C32('#2a1a1a')); H.px(C + 1, C - 2, C32('#2a1a1a')); H.px(C + 2, C - 2, C32('#2a1a1a'));
        H.rect(C + 4, C - 1, 1, 2, C32('#2a1a1a')); H.px(C + 5, C - 2, C32('#2a1a1a')); H.px(C + 4, C - 2, C32('#2a1a1a'));
        H.px(C + 2, C - 1, C32('#6a4a4a'));
        H.px(C + 1, C + 1, C32('#ff9ab8')); H.px(C + 5, C + 1, C32('#ff9ab8')); H.px(C + 0, C + 1, C32('#ffc0d4'));
        H.px(C + 3, C + 2, C32('#c0405a')); H.px(C + 2, C + 2, C32('#e07a90'));
        // пучок с заколкой
        sphere(H, C - 1, C - 9, 2.3, '#5a3a24'); H.px(C - 2, C - 10, C32('#8a6a4a')); H.px(C + 1, C - 9, C32('#f08cb8'));
      }
    },
    proj: 'coffee', dash: 'pirouette', fatal: { seq: ['B', 'F', 'D'], btn: 'k', type: 'tornado', name: 'Смертельное фуэте' },
    win: 'spin', quote: 'Капучино-пируэт! Аривидерчи!'
  }
];
// чтобы draw-хуки видели build своего персонажа через this
for (const ch of CHARS) if (ch.draw) for (const k in ch.draw) if (typeof ch.draw[k] === 'function') ch.draw[k] = ch.draw[k].bind(Object.assign(ch.draw, { build: ch.build }));
const CHAR_BY_ID = Object.fromEntries(CHARS.map(c => [c.id, c]));
