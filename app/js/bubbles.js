// Trò Bắt bong bóng (SPEC-bubbles.md): bong bóng bay lên, Bông nói "Pop the red one!" / "Pop number three!" /
// "Pop the cat!", bé chạm cho vỡ. Chạm nhầm cũng vỡ (vui tay), Bông nói tên nó — không trừ gì.

import { COLORS } from './coloring.js';

export const TARGETS_PER_ROUND = 8;
export const ROUNDS_TO_LEVEL_UP = 3;
export const MODES = ['colors', 'numbers', 'words'];
/**
 * Mức: số loại bong bóng cùng lúc (màu / số / từ), tốc độ bay (giây đi hết màn), số bong bóng tối đa trên màn.
 * Số: mức 1 chỉ 1–5.
 */
export const LEVELS = {
  1: { kinds: 3, riseS: 9, maxOnScreen: 5, numberMax: 5 },
  2: { kinds: 4, riseS: 8, maxOnScreen: 6, numberMax: 10 },
  3: { kinds: 6, riseS: 7, maxOnScreen: 7, numberMax: 10 },
};
/** Tỉ lệ bong bóng mới là bong bóng cần bắt (luôn có ít nhất một trên màn). */
export const TARGET_SHARE = 0.3;

export const NUMBER_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const NUMBER_VI = ['một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'];
/** Màu bong bóng: 7 màu tươi của hộp màu Tô màu (không có nâu / đen / trắng). */
export const BUBBLE_COLORS = COLORS.filter((c) => ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'].includes(c.id));

const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Các "thứ" có thể nằm trong bong bóng của một chế độ.
 * - colors: { key: 'red', en: 'red', vi: 'đỏ', hex }
 * - numbers: { key: '3', en: 'three', vi: 'ba', n: 3 }
 * - words: { key: 'cat', en: 'cat', vi: 'con mèo', emoji } (từ có emoji trong các bài từ vựng)
 * @param {Array<{ en, vi, emoji }>} words từ của các bài (chế độ words)
 */
export function itemsFor(mode, level, words = []) {
  if (mode === 'colors') return BUBBLE_COLORS.map((c) => ({ key: c.id, en: c.en, vi: c.vi, hex: c.hex }));
  if (mode === 'numbers') {
    const max = (LEVELS[level] ?? LEVELS[1]).numberMax;
    return NUMBER_WORDS.slice(0, max).map((en, i) => ({ key: String(i + 1), en, vi: NUMBER_VI[i], n: i + 1 }));
  }
  const seen = new Set();
  return words.filter((w) => {
    const key = String(w?.en ?? '').trim().toLowerCase();
    if (!key || !w.emoji || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((w) => ({ key: String(w.en).trim().toLowerCase(), en: String(w.en).trim(), vi: w.vi ?? '', emoji: w.emoji }));
}

/** Từ để bắt ở chế độ từ: cần ít nhất chừng này từ có emoji. */
export const MIN_WORDS = 4;

/**
 * Các loại dùng trong một lượt: `kinds` thứ khác nhau (ưu tiên thứ bé ít gặp — `seen` key tiến độ → số lần),
 * và thứ tự cần bắt (mỗi thứ được bắt ít nhất một lần, không bắt cùng thứ hai lần liền).
 * @returns {{ kinds: object[], targets: string[] }}
 */
export function roundPlan(items, level, { seen = new Map(), rng = Math.random, n = TARGETS_PER_ROUND, progressKey = (it) => it.key } = {}) {
  const count = Math.min((LEVELS[level] ?? LEVELS[1]).kinds, items.length);
  const kinds = shuffle(items, rng).sort((a, b) => (seen.get(progressKey(a)) ?? 0) - (seen.get(progressKey(b)) ?? 0)).slice(0, count);
  const targets = [];
  while (targets.length < n) {
    for (const k of shuffle(kinds, rng)) {
      if (targets.length >= n) break;
      if (targets.at(-1) === k.key) continue; // không lặp liền nhau
      targets.push(k.key);
    }
    if (kinds.length < 2) break;
  }
  return { kinds, targets };
}

/** Trên màn có tối đa chừng này quả cần bắt cùng lúc (nhiều hơn thì quá dễ). */
export const MAX_TARGETS_ON_SCREEN = 2;

/**
 * Bong bóng mới: là thứ cần bắt nếu trên màn chưa có (luôn bắt được); đã có MAX_TARGETS_ON_SCREEN quả thì là thứ khác;
 * còn lại theo tỉ lệ TARGET_SHARE. Bong bóng khác lấy từ các loại của lượt, khác thứ cần bắt.
 */
export function nextBubble(kinds, target, onScreen, rng = Math.random) {
  const want = kinds.find((k) => k.key === target);
  const others = kinds.filter((k) => k.key !== target);
  const shown = onScreen.filter((k) => k === target).length;
  if (!shown || !others.length) return want;
  if (shown < MAX_TARGETS_ON_SCREEN && rng() < TARGET_SHARE) return want;
  return others[Math.floor(rng() * others.length)];
}

// ---------- Câu nói ----------
export const INTRO_LINE = ["Let's pop the bubbles!", 'Mình bắt bong bóng nào!'];
/** "Pop the red one!" / "Pop number three!" / "Pop the cat!" */
export function popLine(mode, it) {
  if (mode === 'colors') return [`Pop the ${it.en} one!`, `Bắt quả màu ${it.vi}!`];
  if (mode === 'numbers') return [`Pop number ${it.en}!`, `Bắt số ${it.vi}!`];
  return [`Pop the ${it.en}!`, `Bắt ${it.vi || it.en}!`];
}
export function yesLine(mode, it) {
  if (mode === 'colors') return [`Yes! ${capital(it.en)}!`, `Đúng rồi! Màu ${it.vi}!`];
  if (mode === 'numbers') return [`Yes! Number ${it.en}!`, `Đúng rồi! Số ${it.vi}!`];
  return [`Yes! The ${it.en}!`, `Đúng rồi! ${capital(it.vi || it.en)}!`];
}
/** Chạm nhầm: chỉ nói tên thứ vừa vỡ ("Blue!"). */
export function nameLine(mode, it) {
  if (mode === 'colors') return [`${capital(it.en)}!`, `Màu ${it.vi}!`];
  if (mode === 'numbers') return [`${capital(it.en)}!`, `Số ${it.vi}!`];
  return [`${capital(it.en)}!`, capital(it.vi || it.en)];
}
export const DONE_LINE = ['Pop, pop, pop! Great job!', 'Bụp bụp bụp! Giỏi quá!'];

/** Khóa tiến độ (đã gặp) của một thứ: từ của bài, màu theo tên màu, số theo `number:n` (như bài số). */
export const progressKeyOf = (mode, it) => (mode === 'numbers' ? `number:${it.n}` : it.en.toLowerCase());

// ---------- Mức ----------
export function cleanBubblesState(saved) {
  const s = saved && typeof saved === 'object' ? saved : {};
  const lock = [1, 2, 3].includes(s.lock) ? s.lock : null;
  return { level: lock ?? ([1, 2, 3].includes(s.level) ? s.level : 1), rounds: Number.isInteger(s.rounds) && s.rounds >= 0 ? s.rounds : 0, lock };
}

/** Chơi xong một lượt: đủ 3 lượt thì lên mức (tối đa 3), trừ khi bố mẹ khóa. */
export function afterBubblesRound(state) {
  const rounds = state.rounds + 1;
  if (!state.lock && state.level < 3 && rounds >= ROUNDS_TO_LEVEL_UP) return { ...state, level: state.level + 1, rounds: 0 };
  return { ...state, rounds };
}
