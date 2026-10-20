// Ai kêu thế? (SPEC-sounds.md): con vật dùng sticker Dán tranh, câu hỏi theo mức, câu nói, lên mức.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEM_BY_ID } from '../../app/js/sticker-scenes.js';
import {
  ANIMALS, LEVELS, roundQuestions, soundLine, whoLine, yesLine, wrongLine, cleanSoundsState, afterSoundsRound,
} from '../../app/js/animal-sounds.js';

test('15 con vật: đều là sticker Dán tranh (cùng emoji / ảnh), tiếng kêu không trùng nhau', () => {
  assert.equal(ANIMALS.length, 15);
  for (const a of ANIMALS) {
    assert.equal(ITEM_BY_ID.get(a.id)?.emoji, a.emoji, a.id);
    assert.ok(a.vi.startsWith('con '), a.id);
    assert.match(a.sound, /!$/);
  }
  assert.equal(new Set(ANIMALS.map((a) => a.says)).size, ANIMALS.length);
  assert.equal(LEVELS[3].pool, ANIMALS.length);
});

test('câu hỏi theo mức: 5 câu, đáp án không lặp, lựa chọn đủ số và khác nhau, đáp án nằm trong lựa chọn và trong nhóm của mức', () => {
  for (const level of [1, 2, 3]) {
    const { choices, pool } = LEVELS[level];
    const group = new Set(ANIMALS.slice(0, pool).map((a) => a.id));
    for (let i = 0; i < 30; i++) {
      const qs = roundQuestions(level);
      assert.equal(qs.length, 5);
      assert.equal(new Set(qs.map((q) => q.answer)).size, 5);
      for (const q of qs) {
        assert.equal(q.choices.length, choices);
        assert.equal(new Set(q.choices).size, choices);
        assert.ok(q.choices.includes(q.answer));
        assert.ok(q.choices.every((id) => group.has(id)), `mức ${level}: ${q.choices}`);
      }
    }
  }
  // Ưu tiên con bé ít gặp: mọi con đã gặp nhiều trừ cow → cow luôn được hỏi.
  const seen = new Map(ANIMALS.map((a) => [a.name, 9]));
  seen.set('cow', 0);
  for (let i = 0; i < 10; i++) assert.ok(roundQuestions(1, { seen }).some((q) => q.answer === 'cow'));
});

test('câu nói: giả tiếng kêu không lộ tên con vật; hỏi; đúng; nhầm', () => {
  const cow = ANIMALS.find((a) => a.id === 'cow');
  const pig = ANIMALS.find((a) => a.id === 'pig');
  assert.deepEqual(soundLine(cow), ['Moo! Moo!', '(Bông giả tiếng kêu)']);
  assert.ok(!soundLine(cow).join(' ').includes('bò'));
  assert.deepEqual(whoLine(cow), ['Who says moo?', 'Con gì kêu "moo" nhỉ?']);
  assert.deepEqual(yesLine(cow), ['Yes! The cow says moo!', 'Đúng rồi! Con bò kêu "moo"!']);
  assert.deepEqual(wrongLine(pig), ["That's the pig! The pig says oink!", 'Đó là con lợn! Con lợn kêu "oink"!']);
});

test('mức: lên sau 3 lượt (tối đa 3), khóa thì giữ, dữ liệu hỏng về mức 1', () => {
  let s = cleanSoundsState(undefined);
  assert.deepEqual(s, { level: 1, rounds: 0, lock: null });
  for (let i = 0; i < 9; i++) s = afterSoundsRound(s);
  assert.equal(s.level, 3);
  assert.equal(afterSoundsRound(afterSoundsRound(afterSoundsRound(cleanSoundsState({ lock: 1 })))).level, 1);
  assert.deepEqual(cleanSoundsState({ level: 9, rounds: 'x' }), { level: 1, rounds: 0, lock: null });
});

test('review: tối đa 3 / 5 câu là con ít gặp nhất (không dồn hết vào con lạ); khóa mức thì không đếm lượt, mở khóa đếm lại từ 0', async () => {
  const { LEAST_SEEN_PER_ROUND } = await import('../../app/js/animal-sounds.js');
  assert.equal(LEAST_SEEN_PER_ROUND, 3);
  // Mức 3: 5 con mới (frog…snake) bé chưa gặp, 10 con còn lại đã gặp nhiều.
  const fresh = new Set(['frog', 'monkey', 'owl', 'bee', 'snake']);
  const seen = new Map(ANIMALS.map((a) => [a.name, fresh.has(a.id) ? 0 : 9]));
  // Luôn có 3 con ít gặp nhất; 2 câu còn lại ngẫu nhiên (có thể trúng con lạ) — nhưng không phải lượt nào cũng toàn con lạ.
  const counts = Array.from({ length: 200 }, () => roundQuestions(3, { seen }).filter((q) => fresh.has(q.answer)).length);
  assert.ok(counts.every((n) => n >= 3), 'thiếu con ít gặp');
  assert.ok(counts.filter((n) => n === 5).length < 40, 'lượt toàn con lạ quá nhiều');
  // Khóa mức 2: chơi bao nhiêu lượt cũng giữ mức 2, không tích lượt; mở khóa thì đếm từ 0.
  let s = cleanSoundsState({ level: 1, rounds: 2, lock: 2 });
  for (let i = 0; i < 5; i++) s = afterSoundsRound(s);
  assert.deepEqual(s, { level: 2, rounds: 0, lock: 2 });
  s = afterSoundsRound({ ...s, lock: null });
  assert.deepEqual(s, { level: 2, rounds: 1, lock: null });
});
