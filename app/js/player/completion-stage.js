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
  const box = h('div.prize-box', { 'aria-hidden': 'true', text: '🎁' });
  const done = h('button.done-btn', { type: 'button', 'aria-label': 'Xong', text: '✔' });
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
  stickerEl.classList.add('fly');
  play('whoosh');
  await teacher.waitTap([done]);
}
