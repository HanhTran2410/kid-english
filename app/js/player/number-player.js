// Chạy một bài số (SPEC-numbers): bài đếm (với từng số: Bông đếm → bé chạm đếm → chọn nhóm đúng) hoặc trò chơi Chọn số.
// Dùng chung khung màn hình, nút ▶ bỏ qua, Học tiếp/Học lại và màn Hoan hô với các bài khác.

import { isAbort } from '../timing.js';
import { isNumberLesson, buildCountSteps, buildGameRounds } from '../numbers.js';
import { numberRecords } from '../progress.js';
import { normalizeWord } from '../text.js';
import { mediaBlob, latestImageForWord } from '../db.js';
import { activityLayout } from './layout.js';
import { Teacher } from './teacher.js';
import { startIndexFor, resumeAfter } from './plan.js';
import { runSkippable, endSkippable } from './stage-kit.js';
import { runCompletion } from './completion-stage.js';
import { runCount, runTap, runGroup, runGameRound } from './number-stages.js';
import { runShapeQuestion } from './shape-stages.js';
import { buildShapeQuestions, cleanShapeState, afterShapeRound } from '../shapes.js';

const RUNNERS = { count: runCount, tap: runTap, group: runGroup };
const SNAPSHOT_MS = 10 * 60_000;

// Đếm hình: lượt đang chơi dở. App ra nền thì màn được dựng lại (continueDirectly) — chơi tiếp đúng câu đang làm.
let shapeSnapshot = null;

/**
 * @param {{ lessonId: string, start?: 'begin'|'resume' }} params
 */
export function numberLessonScreen(app, { lessonId, start = 'begin', continueDirectly = false }) {
  const layout = activityLayout(app, 'number-lesson');
  const urls = [];
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
    const shapes = lesson.mode === 'shapes';
    const game = lesson.mode === 'game' || shapes;
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

    // Ảnh đồ vật bố mẹ đã thêm (SPEC-numbers mục 14.2), ảnh mới nhất của mỗi đồ vật; không có thì dùng emoji.
    const images = await app.db.getAllByIndex('images', 'lessonId', lesson.id);
    const imageByItem = new Map();
    for (const img of [...images].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))) {
      const url = URL.createObjectURL(mediaBlob(img));
      urls.push(url);
      imageByItem.set(img.word, url);
    }
    // Đồ vật chưa có ảnh trong bài này (ví dụ trò Chọn số): lấy ảnh mới nhất của đồ vật đó ở bài đếm.
    for (const x of lesson.numbers) {
      const key = normalizeWord(x.item);
      if (imageByItem.has(key)) continue;
      const img = await latestImageForWord(app.db, x.item);
      if (!img) continue;
      const url = URL.createObjectURL(mediaBlob(img));
      urls.push(url);
      imageByItem.set(key, url);
    }
    ctx.imageOf = (entry) => imageByItem.get(normalizeWord(entry.item)) ?? null;

    let steps;
    let rounds = [];
    if (game) {
      // Trò chơi: ưu tiên số bé ít sao; bé chưa có sao nào ở 6–10 thì thẻ sai chỉ lấy từ 1–5.
      const records = numberRecords(await app.db.getAll('progress'));
      const mastery = new Map(records.map((r) => [Number(r.word.split(':')[1]), r.mastery]));
      ctx.allowHigh = [...mastery].some(([n, m]) => n > 5 && m > 0);
      if (shapes) {
        // Đếm hình (SPEC-shapes): mức theo cài đặt; câu khởi động "Find a …!" ở mức 1 với loại hình bé chưa gặp.
        const st = cleanShapeState(app.settings.shapeCount);
        ctx.shapeLevel = st.level;
        ctx.shapeSeen = new Set(st.seen);
        const snap = shapeSnapshot;
        const fresh = continueDirectly && snap?.lessonId === lesson.id && Date.now() - snap.savedAt < SNAPSHOT_MS;
        rounds = fresh ? snap.rounds : buildShapeQuestions(st.level, mastery, { rounds: lesson.rounds ?? 5 });
        ctx.shapeStart = fresh ? snap.index : 0;
        if (fresh) ctx.shapeSeen = new Set([...ctx.shapeSeen, ...snap.seen]);
      } else {
        rounds = buildGameRounds([...byN.keys()], mastery, { rounds: lesson.rounds });
      }
      steps = rounds.map((_, index) => ({ stage: shapes ? 'shapes' : 'game', index }));
    } else {
      steps = buildCountSteps(lesson);
    }

    // Trò chơi luôn chơi lượt mới; bài đếm có Học tiếp.
    const resume = !game && start === 'resume';
    let i = resume ? startIndexFor(steps, lesson.resume) : (ctx.shapeStart ?? 0);
    if (!resume && lesson.resume) {
      lesson.resume = null;
      await saveLesson(lesson);
    }

    for (; i < steps.length; i++) {
      layout.setProgress(i / steps.length);
      const step = steps[i];
      layout.stage.dataset.stage = `number-${step.stage}`;
      await runSkippable(ctx, signal, () => {
        if (shapes) {
          const q = rounds[step.index];
          shapeSnapshot = { lessonId: lesson.id, rounds, index: step.index, seen: [...ctx.shapeSeen], savedAt: Date.now() };
          const prev = rounds[step.index - 1];
          const warmup = ctx.shapeLevel === 1 && !ctx.shapeSeen.has(q.kind);
          ctx.shapeSeen.add(q.kind);
          return runShapeQuestion(ctx, q, { level: ctx.shapeLevel, look: prev?.picture !== q.picture, warmup });
        }
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
    if (shapes) {
      shapeSnapshot = null;
      // Đếm số lượt để tự lên mức (áp dụng từ lượt sau); nhớ loại hình bé đã gặp (không cần khởi động lại).
      const st = afterShapeRound(cleanShapeState(app.settings.shapeCount));
      await app.setSetting('shapeCount', { ...st, seen: [...ctx.shapeSeen] }).catch(() => {});
    }
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
