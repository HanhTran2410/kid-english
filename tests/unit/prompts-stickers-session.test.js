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

test('prompt yêu cầu AI tránh các từ bé đã có ở bài khác (trừ từ cần ôn)', () => {
  const p = buildLessonPrompt({ topic: 'Animals', reviewWords: ['dog'], avoidWords: ['Dog', 'cat', 'cow', 'cat'] });
  assert.match(p, /ALREADY LEARNED.*Do NOT use them as new words: cat, cow\./);
  assert.doesNotMatch(buildLessonPrompt({ topic: 'Animals' }), /ALREADY LEARNED/);
});

test('prompt ảnh lưới liệt kê đúng thứ tự từ và số ô', async () => {
  const { buildGridImagePrompt } = await import('../../app/js/prompts.js');
  const { gridShape } = await import('../../app/js/image.js');
  // Lưới vuông vì AI tạo ảnh thường vẽ ảnh vuông.
  assert.deepEqual(gridShape(4), { cols: 2, rows: 2 });
  assert.deepEqual(gridShape(6), { cols: 3, rows: 3 });
  assert.deepEqual(gridShape(8), { cols: 3, rows: 3 });
  assert.deepEqual(gridShape(10), { cols: 4, rows: 3 });
  const p = buildGridImagePrompt(['cow', 'dog', 'cat', 'pig', 'duck'], gridShape(5));
  assert.match(p, /square image with an exact 3-column × 3-row grid, containing 9 EQUAL square cells/);
  assert.match(p, /Row 1:\n1\. Cow\n2\. Dog\n3\. Cat\nRow 2:\n4\. Pig\n5\. Duck\n6\. EMPTY CELL/);
  assert.match(p, /Cell 9 \(row 3, column 3\) must remain completely empty/);
  assert.match(p, /Exactly 5 illustrations/);
  // Không còn mâu thuẫn: có đường kẻ giữa các ô, chỉ không có viền ngoài.
  assert.match(p, /divider lines ONLY between cells\. NO outer border/);
  assert.doesNotMatch(p, /no borders around the image/);
});

test('đếm số dải hình để đoán lưới: gộp hai mắt trong cùng ô, bỏ vệt nhỏ', async () => {
  const { countBands } = await import('../../app/js/image.js');
  const profile = (spec, n = 100) => {
    const p = new Array(n).fill(0);
    for (const [a, b] of spec) for (let i = a; i < b; i++) p[i] = 0.3;
    return p;
  };
  // 3 ô: ô giữa có hai mắt cách nhau 1 vạch (gộp), thêm một vệt bụi rất hẹp ở cuối (bỏ).
  assert.equal(countBands(profile([[3, 30], [37, 48], [49, 62], [70, 96], [98, 99]])), 3);
  assert.equal(countBands(profile([[5, 45], [55, 95]])), 2);
  assert.equal(countBands(new Array(50).fill(0)), 0);
});

test('prompt ảnh lưới: mỗi từ kèm mô tả hình lấy từ imagePrompt; prompt tạo bài dặn mô tả phân biệt', async () => {
  const { buildGridImagePrompt, visualHint, IMAGE_STYLE, buildLessonPrompt } = await import('../../app/js/prompts.js');
  const words = [
    { en: 'rain', imagePrompt: `Several blue raindrops falling, no cloud, ${IMAGE_STYLE}` },
    { en: 'cloud', imagePrompt: `Cute children's flashcard illustration of one fluffy white cloud, ${IMAGE_STYLE}` },
    { en: 'sun' },
  ];
  assert.equal(visualHint(words[0]), 'Several blue raindrops falling, no cloud');
  assert.equal(visualHint(words[1]), 'one fluffy white cloud');
  assert.equal(visualHint(words[2]), '');
  const p = buildGridImagePrompt(words, { cols: 2, rows: 2 });
  assert.match(p, /1\. Rain — Several blue raindrops falling, no cloud\n2\. Cloud — one fluffy white cloud\nRow 2:\n3\. Sun\n4\. EMPTY CELL/);
  assert.match(p, /Each cell shows ONLY its own item/);
  assert.match(buildLessonPrompt({ topic: 'Weather' }), /concrete description of exactly what to draw.*clearly different/);
});
