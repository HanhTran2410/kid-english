// Trò Bưu tá (SPEC-jobs.md mục 4): Bông đưa thư "This letter is for the red house!", bé kéo thư vào đúng nhà
// (hoặc chạm nhà). Đúng: cửa mở, bạn thú cảm ơn; nhầm: bạn thú trong nhà đó nói "Not for me!", thư về túi (giữ thư cũ).
// 5 thư → sticker. Trạng thái: letter → deliver ⇄ busy → thư sau | done. Khung chung ở jobs/kit.js.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { markPracticed } from '../player/track.js';
import { patientSvg } from '../patients.js';
import { PATIENT_BY_ID } from '../doctor.js';
import { cleanJobState, afterJobRound } from '../jobs/levels.js';
import { JOBS_BG_IMAGES } from '../jobs/backgrounds.js';
import { jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, WRONG_LOCK_MS, MAX_NUDGES } from '../jobs/kit.js';
import {
  MAX_LEVEL, COLOR_BY_ID, planRound, letterLine, wrongLine, THANKS_LINE, DRAG_LINE,
} from '../jobs/post.js';

const JOB = 'post';
const DOOR_MS = 700; // cửa mở cho bạn thú ló ra

/** Đầu bạn thú (cắt từ hình cả người) để ló ra cửa / cửa sổ. */
const headSvg = (id) => patientSvg(id, { mood: 'happy' }).replace('viewBox="0 0 240 300"', 'viewBox="30 0 180 170"');

/** Ngôi nhà (viewBox 100 × 120): mái, tường theo màu, cửa (số nhà ở mức 2+), cửa sổ (bạn thú ở mức 3), hộp thư. */
function houseSvg(house, level) {
  const c = COLOR_BY_ID.get(house.color);
  const num = level >= 2 ? `<text x="50" y="98" text-anchor="middle" font-size="22" font-weight="900" fill="#fff" stroke="#3d2c5e" stroke-width="1">${house.number}</text>` : '';
  return `<svg class="ps-house-svg" viewBox="0 0 100 120" aria-hidden="true">
    <path d="M4 52 L50 8 L96 52 Z" fill="${c.roof}" stroke="#3d2c5e" stroke-width="3" stroke-linejoin="round"/>
    <rect x="12" y="50" width="76" height="66" rx="4" fill="${c.wall}" stroke="#3d2c5e" stroke-width="3"/>
    <rect class="ps-door" x="36" y="74" width="28" height="42" rx="3" fill="#8d5a3b" stroke="#3d2c5e" stroke-width="2.5"/>
    <circle cx="58" cy="96" r="2.2" fill="#ffd43b"/>
    ${num}
    <rect x="18" y="58" width="22" height="18" rx="3" fill="#e7f5ff" stroke="#3d2c5e" stroke-width="2.5"/>
    <rect x="70" y="80" width="14" height="10" rx="2" fill="#4dabf7" stroke="#3d2c5e" stroke-width="2"/>
  </svg>`;
}

export function postScreen(app, params = {}) {
  let progress = cleanJobState(app.settings.postGame, { maxLevel: MAX_LEVEL });
  const level = progress.level;
  let plan = null; // { street, letters }
  let idx = 0;
  let wrongs = 0;
  let nudges = 0;
  let state = 'start';
  let lastWrong = { key: '', at: 0 };
  let recorded = new Set();

  const letter = () => plan?.letters[idx];
  const target = () => plan?.street[letter()?.house];
  const R = (resident, line) => ({ who: `r:${resident}`, line });
  const B = (line) => ({ who: 'bong', line });

  const street = h('div.ps-street');
  const kit = jobScreen(app, {
    job: JOB, background: { lessonId: JOBS_BG_IMAGES, word: JOB }, className: 'ps-play', stageClass: 'ps-stage', title: '📮 Postman', helperLabel: 'Bông bưu tá', cap: 'post',
    resetLabel: 'Đưa lại', trayLabel: 'Túi thư',
    icon: (who) => (who?.startsWith('r:') ? PATIENT_BY_ID.get(who.slice(2))?.emoji ?? '' : '🐰'),
    onReset: () => restart(),
    onHelper: () => repeatPrompt(),
    nudge: {
      ready: () => state === 'deliver' && nudges < MAX_NUDGES,
      key: () => stepKey(),
      fire: (rearm) => {
        nudges += 1;
        snap();
        restartAnim(houseEl(letter().house), 'nudge');
        kit.talk([B(letterLine(target(), letter().kind))]).then(rearm);
      },
    },
    tray: {
      face: () => h('span.dr-item-face.ps-letter', { text: '✉️', 'aria-hidden': 'true' }),
      label: () => 'Lá thư',
      canGive: () => state === 'deliver',
      dropOk: () => true,
      give: (id, at) => {
        const i = houseAt(at.x, at.y);
        if (i == null) repeatPrompt(); // chạm thư (không kéo vào nhà): Bông nói lại địa chỉ
        else deliver(i, at);
      },
    },
  });
  const { stage, count, talk } = kit;
  stage.append(h('div.ps-sky', { 'aria-hidden': 'true' }, h('span.ps-sun'), h('span.ps-cloud')), street);
  const stepKey = () => `${kit.epoch}:${idx}`;
  const houseEl = (i) => street.children[i];

  function houseAt(x, y) {
    for (let i = 0; i < street.children.length; i++) {
      const r = street.children[i].getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
    }
    return null;
  }
  function setState(s) {
    state = s;
    kit.setState(s, s === 'deliver');
  }
  const snap = () => saveSnap(JOB, { level, plan, idx, wrongs, nudges, recorded: [...recorded] });

  function renderStreet() {
    street.replaceChildren(...plan.street.map((house, i) => {
      const btn = h('button.ps-house', {
        type: 'button', dataset: { i: String(i), color: house.color, number: String(house.number), resident: house.resident },
        'aria-label': `Ngôi nhà ${COLOR_BY_ID.get(house.color).vi}${level >= 2 ? ` số ${house.number}` : ''}`,
        onclick: () => {
          if (!kit.pressing) deliver(i, null);
        },
      });
      btn.innerHTML = houseSvg(house, level);
      if (level >= 3) btn.append(h('span.ps-window', { html: headSvg(house.resident), 'aria-hidden': 'true' }));
      btn.append(h('span.ps-peek', { html: headSvg(house.resident), 'aria-hidden': 'true' }));
      return btn;
    }));
  }

  /** Cửa nhà mở, bạn thú ló ra trong lúc nói câu `line`, rồi đóng lại. */
  async function openDoor(i, line) {
    const e = kit.epoch;
    const el = houseEl(i);
    el.classList.add('open');
    await talk([R(plan.street[i].resident, line)]);
    if (e !== kit.epoch) return;
    await wait(DOOR_MS);
    el.classList.remove('open');
  }

  // ---------- Thư ----------
  async function newLetter(resume = false) {
    const e = kit.epoch;
    wrongs = resume ? wrongs : 0;
    nudges = resume ? nudges : 0;
    count.textContent = `${idx + 1}/${plan.letters.length}`;
    kit.renderTray(['letter']);
    setState('deliver');
    snap();
    play('whoosh');
    restartAnim(kit.trayItem('letter'), 'nudge');
    await talk([B(letterLine(target(), letter().kind)), ...(idx === 0 && !resume ? [B(DRAG_LINE)] : [])]);
    if (e === kit.epoch) kit.armNudge();
  }

  async function deliver(i, from) {
    if (state !== 'deliver') return;
    const e = kit.epoch;
    const l = letter();
    if (i !== l.house) {
      const now = Date.now();
      if (`h:${i}` === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return;
      lastWrong = { key: `h:${i}`, at: now };
      wrongs += 1;
      snap();
      kit.clearNudge();
      play('boing');
      restartAnim(houseEl(i), 'shake');
      // Địa chỉ có tên (màu / số / tên bạn thú): nhà đúng nhún ngay sau lần nhầm đầu.
      restartAnim(houseEl(l.house), 'nudge');
      const k = stepKey();
      await openDoor(i, wrongLine(plan.street[i], l.kind));
      if (k === stepKey()) kit.armNudge();
      return;
    }
    // Đúng: nhận NGAY (một lần), lưu để chơi tiếp là thư sau; rồi mới bay + cửa mở + cảm ơn.
    setState('busy');
    kit.clearNudge();
    const house = plan.street[i];
    const key = `${idx}:color`;
    if (l.kind === 'color' && !recorded.has(key)) {
      recorded.add(key);
      const c = COLOR_BY_ID.get(house.color);
      markPracticed(app, c.id, c.emoji);
    }
    idx += 1;
    saveSnap(JOB, { level, plan, idx, wrongs: 0, nudges: 0, recorded: [...recorded] });
    const start = from ?? center((kit.trayItem('letter') ?? houseEl(i)).getBoundingClientRect());
    kit.renderTray([]);
    const ghost = await kit.flyTo(h('span.dr-item-face.ps-letter', { text: '✉️' }), start, center(houseEl(i).querySelector('svg').getBoundingClientRect()));
    kit.removeGhost(ghost);
    if (e !== kit.epoch) return;
    play('ding');
    await openDoor(i, THANKS_LINE);
    if (e !== kit.epoch) return;
    play('sparkle');
    if (idx >= plan.letters.length) finishRound();
    else newLetter();
  }

  function finishRound() {
    if (state === 'done') return;
    setState('done');
    kit.finishRound(() => {
      clearSnap(JOB);
      progress = afterJobRound(progress, { maxLevel: MAX_LEVEL });
      app.setSetting('postGame', progress).catch(() => {});
    });
  }

  function restart() {
    if (state === 'done' || !plan) return;
    kit.cancelAll();
    for (const el of street.children) el.classList.remove('open');
    idx = 0;
    newLetter();
  }

  function repeatPrompt() {
    if (state !== 'deliver') return;
    const k = stepKey();
    talk([B(letterLine(target(), letter().kind))]).then(() => k === stepKey() && kit.armNudge());
  }

  const s = takeSnap(JOB, { level, continueDirectly: params.continueDirectly });
  if (s) {
    plan = s.plan;
    idx = s.idx;
    wrongs = s.wrongs ?? 0;
    nudges = s.nudges ?? 0;
    recorded = new Set(s.recorded ?? []);
    renderStreet();
    if (idx >= plan.letters.length) {
      count.textContent = `${plan.letters.length}/${plan.letters.length}`;
      finishRound();
    } else newLetter(true);
  } else {
    plan = planRound(level);
    renderStreet();
    newLetter();
  }

  return kit.cleanup;
}
