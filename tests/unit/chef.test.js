// 👨‍🍳 Đầu bếp nhí (SPEC-jobs3.md mục 5, SPEC-jobs4.md mục 3): kế hoạch lượt thỏa bất biến (500 seed mỗi mức), câu nói,
// ca D món nóng – món lạnh (thay A / C luân phiên), ca E "Bé đói rồi!" (SPEC-jobs5), dọn bếp cuối lượt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  planRound, fallbackPlan, caseOk, caseActions, orderLine, noLine, layerWrongLine, layerCallLine, chainLine, firstLine,
  toolWrongLine, decorAskLine, decorWrongLine, stepLine,
  DISHES, TEMP_COMBOS, CLEAN_ITEMS, tempMatches, cleanOk, replacedByTemp, makeTempCase, makeClean,
  feelLine, somethingLine, tempAskLine, tempWrongLine, cleanAskLine, placeWrongLine, itemWrongLine,
  makeHungryCase, hungryRound, hungryCleanAvoid, dishActions, E_STEPS, E_TOOLS, FRUITS, TOPPINGS, toppingAskLine, toppingWrongLine, sayLine,
  saladAskLine, fruitWrongLine, noFruitLine, fruitOneLine, eChainLine, eNextLine, eToolWrongLine, menuLine, chosenLine, feelWrongLine,
} from '../../app/js/jobs/chef.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

test('500 seed mỗi mức: đủ 3 ca theo rounds % 3 (JOBS5-10: 0 → D thay A, 1 → D thay C, 2 → A + C + E), bất biến, ≤ 5 thao tác con; egg chỉ là đáp án ở bước "Crack the egg!"', () => {
  for (const level of [1, 2, 3]) {
    const rng = seeded(level * 11);
    for (let i = 0; i < 500; i++) {
      const rounds = i % 6;
      const { cases, clean } = planRound(level, { rng, rounds });
      const kinds = cases.map((c) => c.kind);
      assert.deepEqual([...kinds].sort(), [['bake', 'decor', 'temp'], ['bake', 'sandwich', 'temp'], ['decor', 'hungry', 'sandwich']][rounds % 3]);
      // Ca E luôn là ca nghề cuối, không cùng lượt với bánh nướng (SPEC-jobs5 mục 6).
      if (rounds % 3 === 2) {
        assert.equal(kinds[2], 'hungry');
        if (level !== 2) assert.deepEqual(kinds, ['sandwich', 'decor', 'hungry']);
      } else if (level !== 2) assert.deepEqual(kinds, ['sandwich', 'bake', 'decor'].map((k) => (k === replacedByTemp(rounds) ? 'temp' : k)));
      for (const c of cases) {
        assert.ok(caseOk(c, level), `mức ${level}: ${JSON.stringify(c)}`);
        assert.ok(caseActions(c) <= 5);
      }
      const s = cases.find((c) => c.kind === 'sandwich');
      const b = cases.find((c) => c.kind === 'bake');
      const d = cases.find((c) => c.kind === 'decor');
      if (s) {
        assert.ok(!s.layers.includes('egg'));
        assert.equal(Boolean(s.no), level >= 3);
      }
      if (b) {
        assert.equal(b.ordered, level >= 3);
        assert.equal(b.steps.includes('crack'), level >= 2);
      }
      if (d) {
        assert.equal(d.want.length, level >= 3 ? 2 : 1);
        if (level >= 3) assert.equal(d.tray.length, 3);
      }
      if (level <= 1) assert.equal(clean, null);
      else {
        assert.ok(cleanOk(clean, level), JSON.stringify(clean));
        // JOBS4-17: dọn bếp không dùng từ đã là đáp án ở ca D.
        const t = cases.find((c) => c.kind === 'temp');
        const tWord = t?.dish ? DISHES[t.dish].word : null;
        // JOBS5-20: dọn bếp không có đồ nào đã ở trên bàn ca E (bát salad, đồ nhiễu).
        const e = cases.find((c) => c.kind === 'hungry');
        if (e) for (const id of hungryCleanAvoid(e)) assert.ok(!clean.items.includes(id), `${id} ${clean.items}`);
        if (tWord) assert.ok(!clean.asks.some((id) => CLEAN_ITEMS[id].word === tWord), `${tWord} ${clean.asks}`);
      }
    }
  }
  for (const level of [1, 2, 3]) {
    for (const rounds of [0, 1, 2]) {
      const f = fallbackPlan(level, rounds);
      for (const c of f.cases) assert.ok(caseOk(c, level));
      assert.ok(level <= 1 ? f.clean === null : cleanOk(f.clean, level));
    }
  }
});

test('ca D: mức 1 khay 1 nóng + 1 lạnh; mức 2 đúng một món khớp nóng / lạnh; mức 3 bảng tổ hợp — mỗi tổ hợp đúng một đáp án (JOBS4-34)', () => {
  for (const [dish, tray] of Object.entries(TEMP_COMBOS)) {
    assert.equal(tray.length, 4);
    assert.equal(new Set(tray).size, 4);
    assert.equal(tray[0], dish);
    const c = { kind: 'temp', want: DISHES[dish].hot ? 'hot' : 'cold', dish, tray };
    assert.deepEqual(tempMatches(c), [dish]);
    // Có món cùng loại khác nóng / lạnh hoặc cùng nóng / lạnh khác món.
    assert.ok(tray.some((id) => id !== dish && DISHES[id].hot === DISHES[dish].hot));
    assert.ok(tray.some((id) => DISHES[id].hot !== DISHES[dish].hot));
  }
  for (const level of [1, 2, 3]) {
    const rng = seeded(level * 3);
    for (let i = 0; i < 500; i++) {
      const c = makeTempCase(level, { rng });
      assert.ok(caseOk(c, level), JSON.stringify(c));
      if (level <= 1) assert.equal(c.tray.filter((id) => DISHES[id].hot).length, 1);
    }
  }
});

test('dọn bếp: hai đồ cần cất ở hai chỗ khác nhau, mức 3 có đồ nhiễu; tránh từ đã dùng', () => {
  for (const level of [2, 3]) {
    const rng = seeded(level * 5);
    for (let i = 0; i < 500; i++) {
      const cl = makeClean(level, { rng, avoid: ['milk'] });
      assert.ok(cleanOk(cl, level));
      assert.ok(!cl.items.includes('milk'));
    }
  }
});

test('câu ca D và dọn bếp: đủ hai chiều nóng / lạnh, đúng mẫu', () => {
  assert.equal(feelLine('hot')[0], "I'm cold!");
  assert.equal(somethingLine('hot')[0], 'Something hot!');
  assert.equal(feelLine('cold')[0], "I'm hot!");
  assert.equal(somethingLine('cold')[0], 'Something cold!');
  assert.equal(tempAskLine({ want: 'cold', dish: null })[0], 'Something cold, please!');
  assert.equal(tempAskLine({ want: 'hot', dish: 'hot-milk' })[0], 'Hot milk, please!');
  assert.equal(tempWrongLine({ want: 'hot', dish: null }, 'ice-cream')[0], "That's ice cream. Something hot, please!");
  assert.equal(tempWrongLine({ want: 'hot', dish: 'hot-milk' }, 'cold-milk')[0], "That's cold milk. Hot milk, please!");
  assert.equal(cleanAskLine('milk', 2)[0], 'The milk goes in the fridge!');
  assert.equal(cleanAskLine('eggs', 2)[0], 'The eggs go in the cupboard!');
  assert.equal(cleanAskLine('bowl', 2, true)[0], 'Now the bowl goes in the sink!');
  assert.equal(cleanAskLine('bread', 3)[0], 'Put the bread in the cupboard!');
  assert.equal(cleanAskLine('bowl', 3, true)[0], 'Now put the bowl in the sink!');
  assert.equal(placeWrongLine('sink', 'milk')[0], "That's the sink. In the fridge, please!");
  assert.equal(itemWrongLine('bowl', 'bread')[0], "That's the bowl. The bread, please!");
  assert.equal(replacedByTemp(0), 'sandwich');
  assert.equal(replacedByTemp(1), 'decor');
});

test('câu nói: gọi lớp, cả món, "No …", nhầm lớp, chuỗi bước, trang trí số ít / nhiều', () => {
  assert.equal(layerCallLine('bread')[0], 'Bread!');
  assert.equal(orderLine(['bread', 'cheese', 'tomato', 'bread'])[0], 'Bread, cheese, tomato, bread!');
  assert.equal(noLine('tomato')[0], 'No tomato, please!');
  assert.equal(layerWrongLine('tomato', 'cheese')[0], "That's a tomato. Cheese, please!");
  assert.equal(stepLine('bake')[0], 'In the oven!');
  assert.equal(chainLine(['crack', 'pour', 'mix', 'bake'])[0], 'First, crack the egg. Then, pour the milk. Then, mix!');
  assert.equal(firstLine('pour')[0], 'First, pour the milk!');
  assert.equal(toolWrongLine('spoon', 'crack')[0], "That's the spoon. Crack the egg!");
  assert.equal(decorAskLine([{ id: 'strawberry', n: 3 }])[0], 'Three strawberries, please!');
  assert.equal(decorAskLine([{ id: 'strawberry', n: 2 }, { id: 'cherry', n: 1 }])[0], 'Two strawberries and one cherry, please!');
  assert.equal(decorAskLine([{ id: 'candle', n: 1 }])[0], 'One candle, please!');
  assert.equal(decorWrongLine('blueberry', ['strawberry'])[0], "That's a blueberry. Strawberries, please!");
});

test('ca E (SPEC-jobs5): thực đơn mức 1 hai món ít làm nhất, mức 2–3 ba món; mức 3 thẻ mặt có hungry; cơm nắm 2 / 3 bước bắt đầu bằng scoop; salad luôn có chuối, mức 3 có quả "No"; đồ nhiễu mức 2–3', () => {
  for (const level of [1, 2, 3]) {
    const rng = seeded(level * 7);
    for (let i = 0; i < 500; i++) {
      const c = makeHungryCase(level, { rng });
      assert.ok(caseOk(c, level), JSON.stringify(c));
      if (level >= 2) assert.deepEqual([...c.menu].sort(), ['pizza', 'rice-ball', 'salad']);
      else assert.equal(c.menu.length, 2);
      // Pizza: mức 1 không có nhân; mức 2 hai lát một loại; mức 3 1 + 1 hai loại; khay có loại không được gọi (mức 2–3).
      const z = c.pizza;
      assert.equal(dishActions(c, 'pizza'), level <= 1 ? 3 : 5);
      assert.deepEqual(z.want.map((w) => w.n), level <= 1 ? [] : level === 2 ? [2] : [1, 1]);
      if (level >= 2) assert.ok(z.tray.some((id) => !z.want.some((w) => w.id === id)));
      for (const id of z.tray) assert.ok(TOPPINGS[id]);
      // JOBS5-20: bát sốt / bát phô mai → dọn bếp không có cái bát.
      assert.ok(hungryCleanAvoid(c).includes('bowl'));
      assert.equal(c.rice.steps.length, level <= 1 ? 2 : 3);
      assert.equal(c.salad.fruits[0], 'banana');
      assert.equal(dishActions(c, 'salad'), 4); // JOBS5-11: chọn 2 quả + bóc + trộn
      assert.ok(caseActions(c) <= 5);
      if (level >= 2) {
        const extra = c.rice.tools.filter((t) => !c.rice.steps.some((s) => E_STEPS[s].tool === t));
        assert.equal(extra.length, 1);
        assert.ok(['milk', 'egg'].includes(extra[0]));
      }
      if (level >= 3) {
        assert.ok(!c.salad.fruits.includes(c.salad.no));
        assert.ok(c.salad.tray.includes(c.salad.no));
      }
      for (const f of c.salad.tray) assert.ok(FRUITS.includes(f));
    }
  }
  // Mức 1: món ít làm nhất lên thực đơn (salad đã làm nhiều → không có).
  const r1 = seeded(5);
  for (let i = 0; i < 50; i++) assert.ok(!makeHungryCase(1, { rng: r1, seen: { 'dish:salad': 4 } }).menu.includes('salad'));
  // Quả ít gặp trước: táo đã gặp nhiều thì không được gọi.
  const rng = seeded(3);
  for (let i = 0; i < 50; i++) assert.notEqual(makeHungryCase(2, { rng, seen: { 'fruit:apple': 9 } }).salad.fruits[1], 'apple');
  assert.equal(hungryRound(2), true);
  assert.equal(hungryRound(5), true);
  assert.equal(hungryRound(0), false);
  assert.equal(hungryRound(1), false);
  for (const t of Object.values(E_STEPS)) assert.ok(E_TOOLS[t.tool]);
});

test('câu ca E: chuỗi bước, bước kế, đồ sai, gọi quả, "No …", thực đơn', () => {
  assert.equal(eChainLine(['scoop', 'squeeze', 'wrap'])[0], 'First, scoop the rice. Then, squeeze. Then, wrap it!');
  assert.equal(eNextLine(['scoop', 'squeeze', 'wrap'], 0)[0], 'First, scoop the rice!');
  assert.equal(eNextLine(['scoop', 'squeeze', 'wrap'], 1)[0], 'Now, squeeze!');
  assert.equal(eToolWrongLine('milk', 'scoop')[0], "That's the milk. Scoop the rice!");
  assert.equal(eToolWrongLine('gloves', 'wrap')[0], 'Those are the gloves. Wrap it!');
  assert.equal(saladAskLine({ fruits: ['banana', 'apple'], no: null })[0], 'Banana and apple, please!');
  assert.equal(saladAskLine({ fruits: ['banana', 'apple'], no: 'grapes' })[0], 'Banana and apple, please! No grapes!');
  assert.equal(fruitWrongLine('mango', ['banana', 'apple'])[0], "That's a mango. Banana and apple, please!");
  assert.equal(fruitWrongLine('grapes', ['apple'])[0], 'Those are grapes. An apple, please!');
  assert.equal(noFruitLine('grapes')[0], 'No grapes, please!');
  assert.equal(noFruitLine('strawberry')[0], 'No strawberries, please!');
  assert.equal(fruitOneLine('banana')[0], 'A banana, please!');
  assert.equal(menuLine('rice-ball')[0], 'A rice ball?');
  assert.equal(chosenLine('salad')[0], "A fruit salad! Let's make it!");
  assert.equal(feelWrongLine('sleepy')[0], "That's sleepy.");
});

test('câu pizza + lượt nói: số ít / nhiều, a / an', () => {
  assert.equal(toppingAskLine([{ id: 'tomato', n: 2 }])[0], 'Two tomatoes!');
  assert.equal(toppingAskLine([{ id: 'tomato', n: 1 }, { id: 'mushroom', n: 1 }])[0], 'One tomato and one mushroom!');
  assert.equal(toppingWrongLine('pineapple', ['tomato'])[0], "That's a pineapple. Tomatoes, please!");
  assert.equal(toppingWrongLine('mushroom', ['tomato', 'pineapple'])[0], "That's a mushroom. Tomatoes and pineapples, please!");
  assert.equal(sayLine('rice-ball')[0], 'Rice ball, please!');
  assert.equal(sayLine('pizza')[0], 'Pizza, please!');
  assert.equal(E_STEPS.bake.tool, 'oven');
});
