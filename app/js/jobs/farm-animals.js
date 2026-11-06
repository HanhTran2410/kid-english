// Con vật Nông trại (SPEC-jobs3 mục 4.1) vẽ SVG cùng kiểu bạn thú (viewBox 200 × 200): thân tròn, đầu to, mắt chấm,
// má hồng, nét viền tím đậm. Mặt 'hungry' (miệng chữ o) / 'happy' (cười). Bố mẹ thay được bằng ảnh AI (jobs/items.js, mã `<con>-hungry` / `<con>-happy`).

const INK = '#4a3360';
const CHEEK = '#ff9ab5';

function eyes(cx, cy, gap, mood) {
  const smile = mood === 'happy';
  return `${smile
    ? `<path d="M${cx - gap - 6} ${cy} q6 -7 12 0 M${cx + gap - 6} ${cy} q6 -7 12 0" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`
    : `<circle cx="${cx - gap}" cy="${cy}" r="6" fill="${INK}"/><circle cx="${cx + gap}" cy="${cy}" r="6" fill="${INK}"/><circle cx="${cx - gap + 2}" cy="${cy - 2}" r="2" fill="#fff"/><circle cx="${cx + gap + 2}" cy="${cy - 2}" r="2" fill="#fff"/>`}
  <circle cx="${cx - gap - 10}" cy="${cy + 16}" r="7" fill="${CHEEK}" opacity="0.7"/><circle cx="${cx + gap + 10}" cy="${cy + 16}" r="7" fill="${CHEEK}" opacity="0.7"/>`;
}
const mouth = (cx, cy, mood) => (mood === 'happy'
  ? `<path d="M${cx - 9} ${cy} Q${cx} ${cy + 10} ${cx + 9} ${cy}" fill="#ff7a9c" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`
  : `<ellipse cx="${cx}" cy="${cy + 3}" rx="5" ry="6" fill="#ff7a9c" stroke="${INK}" stroke-width="3"/>`);
/** Thân + chân chung (màu `fur`, bụng `belly`). */
const body = (fur, belly, shade) => `
  <ellipse cx="100" cy="150" rx="58" ry="42" fill="${fur}" stroke="${shade}" stroke-width="4"/>
  <ellipse cx="100" cy="158" rx="34" ry="24" fill="${belly}"/>
  <rect x="62" y="176" width="20" height="20" rx="8" fill="${fur}" stroke="${shade}" stroke-width="4"/>
  <rect x="118" y="176" width="20" height="20" rx="8" fill="${fur}" stroke="${shade}" stroke-width="4"/>`;

const DRAW = {
  cow: (m) => `${body('#fff', '#ffe3ec', '#868e96')}
    <path d="M70 140 q10 -14 22 -4 q-6 14 -22 4 Z M120 150 q14 -10 22 2 q-10 12 -22 -2 Z" fill="#495057"/>
    <path d="M52 44 q-14 -14 -6 -26 M148 44 q14 -14 6 -26" stroke="#f8d66d" stroke-width="9" stroke-linecap="round" fill="none"/>
    <ellipse cx="44" cy="60" rx="18" ry="10" fill="#fff" stroke="#868e96" stroke-width="4"/><ellipse cx="156" cy="60" rx="18" ry="10" fill="#fff" stroke="#868e96" stroke-width="4"/>
    <circle cx="100" cy="74" r="48" fill="#fff" stroke="#868e96" stroke-width="4"/>
    <path d="M70 44 q14 -6 20 10 q-14 10 -20 -10 Z" fill="#495057"/>
    <ellipse cx="100" cy="100" rx="32" ry="20" fill="#ffc2d1" stroke="#f08cab" stroke-width="3"/>
    <ellipse cx="90" cy="98" rx="4" ry="5" fill="${INK}" opacity="0.7"/><ellipse cx="110" cy="98" rx="4" ry="5" fill="${INK}" opacity="0.7"/>
    ${eyes(100, 66, 20, m)}${mouth(100, 108, m)}`,
  sheep: (m) => `
    <g fill="#f8f9fa" stroke="#adb5bd" stroke-width="4">${[[60, 140], [86, 126], [114, 126], [140, 140], [70, 166], [100, 172], [130, 166]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="24"/>`).join('')}</g>
    <rect x="66" y="176" width="16" height="20" rx="6" fill="#495057"/><rect x="118" y="176" width="16" height="20" rx="6" fill="#495057"/>
    <ellipse cx="48" cy="74" rx="18" ry="9" fill="#495057"/><ellipse cx="152" cy="74" rx="18" ry="9" fill="#495057"/>
    <ellipse cx="100" cy="80" rx="38" ry="44" fill="#495057"/>
    <g fill="#f8f9fa" stroke="#adb5bd" stroke-width="4"><circle cx="80" cy="40" r="16"/><circle cx="100" cy="34" r="17"/><circle cx="120" cy="40" r="16"/></g>
    <ellipse cx="100" cy="84" rx="30" ry="34" fill="#868e96"/>
    ${eyes(100, 76, 14, m)}${mouth(100, 104, m)}`,
  horse: (m) => `${body('#c0803f', '#e8b67e', '#8a5a2b')}
    <path d="M128 112 L150 132" stroke="#8a5a2b" stroke-width="4"/>
    <path d="M70 34 L64 10 L84 26 Z M130 34 L136 10 L116 26 Z" fill="#c0803f" stroke="#8a5a2b" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="100" cy="76" rx="40" ry="50" fill="#c0803f" stroke="#8a5a2b" stroke-width="4"/>
    <path d="M86 26 q14 -16 30 -2 q-6 14 -16 22 q-6 -12 -14 -20 Z" fill="#5c3d2e"/>
    <ellipse cx="100" cy="106" rx="28" ry="20" fill="#e8b67e" stroke="#8a5a2b" stroke-width="3"/>
    <ellipse cx="90" cy="104" rx="4" ry="5" fill="${INK}" opacity="0.7"/><ellipse cx="110" cy="104" rx="4" ry="5" fill="${INK}" opacity="0.7"/>
    ${eyes(100, 66, 18, m)}${mouth(100, 114, m)}`,
  chicken: (m) => `
    <ellipse cx="100" cy="146" rx="56" ry="44" fill="#fff" stroke="#adb5bd" stroke-width="4"/>
    <path d="M150 128 q24 -10 26 10 q-12 4 -26 2 Z" fill="#fff" stroke="#adb5bd" stroke-width="4" stroke-linejoin="round"/>
    <path d="M66 150 q22 -20 42 0" fill="none" stroke="#adb5bd" stroke-width="4"/>
    <path d="M80 188 v10 M120 188 v10" stroke="#f59f00" stroke-width="6" stroke-linecap="round"/>
    <circle cx="100" cy="76" r="44" fill="#fff" stroke="#adb5bd" stroke-width="4"/>
    <path d="M82 36 q4 -20 18 -10 q8 -16 18 0 q14 -4 10 12 Z" fill="#ff6b6b" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M88 92 L100 108 L112 92 Z" fill="#fcc419" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M96 108 q4 12 8 0" fill="#ff6b6b" stroke="${INK}" stroke-width="2"/>
    ${eyes(100, 72, 18, m)}`,
  pig: (m) => `${body('#ffc2d1', '#ffe0e8', '#f08cab')}
    <path d="M154 144 q16 -6 10 10 q-8 6 -4 -6" fill="none" stroke="#f08cab" stroke-width="4" stroke-linecap="round"/>
    <path d="M58 46 L62 14 L90 34 Z M142 46 L138 14 L110 34 Z" fill="#ffc2d1" stroke="#f08cab" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="100" cy="76" r="48" fill="#ffc2d1" stroke="#f08cab" stroke-width="4"/>
    <ellipse cx="100" cy="94" rx="24" ry="16" fill="#ff9ab5" stroke="#f08cab" stroke-width="3"/>
    <ellipse cx="91" cy="94" rx="4" ry="6" fill="${INK}" opacity="0.7"/><ellipse cx="109" cy="94" rx="4" ry="6" fill="${INK}" opacity="0.7"/>
    ${eyes(100, 62, 22, m)}${mouth(100, 114, m)}`,
  duck: (m) => `
    <ellipse cx="100" cy="148" rx="58" ry="40" fill="#ffe066" stroke="#f59f00" stroke-width="4"/>
    <path d="M150 132 q22 -12 24 6 q-10 6 -24 2 Z" fill="#ffe066" stroke="#f59f00" stroke-width="4" stroke-linejoin="round"/>
    <path d="M70 150 q20 -18 40 0" fill="none" stroke="#f59f00" stroke-width="4"/>
    <path d="M76 186 h16 M110 186 h16" stroke="#ff922b" stroke-width="8" stroke-linecap="round"/>
    <circle cx="100" cy="74" r="44" fill="#ffe066" stroke="#f59f00" stroke-width="4"/>
    <path d="M100 30 q4 -14 12 -10" fill="none" stroke="#f59f00" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="100" cy="98" rx="26" ry="11" fill="#ff922b" stroke="${INK}" stroke-width="3"/>
    <path d="M76 98 H124" stroke="${INK}" stroke-width="2"/>
    ${eyes(100, 70, 18, m)}`,
};

/** SVG một con vật nông trại; `mood`: 'hungry' (vào xin ăn) | 'happy' (ăn xong). */
export function farmAnimalSvg(id, mood = 'hungry', title = '') {
  return `<svg class="fm-animal-svg" viewBox="0 0 200 200" role="img" aria-label="${title}">${(DRAW[id] ?? DRAW.cow)(mood)}</svg>`;
}
