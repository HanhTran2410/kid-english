// Trò Bưu tá (SPEC-jobs.md mục 4): Bông đưa thư "This letter is for the red house!", bé kéo thư vào đúng nhà
// (hoặc chạm nhà). Đúng: cửa mở, bạn thú cảm ơn; nhầm: bạn thú trong nhà đó nói "Not for me!", thư về túi (giữ thư cũ).
// SPEC-jobs2 PO1: mở đầu lượt dán tem lên 3 lá thư; một trong 5 thư là bưu kiện — tới nhà gõ cửa, (mức 3) trả lời bạn
// thú đoán đồ, mở hộp. 5 thư → sticker. Trạng thái: stamp ⇄ busy → deliver ⇄ busy → (knock → guess → open) → thư sau | done.
// Khung chung ở jobs/kit.js.

import { h } from '../ui.js';
import { latestImageForWord, mediaBlob, listLessons } from '../db.js';
import { play } from '../speech/sfx.js';
import { markPracticed } from '../player/track.js';
import { isWordLesson } from '../phrase.js';
import { progressKey } from '../progress.js';
import { patientSvg } from '../patients.js';
import { PATIENT_BY_ID, STICKER_COLORS, stickerId } from '../doctor.js';
import { cleanJobState, afterJobRound } from '../jobs/levels.js';
import { JOBS_BG_IMAGES } from '../jobs/backgrounds.js';
import { jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, WRONG_LOCK_MS, MAX_NUDGES } from '../jobs/kit.js';
import {
  MAX_LEVEL, COLOR_BY_ID, planRound, letterLine, wrongLine, THANKS_LINE, DRAG_LINE,
  matchesStamp, STAMP_START_LINE, STAMP_PICK_LINE, stampLine, stampWantLine, stampWrongLine, READY_LINE,
  parcelLine, KNOCK_ASK_LINE, KNOCK_LINE, WHATS_INSIDE_LINE, guessLine, YES_LOOK_LINE, NO_LOOK_LINE, LOOK_PICTURE_LINE,
  OPEN_ASK_LINE, itsLine, parcelThanksLine,
} from '../jobs/post.js';

const JOB = 'post';
const DOOR_MS = 700; // cửa mở cho bạn thú ló ra
const SAY_BACK_MS = 2000; // "It's a ball!": chờ bé nói theo
const ACTIVE = ['deliver', 'stamp', 'knock', 'guess', 'open'];
const INK = '#3d2c5e';
const STAMP_HEX = new Map(STICKER_COLORS.map((c) => [c.id, c.hex]));

/** Đầu bạn thú (cắt từ hình cả người) để ló ra cửa / cửa sổ. */
const headSvg = (id) => patientSvg(id, { mood: 'happy' }).replace('viewBox="0 0 240 300"', 'viewBox="30 0 180 170"');

/** Tem (SVG): khung răng cưa trắng + hình màu ở giữa. */
function stampSvg(st) {
  const fill = STAMP_HEX.get(st.color);
  const body = {
    star: `<path d="M20 7 L24 16 L34 16.5 L26.5 23 L29 33 L20 27.5 L11 33 L13.5 23 L6 16.5 L16 16 Z" fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`,
    heart: `<path d="M20 32 C10 25 6 19 6 14 C6 9.5 9.5 7 13 7 C16 7 18.5 8.8 20 11.5 C21.5 8.8 24 7 27 7 C30.5 7 34 9.5 34 14 C34 19 30 25 20 32 Z" fill="${fill}" stroke="${INK}" stroke-width="2"/>`,
    circle: `<circle cx="20" cy="20" r="12" fill="${fill}" stroke="${INK}" stroke-width="2"/>`,
    square: `<rect x="9" y="9" width="22" height="22" rx="3" fill="${fill}" stroke="${INK}" stroke-width="2"/>`,
  }[st.shape];
  return `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="1.5" y="1.5" width="37" height="37" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.5" stroke-dasharray="3 2"/>${body}</svg>`;
}

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
  let plan = null; // { street, letters, stamps }
  let phase = 'letters'; // stamp | letters | visit
  let stampIdx = 0; // dán tem: lá thư thứ mấy
  let visit = 'knock'; // giao bưu kiện: knock | guess | open
  let idx = 0;
  let wrongs = 0;
  let nudges = 0;
  let state = 'start';
  let lastWrong = { key: '', at: 0 };
  let recorded = new Set();
  let itemUrl = null; // ảnh bài học của đồ trong hộp (nếu có)

  const letter = () => plan?.letters[idx];
  const parcel = () => letter()?.parcel ?? null;
  const target = () => plan?.street[letter()?.house];
  const stampCase = () => plan?.stamps?.[stampIdx];
  const R = (resident, line) => ({ who: `r:${resident}`, line });
  const B = (line) => ({ who: 'bong', line });
  const stampById = (id) => stampCase()?.set.find((st) => stickerId(st) === id);

  const street = h('div.ps-street');
  // Bàn dán tem: 3 phong bì, tem dán vào góc phải trên.
  const desk = h('div.ps-desk', { hidden: true });
  // Cảnh tới nhà giao bưu kiện: cửa lớn (bạn thú sau cửa), hộp có hình đồ bên trong, 👍 / 👎 (mức 3).
  const visitDoor = h('button.ps-big-door', { type: 'button', 'aria-label': 'Cửa nhà', onclick: () => knock() }, h('span.ps-knob'));
  const visitWho = h('div.ps-visitor', { 'aria-hidden': 'true' });
  const visitBox = h('button.ps-box', { type: 'button', 'aria-label': 'Bưu kiện', onclick: () => openBox() },
    h('span.ps-box-body', { text: '📦' }), h('span.ps-box-label'));
  const visitItem = h('div.ps-item', { hidden: true, 'aria-hidden': 'true' });
  const thumbUp = h('button.ps-thumb', { type: 'button', 'aria-label': 'Đúng', text: '👍', onclick: () => answerGuess(true) });
  const thumbDown = h('button.ps-thumb', { type: 'button', 'aria-label': 'Sai', text: '👎', onclick: () => answerGuess(false) });
  const thumbs = h('div.ps-thumbs', { hidden: true }, thumbUp, thumbDown);
  const visitEl = h('div.ps-visit', { hidden: true },
    h('div.ps-front', {}, visitWho, visitDoor), visitBox, visitItem, thumbs);

  const kit = jobScreen(app, {
    job: JOB, background: { lessonId: JOBS_BG_IMAGES, word: JOB }, className: 'ps-play', stageClass: 'ps-stage', title: '📮 Postman', helperLabel: 'Bông bưu tá', cap: 'post',
    resetLabel: 'Đưa lại', trayLabel: 'Túi thư',
    icon: (who) => (who?.startsWith('r:') ? PATIENT_BY_ID.get(who.slice(2))?.emoji ?? '' : '🐰'),
    pitch: (who) => (who?.startsWith('r:') ? PATIENT_BY_ID.get(who.slice(2))?.pitch : undefined),
    onReset: () => restart(),
    onHelper: () => repeatPrompt(),
    nudge: {
      ready: () => ACTIVE.includes(state) && nudges < MAX_NUDGES,
      key: () => stepKey(),
      fire: (rearm) => {
        nudges += 1;
        snap();
        if (state === 'deliver') restartAnim(houseEl(letter().house), 'nudge');
        else if (state === 'stamp') {
          const want = stampCase().want;
          for (const st of stampCase().set) if (matchesStamp(st, want)) restartAnim(kit.trayItem(stickerId(st)), 'nudge');
        } else if (state === 'knock') restartAnim(visitDoor, 'nudge');
        else if (state === 'open') restartAnim(visitBox, 'nudge');
        else if (state === 'guess') restartAnim(visitBox, 'nudge');
        kit.talk(promptLines()).then(rearm);
      },
    },
    tray: {
      face: (id) => (id === 'letter' || id === 'parcel'
        ? h('span.dr-item-face.ps-letter', { text: id === 'parcel' ? '📦' : '✉️', 'aria-hidden': 'true' })
        : h('span.dr-item-face.ps-stamp', { html: stampSvg(stampById(id) ?? { shape: 'circle', color: 'red' }) })),
      label: (id) => (id === 'letter' ? 'Lá thư' : id === 'parcel' ? 'Bưu kiện' : (() => { const st = stampById(id); return st ? `${st.color} ${st.shape} stamp` : id; })()),
      canGive: () => state === 'deliver' || state === 'stamp',
      dropOk: () => true,
      give: (id, at) => {
        if (state === 'stamp') {
          stamp(id, at);
          return;
        }
        const i = houseAt(at.x, at.y);
        if (i == null) repeatPrompt(); // chạm thư (không kéo vào nhà): Bông nói lại địa chỉ
        else deliver(i, at);
      },
    },
  });
  const { stage, count, talk } = kit;
  stage.append(h('div.ps-sky', { 'aria-hidden': 'true' }, h('span.ps-sun'), h('span.ps-cloud')), street, desk, visitEl);
  const stepKey = () => `${kit.epoch}:${phase}:${stampIdx}:${idx}:${state}`;
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
    kit.setState(s, s === 'deliver' || s === 'stamp');
  }
  const snap = () => saveSnap(JOB, { level, plan, phase, stampIdx, visit, idx, wrongs, nudges, recorded: [...recorded] });

  /** Câu của bước đang chờ bé (nhắc, chạm Bông). */
  function promptLines() {
    if (state === 'stamp') return [B(stampCase().want ? stampWantLine(stampCase().want) : STAMP_PICK_LINE)];
    if (state === 'knock') return [B(KNOCK_ASK_LINE)];
    if (state === 'guess') return [R(target().resident, guessLine(parcel().guess))];
    if (state === 'open') return [B(OPEN_ASK_LINE)];
    return [B(parcel() ? parcelLine(target(), letter().kind) : letterLine(target(), letter().kind))];
  }

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

  // ---------- Dán tem (SPEC-jobs2 mục 3.1) ----------
  function renderDesk() {
    desk.replaceChildren(...plan.stamps.map((sc, i) => h('div.ps-envelope', {
      dataset: { i: String(i), current: String(i === stampIdx), stamped: String(i < stampIdx) },
    }, h('span.ps-envelope-flap'), h('span.ps-envelope-corner', i < stampIdx && sc.done ? { html: stampSvg(sc.done) } : {}))));
  }
  async function startStamps(resume = false) {
    const e = kit.epoch;
    phase = 'stamp';
    desk.hidden = false;
    visitEl.hidden = true;
    count.textContent = '';
    if (stampIdx >= plan.stamps.length) {
      startLetters();
      return;
    }
    renderDesk();
    desk.dataset.answer = stampCase().set.filter((st) => matchesStamp(st, stampCase().want)).map(stickerId)[0] ?? ''; // cho test
    kit.renderTray(stampCase().set.map(stickerId));
    setState('stamp');
    snap();
    const first = stampIdx === 0 && !resume;
    if (first) restartAnim(desk, 'enter');
    await talk([...(first ? [B(STAMP_START_LINE)] : []), ...promptLines()]);
    if (e === kit.epoch && state === 'stamp') kit.armNudge();
  }
  async function stamp(id, from) {
    if (state !== 'stamp') return;
    const e = kit.epoch;
    const sc = stampCase();
    const st = stampById(id);
    if (!st) return;
    if (!matchesStamp(st, sc.want)) {
      const now = Date.now();
      if (`s:${id}` === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return;
      lastWrong = { key: `s:${id}`, at: now };
      wrongs += 1;
      snap();
      kit.clearNudge();
      play('boing');
      restartAnim(kit.trayItem(id), 'shake');
      if (wrongs >= 2) for (const x of sc.set) if (matchesStamp(x, sc.want)) restartAnim(kit.trayItem(stickerId(x)), 'nudge');
      const k = stepKey();
      await talk([B(stampWrongLine(st, sc.want))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    // Đúng (mức 1: tem nào cũng được): nhận NGAY rồi mới bay + nói. Hình / hình + màu ghi đã gặp (đúng ngay lần đầu).
    setState('busy');
    kit.clearNudge();
    if (sc.want && wrongs === 0 && !recorded.has(`stamp:${stampIdx}`)) {
      recorded.add(`stamp:${stampIdx}`);
      markPracticed(app, st.shape, { star: '⭐', heart: '❤️', circle: '⚪', square: '⬜' }[st.shape]);
      if (sc.want.color) markPracticed(app, st.color, { red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢' }[st.color]);
    }
    sc.done = st;
    stampIdx += 1;
    wrongs = 0;
    nudges = 0;
    snap();
    const env = desk.children[stampIdx - 1];
    const ghost = await kit.flyTo(h('span.dr-item-face.ps-stamp', { html: stampSvg(st) }), from, center(env.querySelector('.ps-envelope-corner').getBoundingClientRect()));
    kit.removeGhost(ghost);
    if (e !== kit.epoch) return;
    play('pop');
    renderDesk();
    restartAnim(desk.children[stampIdx - 1], 'hop');
    await talk([B(stampLine(st))]);
    if (e !== kit.epoch) return;
    if (stampIdx < plan.stamps.length) {
      startStamps(true);
      return;
    }
    play('sparkle');
    await talk([B(READY_LINE)]);
    if (e !== kit.epoch) return;
    startLetters();
  }
  function startLetters() {
    phase = 'letters';
    desk.hidden = true;
    idx = 0;
    newLetter();
  }

  // ---------- Thư ----------
  async function newLetter(resume = false) {
    const e = kit.epoch;
    phase = 'letters';
    desk.hidden = true;
    visitEl.hidden = true;
    wrongs = resume ? wrongs : 0;
    nudges = resume ? nudges : 0;
    count.textContent = `${idx + 1}/${plan.letters.length}`;
    kit.renderTray([parcel() ? 'parcel' : 'letter']);
    setState('deliver');
    snap();
    play('whoosh');
    restartAnim(kit.trayItem(parcel() ? 'parcel' : 'letter'), 'nudge');
    await talk([...promptLines(), ...(idx === 0 && !resume ? [B(DRAG_LINE)] : [])]);
    if (e === kit.epoch && state === 'deliver') kit.armNudge();
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
    // Đúng: nhận NGAY (một lần), lưu để chơi tiếp là thư sau (bưu kiện: bước gõ cửa); rồi mới bay + cửa mở + cảm ơn.
    setState('busy');
    kit.clearNudge();
    const house = plan.street[i];
    const key = `${idx}:color`;
    if (l.kind === 'color' && !recorded.has(key)) {
      recorded.add(key);
      const c = COLOR_BY_ID.get(house.color);
      markPracticed(app, c.id, c.emoji);
    }
    const isParcel = Boolean(l.parcel);
    if (isParcel) {
      phase = 'visit';
      visit = 'knock';
      wrongs = 0;
      nudges = 0;
      snap();
    } else {
      idx += 1;
      saveSnap(JOB, { level, plan, phase: 'letters', stampIdx, visit, idx, wrongs: 0, nudges: 0, recorded: [...recorded] });
    }
    const item = isParcel ? 'parcel' : 'letter';
    const start = from ?? center((kit.trayItem(item) ?? houseEl(i)).getBoundingClientRect());
    kit.renderTray([]);
    const ghost = await kit.flyTo(h('span.dr-item-face.ps-letter', { text: isParcel ? '📦' : '✉️' }), start, center(houseEl(i).querySelector('svg').getBoundingClientRect()));
    kit.removeGhost(ghost);
    if (e !== kit.epoch) return;
    play('ding');
    if (isParcel) {
      startVisit();
      return;
    }
    await openDoor(i, THANKS_LINE);
    if (e !== kit.epoch) return;
    play('sparkle');
    if (idx >= plan.letters.length) finishRound();
    else newLetter();
  }

  // ---------- Giao bưu kiện (SPEC-jobs2 mục 3.2) ----------
  function renderVisit() {
    const house = target();
    const c = COLOR_BY_ID.get(house.color);
    const p = parcel();
    visitEl.style.setProperty('--wall', c.wall);
    visitEl.style.setProperty('--roof', c.roof);
    visitEl.dataset.step = visit; // cho test
    visitEl.dataset.item = p.item.en;
    visitEl.dataset.guess = p.guess?.en ?? '';
    visitWho.innerHTML = patientSvg(house.resident, { mood: 'happy', title: PATIENT_BY_ID.get(house.resident)?.name });
    visitEl.classList.toggle('open', visit !== 'knock');
    visitBox.querySelector('.ps-box-label').replaceChildren(itemFace(p.item, 'ps-label-img', 'ps-label-emoji'));
    visitBox.classList.remove('opened');
    visitItem.hidden = true;
    thumbs.hidden = visit !== 'guess';
  }
  function itemFace(item, imgClass, emojiClass) {
    const fallback = () => h(`span.${emojiClass}`, { text: item.emoji });
    if (!itemUrl) return fallback();
    const img = h(`img.${imgClass}`, { src: itemUrl, alt: '', draggable: false });
    img.addEventListener('error', () => img.replaceWith(fallback()), { once: true });
    return img;
  }
  async function loadItemImage() {
    const p = plan.letters.find((l) => l.parcel)?.parcel;
    if (!p || itemUrl) return;
    const img = await latestImageForWord(app.db, p.item.en).catch(() => null);
    if (img && !kit.signal.aborted) itemUrl = URL.createObjectURL(mediaBlob(img));
  }
  async function startVisit(resume = false) {
    const e = kit.epoch;
    phase = 'visit';
    desk.hidden = true;
    visitEl.hidden = false;
    kit.renderTray([]);
    count.textContent = `${idx + 1}/${plan.letters.length}`;
    renderVisit();
    if (!resume) restartAnim(visitEl, 'enter');
    setState(visit);
    snap();
    const lines = visit === 'knock' ? [B(KNOCK_ASK_LINE)]
      : visit === 'guess' ? [R(target().resident, guessLine(parcel().guess))] : [B(OPEN_ASK_LINE)];
    await talk(lines);
    if (e === kit.epoch && state === visit) kit.armNudge();
  }
  async function knock() {
    if (state !== 'knock') return;
    const e = kit.epoch;
    setState('busy');
    kit.clearNudge();
    play('knock');
    restartAnim(visitDoor, 'knock');
    visit = parcel().guess ? 'guess' : 'open';
    nudges = 0;
    snap();
    await talk([B(KNOCK_LINE)]);
    if (e !== kit.epoch) return;
    visitEl.classList.add('open');
    play('ding');
    await talk([R(target().resident, WHATS_INSIDE_LINE)]);
    if (e !== kit.epoch) return;
    startVisit(true);
  }
  async function answerGuess(yes) {
    if (state !== 'guess') return;
    const e = kit.epoch;
    const p = parcel();
    if (yes !== p.guessRight) {
      const now = Date.now();
      const key = yes ? 'g:yes' : 'g:no';
      if (key === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return;
      lastWrong = { key, at: now };
      wrongs += 1;
      snap();
      kit.clearNudge();
      play('boing');
      restartAnim(visitBox, 'nudge');
      if (wrongs >= 2) restartAnim(p.guessRight ? thumbUp : thumbDown, 'nudge');
      const k = stepKey();
      await talk([B(LOOK_PICTURE_LINE), R(target().resident, guessLine(p.guess))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    // Đúng: từ của đồ trong hộp ghi đã gặp (mức 3, đúng ngay lần đầu — thao tác xác minh được).
    setState('busy');
    kit.clearNudge();
    if (wrongs === 0 && !recorded.has(`parcel:${idx}`)) {
      recorded.add(`parcel:${idx}`);
      markPracticed(app, p.item.en, p.item.emoji);
    }
    visit = 'open';
    wrongs = 0;
    nudges = 0;
    snap();
    thumbs.hidden = true;
    play('ding');
    await talk([B(yes ? YES_LOOK_LINE : NO_LOOK_LINE)]);
    if (e !== kit.epoch) return;
    startVisit(true);
  }
  /** Chạm hộp: mở được ở bước mở hộp; trước đó hộp chỉ nhún (không nhầm). */
  async function openBox() {
    if (state === 'knock') {
      restartAnim(visitDoor, 'nudge');
      return;
    }
    if (state !== 'open') return;
    const e = kit.epoch;
    const p = parcel();
    setState('busy');
    kit.clearNudge();
    idx += 1;
    saveSnap(JOB, { level, plan, phase: 'letters', stampIdx, visit: 'knock', idx, wrongs: 0, nudges: 0, recorded: [...recorded] });
    play('pop');
    visitBox.classList.add('opened');
    visitItem.replaceChildren(itemFace(p.item, 'ps-item-img', 'ps-item-emoji'));
    visitItem.hidden = false;
    restartAnim(visitItem, 'pop-out');
    await talk([B(itsLine(p.item))]);
    if (e !== kit.epoch) return;
    await wait(SAY_BACK_MS);
    if (e !== kit.epoch) return;
    play('sparkle');
    await talk([R(plan.street[plan.letters[idx - 1].house].resident, parcelThanksLine(p.item))]);
    if (e !== kit.epoch) return;
    visitEl.hidden = true;
    phase = 'letters';
    if (idx >= plan.letters.length) finishRound();
    else newLetter();
  }
  // Chạm bạn thú / mặt tiền lúc chờ gõ cửa: cửa nhún (không nhầm).
  visitWho.addEventListener('pointerdown', () => state === 'knock' && restartAnim(visitDoor, 'nudge'), { signal: kit.signal });

  function finishRound() {
    if (state === 'done') return;
    setState('done');
    visitEl.hidden = true;
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
    wrongs = 0;
    nudges = 0;
    if (phase === 'stamp') {
      stampIdx = 0;
      for (const sc of plan.stamps) delete sc.done;
      startStamps();
      return;
    }
    visit = 'knock';
    idx = 0;
    newLetter();
  }

  function repeatPrompt() {
    if (!ACTIVE.includes(state)) return;
    const k = stepKey();
    talk(promptLines()).then(() => k === stepKey() && kit.armNudge());
  }

  /** Từ bài học bé đã gặp (cho đồ trong bưu kiện). */
  async function learnedWords() {
    try {
      const seenWords = new Set((await app.db.getAll('progress')).filter((r) => r.practiceCount > 0).map((r) => r.word));
      return (await listLessons(app.db)).filter(isWordLesson).flatMap((l) => l.words ?? []).filter((w) => seenWords.has(progressKey(w.en)));
    } catch {
      return [];
    }
  }

  (async () => {
    const s = takeSnap(JOB, { level, continueDirectly: params.continueDirectly });
    if (s?.plan?.stamps) {
      plan = s.plan;
      phase = s.phase ?? 'letters';
      stampIdx = s.stampIdx ?? plan.stamps.length;
      visit = s.visit ?? 'knock';
      idx = s.idx;
      wrongs = s.wrongs ?? 0;
      nudges = s.nudges ?? 0;
      recorded = new Set(s.recorded ?? []);
    } else {
      plan = planRound(level, { words: await learnedWords() });
      phase = 'stamp';
    }
    await loadItemImage();
    if (kit.signal.aborted) return;
    renderStreet();
    if (idx >= plan.letters.length) {
      count.textContent = `${plan.letters.length}/${plan.letters.length}`;
      finishRound();
    } else if (phase === 'stamp') startStamps(Boolean(s?.plan?.stamps));
    else if (phase === 'visit') startVisit(true);
    else newLetter(Boolean(s?.plan?.stamps));
  })();

  kit.onCleanup(() => itemUrl && URL.revokeObjectURL(itemUrl));
  return kit.cleanup;
}
