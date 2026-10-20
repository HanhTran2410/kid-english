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
export const nameLine = (a) => [`The ${a.name}!`, capital(a.vi)];

// ---------- Câu hỏi ----------
/**
 * Câu hỏi của một lượt: `n` con vật khác nhau trong nhóm của mức (ưu tiên con bé ít gặp: `seen` tên → số lần),
 * mỗi câu kèm các lựa chọn (con đúng + con khác, xáo thứ tự).
 * @returns {Array<{ answer: string, choices: string[] }>}
 */
export function roundQuestions(level, { seen = new Map(), rng = Math.random, n = QUESTIONS_PER_ROUND } = {}) {
  const { choices, pool } = LEVELS[level] ?? LEVELS[1];
  const group = ANIMALS.slice(0, pool);
  const answers = shuffle(group, rng).sort((a, b) => (seen.get(a.name) ?? 0) - (seen.get(b.name) ?? 0)).slice(0, n);
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

/** Chơi xong một lượt: đủ 3 lượt thì lên mức (tối đa 3), trừ khi bố mẹ khóa. Áp dụng từ lượt sau. */
export function afterSoundsRound(state) {
  const rounds = state.rounds + 1;
  if (!state.lock && state.level < 3 && rounds >= ROUNDS_TO_LEVEL_UP) return { ...state, level: state.level + 1, rounds: 0 };
  return { ...state, rounds };
}
