// Trò Bác tài xe buýt (SPEC-jobs3.md mục 7): bác tài bên trái; xe buýt có 3 ghế (thấy qua cửa sổ), trạm xe bên phải
// với người nhà đứng chờ (vẽ người — family.js). Mở đầu bấm còi + thắt dây an toàn. Mỗi ca = một trạm: (mức 2–3) người
// có trạm xuống nói "My stop, please! The yellow stop!" → bé chọn biển trên bản đồ tuyến; (mức 3) có thể gặp đèn đỏ —
// đèn xanh thì bé đạp ga; tới trạm người đó xuống; rồi đón người nhà (gọi lần lượt). Không bỏ ai: sau 2 lần nhắc người
// cần đón tự lên (không ghi tiến độ). Trạng thái: start → horn → belt → map | red | green | pick ⇄ busy → … → done.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { markPracticed } from '../player/track.js';
import { CHILD_VOICE } from '../player/talk-stages.js';
import { cleanJobState, afterJobRound, afterSeen, claims } from '../jobs/levels.js';
import { JOBS_BG_IMAGES } from '../jobs/backgrounds.js';
import { DRIVER_SVG, loadPersonImage } from '../jobs/people.js';
import { familySvg } from '../jobs/family.js';
import { SOUND_BY_ID } from '../animal-sounds.js';
import { playSoundFile } from './animal-sounds.js';
import { jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, WRONG_LOCK_MS, MAX_NUDGES, NUDGE_MS } from '../jobs/kit.js';
import { scaled } from '../timing.js';
import {
  MAX_LEVEL, STOPS, END, planRound, MEMBERS, alightAt, boardAt, initialStates, board, alight, riding,
  HORN_LINE, BEEP_LINE, BELT_LINE, GO_LINE, THANKS_LINE, BYE_LINE, BABY_LINE, EVERYBODY_OFF_LINE, RED_LINE, GREEN_LINE, WAIT_LINE,
  pickUpLine, myStopLine, stopWrongLine, notMeLine,
} from '../jobs/bus.js';

const JOB = 'bus';
const DRIVE_MS = 1100;
const RED_MS = 1500;
const ACTIVE = ['horn', 'belt', 'map', 'green', 'pick'];
const INK = '#3d2c5e';
const HEX = { red: '#ff6b6b', blue: '#4dabf7', yellow: '#ffd43b', green: '#51cf66', pink: '#f783ac', orange: '#ff922b' };
const COLOR_EMOJI = { red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢', pink: '🩷', orange: '🟠' };
const FEEL_EMOJI = { happy: '😊', sad: '😢', sleepy: '😴', hungry: '😋' };
const MEMBER_EMOJI = { grandma: '👵', grandpa: '👴', mummy: '👩', daddy: '👨', sister: '👧', baby: '👶' };
const BUS_SVG = `<svg viewBox="0 0 300 150" aria-hidden="true" preserveAspectRatio="none"><rect x="6" y="10" width="288" height="112" rx="22" fill="#fcc419" stroke="${INK}" stroke-width="6"/><rect x="6" y="88" width="288" height="12" fill="#f59f00"/><rect x="226" y="22" width="60" height="64" rx="10" fill="#e7f5ff" stroke="${INK}" stroke-width="4"/><circle cx="66" cy="126" r="20" fill="#495057" stroke="${INK}" stroke-width="5"/><circle cx="234" cy="126" r="20" fill="#495057" stroke="${INK}" stroke-width="5"/><circle cx="66" cy="126" r="7" fill="#ced4da"/><circle cx="234" cy="126" r="7" fill="#ced4da"/><rect x="280" y="96" width="14" height="10" rx="3" fill="#fff3bf" stroke="${INK}" stroke-width="2"/></svg>`;
const WHEEL_SVG = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="none" stroke="${INK}" stroke-width="10"/><circle cx="50" cy="50" r="12" fill="#fcc419" stroke="${INK}" stroke-width="5"/><path d="M14 50 H38 M62 50 H86 M50 62 V92" stroke="${INK}" stroke-width="9" stroke-linecap="round"/></svg>`;
const BELT_SVG = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M10 10 L60 70" stroke="#495057" stroke-width="16" stroke-linecap="round"/><rect x="52" y="58" width="34" height="26" rx="6" fill="#ced4da" stroke="${INK}" stroke-width="5"/><rect x="62" y="66" width="14" height="10" rx="2" fill="#e03131"/></svg>`;

export function busScreen(app, params = {}) {
  let progress = cleanJobState(app.settings.busGame, { maxLevel: MAX_LEVEL });
  const level = progress.level;
  let plan = null;
  let k = 1; // trạm đang tới (1..3); 4 = bến cuối
  let arrived = false; // đã tới trạm k (đã qua bản đồ / đèn)
  let states = {};
  let state = 'start';
  let wrongs = 0;
  let nudges = 0;
  let intro = { horn: false, belt: false };
  let recorded = new Set();
  let taken = claims();
  let lastWrong = { key: '', at: 0 };
  let autoTimer = null;

  const D = (line) => ({ who: 'driver', line });
  const P = (id, line) => ({ who: `p:${id}`, line });
  const person = (id) => plan.passengers.find((p) => p.id === id) ?? plan.waiting.flat().find((w) => typeof w === 'object' && w.id === id);

  const cab = h('div.bs-cab', { 'aria-hidden': 'true' }); // ô cửa lái: màn dọc bác tài ngồi ở đây (mục 7)
  const bus = h('div.bs-bus', {}, h('span.bs-bus-art', { html: BUS_SVG }), h('div.bs-seats'), cab);
  const seats = bus.querySelector('.bs-seats');
  const stop = h('div.bs-stop', {}, h('div.bs-sign', {}, h('span.bs-sign-face'), h('span.bs-pole')), h('div.bs-queue'));
  const sign = stop.querySelector('.bs-sign-face');
  const queue = stop.querySelector('.bs-queue');
  const map = h('div.bs-map', { hidden: true });
  const wheel = h('button.bs-wheel', { type: 'button', 'aria-label': 'Còi xe', html: WHEEL_SVG, onclick: () => tapHorn() });
  const belt = h('button.bs-belt', { type: 'button', 'aria-label': 'Dây an toàn', html: BELT_SVG, onclick: () => tapBelt() });
  const light = h('div.bs-light', { hidden: true, 'aria-hidden': 'true' }, h('span.bs-lamp.red'), h('span.bs-lamp.green'));
  const pedal = h('button.bs-pedal', { type: 'button', 'aria-label': 'Bàn đạp ga', hidden: true, onclick: () => tapPedal() }, h('span', { text: '🦶' }));

  const kit = jobScreen(app, {
    job: JOB, background: { lessonId: JOBS_BG_IMAGES, word: JOB }, className: 'bs-play', stageClass: 'bs-stage', title: '🚌 Bus',
    helperLabel: 'Nghe lại', cap: 'bus', resetLabel: 'Chạy lại',
    host: { svg: DRIVER_SVG, label: 'driver' },
    roles: {
      of: (who) => (who === 'driver' ? kit.host : who?.startsWith('p:') ? personEls(who.slice(2)) : null),
      all: () => [kit.host, ...stage.querySelectorAll('.bs-person')].filter((el) => !el.closest('[hidden]')),
      dim: (el) => !el.classList.contains('bs-person') || state !== 'pick', // lúc đón: người chờ (bé cần chạm) không mờ
    },
    icon: (who) => (who === 'driver' ? '🚌' : MEMBER_EMOJI[person(who?.slice(2))?.member] ?? '🧑'),
    altVoice: (who) => who !== 'driver',
    pitch: (who) => (who?.startsWith('p:') && MEMBERS[person(who.slice(2))?.member]?.kid ? CHILD_VOICE.pitch : undefined),
    onReset: () => restart(),
    onHelper: () => repeatPrompt(),
    nudge: {
      ready: () => ACTIVE.includes(state) && nudges < MAX_NUDGES,
      key: () => stepKey(),
      fire: (rearm) => {
        nudges += 1;
        snap();
        nudgeTarget();
        kit.talk(promptLines()).then(() => {
          // Không bỏ ai (mục 7.5): nhắc lần 2 xong mà bé vẫn chưa đón thì người đó tự lên xe.
          if (state === 'pick' && nudges >= MAX_NUDGES) {
            const key = stepKey();
            clearTimeout(autoTimer);
            autoTimer = setTimeout(() => key === stepKey() && autoBoard(), scaled(NUDGE_MS / 2));
          }
          rearm();
        });
      },
    },
  });
  const { stage, count, talk } = kit;
  stage.append(h('div.bs-road', { 'aria-hidden': 'true' }), stop, bus, map, wheel, belt, light, pedal);
  kit.onCleanup(() => clearTimeout(autoTimer));
  // Màn dọc (điện thoại): bác tài ngồi trong ô cửa lái phía trước xe; màn ngang: đứng bên trái như các nghề khác.
  const portrait = matchMedia('(max-width: 600px), (orientation: portrait)');
  const placeDriver = () => {
    if (!kit.host) return;
    if (portrait.matches) cab.append(kit.host);
    else stage.prepend(kit.host);
    bus.classList.toggle('with-driver', portrait.matches);
  };
  placeDriver();
  portrait.addEventListener('change', placeDriver, { signal: kit.signal });
  const stepKey = () => `${kit.epoch}:${k}:${state}:${riding(states).length}:${wrongs}`;
  const personEls = (id) => [...stage.querySelectorAll(`.bs-person[data-id="${id}"]`)];

  function setState(s) {
    state = s;
    kit.setState(s, false);
  }
  const snap = () => saveSnap(JOB, { level, plan, k, arrived, states, wrongs, nudges, intro, recorded: [...recorded], taken: taken.list() });
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
  function record(key, word, emoji) {
    if (recorded.has(key)) return;
    recorded.add(key);
    markPracticed(app, word, emoji);
  }
  function seen(id) {
    const key = `seen:${id}`;
    if (recorded.has(key)) return;
    recorded.add(key);
    progress = afterSeen(progress, id);
  }
  async function ask(lines, s) {
    const e = kit.epoch;
    setState(s);
    snap();
    await talk(lines);
    if (e === kit.epoch && state === s) kit.armNudge();
  }

  // ---------- Câu hỏi ----------
  const nextToBoard = () => boardAt(plan, k).find((p) => states[p.id]?.state === 'waiting');
  const isSecond = (p) => boardAt(plan, k).indexOf(p) > 0;
  const leaver = () => alightAt(plan, k)[0];
  function promptLines() {
    if (state === 'horn') return [D(HORN_LINE)];
    if (state === 'belt') return [D(BELT_LINE)];
    if (state === 'map') return [P(leaver().id, myStopLine(plan.stops[k - 1]))];
    if (state === 'green') return [D(GREEN_LINE)];
    if (state === 'pick') {
      const p = nextToBoard();
      return p ? [D(pickUpLine(p, level, isSecond(p)))] : [];
    }
    return [];
  }
  function nudgeTarget() {
    if (state === 'horn') restartAnim(wheel, 'nudge');
    else if (state === 'belt') restartAnim(belt, 'nudge');
    else if (state === 'map') restartAnim(map.querySelector(`[data-color="${plan.stops[k - 1]}"]`), 'nudge');
    else if (state === 'green') restartAnim(pedal, 'nudge');
    else if (state === 'pick') restartAnim(queue.querySelector(`[data-id="${nextToBoard()?.id}"]`), 'nudge');
  }

  // ---------- Vẽ ----------
  function personBtn(w, where) {
    const label = `${MEMBERS[w.member].name}${level >= 3 ? ` (${w.mood})` : ''}`;
    return h(`button.bs-person.${w.member}`, {
      type: 'button', 'aria-label': label, dataset: { id: w.id, member: w.member, mood: w.mood, where },
      html: familySvg(w.member, w.mood, label),
      onclick: where === 'queue' ? () => tapPerson(w.id) : null,
    });
  }
  function renderSeats() {
    seats.replaceChildren(...riding(states).map((id) => h('div.bs-seat', {}, personBtn(person(id), 'seat'))));
  }
  function renderStop() {
    const color = plan.stops[k - 1];
    stop.hidden = k > STOPS || !arrived;
    sign.style.background = color ? HEX[color] : '#fff';
    sign.textContent = color ? '🚏' : '🏁';
    stop.dataset.color = color ?? 'end';
    const wait = (plan.waiting[k - 1] ?? []).map((w) => (typeof w === 'string' ? person(w) : w))
      .filter((w) => !states[w.id] || states[w.id].state === 'waiting');
    queue.replaceChildren(...wait.map((w) => personBtn(w, 'queue')));
    queue.dataset.want = nextToBoard()?.id ?? ''; // cho test
  }
  function renderMap() {
    const opts = [plan.stops[1], plan.stops[2], plan.mapExtra];
    const order = [...opts].sort();
    map.replaceChildren(h('span.bs-map-line', { 'aria-hidden': 'true' }), ...order.map((c) => h('button.bs-map-stop', {
      type: 'button', 'aria-label': `${c} stop`, dataset: { color: c }, style: { background: HEX[c] },
      onclick: () => tapMap(c),
    }, h('span', { text: '🚏' }))));
    map.dataset.want = plan.stops[k - 1]; // cho test
  }
  function render() {
    count.textContent = `${Math.min(k, STOPS)}/${STOPS}`;
    renderSeats();
    renderStop();
  }

  // ---------- Mở đầu: còi + dây an toàn ----------
  async function startIntro() {
    render();
    stop.hidden = true;
    wheel.hidden = intro.horn;
    belt.hidden = !intro.horn || intro.belt;
    if (!intro.horn) return ask([D(HORN_LINE)], 'horn');
    if (!intro.belt) return ask([D(BELT_LINE)], 'belt');
    return startStop();
  }
  async function tapHorn() {
    if (state !== 'horn' || !taken.take('horn')) return;
    const e = kit.epoch;
    setState('busy');
    kit.clearNudge();
    intro.horn = true;
    snap();
    // Còi xe: tiếng thật "beep beep" (car.mp3 của Ai kêu thế?), không phát được thì tiếng tổng hợp.
    playSoundFile(SOUND_BY_ID.get('car'), { isCurrent: () => e === kit.epoch }).then((ok) => ok || play('honk')).catch(() => play('honk'));
    restartAnim(bus, 'honk');
    await talk([D(BEEP_LINE)]);
    if (e !== kit.epoch) return;
    wheel.hidden = true;
    belt.hidden = false;
    await ask([D(BELT_LINE)], 'belt');
  }
  async function tapBelt() {
    if (state !== 'belt' || !taken.take('belt')) return;
    const e = kit.epoch;
    setState('busy');
    kit.clearNudge();
    intro.belt = true;
    snap();
    play('pop');
    belt.classList.add('on');
    await talk([D(GO_LINE)]);
    if (e !== kit.epoch) return;
    belt.hidden = true;
    startStop();
  }

  // ---------- Một trạm (ca) ----------
  async function startStop() {
    const e = kit.epoch;
    wrongs = 0;
    nudges = 0;
    map.hidden = true;
    light.hidden = true;
    pedal.hidden = true;
    render();
    if (arrived) return atStop(e);
    stop.hidden = true;
    // Mức 2–3: người xuống ở trạm này nói trạm của mình, bé chọn biển trên bản đồ.
    if (k <= STOPS && level >= 2 && leaver() && states[leaver().id]?.state === 'riding') {
      renderMap();
      map.hidden = false;
      return ask([P(leaver().id, myStopLine(plan.stops[k - 1]))], 'map');
    }
    return roadToStop(e);
  }
  async function tapMap(color) {
    if (state !== 'map') return;
    const want = plan.stops[k - 1];
    const el = map.querySelector(`[data-color="${color}"]`);
    if (color !== want) {
      if (!countWrong(`m:${color}`)) return;
      restartAnim(el, 'shake');
      if (wrongs >= 1) restartAnim(map.querySelector(`[data-color="${want}"]`), 'nudge');
      const key = stepKey();
      await talk([P(leaver().id, stopWrongLine(color, want))]);
      if (key === stepKey()) kit.armNudge();
      return;
    }
    if (!taken.take(`map:${k}`)) return;
    const e = kit.epoch;
    setState('busy');
    kit.clearNudge();
    if (wrongs === 0) record(`color:${k}`, want, COLOR_EMOJI[want]);
    snap();
    el.classList.add('picked');
    play('ding');
    await wait(300);
    if (e !== kit.epoch) return;
    map.hidden = true;
    roadToStop(e);
  }
  /** Chạy tới trạm (có thể gặp đèn đỏ ở mức 3). */
  async function roadToStop(e) {
    if (plan.lightBefore === (k > STOPS ? END : k) && !taken.has(`light:${k}`)) return redLight(e);
    await drive(e);
    if (e !== kit.epoch) return;
    arrived = true;
    snap();
    atStop(e);
  }
  async function drive(e) {
    setState('drive');
    stage.classList.add('driving');
    play('whoosh');
    await wait(DRIVE_MS);
    stage.classList.remove('driving');
  }
  async function redLight(e) {
    light.hidden = false;
    light.dataset.on = 'red';
    pedal.hidden = false;
    setState('red');
    snap();
    await Promise.all([talk([D(RED_LINE)]), wait(RED_MS)]);
    if (e !== kit.epoch) return;
    light.dataset.on = 'green';
    play('ding');
    await ask([D(GREEN_LINE)], 'green');
  }
  async function tapPedal() {
    if (state === 'red') {
      // Đèn đỏ: xe đứng yên, không tính nhầm.
      restartAnim(pedal, 'shake');
      talk([D(WAIT_LINE)]);
      return;
    }
    if (state !== 'green' || !taken.take(`light:${k}`)) return;
    const e = kit.epoch;
    kit.clearNudge();
    snap();
    light.hidden = true;
    pedal.hidden = true;
    roadToStop(e);
  }

  async function atStop(e) {
    render();
    if (k > STOPS) return endOfLine(e);
    stop.hidden = false;
    // Xuống: chỉ người có trạm xuống là trạm này (người khác vẫn ngồi trên xe — JOBS3-17).
    const off = alightAt(plan, k).filter((p) => states[p.id]?.state === 'riding');
    if (off.length) {
      states = alight(states, plan, k);
      snap();
      setState('busy');
      await talk(off.map((p) => P(p.id, MEMBERS[p.member].baby ? BABY_LINE : BYE_LINE)));
      if (e !== kit.epoch) return;
      play('pop');
      render();
    }
    askPick(e);
  }
  async function askPick(e) {
    const p = nextToBoard();
    wrongs = 0;
    nudges = 0;
    render();
    if (!p) return nextStop(e);
    await ask([D(pickUpLine(p, level, isSecond(p)))], 'pick');
  }
  async function tapPerson(id) {
    if (state !== 'pick') return;
    const want = nextToBoard();
    if (!want) return;
    const el = queue.querySelector(`[data-id="${id}"]`);
    if (id !== want.id) {
      if (!countWrong(`w:${id}`)) return;
      clearTimeout(autoTimer);
      restartAnim(el, 'shake');
      if (wrongs >= 1) restartAnim(queue.querySelector(`[data-id="${want.id}"]`), 'nudge');
      const key = stepKey();
      await talk([P(id, notMeLine(person(id), level)), D(pickUpLine(want, level, isSecond(want)))]);
      if (key === stepKey()) kit.armNudge();
      return;
    }
    boardPerson(want, 'child');
  }
  function autoBoard() {
    const p = nextToBoard();
    if (state !== 'pick' || !p) return;
    boardPerson(p, 'auto');
  }
  async function boardPerson(p, by) {
    if (!taken.take(`board:${p.id}`)) return;
    const e = kit.epoch;
    clearTimeout(autoTimer);
    setState('busy');
    kit.clearNudge();
    // Lưu trước hoạt ảnh (JOBS3-18): quay lại thì người đó đã ngồi trên xe.
    states = board(states, plan, p.id, k, by);
    if (by === 'child' && wrongs === 0) {
      record(`member:${p.id}`, p.member, '👪');
      if (level >= 3) record(`mood:${p.id}`, p.mood, FEEL_EMOJI[p.mood]);
      seen(p.member);
    }
    snap();
    const el = queue.querySelector(`[data-id="${p.id}"]`);
    if (el) {
      const g = await kit.flyTo(h('span.bs-fly', { html: familySvg(p.member, p.mood) }), center(el.getBoundingClientRect()), center(seats.getBoundingClientRect()));
      el.remove();
      kit.removeGhost(g);
    }
    if (e !== kit.epoch) return;
    play('pop');
    renderSeats();
    await talk([P(p.id, MEMBERS[p.member].baby ? BABY_LINE : THANKS_LINE)]);
    if (e !== kit.epoch) return;
    askPick(e);
  }
  async function nextStop(e) {
    setState('busy');
    k += 1;
    arrived = false;
    snap();
    stop.hidden = true;
    if (e !== kit.epoch) return;
    startStop();
  }
  async function endOfLine(e) {
    stop.hidden = false;
    sign.style.background = '#fff';
    sign.textContent = '🏁';
    queue.replaceChildren();
    setState('busy');
    await talk([D(EVERYBODY_OFF_LINE)]);
    if (e !== kit.epoch) return;
    states = alight(states, plan, END);
    snap();
    play('sparkle');
    renderSeats();
    await wait(400);
    if (e !== kit.epoch) return;
    finishRound();
  }

  function finishRound() {
    if (state === 'done') return;
    setState('done');
    kit.finishRound(() => {
      clearSnap(JOB);
      progress = afterJobRound(progress, { maxLevel: MAX_LEVEL });
      app.setSetting('busGame', progress).catch(() => {});
    });
  }
  function restart() {
    if (state === 'done' || !plan) return;
    kit.cancelAll();
    clearTimeout(autoTimer);
    k = 1;
    arrived = false;
    states = initialStates(plan);
    taken = claims(['horn', 'belt']);
    startStop();
  }
  function repeatPrompt() {
    if (!ACTIVE.includes(state)) return;
    const key = stepKey();
    talk(promptLines()).then(() => key === stepKey() && kit.armNudge());
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
  if (s) {
    plan = s.plan;
    k = s.k;
    arrived = s.arrived;
    states = s.states;
    intro = s.intro;
    recorded = new Set(s.recorded ?? []);
    taken = claims(s.taken ?? []);
    if (!intro.belt) startIntro();
    else startStop();
  } else {
    plan = planRound(level, { seen: progress.seen });
    states = initialStates(plan);
    startIntro();
  }

  return kit.cleanup;
}
