// Sticker của bé trong Góc bố mẹ: xem, bớt từng sticker, xóa hết (khi bố mẹ lỡ bấm thay bé).

import { h, toast, confirmDialog } from '../../ui.js';
import { getStickers } from '../../db.js';
import { STICKERS } from '../../stickers.js';
import { parentLayout, goParent, section, notice } from './common.js';
import { characterName } from '../child.js';

export function stickersAdminView(app) {
  const body = parentLayout(app, { title: 'Sticker của bé', back: () => goParent(app) });
  const reload = () => goParent(app, 'stickers');

  getStickers(app.db).then((owned) => {
    const list = STICKERS.filter((s) => owned[s.id]);
    const total = list.reduce((sum, s) => sum + owned[s.id].count, 0);

    if (!list.length) {
      body.append(section(null, h('p', { text: `Bé chưa có sticker nào. Mỗi lần học xong bài, ôn tập hoặc học cùng ${characterName(app)}, bé được tặng 1 sticker.` })));
      return;
    }

    const decrease = async (s) => {
      const rec = owned[s.id];
      if (rec.count > 1) await app.db.put('stickers', { ...rec, count: rec.count - 1 });
      else await app.db.delete('stickers', s.id);
      toast(`Đã bớt 1 sticker ${s.emoji}.`, 1500);
      reload();
    };

    const removeAll = async () => {
      const ok = await confirmDialog(`Xóa hết ${total} sticker của bé? Bộ sưu tập sẽ về 0/${STICKERS.length}.`, { okText: 'Xóa hết', danger: true });
      if (!ok) return;
      await app.db.write(['stickers'], (tx) => tx.objectStore('stickers').clear());
      toast('Đã xóa hết sticker.');
      reload();
    };

    body.append(
      section(`Bé có ${list.length}/${STICKERS.length} loại sticker (${total} lần nhận)`,
        notice('info', 'Nếu bố mẹ lỡ học thử thay bé, có thể bớt từng sticker hoặc xóa hết ở đây. Bé không xóa được sticker.'),
        h('div.sticker-admin', {}, ...list.map((s) => h('div.sticker-admin-item', {},
          h('span.sticker-emoji', { text: s.emoji }),
          h('span', { text: `${s.name} ×${owned[s.id].count}` }),
          h('button.btn.small', { type: 'button', text: 'Bớt 1', 'aria-label': `Bớt 1 sticker ${s.name}`, onclick: () => decrease(s) }))))),
      section(null, h('button.btn.danger', { type: 'button', text: 'Xóa hết sticker', onclick: removeAll })),
    );
  });
}
