// Phần B: Hội thoại cùng Bông theo kịch bản có sẵn (SPEC 4.3 B). Dùng lại cho "Học cùng Bông" (4.5).

import { h, wordVisual } from '../ui.js';
import { keywordsFor } from '../match.js';
import { RESULT } from '../speech/listen.js';
import { play } from '../speech/sfx.js';
import { markSpoke, spoke } from './track.js';

/**
 * @param {{ word: string, teacher: string, child: string }} turn
 * @param {string} emoji emoji của từ (để lưu tiến độ)
 */
export async function runConversationStep(ctx, turn, emoji = '') {
  const { app, teacher, stage } = ctx;
  const picture = wordVisual(ctx.visuals.get(turn.word), 'big');
  const hint = h('button.child-hint', { type: 'button', text: turn.child });
  stage.replaceChildren(h('div.word-card', {}, picture, hint));

  // Bé chạm vào câu mẫu thì Bông đọc câu đó.
  const onHint = () => {
    if (!app.speaker.speaking && !app.listening) teacher.say(turn.child).catch(() => {});
  };
  hint.addEventListener('click', onHint);

  try {
    await teacher.say(turn.teacher);
    const keywords = keywordsFor(turn.word, turn.child);
    let { result } = await teacher.hear(keywords);
    if (result === RESULT.SILENT) {
      await teacher.say(`Say: ${turn.child}`);
      ({ result } = await teacher.hear(keywords));
    }
    if (spoke(result)) await markSpoke(app, turn.word, emoji);

    // Bông luôn nói câu mẫu đầy đủ.
    if (result === RESULT.MATCH) {
      play('ding');
      teacher.celebrate(picture);
      teacher.bunny.set('clap');
      await teacher.say(`Yes! ${turn.child}`);
    } else if (result === RESULT.VOICE) {
      play('pop');
      teacher.bunny.set('clap');
      await teacher.say(`Good try! ${turn.child}`);
    } else {
      await teacher.say(turn.child);
      if (result === RESULT.LISTEN_ONLY) await teacher.say('Good!');
    }
    teacher.bunny.set('idle');
    await teacher.checkPresence();
    await teacher.pause(800);
  } finally {
    hint.removeEventListener('click', onHint);
  }
}
