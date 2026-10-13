// Bài mẫu có sẵn (SPEC mục 4.6, SPEC-v1.0 mục 11). Mỗi nhóm chỉ thêm một lần; có nút "Thêm lại bài mẫu".

import { parseLesson, createLessonRecord, baseTitle } from './lesson.js';
import { ensureLessonNumbers } from './db.js';
import { builtInNumberLessons } from './numbers.js';
import { builtInPhonicsLessons } from './phonics.js';

export const SAMPLE_FILES = ['lessons/animals.json', 'lessons/colors.json'];
export const PHRASE_SAMPLE_FILES = ['lessons/morning.json', 'lessons/actions.json'];

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

/** Bài số có sẵn trong app (SPEC-numbers mục 7, 14), không cần tải file. `only`: chỉ thêm các bài có mã này. */
async function addNumberLessons(app, only = null) {
  const now = Date.now();
  const list = builtInNumberLessons().filter((l) => !only || only.includes(l.builtin));
  for (const [i, lesson] of list.entries()) {
    await app.db.put('lessons', createLessonRecord(lesson, now - list.length + i));
  }
  await ensureLessonNumbers(app.db);
  return list.length;
}

/** Bài phonics có sẵn (SPEC-phonics mục 4). `only`: chỉ thêm các bài có mã này. */
async function addPhonicsLessons(app, only = null) {
  const now = Date.now();
  const list = builtInPhonicsLessons().filter((l) => !only || only.includes(l.builtin));
  for (const [i, lesson] of list.entries()) {
    await app.db.put('lessons', createLessonRecord(lesson, now - list.length + i));
  }
  await ensureLessonNumbers(app.db);
  return list.length;
}

/** Nút "Thêm lại bài mẫu": thêm lại bài từ vựng, bài câu, bài số và bài phonics mẫu. */
export async function addSampleLessons(app) {
  return (await addFrom(app, SAMPLE_FILES)) + (await addFrom(app, PHRASE_SAMPLE_FILES)) + (await addNumberLessons(app))
    + (await addPhonicsLessons(app));
}

/** Lần chạy đầu: thêm bài mẫu. Bài câu mẫu có cờ riêng để máy đã dùng bản cũ vẫn nhận được. */
export async function seedSamplesOnce(app) {
  if (!app.settings.samplesSeeded) {
    if (await addFrom(app, SAMPLE_FILES)) await app.setSetting('samplesSeeded', true);
  }
  // Bài câu mẫu: mỗi file chỉ tự thêm MỘT lần (bố mẹ xóa rồi thì không tự thêm lại). Máy đã có bài Morning từ bản cũ
  // (cờ phraseSamplesSeeded) chỉ nhận bài mẫu mới (Actions).
  const phraseSeeded = app.settings.phraseSamplesAdded
    ?? (app.settings.phraseSamplesSeeded ? ['lessons/morning.json'] : []);
  const newPhraseFiles = PHRASE_SAMPLE_FILES.filter((f) => !phraseSeeded.includes(f));
  if (newPhraseFiles.length && await addFrom(app, newPhraseFiles)) {
    await app.setSetting('phraseSamplesAdded', [...phraseSeeded, ...newPhraseFiles]);
  }
  // Bài số: mỗi bài có sẵn chỉ tự thêm MỘT lần (bố mẹ xóa rồi thì không tự thêm lại).
  // Máy đã có bài số từ bản 0.3 (cờ cũ numberSamplesSeeded) coi như đã thêm bài 1–10 và trò chơi → chỉ nhận bài 11–20.
  const seeded = app.settings.numberLessonsSeeded
    ?? (app.settings.numberSamplesSeeded ? ['count-1-10', 'game-1-10'] : []);
  const missing = builtInNumberLessons().map((l) => l.builtin).filter((id) => !seeded.includes(id));
  if (missing.length) {
    try {
      await addNumberLessons(app, missing);
      await app.setSetting('numberLessonsSeeded', [...seeded, ...missing]);
    } catch (err) {
      console.error('Không thêm được bài số', err);
    }
  }
  // Bài phonics: mỗi bài có sẵn chỉ tự thêm MỘT lần.
  const phonicsSeeded = app.settings.phonicsLessonsSeeded ?? [];
  const newPhonics = builtInPhonicsLessons().map((l) => l.builtin).filter((id) => !phonicsSeeded.includes(id));
  if (newPhonics.length) {
    try {
      await addPhonicsLessons(app, newPhonics);
      await app.setSetting('phonicsLessonsSeeded', [...phonicsSeeded, ...newPhonics]);
    } catch (err) {
      console.error('Không thêm được bài phonics', err);
    }
  }
}

/**
 * Bài phonics có sẵn đã có trên máy từ bản cũ: cập nhật danh sách từ và âm mục tiêu theo dữ liệu mới của app
 * (ví dụ bỏ "orange" khỏi chữ O). Giữ nguyên tên, số bài, chỗ học dở, số lần học; chỉ bài có mã `builtin`.
 */
export async function upgradePhonicsLessons(app) {
  const fresh = new Map(builtInPhonicsLessons().map((l) => [l.builtin, l]));
  for (const lesson of await app.db.getAll('lessons')) {
    const src = fresh.get(lesson.builtin);
    if (!src) continue;
    const same = JSON.stringify(lesson.letters) === JSON.stringify(src.letters);
    if (same) continue;
    lesson.letters = src.letters;
    await app.db.put('lessons', lesson);
  }
}

/**
 * Bài câu mẫu đã có trên máy từ bản cũ: bổ sung mô tả khung hình chi tiết (frameScene, framePrompts) từ file mẫu mới,
 * chỉ cho những câu còn thiếu frameScene. Không đổi gì khác (tên, tiến độ, khung hình đã lưu…).
 */
export async function upgradePhraseSamples(app) {
  for (const file of PHRASE_SAMPLE_FILES) {
    let sample;
    try {
      const parsed = parseLesson(await (await fetch(file)).text());
      if (!parsed.ok) continue;
      sample = parsed.lesson;
    } catch {
      continue;
    }
    const byEn = new Map(sample.phrases.map((p) => [p.en.toLowerCase(), p]));
    for (const lesson of await app.db.getAll('lessons')) {
      if (!Array.isArray(lesson.phrases)) continue;
      let changed = false;
      for (const p of lesson.phrases) {
        const src = byEn.get(p.en.toLowerCase());
        if (!src || p.frameScene || !src.frameScene) continue;
        p.frameScene = src.frameScene;
        p.framePrompts = src.framePrompts;
        changed = true;
      }
      if (changed) await app.db.put('lessons', lesson);
    }
  }
}
