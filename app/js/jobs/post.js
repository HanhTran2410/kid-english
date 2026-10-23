// Trò Bưu tá (SPEC-jobs.md mục 4): Bông đưa thư "This letter is for the red house!", bé kéo thư vào đúng nhà
// (hoặc chạm nhà). Mức 1 theo màu, mức 2 theo số nhà, mức 3 trộn màu / số / tên bạn thú. File thuần để test được.

import { PATIENTS, PATIENT_BY_ID } from '../doctor.js';

export const LETTERS_PER_ROUND = 5;
export const MAX_LEVEL = 3;
/** Số nhà theo mức. */
export const HOUSES = { 1: 3, 2: 4, 3: 4 };
/** Màu của bài Colors (tên tiếng Anh = từ bài học, ghi "đã gặp"). */
export const COLORS = [
  { id: 'red', vi: 'màu đỏ', emoji: '🔴', wall: '#ff8787', roof: '#e03131' },
  { id: 'blue', vi: 'màu xanh dương', emoji: '🔵', wall: '#74c0fc', roof: '#1c7ed6' },
  { id: 'yellow', vi: 'màu vàng', emoji: '🟡', wall: '#ffe066', roof: '#f59f00' },
  { id: 'green', vi: 'màu xanh lá', emoji: '🟢', wall: '#8ce99a', roof: '#2f9e44' },
  { id: 'pink', vi: 'màu hồng', emoji: '🩷', wall: '#fcc2d7', roof: '#e64980' },
  { id: 'orange', vi: 'màu cam', emoji: '🟠', wall: '#ffc078', roof: '#e8590c' },
];
export const COLOR_BY_ID = new Map(COLORS.map((c) => [c.id, c]));
const NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five'];
const NUMBERS_VI = ['không', 'một', 'hai', 'ba', 'bốn', 'năm'];

const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Dãy nhà của một lượt: [{ color, number, resident }] từ trái sang phải.
 * - Mức 1: 3 nhà khác màu (số không dùng).
 * - Mức 2: 4 nhà **cùng màu**, số khác nhau trong 1–5, tăng dần như một con phố.
 * - Mức 3: 4 nhà khác màu, số tăng dần, mỗi nhà một bạn thú khác nhau (ló ở cửa sổ).
 * Mỗi nhà có một bạn thú (người nhận thư); không trùng bạn trong một dãy.
 */
export function makeStreet(level, { rng = Math.random } = {}) {
  const n = HOUSES[level] ?? HOUSES[1];
  const colors = level === 2 ? Array(n).fill(shuffle(COLORS, rng)[0].id) : shuffle(COLORS, rng).slice(0, n).map((c) => c.id);
  const numbers = shuffle([1, 2, 3, 4, 5], rng).slice(0, n).sort((a, b) => a - b);
  const residents = shuffle(PATIENTS, rng).slice(0, n).map((p) => p.id);
  return colors.map((color, i) => ({ color, number: numbers[i], resident: residents[i] }));
}

/** Kiểu nói địa chỉ của thư theo mức: màu (1), số (2), trộn màu / số / tên (3). */
const kindsFor = (level) => (level <= 1 ? ['color'] : level === 2 ? ['number'] : ['color', 'number', 'name']);

/**
 * 5 thư của một lượt: [{ house (vị trí trong dãy), kind }]; hai thư liền nhau không cùng nhà.
 * Mức 3: các kiểu xoay vòng từ một điểm ngẫu nhiên (đủ cả màu, số, tên).
 */
export function makeLetters(street, level, { rng = Math.random, n = LETTERS_PER_ROUND } = {}) {
  const kinds = kindsFor(level);
  const start = Math.floor(rng() * kinds.length);
  const out = [];
  let last = -1;
  for (let i = 0; i < n; i++) {
    const choices = street.map((_, k) => k).filter((k) => k !== last);
    const house = choices[Math.floor(rng() * choices.length)];
    out.push({ house, kind: kinds[(start + i) % kinds.length] });
    last = house;
  }
  return out;
}

export const planRound = (level, { rng = Math.random } = {}) => {
  const street = makeStreet(level, { rng });
  return { street, letters: makeLetters(street, level, { rng }) };
};

// ---------- Câu nói: mỗi câu [tiếng Anh, tiếng Việt] ----------
const nameOf = (h) => PATIENT_BY_ID.get(h.resident);
/** Địa chỉ trên thư: "the red house" / "house number three" / "Kitty". */
export function address(h, kind) {
  if (kind === 'number') return [`house number ${NUMBERS[h.number]}`, `nhà số ${NUMBERS_VI[h.number]}`];
  if (kind === 'name') return [nameOf(h).name, nameOf(h).vi];
  return [`the ${h.color} house`, `ngôi nhà ${COLOR_BY_ID.get(h.color).vi}`];
}
export const letterLine = (h, kind) => {
  const [en, vi] = address(h, kind);
  return [`This letter is for ${en}!`, `Lá thư này gửi cho ${vi}!`];
};
export const THANKS_LINE = ['A letter for me! Thank you!', 'Thư của tớ! Cảm ơn bác bưu tá!'];
export const DONE_LINE = ['All the letters are delivered! Great job!', 'Đưa hết thư rồi! Con giỏi quá!'];
export const DRAG_LINE = ['Take the letter to the house!', 'Con mang thư đến ngôi nhà nhé!'];

/** Nhầm nhà: bạn thú trong nhà đó nói "Not for me! This is the blue house." (theo kiểu địa chỉ của thư). */
export function wrongLine(h, kind) {
  if (kind === 'name') return [`Not for me! I'm ${nameOf(h).name}.`, `Không phải thư của tớ! Tớ là ${nameOf(h).vi}.`];
  const [en, vi] = address(h, kind);
  return [`Not for me! This is ${en}.`, `Không phải thư của tớ! Đây là ${vi}.`];
}
