// Quản lý bài: xem, đổi tên, xóa, thêm/đổi ảnh từng từ, copy imagePrompt (SPEC 4.6).

import { h, toast, copyText, confirmDialog, formatDateTime } from '../../ui.js';
import { listLessons, deleteLesson, setWordImage, removeWordImage, isQuotaError } from '../../db.js';
import { normalizeWord } from '../../text.js';
import { resizeImage, ImageError } from '../../image.js';
import { addSampleLessons } from '../../samples.js';
import { parentLayout, goParent, section, notice } from './common.js';
import { lessonPreview } from './create.js';

export function lessonsView(app) {
  const body = parentLayout(app, { title: 'Quản lý bài', back: () => goParent(app) });
  const list = h('ul.lesson-admin-list');
  body.append(section(null, list), h('div.actions', {},
    h('button.btn', {
      type: 'button',
      text: 'Thêm lại bài mẫu',
      onclick: async () => {
        const n = await addSampleLessons(app);
        toast(`Đã thêm ${n} bài mẫu.`);
        goParent(app, 'lessons');
      },
    })));

  listLessons(app.db).then((lessons) => {
    if (!lessons.length) list.append(h('li', { text: 'Chưa có bài nào. Vào "Tạo bài học" để tạo bài đầu tiên.' }));
    for (const l of lessons) {
      list.append(h('li', {}, h('button.lesson-row', { type: 'button', onclick: () => goParent(app, 'lesson', { lessonId: l.id }) },
        h('span.p-emoji', { text: l.emoji }),
        h('span.grow', {}, h('b', { text: l.title }), h('span.muted', { text: ` · ${l.words.length} từ · học xong ${l.timesCompleted ?? 0} lần` })),
        h('span.muted', { text: formatDateTime(l.createdAt) }))));
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

    // Đổi tên
    const name = h('input', { type: 'text', value: lesson.title });
    const rename = section('Tên bài', h('div.row', {}, name, h('button.btn', {
      type: 'button',
      text: 'Lưu tên',
      onclick: async () => {
        const title = name.value.trim();
        if (!title) return;
        lesson.title = title;
        await app.db.put('lessons', lesson);
        toast('Đã đổi tên.');
      },
    })));

    // Ảnh từng từ
    const rows = lesson.words.map((w) => {
      const img = imageOf(w.en);
      let thumb;
      if (img) {
        const url = URL.createObjectURL(img.blob);
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
          if (err instanceof ImageError) toast(err.message, 4000);
          else if (isQuotaError(err)) toast('Bộ nhớ đầy, không lưu được ảnh. Hãy xóa bớt ghi âm cũ.', 4000);
          else toast('Không đọc được ảnh này, hãy chọn ảnh khác.', 4000);
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
      section('Ảnh cho từng từ',
        notice('info', 'Tạo hình bằng ChatGPT/Gemini (bấm "Copy prompt ảnh"), lưu vào Ảnh của máy, rồi bấm "Chọn ảnh". Không có ảnh thì bé thấy emoji.'),
        h('ul.word-admin-list', {}, ...rows)),
      preview,
      section(null, remove));
  })();

  return () => urls.forEach((u) => URL.revokeObjectURL(u));
}
