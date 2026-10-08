import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyProgress, onPickedCorrectFirstTry, onPickedWrong, onSpoke, onPracticed,
  pickReviewWords, pickWordsForPrompt, mergeProgress, progressKey,
} from '../../app/js/progress.js';
import { DAY_MS } from '../../app/js/text.js';

const rec = (word, mastery, practiceCount = 1, lastPracticedAt = 0) => ({
  ...emptyProgress(word), mastery, practiceCount, lastPracticedAt,
});

test('khóa tiến độ là từ viết thường', () => {
  assert.equal(progressKey(' Ice Cream '), 'ice cream');
});

test('chọn đúng +1, tối đa 5', () => {
  assert.equal(onPickedCorrectFirstTry(rec('a', 2)).mastery, 3);
  assert.equal(onPickedCorrectFirstTry(rec('a', 5)).mastery, 5);
});

test('chọn sai −1, không xuống dưới 0', () => {
  assert.equal(onPickedWrong(rec('a', 2)).mastery, 1);
  assert.equal(onPickedWrong(rec('a', 0)).mastery, 0);
});

test('lên tiếng +1 mỗi ngày một lần, chỉ đưa tối đa tới 2', () => {
  const day1 = new Date(2026, 9, 8, 9).getTime();
  const day2 = day1 + DAY_MS;
  let r = rec('a', 0);
  r = onSpoke(r, day1);
  assert.equal(r.mastery, 1);
  r = onSpoke(r, day1 + 1000);
  assert.equal(r.mastery, 1, 'cùng ngày không cộng thêm');
  r = onSpoke(r, day2);
  assert.equal(r.mastery, 2);
  r = onSpoke(r, day2 + DAY_MS);
  assert.equal(r.mastery, 2, 'lên tiếng không vượt quá 2');
  assert.equal(onSpoke(rec('a', 4), day1).mastery, 4, 'không trừ từ đã cao');
});

test('không trừ điểm theo thời gian; onPracticed chỉ tăng practiceCount', () => {
  const r = onPracticed(rec('a', 4, 3, 0), 100 * DAY_MS);
  assert.equal(r.mastery, 4);
  assert.equal(r.practiceCount, 4);
  assert.equal(r.lastPracticedAt, 100 * DAY_MS);
});

test('thứ tự ôn tập: chưa thuộc → lâu chưa gặp → ngẫu nhiên; chỉ từ đã học', () => {
  const now = 30 * DAY_MS;
  const records = [
    rec('fresh-known', 4, 2, now - DAY_MS),
    rec('stale-known', 4, 2, now - 10 * DAY_MS),
    rec('weak', 1, 2, now - DAY_MS),
    rec('weakest', 0, 2, now - DAY_MS),
    rec('never', 0, 0, null),
  ];
  const picked = pickReviewWords(records, { count: 6, now, rng: () => 0 }).map((r) => r.word);
  assert.deepEqual(picked, ['weakest', 'weak', 'stale-known', 'fresh-known']);
  assert.equal(pickReviewWords(records, { count: 2, now }).length, 2);
});

test('từ cần ôn cho prompt: tối đa 2 từ chưa thuộc, yếu nhất rồi lâu chưa gặp nhất', () => {
  const records = [
    rec('a', 2, 1, 50), rec('b', 1, 1, 90), rec('c', 1, 1, 10), rec('d', 4, 1, 0), rec('e', 0, 0, null),
  ];
  assert.deepEqual(pickWordsForPrompt(records).map((r) => r.word), ['c', 'b']);
});

test('gộp tiến độ: lấy số cao hơn, ngày mới hơn', () => {
  const a = { ...rec('a', 2, 5, 100), lastVoiceDay: '2026-10-01' };
  const b = { ...rec('a', 4, 3, 50), lastVoiceDay: '2026-10-05' };
  const m = mergeProgress(a, b);
  assert.equal(m.mastery, 4);
  assert.equal(m.practiceCount, 5);
  assert.equal(m.lastPracticedAt, 100);
  assert.equal(m.lastVoiceDay, '2026-10-05');
});
