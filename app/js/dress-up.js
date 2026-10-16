// Trò chơi Mặc đồ (SPEC-dressup.md): tủ đồ, chỗ mặc, câu nói, Bông giao việc, hình vẽ bạn nhỏ + quần áo.
// Bạn nhỏ và quần áo vẽ bằng SVG trên cùng khung 200 × 400 (kiểu búp bê giấy) nên món nào cũng vừa người;
// có mặt trước và mặt sau (chạm bạn nhỏ để xoay người — ba lô nằm sau lưng).

export const DOLL_W = 200;
export const DOLL_H = 400;
export const KIDS = ['boy', 'girl'];
export const VIEWS = ['front', 'back'];
/** Mặc bao nhiêu lần (chưa có việc) thì Bông tự giao việc. */
export const WEARS_PER_REQUEST = 3;

/** Chỗ mặc; thứ tự = thứ tự lớp vẽ (dưới → trên). verb: động từ tiếng Việt cho phụ đề. */
export const SLOTS = [
  { id: 'socks', verb: 'đi', vi: 'Tất', emoji: '🧦', box: [60, 290, 80, 70] },
  { id: 'bottom', verb: 'mặc', vi: 'Quần / chân váy', emoji: '👖', box: [62, 200, 76, 146] },
  { id: 'feet', verb: 'đi', vi: 'Giày / dép', emoji: '👟', box: [60, 330, 80, 32] },
  { id: 'top', verb: 'mặc', vi: 'Áo', emoji: '👕', box: [36, 104, 128, 116] },
  { id: 'dress', verb: 'mặc', vi: 'Váy liền / đồ liền', emoji: '👗', box: [40, 108, 120, 190] },
  { id: 'outer', verb: 'mặc', vi: 'Áo khoác', emoji: '🧥', box: [32, 102, 136, 160] },
  { id: 'back', verb: 'đeo', vi: 'Đeo sau lưng', emoji: '🎒', box: [58, 108, 84, 106] },
  { id: 'neck', verb: 'quàng', vi: 'Cổ (khăn, cà vạt)', emoji: '🧣', box: [72, 94, 56, 70] },
  { id: 'eyes', verb: 'đeo', vi: 'Mắt (kính)', emoji: '👓', box: [56, 58, 88, 32] },
  { id: 'head', verb: 'đội', vi: 'Đầu (mũ, nơ)', emoji: '🧢', box: [48, 8, 104, 60] },
  { id: 'hand', verb: 'cầm', vi: 'Cầm tay', emoji: '✋', box: [98, 56, 100, 180] },
];
export const SLOT_BY_ID = new Map(SLOTS.map((s) => [s.id, s]));

const PLURAL = new Set(['jeans', 'shorts', 'swim shorts', 'glasses', 'sunglasses', 'goggles', 'sneakers', 'boots', 'sandals', 'socks']);
/** Ảnh bố mẹ thay / đồ bố mẹ thêm nằm trong kho ảnh với "mã bài" riêng (SPEC-dressup mục 11). */
export const DRESS_IMAGES = 'dress:items';

// ---------- Hình vẽ quần áo (khung 200 × 400, khớp người bạn nhỏ) ----------

const LINE = 'stroke="#3d2c5e" stroke-opacity="0.35" stroke-width="2" stroke-linejoin="round"';
/** Chiếc bên phải = chiếc bên trái lật qua trục giữa người (x = 100). */
const pair = (left) => `${left}<g transform="translate(200 0) scale(-1 1)">${left}</g>`;

const ART = {
  't-shirt': {
    front: `<path d="M76 108 Q100 124 124 108 L136 112 L162 146 L146 160 L136 148 L136 216 L64 216 L64 148 L54 160 L38 146 L64 112 Z" fill="#ff7a7a" ${LINE}/>
      <path d="M82 110 Q100 124 118 110" fill="none" stroke="#e05555" stroke-width="3"/>
      <rect x="64" y="176" width="72" height="8" fill="#ffd166" opacity="0.8"/>`,
    back: `<path d="M76 108 Q100 114 124 108 L136 112 L162 146 L146 160 L136 148 L136 216 L64 216 L64 148 L54 160 L38 146 L64 112 Z" fill="#ff7a7a" ${LINE}/>
      <rect x="64" y="176" width="72" height="8" fill="#ffd166" opacity="0.8"/>`,
    box: [36, 104, 128, 116],
  },
  shirt: {
    front: `<path d="M64 112 L40 122 L40 212 L64 212 Z" fill="#74c0fc" ${LINE}/><path d="M136 112 L160 122 L160 212 L136 212 Z" fill="#74c0fc" ${LINE}/>
      <rect x="62" y="108" width="76" height="110" rx="10" fill="#74c0fc" ${LINE}/>
      <path d="M84 106 L100 126 L116 106 L110 103 L100 116 L90 103 Z" fill="#fff" ${LINE}/>
      <g fill="#fff"><circle cx="100" cy="140" r="3"/><circle cx="100" cy="160" r="3"/><circle cx="100" cy="180" r="3"/><circle cx="100" cy="200" r="3"/></g>`,
    back: `<path d="M64 112 L40 122 L40 212 L64 212 Z" fill="#74c0fc" ${LINE}/><path d="M136 112 L160 122 L160 212 L136 212 Z" fill="#74c0fc" ${LINE}/>
      <rect x="62" y="108" width="76" height="110" rx="10" fill="#74c0fc" ${LINE}/><rect x="84" y="102" width="32" height="10" rx="4" fill="#fff" ${LINE}/>`,
    box: [36, 100, 128, 120],
  },
  coat: {
    front: `<path d="M62 110 L36 120 L36 214 L62 214 Z" fill="#c9783f" ${LINE}/><path d="M138 110 L164 120 L164 214 L138 214 Z" fill="#c9783f" ${LINE}/>
      <path d="M60 106 L140 106 L144 258 L56 258 Z" fill="#c9783f" ${LINE}/>
      <path d="M84 106 L100 142 L116 106" fill="#a8622e" ${LINE}/>
      <g fill="#5a3418"><circle cx="100" cy="166" r="4"/><circle cx="100" cy="196" r="4"/><circle cx="100" cy="226" r="4"/></g>
      <path d="M68 212 L86 212 M114 212 L132 212" stroke="#5a3418" stroke-width="3" stroke-linecap="round"/>`,
    back: `<path d="M62 110 L36 120 L36 214 L62 214 Z" fill="#c9783f" ${LINE}/><path d="M138 110 L164 120 L164 214 L138 214 Z" fill="#c9783f" ${LINE}/>
      <path d="M60 106 L140 106 L144 258 L56 258 Z" fill="#c9783f" ${LINE}/><path d="M100 200 L100 258" stroke="#a8622e" stroke-width="3"/>`,
    box: [32, 102, 136, 160],
  },
  dress: {
    front: `<path d="M70 112 Q100 126 130 112 L134 170 L158 294 L42 294 L66 170 Z" fill="#ff8fab" ${LINE}/>
      <rect x="65" y="164" width="70" height="10" fill="#ff6b9a"/>
      <g fill="#fff" opacity="0.8"><circle cx="80" cy="220" r="5"/><circle cx="110" cy="240" r="5"/><circle cx="130" cy="270" r="5"/><circle cx="70" cy="270" r="5"/><circle cx="96" cy="196" r="5"/></g>`,
    back: `<path d="M70 112 Q100 116 130 112 L134 170 L158 294 L42 294 L66 170 Z" fill="#ff8fab" ${LINE}/>
      <rect x="65" y="164" width="70" height="10" fill="#ff6b9a"/><path d="M92 170 L84 186 M108 170 L116 186" stroke="#ff6b9a" stroke-width="5" stroke-linecap="round"/>`,
    box: [40, 108, 120, 190],
  },
  swimsuit: {
    front: `<path d="M74 114 L82 114 Q100 130 118 114 L126 114 L134 214 Q132 248 114 252 L100 236 L86 252 Q68 248 66 214 Z" fill="#3ccfcf" ${LINE}/>
      <path d="M68 176 L132 176" stroke="#fff" stroke-width="6"/><path d="M68 190 L132 190" stroke="#ffd166" stroke-width="4"/>`,
    back: `<path d="M74 114 L82 114 Q100 120 118 114 L126 114 L134 214 Q132 248 114 252 L100 236 L86 252 Q68 248 66 214 Z" fill="#3ccfcf" ${LINE}/>
      <path d="M68 176 L132 176" stroke="#fff" stroke-width="6"/><path d="M68 190 L132 190" stroke="#ffd166" stroke-width="4"/>`,
    box: [62, 110, 76, 146],
  },
  jeans: {
    front: `<path d="M64 204 L136 204 L134 342 L104 342 L100 240 L96 342 L66 342 Z" fill="#4d7cc7" ${LINE}/>
      <path d="M64 216 L136 216" stroke="#2f5ea8" stroke-width="3"/><path d="M76 222 Q84 232 92 222 M108 222 Q116 232 124 222" fill="none" stroke="#9cc0ff" stroke-width="2"/>
      <path d="M81 300 L81 342 M119 300 L119 342" stroke="#9cc0ff" stroke-width="1.5" stroke-dasharray="4 3"/>`,
    box: [62, 200, 76, 146],
  },
  shorts: {
    front: `<path d="M64 204 L136 204 L134 264 L104 264 L100 238 L96 264 L66 264 Z" fill="#ffd166" ${LINE}/>
      <path d="M64 214 L136 214" stroke="#f4a940" stroke-width="3"/><path d="M96 214 L94 226 M104 214 L106 226" stroke="#f4a940" stroke-width="2"/>`,
    box: [62, 200, 76, 68],
  },
  cap: {
    front: `<path d="M58 58 Q58 20 100 20 Q142 20 142 58 Z" fill="#4d96ff" ${LINE}/><ellipse cx="100" cy="58" rx="50" ry="8" fill="#2f6fd6" ${LINE}/><circle cx="100" cy="21" r="4" fill="#2f6fd6"/>`,
    back: `<path d="M58 60 Q58 20 100 20 Q142 20 142 60 Z" fill="#4d96ff" ${LINE}/><rect x="88" y="50" width="24" height="10" rx="3" fill="#cfe3ff"/><circle cx="100" cy="21" r="4" fill="#2f6fd6"/>`,
    box: [48, 14, 104, 54],
  },
  'sun-hat': {
    front: `<ellipse cx="100" cy="52" rx="74" ry="13" fill="#f4c26b" ${LINE}/><path d="M68 52 Q68 14 100 14 Q132 14 132 52 Z" fill="#f4c26b" ${LINE}/><rect x="68" y="40" width="64" height="9" fill="#ff6b9a"/>`,
    box: [24, 10, 152, 58],
  },
  helmet: {
    front: `<path d="M54 64 Q54 14 100 14 Q146 14 146 64 Z" fill="#ff6b6b" ${LINE}/><path d="M78 22 L78 44 M100 16 L100 44 M122 22 L122 44" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <path d="M58 62 L76 106 L124 106 L142 62" fill="none" stroke="#3d2c5e" stroke-width="3" stroke-opacity="0.7"/>`,
    back: `<path d="M54 64 Q54 14 100 14 Q146 14 146 64 Z" fill="#ff6b6b" ${LINE}/><path d="M78 22 L78 44 M100 16 L100 44 M122 22 L122 44" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`,
    box: [50, 10, 100, 100],
  },
  crown: {
    front: `<path d="M66 44 L66 14 L82 30 L100 6 L118 30 L134 14 L134 44 Z" fill="#ffd166" ${LINE}/><g fill="#ff6b9a"><circle cx="100" cy="34" r="5"/><circle cx="78" cy="38" r="3.5"/><circle cx="122" cy="38" r="3.5"/></g>`,
    box: [62, 2, 76, 46],
  },
  bow: {
    front: `<path d="M128 34 L110 22 L110 46 Z M128 34 L146 22 L146 46 Z" fill="#ff6b9a" ${LINE}/><circle cx="128" cy="34" r="6" fill="#ff4f86"/>`,
    box: [106, 18, 44, 32],
  },
  glasses: {
    front: `<circle cx="85" cy="74" r="12" fill="#bfe9ff" fill-opacity="0.35" stroke="#3d2c5e" stroke-width="3"/><circle cx="115" cy="74" r="12" fill="#bfe9ff" fill-opacity="0.35" stroke="#3d2c5e" stroke-width="3"/>
      <path d="M97 73 Q100 69 103 73 M73 71 L60 69 M127 71 L140 69" fill="none" stroke="#3d2c5e" stroke-width="3" stroke-linecap="round"/>`,
    back: '',
    box: [56, 58, 88, 32],
  },
  sunglasses: {
    front: `<rect x="70" y="65" width="29" height="18" rx="8" fill="#2b2b3a"/><rect x="101" y="65" width="29" height="18" rx="8" fill="#2b2b3a"/>
      <path d="M97 70 L103 70 M70 69 L60 67 M130 69 L140 67" stroke="#2b2b3a" stroke-width="3" stroke-linecap="round"/><path d="M76 70 L84 70" stroke="#fff" stroke-width="2" opacity="0.6"/>`,
    back: '',
    box: [56, 60, 88, 28],
  },
  goggles: {
    front: `<rect x="54" y="68" width="92" height="9" rx="4" fill="#4d96ff"/><ellipse cx="85" cy="74" rx="14" ry="11" fill="#74c0fc" stroke="#2f6fd6" stroke-width="3"/><ellipse cx="115" cy="74" rx="14" ry="11" fill="#74c0fc" stroke="#2f6fd6" stroke-width="3"/>`,
    back: '<rect x="56" y="66" width="88" height="10" rx="5" fill="#4d96ff"/>',
    box: [50, 60, 100, 30],
  },
  scarf: {
    front: `<rect x="76" y="98" width="48" height="18" rx="9" fill="#ff6b6b" ${LINE}/><rect x="108" y="108" width="15" height="52" rx="5" fill="#ff6b6b" ${LINE}/>
      <path d="M108 126 L123 126 M108 142 L123 142" stroke="#fff" stroke-width="4"/>`,
    back: `<rect x="76" y="98" width="48" height="18" rx="9" fill="#ff6b6b" ${LINE}/>`,
    box: [72, 94, 56, 70],
  },
  sneakers: {
    front: pair(`<path d="M64 346 Q64 336 76 336 L88 336 Q100 340 101 350 L101 356 L64 356 Z" fill="#fff" ${LINE}/><rect x="63" y="353" width="39" height="6" rx="3" fill="#4d96ff"/><path d="M74 340 L86 340 M76 345 L88 345" stroke="#4d96ff" stroke-width="2"/>`),
    box: [60, 332, 80, 30],
  },
  boots: {
    front: pair(`<path d="M68 304 L96 304 L96 344 Q104 346 104 358 L66 358 Z" fill="#ffd166" ${LINE}/><rect x="66" y="302" width="32" height="8" rx="3" fill="#f4a940"/>`),
    box: [62, 298, 76, 64],
  },
  sandals: {
    front: pair(`<ellipse cx="82" cy="357" rx="19" ry="5" fill="#c9783f"/><path d="M68 350 L96 350 M73 343 L91 343" stroke="#ff6b9a" stroke-width="4" stroke-linecap="round"/>`),
    box: [60, 338, 80, 26],
  },
  backpack: {
    // Phía trước chỉ thấy 2 quai trên vai; phía sau thấy cả ba lô.
    front: '<path d="M72 112 L76 198 M128 112 L124 198" stroke="#ff8a65" stroke-width="9" stroke-linecap="round" fill="none"/>',
    back: `<path d="M90 120 Q100 104 110 120" fill="none" stroke="#e8673f" stroke-width="5"/><rect x="62" y="118" width="76" height="92" rx="18" fill="#ff8a65" ${LINE}/>
      <rect x="74" y="162" width="52" height="36" rx="9" fill="#ff6b4a" ${LINE}/><path d="M84 162 L116 162" stroke="#ffd166" stroke-width="3"/>`,
    icon: 'back',
    showBack: true,
    box: [58, 100, 84, 114],
  },
  umbrella: {
    front: `<path d="M147 222 L147 118" stroke="#6c5a8a" stroke-width="4"/><path d="M147 222 Q147 232 139 230" fill="none" stroke="#6c5a8a" stroke-width="4" stroke-linecap="round"/>
      <path d="M101 120 Q147 54 193 120 Q181 112 170 120 Q158 112 147 120 Q136 112 124 120 Q113 112 101 120 Z" fill="#b197fc" ${LINE}/>`,
    mirrorBack: true, // sau lưng: tay cầm ô nằm bên kia
    box: [98, 56, 100, 180],
  },
  sweater: {
    front: `<path d="M64 112 L40 122 L40 214 L64 214 Z" fill="#63d2a8" ${LINE}/><path d="M136 112 L160 122 L160 214 L136 214 Z" fill="#63d2a8" ${LINE}/>
      <rect x="62" y="108" width="76" height="112" rx="12" fill="#63d2a8" ${LINE}/>
      <path d="M84 108 Q100 122 116 108" fill="none" stroke="#3fae86" stroke-width="5"/>
      <path d="M70 150 L80 160 L90 150 L100 160 L110 150 L120 160 L130 150" fill="none" stroke="#fff" stroke-width="3"/>
      <rect x="62" y="206" width="76" height="12" fill="#3fae86"/><rect x="40" y="202" width="24" height="12" fill="#3fae86"/><rect x="136" y="202" width="24" height="12" fill="#3fae86"/>`,
    back: `<path d="M64 112 L40 122 L40 214 L64 214 Z" fill="#63d2a8" ${LINE}/><path d="M136 112 L160 122 L160 214 L136 214 Z" fill="#63d2a8" ${LINE}/>
      <rect x="62" y="108" width="76" height="112" rx="12" fill="#63d2a8" ${LINE}/><rect x="86" y="104" width="28" height="8" rx="4" fill="#3fae86"/>
      <rect x="62" y="206" width="76" height="12" fill="#3fae86"/><rect x="40" y="202" width="24" height="12" fill="#3fae86"/><rect x="136" y="202" width="24" height="12" fill="#3fae86"/>`,
    box: [36, 102, 128, 120],
  },
  skirt: {
    front: `<path d="M66 204 L134 204 L152 272 L48 272 Z" fill="#b197fc" ${LINE}/><rect x="65" y="202" width="70" height="10" rx="3" fill="#8f73e0"/>
      <path d="M84 212 L78 272 M100 212 L100 272 M116 212 L122 272" stroke="#8f73e0" stroke-width="2"/>`,
    box: [46, 198, 108, 78],
  },
  'swim-shorts': {
    front: `<path d="M64 204 L136 204 L134 262 L104 262 L100 238 L96 262 L66 262 Z" fill="#4dabf7" ${LINE}/><rect x="64" y="204" width="72" height="8" fill="#1c7ed6"/>
      <path d="M66 238 Q74 232 82 238 T98 238 M102 238 Q110 232 118 238 T134 238" fill="none" stroke="#fff" stroke-width="3"/>`,
    box: [62, 200, 76, 66],
  },
  socks: {
    front: pair(`<path d="M72 294 L96 294 L96 342 Q102 346 100 356 L66 356 Q64 348 72 342 Z" fill="#fff" ${LINE}/><path d="M72 304 L96 304 M72 314 L96 314" stroke="#ff6b6b" stroke-width="4"/>`),
    box: [60, 290, 80, 70],
  },
  tie: {
    front: `<path d="M94 106 L106 106 L103 118 L97 118 Z" fill="#e05555" ${LINE}/><path d="M97 118 L103 118 L109 172 L100 184 L91 172 Z" fill="#ff6b6b" ${LINE}/>
      <path d="M95 140 L105 134 M94 156 L106 150" stroke="#ffd166" stroke-width="3"/>`,
    back: '',
    box: [86, 102, 28, 86],
  },
};

const BOTH = ['boy', 'girl'];
const GIRL = ['girl'];
const BOY = ['boy'];

/**
 * Tủ đồ có sẵn. [tên tiếng Anh, emoji (phụ đề), chỗ, tên tiếng Việt, dành cho, ngữ cảnh khi Bông giao việc].
 * Chọn bé trai chỉ thấy đồ bé trai + đồ chung; bé gái tương tự.
 */
const BUILTIN = [
  ['T-shirt', '👕', 'top', 'áo phông', BOTH],
  ['shirt', '👔', 'top', 'áo sơ mi', BOTH],
  ['sweater', '🧶', 'top', 'áo len', BOTH, "It's cold!"],
  ['coat', '🧥', 'outer', 'áo khoác', BOTH, "It's cold!"],
  ['dress', '👗', 'dress', 'váy', GIRL],
  ['swimsuit', '🩱', 'dress', 'đồ bơi', GIRL, "Let's go swimming!"],
  ['skirt', '👗', 'bottom', 'chân váy', GIRL],
  ['jeans', '👖', 'bottom', 'quần bò', BOTH],
  ['shorts', '🩳', 'bottom', 'quần soóc', BOTH, "It's sunny!"],
  ['swim shorts', '🩳', 'bottom', 'quần bơi', BOY, "Let's go swimming!"],
  ['socks', '🧦', 'socks', 'tất', BOTH, "It's cold!"],
  ['cap', '🧢', 'head', 'mũ lưỡi trai', BOTH, "It's sunny!"],
  ['sun hat', '👒', 'head', 'mũ rộng vành', GIRL, "It's sunny!"],
  ['helmet', '⛑️', 'head', 'mũ bảo hiểm', BOTH, "Let's ride a bike!"],
  ['crown', '👑', 'head', 'vương miện', GIRL, "Let's have a party!"],
  ['bow', '🎀', 'head', 'nơ', GIRL, "Let's have a party!"],
  ['glasses', '👓', 'eyes', 'kính', BOTH],
  ['sunglasses', '🕶️', 'eyes', 'kính râm', BOTH, "It's sunny!"],
  ['goggles', '🥽', 'eyes', 'kính bơi', BOTH, "Let's go swimming!"],
  ['scarf', '🧣', 'neck', 'khăn quàng', BOTH, "It's cold!"],
  ['tie', '👔', 'neck', 'cà vạt', BOY, "Let's have a party!"],
  ['sneakers', '👟', 'feet', 'giày thể thao', BOTH],
  ['boots', '👢', 'feet', 'ủng', BOTH, "It's cold!"],
  ['sandals', '👡', 'feet', 'dép', BOTH, "It's sunny!"],
  ['backpack', '🎒', 'back', 'ba lô', BOTH, "Let's go to school!"],
  ['umbrella', '☂️', 'hand', 'ô', BOTH, "It's raining!"],
].map(([name, emoji, slot, vi, kids, context = '']) => {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  return { id, name, emoji, slot, vi, kids, context, art: ART[id] };
});

/** Mọi món (có sẵn + bố mẹ thêm). Đồ bố mẹ thêm được nạp bằng setCustomItems. */
export const ITEMS = [...BUILTIN];
export const ITEM_BY_ID = new Map(ITEMS.map((it) => [it.id, it]));

/** Khóa ảnh của một món (theo tên, giống ảnh bài học). */
export const imageKey = (item) => String(item.name).toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();

/**
 * Đồ bố mẹ thêm (cài đặt `dressUpCustom`): { id, name, vi, slot, kids, plural }. Bỏ món hỏng, tên trùng món khác.
 * Gọi lại mỗi lần mở trò chơi / Góc bố mẹ.
 */
export function setCustomItems(list) {
  for (let i = ITEMS.length - 1; i >= 0; i--) if (ITEMS[i].custom) ITEM_BY_ID.delete(ITEMS.splice(i, 1)[0].id);
  for (const c of Array.isArray(list) ? list : []) {
    const name = String(c?.name ?? '').trim();
    const slot = SLOT_BY_ID.get(c?.slot);
    if (!c?.id || !name || !slot || ITEM_BY_ID.has(c.id) || ITEMS.some((it) => imageKey(it) === imageKey({ name }))) continue;
    const kids = KIDS.filter((k) => (Array.isArray(c.kids) ? c.kids : KIDS).includes(k));
    const item = {
      id: c.id, name, emoji: slot.emoji, slot: slot.id, vi: String(c.vi ?? '').trim() || name,
      kids: kids.length ? kids : [...KIDS], context: '', art: null, custom: true, plural: Boolean(c.plural),
    };
    ITEMS.push(item);
    ITEM_BY_ID.set(item.id, item);
  }
}

/** Tủ đồ của một bé: đồ dành cho bé đó + đồ chung. */
export const wardrobeFor = (kid) => ITEMS.filter((it) => it.kids.includes(kid));

/** Khung đặt ảnh: khung của hình vẽ sẵn (vừa món đó), đồ bố mẹ thêm thì khung của chỗ mặc. */
export const itemBox = (item) => item.art?.box ?? SLOT_BY_ID.get(item.slot).box;

const mirror = (svg) => `<g transform="translate(200 0) scale(-1 1)">${svg}</g>`;

/** Món đồ nhìn thấy được ở mặt này không (kính, cà vạt: chỉ mặt trước; ba lô: cả hai — trước là quai). */
export function visibleIn(item, view) {
  if (item.art) return builtinArt(item, view).trim() !== '';
  return !(item.slot === 'eyes' && view === 'back') && !(item.slot === 'back' && view === 'front');
}

function builtinArt(item, view) {
  const { art } = item;
  if (view === 'front') return art.front;
  if (art.mirrorBack) return mirror(art.front);
  return art.back ?? art.front;
}

/**
 * Hình món đồ ở mặt trước / sau (chuỗi SVG, có thể rỗng). `images`: Map khóa ảnh → URL ảnh bố mẹ thay;
 * ảnh đặt vừa khung của món (giữ tỉ lệ). Ba lô: mặt trước vẫn là quai, ảnh ở mặt sau; đồ cầm tay đổi tay khi quay lưng.
 */
export function itemArt(item, view, images = null) {
  const url = images?.get(imageKey(item));
  if (!url) return item.art ? builtinArt(item, view) : '';
  if (!visibleIn(item, view)) return item.slot === 'back' && item.art ? item.art.front : '';
  if (item.slot === 'back' && view === 'front') return item.art?.front ?? '';
  const [x, y, w, h] = itemBox(item);
  const img = `<image href="${url}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
  return item.slot === 'hand' && view === 'back' ? mirror(img) : img;
}

/** Mặt nên quay ra khi vừa mặc món này: ba lô → sau lưng; món không thấy ở mặt hiện tại → quay lại. */
export function viewFor(item, view) {
  if (item.art?.showBack || item.slot === 'back') return 'back';
  return visibleIn(item, view) ? view : VIEWS.find((v) => visibleIn(item, v));
}

/** Biểu tượng trong tủ đồ: ảnh bố mẹ thay, không thì hình vẽ sẵn cắt sát theo khung `box`. */
export function itemIcon(item, images = null) {
  const url = images?.get(imageKey(item));
  if (url) return `<svg viewBox="0 0 100 100" aria-hidden="true"><image href="${url}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet"/></svg>`;
  if (!item.art) return `<svg viewBox="0 0 100 100" aria-hidden="true"><text x="50" y="54" font-size="70" text-anchor="middle" dominant-baseline="central">${item.emoji}</text></svg>`;
  const [x, y, w, h] = item.art.box;
  return `<svg viewBox="${x} ${y} ${w} ${h}" aria-hidden="true">${builtinArt(item, item.art.icon ?? 'front')}</svg>`;
}

/** Hai món không mặc cùng lúc: cùng chỗ, hoặc váy với áo / quần. */
function clashes(a, b) {
  if (a.slot === b.slot) return true;
  const both = new Set([a.slot, b.slot]);
  return both.has('dress') && (both.has('top') || both.has('bottom'));
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

/** Bộ đồ đã lưu: bỏ mã không có / trùng / không phải đồ của bé (`kid`); món sau thắng khi xung đột. */
export function cleanOutfit(list, kid = null) {
  let outfit = [];
  for (const id of Array.isArray(list) ? list : []) {
    const item = ITEM_BY_ID.get(id);
    if (item && (!kid || item.kids.includes(kid))) outfit = wear(outfit, id).outfit;
  }
  return outfit;
}

/** Thứ tự vẽ (lớp dưới trước). */
export const layerOrder = (outfit) => [...outfit].sort((a, b) => SLOTS.findIndex((s) => s.id === ITEM_BY_ID.get(a).slot)
  - SLOTS.findIndex((s) => s.id === ITEM_BY_ID.get(b).slot));

const isPlural = (item) => Boolean(item.plural) || PLURAL.has(item.name);
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
export function pickRequest(outfit, last = null, rng = Math.random, items = ITEMS) {
  let pool = items.filter((it) => !outfit.includes(it.id));
  if (last && pool.length > 1) pool = pool.filter((it) => it.id !== last.id);
  return pool.length ? pool[Math.floor(rng() * pool.length)] : null;
}

// ---------- Bạn nhỏ ----------

const SKIN = '#f6d2b4';
const INK = '#4a3360';
const HAIR = '#6b4423';

/** Người bạn nhỏ (mặc sẵn áo lót trắng + quần đùi xám); bé trai / bé gái khác tóc; mặt sau không có mặt. */
function bodySvg(kid, view) {
  const girl = kid === 'girl';
  const longHair = girl
    ? `<path d="M52 66 Q48 150 70 156 L130 156 Q152 150 148 66 Z" fill="${HAIR}"/>
       <circle cx="48" cy="96" r="14" fill="${HAIR}"/><circle cx="152" cy="96" r="14" fill="${HAIR}"/>`
    : '';
  const body = `
<rect x="72" y="236" width="24" height="110" rx="11" fill="${SKIN}"/><rect x="104" y="236" width="24" height="110" rx="11" fill="${SKIN}"/>
<ellipse cx="82" cy="350" rx="17" ry="9" fill="${SKIN}"/><ellipse cx="118" cy="350" rx="17" ry="9" fill="${SKIN}"/>
<rect x="64" y="204" width="72" height="50" rx="14" fill="#cfd8e3"/>
<rect x="42" y="118" width="22" height="98" rx="11" fill="${SKIN}"/><rect x="136" y="118" width="22" height="98" rx="11" fill="${SKIN}"/>
<circle cx="53" cy="222" r="12" fill="${SKIN}"/><circle cx="147" cy="222" r="12" fill="${SKIN}"/>
<rect x="64" y="110" width="72" height="104" rx="22" fill="#ffffff" stroke="#e3e3e3" stroke-width="2"/>
<rect x="90" y="100" width="20" height="16" fill="${SKIN}"/>
<circle cx="58" cy="74" r="9" fill="${SKIN}"/><circle cx="142" cy="74" r="9" fill="${SKIN}"/>`;
  if (view === 'back') return body; // đầu (toàn tóc) vẽ riêng ở backHair, đè lên áo
  const fringe = girl
    ? `<path d="M56 70 Q58 24 100 24 Q142 24 144 70 Q130 50 112 48 Q104 60 88 52 Q70 50 56 70 Z" fill="${HAIR}"/>`
    : `<path d="M57 66 Q58 22 100 22 Q142 22 143 66 Q136 44 118 40 Q110 50 96 44 Q76 40 57 66 Z" fill="${HAIR}"/>`;
  return `${longHair}${body}
<circle cx="100" cy="70" r="42" fill="${SKIN}"/>
${fringe}
<ellipse cx="85" cy="74" rx="5" ry="6.5" fill="${INK}"/><ellipse cx="115" cy="74" rx="5" ry="6.5" fill="${INK}"/>
<circle cx="87" cy="72" r="1.8" fill="#fff"/><circle cx="117" cy="72" r="1.8" fill="#fff"/>
<circle cx="74" cy="88" r="7" fill="#ff9ab5" opacity="0.6"/><circle cx="126" cy="88" r="7" fill="#ff9ab5" opacity="0.6"/>
<path d="M90 92 Q100 102 110 92" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
}

/** Sau lưng: đầu toàn tóc; bé gái tóc dài phủ xuống lưng (đè lên áo, dưới ba lô / mũ). */
function backHair(kid) {
  const girl = kid === 'girl';
  return `<circle cx="100" cy="70" r="43" fill="${HAIR}"/>
${girl ? `<path d="M56 74 Q54 150 72 158 L128 158 Q146 150 144 74 Z" fill="${HAIR}"/><circle cx="48" cy="96" r="14" fill="${HAIR}"/><circle cx="152" cy="96" r="14" fill="${HAIR}"/>`
    : '<path d="M84 104 Q100 112 116 104 L116 98 L84 98 Z" fill="#5a381c"/>'}`;
}

/** Sau lưng, tóc nằm trên lớp này trở đi (ba lô, khăn, kính, mũ, ô vẽ đè lên tóc). */
const ABOVE_HAIR = SLOTS.findIndex((s) => s.id === 'back');

/**
 * Cả bạn nhỏ + quần áo đang mặc (mỗi món một nhóm <g data-item> để chạm / kéo).
 * @param {'boy'|'girl'} kid
 * @param {'front'|'back'} view
 */
export function dollSvg(kid, view = 'front', outfit = [], images = null) {
  const piece = (id) => {
    const art = itemArt(ITEM_BY_ID.get(id), view, images);
    return art ? `<g class="du-piece" data-item="${id}">${art}</g>` : '';
  };
  const layer = (id) => SLOTS.findIndex((s) => s.id === ITEM_BY_ID.get(id).slot);
  const ordered = layerOrder(outfit);
  const below = ordered.filter((id) => view === 'front' || layer(id) < ABOVE_HAIR).map(piece).join('');
  const above = view === 'back' ? backHair(kid) + ordered.filter((id) => layer(id) >= ABOVE_HAIR).map(piece).join('') : '';
  return `<svg viewBox="0 0 ${DOLL_W} ${DOLL_H}" aria-hidden="true">${bodySvg(kid, view)}${below}${above}</svg>`;
}
