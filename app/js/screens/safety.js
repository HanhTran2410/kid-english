// 🦸 Siêu nhân an toàn (SPEC-safety.md, S1 0.84.0, S2 0.85.0): mỗi lượt 3–5 tình huống. Bông định làm một việc rồi hỏi; mức 1
// bé chạm ✋ No! / 👍 Yes!, mức 2 bé chọn tranh an toàn trong hai tranh; mức 3 (bố mẹ khóa) là 2 chuyện × 2 bước như mức 2,
// bước 2 có hình nhỏ nhắc lại bước 1, sau mỗi bước có lượt "Say it!" tùy chọn (không ghi gì). Đúng → câu giải thích → thao tác sửa (chạm hoặc kéo) →
// ⭐ lên áo choàng Bông; đủ sao → "Thank you, Safety Hero!" → sticker. Nhầm: Bông đứng sững, gợi ý, hỏi lại; không âm "sai".
// Bông không bao giờ làm việc nguy hiểm trên màn hình. Trạng thái: ask | pick → right → fix → fixed → (tình huống sau) | hero.
// Hết lượt: album huy hiệu (huy hiệu mới nảy lên). Ảnh của bố mẹ (Góc bố mẹ → Ảnh Siêu nhân an toàn) thay từng hình / nền.
// Khung chung ở jobs/kit.js (phụ đề, giọng đọc, lưu khi ra nền, hoan hô + sticker).

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { bongSvg } from '../bong.js';
import { familySvg } from '../jobs/family.js';
import { markPhrasePick } from '../player/track.js';
import { afterJobRound } from '../jobs/levels.js';
import { characterName } from './child.js';
import { scaled } from '../timing.js';
import { mediaBlob } from '../db.js';
import { listen, RESULT } from '../speech/listen.js';
import { jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, wait, WRONG_LOCK_MS, MAX_NUDGES } from '../jobs/kit.js';
import {
  AUTO_MAX_LEVEL, RULE_BY_ID, TOPICS, TOPIC_IDS, cleanSafetyState, afterRule, badgesOf, planRound, planStory, sceneStart, sceneAt,
  applyOps, dragOps, rightLines, sayKeywords, ADULTS,
  NO_BTN, YES_BTN, SHOULD_I_LINE, WHICH_LINE, ANSWER_NO_LINE, ANSWER_YES_LINE, ANSWER_CARD_LINE, THANKS_LINE, NEW_BADGE_LINE,
  STORY_LINE, NEXT_LINE, SAY_IT_LINE, GREAT_TALK_LINE, GOOD_LINE, SAFETY_PEOPLE_IMAGES, SAFETY_ITEM_IMAGES, SAFETY_BG_IMAGES,
} from '../jobs/safety.js';

const JOB = 'safety';
const WALK_MS = 2600; // Bông đi chậm tới đồ vật
const MOVE_MS = 650;
const FIX_FIRST_MS = 6000; // thao tác sửa: bé chưa làm gì thì nhắc sau 6 giây…
const FIX_AGAIN_MS = 8000; // …rồi cách 8 giây, tối đa 3 lần (mục 5)
const FIX_REMINDERS = 3;
const DRAG_START_PX = 8;
const HIT_PAD = 0.5; // thả gần đích (thêm 50% mỗi phía) cũng được — vùng thả to cho bé 3 tuổi
const TALK_MS = 4000; // "Say it!": nghe tối đa ~4 giây, giới hạn cứng 6 giây (SPEC-jobs5 mục 5)
const TALK_CAP_MS = 6000;
const ALBUM_MS = 1800;

const INK = '#3d2c5e';
/** Hình vẽ của cảnh: `svg` (viewBox w × h) hoặc `emoji`; `ar` = rộng / cao. */
const svg = (w, hgt, body) => ({ ar: w / hgt, svg: `<svg viewBox="0 0 ${w} ${hgt}" aria-hidden="true">${body}</svg>` });
const emo = (e) => ({ ar: 1, emoji: e });
const ART = {
  ball: emo('⚽'), moon: emo('🌙'), toys: emo('🧸'), teddy: emo('🧸'), timer: emo('⏰'), book: emo('📖'),
  knife: emo('🔪'), pot: emo('🍲'), medicine: emo('💊'), tap: emo('🚰'), soap: emo('🧼'), car: emo('🚗'), hands: emo('🤝'),
  scooter: emo('🛵'), phone: emo('📞'), stranger: emo('🧑'), candy: emo('🍬'), hug: emo('🤗'), alarm: emo('🚨'), truck: emo('🚒'),
  exit: svg(120, 60, `<rect x="4" y="4" width="112" height="52" rx="8" fill="#2f9e44" stroke="${INK}" stroke-width="4"/>
    <circle cx="34" cy="16" r="6" fill="#fff"/><path d="M34 22 l-6 14 l-8 10 M30 30 l10 8 l6 10 M32 26 l10 -2" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M62 30 h40 m-12 -10 l12 10 l-12 10" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
  house: svg(160, 160, `<path d="M14 72 L80 14 L146 72" fill="#ff8787" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <rect x="28" y="66" width="104" height="88" fill="#fff4e6" stroke="${INK}" stroke-width="5"/>
    <rect x="44" y="82" width="28" height="24" fill="#adb5bd" stroke="${INK}" stroke-width="3"/><rect x="90" y="104" width="28" height="50" fill="#a9714b" stroke="${INK}" stroke-width="3"/>
    <g class="sf-puff" fill="#ced4da" opacity="0.9"><circle cx="58" cy="70" r="10"/><circle cx="66" cy="56" r="13"/><circle cx="56" cy="40" r="11"/></g>`),
  tv: svg(160, 130, `<rect x="6" y="6" width="148" height="100" rx="12" fill="#495057" stroke="${INK}" stroke-width="5"/>
    <rect class="sf-screen" x="18" y="16" width="124" height="80" rx="6" fill="#74c0fc"/>
    <g class="sf-cartoon"><circle cx="62" cy="52" r="16" fill="#ffd43b"/><circle cx="57" cy="48" r="3" fill="${INK}"/><circle cx="67" cy="48" r="3" fill="${INK}"/><path d="M54 58 q8 7 16 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M92 74 l14 -26 l14 26 z" fill="#ff8787"/></g>
    <rect x="70" y="106" width="20" height="12" fill="${INK}"/><rect x="44" y="118" width="72" height="8" rx="4" fill="${INK}"/>
    <circle class="sf-power" cx="140" cy="100" r="5" fill="#51cf66"/>`),
  bed: svg(200, 110, `<rect x="8" y="10" width="22" height="96" rx="8" fill="#b5838d" stroke="${INK}" stroke-width="4"/>
    <rect x="22" y="46" width="170" height="40" rx="10" fill="#fff" stroke="${INK}" stroke-width="4"/>
    <rect x="34" y="34" width="44" height="22" rx="10" fill="#e7f5ff" stroke="${INK}" stroke-width="3"/>
    <path d="M84 46 h108 v30 q-54 12 -108 0 z" fill="#91a7ff" stroke="${INK}" stroke-width="3"/>
    <rect x="22" y="84" width="170" height="10" fill="#b5838d" stroke="${INK}" stroke-width="3"/><rect x="176" y="40" width="18" height="66" rx="6" fill="#b5838d" stroke="${INK}" stroke-width="4"/>`),
  tablet: svg(110, 76, `<rect x="4" y="4" width="102" height="68" rx="10" fill="#343a40" stroke="${INK}" stroke-width="4"/>
    <rect x="14" y="12" width="82" height="52" rx="4" fill="#63e6be"/><path d="M48 26 v24 l20 -12 z" fill="#fff"/>`),
  shelf: svg(140, 26, `<rect x="4" y="4" width="132" height="12" rx="4" fill="#c08457" stroke="${INK}" stroke-width="4"/>
    <path d="M22 16 v8 M118 16 v8" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`),
  lamp: svg(90, 150, `<path class="sf-glow" d="M45 20 L-20 140 H110 Z" fill="#fff3bf" opacity="0.55"/>
    <path class="sf-shade" d="M18 60 L30 18 H60 L72 60 Z" fill="#ffe066" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <rect x="41" y="60" width="8" height="70" fill="${INK}"/><rect x="20" y="128" width="50" height="14" rx="6" fill="#e599f7" stroke="${INK}" stroke-width="4"/>`),
  counter: svg(200, 100, `<rect x="4" y="4" width="192" height="16" rx="5" fill="#dee2e6" stroke="${INK}" stroke-width="4"/>
    <rect x="12" y="20" width="176" height="76" fill="#ffd8a8" stroke="${INK}" stroke-width="4"/>
    <path d="M100 20 v76" stroke="${INK}" stroke-width="3"/><circle cx="88" cy="58" r="4" fill="${INK}"/><circle cx="112" cy="58" r="4" fill="${INK}"/>`),
  sink: svg(200, 110, `<rect x="4" y="4" width="192" height="20" rx="6" fill="#dee2e6" stroke="${INK}" stroke-width="4"/>
    <path d="M60 4 q40 30 80 0" fill="#a5d8ff" stroke="${INK}" stroke-width="3"/>
    <rect x="12" y="24" width="176" height="82" fill="#ffd8a8" stroke="${INK}" stroke-width="4"/>`),
  bubbles: svg(100, 80, `<g fill="#e7f5ff" stroke="#74c0fc" stroke-width="3"><circle cx="20" cy="56" r="14"/><circle cx="48" cy="34" r="18"/><circle cx="78" cy="56" r="12"/><circle cx="70" cy="16" r="9"/></g>`),
  socket: svg(80, 80, `<rect x="4" y="4" width="72" height="72" rx="12" fill="#f8f9fa" stroke="${INK}" stroke-width="4"/>
    <circle cx="40" cy="40" r="24" fill="#e9ecef" stroke="${INK}" stroke-width="3"/><rect x="28" y="32" width="6" height="16" rx="3" fill="${INK}"/><rect x="46" y="32" width="6" height="16" rx="3" fill="${INK}"/>`),
  cover: svg(80, 80, `<circle cx="40" cy="40" r="25" fill="#4dabf7" stroke="${INK}" stroke-width="3"/><circle cx="40" cy="40" r="7" fill="#d0ebff"/>`),
  window: svg(120, 140, `<rect x="6" y="6" width="108" height="128" rx="6" fill="#d0ebff" stroke="${INK}" stroke-width="5"/>
    <path d="M60 6 v128 M6 70 h108" stroke="${INK}" stroke-width="5"/><circle cx="34" cy="34" r="12" fill="#ffd43b"/>`),
  stool: svg(100, 80, `<rect x="6" y="6" width="88" height="16" rx="6" fill="#ff922b" stroke="${INK}" stroke-width="4"/>
    <path d="M20 22 l-6 54 M80 22 l6 54 M30 50 h40" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`),
  rug: svg(200, 30, `<ellipse cx="100" cy="15" rx="96" ry="12" fill="#ffc9c9" stroke="#e64980" stroke-width="3" stroke-dasharray="8 6"/>`),
  fan: svg(100, 180, `<circle cx="50" cy="50" r="44" fill="#f1f3f5" stroke="${INK}" stroke-width="5"/>
    <g class="sf-blades" style="transform-origin: 50px 50px"><ellipse cx="50" cy="28" rx="10" ry="20" fill="#74c0fc"/><ellipse cx="50" cy="72" rx="10" ry="20" fill="#74c0fc"/><ellipse cx="28" cy="50" rx="20" ry="10" fill="#74c0fc"/><ellipse cx="72" cy="50" rx="20" ry="10" fill="#74c0fc"/></g>
    <path d="M10 50 h80 M50 10 v80 M22 22 l56 56 M78 22 l-56 56" stroke="${INK}" stroke-width="2" opacity="0.5"/><circle cx="50" cy="50" r="8" fill="${INK}"/>
    <rect x="45" y="94" width="10" height="68" fill="${INK}"/><rect x="18" y="160" width="64" height="14" rx="7" fill="#868e96" stroke="${INK}" stroke-width="3"/>`),
  table: svg(200, 110, `<rect x="4" y="6" width="192" height="18" rx="6" fill="#c08457" stroke="${INK}" stroke-width="4"/>
    <path d="M24 24 v80 M176 24 v80" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`),
  lighter: svg(50, 100, `<path d="M25 6 q12 14 0 26 q-12 -12 0 -26 z" fill="#ff922b"/><rect x="10" y="30" width="30" height="16" rx="3" fill="#adb5bd" stroke="${INK}" stroke-width="3"/>
    <rect x="8" y="44" width="34" height="50" rx="8" fill="#f03e3e" stroke="${INK}" stroke-width="4"/>`),
  marble: svg(40, 40, `<circle cx="20" cy="20" r="16" fill="#4dabf7" stroke="${INK}" stroke-width="3"/><circle cx="14" cy="14" r="5" fill="#fff" opacity="0.8"/>`),
  toybox: svg(140, 110, `<g class="sf-boxtoys"><circle cx="46" cy="30" r="14" fill="#4dabf7"/><rect x="74" y="14" width="26" height="26" rx="4" fill="#ffd43b"/></g>
    <rect x="6" y="34" width="128" height="72" rx="10" fill="#ff8787" stroke="${INK}" stroke-width="5"/><path d="M6 54 h128" stroke="${INK}" stroke-width="3"/><circle cx="70" cy="78" r="10" fill="#fff" opacity="0.8"/>`),
  stairs: svg(200, 200, `<path d="M10 196 V160 H58 V122 H106 V84 H154 V46 H196 V196 Z" fill="#e9ecef" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path class="sf-rail" d="M20 112 L178 6" stroke="#c08457" stroke-width="12" stroke-linecap="round"/><path d="M34 104 v58 M82 72 v52 M130 40 v46" stroke="#c08457" stroke-width="6"/>`),
  helmet: svg(100, 70, `<path d="M8 58 q0 -52 46 -52 q38 0 40 52 z" fill="#ff6b6b" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M30 20 q14 -8 30 -4" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="4" y="54" width="92" height="10" rx="5" fill="${INK}"/>`),
  carseat: svg(140, 180, `<path d="M20 10 q50 -8 100 0 v120 h-100 z" fill="#5c7cfa" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <rect x="6" y="120" width="128" height="54" rx="14" fill="#4263eb" stroke="${INK}" stroke-width="5"/>`),
  belt: svg(60, 100, `<path d="M10 6 L50 90" stroke="#343a40" stroke-width="12" stroke-linecap="round"/><rect x="36" y="78" width="22" height="16" rx="3" fill="#ced4da" stroke="${INK}" stroke-width="3"/>`),
  door: svg(120, 200, `<rect x="8" y="6" width="104" height="190" rx="6" fill="#a9714b" stroke="${INK}" stroke-width="5"/>
    <rect x="22" y="22" width="76" height="70" rx="4" fill="#c08457" stroke="${INK}" stroke-width="3"/><rect x="22" y="108" width="76" height="72" rx="4" fill="#c08457" stroke="${INK}" stroke-width="3"/>
    <circle cx="94" cy="104" r="7" fill="#ffd43b" stroke="${INK}" stroke-width="3"/><circle cx="60" cy="40" r="6" fill="#e7f5ff" stroke="${INK}" stroke-width="2"/>`),
  // S2: 🛒 💧 🐕
  cashier: emo('👩'), fish: emo('🐟'), dog: emo('🐕'),
  aisle: svg(130, 200, `<rect x="6" y="6" width="118" height="190" rx="6" fill="#e9ecef" stroke="${INK}" stroke-width="5"/>
    <path d="M6 66 h118 M6 128 h118" stroke="${INK}" stroke-width="5"/>
    <g stroke="${INK}" stroke-width="2"><rect x="16" y="26" width="22" height="38" rx="3" fill="#ff8787"/><rect x="44" y="34" width="20" height="30" rx="3" fill="#ffd43b"/><rect x="70" y="22" width="22" height="42" rx="3" fill="#74c0fc"/><rect x="98" y="34" width="18" height="30" rx="3" fill="#8ce99a"/>
    <rect x="16" y="94" width="26" height="32" rx="3" fill="#ffa94d"/><rect x="48" y="86" width="20" height="40" rx="3" fill="#b197fc"/><rect x="74" y="96" width="20" height="30" rx="3" fill="#ff8787"/><rect x="100" y="90" width="16" height="36" rx="3" fill="#ffd43b"/>
    <rect x="16" y="154" width="20" height="36" rx="3" fill="#8ce99a"/><rect x="42" y="160" width="28" height="30" rx="3" fill="#74c0fc"/><rect x="76" y="150" width="18" height="40" rx="3" fill="#ffa94d"/><rect x="100" y="158" width="16" height="32" rx="3" fill="#b197fc"/></g>`),
  cart: svg(120, 110, `<path d="M6 12 h18 l14 62 h66 l10 -46 H30" fill="#d0ebff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M44 40 v28 M64 36 v32 M84 36 v32" stroke="${INK}" stroke-width="3"/><circle cx="46" cy="94" r="10" fill="#495057"/><circle cx="96" cy="94" r="10" fill="#495057"/>`),
  toyshelf: svg(140, 160, `<rect x="6" y="6" width="128" height="150" rx="6" fill="#fff3bf" stroke="${INK}" stroke-width="5"/><path d="M6 80 h128" stroke="${INK}" stroke-width="5"/>
    <circle cx="36" cy="58" r="18" fill="#ff6b6b" stroke="${INK}" stroke-width="3"/><rect x="66" y="34" width="26" height="42" rx="4" fill="#4dabf7" stroke="${INK}" stroke-width="3"/><path d="M100 76 l14 -40 l14 40 z" fill="#69db7c" stroke="${INK}" stroke-width="3"/>
    <rect x="18" y="112" width="44" height="40" rx="6" fill="#ffa94d" stroke="${INK}" stroke-width="3"/><circle cx="96" cy="132" r="18" fill="#b197fc" stroke="${INK}" stroke-width="3"/>`),
  desk: svg(180, 110, `<rect x="4" y="4" width="172" height="18" rx="6" fill="#ced4da" stroke="${INK}" stroke-width="4"/>
    <rect x="12" y="22" width="156" height="84" fill="#63e6be" stroke="${INK}" stroke-width="4"/><rect x="120" y="-2" width="40" height="12" rx="3" fill="#495057"/>
    <circle cx="40" cy="64" r="16" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M34 64 h12 M40 58 v12" stroke="#fa5252" stroke-width="4" stroke-linecap="round"/>`),
  pool: svg(180, 60, `<rect x="2" y="2" width="176" height="58" fill="#4dabf7" opacity="0.88"/><rect x="2" y="2" width="176" height="8" fill="#a5d8ff"/>
    <path d="M14 26 q10 -8 20 0 t20 0 M80 40 q10 -8 20 0 t20 0 M130 24 q10 -8 20 0 t20 0" stroke="#e7f5ff" stroke-width="4" fill="none" stroke-linecap="round"/>
    <rect x="0" y="0" width="8" height="60" fill="#dee2e6" stroke="${INK}" stroke-width="3"/>`),
  pondwater: svg(180, 60, `<path d="M8 10 q82 -14 170 0 V60 H2 Z" fill="#38d9a9" opacity="0.88"/>
    <path d="M20 30 q10 -6 20 0 M90 42 q10 -6 20 0 M130 24 q10 -6 20 0" stroke="#e6fcf5" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M6 60 V20 M14 60 V28 M172 60 V18" stroke="#2f9e44" stroke-width="5" stroke-linecap="round"/><ellipse cx="10" cy="16" rx="4" ry="9" fill="#a9714b"/>`),
  pole: svg(144, 100, `<path d="M6 6 L126 86" stroke="#a9714b" stroke-width="8" stroke-linecap="round"/><circle cx="130" cy="88" r="12" fill="none" stroke="${INK}" stroke-width="4"/>`),
  armbands: svg(120, 50, `<g fill="#ff922b" stroke="${INK}" stroke-width="4"><rect x="6" y="6" width="44" height="38" rx="16"/><rect x="70" y="6" width="44" height="38" rx="16"/></g>`),
  line: svg(200, 14, `<rect x="2" y="2" width="196" height="10" rx="5" fill="#fcc419" stroke="#e67700" stroke-width="2"/>`),
};

export function safetyScreen(app, params = {}) {
  let progress = cleanSafetyState(app.settings.safetyGame);
  let level = progress.level;
  let plan = null; // [{ id, safeLeft }]
  let idx = 0;
  let stars = 0;
  let missed = false; // tình huống này đã nhầm (một lần nhầm là đủ: không còn "đúng ngay lần đầu")
  let misses = 0;
  let nudges = 0;
  let state = 'start';
  let sprites = []; // trạng thái các hình của cảnh hiện tại
  let lastWrong = 0;
  let fixTimer = null;
  let fixReminders = 0;
  let drag = null;

  const name = characterName(app);
  /** Ảnh bố mẹ thay (Góc bố mẹ → Ảnh Siêu nhân an toàn): người, đồ, nền. Chưa có ảnh thì dùng hình vẽ. */
  const pics = { people: new Map(), items: new Map(), bg: new Map() };
  const picUrls = [];
  const badgesBefore = badgesOf(progress);
  const rule = () => RULE_BY_ID.get(plan[idx].id);
  const B = (line) => ({ who: 'bong', line });

  const scene = h('div.sf-scene');
  const cards = h('div.sf-cards', { hidden: true });
  const starsEl = h('div.sf-stars', { 'aria-hidden': 'true' });
  const hand = h('span.sf-hand', { text: '👆', 'aria-hidden': 'true', hidden: true });
  const recap = h('div.sf-recap', { hidden: true, 'aria-hidden': 'true' }); // mức 3, bước 2: hình nhỏ nhắc lại bước 1
  const album = h('div.sf-album', { hidden: true }); // hết lượt: huy hiệu chủ đề
  const micEl = h('div.sf-mic', { 'aria-hidden': 'true', text: '🎤', hidden: true }); // "Say it!"
  const talkStar = h('div.sf-talk-star', { 'aria-hidden': 'true', text: '⭐', hidden: true });
  const stopBtn = h('button.sf-btn.sf-stop', { type: 'button', 'aria-label': 'No', dataset: { answer: 'no' }, onclick: () => answer('no') },
    h('span.sf-btn-icon', { text: '✋' }), h('span.sf-btn-text', {}, h('b', { text: NO_BTN[0] }), h('small', { text: NO_BTN[1] })));
  const okBtn = h('button.sf-btn.sf-ok', { type: 'button', 'aria-label': 'Yes', dataset: { answer: 'yes' }, onclick: () => answer('yes') },
    h('span.sf-btn-icon', { text: '👍' }), h('span.sf-btn-text', {}, h('b', { text: YES_BTN[0] }), h('small', { text: YES_BTN[1] })));
  // Bé 3 tuổi chưa đọc phụ đề: câu giải thích + việc cần làm đọc thêm bằng giọng tiếng Việt (Cài đặt, mặc định bật).
  const viVoice = app.settings.safetyVi !== false;
  const BV = (line) => ({ who: 'bong', line, viVoice });

  const kit = jobScreen(app, {
    job: JOB, className: 'sf-play', stageClass: 'sf-stage', title: '🦸 Safety Hero', helperLabel: name, cap: 'hero',
    backTo: 'play', backLabel: 'Trò chơi', resetLabel: 'Chơi lại tình huống',
    onReset: () => restartRule(),
    onHelper: () => repeatPrompt(),
    nudge: {
      ready: () => (state === 'ask' || state === 'pick') && nudges < MAX_NUDGES,
      key: () => stepKey(),
      fire: (rearm) => {
        nudges += 1;
        snap();
        kit.talk([state === 'pick' ? B(WHICH_LINE) : BV(rule().ask)]).then(rearm);
      },
    },
  });
  const { stage, count, talk } = kit;
  stage.append(scene, cards, starsEl, recap, album, micEl, talkStar);
  kit.trayEl.append(stopBtn, okBtn);
  const stepKey = () => `${kit.epoch}:${idx}:${state}`;

  function setState(s) {
    state = s;
    const choosing = s === 'ask';
    kit.setState(s, choosing);
    kit.trayEl.classList.toggle('off', !(level === 1 && (s === 'ask' || s === 'right')));
    for (const b of [stopBtn, okBtn]) b.disabled = !choosing;
  }
  const snap = () => saveSnap(JOB, { level, plan, idx, stars, missed, nudges, step: state === 'fix' ? 'fix' : 'ask' });

  /** Âm mở đầu tình huống: chuông cửa / chuông báo cháy (ngắn, vừa tai). */
  function playCue(r) {
    if (r.sound === 'doorbell') play('doorbell');
    if (r.sound === 'alarm') play('ring');
  }

  // ---------- Vẽ cảnh ----------
  const spriteEl = (id, root = scene) => root.querySelector(`.sf-sp[data-id="${id}"]`);
  function drawSprite(s, opts = {}) {
    const person = s.k === 'bong' || ADULTS.has(s.k);
    const art = s.k === 'bong' ? { ar: 1, svg: bongSvg({ mood: 'happy' }) }
      : ADULTS.has(s.k) ? { ar: 0.8, svg: familySvg(s.k, 'happy') } : ART[s.k] ?? emo('❓');
    const url = (person ? pics.people : pics.items).get(s.k);
    const el = h(`div.sf-sp.sf-${s.k}`, {
      dataset: { id: s.id, k: s.k },
      style: { left: `${s.x}%`, top: `${s.y}%`, height: `${s.h}%`, aspectRatio: String(art.ar), '--h': String(s.h) },
      hidden: Boolean(s.hidden),
    });
    // Ảnh của bố mẹ nằm gọn trong khung của hình vẽ (giữ nguyên chỗ chạm / chỗ thả).
    if (url) el.append(h('img.sf-img', { src: url, alt: '', draggable: false }));
    else if (art.emoji) el.append(h('span.sf-emo', { text: art.emoji, 'aria-hidden': 'true' }));
    else el.innerHTML = art.svg;
    for (const c of String(s.cls ?? '').split(' ').filter(Boolean)) el.classList.add(c);
    if (s.k === 'bong' && !opts.mini) el.classList.add('caped');
    return el;
  }
  function drawScene(root, list, sceneCls, rl, opts) {
    root.dataset.scene = rl.scene;
    root.className = `sf-scene${opts?.mini ? ' mini' : ''}`;
    const bg = pics.bg.get(rl.scene);
    root.style.backgroundImage = bg ? `url("${bg}")` : '';
    root.classList.toggle('pic', Boolean(bg));
    for (const c of sceneCls) root.classList.add(c);
    root.replaceChildren(...list.map((s) => drawSprite(s, opts)));
  }
  function renderStars() {
    starsEl.replaceChildren(...plan.map((_, i) => h(`span.sf-star${i < stars ? '.on' : ''}`, { text: i < stars ? '⭐' : '☆' })));
  }
  function place(id, x, y, ms = MOVE_MS) {
    const s = sprites.find((p) => p.id === id);
    if (!s) return;
    Object.assign(s, { x, y });
    const el = spriteEl(id);
    if (!el) return;
    el.style.transitionDuration = `${Math.round(scaled(ms))}ms`;
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
  }

  // ---------- Tình huống ----------
  async function startRule(resume = null) {
    const e = kit.epoch;
    const r = rule();
    misses = 0;
    missed = resume?.missed ?? false;
    nudges = resume?.nudges ?? 0;
    clearFixTimer();
    count.textContent = `${idx + 1}/${plan.length}`;
    renderStars();
    cards.hidden = true;
    cards.replaceChildren();
    scene.hidden = false;
    hand.hidden = true;
    showRecap();
    app.root.dataset.rule = r.id; // cho test
    app.root.dataset.kind = r.kind;
    if (resume?.step === 'fix') {
      // Ra nền ở bước sửa: cảnh tĩnh lúc Bông đứng trước đồ vật, rồi nhắc lại việc cần làm.
      ({ sprites } = applyOps(sceneStart(r), [['move', 'bong', r.walk, 94]]));
      drawScene(scene, sprites, [], r);
      startFix(true);
      return;
    }
    sprites = sceneStart(r);
    drawScene(scene, sprites, [], r);
    setState(level === 1 ? 'ask' : 'intro');
    snap();
    if (level === 1) {
      playCue(r);
      // Bông đi chậm tới đồ vật trong lúc hỏi; bé chạm lúc nào cũng được. Tới nơi mà bé chưa chọn: "Should I?".
      place('bong', r.walk, 94, WALK_MS);
      spriteEl('bong')?.classList.add('walk');
      await Promise.all([talk([BV(r.ask)]), wait(WALK_MS)]);
      spriteEl('bong')?.classList.remove('walk');
      if (e !== kit.epoch || state !== 'ask') return;
      await talk([B(SHOULD_I_LINE)]);
      if (e === kit.epoch && state === 'ask') kit.armNudge();
      return;
    }
    // Mức 2–3: Bông hỏi, rồi hai tranh: "Which one is safe?". Mức 3: mở chuyện / "What next?" trước câu hỏi.
    const { step } = plan[idx];
    if (!resume && step === 1) await talk([BV(STORY_LINE)]);
    if (!resume && step === 2) await talk([BV(NEXT_LINE)]);
    if (e !== kit.epoch) return;
    playCue(r);
    place('bong', r.walk, 94, resume ? 0 : WALK_MS);
    if (!resume) await Promise.all([talk([BV(r.ask)]), wait(WALK_MS)]);
    if (e !== kit.epoch) return;
    showCards();
    setState('pick');
    snap();
    await talk([B(WHICH_LINE)]);
    if (e === kit.epoch && state === 'pick') kit.armNudge();
  }

  function showCards() {
    const r = rule();
    const { safeLeft } = plan[idx];
    const card = (which) => {
      const { sprites: list, scene: cls } = sceneAt(r, which);
      const mini = h('div.sf-scene');
      drawScene(mini, list, cls, r, { mini: true });
      return h('button.sf-card', {
        type: 'button', dataset: { safe: String(which === 'safe') },
        'aria-label': which === 'safe' ? 'Tranh an toàn' : 'Tranh chưa an toàn',
        onclick: (ev) => pickCard(which === 'safe', ev.currentTarget),
      }, mini);
    };
    const pair = [card('safe'), card('risky')];
    cards.replaceChildren(...(safeLeft ? pair : pair.reverse()));
    cards.hidden = false;
    scene.hidden = true;
    recap.hidden = true;
  }

  // ---------- Chọn (mức 1: ✋ / 👍; mức 2: tranh) ----------
  async function answer(choice) {
    if (state !== 'ask') return;
    const r = rule();
    if (choice === r.kind) {
      right();
      return;
    }
    wrongTap(() => {
      // Bông đứng sững như tượng ngay chỗ đang đứng (không đi tiếp, không chạm đồ vật); đồ vật lóe lên gợi ý.
      const el = spriteEl('bong');
      if (el) {
        const { left, top } = getComputedStyle(el);
        el.style.transitionDuration = '0ms';
        el.style.left = left;
        el.style.top = top;
        el.classList.remove('walk');
        restartAnim(el, 'freeze');
      }
      restartAnim(spriteEl(r.set[0].id), 'glow');
      return [BV(r.hint), ...(misses >= 2 ? [B(r.kind === 'no' ? ANSWER_NO_LINE : ANSWER_YES_LINE)] : [])];
    }, () => misses >= 2 && restartAnim(r.kind === 'no' ? stopBtn : okBtn, 'nudge'));
  }
  function pickCard(safe, el) {
    if (state !== 'pick') return;
    if (safe) {
      el.classList.add('chosen');
      right();
      return;
    }
    wrongTap(() => {
      restartAnim(el, 'shake');
      el.classList.add('dim');
      return [BV(rule().look), ...(misses >= 2 ? [B(ANSWER_CARD_LINE)] : [])];
    }, () => misses >= 2 && restartAnim(cards.querySelector('.sf-card[data-safe="true"]'), 'nudge'));
  }
  /** Nhầm: không âm "sai", tính một lần nhầm; Bông gợi ý rồi hỏi lại (nút / tranh vẫn chọn được). */
  async function wrongTap(effect, after) {
    const now = Date.now();
    if (now - lastWrong < WRONG_LOCK_MS) return;
    lastWrong = now;
    misses += 1;
    missed = true;
    snap();
    kit.clearNudge();
    const lines = effect();
    after();
    const k = stepKey();
    await talk(lines);
    if (k === stepKey()) kit.armNudge();
  }

  async function right() {
    const e = kit.epoch;
    const r = rule();
    const was = state;
    setState('right');
    kit.clearNudge();
    kit.talk([]); // dừng câu đang nói
    play('sparkle');
    const bong = spriteEl('bong');
    if (was === 'ask' && bong) {
      // Phanh két (🚫) / nhảy vui (✅) ngay chỗ đang đứng; rồi về chỗ đứng trước đồ vật (không chạm đồ).
      const { left, top } = getComputedStyle(bong);
      bong.style.transitionDuration = '0ms';
      bong.style.left = left;
      bong.style.top = top;
      bong.classList.remove('walk');
      restartAnim(bong, r.kind === 'no' ? 'brake' : 'hop');
    }
    await talk(rightLines(r).map(BV));
    if (e !== kit.epoch) return;
    if (level >= 2) {
      cards.hidden = true;
      cards.replaceChildren();
      scene.hidden = false;
      showRecap();
    }
    place('bong', r.walk, 94, 0);
    startFix(false);
  }

  // ---------- Thao tác sửa ----------
  function fixTargets() {
    const { fix } = rule();
    return { target: spriteEl(fix.target), item: fix.how === 'drag' ? spriteEl(fix.item) : null };
  }
  async function startFix(resumed) {
    const e = kit.epoch;
    const r = rule();
    for (const id of r.reveal ?? []) {
      const s = sprites.find((p) => p.id === id);
      if (s) s.hidden = false;
      const el = spriteEl(id);
      if (el) el.hidden = false;
    }
    setState('fix');
    snap();
    const { target, item } = fixTargets();
    target?.classList.add('sf-target');
    item?.classList.add('sf-drag');
    showHand();
    if (!resumed) restartAnim(item ?? target, 'nudge');
    await talk([BV(r.fix.say)]);
    if (e !== kit.epoch || state !== 'fix') return;
    fixReminders = 0;
    armFixTimer(FIX_FIRST_MS);
  }
  /** Mức 1: bàn tay 👆 chỉ chỗ cần chạm / đồ cần kéo. */
  function showHand() {
    const { target, item } = fixTargets();
    const at = item ?? target;
    if (level !== 1 || !at) return;
    const s = sprites.find((p) => p.id === at.dataset.id);
    Object.assign(hand.style, { left: `${s.x}%`, top: `${s.y}%` });
    hand.hidden = false;
    scene.append(hand);
  }
  function clearFixTimer() {
    clearTimeout(fixTimer);
    fixTimer = null;
  }
  /** Bé chưa làm gì: nhắc nhẹ (tối đa 3 lần), rồi chỉ nhún; không làm hộ, không tính nhầm. */
  function armFixTimer(ms) {
    clearFixTimer();
    const k = stepKey();
    fixTimer = setTimeout(async () => {
      if (k !== stepKey() || state !== 'fix' || kit.signal.aborted) return;
      const { target, item } = fixTargets();
      restartAnim(item ?? target, 'nudge');
      if (drag || kit.talking || app.idlePaused) {
        armFixTimer(FIX_AGAIN_MS);
        return;
      }
      if (fixReminders < FIX_REMINDERS) {
        fixReminders += 1;
        await talk([BV(rule().fix.say)]);
      }
      if (k === stepKey()) armFixTimer(FIX_AGAIN_MS);
    }, scaled(ms));
  }
  /** Chạm chỗ khác lúc sửa: không tính nhầm, Bông nhắc lại việc cần làm. */
  async function fixElsewhere() {
    const now = Date.now();
    if (now - lastWrong < WRONG_LOCK_MS || kit.talking) return;
    lastWrong = now;
    const { target, item } = fixTargets();
    restartAnim(item ?? target, 'nudge');
    await talk([BV(rule().fix.say)]);
  }

  scene.addEventListener('pointerdown', (ev) => {
    if (state !== 'fix' || ev.button > 0) return;
    const r = rule();
    const sp = ev.target.closest('.sf-sp');
    const id = sp?.dataset.id;
    if (r.fix.how === 'tap') {
      if (id === r.fix.target) fixDone();
      else fixElsewhere();
      return;
    }
    if (id !== r.fix.item) {
      fixElsewhere();
      return;
    }
    ev.preventDefault();
    const rect = sp.getBoundingClientRect();
    drag = { el: sp, pointerId: ev.pointerId, x0: ev.clientX, y0: ev.clientY, moved: false, rect };
  }, { signal: kit.signal });
  window.addEventListener('pointermove', (ev) => {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const dx = ev.clientX - drag.x0;
    const dy = ev.clientY - drag.y0;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_START_PX) return;
    drag.moved = true;
    ev.preventDefault();
    drag.el.classList.add('dragging');
    drag.el.style.translate = `calc(-50% + ${dx}px) calc(-100% + ${dy}px)`; // vị trí gốc là translate -50% -100% (CSS)
  }, { signal: kit.signal, passive: false });
  window.addEventListener('pointerup', (ev) => {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const d = drag;
    drag = null;
    d.el.classList.remove('dragging');
    d.el.style.translate = '';
    if (state !== 'fix') return;
    // Bé 3 tuổi: chạm (không kéo) vào đồ cần kéo cũng được; kéo thì phải thả gần đích.
    if (!d.moved || overTarget(ev.clientX, ev.clientY)) fixDone();
    else fixElsewhere();
  }, { signal: kit.signal });
  window.addEventListener('pointercancel', () => {
    if (!drag) return;
    drag.el.classList.remove('dragging');
    drag.el.style.translate = '';
    drag = null;
  }, { signal: kit.signal });
  function overTarget(x, y) {
    const t = spriteEl(rule().fix.target)?.getBoundingClientRect();
    if (!t) return false;
    const px = t.width * HIT_PAD;
    const py = t.height * HIT_PAD;
    return x >= t.left - px && x <= t.right + px && y >= t.top - py && y <= t.bottom + py;
  }

  async function fixDone() {
    if (state !== 'fix') return;
    const e = kit.epoch;
    const r = rule();
    clearFixTimer();
    kit.clearNudge();
    hand.hidden = true;
    setState('fixed');
    for (const el of scene.querySelectorAll('.sf-target, .sf-drag')) el.classList.remove('sf-target', 'sf-drag');
    // Ghi ngay khi tình huống xong (một lần): seen +1, đúng ngay lần đầu → firstOk; tiến độ "Bé đã học".
    progress = afterRule(progress, r.id, { firstTry: !missed });
    app.setSetting('safetyGame', progress).catch(() => {});
    // Không bao giờ trừ: ghi đúng / sai, chỉ +1 khi đúng ngay lần đầu (như chọn hình ở trò D).
    markPhrasePick(app, `safe:${r.id}`, r.emoji, { firstTry: !missed, award: !missed });
    stars += 1;
    saveSnap(JOB, { level, plan, idx: idx + 1, stars, missed: false, nudges: 0, step: 'ask' });
    play('sparkle');
    await runOps([...(r.fix.how === 'drag' ? dragOps(r) : []), ...r.done]);
    if (e !== kit.epoch) return;
    renderStars();
    restartAnim(starsEl.children[stars - 1], 'pop');
    await talk([B(r.short)]);
    if (e !== kit.epoch) return;
    await sayIt(r);
    if (e !== kit.epoch) return;
    await wait(400);
    if (e !== kit.epoch) return;
    idx += 1;
    if (idx >= plan.length) heroEnd();
    else startRule();
  }
  /** Việc sau thao tác sửa: di chuyển / hiện / ẩn / thêm class, lần lượt. */
  async function runOps(ops) {
    for (const [op, id, a, b] of ops) {
      const s = sprites.find((p) => p.id === id);
      const el = spriteEl(id);
      if (op === 'scene') scene.classList.add(id);
      else if (op === 'move') {
        place(id, a, b);
        await wait(MOVE_MS);
      } else if (op === 'show') {
        if (s) s.hidden = false;
        if (el) {
          el.hidden = false;
          restartAnim(el, 'pop');
        }
      } else if (op === 'hide') {
        if (s) s.hidden = true;
        if (el) el.hidden = true;
      } else if (op === 'add') {
        if (s) s.cls = [s.cls, a].filter(Boolean).join(' ');
        if (el) restartAnim(el, a);
        if (a === 'worn' || a === 'off' || a === 'click') play('click');
      }
    }
  }

  // ---------- Hết lượt ----------
  async function heroEnd() {
    const e = kit.epoch;
    setState('hero');
    count.textContent = `${plan.length}/${plan.length}`;
    play('tada');
    const bong = spriteEl('bong');
    bong?.classList.remove('sleep', 'hold');
    if (bong) restartAnim(bong, 'fly');
    await talk([B(THANKS_LINE)]);
    if (e !== kit.epoch) return;
    await showAlbum();
    if (e !== kit.epoch) return;
    finishRound();
  }
  /** Album huy hiệu (mục 6): mỗi chủ đề một huy hiệu — thành tích chơi game, không phải chứng nhận. Chưa có huy hiệu nào thì bỏ qua. */
  async function showAlbum() {
    const have = badgesOf(progress);
    if (!have.length) return;
    const fresh = have.filter((t) => !badgesBefore.includes(t));
    album.replaceChildren(h('div.sf-album-row', {}, ...TOPIC_IDS.map((t) => h(`span.sf-badge${have.includes(t) ? '.on' : ''}${fresh.includes(t) ? '.new' : ''}`, {
      dataset: { topic: t }, title: TOPICS[t].vi,
    }, h('span.sf-badge-emoji', { text: TOPICS[t].emoji }), h('small', { text: TOPICS[t].en })))));
    album.hidden = false;
    for (const el of album.querySelectorAll('.sf-badge.new')) restartAnim(el, 'pop');
    if (fresh.length) {
      play('tada');
      await talk([BV(NEW_BADGE_LINE)]);
    } else await wait(ALBUM_MS);
  }

  /** Mức 3, bước 2: hình nhỏ cảnh an toàn của bước 1 (bé không phải nhớ bước trước). */
  function showRecap() {
    const p = plan?.[idx];
    const prev = p?.step === 2 ? plan[idx - 1] : null;
    recap.hidden = !prev;
    if (!prev) return;
    const pr = RULE_BY_ID.get(prev.id);
    const { sprites: list, scene: cls } = sceneAt(pr, 'safe');
    const mini = h('div.sf-scene');
    drawScene(mini, list, cls, pr, { mini: true });
    recap.replaceChildren(mini, h('span.sf-recap-ok', { text: '✅' }));
  }

  /**
   * "Say it!" (mức 3, tùy chọn): chỉ khi bố mẹ bật "Lượt Say it!" và mic đã sẵn sàng từ trước — không bao giờ xin quyền mic.
   * Bông nói câu ngắn, nghe ≤ 4 giây (không ghi âm). Không tính nhầm, không ảnh hưởng ⭐ / tiến độ / huy hiệu; lỗi gì cũng bỏ qua.
   * Test UI đặt `window.__kidTest.safetyTalkResult` để giả kết quả nghe.
   */
  const talkOn = () => level === 3 && Boolean(app.settings.safetyTalk) && app.mic?.ready && globalThis.__kidTest?.safetyTalk !== false;
  async function sayIt(r) {
    if (!talkOn()) return;
    const e = kit.epoch;
    setState('talk');
    await talk([BV(SAY_IT_LINE), B(r.short)]);
    if (e !== kit.epoch) return;
    micEl.hidden = false;
    let result = null;
    try {
      const forced = globalThis.__kidTest?.safetyTalkResult;
      if (forced === 'error') throw new Error('mic');
      if (forced) {
        await wait(300);
        result = forced;
      } else {
        const onDemand = app.settings.micOnlyWhenListening;
        if (onDemand) await app.mic.start();
        try {
          const cap = new Promise((resolve) => { setTimeout(() => resolve(null), TALK_CAP_MS); });
          const out = await Promise.race([listen({ mic: app.mic, recognizer: app.recognizer, keywords: sayKeywords(r), record: false, maxMs: TALK_MS, signal: kit.signal }), cap]);
          result = out?.result ?? null;
        } finally {
          if (onDemand) app.mic.release();
        }
      }
    } catch {
      result = null; // mic / nhận dạng lỗi: bỏ qua, đi tiếp
    }
    micEl.hidden = true;
    if (e !== kit.epoch) return;
    if (result === RESULT.MATCH) {
      play('ding');
      talkStar.hidden = false;
      restartAnim(talkStar, 'fly');
      await talk([B(GREAT_TALK_LINE)]);
      talkStar.hidden = true;
    } else if (result === RESULT.VOICE) await talk([B(GOOD_LINE), B(r.short)]);
    else if (result === RESULT.SILENT) await talk([B(r.short)]);
  }
  function finishRound() {
    if (state === 'done') return;
    setState('done');
    kit.finishRound(() => {
      clearSnap(JOB);
      progress = afterJobRound(progress, { maxLevel: AUTO_MAX_LEVEL }); // mức 3 chỉ qua khóa mức
      app.setSetting('safetyGame', progress).catch(() => {});
    });
  }

  function restartRule() {
    if (!plan || state === 'done' || state === 'hero' || state === 'empty' || state === 'fixed' || state === 'talk') return; // đã ghi xong tình huống này
    kit.cancelAll();
    clearFixTimer();
    startRule();
  }
  function repeatPrompt() {
    const k = stepKey();
    const again = () => k === stepKey() && (state === 'fix' ? armFixTimer(FIX_AGAIN_MS) : kit.armNudge());
    if (state === 'ask') talk([BV(rule().ask)]).then(again);
    else if (state === 'pick') talk([B(WHICH_LINE)]).then(again);
    else if (state === 'fix') talk([BV(rule().fix.say)]).then(again);
  }

  /** Dưới 3 tình huống (bố mẹ tắt gần hết chủ đề): báo bố mẹ, không vào lượt. */
  function showEmpty() {
    setState('empty');
    count.textContent = '';
    scene.dataset.scene = 'room';
    scene.replaceChildren(drawSprite({ id: 'bong', k: 'bong', x: 50, y: 70, h: 40 }),
      h('p.sf-empty', { text: 'Bố mẹ bật thêm chủ đề trong Cài đặt nhé' }));
    restartAnim(spriteEl('bong'), 'hop');
  }

  async function loadPics() {
    for (const [lessonId, map] of [[SAFETY_PEOPLE_IMAGES, pics.people], [SAFETY_ITEM_IMAGES, pics.items], [SAFETY_BG_IMAGES, pics.bg]]) {
      for (const img of await app.db.getAllByIndex('images', 'lessonId', lessonId).catch(() => [])) {
        const url = URL.createObjectURL(mediaBlob(img));
        picUrls.push(url);
        map.set(img.word, url);
      }
    }
  }

  // Lượt dở (ra nền rồi quay lại): chơi nốt đúng kế hoạch và mức đã lưu, kể cả khi bố mẹ vừa đổi mức / tắt chủ đề (mục 8.2).
  const s = takeSnap(JOB, { continueDirectly: params.continueDirectly });
  loadPics().then(() => {
    if (kit.signal.aborted) return;
    if (s && Array.isArray(s.plan) && s.plan.every((p) => RULE_BY_ID.has(p.id))) {
      plan = s.plan;
      level = s.level;
      stars = s.stars ?? 0;
      idx = Math.min(s.idx, plan.length);
      if (idx >= plan.length) {
        renderStars();
        finishRound();
      } else startRule(s);
      return;
    }
    const opts = { off: progress.off, focus: progress.focus, seen: progress.seen };
    // Mức 3: 2 chuyện × 2 bước; không đủ chuyện (bố mẹ tắt gần hết chủ đề) thì lượt thường, vẫn chơi kiểu chọn tranh.
    plan = (level === 3 && planStory(opts)) || planRound(opts);
    if (globalThis.__kidTest?.safetyPlan) plan = globalThis.__kidTest.safetyPlan; // test UI cố định tình huống
    if (!plan) showEmpty();
    else {
      idx = 0;
      startRule();
    }
  });

  return () => {
    clearFixTimer();
    kit.cleanup();
    picUrls.forEach((u) => URL.revokeObjectURL(u));
  };
}
