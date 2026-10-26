// Trò Bác sĩ nhí (SPEC-doctor.md): bạn thú vào phòng khám kêu đau, Bông y tá hướng dẫn. Mỗi ca làm lần lượt các bước
// của ca (chạm chỗ đau → khám → chữa, theo mức) rồi khỏe lại, cảm ơn, ra về. 3 ca → Hoan hô + sticker.
// Trạng thái (mục 8): enter → touch / check / treat ⇄ busy → healed → leave → ca sau | done.
// Nhận một thao tác đúng = chuyển bước NGAY (ghi tiến độ, lưu để chơi tiếp); hoạt ảnh + câu nói chỉ để trình diễn.
// Phần chung với các nghề khác (nói, nhắc, khay, đồ bay, lượt, ra nền) ở jobs/kit.js (SPEC-jobs mục 2.3).

import { h } from '../ui.js';
import { mediaBlob } from '../db.js';
import { play } from '../speech/sfx.js';
import { markPracticed } from '../player/track.js';
import { patientSvg, faceSvg, glowSvg } from '../patients.js';
import {
  jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, WRONG_LOCK_MS, MAX_NUDGES,
} from '../jobs/kit.js';
import {
  CASE_BY_ID, PATIENT_BY_ID, ITEM_BY_ID, REGIONS, regionAt, regionPoint, stepsFor, trayFor, pickCases,
  cleanDoctorState, afterDoctorRound, afterHealed, stepPrompt, wrongItemLine, doneLine, betterLine,
  DOCTOR_ITEM_IMAGES, DOCTOR_BG_IMAGES, BG_KEY, COME_IN_LINE, HELLO_DOCTOR_LINE, GOOD_JOB_LINE, BYE_LINE, yesTouchLine, wrongTouchLine,
} from '../doctor.js';

const JOB = 'doctor';
const USE_MS = 1100; // hoạt ảnh dùng đồ (chải răng, hỉ mũi…), không quá 2 giây
const SAY_AAH_MS = 2000; // "Open wide! Say aah!": chờ bé nói theo
const ENTER_MS = 650;
const LEAVE_MS = 600;
const STEP_STATES = ['touch', 'check', 'treat'];
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

  const curCase = () => CASE_BY_ID.get(cases[caseIdx]?.id);
  const curPatient = () => PATIENT_BY_ID.get(cases[caseIdx]?.patient);
  const steps = () => stepsFor(curCase(), level);
  const curStep = () => steps()[stepIdx];
  const P = (line) => ({ who: 'patient', line });
  const B = (line) => ({ who: 'bong', line });
  const patientEl = h('div.dr-patient');

  const kit = jobScreen(app, {
    job: JOB, className: 'dr-play', stageClass: 'dr-stage', title: '🩺 Doctor', helperLabel: 'Bông y tá', cap: 'nurse',
    resetLabel: 'Khám lại', trayLabel: 'Đồ của bác sĩ',
    icon: (who) => (who === 'patient' ? curPatient()?.emoji ?? '' : '🐰'),
    pitch: (who) => (who === 'patient' ? curPatient()?.pitch : undefined),
    onTalk: (who) => patientEl.classList.toggle('talking', who === 'patient'),
    onReset: () => restart(),
    onHelper: () => repeatPrompt(),
    nudge: {
      ready: () => STEP_STATES.includes(state) && nudges < MAX_NUDGES,
      key: () => stepKey(),
      fire: (rearm) => {
        nudges += 1;
        snap();
        const step = curStep();
        if (step.type === 'touch') setGlow(step.target);
        else restartAnim(kit.trayItem(step.item), 'nudge');
        const { who, line } = stepPrompt(step, level);
        kit.talk([{ who, line }]).then(rearm);
      },
    },
    tray: {
      face: (id) => itemFace(ITEM_BY_ID.get(id), images),
      label: (id) => ITEM_BY_ID.get(id).name,
      canGive: () => STEP_STATES.includes(state),
      dropOk: (x, y) => Boolean(regionAtScreen(x, y)),
      give: (id, from) => give(id, from),
    },
  });
  const { stage, count, talk } = kit;
  count.classList.add('dr-count');
  kit.sayBox.classList.add('dr-say');
  kit.trayEl.classList.add('dr-tray');
  stage.append(h('div.dr-bed', { 'aria-hidden': 'true' }), patientEl);
  const stepKey = () => `${kit.epoch}:${caseIdx}:${stepIdx}`;

  // ---------- Vẽ ----------
  const group = (cls) => patientEl.querySelector(`.${cls}`);
  function renderPatient() {
    const c = curCase();
    const p = curPatient();
    patientEl.innerHTML = patientSvg(p.id, { mood: c.face === 'sleepy' ? 'sleepy' : 'sad', sign: c.sign, title: p.name });
    patientEl.dataset.patient = p.id;
    patientEl.dataset.case = c.id;
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
    kit.setState(s, STEP_STATES.includes(s));
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
  const snap = () => saveSnap(JOB, { level, cases, caseIdx, stepIdx, wrongs, nudges, tray, recorded: [...recorded] });
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
      saveSnap(JOB, { level, cases, caseIdx: caseIdx + 1, stepIdx: 0, wrongs: 0, nudges: 0, tray: [], recorded: [...recorded] });
    } else snap();
  }

  // ---------- Ca, bước ----------
  async function startCase(resume = null) {
    const e = kit.epoch;
    stepIdx = resume?.stepIdx ?? 0;
    wrongs = resume?.wrongs ?? 0;
    nudges = resume?.nudges ?? 0;
    tray = [];
    setState('enter');
    renderPatient();
    renderTray();
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
    await talk([P(betterLine(c)), B(GOOD_JOB_LINE), P(BYE_LINE)]);
    if (e !== kit.epoch) return;
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
    startCase();
  }

  /** Chạm Bông y tá: nói lại câu của bước hiện tại. */
  function repeatPrompt() {
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
      // Ra nền sau khi ca cuối đã khỏi: hoan hô + sticker luôn.
      if (caseIdx >= cases.length) {
        caseIdx = cases.length - 1;
        renderPatient();
        finishRound();
      } else startCase(s);
    } else {
      cases = pickCases(level, { seen: progress.seen });
      caseIdx = 0;
      startCase();
    }
  });

  kit.onCleanup(() => images?.revoke());
  return kit.cleanup;
}
