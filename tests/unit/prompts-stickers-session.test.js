import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLessonPrompt, buildTeacherPrompt, wordsForDuration } from '../../app/js/prompts.js';
import { STICKERS, ALBUMS, currentAlbum, pickSticker, awardSticker, mergeSticker } from '../../app/js/stickers.js';
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

test('prompt cô giáo: tách từ của bài và từ cần ôn, ưu tiên từ cần ôn, có cách xử lý khi bé im lặng', () => {
  const p = buildTeacherPrompt({ words: ['Apple', 'banana', 'frog'], weakWords: ['frog', 'bee'], lessonTitle: 'Food' });
  assert.match(p, /Practise only these 4 target words: apple, banana, frog, bee\./);
  assert.match(p, /Practise the words from the lesson "Food": apple, banana\./);
  assert.match(p, /review words the child still finds hard: frog, bee\. Spend MORE time/);
  assert.match(p, /may use other simple English words for instructions/);
  assert.match(p, /wait about 5–7 seconds/);
  assert.match(p, /Never invent sounds for food or objects/);
  assert.match(p, /never more than 10 minutes/);
  assert.doesNotMatch(p, /\n\n\n/);
  const noReview = buildTeacherPrompt({ words: ['cow'] });
  assert.doesNotMatch(noReview, /review words/);
  assert.match(noReview, /the latest lesson: cow/);
});

// --- stickers ---

test('100 sticker chia 5 album × 20, mã và hình không trùng; 40 sticker đầu giữ nguyên mã cũ', () => {
  assert.equal(STICKERS.length, 100);
  assert.equal(new Set(STICKERS.map((s) => s.id)).size, 100);
  assert.equal(new Set(STICKERS.map((s) => s.emoji)).size, 100);
  assert.deepEqual(ALBUMS.map((a) => a.stickers.length), [20, 20, 20, 20, 20]);
  assert.deepEqual([STICKERS[0].id, STICKERS[19].id, STICKERS[39].id], ['lion', 'dinosaur', 'balloon']);
});

test('đủ 40 sticker cũ: sticker tiếp theo lấy từ album 3, album đang sưu tập là album 3', () => {
  const owned = Object.fromEntries(STICKERS.slice(0, 40).map((s) => [s.id, { count: 1 }]));
  assert.equal(currentAlbum(owned).index, 2);
  for (let i = 0; i < 20; i++) {
    const idx = STICKERS.indexOf(pickSticker(owned, Math.random));
    assert.ok(idx >= 40 && idx < 60, String(idx));
  }
  // Có lỗ ở album 1 (ví dụ bố mẹ đã bớt): điền album 1 trước.
  delete owned.lion;
  assert.equal(pickSticker(owned, Math.random).id, 'lion');
});

test('ưu tiên tặng sticker chưa có', () => {
  const owned = Object.fromEntries(STICKERS.slice(1).map((s) => [s.id, { count: 1 }]));
  for (let i = 0; i < 5; i++) assert.equal(pickSticker(owned, Math.random).id, STICKERS[0].id);
});

test('đủ bộ rồi thì tặng ngẫu nhiên và tăng count', () => {
  const owned = Object.fromEntries(STICKERS.map((s) => [s.id, { count: 1 }]));
  const s = pickSticker(owned, () => 0.99);
  assert.equal(s.id, STICKERS[99].id);
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
  assert.match(p, /previously learned in other lessons — do NOT use them as new words either: cat, cow./);
  assert.doesNotMatch(buildLessonPrompt({ topic: 'Animals' }), /previously learned/i);
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
  assert.match(p, /square image containing an exact 3-column × 3-row grid of 9 equal square cells\. The grid must fill the entire canvas/);
  assert.match(p, /one third of the image width/);
  assert.match(p, /ROW 1\nCell 1 — Cow: One cow\. Only this one subject in the cell\.\nCell 2 — Dog/);
  assert.match(p, /ROW 2\nCell 4 — Pig.*\nCell 5 — Duck.*\nCell 6 — EMPTY CELL: completely blank/);
  assert.match(p, /Cell 9 \(row 3, column 3\) must remain completely empty/);
  assert.match(p, /Exactly 5 illustrations/);
  // Đường kẻ: đúng số đường, chỉ giữa các ô, không viền ngoài; hình không chạm đường kẻ.
  assert.match(p, /exactly 2 vertical line\(s\) and 2 horizontal line\(s\)/);
  assert.match(p, /No outer border/);
  assert.match(p, /No subject may touch or cross a divider line/);
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
  const long = { en: 'teeth', imagePrompt: `${'Six small white teeth in a row, '.repeat(5)}no gums, no lips, no tongue, ${IMAGE_STYLE}` };
  assert.match(visualHint(long), /no gums, no lips, no tongue$/, 'không cắt cụt mô tả');
  const p = buildGridImagePrompt(words, { cols: 2, rows: 2 });
  assert.match(p, /Cell 1 — Rain: Several blue raindrops falling, no cloud\. Only this one subject in the cell\.\nCell 2 — Cloud: one fluffy white cloud\./);
  assert.match(p, /ROW 2\nCell 3 — Sun: One sun\.[^\n]*\nCell 4 — EMPTY CELL/);
  assert.match(p, /half of the image width/);
  assert.match(p, /Never add objects, characters or details that belong to another cell/);
  assert.match(buildLessonPrompt({ topic: 'Weather' }), /concrete description of exactly what to draw.*clearly different/);
});

test('tìm đường kẻ chia ô: bỏ viền ngoài sát mép, gộp đường dày thành một', async () => {
  const { findDividerLines } = await import('../../app/js/image.js');
  const frac = new Array(300).fill(0.1);
  for (const i of [0, 1, 99, 100, 101, 199, 200, 298, 299]) frac[i] = 0.95; // viền ngoài + 2 đường kẻ dày 2–3 vạch
  frac[150] = 0.5; // nét vẽ không chạy suốt ảnh: không phải đường kẻ
  assert.deepEqual(findDividerLines(frac), [100, 199.5]);
});

test('tìm đường kẻ: dải xám dày (vỉa hè, mặt đường) không bị coi là đường kẻ', async () => {
  const { findDividerLines } = await import('../../app/js/image.js');
  const frac = new Array(400).fill(0.1);
  for (const i of [100, 200, 300]) frac[i] = 0.95;
  for (let i = 340; i < 370; i++) frac[i] = 0.9; // mặt đường xám chạy suốt ảnh, dày 30 vạch
  assert.deepEqual(findDividerLines(frac), [100, 200, 300]);
});

test('biết trước kiểu lưới: tìm đường kẻ quanh đúng vị trí k/n, bỏ qua nét khác; thiếu đường kẻ thì trả null', async () => {
  const { findExpectedLines } = await import('../../app/js/image.js');
  const frac = new Array(400).fill(0.1);
  frac[99] = 0.9; // đường kẻ lệch nhẹ khỏi 1/4
  frac[200] = frac[201] = 0.95; // đường kẻ dày 2 vạch ở 1/2
  frac[302] = 0.85;
  frac[218] = 0.98; // mép sàn nhà đen chạy ngang, nằm trong một ô
  assert.deepEqual(findExpectedLines(frac, 4), [99, 200.5, 302]);
  frac[302] = 0.1;
  assert.equal(findExpectedLines(frac, 4), null);
});

test('loại trừ từ theo chủ đề: từ của bài cùng chủ đề (không phân biệt hoa/thường, số ít/nhiều) tách riêng, đưa hết vào prompt', async () => {
  const { splitAvoidWords, buildLessonPrompt, MAX_AVOID_WORDS } = await import('../../app/js/prompts.js');
  const { topicOf } = await import('../../app/js/lesson.js');
  const w = (list) => list.map((en) => ({ en }));
  const lessons = [
    { title: 'Animals 2', topic: 'Animals', words: w(['Lion', 'tiger']) },
    { title: 'Colors', words: w(['red', 'blue']) },
    { title: 'Animals', words: w(['cow', 'dog', 'lion']) },
    { title: 'Morning', kind: 'phrases', phrases: [] },
    // Rất nhiều từ ở các bài khác (vượt giới hạn) — từ cùng chủ đề vẫn không bị cắt.
    { title: 'Big', words: w(Array.from({ length: 120 }, (_, i) => `word${i}`)) },
  ];
  const split = splitAvoidWords(lessons, 'animal', topicOf);
  assert.deepEqual(split.topicWords, ['lion', 'tiger', 'cow', 'dog']);
  assert.equal(split.topicLessons.length, 2);
  assert.ok(split.otherWords.includes('red') && !split.otherWords.includes('lion'));
  assert.deepEqual(splitAvoidWords(lessons, 'Weather', topicOf).topicWords, []);

  const p = buildLessonPrompt({ topic: 'Animals', reviewWords: ['cow'], topicAvoidWords: [...split.topicWords, 'fish'], avoidWords: split.otherWords });
  // Gọi là "từ đã học" (không phải "Animals words": danh sách có thể có từ khác chủ đề); có sẵn dạng số ít/số nhiều.
  assert.match(p, /IMPORTANT — PREVIOUSLY LEARNED WORDS: the child already learned these words in earlier "Animals" lessons \(singular and plural forms are listed\)\. NONE of them may be a new word in this lesson: lion, lions, tiger, tigers, dog, dogs, fish\./);
  assert.doesNotMatch(p.match(/IMPORTANT.*$/m)[0], /\bcows?\b/, 'từ cần ôn không bị loại trừ');
  const others = p.match(/Also previously learned in other lessons — do NOT use them as new words either: (.*)\.$/m)[1].split(', ');
  assert.equal(others.length, MAX_AVOID_WORDS);
  assert.ok(!others.includes('lion'), 'không lặp lại từ đã có ở dòng cùng chủ đề');
  assert.match(p, /applies to BOTH lists above and to every singular\/plural form.*, except the review words\./);
  assert.match(p, /every item in "words", every "word" in "conversation" and every "answer" in "questions"/);
  assert.match(p, /MAY still appear naturally inside sentences/);
  assert.match(p, /If few simple new "Animals" words are left, choose words closely related to "Animals"/);
  assert.match(p, /Before answering, check every item in "words" against both lists \(including singular\/plural forms\)/);
});

test('dạng số ít / số nhiều cho danh sách loại trừ (kể cả bất quy tắc); chủ đề hẹp "Body: actions" vẫn loại trừ từ của Body', async () => {
  const { wordForms, splitAvoidWords, isSubtopic } = await import('../../app/js/prompts.js');
  const { topicOf } = await import('../../app/js/lesson.js');
  const cases = {
    knees: ['knees', 'knee'], knee: ['knee', 'knees'], teeth: ['tooth', 'teeth'], feet: ['foot', 'feet'],
    strawberries: ['strawberries', 'strawberry'], strawberry: ['strawberry', 'strawberries'], boxes: ['boxes', 'box'],
    glass: ['glass', 'glasses'], bus: ['bus', 'buses'], buses: ['bus', 'buses'], leaves: ['leaf', 'leaves'],
    fish: ['fish'], 'teddy bear': ['teddy bear', 'teddy bears'], toes: ['toes', 'toe'], monkey: ['monkey', 'monkeys'],
  };
  for (const [w, forms] of Object.entries(cases)) assert.deepEqual(wordForms(w), forms, w);
  const lessons = [{ title: 'Body', words: [{ en: 'head' }] }, { title: 'Animals', words: [{ en: 'cow' }] }];
  assert.deepEqual(splitAvoidWords(lessons, 'Body: actions', topicOf).topicWords, ['head']);
  assert.deepEqual(splitAvoidWords(lessons, 'bodies', topicOf).topicWords, ['head']);
  assert.equal(isSubtopic('Body: actions'), true);
  assert.equal(isSubtopic('Body'), false);
});

test('ảnh bộ phận chi tiết (trán, má, ngón cái…): vẽ cả mặt / tay / người + mũi tên đỏ; từ rõ ràng thì không', async () => {
  const { pointerNote, needsPointer, singleImagePrompt, buildGridImagePrompt, buildLessonPrompt } = await import('../../app/js/prompts.js');
  assert.match(pointerNote('forehead'), /whole face.*bright-red arrow.*points exactly at the forehead/);
  assert.match(pointerNote({ en: 'Cheek' }), /whole face/);
  assert.match(pointerNote('knees'), /whole leg/, 'số nhiều cũng nhận ra');
  assert.match(pointerNote('thumb'), /whole open hand/);
  assert.match(pointerNote('tail'), /whole cute animal/);
  for (const w of ['eye', 'nose', 'hand', 'cat', 'apple', 'red']) assert.equal(pointerNote(w), '', w);
  // Mô tả của AI đã có mũi tên: không thêm lần nữa, nhưng vẫn tính là ô có mũi tên.
  const tail = { en: 'tail', imagePrompt: 'a cat with a long tail, big red arrow pointing at the tail' };
  assert.equal(pointerNote(tail), '');
  assert.equal(needsPointer(tail), true);

  const grid = buildGridImagePrompt([{ en: 'forehead', imagePrompt: 'A close-up of a forehead' }, { en: 'eyes' }, tail, { en: 'cow' }], { cols: 2, rows: 2 });
  assert.match(grid, /Cell 1 — Forehead: A close-up of a forehead\. Show it in context instead of alone: draw a smiling child's whole face.*Only this one subject \(plus its arrow\) in the cell\./);
  assert.match(grid, /Cell 2 — Eyes: Eyes\. Only this one subject in the cell\./);
  assert.match(grid, /Cell 4 — Cow: One cow\. Only this one subject in the cell\./);
  assert.match(grid, /- ARROWS: only cells 1, 3 get one thick bright-red arrow/);
  assert.doesNotMatch(buildGridImagePrompt([{ en: 'cow' }, { en: 'cat' }], { cols: 2, rows: 1 }), /ARROWS/);

  assert.match(singleImagePrompt({ en: 'chin', imagePrompt: 'A child chin, flashcard style' }), /^A child chin, flashcard style\. Show it in context.*at the chin/);
  assert.equal(singleImagePrompt({ en: 'cow', imagePrompt: 'A cow, flashcard style' }), 'A cow, flashcard style');
  assert.match(buildLessonPrompt({ topic: 'Body' }), /PART of something bigger.*\n.*\n.*bright-red arrow/);
});
