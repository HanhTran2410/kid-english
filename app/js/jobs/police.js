// Trò Cảnh sát giúp bạn (SPEC-jobs.md mục 6): bạn thú làm mất đồ, bé (cảnh sát) tìm đúng đồ theo màu / cỡ và trả lại;
// mức 3 có đồ nấp sau bụi cây và ca tìm bạn bị lạc. Không có người xấu. File thuần để test được trong node.

import { PATIENTS, PATIENT_BY_ID } from '../doctor.js';

export const CASES_PER_ROUND = 3;
export const MAX_LEVEL = 3;
/** Đồ chơi (vẽ SVG một màu ở màn chơi). */
export const TOYS = [
  { id: 'ball', vi: 'quả bóng' }, { id: 'balloon', vi: 'quả bóng bay' }, { id: 'hat', vi: 'cái mũ' },
  { id: 'kite', vi: 'cái diều' }, { id: 'car', vi: 'ô tô đồ chơi' },
];
export const TOY_BY_ID = new Map(TOYS.map((t) => [t.id, t]));
/** Màu của bài Colors. */
export const COLORS = ['red', 'blue', 'yellow', 'green', 'pink', 'orange'];
export const COLOR_VI = { red: 'màu đỏ', blue: 'màu xanh dương', yellow: 'màu vàng', green: 'màu xanh lá', pink: 'màu hồng', orange: 'màu cam' };
export const SIZE_VI = { big: 'to', small: 'nhỏ' };
/** Bạn thú khi bị lạc: mô tả cỡ + màu, bốn bạn mô tả khác nhau (mỗi mô tả chỉ khớp một bạn). */
export const FRIEND_LOOK = {
  teddy: { size: 'big', color: 'brown', vi: 'to, màu nâu', he: 'He' },
  kitty: { size: 'small', color: 'orange', vi: 'nhỏ, màu cam', he: 'She' },
  puppy: { size: 'small', color: 'white', vi: 'nhỏ, màu trắng', he: 'He' },
  piggy: { size: 'small', color: 'pink', vi: 'nhỏ, màu hồng', he: 'She' },
};

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
 * Một ca tìm đồ: { kind: 'toy', toy, items: [{ id, color, size, hidden }], target } — mỗi mô tả khớp đúng một đồ.
 * - Mức 1: 3 đồ cùng loại, 3 màu khác nhau, cùng cỡ (to).
 * - Mức 2: 4 đồ = đủ 4 tổ hợp 2 màu × 2 cỡ.
 * - Mức 3: như mức 2, có 1–2 đồ nấp sau bụi cây (`hidden`), đồ cần tìm luôn nấp.
 */
export function makeToyCase(level, { rng = Math.random } = {}) {
  const toy = pick(TOYS, rng).id;
  let items;
  if (level <= 1) {
    items = shuffle(COLORS, rng).slice(0, 3).map((color, i) => ({ id: `t${i}`, color, size: 'big', hidden: false }));
  } else {
    const [c1, c2] = shuffle(COLORS, rng);
    items = shuffle([[c1, 'big'], [c1, 'small'], [c2, 'big'], [c2, 'small']], rng)
      .map(([color, size], i) => ({ id: `t${i}`, color, size, hidden: false }));
  }
  const target = pick(items, rng).id;
  if (level >= 3) {
    const others = shuffle(items.filter((x) => x.id !== target), rng);
    const hide = new Set([target, ...others.slice(0, rng() < 0.5 ? 0 : 1).map((x) => x.id)]);
    items = items.map((x) => ({ ...x, hidden: hide.has(x.id) }));
  }
  return { kind: 'toy', toy, items, target };
}

/**
 * Một ca tìm bạn bị lạc (mức 3): người hỏi + 3 bạn còn lại, mỗi bạn nấp sau một bụi cây; bạn cần tìm khớp đúng một mô tả.
 * @returns {{ kind: 'friend', asker: string, items: Array<{ id: string, friend: string, hidden: true }>, target: string }}
 */
export function makeFriendCase(asker, { rng = Math.random } = {}) {
  const friends = shuffle(PATIENTS.filter((p) => p.id !== asker), rng);
  const items = friends.map((p, i) => ({ id: `f${i}`, friend: p.id, hidden: true }));
  return { kind: 'friend', asker, items, target: pick(items, rng).id };
}

/**
 * 3 ca của một lượt, mỗi ca một bạn thú (người hỏi) khác nhau. Mức 3: đúng một ca tìm bạn bị lạc. Mọi mức: đúng một ca
 * đèn giao thông (SPEC-jobs2 mục 5.1, thay một ca tìm đồ); còn lại tìm đồ. Hai ca liền nhau không cùng loại đồ.
 */
export function planRound(level, { rng = Math.random } = {}) {
  const askers = shuffle(PATIENTS, rng).slice(0, CASES_PER_ROUND).map((p) => p.id);
  // Chỉ test UI đặt `window.__kidTest.policeTrafficAt` / `policeCrossAt` để cố định chỗ ca đèn / ca qua đường.
  const all = [0, 1, 2];
  const pinT = globalThis.__kidTest?.policeTrafficAt;
  const pinC = level >= 2 ? globalThis.__kidTest?.policeCrossAt : undefined;
  const pinned = [pinT, pinC].filter((p) => all.includes(p));
  let free = all;
  let friendAt = -1;
  if (level >= 3) {
    const ok = all.filter((i) => !pinned.includes(i));
    friendAt = ok[Math.floor(rng() * ok.length)];
    free = free.filter((i) => i !== friendAt);
  }
  const trafficAt = free.includes(pinT) ? pinT : free.filter((i) => i !== pinC)[Math.floor(rng() * free.filter((i) => i !== pinC).length)];
  free = free.filter((i) => i !== trafficAt);
  // SPEC-jobs2 PL2a: mức 2–3 có một ca giúp bạn qua đường (thay một ca tìm đồ).
  const crossAt = level >= 2 ? (free.includes(pinC) ? pinC : free[Math.floor(rng() * free.length)]) : -1;
  const cases = [];
  let lastToy = null;
  askers.forEach((asker, i) => {
    if (i === friendAt) {
      cases.push({ asker, ...makeFriendCase(asker, { rng }) });
      return;
    }
    if (i === trafficAt) {
      cases.push({ asker, ...makeTrafficCase(level, { rng }) });
      return;
    }
    if (i === crossAt) {
      cases.push({ asker, kind: 'cross' });
      return;
    }
    let c = makeToyCase(level, { rng });
    for (let k = 0; k < 10 && c.toy === lastToy; k++) c = makeToyCase(level, { rng });
    lastToy = c.toy;
    cases.push({ asker, ...c });
  });
  return { cases };
}

/** Các đồ / bạn khớp mô tả của đồ cần tìm (để kiểm tra: luôn đúng một). */
export function matches(c, level) {
  const t = c.items.find((x) => x.id === c.target);
  if (c.kind === 'friend') return c.items.filter((x) => FRIEND_LOOK[x.friend].size === FRIEND_LOOK[t.friend].size && FRIEND_LOOK[x.friend].color === FRIEND_LOOK[t.friend].color);
  return c.items.filter((x) => x.color === t.color && (level <= 1 || x.size === t.size));
}

// ---------- Câu nói: mỗi câu [tiếng Anh, tiếng Việt] ----------
const describe = (x, level) => (level <= 1 ? [x.color, COLOR_VI[x.color]] : [`${x.size} and ${x.color}`, `${SIZE_VI[x.size]}, ${COLOR_VI[x.color]}`]);
const friendDesc = (id) => [`${FRIEND_LOOK[id].size} and ${FRIEND_LOOK[id].color}`, FRIEND_LOOK[id].vi];

export const HELLO_LINE = ['Hello! Can I help you?', 'Chào bạn! Mình giúp gì được không?'];
export const LOOK_LINE = ["Let's look for it!", 'Mình cùng tìm nhé!'];
export const BUSH_LINE = ['Look behind the bushes!', 'Nhìn sau bụi cây xem!'];

/** "Oh no! I lost my ball!" / "Oh no! I lost my friend!" */
export function lostLine(c) {
  if (c.kind === 'friend') return ['Oh no! I lost my friend!', 'Ôi không! Tớ lạc mất bạn rồi!'];
  const toy = TOY_BY_ID.get(c.toy);
  return [`Oh no! I lost my ${toy.id}!`, `Ôi không! Tớ làm mất ${toy.vi} rồi!`];
}
/** Mô tả: "It's red!" / "It's big and blue!" / "He's big and brown!" */
export function describeLine(c, level) {
  const t = c.items.find((x) => x.id === c.target);
  if (c.kind === 'friend') {
    const [en, vi] = friendDesc(t.friend);
    return [`${FRIEND_LOOK[t.friend].he}'s ${en}!`, `Bạn ấy ${vi}!`];
  }
  const [en, vi] = describe(t, level);
  return [`It's ${en}!`, `Nó ${vi}!`];
}
/** Tìm đúng: "My ball! Thank you, officer!" / "There you are! Thank you, officer!" */
export function foundLine(c) {
  if (c.kind === 'friend') return ['There you are! Thank you, officer!', 'Cậu đây rồi! Cảm ơn chú cảnh sát!'];
  return [`My ${c.toy}! Thank you, officer!`, `${TOY_BY_ID.get(c.toy).vi} của tớ đây rồi! Cảm ơn chú cảnh sát!`];
}
/** Chạm nhầm: "Hmm, that ball is blue. Mine is red!" / "That's Kitty! My friend is big and brown!" */
export function wrongLine(c, itemId, level) {
  const x = c.items.find((i) => i.id === itemId);
  const t = c.items.find((i) => i.id === c.target);
  if (c.kind === 'friend') {
    const p = PATIENT_BY_ID.get(x.friend);
    const [en, vi] = friendDesc(t.friend);
    return [`That's ${p.name}! My friend is ${en}!`, `Đó là ${p.vi}! Bạn tớ ${vi} cơ!`];
  }
  const [xEn, xVi] = describe(x, level);
  const [tEn, tVi] = describe(t, level);
  return [`Hmm, that ${c.toy} is ${xEn}. Mine is ${tEn}!`, `Ừm, cái đó ${xVi}. Của tớ ${tVi} cơ!`];
}

// ---------- SPEC-jobs2 PL1: ca đèn giao thông (giả lập — không phải hướng dẫn an toàn giao thông đầy đủ) ----------
export const TRAFFIC_STEPS = 3;
export const LIGHT_VI = { red: 'đỏ', yellow: 'vàng', green: 'xanh' };
/**
 * Ca đèn giao thông (sinh sẵn): 3 lượt đổi đèn. Luật CỦA MÀN CHƠI: xe chỉ đi khi đèn xe xanh và vạch kẻ không có ai.
 * - mức 1: học màu — `want` xen kẽ xanh / đỏ (Bông bảo "Make it green!");
 * - mức 2: xe hỏi "Can I go?" — `crossing` (có bạn trên vạch kẻ) → đỏ, vạch trống → xanh; có cả hai kiểu;
 * - mức 3: như mức 2, thêm một lượt đèn vàng ("The light is changing").
 */
export function makeTrafficCase(level, { rng = Math.random } = {}) {
  let steps;
  if (level <= 1) {
    const first = rng() < 0.5 ? 'green' : 'red';
    const other = first === 'green' ? 'red' : 'green';
    steps = [first, other, first].map((want) => ({ want, crossing: false }));
  } else if (level === 2) {
    // Có cả lượt "có bạn qua đường" (đỏ) và "vạch trống" (xanh).
    steps = shuffle([true, false, rng() < 0.5], rng).map((crossing) => ({ want: crossing ? 'red' : 'green', crossing }));
  } else {
    // Mức 3: đủ ba kiểu — có bạn qua đường, vạch trống, đèn vàng.
    steps = shuffle([{ want: 'red', crossing: true }, { want: 'green', crossing: false }, { want: 'yellow', crossing: false, changing: true }], rng);
  }
  return { kind: 'traffic', steps };
}

export const TRAFFIC_INTRO_LINE = ['You are the traffic police!', 'Con là cảnh sát giao thông!'];
export const CAN_GO_LINE = ['Can I go?', 'Cho tớ đi được không?'];
export const CHANGING_LINE = ['The light is changing. Make it yellow!', 'Đèn sắp đổi. Bật đèn vàng nào!'];
export const TRAFFIC_DONE_LINE = ['Great job, traffic police!', 'Cảnh sát giao thông giỏi quá!'];
/** Mức 1: "Make it green!" */
export const makeItLine = (color) => [`Make it ${color}!`, `Bật đèn ${LIGHT_VI[color]} nào!`];
/** Đúng: xanh đi, đỏ dừng (có bạn qua đường thì nói rõ), vàng chậm lại. */
export function lightRightLine(step) {
  if (step.want === 'green') return ['Green — go!', 'Xanh — đi!'];
  if (step.want === 'yellow') return ['Yellow — slow down!', 'Vàng — đi chậm lại!'];
  return step.crossing ? ['Red — stop! A friend is crossing.', 'Đỏ — dừng lại! Có bạn đang qua đường.'] : ['Red — stop!', 'Đỏ — dừng lại!'];
}
/** Nhầm: nói màu vừa chạm + nhắc yêu cầu (mức 2–3 nói lý do theo vạch kẻ). Không có cảnh va chạm. */
export function lightWrongLine(step, tapped, level) {
  if (level <= 1 || step.want === 'yellow') return [`That's ${tapped}. Make it ${step.want}!`, `Đó là đèn ${LIGHT_VI[tapped]}. Bật đèn ${LIGHT_VI[step.want]} nhé!`];
  if (step.crossing) return ['Wait! A friend is crossing!', 'Chờ đã! Có bạn đang qua đường!'];
  return ['The road is clear. Make it green!', 'Đường vắng rồi. Bật đèn xanh nhé!'];
}

// ---------- SPEC-jobs2 PL2a: giúp bạn qua đường (mức 2–3) ----------
/** Thứ tự cố định: nhìn trái → nhìn phải → bấm nút chờ đèn xanh → (tự động) nhìn lại hai phía → cùng qua đường. */
export const CROSS_STEPS = ['look-left', 'look-right', 'press', 'check', 'go'];
export const CROSS_ASK_LINE = ['Can you help me cross the road?', 'Chú cảnh sát giúp tớ qua đường được không?'];
export const LOOK_LEFT_LINE = ['Stop! Look left!', 'Dừng lại! Nhìn bên trái!'];
export const LOOK_RIGHT_LINE = ['Look right!', 'Nhìn bên phải!'];
export const NO_CARS_LINE = ['No cars!', 'Không có xe!'];
export const PRESS_LINE = ['Press the button. Wait for the green light!', 'Con bấm nút. Chờ đèn xanh nhé!'];
export const GREEN_AGAIN_LINE = ['Green light! Look left and right again!', 'Đèn xanh rồi! Nhìn trái, nhìn phải lần nữa nào!'];
export const ALL_CLEAR_LINE = ["All clear! Let's cross together!", 'Không có xe! Mình cùng qua đường nào!'];
export const CROSS_THANKS_LINE = ['Thank you, officer!', 'Cảm ơn chú cảnh sát!'];
/** Câu của bước (nói lại khi bé làm sai thứ tự / được nhắc). */
export const crossStepLine = (step) => ({
  'look-left': LOOK_LEFT_LINE, 'look-right': LOOK_RIGHT_LINE, press: PRESS_LINE, check: GREEN_AGAIN_LINE, go: ALL_CLEAR_LINE,
}[step]);
