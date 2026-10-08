import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSteps, startIndexFor, resumeAfter, pickChoices, buildChatTurns, withArticle, findPrompt, answerSentence,
} from '../../app/js/player/plan.js';

const lesson = {
  id: 'L',
  words: [{ en: 'cow' }, { en: 'dog' }, { en: 'apple' }],
  conversation: [{ word: 'cow', teacher: 'Hi?', child: "It's a cow!" }],
  questions: [],
  story: [{ text: 'A.' }, { text: 'B.' }],
};

test('thứ tự bước: thẻ từ → hội thoại → trò chơi → truyện; không có câu hỏi thì tự tạo', () => {
  const steps = buildSteps(lesson);
  assert.deepEqual(steps.map((s) => s.stage), ['words', 'words', 'words', 'conversation', 'quiz', 'quiz', 'quiz', 'story', 'story']);
});

test('phần nào không có thì bỏ qua', () => {
  const steps = buildSteps({ words: [{ en: 'a' }, { en: 'b' }], conversation: [], questions: [], story: [] });
  assert.deepEqual(steps.map((s) => s.stage), ['words', 'words', 'quiz', 'quiz']);
});

test('Học tiếp: bắt đầu đúng bước đã lưu; không tìm thấy thì học từ đầu', () => {
  const steps = buildSteps(lesson);
  const resume = resumeAfter(steps, 3, 99);
  assert.deepEqual(resume, { stage: 'quiz', index: 0, savedAt: 99, progress: 4 / 9 });
  assert.equal(startIndexFor(steps, resume), 4);
  assert.equal(startIndexFor(steps, { stage: 'story', index: 7 }), 0);
  assert.equal(startIndexFor(steps, null), 0);
  assert.equal(resumeAfter(steps, steps.length - 1), null);
});

test('lựa chọn: có đáp án đúng, không trùng, tối đa 3', () => {
  for (let i = 0; i < 20; i++) {
    const c = pickChoices('cow', ['cow', 'dog', 'apple', 'cat', 'Cow']);
    assert.equal(c.length, 3);
    assert.ok(c.includes('cow'));
    assert.equal(new Set(c.map((x) => x.toLowerCase())).size, 3);
  }
  assert.deepEqual(pickChoices('cow', ['cow', 'dog'], () => 0, 2).sort(), ['cow', 'dog']);
});

test('câu tiếng Anh: a/an, màu không cần mạo từ', () => {
  assert.equal(withArticle('apple'), 'an apple');
  assert.equal(withArticle('cow'), 'a cow');
  assert.equal(withArticle('red'), 'red');
  assert.equal(findPrompt('red'), 'Which one is red?');
  assert.equal(findPrompt('cow'), 'Where is the cow?');
  assert.equal(answerSentence('apple'), "It's an apple!");
  assert.equal(answerSentence('blue'), "It's blue!");
});

test('Học cùng Bông: từ chưa thuộc trước; bài không có hội thoại dùng mẫu What\'s this?', () => {
  const newer = { id: 'N', words: [{ en: 'cat' }], conversation: [] };
  const older = { id: 'O', words: [{ en: 'cow' }, { en: 'dog' }], conversation: [
    { word: 'cow', teacher: 'T1', child: 'C1' }, { word: 'dog', teacher: 'T2', child: 'C2' },
  ] };
  const turns = buildChatTurns([newer, older], new Set(['dog']), 7);
  assert.deepEqual(turns.map((t) => t.word), ['dog', 'cat', 'cow']);
  assert.deepEqual(turns[1], { word: 'cat', teacher: "What's this?", child: "It's a cat!", lessonId: 'N' });
  assert.equal(buildChatTurns([older], new Set(), 1).length, 1);
});
