// Bưu tá (SPEC-jobs.md mục 4): dãy nhà, thư theo mức, mỗi thư đúng một nhà (JOBS-04), câu nói.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HOUSES, COLORS, makeStreet, makeLetters, planRound, letterLine, wrongLine, address, LETTERS_PER_ROUND,
  planStamp, matchesStamp, stampLine, stampWantLine, stampWrongLine, parcelItemOf, makeParcel, DEFAULT_PARCEL_ITEMS,
  parcelLine, guessLine, itsLine, parcelThanksLine,
} from '../../app/js/jobs/post.js';

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

test('SPEC-jobs2 PO1 — tem: mức 1 3 tem không yêu cầu; mức 2 3 tem khác hình, yêu cầu theo hình, đúng một cái khớp; mức 3 4 tem, hình + màu, đúng một cái khớp; mỗi lượt 3 bộ tem', () => {
  const rng = seeded(41);
  for (let i = 0; i < 60; i++) {
    const s1 = planStamp(1, { rng });
    assert.equal(s1.set.length, 3);
    assert.equal(s1.want, null);
    const s2 = planStamp(2, { rng });
    assert.equal(s2.set.length, 3);
    assert.equal(new Set(s2.set.map((x) => x.shape)).size, 3);
    assert.ok(s2.want.shape && !s2.want.color);
    assert.equal(s2.set.filter((x) => matchesStamp(x, s2.want)).length, 1);
    const s3 = planStamp(3, { rng });
    assert.equal(s3.set.length, 4);
    assert.ok(s3.want.shape && s3.want.color);
    assert.equal(s3.set.filter((x) => matchesStamp(x, s3.want)).length, 1);
  }
  assert.equal(planRound(2, { rng }).stamps.length, 3);
  assert.equal(stampLine({ color: 'red', shape: 'star' })[0], 'A red star stamp!');
  assert.equal(stampWantLine({ shape: 'heart' })[0], 'A heart stamp, please!');
  assert.equal(stampWantLine({ shape: 'circle', color: 'blue' })[0], 'A blue circle stamp, please!');
  assert.equal(stampWrongLine({ color: 'green', shape: 'star' }, { shape: 'heart' })[0], "That's a green star stamp. A heart stamp, please!");
});

test('SPEC-jobs2 PO1 — bưu kiện: đúng một thư mỗi lượt; đồ trong hộp là danh từ đếm được (theo câu mẫu "a / an"), ưu tiên từ đã học, thiếu thì bộ mặc định; mức 3 có câu đoán (đúng / sai đồ khác)', () => {
  const rng = seeded(43);
  assert.deepEqual(parcelItemOf({ en: 'egg', vi: 'quả trứng', emoji: '🥚', sentence: 'I eat an egg.' }), { en: 'egg', article: 'an', emoji: '🥚', vi: 'quả trứng' });
  assert.equal(parcelItemOf({ en: 'rice', emoji: '🍚', sentence: 'I eat rice.' }), null);
  assert.equal(parcelItemOf({ en: 'ice cream', emoji: '🍦', sentence: 'I like an ice cream.' }), null);
  assert.equal(parcelItemOf({ en: 'dog', sentence: 'I see a dog.' }), null); // không có emoji
  let right = 0;
  for (let i = 0; i < 80; i++) {
    const { letters } = planRound(1 + (i % 3), { rng, words: [{ en: 'egg', vi: 'quả trứng', emoji: '🥚', sentence: 'I eat an egg.' }] });
    const parcels = letters.filter((l) => l.parcel);
    assert.equal(parcels.length, 1);
    assert.equal(parcels[0].parcel.item.en, 'egg');
    const p3 = makeParcel(3, { rng });
    assert.ok(DEFAULT_PARCEL_ITEMS.some((d) => d.en === p3.item.en));
    assert.ok(p3.guess);
    assert.equal(p3.guess.en === p3.item.en, p3.guessRight);
    if (p3.guessRight) right += 1;
    assert.equal(makeParcel(2, { rng }).guess, null);
  }
  assert.ok(right > 20 && right < 60);
  const house = { color: 'green', number: 3, resident: 'kitty' };
  assert.equal(parcelLine(house, 'color')[0], 'A parcel for the green house!');
  assert.equal(guessLine({ en: 'car', article: 'a' })[0], 'Is it a car?');
  assert.equal(itsLine({ en: 'apple', article: 'an' })[0], "It's an apple!");
  assert.equal(parcelThanksLine({ en: 'ball', article: 'a', vi: 'quả bóng' })[0], 'A ball! Thank you!');
  assert.equal(parcelThanksLine({ en: 'egg', article: 'an', vi: 'quả trứng' })[0], 'An egg! Thank you!');
});
