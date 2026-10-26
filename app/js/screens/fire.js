// Trò Lính cứu hỏa (SPEC-jobs.md mục 7): chạm từng ngọn lửa nhỏ để phun nước (Bông đếm), hết lửa bạn thú cảm ơn.
// Mức 2: hỏi "How many fires?" (3 thẻ số) + một ca cứu bạn trên cây bằng thang; mức 3: Bông gọi chỗ lửa ("on the roof").
// 3 ca → sticker. Trạng thái: enter → spray | count | tree ⇄ busy → thanks → leave → ca sau | done. Khung chung ở jobs/kit.js.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { patientSvg } from '../patients.js';
import { PATIENT_BY_ID } from '../doctor.js';
import { SOUND_BY_ID } from '../animal-sounds.js';
import { playSoundFile } from './animal-sounds.js';
import { cleanJobState, afterJobRound } from '../jobs/levels.js';
import { JOBS_BG_IMAGES } from '../jobs/backgrounds.js';
import { jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, reduceMotion, WRONG_LOCK_MS, MAX_NUDGES } from '../jobs/kit.js';
import { scaled } from '../timing.js';
import {
  MAX_LEVEL, planRound, countLine, allGoneLine, rightNumberLine, wrongNumberLine, whereLine, firstLine,
  ALARM_LINE, TAP_LINE, THANKS_LINE, HOW_MANY_LINE, TREE_LINE, LADDER_LINE, DOWN_LINE,
} from '../jobs/fire.js';

const JOB = 'fire';
const ENTER_MS = 650;
const LEAVE_MS = 600;
const OUT_MS = 450; // ngọn lửa nhỏ dần rồi tắt
const JET_MS = 280; // tia nước vươn từ vòi tới ngọn lửa
const SPLASH_MS = 500;
const ACTIVE = ['spray', 'count', 'tree'];
/** Chỗ ngọn lửa trên ngôi nhà (phần trăm của khung nhà). */
const SPOT_XY = { roof: [50, 24], window: [30, 56], window2: [70, 56], door: [50, 84], chimney: [76, 12] };

const HOUSE_SVG = `<svg viewBox="0 0 100 100" aria-hidden="true">
  <rect x="68" y="4" width="12" height="20" fill="#c0392b" stroke="#3d2c5e" stroke-width="2.5"/>
  <path d="M6 40 L50 6 L94 40 Z" fill="#e8590c" stroke="#3d2c5e" stroke-width="3" stroke-linejoin="round"/>
  <rect x="14" y="38" width="72" height="58" rx="3" fill="#ffe8cc" stroke="#3d2c5e" stroke-width="3"/>
  <rect x="21" y="48" width="18" height="16" rx="2" fill="#a5d8ff" stroke="#3d2c5e" stroke-width="2.5"/>
  <rect x="61" y="48" width="18" height="16" rx="2" fill="#a5d8ff" stroke="#3d2c5e" stroke-width="2.5"/>
  <rect x="41" y="70" width="18" height="26" rx="2" fill="#8d5a3b" stroke="#3d2c5e" stroke-width="2.5"/>
</svg>`;
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

export function fireScreen(app, params = {}) {
  let progress = cleanJobState(app.settings.fireGame, { maxLevel: MAX_LEVEL });
  const level = progress.level;
  let plan = null; // { cases }
  let caseIdx = 0;
  let out = new Set(); // mã ngọn lửa đã tắt
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

  const scene = h('div.fr-scene');
  const residentEl = h('div.fr-resident');
  // Lính cứu hỏa cầm vòi: chạm được — phun vào ngọn lửa cần dập (như chạm thẳng ngọn lửa), luôn có phản hồi.
  const hose = h('button.fr-hose', { type: 'button', 'aria-label': 'Vòi phun nước', text: '🧑‍🚒', onclick: () => tapHose() });
  const choices = h('div.fr-choices');
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
      face: () => h('span.dr-item-face', { text: '🪜', 'aria-hidden': 'true' }),
      label: () => 'Cái thang',
      canGive: () => state === 'tree',
      dropOk: () => true, // thả ở đâu cũng được: thang tự đặt vào cây
      give: () => placeLadder(),
    },
  });
  const { stage, count, talk } = kit;
  stage.append(scene, residentEl, hose, choices);
  const stepKey = () => `${kit.epoch}:${caseIdx}:${out.size}:${state}`;

  function setState(s) {
    state = s;
    scene.dataset.target = (cur()?.kind === 'fire' && targetFire()) || ''; // mức 3: ngọn Bông đang gọi (cho test)
    kit.setState(s, ACTIVE.includes(s));
    choices.classList.toggle('locked', s !== 'count');
  }
  const snap = () => saveSnap(JOB, { level, plan, caseIdx, out: [...out], wrongs, nudges, phase: state });
  /** Ca xong (nhận thao tác đúng cuối cùng): lưu để chơi tiếp là ca sau — ra nền giữa hoạt ảnh không bị kẹt / làm lại. */
  const caseDone = () => saveSnap(JOB, { level, plan, caseIdx: caseIdx + 1, out: [], wrongs: 0, nudges: 0, phase: 'start' });

  function promptLine() {
    if (state === 'count') return HOW_MANY_LINE;
    if (state === 'tree') return LADDER_LINE;
    return targetFire() ? whereLine(spotOf(targetFire())) : TAP_LINE;
  }
  function nudgeWanted() {
    if (state === 'tree') restartAnim(kit.trayItem('ladder'), 'nudge');
    else if (state === 'count') restartAnim(choices.querySelector(`[data-n="${cur().fires.length}"]`), 'nudge');
    else restartAnim(scene.querySelector(`.fr-fire[data-id="${targetFire() ?? cur().fires.find((f) => !out.has(f.id))?.id}"]`), 'nudge');
  }

  // ---------- Vẽ ----------
  function renderCase() {
    const c = cur();
    const r = resident();
    count.textContent = `${caseIdx + 1}/${plan.cases.length}`;
    choices.replaceChildren();
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
    scene.replaceChildren(h('div.fr-house', { html: HOUSE_SVG }), ...c.fires.map((f) => {
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
  async function startCase(resume = null) {
    const e = kit.epoch;
    out = new Set(resume?.out ?? []);
    wrongs = resume?.wrongs ?? 0;
    nudges = resume?.nudges ?? 0;
    setState('enter');
    renderCase();
    snap();
    const c = cur();
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
      // Còi xe cứu hỏa (file tiếng thật của Ai kêu thế?); không phát được thì bỏ qua.
      playSoundFile(SOUND_BY_ID.get('fire-truck'), { isCurrent: () => e === kit.epoch }).catch(() => {});
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

  /** Tia nước từ vòi tới ngọn lửa + nước bắn tung ở ngọn lửa; lính cứu hỏa giật nhẹ như đang cầm vòi. */
  async function shootWater(el) {
    restartAnim(hose, 'spraying');
    play('whoosh');
    const st = stage.getBoundingClientRect();
    const hb = hose.getBoundingClientRect();
    const from = { x: hb.left + hb.width * 0.85 - st.left, y: hb.top + hb.height * 0.5 - st.top };
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

  /** Chạm lính cứu hỏa / vòi: phun vào ngọn lửa cần dập (mức 3: ngọn Bông gọi); ca cây: nhắc dùng thang. */
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
      const now = Date.now();
      if (`f:${id}` === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return;
      lastWrong = { key: `f:${id}`, at: now };
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
      const now = Date.now();
      if (`n:${x}` === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return;
      lastWrong = { key: `n:${x}`, at: now };
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

  function restart() {
    if (state === 'done' || !plan) return;
    kit.cancelAll();
    scene.classList.remove('laddered', 'down', 'leave');
    caseIdx = 0;
    startCase();
  }

  function repeatPrompt() {
    if (!ACTIVE.includes(state)) return;
    const k = stepKey();
    talk([B(promptLine())]).then(() => k === stepKey() && kit.armNudge());
  }

  const s = takeSnap(JOB, { level, continueDirectly: params.continueDirectly });
  if (s) {
    plan = s.plan;
    caseIdx = s.caseIdx;
    if (caseIdx >= plan.cases.length) {
      caseIdx = plan.cases.length - 1;
      renderCase();
      finishRound();
    } else startCase(s);
  } else {
    plan = planRound(level);
    caseIdx = 0;
    startCase();
  }

  return kit.cleanup;
}
