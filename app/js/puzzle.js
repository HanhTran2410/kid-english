// Trò Ghép hình cùng Bông (SPEC-puzzle.md): dữ liệu ghép bộ phận (dựa trên hình Tô màu), điểm neo + bán kính hút,
// chia lưới ghép tranh, số mảnh theo bộ đếm, cắt vuông, câu nói. Không phụ thuộc giao diện để test được.

import { PICTURE_BY_ID } from './coloring.js';

export const FRAME = 200; // ghép bộ phận: khung chung 200 × 200 của hình Tô màu
export const PUZZLE_PHOTOS = 'puzzle:photos';
export const MIN_PHOTO_PX = 300;

/**
 * Ghép bộ phận: thứ tự Bông hỏi (kiểm tra bằng mắt từng hình), phần vẽ sẵn, đổi tên, kiểu nhảy khi xong.
 * `box`: khung bao [x, y, w, h] của từng mảnh trên khung 200 (đo bằng getBBox; UI test so lại với SVG thật).
 */
export const PART_PUZZLES = [
  { picture: 'butterfly', order: ['body', 'wings', 'head'], fixed: ['antennae'], dance: 'flap',
    box: { body: [89, 56, 22, 112], wings: [5, 20, 190, 155], head: [85, 31, 30, 30] } },
  { picture: 'bird', order: ['body', 'head', 'wing', 'tail'], fixed: ['legs', 'beak'], dance: 'tilt',
    box: { body: [39, 68, 112, 84], head: [118, 46, 56, 56], wing: [58, 85, 68, 33], tail: [10, 78, 40, 44] } },
  { picture: 'fish', order: ['body', 'tail', 'fins'], fixed: [], dance: 'swim',
    box: { body: [40, 58, 132, 84], tail: [12, 64, 42, 72], fins: [80, 43, 60, 109] } },
  { picture: 'cat', order: ['body', 'head', 'ears', 'tail'], fixed: [], dance: 'tilt',
    box: { body: [54, 108, 92, 84], head: [58, 36, 84, 84], ears: [62, 16, 76, 46], tail: [132, 103, 47, 62] } },
  { picture: 'ladybug', order: ['shell', 'head'], fixed: ['legs', 'spots'], dance: 'wiggle',
    box: { shell: [42, 64, 116, 116], head: [74, 36, 52, 52] } },
  // Cuống hoa rộng 10/200 (< 20): vẽ sẵn, không phải mảnh kéo.
  { picture: 'flower', order: ['leaves', 'petals', 'middle'], fixed: ['stem'], dance: 'sway',
    box: { leaves: [52, 126, 96, 51], petals: [48, 22, 104, 96], middle: [80, 50, 40, 40] } },
  { picture: 'tree', order: ['trunk', 'leaves'], fixed: ['apples'], dance: 'sway',
    box: { trunk: [86, 110, 28, 82], leaves: [26, 16, 148, 112] } },
  { picture: 'house', order: ['walls', 'roof', 'door', 'windows'], fixed: ['chimney'], dance: 'bounce',
    box: { walls: [42, 92, 116, 96], roof: [26, 30, 148, 68], door: [86, 128, 30, 60], windows: [54, 110, 94, 24] } },
  { picture: 'car', order: ['car', 'wheels', 'windows'], fixed: ['light'], dance: 'drive',
    rename: { car: { en: 'body', vi: 'thân xe', plural: false } },
    box: { car: [18, 60, 168, 82], wheels: [36, 124, 134, 40], windows: [80, 70, 72, 26] } },
  { picture: 'ice-cream', order: ['cone', 'ice-cream', 'cherry'], fixed: [], dance: 'wiggle',
    box: { cone: [62, 102, 76, 90], 'ice-cream': [57, 48, 85, 60], cherry: [89, 25, 22, 22] } },
  // Tranh Tô màu thêm ở 0.23.0 (khung bao đo bằng getBBox).
  { picture: 'dog', order: ['body', 'head', 'ears', 'tail'], fixed: ['nose'], dance: 'tilt',
    box: { body: [56, 112, 88, 80], head: [62, 38, 76, 76], ears: [39, 47, 122, 66], tail: [132, 104, 43, 58] } },
  { picture: 'cow', order: ['head', 'nose', 'ears', 'horns'], fixed: ['spots'], dance: 'tilt',
    box: { head: [60, 38, 80, 116], nose: [56, 110, 88, 56], ears: [21, 55, 157, 34], horns: [61, 14, 78, 36] } },
  { picture: 'pig', order: ['head', 'ears', 'nose'], fixed: [], dance: 'wiggle',
    box: { head: [38, 44, 124, 124], ears: [56, 22, 88, 44], nose: [72, 104, 56, 40] } },
  { picture: 'duck', order: ['body', 'head', 'wing', 'beak'], fixed: ['tail', 'feet'], dance: 'swim',
    box: { body: [30, 94, 124, 80], head: [108, 46, 60, 60], wing: [60, 114, 68, 29], beak: [158, 70, 36, 22] } },
  { picture: 'rabbit', order: ['body', 'head', 'ears'], fixed: ['feet'], dance: 'bounce',
    box: { body: [58, 120, 84, 72], head: [62, 62, 76, 76], ears: [61, 8, 78, 76] } },
  { picture: 'elephant', order: ['ears', 'head', 'trunk'], fixed: [], dance: 'tilt',
    box: { ears: [10, 42, 180, 92], head: [58, 36, 84, 96], trunk: [85, 116, 33, 66] } },
  { picture: 'lion', order: ['mane', 'face', 'ears', 'nose'], fixed: [], dance: 'tilt',
    box: { mane: [24, 24, 152, 152], face: [56, 58, 88, 88], ears: [56, 48, 88, 28], nose: [86, 106, 28, 20] } },
  { picture: 'giraffe', order: ['body', 'legs', 'neck', 'head'], fixed: ['tail', 'horns', 'spots'], dance: 'sway',
    box: { body: [56, 104, 96, 52], legs: [68, 138, 79, 52], neck: [122, 44, 36, 82], head: [131, 17, 58, 41] } },
  { picture: 'turtle', order: ['shell', 'legs', 'head'], fixed: ['tail', 'spots'], dance: 'drive',
    box: { shell: [36, 56, 130, 86], legs: [48, 135, 116, 32], head: [148, 96, 44, 44] } },
  { picture: 'frog', order: ['body', 'belly', 'eyes', 'legs'], fixed: [], dance: 'bounce',
    box: { body: [36, 68, 128, 108], belly: [64, 114, 72, 56], eyes: [46, 36, 108, 48], legs: [17, 148, 165, 40] } },
  { picture: 'bus', order: ['bus', 'wheels', 'door', 'windows'], fixed: [], dance: 'drive',
    rename: { bus: { en: 'body', vi: 'thân xe', plural: false } },
    box: { bus: [14, 50, 172, 98], wheels: [32, 130, 136, 40], door: [144, 64, 30, 70], windows: [26, 64, 106, 30] } },
  { picture: 'train', order: ['train', 'wheels', 'roof', 'chimney', 'window'], fixed: [], dance: 'drive',
    rename: { train: { en: 'body', vi: 'thân tàu', plural: false } },
    box: { train: [20, 52, 152, 88], wheels: [31, 120, 137, 48], roof: [100, 32, 82, 22], chimney: [40, 46, 24, 40], window: [124, 64, 34, 30] } },
  { picture: 'plane', order: ['plane', 'wing', 'tail'], fixed: ['windows'], dance: 'drive',
    rename: { plane: { en: 'body', vi: 'thân máy bay', plural: false } },
    box: { plane: [22, 80, 168, 44], wing: [66, 106, 56, 58], tail: [16, 44, 48, 48] } },
  { picture: 'boat', order: ['boat', 'sails'], fixed: ['mast', 'flag'], dance: 'sway',
    rename: { boat: { en: 'body', vi: 'thân thuyền', plural: false } },
    box: { boat: [28, 136, 144, 36], sails: [48, 38, 120, 90] } },
  { picture: 'cake', order: ['plate', 'cake', 'cream', 'candles'], fixed: ['flames'], dance: 'wiggle',
    box: { plate: [16, 162, 168, 28], cake: [42, 100, 116, 74], cream: [42, 90, 116, 34], candles: [68, 54, 64, 36] } },
];
export const PART_PUZZLE_BY_ID = new Map(PART_PUZZLES.map((p) => [p.picture, p]));

/** Hình + các mảnh của một hình ghép bộ phận (đã đổi tên, kèm điểm neo và bán kính hút). */
export function partPuzzle(id) {
  const def = PART_PUZZLE_BY_ID.get(id);
  const pic = def && PICTURE_BY_ID.get(id);
  if (!pic) return null;
  const pieces = def.order.map((partId) => {
    const part = pic.parts.find((p) => p.id === partId);
    const [x, y, w, h] = def.box[partId];
    return {
      ...part, ...(def.rename?.[partId] ?? {}), id: partId, box: [x, y, w, h],
      anchor: { x: x + w / 2, y: y + h / 2 }, radius: Math.max(28, 0.45 * Math.min(w, h)),
    };
  });
  return { ...def, pic, pieces };
}

// ---------- Nhận đúng / sai theo điểm neo ----------
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Thả mảnh `pieceId` tại `point` (tọa độ khung). Đúng: cách điểm neo của CHÍNH nó ≤ bán kính hút.
 * Sai: không đúng nhưng trong bán kính của chỗ trống của mảnh khác. Còn lại: không tính (về khay, không nói gì).
 * @param {Array<{ id, anchor, radius, placed? }>} targets
 * @returns {'right'|'wrong'|'none'}
 */
export function judgeDrop(targets, pieceId, point) {
  const own = targets.find((t) => t.id === pieceId);
  if (own && !own.placed && dist(point, own.anchor) <= own.radius) return 'right';
  return targets.some((t) => t.id !== pieceId && !t.placed && dist(point, t.anchor) <= t.radius) ? 'wrong' : 'none';
}

// ---------- Ghép tranh: lưới ----------
export const GRID_SHAPE = { 2: { cols: 2, rows: 1 }, 4: { cols: 2, rows: 2 }, 6: { cols: 2, rows: 3 }, 9: { cols: 3, rows: 3 } };

/** Các ô của lưới n mảnh trên khung vuông 1 × 1: phủ kín, không chồng. */
export function gridCells(n) {
  const { cols, rows } = GRID_SHAPE[n] ?? GRID_SHAPE[4];
  const w = 1 / cols;
  const h = 1 / rows;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ id: `c${r}-${c}`, col: c, row: r, cols, rows, box: [c * w, r * h, w, h],
        anchor: { x: c * w + w / 2, y: r * h + h / 2 }, radius: 0.45 * Math.min(w, h) });
    }
  }
  return cells;
}

/** Số mảnh của tranh KẾ TIẾP (mục 5.3): 2 tranh 2 mảnh → 4 tranh 4 mảnh → 5 tranh 6 mảnh → 9 mảnh; khóa mức thì theo mức. */
export function piecesForNext(state) {
  const done = state.gridDone;
  const byCount = () => {
    if (done[2] < 2) return 2;
    if (done[4] < 4) return 4;
    if (done[6] < 5) return 6;
    return 9;
  };
  if (state.lock === 2) return 6;
  if (state.lock === 3) return 9;
  if (state.lock === 1) return done[2] < 2 ? 2 : 4;
  return byCount();
}

export function cleanPuzzleState(saved) {
  const s = saved && typeof saved === 'object' ? saved : {};
  const gd = s.gridDone && typeof s.gridDone === 'object' ? s.gridDone : {};
  const count = (v) => (Number.isInteger(v) && v >= 0 ? v : 0);
  const done = {};
  for (const [k, v] of Object.entries(s.done && typeof s.done === 'object' ? s.done : {})) if (v === true) done[k] = true;
  return {
    mode: s.mode === 'grid' ? 'grid' : 'parts',
    gridDone: { 2: count(gd[2]), 4: count(gd[4]), 6: count(gd[6]), 9: count(gd[9]) },
    lock: [1, 2, 3].includes(s.lock) ? s.lock : null,
    done,
  };
}

/** Ghép xong một tranh n mảnh: bộ đếm n +1 (khóa mức vẫn đếm), đánh dấu ✨. */
export function afterDone(state, cardKey, n = null) {
  const next = { ...state, gridDone: { ...state.gridDone }, done: { ...state.done, [cardKey]: true } };
  if (n) next.gridDone[n] = (next.gridDone[n] ?? 0) + 1;
  return next;
}

/** Ô vuông cắt từ ảnh w × h theo vị trí 'start' | 'center' | 'end' (dọc: trên / giữa / dưới; ngang: trái / giữa / phải). */
export function cropSquare(w, h, pos = 'center') {
  const size = Math.min(w, h);
  const slack = Math.max(w, h) - size;
  const off = pos === 'start' ? 0 : pos === 'end' ? slack : slack / 2;
  return w >= h ? { sx: off, sy: 0, size } : { sx: 0, sy: off, size };
}

// ---------- Câu nói ----------
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const OOPS_LINE = ['Oops! Try again!', 'Ối! Thử lại nhé!'];
export const LOOK_LINE = ['Look! Here!', 'Nhìn này! Ở đây!'];
export const PICTURE_LINE = ["Let's make a picture!", 'Mình ghép tranh nhé!'];
export const YES_LINE = ['Yes!', 'Đúng rồi!'];
export const GOOD_LINE = ['Good job!', 'Giỏi quá!'];
export const DID_IT_LINE = ['Wow! You did it!', 'Oa! Con ghép xong rồi!'];

export const makeLine = (pic) => [`Let's make ${withArticle(pic.en)}!`, `Mình ghép ${pic.vi} nhé!`];
export const whereLine = (p) => [`Where ${p.plural ? 'do' : 'does'} the ${p.en} go?`, `${capital(p.vi)} ở đâu nhỉ?`];
export const yesPartLine = (p) => [`Yes! The ${p.en}!`, `Đúng rồi! ${capital(p.vi)}!`];
export const namePartLine = (p) => [`The ${p.en}!`, `${capital(p.vi)}!`];

/** Số nhiều đơn giản: đuôi -s, trừ -ss / -us / -is (dress, bus, tennis). */
const isPluralWord = (w) => w.length > 3 && /s$/.test(w) && !/(ss|us|is)$/.test(w);
const MASS = new Set(['milk', 'water', 'juice', 'rice', 'bread', 'cheese', 'tea', 'soup', 'sand', 'snow', 'rain', 'grass', 'hair', 'money', 'food', 'fruit']);
/** "a cow" / "an apple" / "grapes" (số nhiều, không mạo từ) / "milk" (không đếm được). */
export function withArticle(word) {
  const w = String(word ?? '').trim().toLowerCase();
  if (!w) return '';
  if (MASS.has(w) || isPluralWord(w)) return w;
  return /^[aeiou]/.test(w) ? `an ${w}` : `a ${w}`;
}


/** Ghép xong: "Wow! It's a butterfly!" / "Wow! They're grapes!" (+ tiếng kêu nếu có). */
export function doneLine({ en, vi, sound = '' }) {
  if (!en) return DID_IT_LINE;
  const w = String(en).trim();
  const it = isPluralWord(w.toLowerCase()) ? `They're ${w.toLowerCase()}` : `It's ${withArticle(w)}`;
  return [`Wow! ${it}!${sound ? ` ${sound}` : ''}`, `Oa! ${capital(vi || w)} đây rồi!`];
}
/** Gia đình: "Wow! It's Mummy!" (tên riêng không mạo từ), bé: "Wow! It's you!". */
export const familyDoneLine = (m) => (m.id === 'me' ? ['Wow! It\'s you!', 'Oa! Con đây rồi!'] : [`Wow! It's ${m.en}!`, `Oa! ${capital(m.vi)} đây rồi!`]);

// ---------- Ảnh bố mẹ thêm ----------
/** Danh sách ảnh ghép riêng (cài đặt `puzzlePhotos`): bỏ mục hỏng / trùng mã. */
export function cleanPuzzlePhotos(list) {
  const out = [];
  const ids = new Set();
  for (const p of Array.isArray(list) ? list : []) {
    if (!p || typeof p !== 'object' || !/^p-[\w-]+$/.test(String(p.id ?? '')) || ids.has(p.id)) continue;
    ids.add(p.id);
    out.push({
      id: p.id, en: String(p.en ?? '').trim().slice(0, 30), vi: String(p.vi ?? '').trim().slice(0, 40),
      crop: ['start', 'center', 'end'].includes(p.crop) ? p.crop : 'center',
    });
  }
  return out;
}
