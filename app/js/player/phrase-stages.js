// Các bước học một câu (SPEC-v1.0 mục 5): A xem và nghe, B làm theo, C nói theo, D chọn hình đúng câu.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { RESULT } from '../speech/listen.js';
import { scaled, abortError } from '../timing.js';
import { phraseKey } from '../phrase.js';
import { createScene } from './scene.js';
import { pickChoices } from './plan.js';
import { waitAdvance } from './stage-kit.js';
import { markPracticed, markSpoke, markDid, markPhrasePick } from './track.js';

const DO_WAIT_MS = 15_000; // không chạm ✔ sau 15 giây thì Bông làm mẫu lại rồi đi tiếp

/** Cảnh + chữ của câu, cụm đang đọc được tô màu. */
function phraseCard(ctx, phrase) {
  const scene = createScene({ emoji: phrase.emoji, motion: phrase.motion, label: phrase.en });
  const chunks = phrase.chunks.map((c) => h('span.chunk', { text: c }));
  const text = h('div.phrase-text', {}, ...chunks.flatMap((c, i) => (i ? [' ', c] : [c])));
  ctx.stage.replaceChildren(h('div.phrase-card', {}, scene.el, text));
  const highlight = (i) => chunks.forEach((c, k) => c.classList.toggle('on', i === 'all' || k === i));
  return { scene, highlight };
}

/** Bông đọc từng cụm rồi cả câu: "Wash… your face… Wash your face!" */
async function sayInChunks(teacher, phrase, highlight) {
  if (phrase.chunks.length > 1) {
    for (const [i, chunk] of phrase.chunks.entries()) {
      highlight(i);
      await teacher.say(chunk);
      await teacher.pause(200);
    }
  }
  highlight('all');
  await teacher.say(`${phrase.en}!`);
}

// ---------- A. Xem và nghe ----------
export async function runWatch(ctx, phrase) {
  const { app, teacher } = ctx;
  const { scene, highlight } = phraseCard(ctx, phrase);
  await markPracticed(app, phraseKey(phrase.en), phrase.emoji);
  scene.play();
  await sayInChunks(teacher, phrase, highlight);
  await waitAdvance(ctx, {
    ms: 1200,
    picture: scene.el,
    onPicture: async () => {
      scene.play();
      await sayInChunks(teacher, phrase, highlight);
    },
  });
}

/** Chờ bé (hoặc bố mẹ) chạm ✔; hết giờ thì trả về false. Chạm nhiều lần chỉ tính một. */
function waitDid(ctx, button) {
  return new Promise((resolve, reject) => {
    const { signal } = ctx;
    const done = (value) => {
      clearTimeout(timer);
      button.removeEventListener('click', onTap);
      signal.removeEventListener('abort', onAbort);
      resolve(value);
    };
    const onTap = () => done(true);
    const onAbort = () => {
      clearTimeout(timer);
      button.removeEventListener('click', onTap);
      reject(abortError());
    };
    const timer = setTimeout(() => done(false), scaled(DO_WAIT_MS));
    button.addEventListener('click', onTap, { once: true });
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

// ---------- B. Làm theo (TPR) ----------
export async function runDo(ctx, phrase) {
  const { app, teacher } = ctx;
  const { scene, highlight } = phraseCard(ctx, phrase);
  highlight('all');
  const did = h('button.did-btn', { type: 'button', 'aria-label': 'Bé đã làm', text: '✔' });
  ctx.stage.querySelector('.phrase-card').append(did);

  scene.play();
  await teacher.say(`Your turn! ${phrase.en}!`);
  if (await waitDid(ctx, did)) {
    did.classList.add('done');
    play('ding');
    teacher.celebrate(did);
    teacher.bunny.set('clap');
    await markDid(app, phraseKey(phrase.en), phrase.emoji);
    await teacher.say('Great job!');
    teacher.bunny.set('idle');
  } else {
    // Bé chưa làm: Bông làm mẫu lại một lần rồi đi tiếp, không trừ gì.
    scene.play();
    await teacher.say(`Look! ${phrase.en}!`);
  }
  await teacher.pause(500);
}

// ---------- C. Nói theo (tùy chọn, không bao giờ làm kẹt bài) ----------
export async function runSay(ctx, phrase) {
  const { app, teacher } = ctx;
  const { scene, highlight } = phraseCard(ctx, phrase);
  highlight('all');
  await teacher.say(`Can you say: ${phrase.en}?`);
  // "Nói được" chỉ khi nghe ra từ khóa bắt buộc (động từ), không chỉ danh từ.
  let { result } = await teacher.hear(phrase.requiredKeywords, { maxMs: 7000 });
  if (result === RESULT.SILENT) {
    await sayInChunks(teacher, phrase, highlight);
    ({ result } = await teacher.hear(phrase.requiredKeywords, { maxMs: 7000 }));
  }
  if (result === RESULT.MATCH) {
    await markSpoke(app, phraseKey(phrase.en), phrase.emoji);
    play('ding');
    teacher.celebrate(scene.el);
    teacher.bunny.set('clap');
    await teacher.say('Great job!');
  } else if (result === RESULT.VOICE) {
    play('pop');
    teacher.bunny.set('clap');
    await teacher.say('Good try!');
  }
  teacher.bunny.set('idle');
  highlight('all');
  scene.play(1);
  await teacher.say(`${phrase.en}!`);
  if (result === RESULT.LISTEN_ONLY) await teacher.say('Good!');
  await teacher.checkPresence();
  await teacher.pause(600);
}

// ---------- D. Chọn hình đúng câu ----------
export async function runPick(ctx, phrase) {
  const { app, teacher, lesson } = ctx;
  const ids = lesson.phrases.map((p) => p.id);
  const choices = pickChoices(phrase.id, ids, Math.random, ids.length >= 3 ? 3 : 2);
  const byId = new Map(lesson.phrases.map((p) => [p.id, p]));
  const scenes = [];
  const buttons = choices.map((id) => {
    const p = byId.get(id);
    const scene = createScene({ emoji: p.emoji, motion: p.motion, small: true });
    scenes.push(scene);
    return h('button.choice.phrase-choice', { type: 'button', 'aria-label': p.en, dataset: { id } }, scene.el);
  });
  ctx.stage.replaceChildren(h('div.choices', { dataset: { count: String(buttons.length) } }, ...buttons));

  scenes.forEach((s) => s.play(1));
  await teacher.say(`Which one is: ${phrase.en}?`);

  const key = phraseKey(phrase.en);
  let wrong = 0;
  for (;;) {
    const tapped = await teacher.waitTap(buttons);
    if (tapped.dataset.id === phrase.id) {
      // +1 chỉ khi đúng ngay lần đầu, tối đa một lần mỗi câu mỗi lượt học (SPEC-v1.0 mục 8).
      const firstTry = wrong === 0;
      const award = firstTry && !ctx.pickedThisRun.has(key);
      ctx.pickedThisRun.add(key);
      await markPhrasePick(app, key, phrase.emoji, { firstTry, award });
      tapped.classList.add('correct');
      play('ding');
      teacher.celebrate(tapped);
      teacher.bunny.set('clap');
      await teacher.say(`Yes! ${phrase.en}!`);
      teacher.bunny.set('idle');
      break;
    }
    wrong++;
    // Chọn sai: không trừ sao, chỉ ghi lịch sử (một lần mỗi câu hỏi).
    if (wrong === 1) await markPhrasePick(app, key, phrase.emoji, { firstTry: false, award: false });
    play('boing');
    tapped.classList.remove('shake');
    void tapped.offsetWidth;
    tapped.classList.add('shake');
    if (wrong >= 2) {
      buttons.find((b) => b.dataset.id === phrase.id)?.classList.add('glow');
      await teacher.say(`This is: ${phrase.en}!`);
      break;
    }
    await teacher.say(`That's: ${byId.get(tapped.dataset.id).en}. Try again!`);
  }
  await teacher.pause(700);
}
