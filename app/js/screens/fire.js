// Trò Lính cứu hỏa (SPEC-jobs.md mục 7): chạm từng ngọn lửa nhỏ để phun nước (Bông đếm), hết lửa bạn thú cảm ơn.
// Mức 2: hỏi "How many fires?" (3 thẻ số) + một ca cứu bạn trên cây bằng thang; mức 3: Bông gọi chỗ lửa ("on the roof").
// SPEC-fire2.md: đầu lượt mặc đồ cho Bông (helmet, jacket, boots); trước ca dập lửa / cứu trong nhà lái xe tới đúng nhà theo
// màu; ca cứu trong nhà: gõ cửa → mở cửa → bạn thú ra; ca cuối: An toàn với lửa (chạm được không? — mức 3 bấm 114).
// 3 ca → sticker. Trạng thái: dress → (drive →) enter → spray | count | tree | knock → open ⇄ busy → thanks → leave → ca sau | done.
// Khung chung ở jobs/kit.js.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { mediaBlob } from '../db.js';
import { patientSvg } from '../patients.js';
import { PATIENT_BY_ID } from '../doctor.js';
import { SOUND_BY_ID } from '../animal-sounds.js';
import { playSoundFile } from './animal-sounds.js';
import { markPracticed } from '../player/track.js';
import { cleanJobState, afterJobRound, afterSeen } from '../jobs/levels.js';
import { JOBS_BG_IMAGES } from '../jobs/backgrounds.js';
import { COLOR_BY_ID } from '../jobs/post.js';
import { jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, reduceMotion, WRONG_LOCK_MS, MAX_NUDGES } from '../jobs/kit.js';
import { scaled } from '../timing.js';
import {
  MAX_LEVEL, GEAR, GEAR_INFO, planRound, countLine, allGoneLine, rightNumberLine, wrongNumberLine, whereLine, firstLine,
  ALARM_LINE, TAP_LINE, THANKS_LINE, HOW_MANY_LINE, TREE_LINE, LADDER_LINE, DOWN_LINE,
  FIRE_GEAR_IMAGES, FIRE_GEAR_FRAMES, GEAR_ANCHOR,
  READY_LINE, DRESS_ANY_LINE, GO_LINE, putOnLine, gearOnLine, wrongGearLine, goToLine, wrongHouseLine,
  STUCK_LINE, KNOCK_LINE, KNOCKED_LINE, OPEN_LINE, SAFE_LINE,
  SAFETY_BY, FIRE_NUMBER, KEY_WORDS, SAFETY_INTRO, GROWNUP_LINE, DIAL_LINE, STATION_LINE, lookLine, safetyRightLine, safetyWrongLine, wrongKeyLine,
} from '../jobs/fire.js';

const JOB = 'fire';
const ENTER_MS = 650;
const LEAVE_MS = 600;
const OUT_MS = 450; // ngọn lửa nhỏ dần rồi tắt
const JET_MS = 280; // tia nước vươn từ vòi tới ngọn lửa
const SPLASH_MS = 500;
const DRIVE_MS = 900; // xe cứu hỏa chạy tới nhà
const ACTIVE = ['dress', 'drive', 'spray', 'count', 'tree', 'knock', 'open', 'safety', 'dial'];
/** Chỗ ngọn lửa trên ngôi nhà (phần trăm của khung nhà). */
const SPOT_XY = { roof: [50, 24], window: [30, 56], window2: [70, 56], door: [50, 84], chimney: [76, 12] };

/** Ngôi nhà; có `color` (mã màu của trò Bưu tá) thì tường / mái theo màu đó — nhà của ca cùng màu nhà bé chọn trên phố. */
function houseSvg(color) {
  const c = COLOR_BY_ID.get(color);
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
  <rect x="68" y="4" width="12" height="20" fill="#c0392b" stroke="#3d2c5e" stroke-width="2.5"/>
  <path d="M6 40 L50 6 L94 40 Z" fill="${c?.roof ?? '#e8590c'}" stroke="#3d2c5e" stroke-width="3" stroke-linejoin="round"/>
  <rect x="14" y="38" width="72" height="58" rx="3" fill="${c?.wall ?? '#ffe8cc'}" stroke="#3d2c5e" stroke-width="3"/>
  <rect x="21" y="48" width="18" height="16" rx="2" fill="#a5d8ff" stroke="#3d2c5e" stroke-width="2.5"/>
  <rect x="61" y="48" width="18" height="16" rx="2" fill="#a5d8ff" stroke="#3d2c5e" stroke-width="2.5"/>
  <rect x="41" y="70" width="18" height="26" rx="2" fill="#8d5a3b" stroke="#3d2c5e" stroke-width="2.5"/>
</svg>`;
}
const FLAME_SVG = `<svg viewBox="0 0 60 80" aria-hidden="true">
  <path d="M30 4 C36 22 54 30 52 52 C50 70 38 78 30 78 C20 78 8 70 8 52 C8 38 18 34 20 20 C26 30 28 22 30 4 Z" fill="#ff922b" stroke="#e8590c" stroke-width="3"/>
  <path d="M30 34 C34 44 42 48 40 60 C39 68 34 72 30 72 C24 72 20 68 20 60 C20 52 26 48 30 34 Z" fill="#ffd43b"/>
</svg>`;
const TREE_SVG = `<svg viewBox="0 0 100 120" aria-hidden="true">
  <rect x="42" y="56" width="16" height="62" rx="4" fill="#a9744a" stroke="#3d2c5e" stroke-width="3"/>
  <path d="M58 64 L78 50" stroke="#a9744a" stroke-width="7" stroke-linecap="round"/>
  <circle cx="50" cy="36" r="32" fill="#51cf66" stroke="#2b8a3e" stroke-width="3"/>
  <circle cx="26" cy="50" r="16" fill="#51cf66" stroke="#2b8a3e" stroke-width="3"/>
  <circle cx="76" cy="46" r="18" fill="#51cf66" stroke="#2b8a3e" stroke-width="3"/>
</svg>`;

// ---------- Chú lính cứu hỏa (SPEC-art ART2): thân + từng món đồ là một lớp (mặc món nào hiện lớp đó) ----------
// Vẽ đối xứng quanh trục x = 110: mũ giữa đầu, áo hai bên như nhau, hai ủng tách rời.
const INK = '#3d2c5e';
const SKIN = '#ffd6b0';
const SW = `stroke="${INK}" stroke-width="3" stroke-linejoin="round"`;
const GEAR_PARTS = {
  jacket: `<rect x="40" y="114" width="28" height="94" rx="14" fill="#ffd43b" ${SW}/>
    <rect x="152" y="114" width="28" height="94" rx="14" fill="#ffd43b" ${SW}/>
    <path d="M64 112 Q110 100 156 112 L158 212 Q110 220 62 212 Z" fill="#ffd43b" ${SW}/>
    <rect x="63" y="176" width="94" height="8" fill="#e9ecef" stroke="#adb5bd" stroke-width="1.5"/>
    <rect x="63" y="192" width="94" height="8" fill="#e9ecef" stroke="#adb5bd" stroke-width="1.5"/>
    <rect x="41" y="180" width="26" height="7" fill="#e9ecef"/><rect x="153" y="180" width="26" height="7" fill="#e9ecef"/>
    <path d="M110 108 V214" stroke="${INK}" stroke-width="2.5"/>
    <path d="M92 104 L110 118 L128 104" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  boots: `<rect x="75" y="242" width="34" height="50" rx="8" fill="#343a40" ${SW}/>
    <rect x="111" y="242" width="34" height="50" rx="8" fill="#343a40" ${SW}/>
    <ellipse cx="90" cy="296" rx="22" ry="10" fill="#343a40" ${SW}/>
    <ellipse cx="130" cy="296" rx="22" ry="10" fill="#343a40" ${SW}/>
    <rect x="76" y="250" width="32" height="6" fill="#ffd43b"/><rect x="112" y="250" width="32" height="6" fill="#ffd43b"/>`,
  helmet: `<path d="M68 56 Q68 14 110 12 Q152 14 152 56 Z" fill="#e03131" ${SW}/>
    <ellipse cx="110" cy="56" rx="54" ry="8" fill="#c92a2a" ${SW}/>
    <path d="M110 14 V54" stroke="#c92a2a" stroke-width="5"/>
    <circle cx="110" cy="36" r="10" fill="#ffd43b" stroke="${INK}" stroke-width="2.5"/>`,
};
/** Khung nhìn của từng món khi đứng riêng (trong khay / đang bay). */
const GEAR_VIEW = { helmet: '50 4 120 64', jacket: '34 96 152 126', boots: '62 236 96 72' };

function firefighterSvg() {
  return `<svg class="ff-svg" viewBox="0 0 220 330" aria-hidden="true">
    <rect x="78" y="196" width="30" height="96" rx="10" fill="#4263eb" ${SW}/>
    <rect x="112" y="196" width="30" height="96" rx="10" fill="#4263eb" ${SW}/>
    <ellipse cx="91" cy="296" rx="19" ry="9" fill="#f8f9fa" ${SW}/>
    <ellipse cx="129" cy="296" rx="19" ry="9" fill="#f8f9fa" ${SW}/>
    <rect x="47" y="146" width="18" height="58" rx="9" fill="${SKIN}" ${SW}/>
    <rect x="155" y="146" width="18" height="58" rx="9" fill="${SKIN}" ${SW}/>
    <rect x="44" y="116" width="24" height="40" rx="12" fill="#4dabf7" ${SW}/>
    <rect x="152" y="116" width="24" height="40" rx="12" fill="#4dabf7" ${SW}/>
    <rect x="66" y="110" width="88" height="98" rx="20" fill="#4dabf7" ${SW}/>
    <rect x="101" y="96" width="18" height="18" fill="${SKIN}" ${SW}/>
    <g class="ff-wear" data-gear="jacket">${GEAR_PARTS.jacket}</g>
    <g class="ff-wear" data-gear="boots">${GEAR_PARTS.boots}</g>
    <circle cx="70" cy="70" r="8" fill="${SKIN}" ${SW}/>
    <circle cx="150" cy="70" r="8" fill="${SKIN}" ${SW}/>
    <circle cx="110" cy="66" r="40" fill="${SKIN}" ${SW}/>
    <path d="M71 60 Q72 26 110 25 Q148 26 149 60 Q132 44 110 44 Q88 44 71 60 Z" fill="#6b4226" ${SW}/>
    <circle cx="96" cy="72" r="5" fill="${INK}"/><circle cx="124" cy="72" r="5" fill="${INK}"/>
    <circle cx="97.5" cy="70" r="1.6" fill="#fff"/><circle cx="125.5" cy="70" r="1.6" fill="#fff"/>
    <ellipse cx="86" cy="84" rx="7" ry="4" fill="#ff9ab5" opacity="0.6"/><ellipse cx="134" cy="84" rx="7" ry="4" fill="#ff9ab5" opacity="0.6"/>
    <path d="M98 86 Q110 97 122 86" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <g class="ff-wear" data-gear="helmet">${GEAR_PARTS.helmet}</g>
    <circle cx="56" cy="208" r="11" fill="${SKIN}" ${SW}/>
    <circle cx="164" cy="208" r="11" fill="${SKIN}" ${SW}/>
    <g class="ff-nozzle">
      <path d="M164 208 Q186 204 198 188" fill="none" stroke="#495057" stroke-width="9" stroke-linecap="round"/>
      <rect class="ff-tip" x="192" y="174" width="24" height="13" rx="3" fill="#868e96" stroke="${INK}" stroke-width="2.5" transform="rotate(-30 204 180)"/>
    </g>
  </svg>`;
}
/**
 * Ảnh lưới chú lính cứu hỏa bố mẹ thêm (SPEC-art ART2): đủ 6 ô mới dùng (thiếu thì hình vẽ sẵn — không trộn kiểu).
 * @returns {Promise<{ map: Map<string, string>, revoke: () => void }>}
 */
async function loadGearImages(app) {
  const map = new Map();
  for (const img of await app.db.getAllByIndex('images', 'lessonId', FIRE_GEAR_IMAGES).catch(() => [])) {
    map.set(img.word, URL.createObjectURL(mediaBlob(img)));
  }
  return { map, revoke: () => map.forEach((u) => URL.revokeObjectURL(u)) };
}
/** Màn mặc đồ bằng ảnh: chú mặc đồ thường + các món dán đúng chỗ (ghép ảnh); mặc đủ → chuyển mờ sang ảnh mặc đủ đồ. */
function photoDress(map) {
  const part = (id) => {
    const a = GEAR_ANCHOR[id];
    return h('img.ff-wear.ff-photo-part', { src: map.get(id), alt: '', dataset: { gear: id }, style: { left: `${a.left}%`, top: `${a.top}%`, width: `${a.width}%` } });
  };
  return h('div.ff-photo', {},
    h('img.ff-photo-base', { src: map.get('plain'), alt: '' }),
    part('jacket'), part('boots'), part('helmet'),
    h('img.ff-photo-full', { src: map.get('full'), alt: '' }));
}
export function fireScreen(app, params = {}) {
  let progress = cleanJobState(app.settings.fireGame, { maxLevel: MAX_LEVEL });
  const level = progress.level;
  let plan = null; // { gear, cases }
  let caseIdx = 0;
  let out = new Set(); // mã ngọn lửa đã tắt
  let worn = new Set(); // đồ Bông đã mặc
  let dressed = false;
  let drove = false; // ca này đã lái xe tới nhà
  let knocked = false; // ca cứu trong nhà: đã gõ cửa
  let safetyIdx = 0; // ca An toàn: đồ thứ mấy
  let dialed = 0; // ca An toàn mức 3: đã bấm mấy số của 114
  let wrongs = 0;
  let nudges = 0;
  let state = 'start';
  let lastWrong = { key: '', at: 0 };

  const cur = () => plan?.cases[caseIdx];
  const resident = () => PATIENT_BY_ID.get(cur()?.resident);
  const R = (line) => ({ who: 'resident', line });
  const B = (line) => ({ who: 'bong', line });
  /** Mức 3: ngọn lửa Bông đang gọi (ngọn đầu tiên trong thứ tự còn cháy). */
  const targetFire = () => (cur()?.order ? cur().order.find((id) => !out.has(id)) : null);
  const spotOf = (id) => cur().fires.find((f) => f.id === id)?.spot;
  /** Món Bông đang gọi (mức 2–3); mức 1 mặc thứ tự nào cũng được → null. */
  const wantGear = () => (level >= 2 ? plan.gear.order.find((g) => !worn.has(g)) : null);
  const nextGear = () => wantGear() ?? GEAR.find((g) => !worn.has(g));

  const scene = h('div.fr-scene');
  const residentEl = h('div.fr-resident');
  // Bông lính cứu hỏa cầm vòi: chạm được — phun vào ngọn lửa cần dập (như chạm thẳng ngọn lửa), luôn có phản hồi.
  const hose = h('button.fr-hose', { type: 'button', 'aria-label': 'Vòi phun nước', html: firefighterSvg(), onclick: () => tapHose() });
  hose.querySelector('svg').classList.add('ff-all');
  const choices = h('div.fr-choices');
  const homes = h('div.fr-homes');
  const truck = h('button.fr-truck', { type: 'button', 'aria-label': 'Xe cứu hỏa', onclick: () => honk() }, h('span', { text: '🚒' }));
  const street = h('div.fr-street', { hidden: true }, homes, h('div.fr-road', {}, truck));
  let dressFig = h('div.ff-dress', { html: firefighterSvg() });
  let gearPhotos = null; // Map ảnh lưới (đủ 6 ô) hoặc null = hình vẽ sẵn
  /** Hình một món đồ (khay / đang bay): ảnh bố mẹ thêm, chưa có thì hình vẽ; món lạ dùng emoji. */
  const gearFace = (id) => {
    if (GEAR_INFO[id]?.emoji) return h('span.dr-item-face', { text: GEAR_INFO[id].emoji, 'aria-hidden': 'true' });
    if (gearPhotos) return h('img.dr-item-face.ff-gear-img', { src: gearPhotos.get(id), alt: '', draggable: false });
    return h('span.dr-item-face.ff-gear-face', { 'aria-hidden': 'true', html: `<svg viewBox="${GEAR_VIEW[id]}">${GEAR_PARTS[id]}</svg>` });
  };
  const safetyEl = h('div.fr-safety', { hidden: true });

  const kit = jobScreen(app, {
    job: JOB, background: { lessonId: JOBS_BG_IMAGES, word: JOB }, className: 'fr-play', stageClass: 'fr-stage', title: '🚒 Firefighter', helperLabel: 'Bông cứu hỏa', cap: 'fire',
    resetLabel: 'Chơi lại', trayLabel: 'Đồ cứu hỏa',
    icon: (who) => (who === 'resident' ? resident()?.emoji ?? '' : '🐰'),
    onTalk: (who) => residentEl.classList.toggle('talking', who === 'resident'),
    onReset: () => restart(),
    onHelper: () => repeatPrompt(),
    nudge: {
      ready: () => ACTIVE.includes(state) && nudges < MAX_NUDGES,
      key: () => stepKey(),
      fire: (rearm) => {
        nudges += 1;
        snap();
        nudgeWanted();
        kit.talk([B(promptLine())]).then(rearm);
      },
    },
    tray: {
      face: (id) => (id === 'ladder' ? h('span.dr-item-face', { text: '🪜', 'aria-hidden': 'true' }) : gearFace(id)),
      label: (id) => (id === 'ladder' ? 'Cái thang' : GEAR_INFO[id].en),
      canGive: () => state === 'tree' || state === 'dress',
      dropOk: () => true, // thả ở đâu cũng được: thang tự đặt vào cây, đồ tự mặc lên Bông
      give: (id, from) => (state === 'dress' ? wearGear(id, from) : placeLadder()),
    },
  });
  const { stage, count, talk } = kit;
  stage.append(scene, residentEl, hose, choices, street, safetyEl);
  const stepKey = () => `${kit.epoch}:${caseIdx}:${out.size}:${worn.size}:${safetyIdx}:${dialed}:${state}`;

  function setState(s) {
    state = s;
    scene.dataset.target = (cur()?.kind === 'fire' && targetFire()) || ''; // mức 3: ngọn Bông đang gọi (cho test)
    scene.dataset.want = s === 'dress' ? wantGear() ?? '' : ''; // mức 2–3: món Bông đang gọi (cho test)
    kit.setState(s, ACTIVE.includes(s));
    choices.classList.toggle('locked', s !== 'count');
  }
  const snap = () => saveSnap(JOB, { level, plan, caseIdx, out: [...out], worn: [...worn], dressed, drove, knocked, safetyIdx, dialed, wrongs, nudges, phase: state });
  /** Ca xong (nhận thao tác đúng cuối cùng): lưu để chơi tiếp là ca sau — ra nền giữa hoạt ảnh không bị kẹt / làm lại. */
  const caseDone = () => saveSnap(JOB, { level, plan, caseIdx: caseIdx + 1, out: [], worn: [...worn], dressed: true, drove: false, knocked: false, safetyIdx: 0, dialed: 0, wrongs: 0, nudges: 0, phase: 'start' });

  function promptLine() {
    if (state === 'dress') return wantGear() ? putOnLine(wantGear()) : DRESS_ANY_LINE;
    if (state === 'drive') return goToLine(cur().house.color);
    if (state === 'count') return HOW_MANY_LINE;
    if (state === 'tree') return LADDER_LINE;
    if (state === 'knock') return KNOCK_LINE;
    if (state === 'open') return OPEN_LINE;
    if (state === 'safety') return lookLine(cur().items[safetyIdx]);
    if (state === 'dial') return DIAL_LINE;
    return targetFire() ? whereLine(spotOf(targetFire())) : TAP_LINE;
  }
  function nudgeWanted() {
    if (state === 'dress') restartAnim(kit.trayItem(nextGear()), 'nudge');
    else if (state === 'drive') restartAnim(homes.querySelector(`[data-color="${cur().house.color}"]`), 'nudge');
    else if (state === 'tree') restartAnim(kit.trayItem('ladder'), 'nudge');
    else if (state === 'knock' || state === 'open') restartAnim(scene.querySelector('.fr-door'), 'nudge');
    else if (state === 'safety') restartAnim(safetyEl.querySelector(`[data-answer="${SAFETY_BY.get(cur().items[safetyIdx]).hot ? 'no' : 'yes'}"]`), 'nudge');
    else if (state === 'dial') restartAnim(safetyEl.querySelector('.fr-key.lit'), 'nudge');
    else if (state === 'count') restartAnim(choices.querySelector(`[data-n="${cur().fires.length}"]`), 'nudge');
    else restartAnim(scene.querySelector(`.fr-fire[data-id="${targetFire() ?? cur().fires.find((f) => !out.has(f.id))?.id}"]`), 'nudge');
  }
  /** Chạm nhầm cùng một chỗ liền nhau: gộp thành một lần nhầm. */
  function lockedWrong(key) {
    const now = Date.now();
    if (key === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return true;
    lastWrong = { key, at: now };
    return false;
  }

  // ---------- Mặc đồ (SPEC-fire2 mục 3) ----------
  function renderGear() {
    for (const g of dressFig.querySelectorAll('[data-gear]')) g.classList.toggle('ff-on', worn.has(g.dataset.gear));
    dressFig.classList.toggle('ff-done', GEAR.every((g) => worn.has(g)));
    kit.renderTray(plan.gear.tray.filter((id) => !worn.has(id)));
  }
  async function startGear() {
    const e = kit.epoch;
    // Ra nền đúng lúc vừa mặc món cuối: mặc đủ rồi thì đi luôn.
    if (GEAR.every((g) => worn.has(g))) {
      dressed = true;
      caseIdx = 0;
      startCase();
      return;
    }
    dressed = false;
    count.textContent = `1/${plan.cases.length}`;
    residentEl.hidden = true;
    hose.hidden = true;
    street.hidden = true;
    safetyEl.hidden = true;
    scene.dataset.kind = 'dress';
    scene.replaceChildren(dressFig);
    renderGear();
    // Nhận đồ ngay từ lúc Bông nói (bé hay làm trước khi Bông nói xong).
    setState('dress');
    snap();
    await talk([B(READY_LINE), B(promptLine())]);
    if (e === kit.epoch && state === 'dress') kit.armNudge();
  }
  async function wearGear(id, from) {
    if (state !== 'dress' || worn.has(id)) return;
    const e = kit.epoch;
    const want = wantGear();
    if (GEAR_INFO[id].emoji || (want && id !== want)) {
      if (lockedWrong(`g:${id}`)) return;
      wrongs += 1;
      snap();
      kit.clearNudge();
      play('boing');
      restartAnim(kit.trayItem(id), 'shake');
      if (wrongs >= 2) restartAnim(kit.trayItem(nextGear()), 'nudge');
      const k = stepKey();
      await talk([B(wrongGearLine(id, nextGear()))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    // Đúng: mặc NGAY (một lần), rồi đồ bay lên người Bông + câu nói.
    worn.add(id);
    wrongs = 0;
    nudges = 0;
    const all = GEAR.every((g) => worn.has(g));
    if (all) setState('busy');
    else setState('dress');
    snap();
    kit.clearNudge();
    kit.renderTray(plan.gear.tray.filter((x) => !worn.has(x)));
    const part = dressFig.querySelector(`[data-gear="${id}"]`);
    const ghost = await kit.flyTo(gearFace(id), from, center(part.getBoundingClientRect()));
    kit.removeGhost(ghost);
    if (e !== kit.epoch) return;
    part.classList.add('ff-on');
    play('pop');
    if (!all) {
      const k = stepKey();
      const next = wantGear();
      await talk([B(gearOnLine(id)), ...(next ? [B(putOnLine(next))] : [])]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    dressed = true;
    snap();
    await talk([B(gearOnLine(id))]);
    if (e !== kit.epoch) return;
    play('sparkle');
    dressFig.classList.add('ff-done'); // ảnh: chuyển mờ dần sang ảnh mặc đủ đồ
    restartAnim(dressFig, 'spin');
    await talk([B(GO_LINE)]);
    if (e !== kit.epoch) return;
    caseIdx = 0;
    startCase();
  }

  // ---------- Lái xe tới đúng nhà (SPEC-fire2 mục 4) ----------
  function siren(e) {
    // Còi xe cứu hỏa (file tiếng thật của Ai kêu thế?); không phát được thì bỏ qua.
    playSoundFile(SOUND_BY_ID.get('fire-truck'), { isCurrent: () => e === kit.epoch }).catch(() => {});
  }
  function honk() {
    restartAnim(truck, 'honk');
    siren(kit.epoch);
  }
  async function startDrive() {
    const e = kit.epoch;
    const c = cur();
    count.textContent = `${caseIdx + 1}/${plan.cases.length}`;
    residentEl.hidden = true;
    hose.hidden = true;
    choices.replaceChildren();
    scene.replaceChildren();
    scene.dataset.kind = 'drive';
    kit.renderTray([]);
    truck.getAnimations().forEach((a) => a.cancel());
    homes.replaceChildren(...c.house.street.map((color) => h('button.fr-home', {
      type: 'button', 'aria-label': `${color} house`, dataset: { color }, html: houseSvg(color),
      onclick: () => pickHouse(color),
    }, c.house.smoke && color === c.house.color ? h('span.fr-smoke', { 'aria-hidden': 'true' }, h('span'), h('span'), h('span')) : null)));
    street.dataset.color = c.house.color; // nhà cần tới (cho test)
    street.hidden = false;
    setState('drive');
    snap();
    await talk([B(goToLine(c.house.color))]);
    if (e === kit.epoch && state === 'drive') kit.armNudge();
  }
  async function pickHouse(color) {
    if (state !== 'drive') return;
    const e = kit.epoch;
    const want = cur().house.color;
    const el = homes.querySelector(`[data-color="${color}"]`);
    if (color !== want) {
      if (lockedWrong(`h:${color}`)) return;
      wrongs += 1;
      snap();
      kit.clearNudge();
      play('boing');
      restartAnim(el, 'shake');
      if (wrongs >= 2) restartAnim(homes.querySelector(`[data-color="${want}"]`), 'nudge');
      const k = stepKey();
      await talk([B(wrongHouseLine(color, want))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    // Đúng: nhận NGAY (một lần), xe chạy tới nhà, còi kêu, rồi vào ca.
    setState('busy');
    kit.clearNudge();
    if (wrongs === 0) markPracticed(app, color, COLOR_BY_ID.get(color)?.emoji ?? '');
    drove = true;
    wrongs = 0;
    nudges = 0;
    snap();
    play('ding');
    siren(e);
    const ms = reduceMotion() ? 0 : scaled(DRIVE_MS);
    if (ms) {
      const dx = center(el.getBoundingClientRect()).x - center(truck.getBoundingClientRect()).x;
      await truck.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${dx}px)` }], { duration: ms, easing: 'ease-in-out', fill: 'forwards' }).finished.catch(() => {});
    }
    if (e !== kit.epoch) return;
    startCase(null, { arrived: true });
  }

  // ---------- Vẽ ca ----------
  function renderCase() {
    const c = cur();
    const r = resident();
    count.textContent = `${caseIdx + 1}/${plan.cases.length}`;
    choices.replaceChildren();
    street.hidden = true;
    safetyEl.hidden = true;
    hose.hidden = false;
    scene.dataset.kind = c.kind;
    if (c.kind === 'tree') {
      scene.replaceChildren(h('div.fr-tree', { html: TREE_SVG }), h('div.fr-ladder', { text: '🪜', 'aria-hidden': 'true' }),
        h('div.fr-climber', { html: patientSvg(r.id, { mood: 'sad', title: r.name }) }));
      residentEl.replaceChildren();
      residentEl.hidden = true;
      return;
    }
    if (c.kind === 'house') {
      // Bạn thú ló ở cửa sổ; cửa là nút (chạm gõ rồi mở). Chạm cửa sổ / bạn thú: cửa nhún, không tính nhầm.
      residentEl.replaceChildren();
      residentEl.hidden = true;
      const door = h('button.fr-door', { type: 'button', 'aria-label': 'Cửa', onclick: () => tapDoor() }, h('span.fr-knob'));
      const peek = h('button.fr-peek', { type: 'button', 'aria-label': r.name, html: patientSvg(r.id, { mood: 'sad', title: r.name }), onclick: () => tapWindow() });
      scene.replaceChildren(h('div.fr-house', { html: houseSvg(c.house.color) }), h('div.fr-doorway'), door, peek);
      return;
    }
    residentEl.hidden = false;
    residentEl.innerHTML = patientSvg(r.id, { mood: 'sad', title: r.name });
    scene.replaceChildren(h('div.fr-house', { html: houseSvg(c.house?.color) }), ...c.fires.map((f) => {
      const [x, y] = SPOT_XY[f.spot];
      const btn = h('button.fr-fire', {
        type: 'button', 'aria-label': 'Ngọn lửa', dataset: { id: f.id, spot: f.spot },
        style: { left: `${x}%`, top: `${y}%` }, html: FLAME_SVG,
        onclick: () => spray(f.id),
      });
      if (out.has(f.id)) btn.classList.add('out');
      return btn;
    }));
  }
  function renderChoices() {
    choices.replaceChildren(...cur().choices.map((n) => h('button.fr-number', {
      type: 'button', 'aria-label': String(n), dataset: { n: String(n) }, text: String(n),
      onclick: () => chooseNumber(n),
    })));
  }

  // ---------- Ca ----------
  async function startCase(resume = null, { arrived = false } = {}) {
    const e = kit.epoch;
    out = new Set(resume?.out ?? []);
    wrongs = resume?.wrongs ?? 0;
    nudges = resume?.nudges ?? 0;
    drove = arrived || Boolean(resume?.drove);
    knocked = Boolean(resume?.knocked);
    const c = cur();
    if (c.kind === 'safety') {
      startSafety(resume);
      return;
    }
    if (c.house && !drove) {
      startDrive();
      return;
    }
    setState('enter');
    renderCase();
    snap();
    if (c.kind === 'tree') {
      kit.renderTray(['ladder']);
      if (!resume) {
        restartAnim(scene, 'enter');
        await wait(ENTER_MS);
        if (e !== kit.epoch) return;
      }
      await talk([R(TREE_LINE), B(LADDER_LINE)]);
      if (e !== kit.epoch) return;
      setState('tree');
      snap();
      kit.armNudge();
      return;
    }
    kit.renderTray([]);
    if (c.kind === 'house') {
      if (!resume) {
        restartAnim(scene, 'enter');
        await wait(ENTER_MS);
        if (e !== kit.epoch) return;
      }
      // Nhận chạm cửa ngay từ lúc bạn thú kêu cứu.
      setState(knocked ? 'open' : 'knock');
      snap();
      await talk([R(STUCK_LINE), B(promptLine())]);
      if (e === kit.epoch && (state === 'knock' || state === 'open')) kit.armNudge();
      return;
    }
    // Chơi tiếp sau khi đã tắt hết lửa (mức 2: còn bước chọn số).
    if (resume && out.size >= c.fires.length) {
      if (level === 2) startCount();
      else thanks();
      return;
    }
    if (!resume) {
      residentEl.classList.remove('leave');
      restartAnim(residentEl, 'enter');
      await wait(ENTER_MS);
      if (e !== kit.epoch) return;
    }
    // Lửa nhận chạm ngay từ lúc Bông báo cháy (bé hay chạm sớm — trước đây chạm lúc Bông đang nói bị bỏ qua).
    setState('spray');
    snap();
    await talk([B(ALARM_LINE), ...(caseIdx === 0 && !resume ? [B(TAP_LINE)] : []), ...(targetFire() ? [B(whereLine(spotOf(targetFire())))] : [])]);
    if (e !== kit.epoch || state !== 'spray') return;
    kit.armNudge();
  }

  /** Tia nước từ vòi tới ngọn lửa + nước bắn tung ở ngọn lửa; Bông giật nhẹ như đang cầm vòi. */
  async function shootWater(el) {
    restartAnim(hose, 'spraying');
    play('whoosh');
    const st = stage.getBoundingClientRect();
    const tip = (hose.querySelector('.ff-tip') ?? hose).getBoundingClientRect();
    const from = { x: tip.right - st.left, y: tip.top + tip.height / 2 - st.top };
    const c = center(el.getBoundingClientRect());
    const to = { x: c.x - st.left, y: c.y - st.top };
    const len = Math.hypot(to.x - from.x, to.y - from.y);
    const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
    const jet = h('div.fr-jet', { 'aria-hidden': 'true', style: { left: `${from.x}px`, top: `${from.y}px`, width: `${len}px`, transform: `rotate(${angle}deg)` } });
    stage.append(jet);
    const ms = reduceMotion() ? 0 : scaled(JET_MS);
    if (ms) await jet.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: ms, easing: 'ease-out' }).finished.catch(() => {});
    const splash = h('div.fr-splash', { 'aria-hidden': 'true', text: '💦', style: { left: `${to.x}px`, top: `${to.y}px` } });
    stage.append(splash);
    setTimeout(() => {
      jet.remove();
      splash.remove();
    }, scaled(SPLASH_MS));
  }

  /** Chạm Bông / vòi: phun vào ngọn lửa cần dập (mức 3: ngọn Bông gọi); ca cây: nhắc dùng thang. */
  function tapHose() {
    if (state === 'spray') {
      const id = targetFire() ?? cur().fires.find((f) => !out.has(f.id))?.id;
      if (id) spray(id);
      return;
    }
    restartAnim(hose, 'spraying');
    play('tap');
    if (state === 'tree' || state === 'knock' || state === 'open') {
      kit.clearNudge();
      nudgeWanted();
      const k = stepKey();
      talk([B(promptLine())]).then(() => k === stepKey() && kit.armNudge());
    }
  }

  // ---------- An toàn với lửa (SPEC-fire2 mục 6) ----------
  async function startSafety(resume) {
    const e = kit.epoch;
    safetyIdx = resume?.safetyIdx ?? 0;
    dialed = resume?.dialed ?? 0;
    count.textContent = `${caseIdx + 1}/${plan.cases.length}`;
    residentEl.hidden = true;
    hose.hidden = true;
    street.hidden = true;
    choices.replaceChildren();
    scene.replaceChildren();
    scene.dataset.kind = 'safety';
    kit.renderTray([]);
    safetyEl.replaceChildren();
    safetyEl.hidden = false;
    setState('enter');
    if (!resume) {
      await talk([B(SAFETY_INTRO)]);
      if (e !== kit.epoch) return;
    }
    nextSafety();
  }
  function nextSafety() {
    if (safetyIdx < cur().items.length) askItem();
    else if (cur().dial && dialed < FIRE_NUMBER.length) startDial();
    else endSafety();
  }
  async function askItem() {
    const e = kit.epoch;
    const id = cur().items[safetyIdx];
    const x = SAFETY_BY.get(id);
    const btn = (answer, emoji, label) => h('button.fr-yn', { type: 'button', 'aria-label': label, dataset: { answer }, onclick: () => answerSafety(answer === 'yes') },
      h('span', { text: emoji, 'aria-hidden': 'true' }), h('b', { text: label }));
    safetyEl.dataset.hot = String(x.hot); // cho test
    safetyEl.replaceChildren(h('div.fr-thing', { role: 'img', 'aria-label': x.name, dataset: { id }, text: x.emoji }),
      h('div.fr-yns', {}, btn('yes', '👍', 'Yes!'), btn('no', '👎', 'No!')));
    // Nhận trả lời ngay từ lúc Bông hỏi.
    setState('safety');
    snap();
    await talk([B(lookLine(id))]);
    if (e === kit.epoch && state === 'safety') kit.armNudge();
  }
  async function answerSafety(yes) {
    if (state !== 'safety') return;
    const e = kit.epoch;
    const id = cur().items[safetyIdx];
    const x = SAFETY_BY.get(id);
    const btn = safetyEl.querySelector(`[data-answer="${yes ? 'yes' : 'no'}"]`);
    if (yes === x.hot) {
      // Nhầm (luật nhầm chung, không dọa): Bông nói lại cho đúng, nút đúng nhún — bé chạm nút đúng để đi tiếp.
      if (lockedWrong(`s:${yes}`)) return;
      wrongs += 1;
      snap();
      kit.clearNudge();
      play('boing');
      restartAnim(btn, 'shake');
      if (x.hot) restartAnim(safetyEl.querySelector('.fr-thing'), 'hot');
      restartAnim(safetyEl.querySelector(`[data-answer="${x.hot ? 'no' : 'yes'}"]`), 'nudge');
      const k = stepKey();
      await talk([B(safetyWrongLine(id))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    // Đúng: nhận NGAY (một lần), lưu đồ tiếp theo.
    setState('busy');
    kit.clearNudge();
    safetyIdx += 1;
    wrongs = 0;
    nudges = 0;
    snap();
    play('ding');
    btn.classList.add('right');
    await talk([B(safetyRightLine(id))]);
    if (e !== kit.epoch) return;
    nextSafety();
  }
  function markNextKey() {
    const want = FIRE_NUMBER[dialed];
    safetyEl.dataset.next = want == null ? '' : String(want); // cho test
    for (const k of safetyEl.querySelectorAll('.fr-key')) k.classList.toggle('lit', Number(k.dataset.n) === want);
  }
  /** Mức 3: điện thoại đồ chơi, bé bấm 1 → 1 → 4 (phím cần bấm sáng lên). */
  async function startDial() {
    const e = kit.epoch;
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => h('button.fr-key', {
      type: 'button', 'aria-label': String(n), dataset: { n: String(n) }, text: String(n), onclick: () => pressKey(n),
    }));
    safetyEl.replaceChildren(h('div.fr-phone', {},
      h('div.fr-display', { text: FIRE_NUMBER.slice(0, dialed).join('') }),
      h('div.fr-keys', {}, ...keys),
      h('p.fr-phone-note', { text: 'Trò chơi — chỉ người lớn gọi 114 khi có cháy thật' })));
    markNextKey();
    setState('dial');
    snap();
    await talk([B(GROWNUP_LINE), B(DIAL_LINE)]);
    if (e === kit.epoch && state === 'dial') kit.armNudge();
  }
  async function pressKey(n) {
    if (state !== 'dial') return;
    const e = kit.epoch;
    const want = FIRE_NUMBER[dialed];
    const key = safetyEl.querySelector(`.fr-key[data-n="${n}"]`);
    if (n !== want) {
      // Bấm nhầm: không tăng số đã bấm (luật nhầm chung).
      if (lockedWrong(`k:${n}`)) return;
      wrongs += 1;
      snap();
      kit.clearNudge();
      play('boing');
      restartAnim(key, 'shake');
      if (wrongs >= 2) restartAnim(safetyEl.querySelector('.fr-key.lit'), 'nudge');
      const k = stepKey();
      await talk([B(wrongKeyLine(n, want))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    dialed += 1;
    wrongs = 0;
    nudges = 0;
    play('tap');
    restartAnim(key, 'pressed');
    safetyEl.querySelector('.fr-display').textContent = FIRE_NUMBER.slice(0, dialed).join('');
    markNextKey();
    if (dialed < FIRE_NUMBER.length) {
      snap();
      kit.clearNudge();
      const k = stepKey();
      await talk([B([`${KEY_WORDS[n].charAt(0).toUpperCase()}${KEY_WORDS[n].slice(1)}!`, `Số ${n}!`])]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    setState('busy');
    kit.clearNudge();
    snap();
    play('ring');
    await wait(900);
    if (e !== kit.epoch) return;
    await talk([B(STATION_LINE)]);
    if (e !== kit.epoch) return;
    endSafety();
  }
  async function endSafety() {
    const e = kit.epoch;
    setState('busy');
    kit.clearNudge();
    caseDone();
    // Mức 1–2 kết bằng "tell a grown-up"; mức 3 đã nói trước khi bấm 114.
    if (!cur().dial) {
      await talk([B(GROWNUP_LINE)]);
      if (e !== kit.epoch) return;
    }
    play('sparkle');
    await wait(LEAVE_MS);
    if (e !== kit.epoch) return;
    safetyEl.hidden = true;
    caseIdx += 1;
    if (caseIdx >= plan.cases.length) finishRound();
    else startCase();
  }

  // ---------- Cứu bạn thú trong nhà (SPEC-fire2 mục 5) ----------
  /** Chạm cửa sổ / bạn thú: cửa nhún để bé biết chạm vào đâu — không tính nhầm. */
  function tapWindow() {
    if (state !== 'knock' && state !== 'open') return;
    play('tap');
    restartAnim(scene.querySelector('.fr-door'), 'nudge');
  }
  async function tapDoor() {
    const e = kit.epoch;
    const door = scene.querySelector('.fr-door');
    if (state === 'knock') {
      knocked = true;
      nudges = 0;
      setState('open');
      snap();
      kit.clearNudge();
      play('knock');
      restartAnim(door, 'knock');
      const k = stepKey();
      await talk([B(KNOCKED_LINE), B(OPEN_LINE)]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (state !== 'open') return;
    // Mở cửa: nhận một lần, ca xong ngay (ra nền lúc này thì chơi tiếp là ca sau).
    setState('busy');
    kit.clearNudge();
    caseDone();
    play('pop');
    door.classList.add('open');
    await wait(OUT_MS);
    if (e !== kit.epoch) return;
    const r = resident();
    scene.querySelector('.fr-peek')?.remove();
    residentEl.innerHTML = patientSvg(r.id, { mood: 'happy', title: r.name });
    residentEl.hidden = false;
    residentEl.classList.remove('leave');
    restartAnim(residentEl, 'enter');
    play('sparkle');
    await talk([R(SAFE_LINE)]);
    if (e !== kit.epoch) return;
    leave();
  }

  /** Chạm một ngọn lửa: tắt (mỗi ngọn một lần, Bông đếm). Mức 3: chỉ ngọn Bông đang gọi. */
  async function spray(id) {
    if (state !== 'spray' || out.has(id)) return;
    const e = kit.epoch;
    const want = targetFire();
    if (want && id !== want) {
      if (lockedWrong(`f:${id}`)) return;
      wrongs += 1;
      snap();
      kit.clearNudge();
      play('boing');
      nudgeWanted();
      const k = stepKey();
      await talk([B(firstLine(spotOf(want)))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    // Đúng: tắt NGAY (một lần), rồi mới tia nước + câu đếm.
    out.add(id);
    scene.dataset.target = targetFire() || '';
    wrongs = 0;
    nudges = 0;
    const n = out.size;
    const all = n >= cur().fires.length;
    if (all) setState('busy');
    if (all && level !== 2) caseDone();
    else snap();
    kit.clearNudge();
    const el = scene.querySelector(`.fr-fire[data-id="${id}"]`);
    await shootWater(el);
    el.classList.add('out');
    if (e !== kit.epoch) return;
    if (!all) {
      const k = stepKey();
      const next = targetFire();
      await talk([B(countLine(n)), ...(next ? [B(whereLine(spotOf(next)))] : [])]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    await wait(OUT_MS);
    if (e !== kit.epoch) return;
    await talk([B(countLine(n))]);
    if (e !== kit.epoch) return;
    if (level === 2) startCount();
    else {
      await talk([B(allGoneLine(n))]);
      if (e !== kit.epoch) return;
      thanks();
    }
  }

  /** Mức 2: "How many fires?" — 3 thẻ số, đúng một thẻ. */
  async function startCount() {
    const e = kit.epoch;
    renderChoices();
    setState('count');
    snap();
    await talk([B(HOW_MANY_LINE)]);
    if (e === kit.epoch) kit.armNudge();
  }
  async function chooseNumber(x) {
    if (state !== 'count') return;
    const e = kit.epoch;
    const n = cur().fires.length;
    if (x !== n) {
      if (lockedWrong(`n:${x}`)) return;
      wrongs += 1;
      snap();
      kit.clearNudge();
      play('boing');
      restartAnim(choices.querySelector(`[data-n="${x}"]`), 'shake');
      // Số không nói trong câu hỏi: nhầm lần 2 thì thẻ đúng nhún.
      if (wrongs >= 2) restartAnim(choices.querySelector(`[data-n="${n}"]`), 'nudge');
      const k = stepKey();
      await talk([B(wrongNumberLine(x))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    setState('busy');
    kit.clearNudge();
    caseDone();
    play('ding');
    choices.querySelector(`[data-n="${x}"]`)?.classList.add('right');
    await talk([B(rightNumberLine(n))]);
    if (e !== kit.epoch) return;
    thanks();
  }

  /** Ca cây: thả / chạm thang → thang dựng vào cây, bạn thú trèo xuống. */
  async function placeLadder() {
    if (state !== 'tree') return;
    const e = kit.epoch;
    setState('busy');
    kit.clearNudge();
    kit.renderTray([]);
    caseDone();
    play('pop');
    scene.classList.add('laddered');
    await wait(OUT_MS);
    if (e !== kit.epoch) return;
    scene.classList.add('down');
    await wait(OUT_MS * 2);
    if (e !== kit.epoch) return;
    play('sparkle');
    const r = resident();
    scene.querySelector('.fr-climber').innerHTML = patientSvg(r.id, { mood: 'happy', title: r.name });
    await talk([R(DOWN_LINE)]);
    if (e !== kit.epoch) return;
    leave();
  }

  async function thanks() {
    const e = kit.epoch;
    setState('thanks');
    caseDone();
    play('sparkle');
    const r = resident();
    residentEl.innerHTML = patientSvg(r.id, { mood: 'happy', title: r.name });
    restartAnim(residentEl, 'hop');
    await talk([R(THANKS_LINE)]);
    if (e !== kit.epoch) return;
    leave();
  }

  async function leave() {
    const e = kit.epoch;
    setState('leave');
    caseDone();
    restartAnim(cur().kind === 'tree' ? scene : residentEl, 'leave');
    await wait(LEAVE_MS);
    if (e !== kit.epoch) return;
    scene.classList.remove('laddered', 'down', 'leave');
    residentEl.classList.remove('leave');
    caseIdx += 1;
    if (caseIdx >= plan.cases.length) finishRound();
    else startCase();
  }

  function finishRound() {
    if (state === 'done') return;
    setState('done');
    kit.finishRound(() => {
      clearSnap(JOB);
      // Ca cứu đã gặp (cây / trong nhà): lượt sau ưu tiên loại ít gặp hơn.
      for (const c of plan.cases) if (c.kind === 'tree' || c.kind === 'house') progress = afterSeen(progress, c.kind);
      progress = afterJobRound(progress, { maxLevel: MAX_LEVEL });
      app.setSetting('fireGame', progress).catch(() => {});
    });
  }

  /** 🧹 Chơi lại từ đầu lượt (mặc đồ lại). */
  function restart() {
    if (state === 'done' || !plan) return;
    kit.cancelAll();
    scene.classList.remove('laddered', 'down', 'leave');
    caseIdx = 0;
    worn = new Set();
    startGear();
  }

  function repeatPrompt() {
    if (!ACTIVE.includes(state)) return;
    const k = stepKey();
    talk([B(promptLine())]).then(() => k === stepKey() && kit.armNudge());
  }

  // Ảnh lưới chú lính cứu hỏa (SPEC-art ART2): nạp trước khi vẽ; đủ 6 ô thì dùng ảnh (mặc đồ ghép ảnh, cầm vòi là ảnh).
  loadGearImages(app).catch(() => ({ map: new Map(), revoke() {} })).then((loaded) => {
    kit.onCleanup(loaded.revoke);
    if (kit.signal.aborted) return;
    if (FIRE_GEAR_FRAMES.every((f) => loaded.map.has(f))) {
      gearPhotos = loaded.map;
      dressFig = h('div.ff-dress.ff-photos', {}, photoDress(gearPhotos));
      hose.replaceChildren(h('img.ff-spray', { src: gearPhotos.get('spray'), alt: '' }), h('span.ff-tip'));
    }
    const s = takeSnap(JOB, { level, continueDirectly: params.continueDirectly });
    if (s?.plan?.gear) {
      plan = s.plan;
      caseIdx = s.caseIdx;
      worn = new Set(s.worn ?? []);
      dressed = Boolean(s.dressed);
      if (!dressed) startGear();
      else if (caseIdx >= plan.cases.length) {
        caseIdx = plan.cases.length - 1;
        renderCase();
        finishRound();
      } else startCase(s);
    } else {
      plan = planRound(level, { seen: progress.seen });
      caseIdx = 0;
      startGear();
    }

  });

  return kit.cleanup;
}
