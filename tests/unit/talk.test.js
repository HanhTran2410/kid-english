import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  builtInTalkLessons, lessonTurns, resolveTurn, fillText, normalizeProfile, talkKey, validateTalkLesson, isTalkLesson, TURN_TYPES,
  turnAllowed, talkPictures, poolChoices, countUpTo, TALK_BUILTIN_VERSION,
} from '../../app/js/talk.js';
import { lessonKind } from '../../app/js/phrase.js';
import { wordRecords, talkRecords } from '../../app/js/progress.js';
import { collectItems } from '../../app/js/mix.js';

const lessons = builtInTalkLessons();
const by = (id) => lessons.find((l) => l.builtin === id);

test('13 bài hội thoại có sẵn hợp lệ (5 bài đầu + 8 bài chủ đề mới): đủ 6 kiểu lượt, 6–8 lượt mỗi bài, mã lượt không trùng, mọi câu đọc có tiếng Việt', () => {
  assert.deepEqual(lessons.map((l) => l.title), ['Hello & Goodbye', 'About me', 'How are you?', 'I like…', 'My family', 'Mealtime', 'Bath time', 'Bedtime', 'At the park', 'Weather', 'My toys', 'Hide and seek', 'Please & thank you']);
  assert.equal(new Set(lessons.map((l) => l.builtin)).size, 13);
  const types = new Set(lessons.flatMap((l) => l.turns.map((t) => t.type)));
  assert.deepEqual([...types].sort(), [...TURN_TYPES].sort());
  for (const l of lessons) {
    assert.equal(validateTalkLesson(l).ok, true, l.title);
    assert.equal(isTalkLesson(l), true);
    assert.equal(lessonKind(l), 'talk');
    assert.ok(l.outroVi);
    assert.equal(l.builtinVersion, TALK_BUILTIN_VERSION);
    const full = lessonTurns(l, { name: 'Na', age: 3, family: ['mummy', 'daddy'] });
    assert.ok(full.length >= 6 && full.length <= 8, `${l.title}: ${full.length} lượt`);
    for (const t of full) {
      for (const c of [...(t.choices ?? []), t.yes, t.no].filter(Boolean)) {
        if (c.reply) assert.ok(c.replyVi, `${t.id}/${c.id}: lời đáp thiếu tiếng Việt`);
      }
    }
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
  assert.deepEqual(withProfile.map((t) => t.id), ['name', 'age', 'fingers', 'ask-name', 'ask-age', 'fav-color', 'high-five']);
  assert.equal(withProfile[0].answer, 'My name is Na.');
  assert.equal(withProfile[0].reply, 'Nice to meet you, Na!');
  assert.equal(withProfile[1].answer, "I'm three!");
  assert.equal(withProfile[1].answerVi, 'Con 3 tuổi!');
  assert.deepEqual(withProfile[1].keywords, ['three', '3']);

  const noProfile = lessonTurns(by('talk-about-me'), {});
  assert.deepEqual(noProfile.map((t) => t.id), ['name', 'ask-name', 'ask-age', 'fav-color', 'high-five'], 'thiếu tuổi → bỏ lượt tuổi và giơ ngón tay');
  assert.equal(withProfile[2].ask, 'Show me three fingers!');
  assert.equal(withProfile[2].reply, 'One, two, three! You are three!');
  assert.equal(countUpTo(5), 'One, two, three, four, five!');
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
  assert.deepEqual(lessonTurns(family, {}).filter((t) => t.ask === 'Who is this?' && t.answer).map((t) => t.answer), ["It's Mummy!", "It's Daddy!"]);
  assert.deepEqual(lessonTurns(family, {}).map((t) => t.id), ['mummy', 'daddy', 'love-mummy', 'kiss-mummy', 'who-bong', 'group-hug']);
  // Không chọn Mummy thì bỏ cả "Do you love Mummy?" và "Give Mummy a kiss!".
  assert.deepEqual(lessonTurns(family, { family: ['grandma', 'sister'] }).map((t) => t.answer).filter(Boolean), ["It's Grandma!", "It's my sister!"]);
  assert.ok(!lessonTurns(family, { family: ['grandma'] }).some((t) => /Mummy/.test(t.ask)));
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

test('Bông đáp theo lựa chọn và "nhớ" hồ sơ: màu / món thích luôn có trong lựa chọn, câu đáp riêng khi bé chọn đúng món đó', () => {
  const likes = by('talk-likes');
  const color = (profile) => lessonTurns(likes, profile).find((t) => t.id === 'color');
  assert.deepEqual(color({}).choices.map((c) => c.id), ['red', 'blue', 'yellow', 'green']);
  assert.equal(color({}).rememberReply, undefined);
  const purple = color({ color: 'purple' });
  assert.deepEqual(purple.choices.map((c) => c.id), ['red', 'blue', 'yellow', 'purple']);
  assert.equal(purple.favorite, 'purple');
  assert.equal(purple.rememberReply, 'I know! You like purple!');
  assert.equal(purple.rememberReplyVi, 'Bông biết mà! Con thích màu tím!');
  assert.equal(purple.choices.find((c) => c.id === 'red').reply, 'Red! Like an apple!');
  assert.deepEqual(poolChoices('foods', 3, 'ice cream').map((c) => c.id), ['bananas', 'rice', 'ice-cream']);
  const sad = lessonTurns(by('talk-feelings'), {})[0].choices.find((c) => c.id === 'sad');
  assert.equal(sad.reply, "Oh no! Here's a big hug!");
  assert.equal(sad.mood, 'sad');
});

test('lượt có điều kiện: ôm khi bé buồn, hỏi ăn gì khi bé đói', () => {
  const turns = lessonTurns(by('talk-feelings'), {});
  const hug = turns.find((t) => t.id === 'hug');
  const eat = turns.find((t) => t.id === 'eat');
  assert.equal(turnAllowed(hug, { feel: 'sad' }), true);
  assert.equal(turnAllowed(hug, { feel: 'happy' }), false);
  assert.equal(turnAllowed(hug, {}), false, 'bỏ qua lượt chọn (▶) thì bỏ luôn lượt phụ thuộc');
  assert.equal(turnAllowed(eat, { hungry: 'yes' }), true);
  assert.equal(turnAllowed(eat, { hungry: 'no' }), false);
  assert.equal(turnAllowed(turns[0], {}), true);
  const bad = validateTalkLesson({ title: 'X', turns: [{ id: 'a', type: 'action', ask: 'x', reply: 'y', emoji: '✋', onlyIf: { turn: 'zzz', pick: 'yes' } }] });
  assert.ok(bad.errors.some((e) => /onlyIf/.test(e)));
  assert.ok(validateTalkLesson({ title: 'X', turns: [{ id: 'a', type: 'action', ask: 'x' }] }).errors.some((e) => /reply/.test(e)));
});

test('hình thay được bằng ảnh: mỗi bài có danh sách hình với khóa không trùng, có mô tả để vẽ', () => {
  for (const l of lessons) {
    const pics = talkPictures(l);
    assert.ok(pics.length >= 3, l.title);
    assert.equal(new Set(pics.map((p) => p.key)).size, pics.length);
    for (const p of pics) assert.ok(p.emoji && p.draw, `${l.title}/${p.key}`);
  }
  const hello = talkPictures(by('talk-hello')).map((p) => p.key);
  for (const k of ['happy', 'morning', 'high-five', 'wave']) assert.ok(hello.includes(k), k);
  // Hình chung (chó ở "Which animal" và "Do you like dogs?") dùng chung một ảnh.
  assert.equal(talkPictures(by('talk-likes')).filter((p) => p.key === 'dog').length, 1);
});

test('prompt ảnh bài My family: ghi rõ mẹ là người (không phải xác ướp), ông bà / anh chị em có dấu hiệu nhận ra', async () => {
  const { buildGridImagePrompt } = await import('../../app/js/prompts.js');
  const pics = talkPictures(by('talk-family'));
  const words = pics.map((x) => ({ en: x.key, label: x.name, emoji: x.emoji, imagePrompt: x.draw }));
  const prompt = buildGridImagePrompt(words, { cols: 3, rows: 3 });
  assert.match(prompt, /Cell 1 — Mother: a smiling young mother — a human woman/);
  assert.match(prompt, /Grandmother: .*gray hair/);
  // Tên ô không bị AI viết lên ảnh: tên ô không có ngoặc, prompt cấm chữ ngay trước danh sách ô và trong phần luật.
  assert.doesNotMatch(prompt, /Cell \d+ — [^:]*\(/);
  assert.match(prompt, /NEVER write them in the image/);
  assert.match(prompt, /not even the cell names listed above/);
  assert.match(prompt, /Brother: .*human child/);
  assert.doesNotMatch(prompt, /One mummy|Cell \d+ — Mummy:/i);
  assert.doesNotMatch(prompt, /Kiss-mummy/);
});

test('📞 đồng hồ cuộc gọi: mm:ss, không âm', async () => {
  const { callTime } = await import('../../app/js/player/talk-phone.js');
  assert.equal(callTime(0), '00:00');
  assert.equal(callTime(9_999), '00:09');
  assert.equal(callTime(83_500), '01:23');
  assert.equal(callTime(-5), '00:00');
});
