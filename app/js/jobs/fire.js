// Trò Lính cứu hỏa (SPEC-jobs.md mục 7): dập những ngọn lửa nhỏ hoạt hình (Bông đếm), mức 2 hỏi "How many fires?",
// mức 3 Bông gọi chỗ ("The fire is on the roof!"); ca cứu bạn thú trên cây bằng thang (mức 2–3). File thuần để test được.
// SPEC-fire2.md: đầu lượt mặc đồ (helmet, jacket, boots), lái xe tới đúng nhà theo màu trước ca dập lửa.

import { PATIENTS, PATIENT_BY_ID } from '../doctor.js';
import { COLOR_BY_ID } from './post.js';

export const CASES_PER_ROUND = 3;
export const MAX_LEVEL = 3;
/** Chỗ có thể có lửa trên ngôi nhà (thứ tự vẽ). Mức 3 chỉ dùng mái / cửa sổ / cửa (mỗi chỗ một ngọn). */
export const SPOTS = ['roof', 'window', 'door', 'window2', 'chimney'];
export const PLACES = { roof: ['on the roof', 'trên mái nhà'], window: ['in the window', 'ở cửa sổ'], door: ['by the door', 'cạnh cửa ra vào'] };
const NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five'];
const NUMBERS_VI = ['không', 'một', 'hai', 'ba', 'bốn', 'năm'];
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const between = (lo, hi, rng) => lo + Math.floor(rng() * (hi - lo + 1));

/**
 * Ca dập lửa: { kind: 'fire', resident, fires: [{ id, spot }], order? }.
 * - Mức 1: 1–3 ngọn; mức 2: 2–5 ngọn (hết lửa thì hỏi số); mức 3: 3 ngọn ở mái / cửa sổ / cửa, `order` = thứ tự Bông gọi.
 */
export function makeFireCase(level, resident, { rng = Math.random } = {}) {
  if (level >= 3) {
    const spots = ['roof', 'window', 'door'];
    return { kind: 'fire', resident, fires: spots.map((spot, i) => ({ id: `f${i}`, spot })), order: shuffle(spots.map((_, i) => `f${i}`), rng) };
  }
  const n = level <= 1 ? between(1, 3, rng) : between(2, 5, rng);
  const spots = shuffle(SPOTS, rng).slice(0, n);
  return { kind: 'fire', resident, fires: spots.map((spot, i) => ({ id: `f${i}`, spot })) };
}

/** 3 thẻ số khác nhau trong 1–5, có đúng một thẻ là `n`, xáo vị trí. */
export function numberChoices(n, { rng = Math.random } = {}) {
  const others = shuffle([1, 2, 3, 4, 5].filter((x) => x !== n), rng).slice(0, 2);
  return shuffle([n, ...others], rng);
}

// ---------- Mặc đồ (SPEC-fire2 mục 3) ----------
/** Đồ lính cứu hỏa, theo thứ tự mặc mặc định. */
export const GEAR = ['helmet', 'jacket', 'boots'];
/** Món lạ ở mức 3 (không phải đồ cứu hỏa). */
export const ODD_GEAR = ['swimsuit', 'flipflops'];
/** [tiếng Anh, tiếng Việt, câu mặc (vi), câu xong (vi)]; `many`: danh từ số nhiều. */
export const GEAR_INFO = {
  helmet: { en: 'helmet', vi: 'mũ', putVi: 'Đội mũ vào nhé!', onVi: 'Đội mũ rồi!' },
  jacket: { en: 'jacket', vi: 'áo khoác', putVi: 'Mặc áo khoác vào nhé!', onVi: 'Mặc áo khoác rồi!' },
  boots: { en: 'boots', vi: 'ủng', putVi: 'Đi ủng vào nhé!', onVi: 'Đi ủng rồi!', many: true },
  swimsuit: { en: 'swimsuit', vi: 'đồ bơi', emoji: '🩱' },
  flipflops: { en: 'flip-flops', vi: 'dép tông', emoji: '🩴', many: true },
};

/** Mặc đồ theo mức: mức 1 thứ tự tùy bé (`order` chỉ để nhắc), mức 2–3 Bông gọi theo `order`; mức 3 thêm một món lạ. */
export function planGear(level, { rng = Math.random } = {}) {
  const order = level >= 2 ? shuffle(GEAR, rng) : [...GEAR];
  const odd = level >= 3 ? shuffle(ODD_GEAR, rng)[0] : null;
  return { order, odd, tray: shuffle([...GEAR, ...(odd ? [odd] : [])], rng) };
}

// ---------- Lái xe tới đúng nhà (SPEC-fire2 mục 4) ----------
export const HOUSE_COLORS = ['red', 'blue', 'yellow', 'green'];
/** Phố 3 nhà khác màu, đúng một nhà màu `color`, xáo vị trí. */
export function planStreet(color, { rng = Math.random } = {}) {
  return shuffle([color, ...shuffle(HOUSE_COLORS.filter((c) => c !== color), rng).slice(0, 2)], rng);
}
/** Nhà của ca (cùng màu khi tới nơi); mức 1–2 có khói bốc lên ở nhà đúng, mức 3 chỉ nghe màu. */
export function planHouse(level, { rng = Math.random } = {}) {
  const color = HOUSE_COLORS[Math.floor(rng() * HOUSE_COLORS.length)];
  return { color, street: planStreet(color, { rng }), smoke: level <= 2 };
}

/** Ca cứu (mức 2–3): cây hay trong nhà — loại bé ít gặp hơn (`seen`), bằng nhau thì ngẫu nhiên (SPEC-fire2 mục 2). */
export const RESCUE_KINDS = ['tree', 'house'];
export function pickRescue(seen = {}, rng = Math.random) {
  const [a, b] = RESCUE_KINDS.map((k) => seen[k] ?? 0);
  if (a !== b) return a < b ? 'tree' : 'house';
  return RESCUE_KINDS[Math.floor(rng() * 2)];
}

// ---------- An toàn với lửa (SPEC-fire2 mục 6) ----------
/** Đồ của ca An toàn: câu tiếng Anh lưu sẵn từng đồ (không ghép từ tên hiển thị). */
export const SAFETY_ITEMS = [
  { id: 'candle', emoji: '🕯️', hot: true, a: 'A candle', name: 'candle', vi: 'cây nến' },
  { id: 'campfire', emoji: '🔥', hot: true, a: 'A campfire', name: 'campfire', vi: 'đống lửa trại' },
  { id: 'pan', emoji: '🍳', hot: true, a: 'A hot pan', name: 'pan', vi: 'cái chảo' },
  { id: 'tea', emoji: '☕', hot: true, a: 'A cup of hot tea', name: 'tea', vi: 'cốc trà nóng' },
  { id: 'teddy', emoji: '🧸', hot: false, a: 'A teddy', name: 'teddy', vi: 'gấu bông' },
  { id: 'ball', emoji: '⚽', hot: false, a: 'A ball', name: 'ball', vi: 'quả bóng' },
  { id: 'book', emoji: '📚', hot: false, a: 'A book', name: 'book', vi: 'quyển sách' },
  { id: 'apple', emoji: '🍎', hot: false, a: 'An apple', name: 'apple', vi: 'quả táo' },
];
export const SAFETY_BY = new Map(SAFETY_ITEMS.map((x) => [x.id, x]));
/** 3 đồ: 2 đồ nóng + 1 đồ an toàn, không lặp, xáo thứ tự. */
export function planSafety({ rng = Math.random } = {}) {
  const hot = shuffle(SAFETY_ITEMS.filter((x) => x.hot), rng).slice(0, 2);
  const safe = shuffle(SAFETY_ITEMS.filter((x) => !x.hot), rng).slice(0, 1);
  return shuffle([...hot, ...safe], rng).map((x) => x.id);
}
/** Số cứu hỏa (mức 3 bấm trên điện thoại đồ chơi). */
export const FIRE_NUMBER = [1, 1, 4];

/**
 * Một lượt: mặc đồ, rồi 3 ca (SPEC-fire2 mục 2, draft2):
 * - mức 1: 2 ca dập lửa + ca An toàn;
 * - mức 2–3: 1 ca dập lửa + 1 ca cứu (trên cây — không lái xe; hoặc trong nhà — lái xe, gõ cửa, mở cửa; loại ít gặp hơn) + ca An toàn;
 * - ca An toàn luôn ở vị trí 3 (chỉ xáo 2 ca trước); mức 3 có bấm 114.
 * Ca có `house` thì lái xe tới nhà đó trước. Mỗi ca có bạn thú khác nhau (ca An toàn không có bạn thú).
 */
export function planRound(level, { rng = Math.random, seen = {} } = {}) {
  const [r0, r1] = shuffle(PATIENTS, rng).slice(0, 2).map((p) => p.id);
  const fireCase = (resident) => {
    const c = { ...makeFireCase(level, resident, { rng }), house: planHouse(level, { rng }) };
    return level === 2 ? { ...c, choices: numberChoices(c.fires.length, { rng }) } : c;
  };
  const rescueCase = (resident) => (pickRescue(seen, rng) === 'tree'
    ? { kind: 'tree', resident }
    : { kind: 'house', resident, house: planHouse(level, { rng }) });
  const first = level >= 2 ? shuffle([fireCase(r0), rescueCase(r1)], rng) : [fireCase(r0), fireCase(r1)];
  return {
    gear: planGear(level, { rng }),
    cases: [...first, { kind: 'safety', items: planSafety({ rng }), dial: level >= 3 }],
  };
}

// ---------- Câu nói: mỗi câu [tiếng Anh, tiếng Việt] ----------
export const ALARM_LINE = ["A little fire! Let's put it out!", 'Có đám cháy nhỏ! Mình dập lửa nào!'];
export const TAP_LINE = ['Tap the fire to spray water!', 'Con chạm vào ngọn lửa để phun nước nhé!'];
export const THANKS_LINE = ['Thank you, firefighter!', 'Cảm ơn chú lính cứu hỏa!'];
export const HOW_MANY_LINE = ['How many fires?', 'Có mấy đám lửa nhỉ?'];
export const TREE_LINE = ["Help! I can't get down!", 'Cứu tớ với! Tớ không xuống được!'];
export const LADDER_LINE = ["Let's use the ladder!", 'Mình dùng cái thang nào!'];
export const DOWN_LINE = ['Thank you! I am down!', 'Cảm ơn nhé! Tớ xuống được rồi!'];

/** Bông đếm khi tắt từng ngọn: "One!", "Two!". */
export const countLine = (n) => [`${capital(NUMBERS[n])}!`, `${capital(NUMBERS_VI[n])}!`];
/** Hết lửa: "One fire! All gone!" / "Three fires! All gone!" (theo số lửa thật). */
export const allGoneLine = (n) => [`${capital(NUMBERS[n])} ${n === 1 ? 'fire' : 'fires'}! All gone!`, `${capital(NUMBERS_VI[n])} đám lửa! Tắt hết rồi!`];
/** Mức 2, chọn đúng số: "Yes! Three fires!" */
export const rightNumberLine = (n) => [`Yes! ${capital(NUMBERS[n])} ${n === 1 ? 'fire' : 'fires'}!`, `Đúng rồi! ${capital(NUMBERS_VI[n])} đám lửa!`];
/** Mức 2, chọn nhầm: "That's four. Let's count again!" (không nói đáp án). */
export const wrongNumberLine = (x) => [`That's ${NUMBERS[x]}. Let's count again!`, `Đó là số ${NUMBERS_VI[x]}. Mình đếm lại nhé!`];
/** Mức 3: "The fire is on the roof!" */
export const whereLine = (spot) => [`The fire is ${PLACES[spot][0]}!`, `Lửa ở ${PLACES[spot][1]}!`];
/** Mức 3, chạm ngọn khác: "The fire on the roof first!" */
export const firstLine = (spot) => [`The fire ${PLACES[spot][0]} first!`, `Dập lửa ${PLACES[spot][1]} trước nhé!`];
// Mặc đồ
export const READY_LINE = ["Let's get ready!", 'Mình chuẩn bị nào!'];
export const DRESS_ANY_LINE = ['Put on your firefighter clothes!', 'Mặc đồ lính cứu hỏa vào nào!'];
export const GO_LINE = ["I'm ready! Let's go!", 'Xong rồi! Mình đi thôi!'];
/** "Put on your helmet!" */
export const putOnLine = (id) => [`Put on your ${GEAR_INFO[id].en}!`, GEAR_INFO[id].putVi];
/** "Helmet on!" / "Boots on!" */
export const gearOnLine = (id) => [`${capital(GEAR_INFO[id].en)} on!`, GEAR_INFO[id].onVi];
/** Mức 2–3 mặc nhầm thứ tự: "That's the jacket. Helmet first!" / "Those are the boots. Helmet first!";
 *  mức 3 món lạ: "Not the swimsuit! We need the jacket!" */
export function wrongGearLine(id, want) {
  const g = GEAR_INFO[id];
  const w = GEAR_INFO[want];
  if (ODD_GEAR.includes(id)) return [`Not the ${g.en}! We need the ${w.en}!`, `Không phải ${g.vi}! Mình cần ${w.vi}!`];
  return [`${g.many ? 'Those are' : "That's"} the ${g.en}. ${capital(w.en)} first!`, `Đó là ${g.vi}. ${capital(w.vi)} trước nhé!`];
}

// Cứu trong nhà (SPEC-fire2 mục 5)
export const STUCK_LINE = ['Help! The door is stuck!', 'Cứu tớ với! Cửa bị kẹt rồi!'];
export const KNOCK_LINE = ['Knock on the door!', 'Con gõ cửa đi!'];
export const KNOCKED_LINE = ['Knock, knock!', 'Cốc, cốc!'];
export const OPEN_LINE = ['Open the door!', 'Mở cửa ra nào!'];
export const SAFE_LINE = ["I'm safe! Thank you, firefighter!", 'Tớ an toàn rồi! Cảm ơn chú lính cứu hỏa!'];

// An toàn
export const SAFETY_INTRO = ["Some things are hot. Let's be safe!", 'Có những thứ rất nóng. Mình cẩn thận nhé!'];
/** "Look! A candle. Can we touch it?" */
export const lookLine = (id) => {
  const x = SAFETY_BY.get(id);
  return [`Look! ${x.a}. Can we touch it?`, `Nhìn này! ${capital(x.vi)}. Mình có chạm vào được không?`];
};
/** Đúng: đồ nóng + 👎 / đồ an toàn + 👍. */
export const safetyRightLine = (id) => {
  const x = SAFETY_BY.get(id);
  return x.hot
    ? [`That's right! The ${x.name} is hot. Don't touch!`, `Đúng rồi! ${capital(x.vi)} nóng lắm. Đừng chạm vào!`]
    : [`Yes! You can touch the ${x.name}!`, `Đúng rồi! Con chạm vào ${x.vi} được!`];
};
/** Nhầm: đồ nóng + 👍 / đồ an toàn + 👎 (không dọa). */
export const safetyWrongLine = (id) => {
  const x = SAFETY_BY.get(id);
  return x.hot
    ? [`Oh no! The ${x.name} is hot. Don't touch!`, `Ôi không! ${capital(x.vi)} nóng lắm. Đừng chạm vào!`]
    : [`It's okay! You can touch the ${x.name}!`, `Không sao đâu! Con chạm vào ${x.vi} được!`];
};
export const GROWNUP_LINE = ['If you see a fire, tell a grown-up!', 'Thấy lửa thì báo người lớn nhé!'];
export const DIAL_LINE = ['Grown-ups call one… one… four!', 'Người lớn gọi số một… một… bốn!'];
export const STATION_LINE = ["Fire station! We're coming!", 'Trạm cứu hỏa đây! Chúng tôi tới ngay!'];
export const KEY_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
/** Bấm nhầm phím: "That's five. Press one!" */
export const wrongKeyLine = (x, want) => [`That's ${KEY_WORDS[x]}. Press ${KEY_WORDS[want]}!`, `Đó là số ${x}. Bấm số ${want} nhé!`];

// Lái xe
const colorVi = (c) => COLOR_BY_ID.get(c)?.vi ?? c;
/** "Nee-naw! Go to the red house!" */
export const goToLine = (color) => [`Nee-naw! Go to the ${color} house!`, `Í e í e! Tới ngôi nhà ${colorVi(color)}!`];
/** Chọn nhầm nhà: "That's the blue house. Go to the red house!" */
export const wrongHouseLine = (x, color) => [`That's the ${x} house. Go to the ${color} house!`, `Đó là nhà ${colorVi(x)}. Tới nhà ${colorVi(color)} nhé!`];

/** Tên bạn thú (cho phụ đề / test). */
export const residentName = (id) => PATIENT_BY_ID.get(id)?.name ?? id;
