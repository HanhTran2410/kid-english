// Đếm hình (SPEC-shapes.md): tranh đồ vật ghép từ hình học (khung 200 × 200), mỗi vùng là đúng MỘT hình;
// đáp án đếm từ dữ liệu (không ghi tay), chọn câu cho một lượt, câu nói, mức. Không phụ thuộc giao diện để test được.

export const SHAPE_ROUNDS = 5;
export const ROUNDS_TO_LEVEL_UP = 3;
export const MIN_SIDE = 24; // cạnh ngắn tối thiểu; nhỏ hơn thì có vùng chạm nới
export const MIN_SIDE_HARD = 14; // nhỏ hơn mức này thì không cho phép
export const RECT_RATIO = 1.6; // hình chữ nhật dài rõ: không nhầm với hình vuông

export const KINDS = {
  circle: { en: 'circle', plural: 'circles', vi: 'hình tròn', emoji: '⚪', level: 1 },
  square: { en: 'square', plural: 'squares', vi: 'hình vuông', emoji: '🟥', level: 1 },
  triangle: { en: 'triangle', plural: 'triangles', vi: 'hình tam giác', emoji: '🔺', level: 1 },
  rectangle: { en: 'rectangle', plural: 'rectangles', vi: 'hình chữ nhật', emoji: '▬', level: 2 },
  star: { en: 'star', plural: 'stars', vi: 'ngôi sao', emoji: '⭐', level: 2 },
  heart: { en: 'heart', plural: 'hearts', vi: 'trái tim', emoji: '❤️', level: 2 },
};
export const KIND_IDS = Object.keys(KINDS);

// ---------- Hình ----------
const C = (id, x, y, r, color) => ({ id, kind: 'circle', c: [x, y], r, color });
const SQ = (id, x, y, s, color) => ({ id, kind: 'square', rect: [x, y, s, s], color });
const R = (id, x, y, w, h, color) => ({ id, kind: 'rectangle', rect: [x, y, w, h], color });
const T = (id, pts, color) => ({ id, kind: 'triangle', points: pts, color });
const ST = (id, x, y, r, color) => ({ id, kind: 'star', c: [x, y], r, color });
const HT = (id, x, y, r, color) => ({ id, kind: 'heart', c: [x, y], r, color });

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
export const PICTURE_BY_ID = new Map(PICTURES.map((p) => [p.id, p]));

// ---------- Hình học ----------
/** Khung bao [x, y, w, h] của một hình. */
export function bbox(s) {
  if (s.rect) return s.rect;
  if (s.points) {
    const xs = s.points.map((p) => p[0]);
    const ys = s.points.map((p) => p[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
  }
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
  if (s.kind === 'circle') return `<circle ${a} cx="${s.c[0]}" cy="${s.c[1]}" r="${s.r}"/>`;
  if (s.rect) return `<rect ${a} x="${s.rect[0]}" y="${s.rect[1]}" width="${s.rect[2]}" height="${s.rect[3]}" rx="2"/>`;
  if (s.kind === 'triangle') return `<polygon ${a} points="${s.points.map((p) => p.join(',')).join(' ')}"/>`;
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

/** Hình mẫu cho thẻ "hình cần đếm". */
export function sampleSvg(kind) {
  const s = { circle: C('x', 50, 50, 36, '#4dabf7'), square: SQ('x', 16, 16, 68, '#ff8787'), triangle: T('x', [[50, 12], [12, 86], [88, 86]], '#ffd43b'),
    rectangle: R('x', 6, 28, 88, 44, '#69db7c'), star: ST('x', 50, 52, 40, '#fcc419'), heart: HT('x', 50, 54, 30, '#f06595') }[kind];
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round">${shapeSvg(s)}</g></svg>`;
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

/** Các câu có thể hỏi ở mức này: { picture, kind, n }. */
export function questionPool(level) {
  const out = [];
  for (const pic of PICTURES) {
    for (const kind of pic.ask[level] ?? []) {
      const n = countOf(pic, kind);
      if (n >= 1 && n <= maxAnswer(level) && KINDS[kind].level <= level) out.push({ picture: pic.id, kind, n });
    }
  }
  return out;
}

/**
 * Câu hỏi cho một lượt (mục 4.3): không lặp tranh (mức 2: một tranh có thể hỏi 2 loại liền nhau), có đủ loại hình nếu
 * được, ưu tiên số bé ít sao, không quá 2 câu cùng đáp án.
 * @param {Map<number, number>} mastery số sao của từng số
 * @returns {Array<{ picture: string, kind: string, n: number }>}
 */
export function buildShapeQuestions(level, mastery = new Map(), { rounds = SHAPE_ROUNDS, rng = Math.random } = {}) {
  const byPic = new Map();
  for (const q of questionPool(level)) {
    if (!byPic.has(q.picture)) byPic.set(q.picture, []);
    byPic.get(q.picture).push(q);
  }
  const weight = (q) => (mastery.get(q.n) ?? 0) + rng() * 0.9;
  const out = [];
  const usedKinds = new Set();
  const answers = new Map();
  const okAnswer = (q) => (answers.get(q.n) ?? 0) < 2;
  const pics = shuffle([...byPic.keys()], rng);
  while (out.length < rounds && pics.length) {
    // Ưu tiên tranh có loại hình chưa hỏi, rồi số ít sao.
    pics.sort((a, b) => {
      const qa = byPic.get(a).filter(okAnswer);
      const qb = byPic.get(b).filter(okAnswer);
      const newA = qa.some((q) => !usedKinds.has(q.kind)) ? 0 : 1;
      const newB = qb.some((q) => !usedKinds.has(q.kind)) ? 0 : 1;
      if (newA !== newB) return newA - newB;
      return Math.min(...qa.map(weight), 99) - Math.min(...qb.map(weight), 99);
    });
    const pic = pics.shift();
    const qs = byPic.get(pic).filter(okAnswer).sort((a, b) => (usedKinds.has(a.kind) - usedKinds.has(b.kind)) || weight(a) - weight(b));
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
