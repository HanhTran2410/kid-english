// Trò Cô giáo nhí (SPEC-jobs.md mục 5): đảo vai — Bông làm học trò, nhìn hình trên bảng và giơ tay nói tên,
// đôi khi cố tình nói sai; bé chấm ✅ / ❌. Chấm đúng: Bông vui / Bông sửa lại; chấm nhầm: Bông nói lại, bé chọn lại.
// SPEC-jobs2 TE1: mở đầu lượt bé rung chuông + điểm danh lớp (chạm đúng bạn được gọi); một trong 5 việc là ca
// "Classroom actions" (bé chạm thẻ hành động, cả lớp làm theo). 5 việc → vở của Bông có 5 ⭐ → sticker.
// Trạng thái: bell → roll ⇄ busy → claim → judge | act ⇄ busy → việc sau | done. Khung chung ở jobs/kit.js.

import { h } from '../ui.js';
import { latestImageForWord, mediaBlob } from '../db.js';
import { play } from '../speech/sfx.js';
import { markPracticed } from '../player/track.js';
import { bongSvg } from '../bong.js';
import { patientSvg } from '../patients.js';
import { PATIENT_BY_ID } from '../doctor.js';
import { cleanJobState, afterJobRound } from '../jobs/levels.js';
import { JOBS_BG_IMAGES } from '../jobs/backgrounds.js';
import { jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, WRONG_LOCK_MS, MAX_NUDGES } from '../jobs/kit.js';
import {
  MAX_LEVEL, NOUN_BY_EN, COUNTABLES, planLesson, claimLine, fixLine, practiceWord,
  YAY_LINE, OOPS_LINE, SURE_LINE, START_LINE, ASK_LINE, END_LINE,
  ACTION_BY_ID, ACTION_STEPS, BELL_LINE, MORNING_LINE, CLASS_MORNING_LINE, whereLine, HERE_LINE, notMeLine, ALL_HERE_LINE,
  WHAT_DO_LINE, canWeLine, cmdLine, wrongActionLine, ACTIONS_DONE_LINE,
  starsForLine, starCountLine, STAR_THANKS_LINE, haveStarsLine, GOODBYE_CLASS_LINE, GOODBYE_TEACHER_LINE,
} from '../jobs/teacher.js';

const JOB = 'teacher';
const SAY_BACK_MS = 2000; // "Oops! What is it?": chờ bé nói tên
const ACT_MS = 1600; // cả lớp làm theo lệnh (bé làm theo nếu muốn)
const ACTIVE = ['judge', 'bell', 'roll', 'act', 'stars'];
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

  const picture = h('div.tc-picture');
  const board = h('div.tc-board', {}, picture);
  const student = h('div.tc-student', { html: bongSvg({ mood: 'happy' }), 'aria-hidden': 'true' });
  const notebook = h('div.tc-notebook', { 'aria-label': 'Vở của Bông' });
  const yesBtn = h('button.tc-answer.tc-yes', { type: 'button', 'aria-label': 'Đúng', text: '✅', onclick: () => judge(true) });
  const noBtn = h('button.tc-answer.tc-no', { type: 'button', 'aria-label': 'Sai', text: '❌', onclick: () => judge(false) });
  const answers = h('div.tc-answers', {}, yesBtn, noBtn);
  const classEl = h('div.tc-class', { hidden: true });
  // SPEC-roles: bàn cô giáo (bé đóng vai cô giáo, máy đọc giùm) bên trái; lớp học + Bông bên phải.
  const desk = h('div.tc-desk', { 'aria-hidden': 'true' }, h('span.tc-desk-face', { text: '👩‍🏫' }), h('span.tc-desk-top', { text: 'Teacher' }));

  const kit = jobScreen(app, {
    job: JOB, background: { lessonId: JOBS_BG_IMAGES, word: JOB }, className: 'tc-play', stageClass: 'tc-stage', title: '👩‍🏫 Teacher', helperLabel: 'Bông học trò', cap: 'teacher',
    resetLabel: 'Học lại',
    icon: (who) => (who === 'teacher' ? '👩‍🏫' : who === 'class' ? '🏫' : who.startsWith('p:') ? PATIENT_BY_ID.get(who.slice(2))?.emoji ?? '' : '🐰'),
    pitch: (who) => (who.startsWith('p:') ? PATIENT_BY_ID.get(who.slice(2))?.pitch : who === 'class' ? 1.3 : undefined),
    onTalk: (who) => {
      student.classList.toggle('talking', who === 'bong');
      for (const el of classEl.children) el.classList.toggle('talking', who === `p:${el.dataset.pupil}` || who === 'class');
    },
    onReset: () => restart(),
    onHelper: () => repeatPrompt(),
    roles: {
      of: (who) => (who === 'bong' ? student : who === 'teacher' ? desk : who === 'class' ? [...classEl.children]
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
  stage.append(board, desk, student, notebook, answers, classEl);
  const stepKey = () => `${kit.epoch}:${phase}:${rollIdx}:${idx}:${actIdx}:${starIdx}:${given}:${state}`;
  const pupilEl = (id) => classEl.querySelector(`.tc-pupil[data-pupil="${id}"]`);
  const cardEl = (id) => picture.querySelector(`.tc-card[data-action="${id}"]`);

  function setState(s) {
    state = s;
    kit.setState(s, false);
    answers.classList.toggle('locked', s !== 'judge');
  }
  const snap = () => saveSnap(JOB, { level, plan, klass, phase, rollIdx, rang, idx, actIdx, usedCards, starIdx, given, wrongs, nudges, recorded: [...recorded] });

  /** Câu hỏi / yêu cầu của bước đang chờ bé (nhắc, chạm Bông). */
  function promptLines() {
    if (state === 'bell') return [B(BELL_LINE)];
    if (state === 'roll') return [B(whereLine(pupilName(rollWant())))];
    if (state === 'stars') return [B(starsForLine(starTurn().n, pupilName(starTurn().pupil)))];
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
    picture.classList.remove('tc-cards');
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
    const showClass = phase === 'roll' || phase === 'stars' || isActions();
    classEl.hidden = !showClass;
    answers.hidden = showClass;
    notebook.hidden = phase === 'roll' || phase === 'stars';
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
      phase = 'quiz';
      for (const el of classEl.children) el.dataset.here = 'false';
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
    await talk([B(whereLine(pupilName(rollWant())))]);
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
    await talk([B(starsForLine(t.n, pupilName(t.pupil)))]);
    if (e === kit.epoch && state === 'stars') kit.armNudge();
  }
  /** Mỗi chạm hộp sao: một sao bay vào vở bạn, Bông đếm; đủ → bạn cảm ơn → bạn sau. Chạm thừa: bạn nói đã đủ (không nhầm). */
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
    if (full) saveSnap(JOB, { level, plan, klass, phase, rollIdx, rang, idx, actIdx, usedCards, starIdx: starIdx + 1, given: 0, wrongs, nudges, recorded: [...recorded] });
    else snap();
    play('pop');
    const box = picture.querySelector('.tc-starbox');
    restartAnim(box, 'hop');
    const ghost = await kit.flyTo(h('span.tc-star-fly', { text: '⭐' }), center(box.getBoundingClientRect()), center(pupilEl(t.pupil).getBoundingClientRect()));
    kit.removeGhost(ghost);
    if (e !== kit.epoch) return;
    renderPupilStars();
    restartAnim(pupilEl(t.pupil), 'hop');
    await talk([B(starCountLine(n))]);
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
    const words = [];
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
      const lesson = planLesson(level, { known });
      plan = lesson.items;
      klass = { pupils: lesson.pupils, roll: lesson.roll, stars: lesson.stars };
    }
    await loadImages();
    if (kit.signal.aborted) return;
    renderClass();
    if (phase === 'stars') startStars(true);
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
