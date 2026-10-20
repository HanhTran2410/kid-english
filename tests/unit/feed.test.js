// Cho Bông ăn (SPEC-feed.md): câu nói theo loại danh từ, khay, chọn lượt, mức, món bố mẹ thêm.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILTIN_FOODS, BELLY, TRAY_SIZE, allFoods, cleanCustomFoods, requestPhrase, countPhrase, thatPhrase, requestLine, moreLine,
  remindLine, wrongLine, yuckLine, countLine, makeTray, pickRequest, cleanFeedState, afterRound, BACKGROUND_PROMPT,
} from '../../app/js/feed.js';

const food = (id) => BUILTIN_FOODS.find((f) => f.id === id);
const req = (id, count = 1, got = 0) => ({ food: food(id), count, got, wrong: 0 });
const seq = (...values) => { let i = 0; return () => values[i++ % values.length]; };

test('dữ liệu món: mã không trùng; mỗi loại danh từ đủ trường; đồ không ăn được là danh từ đếm được', () => {
  assert.equal(new Set(BUILTIN_FOODS.map((f) => f.id)).size, BUILTIN_FOODS.length);
  for (const f of BUILTIN_FOODS) {
    assert.ok(f.en && f.vi && f.emoji && f.draw, f.id);
    assert.ok(['food', 'drink', 'silly'].includes(f.kind), f.id);
    assert.ok(['count', 'mass', 'plural'].includes(f.grammar), f.id);
    if (f.grammar === 'count') assert.ok(['a', 'an'].includes(f.article) && f.plural, f.id);
    if (f.kind === 'silly') assert.equal(f.grammar, 'count', f.id);
  }
  assert.equal(BUILTIN_FOODS.filter((f) => f.kind === 'food').length, 24); // 18 + 6 món Việt (0.25.0)
  assert.equal(BUILTIN_FOODS.filter((f) => f.kind === 'drink').length, 3);
  assert.equal(BUILTIN_FOODS.filter((f) => f.kind === 'silly').length, 4);
});

test('ngữ pháp: a / an / some, those are, số nhiều — đúng cho mọi món có sẵn', () => {
  assert.equal(requestPhrase(food('banana')), 'a banana');
  assert.equal(requestPhrase(food('apple')), 'an apple');
  assert.equal(requestPhrase(food('ice-cream')), 'an ice cream');
  assert.equal(requestPhrase(food('grapes')), 'some grapes');
  assert.equal(requestPhrase(food('milk')), 'some milk');
  assert.equal(requestPhrase(food('rice')), 'some rice');
  assert.equal(thatPhrase(food('apple')), "that's an apple");
  assert.equal(thatPhrase(food('grapes')), 'those are grapes');
  assert.equal(thatPhrase(food('milk')), "that's milk");
  assert.equal(thatPhrase(food('rice')), "that's rice");
  assert.equal(countPhrase(food('cookie'), 2), 'two cookies');
  assert.equal(countPhrase(food('strawberry'), 3), 'three strawberries');
  assert.equal(countPhrase(food('cookie'), 1), 'a cookie');
  for (const f of BUILTIN_FOODS) {
    assert.doesNotMatch(requestPhrase(f), /^a [aeiou]|^an [^aeiou]|^a \w+s$/, f.id);
    assert.doesNotMatch(thatPhrase(f), /that's a \w+s$/, f.id);
  }
});

test('câu xin, câu nhầm, yuck, đếm — kèm phụ đề tiếng Việt', () => {
  assert.deepEqual(requestLine(req('banana')), ['I want a banana!', 'Bông muốn ăn quả chuối!']);
  assert.deepEqual(requestLine(req('milk')), ["I'm thirsty! I want some milk!", 'Bông khát quá! Bông muốn uống sữa!']);
  assert.deepEqual(requestLine(req('cookie', 2)), ['I want two cookies!', 'Bông muốn ăn 2 chiếc bánh quy!']);
  assert.deepEqual(wrongLine(food('apple'), req('banana')), ["Hmm, that's an apple! I want a banana!", 'Đó là quả táo! Bông muốn ăn quả chuối cơ!']);
  assert.equal(wrongLine(food('grapes'), req('banana'))[0], 'Hmm, those are grapes! I want a banana!');
  assert.equal(wrongLine(food('milk'), req('rice'))[0], "Hmm, that's milk! I want some rice!");
  assert.deepEqual(wrongLine(food('rice'), req('juice')), ["Hmm, that's rice! I want some juice!", 'Đó là cơm! Bông muốn uống nước ép cơ!']);
  // Đang đếm dở: câu nhầm nhắc phần còn thiếu.
  assert.deepEqual(wrongLine(food('apple'), req('cookie', 2, 1)), ["Hmm, that's an apple! I want one more cookie!", 'Đó là quả táo! Bông muốn ăn thêm 1 chiếc bánh quy cơ!']);
  assert.equal(wrongLine(food('apple'), req('cookie', 3, 1))[0], "Hmm, that's an apple! I want two more cookies!");
  assert.deepEqual(yuckLine(food('sock')), ["Yuck! A sock! I can't eat a sock!", 'Eo ơi! Cái tất! Bông không ăn cái tất được!']);
  assert.deepEqual(countLine(1, false), ['One!', 'Một!']);
  assert.deepEqual(countLine(2, true), ['Two! Yummy! Thank you!', 'Hai! Ngon quá! Cảm ơn con!']);
  assert.deepEqual(moreLine(req('cookie', 2, 1)), ['One more cookie, please!', 'Thêm 1 chiếc bánh quy nữa nhé!']);
  assert.deepEqual(moreLine(req('cookie', 3, 1)), ['Two more cookies, please!', 'Thêm 2 chiếc bánh quy nữa nhé!']);
  assert.deepEqual(remindLine(req('cookie', 2, 0)), requestLine(req('cookie', 2)));
  assert.deepEqual(remindLine(req('cookie', 2, 1)), moreLine(req('cookie', 2, 1)));
});

test('khay: mức 1 món dễ; mức 2 có đồ uống, bất ngờ vui tùy chọn; mức 3 chỉ món đếm được', () => {
  for (let i = 0; i < 30; i++) {
    const t1 = makeTray(1);
    assert.equal(t1.length, TRAY_SIZE[1]);
    assert.ok(t1.every((f) => f.easy && f.kind === 'food'));
    const t2 = makeTray(2);
    assert.equal(t2.length, TRAY_SIZE[2]);
    assert.ok(t2.some((f) => f.kind === 'drink'));
    assert.ok(t2.filter((f) => f.kind === 'silly').length <= 1);
    assert.equal(new Set(t2.map((f) => f.id)).size, t2.length);
    assert.equal(makeTray(2, { silly: false }).some((f) => f.kind === 'silly'), false);
    const t3 = makeTray(3);
    assert.equal(t3.length, TRAY_SIZE[3]);
    assert.ok(t3.every((f) => f.kind === 'food' && f.grammar === 'count'));
  }
  assert.ok(makeTray(2, { rng: seq(0, 0, 0, 0, 0, 0, 0, 0, 0, 0) }).some((f) => f.kind === 'silly'));
});

test('chọn lượt: không lặp món vừa xin, không xin đồ không ăn được; mức 3 xin 2 ở vòng đầu, không vượt bụng còn lại', () => {
  const tray = [food('banana'), food('apple'), food('sock')];
  for (let i = 0; i < 30; i++) {
    const r = pickRequest(tray, { level: 2, last: 'banana' });
    assert.equal(r.food.id, 'apple');
    assert.equal(r.count, 1);
  }
  const t3 = [food('cookie'), food('egg'), food('apple'), food('cake')];
  assert.equal(pickRequest(t3, { level: 3, firstRound: true }).count, 2);
  for (let i = 0; i < 30; i++) {
    const r = pickRequest(t3, { level: 3 });
    assert.ok(r.count >= 1 && r.count <= 3);
    assert.equal(pickRequest(t3, { level: 3, bellyLeft: 1 }).count, 1);
  }
  // Mức 3 không xin món không đếm được dù có trong khay.
  assert.equal(pickRequest([food('milk'), food('grapes'), food('cookie')], { level: 3 }).food.id, 'cookie');
  assert.equal(pickRequest([food('sock')], { level: 1 }), null);
  assert.deepEqual(pickRequest(tray, { level: 1, rng: () => 0 }), { food: food('banana'), count: 1, got: 0, wrong: 0 });
  assert.equal(BELLY, 5);
});

test('mức: tự lên sau 2 vòng, khóa mức thì giữ; dữ liệu hỏng về mức 1', () => {
  let s = cleanFeedState(undefined);
  assert.deepEqual(s, { level: 1, rounds: 0, lock: null });
  s = afterRound(s);
  assert.deepEqual(s, { level: 1, rounds: 1, lock: null });
  s = afterRound(s);
  assert.deepEqual(s, { level: 2, rounds: 0, lock: null });
  s = afterRound(afterRound(s));
  assert.equal(s.level, 3);
  assert.equal(afterRound(afterRound(s)).level, 3);
  assert.equal(afterRound(cleanFeedState({ level: 1, rounds: 5, lock: 1 })).level, 1);
  assert.deepEqual(cleanFeedState({ level: 9, rounds: -1, lock: 'x' }), { level: 1, rounds: 0, lock: null });
  assert.equal(cleanFeedState({ level: 1, lock: 3 }).level, 3);
});

test('món bố mẹ thêm: bỏ món hỏng / trùng mã; đếm được cần a/an + số nhiều; đồ không ăn được phải đếm được', () => {
  const list = cleanCustomFoods([
    { id: 'custom-mango', en: 'Mango', vi: 'quả xoài', kind: 'food', grammar: 'count', article: 'a', plural: 'mangoes' },
    { id: 'custom-mango', en: 'mango', vi: 'xoài', kind: 'food', grammar: 'count', article: 'a', plural: 'mangoes' },
    { id: 'custom-soup', en: 'soup', vi: 'canh', kind: 'food', grammar: 'mass' },
    { id: 'custom-bad', en: 'bun', vi: 'bánh', kind: 'food', grammar: 'count' },
    { id: 'custom-sand', en: 'sand', vi: 'cát', kind: 'silly', grammar: 'mass' },
    { id: 'banana', en: 'banana', vi: 'chuối', kind: 'food', grammar: 'mass' },
    { id: 'custom-x', en: '', vi: 'x', kind: 'food', grammar: 'mass' },
    null, 'hỏng',
  ]);
  assert.deepEqual(list.map((f) => f.id), ['custom-mango', 'custom-soup']);
  assert.equal(list[0].en, 'mango');
  assert.equal(requestPhrase(list[1]), 'some soup');
  assert.equal(allFoods(list).length, BUILTIN_FOODS.length + 2);
  assert.deepEqual(cleanCustomFoods('hỏng'), []);
});

test('prompt ảnh nền: chừa giữa khung cho Bông, không chữ', () => {
  assert.match(BACKGROUND_PROMPT, /CENTER of the picture empty/);
  assert.match(BACKGROUND_PROMPT, /NEVER write any text/);
});
