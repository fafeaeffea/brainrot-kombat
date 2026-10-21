'use strict';
// Пятеро новичков: шаман Тайга, лучадор Лобо, хранительница леса Лира
// и два героя брейнрота: Шимпанзини Бананини и Брр Брр Патапим

// простое лицо в профиль для мужских героев (глаз, бровь, нос, рот)
function faceMan(H, P, o) {
  const C = HC, sk = ramp(P.skin);
  sphere(H, C + 0.5, C, 5.8, sk);
  ovoid(H, C + 2.8, C + 2.6, 3.8, 3.2, sk);
  H.dot(C + 6.4, C + 0.5, sk[3]); H.dot(C + 6.8, C + 1, sk[2]); H.dot(C + 6.6, C + 1.6, sk[1]);
  const ex = C + 3.6, ey = C - 0.5;
  H.frect(ex - 0.5, ey, 4, 2, C32('#f4f0e8')); H.frect(ex + 0.5, ey, 2, 2, C32(P.eye)); H.dot(ex + 1, ey, C32('#ffffff'));
  H.fline(ex - 1, ey - 1.6, ex + 3.6, ey - 1.2, C32(o.brow || '#2a1a14')); H.fline(ex - 1, ey - 1.1, ex + 3.2, ey - 0.8, C32(o.brow || '#2a1a14'));
  H.fline(C + 4.2, C + 4.2, C + 6.4, C + 4, sk[0]);
  H.dot(C + 5.4, C + 5.6, sk[1]); H.dot(C - 0.5, C + 1, sk[1]);
}

const NEWBIES = [
  {
    id: 'taiga', name: 'Тайга', title: 'Шаман севера', world: 'Сибирская тайга', g: 'm',
    desc: 'Последний шаман древнего рода. Духи волков и медведей идут за ним в бой.',
    pal: { skin: '#c99a72', main: '#6a4a32', sleeve: '#6a4a32', fore: '#c99a72', glove: '#4a3424', pants: '#4a3a2e', boots: '#8a6a4a', belt: '#b03a2a', fur: '#d8cbb0', bone: '#ece2c8', hair: '#2a1e18', eye: '#7affd0', fx: '#7affd0' },
    build: BUILD({ chest: 6.8, waist: 5.4 }),
    stance: { hF: [11, 3], hB: [8, 7], wa: -25 },
    weapon: 'staff',
    draw: {
      tex: { sleeve: foldTex(5, 3, 10), pants: foldTex(4, 3, 13), boots: wrapTex(3, 0, 8) },
      back(R, J, P, c) { // меховой плащ до колен
        const b = this.build, s = TP(J, -b.chest * 0.7, b.torso - 1), w = Math.sin(c.t * 0.08) * 1.2;
        const k = lp(J.hipB, J.knB, 0.8);
        plate(R, [[s.x + 3, s.y - 1], [s.x - 2, s.y], [k.x - 6 + w, k.y + 2], [k.x + 2 + w, k.y + 4], [J.hip.x, J.hip.y]], P.fur, -0.18);
        const fr = ramp(P.fur, -0.18); for (let i = 0; i < 5; i++) R.fline(k.x - 5 + i * 1.7 + w, k.y + 2.4 + i * 0.3, k.x - 4.5 + i * 1.7 + w, k.y + 0.5, fr[1]);
      },
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build, bn = C32(P.bone);
        // меховой воротник
        const n = TP(J, 1, b.torso - 0.5); ovoid(R, n.x, n.y, 6.5, 3, P.fur);
        // бусы с клыками и амулет-бубен
        for (let i = 0; i < 6; i++) { const q = TP(J, -1.5 + i * 1.3, b.torso - 3.5 - Math.sin(i * 0.6) * 2.2); R.dot(q.x, q.y, i & 1 ? C32('#c0282a') : bn); if (i & 1) R.dot(q.x, q.y + 1, bn); }
        const a = TP(J, 3.2, b.torso - 8); sphere(R, a.x, a.y, 2, '#c8a46a'); R.dot(a.x, a.y, C32('#b03a2a')); R.fline(a.x - 1.2, a.y, a.x + 1.2, a.y, C32('#5a3a1a'));
        // вышитые полосы
        TL(R, J, -b.waist, 9, b.waist, 9, C32('#b03a2a')); TL(R, J, -b.waist, 9.6, b.waist, 9.6, C32('#e3c25a'));
      },
      head(H, P, c) {
        const C = HC, hr = ramp(P.hair), bn = ramp(P.bone), t = c.t || 0;
        // косы за спиной
        tube(H, { x: C - 4, y: C }, { x: C - 7, y: C + 12 + Math.sin(t * 0.1) }, 1.6, 1.1, P.hair);
        H.dot(C - 7, C + 12, C32('#b03a2a'));
        sphere(H, C - 1.5, C - 1, 6.2, hr);
        faceMan(H, P, { brow: '#1a1210' });
        // боевая раскраска
        H.fline(C + 2, C + 1.6, C + 5.5, C + 1.6, C32('#e8e8f0')); H.fline(C + 2, C + 2.4, C + 5, C + 2.4, C32('#7affd0'));
        // убор: олений череп с рогами
        ovoid(H, C + 1, C - 6, 5.5, 2.6, bn);
        H.dot(C + 4, C - 6, C32('#1a1210')); H.dot(C + 1.5, C - 6, C32('#1a1210'));
        for (const s of [-1, 1]) {
          const bx = C + (s < 0 ? -2.5 : 2);
          tube(H, { x: bx, y: C - 7.5 }, { x: bx - 3 + s, y: C - 14 }, 0.9, 0.6, P.bone);
          tube(H, { x: bx - 3 + s, y: C - 14 }, { x: bx - 1 + s * 2, y: C - 19 }, 0.6, 0.4, P.bone);
          tube(H, { x: bx - 1.5 + s, y: C - 11 }, { x: bx + 2 + s, y: C - 14 }, 0.5, 0.4, P.bone);
          tube(H, { x: bx - 3 + s, y: C - 14 }, { x: bx - 7 + s, y: C - 16 }, 0.5, 0.35, P.bone);
        }
        // пёрышки
        tube(H, { x: C - 5, y: C - 4 }, { x: C - 10, y: C + 2 }, 0.9, 0.4, '#b03a2a'); tube(H, { x: C - 5, y: C - 3 }, { x: C - 9, y: C + 4 }, 0.8, 0.3, '#2a2a3a');
      }
    },
    proj: 'spirit', dash: 'spiritstep', fatal: { seq: ['D', 'F', 'B', 'D'], type: 'souls', name: 'Духи тайги' },
    win: 'fist', quote: 'Духи тайги забрали твою силу.'
  },
  {
    id: 'lobo', name: 'Мачо Лобо', title: 'Лучадор-чемпион', world: 'Арена Мехико', g: 'm',
    desc: 'Непобеждённый чемпион ринга в маске волка. Ни разу не снимал маску и не проигрывал.',
    pal: { skin: '#c88a5a', main: '#c88a5a', sleeve: '#c88a5a', fore: '#c88a5a', glove: '#e8e8f0', pants: '#1a3aa0', boots: '#e8e8f0', belt: '#e3b341', mask: '#d02a3a', mask2: '#ffd84a', cape: '#d02a3a', eye: '#ffffff', fx: '#ff5a2a' },
    build: BUILD({ chest: 7.8, waist: 5.8, limb: 1.12, arm1: 11.5 }),
    stance: { hF: [12, 2], hB: [9, 5], torso: 4 },
    draw: {
      tex: { pants: (s, v, ti) => (Math.abs(v - 0.55) < 0.12 && s > 1) ? 4 : ti, boots: (s, v, ti) => ((s | 0) % 3 === 0 && s < 7) ? 1 : ti },
      back(R, J, P, c) { // короткий плащ
        const b = this.build, s = TP(J, -b.chest * 0.6, b.torso - 1), w = Math.sin(c.t * 0.1) * 1.5;
        plate(R, [[s.x + 2, s.y - 1], [s.x - 1, s.y], [s.x - 8 + w, s.y + 16], [s.x - 1 + w, s.y + 18]], P.cape, -0.15);
        R.fline(s.x - 8 + w, s.y + 16, s.x - 1 + w, s.y + 18, C32('#ffd84a'));
      },
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build, sk = ramp(P.skin);
        // грудные мышцы и пресс
        TL(R, J, -1, b.torso - 7.5, b.chest - 1, b.torso - 8.5, sk[1]); TL(R, J, 1.5, b.torso - 4, 2.2, b.torso - 7.5, sk[1]);
        for (let i = 0; i < 3; i++) { TL(R, J, 0.5, 9 + i * 2.2, 3.5, 9 + i * 2.2, sk[1]); TPx(R, J, 2, 10 + i * 2.2, sk[3]); }
        TL(R, J, -0.5, b.torso - 3, b.chest - 2, b.torso - 2.5, sk[4]);
        // чемпионский пояс
        plate(R, TPoly(J, [[-b.waist - 0.5, 0], [b.waist + 0.8, 0], [b.waist + 0.8, 4], [-b.waist - 0.5, 4]]), P.belt);
        const g = TP(J, 2, 2); ovoid(R, g.x, g.y, 3, 2.6, '#f4e08a'); R.dot(g.x, g.y, C32('#d02a3a')); R.dot(g.x - 1, g.y - 1, C32('#ffffff'));
      },
      head(H, P) {
        const C = HC, m = ramp(P.mask), y = ramp(P.mask2);
        sphere(H, C + 0.5, C - 0.5, 6.4, m);
        ovoid(H, C + 3, C + 2.4, 3.9, 3.2, m);
        // жёлтые языки пламени вокруг глаз
        plate(H, [[C + 1, C - 3], [C + 7.5, C - 2.5], [C + 6.5, C + 1], [C + 2, C + 1.5]], y);
        plate(H, [[C - 2, C - 6], [C + 2, C - 4], [C - 1, C - 2]], y); plate(H, [[C - 4, C - 3], [C, C - 2], [C - 3, C + 1]], y);
        H.frect(C + 3.2, C - 1.5, 5, 3, C32('#ffffff')); H.frect(C + 4.6, C - 1.5, 2, 2, C32('#3a2414')); H.dot(C + 5, C - 1.5, C32('#ffffff'));
        H.fline(C + 2.8, C - 2.2, C + 7, C - 2.6, C32('#1a1010'));
        // открытый рот и подбородок
        H.frect(C + 3.5, C + 3, 6, 4, C32(P.skin)); H.fline(C + 4, C + 4.6, C + 6.2, C + 4.4, C32('#6a2a1a'));
        // шнуровка на затылке
        for (let i = 0; i < 3; i++) H.fline(C - 5.5, C - 2 + i * 2, C - 4, C - 1 + i * 2, C32('#ffffff'));
        H.dot(C + 6.6, C + 0.8, m[3]);
      }
    },
    proj: 'chili', dash: 'ram', fatal: { seq: ['B', 'D', 'F', 'U'], type: 'hammer', name: 'Коронный суплекс' },
    win: 'fist', quote: '¡Viva Лобо! Чемпион остаётся чемпионом!'
  },
  {
    id: 'lira', name: 'Лира', title: 'Хранительница леса', world: 'Изумрудная чаща', g: 'f',
    desc: 'Эльфийка-страж древнего леса. Её глефа-лист поёт, рассекая воздух.',
    pal: { skin: '#f0d0b0', main: '#3f8a4a', top: '#3f8a4a', sleeve: '#f0d0b0', fore: '#f0d0b0', glove: '#7a5a3a', pants: '#2c4a30', hipCol: '#3f8a4a', boots: '#7a5a3a', belt: '#7a5a3a', hair: '#f2dc8a', eye: '#2a9a50', trim: '#e3c25a', fx: '#9aff7a' },
    build: BUILD({ chest: 6.2, waist: 3.5, hips: 5.5, limb: 0.84, torso: 18.5, leg1: 16, leg2: 16 }),
    stance: { hF: [11, 4], hB: [7, 9], wa: -25 },
    weapon: 'glaive',
    draw: {
      tex: { pants: (s, v, ti) => ti, boots: wrapTex(3, 0, 9) },
      back(R, J, P, c) { // длинные волосы за спиной
        const h = J.head, w = Math.sin(c.t * 0.09) * 1.5;
        tube(R, { x: h.x - 3, y: h.y }, { x: h.x - 7 + w, y: h.y + 18 }, 3.4, 1.8, P.hair, -0.1);
        tube(R, { x: h.x - 5, y: h.y + 2 }, { x: h.x - 10 + w, y: h.y + 14 }, 2.2, 1, P.hair, -0.2);
      },
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build, gd = C32(P.trim), lf = ramp('#5ab05a');
        // лиф из листьев с золотой веткой
        for (let i = 0; i < 4; i++) { const q = TP(J, -1 + i * 1.6, b.torso - 2 - i * 0.6); plate(R, [[q.x, q.y], [q.x + 1.8, q.y + 1], [q.x + 0.4, q.y + 2.4]], lf); }
        TL(R, J, -b.waist, b.torso - 9.5, b.chest, b.torso - 9.5, gd);
        TL(R, J, -b.waist - 0.5, 1, b.waist + 0.6, 1, C32(P.belt)); TPx(R, J, 2, 1, gd);
      },
      mid(R, J, P, c) { // юбка из листьев
        const b = this.build, a = TP(J, -b.waist - 1.5, 1.5), e = TP(J, b.waist + 1.5, 1.5);
        for (let i = 0; i < 6; i++) {
          const q = lp(a, e, i / 5), l = 7 + (i & 1) * 2, sw = Math.sin(c.t * 0.1 + i) * 0.6;
          plate(R, [[q.x - 1.5, q.y], [q.x + 1.5, q.y], [q.x + 0.3 + sw, q.y + l]], i & 1 ? '#3f8a4a' : '#5ab05a');
        }
      },
      head(H, P, c) {
        const C = HC, hr = ramp(P.hair);
        sphere(H, C - 2, C - 1, 6.6, hr);
        headHero(H, P, c, { style: 'elf', lips: '#c8506a', liner: '#2a5a30' });
        // заострённое ухо и чёлка
        plate(H, [[C - 1, C], [C - 5, C - 4.5], [C, C + 2]], ramp(P.skin)); H.dot(C - 2, C - 1, ramp(P.skin)[1]);
        plate(H, [[C - 6, C - 4], [C + 1, C - 8.5], [C + 6.5, C - 5.5], [C + 2, C - 4], [C - 1, C - 1]], hr);
        for (let i = 0; i < 4; i++) H.fline(C - 3 + i * 2, C - 7.5, C - 1 + i * 2, C - 4, hr[i & 1 ? 4 : 1]);
        // золотой обруч с изумрудом
        H.frect(C - 3, C - 5.5, 12, 1, C32(P.trim)); H.dot(C + 4, C - 6, C32('#3aff8a'));
      }
    },
    proj: 'leaf', dash: 'vine', fatal: { seq: ['B', 'F', 'B', 'D'], type: 'slice', name: 'Буря листвы' },
    win: 'bow', quote: 'Лес помнит каждого, кто ему вредил.'
  },
  {
    id: 'chimp', name: 'Шимпанзини Бананини', title: 'Обезьяна в банане', world: 'Итальянский брейнрот', g: 'm', meme: true,
    desc: 'Шимпанзини Бананини, ва-ва-ва! Выпрыгивает из банана и бьёт без предупреждения.',
    pal: { skin: '#e0b48a', main: '#6a4630', sleeve: '#6a4630', fore: '#6a4630', glove: '#e0b48a', pants: '#6a4630', boots: '#e0b48a', shoes: '#e0b48a', banana: '#ffd84a', fur: '#6a4630', eye: '#3a2010', fx: '#ffd84a' },
    build: BUILD({ leg1: 12, leg2: 12, torso: 17, chest: 7, waist: 6.2, arm1: 12.5, arm2: 12.5, limb: 1.05 }),
    stance: { hF: [12, 8], hB: [9, 10], torso: 10, head: -6 },
    draw: {
      tex: { sleeve: (s, v, ti) => (ti >= 2 && ((s * 2 + v * 3) | 0) % 4 === 0) ? ti - 1 : ti, pants: (s, v, ti) => (ti >= 2 && ((s * 2 + v * 3) | 0) % 4 === 0) ? ti - 1 : ti },
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build, bn = ramp(P.banana);
        // банановая кожура вокруг тела и отогнутые лепестки
        plate(R, TPoly(J, [[-b.waist - 1.5, -2], [b.waist + 1.5, -2], [b.chest + 1, 10], [b.chest - 1, 12.5], [-b.chest + 0.5, 12.5], [-b.chest - 1, 10]]), bn);
        for (const [u, d] of [[-b.chest, -1], [b.chest - 1, 1], [1, 0.3]]) {
          const a = TP(J, u, 12), e = TP(J, u + d * 4, 17);
          plate(R, [[a.x - 1.8, a.y], [a.x + 1.8, a.y], [e.x, e.y]], bn);
        }
        TL(R, J, -1, -1.5, -1.5, 11.5, bn[1]); TL(R, J, 3, -1.5, 3.5, 11.5, bn[1]);
        const st = TP(J, 0, -2.5); sphere(R, st.x, st.y, 1.4, '#5a4020');
      },
      head(H, P) {
        const C = HC, f = ramp(P.fur), s = ramp(P.skin);
        sphere(H, C - 0.5, C - 0.5, 6.4, f);
        sphere(H, C - 2.5, C + 0.5, 2.4, f); H.disk(C - 2.5, C + 0.5, 1.2, s[1]);              // ухо
        ovoid(H, C + 2.5, C - 1.2, 4, 2.6, s);                                                  // лицевая маска
        ovoid(H, C + 4, C + 3, 4, 3, s);                                                        // морда
        H.frect(C + 2, C - 2, 3, 3, C32('#ffffff')); H.frect(C + 3, C - 1.5, 2, 2, C32(P.eye)); H.dot(C + 3.5, C - 1.5, C32('#ffffff'));
        H.fline(C + 1, C - 3.5, C + 6, C - 3, f[0]);
        H.dot(C + 6.5, C + 1.5, s[0]); H.dot(C + 7, C + 1.5, s[0]);                             // ноздри
        H.fline(C + 3, C + 4.5, C + 7.5, C + 4.2, C32('#3a1a10')); H.frect(C + 5, C + 4.5, 4, 1, C32('#ffffff'));
        H.fline(C - 3, C - 6, C + 1, C - 7.5, f[4]);
      }
    },
    proj: 'banana', dash: 'bananajump', fatal: { seq: ['D', 'D', 'B', 'F'], type: 'bite', name: 'Ва-ва-ва укус' },
    win: 'fist', quote: 'Шимпанзини Бананини! Ва-ва-ва!'
  },
  {
    id: 'patapim', name: 'Брр Брр Патапим', title: 'Лесной носач', world: 'Итальянский брейнрот', g: 'm', meme: true,
    desc: 'Брр брр патапим, мой шляпа полна сыра! Обезьяна-дерево с огромным носом и ногами.',
    pal: { skin: '#a4784a', main: '#5a8a3a', sleeve: '#a4784a', fore: '#a4784a', glove: '#a4784a', pants: '#8a6438', boots: '#e0b88a', shoes: '#e0b88a', moss: '#5a8a3a', hat: '#3a5a8a', eye: '#1a1010', fx: '#9aff7a' },
    build: BUILD({ leg1: 14, leg2: 14, torso: 17, chest: 6.6, waist: 6, limb: 0.92, arm1: 12, arm2: 12 }),
    stance: { hF: [11, 5], hB: [8, 8], torso: 6 },
    draw: {
      tex: { sleeve: grainTex(0.9, 0.3), fore: grainTex(0.9, 0.3), pants: grainTex(0.9, 0.3) },
      leg(R, J, side, P, k, hp, kn, ft) { // огромные ступни
        ovoid(R, ft.x + 3, ft.y - 1, 5.6, 2.4, P.boots, k);
        for (let i = 0; i < 3; i++) R.dot(ft.x + 6 + i * 0.4, ft.y - 2.5 + i * 1.2, ramp(P.boots, k)[1]);
      },
      torso(R, J, P) {
        const b = this.build;
        tube(R, J.hip, J.neck, b.waist + 0.6, b.chest, P.skin, 0, grainTex(2, 0.3));
        // мох и листья на груди и плечах
        for (let i = 0; i < 7; i++) { const q = TP(J, -3 + (i % 4) * 2.4, b.torso - 2 - (i >> 2) * 3); sphere(R, q.x, q.y, 1.8, i & 1 ? '#5a8a3a' : '#7ab04a'); }
        const kn = TP(J, -3, 7); ovoid(R, kn.x, kn.y, 1.5, 1.1, '#6a4a28'); R.dot(kn.x, kn.y, C32('#3a2412'));
      },
      head(H, P) {
        const C = HC, s = ramp(P.skin), h = ramp(P.hat);
        sphere(H, C, C, 5.8, s);
        // огромный нос-сучок
        tube(H, { x: C + 4, y: C }, { x: C + 15, y: C + 3 }, 2.4, 1.6, P.skin);
        sphere(H, C + 15, C + 3, 1.9, s);
        H.frect(C + 2, C - 3, 3, 3, C32('#ffffff')); H.frect(C + 3, C - 2.5, 2, 2, C32(P.eye)); H.dot(C + 3, C - 2.5, C32('#ffffff'));
        H.fline(C + 2, C + 4, C + 6, C + 5, C32('#3a1a10'));
        // шляпа-котелок с листиком
        ovoid(H, C, C - 5, 8, 1.6, h); sphere(H, C - 0.5, C - 7.5, 4.6, h, 0); H.frect(C - 5, C - 6.5, 18, 1, C32('#e3c25a'));
        plate(H, [[C + 2, C - 11], [C + 6, C - 13], [C + 4, C - 10]], '#7ab04a');
      }
    },
    proj: 'moss', dash: 'roots', fatal: { seq: ['F', 'D', 'B', 'F'], type: 'tornado', name: 'Лесной вихрь' },
    win: 'drum', quote: 'Брр брр патапим! Патапим победил!'
  },
];

Object.assign(WEAPONS, {
  staff(Rw) {
    // посох из коряги с черепом и перьями
    Rw.capsule(-14, 21, 40, 19, 1.2, 1.4, c32('#6a4a2a')); Rw.fline(-12, 20.5, 38, 18.5, c32('#9a7a4a'));
    for (let x = -8; x < 38; x += 9) Rw.dot(x, 20.6 - x * 0.03, c32('#3a2412'));
    Rw.disk(42, 18.5, 4, c32('#ece2c8')); Rw.disk(43, 17.5, 3, c32('#fff8e8'));
    Rw.rect(43, 17, 1.5, 1.5, c32('#1a1210')); Rw.rect(40.5, 17, 1.5, 1.5, c32('#1a1210')); Rw.rect(41, 21, 4, 1.5, c32('#d8ccb0'));
    Rw.capsule(37, 22, 33, 30, 0.8, 0.3, c32('#b03a2a')); Rw.capsule(38, 22, 36, 31, 0.7, 0.3, c32('#2a2a3a'));
    Rw.dot(39, 23, c32('#7affd0'));
  },
  glaive(Rw) {
    // глефа: древко из светлого дерева и клинок-лист
    Rw.capsule(-12, 20.5, 30, 20, 0.9, 0.9, c32('#c8a46a')); Rw.fline(-11, 20, 29, 19.5, c32('#efd8a0'));
    Rw.rect(29, 18.5, 3, 3, c32('#e3c25a'));
    Rw.poly([[32, 20], [37, 16.5], [46, 18.5], [52, 20], [46, 21.5], [37, 23.5]], c32('#4aa04a'));
    Rw.poly([[32, 20], [37, 17.2], [46, 18.8], [52, 20]], c32('#8ad86a'));
    Rw.fline(33, 20, 51, 20, c32('#2a6a30'));
    for (let i = 0; i < 3; i++) { Rw.fline(36 + i * 4, 20, 39 + i * 4, 17.8, c32('#2a6a30')); Rw.fline(36 + i * 4, 20, 39 + i * 4, 22.2, c32('#2a6a30')); }
    Rw.dot(50, 19.5, c32('#ffffff'));
  }
});

Object.assign(PROJ, {
  spirit: { vx: 4, y: -44, dmg: 11, hs: 20, kb: 3, r: 7, snd: 'skull', name: 'Дух волка',
    draw(ctx, x, y, d, t) {
      const fl = (t >> 2) & 1;
      ctx.globalAlpha = 0.45; pdisk(ctx, x - d * 3, y, 6.5, '#2ae8b0'); ctx.globalAlpha = 1;
      pdisk(ctx, x, y, 4.6, '#7affd0'); pdisk(ctx, x + d * 4, y + 1, 2.6, '#7affd0');
      ctx.fillStyle = '#7affd0'; ctx.fillRect(x - d * 2 - 1, y - 7, 2, 3); ctx.fillRect(x + d * 1 - 1, y - 7 - fl, 2, 3);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x + d * 2, y - 2, 2, 1); ctx.fillStyle = '#0a4a3a'; ctx.fillRect(x + d * 5, y + 2, 2, 1);
    },
    trail(x, y, d, t) { FX.p('px', x - d * 7, y + rand(-4, 4), -d * 0.4, rand(-0.3, 0.1), 18, choice(['#7affd0', '#2ae8b0', '#ffffff']), 1, 0); } },
  chili: { vx: 5, y: -46, dmg: 10, hs: 20, kb: 3, r: 6, snd: 'fire', name: 'Огненный перец',
    draw(ctx, x, y, d, t) {
      for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#ffd84a', '#ff8a1a', '#ff3a1a', '#ffd84a'][(i + t) & 3]; ctx.fillRect(x - d * (6 + i * 2), y - 2 + ((t + i) & 1), 2, 3); }
      pdisk(ctx, x, y, 3.2, '#d0201a'); pdisk(ctx, x + d * 3, y + 1, 2, '#d0201a'); ctx.fillStyle = '#ff7a6a'; ctx.fillRect(x - 1, y - 2, 2, 1);
      ctx.fillStyle = '#3a8a2a'; ctx.fillRect(x - d * 4, y - 2, 2, 3);
    },
    trail(x, y, d, t) { if (t & 1) FX.p('px', x - d * 6, y + rand(-2, 2), -d * 0.3, -rand(0.2, 0.8), 14, choice(['#ffd84a', '#ff8a1a', '#ff3a1a']), 1, -0.02); } },
  leaf: { vx: 5.8, y: -44, dmg: 8, hs: 16, kb: 2.5, r: 6, snd: 'slash', name: 'Лист-клинок',
    draw(ctx, x, y, d, t) {
      const a = t * 0.45 * d, c = Math.cos(a), s = Math.sin(a);
      for (let i = -6; i <= 6; i++) { const w = Math.round((1 - Math.abs(i) / 6.5) * 2.4); ctx.fillStyle = i < 0 ? '#5ab05a' : '#8ad86a'; ctx.fillRect(Math.round(x + c * i - s * w), Math.round(y + s * i + c * w), 1, 1); ctx.fillRect(Math.round(x + c * i + s * w), Math.round(y + s * i - c * w), 1, 1); ctx.fillStyle = '#2a6a30'; ctx.fillRect(Math.round(x + c * i), Math.round(y + s * i), 1, 1); }
    },
    trail(x, y, d, t) { if (t % 3 === 0) FX.p('px', x - d * 4, y + rand(-2, 2), -d * 0.2, rand(0, 0.4), 20, choice(['#5ab05a', '#8ad86a', '#e3c25a']), 1, 0.02); } },
  banana: { vx: 4.4, vy: -2.4, g: 0.1, y: -48, dmg: 10, hs: 20, kb: 3, r: 6, snd: 'throw', name: 'Банан-бумеранг',
    draw(ctx, x, y, d, t) {
      const a0 = t * 0.4 * d;
      for (let i = 0; i < 9; i++) { const a = a0 + i * 0.32, r = 5; ctx.fillStyle = i === 0 || i === 8 ? '#5a4020' : i & 1 ? '#ffd84a' : '#f0c030'; ctx.fillRect(Math.round(x + Math.cos(a) * r) - 1, Math.round(y + Math.sin(a) * r) - 1, 2, 2); }
    } },
  moss: { vx: 3.8, y: -40, dmg: 10, hs: 20, kb: 3, r: 7, snd: 'wave', name: 'Моховой ком',
    draw(ctx, x, y, d, t) {
      pdisk(ctx, x, y, 5, '#3a6a2a'); pdisk(ctx, x - 1, y - 1, 4, '#5a8a3a'); pdisk(ctx, x - 2, y - 2, 1.6, '#9ad86a');
      ctx.fillStyle = '#7ab04a'; for (let i = 0; i < 6; i++) { const a = i * 1.047 + t * 0.2 * d; ctx.fillRect(Math.round(x + Math.cos(a) * 5.5), Math.round(y + Math.sin(a) * 5.5), 1, 1); }
    },
    trail(x, y, d, t) { if (t % 3 === 0) FX.p('px', x - d * 5, y + rand(-3, 3), 0, 0.4, 16, choice(['#5a8a3a', '#7ab04a', '#a4784a']), 1, 0.08); } },
});
Object.assign(DASH, {
  spiritstep: Object.assign({}, DASH.warp, { name: 'Шаг духов' }),
  ram: Object.assign({}, DASH.charge, { name: 'Таран Лобо' }),
  vine: Object.assign({}, DASH.slide, { name: 'Скольжение лозы' }),
  bananajump: Object.assign({}, DASH.leap, { name: 'Прыжок из банана' }),
  roots: Object.assign({}, DASH.slide, { name: 'Подсечка корнем' }),
});
Object.assign(UNIQUE, {
  taiga: { name: 'Зов медведя', kind: 'quake' },
  lobo: { name: 'Прыжок с канатов', kind: 'rise' },
  lira: { name: 'Шквал листьев', kind: 'flurry' },
  chimp: { name: 'Бананотряс', kind: 'stomp' },
  patapim: { name: 'Корни-хваталки', kind: 'erupt', style: 'hands' },
});

// герои — перед мемами, мемы — в конец
(function () {
  const heroes = NEWBIES.filter(c => !c.meme), memes = NEWBIES.filter(c => c.meme);
  const at = CHARS.findIndex(c => c.meme);
  CHARS.splice(at < 0 ? CHARS.length : at, 0, ...heroes);
  CHARS.push(...memes);
  for (const c of NEWBIES) { CHAR_BY_ID[c.id] = c; for (const k in c.draw) if (typeof c.draw[k] === 'function') c.draw[k] = c.draw[k].bind(Object.assign(c.draw, { build: c.build })); }
})();
