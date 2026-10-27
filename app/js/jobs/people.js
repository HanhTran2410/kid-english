// Người đứng bên trái màn Đóng vai (SPEC-roles mục 9): cô bán hàng (Bán hàng), cô giáo (Cô giáo nhí), chú cảnh sát
// (Cảnh sát) — vẽ sẵn bằng SVG,
// bố mẹ thay được bằng ảnh riêng (Góc bố mẹ → Ảnh Đóng vai). Ảnh chỉ lưu trên máy (kho ảnh `jobs:people`, word = mã nghề),
// không đưa lên GitHub. Chú bác sĩ ở trang ảnh Bác sĩ nhí (doctor.js).

import { mediaBlob } from '../db.js';

export const JOB_PEOPLE_IMAGES = 'jobs:people';

const INK = '#3d2c5e';
const SKIN = '#f5c9a0';
const HAIR = '#4a2f23';

/** Cô (nửa người, viewBox 200 × 200): tóc dài, mặt cười; `clothes` là phần áo vẽ đè lên thân. */
function ladySvg(cls, clothes, extra = '') {
  return `<svg class="${cls}" viewBox="0 0 200 200" aria-hidden="true">
  <path d="M50 92 C44 36 156 36 150 92 L154 150 C132 136 68 136 46 150 Z" fill="${HAIR}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M26 200 C26 152 58 128 100 128 C142 128 174 152 174 200 Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  ${clothes}
  <rect x="88" y="106" width="24" height="26" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
  <circle cx="100" cy="80" r="40" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
  <path d="M60 78 C58 40 142 40 140 78 C128 64 116 58 104 62 C96 70 74 74 60 78 Z" fill="${HAIR}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="86" cy="84" r="5" fill="${INK}"/><circle cx="114" cy="84" r="5" fill="${INK}"/>
  <circle cx="87.5" cy="82.5" r="1.6" fill="#fff"/><circle cx="115.5" cy="82.5" r="1.6" fill="#fff"/>
  <path d="M80 76 l-6 -4 M120 76 l6 -4" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="76" cy="98" r="6" fill="#ffa8a8" opacity="0.75"/><circle cx="124" cy="98" r="6" fill="#ffa8a8" opacity="0.75"/>
  <path d="M88 101 Q100 112 112 101" fill="#e64980" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  ${extra}
</svg>`;
}

/** Cô bán hàng: áo vàng, tạp dề hồng có túi, bảng tên. */
export const SELLER_SVG = ladySvg('jb-seller', `
  <path d="M26 200 C26 152 58 128 100 128 C142 128 174 152 174 200 Z" fill="#ffd43b" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M66 140 H134 L140 200 H60 Z" fill="#ff8fab" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M74 140 C76 128 82 124 86 122 M126 140 C124 128 118 124 114 122" stroke="#e64980" stroke-width="4" fill="none" stroke-linecap="round"/>
  <rect x="84" y="166" width="32" height="20" rx="4" fill="#fff0f6" stroke="${INK}" stroke-width="2.5"/>
  <rect x="118" y="146" width="18" height="10" rx="2" fill="#fff" stroke="${INK}" stroke-width="2"/>`);

/** Cô giáo: áo len tím ngoài sơ mi trắng, kính tròn, cầm sách. */
export const TEACHER_SVG = ladySvg('jb-teacher', `
  <path d="M26 200 C26 152 58 128 100 128 C142 128 174 152 174 200 Z" fill="#9775fa" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M82 130 L100 160 L118 130 L112 200 H88 Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="100" cy="172" r="3" fill="${INK}"/><circle cx="100" cy="188" r="3" fill="${INK}"/>
  <rect x="124" y="160" width="34" height="26" rx="3" fill="#ff922b" stroke="${INK}" stroke-width="3" transform="rotate(-8 141 173)"/>`,
`<circle cx="86" cy="84" r="11" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="114" cy="84" r="11" fill="none" stroke="${INK}" stroke-width="3"/>
  <path d="M97 84 H103" stroke="${INK}" stroke-width="3"/>`);

/** Bạn học sinh (Cô giáo nhí — vai học trò kiêm lớp trưởng): đầu to, tóc ngắn, áo sơ mi trắng, khăn quàng đỏ. */
export const STUDENT_SVG = `<svg class="jb-student" viewBox="0 0 200 200" aria-hidden="true">
  <path d="M40 200 C40 160 66 140 100 140 C134 140 160 160 160 200 Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M100 150 V200" stroke="${INK}" stroke-width="2.5"/>
  <circle cx="100" cy="166" r="2.6" fill="${INK}"/><circle cx="100" cy="184" r="2.6" fill="${INK}"/>
  <rect x="90" y="122" width="20" height="22" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
  <path d="M74 142 L100 156 L126 142 L118 140 L100 150 L82 140 Z" fill="#e03131" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M100 152 L92 178 L100 172 L108 178 Z" fill="#e03131" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="56" cy="86" r="9" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
  <circle cx="144" cy="86" r="9" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
  <circle cx="100" cy="82" r="46" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
  <path d="M55 80 C50 30 150 30 145 80 C138 60 124 52 112 56 C104 48 84 50 76 60 C68 62 60 70 55 80 Z" fill="${HAIR}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="84" cy="88" r="6" fill="${INK}"/><circle cx="116" cy="88" r="6" fill="${INK}"/>
  <circle cx="86" cy="86" r="2" fill="#fff"/><circle cx="118" cy="86" r="2" fill="#fff"/>
  <circle cx="72" cy="104" r="7" fill="#ffa8a8" opacity="0.75"/><circle cx="128" cy="104" r="7" fill="#ffa8a8" opacity="0.75"/>
  <path d="M88 106 Q100 118 112 106" fill="#e64980" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** Chú cảnh sát (nửa người, viewBox 200 × 200): mũ kê-pi xanh đậm có sao vàng, áo xanh, phù hiệu, còi đeo cổ. */
export const POLICE_SVG = `<svg class="jb-police" viewBox="0 0 200 200" aria-hidden="true">
  <path d="M26 200 C26 152 58 128 100 128 C142 128 174 152 174 200 Z" fill="#364fc7" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M80 130 L100 152 L120 130 L114 128 L100 142 L86 128 Z" fill="#a5d8ff" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M100 152 V200" stroke="${INK}" stroke-width="2.5"/>
  <circle cx="100" cy="170" r="3" fill="#ffd43b" stroke="${INK}" stroke-width="1.5"/><circle cx="100" cy="188" r="3" fill="#ffd43b" stroke="${INK}" stroke-width="1.5"/>
  <path d="M128 158 l6 -4 l6 4 v8 q-6 6 -12 0 z" fill="#ffd43b" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <rect x="58" y="160" width="26" height="8" rx="2" fill="#fff" stroke="${INK}" stroke-width="2"/>
  <path d="M86 132 Q76 150 70 156" fill="none" stroke="#ffd43b" stroke-width="3"/>
  <rect x="62" y="152" width="14" height="8" rx="4" fill="#ced4da" stroke="${INK}" stroke-width="2"/>
  <rect x="88" y="106" width="24" height="26" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
  <circle cx="58" cy="84" r="9" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
  <circle cx="142" cy="84" r="9" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
  <circle cx="100" cy="82" r="42" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
  <path d="M60 70 C58 56 70 52 78 54 L122 54 C130 52 142 56 140 70 Z" fill="${HAIR}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M54 54 C54 22 146 22 146 54 Z" fill="#364fc7" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <rect x="54" y="50" width="92" height="12" rx="3" fill="#1c2a6b" stroke="${INK}" stroke-width="3"/>
  <path d="M60 62 Q100 78 140 62 Z" fill="#212529" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M100 30 l4 8 h9 l-7 6 l3 9 l-9 -5 l-9 5 l3 -9 l-7 -6 h9 z" fill="#ffd43b" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="86" cy="86" r="5" fill="${INK}"/><circle cx="114" cy="86" r="5" fill="${INK}"/>
  <circle cx="87.5" cy="84.5" r="1.6" fill="#fff"/><circle cx="115.5" cy="84.5" r="1.6" fill="#fff"/>
  <path d="M78 76 l10 -2 M122 76 l-10 -2" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  <circle cx="74" cy="100" r="6" fill="#ffa8a8" opacity="0.7"/><circle cx="126" cy="100" r="6" fill="#ffa8a8" opacity="0.7"/>
  <path d="M88 103 Q100 114 112 103" fill="#e64980" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const STYLE = [
  'Cute children\'s picture-book style, simple flat shapes, thick soft dark outlines, bright pastel colors.',
  'Pure flat white (#FFFFFF) background, no shadow, no scenery, no frame, no text, no logo.',
  'One person only, upper body (head to waist), facing the viewer, centered, filling most of the square image.',
].join(' ');

/** Người thay ảnh được: mã nghề, tên, hình vẽ sẵn, prompt nhờ AI vẽ. */
export const JOB_PEOPLE = [
  {
    id: 'shop', emoji: '🛒', vi: 'Cô bán hàng (trò Bán hàng)', svg: SELLER_SVG,
    prompt: `A friendly cartoon female shopkeeper for a children's game, smiling kindly, long dark hair, yellow shirt with a pink apron, waving one hand. ${STYLE}`,
  },
  {
    id: 'teacher', emoji: '👩‍🏫', vi: 'Cô giáo (trò Cô giáo nhí)', svg: TEACHER_SVG,
    prompt: `A friendly cartoon female teacher for a children's game, smiling kindly, long dark hair, round glasses, purple cardigan over a white blouse, holding a book. ${STYLE}`,
  },
  {
    id: 'student', emoji: '🧒', vi: 'Bạn học sinh (trò Cô giáo nhí)', svg: STUDENT_SVG,
    prompt: `A cute cartoon Vietnamese primary-school child for a children's game, smiling, short dark hair, white school shirt with a red scarf (khan quang do) tied at the neck. ${STYLE}`,
  },
  {
    id: 'police', emoji: '👮', vi: 'Chú cảnh sát (trò Cảnh sát)', svg: POLICE_SVG,
    prompt: `A friendly cartoon male police officer for a children's game, smiling kindly, short dark hair, navy blue police cap with a gold star, navy blue uniform with a gold badge and a whistle, giving a thumbs up. ${STYLE}`,
  },
];

/** Ảnh người bố mẹ đã thêm cho nghề `id` (URL, người gọi tự thu hồi), chưa có thì null. */
export async function loadPersonImage(app, id) {
  const rows = await app.db.getAllByIndex('images', 'lessonId', JOB_PEOPLE_IMAGES).catch(() => []);
  const img = rows.find((r) => r.word === id);
  return img ? URL.createObjectURL(mediaBlob(img)) : null;
}
