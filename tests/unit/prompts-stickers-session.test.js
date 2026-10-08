import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLessonPrompt, buildTeacherPrompt, wordsForDuration } from '../../app/js/prompts.js';
import { STICKERS, pickSticker, awardSticker, mergeSticker } from '../../app/js/stickers.js';
import { newSession, resumeSession, addTime, extend, isTimeUp, NEW_SESSION_GAP_MS } from '../../app/js/session.js';

// --- prompts ---

test('số từ theo thời lượng: 5/10/15 phút → 4/6/8 từ', () => {
  assert.equal(wordsForDuration(5), 4);
  assert.equal(wordsForDuration(10), 6);
  assert.equal(wordsForDuration(15), 8);
  for (const [min, n] of [[5, 4], [10, 6], [15, 8]]) {
    assert.match(buildLessonPrompt({ topic: 'Animals', duration: min }), new RegExp(`exactly ${n} NEW words`));
  }
});

test('prompt có từ cần ôn và yêu cầu thêm vào words', () => {
  const p = buildLessonPrompt({ topic: 'Food', duration: 10, reviewWords: ['dog', 'red'] });
  assert.match(p, /REVIEW WORDS: also add these 2 words to "words".*dog, red/);
  assert.match(p, /"words" has 8 words in total/);
  assert.doesNotMatch(buildLessonPrompt({ topic: 'Food' }), /REVIEW WORDS/);
});

test('prompt đúng kiểu bài: Vui nhộn 3 câu, Kể chuyện 5–6 câu', () => {
  assert.match(buildLessonPrompt({ topic: 'x', style: 'fun' }), /exactly 3 fun sentences/);
  const story = buildLessonPrompt({ topic: 'x', style: 'story' });
  assert.match(story, /5 to 6 sentences/);
  assert.match(story, /conversation about the story/);
});

test('prompt có chủ đề, tuổi và trình độ', () => {
  const p = buildLessonPrompt({ topic: 'At the park', age: 4, level: 'some' });
  assert.match(p, /"At the park"/);
  assert.match(p, /4-year-old/);
  assert.match(p, /already knows a few/);
});

test('prompt cô giáo có từ của bài và từ chưa thuộc', () => {
  const p = buildTeacherPrompt({ words: ['cow', 'dog'], weakWords: ['red'] });
  assert.match(p, /cow, dog, red/);
  assert.match(p, /extra time on: red/);
});

// --- stickers ---

test('có khoảng 40 sticker, mã không trùng', () => {
  assert.equal(STICKERS.length, 40);
  assert.equal(new Set(STICKERS.map((s) => s.id)).size, 40);
});

test('ưu tiên tặng sticker chưa có', () => {
  const owned = Object.fromEntries(STICKERS.slice(1).map((s) => [s.id, { count: 1 }]));
  for (let i = 0; i < 5; i++) assert.equal(pickSticker(owned, Math.random).id, STICKERS[0].id);
});

test('đủ bộ rồi thì tặng ngẫu nhiên và tăng count', () => {
  const owned = Object.fromEntries(STICKERS.map((s) => [s.id, { count: 1 }]));
  const s = pickSticker(owned, () => 0.99);
  assert.equal(s.id, STICKERS[39].id);
  const first = awardSticker(undefined, s.id, 5);
  assert.deepEqual(first, { id: s.id, firstEarnedAt: 5, count: 1 });
  assert.equal(awardSticker(first, s.id).count, 2);
});

test('gộp sticker lấy count cao hơn', () => {
  assert.equal(mergeSticker({ count: 2, firstEarnedAt: 9 }, { count: 5, firstEarnedAt: 3 }).count, 5);
});

// --- session ---

test('giới hạn mềm: hết giờ, cho thêm 15 phút, tắt giới hạn', () => {
  let s = newSession(0);
  s = addTime(s, 14 * 60_000, 1);
  assert.equal(isTimeUp(s, 15), false);
  s = addTime(s, 60_000, 2);
  assert.equal(isTimeUp(s, 15), true);
  s = extend(s, 3);
  assert.equal(isTimeUp(s, 15), false);
  s = addTime(s, 15 * 60_000, 4);
  assert.equal(isTimeUp(s, 15), true);
  assert.equal(isTimeUp(s, null), false);
});

test('nghỉ quá 1 tiếng thì bắt đầu buổi mới', () => {
  const s = addTime(newSession(0), 10 * 60_000, 0);
  assert.equal(resumeSession(s, NEW_SESSION_GAP_MS - 1).usedMs, 10 * 60_000);
  assert.equal(resumeSession(s, NEW_SESSION_GAP_MS + 1).usedMs, 0);
});
