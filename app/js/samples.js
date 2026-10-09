// Bài mẫu có sẵn (SPEC mục 4.6, SPEC-v1.0 mục 11). Mỗi nhóm chỉ thêm một lần; có nút "Thêm lại bài mẫu".

import { parseLesson, createLessonRecord, baseTitle } from './lesson.js';
import { ensureLessonNumbers } from './db.js';

export const SAMPLE_FILES = ['lessons/animals.json', 'lessons/colors.json'];
export const PHRASE_SAMPLE_FILES = ['lessons/morning.json'];

/** Thêm các bài mẫu trong danh sách file. Trả về số bài đã thêm. */
async function addFrom(app, files) {
  let added = 0;
  const now = Date.now();
  for (const [i, file] of files.entries()) {
    try {
      const res = await fetch(file);
      const parsed = parseLesson(await res.text());
      if (!parsed.ok) continue;
      // Đánh số theo thứ tự tạo: Animals #01, Colors #02…
      const record = createLessonRecord(parsed.lesson, now - files.length + i);
      record.topic = baseTitle(parsed.lesson.title);
      await app.db.put('lessons', record);
      added++;
    } catch (err) {
      console.error('Không thêm được bài mẫu', file, err);
    }
  }
  await ensureLessonNumbers(app.db);
  return added;
}

/** Nút "Thêm lại bài mẫu": thêm lại cả bài từ vựng và bài câu mẫu. */
export async function addSampleLessons(app) {
  return (await addFrom(app, SAMPLE_FILES)) + (await addFrom(app, PHRASE_SAMPLE_FILES));
}

/** Lần chạy đầu: thêm bài mẫu. Bài câu mẫu có cờ riêng để máy đã dùng bản cũ vẫn nhận được. */
export async function seedSamplesOnce(app) {
  if (!app.settings.samplesSeeded) {
    if (await addFrom(app, SAMPLE_FILES)) await app.setSetting('samplesSeeded', true);
  }
  if (!app.settings.phraseSamplesSeeded) {
    if (await addFrom(app, PHRASE_SAMPLE_FILES)) await app.setSetting('phraseSamplesSeeded', true);
  }
}
