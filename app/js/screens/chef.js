// Trò Đầu bếp nhí (SPEC-jobs3.md mục 5): chú đầu bếp bên trái, khách (bạn thú) bên phải. Mở đầu rửa tay; ca A xếp
// bánh mì kẹp theo thẻ công thức; ca B làm bánh nướng — mỗi động từ một hoạt ảnh rõ (sữa chảy, trứng nứt, thìa khuấy,
// lò đèn cam), bánh còn nóng thì "Hot! Wait!" (không tính nhầm); ca C trang trí bánh (đếm). Không dao, không lửa bếp.
// Trạng thái: start → wash → enter → layer | serve | bake | hot | decor ⇄ busy → leave → ca sau | done.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { markPracticed } from '../player/track.js';
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
} from '../jobs/chef.js';

const JOB = 'chef';
const ENTER_MS = 650;
const LEAVE_MS = 600;
const ANIM_MS = 900; // hoạt ảnh một động từ
const OVEN_MS = 2000;
const HOT_MS = 2000;
const ACTIVE = ['wash', 'layer', 'serve', 'bake', 'decor'];
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

  const cur = () => plan?.cases[caseIdx];
  const customer = () => PATIENT_BY_ID.get(plan?.customers?.[caseIdx] ?? 'teddy');
  const C = (line) => ({ who: 'chef', line });
  const K = (line) => ({ who: 'customer', line });
  // Trứng ốp (lớp bánh mì kẹp) và quả trứng (làm bánh) là hai ảnh khác nhau.
  const layerFace = (id, tag, props = {}) => itemFace(pics, id === 'egg' ? 'fried-egg' : id, tag, { ...props, text: LAYERS[id].emoji });
  const decorFace = (id, tag, props = {}) => itemFace(pics, id, tag, { ...props, text: DECOR[id].emoji });
  const toolFace = (id, tag) => itemFace(pics, id, tag, { text: TOOLS[id].emoji });

  const custEl = h('div.cf-customer');
  const sink = h('button.cf-sink', { type: 'button', 'aria-label': 'Vòi nước', onclick: () => tapSink() },
    h('span.cf-tap', { text: '🚰' }), h('span.cf-water'), h('span.cf-soap', { text: '🧼' }));
  const card = h('div.cf-card', { 'aria-hidden': 'true' });
  const plate = h('button.cf-plate', { type: 'button', 'aria-label': 'Đĩa', onclick: () => tapPlate() },
    h('span.cf-stack'), h('span.cf-plate-art', { html: PLATE_SVG }));
  const stack = plate.firstElementChild;
  const tools = h('div.cf-tools');
  const bowl = h('button.cf-bowl', { type: 'button', 'aria-label': 'Cái bát', dataset: { tool: 'bowl' }, onclick: () => tapTool('bowl') }, h('span', { html: BOWL_SVG }));
  const oven = h('button.cf-oven', { type: 'button', 'aria-label': 'Lò nướng', onclick: () => tapTool('bowl') }, h('span', { html: OVEN_SVG }));
  const cake = h('button.cf-cake', { type: 'button', 'aria-label': 'Cái bánh', onclick: () => tapCake() }, h('span.cf-cake-art', { html: CAKE_SVG }), h('span.cf-tops'), h('span.cf-steam', { text: '♨️' }));
  const tops = cake.querySelector('.cf-tops');
  const table = h('div.cf-table', { 'aria-hidden': 'true' });

  const kit = jobScreen(app, {
    job: JOB, background: { lessonId: JOBS_BG_IMAGES, word: JOB }, className: 'cf-play', stageClass: 'cf-stage', title: '👨‍🍳 Chef',
    helperLabel: 'Nghe lại', cap: 'chef', resetLabel: 'Nấu lại', trayLabel: 'Đồ ăn',
    host: { svg: CHEF_SVG, label: 'chef' },
    roles: {
      of: (who) => (who === 'chef' ? kit.host : who === 'customer' ? custEl : null),
      all: () => [kit.host, custEl].filter((el) => !el.closest('[hidden]')),
    },
    icon: (who) => (who === 'chef' ? '👨‍🍳' : customer()?.emoji ?? ''),
    pitch: (who) => (who === 'customer' ? customer()?.pitch : undefined),
    onTalk: (who) => custEl.classList.toggle('talking', who === 'customer'),
    onReset: () => restart(),
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
      face: (id) => (LAYERS[id] ? layerFace(id, 'span.cf-item') : decorFace(id, 'span.cf-item')),
      label: (id) => (LAYERS[id]?.name ?? DECOR[id].one),
      canGive: () => state === 'layer' || state === 'decor',
      dropOk: (x, y) => {
        const r = (state === 'decor' ? cake : plate).getBoundingClientRect();
        return x >= r.left - 30 && x <= r.right + 30 && y >= r.top - 40 && y <= r.bottom + 30;
      },
      give: (id, from) => (state === 'layer' ? giveLayer(id, from) : giveDecor(id, from)),
    },
  });
  const { stage, count, talk } = kit;
  stage.append(table, sink, card, plate, tools, bowl, oven, cake, custEl);
  const stepKey = () => `${kit.epoch}:${caseIdx}:${state}:${si}:${taken.list().length}`;

  function setState(s) {
    state = s;
    kit.setState(s, s === 'layer' || s === 'decor');
    app.root.dataset.case = cur()?.kind ?? '';
  }
  const snap = (extra = {}) => saveSnap(JOB, { level, plan, caseIdx, si, wrongs, nudges, taken: taken.list(), recorded: [...recorded], washed, ...extra });
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
  function record(key, word, emoji) {
    const k = `${caseIdx}:${key}`;
    if (recorded.has(k)) return;
    recorded.add(k);
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
    return [];
  }
  function nudgeTarget() {
    const c = cur();
    if (state === 'wash') restartAnim(sink, 'nudge');
    else if (state === 'layer') kit.setHint(c.layers[si]);
    else if (state === 'serve') restartAnim(c.kind === 'bake' ? cake : plate, 'nudge');
    else if (state === 'bake') restartAnim(toolEl(BAKE_STEPS[c.steps[si]].tool), 'nudge');
    else if (state === 'decor') kit.setHint(missing()[0]);
  }
  const toolEl = (id) => (id === 'bowl' ? bowl : tools.querySelector(`[data-tool="${id}"]`));

  // ---------- Vẽ ----------
  function showScene(kind) {
    stage.dataset.scene = kind;
    sink.hidden = kind !== 'wash';
    card.hidden = !(kind === 'sandwich' || (kind === 'bake' && cur()?.ordered));
    plate.hidden = kind !== 'sandwich';
    tools.hidden = kind !== 'bake';
    bowl.hidden = kind !== 'bake';
    oven.hidden = kind !== 'bake';
    cake.hidden = kind !== 'decor';
    custEl.hidden = kind === 'wash';
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
    if (state !== 'serve' || cur().kind !== 'sandwich') return;
    serve(plate);
  }
  /** Đưa món cho khách (một thao tác), khách cảm ơn, ra về. */
  async function serve(el) {
    if (!taken.take('serve')) return;
    const e = kit.epoch;
    setState('busy');
    kit.clearNudge();
    snapNext();
    play('whoosh');
    el.classList.remove('ready');
    const from = el.getBoundingClientRect();
    const to = custEl.getBoundingClientRect();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Dùng thuộc tính `translate` / `scale` (không đè `transform` canh giữa của đĩa / bánh).
      await el.animate([{ translate: '0 0', scale: '1' }, { translate: `${center(to).x - center(from).x}px ${center(to).y - center(from).y}px`, scale: '0.6', opacity: 0.2 }],
        { duration: 450, easing: 'ease-in' }).finished.catch(() => {});
    }
    el.hidden = true;
    if (e !== kit.epoch) return;
    renderCustomer('happy');
    restartAnim(custEl, 'hop');
    play('munch');
    playSoundFile(SOUND_BY_ID.get('dishes'), { isCurrent: () => e === kit.epoch }).catch(() => {}); // bát đĩa lách cách (file có sẵn)
    await talk([K(THANKS_LINE)]);
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

  async function nextCase(e) {
    setState('leave');
    restartAnim(custEl, 'leave');
    await wait(LEAVE_MS);
    if (e !== kit.epoch) return;
    custEl.classList.remove('leave');
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
      else if (caseIdx >= plan.cases.length) {
        caseIdx = plan.cases.length - 1;
        count.textContent = `${plan.cases.length}/${plan.cases.length}`;
        finishRound();
      } else startCase(s);
    } else {
      plan = planRound(level, { seen: progress.seen });
      caseIdx = 0;
      startWash();
    }
  });

  return kit.cleanup;
}
