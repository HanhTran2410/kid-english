// Trò Đầu bếp nhí (SPEC-jobs3.md mục 5, SPEC-jobs4.md mục 3): rửa tay mở đầu; ca A làm bánh mì kẹp (xếp lớp theo thẻ
// công thức, mức 3 có "No tomato, please!"), ca B làm bánh nướng (động từ pour / crack / mix / bake, mức 3 theo thứ tự),
// ca C trang trí bánh (đếm, mức 3 hai loại), ca D món nóng – món lạnh (thay A / C luân phiên); cuối lượt mức 2–3 dọn bếp.
// Không dao, không lửa bếp. File thuần: dữ liệu, kế hoạch lượt (bất biến mục 2.2), câu nói.

import { planChecked, shuffle, pick, randInt, leastSeen, NUMBER_WORDS, cap } from './levels.js';
import { PATIENTS } from '../doctor.js';

export const MAX_LEVEL = 3;
export const CASES_PER_ROUND = 3;

/** Lớp bánh mì kẹp: `that` câu "That's …", `say` tên gọi ngắn ("Cheese!"). */
export const LAYERS = {
  bread: { name: 'bread', that: "That's bread.", emoji: '🍞', vi: 'bánh mì', lesson: true },
  cheese: { name: 'cheese', that: "That's cheese.", emoji: '🧀', vi: 'phô mai', lesson: false },
  tomato: { name: 'tomato', that: "That's a tomato.", emoji: '🍅', vi: 'cà chua', lesson: false },
  lettuce: { name: 'lettuce', that: "That's lettuce.", emoji: '🥬', vi: 'rau xà lách', lesson: false },
  egg: { name: 'egg', that: "That's an egg.", emoji: '🍳', vi: 'trứng', lesson: true },
};
const FILLINGS = ['cheese', 'tomato', 'lettuce'];
/** Bước làm bánh nướng: động từ, đồ cần chạm, câu. */
export const BAKE_STEPS = {
  pour: { tool: 'milk', say: 'Pour the milk!', verb: 'Pour!', vi: 'Rót sữa vào nào!' },
  crack: { tool: 'egg', say: 'Crack the egg!', verb: 'Crack!', vi: 'Đập trứng nào!' },
  mix: { tool: 'spoon', say: 'Mix!', verb: 'Mix, mix, mix!', vi: 'Khuấy đều nào!' },
  bake: { tool: 'bowl', say: 'In the oven!', verb: 'Bake!', vi: 'Cho vào lò nướng nào!' },
};
export const TOOLS = {
  milk: { that: "That's the milk.", emoji: '🥛', vi: 'sữa' },
  egg: { that: "That's the egg.", emoji: '🥚', vi: 'quả trứng' },
  spoon: { that: "That's the spoon.", emoji: '🥄', vi: 'cái thìa' },
  bowl: { that: "That's the bowl.", emoji: '🥣', vi: 'cái bát' },
};
/** Đồ trang trí: số ít / số nhiều. */
export const DECOR = {
  strawberry: { one: 'strawberry', many: 'strawberries', emoji: '🍓', vi: 'quả dâu' },
  cherry: { one: 'cherry', many: 'cherries', emoji: '🍒', vi: 'quả anh đào' },
  blueberry: { one: 'blueberry', many: 'blueberries', emoji: '🫐', vi: 'quả việt quất' },
  star: { one: 'star', many: 'stars', emoji: '⭐', vi: 'ngôi sao' },
  candle: { one: 'candle', many: 'candles', emoji: '🕯️', vi: 'cây nến' },
};
const DECOR_IDS = Object.keys(DECOR);
/** Ca D (SPEC-jobs4 3.1): món nóng có hơi bốc lên, món lạnh có đá; `word`: từ bài Food ghi "đã gặp" ở mức 3. */
export const DISHES = {
  soup: { hot: true, name: 'soup', that: "That's soup.", emoji: '🍲', vi: 'súp' },
  'hot-milk': { hot: true, name: 'hot milk', that: "That's hot milk.", emoji: '☕', vi: 'sữa nóng', word: 'milk' },
  'ice-cream': { hot: false, name: 'ice cream', that: "That's ice cream.", emoji: '🍦', vi: 'kem' },
  'cold-milk': { hot: false, name: 'cold milk', that: "That's cold milk.", emoji: '🥛', vi: 'sữa lạnh', word: 'milk' },
  'cold-water': { hot: false, name: 'cold water', that: "That's cold water.", emoji: '🧊', vi: 'nước lạnh', word: 'water' },
};
const DISH_IDS = Object.keys(DISHES);
/** Mức 3: 4 món cố định theo món khách gọi (đúng một món khớp; có cùng món khác nóng / lạnh hoặc cùng nóng / lạnh khác món). */
export const TEMP_COMBOS = {
  'hot-milk': ['hot-milk', 'cold-milk', 'soup', 'ice-cream'],
  'cold-milk': ['cold-milk', 'hot-milk', 'cold-water', 'ice-cream'],
  soup: ['soup', 'hot-milk', 'ice-cream', 'cold-water'],
  'ice-cream': ['ice-cream', 'cold-milk', 'soup', 'hot-milk'],
  'cold-water': ['cold-water', 'cold-milk', 'hot-milk', 'soup'],
};
/** Dọn bếp (SPEC-jobs4 3.2): mỗi đồ đúng một chỗ hợp lý; `word`: từ bài Food. */
export const CLEAN_ITEMS = {
  milk: { place: 'fridge', name: 'milk', emoji: '🥛', vi: 'sữa', word: 'milk' },
  juice: { place: 'fridge', name: 'juice', emoji: '🧃', vi: 'nước ép' },
  bowl: { place: 'sink', name: 'bowl', emoji: '🥣', vi: 'cái bát' },
  cup: { place: 'sink', name: 'cup', emoji: '🍵', vi: 'cái cốc' },
  bread: { place: 'cupboard', name: 'bread', emoji: '🍞', vi: 'bánh mì', word: 'bread' },
  eggs: { place: 'cupboard', name: 'eggs', emoji: '🥚', vi: 'hộp trứng', word: 'egg' },
};
export const PLACES = {
  sink: { name: 'sink', vi: 'bồn rửa' },
  fridge: { name: 'fridge', vi: 'tủ lạnh' },
  cupboard: { name: 'cupboard', vi: 'tủ bát' },
};
export const PLACE_ORDER = ['sink', 'fridge', 'cupboard'];

// ---------- Kế hoạch từng ca ----------
/**
 * Ca A — bánh mì kẹp: { kind: 'sandwich', layers: [mã lớp từ dưới lên], tray, no }.
 * Mức 1: bread, cheese, bread; mức 2: bread + 2 nhân khác nhau + bread; mức 3: như mức 2 + một món "No …" trong khay.
 * Nhân không có egg (egg đã là đáp án ở bước "Crack the egg!" — SPEC-jobs3 mục 2.7); egg chỉ làm đồ nhiễu.
 */
export function makeSandwichCase(level, { rng = Math.random, seen = {} } = {}) {
  if (level <= 1) return { kind: 'sandwich', layers: ['bread', 'cheese', 'bread'], tray: shuffle(['bread', 'cheese', pick(['tomato', 'lettuce'], rng)], rng), no: null };
  const [a, b, c] = leastSeen(FILLINGS, seen, rng); // ưu tiên nhân ít gặp (mục 2.7)
  const layers = ['bread', a, b, 'bread'];
  const no = level >= 3 ? c : null;
  const tray = shuffle(['bread', a, b, level >= 3 ? c : pick([c, 'egg'], rng)], rng);
  return { kind: 'sandwich', layers, tray, no };
}
/**
 * Ca B — bánh nướng: { kind: 'bake', steps: [động từ], tools: [đồ trên bàn], ordered }.
 * Mức 1: pour → mix → bake, mỗi bước chỉ một đồ sáng (không nhầm); mức 2: pour → crack → mix → bake, 3 đồ trên bàn;
 * mức 3: thẻ 3 bước (pour / crack / mix xáo), luôn kết thúc bằng bake, phải đúng thứ tự.
 */
export function makeBakeCase(level, { rng = Math.random } = {}) {
  if (level <= 1) return { kind: 'bake', steps: ['pour', 'mix', 'bake'], tools: ['milk', 'spoon'], ordered: false };
  if (level === 2) return { kind: 'bake', steps: ['pour', 'crack', 'mix', 'bake'], tools: shuffle(['milk', 'egg', 'spoon'], rng), ordered: false };
  return { kind: 'bake', steps: [...shuffle(['pour', 'crack', 'mix'], rng), 'bake'], tools: shuffle(['milk', 'egg', 'spoon'], rng), ordered: true };
}
/**
 * Ca C — trang trí: { kind: 'decor', want: [{ id, n }], tray }.
 * Mức 1: một loại 1–3 cái; mức 2: một loại 2–5 cái; mức 3: hai loại, tổng ≤ 5, khay có thêm 1 loại không được gọi.
 */
export function makeDecorCase(level, { rng = Math.random, seen = {} } = {}) {
  const ids = leastSeen(DECOR_IDS, seen, rng);
  let want;
  if (level <= 1) want = [{ id: ids[0], n: randInt(1, 3, rng) }];
  else if (level === 2) want = [{ id: ids[0], n: randInt(2, 5, rng) }];
  else {
    const n1 = randInt(1, 3, rng);
    want = [{ id: ids[0], n: n1 }, { id: ids[1], n: randInt(1, Math.min(2, 5 - n1), rng) }];
  }
  const tray = shuffle([...want.map((w) => w.id), ids[want.length]], rng);
  return { kind: 'decor', want, tray };
}

/**
 * Ca D — món nóng, món lạnh: { kind: 'temp', want: 'hot' | 'cold', dish: mã món | null, tray }.
 * Mức 1: khách lạnh → món nóng, khách nóng → món lạnh, khay 1 nóng + 1 lạnh; mức 2: khay món đúng + 2 món phía ngược lại;
 * mức 3: khách gọi đúng món, khay theo `TEMP_COMBOS`.
 */
export function makeTempCase(level, { rng = Math.random, seen = {} } = {}) {
  const want = pick(['hot', 'cold'], rng);
  const side = (hot) => DISH_IDS.filter((id) => DISHES[id].hot === hot);
  if (level <= 1) {
    const right = leastSeen(side(want === 'hot'), seen, rng)[0];
    return { kind: 'temp', want, dish: null, tray: shuffle([right, pick(side(want !== 'hot'), rng)], rng) };
  }
  if (level === 2) {
    const right = leastSeen(side(want === 'hot'), seen, rng)[0];
    const others = shuffle(side(want !== 'hot'), rng).slice(0, 2);
    return { kind: 'temp', want, dish: null, tray: shuffle([right, ...others], rng) };
  }
  const dish = leastSeen(DISH_IDS, seen, rng)[0];
  return { kind: 'temp', want: DISHES[dish].hot ? 'hot' : 'cold', dish, tray: shuffle(TEMP_COMBOS[dish], rng) };
}
/** Món khớp yêu cầu của ca D. */
export const tempMatches = (c) => c.tray.filter((id) => (c.dish ? id === c.dish : DISHES[id].hot === (c.want === 'hot')));

/**
 * Dọn bếp (mức 2–3): { items: [đồ trên bàn], asks: [2 đồ cần cất, theo thứ tự] }. Hai đồ cần cất ở hai chỗ khác nhau;
 * mức 3 thêm 1 đồ nhiễu trên bàn. Không dùng đồ có từ đã là đáp án ở ca D (`avoid` — SPEC-jobs3 2.7).
 */
export function makeClean(level, { rng = Math.random, avoid = [] } = {}) {
  const ids = shuffle(Object.keys(CLEAN_ITEMS).filter((id) => !avoid.includes(CLEAN_ITEMS[id].word)), rng);
  const first = ids[0];
  const second = ids.find((id) => CLEAN_ITEMS[id].place !== CLEAN_ITEMS[first].place);
  const asks = [first, second];
  const extra = level >= 3 ? ids.find((id) => !asks.includes(id)) : null;
  return { items: shuffle(extra ? [...asks, extra] : asks, rng), asks };
}
export function cleanOk(cl, level) {
  if (!cl || cl.asks.length !== 2 || cl.asks.some((id) => !CLEAN_ITEMS[id])) return false;
  if (CLEAN_ITEMS[cl.asks[0]].place === CLEAN_ITEMS[cl.asks[1]].place) return false;
  if (!cl.asks.every((id) => cl.items.includes(id)) || new Set(cl.items).size !== cl.items.length) return false;
  return cl.items.length === (level >= 3 ? 3 : 2);
}

/** Bất biến của một ca (SPEC-jobs3 mục 2.2). */
export function caseOk(c, level) {
  if (c.kind === 'temp') {
    if (new Set(c.tray).size !== c.tray.length || !c.tray.every((id) => DISHES[id])) return false;
    if (c.tray.length !== (level <= 1 ? 2 : level === 2 ? 3 : 4) || tempMatches(c).length !== 1) return false;
    if (level >= 3) return Boolean(c.dish) && (c.want === 'hot') === DISHES[c.dish].hot;
    return c.dish === null;
  }
  if (c.kind === 'sandwich') {
    const need = new Set(c.layers);
    if (![...need].every((id) => c.tray.includes(id))) return false;
    if (c.no && (c.layers.includes(c.no) || !c.tray.includes(c.no))) return false;
    if (c.layers.includes('egg')) return false;
    return c.tray.some((id) => !need.has(id)) && c.layers.length === (level <= 1 ? 3 : 4);
  }
  if (c.kind === 'bake') {
    if (c.steps.at(-1) !== 'bake' || new Set(c.steps).size !== c.steps.length) return false;
    return c.steps.filter((s) => s !== 'bake').every((s) => c.tools.includes(BAKE_STEPS[s].tool));
  }
  if (c.kind === 'decor') {
    const total = c.want.reduce((n, w) => n + w.n, 0);
    if (total < 1 || total > 5 || c.want.some((w) => w.n < 1)) return false;
    if (!c.want.every((w) => c.tray.includes(w.id))) return false;
    return c.tray.some((id) => !c.want.some((w) => w.id === id));
  }
  return false;
}
/** Số thao tác con của bé trong ca (đưa đĩa / bánh cho khách tính một; bánh trang trí tự mang ra). */
export const caseActions = (c) => (c.kind === 'temp' ? 2 : c.kind === 'sandwich' ? c.layers.length + 1 : c.kind === 'bake' ? c.steps.length + 1 : c.want.reduce((n, w) => n + w.n, 0));

/** Ca D thay bánh mì kẹp ở lượt lẻ (`rounds` chẵn: lượt 1, 3…), thay trang trí ở lượt chẵn (SPEC-jobs4 3.1). */
export const replacedByTemp = (rounds) => ((rounds ?? 0) % 2 === 0 ? 'sandwich' : 'decor');
/** Từ bài Food là đáp án của ca D (để dọn bếp tránh — SPEC-jobs3 2.7). */
const tempWords = (cases) => cases.filter((c) => c.kind === 'temp' && c.dish).map((c) => DISHES[c.dish].word).filter(Boolean);

/**
 * Kế hoạch một lượt (SPEC-jobs4 3.1, thay SPEC-jobs3 5.4): ca B giữ; ca D thay A hoặc C luân phiên theo `rounds`;
 * mức 1 và 3 theo thứ tự, mức 2 xáo. Mức 2–3 có dọn bếp cuối lượt (`clean`).
 */
export function planRound(level, { rng = Math.random, seen = {}, rounds = 0 } = {}) {
  const make = () => {
    const base = ['sandwich', 'bake', 'decor'].map((k) => (k === replacedByTemp(rounds) ? 'temp' : k));
    const kinds = level === 2 ? shuffle(base, rng) : base;
    const maker = { sandwich: makeSandwichCase, bake: makeBakeCase, decor: makeDecorCase, temp: makeTempCase };
    const cases = kinds.map((k) => maker[k](level, { rng, seen }));
    const clean = level >= 2 ? makeClean(level, { rng, avoid: tempWords(cases) }) : null;
    return { cases, customers: shuffle(PATIENTS.map((p) => p.id), rng).slice(0, CASES_PER_ROUND), clean };
  };
  const ok = (p) => p.cases.length === CASES_PER_ROUND && p.cases.every((c) => caseOk(c, level) && caseActions(c) <= 5)
    && (level <= 1 ? p.clean === null : cleanOk(p.clean, level) && !p.clean.asks.some((id) => tempWords(p.cases).includes(CLEAN_ITEMS[id].word)));
  return planChecked(make, ok, () => fallbackPlan(level, rounds));
}
export function fallbackPlan(level, rounds = 0) {
  const sandwich = level <= 1
    ? { kind: 'sandwich', layers: ['bread', 'cheese', 'bread'], tray: ['bread', 'cheese', 'tomato'], no: null }
    : { kind: 'sandwich', layers: ['bread', 'cheese', 'lettuce', 'bread'], tray: ['bread', 'cheese', 'lettuce', 'tomato'], no: level >= 3 ? 'tomato' : null };
  const bake = level <= 1 ? { kind: 'bake', steps: ['pour', 'mix', 'bake'], tools: ['milk', 'spoon'], ordered: false }
    : { kind: 'bake', steps: ['pour', 'crack', 'mix', 'bake'], tools: ['milk', 'egg', 'spoon'], ordered: level >= 3 };
  const decor = level >= 3 ? { kind: 'decor', want: [{ id: 'strawberry', n: 2 }, { id: 'cherry', n: 1 }], tray: ['strawberry', 'cherry', 'star'] }
    : { kind: 'decor', want: [{ id: 'strawberry', n: 2 }], tray: ['strawberry', 'cherry'] };
  const temp = level <= 1 ? { kind: 'temp', want: 'hot', dish: null, tray: ['soup', 'ice-cream'] }
    : level === 2 ? { kind: 'temp', want: 'cold', dish: null, tray: ['ice-cream', 'soup', 'hot-milk'] }
      : { kind: 'temp', want: 'hot', dish: 'soup', tray: TEMP_COMBOS.soup };
  const cases = [sandwich, bake, decor].map((c) => (c.kind === replacedByTemp(rounds) ? temp : c));
  const clean = level >= 2 ? { items: level >= 3 ? ['bowl', 'bread', 'juice'] : ['bowl', 'bread'], asks: ['bowl', 'bread'] } : null;
  return { cases, customers: ['teddy', 'kitty', 'puppy'], clean };
}

// ---------- Câu nói ([en, vi]) ----------
export const WASH_LINE = ['Wash your hands!', 'Rửa tay nào!'];
export const COOK_LINE = ["Let's cook!", 'Mình nấu ăn nào!'];
export const SANDWICH_LINE = ['A sandwich, please!', 'Cho tớ một cái bánh mì kẹp nhé!'];
export const CAKE_LINE = ['A cake, please!', 'Cho tớ một cái bánh nhé!'];
export const READY_LINE = ["It's ready!", 'Xong rồi!'];
export const HOT_LINE = ['Hot! Wait!', 'Nóng! Chờ chút nhé!'];
export const NOW_READY_LINE = ["Now it's ready!", 'Giờ thì ăn được rồi!'];
export const THANKS_LINE = ['Yummy! Thank you!', 'Ngon quá! Cảm ơn bạn!'];
export const ENOUGH_LINE = ["That's enough!", 'Đủ rồi!'];
export const GIVE_LINE = ['Give it to the customer!', 'Mang cho khách nào!'];
export const layerName = (id) => cap(LAYERS[id].name);
/** Chú đầu bếp gọi lớp (mức 1): "Bread!". */
export const layerCallLine = (id) => [`${layerName(id)}!`, `${cap(LAYERS[id].vi)}!`];
/** Khách nói cả món (mức 2–3): "Bread, cheese, tomato, bread!". */
export const orderLine = (layers) => [`${layers.map((id, i) => (i ? LAYERS[id].name : layerName(id))).join(', ')}!`, `${layers.map((id) => LAYERS[id].vi).join(', ')}!`];
export const noLine = (id) => [`No ${LAYERS[id].name}, please!`, `Đừng cho ${LAYERS[id].vi} nhé!`];
export const layerWrongLine = (given, want) => [`${LAYERS[given].that} ${layerName(want)}, please!`, `Đó là ${LAYERS[given].vi}. Cho ${LAYERS[want].vi} nhé!`];
/** Câu bước bánh nướng; mức 3 nói cả chuỗi: "First, pour the milk. Then, crack the egg. Then, mix!". */
export const stepLine = (s) => [BAKE_STEPS[s].say, BAKE_STEPS[s].vi];
export const verbLine = (s) => [BAKE_STEPS[s].verb, BAKE_STEPS[s].vi];
const lower = (t) => t.charAt(0).toLowerCase() + t.slice(1).replace(/!$/, '');
export function chainLine(steps) {
  const verbs = steps.filter((s) => s !== 'bake');
  const en = verbs.map((s, i) => `${i ? 'Then' : 'First'}, ${lower(BAKE_STEPS[s].say)}.`).join(' ').replace(/\.$/, '!');
  return [en, verbs.map((s) => BAKE_STEPS[s].vi.replace(/ nào!$/, '')).join(', rồi ')];
}
export const firstLine = (s) => [`First, ${lower(BAKE_STEPS[s].say)}!`, `Trước tiên, ${BAKE_STEPS[s].vi.toLowerCase()}`];
export const toolWrongLine = (tool, s) => [`${TOOLS[tool].that} ${BAKE_STEPS[s].say}`, `Đó là ${TOOLS[tool].vi}. ${BAKE_STEPS[s].vi}`];
const decorWord = (id, n) => (n === 1 ? DECOR[id].one : DECOR[id].many);
/** "Three strawberries, please!" / "Two strawberries and one cherry, please!". */
export const decorAskLine = (want) => [`${cap(want.map((w) => `${NUMBER_WORDS[w.n]} ${decorWord(w.id, w.n)}`).join(' and '))}, please!`, `Cho tớ ${want.map((w) => `${w.n} ${DECOR[w.id].vi}`).join(' và ')} nhé!`];
/** Đặt sai loại: "That's a blueberry. Strawberries, please!" (gọi các loại còn thiếu). */
export const decorWrongLine = (given, missing) => [`That's a ${DECOR[given].one}. ${cap(missing.map((id) => DECOR[id].many).join(' and '))}, please!`, `Đó là ${DECOR[given].vi}. Cho ${missing.map((id) => DECOR[id].vi).join(' và ')} nhé!`];
export const countLine = (n) => [`${cap(NUMBER_WORDS[n])}!`, `${n}!`];

// ---------- Ca D — món nóng, món lạnh (SPEC-jobs4 3.1) ----------
const dishName = (id) => cap(DISHES[id].name);
/** Mức 1: khách nói mình lạnh / nóng ("I'm cold!"), chú đầu bếp gợi ý ("Something hot!"). */
export const feelLine = (want) => (want === 'hot' ? ["I'm cold!", 'Tớ lạnh quá!'] : ["I'm hot!", 'Tớ nóng quá!']);
export const somethingLine = (want) => (want === 'hot' ? ['Something hot!', 'Món gì nóng nhé!'] : ['Something cold!', 'Món gì lạnh nhé!']);
/** Khách gọi (mức 2: "Something cold, please!"; mức 3: "Hot milk, please!"). */
export const tempAskLine = (c) => (c.dish
  ? [`${dishName(c.dish)}, please!`, `Cho tớ ${DISHES[c.dish].vi} nhé!`]
  : c.want === 'hot' ? ['Something hot, please!', 'Cho tớ món gì nóng nhé!'] : ['Something cold, please!', 'Cho tớ món gì lạnh nhé!']);
export const tempWrongLine = (c, given) => [`${DISHES[given].that} ${tempAskLine(c)[0]}`, `Đó là ${DISHES[given].vi}. ${tempAskLine(c)[1]}`];
export const CAREFUL_LINE = ['Hot! Careful!', 'Nóng đấy! Cẩn thận nhé!'];
export const PHEW_LINE = ['Phew, phew!', 'Phù, phù!'];
export const BRR_LINE = ['Brr! Yummy!', 'Brr! Ngon quá!'];
export const THANK_YOU_LINE = ['Thank you!', 'Cảm ơn bạn!'];

// ---------- Dọn bếp (SPEC-jobs4 3.2) ----------
export const CLEAN_LINE = ['Clean up time!', 'Dọn bếp nào!'];
export const ALL_CLEAN_LINE = ['All clean! Good job!', 'Sạch bóng rồi! Giỏi lắm!'];
const itemThe = (id) => `the ${CLEAN_ITEMS[id].name}`;
const placeOf = (id) => CLEAN_ITEMS[id].place;
/** Mức 2: "The milk goes in the fridge!"; mức 3: "Put the bread in the cupboard!"; yêu cầu thứ hai thêm "Now". */
export function cleanAskLine(id, level, second = false) {
  const p = PLACES[placeOf(id)];
  const it = CLEAN_ITEMS[id];
  if (level >= 3) return [`${second ? 'Now put' : 'Put'} ${itemThe(id)} in the ${p.name}!`, `${second ? 'Giờ cất' : 'Cất'} ${it.vi} vào ${p.vi} nhé!`];
  return [`${second ? 'Now the' : 'The'} ${it.name} ${it.name === 'eggs' ? 'go' : 'goes'} in the ${p.name}!`, `${cap(it.vi)} cất vào ${p.vi} nhé!`];
}
/** Chạm chỗ sai: "That's the sink. In the fridge, please!". */
export const placeWrongLine = (place, id) => [`That's the ${PLACES[place].name}. In the ${PLACES[placeOf(id)].name}, please!`, `Đó là ${PLACES[place].vi}. Cất vào ${PLACES[placeOf(id)].vi} nhé!`];
/** Mức 3 chạm đồ sai: "That's the bowl. The bread, please!". */
export const itemWrongLine = (given, id) => [`That's ${itemThe(given)}. ${cap(itemThe(id))}, please!`, `Đó là ${CLEAN_ITEMS[given].vi}. Lấy ${CLEAN_ITEMS[id].vi} nhé!`];
