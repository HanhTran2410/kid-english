// Trò Ai kêu thế? (SPEC-sounds.md): Bông giả tiếng kêu ("Moo! Moo!"), hỏi "Who says moo?", bé chạm đúng con vật.
// Con vật dùng lại sticker của Dán tranh (cùng mã, cùng ảnh bố mẹ đã thay). Tiếng kêu đọc bằng giọng đọc của máy.

import { ITEM_BY_ID } from './sticker-scenes.js';

export const QUESTIONS_PER_ROUND = 5;
export const ROUNDS_TO_LEVEL_UP = 3;
/** Mức: số con vật để chọn, nhóm con vật được hỏi (con quen trước). */
export const LEVELS = {
  1: { choices: 2, pool: 6 },
  2: { choices: 3, pool: 10 },
  3: { choices: 4, pool: 15 },
};

/**
 * Con vật theo thứ tự quen → lạ (6 con đầu là mức 1). `says`: tiếng kêu (đọc trong câu "Who says moo?"),
 * `sound`: Bông giả tiếng kêu, `vi`: tên tiếng Việt (có "con").
 */
const RAW = [
  ['cow', 'con bò', 'moo', 'Moo! Moo!'],
  ['dog', 'con chó', 'woof', 'Woof! Woof!'],
  ['cat', 'con mèo', 'meow', 'Meow! Meow!'],
  ['duck', 'con vịt', 'quack', 'Quack! Quack!'],
  ['pig', 'con lợn', 'oink', 'Oink! Oink!'],
  ['sheep', 'con cừu', 'baa', 'Baa! Baa!'],
  ['chicken', 'con gà', 'cluck', 'Cluck! Cluck!'],
  ['horse', 'con ngựa', 'neigh', 'Neigh!'],
  ['bird', 'con chim', 'tweet', 'Tweet! Tweet!'],
  ['lion', 'con sư tử', 'roar', 'Roar!'],
  ['frog', 'con ếch', 'ribbit', 'Ribbit! Ribbit!'],
  ['monkey', 'con khỉ', 'ooh ooh', 'Ooh ooh! Aah aah!'],
  ['owl', 'con cú', 'hoot', 'Hoot! Hoot!'],
  ['bee', 'con ong', 'buzz', 'Buzz! Buzz!'],
  ['snake', 'con rắn', 'hiss', 'Hiss!'],
];
export const ANIMALS = RAW.map(([id, vi, says, sound]) => {
  const item = ITEM_BY_ID.get(id);
  return { id, name: item.name, emoji: item.emoji, vi, says, sound };
});
export const ANIMAL_BY_ID = new Map(ANIMALS.map((a) => [a.id, a]));

const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------- Câu nói ----------
export const INTRO_LINE = ["Listen! Who says that?", 'Nghe này! Con gì kêu thế nhỉ?'];
/** Phụ đề không nói tên con vật (không lộ đáp án). */
export const soundLine = (a) => [a.sound, '(Bông giả tiếng kêu)'];
export const whoLine = (a) => [`Who says ${a.says}?`, `Con gì kêu "${a.says}" nhỉ?`];
export const yesLine = (a) => [`Yes! The ${a.name} says ${a.says}!`, `Đúng rồi! ${capital(a.vi)} kêu "${a.says}"!`];
export const yourTurnLine = (a) => [`Can you say ${a.says}?`, `Con kêu "${a.says}" thử xem!`];
export const wrongLine = (a) => [`That's the ${a.name}! The ${a.name} says ${a.says}!`, `Đó là ${a.vi}! ${capital(a.vi)} kêu "${a.says}"!`];
/** Nhầm từ lần 3 trong cùng câu: câu ngắn, không đọc lại cả tràng. */
export const shortWrongLine = (a) => [`That's the ${a.name}!`, `Đó là ${a.vi}!`];
export const nameLine = (a) => [`The ${a.name}!`, capital(a.vi)];

// ---------- Câu hỏi ----------
/** Trong 5 câu, tối đa chừng này câu là con bé ít gặp nhất; còn lại chọn ngẫu nhiên (không dồn hết vào con lạ). */
export const LEAST_SEEN_PER_ROUND = 3;

/**
 * Câu hỏi của một lượt: `n` con đúng khác nhau trong nhóm của mức (gồm cả con của mức thấp hơn).
 * - Tối đa LEAST_SEEN_PER_ROUND con bé ít gặp nhất (`seen`: tên → số lần, bằng nhau thì ngẫu nhiên), còn lại ngẫu nhiên.
 * - Thứ tự câu xáo trộn. Mỗi câu: con đúng + (số lựa chọn − 1) con khác, không trùng nhau, xáo vị trí thẻ.
 * @returns {Array<{ answer: string, choices: string[] }>}
 */
export function roundQuestions(level, { seen = new Map(), rng = Math.random, n = QUESTIONS_PER_ROUND } = {}) {
  const { choices, pool } = LEVELS[level] ?? LEVELS[1];
  const group = ANIMALS.slice(0, pool);
  const bySeen = shuffle(group, rng).sort((a, b) => (seen.get(a.name) ?? 0) - (seen.get(b.name) ?? 0));
  const least = bySeen.slice(0, Math.min(LEAST_SEEN_PER_ROUND, n));
  const rest = shuffle(bySeen.slice(least.length), rng).slice(0, n - least.length);
  const answers = shuffle([...least, ...rest], rng);
  return answers.map((a) => ({
    answer: a.id,
    choices: shuffle([a, ...shuffle(group.filter((x) => x.id !== a.id), rng).slice(0, choices - 1)], rng).map((x) => x.id),
  }));
}

// ---------- Mức ----------
export function cleanSoundsState(saved) {
  const s = saved && typeof saved === 'object' ? saved : {};
  const lock = [1, 2, 3].includes(s.lock) ? s.lock : null;
  return { level: lock ?? ([1, 2, 3].includes(s.level) ? s.level : 1), rounds: Number.isInteger(s.rounds) && s.rounds >= 0 ? s.rounds : 0, lock };
}

/**
 * Chơi xong một lượt (đủ 5 câu, bất kể nhầm bao nhiêu lần): đủ 3 lượt ở mức hiện tại thì lên một mức (tối đa 3), `rounds` về 0.
 * Bố mẹ khóa mức: giữ mức, không đếm lượt (mở khóa thì đếm lại từ 0). Áp dụng từ lượt sau.
 */
export function afterSoundsRound(state) {
  if (state.lock) return { ...state, level: state.lock, rounds: 0 };
  const rounds = state.rounds + 1;
  if (!state.lock && state.level < 3 && rounds >= ROUNDS_TO_LEVEL_UP) return { ...state, level: state.level + 1, rounds: 0 };
  return { ...state, rounds };
}
