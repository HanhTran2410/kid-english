// Các bước học một câu (SPEC-v1.0 mục 5): A xem và nghe, B làm theo, C nói theo, D chọn hình đúng câu.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { RESULT } from '../speech/listen.js';
import { scaled, abortError } from '../timing.js';
import { phraseKey, pickSaysRound } from '../phrase.js';
import { createScene } from './scene.js';
import { createFlipbook } from './flipbook.js';
import { pickChoices } from './plan.js';
import { waitAdvance } from './stage-kit.js';
import { markPracticed, markSpoke, markDid, markPhrasePick } from './track.js';

const DO_WAIT_MS = 15_000; // không chạm ✔ sau 15 giây thì Bông làm mẫu lại rồi đi tiếp

/**
 * Hình của câu: flipbook nếu bố mẹ đã thêm khung hình, không thì cảnh Bông + emoji có hiệu ứng.
 * Khung hình hỏng thì tự quay về cảnh emoji.
 */
export function phraseVisual(ctx, phrase, { small = false, label = '', urls: given = null } = {}) {
  const urls = given ?? ctx.frameUrls?.get(phrase.id);
  const scene = () => createScene({ emoji: phrase.emoji, motion: phrase.motion, small, label });
  if (!urls?.length) return scene();
  const visual = createFlipbook(urls, {
    small,
    label,
    onError: () => {
      const fallback = scene();
      visual.el.replaceWith(fallback.el);
      visual.el = fallback.el;
      visual.play = fallback.play;
    },
  });
  return visual;
}

/** Cảnh + chữ của câu, cụm đang đọc được tô màu. */
function phraseCard(ctx, phrase) {
  const scene = phraseVisual(ctx, phrase, { label: phrase.en });
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
  await teacher.ask(`Your turn! ${phrase.en}!`, { meaning: phrase.vi });
  const didIt = await waitDid(ctx, did);
  teacher.endQuestion();
  if (didIt) {
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
  // Bé vừa nghe câu ở bước này → bước nói theo không cần đọc lại câu trong lời mời.
  ctx.justHeard = phrase.id;
  await teacher.pause(500);
}

// ---------- F. "Bông says" (SPEC-v1.0 mục 5 F, SPEC-actions mục 4) ----------
// Cuối bài: Bông ra liên tiếp 3–4 lệnh, bé làm theo rồi chạm ✔. Không có câu bẫy, không trừ gì.
export async function runSays(ctx) {
  const { app, teacher, lesson } = ctx;
  const round = pickSaysRound(lesson);
  if (!round.length) return;
  await teacher.say("Let's play! Listen and do!");
  for (const [i, phrase] of round.entries()) {
    const { scene, highlight } = phraseCard(ctx, phrase);
    ctx.stage.querySelector('.phrase-card').classList.add('says');
    highlight('all');
    const did = h('button.did-btn', { type: 'button', 'aria-label': 'Bé đã làm', text: '✔' });
    ctx.stage.querySelector('.phrase-card').append(did);
    scene.play();
    await teacher.ask(`${phrase.en}!`, { meaning: phrase.vi });
    const didIt = await waitDid(ctx, did);
    teacher.endQuestion();
    if (didIt) {
      did.classList.add('done');
      play('ding');
      teacher.celebrate(did);
      teacher.bunny.set('clap');
      await markDid(app, phraseKey(phrase.en), phrase.emoji);
      await teacher.say(i === round.length - 1 ? 'Super! You did them all!' : 'Yes!');
      teacher.bunny.set('idle');
    } else {
      scene.play();
      await teacher.say(`Look! ${phrase.en}!`);
    }
    await teacher.pause(400);
  }
}

// ---------- C. Nói theo (tùy chọn, không bao giờ làm kẹt bài) ----------
// Nối liền bước B: bé vừa nghe câu nên Bông chỉ mời "Now you say it!" (không đọc lại câu).
// Bé nói được thì chỉ khen; chưa nói được / im lặng / không có mic thì Bông đọc mẫu câu một lần.
export async function runSay(ctx, phrase) {
  const { app, teacher } = ctx;
  const { scene, highlight } = phraseCard(ctx, phrase);
  highlight('all');
  const justHeard = ctx.justHeard === phrase.id;
  ctx.justHeard = null;
  if (!justHeard) await teacher.say(`Can you say: ${phrase.en}?`);
  // Không có mic thì teacher.hear tự nói "Your turn!".
  else if (app.mic.ready) await teacher.say('Now you say it!');
  // "Nói được" chỉ khi nghe ra từ khóa bắt buộc (động từ), không chỉ danh từ.
  let { result } = await teacher.hear(phrase.requiredKeywords, { maxMs: 7000 });
  // Im lặng: Bông đọc mẫu cả câu một lần rồi nghe lại; sau đó không đọc lại nữa.
  let modeled = false;
  if (result === RESULT.SILENT) {
    scene.play(1);
    await teacher.say(`${phrase.en}!`);
    modeled = true;
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
  if (result !== RESULT.MATCH && !modeled) {
    highlight('all');
    scene.play(1);
    await teacher.say(`${phrase.en}!`);
  }
  if (result === RESULT.LISTEN_ONLY) await teacher.say('Good!');
  await teacher.checkPresence();
  await teacher.pause(600);
}

// ---------- D. Chọn hình đúng câu ----------
export async function runPick(ctx, phrase) {
  const { lesson } = ctx;
  const ids = lesson.phrases.map((p) => p.id);
  const choices = pickChoices(phrase.id, ids, Math.random, ids.length >= 3 ? 3 : 2);
  const byId = new Map(lesson.phrases.map((p) => [p.id, p]));
  await pickPhrase(ctx, phrase, choices.map((id) => ({ phrase: byId.get(id), urls: ctx.frameUrls?.get(id) })));
}

/**
 * Chọn cảnh đúng câu (dùng chung cho bài câu, Ôn tập, Trò chơi tổng hợp).
 * @param {object} target câu cần chọn
 * @param {{ phrase: object, urls?: string[] }[]} options các lựa chọn (đã xáo trộn, có cả câu đúng); urls: khung hình nếu có
 * @param {{ canAward?: boolean }} [opts] canAward=false: đúng ngay cũng không cộng sao (mục bé chưa học)
 */
export async function pickPhrase(ctx, target, options, { canAward = true } = {}) {
  const { app, teacher } = ctx;
  const scenes = [];
  const buttons = options.map(({ phrase: p, urls }, i) => {
    const scene = phraseVisual(ctx, p, { small: true, urls });
    scenes.push(scene);
    return h('button.choice.phrase-choice', { type: 'button', 'aria-label': p.en, dataset: { i: String(i) } }, scene.el);
  });
  const correct = options.findIndex((o) => o.phrase === target);
  ctx.stage.replaceChildren(h('div.choices', { dataset: { count: String(buttons.length) } }, ...buttons));

  scenes.forEach((s) => s.play(1));
  await teacher.ask(`Which one is: ${target.en}?`, { meaning: target.vi });

  const key = phraseKey(target.en);
  let wrong = 0;
  for (;;) {
    const tapped = await teacher.waitTap(buttons);
    const i = Number(tapped.dataset.i);
    if (i === correct) {
      // +1 chỉ khi đúng ngay lần đầu, tối đa một lần mỗi câu mỗi lượt học (SPEC-v1.0 mục 8).
      const firstTry = wrong === 0;
      const award = firstTry && canAward && !ctx.pickedThisRun.has(key);
      ctx.pickedThisRun.add(key);
      await markPhrasePick(app, key, target.emoji, { firstTry, award });
      tapped.classList.add('correct');
      play('ding');
      teacher.celebrate(tapped);
      teacher.bunny.set('clap');
      await teacher.say(`Yes! ${target.en}!`);
      teacher.bunny.set('idle');
      break;
    }
    wrong++;
    // Chọn sai: không trừ sao, chỉ ghi lịch sử (một lần mỗi câu hỏi).
    if (wrong === 1) await markPhrasePick(app, key, target.emoji, { firstTry: false, award: false });
    play('boing');
    tapped.classList.remove('shake');
    void tapped.offsetWidth;
    tapped.classList.add('shake');
    if (wrong >= 2) {
      buttons[correct]?.classList.add('glow');
      await teacher.say(`This is: ${target.en}!`);
      break;
    }
    await teacher.say(`That's: ${options[i].phrase.en}. Try again!`);
  }
  teacher.endQuestion();
  await teacher.pause(700);
}
