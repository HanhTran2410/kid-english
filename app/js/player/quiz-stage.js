// Phần C: Trò chơi chọn hình (SPEC 4.3 C). Dùng lại cho "Find the…" ở Ôn tập (4.4).

import { h, wordVisual } from '../ui.js';
import { normalizeWord } from '../text.js';
import { play } from '../speech/sfx.js';
import { pickChoices, withArticle } from './plan.js';
import { markPickedRight, markPickedWrong } from './track.js';

/**
 * @param {{ ask: string, answer: string }} question
 * @param {string[]} pool các từ để lấy lựa chọn sai
 * @param {(word: string) => string} emojiOf
 * @param {{ record?: (firstTry: boolean) => Promise<void>, maxChoices?: number }} [options]
 *   record: ghi kết quả lần chọn đầu (mặc định: đúng ngay +1, sai −1 như bài từ vựng); Trò chơi tổng hợp không trừ sao.
 */
export async function runQuizStep(ctx, question, pool, emojiOf, options = {}) {
  const { app, teacher, stage } = ctx;
  const maxChoices = options.maxChoices ?? (pool.length >= 3 ? 3 : 2);
  const record = options.record ?? ((firstTry) => (firstTry
    ? markPickedRight(app, question.answer, emojiOf(question.answer))
    : markPickedWrong(app, question.answer, emojiOf(question.answer))));
  const choices = pickChoices(question.answer, pool, Math.random, maxChoices);
  const answerKey = normalizeWord(question.answer);

  const buttons = choices.map((word) => {
    const btn = h('button.choice', { type: 'button', 'aria-label': word, dataset: { word } },
      wordVisual(ctx.visuals.get(word)));
    return btn;
  });
  stage.replaceChildren(h('div.choices', { dataset: { count: String(buttons.length) } }, ...buttons));

  await teacher.ask(question.ask, { meaning: ctx.meaningOf?.(question.answer) ?? '' });

  let wrong = 0;
  for (;;) {
    const tapped = await teacher.waitTap(buttons);
    const word = tapped.dataset.word;
    if (normalizeWord(word) === answerKey) {
      if (wrong === 0) await record(true);
      tapped.classList.add('correct');
      play('ding');
      teacher.celebrate(tapped);
      teacher.bunny.set('clap');
      await teacher.say(`Great job! ${capitalize(withArticle(question.answer))}!`);
      teacher.bunny.set('idle');
      break;
    }

    wrong++;
    if (wrong === 1) await record(false);
    play('boing');
    tapped.classList.remove('shake');
    void tapped.offsetWidth; // chạy lại hiệu ứng lắc
    tapped.classList.add('shake');

    if (wrong >= 2) {
      // Sai 2 lần: hình đúng phát sáng, Bông chỉ đáp án rồi đi tiếp.
      const right = buttons.find((b) => normalizeWord(b.dataset.word) === answerKey);
      right?.classList.add('glow');
      await teacher.say(`This is the ${question.answer}!`);
      break;
    }
    await teacher.say(`That's ${withArticle(word)}. Try again!`);
  }
  teacher.endQuestion();
  await teacher.pause(700);
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
