// Bưu tá (SPEC-jobs.md mục 4): dãy nhà, thư theo mức, mỗi thư đúng một nhà (JOBS-04), câu nói.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HOUSES, COLORS, makeStreet, makeLetters, planRound, letterLine, wrongLine, address, LETTERS_PER_ROUND } from '../../app/js/jobs/post.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
/** Các nhà khớp địa chỉ của thư. */
const matches = (street, h, kind) => street.filter((x) => address(x, kind)[0] === address(h, kind)[0]);

test('dãy nhà: đúng số nhà theo mức; mức 1 / 3 khác màu, mức 2 cùng màu; số tăng dần không trùng; bạn thú không trùng', () => {
  const rng = seeded(4);
  for (const level of [1, 2, 3]) for (let i = 0; i < 50; i++) {
    const street = makeStreet(level, { rng });
    assert.equal(street.length, HOUSES[level]);
    const colors = new Set(street.map((h) => h.color));
    assert.equal(colors.size, level === 2 ? 1 : street.length);
    assert.ok(street.every((h) => COLORS.some((c) => c.id === h.color)));
    const nums = street.map((h) => h.number);
    assert.deepEqual(nums, [...nums].sort((a, b) => a - b));
    assert.equal(new Set(nums).size, nums.length);
    assert.ok(nums.every((n) => n >= 1 && n <= 5));
    assert.equal(new Set(street.map((h) => h.resident)).size, street.length);
  }
});

test('thư: 5 thư, hai thư liền nhau không cùng nhà nhận; kiểu địa chỉ theo mức; JOBS-04 — mỗi thư khớp đúng một nhà', () => {
  const rng = seeded(9);
  for (const level of [1, 2, 3]) for (let i = 0; i < 50; i++) {
    const { street, letters } = planRound(level, { rng });
    assert.equal(letters.length, LETTERS_PER_ROUND);
    for (let k = 1; k < letters.length; k++) assert.notEqual(letters[k].house, letters[k - 1].house);
    const kinds = new Set(letters.map((l) => l.kind));
    if (level === 1) assert.deepEqual([...kinds], ['color']);
    if (level === 2) assert.deepEqual([...kinds], ['number']);
    if (level === 3) assert.equal(kinds.size, 3);
    for (const l of letters) assert.equal(matches(street, street[l.house], l.kind).length, 1, `mức ${level}: ${l.kind}`);
  }
  assert.equal(makeLetters([{ color: 'red', number: 1, resident: 'teddy' }, { color: 'blue', number: 2, resident: 'kitty' }], 1, { rng }).length, 5);
});

test('câu: thư theo màu / số / tên; nhầm nhà nói đúng kiểu của thư', () => {
  const h = { color: 'red', number: 3, resident: 'kitty' };
  assert.equal(letterLine(h, 'color')[0], 'This letter is for the red house!');
  assert.equal(letterLine(h, 'number')[0], 'This letter is for house number three!');
  assert.equal(letterLine(h, 'name')[0], 'This letter is for Kitty!');
  const other = { color: 'blue', number: 2, resident: 'teddy' };
  assert.equal(wrongLine(other, 'color')[0], 'Not for me! This is the blue house.');
  assert.equal(wrongLine(other, 'number')[0], 'Not for me! This is house number two.');
  assert.equal(wrongLine(other, 'name')[0], "Not for me! I'm Teddy.");
  for (const kind of ['color', 'number', 'name']) for (const [en, vi] of [letterLine(h, kind), wrongLine(other, kind)]) {
    assert.ok(en && vi && !/undefined|null/.test(en + vi), en);
  }
});
