// Các bước của mục Phonics (SPEC-phonics.md): sơ đồ tư duy, tìm từ đúng âm, chữ hoa – chữ thường,
// nghe từ chọn chữ, bắt bóng chữ. Không bắt nói, không trừ sao.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { letterColor, letterKey, letterIntro, findQuestion, findChoices, letterChoices, highlightIndex, popTargets } from '../phonics.js';
import { markPracticed, markPhrasePick } from './track.js';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const SVG = 'http://www.w3.org/2000/svg';

/** Hình của một từ: ảnh bố mẹ thêm (nếu có) hoặc emoji; ảnh lỗi thì quay về emoji. */
function wordPicture(ctx, word) {
  const url = ctx.imageOf?.(word.en);
  if (!url) return h('span.word-pic', {}, h('span.emoji', { text: word.emoji }));
  const box = h('span.word-pic');
  const img = h('img', { src: url, alt: '', draggable: false });
  img.addEventListener('error', () => box.replaceChildren(h('span.emoji', { text: word.emoji })), { once: true });
  box.append(img);
  return box;
}

/** Chữ của từ, tô màu chữ cái cần học ("ant" → "a" tô màu). */
function wordLabel(word, letter) {
  const i = highlightIndex(word.en, letter);
  return h('span.word-label', {},
    word.en.slice(0, i),
    h('b.hl', { text: word.en.slice(i, i + 1), style: { color: letterColor(letter) } }),
    word.en.slice(i + 1));
}

/** Thẻ chữ "A a" (hoặc chỉ chữ hoa / chỉ chữ thường). */
/** plain: cùng một màu trung tính cho mọi thẻ (trò chữ hoa – chữ thường: màu không được lộ đáp án). */
export function letterCard(letter, { show = 'both', tag = 'span', plain = false } = {}) {
  const parts = show === 'upper' ? [letter.toUpperCase()] : show === 'lower' ? [letter] : [letter.toUpperCase(), letter];
  return h(`${tag}.letter-card`, { style: { '--letter-color': plain ? 'var(--ink)' : letterColor(letter) } },
    ...parts.map((p, i) => h(`span.${i === 0 && show !== 'lower' ? 'upper' : 'lower'}`, { text: p })));
}

/** Ghi kết quả chọn của chữ (không bao giờ trừ sao): +1 khi đúng ngay lần đầu, một lần mỗi chữ mỗi lượt. */
async function recordLetter(ctx, letter, firstTry, emoji = '') {
  const key = letterKey(letter);
  const award = firstTry && !ctx.pickedThisRun.has(key) && (ctx.canAward?.(key) ?? true);
  if (firstTry) ctx.pickedThisRun.add(key);
  await markPhrasePick(ctx.app, key, emoji, { firstTry, award });
}

function shake(el) {
  play('boing');
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

/**
 * Chọn 1 trong nhiều thẻ: đúng → khen; sai → lắc + Bông nói thẻ đó là gì; sai 2 lần → thẻ đúng sáng lên.
 * @param {{ buttons: HTMLElement[], correct: HTMLElement, question: string, nameOf: (btn) => string, yes: string, reveal: string, letter: string, emoji: string }} o
 */
async function choose(ctx, o) {
  const { teacher } = ctx;
  await teacher.ask(o.question);
  let wrong = 0;
  for (;;) {
    const tapped = await teacher.waitTap(o.buttons);
    if (tapped === o.correct) {
      await recordLetter(ctx, o.letter, wrong === 0, o.emoji);
      tapped.classList.add('correct');
      play('ding');
      teacher.celebrate(tapped);
      teacher.bunny.set('clap');
      o.onCorrect?.();
      await teacher.say(o.yes);
      teacher.bunny.set('idle');
      break;
    }
    wrong++;
    if (wrong === 1) await recordLetter(ctx, o.letter, false, o.emoji);
    shake(tapped);
    if (wrong >= 2) {
      o.correct.classList.add('glow');
      o.onCorrect?.();
      await teacher.say(o.reveal);
      break;
    }
    await teacher.say(`That's ${o.nameOf(tapped)}. Try again!`);
  }
  teacher.endQuestion();
  await teacher.pause(700);
}

// ---------- 1. Sơ đồ tư duy ----------
export async function runMap(ctx, entry) {
  const { app, teacher } = ctx;
  const L = entry.letter.toUpperCase();
  const n = entry.words.length;
  // Vị trí các thẻ quanh vòng tròn (theo % của khung vuông), bắt đầu ở trên cùng.
  const pos = entry.words.map((_, i) => {
    const a = (-90 + (360 / n) * i) * (Math.PI / 180);
    return { x: 50 + 37 * Math.cos(a), y: 50 + 37 * Math.sin(a) };
  });
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('class', 'mind-lines');
  const lines = pos.map(({ x, y }) => {
    const line = document.createElementNS(SVG, 'line');
    line.setAttribute('x1', '50');
    line.setAttribute('y1', '50');
    line.setAttribute('x2', String(x));
    line.setAttribute('y2', String(y));
    line.setAttribute('pathLength', '1');
    svg.append(line);
    return line;
  });
  const center = h('button.mind-center', { type: 'button', 'aria-label': `Letter ${L}` }, letterCard(entry.letter));
  const cards = entry.words.map((word, i) => h('button.mind-word', {
    type: 'button',
    'aria-label': word.en,
    style: { left: `${pos[i].x}%`, top: `${pos[i].y}%` },
  }, wordPicture(ctx, word), wordLabel(word, entry.letter)));
  const map = h('div.mindmap', { style: { '--letter-color': letterColor(entry.letter) } }, svg, ...cards, center);
  ctx.stage.replaceChildren(h('div.mindmap-wrap', {}, map));

  await markPracticed(app, letterKey(entry.letter), entry.words[0].emoji);
  await teacher.say(letterIntro(entry));
  // Nhánh mọc ra lần lượt trong lúc Bông đọc từng từ.
  for (const [i, word] of entry.words.entries()) {
    lines[i].classList.add('grown');
    cards[i].classList.add('shown');
    await teacher.say(`${cap(word.en)}!`);
    await teacher.pause(150);
  }

  // Bé chạm khám phá: chạm từ nào Bông đọc từ đó; chạm chữ giữa thì nghe lại câu giới thiệu.
  await teacher.ask('Your turn! Tap a picture!');
  const tapped = new Set();
  while (tapped.size < n) {
    const t = await teacher.waitTap([center, ...cards]);
    if (t === center) {
      center.classList.remove('pop');
      void center.offsetWidth;
      center.classList.add('pop');
      await teacher.say(letterIntro(entry));
      continue;
    }
    const i = cards.indexOf(t);
    const word = entry.words[i];
    t.classList.remove('pop');
    void t.offsetWidth;
    t.classList.add('pop', 'tapped');
    play('tap');
    if (!tapped.has(i)) {
      tapped.add(i);
      await markPracticed(app, word.en, word.emoji);
    }
    await teacher.say(entry.inside ? `${cap(word.en)}!` : `${L}, ${word.en}!`);
  }
  teacher.endQuestion();
  play('ding');
  teacher.celebrate(center);
  teacher.bunny.set('clap');
  await teacher.say(`Great! You found all the ${L} words!`);
  teacher.bunny.set('idle');
  await teacher.pause(500);
}

// ---------- 2. Tìm từ đúng âm ----------
export async function runFind(ctx, entry) {
  const { answer, choices } = findChoices(entry, ctx.lesson.letters);
  const L = entry.letter.toUpperCase();
  const buttons = choices.map((w) => h('button.choice.find-choice', { type: 'button', 'aria-label': w.en, dataset: { word: w.en } }, wordPicture(ctx, w)));
  const correct = buttons[choices.indexOf(answer)];
  ctx.stage.replaceChildren(h('div.phonics-card', {}, letterCard(entry.letter), h('div.choices', { dataset: { count: String(buttons.length) } }, ...buttons)));
  await choose(ctx, {
    buttons,
    correct,
    question: findQuestion(entry),
    nameOf: (b) => b.dataset.word,
    yes: entry.inside ? `Yes! ${cap(answer.en)} has ${L}!` : `Yes! ${L}, ${answer.en}!`,
    reveal: `This one! ${cap(answer.en)}!`,
    letter: entry.letter,
    emoji: entry.words[0].emoji,
    onCorrect: () => correct.append(wordLabel(answer, entry.letter)),
  });
}

// ---------- 3. Chữ hoa – chữ thường ----------
export async function runCase(ctx, entry) {
  const L = entry.letter.toUpperCase();
  const options = letterChoices(entry.letter, ctx.lesson.letters.map((l) => l.letter));
  const buttons = options.map((l) => h('button.choice.letter-choice', { type: 'button', 'aria-label': l, dataset: { letter: l } }, letterCard(l, { show: 'lower', plain: true })));
  const correct = buttons[options.indexOf(entry.letter)];
  ctx.stage.replaceChildren(h('div.phonics-card', {}, letterCard(entry.letter, { show: 'upper' }), h('div.choices', {}, ...buttons)));
  await choose(ctx, {
    buttons,
    correct,
    question: `Big ${L}. Find the small ${L}!`,
    nameOf: (b) => b.dataset.letter.toUpperCase(),
    yes: `Yes! Big ${L}, small ${L}!`,
    reveal: `Here! Small ${L}!`,
    letter: entry.letter,
    emoji: entry.words[0].emoji,
  });
}

// ---------- 4. Nghe từ, chọn chữ ----------
export async function runHear(ctx, entry) {
  const word = entry.words[Math.floor(Math.random() * entry.words.length)];
  const L = entry.letter.toUpperCase();
  const options = letterChoices(entry.letter, ctx.lesson.letters.map((l) => l.letter));
  const buttons = options.map((l) => h('button.choice.letter-choice', { type: 'button', 'aria-label': l, dataset: { letter: l } }, letterCard(l)));
  const correct = buttons[options.indexOf(entry.letter)];
  const picture = h('div.hear-word', {}, wordPicture(ctx, word));
  ctx.stage.replaceChildren(h('div.phonics-card', {}, picture, h('div.choices', {}, ...buttons)));
  await choose(ctx, {
    buttons,
    correct,
    question: `${cap(word.en)}! Which letter?`,
    nameOf: (b) => b.dataset.letter.toUpperCase(),
    yes: entry.inside ? `Yes! ${cap(word.en)} has ${L}!` : `Yes! ${L}, ${word.en}!`,
    reveal: `It's ${L}! ${cap(word.en)}!`,
    letter: entry.letter,
    emoji: word.emoji,
    onCorrect: () => picture.append(wordLabel(word, entry.letter)),
  });
}

// ---------- 5. Bắt bóng chữ ----------
export async function runPop(ctx) {
  const { teacher, lesson } = ctx;
  const letters = lesson.letters.map((l) => l.letter);
  const area = h('div.pop-area');
  ctx.stage.replaceChildren(area);
  await teacher.say("Let's pop the balloons!");
  for (const target of popTargets(lesson)) {
    const L = target.toUpperCase();
    const options = letterChoices(target, letters, Math.random, 4);
    const balloons = options.map((l, i) => h('button.balloon', {
      type: 'button',
      'aria-label': l,
      dataset: { letter: l },
      style: { '--letter-color': letterColor(l), '--i': String(i), left: `${8 + i * 23}%` },
    }, h('span.balloon-letter', { text: `${l.toUpperCase()}${l}` })));
    area.replaceChildren(...balloons);
    const correct = balloons[options.indexOf(target)];
    await choose(ctx, {
      buttons: balloons,
      correct,
      question: `Pop the ${L}!`,
      nameOf: (b) => b.dataset.letter.toUpperCase(),
      yes: `Pop! ${L}!`,
      reveal: `Here is ${L}!`,
      letter: target,
      emoji: lesson.letters.find((l) => l.letter === target)?.words[0]?.emoji ?? '',
      onCorrect: () => {
        play('pop');
        correct.classList.add('popped');
      },
    });
  }
  play('cheer');
  await teacher.say('Hooray! You popped them all!');
}
