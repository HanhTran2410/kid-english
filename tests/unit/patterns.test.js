// Mẫu câu (SPEC-patterns.md): ghép câu + mạo từ, nhận câu bé nói 3 mức, khóa khung, chọn hình / trò chơi, kiểm tra bài,
// bài có sẵn, sao câu (progress.onSentence).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  builtInPatternLessons, validatePatternLesson, sentenceOf, spokenSentence, filledText, frameParts, frameKey, frameKeyOf, frameLead,
  chunkedSentence, sentenceViOf, realLifeSentence, speechLevel, frameMainWords, LEVEL, patternKey, frameStars, orderSlots, planSlots,
  pickGames, buildPatternSteps, isPatternLesson, PATTERN_KIND,
} from '../../app/js/patterns.js';
import { onSentence, emptyProgress, wordRecords, patternRecords } from '../../app/js/progress.js';
import { lessonKind } from '../../app/js/phrase.js';
import { parseLesson } from '../../app/js/lesson.js';

const L = Object.fromEntries(builtInPatternLessons().map((l) => [l.title, l]));
const slot = (lesson, word) => lesson.slots.find((s) => s.word === word);
const lesson = (frame, words) => validatePatternLesson({ title: 'T', frame, words: words.map((w) => (typeof w === 'string' ? { word: w } : w)) }).lesson;

test('8 bài có sẵn, thứ tự Weather → Feelings → … → Body; mỗi bài hợp lệ, 6 hình, mã builtin cố định', () => {
  const list = builtInPatternLessons();
  assert.deepEqual(list.map((l) => l.title), ['Weather', 'Feelings', 'Animals', 'Food', 'Colors', 'Vehicles', 'Actions', 'Body']);
  for (const l of list) {
    const v = validatePatternLesson(l);
    assert.equal(v.ok, true, `${l.title}: ${v.errors.join('; ')}`);
    assert.equal(l.slots.length, 6);
    assert.match(l.builtin, /^patterns-/);
    assert.equal(lessonKind(l), PATTERN_KIND);
    for (const s of l.slots) assert.ok(s.sentenceVi && s.vi && s.emoji, `${l.title}.${s.word}`);
  }
  assert.equal(new Set(list.map((l) => l.builtin)).size, 8);
  // Chỉ Weather, Feelings, Food có câu đời thật.
  assert.deepEqual(list.filter((l) => l.ask).map((l) => l.title), ['Weather', 'Feelings', 'Food']);
});

test('ghép câu + mạo từ: a / an / none / auto; khung không có {a} thì bỏ qua article', () => {
  assert.equal(sentenceOf(L.Weather, slot(L.Weather, 'sunny')), 'It is sunny.');
  assert.equal(spokenSentence(L.Weather, slot(L.Weather, 'sunny')), 'It is sunny!');
  const see = lesson('I can see {a} ___.', ['egg', 'horse', { word: 'unicorn', article: 'a' }, { word: 'hour', article: 'an' }]);
  assert.equal(sentenceOf(see, see.slots[0]), 'I can see an egg.');
  assert.equal(sentenceOf(see, see.slots[1]), 'I can see a horse.');
  assert.equal(sentenceOf(see, see.slots[2]), 'I can see a unicorn.');
  assert.equal(sentenceOf(see, see.slots[3]), 'I can see an hour.');
  assert.equal(sentenceOf(L.Body, slot(L.Body, 'eyes')), 'I have eyes.');
  assert.equal(sentenceOf(L.Body, slot(L.Body, 'nose')), 'I have a nose.');
  assert.equal(sentenceOf(L.Food, slot(L.Food, 'apples')), 'I like apples.');
  assert.equal(filledText(L.Animals, slot(L.Animals, 'duck')), 'a duck');
  assert.deepEqual(frameParts(L.Animals), { before: 'I can see', after: '.', hasArticle: true });
  assert.equal(frameLead(L.Animals), 'I can see…');
  assert.deepEqual(chunkedSentence(L.Weather, slot(L.Weather, 'rainy')), ['It is…', 'rainy!']);
  assert.equal(sentenceViOf(L.Weather, slot(L.Weather, 'windy')), 'Trời có gió.');
  assert.equal(realLifeSentence(L.Weather, slot(L.Weather, 'cloudy')), 'It is cloudy today!');
  assert.equal(realLifeSentence(L.Food, slot(L.Food, 'milk')), 'I like milk!');
  // Câu hỏi giữ dấu hỏi.
  const where = lesson('Where is the ___?', ['cat', 'dog', 'bird', 'cow']);
  assert.equal(sentenceOf(where, where.slots[0]), 'Where is the cat?');
});

test('khóa khung chuẩn hóa: "It is ____." = "it is ___" = "It is ___!"', () => {
  for (const f of ['It is ____.', 'it is ___', 'It is ___!', '  It   is ___ . ']) assert.equal(frameKey(f), 'it is ___');
  assert.equal(frameKey('I can see {a} ___.'), 'i can see {a} ___');
  assert.equal(frameKeyOf(L.Weather), frameKeyOf(L.Colors));
  assert.equal(patternKey(L.Food, slot(L.Food, 'eggs')), 'pattern:i like ___|egg');
});

test('nhận câu 3 mức: cả câu / một phần / từ khóa / không có từ khóa; rút gọn, thiếu mạo từ, số ít ↔ nhiều', () => {
  const w = L.Weather;
  const rainy = slot(w, 'rainy');
  assert.deepEqual(frameMainWords(w), ['it', 'is']);
  assert.deepEqual(frameMainWords(L.Animals), ['i', 'can', 'see']);
  assert.equal(speechLevel(['it is rainy'], w, rainy), LEVEL.FULL);
  assert.equal(speechLevel(["It's rainy!"], w, rainy), LEVEL.FULL);
  assert.equal(speechLevel(['is rainy'], w, rainy), LEVEL.PARTIAL);
  assert.equal(speechLevel(['it rainy'], w, rainy), LEVEL.PARTIAL);
  assert.equal(speechLevel(['rainy'], w, rainy), LEVEL.KEYWORD);
  assert.equal(speechLevel(['it is'], w, rainy), LEVEL.NONE);
  assert.equal(speechLevel(['it is rainy today'], w, rainy), LEVEL.FULL, 'từ thừa không sao');
  // Lấy phương án tốt nhất trong các phương án nhận dạng.
  assert.equal(speechLevel(['rainy', 'it is rainy'], w, rainy), LEVEL.FULL);
  // "it" / "is" không được tính là từ khóa "hot" (so lỏng theo âm).
  assert.equal(speechLevel(['it is'], w, slot(w, 'hot')), LEVEL.NONE);
  assert.equal(speechLevel(['it is hot'], w, slot(w, 'hot')), LEVEL.FULL);
  assert.equal(speechLevel(['I can see duck'], L.Animals, slot(L.Animals, 'duck')), LEVEL.FULL, 'thiếu mạo từ vẫn là cả câu');
  assert.equal(speechLevel(['I like egg'], L.Food, slot(L.Food, 'eggs')), LEVEL.FULL, 'số ít ↔ số nhiều');
  assert.equal(speechLevel(["I'm happy"], L.Feelings, slot(L.Feelings, 'happy')), LEVEL.FULL);
  assert.equal(speechLevel(['see a cow'], L.Animals, slot(L.Animals, 'cow')), LEVEL.PARTIAL);
  assert.equal(speechLevel([], w, rainy), LEVEL.NONE);
});

test('kiểm tra bài: báo lỗi, không tự cắt / tự sửa nội dung', () => {
  const ok = (frame, n = 5) => validatePatternLesson({ title: 'T', frame, words: Array.from({ length: n }, (_, i) => ({ word: `w${'abcdefgh'[i]}` })) });
  assert.equal(ok('It is ___.').ok, true);
  assert.match(ok('It is.').errors.join(), /đúng một chỗ trống/);
  assert.match(ok('___ is ___.').errors.join(), /đúng một chỗ trống/);
  assert.match(ok('It is ___.', 3).errors.join(), /Bài có 3 từ/);
  assert.match(ok('It is ___.', 7).errors.join(), /Bài có 7 từ\. Mỗi bài 4–6 từ\./);
  const dup = validatePatternLesson({ title: 'T', frame: 'I like ___.', words: [{ word: 'milk' }, { word: 'Milk' }, { word: 'rice' }, { word: 'tea' }] });
  assert.match(dup.errors.join(), /"Milk" bị trùng/);
  const bad = validatePatternLesson({ title: 'T', frame: 'I have {a} ___.', words: [{ word: 'nose', article: 'the' }, { word: 'eyes' }, { word: 'ears' }, { word: 'hands' }] });
  assert.match(bad.errors.join(), /article "the" không hợp lệ/);
  // Chỉ điền chỗ thiếu: concept ← word, sentenceVi ← frameVi + vi.
  const filled = validatePatternLesson({ title: 'T', frame: 'It is ___.', frameVi: 'Trời ___.', words: ['sunny', 'rainy', 'windy', 'cold'].map((w) => ({ word: w, vi: w })) });
  assert.equal(filled.lesson.slots[0].concept, 'sunny');
  assert.equal(filled.lesson.slots[0].sentenceVi, 'Trời sunny.');
  assert.equal(filled.lesson.kind, PATTERN_KIND);
  assert.equal(isPatternLesson(filled.lesson), true);
});

test('dán bài: parseLesson nhận bài mẫu câu (kind: patterns hoặc có frame + words)', () => {
  const text = 'Here you go:\n```json\n' + JSON.stringify({ title: 'Toys', frame: 'I have {a} ___.', words: ['ball', 'doll', 'car', 'kite', 'robot'].map((word) => ({ word, emoji: '🧸' })) }) + '\n```';
  const parsed = parseLesson(text);
  assert.equal(parsed.ok, true, parsed.errors.join());
  assert.equal(parsed.lesson.slots.length, 5);
  assert.equal(lessonKind(parsed.lesson), PATTERN_KIND);
});

test('chọn hình "từ ít sao": chưa có sao → ít sao → luyện lâu nhất → ngẫu nhiên; B 4 hình, C 3 hình khác', () => {
  const w = L.Weather;
  const rec = (word, mastery, at) => [patternKey(w, slot(w, word)), { mastery, lastPracticedAt: at }];
  const records = new Map([rec('sunny', 3, 100), rec('rainy', 1, 500), rec('cloudy', 1, 50), rec('windy', 0, 900)]);
  const order = orderSlots(w, records, () => 0.5).map((i) => w.slots[i].word);
  // hot, cold chưa luyện (lúc 0) trước windy (luyện lúc 900); rồi cloudy (1 sao, cũ hơn) trước rainy; sunny 3 sao cuối.
  assert.deepEqual(order, ['hot', 'cold', 'windy', 'cloudy', 'rainy', 'sunny']);
  const plan = planSlots([0, 1, 2, 3, 4, 5]);
  assert.deepEqual(plan.say, [0, 1, 2, 3]);
  assert.deepEqual(plan.tell, [4, 5, 0]);
  assert.deepEqual(planSlots([0, 1, 2, 3]).tell, [0, 1, 2]);
});

test('chọn trò chơi: kiểu chính không trùng lần trước; có ask thì câu 2 là realLife; không ask thì không có realLife', () => {
  let last = null;
  let seed = 1;
  const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 50; k++) {
    const [main, second] = pickGames(L.Weather, last, rng);
    assert.notEqual(main, last);
    assert.equal(second, main === 'realLife' ? 'listenTap' : 'realLife');
    last = main;
  }
  last = null;
  for (let k = 0; k < 50; k++) {
    const games = pickGames(L.Animals, last, rng);
    assert.ok(!games.includes('realLife'));
    assert.notEqual(games[0], last);
    assert.notEqual(games[0], games[1]);
    last = games[0];
  }
});

test('các bước: khám phá → 4 nói theo → 3 bé tự nói → 2 trò chơi → bài hát', () => {
  assert.deepEqual(buildPatternSteps().map((s) => `${s.stage}${s.index}`), ['explore0', 'say0', 'say1', 'say2', 'say3', 'tell0', 'tell1', 'tell2', 'game0', 'game1', 'song0']);
});

test('sao câu: chỉ CẢ CÂU mới +1 (tối đa 1 lần/ngày); mức khác ghi lần luyện + mức cao nhất; sao khung gộp 2 bài cùng khung', () => {
  const day = Date.UTC(2026, 10, 2, 3);
  let r = emptyProgress('pattern:it is ___|sunny');
  r = onSentence(r, 'keyword', day);
  assert.deepEqual([r.mastery, r.practiceCount, r.bestLevel], [0, 1, 'keyword']);
  r = onSentence(r, 'partial', day);
  assert.deepEqual([r.mastery, r.bestLevel], [0, 'partial']);
  r = onSentence(r, 'full', day);
  r = onSentence(r, 'full', day + 1000);
  assert.deepEqual([r.mastery, r.bestLevel, r.practiceCount], [1, 'full', 4]);
  r = onSentence(r, 'keyword', day + 2 * 86400000);
  assert.equal(r.bestLevel, 'full', 'mức cao nhất không bị hạ');
  r = onSentence(r, 'full', day + 2 * 86400000);
  assert.equal(r.mastery, 2);
  const recs = [
    { word: patternKey(L.Weather, slot(L.Weather, 'sunny')), mastery: 2 },
    { word: patternKey(L.Colors, slot(L.Colors, 'red')), mastery: 1 },
    { word: patternKey(L.Weather, slot(L.Weather, 'rainy')), mastery: 0 },
    { word: patternKey(L.Feelings, slot(L.Feelings, 'happy')), mastery: 3 },
  ];
  assert.equal(frameStars(recs, frameKeyOf(L.Weather)), 2);
  // Tiến độ câu mẫu không lẫn vào từ vựng.
  assert.equal(wordRecords([...recs, { word: 'cow', mastery: 1 }]).length, 1);
  assert.equal(patternRecords(recs).length, 4);
});
