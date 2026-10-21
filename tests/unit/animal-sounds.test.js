// Ai kêu thế? (SPEC-sounds.md): con vật dùng sticker Dán tranh, câu hỏi theo mức, câu nói, lên mức.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEM_BY_ID } from '../../app/js/sticker-scenes.js';
import {
  ANIMALS, THINGS, ALL_SOUNDS, LEVELS, CHOICES, groupFor, roundQuestions, soundLine, whoLine, yesLine, wrongLine,
  cleanSoundsState, afterSoundsRound, SOUND_FILES, soundUrl,
} from '../../app/js/animal-sounds.js';

test('15 con vật: đều là sticker Dán tranh (cùng emoji / ảnh), tiếng kêu không trùng nhau', () => {
  assert.equal(ANIMALS.length, 15);
  for (const a of ANIMALS) {
    assert.equal(ITEM_BY_ID.get(a.id)?.emoji, a.emoji, a.id);
    assert.ok(a.vi.startsWith('con '), a.id);
    assert.match(a.sound, /!$/);
  }
  assert.equal(LEVELS[3].animals, ANIMALS.length);
});

test('11 đồ vật: sticker Dán tranh nếu có (cùng emoji), bát đĩa / điện thoại dùng emoji riêng; tiếng kêu không trùng trong cả 26 thứ', () => {
  assert.equal(THINGS.length, 11);
  for (const t of THINGS) {
    if (ITEM_BY_ID.has(t.id)) assert.equal(ITEM_BY_ID.get(t.id).emoji, t.emoji, t.id);
    assert.ok(t.emoji && t.vi && t.says, t.id);
  }
  assert.equal(THINGS.find((t) => t.id === 'dishes').emoji, '🍽️');
  assert.equal(new Set(ALL_SOUNDS.map((a) => a.says)).size, ALL_SOUNDS.length);
  assert.equal(LEVELS[3].things, THINGS.length);
});

test('câu hỏi theo kiểu + mức: 5 câu, đáp án không lặp, LUÔN 4 hình khác nhau, đáp án nằm trong lựa chọn và trong nhóm', () => {
  assert.equal(CHOICES, 4);
  for (const kind of ['animals', 'things', 'mix']) for (const level of [1, 2, 3]) {
    const choices = CHOICES;
    const group = new Set(groupFor(kind, level).map((a) => a.id));
    if (kind === 'animals') assert.equal(group.size, LEVELS[level].animals);
    if (kind === 'things') assert.equal(group.size, LEVELS[level].things);
    if (kind === 'mix') assert.equal(group.size, LEVELS[level].animals + LEVELS[level].things);
    for (let i = 0; i < 30; i++) {
      const qs = roundQuestions(level, { kind });
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
  assert.deepEqual(soundLine(cow), ['Moo! Moo!', '(Tiếng kêu)']);
  assert.ok(!soundLine(cow).join(' ').includes('bò'));
  assert.deepEqual(whoLine(cow), ['Who says moo?', 'Con gì kêu "moo" nhỉ?']);
  assert.deepEqual(yesLine(cow), ['Yes! The cow says moo!', 'Đúng rồi! Con bò kêu "moo"!']);
  assert.deepEqual(wrongLine(pig), ["That's the pig! The pig says oink!", 'Đó là con lợn! Con lợn kêu "oink"!']);
  // Đồ vật: "What goes …?", "goes" / "go" theo số ít / nhiều.
  const train = THINGS.find((t) => t.id === 'train');
  const dishes = THINGS.find((t) => t.id === 'dishes');
  assert.deepEqual(whoLine(train), ['What goes choo choo?', 'Cái gì kêu "choo choo" nhỉ?']);
  assert.deepEqual(yesLine(train), ['Yes! The train goes choo choo!', 'Đúng rồi! Tàu hỏa kêu "choo choo"!']);
  assert.deepEqual(yesLine(dishes)[0], 'Yes! The dishes go clink clink!');
  assert.deepEqual(wrongLine(dishes)[0], 'Those are the dishes! The dishes go clink clink!');
});

test('file tiếng thật: chỉ thứ có file mới có đường dẫn sounds/<id>.mp3; file khai báo phải có thật trong app/sounds', async () => {
  const { existsSync } = await import('node:fs');
  for (const a of ALL_SOUNDS) {
    if (SOUND_FILES.has(a.id)) {
      assert.equal(soundUrl(a.id), `sounds/${a.id}.mp3`);
      assert.ok(existsSync(new URL(`../../app/sounds/${a.id}.mp3`, import.meta.url)), `thiếu file ${a.id}.mp3`);
    } else assert.equal(soundUrl(a.id), null);
  }
  for (const id of SOUND_FILES) assert.ok(ALL_SOUNDS.some((a) => a.id === id), id);
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
