// "Ló dần" trước mỗi thẻ từ (SPEC-words-play mục 3): hình bị che → bé chạm mở từng mảng (không chạm thì tự mở dần)
// → mở ~60% thì Bông hỏi "What's this?" (bé đoán, không bao giờ "sai") → mở hết + "Ta-da!" → thẻ từ như cũ.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { bongSvg } from '../bong.js';
import { scaled, isAbort, TIME_SCALE } from '../timing.js';
import { RESULT } from '../speech/listen.js';
import {
  revealKind, revealOpener, revealTickMs, guessListenMs, REVEAL_UNITS, REVEAL_MAX_MS, GUESS_AT,
} from '../word-play.js';
import { markSpoke, spoke } from './track.js';

const DRUMROLL_EVERY_MS = 700;

/** Nét mặt Bông ở góc màn hình (vui / ngạc nhiên). */
function setMood(teacher, mood) {
  const face = teacher.bunny.el?.querySelector('.bunny-face');
  if (face && face.dataset.mood !== mood) {
    face.dataset.mood = mood;
    face.innerHTML = bongSvg({ mood });
  }
}

/**
 * @param {object} ctx ngữ cảnh bài học (app, teacher, signal…)
 * @param {{ en: string, emoji: string }} word
 * @param {{ card: HTMLElement, picture: HTMLElement, label: HTMLElement, index: number, hasImage: boolean }} parts
 */
export async function runReveal(ctx, word, { card, picture, label, index, hasImage }) {
  const { app, teacher } = ctx;
  const kind = revealKind(index, hasImage);
  const units = REVEAL_UNITS[kind];
  let opened = 0;
  let onProgress = null;

  card.classList.add('revealing');
  label.classList.add('rv-hidden');
  picture.classList.add('rv-picture', `rv-${kind}`);
  const cover = h(`div.rv-cover.${kind}`, { 'aria-label': 'Chạm để mở hình' });

  // Mỗi kiểu che: các mảng / bước mở.
  const pieces = [];
  const setLevel = () => picture.style.setProperty('--open', String(opened / units));
  if (kind === 'bubbles') {
    for (let i = 0; i < units; i++) {
      const b = h('button.rv-bubble', { type: 'button', 'aria-label': 'Bong bóng', style: { '--i': String(i) } });
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        openPiece(b);
      });
      pieces.push(b);
      cover.append(b);
    }
  } else {
    if (kind === 'curtain') cover.append(h('span.rv-curtain.left'), h('span.rv-curtain.right'));
    cover.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      openPiece(null);
    });
  }
  picture.append(cover);
  setLevel();

  /** Mở một mảng (`piece` = bong bóng được chạm; null = mảng tiếp theo). */
  function openPiece(piece, { sound = true } = {}) {
    if (opened >= units) return;
    if (kind === 'bubbles') {
      const target = piece && !piece.classList.contains('open') ? piece : pieces.find((p) => !p.classList.contains('open'));
      if (!target) return;
      target.classList.add('open');
      if (sound) sparkleAt(target);
    } else if (sound) sparkleAt(cover);
    opened += 1;
    setLevel();
    if (sound) play('pop');
    onProgress?.();
  }

  function sparkleAt(el) {
    const s = h('span.rv-sparkle', { 'aria-hidden': 'true', text: '✨' });
    const r = el.getBoundingClientRect();
    const p = picture.getBoundingClientRect();
    s.style.left = `${r.left - p.left + r.width / 2}px`;
    s.style.top = `${r.top - p.top + r.height / 2}px`;
    picture.append(s);
    setTimeout(() => s.remove(), 700);
  }

  // Bỏ qua bằng ▶ hoặc hết giờ: chỉ mở hết hình (không bỏ cả thẻ từ). Chặn ▶ trước khi nó tới runSkippable.
  const rv = new AbortController();
  const stepSignal = ctx.signal;
  const stopWithStep = () => rv.abort();
  stepSignal.addEventListener('abort', stopWithStep, { once: true });
  const onNextCapture = (e) => {
    if (!e.target.closest?.('.next-btn')) return;
    e.stopPropagation();
    play('tap');
    rv.abort();
  };
  document.addEventListener('click', onNextCapture, true);
  teacher.signal = rv.signal;

  // MỘT đồng hồ từ lúc che hình (T0): bé chạm thì mở ngay (không đặt lại đồng hồ); hết giờ thì hủy cả lượt đoán, mở hết.
  const deadline = Date.now() + scaled(REVEAL_MAX_MS);
  const leftMs = () => (deadline - Date.now()) / TIME_SCALE; // thời gian còn lại (đơn vị chưa nhân hệ số test)
  const autoTimer = setInterval(() => openPiece(null, { sound: false }), scaled(revealTickMs(kind)));
  const maxTimer = setTimeout(() => rv.abort(), scaled(REVEAL_MAX_MS));
  let drum = setInterval(() => play('drumroll'), DRUMROLL_EVERY_MS);
  play('drumroll');
  const stopTicking = () => {
    clearInterval(autoTimer);
    clearInterval(drum);
    drum = null;
  };

  let hand = null;
  let result = null;
  try {
    setMood(teacher, 'surprise');
    const [opener, vi] = revealOpener(index);
    await teacher.ask(opener, { vi });
    // Thẻ đầu tiên của bài: chỉ cho bé cách chạm.
    if (index === 0 && kind === 'bubbles') {
      hand = h('span.rv-hand', { 'aria-hidden': 'true', text: '👆' });
      picture.append(hand);
      await teacher.say('Tap, tap, tap!');
    }
    // Chờ tới khi mở được ~60% (bé chạm hoặc tự mở dần).
    await new Promise((resolve, reject) => {
      const check = () => {
        if (opened / units >= GUESS_AT) resolve();
      };
      onProgress = check;
      rv.signal.addEventListener('abort', () => reject(new DOMException('Đã dừng', 'AbortError')), { once: true });
      check();
    });
    stopTicking();
    hand?.remove();
    // Đoán: chỉ khi có mic (không có mic thì không "Your turn!" — đi thẳng tới mở hết) và còn đủ thời gian.
    if (app.mic.ready && guessListenMs(leftMs()) > 0) {
      await teacher.ask("What's this?", { vi: 'Đây là gì?' });
      const maxMs = guessListenMs(leftMs());
      if (maxMs > 0) {
        ({ result } = await teacher.hear([word.en], { maxMs }));
        // Có tiếng: ghi nhận như "lên tiếng" (tối đa 1 lần/ngày/từ — không cộng hai lần với bước nói của thẻ).
        if (spoke(result)) await markSpoke(app, word.en, word.emoji);
      }
    }
  } catch (err) {
    if (!isAbort(err) || stepSignal.aborted) throw err;
    if (!stepSignal.aborted) app.speaker.cancel(); // ▶ / hết giờ: dừng câu đang đọc, mở hết
  } finally {
    stopTicking();
    clearTimeout(maxTimer);
    hand?.remove();
    document.removeEventListener('click', onNextCapture, true);
    stepSignal.removeEventListener('abort', stopWithStep);
    teacher.signal = stepSignal;
    teacher.endQuestion?.();
    app.listening = false;
    teacher.bunny.set('idle');
  }

  // Mở hết: mảng còn lại bay đi, "Ta-da!", hình nảy, chữ hiện ra.
  opened = units;
  for (const p of pieces) p.classList.add('open');
  setLevel();
  cover.classList.add('gone');
  picture.classList.add('rv-done');
  label.classList.remove('rv-hidden');
  play('tada');
  teacher.celebrate(picture);
  setMood(teacher, 'happy');
  setTimeout(() => cover.remove(), 400);
  if (result === RESULT.MATCH) {
    teacher.bunny.set('clap');
    await teacher.say('Yes! You guessed it!');
  } else if (result === RESULT.VOICE) {
    await teacher.say('Good guess!');
  } else {
    await teacher.say('Ta-da!');
  }
  teacher.bunny.set('idle');
  card.classList.remove('revealing');
  return result;
}
