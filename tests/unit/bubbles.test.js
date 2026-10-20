// Bắt bong bóng (SPEC-bubbles.md): thứ trong bong bóng theo chế độ, kế hoạch lượt, bong bóng mới, câu nói, mức.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LEVELS, BUBBLE_COLORS, itemsFor, roundPlan, nextBubble, popLine, yesLine, nameLine, progressKeyOf, cleanBubblesState, afterBubblesRound,
} from '../../app/js/bubbles.js';

test('chế độ: 7 màu tươi; số 1–5 ở mức 1, 1–10 từ mức 2; từ của bài (có emoji, không trùng)', () => {
  assert.deepEqual(BUBBLE_COLORS.map((c) => c.id), ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink']);
  assert.equal(itemsFor('numbers', 1).length, 5);
  assert.equal(itemsFor('numbers', 2).at(-1).en, 'ten');
  const words = itemsFor('words', 1, [
    { en: 'cat', vi: 'con mèo', emoji: '🐱' }, { en: 'Cat', vi: 'mèo', emoji: '🐈' }, { en: 'dog', emoji: '' }, { en: 'cow', vi: 'con bò', emoji: '🐮' },
  ]);
  assert.deepEqual(words.map((w) => w.key), ['cat', 'cow']);
});

test('kế hoạch lượt: đúng số loại theo mức, 8 lần bắt, mỗi loại ít nhất một lần, không lặp liền; ưu tiên thứ ít gặp', () => {
  const items = itemsFor('colors', 1);
  for (const level of [1, 2, 3]) {
    for (let i = 0; i < 30; i++) {
      const { kinds, targets } = roundPlan(items, level);
      assert.equal(kinds.length, LEVELS[level].kinds);
      assert.equal(targets.length, 8);
      for (const k of kinds) assert.ok(targets.includes(k.key), `${k.key} không được bắt`);
      for (let j = 1; j < targets.length; j++) assert.notEqual(targets[j], targets[j - 1]);
    }
  }
  const seen = new Map(items.map((c) => [c.en, 9]));
  seen.set('pink', 0);
  for (let i = 0; i < 10; i++) assert.ok(roundPlan(items, 1, { seen, progressKey: (it) => it.en }).kinds.some((k) => k.key === 'pink'));
});

test('bong bóng mới: chưa có thứ cần bắt trên màn thì luôn ra thứ đó; có rồi thì có lúc ra thứ khác', () => {
  const { kinds } = roundPlan(itemsFor('colors', 1), 1);
  const target = kinds[0].key;
  for (let i = 0; i < 20; i++) assert.equal(nextBubble(kinds, target, [kinds[1].key]).key, target);
  const keys = new Set(Array.from({ length: 60 }, () => nextBubble(kinds, target, [target]).key));
  assert.ok(keys.size > 1);
  // Đã có 2 quả cần bắt trên màn: quả mới luôn là thứ khác.
  for (let i = 0; i < 30; i++) assert.notEqual(nextBubble(kinds, target, [target, target]).key, target);
});

test('câu nói theo chế độ; khóa tiến độ (số theo number:n như bài số)', () => {
  const red = itemsFor('colors', 1).find((c) => c.key === 'red');
  const three = itemsFor('numbers', 1)[2];
  const cat = itemsFor('words', 1, [{ en: 'cat', vi: 'con mèo', emoji: '🐱' }])[0];
  assert.deepEqual(popLine('colors', red), ['Pop the red one!', 'Bắt quả màu đỏ!']);
  assert.deepEqual(popLine('numbers', three), ['Pop number three!', 'Bắt số ba!']);
  assert.deepEqual(popLine('words', cat), ['Pop the cat!', 'Bắt con mèo!']);
  assert.deepEqual(yesLine('colors', red), ['Yes! Red!', 'Đúng rồi! Màu đỏ!']);
  assert.deepEqual(nameLine('numbers', three), ['Three!', 'Số ba!']);
  assert.equal(progressKeyOf('numbers', three), 'number:3');
  assert.equal(progressKeyOf('words', cat), 'cat');
});

test('mức: lên sau 3 lượt, khóa thì giữ', () => {
  let s = cleanBubblesState(null);
  for (let i = 0; i < 3; i++) s = afterBubblesRound(s);
  assert.equal(s.level, 2);
  assert.equal(afterBubblesRound(afterBubblesRound(afterBubblesRound(cleanBubblesState({ lock: 1 })))).level, 1);
});

test('review: đầy thì không thả; luôn chừa một chỗ cho quả cần bắt; quả cần bắt bay mất thì lần thả sau là quả thay thế; khóa mức không đếm lượt', () => {
  const { kinds } = roundPlan(itemsFor('colors', 1), 1);
  const t = kinds[0].key;
  const o = kinds[1].key;
  // Đầy (5 / 5): bỏ lượt thả.
  assert.equal(nextBubble(kinds, t, [t, o, o, o, o], Math.random, 5), null);
  // Còn 1 chỗ, đã có quả cần bắt: không thả quả khác (chừa chỗ).
  for (let i = 0; i < 20; i++) assert.equal(nextBubble(kinds, t, [t, o, o, o], Math.random, 5), null);
  // Quả cần bắt vừa bay mất (còn 4 quả khác, 1 chỗ trống): quả mới chắc chắn là quả cần bắt.
  for (let i = 0; i < 20; i++) assert.equal(nextBubble(kinds, t, [o, o, o, o], Math.random, 5).key, t);
  let s = cleanBubblesState({ level: 1, rounds: 2, lock: 1 });
  for (let i = 0; i < 4; i++) s = afterBubblesRound(s);
  assert.deepEqual(s, { level: 1, rounds: 0, lock: 1 });
});
