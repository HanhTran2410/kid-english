// Góc bố mẹ → Ảnh Toán (SPEC-math mục 5): ảnh đồ vật bằng AI cho mục 🧮 Toán. Bố mẹ copy prompt ảnh lưới, chọn ảnh AI vẽ:
// app cắt từng ô, bỏ nền trắng, lưu theo mã đồ. Đồ chưa có ảnh vẫn dùng emoji. Hình kéo giãn của bài Cao – thấp,
// Dài – ngắn (cây, hoa, nến, bút chì, rắn, tàu) giữ hình vẽ của app: ảnh kéo giãn cả hình sẽ bị méo.

import { h } from '../../ui.js';
import { removeWordImage, mediaBlob } from '../../db.js';
import { cutOutSticker } from '../../image.js';
import { MATH_ITEM, MATH_ITEM_IMAGES, MATH_PICTURE_ITEMS, MATH_ITEM_PROMPT_NOTE } from '../../math.js';
import { parentLayout, goParent, section, notice } from './common.js';
import { pendingGridSections } from './lessons.js';

export function mathImagesView(app) {
  const body = parentLayout(app, { title: 'Ảnh Toán', back: () => goParent(app) });
  const reload = () => goParent(app, 'math-images');
  const urls = [];

  app.db.getAllByIndex('images', 'lessonId', MATH_ITEM_IMAGES).catch(() => []).then((rows) => {
    const have = new Map();
    for (const img of rows) {
      const url = URL.createObjectURL(mediaBlob(img));
      urls.push(url);
      have.set(img.word, url);
    }
    const list = MATH_PICTURE_ITEMS;
    const done = list.filter((it) => have.has(it.id));
    body.append(
      notice('info', 'Các bài Toán chạy ngay bằng emoji. Muốn đẹp hơn: copy prompt để nhờ AI vẽ MỘT ảnh lưới 16 đồ vật, rồi chọn ảnh đó — app tự cắt từng ô và bỏ nền trắng. Ảnh dùng ở To – nhỏ, Nhiều – ít, Nhỏ – vừa – to, Nặng – nhẹ và phần xem mẫu. Cây, hoa, nến, bút chì, rắn, tàu (Cao – thấp, Dài – ngắn) giữ hình vẽ của app vì app chỉ kéo dài phần thân — ảnh bị kéo giãn sẽ méo.'),
      section(`🧮 Đồ vật — ${done.length ? `có ảnh ${done.length}/${list.length} đồ` : 'đang dùng emoji'}`,
        // Ô nhỏ: ảnh của bố mẹ, hoặc emoji đang dùng (mờ) khi đồ chưa có ảnh.
        h('div.mt-admin-pics', {}, ...list.map((it) => h(`figure${have.has(it.id) ? '' : '.missing'}`, {},
          have.has(it.id) ? h('img.checker', { src: have.get(it.id), alt: it.vi }) : h('span.mt-admin-emoji', { text: MATH_ITEM.get(it.id).emoji }),
          h('figcaption', { text: it.vi })))),
        done.length ? h('div.actions', {}, h('button.btn.danger', {
          type: 'button', text: 'Dùng emoji (xóa ảnh)',
          onclick: async () => {
            for (const it of done) await removeWordImage(app.db, MATH_ITEM_IMAGES, it.id);
            reload();
          },
        })) : null),
      ...pendingGridSections(app, {
        id: MATH_ITEM_IMAGES, what: 'đồ vật', group: 16, urls, has: (w) => have.has(w.en),
        words: list.map((it) => ({ en: it.id, label: it.en, imagePrompt: it.draw })),
        promptNote: `\n${MATH_ITEM_PROMPT_NOTE}`, process: (tile) => cutOutSticker(tile.blob), onSaved: reload, previewClass: 'checker',
      }),
    );
  });

  return () => urls.forEach((u) => URL.revokeObjectURL(u));
}
