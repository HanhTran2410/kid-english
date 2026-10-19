// Góc bố mẹ → Ảnh Ghép hình (SPEC-puzzle mục 5.2, 6): xem trước ô vuông + chỉnh vị trí cắt cho ảnh gia đình và ảnh
// bố mẹ thêm; thêm ảnh ghép riêng (tên Anh / Việt); chia sẻ (chỉ ảnh `puzzle:`, không bao giờ có ảnh gia đình).

import { h, toast, confirmDialog } from '../../ui.js';
import { setWordImage, removeWordImage, getWordImage, mediaBlob } from '../../db.js';
import { resizeImage } from '../../image.js';
import { dayKey } from '../../text.js';
import { applyBackup, BackupError } from '../../backup.js';
import { FAMILY, PROFILE_IMAGES, familyPhotoKey } from '../../talk.js';
import { PUZZLE_PHOTOS, cropSquare, cleanPuzzlePhotos } from '../../puzzle.js';
import { parentLayout, goParent, section, notice, field } from './common.js';
import { imageErrorMessage } from './lessons.js';
import { mediaShareSection } from './media-share.js';

const POS_LABEL = { start: '⬆ Đầu', center: 'Giữa', end: '⬇ Cuối' };

/** Nhận ảnh ghép riêng từ máy khác (ảnh mới hơn thắng; danh sách gộp theo mã, không ghi đè mục của máy này). */
export async function acceptPuzzlePayload(app, payload) {
  const images = payload.images.filter((img) => img.lessonId === PUZZLE_PHOTOS);
  const incoming = cleanPuzzlePhotos(payload.settings?.find((s) => s.key === 'puzzlePhotos')?.value ?? []);
  if (images.length) {
    await applyBackup(app.db, {
      ...payload, lessons: [], images, frameSets: [], recordings: [], progress: [], stickers: [], settings: [],
    }, 'merge');
  }
  const before = cleanPuzzlePhotos(app.settings.puzzlePhotos);
  const have = new Set(before.map((p) => p.id));
  const added = incoming.filter((p) => !have.has(p.id));
  if (added.length) await app.setSetting('puzzlePhotos', [...before, ...added]);
  return { images: images.length, photos: added.length };
}

/** Xem trước ô vuông (đúng vị trí cắt) bằng canvas. */
async function previewCanvas(blob, pos) {
  const bmp = await createImageBitmap(blob);
  const { sx, sy, size } = cropSquare(bmp.width, bmp.height, pos);
  const canvas = h('canvas.pz-admin-preview', { width: 160, height: 160 });
  canvas.getContext('2d').drawImage(bmp, sx, sy, size, size, 0, 0, 160, 160);
  bmp.close?.();
  return canvas;
}

/** Một ảnh + 3 nút chỉnh vị trí cắt. `onPos(pos)` lưu vị trí. */
function cropItem({ blob, title, sub, pos, onPos, extra = [] }) {
  const slot = h('div.pz-admin-slot');
  const draw = async (p) => {
    try {
      slot.replaceChildren(await previewCanvas(blob, p));
    } catch {
      slot.replaceChildren(h('span.muted', { text: 'Ảnh hỏng' }));
    }
  };
  const buttons = Object.entries(POS_LABEL).map(([value, text]) => h(`button.btn.small${value === pos ? '.primary' : ''}`, {
    type: 'button', text, dataset: { pos: value }, 'aria-pressed': String(value === pos),
    onclick: async () => {
      for (const b of buttons) {
        b.classList.toggle('primary', b === buttons.find((x) => x.dataset.pos === value));
        b.setAttribute('aria-pressed', String(b.dataset.pos === value));
      }
      await onPos(value);
      draw(value);
    },
  }));
  draw(pos);
  return h('div.sp-admin-item.pz-admin-item', {}, slot, h('span', { text: title }), sub ? h('span.muted', { text: sub }) : null,
    h('div.pz-admin-pos', {}, ...buttons), ...extra);
}

export function puzzleAdminView(app) {
  const body = parentLayout(app, { title: 'Ảnh Ghép hình', back: () => goParent(app) });
  const reload = () => goParent(app, 'puzzle');

  (async () => {
    // Ảnh gia đình (Hồ sơ của bé): chỉ đọc trên máy này, chỉ chỉnh vị trí cắt (cài đặt puzzleCrop, không chia sẻ).
    const people = [{ id: 'me', en: 'you', vi: 'Bé' }, ...FAMILY];
    const family = [];
    for (const m of people) {
      const img = await getWordImage(app.db, PROFILE_IMAGES, familyPhotoKey(m.id)).catch(() => null);
      if (!img) continue;
      family.push(cropItem({
        blob: mediaBlob(img), title: m.vi, sub: m.id === 'me' ? 'Ảnh của bé' : m.en, pos: app.settings.puzzleCrop?.[m.id] ?? 'center',
        onPos: (pos) => app.setSetting('puzzleCrop', { ...(app.settings.puzzleCrop ?? {}), [m.id]: pos }),
      }));
    }
    const photos = [];
    for (const p of cleanPuzzlePhotos(app.settings.puzzlePhotos)) {
      const img = await getWordImage(app.db, PUZZLE_PHOTOS, p.id).catch(() => null);
      if (!img) continue;
      photos.push(cropItem({
        blob: mediaBlob(img), title: p.en || '(không tên)', sub: p.vi, pos: p.crop,
        onPos: (pos) => app.setSetting('puzzlePhotos', cleanPuzzlePhotos(app.settings.puzzlePhotos).map((x) => (x.id === p.id ? { ...x, crop: pos } : x))),
        extra: [h('button.btn.small.danger', {
          type: 'button', text: 'Xóa ảnh',
          onclick: async () => {
            if (!await confirmDialog(`Xóa ảnh "${p.en || p.vi}"?`, { danger: true, okText: 'Xóa' })) return;
            await removeWordImage(app.db, PUZZLE_PHOTOS, p.id);
            await app.setSetting('puzzlePhotos', cleanPuzzlePhotos(app.settings.puzzlePhotos).filter((x) => x.id !== p.id));
            reload();
          },
        })],
      }));
    }
    body.append(
      notice('info', 'Ghép cả bức tranh dùng thẳng ảnh từ vựng ở các bài học và 10 hình vẽ sẵn, không cần làm gì thêm. Ở đây: chỉnh vị trí cắt ô vuông cho ảnh gia đình, và thêm ảnh riêng để bé ghép.'),
      section(`👨‍👩‍👧 Ảnh gia đình (${family.length})`,
        h('p.field-hint', { text: app.settings.puzzleFamily === false
          ? 'Đang tắt nhóm Gia đình trong trò Ghép hình (Cài đặt → Ghép hình).'
          : 'Ảnh lấy từ Hồ sơ của bé, chỉ nằm trên máy này, không bao giờ đi theo khi chia sẻ. Chọn vị trí cắt để không mất khuôn mặt.' }),
        family.length ? h('div.sp-admin-items', {}, ...family) : h('p.muted', { text: 'Chưa có ảnh gia đình. Thêm ở Hồ sơ của bé.' })),
      addSection(app, reload),
      section(`📷 Ảnh của bố mẹ (${photos.length})`, photos.length ? h('div.sp-admin-items', {}, ...photos) : h('p.muted', { text: 'Chưa có ảnh nào.' })),
      shareSection(app, photos.length, reload),
    );
  })();
}

function addSection(app, reload) {
  const en = h('input', { type: 'text', placeholder: 'ví dụ: rainbow, our car, my teddy', autocomplete: 'off' });
  const vi = h('input', { type: 'text', placeholder: 'ví dụ: cầu vồng', autocomplete: 'off' });
  const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const pic = await resizeImage(file);
      if (Math.min(pic.width, pic.height) < 300) {
        toast('Ảnh nhỏ quá (cần cạnh ngắn ≥ 300 px) — mảnh ghép sẽ bị vỡ hạt.', 4000);
        return;
      }
      const id = `p-${Date.now().toString(36)}`;
      await setWordImage(app.db, { lessonId: PUZZLE_PHOTOS, word: id, ...pic });
      await app.setSetting('puzzlePhotos', [...cleanPuzzlePhotos(app.settings.puzzlePhotos),
        { id, en: en.value.trim().toLowerCase(), vi: vi.value.trim(), crop: 'center' }]);
      toast('Đã thêm ảnh ghép. Kiểm tra vị trí cắt ô vuông bên dưới.', 3500);
      reload();
    } catch (err) {
      toast(imageErrorMessage(err), 4000);
    }
  });
  return section('＋ Thêm ảnh để ghép',
    field('Tên tiếng Anh (bé nghe "Wow! It\'s a …!")', en, 'Để trống thì Bông nói "Wow! You did it!".'),
    field('Tên tiếng Việt (phụ đề)', vi),
    h('div.actions', {}, h('button.btn.primary', { type: 'button', text: 'Chọn ảnh', onclick: () => input.click() })),
    input);
}

function shareSection(app, count, reload) {
  return mediaShareSection(app, {
    what: 'ảnh Ghép hình',
    intro: count
      ? `Gửi ${count} ảnh ghép riêng (kèm tên, vị trí cắt) sang máy khác. Ảnh gia đình không bao giờ đi theo. Trên máy kia: Góc bố mẹ → Ảnh Ghép hình → "Nhập từ file" (hoặc Quản lý bài → "Nhập bài từ file").`
      : 'Máy này chưa có ảnh ghép riêng để gửi. Máy kia gửi sang thì bấm "Nhập từ file" ở đây.',
    canMake: count > 0,
    backup: { lessonIds: [PUZZLE_PHOTOS], settingsKeys: ['puzzlePhotos'], filename: `ghep-hinh-${dayKey()}.zip` },
    accept: async (payload) => {
      const got = await acceptPuzzlePayload(app, payload);
      if (!got.images && !got.photos) throw new BackupError('File này không có ảnh Ghép hình.');
      return `Đã nhận ${got.images} ảnh Ghép hình${got.photos ? `, thêm ${got.photos} ảnh mới vào danh sách` : ''}.`;
    },
    done: reload,
  });
}
