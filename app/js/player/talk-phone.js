// 📞 Bông gọi điện (SPEC-talk mục 14, T-b1): chuông reo → bé chạm 📞 nghe máy → hội thoại trong khung điện thoại
// (thanh gọi + đồng hồ) → cuối bài bé chạm nút đỏ tắt máy. Không đổi luồng các lượt hội thoại.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { bongElement } from '../bong.js';
import { scaled } from '../timing.js';

export const RING_EVERY_MS = 1600; // chuông reo lặp lại
export const AUTO_ANSWER_MS = 20_000; // không ai nghe máy: tự nghe (không bao giờ kẹt)
export const HANG_UP_WAIT_MS = 8000; // cuối bài: chờ bé chạm nút đỏ rồi tự tắt máy

/** Thời gian gọi dạng 00:42. */
export function callTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const callerName = (app) => String(app.settings?.characterName ?? '').trim() || 'Bông';

/**
 * Chờ một trong các nút được chạm, hết giờ, hoặc rời màn hình. Trả về 'tap' | 'skip' | 'timeout'.
 * @param {HTMLElement} button nút chính (📞 xanh / đỏ)
 */
function waitFor(button, nextBtn, ms, signal) {
  return new Promise((resolve, reject) => {
    const done = (why) => {
      clearTimeout(timer);
      button.removeEventListener('click', onTap);
      nextBtn?.removeEventListener('click', onSkip);
      signal.removeEventListener('abort', onAbort);
      if (why === 'abort') reject(new DOMException('Đã dừng', 'AbortError'));
      else resolve(why);
    };
    const onTap = () => done('tap');
    const onSkip = () => done('skip');
    const onAbort = () => done('abort');
    const timer = setTimeout(() => done('timeout'), scaled(ms));
    button.addEventListener('click', onTap);
    nextBtn?.addEventListener('click', onSkip);
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) onAbort();
  });
}

/**
 * Cuộc gọi đến: màn hình gọi (Bông + vòng sóng + "is calling…"), chuông reo lặp lại, Bông nói "Ring, ring!",
 * nút 📞 xanh to. Bé chạm (hoặc ▶, hoặc hết ~20 giây) → nghe máy.
 */
export async function ringIn(ctx) {
  const { app, signal, nextBtn } = ctx;
  const name = callerName(app);
  const answer = h('button.call-answer', { type: 'button', 'aria-label': 'Nghe máy', text: '📞' });
  const screen = h('div.call-incoming', { role: 'dialog', 'aria-label': `${name} đang gọi` },
    h('div.call-avatar', {}, h('span.call-wave'), h('span.call-wave.two'), bongElement('call-bong')),
    h('div.call-name', { text: name }),
    h('div.call-sub', {}, h('span', { text: 'is calling…' }), h('span.call-sub-vi', { text: ' · đang gọi cho con!' })),
    answer,
    h('div.call-hint', { text: 'Chạm 📞 để nghe máy' }));
  app.root.append(screen);
  play('ring');
  const ringTimer = setInterval(() => play('ring'), RING_EVERY_MS);
  app.speaker.speak('Ring, ring!', { signal }).catch(() => {});
  try {
    await waitFor(answer, nextBtn, AUTO_ANSWER_MS, signal);
  } finally {
    clearInterval(ringTimer);
    app.speaker.cancel();
    screen.remove();
  }
  play('pop');
}

/**
 * Đang gọi: khung hội thoại thành màn hình điện thoại, thanh trên "🟢 Bông · 00:42" (đồng hồ chạy).
 * @returns {{ bar: HTMLElement, stop: () => number }} stop: dừng đồng hồ, trả về thời gian gọi (ms)
 */
export function startCall(ctx) {
  const wrap = ctx.chat?.closest('.chat-wrap') ?? ctx.stage;
  const startedAt = Date.now();
  const clock = h('span.call-clock', { text: '00:00' });
  const bar = h('div.call-bar', {},
    h('span.call-dot', { 'aria-hidden': 'true' }),
    h('span.call-who', { text: `📞 ${callerName(ctx.app)}` }),
    clock);
  wrap.classList.add('on-call');
  wrap.prepend(bar);
  // Đồng hồ tính từ lúc nghe máy (không đếm từng nhịp), dừng khi rời bài / app ra nền.
  const timer = setInterval(() => {
    clock.textContent = callTime(Date.now() - startedAt);
  }, 1000);
  ctx.signal?.addEventListener('abort', () => clearInterval(timer), { once: true });
  return {
    bar,
    stop() {
      clearInterval(timer);
      return Date.now() - startedAt;
    },
  };
}

/**
 * Tắt máy: Bông nói "Bye-bye! Hang up the phone!", hiện nút đỏ; bé chạm (hoặc ▶, hoặc hết ~8 giây) → tiếng tắt máy,
 * thanh gọi hiện "Call ended · 01:23".
 */
export async function hangUp(ctx, call) {
  const { teacher, signal, nextBtn } = ctx;
  const button = h('button.call-hangup', { type: 'button', 'aria-label': 'Tắt máy', text: '📞' });
  const row = h('div.call-hangup-row', {}, button, h('span.call-hint', { text: 'Chạm nút đỏ để tắt máy' }));
  ctx.chat.append(row);
  row.scrollIntoView?.({ block: 'end', behavior: 'smooth' });
  await teacher.say('Bye-bye! Hang up the phone!').catch(() => {});
  try {
    await waitFor(button, nextBtn, HANG_UP_WAIT_MS, signal);
  } finally {
    row.remove();
  }
  play('hangup');
  const ms = call.stop();
  call.bar.classList.add('ended');
  call.bar.replaceChildren(h('span.call-who', { text: '📵 Call ended' }), h('span.call-sub-vi', { text: ' · Đã tắt máy' }), h('span.call-clock', { text: callTime(ms) }));
  await teacher.pause(700);
}
