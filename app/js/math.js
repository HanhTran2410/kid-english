// Mục "Toán" (SPEC-math.md): so sánh to – nhỏ, nhiều – ít cho bé 3–5 tuổi. Dữ liệu bài, đồ vật, bộ sinh câu hỏi,
// câu Bông nói, sao và mức. Các hàm đều thuần (không phụ thuộc DOM), test được trong Node.

import { dayKey } from './text.js';
import { numberWord } from './numbers.js';

export const MATH_KIND = 'math';
export const MATH_ROUNDS = 6;
export const DEMO_STEPS = 3;
export const MAX_LEVEL = 3;
const MAX_STARS = 5;
const STARS_PER_DAY = 2; // mỗi bài tối đa +2 sao một ngày (mục 6.1)
const BONUS_FIRST = 5; // ≥ 5/6 câu đúng ngay → +1 sao nữa
const LEVEL_UP_FIRST = 4; // lượt có ≥ 4/6 câu đúng ngay mới được lên mức (mục 6.2)
const LEVEL_STARS = { 2: 2, 3: 4 };
const WEAK_MIN_ASKED = 3; // chỉ xét "kiểu hay sai" khi kiểu đó đã hỏi ≥ 3 lần (mục 6.3)
const MAX_SIDE = 4; // ≤ 4/6 câu đáp án cùng một bên
const MAX_SIDE_RUN = 3; // ≤ 3 câu liền đáp án cùng một bên
const MAX_TYPE_RUN = 2; // một kiểu câu không quá 2 lần liền
const MAX_PAIR = 2; // một cặp (đồ + cỡ / số lượng) không lặp quá 2 lần một lượt

/** Đồ vật của mục Toán (mục 7.2): mỗi đồ khai báo dùng được ở kiểu bài nào. */
export const MATH_ITEMS = [
  { id: 'apple', en: 'apple', plural: 'apples', vi: 'quả táo', emoji: '🍎', uses: ['size', 'count'] },
  { id: 'ball', en: 'ball', plural: 'balls', vi: 'quả bóng', emoji: '⚽', uses: ['size'] },
  { id: 'teddy', en: 'teddy bear', plural: 'teddy bears', vi: 'gấu bông', emoji: '🧸', uses: ['size'] },
  { id: 'star', en: 'star', plural: 'stars', vi: 'ngôi sao', emoji: '⭐', uses: ['size', 'count'] },
  { id: 'duck', en: 'duck', plural: 'ducks', vi: 'con vịt', emoji: '🦆', uses: ['size', 'count'] },
  { id: 'car', en: 'car', plural: 'cars', vi: 'cái xe', emoji: '🚗', uses: ['size'] },
  { id: 'strawberry', en: 'strawberry', plural: 'strawberries', vi: 'quả dâu', emoji: '🍓', uses: ['count'] },
  { id: 'cookie', en: 'cookie', plural: 'cookies', vi: 'bánh quy', emoji: '🍪', uses: ['count'] },
  // Chỉ dùng ở phần xem mẫu To – nhỏ ("The elephant is bigger than the mouse."), không hỏi trong lượt chơi.
  { id: 'elephant', en: 'elephant', plural: 'elephants', vi: 'con voi', emoji: '🐘', uses: ['demo'] },
  { id: 'mouse', en: 'mouse', plural: 'mice', vi: 'con chuột', emoji: '🐭', uses: ['demo'] },
];
export const MATH_ITEM = new Map(MATH_ITEMS.map((x) => [x.id, x]));

/** Bài có sẵn (đợt M-a: L1, L4). `builtin` là mã cố định (có tiền tố như các loại bài khác) để biết bài nào đã thêm và gắn tiến độ. */
export function builtInMathLessons() {
  return [
    {
      version: 2, kind: MATH_KIND, builtin: 'math-l1', title: 'Big and small', titleVi: 'To và nhỏ', topic: 'Math', emoji: '🍎',
      skill: 'size', rounds: MATH_ROUNDS, config: { dimension: 'size', itemIds: ['apple', 'ball', 'teddy', 'star', 'duck', 'car'] },
    },
    {
      version: 2, kind: MATH_KIND, builtin: 'math-l4', title: 'More or fewer', titleVi: 'Nhiều hay ít', topic: 'Math', emoji: '🍓',
      skill: 'count', rounds: MATH_ROUNDS, config: { itemIds: ['apple', 'strawberry', 'duck', 'star', 'cookie'], plates: 2 },
    },
  ];
}

export const isMathLesson = (lesson) => lesson?.kind === MATH_KIND;

/** Khóa tiến độ của bài: "math:l1" (gắn với mã bài, không với id bản ghi: xóa rồi thêm lại vẫn giữ sao). */
export const mathKey = (lesson) => `math:${String(lesson.builtin ?? lesson.id).toLowerCase().replace(/^math-/, '')}`;
export const isMathKey = (key) => String(key).startsWith('math:');

/** Đồ vật của bài dùng được cho kiểu bài `use` (mặc định: kiểu của bài). */
export function lessonItems(lesson, use = lesson.skill) {
  return (lesson.config?.itemIds ?? []).map((id) => MATH_ITEM.get(id)).filter((x) => x?.uses.includes(use));
}

// ---------- Kiểu câu và độ khó theo mức (mục 4.1, 4.4) ----------

const SIZE_TYPES = { 1: ['big'], 2: ['big', 'small'], 3: ['bigger', 'smaller'] };
const COUNT_TYPES = { 1: ['more'], 2: ['more', 'fewer'], 3: ['more', 'fewer', 'same'] };
/** Tỉ lệ cỡ cái to / cái nhỏ: [thấp nhất, cao nhất] theo mức. */
export const SIZE_RATIO = { 1: [2, 2.4], 2: [1.5, 1.8], 3: [1.3, 1.45] };
/** Số đồ mỗi đĩa và chênh lệch tối thiểu theo mức. */
export const COUNT_RANGE = { 1: { max: 5, diff: 3 }, 2: { max: 8, diff: 2 }, 3: { max: 10, diff: 1 } };
export const SCATTER_CELLS = 12; // mức 3: đồ rải trong lưới 4 × 3 ô, mỗi ô tối đa một đồ (không chồng nhau)

export const clampLevel = (level) => Math.min(MAX_LEVEL, Math.max(1, Math.round(Number(level) || 1)));
export const typesFor = (skill, level) => (skill === 'count' ? COUNT_TYPES : SIZE_TYPES)[clampLevel(level)];

function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const randInt = (lo, hi, rng) => lo + Math.floor(rng() * (hi - lo + 1));
const longestRun = (list) => {
  let best = 0;
  let run = 0;
  list.forEach((x, i) => {
    run = i && x === list[i - 1] ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
};

/**
 * Kiểu câu của 6 câu: chia đều các kiểu của mức; "the same" chỉ 1 câu; kiểu hay sai được thêm 1 câu
 * (lấy bớt của kiểu khác). Một kiểu không hỏi quá 2 lần liền (khi mức có từ 2 kiểu).
 */
export function pickTypes(types, n, rng, weak = null) {
  const quota = new Map(types.map((t) => [t, 0]));
  const spread = types.filter((t) => t !== 'same');
  if (types.includes('same')) quota.set('same', 1);
  let left = n - (quota.get('same') ?? 0);
  for (const t of shuffle(spread, rng)) quota.set(t, Math.floor(left / spread.length));
  left -= [...quota.values()].reduce((a, b) => a + b, 0) - (quota.get('same') ?? 0);
  for (const t of shuffle(spread, rng).slice(0, left)) quota.set(t, quota.get(t) + 1);
  if (weak && quota.has(weak) && types.length > 1) {
    const donor = [...quota].filter(([t, q]) => t !== weak && t !== 'same' && q > 1).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (donor) {
      quota.set(donor, quota.get(donor) - 1);
      quota.set(weak, quota.get(weak) + 1);
    }
  }
  const bag = [...quota].flatMap(([t, q]) => Array(q).fill(t));
  if (types.length < 2) return bag;
  for (let tries = 0; tries < 200; tries++) {
    const order = shuffle(bag, rng);
    if (longestRun(order) <= MAX_TYPE_RUN) return order;
  }
  return bag; // không xếp được (không xảy ra với 6 câu và ≥ 2 kiểu) — vẫn đủ câu
}

/** Bên của đáp án cho `n` câu: gần đều trái / phải, ≤ 4 cùng một bên, ≤ 3 câu liền cùng bên. */
export function pickSides(n, rng) {
  const half = Math.floor(n / 2);
  const bag = [...Array(half).fill('left'), ...Array(n - half).fill('right')];
  if (n % 2 && rng() < 0.5) bag[bag.length - 1] = 'left';
  for (let tries = 0; tries < 200; tries++) {
    const order = shuffle(bag, rng);
    if (longestRun(order) <= MAX_SIDE_RUN) return order;
  }
  return bag.map((_, i) => (i % 2 ? 'right' : 'left'));
}

/** Đồ vật cho từng câu: xoay vòng danh sách đã xáo, hai câu liền nhau không cùng đồ. */
function pickItems(items, n, rng) {
  const out = [];
  let pool = [];
  while (out.length < n) {
    if (!pool.length) pool = shuffle(items, rng);
    const k = pool.findIndex((x) => x.id !== out.at(-1)) ;
    const [item] = pool.splice(k < 0 ? 0 : k, 1);
    out.push(item);
  }
  return out;
}

const round2 = (x) => Math.round(x * 100) / 100;

/** Một câu To – nhỏ: cái to ở bên đáp án khi hỏi big / bigger, ở bên kia khi hỏi small / smaller. */
function sizeQuestion(type, level, item, side, rng) {
  const [lo, hi] = SIZE_RATIO[level];
  const ratio = round2(lo + rng() * (hi - lo));
  const bigSide = ['big', 'bigger'].includes(type) ? side : side === 'left' ? 'right' : 'left';
  const scale = (s) => ({ scale: s === bigSide ? ratio : 1 });
  return { type, level, item: item.id, left: scale('left'), right: scale('right'), answer: side };
}

/** Mức 3: các ô (0–11) để rải đồ, không trùng ô. */
const scatter = (count, rng) => shuffle([...Array(SCATTER_CELLS).keys()], rng).slice(0, count).sort((a, b) => a - b);

/** Một câu Nhiều – ít. */
function countQuestion(type, level, item, side, rng) {
  const { max, diff } = COUNT_RANGE[level];
  let left;
  let right;
  let ask = type;
  if (type === 'same') {
    const n = randInt(1, max, rng);
    left = n;
    right = n;
    ask = rng() < 0.5 ? 'more' : 'fewer'; // hai đĩa bằng nhau: Bông vẫn hỏi "more" / "fewer", đáp án là nút The same
  } else {
    const hi = randInt(1 + diff, max, rng);
    const lo = randInt(1, hi - diff, rng);
    const moreSide = type === 'more' ? side : side === 'left' ? 'right' : 'left';
    [left, right] = moreSide === 'left' ? [hi, lo] : [lo, hi];
  }
  const q = { type, ask, level, item: item.id, left: { count: left }, right: { count: right }, answer: type === 'same' ? 'same' : side };
  if (level >= 3) {
    q.left.cells = scatter(left, rng);
    q.right.cells = scatter(right, rng);
  }
  return q;
}

const pairKey = (q) => `${q.item}|${q.left.scale ?? q.left.count}|${q.right.scale ?? q.right.count}`;

/**
 * Sinh 6 câu cho một lượt (mục 4.7). Mỗi kiểu bài một bộ sinh: `size` (L1) và `count` (L4).
 * @param {{ rng?: () => number, weak?: string|null }} [options] weak: kiểu câu bé hay sai (mục 6.3)
 */
export function makeMathRound(lesson, level, { rng = Math.random, weak = null } = {}) {
  const lv = clampLevel(level);
  const n = lesson.rounds ?? MATH_ROUNDS;
  const types = pickTypes(typesFor(lesson.skill, lv), n, rng, weak);
  const sides = pickSides(types.filter((t) => t !== 'same').length, rng);
  const items = pickItems(lessonItems(lesson), n, rng);
  const make = lesson.skill === 'count' ? countQuestion : sizeQuestion;
  const used = new Map();
  let s = 0;
  return types.map((type, i) => {
    const side = type === 'same' ? null : sides[s++];
    let q;
    for (let tries = 0; tries < 30; tries++) {
      q = make(type, lv, items[i], side, rng);
      if ((used.get(pairKey(q)) ?? 0) < MAX_PAIR) break;
    }
    used.set(pairKey(q), (used.get(pairKey(q)) ?? 0) + 1);
    return q;
  });
}

// ---------- Câu Bông nói (Anh + Việt viết sẵn, ghép tên đồ) ----------

const other = (side) => (side === 'left' ? 'right' : 'left');

/** Câu hỏi. */
export function askLine(q) {
  const ASK = {
    big: ['Which one is big?', 'Cái nào to?'],
    small: ['Which one is small?', 'Cái nào nhỏ?'],
    bigger: ['Which one is bigger?', 'Cái nào to hơn?'],
    smaller: ['Which one is smaller?', 'Cái nào nhỏ hơn?'],
    more: ['Which plate has more?', 'Đĩa nào nhiều hơn?'],
    fewer: ['Which plate has fewer?', 'Đĩa nào ít hơn?'],
  };
  const [en, vi] = ASK[q.type === 'same' ? q.ask : q.type];
  return { en, vi };
}

/** Câu mẫu khi đúng (và khi hiện đáp án): nói về đồ bé chọn đúng trước (this), rồi tới đồ còn lại (that). */
export function answerLine(q) {
  const item = MATH_ITEM.get(q.item);
  switch (q.type) {
    case 'big': return { en: `This ${item.en} is big. That ${item.en} is small.`, vi: `${cap(item.vi)} này to. ${cap(item.vi)} kia nhỏ.` };
    case 'small': return { en: `This ${item.en} is small. That ${item.en} is big.`, vi: `${cap(item.vi)} này nhỏ. ${cap(item.vi)} kia to.` };
    case 'bigger': return { en: `This ${item.en} is bigger.`, vi: `${cap(item.vi)} này to hơn.` };
    case 'smaller': return { en: `This ${item.en} is smaller.`, vi: `${cap(item.vi)} này nhỏ hơn.` };
    case 'more': return { en: `This plate has more ${item.plural}.`, vi: `Đĩa này nhiều ${item.vi} hơn.` };
    case 'fewer': return { en: `This plate has fewer ${item.plural}.`, vi: `Đĩa này ít ${item.vi} hơn.` };
    default: return { en: 'They are the same!', vi: 'Hai đĩa bằng nhau!' };
  }
}

/** Câu mô tả trung tính về đồ bé chọn sai (sinh theo đúng đồ đã chọn). `picked`: 'left' | 'right' | 'same'. */
export function wrongLine(q, picked) {
  if (['big', 'small', 'bigger', 'smaller'].includes(q.type)) {
    const isBig = q[picked].scale > q[other(picked)].scale;
    if (q.level >= 3) return { en: `That one is ${isBig ? 'bigger' : 'smaller'}.`, vi: `Cái đó ${isBig ? 'to hơn' : 'nhỏ hơn'}.` };
    return { en: `That one is ${isBig ? 'big' : 'small'}.`, vi: `Cái đó ${isBig ? 'to' : 'nhỏ'}.` };
  }
  const l = q.left.count;
  const r = q.right.count;
  if (picked === 'same') {
    return { en: `Let's count! This plate has ${numberWord(l)}. That plate has ${numberWord(r)}.`, vi: `Mình đếm nhé! Đĩa này có ${l}. Đĩa kia có ${r}.` };
  }
  if (l === r) {
    return { en: `Let's count! This plate has ${numberWord(l)}. That plate has ${numberWord(r)}, too.`, vi: `Mình đếm nhé! Đĩa này có ${l}. Đĩa kia cũng có ${r}.` };
  }
  const more = q[picked].count > q[other(picked)].count;
  return { en: `That plate has ${more ? 'more' : 'fewer'}.`, vi: `Đĩa đó ${more ? 'nhiều hơn' : 'ít hơn'}.` };
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- Sao, mức, thống kê kiểu câu (mục 6) ----------

/**
 * Xong một lượt đủ 6 câu: +1 sao, +1 nữa nếu ≥ 5 câu đúng ngay; mỗi bài tối đa +2 sao / ngày; tối đa 5 sao;
 * không bao giờ trừ. Mức chỉ tăng ở cuối lượt, khi đủ sao VÀ lượt có ≥ 4 câu đúng ngay; mỗi lần một mức, không tự tụt.
 */
export function applyMathRound(rec, firstCount, now = Date.now()) {
  const today = dayKey(new Date(now));
  const starsToday = rec.starDay === today ? rec.starsToday ?? 0 : 0;
  const earned = 1 + (firstCount >= BONUS_FIRST ? 1 : 0);
  const add = Math.max(0, Math.min(earned, STARS_PER_DAY - starsToday, MAX_STARS - rec.mastery));
  const mastery = rec.mastery + add;
  let level = clampLevel(rec.level);
  if (level < MAX_LEVEL && mastery >= LEVEL_STARS[level + 1] && firstCount >= LEVEL_UP_FIRST) level++;
  return {
    ...rec, mastery, level, starDay: today, starsToday: starsToday + add,
    practiceCount: (rec.practiceCount ?? 0) + 1, lastPracticedAt: now,
  };
}

/** Ghi một câu vào thống kê kiểu câu: hỏi +1, đúng ngay +1 nếu có, sai cộng số lần chạm sai. */
export function addMathType(rec, type, { first = false, wrong = 0 } = {}) {
  const t = rec.types?.[type] ?? { asked: 0, first: 0, wrong: 0 };
  return { ...rec, types: { ...rec.types, [type]: { asked: t.asked + 1, first: t.first + (first ? 1 : 0), wrong: t.wrong + wrong } } };
}

/** Kiểu bé hay sai trong các kiểu của mức: tỉ lệ đúng ngay thấp nhất, chỉ xét kiểu đã hỏi ≥ 3 lần, chưa sai bao giờ thì không có. */
export function weakType(rec, types) {
  const stats = types.map((t) => [t, rec?.types?.[t]]).filter(([, s]) => s && s.asked >= WEAK_MIN_ASKED && s.first < s.asked);
  stats.sort((a, b) => a[1].first / a[1].asked - b[1].first / b[1].asked);
  return stats[0]?.[0] ?? null;
}

/** Tên kiểu câu cho bố mẹ. */
export const TYPE_VI = {
  big: 'cái to (big)', small: 'cái nhỏ (small)', bigger: 'to hơn (bigger)', smaller: 'nhỏ hơn (smaller)',
  more: 'nhiều hơn (more)', fewer: 'ít hơn (fewer)', same: 'bằng nhau (the same)',
};
