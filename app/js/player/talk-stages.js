// "Nói chuyện với Bông" (SPEC-talk.md mục 4–6, 13): bong bóng chat và các kiểu lượt hội thoại.
// Một luồng tiếng tại một thời điểm (dùng giọng đọc chung có hủy câu trước); mic chỉ mở trong lượt của bé
// (teacher.hear); bong bóng của bé KHÔNG BAO GIỜ giả làm lời bé đã được nhận dạng.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { RESULT } from '../speech/listen.js';
import { bongElement, bongSvg } from '../bong.js';
import { scaled, abortError } from '../timing.js';
import { talkKey, pictureKeyOfTurn, PRAISES } from '../talk.js';
import { markPracticed, markSpoke } from './track.js';

export const WAIT_BEFORE_LISTEN_MS = 1000; // Bông nói xong, chờ ~1 giây rồi mở lượt bé (cấu hình)
export const LISTEN_MS = 6000; // nghe tối đa ~6 giây (cấu hình)
export const ACTION_WAIT_MS = 8000; // lượt động tác: chờ bé chạm tối đa ~8 giây rồi Bông tự làm mẫu
const MAX_BUBBLES = 6;
const BURST = { clap: ['⭐', '✨'], hearts: ['❤️', '💕', '💖'], confetti: ['🎉', '🎊', '✨'] };

/** Khung chat (giữ nguyên qua các lượt của bài). ctx.pictures: ảnh bố mẹ đã thêm (khóa → URL). */
export function chatView(ctx) {
  const chat = h('div.chat', { role: 'log', 'aria-label': 'Hội thoại' });
  ctx.stage.replaceChildren(h('div.chat-wrap', {}, chat));
  ctx.chat = chat;
  return chat;
}

/** Hình của lượt / lựa chọn: ảnh bố mẹ đã thêm (ảnh gia đình thật được ưu tiên), không có thì emoji. */
function picture(ctx, { key, emoji, photo = null, className = 'bubble-pic' }) {
  const url = (photo && ctx.pictures?.get(photo)) || (key && ctx.pictures?.get(key));
  const fallback = () => (emoji ? h(`span.${className}`, { text: emoji }) : null);
  if (url) {
    const img = h(`img.${className}.photo`, { src: url, alt: '', dataset: { pic: key ?? '' } });
    // Ảnh không đọc được (lỗi lưu trữ…): về emoji, không hiện biểu tượng ảnh vỡ.
    img.addEventListener('error', () => img.replaceWith(fallback() ?? ''), { once: true });
    return img;
  }
  return fallback();
}

/** Nét mặt của Bông (bong bóng mới nhất và Bông to ở góc màn hình). */
function setMood(ctx, mood = 'happy') {
  const face = ctx.teacher.bunny.el?.querySelector('.bunny-face');
  if (face && face.dataset.mood !== mood) {
    face.dataset.mood = mood;
    face.innerHTML = bongSvg({ mood });
  }
}

function addBubble(ctx, who, children, extraClass = '', mood = 'happy') {
  const bubble = h(`div.bubble.${who}${extraClass}`, {},
    who === 'bong' ? bongElement('bubble-avatar', { mood }) : null,
    h('div.bubble-body', {}, ...children),
    who === 'child' ? h('span.child-avatar', { text: '🧒', 'aria-hidden': 'true' }) : null);
  ctx.chat.append(bubble);
  while (ctx.chat.children.length > MAX_BUBBLES) ctx.chat.firstElementChild.remove();
  bubble.scrollIntoView?.({ block: 'end', behavior: 'smooth' });
  return bubble;
}

/**
 * Bông nói một câu (bong bóng trái). question: là câu hỏi đang chờ bé (nút 🔊 nghe lại + phụ đề tiếng Việt có sẵn).
 * Avatar Bông nảy nhẹ trong lúc nói; mood: nét mặt (vui / ngạc nhiên / buồn / buồn ngủ).
 */
async function bongSays(ctx, text, vi = '', { question = false, pic = null, mood = 'happy' } = {}) {
  if (!text) return;
  setMood(ctx, mood);
  const bubble = addBubble(ctx, 'bong', [pic ? picture(ctx, pic) : null, h('span.bubble-text', { text })], '', mood);
  bubble.classList.add('talking');
  try {
    if (question) await ctx.teacher.ask(text, { vi });
    else await ctx.teacher.say(text);
  } finally {
    bubble.classList.remove('talking');
  }
}

const childStates = ['hint', 'listening', 'spoken'];
function setChildState(bubble, state, hint) {
  bubble.classList.remove(...childStates);
  bubble.classList.add(state);
  const body = bubble.querySelector('.bubble-body');
  const text = body.querySelector('.bubble-text');
  if (state === 'spoken') text.textContent = '🗣️ Bé đã nói!';
  else if (state === 'listening') text.textContent = `🎤 ${hint}`; // vẫn thấy câu gợi ý (mờ) trong lúc nghe
  else text.textContent = hint;
}

const randomPraise = () => PRAISES[Math.floor(Math.random() * PRAISES.length)];

/**
 * Lượt của bé (SPEC-talk mục 5): bong bóng gợi ý (mờ, có 🔊) → chờ ~1 giây → nghe. Có tiếng nói = ghi nhận nỗ lực
 * (không cần nhận dạng đúng); im lặng → Bông đọc mẫu, nghe thêm một lần; không có mic → chỉ nghe, không ghi nhận.
 * @param {{ hint: string, keywords?: string[], key: string, emoji?: string, anyVoice?: boolean }} o
 *   anyVoice: câu trả lời tự do (tên…) — có tiếng nói là đủ, không cần từ khóa
 * @returns {Promise<boolean>} bé đã thử nói
 */
async function childTurn(ctx, o) {
  const { app, teacher } = ctx;
  const hintBtn = h('button.hint-play', { type: 'button', 'aria-label': 'Nghe câu gợi ý', text: '🔊' });
  const bubble = addBubble(ctx, 'child', [h('span.bubble-text', { text: o.hint }), hintBtn], '.hint');
  hintBtn.addEventListener('click', () => {
    if (!app.speaker.speaking && !app.listening) teacher.say(o.hint).catch(() => {});
  });
  try {
    return await childListen(ctx, o, bubble);
  } finally {
    if (bubble.classList.contains('listening')) setChildState(bubble, 'hint', o.hint);
  }
}

async function childListen(ctx, o, bubble) {
  const { app, teacher } = ctx;
  await teacher.pause(WAIT_BEFORE_LISTEN_MS);
  const listen = async () => {
    setChildState(bubble, 'listening', o.hint);
    const { result } = await teacher.hear(o.keywords ?? [], { maxMs: LISTEN_MS });
    return result;
  };
  let result = await listen();
  if (result === RESULT.SILENT) {
    setChildState(bubble, 'hint', o.hint);
    await teacher.say(o.hint);
    result = await listen();
  }
  const spoke = result === RESULT.MATCH || result === RESULT.VOICE;
  if (spoke) {
    setChildState(bubble, 'spoken', o.hint);
    await markSpoke(app, o.key, o.emoji ?? '');
    if (result === RESULT.MATCH || o.anyVoice) {
      play('ding');
      teacher.celebrate(bubble);
      teacher.bunny.set('clap');
      await teacher.say(randomPraise());
    } else {
      play('pop');
      await teacher.say('Good try!');
      await teacher.say(o.hint);
    }
    teacher.bunny.set('idle');
  } else {
    // Im lặng hai lần / không có mic: không ghi nhận, không chê — Bông đọc mẫu rồi đi tiếp nhẹ nhàng.
    setChildState(bubble, 'hint', o.hint);
    if (result === RESULT.LISTEN_ONLY) await teacher.say(o.hint);
  }
  return spoke;
}

/** Bé chạm một lựa chọn (hình / Yes–No) ở phía bé. */
async function pickOption(ctx, options) {
  const buttons = options.map((opt) => h('button.choice.talk-choice', { type: 'button', 'aria-label': opt.label ?? opt.answer, dataset: { id: opt.id } },
    picture(ctx, { key: opt.picKey ?? opt.id, emoji: opt.emoji, className: 'talk-choice-emoji' }),
    opt.label ? h('span.talk-choice-label', { text: opt.label }) : null));
  const row = h('div.chat-choices', {}, ...buttons);
  ctx.chat.append(row);
  row.scrollIntoView?.({ block: 'end', behavior: 'smooth' });
  try {
    const tapped = await ctx.teacher.waitTap(buttons);
    play('tap');
    tapped.classList.add('correct');
    await ctx.teacher.pause(300);
    return options.find((o) => o.id === tapped.dataset.id);
  } finally {
    row.remove(); // bấm ▶ giữa chừng cũng không để lại nút cũ trên màn
  }
}

/** Chờ bé chạm nút, tối đa `ms` (true = bé chạm, false = hết giờ). Hủy được bằng signal (▶, 🏠). */
function tapOrTimeout(button, ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const finish = (value, err) => {
      clearTimeout(timer);
      button.removeEventListener('click', onTap);
      signal?.removeEventListener('abort', onAbort);
      if (err) reject(err);
      else resolve(value);
    };
    const onTap = () => finish(true);
    const onAbort = () => finish(null, abortError());
    const timer = setTimeout(() => finish(false), scaled(ms));
    button.addEventListener('click', onTap);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Hiệu ứng khi bé chạm (tay đập ⭐, tim bay ❤️, pháo giấy 🎉). */
function burst(target, effect = 'clap') {
  const icons = BURST[effect] ?? BURST.clap;
  const el = h('div.talk-burst', { 'aria-hidden': 'true', dataset: { effect } },
    ...Array.from({ length: 10 }, (_, i) => h('span', { text: icons[i % icons.length], style: { '--i': String(i) } })));
  target.append(el);
  setTimeout(() => el.remove(), 1400);
}

/**
 * Lượt động tác (SPEC-talk mục 13.2): Bông bảo làm động tác, hiện một nút to, bé chạm → hiệu ứng + câu đáp.
 * Không cần mic, không tính sao (chỉ ghi "đã gặp"); chờ ~8 giây không chạm thì Bông tự làm mẫu và đi tiếp.
 */
async function actionTurn(ctx, turn) {
  const { teacher } = ctx;
  await bongSays(ctx, turn.ask, turn.askVi, { question: true, mood: 'happy' });
  const btn = h('button.choice.talk-action', { type: 'button', 'aria-label': turn.ask },
    picture(ctx, { key: turn.id, emoji: turn.emoji, className: 'talk-action-emoji' }));
  const row = h('div.chat-choices.action-row', {}, btn);
  ctx.chat.append(row);
  row.scrollIntoView?.({ block: 'end', behavior: 'smooth' });
  btn.classList.add('wiggle');
  try {
    const tapped = await tapOrTimeout(btn, ACTION_WAIT_MS, ctx.signal);
    teacher.endQuestion();
    btn.classList.remove('wiggle');
    btn.classList.add(tapped ? 'tapped' : 'demo');
    btn.disabled = true;
    play(tapped ? 'ding' : 'pop');
    burst(btn, turn.effect);
    teacher.bunny.set('clap');
    await teacher.pause(500);
    await bongSays(ctx, turn.reply, turn.replyVi, { mood: turn.mood ?? 'happy' });
    teacher.bunny.set('idle');
  } finally {
    row.remove();
  }
}

/**
 * Một lượt hội thoại (đã ghép hồ sơ).
 * @returns {Promise<string|null>} mã lựa chọn bé đã chạm (choice / yesNo) — để lượt sau có `onlyIf` biết có chạy không
 */
export async function runTalkTurn(ctx, turn) {
  const { app, teacher, lesson } = ctx;
  const key = talkKey(lesson, turn.id);
  const emoji = turn.picture ?? turn.emoji ?? lesson.emoji ?? '';
  await markPracticed(app, key, emoji);
  const keywords = turn.keywords ?? [];
  const pic = turn.picture ? { key: pictureKeyOfTurn(turn), emoji: turn.picture, photo: turn.photo } : null;
  let picked = null;

  if (turn.type === 'greeting' || turn.type === 'free') {
    await bongSays(ctx, turn.ask, turn.askVi, { question: true, pic });
    await childTurn(ctx, { hint: turn.answer, keywords, key, emoji, anyVoice: !keywords.length });
    teacher.endQuestion();
    await bongSays(ctx, turn.reply, turn.replyVi, { mood: turn.mood });
  } else if (turn.type === 'choice' || turn.type === 'yesNo') {
    await bongSays(ctx, turn.ask, turn.askVi, { question: true, pic });
    const options = turn.type === 'choice'
      ? turn.choices
      : [{ ...turn.yes, id: 'yes', emoji: '👍', label: 'Yes', picKey: '' }, { ...turn.no, id: 'no', emoji: '👎', label: 'No', picKey: '' }];
    const chosen = await pickOption(ctx, options);
    picked = chosen.id;
    teacher.endQuestion();
    // Câu mẫu của lựa chọn là câu của BÔNG (không giả làm lời bé); rồi đến lượt bé nói theo; rồi Bông đáp theo lựa chọn.
    await bongSays(ctx, chosen.answer, chosen.answerVi, { question: true });
    await childTurn(ctx, { hint: chosen.answer, keywords: chosen.keywords ?? [], key, emoji });
    teacher.endQuestion();
    // Bông "nhớ" hồ sơ: bé chọn đúng màu / món thích → "I know! You like red!"
    if (turn.rememberReply && chosen.id === turn.favorite) {
      await bongSays(ctx, turn.rememberReply, turn.rememberReplyVi, { mood: 'surprise' });
    } else if (turn.type === 'choice' && turn.reply) {
      // Lượt có câu đáp chung (vd. bài Lễ phép: "Good asking! You said please!") thay câu đáp riêng của món trong kho.
      await bongSays(ctx, turn.reply, turn.replyVi, { mood: turn.mood });
    } else if (chosen.reply) {
      await bongSays(ctx, chosen.reply, chosen.replyVi, { mood: chosen.mood ?? turn.mood });
    }
  } else if (turn.type === 'askBack') {
    // Đổi vai: bé bắt chước câu hỏi có hỗ trợ (gợi ý mờ, chạm để nghe) → Bông trả lời.
    await bongSays(ctx, turn.intro || 'Now you ask me!', turn.introVi || 'Giờ con hỏi Bông nhé!', { question: true });
    await childTurn(ctx, { hint: turn.ask, keywords, key, emoji, anyVoice: true });
    teacher.endQuestion();
    await bongSays(ctx, turn.reply, turn.replyVi, { pic, mood: turn.mood });
  } else if (turn.type === 'action') {
    await actionTurn(ctx, turn);
  }
  setMood(ctx, 'happy');
  await teacher.pause(600);
  return picked;
}

/** Câu kết bài ("That was fun! See you, Na!") + hộp quà mở ra (rồi đến màn sticker). */
export async function talkOutro(ctx, text, vi) {
  await bongSays(ctx, text, vi);
  const gift = h('div.talk-gift', { 'aria-hidden': 'true', text: '🎁' });
  ctx.chat.append(gift);
  gift.scrollIntoView?.({ block: 'end', behavior: 'smooth' });
  await ctx.teacher.pause(900);
  gift.textContent = '🎉';
  gift.classList.add('open');
  play('ding');
  burst(gift, 'confetti');
  await ctx.teacher.pause(900);
}
