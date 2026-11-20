// Trò Đầu bếp nhí (SPEC-jobs3.md mục 5): chú đầu bếp bên trái, khách (bạn thú) bên phải. Mở đầu rửa tay; ca A xếp
// bánh mì kẹp theo thẻ công thức; ca B làm bánh nướng — mỗi động từ một hoạt ảnh rõ (sữa chảy, trứng nứt, thìa khuấy,
// lò đèn cam), bánh còn nóng thì "Hot! Wait!" (không tính nhầm); ca C trang trí bánh (đếm); ca D món nóng – món lạnh
// (SPEC-jobs4 3.1); ca E "Bé đói rồi!" (SPEC-jobs5: bụng kêu → chọn mặt (mức 3) → thực đơn → nấu → ăn cùng Bông);
// mức 2–3 cuối lượt dọn bếp (3.2). Không dao, không lửa bếp.
// Trạng thái: start → wash → enter → layer | serve | bake | hot | decor | temp | feel | menu | cook | fruit | eat ⇄ busy
// → leave → ca sau | clean → done.

import { h } from '../ui.js';
import { bongSvg } from '../bong.js';
import { loadFeedImages, foodFace } from './feed.js';
import { play } from '../speech/sfx.js';
import { markPracticed } from '../player/track.js';
import { listen, RESULT } from '../speech/listen.js';
import { patientSvg } from '../patients.js';
import { PATIENT_BY_ID } from '../doctor.js';
import { cleanJobState, afterJobRound, afterSeen, claims } from '../jobs/levels.js';
import { JOBS_BG_IMAGES } from '../jobs/backgrounds.js';
import { CHEF_SVG, loadPersonImage } from '../jobs/people.js';
import { loadJobItemImages, itemFace } from '../jobs/items.js';
import { SOUND_BY_ID } from '../animal-sounds.js';
import { playSoundFile } from './animal-sounds.js';
import { jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, WRONG_LOCK_MS, MAX_NUDGES } from '../jobs/kit.js';
import {
  MAX_LEVEL, planRound, LAYERS, BAKE_STEPS, TOOLS, DECOR,
  WASH_LINE, COOK_LINE, SANDWICH_LINE, CAKE_LINE, READY_LINE, HOT_LINE, NOW_READY_LINE, THANKS_LINE, ENOUGH_LINE,
  layerCallLine, orderLine, noLine, layerWrongLine, stepLine, verbLine, chainLine, firstLine, toolWrongLine,
  decorAskLine, decorWrongLine, countLine,
  DISHES, CLEAN_ITEMS, PLACES, PLACE_ORDER, tempMatches, feelLine, somethingLine, tempAskLine, tempWrongLine,
  CAREFUL_LINE, PHEW_LINE, BRR_LINE, THANK_YOU_LINE, CLEAN_LINE, ALL_CLEAN_LINE, cleanAskLine, placeWrongLine, itemWrongLine,
  MENU, E_STEPS, E_TOOLS, FEELS, fruitFood, ARE_HUNGRY_LINE, YES_HUNGRY_LINE, HOW_FEEL_LINE, LISTEN_FEEL_LINE, YOU_HUNGRY_LINE,
  feelWrongLine, WANT_LINE, menuLine, chosenLine, eStepLine, eVerbLine, eChainLine, eNextLine, eToolWrongLine,
  fruitOneLine, saladAskLine, fruitWrongLine, noFruitLine, YUMMY_Q_LINE, BONG_YUMMY_LINE, BONG_FULL_LINE,
  TOPPINGS, PIZZA_STEPS, toppingAskLine, toppingWrongLine, sayLine, chosenShortLine, LETS_MAKE_LINE, GREAT_TALK_LINE, GOOD_LINE,
  matchDishAlts, SAY_OR_TOUCH_LINE, TOUCH_ONE_LINE, saidDishLine,
} from '../jobs/chef.js';

const JOB = 'chef';
const ENTER_MS = 650;
const LEAVE_MS = 600;
const ANIM_MS = 900; // hoạt ảnh một động từ
const OVEN_MS = 2000;
const HOT_MS = 2000;
const EAT_IDLE_MS = 5000; // ca E: 5 giây không chạm thì món tự hết (SPEC-jobs5 4.3)
const BITES = 3;
const ACTIVE = ['wash', 'layer', 'serve', 'bake', 'decor', 'temp', 'clean', 'feel', 'menu', 'cook', 'fruit'];
const TRAY_STATES = ['layer', 'decor', 'temp', 'fruit', 'topping'];
const TALK_MS = 4000; // lượt nói: nghe tối đa ~4 giây, giới hạn cứng 6 giây (SPEC-jobs5 mục 5)
const TALK_CAP_MS = 6000;
const IM_HUNGRY_LINE = ["I'm hungry!", 'Con đói rồi!'];
/** Chỗ đặt nhân trên mặt pizza (phần trăm khung). */
const PIZZA_SPOTS = [[34, 36], [64, 34], [50, 58], [30, 64], [70, 64]];
const INK = '#3d2c5e';
const BOWL_SVG = `<svg viewBox="0 0 120 80" aria-hidden="true"><path class="cf-batter" d="M14 30 H106 Q100 72 60 74 Q20 72 14 30 Z" fill="#fff3bf"/><path class="cf-yolk" d="M48 40 a12 9 0 1 0 24 0 a12 9 0 1 0 -24 0" fill="#ffd43b"/><path d="M6 28 H114 Q108 78 60 78 Q12 78 6 28 Z" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M6 28 H114" stroke="#74c0fc" stroke-width="9" stroke-linecap="round" opacity="0.7"/></svg>`;
const OVEN_SVG = `<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="6" y="6" width="108" height="108" rx="14" fill="#dee2e6" stroke="${INK}" stroke-width="5"/><rect x="6" y="6" width="108" height="22" rx="10" fill="#adb5bd" stroke="${INK}" stroke-width="4"/><circle cx="26" cy="17" r="5" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="44" cy="17" r="5" fill="#fff" stroke="${INK}" stroke-width="2"/><circle class="cf-oven-lamp" cx="98" cy="17" r="5" fill="#868e96"/><rect class="cf-oven-door" x="18" y="40" width="84" height="62" rx="8" fill="#495057" stroke="${INK}" stroke-width="4"/><rect x="30" y="46" width="60" height="6" rx="3" fill="#ced4da"/></svg>`;
const CAKE_SVG = `<svg viewBox="0 0 160 110" aria-hidden="true"><ellipse cx="80" cy="98" rx="76" ry="10" fill="#e9ecef" stroke="${INK}" stroke-width="4"/><path d="M18 46 H142 V90 Q80 102 18 90 Z" fill="#f8d66d" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M18 46 Q80 26 142 46 Q132 62 118 52 Q104 64 92 52 Q80 64 68 52 Q56 64 44 52 Q30 62 18 46 Z" fill="#fff0f6" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></svg>`;
const PLATE_SVG = `<svg viewBox="0 0 160 40" aria-hidden="true"><ellipse cx="80" cy="22" rx="76" ry="15" fill="#fff" stroke="${INK}" stroke-width="5"/><ellipse cx="80" cy="20" rx="50" ry="8" fill="none" stroke="#dee2e6" stroke-width="3"/></svg>`;
/** Chỗ đặt đồ trang trí trên mặt bánh (phần trăm khung bánh). */
const DECOR_SPOTS = [[20, 34], [38, 28], [56, 26], [74, 28], [88, 36]];
/**
 * Lớp bánh mì kẹp trên đĩa: vẽ nằm ngang nhìn từ bên cạnh (lát mỏng đè lên nhau như bánh thật), không dùng emoji / ảnh
 * nhìn từ trên xuống (chồng lên thành cái tháp). Bánh mì dưới cùng phẳng, bánh mì phía trên vòm.
 */
const side = (body) => `<svg viewBox="0 0 200 44" aria-hidden="true" preserveAspectRatio="xMidYMax meet">${body}</svg>`;
const LAYER_SIDE = {
  breadBottom: side(`<rect x="12" y="10" width="176" height="30" rx="10" fill="#d9944a" stroke="${INK}" stroke-width="4"/><rect x="20" y="14" width="160" height="18" rx="6" fill="#ffe8b8"/>`),
  breadTop: side(`<path d="M12 40 V24 Q12 4 44 6 H156 Q188 4 188 24 V40 Z" fill="#d9944a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M20 34 V25 Q20 12 46 13 H154 Q180 12 180 25 V34 Z" fill="#ffe8b8"/>`),
  cheese: side(`<path d="M8 24 H192 V32 L182 42 L174 32 H118 L110 40 L102 32 H40 L32 42 L24 32 H8 Z" fill="#ffd43b" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><circle cx="70" cy="28" r="2.5" fill="#f59f00"/><circle cx="150" cy="28" r="2.5" fill="#f59f00"/>`),
  tomato: side(`<g stroke="${INK}" stroke-width="4"><ellipse cx="52" cy="30" rx="42" ry="12" fill="#ff6b6b"/><ellipse cx="148" cy="30" rx="42" ry="12" fill="#ff6b6b"/><ellipse cx="100" cy="28" rx="42" ry="13" fill="#fa5252"/></g><g fill="#ffe066"><circle cx="88" cy="30" r="2.5"/><circle cx="100" cy="28" r="2.5"/><circle cx="112" cy="30" r="2.5"/></g>`),
  lettuce: side(`<path d="M2 30 Q14 16 26 28 Q38 16 50 28 Q62 16 74 28 Q86 16 98 28 Q110 16 122 28 Q134 16 146 28 Q158 16 170 28 Q182 16 198 30 Q186 42 170 38 Q150 44 128 38 Q100 44 72 38 Q50 44 30 38 Q14 42 2 30 Z" fill="#69db7c" stroke="#2b8a3e" stroke-width="4" stroke-linejoin="round"/>`),
  egg: side(`<path d="M10 34 Q12 24 34 26 Q50 18 70 24 Q100 18 130 24 Q150 18 168 26 Q190 24 190 34 Q190 42 100 42 Q10 42 10 34 Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M76 26 Q100 6 124 26 Z" fill="#ffd43b" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`),
};
/** Món ca D (viewBox 100 × 100): món nóng có 3 sợi hơi to, món lạnh có đá — nhìn là biết (SPEC-jobs4 3.1). */
const STEAM = `<path d="M34 30 Q28 20 34 10 M50 28 Q44 16 50 4 M66 30 Q60 20 66 10" fill="none" stroke="#adb5bd" stroke-width="5" stroke-linecap="round"/>`;
const ICE = `<rect x="28" y="40" width="16" height="16" rx="3" fill="#e7f5ff" stroke="#74c0fc" stroke-width="3" transform="rotate(-12 36 48)"/><rect x="52" y="44" width="16" height="16" rx="3" fill="#e7f5ff" stroke="#74c0fc" stroke-width="3" transform="rotate(10 60 52)"/>`;
const DISH_SVG = {
  soup: `${STEAM}<path d="M10 52 H90 Q86 92 50 92 Q14 92 10 52 Z" fill="#ff922b" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M10 52 H90" stroke="${INK}" stroke-width="5"/><ellipse cx="50" cy="56" rx="34" ry="6" fill="#ffc078"/>`,
  'hot-milk': `${STEAM}<path d="M24 40 H72 V84 Q72 94 62 94 H34 Q24 94 24 84 Z" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M72 52 Q92 52 90 66 Q88 78 72 76" fill="none" stroke="${INK}" stroke-width="5"/><path d="M28 48 H68" stroke="#ffe8cc" stroke-width="6"/>`,
  'ice-cream': `<path d="M32 50 L50 96 L68 50 Z" fill="#e8b384" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><circle cx="40" cy="40" r="15" fill="#ffc9de" stroke="${INK}" stroke-width="4"/><circle cx="60" cy="40" r="15" fill="#d0ebff" stroke="${INK}" stroke-width="4"/><circle cx="50" cy="24" r="14" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="M78 14 l6 6 M84 14 l-6 6 M81 10 v14" stroke="#74c0fc" stroke-width="3" stroke-linecap="round"/>`,
  'cold-milk': `<path d="M28 18 H72 L66 94 H34 Z" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>${ICE}<path d="M80 12 l6 6 M86 12 l-6 6 M83 8 v14" stroke="#74c0fc" stroke-width="3" stroke-linecap="round"/>`,
  'cold-water': `<path d="M28 18 H72 L66 94 H34 Z" fill="#d0ebff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>${ICE}<path d="M80 12 l6 6 M86 12 l-6 6 M83 8 v14" stroke="#74c0fc" stroke-width="3" stroke-linecap="round"/>`,
};
/** Ba chỗ cất của Dọn bếp (viewBox 100 × 120), khác dáng hẳn nhau: bồn rửa thấp có vòi — tủ lạnh cao trắng — tủ bát gỗ hai cánh. */
const PLACE_SVG = {
  sink: `<svg viewBox="0 0 100 120" aria-hidden="true"><path d="M50 40 V24 Q50 14 62 14 H70" fill="none" stroke="#868e96" stroke-width="7" stroke-linecap="round"/><rect x="6" y="56" width="88" height="56" rx="8" fill="#dee2e6" stroke="${INK}" stroke-width="5"/><path d="M16 62 H84 Q80 92 50 92 Q20 92 16 62 Z" fill="#a5d8ff" stroke="${INK}" stroke-width="4"/></svg>`,
  fridge: `<svg viewBox="0 0 100 120" aria-hidden="true"><rect x="16" y="4" width="68" height="112" rx="10" fill="#f8f9fa" stroke="${INK}" stroke-width="5"/><path d="M16 44 H84" stroke="${INK}" stroke-width="4"/><rect x="70" y="16" width="6" height="20" rx="3" fill="#868e96"/><rect x="70" y="54" width="6" height="34" rx="3" fill="#868e96"/><path d="M28 18 l6 6 M34 18 l-6 6 M31 14 v14" stroke="#74c0fc" stroke-width="3" stroke-linecap="round"/></svg>`,
  cupboard: `<svg viewBox="0 0 100 120" aria-hidden="true"><rect x="6" y="20" width="88" height="92" rx="8" fill="#e8b384" stroke="${INK}" stroke-width="5"/><path d="M50 20 V112" stroke="${INK}" stroke-width="4"/><circle cx="42" cy="66" r="4" fill="${INK}"/><circle cx="58" cy="66" r="4" fill="${INK}"/><rect x="2" y="10" width="96" height="12" rx="4" fill="#c2855a" stroke="${INK}" stroke-width="4"/></svg>`,
};
/** Bát / cốc đã dùng (có vết bẩn) — emoji 🥣 🍵 trông như bát súp / bát trà đầy, nên vẽ riêng. */
const DIRTY = `<g fill="#c2855a" opacity="0.8"><circle cx="38" cy="58" r="5"/><circle cx="60" cy="64" r="4"/><circle cx="52" cy="52" r="3"/></g>`;
const CLEAN_SVG = {
  bowl: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M10 40 H90 Q86 86 50 86 Q14 86 10 40 Z" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M10 40 H90" stroke="#74c0fc" stroke-width="7" stroke-linecap="round"/>${DIRTY}</svg>`,
  cup: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M22 28 H70 V78 Q70 88 60 88 H32 Q22 88 22 78 Z" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M70 40 Q90 40 88 56 Q86 70 70 68" fill="none" stroke="${INK}" stroke-width="5"/><path d="M22 28 H70" stroke="#ff8787" stroke-width="7" stroke-linecap="round"/>${DIRTY}</svg>`,
};
/**
 * Ca E — cơm nắm trên đôi tay đeo găng (viewBox 120 × 100): scoop → nắm cơm tròn, squeeze → hình tam giác,
 * wrap → rong biển quấn đáy. Mỗi phần hiện theo `data-step` (CSS).
 */
const RICE_BALL_SVG = `<svg viewBox="0 0 120 100" aria-hidden="true"><path class="cf-rb-hands" d="M8 78 Q18 58 60 66 Q102 58 112 78 Q102 96 60 94 Q18 96 8 78 Z" fill="#d0ebff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><ellipse class="cf-rb-blob" cx="60" cy="58" rx="30" ry="16" fill="#fff" stroke="${INK}" stroke-width="4"/><path class="cf-rb-tri" d="M60 16 Q67 16 90 60 Q93 72 80 72 H40 Q27 72 30 60 Q53 16 60 16 Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><g class="cf-rb-grain" fill="#e9ecef"><circle cx="52" cy="44" r="2.5"/><circle cx="64" cy="38" r="2.5"/><circle cx="70" cy="54" r="2.5"/><circle cx="54" cy="58" r="2.5"/></g><rect class="cf-rb-nori" x="42" y="52" width="36" height="21" rx="3" fill="#2b8a3e" stroke="${INK}" stroke-width="3"/></svg>`;
/** Bát salad (viewBox 120 × 80) — quả nằm trong `.cf-sfruits` ở trên miệng bát. */
const SALAD_BOWL_SVG = `<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M6 28 H114 Q108 78 60 78 Q12 78 6 28 Z" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M6 28 H114" stroke="#69db7c" stroke-width="9" stroke-linecap="round" opacity="0.8"/></svg>`;
/** Đồ trên bàn ca E không có emoji hợp: rong biển (lá vuông xanh đậm). */
/** Pizza (viewBox 120 × 120): đế nặn sẵn → sốt đỏ (spread) → phô mai (sprinkle); nhân nằm trong `.cf-pz-tops`. */
const PIZZA_SVG = `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="#f3c47a" stroke="${INK}" stroke-width="5"/><circle class="cf-pz-sauce" cx="60" cy="60" r="43" fill="#e03131"/><g class="cf-pz-cheese" fill="#ffe066">${[[40, 40], [62, 32], [80, 46], [34, 62], [56, 56], [78, 70], [44, 82], [64, 84], [86, 60], [50, 44], [70, 58], [40, 72]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5"/>`).join('')}</g></svg>`;
const E_TOOL_SVG = {
  sauce: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M12 40 H88 Q84 86 50 86 Q16 86 12 40 Z" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><ellipse cx="50" cy="42" rx="36" ry="8" fill="#e03131" stroke="${INK}" stroke-width="4"/></svg>`,
  cheese: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M12 40 H88 Q84 86 50 86 Q16 86 12 40 Z" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><ellipse cx="50" cy="42" rx="36" ry="8" fill="#ffe066" stroke="${INK}" stroke-width="4"/><g fill="#fcc419"><circle cx="38" cy="36" r="4"/><circle cx="54" cy="32" r="4"/><circle cx="64" cy="38" r="4"/></g></svg>`,
  seaweed: `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="16" y="16" width="68" height="68" rx="8" fill="#2b8a3e" stroke="${INK}" stroke-width="5"/><path d="M28 36 H72 M28 52 H72 M28 68 H72" stroke="#51cf66" stroke-width="3" opacity="0.7"/></svg>`,
};
const layerSide = (id, i) => (id === 'bread' ? (i === 0 ? LAYER_SIDE.breadBottom : LAYER_SIDE.breadTop) : LAYER_SIDE[id]);

export function chefScreen(app, params = {}) {
  let progress = cleanJobState(app.settings.chefGame, { maxLevel: MAX_LEVEL });
  const level = progress.level;
  let plan = null;
  let caseIdx = 0;
  let state = 'start';
  let si = 0; // lớp tiếp theo (bánh mì kẹp) / bước tiếp theo (bánh nướng)
  let wrongs = 0;
  let nudges = 0;
  let taken = claims();
  let recorded = new Set();
  let washed = false;
  let lastWrong = { key: '', at: 0 };
  let pics = null; // ảnh món của bố mẹ (Góc bố mẹ → Ảnh Đóng vai); chưa có thì emoji
  let feedPics = null; // ảnh món của Cho Bông ăn (ca E: thẻ thực đơn, quả salad)
  let dish = null; // ca E: món bé chọn
  let eatTok = 0;

  const cur = () => plan?.cases[caseIdx];
  const customer = () => PATIENT_BY_ID.get(plan?.customers?.[caseIdx] ?? 'teddy');
  const C = (line) => ({ who: 'chef', line });
  const K = (line) => ({ who: 'customer', line });
  const B = (line) => ({ who: 'bong', line });
  const hungry = () => cur()?.kind === 'hungry';
  // Trứng ốp (lớp bánh mì kẹp) và quả trứng (làm bánh) là hai ảnh khác nhau.
  const layerFace = (id, tag, props = {}) => itemFace(pics, id === 'egg' ? 'fried-egg' : id, tag, { ...props, text: LAYERS[id].emoji });
  const decorFace = (id, tag, props = {}) => itemFace(pics, id, tag, { ...props, text: DECOR[id].emoji });
  const toolFace = (id, tag) => itemFace(pics, id, tag, { text: TOOLS[id].emoji });
  const dishFace = (id, tag) => itemFace(pics, id, tag, { html: `<svg viewBox="0 0 100 100" aria-hidden="true">${DISH_SVG[id]}</svg>` });
  const cleanFace = (id, tag) => itemFace(pics, `clean-${id}`, tag, CLEAN_SVG[id] ? { html: CLEAN_SVG[id] } : { text: CLEAN_ITEMS[id].emoji });
  const fruitFace = (id, cls = 'cf-fruit') => foodFace(fruitFood(id), feedPics, cls);
  const eToolFace = (id) => (E_TOOL_SVG[id] ? h('span', { html: E_TOOL_SVG[id] }) : toolPic(id));
  const toolPic = (id) => (id === 'banana' ? fruitFace('banana') : itemFace(pics, id, 'span', { text: E_TOOLS[id].emoji }));

  const custEl = h('div.cf-customer');
  const sink = h('button.cf-sink', { type: 'button', 'aria-label': 'Vòi nước', onclick: () => tapSink() },
    h('span.cf-tap', { text: '🚰' }), h('span.cf-water'), h('span.cf-soap', { text: '🧼' }));
  const card = h('div.cf-card', { 'aria-hidden': 'true' });
  const plate = h('button.cf-plate', { type: 'button', 'aria-label': 'Đĩa', onclick: () => tapPlate() },
    h('span.cf-stack'), h('span.cf-plate-art', { html: PLATE_SVG }));
  const stack = plate.firstElementChild;
  const tools = h('div.cf-tools');
  const bowl = h('button.cf-bowl', { type: 'button', 'aria-label': 'Cái bát', dataset: { tool: 'bowl' }, onclick: () => tapTool('bowl') }, h('span', { html: BOWL_SVG }));
  const oven = h('button.cf-oven', { type: 'button', 'aria-label': 'Lò nướng', onclick: () => (hungry() ? tapETool('oven') : tapTool('bowl')) }, h('span', { html: OVEN_SVG }));
  const cake = h('button.cf-cake', { type: 'button', 'aria-label': 'Cái bánh', onclick: () => tapCake() }, h('span.cf-cake-art', { html: CAKE_SVG }), h('span.cf-tops'), h('span.cf-steam', { text: '♨️' }));
  const tops = cake.querySelector('.cf-tops');
  const table = h('div.cf-table', { 'aria-hidden': 'true' });
  const places = h('div.cf-places');
  const counter = h('div.cf-counter');
  const cleanRoom = h('div.cf-clean', { hidden: true }, places, counter);
  // Ca E: Bông đứng chỗ khách (ăn cùng bé), thẻ mặt, thực đơn, chỗ nấu (cơm nắm / bát salad), kệ đồ.
  const bongEl = h('div.cf-bong', { 'aria-hidden': 'true', html: bongSvg({ mood: 'happy' }) });
  const feels = h('div.cf-feels');
  const menuEl = h('div.cf-menu');
  const work = h('div.cf-work', { onclick: () => tapHotPizza() });
  const micEl = h('div.cf-mic', { 'aria-hidden': 'true', text: '🎤', hidden: true }); // lượt nói (SPEC-jobs5 mục 5)
  const starEl = h('div.cf-talk-star', { 'aria-hidden': 'true', text: '⭐', hidden: true });
  const ktools = h('div.cf-ktools');

  const kit = jobScreen(app, {
    job: JOB, background: { lessonId: JOBS_BG_IMAGES, word: JOB }, className: 'cf-play', stageClass: 'cf-stage', title: '👨‍🍳 Chef',
    helperLabel: 'Nghe lại', cap: 'chef', resetLabel: 'Nấu lại', trayLabel: 'Đồ ăn',
    host: { svg: CHEF_SVG, label: 'chef' },
    roles: {
      of: (who) => (who === 'chef' ? kit.host : who === 'customer' ? custEl : who === 'bong' ? bongEl : null),
      all: () => [kit.host, custEl, bongEl].filter((el) => !el.closest('[hidden]')),
    },
    icon: (who) => (who === 'chef' ? '👨‍🍳' : who === 'bong' ? '🐰' : customer()?.emoji ?? ''),
    pitch: (who) => (who === 'customer' ? customer()?.pitch : undefined),
    onTalk: (who) => custEl.classList.toggle('talking', who === 'customer'),
    onReset: () => { menuAbort?.abort(); restart(); },
    onHelper: () => repeatPrompt(),
    nudge: {
      ready: () => ACTIVE.includes(state) && nudges < MAX_NUDGES,
      key: () => stepKey(),
      fire: (rearm) => {
        nudges += 1;
        snap();
        nudgeTarget();
        kit.talk(promptLines(true)).then(rearm);
      },
    },
    tray: {
      // Ca E: khay là quả salad (dâu tây trùng mã với đồ trang trí — xem loại ca trước).
      face: (id) => (hungry() ? (TOPPINGS[id] && dish === 'pizza' ? h('span.cf-item', { text: TOPPINGS[id].emoji }) : fruitFace(id)) : DISHES[id] ? dishFace(id, 'span.cf-item.cf-dish') : LAYERS[id] ? layerFace(id, 'span.cf-item') : decorFace(id, 'span.cf-item')),
      label: (id) => (hungry() ? (dish === 'pizza' ? TOPPINGS[id].one : fruitFood(id).en) : DISHES[id]?.name ?? LAYERS[id]?.name ?? DECOR[id].one),
      canGive: () => TRAY_STATES.includes(state),
      dropOk: (x, y) => {
        const r = (state === 'decor' ? cake : state === 'fruit' || state === 'topping' ? work : plate).getBoundingClientRect();
        return x >= r.left - 30 && x <= r.right + 30 && y >= r.top - 40 && y <= r.bottom + 30;
      },
      give: (id, from) => (state === 'layer' ? giveLayer(id, from) : state === 'temp' ? giveDish(id, from) : state === 'fruit' ? giveFruit(id, from) : state === 'topping' ? giveTopping(id, from) : giveDecor(id, from)),
    },
  });
  const { stage, count, talk } = kit;
  stage.append(table, sink, card, plate, tools, bowl, oven, cake, custEl, cleanRoom, bongEl, work, ktools, feels, menuEl, micEl, starEl);
  const stepKey = () => `${kit.epoch}:${caseIdx}:${state}:${si}:${taken.list().length}`;

  function setState(s) {
    state = s;
    kit.setState(s, TRAY_STATES.includes(s));
    app.root.dataset.case = cur()?.kind ?? '';
  }
  let cleanOn = false; // đang dọn bếp (bản lưu: quay lại không nói lại "Clean up time!")
  const snap = (extra = {}) => saveSnap(JOB, { level, plan, caseIdx, si, wrongs, nudges, taken: taken.list(), recorded: [...recorded], washed, cleanOn, dish, ...extra });
  const snapNext = () => saveSnap(JOB, { level, plan, caseIdx: caseIdx + 1, si: 0, wrongs: 0, nudges: 0, taken: [], recorded: [...recorded], washed });
  function countWrong(key) {
    const now = Date.now();
    if (key === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return false;
    lastWrong = { key, at: now };
    wrongs += 1;
    snap();
    kit.clearNudge();
    play('boing');
    return true;
  }
  /** Ghi "đã gặp" một lần mỗi ca, và một từ chỉ một lần mỗi lượt (SPEC-jobs3 2.7). */
  function record(key, word, emoji) {
    const k = `${caseIdx}:${key}`;
    if (recorded.has(k) || recorded.has(`w:${word}`)) return;
    recorded.add(k);
    recorded.add(`w:${word}`);
    markPracticed(app, word, emoji);
  }
  function seen(id) {
    const k = `${caseIdx}:seen:${id}`;
    if (recorded.has(k)) return;
    recorded.add(k);
    progress = afterSeen(progress, id);
  }
  async function ask(lines, s) {
    const e = kit.epoch;
    setState(s);
    snap();
    await talk(lines);
    if (e === kit.epoch && state === s) kit.armNudge();
  }

  // ---------- Câu hỏi của bước đang làm ----------
  function promptLines(short = false) {
    if (state === 'clean') {
      const target = cleanTarget();
      return target ? [C(cleanAskLine(target, level, target !== plan.clean.asks[0]))] : [];
    }
    const c = cur();
    if (state === 'wash') return [C(WASH_LINE)];
    if (!c) return [];
    if (state === 'layer') {
      if (level <= 1 || short) return [C(layerCallLine(c.layers[si]))];
      return [K(orderLine(c.layers)), ...(c.no ? [K(noLine(c.no))] : [])];
    }
    if (state === 'serve') return [C(READY_LINE)];
    if (state === 'bake') return c.ordered && !short ? [C(chainLine(c.steps))] : [C(c.ordered ? firstLine(c.steps[si]) : stepLine(c.steps[si]))];
    if (state === 'decor') return [K(decorAskLine(c.want))];
    if (state === 'temp') return level <= 1 ? [C(somethingLine(c.want))] : [K(tempAskLine(c))];
    if (state === 'feel') return [C(HOW_FEEL_LINE)];
    if (state === 'menu') return [C(WANT_LINE)];
    if (state === 'fruit') return [fruitAsk()];
    if (state === 'topping') return [toppingAsk()];
    if (state === 'cook') {
      if (dish === 'salad') return [C(eStepLine(saladPhase()))];
      if (dish === 'pizza') return [C(eStepLine(pizzaPhase()))];
      const r = c.rice;
      return r.ordered ? [C(short ? eNextLine(r.steps, si) : eChainLine(r.steps))] : [C(eStepLine(r.steps[si]))];
    }
    return [];
  }
  function nudgeTarget() {
    const c = cur();
    if (state === 'wash') restartAnim(sink, 'nudge');
    else if (state === 'layer') kit.setHint(c.layers[si]);
    else if (state === 'serve') restartAnim(c.kind === 'bake' ? cake : plate, 'nudge');
    else if (state === 'bake') restartAnim(toolEl(BAKE_STEPS[c.steps[si]].tool), 'nudge');
    else if (state === 'decor') kit.setHint(missing()[0]);
    else if (state === 'temp') kit.setHint(tempMatches(c)[0]);
    else if (state === 'feel') restartAnim(feels.querySelector('[data-feel="hungry"]'), 'nudge');
    else if (state === 'menu') for (const el of menuEl.children) restartAnim(el, 'nudge');
    else if (state === 'fruit') kit.setHint(missingFruits()[0]);
    else if (state === 'topping') kit.setHint(missingTops()[0]);
    else if (state === 'cook') restartAnim(eToolEl(E_STEPS[eWant()].tool), 'nudge');
    else if (state === 'clean') {
      const target = cleanTarget();
      const sel = level <= 2 || taken.has(`sel:${target}`);
      restartAnim(sel ? places.querySelector(`[data-place="${CLEAN_ITEMS[target].place}"]`) : counter.querySelector(`[data-item="${target}"]`), 'nudge');
    }
  }
  const toolEl = (id) => (id === 'bowl' ? bowl : tools.querySelector(`[data-tool="${id}"]`));

  // ---------- Vẽ ----------
  function showScene(kind) {
    stage.dataset.scene = kind;
    sink.hidden = kind !== 'wash';
    card.hidden = !(kind === 'sandwich' || (kind === 'bake' && cur()?.ordered));
    plate.hidden = kind !== 'sandwich' && kind !== 'temp';
    cleanRoom.hidden = kind !== 'clean';
    cleanRoom.classList.remove('shine');
    cleanOn = kind === 'clean';
    delete custEl.dataset.feel;
    tools.hidden = kind !== 'bake';
    bowl.hidden = kind !== 'bake';
    oven.hidden = kind !== 'bake';
    cake.hidden = kind !== 'decor';
    custEl.hidden = kind === 'wash' || kind === 'clean' || kind === 'hungry';
    bongEl.hidden = kind !== 'hungry';
    for (const el of [feels, menuEl, work, ktools, micEl]) el.hidden = true;
    kit.renderTray([]);
    if (plan) count.textContent = `${Math.min(caseIdx + 1, plan.cases.length)}/${plan.cases.length}`;
  }
  function renderCustomer(mood = 'happy') {
    const p = customer();
    custEl.innerHTML = patientSvg(p.id, { mood, title: p.name });
    custEl.dataset.who = p.id;
  }
  function renderSandwich() {
    const c = cur();
    // Thẻ công thức nằm ngang: trái → phải theo thứ tự đặt (lớp dưới cùng trước), món "No …" ở cuối.
    card.replaceChildren(h('span.cf-card-title', { text: '🥪' }), ...c.layers.map((id, i) =>
      h('span.cf-card-row', { class: `${i < si ? 'done' : ''}${i === si && level <= 1 ? ' next' : ''}` }, layerFace(id, 'span')),
    ), ...(c.no ? [h('span.cf-card-no', {}, '🚫', layerFace(c.no, 'span'))] : []));
    stack.replaceChildren(...c.layers.slice(0, si).map((id, i) => h('span.cf-layer', { dataset: { layer: id }, html: layerSide(id, i) })));
    plate.dataset.next = c.layers[si] ?? ''; // cho test; bé không thấy
  }
  function renderBake() {
    const c = cur();
    const done = new Set(c.steps.slice(0, si));
    tools.replaceChildren(...c.tools.map((id) => h('button.cf-tool', {
      type: 'button', 'aria-label': TOOLS[id].vi, dataset: { tool: id }, class: done.has(stepOf(id)) ? 'used' : '',
      onclick: () => tapTool(id),
    }, toolFace(id, 'span'))));
    bowl.dataset.fill = done.has('pour') ? 'milk' : '';
    bowl.dataset.egg = String(done.has('crack'));
    bowl.dataset.mixed = String(done.has('mix'));
    bowl.hidden = done.has('bake');
    oven.classList.remove('on');
    card.replaceChildren(...(c.ordered ? c.steps.filter((s) => s !== 'bake').map((s, k) => h('span.cf-card-row', {
      class: k < si ? 'done' : '',
    }, `${k + 1}. `, toolFace(BAKE_STEPS[s].tool, 'span'))) : []));
    tools.dataset.want = c.steps[si] ?? ''; // cho test
    // Mức 1: chỉ đồ của bước đang làm sáng (làm quen động từ, không có nhầm).
    for (const t of tools.children) t.classList.toggle('lit', level <= 1 && BAKE_STEPS[c.steps[si]]?.tool === t.dataset.tool);
    bowl.classList.toggle('lit', level <= 1 && c.steps[si] === 'bake');
  }
  const stepOf = (tool) => Object.keys(BAKE_STEPS).find((s) => BAKE_STEPS[s].tool === tool);
  function renderDecor() {
    const c = cur();
    let k = 0;
    tops.replaceChildren(...c.want.flatMap((w) => Array.from({ length: placed(w.id) }, () => {
      const [left, top] = DECOR_SPOTS[k++ % DECOR_SPOTS.length];
      return decorFace(w.id, 'span.cf-top', { style:{ left: `${left}%`, top: `${top}%` } });
    })));
    cake.dataset.want = c.want.map((w) => `${w.id}:${w.n}`).join(','); // cho test
    for (const w of c.want) kit.trayItem(w.id)?.classList.toggle('full', placed(w.id) >= w.n);
  }
  const placed = (id) => taken.list().filter((k) => k.startsWith(`d:${id}:`)).length;
  const missing = () => cur().want.filter((w) => placed(w.id) < w.n).map((w) => w.id);

  // ---------- Mở đầu: rửa tay ----------
  async function startWash() {
    showScene('wash');
    sink.classList.remove('on');
    await ask([C(WASH_LINE)], 'wash');
  }
  async function tapSink() {
    if (state !== 'wash' || !taken.take('wash')) return;
    const e = kit.epoch;
    setState('busy');
    kit.clearNudge();
    washed = true;
    snap();
    play('whoosh');
    sink.classList.add('on');
    await Promise.all([talk([C(COOK_LINE)]), wait(ANIM_MS)]);
    if (e !== kit.epoch) return;
    taken = claims();
    startCase();
  }

  // ---------- Ca ----------
  async function startCase(resume = null) {
    const e = kit.epoch;
    const c = cur();
    si = resume?.si ?? 0;
    wrongs = resume?.wrongs ?? 0;
    nudges = resume?.nudges ?? 0;
    taken = claims(resume?.taken ?? []);
    setState('enter');
    showScene(c.kind);
    renderCustomer();
    snap();
    if (!resume) {
      restartAnim(custEl, 'enter');
      await wait(ENTER_MS);
      if (e !== kit.epoch) return;
    }
    if (c.kind === 'sandwich') return startSandwich(resume);
    if (c.kind === 'bake') return startBake(resume);
    if (c.kind === 'temp') return startTemp(resume);
    if (c.kind === 'hungry') return startHungry(resume);
    return startDecor(resume);
  }

  // Ca A — bánh mì kẹp.
  async function startSandwich(resume) {
    const c = cur();
    renderSandwich();
    kit.renderTray(c.tray);
    if (si >= c.layers.length) return askServe(plate);
    const lines = resume ? promptLines() : [K(SANDWICH_LINE), ...(level <= 1 ? [C(layerCallLine(c.layers[0]))] : [K(orderLine(c.layers)), ...(c.no ? [K(noLine(c.no))] : [])])];
    await ask(lines, 'layer');
  }
  async function giveLayer(id, from) {
    if (state !== 'layer') return;
    const e = kit.epoch;
    const c = cur();
    const want = c.layers[si];
    if (id !== want) {
      if (!countWrong(`l:${id}`)) return;
      if (wrongs >= 1) kit.setHint(want); // tên lớp có trên thẻ / trong câu: lớp đúng nhún ngay sau lần nhầm đầu
      const k = stepKey();
      await talk(id === c.no ? [K(noLine(c.no))] : [C(layerWrongLine(id, want))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (!taken.take(`layer:${si}`)) return;
    kit.clearNudge();
    kit.setHint(null);
    si += 1;
    const done = si >= c.layers.length;
    setState('busy');
    snap();
    const to = center(stack.getBoundingClientRect());
    const g = await kit.flyTo(layerFace(id, 'span.cf-item.cf-fly'), from, { x: to.x, y: to.y - 10 });
    kit.removeGhost(g);
    if (e !== kit.epoch) return;
    play('pop');
    renderSandwich();
    if (done) {
      if (wrongs === 0) record('bread', 'bread', '🍞');
      seen('sandwich');
      for (const id of new Set(cur().layers)) seen(id);
      return askServe(plate);
    }
    if (level <= 1) await ask([C(layerCallLine(c.layers[si]))], 'layer');
    else {
      setState('layer');
      snap();
      kit.armNudge();
    }
  }
  async function askServe(el) {
    kit.renderTray([]);
    el.classList.add('ready');
    await ask([C(READY_LINE)], 'serve');
  }
  async function tapPlate() {
    if (state === 'eat') return bite();
    if (state !== 'serve' || !['sandwich', 'temp'].includes(cur().kind)) return;
    serve(plate);
  }
  /** Đưa món cho khách (một thao tác), khách cảm ơn, ra về. Ca D: món nóng "Hot! Careful!" → "Phew, phew!"; món lạnh "Brr! Yummy!". */
  async function serve(el) {
    const c = cur();
    const temp = c.kind === 'temp' ? DISHES[tempMatches(c)[0]] : null;
    if (!taken.take('serve')) return;
    const e = kit.epoch;
    setState('busy');
    kit.clearNudge();
    snapNext();
    play('whoosh');
    el.classList.remove('ready');
    if (temp?.hot) talk([C(CAREFUL_LINE)]);
    const from = el.getBoundingClientRect();
    const to = custEl.getBoundingClientRect();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Dùng thuộc tính `translate` / `scale` (không đè `transform` canh giữa của đĩa / bánh).
      await el.animate([{ translate: '0 0', scale: '1' }, { translate: `${center(to).x - center(from).x}px ${center(to).y - center(from).y}px`, scale: '0.6', opacity: 0.2 }],
        { duration: 450, easing: 'ease-in' }).finished.catch(() => {});
    }
    el.hidden = true;
    if (e !== kit.epoch) return;
    delete custEl.dataset.feel;
    renderCustomer('happy');
    restartAnim(custEl, 'hop');
    play('munch');
    playSoundFile(SOUND_BY_ID.get('dishes'), { isCurrent: () => e === kit.epoch }).catch(() => {}); // bát đĩa lách cách (file có sẵn)
    await talk(!temp ? [K(THANKS_LINE)] : temp.hot ? [K(PHEW_LINE), K(THANKS_LINE)] : [K(BRR_LINE), K(THANK_YOU_LINE)]);
    if (e !== kit.epoch) return;
    nextCase(e);
  }

  // Ca B — bánh nướng.
  async function startBake(resume) {
    const c = cur();
    renderBake();
    cake.hidden = si < c.steps.length;
    cake.classList.remove('hot');
    tops.replaceChildren();
    if (si >= c.steps.length) return askServe(cake);
    const lines = resume ? promptLines() : [K(CAKE_LINE), C(c.ordered ? chainLine(c.steps) : stepLine(c.steps[0]))];
    await ask(lines, 'bake');
  }
  async function tapTool(id) {
    if (state !== 'bake') return;
    const e = kit.epoch;
    const c = cur();
    const want = c.steps[si];
    const wantTool = BAKE_STEPS[want].tool;
    if (id !== wantTool) {
      const el = toolEl(id) ?? oven;
      if (c.steps.slice(0, si).includes(stepOf(id))) return; // đồ đã dùng: không tính
      if (level <= 1) {
        // Mức 1: làm quen, không có nhầm — chỉ nhắc đồ đang sáng.
        restartAnim(toolEl(wantTool), 'nudge');
        return;
      }
      if (!countWrong(`t:${id}`)) return;
      restartAnim(el, 'shake');
      if (wrongs >= 2) restartAnim(toolEl(wantTool), 'nudge');
      const k = stepKey();
      await talk([C(c.ordered ? firstLine(want) : toolWrongLine(id, want))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (!taken.take(`step:${si}`)) return;
    setState('busy');
    kit.clearNudge();
    si += 1;
    const firstTry = wrongs === 0;
    snap();
    // Hoạt ảnh của động từ + chú đầu bếp nói lại động từ đúng lúc (nối từ với hành động — mục 5.2).
    const tool = toolEl(id);
    if (want === 'pour') {
      tool.classList.add('pour');
      bowl.dataset.fill = 'milk';
    } else if (want === 'crack') {
      tool.classList.add('crack');
      bowl.dataset.egg = 'true';
    } else if (want === 'mix') {
      tool.classList.add('stir');
      bowl.classList.add('stir');
      bowl.dataset.mixed = 'true';
    }
    if (want === 'bake') {
      play('whoosh');
      bowl.classList.add('in-oven');
      await Promise.all([talk([C(verbLine('bake'))]), wait(ANIM_MS / 2)]);
      if (e !== kit.epoch) return;
      bowl.hidden = true;
      bowl.classList.remove('in-oven');
      oven.classList.add('on');
      for (let t = 0; t < 4; t++) {
        play('tick');
        await wait(OVEN_MS / 4);
        if (e !== kit.epoch) return;
      }
      play('ding');
      oven.classList.remove('on');
      if (firstTry && c.steps.includes('pour')) record('milk', 'milk', '🥛');
      if (firstTry && c.steps.includes('crack')) record('egg', 'egg', '🥚');
      seen('bake');
      return hotCake(e);
    }
    play(want === 'crack' ? 'crack' : 'whoosh');
    await Promise.all([talk([C(verbLine(want))]), wait(ANIM_MS)]);
    if (e !== kit.epoch) return;
    tool.classList.remove('pour', 'crack', 'stir');
    tool.classList.add('used');
    bowl.classList.remove('stir');
    renderBake();
    wrongs = 0;
    nudges = 0;
    if (c.ordered) {
      setState('bake');
      snap();
      kit.armNudge();
    } else await ask([C(stepLine(c.steps[si]))], 'bake');
  }
  /** Bánh ra lò còn nóng: chạm bánh → rung + "Hot! Wait!" (không tính nhầm); hết hơi nóng → bưng ra. */
  async function hotCake(e) {
    cake.hidden = false;
    tops.replaceChildren();
    cake.classList.add('hot');
    restartAnim(cake, 'enter');
    setState('hot');
    snap();
    await Promise.all([talk([C(HOT_LINE)]), wait(HOT_MS)]);
    if (e !== kit.epoch) return;
    cake.classList.remove('hot');
    await talk([C(NOW_READY_LINE)]);
    if (e !== kit.epoch) return;
    cake.classList.add('ready');
    setState('serve');
    snap();
    kit.armNudge();
  }
  function tapCake() {
    if (state === 'hot') {
      restartAnim(cake, 'shake');
      talk([C(HOT_LINE)]);
      return;
    }
    if (state === 'serve' && cur().kind === 'bake') serve(cake);
  }

  // Ca C — trang trí bánh.
  async function startDecor(resume) {
    const c = cur();
    cake.hidden = false;
    cake.classList.remove('hot', 'ready');
    kit.renderTray(c.tray);
    renderDecor();
    if (!missing().length) return decorDone(kit.epoch);
    await ask(resume ? promptLines() : [K(decorAskLine(c.want))], 'decor');
  }
  async function giveDecor(id, from) {
    if (state !== 'decor') return;
    const e = kit.epoch;
    const c = cur();
    const w = c.want.find((x) => x.id === id);
    if (!w) {
      if (!countWrong(`d:${id}`)) return;
      kit.setHint(missing()[0]);
      const k = stepKey();
      await talk([K(decorWrongLine(id, missing()))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (placed(id) >= w.n) {
      // Loại này đủ rồi: không nhận, không tính nhầm (quả thừa bay tới bánh rồi bay về khay); loại kia vẫn đặt được.
      talk([C(ENOUGH_LINE)]);
      const to = center(cake.getBoundingClientRect());
      const g = await kit.flyTo(decorFace(id, 'span.cf-item.cf-fly'), from, { x: to.x, y: to.y - 30 });
      await kit.flyBack(g, id);
      return;
    }
    if (!taken.take(`d:${id}:${placed(id)}`)) return;
    kit.clearNudge();
    kit.setHint(null);
    const n = placed(id);
    const done = !missing().length;
    if (done) setState('busy');
    snap();
    const g = await kit.flyTo(decorFace(id, 'span.cf-item.cf-fly'), from, center(cake.getBoundingClientRect()));
    kit.removeGhost(g);
    if (e !== kit.epoch) return;
    play('pop');
    renderDecor();
    const k = stepKey();
    await talk([C(countLine(n))]);
    if (done) return decorDone(e);
    if (k === stepKey()) kit.armNudge();
  }
  async function decorDone(e) {
    if (e !== kit.epoch) return;
    setState('busy');
    seen('decor');
    for (const w of cur().want) seen(w.id);
    kit.renderTray([]);
    cake.classList.add('ready');
    await talk([C(READY_LINE)]);
    if (e !== kit.epoch) return;
    // Bánh trang trí tự mang ra cho khách (không thêm thao tác — mục 2.5).
    serve(cake);
  }

  // Ca D — món nóng, món lạnh (SPEC-jobs4 3.1): chọn món → món lên đĩa → chạm đĩa đưa cho khách.
  async function startTemp(resume) {
    const c = cur();
    const right = tempMatches(c)[0];
    plate.dataset.dish = right; // cho test; bé không thấy
    stack.replaceChildren();
    plate.classList.remove('ready');
    // Mức 1: khách có dấu hiệu lạnh (run, khăn) / nóng (mồ hôi); mức 2–3 không có.
    if (level <= 1) custEl.dataset.feel = c.want === 'hot' ? 'cold' : 'hot';
    if (taken.has('dish')) {
      stack.replaceChildren(dishFace(right, 'span.cf-dish'));
      return askServe(plate);
    }
    kit.renderTray(c.tray);
    if (level <= 1) kit.setHint(right);
    const lines = resume ? promptLines() : level <= 1 ? [K(feelLine(c.want)), C(somethingLine(c.want))] : [K(tempAskLine(c))];
    await ask(lines, 'temp');
  }
  async function giveDish(id, from) {
    if (state !== 'temp') return;
    const e = kit.epoch;
    const c = cur();
    const right = tempMatches(c)[0];
    if (id !== right) {
      // Mức 1 là làm quen: món đúng nhún, không tính nhầm.
      if (level <= 1) {
        kit.setHint(right);
        return;
      }
      if (!countWrong(`m:${id}`)) return;
      if (wrongs >= 2) kit.setHint(right);
      restartAnim(custEl, 'shake');
      const k = stepKey();
      await talk([K(tempWrongLine(c, id))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (!taken.take('dish')) return;
    kit.clearNudge();
    kit.setHint(null);
    setState('busy');
    if (level >= 2 && wrongs === 0) {
      record(`temp:${c.want}`, c.want, c.want === 'hot' ? '🥵' : '🥶');
      if (c.dish && DISHES[c.dish].word) record(`dish:${c.dish}`, DISHES[c.dish].word, DISHES[c.dish].emoji);
    }
    seen(right);
    snap();
    const to = center(stack.getBoundingClientRect());
    const g = await kit.flyTo(dishFace(id, 'span.cf-dish.cf-fly'), from, { x: to.x, y: to.y - 10 });
    kit.removeGhost(g);
    if (e !== kit.epoch) return;
    play('pop');
    stack.replaceChildren(dishFace(id, 'span.cf-dish'));
    askServe(plate);
  }

  // Ca E — Bé đói rồi! (SPEC-jobs5): bụng kêu → (mức 3) chọn mặt → thực đơn → nấu → ăn cùng Bông.
  const missingFruits = () => cur().salad.fruits.filter((f) => !taken.has(`f:${f}`));
  /** Salad: chuối vào bát rồi thì bóc ngay; đủ quả thì trộn (SPEC-jobs5 4.2). */
  function saladPhase() {
    if (taken.has('f:banana') && !taken.has('peel')) return 'peel';
    if (missingFruits().length) return 'fruit';
    return taken.has('mix') ? 'done' : 'mix';
  }
  /** Pizza: phết sốt → rắc phô mai → đặt nhân (mức 2–3) → vào lò (SPEC-jobs5 4.1). */
  const placedTop = (id) => taken.list().filter((k) => k.startsWith(`t:${id}:`)).length;
  const missingTops = () => cur().pizza.want.filter((w) => placedTop(w.id) < w.n).map((w) => w.id);
  function pizzaPhase() {
    for (const st of ['spread', 'sprinkle']) if (!taken.has(st)) return st;
    if (missingTops().length) return 'topping';
    return taken.has('bake') ? 'done' : 'bake';
  }
  const toppingAsk = () => ({ ...C(toppingAskLine(cur().pizza.want)), slow: level >= 3 });
  /** Động từ đang chờ ở bước nấu. */
  const eWant = () => (dish === 'salad' ? saladPhase() : dish === 'pizza' ? pizzaPhase() : cur().rice.steps[si]);
  const eToolEl = (id) => (id === 'banana' ? work.querySelector('.cf-sbanana') : id === 'oven' ? oven : ktools.querySelector(`[data-tool="${id}"]`));

  /**
   * Lượt nói (SPEC-jobs5 mục 5): chỉ khi bố mẹ bật "Cho bé nói khi chơi nghề", mức 2–3 và mic đã sẵn sàng từ trước — trò
   * nghề không bao giờ xin quyền mic. Bông đọc câu mẫu, nghe ≤ 4 giây (không ghi âm, giới hạn cứng 6 giây). Không bao giờ
   * tính nhầm, không bắt nói lại; lỗi gì cũng bỏ qua. Test UI đặt `window.__kidTest.chefTalkResult` để giả kết quả nghe.
   */
  const talkOn = () => level >= 2 && Boolean(app.settings.jobsTalk) && app.mic.ready && globalThis.__kidTest?.chefTalk !== false;
  async function talkTurn(line, keywords) {
    if (!talkOn()) return;
    const e = kit.epoch;
    setState('talk');
    snap();
    await talk([B(line)]);
    if (e !== kit.epoch) return;
    micEl.hidden = false;
    let result = null;
    try {
      const forced = globalThis.__kidTest?.chefTalkResult;
      if (forced === 'error') throw new Error('mic');
      if (forced) {
        await wait(300);
        result = forced;
      } else {
        const onDemand = app.settings.micOnlyWhenListening;
        if (onDemand) await app.mic.start();
        try {
          const cap = new Promise((resolve) => { setTimeout(() => resolve(null), TALK_CAP_MS); });
          const out = await Promise.race([listen({ mic: app.mic, recognizer: app.recognizer, keywords, record: false, maxMs: TALK_MS, signal: kit.signal }), cap]);
          result = out?.result ?? null;
        } finally {
          if (onDemand) app.mic.release();
        }
      }
    } catch {
      result = null; // mic / nhận dạng lỗi giữa lượt: bỏ qua, đi tiếp
    }
    micEl.hidden = true;
    if (e !== kit.epoch) return;
    if (result === RESULT.MATCH) {
      play('ding');
      starEl.hidden = false;
      restartAnim(starEl, 'fly');
      progress = afterSeen(progress, 'talk:chef'); // mỗi câu khớp +1 (mục 7)
      await talk([C(GREAT_TALK_LINE)]);
      starEl.hidden = true;
    } else if (result === RESULT.VOICE) await talk([C(GOOD_LINE), C(line)]);
    else if (result === RESULT.SILENT) await talk([C(line)]);
  }
  /**
   * Mức 3 nói tên món để chọn (SPEC-jobs6 mục 2): cần lượt nói bật + mic sẵn sàng + nhận dạng giọng nói chạy được (chỉ đo
   * âm lượng thì không biết món). Thiếu một điều kiện: chọn bằng chạm như cũ. Test: `chefTalkResult = { text, delay? }`.
   */
  const menuListenOn = () => level >= 3 && talkOn() && (Boolean(app.recognizer?.enabled) || typeof globalThis.__kidTest?.chefTalkResult === 'object');
  let menuAbort = null;
  /** Nghe một lần (≤ 6 giây). Trả mã món nghe ra, hoặc null (không khớp / im / lỗi / bé đã chạm). */
  async function listenDish() {
    const menu = cur().menu;
    const ctl = new AbortController();
    menuAbort = ctl;
    const stop = () => ctl.abort();
    kit.signal?.addEventListener('abort', stop, { once: true });
    micEl.hidden = false;
    let id = null;
    try {
      const forced = globalThis.__kidTest?.chefTalkResult;
      if (forced === 'error' || forced?.error) throw new Error('mic');
      if (forced && typeof forced === 'object') {
        await new Promise((resolve) => { setTimeout(resolve, forced.delay ?? 300); }); // thời gian thật (test), không theo ?fast
        if (!ctl.signal.aborted) id = matchDishAlts([forced.text], menu);
      } else {
        const onDemand = app.settings.micOnlyWhenListening;
        if (onDemand) await app.mic.start();
        try {
          let heardId = null;
          const matcher = (alts) => {
            heardId = heardId ?? matchDishAlts(alts, menu);
            return Boolean(heardId);
          };
          const cap = new Promise((resolve) => { setTimeout(() => resolve(null), TALK_CAP_MS); });
          const out = await Promise.race([listen({ mic: app.mic, recognizer: app.recognizer, keywords: [], matcher, record: false, maxMs: TALK_CAP_MS, signal: ctl.signal }), cap]);
          id = heardId ?? (out ? matchDishAlts(out.heard, menu) : null);
        } finally {
          if (onDemand) app.mic.release();
        }
      }
    } catch {
      id = null; // mic / nhận dạng lỗi, hoặc bé đã chạm thẻ: đi tiếp bằng chạm
    } finally {
      kit.signal?.removeEventListener('abort', stop);
      if (menuAbort === ctl) menuAbort = null;
      micEl.hidden = true;
    }
    return ctl.signal.aborted ? null : id;
  }
  /** Câu gọi quả: mức 1 từng quả ("A banana, please!"); mức 2–3 cả hai quả, mức 3 thêm "No …!" và đọc chậm. */
  const fruitAsk = () => (level <= 1 ? C(fruitOneLine(missingFruits()[0])) : { ...C(saladAskLine(cur().salad)), slow: level >= 3 });

  async function startHungry(resume) {
    const e = kit.epoch;
    const c = cur();
    dish = resume?.dish ?? null;
    if (!resume) {
      play('rumble');
      restartAnim(bongEl, 'hop');
      // Mức 1–2: Bông nói mẫu "Yes! I'm hungry!"; mức 3 bé tự chọn mặt.
      await talk(level >= 3 ? [] : [C(ARE_HUNGRY_LINE), B(YES_HUNGRY_LINE)]);
      if (e !== kit.epoch) return;
      if (level === 2) await talkTurn(IM_HUNGRY_LINE, ['hungry']);
      if (e !== kit.epoch) return;
    }
    if (c.feel && !taken.has('feel')) return askFeel(e);
    if (!dish) return askMenu(Boolean(resume));
    return startCook(Boolean(resume));
  }
  async function askFeel(e) {
    feels.hidden = false;
    feels.replaceChildren(...cur().feel.map((f) => h('button.cf-feel', {
      type: 'button', 'aria-label': f, dataset: { feel: f }, text: FEELS[f], onclick: () => tapFeel(f),
    })));
    if (e === kit.epoch) await ask([C(HOW_FEEL_LINE)], 'feel');
  }
  async function tapFeel(f) {
    if (state !== 'feel') return;
    const e = kit.epoch;
    const el = feels.querySelector(`[data-feel="${f}"]`);
    if (f !== 'hungry') {
      // Thẻ sai rung rồi về chỗ, thẻ còn nguyên; bụng kêu lại, chú hỏi lại (SPEC-jobs5 mục 3).
      if (!countWrong(`fe:${f}`)) return;
      restartAnim(el, 'shake');
      if (wrongs >= 2) restartAnim(feels.querySelector('[data-feel="hungry"]'), 'nudge');
      const k = stepKey();
      await talk([C(feelWrongLine(f))]);
      if (k !== stepKey()) return;
      play('rumble');
      await talk([C(LISTEN_FEEL_LINE)]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (!taken.take('feel')) return;
    kit.clearNudge();
    setState('busy');
    if (wrongs === 0) record('hungry', 'hungry', '😋');
    wrongs = 0;
    nudges = 0;
    snap();
    el.classList.add('chosen');
    play('pop');
    await talk([C(YOU_HUNGRY_LINE)]);
    if (e !== kit.epoch) return;
    feels.hidden = true;
    askMenu(false);
  }
  async function askMenu(resume) {
    const c = cur();
    menuEl.hidden = false;
    menuEl.classList.remove('picked');
    menuEl.replaceChildren(...c.menu.map((id) => {
      const food = MENU[id].food ? fruitFood(MENU[id].food) : null;
      return h('button.cf-mcard', { type: 'button', 'aria-label': MENU[id].a, dataset: { dish: id }, onclick: () => tapMenu(id) },
        food ? foodFace(food, feedPics, 'cf-mface') : h('span.cf-mface.emoji', { text: MENU[id].emoji, 'aria-hidden': 'true' }));
    }));
    // Chọn món là lựa chọn, không phải câu hỏi: thẻ nào cũng đúng (SPEC-jobs5 mục 2).
    const lines = resume ? [C(WANT_LINE)] : [C(WANT_LINE), ...c.menu.map((id) => C(menuLine(id)))];
    if (resume || !menuListenOn()) return ask(lines, 'menu');
    // Mức 3: thẻ chạm được ngay, cùng lúc nghe một lần; không nghe ra món thì "Touch one!" và chờ chạm (không nghe lại).
    const e = kit.epoch;
    setState('menu');
    snap();
    await talk([...lines, C(SAY_OR_TOUCH_LINE)]);
    if (e !== kit.epoch || state !== 'menu') return;
    const id = await listenDish();
    if (e !== kit.epoch || state !== 'menu') return;
    if (id) return chooseDish(id, true);
    for (const el of menuEl.children) restartAnim(el, 'nudge');
    await talk([C(TOUCH_ONE_LINE)]);
    if (e === kit.epoch && state === 'menu') kit.armNudge();
  }
  const tapMenu = (id) => chooseDish(id, false);
  /** Chọn món một lần duy nhất (`taken.take('dish')`): chạm hoặc giọng, cái nào tới trước thắng (SPEC-jobs6 mục 2). */
  async function chooseDish(id, byVoice) {
    if (state !== 'menu' || !taken.take('dish')) return;
    menuAbort?.abort();
    const e = kit.epoch;
    kit.clearNudge();
    setState('busy');
    dish = id;
    nudges = 0;
    snap();
    play('pop');
    menuEl.classList.add('picked');
    menuEl.querySelector(`[data-dish="${id}"]`).classList.add('chosen');
    if (byVoice) {
      play('ding');
      starEl.hidden = false;
      restartAnim(starEl, 'fly');
      progress = afterSeen(progress, 'talk:chef');
      await talk([C(saidDishLine(id))]);
      starEl.hidden = true;
    } else if (talkOn() && !menuListenOn()) {
      // Chú nhắc tên món → bé nói "Rice ball, please!" → "Let's make it!" (SPEC-jobs5 mục 4).
      await talk([C(chosenShortLine(id))]);
      if (e !== kit.epoch) return;
      await talkTurn(sayLine(id), MENU[id].keys);
      if (e !== kit.epoch) return;
      await talk([C(LETS_MAKE_LINE)]);
    } else await talk([C(chosenLine(id))]);
    if (e !== kit.epoch) return;
    startCook(false);
  }
  function renderCook() {
    const c = cur();
    work.hidden = false;
    ktools.hidden = false;
    menuEl.hidden = true;
    work.dataset.dish = dish;
    oven.hidden = dish !== 'pizza';
    oven.classList.remove('on');
    work.classList.toggle('baked', taken.has('bake'));
    if (dish === 'pizza') {
      const z = cur().pizza;
      let k = 0;
      work.replaceChildren(h('span.cf-pz', { dataset: { sauce: String(taken.has('spread')), cheese: String(taken.has('sprinkle')) } },
        h('span.cf-pz-art', { html: PIZZA_SVG }), h('span.cf-pz-tops', {}, ...z.want.flatMap((w) => Array.from({ length: placedTop(w.id) }, () => {
          const [left, top] = PIZZA_SPOTS[k++ % PIZZA_SPOTS.length];
          return h('span.cf-pz-top', { text: TOPPINGS[w.id].emoji, style: { left: `${left}%`, top: `${top}%` } });
        }))), h('span.cf-wsteam', { text: '♨️', 'aria-hidden': 'true' })));
      ktools.replaceChildren(...z.tools.map((id) => h('button.cf-tool', {
        type: 'button', 'aria-label': E_TOOLS[id].vi, dataset: { tool: id },
        class: (id === 'sauce' && taken.has('spread')) || (id === 'cheese' && taken.has('sprinkle')) ? 'used' : '',
        onclick: () => tapETool(id),
      }, eToolFace(id))));
      const phase = pizzaPhase();
      kit.renderTray(phase === 'topping' ? z.tray : []);
      for (const w of z.want) kit.trayItem(w.id)?.classList.toggle('full', placedTop(w.id) >= w.n);
      work.dataset.tops = z.want.map((w) => `${w.id}:${w.n}`).join(','); // cho test
    } else if (dish === 'rice-ball') {
      work.replaceChildren(h('span.cf-rb', { html: RICE_BALL_SVG, dataset: { step: String(si) } }));
      work.dataset.step = String(si);
      ktools.replaceChildren(...c.rice.tools.map((id) => h('button.cf-tool', {
        type: 'button', 'aria-label': E_TOOLS[id].vi, dataset: { tool: id },
        class: c.rice.steps.slice(0, si).some((s) => E_STEPS[s].tool === id) ? 'used' : '',
        onclick: () => tapETool(id),
      }, eToolFace(id))));
    } else {
      const inBowl = c.salad.fruits.filter((f) => taken.has(`f:${f}`));
      work.replaceChildren(h('span.cf-sbowl-art', { html: SALAD_BOWL_SVG }), h('span.cf-sfruits', {}, ...inBowl.map((f) => (f === 'banana'
        ? h('button.cf-sbanana', { type: 'button', 'aria-label': 'Quả chuối', dataset: { tool: 'banana' }, class: taken.has('peel') ? 'peeled' : '', onclick: () => tapETool('banana') },
          taken.has('peel') ? h('span.cf-slices', { text: '🟡🟡🟡', 'aria-hidden': 'true' }) : fruitFace('banana'))
        : h('span.cf-sfruit', {}, fruitFace(f))))));
      work.classList.toggle('mixed', taken.has('mix'));
      ktools.replaceChildren(...c.salad.tools.map((id) => h('button.cf-tool', {
        type: 'button', 'aria-label': E_TOOLS[id].vi, dataset: { tool: id }, class: taken.has('mix') && id === 'spoon' ? 'used' : '',
        onclick: () => tapETool(id),
      }, eToolFace(id))));
      kit.renderTray(c.salad.tray.filter((f) => !taken.has(`f:${f}`)));
    }
    const want = eWant();
    work.dataset.want = want ?? ''; // cho test; bé không thấy
    work.dataset.missing = dish === 'salad' ? missingFruits().join(',') : '';
    // Mức 1: chỉ đồ của bước đang làm sáng (làm quen, không có nhầm).
    for (const t of [...ktools.children, ...work.querySelectorAll('[data-tool]')]) t.classList.toggle('lit', level <= 1 && E_STEPS[want]?.tool === t.dataset.tool);
    oven.classList.toggle('lit', level <= 1 && want === 'bake');
    if (want === 'fruit' && level <= 1) kit.setHint(missingFruits()[0]);
  }
  /** Bắt đầu / làm tiếp bước nấu. `resume`: quay lại từ nền — nói câu ngắn của bước đang làm. */
  async function startCook(resume) {
    const c = cur();
    renderCook();
    const want = eWant();
    if (!want || want === 'done') return dish === 'pizza' ? hotPizza(kit.epoch) : dishDone(kit.epoch);
    if (want === 'fruit') return ask([fruitAsk()], 'fruit');
    if (want === 'topping') return ask([toppingAsk()], 'topping');
    if (dish === 'rice-ball' && c.rice.ordered && !resume && si === 0) return ask([C(eChainLine(c.rice.steps))], 'cook');
    if (dish === 'rice-ball' && c.rice.ordered) {
      setState('cook');
      snap();
      if (resume) await talk([C(eNextLine(c.rice.steps, si))]);
      kit.armNudge();
      return;
    }
    await ask([C(eStepLine(want))], 'cook');
  }
  async function tapETool(id) {
    if (state !== 'cook') return;
    const e = kit.epoch;
    const c = cur();
    const want = eWant();
    const wantTool = E_STEPS[want].tool;
    if (id !== wantTool) {
      if (dish === 'rice-ball' && c.rice.steps.slice(0, si).some((s) => E_STEPS[s].tool === id)) return; // đồ đã dùng: không tính
      if (dish !== 'rice-ball' && Object.keys(E_STEPS).some((st) => E_STEPS[st].tool === id && taken.has(st))) return;
      if (id === 'banana') return; // chuối đã bóc
      if (level <= 1) {
        restartAnim(eToolEl(wantTool), 'nudge');
        return;
      }
      if (!countWrong(`et:${id}`)) return;
      restartAnim(eToolEl(id), 'shake');
      if (wrongs >= 2) restartAnim(eToolEl(wantTool), 'nudge');
      // Mức 3 làm sai thứ tự: chỉ nói bước cần làm, không đọc lại cả chuỗi (SPEC-jobs5 4.2).
      const order = dish === 'rice-ball' && c.rice.ordered && c.rice.steps.some((s) => E_STEPS[s].tool === id);
      const k = stepKey();
      await talk([C(order ? eNextLine(c.rice.steps, si) : eToolWrongLine(id, want))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (!taken.take(dish === 'rice-ball' ? `step:${si}` : want)) return;
    setState('busy');
    kit.clearNudge();
    const firstTry = wrongs === 0;
    if (dish === 'rice-ball') si += 1;
    snap();
    if (level >= 2 && firstTry && want === 'scoop') record('rice', 'rice', '🍚');
    if (level >= 2 && firstTry && want === 'peel') record('banana', 'banana', '🍌');
    seen(`verb:${want}`);
    if (want === 'bake') return bakePizza(e);
    // Hoạt ảnh của động từ + chú nói lại động từ đúng lúc (như bánh nướng).
    const el = eToolEl(id);
    el?.classList.add(want === 'mix' ? 'stir' : 'pour');
    work.classList.add(`do-${want}`);
    if (dish === 'rice-ball') work.dataset.step = work.querySelector('.cf-rb').dataset.step = String(si);
    if (want === 'spread' || want === 'sprinkle') work.querySelector('.cf-pz').dataset[want === 'spread' ? 'sauce' : 'cheese'] = 'true';
    play(want === 'squeeze' || want === 'mix' ? 'whoosh' : 'pop');
    await Promise.all([talk([C(eVerbLine(want))]), wait(ANIM_MS)]);
    if (e !== kit.epoch) return;
    work.classList.remove(`do-${want}`);
    wrongs = 0;
    nudges = 0;
    if (dish === 'rice-ball' && c.rice.ordered && si < c.rice.steps.length) {
      renderCook();
      setState('cook');
      snap();
      kit.armNudge();
      return;
    }
    startCook(false);
  }
  async function giveFruit(id, from) {
    if (state !== 'fruit') return;
    const e = kit.epoch;
    const s = cur().salad;
    const missing = missingFruits();
    const target = missing[0];
    if (!missing.includes(id) || (level <= 1 && id !== target)) {
      if (level <= 1) {
        kit.setHint(target); // mức 1: quả cần chọn nhún, không tính nhầm
        return;
      }
      if (!countWrong(`fr:${id}`)) return;
      if (wrongs >= 2) kit.setHint(target);
      const k = stepKey();
      await talk([id === s.no ? { ...C(noFruitLine(id)), slow: true } : C(fruitWrongLine(id, missing))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (!taken.take(`f:${id}`)) return;
    kit.clearNudge();
    kit.setHint(null);
    setState('busy');
    if (id !== 'banana') seen(`fruit:${id}`);
    snap();
    const g = await kit.flyTo(fruitFace(id, 'cf-fruit'), from, center(work.getBoundingClientRect()));
    kit.removeGhost(g);
    if (e !== kit.epoch) return;
    play('pop');
    wrongs = 0;
    nudges = 0;
    const next = saladPhase();
    if (next === 'fruit' && level >= 2) {
      // Mức 2–3 đã nghe cả câu gọi quả: chọn quả tiếp không nói lại.
      renderCook();
      setState('fruit');
      snap();
      kit.armNudge();
      return;
    }
    startCook(false);
  }
  /** Pizza vào lò: cửa đóng, đèn cam, tick-tock ~2 giây, ding (như bánh nướng). */
  async function bakePizza(e) {
    play('whoosh');
    work.classList.add('in-oven');
    await Promise.all([talk([C(eVerbLine('bake'))]), wait(ANIM_MS / 2)]);
    if (e !== kit.epoch) return;
    oven.classList.add('on');
    for (let t = 0; t < 4; t++) {
      play('tick');
      await wait(OVEN_MS / 4);
      if (e !== kit.epoch) return;
    }
    play('ding');
    oven.classList.remove('on');
    work.classList.remove('in-oven');
    wrongs = 0;
    nudges = 0;
    hotPizza(e);
  }
  /** Bánh ra lò còn nóng 2 giây: chạm bánh → rung + "Hot! Wait!" (không tính nhầm); hết hơi thì tự ra đĩa (SPEC-jobs5 4.3). */
  async function hotPizza(e) {
    if (e !== kit.epoch) return;
    renderCook();
    work.classList.add('baked', 'hot');
    setState('hot');
    snap();
    await Promise.all([talk([C(HOT_LINE)]), wait(HOT_MS)]);
    if (e !== kit.epoch) return;
    work.classList.remove('hot');
    dishDone(e);
  }
  function tapHotPizza() {
    if (state !== 'hot' || !hungry()) return;
    restartAnim(work, 'shake');
    talk([C(HOT_LINE)]);
  }
  async function giveTopping(id, from) {
    if (state !== 'topping') return;
    const e = kit.epoch;
    const w = cur().pizza.want.find((x) => x.id === id);
    if (!w) {
      if (!countWrong(`tp:${id}`)) return;
      kit.setHint(missingTops()[0]);
      const k = stepKey();
      await talk([C(toppingWrongLine(id, missingTops()))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (placedTop(id) >= w.n) {
      // Loại này đủ rồi: không nhận, không tính nhầm; loại kia vẫn đặt được (như ca Trang trí).
      talk([C(ENOUGH_LINE)]);
      return;
    }
    const n = placedTop(id) + 1;
    if (!taken.take(`t:${id}:${n - 1}`)) return;
    kit.clearNudge();
    kit.setHint(null);
    const done = !missingTops().length;
    if (done) setState('busy');
    snap();
    const g = await kit.flyTo(h('span.cf-item.cf-fly', { text: TOPPINGS[id].emoji }), from, center(work.getBoundingClientRect()));
    kit.removeGhost(g);
    if (e !== kit.epoch) return;
    play('pop');
    renderCook();
    const k = stepKey();
    await talk([C(countLine(n))]);
    if (e !== kit.epoch) return;
    if (done) return startCook(false);
    if (k === stepKey()) kit.armNudge();
  }
  async function dishDone(e) {
    if (e !== kit.epoch) return;
    setState('busy');
    kit.renderTray([]);
    work.classList.add('ready');
    await talk([C(READY_LINE)]);
    if (e !== kit.epoch) return;
    startEat();
  }
  /** Ăn (SPEC-jobs5 4.3): 3 lần chạm hết đĩa, Bông ăn cùng; 5 giây không chạm thì món tự hết. */
  function startEat() {
    const art = work.firstElementChild?.cloneNode(true) ?? h('span', { text: MENU[dish].emoji });
    if (dish === 'salad') art.append(...work.querySelectorAll('.cf-sfruits'));
    work.hidden = true;
    ktools.hidden = true;
    oven.hidden = true;
    menuEl.hidden = true;
    kit.renderTray([]);
    stack.replaceChildren(h('span.cf-eat', { dataset: { dish } }, art));
    plate.hidden = false;
    plate.classList.remove('ready');
    const n = bites();
    plate.dataset.bites = String(n);
    if (n >= BITES) return eatAll(kit.epoch);
    setState('eat');
    snap();
    armEat();
  }
  const bites = () => taken.list().filter((k) => k.startsWith('bite:')).length;
  async function armEat() {
    const tok = ++eatTok;
    const e = kit.epoch;
    // Giờ thật (không rút ngắn ở chế độ chạy nhanh của test): bé luôn có đủ 5 giây để tự chạm ăn.
    await new Promise((resolve) => setTimeout(resolve, EAT_IDLE_MS));
    if (tok === eatTok && e === kit.epoch && state === 'eat') eatAll(e);
  }
  function bite() {
    const n = bites();
    if (state !== 'eat' || !taken.take(`bite:${n}`)) return;
    play('munch');
    restartAnim(bongEl, 'hop');
    plate.dataset.bites = String(n + 1);
    snap();
    if (n + 1 >= BITES) eatAll(kit.epoch);
    else armEat();
  }
  async function eatAll(e) {
    if (e !== kit.epoch) return;
    eatTok += 1;
    setState('busy');
    plate.dataset.bites = String(BITES);
    seen(`dish:${dish}`);
    snapNext();
    await talk([C(YUMMY_Q_LINE), B(BONG_YUMMY_LINE)]);
    if (e !== kit.epoch) return;
    restartAnim(bongEl, 'rub');
    play('burp');
    await talk([B(BONG_FULL_LINE)]);
    if (e !== kit.epoch) return;
    plate.hidden = true;
    delete plate.dataset.bites;
    dish = null;
    nextCase(e);
  }

  // Dọn bếp (SPEC-jobs4 3.2) — cuối lượt, mức 2–3.
  const cleanTarget = () => plan.clean.asks.find((id) => !taken.has(`in:${id}`)) ?? null;
  async function startClean(resume = null) {
    const e = kit.epoch;
    caseIdx = plan.cases.length;
    wrongs = resume?.wrongs ?? 0;
    nudges = resume?.nudges ?? 0;
    taken = claims(resume?.taken ?? []);
    setState('enter');
    showScene('clean');
    renderClean();
    snap();
    if (!resume) {
      await talk([C(CLEAN_LINE)]);
      if (e !== kit.epoch) return;
    }
    askClean(e);
  }
  function renderClean() {
    const target = cleanTarget();
    places.replaceChildren(...PLACE_ORDER.map((id) => h('button.cf-place', {
      type: 'button', 'aria-label': PLACES[id].vi, dataset: { place: id }, onclick: () => tapPlace(id),
    }, h('span', { html: PLACE_SVG[id] }))));
    counter.replaceChildren(...plan.clean.items.map((id) => h('button.cf-citem', {
      type: 'button', 'aria-label': CLEAN_ITEMS[id].vi, dataset: { item: id },
      class: `${taken.has(`in:${id}`) ? 'in' : ''}${taken.has(`sel:${id}`) && !taken.has(`in:${id}`) ? ' sel' : ''}${level <= 2 && id === target ? ' next' : ''}`,
      onclick: () => tapCleanItem(id),
    }, cleanFace(id, 'span'))));
    cleanRoom.dataset.target = target ?? ''; // cho test; bé không thấy
    cleanRoom.dataset.place = target ? CLEAN_ITEMS[target].place : '';
  }
  async function askClean(e) {
    const target = cleanTarget();
    renderClean();
    setState('clean');
    snap();
    await talk([C(cleanAskLine(target, level, target !== plan.clean.asks[0]))]);
    if (e === kit.epoch && state === 'clean') kit.armNudge();
  }
  async function tapCleanItem(id) {
    if (state !== 'clean' || level <= 2 || taken.has(`in:${id}`)) return;
    const e = kit.epoch;
    const target = cleanTarget();
    if (taken.has(`sel:${target}`)) return; // đã chọn đồ — giờ chọn chỗ
    const el = counter.querySelector(`[data-item="${id}"]`);
    if (id !== target) {
      if (!countWrong(`ci:${id}`)) return;
      restartAnim(el, 'shake');
      if (wrongs >= 2) restartAnim(counter.querySelector(`[data-item="${target}"]`), 'nudge');
      const k = stepKey();
      await talk([C(itemWrongLine(id, target))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (!taken.take(`sel:${id}`)) return;
    kit.clearNudge();
    if (wrongs === 0 && CLEAN_ITEMS[id].word) record(`clean:${id}`, CLEAN_ITEMS[id].word, CLEAN_ITEMS[id].emoji);
    // Bước chọn đồ xong: khóa, lần nhầm của bước chọn chỗ tính lại từ đầu.
    wrongs = 0;
    nudges = 0;
    snap();
    play('pop');
    el.classList.add('sel');
    if (e === kit.epoch) kit.armNudge();
  }
  async function tapPlace(place) {
    if (state !== 'clean') return;
    const e = kit.epoch;
    const target = cleanTarget();
    const itemEl = counter.querySelector(`[data-item="${target}"]`);
    const placeEl = places.querySelector(`[data-place="${place}"]`);
    if (level >= 3 && !taken.has(`sel:${target}`)) {
      // Chưa chọn đồ: đồ cần cất nhún, chú nhắc lại (không tính nhầm).
      restartAnim(itemEl, 'nudge');
      const k = stepKey();
      await talk([C(cleanAskLine(target, level, target !== plan.clean.asks[0]))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (place !== CLEAN_ITEMS[target].place) {
      if (!countWrong(`p:${place}`)) return;
      restartAnim(placeEl, 'shake');
      if (wrongs >= 2) restartAnim(places.querySelector(`[data-place="${CLEAN_ITEMS[target].place}"]`), 'nudge');
      const k = stepKey();
      await talk([C(placeWrongLine(place, target))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (!taken.take(`in:${target}`)) return;
    kit.clearNudge();
    setState('busy');
    wrongs = 0;
    nudges = 0;
    const all = !cleanTarget();
    snap(all ? { cleanDone: true } : {});
    const g = await kit.flyTo(cleanFace(target, 'span.cf-item.cf-fly'), center(itemEl.getBoundingClientRect()), center(placeEl.getBoundingClientRect()));
    kit.removeGhost(g);
    if (e !== kit.epoch) return;
    play('pop');
    restartAnim(placeEl, 'hop');
    if (!all) return askClean(e);
    seen('clean');
    renderClean();
    cleanRoom.classList.add('shine');
    play('sparkle');
    await talk([C(ALL_CLEAN_LINE)]);
    if (e !== kit.epoch) return;
    finishRound();
  }

  async function nextCase(e) {
    setState('leave');
    restartAnim(custEl, 'leave');
    await wait(LEAVE_MS);
    if (e !== kit.epoch) return;
    custEl.classList.remove('leave');
    caseIdx += 1;
    if (caseIdx < plan.cases.length) startCase();
    else if (plan.clean) startClean();
    else finishRound();
  }
  function finishRound() {
    if (state === 'done') return;
    setState('done');
    kit.finishRound(() => {
      clearSnap(JOB);
      progress = afterJobRound(progress, { maxLevel: MAX_LEVEL });
      app.setSetting('chefGame', progress).catch(() => {});
    });
  }
  function restart() {
    if (state === 'done' || !plan) return;
    kit.cancelAll();
    caseIdx = 0;
    startCase();
  }
  function repeatPrompt() {
    if (!ACTIVE.includes(state)) return;
    const k = stepKey();
    talk(promptLines()).then(() => k === stepKey() && kit.armNudge());
  }

  loadPersonImage(app, JOB).then((url) => {
    if (!url) return;
    if (kit.signal.aborted) URL.revokeObjectURL(url);
    else {
      kit.setHostImage(url);
      kit.onCleanup(() => URL.revokeObjectURL(url));
    }
  });

  const s = takeSnap(JOB, { level, continueDirectly: params.continueDirectly });
  // Nạp ảnh món trước khi dựng khay / đĩa (đọc máy rất nhanh), để món không đổi từ emoji sang ảnh giữa chừng.
  loadJobItemImages(app).then((loaded) => {
    if (kit.signal.aborted) {
      loaded.revoke();
      return;
    }
    pics = loaded;
    kit.onCleanup(loaded.revoke);
    if (s) {
      plan = s.plan;
      caseIdx = s.caseIdx;
      recorded = new Set(s.recorded ?? []);
      washed = s.washed;
      if (!washed) startWash();
      else if (caseIdx >= plan.cases.length && plan.clean && !s.cleanDone) startClean(s.cleanOn ? s : null);
      else if (caseIdx >= plan.cases.length) {
        caseIdx = plan.cases.length - 1;
        count.textContent = `${plan.cases.length}/${plan.cases.length}`;
        finishRound();
      } else startCase(s);
    } else {
      plan = planRound(level, { seen: progress.seen, rounds: progress.rounds });
      caseIdx = 0;
      startWash();
    }
  });

  return kit.cleanup;
}
