// Các bước của mục Toán (SPEC-math mục 3, 4): xem Bông làm mẫu, một câu hỏi (chờ bé, sai lần 1 / 2, không chạm,
// hiện đáp án). Bộ hình riêng cho từng kiểu bài: To – nhỏ / Cao – thấp / Dài – ngắn (`size`), Nhiều – ít (`count`),
// Nhỏ – vừa – to (`order`, kéo thả), Nặng – nhẹ (`weight`, bập bênh).

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { scaled, abortError, isAbort } from '../timing.js';
import { numberWord } from '../numbers.js';
import {
  MATH_ITEM, DIMS, ORDER_SCALES, ORDER_WORDS, lessonItems, useOf, askLine, answerLine, wrongLine,
} from '../math.js';

const ASK_WAIT_MS = 15_000; // chờ 15 giây từ khi Bông đọc xong câu hỏi (mục 3.4)
const AGAIN_WAIT_MS = 10_000; // nhắc lại một lần, chờ thêm 10 giây rồi hiện đáp án
const REVEAL_HOLD_MS = 1500; // hiện đáp án: giữ 1,5 giây sau khi Bông nói xong (mục 3.5)
const RIGHT_HOLD_MS = 700;
const TILT_MS = 900; // bập bênh nghiêng xong (0,6 giây) rồi mới hỏi (mục 4.6)
const SPOKEN = Symbol('spoken');

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const Word = (n) => cap(numberWord(n));

// ---------- Hình ----------

const INK = '#3d2c5e';
/**
 * Hình kéo giãn được (mục 4.3): chỉ thân dài ra, phần đầu / ngọn giữ nguyên. Cao – thấp: khung rộng 60, cao 100 × s
 * (chung đường đáy); dài – ngắn: khung cao 30, dài 100 × s (thẳng đầu trái).
 */
const SHAPES = {
  tree: (H) => `<rect x="23" y="44" width="14" height="${H - 46}" rx="3" fill="#a0673a" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="30" cy="27" rx="28" ry="25" fill="#51cf66" stroke="${INK}" stroke-width="3"/>
    <circle cx="20" cy="22" r="4" fill="#8ce99a"/>`,
  flower: (H) => `<rect x="27" y="30" width="6" height="${H - 32}" fill="#40c057" stroke="${INK}" stroke-width="2"/>
    <ellipse cx="40" cy="${Math.max(48, H * 0.6)}" rx="10" ry="5" fill="#69db7c" stroke="${INK}" stroke-width="2"/>
    <circle cx="30" cy="20" r="18" fill="#ffd43b" stroke="${INK}" stroke-width="3"/><circle cx="30" cy="20" r="7" fill="#a0673a"/>`,
  candle: (H) => `<rect x="17" y="24" width="26" height="${H - 26}" rx="4" fill="#74c0fc" stroke="${INK}" stroke-width="3"/>
    <line x1="30" y1="24" x2="30" y2="16" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="30" cy="10" rx="6" ry="9" fill="#ff922b" stroke="${INK}" stroke-width="2"/>`,
  pencil: (W) => `<rect x="2" y="5" width="12" height="20" rx="3" fill="#faa2c1" stroke="${INK}" stroke-width="2.5"/>
    <rect x="14" y="5" width="${W - 34}" height="20" fill="#ffd43b" stroke="${INK}" stroke-width="2.5"/>
    <polygon points="${W - 20},5 ${W - 2},15 ${W - 20},25" fill="#ffe8cc" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
    <polygon points="${W - 8},12 ${W - 2},15 ${W - 8},18" fill="${INK}"/>`,
  snake: (W) => `<rect x="2" y="9" width="${W - 18}" height="13" rx="6.5" fill="#69db7c" stroke="${INK}" stroke-width="2.5"/>
    <ellipse cx="${W - 14}" cy="15" rx="12" ry="10" fill="#69db7c" stroke="${INK}" stroke-width="2.5"/>
    <circle cx="${W - 10}" cy="12" r="2" fill="${INK}"/>`,
  train: (W) => `<rect x="2" y="6" width="${W - 40}" height="16" rx="3" fill="#ff6b6b" stroke="${INK}" stroke-width="2.5"/>
    <rect x="${W - 38}" y="2" width="34" height="20" rx="4" fill="#4dabf7" stroke="${INK}" stroke-width="2.5"/>
    ${Array.from({ length: Math.max(2, Math.floor((W - 8) / 22)) }, (_, i) => `<circle cx="${10 + i * 22}" cy="25" r="4" fill="${INK}"/>`).join('')}`,
};
function shapeSvg(item, scale, dim) {
  const len = Math.round(100 * scale);
  const box = dim === 'tall' ? `0 0 60 ${len}` : `0 0 ${len} 30`;
  return `<svg viewBox="${box}" aria-hidden="true" focusable="false">${SHAPES[item.svg](len)}</svg>`;
}

/** Một đồ để so sánh: emoji khác cỡ (`size`) hoặc hình kéo giãn (`tall`, `long`); vùng chạm luôn ≥ 64 px. */
function thing(item, side, scale, dim = 'size') {
  const where = dim === 'long' ? (side === 'left' ? 'ở trên' : 'ở dưới') : side === 'left' ? 'bên trái' : 'bên phải';
  const shaped = (dim === 'tall' || dim === 'long') && item.svg;
  return h(`button.mt-thing${shaped ? `.mt-svg.${dim}` : ''}`, {
    type: 'button', 'aria-label': `${item.en} ${where}`, dataset: { pick: side }, style: { '--s': String(scale) },
  }, shaped ? h('span.mt-shape', { html: shapeSvg(item, scale, dim) }) : h('span.mt-emoji', { text: item.emoji }));
}

/** Hai đồ: chung đường đáy (to – nhỏ, cao – thấp); dài – ngắn xếp trên – dưới, thẳng đầu trái. */
function sizeView(q) {
  const item = MATH_ITEM.get(q.item);
  const dim = q.dim ?? 'size';
  const left = thing(item, 'left', q.left.scale, dim);
  const right = thing(item, 'right', q.right.scale, dim);
  return { el: h(`div.mt-pair.${dim}`, {}, left, right), targets: [left, right], byPick: { left, right } };
}

/**
 * Bập bênh (mục 4.6): hai đồ cùng cỡ hình trên hai đầu ván; `settle()` nghiêng ván về bên nặng — góc nghiêng luôn
 * như nhau, không theo cỡ hình — rồi chờ ván dừng hẳn.
 */
function weightView(q) {
  const at = (side) => h('button.mt-thing.mt-on-plank', {
    type: 'button', 'aria-label': `${MATH_ITEM.get(q[side].item).en} ${side === 'left' ? 'bên trái' : 'bên phải'}`, dataset: { pick: side },
  }, h('span.mt-emoji', { text: MATH_ITEM.get(q[side].item).emoji }));
  const left = at('left');
  const right = at('right');
  const plank = h('div.mt-plank', {}, left, right);
  const el = h('div.mt-seesaw', {}, plank, h('span.mt-fulcrum', { 'aria-hidden': 'true' }));
  const heavyLeft = q.left.item === q.heavy;
  return {
    el, targets: [left, right], byPick: { left, right },
    async settle(teacher) {
      await teacher.pause(300);
      el.dataset.tilt = heavyLeft ? 'left' : 'right';
      await teacher.pause(TILT_MS);
    },
  };
}

/**
 * Nhỏ – vừa – to (mục 4.5): 3 ô đích trên kệ (từ nhỏ đến to, trái → phải) và 3 đồ trong khay để kéo.
 * Mức 1: ô có bóng mờ đúng cỡ đồ; mức 2: chỉ còn viền đúng cỡ; mức 3: ba ô bằng nhau, không gợi ý.
 * Thả vào ô → phát sự kiện `mtdrop` { item, slot }; không ai nhận (Bông đang nói) hoặc thả ra ngoài thì đồ bay về.
 */
function orderView(q) {
  const item = MATH_ITEM.get(q.item);
  const slots = ORDER_SCALES.map((s, i) => h('div.mt-slot', {
    dataset: { slot: String(i) }, style: { '--s': String(q.level >= 3 ? ORDER_SCALES[2] : s) },
  }, q.level <= 1 ? h('span.mt-ghost.mt-emoji', { text: item.emoji, style: { '--s': String(s) }, 'aria-hidden': 'true' }) : null));
  const items = q.tray.map((rank) => h('button.mt-thing.mt-drag', {
    type: 'button', 'aria-label': `${item.en} ${ORDER_WORDS[rank]}`, dataset: { rank: String(rank) }, style: { '--s': String(ORDER_SCALES[rank]) },
  }, h('span.mt-emoji', { text: item.emoji })));
  const tray = h('div.mt-tray', {}, ...items);
  const el = h(`div.mt-order${q.level >= 2 ? '.no-ghost' : ''}${q.level >= 3 ? '.even' : ''}`, {}, h('div.mt-shelf', {}, ...slots), tray);
  const view = {
    el, items, slots, targets: [el], byPick: {},
    place(it, slot) {
      it.classList.remove('dragging', 'mt-return', 'mt-wrong');
      it.style.translate = '';
      it.classList.add('placed');
      slots[slot].querySelector('.mt-ghost')?.remove();
      slots[slot].append(it);
    },
    back(it) {
      it.classList.remove('dragging');
      it.classList.add('mt-return');
      it.style.translate = '';
    },
    placed: () => items.filter((it) => it.classList.contains('placed')).length,
    /** Hiện đáp án: Bông đặt nốt các đồ vào đúng ô, ô sáng lên. */
    reveal() {
      for (const it of items) if (!it.classList.contains('placed')) view.place(it, Number(it.dataset.rank));
      for (const s of slots) s.classList.add('mt-glow');
    },
  };
  for (const it of items) draggable(view, it);
  return view;
}

/** Kéo bằng pointer (chuột, ngón tay, bút): đồ đi theo ngón tay, thả ra thì báo ô dưới ngón tay. */
function draggable(view, it) {
  let start = null;
  it.addEventListener('pointerdown', (e) => {
    if (it.classList.contains('placed') || start) return;
    e.preventDefault();
    it.setPointerCapture?.(e.pointerId);
    start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    it.classList.remove('mt-return', 'mt-wrong');
    it.classList.add('dragging');
  });
  it.addEventListener('pointermove', (e) => {
    if (!start || e.pointerId !== start.id) return;
    it.style.translate = `${e.clientX - start.x}px ${e.clientY - start.y}px`;
  });
  const end = (e, cancelled = false) => {
    if (!start || e.pointerId !== start.id) return;
    start = null;
    const slot = cancelled ? null : view.slots.find((s) => {
      const r = s.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if (!slot) {
      view.back(it);
      return;
    }
    const detail = { item: it, slot: Number(slot.dataset.slot), handled: false };
    view.el.dispatchEvent(new CustomEvent('mtdrop', { detail }));
    if (!detail.handled) view.back(it);
  };
  it.addEventListener('pointerup', (e) => end(e));
  it.addEventListener('pointercancel', (e) => end(e, true));
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
  return { box, things, mark };
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

export function viewFor(ctx, q) {
  if (['more', 'fewer', 'same'].includes(q.type)) return countView(ctx, q);
  if (q.type === 'order') return orderView(q);
  if (q.dim === 'weight') return weightView(q);
  return sizeView(q);
}

// ---------- Chờ bé chạm / thả ----------

/**
 * Chờ một sự kiện trên các phần tử (mặc định: chạm); `arm(ms)`: hết giờ thì trả về null. Rời bước (▶, 🏠) thì dừng.
 * `value(event)` được gọi ngay lúc nhận (đánh dấu đã nhận cho người phát sự kiện), trả về kết quả.
 */
function eventWaiter(ctx, targets, type = 'click', value = (e) => e.currentTarget) {
  let timer = null;
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const cleanup = () => {
    clearTimeout(timer);
    for (const t of targets) t.removeEventListener(type, onEvent);
    ctx.signal.removeEventListener('abort', onAbort);
  };
  const onEvent = (event) => {
    cleanup();
    resolve(value(event));
  };
  const onAbort = () => {
    cleanup();
    reject(abortError());
  };
  for (const t of targets) t.addEventListener(type, onEvent);
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
const dropWaiter = (ctx, view) => eventWaiter(ctx, [view.el], 'mtdrop', (e) => {
  e.detail.handled = true;
  return e.detail;
});

/**
 * Bông hỏi (bé chạm được ngay cả khi Bông đang hỏi — câu hỏi bị cắt), chờ 15 giây từ khi đọc xong; không chạm thì
 * nhắc lại MỘT lần, chờ thêm 10 giây; vẫn không chạm → null. Chỉ nhận lúc đang chờ: lúc Bông khen / sửa thì không.
 * `mode`: 'ask' (lần đầu, hiện nút 🔊), 'again' (hỏi lại sau khi sai), 'silent' (chờ tiếp, không hỏi lại — bài kéo thả
 * sau mỗi lần đặt đúng một đồ).
 */
async function askAndWait(ctx, makeWaiter, line, mode = 'ask') {
  const { teacher, app } = ctx;
  const first = mode === 'ask' ? () => teacher.ask(line.en, { vi: line.vi }) : mode === 'again' ? () => teacher.say(line.en) : null;
  for (const [speak, wait] of [[first, ASK_WAIT_MS], [() => teacher.say(line.en), AGAIN_WAIT_MS]]) {
    const w = makeWaiter();
    let got;
    if (speak) {
      const spoken = speak().then(() => SPOKEN, (err) => {
        if (isAbort(err) && ctx.signal.aborted) throw err;
        return SPOKEN;
      });
      got = await Promise.race([w.promise, spoken]);
    } else {
      got = SPOKEN;
    }
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
  if (view.reveal) view.reveal();
  else view.byPick[q.answer]?.classList.add('mt-glow');
  ctx.counting = false;
  await teacher.say(`Look! ${answerLine(q).en}`);
  await teacher.pause(REVEAL_HOLD_MS);
}

/** Đúng: sao bay, Bông khen bằng câu so sánh đầy đủ. */
async function praise(ctx, q, target) {
  const { teacher } = ctx;
  target.classList.add('mt-right');
  play('ding');
  teacher.celebrate(target);
  teacher.bunny.set('clap');
  await teacher.say(`Yes! ${answerLine(q).en}`);
  if (q.type === 'order' && q.level >= 3) await teacher.say('This one is the smallest. This one is the biggest!');
  teacher.bunny.set('idle');
  await teacher.pause(RIGHT_HOLD_MS);
}

/**
 * Một câu hỏi. Biết kết quả là gọi `state.commit(result)` ngay (trước câu khen / hiện đáp án) để lưu chỗ học;
 * `state.committed` cho người gọi biết ▶ là "bỏ qua câu" hay "sang câu sau". `state.wrong`: số lần chạm / thả sai.
 */
export async function runQuestion(ctx, q, state) {
  const { teacher } = ctx;
  const view = viewFor(ctx, q);
  state.view = view;
  state.wrong = 0;
  ctx.stage.replaceChildren(h('div.mt-question', { dataset: { type: q.type, answer: q.answer, level: String(q.level) } }, view.el));
  if (q.type === 'order') return runOrder(ctx, q, state, view);
  ctx.counting = true;
  await view.settle?.(teacher); // bập bênh: nghiêng xong rồi mới hỏi
  const line = askLine(q);
  for (let mode = 'ask'; ; mode = 'again') {
    const picked = await askAndWait(ctx, () => eventWaiter(ctx, view.targets), line, mode);
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
      await praise(ctx, q, picked);
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

/**
 * Nhỏ – vừa – to: "một câu" là xếp xong cả 3 đồ. Thả đúng ô → đồ nằm yên, Bông nói từ của ô ("Medium!"); thả sai ô
 * hoặc vào ô đã có đồ → đồ bay về, tính là sai (sai 2 lần → Bông xếp nốt). Hết giờ chờ tính lại sau mỗi lần thả đúng.
 */
async function runOrder(ctx, q, state, view) {
  const { teacher } = ctx;
  const line = askLine(q);
  for (let mode = 'ask'; ;) {
    const drop = await askAndWait(ctx, () => dropWaiter(ctx, view), line, mode);
    if (!drop) {
      teacher.endQuestion();
      await state.commit({ first: false, wrong: state.wrong, revealed: true });
      await revealAnswer(ctx, q, view);
      return;
    }
    const rank = Number(drop.item.dataset.rank);
    const free = !view.slots[drop.slot].querySelector('.mt-drag');
    if (rank === drop.slot && free) {
      view.place(drop.item, drop.slot);
      play('tap');
      if (view.placed() === view.items.length) {
        teacher.endQuestion();
        await state.commit({ first: state.wrong === 0, wrong: state.wrong, revealed: false });
        await praise(ctx, q, view.el.querySelector('.mt-shelf'));
        return;
      }
      await teacher.say(`${cap(ORDER_WORDS[rank])}!`);
      mode = 'silent';
      continue;
    }
    view.back(drop.item);
    state.wrong++;
    nudgeWrong(drop.item);
    if (state.wrong >= 2) {
      teacher.endQuestion();
      await state.commit({ first: false, wrong: state.wrong, revealed: true });
      await revealAnswer(ctx, q, view);
      return;
    }
    await teacher.say(wrongLine(q, rank).en);
    mode = 'again';
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
      play('tap');
      teacher.say(words.get(event.currentTarget)).catch(() => {});
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
const demoStage = (ctx, el) => ctx.stage.replaceChildren(h('div.mt-question.demo', {}, el));

/**
 * To – nhỏ / Cao – thấp / Dài – ngắn: hai lượt với đồ của bài (đổi bên); lượt 3 vui — con voi và con chuột (to – nhỏ),
 * hươu cao cổ và con chuột (cao – thấp), hoặc đồ thứ ba của bài nói dạng "-er" (dài – ngắn).
 */
async function sizeDemo(ctx, k) {
  const { teacher, lesson } = ctx;
  const dim = useOf(lesson);
  const d = DIMS[dim];
  const items = lessonItems(lesson);
  const er = ctx.level >= 3;
  const animal = { size: 'elephant', tall: 'giraffe' }[dim];
  let big;
  let small;
  let lines;
  if (k < 2 || !animal) {
    const item = items[k % items.length];
    const bigFirst = k !== 1;
    big = thing(item, bigFirst ? 'left' : 'right', 2.2, dim);
    small = thing(item, bigFirst ? 'right' : 'left', 1, dim);
    lines = er || k === 2
      ? [`This ${item.en} is ${d.posEr}.`, `That ${item.en} is ${d.negEr}.`]
      : [`This ${item.en} is ${d.pos}.`, `That ${item.en} is ${d.neg}.`];
    demoStage(ctx, h(`div.mt-pair.${dim}`, {}, ...(bigFirst ? [big, small] : [small, big])));
  } else {
    const a = MATH_ITEM.get(animal);
    const mouse = MATH_ITEM.get('mouse');
    big = thing(a, 'left', 2.2);
    small = thing(mouse, 'right', 1);
    lines = [`The ${a.en} is ${d.pos}.`, `The mouse is ${d.neg}.`, `The ${a.en} is ${d.posEr} than the mouse!`];
    demoStage(ctx, h('div.mt-pair.size', {}, big, small));
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
  const words = er ? [d.posEr, d.negEr] : [d.pos, d.neg];
  await waitNext(ctx, new Map([[big, `${cap(words[0])}!`], [small, `${cap(words[1])}!`]]));
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
  demoStage(ctx, view.el);
  await teacher.pause(400);
  if (k === 0) await teacher.say("Let's count!");
  for (const side of ['left', 'right']) {
    const p = view.plates[side];
    p.box.classList.add('mt-focus');
    for (const t of p.things) await teacher.say(Word(p.mark(t)));
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

/** Nhỏ – vừa – to: Bông lần lượt đặt cái nhỏ, cái vừa, cái to vào kệ. */
async function orderDemo(ctx, k) {
  const { teacher, lesson } = ctx;
  const items = lessonItems(lesson);
  const item = items[k % items.length];
  const view = orderView({ type: 'order', level: Math.min(ctx.level, 2), item: item.id, tray: [2, 0, 1] });
  demoStage(ctx, view.el);
  await teacher.pause(400);
  for (const rank of [0, 1, 2]) {
    view.place(view.items.find((it) => Number(it.dataset.rank) === rank), rank);
    await teacher.say(`${cap(ORDER_WORDS[rank])}!`);
  }
  await teacher.say('Small, medium, big!');
  if (ctx.level >= 3) await teacher.say('This one is the smallest. This one is the biggest!');
  await waitNext(ctx, new Map(view.items.map((it) => [it, `${cap(ORDER_WORDS[Number(it.dataset.rank)])}!`])));
}

/** Nặng – nhẹ: Bông đặt hai đồ lên bập bênh, ván nghiêng về bên nặng, rồi Bông nói; lượt 3 dạng "-er". */
async function weightDemo(ctx, k) {
  const { teacher } = ctx;
  const [heavy, light, heavyLeft] = [['elephant', 'balloon', true], ['watermelon', 'grape', false], ['pumpkin', 'leaf', true]][k % 3];
  const q = { dim: 'weight', heavy, light, left: { item: heavyLeft ? heavy : light }, right: { item: heavyLeft ? light : heavy } };
  const view = weightView(q);
  demoStage(ctx, view.el);
  await view.settle(teacher);
  const [H, L] = [MATH_ITEM.get(heavy), MATH_ITEM.get(light)];
  const heavyEl = view.byPick[heavyLeft ? 'left' : 'right'];
  const lightEl = view.byPick[heavyLeft ? 'right' : 'left'];
  pop(heavyEl, 'mt-grow');
  await teacher.say(`The ${H.en} is heavy.`);
  pop(lightEl, 'mt-grow');
  await teacher.say(`The ${L.en} is light.`);
  if (k === 2 || ctx.level >= 3) await teacher.say(`The ${H.en} is heavier than the ${L.en}!`);
  await waitNext(ctx, new Map([[heavyEl, ctx.level >= 3 ? 'Heavier!' : 'Heavy!'], [lightEl, ctx.level >= 3 ? 'Lighter!' : 'Light!']]));
}

export function runDemo(ctx, k) {
  const use = useOf(ctx.lesson);
  if (use === 'count') return countDemo(ctx, k);
  if (use === 'order') return orderDemo(ctx, k);
  if (use === 'weight') return weightDemo(ctx, k);
  return sizeDemo(ctx, k);
}
