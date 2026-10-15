// Dán tranh (SPEC-scenes.md): 7 bức tranh vẽ SVG, mỗi tranh một bộ sticker theo chủ đề, các "chỗ" có giới từ,
// câu Bông nói, Bông giao việc, prompt ảnh cho bố mẹ.
// Tọa độ vẽ theo khung 400 × 300; vị trí sticker lưu theo % của tranh.

export const SCENE_W = 400;
export const SCENE_H = 300;
export const MAX_PER_SCENE = 30;
/** Dán bao nhiêu lần (chưa có việc) thì Bông tự giao việc. */
export const DROPS_PER_REQUEST = 3;
/** Ảnh thay sticker / thay tranh nằm trong kho ảnh với "lessonId" riêng (không phải bài học). */
export const STICKER_IMAGES = 'scene:stickers';
export const BACKGROUND_IMAGES = 'scene:bg';
export const isSceneImage = (img) => String(img?.lessonId ?? '').startsWith('scene:');

const FARM_SVG = `
<defs><linearGradient id="farm-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fdcff"/><stop offset="1" stop-color="#e3f5ff"/></linearGradient></defs>
<rect width="400" height="300" fill="url(#farm-sky)"/>
<circle cx="200" cy="42" r="24" fill="#ffd166"/>
<g fill="#fff"><ellipse cx="140" cy="58" rx="28" ry="11"/><ellipse cx="158" cy="50" rx="17" ry="11"/><ellipse cx="300" cy="34" rx="26" ry="10"/><ellipse cx="316" cy="28" rx="14" ry="9"/></g>
<path d="M0 168 Q100 146 200 162 T400 156 V300 H0 Z" fill="#8fd17a"/>
<path d="M0 200 Q120 186 240 204 T400 200 V300 H0 Z" fill="#7cc566"/>
<rect x="56" y="120" width="24" height="105" rx="6" fill="#9b6a43"/>
<circle cx="34" cy="112" r="30" fill="#5cc067"/><circle cx="102" cy="112" r="30" fill="#5cc067"/><circle cx="68" cy="86" r="46" fill="#4fb35a"/>
<g fill="#ff6b6b"><circle cx="48" cy="80" r="5"/><circle cx="86" cy="70" r="5"/><circle cx="96" cy="108" r="5"/></g>
<rect x="262" y="120" width="106" height="95" fill="#e4574b"/>
<path d="M250 124 L315 72 L380 124 Z" fill="#b83b33"/>
<rect x="295" y="160" width="40" height="55" fill="#8c2d27" stroke="#fff" stroke-width="4"/>
<path d="M295 160 L335 215 M335 160 L295 215" stroke="#fff" stroke-width="3"/>
<ellipse cx="215" cy="255" rx="75" ry="28" fill="#6ec6f0"/><ellipse cx="198" cy="247" rx="30" ry="6" fill="#a8e0f8"/>
<g fill="#fff"><circle cx="150" cy="215" r="4"/><circle cx="380" cy="250" r="4"/><circle cx="30" cy="268" r="4"/></g>
<g fill="#ffd166"><circle cx="150" cy="215" r="2"/><circle cx="380" cy="250" r="2"/><circle cx="30" cy="268" r="2"/></g>`;

const BEACH_SVG = `
<rect width="400" height="300" fill="#bfe9ff"/>
<circle cx="340" cy="44" r="24" fill="#ffd166"/>
<g fill="#fff"><ellipse cx="90" cy="40" rx="28" ry="10"/><ellipse cx="108" cy="33" rx="16" ry="10"/><ellipse cx="220" cy="64" rx="22" ry="8"/></g>
<rect y="120" width="400" height="86" fill="#4fb3e8"/>
<path d="M14 150 q10 -6 20 0 M150 140 q10 -6 20 0 M340 160 q10 -6 20 0 M60 182 q10 -6 20 0 M240 186 q10 -6 20 0" stroke="#e3f5ff" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M0 202 Q100 192 200 204 T400 198 V300 H0 Z" fill="#f7dc9c"/>
<rect x="268" y="58" width="4" height="62" fill="#7a5230"/>
<path d="M273 62 L273 114 L314 114 Z" fill="#fff"/>
<path d="M222 118 H322 L306 142 H238 Z" fill="#c9783f"/>
<rect x="88" y="176" width="5" height="96" fill="#8a6a4a"/>
<path d="M30 182 A60 54 0 0 1 151 182 Z" fill="#ff6b6b"/>
<path d="M70 182 Q74 140 90 128 Q106 140 111 182 Z" fill="#fff"/>
<path d="M302 232 H346 L340 272 H308 Z" fill="#4d96ff"/>
<path d="M304 232 Q324 210 344 232" fill="none" stroke="#2d6fd6" stroke-width="3"/>
<g fill="#ff9ab5"><path d="M190 262 l8 -10 l8 10 z"/><circle cx="250" cy="280" r="5"/></g>`;

const BEDROOM_SVG = `
<rect width="400" height="200" fill="#ffe9d6"/>
<g fill="#ffd9bd"><circle cx="190" cy="40" r="5"/><circle cx="170" cy="130" r="5"/><circle cx="380" cy="150" r="5"/><circle cx="20" cy="150" r="5"/></g>
<rect y="200" width="400" height="100" fill="#d9a877"/>
<path d="M0 232 H400 M0 266 H400" stroke="#c99665" stroke-width="2"/>
<rect x="40" y="30" width="100" height="80" rx="6" fill="#bfe9ff" stroke="#fff" stroke-width="6"/>
<circle cx="116" cy="50" r="9" fill="#ffd166"/>
<path d="M90 30 V110 M40 70 H140" stroke="#fff" stroke-width="5"/>
<rect x="230" y="88" width="140" height="9" rx="3" fill="#9b6a43"/>
<path d="M245 97 v12 M355 97 v12" stroke="#9b6a43" stroke-width="5"/>
<ellipse cx="170" cy="268" rx="46" ry="14" fill="#63d2a8" opacity="0.8"/>
<rect x="222" y="210" width="160" height="32" fill="#b98a5c"/>
<rect x="214" y="210" width="8" height="32" fill="#8f73e0"/><rect x="382" y="210" width="8" height="32" fill="#8f73e0"/>
<rect x="210" y="134" width="22" height="80" rx="6" fill="#b197fc"/>
<rect x="210" y="200" width="182" height="12" fill="#8f73e0"/>
<rect x="214" y="178" width="176" height="24" rx="8" fill="#fff"/>
<rect x="272" y="172" width="120" height="32" rx="10" fill="#ff8fab"/>
<ellipse cx="250" cy="176" rx="22" ry="9" fill="#fff4e6"/>
<rect x="30" y="222" width="96" height="58" rx="6" fill="#ffd166"/>
<rect x="26" y="214" width="104" height="12" rx="4" fill="#f4b740"/>
<path d="M78 236 l5 10 l11 1 l-8 7 l3 11 l-11 -6 l-11 6 l3 -11 l-8 -7 l11 -1 z" fill="#fff"/>`;


const PARK_SVG = `
<rect width="400" height="300" fill="#bfe9ff"/>
<circle cx="200" cy="40" r="22" fill="#ffd166"/>
<g fill="#fff"><ellipse cx="120" cy="45" rx="26" ry="10"/><ellipse cx="138" cy="38" rx="15" ry="9"/><ellipse cx="300" cy="55" rx="24" ry="9"/></g>
<path d="M0 156 Q200 132 400 156 V300 H0 Z" fill="#8fd17a"/>
<path d="M0 214 Q200 200 400 214 V300 H0 Z" fill="#7cc566"/>
<rect x="58" y="110" width="6" height="122" fill="#ff8a65"/><rect x="88" y="110" width="6" height="122" fill="#ff8a65"/>
<path d="M58 142 H94 M58 172 H94 M58 202 H94" stroke="#ff8a65" stroke-width="5"/>
<rect x="52" y="103" width="54" height="10" rx="4" fill="#ff6b6b"/>
<path d="M100 108 L178 226 L194 226 L114 104 Z" fill="#ffd166"/>
<path d="M265 232 L285 95 L355 95 L375 232" fill="none" stroke="#74c0fc" stroke-width="8" stroke-linejoin="round"/>
<path d="M300 98 V196 M330 98 V196" stroke="#8a6a4a" stroke-width="3"/>
<rect x="292" y="194" width="46" height="9" rx="3" fill="#b197fc"/>
<rect x="168" y="212" width="88" height="8" rx="3" fill="#c9783f"/>
<rect x="168" y="236" width="88" height="10" rx="4" fill="#c9783f"/>
<rect x="174" y="246" width="6" height="26" fill="#8a5a2b"/><rect x="244" y="246" width="6" height="26" fill="#8a5a2b"/>
<g fill="#ff9ab5"><circle cx="30" cy="270" r="5"/><circle cx="380" cy="262" r="5"/><circle cx="140" cy="285" r="5"/></g>`;

const KITCHEN_SVG = `
<rect width="400" height="210" fill="#fff1d6"/>
<path d="M0 70 H400 M0 140 H400 M70 0 V210 M140 0 V210 M210 0 V210 M280 0 V210 M350 0 V210" stroke="#f6e2bd" stroke-width="2"/>
<rect y="210" width="400" height="90" fill="#e6b980"/>
<path d="M0 240 H400 M0 270 H400" stroke="#d9a86d" stroke-width="2"/>
<rect x="22" y="58" width="96" height="172" rx="8" fill="#dfe7ef"/>
<rect x="30" y="68" width="80" height="154" rx="4" fill="#eaf6ff"/>
<path d="M30 118 H110 M30 168 H110" stroke="#b9d7ee" stroke-width="4"/>
<path d="M118 60 L136 72 V218 L118 228 Z" fill="#c9d3dd"/>
<rect x="248" y="56" width="128" height="9" rx="3" fill="#9b6a43"/>
<path d="M262 65 v10 M362 65 v10" stroke="#9b6a43" stroke-width="5"/>
<rect x="168" y="184" width="160" height="12" rx="4" fill="#c9783f"/>
<rect x="178" y="196" width="8" height="74" fill="#a8622e"/><rect x="310" y="196" width="8" height="74" fill="#a8622e"/>
<path d="M270 152 H316 V176 Q316 184 308 184 H278 Q270 184 270 176 Z" fill="#8d99ae"/>
<rect x="264" y="148" width="58" height="8" rx="3" fill="#6c7a91"/>
<path d="M290 140 q4 -8 0 -14 M300 140 q4 -8 0 -14" stroke="#c9d3dd" stroke-width="3" fill="none" stroke-linecap="round"/>`;

const SPACE_SVG = `
<rect width="400" height="300" fill="#1e1b4b"/>
<g fill="#fff"><circle cx="40" cy="160" r="2"/><circle cx="160" cy="40" r="2"/><circle cx="220" cy="120" r="1.5"/><circle cx="250" cy="30" r="2"/><circle cx="370" cy="220" r="2"/><circle cx="190" cy="200" r="1.5"/><circle cx="140" cy="140" r="2"/><circle cx="380" cy="30" r="1.5"/><circle cx="260" cy="250" r="2"/></g>
<path d="M230 80 l4 9 l10 1 l-8 6 l3 10 l-9 -5 l-9 5 l3 -10 l-8 -6 l10 -1 z" fill="#ffd166"/>
<circle cx="90" cy="70" r="34" fill="#ff8a65"/>
<path d="M90 50 q20 4 30 16 M64 76 q20 8 50 6" stroke="#ff6b4a" stroke-width="5" fill="none"/>
<ellipse cx="90" cy="72" rx="58" ry="12" fill="none" stroke="#ffd166" stroke-width="5" transform="rotate(-14 90 72)"/>
<circle cx="80" cy="340" r="150" fill="#cfd4dc"/>
<g fill="#b3bac6"><circle cx="40" cy="232" r="14"/><circle cx="120" cy="250" r="10"/><circle cx="170" cy="275" r="8"/><circle cx="60" cy="280" r="9"/></g>
<path d="M322 64 Q340 40 358 64 V170 H322 Z" fill="#f1f3f5"/>
<path d="M322 64 Q340 40 358 64 Z" fill="#ff6b6b"/>
<circle cx="340" cy="98" r="10" fill="#74c0fc" stroke="#8d99ae" stroke-width="3"/>
<path d="M322 140 L304 172 H322 Z M358 140 L376 172 H358 Z" fill="#ff6b6b"/>
<path d="M330 172 L340 196 L350 172 Z" fill="#ffd166"/>`;

const JUNGLE_SVG = `
<rect width="400" height="300" fill="#c8f0d4"/>
<path d="M0 150 Q200 130 400 150 V300 H0 Z" fill="#6cc070"/>
<path d="M150 150 q20 -40 40 0 M330 150 q14 -30 30 0 M240 152 q10 -24 22 0" fill="#4fa357"/>
<rect x="44" y="70" width="30" height="170" rx="8" fill="#8a5a2b"/>
<path d="M60 100 q-30 40 -10 90 M74 110 q20 30 10 70" stroke="#3f8f45" stroke-width="4" fill="none"/>
<g fill="#3f8f45"><circle cx="30" cy="40" r="42"/><circle cx="100" cy="36" r="42"/><circle cx="70" cy="80" r="36"/><circle cx="140" cy="70" r="26"/></g>
<path d="M0 238 Q100 226 200 240 T400 236 V276 Q300 288 200 276 T0 278 Z" fill="#5bb8e8"/>
<path d="M40 256 q10 -5 20 0 M200 258 q10 -5 20 0 M330 254 q10 -5 20 0" stroke="#d6f0ff" stroke-width="3" fill="none" stroke-linecap="round"/>
<ellipse cx="336" cy="196" rx="52" ry="30" fill="#a7a9ac"/>
<ellipse cx="324" cy="186" rx="26" ry="10" fill="#c3c5c8"/>
<g fill="#ff6b9a"><circle cx="230" cy="190" r="6"/><circle cx="380" cy="140" r="5"/></g>`;

/**
 * Các tranh. zones: các chỗ theo thứ tự ưu tiên (vùng nhỏ trước, 1–2 vùng nền sau cùng);
 * rect: [x, y, rộng, cao] theo khung 400 × 300; draw: vật cần vẽ ở chỗ đó (prompt ảnh tranh).
 * items: bộ sticker của tranh [tên tiếng Anh, emoji] — tối đa 16 (ảnh lưới 4 × 4).
 */
export const SCENES = [
  {
    id: 'farm', en: 'Farm', vi: 'Nông trại', emoji: '🚜', intro: "Let's play on the farm!", svg: FARM_SVG,
    setting: 'a sunny farm',
    zones: [
      { id: 'roof', en: 'on the roof', vi: 'trên mái nhà', rect: [250, 70, 130, 52], draw: 'the red triangular roof of the barn' },
      { id: 'barn', en: 'in the barn', vi: 'trong chuồng', rect: [262, 122, 106, 95], draw: 'a big red barn with an open dark doorway' },
      { id: 'tree', en: 'in the tree', vi: 'trong tán cây', rect: [8, 40, 124, 110], draw: 'the round leafy green crown of a big tree' },
      { id: 'under-tree', en: 'under the tree', vi: 'dưới gốc cây', rect: [0, 150, 145, 85], draw: 'the brown tree trunk and the grass right under the tree' },
      { id: 'water', en: 'in the water', vi: 'trong nước', rect: [140, 227, 150, 56], draw: 'a small blue pond' },
      { id: 'sky', en: 'in the sky', vi: 'trên trời', rect: [0, 0, 400, 160], draw: 'open blue sky with a sun and two small clouds' },
      { id: 'grass', en: 'on the grass', vi: 'trên bãi cỏ', rect: [0, 160, 400, 140], draw: 'flat open green grass' },
    ],
    items: [['cow', '🐄'], ['pig', '🐖'], ['horse', '🐎'], ['sheep', '🐑'], ['goat', '🐐'], ['chicken', '🐔'], ['chick', '🐥'], ['duck', '🦆'],
      ['dog', '🐕'], ['cat', '🐈'], ['rabbit', '🐇'], ['tractor', '🚜'], ['carrot', '🥕'], ['corn', '🌽'], ['apple', '🍎'], ['egg', '🥚']],
  },
  {
    id: 'beach', en: 'Beach', vi: 'Bãi biển', emoji: '🏖️', intro: "Let's play at the beach!", svg: BEACH_SVG,
    setting: 'a sunny beach by the sea',
    zones: [
      { id: 'boat', en: 'in the boat', vi: 'trong thuyền', rect: [215, 92, 112, 52], draw: 'a small wooden sailboat floating on the sea' },
      { id: 'bucket', en: 'in the bucket', vi: 'trong xô', rect: [296, 212, 56, 64], draw: 'a big empty blue sand bucket standing on the sand' },
      { id: 'umbrella', en: 'under the umbrella', vi: 'dưới cái ô', rect: [32, 184, 118, 92], draw: 'the shady sand under a big red-and-white beach umbrella (the umbrella top is just above this area)' },
      { id: 'water', en: 'in the water', vi: 'trong nước', rect: [0, 120, 400, 82], draw: 'calm blue sea with small white waves' },
      { id: 'sky', en: 'in the sky', vi: 'trên trời', rect: [0, 0, 400, 120], draw: 'open light-blue sky with a sun' },
      { id: 'sand', en: 'on the sand', vi: 'trên cát', rect: [0, 202, 400, 98], draw: 'flat open yellow sand' },
    ],
    items: [['fish', '🐠'], ['crab', '🦀'], ['shell', '🐚'], ['octopus', '🐙'], ['dolphin', '🐬'], ['whale', '🐳'], ['shark', '🦈'], ['turtle', '🐢'],
      ['seal', '🦭'], ['shrimp', '🦐'], ['lobster', '🦞'], ['boat', '⛵'], ['ball', '🏐'], ['ice cream', '🍦'], ['sunglasses', '🕶️'], ['palm tree', '🌴']],
  },
  {
    id: 'bedroom', en: 'Bedroom', vi: 'Phòng ngủ', emoji: '🛏️', intro: "Let's play in the bedroom!", svg: BEDROOM_SVG,
    setting: "a cozy child's bedroom",
    zones: [
      { id: 'bed', en: 'on the bed', vi: 'trên giường', rect: [205, 128, 192, 76], draw: 'the top of a bed with a pillow and a pink blanket' },
      { id: 'under-bed', en: 'under the bed', vi: 'dưới gầm giường', rect: [216, 206, 176, 40], draw: 'the empty dark space under the bed between its legs' },
      { id: 'box', en: 'in the box', vi: 'trong hộp', rect: [22, 200, 112, 84], draw: 'a big open yellow toy box on the floor' },
      { id: 'shelf', en: 'on the shelf', vi: 'trên kệ', rect: [228, 36, 144, 54], draw: 'an EMPTY wooden wall shelf (the shelf board is at the bottom of this area)' },
      { id: 'wall', en: 'on the wall', vi: 'trên tường', rect: [0, 0, 400, 200], draw: 'a plain light wall with one window' },
      { id: 'floor', en: 'on the floor', vi: 'trên sàn', rect: [0, 200, 400, 100], draw: 'a plain wooden floor with a small rug' },
    ],
    items: [['teddy bear', '🧸'], ['ball', '⚽'], ['doll', '🪆'], ['car', '🚗'], ['train', '🚂'], ['robot', '🤖'], ['book', '📕'], ['clock', '⏰'],
      ['socks', '🧦'], ['shirt', '👕'], ['cap', '🧢'], ['shoe', '👟'], ['drum', '🥁'], ['balloon', '🎈'], ['puzzle', '🧩'], ['crayon', '🖍️']],
  },
  {
    id: 'park', en: 'Park', vi: 'Công viên', emoji: '🌳', intro: "Let's play in the park!", svg: PARK_SVG,
    setting: 'a sunny playground in a park',
    zones: [
      { id: 'swing', en: 'on the swing', vi: 'trên xích đu', rect: [285, 165, 60, 45], draw: 'the empty seat of a swing hanging from a swing frame' },
      { id: 'under-slide', en: 'under the slide', vi: 'dưới cầu trượt', rect: [60, 182, 120, 50], draw: 'the open space under a slide' },
      { id: 'slide', en: 'on the slide', vi: 'trên cầu trượt', rect: [96, 100, 98, 80], draw: 'a yellow slide going down from a ladder platform' },
      { id: 'under-bench', en: 'under the bench', vi: 'dưới ghế', rect: [164, 246, 96, 34], draw: 'the empty space under a park bench' },
      { id: 'bench', en: 'on the bench', vi: 'trên ghế', rect: [164, 200, 96, 42], draw: 'the seat of an empty wooden park bench' },
      { id: 'sky', en: 'in the sky', vi: 'trên trời', rect: [0, 0, 400, 150], draw: 'open blue sky with a sun and small clouds' },
      { id: 'grass', en: 'on the grass', vi: 'trên bãi cỏ', rect: [0, 150, 400, 150], draw: 'flat open green grass' },
    ],
    items: [['dog', '🐕'], ['bird', '🐦'], ['butterfly', '🦋'], ['bee', '🐝'], ['ladybug', '🐞'], ['squirrel', '🐿️'], ['snail', '🐌'], ['cat', '🐈'],
      ['kite', '🪁'], ['balloon', '🎈'], ['bicycle', '🚲'], ['scooter', '🛴'], ['ball', '⚽'], ['flower', '🌷'], ['leaf', '🍁'], ['ice cream', '🍦']],
  },
  {
    id: 'kitchen', en: 'Kitchen', vi: 'Nhà bếp', emoji: '🍳', intro: "Let's play in the kitchen!", svg: KITCHEN_SVG,
    setting: 'a bright family kitchen',
    zones: [
      { id: 'pot', en: 'in the pot', vi: 'trong nồi', rect: [266, 140, 54, 44], draw: 'a big open cooking pot standing on the table' },
      { id: 'fridge', en: 'in the fridge', vi: 'trong tủ lạnh', rect: [28, 66, 86, 158], draw: 'an OPEN fridge showing its EMPTY shelves inside' },
      { id: 'table', en: 'on the table', vi: 'trên bàn', rect: [165, 130, 160, 55], draw: 'the empty top of a wooden kitchen table' },
      { id: 'under-table', en: 'under the table', vi: 'dưới gầm bàn', rect: [175, 196, 140, 76], draw: 'the empty space under the table between its legs' },
      { id: 'shelf', en: 'on the shelf', vi: 'trên kệ', rect: [246, 10, 132, 52], draw: 'an EMPTY wooden wall shelf (the shelf board is at the bottom of this area)' },
      { id: 'wall', en: 'on the wall', vi: 'trên tường', rect: [0, 0, 400, 210], draw: 'a plain tiled kitchen wall' },
      { id: 'floor', en: 'on the floor', vi: 'trên sàn', rect: [0, 210, 400, 90], draw: 'a plain kitchen floor' },
    ],
    items: [['apple', '🍎'], ['banana', '🍌'], ['egg', '🥚'], ['milk', '🥛'], ['bread', '🍞'], ['cheese', '🧀'], ['carrot', '🥕'], ['tomato', '🍅'],
      ['cake', '🍰'], ['cookie', '🍪'], ['pizza', '🍕'], ['cup', '☕'], ['spoon', '🥄'], ['watermelon', '🍉'], ['grapes', '🍇'], ['cat', '🐈']],
  },
  {
    id: 'space', en: 'Space', vi: 'Vũ trụ', emoji: '🚀', intro: "Let's play in space!", svg: SPACE_SVG,
    setting: 'outer space at night',
    zones: [
      { id: 'rocket', en: 'in the rocket', vi: 'trong tên lửa', rect: [300, 58, 64, 140], draw: 'a big white-and-red rocket standing upright with a round window' },
      { id: 'planet', en: 'on the planet', vi: 'trên hành tinh', rect: [50, 30, 80, 80], draw: 'an orange planet with a yellow ring' },
      { id: 'moon', en: 'on the moon', vi: 'trên mặt trăng', rect: [0, 226, 180, 74], draw: 'the gray cratered surface of the moon (a big curve at the bottom-left)' },
      { id: 'space', en: 'in space', vi: 'trong vũ trụ', rect: [0, 0, 400, 300], draw: 'dark navy space with small stars' },
    ],
    items: [['astronaut', '🧑‍🚀'], ['rocket', '🚀'], ['alien', '👽'], ['robot', '🤖'], ['star', '⭐'], ['comet', '☄️'], ['satellite', '🛰️'], ['flying saucer', '🛸'],
      ['telescope', '🔭'], ['earth', '🌍'], ['sun', '☀️'], ['moon', '🌙']],
  },
  {
    id: 'jungle', en: 'Jungle', vi: 'Rừng xanh', emoji: '🌴', intro: "Let's play in the jungle!", svg: JUNGLE_SVG,
    setting: 'a green jungle',
    zones: [
      { id: 'tree', en: 'in the tree', vi: 'trong tán cây', rect: [0, 0, 170, 112], draw: 'the big leafy crown of a tall jungle tree' },
      { id: 'under-tree', en: 'under the tree', vi: 'dưới gốc cây', rect: [0, 140, 150, 88], draw: 'the trunk of the tree with hanging vines and the ground under it' },
      { id: 'rock', en: 'on the rock', vi: 'trên tảng đá', rect: [282, 124, 108, 56], draw: 'the flat top of a big gray rock' },
      { id: 'water', en: 'in the river', vi: 'trong sông', rect: [0, 228, 400, 52], draw: 'a blue river running across the bottom' },
      { id: 'sky', en: 'in the sky', vi: 'trên trời', rect: [0, 0, 400, 140], draw: 'a light sky above the jungle' },
      { id: 'grass', en: 'on the grass', vi: 'trên bãi cỏ', rect: [0, 140, 400, 160], draw: 'green grass with a few small bushes' },
    ],
    items: [['monkey', '🐒'], ['lion', '🦁'], ['tiger', '🐅'], ['elephant', '🐘'], ['giraffe', '🦒'], ['zebra', '🦓'], ['snake', '🐍'], ['parrot', '🦜'],
      ['crocodile', '🐊'], ['hippo', '🦛'], ['gorilla', '🦍'], ['sloth', '🦥'], ['frog', '🐸'], ['butterfly', '🦋'], ['banana', '🍌'], ['flamingo', '🦩']],
  },
].map((scene) => ({ ...scene, items: scene.items.map(([name, emoji]) => ({ id: itemId(name), name, emoji })) }));

function itemId(name) {
  return name.replace(/\s+/g, '-');
}

export const SCENE_BY_ID = new Map(SCENES.map((s) => [s.id, s]));

/** Mọi sticker của mọi tranh (sticker có ở nhiều tranh, ví dụ cat, dùng chung một mã và một ảnh). */
export const ITEM_BY_ID = new Map(SCENES.flatMap((s) => s.items).map((it) => [it.id, it]));

/** Vùng của một chỗ theo % tranh: { left, top, width, height }. */
export function zoneBox(zone) {
  const [x, y, w, h] = zone.rect;
  return { left: (x / SCENE_W) * 100, top: (y / SCENE_H) * 100, width: (w / SCENE_W) * 100, height: (h / SCENE_H) * 100 };
}

const EDGE = 1e-6; // điểm nằm đúng trên cạnh (sai số đổi % ↔ tọa độ) vẫn tính là trong vùng

/**
 * Chỗ tại điểm (x, y) theo % tranh: vùng ĐẦU TIÊN theo thứ tự ưu tiên chứa điểm đó (cạnh tính là trong vùng),
 * nên điểm trên ranh giới hai vùng luôn thuộc vùng đứng trước. Ngoài mọi vùng (không xảy ra vì có vùng nền) thì lấy vùng cuối.
 */
export function zoneAt(scene, xPct, yPct) {
  const x = (xPct / 100) * SCENE_W;
  const y = (yPct / 100) * SCENE_H;
  return scene.zones.find(({ rect: [zx, zy, w, h] }) => x >= zx - EDGE && x <= zx + w + EDGE && y >= zy - EDGE && y <= zy + h + EDGE)
    ?? scene.zones.at(-1);
}

const PLURAL = new Set(['grapes', 'socks', 'sunglasses']);

/** "The lion is in the tree!" / "The grapes are on the table!" */
export function placedSentence(item, zone) {
  return `The ${item.name} ${PLURAL.has(item.name) ? 'are' : 'is'} ${zone.en}!`;
}

/** "Put the duck in the water!" */
export const requestSentence = (item, zone) => `Put the ${item.name} ${zone.en}!`;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/**
 * Sticker đã dán của một tranh, sau khi bỏ: mã sticker không có, dữ liệu hỏng, vượt quá MAX_PER_SCENE;
 * tọa độ ngoài 0–100 thì kẹp lại.
 */
export function cleanPlacements(list) {
  const out = [];
  for (const p of Array.isArray(list) ? list : []) {
    if (!p || !ITEM_BY_ID.has(p.s) || !Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    if (out.length >= MAX_PER_SCENE) break;
    out.push({ s: p.s, x: clamp(p.x, 0, 100), y: clamp(p.y, 0, 100) });
  }
  return out;
}

/**
 * Bông giao việc (SPEC-scenes mục 4.3): chọn một cặp (sticker của tranh, chỗ) làm được —
 * chưa có bản nào của sticker đó đứng ở chỗ đó, và còn dán được (tranh chưa đủ 30 hoặc sticker đã có trong tranh để kéo).
 * Ưu tiên khác cả sticker lẫn chỗ của việc vừa xong; không được thì chỉ cần khác đúng cặp đó.
 * @returns {{ sticker: object, zone: object } | null} null: không còn việc nào làm được
 */
export function pickRequest(scene, placed, last = null, rng = Math.random) {
  const pairs = [];
  for (const sticker of scene.items) {
    const copies = placed.filter((p) => p.s === sticker.id);
    if (!copies.length && placed.length >= MAX_PER_SCENE) continue;
    const here = new Set(copies.map((p) => zoneAt(scene, p.x, p.y).id));
    for (const zone of scene.zones) if (!here.has(zone.id)) pairs.push({ sticker, zone });
  }
  const fresh = (r) => !last || (r.sticker.id !== last.sticker.id && r.zone.id !== last.zone.id);
  const notSame = (r) => !last || r.sticker.id !== last.sticker.id || r.zone.id !== last.zone.id;
  const pool = [pairs.filter(fresh), pairs.filter(notSame)].find((list) => list.length);
  return pool ? pool[Math.floor(rng() * pool.length)] : null;
}

// ---------- Prompt ảnh cho bố mẹ (SPEC-scenes mục 10) ----------

const pct = (n) => Math.round(n);
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Prompt ảnh tranh: bố cục theo đúng các chỗ của app (vị trí tính bằng % chiều rộng / chiều cao), không vẽ
 * con vật / người / chữ để bé tự dán sticker vào.
 */
export function sceneBackgroundPrompt(scene) {
  const isBackdrop = (z) => z.rect[2] === SCENE_W; // vùng nền trải hết chiều ngang (trời, cỏ, tường, sàn…)
  const area = (z) => {
    const b = zoneBox(z);
    return `from ${pct(b.left)}% to ${pct(b.left + b.width)}% of the width (from the left) and from ${pct(b.top)}% to ${pct(b.top + b.height)}% of the height (from the top)`;
  };
  return [
    `Create ONE landscape illustration, aspect ratio exactly 4:3 (for example 1600 × 1200 pixels), of ${scene.setting}. It is the background of a sticker game for a 3-year-old child: the child will drag stickers (animals, toys, food) onto it.`,
    '',
    'EXACT LAYOUT — every element must be inside its area (percentages of the image):',
    ...scene.zones.filter((z) => !isBackdrop(z)).map((z) => `- ${capitalize(z.draw)}: ${area(z)}.`),
    ...scene.zones.filter(isBackdrop).map((z) => `- ${capitalize(z.draw)}: ${area(z)}, everywhere not used above.`),
    '',
    'RULES',
    '- Keep every area above clearly visible and EMPTY enough to put a sticker on: no animals, no people, no characters, no food, no toys anywhere in the picture.',
    '- Absolutely no text, letters, numbers, labels or logos.',
    '- Simple flat vector style for young children: clean shapes, soft dark outlines, bright gentle colors, few small details.',
    '- Straight front view (no tilted camera), the whole scene fills the canvas edge to edge, no border or frame.',
  ].join('\n');
}

/** Phần thêm vào prompt ảnh lưới khi vẽ sticker: viền đậm khép kín, nền trắng để app tự cắt nền. */
export const STICKER_PROMPT_NOTE = [
  '',
  'STICKER RULES (the app cuts each picture out of its white background automatically)',
  '- Draw each subject as a cute sticker: ONE subject, whole body, with a continuous thick dark outline all the way around it.',
  '- Pure flat white (#FFFFFF) background in every cell: no ground, no shadow under the subject, no scenery, no frame around the subject.',
  '- Do not use white for the outer edge of the subject (white areas inside the outline are fine).',
].join('\n');
