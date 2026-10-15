// Dán tranh (SPEC-scenes.md): 3 bức tranh vẽ SVG, các "chỗ" có giới từ, câu Bông nói, Bông giao việc.
// Tọa độ vẽ theo khung 400 × 300; vị trí sticker lưu theo % của tranh.

import { STICKERS, STICKER_BY_ID } from './stickers.js';

export const SCENE_W = 400;
export const SCENE_H = 300;
export const MAX_PER_SCENE = 30;
/** Dán bao nhiêu lần (chưa có việc) thì Bông tự giao việc. */
export const DROPS_PER_REQUEST = 3;

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

/**
 * Các chỗ của mỗi tranh, theo thứ tự ưu tiên (vùng nhỏ trước, vùng nền sau cùng).
 * rect: [x, y, rộng, cao] theo khung 400 × 300.
 */
export const SCENES = [
  {
    id: 'farm', en: 'Farm', vi: 'Nông trại', emoji: '🚜', intro: "Let's play on the farm!", svg: FARM_SVG,
    zones: [
      { id: 'roof', en: 'on the roof', vi: 'trên mái nhà', rect: [250, 70, 130, 52] },
      { id: 'barn', en: 'in the barn', vi: 'trong chuồng', rect: [262, 122, 106, 95] },
      { id: 'tree', en: 'in the tree', vi: 'trong tán cây', rect: [8, 40, 124, 110] },
      { id: 'under-tree', en: 'under the tree', vi: 'dưới gốc cây', rect: [0, 150, 145, 85] },
      { id: 'water', en: 'in the water', vi: 'trong nước', rect: [140, 227, 150, 56] },
      { id: 'sky', en: 'in the sky', vi: 'trên trời', rect: [0, 0, 400, 160] },
      { id: 'grass', en: 'on the grass', vi: 'trên bãi cỏ', rect: [0, 160, 400, 140] },
    ],
  },
  {
    id: 'beach', en: 'Beach', vi: 'Bãi biển', emoji: '🏖️', intro: "Let's play at the beach!", svg: BEACH_SVG,
    zones: [
      { id: 'boat', en: 'in the boat', vi: 'trong thuyền', rect: [215, 92, 112, 52] },
      { id: 'bucket', en: 'in the bucket', vi: 'trong xô', rect: [296, 212, 56, 64] },
      { id: 'umbrella', en: 'under the umbrella', vi: 'dưới cái ô', rect: [32, 184, 118, 92] },
      { id: 'water', en: 'in the water', vi: 'trong nước', rect: [0, 120, 400, 82] },
      { id: 'sky', en: 'in the sky', vi: 'trên trời', rect: [0, 0, 400, 120] },
      { id: 'sand', en: 'on the sand', vi: 'trên cát', rect: [0, 202, 400, 98] },
    ],
  },
  {
    id: 'bedroom', en: 'Bedroom', vi: 'Phòng ngủ', emoji: '🛏️', intro: "Let's play in the bedroom!", svg: BEDROOM_SVG,
    zones: [
      { id: 'bed', en: 'on the bed', vi: 'trên giường', rect: [205, 128, 192, 76] },
      { id: 'under-bed', en: 'under the bed', vi: 'dưới gầm giường', rect: [216, 206, 176, 40] },
      { id: 'box', en: 'in the box', vi: 'trong hộp', rect: [22, 200, 112, 84] },
      { id: 'shelf', en: 'on the shelf', vi: 'trên kệ', rect: [228, 36, 144, 54] },
      { id: 'wall', en: 'on the wall', vi: 'trên tường', rect: [0, 0, 400, 200] },
      { id: 'floor', en: 'on the floor', vi: 'trên sàn', rect: [0, 200, 400, 100] },
    ],
  },
];

export const SCENE_BY_ID = new Map(SCENES.map((s) => [s.id, s]));

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

const PLURAL = new Set(['grapes', 'fries', 'pancakes']);

/** "The lion is in the tree!" / "The grapes are on the bed!" */
export function placedSentence(sticker, zone) {
  return `The ${sticker.name} ${PLURAL.has(sticker.name) ? 'are' : 'is'} ${zone.en}!`;
}

/** "Put the duck in the water!" */
export const requestSentence = (sticker, zone) => `Put the ${sticker.name} ${zone.en}!`;

/** Sticker bé đã có, sticker mới nhận đứng đầu. */
export function ownedStickers(owned) {
  return STICKERS.filter((s) => owned[s.id]?.count > 0)
    .sort((a, b) => (owned[b.id].firstEarnedAt ?? 0) - (owned[a.id].firstEarnedAt ?? 0));
}

/** Số sticker còn trong khay (chưa dán vào tranh này). */
export const remaining = (owned, placed, id) => (owned[id]?.count ?? 0) - placed.filter((p) => p.s === id).length;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/**
 * Sticker đã dán của một tranh, sau khi bỏ: sticker không còn trong bộ sưu tập, vượt số đang có,
 * dữ liệu hỏng, vượt quá MAX_PER_SCENE.
 */
export function cleanPlacements(list, owned) {
  const used = new Map();
  const out = [];
  for (const p of Array.isArray(list) ? list : []) {
    if (!p || !STICKER_BY_ID.has(p.s) || !Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    const n = (used.get(p.s) ?? 0) + 1;
    if (n > (owned[p.s]?.count ?? 0) || out.length >= MAX_PER_SCENE) continue;
    used.set(p.s, n);
    out.push({ s: p.s, x: clamp(p.x, 0, 100), y: clamp(p.y, 0, 100) });
  }
  return out;
}

/**
 * Bông giao việc (SPEC-scenes mục 4.1): chọn một cặp (sticker, chỗ) làm được —
 * sticker bé có, chưa có bản nào đứng ở chỗ đó, và còn dán được (tranh chưa đủ 30 hoặc sticker đã có trong tranh để kéo).
 * Ưu tiên khác cả sticker lẫn chỗ của việc vừa xong; không được thì chỉ cần khác đúng cặp đó.
 * @returns {{ sticker: object, zone: object } | null} null: không còn việc nào làm được
 */
export function pickRequest(scene, owned, placed, last = null, rng = Math.random) {
  const pairs = [];
  for (const sticker of ownedStickers(owned)) {
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
