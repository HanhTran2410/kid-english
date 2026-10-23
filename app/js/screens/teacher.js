// Trò Cô giáo nhí (SPEC-jobs.md mục 5): đảo vai — Bông làm học trò, nhìn hình trên bảng và giơ tay nói tên,
// đôi khi cố tình nói sai; bé chấm ✅ / ❌. Chấm đúng: Bông vui / Bông sửa lại; chấm nhầm: Bông nói lại, bé chọn lại.
// 5 hình → vở của Bông có 5 ⭐ → sticker. Trạng thái: claim → judge ⇄ busy → hình sau | done. Khung chung ở jobs/kit.js.

import { h } from '../ui.js';
import { latestImageForWord, mediaBlob } from '../db.js';
import { play } from '../speech/sfx.js';
import { markPracticed } from '../player/track.js';
import { bongSvg } from '../bong.js';
import { cleanJobState, afterJobRound } from '../jobs/levels.js';
import { JOBS_BG_IMAGES } from '../jobs/backgrounds.js';
import { jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, wait, WRONG_LOCK_MS, MAX_NUDGES } from '../jobs/kit.js';
import {
  MAX_LEVEL, NOUN_BY_EN, COUNTABLES, planRound, claimLine, fixLine, practiceWord,
  YAY_LINE, OOPS_LINE, SURE_LINE, START_LINE, ASK_LINE, END_LINE,
} from '../jobs/teacher.js';

const JOB = 'teacher';
const SAY_BACK_MS = 2000; // "Oops! What is it?": chờ bé nói tên
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
  let plan = null; // [{ shown, claim, right }]
  let idx = 0;
  let wrongs = 0;
  let nudges = 0;
  let state = 'start';
  let lastWrong = { key: '', at: 0 };
  let recorded = new Set();
  const images = new Map(); // từ → url ảnh bài học
  const urls = [];

  const q = () => plan?.[idx];
  const B = (line) => ({ who: 'bong', line });

  const picture = h('div.tc-picture');
  const board = h('div.tc-board', {}, picture);
  const student = h('div.tc-student', { html: bongSvg({ mood: 'happy' }), 'aria-hidden': 'true' });
  const notebook = h('div.tc-notebook', { 'aria-label': 'Vở của Bông' });
  const yesBtn = h('button.tc-answer.tc-yes', { type: 'button', 'aria-label': 'Đúng', text: '✅', onclick: () => judge(true) });
  const noBtn = h('button.tc-answer.tc-no', { type: 'button', 'aria-label': 'Sai', text: '❌', onclick: () => judge(false) });
  const answers = h('div.tc-answers', {}, yesBtn, noBtn);

  const kit = jobScreen(app, {
    job: JOB, background: { lessonId: JOBS_BG_IMAGES, word: JOB }, className: 'tc-play', stageClass: 'tc-stage', title: '👩‍🏫 Teacher', helperLabel: 'Bông học trò', cap: 'teacher',
    resetLabel: 'Học lại',
    icon: () => '🐰',
    onTalk: (who) => student.classList.toggle('talking', who === 'bong'),
    onReset: () => restart(),
    onHelper: () => repeatClaim(),
    nudge: {
      ready: () => state === 'judge' && nudges < MAX_NUDGES,
      key: () => stepKey(),
      fire: (rearm) => {
        nudges += 1;
        snap();
        restartAnim(picture, 'nudge');
        kit.talk([B(claimLine(q().claim)), B(ASK_LINE)]).then(rearm);
      },
    },
  });
  const { stage, count, talk } = kit;
  stage.append(board, student, notebook, answers);
  const stepKey = () => `${kit.epoch}:${idx}`;

  function setState(s) {
    state = s;
    kit.setState(s, s === 'judge');
    answers.classList.toggle('locked', s !== 'judge');
  }
  const snap = () => saveSnap(JOB, { level, plan, idx, wrongs, nudges, recorded: [...recorded] });

  // ---------- Vẽ ----------
  function renderPicture() {
    const { shown, right } = q();
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
    const url = images.get(noun.en);
    const emoji = () => h('span.tc-emoji', { text: noun.emoji });
    if (!url) {
      picture.replaceChildren(emoji());
      return;
    }
    const img = h('img.tc-img', { src: url, alt: '', draggable: false });
    img.addEventListener('error', () => img.replaceWith(emoji()), { once: true });
    picture.replaceChildren(img);
  }
  function renderNotebook() {
    notebook.replaceChildren(...plan.map((_, i) => h('span.tc-star', { text: i < idx ? '⭐' : '☆', dataset: { done: String(i < idx) } })));
  }

  // ---------- Câu ----------
  async function ask(resume = false) {
    const e = kit.epoch;
    if (!resume) {
      wrongs = 0;
      nudges = 0;
    }
    count.textContent = `${idx + 1}/${plan.length}`;
    renderPicture();
    renderNotebook();
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
    saveSnap(JOB, { level, plan, idx, wrongs: 0, nudges: 0, recorded: [...recorded] });
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
    if (idx >= plan.length) {
      await talk([B(END_LINE)]);
      if (e !== kit.epoch) return;
      finishRound();
    } else ask();
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
    idx = 0;
    ask();
  }

  function repeatClaim() {
    if (state !== 'judge') return;
    const k = stepKey();
    talk([B(claimLine(q().claim))]).then(() => k === stepKey() && kit.armNudge());
  }

  /** Ảnh bài học mới nhất của các từ trong lượt (chỉ đọc, không chép). */
  async function loadImages() {
    for (const { shown } of plan) {
      if (shown.kind !== 'noun' || images.has(shown.en)) continue;
      const img = await latestImageForWord(app.db, shown.en).catch(() => null);
      if (!img) continue;
      const url = URL.createObjectURL(mediaBlob(img));
      urls.push(url);
      images.set(shown.en, url);
    }
  }

  (async () => {
    const s = takeSnap(JOB, { level, continueDirectly: params.continueDirectly });
    if (s) {
      plan = s.plan;
      idx = s.idx;
      wrongs = s.wrongs ?? 0;
      nudges = s.nudges ?? 0;
      recorded = new Set(s.recorded ?? []);
    } else {
      const known = new Set();
      for (const rec of await app.db.getAll('progress').catch(() => [])) if ((rec.practiceCount ?? 0) > 0) known.add(rec.word);
      plan = planRound(level, { known });
    }
    await loadImages();
    if (kit.signal.aborted) return;
    if (idx >= plan.length) {
      count.textContent = `${plan.length}/${plan.length}`;
      renderNotebook();
      finishRound();
    } else ask(Boolean(s));
  })();

  kit.onCleanup(() => urls.forEach((u) => URL.revokeObjectURL(u)));
  return kit.cleanup;
}
