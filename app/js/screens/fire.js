// Trò Lính cứu hỏa (SPEC-jobs.md mục 7): chạm từng ngọn lửa nhỏ để phun nước (Bông đếm), hết lửa bạn thú cảm ơn.
// Mức 2: hỏi "How many fires?" (3 thẻ số) + một ca cứu bạn trên cây bằng thang; mức 3: Bông gọi chỗ lửa ("on the roof").
// SPEC-fire2.md: đầu lượt mặc đồ cho Bông (helmet, jacket, boots); trước ca dập lửa lái xe tới đúng nhà theo màu.
// 3 ca → sticker. Trạng thái: dress → (drive →) enter → spray | count | tree ⇄ busy → thanks → leave → ca sau | done.
// Khung chung ở jobs/kit.js.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { bongSvg } from '../bong.js';
import { patientSvg } from '../patients.js';
import { PATIENT_BY_ID } from '../doctor.js';
import { SOUND_BY_ID } from '../animal-sounds.js';
import { playSoundFile } from './animal-sounds.js';
import { markPracticed } from '../player/track.js';
import { cleanJobState, afterJobRound } from '../jobs/levels.js';
import { JOBS_BG_IMAGES } from '../jobs/backgrounds.js';
import { COLOR_BY_ID } from '../jobs/post.js';
import { jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, reduceMotion, WRONG_LOCK_MS, MAX_NUDGES } from '../jobs/kit.js';
import { scaled } from '../timing.js';
import {
  MAX_LEVEL, GEAR, GEAR_INFO, planRound, countLine, allGoneLine, rightNumberLine, wrongNumberLine, whereLine, firstLine,
  ALARM_LINE, TAP_LINE, THANKS_LINE, HOW_MANY_LINE, TREE_LINE, LADDER_LINE, DOWN_LINE,
  READY_LINE, DRESS_ANY_LINE, GO_LINE, putOnLine, gearOnLine, wrongGearLine, goToLine, wrongHouseLine,
} from '../jobs/fire.js';

const JOB = 'fire';
const ENTER_MS = 650;
const LEAVE_MS = 600;
const OUT_MS = 450; // ngọn lửa nhỏ dần rồi tắt
const JET_MS = 280; // tia nước vươn từ vòi tới ngọn lửa
const SPLASH_MS = 500;
const DRIVE_MS = 900; // xe cứu hỏa chạy tới nhà
const ACTIVE = ['dress', 'drive', 'spray', 'count', 'tree'];
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

// ---------- Bông lính cứu hỏa: thân + từng món đồ là một lớp (mặc món nào hiện lớp đó) ----------
const INK = '#3d2c5e';
const FUR = '#fff8ee';
const FUR_SHADE = '#f3e3cf';
const GEAR_PARTS = {
  jacket: `<ellipse cx="62" cy="218" rx="15" ry="32" fill="#ffd43b" stroke="${INK}" stroke-width="3" transform="rotate(18 62 218)"/>
    <ellipse cx="160" cy="212" rx="15" ry="32" fill="#ffd43b" stroke="${INK}" stroke-width="3" transform="rotate(-58 160 212)"/>
    <path d="M64 194 Q110 170 156 194 L161 274 Q110 290 59 274 Z" fill="#ffd43b" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="61" y="238" width="98" height="9" fill="#e9ecef" stroke="#adb5bd" stroke-width="1.5"/>
    <rect x="60" y="256" width="100" height="9" fill="#e9ecef" stroke="#adb5bd" stroke-width="1.5"/>
    <path d="M110 186 L110 284" stroke="${INK}" stroke-width="2.5"/>`,
  boots: `<rect x="79" y="276" width="28" height="32" rx="6" fill="#343a40" stroke="${INK}" stroke-width="2.5"/>
    <rect x="113" y="276" width="28" height="32" rx="6" fill="#343a40" stroke="${INK}" stroke-width="2.5"/>
    <ellipse cx="90" cy="310" rx="21" ry="11" fill="#343a40" stroke="${INK}" stroke-width="2.5"/>
    <ellipse cx="130" cy="310" rx="21" ry="11" fill="#343a40" stroke="${INK}" stroke-width="2.5"/>
    <rect x="79" y="282" width="28" height="5" fill="#ffd43b"/><rect x="113" y="282" width="28" height="5" fill="#ffd43b"/>`,
  helmet: `<path d="M44 92 Q48 42 110 38 Q172 42 176 92 Z" fill="#e03131" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="110" cy="92" rx="78" ry="9" fill="#c92a2a" stroke="${INK}" stroke-width="3"/>
    <circle cx="110" cy="66" r="12" fill="#ffd43b" stroke="${INK}" stroke-width="2.5"/>`,
};
/** Khung nhìn của từng món khi đứng riêng (trong khay / đang bay). */
const GEAR_VIEW = { jacket: '38 166 144 128', boots: '66 272 88 52', helmet: '30 34 160 70' };

function firefighterSvg() {
  const head = bongSvg({ mood: 'happy' }).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<svg class="ff-svg" viewBox="0 0 220 330" aria-hidden="true">
    <ellipse cx="62" cy="218" rx="13" ry="30" fill="${FUR}" stroke="${FUR_SHADE}" stroke-width="3" transform="rotate(18 62 218)"/>
    <ellipse cx="160" cy="212" rx="13" ry="30" fill="${FUR}" stroke="${FUR_SHADE}" stroke-width="3" transform="rotate(-58 160 212)"/>
    <rect x="82" y="258" width="24" height="46" rx="10" fill="${FUR}" stroke="${FUR_SHADE}" stroke-width="3"/>
    <rect x="114" y="258" width="24" height="46" rx="10" fill="${FUR}" stroke="${FUR_SHADE}" stroke-width="3"/>
    <ellipse cx="94" cy="306" rx="16" ry="9" fill="${FUR}" stroke="${FUR_SHADE}" stroke-width="3"/>
    <ellipse cx="126" cy="306" rx="16" ry="9" fill="${FUR}" stroke="${FUR_SHADE}" stroke-width="3"/>
    <ellipse cx="110" cy="226" rx="48" ry="54" fill="${FUR}" stroke="${FUR_SHADE}" stroke-width="3"/>
    <g class="ff-wear" data-gear="jacket">${GEAR_PARTS.jacket}</g>
    <g class="ff-wear" data-gear="boots">${GEAR_PARTS.boots}</g>
    <svg x="10" y="0" width="200" height="200" viewBox="0 0 200 200">${head}</svg>
    <g class="ff-wear" data-gear="helmet">${GEAR_PARTS.helmet}</g>
    <g class="ff-nozzle">
      <path d="M150 232 Q176 236 196 214" fill="none" stroke="#495057" stroke-width="9" stroke-linecap="round"/>
      <rect class="ff-tip" x="192" y="200" width="24" height="13" rx="3" fill="#868e96" stroke="${INK}" stroke-width="2.5" transform="rotate(-24 204 206)"/>
    </g>
  </svg>`;
}
/** Hình một món đồ (khay / đang bay): đồ cứu hỏa vẽ SVG, món lạ dùng emoji. */
function gearFace(id) {
  if (GEAR_INFO[id]?.emoji) return h('span.dr-item-face', { text: GEAR_INFO[id].emoji, 'aria-hidden': 'true' });
  return h('span.dr-item-face.ff-gear-face', { 'aria-hidden': 'true', html: `<svg viewBox="${GEAR_VIEW[id]}">${GEAR_PARTS[id]}</svg>` });
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
  const dressFig = h('div.ff-dress', { html: firefighterSvg() });

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
  stage.append(scene, residentEl, hose, choices, street);
  const stepKey = () => `${kit.epoch}:${caseIdx}:${out.size}:${worn.size}:${state}`;

  function setState(s) {
    state = s;
    scene.dataset.target = (cur()?.kind === 'fire' && targetFire()) || ''; // mức 3: ngọn Bông đang gọi (cho test)
    scene.dataset.want = s === 'dress' ? wantGear() ?? '' : ''; // mức 2–3: món Bông đang gọi (cho test)
    kit.setState(s, ACTIVE.includes(s));
    choices.classList.toggle('locked', s !== 'count');
  }
  const snap = () => saveSnap(JOB, { level, plan, caseIdx, out: [...out], worn: [...worn], dressed, drove, wrongs, nudges, phase: state });
  /** Ca xong (nhận thao tác đúng cuối cùng): lưu để chơi tiếp là ca sau — ra nền giữa hoạt ảnh không bị kẹt / làm lại. */
  const caseDone = () => saveSnap(JOB, { level, plan, caseIdx: caseIdx + 1, out: [], worn: [...worn], dressed: true, drove: false, wrongs: 0, nudges: 0, phase: 'start' });

  function promptLine() {
    if (state === 'dress') return wantGear() ? putOnLine(wantGear()) : DRESS_ANY_LINE;
    if (state === 'drive') return goToLine(cur().house.color);
    if (state === 'count') return HOW_MANY_LINE;
    if (state === 'tree') return LADDER_LINE;
    return targetFire() ? whereLine(spotOf(targetFire())) : TAP_LINE;
  }
  function nudgeWanted() {
    if (state === 'dress') restartAnim(kit.trayItem(nextGear()), 'nudge');
    else if (state === 'drive') restartAnim(homes.querySelector(`[data-color="${cur().house.color}"]`), 'nudge');
    else if (state === 'tree') restartAnim(kit.trayItem('ladder'), 'nudge');
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
    hose.hidden = false;
    scene.dataset.kind = c.kind;
    if (c.kind === 'tree') {
      scene.replaceChildren(h('div.fr-tree', { html: TREE_SVG }), h('div.fr-ladder', { text: '🪜', 'aria-hidden': 'true' }),
        h('div.fr-climber', { html: patientSvg(r.id, { mood: 'sad', title: r.name }) }));
      residentEl.replaceChildren();
      residentEl.hidden = true;
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
    const c = cur();
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
    if (state === 'tree') {
      kit.clearNudge();
      nudgeWanted();
      const k = stepKey();
      talk([B(LADDER_LINE)]).then(() => k === stepKey() && kit.armNudge());
    }
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
    plan = planRound(level);
    caseIdx = 0;
    startGear();
  }

  return kit.cleanup;
}
