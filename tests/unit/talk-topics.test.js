// Chủ đề mới cho Nói chuyện với Bông (SPEC-talk-topics.md): 8 bài theo chủ đề, câu đáp đúng lựa chọn, hình có mô tả, không hồ sơ vẫn đúng.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { builtInTalkLessons, validateTalkLesson, talkPictures, lessonTurns, fillText } from '../../app/js/talk.js';
import { groupByTopic } from '../../app/js/lesson.js';

const lessons = builtInTalkLessons();
const NEW = ['talk-meal', 'talk-bath', 'talk-bed', 'talk-park', 'talk-weather', 'talk-toys', 'talk-hide', 'talk-manners'];

test('13 bài có sẵn hợp lệ; mã bài không trùng; 8 bài mới đúng chủ đề, mỗi bài 6–8 lượt, mã lượt không trùng', () => {
  assert.equal(lessons.length, 13);
  assert.equal(new Set(lessons.map((l) => l.builtin)).size, 13);
  for (const l of lessons) assert.deepEqual(validateTalkLesson(l), { ok: true, errors: [] }, l.builtin);
  const fresh = lessons.filter((l) => NEW.includes(l.builtin));
  assert.deepEqual(fresh.map((l) => l.builtin), NEW);
  for (const l of fresh) {
    assert.ok(l.turns.length >= 6 && l.turns.length <= 8, `${l.builtin}: ${l.turns.length} lượt`);
    assert.equal(new Set(l.turns.map((t) => t.id)).size, l.turns.length, l.builtin);
  }
  // 5 bài cũ giữ chủ đề Talk.
  assert.deepEqual(lessons.slice(0, 5).map((l) => l.topic), Array(5).fill('Talk'));
});

test('tab chủ đề: Talk / Every day / Out & about / Play / Manners, đúng số bài và emoji tab', () => {
  const groups = groupByTopic(lessons);
  assert.deepEqual(groups.map((g) => [g.topic, g.emoji, g.lessons.length]), [
    ['Talk', '👋', 5], ['Every day', '🏠', 3], ['Out & about', '🌳', 2], ['Play', '🧸', 2], ['Manners', '🙏', 1],
  ]);
});

test('mỗi lựa chọn có câu đáp riêng (món trong kho có sẵn câu đáp); mỗi nhánh có/không có câu mẫu + câu đáp', () => {
  for (const l of lessons.filter((x) => NEW.includes(x.builtin))) {
    for (const t of l.turns) {
      if (t.type === 'choice' && t.pool) for (const c of lessonTurns(l, {}).find((x) => x.id === t.id).choices) assert.ok(c.reply, `${l.builtin}/${t.id}/${c.id}`);
      if (t.type === 'choice' && !t.pool) for (const c of t.choices) assert.ok(c.reply && c.replyVi, `${l.builtin}/${t.id}/${c.id}`);
      if (t.type === 'yesNo') for (const side of [t.yes, t.no]) assert.ok(side.answer && side.reply && side.replyVi, `${l.builtin}/${t.id}`);
    }
  }
});

test('mọi hình có mô tả bằng chữ (draw), không hai hình khác nhau trùng mô tả trong một bài', () => {
  for (const l of lessons.filter((x) => NEW.includes(x.builtin))) {
    const pics = talkPictures(l);
    for (const p of pics) assert.ok(/[a-z]{3}/i.test(p.draw) && p.draw !== p.emoji, `${l.builtin}/${p.key}`);
    assert.equal(new Set(pics.map((p) => p.draw)).size, pics.length, l.builtin);
  }
});

test('không hồ sơ (không tên, không món thích): không còn {…} thô; Bedtime kết "Sweet dreams!"; có tên thì có tên', () => {
  for (const l of lessons) {
    for (const t of lessonTurns(l, {})) {
      const text = JSON.stringify(t).replace(/"[a-zA-Z]+NoProfile":"[^"]*"/g, '').replace(/\{pick(Vi)?\}/g, '');
      assert.ok(!/\{\w+\}/.test(text), `${l.builtin}/${t.id}`);
      assert.ok(!t.rememberReply, `${l.builtin}/${t.id}: chưa có món thích thì không có câu "I know!"`);
    }
  }
  const bed = lessons.find((l) => l.builtin === 'talk-bed');
  assert.equal(fillText(bed.outro, {}), 'Sweet dreams!');
  assert.equal(fillText(bed.outro, { name: 'Na' }), 'Sweet dreams, Na!');
  const hide = lessons.find((l) => l.builtin === 'talk-hide');
  assert.equal(lessonTurns(hide, {}).find((t) => t.id === 'your-turn-hide').reply, 'Where are you? … There you are!');
  assert.equal(lessonTurns(hide, { name: 'Na' }).find((t) => t.id === 'your-turn-hide').reply, 'Where is Na? … There you are!');
});
