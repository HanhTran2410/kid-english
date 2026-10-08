// Chạy lần lượt các phần của bài: thẻ từ → hội thoại → trò chơi → truyện → Hoan hô (SPEC 4.3).
// Lưu chỗ dừng sau mỗi bước để "Học tiếp" được (SPEC 4.2).

import { isAbort } from '../timing.js';
import { findWord } from '../lesson.js';
import { activityLayout } from './layout.js';
import { Teacher } from './teacher.js';
import { VisualSet, loadLessonVisuals } from './visuals.js';
import { buildSteps, startIndexFor, resumeAfter, quizQuestions } from './plan.js';
import { runWordStep } from './vocabulary-stage.js';
import { runConversationStep } from './conversation-stage.js';
import { runQuizStep } from './quiz-stage.js';
import { runStoryStep } from './story-stage.js';
import { runCompletion } from './completion-stage.js';
import { runSkippable, endSkippable } from './stage-kit.js';

/**
 * Màn hình học bài.
 * @param {{ lessonId: string, start?: 'begin'|'resume', continueDirectly?: boolean }} params
 */
export function lessonScreen(app, { lessonId, start = 'begin', continueDirectly = false }) {
  const layout = activityLayout(app, 'lesson');
  const signal = app.startActivity();
  const visuals = new VisualSet();

  const saveLesson = async (lesson) => {
    try {
      await app.db.put('lessons', lesson);
    } catch (err) {
      console.error(err);
    }
  };

  async function run() {
    const lesson = await app.db.get('lessons', lessonId);
    if (!lesson) {
      app.go('lessons');
      return;
    }
    await loadLessonVisuals(app.db, lesson, visuals);

    const steps = buildSteps(lesson);
    const resume = start === 'resume' || continueDirectly;
    let i = resume ? startIndexFor(steps, lesson.resume) : 0;
    if (!resume && lesson.resume) {
      lesson.resume = null;
      await saveLesson(lesson);
    }

    const teacher = new Teacher(app, { signal, bunny: layout.bunny, stage: layout.stage });
    const ctx = {
      app, teacher, lesson, visuals, signal,
      stage: layout.stage,
      nextBtn: layout.nextBtn,
      viSpoken: new Set(),
    };
    const questions = quizQuestions(lesson);
    const pool = lesson.words.map((w) => w.en);
    const emojiOf = (en) => findWord(lesson, en)?.emoji ?? '';

    for (; i < steps.length; i++) {
      layout.setProgress(i / steps.length);
      const step = steps[i];
      layout.stage.dataset.stage = step.stage;
      await runSkippable(ctx, signal, async () => {
        if (step.stage === 'words') {
          await runWordStep(ctx, lesson.words[step.index]);
        } else if (step.stage === 'conversation') {
          const turn = lesson.conversation[step.index];
          await runConversationStep(ctx, turn, emojiOf(turn.word));
        } else if (step.stage === 'quiz') {
          await runQuizStep(ctx, questions[step.index], pool, emojiOf);
        } else {
          await runStoryStep(ctx, lesson.story[step.index]);
        }
      });
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
    visuals.revoke();
    layout.bunny.destroy();
  };
}
