// Trò Bông trốn tìm (SPEC-hide.md): 5 phòng vẽ bằng SVG (khung 400 × 300), mỗi phòng 4–6 chỗ nấp có giới từ
// (in / under / behind / next to), câu nói viết sẵn cả cụm, "túi giới từ" để bé gặp đều, Bông đoán khi đổi vai.
// Không phụ thuộc giao diện để test được.

export const W = 400;
export const H = 300;
export const PREPS = ['in', 'under', 'behind', 'next to'];
export const HIDE_BG_IMAGES = 'hide:bg';
export const HIDE_BONG_IMAGES = 'hide:bong';
export const HIDE_ITEM_IMAGES = 'hide:items';
export const POSES = ['peek', 'boo', 'cover', 'seek'];
export const POSE_LABEL = {
  peek: { vi: 'Đôi tai thò ra', draw: 'only her two long bunny ears sticking up, as if she is hiding behind something (no face, no body)' },
  boo: { vi: 'Ú òa!', draw: 'jumping up joyfully with both arms raised, shouting "peekaboo"' },
  cover: { vi: 'Che mắt đếm', draw: 'covering her eyes with both paws, counting' },
  seek: { vi: 'Đi tìm', draw: 'walking and looking around with one paw above her eyes like a visor' },
};

// ---------- Vẽ đồ vật (mỗi hàm vẽ trong ô [x, y, w, h]) ----------
const LINE = 'stroke="#5b4a6b" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
const n = (v) => Math.round(v * 10) / 10;
const rect = (x, y, w, h, fill, rx = 4) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${rx}" fill="${fill}" ${LINE}/>`;
const ell = (cx, cy, rx, ry, fill) => `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}" ${LINE}/>`;
const path = (d, fill = 'none') => `<path d="${d}" fill="${fill}" ${LINE}/>`;

const DRAW = {
  bed: ([x, y, w, h]) => rect(x, y, w * 0.1, h * 0.75, '#c08457', 6) // đầu giường
    + rect(x + w * 0.05, y + h * 0.35, w * 0.93, h * 0.32, '#a3c4f3', 8) // đệm
    + rect(x + w * 0.1, y + h * 0.67, w * 0.05, h * 0.33, '#8d5a3b', 2) + rect(x + w * 0.88, y + h * 0.67, w * 0.05, h * 0.33, '#8d5a3b', 2)
    + ell(x + w * 0.2, y + h * 0.3, w * 0.08, h * 0.1, '#ffffff'),
  blanket: ([x, y, w, h]) => rect(x, y + h * 0.15, w, h * 0.8, '#f9a8d4', 10) + path(`M${n(x + w * 0.2)} ${n(y + h * 0.4)} h${n(w * 0.6)} M${n(x + w * 0.2)} ${n(y + h * 0.7)} h${n(w * 0.6)}`),
  wardrobe: ([x, y, w, h]) => rect(x, y, w, h, '#d4a373', 6) + path(`M${n(x + w / 2)} ${n(y + 6)} V${n(y + h - 6)}`)
    + `<circle cx="${n(x + w / 2 - 6)}" cy="${n(y + h / 2)}" r="3" fill="#5b4a6b"/><circle cx="${n(x + w / 2 + 6)}" cy="${n(y + h / 2)}" r="3" fill="#5b4a6b"/>`,
  curtain: ([x, y, w, h]) => rect(x + w * 0.1, y + h * 0.05, w * 0.8, h * 0.6, '#cfe8ff', 2) // cửa sổ
    + path(`M${n(x)} ${n(y)} H${n(x + w)}`) + path(`M${n(x)} ${n(y)} Q${n(x + w * 0.25)} ${n(y + h * 0.5)} ${n(x + w * 0.1)} ${n(y + h)} H${n(x + w * 0.55)} Q${n(x + w * 0.45)} ${n(y + h * 0.5)} ${n(x + w * 0.55)} ${n(y)} Z`, '#b197fc'),
  box: ([x, y, w, h]) => rect(x, y + h * 0.25, w, h * 0.75, '#e0a96d', 2) + path(`M${n(x)} ${n(y + h * 0.25)} L${n(x - w * 0.12)} ${n(y)} M${n(x + w)} ${n(y + h * 0.25)} L${n(x + w * 1.12)} ${n(y)}`)
    + path(`M${n(x + w * 0.3)} ${n(y + h * 0.55)} h${n(w * 0.4)}`),
  rug: ([x, y, w, h]) => ell(x + w / 2, y + h * 0.75, w * 0.48, h * 0.18, '#ffd166') + rect(x + w * 0.25, y + h * 0.05, w * 0.5, h * 0.45, '#c08457', 4)
    + ell(x + w / 2, y + h * 0.05, w * 0.3, h * 0.08, '#fff3b0'),
  sofa: ([x, y, w, h]) => rect(x + w * 0.05, y, w * 0.9, h * 0.55, '#74c0fc', 12) + rect(x, y + h * 0.4, w, h * 0.45, '#4dabf7', 10)
    + rect(x + w * 0.05, y + h * 0.85, w * 0.06, h * 0.15, '#8d5a3b', 2) + rect(x + w * 0.89, y + h * 0.85, w * 0.06, h * 0.15, '#8d5a3b', 2),
  cushion: ([x, y, w, h]) => rect(x, y, w, h, '#ffd166', 12) + path(`M${n(x + w * 0.2)} ${n(y + h / 2)} h${n(w * 0.6)}`),
  table: ([x, y, w, h]) => rect(x, y, w, h * 0.18, '#c08457', 3) + rect(x + w * 0.06, y + h * 0.18, w * 0.07, h * 0.82, '#8d5a3b', 2)
    + rect(x + w * 0.87, y + h * 0.18, w * 0.07, h * 0.82, '#8d5a3b', 2),
  plant: ([x, y, w, h]) => rect(x + w * 0.25, y + h * 0.7, w * 0.5, h * 0.3, '#e07a5f', 4)
    + ell(x + w * 0.5, y + h * 0.35, w * 0.42, h * 0.32, '#63d2a8') + ell(x + w * 0.3, y + h * 0.5, w * 0.22, h * 0.16, '#40c057') + ell(x + w * 0.7, y + h * 0.52, w * 0.22, h * 0.16, '#40c057'),
  tv: ([x, y, w, h]) => rect(x + w * 0.15, y + h * 0.05, w * 0.7, h * 0.5, '#343a40', 4) + rect(x + w * 0.2, y + h * 0.1, w * 0.6, h * 0.4, '#a5d8ff', 2)
    + rect(x + w * 0.1, y + h * 0.65, w * 0.8, h * 0.35, '#c08457', 3),
  basket: ([x, y, w, h]) => path(`M${n(x)} ${n(y + h * 0.3)} H${n(x + w)} L${n(x + w * 0.88)} ${n(y + h)} H${n(x + w * 0.12)} Z`, '#e9c46a')
    + path(`M${n(x + w * 0.1)} ${n(y + h * 0.55)} H${n(x + w * 0.9)} M${n(x + w * 0.15)} ${n(y + h * 0.78)} H${n(x + w * 0.85)}`)
    + path(`M${n(x + w * 0.15)} ${n(y + h * 0.3)} Q${n(x + w / 2)} ${n(y - h * 0.1)} ${n(x + w * 0.85)} ${n(y + h * 0.3)}`),
  cupboard: ([x, y, w, h]) => rect(x, y, w, h, '#f4d58d', 4) + path(`M${n(x + w / 3)} ${n(y + 4)} V${n(y + h - 4)} M${n(x + w * 2 / 3)} ${n(y + 4)} V${n(y + h - 4)}`)
    + [1, 3, 5].map((k) => `<circle cx="${n(x + (w * k) / 6)}" cy="${n(y + h * 0.75)}" r="3" fill="#5b4a6b"/>`).join(''),
  fridge: ([x, y, w, h]) => rect(x, y, w, h, '#e9ecef', 8) + path(`M${n(x + 4)} ${n(y + h * 0.35)} H${n(x + w - 4)}`)
    + rect(x + w * 0.75, y + h * 0.12, w * 0.06, h * 0.15, '#868e96', 2) + rect(x + w * 0.75, y + h * 0.45, w * 0.06, h * 0.2, '#868e96', 2),
  pot: ([x, y, w, h]) => rect(x + w * 0.1, y + h * 0.3, w * 0.8, h * 0.7, '#adb5bd', 10) + rect(x + w * 0.05, y + h * 0.2, w * 0.9, h * 0.14, '#868e96', 4)
    + rect(x - w * 0.05, y + h * 0.4, w * 0.15, h * 0.1, '#868e96', 2) + rect(x + w * 0.9, y + h * 0.4, w * 0.15, h * 0.1, '#868e96', 2),
  oven: ([x, y, w, h]) => rect(x, y, w, h, '#dee2e6', 6) + rect(x + w * 0.12, y + h * 0.35, w * 0.76, h * 0.5, '#495057', 4)
    + [0.25, 0.5, 0.75].map((k) => `<circle cx="${n(x + w * k)}" cy="${n(y + h * 0.15)}" r="4" fill="#5b4a6b"/>`).join(''),
  showerCurtain: ([x, y, w, h]) => path(`M${n(x)} ${n(y)} H${n(x + w)}`) + path(`M${n(x)} ${n(y)} V${n(y + h)} H${n(x + w)} V${n(y)} Z`, '#99e9f2')
    + [0.25, 0.5, 0.75].map((k) => path(`M${n(x + w * k)} ${n(y + 4)} V${n(y + h - 4)}`)).join(''),
  bathtub: ([x, y, w, h]) => rect(x, y + h * 0.25, w, h * 0.6, '#ffffff', 16) + rect(x + w * 0.05, y + h * 0.85, w * 0.08, h * 0.15, '#adb5bd', 2)
    + rect(x + w * 0.87, y + h * 0.85, w * 0.08, h * 0.15, '#adb5bd', 2) + path(`M${n(x + w * 0.9)} ${n(y + h * 0.25)} V${n(y)} h${n(-w * 0.1)}`)
    + ell(x + w * 0.3, y + h * 0.25, w * 0.08, h * 0.06, '#e7f5ff') + ell(x + w * 0.5, y + h * 0.22, w * 0.06, h * 0.05, '#e7f5ff'),
  sink: ([x, y, w, h]) => rect(x, y + h * 0.15, w, h * 0.2, '#ffffff', 6) + rect(x + w * 0.4, y + h * 0.35, w * 0.2, h * 0.65, '#ced4da', 2)
    + path(`M${n(x + w / 2)} ${n(y + h * 0.15)} V${n(y)} h${n(w * 0.12)}`) + rect(x + w * 0.15, y - h * 0.5, w * 0.7, h * 0.45, '#cfe8ff', 6),
  laundry: ([x, y, w, h]) => path(`M${n(x)} ${n(y + h * 0.2)} H${n(x + w)} L${n(x + w * 0.9)} ${n(y + h)} H${n(x + w * 0.1)} Z`, '#b2f2bb')
    + ell(x + w * 0.35, y + h * 0.18, w * 0.18, h * 0.12, '#ffa8a8') + ell(x + w * 0.65, y + h * 0.15, w * 0.16, h * 0.1, '#ffec99'),
  toilet: ([x, y, w, h]) => rect(x + w * 0.55, y, w * 0.4, h * 0.45, '#ffffff', 6) + ell(x + w * 0.45, y + h * 0.55, w * 0.42, h * 0.14, '#ffffff')
    + path(`M${n(x + w * 0.15)} ${n(y + h * 0.6)} Q${n(x + w * 0.3)} ${n(y + h)} ${n(x + w * 0.6)} ${n(y + h)} Q${n(x + w * 0.8)} ${n(y + h)} ${n(x + w * 0.8)} ${n(y + h * 0.6)}`, '#ffffff'),
  tree: ([x, y, w, h]) => rect(x + w * 0.4, y + h * 0.45, w * 0.2, h * 0.55, '#a0522d', 4)
    + ell(x + w * 0.5, y + h * 0.28, w * 0.48, h * 0.26, '#51cf66') + ell(x + w * 0.3, y + h * 0.42, w * 0.25, h * 0.14, '#40c057') + ell(x + w * 0.72, y + h * 0.42, w * 0.25, h * 0.14, '#40c057'),
  bush: ([x, y, w, h]) => ell(x + w * 0.3, y + h * 0.6, w * 0.3, h * 0.38, '#40c057') + ell(x + w * 0.7, y + h * 0.6, w * 0.3, h * 0.38, '#40c057') + ell(x + w * 0.5, y + h * 0.42, w * 0.32, h * 0.4, '#51cf66'),
  slide: ([x, y, w, h]) => rect(x + w * 0.65, y, w * 0.08, h, '#e03131', 2) + rect(x + w * 0.88, y, w * 0.08, h, '#e03131', 2)
    + [0.2, 0.4, 0.6, 0.8].map((k) => path(`M${n(x + w * 0.69)} ${n(y + h * k)} H${n(x + w * 0.92)}`)).join('')
    + path(`M${n(x + w * 0.65)} ${n(y + h * 0.08)} L${n(x)} ${n(y + h * 0.9)} L${n(x + w * 0.1)} ${n(y + h)} L${n(x + w * 0.65)} ${n(y + h * 0.3)} Z`, '#ffd43b'),
  littleHouse: ([x, y, w, h]) => rect(x + w * 0.1, y + h * 0.4, w * 0.8, h * 0.6, '#ffc9c9', 2) + path(`M${n(x)} ${n(y + h * 0.42)} L${n(x + w / 2)} ${n(y)} L${n(x + w)} ${n(y + h * 0.42)} Z`, '#e8590c')
    + path(`M${n(x + w * 0.38)} ${n(y + h)} V${n(y + h * 0.65)} Q${n(x + w / 2)} ${n(y + h * 0.55)} ${n(x + w * 0.62)} ${n(y + h * 0.65)} V${n(y + h)} Z`, '#5b4a6b'),
  flowers: ([x, y, w, h]) => [0.15, 0.4, 0.65, 0.88].map((k, i) => path(`M${n(x + w * k)} ${n(y + h)} V${n(y + h * 0.4)}`)
    + `<circle cx="${n(x + w * k)}" cy="${n(y + h * 0.35)}" r="${n(Math.min(w, h) * 0.16)}" fill="${['#ff8787', '#ffd43b', '#da77f2', '#74c0fc'][i]}" ${LINE}/>`
    + `<circle cx="${n(x + w * k)}" cy="${n(y + h * 0.35)}" r="${n(Math.min(w, h) * 0.06)}" fill="#fff3bf"/>`).join(''),
};

// ---------- Phòng ----------
const spot = (id, prep, thing, thingVi, phraseVi, rectXY, peek, emoji, draw) => ({
  id, prep, thing, thingVi, phrase: `${prep} the ${thing}`, phraseVi, rect: rectXY, peek, emoji, draw,
});
const surprise = (id, en, vi, emoji) => ({ id, en, vi, emoji });

export const ROOMS = [
  {
    id: 'bedroom', en: 'bedroom', vi: 'phòng ngủ', emoji: '🛏️', wall: '#fff0e1', floor: '#e9c9a7', floorY: 205,
    setting: 'a cozy child\'s bedroom',
    spots: [
      spot('blanket', 'under', 'blanket', 'cái chăn', 'dưới cái chăn', [150, 158, 120, 34], 'top', '🛌', 'blanket'),
      spot('bed', 'under', 'bed', 'cái giường', 'dưới gầm giường', [120, 140, 172, 100], 'bottom', '🛏️', 'bed'),
      spot('wardrobe', 'in', 'wardrobe', 'tủ quần áo', 'trong tủ quần áo', [305, 40, 82, 175], 'left', '🚪', 'wardrobe'),
      spot('curtain', 'behind', 'curtain', 'rèm cửa', 'sau rèm cửa', [20, 25, 85, 150], 'right', '🪟', 'curtain'),
      spot('box', 'in', 'box', 'cái hộp', 'trong cái hộp', [40, 222, 70, 55], 'top', '📦', 'box'),
      spot('next-bed', 'next to', 'bed', 'cái giường', 'cạnh cái giường', [298, 228, 70, 60], 'left', '🧸', 'rug'),
    ],
    surprises: [surprise('teddy', 'teddy', 'con gấu bông', '🧸'), surprise('sock', 'sock', 'chiếc tất', '🧦'), surprise('cat', 'cat', 'con mèo', '🐱')],
  },
  {
    id: 'living-room', en: 'living room', vi: 'phòng khách', emoji: '🛋️', wall: '#e7f5ff', floor: '#d8c3a5', floorY: 205,
    setting: 'a bright family living room',
    spots: [
      spot('cushion', 'under', 'cushion', 'cái gối tựa', 'dưới cái gối tựa', [178, 122, 50, 34], 'top', '🟨', 'cushion'),
      spot('sofa', 'behind', 'sofa', 'ghế sô-pha', 'sau ghế sô-pha', [150, 112, 165, 95], 'top', '🛋️', 'sofa'),
      spot('plant', 'behind', 'plant', 'chậu cây', 'sau chậu cây', [18, 85, 65, 135], 'right', '🪴', 'plant'),
      spot('tv', 'next to', 'TV', 'cái ti vi', 'cạnh cái ti vi', [322, 70, 70, 100], 'left', '📺', 'tv'),
      spot('table', 'under', 'table', 'cái bàn', 'dưới gầm bàn', [140, 222, 135, 62], 'bottom', '🪑', 'table'),
      spot('basket', 'in', 'basket', 'cái giỏ', 'trong cái giỏ', [35, 232, 72, 55], 'top', '🧺', 'basket'),
    ],
    surprises: [surprise('dog', 'dog', 'con chó', '🐶'), surprise('ball', 'ball', 'quả bóng', '⚽'), surprise('car', 'car', 'chiếc ô tô', '🚗')],
  },
  {
    id: 'kitchen', en: 'kitchen', vi: 'nhà bếp', emoji: '🍳', wall: '#fff9db', floor: '#ced4da', floorY: 210,
    setting: 'a friendly kitchen',
    spots: [
      spot('cupboard', 'in', 'cupboard', 'tủ bếp', 'trong tủ bếp', [20, 30, 140, 62], 'top', '🗄️', 'cupboard'),
      spot('fridge', 'behind', 'fridge', 'tủ lạnh', 'sau tủ lạnh', [312, 45, 75, 195], 'left', '🧊', 'fridge'),
      spot('pot', 'in', 'big pot', 'cái nồi to', 'trong cái nồi to', [200, 96, 62, 46], 'top', '🍲', 'pot'),
      spot('oven', 'next to', 'oven', 'cái lò nướng', 'cạnh cái lò nướng', [190, 145, 82, 90], 'right', '♨️', 'oven'),
      spot('table', 'under', 'table', 'cái bàn', 'dưới gầm bàn', [35, 190, 135, 85], 'bottom', '🪑', 'table'),
    ],
    surprises: [surprise('mouse', 'mouse', 'con chuột', '🐭'), surprise('apple', 'apple', 'quả táo', '🍎'), surprise('spoon', 'spoon', 'cái thìa', '🥄')],
  },
  {
    id: 'bathroom', en: 'bathroom', vi: 'phòng tắm', emoji: '🛁', wall: '#e3fafc', floor: '#c5f6fa', floorY: 215,
    setting: 'a clean, cheerful bathroom',
    spots: [
      spot('shower', 'behind', 'shower curtain', 'rèm tắm', 'sau rèm tắm', [18, 25, 90, 200], 'right', '🚿', 'showerCurtain'),
      spot('bathtub', 'in', 'bathtub', 'bồn tắm', 'trong bồn tắm', [120, 140, 150, 85], 'top', '🛁', 'bathtub'),
      spot('sink', 'under', 'sink', 'bồn rửa', 'dưới bồn rửa', [292, 120, 80, 95], 'bottom', '🚰', 'sink'),
      spot('laundry', 'in', 'laundry basket', 'giỏ đồ bẩn', 'trong giỏ đồ bẩn', [302, 228, 70, 62], 'top', '🧺', 'laundry'),
      spot('toilet', 'next to', 'toilet', 'bồn cầu', 'cạnh bồn cầu', [188, 232, 70, 62], 'left', '🚽', 'toilet'),
    ],
    surprises: [surprise('duck', 'duck', 'con vịt', '🦆'), surprise('sponge', 'sponge', 'miếng bọt biển', '🧽'), surprise('bottle', 'bottle', 'cái chai', '🧴')],
  },
  {
    id: 'garden', en: 'garden', vi: 'khu vườn', emoji: '🌳', wall: '#d0ebff', floor: '#b2f2bb', floorY: 185,
    setting: 'a sunny garden with a small playground',
    spots: [
      spot('tree', 'behind', 'tree', 'cái cây', 'sau cái cây', [18, 25, 112, 215], 'right', '🌳', 'tree'),
      spot('house', 'in', 'little house', 'ngôi nhà nhỏ', 'trong ngôi nhà nhỏ', [150, 70, 92, 110], 'top', '🏠', 'littleHouse'),
      spot('bush', 'in', 'bush', 'bụi cây', 'trong bụi cây', [150, 192, 92, 62], 'top', '🌿', 'bush'),
      spot('slide', 'under', 'slide', 'cầu trượt', 'dưới cầu trượt', [268, 115, 122, 125], 'bottom', '🛝', 'slide'),
      spot('flowers', 'next to', 'flowers', 'những bông hoa', 'cạnh những bông hoa', [262, 246, 122, 48], 'left', '🌷', 'flowers'),
    ],
    surprises: [surprise('bird', 'bird', 'con chim', '🐦'), surprise('butterfly', 'butterfly', 'con bướm', '🦋'), surprise('frog', 'frog', 'con ếch', '🐸')],
  },
];
export const ROOM_BY_ID = new Map(ROOMS.map((r) => [r.id, r]));

/** Tranh phòng mặc định (SVG, khung 400 × 300): tường, sàn, đồ vật (ô lớn vẽ trước, ô nhỏ nằm trên). */
export function roomSvg(room) {
  const order = [...room.spots].sort((a, b) => area(b) - area(a));
  const sun = room.id === 'garden' ? `<circle cx="352" cy="38" r="22" fill="#ffd43b" ${LINE}/>` : '';
  return `<rect x="0" y="0" width="${W}" height="${room.floorY}" fill="${room.wall}"/>`
    + `<rect x="0" y="${room.floorY}" width="${W}" height="${H - room.floorY}" fill="${room.floor}"/>${sun}`
    + order.map((s) => DRAW[s.draw](s.rect)).join('');
}

// ---------- Vùng chạm ----------
const area = (s) => s.rect[2] * s.rect[3];
const inRect = ([x, y, w, h], px, py) => px >= x && px <= x + w && py >= y && py <= y + h;

/** Chỗ nấp tại điểm (x, y) trên khung 400 × 300: ô nhỏ nhất chứa điểm (chăn trên giường thắng giường). */
export function spotAt(room, x, y) {
  return room.spots.filter((s) => inRect(s.rect, x, y)).sort((a, b) => area(a) - area(b))[0] ?? null;
}

/** Một điểm chạm được của chỗ nấp (không bị ô nhỏ hơn che) — null nếu bị che hết. */
export function spotPoint(room, spotId) {
  const s = room.spots.find((sp) => sp.id === spotId);
  if (!s) return null;
  const [x, y, w, h] = s.rect;
  for (let fy = 0.5; fy < 1; fy += 0.1) {
    for (const fx of [0.5, 0.3, 0.7, 0.15, 0.85]) {
      for (const sy of [fy, 1 - fy]) {
        const px = x + w * fx;
        const py = y + h * sy;
        if (spotAt(room, px, py) === s) return { x: px, y: py };
      }
    }
  }
  return null;
}

/** Ô đặt đôi tai theo `peek` của chỗ nấp, luôn nằm trong khung tranh. */
export function earsBox(spot) {
  const [x, y, w, h] = spot.rect;
  const s = Math.max(30, Math.min(w, h) * 0.45);
  const cx = x + w / 2;
  const at = {
    top: [cx - s / 2, y - s * 0.75],
    bottom: [cx - s / 2, y + h - s * 0.95],
    left: [x - s * 0.45, y + h * 0.35 - s / 2],
    right: [x + w - s * 0.55, y + h * 0.35 - s / 2],
  }[spot.peek] ?? [cx - s / 2, y - s * 0.75];
  return [clampTo(at[0], 0, W - s), clampTo(at[1], 0, H - s), s, s];
}


const clampTo = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------- Câu nói ----------
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const INTRO_LINE = ["Let's play hide and seek! Close your eyes!", 'Mình chơi trốn tìm nhé! Nhắm mắt lại nào!'];
export const READY_LINE = ['Ready or not, here I come! Where is Bông?', 'Bông trốn ở đâu nhỉ?'];
export const WHERE_LINE = ['Where is Bông?', 'Bông trốn ở đâu nhỉ?'];
export const SWAP_LINE = ["Now you hide! I'll close my eyes.", 'Giờ con đi trốn nhé! Bông nhắm mắt đây.'];
export const HIDE_LINE = ['Hide, hide!', 'Con trốn đi nào!'];
export const NO_LINE = ['No!', 'Không!'];
export const YOUR_TURN_LINE = ['Your turn to find me!', 'Đến lượt con tìm Bông nhé!'];
export const SUGGEST_SWAP_LINE = ['Now you hide!', 'Giờ con đi trốn nhé!'];
export const COUNT_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/** Chạm nhầm: "Not under the bed!" (thỉnh thoảng thêm "Hee hee!"). */
export const notLine = (s, giggle = false) => [`Not ${s.phrase}!${giggle ? ' Hee hee!' : ''}`, `Không phải ${s.phraseVi}!`];
/** Tìm thấy Bông. */
export const foundLines = (s) => [['Peekaboo! You found me!', 'Ú òa! Con tìm thấy Bông rồi!'], [`I'm ${s.phrase}!`, `Bông trốn ${s.phraseVi}!`]];
/** Bông hỏi khi đi tìm bé: có tên "Is Na in the box?", không tên "Are you in the box?". */
export function askLine(s, name = '') {
  const who = String(name ?? '').trim();
  return who ? [`Is ${who} ${s.phrase}?`, `${who} có trốn ${s.phraseVi} không?`] : [`Are you ${s.phrase}?`, `Con có trốn ${s.phraseVi} không?`];
}
export const foundChildLine = (s) => [`Found you! You're ${s.phrase}!`, `Tìm thấy rồi! Con trốn ${s.phraseVi}!`];
export const surpriseLine = (x) => [`A ${x.en}!`, `${capital(x.vi)}!`];

// ---------- Túi giới từ, chọn chỗ, Bông đoán ----------
const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const roomPreps = (room) => PREPS.filter((p) => room.spots.some((s) => s.prep === p));

/**
 * Chỗ nấp lượt mới: rút một giới từ trong túi (hết thì đổ lại, xáo), chọn ngẫu nhiên một chỗ có giới từ đó,
 * không trùng chỗ của lượt ngay trước. Mỗi vòng túi, mỗi giới từ của phòng xuất hiện đúng một lần.
 * @returns {{ spot: object, bag: string[] }}
 */
export function nextHide(room, { bag = [], last = null } = {}, rng = Math.random) {
  let pool = bag.filter((p) => roomPreps(room).includes(p));
  if (!pool.length) pool = shuffle(roomPreps(room), rng);
  for (let i = 0; i < pool.length; i++) {
    const options = room.spots.filter((s) => s.prep === pool[i] && s.id !== last);
    if (options.length) {
      return { spot: options[Math.floor(rng() * options.length)], bag: pool.filter((_, k) => k !== i) };
    }
  }
  // Mọi giới từ còn trong túi chỉ có đúng chỗ vừa nấp: đổ túi mới.
  const fresh = shuffle(roomPreps(room), rng);
  const options = room.spots.filter((s) => s.id !== last);
  const pick = options[Math.floor(rng() * options.length)];
  return { spot: pick, bag: fresh.filter((p) => p !== pick.prep) };
}

/** Bông đi tìm bé: 0–2 chỗ sai (khác nhau, khác chỗ bé) rồi chỗ đúng. */
export function seekPlan(room, childSpotId, rng = Math.random) {
  const child = room.spots.find((s) => s.id === childSpotId);
  const wrong = shuffle(room.spots.filter((s) => s.id !== childSpotId), rng).slice(0, Math.floor(rng() * 3));
  return [...wrong, child];
}

/** Bất ngờ lần nhầm thứ k trong lượt: không lặp trong lượt, hết thì xoay vòng. */
export const surpriseFor = (room, k, offset = 0) => room.surprises[(offset + k) % room.surprises.length];

// ---------- Cài đặt ----------
export function cleanHideState(saved) {
  const s = saved && typeof saved === 'object' ? saved : {};
  return {
    room: ROOM_BY_ID.has(s.room) ? s.room : ROOMS[0].id,
    level: s.level === 'normal' ? 'normal' : 'easy',
    count: s.count === 10 ? 10 : 5,
    rounds: Number.isInteger(s.rounds) && s.rounds >= 0 ? s.rounds : 0,
  };
}

// ---------- Prompt ảnh phòng (H3) ----------
const pct = (v, total) => Math.round((v / total) * 100);
/** Prompt ảnh phòng: vị trí từng đồ vật theo %, đồ vật lớn, rõ, không người / con vật / chữ. */
export function roomPrompt(room, { reference = false } = {}) {
  const items = room.spots.map((s, i) => {
    const [x, y, w, h] = s.rect;
    return `${String.fromCharCode(65 + i)}. ${capital(s.thing)}: x = ${pct(x, W)}%–${pct(x + w, W)}%, y = ${pct(y, H)}%–${pct(y + h, H)}%.${s.prep === 'next to' ? ' Leave a little empty floor space beside it.' : ''}`;
  });
  return [
    reference
      ? `I attached a REFERENCE LAYOUT IMAGE of ${room.setting}. Redraw it as ONE nicer illustration with the same exact 4:3 aspect ratio (for example 1600 × 1200 pixels). Keep the composition EXACTLY: every object stays at the same position, with the same size and outline shape as in the attached image. Only improve the drawing style.`
      : `Create ONE landscape illustration of ${room.setting} with an exact 4:3 aspect ratio (for example 1600 × 1200 pixels).`,
    'It is the background of a hide-and-seek game for a 3-year-old child: a bunny hides under, in, behind or next to these objects, and the child taps the objects to find her.',
    '',
    'OBJECTS AND POSITIONS (percentages of the canvas from the top-left corner: x = from the left, y = from the top). Keep each object inside its area:',
    ...items,
    '',
    'RULES',
    '- Every object is large, clearly visible, front view, easy for a small child to recognize and tap.',
    '- No people, no animals, no characters, no bunny.',
    '- NEVER write any text, letters or labels in the image (the object names above are only for reference).',
    "- Style: cute, simple, flat children's picture-book illustration, soft pastel colors, thick clean dark outlines.",
  ].join('\n');
}
