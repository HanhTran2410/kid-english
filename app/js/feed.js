// Trò Cho Bông ăn (SPEC-feed.md): dữ liệu món, câu nói theo loại danh từ, khay, chọn lượt, lên mức.
// Không phụ thuộc giao diện để test được.

export const FEED_FOOD_IMAGES = 'feed:food';
export const FEED_BONG_IMAGES = 'feed:bong';
export const FEED_BG_IMAGES = 'feed:bg';
export const BG_KEY = 'background';

export const BELLY = 5; // một vòng = 5 đơn vị ăn
export const ROUNDS_TO_LEVEL_UP = 2;
export const TRAY_SIZE = { 1: 3, 2: 5, 3: 4 };
export const MAX_LEVEL = 3;
export const POSES = ['hungry', 'open', 'chew', 'no', 'full'];
export const POSE_LABEL = {
  hungry: { vi: 'Đói, xoa bụng', draw: 'rubbing her tummy, looking hungry and hopeful' },
  open: { vi: 'Há miệng', draw: 'mouth wide open, waiting to be fed, eyes looking up happily' },
  chew: { vi: 'Đang nhai', draw: 'chewing happily with puffed cheeks and closed smiling eyes' },
  no: { vi: 'Lắc đầu / eo ơi', draw: 'shaking her head and pulling a funny "yuck" face with tongue out' },
  full: { vi: 'No căng bụng', draw: 'sitting with a big round full tummy, patting it, very content and sleepy' },
};

/**
 * Món: { id, en, vi, kind: 'food'|'drink'|'silly', grammar: 'count'|'mass'|'plural', article?: 'a'|'an', plural?, emoji, draw, easy? }
 * - count: đếm được (a banana / two bananas) — `vi` có sẵn từ chỉ loại (quả chuối, chiếc bánh quy) để đếm "2 quả chuối".
 * - mass: không đếm được (some milk); plural: luôn số nhiều (some grapes / those are grapes).
 */
const count = (id, en, article, plural, vi, emoji, draw, extra = {}) => ({ id, en, vi, kind: 'food', grammar: 'count', article, plural, emoji, draw, ...extra });
const mass = (id, en, vi, emoji, draw, extra = {}) => ({ id, en, vi, kind: 'food', grammar: 'mass', emoji, draw, ...extra });

export const BUILTIN_FOODS = [
  count('banana', 'banana', 'a', 'bananas', 'quả chuối', '🍌', 'a ripe yellow banana', { easy: true }),
  count('apple', 'apple', 'an', 'apples', 'quả táo', '🍎', 'a shiny red apple with a leaf', { easy: true }),
  count('orange', 'orange', 'an', 'oranges', 'quả cam', '🍊', 'a round orange fruit'),
  { id: 'grapes', en: 'grapes', vi: 'chùm nho', kind: 'food', grammar: 'plural', emoji: '🍇', draw: 'a bunch of purple grapes' },
  count('strawberry', 'strawberry', 'a', 'strawberries', 'quả dâu tây', '🍓', 'a red strawberry'),
  mass('watermelon', 'watermelon', 'dưa hấu', '🍉', 'a slice of watermelon'),
  count('carrot', 'carrot', 'a', 'carrots', 'củ cà rốt', '🥕', 'an orange carrot with green leaves', { easy: true }),
  mass('corn', 'corn', 'ngô', '🌽', 'a cob of yellow corn'),
  mass('bread', 'bread', 'bánh mì', '🍞', 'a slice of bread', { easy: true }),
  count('egg', 'egg', 'an', 'eggs', 'quả trứng', '🥚', 'a white boiled egg', { easy: true }),
  mass('cheese', 'cheese', 'phô mai', '🧀', 'a wedge of yellow cheese with holes'),
  count('cookie', 'cookie', 'a', 'cookies', 'chiếc bánh quy', '🍪', 'a round chocolate chip cookie', { easy: true }),
  count('cake', 'cake', 'a', 'cakes', 'chiếc bánh ngọt', '🍰', 'a slice of strawberry cake'),
  count('ice-cream', 'ice cream', 'an', 'ice creams', 'cây kem', '🍦', 'an ice cream cone'),
  mass('pizza', 'pizza', 'bánh pizza', '🍕', 'a slice of pizza'),
  mass('rice', 'rice', 'cơm', '🍚', 'a bowl of white rice'),
  { id: 'noodles', en: 'noodles', vi: 'mì', kind: 'food', grammar: 'plural', emoji: '🍜', draw: 'a bowl of noodles' },
  mass('fish', 'fish', 'cá', '🐟', 'a cooked fish on a plate'),
  // Món quen với bé Việt (0.25.0, SPEC-content mục 4).
  count('mango', 'mango', 'a', 'mangoes', 'quả xoài', '🥭', 'a ripe yellow mango'),
  count('coconut', 'coconut', 'a', 'coconuts', 'quả dừa', '🥥', 'a brown coconut cut in half'),
  count('sweet-potato', 'sweet potato', 'a', 'sweet potatoes', 'củ khoai lang', '🍠', 'a roasted sweet potato'),
  count('rice-ball', 'rice ball', 'a', 'rice balls', 'nắm xôi', '🍙', 'a white sticky rice ball'),
  count('dumpling', 'dumpling', 'a', 'dumplings', 'chiếc bánh bao', '🥟', 'a soft steamed bun'),
  mass('soup', 'soup', 'canh', '🍲', 'a bowl of hot soup'),
  { ...mass('milk', 'milk', 'sữa', '🥛', 'a glass of milk'), kind: 'drink' },
  { ...mass('juice', 'juice', 'nước ép', '🧃', 'a glass of orange juice'), kind: 'drink' },
  { ...mass('water', 'water', 'nước', '💧', 'a glass of water'), kind: 'drink' },
  { ...count('sock', 'sock', 'a', 'socks', 'cái tất', '🧦', 'a striped sock'), kind: 'silly' },
  { ...count('shoe', 'shoe', 'a', 'shoes', 'chiếc giày', '👟', 'a sneaker shoe'), kind: 'silly' },
  { ...count('teddy', 'teddy', 'a', 'teddies', 'con gấu bông', '🧸', 'a teddy bear'), kind: 'silly' },
  { ...count('ball', 'ball', 'a', 'balls', 'quả bóng', '⚽', 'a football'), kind: 'silly' },
];

const KINDS = ['food', 'drink', 'silly'];
const GRAMMARS = ['count', 'mass', 'plural'];
const text = (v, max = 30) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);

/**
 * Món bố mẹ thêm (cài đặt `feedCustom`): bỏ món hỏng (thiếu tên / loại danh từ, đếm được mà thiếu a/an hoặc số nhiều,
 * đồ không ăn được mà không đếm được) và mã trùng.
 */
export function cleanCustomFoods(list) {
  const out = [];
  const ids = new Set(BUILTIN_FOODS.map((f) => f.id));
  for (const raw of Array.isArray(list) ? list : []) {
    if (!raw || typeof raw !== 'object') continue;
    const id = text(raw.id, 60);
    const en = text(raw.en).toLowerCase();
    const vi = text(raw.vi);
    if (!/^custom-[\w-]+$/.test(id) || ids.has(id) || !en || !vi) continue;
    if (!KINDS.includes(raw.kind) || !GRAMMARS.includes(raw.grammar)) continue;
    const food = { id, en, vi, kind: raw.kind, grammar: raw.grammar, emoji: '🍽️', draw: text(raw.draw, 80) || en, custom: true };
    if (raw.grammar === 'count') {
      if (!['a', 'an'].includes(raw.article) || !text(raw.plural)) continue;
      food.article = raw.article;
      food.plural = text(raw.plural).toLowerCase();
    }
    if (food.kind === 'silly' && food.grammar !== 'count') continue;
    ids.add(id);
    out.push(food);
  }
  return out;
}

export const allFoods = (custom = []) => [...BUILTIN_FOODS, ...cleanCustomFoods(custom)];

// ---------- Câu nói ----------
const NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five'];
const NUMBERS_VI = ['Không', 'Một', 'Hai', 'Ba', 'Bốn', 'Năm'];
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const verbVi = (f) => (f.kind === 'drink' ? 'uống' : 'ăn');

/** Cụm xin: a banana / an apple / some milk / some grapes. */
export const requestPhrase = (f) => (f.grammar === 'count' ? `${f.article} ${f.en}` : `some ${f.en}`);
/** Cụm đếm: two cookies (n = 1 → a cookie). */
export const countPhrase = (f, n) => (n > 1 ? `${NUMBERS[n]} ${f.plural}` : requestPhrase(f));
/** Câu nhầm: that's an apple / that's milk / those are grapes. */
export const thatPhrase = (f) => {
  if (f.grammar === 'plural') return `those are ${f.en}`;
  return f.grammar === 'count' ? `that's ${f.article} ${f.en}` : `that's ${f.en}`;
};
const viCount = (f, n) => (n > 1 ? `${n} ${f.vi}` : f.vi);

export const HUNGRY_LINE = ["I'm hungry!", 'Bông đói quá!'];
export const AGAIN_LINE = ["I'm hungry again!", 'Bông lại đói rồi!'];
export const YUMMY_LINE = ['Yummy! Thank you!', 'Ngon quá! Cảm ơn con!'];
export const FULL_LINE = ["I'm full! Burp! Thank you!", 'Bông no rồi! Ợ! Cảm ơn con!'];
export const GIGGLE_LINE = ['Hee hee!', 'Hi hi!'];

/** Câu xin của một lượt: { food, count }. */
export function requestLine({ food, count: n = 1 }) {
  if (food.kind === 'drink') return [`I'm thirsty! I want ${requestPhrase(food)}!`, `Bông khát quá! Bông muốn uống ${food.vi}!`];
  return [`I want ${countPhrase(food, n)}!`, `Bông muốn ăn ${viCount(food, n)}!`];
}

/** Nhắc phần còn thiếu ở mức đếm: "One more cookie, please!". */
export function moreLine({ food, count: n, got }) {
  const left = n - got;
  return [`${capital(NUMBERS[left])} more ${left === 1 ? food.en : food.plural}, please!`, `Thêm ${left} ${food.vi} nữa nhé!`];
}

/** Câu nói khi Bông được nhắc / bé chạm Bông: câu xin, hoặc phần còn thiếu nếu đang đếm dở. */
export const remindLine = (req) => (req.got > 0 && req.got < req.count ? moreLine(req) : requestLine(req));

/** Đưa nhầm: "Hmm, that's an apple! I want a banana!" (đang đếm dở: "I want one more cookie!"). */
export function wrongLine(given, req) {
  const { food, count: n = 1, got = 0 } = req;
  const left = n - got;
  const want = got > 0
    ? [`I want ${NUMBERS[left]} more ${left === 1 ? food.en : food.plural}!`, `Bông muốn ${verbVi(food)} thêm ${left} ${food.vi} cơ!`]
    : [`I want ${countPhrase(food, n)}!`, `Bông muốn ${verbVi(food)} ${viCount(food, n)} cơ!`];
  return [`Hmm, ${thatPhrase(given)}! ${want[0]}`, `Đó là ${given.vi}! ${want[1]}`];
}

/** Đồ không ăn được: "Yuck! A sock! I can't eat a sock!". */
export const yuckLine = (s) => [`Yuck! ${capital(s.article)} ${s.en}! I can't eat ${s.article} ${s.en}!`, `Eo ơi! ${capital(s.vi)}! Bông không ăn ${s.vi} được!`];

/** Đếm khi nhận từng cái: "One!" … cái cuối "Two! Yummy! Thank you!". */
export function countLine(got, done) {
  if (!done) return [`${capital(NUMBERS[got])}!`, `${NUMBERS_VI[got]}!`];
  return [`${capital(NUMBERS[got])}! ${YUMMY_LINE[0]}`, `${NUMBERS_VI[got]}! ${YUMMY_LINE[1]}`];
}

// ---------- Khay, lượt, mức ----------
const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const edible = (f) => f.kind !== 'silly';
const canRequest = (f, level) => edible(f) && (level < 3 || f.grammar === 'count');

/**
 * Khay đầu vòng.
 * - Mức 1: 3 món dễ. Mức 2: 5 món, có 1 đồ uống; bật "bất ngờ vui" thì có thể 1 đồ không ăn được.
 * - Mức 3: 4 món đếm được (không đồ uống, không đồ không ăn được).
 */
export function makeTray(level, { foods = BUILTIN_FOODS, silly = true, rng = Math.random } = {}) {
  const size = TRAY_SIZE[level] ?? TRAY_SIZE[1];
  const meals = foods.filter((f) => f.kind === 'food');
  if (level <= 1) {
    const easy = meals.filter((f) => f.easy);
    return shuffle(easy.length >= size ? easy : meals, rng).slice(0, size);
  }
  if (level >= 3) return shuffle(meals.filter((f) => f.grammar === 'count'), rng).slice(0, size);
  const drinks = shuffle(foods.filter((f) => f.kind === 'drink'), rng);
  const sillies = shuffle(foods.filter((f) => f.kind === 'silly'), rng);
  const withSilly = silly && sillies.length && rng() < 0.6;
  const picks = [...drinks.slice(0, 1), ...(withSilly ? sillies.slice(0, 1) : [])];
  picks.push(...shuffle(meals, rng).slice(0, size - picks.length));
  return shuffle(picks, rng);
}

/**
 * Lượt mới: món ngẫu nhiên trong khay (không lặp món vừa xin), số lượng ở mức 3.
 * Số xin không vượt số nấc bụng còn lại. Vòng đầu ở mức 3 chỉ xin 2.
 * @returns {{ food: object, count: number, got: number, wrong: number } | null}
 */
export function pickRequest(tray, { level = 1, last = null, bellyLeft = BELLY, firstRound = false, rng = Math.random } = {}) {
  const ok = tray.filter((f) => canRequest(f, level));
  if (!ok.length) return null;
  const fresh = ok.length > 1 ? ok.filter((f) => f.id !== last) : ok;
  const food = fresh[Math.floor(rng() * fresh.length)];
  let n = 1;
  if (level >= 3) n = firstRound ? 2 : [1, 2, 2, 3, 3][Math.floor(rng() * 5)];
  return { food, count: Math.max(1, Math.min(n, bellyLeft)), got: 0, wrong: 0 };
}

/** Mức đã lưu (cài đặt `feed`). */
export function cleanFeedState(saved) {
  const s = saved && typeof saved === 'object' ? saved : {};
  const level = Number.isInteger(s.level) && s.level >= 1 && s.level <= MAX_LEVEL ? s.level : 1;
  const rounds = Number.isInteger(s.rounds) && s.rounds >= 0 ? s.rounds : 0;
  const lock = Number.isInteger(s.lock) && s.lock >= 1 && s.lock <= MAX_LEVEL ? s.lock : null;
  return { level: lock ?? level, rounds, lock };
}

/** Sau một vòng no bụng: đếm vòng, đủ 2 vòng thì lên mức (trừ khi bố mẹ khóa mức). */
export function afterRound(state) {
  if (state.lock) return { ...state, level: state.lock, rounds: state.rounds + 1 };
  const rounds = state.rounds + 1;
  if (state.level < MAX_LEVEL && rounds >= ROUNDS_TO_LEVEL_UP) return { ...state, level: state.level + 1, rounds: 0 };
  return { ...state, rounds };
}

// ---------- Prompt ảnh nền (F3; ảnh lưới món / Bông dùng bộ tạo ảnh lưới chung) ----------
const STYLE = 'cute, simple, colorful children\'s picture-book illustration, soft shading, thick clean outlines';

/** Prompt ảnh nền bàn ăn. */
export const BACKGROUND_PROMPT = [
  'Create a landscape 4:3 background illustration of a cozy, bright kitchen dining table seen from the front.',
  `Style: ${STYLE}, soft pastel colors, low contrast.`,
  'Leave the CENTER of the picture empty (a character will be placed there) and keep the bottom quarter plain (a food tray goes there).',
  'No characters, no animals, no food, NEVER write any text.',
].join('\n');
