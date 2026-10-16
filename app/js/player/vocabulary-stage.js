// Phần A: Thẻ từ — nghe và nói lại (SPEC 4.3 A), mở đầu bằng "ló dần" (SPEC-words-play mục 3).
// Nhịp nhanh: hiện hình → Bông đọc "Cow!" → mic mở ngay để bé nói theo.
// Bé chưa nói thì Bông mới hỏi "Can you say cow?" và nghe thêm một lần.

import { h, wordVisual } from '../ui.js';
import { normalizeWord } from '../text.js';
import { hasRecordingToday } from '../db.js';
import { RESULT } from '../speech/listen.js';
import { waitAdvance } from './stage-kit.js';
import { markPracticed, markSpoke, saveRecording, spoke } from './track.js';
import { runReveal } from './reveal.js';

export async function runWordStep(ctx, word) {
  const { app, teacher, stage, lesson } = ctx;
  const visual = ctx.visuals.get(word.en);
  const picture = wordVisual(visual, 'big tappable');
  const label = h('div.word-label', { text: word.en });
  const card = h('div.word-card', {}, picture, label);
  stage.replaceChildren(card);

  await markPracticed(app, word.en, word.emoji);

  // "Ló dần" (SPEC-words-play mục 3): hình bị che, bé chạm mở dần, đoán "What's this?", rồi mới vào thẻ từ.
  if (app.settings.wordReveal !== false) {
    await runReveal(ctx, word, { card, picture, label, index: Math.max(0, lesson.words.indexOf(word)), hasImage: Boolean(visual?.url) });
  }

  // Thẻ đầu tiên của bài: dặn bé một lần.
  if (!ctx.introDone) {
    ctx.introDone = true;
    await teacher.say('Listen and say!');
  }

  await teacher.say(`${word.en}!`);
  const key = normalizeWord(word.en);
  if (!ctx.viSpoken.has(key) && app.settings.readVietnamese && app.speaker.hasVietnamese) {
    ctx.viSpoken.add(key);
    await teacher.sayVi(`${word.vi}!`);
  }

  let record = app.settings.recordVoice && app.mic.ready && !(await hasRecordingToday(app.db, word.en));
  let { result, recording } = await teacher.hear([word.en], { record });
  if (recording) {
    await saveRecording(app, lesson.id, word.en, recording);
    record = false;
  }
  if (result === RESULT.SILENT) {
    // Bé chưa nói: lúc này Bông mới mời bé nói.
    await teacher.say(`Can you say ${word.en}?`);
    ({ result, recording } = await teacher.hear([word.en], { record }));
    if (recording) await saveRecording(app, lesson.id, word.en, recording);
  }
  if (spoke(result)) await markSpoke(app, word.en, word.emoji);

  await teacher.praise(result, picture);
  await teacher.say(`${word.en}!`);
  if (result === RESULT.LISTEN_ONLY) await teacher.say('Good!');
  await teacher.checkPresence();

  await waitAdvance(ctx, { ms: 1200, picture, onPicture: () => teacher.say(`${word.en}!`) });
}
