// Ôn tập chung (⭐) và Trò chơi tổng hợp (🎲) — SPEC-mix.md mục 2 và 4.
// Ôn tập: mục đã học của cả 3 loại, từ vựng có xen "What's this?" (bé nói).
// Trò chơi tổng hợp: mọi bài kể cả chưa học, chỉ chạm chọn đáp án, không bao giờ trừ sao.

import { h, wordVisual } from '../ui.js';
import { isAbort } from '../timing.js';
import { RESULT } from '../speech/listen.js';
import { listLessons, getFrameSets, frameBlobs, latestImageForWord, mediaBlob } from '../db.js';
import { normalizeWord } from '../text.js';
import { numberRecords } from '../progress.js';
import { collectItems, pickReviewItems, pickPlayItems, distractors, learnedKeys } from '../mix.js';
import { activityLayout } from './layout.js';
import { Teacher } from './teacher.js';
import { VisualSet, loadWordVisual } from './visuals.js';
import { findPrompt, answerSentence } from './plan.js';
import { runQuizStep } from './quiz-stage.js';
import { pickPhrase } from './phrase-stages.js';
import { runGameRound } from './number-stages.js';
import { runCompletion } from './completion-stage.js';
import { markPracticed, markSpoke, markPhrasePick, spoke } from './track.js';
import { runSkippable, endSkippable } from './stage-kit.js';

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** "What's this?": hiện hình, bé nói tên (chỉ ở Ôn tập). */
async function runWhatsThis(ctx, item) {
  const { app, teacher, visuals, stage } = ctx;
  const picture = wordVisual(visuals.get(item.en), 'big');
  stage.replaceChildren(h('div.word-card', {}, picture));
  await teacher.say("What's this?");
  const { result } = await teacher.hear([item.en]);
  if (spoke(result)) await markSpoke(app, item.en, item.emoji);
  await teacher.praise(result, picture);
  await teacher.say(answerSentence(item.en));
  if (result === RESULT.LISTEN_ONLY) await teacher.say('Good!');
  await teacher.checkPresence();
  await teacher.pause(900);
}

/**
 * @param {{ mode?: 'review'|'play' }} params
 */
export function mixScreen(app, { mode = 'review' } = {}) {
  const play = mode === 'play';
  const layout = activityLayout(app, play ? 'play' : 'review');
  const signal = app.startActivity();
  const visuals = new VisualSet();
  const urls = [];

  async function run() {
    const lessons = await listLessons(app.db);
    const progress = await app.db.getAll('progress');
    const items = collectItems(lessons, new Map(progress.map((r) => [r.word, r])));
    const learnedBefore = learnedKeys(items);
    // Mỗi câu hỏi kèm đáp án sai cùng loại; từ/câu không có đáp án sai thì chỉ hỏi được bằng "What's this?" (Ôn tập).
    const plan = (play ? pickPlayItems(items) : pickReviewItems(items))
      .map((item) => ({ item, others: item.kind === 'number' ? [] : distractors(item, items) }))
      .filter(({ item, others }) => item.kind === 'number' || others.length || (!play && item.kind === 'word'));
    if (!plan.length) {
      app.go('home');
      return;
    }

    // Hình: ảnh/emoji của từ; khung hình (flipbook) của câu theo từng bài.
    const frames = new Map();
    const imageByItem = new Map(); // ảnh đồ vật của số đếm (ảnh mới nhất), không có thì emoji
    for (const { item, others } of plan) {
      for (const it of [item, ...others]) {
        if (it.kind === 'word') await loadWordVisual(app.db, visuals, it.en, it.emoji);
        if (it.kind === 'number' && !imageByItem.has(normalizeWord(it.data.item))) {
          const img = await latestImageForWord(app.db, it.data.item);
          const url = img ? URL.createObjectURL(mediaBlob(img)) : null;
          if (url) urls.push(url);
          imageByItem.set(normalizeWord(it.data.item), url);
        }
        if (it.kind === 'phrase' && !frames.has(it.lessonId)) {
          const byPhrase = new Map();
          for (const [phraseId, set] of await getFrameSets(app.db, it.lessonId)) {
            const list = frameBlobs(set).map((b) => URL.createObjectURL(b));
            urls.push(...list);
            byPhrase.set(phraseId, list);
          }
          frames.set(it.lessonId, byPhrase);
        }
      }
    }
    const framesOf = (it) => frames.get(it.lessonId)?.get(it.data.id);

    const mastery = new Map(numberRecords(progress).map((r) => [Number(r.word.split(':')[1]), r.mastery]));
    const teacher = new Teacher(app, { signal, bunny: layout.bunny, stage: layout.stage, replayBtn: layout.replayBtn });
    const ctx = {
      app, teacher, visuals, signal,
      stage: layout.stage,
      nextBtn: layout.nextBtn,
      pickedThisRun: new Set(),
      maxNumber: 20,
      allowHigh: [...mastery].some(([n, m]) => n > 5 && m > 0),
      // Trò chơi tổng hợp: chỉ cộng sao cho mục đã học trước lượt này (đoán trúng mục mới không tính là thuộc).
      canAward: (key) => !play || learnedBefore.has(key),
      imageOf: (entry) => imageByItem.get(normalizeWord(entry.item)) ?? null,
    };

    let wordTurn = 0;
    let numberTurn = 0;
    for (let i = 0; i < plan.length; i++) {
      layout.setProgress(i / plan.length);
      const { item, others } = plan[i];
      if (item.kind !== 'number') await markPracticed(app, item.kind === 'word' ? item.en : item.key, item.emoji);

      await runSkippable(ctx, signal, async () => {
        if (item.kind === 'word') {
          // Ôn tập: xen kẽ "Find the…" và "What's this?"; Trò chơi tổng hợp: chỉ chọn.
          const ask = play || (wordTurn++ % 2 === 0 && others.length);
          if (!ask) return runWhatsThis(ctx, item);
          const record = play
            ? (firstTry) => {
              const award = firstTry && ctx.canAward(item.key) && !ctx.pickedThisRun.has(item.key);
              ctx.pickedThisRun.add(item.key);
              return markPhrasePick(app, item.en, item.emoji, { firstTry, award });
            }
            : undefined;
          return runQuizStep(ctx, { ask: findPrompt(item.en), answer: item.en }, [item.en, ...others.map((o) => o.en)],
            (w) => [item, ...others].find((o) => o.en === w)?.emoji ?? '', { record, maxChoices: 1 + others.length });
        }
        if (item.kind === 'phrase') {
          const options = shuffle([item, ...others]).map((o) => ({ phrase: o.data, urls: framesOf(o) }));
          return pickPhrase(ctx, item.data, options, { canAward: ctx.canAward(item.key) });
        }
        return runGameRound(ctx, { n: item.data.n, type: numberTurn++ % 2 === 0 ? 'find' : 'count' }, item.data);
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
    urls.forEach((u) => URL.revokeObjectURL(u));
    layout.bunny.destroy();
  };
}
