// Trò Ai kêu thế? (SPEC-sounds.md): Bông giả tiếng kêu rồi hỏi "Who says moo?"; bé chạm đúng con vật.
// Nhầm thì Bông nói tên + tiếng kêu của con vừa chạm rồi hỏi lại; nhầm 2 lần / 10 giây không chạm thì con đúng sáng lên.
// 5 câu → Hoan hô + sticker. Con vật = sticker Dán tranh (ảnh bố mẹ đã thay dùng luôn).

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { homeButton } from '../player/layout.js';
import { createBunny, Teacher } from '../player/teacher.js';
import { runCompletion } from '../player/completion-stage.js';
import { markPracticed } from '../player/track.js';
import { scaled } from '../timing.js';
import { loadSceneImages, itemFace } from './sticker-scene.js';
import { ITEM_BY_ID } from '../sticker-scenes.js';
import {
  ANIMAL_BY_ID, roundQuestions, cleanSoundsState, afterSoundsRound,
  INTRO_LINE, soundLine, whoLine, yesLine, yourTurnLine, wrongLine,
} from '../animal-sounds.js';

const HINT_MS = 10_000;
const MAX_HINTS = 2;
const CAPTION_MS = 3500;
const TURN_MS = 1800; // sau "Can you say moo?": chờ bé kêu theo
const IDLE_PAUSE_MS = 120_000;
const SNAPSHOT_MS = 10 * 60_000;

// Lượt đang chơi: app ra nền thì màn được dựng lại (continueDirectly) — chơi tiếp đúng câu.
let snapshot = null;

export function animalSoundsScreen(app, params = {}) {
  const signal = app.startActivity();
  app.root.className = 'child-screen as-play';
  const state = cleanSoundsState(app.settings.soundsGame);
  let images = null;
  let token = 0;
  let questions = [];
  let index = 0;
  let wrongs = 0;
  let hints = 0;
  let solved = false;
  let hintTimer = null;

  // ---------- Giao diện ----------
  const bunny = createBunny(app);
  const current = () => ANIMAL_BY_ID.get(questions[index]?.answer);
  const bongBtn = h('button.sp-bong', { type: 'button', 'aria-label': 'Nghe lại', onclick: () => { play('tap'); replay(); } }, bunny.el);
  const back = h('button.sp-back', { type: 'button', 'aria-label': 'Về trò chơi', text: '🎲', onclick: () => { play('tap'); app.go('play'); } });
  const count = h('span.ms-count.as-count');
  const listen = h('button.as-listen', { type: 'button', 'aria-label': 'Nghe tiếng kêu', onclick: () => { play('tap'); replay(); } },
    h('span.as-listen-icon', { text: '🔊' }), h('span.as-listen-text', { text: 'Listen!' }));
  const cards = h('div.as-cards');
  const stage = h('div.as-stage', {}, listen, cards);
  const sayBox = h('div.ms-say.as-say');
  app.root.append(
    h('header.child-top.sp-top', {}, homeButton(app), back, h('span.sp-title', { text: '🐮 Who says moo?' }), count, bongBtn),
    stage, sayBox,
  );

  // ---------- Nói + phụ đề (hàng riêng) ----------
  let talkGen = 0;
  let captionTimer = null;
  function caption(en, vi) {
    clearTimeout(captionTimer);
    sayBox.replaceChildren(h('div.caption.sp-caption', { 'aria-live': 'polite' },
      h('span.caption-en', { text: en }), vi ? h('span.caption-vi', { text: vi }) : null));
  }
  async function talk(lines) {
    const gen = ++talkGen;
    for (const [en, vi] of lines) {
      if (gen !== talkGen || signal.aborted) return false;
      caption(en, vi);
      try {
        await app.speaker.speak(en, { signal });
      } catch {
        return false;
      }
    }
    if (gen === talkGen) captionTimer = setTimeout(() => sayBox.replaceChildren(), CAPTION_MS);
    return gen === talkGen;
  }
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, scaled(ms)));
  const bounce = (el) => {
    if (!el) return;
    el.classList.remove('bounce');
    void el.offsetWidth;
    el.classList.add('bounce');
  };
  const cardOf = (id) => cards.querySelector(`.as-card[data-animal="${id}"]`);
  function glow(id) {
    const el = cardOf(id);
    if (!el) return;
    el.classList.add('glow');
    setTimeout(() => el.classList.remove('glow'), 2500);
  }

  // ---------- Câu hỏi ----------
  function render() {
    const q = questions[index];
    count.textContent = `${index + 1}/${questions.length}`;
    cards.dataset.choices = String(q.choices.length);
    cards.replaceChildren(...q.choices.map((id) => {
      const a = ANIMAL_BY_ID.get(id);
      return h('button.as-card', {
        type: 'button', 'aria-label': a.name, dataset: { animal: id },
        onclick: () => choose(id),
      }, h('span.as-face', {}, itemFace(ITEM_BY_ID.get(id), images)));
    }));
  }

  function snap() {
    snapshot = { savedAt: Date.now(), level: state.level, questions, index };
  }

  async function ask(intro = false) {
    const t = ++token;
    wrongs = 0;
    hints = 0;
    solved = false;
    clearTimeout(hintTimer);
    render();
    snap();
    app.root.dataset.state = 'asking';
    const a = current();
    await talk([...(intro ? [INTRO_LINE] : []), soundLine(a), whoLine(a)]);
    if (t !== token || signal.aborted) return;
    app.root.dataset.state = 'answer';
    armHint();
  }

  function replay() {
    const a = current();
    if (!a || solved) return;
    talk([soundLine(a), whoLine(a)]);
    armHint();
  }

  // 10 giây không chạm (không tính lúc Bông đang nói): con đúng sáng lên + nghe lại tiếng kêu. Tối đa 2 lần / câu.
  function armHint() {
    clearTimeout(hintTimer);
    if (hints >= MAX_HINTS || solved) return;
    const t = token;
    hintTimer = setTimeout(() => {
      if (t !== token || solved || app.idlePaused) return;
      hints += 1;
      glow(current().id);
      talk([soundLine(current())]);
      armHint();
    }, scaled(HINT_MS));
  }

  async function choose(id) {
    if (solved || !questions.length) return;
    const t = token;
    const a = current();
    const el = cardOf(id);
    if (id === a.id) {
      solved = true;
      clearTimeout(hintTimer);
      play('cheer');
      el?.classList.add('right');
      bounce(el);
      bunny.set('clap');
      setTimeout(() => bunny.set('idle'), 1600);
      markPracticed(app, a.name, a.emoji);
      app.root.dataset.state = 'right';
      const done = await talk([yesLine(a), yourTurnLine(a)]);
      if (!done || t !== token) return;
      await wait(TURN_MS);
      if (t !== token || signal.aborted) return;
      next();
      return;
    }
    wrongs += 1;
    play('boing');
    el?.classList.remove('shake');
    void el?.offsetWidth;
    el?.classList.add('shake');
    // Nhầm 2 lần: con đúng sáng lên (tính vào số gợi ý).
    if (wrongs >= 2 && hints < MAX_HINTS) {
      hints += 1;
      glow(a.id);
    }
    await talk([wrongLine(ANIMAL_BY_ID.get(id)), soundLine(a), whoLine(a)]);
    if (t === token) armHint();
  }

  async function next() {
    if (index + 1 < questions.length) {
      index += 1;
      ask();
      return;
    }
    // Hết 5 câu: Hoan hô + sticker, đếm lượt để lên mức (áp dụng lượt sau).
    token += 1;
    snapshot = null;
    clearTimeout(hintTimer);
    app.setSetting('soundsGame', afterSoundsRound(state)).catch(() => {});
    app.root.dataset.state = 'done';
    cards.replaceChildren();
    listen.hidden = true;
    sayBox.replaceChildren();
    const teacher = new Teacher(app, { signal, bunny, stage });
    try {
      await runCompletion({ app, teacher, stage, signal });
      if (!signal.aborted) app.go('play');
    } catch {
      // rời màn giữa chừng
    }
  }

  const idlePause = setInterval(() => {
    app.idlePaused = Date.now() - app.lastTouchAt > IDLE_PAUSE_MS;
  }, 5000);

  loadSceneImages(app.db).catch(() => null).then(async (loaded) => {
    images = loaded;
    if (signal.aborted) return;
    const s = snapshot;
    if (params.continueDirectly && s && Date.now() - s.savedAt < SNAPSHOT_MS && s.level === state.level) {
      questions = s.questions;
      index = s.index;
      ask();
      return;
    }
    const seen = new Map();
    for (const rec of await app.db.getAll('progress').catch(() => [])) seen.set(rec.word, rec.practiceCount ?? 0);
    if (signal.aborted) return;
    questions = roundQuestions(state.level, { seen });
    index = 0;
    ask(true);
  });

  return () => {
    token += 1;
    talkGen += 1;
    clearTimeout(hintTimer);
    clearTimeout(captionTimer);
    clearInterval(idlePause);
    bunny.destroy();
    images?.revoke();
  };
}
