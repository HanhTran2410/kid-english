// Các bước của kiểu học Jolly Phonics (SPEC-jolly.md): gặp âm, nghe âm đầu, tìm chữ, ghép âm.
// Âm rời LUÔN phát từ file (app/sounds/phonics/) — không bao giờ đọc bằng giọng máy; âm thanh bị khóa / lỗi thì chữ rung
// thay cho âm. Giọng máy chỉ đọc câu của Bông và từ trọn vẹn. Không bắt nói, không trừ sao.

import { h } from '../ui.js';
import { play, audioContext, isAudioLocked } from '../speech/sfx.js';
import {
  SOUND_BY, soundUrl, soundKey, startChoices, letterChoicesFor, blendChoices, cap,
  MEET_INTRO, START_Q, LETTER_Q, BLEND_LISTEN, BLEND_Q,
} from '../jolly.js';
import { markPracticed, markPhrasePick } from './track.js';

const buffers = new Map();
const PLAY_MAX_MS = 3000;

/**
 * Phát âm rời từ file qua WebAudio. Trả về true nếu đã phát. Âm thanh bị khóa / lỗi: rung chữ đang hiện, trả về false
 * (KHÔNG đọc bằng giọng máy). `stage.dataset.lastSound` + `soundCount` để kiểm thử.
 */
export async function playSound(ctx, s) {
  const { stage, signal } = ctx;
  stage.dataset.lastSound = s;
  stage.dataset.soundCount = String(Number(stage.dataset.soundCount ?? 0) + 1);
  const lit = stage.querySelectorAll(`[data-sound="${s}"]`);
  lit.forEach((el) => el.classList.add('sounding'));
  try {
    const c = audioContext();
    if (!c || isAudioLocked()) throw new Error('locked');
    let buffer = buffers.get(s);
    if (!buffer) {
      const res = await fetch(soundUrl(s));
      if (!res.ok) throw new Error(String(res.status));
      buffer = await c.decodeAudioData(await res.arrayBuffer());
      buffers.set(s, buffer);
    }
    if (signal.aborted) return false;
    stage.dataset.soundFrom = 'file';
    await new Promise((resolve) => {
      const src = c.createBufferSource();
      src.buffer = buffer;
      src.connect(c.destination);
      const done = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', stop);
        resolve();
      };
      const stop = () => {
        try {
          src.stop();
        } catch {
          // đã dừng
        }
        done();
      };
      const timer = setTimeout(stop, Math.min(buffer.duration * 1000 + 80, PLAY_MAX_MS));
      signal.addEventListener('abort', stop, { once: true });
      src.onended = done;
      src.start();
    });
    return true;
  } catch {
    stage.dataset.soundFrom = 'none';
    lit.forEach((el) => {
      el.classList.remove('shake');
      void el.offsetWidth;
      el.classList.add('shake');
    });
    await ctx.teacher.pause(600);
    return false;
  } finally {
    lit.forEach((el) => el.classList.remove('sounding'));
  }
}

/** Câu có âm rời ở giữa: Bông nói phần trước → phát âm → nói phần sau (dấu câu đơn lẻ thì không đọc). */
async function sayWithSound(ctx, before, s, after = '') {
  if (before) await ctx.teacher.say(before);
  await playSound(ctx, s);
  if (after && /\w/.test(after)) await ctx.teacher.say(after);
}

/** Hình của một từ: ảnh (nếu có) hoặc emoji. */
function picture(ctx, word) {
  const url = ctx.imageOf?.(word.en);
  if (!url) return h('span.word-pic', {}, h('span.emoji', { text: word.emoji }));
  const box = h('span.word-pic');
  const img = h('img', { src: url, alt: '', draggable: false });
  img.addEventListener('error', () => box.replaceChildren(h('span.emoji', { text: word.emoji })), { once: true });
  box.append(img);
  return box;
}

/** Thẻ chữ thường của một âm (Jolly dạy chữ thường). */
function soundCard(s, { plain = false, tag = 'span' } = {}) {
  return h(`${tag}.letter-card.jolly-letter`, { dataset: { sound: s }, style: { '--letter-color': plain ? 'var(--ink)' : SOUND_BY.get(s)?.color ?? 'var(--ink)' } },
    h('span.lower', { text: s }));
}

/** Ghi kết quả chọn của âm (không bao giờ trừ sao): +1 khi đúng ngay lần đầu, một lần mỗi âm mỗi lượt. */
async function recordSound(ctx, s, firstTry, emoji = '') {
  const key = soundKey(s);
  const award = firstTry && !ctx.pickedThisRun.has(key) && (ctx.canAward?.(key) ?? true);
  if (firstTry) ctx.pickedThisRun.add(key);
  await markPhrasePick(ctx.app, key, emoji, { firstTry, award });
}

function shake(el) {
  play('boing');
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

/**
 * Chọn 1 trong nhiều thẻ: đúng → `onRight`; sai → lắc + `onWrong(btn)` rồi chọn lại; sai 2 lần → thẻ đúng sáng lên, `onReveal`.
 * Câu hỏi có âm rời: `speak` phát cả lúc hỏi lẫn lúc bấm 🔊.
 */
async function choose(ctx, { buttons, correct, question, speak, sound, emoji, onRight, onWrong, onReveal }) {
  const { teacher } = ctx;
  await teacher.ask(question, { speak });
  let wrong = 0;
  for (;;) {
    const tapped = await teacher.waitTap(buttons);
    if (tapped === correct) {
      if (sound) await recordSound(ctx, sound, wrong === 0, emoji);
      tapped.classList.add('correct');
      play('ding');
      teacher.celebrate(tapped);
      teacher.bunny.set('clap');
      teacher.endQuestion();
      await onRight();
      teacher.bunny.set('idle');
      break;
    }
    wrong++;
    if (wrong === 1 && sound) await recordSound(ctx, sound, false, emoji);
    shake(tapped);
    if (wrong >= 2) {
      correct.classList.add('glow');
      teacher.endQuestion();
      await onReveal();
      break;
    }
    await onWrong(tapped);
  }
  await teacher.pause(600);
}

// ---------- 1. Gặp âm ----------
export async function runMeet(ctx, entry) {
  const { teacher } = ctx;
  const s = entry.letter;
  const info = SOUND_BY.get(s);
  const letter = h('button.jolly-big', { type: 'button', 'aria-label': `Sound ${s}`, dataset: { sound: s }, style: { '--letter-color': info.color } }, h('span', { text: s }));
  const hint = h('p.jolly-action', {}, h('span.jolly-action-label', { text: 'Cùng bé: ' }), info.action);
  ctx.stage.replaceChildren(h('div.jolly-meet', {}, letter, hint));
  teacher.bunny.set('talk');
  await teacher.say(MEET_INTRO);
  await sayWithSound(ctx, info.story[0], s, info.story[1]);
  await teacher.pause(250);
  await playSound(ctx, s);
  await markPracticed(ctx.app, soundKey(s), info.words[0].emoji);
  teacher.bunny.set('idle');
  // Bé chạm chữ để nghe lại âm (một lần là đủ đi tiếp; ▶ luôn dùng được).
  await teacher.ask('Your turn! Tap the letter!', { speak: () => teacher.say('Your turn! Tap the letter!') });
  await teacher.waitTap([letter]);
  teacher.endQuestion();
  letter.classList.remove('pop');
  void letter.offsetWidth;
  letter.classList.add('pop');
  await playSound(ctx, s);
  play('ding');
  teacher.celebrate(letter);
  await teacher.pause(400);
}

// ---------- 2. Nghe âm đầu ----------
export async function runStart(ctx, entry) {
  const s = entry.letter;
  const { answer, choices } = startChoices(s);
  const buttons = choices.map((w) => h('button.choice.find-choice', { type: 'button', 'aria-label': w.en, dataset: { word: w.en } }, picture(ctx, w)));
  const correct = buttons[choices.indexOf(answer)];
  ctx.stage.replaceChildren(h('div.phonics-card', {}, soundCard(s), h('div.choices', { dataset: { count: String(buttons.length) } }, ...buttons)));
  const { teacher } = ctx;
  await choose(ctx, {
    buttons, correct, sound: s, emoji: answer.emoji,
    question: `${START_Q[0]} /${s}/${START_Q[1]}`,
    speak: () => sayWithSound(ctx, START_Q[0], s, START_Q[1]),
    onRight: async () => {
      correct.append(h('span.word-label', { text: answer.en }));
      await sayWithSound(ctx, 'Yes!', s, `${cap(answer.en)}!`);
    },
    onWrong: (b) => teacher.say(`That's ${b.dataset.word}. Try again!`),
    onReveal: () => sayWithSound(ctx, 'This one!', s, `${cap(answer.en)}!`),
  });
}

// ---------- 3. Tìm chữ ----------
export async function runLetter(ctx, entry) {
  const s = entry.letter;
  const options = letterChoicesFor(s, ctx.lesson.letters.map((l) => l.letter));
  const buttons = options.map((x) => soundCard(x, { plain: true, tag: 'button' }));
  buttons.forEach((b) => {
    b.classList.add('choice', 'letter-choice');
    b.type = 'button';
    b.setAttribute('aria-label', `letter ${b.dataset.sound}`);
  });
  const correct = buttons[options.indexOf(s)];
  ctx.stage.replaceChildren(h('div.phonics-card', {}, h('div.jolly-ear', { text: '👂', 'aria-hidden': 'true' }), h('div.choices', {}, ...buttons)));
  await choose(ctx, {
    buttons, correct, sound: s, emoji: SOUND_BY.get(s).words[0].emoji,
    question: `${LETTER_Q[0]} /${s}/${LETTER_Q[1]}`,
    speak: () => sayWithSound(ctx, LETTER_Q[0], s, LETTER_Q[1]),
    onRight: () => sayWithSound(ctx, 'Yes!', s),
    // Chọn nhầm: Bông phát âm của chữ vừa chạm (từ file) để bé nghe khác nhau thế nào.
    onWrong: (b) => sayWithSound(ctx, 'That one says', b.dataset.sound, 'Try again!'),
    onReveal: () => sayWithSound(ctx, 'Here it is!', s),
  });
}

// ---------- 4. Ghép âm ----------
/** Phát lần lượt các âm của từ, thẻ chữ sáng theo. */
async function sayParts(ctx, word, tiles) {
  for (const [i, s] of word.sounds.entries()) {
    tiles[i].classList.add('lit');
    await playSound(ctx, s);
    await ctx.teacher.pause(250);
    tiles[i].classList.remove('lit');
  }
}

export async function runBlend(ctx, word) {
  const { teacher } = ctx;
  const tiles = word.sounds.map((s) => h('span.blend-tile', { dataset: { sound: s }, style: { '--letter-color': SOUND_BY.get(s).color } }, s));
  const row = h('div.blend-row', {}, ...tiles);
  const result = h('div.blend-word', { hidden: true }, word.en);
  const area = h('div.blend-area', { dataset: { word: word.en } }, row, result);
  ctx.stage.replaceChildren(area);
  await teacher.say(BLEND_LISTEN);
  await sayParts(ctx, word, tiles);
  const merge = async () => {
    row.classList.add('merged');
    await teacher.pause(350);
    result.hidden = false;
    await teacher.say(`${cap(word.en)}!`);
  };
  if (!word.picture) {
    // Từ 2 âm (không có hình rõ): bé xem Bông ghép, chạm từ để nghe lại.
    await merge();
    await markPracticed(ctx.app, word.en, '🧩');
    await teacher.pause(500);
    return;
  }
  const options = blendChoices(word);
  const buttons = options.map((w) => h('button.choice.find-choice', { type: 'button', 'aria-label': w.en, dataset: { word: w.en } }, picture(ctx, w)));
  const correct = buttons[options.indexOf(word)];
  area.append(h('div.choices', { dataset: { count: String(buttons.length) } }, ...buttons));
  await choose(ctx, {
    buttons, correct,
    question: BLEND_Q,
    speak: async () => {
      await sayParts(ctx, word, tiles);
      await teacher.say(BLEND_Q);
    },
    onRight: async () => {
      await markPracticed(ctx.app, word.en, word.emoji);
      await merge();
      await sayParts(ctx, word, tiles);
      await teacher.say(`${cap(word.en)}!`);
    },
    onWrong: async (b) => {
      await teacher.say(`That's ${b.dataset.word}. Listen again!`);
      await sayParts(ctx, word, tiles);
    },
    onReveal: merge,
  });
}
