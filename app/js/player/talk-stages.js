// "Nói chuyện với Bông" (SPEC-talk.md mục 4–6): bong bóng chat và 5 kiểu lượt hội thoại.
// Một luồng tiếng tại một thời điểm (dùng giọng đọc chung có hủy câu trước); mic chỉ mở trong lượt của bé
// (teacher.hear); bong bóng của bé KHÔNG BAO GIỜ giả làm lời bé đã được nhận dạng.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { RESULT } from '../speech/listen.js';
import { bongElement } from '../bong.js';
import { talkKey } from '../talk.js';
import { markPracticed, markSpoke } from './track.js';

export const WAIT_BEFORE_LISTEN_MS = 1000; // Bông nói xong, chờ ~1 giây rồi mở lượt bé (cấu hình)
export const LISTEN_MS = 6000; // nghe tối đa ~6 giây (cấu hình)
const MAX_BUBBLES = 6;

/** Khung chat (giữ nguyên qua các lượt của bài). */
export function chatView(ctx) {
  const chat = h('div.chat', { role: 'log', 'aria-label': 'Hội thoại' });
  ctx.stage.replaceChildren(h('div.chat-wrap', {}, chat));
  ctx.chat = chat;
  return chat;
}

function addBubble(ctx, who, children, extraClass = '') {
  const bubble = h(`div.bubble.${who}${extraClass}`, {},
    who === 'bong' ? bongElement('bubble-avatar') : null,
    h('div.bubble-body', {}, ...children),
    who === 'child' ? h('span.child-avatar', { text: '🧒', 'aria-hidden': 'true' }) : null);
  ctx.chat.append(bubble);
  while (ctx.chat.children.length > MAX_BUBBLES) ctx.chat.firstElementChild.remove();
  bubble.scrollIntoView?.({ block: 'end', behavior: 'smooth' });
  return bubble;
}

/** Bông nói một câu (bong bóng trái). question: là câu hỏi đang chờ bé (nút 🔊 nghe lại + phụ đề tiếng Việt có sẵn). */
async function bongSays(ctx, text, vi = '', { question = false, picture = null } = {}) {
  if (!text) return;
  addBubble(ctx, 'bong', [picture ? h('span.bubble-pic', { text: picture }) : null, h('span.bubble-text', { text })]);
  if (question) await ctx.teacher.ask(text, { vi });
  else await ctx.teacher.say(text);
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
      await teacher.say('Great job!');
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
    h('span.talk-choice-emoji', { text: opt.emoji }), opt.label ? h('span.talk-choice-label', { text: opt.label }) : null));
  const row = h('div.chat-choices', {}, ...buttons);
  ctx.chat.append(row);
  row.scrollIntoView?.({ block: 'end', behavior: 'smooth' });
  const tapped = await ctx.teacher.waitTap(buttons);
  play('tap');
  tapped.classList.add('correct');
  await ctx.teacher.pause(300);
  row.remove();
  return options.find((o) => o.id === tapped.dataset.id);
}

/** Một lượt hội thoại (đã ghép hồ sơ). */
export async function runTalkTurn(ctx, turn) {
  const { app, teacher, lesson } = ctx;
  const key = talkKey(lesson, turn.id);
  const emoji = turn.picture ?? lesson.emoji ?? '';
  await markPracticed(app, key, emoji);
  const keywords = turn.keywords ?? [];

  if (turn.type === 'greeting' || turn.type === 'free') {
    await bongSays(ctx, turn.ask, turn.askVi, { question: true, picture: turn.picture });
    await childTurn(ctx, { hint: turn.answer, keywords, key, emoji, anyVoice: !keywords.length });
    teacher.endQuestion();
    await bongSays(ctx, turn.reply, turn.replyVi);
  } else if (turn.type === 'choice' || turn.type === 'yesNo') {
    await bongSays(ctx, turn.ask, turn.askVi, { question: true, picture: turn.picture });
    const options = turn.type === 'choice'
      ? turn.choices
      : [{ ...turn.yes, id: 'yes', emoji: '👍', label: 'Yes' }, { ...turn.no, id: 'no', emoji: '👎', label: 'No' }];
    const chosen = await pickOption(ctx, options);
    teacher.endQuestion();
    // Câu mẫu của lựa chọn là câu của BÔNG (không giả làm lời bé); rồi đến lượt bé nói theo.
    await bongSays(ctx, chosen.answer, chosen.answerVi, { question: true });
    await childTurn(ctx, { hint: chosen.answer, keywords: chosen.keywords ?? [], key, emoji });
    teacher.endQuestion();
  } else if (turn.type === 'askBack') {
    // Đổi vai: bé bắt chước câu hỏi có hỗ trợ (gợi ý mờ, chạm để nghe) → Bông trả lời.
    await bongSays(ctx, turn.intro || 'Now you ask me!', turn.introVi || 'Giờ con hỏi Bông nhé!', { question: true });
    await childTurn(ctx, { hint: turn.ask, keywords, key, emoji, anyVoice: true });
    teacher.endQuestion();
    await bongSays(ctx, turn.reply, turn.replyVi);
  }
  await teacher.pause(600);
}

/** Câu kết bài ("That was fun! See you, Na!"). */
export const talkOutro = (ctx, text, vi) => bongSays(ctx, text, vi);
