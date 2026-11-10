// Chạy một bài Toán (SPEC-math mục 3): xem Bông làm mẫu (3 lượt) → bé chơi 6 câu → Hoan hô.
// Học tiếp: lượt đang dở (6 câu đã sinh, câu đang ở, kết quả) lưu vào `lesson.resume` sau mỗi lần đổi trạng thái.

import { isAbort } from '../timing.js';
import { getProgress, updateProgress } from '../db.js';
import {
  isMathLesson, mathKey, makeMathRound, applyMathRound, addMathType, weakType, typesFor, clampLevel, DEMO_STEPS,
} from '../math.js';
import { activityLayout } from './layout.js';
import { Teacher } from './teacher.js';
import { runSkippable, endSkippable } from './stage-kit.js';
import { runCompletion } from './completion-stage.js';
import { runDemo, runQuestion, revealAnswer, loadMathPictures } from './math-stages.js';

/**
 * @param {{ lessonId: string, start?: 'begin'|'resume', continueDirectly?: boolean }} params
 *   continueDirectly: app ra nền rồi quay lại — vào lại đúng chỗ đang làm (như Học tiếp).
 */
export function mathLessonScreen(app, { lessonId, start = 'begin', continueDirectly = false }) {
  const layout = activityLayout(app, 'math-lesson');
  const signal = app.startActivity();
  let revokePics = null;

  const saveLesson = async (lesson) => {
    try {
      await app.db.put('lessons', lesson);
    } catch (err) {
      console.error(err);
    }
  };
  const safely = (fn) => fn().catch((err) => console.error(err));

  async function run() {
    const lesson = await app.db.get('lessons', lessonId);
    if (!isMathLesson(lesson)) {
      app.go('math');
      return;
    }
    const key = mathKey(lesson);
    revokePics = await loadMathPictures(app.db); // ảnh đồ vật bố mẹ đã thêm; chưa có thì emoji
    const rec = await getProgress(app.db, key, lesson.emoji);
    const teacher = new Teacher(app, { signal, bunny: layout.bunny, stage: layout.stage, replayBtn: layout.replayBtn });

    // Lượt đang dở (Học tiếp, hoặc quay lại từ nền); "Học lại" thì sinh lượt mới ở mức hiện tại.
    let st = (start === 'resume' || continueDirectly) && lesson.resume?.stage === 'math' ? lesson.resume : null;
    if (!st) {
      const level = clampLevel(rec.level);
      const weak = weakType(rec, typesFor(lesson, level));
      st = { stage: 'math', phase: 'demo', demoIndex: 0, index: 0, level, questions: makeMathRound(lesson, level, { weak }), results: [] };
    }
    const total = DEMO_STEPS + st.questions.length;
    const save = async () => {
      const done = st.demoIndex + st.index;
      lesson.resume = { ...st, savedAt: Date.now(), progress: done / total };
      await saveLesson(lesson);
    };
    await save();

    const ctx = {
      app, teacher, lesson, signal, level: st.level,
      stage: layout.stage,
      nextBtn: layout.nextBtn,
    };

    // A. Xem Bông làm mẫu — ▶ sang lượt sau (Bông không tự chuyển lượt).
    while (st.phase === 'demo') {
      layout.setProgress((st.demoIndex + st.index) / total);
      layout.stage.dataset.stage = 'math-demo';
      await runSkippable(ctx, signal, () => runDemo(ctx, st.demoIndex));
      layout.nextBtn.classList.remove('mt-next-hint');
      st.demoIndex++;
      if (st.demoIndex >= DEMO_STEPS) st.phase = 'play';
      await save();
    }

    // B. Bé chơi 6 câu.
    while (st.index < st.questions.length) {
      layout.setProgress((st.demoIndex + st.index) / total);
      layout.stage.dataset.stage = 'math-play';
      const q = st.questions[st.index];
      // Chốt kết quả câu NGAY lúc biết (trước câu khen / hiện đáp án): thoát lúc Bông đang khen thì Học tiếp vào câu sau.
      const state = {
        committed: false,
        view: null,
        async commit(result) {
          if (state.committed) return;
          state.committed = true;
          st.results.push({ first: result.first, wrong: result.wrong, revealed: result.revealed, skipped: Boolean(result.skipped) });
          st.index++;
          await save();
          await safely(() => updateProgress(app.db, key, lesson.emoji, (p) => addMathType(p, q.type, result)));
        },
      };
      const skipped = await runSkippable(ctx, signal, () => runQuestion(ctx, q, state));
      if (skipped && !state.committed) {
        // ▶ khi bé đang trả lời: bỏ qua câu — không tính đúng ngay, không tính sai; hiện đáp án rồi sang câu sau
        // (▶ lần nữa thì sang ngay).
        teacher.endQuestion();
        await state.commit({ first: false, wrong: state.wrong ?? 0, revealed: true, skipped: true });
        await runSkippable(ctx, signal, () => revealAnswer(ctx, q, state.view));
      }
    }

    // Xong đủ 6 câu: cộng sao, lên mức (mục 6). Thoát giữa lượt thì không tới đây — không cộng sao.
    const firstCount = st.results.filter((r) => r.first).length;
    await safely(() => updateProgress(app.db, key, lesson.emoji, (p) => applyMathRound(p, firstCount)));
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
    revokePics?.();
  };
}
