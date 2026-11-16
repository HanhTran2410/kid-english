// Trò Thợ xây (SPEC-jobs3.md mục 6): chú thợ xây bên trái, bạn thú (khách) bên phải. Mở đầu đội mũ bảo hộ; ca A xây
// nhà theo bản vẽ — mỗi lần một phần sáng lên, bé đưa hình trong khay vào (mức 1 bản vẽ lộ dáng + màu; mức 2–3 chỉ là ô
// xám, phải nghe); ca B lấp ổ gà đúng dáng. Hình sai không nằm lên bản vẽ, bật về khay (tính nhầm). SPEC-jobs4 mục 4:
// ca C sơn chính ngôi nhà ca A (thùng sơn → phần nhà), ca D xây tháp (đếm; mức 3 tiếp mẫu lặp màu). Lượt A + (B / D) + C.
// Trạng thái: start → helmet → enter → part | hole | paint | tower ⇄ busy → leave → ca sau | done.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { markPracticed } from '../player/track.js';
import { patientSvg } from '../patients.js';
import { PATIENT_BY_ID } from '../doctor.js';
import { cleanShapeState } from '../shapes.js';
import { cleanJobState, afterJobRound, afterSeen, claims } from '../jobs/levels.js';
import { JOBS_BG_IMAGES } from '../jobs/backgrounds.js';
import { BUILDER_SVG, loadPersonImage } from '../jobs/people.js';
import { jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, WRONG_LOCK_MS, MAX_NUDGES } from '../jobs/kit.js';
import {
  MAX_LEVEL, planRound, pieceFits, playedShapes2, SHAPES,
  HELMET_LINE, BUILD_LINE, HOUSE_LINE, MY_HOUSE_LINE, HOLE_LINE, ROAD_THANKS_LINE,
  partAskLine, partDoneLine, pieceWrongLine, holeAskLine, holeIntroLine, blockWrongLine,
  bucketsOf, towerWant, PAINT_LINE, PAINT_DONE_LINE, TOWER_LINE, TOWER_DONE_LINE, NEXT_LINE, ENOUGH_LINE,
  paintColorLine, paintAskLine, bucketWrongLine, partWrongLine, towerAskLine, blockColorWrongLine, patternLine, countLine,
} from '../jobs/build.js';

const JOB = 'build';
const ENTER_MS = 650;
const LEAVE_MS = 600;
const DRIVE_MS = 900;
const ACTIVE = ['helmet', 'part', 'hole', 'paint', 'tower'];
const INK = '#3d2c5e';
const HEX = { red: '#ff6b6b', blue: '#4dabf7', yellow: '#ffd43b', green: '#69db7c', grey: '#adb5bd', stone: '#ced4da' };
const COLOR_EMOJI = { red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢' };

/**
 * Hình (viewBox 100 × 100). `box`: vẽ kín khung (ô trên bản vẽ, kéo giãn theo ô); không thì vẽ đúng tỉ lệ (khối trong khay).
 */
function shapePath(shape, box) {
  switch (shape) {
    case 'square': return box ? '<rect x="3" y="3" width="94" height="94" rx="4"/>' : '<rect x="12" y="12" width="76" height="76" rx="4"/>';
    case 'rectangle': return box ? '<rect x="3" y="3" width="94" height="94" rx="4"/>' : '<rect x="26" y="6" width="48" height="88" rx="4"/>';
    case 'triangle': return box ? '<path d="M50 3 L97 97 H3 Z"/>' : '<path d="M50 10 L92 88 H8 Z"/>';
    case 'trapezoid': return box ? '<path d="M24 3 H76 L97 97 H3 Z"/>' : '<path d="M30 20 H70 L92 80 H8 Z"/>';
    case 'circle': return box ? '<circle cx="50" cy="50" r="47"/>' : '<circle cx="50" cy="50" r="40"/>';
    case 'semicircle': return box ? '<path d="M3 97 V50 A47 47 0 0 1 97 50 V97 Z"/>' : '<path d="M8 76 A42 42 0 0 1 92 76 Z"/>';
    case 'diamond': return box ? '<path d="M50 3 L97 50 L50 97 L3 50 Z"/>' : '<path d="M50 6 L86 50 L50 94 L14 50 Z"/>';
    case 'hexagon': return box ? '<path d="M27 3 H73 L97 50 L73 97 H27 L3 50 Z"/>' : '<path d="M30 12 H70 L90 50 L70 88 H30 L10 50 Z"/>';
    case 'parallelogram': return box ? '<path d="M28 3 H97 L72 97 H3 Z"/>' : '<path d="M30 22 H94 L70 78 H6 Z"/>';
    case 'star': return '<path d="M50 6 L61 38 H94 L67 58 L77 92 L50 72 L23 92 L33 58 L6 38 H39 Z"/>';
    case 'heart': return '<path d="M50 88 C10 60 6 30 26 18 C40 10 50 22 50 30 C50 22 60 10 74 18 C94 30 90 60 50 88 Z"/>';
    default: return '<circle cx="50" cy="50" r="40"/>';
  }
}
const shapeSvg = (shape, fill, { box = false, dashed = false } = {}) => `<svg viewBox="0 0 100 100" preserveAspectRatio="${box ? 'none' : 'xMidYMid meet'}" aria-hidden="true"><g fill="${fill}" stroke="${INK}" stroke-width="${dashed ? 3 : 5}" ${dashed ? 'stroke-dasharray="8 6"' : ''} stroke-linejoin="round" vector-effect="non-scaling-stroke">${shapePath(shape, box)}</g></svg>`;
const HELMET_SVG = `<svg viewBox="0 0 100 70" aria-hidden="true"><path d="M10 56 C8 14 92 14 90 56 Z" fill="#ffd43b" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M50 16 V54" stroke="#f59f00" stroke-width="8"/><rect x="2" y="52" width="96" height="12" rx="6" fill="#fcc419" stroke="${INK}" stroke-width="5"/></svg>`;
/** Chỗ các phần trên bản vẽ (phần trăm khung bản vẽ). */
const SLOT = {
  wall: { left: 12, top: 40, width: 76, height: 58 },
  roof: { left: 4, top: 2, width: 92, height: 40 },
  door: { left: 40, top: 62, width: 20, height: 36 },
  window: [{ left: 18, top: 50, width: 16, height: 22 }, { left: 66, top: 50, width: 16, height: 22 }],
};

/** Cửa sổ trên bản vẽ: cửa sổ to (mức 3) lớn hơn ô thường. */
function windowRect(i, size) {
  const r = SLOT.window[i % SLOT.window.length];
  return size === 'big' ? { left: i % 2 ? r.left - 5 : r.left, top: r.top - 5, width: r.width + 5, height: r.height + 10 } : r;
}
const bucketSvg = (color) => `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M30 22 Q50 2 70 22" fill="none" stroke="${INK}" stroke-width="5"/><path d="M18 26 H82 L74 92 H26 Z" fill="#dee2e6" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M18 26 H82 L80 42 Q50 54 20 42 Z" fill="${HEX[color]}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></svg>`;
const brushSvg = (fill) => `<svg viewBox="0 0 60 120" aria-hidden="true"><rect x="24" y="44" width="12" height="72" rx="6" fill="#c2855a" stroke="${INK}" stroke-width="4"/><rect x="16" y="34" width="28" height="14" rx="3" fill="#adb5bd" stroke="${INK}" stroke-width="4"/><path d="M16 34 V14 Q30 2 44 14 V34 Z" fill="${fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></svg>`;
const blockSvg = (color) => `<svg viewBox="0 0 100 60" aria-hidden="true"><rect x="4" y="4" width="92" height="52" rx="8" fill="${HEX[color]}" stroke="${INK}" stroke-width="5"/><circle cx="30" cy="4" r="9" fill="${HEX[color]}" stroke="${INK}" stroke-width="4"/><circle cx="70" cy="4" r="9" fill="${HEX[color]}" stroke="${INK}" stroke-width="4"/></svg>`;

export function buildScreen(app, params = {}) {
  let progress = cleanJobState(app.settings.buildGame, { maxLevel: MAX_LEVEL });
  const level = progress.level;
  const shapes2 = playedShapes2(cleanShapeState(app.settings.shapeCount2));
  let plan = null;
  let caseIdx = 0;
  let state = 'start';
  let si = 0; // bước của ca nhà
  let wrongs = 0;
  let nudges = 0;
  let taken = claims();
  let recorded = new Set();
  let helmet = false;
  let lastWrong = { key: '', at: 0 };

  const cur = () => plan?.cases[caseIdx];
  const customer = () => PATIENT_BY_ID.get(plan?.customers?.[caseIdx] ?? 'teddy');
  const B = (line) => ({ who: 'builder', line });
  const K = (line) => ({ who: 'customer', line });

  const custEl = h('div.bd-customer');
  const helmetBtn = h('button.bd-helmet', { type: 'button', 'aria-label': 'Mũ bảo hộ', onclick: () => tapHelmet(), html: HELMET_SVG });
  const house = h('div.bd-plan');
  const road = h('div.bd-road', {}, h('span.bd-hole'), h('span.bd-car', { 'aria-hidden': 'true' }));
  const hole = road.querySelector('.bd-hole');
  const car = road.querySelector('.bd-car');
  const blocks = h('div.bd-blocks');
  const smoke = h('span.bd-smoke', { 'aria-hidden': 'true', text: '💨' });
  const wave = h('div.bd-wave', { hidden: true, 'aria-hidden': 'true' });
  const paints = h('div.bd-paints');
  const brush = h('span.bd-brush', { hidden: true, 'aria-hidden': 'true' });
  const tower = h('div.bd-tower');
  const piles = h('div.bd-piles');
  // Ca C: chạm phần nhà để sơn (các ô bản vẽ dựng lại mỗi lần vẽ — bắt chạm ở khung).
  house.addEventListener('click', (ev) => {
    const slot = ev.target.closest?.('.bd-slot');
    if (slot && state === 'paint') tapPaintPart(slot.dataset.id);
  });

  const kit = jobScreen(app, {
    job: JOB, background: { lessonId: JOBS_BG_IMAGES, word: JOB }, className: 'bd-play', stageClass: 'bd-stage', title: '👷 Builder',
    helperLabel: 'Nghe lại', cap: 'build', resetLabel: 'Xây lại', trayLabel: 'Các hình',
    host: { svg: BUILDER_SVG, label: 'builder' },
    roles: {
      of: (who) => (who === 'builder' ? kit.host : who === 'customer' ? (wave.hidden ? custEl : wave) : null),
      all: () => [kit.host, custEl, wave].filter((el) => !el.closest('[hidden]')),
    },
    icon: (who) => (who === 'builder' ? '👷' : customer()?.emoji ?? ''),
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
        kit.talk(promptLines()).then(rearm);
      },
    },
    tray: {
      face: (id) => {
        const p = pieceOf(id);
        return h(`span.bd-piece.${p.size ?? 'big'}`, { html: shapeSvg(p.shape, HEX[p.color] ?? HEX.grey) });
      },
      label: (id) => {
        const p = pieceOf(id);
        return `${level >= 3 ? `${p.size} ` : ''}${p.color} ${SHAPES[p.shape].name}`;
      },
      canGive: () => state === 'part',
      dropOk: (x, y) => {
        const r = house.getBoundingClientRect();
        return x >= r.left - 20 && x <= r.right + 20 && y >= r.top - 20 && y <= r.bottom + 20;
      },
      give: (id, from) => givePiece(id, from),
    },
  });
  const { stage, count, talk } = kit;
  stage.append(helmetBtn, house, road, blocks, custEl, smoke, wave, paints, brush, tower, piles);
  const stepKey = () => `${kit.epoch}:${caseIdx}:${state}:${si}:${taken.list().length}`;

  function setState(s) {
    state = s;
    kit.setState(s, s === 'part');
    app.root.dataset.case = cur()?.kind ?? '';
  }
  const snap = () => saveSnap(JOB, { level, plan, caseIdx, si, wrongs, nudges, taken: taken.list(), recorded: [...recorded], helmet });
  const snapNext = () => saveSnap(JOB, { level, plan, caseIdx: caseIdx + 1, si: 0, wrongs: 0, nudges: 0, taken: [], recorded: [...recorded], helmet });
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

  // ---------- Khối / phần của ca nhà ----------
  const partOf = (id) => cur().parts.find((p) => p.id === id);
  /** Khối trong khay: mức 1 là chính các phần (`p0:ok`…); mức 2–3 lấy từ `pieces` của bước. */
  function pieceOf(id) {
    const c = cur();
    if (c.pieces) for (const list of c.pieces) for (const p of list) if (p.id === id) return p;
    const part = partOf(id.split(':')[0]);
    return { id, shape: part.shape, color: part.color, size: part.size };
  }
  const stepParts = () => cur().steps[si].map(partOf);
  const openParts = () => stepParts().filter((p) => !taken.has(`part:${p.id}`));
  function trayIds() {
    const c = cur();
    if (!c.pieces) return c.parts.filter((p) => !taken.has(`part:${p.id}`)).map((p) => `${p.id}:ok`);
    return c.pieces[si].filter((pc) => !taken.has(`piece:${pc.id}`)).map((pc) => pc.id);
  }
  const rightPiece = () => trayIds().find((id) => openParts().some((p) => pieceFits(level, p, pieceOf(id))));

  // ---------- Câu hỏi ----------
  function promptLines() {
    if (state === 'helmet') return [B(HELMET_LINE)];
    const c = cur();
    if (state === 'part') return [level <= 1 ? B(partAskLine(level, stepParts())) : K(partAskLine(level, stepParts()))];
    if (state === 'hole') return [B(holeAskLine(c.hole))];
    if (state === 'paint') return [paintPrompt()];
    if (state === 'tower') return [B(towerAskLine(c))];
    return [];
  }
  function nudgeTarget() {
    if (state === 'helmet') restartAnim(helmetBtn, 'nudge');
    else if (state === 'part') kit.setHint(rightPiece());
    else if (state === 'hole') restartAnim(blocks.querySelector(`[data-shape="${cur().hole}"]`), 'nudge');
    else if (state === 'paint') {
      const a = paintAsk();
      restartAnim(dipped() ? house.querySelector(`.bd-slot[data-id="${a.id}"]`) : paints.querySelector(`[data-color="${a.color}"]`), 'nudge');
    } else if (state === 'tower') restartAnim(piles.querySelector(`[data-color="${towerWant(cur(), towerPlaced())}"]`), 'nudge');
  }

  // ---------- Vẽ ----------
  function showScene(kind) {
    stage.dataset.scene = kind;
    helmetBtn.hidden = kind !== 'helmet';
    house.hidden = kind !== 'house' && kind !== 'paint';
    paints.hidden = kind !== 'paint';
    brush.hidden = true;
    tower.hidden = kind !== 'tower';
    piles.hidden = kind !== 'tower';
    road.hidden = kind !== 'road';
    blocks.hidden = kind !== 'road';
    custEl.hidden = kind === 'helmet';
    smoke.hidden = true;
    wave.hidden = true;
    kit.renderTray([]);
    if (plan) count.textContent = `${Math.min(caseIdx + 1, plan.cases.length)}/${plan.cases.length}`;
  }
  function renderCustomer(mood = 'happy') {
    const p = customer();
    custEl.innerHTML = patientSvg(p.id, { mood, title: p.name });
  }
  function renderHouse() {
    const c = cur();
    const now = new Set(si < c.steps.length ? c.steps[si] : []);
    let w = 0;
    house.replaceChildren(...c.parts.map((p) => {
      const r = p.part === 'window' ? windowRect(w++, p.size) : SLOT[p.part];
      const done = taken.has(`part:${p.id}`);
      const active = !done && now.has(p.id);
      const el = h('div.bd-slot', {
        dataset: { part: p.part, id: p.id }, class: `${done ? 'done' : ''}${active ? ' active' : ''}`,
        style: { left: `${r.left}%`, top: `${r.top}%`, width: `${r.width}%`, height: `${r.height}%`, zIndex: p.part === 'wall' ? 1 : 2 },
      });
      // Mức 1: phần đang làm lộ dáng + màu nhạt (nhìn là làm được); mức 2–3: chỉ ô xám, phải nghe.
      if (done) el.innerHTML = shapeSvg(p.shape, HEX[p.color], { box: true });
      else if (active && level <= 1) el.innerHTML = shapeSvg(p.shape, `${HEX[p.color]}66`, { box: true, dashed: true });
      return el;
    }));
    house.dataset.want = [...now].join(','); // cho test
    kit.renderTray(si < c.steps.length ? trayIds() : []);
  }

  // ---------- Mở đầu: đội mũ ----------
  async function startHelmet() {
    showScene('helmet');
    await ask([B(HELMET_LINE)], 'helmet');
  }
  async function tapHelmet() {
    if (state !== 'helmet' || !taken.take('helmet')) return;
    const e = kit.epoch;
    setState('busy');
    kit.clearNudge();
    helmet = true;
    snap();
    play('pop');
    // Mũ bay tới đầu chú thợ xây (phần trên của hình), không phải giữa người.
    const r = kit.host.getBoundingClientRect();
    const g = await kit.flyTo(h('span.bd-fly-helmet', { html: HELMET_SVG }), center(helmetBtn.getBoundingClientRect()), { x: r.left + r.width / 2, y: r.top + r.height * 0.22 });
    kit.removeGhost(g);
    if (e !== kit.epoch) return;
    setBadge();
    restartAnim(kit.host, 'bd-hat-pop');
    await talk([B(BUILD_LINE)]);
    if (e !== kit.epoch) return;
    taken = claims();
    startCase();
  }
  function setBadge() {
    const badge = kit.host?.querySelector('.jb-host-badge');
    // Hình vẽ sẵn: mũ đội lên đầu chú (chưa chạm mũ thì đầu trần). Ảnh của bố mẹ không đội mũ được → huy hiệu 👷.
    const drawn = Boolean(kit.host?.querySelector('.jb-builder-hat'));
    if (badge) badge.textContent = helmet && !drawn ? '👷' : '';
    kit.host?.classList.toggle('bd-helmet-on', helmet);
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
    renderCustomer(c.kind === 'road' ? 'sad' : 'happy');
    snap();
    if (!resume) {
      restartAnim(custEl, 'enter');
      await wait(ENTER_MS);
      if (e !== kit.epoch) return;
    }
    if (c.kind === 'paint') return startPaint(resume, e);
    if (c.kind === 'tower') return startTower(resume, e);
    if (c.kind === 'house') {
      house.classList.remove('built');
      renderHouse();
      if (si >= c.steps.length) return houseDone(e);
      return ask(resume ? [stepAsk()] : [K(HOUSE_LINE), stepAsk()], 'part');
    }
    renderRoad();
    if (taken.has('block')) return roadDone(e);
    return ask(resume ? [B(holeAskLine(c.hole))] : [K(HOLE_LINE), ...(level <= 1 ? [B(holeIntroLine(c.hole))] : []), B(holeAskLine(c.hole))], 'hole');
  }
  const stepAsk = () => (level <= 1 ? B(partAskLine(level, stepParts())) : K(partAskLine(level, stepParts())));

  async function givePiece(id, from) {
    if (state !== 'part') return;
    const e = kit.epoch;
    const piece = pieceOf(id);
    const target = openParts().find((p) => pieceFits(level, p, piece));
    if (!target) {
      if (!countWrong(`p:${id}`)) return;
      kit.setHint(rightPiece()); // tên hình có trong câu: khối đúng nhún ngay sau lần nhầm đầu
      restartAnim(house, 'shake');
      const k = stepKey();
      await talk([B(pieceWrongLine(level, stepParts(), piece))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (!taken.take(`part:${target.id}`)) return;
    if (piece.id.endsWith(':ok') || level >= 2) taken.take(`piece:${id}`);
    kit.clearNudge();
    kit.setHint(null);
    const stepDone = !openParts().length;
    const firstTry = wrongs === 0;
    if (stepDone) {
      if (firstTry && level === 2) record(`color:${si}`, target.color, COLOR_EMOJI[target.color]);
      if (firstTry && level >= 3 && target.part !== 'window') record(`size:${si}`, target.size, target.size === 'big' ? '🐘' : '🐭');
      si += 1;
      wrongs = 0;
      nudges = 0;
    }
    const last = si >= cur().steps.length;
    setState('busy');
    if (last) snapNext();
    else snap();
    const slot = house.querySelector(`.bd-slot[data-id="${target.id}"]`);
    const g = await kit.flyTo(h('span.bd-piece.bd-fly', { html: shapeSvg(piece.shape, HEX[piece.color]) }), from, center(slot.getBoundingClientRect()));
    kit.removeGhost(g);
    if (e !== kit.epoch) return;
    play('click');
    renderHouse();
    if (!stepDone) {
      // Còn cửa sổ thứ hai của cùng bước.
      setState('part');
      kit.armNudge();
      return;
    }
    await talk([B(partDoneLine(target, cur().steps[si - 1].length))]);
    if (e !== kit.epoch) return;
    if (last) return houseDone(e);
    await ask([stepAsk()], 'part');
  }
  async function houseDone(e) {
    setState('busy');
    seen('house');
    kit.renderTray([]);
    house.classList.add('built');
    smoke.hidden = false;
    restartAnim(house, 'shake');
    play('sparkle');
    renderCustomer('happy');
    restartAnim(custEl, 'hop');
    await wait(500);
    if (e !== kit.epoch) return;
    // Bạn thú đi vào nhà (về phía cửa), rồi ló ra vẫy tay ở cửa sổ (mục 6.1).
    const door = house.querySelector('.bd-slot[data-part="door"]') ?? house;
    const from = center(custEl.getBoundingClientRect());
    const to = center(door.getBoundingClientRect());
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      await custEl.animate([{ translate: '0 0', scale: '1', opacity: 1 }, { translate: `${to.x - from.x}px ${to.y - from.y}px`, scale: '0.3', opacity: 0 }],
        { duration: 700, easing: 'ease-in' }).finished.catch(() => {});
    }
    if (e !== kit.epoch) return;
    custEl.hidden = true;
    showWave();
    play('pop');
    await talk([K(MY_HOUSE_LINE)]);
    if (e !== kit.epoch) return;
    nextCase(e);
  }
  /** Bạn thú vẫy tay ở cửa sổ (cửa sổ đầu tiên; nhà không có cửa sổ thì ô nhỏ trên tường). */
  function showWave() {
    const win = house.querySelector('.bd-slot[data-part="window"]');
    const wall = house.querySelector('.bd-slot[data-part="wall"]');
    const s = stage.getBoundingClientRect();
    const r = win?.getBoundingClientRect();
    const w = wall.getBoundingClientRect();
    const box = r ?? { left: w.left + w.width * 0.12, top: w.top + w.height * 0.12, width: w.width * 0.26, height: w.height * 0.34 };
    wave.innerHTML = patientSvg(customer().id, { mood: 'happy', title: customer().name });
    wave.append(h('span.bd-hand', { text: '👋', 'aria-hidden': 'true' }));
    Object.assign(wave.style, { left: `${box.left - s.left}px`, top: `${box.top - s.top}px`, width: `${box.width}px`, height: `${box.height}px` });
    wave.classList.toggle('no-window', !r);
    wave.hidden = false;
  }

  // Ca B — ổ gà.
  function renderRoad() {
    const c = cur();
    const filled = taken.has('block');
    hole.innerHTML = shapeSvg(c.hole, filled ? HEX.stone : '#495057', { dashed: level <= 1 && !filled });
    hole.classList.toggle('hint', level <= 1);
    hole.dataset.shape = c.hole; // cho test
    car.textContent = '🚗';
    car.classList.remove('go');
    blocks.replaceChildren(...c.blocks.map((b) => h('button.bd-block', {
      type: 'button', 'aria-label': SHAPES[b].name, dataset: { shape: b }, class: filled && b === c.hole ? 'used' : '',
      onclick: () => tapBlock(b),
    }, h('span', { html: shapeSvg(b, HEX.stone) }))));
  }
  async function tapBlock(b) {
    if (state !== 'hole') return;
    const e = kit.epoch;
    const c = cur();
    const el = blocks.querySelector(`[data-shape="${b}"]`);
    if (b !== c.hole) {
      if (!countWrong(`b:${b}`)) return;
      restartAnim(el, 'shake');
      if (wrongs >= 1) restartAnim(blocks.querySelector(`[data-shape="${c.hole}"]`), 'nudge');
      const k = stepKey();
      await talk([B(blockWrongLine(b, c.hole))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (!taken.take('block')) return;
    setState('busy');
    kit.clearNudge();
    snapNext();
    el.classList.add('used');
    const g = await kit.flyTo(h('span.bd-piece.bd-fly', { html: shapeSvg(b, HEX.stone) }), center(el.getBoundingClientRect()), center(hole.getBoundingClientRect()));
    kit.removeGhost(g);
    if (e !== kit.epoch) return;
    play('click');
    renderRoad();
    roadDone(e);
  }
  async function roadDone(e) {
    setState('busy');
    seen(`hole:${cur().hole}`);
    car.classList.add('go');
    play('honk');
    await Promise.all([wait(DRIVE_MS), talk([K(ROAD_THANKS_LINE)])]);
    if (e !== kit.epoch) return;
    nextCase(e);
  }

  // Ca C — sơn nhà (SPEC-jobs4 4.1): sơn chính ngôi nhà ca A. Mức 1 phần đang sơn sáng viền, chọn thùng là cọ tự quét;
  // mức 2–3 chọn thùng (cọ nhúng màu — khóa bước) rồi chạm phần nhà.
  const homeCase = () => plan.cases[0];
  const homePart = (id) => homeCase().parts.find((p) => p.id === id);
  const paintAsk = () => cur().asks[si];
  const dipped = () => taken.has(`dip:${si}`);
  function paintedColor(p) {
    const done = cur().asks.slice(0, si).filter((a) => a.id === p.id).at(-1);
    return done ? done.color : p.color;
  }
  function renderPaint() {
    const c = cur();
    const a = paintAsk();
    let w = 0;
    house.replaceChildren(...homeCase().parts.map((p) => {
      const r = p.part === 'window' ? windowRect(w++, p.size) : SLOT[p.part];
      const el = h('div.bd-slot.done', {
        dataset: { part: p.part, id: p.id, size: p.size },
        class: level <= 1 && a && a.id === p.id ? 'lit' : '',
        style: { left: `${r.left}%`, top: `${r.top}%`, width: `${r.width}%`, height: `${r.height}%`, zIndex: p.part === 'wall' ? 1 : 2 },
      });
      el.innerHTML = shapeSvg(p.shape, HEX[paintedColor(p)], { box: true });
      return el;
    }));
    house.dataset.want = a ? a.id : ''; // cho test; bé không thấy
    paints.replaceChildren(...(a ? bucketsOf(c, si) : []).map((color) => h('button.bd-bucket', {
      type: 'button', 'aria-label': `Thùng sơn ${color}`, dataset: { color }, onclick: () => tapBucket(color),
    }, h('span', { html: bucketSvg(color) }))));
    paints.dataset.want = a?.color ?? '';
    brush.hidden = level <= 1 || !a;
    brush.innerHTML = brushSvg(a && dipped() ? HEX[a.color] : '#fff');
    brush.classList.toggle('dipped', Boolean(a && dipped()));
  }
  function paintPrompt() {
    const a = paintAsk();
    return level <= 1 ? B(paintColorLine(a.color)) : K(paintAskLine(homePart(a.id), a.color, level, si > 0));
  }
  async function startPaint(resume, e) {
    house.classList.remove('built');
    renderPaint();
    if (si >= cur().asks.length) return paintDone(e);
    await ask(resume ? [paintPrompt()] : [K(PAINT_LINE), paintPrompt()], 'paint');
  }
  async function tapBucket(color) {
    if (state !== 'paint' || dipped()) return;
    const e = kit.epoch;
    const a = paintAsk();
    const el = paints.querySelector(`[data-color="${color}"]`);
    if (color !== a.color) {
      if (!countWrong(`k:${si}:${color}`)) return;
      restartAnim(el, 'shake');
      if (wrongs >= 2) restartAnim(paints.querySelector(`[data-color="${a.color}"]`), 'nudge');
      const k = stepKey();
      await talk([B(bucketWrongLine(color, a.color))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (!taken.take(`dip:${si}`)) return;
    kit.clearNudge();
    if (wrongs === 0) record(`paint:${si}`, a.color, COLOR_EMOJI[a.color]);
    play('pop');
    if (level <= 1) return paintPart(a.id, e); // mức 1: cọ tự quét phần đang sáng
    // Bước chọn màu xong: khóa; lần nhầm của bước chọn phần tính lại từ đầu.
    wrongs = 0;
    nudges = 0;
    snap();
    renderPaint();
    kit.armNudge();
  }
  async function tapPaintPart(id) {
    if (state !== 'paint' || level <= 1) return;
    const e = kit.epoch;
    const a = paintAsk();
    const slot = house.querySelector(`.bd-slot[data-id="${id}"]`);
    if (!dipped()) {
      // Cọ chưa có màu: cọ nhún (không tính nhầm).
      restartAnim(brush, 'nudge');
      return;
    }
    if (id !== a.id) {
      if (!countWrong(`q:${si}:${id}`)) return;
      restartAnim(slot, 'shake');
      if (wrongs >= 2) restartAnim(house.querySelector(`.bd-slot[data-id="${a.id}"]`), 'nudge');
      const k = stepKey();
      await talk([B(partWrongLine(homePart(id), homePart(a.id), level))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    const p = homePart(id);
    if (wrongs === 0) {
      seen(`part:${p.part}`);
      if (level >= 3 && p.part === 'window') record(`psize:${si}`, p.size, p.size === 'big' ? '🐘' : '🐭');
    }
    paintPart(id, e);
  }
  async function paintPart(id, e) {
    if (!taken.take(`painted:${si}`)) return;
    setState('busy');
    kit.clearNudge();
    si += 1;
    wrongs = 0;
    nudges = 0;
    const last = si >= cur().asks.length;
    if (last) snapNext();
    else snap();
    play('whoosh');
    renderPaint();
    restartAnim(house.querySelector(`.bd-slot[data-id="${id}"]`), 'bd-swish');
    await wait(450);
    if (e !== kit.epoch) return;
    if (last) return paintDone(e);
    await ask([paintPrompt()], 'paint');
  }
  async function paintDone(e) {
    setState('busy');
    seen('paint');
    paints.replaceChildren();
    brush.hidden = true;
    house.classList.add('built');
    play('sparkle');
    renderCustomer('happy');
    restartAnim(custEl, 'hop');
    await talk([K(PAINT_DONE_LINE)]);
    if (e !== kit.epoch) return;
    nextCase(e);
  }

  // Ca D — xây tháp (SPEC-jobs4 4.2): chạm đống khối, khối chồng lên đỉnh tháp. Mức 3: tiếp mẫu lặp.
  const towerPlaced = () => taken.list().filter((k) => k.startsWith('t:')).length;
  const towerSeq = () => {
    const c = cur();
    const put = Array.from({ length: towerPlaced() }, (_, k) => (c.next ? c.next[k] : c.color));
    return [...(c.base ?? []), ...put];
  };
  function renderTower() {
    const c = cur();
    tower.replaceChildren(...towerSeq().map((color, i) => h('span.bd-tblock', { dataset: { color }, class: i < (c.base?.length ?? 0) ? 'base' : '' }, h('span', { html: blockSvg(color) }))));
    piles.replaceChildren(...c.piles.map((color) => h('button.bd-pile', {
      type: 'button', 'aria-label': `Khối ${color}`, dataset: { color }, onclick: () => tapPile(color),
    }, h('span', { html: blockSvg(color) }), h('span', { html: blockSvg(color) }))));
    const placed = towerPlaced();
    tower.dataset.want = placed < c.n ? towerWant(c, placed) : ''; // cho test; bé không thấy
    tower.classList.toggle('done', placed >= c.n); // cờ 🚩 trên đỉnh (CSS)
  }
  async function startTower(resume, e) {
    tower.classList.remove('done');
    renderTower();
    if (towerPlaced() >= cur().n) return towerDone(e);
    const c = cur();
    const lines = resume ? [B(towerAskLine(c))] : [K(TOWER_LINE), ...(c.next ? [B(patternLine(c.base))] : []), B(towerAskLine(c))];
    await ask(lines, 'tower');
  }
  async function tapPile(color) {
    if (state !== 'tower') return;
    const e = kit.epoch;
    const c = cur();
    const placed = towerPlaced();
    const el = piles.querySelector(`[data-color="${color}"]`);
    if (placed >= c.n) {
      talk([B(ENOUGH_LINE)]); // đủ rồi: không nhận, không tính nhầm
      return;
    }
    const want = towerWant(c, placed);
    if (color !== want) {
      if (!countWrong(`t:${placed}:${color}`)) return;
      restartAnim(el, 'shake');
      if (wrongs >= 2) restartAnim(piles.querySelector(`[data-color="${want}"]`), 'nudge');
      const k = stepKey();
      await talk(c.next ? [B(patternLine(towerSeq())), B(NEXT_LINE)] : [B(blockColorWrongLine(color, want))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (!taken.take(`t:${placed}`)) return;
    kit.clearNudge();
    const n = placed + 1;
    const done = n >= c.n;
    if (c.next && wrongs === 0) record(`tower:${placed}`, color, COLOR_EMOJI[color]);
    if (!c.next && c.piles.length > 1 && done && wrongs === 0) record('tower', color, COLOR_EMOJI[color]);
    if (c.next) wrongs = 0; // mức 3: mỗi khối là một bước
    if (done) setState('busy');
    if (done) snapNext();
    else snap();
    const to = tower.getBoundingClientRect();
    const g = await kit.flyTo(h('span.bd-piece.bd-fly', { html: blockSvg(color) }), center(el.getBoundingClientRect()), { x: to.left + to.width / 2, y: to.top });
    kit.removeGhost(g);
    if (e !== kit.epoch) return;
    play('click');
    renderTower();
    const k = stepKey();
    await talk(c.next ? [B(patternLine(towerSeq())), ...(done ? [] : [B(NEXT_LINE)])] : [B(countLine(n))]);
    if (done) return towerDone(e);
    if (k === stepKey()) kit.armNudge();
  }
  async function towerDone(e) {
    if (e !== kit.epoch) return;
    setState('busy');
    seen('tower');
    tower.classList.add('done');
    play('sparkle');
    renderCustomer('happy');
    restartAnim(custEl, 'hop');
    await talk([K(TOWER_DONE_LINE)]);
    if (e !== kit.epoch) return;
    nextCase(e);
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
      app.setSetting('buildGame', progress).catch(() => {});
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
      setBadge(); // ảnh không có mũ vẽ: đã đội mũ thì hiện huy hiệu 👷
      kit.onCleanup(() => URL.revokeObjectURL(url));
    }
  });

  const s = takeSnap(JOB, { level, continueDirectly: params.continueDirectly });
  if (s) {
    plan = s.plan;
    caseIdx = s.caseIdx;
    recorded = new Set(s.recorded ?? []);
    helmet = s.helmet;
    setBadge();
    if (!helmet) startHelmet();
    else if (caseIdx >= plan.cases.length) {
      caseIdx = plan.cases.length - 1;
      count.textContent = `${plan.cases.length}/${plan.cases.length}`;
      finishRound();
    } else startCase(s);
  } else {
    plan = planRound(level, { shapes2, seen: progress.seen, rounds: progress.rounds });
    caseIdx = 0;
    startHelmet();
  }

  return kit.cleanup;
}
