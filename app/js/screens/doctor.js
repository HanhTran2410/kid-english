// Trò Bác sĩ nhí (SPEC-doctor.md): bạn thú vào phòng khám kêu đau, Bông y tá hướng dẫn. Mỗi ca làm lần lượt các bước
// của ca (chạm chỗ đau → khám → chữa, theo mức) rồi khỏe lại, cảm ơn, ra về. 3 ca → Hoan hô + sticker.
// SPEC-jobs4 mục 6 (DR4): đầu một ca bệnh mỗi lượt, bạn thú đang sợ / buồn / buồn ngủ / đói — bé dỗ bằng đồ hợp
// (mức 3 chọn thẻ mặt cảm xúc trước) rồi ca bệnh chạy như cũ.
// Trạng thái (mục 8): wash (đầu lượt, SPEC-doctor2) → enter → [feel →] comfort (DR4) → touch / check / treat ⇄ busy → healed → sticker → leave → ca sau | done.
// Nhận một thao tác đúng = chuyển bước NGAY (ghi tiến độ, lưu để chơi tiếp); hoạt ảnh + câu nói chỉ để trình diễn.
// Phần chung với các nghề khác (nói, nhắc, khay, đồ bay, lượt, ra nền) ở jobs/kit.js (SPEC-jobs mục 2.3).

import { h } from '../ui.js';
import { mediaBlob, listLessons, latestImageForWord } from '../db.js';
import { isWordLesson } from '../phrase.js';
import { progressKey } from '../progress.js';
import { play } from '../speech/sfx.js';
import { markPracticed } from '../player/track.js';
import { numberKey } from '../numbers.js';
import { scaled } from '../timing.js';
import { patientSvg, faceSvg, glowSvg } from '../patients.js';
import { SOUND_BY_ID } from '../animal-sounds.js';
import { playSoundFile } from './animal-sounds.js';
import {
  jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, reduceMotion, WRONG_LOCK_MS, MAX_NUDGES,
} from '../jobs/kit.js';
import {
  CASE_BY_ID, PATIENT_BY_ID, ITEM_BY_ID, REGIONS, regionAt, regionPoint, stepsFor, trayFor,
  cleanDoctorState, afterDoctorRound, afterHealed, stepPrompt, wrongItemLine, doneLine, betterLine,
  DOCTOR_ITEM_IMAGES, DOCTOR_BG_IMAGES, BG_KEY, DOCTOR_KEY, COME_IN_LINE, HELLO_DOCTOR_LINE, GOOD_JOB_LINE, BYE_LINE, yesTouchLine, wrongTouchLine,
  WASH_BY, washFor, nextWash, WASH_START_LINE, WASH_DONE_LINE, washFirstLine, WASH_IMAGES, WASH_FRAMES, washFrame,
  STICKER_COLORS, planSticker, stickerId, matchesSticker, STICKER_ASK_LINE, stickerWantLine, stickerLoveLine, stickerWrongLine,
  planDoctorRound, CHECKUP_HELLO_LINE, MEASURE_LINE, FROM_BOTTOM_LINE, GROWING_LINE, HOW_MANY_BLOCKS_LINE, TALLER_Q_LINE,
  blockCountLine, tallLine, rightBlocksLine, wrongBlocksLine, tallerLine, wrongTallerLine,
  EYES_HELLO_LINE, COVER_LINE, GLASSES_ITEM, SEE_BETTER_LINE, pointLine, seeLine, wrongEyeLine, needGlassesLine,
  HOW_HELP_LINE, FEELING_BY_ID, COMFORT_BY_ID, comfortItemId, feelLine, helpLine, HAPPY_NOW_LINE, feelQLine, feelIsLine, wrongCardLine, wrongComfortLine,
} from '../doctor.js';

const JOB = 'doctor';
const USE_MS = 1100; // hoạt ảnh dùng đồ (chải răng, hỉ mũi…), không quá 2 giây
const SAY_AAH_MS = 2000; // "Open wide! Say aah!": chờ bé nói theo
const ENTER_MS = 650;
const LEAVE_MS = 600;
const STEP_STATES = ['touch', 'check', 'treat'];
/** Bước chờ bé thao tác (nhắc 10 giây, khay sáng): bước khám chữa + rửa tay + tặng sticker (SPEC-doctor2). */
/** Ca đo chiều cao (SPEC-doctor2 DR2): đếm khối, chọn số (mức 2), ai cao hơn (mức 3). */
const MEASURE_STATES = ['measure', 'howmany', 'taller', 'point', 'glasses']; // + khám mắt (DR3)
const COMFORT_STATES = ['feel', 'comfort']; // Dỗ bạn thú (DR4)
const ACTIVE = [...STEP_STATES, 'wash', 'sticker', ...MEASURE_STATES, ...COMFORT_STATES];
const WASH_MS = 700; // hoạt ảnh rửa tay, không chặn thao tác tiếp
const INK = '#3d2c5e';
const COLOR_HEX = new Map(STICKER_COLORS.map((c) => [c.id, c.hex]));

/** Hình sticker (SVG) theo hình + màu; `size` = cỡ cố định (dán lên bạn thú), 0 = co theo khung (khay). */
function stickerShape(st, size = 0) {
  const fill = COLOR_HEX.get(st.color);
  const body = {
    star: `<path d="M20 3 L25 15 L38 15 L27.5 23 L31.5 36 L20 28 L8.5 36 L12.5 23 L2 15 L15 15 Z" fill="${fill}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`,
    heart: `<path d="M20 35 C8 26 3 19 3 12.5 C3 7 7.5 3.5 12 3.5 C15.5 3.5 18.5 5.5 20 9 C21.5 5.5 24.5 3.5 28 3.5 C32.5 3.5 37 7 37 12.5 C37 19 32 26 20 35 Z" fill="${fill}" stroke="${INK}" stroke-width="2.5"/>`,
    circle: `<circle cx="20" cy="20" r="16" fill="${fill}" stroke="${INK}" stroke-width="2.5"/>`,
    square: `<rect x="5" y="5" width="30" height="30" rx="5" fill="${fill}" stroke="${INK}" stroke-width="2.5"/>`,
  }[st.shape];
  return `<svg viewBox="0 0 40 40"${size ? ` width="${size}" height="${size}"` : ''}>${body}</svg>`;
}
/** Khăn (không có emoji khăn): khăn gấp sọc. */
const TOWEL_SVG = `<svg viewBox="0 0 40 40"><rect x="6" y="8" width="28" height="26" rx="4" fill="#a5d8ff" stroke="${INK}" stroke-width="2.5"/><path d="M6 15 H34 M6 27 H34" stroke="#fff" stroke-width="3"/></svg>`;
/** Bồn rửa tay + hai bàn tay: lớp bọt / nước / khô / găng bật theo món đã dùng. */
/** Bàn tay (ngón cái bên trái, lòng bàn tay hướng ra): ngón dài ngắn tự nhiên, cổ tay. Vẽ 2 lớp — lớp viền rồi lớp màu
 *  đè lên — để viền chỉ còn ở mép ngoài và khe ngón (trông liền một bàn tay, không như ghép khối). */
const HAND_SHAPES = `<rect x="12" y="20" width="11" height="44" rx="5.5"/><rect x="24.5" y="10" width="11" height="52" rx="5.5"/>
  <rect x="37" y="16" width="11" height="46" rx="5.5"/><rect x="49.5" y="30" width="10" height="34" rx="5"/>
  <rect x="11" y="50" width="49" height="46" rx="18"/><rect x="-3" y="56" width="13" height="36" rx="6.5" transform="rotate(-20 3 74)"/>
  <rect x="17" y="88" width="36" height="24" rx="8"/>`;
const HAND = `<g class="dr-skin" stroke="${INK}" stroke-width="5" stroke-linejoin="round">${HAND_SHAPES}</g>
  <g class="dr-skin">${HAND_SHAPES}</g>
  <ellipse cx="35" cy="74" rx="14" ry="11" fill="#fff" opacity="0.28"/>
  <rect x="13" y="104" width="44" height="22" rx="6" fill="#fff" stroke="${INK}" stroke-width="3"/>`;
const DOT = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const SPARK = (x, y, k = 1) => `<path transform="translate(${x} ${y}) scale(${k})" d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3 Z"/>`;
/** Bồn rửa + đôi tay; các lớp bẩn / bọt / nước / lấp lánh / ngón cái bật theo hình đang hiện (class f-…). */
const WASH_SVG = `<svg class="dr-wash-svg" viewBox="0 0 300 240" aria-hidden="true">
  <rect x="128" y="4" width="44" height="12" rx="6" fill="#ced4da" stroke="${INK}" stroke-width="3"/>
  <rect x="164" y="0" width="26" height="8" rx="4" fill="#ced4da" stroke="${INK}" stroke-width="2.5"/>
  <path d="M143 14 V30 Q143 46 150 46 Q157 46 157 30 V14 Z" fill="#ced4da" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <g class="dr-water"><rect class="dr-stream" x="145.5" y="46" width="9" height="150" rx="4.5" fill="#74c0fc"/>
    <g fill="#a5d8ff">${DOT(138, 196, 4)}${DOT(162, 194, 3.5)}${DOT(130, 188, 3)}${DOT(170, 186, 3)}</g></g>
  <g class="dr-hands">
    <g transform="translate(130 62) scale(-1 1)">${HAND}</g>
    <g transform="translate(170 62)">${HAND}</g>
  </g>
  <g class="dr-dirt" fill="#a0785a">${DOT(96, 132, 5)}${DOT(110, 112, 4)}${DOT(86, 150, 4.5)}${DOT(102, 92, 3.5)}${DOT(190, 128, 5)}${DOT(204, 150, 4)}${DOT(216, 114, 4.5)}${DOT(198, 96, 3.5)}</g>
  <g class="dr-foam" fill="#fff" stroke="#a5d8ff" stroke-width="2">
    ${DOT(88, 120, 13)}${DOT(104, 136, 12)}${DOT(112, 112, 10)}${DOT(84, 146, 10)}${DOT(98, 94, 9)}
    ${DOT(212, 120, 13)}${DOT(196, 136, 12)}${DOT(188, 112, 10)}${DOT(216, 146, 10)}${DOT(202, 94, 9)}
    ${DOT(132, 72, 6)}${DOT(168, 66, 5)}${DOT(150, 84, 7)}
  </g>
  <g class="dr-shine" fill="#ffd43b" stroke="#f59f00" stroke-width="1.5">${SPARK(72, 82)}${SPARK(228, 88)}${SPARK(150, 78, 0.8)}${SPARK(98, 176, 0.7)}${SPARK(204, 172, 0.7)}</g>
  <text class="dr-thumb" x="256" y="70" text-anchor="middle" font-size="40">👍</text>
  <rect x="36" y="196" width="228" height="12" rx="6" fill="#f8f9fa" stroke="${INK}" stroke-width="3"/>
  <path d="M44 208 H256 Q250 236 150 236 Q50 236 44 208 Z" fill="#e9ecef" stroke="${INK}" stroke-width="3"/>
  <ellipse cx="150" cy="222" rx="10" ry="3.5" fill="#adb5bd"/>
</svg>`;
/** Đồ bay tới vùng nào; null = chỗ đau của ca (vùng của bước chạm). */
const ITEM_TARGET = {
  bandage: null, medicine: 'mouth', tissue: 'nose', toothbrush: 'mouth', drops: 'eye', icepack: 'head', water: 'mouth',
  blanket: 'tummy', stethoscope: 'tummy', thermometer: 'hand', flashlight: null, sponge: 'foot',
};
const ITEM_SOUND = { sponge: 'whoosh', bandage: 'pop', medicine: 'chomp', tissue: 'honk', toothbrush: 'brush', stethoscope: 'ding', thermometer: 'ding', drops: 'pop', icepack: 'pop', water: 'chomp', blanket: 'sparkle' };
/** Dỗ bạn thú (DR4): mặt theo cảm xúc, chỗ đồ giúp bay tới, hình đồ giúp (vẽ SVG, khác dáng hẳn nhau). */
const FEEL_MOOD = { scared: 'scared', sad: 'teary', sleepy: 'drowsy', hungry: 'hungry' };
const COMFORT_TARGET = { teddy: 'tummy', hug: 'tummy', pillow: 'head', apple: 'mouth' };
const COMFORT_SVG = {
  teddy: `<svg viewBox="0 0 40 40"><circle cx="11" cy="9" r="5" fill="#c08552" stroke="${INK}" stroke-width="2"/><circle cx="29" cy="9" r="5" fill="#c08552" stroke="${INK}" stroke-width="2"/>
    <ellipse cx="20" cy="30" rx="11" ry="9" fill="#c08552" stroke="${INK}" stroke-width="2"/><circle cx="20" cy="15" r="10" fill="#c08552" stroke="${INK}" stroke-width="2"/>
    <ellipse cx="20" cy="18" rx="4.5" ry="3.5" fill="#f3d9b1"/><circle cx="16" cy="13" r="1.6" fill="${INK}"/><circle cx="24" cy="13" r="1.6" fill="${INK}"/><circle cx="20" cy="17" r="1.4" fill="${INK}"/>
    <ellipse cx="20" cy="31" rx="5" ry="4.5" fill="#f3d9b1"/></svg>`,
  hug: `<svg viewBox="0 0 40 40"><path d="M20 35 C10 28 5 22 5 16 C5 12 8 9.5 11.5 9.5 C14.5 9.5 18 11.5 20 14 C22 11.5 25.5 9.5 28.5 9.5 C32 9.5 35 12 35 16 C35 22 30 28 20 35 Z" fill="#ff8fab" stroke="${INK}" stroke-width="2"/>
    <path d="M3 24 Q8 34 18 31 M37 24 Q32 34 22 31" fill="none" stroke="#f5c9a0" stroke-width="6" stroke-linecap="round"/>
    <path d="M3 24 Q8 34 18 31 M37 24 Q32 34 22 31" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/></svg>`,
  pillow: `<svg viewBox="0 0 40 40"><path d="M5 12 Q20 6 35 12 Q38 20 35 28 Q20 34 5 28 Q2 20 5 12 Z" fill="#e7f5ff" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M10 15 Q20 12 30 15 M10 25 Q20 28 30 25" fill="none" stroke="#a5d8ff" stroke-width="2"/><circle cx="20" cy="20" r="2.4" fill="#74c0fc"/></svg>`,
  apple: `<svg viewBox="0 0 40 40"><path d="M20 12 C14 8 6 10 6 20 C6 30 13 36 20 33 C27 36 34 30 34 20 C34 10 26 8 20 12 Z" fill="#fa5252" stroke="${INK}" stroke-width="2"/>
    <path d="M20 12 Q20 7 23 4" fill="none" stroke="#8d5524" stroke-width="2.5" stroke-linecap="round"/><path d="M22 8 Q28 3 32 7 Q27 11 22 8 Z" fill="#69db7c" stroke="${INK}" stroke-width="1.5"/>
    <ellipse cx="13" cy="18" rx="2.5" ry="4" fill="#fff" opacity="0.5"/></svg>`,
};
const BUG_MS = 1200; // bọ rùa bay ra khỏi tai (ca tai)
const REST_MS = 2000; // ca buồn ngủ: zZz 2 giây

/** Ảnh bố mẹ thêm (SPEC mục 10): ảnh từng đồ (theo mã đồ) và ảnh nền phòng khám. */
export async function loadDoctorImages(app) {
  const urls = [];
  const item = new Map();
  let bg = null;
  let doctor = null; // ảnh chú bác sĩ bố mẹ thêm (SPEC-roles mục 9)
  const wash = new Map(); // ảnh lưới rửa tay (SPEC-art ART1)
  for (const [lessonId, kind] of [[DOCTOR_ITEM_IMAGES, 'item'], [DOCTOR_BG_IMAGES, 'bg'], [WASH_IMAGES, 'wash']]) {
    for (const img of await app.db.getAllByIndex('images', 'lessonId', lessonId).catch(() => [])) {
      const url = URL.createObjectURL(mediaBlob(img));
      urls.push(url);
      if (kind === 'item') item.set(img.word, url);
      else if (kind === 'wash') wash.set(img.word, url);
      else if (img.word === BG_KEY) bg = url;
      else if (img.word === DOCTOR_KEY) doctor = url;
    }
  }
  return { item, bg, doctor, wash, revoke: () => urls.forEach((u) => URL.revokeObjectURL(u)) };
}

/**
 * Chú bác sĩ vẽ sẵn (viewBox 200 × 200, nửa người): áo blouse trắng, áo trong xanh, ống nghe, túi áo có bút.
 * Đứng bên trái màn chơi thay Bông (SPEC-roles mục 9); bố mẹ thay được bằng ảnh riêng (Góc bố mẹ → Ảnh Bác sĩ nhí).
 */
export const DOCTOR_SVG = `<svg class="dr-doctor" viewBox="0 0 200 200" aria-hidden="true">
  <path d="M26 200 C26 152 58 128 100 128 C142 128 174 152 174 200 Z" fill="#fff" stroke="#3d2c5e" stroke-width="4" stroke-linejoin="round"/>
  <path d="M80 130 L100 168 L120 130 Z" fill="#74c0fc" stroke="#3d2c5e" stroke-width="3" stroke-linejoin="round"/>
  <path d="M80 130 L92 200 M120 130 L108 200" stroke="#3d2c5e" stroke-width="3" fill="none"/>
  <rect x="128" y="160" width="22" height="18" rx="3" fill="#fff" stroke="#3d2c5e" stroke-width="2.5"/>
  <path d="M134 166 V152" stroke="#e03131" stroke-width="4" stroke-linecap="round"/>
  <path d="M50 160 h14 M57 153 v14" stroke="#e03131" stroke-width="4" stroke-linecap="round"/>
  <rect x="88" y="106" width="24" height="26" fill="#f5c9a0" stroke="#3d2c5e" stroke-width="3"/>
  <circle cx="60" cy="84" r="9" fill="#f5c9a0" stroke="#3d2c5e" stroke-width="3"/>
  <circle cx="140" cy="84" r="9" fill="#f5c9a0" stroke="#3d2c5e" stroke-width="3"/>
  <circle cx="100" cy="80" r="40" fill="#f5c9a0" stroke="#3d2c5e" stroke-width="3"/>
  <path d="M60 80 C56 36 144 36 140 80 C134 62 116 56 100 60 C84 56 66 62 60 80 Z" fill="#3d2c22" stroke="#3d2c5e" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="86" cy="84" r="5" fill="#3d2c5e"/><circle cx="114" cy="84" r="5" fill="#3d2c5e"/>
  <circle cx="87.5" cy="82.5" r="1.6" fill="#fff"/><circle cx="115.5" cy="82.5" r="1.6" fill="#fff"/>
  <circle cx="76" cy="98" r="6" fill="#ffa8a8" opacity="0.7"/><circle cx="124" cy="98" r="6" fill="#ffa8a8" opacity="0.7"/>
  <path d="M88 101 Q100 112 112 101" fill="none" stroke="#3d2c5e" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M78 134 C68 166 84 184 100 182 C116 184 132 166 122 134" fill="none" stroke="#495057" stroke-width="5" stroke-linecap="round"/>
  <circle cx="100" cy="184" r="8" fill="#ced4da" stroke="#3d2c5e" stroke-width="3"/>
</svg>`;

/** Hình một đồ: ảnh bố mẹ thêm, chưa có / hỏng thì emoji. */
export function itemFace(item, images, cls = 'dr-item-face') {
  const emoji = () => h(`span.${cls}`, { text: item.emoji, 'aria-hidden': 'true' });
  const url = images?.item.get(item.id);
  if (!url) return emoji();
  const img = h(`img.${cls}.dr-item-img`, { src: url, alt: '', draggable: false });
  img.addEventListener('error', () => img.replaceWith(emoji()), { once: true });
  return img;
}

export function doctorScreen(app, params = {}) {
  let progress = cleanDoctorState(app.settings.doctorGame);
  const level = progress.level; // đổi mức giữa lượt: áp dụng từ lượt sau
  let cases = [];
  let caseIdx = 0;
  let stepIdx = 0;
  let wrongs = 0;
  let nudges = 0;
  let state = 'start';
  let tray = [];
  let lastWrong = { key: '', at: 0 };
  let images = null;
  // Tiến độ đã ghi trong lượt này ('body:ca', 'seen:ca'): ra nền / 🧹 khám lại không ghi lần hai.
  let recorded = new Set();
  let washed = []; // món rửa tay đã dùng (đầu lượt)
  let washDone = false;
  let mWho = 0; // ca đo: bạn thứ mấy đang được đo (mức 3 có hai bạn)
  let mCount = 0; // số khối đã đếm của bạn đang đo
  let eIdx = 0; // ca khám mắt: câu chỉ hình thứ mấy

  const curCase = () => CASE_BY_ID.get(cases[caseIdx]?.id);
  const curPatient = () => PATIENT_BY_ID.get(cases[caseIdx]?.patient);
  const steps = () => stepsFor(curCase(), level);
  const curStep = () => steps()[stepIdx];
  const P = (line) => ({ who: 'patient', line });
  /** Triệu chứng; bạn thú nông trại kêu trước: "Moo! My foot hurts!" (SPEC-jobs6 mục 4). */
  const sayLine = () => {
    const s = curCase().say;
    const cry = curPatient()?.cry;
    return cry ? [`${cry} ${s[0]}`, s[1]] : s;
  };
  const B = (line) => ({ who: 'bong', line });
  const patientEl = h('div.dr-patient');
  const washPhoto = h('div.dr-wash-photo');
  const washFx = h('div.dr-fx', { 'aria-hidden': 'true' });
  const washEl = h('div.dr-wash', { hidden: true }, h('div.dr-wash-art', { html: WASH_SVG }), washPhoto, washFx);
  const measureEl = h('div.dr-measure', { hidden: true });
  const eyesEl = h('div.dr-eyes', { hidden: true });
  const isCheckup = () => cases[caseIdx]?.id === 'checkup';
  const isEyes = () => cases[caseIdx]?.id === 'eyes';
  const eyeUrls = [];
  const sticker = () => {
    const c = cases[caseIdx];
    if (c && !c.sticker) c.sticker = planSticker(level); // bản lưu cũ chưa có bộ sticker
    return c?.sticker;
  };
  const stickerById = (id) => sticker()?.set.find((st) => stickerId(st) === id);

  const kit = jobScreen(app, {
    job: JOB, className: 'dr-play', stageClass: 'dr-stage', title: '🩺 Doctor', helperLabel: 'Bông y tá', cap: 'nurse',
    resetLabel: 'Khám lại', trayLabel: 'Đồ của bác sĩ',
    // Câu của Bông do chú bác sĩ bên trái nói (SPEC-roles mục 9): phụ đề hiện 👨‍⚕️.
    icon: (who) => (who === 'patient' ? curPatient()?.emoji ?? '' : who === 'patient2' ? PATIENT_BY_ID.get(cases[caseIdx]?.patient2)?.emoji ?? '' : '👨‍⚕️'),
    pitch: (who) => (who === 'patient' ? curPatient()?.pitch : who === 'patient2' ? PATIENT_BY_ID.get(cases[caseIdx]?.patient2)?.pitch : undefined),
    // SPEC-roles: Bông bác sĩ đứng bên trái, bệnh nhân ở giữa / bên phải; ai nói người đó sáng.
    host: { svg: DOCTOR_SVG, label: 'doctor' },
    roles: {
      of: (who) => (who === 'bong' ? kit.host
        : who === 'patient' ? [patientEl, measureEl.querySelector('.dr-measure-pet[data-who="0"]'), eyesEl.querySelector('.dr-eyes-pet')]
          : who === 'patient2' ? measureEl.querySelector('.dr-measure-pet[data-who="1"]') : null),
      all: () => [kit.host, patientEl, ...measureEl.querySelectorAll('.dr-measure-pet'), eyesEl.querySelector('.dr-eyes-pet')].filter(Boolean),
      dim: (el) => el === kit.host, // bệnh nhân luôn là chỗ bé chạm khám: không làm mờ
    },
    onTalk: (who) => patientEl.classList.toggle('talking', who === 'patient'),
    onReset: () => restart(),
    onHelper: () => repeatPrompt(),
    nudge: {
      ready: () => ACTIVE.includes(state) && nudges < MAX_NUDGES,
      key: () => stepKey(),
      fire: (rearm) => {
        nudges += 1;
        snap();
        if (state === 'wash' || state === 'sticker') {
          restartAnim(kit.trayItem(wantedItem()), 'nudge');
          kit.talk(promptLines()).then(rearm);
          return;
        }
        if (COMFORT_STATES.includes(state)) {
          nudgeComfort();
          kit.talk(comfortPrompt()).then(rearm);
          return;
        }
        if (MEASURE_STATES.includes(state)) {
          nudgeMeasure();
          kit.talk(measurePrompt()).then(rearm);
          return;
        }
        const step = curStep();
        if (step.type === 'touch') setGlow(step.target);
        else restartAnim(kit.trayItem(step.item), 'nudge');
        const { who, line } = stepPrompt(step, level);
        kit.talk([{ who, line }]).then(rearm);
      },
    },
    tray: {
      face: (id) => trayFace(id),
      label: (id) => (id.startsWith('c-') ? COMFORT_BY_ID.get(id.slice(2)).id : id === 'glasses' ? 'glasses' : WASH_BY.has(id) ? WASH_BY.get(id).name : stickerById(id) ? `${stickerById(id).color} ${stickerById(id).shape}` : id.startsWith('n-') ? id.slice(2) : ITEM_BY_ID.get(id).name),
      canGive: () => ACTIVE.includes(state),
      // Rửa tay / tặng sticker: thả ở đâu cũng được (đồ tự tới tay / tự dán lên bạn thú).
      dropOk: (x, y) => ['wash', 'sticker', 'howmany', 'glasses', 'comfort'].includes(state) || Boolean(regionAtScreen(x, y)),
      give: (id, from) => (state === 'wash' ? useWash(id, from) : state === 'comfort' ? giveComfort(id, from) : state === 'sticker' ? giveSticker(id, from) : state === 'howmany' ? pickBlocks(id)
        : state === 'glasses' ? giveGlasses(id, from) : give(id, from)),
    },
  });
  const { stage, count, talk } = kit;
  count.classList.add('dr-count');
  kit.sayBox.classList.add('dr-say');
  kit.trayEl.classList.add('dr-tray');
  const bed = h('div.dr-bed', { 'aria-hidden': 'true' });
  const feelsEl = h('div.dr-feels', { hidden: true }); // DR4 mức 3: 3 thẻ mặt cảm xúc
  stage.append(bed, patientEl, washEl, measureEl, eyesEl, feelsEl);
  const stepKey = () => `${kit.epoch}:${caseIdx}:${stepIdx}:${washed.length}:${mWho}:${mCount}:${eIdx}:${state}`;
  /** Hình trong khay: đồ rửa tay (emoji / khăn vẽ), sticker (SVG), đồ khám chữa (ảnh bố mẹ thêm hoặc emoji). */
  function trayFace(id) {
    if (WASH_BY.has(id)) {
      return id === 'towel' ? h('span.dr-item-face.dr-svg-face', { 'aria-hidden': 'true', html: TOWEL_SVG }) : h('span.dr-item-face', { text: WASH_BY.get(id).emoji, 'aria-hidden': 'true' });
    }
    const st = stickerById(id);
    if (st) return h('span.dr-item-face.dr-svg-face', { 'aria-hidden': 'true', html: stickerShape(st) });
    if (id.startsWith('n-')) return h('span.dr-item-face.dr-num-face', { 'aria-hidden': 'true', text: id.slice(2) });
    if (id === 'glasses') return h('span.dr-item-face', { 'aria-hidden': 'true', text: GLASSES_ITEM.emoji });
    if (id.startsWith('c-')) return h('span.dr-item-face.dr-svg-face', { 'aria-hidden': 'true', html: COMFORT_SVG[id.slice(2)] });
    return itemFace(ITEM_BY_ID.get(id), images);
  }
  /** Món cần đưa (để nhắc / nhún): món rửa tay tiếp theo, sticker khớp yêu cầu. */
  function wantedItem() {
    if (state === 'wash') return nextWash(level, washed) ?? washFor(level).find((id) => !washed.includes(id));
    const s = sticker();
    return stickerId(s.set.find((st) => matchesSticker(st, s.want)));
  }
  /** Câu của bước rửa tay / sticker (nhắc, chạm Bông). */
  function promptLines() {
    if (state === 'wash') {
      const want = nextWash(level, washed);
      return want ? [B(washFirstLine(want))] : [B(WASH_START_LINE)];
    }
    const s = sticker();
    return [P(STICKER_ASK_LINE), ...(s.want ? [P(stickerWantLine(s.want))] : [])];
  }

  // ---------- Vẽ ----------
  const group = (cls) => patientEl.querySelector(`.${cls}`);
  function renderPatient() {
    const c = curCase();
    const p = curPatient();
    patientEl.innerHTML = patientSvg(p.id, { mood: !c ? 'happy' : c.face === 'sleepy' ? 'sleepy' : 'sad', sign: c?.sign ?? null, title: p.name });
    patientEl.dataset.patient = p.id;
    patientEl.dataset.case = cases[caseIdx].id;
    patientEl.classList.remove('upset');
    delete patientEl.dataset.feel;
    count.textContent = `${caseIdx + 1}/${cases.length}`;
  }
  const setMood = (mood) => {
    const g = group('dr-face');
    if (g) g.innerHTML = faceSvg(mood);
  };
  /** Viền sáng chỗ đau: 'dr-glow' nhấp nháy (gợi ý), 'dr-picked' sáng nhẹ (chạm đúng). */
  const setGlow = (region, cls = 'dr-glow') => {
    const g = group('dr-glows');
    if (g) g.innerHTML = region ? glowSvg(region, cls) : '';
  };
  const renderTray = () => kit.renderTray(tray);
  function setState(s) {
    state = s;
    kit.setState(s, ACTIVE.includes(s));
  }

  // ---------- Tọa độ: màn hình ⇄ viewBox của bạn thú ----------
  const svgEl = () => patientEl.querySelector('svg');
  function toView(x, y) {
    const m = svgEl()?.getScreenCTM();
    return m ? new DOMPoint(x, y).matrixTransform(m.inverse()) : null;
  }
  function toScreen(x, y) {
    const m = svgEl()?.getScreenCTM();
    if (!m) return center(patientEl.getBoundingClientRect());
    const p = new DOMPoint(x, y).matrixTransform(m);
    return { x: p.x, y: p.y };
  }
  const regionAtScreen = (x, y) => {
    const p = toView(x, y);
    return p ? regionAt(p.x, p.y) : null;
  };
  /** Vùng đồ bay tới: theo đồ, không thì chỗ đau của ca. */
  const targetOf = (id) => ITEM_TARGET[id] ?? curCase().steps.find((s) => s.type === 'touch')?.target ?? 'tummy';

  // ---------- Lưu để chơi tiếp, tiến độ ----------
  const snap = () => saveSnap(JOB, { level, cases, caseIdx, stepIdx, wrongs, nudges, tray, recorded: [...recorded], washed: [...washed], washDone, mWho, mCount, eIdx, phase: state });
  const saveProgress = () => app.setSetting('doctorGame', progress).catch(() => {});

  /**
   * Nhận một thao tác đúng: sang bước sau NGAY (một lần duy nhất). Hết bước thì ca khỏi: ghi `seen`,
   * lưu để chơi tiếp là ca sau — ra nền / 🧹 giữa hoạt ảnh không làm mất hay lặp kết quả.
   */
  function accept() {
    stepIdx += 1;
    wrongs = 0;
    nudges = 0;
    tray = [];
    if (stepIdx >= steps().length) {
      if (!recorded.has(`seen:${caseIdx}`)) {
        recorded.add(`seen:${caseIdx}`);
        progress = afterHealed(afterHealed(progress, curCase().id), `pt:${cases[caseIdx].patient}`);
        // Bò (bài Animals): "đã gặp" khi chữa xong ca không nhầm lần nào (SPEC-jobs6 mục 4).
        const word = curPatient()?.word;
        if (word && !recorded.has(`wrong:${caseIdx}`)) markPracticed(app, word, curPatient().emoji);
        saveProgress();
      }
      // Khỏi rồi: lưu ở bước tặng sticker — ra nền rồi quay lại thì bạn thú vẫn xin sticker (SPEC-doctor2 mục 4).
      saveSnap(JOB, { level, cases, caseIdx, stepIdx, wrongs: 0, nudges: 0, tray: [], recorded: [...recorded], washed: [...washed], washDone, phase: 'sticker' });
    } else snap();
  }

  // ---------- Ca, bước ----------
  async function startCase(resume = null) {
    const e = kit.epoch;
    stepIdx = resume?.stepIdx ?? 0;
    wrongs = resume?.wrongs ?? 0;
    nudges = resume?.nudges ?? 0;
    tray = [];
    washEl.hidden = true;
    if (isCheckup() && resume?.phase !== 'sticker') {
      startCheckup(resume);
      return;
    }
    if (isEyes() && resume?.phase !== 'sticker') {
      startEyes(resume);
      return;
    }
    measureEl.hidden = true;
    eyesEl.hidden = true;
    feelsEl.hidden = true;
    bed.hidden = false;
    patientEl.hidden = false;
    setState('enter');
    renderPatient();
    renderTray();
    if (resume?.phase === 'sticker') {
      // Ra nền sau khi khỏi, chưa dán sticker: bạn thú khỏe (mặt vui), xin sticker lại.
      setMood('happy');
      const sign = group('dr-sign');
      if (sign) sign.innerHTML = '';
      startSticker();
      return;
    }
    snap();
    // Dỗ bạn thú chưa xong: vào (lại) bước dỗ; xong rồi thì ca bệnh như cũ (không hỏi dỗ lại).
    if (resume) {
      if (needComfort()) startComfort();
      else beginStep(resume);
      return;
    }
    if (needComfort()) showFeeling(true);
    patientEl.classList.remove('leave');
    restartAnim(patientEl, 'enter');
    play('doorbell');
    await wait(ENTER_MS);
    if (e !== kit.epoch) return;
    await talk([B(COME_IN_LINE), P(HELLO_DOCTOR_LINE)]);
    if (e !== kit.epoch) return;
    // Bạn thú nông trại kêu tiếng của mình (file của Ai kêu thế?); file lỗi / chưa mở âm thanh thì bỏ qua, không chờ quá 2,5 giây.
    const cry = SOUND_BY_ID.get(curPatient()?.sound ?? '');
    if (cry) await Promise.race([playSoundFile(cry, { isCurrent: () => e === kit.epoch }).catch(() => false), wait(2500)]);
    if (e !== kit.epoch) return;
    if (!needComfort()) await talk([P(sayLine())]);
    if (e !== kit.epoch) return;
    if (needComfort()) startComfort();
    else beginStep();
  }

  /** Vào bước hiện tại: khay (bước khám / chữa), gợi ý có sẵn, câu của bước. Chơi tiếp: bạn thú nói lại triệu chứng trước. */
  async function beginStep(resume = null) {
    const e = kit.epoch;
    const step = curStep();
    if (!step) {
      heal();
      return;
    }
    tray = step.type === 'touch' ? [] : resume?.tray?.length ? resume.tray : trayFor(step, level);
    renderTray();
    const named = step.type === 'check' || level <= 1 || Boolean(ITEM_BY_ID.get(step.item)?.fresh);
    if (step.type === 'touch') setGlow(level <= 1 || wrongs >= 2 || nudges > 0 ? step.target : null);
    else setGlow(null);
    if (step.type !== 'touch' && wrongs >= (named ? 1 : 2)) kit.setHint(step.item);
    setState(step.type);
    snap();
    const { who, line } = stepPrompt(step, level);
    await talk([...(resume ? [P(sayLine())] : []), { who, line }]);
    if (e === kit.epoch) kit.armNudge();
  }

  /** Chạm vào người bạn thú (bước chạm chỗ đau). */
  function touchRegion(region) {
    const step = curStep();
    if (region === step.target) {
      acceptTouch(region);
      return;
    }
    if (!countWrong(`r:${region}`)) return;
    if (level >= 2 && wrongs >= 2) setGlow(step.target);
    const k = stepKey();
    talk([P(wrongTouchLine(region, curCase()))]).then(() => k === stepKey() && kit.armNudge());
  }

  /** Một lần nhầm (chạm nhầm chỗ / đưa nhầm đồ). Chạm lại đúng chỗ / đồ đó trong 0,4 giây thì gộp, trả về false. */
  function countWrong(key) {
    const now = Date.now();
    if (key === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return false;
    lastWrong = { key, at: now };
    wrongs += 1;
    recorded.add(`wrong:${caseIdx}`);
    snap();
    kit.clearNudge();
    play('boing');
    restartAnim(patientEl, 'shake');
    return true;
  }

  async function acceptTouch(region) {
    const e = kit.epoch;
    const c = curCase();
    setState('busy');
    kit.clearNudge();
    const r = REGIONS[region];
    if (r.body && !recorded.has(`body:${caseIdx}`)) {
      recorded.add(`body:${caseIdx}`);
      markPracticed(app, r.body, r.emoji);
    }
    accept();
    play('ding');
    setGlow(region, 'dr-picked');
    await talk([P(yesTouchLine(c))]);
    if (e !== kit.epoch) return;
    nextStep();
  }

  /** Bé đưa một đồ (kéo-thả lên người bạn thú hoặc chạm trong khay). */
  function give(id, from) {
    if (state !== 'check' && state !== 'treat') return;
    const step = curStep();
    if (id === step.item) {
      acceptItem(id, from);
      return;
    }
    if (!countWrong(`i:${id}`)) return;
    restartAnim(kit.trayItem(id), 'shake');
    const { line, hint } = wrongItemLine(id, step, level, wrongs);
    if (hint) {
      kit.setHint(step.item);
      restartAnim(kit.trayItem(step.item), 'nudge');
    }
    const k = stepKey();
    talk([{ who: step.type === 'check' ? 'bong' : 'patient', line }]).then(() => k === stepKey() && kit.armNudge());
  }

  async function acceptItem(id, from) {
    const e = kit.epoch;
    const c = curCase();
    const step = curStep();
    setState('busy');
    kit.clearNudge();
    kit.setHint(null);
    accept();
    const region = targetOf(id);
    const spot = regionPoint(region, 0);
    const ghost = await kit.flyTo(itemFace(ITEM_BY_ID.get(id), images), from, toScreen(spot.x, spot.y));
    if (e !== kit.epoch) return;
    play(ITEM_SOUND[id] ?? 'pop');
    ghost.classList.add(`use-${id}`);
    const { who, line } = doneLine(c, step);
    await Promise.all([talk([{ who, line }]), wait(USE_MS)]);
    if (e !== kit.epoch) return;
    if (id === 'flashlight' && c.id === 'tooth') {
      await wait(SAY_AAH_MS);
      if (e !== kit.epoch) return;
    }
    // Ca tai: soi đèn thấy bọ rùa → bọ bay ra khỏi tai.
    if (step.effect === 'bug') {
      const bug = h('div.dr-bug', { text: '🐞', 'aria-hidden': 'true' });
      const at = toScreen(spot.x, spot.y);
      Object.assign(bug.style, { left: `${at.x}px`, top: `${at.y}px` });
      document.body.append(bug);
      play('sparkle');
      await wait(BUG_MS);
      bug.remove();
      if (e !== kit.epoch) return;
    }
    // Ca buồn ngủ: đắp chăn, mắt nhắm, zZz 2 giây.
    if (id === 'blanket') {
      setMood('sleep');
      const z = h('div.dr-zzz', { text: '💤', 'aria-hidden': 'true' });
      const head = regionPoint('head', 0);
      const at = toScreen(head.x, head.y);
      Object.assign(z.style, { left: `${at.x}px`, top: `${at.y}px` });
      document.body.append(z);
      await wait(REST_MS);
      z.remove();
      if (e !== kit.epoch) return;
    }
    // Bọt biển lau sạch bùn (SPEC-jobs6 mục 4).
    if (id === 'sponge') {
      const sign = group('dr-sign');
      if (sign) sign.innerHTML = '';
    }
    // Băng dán ở lại trên người bạn thú (cả lúc ra về).
    if (id === 'bandage') {
      const url = images?.item.get('bandage');
      group('dr-applied')?.insertAdjacentHTML('beforeend', url
        ? `<image class="dr-applied-item" href="${url}" x="${spot.x - 22}" y="${spot.y - 22}" width="44" height="44"/>`
        : `<text class="dr-applied-item" x="${spot.x}" y="${spot.y}" text-anchor="middle" dominant-baseline="central" font-size="34">🩹</text>`);
    }
    kit.removeGhost(ghost);
    nextStep();
  }

  function nextStep() {
    if (stepIdx < steps().length) beginStep();
    else heal();
  }

  async function heal() {
    const e = kit.epoch;
    const c = curCase();
    setState('healed');
    tray = [];
    renderTray();
    setGlow(null);
    setMood('happy');
    const sign = group('dr-sign');
    if (sign) sign.innerHTML = '';
    play('sparkle');
    restartAnim(patientEl, 'hop');
    await talk([P(betterLine(c)), B(GOOD_JOB_LINE)]);
    if (e !== kit.epoch) return;
    startSticker();
  }

  // ---------- Dỗ bạn thú (SPEC-jobs4 mục 6, DR4): đầu một ca bệnh — mức 3 chọn thẻ mặt, rồi chọn đồ giúp ----------
  const comfortOf = () => cases[caseIdx]?.comfort;
  const needComfort = () => Boolean(comfortOf() && !comfortOf().done);
  const helpId = () => comfortItemId(FEELING_BY_ID.get(comfortOf().feel).help);
  /** Mặt cảm xúc + đứng lệch khỏi giường (chưa chịu ngồi) khi còn phải dỗ; dỗ xong thì bỏ. */
  function showFeeling(on) {
    const c = comfortOf();
    patientEl.classList.toggle('upset', on);
    if (on) {
      patientEl.dataset.feel = c.feel;
      setMood(FEEL_MOOD[c.feel]);
    } else delete patientEl.dataset.feel;
  }
  function renderFeels() {
    const c = comfortOf();
    feelsEl.replaceChildren(...c.cards.map((f) => h('button.dr-feel', {
      type: 'button', 'aria-label': f, dataset: { feel: f }, text: FEELING_BY_ID.get(f).emoji, onclick: () => tapFeel(f),
    })));
    feelsEl.hidden = false;
  }
  /** Câu của bước dỗ (vào bước, nhắc, chạm Bông / bạn thú). */
  function comfortPrompt() {
    const c = comfortOf();
    const name = curPatient().name;
    if (state === 'feel') return [B(feelQLine(name))];
    if (level <= 1) return [P(feelLine(c.feel)), B(helpLine(c.feel))];
    if (level === 2) return [P(feelLine(c.feel)), B(HOW_HELP_LINE)];
    return [B(feelIsLine(name, c.feel)), B(HOW_HELP_LINE)];
  }
  function nudgeComfort() {
    if (state === 'feel') restartAnim(feelsEl.querySelector(`[data-feel="${comfortOf().feel}"]`), 'nudge');
    else restartAnim(kit.trayItem(helpId()), 'nudge');
  }
  /** Ghi từ Feelings "đã gặp" (đúng ngay lần đầu; mức 2: đồ, mức 3: thẻ mặt) — một lần mỗi ca. */
  function recordFeel() {
    const f = comfortOf().feel;
    if (recorded.has(`feel:${caseIdx}`)) return;
    recorded.add(`feel:${caseIdx}`);
    markPracticed(app, f, FEELING_BY_ID.get(f).emoji);
  }
  async function startComfort() {
    const e = kit.epoch;
    const c = comfortOf();
    setGlow(null);
    showFeeling(true);
    if (level >= 3 && !c.cardDone) {
      tray = [];
      renderTray();
      renderFeels();
      setState('feel');
      snap();
      await talk(comfortPrompt());
      if (e === kit.epoch && state === 'feel') kit.armNudge();
      return;
    }
    feelsEl.hidden = level < 3;
    if (level >= 3) renderFeels();
    feelsEl.querySelector(`[data-feel="${c.feel}"]`)?.classList.add('picked');
    tray = c.tray;
    renderTray();
    // Mức 1: đồ đúng sáng + nhún ngay (không có nhầm); mức 2–3: nhầm 2 lần thì đồ đúng sáng.
    if (level <= 1 || wrongs >= 2) kit.setHint(helpId());
    if (level <= 1) restartAnim(kit.trayItem(helpId()), 'nudge');
    setState('comfort');
    snap();
    await talk(comfortPrompt());
    if (e === kit.epoch && state === 'comfort') kit.armNudge();
  }
  /** Mức 3: chạm thẻ mặt cảm xúc. Đúng thì khóa bước thẻ (lưu ngay), sang chọn đồ. */
  function tapFeel(f) {
    if (state !== 'feel') return;
    const c = comfortOf();
    const btn = feelsEl.querySelector(`[data-feel="${f}"]`);
    if (f !== c.feel) {
      if (!countWrong(`f:${f}`)) return;
      restartAnim(btn, 'shake');
      if (wrongs >= 2) restartAnim(feelsEl.querySelector(`[data-feel="${c.feel}"]`), 'nudge');
      const k = stepKey();
      talk([B(wrongCardLine(f, curPatient().name))]).then(() => k === stepKey() && kit.armNudge());
      return;
    }
    kit.clearNudge();
    if (wrongs === 0) recordFeel();
    c.cardDone = true;
    wrongs = 0;
    nudges = 0;
    play('ding');
    startComfort();
  }
  /** Bé đưa đồ giúp. Đúng: nhận NGAY (lưu: ca bệnh bắt đầu khi quay lại), hoạt ảnh, bạn vui, ngồi lên giường. */
  async function giveComfort(id, from) {
    if (state !== 'comfort') return;
    const e = kit.epoch;
    const c = comfortOf();
    const want = helpId();
    if (id !== want) {
      // Mức 1: không có nhầm — đồ đúng nhún.
      if (level <= 1) {
        restartAnim(kit.trayItem(want), 'nudge');
        return;
      }
      if (!countWrong(`c:${id}`)) return;
      restartAnim(kit.trayItem(id), 'shake');
      if (wrongs >= 2) {
        kit.setHint(want);
        restartAnim(kit.trayItem(want), 'nudge');
      }
      const k = stepKey();
      talk([P(wrongComfortLine(id.slice(2), c.feel))]).then(() => k === stepKey() && kit.armNudge());
      return;
    }
    setState('busy');
    kit.clearNudge();
    kit.setHint(null);
    if (level === 2 && wrongs === 0) recordFeel();
    c.done = true;
    wrongs = 0;
    nudges = 0;
    tray = [];
    if (!recorded.has(`soothe:${caseIdx}`)) {
      recorded.add(`soothe:${caseIdx}`);
      progress = afterHealed(progress, `feel:${c.feel}`);
      saveProgress();
    }
    snap();
    const help = id.slice(2);
    const spot = regionPoint(COMFORT_TARGET[help], 0);
    const ghost = await kit.flyTo(trayFace(id), from, toScreen(spot.x, spot.y));
    kit.renderTray([]);
    if (e !== kit.epoch) return;
    play(help === 'apple' ? 'chomp' : 'pop');
    ghost.classList.add(`use-${help}`);
    if (help === 'pillow') setMood('sleep');
    if (help === 'hug') restartAnim(patientEl, 'hugged');
    await Promise.all([talk(level <= 1 ? [] : [B(helpLine(c.feel))]), wait(USE_MS)]);
    if (e !== kit.epoch) return;
    kit.removeGhost(ghost);
    feelsEl.hidden = true;
    showFeeling(false);
    setMood('happy');
    play('sparkle');
    restartAnim(patientEl, 'hop');
    await talk([P(HAPPY_NOW_LINE)]);
    if (e !== kit.epoch) return;
    setMood(curCase().face === 'sleepy' ? 'sleepy' : 'sad');
    await talk([P(curCase().say)]);
    if (e !== kit.epoch) return;
    beginStep();
  }

  // ---------- Ca đo chiều cao (SPEC-doctor2 mục 5, DR2) ----------
  const nameOf = (pid) => PATIENT_BY_ID.get(pid)?.name ?? pid;
  const blockEl = (w, i) => measureEl.querySelector(`.dr-block[data-who="${w}"][data-i="${i}"]`);
  const tallerIdx = () => (cases[caseIdx].heights[0] > cases[caseIdx].heights[1] ? 0 : 1);
  /** Vẽ thước khối + bạn thú; khối đã đếm sáng (có số), mức 1 khối cần chạm tiếp nhấp nháy. */
  function renderMeasure() {
    const c = cases[caseIdx];
    const pids = [c.patient, c.patient2].filter(Boolean);
    measureEl.replaceChildren(...pids.map((pid, w) => {
      const n = c.heights[w];
      const counted = w < mWho ? n : w === mWho ? mCount : 0;
      const blocks = Array.from({ length: n }, (_, i) => h('button.dr-block', {
        type: 'button', 'aria-label': `Block ${i + 1}`, dataset: { who: String(w), i: String(i) }, text: String(i + 1),
        onclick: () => tapBlock(w, i),
      }));
      blocks.forEach((b, i) => {
        b.classList.toggle('lit', i < counted);
        b.classList.toggle('next', level <= 1 && w === mWho && i === counted && state === 'measure');
      });
      const pet = h('button.dr-measure-pet', {
        type: 'button', 'aria-label': nameOf(pid), dataset: { who: String(w), patient: pid }, style: { '--n': String(n) },
        html: patientSvg(pid, { mood: 'happy', title: nameOf(pid) }), onclick: () => tapPet(w),
      });
      return h('div.dr-measure-pair', {}, h('div.dr-blocks', {}, ...blocks), pet);
    }));
    measureEl.dataset.heights = c.heights.join(','); // cho test
  }
  function measurePrompt() {
    if (state === 'point') return [B(pointLine(cases[caseIdx].asks[eIdx]))];
    if (state === 'glasses') return [B(needGlassesLine(nameOf(cases[caseIdx].patient)))];
    if (state === 'howmany') return [B(HOW_MANY_BLOCKS_LINE)];
    if (state === 'taller') return [B(TALLER_Q_LINE)];
    return [B(MEASURE_LINE)];
  }
  function nudgeMeasure() {
    const c = cases[caseIdx];
    if (state === 'point') restartAnim(eyesEl.querySelector(`.dr-eye-pic[data-word="${c.asks[eIdx]}"]`), 'nudge');
    else if (state === 'glasses') restartAnim(kit.trayItem('glasses'), 'nudge');
    else if (state === 'howmany') restartAnim(kit.trayItem(`n-${c.heights[0]}`), 'nudge');
    else if (state === 'taller') restartAnim(measureEl.querySelector(`.dr-measure-pet[data-who="${tallerIdx()}"]`), 'nudge');
    else restartAnim(blockEl(mWho, mCount), 'nudge');
  }
  async function startCheckup(resume = null) {
    const e = kit.epoch;
    mWho = resume?.mWho ?? 0;
    mCount = resume?.mCount ?? 0;
    bed.hidden = true;
    patientEl.hidden = true;
    measureEl.hidden = false;
    count.textContent = `${caseIdx + 1}/${cases.length}`;
    tray = [];
    renderTray();
    if (resume?.phase === 'howmany') {
      renderMeasure();
      startHowMany();
      return;
    }
    if (resume?.phase === 'taller') {
      renderMeasure();
      startTaller();
      return;
    }
    // Nhận chạm khối ngay từ lúc vào ca.
    setState('measure');
    renderMeasure();
    snap();
    if (!resume) {
      restartAnim(measureEl, 'enter');
      play('doorbell');
    }
    await talk([...(resume ? [] : [B(COME_IN_LINE), P(CHECKUP_HELLO_LINE)]), B(MEASURE_LINE)]);
    if (e === kit.epoch && state === 'measure') kit.armNudge();
  }
  async function tapBlock(w, i) {
    if (state !== 'measure') return;
    const e = kit.epoch;
    const c = cases[caseIdx];
    if (w !== mWho || i !== mCount) {
      // Không phải khối tiếp theo: không tăng số đếm; khối cần chạm nhún. Mức 1 không tính nhầm.
      if (level >= 2) {
        if (!countWrong(`b:${w}:${i}`)) return;
      } else play('boing');
      restartAnim(blockEl(mWho, mCount), 'nudge');
      const k = stepKey();
      await talk([B(FROM_BOTTOM_LINE)]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    mCount += 1;
    wrongs = 0;
    nudges = 0;
    const n = c.heights[mWho];
    const doneOne = mCount >= n;
    if (doneOne) setState('busy');
    snap();
    kit.clearNudge();
    play('ding');
    renderMeasure();
    if (!doneOne) {
      const k = stepKey();
      await talk([B(blockCountLine(mCount))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    await talk([B(blockCountLine(mCount)), B(tallLine(n))]);
    if (e !== kit.epoch) return;
    if (level === 2) {
      startHowMany();
      return;
    }
    if (level >= 3 && mWho === 0) {
      // Mức 3: đo bạn thứ hai.
      mWho = 1;
      mCount = 0;
      setState('measure');
      renderMeasure();
      snap();
      await talk([{ who: 'patient2', line: CHECKUP_HELLO_LINE }, B(MEASURE_LINE)]);
      if (e === kit.epoch && state === 'measure') kit.armNudge();
      return;
    }
    if (level >= 3) startTaller();
    else finishCheckup();
  }
  /** Mức 2: "How many blocks?" — 3 thẻ số (sinh sẵn), đúng một thẻ. */
  async function startHowMany() {
    const e = kit.epoch;
    tray = cases[caseIdx].choices.map((n) => `n-${n}`);
    renderTray();
    setState('howmany');
    snap();
    await talk([B(HOW_MANY_BLOCKS_LINE)]);
    if (e === kit.epoch && state === 'howmany') kit.armNudge();
  }
  async function pickBlocks(id) {
    if (state !== 'howmany') return;
    const e = kit.epoch;
    const n = cases[caseIdx].heights[0];
    const x = Number(id.slice(2));
    if (x !== n) {
      if (!countWrong(`n:${x}`)) return;
      restartAnim(kit.trayItem(id), 'shake');
      if (wrongs >= 2) restartAnim(kit.trayItem(`n-${n}`), 'nudge');
      const k = stepKey();
      await talk([B(wrongBlocksLine(x))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    setState('busy');
    kit.clearNudge();
    if (wrongs === 0 && !recorded.has(`num:${caseIdx}`)) {
      recorded.add(`num:${caseIdx}`);
      markPracticed(app, numberKey(n), '🔢');
    }
    wrongs = 0;
    snap();
    play('ding');
    kit.trayItem(id)?.classList.add('hint');
    await talk([B(rightBlocksLine(n))]);
    if (e !== kit.epoch) return;
    finishCheckup();
  }
  /** Mức 3: "Who is taller?" — chạm bạn cao hơn. */
  async function startTaller() {
    const e = kit.epoch;
    tray = [];
    renderTray();
    setState('taller');
    snap();
    await talk([B(TALLER_Q_LINE)]);
    if (e === kit.epoch && state === 'taller') kit.armNudge();
  }
  async function tapPet(w) {
    if (state !== 'taller') return;
    const e = kit.epoch;
    const c = cases[caseIdx];
    const pids = [c.patient, c.patient2];
    const t = tallerIdx();
    if (w !== t) {
      if (!countWrong(`p:${w}`)) return;
      if (wrongs >= 2) restartAnim(measureEl.querySelector(`.dr-measure-pet[data-who="${t}"]`), 'nudge');
      const k = stepKey();
      await talk([B(wrongTallerLine(nameOf(pids[w])))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    setState('busy');
    kit.clearNudge();
    wrongs = 0;
    snap();
    play('ding');
    await talk([B(tallerLine(nameOf(pids[t]), nameOf(pids[1 - t])))]);
    if (e !== kit.epoch) return;
    finishCheckup();
  }
  /** Đo xong: ghi `seen` (một lần), bạn thú vui, rồi lên giường nhận sticker như ca bệnh. */
  const finishCheckup = () => finishNewCase('checkup', measureEl, [P(GROWING_LINE), B(GOOD_JOB_LINE)]);
  /** Ca mới xong (đo chiều cao / khám mắt): ghi `seen` một lần, lưu ở bước sticker, rồi bạn thú lên giường nhận sticker. */
  async function finishNewCase(kind, el, lines) {
    const e = kit.epoch;
    setState('busy');
    if (!recorded.has(`seen:${caseIdx}`)) {
      recorded.add(`seen:${caseIdx}`);
      progress = afterHealed(afterHealed(progress, kind), `pt:${cases[caseIdx].patient}`);
      saveProgress();
    }
    saveSnap(JOB, { level, cases, caseIdx, stepIdx: 0, wrongs: 0, nudges: 0, tray: [], recorded: [...recorded], washed: [...washed], washDone, mWho, mCount, eIdx, phase: 'sticker' });
    play('sparkle');
    restartAnim(el, 'hop');
    await talk(lines);
    if (e !== kit.epoch) return;
    el.hidden = true;
    bed.hidden = false;
    patientEl.hidden = false;
    renderPatient();
    startSticker();
  }

  // ---------- Ca khám mắt bằng bảng hình (SPEC-doctor2 mục 6, DR3) ----------
  /** Vẽ bảng hình (ảnh từ vựng bố mẹ đã thêm nếu có, không thì emoji) + bạn thú (che mắt / đeo kính theo bước). */
  function renderEyes({ covered = true, glasses = false } = {}) {
    const c = cases[caseIdx];
    const pics = c.chart.map((w) => {
      const face = h('span.dr-eye-emoji', { text: w.emoji, 'aria-hidden': 'true' });
      const btn = h('button.dr-eye-pic', { type: 'button', 'aria-label': w.en, dataset: { word: w.en }, onclick: () => tapEyePic(w.en) }, face);
      latestImageForWord(app.db, w.en).then((img) => {
        if (!img || kit.signal.aborted) return;
        const url = URL.createObjectURL(mediaBlob(img));
        eyeUrls.push(url);
        const el = h('img.dr-eye-img', { src: url, alt: '', draggable: false });
        el.addEventListener('error', () => el.replaceWith(face), { once: true });
        face.replaceWith(el);
      }).catch(() => {});
      return btn;
    });
    const pet = h('div.dr-eyes-pet', { dataset: { patient: c.patient } },
      h('div', { html: patientSvg(c.patient, { mood: glasses ? 'happy' : 'sad', title: nameOf(c.patient) }) }),
      h('span.dr-eye-cover', { 'aria-hidden': 'true', hidden: !covered || glasses }),
      h('span.dr-glasses', { text: GLASSES_ITEM.emoji, 'aria-hidden': 'true', hidden: !glasses }));
    eyesEl.replaceChildren(h('div.dr-chart', { dataset: { count: String(c.chart.length) } }, ...pics), pet);
    eyesEl.dataset.ask = c.asks[eIdx] ?? ''; // từ đang hỏi (cho test)
  }
  async function startEyes(resume = null) {
    const e = kit.epoch;
    eIdx = resume?.eIdx ?? 0;
    bed.hidden = true;
    patientEl.hidden = true;
    measureEl.hidden = true;
    eyesEl.hidden = false;
    count.textContent = `${caseIdx + 1}/${cases.length}`;
    tray = [];
    renderTray();
    if (resume?.phase === 'glasses' || eIdx >= cases[caseIdx].asks.length) {
      renderEyes();
      startGlasses();
      return;
    }
    renderEyes({ covered: Boolean(resume) });
    // Nhận chạm hình ngay từ lúc bắt đầu hỏi.
    setState('point');
    snap();
    if (!resume) {
      restartAnim(eyesEl, 'enter');
      play('doorbell');
      await talk([B(COME_IN_LINE), P(EYES_HELLO_LINE), B(COVER_LINE)]);
      if (e !== kit.epoch) return;
      eyesEl.querySelector('.dr-eye-cover').hidden = false; // bạn thú che một mắt (chỉ là hoạt ảnh)
    }
    await talk([B(pointLine(cases[caseIdx].asks[eIdx]))]);
    if (e === kit.epoch && state === 'point') kit.armNudge();
  }
  async function tapEyePic(word) {
    if (state !== 'point') return;
    const e = kit.epoch;
    const c = cases[caseIdx];
    const want = c.asks[eIdx];
    const btn = eyesEl.querySelector(`.dr-eye-pic[data-word="${word}"]`);
    if (word !== want) {
      if (!countWrong(`e:${word}`)) return;
      restartAnim(btn, 'shake');
      if (wrongs >= 2) restartAnim(eyesEl.querySelector(`.dr-eye-pic[data-word="${want}"]`), 'nudge');
      const k = stepKey();
      await talk([P(wrongEyeLine(word, want))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    // Đúng: nhận NGAY (một lần) — ghi "đã gặp" từ đó nếu đúng ngay lần đầu.
    if (wrongs === 0 && !recorded.has(`eye:${caseIdx}:${eIdx}`)) {
      recorded.add(`eye:${caseIdx}:${eIdx}`);
      markPracticed(app, progressKey(word), c.chart.find((w) => w.en === word)?.emoji ?? '');
    }
    eIdx += 1;
    eyesEl.dataset.ask = c.asks[eIdx] ?? '';
    wrongs = 0;
    nudges = 0;
    const done = eIdx >= c.asks.length;
    if (done) setState('busy');
    snap();
    kit.clearNudge();
    play('ding');
    restartAnim(btn, 'pop');
    if (!done) {
      const k = stepKey();
      await talk([P(seeLine(word)), B(pointLine(c.asks[eIdx]))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    await talk([P(seeLine(word))]);
    if (e !== kit.epoch) return;
    startGlasses();
  }
  /** Bé đưa kính (một món trong khay, không có đồ nhiễu) → bạn thú đeo kính. */
  async function startGlasses() {
    const e = kit.epoch;
    tray = ['glasses'];
    renderTray();
    setState('glasses');
    snap();
    await talk([B(needGlassesLine(nameOf(cases[caseIdx].patient)))]);
    if (e === kit.epoch && state === 'glasses') kit.armNudge();
  }
  async function giveGlasses(id, from) {
    if (state !== 'glasses' || id !== 'glasses') return;
    const e = kit.epoch;
    setState('busy');
    kit.clearNudge();
    tray = [];
    const target = eyesEl.querySelector('.dr-glasses');
    target.hidden = false;
    const to = center(target.getBoundingClientRect());
    target.hidden = true;
    const ghost = await kit.flyTo(trayFace('glasses'), from, to);
    kit.renderTray([]);
    kit.removeGhost(ghost);
    if (e !== kit.epoch) return;
    play('pop');
    renderEyes({ covered: false, glasses: true });
    finishNewCase('eyes', eyesEl, [P(SEE_BETTER_LINE), B(GOOD_JOB_LINE)]);
  }

  // ---------- Tặng sticker cho bạn thú (SPEC-doctor2 mục 4) ----------
  async function startSticker() {
    const e = kit.epoch;
    const s = sticker();
    tray = s.set.map(stickerId);
    renderTray();
    // Sticker cần chọn (cho test): '' = cái nào cũng được, 'blue-' = theo màu, 'blue-star' = màu + hình.
    patientEl.dataset.want = s.want ? `${s.want.color}-${s.want.shape ?? ''}` : '';
    setState('sticker');
    snap();
    await talk(promptLines());
    if (e === kit.epoch && state === 'sticker') kit.armNudge();
  }
  async function giveSticker(id, from) {
    if (state !== 'sticker') return;
    const e = kit.epoch;
    const s = sticker();
    const st = stickerById(id);
    if (!st) return;
    if (!matchesSticker(st, s.want)) {
      if (!countWrong(`s:${id}`)) return;
      restartAnim(kit.trayItem(id), 'shake');
      if (wrongs >= 2) restartAnim(kit.trayItem(wantedItem()), 'nudge');
      const k = stepKey();
      await talk([P(stickerWrongLine(st, s.want))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    // Đúng: nhận NGAY (một lần) — ghi tiến độ (đúng ngay lần đầu, mức 2–3), lưu để chơi tiếp là ca sau.
    setState('busy');
    kit.clearNudge();
    if (s.want && wrongs === 0 && !recorded.has(`sticker:${caseIdx}`)) {
      recorded.add(`sticker:${caseIdx}`);
      markPracticed(app, st.color, '');
      if (s.want.shape) markPracticed(app, st.shape, '');
    }
    wrongs = 0;
    nudges = 0;
    saveSnap(JOB, { level, cases, caseIdx: caseIdx + 1, stepIdx: 0, wrongs: 0, nudges: 0, tray: [], recorded: [...recorded], washed: [...washed], washDone, phase: 'start' });
    tray = [];
    const spot = regionPoint('tummy', 0);
    const ghost = await kit.flyTo(trayFace(id), from, toScreen(spot.x, spot.y));
    kit.renderTray([]);
    if (e !== kit.epoch) return;
    play('pop');
    kit.removeGhost(ghost);
    group('dr-applied')?.insertAdjacentHTML('beforeend', `<g class="dr-applied-item" transform="translate(${spot.x - 18} ${spot.y - 18})">${stickerShape(st, 36).replace('<svg ', '<svg x="0" y="0" ')}</g>`);
    await talk([P(stickerLoveLine(st)), P(BYE_LINE)]);
    if (e !== kit.epoch) return;
    leave();
  }

  async function leave() {
    const e = kit.epoch;
    setState('leave');
    restartAnim(patientEl, 'leave');
    await wait(LEAVE_MS);
    if (e !== kit.epoch) return;
    caseIdx += 1;
    if (caseIdx >= cases.length) finishRound();
    else startCase();
  }

  /** Xong 3 ca: Hoan hô + sticker (một lần), đếm lượt. */
  function finishRound() {
    if (state === 'done') return;
    setState('done');
    kit.finishRound(() => {
      clearSnap(JOB);
      progress = afterDoctorRound(progress);
      saveProgress();
    });
  }

  /** 🧹: khám lại từ ca 1 với cùng 3 ca, cùng bạn thú. */
  function restart() {
    if (state === 'done' || !cases.length) return;
    kit.cancelAll();
    // Dỗ bạn thú làm lại (tiến độ đã ghi thì không ghi lần hai — `recorded` giữ nguyên).
    for (const c of cases) if (c.comfort) Object.assign(c.comfort, { done: false, cardDone: false });
    caseIdx = 0;
    washed = [];
    washDone = false;
    startWash();
  }

  // ---------- Rửa tay đầu lượt (SPEC-doctor2 mục 3) ----------
  /** Đủ 6 ô ảnh lưới rửa tay thì dùng ảnh; thiếu ô nào thì cả cảnh dùng hình vẽ sẵn (không trộn kiểu). */
  const washPhotos = () => WASH_FRAMES.every((f) => images?.wash?.has(f));
  /** Hiện hình của bước rửa tay (theo món vừa dùng); ảnh thì chuyển mờ dần sang ô mới. */
  function renderWash() {
    const frame = washFrame(washed, level);
    washEl.dataset.frame = frame; // cho test
    for (const f of WASH_FRAMES) washEl.classList.toggle(`f-${f}`, f === frame);
    const photo = washPhotos();
    washEl.classList.toggle('photo', photo);
    if (!photo || washPhoto.lastElementChild?.dataset.frame === frame) return;
    const img = h('img.dr-wash-img', { src: images.wash.get(frame), alt: '', dataset: { frame } });
    washPhoto.append(img);
    setTimeout(() => { while (washPhoto.children.length > 1) washPhoto.firstElementChild.remove(); }, scaled(450));
  }
  /** Hiệu ứng khi dùng món: bọt bay lên, nước bắn, lấp lánh, găng bật, pháo giấy khi xong. */
  function washEffect(kind) {
    if (reduceMotion()) return;
    const burst = (cls, n, style, text = '') => {
      for (let i = 0; i < n; i++) {
        const el = h(`span.${cls}`, { text, style: style(i) });
        washFx.append(el);
        setTimeout(() => el.remove(), scaled(1700));
      }
    };
    const rnd = (a, b) => `${a + Math.random() * (b - a)}%`;
    if (kind === 'soap') burst('fx-bubble', 9, (i) => ({ left: rnd(28, 70), top: rnd(40, 66), width: `${12 + Math.random() * 18}px`, animationDelay: `${i * 0.07}s` }));
    else if (kind === 'rinse') burst('fx-drop', 10, (i) => ({ left: rnd(45, 55), animationDelay: `${i * 0.06}s` }));
    else if (kind === 'towel' || kind === 'gloves') burst('fx-spark', 6, (i) => ({ left: rnd(22, 78), top: rnd(20, 70), animationDelay: `${i * 0.09}s` }), '✨');
    else if (kind === 'done') burst('fx-confetti', 16, (i) => ({ left: rnd(8, 92), background: ['#ff8787', '#ffd43b', '#8ce99a', '#74c0fc', '#b197fc'][i % 5], animationDelay: `${Math.random() * 0.35}s` }));
    if (kind === 'gloves') restartAnim(washEl, 'pop');
  }
  async function startWash() {
    const e = kit.epoch;
    bed.hidden = true;
    patientEl.hidden = true;
    measureEl.hidden = true;
    eyesEl.hidden = true;
    washEl.hidden = false;
    count.textContent = `1/${cases.length}`;
    renderWash();
    tray = washFor(level).filter((id) => !washed.includes(id));
    renderTray();
    // Nhận đồ ngay từ lúc Bông nói.
    setState('wash');
    snap();
    await talk([B(WASH_START_LINE)]);
    if (e === kit.epoch && state === 'wash') kit.armNudge();
  }
  async function useWash(id, from) {
    if (state !== 'wash' || washed.includes(id)) return;
    const e = kit.epoch;
    const want = nextWash(level, washed);
    if (want && id !== want) {
      if (!countWrong(`w:${id}`)) return;
      restartAnim(kit.trayItem(id), 'shake');
      if (wrongs >= 2) restartAnim(kit.trayItem(want), 'nudge');
      const k = stepKey();
      await talk([B(washFirstLine(want))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    // Dùng món: nhận NGAY, món rời khay (chạm lại không tính hai lần).
    washed.push(id);
    wrongs = 0;
    nudges = 0;
    const all = washFor(level).every((x) => washed.includes(x));
    if (all) {
      washDone = true;
      setState('busy');
    }
    snap();
    kit.clearNudge();
    tray = washFor(level).filter((x) => !washed.includes(x));
    renderTray();
    const ghost = await kit.flyTo(trayFace(id), from, center(washEl.getBoundingClientRect()));
    kit.removeGhost(ghost);
    if (e !== kit.epoch) return;
    play(id === 'rinse' ? 'whoosh' : 'pop');
    renderWash();
    restartAnim(washEl, 'rub');
    washEffect(id);
    if (!all) {
      const k = stepKey();
      await talk([B(WASH_BY.get(id).line)]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    await Promise.all([talk([B(WASH_BY.get(id).line)]), wait(WASH_MS)]);
    if (e !== kit.epoch) return;
    play('sparkle');
    washEffect('done');
    await talk([B(WASH_DONE_LINE)]);
    if (e !== kit.epoch) return;
    caseIdx = 0;
    startCase();
  }

  /** Chạm Bông y tá: nói lại câu của bước hiện tại. */
  function repeatPrompt() {
    if (COMFORT_STATES.includes(state)) {
      const k = stepKey();
      talk(comfortPrompt()).then(() => k === stepKey() && kit.armNudge());
      return;
    }
    if (state === 'wash' || state === 'sticker') {
      const k = stepKey();
      talk(promptLines()).then(() => k === stepKey() && kit.armNudge());
      return;
    }
    if (MEASURE_STATES.includes(state)) {
      const k = stepKey();
      talk(measurePrompt()).then(() => k === stepKey() && kit.armNudge());
      return;
    }
    if (!STEP_STATES.includes(state)) return;
    const { who, line } = stepPrompt(curStep(), level);
    const k = stepKey();
    talk([{ who, line }]).then(() => k === stepKey() && kit.armNudge());
  }

  // ---------- Chạm bạn thú ----------
  patientEl.addEventListener('pointerdown', (e) => {
    // Đang kéo đồ bằng ngón 1 mà ngón 2 chạm bạn thú: bỏ qua ngón 2.
    if (kit.pressing || e.button > 0) return;
    const region = regionAtScreen(e.clientX, e.clientY);
    if (!region) return; // chạm ra ngoài người: không có gì
    if (state === 'touch') touchRegion(region);
    else if (COMFORT_STATES.includes(state)) {
      // Chạm bạn thú lúc dỗ: nghe lại câu, không tính nhầm.
      const k = stepKey();
      talk(comfortPrompt()).then(() => k === stepKey() && kit.armNudge());
    } else if (state === 'check' || state === 'treat') {
      // Nghe lại triệu chứng: không tính nhầm, không đổi bước.
      const k = stepKey();
      talk([P(curCase().say)]).then(() => k === stepKey() && kit.armNudge());
    }
  }, { signal: kit.signal });

  // ---------- Bắt đầu / chơi tiếp (sau khi nạp ảnh bố mẹ thêm) ----------
  loadDoctorImages(app).catch(() => null).then((loaded) => {
    images = loaded;
    if (kit.signal.aborted) return;
    kit.setHostImage(images?.doctor); // ảnh chú bác sĩ bố mẹ thêm (nếu có)
    if (images?.bg) {
      stage.style.backgroundImage = `url("${images.bg}")`;
      stage.classList.add('has-bg');
    }
    const s = takeSnap(JOB, { level, continueDirectly: params.continueDirectly });
    if (s) {
      startFrom(s);
    } else learnedWords().then((learned) => { if (!kit.signal.aborted) startNew(learned); });
  });

  /** Từ bé đã học (bài từ vựng, có emoji, đã gặp) — cho bảng hình khám mắt. */
  async function learnedWords() {
    try {
      const seenWords = new Set((await app.db.getAll('progress')).filter((r) => r.practiceCount > 0).map((r) => r.word));
      return (await listLessons(app.db)).filter(isWordLesson).flatMap((l) => l.words ?? [])
        .filter((w) => w.emoji && seenWords.has(progressKey(w.en))).map((w) => ({ en: w.en, emoji: w.emoji }));
    } catch {
      return [];
    }
  }
  function startFrom(s) {
    cases = s.cases;
    caseIdx = s.caseIdx;
    recorded = new Set(s.recorded ?? []);
    washed = s.washed ?? [];
    washDone = s.washDone ?? true;
    if (!washDone) startWash();
    // Ra nền sau khi ca cuối đã khỏi: hoan hô + sticker luôn.
    else if (caseIdx >= cases.length) {
      caseIdx = cases.length - 1;
      renderPatient();
      finishRound();
    } else startCase(s);
  }
  function startNew(learned) {
    // Bộ sticker, chiều cao, bảng hình… của từng ca sinh sẵn cùng kế hoạch lượt (ra nền không bốc lại).
    cases = planDoctorRound(level, { seen: progress.seen, eyeWords: learned });
    caseIdx = 0;
    startWash();
  }

  kit.onCleanup(() => images?.revoke());
  kit.onCleanup(() => eyeUrls.forEach((u) => URL.revokeObjectURL(u)));
  return kit.cleanup;
}
