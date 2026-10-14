import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  builtInTalkLessons, lessonTurns, resolveTurn, fillText, normalizeProfile, talkKey, validateTalkLesson, isTalkLesson, TURN_TYPES,
} from '../../app/js/talk.js';
import { lessonKind } from '../../app/js/phrase.js';
import { wordRecords, talkRecords } from '../../app/js/progress.js';
import { collectItems } from '../../app/js/mix.js';

const lessons = builtInTalkLessons();
const by = (id) => lessons.find((l) => l.builtin === id);

test('5 bài hội thoại có sẵn hợp lệ: đủ 5 kiểu lượt, mã lượt không trùng, mọi câu đọc có tiếng Việt', () => {
  assert.deepEqual(lessons.map((l) => l.title), ['Hello & Goodbye', 'About me', 'How are you?', 'I like…', 'My family']);
  assert.equal(new Set(lessons.map((l) => l.builtin)).size, 5);
  const types = new Set(lessons.flatMap((l) => l.turns.map((t) => t.type)));
  assert.deepEqual([...types].sort(), [...TURN_TYPES].sort());
  for (const l of lessons) {
    assert.equal(validateTalkLesson(l).ok, true, l.title);
    assert.equal(isTalkLesson(l), true);
    assert.equal(lessonKind(l), 'talk');
    assert.ok(l.outroVi);
    for (const t of l.turns) {
      for (const [en, vi] of [['ask', 'askVi'], ['answer', 'answerVi'], ['reply', 'replyVi'], ['intro', 'introVi']]) {
        if (t[en]) assert.ok(t[vi], `${l.title}/${t.id}: thiếu ${vi}`);
      }
      for (const c of [...(t.choices ?? []), t.yes, t.no].filter(Boolean)) assert.ok(c.answerVi, `${t.id}: lựa chọn thiếu tiếng Việt`);
    }
  }
});

test('ghép hồ sơ: tên, tuổi đọc bằng chữ; thiếu tên thì câu dự phòng và không đọc chỗ trống; thiếu tuổi thì bỏ lượt tuổi', () => {
  const withProfile = lessonTurns(by('talk-about-me'), { name: 'Na', age: 3 });
  assert.deepEqual(withProfile.map((t) => t.id), ['name', 'age', 'ask-name']);
  assert.equal(withProfile[0].answer, 'My name is Na.');
  assert.equal(withProfile[0].reply, 'Nice to meet you, Na!');
  assert.equal(withProfile[1].answer, "I'm three!");
  assert.equal(withProfile[1].answerVi, 'Con 3 tuổi!');
  assert.deepEqual(withProfile[1].keywords, ['three', '3']);

  const noProfile = lessonTurns(by('talk-about-me'), {});
  assert.deepEqual(noProfile.map((t) => t.id), ['name', 'ask-name'], 'thiếu tuổi → bỏ lượt tuổi');
  assert.equal(noProfile[0].answer, 'Tell me your name!');
  assert.equal(noProfile[0].reply, 'Nice to meet you!');
  for (const t of lessons.flatMap((l) => lessonTurns(l, {}))) {
    assert.doesNotMatch(JSON.stringify(t), /\{(name|age|ageNumber)\}/, `${t.id}: còn chỗ trống`);
  }
  assert.equal(fillText('Hello, {name}!', {}), 'Hello!');
  assert.equal(fillText('Con thấy thế nào, {name}?', {}), 'Con thấy thế nào?');
  assert.equal(fillText('That was fun! See you, {name}!', { name: 'Bin' }), 'That was fun! See you, Bin!');
});

test('gia đình: chỉ hỏi về thành viên đã chọn; chưa chọn ai thì Mummy + Daddy', () => {
  const family = by('talk-family');
  assert.deepEqual(lessonTurns(family, {}).map((t) => t.answer), ["It's Mummy!", "It's Daddy!"]);
  assert.deepEqual(lessonTurns(family, { family: ['grandma', 'sister'] }).map((t) => t.answer), ["It's Grandma!", "It's my sister!"]);
  assert.equal(normalizeProfile({ family: ['alien'] }).family.length, 0);
  assert.equal(normalizeProfile({ age: 9 }).age, null);
  assert.equal(resolveTurn({ id: 'x', type: 'free', needs: ['age'], ask: 'a', answer: 'b' }, {}), null);
});

test('kiểm tra bài hội thoại (cho bài AI ở T-b): sai kiểu / thiếu trường / trùng mã thì từ chối', () => {
  const bad = validateTalkLesson({ title: 'X', turns: [
    { id: 'a', type: 'dance', ask: 'x' },
    { id: 'a', type: 'choice', ask: 'x', choices: [{ id: 'c', emoji: '😀', answer: 'Hi' }] },
    { id: 'b', type: 'yesNo', ask: 'x', yes: { answer: 'Yes' } },
  ] });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some((e) => /kiểu "dance"/.test(e)));
  assert.ok(bad.errors.some((e) => /trùng mã/.test(e)));
  assert.ok(bad.errors.some((e) => /choices/.test(e)));
  assert.ok(bad.errors.some((e) => /yes/.test(e)));
});

test('tiến độ: khóa talk:<mã bài>:<mã lượt>, không lẫn từ vựng; bài hội thoại chưa vào Ôn tập / Trò chơi', () => {
  assert.equal(talkKey(by('talk-about-me'), 'name'), 'talk:talk-about-me:name');
  const records = [{ word: 'cow' }, { word: 'talk:talk-about-me:name' }];
  assert.deepEqual(wordRecords(records).map((r) => r.word), ['cow']);
  assert.deepEqual(talkRecords(records).map((r) => r.word), ['talk:talk-about-me:name']);
  assert.deepEqual(collectItems(lessons.map((l, i) => ({ ...l, id: `t${i}` }))), []);
});
