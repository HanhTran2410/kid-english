// Trò Đầu bếp nhí (SPEC-jobs3.md mục 5): rửa tay mở đầu; ca A làm bánh mì kẹp (xếp lớp theo thẻ công thức, mức 3 có
// "No tomato, please!"), ca B làm bánh nướng (động từ pour / crack / mix / bake, mức 3 theo thứ tự), ca C trang trí bánh
// (đếm, mức 3 hai loại). Không dao, không lửa bếp. File thuần: dữ liệu, kế hoạch lượt (bất biến mục 2.2), câu nói.

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

/** Bất biến của một ca (SPEC-jobs3 mục 2.2). */
export function caseOk(c, level) {
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
export const caseActions = (c) => (c.kind === 'sandwich' ? c.layers.length + 1 : c.kind === 'bake' ? c.steps.length + 1 : c.want.reduce((n, w) => n + w.n, 0));

/** Kế hoạch một lượt (mục 5.4): mức 1 và 3 theo thứ tự A + B + C, mức 2 xáo. */
export function planRound(level, { rng = Math.random, seen = {} } = {}) {
  const make = () => {
    const kinds = level === 2 ? shuffle(['sandwich', 'bake', 'decor'], rng) : ['sandwich', 'bake', 'decor'];
    const maker = { sandwich: makeSandwichCase, bake: makeBakeCase, decor: makeDecorCase };
    return { cases: kinds.map((k) => maker[k](level, { rng, seen })), customers: shuffle(PATIENTS.map((p) => p.id), rng).slice(0, CASES_PER_ROUND) };
  };
  const ok = (p) => p.cases.length === CASES_PER_ROUND && p.cases.every((c) => caseOk(c, level) && caseActions(c) <= 5);
  return planChecked(make, ok, () => fallbackPlan(level));
}
export function fallbackPlan(level) {
  const sandwich = level <= 1
    ? { kind: 'sandwich', layers: ['bread', 'cheese', 'bread'], tray: ['bread', 'cheese', 'tomato'], no: null }
    : { kind: 'sandwich', layers: ['bread', 'cheese', 'lettuce', 'bread'], tray: ['bread', 'cheese', 'lettuce', 'tomato'], no: level >= 3 ? 'tomato' : null };
  const bake = level <= 1 ? { kind: 'bake', steps: ['pour', 'mix', 'bake'], tools: ['milk', 'spoon'], ordered: false }
    : { kind: 'bake', steps: ['pour', 'crack', 'mix', 'bake'], tools: ['milk', 'egg', 'spoon'], ordered: level >= 3 };
  const decor = level >= 3 ? { kind: 'decor', want: [{ id: 'strawberry', n: 2 }, { id: 'cherry', n: 1 }], tray: ['strawberry', 'cherry', 'star'] }
    : { kind: 'decor', want: [{ id: 'strawberry', n: 2 }], tray: ['strawberry', 'cherry'] };
  return { cases: [sandwich, bake, decor], customers: ['teddy', 'kitty', 'puppy'] };
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
