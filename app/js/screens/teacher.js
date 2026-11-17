// Trò Cô giáo nhí (SPEC-jobs.md mục 5): đảo vai — Bông làm học trò, nhìn hình trên bảng và giơ tay nói tên,
// đôi khi cố tình nói sai; bé chấm ✅ / ❌. Chấm đúng: Bông vui / Bông sửa lại; chấm nhầm: Bông nói lại, bé chọn lại.
// SPEC-jobs2 TE1: mở đầu lượt bé rung chuông + điểm danh lớp (chạm đúng bạn được gọi); một trong 5 việc là ca
// "Classroom actions" (bé chạm thẻ hành động, cả lớp làm theo). SPEC-jobs4 TE3: sau điểm danh bé chọn thẻ thời tiết
// theo cửa sổ lớp, thẻ gắn lên bảng thời tiết ở góc lớp. 5 việc → vở của Bông có 5 ⭐ → sticker.
// Trạng thái: bell → roll ⇄ busy → claim → judge | act ⇄ busy → việc sau | done. Khung chung ở jobs/kit.js.

import { h } from '../ui.js';
import { latestImageForWord, mediaBlob } from '../db.js';
import { play } from '../speech/sfx.js';
import { markPracticed } from '../player/track.js';
import { patientSvg } from '../patients.js';
import { PATIENT_BY_ID } from '../doctor.js';
import { cleanJobState, afterJobRound, afterSeen } from '../jobs/levels.js';
import { JOBS_BG_IMAGES } from '../jobs/backgrounds.js';
import { TEACHER_SVG, STUDENT_SVG, loadPersonImage } from '../jobs/people.js';
import { jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, WRONG_LOCK_MS, MAX_NUDGES } from '../jobs/kit.js';
import {
  MAX_LEVEL, NOUN_BY_EN, COUNTABLES, planLesson, claimLine, fixLine, practiceWord,
  YAY_LINE, OOPS_LINE, SURE_LINE, START_LINE, ASK_LINE, END_LINE,
  ACTION_BY_ID, ACTION_STEPS, BELL_LINE, MORNING_LINE, CLASS_MORNING_LINE, whereLine, HERE_LINE, notMeLine, ALL_HERE_LINE,
  WHAT_DO_LINE, canWeLine, cmdLine, wrongActionLine, ACTIONS_DONE_LINE,
  starsForLine, starCountLine, STAR_THANKS_LINE, haveStarsLine, GOODBYE_CLASS_LINE, GOODBYE_TEACHER_LINE,
  WEATHER_BY, HOW_WEATHER_LINE, itsWeatherLine, wrongWeatherLine, START_CLASS_LINE,
} from '../jobs/teacher.js';

const JOB = 'teacher';
const SAY_BACK_MS = 2000; // "Oops! What is it?": chờ bé nói tên
const ACT_MS = 1600; // cả lớp làm theo lệnh (bé làm theo nếu muốn)
const ACTIVE = ['judge', 'bell', 'roll', 'act', 'stars', 'wcard'];
const COLOR_HEX = { red: '#ff6b6b', blue: '#4dabf7', yellow: '#ffd43b', green: '#51cf66', pink: '#f783ac', orange: '#ff922b' };

/** Đồ tô màu của mức 3 (viewBox 100 × 100). */
function thingSvg(thing, color) {
  const c = COLOR_HEX[color];
  const ink = '#3d2c5e';
  if (thing === 'balloon') {
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="40" rx="28" ry="34" fill="${c}" stroke="${ink}" stroke-width="3"/>
      <path d="M50 74 l-5 6 h10 z" fill="${c}" stroke="${ink}" stroke-width="2"/><path d="M50 80 q-8 8 0 18" fill="none" stroke="${ink}" stroke-width="2"/></svg>`;
  }
  if (thing === 'star') {
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8 L62 38 L94 40 L69 60 L78 92 L50 74 L22 92 L31 60 L6 40 L38 38 Z" fill="${c}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/></svg>`;
  }
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="${c}" stroke="${ink}" stroke-width="3"/>
    <path d="M14 42 q36 18 72 0" fill="none" stroke="#fff" stroke-width="7" opacity="0.8"/></svg>`;
}

/** Cửa sổ lớp học (viewBox 120 × 100): khung gỗ, song cửa, trời theo thời tiết của buổi học (SPEC-jobs4 mục 9). */
function windowSvg(w) {
  const ink = 'stroke="#3d2c5e" stroke-width="2"';
  const cloud = (x, y, c = '#fff', k = 1) => `<g fill="${c}" ${ink}><path d="M${x - 16 * k} ${y} a${9 * k} ${9 * k} 0 0 1 ${8 * k} -${10 * k} a${11 * k} ${11 * k} 0 0 1 ${20 * k} -${2 * k} a${8 * k} ${8 * k} 0 0 1 ${6 * k} ${12 * k} z"/></g>`;
  const sun = (x, y, r, c) => `<g stroke="${c}" stroke-width="3" stroke-linecap="round">${Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    return `<path d="M${(x + Math.cos(a) * (r + 4)).toFixed(1)} ${(y + Math.sin(a) * (r + 4)).toFixed(1)} L${(x + Math.cos(a) * (r + 10)).toFixed(1)} ${(y + Math.sin(a) * (r + 10)).toFixed(1)}"/>`;
  }).join('')}</g><circle cx="${x}" cy="${y}" r="${r}" fill="${c}" ${ink}/>`;
  const scene = {
    sunny: `<rect width="120" height="100" fill="#74c0fc"/>${sun(40, 34, 14, '#ffd43b')}<rect y="78" width="120" height="22" fill="#69db7c"/>${cloud(92, 30)}`,
    rainy: `<rect width="120" height="100" fill="#adb5bd"/>${cloud(56, 34, '#868e96', 1.6)}<g class="tc-rain" stroke="#1c7ed6" stroke-width="3" stroke-linecap="round">${Array.from({ length: 9 }, (_, i) => `<path d="M${18 + i * 11} ${44 + (i % 3) * 10} l-4 9"/>`).join('')}</g><rect y="84" width="120" height="16" fill="#69db7c"/><ellipse cx="80" cy="90" rx="18" ry="4" fill="#4dabf7"/>`,
    cloudy: `<rect width="120" height="100" fill="#a5d8ff"/>${cloud(36, 34, '#dee2e6', 1.3)}${cloud(86, 46, '#ced4da', 1.5)}${cloud(58, 66, '#e9ecef', 1)}<rect y="84" width="120" height="16" fill="#69db7c"/>`,
    windy: `<rect width="120" height="100" fill="#74c0fc"/><g class="tc-wind" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M8 26 h40 a7 7 0 1 0 -7 -7"/><path d="M14 46 h52 a7 7 0 1 1 -7 7"/><path d="M60 22 h34"/></g><path d="M96 92 q-2 -22 6 -40" fill="none" stroke="#8d5a3b" stroke-width="5"/><ellipse cx="108" cy="46" rx="18" ry="12" fill="#51cf66" ${ink} transform="rotate(25 108 46)"/><g class="tc-leaves" fill="#51cf66" ${ink}><ellipse cx="70" cy="62" rx="4" ry="2.5"/><ellipse cx="52" cy="72" rx="4" ry="2.5"/><ellipse cx="80" cy="36" rx="4" ry="2.5"/></g><rect y="84" width="120" height="16" fill="#69db7c"/>`,
    hot: `<rect width="120" height="100" fill="#ffc078"/>${sun(60, 36, 20, '#f03e3e')}<g fill="none" stroke="#e8590c" stroke-width="2.5" stroke-linecap="round" class="tc-heat"><path d="M14 74 q6 -6 12 0 t12 0"/><path d="M80 70 q6 -6 12 0 t12 0"/></g><rect y="84" width="120" height="16" fill="#ffe066"/>`,
    cold: `<rect width="120" height="100" fill="#d0ebff"/><g class="tc-snow" fill="#fff" ${ink.replace('2', '1')}>${Array.from({ length: 11 }, (_, i) => `<circle cx="${10 + i * 10}" cy="${12 + ((i * 23) % 60)}" r="3"/>`).join('')}</g><path d="M0 82 q30 -10 60 0 t60 0 V100 H0 Z" fill="#fff" ${ink}/><circle cx="92" cy="74" r="8" fill="#fff" ${ink}/><circle cx="92" cy="62" r="6" fill="#fff" ${ink}/><path d="M92 62 l6 1.5 -6 1.5 z" fill="#ff922b"/>`,
  }[w] ?? '';
  return `<svg class="tc-window-svg" viewBox="0 0 120 100" aria-hidden="true">${scene}<g fill="none" stroke="#a9744a" stroke-width="5"><rect x="2.5" y="2.5" width="115" height="95" rx="4"/><path d="M60 3 V97 M3 50 H117"/></g></svg>`;
}

export function teacherScreen(app, params = {}) {
  let progress = cleanJobState(app.settings.teacherGame, { maxLevel: MAX_LEVEL });
  const level = progress.level;
  let plan = null; // việc trong buổi: [{ shown, claim, right } | { kind: 'actions', cards, asks, askers }]
  let klass = null; // { pupils, roll }
  let phase = 'roll'; // roll (chuông + điểm danh) | quiz
  let rollIdx = 0;
  let rang = false; // đã rung chuông chào lớp
  let actIdx = 0; // ca hành động: lệnh thứ mấy
  let usedCards = []; // mức 1: thẻ đã chạm
  let starIdx = 0; // phát sao: bạn thứ mấy
  let given = 0; // số sao đã phát cho bạn đó
  let extraTap = false; // chạm hộp sao khi bạn đã đủ sao
  let wDone = false; // bảng thời tiết đã gắn thẻ (SPEC-jobs4 TE3)
  let idx = 0;
  let wrongs = 0;
  let nudges = 0;
  let state = 'start';
  let lastWrong = { key: '', at: 0 };
  let recorded = new Set();
  const images = new Map(); // từ → url ảnh bài học
  const urls = [];

  const q = () => plan?.[idx];
  const isActions = () => q()?.kind === 'actions';
  const B = (line) => ({ who: 'bong', line });
  const T = (line) => ({ who: 'teacher', line });
  const P = (id, line) => ({ who: `p:${id}`, line });
  const pupilName = (id) => PATIENT_BY_ID.get(id)?.name ?? id;
  const rollWant = () => klass?.roll[rollIdx];
  const actWant = () => (q()?.asks ? ACTION_BY_ID.get(q().asks[actIdx]) : null);
  const starTurn = () => klass?.stars?.[starIdx];
  const wb = () => klass?.weather ?? null;

  const picture = h('div.tc-picture');
  const board = h('div.tc-board', {}, picture);
  // SPEC-roles mục 9: vai học trò (kiêm lớp trưởng) là một bạn học sinh vẽ sẵn (khăn quàng đỏ); bố mẹ thay ảnh được.
  const studentFace = h('span.tc-student-face', { html: STUDENT_SVG });
  const student = h('div.tc-student', { 'aria-hidden': 'true' }, studentFace);
  loadPersonImage(app, 'student').then((url) => {
    if (!url) return;
    const img = h('img.tc-student-img', { src: url, alt: '', draggable: false });
    img.addEventListener('error', () => { studentFace.innerHTML = STUDENT_SVG; }, { once: true });
    studentFace.replaceChildren(img);
    urls.push(url);
  });
  const notebook = h('div.tc-notebook', { 'aria-label': 'Vở của Bông' });
  const yesBtn = h('button.tc-answer.tc-yes', { type: 'button', 'aria-label': 'Đúng', text: '✅', onclick: () => judge(true) });
  const noBtn = h('button.tc-answer.tc-no', { type: 'button', 'aria-label': 'Sai', text: '❌', onclick: () => judge(false) });
  const answers = h('div.tc-answers', {}, yesBtn, noBtn);
  const classEl = h('div.tc-class', { hidden: true });
  // SPEC-jobs4 TE3: cửa sổ lớp (trời của buổi học) + bảng thời tiết ở góc lớp (thẻ gắn ở lại suốt lượt).
  const windowEl = h('div.tc-window', { hidden: true, 'aria-label': 'Cửa sổ lớp học' });
  const wslot = h('div.tc-wslot');
  const wboardEl = h('div.tc-wboard', { hidden: true, 'aria-label': 'Bảng thời tiết' }, h('span.tc-wboard-title', { text: 'Weather' }), wslot);
  // SPEC-roles: bàn cô giáo (bé đóng vai cô giáo, máy đọc giùm) bên trái; lớp học + Bông bên phải.
  const deskFace = h('span.tc-desk-face', { html: TEACHER_SVG });
  const desk = h('div.tc-desk', { 'aria-hidden': 'true' }, deskFace, h('span.tc-desk-top', { text: 'Teacher' }));
  // Ảnh cô giáo bố mẹ thêm (nếu có) thay hình vẽ sẵn (SPEC-roles mục 9).
  loadPersonImage(app, 'teacher').then((url) => {
    if (!url) return;
    const img = h('img.tc-desk-img', { src: url, alt: '', draggable: false });
    img.addEventListener('error', () => { deskFace.innerHTML = TEACHER_SVG; }, { once: true });
    deskFace.replaceChildren(img);
    urls.push(url);
  });

  const kit = jobScreen(app, {
    job: JOB, background: { lessonId: JOBS_BG_IMAGES, word: JOB }, className: 'tc-play', stageClass: 'tc-stage', title: '👩‍🏫 Teacher', helperLabel: 'Bông học trò', cap: 'teacher',
    resetLabel: 'Học lại',
    icon: (who) => (who === 'teacher' ? '👩‍🏫' : who === 'class' ? '🏫' : who.startsWith('p:') ? PATIENT_BY_ID.get(who.slice(2))?.emoji ?? '' : '🧒'),
    pitch: (who) => (who.startsWith('p:') ? PATIENT_BY_ID.get(who.slice(2))?.pitch : who === 'class' ? 1.3 : undefined),
    // Cô giáo (người lớn) giọng chính; bạn học sinh, các bạn, cả lớp (trẻ con) giọng thứ hai (máy một giọng: cao giọng hơn).
    altVoice: (who) => who !== 'teacher',
    onTalk: (who) => {
      student.classList.toggle('talking', who === 'bong' || who === 'class');
      for (const el of classEl.children) el.classList.toggle('talking', who === `p:${el.dataset.pupil}` || who === 'class');
    },
    onReset: () => restart(),
    onHelper: () => repeatPrompt(),
    roles: {
      of: (who) => (who === 'bong' ? student : who === 'teacher' ? desk : who === 'class' ? [student, ...classEl.children]
        : who?.startsWith('p:') ? pupilEl(who.slice(2)) : null),
      all: () => [student, desk, ...classEl.children],
      dim: (el) => !(state === 'roll' && el.classList.contains('tc-pupil')), // lúc điểm danh bé chạm các bạn
    },
    nudge: {
      ready: () => ACTIVE.includes(state) && nudges < MAX_NUDGES,
      key: () => stepKey(),
      fire: (rearm) => {
        nudges += 1;
        snap();
        if (state === 'bell') restartAnim(picture.querySelector('.tc-bell'), 'nudge');
        else if (state === 'stars') restartAnim(picture.querySelector('.tc-starbox'), 'nudge');
        else if (state === 'roll') restartAnim(pupilEl(rollWant()), 'nudge');
        else if (state === 'wcard') restartAnim(level === 1 ? wcardEl(wb().weather) : windowEl, 'nudge');
        else if (state === 'act') {
          const want = actWant();
          if (want) restartAnim(cardEl(want.id), 'nudge');
          else for (const c of picture.querySelectorAll('.tc-card:not(.used)')) restartAnim(c, 'nudge');
        } else restartAnim(picture, 'nudge');
        kit.talk(promptLines()).then(rearm);
      },
    },
  });
  const { stage, count, talk } = kit;
  stage.append(board, h('div.tc-corner', {}, windowEl, wboardEl), desk, student, notebook, answers, classEl);
  const stepKey = () => `${kit.epoch}:${phase}:${rollIdx}:${idx}:${actIdx}:${starIdx}:${given}:${state}`;
  const pupilEl = (id) => classEl.querySelector(`.tc-pupil[data-pupil="${id}"]`);
  const cardEl = (id) => picture.querySelector(`.tc-card[data-action="${id}"]`);
  const wcardEl = (id) => picture.querySelector(`.tc-wcard[data-weather="${id}"]`);

  function setState(s) {
    state = s;
    kit.setState(s, false);
    answers.classList.toggle('locked', s !== 'judge');
  }
  const snap = () => saveSnap(JOB, { level, plan, klass, phase, rollIdx, rang, wDone, idx, actIdx, usedCards, starIdx, given, wrongs, nudges, recorded: [...recorded] });

  /** Câu hỏi / yêu cầu của bước đang chờ bé (nhắc, chạm Bông). */
  function promptLines() {
    if (state === 'bell') return [B(BELL_LINE)];
    if (state === 'roll') return [T(whereLine(pupilName(rollWant())))];
    if (state === 'wcard') {
      const w = wb().weather;
      return level === 1 ? [B(itsWeatherLine(w))] : level === 2 ? [P(wb().says, itsWeatherLine(w))] : [B(HOW_WEATHER_LINE)];
    }
    if (state === 'stars') return [T(starsForLine(starTurn().n, pupilName(starTurn().pupil)))];
    if (state === 'act') {
      const want = actWant();
      return want ? [P(q().askers[actIdx], canWeLine(want))] : [B(WHAT_DO_LINE)];
    }
    return [B(claimLine(q().claim)), B(ASK_LINE)];
  }

  // ---------- Vẽ ----------
  function renderClass() {
    classEl.replaceChildren(...klass.pupils.map((id) => {
      const p = PATIENT_BY_ID.get(id);
      const el = h('button.tc-pupil', { type: 'button', 'aria-label': p.name, dataset: { pupil: id }, onclick: () => tapPupil(id) },
        h('span.tc-pupil-body', { html: patientSvg(id, { mood: 'happy', title: p.name }) }), h('span.tc-pupil-fx', { 'aria-hidden': 'true' }),
        h('span.tc-pupil-stars', { 'aria-hidden': 'true' }));
      return el;
    }));
    markHere();
  }
  function markHere() {
    const here = new Set(klass.roll.slice(0, rollIdx));
    for (const el of classEl.children) {
      el.dataset.here = String(phase === 'roll' && here.has(el.dataset.pupil));
      el.classList.toggle('called', phase === 'roll' && level <= 1 && state === 'roll' && el.dataset.pupil === rollWant());
    }
  }
  function renderPicture() {
    const { shown, right } = q();
    picture.classList.remove('tc-cards', 'tc-wcards');
    picture.dataset.kind = shown.kind;
    picture.dataset.right = String(right); // cho test; bé không thấy
    if (shown.kind === 'color') {
      picture.dataset.word = `${shown.color} ${shown.thing}`;
      picture.innerHTML = thingSvg(shown.thing, shown.color);
      return;
    }
    if (shown.kind === 'count') {
      const c = COUNTABLES.find((t) => t.id === shown.thing);
      picture.dataset.word = `${shown.n} ${c.id}`;
      picture.replaceChildren(...Array.from({ length: shown.n }, () => h('span.tc-emoji.tc-many', { text: c.emoji })));
      return;
    }
    const noun = NOUN_BY_EN.get(shown.en);
    picture.dataset.word = noun.en;
    picture.replaceChildren(face(noun.en, noun.emoji, 'tc-img', 'tc-emoji'));
  }
  /** Ảnh bài học của từ (nếu có), không thì emoji. */
  function face(word, emoji, imgClass, emojiClass) {
    const url = images.get(word);
    const fallback = () => h(`span.${emojiClass}`, { text: emoji });
    if (!url) return fallback();
    const img = h(`img.${imgClass}`, { src: url, alt: '', draggable: false });
    img.addEventListener('error', () => img.replaceWith(fallback()), { once: true });
    return img;
  }
  function renderCards() {
    const item = q();
    picture.classList.remove('tc-wcards');
    picture.classList.add('tc-cards');
    picture.dataset.kind = 'actions';
    picture.dataset.right = '';
    picture.dataset.word = item.asks ? item.asks[actIdx] ?? '' : ''; // cho test
    picture.replaceChildren(...item.cards.map((id) => {
      const a = ACTION_BY_ID.get(id);
      const card = h('button.tc-card', { type: 'button', 'aria-label': a.cmd, dataset: { action: id }, onclick: () => tapCard(id) },
        face(a.word, a.emoji, 'tc-card-img', 'tc-card-emoji'), h('span.tc-card-label', { text: a.short }));
      card.classList.toggle('used', usedCards.includes(id));
      return card;
    }));
  }
  function renderNotebook() {
    notebook.replaceChildren(...plan.map((_, i) => h('span.tc-star', { text: i < idx ? '⭐' : '☆', dataset: { done: String(i < idx) } })));
  }
  /** Bố cục theo bước: điểm danh / hành động — lớp hiện, ✅ ❌ ẩn; chấm hình — ngược lại. */
  function layout() {
    const showClass = phase === 'roll' || phase === 'stars' || phase === 'weather' || isActions();
    classEl.hidden = !showClass;
    answers.hidden = showClass;
    notebook.hidden = phase === 'roll' || phase === 'stars' || phase === 'weather';
    windowEl.hidden = !wb();
    wboardEl.hidden = !wb();
  }

  // ---------- Chuông + điểm danh (SPEC-jobs2 mục 4.2) ----------
  async function startRoll(resume = false) {
    const e = kit.epoch;
    phase = 'roll';
    count.textContent = '';
    layout();
    renderClass();
    if (!rang) {
      picture.classList.remove('tc-cards');
      picture.dataset.kind = 'bell';
      picture.replaceChildren(h('button.tc-bell', { type: 'button', 'aria-label': 'Chuông', text: '🔔', onclick: () => ringBell() }));
      setState('bell');
      snap();
      if (!resume) restartAnim(classEl, 'enter');
      await talk([B(BELL_LINE)]);
      if (e === kit.epoch && state === 'bell') kit.armNudge();
      return;
    }
    rollStep();
  }
  async function ringBell() {
    if (state !== 'bell') return;
    const e = kit.epoch;
    setState('busy');
    kit.clearNudge();
    rang = true;
    nudges = 0;
    snap();
    play('ring');
    restartAnim(picture.querySelector('.tc-bell'), 'ring');
    await talk([T(MORNING_LINE), { who: 'class', line: CLASS_MORNING_LINE }]);
    if (e !== kit.epoch) return;
    rollStep();
  }
  async function rollStep() {
    const e = kit.epoch;
    if (rollIdx >= klass.roll.length) {
      setState('busy');
      markHere();
      play('sparkle');
      await talk([B(ALL_HERE_LINE)]);
      if (e !== kit.epoch) return;
      for (const el of classEl.children) el.dataset.here = 'false';
      if (wb() && !wDone) {
        startWeather();
        return;
      }
      phase = 'quiz';
      ask();
      return;
    }
    picture.classList.remove('tc-cards');
    picture.dataset.kind = 'roll';
    picture.dataset.word = rollWant(); // cho test
    picture.replaceChildren(h('span.tc-emoji', { text: '📋' }));
    setState('roll');
    markHere();
    snap();
    const k = stepKey();
    await talk([T(whereLine(pupilName(rollWant())))]);
    if (k === stepKey()) kit.armNudge();
  }
  async function tapPupil(id) {
    if (state !== 'roll') return;
    const e = kit.epoch;
    const want = rollWant();
    if (id !== want) {
      // Mức 1: làm quen tên — không tính nhầm. Mức 2–3: tính nhầm; nhầm lần 2 bạn được gọi nhún.
      if (level >= 2) {
        const now = Date.now();
        if (`p:${id}` === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return;
        lastWrong = { key: `p:${id}`, at: now };
        wrongs += 1;
        snap();
        play('boing');
        if (wrongs >= 2) restartAnim(pupilEl(want), 'nudge');
      }
      kit.clearNudge();
      restartAnim(pupilEl(id), 'shake');
      const k = stepKey();
      await talk([P(id, notMeLine(pupilName(id), pupilName(want)))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    setState('busy');
    kit.clearNudge();
    rollIdx += 1;
    wrongs = 0;
    nudges = 0;
    snap();
    play('pop');
    markHere();
    restartAnim(pupilEl(id), 'hop');
    await talk([P(id, HERE_LINE)]);
    if (e !== kit.epoch) return;
    rollStep();
  }

  // ---------- Bảng thời tiết (SPEC-jobs4 mục 9) ----------
  function weatherFace(id, imgClass, emojiClass) {
    return face(id, WEATHER_BY.get(id).emoji, imgClass, emojiClass);
  }
  /** Cửa sổ + bảng thời tiết (thẻ đã gắn thì hiện trên bảng). */
  function renderWeatherCorner() {
    if (!wb()) return;
    windowEl.dataset.weather = wb().weather; // cho test
    if (windowEl.dataset.drawn !== wb().weather) {
      windowEl.innerHTML = windowSvg(wb().weather);
      windowEl.dataset.drawn = wb().weather;
    }
    wslot.replaceChildren(...(wDone ? [weatherFace(wb().weather, 'tc-wslot-img', 'tc-wslot-emoji'), h('span.tc-wslot-label', { text: wb().weather })] : []));
    wboardEl.dataset.filled = String(wDone);
  }
  function renderWeatherCards() {
    const c = wb();
    picture.classList.add('tc-cards', 'tc-wcards');
    picture.dataset.kind = 'weather';
    picture.dataset.right = '';
    picture.dataset.word = c.weather; // cho test
    picture.style.setProperty('--cols', String(c.cards.length === 4 ? 2 : c.cards.length));
    picture.replaceChildren(...c.cards.map((id) => {
      const card = h('button.tc-card.tc-wcard', { type: 'button', 'aria-label': id, dataset: { weather: id }, onclick: () => tapWeather(id) },
        weatherFace(id, 'tc-card-img', 'tc-card-emoji'), h('span.tc-card-label', { text: id }));
      card.classList.toggle('hint', level === 1 && id === c.weather);
      return card;
    }));
  }
  async function startWeather(resume = false) {
    const e = kit.epoch;
    phase = 'weather';
    if (!resume) {
      wrongs = 0;
      nudges = 0;
    }
    count.textContent = '';
    layout();
    renderWeatherCorner();
    renderWeatherCards();
    setState('wcard');
    snap();
    if (!resume) {
      restartAnim(picture, 'pop');
      restartAnim(windowEl, 'nudge');
    }
    if (level === 1) restartAnim(wcardEl(wb().weather), 'nudge');
    await talk([...(resume && level < 3 ? [] : [B(HOW_WEATHER_LINE)]), ...(level < 3 ? promptLines() : [])]);
    if (e === kit.epoch && state === 'wcard') kit.armNudge();
  }
  async function tapWeather(id) {
    if (state !== 'wcard') return;
    const e = kit.epoch;
    const c = wb();
    const card = wcardEl(id);
    if (id !== c.weather) {
      if (level >= 2) {
        // Nhầm (mức 2–3): thẻ rơi về, Bông nhắc nhìn cửa sổ; nhầm lần 2 thẻ đúng nhún.
        const now = Date.now();
        if (`w:${id}` === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return;
        lastWrong = { key: `w:${id}`, at: now };
        wrongs += 1;
        snap();
        play('boing');
        kit.clearNudge();
        restartAnim(card, 'drop');
        restartAnim(windowEl, 'nudge');
        if (wrongs >= 2) restartAnim(wcardEl(c.weather), 'nudge');
        const k = stepKey();
        await talk([B(wrongWeatherLine(id))]);
        if (k === stepKey()) kit.armNudge();
        return;
      }
      // Mức 1: không tính nhầm — thẻ đúng nhún.
      restartAnim(card, 'shake');
      restartAnim(wcardEl(c.weather), 'nudge');
      return;
    }
    // Đúng: nhận NGAY (một lần) — từ Weather (mức 2–3, đúng ngay lần đầu), `seen` thời tiết; thẻ bay lên bảng thời tiết.
    setState('busy');
    kit.clearNudge();
    if (!recorded.has('weather')) {
      recorded.add('weather');
      if (level >= 2 && wrongs === 0) markPracticed(app, c.weather, WEATHER_BY.get(c.weather).emoji);
      progress = afterSeen(progress, c.weather);
      app.setSetting('teacherGame', progress).catch(() => {});
    }
    wDone = true;
    wrongs = 0;
    nudges = 0;
    snap();
    play('pop');
    card.classList.add('used');
    const ghost = await kit.flyTo(weatherFace(id, 'tc-card-img', 'tc-card-emoji'), center(card.getBoundingClientRect()), center(wslot.getBoundingClientRect()));
    kit.removeGhost(ghost);
    if (e !== kit.epoch) return;
    renderWeatherCorner();
    restartAnim(wboardEl, 'hop');
    play('sparkle');
    await talk([{ who: 'class', line: itsWeatherLine(c.weather) }, B(START_CLASS_LINE)]);
    if (e !== kit.epoch) return;
    picture.classList.remove('tc-wcards');
    phase = 'quiz';
    ask();
  }

  // ---------- Câu ----------
  async function ask(resume = false) {
    const e = kit.epoch;
    if (!resume) {
      wrongs = 0;
      nudges = 0;
    }
    count.textContent = `${idx + 1}/${plan.length}`;
    layout();
    renderNotebook();
    if (isActions()) {
      startActions(resume);
      return;
    }
    renderPicture();
    setState('claim');
    snap();
    restartAnim(picture, 'pop');
    student.classList.add('hand');
    await talk([...(idx === 0 && !resume ? [B(START_LINE)] : []), B(claimLine(q().claim)), ...(idx === 0 ? [B(ASK_LINE)] : [])]);
    student.classList.remove('hand');
    if (e !== kit.epoch) return;
    setState('judge');
    kit.armNudge();
  }

  /** Bé chấm: `yes` = ✅ (Bông nói đúng). */
  async function judge(yes) {
    if (state !== 'judge') return;
    const e = kit.epoch;
    const cur = q();
    if (yes !== cur.right) {
      // Chấm nhầm: Bông nói lại đúng câu vừa nói, bé chọn lại; nhầm lần 2 thì nút đúng nhún.
      const now = Date.now();
      const key = yes ? 'yes' : 'no';
      if (key === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return;
      lastWrong = { key, at: now };
      wrongs += 1;
      snap();
      kit.clearNudge();
      play('boing');
      restartAnim(picture, 'nudge');
      if (wrongs >= 2) restartAnim(cur.right ? yesBtn : noBtn, 'nudge');
      const k = stepKey();
      await talk([B(SURE_LINE), B(claimLine(cur.claim))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    // Chấm đúng: nhận NGAY (một lần) rồi mới nói.
    setState('busy');
    kit.clearNudge();
    const word = practiceWord(cur.shown);
    if (word && !recorded.has(`${idx}:${word.en}`)) {
      recorded.add(`${idx}:${word.en}`);
      markPracticed(app, word.en, word.emoji);
    }
    idx += 1;
    wrongs = 0;
    nudges = 0;
    snap();
    renderNotebook();
    restartAnim(notebook.children[idx - 1], 'pop');
    play(cur.right ? 'cheer' : 'ding');
    if (cur.right) await talk([B(YAY_LINE)]);
    else {
      student.classList.add('oops');
      await talk([B(OOPS_LINE)]);
      if (e !== kit.epoch) return;
      await wait(SAY_BACK_MS);
      if (e !== kit.epoch) return;
      await talk([B(fixLine(cur.shown))]);
      student.classList.remove('oops');
    }
    if (e !== kit.epoch) return;
    nextItem();
  }

  async function nextItem() {
    const e = kit.epoch;
    if (idx >= plan.length) {
      await talk([B(END_LINE)]);
      if (e !== kit.epoch) return;
      if (klass.stars?.length) startStars();
      else goodbye();
    } else ask();
  }

  // ---------- Phát sao cuối buổi (SPEC-jobs2 mục 4.4) ----------
  function renderPupilStars() {
    const got = new Map();
    (klass.stars ?? []).forEach((t, i) => got.set(t.pupil, i < starIdx ? t.n : i === starIdx ? given : 0));
    for (const el of classEl.children) {
      const n = got.get(el.dataset.pupil) ?? 0;
      el.querySelector('.tc-pupil-stars').textContent = '⭐'.repeat(n);
      el.dataset.stars = String(n);
    }
  }
  async function startStars(resume = false) {
    const e = kit.epoch;
    phase = 'stars';
    if (!resume) {
      starIdx = 0;
      given = 0;
    }
    layout();
    renderPupilStars();
    if (starIdx >= klass.stars.length) {
      goodbye();
      return;
    }
    const t = starTurn();
    picture.classList.remove('tc-cards');
    picture.dataset.kind = 'stars';
    picture.dataset.word = `${t.pupil}:${t.n}`; // cho test
    picture.replaceChildren(h('button.tc-starbox', { type: 'button', 'aria-label': 'Hộp sao', text: '⭐', onclick: () => tapStarBox() }));
    for (const el of classEl.children) el.classList.toggle('called', el.dataset.pupil === t.pupil);
    setState('stars');
    snap();
    await talk([T(starsForLine(t.n, pupilName(t.pupil)))]);
    if (e === kit.epoch && state === 'stars') kit.armNudge();
  }
  /** Mỗi chạm hộp sao: một sao bay vào vở bạn, cô giáo đếm; đủ → bạn cảm ơn → bạn sau. Chạm thừa: bạn nói đã đủ (không nhầm). */
  async function tapStarBox() {
    const t = starTurn();
    if (state === 'stars-full') {
      // Chạm thừa: bạn nhún ngay; câu "I have two stars!" nói sau lời cảm ơn (không bị câu đếm đè mất).
      extraTap = true;
      restartAnim(pupilEl(t.pupil), 'hop');
      return;
    }
    if (state !== 'stars') return;
    const e = kit.epoch;
    kit.clearNudge();
    given += 1;
    nudges = 0;
    const n = given;
    const full = given >= t.n;
    if (full) {
      setState('stars-full');
      extraTap = false;
    }
    // Đủ sao: lưu sẵn bạn sau (ra nền không phát lại).
    if (full) saveSnap(JOB, { level, plan, klass, phase, rollIdx, rang, wDone, idx, actIdx, usedCards, starIdx: starIdx + 1, given: 0, wrongs, nudges, recorded: [...recorded] });
    else snap();
    play('pop');
    const box = picture.querySelector('.tc-starbox');
    restartAnim(box, 'hop');
    const ghost = await kit.flyTo(h('span.tc-star-fly', { text: '⭐' }), center(box.getBoundingClientRect()), center(pupilEl(t.pupil).getBoundingClientRect()));
    kit.removeGhost(ghost);
    if (e !== kit.epoch) return;
    renderPupilStars();
    restartAnim(pupilEl(t.pupil), 'hop');
    await talk([T(starCountLine(n))]);
    if (e !== kit.epoch || !full || n !== given) {
      if (e === kit.epoch && !full) kit.armNudge();
      return;
    }
    play('cheer');
    await talk([P(t.pupil, STAR_THANKS_LINE)]);
    if (e !== kit.epoch) return;
    if (extraTap) {
      extraTap = false;
      await talk([P(t.pupil, haveStarsLine(t.n))]);
      if (e !== kit.epoch) return;
    }
    starIdx += 1;
    given = 0;
    startStars(true);
  }
  async function goodbye() {
    const e = kit.epoch;
    setState('busy');
    phase = 'quiz';
    classEl.hidden = false;
    for (const el of classEl.children) el.classList.remove('called');
    await talk([T(GOODBYE_CLASS_LINE), { who: 'class', line: GOODBYE_TEACHER_LINE }]);
    if (e !== kit.epoch) return;
    finishRound();
  }

  // ---------- Classroom actions (SPEC-jobs2 mục 4.3) ----------
  async function startActions(resume = false) {
    const e = kit.epoch;
    if (!resume) {
      actIdx = 0;
      usedCards = [];
    }
    renderCards();
    setState('act');
    snap();
    if (!resume) restartAnim(picture, 'pop');
    await talk(promptLines());
    if (e === kit.epoch && state === 'act') kit.armNudge();
  }
  async function tapCard(id) {
    if (state !== 'act') return;
    const e = kit.epoch;
    const item = q();
    const a = ACTION_BY_ID.get(id);
    const want = actWant();
    if (!want && usedCards.includes(id)) {
      restartAnim(cardEl(id), 'shake'); // mức 1: thẻ đã làm — chọn thẻ khác (không nhầm)
      return;
    }
    if (want && id !== want.id) {
      const now = Date.now();
      if (`a:${id}` === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return;
      lastWrong = { key: `a:${id}`, at: now };
      wrongs += 1;
      snap();
      kit.clearNudge();
      play('boing');
      restartAnim(cardEl(id), 'shake');
      if (wrongs >= 2) restartAnim(cardEl(want.id), 'nudge');
      const k = stepKey();
      await talk([P(item.askers[actIdx], wrongActionLine(a, want))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    // Đúng (mức 2–3) / thẻ bất kỳ (mức 1): nhận NGAY rồi mới nói + cả lớp làm.
    setState('busy');
    kit.clearNudge();
    if (want && wrongs === 0 && !recorded.has(`act:${idx}:${actIdx}`)) {
      recorded.add(`act:${idx}:${actIdx}`);
      markPracticed(app, a.word, a.emoji);
    }
    usedCards = [...usedCards, id];
    actIdx += 1;
    wrongs = 0;
    nudges = 0;
    const last = actIdx >= ACTION_STEPS;
    if (last) idx += 1;
    snap();
    cardEl(id)?.classList.add('used');
    play('ding');
    await talk([T(cmdLine(a))]);
    if (e !== kit.epoch) return;
    for (const el of classEl.children) {
      el.querySelector('.tc-pupil-fx').textContent = a.id === 'clap' || a.id === 'wave' ? a.emoji : '';
      restartAnim(el, `act-${a.id}`);
    }
    await wait(ACT_MS);
    if (e !== kit.epoch) return;
    for (const el of classEl.children) el.classList.remove(`act-${a.id}`);
    if (!last) {
      renderCards();
      setState('act');
      const k = stepKey();
      await talk(promptLines());
      if (k === stepKey()) kit.armNudge();
      return;
    }
    renderNotebook();
    restartAnim(notebook.children[idx - 1], 'pop');
    play('cheer');
    await talk([B(ACTIONS_DONE_LINE)]);
    if (e !== kit.epoch) return;
    nextItem();
  }

  function finishRound() {
    if (state === 'done') return;
    setState('done');
    answers.hidden = true;
    kit.finishRound(() => {
      clearSnap(JOB);
      progress = afterJobRound(progress, { maxLevel: MAX_LEVEL });
      app.setSetting('teacherGame', progress).catch(() => {});
    });
  }

  function restart() {
    if (state === 'done' || !plan) return;
    kit.cancelAll();
    student.classList.remove('hand', 'oops');
    if (phase === 'stars') {
      startStars();
      return;
    }
    if (phase === 'weather') {
      startWeather();
      return;
    }
    if (phase === 'roll') {
      rollIdx = 0;
      rang = false;
      wrongs = 0;
      nudges = 0;
      startRoll();
      return;
    }
    idx = 0;
    ask();
  }

  function repeatPrompt() {
    if (!ACTIVE.includes(state)) return;
    const k = stepKey();
    talk(state === 'judge' ? [B(claimLine(q().claim))] : promptLines()).then(() => k === stepKey() && kit.armNudge());
  }

  /** Ảnh bài học mới nhất của các từ trong lượt (hình + thẻ hành động; chỉ đọc, không chép). */
  async function loadImages() {
    const words = [...(wb()?.cards ?? [])];
    for (const item of plan) {
      if (item.kind === 'actions') words.push(...item.cards.map((id) => ACTION_BY_ID.get(id).word));
      else if (item.shown.kind === 'noun') words.push(item.shown.en);
    }
    for (const w of words) {
      if (images.has(w)) continue;
      const img = await latestImageForWord(app.db, w).catch(() => null);
      if (!img) continue;
      const url = URL.createObjectURL(mediaBlob(img));
      urls.push(url);
      images.set(w, url);
    }
  }

  (async () => {
    const s = takeSnap(JOB, { level, continueDirectly: params.continueDirectly });
    if (s?.klass) {
      plan = s.plan;
      klass = s.klass;
      phase = s.phase ?? 'quiz';
      rollIdx = s.rollIdx ?? 0;
      rang = Boolean(s.rang);
      wDone = Boolean(s.wDone);
      idx = s.idx;
      actIdx = s.actIdx ?? 0;
      usedCards = s.usedCards ?? [];
      starIdx = s.starIdx ?? 0;
      given = s.given ?? 0;
      wrongs = s.wrongs ?? 0;
      nudges = s.nudges ?? 0;
      recorded = new Set(s.recorded ?? []);
    } else {
      const known = new Set();
      for (const rec of await app.db.getAll('progress').catch(() => [])) if ((rec.practiceCount ?? 0) > 0) known.add(rec.word);
      const lesson = planLesson(level, { known, seen: progress.seen });
      plan = lesson.items;
      klass = { pupils: lesson.pupils, roll: lesson.roll, stars: lesson.stars, weather: lesson.weather };
    }
    await loadImages();
    if (kit.signal.aborted) return;
    renderClass();
    layout();
    renderWeatherCorner();
    if (phase === 'stars') startStars(true);
    else if (phase === 'weather') startWeather(true);
    else if (idx >= plan.length) {
      count.textContent = `${plan.length}/${plan.length}`;
      renderNotebook();
      finishRound();
    } else if (phase === 'roll') startRoll(Boolean(s?.klass));
    else ask(Boolean(s?.klass));
  })();

  kit.onCleanup(() => urls.forEach((u) => URL.revokeObjectURL(u)));
  return kit.cleanup;
}
