// Trò Cô giáo nhí (SPEC-jobs.md mục 5): Bông làm học trò, nhìn hình trên bảng và nói tên — đôi khi cố tình nói sai;
// bé chấm ✅ / ❌. File thuần (dữ liệu, chọn câu, câu nói) để test được trong node.
// Chỉ dùng từ có trong bảng NOUNS (mạo từ / số nhiều khai báo sẵn) để câu của Bông luôn đúng ngữ pháp.

export const QUESTIONS_PER_ROUND = 5;
export const MAX_LEVEL = 3;

/**
 * Danh từ của các bài có sẵn. `form`: 'a' | 'an' (đếm được, số ít), 'mass' (không đếm được: "It's rice!"),
 * 'plural' (luôn số nhiều: "They're eyes!"). `group`: nhóm (bài) — câu sai mức 1 lấy khác nhóm, mức 2 cùng nhóm.
 */
const N = (group, en, form, emoji, vi) => ({ group, en, form, emoji, vi });
export const NOUNS = [
  N('animals', 'dog', 'a', '🐶', 'con chó'), N('animals', 'cat', 'a', '🐱', 'con mèo'), N('animals', 'cow', 'a', '🐮', 'con bò'),
  N('animals', 'duck', 'a', '🦆', 'con vịt'), N('animals', 'pig', 'a', '🐷', 'con lợn'), N('animals', 'bird', 'a', '🐦', 'con chim'),
  N('food', 'banana', 'a', '🍌', 'quả chuối'), N('food', 'egg', 'an', '🥚', 'quả trứng'), N('food', 'bread', 'mass', '🍞', 'bánh mì'),
  N('food', 'rice', 'mass', '🍚', 'cơm'), N('food', 'milk', 'mass', '🥛', 'sữa'), N('food', 'apple', 'an', '🍎', 'quả táo'),
  N('vehicles', 'car', 'a', '🚗', 'ô tô'), N('vehicles', 'bus', 'a', '🚌', 'xe buýt'), N('vehicles', 'train', 'a', '🚂', 'tàu hỏa'),
  N('vehicles', 'plane', 'a', '✈️', 'máy bay'), N('vehicles', 'boat', 'a', '⛵', 'con thuyền'), N('vehicles', 'bike', 'a', '🚲', 'xe đạp'),
  N('body', 'eyes', 'plural', '👀', 'đôi mắt'), N('body', 'nose', 'a', '👃', 'cái mũi'), N('body', 'mouth', 'a', '👄', 'cái miệng'),
  N('body', 'ears', 'plural', '👂', 'đôi tai'), N('body', 'hands', 'plural', '👐', 'đôi tay'), N('body', 'feet', 'plural', '🦶', 'đôi chân'),
];
export const NOUN_BY_EN = new Map(NOUNS.map((n) => [n.en, n]));

/** Mức 3: hình có thuộc tính rõ — đồ tô màu (SVG) hoặc nhiều con / quả (emoji lặp lại). */
export const COLORS = ['red', 'blue', 'yellow', 'green', 'pink', 'orange'];
export const COLOR_VI = { red: 'màu đỏ', blue: 'màu xanh dương', yellow: 'màu vàng', green: 'màu xanh lá', pink: 'màu hồng', orange: 'màu cam' };
export const THINGS = [
  { id: 'ball', vi: 'quả bóng' }, { id: 'balloon', vi: 'quả bóng bay' }, { id: 'star', vi: 'ngôi sao' },
];
export const COUNTABLES = [
  { id: 'cat', plural: 'cats', emoji: '🐱', vi: 'con mèo' }, { id: 'duck', plural: 'ducks', emoji: '🦆', vi: 'con vịt' },
  { id: 'apple', plural: 'apples', emoji: '🍎', vi: 'quả táo' }, { id: 'car', plural: 'cars', emoji: '🚗', vi: 'ô tô' },
];
const NUMBERS = ['zero', 'one', 'two', 'three'];
const NUMBERS_VI = ['không', 'một', 'hai', 'ba'];

const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const pick = (list, rng) => list[Math.floor(rng() * list.length)];

/**
 * Hình của câu hỏi (cái thật trên bảng) và cái Bông nói. Kiểu:
 * - { kind: 'noun', en } — mức 1–2;
 * - { kind: 'color', thing, color } / { kind: 'count', thing, n } — mức 3.
 */
const sameShown = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Câu sai cho một hình theo mức; không có cái thay thế hợp lệ thì null (câu đó Bông nói đúng). */
export function wrongClaim(shown, level, rng = Math.random) {
  if (shown.kind === 'noun') {
    const me = NOUN_BY_EN.get(shown.en);
    const pool = NOUNS.filter((n) => n.en !== me.en && (level <= 1 ? n.group !== me.group : n.group === me.group));
    return pool.length ? { kind: 'noun', en: pick(pool, rng).en } : null;
  }
  if (shown.kind === 'color') {
    // Đổi đúng một thuộc tính: màu hoặc đồ.
    if (rng() < 0.6) return { ...shown, color: pick(COLORS.filter((c) => c !== shown.color), rng) };
    return { ...shown, thing: pick(THINGS.filter((t) => t.id !== shown.thing), rng).id };
  }
  if (rng() < 0.6) return { ...shown, n: pick([1, 2, 3].filter((x) => x !== shown.n), rng) };
  return { ...shown, thing: pick(COUNTABLES.filter((t) => t.id !== shown.thing), rng).id };
}

/**
 * 5 câu của một lượt: [{ shown, claim, right }] — 2 hoặc 3 câu Bông nói sai.
 * Mức 1–2: hình là danh từ trong NOUNS, ưu tiên từ bé đã học (`known`: tập từ tiếng Anh có practiceCount > 0),
 * không đủ thì lấy thêm ngẫu nhiên; mức 3: đồ tô màu / nhiều con. Không lặp hình trong lượt.
 */
export function planRound(level, { known = new Set(), rng = Math.random, n = QUESTIONS_PER_ROUND } = {}) {
  let shownList;
  if (level >= 3) {
    shownList = [];
    const keys = new Set();
    while (shownList.length < n) {
      const s = rng() < 0.5
        ? { kind: 'color', thing: pick(THINGS, rng).id, color: pick(COLORS, rng) }
        : { kind: 'count', thing: pick(COUNTABLES, rng).id, n: pick([1, 2, 3], rng) };
      const key = JSON.stringify(s);
      if (keys.has(key)) continue;
      keys.add(key);
      shownList.push(s);
    }
  } else {
    const learned = shuffle(NOUNS.filter((x) => known.has(x.en)), rng);
    const others = shuffle(NOUNS.filter((x) => !known.has(x.en)), rng);
    shownList = [...learned, ...others].slice(0, n).map((x) => ({ kind: 'noun', en: x.en }));
    shownList = shuffle(shownList, rng);
  }
  const wrongCount = rng() < 0.5 ? 2 : 3;
  const wrongAt = new Set(shuffle(shownList.map((_, i) => i), rng).slice(0, wrongCount));
  return shownList.map((shown, i) => {
    const claim = wrongAt.has(i) ? wrongClaim(shown, level, rng) : null;
    return claim && !sameShown(claim, shown) ? { shown, claim, right: false } : { shown, claim: shown, right: true };
  });
}

// ---------- Câu nói: mỗi câu [tiếng Anh, tiếng Việt] ----------
const thingVi = (id) => THINGS.find((t) => t.id === id)?.vi ?? id;
const countable = (id) => COUNTABLES.find((t) => t.id === id);

/** "It's a cat" / "It's an egg" / "It's rice" / "They're eyes" / "It's a red ball" / "I see two cats". */
export function sayWhat(x) {
  if (x.kind === 'color') return [`It's a ${x.color} ${x.thing}`, `Đó là ${thingVi(x.thing)} ${COLOR_VI[x.color]}`];
  if (x.kind === 'count') {
    const c = countable(x.thing);
    return [`I see ${NUMBERS[x.n]} ${x.n === 1 ? c.id : c.plural}`, `Tớ thấy ${NUMBERS_VI[x.n]} ${c.vi}`];
  }
  const noun = NOUN_BY_EN.get(x.en);
  const vi = `Đó là ${noun.vi}`;
  if (noun.form === 'plural') return [`They're ${noun.en}`, vi];
  if (noun.form === 'mass') return [`It's ${noun.en}`, vi];
  return [`It's ${noun.form} ${noun.en}`, vi];
}
/** Bông giơ tay: "I know! It's a cat!" */
export const claimLine = (claim) => {
  const [en, vi] = sayWhat(claim);
  return [`I know! ${en}!`, `Tớ biết! ${vi}!`];
};
export const YAY_LINE = ["Yay! I'm right!", 'Hoan hô! Tớ nói đúng rồi!'];
export const OOPS_LINE = ['Oops! What is it?', 'Ối! Đây là gì nhỉ?'];
/** Sau khi bé chạm ❌ và chờ bé nói: Bông nói lại đúng. */
export const fixLine = (shown) => {
  const [en, vi] = sayWhat(shown);
  return [`${en}! Thank you, teacher!`, `${vi}! Cảm ơn cô giáo!`];
};
export const SURE_LINE = ['Hmm, are you sure? Look again!', 'Ừm, cô chắc không? Cô nhìn lại xem!'];
export const START_LINE = ["Good morning, teacher! I'm ready!", 'Chào cô giáo! Tớ sẵn sàng rồi!'];
export const ASK_LINE = ['Is Bông right? Tap yes or no!', 'Bông nói đúng không? Con chạm đúng hay sai nhé!'];
export const END_LINE = ['Thank you, teacher! I learned a lot!', 'Cảm ơn cô giáo! Tớ học được nhiều lắm!'];

/** Từ để ghi "đã gặp" của một hình (chỉ danh từ của bài có sẵn; mức 3 không ghi). */
export const practiceWord = (shown) => (shown.kind === 'noun' ? NOUN_BY_EN.get(shown.en) : null);
