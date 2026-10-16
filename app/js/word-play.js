// Bài từ vựng hấp dẫn hơn (SPEC-words-play.md): "ló dần" khi giới thiệu từ, truyện chạm được, tiếng khi chạm.
// Phần logic (không đụng DOM) — dùng chung cho màn học bài, Góc bố mẹ và test.

import { tokenize, normalizeWord } from './text.js';

// ---------- Ló dần (mục 3) ----------

export const REVEAL_KINDS = ['bubbles', 'curtain', 'silhouette'];
/** Số mảng mở dần của mỗi kiểu che. */
export const REVEAL_UNITS = { bubbles: 9, curtain: 3, silhouette: 3 };
export const REVEAL_FILL_MS = 3000; // không chạm: tự mở dần sao cho tới ngưỡng đoán sau ~3 giây
export const REVEAL_MAX_MS = 8000; // MỘT đồng hồ từ lúc che hình: cả màn ló dần, GỒM lượt đoán; hết là mở hết
export const GUESS_AT = 0.6; // mở được ~60% thì Bông hỏi "What's this?"
export const GUESS_LISTEN_MS = 4000; // nghe đoán tối đa (và không quá thời gian còn lại)
export const GUESS_MIN_LEFT_MS = 1500; // còn ít hơn chừng này thì bỏ lượt đoán, mở hết luôn

/** Số mảng phải mở để tới lượt đoán (bong bóng 9 → 6; rèm / bóng 3 → 2). */
export const unitsToGuess = (kind) => Math.ceil(REVEAL_UNITS[kind] * GUESS_AT);

/** Nhịp tự mở một mảng của kiểu che (bong bóng 500 ms, rèm / bóng 1500 ms). */
export const revealTickMs = (kind) => Math.round(REVEAL_FILL_MS / unitsToGuess(kind));

/** Thời gian nghe đoán: tối đa 4 giây, không quá thời gian còn lại của màn; còn quá ít thì 0 (bỏ lượt đoán). */
export function guessListenMs(leftMs) {
  if (leftMs < GUESS_MIN_LEFT_MS) return 0;
  return Math.min(GUESS_LISTEN_MS, leftMs - 300);
}

/**
 * Kiểu che cho thẻ thứ `index` (đổi lần lượt). Thẻ đầu luôn bong bóng. Hình bóng đen chỉ hợp emoji
 * (ảnh thường nền trắng thành ô đen) → ảnh thì dùng bong bóng.
 */
export function revealKind(index, hasImage = false) {
  const kind = REVEAL_KINDS[Math.max(0, index) % REVEAL_KINDS.length];
  return kind === 'silhouette' && hasImage ? 'bubbles' : kind;
}

/** Câu mở đầu của Bông (đổi vòng) + phụ đề tiếng Việt. */
export const REVEAL_OPENERS = [
  ["Ooh! What's hiding here?", 'Cái gì đang trốn đây?'],
  ["Peek-a-boo! Who's there?", 'Ú òa! Ai đấy?'],
  ['Something is hiding!', 'Có gì đang trốn kìa!'],
  ["Let's find out!", 'Cùng xem nào!'],
];
export const revealOpener = (index) => REVEAL_OPENERS[Math.max(0, index) % REVEAL_OPENERS.length];

// ---------- Tiếng khi chạm (mục 5) ----------

export const MAX_SOUND_CHARS = 30;

/** Bảng tiếng kêu có sẵn cho bài cũ chưa có `sound`. */
export const SOUND_TABLE = {
  cow: 'Moo moo!', dog: 'Woof woof!', puppy: 'Woof woof!', cat: 'Meow!', kitten: 'Meow!', duck: 'Quack quack!',
  pig: 'Oink oink!', sheep: 'Baa baa!', lamb: 'Baa baa!', goat: 'Maa maa!', horse: 'Neigh!', chicken: 'Cluck cluck!',
  hen: 'Cluck cluck!', chick: 'Cheep cheep!', rooster: 'Cock-a-doodle-doo!', frog: 'Ribbit!', bee: 'Buzz buzz!',
  bird: 'Tweet tweet!', owl: 'Hoo hoo!', lion: 'Roar!', tiger: 'Roar!', bear: 'Grr!', monkey: 'Ooh ooh ah ah!',
  elephant: 'Toot!', mouse: 'Squeak!', snake: 'Hiss!', wolf: 'Awoo!', car: 'Beep beep!', bus: 'Beep beep!',
  train: 'Choo choo!', truck: 'Honk honk!', airplane: 'Zoom!', plane: 'Zoom!', boat: 'Toot toot!', ship: 'Toot toot!',
  clock: 'Tick tock!', phone: 'Ring ring!', bell: 'Ding dong!', drum: 'Boom boom!',
};

/** Số ít đơn giản để tra bảng (cows → cow, sheep giữ nguyên). */
export function singular(word) {
  const w = normalizeWord(word);
  if (SOUND_TABLE[w]) return w;
  if (/ies$/.test(w) && SOUND_TABLE[w.replace(/ies$/, 'y')]) return w.replace(/ies$/, 'y');
  if (/es$/.test(w) && SOUND_TABLE[w.replace(/es$/, '')]) return w.replace(/es$/, '');
  if (/s$/.test(w) && SOUND_TABLE[w.replace(/s$/, '')]) return w.replace(/s$/, '');
  return w;
}

export const MAX_SOUND_WORDS = 4;

/**
 * Làm sạch `sound` khi đọc bài: bỏ khoảng trắng thừa; rỗng / sai kiểu / quá dài (> 4 từ hoặc > 30 ký tự) → ''
 * (dùng tiếng có sẵn). KHÔNG cắt giữa chừng; quá dài thì kiểm tra bài báo cảnh báo vàng.
 */
export function cleanSound(raw) {
  if (typeof raw !== 'string') return '';
  const s = raw.replace(/\s+/g, ' ').trim();
  if (!s || s.length > MAX_SOUND_CHARS || s.split(' ').length > MAX_SOUND_WORDS) return '';
  return s;
}

/**
 * Lượt "Tìm" trong truyện (SPEC-words-play mục 4.3, theo review): tối đa `max` câu mỗi truyện; mỗi câu đích là từ của bài
 * xuất hiện ĐẦU TIÊN trong câu, ưu tiên các từ đích khác nhau; câu không có từ của bài thì không có lượt Tìm.
 * @returns {Map<number, object>} chỉ số câu → từ đích
 */
export function planFinds(story, words, max = 2) {
  const plan = new Map();
  const casts = (story ?? []).map((line) => storyCast(line?.text ?? '', words));
  // Lượt 1: mỗi câu lấy từ đầu tiên chưa làm đích; lượt 2: cho phép lặp nếu chưa đủ.
  for (const allowRepeat of [false, true]) {
    casts.forEach((cast, i) => {
      if (plan.size >= max || plan.has(i) || !cast.length) return;
      const used = new Set(plan.values());
      const target = allowRepeat ? cast[0] : cast.find((w) => !used.has(w));
      if (target) plan.set(i, target);
    });
  }
  return new Map([...plan].sort((a, b) => a[0] - b[0]));
}

/** Tiếng của từ: `sound` của bài → bảng có sẵn → '' (không có). */
export const soundOf = (word) => cleanSound(word?.sound) || SOUND_TABLE[singular(word?.en ?? '')] || '';

/** Câu khi chạm vào nhân vật: tiếng kêu, không có thì đọc tên to vui ("Apple!"). */
export function tapLine(word) {
  const sound = soundOf(word);
  if (sound) return sound;
  const en = String(word?.en ?? '').trim();
  return en ? `${en.charAt(0).toUpperCase()}${en.slice(1)}!` : '';
}

// ---------- Truyện chạm được (mục 4) ----------

/**
 * Các từ của bài có trong câu truyện, theo thứ tự xuất hiện, không trùng. Khớp cả số nhiều ("cows") và từ nhiều chữ
 * ("ice cream").
 */
export function storyCast(text, words) {
  const tokens = tokenize(text);
  const found = [];
  for (let i = 0; i < tokens.length; i++) {
    for (const w of words) {
      const wt = tokenize(w.en);
      if (!wt.length || found.includes(w)) continue;
      const ok = wt.every((t, k) => {
        const tok = tokens[i + k];
        if (!tok) return false;
        if (k < wt.length - 1) return tok === t;
        return tok === t || tok === `${t}s` || tok === `${t}es` || (t.endsWith('y') && tok === `${t.slice(0, -1)}ies`);
      });
      if (ok) found.push(w);
    }
  }
  return found;
}

/** Nhân vật "lạ" cho lượt Tìm: một từ khác của bài, không có trong câu. Không có thì null. */
export function pickDistractor(words, cast, rng = Math.random) {
  const pool = words.filter((w) => !cast.includes(w));
  return pool.length ? pool[Math.floor(rng() * pool.length)] : null;
}

/** Mọi nhân vật của truyện (trang "The end!"): từ của bài có trong các câu; không có câu nào nhắc thì tối đa 6 từ đầu. */
export function storyActors(story, words, max = 6) {
  const all = [];
  for (const line of story ?? []) for (const w of storyCast(line.text ?? '', words)) if (!all.includes(w)) all.push(w);
  return (all.length ? all : words).slice(0, max);
}

/**
 * Chữ sáng theo giọng đọc (karaoke, mục 4.4): thời điểm bắt đầu (ms) của từng chữ, chia theo độ dài chữ.
 * Ước lượng — Safari iOS không báo vị trí đọc đáng tin.
 * @param {string[]} words các chữ của câu
 * @param {number} rate tốc độ đọc trong Cài đặt (1 = bình thường)
 */
export function karaokeTimes(words, rate = 0.8) {
  const perChar = 70 / Math.max(0.3, rate);
  const gap = 120 / Math.max(0.3, rate);
  const times = [];
  let t = 150;
  for (const w of words) {
    times.push(Math.round(t));
    t += gap + perChar * Math.max(1, String(w).replace(/[^\p{L}\p{N}']/gu, '').length);
  }
  return times;
}

/** Lượt Tìm: "Where's the cow? Tap the cow!" + phụ đề. */
export const findQuestion = (word) => [`Where's the ${word.en}? Tap the ${word.en}!`, `${word.vi} đâu rồi? Chạm vào ${word.vi} nào!`];
