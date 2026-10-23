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
 * 3 ca của một lượt, mỗi ca một bạn thú (người hỏi) khác nhau. Mức 3: đúng một ca tìm bạn bị lạc, còn lại tìm đồ.
 * Hai ca liền nhau không cùng loại đồ.
 */
export function planRound(level, { rng = Math.random } = {}) {
  const askers = shuffle(PATIENTS, rng).slice(0, CASES_PER_ROUND).map((p) => p.id);
  const friendAt = level >= 3 ? Math.floor(rng() * CASES_PER_ROUND) : -1;
  const cases = [];
  let lastToy = null;
  askers.forEach((asker, i) => {
    if (i === friendAt) {
      cases.push({ asker, ...makeFriendCase(asker, { rng }) });
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
