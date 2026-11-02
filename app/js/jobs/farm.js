// Trò Nông trại (SPEC-jobs3.md mục 4): cho thú ăn (nghe tiếng kêu / tên thức ăn), nhặt trứng (đếm, mức 3 theo màu),
// hái quả (theo màu, mức 3 màu + cỡ + số). File thuần: dữ liệu, kế hoạch lượt (có kiểm tra bất biến mục 2.2), câu nói.

import { planChecked, shuffle, pick, randInt, leastSeen, NUMBER_WORDS, cap } from './levels.js';

export const MAX_LEVEL = 3;
export const CASES_PER_ROUND = 3;

/** Thức ăn (từ mới của nghề): `that` câu "That's …", `vi` phụ đề. */
export const FOODS = {
  hay: { name: 'hay', that: "That's hay.", vi: 'cỏ khô' },
  grass: { name: 'grass', that: "That's grass.", vi: 'cỏ tươi' },
  carrot: { name: 'carrot', that: "That's a carrot.", vi: 'cà rốt' },
  corn: { name: 'corn', that: "That's corn.", vi: 'ngô' },
  apple: { name: 'apple', that: "That's an apple.", vi: 'táo' },
  seeds: { name: 'seeds', that: 'Those are seeds.', vi: 'hạt' },
};
/** Con vật nông trại: tiếng kêu (file của Ai kêu thế?), thức ăn, có trong bài Animals không (ghi "đã gặp"). */
export const FARM_ANIMALS = [
  { id: 'cow', name: 'cow', says: 'Moo!', food: 'hay', emoji: '🐄', vi: 'con bò', lesson: true },
  { id: 'sheep', name: 'sheep', says: 'Baa!', food: 'grass', emoji: '🐑', vi: 'con cừu', lesson: false },
  { id: 'horse', name: 'horse', says: 'Neigh!', food: 'carrot', emoji: '🐴', vi: 'con ngựa', lesson: false },
  { id: 'chicken', name: 'chicken', says: 'Cluck!', food: 'corn', emoji: '🐔', vi: 'con gà', lesson: false },
  { id: 'pig', name: 'pig', says: 'Oink!', food: 'apple', emoji: '🐷', vi: 'con lợn', lesson: true },
  { id: 'duck', name: 'duck', says: 'Quack!', food: 'seeds', emoji: '🦆', vi: 'con vịt', lesson: true },
];
export const ANIMAL_BY_ID = new Map(FARM_ANIMALS.map((a) => [a.id, a]));
export const EGG_COLORS = ['white', 'brown'];
export const APPLE_COLORS = ['red', 'green', 'yellow'];
export const COLOR_VI = { red: 'đỏ', green: 'xanh lá', yellow: 'vàng', white: 'trắng', brown: 'nâu' };
const HAY_GRASS = ['hay', 'grass'];

// ---------- Kế hoạch từng ca ----------
/**
 * Ca A — cho thú ăn: { kind: 'feed', animal, tray: [3 thức ăn], doors: [3 con vật] | null }.
 * Mức 1–2: hay và grass không cùng khay; mức 3: ba cửa chuồng, ba con vật khác tiếng (mọi con khác nhau).
 */
export function makeFeedCase(level, animal, { rng = Math.random } = {}) {
  const food = ANIMAL_BY_ID.get(animal).food;
  let others = Object.keys(FOODS).filter((f) => f !== food);
  if (level <= 2 && HAY_GRASS.includes(food)) others = others.filter((f) => !HAY_GRASS.includes(f));
  const tray = shuffle([food, ...pickDistinct(others, 2, rng, level <= 2)], rng);
  const doors = level >= 3
    ? shuffle([animal, ...shuffle(FARM_ANIMALS.map((a) => a.id).filter((id) => id !== animal), rng).slice(0, 2)], rng)
    : null;
  return { kind: 'feed', animal, tray, doors };
}
/** Bốc `n` món khác nhau; `noHayGrass`: không lấy cả hay lẫn grass. */
function pickDistinct(list, n, rng, noHayGrass) {
  const out = [];
  for (const f of shuffle(list, rng)) {
    if (out.length >= n) break;
    if (noHayGrass && HAY_GRASS.includes(f) && out.some((x) => HAY_GRASS.includes(x))) continue;
    out.push(f);
  }
  return out;
}

/**
 * Ca B — nhặt trứng: { kind: 'eggs', hens: [{ id, eggs: [{ id, color }] }], ask: { color, count } | null, total, cards }.
 * Mức 1: 1–3 trứng trắng; mức 2: 2–5 trứng + 3 thẻ số; mức 3: trứng trắng + nâu (3–5), hỏi 1–3 trứng một màu.
 */
export function makeEggsCase(level, { rng = Math.random } = {}) {
  let eggs;
  let ask = null;
  if (level <= 1) eggs = Array.from({ length: randInt(1, 3, rng) }, () => 'white');
  else if (level === 2) eggs = Array.from({ length: randInt(2, 5, rng) }, () => 'white');
  else {
    const total = randInt(3, 5, rng);
    const color = pick(EGG_COLORS, rng);
    const other = EGG_COLORS.find((c) => c !== color);
    const count = randInt(1, Math.min(3, total - 1), rng);
    const match = randInt(count, total - 1, rng);
    eggs = shuffle([...Array(match).fill(color), ...Array(total - match).fill(other)], rng);
    ask = { color, count };
  }
  const henCount = Math.min(eggs.length, eggs.length >= 4 ? 3 : 2);
  const hens = Array.from({ length: henCount }, (_, i) => ({ id: `h${i}`, eggs: [] }));
  eggs.forEach((color, i) => hens[i % henCount].eggs.push({ id: `e${i}`, color }));
  const total = eggs.length;
  const cards = level === 2 ? numberCards(total, rng) : null;
  return { kind: 'eggs', hens, ask, total, cards };
}
/** 3 thẻ số khác nhau trong 1–5, có đúng một thẻ là `n`. */
export function numberCards(n, rng = Math.random) {
  const others = shuffle([1, 2, 3, 4, 5].filter((x) => x !== n), rng).slice(0, 2);
  return shuffle([n, ...others], rng);
}

/**
 * Ca C — hái quả: { kind: 'pick', apples: [{ id, color, size }], ask: { color, size, count } }.
 * `count` = số quả phải hái (mức 1–2: mọi quả màu đó; mức 3: đúng `count` quả to màu đó).
 */
export function makePickCase(level, { rng = Math.random } = {}) {
  let apples;
  let ask;
  if (level <= 2) {
    const colors = level <= 1 ? ['red', 'green'] : shuffle(APPLE_COLORS, rng);
    const color = pick(colors, rng);
    const need = randInt(2, 3, rng);
    const total = randInt(Math.max(4, need + 1), 5, rng);
    const others = colors.filter((c) => c !== color);
    const rest = Array.from({ length: total - need }, (_, i) => others[i % others.length]);
    apples = shuffle([...Array(need).fill(color), ...rest], rng).map((c, i) => ({ id: `a${i}`, color: c, size: 'big' }));
    ask = { color, size: null, count: need };
  } else {
    const [color, other] = shuffle(APPLE_COLORS, rng);
    const list = [[color, 'big'], [color, 'big'], [color, 'small'], [other, 'big'], [pick([color, other], rng), 'small']];
    apples = shuffle(list, rng).map(([c, size], i) => ({ id: `a${i}`, color: c, size }));
    ask = { color, size: 'big', count: 2 };
  }
  return { kind: 'pick', apples, ask };
}
/** Quả khớp yêu cầu hái. */
export const pickMatches = (c) => c.apples.filter((a) => a.color === c.ask.color && (!c.ask.size || a.size === c.ask.size));
/** Trứng khớp yêu cầu (mức 3) — mức 1–2: mọi quả. */
export const eggMatches = (c) => c.hens.flatMap((h) => h.eggs).filter((e) => !c.ask || e.color === c.ask.color);

/** Bất biến của một ca (SPEC-jobs3 mục 2.2). */
export function caseOk(c, level) {
  if (c.kind === 'feed') {
    const food = ANIMAL_BY_ID.get(c.animal).food;
    if (c.tray.length !== 3 || new Set(c.tray).size !== 3 || c.tray.filter((f) => f === food).length !== 1) return false;
    if (level <= 2 && HAY_GRASS.every((f) => c.tray.includes(f))) return false;
    if (level >= 3) {
      if (!c.doors || new Set(c.doors).size !== 3 || !c.doors.includes(c.animal)) return false;
      if (new Set(c.doors.map((id) => ANIMAL_BY_ID.get(id).says)).size !== 3) return false;
    }
    return true;
  }
  if (c.kind === 'eggs') {
    const all = c.hens.flatMap((h) => h.eggs);
    if (all.length !== c.total || all.length < 1 || all.length > 5) return false;
    if (c.hens.some((h) => h.eggs.length < 1 || h.eggs.length > 2)) return false;
    if (c.ask) {
      const match = eggMatches(c).length;
      if (match < c.ask.count || all.length - match < 1 || c.ask.count < 1 || c.ask.count > 3) return false;
    }
    if (c.cards && (new Set(c.cards).size !== 3 || !c.cards.includes(c.total) || c.cards.some((n) => n < 1 || n > 5))) return false;
    return true;
  }
  if (c.kind === 'pick') {
    const m = pickMatches(c).length;
    if (c.apples.length > 5 || m !== c.ask.count || c.apples.length - m < 1) return false;
    if (c.ask.size && !c.apples.some((a) => a.color === c.ask.color && a.size !== c.ask.size)) return false;
    return c.ask.count <= 5;
  }
  return false;
}
/** Số thao tác con của bé trong ca (không tính chạm gà để gà đứng dậy — khám phá). */
export const caseActions = (c) => (c.kind === 'feed' ? (c.doors ? 2 : 1) : c.kind === 'eggs' ? (c.ask ? c.ask.count : c.total) + (c.cards ? 1 : 0) : c.ask.count);

/**
 * Kế hoạch một lượt (SPEC-jobs3 mục 4.4): mức 1 A + B + A, mức 2 A + B + C xáo, mức 3 A (cửa chuồng) + B + C.
 * Con vật ưu tiên ít gặp (`seen`), ba ca A khác con vật.
 */
export function planRound(level, { rng = Math.random, seen = {} } = {}) {
  const make = () => {
    const animals = leastSeen(FARM_ANIMALS.map((a) => a.id), seen, rng);
    const kinds = level <= 1 ? ['feed', 'eggs', 'feed'] : level === 2 ? shuffle(['feed', 'eggs', 'pick'], rng) : ['feed', 'eggs', 'pick'];
    let a = 0;
    const cases = kinds.map((k) => (k === 'feed' ? makeFeedCase(level, animals[a++], { rng }) : k === 'eggs' ? makeEggsCase(level, { rng }) : makePickCase(level, { rng })));
    return { cases };
  };
  const ok = (p) => p.cases.length === CASES_PER_ROUND && p.cases.every((c) => caseOk(c, level) && caseActions(c) <= 5)
    && new Set(p.cases.filter((c) => c.kind === 'feed').map((c) => c.animal)).size === p.cases.filter((c) => c.kind === 'feed').length;
  return planChecked(make, ok, () => fallbackPlan(level));
}
/** Kế hoạch cố định của mức (khi bốc 50 lần vẫn không đạt — không xảy ra trong thực tế). */
export function fallbackPlan(level) {
  const feed = (animal, tray, doors = null) => ({ kind: 'feed', animal, tray, doors });
  const eggs = {
    kind: 'eggs', hens: [{ id: 'h0', eggs: [{ id: 'e0', color: 'white' }, { id: 'e2', color: level >= 3 ? 'brown' : 'white' }] }, { id: 'h1', eggs: [{ id: 'e1', color: 'white' }] }],
    ask: level >= 3 ? { color: 'white', count: 2 } : null, total: 3, cards: level === 2 ? [2, 3, 4] : null,
  };
  const pickCase = level >= 3
    ? { kind: 'pick', apples: [{ id: 'a0', color: 'red', size: 'big' }, { id: 'a1', color: 'green', size: 'big' }, { id: 'a2', color: 'red', size: 'big' }, { id: 'a3', color: 'red', size: 'small' }], ask: { color: 'red', size: 'big', count: 2 } }
    : { kind: 'pick', apples: [{ id: 'a0', color: 'red', size: 'big' }, { id: 'a1', color: 'green', size: 'big' }, { id: 'a2', color: 'red', size: 'big' }, { id: 'a3', color: 'green', size: 'big' }], ask: { color: 'red', size: null, count: 2 } };
  const doors = level >= 3 ? ['cow', 'sheep', 'duck'] : null;
  if (level <= 1) return { cases: [feed('cow', ['hay', 'carrot', 'corn']), eggs, feed('pig', ['apple', 'seeds', 'carrot'])] };
  return { cases: [feed('cow', ['hay', 'carrot', 'corn'], doors), eggs, pickCase] };
}

// ---------- Câu nói ([en, vi]) ----------
export const MORNING_LINE = ['Good morning, farm!', 'Chào buổi sáng, nông trại!'];
export const HUNGRY_ASK_LINE = ["Who's hungry?", 'Bạn nào đói nhỉ?'];
export const NOT_ME_LINE = ['Not me!', 'Không phải tớ!'];
export const YUMMY_LINE = ['Yummy! Thank you!', 'Ngon quá! Cảm ơn bạn!'];
export const EGGS_INTRO_LINE = ["Let's find the eggs!", 'Mình đi tìm trứng nào!'];
export const HOW_MANY_LINE = ['How many eggs?', 'Có mấy quả trứng?'];
export const ENOUGH_LINE = ["That's enough!", 'Đủ rồi!'];
export const GOOD_JOB_LINE = ['Good job!', 'Giỏi lắm!'];
export const CLUCK_LINE = ['Cluck!', 'Cục tác!'];
export const hungryLine = (animal) => [`The ${ANIMAL_BY_ID.get(animal).name} is hungry!`, `${cap(ANIMAL_BY_ID.get(animal).vi)} đói rồi!`];
/** Con vật xin ăn (mức 1–3 như nhau, 2 từ): "Hay, please!". */
export const foodAskLine = (animal) => {
  const f = FOODS[ANIMAL_BY_ID.get(animal).food];
  return [`${cap(f.name)}, please!`, `Cho tớ ${f.vi} nhé!`];
};
export const foodWrongLine = (animal, given) => {
  const f = FOODS[ANIMAL_BY_ID.get(animal).food];
  return [`${FOODS[given].that} ${cap(f.name)}, please!`, `Đó là ${FOODS[given].vi}. Cho tớ ${f.vi} nhé!`];
};
const eggWord = (n) => (n === 1 ? 'egg' : 'eggs');
/** Bác nông dân đếm trứng: "One egg!", "Two eggs!". */
export const eggCountLine = (n) => [`${cap(NUMBER_WORDS[n])} ${eggWord(n)}!`, `${n} quả trứng!`];
/** Mức 3: "Two brown eggs, please!". */
export const eggAskLine = (ask) => [`${cap(NUMBER_WORDS[ask.count])} ${ask.color} ${eggWord(ask.count)}, please!`, `Cho bác ${ask.count} quả trứng ${COLOR_VI[ask.color]} nhé!`];
export const eggWrongLine = (ask, color) => [`That's a ${color} egg. ${cap(ask.color)} eggs, please!`, `Đó là trứng ${COLOR_VI[color]}. Trứng ${COLOR_VI[ask.color]} cơ!`];
export const cardWrongLine = (n) => [`That's ${NUMBER_WORDS[n]}. Let's count again!`, `Đó là số ${n}. Mình đếm lại nhé!`];
/** Hái quả: mức 1–2 "Pick the red apples!", mức 3 "Pick two big red apples!". */
export const pickAskLine = (ask) => (ask.size
  ? [`Pick ${NUMBER_WORDS[ask.count]} ${ask.size} ${ask.color} apples!`, `Hái ${ask.count} quả táo ${ask.size === 'big' ? 'to' : 'nhỏ'} màu ${COLOR_VI[ask.color]} nhé!`]
  : [`Pick the ${ask.color} apples!`, `Hái những quả táo màu ${COLOR_VI[ask.color]} nhé!`]);
export function pickWrongLine(ask, apple) {
  if (ask.size && apple.color === ask.color) return [`That's a ${apple.size} apple. ${cap(ask.size)} ${ask.color} apples, please!`, `Quả này ${apple.size === 'big' ? 'to' : 'nhỏ'}. Hái quả ${ask.size === 'big' ? 'to' : 'nhỏ'} nhé!`];
  return [`That's a ${apple.color} apple. ${cap(ask.size ? `${ask.size} ${ask.color}` : ask.color)} apples, please!`, `Đó là táo ${COLOR_VI[apple.color]}. Táo ${COLOR_VI[ask.color]} cơ!`];
}
export const countLine = (n) => [`${cap(NUMBER_WORDS[n])}!`, `${n}!`];
/** Bác nông dân đọc tên thức ăn mới (lần đầu gặp trong lượt) khi khay hiện: "Hay! Corn! Carrot!". */
export const foodNamesLine = (ids) => [ids.map((f) => `${cap(FOODS[f].name)}!`).join(' '), ids.map((f) => `${cap(FOODS[f].vi)}!`).join(' ')];
