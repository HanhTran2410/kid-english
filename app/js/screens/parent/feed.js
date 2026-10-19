// Góc bố mẹ → Ảnh Cho Bông ăn (SPEC-feed mục 7): ảnh từng món (đổi / dùng lại ảnh bài học / ảnh lưới), ảnh Bông theo
// tư thế, ảnh nền, thêm món riêng, chia sẻ sang máy khác.

import { h, toast, copyText, confirmDialog } from '../../ui.js';
import { setWordImage, removeWordImage, mediaBlob } from '../../db.js';
import { resizeImage, cutOutSticker } from '../../image.js';
import { normalizeWord, dayKey } from '../../text.js';
import { BONG_FULL_BODY } from '../../prompts.js';
import { applyBackup, BackupError } from '../../backup.js';
import {
  FEED_FOOD_IMAGES, FEED_BONG_IMAGES, FEED_BG_IMAGES, BG_KEY, BUILTIN_FOODS, POSES, POSE_LABEL, BACKGROUND_PROMPT,
  allFoods, cleanCustomFoods,
} from '../../feed.js';
import { loadFeedImages, foodFace } from '../feed.js';
import { parentLayout, goParent, section, notice, field } from './common.js';
import { pendingGridSections, imageErrorMessage } from './lessons.js';
import { mediaShareSection } from './media-share.js';

const GRID_GROUP = 9; // ảnh lưới 3 × 3
const GAME_IMAGE = /^(scene|profile|dress|feed|hide|puzzle|missing):/; // ảnh trò chơi / hồ sơ: không phải ảnh bài học
const KIND_VI = { food: 'Đồ ăn', drink: 'Đồ uống', silly: 'Đồ không ăn được (bất ngờ vui)' };

/** Phần thêm vào prompt ảnh lưới món: nền trắng để app tự cắt nền. */
export const FOOD_PROMPT_NOTE = [
  '',
  'FOOD GAME RULES (the app cuts each picture out of its white background and the child drags it into a bunny\'s mouth)',
  '- Draw ONLY the food / drink / object itself: no hands, no people, no table, no plate unless it is part of the dish.',
  '- It fills most of its cell, centered, with a continuous thick dark outline all around it.',
  '- Pure flat white (#FFFFFF) background: no shadow, no scenery, no frame.',
].join('\n');

/** Ghi chú cho ảnh lưới tư thế Bông: cùng một nhân vật, cùng cỡ, cùng chỗ. */
export const BONG_PROMPT_NOTE = [
  '',
  'CHARACTER RULES (the app swaps these pictures in the same frame, so Bông must not jump around)',
  `- Every cell shows the SAME character: ${BONG_FULL_BODY}.`,
  '- Same size, same position in every cell: full body, centered, feet near the bottom of the cell. Never crop her ears or feet.',
  '- Pure flat white (#FFFFFF) background, no food, no other characters, no text.',
].join('\n');

/** Từ để tìm ảnh bài học trùng tên: "grapes" → grapes, grape. */
function lookupWords(food) {
  const w = normalizeWord(food.en);
  const out = [w];
  if (food.grammar === 'count' && food.plural) out.push(normalizeWord(food.plural));
  if (/s$/.test(w)) out.push(w.replace(/(ie)?s$/, (m, ie) => (ie ? 'y' : '')));
  return [...new Set(out)];
}

/**
 * Ảnh bài học (Từ vựng / Số / Phonics / Hội thoại…) có cùng từ với món — mới nhất trước, kèm tên bài.
 * @returns {Promise<Array<{ img: object, title: string }>>}
 */
export async function lessonImagesFor(db, food) {
  const found = [];
  for (const w of lookupWords(food)) {
    for (const img of await db.getAllByIndex('images', 'word', w).catch(() => [])) {
      if (GAME_IMAGE.test(String(img.lessonId ?? ''))) continue;
      const lesson = await db.get('lessons', img.lessonId).catch(() => null);
      found.push({ img, title: lesson?.title ?? '' });
    }
  }
  return found.sort((a, b) => b.img.createdAt - a.img.createdAt);
}

/** Dùng lại ảnh bài học: SAO CHÉP (bỏ nền) vào ảnh món — xóa / thay ảnh bài học không ảnh hưởng game. */
async function copyLessonImage(app, food, img) {
  await setWordImage(app.db, { lessonId: FEED_FOOD_IMAGES, word: food.id, ...await cutOutSticker(mediaBlob(img)) });
}

/**
 * Nhận ảnh Cho Bông ăn + món thêm từ file của máy khác (ảnh mới hơn thắng theo mã món; món thêm gộp theo mã,
 * không ghi đè món của máy này). Dùng chung cho trang này và Quản lý bài → "Nhập bài từ file".
 */
export async function acceptFeedPayload(app, payload) {
  const images = payload.images.filter((img) => String(img.lessonId ?? '').startsWith('feed:'));
  const incoming = cleanCustomFoods(payload.settings?.find((s) => s.key === 'feedCustom')?.value ?? []);
  if (images.length) {
    await applyBackup(app.db, {
      ...payload, lessons: [], images, frameSets: [], recordings: [], progress: [], stickers: [], settings: [],
    }, 'merge');
  }
  const before = cleanCustomFoods(app.settings.feedCustom);
  const have = new Set(before.map((f) => f.id));
  const added = incoming.filter((f) => !have.has(f.id));
  if (added.length) await app.setSetting('feedCustom', [...before, ...added]);
  return { images: images.length, foods: added.length };
}

export function feedAdminView(app) {
  const body = parentLayout(app, { title: 'Ảnh Cho Bông ăn', back: () => goParent(app) });
  const reload = () => goParent(app, 'feed');
  const urls = [];
  let images = null;

  loadFeedImages(app).then(async (loaded) => {
    images = loaded;
    const foods = allFoods(app.settings.feedCustom);
    const candidates = new Map();
    for (const f of foods) candidates.set(f.id, await lessonImagesFor(app.db, f));
    body.append(
      notice('info', 'Trò chơi chạy ngay bằng emoji và Bông vẽ sẵn. Muốn đẹp hơn: dùng lại ảnh bố mẹ đã thêm ở các bài học, thay ảnh từng món, hoặc vẽ nhiều món một lần bằng ảnh lưới. App tự bỏ nền trắng.'),
      reuseSection(app, foods, candidates, reload),
      ...['food', 'drink', 'silly'].map((kind) => itemsSection(KIND_VI[kind], foods.filter((f) => f.kind === kind && !f.custom), candidates, reload)),
      foods.some((f) => f.custom) ? itemsSection('Món đã thêm', foods.filter((f) => f.custom), candidates, reload) : '',
      addSection(app, reload),
      ...gridSections(app, urls, images, reload),
      bongSection(urls, reload),
      backgroundSection(app, reload),
      shareSection(app, reload),
    );
  });

  // Các phần dưới cần ảnh đã nạp (`images`).
  function itemsSection(title, list, candidates, done) {
    return section(`${title} (${list.length} món)`, h('div.sp-admin-items', {}, ...list.map((food) => {
      const has = images.food.has(food.id);
      const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;
        try {
          const small = await resizeImage(file);
          await setWordImage(app.db, { lessonId: FEED_FOOD_IMAGES, word: food.id, ...await cutOutSticker(small.blob) });
          toast(`Đã lưu ảnh ${food.vi}.`);
          done();
        } catch (err) {
          toast(imageErrorMessage(err), 4000);
        }
      });
      const pickBox = h('div.fd-admin-pick');
      const found = candidates.get(food.id) ?? [];
      const showPicks = () => {
        if (pickBox.childElementCount) {
          pickBox.replaceChildren();
          return;
        }
        pickBox.replaceChildren(...found.map(({ img, title }) => {
          const url = URL.createObjectURL(mediaBlob(img));
          urls.push(url);
          return h('button.fd-admin-cand', {
            type: 'button', title: title || 'bài học', 'aria-label': `Dùng ảnh của bài ${title}`,
            onclick: async () => {
              try {
                await copyLessonImage(app, food, img);
                toast(`Đã dùng ảnh ${food.en}${title ? ` của bài ${title}` : ''}.`);
                done();
              } catch (err) {
                toast(imageErrorMessage(err), 4000);
              }
            },
          }, h('img', { src: url, alt: '' }), h('span.muted', { text: title }));
        }));
      };
      return h('div.sp-admin-item', { dataset: { food: food.id } },
        h('span.fd-admin-face.checker', {}, foodFace(food, images)),
        h('span', { text: food.en }),
        h('span.muted', { text: food.vi }),
        h('button.btn.small', { type: 'button', text: has ? 'Thay ảnh' : 'Chọn ảnh', onclick: () => input.click() }),
        found.length ? h('button.btn.small', { type: 'button', text: `Ảnh bài học (${found.length})…`, onclick: showPicks }) : null,
        has ? h('button.btn.small.danger', {
          type: 'button', text: 'Dùng emoji',
          onclick: async () => {
            await removeWordImage(app.db, FEED_FOOD_IMAGES, food.id);
            done();
          },
        }) : null,
        food.custom ? h('button.btn.small.danger', {
          type: 'button', text: 'Xóa món',
          onclick: async () => {
            if (!await confirmDialog(`Xóa "${food.vi}" (${food.en})?`, { danger: true, okText: 'Xóa' })) return;
            await app.setSetting('feedCustom', cleanCustomFoods(app.settings.feedCustom).filter((f) => f.id !== food.id));
            await removeWordImage(app.db, FEED_FOOD_IMAGES, food.id);
            toast(`Đã xóa ${food.en}.`);
            done();
          },
        }) : null,
        pickBox,
        input);
    })));
  }

  function bongSection(list, done) {
    const items = h('div.sp-admin-items', {}, ...POSES.map((pose) => {
      const has = images.bong.has(pose);
      const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;
        try {
          const small = await resizeImage(file);
          await setWordImage(app.db, { lessonId: FEED_BONG_IMAGES, word: pose, ...await cutOutSticker(small.blob) });
          toast('Đã lưu ảnh Bông.');
          done();
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
            await removeWordImage(app.db, FEED_BONG_IMAGES, pose);
            done();
          },
        }) : null,
        input);
    }));
    const grid = pendingGridSections(app, {
      id: FEED_BONG_IMAGES, what: 'tư thế Bông', urls: list, has: (w) => images.bong.has(w.en),
      words: POSES.map((p) => ({ en: p, label: `Bông — ${p}`, imagePrompt: `Bông ${POSE_LABEL[p].draw}` })),
      promptNote: `\n${BONG_PROMPT_NOTE}`, process: (tile) => cutOutSticker(tile.blob), onSaved: done, previewClass: 'checker',
    });
    return section('🐰 Ảnh Bông (không bắt buộc)',
      notice('info', 'Thiếu tư thế nào thì app dùng Bông vẽ sẵn cho tư thế đó. Mọi tư thế hiện trong cùng một khung, nên nên vẽ Bông cùng cỡ, đứng giữa ô.'),
      items, ...grid);
  }

  return () => {
    images?.revoke();
    urls.forEach((u) => URL.revokeObjectURL(u));
  };
}

/** Dùng lại ảnh bài học cho mọi món chưa có ảnh (lấy ảnh mới nhất của mỗi từ). */
function reuseSection(app, foods, candidates, reload) {
  const todo = foods.filter((f) => (candidates.get(f.id) ?? []).length);
  if (!todo.length) return '';
  return section('♻️ Dùng lại ảnh đã có',
    h('p', { text: `Có ${todo.length} món trùng tên với ảnh bố mẹ đã thêm ở các bài học (${todo.map((f) => f.en).join(', ')}). App sao chép ảnh (bỏ nền trắng) sang trò chơi; sửa / xóa ảnh bài học không ảnh hưởng trò chơi. Muốn chọn ảnh khác cho món nào thì bấm "Ảnh bài học…" ở món đó.` }),
    h('button.btn.primary', {
      type: 'button',
      text: `Dùng lại ảnh đã có (${todo.length} món)`,
      onclick: async () => {
        let saved = 0;
        for (const f of todo) {
          try {
            await copyLessonImage(app, f, candidates.get(f.id)[0].img);
            saved++;
          } catch {
            // ảnh hỏng: bỏ qua, món đó vẫn dùng emoji
          }
        }
        toast(`Đã dùng lại ${saved} ảnh.`);
        reload();
      },
    }));
}

/** Ảnh lưới cho các món có sẵn CHƯA có ảnh: nhóm 9 món (3 × 3). Ô gán theo MÃ món, xem trước từng ô trước khi lưu. */
function gridSections(app, urls, images, reload) {
  return pendingGridSections(app, {
    id: FEED_FOOD_IMAGES, what: 'món', group: GRID_GROUP, urls, has: (w) => images.food.has(w.en),
    words: BUILTIN_FOODS.map((f) => ({ en: f.id, label: f.en, imagePrompt: f.draw })),
    promptNote: `\n${FOOD_PROMPT_NOTE}`, process: (tile) => cutOutSticker(tile.blob), onSaved: reload, previewClass: 'checker',
  });
}

function backgroundSection(app, reload) {
  const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      await setWordImage(app.db, { lessonId: FEED_BG_IMAGES, word: BG_KEY, ...await resizeImage(file) });
      toast('Đã lưu ảnh nền.');
      reload();
    } catch (err) {
      toast(imageErrorMessage(err), 4000);
    }
  });
  return section('🖼️ Ảnh nền (không bắt buộc)',
    h('p.muted', { text: 'Một ảnh bàn ăn / căn bếp nhạt màu, chừa trống giữa khung cho Bông. Khay đồ ăn luôn có nền trắng riêng nên món vẫn rõ.' }),
    h('div.actions', {},
      h('button.btn', { type: 'button', text: 'Copy prompt', onclick: () => copyText(BACKGROUND_PROMPT).then((ok) => toast(ok ? 'Đã copy prompt.' : 'Không copy được.')) }),
      h('button.btn', { type: 'button', text: 'Chọn ảnh nền', onclick: () => input.click() }),
      h('button.btn.danger', {
        type: 'button', text: 'Bỏ ảnh nền',
        onclick: async () => {
          await removeWordImage(app.db, FEED_BG_IMAGES, BG_KEY);
          reload();
        },
      })),
    input);
}

/** Thêm món riêng: tên Anh / Việt, loại, loại danh từ (+ a/an, số nhiều), ảnh (không bắt buộc). */
function addSection(app, reload) {
  const en = h('input', { type: 'text', placeholder: 'ví dụ: mango, soup, dumplings', autocomplete: 'off' });
  const vi = h('input', { type: 'text', placeholder: 'ví dụ: quả xoài', autocomplete: 'off' });
  const kind = h('select', {}, ...Object.entries(KIND_VI).map(([value, text]) => h('option', { value, text })));
  const grammar = h('select', {},
    h('option', { value: 'count', text: 'Đếm được: a mango / two mangoes' }),
    h('option', { value: 'mass', text: 'Không đếm được: some soup' }),
    h('option', { value: 'plural', text: 'Luôn số nhiều: some dumplings' }));
  const article = h('select', {}, h('option', { value: 'a', text: 'a' }), h('option', { value: 'an', text: 'an' }));
  const plural = h('input', { type: 'text', placeholder: 'ví dụ: mangoes', autocomplete: 'off' });
  const countBox = h('div', {}, field('Mạo từ', article), field('Số nhiều', plural));
  const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
  const sync = () => { countBox.hidden = grammar.value !== 'count'; };
  grammar.addEventListener('change', sync);
  en.addEventListener('input', () => {
    const w = en.value.trim().toLowerCase();
    article.value = /^[aeiou]/.test(w) ? 'an' : 'a';
    plural.placeholder = w ? `${w}s` : 'ví dụ: mangoes';
  });
  sync();

  const draft = () => {
    const word = en.value.trim().toLowerCase().replace(/\s+/g, ' ');
    return {
      id: `custom-${Date.now().toString(36)}`, en: word, vi: vi.value.trim(), kind: kind.value, grammar: grammar.value,
      ...(grammar.value === 'count' ? { article: article.value, plural: plural.value.trim().toLowerCase() || `${word}s` } : {}),
    };
  };
  const problem = (d) => {
    if (!/^[a-z][a-z '-]*$/.test(d.en)) return 'Tên tiếng Anh chỉ gồm chữ cái (a–z), dấu cách, dấu gạch.';
    if (!d.vi) return 'Nhập tên tiếng Việt.';
    if (d.kind === 'silly' && d.grammar !== 'count') return 'Đồ không ăn được cần là danh từ đếm được (a sock) để Bông nói "I can\'t eat a sock!".';
    if (!cleanCustomFoods([d]).length) return 'Món chưa hợp lệ.';
    return '';
  };
  const save = async (file) => {
    const d = draft();
    const err = problem(d);
    if (err) {
      toast(err, 4000);
      return;
    }
    try {
      if (file) {
        const small = await resizeImage(file);
        await setWordImage(app.db, { lessonId: FEED_FOOD_IMAGES, word: d.id, ...await cutOutSticker(small.blob) });
      }
      await app.setSetting('feedCustom', [...cleanCustomFoods(app.settings.feedCustom), d]);
      toast(`Đã thêm ${d.vi} (${d.en}).`);
      reload();
    } catch (e) {
      toast(imageErrorMessage(e), 4000);
    }
  };
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    input.value = '';
    if (file) save(file);
  });
  return section('＋ Thêm món',
    field('Tên tiếng Anh (bé nghe "I want a …!")', en),
    field('Tên tiếng Việt (phụ đề)', vi),
    field('Loại', kind),
    field('Loại danh từ', grammar, 'Để Bông nói đúng: "a mango", "some soup", "those are dumplings".'),
    countBox,
    h('div.actions', {},
      h('button.btn.primary', { type: 'button', text: 'Chọn ảnh & thêm', onclick: () => (problem(draft()) ? toast(problem(draft()), 4000) : input.click()) }),
      h('button.btn', { type: 'button', text: 'Thêm (dùng 🍽️)', onclick: () => save(null) })),
    input);
}

function shareSection(app, reload) {
  return mediaShareSection(app, {
    what: 'ảnh Cho Bông ăn',
    intro: 'Gửi ảnh món, ảnh Bông, ảnh nền và các món đã thêm sang máy khác (ảnh nằm trong file). Trên máy kia: Góc bố mẹ → Ảnh Cho Bông ăn → "Nhập từ file" (hoặc Quản lý bài → "Nhập bài từ file").',
    canMake: true,
    backup: { lessonIds: [FEED_FOOD_IMAGES, FEED_BONG_IMAGES, FEED_BG_IMAGES], settingsKeys: ['feedCustom'], filename: `cho-bong-an-${dayKey()}.zip` },
    accept: async (payload) => {
      const got = await acceptFeedPayload(app, payload);
      if (!got.images && !got.foods && !payload.settings?.some((s) => s.key === 'feedCustom')) throw new BackupError('File này không có ảnh Cho Bông ăn.');
      return `Đã nhận ${got.images} ảnh${got.foods ? `, thêm ${got.foods} món mới` : ''} (ảnh mới hơn thay ảnh cũ).`;
    },
    done: reload,
  });
}
