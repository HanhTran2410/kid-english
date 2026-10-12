// Các bước của mục Số đếm (SPEC-numbers mục 4, 5): Bông đếm, bé chạm đếm, chọn nhóm đúng, trò chơi Chọn số.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { scaled, abortError } from '../timing.js';
import { numberKey, numberWord, countPhrase, itemRows, groupDistractor, numberChoices, TEN } from '../numbers.js';
import { waitAdvance } from './stage-kit.js';
import { markPracticed, markDid, markPhrasePick, markSpoke } from './track.js';
import { RESULT } from '../speech/listen.js';

const TAP_WAIT_MS = 15_000; // bé không chạm 15 giây → Bông đếm nốt / nhắc lại câu hỏi
const COUNT_GAP_MS = 250; // nghỉ giữa hai số khi Bông đếm

/** Mỗi số một màu cố định, dùng chung ở bài đếm và trò chơi. */
export const NUMBER_COLORS = ['', '#e5484d', '#f76b15', '#d99a00', '#2fb380', '#3b82f6', '#8b5cf6', '#ec4899', '#a0522d', '#0d9488', '#4f46e5'];
const numColor = (n) => ({ '--num-color': NUMBER_COLORS[((n - 1) % 10) + 1] ?? 'var(--ink)' }); // 11–20 dùng lại màu 1–10
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const Word = (n) => {
  const w = numberWord(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
};

export function numeral(n, tag = 'div') {
  return h(`${tag}.numeral`, { text: String(n), style: numColor(n) });
}

/** Hình một đồ vật: ảnh bố mẹ thêm (nếu có) hoặc emoji; ảnh lỗi thì quay về emoji. */
function itemVisual(entry, image) {
  if (!image) return h('span.count-emoji', { text: entry.emoji });
  const box = h('span.count-emoji.has-img');
  const img = h('img.count-img', { src: image, alt: '', draggable: false });
  img.addEventListener('error', () => {
    box.classList.remove('has-img');
    box.replaceChildren(entry.emoji);
  }, { once: true });
  box.append(img);
  return box;
}

/**
 * Nhóm n đồ vật xếp hàng tối đa 5 cái. Mỗi đồ vật có số nhỏ hiện khi được đếm.
 * Từ 11 trở lên: 10 cái đầu nằm trong "khung 10" (không chạm được), `items` chỉ là phần thêm, số đếm bắt đầu từ 11.
 * @param {{ small?: boolean, tappable?: boolean, image?: string|null }} [options] image: ảnh đồ vật thay cho emoji
 * @returns {{ el: HTMLElement, items: HTMLElement[], base: number, ten: HTMLElement|null,
 *   mark: (item: HTMLElement, k: number) => void, markTen: () => void, reset: () => void }}
 */
export function itemGroup(entry, n, { small = false, tappable = false, image = null } = {}) {
  const base = n > TEN ? TEN : 0;
  const ten = base
    ? h('div.ten-frame', {}, h('span.ten-badge', { text: '10' }),
      ...[5, 5].map(() => h('div.count-row', {}, ...Array.from({ length: 5 }, () => h('span.count-item.in-ten', {}, itemVisual(entry, image))))))
    : null;
  const items = [];
  const rows = itemRows(n - base).map((count) => h('div.count-row', {}, ...Array.from({ length: count }, () => {
    const item = h(tappable ? 'button.count-item' : 'span.count-item', {
      type: tappable ? 'button' : undefined,
      'aria-label': entry.item,
      style: { '--i': String(items.length) },
    }, itemVisual(entry, image), h('span.count-label'));
    items.push(item);
    return item;
  })));
  const el = h(`div.count-group${small ? '.small' : ''}${base ? '.teens' : ''}`, { style: numColor(n) }, ten, ...rows);
  return {
    el,
    items,
    base,
    ten,
    mark(item, k) {
      item.classList.remove('counting');
      void item.offsetWidth;
      item.classList.add('counted', 'counting');
      item.querySelector('.count-label').textContent = String(k);
    },
    markTen() {
      if (!ten) return;
      ten.classList.remove('counting');
      void ten.offsetWidth;
      ten.classList.add('counted', 'counting');
    },
    reset() {
      for (const item of items) {
        item.classList.remove('counted', 'counting');
        item.querySelector('.count-label').textContent = '';
      }
      ten?.classList.remove('counted', 'counting');
      el.classList.remove('all-done');
    },
  };
}

/** Thẻ của một số: chữ số to + nhóm đồ vật + chữ ("Two crayons"). */
function numberCard(ctx, entry, { tappable = false } = {}) {
  const num = numeral(entry.n);
  const group = itemGroup(entry, entry.n, { tappable, image: ctx.imageOf?.(entry) });
  const text = h('div.number-text', { text: countPhrase(entry) });
  const el = h('div.number-card', {}, num, group.el, text);
  ctx.stage.replaceChildren(el);
  return { el, num, group };
}

/**
 * Bông đếm từng đồ vật: đồ vật đang đếm to ra, số nhỏ hiện dưới.
 * Từ 11 trở lên: khung 10 sáng lên, "Ten!", rồi đếm tiếp phần thêm "Eleven, twelve…".
 */
async function countAlong(teacher, group, from = 0) {
  if (group.base && from === 0 && !group.ten.classList.contains('counted')) {
    group.markTen();
    await teacher.say(`${Word(group.base)}!`);
    await teacher.pause(COUNT_GAP_MS);
  }
  for (let k = from; k < group.items.length; k++) {
    group.mark(group.items[k], group.base + k + 1);
    await teacher.say(Word(group.base + k + 1));
    await teacher.pause(COUNT_GAP_MS);
  }
}

/** Đếm xong: cả nhóm nhún, chữ số phát sáng, Bông nói "Two crayons!". */
async function sayTotal(teacher, card, entry) {
  card.group.el.classList.add('all-done');
  card.num.classList.remove('glow');
  void card.num.offsetWidth;
  card.num.classList.add('glow');
  await teacher.say(`${countPhrase(entry)}!`);
}

// ---------- A. Xem Bông đếm ----------
export async function runCount(ctx, entry) {
  const { app, teacher } = ctx;
  const card = numberCard(ctx, entry);
  await markPracticed(app, numberKey(entry.n), entry.emoji);
  await teacher.pause(300 + Math.min(entry.n, 10) * 80); // chờ đồ vật bay vào
  if (!ctx.countIntroDone) {
    ctx.countIntroDone = true;
    await teacher.say("Let's count!");
  }
  await countAlong(teacher, card.group);
  await sayTotal(teacher, card, entry);
  await waitAdvance(ctx, {
    ms: 1200,
    picture: card.el,
    onPicture: async () => {
      card.group.reset();
      await countAlong(teacher, card.group);
      await sayTotal(teacher, card, entry);
    },
  });
}

/**
 * Chờ bé chạm đếm hết các đồ vật. Chạm cái chưa đếm → to ra + Bông đọc số tiếp theo; chạm lại cái đã đếm → nhún nhẹ.
 * @returns {Promise<boolean>} true nếu bé đếm đủ; false nếu 15 giây không chạm
 */
function waitCounting(ctx, group, { last = true } = {}) {
  const { signal, teacher } = ctx;
  return new Promise((resolve, reject) => {
    let counted = 0;
    let timer = null;
    const cleanup = () => {
      clearTimeout(timer);
      for (const item of group.items) item.removeEventListener('click', onTap);
      signal.removeEventListener('abort', onAbort);
    };
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        cleanup();
        resolve(false);
      }, scaled(TAP_WAIT_MS));
    };
    const onTap = (event) => {
      const item = event.currentTarget;
      if (item.classList.contains('counted')) {
        item.classList.remove('nudge');
        void item.offsetWidth;
        item.classList.add('nudge');
        return;
      }
      counted++;
      group.mark(item, group.base + counted);
      if (counted >= group.items.length && last) {
        cleanup();
        resolve(true);
        return;
      }
      play('tap');
      // Không chờ: bé chạm nhanh thì câu sau cắt câu trước.
      teacher.say(Word(group.base + counted)).catch(() => {});
      arm();
    };
    const onAbort = () => {
      cleanup();
      reject(abortError());
    };
    for (const item of group.items) item.addEventListener('click', onTap);
    signal.addEventListener('abort', onAbort, { once: true });
    arm();
  });
}

// ---------- B. Bé chạm đếm ----------
export async function runTap(ctx, entry) {
  const { app, teacher } = ctx;
  const card = numberCard(ctx, entry, { tappable: true });
  card.el.classList.add('your-turn');
  // 11–20: khung 10 đã đếm sẵn, bé chỉ chạm đếm phần thêm (đếm tiếp từ 10).
  card.group.markTen();
  // Nhận chạm ngay cả khi Bông đang mời (bé hay chạm luôn); chạm thì câu mời bị cắt bởi số đầu tiên.
  const counting = waitCounting(ctx, card.group);
  counting.catch(() => {}); // rời bài giữa chừng: lỗi dừng được xử lý ở dòng await bên dưới
  await teacher.ask(card.group.base ? 'Ten! Your turn! Tap and count!' : 'Your turn! Tap and count!').catch((err) => {
    if (ctx.signal.aborted) throw err;
  });
  const countedAll = await counting;
  teacher.endQuestion();
  if (countedAll) {
    await markDid(app, numberKey(entry.n), entry.emoji);
    play('ding');
    teacher.celebrate(card.group.el);
    teacher.bunny.set('clap');
    card.group.el.classList.add('all-done');
    card.num.classList.add('glow');
    await teacher.say(`${countPhrase(entry)}! Great counting!`);
    teacher.bunny.set('idle');
  } else {
    // Bé chưa chạm: Bông đếm nốt các đồ vật còn lại rồi đi tiếp, không trừ gì.
    const from = card.group.items.filter((i) => i.classList.contains('counted')).length;
    const rest = card.group.items.filter((i) => !i.classList.contains('counted'));
    for (const [k, item] of rest.entries()) {
      const label = card.group.base + from + k + 1;
      card.group.mark(item, label);
      await teacher.say(Word(label));
      await teacher.pause(COUNT_GAP_MS);
    }
    await sayTotal(teacher, card, entry);
  }
  await teacher.pause(500);
}

/** Hiệu ứng chọn sai: lắc nhẹ. */
function shake(el) {
  play('boing');
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

/** Ghi kết quả chọn (không bao giờ trừ sao): +1 chỉ khi đúng ngay lần đầu, một lần mỗi số mỗi lượt. */
async function recordPick(ctx, entry, firstTry) {
  const key = numberKey(entry.n);
  const award = firstTry && !ctx.pickedThisRun.has(key) && (ctx.canAward?.(key) ?? true);
  if (firstTry) ctx.pickedThisRun.add(key);
  await markPhrasePick(ctx.app, key, entry.emoji, { firstTry, award });
}

// ---------- C. Chọn nhóm đúng ----------
export async function runGroup(ctx, entry) {
  const { teacher } = ctx;
  const other = groupDistractor(entry.n, Math.random, ctx.maxNumber);
  const options = Math.random() < 0.5 ? [entry.n, other] : [other, entry.n];
  const buttons = options.map((m) => h('button.choice.group-choice', { type: 'button', 'aria-label': countPhrase(entry, m), dataset: { n: String(m) } },
    itemGroup(entry, m, { small: true, image: ctx.imageOf?.(entry) }).el));
  ctx.stage.replaceChildren(h('div.choices', { dataset: { count: '2' } }, ...buttons));

  await teacher.ask(`Where are ${lower(countPhrase(entry))}?`);
  let wrong = 0;
  for (;;) {
    const tapped = await teacher.waitTap(buttons);
    const m = Number(tapped.dataset.n);
    if (m === entry.n) {
      await recordPick(ctx, entry, wrong === 0);
      tapped.classList.add('correct');
      play('ding');
      teacher.celebrate(tapped);
      teacher.bunny.set('clap');
      await teacher.say(`Yes! ${countPhrase(entry)}!`);
      teacher.bunny.set('idle');
      break;
    }
    wrong++;
    if (wrong === 1) await recordPick(ctx, entry, false);
    shake(tapped);
    if (wrong >= 2) {
      buttons.find((b) => Number(b.dataset.n) === entry.n)?.classList.add('glow');
      await teacher.say(`Look! ${countPhrase(entry)}!`);
      break;
    }
    await teacher.say(`That's ${lower(countPhrase(entry, m))}. Try again!`);
  }
  teacher.endQuestion();
  await teacher.pause(700);
}

/**
 * Chờ bé chạm một thẻ (nhận cả khi Bông đang nói). Hết giờ thì trả về null.
 * @returns {Promise<HTMLElement|null>}
 */
function waitChoice(ctx, buttons, ms = TAP_WAIT_MS) {
  const { signal } = ctx;
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      for (const b of buttons) b.removeEventListener('click', onTap);
      signal.removeEventListener('abort', onAbort);
    };
    const onTap = (event) => {
      cleanup();
      resolve(event.currentTarget);
    };
    const onAbort = () => {
      cleanup();
      reject(abortError());
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve(null);
    }, scaled(ms));
    for (const b of buttons) b.addEventListener('click', onTap);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

// ---------- Trò chơi "Chọn số" ----------
/**
 * Một câu của trò chơi. Kiểu "find": nghe số, chọn chữ số. Kiểu "count": đếm đồ vật (chạm để đếm) rồi chọn chữ số.
 * @param {{ n: number, type: 'find'|'count' }} round
 * @param {object} entry đồ vật dùng cho kiểu "count"
 */
export async function runGameRound(ctx, round, entry) {
  const { app, teacher } = ctx;
  const { n } = round;
  await markPracticed(app, numberKey(n), entry.emoji);
  const choices = numberChoices(n, Math.random, { allowHigh: ctx.allowHigh, max: ctx.maxNumber });
  const buttons = choices.map((m) => h('button.choice.numeral-choice', { type: 'button', 'aria-label': String(m), dataset: { n: String(m) } }, numeral(m, 'span')));
  const cards = h('div.choices.numeral-choices', { dataset: { count: String(buttons.length) } }, ...buttons);

  let group = null;
  if (round.type === 'count') {
    group = itemGroup(entry, n, { tappable: true, image: ctx.imageOf?.(entry) });
    ctx.stage.replaceChildren(h('div.game-card', {}, group.el, cards));
    // Bé chạm đồ vật để đếm (không bắt buộc), Bông đọc số; bé tự chọn thẻ.
    waitCounting(ctx, group, { last: false }).catch(() => {});
  } else {
    ctx.stage.replaceChildren(h('div.game-card', {}, h('button.game-question', { type: 'button', 'aria-label': 'Nghe lại câu hỏi', text: '❓', onclick: () => teacher.replay() }), cards));
  }

  const question = round.type === 'count' ? `How many ${entry.items}?` : `Find number ${numberWord(n)}!`;
  const answer = round.type === 'count' ? countPhrase(entry, n) : Word(n);
  const correctBtn = buttons.find((b) => Number(b.dataset.n) === n);
  const entryForN = { ...entry, n };
  await teacher.ask(question);

  let wrong = 0;
  let timeouts = 0;
  for (;;) {
    const tapped = await waitChoice(ctx, buttons);
    if (!tapped) {
      // Không chạm: nhắc lại câu hỏi một lần; vẫn không chạm thì chỉ đáp án rồi sang câu sau.
      timeouts++;
      if (timeouts === 1) {
        await teacher.say(question);
        continue;
      }
      correctBtn.classList.add('glow');
      await teacher.say(`It's ${numberWord(n)}!`);
      break;
    }
    const m = Number(tapped.dataset.n);
    if (m === n) {
      await recordPick(ctx, entryForN, wrong === 0);
      tapped.classList.add('correct');
      play('ding');
      teacher.celebrate(tapped);
      teacher.bunny.set('clap');
      group?.el.classList.add('all-done');
      await teacher.say(`Yes! ${answer}!`);
      teacher.bunny.set('idle');
      break;
    }
    wrong++;
    if (wrong === 1) await recordPick(ctx, entryForN, false);
    shake(tapped);
    if (wrong >= 2) {
      correctBtn.classList.add('glow');
      await teacher.say(`It's ${numberWord(n)}!`);
      break;
    }
    await teacher.say(`That's ${numberWord(m)}. Try again!`);
  }
  teacher.endQuestion();
  await teacher.pause(700);
}

// ---------- Học cùng Bông: đếm và nói (SPEC-mix mục 3) ----------
/**
 * Bông hỏi "How many apples?", bé nói số. Không cho chạm đếm ở lượt này (mic đang nghe, Bông đọc số sẽ bị nghe nhầm).
 * Nghe ra số đúng → khen; không thì Bông đếm mẫu rồi nói "Three apples!".
 */
export async function runNumberTalk(ctx, entry) {
  const { app, teacher } = ctx;
  await markPracticed(app, numberKey(entry.n), entry.emoji);
  const num = numeral(entry.n);
  num.classList.add('later');
  const group = itemGroup(entry, entry.n, { image: ctx.imageOf?.(entry) });
  const text = h('div.number-text.later', { text: countPhrase(entry) });
  ctx.stage.replaceChildren(h('div.number-card', {}, num, group.el, text));
  const reveal = () => [num, text].forEach((el) => el.classList.remove('later'));

  await teacher.say(`How many ${entry.items}?`);
  let { result } = await teacher.hear([numberWord(entry.n), String(entry.n)]);
  if (result === RESULT.SILENT) {
    await teacher.say("Let's count!");
    ({ result } = await teacher.hear([numberWord(entry.n), String(entry.n)]));
  }
  reveal();
  if (result === RESULT.MATCH) {
    await markSpoke(app, numberKey(entry.n), entry.emoji);
    play('ding');
    teacher.celebrate(group.el);
    teacher.bunny.set('clap');
    group.el.classList.add('all-done');
    await teacher.say(`Yes! ${countPhrase(entry)}!`);
  } else {
    if (result === RESULT.VOICE) {
      play('pop');
      teacher.bunny.set('clap');
      await teacher.say('Good try!');
    }
    teacher.bunny.set('idle');
    await countAlong(teacher, group);
    await sayTotal(teacher, { group, num }, entry);
  }
  teacher.bunny.set('idle');
  await teacher.checkPresence();
  await teacher.pause(600);
}
