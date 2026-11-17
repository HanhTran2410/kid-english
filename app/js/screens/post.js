// Trò Bưu tá (SPEC-jobs.md mục 4): Bông đưa thư "This letter is for the red house!", bé kéo thư vào đúng nhà
// (hoặc chạm nhà). Đúng: cửa mở, bạn thú cảm ơn; nhầm: bạn thú trong nhà đó nói "Not for me!", thư về túi (giữ thư cũ).
// SPEC-jobs2 PO1: mở đầu lượt dán tem lên 3 lá thư; một trong 5 thư là bưu kiện — tới nhà gõ cửa, (mức 3) trả lời bạn
// thú đoán đồ, mở hộp. SPEC-jobs4 PO2: một thư khác đi xa — bản đồ nhỏ, bé chọn xe (thuyền / máy bay / tàu / xe đạp).
// 5 thư → sticker. Trạng thái: stamp ⇄ busy → deliver ⇄ busy → (knock → guess → open) → thư sau | done.
// Khung chung ở jobs/kit.js.

import { h } from '../ui.js';
import { latestImageForWord, mediaBlob, listLessons } from '../db.js';
import { play } from '../speech/sfx.js';
import { markPracticed } from '../player/track.js';
import { isWordLesson } from '../phrase.js';
import { progressKey } from '../progress.js';
import { patientSvg } from '../patients.js';
import { PATIENT_BY_ID, STICKER_COLORS, stickerId } from '../doctor.js';
import { cleanJobState, afterJobRound, afterSeen } from '../jobs/levels.js';
import { JOBS_BG_IMAGES } from '../jobs/backgrounds.js';
import { jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, WRONG_LOCK_MS, MAX_NUDGES } from '../jobs/kit.js';
import {
  MAX_LEVEL, COLOR_BY_ID, planRound, letterLine, wrongLine, THANKS_LINE, DRAG_LINE,
  matchesStamp, STAMP_START_LINE, STAMP_PICK_LINE, stampLine, stampWantLine, stampWrongLine, READY_LINE,
  parcelLine, KNOCK_ASK_LINE, KNOCK_LINE, WHATS_INSIDE_LINE, guessLine, YES_LOOK_LINE, NO_LOOK_LINE, LOOK_PICTURE_LINE,
  OPEN_ASK_LINE, itsLine, parcelThanksLine,
  VEHICLE_BY, goByLine, byPleaseLine, farAskLine, teachLine, wrongVehicleLine, cantGoLine, goodIdeaLine,
} from '../jobs/post.js';

const JOB = 'post';
const DOOR_MS = 700; // cửa mở cho bạn thú ló ra
const SAY_BACK_MS = 2000; // "It's a ball!": chờ bé nói theo
const ACTIVE = ['deliver', 'stamp', 'knock', 'guess', 'open', 'vehicle'];
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

/** Chỗ xe đứng / đỗ trên bản đồ (% ngang, % dọc của khung 2 : 1): bưu điện, nơi nhận, mép (xe sai dừng), bay (máy bay). */
const ROAD = { island: 70, city: 84, station: 83, park: 76 };
const MAP_SPOTS = {
  island: { start: 10, dest: 80, edge: 17, y: ROAD.island, destY: 56 },
  city: { start: 10, dest: 86, edge: 30, y: ROAD.city, destY: 78 },
  station: { start: 10, dest: 80, edge: 24, y: ROAD.station, destY: 80 },
  park: { start: 10, dest: 84, edge: 22, y: ROAD.park, destY: 76 },
};
const MAP_INK = 'stroke="#3d2c5e" stroke-width="2.5" stroke-linejoin="round"';
const tree = (x, y, r = 14) => `<rect x="${x - 3}" y="${y}" width="6" height="${r + 4}" fill="#8d5a3b"/><circle cx="${x}" cy="${y}" r="${r}" fill="#51cf66" ${MAP_INK}/>`;
const cloud = (x, y) => `<g fill="#fff"><ellipse cx="${x}" cy="${y}" rx="22" ry="9"/><ellipse cx="${x + 12}" cy="${y - 7}" rx="13" ry="9"/><ellipse cx="${x - 10}" cy="${y - 5}" rx="10" ry="7"/></g>`;
const POST_OFFICE = `<g class="ps-map-po"><rect x="6" y="96" width="44" height="34" rx="3" fill="#ff8787" ${MAP_INK}/><path d="M2 98 L28 80 L54 98 Z" fill="#e03131" ${MAP_INK}/><rect x="16" y="104" width="24" height="15" rx="2" fill="#fff" ${MAP_INK}/><path d="M16 104 L28 113 L40 104" fill="none" stroke="#3d2c5e" stroke-width="2"/></g>`;
const DEST_HOUSE = (x, y) => `<rect x="${x - 18}" y="${y}" width="36" height="28" rx="3" fill="#ffe066" ${MAP_INK}/><path d="M${x - 23} ${y + 2} L${x} ${y - 16} L${x + 23} ${y + 2} Z" fill="#f59f00" ${MAP_INK}/><rect x="${x - 6}" y="${y + 12}" width="12" height="16" fill="#8d5a3b"/>`;
/** Bản đồ nhỏ (viewBox 400 × 200) của nơi nhận: chỉ một loại xe tới được (SPEC-jobs4 mục 8). */
function mapSvg(place) {
  const sky = '<rect width="400" height="200" fill="#d0ebff"/>';
  const scene = {
    island: `${sky}<rect x="0" y="90" width="400" height="110" fill="#4dabf7"/>
      <path d="M90 120 q10 -6 20 0 t20 0 M170 160 q10 -6 20 0 t20 0 M120 185 q10 -6 20 0 t20 0 M230 110 q10 -6 20 0 t20 0" fill="none" stroke="#e7f5ff" stroke-width="3" stroke-linecap="round"/>
      <path d="M0 90 L66 90 Q78 140 66 200 L0 200 Z" fill="#8ce99a" ${MAP_INK}/>
      <ellipse cx="320" cy="140" rx="70" ry="30" fill="#ffe8a1" ${MAP_INK}/>
      <path d="M352 132 q-4 -30 2 -50" fill="none" stroke="#8d5a3b" stroke-width="5"/><path d="M354 82 q-18 -6 -28 6 M354 82 q16 -10 28 2 M354 82 q-6 -16 -20 -18 M354 82 q8 -16 22 -14" fill="none" stroke="#2f9e44" stroke-width="5" stroke-linecap="round"/>
      ${DEST_HOUSE(312, 104)}${cloud(200, 34)}`,
    city: `${sky}<rect x="0" y="150" width="400" height="50" fill="#8ce99a"/>
      <rect x="0" y="158" width="128" height="20" fill="#868e96"/><path d="M6 168 H124" stroke="#fff" stroke-width="2.5" stroke-dasharray="10 8"/>
      <path d="M120 178 L178 34 L226 120 L258 58 L320 178 Z" fill="#adb5bd" ${MAP_INK}/>
      <path d="M164 68 L178 34 L192 68 Q178 60 164 68 Z M250 76 L258 58 L268 78 Q258 72 250 76 Z" fill="#fff"/>
      <rect x="318" y="116" width="22" height="62" fill="#b197fc" ${MAP_INK}/><rect x="340" y="98" width="26" height="80" fill="#74c0fc" ${MAP_INK}/><rect x="366" y="128" width="26" height="50" fill="#ffc078" ${MAP_INK}/>
      <path d="M324 126 h8 M324 142 h8 M346 110 h12 M346 126 h12 M346 142 h12 M372 138 h12 M372 154 h12" stroke="#fff" stroke-width="5"/>
      ${cloud(90, 40)}${cloud(250, 22)}`,
    station: `${sky}<rect x="0" y="140" width="400" height="60" fill="#8ce99a"/>
      <g stroke="#8d5a3b" stroke-width="5">${Array.from({ length: 18 }, (_, i) => `<path d="M${8 + i * 18} 156 V178"/>`).join('')}</g>
      <path d="M0 160 H330 M0 174 H330" stroke="#495057" stroke-width="4"/>
      ${tree(110, 104)}${tree(200, 110)}${tree(270, 100)}<path d="M60 128 L94 92 L128 128 Z M150 132 L176 104 L202 132 Z" fill="#69db7c" ${MAP_INK}/>
      <rect x="320" y="118" width="74" height="56" rx="3" fill="#ffc9c9" ${MAP_INK}/><path d="M312 120 L357 92 L400 120 Z" fill="#e03131" ${MAP_INK}/>
      <circle cx="357" cy="108" r="8" fill="#fff" ${MAP_INK}/><path d="M357 103 v5 h4" stroke="#3d2c5e" stroke-width="2" fill="none"/><rect x="346" y="146" width="22" height="28" fill="#8d5a3b"/>
      ${cloud(220, 36)}`,
    park: `${sky}<rect x="0" y="110" width="400" height="90" fill="#8ce99a"/>
      <path d="M40 162 C120 150 200 170 290 156" fill="none" stroke="#e9d8a6" stroke-width="16" stroke-linecap="round"/>
      ${tree(110, 110, 18)}${tree(170, 124, 14)}${tree(240, 112, 18)}${tree(140, 172, 12)}
      <circle cx="205" cy="182" r="6" fill="#f783ac"/><circle cx="90" cy="186" r="5" fill="#ffd43b"/><circle cx="260" cy="188" r="6" fill="#f783ac"/>
      ${DEST_HOUSE(336, 132)}${cloud(200, 38)}`,
  }[place];
  return `<svg class="ps-map-svg" viewBox="0 0 400 200" aria-hidden="true">${scene}${POST_OFFICE}</svg>`;
}
/** Chỗ Bông chỉ khi dạy "The sea! A boat!" (% ngang, % dọc). */
const POINT_AT = { island: [45, 62], city: [44, 30], station: [52, 72], park: [50, 50] };

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
  const vehUrls = new Map(); // ảnh bài Vehicles bố mẹ thêm (xe → url)

  const letter = () => plan?.letters[idx];
  const parcel = () => letter()?.parcel ?? null;
  const target = () => plan?.street[letter()?.house];
  const stampCase = () => plan?.stamps?.[stampIdx];
  const R = (resident, line) => ({ who: `r:${resident}`, line });
  const B = (line) => ({ who: 'bong', line });
  const stampById = (id) => stampCase()?.set.find((st) => stickerId(st) === id);
  const far = () => letter()?.far ?? null;

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
  // SPEC-jobs4 PO2: bản đồ nhỏ, xe chở thư, bạn thú ở nơi nhận, tay Bông chỉ biển / núi / đường ray / công viên.
  const mapArt = h('div.ps-map-art');
  const ride = h('div.ps-ride', { hidden: true, 'aria-hidden': 'true' });
  const farWho = h('div.ps-far-who', { hidden: true, 'aria-hidden': 'true' });
  const pointer = h('div.ps-point', { 'aria-hidden': 'true', text: '👆' });
  const farMap = h('div.ps-map', {}, mapArt, farWho, ride, pointer);
  const farEl = h('div.ps-far', { hidden: true }, farMap);

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
        else if (state === 'vehicle') {
          if (level === 1) restartAnim(kit.trayItem(far().vehicle), 'nudge');
          else if (level >= 3) showPointer();
        }
        kit.talk(promptLines()).then(rearm);
      },
    },
    tray: {
      face: (id) => (VEHICLE_BY.has(id) ? vehicleFace(id, 'dr-item-face') : id === 'letter' || id === 'parcel'
        ? h('span.dr-item-face.ps-letter', { text: id === 'parcel' ? '📦' : '✉️', 'aria-hidden': 'true' })
        : h('span.dr-item-face.ps-stamp', { html: stampSvg(stampById(id) ?? { shape: 'circle', color: 'red' }) })),
      label: (id) => (VEHICLE_BY.has(id) ? id : id === 'letter' ? 'Lá thư' : id === 'parcel' ? 'Bưu kiện' : (() => { const st = stampById(id); return st ? `${st.color} ${st.shape} stamp` : id; })()),
      canGive: () => state === 'deliver' || state === 'stamp' || state === 'vehicle',
      dropOk: () => true,
      give: (id, at) => {
        if (state === 'stamp') {
          stamp(id, at);
          return;
        }
        if (state === 'vehicle') {
          pickVehicle(id);
          return;
        }
        const i = houseAt(at.x, at.y);
        if (i == null) repeatPrompt(); // chạm thư (không kéo vào nhà): Bông nói lại địa chỉ
        else deliver(i, at);
      },
    },
  });
  const { stage, count, talk } = kit;
  stage.append(h('div.ps-sky', { 'aria-hidden': 'true' }, h('span.ps-sun'), h('span.ps-cloud')), street, desk, visitEl, farEl);
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
    kit.setState(s, s === 'deliver' || s === 'stamp' || s === 'vehicle');
  }
  const snap = () => saveSnap(JOB, { level, plan, phase, stampIdx, visit, idx, wrongs, nudges, recorded: [...recorded] });

  /** Câu của bước đang chờ bé (nhắc, chạm Bông). */
  function promptLines() {
    if (state === 'stamp') return [B(stampCase().want ? stampWantLine(stampCase().want) : STAMP_PICK_LINE)];
    if (state === 'knock') return [B(KNOCK_ASK_LINE)];
    if (state === 'guess') return [R(target().resident, guessLine(parcel().guess))];
    if (state === 'open') return [B(OPEN_ASK_LINE)];
    if (state === 'vehicle') return [B(farPrompt())];
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
    farEl.hidden = true;
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
    if (far()) {
      startFar(resume);
      return;
    }
    phase = 'letters';
    desk.hidden = true;
    visitEl.hidden = true;
    farEl.hidden = true;
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

  // ---------- Chọn xe đưa thư đi xa (SPEC-jobs4 mục 8) ----------
  function vehicleFace(id, cls) {
    const v = VEHICLE_BY.get(id);
    const url = vehUrls.get(id);
    const fallback = () => h(`span.${cls}.ps-veh`, { text: v.emoji, 'aria-hidden': 'true' });
    if (!url) return fallback();
    const img = h(`img.${cls}.ps-veh-img`, { src: url, alt: '', draggable: false });
    img.addEventListener('error', () => img.replaceWith(fallback()), { once: true });
    return img;
  }
  async function loadVehicleImages() {
    for (const l of plan.letters) for (const id of l.far?.tray ?? []) {
      if (vehUrls.has(id)) continue;
      const img = await latestImageForWord(app.db, id).catch(() => null);
      if (kit.signal.aborted) return;
      if (img) vehUrls.set(id, URL.createObjectURL(mediaBlob(img)));
    }
  }
  const farPrompt = () => (level === 1 ? goByLine(far().vehicle) : level === 2 ? byPleaseLine(far().vehicle) : farAskLine(far().place));
  /** Xe (có lá thư) tới chỗ (x, y) trên bản đồ trong `ms`. */
  async function moveRide(x, y, ms) {
    ride.style.transitionDuration = `${ms}ms`;
    ride.style.left = `${x}%`;
    ride.style.top = `${y}%`;
    await wait(ms);
  }
  function placeRide(x, y) {
    ride.style.transitionDuration = '0ms';
    ride.style.left = `${x}%`;
    ride.style.top = `${y}%`;
  }
  function showPointer(c = far()) {
    const [x, y] = POINT_AT[c.place];
    pointer.style.left = `${x}%`;
    pointer.style.top = `${y}%`;
    pointer.classList.add('show');
    restartAnim(pointer, 'nudge');
  }
  const hidePointer = () => pointer.classList.remove('show');
  /** Bông chỉ vào biển / núi / đường ray / công viên và nói câu dạy "The sea! A boat!". */
  async function teach(c = far()) {
    showPointer(c);
    await talk([B(teachLine(c.place))]);
    hidePointer();
  }
  async function startFar(resume = false) {
    const e = kit.epoch;
    const c = far();
    phase = 'far';
    desk.hidden = true;
    visitEl.hidden = true;
    farEl.hidden = false;
    if (!resume) {
      wrongs = 0;
      nudges = 0;
    }
    count.textContent = `${idx + 1}/${plan.letters.length}`;
    farEl.dataset.place = c.place; // cho test
    farEl.dataset.vehicle = c.vehicle;
    mapArt.innerHTML = mapSvg(c.place);
    farWho.hidden = true;
    farWho.innerHTML = headSvg(target().resident);
    const spot = MAP_SPOTS[c.place];
    farWho.style.left = `${spot.dest}%`;
    farWho.style.top = `${spot.destY}%`;
    ride.hidden = true;
    hidePointer();
    kit.renderTray(c.tray);
    if (level === 1) kit.setHint(c.vehicle);
    setState('vehicle');
    snap();
    if (!resume) {
      restartAnim(farEl, 'enter');
      play('whoosh');
    }
    if (c.teach && !resume) {
      setState('busy');
      await teach();
      if (e !== kit.epoch) return;
      setState('vehicle');
    }
    await talk(promptLines());
    if (e === kit.epoch && state === 'vehicle') kit.armNudge();
  }
  async function pickVehicle(id) {
    if (state !== 'vehicle') return;
    const e = kit.epoch;
    const c = far();
    const spot = MAP_SPOTS[c.place];
    const item = kit.trayItem(id);
    if (id !== c.vehicle) {
      // Nhầm: xe đó chạy tới mép (biển / núi / hết đường) rồi dừng, về khay. Mức 1 không tính (xe đúng đang sáng).
      const now = Date.now();
      if (`v:${id}` === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return;
      lastWrong = { key: `v:${id}`, at: now };
      if (level >= 2) wrongs += 1;
      setState('busy');
      kit.clearNudge();
      snap();
      if (item) item.style.visibility = 'hidden';
      ride.replaceChildren(vehicleFace(id, 'ps-ride-face'), h('span.ps-ride-letter', { text: '✉️' }));
      ride.dataset.vehicle = id;
      placeRide(spot.start, spot.y);
      ride.hidden = false;
      await moveRide(spot.edge, spot.y, 900);
      if (e !== kit.epoch) return;
      play('boing');
      restartAnim(ride, 'shake');
      await talk([B(level >= 3 ? cantGoLine(id, c.place) : wrongVehicleLine(id, c.vehicle))]);
      if (e !== kit.epoch) return;
      ride.hidden = true;
      if (item) item.style.visibility = '';
      if (level >= 3) await teach();
      if (e !== kit.epoch) return;
      if (level === 2 && wrongs >= 2) restartAnim(kit.trayItem(c.vehicle), 'nudge');
      setState('vehicle');
      if (level >= 3) await talk([B(farAskLine(c.place))]);
      if (e === kit.epoch && state === 'vehicle') kit.armNudge();
      return;
    }
    // Đúng: nhận NGAY (một lần) — từ Vehicles (mức 2–3, đúng ngay lần đầu), `seen` nơi nhận; rồi xe chở thư đi.
    setState('busy');
    kit.clearNudge();
    if (!recorded.has(`far:${idx}`)) {
      recorded.add(`far:${idx}`);
      if (level >= 2 && wrongs === 0) markPracticed(app, id, VEHICLE_BY.get(id).emoji);
      progress = afterSeen(progress, c.place);
      app.setSetting('postGame', progress).catch(() => {});
    }
    const resident = target().resident;
    idx += 1;
    saveSnap(JOB, { level, plan, phase: 'letters', stampIdx, visit: 'knock', idx, wrongs: 0, nudges: 0, recorded: [...recorded] });
    kit.renderTray([]);
    ride.replaceChildren(vehicleFace(id, 'ps-ride-face'), h('span.ps-ride-letter', { text: '✉️' }));
    ride.dataset.vehicle = id;
    placeRide(spot.start, spot.y);
    ride.hidden = false;
    play('whoosh');
    if (id === 'plane') {
      await moveRide(26, 18, 600);
      if (e !== kit.epoch) return;
      await moveRide(spot.dest - 6, 18, 900);
      if (e !== kit.epoch) return;
      await moveRide(spot.dest - 6, spot.destY + 8, 500);
    } else await moveRide(spot.dest - 8, spot.y, 2000);
    if (e !== kit.epoch) return;
    play('ding');
    if (level >= 3) await talk([B(goodIdeaLine(id))]);
    else await teach(c);
    if (e !== kit.epoch) return;
    farWho.hidden = false;
    restartAnim(farWho, 'pop-out');
    play('sparkle');
    await talk([R(resident, THANKS_LINE)]);
    if (e !== kit.epoch) return;
    farEl.hidden = true;
    phase = 'letters';
    if (idx >= plan.letters.length) finishRound();
    else newLetter();
  }

  function finishRound() {
    if (state === 'done') return;
    setState('done');
    visitEl.hidden = true;
    farEl.hidden = true;
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
    ride.hidden = true;
    hidePointer();
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
      plan = planRound(level, { words: await learnedWords(), seen: progress.seen });
      phase = 'stamp';
    }
    await loadItemImage();
    await loadVehicleImages();
    if (kit.signal.aborted) return;
    renderStreet();
    if (idx >= plan.letters.length) {
      count.textContent = `${plan.letters.length}/${plan.letters.length}`;
      finishRound();
    } else if (phase === 'stamp') startStamps(Boolean(s?.plan?.stamps));
    else if (phase === 'visit') startVisit(true);
    else newLetter(Boolean(s?.plan?.stamps));
  })();

  kit.onCleanup(() => {
    if (itemUrl) URL.revokeObjectURL(itemUrl);
    for (const url of vehUrls.values()) URL.revokeObjectURL(url);
  });
  return kit.cleanup;
}
