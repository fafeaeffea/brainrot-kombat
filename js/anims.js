'use strict';
// Позы и анимации (боец смотрит вправо; координаты относительно ступней)
const BASE_POSE = { hx: 0, hy: 3, torso: 10, head: -4, hF: [10, -3], hB: [8, 1], fF: [8, 0], fB: [-9, 0], rot: 0, wa: 0 };
const mkPose = (...o) => Object.assign({}, BASE_POSE, ...o);
function blendPose(a, b, t) {
  const o = {};
  for (const k in BASE_POSE) {
    const va = a[k] !== undefined ? a[k] : BASE_POSE[k], vb = b[k] !== undefined ? b[k] : BASE_POSE[k];
    o[k] = Array.isArray(va) ? [lerp(va[0], vb[0], t), lerp(va[1], vb[1], t)] : lerp(va, vb, t);
  }
  for (const k of ['eF', 'eB', 'kF', 'kB']) { const v = t < 0.5 ? (a[k] || b[k]) : (b[k] || a[k]); if (v) o[k] = v; }
  return o;
}
const stanceOf = ch => mkPose(ch.stance || {});

const POSES = {
  crouch: { hx: 2, hy: 15, torso: 24, head: -18, hF: [9, -5], hB: [7, -2], fF: [9, 0], fB: [-9, 0] },
  block: { hy: 4, torso: -4, head: 8, hF: [6, -12], hB: [9, -9], fF: [7, 0], fB: [-10, 0], eF: { x: 0.4, y: 1 }, eB: { x: 0.4, y: 1 }, wa: -80 },
  cblock: { hx: 2, hy: 15, torso: 10, head: 2, hF: [6, -11], hB: [8, -8], fF: [9, 0], fB: [-9, 0], eF: { x: 0.4, y: 1 }, eB: { x: 0.4, y: 1 }, wa: -80 },
  jump: { hy: -3, torso: 6, head: -6, fF: [6, -13], fB: [-5, -7], hF: [9, -8], hB: [6, -5] },
  tuck: { hy: -6, torso: 18, head: 0, fF: [8, -20], fB: [2, -17], hF: [10, 2], hB: [8, 4] },
  hit: { hx: -3, hy: 4, torso: -20, head: -18, hF: [3, 4], hB: [-3, 6], fF: [11, 0], fB: [-11, 0] },
  hitLow: { hx: -1, hy: 8, torso: 36, head: 16, hF: [6, 8], hB: [3, 10], fF: [9, 0], fB: [-10, 0] },
  fall: { torso: -25, head: -25, hF: [-3, -14], hB: [-8, -10], fF: [10, -8], fB: [4, -3] },
  lie: { hx: 0, hy: 34, torso: 0, head: 0, hF: [2, 20], hB: [-1, 20], fF: [2, 34], fB: [-1, 34], rot: -90, eF: { x: -1, y: 0 }, eB: { x: -1, y: 0 } },
  dizzy: { hy: 5, torso: 6, head: 0, hF: [4, 14], hB: [0, 15], fF: [7, 0], fB: [-7, 0] },
  land: { hx: 1, hy: 9, torso: 18, head: -10, hF: [9, -3], hB: [7, 0], fF: [9, 0], fB: [-9, 0] },
  rush: { hy: 5, torso: 50, head: -40, hF: [14, -3], hB: [10, 3], fF: [10, -2], fB: [-14, -3] },
  slide: { hy: 22, torso: -45, head: 30, hF: [-4, 6], hB: [-9, 6], fF: [30, 22], fB: [18, 24] },
  cut: { hy: 8, torso: 35, head: -25, hF: [20, 4], hB: [-12, 6], fF: [14, 0], fB: [-16, -2], wa: 15 },
  torpedo: { hy: -4, torso: 90, head: -80, hF: [10, -8], hB: [8, -6], fF: [3, -10], fB: [-2, -8] },
  spinA: { hy: -2, torso: 0, head: -5, fF: [3, -16], fB: [0, 0], hF: [18, -6], hB: [-14, -6] },
  leapUp: { hy: -4, torso: -18, head: -12, hF: [-2, -24], hB: [-5, -22], fF: [6, -12], fB: [-6, -8], wa: -30 },
  smash: { hx: 2, hy: 10, torso: 40, head: -25, hF: [22, 8], hB: [19, 10], fF: [10, 0], fB: [-10, 0], wa: 10 },
  dive: { hy: -2, torso: 70, head: -60, hF: [14, 2], hB: [12, 4], fF: [-2, -6], fB: [-6, -4] },
  cast: { hy: 2, torso: -8, head: -12, hF: [8, -22], hB: [-4, -20], fF: [8, 0], fB: [-8, 0] },
  raise: { hy: 2, torso: -6, head: -15, hF: [3, -25], hB: [6, 2], fF: [8, 0], fB: [-8, 0], eF: { x: 1, y: 0 }, wa: -10 },
  thrust: { hy: 3, torso: 18, head: -4, hF: [22, -6], hB: [20, -3], hx: 3, fF: [12, 0], fB: [-9, 0] },
};

// Ударные позы: wind — замах, hit — момент удара
const MOVE_POSES = {
  jab: { wind: { hF: [4, -3], torso: 6 }, hit: { hF: [22, -4], hB: [5, 1], torso: 16, hx: 2, fF: [10, 0], head: -2 } },
  cross: { wind: { hB: [2, -2], torso: 4 }, hit: { hB: [24, -3], hF: [6, -7], torso: 24, hx: 3, fF: [11, 0] } },
  jabW: { wind: { hF: [1, -12], torso: 0, wa: -110 }, hit: { hF: [20, -2], hB: [6, 1], torso: 18, hx: 2, fF: [10, 0], wa: 5 } },
  crossW: { wind: { hF: [-4, -14], torso: -6, wa: -150 }, hit: { hF: [18, 6], hB: [10, 2], torso: 30, hx: 3, fF: [11, 0], wa: 30 } },
  kick: { wind: { fF: [5, -13], torso: -4, hF: [8, -7], hB: [4, -3] }, hit: { fF: [26, -36], torso: -18, head: 12, hF: [3, -6], hB: [-6, -1], fB: [-6, 0], hx: -2 } },
  roundhouse: { wind: { fB: [0, -12], torso: -12, hF: [6, -8] }, hit: { fB: [25, -41], fF: [2, 0], torso: -28, head: 18, hF: [0, -6], hB: [-7, -8], hx: -3 } },
  uppercut: { wind: { hy: 12, torso: 26, head: -10, hF: [5, 6], hB: [7, -6], fF: [9, 0], fB: [-9, 0] }, hit: { hy: -1, torso: -6, head: -12, hF: [7, -25], hB: [4, -2], fF: [8, 0], fB: [-8, 0], eF: { x: 1, y: 0.2 }, wa: -20 } },
  sweep: { wind: { hx: 2, hy: 15, torso: 28, fF: [8, 0], fB: [-8, 0], hF: [8, 0], hB: [4, 4] }, hit: { hx: 0, hy: 18, torso: 38, head: -14, hF: [6, 6], hB: [2, 9], fF: [30, -1], fB: [-6, 0] } },
  airP: { wind: { hF: [2, -4], torso: 5, fF: [6, -10], fB: [-5, -7] }, hit: { hF: [19, 7], hB: [5, -3], torso: 22, fF: [6, -10], fB: [-6, -6], wa: 20 } },
  airK: { wind: { fF: [4, -14], fB: [-4, -10], torso: 0 }, hit: { fF: [23, -8], fB: [-3, -13], torso: -12, hF: [4, -10], hB: [-4, -8] } },
  throw: { wind: { hF: [18, -6], hB: [16, -4], torso: 20 }, hit: { hF: [-6, -22], hB: [-8, -20], torso: -30, head: -20, wa: -120 } },
  backfist: { wind: { hF: [-6, -6], hB: [2, 0], torso: -22, head: 8 }, hit: { hF: [24, -9], eF: { x: 0, y: -1 }, hB: [-5, 2], torso: -4, head: -2, hx: 2, fF: [10, 0] } },
  pushkick: { wind: { fF: [6, -18], torso: -8, hF: [6, -8], hB: [3, -4] }, hit: { fF: [29, -21], torso: -16, head: 8, hx: -4, hF: [2, -8], hB: [-6, -4], fB: [-8, 0] } },
  overhead: { wind: { hF: [0, -27], hB: [-3, -25], torso: -14, head: -10, hy: 1, wa: -170 }, hit: { hF: [21, 3], hB: [19, 5], torso: 36, head: -20, hy: 6, hx: 3, fF: [11, 0], wa: 40 } },
  divekick: { wind: { fF: [6, -14], fB: [-4, -10] }, hit: { fF: [18, 7], fB: [-6, -12], torso: -28, head: 20, hF: [4, -12], hB: [-6, -10] } },
  proj: { wind: { hF: [-5, -3], hB: [-7, -1], torso: -10, wa: -120 }, hit: { hF: [22, -6], hB: [20, -3], torso: 18, hx: 3, fF: [12, 0], wa: 0 } },
};

const ANIM = {
  idle(ch, t) {
    const s = stanceOf(ch), b = Math.sin(t * 0.09);
    const p = Object.assign({}, s);
    p.hy += b * 0.8; p.head += b * 1.2;
    p.hF = [s.hF[0], s.hF[1] + b * 0.8]; p.hB = [s.hB[0], s.hB[1] + b * 0.6];
    return p;
  },
  walk(ch, t) {
    const s = stanceOf(ch), ph = t * 0.21, sn = Math.sin(ph), cs = Math.cos(ph);
    const p = Object.assign({}, s);
    p.fF = [s.fF[0] + sn * 4.5, s.fF[1] - Math.max(0, cs) * 3];
    p.fB = [s.fB[0] - sn * 4.5, s.fB[1] - Math.max(0, -cs) * 3];
    p.hy = s.hy + Math.abs(sn) * 0.8 - 0.6;
    p.hF = [s.hF[0] - sn * 1.2, s.hF[1]]; p.hB = [s.hB[0] + sn * 1.2, s.hB[1]];
    return p;
  },
  crouch(ch) { return mkPose(ch.stance || {}, POSES.crouch, ch.stance && ch.stance.wa != null ? { wa: ch.stance.wa } : {}); },
  dizzy(ch, t) {
    const s = Math.sin(t * 0.07);
    return mkPose(POSES.dizzy, { hx: s * 3, torso: 6 + s * 10, head: Math.sin(t * 0.11) * 18, hF: [4 + s * 2, 14], hB: [s * 2, 15] });
  },
  victory(ch, t) {
    const T = t;
    switch (ch.win) {
      case 'fist': return mkPose({ hy: 2, torso: -4, head: -12, hF: [3, -25], eF: { x: 1, y: 0 }, hB: [7, 3], fF: [8, 0], fB: [-8, 0] });
      case 'bow': { const k = ease(Math.min(1, T / 40)) * (T < 120 ? 1 : Math.max(0, 1 - (T - 120) / 30)); return blendPose(stanceOf(ch), mkPose({ torso: 45, head: 10, hF: [8, 6], hB: [7, 7], fF: [5, 0], fB: [-5, 0], hy: 4 }), k); }
      case 'salute': return mkPose({ hy: 0, torso: 0, head: -4, hF: [7, -12], eF: { x: 1, y: -0.2 }, hB: [2, 13], fF: [5, 0], fB: [-5, 0] });
      case 'sword': return mkPose({ hy: 3, torso: -5, head: -8, hF: [3, -24], hB: [8, 2], fF: [9, 0], fB: [-9, 0], wa: -15, eF: { x: 1, y: 0 } });
      case 'roar': { const s = Math.sin(T * 0.5) * 1.5; return mkPose({ hy: 5, torso: -15, head: -25 + s, hF: [6, -24], hB: [-6, -22], fF: [10, 0], fB: [-10, 0], wa: -20 }); }
      case 'levitate': { const s = Math.sin(T * 0.08) * 2; return mkPose({ hy: -6 + s, torso: -5, head: -10, hF: [9, -18], hB: [-6, -16], fF: [4, 4 + s], fB: [-3, 6 + s] }); }
      case 'dance': { const s = Math.sin(T * 0.25); return mkPose({ hx: s * 3, hy: 2 - Math.abs(s) * 3, torso: s * 12, head: -s * 10, hF: [6, -20 + s * 4], hB: [-6, -20 - s * 4], fF: [8, s > 0 ? -6 * s : 0], fB: [-8, s < 0 ? 6 * s : 0] }); }
      case 'fly': return mkPose({ hy: -4, torso: 35, head: -30, hF: [14, -4], hB: [10, 0], fF: [-2, -6], fB: [-6, -4] });
      case 'drum': { const k = (T % 24) / 24, up = k < 0.6; return mkPose({ hy: up ? 2 : 7, torso: up ? -8 : 30, head: up ? -10 : -20, hF: up ? [3, -24] : [20, 6], hB: [8, 2], fF: [9, 0], fB: [-9, 0], wa: up ? -20 : 0 }); }
      case 'spin': return mkPose({ hy: -2, torso: 0, head: -8, fF: [2, -15], fB: [0, 0], hF: [2, -26], hB: [-1, -26], eF: { x: 1, y: -0.5 }, eB: { x: -1, y: -0.5 } });
    }
    return stanceOf(ch);
  }
};
function movePose(ch, name, k, phase) {
  let key = name;
  if (ch.weapon && (name === 'jab' || name === 'cross')) key = name + 'W';
  const mp = MOVE_POSES[key];
  const base = name === 'sweep' || name === 'uppercut' ? mkPose(POSES.crouch) : name === 'airP' || name === 'airK' || name === 'divekick' ? mkPose(POSES.jump) : stanceOf(ch);
  const wind = mkPose(base, mp.wind), hit = mkPose(base, mp.hit);
  if (phase === 0) return k < 0.6 ? blendPose(base, wind, ease(k / 0.6)) : blendPose(wind, hit, ease((k - 0.6) / 0.4));
  if (phase === 1) return hit;
  return blendPose(hit, stanceOf(ch), ease(k));
}
