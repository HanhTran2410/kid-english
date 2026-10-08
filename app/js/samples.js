// 2 bài mẫu có sẵn (SPEC mục 4.6). Chỉ thêm một lần ở lần chạy đầu; có nút "Thêm lại bài mẫu".

import { parseLesson, createLessonRecord } from './lesson.js';

export const SAMPLE_FILES = ['lessons/animals.json', 'lessons/colors.json'];

/** Thêm bài mẫu vào máy. Trả về số bài đã thêm. */
export async function addSampleLessons(app) {
  let added = 0;
  const now = Date.now();
  for (const [i, file] of SAMPLE_FILES.entries()) {
    try {
      const res = await fetch(file);
      const parsed = parseLesson(await res.text());
      if (!parsed.ok) continue;
      // Bài đầu tiên hiện trước trong danh sách (mới nhất trước).
      await app.db.put('lessons', createLessonRecord(parsed.lesson, now - i));
      added++;
    } catch (err) {
      console.error('Không thêm được bài mẫu', file, err);
    }
  }
  return added;
}

export async function seedSamplesOnce(app) {
  if (app.settings.samplesSeeded) return;
  const added = await addSampleLessons(app);
  if (added) await app.setSetting('samplesSeeded', true);
}
