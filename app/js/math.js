// Mục "Toán" (SPEC-math.md): so sánh to – nhỏ, cao – thấp, dài – ngắn, nhiều – ít, nặng – nhẹ, xếp từ nhỏ đến to
// cho bé 3–5 tuổi. Dữ liệu bài, đồ vật, bộ sinh câu hỏi, câu Bông nói, sao và mức.
// Các hàm đều thuần (không phụ thuộc DOM), test được trong Node.

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
const MAX_SIDE_RUN = 3; // ≤ 3 câu liền đáp án cùng một bên (và gần đều trái / phải → ≤ 4/6 cùng một bên)
const MAX_TYPE_RUN = 2; // một kiểu câu không quá 2 lần liền
const MAX_PAIR = 2; // một cặp (đồ + cỡ / số lượng) không lặp quá 2 lần một lượt
/** Cỡ ba đồ của bài Nhỏ – vừa – to (mục 4.5): small : medium : big. */
export const ORDER_SCALES = [1, 1.5, 2.2];
export const ORDER_WORDS = ['small', 'medium', 'big'];
const ORDER_VI = ['nhỏ', 'vừa', 'to'];

/**
 * Đồ vật của mục Toán (mục 7.2): mỗi đồ khai báo dùng được ở kiểu bài nào (`uses`).
 * `svg`: hình vẽ kéo giãn được (cao – thấp, dài – ngắn); `weight`: hạng nặng (1 nhẹ … 5 nặng) cho bài nặng – nhẹ.
 */
export const MATH_ITEMS = [
  { id: 'apple', en: 'apple', plural: 'apples', vi: 'quả táo', emoji: '🍎', uses: ['size', 'count', 'order'] },
  { id: 'ball', en: 'ball', plural: 'balls', vi: 'quả bóng', emoji: '⚽', uses: ['size', 'order'] },
  { id: 'teddy', en: 'teddy bear', plural: 'teddy bears', vi: 'gấu bông', emoji: '🧸', uses: ['size', 'order'] },
  { id: 'star', en: 'star', plural: 'stars', vi: 'ngôi sao', emoji: '⭐', uses: ['size', 'count', 'order'] },
  { id: 'duck', en: 'duck', plural: 'ducks', vi: 'con vịt', emoji: '🦆', uses: ['size', 'count', 'order'] },
  { id: 'car', en: 'car', plural: 'cars', vi: 'cái xe', emoji: '🚗', uses: ['size', 'order'] },
  { id: 'strawberry', en: 'strawberry', plural: 'strawberries', vi: 'quả dâu', emoji: '🍓', uses: ['count', 'weight'], weight: 1 },
  { id: 'cookie', en: 'cookie', plural: 'cookies', vi: 'bánh quy', emoji: '🍪', uses: ['count'] },
  // Cao – thấp: chung đường đáy; dài – ngắn: thẳng đầu trái. Chỉ kéo giãn thân, phần đầu / ngọn giữ nguyên.
  { id: 'tree', en: 'tree', plural: 'trees', vi: 'cái cây', emoji: '🌳', svg: 'tree', uses: ['tall'] },
  { id: 'flower', en: 'flower', plural: 'flowers', vi: 'bông hoa', emoji: '🌻', svg: 'flower', uses: ['tall'] },
  { id: 'candle', en: 'candle', plural: 'candles', vi: 'cây nến', emoji: '🕯️', svg: 'candle', uses: ['tall'] },
  { id: 'pencil', en: 'pencil', plural: 'pencils', vi: 'bút chì', emoji: '✏️', svg: 'pencil', uses: ['long'] },
  { id: 'snake', en: 'snake', plural: 'snakes', vi: 'con rắn', emoji: '🐍', svg: 'snake', uses: ['long'] },
  { id: 'train', en: 'train', plural: 'trains', vi: 'đoàn tàu', emoji: '🚂', svg: 'train', uses: ['long'] },
  // Nặng – nhẹ: chỉ ghép đồ rất nặng (≥ 4) với đồ rất nhẹ (1) — cặp ai cũng biết (mục 4.6).
  { id: 'elephant', en: 'elephant', plural: 'elephants', vi: 'con voi', emoji: '🐘', uses: ['weight', 'demo'], weight: 5 },
  { id: 'watermelon', en: 'watermelon', plural: 'watermelons', vi: 'quả dưa hấu', emoji: '🍉', uses: ['weight'], weight: 4 },
  { id: 'pumpkin', en: 'pumpkin', plural: 'pumpkins', vi: 'quả bí ngô', emoji: '🎃', uses: ['weight'], weight: 4 },
  { id: 'balloon', en: 'balloon', plural: 'balloons', vi: 'quả bóng bay', emoji: '🎈', uses: ['weight'], weight: 1 },
  { id: 'leaf', en: 'leaf', plural: 'leaves', vi: 'chiếc lá', emoji: '🍃', uses: ['weight'], weight: 1 },
  { id: 'grape', en: 'grape', plural: 'grapes', vi: 'quả nho', emoji: '🍇', uses: ['weight'], weight: 1 },
  // Chỉ dùng ở phần xem mẫu, không hỏi trong lượt chơi.
  { id: 'mouse', en: 'mouse', plural: 'mice', vi: 'con chuột', emoji: '🐭', uses: ['demo'] },
  { id: 'giraffe', en: 'giraffe', plural: 'giraffes', vi: 'con hươu cao cổ', emoji: '🦒', uses: ['demo'] },
];
export const MATH_ITEM = new Map(MATH_ITEMS.map((x) => [x.id, x]));

// ---------- Ảnh đồ vật bằng AI (Góc bố mẹ → Ảnh Toán) ----------

/** Kho ảnh đồ vật của mục Toán (theo mã đồ). Đồ chưa có ảnh vẫn dùng emoji. */
export const MATH_ITEM_IMAGES = 'math:items';
/**
 * Cách vẽ từng đồ cho prompt ảnh lưới. Chỉ đồ dùng emoji mới thay bằng ảnh; cây / hoa / nến / bút chì / rắn / tàu là hình
 * vẽ kéo giãn thân (ảnh kéo giãn cả hình sẽ méo) nên không có ở đây.
 */
const MATH_DRAW = {
  apple: 'One shiny red apple with a small green leaf.',
  ball: 'One round colorful beach ball with red, yellow and blue stripes.',
  teddy: 'One cute brown teddy bear sitting and facing the viewer.',
  star: 'One bright yellow five-pointed star with a happy little smile.',
  duck: 'One yellow duck standing, side view facing right.',
  car: 'One small red toy car, side view facing right.',
  strawberry: 'One red strawberry with a green leafy top.',
  cookie: 'One round golden cookie with chocolate chips.',
  elephant: 'One friendly grey elephant standing, side view facing right, full body.',
  watermelon: 'One big whole green striped watermelon.',
  pumpkin: 'One big round orange pumpkin with a short green stem (no face).',
  balloon: 'One red balloon on a curly string.',
  leaf: 'One single green leaf.',
  grape: 'One single round purple grape with a tiny stem.',
  mouse: 'One small grey mouse sitting, side view facing left, full body.',
  giraffe: 'One tall yellow giraffe with brown spots, standing, full body.',
};
/** Đồ có ảnh lưới (thứ tự ô trong prompt): { id, en, vi, draw }. */
export const MATH_PICTURE_ITEMS = MATH_ITEMS.filter((x) => !x.svg && MATH_DRAW[x.id]).map((x) => ({ id: x.id, en: x.en, vi: x.vi, draw: MATH_DRAW[x.id] }));
/** Thêm vào prompt ảnh lưới: nền trắng để app tự cắt nền; chỉ vẽ một đồ, cùng một phong cách. */
export const MATH_ITEM_PROMPT_NOTE = [
  '',
  'MATH GAME RULES (the app cuts each picture out of its white background and shows it big, small, on plates and on a seesaw)',
  '- Draw ONLY the single object itself: no hands, no people, no plate, no table, no ground, no text, no numbers.',
  '- Every cell has the SAME cute flat cartoon style and a continuous thick dark outline all around the object.',
  '- The object fills most of its cell, centered, fully visible (never cropped).',
  '- Pure flat white (#FFFFFF) background: no shadow, no scenery, no frame.',
].join('\n');

const HEAVY_MIN = 4;
const LIGHT_MAX = 1;

const lesson = (builtin, title, titleVi, emoji, skill, config) => ({
  version: 2, kind: MATH_KIND, builtin, title, titleVi, topic: 'Math', emoji, skill, rounds: MATH_ROUNDS, config,
});

/**
 * Bài có sẵn (M-a: L1, L4; M-b: L2, L3, L5, L6). `builtin` là mã cố định (có tiền tố như các loại bài khác) để biết bài
 * nào đã thêm và gắn tiến độ.
 */
export function builtInMathLessons() {
  return [
    lesson('math-l1', 'Big and small', 'To và nhỏ', '🍎', 'size', { dimension: 'size', itemIds: ['apple', 'ball', 'teddy', 'star', 'duck', 'car'] }),
    lesson('math-l2', 'Tall and short', 'Cao và thấp', '🌳', 'size', { dimension: 'tall', itemIds: ['tree', 'flower', 'candle'] }),
    lesson('math-l3', 'Long and short', 'Dài và ngắn', '✏️', 'size', { dimension: 'long', itemIds: ['pencil', 'snake', 'train'] }),
    lesson('math-l4', 'More or fewer', 'Nhiều hay ít', '🍓', 'count', { itemIds: ['apple', 'strawberry', 'duck', 'star', 'cookie'], plates: 2 }),
    lesson('math-l5', 'Small, medium, big', 'Nhỏ, vừa, to', '🧸', 'order', { itemIds: ['teddy', 'apple', 'ball', 'star', 'duck', 'car'] }),
    lesson('math-l6', 'Heavy and light', 'Nặng và nhẹ', '🐘', 'weight', {
      itemIds: ['elephant', 'watermelon', 'pumpkin', 'balloon', 'leaf', 'grape', 'strawberry'],
    }),
  ];
}

export const isMathLesson = (lesson) => lesson?.kind === MATH_KIND;

/** Khóa tiến độ của bài: "math:l1" (gắn với mã bài, không với id bản ghi: xóa rồi thêm lại vẫn giữ sao). */
export const mathKey = (lesson) => `math:${String(lesson.builtin ?? lesson.id).toLowerCase().replace(/^math-/, '')}`;
export const isMathKey = (key) => String(key).startsWith('math:');

/** Kiểu bài để chọn đồ, kiểu câu và bộ sinh: size / tall / long (To – nhỏ, Cao – thấp, Dài – ngắn), count, order, weight. */
export const useOf = (lesson) => (lesson.skill === 'size' ? lesson.config?.dimension ?? 'size' : lesson.skill);

/** Đồ vật của bài dùng được cho kiểu bài `use` (mặc định: kiểu của bài). */
export function lessonItems(lesson, use = useOf(lesson)) {
  return (lesson.config?.itemIds ?? []).map((id) => MATH_ITEM.get(id)).filter((x) => x?.uses.includes(use));
}

// ---------- Kiểu câu và độ khó theo mức (mục 4.1, 4.4) ----------

/** Từ so sánh của từng chiều: [cái "hơn", cái "kém"] ở dạng gốc và dạng -er, kèm tiếng Việt. */
export const DIMS = {
  size: { pos: 'big', neg: 'small', posEr: 'bigger', negEr: 'smaller', vi: ['to', 'nhỏ'] },
  tall: { pos: 'tall', neg: 'short', posEr: 'taller', negEr: 'shorter', vi: ['cao', 'thấp'] },
  long: { pos: 'long', neg: 'short', posEr: 'longer', negEr: 'shorter', vi: ['dài', 'ngắn'] },
  weight: { pos: 'heavy', neg: 'light', posEr: 'heavier', negEr: 'lighter', vi: ['nặng', 'nhẹ'] },
};
const dimTypes = (d) => ({ 1: [d.pos], 2: [d.pos, d.neg], 3: [d.posEr, d.negEr] });
const TYPES = {
  ...Object.fromEntries(Object.entries(DIMS).map(([k, d]) => [k, dimTypes(d)])),
  count: { 1: ['more'], 2: ['more', 'fewer'], 3: ['more', 'fewer', 'same'] },
  order: { 1: ['order'], 2: ['order'], 3: ['order'] },
};
/** Kiểu câu hỏi về cái "hơn" (to / cao / dài / nặng): đáp án là cái đó. */
const POSITIVE = new Set(Object.values(DIMS).flatMap((d) => [d.pos, d.posEr]));
/** Tỉ lệ cỡ cái to / cái nhỏ: [thấp nhất, cao nhất] theo mức. */
export const SIZE_RATIO = { 1: [2, 2.4], 2: [1.5, 1.8], 3: [1.3, 1.45] };
/** Số đồ mỗi đĩa và chênh lệch tối thiểu theo mức. */
export const COUNT_RANGE = { 1: { max: 5, diff: 3 }, 2: { max: 8, diff: 2 }, 3: { max: 10, diff: 1 } };
export const SCATTER_CELLS = 12; // mức 3: đồ rải trong lưới 4 × 3 ô, mỗi ô tối đa một đồ (không chồng nhau)

export const clampLevel = (level) => Math.min(MAX_LEVEL, Math.max(1, Math.round(Number(level) || 1)));
/** Các kiểu câu của bài ở mức `level`. */
export const typesFor = (lesson, level) => TYPES[useOf(lesson)][clampLevel(level)];

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
const other = (side) => (side === 'left' ? 'right' : 'left');

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
    const k = pool.findIndex((x) => x.id !== out.at(-1)?.id);
    const [item] = pool.splice(k < 0 ? 0 : k, 1);
    out.push(item);
  }
  return out;
}

const round2 = (x) => Math.round(x * 100) / 100;

/** Một câu To – nhỏ / Cao – thấp / Dài – ngắn: cái "hơn" ở bên đáp án khi hỏi big / tall / long…, ở bên kia khi hỏi ngược lại. */
function sizeQuestion(dim) {
  return (type, level, item, side, rng) => {
    const [lo, hi] = SIZE_RATIO[level];
    const ratio = round2(lo + rng() * (hi - lo));
    const bigSide = POSITIVE.has(type) ? side : other(side);
    const scale = (s) => ({ scale: s === bigSide ? ratio : 1 });
    return { type, dim, level, item: item.id, left: scale('left'), right: scale('right'), answer: side };
  };
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
    const moreSide = type === 'more' ? side : other(side);
    [left, right] = moreSide === 'left' ? [hi, lo] : [lo, hi];
  }
  const q = { type, ask, level, item: item.id, left: { count: left }, right: { count: right }, answer: type === 'same' ? 'same' : side };
  if (level >= 3) {
    q.left.cells = scatter(left, rng);
    q.right.cells = scatter(right, rng);
  }
  return q;
}

/** Một câu Nhỏ – vừa – to: thứ tự 3 đồ trong khay (hạng cỡ 0 / 1 / 2), không bao giờ đã xếp sẵn đúng. */
function orderQuestion(type, level, item, _side, rng) {
  let tray;
  do tray = shuffle([0, 1, 2], rng); while (tray.join() === '0,1,2');
  return { type, level, item: item.id, tray, answer: 'order' };
}

/** Một câu Nặng – nhẹ: một đồ rất nặng và một đồ rất nhẹ trên bập bênh; bên nặng luôn chúi xuống. */
function weightQuestion(lesson, rng) {
  const items = lessonItems(lesson);
  const heavies = items.filter((x) => x.weight >= HEAVY_MIN);
  const lights = items.filter((x) => x.weight <= LIGHT_MAX);
  return (type, level, _item, side) => {
    const heavy = heavies[Math.floor(rng() * heavies.length)];
    const light = lights[Math.floor(rng() * lights.length)];
    const heavySide = POSITIVE.has(type) ? side : other(side);
    const at = (s) => ({ item: s === heavySide ? heavy.id : light.id });
    return { type, dim: 'weight', level, heavy: heavy.id, light: light.id, left: at('left'), right: at('right'), answer: side };
  };
}

const pairKey = (q) => (q.type === 'order' ? `${q.item}|${q.tray}`
  : q.dim === 'weight' ? `${q.left.item}|${q.right.item}`
    : `${q.item}|${q.left.scale ?? q.left.count}|${q.right.scale ?? q.right.count}`);

/**
 * Sinh 6 câu cho một lượt (mục 4.7). Mỗi kiểu bài một bộ sinh: `size` (L1–L3, theo chiều), `count` (L4),
 * `order` (L5), `weight` (L6).
 * @param {{ rng?: () => number, weak?: string|null }} [options] weak: kiểu câu bé hay sai (mục 6.3)
 */
export function makeMathRound(lesson, level, { rng = Math.random, weak = null } = {}) {
  const lv = clampLevel(level);
  const n = lesson.rounds ?? MATH_ROUNDS;
  const use = useOf(lesson);
  const types = pickTypes(typesFor(lesson, lv), n, rng, weak);
  const sided = types.filter((t) => t !== 'same' && t !== 'order');
  const sides = pickSides(sided.length, rng);
  const items = pickItems(lessonItems(lesson), n, rng);
  const make = use === 'count' ? countQuestion : use === 'order' ? orderQuestion : use === 'weight' ? weightQuestion(lesson, rng) : sizeQuestion(use);
  const used = new Map();
  let s = 0;
  return types.map((type, i) => {
    const side = type === 'same' || type === 'order' ? null : sides[s++];
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

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Câu hỏi. */
export function askLine(q) {
  if (q.type === 'order') return { en: 'Put them in order: small, medium, big!', vi: 'Xếp từ nhỏ đến to nhé: nhỏ, vừa, to!' };
  if (['more', 'fewer', 'same'].includes(q.type)) {
    const more = (q.type === 'same' ? q.ask : q.type) === 'more';
    return more ? { en: 'Which plate has more?', vi: 'Đĩa nào nhiều hơn?' } : { en: 'Which plate has fewer?', vi: 'Đĩa nào ít hơn?' };
  }
  const d = DIMS[q.dim ?? 'size'];
  const pos = POSITIVE.has(q.type);
  const er = q.type === d.posEr || q.type === d.negEr;
  return { en: `Which one is ${q.type}?`, vi: `Cái nào ${d.vi[pos ? 0 : 1]}${er ? ' hơn' : ''}?` };
}

/** Câu mẫu khi đúng (và khi hiện đáp án): nói về đồ bé chọn đúng trước (this), rồi tới đồ còn lại (that). */
export function answerLine(q) {
  if (q.type === 'order') return { en: 'Small, medium, big!', vi: 'Nhỏ, vừa, to!' };
  if (q.type === 'more' || q.type === 'fewer') {
    const item = MATH_ITEM.get(q.item);
    return q.type === 'more'
      ? { en: `This plate has more ${item.plural}.`, vi: `Đĩa này nhiều ${item.vi} hơn.` }
      : { en: `This plate has fewer ${item.plural}.`, vi: `Đĩa này ít ${item.vi} hơn.` };
  }
  if (q.type === 'same') return { en: 'They are the same!', vi: 'Hai đĩa bằng nhau!' };
  const d = DIMS[q.dim ?? 'size'];
  const pos = POSITIVE.has(q.type);
  const er = q.type === d.posEr || q.type === d.negEr;
  if (q.dim === 'weight') {
    const heavy = MATH_ITEM.get(q.heavy);
    const light = MATH_ITEM.get(q.light);
    if (er) {
      return pos ? { en: `The ${heavy.en} is heavier than the ${light.en}.`, vi: `${cap(heavy.vi)} nặng hơn ${light.vi}.` }
        : { en: `The ${light.en} is lighter than the ${heavy.en}.`, vi: `${cap(light.vi)} nhẹ hơn ${heavy.vi}.` };
    }
    const [a, b] = pos ? [[heavy, 'heavy', 'nặng'], [light, 'light', 'nhẹ']] : [[light, 'light', 'nhẹ'], [heavy, 'heavy', 'nặng']];
    return { en: `The ${a[0].en} is ${a[1]}. The ${b[0].en} is ${b[1]}.`, vi: `${cap(a[0].vi)} ${a[2]}. ${cap(b[0].vi)} ${b[2]}.` };
  }
  const item = MATH_ITEM.get(q.item);
  if (er) return { en: `This ${item.en} is ${q.type}.`, vi: `${cap(item.vi)} này ${d.vi[pos ? 0 : 1]} hơn.` };
  const [a, b] = pos ? [d.pos, d.neg] : [d.neg, d.pos];
  const [va, vb] = pos ? d.vi : [d.vi[1], d.vi[0]];
  return { en: `This ${item.en} is ${a}. That ${item.en} is ${b}.`, vi: `${cap(item.vi)} này ${va}. ${cap(item.vi)} kia ${vb}.` };
}

/**
 * Câu mô tả trung tính về đồ bé chọn sai (sinh theo đúng đồ đã chọn). `picked`: 'left' | 'right' | 'same';
 * bài Nhỏ – vừa – to: hạng cỡ (0 / 1 / 2) của đồ bé vừa thả nhầm chỗ.
 */
export function wrongLine(q, picked) {
  if (q.type === 'order') return { en: `That one is ${ORDER_WORDS[picked]}.`, vi: `Cái đó ${ORDER_VI[picked]}.` };
  if (q.dim || q.left?.scale != null) { // câu To – nhỏ lưu từ 0.66.0 (Học tiếp) chưa có `dim`
    const d = DIMS[q.dim ?? 'size'];
    if (q.dim === 'weight') {
      const id = q[picked].item;
      const heavy = id === q.heavy;
      const word = q.level >= 3 ? (heavy ? d.posEr : d.negEr) : heavy ? d.pos : d.neg;
      const vi = `${cap(MATH_ITEM.get(id).vi)} ${heavy ? 'nặng' : 'nhẹ'}${q.level >= 3 ? ' hơn' : ''}.`;
      return { en: `The ${MATH_ITEM.get(id).en} is ${word}.`, vi };
    }
    const isPos = q[picked].scale > q[other(picked)].scale;
    const word = q.level >= 3 ? (isPos ? d.posEr : d.negEr) : isPos ? d.pos : d.neg;
    return { en: `That one is ${word}.`, vi: `Cái đó ${d.vi[isPos ? 0 : 1]}${q.level >= 3 ? ' hơn' : ''}.` };
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
  tall: 'cái cao (tall)', short: 'cái thấp / ngắn (short)', taller: 'cao hơn (taller)', shorter: 'thấp / ngắn hơn (shorter)',
  long: 'cái dài (long)', longer: 'dài hơn (longer)',
  heavy: 'cái nặng (heavy)', light: 'cái nhẹ (light)', heavier: 'nặng hơn (heavier)', lighter: 'nhẹ hơn (lighter)',
  more: 'nhiều hơn (more)', fewer: 'ít hơn (fewer)', same: 'bằng nhau (the same)', order: 'xếp nhỏ – vừa – to',
};
