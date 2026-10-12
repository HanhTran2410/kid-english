// Học cùng Bông (SPEC 4.5, SPEC-mix mục 3): hỏi đáp theo hội thoại lấy từ các bài đã lưu,
// thêm tối đa 2 lượt câu nói (làm theo + nói) và 2 lượt số đếm (đếm + nói) nếu bé đã học.

import { isAbort } from '../timing.js';
import { normalizeWord } from '../text.js';
import { listLessons, getFrameSets, frameBlobs, latestImageForWord, mediaBlob } from '../db.js';
import { isLearned, isUnknown, wordRecords } from '../progress.js';
import { isWordLesson } from '../phrase.js';
import { findWord } from '../lesson.js';
import { collectItems, spreadKinds } from '../mix.js';
import { activityLayout } from '../player/layout.js';
import { Teacher } from '../player/teacher.js';
import { VisualSet, loadLessonVisuals } from '../player/visuals.js';
import { buildChatTurns } from '../player/plan.js';
import { runConversationStep } from '../player/conversation-stage.js';
import { runDo, runSay } from '../player/phrase-stages.js';
import { runNumberTalk } from '../player/number-stages.js';
import { runCompletion } from '../player/completion-stage.js';
import { markPracticed } from '../player/track.js';
import { runSkippable, endSkippable } from '../player/stage-kit.js';

const TURNS = 8;
const MAX_EXTRA = 2; // tối đa 2 lượt câu và 2 lượt số mỗi buổi

/** Mục đã học của một loại, ít sao trước (bằng nhau thì ngẫu nhiên). */
function weakestLearned(items, kind, count) {
  const list = items.filter((i) => i.kind === kind && i.record && isLearned(i.record));
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.sort((a, b) => a.record.mastery - b.record.mastery).slice(0, count);
}

export function learnScreen(app) {
  const layout = activityLayout(app, 'learn');
  const signal = app.startActivity();
  const visuals = new VisualSet();
  const urls = [];

  async function run() {
    const lessons = await listLessons(app.db);
    const progress = await app.db.getAll('progress');
    const items = collectItems(lessons, new Map(progress.map((r) => [r.word, r])));
    const phrases = weakestLearned(items, 'phrase', MAX_EXTRA);
    const numbers = weakestLearned(items, 'number', MAX_EXTRA);

    const wordLessons = lessons.filter(isWordLesson);
    const weak = new Set(wordRecords(progress).filter(isUnknown).map((r) => r.word));
    const chat = wordLessons.length ? buildChatTurns(wordLessons, weak, TURNS - phrases.length - numbers.length) : [];
    const turns = spreadKinds([
      ...chat.map((turn) => ({ kind: 'word', turn })),
      ...phrases.map((item) => ({ kind: 'phrase', item })),
      ...numbers.map((item) => ({ kind: 'number', item })),
    ]);
    if (!turns.length) {
      app.go('home');
      return;
    }

    const byId = new Map(lessons.map((l) => [l.id, l]));
    for (const id of new Set(chat.map((t) => t.lessonId))) await loadLessonVisuals(app.db, byId.get(id), visuals);
    const frames = new Map();
    for (const { item } of turns.filter((t) => t.kind === 'phrase')) {
      if (frames.has(item.lessonId)) continue;
      const byPhrase = new Map();
      for (const [phraseId, set] of await getFrameSets(app.db, item.lessonId)) {
        const list = frameBlobs(set).map((b) => URL.createObjectURL(b));
        urls.push(...list);
        byPhrase.set(phraseId, list);
      }
      frames.set(item.lessonId, byPhrase);
    }

    // Ảnh đồ vật của số đếm (ảnh mới nhất), không có thì emoji.
    const imageByItem = new Map();
    for (const { item } of turns.filter((t) => t.kind === 'number')) {
      const img = await latestImageForWord(app.db, item.data.item);
      if (!img) continue;
      const url = URL.createObjectURL(mediaBlob(img));
      urls.push(url);
      imageByItem.set(normalizeWord(item.data.item), url);
    }

    const teacher = new Teacher(app, { signal, bunny: layout.bunny, stage: layout.stage, replayBtn: layout.replayBtn });
    const ctx = { app, teacher, visuals, signal, stage: layout.stage, nextBtn: layout.nextBtn, frameUrls: new Map(),
      imageOf: (entry) => imageByItem.get(normalizeWord(entry.item)) ?? null };
    const practiced = new Set();

    for (let i = 0; i < turns.length; i++) {
      layout.setProgress(i / turns.length);
      const t = turns[i];
      if (t.kind === 'word') {
        const { turn } = t;
        const emoji = findWord(byId.get(turn.lessonId), turn.word)?.emoji ?? '';
        const key = normalizeWord(turn.word);
        if (!practiced.has(key)) {
          practiced.add(key);
          await markPracticed(app, turn.word, emoji);
        }
        await runSkippable(ctx, signal, () => runConversationStep(ctx, turn, emoji));
      } else if (t.kind === 'phrase') {
        // Làm theo (chạm ✔) rồi nói theo — giống bước B + C của bài câu.
        const p = t.item.data;
        ctx.frameUrls = frames.get(t.item.lessonId) ?? new Map();
        await markPracticed(app, t.item.key, p.emoji);
        await runSkippable(ctx, signal, () => runDo(ctx, p));
        await runSkippable(ctx, signal, () => runSay(ctx, p));
      } else {
        await runSkippable(ctx, signal, () => runNumberTalk(ctx, t.item.data));
      }
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
