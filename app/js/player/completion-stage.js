// Màn "Hoan hô!" kèm sticker tặng bé (SPEC 4.3, 4.8).

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { pickSticker, awardSticker } from '../stickers.js';
import { getStickers } from '../db.js';

/** Tặng một sticker và lưu lại. */
export async function giveSticker(app) {
  const owned = await getStickers(app.db);
  const sticker = pickSticker(owned);
  const record = awardSticker(owned[sticker.id], sticker.id);
  try {
    await app.db.put('stickers', record);
  } catch (err) {
    console.error(err);
  }
  return { sticker, count: record.count };
}

/** Hiện màn Hoan hô, chờ bé chạm nút ✔ để đi tiếp. */
export async function runCompletion(ctx) {
  const { app, teacher, stage } = ctx;
  const { sticker, count } = await giveSticker(app);

  const stickerEl = h('div.prize-sticker', { 'aria-label': sticker.name, text: sticker.emoji });
  const box = giftBox();
  const done = h('button.done-btn', { type: 'button', 'aria-label': 'Xong', text: '✔', hidden: true });
  stage.replaceChildren(h('div.completion', {},
    h('div.confetti', { 'aria-hidden': 'true' },
      ...Array.from({ length: 16 }, (_, i) => h('span', { style: { '--i': String(i) }, text: ['🎉', '⭐', '🎈', '✨'][i % 4] }))),
    h('div.hooray', { text: '🎉' }),
    stickerEl,
    count > 1 ? h('div.prize-count', { text: `×${count}` }) : null,
    box,
    done));

  play('cheer');
  teacher.bunny.set('clap');
  await teacher.say('Hooray! You did it!');
  await teacher.say(`A sticker for you! ${sticker.name}!`);
  teacher.bunny.set('idle');

  // Hộp quà mở nắp → sticker bay vào hộp → đóng nắp → hộp lắc lắc.
  box.classList.add('open');
  play('pop');
  await teacher.pause(450);
  play('whoosh');
  await flyInto(stickerEl, box);
  box.classList.remove('open');
  box.classList.add('wiggle');
  play('ding');
  await teacher.pause(500);
  done.hidden = false;
  await teacher.waitTap([done]);
}

/** Hộp quà vẽ bằng SVG, nắp tách riêng để mở/đóng được. */
function giftBox() {
  const box = h('div.gift', { 'aria-hidden': 'true' });
  box.innerHTML = `
    <svg viewBox="0 0 160 160" width="100%" height="100%">
      <g class="gift-body">
        <rect x="22" y="70" width="116" height="80" rx="10" fill="#ff8fab"/>
        <rect x="70" y="70" width="20" height="80" fill="#ffd166"/>
        <rect x="22" y="70" width="116" height="10" fill="#e0607f" opacity="0.35"/>
      </g>
      <g class="gift-lid">
        <rect x="14" y="48" width="132" height="26" rx="8" fill="#ff6f91"/>
        <rect x="70" y="48" width="20" height="26" fill="#ffd166"/>
        <path d="M80 48 C60 20 36 30 50 46 Z" fill="#ffd166" stroke="#f4b740" stroke-width="3"/>
        <path d="M80 48 C100 20 124 30 110 46 Z" fill="#ffd166" stroke="#f4b740" stroke-width="3"/>
        <circle cx="80" cy="47" r="7" fill="#f4b740"/>
      </g>
    </svg>`;
  return box;
}

/** Sticker bay từ chỗ hiện tại vào miệng hộp, nhỏ dần rồi biến mất. */
function flyInto(el, box) {
  const from = el.getBoundingClientRect();
  const to = box.getBoundingClientRect();
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height * 0.45 - (from.top + from.height / 2);
  if (!el.animate) {
    el.style.opacity = '0';
    return Promise.resolve();
  }
  const animation = el.animate([
    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.6}px, ${dy * 0.6 - 60}px) scale(0.7)`, opacity: 1, offset: 0.6 },
    { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0 },
  ], { duration: 900, easing: 'ease-in', fill: 'forwards' });
  return animation.finished.catch(() => {});
}
