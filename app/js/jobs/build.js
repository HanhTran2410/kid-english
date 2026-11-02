// Trò Thợ xây (SPEC-jobs3.md mục 6): đội mũ bảo hộ mở đầu; ca A xây nhà theo bản vẽ bằng các hình (mức 1 bản vẽ lộ
// dáng + màu, mức 2 phải nghe hình + màu, mức 3 hình + cỡ + số, có hình của Đếm hình mới khi bé đã chơi), ca B lấp ổ gà
// đúng dáng. File thuần: dữ liệu, kế hoạch lượt (bất biến mục 2.2), câu nói.

import { planChecked, shuffle, pick, leastSeen, NUMBER_WORDS, cap } from './levels.js';
import { PATIENTS } from '../doctor.js';

export const MAX_LEVEL = 3;
export const CASES_PER_ROUND = 3;

/** Tên hình (cùng tên với Đếm hình — shapes.js). `set: 2` = hình của Đếm hình mới. */
export const SHAPES = {
  square: { name: 'square', plural: 'squares', vi: 'hình vuông', set: 1 },
  triangle: { name: 'triangle', plural: 'triangles', vi: 'hình tam giác', set: 1 },
  rectangle: { name: 'rectangle', plural: 'rectangles', vi: 'hình chữ nhật', set: 1 },
  circle: { name: 'circle', plural: 'circles', vi: 'hình tròn', set: 1 },
  star: { name: 'star', plural: 'stars', vi: 'ngôi sao', set: 1 },
  heart: { name: 'heart', plural: 'hearts', vi: 'trái tim', set: 1 },
  trapezoid: { name: 'trapezoid', plural: 'trapezoids', vi: 'hình thang', set: 2 },
  semicircle: { name: 'semicircle', plural: 'semicircles', vi: 'nửa hình tròn', set: 2 },
  diamond: { name: 'diamond', plural: 'diamonds', vi: 'hình thoi', set: 2 },
  hexagon: { name: 'hexagon', plural: 'hexagons', vi: 'hình lục giác', set: 2 },
  parallelogram: { name: 'parallelogram', plural: 'parallelograms', vi: 'hình bình hành', set: 2 },
};
export const COLORS = ['red', 'blue', 'yellow', 'green'];
export const COLOR_VI = { red: 'đỏ', blue: 'xanh dương', yellow: 'vàng', green: 'xanh lá' };
export const PARTS = { wall: 'tường', roof: 'mái nhà', door: 'cửa ra vào', window: 'cửa sổ' };
/** Ổ gà: hình cũ (mức 1–2) / hình mới (mức 3, khi đã chơi Đếm hình mới). */
const HOLE_OLD = { 1: ['square', 'triangle', 'circle'], 2: ['square', 'rectangle', 'circle'] };
const HOLE_NEW = ['trapezoid', 'parallelogram', 'diamond'];
/** Hình dễ nhầm với một hình (khối nhiễu "gần dáng"). */
const NEAR = {
  square: ['rectangle', 'diamond', 'circle'], rectangle: ['square', 'parallelogram', 'trapezoid'], circle: ['semicircle', 'square', 'heart'],
  triangle: ['trapezoid', 'heart', 'star'], trapezoid: ['triangle', 'rectangle', 'parallelogram'], parallelogram: ['rectangle', 'diamond', 'trapezoid'],
  diamond: ['square', 'parallelogram', 'hexagon'], hexagon: ['circle', 'diamond', 'star'], semicircle: ['circle', 'triangle', 'heart'],
  star: ['heart', 'triangle', 'hexagon'], heart: ['star', 'circle', 'triangle'],
};

/**
 * Ca A — xây nhà: { kind: 'house', parts: [{ id, part, shape, color, size }], steps: [[mã phần…]], pieces: [[khối…] theo bước] }.
 * Mỗi bước là một yêu cầu (một phần; mức 3 hai cửa sổ cùng lúc). Khay mỗi bước: đúng hình + hình cùng dáng khác màu / cỡ
 * + một dáng khác (mức 1: khay là các phần còn lại, mỗi phần một màu).
 */
export function makeHouseCase(level, { rng = Math.random, shapes2 = false } = {}) {
  const colors = shuffle(COLORS, rng);
  if (level <= 1) {
    const parts = [
      { id: 'p0', part: 'wall', shape: 'square', color: colors[0], size: 'big' },
      { id: 'p1', part: 'roof', shape: 'triangle', color: colors[1], size: 'big' },
      { id: 'p2', part: 'door', shape: 'rectangle', color: colors[2], size: 'small' },
    ];
    return { kind: 'house', parts, steps: parts.map((p) => [p.id]), pieces: null };
  }
  if (level === 2) {
    const parts = [
      { id: 'p0', part: 'wall', shape: 'square', color: colors[0], size: 'big' },
      { id: 'p1', part: 'roof', shape: 'triangle', color: colors[1], size: 'big' },
      { id: 'p2', part: 'door', shape: 'rectangle', color: colors[2], size: 'small' },
      { id: 'p3', part: 'window', shape: 'circle', color: colors[3], size: 'small' },
    ];
    const pieces = parts.map((p) => shuffle([
      { id: `${p.id}:ok`, shape: p.shape, color: p.color, size: p.size },
      { id: `${p.id}:c`, shape: p.shape, color: pick(colors.filter((c) => c !== p.color), rng), size: p.size },
      { id: `${p.id}:s`, shape: pick(NEAR[p.shape].filter((s) => !SHAPES[s].set || SHAPES[s].set === 1), rng), color: p.color, size: p.size },
    ], rng));
    return { kind: 'house', parts, steps: parts.map((p) => [p.id]), pieces };
  }
  const roof = shapes2 && rng() < 0.6 ? 'trapezoid' : 'triangle';
  const door = shapes2 && rng() < 0.5 ? 'semicircle' : 'rectangle';
  const win = shapes2 && rng() < 0.6 ? pick(['diamond', 'hexagon'], rng) : 'square';
  const color = colors[0];
  const parts = [
    { id: 'p0', part: 'wall', shape: 'square', color: colors[1], size: 'big' },
    { id: 'p1', part: 'roof', shape: roof, color: colors[2], size: 'big' },
    { id: 'p2', part: 'door', shape: door, color: colors[3], size: 'small' },
    { id: 'p3', part: 'window', shape: win, color, size: 'small' },
    { id: 'p4', part: 'window', shape: win, color, size: 'small' },
  ];
  const steps = [['p0'], ['p1'], ['p2'], ['p3', 'p4']];
  // Mức 3: cùng dáng khác cỡ + một dáng gần giống; cửa sổ: hai khối đúng (đặt chỗ nào trong hai ô cũng được).
  const pieces = steps.map((ids) => {
    const p = parts.find((x) => x.id === ids[0]);
    const near = pick(NEAR[p.shape].filter((s) => shapes2 || SHAPES[s].set === 1), rng);
    return shuffle([
      ...ids.map((id) => ({ id: `${id}:ok`, shape: p.shape, color: p.color, size: p.size })),
      { id: `${ids[0]}:z`, shape: p.shape, color: p.color, size: p.size === 'big' ? 'small' : 'big' },
      { id: `${ids[0]}:s`, shape: near, color: p.color, size: p.size },
    ], rng);
  });
  return { kind: 'house', parts, steps, pieces };
}

/** Ca B — ổ gà: { kind: 'road', hole, blocks: [3 hình khác nhau] }. */
export function makeRoadCase(level, { rng = Math.random, shapes2 = false, seen = {} } = {}) {
  const pool = level >= 3 && shapes2 ? HOLE_NEW : HOLE_OLD[Math.min(level, 2)];
  const hole = leastSeen(pool, Object.fromEntries(pool.map((s) => [s, seen[`hole:${s}`] ?? 0])), rng)[0]; // ưu tiên hình ít gặp
  const allowNew = shapes2 && level >= 3;
  const others = level <= 1 ? HOLE_OLD[1].filter((s) => s !== hole) : shuffle(NEAR[hole].filter((s) => allowNew || SHAPES[s].set === 1), rng).slice(0, 2);
  return { kind: 'road', hole, blocks: shuffle([hole, ...others], rng) };
}

/** Khối khớp yêu cầu của bước (mức 1: đúng dáng; mức 2: dáng + màu; mức 3: dáng + cỡ). */
export function pieceFits(level, part, piece) {
  if (piece.shape !== part.shape) return false;
  if (level === 2 && piece.color !== part.color) return false;
  if (level >= 3 && piece.size !== part.size) return false;
  return true;
}

export function caseOk(c, level, { shapes2: played = false } = {}) {
  const shapes2 = played && level >= 3; // hình mới chỉ ở mức 3, khi bé đã chơi Đếm hình mới
  if (c.kind === 'house') {
    if (!c.parts.length || c.parts.length > 5) return false;
    if (!shapes2 && c.parts.some((p) => SHAPES[p.shape].set === 2)) return false;
    if (level <= 1) return c.pieces === null && c.steps.length === c.parts.length;
    return c.steps.every((ids, i) => {
      const part = c.parts.find((p) => p.id === ids[0]);
      const fit = c.pieces[i].filter((pc) => pieceFits(level, part, pc)).length;
      const ok = fit === ids.length && c.pieces[i].length > fit; // đúng đủ số chỗ, có ít nhất một khối không hợp
      const allNew = c.pieces[i].every((pc) => shapes2 || SHAPES[pc.shape].set === 1);
      return ok && allNew && ids.every((id) => c.parts.find((p) => p.id === id).shape === part.shape);
    });
  }
  if (c.kind === 'road') {
    if (new Set(c.blocks).size !== 3 || c.blocks.filter((b) => b === c.hole).length !== 1) return false;
    return shapes2 || c.blocks.every((b) => SHAPES[b].set === 1);
  }
  return false;
}
export const caseActions = (c) => (c.kind === 'house' ? c.parts.length : 1);

/** Kế hoạch một lượt (mục 6.3): A + B + A. `shapes2`: bé đã chơi Đếm hình mới (mới dùng hình mới ở mức 3). */
export function planRound(level, { rng = Math.random, shapes2 = false, seen = {} } = {}) {
  const make = () => ({
    cases: [makeHouseCase(level, { rng, shapes2 }), makeRoadCase(level, { rng, shapes2, seen }), makeHouseCase(level, { rng, shapes2 })],
    customers: shuffle(PATIENTS.map((p) => p.id), rng).slice(0, CASES_PER_ROUND),
  });
  const ok = (p) => p.cases.every((c) => caseOk(c, level, { shapes2 }) && caseActions(c) <= 5);
  return planChecked(make, ok, () => fallbackPlan(level));
}
export function fallbackPlan(level) {
  const parts = [
    { id: 'p0', part: 'wall', shape: 'square', color: 'red', size: 'big' },
    { id: 'p1', part: 'roof', shape: 'triangle', color: 'blue', size: 'big' },
    { id: 'p2', part: 'door', shape: 'rectangle', color: 'yellow', size: 'small' },
  ];
  const pieces = level <= 1 ? null : parts.map((p) => [
    { id: `${p.id}:ok`, shape: p.shape, color: p.color, size: p.size },
    { id: `${p.id}:s`, shape: 'circle', color: p.color, size: p.size },
  ]);
  const house = { kind: 'house', parts, steps: parts.map((p) => [p.id]), pieces };
  return { cases: [house, { kind: 'road', hole: 'square', blocks: ['square', 'circle', 'triangle'] }, house], customers: ['teddy', 'kitty', 'puppy'] };
}
/** Bé đã chơi Đếm hình mới chưa (cài đặt `shapeCount2`). */
export const playedShapes2 = (state) => Boolean(state && ((state.rounds ?? 0) > 0 || (state.level ?? 1) > 1 || state.seen?.length));

// ---------- Câu nói ([en, vi]) ----------
export const HELMET_LINE = ['Helmet on!', 'Đội mũ bảo hộ nào!'];
export const BUILD_LINE = ["Let's build!", 'Mình xây nhà nào!'];
export const HOUSE_LINE = ['A house, please!', 'Xây cho tớ một ngôi nhà nhé!'];
export const MY_HOUSE_LINE = ['My house! Thank you!', 'Nhà của tớ! Cảm ơn bạn!'];
export const HOLE_LINE = ['Oh no! A hole!', 'Ôi, có ổ gà!'];
export const ROAD_THANKS_LINE = ['Beep beep! Thank you!', 'Bíp bíp! Cảm ơn bạn!'];
const article = (w) => (/^[aeiou]/.test(w) ? 'an' : 'a');
/** Yêu cầu của bước: mức 1 "Triangle, please!"; mức 2 "A red triangle, please!"; mức 3 "A big triangle, please!" / "Two square windows, please!". */
export function partAskLine(level, parts) {
  const p = parts[0];
  const s = SHAPES[p.shape];
  if (parts.length > 1) return [`${cap(NUMBER_WORDS[parts.length])} ${s.name} windows, please!`, `Cho tớ ${parts.length} cửa sổ ${s.vi} nhé!`];
  if (level <= 1) return [`${cap(s.name)}, please!`, `${cap(s.vi)} nhé!`];
  if (level === 2) return [`${cap(article(p.color))} ${p.color} ${s.name}, please!`, `Cho tớ ${s.vi} màu ${COLOR_VI[p.color]} nhé!`];
  return [`${cap(article(p.size))} ${p.size} ${s.name}, please!`, `Cho tớ ${s.vi} ${p.size === 'big' ? 'to' : 'nhỏ'} nhé!`];
}
/** Chú thợ xây nói khi khớp: "A triangle! The roof!". */
export const partDoneLine = (p, n = 1) => (n > 1
  ? [`${cap(NUMBER_WORDS[n])} ${SHAPES[p.shape].plural}! The ${p.part}s!`, `${n} ${SHAPES[p.shape].vi}! ${cap(PARTS[p.part])}!`]
  : [`${cap(article(SHAPES[p.shape].name))} ${SHAPES[p.shape].name}! The ${p.part}!`, `${cap(SHAPES[p.shape].vi)}! ${cap(PARTS[p.part])}!`]);
/** Khối sai: nói đúng thứ vừa đặt (dáng / màu / cỡ theo mức), rồi nhắc lại yêu cầu. */
export function pieceWrongLine(level, parts, piece) {
  const p = parts[0];
  const ask = partAskLine(level, parts)[0];
  const sh = SHAPES[piece.shape].name;
  let said;
  if (level === 2 && piece.shape === p.shape) said = `That's ${article(piece.color)} ${piece.color} ${sh}.`;
  else if (level >= 3 && piece.shape === p.shape) said = `That's ${article(piece.size)} ${piece.size} ${sh}.`;
  else said = `That's ${article(sh)} ${sh}.`;
  return [`${said} ${ask}`, `Đó là ${SHAPES[piece.shape].vi}. ${partAskLine(level, parts)[1]}`];
}
export const holeAskLine = (hole) => [`${cap(SHAPES[hole].name)}, please!`, `Cần ${SHAPES[hole].vi}!`];
export const holeIntroLine = (hole) => [`${cap(article(SHAPES[hole].name))} ${SHAPES[hole].name} hole!`, `Ổ gà ${SHAPES[hole].vi}!`];
export const blockWrongLine = (block, hole) => [`That's ${article(SHAPES[block].name)} ${SHAPES[block].name}. ${cap(SHAPES[hole].name)}, please!`, `Đó là ${SHAPES[block].vi}. Cần ${SHAPES[hole].vi}!`];
