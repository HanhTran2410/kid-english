// Góc bố mẹ → Ảnh Bác sĩ nhí (SPEC-doctor mục 10): ảnh từng đồ (dụng cụ khám + đồ chữa) — chọn ảnh, dùng lại ảnh có sẵn
// (sticker Dán tranh, ảnh trò chơi khác, ảnh bài học), ảnh lưới; ảnh nền phòng khám; chia sẻ sang máy khác.
// Bạn thú KHÔNG thay ảnh được: vùng chạm (mắt, tai, tay…) gắn với hình vẽ sẵn.

import { h, toast, copyText } from '../../ui.js';
import { setWordImage, removeWordImage, mediaBlob } from '../../db.js';
import { resizeImage, cutOutSticker } from '../../image.js';
import { dayKey, normalizeWord } from '../../text.js';
import { STICKER_IMAGES } from '../../sticker-scenes.js';
import { FEED_FOOD_IMAGES } from '../../feed.js';
import { HIDE_ITEM_IMAGES } from '../../hide-seek.js';
import { MISSING_ITEM_IMAGES } from '../../missing.js';
import { SOUNDS_IMAGES } from '../../animal-sounds.js';
import { applyBackup, BackupError } from '../../backup.js';
import { TOOLS, TREATS, DOCTOR_ITEM_IMAGES, DOCTOR_BG_IMAGES, BG_KEY, BACKGROUND_PROMPT, WASH_IMAGES, WASH_FRAMES, WASH_FRAME_VI, WASH_GRID_PROMPT } from '../../doctor.js';
import { loadDoctorImages, itemFace } from '../doctor.js';
import { parentLayout, goParent, section, notice } from './common.js';
import { pendingGridSections, gridSection, imageErrorMessage } from './lessons.js';
import { mediaShareSection } from './media-share.js';
import { lessonImagesFor } from './feed.js';

/** Phần thêm vào prompt ảnh lưới đồ: nền trắng để app tự cắt nền. */
const ITEM_PROMPT_NOTE = [
  '',
  'DOCTOR GAME RULES (the app cuts each picture out of its white background and the child drags it onto a toy animal patient)',
  '- Draw ONLY the object itself: no hands, no people, no animals, no needles, no pills, no blood.',
  '- It fills most of its cell, centered, with a continuous thick dark outline all around it.',
  '- Pure flat white (#FFFFFF) background: no shadow, no scenery, no frame.',
].join('\n');

/** Ảnh đồ vật của trò khác: đã bỏ nền sẵn, dùng lại nguyên ảnh. */
const GAME_ITEM_SOURCES = {
  [STICKER_IMAGES]: 'Dán tranh',
  [FEED_FOOD_IMAGES]: 'Cho Bông ăn',
  [HIDE_ITEM_IMAGES]: 'Trốn tìm',
  [MISSING_ITEM_IMAGES]: 'Tìm đồ còn thiếu',
  [SOUNDS_IMAGES]: 'Ai kêu thế?',
};

/**
 * Ảnh có sẵn trùng một trong các tên của đồ (`reuse`): ảnh đồ vật của các trò (sticker Dán tranh, Cho Bông ăn, Trốn tìm…)
 * trước, rồi ảnh bài học (mới nhất trước).
 * @returns {Promise<Array<{ img: object, source: 'game'|'lesson', title: string }>>}
 */
export async function reusableForItem(db, item) {
  const games = [];
  const lessons = [];
  const seen = new Set();
  for (const w of item.reuse ?? [item.name]) {
    const word = normalizeWord(w);
    for (const img of await db.getAllByIndex('images', 'word', word).catch(() => [])) {
      const title = GAME_ITEM_SOURCES[img.lessonId];
      if (title && !seen.has(img.id)) {
        seen.add(img.id);
        games.push({ img, source: 'game', title });
      }
    }
    for (const { img, title } of await lessonImagesFor(db, { en: word, grammar: 'mass' })) {
      if (seen.has(img.id)) continue;
      seen.add(img.id);
      lessons.push({ img, source: 'lesson', title });
    }
  }
  return [...games, ...lessons];
}

/** Dùng lại một ảnh: SAO CHÉP sang trò này (ảnh trò khác giữ nguyên vì đã bỏ nền; ảnh bài học thì bỏ nền trắng). */
async function useImage(app, item, cand) {
  const pic = cand.source === 'game'
    ? { blob: mediaBlob(cand.img), mimeType: cand.img.mimeType, width: cand.img.width, height: cand.img.height }
    : await cutOutSticker(mediaBlob(cand.img));
  await setWordImage(app.db, { lessonId: DOCTOR_ITEM_IMAGES, word: item.id, ...pic });
}
const sourceName = (c) => (c.source === 'game' ? c.title : `bài ${c.title || 'học'}`);

/** Nhận ảnh Bác sĩ nhí từ file của máy khác (ảnh mới hơn thắng). Dùng chung cho trang này và Quản lý bài. */
export async function acceptDoctorPayload(app, payload) {
  const images = payload.images.filter((img) => String(img.lessonId ?? '').startsWith('doctor:'));
  if (images.length) {
    await applyBackup(app.db, { ...payload, lessons: [], images, frameSets: [], recordings: [], progress: [], stickers: [], settings: [] }, 'merge');
  }
  return { images: images.length };
}

export function doctorAdminView(app) {
  const body = parentLayout(app, { title: 'Ảnh Bác sĩ nhí', back: () => goParent(app) });
  const reload = () => goParent(app, 'doctor');
  const urls = [];
  let images = null;

  loadDoctorImages(app).then(async (loaded) => {
    images = loaded;
    const cands = new Map();
    for (const item of [...TOOLS, ...TREATS]) cands.set(item.id, await reusableForItem(app.db, item));
    body.append(
      notice('info', 'Trò chơi chạy ngay bằng emoji và bạn thú vẽ sẵn. Muốn đẹp hơn: dùng lại ảnh đã có (sticker, ảnh trò khác, ảnh bài học trùng tên), thay ảnh từng đồ, hoặc vẽ nhiều đồ một lần bằng ảnh lưới. App tự bỏ nền trắng. Bạn thú (gấu, mèo, cún, heo) không thay ảnh được, vì chỗ bé chạm (mắt, tai, tay…) gắn với hình vẽ sẵn.'),
      // SPEC-doctor2 mục 3: ghi chú rửa tay chỉ ở Góc bố mẹ, không hiện trong màn chơi.
      notice('info', '🧼 Mỗi lượt Bác sĩ nhí bắt đầu bằng rửa tay (xà phòng → nước → khăn, từ mức 2 thêm đeo găng) để bé quen thói quen rửa tay. Bố mẹ có thể nói lại "Wash your hands!" trước bữa ăn.'),
      reuseAllSection(cands),
      itemsSection('🩹 Đồ chữa', TREATS, cands),
      itemsSection('🩺 Dụng cụ khám (từ mức 2)', TOOLS, cands),
      ...pendingGridSections(app, {
        id: DOCTOR_ITEM_IMAGES, what: 'đồ', urls, has: (w) => images.item.has(w.en),
        words: [...TREATS, ...TOOLS].map((t) => ({ en: t.id, label: t.name, imagePrompt: t.draw })),
        promptNote: `\n${ITEM_PROMPT_NOTE}`,
        process: (tile) => cutOutSticker(tile.blob), onSaved: reload, previewClass: 'checker',
      }),
      washSection(),
      backgroundSection(),
      shareSection(),
    );
  });

  function itemsSection(title, list, cands) {
    return section(`${title} (${list.length})`, h('div.sp-admin-items', {}, ...list.map((item) => {
      const has = images.item.has(item.id);
      const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;
        try {
          await setWordImage(app.db, { lessonId: DOCTOR_ITEM_IMAGES, word: item.id, ...await cutOutSticker((await resizeImage(file)).blob) });
          toast(`Đã lưu ảnh ${item.vi}.`);
          reload();
        } catch (err) {
          toast(imageErrorMessage(err), 4000);
        }
      });
      const found = cands.get(item.id) ?? [];
      const pickBox = h('div.fd-admin-pick');
      const showPicks = () => {
        if (pickBox.childElementCount) {
          pickBox.replaceChildren();
          return;
        }
        pickBox.replaceChildren(...found.map((c) => {
          const u = URL.createObjectURL(mediaBlob(c.img));
          urls.push(u);
          return h('button.fd-admin-cand', {
            type: 'button', dataset: { source: c.source }, 'aria-label': `Dùng ảnh ${sourceName(c)}`,
            onclick: async () => {
              try {
                await useImage(app, item, c);
                toast(`Đã dùng ảnh ${item.name} (${sourceName(c)}).`);
                reload();
              } catch (err) {
                toast(imageErrorMessage(err), 4000);
              }
            },
          }, h('img', { src: u, alt: '' }), h('span.muted', { text: c.title }));
        }));
      };
      return h('div.sp-admin-item', { dataset: { item: item.id } },
        h('span.fd-admin-face.checker', {}, itemFace(item, images, 'dr-admin-face')),
        h('span', { text: item.name }),
        h('span.muted', { text: item.vi }),
        h('button.btn.small', { type: 'button', text: has ? 'Thay ảnh' : 'Chọn ảnh', onclick: () => input.click() }),
        found.length ? h('button.btn.small', { type: 'button', text: `Ảnh có sẵn (${found.length})…`, onclick: showPicks }) : null,
        has ? h('button.btn.small.danger', {
          type: 'button', text: 'Dùng emoji',
          onclick: async () => {
            await removeWordImage(app.db, DOCTOR_ITEM_IMAGES, item.id);
            reload();
          },
        }) : null,
        pickBox, input);
    })));
  }

  /** Dùng lại ảnh có sẵn (ảnh trò khác trước, rồi ảnh bài học) cho mọi đồ CHƯA có ảnh. */
  function reuseAllSection(cands) {
    const todo = [...TREATS, ...TOOLS].filter((t) => !images.item.has(t.id) && (cands.get(t.id) ?? []).length);
    if (!todo.length) return '';
    return section('♻️ Dùng lại ảnh đã có',
      h('p', { text: `Có ${todo.length} đồ chưa có ảnh nhưng trùng tên với ảnh đã có trong app (${todo.map((t) => `${t.name} ← ${sourceName(cands.get(t.id)[0])}`).join(', ')}). App sao chép ảnh sang trò này; sửa / xóa ảnh gốc không ảnh hưởng. Muốn chọn ảnh khác thì bấm "Ảnh có sẵn…" ở từng đồ.` }),
      h('button.btn.primary', {
        type: 'button', text: `Dùng lại ảnh đã có (${todo.length} đồ)`,
        onclick: async () => {
          let saved = 0;
          for (const t of todo) {
            try {
              await useImage(app, t, cands.get(t.id)[0]);
              saved++;
            } catch {
              // ảnh hỏng: bỏ qua, đồ đó vẫn dùng emoji
            }
          }
          toast(`Đã dùng lại ${saved} ảnh.`);
          reload();
        },
      }));
  }

  function backgroundSection() {
    const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      try {
        await setWordImage(app.db, { lessonId: DOCTOR_BG_IMAGES, word: BG_KEY, ...await resizeImage(file) });
        toast('Đã lưu ảnh nền.');
        reload();
      } catch (err) {
        toast(imageErrorMessage(err), 4000);
      }
    });
    return section('🖼️ Ảnh nền phòng khám (không bắt buộc)',
      images.bg ? h('img.dr-admin-bg', { src: images.bg, alt: 'Ảnh nền phòng khám' }) : null,
      h('p.muted', { text: 'Một ảnh phòng khám nhạt màu, có giường khám ở giữa phía dưới, chừa trống giữa khung cho bạn thú ngồi. Khay đồ luôn có nền trắng riêng.' }),
      h('div.actions', {},
        h('button.btn', { type: 'button', text: 'Copy prompt', onclick: () => copyText(BACKGROUND_PROMPT).then((ok) => toast(ok ? 'Đã copy prompt.' : 'Không copy được.')) }),
        h('button.btn.primary', { type: 'button', text: images.bg ? 'Thay ảnh nền' : 'Chọn ảnh nền', onclick: () => input.click() }),
        images.bg ? h('button.btn.danger', {
          type: 'button', text: 'Dùng nền vẽ sẵn',
          onclick: async () => {
            await removeWordImage(app.db, DOCTOR_BG_IMAGES, BG_KEY);
            reload();
          },
        }) : null),
      input);
  }

  /** 🧼 Rửa tay (SPEC-art ART1): một ảnh lưới 3 × 2 — 6 ô cùng một đôi tay; đủ 6 ô thì trò chơi dùng ảnh. */
  function washSection() {
    const have = WASH_FRAMES.filter((f) => images.wash.has(f));
    const all = have.length === WASH_FRAMES.length;
    return h('div', {},
      section(`🧼 Rửa tay — ${all ? 'đang dùng ảnh' : have.length ? `có ${have.length}/6 ô (cần đủ 6 ô, đang dùng hình vẽ sẵn)` : 'đang dùng hình vẽ sẵn'}`,
        h('p.muted', { text: 'Một ảnh lưới 6 ô: tay bẩn → đầy bọt → dưới vòi nước → sạch → đeo găng → giơ ngón cái. Vẽ một lần cả 6 ô để đôi tay giống nhau. Trò chơi chuyển ảnh theo từng bước, có bọt bay, nước chảy, lấp lánh.' }),
        have.length ? h('div.dr-wash-admin', {}, ...WASH_FRAMES.map((f) => h('figure', {},
          images.wash.has(f) ? h('img', { src: images.wash.get(f), alt: WASH_FRAME_VI[f] }) : h('div.dr-wash-missing', { text: '—' }),
          h('figcaption', { text: WASH_FRAME_VI[f] })))) : null,
        have.length ? h('div.actions', {}, h('button.btn.danger', {
          type: 'button', text: 'Dùng hình vẽ sẵn',
          onclick: async () => {
            for (const f of WASH_FRAMES) await removeWordImage(app.db, WASH_IMAGES, f);
            reload();
          },
        })) : null),
      gridSection(app, { id: WASH_IMAGES, words: WASH_FRAMES.map((f) => ({ en: f, label: `${WASH_FRAMES.indexOf(f) + 1}. ${WASH_FRAME_VI[f]}` })) }, urls, '🧼 Ảnh lưới rửa tay', {
        prompt: WASH_GRID_PROMPT, shape: { cols: 3, rows: 2 }, trim: true, onSaved: reload,
      }));
  }

  function shareSection() {
    return mediaShareSection(app, {
      what: 'ảnh Bác sĩ nhí',
      intro: 'Gửi ảnh đồ và ảnh nền phòng khám sang máy khác (ảnh nằm trong file). Trên máy kia: Góc bố mẹ → Ảnh Bác sĩ nhí → "Nhập từ file" (hoặc Quản lý bài → "Nhập bài từ file").',
      canMake: images.item.size > 0 || Boolean(images.bg) || images.wash.size > 0,
      backup: { lessonIds: [DOCTOR_ITEM_IMAGES, DOCTOR_BG_IMAGES, WASH_IMAGES], settingsKeys: [], filename: `bac-si-nhi-${dayKey()}.zip` },
      accept: async (payload) => {
        const got = await acceptDoctorPayload(app, payload);
        if (!got.images) throw new BackupError('File này không có ảnh Bác sĩ nhí.');
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
