// Các bước của mục Toán (SPEC-math mục 3, 4): xem Bông làm mẫu, một câu hỏi (chờ bé, sai lần 1 / 2, không chạm,
// hiện đáp án). Bộ hình riêng cho từng kiểu bài: To – nhỏ (`size`) và Nhiều – ít (`count`).

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { scaled, abortError, isAbort } from '../timing.js';
import { numberWord } from '../numbers.js';
import { MATH_ITEM, lessonItems, askLine, answerLine, wrongLine, SCATTER_CELLS } from '../math.js';

const ASK_WAIT_MS = 15_000; // chờ 15 giây từ khi Bông đọc xong câu hỏi (mục 3.4)
const AGAIN_WAIT_MS = 10_000; // nhắc lại một lần, chờ thêm 10 giây rồi hiện đáp án
const REVEAL_HOLD_MS = 1500; // hiện đáp án: giữ 1,5 giây sau khi Bông nói xong (mục 3.5)
const RIGHT_HOLD_MS = 700;
const SPOKEN = Symbol('spoken');

const Word = (n) => {
  const w = numberWord(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
};

// ---------- Hình ----------

/** Một đồ To – nhỏ: emoji cùng một ký tự, khác cỡ (`--s`); vùng chạm luôn ≥ 64 px. */
function sizeThing(item, side, scale, tag = 'button') {
  return h(`${tag}.mt-thing`, {
    type: tag === 'button' ? 'button' : undefined,
    'aria-label': `${item.en} ${side === 'left' ? 'bên trái' : 'bên phải'}`,
    dataset: { pick: side },
    style: { '--s': String(scale) },
  }, h('span.mt-emoji', { text: item.emoji }));
}

function sizeView(q) {
  const item = MATH_ITEM.get(q.item);
  const left = sizeThing(item, 'left', q.left.scale);
  const right = sizeThing(item, 'right', q.right.scale);
  return { el: h('div.mt-pair', {}, left, right), targets: [left, right], byPick: { left, right } };
}

/**
 * Một đĩa của Nhiều – ít: đồ trong đĩa chạm để đếm (đếm riêng từng đĩa, từ 1); chạm nền đĩa hoặc nút 👆 để chọn đĩa.
 * Mức 3: đồ rải trong lưới 4 × 3 ô (mỗi ô tối đa một đồ, không chồng nhau).
 */
function plate(ctx, item, side, data) {
  const things = Array.from({ length: data.count }, (_, k) => h('button.mt-count', {
    type: 'button', 'aria-label': item.en,
    style: data.cells ? { gridArea: `${Math.floor(data.cells[k] / 4) + 1} / ${(data.cells[k] % 4) + 1}` } : null,
  }, h('span.mt-count-emoji', { text: item.emoji }), h('span.mt-count-no')));
  let counted = 0;
  const reset = () => {
    counted = 0;
    for (const t of things) {
      t.classList.remove('counted');
      t.querySelector('.mt-count-no').textContent = '';
    }
  };
  const mark = (t) => {
    counted++;
    t.classList.add('counted');
    t.querySelector('.mt-count-no').textContent = String(counted);
    return counted;
  };
  for (const t of things) {
    t.addEventListener('click', (event) => {
      event.stopPropagation(); // chạm đồ là để đếm, không phải chọn đĩa
      if (!ctx.counting) return;
      if (t.classList.contains('counted')) {
        t.classList.remove('nudge');
        void t.offsetWidth;
        t.classList.add('nudge');
        return;
      }
      play('tap');
      ctx.teacher.say(Word(mark(t))).catch(() => {}); // không chờ: bé chạm nhanh thì số sau cắt số trước
    });
  }
  const rows = data.cells ? null : chunk(things, 5);
  const dish = h(`div.mt-plate${data.cells ? '.scatter' : ''}`, {},
    ...(rows ? rows.map((r) => h('div.mt-plate-row', {}, ...r)) : things));
  const box = h('div.mt-plate-box', { role: 'button', tabindex: '0', 'aria-label': `Đĩa ${side === 'left' ? 'bên trái' : 'bên phải'}`, dataset: { pick: side } },
    dish, h('span.mt-pick', { text: '👆', 'aria-hidden': 'true' }));
  return { box, things, reset, mark };
}

const chunk = (list, n) => Array.from({ length: Math.ceil(list.length / n) }, (_, i) => list.slice(i * n, i * n + n));

function countView(ctx, q) {
  const item = MATH_ITEM.get(q.item);
  const left = plate(ctx, item, 'left', q.left);
  const right = plate(ctx, item, 'right', q.right);
  const same = q.level >= 3
    ? h('button.mt-same', { type: 'button', 'aria-label': 'The same', dataset: { pick: 'same' } }, h('span.mt-same-sign', { text: '=', 'aria-hidden': 'true' }), h('span', { text: 'The same' }))
    : null;
  const el = h(`div.mt-plates${same ? '.has-same' : ''}`, {}, left.box, same, right.box);
  return { el, targets: [left.box, right.box, ...(same ? [same] : [])], byPick: { left: left.box, right: right.box, same }, plates: { left, right } };
}

export const viewFor = (ctx, q) => (q.type in { more: 1, fewer: 1, same: 1 } ? countView(ctx, q) : sizeView(q));

// ---------- Chờ bé chạm ----------

/** Chờ bé chạm một trong các phần tử; `arm(ms)`: hết giờ thì trả về null. Rời bước (▶, 🏠) thì dừng. */
function pickWaiter(ctx, targets) {
  let timer = null;
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const cleanup = () => {
    clearTimeout(timer);
    for (const t of targets) t.removeEventListener('click', onTap);
    ctx.signal.removeEventListener('abort', onAbort);
  };
  const onTap = (event) => {
    cleanup();
    resolve(event.currentTarget);
  };
  const onAbort = () => {
    cleanup();
    reject(abortError());
  };
  for (const t of targets) t.addEventListener('click', onTap);
  ctx.signal.addEventListener('abort', onAbort, { once: true });
  promise.catch(() => {});
  return {
    promise,
    arm(ms) {
      timer = setTimeout(() => {
        cleanup();
        resolve(null);
      }, scaled(ms));
    },
  };
}

/**
 * Bông hỏi (bé chạm được ngay cả khi Bông đang hỏi — câu hỏi bị cắt), chờ 15 giây từ khi đọc xong; không chạm thì
 * nhắc lại MỘT lần, chờ thêm 10 giây; vẫn không chạm → null. Chỉ nghe chạm lúc đang chờ: lúc Bông khen / sửa thì không.
 */
async function askAndWait(ctx, targets, line, first) {
  const { teacher, app } = ctx;
  const rounds = [
    [() => (first ? teacher.ask(line.en, { vi: line.vi }) : teacher.say(line.en)), ASK_WAIT_MS],
    [() => teacher.say(line.en), AGAIN_WAIT_MS],
  ];
  for (const [speak, wait] of rounds) {
    const w = pickWaiter(ctx, targets);
    const spoken = speak().then(() => SPOKEN, (err) => {
      if (isAbort(err) && ctx.signal.aborted) throw err;
      return SPOKEN;
    });
    let got = await Promise.race([w.promise, spoken]);
    if (got === SPOKEN) {
      w.arm(wait);
      got = await w.promise;
    } else {
      app.speaker.cancel();
    }
    if (got) return got;
  }
  return null;
}

/** Sai: chỉ đồ được chọn lắc nhẹ (giảm chuyển động: viền cam), không có tiếng báo sai. */
function nudgeWrong(el) {
  el.classList.remove('mt-wrong');
  void el.offsetWidth;
  el.classList.add('mt-wrong');
}

/** Hiện đáp án: phát sáng (viền + nền, không chỉ chuyển động), Bông nói câu mẫu, giữ 1,5 giây sau khi nói xong. */
export async function revealAnswer(ctx, q, view) {
  const { teacher } = ctx;
  view.byPick[q.answer]?.classList.add('mt-glow');
  ctx.counting = false;
  const line = answerLine(q);
  await teacher.say(`Look! ${line.en}`);
  await teacher.pause(REVEAL_HOLD_MS);
}

/**
 * Một câu hỏi. Biết kết quả là gọi `state.commit(result)` ngay (trước câu khen / hiện đáp án) để lưu chỗ học;
 * `state.committed` cho người gọi biết ▶ là "bỏ qua câu" hay "sang câu sau". `state.wrong`: số lần chạm sai.
 */
export async function runQuestion(ctx, q, state) {
  const { teacher } = ctx;
  const view = viewFor(ctx, q);
  state.view = view;
  state.wrong = 0;
  ctx.stage.replaceChildren(h('div.mt-question', { dataset: { type: q.type, answer: q.answer, level: String(q.level) } }, view.el));
  ctx.counting = true;
  const line = askLine(q);
  for (let first = true; ; first = false) {
    const picked = await askAndWait(ctx, view.targets, line, first);
    if (!picked) {
      // Không chạm: hiện đáp án, không tính đúng / sai, không có tiếng báo sai.
      teacher.endQuestion();
      await state.commit({ first: false, wrong: state.wrong, revealed: true });
      await revealAnswer(ctx, q, view);
      return;
    }
    const pick = picked.dataset.pick;
    if (pick === q.answer) {
      teacher.endQuestion();
      ctx.counting = false;
      await state.commit({ first: state.wrong === 0, wrong: state.wrong, revealed: false });
      picked.classList.add('mt-right');
      play('ding');
      teacher.celebrate(picked);
      teacher.bunny.set('clap');
      await teacher.say(`Yes! ${answerLine(q).en}`);
      teacher.bunny.set('idle');
      await teacher.pause(RIGHT_HOLD_MS);
      return;
    }
    state.wrong++;
    nudgeWrong(picked);
    if (state.wrong >= 2) {
      teacher.endQuestion();
      await state.commit({ first: false, wrong: state.wrong, revealed: true });
      await revealAnswer(ctx, q, view);
      return;
    }
    await teacher.say(wrongLine(q, pick).en);
  }
}

// ---------- Xem Bông làm mẫu (mục 3.1) ----------

/** Chờ bé bấm ▶ (không tự chuyển lượt); chạm đồ vật thì Bông nói lại từ của đồ đó. */
function waitNext(ctx, words) {
  const { signal, teacher, app } = ctx;
  return new Promise((_, reject) => {
    const entries = [...words];
    const onTap = (event) => {
      if (app.speaker.speaking) return;
      const word = words.get(event.currentTarget);
      play('tap');
      teacher.say(word).catch(() => {});
    };
    for (const [el] of entries) el.addEventListener('click', onTap);
    signal.addEventListener('abort', () => {
      for (const [el] of entries) el.removeEventListener('click', onTap);
      reject(abortError());
    }, { once: true });
    ctx.nextBtn.classList.add('mt-next-hint');
  });
}

const pop = (el, cls) => {
  el.classList.remove('mt-grow', 'mt-shrink');
  void el.offsetWidth;
  el.classList.add(cls);
};

/** To – nhỏ: hai lượt với đồ của bài (đổi bên), lượt 3 vui: con voi và con chuột. */
async function sizeDemo(ctx, k) {
  const { teacher, lesson } = ctx;
  const items = lessonItems(lesson);
  const er = ctx.level >= 3;
  let big;
  let small;
  let lines;
  if (k < 2) {
    const item = items[k % items.length];
    const bigLeft = k === 0;
    big = sizeThing(item, bigLeft ? 'left' : 'right', 2.2, 'button');
    small = sizeThing(item, bigLeft ? 'right' : 'left', 1, 'button');
    lines = er ? [`This ${item.en} is bigger.`, `That ${item.en} is smaller.`] : [`This ${item.en} is big.`, `That ${item.en} is small.`];
    ctx.stage.replaceChildren(h('div.mt-question.demo', {}, h('div.mt-pair', {}, ...(bigLeft ? [big, small] : [small, big]))));
  } else {
    const elephant = MATH_ITEM.get('elephant');
    const mouse = MATH_ITEM.get('mouse');
    big = sizeThing(elephant, 'left', 2.2, 'button');
    small = sizeThing(mouse, 'right', 1, 'button');
    lines = ['The elephant is big.', 'The mouse is small.', 'The elephant is bigger than the mouse!'];
    ctx.stage.replaceChildren(h('div.mt-question.demo', {}, h('div.mt-pair', {}, big, small)));
  }
  await teacher.pause(400);
  pop(big, 'mt-grow');
  await teacher.say(lines[0]);
  pop(small, 'mt-shrink');
  await teacher.say(lines[1]);
  if (lines[2]) {
    pop(big, 'mt-grow');
    await teacher.say(lines[2]);
  }
  const say = er ? ['Bigger!', 'Smaller!'] : ['Big!', 'Small!'];
  await waitNext(ctx, new Map([[big, say[0]], [small, say[1]]]));
}

/** Nhiều – ít: lượt 1 "more", lượt 2 "fewer", lượt 3 "the same" (mức 3) — Bông đếm mẫu từng đĩa trước. */
async function countDemo(ctx, k) {
  const { teacher, lesson } = ctx;
  const items = lessonItems(lesson);
  const item = items[k % items.length];
  const kind = k === 0 ? 'more' : k === 1 ? 'fewer' : ctx.level >= 3 ? 'same' : 'more';
  const [l, r] = kind === 'same' ? [3, 3] : kind === 'more' ? [4, 2] : [2, 4];
  const q = { type: kind, level: Math.min(ctx.level, 2), item: item.id, left: { count: l }, right: { count: r } };
  const view = countView({ ...ctx, counting: false }, q);
  ctx.stage.replaceChildren(h('div.mt-question.demo', {}, view.el));
  await teacher.pause(400);
  if (k === 0) await teacher.say("Let's count!");
  for (const side of ['left', 'right']) {
    const p = view.plates[side];
    p.box.classList.add('mt-focus');
    for (const t of p.things) {
      const n = p.mark(t);
      await teacher.say(Word(n));
    }
    await teacher.say(`This plate has ${numberWord(q[side].count)} ${q[side].count === 1 ? item.en : item.plural}.`);
    p.box.classList.remove('mt-focus');
  }
  if (kind === 'same') {
    view.plates.left.box.classList.add('mt-glow');
    view.plates.right.box.classList.add('mt-glow');
    await teacher.say('They are the same!');
  } else {
    // "more": đĩa trái nhiều hơn; "fewer": đĩa trái ít hơn — Bông luôn nói về đĩa trái.
    view.plates.left.box.classList.add('mt-glow');
    await teacher.say(`This plate has ${kind} ${item.plural}!`);
  }
  await waitNext(ctx, new Map([[view.plates.left.box, kind === 'fewer' ? 'Fewer!' : kind === 'same' ? 'The same!' : 'More!'],
    [view.plates.right.box, kind === 'fewer' ? 'More!' : kind === 'same' ? 'The same!' : 'Fewer!']]));
}

export const runDemo = (ctx, k) => (ctx.lesson.skill === 'count' ? countDemo(ctx, k) : sizeDemo(ctx, k));
