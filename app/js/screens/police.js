// Trò Cảnh sát giúp bạn (SPEC-jobs.md mục 6): bạn thú làm mất đồ ("Oh no! I lost my ball! It's red!"), bé chạm đúng
// đồ trong công viên; đồ bay về tay bạn, bạn cảm ơn. Mức 3: đồ / bạn nấp sau bụi cây — chạm bụi để nhìn (không tính nhầm).
// 3 ca → sticker. Trạng thái: enter → find ⇄ busy → found → leave → ca sau | done. Khung chung ở jobs/kit.js.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { markPracticed } from '../player/track.js';
import { patientSvg } from '../patients.js';
import { PATIENT_BY_ID } from '../doctor.js';
import { cleanJobState, afterJobRound } from '../jobs/levels.js';
import { jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, WRONG_LOCK_MS, MAX_NUDGES } from '../jobs/kit.js';
import {
  MAX_LEVEL, planRound, lostLine, describeLine, foundLine, wrongLine, HELLO_LINE, LOOK_LINE, BUSH_LINE,
} from '../jobs/police.js';

const JOB = 'police';
const ENTER_MS = 650;
const LEAVE_MS = 600;
const COLOR_HEX = { red: '#ff6b6b', blue: '#4dabf7', yellow: '#ffd43b', green: '#51cf66', pink: '#f783ac', orange: '#ff922b' };
const COLOR_EMOJI = { red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢', pink: '🩷', orange: '🟠' };
/** Chỗ đặt đồ trong công viên (phần trăm của sân khấu, phía phải bạn thú). */
const SLOTS = [[46, 30], [76, 26], [52, 66], [82, 64]];
const SLOTS_3 = [[48, 36], [78, 30], [64, 70]];

/** Đồ chơi một màu (viewBox 100 × 100). */
function toySvg(toy, color) {
  const c = COLOR_HEX[color];
  const k = '#3d2c5e';
  const shapes = {
    ball: `<circle cx="50" cy="52" r="40" fill="${c}" stroke="${k}" stroke-width="4"/><path d="M14 44 q36 18 72 0" fill="none" stroke="#fff" stroke-width="7" opacity="0.8"/>`,
    balloon: `<ellipse cx="50" cy="40" rx="30" ry="36" fill="${c}" stroke="${k}" stroke-width="4"/><path d="M50 76 l-5 6 h10 z" fill="${c}" stroke="${k}" stroke-width="2"/><path d="M50 82 q-8 8 0 16" fill="none" stroke="${k}" stroke-width="2.5"/>`,
    hat: `<path d="M18 70 q32 -70 64 0 z" fill="${c}" stroke="${k}" stroke-width="4" stroke-linejoin="round"/><rect x="8" y="66" width="84" height="12" rx="6" fill="${c}" stroke="${k}" stroke-width="4"/>`,
    kite: `<path d="M50 6 L84 42 L50 82 L16 42 Z" fill="${c}" stroke="${k}" stroke-width="4" stroke-linejoin="round"/><path d="M50 6 V82 M16 42 H84" stroke="${k}" stroke-width="2" opacity="0.5"/><path d="M50 82 q8 6 0 10 q-8 4 0 8" fill="none" stroke="${k}" stroke-width="2.5"/>`,
    car: `<path d="M10 64 v-14 q2 -6 10 -8 l12 -16 h34 l12 16 q10 2 12 8 v14 z" fill="${c}" stroke="${k}" stroke-width="4" stroke-linejoin="round"/><rect x="38" y="30" width="24" height="12" rx="2" fill="#e7f5ff"/><circle cx="28" cy="68" r="10" fill="${k}"/><circle cx="72" cy="68" r="10" fill="${k}"/>`,
  };
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${shapes[toy] ?? shapes.ball}</svg>`;
}
const BUSH_SVG = `<svg viewBox="0 0 100 80" aria-hidden="true"><path d="M8 72 q-6 -26 18 -30 q2 -26 28 -24 q20 -12 32 10 q20 2 14 26 q6 14 -6 18 z" fill="#51cf66" stroke="#2b8a3e" stroke-width="4" stroke-linejoin="round"/><circle cx="36" cy="40" r="4" fill="#ff8787"/><circle cx="62" cy="34" r="4" fill="#ff8787"/></svg>`;

export function policeScreen(app, params = {}) {
  let progress = cleanJobState(app.settings.policeGame, { maxLevel: MAX_LEVEL });
  const level = progress.level;
  let plan = null; // { cases }
  let caseIdx = 0;
  let wrongs = 0;
  let nudges = 0;
  let revealed = new Set(); // mã đồ đã chạm bụi cây để lộ ra
  let state = 'start';
  let lastWrong = { key: '', at: 0 };
  let recorded = new Set();

  const cur = () => plan?.cases[caseIdx];
  const asker = () => PATIENT_BY_ID.get(cur()?.asker);
  const A = (line) => ({ who: 'asker', line });
  const B = (line) => ({ who: 'bong', line });

  const askerEl = h('div.pl-asker');
  const park = h('div.pl-park');
  const kit = jobScreen(app, {
    job: JOB, className: 'pl-play', stageClass: 'pl-stage', title: '👮 Police', helperLabel: 'Bông cảnh sát', cap: 'police',
    resetLabel: 'Tìm lại',
    icon: (who) => (who === 'asker' ? asker()?.emoji ?? '' : '🐰'),
    onTalk: (who) => askerEl.classList.toggle('talking', who === 'asker'),
    onReset: () => restart(),
    onHelper: () => repeatPrompt(),
    nudge: {
      ready: () => state === 'find' && nudges < MAX_NUDGES,
      key: () => stepKey(),
      fire: (rearm) => {
        nudges += 1;
        snap();
        nudgeTarget();
        kit.talk([A(describeLine(cur(), level))]).then(rearm);
      },
    },
  });
  const { stage, count, talk } = kit;
  stage.append(h('div.pl-tree', { 'aria-hidden': 'true' }), park, askerEl);
  const stepKey = () => `${kit.epoch}:${caseIdx}`;

  function setState(s) {
    state = s;
    kit.setState(s, s === 'find');
  }
  const snap = () => saveSnap(JOB, { level, plan, caseIdx, wrongs, nudges, revealed: [...revealed], recorded: [...recorded] });

  // ---------- Vẽ ----------
  function renderCase() {
    const c = cur();
    const a = asker();
    askerEl.innerHTML = patientSvg(a.id, { mood: 'sad', title: a.name });
    askerEl.dataset.asker = a.id;
    count.textContent = `${caseIdx + 1}/${plan.cases.length}`;
    const slots = c.items.length <= 3 ? SLOTS_3 : SLOTS;
    park.replaceChildren(...c.items.map((x, i) => {
      const [left, top] = slots[i];
      const face = c.kind === 'friend'
        ? h('span.pl-friend', { html: patientSvg(x.friend, { mood: 'happy' }) })
        : h('span.pl-toy-face', { html: toySvg(c.toy, x.color) });
      const label = c.kind === 'friend' ? PATIENT_BY_ID.get(x.friend).name : `${x.size ?? ''} ${x.color} ${c.toy}`.trim();
      const item = h('button.pl-item', {
        type: 'button', 'aria-label': label,
        dataset: { id: x.id, color: x.color ?? '', size: x.size ?? '', friend: x.friend ?? '' },
        style: { left: `${left}%`, top: `${top}%` },
        onclick: () => choose(x.id),
      }, face);
      if (x.size === 'small') item.classList.add('small');
      if (!x.hidden || revealed.has(x.id)) return item;
      // Bụi cây che đồ: chạm bụi thì bụi dịch sang, đồ lộ ra (không tính là chọn nhầm).
      const bush = h('button.pl-bush', {
        type: 'button', 'aria-label': 'Bụi cây', dataset: { cover: x.id },
        style: { left: `${left}%`, top: `${top}%` },
        onclick: () => reveal(x.id, bush),
        html: BUSH_SVG,
      });
      return h('div.pl-hidden', {}, item, bush);
    }));
  }
  const itemEl = (id) => park.querySelector(`.pl-item[data-id="${id}"]`);
  const bushEl = (id) => park.querySelector(`.pl-bush[data-cover="${id}"]`);
  function nudgeTarget() {
    const id = cur().target;
    restartAnim(revealed.has(id) || !bushEl(id) ? itemEl(id) : bushEl(id), 'nudge');
  }

  function reveal(id, bush) {
    if (state !== 'find' || revealed.has(id)) return;
    revealed.add(id);
    snap();
    play('whoosh');
    bush.classList.add('moved');
  }

  // ---------- Ca ----------
  async function startCase(resume = null) {
    const e = kit.epoch;
    wrongs = resume?.wrongs ?? 0;
    nudges = resume?.nudges ?? 0;
    revealed = new Set(resume?.revealed ?? []);
    setState('enter');
    renderCase();
    snap();
    const c = cur();
    const hasBush = c.items.some((x) => x.hidden);
    if (!resume) {
      askerEl.classList.remove('leave');
      restartAnim(askerEl, 'enter');
      play('ring');
      await wait(ENTER_MS);
      if (e !== kit.epoch) return;
      await talk([B(HELLO_LINE), A(lostLine(c)), A(describeLine(c, level)), B(hasBush ? BUSH_LINE : LOOK_LINE)]);
    } else await talk([A(lostLine(c)), A(describeLine(c, level))]);
    if (e !== kit.epoch) return;
    setState('find');
    snap();
    kit.armNudge();
  }

  async function choose(id) {
    if (state !== 'find') return;
    const e = kit.epoch;
    const c = cur();
    if (id !== c.target) {
      const now = Date.now();
      if (`i:${id}` === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return;
      lastWrong = { key: `i:${id}`, at: now };
      wrongs += 1;
      snap();
      kit.clearNudge();
      play('boing');
      restartAnim(itemEl(id), 'shake');
      // Mô tả đã nói rõ màu / cỡ: đồ đúng (hoặc bụi che nó) nhún ngay sau lần nhầm đầu.
      nudgeTarget();
      const k = stepKey();
      await talk([A(wrongLine(c, id, level))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    // Đúng: nhận NGAY (một lần), lưu để chơi tiếp là ca sau; rồi đồ bay về tay bạn, bạn cảm ơn, ra về.
    setState('busy');
    kit.clearNudge();
    const t = c.items.find((x) => x.id === id);
    if (c.kind === 'toy' && !recorded.has(`${caseIdx}:color`)) {
      recorded.add(`${caseIdx}:color`);
      markPracticed(app, t.color, COLOR_EMOJI[t.color]);
    }
    saveSnap(JOB, { level, plan, caseIdx: caseIdx + 1, wrongs: 0, nudges: 0, revealed: [], recorded: [...recorded] });
    const el = itemEl(id);
    const face = el.firstElementChild.cloneNode(true);
    const from = center(el.getBoundingClientRect());
    el.style.visibility = 'hidden';
    const ghost = await kit.flyTo(h('span.pl-fly', {}, face), from, center(askerEl.getBoundingClientRect()));
    kit.removeGhost(ghost);
    if (e !== kit.epoch) return;
    play('sparkle');
    askerEl.innerHTML = patientSvg(asker().id, { mood: 'happy', title: asker().name });
    restartAnim(askerEl, 'hop');
    await talk([A(foundLine(c))]);
    if (e !== kit.epoch) return;
    setState('leave');
    restartAnim(askerEl, 'leave');
    await wait(LEAVE_MS);
    if (e !== kit.epoch) return;
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
      app.setSetting('policeGame', progress).catch(() => {});
    });
  }

  function restart() {
    if (state === 'done' || !plan) return;
    kit.cancelAll();
    caseIdx = 0;
    startCase();
  }

  function repeatPrompt() {
    if (state !== 'find') return;
    const k = stepKey();
    talk([A(describeLine(cur(), level))]).then(() => k === stepKey() && kit.armNudge());
  }

  const s = takeSnap(JOB, { level, continueDirectly: params.continueDirectly });
  if (s) {
    plan = s.plan;
    caseIdx = s.caseIdx;
    recorded = new Set(s.recorded ?? []);
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
