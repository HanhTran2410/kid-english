// Chạy một bài câu (SPEC-v1.0 mục 5): với từng câu A → B → C, rồi D cho từng câu, rồi Hoan hô.
// Dùng chung khung màn hình, nút ▶ bỏ qua, Học tiếp/Học lại và màn Hoan hô với bài từ vựng.

import { isAbort } from '../timing.js';
import { buildPhraseSteps } from '../phrase.js';
import { getFrameSets, frameBlobs } from '../db.js';
import { activityLayout } from './layout.js';
import { Teacher } from './teacher.js';
import { startIndexFor, resumeAfter } from './plan.js';
import { runSkippable, endSkippable } from './stage-kit.js';
import { runCompletion } from './completion-stage.js';
import { runWatch, runDo, runSay, runPick } from './phrase-stages.js';

const RUNNERS = { watch: runWatch, do: runDo, say: runSay, pick: runPick };

/**
 * @param {{ lessonId: string, start?: 'begin'|'resume', continueDirectly?: boolean }} params
 */
export function phraseLessonScreen(app, { lessonId, start = 'begin', continueDirectly = false }) {
  const layout = activityLayout(app, 'phrase-lesson');
  const signal = app.startActivity();
  const urls = [];

  const saveLesson = async (lesson) => {
    try {
      await app.db.put('lessons', lesson);
    } catch (err) {
      console.error(err);
    }
  };

  async function run() {
    const lesson = await app.db.get('lessons', lessonId);
    if (!lesson?.phrases) {
      app.go('phrases');
      return;
    }
    const steps = buildPhraseSteps(lesson);
    const resume = start === 'resume' || continueDirectly;
    let i = resume ? startIndexFor(steps, lesson.resume) : 0;
    if (!resume && lesson.resume) {
      lesson.resume = null;
      await saveLesson(lesson);
    }

    // Khung hình (flipbook) bố mẹ đã thêm cho từng câu.
    const frameUrls = new Map();
    for (const [phraseId, set] of await getFrameSets(app.db, lesson.id)) {
      const list = frameBlobs(set).map((b) => URL.createObjectURL(b));
      urls.push(...list);
      frameUrls.set(phraseId, list);
    }

    const teacher = new Teacher(app, { signal, bunny: layout.bunny, stage: layout.stage });
    const ctx = {
      app, teacher, lesson, signal, frameUrls,
      stage: layout.stage,
      nextBtn: layout.nextBtn,
      pickedThisRun: new Set(),
    };

    for (; i < steps.length; i++) {
      layout.setProgress(i / steps.length);
      const step = steps[i];
      layout.stage.dataset.stage = step.stage;
      await runSkippable(ctx, signal, () => RUNNERS[step.stage](ctx, lesson.phrases[step.index]));
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
