// Bán hàng (SPEC-jobs.md mục 3) + mức chung của các nghề (mục 2.2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_FOODS, allFoods } from '../../app/js/feed.js';
import { cleanJobState, afterJobRound, afterSeen } from '../../app/js/jobs/levels.js';
import {
  SHELF_SIZE, makeShelf, makeOrder, planRound, coinsFor, remaining, orderDone, orderLine, wrongLine, enoughLine, coinLine, countLine,
} from '../../app/js/jobs/shop.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const foodById = (id) => BUILTIN_FOODS.find((f) => f.id === id);

test('kệ hàng: đúng số món theo mức, không trùng, không có đồ không ăn được; mức 1 chỉ món dễ; mức 2–3 có đúng 1 đồ uống', () => {
  const rng = seeded(5);
  for (const level of [1, 2, 3]) for (let i = 0; i < 40; i++) {
    const shelf = makeShelf(level, { rng });
    assert.equal(shelf.length, SHELF_SIZE[level]);
    assert.equal(new Set(shelf.map((f) => f.id)).size, shelf.length);
    assert.ok(shelf.every((f) => f.kind === 'food' || f.kind === 'drink'));
    if (level === 1) assert.ok(shelf.every((f) => f.easy && f.kind === 'food'));
    else assert.equal(shelf.filter((f) => f.kind === 'drink').length, 1);
  }
});

test('món gọi: mức 1 một món 1 cái; mức 2 số lượng chỉ với món đếm được (≤ 3); mức 3 hai món khác nhau; món luôn có trên kệ', () => {
  const rng = seeded(11);
  for (const level of [1, 2, 3]) for (let i = 0; i < 60; i++) {
    const shelf = makeShelf(level, { rng });
    const order = makeOrder(shelf, level, { rng });
    const ids = new Set(shelf.map((f) => f.id));
    assert.ok(order.every((o) => ids.has(o.id)));
    if (level === 1) assert.deepEqual(order.map((o) => o.count), [1]);
    if (level === 2) {
      assert.equal(order.length, 1);
      const f = foodById(order[0].id);
      assert.ok(order[0].count >= 1 && order[0].count <= 3);
      if (f.grammar !== 'count') assert.equal(order[0].count, 1);
    }
    if (level === 3) {
      assert.equal(order.length, 2);
      assert.notEqual(order[0].id, order[1].id);
    }
  }
});

test('một lượt: 3 khách khác nhau, khách liền nhau không gọi cùng món đầu; xu: mức 1 không có, mức 2+ = số món (tối đa 3)', () => {
  const rng = seeded(2);
  for (const level of [1, 2, 3]) for (let i = 0; i < 30; i++) {
    const plan = planRound(level, { rng });
    assert.equal(plan.cases.length, 3);
    assert.equal(new Set(plan.cases.map((c) => c.customer)).size, 3);
    for (let k = 1; k < 3; k++) assert.notEqual(plan.cases[k].order[0].id, plan.cases[k - 1].order[0].id);
  }
  assert.equal(coinsFor([{ id: 'apple', count: 2 }], 1), 0);
  assert.equal(coinsFor([{ id: 'apple', count: 2 }], 2), 2);
  assert.equal(coinsFor([{ id: 'apple', count: 3 }, { id: 'milk', count: 1 }], 3), 3);
});

test('câu: gọi món đúng loại danh từ, đang đưa dở chỉ nói phần còn thiếu, câu nhầm / đủ rồi, đếm xu', () => {
  assert.equal(orderLine([{ id: 'banana', count: 1 }], foodById)[0], 'Can I have a banana, please?');
  assert.equal(orderLine([{ id: 'apple', count: 2 }], foodById)[0], 'Can I have two apples, please?');
  assert.equal(orderLine([{ id: 'apple', count: 3 }], foodById, { apple: 1 })[0], 'Can I have two more apples, please?');
  assert.equal(orderLine([{ id: 'apple', count: 2 }], foodById, { apple: 1 })[0], 'Can I have one more apple, please?');
  assert.equal(orderLine([{ id: 'banana', count: 1 }, { id: 'milk', count: 1 }], foodById)[0], 'Can I have a banana and some milk, please?');
  assert.equal(orderLine([{ id: 'banana', count: 1 }, { id: 'milk', count: 1 }], foodById, { banana: 1 })[0], 'Can I have some milk, please?');
  assert.equal(orderLine([{ id: 'grapes', count: 1 }], foodById)[0], 'Can I have some grapes, please?');
  assert.equal(wrongLine(foodById('apple'), [{ id: 'banana', count: 1 }], foodById)[0], "Hmm, that's an apple. Can I have a banana, please?");
  assert.equal(wrongLine(foodById('grapes'), [{ id: 'banana', count: 1 }], foodById)[0], 'Hmm, those are grapes. Can I have a banana, please?');
  assert.equal(enoughLine([{ id: 'banana', count: 1 }, { id: 'milk', count: 1 }], foodById, { banana: 1 })[0], 'I have that already! Can I have some milk, please?');
  assert.equal(coinLine(1)[0], 'One coin!');
  assert.equal(coinLine(3)[0], 'Three coins!');
  assert.equal(countLine(2)[0], 'Two!');
  assert.deepEqual(remaining([{ id: 'apple', count: 2 }], { apple: 1 }), [{ id: 'apple', count: 2, left: 1 }]);
  assert.ok(orderDone([{ id: 'apple', count: 2 }], { apple: 2 }));
  // Mọi món bán được: câu gọi / câu nhầm không rỗng, không "undefined".
  for (const f of allFoods().filter((x) => x.kind !== 'silly')) {
    for (const n of f.grammar === 'count' ? [1, 2, 3] : [1]) {
      const lines = [orderLine([{ id: f.id, count: n }], foodById), wrongLine(foodById('banana'), [{ id: f.id, count: n }], foodById)];
      for (const [en, vi] of lines) assert.ok(en && vi && !/undefined|null/.test(en + vi), `${f.id}: ${en}`);
    }
  }
});

test('mức chung: dữ liệu hỏng → mức 1; đủ 3 lượt lên một mức (tối đa 3); khóa mức không đếm; seen +1', () => {
  assert.deepEqual(cleanJobState(undefined), { level: 1, rounds: 0, lock: null, seen: {} });
  assert.deepEqual(cleanJobState({ level: 9, lock: 2, rounds: 'x', seen: { a: 2, b: -1 } }), { level: 2, rounds: 0, lock: 2, seen: { a: 2 } });
  let s = cleanJobState({});
  for (let i = 0; i < 3; i++) s = afterJobRound(s);
  assert.deepEqual([s.level, s.rounds], [2, 0]);
  for (let i = 0; i < 6; i++) s = afterJobRound(s);
  assert.equal(s.level, 3);
  for (let i = 0; i < 5; i++) s = afterJobRound(s);
  assert.equal(s.level, 3);
  assert.deepEqual(afterJobRound({ level: 1, rounds: 2, lock: 1, seen: {} }), { level: 1, rounds: 0, lock: 1, seen: {} });
  assert.deepEqual(afterSeen(afterSeen(s, 'x'), 'x').seen.x, 2);
});
