// 👩‍🌾 Nông trại (SPEC-jobs3.md mục 4): kế hoạch lượt thỏa bất biến mục 2.2 (500 seed mỗi mức), câu nói.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  planRound, fallbackPlan, caseOk, caseActions, eggMatches, pickMatches, numberCards, FOODS, FARM_ANIMALS, ANIMAL_BY_ID,
  foodAskLine, foodWrongLine, eggCountLine, eggAskLine, eggWrongLine, pickAskLine, pickWrongLine, hungryLine,
} from '../../app/js/jobs/farm.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

test('500 seed mỗi mức: 3 ca đúng loại, mọi ca thỏa bất biến, ≤ 5 thao tác con, ba ca cho ăn khác con vật', () => {
  for (const level of [1, 2, 3]) {
    const rng = seeded(level * 7);
    for (let i = 0; i < 500; i++) {
      const { cases } = planRound(level, { rng });
      assert.equal(cases.length, 3);
      const kinds = cases.map((c) => c.kind);
      if (level === 1) assert.deepEqual(kinds, ['feed', 'eggs', 'feed']);
      else assert.deepEqual([...kinds].sort(), ['eggs', 'feed', 'pick']);
      for (const c of cases) {
        assert.ok(caseOk(c, level), `mức ${level}: ${JSON.stringify(c)}`);
        assert.ok(caseActions(c) <= 5);
      }
      const feeds = cases.filter((c) => c.kind === 'feed');
      assert.equal(new Set(feeds.map((c) => c.animal)).size, feeds.length);
      for (const c of feeds) {
        assert.equal(Boolean(c.doors), level >= 3);
        if (level <= 2) assert.ok(!(c.tray.includes('hay') && c.tray.includes('grass')), 'hay và grass không cùng khay ở mức 1–2');
      }
    }
  }
});

test('JOBS3-13: trứng mức 3 luôn đủ số trứng đúng màu và có ≥ 1 trứng màu kia; thẻ số mức 2 có 3 số khác nhau, có đáp án', () => {
  const rng = seeded(13);
  for (let i = 0; i < 500; i++) {
    const c3 = planRound(3, { rng }).cases.find((c) => c.kind === 'eggs');
    assert.ok(eggMatches(c3).length >= c3.ask.count);
    assert.ok(c3.total - eggMatches(c3).length >= 1);
    const c2 = planRound(2, { rng }).cases.find((c) => c.kind === 'eggs');
    assert.equal(new Set(c2.cards).size, 3);
    assert.ok(c2.cards.includes(c2.total));
  }
  for (let n = 1; n <= 5; n++) assert.equal(numberCards(n, rng).filter((x) => x === n).length, 1);
});

test('hái quả: số quả khớp đúng bằng số phải hái; mức 3 có quả nhỏ cùng màu để bé phải chọn', () => {
  const rng = seeded(5);
  for (let i = 0; i < 300; i++) {
    const c = planRound(3, { rng }).cases.find((x) => x.kind === 'pick');
    assert.equal(pickMatches(c).length, 2);
    assert.ok(c.apples.some((a) => a.color === c.ask.color && a.size === 'small'));
  }
});

test('kế hoạch cố định của từng mức cũng thỏa bất biến', () => {
  for (const level of [1, 2, 3]) for (const c of fallbackPlan(level).cases) assert.ok(caseOk(c, level), `${level} ${c.kind}`);
});

test('mỗi con vật có tiếng kêu và thức ăn riêng; câu nói không rỗng, đúng mạo từ / số ít số nhiều', () => {
  assert.equal(new Set(FARM_ANIMALS.map((a) => a.food)).size, FARM_ANIMALS.length);
  assert.equal(new Set(FARM_ANIMALS.map((a) => a.says)).size, FARM_ANIMALS.length);
  assert.deepEqual(foodAskLine('cow'), ['Hay, please!', 'Cho tớ cỏ khô nhé!']);
  assert.equal(foodWrongLine('cow', 'corn')[0], "That's corn. Hay, please!");
  assert.equal(foodWrongLine('pig', 'carrot')[0], "That's a carrot. Apple, please!");
  assert.equal(foodWrongLine('horse', 'apple')[0], "That's an apple. Carrot, please!");
  assert.equal(foodWrongLine('chicken', 'seeds')[0], 'Those are seeds. Corn, please!');
  assert.equal(hungryLine('cow')[0], 'The cow is hungry!');
  assert.equal(eggCountLine(1)[0], 'One egg!');
  assert.equal(eggCountLine(3)[0], 'Three eggs!');
  assert.equal(eggAskLine({ color: 'brown', count: 2 })[0], 'Two brown eggs, please!');
  assert.equal(eggAskLine({ color: 'white', count: 1 })[0], 'One white egg, please!');
  assert.equal(eggWrongLine({ color: 'brown', count: 2 }, 'white')[0], "That's a white egg. Brown eggs, please!");
  assert.equal(pickAskLine({ color: 'red', size: null, count: 2 })[0], 'Pick the red apples!');
  assert.equal(pickAskLine({ color: 'red', size: 'big', count: 2 })[0], 'Pick two big red apples!');
  assert.equal(pickWrongLine({ color: 'red', size: 'big' }, { color: 'red', size: 'small' })[0], "That's a small apple. Big red apples, please!");
  assert.equal(pickWrongLine({ color: 'red', size: null }, { color: 'green', size: 'big' })[0], "That's a green apple. Red apples, please!");
  for (const f of Object.values(FOODS)) assert.ok(f.that && f.vi);
  for (const a of FARM_ANIMALS) assert.ok(FOODS[a.food] && ANIMAL_BY_ID.get(a.id));
});
