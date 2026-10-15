// Góc bố mẹ → Ảnh Dán tranh (SPEC-scenes mục 10): thay ảnh tranh và ảnh sticker bằng ảnh AI vẽ.

import { h, toast, copyText, confirmDialog } from '../../ui.js';
import { setWordImage, removeWordImage } from '../../db.js';
import { normalizeWord } from '../../text.js';
import { resizeCover, cutOutSticker, resizeImage } from '../../image.js';
import {
  SCENES, SCENE_BY_ID, STICKER_IMAGES, BACKGROUND_IMAGES, STICKER_PROMPT_NOTE, zoneBox, sceneBackgroundPrompt,
} from '../../sticker-scenes.js';
import { loadSceneImages, sceneArt, itemFace } from '../sticker-scene.js';
import { parentLayout, goParent, section, notice } from './common.js';
import { gridSection, imageErrorMessage } from './lessons.js';
import { saveFile } from './backup.js';

export function scenesView(app) {
  const body = parentLayout(app, { title: 'Ảnh Dán tranh', back: () => goParent(app) });
  body.append(notice('info', 'Tranh và sticker có sẵn hình vẽ, bé chơi được ngay. Muốn đẹp hơn: vào từng tranh, copy prompt dán vào ChatGPT/Gemini, lưu ảnh AI vẽ về máy rồi chọn ảnh đó.'));
  const list = h('nav.menu');
  body.append(list);
  let images = null;
  loadSceneImages(app.db).then((loaded) => {
    images = loaded;
    list.replaceChildren(...SCENES.map((scene) => {
      const done = scene.items.filter((it) => images.sticker.has(normalizeWord(it.name))).length;
      return h('button.menu-item', { type: 'button', onclick: () => goParent(app, 'scene', { sceneId: scene.id }) },
        h('span.menu-emoji', { text: scene.emoji }),
        h('span', { text: `${scene.vi} — tranh: ${images.background.has(scene.id) ? 'ảnh AI' : 'hình vẽ sẵn'} · sticker: ${done}/${scene.items.length} ảnh` }));
    }));
  });
  return () => images?.revoke();
}

export function sceneDetailView(app, { sceneId }) {
  const scene = SCENE_BY_ID.get(sceneId) ?? SCENES[0];
  const body = parentLayout(app, { title: `${scene.emoji} ${scene.vi}`, back: () => goParent(app, 'scenes') });
  const urls = [];
  let images = null;
  const reload = () => goParent(app, 'scene', { sceneId: scene.id });

  loadSceneImages(app.db).then((loaded) => {
    images = loaded;
    body.append(backgroundSection(app, scene, images, urls, reload), stickerSection(app, scene, images, urls, reload));
  });
  return () => {
    images?.revoke();
    urls.forEach((u) => URL.revokeObjectURL(u));
  };
}

/** Tranh kèm khung các chỗ (để bố mẹ kiểm tra ảnh AI vẽ có khớp chỗ của app không). */
function zonesPreview(scene, art) {
  return h('div.sp-admin-scene', {}, art, ...scene.zones.slice(0, -2).map((z) => {
    const b = zoneBox(z);
    return h('div.sp-admin-zone', {
      style: { left: `${b.left}%`, top: `${b.top}%`, width: `${b.width}%`, height: `${b.height}%` },
      text: z.en,
    });
  }));
}

/** Ảnh bố cục mẫu (PNG 1600 × 1200) từ hình vẽ sẵn của tranh — đúng các chỗ của app, để AI vẽ lại theo. */
export async function layoutImage(scene, width = 1600, height = 1200) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 400 300" preserveAspectRatio="none">${scene.svg}</svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('toBlob');
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function backgroundSection(app, scene, images, urls, reload) {
  const prompt = sceneBackgroundPrompt(scene);
  const referencePrompt = sceneBackgroundPrompt(scene, { reference: true });
  const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
  const work = h('div.grid-preview');
  const hasImage = images.background.has(scene.id);

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    work.replaceChildren(h('p.muted', { text: 'Đang đọc ảnh…' }));
    let pic;
    try {
      pic = await resizeCover(file);
    } catch (err) {
      work.replaceChildren(notice('error', imageErrorMessage(err)));
      return;
    }
    const url = URL.createObjectURL(pic.blob);
    urls.push(url);
    const art = h('div.sp-art', {}, h('img.sp-bg', { src: url, alt: 'Ảnh tranh mới' }));
    work.replaceChildren(
      notice('info', 'Ảnh đã được cắt giữa theo tỉ lệ 4:3. Kiểm tra: mỗi khung hồng nên nằm đúng vật của nó (khung "in the tree" trùng tán cây…). Lệch nhiều thì bé dán vào cây mà Bông lại nói chỗ khác — hãy nhờ AI vẽ lại.'),
      zonesPreview(scene, art),
      h('div.actions', {},
        h('button.btn.primary', {
          type: 'button',
          text: 'Lưu ảnh tranh này',
          onclick: async () => {
            try {
              await setWordImage(app.db, { lessonId: BACKGROUND_IMAGES, word: scene.id, ...pic });
              toast('Đã lưu ảnh tranh.');
              reload();
            } catch (err) {
              toast(imageErrorMessage(err), 4000);
            }
          },
        }),
        h('button.btn', { type: 'button', text: 'Hủy', onclick: () => work.replaceChildren() })));
  });

  // Ảnh bố cục mẫu: tạo sẵn ngay khi mở trang để bấm "Tải" là mở được bảng Chia sẻ (iOS chỉ cho mở ngay sau lần chạm).
  let layout = null;
  const layoutBtn = h('button.btn.primary', {
    type: 'button',
    text: '1. Tải ảnh bố cục mẫu',
    disabled: true,
    onclick: async () => {
      if (layout && await saveFile(layout, `bo-cuc-${scene.id}.png`)) toast('Đã lưu ảnh bố cục mẫu.');
    },
  });
  layoutImage(scene).then((blob) => {
    layout = blob;
    layoutBtn.disabled = false;
  }).catch(() => {
    layoutBtn.textContent = 'Không tạo được ảnh bố cục';
  });

  return section('Ảnh tranh',
    notice('info', 'AI vẽ ảnh không đo được vị trí theo %, nên ảnh hay bị lệch so với các chỗ của app. Cách chính xác nhất: ',
      h('b', { text: '(1) tải ảnh bố cục mẫu' }), ' (chính là hình vẽ sẵn bên dưới), ',
      h('b', { text: '(2) copy prompt kèm ảnh mẫu' }), ', mở ChatGPT/Gemini, ',
      h('b', { text: 'đính kèm ảnh mẫu' }), ' rồi dán prompt — AI sẽ vẽ lại giữ đúng vị trí và cỡ từng vật. Lưu ảnh AI vẽ về máy rồi ',
      h('b', { text: '(3) Chọn ảnh tranh' }), ' và kiểm tra các khung hồng.'),
    zonesPreview(scene, sceneArt(scene, images)),
    h('div.actions', {},
      layoutBtn,
      h('button.btn.primary', {
        type: 'button',
        text: '2. Copy prompt kèm ảnh mẫu',
        onclick: () => copyText(referencePrompt).then((ok) => toast(ok ? 'Đã copy. Nhớ đính kèm ảnh bố cục mẫu khi gửi cho AI.' : 'Không copy được.', 4000)),
      }),
      h('button.btn.primary', { type: 'button', text: '3. Chọn ảnh tranh', onclick: () => input.click() })),
    h('div.actions', {},
      h('button.btn', {
        type: 'button',
        text: 'Copy prompt không cần ảnh mẫu',
        onclick: () => copyText(prompt).then((ok) => toast(ok ? 'Đã copy prompt ảnh tranh.' : 'Không copy được.')),
      }),
      hasImage ? h('button.btn.danger', {
        type: 'button',
        text: 'Xóa ảnh (dùng hình vẽ sẵn)',
        onclick: async () => {
          if (!await confirmDialog('Xóa ảnh tranh này và dùng lại hình vẽ sẵn?', { danger: true, okText: 'Xóa' })) return;
          await removeWordImage(app.db, BACKGROUND_IMAGES, scene.id);
          reload();
        },
      }) : null),
    input,
    work);
}

/** Prompt ảnh một sticker (khi chỉ muốn vẽ lại một con). */
const singleStickerPrompt = (item) => `One cute ${item.name}, children's sticker illustration for a 3-year-old: simple flat vector, bright gentle colors, friendly face, centered, about 70% of a square image.${STICKER_PROMPT_NOTE.replace('in every cell', '')}`;

function stickerSection(app, scene, images, urls, reload) {
  const grid = gridSection(app, { id: STICKER_IMAGES, words: scene.items.map((it) => ({ en: it.name })) }, urls,
    `Ảnh sticker — 1 ảnh lưới cho ${scene.items.length} sticker`,
    { promptNote: `\n${STICKER_PROMPT_NOTE}`, process: (tile) => cutOutSticker(tile.blob), onSaved: reload, previewClass: 'checker' });

  const items = h('div.sp-admin-items', {}, ...scene.items.map((item) => {
    const key = normalizeWord(item.name);
    const has = images.sticker.has(key);
    const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      try {
        const small = await resizeImage(file);
        await setWordImage(app.db, { lessonId: STICKER_IMAGES, word: item.name, ...await cutOutSticker(small.blob) });
        toast(`Đã lưu ảnh ${item.name}.`);
        reload();
      } catch (err) {
        toast(imageErrorMessage(err), 4000);
      }
    });
    return h('div.sp-admin-item', {},
      h('span.sp-admin-face.checker', {}, itemFace(item, images)),
      h('span', { text: item.name }),
      h('button.btn.small', {
        type: 'button',
        text: 'Copy prompt',
        onclick: () => copyText(singleStickerPrompt(item)).then((ok) => toast(ok ? 'Đã copy prompt.' : 'Không copy được.')),
      }),
      h('button.btn.small', { type: 'button', text: 'Chọn ảnh', onclick: () => input.click() }),
      has ? h('button.btn.small.danger', {
        type: 'button',
        text: 'Xóa ảnh',
        onclick: async () => {
          await removeWordImage(app.db, STICKER_IMAGES, item.name);
          reload();
        },
      }) : null,
      input);
  }));

  return h('div', {},
    grid,
    section('Từng sticker',
      notice('info', 'Ảnh AI vẽ được tự bỏ nền trắng để thành sticker (ô kẻ ca-rô là phần trong suốt). Có thể thay riêng từng sticker hoặc xóa để dùng lại emoji.'),
      items));
}
