// Hành khách xe buýt (SPEC-jobs3 mục 7): 6 người nhà vẽ SVG (viewBox 160 × 200), mỗi người một dấu hiệu nhìn là biết
// (bà: búi tóc bạc + kính; ông: mũ nồi + ria; mẹ: tóc dài + túi xách; bố: cà vạt; chị: hai bím; em bé: xe đẩy + mũ len).
// Mặt theo cảm xúc (happy / sad / sleepy / hungry) chỉ đổi mắt, miệng, thêm "z" hoặc tay xoa bụng — một bộ vẽ cho mọi cảm xúc.
// Không dùng ảnh (người là đáp án theo dấu hiệu).

const INK = '#3d2c5e';
const SKIN = '#f5c9a0';
const BROWN = '#5c3d2e';
const GREY = '#ced4da';

/** Mắt + miệng theo cảm xúc, tâm mặt (cx, cy), bán kính r. */
function face(cx, cy, r, mood) {
  const ex = r * 0.38;
  const ey = cy - r * 0.05;
  const my = cy + r * 0.42;
  const eyes = mood === 'sleepy'
    ? `<path d="M${cx - ex - 6} ${ey} q6 5 12 0 M${cx + ex - 6} ${ey} q6 5 12 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
    : `<circle cx="${cx - ex}" cy="${ey}" r="4.5" fill="${INK}"/><circle cx="${cx + ex}" cy="${ey}" r="4.5" fill="${INK}"/><circle cx="${cx - ex + 1.5}" cy="${ey - 1.5}" r="1.4" fill="#fff"/><circle cx="${cx + ex + 1.5}" cy="${ey - 1.5}" r="1.4" fill="#fff"/>`;
  const brows = mood === 'sad' ? `<path d="M${cx - ex - 7} ${ey - 9} l12 -5 M${cx + ex + 7} ${ey - 9} l-12 -5" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` : '';
  const mouth = {
    happy: `<path d="M${cx - 10} ${my - 3} Q${cx} ${my + 8} ${cx + 10} ${my - 3}" fill="#e64980" stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`,
    sad: `<path d="M${cx - 9} ${my + 4} Q${cx} ${my - 5} ${cx + 9} ${my + 4}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    sleepy: `<ellipse cx="${cx}" cy="${my}" rx="4" ry="3" fill="${INK}"/>`,
    hungry: `<ellipse cx="${cx}" cy="${my}" rx="7" ry="8" fill="#e64980" stroke="${INK}" stroke-width="3"/>`,
  }[mood] ?? '';
  const cheeks = `<circle cx="${cx - r * 0.6}" cy="${cy + r * 0.25}" r="${r * 0.13}" fill="#ffa8a8" opacity="0.7"/><circle cx="${cx + r * 0.6}" cy="${cy + r * 0.25}" r="${r * 0.13}" fill="#ffa8a8" opacity="0.7"/>`;
  const z = mood === 'sleepy' ? `<text x="${cx + r * 0.75}" y="${cy - r * 0.7}" font-size="${r * 0.55}" font-weight="900" fill="#4dabf7" font-family="sans-serif">z</text><text x="${cx + r * 1.05}" y="${cy - r * 1.05}" font-size="${r * 0.4}" font-weight="900" fill="#4dabf7" font-family="sans-serif">z</text>` : '';
  return `${cheeks}${brows}${eyes}${mouth}${z}`;
}
/** Tay xoa bụng (hungry) tại (x, y). */
const tummyHand = (x, y, mood) => (mood === 'hungry' ? `<ellipse cx="${x}" cy="${y}" rx="13" ry="10" fill="${SKIN}" stroke="${INK}" stroke-width="3"/><path d="M${x - 22} ${y - 8} q8 -6 14 0" fill="none" stroke="#e64980" stroke-width="2.5" stroke-linecap="round"/>` : '');

/** Người lớn (thân + cổ + đầu) với tóc / đồ đội vẽ riêng. */
function adult({ shirt, hairBack = '', hairFront = '', top = '', clothes = '', glasses = false, extra = '', mood }) {
  const cx = 80;
  const cy = 74;
  const r = 36;
  return `${hairBack}
  <path d="M18 200 C18 150 46 128 80 128 C114 128 142 150 142 200 Z" fill="${shirt}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  ${clothes}
  <rect x="70" y="102" width="20" height="26" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
  ${hairFront}${top}
  ${face(cx, cy, r, mood)}
  ${glasses ? `<circle cx="${cx - 14}" cy="${cy - 2}" r="10" fill="none" stroke="${INK}" stroke-width="2.5"/><circle cx="${cx + 14}" cy="${cy - 2}" r="10" fill="none" stroke="${INK}" stroke-width="2.5"/><path d="M${cx - 4} ${cy - 2} h8" stroke="${INK}" stroke-width="2.5"/>` : ''}
  ${extra}${tummyHand(80, 168, mood)}`;
}

const DRAW = {
  grandma: (mood) => adult({
    mood, shirt: '#9775fa', glasses: true,
    hairFront: `<path d="M44 72 C40 34 120 34 116 72 C108 56 96 50 80 50 C64 50 52 56 44 72 Z" fill="${GREY}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
    top: `<circle cx="80" cy="30" r="15" fill="${GREY}" stroke="${INK}" stroke-width="3"/>`,
    clothes: '<circle cx="80" cy="160" r="3" fill="#fff"/><circle cx="80" cy="178" r="3" fill="#fff"/>',
  }),
  grandpa: (mood) => adult({
    mood, shirt: '#74b816', glasses: true,
    hairFront: `<path d="M44 80 C42 66 46 58 52 56 M116 80 C118 66 114 58 108 56" fill="none" stroke="${GREY}" stroke-width="8" stroke-linecap="round"/>`,
    top: `<path d="M44 52 C44 26 116 26 116 52 Z" fill="#c92a2a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="80" cy="24" r="4" fill="#c92a2a" stroke="${INK}" stroke-width="2"/>`,
    extra: `<path d="M64 92 Q72 84 80 90 Q88 84 96 92 Q88 96 80 93 Q72 96 64 92 Z" fill="${GREY}" stroke="${INK}" stroke-width="2"/>`,
  }),
  mummy: (mood) => adult({
    mood, shirt: '#f783ac',
    hairBack: `<path d="M38 76 C34 30 126 30 122 76 L126 140 C108 128 52 128 34 140 Z" fill="${BROWN}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
    hairFront: `<path d="M44 72 C40 36 120 36 116 72 C104 58 92 52 80 54 C70 62 56 66 44 72 Z" fill="${BROWN}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
    extra: `<path d="M120 150 q12 -18 22 0" fill="none" stroke="${INK}" stroke-width="3"/><rect x="114" y="150" width="34" height="28" rx="6" fill="#ffd43b" stroke="${INK}" stroke-width="3"/>`,
  }),
  daddy: (mood) => adult({
    mood, shirt: '#4dabf7',
    hairFront: `<path d="M44 70 C40 38 120 38 116 70 C106 56 94 52 80 52 C66 52 54 56 44 70 Z" fill="#212529" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
    clothes: `<path d="M66 130 L80 146 L94 130" fill="none" stroke="${INK}" stroke-width="3"/><path d="M80 146 L72 156 L80 196 L88 156 Z" fill="#e03131" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`,
  }),
  /** Chị (trẻ con ~2/3 người lớn): tóc hai bím, váy vàng. */
  sister: (mood) => `<g transform="translate(80 200) scale(0.74) translate(-80 -200)">${adult({
    mood, shirt: '#ffd43b',
    hairFront: `<path d="M44 72 C40 36 120 36 116 72 C106 58 92 52 80 54 C68 52 54 58 44 72 Z" fill="${BROWN}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
    top: `<path d="M44 70 C24 72 22 100 30 116 C40 104 46 90 46 78 Z M116 70 C136 72 138 100 130 116 C120 104 114 90 114 78 Z" fill="${BROWN}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="34" cy="70" r="6" fill="#ff6b6b"/><circle cx="126" cy="70" r="6" fill="#ff6b6b"/>`,
    clothes: `<path d="M40 170 H120" stroke="#fab005" stroke-width="5"/>`,
  })}</g>`,
  /** Em bé trong xe đẩy, mũ len. */
  baby: (mood) => `
  <path d="M20 112 H140 Q140 168 80 172 Q20 168 20 112 Z" fill="#74c0fc" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M20 112 Q24 52 84 52 L84 112 Z" fill="#4dabf7" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M140 112 L156 84" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
  <circle cx="44" cy="184" r="12" fill="#495057" stroke="${INK}" stroke-width="3"/><circle cx="116" cy="184" r="12" fill="#495057" stroke="${INK}" stroke-width="3"/>
  <circle cx="104" cy="98" r="26" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
  <path d="M78 92 C78 62 130 62 130 92 Z" fill="#ff8787" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="104" cy="64" r="7" fill="#fff" stroke="${INK}" stroke-width="2"/>
  ${face(104, 102, 22, mood)}`,
};

/** SVG một người nhà (`member`) với cảm xúc `mood`. */
export function familySvg(member, mood = 'happy', title = '') {
  return `<svg class="bs-person-svg" viewBox="0 0 160 200" role="img" aria-label="${title}">${(DRAW[member] ?? DRAW.daddy)(mood)}</svg>`;
}
