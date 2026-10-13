// Chạy một bài phonics (SPEC-phonics.md): với từng chữ: sơ đồ → tìm từ đúng âm; cuối bài: chữ hoa – chữ thường,
// nghe từ chọn chữ, bắt bóng chữ → Hoan hô. Dùng chung khung màn hình, nút ▶, 🔊, Học tiếp / Học lại.

import { isAbort } from '../timing.js';
import { normalizeWord } from '../text.js';
import { mediaBlob, latestImageForWord } from '../db.js';
import { isPhonicsLesson, buildPhonicsSteps } from '../phonics.js';
import { activityLayout } from './layout.js';
import { Teacher } from './teacher.js';
import { startIndexFor, resumeAfter } from './plan.js';
import { runSkippable, endSkippable } from './stage-kit.js';
import { runCompletion } from './completion-stage.js';
import { runMap, runFind, runCase, runHear, runPop } from './phonics-stages.js';

const RUNNERS = { map: runMap, find: runFind, case: runCase, hear: runHear, pop: runPop };

/**
 * Ảnh các từ của bài: ảnh bố mẹ thêm ở bài này, không có thì ảnh mới nhất của từ đó (bài từ vựng…); không có thì emoji.
 * @returns {Promise<{ imageOf: (en: string) => string|null, urls: string[] }>}
 */
export async function loadPhonicsImages(db, lesson) {
  const urls = [];
  const byWord = new Map();
  const own = await db.getAllByIndex('images', 'lessonId', lesson.id);
  for (const img of [...own].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))) byWord.set(img.word, img);
  for (const w of lesson.letters.flatMap((l) => l.words)) {
    const key = normalizeWord(w.en);
    if (!byWord.has(key)) byWord.set(key, await latestImageForWord(db, w.en));
  }
  const urlOf = new Map();
  for (const [key, img] of byWord) {
    if (!img) continue;
    const url = URL.createObjectURL(mediaBlob(img));
    urls.push(url);
    urlOf.set(key, url);
  }
  return { imageOf: (en) => urlOf.get(normalizeWord(en)) ?? null, urls };
}

/**
 * @param {{ lessonId: string, start?: 'begin'|'resume' }} params
 */
export function phonicsLessonScreen(app, { lessonId, start = 'begin' }) {
  const layout = activityLayout(app, 'phonics-lesson');
  const signal = app.startActivity();
  let urls = [];

  const saveLesson = async (lesson) => {
    try {
      await app.db.put('lessons', lesson);
    } catch (err) {
      console.error(err);
    }
  };

  async function run() {
    const lesson = await app.db.get('lessons', lessonId);
    if (!isPhonicsLesson(lesson) || !lesson.letters?.length) {
      app.go('phonics');
      return;
    }
    const images = await loadPhonicsImages(app.db, lesson);
    urls = images.urls;
    const teacher = new Teacher(app, { signal, bunny: layout.bunny, stage: layout.stage, replayBtn: layout.replayBtn });
    // Trò chữ hoa – chữ thường / nghe từ chọn chữ: mỗi lượt học hỏi các chữ theo thứ tự xáo trộn.
    const order = [...lesson.letters];
    for (let k = order.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [order[k], order[j]] = [order[j], order[k]];
    }
    const ctx = {
      app, teacher, lesson, signal,
      stage: layout.stage,
      nextBtn: layout.nextBtn,
      pickedThisRun: new Set(),
      imageOf: images.imageOf,
    };

    const steps = buildPhonicsSteps(lesson);
    const resume = start === 'resume';
    let i = resume ? startIndexFor(steps, lesson.resume) : 0;
    if (!resume && lesson.resume) {
      lesson.resume = null;
      await saveLesson(lesson);
    }

    for (; i < steps.length; i++) {
      layout.setProgress(i / steps.length);
      const step = steps[i];
      layout.stage.dataset.stage = `phonics-${step.stage}`;
      const entry = ['case', 'hear'].includes(step.stage) ? order[step.index % order.length] : lesson.letters[step.index];
      await runSkippable(ctx, signal, () => RUNNERS[step.stage](ctx, entry));
      lesson.resume = resumeAfter(steps, i);
      await saveLesson(lesson);
    }

    layout.setProgress(1);
    lesson.timesCompleted = (lesson.timesCompleted ?? 0) + 1;
    lesson.resume = null;
    await saveLesson(lesson);
    layout.stage.dataset.stage = 'done';
    endSkippable(ctx, signal);
    await runCompletion(ctx);
    app.finishActivity();
  }

  run().catch((err) => {
    if (isAbort(err)) return;
    console.error(err);
    app.go('home');
  });

  return () => {
    layout.bunny.destroy();
    urls.forEach((u) => URL.revokeObjectURL(u));
  };
}
