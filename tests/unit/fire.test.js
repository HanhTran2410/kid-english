// Lính cứu hỏa (SPEC-jobs.md mục 7): số lửa theo mức, ca trên cây, thẻ số (JOBS-08), câu số ít / nhiều (JOBS-07).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  planRound, numberChoices, allGoneLine, rightNumberLine, countLine, whereLine, firstLine, wrongNumberLine,
  GEAR, ODD_GEAR, HOUSE_COLORS, planGear, planStreet, putOnLine, gearOnLine, wrongGearLine, goToLine, wrongHouseLine, READY_LINE, DRESS_ANY_LINE, GO_LINE,
} from '../../app/js/jobs/fire.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

test('một lượt: 3 ca, bạn thú khác nhau; mức 1 không có ca cây, 1–3 lửa; mức 2 đúng một ca cây, 2–5 lửa + thẻ số; mức 3 ba lửa mái / cửa sổ / cửa + thứ tự gọi', () => {
  const rng = seeded(5);
  for (const level of [1, 2, 3]) for (let i = 0; i < 80; i++) {
    const { cases } = planRound(level, { rng });
    assert.equal(cases.length, 3);
    assert.equal(new Set(cases.map((c) => c.resident)).size, 3);
    assert.equal(cases.filter((c) => c.kind === 'tree').length, level >= 2 ? 1 : 0);
    for (const c of cases.filter((x) => x.kind === 'fire')) {
      const n = c.fires.length;
      assert.equal(new Set(c.fires.map((f) => f.spot)).size, n);
      if (level === 1) assert.ok(n >= 1 && n <= 3);
      if (level === 2) {
        assert.ok(n >= 2 && n <= 5);
        assert.equal(c.choices.filter((x) => x === n).length, 1);
      }
      if (level === 3) {
        assert.deepEqual(c.fires.map((f) => f.spot).sort(), ['door', 'roof', 'window']);
        assert.deepEqual([...c.order].sort(), c.fires.map((f) => f.id).sort());
      }
    }
  }
});

test('JOBS-08: thẻ số — 3 số khác nhau trong 1–5, đúng một thẻ là số lửa', () => {
  const rng = seeded(2);
  for (let n = 1; n <= 5; n++) for (let i = 0; i < 30; i++) {
    const c = numberChoices(n, { rng });
    assert.equal(c.length, 3);
    assert.equal(new Set(c).size, 3);
    assert.ok(c.every((x) => x >= 1 && x <= 5));
    assert.equal(c.filter((x) => x === n).length, 1);
  }
});

test('JOBS-07: câu theo số lửa thật — số ít / số nhiều; chỗ lửa mức 3', () => {
  assert.equal(allGoneLine(1)[0], 'One fire! All gone!');
  assert.equal(allGoneLine(2)[0], 'Two fires! All gone!');
  assert.equal(allGoneLine(3)[0], 'Three fires! All gone!');
  assert.equal(rightNumberLine(1)[0], 'Yes! One fire!');
  assert.equal(rightNumberLine(4)[0], 'Yes! Four fires!');
  assert.equal(countLine(5)[0], 'Five!');
  assert.equal(wrongNumberLine(4)[0], "That's four. Let's count again!");
  assert.equal(whereLine('roof')[0], 'The fire is on the roof!');
  assert.equal(whereLine('door')[0], 'The fire is by the door!');
  assert.equal(firstLine('window')[0], 'The fire in the window first!');
});

test('SPEC-fire2 FF1 — mặc đồ: mức 1 không món lạ; mức 2 Bông gọi theo thứ tự; mức 3 thêm đúng 1 món lạ trong khay', () => {
  const rng = seeded(9);
  for (const level of [1, 2, 3]) for (let i = 0; i < 40; i++) {
    const g = planGear(level, { rng });
    assert.deepEqual([...g.order].sort(), [...GEAR].sort());
    if (level === 1) assert.deepEqual(g.order, GEAR);
    assert.equal(g.odd, level >= 3 ? g.odd : null);
    if (level >= 3) assert.ok(ODD_GEAR.includes(g.odd));
    assert.deepEqual([...g.tray].sort(), [...GEAR, ...(g.odd ? [g.odd] : [])].sort());
  }
});

test('SPEC-fire2 FF1 — phố: 3 nhà khác màu, đúng một nhà của ca; ca dập lửa có nhà (khói ở mức 1–2), ca cây không có', () => {
  const rng = seeded(4);
  for (const color of HOUSE_COLORS) for (let i = 0; i < 20; i++) {
    const st = planStreet(color, { rng });
    assert.equal(st.length, 3);
    assert.equal(new Set(st).size, 3);
    assert.equal(st.filter((c) => c === color).length, 1);
    assert.ok(st.every((c) => HOUSE_COLORS.includes(c)));
  }
  for (const level of [1, 2, 3]) for (let i = 0; i < 30; i++) {
    const { gear, cases } = planRound(level, { rng });
    assert.ok(gear);
    for (const c of cases) {
      if (c.kind === 'tree') assert.equal(c.house, undefined);
      else {
        assert.ok(c.house.street.includes(c.house.color));
        assert.equal(c.house.smoke, level <= 2);
      }
    }
  }
});

test('SPEC-fire2 FF1 — câu nói: số ít / nhiều đúng, món lạ, đổi nhà; không có chỗ trống', () => {
  assert.deepEqual(putOnLine('helmet')[0], 'Put on your helmet!');
  assert.deepEqual(gearOnLine('boots')[0], 'Boots on!');
  assert.equal(wrongGearLine('jacket', 'helmet')[0], "That's the jacket. Helmet first!");
  assert.equal(wrongGearLine('boots', 'jacket')[0], 'Those are the boots. Jacket first!');
  assert.equal(wrongGearLine('swimsuit', 'boots')[0], 'Not the swimsuit! We need the boots!');
  assert.equal(wrongGearLine('flipflops', 'helmet')[0], 'Not the flip-flops! We need the helmet!');
  assert.equal(goToLine('red')[0], 'Nee-naw! Go to the red house!');
  assert.equal(wrongHouseLine('blue', 'red')[0], "That's the blue house. Go to the red house!");
  const all = [READY_LINE, DRESS_ANY_LINE, GO_LINE, ...GEAR.flatMap((g) => [putOnLine(g), gearOnLine(g)]),
    ...HOUSE_COLORS.flatMap((c) => [goToLine(c), wrongHouseLine(HOUSE_COLORS.find((x) => x !== c), c)])];
  for (const [en, vi] of all) assert.ok(en && vi && !/undefined|\{/.test(en + vi), en);
});
