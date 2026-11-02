// Chạy một bài mẫu câu (SPEC-patterns.md): A khám phá → B nói theo (4 hình) → C bé tự nói (3 hình) → D trò chơi (2 câu)
// → bài hát → Hoan hô. Dùng chung khung màn hình, nút ▶ bỏ qua, Học tiếp / Học lại và màn Hoan hô với các bài khác.

import { isAbort } from '../timing.js';
import { normalizeWord } from '../text.js';
import { mediaBlob, latestImageForWord } from '../db.js';
import { isPatternLesson, buildPatternSteps, orderSlots, planSlots, pickGames } from '../patterns.js';
import { patternRecords } from '../progress.js';
import { activityLayout } from './layout.js';
import { Teacher } from './teacher.js';
import { startIndexFor, resumeAfter } from './plan.js';
import { runSkippable, endSkippable } from './stage-kit.js';
import { runCompletion } from './completion-stage.js';
import { createPoster, runExplore, runSay, runTell, runGame, runSong } from './pattern-stages.js';

/**
 * @param {{ lessonId: string, start?: 'begin'|'resume', continueDirectly?: boolean }} params
 */
export function patternLessonScreen(app, { lessonId, start = 'begin', continueDirectly = false }) {
  const layout = activityLayout(app, 'pattern-lesson');
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
    if (!isPatternLesson(lesson) || !lesson.slots?.length) {
      app.go('patterns');
      return;
    }
    const steps = buildPatternSteps();
    const resume = start === 'resume' || continueDirectly;
    let i = resume ? startIndexFor(steps, lesson.resume) : 0;
    if (!resume && lesson.resume) {
      lesson.resume = null;
      await saveLesson(lesson);
    }

    // Ảnh của từng hình: ảnh bố mẹ thêm ở bài này, không có thì ảnh mới nhất của `concept` ở bài khác, không nữa thì emoji.
    const images = await app.db.getAllByIndex('images', 'lessonId', lesson.id);
    const imageByKey = new Map();
    for (const slot of lesson.slots) {
      const key = normalizeWord(slot.concept || slot.word);
      const img = images.filter((x) => x.word === key).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0]
        ?? await latestImageForWord(app.db, key);
      if (!img) continue;
      const url = URL.createObjectURL(mediaBlob(img));
      urls.push(url);
      imageByKey.set(key, url);
    }
    const poster = createPoster(lesson, (slot) => imageByKey.get(normalizeWord(slot.concept || slot.word)) ?? null);
    layout.stage.replaceChildren(poster.el);

    // Thứ tự hình "từ ít sao" (mục 4.5) cho phần B, C, D; hai câu trò chơi (mục 3.D).
    const records = new Map(patternRecords(await app.db.getAll('progress')).map((r) => [r.word, r]));
    const plan = planSlots(orderSlots(lesson, records));
    const games = pickGames(lesson, lesson.lastGame ?? null);
    if (!resume || !lesson.resume || lesson.resume.stage !== 'game') {
      lesson.lastGame = games[0];
      await saveLesson(lesson);
    }

    const teacher = new Teacher(app, { signal, bunny: layout.bunny, stage: layout.stage, replayBtn: layout.replayBtn });
    const ctx = { app, teacher, lesson, signal, poster, stage: layout.stage, nextBtn: layout.nextBtn };
    // Phần A đã xong (học tiếp từ phần sau): mọi hình đã có ✓.
    if (i > 0) lesson.slots.forEach((_, k) => poster.check(k));

    const gameUsed = [];
    const run1 = (step) => {
      if (step.stage === 'explore') return runExplore(ctx);
      if (step.stage === 'say') return runSay(ctx, plan.say[step.index % plan.say.length], step.index);
      if (step.stage === 'tell') return runTell(ctx, plan.tell[step.index % plan.tell.length]);
      if (step.stage === 'game') {
        const slot = plan.game.find((k) => !gameUsed.includes(k)) ?? plan.game[0];
        gameUsed.push(slot);
        return runGame(ctx, games[step.index], slot);
      }
      return runSong(ctx);
    };

    for (; i < steps.length; i++) {
      layout.setProgress(i / steps.length);
      const step = steps[i];
      layout.stage.dataset.stage = `pattern-${step.stage}`;
      await runSkippable(ctx, signal, () => run1(step));
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
