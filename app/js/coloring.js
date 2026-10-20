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

/** Bờm sư tử: vòng tròn nhỏ quanh mặt. */
const mane = () => {
  let d = '';
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    d += `<circle cx="${(100 + 54 * Math.cos(a)).toFixed(1)}" cy="${(100 + 54 * Math.sin(a)).toFixed(1)}" r="22"/>`;
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
    id: 'dog', group: 'animals', emoji: '🐶', en: 'dog', vi: 'con chó',
    parts: [
      part('tail', 'tail', 'cái đuôi', ['brown', 'orange', 'black'], '<path d="M136 162 Q180 156 174 112 Q172 102 162 106 Q166 142 132 148 Z"/>'),
      part('body', 'body', 'cái thân', ['brown', 'orange', 'yellow', 'black'], '<ellipse cx="100" cy="152" rx="44" ry="40"/>'),
      part('head', 'head', 'cái đầu', ['brown', 'orange', 'yellow'], '<circle cx="100" cy="76" r="38"/>'),
      many('ears', 'ears', 'cái tai', ['brown', 'black', 'orange'],
        '<ellipse cx="62" cy="80" rx="14" ry="30" transform="rotate(18 62 80)"/><ellipse cx="138" cy="80" rx="14" ry="30" transform="rotate(-18 138 80)"/>'),
      part('nose', 'nose', 'cái mũi', ['black', 'brown'], '<ellipse cx="100" cy="90" rx="10" ry="7"/>'),
    ],
    details: `${eye(86, 70, 5)}${eye(114, 70, 5)}<path d="M100 97 L100 104"/><path d="M90 106 Q100 114 110 106"/><path d="M84 176 L84 190"/><path d="M116 176 L116 190"/>`,
  },
  {
    id: 'cow', group: 'animals', emoji: '🐮', en: 'cow', vi: 'con bò',
    parts: [
      many('horns', 'horns', 'cái sừng', ['yellow', 'brown', 'orange'], '<path d="M72 50 Q56 32 64 14 Q74 32 86 42 Z"/><path d="M128 50 Q144 32 136 14 Q126 32 114 42 Z"/>'),
      many('ears', 'ears', 'cái tai', ['pink', 'brown', 'black'],
        '<ellipse cx="48" cy="72" rx="24" ry="11" transform="rotate(-15 48 72)"/><ellipse cx="152" cy="72" rx="24" ry="11" transform="rotate(15 152 72)"/>'),
      part('head', 'head', 'cái đầu', ['brown', 'black', 'yellow'], '<rect x="60" y="38" width="80" height="116" rx="36"/>'),
      many('spots', 'spots', 'đốm', ['black', 'brown'], '<circle cx="80" cy="60" r="11"/><circle cx="124" cy="70" r="9"/>'),
      part('nose', 'nose', 'cái mũi', ['pink', 'red'], '<ellipse cx="100" cy="138" rx="44" ry="28"/>'),
    ],
    details: `${eye(84, 96, 6)}${eye(116, 96, 6)}<ellipse cx="86" cy="136" rx="5" ry="7" fill="${INK}"/><ellipse cx="114" cy="136" rx="5" ry="7" fill="${INK}"/><path d="M88 152 Q100 158 112 152"/>`,
  },
  {
    id: 'pig', group: 'animals', emoji: '🐷', en: 'pig', vi: 'con lợn',
    parts: [
      many('ears', 'ears', 'cái tai', ['pink', 'red'], '<path d="M56 66 L58 22 L92 44 Z"/><path d="M144 66 L142 22 L108 44 Z"/>'),
      part('head', 'head', 'cái đầu', ['pink'], '<circle cx="100" cy="106" r="62"/>'),
      part('nose', 'nose', 'cái mũi', ['pink', 'red'], '<ellipse cx="100" cy="124" rx="28" ry="20"/>'),
    ],
    details: `${eye(78, 88, 6)}${eye(122, 88, 6)}<ellipse cx="91" cy="124" rx="5" ry="8" fill="${INK}"/><ellipse cx="109" cy="124" rx="5" ry="8" fill="${INK}"/><path d="M84 152 Q100 162 116 152"/>`,
  },
  {
    id: 'duck', group: 'animals', emoji: '🦆', en: 'duck', vi: 'con vịt',
    parts: [
      part('tail', 'tail', 'cái đuôi', ['yellow', 'brown', 'green'], '<path d="M40 124 L14 98 L46 108 Z"/>'),
      many('feet', 'feet', 'bàn chân', ['orange', 'yellow'], '<path d="M76 168 L62 190 L92 190 Z"/><path d="M110 168 L98 190 L128 190 Z"/>'),
      part('body', 'body', 'cái thân', ['yellow', 'brown', 'green'], '<ellipse cx="92" cy="134" rx="62" ry="40"/>'),
      part('wing', 'wing', 'cái cánh', ['yellow', 'orange', 'brown', 'green'], '<path d="M60 128 Q96 100 128 130 Q94 156 60 128 Z"/>'),
      part('head', 'head', 'cái đầu', ['yellow', 'green', 'brown'], '<circle cx="138" cy="76" r="30"/>'),
      part('beak', 'beak', 'cái mỏ', ['orange', 'yellow'], '<path d="M160 70 Q194 70 194 84 Q178 96 158 90 Z"/>'),
    ],
    details: `${eye(146, 70, 5)}<path d="M162 82 L190 80"/>`,
  },
  {
    id: 'rabbit', group: 'animals', emoji: '🐰', en: 'rabbit', vi: 'con thỏ',
    parts: [
      many('ears', 'ears', 'cái tai', ['pink', 'brown', 'yellow'],
        '<ellipse cx="80" cy="46" rx="14" ry="36" transform="rotate(-8 80 46)"/><ellipse cx="120" cy="46" rx="14" ry="36" transform="rotate(8 120 46)"/>'),
      part('body', 'body', 'cái thân', ['brown', 'pink', 'yellow', 'orange'], '<ellipse cx="100" cy="156" rx="42" ry="36"/>'),
      many('feet', 'feet', 'bàn chân', ['pink', 'brown'], '<ellipse cx="76" cy="188" rx="18" ry="8"/><ellipse cx="124" cy="188" rx="18" ry="8"/>'),
      part('head', 'head', 'cái đầu', ['brown', 'pink', 'yellow', 'orange'], '<circle cx="100" cy="100" r="38"/>'),
    ],
    details: `${eye(86, 94, 5)}${eye(114, 94, 5)}<path d="M96 108 L104 108 L100 113 Z" fill="${INK}"/><path d="M100 113 Q94 120 89 117"/><path d="M100 113 Q106 120 111 117"/><path d="M80 112 L60 110"/><path d="M120 112 L140 110"/>`,
  },
  {
    id: 'elephant', group: 'animals', emoji: '🐘', en: 'elephant', vi: 'con voi',
    parts: [
      many('ears', 'ears', 'cái tai', ['pink', 'blue', 'purple', 'brown'], '<ellipse cx="50" cy="88" rx="40" ry="46"/><ellipse cx="150" cy="88" rx="40" ry="46"/>'),
      part('head', 'head', 'cái đầu', ['blue', 'purple', 'brown', 'black'], '<ellipse cx="100" cy="84" rx="42" ry="48"/>'),
      part('trunk', 'trunk', 'cái vòi', ['blue', 'purple', 'brown', 'black'],
        '<path d="M86 116 Q84 152 94 172 Q100 186 116 180 Q122 174 114 168 Q104 158 112 116 Z"/>'),
    ],
    details: `${eye(82, 80, 6)}${eye(118, 80, 6)}<path d="M96 140 L104 140"/><path d="M96 156 L106 156"/>`,
  },
  {
    id: 'lion', group: 'animals', emoji: '🦁', en: 'lion', vi: 'con sư tử',
    parts: [
      part('mane', 'mane', 'cái bờm', ['orange', 'brown', 'yellow', 'red'], mane()),
      many('ears', 'ears', 'cái tai', ['yellow', 'orange', 'brown'], '<circle cx="70" cy="62" r="14"/><circle cx="130" cy="62" r="14"/>'),
      part('face', 'face', 'khuôn mặt', ['yellow', 'orange'], '<circle cx="100" cy="102" r="44"/>'),
      part('nose', 'nose', 'cái mũi', ['brown', 'pink', 'black'], '<ellipse cx="100" cy="116" rx="14" ry="10"/>'),
    ],
    details: `${eye(84, 92, 6)}${eye(116, 92, 6)}<path d="M100 126 Q92 136 84 132"/><path d="M100 126 Q108 136 116 132"/><path d="M78 118 L56 114"/><path d="M78 124 L56 128"/><path d="M122 118 L144 114"/><path d="M122 124 L144 128"/>`,
  },
  {
    id: 'giraffe', group: 'animals', emoji: '🦒', en: 'giraffe', vi: 'con hươu cao cổ',
    parts: [
      part('tail', 'tail', 'cái đuôi', ['brown', 'black'], '<path d="M60 124 Q46 140 44 160"/>', { line: true }),
      many('legs', 'legs', 'cái chân', ['yellow', 'orange', 'brown'],
        '<rect x="68" y="138" width="11" height="52" rx="4"/><rect x="86" y="140" width="11" height="50" rx="4"/><rect x="118" y="140" width="11" height="50" rx="4"/><rect x="136" y="138" width="11" height="52" rx="4"/>'),
      part('body', 'body', 'cái thân', ['yellow', 'orange'], '<ellipse cx="104" cy="130" rx="48" ry="26"/>'),
      part('neck', 'neck', 'cái cổ', ['yellow', 'orange'], '<path d="M122 122 L136 44 L158 48 L150 126 Z"/>'),
      many('horns', 'horns', 'cái sừng', ['brown', 'orange'], '<path d="M150 28 L148 12"/><path d="M162 28 L166 12"/>', { line: true }),
      part('head', 'head', 'cái đầu', ['yellow', 'orange'], '<ellipse cx="160" cy="38" rx="26" ry="15" transform="rotate(12 160 38)"/>'),
      many('spots', 'spots', 'đốm', ['brown', 'orange'],
        '<circle cx="84" cy="124" r="7"/><circle cx="106" cy="138" r="8"/><circle cx="124" cy="120" r="6"/><circle cx="72" cy="138" r="5"/><circle cx="142" cy="96" r="5"/><circle cx="146" cy="70" r="5"/><circle cx="140" cy="116" r="5"/>'),
    ],
    details: `${eye(166, 34, 4)}<path d="M180 44 Q176 48 172 46"/>`,
  },
  {
    id: 'turtle', group: 'animals', emoji: '🐢', en: 'turtle', vi: 'con rùa',
    parts: [
      part('tail', 'tail', 'cái đuôi', ['green', 'yellow'], '<path d="M44 132 L16 146 L44 146 Z"/>'),
      many('legs', 'legs', 'cái chân', ['green', 'yellow'],
        '<ellipse cx="62" cy="148" rx="14" ry="13"/><ellipse cx="90" cy="154" rx="14" ry="13"/><ellipse cx="122" cy="154" rx="14" ry="13"/><ellipse cx="150" cy="148" rx="14" ry="13"/>'),
      part('head', 'head', 'cái đầu', ['green', 'yellow'], '<circle cx="170" cy="118" r="22"/>'),
      part('shell', 'shell', 'cái mai', ['green', 'brown', 'orange', 'blue'], '<path d="M36 142 Q40 58 102 56 Q162 58 166 142 Z"/>'),
      many('spots', 'spots', 'hoa văn', ['brown', 'yellow', 'orange', 'green'],
        '<circle cx="78" cy="110" r="13"/><circle cx="118" cy="92" r="15"/><circle cx="128" cy="126" r="10"/><circle cx="96" cy="132" r="8"/>'),
    ],
    details: `${eye(178, 112, 5)}<path d="M178 126 Q184 128 188 124"/><path d="M8 168 L192 168"/>`,
  },
  {
    id: 'frog', group: 'animals', emoji: '🐸', en: 'frog', vi: 'con ếch',
    parts: [
      many('legs', 'legs', 'cái chân', ['green', 'yellow'],
        '<ellipse cx="50" cy="168" rx="30" ry="15" transform="rotate(-10 50 168)"/><ellipse cx="150" cy="168" rx="30" ry="15" transform="rotate(10 150 168)"/>'),
      many('eyes', 'eyes', 'đôi mắt', ['green', 'yellow'], '<circle cx="70" cy="60" r="24"/><circle cx="130" cy="60" r="24"/>'),
      part('body', 'body', 'cái thân', ['green', 'yellow', 'blue'], '<ellipse cx="100" cy="122" rx="64" ry="54"/>'),
      part('belly', 'belly', 'cái bụng', ['yellow', 'green', 'pink'], '<ellipse cx="100" cy="142" rx="36" ry="28"/>'),
    ],
    details: `${eye(70, 56, 10)}${eye(130, 56, 10)}<path d="M72 96 Q100 114 128 96"/><circle cx="92" cy="84" r="1.5" fill="${INK}"/><circle cx="108" cy="84" r="1.5" fill="${INK}"/>`,
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
  {
    id: 'bus', group: 'things', emoji: '🚌', en: 'bus', vi: 'xe buýt',
    parts: [
      part('bus', 'bus', 'thân xe', ['yellow', 'red', 'blue', 'green', 'orange'], '<rect x="14" y="50" width="172" height="98" rx="14"/>'),
      many('windows', 'windows', 'cửa sổ', ['blue', 'yellow'], '<rect x="26" y="64" width="30" height="30" rx="4"/><rect x="64" y="64" width="30" height="30" rx="4"/><rect x="102" y="64" width="30" height="30" rx="4"/>'),
      part('door', 'door', 'cửa xe', ['blue', 'red', 'brown', 'black'], '<rect x="144" y="64" width="30" height="70" rx="4"/>'),
      many('wheels', 'wheels', 'bánh xe', ['black'], '<circle cx="52" cy="150" r="20"/><circle cx="148" cy="150" r="20"/>'),
    ],
    details: '<circle cx="52" cy="150" r="7"/><circle cx="148" cy="150" r="7"/><path d="M14 112 L140 112"/><path d="M159 64 L159 134"/><path d="M8 172 L192 172"/>',
  },
  {
    id: 'train', group: 'things', emoji: '🚂', en: 'train', vi: 'tàu hỏa',
    parts: [
      part('chimney', 'chimney', 'ống khói', ['red', 'black', 'brown'], '<rect x="40" y="46" width="24" height="40" rx="3"/>'),
      part('train', 'train', 'thân tàu', ['red', 'blue', 'green', 'yellow', 'orange'], '<path d="M20 140 L20 90 Q20 82 28 82 L110 82 L110 52 L172 52 L172 140 Z"/>'),
      part('roof', 'roof', 'mái tàu', ['red', 'blue', 'black', 'brown'], '<rect x="100" y="32" width="82" height="22" rx="4"/>'),
      part('window', 'window', 'cửa sổ', ['blue', 'yellow'], '<rect x="124" y="64" width="34" height="30" rx="4"/>'),
      many('wheels', 'wheels', 'bánh xe', ['black', 'red'], '<circle cx="48" cy="148" r="17"/><circle cx="88" cy="148" r="17"/><circle cx="144" cy="144" r="24"/>'),
    ],
    details: '<circle cx="48" cy="148" r="5"/><circle cx="88" cy="148" r="5"/><circle cx="144" cy="144" r="7"/><circle cx="58" cy="28" r="8"/><circle cx="76" cy="16" r="10"/><path d="M8 172 L192 172"/>',
  },
  {
    id: 'plane', group: 'things', emoji: '✈️', en: 'plane', vi: 'máy bay',
    parts: [
      part('tail', 'tail', 'cái đuôi', ['red', 'blue', 'orange', 'yellow'], '<path d="M28 92 L16 44 L46 44 L64 92 Z"/>'),
      part('plane', 'plane', 'thân máy bay', ['blue', 'red', 'yellow', 'green'], '<path d="M22 92 Q22 80 38 80 L154 80 Q190 84 190 104 Q186 122 158 124 L38 124 Q22 122 22 108 Z"/>'),
      part('wing', 'wing', 'cánh máy bay', ['blue', 'red', 'yellow', 'green', 'orange'], '<path d="M78 106 L122 106 L98 164 L66 164 Z"/>'),
      many('windows', 'windows', 'cửa sổ', ['blue', 'yellow'], '<circle cx="60" cy="96" r="7"/><circle cx="84" cy="96" r="7"/><circle cx="108" cy="96" r="7"/><circle cx="132" cy="96" r="7"/>'),
    ],
    details: '<path d="M158 92 Q172 90 180 98"/>',
  },
  {
    id: 'boat', group: 'things', emoji: '⛵', en: 'boat', vi: 'con thuyền',
    parts: [
      part('mast', 'mast', 'cột buồm', ['brown', 'black'], '<path d="M100 18 L100 138"/>', { line: true }),
      part('flag', 'flag', 'lá cờ', ['red', 'yellow', 'blue', 'green'], '<path d="M100 18 L126 26 L100 34 Z"/>'),
      many('sails', 'sails', 'cánh buồm', ['red', 'yellow', 'blue', 'orange', 'purple', 'pink'],
        '<path d="M106 38 L106 128 L168 128 Z"/><path d="M94 50 L94 128 L48 128 Z"/>'),
      part('boat', 'boat', 'thân thuyền', ['brown', 'red', 'blue', 'orange'], '<path d="M28 136 L172 136 L150 172 L50 172 Z"/>'),
    ],
    details: '<path d="M8 186 Q24 178 40 186 Q56 194 72 186 Q88 178 104 186 Q120 194 136 186 Q152 178 168 186 Q184 194 196 186"/>',
  },
  {
    id: 'cake', group: 'things', emoji: '🎂', en: 'cake', vi: 'bánh sinh nhật',
    parts: [
      part('plate', 'plate', 'cái đĩa', ['blue', 'yellow', 'pink', 'green'], '<ellipse cx="100" cy="176" rx="84" ry="14"/>'),
      part('cake', 'cake', 'cái bánh', ['brown', 'pink', 'yellow', 'orange'], '<rect x="42" y="100" width="116" height="74" rx="8"/>'),
      part('cream', 'cream', 'lớp kem', ['pink', 'yellow', 'purple', 'blue', 'brown'],
        '<path d="M42 116 L42 100 Q42 90 52 90 L148 90 Q158 90 158 100 L158 116 Q148 132 137 116 Q126 132 115 116 Q104 132 93 116 Q82 132 71 116 Q60 132 50 116 Q46 122 42 116 Z"/>'),
      many('candles', 'candles', 'cây nến', ['red', 'blue', 'green', 'yellow', 'purple'],
        '<rect x="68" y="54" width="12" height="36" rx="3"/><rect x="94" y="54" width="12" height="36" rx="3"/><rect x="120" y="54" width="12" height="36" rx="3"/>'),
      many('flames', 'flames', 'ngọn lửa', ['yellow', 'orange'],
        '<path d="M74 52 Q66 42 74 30 Q82 42 74 52 Z"/><path d="M100 52 Q92 42 100 30 Q108 42 100 52 Z"/><path d="M126 52 Q118 42 126 30 Q134 42 126 52 Z"/>'),
    ],
    details: '<path d="M60 146 L140 146"/>',
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
