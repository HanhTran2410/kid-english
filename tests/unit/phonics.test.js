import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LETTERS, ALPHABET, LETTER_BY, builtInPhonicsLessons, buildPhonicsSteps, letterChoices, findChoices, letterIntro,
  findQuestion, highlightIndex, letterKey, popTargets, isPhonicsLesson,
} from '../../app/js/phonics.js';
import { lessonKind } from '../../app/js/phrase.js';
import { wordRecords, letterRecords } from '../../app/js/progress.js';
import { collectItems } from '../../app/js/mix.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

test('26 chữ, mỗi chữ 3–6 từ đúng âm chính (bắt đầu bằng chữ đó; X: có chữ x), không trùng hình', () => {
  assert.equal(LETTERS.length, 26);
  assert.equal(ALPHABET.join(''), 'abcdefghijklmnopqrstuvwxyz');
  for (const l of LETTERS) {
    assert.ok(l.words.length >= 3 && l.words.length <= 6, l.letter);
    for (const w of l.words) {
      assert.ok(l.inside ? w.en.includes(l.letter) : w.en.startsWith(l.letter), `${l.letter}: ${w.en}`);
      assert.ok(w.emoji && !/\s/.test(w.emoji), `${w.en} có emoji`);
    }
  }
  assert.ok(!LETTER_BY.get('a').words.some((w) => w.en === 'arm'), 'không dùng "arm" cho âm /æ/');
  const emojis = LETTERS.flatMap((l) => l.words.map((w) => w.emoji));
  assert.equal(new Set(emojis).size, emojis.length);
});

test('5 bài có sẵn phủ đủ 26 chữ theo A–Z; loại bài phonics; các bước của bài', () => {
  const lessons = builtInPhonicsLessons();
  assert.deepEqual(lessons.map((l) => l.title), ['Letters A–F', 'Letters G–L', 'Letters M–R', 'Letters S–V', 'Letters W–Z']);
  assert.equal(lessons.flatMap((l) => l.letters.map((x) => x.letter)).join(''), ALPHABET.join(''));
  assert.equal(new Set(lessons.map((l) => l.builtin)).size, 5);
  for (const l of lessons) {
    assert.equal(isPhonicsLesson(l), true);
    assert.equal(lessonKind(l), 'phonics');
  }
  const steps = buildPhonicsSteps(lessons[0]).map((s) => s.stage);
  assert.deepEqual(steps.slice(0, 4), ['map', 'find', 'map', 'find']);
  assert.equal(steps.filter((s) => s === 'case').length, 4);
  assert.equal(steps.filter((s) => s === 'hear').length, 4);
  assert.equal(steps.at(-1), 'pop');
  assert.equal(buildPhonicsSteps(lessons[3]).filter((s) => s.stage === 'case').length, 4, 'bài 4 chữ: 4 lượt');
});

test('câu Bông nói: "A! A is for ant!"; chữ X là âm trong từ; tô đúng chữ', () => {
  assert.equal(letterIntro(LETTER_BY.get('a')), 'A! A is for ant!');
  assert.equal(letterIntro(LETTER_BY.get('x')), 'X! Box has X!');
  assert.equal(findQuestion(LETTER_BY.get('s')), 'Which one starts with S?');
  assert.equal(findQuestion(LETTER_BY.get('x')), 'Which one has X?');
  assert.equal(highlightIndex('ant', 'a'), 0);
  assert.equal(highlightIndex('box', 'x'), 2);
  assert.equal(letterKey('b'), 'letter:b');
});

test('thẻ chữ: có chữ đúng, 3 thẻ khác nhau, ưu tiên chữ trong bài, không có cặp dễ nhầm (b/d, p/q…)', () => {
  const rng = seeded(4);
  const pool = ['a', 'b', 'c', 'd', 'e', 'f'];
  for (const letter of ALPHABET) {
    for (let k = 0; k < 20; k++) {
      const c = letterChoices(letter, pool, rng);
      assert.equal(c.length, 3);
      assert.ok(c.includes(letter));
      assert.equal(new Set(c).size, 3);
      for (const [x, y] of [['b', 'd'], ['p', 'q'], ['b', 'p'], ['d', 'q']]) assert.ok(!(c.includes(x) && c.includes(y)), c.join(','));
    }
  }
  const inPool = letterChoices('c', pool, seeded(1));
  assert.ok(inPool.every((l) => pool.includes(l)), 'đủ chữ trong bài thì chỉ lấy chữ trong bài');
});

test('tìm từ đúng âm: đáp án là từ của chữ, 2 hình còn lại KHÔNG bắt đầu bằng chữ đó', () => {
  const lesson = builtInPhonicsLessons()[0];
  for (let seed = 1; seed < 30; seed++) {
    for (const entry of lesson.letters) {
      const { answer, choices } = findChoices(entry, lesson.letters, seeded(seed));
      assert.ok(entry.words.includes(answer));
      assert.equal(choices.length, 3);
      for (const w of choices.filter((x) => x !== answer)) assert.ok(!w.en.startsWith(entry.letter), `${entry.letter}: ${w.en}`);
    }
  }
  assert.equal(popTargets(lesson, seeded(2)).length, 6);
});

test('tiến độ chữ (letter:) không lẫn từ vựng; Ôn tập / Trò chơi có mục chữ cái', () => {
  const records = [{ word: 'ant' }, { word: 'letter:a' }];
  assert.deepEqual(wordRecords(records).map((r) => r.word), ['ant']);
  assert.deepEqual(letterRecords(records).map((r) => r.word), ['letter:a']);
  const items = collectItems(builtInPhonicsLessons().map((l, i) => ({ ...l, id: `p${i}` })));
  const letters = items.filter((i) => i.kind === 'letter');
  assert.equal(letters.length, 26);
  assert.equal(letters[0].key, 'letter:a');
});

test('theo review: âm mục tiêu từng chữ; không dùng orange cho O; đáp án nhiễu không cùng âm đầu (C/K/Q); Q đi cùng U', async () => {
  const { SOUNDS, sameSound } = await import('../../app/js/phonics.js');
  assert.equal(Object.keys(SOUNDS).length, 26);
  assert.equal(LETTER_BY.get('a').sound, '/æ/');
  assert.equal(LETTER_BY.get('x').sound, '/ks/');
  assert.ok(builtInPhonicsLessons().every((l) => l.letters.every((x) => x.sound)), 'bài có sẵn mang theo âm');
  assert.ok(!LETTER_BY.get('o').words.some((w) => w.en === 'orange'));
  assert.equal(sameSound('c', 'k'), true);
  assert.equal(sameSound('c', 'b'), false);
  const L = [LETTER_BY.get('c'), LETTER_BY.get('k'), LETTER_BY.get('q'), LETTER_BY.get('a')];
  for (let seed = 1; seed < 40; seed++) {
    const { answer, choices } = findChoices(L[0], L, seeded(seed));
    assert.ok(choices.filter((w) => w !== answer).every((w) => !/^[ckq]/.test(w.en)), choices.map((w) => w.en).join(','));
    const c = letterChoices('k', ['c', 'k', 'q', 'a', 'b'], seeded(seed), 3, { sound: true });
    assert.ok(!c.includes('c') && !c.includes('q'), c.join(','));
  }
  assert.equal(letterIntro(LETTER_BY.get('q')), 'Q! Q is for queen! Q and U go together!');
});
