'use strict';
// Персонажи: 6 бойцов из разных миров + 4 героя итальянского брейнрота
const BUILD = o => Object.assign({ leg1: 15, leg2: 15, torso: 19, arm1: 11, arm2: 11, neck: 3, headR: 6, chest: 6.5, waist: 5.3, limb: 1, shDrop: 3 }, o);
const HC = 28; // центр растра головы

function headNinja(H, P, c, o) {
  const C = HC, t = c.t;
  if (o.pony) {
    const sw = Math.sin(t * 0.12) * 1.5;
    H.capsule(C - 4, C - 4, C - 11, C + 1 + sw, 2.4, 2, c32(shade(P.hair, -0.2)));
    H.capsule(C - 11, C + 1 + sw, C - 15, C + 9 + sw * 1.5, 2, 1.2, c32(P.hair));
    H.capsule(C - 10, C + sw, C - 14, C + 8 + sw * 1.5, 0.6, 0.4, c32(shade(P.hair, 0.4)));
    ball(H, C - 5, C - 4, 2.2, P.mask);
  }
  ball(H, C, C, 6.2, P.hood);
  H.rect(C - 1, C, 7, 5, c32(P.mask)); H.rect(C + 5, C + 1, 1, 2, c32(P.mask));
  H.rect(C - 1, C + 3, 7, 1, c32(shade(P.mask, -0.25)));
  H.rect(C, C - 3, 6, 3, c32(P.skin));
  H.rect(C, C - 1, 6, 1, c32(shade(P.skin, -0.3)));
  H.rect(C, C - 3, 6, 1, c32(shade(P.hood, -0.35)));
  H.px(C + 2, C - 2, c32(P.eye)); H.px(C + 3, C - 2, c32(P.eye)); H.px(C + 4, C - 2, c32(o.pupil || P.eye));
  if (o.band) for (let i = 0; i < 10; i++) {
    const y = C - 3 + Math.round(Math.sin(t * 0.25 + i * 0.7) * 1.2 + i * 0.35);
    H.rect(C - 6 - i, y, 1, 2, c32(i > 6 ? shade(o.band, 0.2) : o.band));
  }
}

const CHARS = [
  {
    id: 'kairo', name: 'Кайро', title: 'Огненный ниндзя', world: 'Мир Теней', g: 'm',
    desc: 'Изгнанный ниндзя клана Пламени. Его ярость горит жарче вулкана.',
    pal: { skin: '#d9a06f', main: '#e8a628', sleeve: '#e8a628', fore: '#2a2433', glove: '#2a2433', pants: '#e8a628', boots: '#2a2433', belt: '#1e1a24', beltKnot: true, hood: '#e8a628', mask: '#1e1a24', eye: '#fff6c8', fx: '#ff6a1a' },
    build: BUILD({}),
    draw: {
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build, a = TP(J, -2, b.torso - 1), m = TP(J, 3, b.torso - 9), e = TP(J, 5.5, b.torso - 2);
        R.poly([[a.x + 2, a.y], [e.x, e.y], [m.x, m.y]], c32(P.mask));
        R.line(a.x, a.y, m.x, m.y, c32(shade(P.main, -0.4)));
      },
      head(H, P, c) { headNinja(H, P, c, { band: P.mask }); }
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
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build, a = TP(J, -1, b.torso - 1), m = TP(J, 3, b.torso - 8);
        R.line(a.x, a.y, m.x, m.y, c32('#d6efff')); R.line(a.x + 1, a.y, m.x + 1, m.y, c32('#9fd2f5'));
      },
      head(H, P, c) { headNinja(H, P, c, { pony: true, pupil: P.pupil }); }
    },
    proj: 'ice', dash: 'slide', fatal: { seq: ['F', 'D', 'F'], btn: 'k', type: 'shatter', name: 'Ледяная скульптура' },
    win: 'bow', quote: 'Зима пришла за тобой.'
  },
  {
    id: 'volt', name: 'Сержант Вольт', title: 'Космодесантник', world: 'Галактика 2299', g: 'm',
    desc: 'Ветеран звёздных войн в силовой броне. Плазма решает всё.',
    pal: { skin: '#c58c63', main: '#5c7d36', sleeve: '#5c7d36', fore: '#46602a', glove: '#7b848d', pants: '#46602a', boots: '#3b3f45', belt: '#2b2f35', armor: '#6f9440', metal: '#8e979f', visor: '#3fe0ff', fx: '#7dff6a' },
    build: BUILD({ chest: 8, waist: 6.4, limb: 1.16 }),
    bootTop: 0.3,
    draw: {
      back(R, J, P, c) {
        const b = this.build, a = TP(J, -b.chest - 1, b.torso - 3), e = TP(J, -b.chest - 1, b.torso - 13);
        limb(R, a, e, 3.6, 3.2, P.metal);
        if (c.f && c.f.jet) { for (let i = 0; i < 6; i++) R.disk(e.x - Math.sin(J.ta) * 0 + rand(-1, 1), e.y + 2 + i * 1.5, 2.4 - i * 0.35, c32(i < 2 ? '#ffffff' : i < 4 ? '#7fe0ff' : '#2f6bff')); }
      },
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build;
        const p1 = TP(J, 1, b.torso - 1), p2 = TP(J, b.chest, b.torso - 3), p3 = TP(J, b.chest - 0.5, 5), p4 = TP(J, 1, 4);
        R.poly([[p1.x, p1.y], [p2.x, p2.y], [p3.x, p3.y], [p4.x, p4.y]], c32(P.armor));
        for (let i = 0; i < 3; i++) { const a = TP(J, 1.5, 7 + i * 3.5), e = TP(J, b.chest - 0.5, 7 + i * 3.5); R.line(a.x, a.y, e.x, e.y, c32(shade(P.armor, -0.35))); }
        const l = TP(J, b.chest - 2, b.torso - 4); R.px(l.x, l.y, c32('#ffdf4a'));
      },
      front(R, J, P) {
        ball(R, J.shF.x - 0.5, J.shF.y - 0.6, 4.8, P.armor);
        R.line(J.shF.x - 4, J.shF.y + 2, J.shF.x + 3, J.shF.y + 2, c32(shade(P.armor, -0.4)));
        R.px(J.shF.x - 1, J.shF.y - 2, c32('#ffdf4a'));
      },
      head(H, P, c) {
        const C = HC;
        H.line(C - 4, C - 5, C - 7, C - 12, c32('#2b2f35')); H.px(C - 7, C - 13, c32((c.t >> 4) & 1 ? '#ff3a3a' : '#7a1010'));
        ball(H, C, C, 7, P.armor);
        H.disk(C - 2, C + 1, 2.4, c32(P.metal)); H.px(C - 2, C + 1, c32('#2b2f35'));
        H.rect(C + 1, C - 3, 6, 3, c32(P.visor)); H.rect(C + 1, C - 1, 6, 1, c32(shade(P.visor, -0.45)));
        H.px(C + 2, C - 3, c32('#ffffff')); H.px(C + 3, C - 3, c32('#d8fbff'));
        H.rect(C + 2, C + 2, 4, 3, c32('#3b3f45')); H.px(C + 3, C + 3, c32('#8e979f')); H.px(C + 5, C + 3, c32('#8e979f'));
        H.rect(C - 4, C - 7, 7, 1, c32(shade(P.armor, 0.3)));
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
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build;
        const p1 = TP(J, -2, b.torso - 1), p2 = TP(J, b.chest - 0.5, b.torso - 2), p3 = TP(J, b.chest - 1, 8), p4 = TP(J, -3, 8);
        R.poly([[p1.x, p1.y], [p2.x, p2.y], [p3.x, p3.y], [p4.x, p4.y]], c32(P.armor));
        for (let i = 0; i < 3; i++) { const a = TP(J, -2, 10 + i * 3), e = TP(J, b.chest - 1, 10 + i * 3); R.line(a.x, a.y, e.x, e.y, c32(P.metal)); }
        const g = TP(J, b.chest - 2, b.torso - 5); R.px(g.x, g.y, c32(P.eye)); R.px(g.x, g.y + 1, c32(P.eye));
      },
      mid(R, J, P) {
        const b = this.build, a = TP(J, -b.waist - 1, 2), e = TP(J, b.waist + 1.5, 2), f = TP(J, b.waist + 3, -7), g = TP(J, -b.waist - 2.5, -7);
        R.poly([[a.x, a.y], [e.x, e.y], [f.x, f.y], [g.x, g.y]], c32(shade(P.armor, -0.15)));
        const m1 = TP(J, -b.waist - 1.5, -2.5), m2 = TP(J, b.waist + 2, -2.5); R.line(m1.x, m1.y, m2.x, m2.y, c32(P.gold));
      },
      front(R, J, P) {
        const s = J.shF; R.rect(s.x - 4, s.y - 2, 7, 5, c32(shade(P.armor, -0.4))); R.rect(s.x - 3, s.y - 2, 6, 4, c32(P.armor)); R.rect(s.x - 3, s.y, 6, 1, c32(P.gold));
      },
      head(H, P, c) {
        const C = HC;
        H.poly([[C - 6, C - 1], [C - 10, C + 6], [C - 3, C + 5]], c32(shade(P.armor, -0.3)));
        ball(H, C, C, 6.3, P.armor);
        H.rect(C, C - 2, 6, 7, c32('#1b1b22')); H.rect(C + 1, C - 1, 5, 1, c32(P.eye)); H.px(C + 6, C - 1, c32('#ff9aa8'));
        H.rect(C + 1, C + 2, 4, 1, c32('#3a3a46'));
        H.line(C + 1, C - 6, C + 5, C - 12, c32(P.gold)); H.line(C + 1, C - 6, C - 2, C - 12, c32(P.gold)); H.px(C + 1, C - 6, c32('#fff1a8'));
        H.rect(C - 6, C - 2, 12, 1, c32(P.gold));
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
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build;
        const bk = TP(J, b.waist - 1.5, 1.5); R.rect(bk.x - 1, bk.y - 1, 3, 3, c32('#e3b341'));
        for (let i = -2; i <= 2; i++) { const q = TP(J, i * 2.4, b.torso - 1 + (i === 0 ? 1 : 0)); ball(R, q.x, q.y, 2.8, P.fur); }
        const s1 = TP(J, -3, b.torso - 3), s2 = TP(J, 4, 4); R.line(s1.x, s1.y, s2.x, s2.y, c32('#3a2412'));
      },
      head(H, P, c) {
        const C = HC;
        ball(H, C, C, 6, P.skin);
        H.ellipse(C + 2, C + 4, 5, 4.5, c32(shade(P.beard, -0.3))); H.ellipse(C + 2, C + 3.5, 4.3, 3.8, c32(P.beard));
        H.capsule(C + 3, C + 6, C + 3, C + 11, 1.4, 1, c32(P.beard)); H.px(C + 3, C + 9, c32('#e3b341'));
        H.rect(C + 1, C, 6, 1, c32(shade(P.beard, 0.2)));
        H.px(C + 3, C - 2, c32('#1a1018')); H.px(C + 2, C - 3, c32('#7a3a1a')); H.px(C + 3, C - 3, c32('#7a3a1a')); H.px(C + 4, C - 3, c32('#7a3a1a'));
        H.px(C + 6, C - 1, c32(shade(P.skin, -0.2)));
        for (let y = -7; y <= -2; y++) for (let x = -7; x <= 7; x++) if (x * x + y * y <= 44) H.px(C + x, C + y, c32(y < -5 ? shade(P.metal, 0.3) : P.metal));
        H.rect(C - 7, C - 2, 14, 2, c32(shade(P.metal, -0.4))); H.px(C - 4, C - 2, c32('#e3b341')); H.px(C, C - 2, c32('#e3b341')); H.px(C + 4, C - 2, c32('#e3b341'));
        H.capsule(C - 4, C - 5, C - 9, C - 9, 1.8, 1.4, c32(P.horn)); H.capsule(C - 9, C - 9, C - 8, C - 14, 1.3, 0.6, c32(P.horn));
        H.capsule(C + 3, C - 5, C + 8, C - 9, 1.8, 1.4, c32(P.horn)); H.capsule(C + 8, C - 9, C + 7, C - 14, 1.3, 0.6, c32(P.horn));
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
        const b = this.build, sw = Math.sin(c.t * 0.1) * 2;
        const a = TP(J, -2, b.torso), e = TP(J, -5, b.torso - 3);
        R.poly([[a.x, a.y], [e.x, e.y], [J.hip.x - 15 + sw, J.hip.y + 27], [J.hip.x - 8 + sw * 0.5, J.hip.y + 29], [J.hip.x - 2, J.hip.y + 10]], c32(shade(P.robe, -0.45)));
        R.line(J.hip.x - 15 + sw, J.hip.y + 27, J.hip.x - 8 + sw * 0.5, J.hip.y + 29, c32(P.trim));
      },
      mid(R, J, P) {
        const b = this.build, a = TP(J, -b.waist - 0.5, 3), e = TP(J, b.waist + 0.5, 3);
        const kf = { x: J.knF.x + 3, y: J.knF.y + 3 }, kb = { x: J.knB.x - 3, y: J.knB.y + 3 };
        R.poly([[a.x, a.y], [e.x, e.y], [kf.x, kf.y], [kb.x, kb.y]], c32(P.robe));
        R.line(kb.x, kb.y, kf.x, kf.y, c32(P.trim));
        const m1 = TP(J, 1, b.torso - 2), m2 = TP(J, 1, 2); R.line(m1.x, m1.y, m2.x, m2.y, c32(P.trim));
      },
      head(H, P, c) {
        const C = HC;
        H.poly([[C - 5, C - 4], [C - 10, C - 9], [C - 2, C - 6]], c32(shade(P.robe, -0.2)));
        ball(H, C, C, 6.6, P.robe);
        H.ellipse(C + 2.5, C + 0.5, 3.6, 4.6, c32(P.skin));
        H.rect(C + 2, C - 1, 4, 1, c32('#2a1638')); H.px(C + 3, C - 1, c32(P.eye)); H.px(C + 5, C - 1, c32(P.eye));
        H.px(C + 4, C + 3, c32('#7a2a6a')); H.px(C + 5, C + 3, c32('#7a2a6a'));
        for (let i = 0; i < 4; i++) H.line(C - 1 + i * 0.5, C - 3, C - 2 + i, C + 9 + (i & 1), c32(i & 1 ? P.hair : shade(P.hair, -0.25)));
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
        const b = this.build, sw = Math.sin(c.t * 0.18) * 2;
        const a = TP(J, -b.waist + 1, 3), t1 = TP(J, -b.waist - 9, 8 + sw), t2 = TP(J, -b.waist - 12, -1 + sw), t3 = TP(J, -b.waist - 7, 2 + sw * 0.5);
        R.poly([[a.x, a.y], [t1.x, t1.y], [t3.x, t3.y], [t2.x, t2.y], [a.x + 1, a.y + 4]], c32(shade(P.main, -0.25)));
        const f1 = TP(J, -b.chest + 2, b.torso - 3), f2 = TP(J, -b.chest - 7, b.torso + 4), f3 = TP(J, -b.chest + 1, b.torso - 11);
        R.poly([[f1.x, f1.y], [f2.x, f2.y], [f3.x, f3.y]], c32(shade(P.main, -0.15)));
      },
      torso(R, J, P) {
        const b = this.build;
        limb(R, J.hip, J.neck, b.waist, b.chest, P.main);
        const a = TP(J, 2.6, 3), e = TP(J, 3.2, b.torso - 4);
        R.capsule(a.x, a.y, e.x, e.y, 3.6, 4, c32(shade(P.belly, -0.15))); R.capsule(a.x + 0.3, a.y - 0.4, e.x + 0.3, e.y - 0.4, 3, 3.3, c32(P.belly));
      },
      head(H, P, c) {
        const C = HC;
        H.poly([[C - 3, C - 5], [C + 2, C - 6], [C - 6, C - 14]], c32(shade(P.main, -0.3)));
        H.ellipse(C + 3, C, 10, 6.5, c32(shade(P.main, -0.4))); H.ellipse(C + 2.6, C - 0.5, 9.2, 5.8, c32(P.main));
        H.ellipse(C + 1, C - 3, 5, 1.6, c32(shade(P.main, 0.3)));
        H.ellipse(C + 4.5, C + 3.2, 7.5, 2.6, c32(P.belly));
        H.line(C + 5, C + 1, C + 12, C + 1, c32('#3a1520'));
        for (let x = C + 6; x < C + 12; x += 2) { H.px(x, C + 2, c32('#ffffff')); H.px(x + 1, C, c32('#ffffff')); }
        H.rect(C + 5, C - 3, 2, 2, c32('#0c0c14')); H.px(C + 5, C - 3, c32('#ffffff'));
        for (let i = 0; i < 3; i++) H.line(C - 2 - i * 2, C - 1, C - 2 - i * 2, C + 2, c32(shade(P.main, -0.45)));
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
      back(R, J, P, c) {
        const b = this.build, sw = Math.sin(c.t * 0.12) * 1.5;
        const t0 = TP(J, -b.waist + 1, 4), t1 = TP(J, -b.waist - 7, -4 + sw), t2 = TP(J, -b.waist - 13, -12 + sw);
        limb(R, t0, t1, 3.6, 2.6, P.skin, -0.2); limb(R, t1, t2, 2.6, 1.2, P.skin, -0.2);
        for (let i = 0; i < 3; i++) { const q = lp(t0, t2, 0.2 + i * 0.25); R.px(q.x, q.y - 2, c32(shade(P.skin, 0.25))); }
        this.wing(R, J, P, c, -0.35, 3);
      },
      wing(R, J, P, c, k, up) {
        const b = this.build;
        const A = TP(J, 1, b.torso - 3 + up), B = TP(J, -24, b.torso + 12 + up), C2 = TP(J, -27, b.torso + 8 + up), D = TP(J, -4, b.torso - 10 + up);
        R.poly([[A.x, A.y], [B.x, B.y], [C2.x, C2.y], [D.x, D.y]], c32(shade(P.metal, k - 0.4)));
        const A2 = TP(J, 0, b.torso - 4 + up), B2 = TP(J, -24, b.torso + 11 + up), C3 = TP(J, -26, b.torso + 8.5 + up), D2 = TP(J, -3.5, b.torso - 8.5 + up);
        R.poly([[A2.x, A2.y], [B2.x, B2.y], [C3.x, C3.y], [D2.x, D2.y]], c32(S(P.metal, k)));
        const l1 = TP(J, -2, b.torso - 5 + up), l2 = TP(J, -24, b.torso + 10 + up); R.line(l1.x, l1.y, l2.x, l2.y, c32(S(shade(P.metal, 0.35), k)));
        const e = TP(J, -11, b.torso + 1 + up); limb(R, TP(J, -15, b.torso + 3.5 + up), e, 2.4, 2.4, '#5b636b', k);
        const pr = TP(J, -8.5, b.torso - 0.5 + up), ph = (c.t >> 1) & 3;
        if (ph < 2) R.line(pr.x - 1, pr.y - 4, pr.x + 1, pr.y + 4, c32('#2a2a2a')); else R.line(pr.x - 3, pr.y + 1, pr.x + 3, pr.y - 1, c32('#2a2a2a'));
        R.px(pr.x, pr.y, c32('#c8323c'));
        if (k === 0) { const r = TP(J, -20, b.torso + 7 + up); R.disk(r.x, r.y, 2.3, c32('#c8323c')); R.disk(r.x, r.y, 1.4, c32('#ffffff')); R.px(r.x, r.y, c32('#2a4fa0')); }
      },
      torso(R, J, P) {
        const b = this.build;
        limb(R, J.hip, J.neck, b.waist, b.chest, P.main);
        const a = TP(J, 2.5, 3), e = TP(J, 3, b.torso - 5);
        R.capsule(a.x, a.y, e.x, e.y, 3.2, 3.6, c32(P.belly));
        for (let i = 0; i < 4; i++) { const q = TP(J, -3, 4 + i * 4); R.px(q.x, q.y, c32('#b9c2ca')); }
        const w = TP(J, -1, b.torso - 3); R.rect(w.x - 1, w.y - 1, 3, 2, c32(P.glass));
      },
      preArm(R, J, P, c) { this.wing(R, J, P, c, 0, 0); },
      head(H, P, c) {
        const C = HC;
        H.capsule(C + 2, C + 1, C + 13, C + 2, 3.4, 2.6, c32(shade(P.skin, -0.4)));
        H.capsule(C + 2, C + 0.5, C + 13, C + 1.5, 2.7, 1.9, c32(P.skin));
        H.capsule(C + 3, C + 3, C + 12, C + 3.5, 1.2, 1, c32(P.belly));
        for (let x = C + 4; x < C + 14; x += 2) H.px(x, C + 2 + ((x >> 1) & 1), c32('#ffffff'));
        H.px(C + 13, C - 1, c32('#14200f'));
        ball(H, C - 1, C, 5.6, P.skin);
        H.ellipse(C - 1, C - 3, 5.4, 3.4, c32(P.cap)); H.rect(C - 6, C - 1, 4, 3, c32(P.cap));
        H.disk(C + 2, C - 4, 2.4, c32('#3a2a1a')); H.disk(C + 2, C - 4, 1.6, c32(P.glass)); H.px(C + 1, C - 5, c32('#ffffff'));
        H.px(C + 4, C - 1, c32('#ffe14a')); H.px(C + 5, C - 1, c32('#14200f'));
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
      torso(R, J, P, c) {
        const b = this.build, a = TP(J, 0, -2), e = TP(J, 0, b.torso + 11);
        limb(R, a, e, 8.6, 8.2, P.main);
        for (const u of [-5.5, -2.5, 4.5]) { const p1 = TP(J, u, 0), p2 = TP(J, u, b.torso + 8); R.line(p1.x, p1.y, p2.x, p2.y, c32(shade(P.bark, -0.05))); }
        const top = TP(J, 0, b.torso + 12.5);
        R.ellipse(top.x, top.y, 7.5, 2.4, c32(P.ring)); R.ellipse(top.x, top.y, 4.5, 1.3, c32(shade(P.ring, -0.25))); R.px(top.x, top.y, c32(P.bark));
        HEAD_R.clear();
        const C = HC, H = HEAD_R;
        H.disk(C, C, 2.7, c32('#1a1010')); H.disk(C, C, 2.1, c32('#ffffff')); H.disk(C + 6, C, 2.7, c32('#1a1010')); H.disk(C + 6, C, 2.1, c32('#ffffff'));
        H.rect(C + 1, C - 1, 1, 2, c32('#120a0a')); H.rect(C + 7, C - 1, 1, 2, c32('#120a0a'));
        H.line(C - 2, C - 4, C + 2, C - 3, c32('#3a2010')); H.line(C + 4, C - 3, C + 8, C - 4, c32('#3a2010'));
        H.rect(C + 1, C + 5, 5, 2, c32('#3a1010')); H.rect(C + 2, C + 5, 3, 1, c32('#ffffff'));
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
      mid(R, J, P) {
        const t = TP(J, 0, 1);
        R.ellipse(t.x, t.y + 0.5, 12, 3.6, c32(shade(P.tutu, -0.35)));
        R.ellipse(t.x - 0.5, t.y, 11, 2.8, c32(P.tutu));
        R.ellipse(t.x - 2, t.y - 1, 6, 1.2, c32(shade(P.tutu, 0.4)));
        for (let i = -9; i <= 9; i += 3) R.px(t.x + i, t.y + 2, c32(shade(P.tutu, -0.2)));
      },
      head(H, P, c) {
        const C = HC;
        H.disk(C - 7, C, 3, c32(shade(P.cup, -0.3))); H.disk(C - 7, C, 1.6, 0);
        H.poly([[C - 6.5, C - 5], [C + 6.5, C - 5], [C + 5, C + 5], [C - 5, C + 5]], c32(shade(P.cup, -0.25)));
        H.poly([[C - 6, C - 5], [C + 5.5, C - 5], [C + 4, C + 4], [C - 4.5, C + 4]], c32(P.cup));
        H.rect(C - 4, C - 3, 2, 6, c32('#ffffff'));
        H.ellipse(C, C - 5, 6.6, 1.8, c32(P.coffee)); H.ellipse(C, C - 5.2, 5.4, 1.2, c32(P.foam));
        H.px(C - 1, C - 6, c32(P.coffee)); H.px(C + 1, C - 6, c32(P.coffee)); H.px(C, C - 5, c32(P.coffee));
        H.ellipse(C, C + 6, 8, 1.3, c32(shade(P.cup, -0.15)));
        H.rect(C + 2, C - 1, 1, 2, c32('#2a1a1a')); H.px(C + 3, C - 2, c32('#2a1a1a')); H.rect(C + 4, C - 1, 1, 2, c32('#2a1a1a'));
        H.px(C + 1, C + 1, c32('#ff9ab8')); H.px(C + 5, C + 1, c32('#ff9ab8'));
        H.px(C + 3, C + 2, c32('#c0405a'));
        H.disk(C - 1, C - 9, 2, c32('#5a3a24')); H.px(C - 2, C - 10, c32('#7a5a3a'));
      }
    },
    proj: 'coffee', dash: 'pirouette', fatal: { seq: ['B', 'F', 'D'], btn: 'k', type: 'tornado', name: 'Смертельное фуэте' },
    win: 'spin', quote: 'Капучино-пируэт! Аривидерчи!'
  }
];
// чтобы draw-хуки видели build своего персонажа через this
for (const ch of CHARS) if (ch.draw) for (const k in ch.draw) if (typeof ch.draw[k] === 'function') ch.draw[k] = ch.draw[k].bind(Object.assign(ch.draw, { build: ch.build }));
const CHAR_BY_ID = Object.fromEntries(CHARS.map(c => [c.id, c]));
