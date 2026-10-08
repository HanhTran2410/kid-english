// Học cùng Bông (SPEC 4.5): hỏi đáp theo hội thoại lấy từ các bài đã lưu.

import { isAbort } from '../timing.js';
import { normalizeWord } from '../text.js';
import { listLessons } from '../db.js';
import { isUnknown } from '../progress.js';
import { findWord } from '../lesson.js';
import { activityLayout } from '../player/layout.js';
import { Teacher } from '../player/teacher.js';
import { VisualSet, loadLessonVisuals } from '../player/visuals.js';
import { buildChatTurns } from '../player/plan.js';
import { runConversationStep } from '../player/conversation-stage.js';
import { runCompletion } from '../player/completion-stage.js';
import { markPracticed } from '../player/track.js';

export function learnScreen(app) {
  const layout = activityLayout(app, 'learn');
  const signal = app.startActivity();
  const visuals = new VisualSet();

  async function run() {
    const lessons = await listLessons(app.db);
    if (!lessons.length) {
      app.go('home');
      return;
    }
    const weak = new Set((await app.db.getAll('progress')).filter(isUnknown).map((r) => r.word));
    const turns = buildChatTurns(lessons, weak, 7);
    const byId = new Map(lessons.map((l) => [l.id, l]));
    for (const id of new Set(turns.map((t) => t.lessonId))) await loadLessonVisuals(app.db, byId.get(id), visuals);

    const teacher = new Teacher(app, { signal, bunny: layout.bunny, stage: layout.stage });
    const ctx = { app, teacher, visuals, signal, stage: layout.stage, nextBtn: layout.nextBtn };
    const practiced = new Set();

    for (let i = 0; i < turns.length; i++) {
      layout.setProgress(i / turns.length);
      const turn = turns[i];
      const emoji = findWord(byId.get(turn.lessonId), turn.word)?.emoji ?? '';
      const key = normalizeWord(turn.word);
      if (!practiced.has(key)) {
        practiced.add(key);
        await markPracticed(app, turn.word, emoji);
      }
      await runConversationStep(ctx, turn, emoji);
    }

    layout.setProgress(1);
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
