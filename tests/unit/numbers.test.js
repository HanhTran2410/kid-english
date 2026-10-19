import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NUMBER_ITEMS, builtInNumberLessons, countPhrase, numberKey, validateNumberLesson, buildCountSteps, itemRows,
  groupDistractor, numberChoices, buildGameRounds, isNumberLesson,
} from '../../app/js/numbers.js';
import { lessonKind, isWordLesson } from '../../app/js/phrase.js';
import { wordRecords, numberRecords, phraseRecords } from '../../app/js/progress.js';

/** Bộ sinh số ngẫu nhiên cố định để test lặp lại được. */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

test('đồ vật 1–10: đủ 10 số, mỗi số một đồ vật khác nhau', () => {
  assert.deepEqual(NUMBER_ITEMS.map((x) => x.n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(new Set(NUMBER_ITEMS.map((x) => x.emoji)).size, 10);
});

test('Bông nói đúng số ít / số nhiều', () => {
  const by = new Map(NUMBER_ITEMS.map((x) => [x.n, x]));
  assert.equal(countPhrase(by.get(1)), 'One balloon');
  assert.equal(countPhrase(by.get(2)), 'Two crayons');
  assert.equal(countPhrase(by.get(6)), 'Six fish');
  assert.equal(countPhrase(by.get(10)), 'Ten teddy bears');
  assert.equal(countPhrase(by.get(3), 1), 'One apple', 'đếm nhóm khác số lượng');
});

test('bài số có sẵn: bài đếm và trò chơi, nhận đúng loại bài', () => {
  const [count, game] = builtInNumberLessons();
  assert.equal(count.mode, 'count');
  assert.equal(game.mode, 'game');
  for (const l of [count, game]) {
    assert.equal(isNumberLesson(l), true);
    assert.equal(lessonKind(l), 'numbers');
    assert.equal(isWordLesson(l), false);
    assert.equal(validateNumberLesson(l).ok, true);
  }
  assert.equal(lessonKind({ words: [] }), 'words');
  assert.equal(lessonKind({ phrases: [] }), 'phrases');
});

test('kiểm tra bài số: bỏ số trùng/lạ, thiếu số nhiều thì thêm "s", không có số nào thì từ chối', () => {
  const r = validateNumberLesson({
    title: 'X',
    numbers: [{ n: 2, item: 'cup', emoji: '🥤' }, { n: 2, item: 'cup', emoji: '🥤' }, { n: 21, item: 'a', emoji: 'a' }, { n: 1, item: 'hat', emoji: '🎩' }],
  });
  assert.equal(r.ok, true);
  assert.deepEqual(r.lesson.numbers.map((x) => x.n), [1, 2]);
  assert.equal(r.lesson.numbers[1].items, 'cups');
  assert.equal(validateNumberLesson({ title: 'X', numbers: [] }).ok, false);
  assert.equal(validateNumberLesson({ numbers: NUMBER_ITEMS }).ok, false);
});

test('các bước bài đếm: mỗi số xem đếm → chạm đếm, từ số 3 thêm chọn nhóm', () => {
  const [count] = builtInNumberLessons();
  const steps = buildCountSteps(count);
  assert.deepEqual(steps.slice(0, 7).map((s) => s.stage), ['count', 'tap', 'count', 'tap', 'count', 'tap', 'group']);
  assert.equal(steps.length, 10 * 2 + 8);
});

test('đồ vật xếp hàng tối đa 5 cái', () => {
  assert.deepEqual(itemRows(3), [3]);
  assert.deepEqual(itemRows(5), [5]);
  assert.deepEqual(itemRows(6), [5, 1]);
  assert.deepEqual(itemRows(10), [5, 5]);
});

test('nhóm sai ở bước chọn nhóm luôn chênh ít nhất 2', () => {
  const rng = seeded(7);
  for (let n = 3; n <= 10; n++) {
    for (let k = 0; k < 30; k++) {
      const m = groupDistractor(n, rng);
      assert.ok(Math.abs(m - n) >= 2 && m >= 1 && m <= 10, `${n} vs ${m}`);
    }
  }
});

test('thẻ chữ số: có số đúng, 3 thẻ khác nhau, không có 6 và 9 cùng lúc, chưa học 6–10 thì thẻ sai từ 1–5', () => {
  const rng = seeded(3);
  for (let n = 1; n <= 10; n++) {
    for (let k = 0; k < 40; k++) {
      const c = numberChoices(n, rng);
      assert.equal(c.length, 3);
      assert.ok(c.includes(n));
      assert.equal(new Set(c).size, 3);
      assert.ok(!(c.includes(6) && c.includes(9)), c.join(','));
      const low = numberChoices(n, rng, { allowHigh: false });
      assert.ok(low.filter((m) => m !== n).every((m) => m <= 5), low.join(','));
    }
  }
});

test('trò chơi: 8 câu, nửa dễ nửa khó, không số nào quá 2 lần, không hỏi lặp liền nhau, xen kẽ 2 kiểu', () => {
  for (let seed = 1; seed < 30; seed++) {
    const rounds = buildGameRounds([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], new Map(), { rng: seeded(seed) });
    assert.equal(rounds.length, 8);
    const ns = rounds.map((r) => r.n);
    assert.equal(ns.filter((n) => n <= 5).length, 4);
    assert.equal(ns.filter((n) => n > 5).length, 4);
    for (const n of ns) assert.ok(ns.filter((m) => m === n).length <= 2);
    assert.ok(ns.every((n, i) => i === 0 || ns[i - 1] !== n), ns.join(','));
    assert.deepEqual(rounds.map((r) => r.type).slice(0, 4), ['find', 'count', 'find', 'count']);
  }
});

test('trò chơi ưu tiên số bé ít sao', () => {
  const mastery = new Map([[1, 5], [2, 5], [3, 0], [4, 5], [5, 5], [6, 5], [7, 5], [8, 0], [9, 5], [10, 5]]);
  const rounds = buildGameRounds([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], mastery, { rounds: 2, rng: seeded(5) });
  assert.deepEqual(rounds.map((r) => r.n).sort((a, b) => a - b), [3, 8]);
});

test('tiến độ số (number:n) không lẫn vào từ vựng và câu', () => {
  assert.equal(numberKey(3), 'number:3');
  const records = [{ word: 'three' }, { word: 'number:3' }, { word: 'phrase:wash your face' }];
  assert.deepEqual(wordRecords(records).map((r) => r.word), ['three']);
  assert.deepEqual(numberRecords(records).map((r) => r.word), ['number:3']);
  assert.deepEqual(phraseRecords(records).map((r) => r.word), ['phrase:wash your face']);
});

test('bài 11–20: đồ vật, số ít / số nhiều, mã bài cố định để tự thêm cho máy cũ', async () => {
  const { TEEN_ITEMS } = await import('../../app/js/numbers.js');
  const lessons = builtInNumberLessons();
  assert.deepEqual(lessons.map((l) => l.builtin), ['count-1-10', 'game-1-10', 'count-11-20', 'game-11-20', 'shapes-1']);
  const teen = lessons[2];
  assert.deepEqual(teen.numbers.map((x) => x.n), [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  assert.equal(validateNumberLesson(teen).ok, true);
  const by = new Map(TEEN_ITEMS.map((x) => [x.n, x]));
  assert.equal(countPhrase(by.get(15)), 'Fifteen butterflies');
  assert.equal(countPhrase(by.get(20)), 'Twenty leaves');
  assert.equal(countPhrase(by.get(17)), 'Seventeen candies');
  const steps = buildCountSteps(teen);
  assert.equal(steps.length, 30, 'mỗi số: đếm, chạm đếm, chọn nhóm');
});

test('11–20: thẻ sai và nhóm sai lấy trong 11–20; 1–10 vẫn lấy trong 1–10', () => {
  const rng = seeded(11);
  for (let k = 0; k < 50; k++) {
    for (const n of [11, 15, 20]) {
      const c = numberChoices(n, rng);
      assert.ok(c.includes(n) && c.every((m) => m >= 11 && m <= 20) && new Set(c).size === 3, c.join(','));
      const m = groupDistractor(n, rng);
      assert.ok(m >= 11 && m <= 20 && Math.abs(m - n) >= 2, `${n} vs ${m}`);
    }
    const low = numberChoices(7, rng);
    assert.ok(low.every((m) => m >= 1 && m <= 10), low.join(','));
  }
});

test('trò Chọn số 11–20: 8 câu, nửa 11–15 nửa 16–20, thẻ trong 11–20', () => {
  const game = builtInNumberLessons().find((l) => l.builtin === 'game-11-20');
  assert.equal(game.mode, 'game');
  assert.equal(validateNumberLesson(game).ok, true);
  for (let seed = 1; seed < 20; seed++) {
    const rounds = buildGameRounds(game.numbers.map((x) => x.n), new Map(), { rng: seeded(seed) });
    const ns = rounds.map((r) => r.n);
    assert.equal(ns.length, 8);
    assert.equal(ns.filter((n) => n <= 15).length, 4);
    assert.equal(ns.filter((n) => n > 15).length, 4);
    for (const r of rounds) assert.ok(numberChoices(r.n, seeded(seed)).every((m) => m >= 11 && m <= 20));
  }
});
