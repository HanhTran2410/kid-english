// Mẫu câu (SPEC-patterns.md): "tấm tranh khung câu" (vòng câu ở giữa, các hình quanh) và các phần của bài:
// A khám phá (chạm hình → hình vào chỗ trống → Bông đọc câu), B nói theo, C bé tự nói, D trò chơi, bài hát cuối.

import { h, wordVisual } from '../ui.js';
import { play } from '../speech/sfx.js';
import { RESULT } from '../speech/listen.js';
import { scaled, abortError } from '../timing.js';
import { hasRecordingToday } from '../db.js';
import { markSentence, markPracticed, saveRecording } from './track.js';
import {
  LEVEL, betterLevel, frameParts, filledText, spokenSentence, frameLead, chunkedSentence, sentenceViOf, realLifeSentence,
  speechLevel, patternKey,
} from '../patterns.js';

const NUDGE_MS = 10_000; // phần A: 10 giây không chạm → "Tap a picture!"
const AUTO_MS = 20_000; // thêm 10 giây → Bông tự chọn MỘT hình
const TELL_FIRST_MS = 4000; // phần C: 4 giây chưa nói → chữ mờ trong chỗ trống
const WORD_BEAT_MS = 300; // nhịp sáng từng từ khi Bông đọc câu
const REVEAL_PUFFS = 3;

// Vị trí tâm các vòng hình (% khung), như tranh khung câu: 1 trên, 2 ngang, 2 dưới (+1 dưới giữa).
const SPOTS = {
  4: [[50, 15], [14, 52], [86, 52], [50, 88]],
  5: [[50, 15], [16, 38], [84, 38], [24, 80], [76, 80]],
  6: [[50, 15], [16, 36], [84, 36], [16, 74], [84, 74], [50, 87]],
};
const TINTS = ['#fff3bf', '#d0ebff', '#e5dbff', '#d3f9d8', '#ffe3e3', '#ffe8cc'];
const LINE_COLORS = ['#f03e3e', '#fab005', '#228be6', '#40c057', '#f76707', '#e64980'];

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Dựng tấm tranh khung câu.
 * @param {(slot: object) => string|null} urlOf ảnh của hình (null → emoji)
 */
export function createPoster(lesson, urlOf) {
  const n = lesson.slots.length;
  const spots = SPOTS[n] ?? SPOTS[6];
  const parts = frameParts(lesson);
  const tokens = parts.before.split(' ').filter(Boolean).map((t) => h('span.pt-tok', { text: t }));
  const blank = h('span.pt-blank', { 'aria-live': 'polite' });
  const after = h('span.pt-tok.pt-after', { text: parts.after || '.' });
  const center = h('div.pt-center', {}, h('div.pt-frame', {}, ...tokens, blank, after));
  const showMe = h('button.pt-showme', { type: 'button', 'aria-label': 'Show me', title: 'Bông chọn giúp một hình', text: '👆', hidden: true });
  const lines = `<svg class="pt-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${
    spots.map(([x, y], i) => `<line x1="50" y1="52" x2="${x}" y2="${y}" stroke="${LINE_COLORS[i % LINE_COLORS.length]}" stroke-width="0.9" stroke-linecap="round"/>`).join('')}</svg>`;
  const pics = lesson.slots.map((slot, i) => h('button.pt-pic', {
    type: 'button',
    'aria-label': slot.word,
    dataset: { slot: String(i), word: slot.word },
    style: { '--x': `${spots[i][0]}%`, '--y': `${spots[i][1]}%`, '--tint': TINTS[i % TINTS.length] },
  }, wordVisual({ url: urlOf(slot), emoji: slot.emoji, word: slot.word }, 'pt-visual'), h('span.pt-word', { text: slot.word }), h('span.pt-check', { text: '✓', 'aria-hidden': 'true' })));
  const board = h('div.pt-board', { dataset: { count: String(n) }, html: lines }, center, showMe, ...pics);
  const say = h('div.pt-say', { 'aria-live': 'polite' });
  const el = h('div.pt-poster', {}, h('div.pt-title', {}, h('span', { text: lesson.emoji }), h('b', { text: lesson.title })), board, say);

  const bounce = (node, cls = 'bounce') => {
    node.classList.remove(cls);
    void node.getBoundingClientRect();
    node.classList.add(cls);
  };

  const poster = {
    el, pics, center, blank, showMe,
    /** Chỗ trống trống lại. */
    clear() {
      blank.replaceChildren();
      blank.classList.remove('filled', 'ghost');
      for (const p of pics) p.classList.remove('active', 'glow');
    },
    /** Hình `i` trượt vào chỗ trống (giảm chuyển động: hiện thẳng). */
    fill(i, { animate = true } = {}) {
      const slot = lesson.slots[i];
      const chip = h('span.pt-fill', {}, wordVisual({ url: urlOf(slot), emoji: slot.emoji, word: slot.word }, 'pt-mini'), h('span', { text: filledText(lesson, slot) }));
      blank.replaceChildren(chip);
      blank.classList.add('filled');
      blank.classList.remove('ghost');
      for (const p of pics) p.classList.toggle('active', p === pics[i]);
      if (animate && !reducedMotion() && chip.animate) {
        const from = pics[i].getBoundingClientRect();
        const to = chip.getBoundingClientRect();
        if (from.width && to.width) {
          const dx = from.left + from.width / 2 - (to.left + to.width / 2);
          const dy = from.top + from.height / 2 - (to.top + to.height / 2);
          chip.animate([{ transform: `translate(${dx}px, ${dy}px) scale(0.6)`, opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: scaled(450), easing: 'ease-out' });
        }
      }
    },
    /** Gợi ý chữ mờ trong chỗ trống (phần C). */
    ghost(i) {
      blank.replaceChildren(h('span.pt-ghost', { text: filledText(lesson, lesson.slots[i]) }));
      blank.classList.add('ghost');
    },
    check(i) {
      pics[i].classList.add('done');
    },
    unchecked() {
      return pics.map((p, i) => (p.classList.contains('done') ? -1 : i)).filter((i) => i >= 0);
    },
    bounce(i) {
      bounce(pics[i]);
    },
    glow(i) {
      pics[i].classList.add('glow');
    },
    /** Mây che hình `i` (trò ló dần): còn bao nhiêu cụm mây. */
    cover(i) {
      const cloud = h('span.pt-cloud', { 'aria-hidden': 'true' }, ...Array.from({ length: REVEAL_PUFFS }, () => h('span.pt-puff', { text: '☁️' })));
      pics[i].append(cloud);
      pics[i].classList.add('covered');
    },
    /** Bỏ một cụm mây; trả về số cụm còn lại. */
    puff(i) {
      const left = pics[i].querySelectorAll('.pt-puff:not(.gone)');
      left[left.length - 1]?.classList.add('gone'); // cụm dưới cùng (đặc nhất) đi sau cùng
      return Math.max(0, left.length - 1);
    },
    uncover(i) {
      pics[i].querySelector('.pt-cloud')?.remove();
      pics[i].classList.remove('covered');
    },
    caption(text) {
      say.textContent = text ?? '';
    },
    /** Từng từ của khung sáng lên theo nhịp trong lúc Bông đọc câu. */
    highlight() {
      const seq = [...tokens, blank, after];
      let k = 0;
      center.classList.add('talking');
      const step = () => {
        seq.forEach((t, j) => t.classList.toggle('lit', j === k));
        k = Math.min(k + 1, seq.length - 1);
      };
      step();
      const timer = setInterval(step, scaled(WORD_BEAT_MS));
      return () => {
        clearInterval(timer);
        center.classList.remove('talking');
        seq.forEach((t) => t.classList.remove('lit'));
      };
    },
  };
  return poster;
}

/** Bông đọc câu của hình `i`, các từ sáng theo nhịp; hiện câu tiếng Việt ở hàng riêng. */
async function sayLine(ctx, i, text = spokenSentence(ctx.lesson, ctx.lesson.slots[i])) {
  const { poster, teacher, lesson } = ctx;
  poster.caption(sentenceViOf(lesson, lesson.slots[i]));
  const stop = poster.highlight();
  try {
    await teacher.say(text);
  } finally {
    stop();
  }
}

/** Hình vào chỗ trống + Bông đọc câu + ✓. */
async function showSentence(ctx, i, { text } = {}) {
  ctx.poster.fill(i);
  ctx.poster.bounce(i);
  await sayLine(ctx, i, text);
  ctx.poster.check(i);
}

// ---------- A. Khám phá ----------

/**
 * Chờ bé chạm một hình (hoặc 👆). 10 giây: nhắc "Tap a picture!" + một hình chưa chạm nảy; thêm 10 giây: Bông tự chọn
 * MỘT hình chưa chạm. Chạm lúc Bông đang nói thì bỏ qua.
 * @returns {Promise<number>}
 */
function waitExplore(ctx) {
  const { poster, app, teacher, signal } = ctx;
  return new Promise((resolve, reject) => {
    const timers = [];
    const pickUnchecked = () => {
      const rest = poster.unchecked();
      return rest[Math.floor(Math.random() * rest.length)] ?? 0;
    };
    const cleanup = () => {
      timers.forEach(clearTimeout);
      poster.pics.forEach((p) => p.removeEventListener('click', onPic));
      poster.showMe.removeEventListener('click', onShowMe);
      signal.removeEventListener('abort', onAbort);
    };
    const done = (i) => {
      cleanup();
      resolve(i);
    };
    const onPic = (e) => {
      if (app.speaker.speaking) return;
      play('tap');
      done(Number(e.currentTarget.dataset.slot));
    };
    const onShowMe = () => {
      if (app.speaker.speaking) return;
      play('tap');
      done(pickUnchecked());
    };
    const onAbort = () => {
      cleanup();
      reject(abortError());
    };
    poster.pics.forEach((p) => p.addEventListener('click', onPic));
    poster.showMe.addEventListener('click', onShowMe);
    signal.addEventListener('abort', onAbort, { once: true });
    timers.push(setTimeout(() => {
      const rest = poster.unchecked();
      if (rest.length) poster.bounce(rest[0]);
      teacher.say('Tap a picture!').catch(() => {});
    }, scaled(NUDGE_MS)));
    timers.push(setTimeout(() => done(pickUnchecked()), scaled(AUTO_MS)));
  });
}

export async function runExplore(ctx) {
  const { teacher, lesson, poster } = ctx;
  poster.clear();
  poster.showMe.hidden = false;
  poster.caption(lesson.frameVi ? lesson.frameVi.replace(/_{2,}/, '…') : '');
  await teacher.say(`${lesson.title}! ${frameLead(lesson)}`);
  await showSentence(ctx, 0);
  await teacher.say('Your turn! Tap a picture!');
  while (poster.unchecked().length) {
    const i = await waitExplore(ctx);
    await showSentence(ctx, i);
  }
  poster.showMe.hidden = true;
}

// ---------- Nghe câu bé nói (mục 4.4) ----------

/** Nghe bé nói câu của hình: kết quả nghe + mức câu (cả câu / một phần / từ khóa / không có từ khóa). */
async function hearSentence(ctx, slot, { maxMs = 5500 } = {}) {
  const { app, teacher, lesson } = ctx;
  const line = spokenSentence(lesson, slot);
  const keepVoice = app.settings.recordVoice && app.mic.ready && !(await hasRecordingToday(app.db, line));
  const levelOf = (alts) => speechLevel(alts, lesson, slot);
  const outcome = await teacher.hear([slot.word, slot.concept], {
    record: keepVoice, maxMs,
    matcher: (alts) => levelOf(alts) !== LEVEL.NONE,
    stopWhen: (alts) => levelOf(alts) === LEVEL.FULL,
  });
  if (outcome.recording) await saveRecording(app, lesson.id, line, outcome.recording);
  const level = outcome.result === RESULT.MATCH ? levelOf(outcome.heard ?? []) : LEVEL.NONE;
  return { result: outcome.result, level: level === LEVEL.NONE && outcome.result === RESULT.MATCH ? LEVEL.KEYWORD : level };
}

/** Khen theo mức (không bao giờ nói "sai"). */
async function praiseFull(ctx, i) {
  const { teacher, poster } = ctx;
  play('ding');
  teacher.celebrate(poster.pics[i]);
  teacher.bunny.set('clap');
  await teacher.say('Great job!');
  teacher.bunny.set('idle');
}

/** Ghi tiến độ câu (+ "đã luyện" từ khóa ở kho từ chung khi bé nói ra từ khóa). */
async function track(ctx, slot, level) {
  const { app, lesson } = ctx;
  await markSentence(app, patternKey(lesson, slot), slot.emoji, level === LEVEL.NONE ? null : level);
  if (level !== LEVEL.NONE) await markPracticed(app, slot.concept || slot.word, slot.emoji);
}

// ---------- B. Nói theo ----------

export async function runSay(ctx, i, round) {
  const { teacher, lesson, poster } = ctx;
  const slot = lesson.slots[i];
  const line = spokenSentence(lesson, slot);
  poster.clear();
  poster.fill(i);
  poster.bounce(i);
  if (round < 2) {
    // Nối dần (hai hình đầu): khung trước, từ khóa sau.
    const [lead, word] = chunkedSentence(lesson, slot);
    poster.caption(sentenceViOf(lesson, slot));
    const stop = poster.highlight();
    try {
      await teacher.say(lead);
      await teacher.pause(250);
      await teacher.say(word);
    } finally {
      stop();
    }
  } else {
    await sayLine(ctx, i);
  }

  let { result, level } = await hearSentence(ctx, slot);
  let best = level;
  if (result === RESULT.LISTEN_ONLY) {
    await sayLine(ctx, i);
    await teacher.say('Good!');
  } else if (level === LEVEL.FULL) {
    await praiseFull(ctx, i);
    await sayLine(ctx, i);
  } else if (level === LEVEL.PARTIAL || level === LEVEL.KEYWORD) {
    play('pop');
    await sayLine(ctx, i, level === LEVEL.PARTIAL ? `Good! ${line}` : `Yes! ${capital(slot.word)}! ${line}`);
    // Mời nói lại cả câu MỘT lần.
    await teacher.say(`Say it with me: ${line}`);
    ({ result, level } = await hearSentence(ctx, slot));
    best = betterLevel(best, level);
    if (level === LEVEL.FULL) await praiseFull(ctx, i);
    else if (result !== RESULT.SILENT) await teacher.say('Good!');
  } else if (result === RESULT.VOICE) {
    play('pop');
    await sayLine(ctx, i, `Good try! ${line}`);
  } else {
    // Im lặng: Bông nói mẫu, chờ thêm một lần rồi đi tiếp.
    await sayLine(ctx, i, `Let's try! ${line}`);
    ({ result, level } = await hearSentence(ctx, slot));
    best = betterLevel(best, level);
    if (level === LEVEL.FULL) await praiseFull(ctx, i);
    else if (level !== LEVEL.NONE) await sayLine(ctx, i, `Yes! ${line}`);
    else if (result === RESULT.VOICE) await teacher.say('Good try!');
  }
  poster.check(i);
  await track(ctx, slot, best);
  await teacher.checkPresence();
  await teacher.pause(400);
}

// ---------- C. Bé tự nói ----------

export async function runTell(ctx, i) {
  const { teacher, lesson, poster } = ctx;
  const slot = lesson.slots[i];
  const line = spokenSentence(lesson, slot);
  poster.clear();
  poster.pics[i].classList.add('active');
  poster.bounce(i);
  poster.caption(lesson.promptVi ?? '');
  await teacher.ask(lesson.prompt || 'Tell me!', { vi: lesson.promptVi ?? '' });

  let { result, level } = await hearSentence(ctx, slot, { maxMs: TELL_FIRST_MS });
  let best = level;
  if (level === LEVEL.NONE && result !== RESULT.LISTEN_ONLY) {
    // Chưa nói được: chữ mờ trong chỗ trống làm gợi ý, nghe thêm một lần.
    poster.ghost(i);
    ({ result, level } = await hearSentence(ctx, slot));
    best = betterLevel(best, level);
  }
  teacher.endQuestion();
  poster.fill(i);
  if (result === RESULT.LISTEN_ONLY) {
    await sayLine(ctx, i);
    await teacher.say('Good!');
  } else if (level === LEVEL.FULL) {
    await praiseFull(ctx, i);
    await sayLine(ctx, i);
  } else if (level !== LEVEL.NONE) {
    play('pop');
    await sayLine(ctx, i, `Yes! ${line}`);
  } else if (result === RESULT.VOICE) {
    await sayLine(ctx, i, `Good try! ${line}`);
  } else {
    await sayLine(ctx, i); // lần 2 vẫn im lặng: Bông nói mẫu
  }
  poster.check(i);
  await track(ctx, slot, best);
  await teacher.checkPresence();
  await teacher.pause(400);
}

// ---------- D. Trò chơi ----------

/** Chờ bé chạm một hình (trong `allowed`); chạm lúc Bông đang nói thì bỏ qua. */
function waitPick(ctx, allowed = null) {
  const { poster, app, signal } = ctx;
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      poster.pics.forEach((p) => p.removeEventListener('click', onPic));
      signal.removeEventListener('abort', onAbort);
    };
    const onPic = (e) => {
      const i = Number(e.currentTarget.dataset.slot);
      if (app.speaker.speaking || (allowed && !allowed.includes(i))) return;
      cleanup();
      resolve(i);
    };
    const onAbort = () => {
      cleanup();
      reject(abortError());
    };
    poster.pics.forEach((p) => p.addEventListener('click', onPic));
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/** Nghe → chạm: chạm nhầm thì Bông nói hình đó và dẫn bé tới hình đúng (không "Try again"). */
async function listenTap(ctx, i) {
  const { teacher, lesson, poster } = ctx;
  const slot = lesson.slots[i];
  const line = spokenSentence(lesson, slot);
  const noun = frameParts(lesson).hasArticle;
  poster.clear();
  poster.caption(sentenceViOf(lesson, slot));
  await teacher.ask(line, { vi: sentenceViOf(lesson, slot) });
  for (let wrong = 0; ;) {
    const j = await waitPick(ctx);
    if (j === i) {
      teacher.endQuestion();
      play('ding');
      teacher.celebrate(poster.pics[i]);
      poster.fill(i);
      await sayLine(ctx, i, `Yes! ${line}`);
      break;
    }
    wrong += 1;
    poster.bounce(j);
    const other = lesson.slots[j];
    if (wrong === 1) {
      const that = noun ? `That's ${filledText(lesson, other)}!` : spokenSentence(lesson, other);
      await teacher.say(`${that} Can you find ${noun ? `the ${slot.word}` : slot.word}?`);
      continue;
    }
    teacher.endQuestion();
    poster.glow(i);
    poster.fill(i);
    await sayLine(ctx, i, noun ? `Look! Here's the ${slot.word}! ${line}` : `Look! ${line}`);
    break;
  }
  poster.check(i);
}

/** Ló dần: mây che một hình, bé chạm mở dần; đoán ra trước khi mở hết thì "You guessed it!". */
async function reveal(ctx, i) {
  const { teacher, lesson, poster } = ctx;
  const slot = lesson.slots[i];
  poster.clear();
  poster.cover(i);
  poster.caption('Ai trốn sau mây? Con chạm vào mây nhé!');
  await teacher.say('Who is hiding? Tap the cloud!');
  let guessed = false;
  for (let left = REVEAL_PUFFS; left > 0;) {
    await waitPick(ctx, [i]);
    play('pop');
    left = poster.puff(i);
    if (left === 1 && !guessed) {
      await teacher.ask(lesson.prompt || 'What is it?', { vi: lesson.promptVi ?? '' });
      const { level } = await hearSentence(ctx, slot, { maxMs: TELL_FIRST_MS });
      teacher.endQuestion();
      if (level !== LEVEL.NONE) {
        guessed = true;
        play('ding');
        teacher.celebrate(poster.pics[i]);
        await teacher.say('You guessed it!');
        await track(ctx, slot, level);
        break;
      }
    }
  }
  poster.uncover(i);
  await showSentence(ctx, i);
}

/** Câu của con (bài có `ask`): bé chạm hình hợp với hôm nay. Không có đúng / sai. */
async function realLife(ctx) {
  const { teacher, lesson, poster } = ctx;
  poster.clear();
  poster.caption(lesson.askVi ?? '');
  await teacher.ask(lesson.ask, { vi: lesson.askVi ?? '' });
  const i = await waitPick(ctx);
  teacher.endQuestion();
  play('ding');
  teacher.celebrate(poster.pics[i]);
  await showSentence(ctx, i, { text: realLifeSentence(lesson, lesson.slots[i]) });
}

export async function runGame(ctx, type, i) {
  if (type === 'realLife') await realLife(ctx);
  else if (type === 'reveal') await reveal(ctx, i);
  else await listenTap(ctx, i);
  await ctx.teacher.pause(500);
}

// ---------- Bài hát cuối ----------

export async function runSong(ctx) {
  const { lesson, poster, teacher } = ctx;
  poster.clear();
  await teacher.say("Let's sing!");
  for (const [i] of lesson.slots.entries()) {
    poster.fill(i, { animate: false });
    poster.bounce(i);
    poster.check(i);
    await sayLine(ctx, i);
  }
  teacher.celebrate(poster.center);
}
