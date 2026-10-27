// Trò Cảnh sát giúp bạn (SPEC-jobs.md mục 6): bạn thú làm mất đồ ("Oh no! I lost my ball! It's red!"), bé chạm đúng
// đồ trong công viên; đồ bay về tay bạn, bạn cảm ơn. Mức 3: đồ / bạn nấp sau bụi cây — chạm bụi để nhìn (không tính nhầm).
// SPEC-jobs2 PL1: mỗi lượt một ca đèn giao thông (giả lập): mức 1 học màu đèn, mức 2–3 bật đỏ khi có bạn qua đường.
// 3 ca → sticker. Trạng thái: enter → find | ask ⇄ busy / move → found → leave → ca sau | done. Khung chung ở jobs/kit.js.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { markPracticed } from '../player/track.js';
import { patientSvg } from '../patients.js';
import { PATIENT_BY_ID } from '../doctor.js';
import { cleanJobState, afterJobRound } from '../jobs/levels.js';
import { JOBS_BG_IMAGES } from '../jobs/backgrounds.js';
import { POLICE_SVG, loadPersonImage } from '../jobs/people.js';
import { jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, WRONG_LOCK_MS, MAX_NUDGES } from '../jobs/kit.js';
import {
  MAX_LEVEL, planRound, lostLine, describeLine, foundLine, wrongLine, HELLO_LINE, LOOK_LINE, BUSH_LINE,
  TRAFFIC_INTRO_LINE, CAN_GO_LINE, CHANGING_LINE, TRAFFIC_DONE_LINE, makeItLine, lightRightLine, lightWrongLine,
  CROSS_STEPS, CROSS_ASK_LINE, NO_CARS_LINE, CROSS_THANKS_LINE, crossStepLine,
} from '../jobs/police.js';

const JOB = 'police';
const ENTER_MS = 650;
const LEAVE_MS = 600;
const COLOR_HEX = { red: '#ff6b6b', blue: '#4dabf7', yellow: '#ffd43b', green: '#51cf66', pink: '#f783ac', orange: '#ff922b' };
const COLOR_EMOJI = { red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢', pink: '🩷', orange: '🟠' };
/** Chỗ đặt đồ trong công viên (phần trăm của sân khấu, phía phải bạn thú; chú cảnh sát đứng bên trái bạn thú). */
const SLOTS = [[57, 30], [84, 26], [61, 68], [86, 64]];
const SLOTS_3 = [[58, 34], [85, 30], [72, 70]];
/** Màn dọc (điện thoại): đồ ở nửa trên, bạn thú đứng giữa phía dưới. */
const SLOTS_PORTRAIT = [[27, 16], [73, 16], [27, 44], [73, 44]];
const SLOTS_PORTRAIT_3 = [[27, 18], [73, 18], [50, 44]];

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
const MOVE_MS = 1100; // xe chạy / dừng / bạn qua đường sau khi đổi đèn
const LIGHT_EMOJI = { red: '🔴', yellow: '🟡', green: '🟢' };
const CLOTHES_HEX = { red: '#fa5252', blue: '#339af0', yellow: '#fcc419', green: '#51cf66' };
/** SPEC-jobs2 PL2b: mũ (trên đầu) + giày (hai bàn chân) vẽ thêm vào hình bạn thú (viewBox 240 × 300). */
function dressSvg(svg, hat, shoes) {
  if (!hat) return svg;
  const ink = '#3d2c5e';
  const layer = `<g class="pl-clothes">
    <path d="M58 60 Q120 -4 182 60 Z" fill="${CLOTHES_HEX[hat]}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="120" cy="60" rx="78" ry="11" fill="${CLOTHES_HEX[hat]}" stroke="${ink}" stroke-width="3"/>
    <ellipse cx="80" cy="284" rx="31" ry="15" fill="${CLOTHES_HEX[shoes]}" stroke="${ink}" stroke-width="3"/>
    <ellipse cx="160" cy="284" rx="31" ry="15" fill="${CLOTHES_HEX[shoes]}" stroke="${ink}" stroke-width="3"/>
  </g>`;
  return svg.replace(/<\/svg>\s*$/, `${layer}</svg>`);
}
const WALK_LIGHT_MS = 1000; // bấm nút → đèn người đi bộ đổi xanh
const CHECK_MS = 900; // nhìn lại mỗi bên (tự động)
const CROSS_ACTIVE = ['look-left', 'look-right', 'press', 'go'];
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
  let tIdx = 0; // ca đèn giao thông: lượt đổi đèn thứ mấy

  const cur = () => plan?.cases[caseIdx];
  const asker = () => PATIENT_BY_ID.get(cur()?.asker);
  const A = (line) => ({ who: 'asker', line });
  const B = (line) => ({ who: 'bong', line });

  const askerEl = h('div.pl-asker');
  const park = h('div.pl-park');
  const kit = jobScreen(app, {
    job: JOB, background: { lessonId: JOBS_BG_IMAGES, word: JOB }, className: 'pl-play', stageClass: 'pl-stage', title: '👮 Police', helperLabel: 'Bông cảnh sát', cap: 'police',
    resetLabel: 'Tìm lại',
    // SPEC-roles mục 9: chú cảnh sát đứng bên trái nói câu của Bông (phụ đề 👮); bạn thú / xe nói thì sáng, ai nói người đó sáng.
    host: { svg: POLICE_SVG, label: 'police' },
    roles: {
      of: (who) => (who === 'bong' ? kit.host : who === 'asker' ? [askerEl, walker] : who === 'car' ? car : null),
      all: () => [kit.host, askerEl, walker, car].filter((el) => !el.closest('[hidden]')), // cảnh nào chỉ vai cảnh đó
      dim: (el) => el !== walker, // lúc giúp qua đường bé chạm bạn thú: không làm mờ
    },
    icon: (who) => (who === 'asker' ? asker()?.emoji ?? '' : who === 'car' ? '🚗' : '👮'),
    onTalk: (who) => askerEl.classList.toggle('talking', who === 'asker'),
    onReset: () => restart(),
    onHelper: () => repeatPrompt(),
    nudge: {
      ready: () => (state === 'find' || state === 'ask' || CROSS_ACTIVE.includes(state)) && nudges < MAX_NUDGES,
      key: () => stepKey(),
      fire: (rearm) => {
        nudges += 1;
        snap();
        if (state === 'ask') {
          restartAnim(lampEl(cur().steps[tIdx].want), 'nudge');
          kit.talk(trafficPrompt()).then(rearm);
          return;
        }
        if (CROSS_ACTIVE.includes(state)) {
          restartAnim(crossTarget(), 'nudge');
          kit.talk([B(crossStepLine(state))]).then(rearm);
          return;
        }
        nudgeTarget();
        kit.talk([A(describeLine(cur(), level))]).then(rearm);
      },
    },
  });
  const { stage, count, talk } = kit;
  // Ca đèn giao thông (SPEC-jobs2 mục 5.1): đường + vạch kẻ, xe chờ, bạn thú qua đường, cột đèn ba màu (chạm được).
  const lamps = ['red', 'yellow', 'green'].map((color) => h('button.pl-lamp', {
    type: 'button', 'aria-label': `${color} light`, dataset: { color }, onclick: () => tapLamp(color),
  }));
  const car = h('div.pl-car', { 'aria-hidden': 'true' }, h('span', { text: '🚗' }));
  const walker = h('div.pl-walker', { 'aria-hidden': 'true' });
  // SPEC-jobs2 PL2a: đèn cho người đi bộ (đỏ / xanh) + nút bấm, hai mũi tên nhìn trái / phải.
  const walkLight = h('div.pl-walk-light', { 'aria-hidden': 'true', dataset: { on: 'red' } },
    h('span.pl-walk-lamp.red', { text: '🚶' }), h('span.pl-walk-lamp.green', { text: '🚶' }));
  const pressBtn = h('button.pl-press', { type: 'button', 'aria-label': 'Nút bấm đèn', onclick: () => tapPress() }, h('span', { text: '👆' }));
  const arrows = ['left', 'right'].map((dir) => h('button.pl-arrow', {
    type: 'button', 'aria-label': dir === 'left' ? 'Nhìn trái' : 'Nhìn phải', dataset: { dir }, onclick: () => tapArrow(dir),
  }, h('span', { text: dir === 'left' ? '⬅️' : '➡️' })));
  const crossKit = h('div.pl-cross-kit', { hidden: true }, h('div.pl-walk-post', {}, walkLight, pressBtn), ...arrows);
  const trafficEl = h('div.pl-traffic', { hidden: true },
    h('div.pl-road', {}, h('div.pl-zebra')), car, walker, crossKit,
    h('div.pl-light', {}, h('div.pl-light-box', {}, ...lamps), h('div.pl-light-pole')));
  const arrowEl = (dir) => crossKit.querySelector(`.pl-arrow[data-dir="${dir}"]`);
  walker.addEventListener('pointerdown', () => tapWalker(), { signal: kit.signal });
  const lampEl = (color) => trafficEl.querySelector(`.pl-lamp[data-color="${color}"]`);
  stage.append(h('div.pl-tree', { 'aria-hidden': 'true' }), park, askerEl, trafficEl);
  const stepKey = () => `${kit.epoch}:${caseIdx}:${tIdx}:${state}`;

  function setState(s) {
    state = s;
    kit.setState(s, s === 'find' || s === 'ask');
  }
  const snap = () => saveSnap(JOB, { level, plan, caseIdx, wrongs, nudges, revealed: [...revealed], recorded: [...recorded], tIdx });

  // ---------- Vẽ ----------
  function renderCase() {
    const c = cur();
    const a = asker();
    askerEl.innerHTML = patientSvg(a.id, { mood: 'sad', title: a.name });
    askerEl.dataset.asker = a.id;
    count.textContent = `${caseIdx + 1}/${plan.cases.length}`;
    park.dataset.target = c.target; // cho test; bé không thấy
    const portrait = stage.clientHeight > stage.clientWidth;
    const slots = portrait ? (c.items.length <= 3 ? SLOTS_PORTRAIT_3 : SLOTS_PORTRAIT) : (c.items.length <= 3 ? SLOTS_3 : SLOTS);
    park.replaceChildren(...c.items.map((x, i) => {
      const [left, top] = slots[i];
      const face = c.kind === 'friend'
        ? h('span.pl-friend', { html: dressSvg(patientSvg(x.friend, { mood: 'happy' }), x.hat, x.shoes) })
        : h('span.pl-toy-face', { html: toySvg(c.toy, x.color) });
      const label = c.kind === 'friend' ? PATIENT_BY_ID.get(x.friend).name : `${x.size ?? ''} ${x.color} ${c.toy}`.trim();
      const item = h('button.pl-item', {
        type: 'button', 'aria-label': label,
        dataset: { id: x.id, color: x.color ?? '', size: x.size ?? '', friend: x.friend ?? '', hat: x.hat ?? '', shoes: x.shoes ?? '' },
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
    bush.parentElement?.classList.add('open');
  }

  // ---------- Ca ----------
  async function startCase(resume = null) {
    const e = kit.epoch;
    // Cảnh đường (đèn / qua đường): chú cảnh sát lên góc trên trái, nhường chỗ cho đường và xe.
    stage.dataset.scene = cur().kind === 'traffic' || cur().kind === 'cross' ? 'road' : 'park';
    wrongs = resume?.wrongs ?? 0;
    nudges = resume?.nudges ?? 0;
    revealed = new Set(resume?.revealed ?? []);
    if (cur().kind === 'traffic') {
      startTraffic(resume);
      return;
    }
    if (cur().kind === 'cross') {
      startCross(resume);
      return;
    }
    trafficEl.hidden = true;
    crossKit.hidden = true;
    park.hidden = false;
    askerEl.hidden = false;
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
    // PL2b: quần áo (mũ, giày) khi chọn đúng bạn ngay lần đầu.
    if (c.kind === 'friend' && t.hat && wrongs === 0 && !recorded.has(`${caseIdx}:clothes`)) {
      recorded.add(`${caseIdx}:clothes`);
      markPracticed(app, 'hat', '👒');
      markPracticed(app, 'shoes', '👟');
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

  // ---------- Ca đèn giao thông (SPEC-jobs2 mục 5.1) ----------
  /** Câu hỏi của lượt: mức 1 Bông bảo màu; mức 2–3 xe hỏi "Can I go?" (lượt vàng: "The light is changing"). */
  function trafficPrompt() {
    const step = cur().steps[tIdx];
    if (level <= 1) return [B(makeItLine(step.want))];
    if (step.want === 'yellow') return [B(CHANGING_LINE)];
    return [{ who: 'car', line: CAN_GO_LINE }];
  }
  /** Vẽ lượt hiện tại: xe về chỗ chờ, bạn thú đứng trên vạch kẻ nếu đang qua đường, đèn tắt hết. */
  function renderTraffic() {
    const step = cur().steps[tIdx];
    count.textContent = `${caseIdx + 1}/${plan.cases.length}`;
    car.classList.remove('go', 'slow');
    walker.classList.remove('walk');
    walker.innerHTML = patientSvg(asker().id, { mood: 'happy', title: asker().name });
    walker.hidden = !step?.crossing;
    for (const l of lamps) l.classList.remove('on', 'nudge', 'shake');
    trafficEl.dataset.want = step?.want ?? ''; // cho test
    trafficEl.dataset.step = String(tIdx);
    trafficEl.dataset.crossing = String(Boolean(step?.crossing));
  }
  async function startTraffic(resume = null) {
    const e = kit.epoch;
    tIdx = resume?.tIdx ?? 0;
    askerEl.hidden = true;
    park.hidden = true;
    trafficEl.hidden = false;
    crossKit.hidden = true;
    trafficEl.dataset.mode = 'traffic';
    setState('enter');
    renderTraffic();
    snap();
    if (!resume) {
      restartAnim(trafficEl, 'enter');
      play('honk');
      await talk([B(TRAFFIC_INTRO_LINE)]);
      if (e !== kit.epoch) return;
    }
    askStep();
  }
  async function askStep() {
    const e = kit.epoch;
    renderTraffic();
    // Nhận chạm đèn ngay từ lúc hỏi.
    setState('ask');
    snap();
    await talk(trafficPrompt());
    if (e === kit.epoch && state === 'ask') kit.armNudge();
  }
  async function tapLamp(color) {
    if (state !== 'ask') return; // xe đang chạy / dừng: chạm đèn không tính
    const e = kit.epoch;
    const step = cur().steps[tIdx];
    if (color !== step.want) {
      const now = Date.now();
      if (`l:${color}` === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return;
      lastWrong = { key: `l:${color}`, at: now };
      wrongs += 1;
      snap();
      kit.clearNudge();
      play('boing');
      restartAnim(lampEl(color), 'shake');
      if (wrongs >= 2) restartAnim(lampEl(step.want), 'nudge');
      const k = stepKey();
      await talk([B(lightWrongLine(step, color, level))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    // Đúng: nhận NGAY (một lần) — đèn sáng, ghi màu đã gặp (đúng ngay lần đầu), lưu lượt sau.
    setState('move');
    kit.clearNudge();
    if (wrongs === 0 && !recorded.has(`${caseIdx}:light:${tIdx}`)) {
      recorded.add(`${caseIdx}:light:${tIdx}`);
      markPracticed(app, color, LIGHT_EMOJI[color]);
    }
    tIdx += 1;
    wrongs = 0;
    nudges = 0;
    const last = tIdx >= cur().steps.length;
    if (last) saveSnap(JOB, { level, plan, caseIdx: caseIdx + 1, wrongs: 0, nudges: 0, revealed: [], recorded: [...recorded], tIdx: 0 });
    else snap();
    play('ding');
    lampEl(color).classList.add('on');
    if (color === 'green') car.classList.add('go');
    else if (color === 'yellow') car.classList.add('slow');
    else if (step.crossing) walker.classList.add('walk');
    await Promise.all([talk([B(lightRightLine(step))]), wait(MOVE_MS)]);
    if (e !== kit.epoch) return;
    if (!last) {
      askStep();
      return;
    }
    play('sparkle');
    await talk([B(TRAFFIC_DONE_LINE)]);
    if (e !== kit.epoch) return;
    setState('leave');
    restartAnim(trafficEl, 'leave');
    await wait(LEAVE_MS);
    if (e !== kit.epoch) return;
    trafficEl.classList.remove('leave');
    caseIdx += 1;
    if (caseIdx >= plan.cases.length) finishRound();
    else startCase();
  }

  // ---------- Giúp bạn qua đường (SPEC-jobs2 mục 5.2) — `tIdx` là bước trong CROSS_STEPS ----------
  const crossStep = () => CROSS_STEPS[tIdx];
  /** Thứ bé cần chạm ở bước hiện tại (để nhún khi nhắc / sau 2 lần sai). */
  const crossTarget = () => ({ 'look-left': arrowEl('left'), 'look-right': arrowEl('right'), press: pressBtn, go: walker }[crossStep()] ?? null);
  function renderCross() {
    count.textContent = `${caseIdx + 1}/${plan.cases.length}`;
    const green = tIdx >= CROSS_STEPS.indexOf('check');
    walkLight.dataset.on = green ? 'green' : 'red';
    pressBtn.classList.toggle('pressed', green);
    car.classList.remove('go', 'slow');
    walker.classList.remove('walk', 'look-left', 'look-right');
    walker.innerHTML = patientSvg(asker().id, { mood: 'happy', title: asker().name });
    walker.hidden = false;
    for (const l of lamps) l.classList.remove('nudge', 'shake');
    // Đèn cho xe: xanh khi người đi bộ chờ, đỏ khi đèn người đi bộ xanh.
    for (const l of lamps) l.classList.toggle('on', l.dataset.color === (green ? 'red' : 'green'));
    for (const a of arrows) a.classList.remove('lit', 'nudge', 'shake');
    trafficEl.dataset.step = crossStep() ?? ''; // cho test
  }
  async function startCross(resume = null) {
    const e = kit.epoch;
    tIdx = resume?.tIdx ?? 0;
    askerEl.hidden = true;
    park.hidden = true;
    trafficEl.hidden = false;
    crossKit.hidden = false;
    trafficEl.dataset.mode = 'cross';
    setState('enter');
    renderCross();
    snap();
    if (!resume) {
      restartAnim(trafficEl, 'enter');
      await talk([A(CROSS_ASK_LINE)]);
      if (e !== kit.epoch) return;
    }
    crossNext();
  }
  /** Sang bước hiện tại (`tIdx`): nói câu của bước; bước "check" tự chạy rồi sang "go". */
  async function crossNext() {
    const e = kit.epoch;
    const step = crossStep();
    renderCross();
    if (step === 'check') {
      setState('check');
      snap();
      await talk([B(crossStepLine('check'))]);
      for (const dir of ['left', 'right']) {
        if (e !== kit.epoch) return;
        arrowEl(dir).classList.add('lit');
        walker.classList.remove('look-left', 'look-right');
        walker.classList.add(`look-${dir}`);
        await wait(CHECK_MS);
        arrowEl(dir).classList.remove('lit');
      }
      if (e !== kit.epoch) return;
      walker.classList.remove('look-left', 'look-right');
      tIdx += 1;
      crossNext();
      return;
    }
    setState(step);
    snap();
    const k = stepKey();
    await talk([B(crossStepLine(step))]);
    if (k === stepKey()) kit.armNudge();
  }
  /** Làm sai thứ tự: bạn thú không đi, Bông nói lại câu của bước hiện tại (nhầm). */
  async function crossWrong(key) {
    const now = Date.now();
    if (key === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return;
    lastWrong = { key, at: now };
    wrongs += 1;
    snap();
    kit.clearNudge();
    play('boing');
    restartAnim(walker, 'shake');
    if (wrongs >= 2) restartAnim(crossTarget(), 'nudge');
    const k = stepKey();
    await talk([B(crossStepLine(state))]);
    if (k === stepKey()) kit.armNudge();
  }
  async function tapArrow(dir) {
    if (!CROSS_ACTIVE.includes(state)) return;
    if (state !== `look-${dir}`) {
      crossWrong(`a:${dir}`);
      return;
    }
    const e = kit.epoch;
    setState('busy');
    kit.clearNudge();
    tIdx += 1;
    wrongs = 0;
    nudges = 0;
    snap();
    play('tap');
    arrowEl(dir).classList.add('lit');
    walker.classList.remove('look-left', 'look-right');
    walker.classList.add(`look-${dir}`);
    await talk([A(NO_CARS_LINE)]);
    if (e !== kit.epoch) return;
    crossNext();
  }
  async function tapPress() {
    if (tIdx > CROSS_STEPS.indexOf('press')) return; // đã bấm: không tính
    if (!CROSS_ACTIVE.includes(state)) return;
    if (state !== 'press') {
      crossWrong('press');
      return;
    }
    const e = kit.epoch;
    setState('busy');
    kit.clearNudge();
    tIdx += 1;
    wrongs = 0;
    nudges = 0;
    snap();
    play('ding');
    pressBtn.classList.add('pressed');
    await wait(WALK_LIGHT_MS);
    if (e !== kit.epoch) return;
    play('pop');
    crossNext();
  }
  async function tapWalker() {
    if (!CROSS_ACTIVE.includes(state) || kit.pressing) return;
    if (state !== 'go') {
      crossWrong('walker');
      return;
    }
    const e = kit.epoch;
    setState('busy');
    kit.clearNudge();
    saveSnap(JOB, { level, plan, caseIdx: caseIdx + 1, wrongs: 0, nudges: 0, revealed: [], recorded: [...recorded], tIdx: 0 });
    play('whoosh');
    walker.classList.add('walk');
    await Promise.all([talk([A(CROSS_THANKS_LINE)]), wait(MOVE_MS)]);
    if (e !== kit.epoch) return;
    play('sparkle');
    setState('leave');
    restartAnim(trafficEl, 'leave');
    await wait(LEAVE_MS);
    if (e !== kit.epoch) return;
    trafficEl.classList.remove('leave');
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
    if (CROSS_ACTIVE.includes(state)) {
      const k = stepKey();
      talk([B(crossStepLine(state))]).then(() => k === stepKey() && kit.armNudge());
      return;
    }
    if (state === 'ask') {
      const k = stepKey();
      talk(trafficPrompt()).then(() => k === stepKey() && kit.armNudge());
      return;
    }
    if (state !== 'find') return;
    const k = stepKey();
    talk([A(describeLine(cur(), level))]).then(() => k === stepKey() && kit.armNudge());
  }

  // Ảnh chú cảnh sát bố mẹ thêm (nếu có) thay hình vẽ sẵn.
  loadPersonImage(app, 'police').then((url) => {
    if (!url) return;
    if (kit.signal.aborted) URL.revokeObjectURL(url);
    else {
      kit.setHostImage(url);
      kit.onCleanup(() => URL.revokeObjectURL(url));
    }
  });

  const s = takeSnap(JOB, { level, continueDirectly: params.continueDirectly });
  if (s) {
    plan = s.plan;
    caseIdx = s.caseIdx;
    recorded = new Set(s.recorded ?? []);
    if (caseIdx >= plan.cases.length) {
      caseIdx = plan.cases.length - 1;
      if (cur().items) renderCase();
      else count.textContent = `${plan.cases.length}/${plan.cases.length}`;
      finishRound();
    } else startCase(s);
  } else {
    plan = planRound(level);
    caseIdx = 0;
    startCase();
  }

  return kit.cleanup;
}
