// Góc bố mẹ → Ảnh Tìm đồ còn thiếu (SPEC-missing mục 6): ảnh nền + ảnh đồ vật của các CẢNH RIÊNG (mâm cơm, giờ tắm…).
// Cảnh Dán tranh dùng chung ảnh của Dán tranh (thay ở trang Ảnh Dán tranh).

import { h, toast, copyText } from '../../ui.js';
import { setWordImage, removeWordImage, mediaBlob } from '../../db.js';
import { resizeImage, resizeCover, cutOutSticker } from '../../image.js';
import { dayKey, normalizeWord } from '../../text.js';
import { applyBackup, BackupError } from '../../backup.js';
import { W, H, OWN_SCENES, PICTURES, MISSING_BG_IMAGES, MISSING_ITEM_IMAGES, ownScenePrompt } from '../../missing.js';
import { loadMissingImages, itemFace } from '../missing.js';
import { parentLayout, goParent, section, notice } from './common.js';
import { imageErrorMessage } from './lessons.js';
import { mediaShareSection } from './media-share.js';
import { downloadFile } from './backup.js';
import { layoutImage } from './scenes.js';
import { reusableFor } from './hide.js';

/** Nhận ảnh Tìm đồ còn thiếu từ máy khác (ảnh mới hơn thắng). */
export async function acceptMissingPayload(app, payload) {
  const images = payload.images.filter((img) => String(img.lessonId ?? '').startsWith('missing:'));
  if (images.length) {
    await applyBackup(app.db, { ...payload, lessons: [], images, frameSets: [], recordings: [], progress: [], stickers: [], settings: [] }, 'merge');
  }
  return { images: images.length };
}

/** Sao chép ảnh có sẵn (sticker Dán tranh giữ nguyên, ảnh bài học bỏ nền) thành ảnh đồ vật của cảnh riêng. */
async function useImage(app, item, cand) {
  const pic = cand.source === 'sticker'
    ? { blob: mediaBlob(cand.img), mimeType: cand.img.mimeType, width: cand.img.width, height: cand.img.height }
    : await cutOutSticker(mediaBlob(cand.img));
  await setWordImage(app.db, { lessonId: MISSING_ITEM_IMAGES, word: item.id, ...pic });
}

/** Ảnh nền kèm khung chỗ đặt đồ vật (để kiểm tra ảnh mới có chừa trống đúng chỗ không). */
function spotsPreview(scene, art) {
  const spots = PICTURES.filter((p) => p.scene === scene.id).flatMap((p) => p.items);
  return h('div.sp-admin-scene.ms-admin-scene', { dataset: { scene: scene.id } }, art, ...spots.map((s) => h('div.sp-admin-zone', {
    style: { left: `${((s.x - s.size / 2) / W) * 100}%`, top: `${((s.y - s.size / 2) / H) * 100}%`, width: `${(s.size / W) * 100}%`, height: `${(s.size / H) * 100}%` },
    text: scene.items.find((x) => x.id === s.item)?.name ?? s.item,
  })));
}
const svgArt = (scene) => h('div', { html: `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%">${scene.svg}</svg>` });
const imgArt = (url) => h('img', { src: url, alt: '', style: { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover' } });

export function missingAdminView(app) {
  const body = parentLayout(app, { title: 'Ảnh Tìm đồ còn thiếu', back: () => goParent(app) });
  const reload = () => goParent(app, 'missing');
  const urls = [];
  let images = null;

  loadMissingImages(app).then(async (loaded) => {
    images = loaded;
    const cands = new Map();
    for (const sc of OWN_SCENES) for (const it of sc.items) cands.set(`${sc.id}:${it.id}`, await reusableFor(app.db, { en: it.name }));
    body.append(
      notice('info', 'Trò chơi dùng cảnh Dán tranh (thay ảnh ở Góc bố mẹ → Ảnh Dán tranh) và 4 cảnh riêng dưới đây. Mỗi cảnh riêng chạy ngay bằng tranh vẽ sẵn + emoji; muốn đẹp hơn thì thay ảnh nền và ảnh từng đồ vật. Ảnh nền phải chừa trống đúng các khung đặt đồ.'),
      reuseAllSection(cands),
      ...OWN_SCENES.map((sc) => sceneSection(sc, cands)),
      shareSection(),
    );
  });

  function sceneSection(sc, cands) {
    const url = images.own.bg.get(sc.id);
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
      // Xác nhận: ảnh mới kèm khung đặt đồ — chỉ lưu khi các khung nằm trên chỗ trống.
      work.replaceChildren(
        notice('info', 'Các khung đặt đồ vật có nằm trên chỗ trống (mặt bàn, mâm…) không? Đồ vật là sticker riêng đặt lên, nên ảnh nền không được vẽ đồ vật vào các khung này.'),
        spotsPreview(sc, imgArt(preview)),
        h('div.actions', {},
          h('button.btn.primary', {
            type: 'button', text: '✔ Khớp — lưu ảnh này',
            onclick: async () => {
              try {
                await setWordImage(app.db, { lessonId: MISSING_BG_IMAGES, word: sc.id, ...pic });
                toast('Đã lưu ảnh nền.');
                reload();
              } catch (err) {
                toast(imageErrorMessage(err), 4000);
              }
            },
          }),
          h('button.btn', { type: 'button', text: '✖ Chưa khớp', onclick: () => work.replaceChildren(notice('info', 'Chưa lưu. Gửi ảnh bố cục mẫu cho AI kèm "Copy prompt kèm ảnh mẫu" rồi chọn lại ảnh.')) })));
    });
    let layout = null;
    const layoutBtn = h('button.btn', {
      type: 'button', text: '⬇ Tải ảnh bố cục mẫu', disabled: true,
      onclick: () => {
        if (!layout) return;
        downloadFile(layout, `bo-cuc-${sc.id}.png`);
        toast('Đã tải ảnh bố cục mẫu về máy.', 3500);
      },
    });
    layoutImage({ svg: sc.svg }).then((blob) => {
      layout = blob;
      layoutBtn.disabled = false;
    }).catch(() => { layoutBtn.textContent = 'Không tạo được ảnh bố cục'; });

    const items = h('div.sp-admin-items', {}, ...sc.items.map((it) => {
      const has = images.own.item.has(normalizeWord(it.id));
      const file = h('input', { type: 'file', accept: 'image/*', hidden: true });
      file.addEventListener('change', async () => {
        const f = file.files?.[0];
        file.value = '';
        if (!f) return;
        try {
          await setWordImage(app.db, { lessonId: MISSING_ITEM_IMAGES, word: it.id, ...await cutOutSticker((await resizeImage(f)).blob) });
          toast(`Đã lưu ảnh ${it.vi}.`);
          reload();
        } catch (err) {
          toast(imageErrorMessage(err), 4000);
        }
      });
      const list = cands.get(`${sc.id}:${it.id}`) ?? [];
      const pickBox = h('div.fd-admin-pick');
      const showPicks = () => {
        if (pickBox.childElementCount) {
          pickBox.replaceChildren();
          return;
        }
        pickBox.replaceChildren(...list.map((c) => {
          const u = URL.createObjectURL(mediaBlob(c.img));
          urls.push(u);
          return h('button.fd-admin-cand', {
            type: 'button', dataset: { source: c.source }, 'aria-label': `Dùng ảnh ${c.source === 'sticker' ? 'sticker Dán tranh' : `bài ${c.title}`}`,
            onclick: async () => {
              try {
                await useImage(app, it, c);
                toast(`Đã dùng ảnh ${it.name}.`);
                reload();
              } catch (err) {
                toast(imageErrorMessage(err), 4000);
              }
            },
          }, h('img', { src: u, alt: '' }), h('span.muted', { text: c.source === 'sticker' ? 'Dán tranh' : c.title }));
        }));
      };
      return h('div.sp-admin-item', { dataset: { item: it.id } },
        h('span.fd-admin-face.checker', {}, itemFace(it, images, true)),
        h('span', { text: it.name }),
        h('span.muted', { text: it.vi }),
        h('button.btn.small', { type: 'button', text: has ? 'Thay ảnh' : 'Chọn ảnh', onclick: () => file.click() }),
        list.length ? h('button.btn.small', { type: 'button', text: `Ảnh có sẵn (${list.length})…`, onclick: showPicks }) : null,
        has ? h('button.btn.small.danger', {
          type: 'button', text: 'Dùng emoji',
          onclick: async () => {
            await removeWordImage(app.db, MISSING_ITEM_IMAGES, it.id);
            reload();
          },
        }) : null,
        pickBox, file);
    }));

    return section(`${sc.emoji} ${sc.vi} (${sc.items.length} đồ vật)`,
      spotsPreview(sc, url ? imgArt(url) : svgArt(sc)),
      h('div.actions', {},
        layoutBtn,
        h('button.btn', { type: 'button', text: '📋 Copy prompt kèm ảnh mẫu', onclick: () => copyText(ownScenePrompt(sc, { reference: true })).then((ok) => toast(ok ? 'Đã copy. Nhớ đính kèm ảnh bố cục mẫu.' : 'Không copy được.', 3500)) }),
        h('button.btn.primary', { type: 'button', text: url ? 'Thay ảnh nền' : 'Chọn ảnh nền', onclick: () => input.click() }),
        url ? h('button.btn.danger', {
          type: 'button', text: 'Dùng tranh vẽ sẵn',
          onclick: async () => {
            await removeWordImage(app.db, MISSING_BG_IMAGES, sc.id);
            reload();
          },
        }) : null),
      work, input, items);
  }

  /** Dùng lại ảnh có sẵn (sticker Dán tranh trước, rồi ảnh bài học) cho mọi đồ vật chưa có ảnh. */
  function reuseAllSection(cands) {
    const todo = OWN_SCENES.flatMap((sc) => sc.items.map((it) => ({ sc, it })))
      .filter(({ sc, it }) => !images.own.item.has(normalizeWord(it.id)) && (cands.get(`${sc.id}:${it.id}`) ?? []).length);
    const unique = [...new Map(todo.map((x) => [x.it.id, x])).values()];
    if (!unique.length) return '';
    return section('♻️ Dùng lại ảnh đã có',
      h('p', { text: `Có ${unique.length} đồ vật chưa có ảnh nhưng trùng tên với sticker Dán tranh hoặc ảnh bài học (${unique.map((x) => x.it.name).join(', ')}). App sao chép ảnh sang trò chơi; sửa / xóa ảnh gốc không ảnh hưởng.` }),
      h('button.btn.primary', {
        type: 'button', text: `Dùng lại ảnh đã có (${unique.length} món)`,
        onclick: async () => {
          let saved = 0;
          for (const { sc, it } of unique) {
            try {
              await useImage(app, it, cands.get(`${sc.id}:${it.id}`)[0]);
              saved++;
            } catch {
              // ảnh hỏng: bỏ qua
            }
          }
          toast(`Đã dùng lại ${saved} ảnh.`);
          reload();
        },
      }));
  }

  function shareSection() {
    return mediaShareSection(app, {
      what: 'ảnh Tìm đồ còn thiếu',
      intro: 'Gửi ảnh nền và ảnh đồ vật của các cảnh riêng sang máy khác. Trên máy kia: Góc bố mẹ → Ảnh Tìm đồ còn thiếu → "Nhập từ file" (hoặc Quản lý bài → "Nhập bài từ file"). Ảnh cảnh Dán tranh chia sẻ ở trang Ảnh Dán tranh.',
      canMake: images.own.bg.size + images.own.item.size > 0,
      backup: { lessonIds: [MISSING_BG_IMAGES, MISSING_ITEM_IMAGES], filename: `tim-do-thieu-${dayKey()}.zip` },
      accept: async (payload) => {
        const got = await acceptMissingPayload(app, payload);
        if (!got.images) throw new BackupError('File này không có ảnh Tìm đồ còn thiếu.');
        return `Đã nhận ${got.images} ảnh (ảnh mới hơn thay ảnh cũ).`;
      },
      done: reload,
    });
  }

  return () => {
    images?.revoke();
    urls.forEach((u) => URL.revokeObjectURL(u));
  };
}
