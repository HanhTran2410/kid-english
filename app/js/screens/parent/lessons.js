// Quản lý bài: xem, đổi tên, xóa, thêm/đổi ảnh từng từ, copy imagePrompt (SPEC 4.6).

import { h, toast, copyText, confirmDialog, formatDateTime } from '../../ui.js';

const IMPORT_LOG_MAX = 30;
import { listLessons, deleteLesson, setWordImage, removeWordImage, isQuotaError, mediaBlob, ensureLessonNumbers } from '../../db.js';
import { normalizeWord } from '../../text.js';
import { uniqueTitle, topicOf, formatLessonNo, lessonFileName } from '../../lesson.js';
import { isPhraseLesson, MOTION_NAMES, frameGroups, frameSteps, defaultFrameMapping, collectFrames, singlePhraseGroup } from '../../phrase.js';
import { buildFramesPrompt } from '../../prompts.js';
import { getFrameSets, setFrameSet, removeFrameSet, frameBlobs } from '../../db.js';
import { createFlipbook } from '../../player/flipbook.js';
import { createScene } from '../../player/scene.js';
import { speakButton } from './common.js';
import { resizeImage, sliceGrid, gridShape, loadGridImage, GRID_OPTIONS, ImageError } from '../../image.js';
import { addSampleLessons } from '../../samples.js';
import { buildGridImagePrompt } from '../../prompts.js';
import { createBackup, readBackup, applyBackup, BackupError } from '../../backup.js';
import { APP_VERSION } from '../../app.js';
import { parentLayout, goParent, section, notice } from './common.js';
import { lessonPreview } from './create.js';
import { saveFile } from './backup.js';

function imageErrorMessage(err) {
  if (err instanceof ImageError) return err.message;
  if (isQuotaError(err)) return 'Bộ nhớ đầy, không lưu được ảnh. Hãy xóa bớt ghi âm cũ.';
  return 'Không đọc được ảnh này, hãy chọn ảnh khác.';
}

export function lessonsView(app) {
  const body = parentLayout(app, { title: 'Quản lý bài', back: () => goParent(app) });
  const list = h('ul.lesson-admin-list');
  const importInput = h('input', { type: 'file', accept: '.zip,application/zip', hidden: true });
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      const payload = await readBackup(file);
      if (!payload.lessons.length) throw new BackupError('File này không có bài học nào.');
      const existing = await listLessons(app.db);
      const before = new Set(existing.map((l) => l.id));
      // Bài mới trùng tên với bài đang có thì đặt tên "… 2", "… 3".
      const titles = existing.map((l) => l.title);
      for (const l of payload.lessons) {
        if (before.has(l.id)) continue;
        l.title = uniqueTitle(l.title, titles);
        titles.push(l.title);
      }
      // Chỉ lấy bài và ảnh; không đụng tới tiến độ, sticker, cài đặt, ghi âm của máy này.
      // Bài đã có trên máy này (cùng bài, chia sẻ lại sau khi sửa) thì cập nhật nội dung và ảnh mới hơn.
      const { added, updated } = await applyBackup(app.db,
        { ...payload, recordings: [], progress: [], stickers: [], settings: [] }, 'merge', { updateLessons: true });
      await ensureLessonNumbers(app.db);
      const parts = [];
      if (added) parts.push(`nhập ${added} bài mới`);
      if (updated) parts.push(`cập nhật ${updated} bài đã có`);
      const summary = parts.length ? `Đã ${parts.join(', ')}` : 'Không có gì thay đổi';
      toast(`${summary}.`, 3500);
      // Ghi lại đã nhập file nào, để biết file nào nhập rồi / chưa nhập.
      const entry = {
        file: file.name,
        at: Date.now(),
        summary,
        lessons: payload.lessons.map((l) => `${l.no ? `#${formatLessonNo(l.no)} ` : ''}${l.title}`),
      };
      await app.setSetting('importLog', [entry, ...(app.settings.importLog ?? [])].slice(0, IMPORT_LOG_MAX));
      goParent(app, 'lessons');
    } catch (err) {
      toast(err instanceof BackupError ? err.message : 'Không đọc được file bài học.', 4000);
    }
  });
  body.append(
    notice('info', 'Tạo bài và thêm ảnh trên máy tính (mở cùng link app), bấm "Chia sẻ bài" để xuất file, gửi sang iPhone/iPad (AirDrop, iCloud, Zalo…) rồi bấm "Nhập bài từ file" ở đây.'),
    section(null, list), h('div.actions', {},
    h('button.btn.primary', { type: 'button', text: 'Nhập bài từ file', onclick: () => importInput.click() }),
    importInput,
    h('button.btn', {
      type: 'button',
      text: 'Thêm lại bài mẫu',
      onclick: async () => {
        const n = await addSampleLessons(app);
        toast(`Đã thêm ${n} bài mẫu.`);
        goParent(app, 'lessons');
      },
    })));

  const log = app.settings.importLog ?? [];
  if (log.length) {
    body.append(section('Đã nhập gần đây', h('ul.import-log', {}, ...log.map((e) => h('li', {},
      h('b', { text: e.file }),
      h('span.muted', { text: ` · ${formatDateTime(e.at)} · ${e.summary}` }),
      e.lessons?.length ? h('div.muted', { text: e.lessons.join(', ') }) : null)))));
  }

  listLessons(app.db).then((lessons) => {
    if (!lessons.length) list.append(h('li', { text: 'Chưa có bài nào. Vào "Tạo bài học" để tạo bài đầu tiên.' }));
    for (const l of lessons) {
      list.append(h('li', {}, h('button.lesson-row', { type: 'button', onclick: () => goParent(app, 'lesson', { lessonId: l.id }) },
        h('span.lesson-no', { text: `#${formatLessonNo(l.no)}` }),
        h('span.p-emoji', { text: l.emoji }),
        h('span.grow', {}, h('b', { text: l.title }),
          h('span.lesson-meta', { text: `${isPhraseLesson(l) ? '💬 Câu nói' : '📚 Từ vựng'} · ${topicOf(l)} · ${isPhraseLesson(l) ? `${l.phrases.length} câu` : `${l.words.length} từ`} · học xong ${l.timesCompleted ?? 0} lần · ${formatDateTime(l.createdAt).slice(0, 10)}` })))));
    }
  });
}

export function lessonDetailView(app, { lessonId }) {
  const body = parentLayout(app, { title: 'Bài học', back: () => goParent(app, 'lessons') });
  const urls = [];

  (async () => {
    const lesson = await app.db.get('lessons', lessonId);
    if (!lesson) {
      goParent(app, 'lessons');
      return;
    }
    const images = await app.db.getAllByIndex('images', 'lessonId', lesson.id);
    const imageOf = (en) => images.find((img) => img.word === normalizeWord(en));

    // Đổi tên và chủ đề
    const rename = renameSection(app, lesson);
    if (isPhraseLesson(lesson)) {
      const frameSets = await getFrameSets(app.db, lesson.id);
      body.append(...phraseDetailSections(app, lesson, frameSets, urls), shareSection(app, lesson), section(null, deleteButton(app, lesson)));
      return;
    }
    // Ảnh từng từ
    const rows = lesson.words.map((w) => {
      const img = imageOf(w.en);
      let thumb;
      if (img) {
        const url = URL.createObjectURL(mediaBlob(img));
        urls.push(url);
        thumb = h('img.thumb', { src: url, alt: w.en });
      } else {
        thumb = h('span.thumb.emoji', { text: w.emoji });
      }
      const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const resized = await resizeImage(file);
          await setWordImage(app.db, { lessonId: lesson.id, word: w.en, ...resized });
          toast(`Đã thêm ảnh cho "${w.en}".`);
          goParent(app, 'lesson', { lessonId });
        } catch (err) {
          toast(imageErrorMessage(err), 4000);
        }
      });
      return h('li.word-admin', {},
        thumb,
        h('span.grow', {}, h('b', { text: w.en }), h('span.muted', { text: ` ${w.vi}` })),
        h('div.row-actions', {},
          h('button.btn.small', { type: 'button', text: img ? 'Đổi ảnh' : 'Chọn ảnh', onclick: () => input.click() }),
          img ? h('button.btn.small', {
            type: 'button',
            text: 'Xóa ảnh',
            onclick: async () => {
              await removeWordImage(app.db, lesson.id, w.en);
              goParent(app, 'lesson', { lessonId });
            },
          }) : null,
          w.imagePrompt ? h('button.btn.small', {
            type: 'button',
            text: 'Copy prompt ảnh',
            onclick: async () => toast((await copyText(w.imagePrompt)) ? 'Đã copy prompt tạo ảnh.' : 'Không copy được.'),
          }) : null),
        input);
    });

    const remove = deleteButton(app, lesson);

    const preview = h('details', {}, h('summary', { text: 'Xem nội dung bài' }), lessonPreview(app, lesson));

    body.append(
      rename,
      gridSection(app, lesson, urls),
      section('Ảnh cho từng từ',
        notice('info', 'Hoặc tạo từng hình (bấm "Copy prompt ảnh"), lưu vào Ảnh của máy, rồi bấm "Chọn ảnh". Không có ảnh thì bé thấy emoji.'),
        h('ul.word-admin-list', {}, ...rows)),
      preview,
      shareSection(app, lesson),
      section(null, remove));
  })();

  return () => urls.forEach((u) => URL.revokeObjectURL(u));
}

/**
 * Ảnh lưới: AI vẽ 1 ảnh cho cả bài, app cắt ra từng ô.
 * AI hay vẽ sai số cột/hàng, xếp lộn thứ tự hoặc vẽ thừa ô, nên: app tự đoán lưới thật trong ảnh,
 * bố mẹ chọn lại được kiểu lưới, và chọn từ cho từng ô (ô thừa thì bỏ qua).
 */
function gridSection(app, lesson, urls) {
  const words = lesson.words.map((w) => w.en);
  const expected = gridShape(words.length);
  const prompt = buildGridImagePrompt(lesson.words, expected);
  const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
  const previewBox = h('div.grid-preview');
  const SKIP = '';
  const shapeKey = ({ cols, rows }) => `${cols}x${rows}`;

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    previewBox.replaceChildren(h('p.muted', { text: 'Đang đọc ảnh…' }));
    let image;
    try {
      image = await loadGridImage(file);
    } catch (err) {
      previewBox.replaceChildren(notice('error', imageErrorMessage(err)));
      return;
    } finally {
      input.value = '';
    }

    const options = [...GRID_OPTIONS];
    if (image.detected && !options.some((o) => shapeKey(o) === shapeKey(image.detected))) options.push(image.detected);
    const shapeSel = h('select', { 'aria-label': 'Kiểu lưới' }, ...options.map((o) => h('option', {
      value: shapeKey(o),
      text: `${o.cols} cột × ${o.rows} hàng${image.detected && shapeKey(o) === shapeKey(image.detected) ? ' (app đoán)' : ''}`,
    })));
    shapeSel.value = shapeKey(image.detected ?? expected);
    const cellsBox = h('div.grid-cells');
    let tiles = [];
    let pickers = [];

    const render = async () => {
      const [cols, rows] = shapeSel.value.split('x').map(Number);
      cellsBox.replaceChildren(h('p.muted', { text: 'Đang cắt ảnh…' }));
      try {
        tiles = await sliceGrid(image, { cols, rows });
      } catch (err) {
        cellsBox.replaceChildren(notice('error', imageErrorMessage(err)));
        return;
      }
      cellsBox.style.setProperty('--cols', String(cols));
      pickers = tiles.map((t, i) => {
        const sel = h('select', { 'aria-label': `Từ cho ô ${i + 1}` },
          h('option', { value: SKIP, text: '— bỏ qua —' }),
          ...words.map((w) => h('option', { value: w, text: w })));
        sel.value = words[i] ?? SKIP; // mặc định theo thứ tự; ô thừa thì bỏ qua
        return sel;
      });
      cellsBox.replaceChildren(...tiles.map((t, i) => {
        const url = URL.createObjectURL(t.blob);
        urls.push(url);
        return h('figure.grid-cell', {}, h('img', { src: url, alt: `Ô ${i + 1}` }), pickers[i]);
      }));
    };
    shapeSel.addEventListener('change', render);

    const save = async () => {
      const chosen = pickers.map((p, i) => [p.value, tiles[i]]).filter(([w]) => w !== SKIP);
      const dup = chosen.map(([w]) => w).find((w, i, all) => all.indexOf(w) !== i);
      if (dup) {
        toast(`Từ "${dup}" đang được chọn cho 2 ô. Hãy chọn lại.`, 4000);
        return;
      }
      if (!chosen.length) {
        toast('Chưa chọn từ cho ô nào.');
        return;
      }
      try {
        for (const [word, t] of chosen) await setWordImage(app.db, { lessonId: lesson.id, word, ...t });
        toast(`Đã lưu ${chosen.length} ảnh.`);
        goParent(app, 'lesson', { lessonId: lesson.id });
      } catch (err) {
        toast(imageErrorMessage(err), 4000);
      }
    };

    previewBox.replaceChildren(
      notice('info', 'Kiểm tra từng ô: nếu ảnh bị cắt lệch thì đổi "Kiểu lưới" cho đúng với ảnh. Mỗi ô chọn đúng từ; ô vẽ thừa thì chọn "— bỏ qua —".'),
      h('label.field', {}, h('span.field-label', { text: 'Kiểu lưới' }), shapeSel),
      cellsBox,
      h('div.actions', {},
        h('button.btn.primary', { type: 'button', text: 'Lưu các ảnh này', onclick: save }),
        h('button.btn', { type: 'button', text: 'Hủy', onclick: () => previewBox.replaceChildren() })));
    await render();
  });

  return section(`Ảnh lưới — 1 ảnh cho cả bài (${expected.cols}×${expected.rows} ô)`,
    notice('info', 'Bản AI miễn phí giới hạn số lần tạo ảnh. Cách này chỉ cần 1 lần: bấm "Copy prompt ảnh lưới", dán vào ChatGPT/Gemini, lưu ảnh về máy, rồi bấm "Chọn ảnh lưới" — app tự cắt ra từng ô, bố mẹ kiểm tra rồi lưu.'),
    h('div.actions', {},
      h('button.btn', {
        type: 'button',
        text: 'Copy prompt ảnh lưới',
        onclick: () => copyText(prompt).then((ok) => toast(ok ? 'Đã copy prompt ảnh lưới.' : 'Không copy được.')),
      }),
      h('button.btn.primary', { type: 'button', text: 'Chọn ảnh lưới', onclick: () => input.click() })),
    input,
    previewBox);
}

/** Chia sẻ bài (kèm ảnh) sang máy khác. 2 bước vì iOS chỉ cho mở bảng Chia sẻ ngay sau một lần chạm. */
function shareSection(app, lesson) {
  const status = h('p.muted');
  let made = null;
  const sendBtn = h('button.btn.primary', {
    type: 'button',
    text: '2. Gửi file',
    hidden: true,
    onclick: async () => {
      if (made && await saveFile(made.blob, made.filename)) toast('Đã xuất file bài học.');
    },
  });
  const makeBtn = h('button.btn', {
    type: 'button',
    text: '1. Tạo file bài',
    onclick: async () => {
      makeBtn.disabled = true;
      try {
        made = await createBackup(app.db, { lessonIds: [lesson.id], appVersion: APP_VERSION });
        status.textContent = `Đã tạo ${made.filename}. Bấm "Gửi file" để lưu vào Files/iCloud hoặc gửi AirDrop, Zalo…`;
        sendBtn.hidden = false;
      } catch (err) {
        console.error(err);
        status.textContent = 'Không tạo được file bài học.';
      } finally {
        makeBtn.disabled = false;
      }
    },
  });
  return section('Chia sẻ bài sang máy khác',
    h('p', { text: `File ${lessonFileName(lesson)} gồm nội dung bài và ảnh (không có ghi âm, tiến độ của bé). Trên máy kia: Góc bố mẹ → Quản lý bài → "Nhập bài từ file".` }),
    h('div.actions', {}, makeBtn, sendBtn),
    status);
}

/** Đổi số bài, tên bài, chủ đề (dùng chung cho bài từ vựng và bài câu). */
function renameSection(app, lesson) {
  const name = h('input', { type: 'text', value: lesson.title, 'aria-label': 'Tên bài' });
  const noInput = h('input', { type: 'number', min: '1', max: '999', value: String(lesson.no ?? ''), 'aria-label': 'Số bài' });
  const topicInput = h('input', { type: 'text', value: topicOf(lesson), 'aria-label': 'Chủ đề' });
  return section('Tên bài và chủ đề',
    h('label.field', {}, h('span.field-label', { text: 'Số bài (đứng đầu tên file khi chia sẻ)' }), noInput),
    h('label.field', {}, h('span.field-label', { text: 'Tên bài' }), name),
    h('label.field', {}, h('span.field-label', { text: 'Chủ đề (tab ở danh sách bài của bé)' }), topicInput),
    h('button.btn', {
      type: 'button',
      text: 'Lưu',
      onclick: async () => {
        const title = name.value.trim();
        if (!title) return;
        const others = (await listLessons(app.db)).filter((l) => l.id !== lesson.id).map((l) => l.title);
        lesson.title = uniqueTitle(title, others);
        lesson.topic = topicInput.value.trim();
        if (Number(noInput.value) > 0) lesson.no = Math.round(Number(noInput.value));
        lesson.updatedAt = Date.now();
        await app.db.put('lessons', lesson);
        name.value = lesson.title;
        toast(lesson.title === title ? 'Đã lưu.' : `Tên đã có, lưu thành "${lesson.title}".`);
      },
    }));
}

function deleteButton(app, lesson) {
  return h('button.btn.danger', {
    type: 'button',
    text: 'Xóa bài này',
    onclick: async () => {
      const ok = await confirmDialog(
        `Xóa bài "${lesson.title}"? Ảnh và ghi âm của bài cũng bị xóa. Tiến độ vẫn được giữ.`,
        { okText: 'Xóa bài', danger: true },
      );
      if (!ok) return;
      await deleteLesson(app.db, lesson.id);
      toast('Đã xóa bài.');
      goParent(app, 'lessons');
    },
  });
}

/** Trang bài câu (SPEC-v1.0 mục 6.3): xem trước từng câu, đổi hiệu ứng, "Câu dùng trong ngày". */
function phraseDetailSections(app, lesson, frameSets, urls) {
  const reload = () => goParent(app, 'lesson', { lessonId: lesson.id });
  const rows = lesson.phrases.map((p, i) => {
    const set = frameSets.get(p.id);
    let scene;
    if (set) {
      const list = frameBlobs(set).map((b) => URL.createObjectURL(b));
      urls.push(...list);
      scene = createFlipbook(list, { small: true });
    } else {
      scene = createScene({ emoji: p.emoji, motion: p.motion, small: true });
    }
    const sceneBox = h('div.scene-box', {}, scene.el);
    const motionSel = h('select', { 'aria-label': `Hiệu ứng của câu ${i + 1}` },
      ...MOTION_NAMES.map((m) => h('option', { value: m, text: m, selected: m === p.motion })));
    motionSel.addEventListener('change', async () => {
      p.motion = motionSel.value;
      lesson.updatedAt = Date.now();
      await app.db.put('lessons', lesson);
      scene = createScene({ emoji: p.emoji, motion: p.motion, small: true });
      sceneBox.replaceChildren(scene.el);
      scene.play(1);
      toast(scene.motion === p.motion ? 'Đã đổi hiệu ứng.' : `Hiệu ứng "${p.motion}" cần emoji của vật, đang hiện "${scene.motion}".`, 2500);
    });
    return h('li.phrase-admin', {},
      sceneBox,
      h('div.grow', {},
        h('b', { text: p.en }), speakButton(app, p.en),
        h('div.muted', { text: p.vi }),
        set
          ? h('div.row', {},
            h('span.field-hint', { text: `🎞️ ${set.frames.length} khung hình` }),
            h('button.btn.small', { type: 'button', text: '▶ Xem', onclick: () => scene.play(1) }),
            h('button.btn.small', {
              type: 'button',
              text: 'Xóa khung hình',
              onclick: async () => {
                if (!(await confirmDialog(`Xóa khung hình của câu "${p.en}"? Câu sẽ dùng lại hình Bông + emoji.`, { okText: 'Xóa', danger: true }))) return;
                await removeFrameSet(app.db, lesson.id, p.id);
                reload();
              },
            }))
          : h('div.row', {},
            h('span.field-hint', { text: 'Hiệu ứng:' }), motionSel,
            h('button.btn.small', { type: 'button', text: '▶ Xem', onclick: () => scene.play(1) }))));
  });

  const daily = lesson.phrases.map((p) => `${p.en} — ${p.vi}`).join('\n');
  return [
    renameSection(app, lesson),
    section(`Các câu (${lesson.phrases.length})${lesson.routine ? ' — theo thứ tự trong ngày' : ''}`,
      h('ul.phrase-admin-list', {}, ...rows)),
    framesSection(app, lesson, urls),
    section('Câu dùng trong ngày',
      h('p.field-hint', { text: 'Bố mẹ nói đúng các câu này khi bé làm thật (lúc mặc áo, rửa mặt…) để bé nhớ lâu.' }),
      h('pre.daily-phrases', { text: daily }),
      h('button.btn.small', {
        type: 'button',
        text: 'Copy',
        onclick: () => copyText(daily).then((ok) => toast(ok ? 'Đã copy.' : 'Không copy được.')),
      })),
  ];
}

/**
 * Khung hình (flipbook) cho bài câu (SPEC-v1.0 mục 2.3): AI vẽ 1 ảnh lưới, mỗi hàng 1 câu, mỗi cột 1 bước;
 * app cắt ảnh, bố mẹ gán ô ↔ câu/bước, xem trước flipbook rồi mới lưu.
 */
function framesSection(app, lesson, urls) {
  const groups = frameGroups(lesson);
  const makeBlock = (group, title) => {
    const prompt = buildFramesPrompt(group.phrases.map((p) => ({ en: p.en, steps: frameSteps(p), scene: p.frameScene })));
    const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
    const work = h('div.grid-preview');

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      work.replaceChildren(h('p.muted', { text: 'Đang đọc ảnh…' }));
      let image;
      try {
        image = await loadGridImage(file);
      } catch (err) {
        work.replaceChildren(notice('error', imageErrorMessage(err)));
        return;
      } finally {
        input.value = '';
      }
      const key = ({ cols, rows }) => `${cols}x${rows}`;
      const options = [...GRID_OPTIONS];
      if (image.detected && !options.some((o) => key(o) === key(image.detected))) options.push(image.detected);
      if (!options.some((o) => key(o) === key(group.shape))) options.push(group.shape);
      const shapeSel = h('select', { 'aria-label': 'Kiểu lưới khung hình' }, ...options.map((o) => h('option', {
        value: key(o),
        text: `${o.cols} cột × ${o.rows} hàng${image.detected && key(o) === key(image.detected) ? ' (app đoán)' : ''}`,
      })));
      shapeSel.value = key(image.detected ?? group.shape);
      const cellsBox = h('div.grid-cells');
      const previewBox = h('div.flip-previews');
      const choices = [['', '— bỏ qua —'], ...group.phrases.flatMap((p, r) => frameSteps(p).map((_, c) => [`${p.id}:${c}`, `Câu ${group.from + r}·B${c + 1}`]))];
      let tiles = [];
      let pickers = [];
      let tileUrls = [];

      const renderPreview = () => {
        const { ok, duplicate, sets } = collectFrames(pickers.map((p) => p.value), tileUrls);
        if (!ok) {
          previewBox.replaceChildren(notice('error', `"${choices.find(([v]) => v === duplicate)?.[1]}" đang được chọn cho 2 ô.`));
          return;
        }
        previewBox.replaceChildren(...group.phrases.filter((p) => sets.has(p.id)).map((p) => {
          const fb = createFlipbook(sets.get(p.id), { small: true });
          return h('div.flip-preview', {}, fb.el, h('div', { text: p.en }),
            h('button.btn.small', { type: 'button', text: '▶ Xem', onclick: () => fb.play(1) }));
        }));
      };

      const render = async () => {
        const [cols, rows] = shapeSel.value.split('x').map(Number);
        cellsBox.replaceChildren(h('p.muted', { text: 'Đang cắt ảnh…' }));
        try {
          tiles = await sliceGrid(image, { cols, rows });
        } catch (err) {
          cellsBox.replaceChildren(notice('error', imageErrorMessage(err)));
          return;
        }
        tileUrls = tiles.map((t) => URL.createObjectURL(t.blob));
        urls.push(...tileUrls);
        const defaults = defaultFrameMapping(group, { cols, rows });
        pickers = tiles.map((_, i) => {
          const sel = h('select', { 'aria-label': `Khung cho ô ${i + 1}` }, ...choices.map(([v, t]) => h('option', { value: v, text: t })));
          sel.value = defaults[i] ?? '';
          sel.addEventListener('change', renderPreview);
          return sel;
        });
        cellsBox.style.setProperty('--cols', String(cols));
        cellsBox.replaceChildren(...tiles.map((_, i) => h('figure.grid-cell', {}, h('img', { src: tileUrls[i], alt: `Ô ${i + 1}` }), pickers[i])));
        renderPreview();
      };
      shapeSel.addEventListener('change', render);

      const save = async () => {
        const { ok, duplicate, sets } = collectFrames(pickers.map((p) => p.value), tiles);
        if (!ok) {
          toast(`"${choices.find(([v]) => v === duplicate)?.[1]}" đang được chọn cho 2 ô. Hãy chọn lại.`, 4000);
          return;
        }
        if (!sets.size) {
          toast('Chưa gán ô nào cho câu nào.');
          return;
        }
        try {
          for (const [phraseId, frames] of sets) await setFrameSet(app.db, { lessonId: lesson.id, phraseId, frames });
          toast(`Đã lưu khung hình cho ${sets.size} câu.`);
          goParent(app, 'lesson', { lessonId: lesson.id });
        } catch (err) {
          toast(imageErrorMessage(err), 4000);
        }
      };

      work.replaceChildren(
        notice('info', 'Mỗi hàng là một câu, mỗi cột là một bước (B1, B2, B3). Kiểm tra từng ô; ô vẽ thừa chọn "— bỏ qua —". Xem trước flipbook bên dưới rồi bấm Lưu.'),
        h('label.field', {}, h('span.field-label', { text: 'Kiểu lưới' }), shapeSel),
        cellsBox,
        h('h3', { text: 'Xem trước' }),
        previewBox,
        h('div.actions', {},
          h('button.btn.primary', { type: 'button', text: 'Lưu khung hình', onclick: save }),
          h('button.btn', { type: 'button', text: 'Hủy', onclick: () => work.replaceChildren() })));
      await render();
    });

    return h('div.frames-group', {},
      h('b', { text: `${title} → lưới ${group.shape.cols} cột × ${group.shape.rows} hàng` }),
      h('div.actions', {},
        h('button.btn', {
          type: 'button',
          text: 'Copy prompt khung hình',
          onclick: () => copyText(prompt).then((ok) => toast(ok ? 'Đã copy prompt khung hình.' : 'Không copy được.')),
        }),
        h('button.btn.primary', { type: 'button', text: 'Chọn ảnh khung hình', onclick: () => input.click() })),
      input,
      work);
  };

  const blocks = groups.map((group) => makeBlock(group,
    groups.length > 1 ? `Ảnh ${group.index + 1}: câu ${group.from}–${group.to}` : `Cả bài: ${group.phrases.length} câu`));
  const single = lesson.phrases.map((p, i) => makeBlock(singlePhraseGroup(lesson, i), `Câu ${i + 1}: ${p.en}`));

  return section('Khung hình (flipbook) — Bông làm hành động',
    notice('info', 'Bấm "Copy prompt khung hình", dán vào ChatGPT/Gemini để vẽ 1 ảnh lưới (mỗi hàng là một câu, 3 bước, Bông vẽ cả người). Lưu ảnh về máy rồi bấm "Chọn ảnh khung hình": app cắt ra và phát như phim hoạt hình khi bé học. Câu chưa có khung hình thì dùng hình Bông + emoji.'),
    ...blocks,
    h('details.frames-single', {},
      h('summary', { text: 'Làm từng câu (mỗi câu 1 ảnh 3 khung — AI dễ vẽ đúng hơn)' }),
      notice('info', 'Dùng khi ảnh cả bài bị sai hoặc chỉ muốn làm lại một câu. Lưu khung của câu nào thì chỉ thay khung câu đó.'),
      ...single));
}
