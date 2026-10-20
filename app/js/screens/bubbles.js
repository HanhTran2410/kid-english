// Trò Bắt bong bóng (SPEC-bubbles.md): chọn chế độ (màu / số / từ của bài) → bong bóng bay lên, Bông nói "Pop the red one!",
// bé chạm cho vỡ ("bụp"). Đúng thì Bông khen và nói thứ mới; nhầm cũng vỡ, Bông nói tên nó — không trừ gì.
// Bắt đủ 8 lần → Hoan hô + sticker. Giảm chuyển động: bong bóng không bay, hiện đứng yên ở các ô.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { homeButton } from '../player/layout.js';
import { createBunny, Teacher } from '../player/teacher.js';
import { runCompletion } from '../player/completion-stage.js';
import { markPracticed } from '../player/track.js';
import { scaled } from '../timing.js';
import { isWordLesson } from '../phrase.js';
import { isTalkLesson } from '../talk.js';
import { isNumberLesson } from '../numbers.js';
import { isPhonicsLesson } from '../phonics.js';
import {
  LEVELS, TARGETS_PER_ROUND, MIN_WORDS, itemsFor, roundPlan, nextBubble, cleanBubblesState, afterBubblesRound,
  INTRO_LINE, popLine, yesLine, nameLine, DONE_LINE, progressKeyOf,
} from '../bubbles.js';

const SPAWN_MS = 900;
const MIN_LIFE_MS = 3000; // chế độ chạy nhanh của test: bong bóng vẫn sống đủ lâu để chạm
const POP_MS = 260;
const HINT_MS = 10_000;
const CAPTION_MS = 3500;
const IDLE_PAUSE_MS = 120_000;
// Giảm chuyển động: các ô cố định (cột × hàng) để bong bóng không đè nhau.
const SLOTS = [[15, 22], [50, 22], [85, 22], [15, 55], [50, 55], [85, 55], [32, 84], [68, 84]];
// Bay lên: 5 làn ngang (% chiều rộng).
const LANES = [12, 31, 50, 69, 88];

const SNAPSHOT_MS = 10 * 60_000;
// Ván đang chơi: app ra nền thì màn được dựng lại (continueDirectly) — chơi tiếp đúng ván (cùng kiểu, cùng mức).
let snapshot = null;

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const MODE_LABEL = {
  colors: { emoji: '🎨', en: 'Colors', vi: 'Màu sắc' },
  numbers: { emoji: '🔢', en: 'Numbers', vi: 'Số' },
  words: { emoji: '🐱', en: 'Words', vi: 'Từ vựng' },
};

/** Từ (có emoji) của các bài từ vựng; bé đã học thì ưu tiên (đủ MIN_WORDS từ đã học thì chỉ dùng từ đã học). */
async function lessonWords(app) {
  const lessons = (await app.db.getAll('lessons').catch(() => []))
    .filter((l) => Array.isArray(l.words) && isWordLesson(l) && !isTalkLesson(l) && !isNumberLesson(l) && !isPhonicsLesson(l));
  const all = itemsFor('words', 1, lessons.flatMap((l) => l.words));
  const learned = new Set((await app.db.getAll('progress').catch(() => [])).filter((p) => (p.practiceCount ?? 0) > 0).map((p) => p.word));
  const known = all.filter((w) => learned.has(w.key));
  return known.length >= MIN_WORDS ? known : all;
}

// ---------- Chọn chế độ ----------
export function bubblesHome(app) {
  app.root.className = 'child-screen bb-home';
  const back = h('button.sp-back', { type: 'button', 'aria-label': 'Về trò chơi', text: '🎲', onclick: () => { play('tap'); app.go('play'); } });
  const grid = h('div.bb-modes');
  app.root.append(h('header.child-top', {}, homeButton(app), back), grid);
  const card = (mode, enabled) => {
    const m = MODE_LABEL[mode];
    return h('button.home-btn.bb-mode', {
      type: 'button', 'aria-label': m.vi, disabled: !enabled, dataset: { mode },
      onclick: () => { play('tap'); app.go('bubbles-play', { mode }); },
    }, h('span.home-emoji', { text: m.emoji }), h('span.home-text', {}, h('span.home-en', { text: m.en }), h('span.home-vi', { text: m.vi })));
  };
  grid.append(card('colors', true), card('numbers', true), card('words', true));
  lessonWords(app).then((words) => {
    const btn = grid.querySelector('[data-mode="words"]');
    if (btn && words.length < MIN_WORDS) btn.disabled = true;
  });
  app.speaker.speak(INTRO_LINE[0]).catch(() => {});
}

// ---------- Chơi ----------
export function bubblesScreen(app, params = {}) {
  const signal = app.startActivity();
  const mode = ['colors', 'numbers', 'words'].includes(params.mode) ? params.mode : 'colors';
  app.root.className = `child-screen bb-play bb-${mode}`;
  const state = cleanBubblesState(app.settings.bubblesGame);
  const level = LEVELS[state.level];
  const reduced = reduceMotion();
  let plan = null;
  let step = 0; // đã bắt đúng bao nhiêu
  let wrongs = 0;
  let spawnTimer = null;
  let hintTimer = null;
  let finished = false;
  let uid = 0;
  let recentLanes = [];
  let talking = false;

  // ---------- Giao diện ----------
  const bunny = createBunny(app);
  const bongBtn = h('button.sp-bong', { type: 'button', 'aria-label': 'Nghe lại', onclick: () => { play('tap'); say(); } }, bunny.el);
  const back = h('button.sp-back', { type: 'button', 'aria-label': 'Chọn kiểu bong bóng', text: '🫧', onclick: () => { play('tap'); app.go('bubbles'); } });
  const wantCard = h('button.sp-request.bb-want', { type: 'button', 'aria-label': 'Cần bắt', hidden: true, onclick: () => { play('tap'); say(); } });
  const dots = h('div.bb-dots', { 'aria-label': 'Đã bắt' }, ...Array.from({ length: TARGETS_PER_ROUND }, () => h('span.bb-dot')));
  const field = h('div.bb-field', { dataset: { motion: reduced ? 'still' : 'rise' } });
  const sayBox = h('div.ms-say.bb-say');
  app.root.append(
    h('header.child-top.sp-top', {}, homeButton(app), back, h('span.sp-title', { text: `🫧 ${MODE_LABEL[mode].en}` }), wantCard, bongBtn),
    dots, field, sayBox,
  );

  // ---------- Nói ----------
  let talkGen = 0;
  let captionTimer = null;
  function caption(en, vi) {
    clearTimeout(captionTimer);
    sayBox.replaceChildren(h('div.caption.sp-caption', { 'aria-live': 'polite' },
      h('span.caption-en', { text: en }), vi ? h('span.caption-vi', { text: vi }) : null));
  }
  /** Một hàng nói duy nhất: câu mới thay câu cũ. Giọng đọc lỗi thì vẫn đi tiếp (phụ đề + thẻ cần bắt vẫn hiện). */
  async function talk(lines) {
    const gen = ++talkGen;
    talking = true;
    try {
      for (const [en, vi] of lines) {
        if (gen !== talkGen || signal.aborted) return;
        caption(en, vi);
        try {
          await app.speaker.speak(en, { signal });
        } catch {
          if (signal.aborted) return;
        }
      }
    } finally {
      if (gen === talkGen) talking = false;
    }
    if (gen === talkGen) captionTimer = setTimeout(() => sayBox.replaceChildren(), CAPTION_MS);
  }

  const target = () => plan?.kinds.find((k) => k.key === plan.targets[step]);
  const say = () => { if (target()) talk([popLine(mode, target())]); };

  function face(it) {
    if (mode === 'numbers') return h('span.bb-num', { text: String(it.n) });
    if (mode === 'words') return h('span.bb-emoji', { text: it.emoji });
    return null;
  }
  function renderWant() {
    const it = target();
    wantCard.hidden = !it;
    if (!it) return;
    wantCard.dataset.key = it.key;
    wantCard.style.setProperty('--bb-color', it.hex ?? '');
    wantCard.replaceChildren(mode === 'colors' ? h('span.bb-swatch') : face(it));
    dots.querySelectorAll('.bb-dot').forEach((d, i) => d.classList.toggle('on', i < step));
    for (const b of field.querySelectorAll('.bb-bubble')) b.classList.toggle('want', b.dataset.key === it.key);
  }

  // ---------- Bong bóng ----------
  const onScreen = () => [...field.querySelectorAll('.bb-bubble:not(.popped)')];
  function spawn() {
    if (finished || !plan || signal.aborted) return;
    const live = onScreen();
    // Đầy thì bỏ lượt thả này; luôn chừa một chỗ cho quả cần bắt (quả cần bắt bay mất thì lần thả sau thay ngay).
    const it = nextBubble(plan.kinds, target()?.key, live.map((b) => b.dataset.key), Math.random, level.maxOnScreen);
    if (!it) return;
    const life = Math.max(scaled(level.riseS * 1000), MIN_LIFE_MS);
    const el = h('button.bb-bubble', {
      type: 'button', 'aria-label': it.en, dataset: { key: it.key, id: String(++uid) },
    }, face(it));
    if (it.hex) el.style.setProperty('--bb-color', it.hex);
    el.style.setProperty('--bb-life', `${life}ms`);
    if (reduced) {
      const used = new Set(live.map((b) => b.dataset.slot));
      const free = SLOTS.map((_, i) => String(i)).filter((i) => !used.has(i));
      if (!free.length) return;
      const slot = free[Math.floor(Math.random() * free.length)];
      const [x, y] = SLOTS[Number(slot)];
      el.dataset.slot = slot;
      el.style.setProperty('--bb-x', `${x}%`);
      el.style.top = `${y}%`;
      setTimeout(() => el.isConnected && !el.classList.contains('popped') && el.remove(), life);
    } else {
      // Bay lên từ đáy ở một trong 5 làn, khác làn của 2 quả vừa thả (không chồng nhau), lắc nhẹ sang trái / phải.
      const lanes = LANES.filter((x) => !recentLanes.includes(x));
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      recentLanes = [lane, ...recentLanes].slice(0, 2);
      el.style.setProperty('--bb-x', `${lane}%`);
      el.style.setProperty('--bb-sway', `${Math.random() < 0.5 ? -1 : 1}`);
      el.addEventListener('animationend', (e) => { if (e.animationName === 'bb-rise') el.remove(); });
    }
    el.classList.toggle('want', it.key === target()?.key);
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      pop(el, it);
    });
    field.append(el);
  }

  function pop(el, it) {
    if (el.classList.contains('popped') || finished) return;
    // Giữ nguyên chỗ đang bay tới (bỏ hoạt ảnh bay thì bong bóng không nhảy về đáy) rồi mới vỡ.
    if (!reduced) {
      const r = el.getBoundingClientRect();
      const f = field.getBoundingClientRect();
      el.style.top = `${r.top - f.top + r.height / 2}px`;
    }
    el.classList.add('popped');
    play('pop');
    setTimeout(() => el.remove(), POP_MS);
    const want = target();
    if (want && it.key === want.key) {
      step += 1;
      wrongs = 0;
      snapshot = { savedAt: Date.now(), mode, level: state.level, plan, step };
      markPracticed(app, progressKeyOf(mode, it), it.emoji ?? (mode === 'numbers' ? '🔢' : '🎨'));
      if (step >= plan.targets.length) {
        finish(it);
        return;
      }
      renderWant();
      armHint();
      talk([yesLine(mode, it), popLine(mode, target())]);
      return;
    }
    // Nhầm: vỡ vẫn vui, Bông nói tên nó; nhầm lần 2 thì nhắc lại thứ cần bắt.
    wrongs += 1;
    talk([nameLine(mode, it), ...(wrongs % 2 === 0 ? [popLine(mode, want)] : [])]);
  }

  // 10 giây không bắt được: bong bóng cần bắt lấp lánh, Bông nhắc lại.
  function armHint() {
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      if (finished || app.idlePaused || signal.aborted) return; // ra nền: activity bị dừng, không đếm gợi ý
      if (talking) {
        armHint(); // Bông đang nói: đếm lại từ đầu
        return;
      }
      field.classList.add('hint');
      setTimeout(() => field.classList.remove('hint'), 3000);
      say();
      armHint();
    }, scaled(HINT_MS));
  }

  async function finish(it) {
    finished = true;
    snapshot = null;
    clearInterval(spawnTimer);
    clearTimeout(hintTimer);
    renderWant();
    dots.querySelectorAll('.bb-dot').forEach((d) => d.classList.add('on'));
    app.setSetting('bubblesGame', afterBubblesRound(state)).catch(() => {});
    app.root.dataset.state = 'done';
    await talk([yesLine(mode, it), DONE_LINE]);
    if (signal.aborted) return;
    field.replaceChildren();
    sayBox.replaceChildren();
    const teacher = new Teacher(app, { signal, bunny, stage: field });
    try {
      await runCompletion({ app, teacher, stage: field, signal });
      if (!signal.aborted) app.go('play');
    } catch {
      // rời màn giữa chừng
    }
  }

  const idlePause = setInterval(() => {
    app.idlePaused = Date.now() - app.lastTouchAt > IDLE_PAUSE_MS;
  }, 5000);

  (async () => {
    const words = mode === 'words' ? await lessonWords(app) : [];
    const items = itemsFor(mode, state.level, words);
    if (signal.aborted) return;
    if (items.length < 2) {
      app.go('bubbles');
      return;
    }
    const s = snapshot;
    if (params.continueDirectly && s && s.mode === mode && s.level === state.level && Date.now() - s.savedAt < SNAPSHOT_MS) {
      // Chơi tiếp ván dở: cùng các loại, cùng thứ tự cần bắt, giữ số đã bắt.
      plan = s.plan;
      step = s.step;
    } else {
      const seen = new Map();
      for (const rec of await app.db.getAll('progress').catch(() => [])) seen.set(rec.word, rec.practiceCount ?? 0);
      if (signal.aborted) return;
      plan = roundPlan(items, state.level, { seen, progressKey: (it) => progressKeyOf(mode, it) });
      snapshot = { savedAt: Date.now(), mode, level: state.level, plan, step: 0 };
    }
    app.root.dataset.state = 'playing';
    renderWant();
    spawn();
    spawnTimer = setInterval(spawn, scaled(SPAWN_MS));
    await talk([...(step ? [] : [INTRO_LINE]), popLine(mode, target())]);
    armHint();
  })();

  return () => {
    finished = true;
    talkGen += 1;
    clearInterval(spawnTimer);
    clearTimeout(hintTimer);
    clearTimeout(captionTimer);
    clearInterval(idlePause);
    bunny.destroy();
  };
}
