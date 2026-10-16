// Trò Tô màu (SPEC-coloring.md): hình nét SVG chia thành từng phần có tên tiếng Anh / Việt; bé chọn màu rồi chạm phần
// nào là tô kín phần đó. Bông giao việc "Color the wings pink!". Không cần ảnh, chạy offline.

export const COLORS = [
  { id: 'red', en: 'red', vi: 'đỏ', hex: '#ef4444' },
  { id: 'orange', en: 'orange', vi: 'cam', hex: '#fb923c' },
  { id: 'yellow', en: 'yellow', vi: 'vàng', hex: '#fde047' },
  { id: 'green', en: 'green', vi: 'xanh lá', hex: '#4ade80' },
  { id: 'blue', en: 'blue', vi: 'xanh dương', hex: '#60a5fa' },
  { id: 'purple', en: 'purple', vi: 'tím', hex: '#a78bfa' },
  { id: 'pink', en: 'pink', vi: 'hồng', hex: '#f9a8d4' },
  { id: 'brown', en: 'brown', vi: 'nâu', hex: '#a16207' },
  { id: 'black', en: 'black', vi: 'đen', hex: '#3f3f46' },
  { id: 'white', en: 'white', vi: 'trắng', hex: '#ffffff' },
];
export const COLOR_BY_ID = new Map(COLORS.map((c) => [c.id, c]));
const PAPER = '#ffffff';
const INK = '#2b2b2b';
const BRIGHT = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];

export const GROUPS = [
  { id: 'animals', emoji: '🐾', en: 'Animals', vi: 'Con vật' },
  { id: 'things', emoji: '🧸', en: 'Things', vi: 'Đồ vật' },
  { id: 'numbers', emoji: '🔢', en: 'Numbers', vi: 'Số' },
  { id: 'letters', emoji: '🔤', en: 'Letters', vi: 'Chữ cái' },
];

// ---------- Vẽ ----------
const eye = (x, y, r = 4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x + r * 0.2}" cy="${y}" r="${r * 0.5}" fill="${INK}" stroke="none"/>`;

/** Ngôi sao 5 cánh tâm (cx, cy), bán kính r. */
function star(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}"/>`;
}

const sunRays = () => {
  let d = '';
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    const p = (r) => `${(100 + r * Math.cos(a)).toFixed(1)} ${(100 + r * Math.sin(a)).toFixed(1)}`;
    d += `<path d="M${p(62)} L${p(88)}"/>`;
  }
  return d;
};

const petals = () => [0, 60, 120, 180, 240, 300].map((deg) => {
  const a = (deg * Math.PI) / 180;
  return `<circle cx="${(100 + 30 * Math.cos(a)).toFixed(1)}" cy="${(70 + 30 * Math.sin(a)).toFixed(1)}" r="22"/>`;
}).join('');

/**
 * Phần hình: { id, en, vi, plural?, colors (màu hợp lý để Bông giao), shapes (SVG không màu), line? (phần là nét: tô màu nét) }.
 * Thứ tự phần = thứ tự vẽ (phần sau đè phần trước).
 */
const part = (id, en, vi, colors, shapes, extra = {}) => ({ id, en, vi, colors, shapes, plural: false, ...extra });
const many = (id, en, vi, colors, shapes, extra = {}) => part(id, en, vi, colors, shapes, { plural: true, ...extra });

const DRAWN = [
  {
    id: 'butterfly', group: 'animals', emoji: '🦋', en: 'butterfly', vi: 'con bướm',
    parts: [
      many('antennae', 'antennae', 'cái râu', ['black', 'brown'], '<path d="M94 36 Q84 20 76 14"/><path d="M106 36 Q116 20 124 14"/>', { line: true }),
      many('wings', 'wings', 'cái cánh', ['pink', 'purple', 'blue', 'orange', 'yellow'],
        '<ellipse cx="62" cy="72" rx="46" ry="36" transform="rotate(-25 62 72)"/><ellipse cx="138" cy="72" rx="46" ry="36" transform="rotate(25 138 72)"/>'
        + '<ellipse cx="70" cy="138" rx="32" ry="26" transform="rotate(25 70 138)"/><ellipse cx="130" cy="138" rx="32" ry="26" transform="rotate(-25 130 138)"/>'),
      part('body', 'body', 'cái thân', ['black', 'brown'], '<ellipse cx="100" cy="112" rx="11" ry="56"/>'),
      part('head', 'head', 'cái đầu', ['black', 'brown'], '<circle cx="100" cy="46" r="15"/>'),
    ],
    details: `${eye(94, 44, 3.5)}${eye(106, 44, 3.5)}<path d="M95 52 Q100 56 105 52"/>`,
  },
  {
    id: 'bird', group: 'animals', emoji: '🐦', en: 'bird', vi: 'con chim',
    parts: [
      part('tail', 'tail', 'cái đuôi', ['blue', 'red', 'yellow', 'brown'], '<path d="M50 100 L10 78 L16 122 Z"/>'),
      many('legs', 'legs', 'cái chân', ['black', 'orange', 'brown'],
        '<path d="M88 145 L86 180 M86 180 L76 187 M86 180 L95 187"/><path d="M112 145 L114 180 M114 180 L105 187 M114 180 L124 186"/>', { line: true }),
      part('body', 'body', 'cái thân', ['blue', 'red', 'yellow', 'brown'], '<ellipse cx="95" cy="110" rx="56" ry="42"/>'),
      part('wing', 'wing', 'cái cánh', ['pink', 'blue', 'green', 'purple'], '<path d="M58 100 Q90 70 126 100 Q95 136 58 100 Z"/>'),
      part('head', 'head', 'cái đầu', ['blue', 'red', 'yellow', 'brown'], '<circle cx="146" cy="74" r="28"/>'),
      part('beak', 'beak', 'cái mỏ', ['orange', 'yellow'], '<path d="M170 66 L196 77 L170 88 Z"/>'),
    ],
    details: eye(154, 68, 5),
  },
  {
    id: 'fish', group: 'animals', emoji: '🐟', en: 'fish', vi: 'con cá',
    parts: [
      part('tail', 'tail', 'cái đuôi', ['orange', 'yellow', 'blue', 'purple'], '<path d="M54 100 L12 64 Q22 100 12 136 Z"/>'),
      many('fins', 'fins', 'cái vây', ['orange', 'yellow', 'blue', 'purple', 'red'], '<path d="M80 66 Q100 22 140 62 Z"/><path d="M92 134 Q108 168 128 136 Z"/>'),
      part('body', 'body', 'cái thân', ['orange', 'yellow', 'blue', 'green', 'pink'], '<ellipse cx="106" cy="100" rx="66" ry="42"/>'),
    ],
    details: `${eye(146, 90, 7)}<path d="M126 72 Q114 100 126 128"/><path d="M168 106 Q163 111 157 107"/><path d="M80 88 Q90 96 80 104"/><path d="M96 82 Q106 90 96 98"/><path d="M96 104 Q106 112 96 120"/>`,
  },
  {
    id: 'cat', group: 'animals', emoji: '🐱', en: 'cat', vi: 'con mèo',
    parts: [
      part('tail', 'tail', 'cái đuôi', ['orange', 'black', 'brown'], '<path d="M138 165 Q186 160 178 112 Q176 100 166 104 Q170 146 132 150 Z"/>'),
      part('body', 'body', 'cái thân', ['orange', 'black', 'brown'], '<ellipse cx="100" cy="150" rx="46" ry="42"/>'),
      many('ears', 'ears', 'cái tai', ['pink', 'orange', 'black'], '<path d="M62 62 L68 16 L98 44 Z"/><path d="M138 62 L132 16 L102 44 Z"/>'),
      part('head', 'head', 'cái đầu', ['orange', 'black', 'brown'], '<circle cx="100" cy="78" r="42"/>'),
    ],
    details: `${eye(84, 72, 6)}${eye(116, 72, 6)}<path d="M95 88 L105 88 L100 94 Z" fill="${INK}"/>`
      + '<path d="M100 94 Q94 102 88 98"/><path d="M100 94 Q106 102 112 98"/>'
      + '<path d="M70 90 L46 86"/><path d="M70 96 L46 100"/><path d="M130 90 L154 86"/><path d="M130 96 L154 100"/>',
  },
  {
    id: 'ladybug', group: 'animals', emoji: '🐞', en: 'ladybug', vi: 'con bọ rùa',
    parts: [
      many('legs', 'legs', 'cái chân', ['black'],
        '<path d="M64 96 L34 82"/><path d="M58 122 L26 126"/><path d="M66 150 L38 170"/><path d="M136 96 L166 82"/><path d="M142 122 L174 126"/><path d="M134 150 L162 170"/>', { line: true }),
      part('head', 'head', 'cái đầu', ['black'], '<circle cx="100" cy="62" r="26"/>'),
      part('shell', 'shell', 'cái lưng', ['red', 'orange', 'yellow'], '<circle cx="100" cy="122" r="58"/>'),
      many('spots', 'spots', 'chấm tròn', ['black'], '<circle cx="76" cy="104" r="11"/><circle cx="124" cy="104" r="11"/><circle cx="74" cy="142" r="10"/><circle cx="126" cy="142" r="10"/>'),
    ],
    details: `<path d="M100 66 L100 180"/>${eye(90, 50, 4.5)}${eye(110, 50, 4.5)}<path d="M92 38 Q86 24 80 20"/><path d="M108 38 Q114 24 120 20"/>`,
  },
  {
    id: 'flower', group: 'things', emoji: '🌸', en: 'flower', vi: 'bông hoa',
    parts: [
      part('stem', 'stem', 'cuống hoa', ['green'], '<rect x="95" y="96" width="10" height="96" rx="4"/>'),
      many('leaves', 'leaves', 'cái lá', ['green'],
        '<ellipse cx="76" cy="158" rx="22" ry="10" transform="rotate(-30 76 158)"/><ellipse cx="124" cy="146" rx="22" ry="10" transform="rotate(30 124 146)"/>'),
      many('petals', 'petals', 'cánh hoa', ['pink', 'red', 'purple', 'blue', 'orange'], petals()),
      part('middle', 'middle', 'nhụy hoa', ['yellow', 'orange'], '<circle cx="100" cy="70" r="20"/>'),
    ],
    details: `${eye(93, 66, 3)}${eye(107, 66, 3)}<path d="M93 76 Q100 81 107 76"/>`,
  },
  {
    id: 'tree', group: 'things', emoji: '🌳', en: 'tree', vi: 'cái cây',
    parts: [
      part('trunk', 'trunk', 'thân cây', ['brown'], '<path d="M86 192 L90 110 L110 110 L114 192 Z"/>'),
      many('leaves', 'leaves', 'tán lá', ['green'], '<circle cx="58" cy="96" r="32"/><circle cx="142" cy="96" r="32"/><circle cx="100" cy="64" r="48"/>'),
      many('apples', 'apples', 'quả táo', ['red', 'yellow', 'green'],
        '<circle cx="78" cy="72" r="9"/><circle cx="118" cy="50" r="9"/><circle cx="132" cy="96" r="9"/><circle cx="96" cy="104" r="9"/><circle cx="56" cy="104" r="9"/>'),
    ],
    details: '<path d="M10 192 L190 192"/>',
  },
  {
    id: 'sun', group: 'things', emoji: '☀️', en: 'sun', vi: 'ông mặt trời',
    parts: [
      many('rays', 'rays', 'tia nắng', ['yellow', 'orange', 'red'], sunRays(), { line: true }),
      part('sun', 'sun', 'mặt trời', ['yellow', 'orange'], '<circle cx="100" cy="100" r="50"/>'),
    ],
    details: `${eye(84, 90, 6)}${eye(116, 90, 6)}<path d="M80 112 Q100 130 120 112"/>`,
  },
  {
    id: 'house', group: 'things', emoji: '🏠', en: 'house', vi: 'ngôi nhà',
    parts: [
      many('walls', 'walls', 'bức tường', ['yellow', 'blue', 'pink', 'orange'], '<rect x="42" y="92" width="116" height="96"/>'),
      part('chimney', 'chimney', 'ống khói', ['red', 'brown', 'black'], '<rect x="128" y="36" width="18" height="40"/>'),
      part('roof', 'roof', 'mái nhà', ['red', 'brown', 'blue', 'orange'], '<path d="M26 98 L100 30 L174 98 Z"/>'),
      part('door', 'door', 'cửa ra vào', ['brown', 'red', 'green', 'blue'], '<rect x="86" y="128" width="30" height="60" rx="3"/>'),
      many('windows', 'windows', 'cửa sổ', ['blue', 'yellow'], '<rect x="54" y="110" width="24" height="24"/><rect x="124" y="110" width="24" height="24"/>'),
    ],
    details: `<circle cx="110" cy="160" r="3" fill="${INK}"/><path d="M66 110 L66 134 M54 122 L78 122"/><path d="M136 110 L136 134 M124 122 L148 122"/><path d="M8 188 L192 188"/>`,
  },
  {
    id: 'car', group: 'things', emoji: '🚗', en: 'car', vi: 'ô tô',
    parts: [
      part('car', 'car', 'thân xe', ['red', 'blue', 'yellow', 'green', 'orange'],
        '<path d="M18 142 L18 112 Q20 100 38 98 L58 98 L74 68 Q79 60 92 60 L134 60 Q145 60 151 69 L168 98 Q186 101 186 116 L186 142 Z"/>'),
      many('windows', 'windows', 'cửa sổ', ['blue'], '<path d="M80 96 L91 70 L110 70 L110 96 Z"/><path d="M118 96 L118 70 L139 70 L152 96 Z"/>'),
      many('wheels', 'wheels', 'bánh xe', ['black'], '<circle cx="56" cy="144" r="20"/><circle cx="150" cy="144" r="20"/>'),
      part('light', 'light', 'cái đèn', ['yellow', 'orange'], '<circle cx="175" cy="114" r="9"/>'),
    ],
    details: '<circle cx="56" cy="144" r="7"/><circle cx="150" cy="144" r="7"/><path d="M114 100 L114 136"/>',
  },
  {
    id: 'ice-cream', group: 'things', emoji: '🍦', en: 'ice cream', vi: 'cây kem',
    parts: [
      part('cherry', 'cherry', 'quả anh đào', ['red'], '<circle cx="100" cy="36" r="11"/>'),
      part('cone', 'cone', 'ốc quế', ['brown', 'orange', 'yellow'], '<path d="M62 102 L138 102 L100 192 Z"/>'),
      part('ice-cream', 'ice cream', 'viên kem', ['pink', 'brown', 'yellow', 'green', 'purple'],
        '<path d="M58 100 Q52 56 100 48 Q148 56 142 100 Q128 112 116 102 Q100 114 84 102 Q72 112 58 100 Z"/>'),
    ],
    details: '<path d="M100 25 Q104 14 112 10"/><path d="M80 116 L106 160"/><path d="M120 116 L94 160"/>',
  },
];

// ---------- Số và chữ cái ----------
export const NUMBER_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const GLYPH_FONT = 'font-family="Nunito, ui-rounded, sans-serif" font-weight="900" text-anchor="middle"';

function numberPicture(n) {
  const word = NUMBER_WORDS[n - 1];
  const rows = n <= 5 ? [n] : [5, n - 5];
  const r = rows.length > 1 ? 12 : 14;
  let stars = '';
  rows.forEach((count, row) => {
    const y = rows.length > 1 ? 150 + row * 32 : 166;
    const x0 = 100 - ((count - 1) * 34) / 2;
    for (let i = 0; i < count; i++) stars += star(x0 + i * 34, y, r);
  });
  const glyphY = rows.length > 1 ? 118 : 126;
  return {
    id: `number-${n}`, group: 'numbers', emoji: String(n), label: String(n), en: `number ${word}`, vi: `số ${n}`,
    parts: [
      part('number', `number ${word}`, `số ${n}`, BRIGHT, `<text x="100" y="${glyphY}" font-size="${rows.length > 1 ? 120 : 130}" ${GLYPH_FONT}>${n}</text>`, { glyph: true }),
      n === 1
        ? part('stars', 'star', 'ngôi sao', ['yellow', ...BRIGHT.filter((c) => c !== 'yellow')], stars)
        : many('stars', `${word} stars`, `${n} ngôi sao`, ['yellow', ...BRIGHT.filter((c) => c !== 'yellow')], stars, { count: n }),
    ],
    details: '',
  };
}

const WIDE = new Set(['M', 'W']);
function letterPicture(L) {
  const l = L.toLowerCase();
  const big = WIDE.has(L) ? 100 : 124;
  const small = WIDE.has(L) ? 84 : 104;
  return {
    id: `letter-${l}`, group: 'letters', emoji: L, label: `${L}${l}`, en: `letter ${L}`, vi: `chữ ${L}`,
    parts: [
      part('big', `big ${L}`, `chữ ${L} hoa`, BRIGHT, `<text x="66" y="150" font-size="${big}" ${GLYPH_FONT}>${L}</text>`, { glyph: true }),
      part('small', `small ${l}`, `chữ ${l} thường`, BRIGHT, `<text x="152" y="150" font-size="${small}" ${GLYPH_FONT}>${l}</text>`, { glyph: true }),
    ],
    details: '',
  };
}

export const PICTURES = [
  ...DRAWN,
  ...NUMBER_WORDS.map((_, i) => numberPicture(i + 1)),
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letterPicture),
];
export const PICTURE_BY_ID = new Map(PICTURES.map((p) => [p.id, p]));
export const picturesIn = (group) => PICTURES.filter((p) => p.group === group);

// ---------- Câu nói ----------
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const be = (p) => (p.plural ? 'are' : 'is');
/** Đếm nhóm sao trước khi khen: "One, two, three!" */
const countLine = (p) => (p.count > 1 ? `${capital(NUMBER_WORDS.slice(0, p.count).join(', '))}! ` : '');

export const introSentence = (pic) => [`Let's color the ${pic.en}!`, `Mình tô ${pic.vi} nhé!`];
export const pickSentence = (color) => [`${capital(color.en)}!`, `Màu ${color.vi}!`];
export const requestSentence = (p, color) => [`Color the ${p.en} ${color.en}!`, `Tô màu ${color.vi} cho ${p.vi}!`];
export const nextRequestSentence = (p, color) => [`Now color the ${p.en} ${color.en}!`, `Giờ tô màu ${color.vi} cho ${p.vi}!`];
export const paintedSentence = (p, color) => [`${countLine(p)}The ${p.en} ${be(p)} ${color.en}!`, `${capital(p.vi)} màu ${color.vi}!`];
export const trySentence = (color) => [`Now try ${color.en}!`, `Giờ thử màu ${color.vi} nhé!`];
export const doneSentence = (pic) => [`Wow! A beautiful ${pic.en}!`, `${capital(pic.vi)} đẹp quá!`];
export const FREE_LINE = ['Color anything you like!', 'Con thích tô gì thì tô nhé!'];
export const RESET_LINE = ["Let's start again!", 'Mình tô lại từ đầu nhé!'];

// ---------- Trạng thái ----------
/** Màu đã lưu của một hình: bỏ mã phần / mã màu lạ (bản cũ, dữ liệu hỏng). */
export function cleanColors(pic, saved) {
  const out = {};
  if (!pic || !saved || typeof saved !== 'object') return out;
  for (const p of pic.parts) {
    const c = saved[p.id];
    if (COLOR_BY_ID.has(c) && c !== 'white') out[p.id] = c; // trắng = chưa tô
  }
  return out;
}

/** Mọi phần đều đã có màu (trắng = tẩy = chưa tô). */
export const isComplete = (pic, colors) => pic.parts.every((p) => colors[p.id] && colors[p.id] !== 'white');

/**
 * Việc tiếp theo: một phần chưa giao trong lần chơi này (ưu tiên phần chưa tô), màu hợp lý của phần đó và khác màu đang có.
 * @param {Set<string>} asked mã phần đã giao
 * @returns {{ part: object, color: object } | null}
 */
export function pickRequest(pic, colors, asked, rng = Math.random) {
  // Chỉ giao phần chưa giao và còn ít nhất một màu hợp lý khác màu đang có (lá đã xanh lá thì không bảo tô xanh lá nữa).
  const open = pic.parts.filter((p) => !asked.has(p.id) && p.colors.some((c) => c !== colors[p.id]));
  if (!open.length) return null; // hết việc → tô tự do
  const blank = open.filter((p) => !colors[p.id]);
  const pool = blank.length ? blank : open;
  const p = pool[Math.floor(rng() * pool.length)];
  const options = p.colors.filter((c) => c !== colors[p.id]);
  return { part: p, color: COLOR_BY_ID.get(options[Math.floor(rng() * options.length)]) };
}

/** Tô một phần: màu trắng là tẩy — phần về "chưa tô" (xóa khỏi danh sách màu). */
export function applyColor(colors, partId, colorId) {
  const next = { ...colors };
  if (colorId === 'white') delete next[partId];
  else next[partId] = colorId;
  return next;
}

const hexOf = (id) => COLOR_BY_ID.get(id)?.hex ?? PAPER;

/** SVG của hình với màu đã tô. Mỗi phần là <g data-part> để chạm; phần nét (line) tô màu nét. */
export function pictureSvg(pic, colors = {}) {
  const parts = pic.parts.map((p) => {
    const hex = hexOf(colors[p.id]);
    const data = `data-part="${p.id}" data-color="${colors[p.id] ?? ''}"`;
    if (p.glyph) {
      // Chữ / số: viền (nét dày) vẽ trước, phần tô vẽ đè lên — che các nét chồng bên trong chữ của phông (gạch ngang chữ A, số 4…).
      return `<g class="cl-part" ${data} stroke-linejoin="round" style="fill:${hex}">`
        + `<g stroke="${INK}" stroke-width="7">${p.shapes}</g><g stroke="none">${p.shapes}</g></g>`;
    }
    if (p.line) {
      return `<g class="cl-part line" ${data} fill="none" stroke-linecap="round" stroke-linejoin="round">`
        + `<g stroke="${INK}" stroke-width="13">${p.shapes}</g><g class="cl-ink" stroke-width="7" style="stroke:${hex}">${p.shapes}</g></g>`;
    }
    return `<g class="cl-part" ${data} stroke="${INK}" stroke-width="3" stroke-linejoin="round" style="fill:${hex}">${p.shapes}</g>`;
  }).join('');
  const details = pic.details
    ? `<g class="cl-detail" pointer-events="none" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${pic.details}</g>`
    : '';
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${pic.en}">${parts}${details}</svg>`;
}

/** Tô một phần trong SVG đang hiện (không vẽ lại cả hình, để màu chuyển mượt). */
export function paintPart(el, p, colorId) {
  const hex = hexOf(colorId);
  el.dataset.color = colorId === 'white' ? '' : colorId;
  if (p.line) el.querySelector('.cl-ink').style.stroke = hex;
  else el.style.fill = hex;
}
