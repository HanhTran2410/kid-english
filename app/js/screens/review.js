// Ôn tập (SPEC 4.4): 6 từ, xen kẽ "Find the…" (chạm hình) và "What's this?" (nói tên).

import { h, wordVisual } from '../ui.js';
import { isAbort } from '../timing.js';
import { isLearned, pickReviewWords, wordRecords } from '../progress.js';
import { RESULT } from '../speech/listen.js';
import { activityLayout } from '../player/layout.js';
import { Teacher } from '../player/teacher.js';
import { VisualSet, loadWordVisual } from '../player/visuals.js';
import { findPrompt, answerSentence } from '../player/plan.js';
import { runQuizStep } from '../player/quiz-stage.js';
import { runCompletion } from '../player/completion-stage.js';
import { markPracticed, markSpoke, spoke } from '../player/track.js';
import { runSkippable, endSkippable } from '../player/stage-kit.js';

const POOL_SIZE = 10;

export function reviewScreen(app) {
  const layout = activityLayout(app, 'review');
  const signal = app.startActivity();
  const visuals = new VisualSet();

  async function run() {
    const records = wordRecords(await app.db.getAll('progress'));
    const picked = pickReviewWords(records, { count: 6 });
    if (!picked.length) {
      app.go('home');
      return;
    }
    // Thêm vài từ đã học khác để làm lựa chọn sai cho "Find the…".
    const extra = records.filter((r) => isLearned(r) && !picked.includes(r)).slice(0, POOL_SIZE - picked.length);
    const pool = [...picked, ...extra];
    for (const r of pool) await loadWordVisual(app.db, visuals, r.word, r.emoji);
    const emojiOf = (w) => pool.find((r) => r.word === w)?.emoji ?? '';
    const poolWords = pool.map((r) => r.word);

    const teacher = new Teacher(app, { signal, bunny: layout.bunny, stage: layout.stage });
    const ctx = { app, teacher, visuals, signal, stage: layout.stage, nextBtn: layout.nextBtn };

    for (let i = 0; i < picked.length; i++) {
      layout.setProgress(i / picked.length);
      const { word, emoji } = picked[i];
      await markPracticed(app, word, emoji);

      await runSkippable(ctx, signal, async () => {
        if (i % 2 === 0 && poolWords.length >= 2) {
          await runQuizStep(ctx, { ask: findPrompt(word), answer: word }, poolWords, emojiOf);
          return;
        }

        // "What's this?": hiện hình, bé nói tên.
        const picture = wordVisual(visuals.get(word), 'big');
        layout.stage.replaceChildren(h('div.word-card', {}, picture));
        await teacher.say("What's this?");
        const { result } = await teacher.hear([word]);
        if (spoke(result)) await markSpoke(app, word, emoji);
        await teacher.praise(result, picture);
        await teacher.say(answerSentence(word));
        if (result === RESULT.LISTEN_ONLY) await teacher.say('Good!');
        await teacher.checkPresence();
        await teacher.pause(900);
      });
    }

    layout.setProgress(1);
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
