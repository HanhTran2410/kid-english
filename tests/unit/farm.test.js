// 👩‍🌾 Nông trại (SPEC-jobs3.md mục 4, SPEC-jobs4.md mục 2): kế hoạch lượt thỏa bất biến mục 2.2 (500 seed mỗi mức), câu nói,
// ca D trời hôm nay, Good night.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  planRound, fallbackPlan, caseOk, caseActions, eggMatches, pickMatches, numberCards, FOODS, FARM_ANIMALS, ANIMAL_BY_ID,
  foodAskLine, foodWrongLine, eggCountLine, eggAskLine, eggWrongLine, pickAskLine, pickWrongLine, hungryLine,
  WEATHERS, WEATHER_CARDS, WEATHER_HELP, HELPS, HELP_ORDER, nightOk, eggsOrPick,
  weatherLine, helpAskLine, helpAnimalLine, helpWrongLine, weatherYesLine, weatherCardWrongLine, nightCallLine, nightWrongLine,
} from '../../app/js/jobs/farm.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

test('500 seed mỗi mức: 3 ca đúng loại (SPEC-jobs4 2.1), mọi ca thỏa bất biến, ≤ 5 thao tác con, ca cho ăn và ca thời tiết khác con vật', () => {
  for (const level of [1, 2, 3]) {
    const rng = seeded(level * 7);
    for (let i = 0; i < 500; i++) {
      const rounds = i % 3;
      const { cases, night } = planRound(level, { rng, rounds });
      assert.equal(cases.length, 3);
      const kinds = cases.map((c) => c.kind);
      if (level === 1) assert.deepEqual(kinds, ['feed', 'eggs', 'weather']);
      else if (level === 3) assert.deepEqual(kinds, ['feed', 'weather', eggsOrPick(rounds)]);
      else assert.deepEqual([...kinds].sort(), ['feed', eggsOrPick(rounds), 'weather'].sort());
      assert.ok(nightOk(night, level), JSON.stringify(night));
      const withAnimal = cases.filter((c) => c.animal);
      assert.equal(new Set(withAnimal.map((c) => c.animal)).size, withAnimal.length);
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
    const c3 = planRound(3, { rng, rounds: 0 }).cases.find((c) => c.kind === 'eggs');
    assert.ok(eggMatches(c3).length >= c3.ask.count);
    assert.ok(c3.total - eggMatches(c3).length >= 1);
    const c2 = planRound(2, { rng, rounds: 0 }).cases.find((c) => c.kind === 'eggs');
    assert.equal(new Set(c2.cards).size, 3);
    assert.ok(c2.cards.includes(c2.total));
  }
  for (let n = 1; n <= 5; n++) assert.equal(numberCards(n, rng).filter((x) => x === n).length, 1);
});

test('hái quả: số quả khớp đúng bằng số phải hái; mức 3 có quả nhỏ cùng màu để bé phải chọn', () => {
  const rng = seeded(5);
  for (let i = 0; i < 300; i++) {
    const c = planRound(3, { rng, rounds: 1 }).cases.find((x) => x.kind === 'pick');
    assert.equal(pickMatches(c).length, 2);
    assert.ok(c.apples.some((a) => a.color === c.ask.color && a.size === 'small'));
  }
});

test('kế hoạch cố định của từng mức cũng thỏa bất biến', () => {
  for (const level of [1, 2, 3]) {
    for (const rounds of [0, 1]) {
      const f = fallbackPlan(level, rounds);
      for (const c of f.cases) assert.ok(caseOk(c, level), `${level} ${c.kind}`);
      assert.ok(nightOk(f.night, level));
    }
  }
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

test('ca D trời hôm nay (SPEC-jobs4 2.1): 3 tình huống, mỗi tình huống đúng một đồ; mức 3 thẻ khác nhau, có thẻ đúng, sunny chỉ là nhiễu', () => {
  assert.deepEqual(WEATHERS, ['hot', 'cold', 'rainy']);
  assert.equal(new Set(WEATHERS.map((w) => WEATHER_HELP[w])).size, 3);
  assert.deepEqual([...HELP_ORDER].sort(), Object.keys(HELPS).sort());
  for (const level of [1, 2, 3]) {
    const rng = seeded(level * 31);
    for (let i = 0; i < 500; i++) {
      const c = planRound(level, { rng }).cases.find((x) => x.kind === 'weather');
      assert.ok(WEATHERS.includes(c.weather));
      if (level < 3) assert.equal(c.cards, null);
      else {
        assert.equal(new Set(c.cards).size, 3);
        assert.equal(c.cards.filter((w) => w === c.weather).length, 1);
        assert.ok(c.cards.every((w) => WEATHER_CARDS.includes(w)));
      }
    }
  }
});

test('thời tiết chia đều: chọn tình huống ít gặp nhất theo seen weather:*', () => {
  const seen = { 'weather:hot': 3, 'weather:cold': 3, 'weather:rainy': 1 };
  for (let i = 0; i < 50; i++) assert.equal(planRound(2, { rng: seeded(i + 1), seen }).cases.find((c) => c.kind === 'weather').weather, 'rainy');
});

test('B / C luân phiên ở mức 2–3 theo rounds', () => {
  for (const level of [2, 3]) {
    assert.ok(planRound(level, { rounds: 0 }).cases.some((c) => c.kind === 'eggs'));
    assert.ok(planRound(level, { rounds: 1 }).cases.some((c) => c.kind === 'pick'));
  }
});

test('Good night (SPEC-jobs4 2.2): 3 con khác nhau, khác tiếng, ưu tiên con đã gặp trong lượt; mức 1 không gọi, mức 2–3 gọi đủ 3', () => {
  for (const level of [1, 2, 3]) {
    const rng = seeded(level * 17);
    for (let i = 0; i < 500; i++) {
      const { cases, night } = planRound(level, { rng });
      assert.ok(nightOk(night, level));
      for (const c of cases.filter((x) => x.animal)) assert.ok(night.animals.includes(c.animal), 'con đã gặp trong lượt ra sân');
    }
  }
  assert.equal(nightOk({ animals: ['cow', 'cow', 'pig'], calls: null }, 1), false);
});

test('câu ca D và Good night: không rỗng, đúng mẫu', () => {
  assert.deepEqual(weatherLine('cold'), ["It's cold!", 'Trời lạnh quá!']);
  assert.equal(helpAskLine('hot')[0], 'Water, please!');
  assert.equal(helpAskLine('rainy')[0], 'Go inside, please!');
  assert.equal(helpAnimalLine('cow')[0], 'Help the cow!');
  assert.equal(helpWrongLine('hot', 'blanket')[0], "That's the blanket. It's hot! Water, please!");
  assert.equal(weatherYesLine('rainy')[0], "Yes! It's rainy!");
  assert.equal(weatherCardWrongLine('sunny', 'cold')[0], "That's sunny. Look at the snow!");
  assert.equal(nightCallLine('cow', 2)[0], 'Cow, go in!');
  assert.equal(nightCallLine('cow', 3)[0], 'Who says moo? Go in!');
  assert.equal(nightCallLine('duck', 3)[0], 'Who says quack? Go in!');
  assert.equal(nightWrongLine('pig', 'cow', 2)[0], "That's the pig. Cow, go in!");
  for (const w of WEATHERS) for (const item of HELP_ORDER) assert.ok(!/undefined/.test(helpWrongLine(w, item).join(' ')));
  for (const a of FARM_ANIMALS) for (const lv of [2, 3]) assert.ok(!/undefined/.test(nightCallLine(a.id, lv).join(' ')));
});
