// Phần D: Truyện chạm được (SPEC 4.3 D + SPEC-words-play mục 4).
// Mỗi câu: sân khấu có nhân vật (từ của bài trong câu) → Bông đọc, chữ sáng theo → [repeat: bé nói theo cụm ngắn]
// → [lượt Tìm: "Where's the cow? Tap the cow!", tối đa 2 câu / truyện] → chạm tự do → câu sau. Cuối truyện: "The end!".

import { h, wordVisual } from '../ui.js';
import { tokenize, normalizeWord } from '../text.js';
import { keywordsFor } from '../match.js';
import { RESULT } from '../speech/listen.js';
import { play } from '../speech/sfx.js';
import { bongElement } from '../bong.js';
import { scaled, abortError } from '../timing.js';
import { storyCast, pickDistractor, storyActors, karaokeTimes, tapLine, soundOf, findQuestion } from '../word-play.js';
import { markPracticed } from './track.js';

export const FIND_WAIT_MS = 6000; // lượt Tìm: chờ bé chạm đúng tối đa ~6 giây rồi Bông chỉ
export const FREE_IDLE_MS = 2000; // chạm tự do: không chạm thêm ~2 giây thì sang câu sau
export const FREE_MAX_MS = 8000; // … nhưng không quá ~8 giây kể từ lúc bắt đầu chạm tự do
export const END_MAX_MS = 6000; // trang "The end!"

/** Tách câu thành các đoạn, tô màu từ khóa trong bài và gắn emoji (mỗi từ khóa: data-word). */
export function highlightStory(text, words) {
  const entries = words
    .map((w) => ({ w, tokens: tokenize(w.en) }))
    .filter((e) => e.tokens.length)
    .sort((a, b) => b.tokens.length - a.tokens.length);
  const parts = text.split(/(\s+)/);
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    let matched = null;
    for (const { w, tokens } of entries) {
      const slice = [];
      for (let j = i, k = 0; k < tokens.length && j < parts.length; j++) {
        if (/^\s+$/.test(parts[j])) {
          slice.push(parts[j]);
          continue;
        }
        const t = tokenize(parts[j]);
        const ok = t.length === 1 && (t[0] === tokens[k] || t[0] === `${tokens[k]}s`);
        if (!ok) break;
        slice.push(parts[j]);
        k++;
        if (k === tokens.length) matched = { w, length: slice.length };
      }
      if (matched) break;
    }
    if (matched) {
      const chunk = parts.slice(i, i + matched.length).join('');
      out.push(h('mark.keyword', { dataset: { word: matched.w.en } }, chunk, h('span.keyword-emoji', { text: matched.w.emoji })));
      i += matched.length - 1;
    } else {
      out.push(parts[i]);
    }
  }
  return out;
}

/** Dòng chữ chạm được: mỗi chữ một ô (dấu câu dính vào chữ, không là ô riêng); từ của bài là ô tô màu + emoji. */
function storyLine(text, words) {
  const cells = [];
  const line = h('div.story-line');
  for (const part of highlightStory(text, words)) {
    if (typeof part !== 'string') {
      part.classList.add('sw');
      cells.push(part);
      line.append(part);
      continue;
    }
    for (const bit of part.split(/(\s+)/)) {
      if (!bit) continue;
      if (/^\s+$/.test(bit) || !tokenize(bit).length) {
        line.append(bit);
        continue;
      }
      const cell = h('span.sw', { text: bit });
      cells.push(cell);
      line.append(cell);
    }
  }
  return { line, cells };
}

const ACTOR_MOVES = ['jump', 'wiggle', 'spin'];

/**
 * Sân khấu + chạm (dùng chung cho câu truyện và trang The end). Tiếng khi chạm đi một luồng với Bông:
 * Bông / ai đang nói thì giữ lại TIẾNG CỦA LẦN CHẠM CUỐI, phát khi Bông đọc xong (không dồn hàng).
 */
function storyStage(ctx, actors, { tint = 0, extraClass = '' } = {}) {
  const { app } = ctx;
  const wrap = h(`div.story-wrap${extraClass}`);
  const scene = h('div.story-scene', { dataset: { tint: String(tint % 4) } });
  const actorsBox = h('div.story-actors');
  scene.append(actorsBox);
  wrap.append(scene);
  const actorEls = new Map();
  let pending = null;
  let lastTapAt = 0;
  let route = null; // lượt Tìm: chặn chạm nhân vật

  const addActor = (w, at = null) => {
    const el = h('button.story-actor', { type: 'button', 'aria-label': w.en, dataset: { word: w.en }, style: { '--k': String(actorEls.size) } },
      wordVisual(ctx.visuals.get(w.en), 'actor'));
    if (at != null && at < actorsBox.children.length) actorsBox.insertBefore(el, actorsBox.children[at]);
    else actorsBox.append(el);
    actorEls.set(w, el);
    return el;
  };
  for (const w of actors) addActor(w);
  if (!actors.length) actorsBox.append(h('div.story-bong', {}, bongElement('story-bong-face')));

  const say = (text) => {
    if (!text) return;
    if (app.speaker.speaking || app.listening) {
      pending = app.listening ? null : text; // mic đang nghe: không phát tiếng (mic thu nhầm)
      return;
    }
    app.speaker.speak(text, { signal: ctx.signal }).catch(() => {});
  };
  const flush = () => {
    const text = pending;
    pending = null;
    if (text) say(text);
  };
  const move = (el) => {
    const m = ACTOR_MOVES[Math.floor(Math.random() * ACTOR_MOVES.length)];
    el.classList.remove(...ACTOR_MOVES);
    void el.offsetWidth;
    el.classList.add(m);
  };
  const sparkle = (x, y, emoji = '✨') => {
    const r = wrap.getBoundingClientRect();
    const s = h('span.story-sparkle', { 'aria-hidden': 'true', text: emoji, style: { left: `${x - r.left}px`, top: `${y - r.top}px` } });
    wrap.append(s);
    setTimeout(() => s.remove(), 800);
  };
  const wordOf = (en) => ctx.lesson.words.find((w) => w.en === en);

  wrap.addEventListener('pointerdown', (e) => {
    lastTapAt = Date.now();
    const actor = e.target.closest('.story-actor');
    const cell = e.target.closest('.sw');
    if (actor) {
      const w = wordOf(actor.dataset.word);
      move(actor);
      play('sparkle');
      sparkle(e.clientX, e.clientY, Math.random() < 0.5 ? '❤️' : '⭐');
      if (route) route(w, actor);
      else say(tapLine(w));
    } else if (cell) {
      cell.classList.remove('pop');
      void cell.offsetWidth;
      cell.classList.add('pop');
      const w = cell.dataset.word ? wordOf(cell.dataset.word) : null;
      if (w) {
        const sound = soundOf(w);
        say(`${w.en}!${sound ? ` ${sound}` : ''}`);
        const actorEl = actorEls.get(w);
        if (actorEl) move(actorEl);
      } else {
        say(normalizeWord(cell.textContent));
      }
    } else if (e.target.closest('.story-scene')) {
      play('sparkle');
      sparkle(e.clientX, e.clientY);
    }
  });

  return {
    wrap, actorsBox, actorEls, addActor, flush, say, move,
    setRoute: (fn) => {
      route = fn;
    },
    lastTap: () => lastTapAt,
  };
}

/** Chạm tự do: sang tiếp khi bé ngưng chạm ~2 giây, tối đa ~8 giây (tính từ lúc bắt đầu chạm tự do). */
function freePlay(ctx, st, { idleMs = FREE_IDLE_MS, maxMs = FREE_MAX_MS } = {}) {
  const { signal } = ctx;
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      const now = Date.now();
      if (now - Math.max(start, st.lastTap()) >= scaled(idleMs) || now - start >= scaled(maxMs)) done();
    }, Math.max(20, scaled(200)));
    const onAbort = () => {
      clearInterval(timer);
      reject(abortError());
    };
    const done = () => {
      clearInterval(timer);
      signal.removeEventListener('abort', onAbort);
      resolve();
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/** Lượt Tìm: chờ bé chạm đúng nhân vật; chạm nhân vật khác thì nó kêu + "That's the pig!" (không nói sai). */
async function findTurn(ctx, st, target, cast) {
  const { teacher, signal, lesson, app } = ctx;
  const distractor = pickDistractor(lesson.words, cast);
  // Nhân vật lạ đứng ở vị trí ngẫu nhiên (trước / sau) để bé phải nhìn; không có từ phù hợp thì chỉ có nhân vật đích.
  if (distractor) st.addActor(distractor, Math.random() < 0.5 ? 0 : null).classList.add('extra');
  const [q, vi] = findQuestion(target);
  await teacher.ask(q, { vi });
  const hit = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(false), scaled(FIND_WAIT_MS));
    const onAbort = () => {
      cleanup();
      reject(abortError());
    };
    const cleanup = () => {
      clearTimeout(timer);
      st.setRoute(null);
      signal.removeEventListener('abort', onAbort);
    };
    const finish = (ok) => {
      cleanup();
      resolve(ok);
    };
    st.setRoute((w) => {
      if (w === target) finish(true);
      else st.say(`${tapLine(w)} That's the ${w.en}!`);
    });
    signal.addEventListener('abort', onAbort, { once: true });
  });
  teacher.endQuestion();
  app.speaker.cancel();
  const el = st.actorEls.get(target);
  await markPracticed(app, target.en, target.emoji);
  if (hit) {
    play('ding');
    teacher.celebrate(el);
    await teacher.say(`${tapLine(target)} Yes! The ${target.en}!`);
  } else {
    el?.classList.add('glow');
    st.move(el);
    await teacher.say(`Here's the ${target.en}!`);
  }
}

export async function runStoryStep(ctx, line, index = 0) {
  const { teacher, stage, lesson, app } = ctx;
  const cast = storyCast(line.text, lesson.words);
  const st = storyStage(ctx, cast, { tint: index });
  const { line: lineEl, cells } = storyLine(line.text, lesson.words);
  st.wrap.append(lineEl);
  stage.replaceChildren(st.wrap);

  // Chữ sáng theo giọng Bông (ước lượng thời gian — Safari iOS không báo vị trí đọc đáng tin).
  const times = karaokeTimes(cells.map((c) => c.textContent), app.settings.rate ?? 0.8);
  const timers = cells.map((c, i) => setTimeout(() => c.classList.add('lit'), scaled(times[i])));
  try {
    await teacher.say(line.text);
  } finally {
    timers.forEach(clearTimeout);
    cells.forEach((c) => c.classList.add('lit'));
  }
  st.flush();

  if (line.repeat) {
    await teacher.pause(300);
    st.wrap.append(h('div.repeat-hint', { text: line.repeat }));
    await teacher.say(`Your turn: ${line.repeat}`);
    const keywords = keywordsFor('', line.repeat);
    const { result } = await teacher.hear(keywords.length ? keywords : [normalizeWord(line.repeat)]);
    await teacher.praise(result);
    await teacher.say(line.repeat);
    if (result === RESULT.LISTEN_ONLY) await teacher.say('Good!');
    st.flush();
  }

  const target = ctx.findPlan?.get(index) ?? null;
  if (target && cast.includes(target)) await findTurn(ctx, st, target, cast);

  await teacher.checkPresence();
  await freePlay(ctx, st);
}

/** Trang kết "The end!": mọi nhân vật của truyện vẫy tay, bé chạm tự do (~6 giây) rồi sang Hoan hô. */
export async function runStoryEnd(ctx) {
  const { teacher, stage, lesson } = ctx;
  const st = storyStage(ctx, storyActors(lesson.story, lesson.words), { tint: 3, extraClass: '.the-end' });
  st.wrap.append(h('div.story-end-title', { text: 'The end!' }));
  stage.replaceChildren(st.wrap);
  play('tada');
  await teacher.say('The end! Bye-bye, friends!');
  st.flush();
  await freePlay(ctx, st, { maxMs: END_MAX_MS });
}
