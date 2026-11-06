// Trò Nông trại (SPEC-jobs3.md mục 4): bác nông dân bên trái; ca A cho thú ăn (mức 3: nghe tiếng kêu, chạm đúng cửa
// chuồng), ca B nhặt trứng (đếm, mức 2 thẻ số, mức 3 theo màu), ca C hái táo (màu, mức 3 màu + cỡ + số). 3 ca → sticker.
// Trạng thái: start → enter → door | feed | eggs | count | pick ⇄ busy → leave → ca sau | done. Khung chung ở jobs/kit.js.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { markPracticed } from '../player/track.js';
import { SOUND_BY_ID } from '../animal-sounds.js';
import { playSoundFile } from './animal-sounds.js';
import { cleanJobState, afterJobRound, afterSeen, claims } from '../jobs/levels.js';
import { JOBS_BG_IMAGES } from '../jobs/backgrounds.js';
import { FARMER_SVG, loadPersonImage } from '../jobs/people.js';
import { farmAnimalSvg } from '../jobs/farm-animals.js';
import { loadJobItemImages, itemFace } from '../jobs/items.js';
import { jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, WRONG_LOCK_MS, MAX_NUDGES } from '../jobs/kit.js';
import {
  MAX_LEVEL, planRound, FOODS, ANIMAL_BY_ID, eggMatches, pickMatches,
  MORNING_LINE, HUNGRY_ASK_LINE, NOT_ME_LINE, YUMMY_LINE, EGGS_INTRO_LINE, HOW_MANY_LINE, ENOUGH_LINE, GOOD_JOB_LINE, CLUCK_LINE,
  hungryLine, foodAskLine, foodWrongLine, foodNamesLine, eggCountLine, eggAskLine, eggWrongLine, cardWrongLine, pickAskLine, pickWrongLine, countLine,
} from '../jobs/farm.js';

const JOB = 'farm';
const ENTER_MS = 650;
const LEAVE_MS = 600;
const ACTIVE = ['door', 'feed', 'eggs', 'count', 'pick'];
const INK = '#3d2c5e';

/** Thức ăn vẽ SVG (viewBox 100 × 100) — hay và grass khác nhau ở dáng: bó buộc dây ↔ cụm cỏ mọc từ đất (mục 4.1). */
export const FOOD_SVG = {
  hay: `<rect x="10" y="30" width="80" height="50" rx="10" fill="#f8d66d" stroke="${INK}" stroke-width="4"/><path d="M18 40 h64 M16 52 h68 M18 64 h64 M20 74 h60" stroke="#e0a800" stroke-width="3"/><path d="M34 30 v50 M66 30 v50" stroke="#a9744a" stroke-width="7"/>`,
  grass: `<ellipse cx="50" cy="82" rx="38" ry="11" fill="#a9744a" stroke="${INK}" stroke-width="4"/><path d="M22 80 Q18 50 30 26 Q32 54 36 80 M36 80 Q38 40 50 12 Q54 46 52 80 M52 80 Q60 44 74 22 Q70 56 66 80 M66 80 Q76 56 84 40 Q82 64 78 80" fill="#51cf66" stroke="#2b8a3e" stroke-width="3" stroke-linejoin="round"/>`,
  carrot: `<path d="M30 30 L76 50 Q60 70 28 92 Q18 60 30 30 Z" fill="#ff922b" stroke="${INK}" stroke-width="4" stroke-linejoin="round" transform="rotate(-20 50 60)"/><path d="M62 26 Q66 6 74 14 M66 30 Q84 14 88 24 M58 30 Q50 10 58 10" stroke="#2b8a3e" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  corn: `<path d="M30 88 Q20 50 40 14 Q46 50 46 88 Z M70 88 Q80 50 60 14 Q54 50 54 88 Z" fill="#69db7c" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="50" cy="48" rx="15" ry="34" fill="#ffd43b" stroke="${INK}" stroke-width="4"/><path d="M38 34 h24 M36 46 h28 M36 58 h28 M38 70 h24 M50 16 v62" stroke="#f59f00" stroke-width="2.5"/>`,
  apple: `<circle cx="50" cy="58" r="32" fill="#ff6b6b" stroke="${INK}" stroke-width="4"/><path d="M50 28 Q48 16 54 10" stroke="#7a5230" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M54 22 Q70 8 78 20 Q66 30 54 22 Z" fill="#51cf66" stroke="${INK}" stroke-width="3"/><circle cx="38" cy="48" r="6" fill="#fff" opacity="0.6"/>`,
  seeds: `<path d="M24 36 Q50 26 76 36 L82 86 Q50 96 18 86 Z" fill="#e9d8a6" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M30 36 Q50 18 70 36" fill="none" stroke="#a9744a" stroke-width="5"/><g fill="#a9744a"><ellipse cx="36" cy="58" rx="4" ry="6"/><ellipse cx="50" cy="66" rx="4" ry="6"/><ellipse cx="64" cy="56" rx="4" ry="6"/><ellipse cx="42" cy="76" rx="4" ry="6"/><ellipse cx="60" cy="76" rx="4" ry="6"/></g>`,
};
const foodSvg = (id) => `<svg viewBox="0 0 100 100" aria-hidden="true">${FOOD_SVG[id]}</svg>`;
const EGG_HEX = { white: '#fff', brown: '#d9a066' };
const eggSvg = (color) => `<svg viewBox="0 0 60 76" aria-hidden="true"><ellipse cx="30" cy="42" rx="24" ry="31" fill="${EGG_HEX[color]}" stroke="${INK}" stroke-width="4"/><ellipse cx="22" cy="30" rx="5" ry="8" fill="#fff" opacity="0.6"/></svg>`;
const APPLE_HEX = { red: '#ff6b6b', green: '#8ce99a', yellow: '#ffd43b' };
const appleSvg = (color) => `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="58" r="34" fill="${APPLE_HEX[color]}" stroke="${INK}" stroke-width="4"/><path d="M50 26 Q48 14 54 8" stroke="#7a5230" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M54 20 Q70 6 78 18 Q66 28 54 20 Z" fill="#51cf66" stroke="${INK}" stroke-width="3"/><circle cx="38" cy="46" r="6" fill="#fff" opacity="0.6"/></svg>`;
const BARN_SVG = `<svg viewBox="0 0 300 220" aria-hidden="true" preserveAspectRatio="none"><path d="M20 90 L150 14 L280 90 V216 H20 Z" fill="#e03131" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><path d="M8 96 L150 8 L292 96" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 216 H280" stroke="${INK}" stroke-width="6"/><rect x="128" y="54" width="44" height="30" rx="4" fill="#ffe8cc" stroke="${INK}" stroke-width="4"/></svg>`;
const TREE_SVG = `<svg viewBox="0 0 300 300" aria-hidden="true" preserveAspectRatio="none"><rect x="128" y="170" width="44" height="130" rx="10" fill="#a9744a" stroke="${INK}" stroke-width="5"/><path d="M40 160 C0 120 40 40 100 50 C120 0 210 0 220 50 C290 40 310 140 260 170 C240 210 60 210 40 160 Z" fill="#69db7c" stroke="#2b8a3e" stroke-width="6" stroke-linejoin="round"/></svg>`;
/** Chỗ quả táo trên tán cây (phần trăm của khung cây). */
const APPLE_SPOTS = [[24, 34], [50, 20], [76, 34], [36, 56], [64, 56]];
const BASKET_SVG = `<svg viewBox="0 0 120 100" aria-hidden="true"><path d="M30 40 Q60 -6 90 40" fill="none" stroke="#7a5230" stroke-width="7" stroke-linecap="round"/><path d="M8 40 H112 L100 94 H20 Z" fill="#d9a066" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M14 56 H106 M18 74 H102 M40 40 L44 94 M60 40 V94 M80 40 L76 94" stroke="#a9744a" stroke-width="4"/></svg>`;
const COLOR_EMOJI = { red: '🔴', green: '🟢', yellow: '🟡' };

export function farmScreen(app, params = {}) {
  let progress = cleanJobState(app.settings.farmGame, { maxLevel: MAX_LEVEL });
  const level = progress.level;
  let plan = null;
  let caseIdx = 0;
  let state = 'start';
  let wrongs = 0;
  let nudges = 0;
  let taken = claims(); // trứng / quả đã nhận, gà đã đứng (`hen:…`), cửa đã mở đúng (`door`) — SPEC-jobs3 mục 2.3
  let recorded = new Set();
  let shown = false; // bong bóng thức ăn (mức 2–3) đã hiện sau lần nhầm / nhắc đầu
  let lastWrong = { key: '', at: 0 };
  let pics = null; // ảnh thức ăn của bố mẹ (Góc bố mẹ → Ảnh Đóng vai); chưa có thì hình vẽ sẵn

  const cur = () => plan?.cases[caseIdx];
  const foodFace = (id, tag) => itemFace(pics, id, tag, { html: foodSvg(id) });
  const animalFace = (id, mood, tag, title = '') => itemFace(pics, `${id}-${mood}`, tag, { html: farmAnimalSvg(id, mood, title) });
  const F = (line) => ({ who: 'farmer', line });
  const A = (line) => ({ who: 'animal', line });

  const animalEl = h('div.fm-animal', { 'aria-hidden': 'true' });
  const wish = h('div.fm-wish', { hidden: true, 'aria-hidden': 'true' });
  const barn = h('div.fm-barn', {}, h('span.fm-barn-art', { html: BARN_SVG }));
  const doors = h('div.fm-doors');
  barn.append(doors);
  const nests = h('div.fm-nests');
  const cards = h('div.fm-cards', { hidden: true });
  const tree = h('div.fm-tree', {}, h('span.fm-tree-art', { html: TREE_SVG }));
  const basket = h('div.fm-basket', { 'aria-hidden': 'true' }, h('span.fm-basket-in'), h('span.fm-basket-face', { html: BASKET_SVG }));
  const basketIn = basket.firstElementChild;

  const kit = jobScreen(app, {
    job: JOB, background: { lessonId: JOBS_BG_IMAGES, word: JOB }, className: 'fm-play', stageClass: 'fm-stage', title: '👩‍🌾 Farm',
    helperLabel: 'Nghe lại', cap: 'farm', resetLabel: 'Chơi lại', trayLabel: 'Thức ăn',
    host: { svg: FARMER_SVG, label: 'farmer' },
    roles: {
      of: (who) => (who === 'farmer' ? kit.host : who === 'animal' ? animalEl : who === 'peek' ? doors.querySelector('.fm-door.peek') : null),
      all: () => [kit.host, animalEl].filter((el) => !el.closest('[hidden]')),
      dim: (el) => el !== animalEl || state !== 'feed', // lúc cho ăn bé cần thả đồ vào con vật: không làm mờ
    },
    icon: (who) => (who === 'farmer' ? '👩‍🌾' : who === 'hen' ? '🐔' : ANIMAL_BY_ID.get(who === 'peek' ? doors.querySelector('.fm-door.peek')?.dataset.animal : cur()?.animal)?.emoji ?? '🐾'),
    onTalk: (who) => animalEl.classList.toggle('talking', who === 'animal'),
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
      face: (id) => foodFace(id, 'span.fm-food'),
      label: (id) => FOODS[id].name,
      canGive: () => state === 'feed',
      dropOk: (x, y) => {
        const r = animalEl.getBoundingClientRect();
        return x >= r.left - 20 && x <= r.right + 20 && y >= r.top - 20 && y <= r.bottom + 20;
      },
      give: (id, from) => giveFood(id, from),
    },
  });
  const { stage, count, talk } = kit;
  stage.append(barn, animalEl, wish, nests, cards, tree, basket);
  const stepKey = () => `${kit.epoch}:${caseIdx}:${state}:${taken.list().length}`;

  function setState(s) {
    state = s;
    kit.setState(s, s === 'feed');
    app.root.dataset.case = cur()?.kind ?? '';
  }
  const snap = (extra = {}) => saveSnap(JOB, {
    level, plan, caseIdx, wrongs, nudges, taken: taken.list(), recorded: [...recorded], shown, ...extra,
  });
  /** Một lần nhầm (gộp chạm nhầm cùng chỗ trong 0,4 giây). Trả về false nếu bị gộp. */
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
  /** Ghi "đã gặp" một lần mỗi ca (tập `recorded` giữ qua ra nền / 🧹). */
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
  /** Tiếng con vật: file tiếng thật (Ai kêu thế?), không phát được thì con vật nói tiếng kêu. */
  async function animalSound(id, who = 'animal') {
    const e = kit.epoch;
    const ok = await playSoundFile(SOUND_BY_ID.get(id), { isCurrent: () => e === kit.epoch }).catch(() => false);
    if (!ok && e === kit.epoch) await talk([{ who, line: [ANIMAL_BY_ID.get(id).says, ''] }]);
  }

  // ---------- Câu hỏi của bước đang làm (nghe lại / nhắc) ----------
  function promptLines(short = false) {
    const c = cur();
    if (!c) return [];
    if (state === 'door') return [F(HUNGRY_ASK_LINE)];
    if (state === 'feed') return short ? [A(foodAskLine(c.animal))] : [F(hungryLine(c.animal)), A(foodAskLine(c.animal))];
    if (state === 'eggs') return [F(c.ask ? eggAskLine(c.ask) : EGGS_INTRO_LINE)];
    if (state === 'count') return [F(HOW_MANY_LINE)];
    if (state === 'pick') return [F(pickAskLine(c.ask))];
    return [];
  }
  function nudgeTarget() {
    const c = cur();
    if (state === 'door') restartAnim(doors.querySelector(`[data-animal="${c.animal}"]`), 'nudge');
    else if (state === 'feed') {
      showWish();
      kit.setHint(ANIMAL_BY_ID.get(c.animal).food);
    } else if (state === 'eggs') {
      const hen = nests.querySelector('.fm-hen:not(.up)');
      const egg = [...nests.querySelectorAll('.fm-hen.up ~ .fm-eggs .fm-egg:not(.taken)')].find((el) => !c.ask || el.dataset.color === c.ask.color);
      restartAnim(egg ?? hen, 'nudge');
    } else if (state === 'count') restartAnim(cards.querySelector(`[data-n="${c.total}"]`), 'nudge');
    else if (state === 'pick') restartAnim(tree.querySelector('.fm-apple.match:not(.taken)'), 'nudge');
  }

  // ---------- Vẽ ----------
  function showScene(kind) {
    stage.dataset.scene = kind;
    animalEl.hidden = kind !== 'feed';
    barn.hidden = kind !== 'feed';
    nests.hidden = kind !== 'eggs';
    cards.hidden = true;
    tree.hidden = kind !== 'pick';
    basket.hidden = kind === 'feed';
    wish.hidden = true;
    basketIn.replaceChildren();
    count.textContent = `${caseIdx + 1}/${plan.cases.length}`;
  }
  function showWish() {
    const c = cur();
    if (c?.kind !== 'feed') return;
    if (!shown && level >= 2) {
      shown = true;
      snap();
    }
    wish.replaceChildren(foodFace(ANIMAL_BY_ID.get(c.animal).food, 'span.fm-wish-food'));
    wish.hidden = false;
  }
  function renderAnimal(id, mood = 'hungry') {
    const a = ANIMAL_BY_ID.get(id);
    animalEl.replaceChildren(animalFace(id, mood, 'span.fm-animal-face', a.name), ...(mood === 'hungry' ? [h('span.fm-tummy', { text: '💭' })] : []));
    animalEl.dataset.animal = id;
    animalEl.dataset.mood = mood;
  }
  function renderDoors(c, open = false) {
    doors.replaceChildren(...(c.doors ?? []).map((id) => h('button.fm-door', {
      type: 'button', 'aria-label': 'Cửa chuồng', dataset: { animal: id },
      onclick: () => tapDoor(id),
    }, animalFace(id, 'hungry', 'span.fm-door-peek'))));
    doors.hidden = !c.doors || open;
    doors.dataset.target = c.animal ?? ''; // cho test; bé không thấy
    barn.classList.toggle('closed', Boolean(c.doors) && !open);
  }

  // ---------- Ca ----------
  async function startCase(resume = null) {
    const e = kit.epoch;
    const c = cur();
    wrongs = resume?.wrongs ?? 0;
    nudges = resume?.nudges ?? 0;
    taken = claims(resume?.taken ?? []);
    shown = resume?.shown ?? false;
    kit.renderTray([]);
    setState('enter');
    showScene(c.kind);
    snap();
    if (c.kind === 'feed') return startFeed(resume, e);
    if (c.kind === 'eggs') return startEggs(resume, e);
    return startPick(resume, e);
  }

  // Ca A — cho thú ăn.
  async function startFeed(resume, e) {
    const c = cur();
    const doorDone = !c.doors || taken.has('door');
    renderDoors(c, doorDone);
    animalEl.hidden = !doorDone;
    if (doorDone) {
      renderAnimal(c.animal);
      if (!resume) {
        restartAnim(animalEl, 'enter');
        await wait(ENTER_MS);
        if (e !== kit.epoch) return;
        await animalSound(c.animal);
        if (e !== kit.epoch) return;
      }
      return askFood(e);
    }
    // Mức 3: ba cửa chuồng đóng, chỉ nghe tiếng kêu.
    setState('door');
    snap();
    await talk([F(HUNGRY_ASK_LINE)]);
    if (e !== kit.epoch) return;
    await animalSound(c.animal, 'farmer');
    if (e === kit.epoch && state === 'door') kit.armNudge();
  }
  async function askFood(e) {
    const c = cur();
    if (level <= 1 || shown) showWish();
    kit.renderTray(c.tray);
    // Thức ăn là từ mới (mục 4.1): lần đầu gặp trong lượt, bác nông dân đọc tên khi đồ hiện ở khay.
    const fresh = c.tray.filter((f) => !recorded.has(`intro:${f}`));
    fresh.forEach((f) => recorded.add(`intro:${f}`));
    setState('feed');
    snap();
    for (const f of fresh) restartAnim(kit.trayItem(f), 'nudge');
    await talk([F(hungryLine(c.animal)), ...(fresh.length ? [F(foodNamesLine(fresh))] : []), A(foodAskLine(c.animal))]);
    if (e === kit.epoch && state === 'feed') kit.armNudge();
  }
  async function tapDoor(id) {
    if (state !== 'door') return;
    const e = kit.epoch;
    const c = cur();
    const door = doors.querySelector(`[data-animal="${id}"]`);
    if (id !== c.animal) {
      if (!countWrong(`d:${id}`)) return;
      for (const d of doors.children) d.classList.remove('peek');
      door.classList.add('peek');
      if (wrongs >= 2) restartAnim(doors.querySelector(`[data-animal="${c.animal}"]`), 'nudge');
      const k = stepKey();
      await animalSound(id, 'peek');
      if (k !== stepKey()) return;
      await talk([{ who: 'peek', line: NOT_ME_LINE }]);
      door.classList.remove('peek');
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (!taken.take('door')) return;
    setState('busy');
    kit.clearNudge();
    wrongs = 0;
    nudges = 0;
    snap();
    play('whoosh');
    door.classList.add('open');
    await wait(400);
    if (e !== kit.epoch) return;
    renderDoors(c, true);
    renderAnimal(c.animal);
    animalEl.hidden = false;
    restartAnim(animalEl, 'enter');
    await wait(ENTER_MS);
    if (e !== kit.epoch) return;
    askFood(e);
  }
  async function giveFood(id, from) {
    if (state !== 'feed') return;
    const e = kit.epoch;
    const c = cur();
    const food = ANIMAL_BY_ID.get(c.animal).food;
    if (id !== food) {
      if (!countWrong(`f:${id}`)) return;
      restartAnim(animalEl, 'shake');
      showWish(); // tên thức ăn có trong câu: bong bóng + món đúng nhún ngay sau lần nhầm đầu
      kit.setHint(food);
      const k = stepKey();
      await talk([A(foodWrongLine(c.animal, id))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (!taken.take(`food:${id}`)) return;
    setState('busy');
    kit.clearNudge();
    kit.setHint(null);
    if (wrongs === 0 && ANIMAL_BY_ID.get(c.animal).lesson) record('animal', c.animal, ANIMAL_BY_ID.get(c.animal).emoji);
    seen(c.animal);
    seen(food);
    saveSnap(JOB, { level, plan, caseIdx: caseIdx + 1, wrongs: 0, nudges: 0, taken: [], recorded: [...recorded], shown: false });
    kit.renderTray(c.tray.filter((f) => f !== id));
    const g = await kit.flyTo(foodFace(id, 'span.fm-food.fm-fly'), from, center(animalEl.getBoundingClientRect()));
    kit.removeGhost(g);
    if (e !== kit.epoch) return;
    wish.hidden = true;
    play('munch');
    renderAnimal(c.animal, 'happy');
    restartAnim(animalEl, 'hop');
    await talk([A(YUMMY_LINE)]);
    if (e !== kit.epoch) return;
    nextCase(e, animalEl);
  }

  // Ca B — nhặt trứng.
  async function startEggs(resume, e) {
    const c = cur();
    nests.replaceChildren(...c.hens.map((hen) => {
      const up = taken.has(`hen:${hen.id}`);
      return h('div.fm-nest', { dataset: { hen: hen.id } },
        h('button.fm-hen', { type: 'button', 'aria-label': 'Con gà mái', class: up ? 'up' : '', onclick: () => tapHen(hen.id) }, animalFace('chicken', 'happy', 'span.fm-hen-art')),
        h('div.fm-eggs', {}, ...hen.eggs.map((egg) => h('button.fm-egg', {
          type: 'button', 'aria-label': `${egg.color} egg`, dataset: { id: egg.id, color: egg.color },
          class: taken.has(egg.id) ? 'taken' : '',
          onclick: () => tapEgg(egg.id),
        }, h('span', { html: eggSvg(egg.color) })))),
        h('span.fm-straw', { 'aria-hidden': 'true' }));
    }));
    for (const hen of c.hens) if (taken.has(`hen:${hen.id}`)) nests.querySelector(`[data-hen="${hen.id}"] .fm-hen`).classList.add('up');
    const inBasket = c.hens.flatMap((x) => x.eggs).filter((egg) => taken.has(egg.id));
    basketIn.replaceChildren(...inBasket.map((egg) => h('span.fm-in', { html: eggSvg(egg.color) })));
    nests.dataset.ask = c.ask?.color ?? '';
    if (eggsDone()) return askCount(e, resume);
    setState('eggs');
    snap();
    if (!resume) play('pop');
    await talk([F(c.ask ? eggAskLine(c.ask) : EGGS_INTRO_LINE)]);
    if (e === kit.epoch && state === 'eggs') kit.armNudge();
  }
  const eggsTaken = () => cur().hens.flatMap((x) => x.eggs).filter((egg) => taken.has(egg.id)).length;
  const eggsDone = () => eggsTaken() >= (cur().ask ? cur().ask.count : cur().total);
  async function tapHen(id) {
    if (state !== 'eggs') return;
    const el = nests.querySelector(`[data-hen="${id}"] .fm-hen`);
    // Chạm gà: gà đứng dậy, lộ trứng (khám phá — không tính nhầm, không tính thao tác con).
    if (!taken.take(`hen:${id}`)) {
      play('pop');
      restartAnim(el, 'hop');
      return;
    }
    snap();
    play('pop');
    el.classList.add('up');
    talk([{ who: 'hen', line: CLUCK_LINE }]);
  }
  async function tapEgg(id) {
    if (state !== 'eggs') return;
    const e = kit.epoch;
    const c = cur();
    const egg = c.hens.flatMap((x) => x.eggs).find((x) => x.id === id);
    const el = nests.querySelector(`.fm-egg[data-id="${id}"]`);
    if (taken.has(id) || !el) return;
    if (c.ask && egg.color !== c.ask.color) {
      if (!countWrong(`e:${id}`)) return;
      restartAnim(el, 'shake');
      if (wrongs >= 2) restartAnim(nests.querySelector(`.fm-egg[data-color="${c.ask.color}"]:not(.taken)`), 'nudge');
      const k = stepKey();
      await talk([F(eggWrongLine(c.ask, egg.color))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (eggsDone()) {
      // Đủ số rồi: trứng đúng màu còn lại không nhận nữa (không tính nhầm).
      talk([F(ENOUGH_LINE)]);
      return;
    }
    if (!taken.take(id)) return;
    kit.clearNudge();
    const n = eggsTaken();
    const done = eggsDone();
    snap();
    el.classList.add('taken');
    play('pop');
    const g = await kit.flyTo(h('span.fm-fly-egg', { html: eggSvg(egg.color) }), center(el.getBoundingClientRect()), center(basket.getBoundingClientRect()));
    kit.removeGhost(g);
    basketIn.append(h('span.fm-in', { html: eggSvg(egg.color) }));
    if (e !== kit.epoch) return;
    if (!done) {
      const k = stepKey();
      await talk([F(eggCountLine(n))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    setState('busy');
    await talk([F(eggCountLine(n))]);
    if (e !== kit.epoch) return;
    askCount(e);
  }
  async function askCount(e, resume = null) {
    const c = cur();
    if (!c.cards) return eggsFinished(e);
    cards.replaceChildren(...c.cards.map((n) => h('button.fm-card', {
      type: 'button', 'aria-label': String(n), dataset: { n: String(n) }, text: String(n),
      onclick: () => tapCard(n),
    })));
    cards.hidden = false;
    if (resume?.wrongs == null) wrongs = 0;
    setState('count');
    snap();
    await talk([F(HOW_MANY_LINE)]);
    if (e === kit.epoch && state === 'count') kit.armNudge();
  }
  async function tapCard(n) {
    if (state !== 'count') return;
    const e = kit.epoch;
    const c = cur();
    const el = cards.querySelector(`[data-n="${n}"]`);
    if (n !== c.total) {
      if (!countWrong(`c:${n}`)) return;
      restartAnim(el, 'shake');
      if (wrongs >= 2) restartAnim(cards.querySelector(`[data-n="${c.total}"]`), 'nudge');
      const k = stepKey();
      await talk([F(cardWrongLine(n))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (!taken.take('card')) return;
    setState('busy');
    kit.clearNudge();
    el.classList.add('right');
    play('ding');
    await talk([F(eggCountLine(n))]);
    if (e !== kit.epoch) return;
    eggsFinished(e);
  }
  async function eggsFinished(e) {
    setState('busy');
    if (wrongs === 0) record('egg', 'egg', '🥚');
    seen('eggs');
    saveSnap(JOB, { level, plan, caseIdx: caseIdx + 1, wrongs: 0, nudges: 0, taken: [], recorded: [...recorded], shown: false });
    play('sparkle');
    await talk([F(GOOD_JOB_LINE)]);
    if (e !== kit.epoch) return;
    nextCase(e, nests);
  }

  // Ca C — hái táo.
  async function startPick(resume, e) {
    const c = cur();
    const match = new Set(pickMatches(c).map((a) => a.id));
    tree.querySelector('.fm-apples')?.remove();
    tree.append(h('div.fm-apples', {}, ...c.apples.map((a, i) => {
      const [left, top] = APPLE_SPOTS[i];
      return h('button.fm-apple', {
        type: 'button', 'aria-label': `${a.size} ${a.color} apple`,
        class: `${a.size}${match.has(a.id) ? ' match' : ''}${taken.has(a.id) ? ' taken' : ''}`,
        dataset: { id: a.id, color: a.color, size: a.size }, style: { left: `${left}%`, top: `${top}%` },
        onclick: () => tapApple(a.id),
      }, h('span', { html: appleSvg(a.color) }));
    })));
    basketIn.replaceChildren(...c.apples.filter((a) => taken.has(a.id)).map((a) => h('span.fm-in', { html: appleSvg(a.color) })));
    setState('pick');
    snap();
    await talk([F(pickAskLine(c.ask))]);
    if (e === kit.epoch && state === 'pick') kit.armNudge();
  }
  async function tapApple(id) {
    if (state !== 'pick') return;
    const e = kit.epoch;
    const c = cur();
    const a = c.apples.find((x) => x.id === id);
    const el = tree.querySelector(`.fm-apple[data-id="${id}"]`);
    if (taken.has(id)) return;
    if (!pickMatches(c).some((x) => x.id === id)) {
      if (!countWrong(`a:${id}`)) return;
      restartAnim(el, 'shake');
      if (wrongs >= 2) restartAnim(tree.querySelector('.fm-apple.match:not(.taken)'), 'nudge');
      const k = stepKey();
      await talk([F(pickWrongLine(c.ask, a))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (!taken.take(id)) return;
    kit.clearNudge();
    const n = pickMatches(c).filter((x) => taken.has(x.id)).length;
    const done = n >= c.ask.count;
    if (done) {
      setState('busy');
      if (wrongs === 0) record('color', c.ask.color, COLOR_EMOJI[c.ask.color]);
      seen(`apple:${c.ask.color}`);
      saveSnap(JOB, { level, plan, caseIdx: caseIdx + 1, wrongs: 0, nudges: 0, taken: [], recorded: [...recorded], shown: false });
    } else snap();
    el.classList.add('taken');
    play('pop');
    const g = await kit.flyTo(h('span.fm-fly-apple', { html: appleSvg(a.color) }), center(el.getBoundingClientRect()), center(basket.getBoundingClientRect()));
    kit.removeGhost(g);
    basketIn.append(h('span.fm-in', { html: appleSvg(a.color) }));
    if (e !== kit.epoch) return;
    const k = stepKey();
    await talk([F(countLine(n))]);
    if (!done) {
      if (k === stepKey()) kit.armNudge();
      return;
    }
    if (e !== kit.epoch) return;
    play('sparkle');
    await talk([F(GOOD_JOB_LINE)]);
    if (e !== kit.epoch) return;
    nextCase(e, tree);
  }

  async function nextCase(e, el) {
    setState('leave');
    restartAnim(el, 'leave');
    await wait(LEAVE_MS);
    if (e !== kit.epoch) return;
    el.classList.remove('leave');
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
      app.setSetting('farmGame', progress).catch(() => {});
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
    talk(promptLines(true)).then(() => k === stepKey() && kit.armNudge());
  }

  loadPersonImage(app, JOB).then((url) => {
    if (!url) return;
    if (kit.signal.aborted) URL.revokeObjectURL(url);
    else {
      kit.setHostImage(url);
      kit.onCleanup(() => URL.revokeObjectURL(url));
    }
  });

  async function begin() {
    const e = kit.epoch;
    setState('start');
    showScene('feed');
    animalEl.hidden = true;
    renderDoors({ doors: null });
    playSoundFile(SOUND_BY_ID.get('chicken'), { isCurrent: () => e === kit.epoch }).catch(() => {});
    await talk([F(MORNING_LINE)]);
    if (e !== kit.epoch) return;
    startCase();
  }

  const s = takeSnap(JOB, { level, continueDirectly: params.continueDirectly });
  // Nạp ảnh thức ăn trước khi dựng khay, để món không đổi từ hình vẽ sang ảnh giữa chừng.
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
      if (caseIdx >= plan.cases.length) {
        caseIdx = plan.cases.length - 1;
        count.textContent = `${plan.cases.length}/${plan.cases.length}`;
        finishRound();
      } else startCase(s);
    } else {
      plan = planRound(level, { seen: progress.seen });
      caseIdx = 0;
      begin();
    }
  });

  return kit.cleanup;
}
