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
    return [`I see ${NUMBERS[x.n]} ${x.n === 1 ? c.id : c.plural}`, `Em thấy ${NUMBERS_VI[x.n]} ${c.vi}`];
  }
  const noun = NOUN_BY_EN.get(x.en);
  const vi = `Đó là ${noun.vi}`;
  if (noun.form === 'plural') return [`They're ${noun.en}`, vi];
  if (noun.form === 'mass') return [`It's ${noun.en}`, vi];
  return [`It's ${noun.form} ${noun.en}`, vi];
}
/** Bạn học sinh giơ tay: "I know! It's a cat!" (học trò nói với cô: xưng "em"). */
export const claimLine = (claim) => {
  const [en, vi] = sayWhat(claim);
  return [`I know! ${en}!`, `Em biết! ${vi}!`];
};
export const YAY_LINE = ["Yay! I'm right!", 'Hoan hô! Em nói đúng rồi!'];
export const OOPS_LINE = ['Oops! What is it?', 'Ối! Đây là gì hả cô?'];
/** Sau khi bé chạm ❌ và chờ bé nói: Bông nói lại đúng. */
export const fixLine = (shown) => {
  const [en, vi] = sayWhat(shown);
  return [`${en}! Thank you, teacher!`, `${vi}! Em cảm ơn cô ạ!`];
};
export const SURE_LINE = ['Hmm, are you sure? Look again!', 'Ừm, cô chắc không ạ? Cô nhìn lại xem!'];
export const START_LINE = ["Let's learn! I'm ready!", 'Mình học nào! Em sẵn sàng rồi ạ!'];
export const ASK_LINE = ['Am I right? Tap yes or no!', 'Em nói đúng không cô? Cô chạm Đúng hay Sai nhé!'];
export const END_LINE = ['Thank you, teacher! I learned a lot!', 'Em cảm ơn cô ạ! Em học được nhiều lắm!'];

/** Từ để ghi "đã gặp" của một hình (chỉ danh từ của bài có sẵn; mức 3 không ghi). */
export const practiceWord = (shown) => (shown.kind === 'noun' ? NOUN_BY_EN.get(shown.en) : null);

// ---------- SPEC-jobs2 TE1: điểm danh (mở đầu lượt) + ca "Classroom actions" (thay 1 hình) ----------
/** Bạn thú trong lớp (theo mã bạn thú của Bác sĩ nhí). */
export const CLASS_IDS = ['teddy', 'kitty', 'puppy', 'piggy'];
/**
 * Thẻ hành động (lệnh của bài Actions + wave). `short`: tên ngắn trong câu nhầm ("That's clap."),
 * `we`: sau "Can we …" / "We want to …", `word`: từ ghi "đã gặp".
 */
export const ACTIONS = [
  { id: 'stand-up', cmd: 'Stand up!', short: 'stand up', we: 'stand up', word: 'stand up', emoji: '🧍', vi: 'đứng lên' },
  { id: 'sit-down', cmd: 'Sit down!', short: 'sit down', we: 'sit down', word: 'sit down', emoji: '🪑', vi: 'ngồi xuống' },
  { id: 'clap', cmd: 'Clap your hands!', short: 'clap', we: 'clap our hands', word: 'clap your hands', emoji: '👏', vi: 'vỗ tay' },
  { id: 'jump', cmd: 'Jump!', short: 'jump', we: 'jump', word: 'jump', emoji: '🦘', vi: 'nhảy lên' },
  { id: 'wave', cmd: 'Wave!', short: 'wave', we: 'wave', word: 'wave', emoji: '👋', vi: 'vẫy tay' },
];
export const ACTION_BY_ID = new Map(ACTIONS.map((a) => [a.id, a]));
export const ACTION_STEPS = 3;

/**
 * Ca "Classroom actions" (sinh sẵn): mức 1 — 3 thẻ (stand up, sit down, clap), chạm thẻ nào cũng được (khám phá);
 * mức 2–3 — 5 thẻ, 3 yêu cầu khác nhau, mỗi yêu cầu do một bạn trong lớp xin.
 */
export function makeActionsItem(level, pupils, { rng = Math.random } = {}) {
  if (level <= 1) return { kind: 'actions', cards: shuffle(['stand-up', 'sit-down', 'clap'], rng), asks: null, askers: null };
  const cards = shuffle(ACTIONS.map((a) => a.id), rng);
  const asks = shuffle(cards, rng).slice(0, ACTION_STEPS);
  return { kind: 'actions', cards, asks, askers: asks.map(() => pick(pupils, rng)) };
}

/**
 * Kế hoạch một buổi học: lớp (3 bạn mức 1 / 4 bạn mức 2–3, chỗ ngồi cố định), thứ tự điểm danh, 5 việc =
 * 4 hình (như cũ) + 1 ca Classroom actions thay một hình Bông nói ĐÚNG (giữ 2–3 câu sai).
 * Chỉ test UI đặt `window.__kidTest.teacherActionsAt` để cố định chỗ ca hành động.
 */
export function planLesson(level, { known = new Set(), rng = Math.random } = {}) {
  const pupils = shuffle(CLASS_IDS, rng).slice(0, level <= 1 ? 3 : 4);
  const roll = shuffle(pupils, rng);
  const items = planRound(level, { known, rng });
  const rights = items.map((q, i) => (q.right ? i : -1)).filter((i) => i >= 0);
  const at = rights.length ? pick(rights, rng) : items.length - 1;
  items.splice(at, 1);
  const pinned = globalThis.__kidTest?.teacherActionsAt;
  const to = Number.isInteger(pinned) && pinned >= 0 && pinned <= items.length ? pinned : at;
  items.splice(to, 0, makeActionsItem(level, pupils, { rng }));
  return { pupils, roll, items, stars: planStars(level, pupils, { rng }) };
}

export const BELL_LINE = ['Ring the bell, teacher!', 'Cô ơi, cô rung chuông vào lớp đi ạ!'];
export const MORNING_LINE = ['Good morning, class!', 'Chào cả lớp!'];
export const CLASS_MORNING_LINE = ['Good morning, teacher!', 'Chúng em chào cô ạ!'];
/** Cô giáo điểm danh: "Where's Kitty?" */
export const whereLine = (name) => [`Where's ${name}?`, `${name} đâu nhỉ?`];
export const HERE_LINE = ['Here!', 'Có ạ!'];
/** Chạm nhầm bạn khi điểm danh: "I'm Puppy! Kitty is over there!" */
export const notMeLine = (me, want) => [`I'm ${me}! ${want} is over there!`, `Em là ${me} ạ! ${want} ở đằng kia kìa cô!`];
/** Lớp trưởng (bạn học sinh) báo cáo sĩ số. */
export const ALL_HERE_LINE = ['Everyone is here!', 'Thưa cô, lớp mình đủ rồi ạ!'];
export const WHAT_DO_LINE = ['What do we do, teacher?', 'Chúng em làm gì bây giờ hả cô?'];
/** Bạn xin: "Can we jump, teacher?" */
export const canWeLine = (a) => [`Can we ${a.we}, teacher?`, `Cô cho chúng em ${a.vi} được không ạ?`];
/** Lệnh của cô giáo: "Jump!" */
export const cmdLine = (a) => [a.cmd, `${a.vi.charAt(0).toUpperCase()}${a.vi.slice(1)}!`];
/** Thẻ sai: "That's clap. We want to jump!" */
export const wrongActionLine = (tapped, want) => [`That's ${tapped.short}. We want to ${want.we}!`, `Đó là ${tapped.vi} ạ. Chúng em muốn ${want.vi}!`];
export const ACTIONS_DONE_LINE = ['That was fun!', 'Vui quá!'];

// ---------- SPEC-jobs2 TE2: phát sao cuối buổi (mức 2–3) + chào tạm biệt ----------
const STAR_NUM = ['zero', 'one', 'two', 'three'];
const STAR_NUM_VI = ['không', 'một', 'hai', 'ba'];
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** Sinh sẵn: 2 bạn khác nhau trong lớp; mức 2 mỗi bạn 1–2 sao, mức 3 2–3 sao; mức 1 không phát sao. */
export function planStars(level, pupils, { rng = Math.random } = {}) {
  if (level < 2) return [];
  const [lo, hi] = level >= 3 ? [2, 3] : [1, 2];
  return shuffle(pupils, rng).slice(0, 2).map((pupil) => ({ pupil, n: lo + Math.floor(rng() * (hi - lo + 1)) }));
}
const starsWord = (n) => `${STAR_NUM[n]} ${n === 1 ? 'star' : 'stars'}`;
/** Cô giáo phát sao: "Two stars for Kitty!" */
export const starsForLine = (n, name) => [`${capitalize(starsWord(n))} for ${name}!`, `${capitalize(STAR_NUM_VI[n])} ngôi sao cho ${name}!`];
/** Cô giáo đếm sao: "One!", "Two!" */
export const starCountLine = (n) => [`${capitalize(STAR_NUM[n])}!`, `${capitalize(STAR_NUM_VI[n])}!`];
export const STAR_THANKS_LINE = ['Thank you, teacher!', 'Cảm ơn cô giáo ạ!'];
/** Chạm thừa khi đã đủ: "I have two stars! Thank you!" */
export const haveStarsLine = (n) => [`I have ${starsWord(n)}! Thank you!`, `Em có ${STAR_NUM_VI[n]} ngôi sao rồi ạ! Em cảm ơn cô!`];
export const GOODBYE_CLASS_LINE = ['Goodbye, class!', 'Tạm biệt cả lớp!'];
export const GOODBYE_TEACHER_LINE = ['Goodbye, teacher!', 'Chúng em chào cô ạ!'];
