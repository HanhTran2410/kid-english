// Bán hàng (SPEC-jobs.md mục 3) + mức chung của các nghề (mục 2.2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_FOODS, allFoods } from '../../app/js/feed.js';
import { cleanJobState, afterJobRound, afterSeen } from '../../app/js/jobs/levels.js';
import {
  SHELF_SIZE, makeShelf, makeOrder, planRound, coinsFor, remaining, orderDone, orderLine, wrongLine, enoughLine, coinLine, countLine,
  STOCK_SIZE, makeStock, foodGroup, groupsFor, groupLine, wrongBasketLine, giveBagLine,
  SMOOTHIE_FRUITS, makeSmoothie, smoothieOrderLine, wrongFruitLine, needFruitLine, hereSmoothieLine,
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
    // Ca sinh tố (SPEC-jobs2 SH2) không theo luật món đầu.
    for (let k = 1; k < 3; k++) if (!plan.cases[k].kind && !plan.cases[k - 1].kind) assert.notEqual(plan.cases[k].order[0].id, plan.cases[k - 1].order[0].id);
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

test('SPEC-jobs2 SH1 — thùng hàng: mức 1 3 món / mức 2–3 4 món, không trùng; mỗi giỏ của mức có ít nhất 1 món; mức 1–2 chỉ trái cây / đồ uống; mức 3 có cả đồ ăn khác', () => {
  const rng = seeded(23);
  for (const level of [1, 2, 3]) for (let i = 0; i < 60; i++) {
    const stock = makeStock(level, { rng });
    assert.equal(stock.length, STOCK_SIZE[level]);
    assert.equal(new Set(stock).size, stock.length);
    const groups = stock.map((id) => foodGroup(foodById(id)));
    for (const g of groupsFor(level)) assert.ok(groups.includes(g), `mức ${level} thiếu ${g}`);
    assert.ok(groups.every((g) => groupsFor(level).includes(g)));
  }
  assert.ok(planRound(2, { rng }).stock.length === 4);
  // Món bố mẹ thêm loại đồ uống vào giỏ Drinks; đồ không ăn được không có nhóm.
  assert.equal(foodGroup({ id: 'tea', en: 'tea', kind: 'drink', grammar: 'mass' }), 'drink');
  // Không có đồ uống nào (danh sách lạ): vẫn đủ giỏ nhờ bộ mặc định.
  const noDrinks = BUILTIN_FOODS.filter((f) => f.kind !== 'drink');
  assert.ok(makeStock(2, { foods: noDrinks, rng }).some((id) => foodGroup(foodById(id)) === 'drink'));
  assert.equal(foodGroup(foodById('sock')), null);
  assert.equal(foodGroup(foodById('mango')), 'fruit');
  assert.equal(foodGroup(foodById('bread')), 'other');
});

test('SPEC-jobs2 SH1 — câu bày kệ / đưa túi', () => {
  assert.equal(groupLine(foodById('banana'))[0], 'Bananas are fruit!');
  assert.equal(groupLine(foodById('watermelon'))[0], 'Watermelon is fruit!');
  assert.equal(groupLine(foodById('grapes'))[0], 'Grapes are fruit!');
  assert.equal(groupLine(foodById('milk'))[0], 'Milk is a drink!');
  assert.equal(groupLine(foodById('bread'))[0], 'Bread is food!');
  assert.equal(wrongBasketLine(foodById('milk'))[0], 'Milk is a drink! Put it in the drinks basket.');
  assert.equal(wrongBasketLine(foodById('apple'))[0], 'Apples are fruit! Put it in the fruit basket.');
  assert.equal(giveBagLine('Kitty')[0], 'Give it to Kitty!');
});

test('SPEC-jobs2 SH2 — sinh tố: mức 1 không có; mức 2–3 đúng một ca sinh tố; mức 2 một quả, mức 3 hai quả khác nhau; khay = quả của đơn + 2 quả nhiễu, chỉ quả làm sinh tố', () => {
  const rng = seeded(29);
  for (const level of [1, 2, 3]) for (let i = 0; i < 60; i++) {
    const { cases } = planRound(level, { rng });
    const sm = cases.filter((c) => c.kind === 'smoothie');
    assert.equal(sm.length, level >= 2 ? 1 : 0);
    if (!sm.length) continue;
    const [c] = sm;
    assert.equal(c.order.length, level >= 3 ? 2 : 1);
    assert.equal(new Set(c.order.map((o) => o.id)).size, c.order.length);
    assert.equal(c.tray.length, c.order.length + 2);
    assert.equal(new Set(c.tray).size, c.tray.length);
    assert.ok(c.tray.every((id) => SMOOTHIE_FRUITS.includes(id)));
    assert.ok(c.order.every((o) => c.tray.includes(o.id) && o.count === 1));
  }
  const banana = foodById('banana');
  const strawberry = foodById('strawberry');
  const apple = foodById('apple');
  assert.equal(smoothieOrderLine([banana])[0], 'Can I have a banana smoothie, please?');
  assert.equal(smoothieOrderLine([banana, strawberry])[0], 'Can I have a banana and strawberry smoothie, please?');
  assert.equal(smoothieOrderLine([apple])[0], 'Can I have an apple smoothie, please?');
  assert.equal(wrongFruitLine(apple, [banana])[0], "That's an apple. I want banana!");
  assert.equal(needFruitLine([banana])[0], 'We need banana!');
  assert.equal(hereSmoothieLine([banana])[0], 'Here you are! A banana smoothie!');
  void makeSmoothie;
});
