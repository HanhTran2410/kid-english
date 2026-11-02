// 👨‍🍳 Đầu bếp nhí (SPEC-jobs3.md mục 5): kế hoạch lượt thỏa bất biến (500 seed mỗi mức), câu nói.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  planRound, fallbackPlan, caseOk, caseActions, orderLine, noLine, layerWrongLine, layerCallLine, chainLine, firstLine,
  toolWrongLine, decorAskLine, decorWrongLine, stepLine,
} from '../../app/js/jobs/chef.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

test('500 seed mỗi mức: đủ 3 ca, bất biến, ≤ 5 thao tác con; egg chỉ là đáp án ở bước "Crack the egg!"', () => {
  for (const level of [1, 2, 3]) {
    const rng = seeded(level * 11);
    for (let i = 0; i < 500; i++) {
      const { cases } = planRound(level, { rng });
      assert.deepEqual(cases.map((c) => c.kind).sort(), ['bake', 'decor', 'sandwich']);
      for (const c of cases) {
        assert.ok(caseOk(c, level), `mức ${level}: ${JSON.stringify(c)}`);
        assert.ok(caseActions(c) <= 5);
      }
      const s = cases.find((c) => c.kind === 'sandwich');
      const b = cases.find((c) => c.kind === 'bake');
      const d = cases.find((c) => c.kind === 'decor');
      assert.ok(!s.layers.includes('egg'));
      assert.equal(Boolean(s.no), level >= 3);
      assert.equal(b.ordered, level >= 3);
      assert.equal(b.steps.includes('crack'), level >= 2);
      assert.equal(d.want.length, level >= 3 ? 2 : 1);
      if (level >= 3) assert.equal(d.tray.length, 3);
    }
  }
  for (const level of [1, 2, 3]) for (const c of fallbackPlan(level).cases) assert.ok(caseOk(c, level));
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
