// Bạn thú (bệnh nhân) của Bác sĩ nhí (SPEC-doctor mục 5): một khung thân chung kiểu thú bông, ngồi trên giường,
// 4 cái đầu khác nhau (gấu, mèo, cún, heo). Mọi bạn dùng chung tọa độ vùng chạm (SPOTS trong doctor.js), viewBox 240 × 300.
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
};

function ears(id, c) {
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

/** Mặt: 'sad' (vào phòng), 'happy' (khỏe), 'sleepy' (ca buồn ngủ). */
export function faceSvg(mood = 'sad') {
  const cheeks = `<circle cx="80" cy="124" r="10" fill="${CHEEK}" opacity="0.6"/><circle cx="160" cy="124" r="10" fill="${CHEEK}" opacity="0.6"/>`;
  if (mood === 'sleepy') {
    return `${cheeks}
      <path d="M80 90 q12 8 24 0 M136 90 q12 8 24 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="120" cy="140" rx="6" ry="7" fill="${INK}"/>`;
  }
  const eyes = `
    <ellipse cx="92" cy="88" rx="9" ry="11" fill="${INK}"/><ellipse cx="148" cy="88" rx="9" ry="11" fill="${INK}"/>
    <circle cx="95" cy="83" r="3.5" fill="#fff"/><circle cx="151" cy="83" r="3.5" fill="#fff"/>`;
  if (mood === 'happy') {
    return `${cheeks}${eyes}
      <path d="M104 134 q16 18 32 0 z" fill="${INK}"/>
      <path d="M111 140 q9 7 18 0 q-9 -5 -18 0 z" fill="#ff7a9c"/>`;
  }
  return `${cheeks}${eyes}
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
      <circle cx="40" cy="214" r="17" fill="${c.fur}" stroke="${c.shade}" stroke-width="3"/>
      <circle cx="200" cy="214" r="17" fill="${c.fur}" stroke="${c.shade}" stroke-width="3"/>
      ${ears(id, c)}
      <circle cx="120" cy="96" r="70" fill="${c.fur}" stroke="${c.shade}" stroke-width="3"/>
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
