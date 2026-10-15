// Trò chơi Mặc đồ (SPEC-dressup.md): tủ đồ, chỗ mặc trên người bạn nhỏ, câu nói, Bông giao việc.
// Tọa độ chỗ mặc theo khung vẽ bạn nhỏ 200 × 400.

export const DOLL_W = 200;
export const DOLL_H = 400;
export const KIDS = ['boy', 'girl'];
/** Mặc bao nhiêu lần (chưa có việc) thì Bông tự giao việc. */
export const WEARS_PER_REQUEST = 3;

/**
 * Chỗ mặc. rect: [x, y, rộng, cao] theo khung 200 × 400; pair: hai chiếc (giày) — chiếc thứ hai lật ngược;
 * verb: động từ tiếng Việt cho phụ đề. Thứ tự = thứ tự lớp vẽ (dưới → trên).
 */
export const SLOTS = [
  { id: 'back', verb: 'đeo', rect: [126, 118, 70, 80] },
  { id: 'bottom', verb: 'mặc', rect: [58, 198, 84, 152] },
  { id: 'top', verb: 'mặc', rect: [32, 106, 136, 116] },
  { id: 'dress', verb: 'mặc', rect: [36, 106, 128, 194] },
  { id: 'outer', verb: 'mặc', rect: [26, 102, 148, 150] },
  { id: 'neck', verb: 'quàng', rect: [60, 106, 80, 44] },
  { id: 'feet', verb: 'đi', rect: [54, 320, 48, 44], pair: [98, 320, 48, 44] },
  { id: 'hand', verb: 'cầm', rect: [144, 112, 56, 116] },
  { id: 'eyes', verb: 'đeo', rect: [62, 52, 76, 36] },
  { id: 'head', verb: 'đội', rect: [48, 4, 104, 60] },
];
export const SLOT_BY_ID = new Map(SLOTS.map((s) => [s.id, s]));

const PLURAL = new Set(['jeans', 'shorts', 'glasses', 'sunglasses', 'goggles', 'sneakers', 'boots', 'sandals']);

/**
 * Tủ đồ. [tên tiếng Anh, emoji, chỗ, tên tiếng Việt, ngữ cảnh khi Bông giao việc, rect riêng (nếu khác chỗ)].
 */
export const ITEMS = [
  ['T-shirt', '👕', 'top', 'áo phông'],
  ['shirt', '👔', 'top', 'áo sơ mi'],
  ['coat', '🧥', 'outer', 'áo khoác', "It's cold!"],
  ['dress', '👗', 'dress', 'váy'],
  ['swimsuit', '🩱', 'dress', 'đồ bơi', "Let's go swimming!"],
  ['jeans', '👖', 'bottom', 'quần bò'],
  ['shorts', '🩳', 'bottom', 'quần soóc', "It's sunny!", [58, 198, 84, 66]],
  ['cap', '🧢', 'head', 'mũ lưỡi trai', "It's sunny!"],
  ['sun hat', '👒', 'head', 'mũ rộng vành', "It's sunny!", [36, 0, 128, 70]],
  ['helmet', '⛑️', 'head', 'mũ bảo hiểm', "Let's ride a bike!"],
  ['crown', '👑', 'head', 'vương miện', "Let's have a party!", [62, 0, 76, 46]],
  ['bow', '🎀', 'head', 'nơ', "Let's have a party!", [112, 16, 46, 36]],
  ['glasses', '👓', 'eyes', 'kính'],
  ['sunglasses', '🕶️', 'eyes', 'kính râm', "It's sunny!"],
  ['goggles', '🥽', 'eyes', 'kính bơi', "Let's go swimming!"],
  ['scarf', '🧣', 'neck', 'khăn quàng', "It's cold!"],
  ['sneakers', '👟', 'feet', 'giày thể thao'],
  ['boots', '👢', 'feet', 'ủng', "It's cold!"],
  ['sandals', '👡', 'feet', 'dép', "It's sunny!"],
  ['backpack', '🎒', 'back', 'ba lô', "Let's go to school!"],
  ['umbrella', '☂️', 'hand', 'ô', "It's raining!"],
].map(([name, emoji, slot, vi, context = '', rect = null]) => ({
  id: name.toLowerCase().replace(/\s+/g, '-'), name, emoji, slot, vi, context, rect,
}));
export const ITEM_BY_ID = new Map(ITEMS.map((it) => [it.id, it]));

/** Vùng vẽ của món đồ (theo % khung bạn nhỏ); giày trả về 2 vùng. */
export function itemBoxes(item) {
  const slot = SLOT_BY_ID.get(item.slot);
  const toBox = ([x, y, w, h]) => ({ left: (x / DOLL_W) * 100, top: (y / DOLL_H) * 100, width: (w / DOLL_W) * 100, height: (h / DOLL_H) * 100 });
  const boxes = [toBox(item.rect ?? slot.rect)];
  if (slot.pair) boxes.push({ ...toBox(slot.pair), mirror: true });
  return boxes;
}

/** Hai món không mặc cùng lúc: cùng chỗ, hoặc váy với áo / quần. */
function clashes(a, b) {
  if (a.slot === b.slot) return true;
  const pair = new Set([a.slot, b.slot]);
  return pair.has('dress') && (pair.has('top') || pair.has('bottom'));
}

/**
 * Mặc thêm một món: cởi các món không mặc cùng được.
 * @returns {{ outfit: string[], removed: string[] }}
 */
export function wear(outfit, id) {
  const item = ITEM_BY_ID.get(id);
  if (!item) return { outfit: [...outfit], removed: [] };
  const removed = outfit.filter((o) => o !== id && clashes(ITEM_BY_ID.get(o), item));
  return { outfit: [...outfit.filter((o) => o !== id && !removed.includes(o)), id], removed };
}

/** Bộ đồ đã lưu: bỏ mã không có / trùng; món sau thắng khi xung đột. */
export function cleanOutfit(list) {
  let outfit = [];
  for (const id of Array.isArray(list) ? list : []) if (ITEM_BY_ID.has(id)) outfit = wear(outfit, id).outfit;
  return outfit;
}

/** Thứ tự vẽ (lớp dưới trước). */
export const layerOrder = (outfit) => [...outfit].sort((a, b) => SLOTS.findIndex((s) => s.id === ITEM_BY_ID.get(a).slot)
  - SLOTS.findIndex((s) => s.id === ITEM_BY_ID.get(b).slot));

const isPlural = (item) => PLURAL.has(item.name);
const article = (item) => (isPlural(item) ? '' : /^[aeiou]/i.test(item.name) ? 'an ' : 'a ');
/** Đồ cầm tay (ô): không "wear" / "put on" mà "have" / "take". */
const isHeld = (item) => item.slot === 'hand';

/** "I'm wearing a T-shirt!" / "I'm wearing boots!" / "I have an umbrella!" */
export const wearSentence = (item) => `${isHeld(item) ? 'I have' : "I'm wearing"} ${article(item)}${item.name}!`;
/** "I took off my hat!" / "I put down my umbrella!" */
export const takeOffSentence = (item) => `${isHeld(item) ? 'I put down' : 'I took off'} my ${item.name}!`;
/** "It's cold! Put on your scarf!" / "It's raining! Take your umbrella!" */
export const requestSentence = (item) => `${item.context ? `${item.context} ` : ''}${isHeld(item) ? 'Take' : 'Put on'} your ${item.name}!`;
/** Phụ đề: "Mình đội mũ bảo hiểm" / "Mình cởi mũ bảo hiểm ra". */
export const wearVi = (item) => `${item.emoji} Mình ${SLOT_BY_ID.get(item.slot).verb} ${item.vi}`;
export const takeOffVi = (item) => (isHeld(item) ? `${item.emoji} Mình cất ${item.vi} đi` : `${item.emoji} Mình cởi ${item.vi} ra`);
/** Phụ đề việc Bông giao: "Đội mũ bảo hiểm", "Cầm ô". */
export function requestVi(item) {
  const verb = SLOT_BY_ID.get(item.slot).verb;
  return `${item.emoji} ${verb.charAt(0).toUpperCase()}${verb.slice(1)} ${item.vi}`;
}

/** Bông giao việc: một món chưa mặc, khác món của việc vừa xong. Mặc hết rồi → null. */
export function pickRequest(outfit, last = null, rng = Math.random) {
  let pool = ITEMS.filter((it) => !outfit.includes(it.id));
  if (last && pool.length > 1) pool = pool.filter((it) => it.id !== last.id);
  return pool.length ? pool[Math.floor(rng() * pool.length)] : null;
}

// ---------- Bạn nhỏ (SVG) ----------

const SKIN = '#f6d2b4';
const INK = '#4a3360';
const HAIR = '#6b4423';

/** Bạn nhỏ mặc sẵn áo lót trắng + quần đùi xám; bé trai / bé gái chỉ khác tóc. */
export function dollSvg(kid) {
  const longHair = kid === 'girl'
    ? `<path d="M52 66 Q48 150 70 156 L130 156 Q152 150 148 66 Z" fill="${HAIR}"/>
       <circle cx="48" cy="96" r="14" fill="${HAIR}"/><circle cx="152" cy="96" r="14" fill="${HAIR}"/>`
    : '';
  const fringe = kid === 'girl'
    ? `<path d="M56 70 Q58 24 100 24 Q142 24 144 70 Q130 50 112 48 Q104 60 88 52 Q70 50 56 70 Z" fill="${HAIR}"/>`
    : `<path d="M57 66 Q58 22 100 22 Q142 22 143 66 Q136 44 118 40 Q110 50 96 44 Q76 40 57 66 Z" fill="${HAIR}"/>`;
  return `<svg viewBox="0 0 ${DOLL_W} ${DOLL_H}" preserveAspectRatio="none" aria-hidden="true">
${longHair}
<rect x="72" y="236" width="24" height="110" rx="11" fill="${SKIN}"/><rect x="104" y="236" width="24" height="110" rx="11" fill="${SKIN}"/>
<ellipse cx="82" cy="350" rx="17" ry="9" fill="${SKIN}"/><ellipse cx="118" cy="350" rx="17" ry="9" fill="${SKIN}"/>
<rect x="64" y="204" width="72" height="50" rx="14" fill="#cfd8e3"/>
<rect x="42" y="118" width="22" height="98" rx="11" fill="${SKIN}"/><rect x="136" y="118" width="22" height="98" rx="11" fill="${SKIN}"/>
<circle cx="53" cy="222" r="12" fill="${SKIN}"/><circle cx="147" cy="222" r="12" fill="${SKIN}"/>
<rect x="64" y="110" width="72" height="104" rx="22" fill="#ffffff" stroke="#e3e3e3" stroke-width="2"/>
<rect x="90" y="100" width="20" height="16" fill="${SKIN}"/>
<circle cx="58" cy="74" r="9" fill="${SKIN}"/><circle cx="142" cy="74" r="9" fill="${SKIN}"/>
<circle cx="100" cy="70" r="42" fill="${SKIN}"/>
${fringe}
<ellipse cx="85" cy="74" rx="5" ry="6.5" fill="${INK}"/><ellipse cx="115" cy="74" rx="5" ry="6.5" fill="${INK}"/>
<circle cx="87" cy="72" r="1.8" fill="#fff"/><circle cx="117" cy="72" r="1.8" fill="#fff"/>
<circle cx="74" cy="88" r="7" fill="#ff9ab5" opacity="0.6"/><circle cx="126" cy="88" r="7" fill="#ff9ab5" opacity="0.6"/>
<path d="M90 92 Q100 102 110 92" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
</svg>`;
}
