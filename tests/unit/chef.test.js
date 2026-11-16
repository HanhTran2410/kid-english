// 👨‍🍳 Đầu bếp nhí (SPEC-jobs3.md mục 5, SPEC-jobs4.md mục 3): kế hoạch lượt thỏa bất biến (500 seed mỗi mức), câu nói,
// ca D món nóng – món lạnh (thay A / C luân phiên), dọn bếp cuối lượt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  planRound, fallbackPlan, caseOk, caseActions, orderLine, noLine, layerWrongLine, layerCallLine, chainLine, firstLine,
  toolWrongLine, decorAskLine, decorWrongLine, stepLine,
  DISHES, TEMP_COMBOS, CLEAN_ITEMS, tempMatches, cleanOk, replacedByTemp, makeTempCase, makeClean,
  feelLine, somethingLine, tempAskLine, tempWrongLine, cleanAskLine, placeWrongLine, itemWrongLine,
} from '../../app/js/jobs/chef.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

test('500 seed mỗi mức: đủ 3 ca (ca D thay A / C luân phiên — JOBS4-06), bất biến, ≤ 5 thao tác con; egg chỉ là đáp án ở bước "Crack the egg!"', () => {
  for (const level of [1, 2, 3]) {
    const rng = seeded(level * 11);
    for (let i = 0; i < 500; i++) {
      const rounds = i % 4;
      const { cases, clean } = planRound(level, { rng, rounds });
      const kinds = cases.map((c) => c.kind);
      // Lượt lẻ (rounds chẵn) không có bánh mì kẹp; lượt chẵn không có trang trí; luôn có bánh nướng.
      assert.deepEqual([...kinds].sort(), (rounds % 2 === 0 ? ['bake', 'decor', 'temp'] : ['bake', 'sandwich', 'temp']).sort());
      if (level !== 2) assert.deepEqual(kinds, ['sandwich', 'bake', 'decor'].map((k) => (k === replacedByTemp(rounds) ? 'temp' : k)));
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
      assert.equal(b.ordered, level >= 3);
      assert.equal(b.steps.includes('crack'), level >= 2);
      if (d) {
        assert.equal(d.want.length, level >= 3 ? 2 : 1);
        if (level >= 3) assert.equal(d.tray.length, 3);
      }
      if (level <= 1) assert.equal(clean, null);
      else {
        assert.ok(cleanOk(clean, level), JSON.stringify(clean));
        // JOBS4-17: dọn bếp không dùng từ đã là đáp án ở ca D.
        const t = cases.find((c) => c.kind === 'temp');
        const tWord = t.dish ? DISHES[t.dish].word : null;
        if (tWord) assert.ok(!clean.asks.some((id) => CLEAN_ITEMS[id].word === tWord), `${tWord} ${clean.asks}`);
      }
    }
  }
  for (const level of [1, 2, 3]) {
    for (const rounds of [0, 1]) {
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
