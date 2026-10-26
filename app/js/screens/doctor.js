// Trò Bác sĩ nhí (SPEC-doctor.md): bạn thú vào phòng khám kêu đau, Bông y tá hướng dẫn. Mỗi ca làm lần lượt các bước
// của ca (chạm chỗ đau → khám → chữa, theo mức) rồi khỏe lại, cảm ơn, ra về. 3 ca → Hoan hô + sticker.
// Trạng thái (mục 8): wash (đầu lượt, SPEC-doctor2) → enter → touch / check / treat ⇄ busy → healed → sticker → leave → ca sau | done.
// Nhận một thao tác đúng = chuyển bước NGAY (ghi tiến độ, lưu để chơi tiếp); hoạt ảnh + câu nói chỉ để trình diễn.
// Phần chung với các nghề khác (nói, nhắc, khay, đồ bay, lượt, ra nền) ở jobs/kit.js (SPEC-jobs mục 2.3).

import { h } from '../ui.js';
import { mediaBlob } from '../db.js';
import { play } from '../speech/sfx.js';
import { markPracticed } from '../player/track.js';
import { numberKey } from '../numbers.js';
import { patientSvg, faceSvg, glowSvg } from '../patients.js';
import {
  jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, WRONG_LOCK_MS, MAX_NUDGES,
} from '../jobs/kit.js';
import {
  CASE_BY_ID, PATIENT_BY_ID, ITEM_BY_ID, REGIONS, regionAt, regionPoint, stepsFor, trayFor,
  cleanDoctorState, afterDoctorRound, afterHealed, stepPrompt, wrongItemLine, doneLine, betterLine,
  DOCTOR_ITEM_IMAGES, DOCTOR_BG_IMAGES, BG_KEY, COME_IN_LINE, HELLO_DOCTOR_LINE, GOOD_JOB_LINE, BYE_LINE, yesTouchLine, wrongTouchLine,
  WASH_BY, washFor, nextWash, WASH_START_LINE, WASH_DONE_LINE, washFirstLine,
  STICKER_COLORS, planSticker, stickerId, matchesSticker, STICKER_ASK_LINE, stickerWantLine, stickerLoveLine, stickerWrongLine,
  planDoctorRound, CHECKUP_HELLO_LINE, MEASURE_LINE, FROM_BOTTOM_LINE, GROWING_LINE, HOW_MANY_BLOCKS_LINE, TALLER_Q_LINE,
  blockCountLine, tallLine, rightBlocksLine, wrongBlocksLine, tallerLine, wrongTallerLine,
} from '../doctor.js';

const JOB = 'doctor';
const USE_MS = 1100; // hoạt ảnh dùng đồ (chải răng, hỉ mũi…), không quá 2 giây
const SAY_AAH_MS = 2000; // "Open wide! Say aah!": chờ bé nói theo
const ENTER_MS = 650;
const LEAVE_MS = 600;
const STEP_STATES = ['touch', 'check', 'treat'];
/** Bước chờ bé thao tác (nhắc 10 giây, khay sáng): bước khám chữa + rửa tay + tặng sticker (SPEC-doctor2). */
/** Ca đo chiều cao (SPEC-doctor2 DR2): đếm khối, chọn số (mức 2), ai cao hơn (mức 3). */
const MEASURE_STATES = ['measure', 'howmany', 'taller'];
const ACTIVE = [...STEP_STATES, 'wash', 'sticker', ...MEASURE_STATES];
const WASH_MS = 700; // hoạt ảnh rửa tay, không chặn thao tác tiếp
const INK = '#3d2c5e';
const COLOR_HEX = new Map(STICKER_COLORS.map((c) => [c.id, c.hex]));

/** Hình sticker (SVG) theo hình + màu; `size` = cỡ cố định (dán lên bạn thú), 0 = co theo khung (khay). */
function stickerShape(st, size = 0) {
  const fill = COLOR_HEX.get(st.color);
  const body = {
    star: `<path d="M20 3 L25 15 L38 15 L27.5 23 L31.5 36 L20 28 L8.5 36 L12.5 23 L2 15 L15 15 Z" fill="${fill}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`,
    heart: `<path d="M20 35 C8 26 3 19 3 12.5 C3 7 7.5 3.5 12 3.5 C15.5 3.5 18.5 5.5 20 9 C21.5 5.5 24.5 3.5 28 3.5 C32.5 3.5 37 7 37 12.5 C37 19 32 26 20 35 Z" fill="${fill}" stroke="${INK}" stroke-width="2.5"/>`,
    circle: `<circle cx="20" cy="20" r="16" fill="${fill}" stroke="${INK}" stroke-width="2.5"/>`,
    square: `<rect x="5" y="5" width="30" height="30" rx="5" fill="${fill}" stroke="${INK}" stroke-width="2.5"/>`,
  }[st.shape];
  return `<svg viewBox="0 0 40 40"${size ? ` width="${size}" height="${size}"` : ''}>${body}</svg>`;
}
/** Khăn (không có emoji khăn): khăn gấp sọc. */
const TOWEL_SVG = `<svg viewBox="0 0 40 40"><rect x="6" y="8" width="28" height="26" rx="4" fill="#a5d8ff" stroke="${INK}" stroke-width="2.5"/><path d="M6 15 H34 M6 27 H34" stroke="#fff" stroke-width="3"/></svg>`;
/** Bồn rửa tay + hai bàn tay: lớp bọt / nước / khô / găng bật theo món đã dùng. */
const HAND = `<rect x="0" y="30" width="44" height="52" rx="18"/><rect x="2" y="6" width="9" height="34" rx="4.5"/><rect x="12.5" y="0" width="9" height="38" rx="4.5"/><rect x="23" y="2" width="9" height="36" rx="4.5"/><rect x="33.5" y="10" width="9" height="30" rx="4.5"/><ellipse cx="48" cy="54" rx="8" ry="14" transform="rotate(-25 48 54)"/>`;
const WASH_SVG = `<svg class="dr-wash-svg" viewBox="0 0 300 230" aria-hidden="true">
  <rect x="140" y="6" width="14" height="30" rx="4" fill="#adb5bd" stroke="${INK}" stroke-width="2.5"/>
  <rect x="140" y="30" width="38" height="12" rx="5" fill="#adb5bd" stroke="${INK}" stroke-width="2.5"/>
  <rect class="dr-stream" x="166" y="42" width="10" height="140" rx="5" fill="#74c0fc"/>
  <g class="dr-hands">
    <g class="dr-skin" transform="translate(96 84)" stroke="${INK}" stroke-width="2.5">${HAND}</g>
    <g class="dr-skin" transform="translate(250 84) scale(-1 1)" stroke="${INK}" stroke-width="2.5">${HAND}</g>
  </g>
  <g class="dr-bubbles" fill="#fff" stroke="#74c0fc" stroke-width="2">
    <circle cx="108" cy="110" r="9"/><circle cx="126" cy="140" r="7"/><circle cx="150" cy="124" r="11"/><circle cx="196" cy="108" r="8"/>
    <circle cx="214" cy="142" r="10"/><circle cx="172" cy="150" r="6"/><circle cx="236" cy="118" r="6"/>
  </g>
  <text class="dr-dry" x="150" y="76" text-anchor="middle" font-size="30">✨</text>
  <path d="M36 178 H264 Q258 226 150 226 Q42 226 36 178 Z" fill="#e9ecef" stroke="${INK}" stroke-width="3"/>
</svg>`;
/** Đồ bay tới vùng nào; null = chỗ đau của ca (vùng của bước chạm). */
const ITEM_TARGET = {
  bandage: null, medicine: 'mouth', tissue: 'nose', toothbrush: 'mouth', drops: 'eye', icepack: 'head', water: 'mouth',
  blanket: 'tummy', stethoscope: 'tummy', thermometer: 'hand', flashlight: null,
};
const ITEM_SOUND = { bandage: 'pop', medicine: 'chomp', tissue: 'honk', toothbrush: 'brush', stethoscope: 'ding', thermometer: 'ding', drops: 'pop', icepack: 'pop', water: 'chomp', blanket: 'sparkle' };
const BUG_MS = 1200; // bọ rùa bay ra khỏi tai (ca tai)
const REST_MS = 2000; // ca buồn ngủ: zZz 2 giây

/** Ảnh bố mẹ thêm (SPEC mục 10): ảnh từng đồ (theo mã đồ) và ảnh nền phòng khám. */
export async function loadDoctorImages(app) {
  const urls = [];
  const item = new Map();
  let bg = null;
  for (const [lessonId, isBg] of [[DOCTOR_ITEM_IMAGES, false], [DOCTOR_BG_IMAGES, true]]) {
    for (const img of await app.db.getAllByIndex('images', 'lessonId', lessonId).catch(() => [])) {
      const url = URL.createObjectURL(mediaBlob(img));
      urls.push(url);
      if (!isBg) item.set(img.word, url);
      else if (img.word === BG_KEY) bg = url;
    }
  }
  return { item, bg, revoke: () => urls.forEach((u) => URL.revokeObjectURL(u)) };
}

/** Hình một đồ: ảnh bố mẹ thêm, chưa có / hỏng thì emoji. */
export function itemFace(item, images, cls = 'dr-item-face') {
  const emoji = () => h(`span.${cls}`, { text: item.emoji, 'aria-hidden': 'true' });
  const url = images?.item.get(item.id);
  if (!url) return emoji();
  const img = h(`img.${cls}.dr-item-img`, { src: url, alt: '', draggable: false });
  img.addEventListener('error', () => img.replaceWith(emoji()), { once: true });
  return img;
}

export function doctorScreen(app, params = {}) {
  let progress = cleanDoctorState(app.settings.doctorGame);
  const level = progress.level; // đổi mức giữa lượt: áp dụng từ lượt sau
  let cases = [];
  let caseIdx = 0;
  let stepIdx = 0;
  let wrongs = 0;
  let nudges = 0;
  let state = 'start';
  let tray = [];
  let lastWrong = { key: '', at: 0 };
  let images = null;
  // Tiến độ đã ghi trong lượt này ('body:ca', 'seen:ca'): ra nền / 🧹 khám lại không ghi lần hai.
  let recorded = new Set();
  let washed = []; // món rửa tay đã dùng (đầu lượt)
  let washDone = false;
  let mWho = 0; // ca đo: bạn thứ mấy đang được đo (mức 3 có hai bạn)
  let mCount = 0; // số khối đã đếm của bạn đang đo

  const curCase = () => CASE_BY_ID.get(cases[caseIdx]?.id);
  const curPatient = () => PATIENT_BY_ID.get(cases[caseIdx]?.patient);
  const steps = () => stepsFor(curCase(), level);
  const curStep = () => steps()[stepIdx];
  const P = (line) => ({ who: 'patient', line });
  const B = (line) => ({ who: 'bong', line });
  const patientEl = h('div.dr-patient');
  const washEl = h('div.dr-wash', { hidden: true, html: WASH_SVG });
  const measureEl = h('div.dr-measure', { hidden: true });
  const isCheckup = () => cases[caseIdx]?.id === 'checkup';
  const sticker = () => {
    const c = cases[caseIdx];
    if (c && !c.sticker) c.sticker = planSticker(level); // bản lưu cũ chưa có bộ sticker
    return c?.sticker;
  };
  const stickerById = (id) => sticker()?.set.find((st) => stickerId(st) === id);

  const kit = jobScreen(app, {
    job: JOB, className: 'dr-play', stageClass: 'dr-stage', title: '🩺 Doctor', helperLabel: 'Bông y tá', cap: 'nurse',
    resetLabel: 'Khám lại', trayLabel: 'Đồ của bác sĩ',
    icon: (who) => (who === 'patient' ? curPatient()?.emoji ?? '' : who === 'patient2' ? PATIENT_BY_ID.get(cases[caseIdx]?.patient2)?.emoji ?? '' : '🐰'),
    pitch: (who) => (who === 'patient' ? curPatient()?.pitch : who === 'patient2' ? PATIENT_BY_ID.get(cases[caseIdx]?.patient2)?.pitch : undefined),
    onTalk: (who) => patientEl.classList.toggle('talking', who === 'patient'),
    onReset: () => restart(),
    onHelper: () => repeatPrompt(),
    nudge: {
      ready: () => ACTIVE.includes(state) && nudges < MAX_NUDGES,
      key: () => stepKey(),
      fire: (rearm) => {
        nudges += 1;
        snap();
        if (state === 'wash' || state === 'sticker') {
          restartAnim(kit.trayItem(wantedItem()), 'nudge');
          kit.talk(promptLines()).then(rearm);
          return;
        }
        if (MEASURE_STATES.includes(state)) {
          nudgeMeasure();
          kit.talk(measurePrompt()).then(rearm);
          return;
        }
        const step = curStep();
        if (step.type === 'touch') setGlow(step.target);
        else restartAnim(kit.trayItem(step.item), 'nudge');
        const { who, line } = stepPrompt(step, level);
        kit.talk([{ who, line }]).then(rearm);
      },
    },
    tray: {
      face: (id) => trayFace(id),
      label: (id) => (WASH_BY.has(id) ? WASH_BY.get(id).name : stickerById(id) ? `${stickerById(id).color} ${stickerById(id).shape}` : id.startsWith('n-') ? id.slice(2) : ITEM_BY_ID.get(id).name),
      canGive: () => ACTIVE.includes(state),
      // Rửa tay / tặng sticker: thả ở đâu cũng được (đồ tự tới tay / tự dán lên bạn thú).
      dropOk: (x, y) => state === 'wash' || state === 'sticker' || state === 'howmany' || Boolean(regionAtScreen(x, y)),
      give: (id, from) => (state === 'wash' ? useWash(id, from) : state === 'sticker' ? giveSticker(id, from) : state === 'howmany' ? pickBlocks(id) : give(id, from)),
    },
  });
  const { stage, count, talk } = kit;
  count.classList.add('dr-count');
  kit.sayBox.classList.add('dr-say');
  kit.trayEl.classList.add('dr-tray');
  const bed = h('div.dr-bed', { 'aria-hidden': 'true' });
  stage.append(bed, patientEl, washEl, measureEl);
  const stepKey = () => `${kit.epoch}:${caseIdx}:${stepIdx}:${washed.length}:${mWho}:${mCount}:${state}`;
  /** Hình trong khay: đồ rửa tay (emoji / khăn vẽ), sticker (SVG), đồ khám chữa (ảnh bố mẹ thêm hoặc emoji). */
  function trayFace(id) {
    if (WASH_BY.has(id)) {
      return id === 'towel' ? h('span.dr-item-face.dr-svg-face', { 'aria-hidden': 'true', html: TOWEL_SVG }) : h('span.dr-item-face', { text: WASH_BY.get(id).emoji, 'aria-hidden': 'true' });
    }
    const st = stickerById(id);
    if (st) return h('span.dr-item-face.dr-svg-face', { 'aria-hidden': 'true', html: stickerShape(st) });
    if (id.startsWith('n-')) return h('span.dr-item-face.dr-num-face', { 'aria-hidden': 'true', text: id.slice(2) });
    return itemFace(ITEM_BY_ID.get(id), images);
  }
  /** Món cần đưa (để nhắc / nhún): món rửa tay tiếp theo, sticker khớp yêu cầu. */
  function wantedItem() {
    if (state === 'wash') return nextWash(level, washed) ?? washFor(level).find((id) => !washed.includes(id));
    const s = sticker();
    return stickerId(s.set.find((st) => matchesSticker(st, s.want)));
  }
  /** Câu của bước rửa tay / sticker (nhắc, chạm Bông). */
  function promptLines() {
    if (state === 'wash') {
      const want = nextWash(level, washed);
      return want ? [B(washFirstLine(want))] : [B(WASH_START_LINE)];
    }
    const s = sticker();
    return [P(STICKER_ASK_LINE), ...(s.want ? [P(stickerWantLine(s.want))] : [])];
  }

  // ---------- Vẽ ----------
  const group = (cls) => patientEl.querySelector(`.${cls}`);
  function renderPatient() {
    const c = curCase();
    const p = curPatient();
    patientEl.innerHTML = patientSvg(p.id, { mood: !c ? 'happy' : c.face === 'sleepy' ? 'sleepy' : 'sad', sign: c?.sign ?? null, title: p.name });
    patientEl.dataset.patient = p.id;
    patientEl.dataset.case = cases[caseIdx].id;
    count.textContent = `${caseIdx + 1}/${cases.length}`;
  }
  const setMood = (mood) => {
    const g = group('dr-face');
    if (g) g.innerHTML = faceSvg(mood);
  };
  /** Viền sáng chỗ đau: 'dr-glow' nhấp nháy (gợi ý), 'dr-picked' sáng nhẹ (chạm đúng). */
  const setGlow = (region, cls = 'dr-glow') => {
    const g = group('dr-glows');
    if (g) g.innerHTML = region ? glowSvg(region, cls) : '';
  };
  const renderTray = () => kit.renderTray(tray);
  function setState(s) {
    state = s;
    kit.setState(s, ACTIVE.includes(s));
  }

  // ---------- Tọa độ: màn hình ⇄ viewBox của bạn thú ----------
  const svgEl = () => patientEl.querySelector('svg');
  function toView(x, y) {
    const m = svgEl()?.getScreenCTM();
    return m ? new DOMPoint(x, y).matrixTransform(m.inverse()) : null;
  }
  function toScreen(x, y) {
    const m = svgEl()?.getScreenCTM();
    if (!m) return center(patientEl.getBoundingClientRect());
    const p = new DOMPoint(x, y).matrixTransform(m);
    return { x: p.x, y: p.y };
  }
  const regionAtScreen = (x, y) => {
    const p = toView(x, y);
    return p ? regionAt(p.x, p.y) : null;
  };
  /** Vùng đồ bay tới: theo đồ, không thì chỗ đau của ca. */
  const targetOf = (id) => ITEM_TARGET[id] ?? curCase().steps.find((s) => s.type === 'touch')?.target ?? 'tummy';

  // ---------- Lưu để chơi tiếp, tiến độ ----------
  const snap = () => saveSnap(JOB, { level, cases, caseIdx, stepIdx, wrongs, nudges, tray, recorded: [...recorded], washed: [...washed], washDone, mWho, mCount, phase: state });
  const saveProgress = () => app.setSetting('doctorGame', progress).catch(() => {});

  /**
   * Nhận một thao tác đúng: sang bước sau NGAY (một lần duy nhất). Hết bước thì ca khỏi: ghi `seen`,
   * lưu để chơi tiếp là ca sau — ra nền / 🧹 giữa hoạt ảnh không làm mất hay lặp kết quả.
   */
  function accept() {
    stepIdx += 1;
    wrongs = 0;
    nudges = 0;
    tray = [];
    if (stepIdx >= steps().length) {
      if (!recorded.has(`seen:${caseIdx}`)) {
        recorded.add(`seen:${caseIdx}`);
        progress = afterHealed(progress, curCase().id);
        saveProgress();
      }
      // Khỏi rồi: lưu ở bước tặng sticker — ra nền rồi quay lại thì bạn thú vẫn xin sticker (SPEC-doctor2 mục 4).
      saveSnap(JOB, { level, cases, caseIdx, stepIdx, wrongs: 0, nudges: 0, tray: [], recorded: [...recorded], washed: [...washed], washDone, phase: 'sticker' });
    } else snap();
  }

  // ---------- Ca, bước ----------
  async function startCase(resume = null) {
    const e = kit.epoch;
    stepIdx = resume?.stepIdx ?? 0;
    wrongs = resume?.wrongs ?? 0;
    nudges = resume?.nudges ?? 0;
    tray = [];
    washEl.hidden = true;
    if (isCheckup() && resume?.phase !== 'sticker') {
      startCheckup(resume);
      return;
    }
    measureEl.hidden = true;
    bed.hidden = false;
    patientEl.hidden = false;
    setState('enter');
    renderPatient();
    renderTray();
    if (resume?.phase === 'sticker') {
      // Ra nền sau khi khỏi, chưa dán sticker: bạn thú khỏe (mặt vui), xin sticker lại.
      setMood('happy');
      const sign = group('dr-sign');
      if (sign) sign.innerHTML = '';
      startSticker();
      return;
    }
    snap();
    if (resume) {
      beginStep(resume);
      return;
    }
    patientEl.classList.remove('leave');
    restartAnim(patientEl, 'enter');
    play('doorbell');
    await wait(ENTER_MS);
    if (e !== kit.epoch) return;
    await talk([B(COME_IN_LINE), P(HELLO_DOCTOR_LINE), P(curCase().say)]);
    if (e !== kit.epoch) return;
    beginStep();
  }

  /** Vào bước hiện tại: khay (bước khám / chữa), gợi ý có sẵn, câu của bước. Chơi tiếp: bạn thú nói lại triệu chứng trước. */
  async function beginStep(resume = null) {
    const e = kit.epoch;
    const step = curStep();
    if (!step) {
      heal();
      return;
    }
    tray = step.type === 'touch' ? [] : resume?.tray?.length ? resume.tray : trayFor(step, level);
    renderTray();
    const named = step.type === 'check' || level <= 1;
    if (step.type === 'touch') setGlow(level <= 1 || wrongs >= 2 || nudges > 0 ? step.target : null);
    else setGlow(null);
    if (step.type !== 'touch' && wrongs >= (named ? 1 : 2)) kit.setHint(step.item);
    setState(step.type);
    snap();
    const { who, line } = stepPrompt(step, level);
    await talk([...(resume ? [P(curCase().say)] : []), { who, line }]);
    if (e === kit.epoch) kit.armNudge();
  }

  /** Chạm vào người bạn thú (bước chạm chỗ đau). */
  function touchRegion(region) {
    const step = curStep();
    if (region === step.target) {
      acceptTouch(region);
      return;
    }
    if (!countWrong(`r:${region}`)) return;
    if (level >= 2 && wrongs >= 2) setGlow(step.target);
    const k = stepKey();
    talk([P(wrongTouchLine(region, curCase()))]).then(() => k === stepKey() && kit.armNudge());
  }

  /** Một lần nhầm (chạm nhầm chỗ / đưa nhầm đồ). Chạm lại đúng chỗ / đồ đó trong 0,4 giây thì gộp, trả về false. */
  function countWrong(key) {
    const now = Date.now();
    if (key === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return false;
    lastWrong = { key, at: now };
    wrongs += 1;
    snap();
    kit.clearNudge();
    play('boing');
    restartAnim(patientEl, 'shake');
    return true;
  }

  async function acceptTouch(region) {
    const e = kit.epoch;
    const c = curCase();
    setState('busy');
    kit.clearNudge();
    const r = REGIONS[region];
    if (r.body && !recorded.has(`body:${caseIdx}`)) {
      recorded.add(`body:${caseIdx}`);
      markPracticed(app, r.body, r.emoji);
    }
    accept();
    play('ding');
    setGlow(region, 'dr-picked');
    await talk([P(yesTouchLine(c))]);
    if (e !== kit.epoch) return;
    nextStep();
  }

  /** Bé đưa một đồ (kéo-thả lên người bạn thú hoặc chạm trong khay). */
  function give(id, from) {
    if (state !== 'check' && state !== 'treat') return;
    const step = curStep();
    if (id === step.item) {
      acceptItem(id, from);
      return;
    }
    if (!countWrong(`i:${id}`)) return;
    restartAnim(kit.trayItem(id), 'shake');
    const { line, hint } = wrongItemLine(id, step, level, wrongs);
    if (hint) {
      kit.setHint(step.item);
      restartAnim(kit.trayItem(step.item), 'nudge');
    }
    const k = stepKey();
    talk([{ who: step.type === 'check' ? 'bong' : 'patient', line }]).then(() => k === stepKey() && kit.armNudge());
  }

  async function acceptItem(id, from) {
    const e = kit.epoch;
    const c = curCase();
    const step = curStep();
    setState('busy');
    kit.clearNudge();
    kit.setHint(null);
    accept();
    const region = targetOf(id);
    const spot = regionPoint(region, 0);
    const ghost = await kit.flyTo(itemFace(ITEM_BY_ID.get(id), images), from, toScreen(spot.x, spot.y));
    if (e !== kit.epoch) return;
    play(ITEM_SOUND[id] ?? 'pop');
    ghost.classList.add(`use-${id}`);
    const { who, line } = doneLine(c, step);
    await Promise.all([talk([{ who, line }]), wait(USE_MS)]);
    if (e !== kit.epoch) return;
    if (id === 'flashlight' && c.id === 'tooth') {
      await wait(SAY_AAH_MS);
      if (e !== kit.epoch) return;
    }
    // Ca tai: soi đèn thấy bọ rùa → bọ bay ra khỏi tai.
    if (step.effect === 'bug') {
      const bug = h('div.dr-bug', { text: '🐞', 'aria-hidden': 'true' });
      const at = toScreen(spot.x, spot.y);
      Object.assign(bug.style, { left: `${at.x}px`, top: `${at.y}px` });
      document.body.append(bug);
      play('sparkle');
      await wait(BUG_MS);
      bug.remove();
      if (e !== kit.epoch) return;
    }
    // Ca buồn ngủ: đắp chăn, mắt nhắm, zZz 2 giây.
    if (id === 'blanket') {
      setMood('sleep');
      const z = h('div.dr-zzz', { text: '💤', 'aria-hidden': 'true' });
      const head = regionPoint('head', 0);
      const at = toScreen(head.x, head.y);
      Object.assign(z.style, { left: `${at.x}px`, top: `${at.y}px` });
      document.body.append(z);
      await wait(REST_MS);
      z.remove();
      if (e !== kit.epoch) return;
    }
    // Băng dán ở lại trên người bạn thú (cả lúc ra về).
    if (id === 'bandage') {
      const url = images?.item.get('bandage');
      group('dr-applied')?.insertAdjacentHTML('beforeend', url
        ? `<image class="dr-applied-item" href="${url}" x="${spot.x - 22}" y="${spot.y - 22}" width="44" height="44"/>`
        : `<text class="dr-applied-item" x="${spot.x}" y="${spot.y}" text-anchor="middle" dominant-baseline="central" font-size="34">🩹</text>`);
    }
    kit.removeGhost(ghost);
    nextStep();
  }

  function nextStep() {
    if (stepIdx < steps().length) beginStep();
    else heal();
  }

  async function heal() {
    const e = kit.epoch;
    const c = curCase();
    setState('healed');
    tray = [];
    renderTray();
    setGlow(null);
    setMood('happy');
    const sign = group('dr-sign');
    if (sign) sign.innerHTML = '';
    play('sparkle');
    restartAnim(patientEl, 'hop');
    await talk([P(betterLine(c)), B(GOOD_JOB_LINE)]);
    if (e !== kit.epoch) return;
    startSticker();
  }

  // ---------- Ca đo chiều cao (SPEC-doctor2 mục 5, DR2) ----------
  const nameOf = (pid) => PATIENT_BY_ID.get(pid)?.name ?? pid;
  const blockEl = (w, i) => measureEl.querySelector(`.dr-block[data-who="${w}"][data-i="${i}"]`);
  const tallerIdx = () => (cases[caseIdx].heights[0] > cases[caseIdx].heights[1] ? 0 : 1);
  /** Vẽ thước khối + bạn thú; khối đã đếm sáng (có số), mức 1 khối cần chạm tiếp nhấp nháy. */
  function renderMeasure() {
    const c = cases[caseIdx];
    const pids = [c.patient, c.patient2].filter(Boolean);
    measureEl.replaceChildren(...pids.map((pid, w) => {
      const n = c.heights[w];
      const counted = w < mWho ? n : w === mWho ? mCount : 0;
      const blocks = Array.from({ length: n }, (_, i) => h('button.dr-block', {
        type: 'button', 'aria-label': `Block ${i + 1}`, dataset: { who: String(w), i: String(i) }, text: String(i + 1),
        onclick: () => tapBlock(w, i),
      }));
      blocks.forEach((b, i) => {
        b.classList.toggle('lit', i < counted);
        b.classList.toggle('next', level <= 1 && w === mWho && i === counted && state === 'measure');
      });
      const pet = h('button.dr-measure-pet', {
        type: 'button', 'aria-label': nameOf(pid), dataset: { who: String(w), patient: pid }, style: { '--n': String(n) },
        html: patientSvg(pid, { mood: 'happy', title: nameOf(pid) }), onclick: () => tapPet(w),
      });
      return h('div.dr-measure-pair', {}, h('div.dr-blocks', {}, ...blocks), pet);
    }));
    measureEl.dataset.heights = c.heights.join(','); // cho test
  }
  function measurePrompt() {
    if (state === 'howmany') return [B(HOW_MANY_BLOCKS_LINE)];
    if (state === 'taller') return [B(TALLER_Q_LINE)];
    return [B(MEASURE_LINE)];
  }
  function nudgeMeasure() {
    const c = cases[caseIdx];
    if (state === 'howmany') restartAnim(kit.trayItem(`n-${c.heights[0]}`), 'nudge');
    else if (state === 'taller') restartAnim(measureEl.querySelector(`.dr-measure-pet[data-who="${tallerIdx()}"]`), 'nudge');
    else restartAnim(blockEl(mWho, mCount), 'nudge');
  }
  async function startCheckup(resume = null) {
    const e = kit.epoch;
    mWho = resume?.mWho ?? 0;
    mCount = resume?.mCount ?? 0;
    bed.hidden = true;
    patientEl.hidden = true;
    measureEl.hidden = false;
    count.textContent = `${caseIdx + 1}/${cases.length}`;
    tray = [];
    renderTray();
    if (resume?.phase === 'howmany') {
      renderMeasure();
      startHowMany();
      return;
    }
    if (resume?.phase === 'taller') {
      renderMeasure();
      startTaller();
      return;
    }
    // Nhận chạm khối ngay từ lúc vào ca.
    setState('measure');
    renderMeasure();
    snap();
    if (!resume) {
      restartAnim(measureEl, 'enter');
      play('doorbell');
    }
    await talk([...(resume ? [] : [B(COME_IN_LINE), P(CHECKUP_HELLO_LINE)]), B(MEASURE_LINE)]);
    if (e === kit.epoch && state === 'measure') kit.armNudge();
  }
  async function tapBlock(w, i) {
    if (state !== 'measure') return;
    const e = kit.epoch;
    const c = cases[caseIdx];
    if (w !== mWho || i !== mCount) {
      // Không phải khối tiếp theo: không tăng số đếm; khối cần chạm nhún. Mức 1 không tính nhầm.
      if (level >= 2) {
        if (!countWrong(`b:${w}:${i}`)) return;
      } else play('boing');
      restartAnim(blockEl(mWho, mCount), 'nudge');
      const k = stepKey();
      await talk([B(FROM_BOTTOM_LINE)]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    mCount += 1;
    wrongs = 0;
    nudges = 0;
    const n = c.heights[mWho];
    const doneOne = mCount >= n;
    if (doneOne) setState('busy');
    snap();
    kit.clearNudge();
    play('ding');
    renderMeasure();
    if (!doneOne) {
      const k = stepKey();
      await talk([B(blockCountLine(mCount))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    await talk([B(blockCountLine(mCount)), B(tallLine(n))]);
    if (e !== kit.epoch) return;
    if (level === 2) {
      startHowMany();
      return;
    }
    if (level >= 3 && mWho === 0) {
      // Mức 3: đo bạn thứ hai.
      mWho = 1;
      mCount = 0;
      setState('measure');
      renderMeasure();
      snap();
      await talk([{ who: 'patient2', line: CHECKUP_HELLO_LINE }, B(MEASURE_LINE)]);
      if (e === kit.epoch && state === 'measure') kit.armNudge();
      return;
    }
    if (level >= 3) startTaller();
    else finishCheckup();
  }
  /** Mức 2: "How many blocks?" — 3 thẻ số (sinh sẵn), đúng một thẻ. */
  async function startHowMany() {
    const e = kit.epoch;
    tray = cases[caseIdx].choices.map((n) => `n-${n}`);
    renderTray();
    setState('howmany');
    snap();
    await talk([B(HOW_MANY_BLOCKS_LINE)]);
    if (e === kit.epoch && state === 'howmany') kit.armNudge();
  }
  async function pickBlocks(id) {
    if (state !== 'howmany') return;
    const e = kit.epoch;
    const n = cases[caseIdx].heights[0];
    const x = Number(id.slice(2));
    if (x !== n) {
      if (!countWrong(`n:${x}`)) return;
      restartAnim(kit.trayItem(id), 'shake');
      if (wrongs >= 2) restartAnim(kit.trayItem(`n-${n}`), 'nudge');
      const k = stepKey();
      await talk([B(wrongBlocksLine(x))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    setState('busy');
    kit.clearNudge();
    if (wrongs === 0 && !recorded.has(`num:${caseIdx}`)) {
      recorded.add(`num:${caseIdx}`);
      markPracticed(app, numberKey(n), '🔢');
    }
    wrongs = 0;
    snap();
    play('ding');
    kit.trayItem(id)?.classList.add('hint');
    await talk([B(rightBlocksLine(n))]);
    if (e !== kit.epoch) return;
    finishCheckup();
  }
  /** Mức 3: "Who is taller?" — chạm bạn cao hơn. */
  async function startTaller() {
    const e = kit.epoch;
    tray = [];
    renderTray();
    setState('taller');
    snap();
    await talk([B(TALLER_Q_LINE)]);
    if (e === kit.epoch && state === 'taller') kit.armNudge();
  }
  async function tapPet(w) {
    if (state !== 'taller') return;
    const e = kit.epoch;
    const c = cases[caseIdx];
    const pids = [c.patient, c.patient2];
    const t = tallerIdx();
    if (w !== t) {
      if (!countWrong(`p:${w}`)) return;
      if (wrongs >= 2) restartAnim(measureEl.querySelector(`.dr-measure-pet[data-who="${t}"]`), 'nudge');
      const k = stepKey();
      await talk([B(wrongTallerLine(nameOf(pids[w])))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    setState('busy');
    kit.clearNudge();
    wrongs = 0;
    snap();
    play('ding');
    await talk([B(tallerLine(nameOf(pids[t]), nameOf(pids[1 - t])))]);
    if (e !== kit.epoch) return;
    finishCheckup();
  }
  /** Đo xong: ghi `seen` (một lần), bạn thú vui, rồi lên giường nhận sticker như ca bệnh. */
  async function finishCheckup() {
    const e = kit.epoch;
    setState('busy');
    if (!recorded.has(`seen:${caseIdx}`)) {
      recorded.add(`seen:${caseIdx}`);
      progress = afterHealed(progress, 'checkup');
      saveProgress();
    }
    saveSnap(JOB, { level, cases, caseIdx, stepIdx: 0, wrongs: 0, nudges: 0, tray: [], recorded: [...recorded], washed: [...washed], washDone, mWho, mCount, phase: 'sticker' });
    play('sparkle');
    restartAnim(measureEl, 'hop');
    await talk([P(GROWING_LINE), B(GOOD_JOB_LINE)]);
    if (e !== kit.epoch) return;
    measureEl.hidden = true;
    bed.hidden = false;
    patientEl.hidden = false;
    renderPatient();
    startSticker();
  }

  // ---------- Tặng sticker cho bạn thú (SPEC-doctor2 mục 4) ----------
  async function startSticker() {
    const e = kit.epoch;
    const s = sticker();
    tray = s.set.map(stickerId);
    renderTray();
    // Sticker cần chọn (cho test): '' = cái nào cũng được, 'blue-' = theo màu, 'blue-star' = màu + hình.
    patientEl.dataset.want = s.want ? `${s.want.color}-${s.want.shape ?? ''}` : '';
    setState('sticker');
    snap();
    await talk(promptLines());
    if (e === kit.epoch && state === 'sticker') kit.armNudge();
  }
  async function giveSticker(id, from) {
    if (state !== 'sticker') return;
    const e = kit.epoch;
    const s = sticker();
    const st = stickerById(id);
    if (!st) return;
    if (!matchesSticker(st, s.want)) {
      if (!countWrong(`s:${id}`)) return;
      restartAnim(kit.trayItem(id), 'shake');
      if (wrongs >= 2) restartAnim(kit.trayItem(wantedItem()), 'nudge');
      const k = stepKey();
      await talk([P(stickerWrongLine(st, s.want))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    // Đúng: nhận NGAY (một lần) — ghi tiến độ (đúng ngay lần đầu, mức 2–3), lưu để chơi tiếp là ca sau.
    setState('busy');
    kit.clearNudge();
    if (s.want && wrongs === 0 && !recorded.has(`sticker:${caseIdx}`)) {
      recorded.add(`sticker:${caseIdx}`);
      markPracticed(app, st.color, '');
      if (s.want.shape) markPracticed(app, st.shape, '');
    }
    wrongs = 0;
    nudges = 0;
    saveSnap(JOB, { level, cases, caseIdx: caseIdx + 1, stepIdx: 0, wrongs: 0, nudges: 0, tray: [], recorded: [...recorded], washed: [...washed], washDone, phase: 'start' });
    tray = [];
    const spot = regionPoint('tummy', 0);
    const ghost = await kit.flyTo(trayFace(id), from, toScreen(spot.x, spot.y));
    kit.renderTray([]);
    if (e !== kit.epoch) return;
    play('pop');
    kit.removeGhost(ghost);
    group('dr-applied')?.insertAdjacentHTML('beforeend', `<g class="dr-applied-item" transform="translate(${spot.x - 18} ${spot.y - 18})">${stickerShape(st, 36).replace('<svg ', '<svg x="0" y="0" ')}</g>`);
    await talk([P(stickerLoveLine(st)), P(BYE_LINE)]);
    if (e !== kit.epoch) return;
    leave();
  }

  async function leave() {
    const e = kit.epoch;
    setState('leave');
    restartAnim(patientEl, 'leave');
    await wait(LEAVE_MS);
    if (e !== kit.epoch) return;
    caseIdx += 1;
    if (caseIdx >= cases.length) finishRound();
    else startCase();
  }

  /** Xong 3 ca: Hoan hô + sticker (một lần), đếm lượt. */
  function finishRound() {
    if (state === 'done') return;
    setState('done');
    kit.finishRound(() => {
      clearSnap(JOB);
      progress = afterDoctorRound(progress);
      saveProgress();
    });
  }

  /** 🧹: khám lại từ ca 1 với cùng 3 ca, cùng bạn thú. */
  function restart() {
    if (state === 'done' || !cases.length) return;
    kit.cancelAll();
    caseIdx = 0;
    washed = [];
    washDone = false;
    startWash();
  }

  // ---------- Rửa tay đầu lượt (SPEC-doctor2 mục 3) ----------
  function renderWash() {
    const has = (id) => washed.includes(id);
    washEl.classList.toggle('soap', has('soap') && !has('rinse'));
    washEl.classList.toggle('water', has('rinse') && !has('towel'));
    washEl.classList.toggle('dry', has('towel'));
    washEl.classList.toggle('gloves', has('gloves'));
  }
  async function startWash() {
    const e = kit.epoch;
    bed.hidden = true;
    patientEl.hidden = true;
    measureEl.hidden = true;
    washEl.hidden = false;
    count.textContent = `1/${cases.length}`;
    renderWash();
    tray = washFor(level).filter((id) => !washed.includes(id));
    renderTray();
    // Nhận đồ ngay từ lúc Bông nói.
    setState('wash');
    snap();
    await talk([B(WASH_START_LINE)]);
    if (e === kit.epoch && state === 'wash') kit.armNudge();
  }
  async function useWash(id, from) {
    if (state !== 'wash' || washed.includes(id)) return;
    const e = kit.epoch;
    const want = nextWash(level, washed);
    if (want && id !== want) {
      if (!countWrong(`w:${id}`)) return;
      restartAnim(kit.trayItem(id), 'shake');
      if (wrongs >= 2) restartAnim(kit.trayItem(want), 'nudge');
      const k = stepKey();
      await talk([B(washFirstLine(want))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    // Dùng món: nhận NGAY, món rời khay (chạm lại không tính hai lần).
    washed.push(id);
    wrongs = 0;
    nudges = 0;
    const all = washFor(level).every((x) => washed.includes(x));
    if (all) {
      washDone = true;
      setState('busy');
    }
    snap();
    kit.clearNudge();
    tray = washFor(level).filter((x) => !washed.includes(x));
    renderTray();
    const ghost = await kit.flyTo(trayFace(id), from, center(washEl.getBoundingClientRect()));
    kit.removeGhost(ghost);
    if (e !== kit.epoch) return;
    play(id === 'rinse' ? 'whoosh' : 'pop');
    renderWash();
    restartAnim(washEl, 'rub');
    if (!all) {
      const k = stepKey();
      await talk([B(WASH_BY.get(id).line)]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    await Promise.all([talk([B(WASH_BY.get(id).line)]), wait(WASH_MS)]);
    if (e !== kit.epoch) return;
    play('sparkle');
    await talk([B(WASH_DONE_LINE)]);
    if (e !== kit.epoch) return;
    caseIdx = 0;
    startCase();
  }

  /** Chạm Bông y tá: nói lại câu của bước hiện tại. */
  function repeatPrompt() {
    if (state === 'wash' || state === 'sticker') {
      const k = stepKey();
      talk(promptLines()).then(() => k === stepKey() && kit.armNudge());
      return;
    }
    if (MEASURE_STATES.includes(state)) {
      const k = stepKey();
      talk(measurePrompt()).then(() => k === stepKey() && kit.armNudge());
      return;
    }
    if (!STEP_STATES.includes(state)) return;
    const { who, line } = stepPrompt(curStep(), level);
    const k = stepKey();
    talk([{ who, line }]).then(() => k === stepKey() && kit.armNudge());
  }

  // ---------- Chạm bạn thú ----------
  patientEl.addEventListener('pointerdown', (e) => {
    // Đang kéo đồ bằng ngón 1 mà ngón 2 chạm bạn thú: bỏ qua ngón 2.
    if (kit.pressing || e.button > 0) return;
    const region = regionAtScreen(e.clientX, e.clientY);
    if (!region) return; // chạm ra ngoài người: không có gì
    if (state === 'touch') touchRegion(region);
    else if (state === 'check' || state === 'treat') {
      // Nghe lại triệu chứng: không tính nhầm, không đổi bước.
      const k = stepKey();
      talk([P(curCase().say)]).then(() => k === stepKey() && kit.armNudge());
    }
  }, { signal: kit.signal });

  // ---------- Bắt đầu / chơi tiếp (sau khi nạp ảnh bố mẹ thêm) ----------
  loadDoctorImages(app).catch(() => null).then((loaded) => {
    images = loaded;
    if (kit.signal.aborted) return;
    if (images?.bg) {
      stage.style.backgroundImage = `url("${images.bg}")`;
      stage.classList.add('has-bg');
    }
    const s = takeSnap(JOB, { level, continueDirectly: params.continueDirectly });
    if (s) {
      cases = s.cases;
      caseIdx = s.caseIdx;
      recorded = new Set(s.recorded ?? []);
      washed = s.washed ?? [];
      washDone = s.washDone ?? true;
      if (!washDone) startWash();
      // Ra nền sau khi ca cuối đã khỏi: hoan hô + sticker luôn.
      else if (caseIdx >= cases.length) {
        caseIdx = cases.length - 1;
        renderPatient();
        finishRound();
      } else startCase(s);
    } else {
      // Bộ sticker của từng ca sinh sẵn cùng kế hoạch lượt (ra nền không bốc lại).
      cases = planDoctorRound(level, { seen: progress.seen });
      caseIdx = 0;
      startWash();
    }
  });

  kit.onCleanup(() => images?.revoke());
  return kit.cleanup;
}
