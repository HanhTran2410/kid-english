// Một câu của trò Đếm hình (SPEC-shapes mục 3): tranh ghép từ hình học, Bông hỏi "How many triangles?", bé chạm từng
// hình đúng loại để đếm (huy hiệu số, Bông đếm), chạm hình khác thì Bông nói tên hình đó. Mức 2: đếm xong chọn thẻ số.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { scaled, abortError } from '../timing.js';
import { numberKey, numberChoices } from '../numbers.js';
import { markPracticed, markDid } from './track.js';
import { numeral, NUMBER_COLORS, shake, recordPick, waitChoice } from './number-stages.js';
import {
  KINDS, PICTURE_BY_ID, pictureSvg, sampleSvg, lookLine, thisIsLine, findOneLine, foundOneLine, howManyLine, otherShapeLine,
  againLine, findAllLine, totalLine, countWord,
} from '../shapes.js';

const HINT_MS = 10_000; // 10 giây không chạm → một hình chưa đếm lấp lánh
const MAX_HINTS = 2;
const WRONG_TO_REMIND = 3; // chạm nhầm lần thứ 3 trong câu → "Find the triangles!"
const FLASH_GAP_MS = 220;

const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Huy hiệu số trên hình (màu cố định của số, như bài Số đếm). */
function badge(svg, shapeEl, n) {
  const b = shapeEl.getBBox();
  const r = 11;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'sc-badge');
  g.setAttribute('pointer-events', 'none');
  g.dataset.n = String(n);
  g.innerHTML = `<circle cx="${b.x + b.width / 2}" cy="${b.y + b.height / 2}" r="${r}" fill="${NUMBER_COLORS[n] ?? '#333'}" stroke="#fff" stroke-width="2.5"/>`
    + `<text x="${b.x + b.width / 2}" y="${b.y + b.height / 2 + 5}" text-anchor="middle" font-size="15" font-weight="900" fill="#fff" font-family="Nunito, sans-serif">${n}</text>`;
  svg.append(g);
  return g;
}

/**
 * @param {{ picture: string, kind: string, n: number }} q
 * @param {{ level: number, look: boolean, warmup: boolean }} opts look: nói "Look! A boat!" (câu đầu của tranh);
 *   warmup: bé chưa gặp loại hình này → "This is a triangle!" + "Find a triangle!" trước khi đếm
 */
export async function runShapeQuestion(ctx, q, { level = 1, look = true, warmup = false } = {}) {
  const { app, teacher } = ctx;
  const pic = PICTURE_BY_ID.get(q.picture);
  const kind = KINDS[q.kind];
  const picEl = h('div.sc-pic', { html: pictureSvg(pic) });
  const svg = picEl.querySelector('svg');
  const counter = h('div.sc-counter', { 'aria-live': 'polite', text: '0' });
  const target = h('button.sc-target', {
    type: 'button', 'aria-label': kind.vi, dataset: { kind: q.kind },
    onclick: () => teacher.replay(),
  }, h('span.sc-sample', { html: sampleSvg(q.kind) }), h('span.sc-name', {}, h('b', { text: kind.en }), h('small', { text: kind.vi })));
  const choiceBox = h('div.sc-choices');
  const card = h('div.sc-card', { dataset: { picture: pic.id, kind: q.kind } }, picEl, h('div.sc-side', {}, target, counter), choiceBox);
  ctx.stage.replaceChildren(card);
  const targets = [...svg.querySelectorAll(`[data-kind="${q.kind}"]:not(.sc-pad)`)];
  const shapeById = (id) => svg.querySelector(`[data-shape="${id}"]:not(.sc-pad)`);
  const bounce = (el) => {
    el.classList.remove('bounce');
    void el.getBoundingClientRect();
    el.classList.add('bounce');
  };

  await markPracticed(app, kind.en, kind.emoji); // "đã gặp" tên hình

  if (look) await teacher.say(lookLine(pic)[0]);
  if (warmup) {
    bounce(target);
    await teacher.say(thisIsLine(q.kind)[0]);
    await findOne(ctx, svg, q.kind, shapeById);
  }

  // ---------- Đếm ----------
  const counted = new Map(); // id → số
  const done = waitCount(ctx, { svg, kind: q.kind, targets, counted, counter, shapeById, bounce });
  done.catch(() => {});
  await teacher.ask(howManyLine(q.kind)[0], { vi: howManyLine(q.kind)[1] }).catch((err) => {
    if (ctx.signal.aborted) throw err;
  });
  await done;
  teacher.endQuestion();

  // Đủ: các hình đúng loại nhấp nháy theo thứ tự 1 → N, Bông đọc tổng.
  play('ding');
  teacher.bunny.set('clap');
  for (const [id] of [...counted].sort((a, b) => a[1] - b[1])) {
    const el = shapeById(id);
    el?.classList.add('sc-flash');
    await teacher.pause(FLASH_GAP_MS);
  }
  await markDid(app, numberKey(q.n), kind.emoji);
  await teacher.say(totalLine(q.kind, q.n)[0]);
  teacher.bunny.set('idle');

  // ---------- Mức 2: chọn thẻ số ----------
  if (level >= 2) {
    const choices = numberChoices(q.n, Math.random, { max: 10 });
    const buttons = choices.map((m) => h('button.choice.numeral-choice', { type: 'button', 'aria-label': String(m), dataset: { n: String(m) } }, numeral(m, 'span')));
    choiceBox.replaceChildren(h('div.choices.numeral-choices', { dataset: { count: String(buttons.length) } }, ...buttons));
    const entry = { n: q.n, emoji: kind.emoji };
    const correctBtn = buttons.find((b) => Number(b.dataset.n) === q.n);
    await teacher.ask(howManyLine(q.kind)[0], { vi: howManyLine(q.kind)[1] });
    let wrong = 0;
    for (;;) {
      const tapped = await waitChoice(ctx, buttons);
      if (!tapped) {
        correctBtn.classList.add('glow');
        await teacher.say(`It's ${NUM[q.n]}!`);
        break;
      }
      const m = Number(tapped.dataset.n);
      if (m === q.n) {
        await recordPick(ctx, entry, wrong === 0);
        tapped.classList.add('correct');
        play('ding');
        teacher.celebrate(tapped);
        await teacher.say(`Yes! ${capital(NUM[q.n])}!`);
        break;
      }
      wrong++;
      if (wrong === 1) await recordPick(ctx, entry, false);
      shake(tapped);
      if (wrong >= 2) {
        correctBtn.classList.add('glow');
        await teacher.say(`It's ${NUM[q.n]}!`);
        break;
      }
      await teacher.say(`That's ${NUM[m]}. Try again!`);
    }
    teacher.endQuestion();
  }
  await teacher.pause(600);
}

/** Khởi động: "Find a triangle!" — chạm một hình đúng loại là xong (không đếm). */
function findOne(ctx, svg, kind, shapeById) {
  const { teacher, signal } = ctx;
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      svg.removeEventListener('click', onTap);
      signal.removeEventListener('abort', onAbort);
    };
    const onAbort = () => {
      cleanup();
      reject(abortError());
    };
    const onTap = (e) => {
      const hit = e.target.closest?.('[data-shape]');
      if (!hit) return;
      const el = shapeById(hit.dataset.shape);
      if (hit.dataset.kind === kind) {
        cleanup();
        el.classList.add('sc-flash');
        play('ding');
        teacher.say(foundOneLine(kind)[0]).then(() => {
          el.classList.remove('sc-flash');
          resolve();
        }, reject);
        return;
      }
      shake(el);
      teacher.say(otherShapeLine(hit.dataset.kind)[0]).catch(() => {});
    };
    svg.addEventListener('click', onTap);
    signal.addEventListener('abort', onAbort, { once: true });
    teacher.say(findOneLine(kind)[0]).catch(() => {});
  });
}

/**
 * Chờ bé chạm đếm hết các hình đúng loại. Mỗi hình chỉ đếm một lần (chạm lại thì đọc lại số của nó);
 * chạm hình khác loại thì nói tên hình đó; 10 giây không chạm thì gợi ý (tối đa 2 lần).
 */
function waitCount(ctx, { svg, kind, targets, counted, counter, shapeById, bounce }) {
  const { teacher, signal } = ctx;
  return new Promise((resolve, reject) => {
    let hints = 0;
    let wrong = 0;
    let timer = null;
    const cleanup = () => {
      clearTimeout(timer);
      svg.removeEventListener('click', onTap);
      signal.removeEventListener('abort', onAbort);
    };
    const left = () => targets.filter((el) => !counted.has(el.dataset.shape));
    const arm = () => {
      clearTimeout(timer);
      if (hints >= MAX_HINTS) return;
      timer = setTimeout(() => {
        hints += 1;
        const rest = left();
        (hints === 1 ? rest.slice(0, 1) : rest).forEach((el) => {
          el.classList.remove('sc-hint');
          void el.getBoundingClientRect();
          el.classList.add('sc-hint');
        });
        arm();
      }, scaled(HINT_MS));
    };
    const onAbort = () => {
      cleanup();
      reject(abortError());
    };
    const onTap = (e) => {
      const hit = e.target.closest?.('[data-shape]');
      if (!hit) return; // chỗ trống / nét trang trí
      const id = hit.dataset.shape;
      const el = shapeById(id);
      arm();
      if (hit.dataset.kind !== kind) {
        shake(el);
        wrong += 1;
        const line = wrong % WRONG_TO_REMIND === 0 ? findAllLine(kind) : otherShapeLine(hit.dataset.kind);
        if (wrong % WRONG_TO_REMIND === 0) bounce(svg.closest('.sc-card').querySelector('.sc-target'));
        teacher.say(line[0]).catch(() => {});
        return;
      }
      if (counted.has(id)) {
        bounce(el);
        teacher.say(againLine(counted.get(id))[0]).catch(() => {});
        return;
      }
      const n = counted.size + 1;
      counted.set(id, n);
      el.classList.add('sc-counted');
      el.classList.remove('sc-hint');
      badge(svg, el, n);
      counter.textContent = String(n);
      play('pop');
      if (counted.size >= targets.length) {
        cleanup();
        teacher.say(countWord(n)).then(() => resolve(), () => resolve());
        return;
      }
      // Không chờ: chạm nhanh thì số mới thay số cũ (huy hiệu vẫn hiện đủ).
      teacher.say(countWord(n)).catch(() => {});
    };
    svg.addEventListener('click', onTap);
    signal.addEventListener('abort', onAbort, { once: true });
    arm();
  });
}
