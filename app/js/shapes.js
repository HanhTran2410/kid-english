// Đếm hình (SPEC-shapes.md): tranh đồ vật ghép từ hình học (khung 200 × 200), mỗi vùng là đúng MỘT hình;
// đáp án đếm từ dữ liệu (không ghi tay), chọn câu cho một lượt, câu nói, mức. Không phụ thuộc giao diện để test được.

export const SHAPE_ROUNDS = 5;
export const ROUNDS_TO_LEVEL_UP = 3;
export const MIN_SIDE = 24; // cạnh ngắn tối thiểu; nhỏ hơn thì có vùng chạm nới
export const MIN_SIDE_HARD = 14; // nhỏ hơn mức này thì không cho phép
export const RECT_RATIO = 1.6; // hình chữ nhật dài rõ: không nhầm với hình vuông

// Đếm hình mới (SPEC-shapes2.md mục 4.2): ngưỡng để hình mới rõ dáng, không "lưng chừng".
export const OVAL_RATIO = 1.4; // bầu dục dài : rộng
export const DIAMOND_RATIO = 1.4; // hình thoi: đường chéo dài : ngắn
export const SLANT_RATIO = 1.4; // bình hành: cạnh dài : ngắn (không thành hình thoi)
export const LEAN_RANGE = [20, 40]; // bình hành: góc nghiêng (độ)
export const TRAPEZOID_RANGE = [0.3, 0.7]; // hình thang: đáy ngắn : đáy dài
export const POLY_MIN = 36; // ngũ / lục / bát giác: cạnh ngắn của khung, để thấy rõ góc

/**
 * `set`: 1 = Đếm hình (SPEC-shapes), 2 = Đếm hình mới (SPEC-shapes2). `level`: mức được hỏi trong bộ của nó.
 * `confuse`: hình dễ nhầm (chạm nhầm thì hình đó và thẻ mẫu nháy cùng lúc). `cornerIntro`: số góc Bông đếm khi giới thiệu.
 */
export const KINDS = {
  circle: { en: 'circle', plural: 'circles', vi: 'hình tròn', emoji: '⚪', level: 1, set: 1 },
  square: { en: 'square', plural: 'squares', vi: 'hình vuông', emoji: '🟥', level: 1, set: 1 },
  triangle: { en: 'triangle', plural: 'triangles', vi: 'hình tam giác', emoji: '🔺', level: 1, set: 1 },
  rectangle: { en: 'rectangle', plural: 'rectangles', vi: 'hình chữ nhật', emoji: '▬', level: 2, set: 1 },
  star: { en: 'star', plural: 'stars', vi: 'ngôi sao', emoji: '⭐', level: 2, set: 1 },
  heart: { en: 'heart', plural: 'hearts', vi: 'trái tim', emoji: '❤️', level: 2, set: 1 },
  oval: { en: 'oval', plural: 'ovals', vi: 'hình bầu dục', emoji: '🥚', level: 1, set: 2, confuse: ['circle'] },
  diamond: { en: 'diamond', plural: 'diamonds', vi: 'hình thoi', emoji: '🔷', level: 1, set: 2, confuse: ['square'] },
  trapezoid: { en: 'trapezoid', plural: 'trapezoids', vi: 'hình thang', emoji: '⏢', level: 1, set: 2, confuse: ['rectangle', 'triangle'] },
  parallelogram: { en: 'parallelogram', plural: 'parallelograms', vi: 'hình bình hành', emoji: '▱', level: 1, set: 2, confuse: ['rectangle', 'diamond'] },
  pentagon: { en: 'pentagon', plural: 'pentagons', vi: 'hình ngũ giác', emoji: '⬠', level: 2, set: 2, confuse: ['hexagon'], cornerIntro: 5 },
  hexagon: { en: 'hexagon', plural: 'hexagons', vi: 'hình lục giác', emoji: '⬡', level: 2, set: 2, confuse: ['pentagon', 'octagon'], cornerIntro: 6 },
  octagon: { en: 'octagon', plural: 'octagons', vi: 'hình bát giác', emoji: '🛑', level: 2, set: 2, confuse: ['hexagon', 'circle'], cornerIntro: 8 },
  semicircle: { en: 'semicircle', plural: 'semicircles', vi: 'nửa hình tròn', emoji: '◗', level: 2, set: 2, confuse: ['circle', 'oval'] },
};
export const KIND_IDS = Object.keys(KINDS);
export const isConfusable = (asked, tapped) => (KINDS[asked]?.confuse ?? []).includes(tapped);

// ---------- Hình ----------
const C = (id, x, y, r, color) => ({ id, kind: 'circle', c: [x, y], r, color });
const SQ = (id, x, y, s, color) => ({ id, kind: 'square', rect: [x, y, s, s], color });
const R = (id, x, y, w, h, color) => ({ id, kind: 'rectangle', rect: [x, y, w, h], color });
const T = (id, pts, color) => ({ id, kind: 'triangle', points: pts, color });
const ST = (id, x, y, r, color) => ({ id, kind: 'star', c: [x, y], r, color });
const HT = (id, x, y, r, color) => ({ id, kind: 'heart', c: [x, y], r, color });
const round1 = (v) => Math.round(v * 10) / 10;
const pt = (x, y) => [round1(x), round1(y)];
/** Bầu dục: tâm, bán trục ngang / dọc. */
const OV = (id, x, y, rx, ry, color) => ({ id, kind: 'oval', c: [x, y], rx, ry, color });
/** Nửa hình tròn, cạnh thẳng nằm dưới, đi qua tâm (x, y). */
const SC = (id, x, y, r, color) => ({ id, kind: 'semicircle', c: [x, y], r, half: true, color });
/** Hình thoi: tâm, bề ngang w, bề cao h (nhọn trên, nhọn dưới). */
const DI = (id, x, y, w, h, color) => ({ id, kind: 'diamond', points: [pt(x, y - h / 2), pt(x + w / 2, y), pt(x, y + h / 2), pt(x - w / 2, y)], color });
/** Hình thang cân: khung (x, y, w, h), đáy ngắn = `top` × đáy dài; `flip`: đáy dài ở trên (thân tàu, giỏ). */
const TZ = (id, x, y, w, h, top, color, flip = false) => {
  const inset = (w * (1 - top)) / 2;
  const short = [pt(x + inset, flip ? y + h : y), pt(x + w - inset, flip ? y + h : y)];
  const long = [pt(x, flip ? y : y + h), pt(x + w, flip ? y : y + h)];
  return { id, kind: 'trapezoid', points: flip ? [long[0], long[1], short[1], short[0]] : [short[0], short[1], long[1], long[0]], color };
};
/** Hình bình hành: đáy w nằm ngang ở y + h, cao h, nghiêng sang phải `lean` độ. */
const PG = (id, x, y, w, h, lean, color) => {
  const dx = h * Math.tan((lean * Math.PI) / 180);
  return { id, kind: 'parallelogram', points: [pt(x + dx, y), pt(x + dx + w, y), pt(x + w, y + h), pt(x, y + h)], color };
};
/** Đa giác đều: ngũ giác đỉnh nhọn lên trên, lục giác / bát giác cạnh trên nằm ngang. */
const POLY_START = { pentagon: -90, hexagon: 0, octagon: 22.5 };
const POLY_SIDES = { pentagon: 5, hexagon: 6, octagon: 8 };
const polyPoints = (kind, x, y, r) => Array.from({ length: POLY_SIDES[kind] }, (_, i) => {
  const a = ((POLY_START[kind] + (i * 360) / POLY_SIDES[kind]) * Math.PI) / 180;
  return pt(x + r * Math.cos(a), y + r * Math.sin(a));
});
const PO = (id, kind, x, y, r, color) => ({ id, kind, points: polyPoints(kind, x, y, r), color });

/**
 * Tranh: `shapes` theo thứ tự vẽ (mỗi mục đúng một hình học), `details` là nét trang trí (không chạm, không đếm),
 * `ask[mức]` = loại hình được hỏi ở mức đó. Đáp án = đếm `shapes` theo `kind`.
 */
export const PICTURES = [
  {
    id: 'boat', en: 'boat', vi: 'cái thuyền', emoji: '⛵', sky: '#e7f5ff',
    shapes: [
      T('sail1', [[98, 40], [98, 122], [44, 122]], '#ffffff'),
      T('sail2', [[104, 56], [104, 122], [152, 122]], '#ffe066'),
      T('flag', [[101, 12], [101, 40], [136, 26]], '#ff6b6b'),
      R('hull', 28, 126, 144, 36, '#e8590c'),
      C('port1', 68, 144, 12, '#fff3bf'),
      C('port2', 132, 144, 12, '#fff3bf'),
    ],
    details: '<path d="M101 12 V126" stroke-width="4"/><path d="M10 176 q15 -10 30 0 t30 0 t30 0 t30 0 t30 0 t30 0" stroke="#4dabf7"/>',
    ask: { 1: ['triangle'], 2: ['triangle', 'circle'] },
  },
  {
    id: 'house', en: 'house', vi: 'ngôi nhà', emoji: '🏠', sky: '#fff9db',
    shapes: [
      SQ('walls', 50, 98, 100, '#ffd8a8'),
      T('roof', [[30, 100], [100, 40], [170, 100]], '#e03131'),
      R('chimney', 118, 36, 24, 40, '#a0522d'),
      R('door', 88, 140, 24, 58, '#7048e8'),
      C('win1', 70, 125, 13, '#a5d8ff'),
      C('win2', 130, 125, 13, '#a5d8ff'),
      C('sun', 30, 30, 18, '#ffd43b'),
    ],
    details: '',
    ask: { 1: ['circle', 'triangle'], 2: ['circle', 'rectangle'] },
  },
  {
    id: 'car', en: 'car', vi: 'ô tô', emoji: '🚗', sky: '#f1f3f5',
    shapes: [
      R('cabin', 55, 56, 90, 42, '#4dabf7'),
      R('body', 20, 98, 160, 50, '#fa5252'),
      SQ('win1', 66, 64, 28, '#e7f5ff'),
      SQ('win2', 106, 64, 28, '#e7f5ff'),
      C('wheel1', 56, 150, 20, '#343a40'),
      C('wheel2', 144, 150, 20, '#343a40'),
      C('light', 166, 112, 12, '#ffe066'),
    ],
    details: '<path d="M10 172 H190" stroke="#868e96"/>',
    ask: { 1: ['circle', 'square'], 2: ['circle', 'square'] },
  },
  {
    id: 'snowman', en: 'snowman', vi: 'người tuyết', emoji: '⛄', sky: '#e3fafc',
    shapes: [
      // Các hình chỉ chạm nhau, không đè lên nhau: hình nào cũng trọn vẹn để đếm.
      C('bottom', 100, 152, 40, '#ffffff'),
      C('middle', 100, 86, 26, '#f8f9fa'),
      C('head', 100, 40, 20, '#ffffff'),
      R('hat', 82, 0, 36, 20, '#343a40'),
      T('nose', [[104, 36], [104, 50], [132, 43]], '#ff922b'),
    ],
    details: '<circle cx="93" cy="35" r="2.5" fill="#212529"/><circle cx="108" cy="34" r="2.5" fill="#212529"/><circle cx="100" cy="80" r="3" fill="#212529"/><circle cx="100" cy="94" r="3" fill="#212529"/>',
    ask: { 1: ['circle', 'triangle'], 2: ['circle', 'triangle'] },
  },
  {
    id: 'rocket', en: 'rocket', vi: 'tên lửa', emoji: '🚀', sky: '#dbe4ff',
    shapes: [
      T('fin1', [[80, 118], [54, 162], [80, 162]], '#fa5252'),
      T('fin2', [[120, 118], [146, 162], [120, 162]], '#fa5252'),
      R('body', 80, 60, 40, 102, '#f8f9fa'),
      T('nose', [[80, 60], [100, 20], [120, 60]], '#fa5252'),
      C('win1', 100, 86, 12, '#74c0fc'),
      C('win2', 100, 122, 12, '#74c0fc'),
      ST('star1', 32, 36, 14, '#ffd43b'),
      ST('star2', 168, 46, 14, '#ffd43b'),
      ST('star3', 34, 110, 13, '#ffd43b'),
      ST('star4', 166, 128, 13, '#ffd43b'),
    ],
    details: '<path d="M90 164 q10 20 20 0" stroke="#ff922b"/>',
    ask: { 1: ['triangle', 'circle'], 2: ['triangle', 'star'] },
  },
  {
    id: 'robot', en: 'robot', vi: 'rô-bốt', emoji: '🤖', sky: '#f3f0ff',
    shapes: [
      T('antenna', [[90, 22], [100, 4], [110, 22]], '#fab005'),
      SQ('head', 70, 22, 60, '#adb5bd'),
      C('eye1', 86, 48, 11, '#ffffff'),
      C('eye2', 114, 48, 11, '#ffffff'),
      SQ('body', 65, 86, 70, '#748ffc'),
      R('arm1', 37, 92, 26, 48, '#ced4da'),
      R('arm2', 137, 92, 26, 48, '#ced4da'),
      R('leg1', 72, 158, 24, 40, '#495057'),
      R('leg2', 104, 158, 24, 40, '#495057'),
    ],
    details: '<path d="M88 66 h24" stroke="#212529"/>',
    ask: { 1: ['circle', 'square'], 2: ['rectangle', 'square'] },
  },
  {
    id: 'trees', en: 'trees', plural: true, vi: 'rừng thông', emoji: '🌲', sky: '#ebfbee',
    shapes: [
      T('t1a', [[55, 20], [30, 58], [80, 58]], '#2f9e44'),
      T('t1b', [[55, 60], [24, 102], [86, 102]], '#37b24d'),
      T('t1c', [[55, 104], [18, 150], [92, 150]], '#40c057'),
      T('t2a', [[145, 20], [120, 58], [170, 58]], '#2f9e44'),
      T('t2b', [[145, 60], [114, 102], [176, 102]], '#37b24d'),
      T('t2c', [[145, 104], [108, 150], [182, 150]], '#40c057'),
      R('trunk1', 43, 152, 24, 42, '#a0522d'),
      R('trunk2', 133, 152, 24, 42, '#a0522d'),
      C('sun', 100, 30, 16, '#ffd43b'),
    ],
    details: '',
    ask: { 2: ['triangle'] },
  },
  {
    id: 'train', en: 'train', vi: 'tàu hỏa', emoji: '🚂', sky: '#fff4e6',
    shapes: [
      R('car1', 10, 86, 82, 50, '#fa5252'),
      R('car2', 108, 86, 82, 50, '#4dabf7'),
      SQ('w1', 20, 96, 26, '#fff3bf'),
      SQ('w2', 56, 96, 26, '#fff3bf'),
      SQ('w3', 118, 96, 26, '#fff3bf'),
      SQ('w4', 154, 96, 26, '#fff3bf'),
      C('wh1', 24, 148, 12, '#343a40'),
      C('wh2', 51, 148, 12, '#343a40'),
      C('wh3', 78, 148, 12, '#343a40'),
      C('wh4', 122, 148, 12, '#343a40'),
      C('wh5', 149, 148, 12, '#343a40'),
      C('wh6', 176, 148, 12, '#343a40'),
    ],
    details: '<path d="M92 112 H108" stroke-width="5"/><path d="M4 162 H196" stroke="#868e96"/>',
    ask: { 1: ['square'], 2: ['square', 'circle'] },
  },
  {
    id: 'cake', en: 'cake', vi: 'bánh sinh nhật', emoji: '🎂', sky: '#fff0f6',
    shapes: [
      R('plate', 25, 160, 150, 24, '#dee2e6'),
      R('layer1', 40, 112, 120, 48, '#f783ac'),
      R('layer2', 60, 72, 80, 40, '#ffd8a8'),
      HT('h1', 70, 136, 12, '#e03131'),
      HT('h2', 100, 136, 12, '#e03131'),
      HT('h3', 130, 136, 12, '#e03131'),
      ST('s1', 84, 92, 12, '#fab005'),
      ST('s2', 116, 92, 12, '#fab005'),
      C('ch1', 68, 62, 8, '#c92a2a'),
      C('ch2', 84, 62, 8, '#c92a2a'),
      C('ch3', 100, 62, 8, '#c92a2a'),
      C('ch4', 116, 62, 8, '#c92a2a'),
      C('ch5', 132, 62, 8, '#c92a2a'),
    ],
    details: '',
    ask: { 1: ['circle'], 2: ['heart', 'star'] },
  },
  {
    id: 'party', en: 'party', vi: 'bữa tiệc', emoji: '🎈', sky: '#f8f0fc',
    shapes: [
      C('b1', 36, 46, 22, '#ff6b6b'),
      C('b2', 82, 38, 22, '#4dabf7'),
      C('b3', 128, 46, 22, '#51cf66'),
      C('b4', 170, 36, 22, '#fcc419'),
      T('hat1', [[18, 192], [40, 140], [62, 192]], '#cc5de8'),
      T('hat2', [[78, 192], [100, 140], [122, 192]], '#ff922b'),
      T('hat3', [[138, 192], [160, 140], [182, 192]], '#20c997'),
      ST('s1', 60, 104, 12, '#fab005'),
      ST('s2', 104, 96, 12, '#fab005'),
      ST('s3', 148, 104, 12, '#fab005'),
      ST('s4', 18, 104, 12, '#fab005'),
      ST('s5', 186, 98, 12, '#fab005'),
      HT('h1', 80, 126, 12, '#f06595'),
      HT('h2', 128, 126, 12, '#f06595'),
    ],
    details: '<path d="M36 68 V96 M82 60 V88 M128 68 V96 M170 58 V86" stroke="#868e96" stroke-width="2"/>',
    ask: { 1: ['triangle', 'circle'], 2: ['star', 'circle'] },
  },
  {
    id: 'castle', en: 'castle', vi: 'lâu đài', emoji: '🏰', sky: '#e7f5ff',
    shapes: [
      R('wall', 20, 128, 160, 66, '#ced4da'),
      SQ('tw1', 20, 80, 48, '#adb5bd'),
      SQ('tw2', 76, 80, 48, '#adb5bd'),
      SQ('tw3', 132, 80, 48, '#adb5bd'),
      T('rf1', [[18, 80], [44, 42], [70, 80]], '#7048e8'),
      T('rf2', [[74, 80], [100, 42], [126, 80]], '#7048e8'),
      T('rf3', [[130, 80], [156, 42], [182, 80]], '#7048e8'),
      HT('flag', 100, 24, 13, '#e03131'),
    ],
    details: '<path d="M100 36 V42" stroke-width="3"/>',
    ask: { 1: ['triangle', 'square'], 2: ['square', 'triangle'] },
  },
  {
    id: 'fish', en: 'fish', vi: 'con cá', emoji: '🐟', sky: '#e3fafc',
    shapes: [
      T('tail', [[140, 100], [186, 64], [186, 136]], '#ff922b'),
      C('body', 90, 100, 50, '#ffa94d'),
      T('fin', [[70, 56], [96, 26], [112, 56]], '#ff922b'),
    ],
    details: '<circle cx="62" cy="90" r="5" fill="#212529"/><path d="M50 116 q10 8 20 0" stroke="#212529"/>',
    ask: { 1: ['triangle'], 2: ['triangle'] },
  },
];
// Đếm hình mới (SPEC-shapes2 mục 4.3). Hình không che nhau: tách rời, chạm cạnh, hoặc nằm trọn trong hình vẽ trước nó.
const lamp = (i, cx, top, color) => {
  const bottom = top + 34;
  return [TZ(`shade${i}`, cx - 23, top, 46, 34, 0.48, color), R(`stand${i}`, cx - 7, bottom, 14, 150 - bottom, '#868e96')];
};
const hive = (r = 22, [cx, cy] = [85, 105]) => {
  const d = Math.sqrt(3) * r;
  return [[0, 0], [0, -d], [0, d], [1.5 * r, -d / 2], [1.5 * r, d / 2], [-1.5 * r, -d / 2], [-1.5 * r, d / 2]]
    .map(([dx, dy], i) => PO(`cell${i + 1}`, 'hexagon', cx + dx, cy + dy, r, ['#ffd43b', '#fcc419', '#fab005'][i % 3]));
};
const house = (i, cx, color) => [
  PO(`face${i}`, 'pentagon', cx, 115, 32, color),
  SC(`arch${i}`, cx, 108, 14, '#74c0fc'),
  R(`door${i}`, cx - 7, 116, 14, 24, '#a0522d'),
];

export const PICTURES2 = [
  {
    id: 'ship', en: 'ship', vi: 'tàu thủy', emoji: '⛴️', sky: '#e7f5ff', set: 2,
    shapes: [
      TZ('hull', 25, 120, 150, 35, 0.6, '#e8590c', true),
      R('cabin', 55, 80, 90, 40, '#f8f9fa'),
      R('chimney1', 72, 40, 24, 40, '#ff6b6b'),
      R('chimney2', 108, 40, 24, 40, '#ffd43b'),
      OV('win1', 75, 100, 12, 8, '#74c0fc'),
      OV('win2', 100, 100, 12, 8, '#a5d8ff'),
      OV('win3', 125, 100, 12, 8, '#74c0fc'),
      C('buoy', 100, 137, 12, '#ff8787'),
    ],
    details: '<path d="M0 172 q12 -8 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0" stroke="#4dabf7"/>',
    ask: { 1: ['oval'], 2: ['oval'] },
  },
  {
    id: 'eggs', en: 'eggs', plural: true, vi: 'giỏ trứng', emoji: '🧺', sky: '#fff9db', set: 2,
    shapes: [
      TZ('basket', 30, 110, 140, 60, 0.6, '#d9480f', true),
      OV('egg1', 55, 91, 13, 19, '#fff4e6'),
      OV('egg2', 85, 91, 13, 19, '#ffe8cc'),
      OV('egg3', 115, 91, 13, 19, '#f8f0fc'),
      OV('egg4', 145, 91, 13, 19, '#e7f5ff'),
      C('sun', 168, 32, 18, '#ffd43b'),
    ],
    details: '<path d="M42 130 H158 M51 150 H149" stroke="#a0522d"/>',
    ask: { 1: ['oval'], 2: ['oval'] },
  },
  {
    id: 'caterpillar', en: 'caterpillar', vi: 'con sâu', emoji: '🐛', sky: '#ebfbee', set: 2,
    shapes: [
      ...[24, 56, 88, 120, 152].map((x, i) => OV(`seg${i + 1}`, x, 118, 16, 11, i % 2 ? '#8ce99a' : '#51cf66')),
      C('head', 184, 112, 14, '#ffa94d'),
    ],
    details: '<path d="M24 129 v10 M56 129 v10 M88 129 v10 M120 129 v10 M152 129 v10 M180 99 l-5 -14 M189 99 l5 -14"/>'
      + '<path d="M188 109 h0.5" stroke-width="5"/><path d="M0 150 H200" stroke="#2f9e44"/>',
    ask: { 1: ['oval'], 2: ['oval'] },
  },
  {
    id: 'racecar', en: 'race car', vi: 'xe đua', emoji: '🏎️', sky: '#f1f3f5', set: 2,
    shapes: [
      R('body', 20, 100, 160, 40, '#e03131'),
      PG('win1', 40, 74, 44, 26, 30, '#a5d8ff'),
      PG('win2', 92, 74, 44, 26, 30, '#74c0fc'),
      PG('wing', 8, 66, 40, 16, 30, '#ffd43b'),
      C('wheel1', 55, 156, 16, '#343a40'),
      C('wheel2', 145, 156, 16, '#495057'),
      OV('light', 168, 112, 10, 7, '#fff3bf'),
    ],
    details: '<path d="M30 82 V100"/><path d="M0 176 H200" stroke="#868e96"/>',
    ask: { 1: ['parallelogram'], 2: ['parallelogram'] },
  },
  {
    id: 'books', en: 'books', plural: true, vi: 'kệ sách', emoji: '📚', sky: '#fff4e6', set: 2,
    shapes: [
      R('shelf', 10, 160, 180, 18, '#a0522d'),
      R('book1', 20, 90, 24, 70, '#ff6b6b'),
      R('book2', 48, 100, 24, 60, '#4dabf7'),
      R('book3', 76, 84, 24, 76, '#ffd43b'),
      PG('book4', 104, 94, 26, 66, 25, '#69db7c'),
      PG('book5', 134, 94, 26, 66, 25, '#b197fc'),
    ],
    details: '<path d="M24 104 h16 M52 112 h16 M80 98 h16"/>',
    ask: { 1: ['parallelogram'], 2: ['parallelogram'] },
  },
  {
    id: 'crown', en: 'crown', vi: 'vương miện', emoji: '👑', sky: '#fff0f6', set: 2,
    shapes: [
      TZ('band', 30, 90, 140, 60, 0.65, '#fcc419', true),
      T('spike1', [[30, 90], [70, 90], [50, 40]], '#ffd43b'),
      T('spike2', [[80, 90], [120, 90], [100, 30]], '#fab005'),
      T('spike3', [[130, 90], [170, 90], [150, 40]], '#ffd43b'),
      DI('gem1', 65, 120, 18, 28, '#4dabf7'),
      SQ('gem2', 88, 108, 24, '#69db7c'),
      DI('gem3', 135, 120, 18, 28, '#e64980'),
      DI('gem4', 100, 68, 16, 24, '#9775fa'),
      OV('pearl1', 50, 76, 7, 10, '#ffffff'),
      OV('pearl2', 150, 76, 7, 10, '#ffffff'),
    ],
    details: '',
    ask: { 1: ['diamond'], 2: ['diamond', 'oval'] },
  },
  {
    id: 'kite', en: 'kite', vi: 'cánh diều', emoji: '🪁', sky: '#e7f5ff', set: 2,
    shapes: [
      DI('kite', 80, 70, 66, 100, '#ff6b6b'),
      DI('bow1', 110, 138, 16, 24, '#ffd43b'),
      DI('bow2', 135, 152, 16, 24, '#4dabf7'),
      DI('bow3', 160, 166, 16, 24, '#69db7c'),
      SQ('box', 18, 152, 30, '#b197fc'),
      OV('cloud1', 162, 40, 24, 14, '#ffffff'),
      OV('cloud2', 166, 98, 20, 12, '#ffffff'),
    ],
    details: '<path d="M80 20 V120 M47 70 H113" stroke-width="2"/><path d="M80 120 Q95 132 110 138 T135 152 T160 166" stroke-width="2"/>',
    ask: { 1: ['diamond'], 2: ['diamond'] },
  },
  {
    id: 'lamps', en: 'lamps', plural: true, vi: 'đèn ngủ', emoji: '💡', sky: '#f3f0ff', set: 2,
    shapes: [
      R('table', 10, 150, 180, 20, '#a0522d'),
      ...lamp(1, 40, 76, '#ffd43b'),
      ...lamp(2, 100, 56, '#ff8787'),
      ...lamp(3, 160, 76, '#74c0fc'),
    ],
    details: '<path d="M58 110 v12 M118 90 v12 M178 110 v12" stroke-width="2"/>',
    ask: { 1: ['trapezoid'], 2: ['trapezoid'] },
  },
  {
    id: 'cottage', en: 'cottage', vi: 'ngôi nhà nhỏ', emoji: '🏡', sky: '#fff9db', set: 2,
    shapes: [
      SQ('wall', 50, 90, 100, '#ffe8cc'),
      TZ('roof', 35, 45, 130, 45, 0.46, '#e03131'),
      R('door', 85, 135, 30, 55, '#a0522d'),
      C('win1', 68, 118, 12, '#a5d8ff'),
      C('win2', 132, 118, 12, '#74c0fc'),
    ],
    details: '<path d="M56 118 H80 M68 106 V130 M120 118 H144 M132 106 V130" stroke-width="2"/><path d="M0 190 H200" stroke="#2f9e44"/>',
    ask: { 1: ['trapezoid'], 2: ['trapezoid'] },
  },
  {
    id: 'beehive', en: 'beehive', vi: 'tổ ong', emoji: '🐝', sky: '#fff9db', set: 2,
    shapes: [
      ...hive(),
      OV('bee', 165, 50, 14, 9, '#ffd43b'),
      OV('wing1', 158, 30.5, 7, 10.5, '#e7f5ff'),
      OV('wing2', 172, 30.5, 7, 10.5, '#d0ebff'),
    ],
    details: '<path d="M161 43 v14 M169 43 v14 M179 50 h5"/>',
    ask: { 2: ['hexagon', 'oval'] },
  },
  {
    id: 'street', en: 'street', vi: 'góc phố', emoji: '🚸', sky: '#e3fafc', set: 2,
    shapes: [
      PO('stop1', 'octagon', 28, 40, 23, '#e03131'),
      C('round', 76, 40, 20, '#4dabf7'),
      PO('school', 'pentagon', 124, 44, 23, '#ffd43b'),
      DI('sign1', 172, 40, 32, 46, '#fcc419'),
      DI('sign2', 52, 120, 32, 46, '#ffa94d'),
      T('warn', [[78, 140], [122, 140], [100, 100]], '#ff922b'),
      PO('stop2', 'octagon', 148, 120, 23, '#f03e3e'),
    ],
    details: '<path d="M28 61 V196 M76 60 V196 M124 63 V196 M172 63 V196 M52 143 V196 M100 140 V196 M148 141 V196" stroke="#868e96"/>'
      + '<path d="M0 196 H200"/>',
    ask: { 2: ['octagon', 'diamond'] },
  },
  {
    id: 'houses', en: 'houses', plural: true, vi: 'dãy nhà', emoji: '🏘️', sky: '#e7f5ff', set: 2,
    shapes: [
      ...house(1, 36, '#ffc9c9'),
      ...house(2, 100, '#d0bfff'),
      ...house(3, 164, '#b2f2bb'),
      C('sun', 170, 35, 18, '#ffd43b'),
    ],
    details: '<path d="M0 141 H200" stroke="#2f9e44"/>',
    ask: { 2: ['pentagon', 'semicircle'] },
  },
  {
    id: 'cookies', en: 'cookies', plural: true, vi: 'khay bánh quy', emoji: '🍪', sky: '#fff4e6', set: 2,
    shapes: [
      PO('c1', 'hexagon', 28, 38, 22, '#e8b06a'),
      PO('c2', 'octagon', 76, 38, 22, '#a0522d'),
      PO('c3', 'pentagon', 124, 40, 22, '#f0c987'),
      PO('c4', 'hexagon', 172, 38, 22, '#d9a066'),
      PO('c5', 'octagon', 52, 100, 22, '#f0c987'),
      SC('c6', 100, 112, 24, '#e8b06a'),
      PO('c7', 'hexagon', 148, 100, 22, '#a0522d'),
      PO('c8', 'pentagon', 28, 164, 22, '#d9a066'),
      PO('c9', 'octagon', 76, 162, 22, '#e8b06a'),
      SC('c10', 124, 174, 24, '#a0522d'),
      PO('c11', 'hexagon', 172, 162, 22, '#f0c987'),
    ],
    details: '',
    ask: { 2: ['hexagon', 'octagon', 'pentagon', 'semicircle'] },
  },
  {
    id: 'turtle', en: 'turtle', vi: 'con rùa', emoji: '🐢', sky: '#ebfbee', set: 2,
    shapes: [
      SC('shell', 100, 120, 68, '#69db7c'),
      ...hive(21, [100, 120 - 2 - 2 * (Math.sqrt(3) * 21) / 2]).filter((s) => ['cell1', 'cell5', 'cell7'].includes(s.id))
        .map((s, i) => ({ ...s, id: `patch${i + 1}`, color: ['#2f9e44', '#40c057', '#37b24d'][i] })),
      OV('head', 182, 104, 14, 10, '#8ce99a'),
      ...[52, 82, 118, 148].map((x, i) => OV(`leg${i + 1}`, x, 133, 9, 13, i % 2 ? '#b2f2bb' : '#8ce99a')),
    ],
    details: '<path d="M186 100 h0.5" stroke-width="5"/><path d="M32 118 l-12 6"/><path d="M0 150 H200" stroke="#2f9e44"/>',
    ask: { 2: ['semicircle', 'hexagon'] },
  },
];

const allPictures = [...PICTURES, ...PICTURES2];
export const PICTURE_BY_ID = new Map(allPictures.map((p) => [p.id, p]));
export const picturesOf = (set = 1) => (set === 2 ? PICTURES2 : PICTURES);

// ---------- Hình học ----------
/** Khung bao [x, y, w, h] của một hình. */
export function bbox(s) {
  if (s.rect) return s.rect;
  if (s.points) {
    const xs = s.points.map((p) => p[0]);
    const ys = s.points.map((p) => p[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
  }
  if (s.rx) return [s.c[0] - s.rx, s.c[1] - s.ry, 2 * s.rx, 2 * s.ry];
  if (s.half) return [s.c[0] - s.r, s.c[1] - s.r, 2 * s.r, s.r];
  return [s.c[0] - s.r, s.c[1] - s.r, 2 * s.r, 2 * s.r];
}
export const countOf = (pic, kind) => pic.shapes.filter((s) => s.kind === kind).length;

const starPoints = ([cx, cy], r) => Array.from({ length: 10 }, (_, i) => {
  const rr = i % 2 ? r * 0.45 : r;
  const a = -Math.PI / 2 + (i * Math.PI) / 5;
  return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
}).join(' ');
const heartPath = ([cx, cy], r) => `M${cx} ${cy + r} C${cx - r * 1.6} ${cy - r * 0.2} ${cx - r * 0.6} ${cy - r * 1.3} ${cx} ${cy - r * 0.35} C${cx + r * 0.6} ${cy - r * 1.3} ${cx + r * 1.6} ${cy - r * 0.2} ${cx} ${cy + r} Z`;

/** Hình SVG (một phần tử) — có `data-shape` để chạm. */
export function shapeSvg(s, extra = '') {
  const a = `data-shape="${s.id}" data-kind="${s.kind}" fill="${s.color}" ${extra}`;
  if (s.half) return `<path ${a} d="M${s.c[0] - s.r} ${s.c[1]} A${s.r} ${s.r} 0 0 1 ${s.c[0] + s.r} ${s.c[1]} Z"/>`;
  if (s.rx) return `<ellipse ${a} cx="${s.c[0]}" cy="${s.c[1]}" rx="${s.rx}" ry="${s.ry}"/>`;
  if (s.kind === 'circle') return `<circle ${a} cx="${s.c[0]}" cy="${s.c[1]}" r="${s.r}"/>`;
  if (s.rect) return `<rect ${a} x="${s.rect[0]}" y="${s.rect[1]}" width="${s.rect[2]}" height="${s.rect[3]}" rx="2"/>`;
  if (s.points) return `<polygon ${a} points="${s.points.map((p) => p.join(',')).join(' ')}"/>`;
  if (s.kind === 'star') return `<polygon ${a} points="${starPoints(s.c, s.r)}"/>`;
  return `<path ${a} d="${heartPath(s.c, s.r)}"/>`;
}

/** Vùng chạm nới cho hình nhỏ (cạnh ngắn < 24): hình tròn trong suốt quanh tâm, cùng `data-shape`. */
export function hitPadSvg(s) {
  const [x, y, w, h] = bbox(s);
  if (Math.min(w, h) >= MIN_SIDE) return '';
  return `<circle class="sc-pad" data-shape="${s.id}" data-kind="${s.kind}" cx="${x + w / 2}" cy="${y + h / 2}" r="${MIN_SIDE * 0.75}" fill="transparent"/>`;
}

/** Tranh SVG đầy đủ (khung 200 × 200): nền, hình, nét trang trí, vùng chạm nới. */
export function pictureSvg(pic) {
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">`
    + `<rect x="0" y="0" width="200" height="200" fill="${pic.sky}" pointer-events="none"/>`
    // Vùng chạm nới nằm DƯỚI các hình: chạm trúng hình nào là hình đó (anh đào sát nhau không bị tính nhầm sang quả bên cạnh),
    // vùng nới chỉ bắt các lần chạm hơi trượt ra ngoài hình nhỏ.
    + pic.shapes.map(hitPadSvg).join('')
    + `<g stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round">${pic.shapes.map((s) => shapeSvg(s)).join('')}</g>`
    + `<g fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round" pointer-events="none">${pic.details}</g>`
    + '</svg>';
}

/** Dáng chuẩn trên thẻ mẫu (khung 100 × 100; SPEC-shapes2 mục 4.1 cho hình mới). */
const SAMPLES = {
  circle: C('x', 50, 50, 36, '#4dabf7'), square: SQ('x', 16, 16, 68, '#ff8787'), triangle: T('x', [[50, 12], [12, 86], [88, 86]], '#ffd43b'),
  rectangle: R('x', 6, 28, 88, 44, '#69db7c'), star: ST('x', 50, 52, 40, '#fcc419'), heart: HT('x', 50, 54, 30, '#f06595'),
  oval: OV('x', 50, 50, 42, 26, '#ffd8a8'), diamond: DI('x', 50, 50, 54, 86, '#4dabf7'), trapezoid: TZ('x', 8, 26, 84, 50, 0.5, '#ff922b'),
  parallelogram: PG('x', 6, 32, 66, 35.7, 30, '#69db7c'), pentagon: PO('x', 'pentagon', 50, 54, 42, '#ffd43b'),
  hexagon: PO('x', 'hexagon', 50, 50, 44, '#fcc419'), octagon: PO('x', 'octagon', 50, 50, 44, '#ff6b6b'), semicircle: SC('x', 50, 72, 44, '#b197fc'),
};
/** Hình mẫu cho thẻ "hình cần đếm". Hình có `cornerIntro` có chấm ở mỗi góc (`.sc-corner`, theo thứ tự đếm). */
export function sampleSvg(kind) {
  const s = SAMPLES[kind];
  const dots = KINDS[kind].cornerIntro
    ? s.points.map(([x, y], i) => `<circle class="sc-corner" data-i="${i + 1}" cx="${x}" cy="${y}" r="5.5"/>`).join('') : '';
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round">${shapeSvg(s)}</g>${dots}</svg>`;
}

// ---------- Phân loại lại từ tọa độ (SPEC-shapes2 mục 4.2) ----------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = (v) => Math.hypot(v[0], v[1]);
const cross = (u, v) => u[0] * v[1] - u[1] * v[0];
const dot = (u, v) => u[0] * v[0] + u[1] * v[1];
const parallel = (u, v) => Math.abs(cross(u, v)) / (len(u) * len(v)) < 0.02;
const horizontal = (v) => Math.abs(v[1]) < 0.01 * len(v);
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(a, b);

function classifyQuad(p) {
  const e = p.map((q, i) => sub(p[(i + 1) % 4], q));
  const pairA = parallel(e[0], e[2]);
  const pairB = parallel(e[1], e[3]);
  if (pairA && pairB) {
    const [a, b] = [len(e[0]), len(e[1])];
    if (Math.abs(dot(e[0], e[1])) / (a * b) < 0.02) {
      if (near(a, b, 0.02)) return 'square';
      return Math.max(a, b) / Math.min(a, b) >= RECT_RATIO ? 'rectangle' : null;
    }
    if (near(a, b, 0.03)) {
      const d1 = sub(p[2], p[0]);
      const d2 = sub(p[3], p[1]);
      const upright = [d1, d2].some((d) => Math.abs(d[0]) < 0.01 * len(d));
      return upright && Math.max(len(d1), len(d2)) / Math.min(len(d1), len(d2)) >= DIAMOND_RATIO ? 'diamond' : null;
    }
    // Bình hành: cặp cạnh đáy nằm ngang, cặp kia nghiêng 20°–40° so với phương đứng, cạnh dài : ngắn ≥ 1,4.
    const [base, side] = horizontal(e[0]) ? [e[0], e[1]] : horizontal(e[1]) ? [e[1], e[0]] : [null, null];
    if (!base) return null;
    const lean = (Math.atan2(Math.abs(side[0]), Math.abs(side[1])) * 180) / Math.PI;
    const ratio = Math.max(len(base), len(side)) / Math.min(len(base), len(side));
    return lean >= LEAN_RANGE[0] && lean <= LEAN_RANGE[1] && ratio >= SLANT_RATIO ? 'parallelogram' : null;
  }
  if (pairA !== pairB) {
    const [u, v] = pairA ? [e[0], e[2]] : [e[1], e[3]];
    if (!horizontal(u) || !horizontal(v)) return null;
    const r = Math.min(len(u), len(v)) / Math.max(len(u), len(v));
    return r >= TRAPEZOID_RANGE[0] && r <= TRAPEZOID_RANGE[1] ? 'trapezoid' : null;
  }
  return null;
}

/**
 * Tên hình đọc từ tọa độ (không đọc `kind`, trừ sao / tim / tròn vẽ bằng tâm + bán kính). `null` = hình "lưng chừng"
 * (vuông xoay làm thoi, bình hành gần chữ nhật, thang gần chữ nhật, bầu dục gần tròn…).
 */
export function classifyShape(s) {
  if (s.half) return 'semicircle';
  if (s.rx) {
    const r = Math.max(s.rx, s.ry) / Math.min(s.rx, s.ry);
    return r >= OVAL_RATIO ? 'oval' : r < 1.02 ? 'circle' : null;
  }
  if (s.rect) {
    const [, , w, h] = s.rect;
    if (w === h) return 'square';
    return Math.max(w, h) / Math.min(w, h) >= RECT_RATIO ? 'rectangle' : null;
  }
  if (!s.points) return s.kind; // tròn / sao / tim
  const n = s.points.length;
  if (n === 3) return 'triangle';
  if (n === 4) return classifyQuad(s.points);
  const name = { 5: 'pentagon', 6: 'hexagon', 8: 'octagon' }[n];
  if (!name) return null;
  // Đa giác gần đều: các đỉnh cách tâm gần bằng nhau, các cạnh gần bằng nhau; đủ to để thấy rõ góc.
  const c = [s.points.reduce((a, q) => a + q[0], 0) / n, s.points.reduce((a, q) => a + q[1], 0) / n];
  const radii = s.points.map((q) => len(sub(q, c)));
  const sides = s.points.map((q, i) => len(sub(s.points[(i + 1) % n], q)));
  const even = (list) => Math.max(...list) / Math.min(...list) <= 1.08;
  const [, , w, h] = bbox(s);
  return even(radii) && even(sides) && Math.min(w, h) >= POLY_MIN ? name : null;
}

/** Hình thang có đáy dài ở dưới (như thẻ mẫu). */
export function longBottom(s) {
  const ys = [...new Set(s.points.map((q) => q[1]))].sort((a, b) => a - b);
  const width = (y) => {
    const xs = s.points.filter((q) => q[1] === y).map((q) => q[0]);
    return Math.max(...xs) - Math.min(...xs);
  };
  return width(ys.at(-1)) > width(ys[0]);
}

/** Điểm (x, y) nằm trong hình (dùng cho test "hình không che nhau"; sao / tim lấy gần đúng bằng hình tròn). */
export function containsPoint(s, x, y) {
  if (s.rect) return x >= s.rect[0] && x <= s.rect[0] + s.rect[2] && y >= s.rect[1] && y <= s.rect[1] + s.rect[3];
  if (s.points) {
    let inside = false;
    for (let i = 0, j = s.points.length - 1; i < s.points.length; j = i++) {
      const [xi, yi] = s.points[i];
      const [xj, yj] = s.points[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  const [cx, cy] = s.c;
  if (s.rx) return ((x - cx) / s.rx) ** 2 + ((y - cy) / s.ry) ** 2 <= 1;
  if (s.half) return y <= cy && Math.hypot(x - cx, y - cy) <= s.r;
  return Math.hypot(x - cx, y - cy) <= s.r;
}

// ---------- Câu nói ----------
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const NUM_VI = ['', 'Một', 'Hai', 'Ba', 'Bốn', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười'];
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const article = (w) => (/^[aeiou]/.test(w) ? `an ${w}` : `a ${w}`);

export const lookLine = (pic) => [`Look! ${capital(pic.plural ? pic.en : article(pic.en))}!`, `Nhìn này! ${capital(pic.vi)}!`];
export const thisIsLine = (kind) => [`This is ${article(KINDS[kind].en)}!`, `Đây là ${KINDS[kind].vi}!`];
export const findOneLine = (kind) => [`Find ${article(KINDS[kind].en)}!`, `Tìm ${KINDS[kind].vi} nào!`];
export const foundOneLine = (kind) => [`Yes! ${capital(article(KINDS[kind].en))}!`, `Đúng rồi! ${capital(KINDS[kind].vi)}!`];
export const howManyLine = (kind) => [`How many ${KINDS[kind].plural}?`, `Có bao nhiêu ${KINDS[kind].vi}?`];
export const otherShapeLine = (kind) => [`That's ${article(KINDS[kind].en)}!`, `Đó là ${KINDS[kind].vi}!`];
export const againLine = (n) => [`That's ${NUM[n]}!`, `Hình này là số ${n}!`];
export const findAllLine = (kind) => [`Find the ${KINDS[kind].plural}!`, `Tìm ${KINDS[kind].vi} nào!`];
/** "Three triangles! Great counting!" / "One triangle! Great counting!" */
export const totalLine = (kind, n) => [`${capital(NUM[n])} ${n === 1 ? KINDS[kind].en : KINDS[kind].plural}! Great counting!`, `${NUM_VI[n]} ${KINDS[kind].vi}! Con đếm giỏi quá!`];
export const countWord = (n) => `${capital(NUM[n])}!`;

// Đếm hình mới (SPEC-shapes2 mục 3): câu nhận dạng, đếm góc, câu nhắc.
const ID_LINES = {
  parallelogram: ['It leans over!', 'Hình này nghiêng sang một bên!'],
  diamond: ['Pointy top, pointy bottom!', 'Nhọn ở trên, nhọn ở dưới!'],
  trapezoid: ['Short top, long bottom!', 'Cạnh trên ngắn, cạnh dưới dài!'],
  oval: ["It's like an egg!", 'Giống quả trứng!'],
  semicircle: ["It's half a circle!", 'Một nửa hình tròn!'],
};
/** "A hexagon has six corners!" — N lấy từ `cornerIntro`. */
export const cornerLine = (kind) => {
  const n = KINDS[kind].cornerIntro;
  return [`${capital(article(KINDS[kind].en))} has ${NUM[n]} corners!`, `${capital(KINDS[kind].vi)} có ${NUM_VI[n].toLowerCase()} góc!`];
};
/** Câu nhận dạng của hình (hình nhiều góc: câu số góc); hình của bộ cũ: null. */
export const idLine = (kind) => ID_LINES[kind] ?? (KINDS[kind].cornerIntro ? cornerLine(kind) : null);
/** Nhắc khi bé nhầm 3 hình: "Find the parallelograms! It leans over!". */
export const remindLine = (kind) => {
  const [en, vi] = findAllLine(kind);
  const id = idLine(kind);
  return id ? [`${en} ${id[0]}`, `${vi} ${id[1]}`] : [en, vi];
};

// ---------- Chọn câu, mức ----------
const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const maxAnswer = (level) => (level >= 2 ? 10 : 5);

/** Các câu có thể hỏi ở mức này (bộ hình `set`): { picture, kind, n }. */
export function questionPool(level, set = 1) {
  const out = [];
  for (const pic of picturesOf(set)) {
    for (const kind of pic.ask[level] ?? []) {
      const n = countOf(pic, kind);
      if (n >= 1 && n <= maxAnswer(level) && KINDS[kind].level <= level && KINDS[kind].set === set) out.push({ picture: pic.id, kind, n });
    }
  }
  return out;
}
export const MIN_NEW_KIND_QUESTIONS = 2; // Đếm hình mới, mức 2: mỗi lượt ít nhất 2 câu hỏi hình mức 2

/**
 * Câu hỏi cho một lượt (mục 4.3): không lặp tranh (mức 2: một tranh có thể hỏi 2 loại liền nhau), có đủ loại hình nếu
 * được, ưu tiên số bé ít sao, không quá 2 câu cùng đáp án.
 * @param {Map<number, number>} mastery số sao của từng số
 * @returns {Array<{ picture: string, kind: string, n: number }>}
 */
export function buildShapeQuestions(level, mastery = new Map(), { rounds = SHAPE_ROUNDS, rng = Math.random, set = 1 } = {}) {
  const byPic = new Map();
  for (const q of questionPool(level, set)) {
    if (!byPic.has(q.picture)) byPic.set(q.picture, []);
    byPic.get(q.picture).push(q);
  }
  const weight = (q) => (mastery.get(q.n) ?? 0) + rng() * 0.9;
  const out = [];
  const usedKinds = new Set();
  const answers = new Map();
  const okAnswer = (q) => (answers.get(q.n) ?? 0) < 2;
  // Đếm hình mới, mức 2: chưa đủ 2 câu hình mức 2 thì ưu tiên tranh có hình mức 2 (SPEC-shapes2 mục 4.4).
  const isNew = (q) => set === 2 && level >= 2 && KINDS[q.kind].level >= 2;
  const needNew = () => set === 2 && level >= 2 && out.filter(isNew).length < MIN_NEW_KIND_QUESTIONS;
  const pics = shuffle([...byPic.keys()], rng);
  while (out.length < rounds && pics.length) {
    // Ưu tiên tranh có loại hình chưa hỏi, rồi số ít sao.
    pics.sort((a, b) => {
      const qa = byPic.get(a).filter(okAnswer);
      const qb = byPic.get(b).filter(okAnswer);
      if (needNew()) {
        const hardA = qa.some(isNew) ? 0 : 1;
        const hardB = qb.some(isNew) ? 0 : 1;
        if (hardA !== hardB) return hardA - hardB;
      }
      const newA = qa.some((q) => !usedKinds.has(q.kind)) ? 0 : 1;
      const newB = qb.some((q) => !usedKinds.has(q.kind)) ? 0 : 1;
      if (newA !== newB) return newA - newB;
      return Math.min(...qa.map(weight), 99) - Math.min(...qb.map(weight), 99);
    });
    const pic = pics.shift();
    const qs = byPic.get(pic).filter(okAnswer).sort((a, b) => (needNew() && isNew(b) - isNew(a))
      || (usedKinds.has(a.kind) - usedKinds.has(b.kind)) || weight(a) - weight(b));
    const take = level >= 2 ? qs.slice(0, Math.min(2, rounds - out.length)) : qs.slice(0, 1);
    for (const q of take) {
      if (!okAnswer(q)) continue;
      out.push(q);
      usedKinds.add(q.kind);
      answers.set(q.n, (answers.get(q.n) ?? 0) + 1);
    }
  }
  return out;
}

/** Mức đã lưu (cài đặt `shapeCount`). */
export function cleanShapeState(saved) {
  const s = saved && typeof saved === 'object' ? saved : {};
  const lock = [1, 2].includes(s.lock) ? s.lock : null;
  return {
    level: lock ?? ([1, 2].includes(s.level) ? s.level : 1),
    rounds: Number.isInteger(s.rounds) && s.rounds >= 0 ? s.rounds : 0,
    lock,
    seen: Array.isArray(s.seen) ? s.seen.filter((k) => KIND_IDS.includes(k)) : [],
  };
}

/** Chơi xong một lượt: đếm lượt, đủ 3 lượt ở mức 1 thì lên mức 2 (trừ khi bố mẹ khóa). Áp dụng từ lượt sau. */
export function afterShapeRound(state) {
  const rounds = state.rounds + 1;
  if (!state.lock && state.level === 1 && rounds >= ROUNDS_TO_LEVEL_UP) return { ...state, level: 2, rounds: 0 };
  return { ...state, rounds };
}
