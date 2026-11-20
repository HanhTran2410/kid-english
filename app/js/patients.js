// Bạn thú (bệnh nhân) của Bác sĩ nhí (SPEC-doctor mục 5): một khung thân chung kiểu thú bông, ngồi trên giường,
// 4 cái đầu khác nhau (gấu, mèo, cún, heo) + 3 bạn nông trại (bò, cừu, ngựa — SPEC-jobs6 mục 4: sừng, bờm, lông cừu nằm
// trong vùng đầu / ngoài mọi vùng, không lấn sang mắt / tai / tay). Mọi bạn dùng chung tọa độ vùng chạm (SPOTS trong doctor.js), viewBox 240 × 300.
// Mặt (buồn / vui / buồn ngủ) và dấu hiệu bệnh vẽ trong nhóm riêng để đổi mà không vẽ lại cả bạn thú.

import { SPOTS, VIEW_W, VIEW_H } from './doctor.js';

const INK = '#4a3360';
const CHEEK = '#ff9ab5';
const SCRATCH = '#ff7a9c';

/** Màu lông theo bạn thú: `fur` lông, `shade` viền, `light` mõm / bụng, `ear` tai trong. */
const LOOKS = {
  teddy: { fur: '#d9a066', shade: '#b97f48', light: '#f6dcb8', ear: '#f6dcb8' },
  kitty: { fur: '#ffc078', shade: '#e8994a', light: '#fff1dc', ear: '#ffb3c7' },
  puppy: { fur: '#f5e6cc', shade: '#d9c19b', light: '#ffffff', ear: '#a9744a' },
  piggy: { fur: '#ffc2d1', shade: '#f08cab', light: '#ffe0e8', ear: '#ff9ab5' },
  cow: { fur: '#ffffff', shade: '#868e96', light: '#ffe3ec', ear: '#ffc9d6', spot: '#495057', horn: '#f8d66d' },
  sheep: { fur: '#ffe8cc', shade: '#d9a066', light: '#fff4e6', ear: '#ffd8a8', wool: '#ffffff', woolShade: '#ced4da' },
  horse: { fur: '#c0803f', shade: '#8a5a2b', light: '#e8b67e', ear: '#e8b67e', mane: '#5c3a1e' },
};

function ears(id, c) {
  if (id === 'cow') {
    return `
      <path d="M90 36 q-14 -12 -8 -30 M150 36 q14 -12 8 -30" fill="none" stroke="${c.horn}" stroke-width="10" stroke-linecap="round"/>
      <path d="M90 36 q-14 -12 -8 -30 M150 36 q14 -12 8 -30" fill="none" stroke="#c9a227" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
      <ellipse cx="56" cy="42" rx="24" ry="12" fill="${c.fur}" stroke="${c.shade}" stroke-width="3" transform="rotate(-22 56 42)"/>
      <ellipse cx="56" cy="42" rx="13" ry="6" fill="${c.ear}" transform="rotate(-22 56 42)"/>
      <ellipse cx="184" cy="42" rx="24" ry="12" fill="${c.fur}" stroke="${c.shade}" stroke-width="3" transform="rotate(22 184 42)"/>
      <ellipse cx="184" cy="42" rx="13" ry="6" fill="${c.ear}" transform="rotate(22 184 42)"/>`;
  }
  if (id === 'sheep') {
    return `
      <ellipse cx="54" cy="44" rx="26" ry="12" fill="${c.fur}" stroke="${c.shade}" stroke-width="3" transform="rotate(28 54 44)"/>
      <ellipse cx="54" cy="44" rx="14" ry="6" fill="${c.ear}" transform="rotate(28 54 44)"/>
      <ellipse cx="186" cy="44" rx="26" ry="12" fill="${c.fur}" stroke="${c.shade}" stroke-width="3" transform="rotate(-28 186 44)"/>
      <ellipse cx="186" cy="44" rx="14" ry="6" fill="${c.ear}" transform="rotate(-28 186 44)"/>`;
  }
  if (id === 'horse') {
    return `
      <path d="M52 62 L60 4 L94 40 Z" fill="${c.fur}" stroke="${c.shade}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M62 50 L64 20 L84 40 Z" fill="${c.ear}"/>
      <path d="M188 62 L180 4 L146 40 Z" fill="${c.fur}" stroke="${c.shade}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M178 50 L176 20 L156 40 Z" fill="${c.ear}"/>`;
  }
  if (id === 'kitty') {
    return `
      <path d="M44 66 L56 6 L98 38 Z" fill="${c.fur}" stroke="${c.shade}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M58 54 L62 22 L86 40 Z" fill="${c.ear}"/>
      <path d="M196 66 L184 6 L142 38 Z" fill="${c.fur}" stroke="${c.shade}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M182 54 L178 22 L154 40 Z" fill="${c.ear}"/>`;
  }
  if (id === 'puppy') {
    return `
      <ellipse cx="56" cy="56" rx="20" ry="36" fill="${c.ear}" transform="rotate(24 56 56)"/>
      <ellipse cx="184" cy="56" rx="20" ry="36" fill="${c.ear}" transform="rotate(-24 184 56)"/>`;
  }
  if (id === 'piggy') {
    return `
      <path d="M50 58 L60 12 L94 42 Z" fill="${c.fur}" stroke="${c.shade}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M190 58 L180 12 L146 42 Z" fill="${c.fur}" stroke="${c.shade}" stroke-width="3" stroke-linejoin="round"/>`;
  }
  return `
    <circle cx="62" cy="38" r="26" fill="${c.fur}" stroke="${c.shade}" stroke-width="3"/>
    <circle cx="62" cy="40" r="13" fill="${c.ear}"/>
    <circle cx="178" cy="38" r="26" fill="${c.fur}" stroke="${c.shade}" stroke-width="3"/>
    <circle cx="178" cy="40" r="13" fill="${c.ear}"/>`;
}

function muzzle(id, c) {
  if (id === 'cow') {
    return `
      <ellipse cx="120" cy="124" rx="40" ry="26" fill="${c.ear}" stroke="${c.shade}" stroke-width="3"/>
      <ellipse cx="104" cy="120" rx="5" ry="7" fill="${INK}" opacity="0.7"/>
      <ellipse cx="136" cy="120" rx="5" ry="7" fill="${INK}" opacity="0.7"/>`;
  }
  if (id === 'horse') {
    return `
      <ellipse cx="120" cy="126" rx="36" ry="30" fill="${c.light}"/>
      <ellipse cx="108" cy="124" rx="4" ry="6" fill="${INK}" opacity="0.7"/>
      <ellipse cx="132" cy="124" rx="4" ry="6" fill="${INK}" opacity="0.7"/>`;
  }
  if (id === 'piggy') {
    return `
      <ellipse cx="120" cy="112" rx="24" ry="16" fill="${c.ear}" stroke="${c.shade}" stroke-width="3"/>
      <ellipse cx="111" cy="112" rx="4" ry="6" fill="${INK}" opacity="0.7"/>
      <ellipse cx="129" cy="112" rx="4" ry="6" fill="${INK}" opacity="0.7"/>`;
  }
  if (id === 'kitty') {
    return `
      <path d="M112 106 h16 l-8 9 z" fill="#ff7a9c" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M84 116 h-30 M84 124 l-28 6 M156 116 h30 M156 124 l28 6" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" opacity="0.55"/>`;
  }
  return `
    <ellipse cx="120" cy="124" rx="32" ry="26" fill="${c.light}"/>
    <ellipse cx="120" cy="110" rx="11" ry="8" fill="${INK}"/>
    <ellipse cx="116" cy="107" rx="3" ry="2" fill="#fff" opacity="0.7"/>`;
}

/** Đốm bò trên thân (không trùng tay / chân / mặt). */
function bodyExtras(id, c) {
  if (id === 'cow') {
    return `<path d="M86 186 q14 -12 26 0 q4 14 -12 18 q-16 -2 -14 -18 Z M138 236 q16 -8 22 6 q-2 14 -16 12 q-12 -4 -6 -18 Z" fill="${c.spot}" opacity="0.85"/>`;
  }
  if (id === 'sheep') {
    // Lông cừu bông xù quanh thân (chỉ trang trí; vùng chạm vẫn là bụng / tay / chân).
    const puffs = [[70, 190], [92, 172], [120, 166], [148, 172], [170, 190], [176, 222], [166, 252], [74, 252], [64, 222]];
    return puffs.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="18" fill="${c.wool}" stroke="${c.woolShade}" stroke-width="2"/>`).join('') +
      `<ellipse cx="120" cy="226" rx="40" ry="38" fill="${c.light}"/>`;
  }
  return '';
}
/** Trên đầu: búi lông cừu, bờm ngựa, đốm bò (trong vùng đầu, trên mắt). */
function headExtras(id, c) {
  if (id === 'sheep') {
    const puffs = [[84, 40], [104, 30], [126, 28], [148, 34], [164, 46]];
    return puffs.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="17" fill="${c.wool}" stroke="${c.woolShade}" stroke-width="2"/>`).join('');
  }
  if (id === 'horse') {
    return `<path d="M96 34 q8 -26 24 -26 q16 0 24 26 q-12 -8 -24 -6 q-12 -2 -24 6 Z" fill="${c.mane}" stroke="${c.shade}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M104 30 q4 14 -2 24 M120 24 q4 14 -2 26 M136 30 q4 14 -2 24" fill="none" stroke="${c.mane}" stroke-width="7" stroke-linecap="round"/>`;
  }
  if (id === 'cow') return `<path d="M140 40 q16 -8 26 6 q-4 14 -18 10 q-12 -4 -8 -16 Z" fill="${c.spot}" opacity="0.85"/>`;
  return '';
}

/**
 * Mặt: 'sad' (vào phòng), 'happy' (khỏe), 'sleepy' (ca buồn ngủ); mặt cảm xúc nhẹ nhàng của việc Dỗ bạn thú
 * (SPEC-jobs4 mục 6): 'scared' (mắt to tròn), 'teary' (buồn + một giọt nước mắt nhỏ), 'drowsy' (lim dim + z), 'hungry' (liếm môi).
 */
export function faceSvg(mood = 'sad') {
  const cheeks = `<circle cx="80" cy="124" r="10" fill="${CHEEK}" opacity="0.6"/><circle cx="160" cy="124" r="10" fill="${CHEEK}" opacity="0.6"/>`;
  if (mood === 'scared') {
    return `${cheeks}
      <circle cx="92" cy="88" r="15" fill="#fff" stroke="${INK}" stroke-width="4"/><circle cx="148" cy="88" r="15" fill="#fff" stroke="${INK}" stroke-width="4"/>
      <circle cx="92" cy="90" r="6" fill="${INK}"/><circle cx="148" cy="90" r="6" fill="${INK}"/>
      <path d="M76 62 q14 -10 28 -4 M164 62 q-14 -10 -28 -4" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <path d="M104 144 q5 -6 8 0 q4 6 8 0 q4 -6 8 0 q4 6 8 0" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  }
  if (mood === 'drowsy') {
    return `${cheeks}
      <path d="M80 88 h24 M136 88 h24" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <path d="M82 88 q10 10 20 0 M138 88 q10 10 20 0" fill="${INK}"/>
      <ellipse cx="120" cy="142" rx="8" ry="9" fill="${INK}"/>
      <text x="176" y="52" font-size="26" font-weight="900" fill="${INK}" opacity="0.7">z</text>
      <text x="194" y="30" font-size="18" font-weight="900" fill="${INK}" opacity="0.5">z</text>`;
  }
  if (mood === 'sleepy') {
    return `${cheeks}
      <path d="M80 90 q12 8 24 0 M136 90 q12 8 24 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="120" cy="140" rx="6" ry="7" fill="${INK}"/>`;
  }
  const eyes = `
    <ellipse cx="92" cy="88" rx="9" ry="11" fill="${INK}"/><ellipse cx="148" cy="88" rx="9" ry="11" fill="${INK}"/>
    <circle cx="95" cy="83" r="3.5" fill="#fff"/><circle cx="151" cy="83" r="3.5" fill="#fff"/>`;
  if (mood === 'hungry') {
    return `${cheeks}${eyes}
      <path d="M104 136 q16 10 32 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <path d="M124 139 q8 2 10 10 q-8 4 -12 -4 z" fill="#ff7a9c" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
  }
  if (mood === 'happy') {
    return `${cheeks}${eyes}
      <path d="M104 134 q16 18 32 0 z" fill="${INK}"/>
      <path d="M111 140 q9 7 18 0 q-9 -5 -18 0 z" fill="#ff7a9c"/>`;
  }
  const tear = mood === 'teary' ? `<path d="M150 102 q6 9 0 14 q-6 -5 0 -14 z" fill="#74c0fc" stroke="#4dabf7" stroke-width="1.5"/>` : '';
  return `${cheeks}${eyes}${tear}
    <path d="M78 74 q10 -2 24 -12 M162 74 q-10 -2 -24 -12" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <path d="M106 144 q14 -12 28 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
}

/** Vết xước hồng nhạt (không máu) ở một điểm. */
const scratch = (x, y) => `
  <g class="dr-scratch">
    <path d="M${x - 11} ${y - 6} l20 8 M${x - 9} ${y + 4} l18 7" stroke="${SCRATCH}" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
  </g>`;

/** Dấu hiệu bệnh (SPEC mục 6.3). Bên phải bạn thú = bên trái màn hình (điểm đầu tiên của vùng). */
export function signSvg(sign, look = LOOKS.teddy) {
  switch (sign) {
    case 'cut-hand': return scratch(40, 212);
    case 'cut-foot': return scratch(80, 274);
    case 'tummy':
      return `<path d="M100 206 q6 -8 12 0 q6 8 12 0 M108 226 q6 -8 12 0 q6 8 12 0" fill="none" stroke="${SCRATCH}" stroke-width="4" stroke-linecap="round" opacity="0.8"/>`;
    case 'runny-nose':
      return '<path d="M130 116 q6 12 0 20 q-7 -4 -4 -12 z" fill="#b7f0c6" stroke="#7cd39a" stroke-width="2"/>';
    case 'tooth':
      return `<ellipse cx="180" cy="126" rx="18" ry="17" fill="${look.fur}" stroke="${look.shade}" stroke-width="3"/>
        <circle cx="176" cy="126" r="10" fill="${CHEEK}" opacity="0.85"/>`;
    case 'eye':
      return `<path d="M136 84 l22 8" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
    case 'bump':
      return `<circle cx="104" cy="36" r="13" fill="${CHEEK}" stroke="${SCRATCH}" stroke-width="3"/>`;
    case 'fever':
      return `<circle cx="80" cy="124" r="13" fill="#ff6b6b" opacity="0.55"/><circle cx="160" cy="124" r="13" fill="#ff6b6b" opacity="0.55"/>
        <path d="M178 60 q6 10 0 16 q-6 -6 0 -16 z" fill="#9bd4ff"/>`;
    case 'muddy':
      // Bùn nâu ở hai bàn chân (+ vài vệt), không vẽ gì đáng sợ.
      return `<g class="dr-mud" fill="#8d5a2b" opacity="0.88">
        <path d="M58 280 q4 -16 22 -14 q20 0 22 14 q-4 14 -22 12 q-20 2 -22 -12 Z"/>
        <path d="M138 280 q4 -16 22 -14 q20 0 22 14 q-4 14 -22 12 q-20 2 -22 -12 Z"/>
        <circle cx="70" cy="254" r="6"/><circle cx="168" cy="250" r="5"/><circle cx="150" cy="258" r="4"/>
      </g>`;
    case 'cough':
      return `<text x="168" y="150" font-size="22" font-weight="900" fill="${INK}" opacity="0.7">cough</text>`;
    default: return '';
  }
}

/**
 * Cả bạn thú. Nhóm có class để màn chơi đổi riêng: `.dr-face` (mặt), `.dr-sign` (dấu hiệu), `.dr-applied` (đồ đã dán),
 * `.dr-glows` (viền sáng chỗ đau), `.dr-spots` (điểm chạm vô hình, dùng cho test / trợ năng).
 */
export function patientSvg(id, { mood = 'sad', sign = null, title = '' } = {}) {
  const c = LOOKS[id] ?? LOOKS.teddy;
  const spots = SPOTS.filter((s) => s.tier === 1 || s.region === 'tummy' || s.region === 'head')
    .map((s) => `<circle class="dr-spot" data-region="${s.region}" cx="${s.x}" cy="${s.region === 'head' ? 40 : s.y}" r="${Math.round(s.r * 0.45)}" fill="transparent"/>`)
    .join('');
  return `<svg class="dr-svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" ${title ? `role="img" aria-label="${title}"` : 'aria-hidden="true"'}>
    <g class="dr-body">
      <ellipse cx="80" cy="280" rx="27" ry="17" fill="${c.fur}" stroke="${c.shade}" stroke-width="3"/>
      <ellipse cx="160" cy="280" rx="27" ry="17" fill="${c.fur}" stroke="${c.shade}" stroke-width="3"/>
      <ellipse cx="80" cy="283" rx="14" ry="8" fill="${c.light}"/>
      <ellipse cx="160" cy="283" rx="14" ry="8" fill="${c.light}"/>
      <ellipse cx="62" cy="196" rx="15" ry="34" fill="${c.fur}" stroke="${c.shade}" stroke-width="3" transform="rotate(34 62 196)"/>
      <ellipse cx="178" cy="196" rx="15" ry="34" fill="${c.fur}" stroke="${c.shade}" stroke-width="3" transform="rotate(-34 178 196)"/>
      <ellipse cx="120" cy="220" rx="66" ry="58" fill="${c.fur}" stroke="${c.shade}" stroke-width="3"/>
      <ellipse cx="120" cy="226" rx="40" ry="38" fill="${c.light}"/>
      ${bodyExtras(id, c)}
      <circle cx="40" cy="214" r="17" fill="${c.fur}" stroke="${c.shade}" stroke-width="3"/>
      <circle cx="200" cy="214" r="17" fill="${c.fur}" stroke="${c.shade}" stroke-width="3"/>
      ${ears(id, c)}
      <circle cx="120" cy="96" r="70" fill="${c.fur}" stroke="${c.shade}" stroke-width="3"/>
      ${headExtras(id, c)}
      ${muzzle(id, c)}
    </g>
    <g class="dr-face">${faceSvg(mood)}</g>
    <g class="dr-sign">${signSvg(sign, c)}</g>
    <g class="dr-applied"></g>
    <g class="dr-glows"></g>
    <g class="dr-spots">${spots}</g>
  </svg>`;
}

/** Viền sáng các điểm của một vùng (chỗ đau nhấp nháy / chạm đúng). */
export function glowSvg(region, cls = 'dr-glow') {
  return SPOTS.filter((s) => s.region === region)
    .map((s) => `<circle class="${cls}" cx="${s.x}" cy="${s.y}" r="${Math.min(s.r, 40)}" fill="none"/>`)
    .join('');
}

export { LOOKS };
