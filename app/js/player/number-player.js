// Chạy một bài số (SPEC-numbers): bài đếm (với từng số: Bông đếm → bé chạm đếm → chọn nhóm đúng) hoặc trò chơi Chọn số.
// Dùng chung khung màn hình, nút ▶ bỏ qua, Học tiếp/Học lại và màn Hoan hô với các bài khác.

import { isAbort } from '../timing.js';
import { isNumberLesson, buildCountSteps, buildGameRounds } from '../numbers.js';
import { numberRecords } from '../progress.js';
import { activityLayout } from './layout.js';
import { Teacher } from './teacher.js';
import { startIndexFor, resumeAfter } from './plan.js';
import { runSkippable, endSkippable } from './stage-kit.js';
import { runCompletion } from './completion-stage.js';
import { runCount, runTap, runGroup, runGameRound } from './number-stages.js';

const RUNNERS = { count: runCount, tap: runTap, group: runGroup };

/**
 * @param {{ lessonId: string, start?: 'begin'|'resume' }} params
 */
export function numberLessonScreen(app, { lessonId, start = 'begin' }) {
  const layout = activityLayout(app, 'number-lesson');
  const signal = app.startActivity();

  const saveLesson = async (lesson) => {
    try {
      await app.db.put('lessons', lesson);
    } catch (err) {
      console.error(err);
    }
  };

  async function run() {
    const lesson = await app.db.get('lessons', lessonId);
    if (!isNumberLesson(lesson) || !lesson.numbers?.length) {
      app.go('numbers');
      return;
    }
    const game = lesson.mode === 'game';
    const teacher = new Teacher(app, { signal, bunny: layout.bunny, stage: layout.stage, replayBtn: layout.replayBtn });
    const ctx = {
      app, teacher, lesson, signal,
      stage: layout.stage,
      nextBtn: layout.nextBtn,
      pickedThisRun: new Set(),
      maxNumber: Math.max(...lesson.numbers.map((x) => x.n), 1),
      allowHigh: true,
    };
    const byN = new Map(lesson.numbers.map((x) => [x.n, x]));

    let steps;
    let rounds = [];
    if (game) {
      // Trò chơi: ưu tiên số bé ít sao; bé chưa có sao nào ở 6–10 thì thẻ sai chỉ lấy từ 1–5.
      const records = numberRecords(await app.db.getAll('progress'));
      const mastery = new Map(records.map((r) => [Number(r.word.split(':')[1]), r.mastery]));
      ctx.allowHigh = [...mastery].some(([n, m]) => n > 5 && m > 0);
      rounds = buildGameRounds([...byN.keys()], mastery, { rounds: lesson.rounds });
      steps = rounds.map((_, index) => ({ stage: 'game', index }));
    } else {
      steps = buildCountSteps(lesson);
    }

    // Trò chơi luôn chơi lượt mới; bài đếm có Học tiếp.
    const resume = !game && start === 'resume';
    let i = resume ? startIndexFor(steps, lesson.resume) : 0;
    if (!resume && lesson.resume) {
      lesson.resume = null;
      await saveLesson(lesson);
    }

    for (; i < steps.length; i++) {
      layout.setProgress(i / steps.length);
      const step = steps[i];
      layout.stage.dataset.stage = `number-${step.stage}`;
      await runSkippable(ctx, signal, () => {
        if (game) {
          const round = rounds[step.index];
          return runGameRound(ctx, round, byN.get(round.n) ?? lesson.numbers[0]);
        }
        return RUNNERS[step.stage](ctx, lesson.numbers[step.index]);
      });
      if (!game) {
        lesson.resume = resumeAfter(steps, i);
        await saveLesson(lesson);
      }
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

  return () => layout.bunny.destroy();
}
