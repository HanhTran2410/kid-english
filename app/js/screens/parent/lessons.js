// Quản lý bài: xem, đổi tên, xóa, thêm/đổi ảnh từng từ, copy imagePrompt (SPEC 4.6).

import { h, toast, copyText, confirmDialog, formatDateTime } from '../../ui.js';

const IMPORT_LOG_MAX = 30;
import { listLessons, deleteLesson, setWordImage, removeWordImage, isQuotaError, mediaBlob, ensureLessonNumbers } from '../../db.js';
import { normalizeWord } from '../../text.js';
import { uniqueTitle, topicOf, formatLessonNo, lessonFileName } from '../../lesson.js';
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
          h('span.lesson-meta', { text: `${topicOf(l)} · ${l.words.length} từ · học xong ${l.timesCompleted ?? 0} lần · ${formatDateTime(l.createdAt).slice(0, 10)}` })))));
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
    const name = h('input', { type: 'text', value: lesson.title, 'aria-label': 'Tên bài' });
    const noInput = h('input', { type: 'number', min: '1', max: '999', value: String(lesson.no ?? ''), 'aria-label': 'Số bài' });
    const topicInput = h('input', { type: 'text', value: topicOf(lesson), 'aria-label': 'Chủ đề' });
    const rename = section('Tên bài và chủ đề',
      h('label.field', {}, h('span.field-label', { text: 'Số bài (đứng đầu tên file khi chia sẻ)' }), noInput),
      h('label.field', {}, h('span.field-label', { text: 'Tên bài' }), name),
      h('label.field', {}, h('span.field-label', { text: 'Chủ đề (tab ở màn hình Bài học của bé)' }), topicInput),
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

    const remove = h('button.btn.danger', {
      type: 'button',
      text: 'Xóa bài này',
      onclick: async () => {
        const ok = await confirmDialog(
          `Xóa bài "${lesson.title}"? Ảnh và ghi âm của bài cũng bị xóa. Tiến độ các từ vẫn được giữ.`,
          { okText: 'Xóa bài', danger: true },
        );
        if (!ok) return;
        await deleteLesson(app.db, lesson.id);
        toast('Đã xóa bài.');
        goParent(app, 'lessons');
      },
    });

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
