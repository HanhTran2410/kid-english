// Phần A: Thẻ từ — nghe và nói lại (SPEC 4.3 A).

import { h, wordVisual } from '../ui.js';
import { normalizeWord } from '../text.js';
import { hasRecordingToday } from '../db.js';
import { RESULT } from '../speech/listen.js';
import { waitAdvance } from './stage-kit.js';
import { markPracticed, markSpoke, saveRecording, spoke } from './track.js';

export async function runWordStep(ctx, word) {
  const { app, teacher, stage, lesson } = ctx;
  const picture = wordVisual(ctx.visuals.get(word.en), 'big tappable');
  stage.replaceChildren(h('div.word-card', {}, picture, h('div.word-label', { text: word.en })));

  await markPracticed(app, word.en, word.emoji);

  await teacher.say(`${word.en}!`);
  const key = normalizeWord(word.en);
  if (!ctx.viSpoken.has(key) && app.settings.readVietnamese && app.speaker.hasVietnamese) {
    ctx.viSpoken.add(key);
    await teacher.sayVi(`${word.vi}!`);
  }
  await teacher.pause(400);
  await teacher.say(`Can you say ${word.en}?`);

  const record = app.settings.recordVoice && app.mic.ready && !(await hasRecordingToday(app.db, word.en));
  const { result, recording } = await teacher.hear([word.en], { record });
  if (recording) await saveRecording(app, lesson.id, word.en, recording);
  if (spoke(result)) await markSpoke(app, word.en, word.emoji);

  await teacher.praise(result, picture);
  await teacher.say(`${word.en}!`);
  if (result === RESULT.LISTEN_ONLY) await teacher.say('Good!');
  await teacher.checkPresence();

  await waitAdvance(ctx, { ms: 2000, picture, onPicture: () => teacher.say(`${word.en}!`) });
}
