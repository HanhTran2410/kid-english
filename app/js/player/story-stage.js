// Phần D: Truyện (SPEC 4.3 D). Chỉ câu có `repeat` mới bật mic, bé nói theo cụm ngắn.

import { h } from '../ui.js';
import { tokenize, normalizeWord } from '../text.js';
import { keywordsFor } from '../match.js';
import { RESULT } from '../speech/listen.js';

/** Tách câu thành các đoạn, tô màu từ khóa trong bài và gắn emoji. */
export function highlightStory(text, words) {
  const entries = words
    .map((w) => ({ w, tokens: tokenize(w.en) }))
    .filter((e) => e.tokens.length)
    .sort((a, b) => b.tokens.length - a.tokens.length);
  const parts = text.split(/(\s+)/);
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    let matched = null;
    for (const { w, tokens } of entries) {
      const slice = [];
      for (let j = i, k = 0; k < tokens.length && j < parts.length; j++) {
        if (/^\s+$/.test(parts[j])) {
          slice.push(parts[j]);
          continue;
        }
        const t = tokenize(parts[j]);
        const ok = t.length === 1 && (t[0] === tokens[k] || t[0] === `${tokens[k]}s`);
        if (!ok) break;
        slice.push(parts[j]);
        k++;
        if (k === tokens.length) matched = { w, length: slice.length };
      }
      if (matched) break;
    }
    if (matched) {
      const chunk = parts.slice(i, i + matched.length).join('');
      out.push(h('mark.keyword', {}, chunk, h('span.keyword-emoji', { text: matched.w.emoji })));
      i += matched.length - 1;
    } else {
      out.push(parts[i]);
    }
  }
  return out;
}

export async function runStoryStep(ctx, line) {
  const { teacher, stage, lesson } = ctx;
  stage.replaceChildren(h('div.story-line', {}, ...highlightStory(line.text, lesson.words)));

  await teacher.say(line.text);
  if (!line.repeat) {
    await teacher.pause(1200);
    return;
  }

  await teacher.pause(300);
  stage.append(h('div.repeat-hint', { text: line.repeat }));
  await teacher.say(`Your turn: ${line.repeat}`);
  const keywords = keywordsFor('', line.repeat);
  const { result } = await teacher.hear(keywords.length ? keywords : [normalizeWord(line.repeat)]);
  await teacher.praise(result);
  await teacher.say(line.repeat);
  if (result === RESULT.LISTEN_ONLY) await teacher.say('Good!');
  await teacher.checkPresence();
  await teacher.pause(600);
}
