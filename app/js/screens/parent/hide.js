// Góc bố mẹ → Ảnh Trốn tìm (SPEC-hide mục 7): ảnh từng phòng (ảnh bố cục mẫu, prompt, xác nhận khớp vùng chạm),
// ảnh Bông 4 tư thế, ảnh bất ngờ (đổi / dùng lại ảnh bài học / ảnh lưới), chia sẻ sang máy khác.
// Ảnh của bé nằm ở Hồ sơ của bé (profile:), không bao giờ đi theo gói chia sẻ.

import { h, toast, copyText } from '../../ui.js';
import { setWordImage, removeWordImage, mediaBlob } from '../../db.js';
import { resizeImage, resizeCover, cutOutSticker } from '../../image.js';
import { dayKey } from '../../text.js';
import { applyBackup, BackupError } from '../../backup.js';
import {
  W, H, ROOMS, HIDE_BG_IMAGES, HIDE_BONG_IMAGES, HIDE_ITEM_IMAGES, POSES, POSE_LABEL, roomSvg, roomPrompt,
} from '../../hide-seek.js';
import { loadHideImages } from '../hide-seek.js';
import { parentLayout, goParent, section, notice } from './common.js';
import { gridSection, imageErrorMessage } from './lessons.js';
import { mediaShareSection } from './media-share.js';
import { downloadFile } from './backup.js';
import { layoutImage } from './scenes.js';
import { BONG_PROMPT_NOTE, lessonImagesFor } from './feed.js';

const GRID_GROUP = 9;
/** Ghi chú prompt ảnh lưới bất ngờ: nền trắng để app tự cắt nền. */
const SURPRISE_PROMPT_NOTE = [
  '',
  'GAME RULES (the app cuts each picture out of its white background; it pops out when a child taps the wrong hiding place)',
  '- Draw ONLY the animal or object itself, centered, filling most of its cell, with a continuous thick dark outline.',
  '- Pure flat white (#FFFFFF) background: no shadow, no scenery, no frame.',
].join('\n');
/** Mọi bất ngờ của 5 phòng (không trùng mã). */
const SURPRISES = [...new Map(ROOMS.flatMap((r) => r.surprises).map((x) => [x.id, x])).values()];

/** Nhận ảnh Trốn tìm từ file của máy khác (ảnh mới hơn thắng). Dùng chung cho trang này và Quản lý bài. */
export async function acceptHidePayload(app, payload) {
  const images = payload.images.filter((img) => String(img.lessonId ?? '').startsWith('hide:'));
  if (images.length) {
    await applyBackup(app.db, {
      ...payload, lessons: [], images, frameSets: [], recordings: [], progress: [], stickers: [], settings: [],
    }, 'merge');
  }
  return { images: images.length };
}

const roomArt = (room, url) => (url
  ? h('img.sp-bg', { src: url, alt: '', style: { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover' } })
  : h('div', { html: `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%">${roomSvg(room)}</svg>` }));

/** Tranh kèm khung vùng chạm của từng chỗ nấp. */
function zonesPreview(room, art) {
  return h('div.sp-admin-scene.hs-admin-scene', { dataset: { room: room.id } }, art, ...room.spots.map((s) => {
    const [x, y, w, hh] = s.rect;
    return h('div.sp-admin-zone', {
      style: { left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, width: `${(w / W) * 100}%`, height: `${(hh / H) * 100}%` },
      text: s.phrase,
    });
  }));
}

export function hideAdminView(app) {
  const body = parentLayout(app, { title: 'Ảnh Trốn tìm', back: () => goParent(app) });
  const reload = () => goParent(app, 'hide');
  const urls = [];
  let images = null;

  loadHideImages(app).then(async (loaded) => {
    images = loaded;
    const found = new Map();
    for (const x of SURPRISES) found.set(x.id, await lessonImagesFor(app.db, { en: x.en, grammar: 'count', plural: `${x.en}s` }));
    body.append(
      notice('info', 'Trò chơi chạy ngay bằng tranh vẽ sẵn. Muốn đẹp hơn: thay ảnh từng phòng (theo ảnh bố cục mẫu để đồ vật nằm đúng chỗ bé chạm), ảnh Bông, ảnh các bất ngờ. Ảnh của bé (lượt đổi vai) thêm ở Hồ sơ của bé.'),
      ...ROOMS.map((room) => roomSection(room)),
      bongSection(),
      surpriseSection(found),
      ...surpriseGrids(),
      shareSection(),
    );
  });

  function roomSection(room) {
    const url = images.bg.get(room.id);
    const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
    const work = h('div.grid-preview');
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      let pic;
      try {
        pic = await resizeCover(file);
      } catch (err) {
        work.replaceChildren(notice('error', imageErrorMessage(err)));
        return;
      }
      const preview = URL.createObjectURL(pic.blob);
      urls.push(preview);
      // Bước xác nhận: ảnh mới kèm khung vùng chạm — chỉ lưu khi đồ vật nằm đúng khung.
      work.replaceChildren(
        notice('info', 'Mỗi đồ vật có nằm trong khung của nó không? (khung "under the bed" trùng cái giường…). Lệch thì bé chạm vào giường mà Bông lại nói chỗ khác.'),
        zonesPreview(room, roomArt(room, preview)),
        h('div.actions', {},
          h('button.btn.primary', {
            type: 'button', text: '✔ Khớp — lưu ảnh này',
            onclick: async () => {
              try {
                await setWordImage(app.db, { lessonId: HIDE_BG_IMAGES, word: room.id, ...pic });
                toast('Đã lưu ảnh phòng.');
                reload();
              } catch (err) {
                toast(imageErrorMessage(err), 4000);
              }
            },
          }),
          h('button.btn', {
            type: 'button', text: '✖ Chưa khớp',
            onclick: () => work.replaceChildren(notice('info', 'Chưa lưu. Gửi ảnh bố cục mẫu cho AI kèm "Copy prompt kèm ảnh mẫu" để AI vẽ lại đúng vị trí, rồi chọn lại ảnh.')),
          })));
    });
    let layout = null;
    const layoutBtn = h('button.btn', {
      type: 'button', text: '⬇ Tải ảnh bố cục mẫu', disabled: true,
      onclick: () => {
        if (!layout) return;
        downloadFile(layout, `bo-cuc-tron-tim-${room.id}.png`);
        toast('Đã tải ảnh bố cục mẫu về máy.', 3500);
      },
    });
    layoutImage({ svg: roomSvg(room) }).then((blob) => {
      layout = blob;
      layoutBtn.disabled = false;
    }).catch(() => { layoutBtn.textContent = 'Không tạo được ảnh bố cục'; });
    return section(`${room.emoji} ${room.vi} (${room.spots.length} chỗ nấp)`,
      zonesPreview(room, roomArt(room, url)),
      h('div.actions', {},
        layoutBtn,
        h('button.btn', { type: 'button', text: '📋 Copy prompt kèm ảnh mẫu', onclick: () => copyText(roomPrompt(room, { reference: true })).then((ok) => toast(ok ? 'Đã copy. Nhớ đính kèm ảnh bố cục mẫu.' : 'Không copy được.', 3500)) }),
        h('button.btn', { type: 'button', text: '📋 Copy prompt (không ảnh mẫu)', onclick: () => copyText(roomPrompt(room)).then((ok) => toast(ok ? 'Đã copy prompt.' : 'Không copy được.')) }),
        h('button.btn.primary', { type: 'button', text: url ? 'Thay ảnh phòng' : 'Chọn ảnh phòng', onclick: () => input.click() }),
        url ? h('button.btn.danger', {
          type: 'button', text: 'Dùng tranh vẽ sẵn',
          onclick: async () => {
            await removeWordImage(app.db, HIDE_BG_IMAGES, room.id);
            reload();
          },
        }) : null),
      work, input);
  }

  function bongSection() {
    const items = h('div.sp-admin-items', {}, ...POSES.map((pose) => {
      const has = images.bong.has(pose);
      const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;
        try {
          await setWordImage(app.db, { lessonId: HIDE_BONG_IMAGES, word: pose, ...await cutOutSticker((await resizeImage(file)).blob) });
          toast('Đã lưu ảnh Bông.');
          reload();
        } catch (err) {
          toast(imageErrorMessage(err), 4000);
        }
      });
      return h('div.sp-admin-item', { dataset: { pose } },
        has ? h('img.fd-admin-face.checker', { src: images.bong.get(pose), alt: '' }) : h('span.fd-admin-face', { text: '🐰' }),
        h('span', { text: pose }),
        h('span.muted', { text: POSE_LABEL[pose].vi }),
        h('button.btn.small', { type: 'button', text: has ? 'Thay ảnh' : 'Chọn ảnh', onclick: () => input.click() }),
        has ? h('button.btn.small.danger', {
          type: 'button', text: 'Dùng hình vẽ',
          onclick: async () => {
            await removeWordImage(app.db, HIDE_BONG_IMAGES, pose);
            reload();
          },
        }) : null,
        input);
    }));
    const grid = gridSection(app, {
      id: HIDE_BONG_IMAGES,
      words: POSES.map((p) => ({ en: p, label: `Bông — ${p}`, imagePrompt: `Bông ${POSE_LABEL[p].draw}` })),
    }, urls, 'Ảnh lưới 4 tư thế Bông', { promptNote: `\n${BONG_PROMPT_NOTE}`, process: (tile) => cutOutSticker(tile.blob), onSaved: reload, previewClass: 'checker' });
    return section('🐰 Ảnh Bông (không bắt buộc)',
      notice('info', 'Thiếu tư thế nào thì app dùng Bông vẽ sẵn cho tư thế đó. Ảnh "peek" chỉ cần đôi tai thò lên.'),
      items, grid);
  }

  function surpriseSection(found) {
    return section(`🎁 Bất ngờ khi chạm nhầm (${SURPRISES.length})`, h('div.sp-admin-items', {}, ...SURPRISES.map((x) => {
      const has = images.items.has(x.id);
      const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;
        try {
          await setWordImage(app.db, { lessonId: HIDE_ITEM_IMAGES, word: x.id, ...await cutOutSticker((await resizeImage(file)).blob) });
          toast(`Đã lưu ảnh ${x.vi}.`);
          reload();
        } catch (err) {
          toast(imageErrorMessage(err), 4000);
        }
      });
      const fromLesson = found.get(x.id) ?? [];
      return h('div.sp-admin-item', { dataset: { surprise: x.id } },
        has ? h('img.fd-admin-face.checker', { src: images.items.get(x.id), alt: '' }) : h('span.fd-admin-face', { text: x.emoji }),
        h('span', { text: x.en }),
        h('span.muted', { text: x.vi }),
        h('button.btn.small', { type: 'button', text: has ? 'Thay ảnh' : 'Chọn ảnh', onclick: () => input.click() }),
        // Dùng lại ảnh bài học: sao chép (bỏ nền) — mỗi bất ngờ chỉ giữ một bản, dùng lại lần nữa thì thay bản cũ.
        fromLesson.length ? h('button.btn.small', {
          type: 'button', text: 'Dùng ảnh bài học',
          title: fromLesson[0].title ? `Ảnh của bài ${fromLesson[0].title}` : '',
          onclick: async () => {
            try {
              await setWordImage(app.db, { lessonId: HIDE_ITEM_IMAGES, word: x.id, ...await cutOutSticker(mediaBlob(fromLesson[0].img)) });
              toast(`Đã dùng ảnh ${x.en}${fromLesson[0].title ? ` của bài ${fromLesson[0].title}` : ''}.`);
              reload();
            } catch (err) {
              toast(imageErrorMessage(err), 4000);
            }
          },
        }) : null,
        has ? h('button.btn.small.danger', {
          type: 'button', text: 'Dùng emoji',
          onclick: async () => {
            await removeWordImage(app.db, HIDE_ITEM_IMAGES, x.id);
            reload();
          },
        }) : null,
        input);
    })));
  }

  function surpriseGrids() {
    const out = [];
    for (let i = 0; i < SURPRISES.length; i += GRID_GROUP) {
      const group = SURPRISES.slice(i, i + GRID_GROUP);
      out.push(gridSection(app, { id: HIDE_ITEM_IMAGES, words: group.map((x) => ({ en: x.id, label: x.en })) }, urls,
        `Ảnh lưới bất ngờ ${out.length + 1} — ${group.map((x) => x.en).join(', ')}`,
        { promptNote: `\n${SURPRISE_PROMPT_NOTE}`, process: (tile) => cutOutSticker(tile.blob), onSaved: reload, previewClass: 'checker' }));
    }
    return out;
  }

  function shareSection() {
    return mediaShareSection(app, {
      what: 'ảnh Trốn tìm',
      intro: 'Gửi ảnh phòng, ảnh Bông và ảnh bất ngờ sang máy khác (ảnh nằm trong file). Ảnh của bé không bao giờ đi theo. Trên máy kia: Góc bố mẹ → Ảnh Trốn tìm → "Nhập từ file" (hoặc Quản lý bài → "Nhập bài từ file").',
      canMake: images.bg.size + images.bong.size + images.items.size > 0,
      backup: { lessonIds: [HIDE_BG_IMAGES, HIDE_BONG_IMAGES, HIDE_ITEM_IMAGES], filename: `tron-tim-${dayKey()}.zip` },
      accept: async (payload) => {
        const got = await acceptHidePayload(app, payload);
        if (!got.images) throw new BackupError('File này không có ảnh Trốn tìm.');
        return `Đã nhận ${got.images} ảnh Trốn tìm (ảnh mới hơn thay ảnh cũ).`;
      },
      done: reload,
    });
  }

  return () => {
    images?.revoke();
    urls.forEach((u) => URL.revokeObjectURL(u));
  };
}
