// Trò Bác tài xe buýt (SPEC-jobs3.md mục 7): mỗi lượt một tuyến — trạm 1, 2, 3 (biển màu) rồi bến cuối 🏁. Mỗi ca = một
// trạm: (mức 2–3) người có trạm xuống ở đây nói "My stop, please! The yellow stop!" → bé chọn biển trên bản đồ → người đó
// xuống; rồi đón người nhà (gọi lần lượt, mức 3 theo cảm xúc). Hành khách: { id, member, mood, boardStop, alightStop }
// + trạng thái waiting → riding → off (mục 7.2). File thuần: kế hoạch lượt (bất biến mục 2.2), máy trạng thái, câu nói.
// SPEC-jobs4 mục 5: thời tiết trên đường (giữa trạm 1 và 2, mọi mức) và đồ bỏ quên ở bến cuối (mức 2–3; mức 1 bản làm quen
// từ 0.89.0, SPEC-jobs6 mục 3).

import { planChecked, shuffle, pick, cap, leastSeen } from './levels.js';

export const MAX_LEVEL = 3;
export const STOPS = 3;
export const END = 'end';
export const MAX_RIDERS = 3;

/** Người nhà (bài Family): `kid` nói giọng bạn nhỏ; `baby` không nói câu dài. */
export const MEMBERS = {
  grandma: { name: 'Grandma', vi: 'bà', kid: false },
  grandpa: { name: 'Grandpa', vi: 'ông', kid: false },
  mummy: { name: 'Mummy', vi: 'mẹ', kid: false },
  daddy: { name: 'Daddy', vi: 'bố', kid: false },
  sister: { name: 'Sister', vi: 'chị gái', kid: true },
  baby: { name: 'Baby', vi: 'em bé', kid: true, baby: true },
};
export const MEMBER_IDS = Object.keys(MEMBERS);
/** Cảm xúc (bài Feelings) dùng ở mức 3. */
export const MOODS = ['happy', 'sad', 'sleepy', 'hungry'];
export const MOOD_VI = { happy: 'vui', sad: 'buồn', sleepy: 'buồn ngủ', hungry: 'đói' };
export const COLORS = ['red', 'blue', 'yellow', 'green', 'pink', 'orange'];
export const COLOR_VI = { red: 'đỏ', blue: 'xanh dương', yellow: 'vàng', green: 'xanh lá', pink: 'hồng', orange: 'cam' };

/** Thời tiết trên đường (SPEC-jobs4 5.2): nút đúng trên bảng lái. */
export const WEATHERS = ['rainy', 'sunny', 'cold'];
export const WEATHER_VI = { rainy: 'mưa', sunny: 'nắng', cold: 'lạnh' };
export const FIX = { rainy: 'wipers', sunny: 'sunglasses', cold: 'windows' };
export const FIXES = Object.values(FIX);
const FIX_NAME = { wipers: ['the wipers', 'cần gạt nước', 'Wipers'], sunglasses: ['the sunglasses', 'kính râm', 'Sunglasses'], windows: ['the window', 'cửa sổ', 'Windows up'] };
/** Đồ bỏ quên (SPEC-jobs4 5.1): mức 2 là dấu hiệu của người đó (người đó thiếu trên hình), mức 3 không phải dấu hiệu. */
export const SIGN = { grandma: 'glasses', grandpa: 'hat', mummy: 'bag' };
export const ITEM3 = { grandma: 'book', grandpa: 'umbrella', mummy: 'phone', daddy: 'ball', sister: 'teddy', baby: 'bottle' };
export const ITEMS = {
  glasses: { vi: 'cái kính', emoji: '👓', plural: true },
  hat: { vi: 'cái mũ', emoji: '🧢' },
  bag: { vi: 'cái túi xách', emoji: '👜' },
  book: { vi: 'quyển sách', emoji: '📖' },
  umbrella: { vi: 'cái ô', emoji: '☂️', an: true },
  phone: { vi: 'điện thoại', emoji: '📱' },
  ball: { vi: 'quả bóng', emoji: '⚽' },
  teddy: { vi: 'gấu bông', emoji: '🧸' },
  bottle: { vi: 'bình sữa', emoji: '🍼' },
};

/**
 * Kế hoạch lượt: { stops: [màu trạm 1..3], mapExtra: màu nhiễu trên bản đồ, passengers, waiting: [[người đứng chờ ở trạm k]],
 * lightBefore: trạm có đèn đỏ trên đường tới (mức 3) | null, weather: thời tiết chặng trạm 1 → 2,
 * lost: [{ owner: id hành khách, item }] đồ bỏ quên ở bến cuối (mức 2–3) }.
 * - Mức 1: mỗi trạm đón 1 người (2 người chờ); mọi người xuống ở bến cuối, không có bản đồ; một đồ bỏ quên là dấu hiệu của chủ.
 * - Mức 2: mỗi trạm đón 1, có trạm đón 2 (gọi lần lượt); trạm 2 và 3 mỗi trạm đúng một người xuống → bến cuối còn 2 người.
 * - Mức 3: như mức 2, đón theo cảm xúc: ở trạm có 2 người cùng vai khác cảm xúc; một lần đèn đỏ (chặng 2 → 3 hoặc
 *   3 → bến cuối — chặng 1 → 2 đã có thời tiết). Có trạm đón 2 như mức 2 để bến cuối có 2 người (đồ bỏ quên).
 */
export function makePlan(level, { rng = Math.random, seen = {} } = {}) {
  const stops = shuffle(COLORS, rng).slice(0, STOPS + 1);
  const mapExtra = stops.pop();
  const passengers = [];
  const waiting = [[], [], []];
  const members = leastSeen(MEMBER_IDS, seen, rng); // ưu tiên người nhà bé ít gặp (mục 2.7)
  const pickups = level >= 2 ? shuffle([2, 1, 1], rng) : [1, 1, 1];
  let m = 0;
  for (let k = 0; k < STOPS; k++) {
    for (let j = 0; j < pickups[k]; j++) {
      const member = members[m++ % members.length];
      passengers.push({ id: `p${passengers.length}`, member, mood: level >= 3 ? pick(MOODS, rng) : 'happy', boardStop: k + 1, alightStop: END });
    }
  }
  // Người đứng chờ nhưng không lên (để bé phải chọn): mức 3 cùng vai khác cảm xúc; mức 1–2 một người nhà khác.
  const others = MEMBER_IDS.filter((id) => !passengers.some((p) => p.member === id));
  for (let k = 0; k < STOPS; k++) {
    const here = passengers.filter((p) => p.boardStop === k + 1);
    const extra = level >= 3
      ? { member: here[0].member, mood: pick(MOODS.filter((md) => md !== here[0].mood), rng) }
      : { member: pick(others.length ? others : MEMBER_IDS.filter((id) => !here.some((p) => p.member === id)), rng), mood: 'happy' };
    waiting[k] = shuffle([...here.map((p) => p.id), { id: `w${k}`, ...extra }], rng);
  }
  // Trạm xuống (mức 2–3): trạm 2 và trạm 3, mỗi trạm đúng một người đã lên trước đó và nói được (không phải em bé).
  if (level >= 2) {
    for (const stop of [2, 3]) {
      const can = passengers.filter((p) => p.boardStop < stop && p.alightStop === END && !MEMBERS[p.member].baby);
      if (can.length) pick(can, rng).alightStop = stop;
    }
  }
  const lightBefore = level >= 3 ? pick([3, END], rng) : null;
  // Thời tiết: ưu tiên nút bé ít gặp (mã "đã gặp" là tên nút).
  const weather = WEATHERS.find((w) => FIX[w] === leastSeen(FIXES, seen, rng)[0]);
  return { stops, mapExtra, passengers, waiting, lightBefore, weather, lost: makeLost(level, passengers, rng) };
}
/** Người đứng trên vỉa hè bến cuối: người xuống ở bến cuối (người đã xuống ở trạm 2–3 không đứng đó). */
export const walkersOf = (plan) => plan.passengers.filter((p) => p.alightStop === END);
/** Đồ bỏ quên: vỉa hè < 2 người thì không có. Mức 1–2 một đồ (người có dấu hiệu), mức 3 một hoặc hai đồ của hai người. */
function makeLost(level, passengers, rng) {
  const walkers = passengers.filter((p) => p.alightStop === END);
  if (walkers.length < 2) return [];
  if (level <= 2) {
    const owners = walkers.filter((p) => SIGN[p.member]);
    if (!owners.length) return [];
    const p = pick(owners, rng);
    return [{ owner: p.id, item: SIGN[p.member] }];
  }
  return shuffle(walkers, rng).slice(0, rng() < 0.5 ? 1 : 2).map((p) => ({ owner: p.id, item: ITEM3[p.member] }));
}

/** Số người trên xe ngay trước khi đón ở trạm `k` (đã xuống người của trạm `k`). */
export function ridersAt(plan, k) {
  return plan.passengers.filter((p) => p.boardStop < k && (p.alightStop === END || p.alightStop > k)).length;
}
/** Người xuống ở trạm `k` (nhiều nhất một — bất biến). */
export const alightAt = (plan, k) => plan.passengers.filter((p) => p.alightStop === k);
/** Người cần đón ở trạm `k`, theo thứ tự gọi. */
export const boardAt = (plan, k) => plan.passengers.filter((p) => p.boardStop === k);

/** Bất biến (SPEC-jobs3 mục 2.2, 7.2). */
export function planOk(plan, level) {
  const { passengers: ps } = plan;
  if (new Set([...plan.stops, plan.mapExtra]).size !== STOPS + 1) return false;
  for (const p of ps) {
    if (!(p.boardStop >= 1 && p.boardStop <= STOPS)) return false;
    if (p.alightStop !== END && (p.alightStop <= p.boardStop || p.alightStop > STOPS)) return false;
    if (p.alightStop !== END && MEMBERS[p.member].baby) return false;
  }
  for (let k = 1; k <= STOPS; k++) {
    if (alightAt(plan, k).length > 1) return false;
    if (!boardAt(plan, k).length) return false;
    if (ridersAt(plan, k) + boardAt(plan, k).length > MAX_RIDERS) return false;
    // Người đứng chờ: mỗi mô tả ("Grandma" / "the sleepy baby") khớp đúng một người.
    const wait = plan.waiting[k - 1].map((w) => (typeof w === 'string' ? ps.find((p) => p.id === w) : w));
    if (wait.length < 2) return false;
    for (const p of boardAt(plan, k)) {
      const same = wait.filter((w) => w.member === p.member && (level < 3 || w.mood === p.mood));
      if (same.length !== 1) return false;
    }
  }
  // Mỗi vai + cảm xúc chỉ một hành khách trong lượt.
  if (new Set(ps.map((p) => `${p.member}:${p.mood}`)).size !== ps.length) return false;
  if (level >= 2 && (alightAt(plan, 2).length !== 1 || alightAt(plan, 3).length !== 1)) return false;
  if (level <= 1 && ps.some((p) => p.alightStop !== END)) return false;
  if (level >= 3 && ps.some((p, i) => ps.findIndex((q) => q.member === p.member) !== i)) return false;
  // SPEC-jobs4 5.2: thời tiết; đèn đỏ không ở chặng trạm 1 → 2.
  if (!WEATHERS.includes(plan.weather)) return false;
  if (level >= 3 && ![3, END].includes(plan.lightBefore)) return false;
  return lostOk(plan, level);
}
/**
 * Đồ bỏ quên (SPEC-jobs4 5.1, SPEC-jobs6 mục 3): mức 1–2 luôn có — vỉa hè ≥ 2 người, một đồ là dấu hiệu của người được hỏi
 * (grandma / grandpa / mummy); mức 3 có khi vỉa hè ≥ 2 người — 1–2 đồ của người khác nhau trên vỉa hè.
 */
export function lostOk(plan, level) {
  const lost = plan.lost ?? [];
  const walkers = walkersOf(plan);
  if (walkers.length < 2) return level >= 3 && lost.length === 0;
  if (level <= 2 && lost.length !== 1) return false;
  if (level >= 3 && (lost.length < 1 || lost.length > 2)) return false;
  if (new Set(lost.map((l) => l.owner)).size !== lost.length) return false;
  return lost.every((l) => {
    const p = walkers.find((w) => w.id === l.owner);
    return p && l.item === (level <= 2 ? SIGN[p.member] : ITEM3[p.member]);
  });
}
/** Số thao tác con của bé ở trạm `k` (chọn biển trên bản đồ + đón từng người). */
export const stopActions = (plan, level, k) => (level >= 2 && alightAt(plan, k).length ? 1 : 0) + boardAt(plan, k).length;

export function planRound(level, { rng = Math.random, seen = {} } = {}) {
  return planChecked(() => makePlan(level, { rng, seen }), (p) => planOk(p, level) && [1, 2, 3].every((k) => stopActions(p, level, k) <= 5), () => fallbackPlan(level));
}
export function fallbackPlan(level) {
  const mood = (md) => (level >= 3 ? md : 'happy');
  const passengers = [
    { id: 'p0', member: 'grandma', mood: mood('sleepy'), boardStop: 1, alightStop: level >= 2 ? 2 : END },
    ...(level >= 2 ? [{ id: 'p3', member: 'mummy', mood: mood('hungry'), boardStop: 1, alightStop: END }] : []),
    { id: 'p1', member: 'daddy', mood: mood('happy'), boardStop: 2, alightStop: level >= 2 ? 3 : END },
    { id: 'p2', member: 'sister', mood: mood('sad'), boardStop: 3, alightStop: END },
  ];
  const extra = (k, member, md) => ({ id: `w${k}`, member, mood: md });
  const waiting = level >= 3
    ? [['p0', 'p3', extra(0, 'grandma', 'happy')], [extra(1, 'daddy', 'sad'), 'p1'], ['p2', extra(2, 'sister', 'happy')]]
    : [['p0', ...(level >= 2 ? ['p3'] : []), extra(0, 'baby', 'happy')], [extra(1, 'grandpa', 'happy'), 'p1'], ['p2', extra(2, 'grandpa', 'happy')]];
  const lost = level >= 3 ? [{ owner: 'p3', item: 'phone' }, { owner: 'p2', item: 'teddy' }] : level === 2 ? [{ owner: 'p3', item: 'bag' }] : [{ owner: 'p0', item: 'glasses' }];
  return { stops: ['red', 'yellow', 'blue'], mapExtra: 'green', passengers, waiting, lightBefore: level >= 3 ? 3 : null, weather: 'rainy', lost };
}

// ---------- Máy trạng thái hành khách (mục 7.2) ----------
/** Trạng thái ban đầu: mọi người `waiting`. */
export const initialStates = (plan) => Object.fromEntries(plan.passengers.map((p) => [p.id, { state: 'waiting', by: null }]));
/** Lên xe: chỉ từ `waiting`, chỉ ở đúng trạm. `by`: 'child' (bé chạm) | 'auto' (tự lên sau 2 lần nhắc). */
export function board(states, plan, id, stop, by) {
  const p = plan.passengers.find((x) => x.id === id);
  if (!p || p.boardStop !== stop || states[id]?.state !== 'waiting') return states;
  return { ...states, [id]: { state: 'riding', by } };
}
/** Xuống xe: chỉ từ `riding`, ở đúng trạm xuống (bến cuối: mọi người còn trên xe). */
export function alight(states, plan, stop) {
  const next = { ...states };
  for (const p of plan.passengers) if (states[p.id]?.state === 'riding' && (p.alightStop === stop || stop === END)) next[p.id] = { ...states[p.id], state: 'off' };
  return next;
}
export const riding = (states) => Object.keys(states).filter((id) => states[id].state === 'riding');

// ---------- Câu nói ([en, vi]) ----------
export const HORN_LINE = ["Let's beep!", 'Bấm còi nào!'];
export const BEEP_LINE = ['Beep beep!', 'Bíp bíp!'];
export const BELT_LINE = ['Seat belt on!', 'Thắt dây an toàn nào!'];
export const GO_LINE = ["Let's go!", 'Mình đi nào!'];
export const THANKS_LINE = ['Thank you!', 'Cảm ơn bác tài!'];
export const NOT_ME_LINE = ['Not me!', 'Không phải tôi!'];
export const BYE_LINE = ['Bye-bye!', 'Tạm biệt!'];
export const BABY_LINE = ['Goo-goo!', 'Ê a!'];
export const EVERYBODY_OFF_LINE = ['Everybody off! Bye-bye!', 'Mọi người xuống xe nhé! Tạm biệt!'];
export const RED_LINE = ['Red light! Stop!', 'Đèn đỏ! Dừng lại!'];
export const GREEN_LINE = ['Green! Go!', 'Đèn xanh! Đi thôi!'];
export const WAIT_LINE = ['Red light! Wait!', 'Đèn đỏ! Chờ chút!'];
const theMember = (p) => (p.mood !== 'happy' || MEMBERS[p.member].baby || MEMBERS[p.member].kid ? `the ${p.member === 'baby' ? 'baby' : p.member}` : MEMBERS[p.member].name);
/** Bác tài gọi đón: "Pick up Grandma!"; mức 3 "Pick up the sleepy baby!"; người thứ hai "Now pick up Baby!". */
export function pickUpLine(p, level, now = false) {
  const who = level >= 3 ? `the ${p.mood} ${p.member === 'baby' || p.member === 'sister' ? p.member : MEMBERS[p.member].name.toLowerCase()}` : MEMBERS[p.member].name;
  const vi = level >= 3 ? `${MEMBERS[p.member].vi} đang ${MOOD_VI[p.mood]}` : MEMBERS[p.member].vi;
  return [`${now ? 'Now pick' : 'Pick'} up ${who}!`, `${now ? 'Giờ đón' : 'Đón'} ${vi} nhé!`];
}
/** Hành khách sắp xuống: "My stop, please! The yellow stop!". */
export const myStopLine = (color) => [`My stop, please! The ${color} stop!`, `Cho tôi xuống ở trạm màu ${COLOR_VI[color]} nhé!`];
export const stopWrongLine = (tapped, want) => [`That's the ${tapped} stop. The ${want} stop, please!`, `Đó là trạm màu ${COLOR_VI[tapped]}. Trạm màu ${COLOR_VI[want]} cơ!`];
/** Chạm nhầm người: "Not me! I'm Grandpa!" (em bé: "Goo-goo!"). */
export const notMeLine = (w, level) => (MEMBERS[w.member].baby && level < 3
  ? BABY_LINE
  : [`Not me! I'm ${level >= 3 ? `${w.mood}` : MEMBERS[w.member].name}!`, `Không phải ${MEMBERS[w.member].vi}!`]);
export { theMember, cap };

// ---------- Thời tiết trên đường (SPEC-jobs4 5.2) ----------
export const WEATHER_Q_LINE = ["What's the weather?", 'Trời thế nào nhỉ?'];
export const GOOD_GO_LINE = ["Good job! Let's go!", 'Giỏi lắm! Mình đi tiếp nào!'];
export const weatherLine = (w) => [`It's ${w}!`, `Trời ${WEATHER_VI[w]}!`];
/** Mức 1 (và sau khi bấm đúng): "It's rainy! Wipers on!". */
export function weatherFixLine(w) {
  return {
    rainy: ["It's rainy! Wipers on!", 'Trời mưa! Bật gạt nước nào!'],
    sunny: ["It's sunny! Sunglasses on!", 'Trời nắng! Đeo kính râm nào!'],
    cold: ["It's cold! Windows up!", 'Trời lạnh! Đóng cửa sổ nào!'],
  }[w];
}
/** Chạm nút sai: "That's the window. It's rainy! Wipers!". */
export function fixWrongLine(tapped, w) {
  const [en, vi] = FIX_NAME[tapped];
  const [, wantVi, wantEn] = FIX_NAME[FIX[w]];
  return [`That's ${en}. It's ${w}! ${wantEn}!`, `Đó là ${vi}. Trời ${WEATHER_VI[w]}! ${cap(wantVi)} cơ!`];
}
/** Mức 3 chạm thẻ sai: "That's sunny. Look outside! What's the weather?". */
export const cardWrongLine = (tapped) => [`That's ${tapped}. Look outside! What's the weather?`, `Đó là trời ${WEATHER_VI[tapped]}. Nhìn ra ngoài xem! Trời thế nào?`];

// ---------- Đồ bỏ quên (SPEC-jobs4 5.1) ----------
const owns = (member) => `${MEMBERS[member].name}'s`;
const anItem = (item) => (ITEMS[item].plural ? cap(item) : `${ITEMS[item].an ? 'An' : 'A'} ${item}`);
/** Mức 1: "Oh! A hat! Whose hat?"; mức 2: "Oh! A hat! Whose hat is this?"; mức 3: "Oh! An umbrella! It's Grandpa's umbrella!" / "Now… It's Sister's teddy!". */
export function lostAskLine({ item, member }, level, second = false) {
  const vi = ITEMS[item].vi;
  if (level <= 1) return [`Oh! ${anItem(item)}! Whose ${item}?`, `Ồ! ${cap(vi)}! Của ai đây?`];
  if (level <= 2) {
    return ITEMS[item].plural
      ? [`Oh! ${anItem(item)}! Whose ${item} are these?`, `Ồ! ${cap(vi)}! ${cap(vi)} của ai đây?`]
      : [`Oh! ${anItem(item)}! Whose ${item} is this?`, `Ồ! ${cap(vi)}! ${cap(vi)} của ai đây?`];
  }
  const it = [`It's ${owns(member)} ${item}!`, `${cap(vi)} của ${MEMBERS[member].vi} đấy!`];
  return second ? [`Now… ${it[0]}`, `Giờ thì… ${it[1]}`] : [`Oh! ${anItem(item)}! ${it[0]}`, `Ồ! ${it[1]}`];
}
export const NOT_MINE_LINE = ['Not mine!', 'Không phải của tôi!'];
/** Người nhận lại đồ: "My hat! Thank you!"; em bé thì người lớn nói thay "Baby's bottle! Thank you!". */
export const lostThanksLine = (item, member) => (MEMBERS[member].baby
  ? [`${owns(member)} ${item}! Thank you!`, `${cap(ITEMS[item].vi)} của em bé! Cảm ơn bác tài!`]
  : [`My ${item}! Thank you!`, `${cap(ITEMS[item].vi)} của tôi! Cảm ơn bác tài!`]);
