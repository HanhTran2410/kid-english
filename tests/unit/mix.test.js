import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectItems, pickReviewItems, pickPlayItems, distractors, spreadKinds, learnedKeys } from '../../app/js/mix.js';
import { builtInNumberLessons } from '../../app/js/numbers.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const words = (id, list) => ({ id, title: id, words: list.map((en) => ({ en, emoji: '🐾' })) });
const phrases = (id, list) => ({ id, title: id, kind: 'phrases', phrases: list.map((en, i) => ({ id: `p${i + 1}`, en, emoji: '💬' })) });
const [countLesson, gameLesson] = builtInNumberLessons().map((l, i) => ({ ...l, id: `n${i}` }));
const LESSONS = [
  words('animals', ['cow', 'dog', 'cat', 'pig']),
  words('colors', ['red', 'blue', 'cow']), // "cow" trùng: chỉ tính một lần
  phrases('morning', ['Wake up', 'Wash your face', 'Brush your teeth']),
  countLesson,
  gameLesson,
];
const rec = (word, mastery, extra = {}) => [word, { word, mastery, practiceCount: 1, lastPracticedAt: Date.now(), ...extra }];

test('gom mục từ mọi bài: 3 loại, không trùng (từ trùng ở 2 bài, số ở 2 bài số)', () => {
  const items = collectItems(LESSONS);
  const kinds = (k) => items.filter((i) => i.kind === k).map((i) => i.en);
  assert.deepEqual(kinds('word'), ['cow', 'dog', 'cat', 'pig', 'red', 'blue']);
  assert.deepEqual(kinds('phrase'), ['Wake up', 'Wash your face', 'Brush your teeth']);
  assert.equal(kinds('number').length, 10);
  assert.equal(items.find((i) => i.en === 'Wake up').key, 'phrase:wake up');
  assert.equal(items.find((i) => i.kind === 'number' && i.en === '3').key, 'number:3');
});

test('Ôn tập: chỉ mục đã học, 8 câu, có đủ loại đã học, ưu tiên chưa thuộc, không 3 câu liền cùng loại', () => {
  const records = new Map([
    rec('cow', 5), rec('dog', 0), rec('cat', 1), rec('pig', 5), rec('red', 5), rec('blue', 5),
    rec('phrase:wake up', 1), rec('number:3', 0), rec('number:4', 5),
  ]);
  const items = collectItems(LESSONS, records);
  for (let seed = 1; seed < 20; seed++) {
    const picked = pickReviewItems(items, { rng: seeded(seed) });
    assert.equal(picked.length, 8);
    assert.ok(picked.every((i) => i.record?.practiceCount > 0), 'chỉ mục đã học');
    for (const k of ['word', 'phrase', 'number']) assert.ok(picked.some((i) => i.kind === k), k);
    for (const key of ['dog', 'cat', 'phrase:wake up', 'number:3']) assert.ok(picked.some((i) => i.key === key), `ưu tiên ${key}`);
    assert.ok(picked.every((x, i) => i < 2 || !(picked[i - 1].kind === x.kind && picked[i - 2].kind === x.kind)), picked.map((i) => i.kind).join(','));
  }
  assert.deepEqual(pickReviewItems(collectItems(LESSONS)), [], 'chưa học gì thì không có câu ôn');
});

test('Trò chơi tổng hợp: 10 câu, có cả mục chưa học, không lặp, mỗi loại ít nhất 1', () => {
  const records = new Map([rec('cow', 1), rec('dog', 2)]);
  const items = collectItems(LESSONS, records);
  for (let seed = 1; seed < 20; seed++) {
    const picked = pickPlayItems(items, { rng: seeded(seed) });
    assert.equal(picked.length, 10);
    assert.equal(new Set(picked.map((i) => i.key)).size, 10);
    assert.ok(picked.some((i) => !i.record), 'có mục chưa học');
    assert.ok(picked.some((i) => i.key === 'cow') && picked.some((i) => i.key === 'dog'), 'có mục đã học');
    for (const k of ['word', 'phrase', 'number']) assert.ok(picked.some((i) => i.kind === k), k);
  }
  assert.deepEqual([...learnedKeys(items)].sort(), ['cow', 'dog']);
});

test('đáp án sai: cùng loại, khác đáp án đúng, ưu tiên cùng bài', () => {
  const items = collectItems(LESSONS);
  const dog = items.find((i) => i.key === 'dog');
  for (let seed = 1; seed < 20; seed++) {
    const d = distractors(dog, items, { rng: seeded(seed) });
    assert.equal(d.length, 2);
    assert.ok(d.every((x) => x.kind === 'word' && x.key !== 'dog' && x.lessonId === 'animals'));
  }
  const wake = items.find((i) => i.key === 'phrase:wake up');
  assert.ok(distractors(wake, items).every((x) => x.kind === 'phrase' && x.key !== wake.key));
  // Bài chỉ có 1 từ khác: lấy thêm ở bài khác.
  const only = collectItems([words('a', ['sun', 'moon']), words('b', ['tree'])]);
  assert.deepEqual(distractors(only[0], only).map((x) => x.en).sort(), ['moon', 'tree']);
});

test('trộn loại: không có 3 mục liền nhau cùng loại khi còn loại khác', () => {
  const list = [...Array(5)].map(() => ({ kind: 'word' })).concat([{ kind: 'phrase' }, { kind: 'number' }]);
  for (let seed = 1; seed < 20; seed++) {
    const out = spreadKinds(list, seeded(seed));
    assert.equal(out.length, 7);
    let run = 1;
    let maxRun = 1;
    for (let i = 1; i < out.length; i++) {
      run = out[i].kind === out[i - 1].kind ? run + 1 : 1;
      maxRun = Math.max(maxRun, run);
    }
    // 5 từ + 2 loại khác: chia được thành nhóm tối đa 2 (w w x w w y w).
    assert.ok(maxRun <= 2, out.map((x) => x.kind).join(","));
  }
});
