// Mẫu câu mở rộng — "Ai đang làm gì?" (SPEC-patterns2.md, P1): người, ghép câu, chọn người, câu hỏi, nhận câu, kiểm tra bài.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  personOf, statement, statementVi, whatQuestion, whoQuestion, togetherLine, youLine, chunkedMe, castFor, pickPairs, planQuestions,
  doingPlan, doingLevel, doingKey, validateDoingLesson, builtInDoingLessons, isDoingLesson, buildDoingSteps,
} from '../../app/js/patterns2.js';
import { LEVEL, isPatternLesson } from '../../app/js/patterns.js';
import { parseLesson } from '../../app/js/lesson.js';
import { lessonKind } from '../../app/js/phrase.js';

const lessons = builtInDoingLessons();
const morning = lessons.find((l) => l.builtin === 'doing-morning');
const brush = morning.actions[0];
const seq = (...xs) => { let i = 0; return () => xs[i++ % xs.length]; };

test('4 bài có sẵn hợp lệ, kiểu doing thuộc Mẫu câu; tab riêng "Who is doing?"', () => {
  assert.deepEqual(lessons.map((l) => l.title), ['Morning', 'At home', 'Play time', 'Bedtime']);
  for (const l of lessons) {
    const r = validateDoingLesson(l);
    assert.equal(r.ok, true, `${l.title}: ${r.errors.join('; ')}`);
    assert.ok(isDoingLesson(l) && isPatternLesson(l));
    assert.equal(lessonKind(l), 'patterns');
    assert.equal(l.topic, 'Who is doing?');
    assert.equal(l.actions.length, 4);
  }
  assert.deepEqual(buildDoingSteps(morning).map((s) => s.stage), ['watch', 'watch', 'watch', 'watch', 'ask', 'ask', 'ask']);
});

test('DO-13: ghép câu is / am, his / her / my / our / their; câu hỏi; tiếng Việt', () => {
  assert.equal(statement(personOf('daddy'), brush), 'Daddy is brushing his teeth.');
  assert.equal(statement(personOf('mummy'), brush), 'Mummy is brushing her teeth.');
  assert.equal(statement(personOf('me'), brush), 'I am brushing my teeth!');
  assert.equal(statement(personOf('brother'), lessons[1].actions[0]), 'My brother is cooking.');
  assert.equal(statement(personOf('bong', 'Bông'), lessons[1].actions[0]), 'Bông is cooking.');
  assert.equal(whatQuestion(personOf('grandma')), 'What is Grandma doing?');
  assert.equal(whatQuestion(personOf('brother')), 'What is your brother doing?');
  assert.equal(whatQuestion(personOf('sister')), 'What is your sister doing?');
  assert.equal(whatQuestion(personOf('me')), 'What are you doing?');
  assert.equal(whoQuestion(brush), 'Who is brushing their teeth?');
  assert.equal(whoQuestion(lessons[1].actions[1]), 'Who is reading a book?');
  assert.equal(whoQuestion({ ...brush, who: 'Who brushes?' }), 'Who brushes?');
  assert.equal(togetherLine(brush), 'We are brushing our teeth!');
  assert.equal(youLine(brush), 'You are brushing your teeth!');
  assert.deepEqual(chunkedMe(brush), ['I am…', 'brushing my teeth!']);
  assert.equal(statementVi(personOf('daddy'), brush), 'Bố đang đánh răng.');
  assert.equal(statementVi(personOf('me'), brush), 'Con đang đánh răng.');
  // Mọi người × mọi hành động có sẵn: câu không còn {pos}, đúng to be.
  for (const l of lessons) for (const a of l.actions) for (const id of ['daddy', 'mummy', 'grandpa', 'grandma', 'brother', 'sister', 'bong', 'me']) {
    const s = statement(personOf(id), a);
    assert.ok(!s.includes('{pos}'), s);
    assert.match(s, id === 'me' ? /^I am / : /^[A-ZB][^ ]*( brother| sister)? is /, s);
  }
});

test('DO-01 / DO-11 / DO-02: người có mặt — chưa tích ai, một người (thêm Bông), toàn nam', () => {
  assert.deepEqual(castFor([]), ['daddy', 'mummy']);
  assert.deepEqual(castFor(['mummy']), ['mummy', 'bong']);
  assert.equal(personOf('bong').gender, 'f');
  assert.deepEqual(castFor(['grandpa', 'daddy']), ['daddy', 'grandpa']);
  const pairs = pickPairs(['daddy', 'grandpa'], 4);
  assert.ok(pairs.every((p) => p.length === 2 && new Set(p).size === 2));
});

test('hơn 3 người: lấy 3 người ít sao nhất, cố gắng có cả nam lẫn nữ', () => {
  const all = ['mummy', 'daddy', 'grandma', 'grandpa', 'brother', 'sister'];
  const score = { mummy: 5, grandma: 5, sister: 5, daddy: 0, grandpa: 0, brother: 0 };
  const cast = castFor(all, { score: (id) => score[id] });
  assert.equal(cast.length, 3);
  assert.ok(cast.some((id) => personOf(id).gender === 'f'), cast.join());
  assert.ok(cast.filter((id) => personOf(id).gender === 'm').length === 2);
});

test('DO-03: 2 nam + 1 nữ → mỗi hành động 1 nam + 1 nữ, hai người nam luân phiên; người nam nói trước', () => {
  const pairs = pickPairs(['daddy', 'grandma', 'grandpa'], 4, seq(0.1, 0.9, 0.5));
  for (const [a, b] of pairs) {
    assert.equal(personOf(a).gender, 'm');
    assert.equal(personOf(b).gender, 'f');
  }
  const males = pairs.map((p) => p[0]);
  assert.ok(males.includes('daddy') && males.includes('grandpa'));
  for (let i = 1; i < males.length; i++) assert.notEqual(males[i], males[i - 1]);
});

test('DO-05 / phần B: 3 câu hỏi — đúng một câu về bé (ở giữa), chỉ hỏi người có mặt, cặp không trùng', () => {
  for (const cast of [['daddy', 'mummy'], ['mummy', 'bong'], ['daddy', 'grandma', 'grandpa']]) {
    const qs = planQuestions(cast, morning.actions);
    assert.equal(qs.length, 3);
    assert.equal(qs[1].person, 'me');
    assert.equal(qs.filter((q) => q.person === 'me').length, 1);
    for (const q of qs) assert.ok(q.person === 'me' || cast.includes(q.person), q.person);
    assert.equal(new Set(qs.map((q) => `${q.person}|${q.action}`)).size, 3);
  }
  // Không tích Grandma → không có câu nào về Grandma.
  const qs = planQuestions(['daddy', 'mummy'], morning.actions);
  assert.ok(!qs.some((q) => q.person === 'grandma'));
});

test('DO-16: tiến độ theo từng người — sao của Daddy không làm Grandpa thành có sao; câu hỏi ưu tiên cặp chưa có sao', () => {
  const cook = lessons[1].actions[0];
  assert.equal(doingKey(cook, 'daddy'), 'doing:cook|daddy');
  assert.notEqual(doingKey(cook, 'daddy'), doingKey(cook, 'grandpa'));
  const records = new Map();
  for (const a of morning.actions) {
    records.set(doingKey(a, 'daddy'), { mastery: 2, lastPracticedAt: 1 });
    if (a !== morning.actions[2]) records.set(doingKey(a, 'me'), { mastery: 1, lastPracticedAt: 1 });
  }
  const qs = planQuestions(['daddy', 'grandpa'], morning.actions, records);
  assert.equal(qs[1].action, 2); // câu về bé: hành động duy nhất bé chưa có sao
  assert.ok(qs.filter((q) => q.person !== 'me').every((q) => q.person === 'grandpa'), JSON.stringify(qs));
});

test('DO-12 / học tiếp: kế hoạch đã lưu còn hợp lệ thì dùng lại, hỏng thì lập lại', () => {
  const saved = { cast: ['daddy', 'grandma'], pairs: [['daddy', 'grandma'], ['daddy', 'grandma'], ['daddy', 'grandma'], ['daddy', 'grandma']], questions: [{ person: 'daddy', action: 1 }, { person: 'me', action: 0 }, { person: 'grandma', action: 3 }] };
  assert.equal(doingPlan(morning, { family: ['sister', 'brother'], saved }), saved);
  const fresh = doingPlan(morning, { family: ['sister', 'brother'], saved: { ...saved, pairs: [['daddy', 'nobody']] } });
  assert.deepEqual(fresh.cast, ['brother', 'sister']);
  assert.equal(fresh.pairs.length, 4);
});

test('DO-06 / DO-07: nhận câu 3 mức', () => {
  const me = personOf('me');
  const grandma = personOf('grandma');
  const cook = lessons[1].actions[0];
  assert.equal(doingLevel(["I'm brushing my teeth"], me, brush), LEVEL.FULL);
  assert.equal(doingLevel(['i am brush'], me, brush), LEVEL.FULL);
  assert.equal(doingLevel(['I is brushing'], me, brush), LEVEL.PARTIAL);
  assert.equal(doingLevel(['brushing'], me, brush), LEVEL.KEYWORD);
  assert.equal(doingLevel(['hello'], me, brush), LEVEL.NONE);
  assert.equal(doingLevel(['she is cooking'], grandma, cook), LEVEL.FULL);
  assert.equal(doingLevel(['Grandma is cooking'], grandma, cook), LEVEL.FULL);
  assert.equal(doingLevel(['granny is cooking'], grandma, cook), LEVEL.FULL);
  assert.equal(doingLevel(['he is cooking'], grandma, cook), LEVEL.PARTIAL);
  assert.equal(doingLevel(['cooking'], grandma, cook), LEVEL.KEYWORD);
  assert.equal(doingLevel(['my brother is cooking'], personOf('brother'), cook), LEVEL.FULL);
  // Bài Bedtime: "taking a bath" nhận cả "bath".
  const bath = lessons[3].actions[0];
  assert.equal(doingLevel(['I am taking a bath'], me, bath), LEVEL.FULL);
  assert.equal(doingLevel(['bath'], me, bath), LEVEL.KEYWORD);
});

test('DATA-01 / DATA-06: bài dán vào sai → báo lỗi rõ, không tự sửa; parseLesson nhận bài kiểu doing', () => {
  const bad = validateDoingLesson({
    title: 'X',
    actions: [
      { en: 'cooked', base: 'cook', vi: 'nấu', motion: 'stir' },
      { en: 'flying', base: 'fly', vi: 'bay', motion: 'fly' },
      { en: 'cooking dinner', base: 'cook', vi: 'nấu cơm' },
    ],
  });
  assert.equal(bad.ok, false);
  const text = bad.errors.join('\n');
  assert.match(text, /"cooked" không phải dạng -ing/);
  assert.match(text, /motion "fly" không có\. Chọn một trong: .*brush/);
  assert.match(text, /trùng base "cook"/);
  assert.match(validateDoingLesson({ title: 'X', actions: [] }).errors.join(), /Bài có 0 hành động\. Mỗi bài 3–4 hành động\./);
  const parsed = parseLesson(JSON.stringify({ kind: 'patterns', style: 'doing', title: 'Morning', actions: morning.actions }));
  assert.equal(parsed.ok, true, parsed.errors.join());
  assert.equal(parsed.lesson.style, 'doing');
  // DATA-03: bài Khung câu cũ (không có style) vẫn là bài khung câu.
  const old = parseLesson(JSON.stringify({ kind: 'patterns', title: 'Weather', frame: 'It is ___.', slots: ['sunny', 'rainy', 'cloudy', 'windy'].map((word) => ({ word, emoji: '☀️' })) }));
  assert.equal(old.ok, true, old.errors.join());
  assert.equal(isDoingLesson(old.lesson), false);
});
