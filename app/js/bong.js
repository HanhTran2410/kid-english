// Thỏ Bông vẽ bằng SVG (theo Character Bible: lông trắng kem, tai trong hồng nhạt, mắt to long lanh,
// vẫy tai khi vui). Thay cho emoji 🐰 vì emoji trên iOS màu xám.

const FUR = '#fff8ee';
const FUR_SHADE = '#f3e3cf';
const PINK = '#ffb3c7';
const CHEEK = '#ff9ab5';
const INK = '#4a3360';

function eyes(mood) {
  if (mood === 'sleep') {
    return `<path d="M70 112 q10 9 20 0 M110 112 q10 9 20 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
  }
  return `
    <ellipse cx="80" cy="110" rx="11" ry="13" fill="${INK}"/>
    <ellipse cx="120" cy="110" rx="11" ry="13" fill="${INK}"/>
    <circle cx="84" cy="104" r="4.5" fill="#fff"/>
    <circle cx="124" cy="104" r="4.5" fill="#fff"/>
    <circle cx="77" cy="115" r="2" fill="#fff" opacity="0.8"/>
    <circle cx="117" cy="115" r="2" fill="#fff" opacity="0.8"/>`;
}

function mouth(mood) {
  if (mood === 'sleep') return `<path d="M93 136 q7 5 14 0" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  // Cười tươi: miệng mở, có lưỡi hồng.
  return `
    <path d="M86 132 q14 20 28 0 z" fill="${INK}"/>
    <path d="M92 139 q8 8 16 0 q-8 -5 -16 0 z" fill="#ff7a9c"/>`;
}

/**
 * @param {{ mood?: 'happy'|'sleep', title?: string }} [options]
 * @returns {string} mã SVG
 */
export function bongSvg({ mood = 'happy', title = '' } = {}) {
  return `<svg class="bong-svg" viewBox="0 0 200 200" ${title ? `role="img" aria-label="${title}"` : 'aria-hidden="true"'}>
    <g class="bong-ear bong-ear-left">
      <ellipse cx="72" cy="52" rx="20" ry="48" fill="${FUR}" stroke="${FUR_SHADE}" stroke-width="3" transform="rotate(-12 72 52)"/>
      <ellipse cx="72" cy="56" rx="10" ry="34" fill="${PINK}" transform="rotate(-12 72 56)"/>
    </g>
    <g class="bong-ear bong-ear-right">
      <ellipse cx="128" cy="52" rx="20" ry="48" fill="${FUR}" stroke="${FUR_SHADE}" stroke-width="3" transform="rotate(12 128 52)"/>
      <ellipse cx="128" cy="56" rx="10" ry="34" fill="${PINK}" transform="rotate(12 128 56)"/>
    </g>
    <ellipse cx="100" cy="120" rx="66" ry="58" fill="${FUR}" stroke="${FUR_SHADE}" stroke-width="3"/>
    <ellipse cx="100" cy="150" rx="40" ry="22" fill="#ffffff" opacity="0.7"/>
    ${eyes(mood)}
    <ellipse cx="62" cy="134" rx="12" ry="7" fill="${CHEEK}" opacity="0.75"/>
    <ellipse cx="138" cy="134" rx="12" ry="7" fill="${CHEEK}" opacity="0.75"/>
    <path d="M94 124 q6 6 12 0 q-6 -4 -12 0 z" fill="#ff7a9c"/>
    ${mouth(mood)}
  </svg>`;
}

/** Phần tử chứa Bông, dùng ở mọi nơi trước đây là emoji 🐰. */
export function bongElement(className = '', options = {}) {
  const el = document.createElement('span');
  el.className = `bong ${className}`.trim();
  el.innerHTML = bongSvg(options);
  return el;
}
