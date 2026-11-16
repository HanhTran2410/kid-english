// Trò Thợ xây (SPEC-jobs3.md mục 6, SPEC-jobs4.md mục 4): đội mũ bảo hộ mở đầu; ca A xây nhà theo bản vẽ bằng các hình
// (mức 1 bản vẽ lộ dáng + màu, mức 2 phải nghe hình + màu, mức 3 hình + cỡ + số, có hình của Đếm hình mới khi bé đã chơi),
// ca B lấp ổ gà đúng dáng, ca C sơn chính ngôi nhà vừa xây, ca D xây tháp (đếm, mức 3 mẫu lặp). Lượt A + (B / D) + C.
// File thuần: dữ liệu, kế hoạch lượt (bất biến mục 2.2), câu nói.

import { planChecked, shuffle, pick, randInt, leastSeen, NUMBER_WORDS, cap } from './levels.js';
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
    { id: 'p3', part: 'window', shape: win, color, size: 'big' },
    { id: 'p4', part: 'window', shape: win, color, size: 'small' },
  ];
  const steps = [['p0'], ['p1'], ['p2'], ['p3', 'p4']];
  // Mức 3: cùng dáng khác cỡ + một dáng gần giống; cửa sổ: một to một nhỏ, mỗi khối tự vào ô đúng cỡ (đặt thứ tự nào cũng
  // được) + một dáng gần giống (không có khối "khác cỡ" vì cả hai cỡ đều đúng).
  const pieces = steps.map((ids) => {
    const p = parts.find((x) => x.id === ids[0]);
    const near = pick(NEAR[p.shape].filter((s) => shapes2 || SHAPES[s].set === 1), rng);
    const ok = ids.map((id) => parts.find((x) => x.id === id)).map((q) => ({ id: `${q.id}:ok`, shape: q.shape, color: q.color, size: q.size }));
    return shuffle([
      ...ok,
      ...(ids.length === 1 ? [{ id: `${ids[0]}:z`, shape: p.shape, color: p.color, size: p.size === 'big' ? 'small' : 'big' }] : []),
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
      const stepParts = ids.map((id) => c.parts.find((p) => p.id === id));
      const fit = c.pieces[i].filter((pc) => stepParts.some((q) => pieceFits(level, q, pc))).length;
      const ok = fit === ids.length && c.pieces[i].length > fit; // đúng đủ số chỗ, có ít nhất một khối không hợp
      const allNew = c.pieces[i].every((pc) => shapes2 || SHAPES[pc.shape].set === 1);
      return ok && allNew && ids.every((id) => c.parts.find((p) => p.id === id).shape === part.shape);
    });
  }
  if (c.kind === 'road') {
    if (new Set(c.blocks).size !== 3 || c.blocks.filter((b) => b === c.hole).length !== 1) return false;
    return shapes2 || c.blocks.every((b) => SHAPES[b].set === 1);
  }
  if (c.kind === 'tower') return towerOk(c, level);
  return false;
}

// ---------- Ca C — sơn nhà (SPEC-jobs4 4.1) ----------
/**
 * { kind: 'paint', asks: [{ id: mã phần, color }], buckets: [màu] }. Sơn chính ngôi nhà ca A (`house`); màu gọi khác màu
 * hiện tại. Mức 1: cả 3 phần lần lượt (phần sáng viền, chỉ chọn màu), 3 thùng; mức 2: 2 phần khác nhau, 4 thùng;
 * mức 3: một cửa sổ (to / nhỏ) + một phần khác, thứ tự ngẫu nhiên, 4 thùng.
 */
export function makePaintCase(level, house, { rng = Math.random } = {}) {
  const other = (p) => pick(COLORS.filter((c) => c !== p.color), rng);
  let targets;
  if (level <= 1) targets = house.parts;
  else if (level === 2) targets = shuffle(house.parts, rng).slice(0, 2);
  else targets = shuffle([pick(house.parts.filter((p) => p.part === 'window'), rng), pick(house.parts.filter((p) => p.part !== 'window'), rng)], rng);
  const asks = targets.map((p) => ({ id: p.id, color: other(p) }));
  const buckets = level <= 1 ? null : shuffle(COLORS, rng);
  return { kind: 'paint', asks, buckets, bucketsByAsk: level <= 1 ? asks.map((a) => shuffle([a.color, ...shuffle(COLORS.filter((c) => c !== a.color), rng).slice(0, 2)], rng)) : null };
}
/** Thùng sơn của yêu cầu `i` (mức 1 mỗi phần 3 thùng riêng; mức 2–3 cả 4 màu). */
export const bucketsOf = (c, i) => c.bucketsByAsk?.[i] ?? c.buckets;
export function paintOk(c, house, level) {
  if (!house || house.kind !== 'house') return false;
  const partOf = (id) => house.parts.find((p) => p.id === id);
  if (c.asks.length !== (level <= 1 ? 3 : 2) || new Set(c.asks.map((a) => a.id)).size !== c.asks.length) return false;
  if (!c.asks.every((a, i) => partOf(a.id) && a.color !== partOf(a.id).color && COLORS.includes(a.color) && bucketsOf(c, i).includes(a.color))) return false;
  if (level >= 3) {
    const wins = house.parts.filter((p) => p.part === 'window');
    if (wins.length !== 2 || wins[0].size === wins[1].size) return false;
    if (!c.asks.some((a) => partOf(a.id).part === 'window')) return false;
  }
  // Mỗi yêu cầu chỉ khớp đúng một phần (phần + cỡ ở mức 3; mức 2 nhà chỉ có một cửa sổ).
  return c.asks.every((a) => house.parts.filter((p) => p.part === partOf(a.id).part && (level < 3 || p.size === partOf(a.id).size)).length === 1);
}

// ---------- Ca D — xây tháp (SPEC-jobs4 4.2) ----------
/**
 * { kind: 'tower', n, color, piles: [màu], base: [màu có sẵn] | null, next: [2 màu bé đặt] | null, pattern: 'AB' | 'AAB' | null }.
 * Mức 1: 1–3 khối một màu; mức 2: 2–5 khối đúng màu, 2 đống màu; mức 3: mẫu lặp AB (có sẵn 4) / AAB (có sẵn 3), đặt 2 khối.
 */
export function makeTowerCase(level, { rng = Math.random } = {}) {
  const [a, b, c] = shuffle(COLORS, rng);
  if (level <= 1) return { kind: 'tower', n: randInt(1, 3, rng), color: a, piles: [a], base: null, next: null, pattern: null };
  if (level === 2) return { kind: 'tower', n: randInt(2, 5, rng), color: a, piles: shuffle([a, b], rng), base: null, next: null, pattern: null };
  const pattern = pick(['AB', 'AAB'], rng);
  const base = pattern === 'AB' ? [a, b, a, b] : [a, a, b];
  const next = pattern === 'AB' ? [a, b] : [a, a];
  return { kind: 'tower', n: 2, color: null, piles: shuffle([a, b, c], rng), base, next, pattern };
}
export function towerOk(c, level) {
  if (level <= 1) return c.n >= 1 && c.n <= 3 && c.piles.length === 1 && c.piles[0] === c.color;
  if (level === 2) return c.n >= 2 && c.n <= 5 && c.piles.length === 2 && c.piles.includes(c.color) && new Set(c.piles).size === 2;
  if (!c.base || !c.next || c.next.length !== 2 || new Set(c.piles).size !== 3) return false;
  const unit = c.pattern === 'AB' ? 2 : 3;
  const full = [...c.base, ...c.next];
  if (c.base.length !== (c.pattern === 'AB' ? 4 : 3)) return false;
  // Dãy đủ (có sẵn + 2 khối bé đặt) lặp đúng mẫu; khay có đủ màu cho 2 bước + 1 màu không có trong mẫu.
  return full.every((x, i) => x === full[i % unit]) && c.next.every((x) => c.piles.includes(x)) && c.piles.some((x) => !full.includes(x));
}
/** Màu khối bé cần đặt tiếp (mức 2: màu được gọi; mức 1: màu duy nhất; mức 3: theo mẫu). */
export const towerWant = (c, placed) => (c.next ? c.next[placed] : c.color);

export const caseActions = (c) => (c.kind === 'house' ? c.parts.length : c.kind === 'paint' ? c.asks.length * (c.bucketsByAsk ? 1 : 2) : c.kind === 'tower' ? c.n : 1);

/** Ca B (sửa đường) và D (xây tháp) luân phiên theo số lượt đã chơi (SPEC-jobs4 4.1). */
export const roadOrTower = (rounds) => ((rounds ?? 0) % 2 === 0 ? 'road' : 'tower');

/**
 * Kế hoạch một lượt (SPEC-jobs4 4.1, thay SPEC-jobs3 6.3): A + (B / D luân phiên) + C — ca C sơn nhà của ca A (cùng bạn
 * thú). `shapes2`: bé đã chơi Đếm hình mới (mới dùng hình mới ở mức 3).
 */
export function planRound(level, { rng = Math.random, shapes2 = false, seen = {}, rounds = 0 } = {}) {
  const make = () => {
    const house = makeHouseCase(level, { rng, shapes2 });
    const middle = roadOrTower(rounds) === 'road' ? makeRoadCase(level, { rng, shapes2, seen }) : makeTowerCase(level, { rng });
    const [k0, k1] = shuffle(PATIENTS.map((p) => p.id), rng);
    return { cases: [house, middle, makePaintCase(level, house, { rng })], customers: [k0, k1, k0] };
  };
  const ok = (p) => p.cases[0].kind === 'house' && p.cases[2].kind === 'paint' && paintOk(p.cases[2], p.cases[0], level)
    && p.cases.every((c) => (c.kind === 'paint' || caseOk(c, level, { shapes2 })) && caseActions(c) <= 5);
  return planChecked(make, ok, () => fallbackPlan(level, rounds));
}
export function fallbackPlan(level, rounds = 0) {
  const parts = [
    { id: 'p0', part: 'wall', shape: 'square', color: 'red', size: 'big' },
    { id: 'p1', part: 'roof', shape: 'triangle', color: 'blue', size: 'big' },
    { id: 'p2', part: 'door', shape: 'rectangle', color: 'yellow', size: 'small' },
  ];
  if (level >= 3) {
    parts.push({ id: 'p3', part: 'window', shape: 'square', color: 'green', size: 'big' }, { id: 'p4', part: 'window', shape: 'square', color: 'green', size: 'small' });
  }
  const steps = level >= 3 ? [['p0'], ['p1'], ['p2'], ['p3', 'p4']] : parts.map((p) => [p.id]);
  const housePieces = level <= 1 ? null : steps.map((ids) => [
    ...ids.map((id) => parts.find((p) => p.id === id)).map((p) => ({ id: `${p.id}:ok`, shape: p.shape, color: p.color, size: p.size })),
    { id: `${ids[0]}:s`, shape: 'circle', color: parts.find((p) => p.id === ids[0]).color, size: parts.find((p) => p.id === ids[0]).size },
  ]);
  const house = { kind: 'house', parts, steps, pieces: housePieces };
  const middle = roadOrTower(rounds) === 'road' ? { kind: 'road', hole: 'square', blocks: ['square', 'circle', 'triangle'] }
    : level <= 1 ? { kind: 'tower', n: 3, color: 'red', piles: ['red'], base: null, next: null, pattern: null }
      : level === 2 ? { kind: 'tower', n: 3, color: 'yellow', piles: ['yellow', 'blue'], base: null, next: null, pattern: null }
        : { kind: 'tower', n: 2, color: null, piles: ['red', 'blue', 'green'], base: ['red', 'blue', 'red', 'blue'], next: ['red', 'blue'], pattern: 'AB' };
  const paint = level <= 1
    ? { kind: 'paint', asks: [{ id: 'p0', color: 'green' }, { id: 'p1', color: 'red' }, { id: 'p2', color: 'blue' }], buckets: null, bucketsByAsk: [['green', 'red', 'blue'], ['red', 'blue', 'green'], ['blue', 'green', 'red']] }
    : level === 2 ? { kind: 'paint', asks: [{ id: 'p2', color: 'blue' }, { id: 'p0', color: 'green' }], buckets: ['red', 'blue', 'yellow', 'green'], bucketsByAsk: null }
      : { kind: 'paint', asks: [{ id: 'p4', color: 'yellow' }, { id: 'p1', color: 'green' }], buckets: ['red', 'blue', 'yellow', 'green'], bucketsByAsk: null };
  return { cases: [house, middle, paint], customers: ['teddy', 'kitty', 'teddy'] };
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

// ---------- Ca C — sơn nhà (SPEC-jobs4 4.1) ----------
export const PAINT_LINE = ['Paint my house, please!', 'Sơn nhà cho tớ nhé!'];
export const PAINT_DONE_LINE = ['My beautiful house!', 'Nhà của tớ đẹp quá!'];
/** Tên phần khi nói: mức 3 cửa sổ kèm cỡ ("small window"). */
const partName = (p, level) => (level >= 3 && p.part === 'window' ? `${p.size} window` : p.part);
const partVi = (p, level) => (level >= 3 && p.part === 'window' ? `cửa sổ ${p.size === 'big' ? 'to' : 'nhỏ'}` : PARTS[p.part]);
/** Mức 1 (phần đang sơn sáng viền): "Red, please!". */
export const paintColorLine = (color) => [`${cap(color)}, please!`, `Màu ${COLOR_VI[color]} nhé!`];
/** Mức 2–3: "Paint the door blue!" / "Paint the small window yellow!"; yêu cầu thứ hai: "Now paint the roof green!". */
export const paintAskLine = (p, color, level, second = false) => [`${second ? 'Now paint' : 'Paint'} the ${partName(p, level)} ${color}!`, `${second ? 'Giờ sơn' : 'Sơn'} ${partVi(p, level)} màu ${COLOR_VI[color]} nhé!`];
export const bucketWrongLine = (given, want) => [`That's ${given}. ${cap(want)}, please!`, `Đó là màu ${COLOR_VI[given]}. Màu ${COLOR_VI[want]} cơ!`];
/** Chạm sai phần: "That's the wall. The door, please!"; mức 3 sai cỡ: "That's the big window. The small window, please!". */
export const partWrongLine = (given, want, level) => [`That's the ${partName(given, level)}. The ${partName(want, level)}, please!`, `Đó là ${partVi(given, level)}. Sơn ${partVi(want, level)} cơ!`];

// ---------- Ca D — xây tháp (SPEC-jobs4 4.2) ----------
export const TOWER_LINE = ['A tall tower, please!', 'Xây cho tớ một cái tháp cao nhé!'];
export const TOWER_DONE_LINE = ['Hooray! A tall tower!', 'Hoan hô! Tháp cao quá!'];
export const NEXT_LINE = ['What comes next?', 'Tiếp theo là màu gì?'];
export const ENOUGH_LINE = ["That's enough!", 'Đủ rồi!'];
const blockWord = (n) => (n === 1 ? 'block' : 'blocks');
/** Mức 1 "Three blocks, please!"; mức 2 "Four yellow blocks, please!"; mức 3 "What comes next?". */
export function towerAskLine(c) {
  if (c.next) return NEXT_LINE;
  if (c.piles.length === 1) return [`${cap(NUMBER_WORDS[c.n])} ${blockWord(c.n)}, please!`, `Cho tớ ${c.n} khối nhé!`];
  return [`${cap(NUMBER_WORDS[c.n])} ${c.color} ${blockWord(c.n)}, please!`, `Cho tớ ${c.n} khối màu ${COLOR_VI[c.color]} nhé!`];
}
export const blockColorWrongLine = (given, want) => [`That's a ${given} block. ${cap(want)} blocks, please!`, `Đó là khối màu ${COLOR_VI[given]}. Khối màu ${COLOR_VI[want]} cơ!`];
/** Đọc dãy khối thật trên tháp (từ dưới lên): "Red, blue, red, blue, red!". */
export const patternLine = (seq) => [`${seq.map((x, i) => (i ? x : cap(x))).join(', ')}!`, `${seq.map((x) => COLOR_VI[x]).join(', ')}!`];
export const countLine = (n) => [`${cap(NUMBER_WORDS[n])}!`, `${n}!`];
