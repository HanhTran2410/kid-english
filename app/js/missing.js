// Trò Tìm đồ còn thiếu (SPEC-missing.md): tranh = cảnh (Dán tranh hoặc cảnh riêng) + bố cục đồ vật đặt sẵn (khung 400 × 300).
// Một vài đồ "bay mất" thành bóng trắng; bé kéo đồ đúng từ khay vào bóng. Chọn đồ thiếu / đồ nhiễu, mức, câu nói.
// Không phụ thuộc giao diện để test được.

import { SCENES, SCENE_BY_ID } from './sticker-scenes.js';

export const W = 400;
export const H = 300;
export const PICTURES_PER_ROUND = 5;
export const ROUNDS_TO_LEVEL_UP = 3;
export const MISSING_BG_IMAGES = 'missing:bg';
export const MISSING_ITEM_IMAGES = 'missing:items';
export const LEVELS = {
  // Cả 3 mức đều xem tranh đầy đủ trước (trò ghi nhớ, không phải đoán theo bóng); mức cao xem ngắn hơn.
  1: { missing: 1, distractors: 0, previewMs: 2000, faint: false },
  2: { missing: 2, distractors: 1, previewMs: 1500, faint: false },
  3: { missing: 3, distractors: 2, previewMs: 1000, faint: true },
};

// ---------- Cảnh riêng (vẽ SVG, đồ vật là emoji / ảnh bố mẹ thêm) ----------
const LINE = 'stroke="#5b4a6b" stroke-width="3" stroke-linejoin="round"';
const own = (id, en, vi, emoji, setting, svg, items) => ({ id, en, vi, emoji, setting, svg, items, own: true });
const it = (id, name, vi, emoji) => ({ id, name, vi, emoji });

export const OWN_SCENES = [
  own('meal', 'family meal', 'mâm cơm', '🍚', 'a Vietnamese family meal on a round tray on a woven mat',
    `<rect width="400" height="300" fill="#f4e2c1"/>${Array.from({ length: 12 }, (_, i) => `<path d="M0 ${i * 26} H400" stroke="#e6cfa4" stroke-width="6"/>`).join('')}`
    + `<ellipse cx="200" cy="165" rx="170" ry="120" fill="#c0874f" ${LINE}/><ellipse cx="200" cy="165" rx="150" ry="104" fill="#d9a066"/>`,
    [it('bowl', 'bowl', 'bát cơm', '🍚'), it('chopsticks', 'chopsticks', 'đôi đũa', '🥢'), it('spoon', 'spoon', 'cái thìa', '🥄'),
      it('soup', 'soup', 'bát canh', '🍲'), it('fish', 'fish', 'đĩa cá', '🐟'), it('vegetables', 'vegetables', 'đĩa rau', '🥬'), it('tea', 'tea', 'chén trà', '🍵')]),
  own('bath', 'bath time', 'giờ tắm', '🛁', 'a bright, tiled children\'s bathroom with a bathtub and a sink',
    `<rect width="400" height="300" fill="#e3fafc"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${i * 50} 0 V200 M0 ${i * 25} H400" stroke="#c5f6fa" stroke-width="2"/>`).join('')}`
    + `<rect y="200" width="400" height="100" fill="#99e9f2"/><rect x="40" y="150" width="200" height="80" rx="30" fill="#ffffff" ${LINE}/><rect x="280" y="120" width="90" height="26" rx="8" fill="#ffffff" ${LINE}/><rect x="315" y="146" width="20" height="70" fill="#dee2e6" ${LINE}/>`,
    [it('toothbrush', 'toothbrush', 'bàn chải đánh răng', '🪥'), it('soap', 'soap', 'xà phòng', '🧼'), it('duck', 'duck', 'con vịt', '🦆'),
      it('sponge', 'sponge', 'miếng bọt biển', '🧽'), it('shampoo', 'shampoo', 'dầu gội', '🧴'), it('bucket', 'bucket', 'cái xô', '🪣')]),
  own('study', 'study time', 'góc học tập', '✏️', 'a child\'s study desk in front of a window',
    `<rect width="400" height="300" fill="#fff9db"/><rect x="250" y="20" width="120" height="90" fill="#d0ebff" ${LINE}/>`
    + `<rect x="20" y="150" width="360" height="22" fill="#c08457" ${LINE}/><rect x="40" y="172" width="16" height="120" fill="#8d5a3b"/><rect x="344" y="172" width="16" height="120" fill="#8d5a3b"/>`,
    [it('book', 'book', 'quyển sách', '📕'), it('pencil', 'pencil', 'bút chì', '✏️'), it('crayon', 'crayon', 'bút sáp', '🖍️'),
      it('ruler', 'ruler', 'thước kẻ', '📏'), it('scissors', 'scissors', 'cái kéo', '✂️'), it('backpack', 'backpack', 'cặp sách', '🎒')]),
  own('picnic', 'picnic', 'dã ngoại', '🧺', 'a sunny picnic on a red checkered blanket on green grass',
    `<rect width="400" height="300" fill="#b2f2bb"/><rect width="400" height="90" fill="#d0ebff"/><circle cx="350" cy="40" r="24" fill="#ffd43b"/>`
    + `<rect x="60" y="120" width="280" height="150" fill="#ff8787" ${LINE}/>${Array.from({ length: 7 }, (_, i) => `<path d="M${60 + i * 40} 120 V270" stroke="#fff5f5" stroke-width="10" opacity="0.6"/>`).join('')}`,
    [it('sandwich', 'sandwich', 'bánh mì kẹp', '🥪'), it('juice', 'juice', 'hộp nước ép', '🧃'), it('banana', 'banana', 'quả chuối', '🍌'),
      it('cookie', 'cookie', 'bánh quy', '🍪'), it('basket', 'basket', 'cái giỏ', '🧺'), it('ball', 'ball', 'quả bóng', '⚽'), it('apple', 'apple', 'quả táo', '🍎')]),
];
export const OWN_SCENE_BY_ID = new Map(OWN_SCENES.map((s) => [s.id, s]));
export const sceneOf = (id) => OWN_SCENE_BY_ID.get(id) ?? SCENE_BY_ID.get(id) ?? null;

// ---------- Tranh: cảnh + bố cục đồ vật [mã đồ, x tâm, y tâm, cỡ] ----------
const pic = (id, scene, en, vi, items) => ({ id, scene, en, vi, items: items.map(([item, x, y, size]) => ({ item, x, y, size })) });

export const PICTURES = [
  pic('kitchen-meal', 'kitchen', 'breakfast table', 'bàn ăn sáng', [
    // Nồi nằm trên bàn (266–320): đồ trên bàn ở bên trái nồi; bánh mì lên kệ, bánh ngọt trong tủ lạnh.
    ['cup', 186, 152, 44], ['spoon', 232, 152, 42],
    ['apple', 268, 34, 40], ['banana', 314, 34, 40], ['bread', 358, 34, 42], ['cake', 71, 140, 46], ['cat', 245, 238, 52]]),
  pic('kitchen-fridge', 'kitchen', 'fridge', 'tủ lạnh', [
    ['milk', 71, 98, 42], ['cheese', 71, 146, 42], ['egg', 71, 194, 40],
    ['tomato', 188, 152, 44], ['carrot', 234, 152, 44], ['watermelon', 300, 34, 46]]),
  pic('bedroom-sleep', 'bedroom', 'bedtime', 'giờ đi ngủ', [
    ['teddy-bear', 250, 152, 52], ['book', 322, 156, 44], ['clock', 256, 62, 42], ['balloon', 346, 60, 42],
    ['doll', 78, 236, 46], ['socks', 182, 262, 44]]),
  pic('bedroom-toys', 'bedroom', 'toy corner', 'góc đồ chơi', [
    ['ball', 52, 240, 40], ['car', 104, 240, 42], ['robot', 262, 62, 44], ['train', 304, 154, 52],
    ['drum', 182, 256, 46], ['crayon', 360, 262, 40]]),
  pic('beach', 'beach', 'beach day', 'đi biển', [
    ['boat', 270, 112, 56], ['ball', 112, 236, 44], ['ice-cream', 214, 250, 44], ['sunglasses', 168, 216, 40],
    ['crab', 330, 266, 42], ['shell', 58, 272, 36]]),
  pic('park', 'park', 'park', 'công viên', [
    ['kite', 80, 52, 52], ['bird', 300, 50, 42], ['butterfly', 214, 132, 40], ['ball', 212, 262, 36],
    ['bicycle', 342, 250, 56], ['flower', 40, 232, 44]]),
  pic('farm', 'farm', 'farm', 'nông trại', [
    ['apple', 60, 80, 40], ['cow', 70, 198, 56], ['tractor', 172, 192, 54], ['pig', 315, 178, 48],
    ['duck', 226, 256, 44], ['chicken', 340, 252, 44]]),
  pic('jungle', 'jungle', 'jungle', 'rừng xanh', [
    ['monkey', 70, 52, 50], ['parrot', 140, 64, 40], ['elephant', 232, 190, 60], ['snake', 336, 150, 44],
    ['frog', 196, 262, 40], ['crocodile', 322, 262, 50]]),
  pic('space', 'space', 'space trip', 'du hành vũ trụ', [
    ['rocket', 332, 128, 60], ['earth', 90, 70, 56], ['astronaut', 92, 252, 54], ['star', 200, 60, 40],
    ['satellite', 222, 170, 48], ['alien', 186, 256, 44]]),
  pic('meal', 'meal', 'family meal', 'mâm cơm', [
    ['bowl', 150, 120, 52], ['chopsticks', 222, 112, 48], ['spoon', 272, 140, 44], ['soup', 200, 186, 58],
    ['fish', 120, 196, 48], ['vegetables', 282, 204, 48], ['tea', 360, 64, 42]]),
  pic('bath', 'bath', 'bath time', 'giờ tắm', [
    ['duck', 120, 168, 46], ['sponge', 190, 172, 42], ['toothbrush', 300, 98, 42], ['soap', 350, 104, 38],
    ['shampoo', 60, 110, 44], ['bucket', 200, 258, 48]]),
  pic('study', 'study', 'study desk', 'bàn học', [
    ['book', 70, 128, 46], ['pencil', 130, 132, 40], ['crayon', 182, 132, 40], ['ruler', 238, 132, 42],
    ['scissors', 300, 130, 42], ['backpack', 330, 240, 56]]),
  pic('picnic', 'picnic', 'picnic', 'dã ngoại', [
    ['sandwich', 110, 160, 46], ['juice', 170, 158, 42], ['banana', 230, 162, 42], ['cookie', 290, 160, 40],
    ['basket', 150, 228, 52], ['apple', 250, 230, 42], ['ball', 370, 250, 40]]),
];
export const PICTURE_BY_ID = new Map(PICTURES.map((p) => [p.id, p]));

/** Đồ vật của một ô trong tranh: { id, name, vi?, emoji } (từ cảnh Dán tranh hoặc cảnh riêng). */
export function itemOf(scene, id) {
  return scene?.items.find((x) => x.id === id) ?? null;
}

// ---------- Câu nói ----------
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const PLURAL_ONLY = new Set(['socks', 'chopsticks', 'scissors', 'sunglasses', 'vegetables', 'grapes']);
const MASS = new Set(['bread', 'cheese', 'milk', 'soup', 'tea', 'juice', 'soap', 'shampoo', 'watermelon']);
/** "a spoon" / "an apple" / "socks" / "some milk" (dùng trong câu "That's …"). */
export function withArticle(name) {
  if (PLURAL_ONLY.has(name)) return name;
  if (MASS.has(name)) return name;
  return /^[aeiou]/.test(name) ? `an ${name}` : `a ${name}`;
}
const thatIs = (name) => (PLURAL_ONLY.has(name) ? `Those are ${name}` : `That's ${withArticle(name)}`);

/** Câu kèm theo khi đặt đúng (đồ vật hay gặp). */
export const ITEM_LINES = {
  spoon: ['We eat with a spoon!', 'Mình ăn bằng thìa!'],
  chopsticks: ['We eat with chopsticks!', 'Mình ăn bằng đũa!'],
  bowl: ['A bowl of rice! Yummy!', 'Bát cơm ngon quá!'],
  cup: ['We drink with a cup!', 'Mình uống bằng cốc!'],
  socks: ['Socks go on your feet!', 'Tất đi vào chân!'],
  toothbrush: ['We brush our teeth!', 'Mình đánh răng nào!'],
  soap: ['We wash our hands with soap!', 'Mình rửa tay bằng xà phòng!'],
  pencil: ['We draw with a pencil!', 'Mình vẽ bằng bút chì!'],
  'teddy-bear': ['Good night, teddy!', 'Chúc gấu ngủ ngon!'],
};

export const MISSING_LINE = ['Oh no! Something is missing!', 'Ôi! Có đồ bị mất rồi!'];
export const WHAT_LINE = ["What's missing?", 'Còn thiếu cái gì nhỉ?'];
export const NOT_THERE_LINE = ['Hmm, not there! Try again!', 'Không phải chỗ này! Thử lại nhé!'];
export const WHAT_HERE_LINE = ['What goes here?', 'Cái gì ở đây nhỉ?'];
export const yesLine = (it2) => [`Yes! The ${it2.name}!`, `Đúng rồi! ${capital(it2.vi ?? it2.name)}!`];
export const nameLine = (it2) => [`${capital(withArticle(it2.name))}!`, `${capital(it2.vi ?? it2.name)}!`];
export const notBelongLine = (it2) => [`${thatIs(it2.name)}! ${PLURAL_ONLY.has(it2.name) ? "They don't" : "It doesn't"} belong here!`, `Đó là ${it2.vi ?? it2.name}! Không ở đây đâu!`];
export const allBackLine = (items) => [`${items.map((x) => capital(x.name)).join('! ')}! Everything is back! Great job!`, 'Đủ cả rồi! Giỏi quá!'];

// ---------- Chọn tranh, đồ thiếu, đồ nhiễu ----------
const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
/** Hai ô "sát nhau" (bóng dễ nhầm): khoảng cách tâm < 1,2 × trung bình cạnh hai đồ (khung 400 × 300). */
export const NEAR_FACTOR = 1.2;
export const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < NEAR_FACTOR * ((a.size + b.size) / 2);

/**
 * Đồ thiếu của một tranh: ưu tiên đồ bé ít gặp (`seen`: tên → số lần gặp), không hai đồ cùng tên, không hai đồ sát nhau.
 * Không đủ đồ thỏa điều kiện thì trả về ít hơn `count` (không chọn hai bóng sát nhau).
 * Mỗi ô có mã riêng `item` (duy nhất trong tranh) — đó là mã của bóng; tên tiếng Anh chỉ để đọc / tìm ảnh / ghi tiến độ.
 * @returns {Array<{ item, x, y, size }>} các ô trong tranh
 */
export function pickMissing(picture, count, { seen = new Map(), rng = Math.random } = {}) {
  const scene = sceneOf(picture.scene);
  const slots = shuffle(picture.items, rng).sort((a, b) => (seen.get(itemOf(scene, a.item)?.name) ?? 0) - (seen.get(itemOf(scene, b.item)?.name) ?? 0));
  const out = [];
  for (const s of slots) {
    if (out.length >= count) break;
    const name = itemOf(scene, s.item)?.name;
    if (out.some((o) => itemOf(scene, o.item)?.name === name || near(o, s))) continue;
    out.push(s);
  }
  return out;
}

/** Đồ nhiễu: đồ của CẢNH KHÁC, không trùng tên với bất kỳ đồ nào trong tranh. */
export function pickDistractors(picture, count, rng = Math.random) {
  if (!count) return [];
  const scene = sceneOf(picture.scene);
  const names = new Set(picture.items.map((s) => itemOf(scene, s.item)?.name));
  const pool = [...SCENES, ...OWN_SCENES].filter((sc) => sc.id !== scene.id)
    .flatMap((sc) => sc.items.map((x) => ({ ...x, scene: sc.id })))
    .filter((x) => !names.has(x.name));
  const out = [];
  for (const x of shuffle(pool, rng)) {
    if (out.length >= count) break;
    if (!out.some((o) => o.name === x.name)) out.push(x);
  }
  return out;
}

/** Thứ tự tranh của một lượt: không lặp, xáo ngẫu nhiên. */
export const roundPictures = (rng = Math.random, n = PICTURES_PER_ROUND) => shuffle(PICTURES, rng).slice(0, n).map((p) => p.id);

/** Bán kính nhận của một bóng (đơn vị khung 400 × 300, không phải px màn hình). */
export const dropRadius = (size) => Math.max(28, 0.45 * size);

/**
 * Thả một đồ tại điểm (khung 400 × 300). Xét các bóng còn trống có điểm thả trong vùng nhận; nếu vùng nhận chồng nhau thì lấy
 * bóng có khoảng cách chuẩn hóa (khoảng cách / bán kính) nhỏ nhất — thứ tự mảng không quyết định kết quả.
 * Bóng đó của chính đồ → đúng; của đồ khác → sai; không trúng bóng nào → không tính (đồ nhiễu thả trong tranh thì sai).
 * Mỗi bóng: { key, filled, x, y, size } hoặc { key, filled, slot: { x, y, size } }.
 */
export function judgeDrop(holes, itemKey, point, isDistractor = false) {
  let best = null;
  for (const hole of holes) {
    if (hole.filled) continue;
    const s = hole.slot ?? hole;
    const d = Math.hypot(point.x - s.x, point.y - s.y) / dropRadius(s.size);
    if (d <= 1 && (!best || d < best.d)) best = { hole, d };
  }
  if (best && !isDistractor) return best.hole.key === itemKey ? 'right' : 'wrong';
  const inPicture = point.x >= 0 && point.y >= 0 && point.x <= W && point.y <= H;
  if (isDistractor) return inPicture ? 'wrong' : 'none';
  return 'none';
}

export function cleanMissingState(saved) {
  const s = saved && typeof saved === 'object' ? saved : {};
  const lock = [1, 2, 3].includes(s.lock) ? s.lock : null;
  return { level: lock ?? ([1, 2, 3].includes(s.level) ? s.level : 1), rounds: Number.isInteger(s.rounds) && s.rounds >= 0 ? s.rounds : 0, lock };
}

/** Chơi xong một lượt: đủ 3 lượt thì lên mức (tối đa 3), trừ khi bố mẹ khóa. Áp dụng từ lượt sau. */
export function afterMissingRound(state) {
  const rounds = state.rounds + 1;
  if (!state.lock && state.level < 3 && rounds >= ROUNDS_TO_LEVEL_UP) return { ...state, level: state.level + 1, rounds: 0 };
  return { ...state, rounds };
}

// ---------- Prompt ảnh nền cảnh riêng ----------
const pct = (v, total) => Math.round((v / total) * 100);
/** Prompt ảnh nền cho cảnh riêng: chừa trống đúng chỗ đặt đồ vật (đồ vật là sticker riêng, không vẽ vào nền). */
export function ownScenePrompt(scene, { reference = false } = {}) {
  const pics = PICTURES.filter((p) => p.scene === scene.id);
  const spots = pics.flatMap((p) => p.items).map((s) => `x = ${pct(s.x - s.size / 2, W)}%–${pct(s.x + s.size / 2, W)}%, y = ${pct(s.y - s.size / 2, H)}%–${pct(s.y + s.size / 2, H)}%`);
  return [
    reference
      ? `I attached a REFERENCE LAYOUT IMAGE of ${scene.setting}. Redraw it as ONE nicer illustration with the same exact 4:3 aspect ratio (for example 1600 × 1200 pixels), keeping every shape at the same position and size.`
      : `Create ONE landscape illustration of ${scene.setting} with an exact 4:3 aspect ratio (for example 1600 × 1200 pixels).`,
    'It is the background of a "what\'s missing?" game for a 3-year-old child: separate stickers of small objects are placed on top of it.',
    'Keep these areas plain and uncluttered (stickers go there; do NOT draw any objects in them):',
    ...[...new Set(spots)].map((s) => `- ${s}`),
    'No people, no animals, no food, no small objects, NEVER write any text.',
    "Style: cute, simple, flat children's picture-book illustration, soft pastel colors, thick clean dark outlines.",
  ].join('\n');
}
