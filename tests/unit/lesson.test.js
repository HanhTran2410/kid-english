import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLesson, createLessonRecord, autoQuestions, extractJson, MISSING_EMOJI } from '../../app/js/lesson.js';

const good = {
  version: 1,
  id: 'ai-made-id',
  title: 'Farm Animals',
  titleVi: 'Con vật ở nông trại',
  emoji: '🐄',
  words: [
    { en: 'cow', vi: 'con bò', emoji: '🐄', sentence: 'The cow says moo!', imagePrompt: 'A cow' },
    { en: 'dog', vi: 'con chó', emoji: '🐶' },
  ],
  conversation: [
    { word: 'cow', teacher: "Look! What's this?", child: "It's a cow!" },
    { word: 'cow', teacher: 'What does a cow say?', child: 'Moo moo!' },
  ],
  questions: [{ ask: 'Which one says moo?', answer: 'cow' }],
  story: [{ text: 'On the farm, there is a cow.' }, { text: 'The cow says moo!', repeat: 'Moo moo!' }],
};

const json = (o) => JSON.stringify(o, null, 2);

test('JSON hợp lệ thì nhận, không có cảnh báo', () => {
  const r = parseLesson(json(good));
  assert.equal(r.ok, true);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.lesson.words.length, 2);
  assert.equal(r.lesson.story[1].repeat, 'Moo moo!');
});

test('id của AI bị bỏ, app tự tạo UUID', () => {
  const r = parseLesson(json(good));
  assert.equal('id' in r.lesson, false);
  const rec = createLessonRecord(r.lesson, 1000);
  assert.match(rec.id, /^[0-9a-f-]{36}$/);
  assert.notEqual(rec.id, 'ai-made-id');
  assert.equal(rec.timesCompleted, 0);
  assert.equal(rec.resume, null);
  assert.equal(rec.createdAt, 1000);
});

test('JSON bọc trong ```json và kèm lời chào vẫn đọc được', () => {
  const text = `Sure! Here is your lesson:\n\n\`\`\`json\n${json(good)}\n\`\`\`\nHave fun!`;
  assert.equal(parseLesson(text).ok, true);
});

test('dấu nháy cong và dấu phẩy thừa vẫn đọc được', () => {
  const text = '{ “title”: “Colors”, “words”: [ {“en”: “red”, “vi”: “màu đỏ”, “emoji”: “🔴”}, {“en”: “blue”, “vi”: “màu xanh”, “emoji”: “🔵”}, ], }';
  const r = parseLesson(text);
  assert.equal(r.ok, true, r.errors.join());
  assert.equal(r.lesson.words[1].en, 'blue');
});

test('JSON bị cắt dở thì báo hãy nhắn AI continue', () => {
  const text = json(good).slice(0, 200);
  const r = parseLesson(text);
  assert.equal(r.ok, false);
  assert.match(r.errors[0], /cắt dở.*continue/);
});

test('không có JSON thì báo lỗi dễ hiểu', () => {
  const r = parseLesson('Xin lỗi, tôi không thể giúp.');
  assert.equal(r.ok, false);
  assert.match(r.errors[0], /Không tìm thấy bài học/);
});

test('lỗi nặng: thiếu title, thiếu words, ít hơn 2 từ, thiếu en/vi', () => {
  assert.match(parseLesson(json({ words: good.words })).errors[0], /title/);
  assert.match(parseLesson(json({ title: 'X' })).errors[0], /words/);
  assert.match(parseLesson(json({ title: 'X', words: [good.words[0]] })).errors[0], /ít nhất 2 từ/);
  const noVi = { title: 'X', words: [good.words[0], { en: 'cat', emoji: '🐱' }] };
  assert.match(parseLesson(json(noVi)).errors[0], /Từ số 2 \("cat"\) thiếu nghĩa tiếng Việt/);
  const noEn = { title: 'X', words: [{ vi: 'con mèo' }, good.words[0]] };
  assert.match(parseLesson(json(noEn)).errors[0], /Từ số 1 thiếu từ tiếng Anh/);
});

test('version lớn hơn 1 thì từ chối; thiếu version coi là 1', () => {
  assert.equal(parseLesson(json({ ...good, version: 2 })).ok, false);
  const { version, ...noVersion } = good;
  assert.equal(parseLesson(json(noVersion)).ok, true);
});

test('từ trùng (khác hoa/thường, khoảng trắng) chỉ giữ lần đầu và cảnh báo', () => {
  const words = [...good.words, { en: ' Cow ', vi: 'bò', emoji: '🐮' }];
  const r = parseLesson(json({ ...good, words }));
  assert.equal(r.ok, true);
  assert.equal(r.lesson.words.length, 2);
  assert.match(r.warnings.join(), /trùng/);
});

test('trùng làm còn ít hơn 2 từ thì từ chối', () => {
  const words = [good.words[0], { en: 'COW', vi: 'bò', emoji: '🐮' }];
  assert.equal(parseLesson(json({ title: 'X', words })).ok, false);
});

test('word/answer không có trong bài thì bỏ lượt đó và cảnh báo', () => {
  const r = parseLesson(json({
    ...good,
    conversation: [...good.conversation, { word: 'cat', teacher: 'Who?', child: 'A cat!' }],
    questions: [...good.questions, { ask: 'Which one meows?', answer: 'cat' }],
  }));
  assert.equal(r.ok, true);
  assert.equal(r.lesson.conversation.length, 2);
  assert.equal(r.lesson.questions.length, 1);
  assert.match(r.warnings.join('\n'), /hội thoại số 3 dùng từ "cat"/);
  assert.match(r.warnings.join('\n'), /Câu hỏi số 2 có đáp án "cat"/);
});

test('word/answer khác hoa/thường vẫn khớp và được chuẩn hóa', () => {
  const r = parseLesson(json({ ...good, questions: [{ ask: 'Moo?', answer: 'Cow' }] }));
  assert.equal(r.lesson.questions[0].answer, 'cow');
});

test('vượt giới hạn thì cắt bớt và cảnh báo', () => {
  const words = Array.from({ length: 14 }, (_, i) => ({ en: `w${i}`, vi: `t${i}`, emoji: '⭐' }));
  const conversation = Array.from({ length: 26 }, () => ({ word: 'w0', teacher: 'Hi?', child: 'Hi!' }));
  const story = Array.from({ length: 12 }, (_, i) => `Line ${i}.`);
  const r = parseLesson(json({ title: 'Big', emoji: '⭐', words, conversation, story }));
  assert.equal(r.ok, true);
  assert.equal(r.lesson.words.length, 12);
  assert.equal(r.lesson.conversation.length, 24);
  assert.equal(r.lesson.story.length, 10);
  assert.equal(r.warnings.length, 3);
});

test('repeat quá 3 từ thì bỏ repeat; câu child quá 5 từ chỉ cảnh báo', () => {
  const r = parseLesson(json({
    ...good,
    conversation: [{ word: 'cow', teacher: 'What?', child: 'It is a big brown cow!' }],
    story: [{ text: 'The cow says moo!', repeat: 'The cow says moo' }],
  }));
  assert.equal(r.ok, true);
  assert.equal(r.lesson.conversation.length, 1);
  assert.equal('repeat' in r.lesson.story[0], false);
  assert.equal(r.warnings.length, 2);
});

test('story dạng mảng chuỗi vẫn nhận, coi như không có repeat', () => {
  const r = parseLesson(json({ ...good, story: ['One.', 'Two.'] }));
  assert.deepEqual(r.lesson.story, [{ text: 'One.' }, { text: 'Two.' }]);
});

test('thiếu emoji của từ và của bài thì tự điền và cảnh báo', () => {
  const r = parseLesson(json({ title: 'X', words: [{ en: 'cow', vi: 'bò' }, { en: 'dog', vi: 'chó', emoji: '🐶' }] }));
  assert.equal(r.lesson.words[0].emoji, MISSING_EMOJI);
  assert.equal(r.lesson.emoji, MISSING_EMOJI);
  assert.equal(r.warnings.length, 2);
});

test('thiếu từ cần ôn thì cảnh báo', () => {
  const r = parseLesson(json(good), { reviewWords: ['dog', 'cat'] });
  assert.equal(r.ok, true);
  assert.match(r.warnings.join(), /từ cần ôn: cat/);
});

test('trường lạ bị bỏ qua', () => {
  const r = parseLesson(json({ ...good, foo: 1, words: good.words.map((w) => ({ ...w, bar: 2 })) }));
  assert.equal('foo' in r.lesson, false);
  assert.equal('bar' in r.lesson.words[0], false);
});

test('từ nhiều chữ như "ice cream" dùng bình thường', () => {
  const r = parseLesson(json({
    title: 'Food',
    words: [{ en: 'ice  cream', vi: 'kem', emoji: '🍦' }, { en: 'cake', vi: 'bánh', emoji: '🍰' }],
    questions: [{ ask: 'Which one is cold?', answer: 'Ice Cream' }],
  }));
  assert.equal(r.lesson.words[0].en, 'ice cream');
  assert.equal(r.lesson.questions[0].answer, 'ice cream');
});

test('câu hỏi tự tạo: Where is the ...? / Which one is <màu>?', () => {
  const qs = autoQuestions({ words: [{ en: 'cow' }, { en: 'Red' }] });
  assert.deepEqual(qs, [
    { ask: 'Where is the cow?', answer: 'cow' },
    { ask: 'Which one is Red?', answer: 'Red' },
  ]);
});

test('extractJson bỏ qua dấu ngoặc nằm trong chuỗi', () => {
  const r = extractJson('{"title": "a } b", "words": []} trailing');
  assert.equal(r.ok, true);
  assert.equal(r.value.title, 'a } b');
});
