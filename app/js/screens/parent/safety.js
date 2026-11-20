// Góc bố mẹ → 🦸 Siêu nhân an toàn (SPEC-safety S2, 0.85.0):
// - "Ảnh Siêu nhân an toàn": thay từng hình trong cảnh — Bông, mẹ, bố, từng đồ vật (chọn một ảnh, hoặc ảnh lưới AI), ảnh nền
//   từng cảnh. Ảnh nằm gọn trong khung của hình vẽ nên chỗ chạm / chỗ thả không đổi. Chưa có ảnh thì dùng hình vẽ sẵn.
// - "Nói thêm với bé": mỗi tình huống một gợi ý luyện ngoài đời (mục 9). 🫶 Cơ thể của bé (SPEC-body mục 7) luôn hiện ở đây
//   (bố mẹ đọc trước khi bật), kèm "Nếu bé kể với bạn" và "Bố mẹ không nên nói".

import { h, toast, copyText } from '../../ui.js';
import { setWordImage, removeWordImage, mediaBlob } from '../../db.js';
import { resizeImage, cutOutSticker } from '../../image.js';
import { dayKey } from '../../text.js';
import { applyBackup, BackupError } from '../../backup.js';
import {
  RULES, TOPICS, TOPIC_IDS, TIPS, BODY_IF_TOLD, BODY_DONT_SAY, SAFETY_PEOPLE, SAFETY_ITEMS, SAFETY_SCENES,
  SAFETY_PEOPLE_IMAGES, SAFETY_ITEM_IMAGES, SAFETY_BG_IMAGES,
} from '../../jobs/safety.js';
import { bongSvg } from '../../bong.js';
import { familySvg } from '../../jobs/family.js';
import { parentLayout, goParent, section, notice } from './common.js';
import { imageErrorMessage, pendingGridSections } from './lessons.js';
import { mediaShareSection } from './media-share.js';
import { personSection } from './jobs.js';

const LESSON_IDS = [SAFETY_PEOPLE_IMAGES, SAFETY_ITEM_IMAGES, SAFETY_BG_IMAGES];
const ITEM_NOTE = [
  '',
  'GAME ITEM RULES (the app cuts each picture out of its white background and places it in a toddler safety game scene)',
  '- Draw ONLY the object itself: no people, no hands, no scenery.',
  '- It fills most of its cell, centered, with a continuous thick dark outline all around it.',
  '- Pure flat white (#FFFFFF) background: no shadow, no frame, no text.',
].join('\n');

/** Nhận ảnh Siêu nhân an toàn từ file của máy khác (ảnh mới hơn thắng). */
export async function acceptSafetyPayload(app, payload) {
  const images = payload.images.filter((img) => String(img.lessonId ?? '').startsWith('safety:'));
  if (images.length) {
    await applyBackup(app.db, { ...payload, lessons: [], images, frameSets: [], recordings: [], progress: [], stickers: [], settings: [] }, 'merge');
  }
  return { images: images.length };
}

export function safetyImagesView(app) {
  const body = parentLayout(app, { title: 'Ảnh Siêu nhân an toàn', back: () => goParent(app) });
  const reload = () => goParent(app, 'safety-images');
  const urls = [];

  Promise.all(LESSON_IDS.map((id) => app.db.getAllByIndex('images', 'lessonId', id).catch(() => []))).then((groups) => {
    const [people, items, bg] = groups.map((rows) => {
      const map = new Map();
      for (const img of rows) {
        const url = URL.createObjectURL(mediaBlob(img));
        urls.push(url);
        map.set(img.word, url);
      }
      return map;
    });
    body.append(
      notice('info', 'Trò chơi chạy ngay bằng hình vẽ sẵn. Muốn đẹp hơn thì thay từng ảnh: Bông, mẹ, bố, từng đồ vật, ảnh nền từng cảnh. Ảnh được đặt gọn trong khung của hình vẽ, nên chỗ bé chạm không đổi. Ảnh nào chưa thay thì vẫn dùng hình vẽ.'),
      ...SAFETY_PEOPLE.map((p) => personSection(app, {
        title: `${p.emoji} ${p.vi} — ${people.has(p.id) ? 'đang dùng ảnh' : 'đang dùng hình vẽ sẵn'}`,
        svg: p.id === 'bong' ? bongSvg({ mood: 'happy' }) : familySvg(p.id, 'happy'),
        url: people.get(p.id), prompt: p.prompt, lessonId: SAFETY_PEOPLE_IMAGES, word: p.id, done: reload,
      })),
      itemsSection(items),
      ...pendingGridSections(app, {
        id: SAFETY_ITEM_IMAGES, what: 'hình', group: 9, urls, has: (w) => items.has(w.en),
        words: SAFETY_ITEMS.map((it) => ({ en: it.id, label: it.vi, imagePrompt: it.draw })),
        promptNote: `\n${ITEM_NOTE}`, process: (tile) => cutOutSticker(tile.blob), onSaved: reload, previewClass: 'checker',
      }),
      ...SAFETY_SCENES.map((sc) => sceneSection(sc, bg.get(sc.id))),
      mediaShareSection(app, {
        what: 'ảnh Siêu nhân an toàn',
        intro: 'Gửi ảnh Bông, bố mẹ, đồ vật và ảnh nền của trò Siêu nhân an toàn sang máy khác (ảnh nằm trong file). Trên máy kia: Góc bố mẹ → Ảnh Siêu nhân an toàn → "Nhập từ file".',
        canMake: people.size + items.size + bg.size > 0,
        backup: { lessonIds: LESSON_IDS, settingsKeys: [], filename: `sieu-nhan-an-toan-${dayKey()}.zip` },
        accept: async (payload) => {
          const got = await acceptSafetyPayload(app, payload);
          if (!got.images) throw new BackupError('File này không có ảnh Siêu nhân an toàn.');
          return `Đã nhận ${got.images} ảnh (ảnh mới hơn thay ảnh cũ).`;
        },
        done: reload,
      }),
    );
  });

  /** Từng đồ vật: chọn / thay / bỏ một ảnh (app tự bỏ nền trắng). */
  function itemsSection(items) {
    const list = h('div.sp-admin-items', {}, ...SAFETY_ITEMS.map((it) => {
      const has = items.has(it.id);
      const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;
        try {
          await setWordImage(app.db, { lessonId: SAFETY_ITEM_IMAGES, word: it.id, ...await cutOutSticker((await resizeImage(file)).blob) });
          toast(`Đã lưu ảnh ${it.vi}.`);
          reload();
        } catch (err) {
          toast(imageErrorMessage(err), 4000);
        }
      });
      return h('div.sp-admin-item', { dataset: { item: it.id } },
        has ? h('img.fd-admin-face.checker', { src: items.get(it.id), alt: '' }) : h('span.fd-admin-face', { text: '🖼️' }),
        h('span', { text: it.vi }),
        h('span.muted', { text: it.en }),
        h('button.btn.small', { type: 'button', text: has ? 'Thay ảnh' : 'Chọn ảnh', onclick: () => input.click() }),
        has ? h('button.btn.small.danger', {
          type: 'button', text: 'Dùng hình vẽ',
          onclick: async () => {
            await removeWordImage(app.db, SAFETY_ITEM_IMAGES, it.id);
            reload();
          },
        }) : null,
        input);
    }));
    const n = SAFETY_ITEMS.filter((it) => items.has(it.id)).length;
    return section(`Đồ vật trong cảnh — ${n ? `có ảnh ${n}/${SAFETY_ITEMS.length}` : 'đang dùng hình vẽ sẵn'}`,
      h('p.muted', { text: 'Chọn từng ảnh (nền trắng, app tự bỏ nền), hoặc dùng ảnh lưới AI ở dưới cho nhiều đồ một lần.' }),
      list);
  }

  function sceneSection(sc, url) {
    const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      try {
        await setWordImage(app.db, { lessonId: SAFETY_BG_IMAGES, word: sc.id, ...await resizeImage(file) });
        toast(`Đã lưu ảnh nền ${sc.vi}.`);
        reload();
      } catch (err) {
        toast(imageErrorMessage(err), 4000);
      }
    });
    return section(`Nền: ${sc.vi}`, h('div.jb-admin-job', { dataset: { scene: sc.id } },
      url ? h('img.dr-admin-bg', { src: url, alt: `Ảnh nền ${sc.vi}` }) : h('p.muted', { text: 'Đang dùng nền vẽ sẵn.' }),
      h('div.actions', {},
        h('button.btn', { type: 'button', text: 'Copy prompt', onclick: () => copyText(sc.prompt).then((ok) => toast(ok ? 'Đã copy prompt.' : 'Không copy được.')) }),
        h('button.btn.primary', { type: 'button', text: url ? 'Thay ảnh nền' : 'Chọn ảnh nền', onclick: () => input.click() }),
        url ? h('button.btn.danger', {
          type: 'button', text: 'Dùng nền vẽ sẵn',
          onclick: async () => {
            await removeWordImage(app.db, SAFETY_BG_IMAGES, sc.id);
            reload();
          },
        }) : null),
      input));
  }

  return () => urls.forEach((u) => URL.revokeObjectURL(u));
}

/** "Nói thêm với bé" (mục 9): trang chữ, theo chủ đề; mỗi tình huống một gợi ý luyện ngoài đời. */
export function safetyTipsView(app) {
  const body = parentLayout(app, { title: 'Siêu nhân an toàn — Nói thêm với bé', back: () => goParent(app) });
  body.append(
    notice('info', 'App chỉ giúp bé nhớ câu và việc nên làm; bố mẹ vẫn là người dạy và trông bé. Mỗi tình huống dưới đây có một gợi ý để luyện cùng bé ngoài đời — ngắn, vui, như một trò chơi.'),
    ...TOPIC_IDS.map((t) => section(`${TOPICS[t].emoji} ${TOPICS[t].vi}`,
      h('ul.sf-tips', {}, ...RULES.filter((r) => r.topic === t).map((r) => h('li', { dataset: { rule: r.id } },
        h('span.p-emoji', { text: r.emoji }),
        h('div', {},
          h('b', { text: r.short[0] }), h('span.muted', { text: ` — ${r.short[1]}` }),
          h('p', { text: TIPS[r.id] }))))),
      ...(t === 'body' ? [
        h('h3', { text: 'Nếu bé kể với bạn' }),
        h('ol.sf-told', {}, ...BODY_IF_TOLD.map((x) => h('li', { text: x }))),
        h('h3', { text: 'Bố mẹ không nên nói' }),
        h('ul.sf-dont', {}, ...BODY_DONT_SAY.map((x) => h('li', { text: x }))),
      ] : []))));
}
