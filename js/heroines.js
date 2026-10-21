'use strict';
// Три героини: Киоми (веер с шипами), Нефера (царица песков), Нова (неоновая гонщица)

// общая голова: аккуратное лицо в профиль, глаза с ресницами, губы; причёска по стилю
function headHero(H, P, c, o) {
  const C = HC, sk = ramp(P.skin), hr = ramp(P.hair), t = c.t || 0;
  // волосы сзади
  if (o.style === 'bun') {
    sphere(H, C - 2.5, C - 1, 6.4, hr);
    sphere(H, C - 4, C - 7.5, 3.6, hr);                                  // пучок
    H.fline(C - 6.5, C - 8, C - 2, C - 6, hr[4]); H.fline(C - 6, C - 6.5, C - 2.5, C - 5.5, hr[1]);
    // шпильки-кандзаси с бусинами
    tube(H, { x: C - 9, y: C - 11 }, { x: C - 1, y: C - 5 }, 0.45, 0.45, '#e8c24a');
    tube(H, { x: C - 8.5, y: C - 4.5 }, { x: C + 0.5, y: C - 10 }, 0.45, 0.45, '#e8c24a');
    sphere(H, C - 9, C - 11, 1.2, '#e0303a'); sphere(H, C + 0.5, C - 10, 1.1, '#ffffff');
    // цветок и подвески
    for (let i = 0; i < 5; i++) { const a = i * 1.256; H.dot(C - 5 + Math.cos(a) * 1.4, C - 10.5 + Math.sin(a) * 1.4, C32('#ff8ab0')); }
    H.dot(C - 5, C - 10.5, C32('#ffe070'));
    for (let i = 0; i < 3; i++) { const sw = Math.sin(t * 0.1 + i) * 0.6; H.fline(C - 9 + i * 0.6, C - 10.5, C - 9.5 + i * 0.6 + sw, C - 6 + i, C32('#e8c24a')); H.dot(C - 9.5 + i * 0.6 + sw, C - 5.5 + i, C32('#e0303a')); }
  } else if (o.style === 'nemes') {
    // головной убор немес: золото и лазурь в полоску
    const g = ramp('#e3b341'), bl = ramp('#2a4fb0');
    plate(H, [[C - 7, C - 5], [C + 3, C - 7.5], [C + 4, C - 3], [C - 1, C + 1], [C - 3, C + 11], [C - 8, C + 12], [C - 9, C + 2]], g);
    for (let i = 0; i < 6; i++) { const y = C - 4 + i * 2.6; H.fline(C - 8.8, y + 1, C - 1 - i * 0.4, y - 1.2, bl[2]); H.fline(C - 8.8, y + 1.5, C - 1 - i * 0.4, y - 0.7, bl[1]); }
  } else if (o.style === 'short') {
    sphere(H, C - 2, C - 1, 6.6, hr);
    // асимметричная неоновая чёлка и выбритый висок
    plate(H, [[C - 7, C - 4], [C + 1, C - 8.5], [C + 6.5, C - 5], [C + 4, C - 3.5], [C - 1, C - 3]], hr);
    for (let i = 0; i < 4; i++) H.fline(C - 4 + i * 2, C - 7.5 + i * 0.3, C - 1 + i * 2, C - 3.5, hr[i & 1 ? 4 : 1]);
  }
  // лицо
  sphere(H, C + 0.5, C, 5.6, sk);
  ovoid(H, C + 2.6, C + 2.4, 3.6, 3.1, sk);
  H.dot(C + 6.2, C + 0.5, sk[3]); H.dot(C + 6.6, C + 1, sk[2]); H.dot(C + 6.4, C + 1.5, sk[1]);  // нос
  H.dot(C + 5.5, C + 4.5, sk[1]); H.dot(C + 4.5, C + 5.2, sk[1]);                                 // подбородок
  // глаз: белок, радужка, блик, ресницы, бровь
  const ex = C + 3.6, ey = C - 0.5;
  H.frect(ex - 0.5, ey, 4, 2, C32('#ffffff'));
  H.frect(ex + 0.5, ey, 2, 2, C32(P.eye)); H.dot(ex + 1, ey, C32('#ffffff')); H.dot(ex + 0.5, ey + 1, C32('#140c18'));
  H.fline(ex - 1, ey - 0.5, ex + 3.5, ey - 0.8, C32(o.liner || '#140c18'));
  H.dot(ex + 3.5, ey - 1.3, C32('#140c18')); H.dot(ex + 4, ey - 1.8, C32('#140c18'));
  if (o.liner) H.fline(ex + 3.5, ey + 0.8, ex + 5.5, ey - 0.3, C32(o.liner));
  H.fline(ex - 0.5, ey - 2.3, ex + 3.2, ey - 2.6, hr[1] || C32('#2a1a14'));
  H.dot(ex + 1, ey + 2.5, sk[1]);
  // румянец и губы
  H.dot(C + 2.5, C + 2, C32(mix(P.skin, '#ff7a8a', 0.45))); H.dot(C + 3, C + 2.5, C32(mix(P.skin, '#ff7a8a', 0.3)));
  H.frect(C + 4.5, C + 3.5, 2, 1, C32(o.lips || '#c8304a')); H.dot(C + 5, C + 4, C32(shade(o.lips || '#c8304a', -0.3)));
  // ухо и детали
  H.dot(C - 0.5, C + 0.5, sk[1]); H.dot(C - 0.5, C + 1.5, sk[1]);
  if (o.style === 'bun') {
    // пряди у висков
    tube(H, { x: C + 1, y: C - 4 }, { x: C + 0.5, y: C + 5 }, 0.8, 0.5, P.hair);
    plate(H, [[C - 1, C - 6], [C + 6, C - 5.5], [C + 5.5, C - 3.5], [C + 1, C - 3.8]], hr);
  } else if (o.style === 'nemes') {
    // золотой обруч с коброй-уреем
    const g = ramp('#e3b341');
    H.frect(C - 2, C - 5, 14, 2, g[3]); H.frect(C - 2, C - 4, 14, 1, g[1]);
    tube(H, { x: C + 5, y: C - 4.5 }, { x: C + 6, y: C - 8 }, 0.8, 0.6, '#e3b341');
    sphere(H, C + 6.5, C - 8.5, 1.1, '#e3b341'); H.dot(C + 7, C - 8.5, C32('#d02a2a'));
    H.dot(C + 2, C - 4.5, C32('#2a8aff')); H.dot(C + 8, C - 4.5, C32('#2a8aff'));
    // серьги
    sphere(H, C - 0.5, C + 3.5, 0.9, '#e3b341'); H.dot(C - 0.5, C + 5, C32('#2a8aff'));
  } else if (o.style === 'short') {
    // очки-визор подняты на лоб, наушник со светодиодом
    const v = ramp('#3af0ff');
    tube(H, { x: C - 2, y: C - 5.5 }, { x: C + 6, y: C - 5 }, 1.1, 1.3, '#1a1c2a');
    H.frect(C + 1.5, C - 6, 9, 2, v[3]); H.frect(C + 1.5, C - 5, 9, 1, v[1]); H.dot(C + 4, C - 6, C32('#ffffff'));
    sphere(H, C - 1, C + 1, 1, '#9aa0b8'); H.dot(C - 1, C + 1, C32((t >> 4) & 1 ? '#ff3aa0' : '#3af0ff'));
  }
}

// широкий рукав кимоно / накидки
function wideSleeve(R, P, k, sh, el, hd, col, trim) {
  const q = lp(el, hd, 0.55);
  tube(R, lp(sh, el, 0.5), q, 3, 4.1, col, k);
  const d = { x: hd.x - el.x, y: hd.y - el.y }, l = Math.hypot(d.x, d.y) || 1, px = -d.y / l * 3.8, py = d.x / l * 3.8;
  R.line(q.x + px, q.y + py, q.x - px, q.y - py, ramp(trim, k)[2]);
}

const HEROINES = [
  {
    id: 'kiyomi', name: 'Киоми', title: 'Мастер веера', world: 'Земля сакуры', g: 'f',
    desc: 'Придворная танцовщица и тайный клинок императора. Её стальной веер режет, как ветер.',
    pal: { skin: '#f3d2b4', main: '#c0202e', sleeve: '#c0202e', fore: '#f3d2b4', glove: '#f3d2b4', pants: '#221826', boots: '#efe6d6', belt: '#e3b341', obi: '#e3b341', trim: '#ffd86a', inner: '#f4eee6', hair: '#17121c', eye: '#5a2a1a', fx: '#ff6a8a' },
    build: BUILD({ chest: 6.2, waist: 3.9, limb: 0.86, torso: 18.5, leg1: 15.5, leg2: 15.5 }),
    stance: { hF: [11, 5], hB: [7, 9], wa: -35 },
    weapon: 'fan',
    draw: {
      tex: { sleeve: foldTex(5, 3, 10), pants: (s, v, ti) => ti },
      back(R, J, P, c) { // большой бант оби за спиной
        const b = this.build, q = TP(J, -b.waist - 1, 5), sw = Math.sin(c.t * 0.12) * 1.2, o = ramp(P.obi, -0.15);
        plate(R, [[q.x, q.y], [q.x - 7, q.y - 5 + sw], [q.x - 6, q.y + 2 + sw], [q.x - 1, q.y + 2]], o);
        plate(R, [[q.x, q.y + 1], [q.x - 5, q.y + 9 + sw], [q.x - 2, q.y + 10 + sw]], o);
        sphere(R, q.x, q.y + 1, 1.6, P.obi);
      },
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build, w = ramp(P.inner), my = ramp(P.main);
        // запахнутый ворот: белая нижняя кромка и золотой кант
        plate(R, TPoly(J, [[-1.5, b.torso + 0.5], [5.2, b.torso - 0.5], [3.2, b.torso - 8]]), w);
        TL(R, J, -1.5, b.torso, 3.2, b.torso - 8, C32(P.trim)); TL(R, J, 5.2, b.torso - 1, 3.4, b.torso - 7.5, my[0]);
        // узор сакуры на груди
        const f = TP(J, 2, b.torso - 11); for (let i = 0; i < 5; i++) { const a = i * 1.256; R.dot(f.x + Math.cos(a), f.y + Math.sin(a), C32('#ffc0d0')); } R.dot(f.x, f.y, C32('#ffe070'));
        // широкий пояс оби со шнуром
        plate(R, TPoly(J, [[-b.waist - 0.6, 1], [b.waist + 0.8, 1], [b.waist + 1, 6.5], [-b.waist - 0.6, 6.5]]), P.obi);
        TL(R, J, -b.waist - 0.5, 3.8, b.waist + 1, 3.8, C32('#c0202e')); TL(R, J, -b.waist - 0.5, 6.2, b.waist + 1, 6.2, ramp(P.obi)[1]);
      },
      mid(R, J, P) { // короткий подол кимоно с разрезами и золотой каймой
        const b = this.build, a = TP(J, -b.waist - 1.4, 1.5), e = TP(J, b.waist + 1.2, 1.5);
        const kf = lp(J.hipF, J.knF, 0.62), kb = lp(J.hipB, J.knB, 0.62);
        plate(R, [[a.x, a.y], [e.x, e.y], [kf.x + 2.6, kf.y + 0.5], [kb.x - 2.6, kb.y + 0.5]], P.main);
        R.line(kb.x - 2.6, kb.y + 0.5, kf.x + 2.6, kf.y + 0.5, C32(P.trim));
        const m = lp(kb, kf, 0.5); R.fline(m.x, m.y, lp(a, e, 0.5).x, lp(a, e, 0.5).y + 3, ramp(P.main)[0]);
      },
      arm(R, J, side, P, k, sh, el, hd) { wideSleeve(R, P, k, sh, el, hd, P.main, P.trim); },
      head(H, P, c) { headHero(H, P, c, { style: 'bun', lips: '#d0203a' }); }
    },
    proj: 'fan', dash: 'petal', fatal: { seq: ['F', 'B', 'B', 'D'], type: 'slice', name: 'Танец тысячи лезвий' },
    win: 'bow', quote: 'Ветер унёс твою гордость.'
  },
  {
    id: 'nefera', name: 'Нефера', title: 'Царица песков', world: 'Древний Кемет', g: 'f',
    desc: 'Бессмертная царица, пробуждённая из гробницы. Пески и скарабеи служат ей.',
    pal: { skin: '#c98a5c', main: '#f1e8d2', sleeve: '#c98a5c', fore: '#c98a5c', glove: '#c98a5c', pants: '#f1e8d2', boots: '#e3b341', belt: '#e3b341', gold: '#e3b341', lapis: '#2a4fb0', hair: '#140e10', eye: '#3a2410', fx: '#ffd040' },
    build: BUILD({ chest: 6.2, waist: 3.8, limb: 0.86, torso: 18.5, leg1: 15.5, leg2: 15.5 }),
    stance: { hF: [11, 4], hB: [7, 9], wa: -30 },
    weapon: 'khopesh',
    draw: {
      tex: { pants: foldTex(4, 4, 13) },
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build;
        // широкое ожерелье-усех из бусин
        for (let r = 0; r < 3; r++) {
          const col = [P.gold, P.lapis, '#2ab07a'][r];
          for (let i = 0; i <= 6; i++) { const u = -1.5 + i * 1.2, q = TP(J, u, b.torso - 1 - r * 1.3 - Math.abs(u - 2) * 0.25); R.disk(q.x, q.y, 0.65, ramp(col)[i & 1 ? 2 : 3]); }
        }
        // золотые наручи на плечах
        const s = J.shF; sphere(R, s.x, s.y + 1, 2.2, P.gold);
      },
      mid(R, J, P) { // длинная юбка-калазирис с разрезом и передником в полоску
        const b = this.build, a = TP(J, -b.waist - 1.6, 1), e = TP(J, b.waist + 1.6, 1);
        const ff = { x: J.ftF.x + 1, y: J.ftF.y - 3 }, fb = { x: J.ftB.x - 1.5, y: J.ftB.y - 3 }, kf = lp(J.hipF, J.knF, 0.9);
        plate(R, [[a.x, a.y], [e.x, e.y], [kf.x + 2.2, kf.y], [lp(kf, ff, 0.3).x, lp(kf, ff, 0.3).y], [fb.x, fb.y]], P.main);
        R.fline(fb.x, fb.y, lp(kf, ff, 0.3).x, lp(kf, ff, 0.3).y, C32(P.gold));
        // золотой пояс и передник
        tube(R, TP(J, -b.waist, 2), TP(J, b.waist + 0.6, 2), 1.1, 1.1, P.gold);
        const p0 = TP(J, b.waist - 1, 1.5), p1 = TP(J, b.waist + 0.5, 1.5), p2 = lp(J.hipF, J.knF, 0.75);
        plate(R, [[p0.x, p0.y], [p1.x, p1.y], [p2.x + 2, p2.y], [p2.x - 0.5, p2.y]], P.lapis);
        for (let i = 1; i < 4; i++) { const q = lp(lp(p0, p1, 0.5), p2, i / 4); R.fline(q.x - 1, q.y, q.x + 1.5, q.y, C32(P.gold)); }
      },
      arm(R, J, side, P, k, sh, el, hd) { // золотые браслеты на предплечьях
        const q = lp(el, hd, 0.55), w = lp(el, hd, 0.25);
        tube(R, w, q, 1.9, 1.8, P.gold, k); R.line(q.x - 1, q.y, q.x + 1, q.y, ramp(P.lapis, k)[2]);
      },
      head(H, P, c) { headHero(H, P, c, { style: 'nemes', liner: '#140c18', lips: '#a02a3a' }); }
    },
    proj: 'scarab', dash: 'sand', fatal: { seq: ['D', 'B', 'D', 'U'], type: 'tornado', name: 'Песчаная гробница' },
    win: 'levitate', quote: 'Склонись перед царицей песков.'
  },
  {
    id: 'nova', name: 'Нова', title: 'Неоновая гонщица', world: 'Кибер-Сити 2077', g: 'f',
    desc: 'Королева ночных гонок. Неоновая дубинка и реакция быстрее света.',
    pal: { skin: '#f0c8a8', main: '#22243a', sleeve: '#22243a', fore: '#2e3150', glove: '#14141c', pants: '#1c1e30', boots: '#e8ecf4', belt: '#ff3aa0', neon: '#ff3aa0', neon2: '#3af0ff', hair: '#ff4ab0', eye: '#2ad0ff', fx: '#3af0ff' },
    build: BUILD({ chest: 6.1, waist: 3.9, limb: 0.86, torso: 18.5, leg1: 15.5, leg2: 15.5 }),
    stance: { hF: [11, 5], hB: [7, 9], wa: -45 },
    weapon: 'baton',
    draw: {
      tex: { sleeve: foldTex(6, 3, 10), pants: (s, v, ti) => ti, boots: wrapTex(4, 1, 7) },
      torso(R, J, P) {
        drawTorsoDefault(R, this, J, P);
        const b = this.build, n1 = C32(P.neon), n2 = C32(P.neon2);
        // приталенная куртка: неоновые канты, молния, высокий воротник
        TL(R, J, 2.5, b.torso - 1, 2.5, 2, ramp('#9aa0b8')[2]);
        TL(R, J, 4.6, b.torso - 2, 4, 3, n1); TL(R, J, -3.5, b.torso - 1, -3, 4, n2);
        plate(R, TPoly(J, [[-2.5, b.torso + 1.5], [4, b.torso + 0.5], [4.2, b.torso - 2], [-2.5, b.torso - 1.5]]), '#2e3150');
        TL(R, J, -2.5, b.torso + 1.5, 4, b.torso + 0.5, n1);
        const lg = TP(J, -1, b.torso - 6); R.frect(lg.x, lg.y, 3, 3, n2); R.dot(lg.x + 0.5, lg.y + 0.5, C32('#ffffff'));
      },
      mid(R, J, P) { // ремень с неоновой пряжкой и полоса на бедре
        const b = this.build;
        tube(R, TP(J, -b.waist, 1.5), TP(J, b.waist + 0.4, 1.5), 1, 1, '#14141c');
        const q = TP(J, b.waist - 0.5, 1.5); R.frect(q.x - 1, q.y - 1, 4, 3, C32(P.neon)); R.dot(q.x - 0.5, q.y - 0.5, C32('#ffffff'));
        for (const s of ['F', 'B']) { const a = lp(J['hip' + s], J['kn' + s], 0.15), e = lp(J['hip' + s], J['kn' + s], 0.9); R.fline(a.x + 1.6, a.y, e.x + 1.4, e.y, C32(s === 'F' ? P.neon2 : shade(P.neon2, -0.4))); }
      },
      leg(R, J, side, P, k, hp, kn, ft, toe) { // неоновая подошва
        R.fline(ft.x - 1.5, ft.y + 1.2, toe.x + 0.5, toe.y + 1.2, C32(k < -0.2 ? shade(P.neon, -0.4) : P.neon));
      },
      head(H, P, c) { headHero(H, P, c, { style: 'short', lips: '#e0408a' }); }
    },
    proj: 'disc', dash: 'neon', fatal: { seq: ['B', 'D', 'B', 'F'], type: 'laser', name: 'Перегрузка сети' },
    win: 'salute', quote: 'Финиш. Ты даже не стартовал.'
  },
];

// оружие героинь (растр WEP_R, рукоять в точке 16,20)
Object.assign(WEAPONS, {
  fan(Rw, P, f) {
    const open = f && (f.st === 'attack' || f.st === 'special' || f.st === 'unique' || f.st === 'victory' || f.st === 'script');
    const cx = 17, cy = 20, n = open ? 9 : 2, a0 = open ? -0.95 : -0.06, a1 = open ? 0.95 : 0.06, r = 15;
    Rw.capsule(9, 20, 17, 20, 1, 1, c32('#2a2030')); Rw.disk(17, 20, 1.6, c32('#e3b341'));
    if (open) {
      // бумага/шёлк с узором, затем рёбра
      for (let i = 0; i < n * 3; i++) {
        const a = a0 + (a1 - a0) * i / (n * 3 - 1), col = i % 3 === 0 ? '#ff7a8a' : (i & 1 ? '#c0202e' : '#e0303e');
        Rw.capsule(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, cx + Math.cos(a) * (r - 1), cy + Math.sin(a) * (r - 1), 1, 1.4, c32(col));
      }
      for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / (n - 1); Rw.fline(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r, c32('#3a3040')); }
      // золотая кромка и стальные шипы
      for (let i = 0; i < 40; i++) { const a = a0 + (a1 - a0) * i / 39; Rw.dot(cx + Math.cos(a) * r, cy + Math.sin(a) * r, c32('#ffd86a')); }
      for (let i = 0; i < n; i++) {
        const a = a0 + (a1 - a0) * i / (n - 1), b1 = a - 0.08, b2 = a + 0.08;
        Rw.poly([[cx + Math.cos(b1) * r, cy + Math.sin(b1) * r], [cx + Math.cos(a) * (r + 4), cy + Math.sin(a) * (r + 4)], [cx + Math.cos(b2) * r, cy + Math.sin(b2) * r]], c32('#dfe7f1'));
        Rw.dot(cx + Math.cos(a) * (r + 3.5), cy + Math.sin(a) * (r + 3.5), c32('#ffffff'));
      }
      Rw.disk(cx + 7, cy, 1.4, c32('#ffd86a')); Rw.dot(cx + 7, cy, c32('#ffffff'));
    } else {
      // сложенный веер-тэссэн: стальная пластина с шипом
      Rw.capsule(17, 20, 31, 19.5, 1.6, 2.1, c32('#3a3040')); Rw.capsule(17, 19.5, 31, 19, 0.6, 0.9, c32('#8a8aa0'));
      Rw.poly([[31, 18], [35, 19.5], [31, 21.5]], c32('#dfe7f1')); Rw.dot(34, 19.5, c32('#ffffff'));
      Rw.fline(19, 21, 30, 20.5, c32('#c0202e'));
    }
  },
  khopesh(Rw, P) {
    // хопеш: рукоять с лазуритом, прямой отрезок и серповидный клинок
    Rw.rect(6, 19, 11, 3, c32('#2a4fb0')); for (let x = 7; x < 17; x += 2) Rw.px(x, 19, c32('#e3b341'));
    Rw.rect(16, 18, 2, 5, c32('#e3b341')); Rw.px(16, 18, c32('#fff1a8'));
    Rw.rect(18, 19, 12, 2.5, c32('#c98a2a')); Rw.rect(18, 19, 12, 1, c32('#ffd86a'));
    for (let i = 0; i <= 24; i++) {
      const a = -2.2 + i * 0.12, x = 36 + Math.cos(a) * 7.5, y = 25 + Math.sin(a) * 7.5;
      Rw.disk(x, y, 1.6 - i * 0.03, c32(i < 3 ? '#c98a2a' : '#e3b341'));
      Rw.dot(x + Math.cos(a) * 1.3, y + Math.sin(a) * 1.3, c32('#fff1a8'));
    }
    Rw.dot(33, 21, c32('#2a8aff'));
  },
  baton(Rw, P, f) {
    // неоновая дубинка: рукоять, эмиттер и светящийся клинок
    const t = (f && f.anim) || 0, gl = (t >> 2) & 1;
    Rw.rect(8, 19, 10, 3, c32('#14141c')); for (let x = 9; x < 17; x += 2) Rw.px(x, 21, c32('#3a3c50'));
    Rw.rect(17, 18, 3, 5, c32('#9aa0b8')); Rw.px(17, 18, c32('#e8ecf4'));
    Rw.capsule(20, 20.5, 42, 20.5, 1.9, 1.9, c32('#ff3aa0'));
    Rw.capsule(20, 20.5, 42, 20.5, 1.1, 1.1, c32(gl ? '#ffd0ec' : '#ff8ad0'));
    Rw.fline(21, 20, 41, 20, c32('#ffffff'));
    for (let x = 22; x < 42; x += 4) Rw.dot(x + (t & 3), 18.5, c32('#ff3aa0'));
  }
});

// снаряды и рывки героинь
Object.assign(PROJ, {
  fan: { vx: 5, y: -46, dmg: 9, hs: 18, kb: 3, r: 7, snd: 'slash', name: 'Летящий веер',
    draw(ctx, x, y, d, t) {
      const a0 = t * 0.5 * d;
      for (let i = 0; i < 12; i++) { const a = a0 + i * 0.5236, r = 7; ctx.fillStyle = i & 1 ? '#c0202e' : '#ff7a8a'; ctx.fillRect(Math.round(x + Math.cos(a) * r * 0.6), Math.round(y + Math.sin(a) * r * 0.6), 2, 2); ctx.fillStyle = '#dfe7f1'; ctx.fillRect(Math.round(x + Math.cos(a) * (r + 1)), Math.round(y + Math.sin(a) * (r + 1)), 1, 1); }
      pdisk(ctx, x, y, 2, '#ffd86a');
    } },
  scarab: { vx: 3.6, y: -44, dmg: 11, hs: 20, kb: 3, r: 6, snd: 'skull', name: 'Золотой скарабей',
    draw(ctx, x, y, d, t) {
      const fl = (t >> 1) & 1;
      ctx.fillStyle = '#ffe9a0'; ctx.globalAlpha = 0.5; ctx.fillRect(x - 6 - d * 2, y - (fl ? 6 : 4), 5, 2); ctx.fillRect(x - 6 - d * 2, y + (fl ? 3 : 1), 5, 2); ctx.globalAlpha = 1;
      pdisk(ctx, x, y, 4.6, '#7a5010'); pdisk(ctx, x - d * 0.5, y - 0.5, 3.8, '#e3b341'); ctx.fillStyle = '#7a5010'; ctx.fillRect(x - d * 1, y - 4, 1, 8);
      pdisk(ctx, x + d * 4, y, 2, '#3a2a10'); ctx.fillStyle = '#fff1a8'; ctx.fillRect(x - 2, y - 3, 2, 1); ctx.fillStyle = '#2a8aff'; ctx.fillRect(x + d * 4, y - 1, 1, 1);
    },
    trail(x, y, d, t) { if (t % 2 === 0) FX.p('px', x - d * 5, y + rand(-3, 3), -d * 0.3, rand(-0.2, 0.4), 22, choice(['#e3b341', '#c98a2a', '#fff1a8']), 1, 0.05); } },
  disc: { vx: 6.4, y: -42, dmg: 8, hs: 16, kb: 2.5, r: 6, snd: 'plasma', name: 'Неоновый диск',
    draw(ctx, x, y, d, t) {
      ctx.fillStyle = '#3af0ff'; for (let i = 0; i < 16; i++) { const a = i * 0.3927 + t * 0.4; ctx.fillRect(Math.round(x + Math.cos(a) * 6), Math.round(y + Math.sin(a) * 2.6), 1, 1); }
      ctx.fillStyle = '#ff3aa0'; for (let i = 0; i < 12; i++) { const a = i * 0.5236 - t * 0.4; ctx.fillRect(Math.round(x + Math.cos(a) * 4), Math.round(y + Math.sin(a) * 1.8), 1, 1); }
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y, 3, 1);
    },
    trail(x, y, d, t) { FX.p('px', x - d * 6, y + rand(-1, 1), -d * 0.5, 0, 12, choice(['#3af0ff', '#ff3aa0', '#ffffff']), 1, 0); } },
});
Object.assign(DASH, {
  petal: Object.assign({}, DASH.dashcut, { name: 'Танец лепестков' }),
  sand: Object.assign({}, DASH.charge, { name: 'Натиск сфинкса' }),
  neon: Object.assign({}, DASH.jet, { jet: false, ghost: true, name: 'Неоновый рывок' }),
});
Object.assign(UNIQUE, {
  kiyomi: { name: 'Вихрь сакуры', kind: 'flurry' },
  nefera: { name: 'Песчаный гейзер', kind: 'erupt', style: 'coffee' },
  nova: { name: 'Удар со спутника', kind: 'strike', style: 'laser' },
});

// вставляем после Морены, до брейнрот-мемов
(function () {
  const at = CHARS.findIndex(c => c.meme);
  CHARS.splice(at < 0 ? CHARS.length : at, 0, ...HEROINES);
  for (const c of HEROINES) { CHAR_BY_ID[c.id] = c; for (const k in c.draw) if (typeof c.draw[k] === 'function') c.draw[k] = c.draw[k].bind(Object.assign(c.draw, { build: c.build })); }
})();
