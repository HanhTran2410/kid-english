// Trò Bưu tá (SPEC-jobs.md mục 4): Bông đưa thư "This letter is for the red house!", bé kéo thư vào đúng nhà
// (hoặc chạm nhà). Mức 1 theo màu, mức 2 theo số nhà, mức 3 trộn màu / số / tên bạn thú. File thuần để test được.

import { PATIENTS, PATIENT_BY_ID, STICKER_SHAPES, STICKER_COLORS, planSticker, matchesSticker } from '../doctor.js';

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

/**
 * Kế hoạch lượt: dãy nhà, 5 thư (SPEC-jobs2 PO1: một thư thành bưu kiện), 3 bộ tem cho phần dán tem mở đầu.
 * Chỉ test UI đặt `window.__kidTest.postParcelAt` để cố định chỗ bưu kiện.
 */
export const planRound = (level, { rng = Math.random, words = [] } = {}) => {
  const street = makeStreet(level, { rng });
  const letters = makeLetters(street, level, { rng });
  const pinned = globalThis.__kidTest?.postParcelAt;
  const at = Number.isInteger(pinned) && pinned >= 0 && pinned < letters.length ? pinned : Math.floor(rng() * letters.length);
  letters[at] = { ...letters[at], parcel: makeParcel(level, { words, rng }) };
  return { street, letters, stamps: Array.from({ length: STAMPS_PER_ROUND }, () => planStamp(level, { rng })) };
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

// ---------- SPEC-jobs2 PO1: dán tem (mở đầu lượt) + giao bưu kiện (thay 1 thư) ----------
export const STAMPS_PER_ROUND = 3;
const SHAPE_VI = new Map(STICKER_SHAPES.map((x) => [x.id, x.vi]));
const STAMP_COLOR_VI = new Map(STICKER_COLORS.map((x) => [x.id, x.vi]));
export { matchesSticker as matchesStamp };

/**
 * Bộ tem của một lá thư (cùng kiểu bộ sticker Bác sĩ): mức 1 — 3 tem, cái nào cũng được; mức 2 — 3 tem khác hình,
 * yêu cầu theo hình (đúng một cái khớp); mức 3 — 4 tem, yêu cầu hình + màu (như sticker mức 3).
 */
export function planStamp(level, { rng = Math.random } = {}) {
  if (level === 2) {
    const shapes = shuffle(STICKER_SHAPES.map((x) => x.id), rng).slice(0, 3);
    const colors = STICKER_COLORS.map((x) => x.id);
    const set = shapes.map((shape) => ({ shape, color: colors[Math.floor(rng() * colors.length)] }));
    return { set, want: { shape: set[Math.floor(rng() * set.length)].shape } };
  }
  return planSticker(level, { rng });
}
const stampVi = (st) => `tem ${SHAPE_VI.get(st.shape)} ${STAMP_COLOR_VI.get(st.color)}`;
export const STAMP_START_LINE = ["Let's put stamps on the letters!", 'Mình dán tem lên thư nào!'];
export const STAMP_PICK_LINE = ['Pick a stamp!', 'Con chọn một con tem nhé!'];
/** Mức 1: Bông nói tên tem bé chọn: "A red star stamp!" */
export const stampLine = (st) => [`A ${st.color} ${st.shape} stamp!`, `${stampVi(st).replace(/^t/, 'T')}!`];
/** Yêu cầu: "A heart stamp, please!" (mức 2) / "A blue circle stamp, please!" (mức 3). */
export const stampWantLine = (want) => (want.color
  ? [`A ${want.color} ${want.shape} stamp, please!`, `Cho tớ tem ${SHAPE_VI.get(want.shape)} ${STAMP_COLOR_VI.get(want.color)} nhé!`]
  : [`A ${want.shape} stamp, please!`, `Cho tớ tem ${SHAPE_VI.get(want.shape)} nhé!`]);
/** Nhầm: "That's a green star stamp. A heart stamp, please!" */
export const stampWrongLine = (st, want) => {
  const [en, vi] = stampWantLine(want);
  return [`That's a ${st.color} ${st.shape} stamp. ${en}`, `Đó là ${stampVi(st)}. ${vi}`];
};
export const READY_LINE = ['Ready to go!', 'Sẵn sàng đi giao thư!'];

/** Đồ mặc định trong bưu kiện (máy mới / chưa học đủ từ). */
export const DEFAULT_PARCEL_ITEMS = [
  { en: 'ball', article: 'a', emoji: '⚽', vi: 'quả bóng' }, { en: 'teddy', article: 'a', emoji: '🧸', vi: 'gấu bông' },
  { en: 'car', article: 'a', emoji: '🚗', vi: 'ô tô' }, { en: 'apple', article: 'an', emoji: '🍎', vi: 'quả táo' },
  { en: 'cat', article: 'a', emoji: '🐱', vi: 'con mèo' }, { en: 'book', article: 'a', emoji: '📖', vi: 'quyển sách' },
];
/**
 * Từ bài học dùng được làm đồ trong hộp: một từ (chữ cái), có emoji, và câu mẫu của bài có "a / an <từ>" —
 * nghĩa là danh từ đếm được số ít; mạo từ lấy từ chính câu mẫu ("I eat an egg." → an egg; "I eat rice." → bỏ).
 */
export function parcelItemOf(w) {
  const en = String(w?.en ?? '').trim().toLowerCase();
  if (!/^[a-z]{2,}$/.test(en) || !w.emoji) return null;
  const m = String(w.sentence ?? '').toLowerCase().match(new RegExp(`\\b(a|an) ${en}\\b`));
  return m ? { en, article: m[1], emoji: w.emoji, vi: w.vi ?? en } : null;
}
/**
 * Bưu kiện (sinh sẵn): đồ trong hộp ưu tiên từ bé đã gặp (`words`: từ bài học có practiceCount > 0), thiếu thì bộ mặc định.
 * Mức 3: bạn thú đoán "Is it a car?" — 50% đúng đồ thật, 50% một đồ khác cùng nguồn.
 */
export function makeParcel(level, { words = [], rng = Math.random } = {}) {
  const seen = new Set();
  const pool = [];
  for (const w of [...shuffle(words.map(parcelItemOf).filter(Boolean), rng), ...shuffle(DEFAULT_PARCEL_ITEMS, rng)]) {
    if (seen.has(w.en)) continue;
    seen.add(w.en);
    pool.push(w);
  }
  const item = pool[0];
  if (level < 3) return { item, guess: null };
  const right = rng() < 0.5;
  return { item, guess: right ? item : pool.filter((w) => w.en !== item.en)[0], guessRight: right };
}
const aWord = (w) => `${w.article} ${w.en}`;
export const parcelLine = (h, kind) => {
  const [en, vi] = address(h, kind);
  return [`A parcel for ${en}!`, `Bưu kiện gửi cho ${vi}!`];
};
export const KNOCK_ASK_LINE = ['Knock on the door!', 'Con gõ cửa nhé!'];
export const KNOCK_LINE = ['Knock, knock!', 'Cốc, cốc!'];
export const WHATS_INSIDE_LINE = ["A parcel! What's inside?", 'Bưu kiện! Bên trong có gì nhỉ?'];
/** Mức 3: bạn thú đoán "Is it a car?" */
export const guessLine = (w) => [`Is it ${aWord(w)}?`, `Có phải ${w.vi} không?`];
export const YES_LOOK_LINE = ["Yes! Let's look!", 'Đúng rồi! Mình mở xem nào!'];
export const NO_LOOK_LINE = ["No? Let's look!", 'Không phải à? Mình mở xem nào!'];
export const LOOK_PICTURE_LINE = ['Look at the picture on the box!', 'Con nhìn hình trên hộp nhé!'];
export const OPEN_ASK_LINE = ['Open the box!', 'Con mở hộp nhé!'];
/** Mở hộp: "It's a ball!" */
export const itsLine = (w) => [`It's ${aWord(w)}!`, `Đó là ${w.vi}!`];
/** Bạn thú: "A ball! Thank you!" */
export const parcelThanksLine = (w) => [`${aWord(w).replace(/^a/, 'A')}! Thank you!`, `${w.vi.charAt(0).toUpperCase()}${w.vi.slice(1)}! Cảm ơn bác bưu tá!`];
