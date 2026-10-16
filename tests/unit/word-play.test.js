// Bài từ vựng hấp dẫn hơn (SPEC-words-play.md): ló dần, tiếng khi chạm, truyện chạm được, kiểm tra bài, prompt.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  revealKind, revealOpener, revealTickMs, unitsToGuess, guessListenMs, REVEAL_UNITS, REVEAL_MAX_MS, REVEAL_FILL_MS,
  GUESS_LISTEN_MS, cleanSound, soundOf, tapLine, singular, storyCast, pickDistractor, storyActors, planFinds,
  karaokeTimes, findQuestion,
} from '../../app/js/word-play.js';
import { validateLesson } from '../../app/js/lesson.js';
import { buildLessonPrompt } from '../../app/js/prompts.js';

const W = (en, extra = {}) => ({ en, vi: en, emoji: '⭐', ...extra });

test('ló dần: thẻ đầu bong bóng, đổi lần lượt bong bóng → rèm → bóng đen; ảnh thật không dùng bóng đen', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((i) => revealKind(i)), ['bubbles', 'curtain', 'silhouette', 'bubbles', 'curtain', 'silhouette']);
  assert.equal(revealKind(2, true), 'bubbles');
  assert.equal(revealKind(1, true), 'curtain');
  assert.equal(revealOpener(0)[0], "Ooh! What's hiding here?");
  assert.equal(revealOpener(4)[0], revealOpener(0)[0]);
});

test('ló dần — một đồng hồ 8 giây gồm cả lượt đoán: tự mở tới ngưỡng đoán trong ~3 giây với mọi kiểu che', () => {
  for (const kind of ['bubbles', 'curtain', 'silhouette']) {
    const toGuess = unitsToGuess(kind) * revealTickMs(kind);
    assert.ok(toGuess <= REVEAL_FILL_MS + 1, kind);
    assert.ok(unitsToGuess(kind) / REVEAL_UNITS[kind] >= 0.6, kind);
    // Còn đủ thời gian cho câu "What's this?" + nghe đoán trong 8 giây.
    assert.ok(REVEAL_MAX_MS - toGuess >= GUESS_LISTEN_MS, kind);
  }
  assert.equal(revealTickMs('bubbles'), 500);
  assert.equal(revealTickMs('curtain'), 1500);
  // Nghe đoán không quá thời gian còn lại; còn quá ít thì bỏ lượt đoán.
  assert.equal(guessListenMs(6000), GUESS_LISTEN_MS);
  assert.equal(guessListenMs(3000), 2700);
  assert.equal(guessListenMs(1000), 0);
});

test('tiếng khi chạm: sound của bài → bảng có sẵn (số nhiều, tên khác) → tên đọc vui; sound hỏng / dài thì bỏ, không cắt giữa chừng', () => {
  assert.equal(tapLine(W('cow', { sound: 'Mooo!' })), 'Mooo!');
  assert.equal(tapLine(W('cows')), 'Moo moo!');
  assert.equal(tapLine(W('ducks')), 'Quack quack!');
  assert.equal(tapLine(W('hen')), 'Cluck cluck!');
  assert.equal(tapLine(W('plane')), 'Zoom!');
  assert.equal(tapLine(W('buses')), 'Beep beep!');
  assert.equal(tapLine(W('grapes')), 'Grapes!'); // không đoán bừa: "grape" không có trong bảng
  assert.equal(tapLine(W('apple')), 'Apple!');
  assert.equal(singular('sheep'), 'sheep');
  assert.equal(cleanSound('  Moo   moo! '), 'Moo moo!');
  assert.equal(cleanSound(''), '');
  assert.equal(cleanSound(42), '');
  assert.equal(cleanSound('one two three four five'), ''); // quá 4 từ
  assert.equal(cleanSound('x'.repeat(31)), ''); // quá 30 ký tự
  assert.equal(soundOf(W('cow', { sound: 'one two three four five' })), 'Moo moo!'); // sound hỏng → bảng
});

test('truyện: nhân vật theo thứ tự trong câu, khớp số nhiều và từ nhiều chữ; nhân vật lạ không có trong câu', () => {
  const words = [W('cow'), W('ice cream'), W('pig'), W('butterfly')];
  assert.deepEqual(storyCast('Two cows eat ice cream with a pig!', words).map((w) => w.en), ['cow', 'ice cream', 'pig']);
  assert.deepEqual(storyCast('The pig and the cow. The cow!', words).map((w) => w.en), ['pig', 'cow']);
  assert.deepEqual(storyCast('Butterflies fly.', words).map((w) => w.en), ['butterfly']);
  assert.deepEqual(storyCast('Hello sun!', words), []);
  const cast = storyCast('The cow says moo!', words);
  for (let i = 0; i < 50; i++) assert.ok(!cast.includes(pickDistractor(words, cast)));
  assert.equal(pickDistractor([words[0]], [words[0]]), null); // bài chỉ một từ: không có nhân vật lạ
});

test('lượt Tìm: tối đa 2 câu mỗi truyện, ưu tiên từ đích khác nhau, câu không có từ của bài thì không có lượt Tìm', () => {
  const words = [W('cow'), W('duck'), W('dog')];
  const story = [
    { text: 'Hello farm!' },
    { text: 'The cow says moo!' },
    { text: 'The cow and the duck swim.' },
    { text: 'The dog runs.' },
  ];
  const plan = planFinds(story, words);
  assert.deepEqual([...plan].map(([i, w]) => [i, w.en]), [[1, 'cow'], [2, 'duck']]);
  // Chỉ có một từ: vẫn được 2 lượt (cho lặp khi không còn từ khác).
  const plan2 = planFinds([{ text: 'A cow.' }, { text: 'The cow!' }, { text: 'Cow, cow!' }], words);
  assert.deepEqual([...plan2].map(([i, w]) => [i, w.en]), [[0, 'cow'], [1, 'cow']]);
  assert.equal(planFinds([{ text: 'Hi!' }], words).size, 0);
  assert.equal(planFinds(undefined, words).size, 0);
  assert.deepEqual(findQuestion(W('cow')), ["Where's the cow? Tap the cow!", 'cow đâu rồi? Chạm vào cow nào!']);
  assert.deepEqual(storyActors(story, words).map((w) => w.en), ['cow', 'duck', 'dog']);
  assert.deepEqual(storyActors([{ text: 'Hi!' }], words).map((w) => w.en), ['cow', 'duck', 'dog']);
});

test('karaoke: thời điểm sáng chữ tăng dần, chữ dài lâu hơn, đọc chậm thì giãn ra', () => {
  const t = karaokeTimes(['The', 'elephant', 'is', 'big!']);
  assert.ok(t.every((x, i) => i === 0 || x > t[i - 1]));
  assert.ok(t[2] - t[1] > t[1] - t[0]); // "elephant" dài hơn "The"
  assert.ok(karaokeTimes(['a', 'b'], 0.5)[1] > karaokeTimes(['a', 'b'], 1)[1]);
});

test('kiểm tra bài: giữ sound hợp lệ; sound dài / sai kiểu thì bỏ + cảnh báo vàng; bài cũ không có sound vẫn đọc được', () => {
  const lesson = {
    version: 1, title: 'Farm', emoji: '🐄',
    words: [
      { en: 'cow', vi: 'con bò', emoji: '🐄', sound: 'Moo moo!' },
      { en: 'pig', vi: 'con lợn', emoji: '🐷', sound: 'oink oink oink oink oink oink' },
      { en: 'duck', vi: 'con vịt', emoji: '🦆', sound: 7 },
      { en: 'dog', vi: 'con chó', emoji: '🐶' },
    ],
  };
  const r = validateLesson(lesson);
  assert.ok(r.ok, r.errors.join('; '));
  const byEn = Object.fromEntries(r.lesson.words.map((w) => [w.en, w]));
  assert.equal(byEn.cow.sound, 'Moo moo!');
  assert.equal(byEn.pig.sound, undefined);
  assert.equal(byEn.duck.sound, undefined);
  assert.equal(byEn.dog.sound, undefined);
  assert.equal(r.warnings.filter((w) => /sound/.test(w)).length, 2);
});

test('prompt tạo bài: có trường sound (ví dụ + luật) và dặn câu truyện nhắc từ của bài', () => {
  const p = buildLessonPrompt({ topic: 'Farm' });
  assert.match(p, /"sound": "Moo moo!"/);
  assert.match(p, /"sound": what the child hears when tapping/);
  assert.match(p, /every story sentence mentions at least one word of this lesson/);
});
