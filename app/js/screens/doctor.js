// Trò Bác sĩ nhí (SPEC-doctor.md): bạn thú vào phòng khám kêu đau, Bông y tá hướng dẫn. Mỗi ca làm lần lượt các bước
// của ca (chạm chỗ đau → khám → chữa, theo mức) rồi khỏe lại, cảm ơn, ra về. 3 ca → Hoan hô + sticker.
// Trạng thái (mục 8): enter → touch / check / treat ⇄ busy → healed → leave → ca sau | done.
// Nhận một thao tác đúng = chuyển bước NGAY (ghi tiến độ, lưu để chơi tiếp); hoạt ảnh + câu nói chỉ để trình diễn.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { homeButton } from '../player/layout.js';
import { createBunny, Teacher } from '../player/teacher.js';
import { runCompletion } from '../player/completion-stage.js';
import { markPracticed } from '../player/track.js';
import { scaled } from '../timing.js';
import { patientSvg, faceSvg, glowSvg } from '../patients.js';
import {
  CASE_BY_ID, PATIENT_BY_ID, ITEM_BY_ID, REGIONS, regionAt, regionPoint, stepsFor, trayFor, pickCases,
  cleanDoctorState, afterDoctorRound, afterHealed, stepPrompt, wrongItemLine, doneLine, betterLine,
  COME_IN_LINE, HELLO_DOCTOR_LINE, GOOD_JOB_LINE, BYE_LINE, yesTouchLine, wrongTouchLine,
} from '../doctor.js';

const NUDGE_MS = 10_000;
const MAX_NUDGES = 2;
const WRONG_LOCK_MS = 400; // chạm nhầm cùng một chỗ / cùng một đồ trong chừng này: gộp thành một lần nhầm
const DRAG_START_PX = 8;
const FLY_MS = 380;
const USE_MS = 1100; // hoạt ảnh dùng đồ (chải răng, hỉ mũi…), không quá 2 giây
const SAY_AAH_MS = 2000; // "Open wide! Say aah!": chờ bé nói theo
const ENTER_MS = 650;
const LEAVE_MS = 600;
const CAPTION_MS = 3500;
const IDLE_PAUSE_MS = 120_000;
const SNAPSHOT_MS = 10 * 60_000;
const STEP_STATES = ['touch', 'check', 'treat'];
/** Đồ bay tới vùng nào; null = chỗ đau của ca (vùng của bước chạm). */
const ITEM_TARGET = {
  bandage: null, medicine: 'mouth', tissue: 'nose', toothbrush: 'mouth', drops: 'eye', icepack: 'head', water: 'mouth',
  blanket: 'tummy', stethoscope: 'tummy', thermometer: 'hand', flashlight: null,
};
const ITEM_SOUND = { bandage: 'pop', medicine: 'chomp', tissue: 'honk', toothbrush: 'brush', stethoscope: 'ding' };

// Lượt đang chơi: app ra nền thì màn được dựng lại (continueDirectly) — chơi tiếp đúng ca, đúng bước (mục 9).
let snapshot = null;

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const center = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
const restartAnim = (el, cls) => {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
};

export function doctorScreen(app, params = {}) {
  const signal = app.startActivity();
  app.root.className = 'child-screen dr-play';
  let progress = cleanDoctorState(app.settings.doctorGame);
  const level = progress.level; // đổi mức giữa lượt: áp dụng từ lượt sau
  let epoch = 0; // 🧹 / rời màn / chơi tiếp đổi mã: việc cũ (câu nói, hẹn giờ, hoạt ảnh) không được đụng vào việc mới
  let cases = [];
  let caseIdx = 0;
  let stepIdx = 0;
  let wrongs = 0;
  let nudges = 0;
  let state = 'start';
  let tray = [];
  let nudgeTimer = null;
  let lastWrong = { key: '', at: 0 };
  let press = null;
  let dragGhost = null;
  let talking = false;
  const flying = new Set();

  // ---------- Giao diện ----------
  const bunny = createBunny(app);
  const nurse = h('button.sp-bong.dr-nurse', {
    type: 'button', 'aria-label': 'Bông y tá',
    onclick: () => {
      play('tap');
      repeatPrompt();
    },
  }, bunny.el, h('span.dr-cap', { 'aria-hidden': 'true' }));
  const back = h('button.sp-back', {
    type: 'button', 'aria-label': 'Về trò chơi', text: '🎲',
    onclick: () => {
      play('tap');
      app.go('play');
    },
  });
  const resetBtn = h('button.sp-back', {
    type: 'button', 'aria-label': 'Khám lại', text: '🧹',
    onclick: () => {
      play('tap');
      restart();
    },
  });
  const count = h('span.ms-count.dr-count');
  const patientEl = h('div.dr-patient');
  const stage = h('div.dr-stage', {}, h('div.dr-bed', { 'aria-hidden': 'true' }), patientEl);
  const sayBox = h('div.ms-say.dr-say');
  const trayEl = h('div.dr-tray.off', { 'aria-label': 'Đồ của bác sĩ' });
  app.root.append(
    h('header.child-top.sp-top', {}, homeButton(app), back, resetBtn, h('span.sp-title', { text: '🩺 Doctor' }), count, nurse),
    stage, sayBox, trayEl,
  );

  // ---------- Nói + phụ đề (hàng riêng, có hình người đang nói) ----------
  const curCase = () => CASE_BY_ID.get(cases[caseIdx]?.id);
  const curPatient = () => PATIENT_BY_ID.get(cases[caseIdx]?.patient);
  const steps = () => stepsFor(curCase(), level);
  const curStep = () => steps()[stepIdx];
  const stepKey = () => `${epoch}:${caseIdx}:${stepIdx}`;
  const P = (line) => ({ who: 'patient', line });
  const B = (line) => ({ who: 'bong', line });

  let talkGen = 0;
  let captionTimer = null;
  function caption(en, vi, who) {
    clearTimeout(captionTimer);
    const icon = who === 'patient' ? curPatient()?.emoji ?? '' : '🐰';
    sayBox.replaceChildren(h('div.caption.sp-caption', { 'aria-live': 'polite', dataset: { who } },
      h('span.caption-en', {}, h('span.dr-who', { text: icon, 'aria-hidden': 'true' }), en),
      vi ? h('span.caption-vi', { text: vi }) : null));
  }
  /**
   * Một hàng nói: câu mới thay câu cũ. Trả về false nếu bị thay / rời màn.
   * Giọng đọc lỗi thì vẫn đi tiếp (phụ đề vẫn hiện), bé không bị kẹt.
   */
  async function talk(lines) {
    const gen = ++talkGen;
    talking = true;
    try {
      for (const { who, line: [en, vi] } of lines) {
        if (gen !== talkGen || signal.aborted) return false;
        caption(en, vi, who);
        patientEl.classList.toggle('talking', who === 'patient');
        try {
          await app.speaker.speak(en, { signal });
        } catch {
          if (signal.aborted) return false;
        }
      }
    } finally {
      if (gen === talkGen) {
        talking = false;
        patientEl.classList.remove('talking');
      }
    }
    if (gen === talkGen) captionTimer = setTimeout(() => sayBox.replaceChildren(), CAPTION_MS);
    return gen === talkGen;
  }
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, scaled(ms)));

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
  function renderTray() {
    trayEl.classList.toggle('off', !tray.length);
    trayEl.replaceChildren(...tray.map((id) => {
      const item = ITEM_BY_ID.get(id);
      const btn = h('button.dr-item', { type: 'button', 'aria-label': item.name, dataset: { item: id } },
        h('span.dr-item-face', { text: item.emoji, 'aria-hidden': 'true' }));
      btn.addEventListener('pointerdown', (e) => beginPress(e, id));
      return btn;
    }));
  }
  const trayItem = (id) => trayEl.querySelector(`[data-item="${id}"]`);
  const setHint = (id) => {
    for (const el of trayEl.children) el.classList.toggle('hint', el.dataset.item === id);
  };
  function setState(s) {
    state = s;
    app.root.dataset.state = s;
    trayEl.classList.toggle('locked', !STEP_STATES.includes(s));
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
  const base = () => ({ savedAt: Date.now(), level, cases });
  function snap() {
    snapshot = { ...base(), caseIdx, stepIdx, wrongs, nudges, tray };
  }
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
      progress = afterHealed(progress, curCase().id);
      saveProgress();
      snapshot = { ...base(), caseIdx: caseIdx + 1, stepIdx: 0, wrongs: 0, nudges: 0, tray: [] };
    } else snap();
  }

  // ---------- Nhắc khi 10 giây không thao tác (mục 4.3) ----------
  function clearNudge() {
    clearTimeout(nudgeTimer);
    nudgeTimer = null;
  }
  function armNudge() {
    clearNudge();
    if (!STEP_STATES.includes(state) || nudges >= MAX_NUDGES) return;
    const k = stepKey();
    nudgeTimer = setTimeout(() => {
      if (k !== stepKey() || !STEP_STATES.includes(state) || app.idlePaused || signal.aborted) return;
      // Đang nói (câu hỏi, câu nhầm): đếm lại — nhắc chỉ khi bé thật sự đang chờ.
      if (talking) {
        armNudge();
        return;
      }
      nudges += 1;
      snap();
      const step = curStep();
      if (step.type === 'touch') setGlow(step.target);
      else restartAnim(trayItem(step.item), 'nudge');
      const { who, line } = stepPrompt(step, level);
      talk([{ who, line }]).then(() => k === stepKey() && armNudge());
    }, scaled(NUDGE_MS));
  }

  // ---------- Ca, bước ----------
  function cancelAll() {
    epoch += 1;
    talkGen += 1;
    clearNudge();
    app.speaker.cancel?.();
    endDrag();
    press = null;
    for (const g of flying) g.remove();
    flying.clear();
  }

  async function startCase(resume = null) {
    const e = epoch;
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
    if (e !== epoch) return;
    await talk([B(COME_IN_LINE), P(HELLO_DOCTOR_LINE), P(curCase().say)]);
    if (e !== epoch) return;
    beginStep();
  }

  /** Vào bước hiện tại: khay (bước khám / chữa), gợi ý có sẵn, câu của bước. Chơi tiếp: bạn thú nói lại triệu chứng trước. */
  async function beginStep(resume = null) {
    const e = epoch;
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
    if (step.type !== 'touch' && wrongs >= (named ? 1 : 2)) setHint(step.item);
    setState(step.type);
    snap();
    const { who, line } = stepPrompt(step, level);
    await talk([...(resume ? [P(curCase().say)] : []), { who, line }]);
    if (e === epoch) armNudge();
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
    talk([P(wrongTouchLine(region, curCase()))]).then(() => k === stepKey() && armNudge());
  }

  /** Một lần nhầm (chạm nhầm chỗ / đưa nhầm đồ). Chạm lại đúng chỗ / đồ đó trong 0,4 giây thì gộp, trả về false. */
  function countWrong(key) {
    const now = Date.now();
    if (key === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return false;
    lastWrong = { key, at: now };
    wrongs += 1;
    snap();
    clearNudge();
    play('boing');
    restartAnim(patientEl, 'shake');
    return true;
  }

  async function acceptTouch(region) {
    const e = epoch;
    const c = curCase();
    setState('busy');
    clearNudge();
    const r = REGIONS[region];
    if (r.body) markPracticed(app, r.body, r.emoji);
    accept();
    play('ding');
    setGlow(region, 'dr-picked');
    await talk([P(yesTouchLine(c))]);
    if (e !== epoch) return;
    nextStep();
  }

  /** Bé đưa một đồ (kéo-thả lên người bạn thú hoặc chạm trong khay). */
  async function give(id, from) {
    if (state !== 'check' && state !== 'treat') return;
    const step = curStep();
    if (id === step.item) {
      acceptItem(id, from);
      return;
    }
    if (!countWrong(`i:${id}`)) return;
    restartAnim(trayItem(id), 'shake');
    const { line, hint } = wrongItemLine(id, step, level, wrongs);
    if (hint) {
      setHint(step.item);
      restartAnim(trayItem(step.item), 'nudge');
    }
    const k = stepKey();
    talk([{ who: step.type === 'check' ? 'bong' : 'patient', line }]).then(() => k === stepKey() && armNudge());
  }

  async function acceptItem(id, from) {
    const e = epoch;
    const c = curCase();
    const step = curStep();
    setState('busy');
    clearNudge();
    setHint(null);
    accept();
    const region = targetOf(id);
    const ghost = await flyTo(id, from, region);
    if (e !== epoch) return;
    play(ITEM_SOUND[id] ?? 'pop');
    ghost.classList.add(`use-${id}`);
    const { who, line } = doneLine(c, step);
    await Promise.all([talk([{ who, line }]), wait(USE_MS)]);
    if (e !== epoch) return;
    if (id === 'flashlight' && c.id === 'tooth') {
      await wait(SAY_AAH_MS);
      if (e !== epoch) return;
    }
    // Băng dán ở lại trên người bạn thú (cả lúc ra về).
    if (id === 'bandage') {
      const spot = regionPoint(region, 0);
      group('dr-applied')?.insertAdjacentHTML('beforeend',
        `<text class="dr-applied-item" x="${spot.x}" y="${spot.y}" text-anchor="middle" dominant-baseline="central" font-size="34">🩹</text>`);
    }
    ghost.remove();
    flying.delete(ghost);
    nextStep();
  }

  function nextStep() {
    if (stepIdx < steps().length) beginStep();
    else heal();
  }

  async function heal() {
    const e = epoch;
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
    if (e !== epoch) return;
    setState('leave');
    restartAnim(patientEl, 'leave');
    await wait(LEAVE_MS);
    if (e !== epoch) return;
    caseIdx += 1;
    if (caseIdx >= cases.length) finishRound();
    else startCase();
  }

  /** Xong 3 ca: Hoan hô + sticker (một lần), đếm lượt. */
  async function finishRound() {
    if (state === 'done') return;
    cancelAll();
    setState('done');
    snapshot = null;
    progress = afterDoctorRound(progress);
    saveProgress();
    tray = [];
    renderTray();
    sayBox.replaceChildren();
    const teacher = new Teacher(app, { signal, bunny, stage });
    try {
      await runCompletion({ app, teacher, stage, signal });
      if (!signal.aborted) app.go('play');
    } catch {
      // rời màn giữa chừng
    }
  }

  /** 🧹: khám lại từ ca 1 với cùng 3 ca, cùng bạn thú. */
  function restart() {
    if (state === 'done' || !cases.length) return;
    cancelAll();
    caseIdx = 0;
    startCase();
  }

  /** Chạm Bông y tá: nói lại câu của bước hiện tại. */
  function repeatPrompt() {
    if (!STEP_STATES.includes(state)) return;
    const { who, line } = stepPrompt(curStep(), level);
    const k = stepKey();
    talk([{ who, line }]).then(() => k === stepKey() && armNudge());
  }

  // ---------- Đồ bay ----------
  function makeGhost(id) {
    const ghost = h('div.dr-fly', {}, h('span.dr-item-face', { text: ITEM_BY_ID.get(id).emoji, 'aria-hidden': 'true' }));
    document.body.append(ghost);
    flying.add(ghost);
    return ghost;
  }
  /** Đồ bay từ `from` tới vùng `region` trên người bạn thú. */
  async function flyTo(id, from, region) {
    const spot = regionPoint(region, 0);
    const to = toScreen(spot.x, spot.y);
    const ghost = makeGhost(id);
    Object.assign(ghost.style, { left: `${to.x}px`, top: `${to.y}px` });
    const ms = reduceMotion() ? 0 : scaled(FLY_MS);
    if (ms && from) {
      await ghost.animate([
        { transform: `translate(${from.x - to.x}px, ${from.y - to.y}px)` },
        { transform: 'translate(0, 0)' },
      ], { duration: ms, easing: 'ease-in-out' }).finished.catch(() => {});
    }
    return ghost;
  }
  async function flyBack(ghost, id) {
    const item = trayItem(id);
    const ms = reduceMotion() ? 0 : scaled(FLY_MS);
    if (item && ms) {
      const to = center(item.getBoundingClientRect());
      const from = center(ghost.getBoundingClientRect());
      await ghost.animate([{ transform: 'translate(0, 0)' }, { transform: `translate(${to.x - from.x}px, ${to.y - from.y}px) scale(0.6)`, opacity: 0.4 }],
        { duration: ms, easing: 'ease-out' }).finished.catch(() => {});
    }
    ghost.remove();
    flying.delete(ghost);
  }

  // ---------- Chạm bạn thú ----------
  patientEl.addEventListener('pointerdown', (e) => {
    // Đang kéo đồ bằng ngón 1 mà ngón 2 chạm bạn thú: bỏ qua ngón 2.
    if (press || e.button > 0) return;
    const region = regionAtScreen(e.clientX, e.clientY);
    if (!region) return; // chạm ra ngoài người: không có gì
    if (state === 'touch') touchRegion(region);
    else if (state === 'check' || state === 'treat') {
      // Nghe lại triệu chứng: không tính nhầm, không đổi bước.
      const k = stepKey();
      talk([P(curCase().say)]).then(() => k === stepKey() && armNudge());
    }
  }, { signal });

  // ---------- Kéo / chạm đồ trong khay ----------
  function beginPress(e, id) {
    if (press || e.button > 0) return;
    e.preventDefault();
    press = { id, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, dragging: false };
  }
  function moveDrag(e) {
    dragGhost.style.left = `${e.clientX}px`;
    dragGhost.style.top = `${e.clientY}px`;
  }
  function endDrag() {
    dragGhost?.remove();
    dragGhost = null;
    trayEl.querySelector('.lifted')?.classList.remove('lifted');
  }

  window.addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    if (!press.dragging) {
      if (Math.hypot(e.clientX - press.x0, e.clientY - press.y0) < DRAG_START_PX) return;
      press.dragging = true;
      play('tap');
      dragGhost = h('div.dr-fly.dr-drag', {}, h('span.dr-item-face', { text: ITEM_BY_ID.get(press.id).emoji, 'aria-hidden': 'true' }));
      document.body.append(dragGhost);
      trayItem(press.id)?.classList.add('lifted');
    }
    e.preventDefault();
    moveDrag(e);
  }, { signal, passive: false });

  window.addEventListener('pointerup', (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    const p = press;
    press = null;
    if (p.dragging) {
      const at = { x: e.clientX, y: e.clientY };
      const ghost = dragGhost;
      dragGhost = null;
      endDrag();
      // Thả ở bất kỳ đâu trên người bạn thú là được; ra ngoài thì đồ về khay, không tính nhầm.
      if (regionAtScreen(at.x, at.y) && STEP_STATES.includes(state)) {
        ghost.remove();
        give(p.id, at);
      } else {
        flying.add(ghost);
        flyBack(ghost, p.id);
      }
      return;
    }
    const item = trayItem(p.id);
    if (item) give(p.id, center(item.getBoundingClientRect()));
  }, { signal });

  window.addEventListener('pointercancel', (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    press = null;
    endDrag();
  }, { signal });

  // Bé chạm bất cứ đâu: tính lại thời gian nhắc.
  app.root.addEventListener('pointerdown', () => armNudge(), { signal });

  const idleTimer = setInterval(() => {
    app.idlePaused = Date.now() - app.lastTouchAt > IDLE_PAUSE_MS;
  }, 5000);

  // ---------- Bắt đầu / chơi tiếp ----------
  const s = snapshot;
  if (params.continueDirectly && s && Date.now() - s.savedAt < SNAPSHOT_MS && s.level === level) {
    cases = s.cases;
    caseIdx = s.caseIdx;
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

  return () => {
    cancelAll();
    clearInterval(idleTimer);
    clearTimeout(captionTimer);
    bunny.destroy();
  };
}
