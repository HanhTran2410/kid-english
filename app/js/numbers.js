// Mục "Số đếm" (SPEC-numbers.md): dữ liệu bài số có sẵn, câu Bông nói, các bước học, chọn câu hỏi cho trò chơi.
// Các hàm đều thuần (không phụ thuộc DOM), test được trong Node.

export const NUMBER_KIND = 'numbers';
export const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
export const MAX_NUMBER = 20;
export const TEN = 10; // từ 11 trở lên: 10 đồ vật đầu đóng thành "khung 10", Bông đếm tiếp từ 10 (SPEC-numbers mục 14)
export const PICK_FROM = 3; // bước "chọn nhóm đúng" bắt đầu từ số 3
export const GAME_ROUNDS = 8;
const MAX_ASKED = 2; // một số không bị hỏi quá 2 lần mỗi lượt chơi
const CONFUSABLE = [[6, 9]]; // bé dễ nhầm hình: không cho cùng làm thẻ

/** Đồ vật để đếm, mỗi số một đồ vật (SPEC-numbers mục 3). */
export const NUMBER_ITEMS = [
  { n: 1, item: 'balloon', items: 'balloons', emoji: '🎈' },
  { n: 2, item: 'crayon', items: 'crayons', emoji: '🖍️' },
  { n: 3, item: 'apple', items: 'apples', emoji: '🍎' },
  { n: 4, item: 'duck', items: 'ducks', emoji: '🦆' },
  { n: 5, item: 'star', items: 'stars', emoji: '⭐' },
  { n: 6, item: 'fish', items: 'fish', emoji: '🐟' },
  { n: 7, item: 'flower', items: 'flowers', emoji: '🌸' },
  { n: 8, item: 'car', items: 'cars', emoji: '🚗' },
  { n: 9, item: 'banana', items: 'bananas', emoji: '🍌' },
  { n: 10, item: 'teddy bear', items: 'teddy bears', emoji: '🧸' },
];

/** Đồ vật cho 11–20 (SPEC-numbers mục 14). */
/** Bài Đếm hình: mỗi số một hình học (hàng emoji trên thẻ bài là 🔺⚪🟥⭐). */
const SHAPE_ITEMS = ['🔺', '⚪', '🟥', '⭐', '❤️', '🔺', '⚪', '🟥', '⭐', '❤️']
  .map((emoji, i) => ({ n: i + 1, item: 'shape', items: 'shapes', emoji }));

export const TEEN_ITEMS = [
  { n: 11, item: 'bee', items: 'bees', emoji: '🐝' },
  { n: 12, item: 'egg', items: 'eggs', emoji: '🥚' },
  { n: 13, item: 'cookie', items: 'cookies', emoji: '🍪' },
  { n: 14, item: 'strawberry', items: 'strawberries', emoji: '🍓' },
  { n: 15, item: 'butterfly', items: 'butterflies', emoji: '🦋' },
  { n: 16, item: 'shell', items: 'shells', emoji: '🐚' },
  { n: 17, item: 'candy', items: 'candies', emoji: '🍬' },
  { n: 18, item: 'ball', items: 'balls', emoji: '⚽' },
  { n: 19, item: 'cupcake', items: 'cupcakes', emoji: '🧁' },
  { n: 20, item: 'leaf', items: 'leaves', emoji: '🍃' },
];

/**
 * Các bài số có sẵn, thêm tự động (SPEC-numbers mục 7, 14). `builtin` là mã cố định để biết bài nào đã thêm
 * (máy đã có bài 1–10 vẫn nhận được bài 11–20 mới).
 */
export function builtInNumberLessons() {
  const copy = (list) => list.map((x) => ({ ...x }));
  return [
    { version: 2, kind: NUMBER_KIND, mode: 'count', builtin: 'count-1-10', title: 'Count 1–10', titleVi: 'Đếm từ 1 đến 10', topic: 'Numbers', emoji: '🎈', numbers: copy(NUMBER_ITEMS) },
    { version: 2, kind: NUMBER_KIND, mode: 'game', builtin: 'game-1-10', title: 'Number game', titleVi: 'Chọn số', topic: 'Numbers', emoji: '🎯', numbers: copy(NUMBER_ITEMS), rounds: GAME_ROUNDS },
    { version: 2, kind: NUMBER_KIND, mode: 'count', builtin: 'count-11-20', title: 'Count 11–20', titleVi: 'Đếm từ 11 đến 20', topic: 'Numbers', emoji: '🐝', numbers: copy(TEEN_ITEMS) },
    { version: 2, kind: NUMBER_KIND, mode: 'game', builtin: 'game-11-20', title: 'Number game 11–20', titleVi: 'Chọn số 11–20', topic: 'Numbers', emoji: '🎯', numbers: copy(TEEN_ITEMS), rounds: GAME_ROUNDS },
    // Đếm hình (SPEC-shapes): số 1–10 dùng cho tiến độ; hàng emoji trên thẻ là các hình học.
    { version: 2, kind: NUMBER_KIND, mode: 'shapes', builtin: 'shapes-1', title: 'Count the shapes', titleVi: 'Đếm hình', topic: 'Numbers', emoji: '🔺', numbers: SHAPE_ITEMS.map((x) => ({ ...x })), rounds: 5 },
  ];
}

/** Khoảng số cùng "chục" với n: 1–10 hoặc 11–20 (thẻ sai, nhóm sai lấy trong khoảng này). */
export const decadeOf = (n) => (n > TEN ? [TEN + 1, 2 * TEN] : [1, TEN]);

export const isNumberLesson = (lesson) => lesson?.kind === NUMBER_KIND || Array.isArray(lesson?.numbers);

/** Khóa tiến độ của số, không lẫn với từ vựng ("three" trong bài từ vựng không bị ảnh hưởng). */
export const numberKey = (n) => `number:${n}`;
export const isNumberKey = (key) => String(key).startsWith('number:');

export const numberWord = (n) => NUMBER_WORDS[n] ?? String(n);
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** "One balloon", "Six fish", "Ten teddy bears". */
export function countPhrase(entry, n = entry.n) {
  return capital(`${numberWord(n)} ${n === 1 ? entry.item : entry.items}`);
}

/**
 * Kiểm tra bài số (khi khôi phục sao lưu / nhập bài). Lỗi nặng từ chối, lỗi nhẹ tự sửa.
 * @returns {{ ok: boolean, lesson: object|null, errors: string[] }}
 */
export function validateNumberLesson(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object') return { ok: false, lesson: null, errors: ['Bài số không hợp lệ.'] };
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) errors.push('Thiếu tên bài.');
  const seen = new Set();
  const numbers = [];
  for (const x of Array.isArray(raw.numbers) ? raw.numbers : []) {
    const n = Number(x?.n);
    if (!Number.isInteger(n) || n < 1 || n > MAX_NUMBER || seen.has(n) || !x.emoji || !x.item) continue;
    seen.add(n);
    const item = String(x.item).trim();
    numbers.push({ n, item, items: String(x.items ?? '').trim() || `${item}s`, emoji: String(x.emoji) });
  }
  numbers.sort((a, b) => a.n - b.n);
  if (!numbers.length) errors.push('Bài số không có số nào.');
  if (errors.length) return { ok: false, lesson: null, errors };
  const mode = ['game', 'shapes'].includes(raw.mode) ? raw.mode : 'count';
  const lesson = { ...raw, kind: NUMBER_KIND, mode, title, numbers };
  if (mode !== 'count') lesson.rounds = Math.min(20, Math.max(1, Number(raw.rounds) || GAME_ROUNDS));
  return { ok: true, lesson, errors };
}

/** Các bước của bài đếm: với từng số: xem Bông đếm → bé chạm đếm → (từ số 3) chọn nhóm đúng. */
export function buildCountSteps(lesson) {
  const steps = [];
  for (const [index, x] of lesson.numbers.entries()) {
    steps.push({ stage: 'count', index }, { stage: 'tap', index });
    if (x.n >= PICK_FROM) steps.push({ stage: 'group', index });
  }
  return steps;
}

/**
 * Vị trí đồ vật: hàng tối đa 5 cái (6–10 thành 2 hàng: 5 + phần còn lại).
 * Từ 11 trở lên: khung 10 (2 hàng × 5) + phần thêm xếp theo hàng này (`itemRows(n - 10)`).
 */
export function itemRows(n) {
  return n <= 5 ? [n] : [5, n - 5];
}

function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Số lượng của nhóm sai ở bước "chọn nhóm đúng": chênh với n ít nhất 2 để bé phân biệt được bằng mắt,
 * cùng chục với n (1–10 hoặc 11–20).
 */
export function groupDistractor(n, rng = Math.random, max = MAX_NUMBER) {
  const [lo, hi] = decadeOf(n);
  const options = [];
  for (let m = lo; m <= Math.min(hi, max); m++) if (Math.abs(m - n) >= 2) options.push(m);
  return options[Math.floor(rng() * options.length)];
}

const confusable = (a, b) => CONFUSABLE.some(([x, y]) => (a === x && b === y) || (a === y && b === x));

/**
 * 3 thẻ chữ số cho trò chơi: số đúng + 2 số khác, không trùng, không có cặp dễ nhầm (6 và 9).
 * Thẻ sai lấy cùng chục với n (1–10 hoặc 11–20).
 * @param {{ allowHigh?: boolean, count?: number }} options allowHigh=false: thẻ sai của số 1–10 chỉ lấy từ 1–5
 */
export function numberChoices(n, rng = Math.random, { allowHigh = true, count = 3, max = MAX_NUMBER } = {}) {
  const [lo, hi] = decadeOf(n);
  const top = Math.min(hi, max, !allowHigh && n <= TEN ? 5 : hi);
  const pool = shuffle(Array.from({ length: Math.max(0, top - lo + 1) }, (_, i) => lo + i).filter((m) => m !== n), rng);
  const chosen = [n];
  for (const m of pool) {
    if (chosen.length >= count) break;
    if (chosen.some((c) => confusable(c, m))) continue;
    chosen.push(m);
  }
  return shuffle(chosen, rng);
}

/**
 * Câu hỏi cho một lượt chơi "Chọn số" (SPEC-numbers mục 5): một nửa số dễ (nửa nhỏ, ví dụ 1–5), một nửa số khó (nửa lớn);
 * trong mỗi nhóm ưu tiên số bé ít sao; không số nào bị hỏi quá 2 lần; xen kẽ 2 kiểu câu.
 * @param {number[]} available các số có trong bài
 * @param {Map<number, number>} mastery số sao của từng số
 * @returns {{ n: number, type: 'find'|'count' }[]}
 */
export function buildGameRounds(available, mastery = new Map(), { rounds = GAME_ROUNDS, rng = Math.random } = {}) {
  const weakestFirst = (list) => shuffle(list, rng).sort((a, b) => (mastery.get(a) ?? 0) - (mastery.get(b) ?? 0));
  // Nửa dễ = nửa số nhỏ của bài (1–5 ở bài 1–10, 11–15 ở bài 11–20).
  const sorted = [...available].sort((a, b) => a - b);
  const mid = sorted[Math.ceil(sorted.length / 2) - 1];
  const easy = weakestFirst(available.filter((n) => n <= mid));
  const hard = weakestFirst(available.filter((n) => n > mid));
  const picked = [];
  const count = new Map();
  const asked = (m) => count.get(m) ?? 0;
  // Lấy số được hỏi ít nhất trong lượt; bằng nhau thì số ít sao hơn (danh sách đã xếp sẵn).
  const take = (list) => {
    const usable = list.filter((m) => asked(m) < MAX_ASKED);
    if (!usable.length) return false;
    const least = Math.min(...usable.map(asked));
    const n = usable.find((m) => asked(m) === least);
    count.set(n, asked(n) + 1);
    picked.push(n);
    return true;
  };
  for (let i = 0; picked.length < rounds && i < rounds * 2; i++) {
    const first = i % 2 === 0 ? easy : hard;
    const second = first === easy ? hard : easy;
    if (!take(first) && !take(second)) break;
  }
  // Không để một số bị hỏi 2 lần liền nhau.
  let order = shuffle(picked, rng);
  for (let tries = 0; tries < 20 && order.some((n, i) => i && order[i - 1] === n); tries++) order = shuffle(picked, rng);
  return order.map((n, i) => ({ n, type: i % 2 === 0 ? 'find' : 'count' }));
}
