// Lính cứu hỏa (SPEC-jobs.md mục 7): số lửa theo mức, ca trên cây, thẻ số (JOBS-08), câu số ít / nhiều (JOBS-07).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  planRound, numberChoices, allGoneLine, rightNumberLine, countLine, whereLine, firstLine, wrongNumberLine,
  FIRE_GEAR_FRAMES, FIRE_GEAR_PROMPT, GEAR_ANCHOR, pickRescue, SAFETY_ITEMS, SAFETY_BY, planSafety, lookLine, safetyRightLine, safetyWrongLine, wrongKeyLine, GEAR, ODD_GEAR, HOUSE_COLORS, planGear, planStreet, putOnLine, gearOnLine, wrongGearLine, goToLine, wrongHouseLine, READY_LINE, DRESS_ANY_LINE, GO_LINE,
} from '../../app/js/jobs/fire.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

test('một lượt: 3 ca, bạn thú khác nhau; mức 1 không có ca cây, 1–3 lửa; mức 2 đúng một ca cứu (cây / trong nhà), 2–5 lửa + thẻ số; mức 3 ba lửa mái / cửa sổ / cửa + thứ tự gọi', () => {
  const rng = seeded(5);
  for (const level of [1, 2, 3]) for (let i = 0; i < 80; i++) {
    const { cases } = planRound(level, { rng });
    assert.equal(cases.length, 3);
    assert.equal(new Set(cases.map((c) => c.resident)).size, 3);
    assert.equal(cases.filter((c) => c.kind === 'tree' || c.kind === 'house').length, level >= 2 ? 1 : 0); // ca cứu (SPEC-fire2 FF2)
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
      if (c.kind === 'tree' || c.kind === 'safety') assert.equal(c.house, undefined);
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

test('SPEC-fire2 FF2 — ca cứu: mức 1 không có; mức 2–3 đúng một ca cứu (cây hoặc trong nhà), ưu tiên loại ít gặp; ca trong nhà có nhà để lái xe tới, không có lửa', () => {
  const rng = seeded(11);
  assert.equal(pickRescue({ tree: 3, house: 1 }, rng), 'house');
  assert.equal(pickRescue({ tree: 0, house: 2 }, rng), 'tree');
  const tie = new Set(Array.from({ length: 40 }, () => pickRescue({}, rng)));
  assert.deepEqual([...tie].sort(), ['house', 'tree']);
  for (const level of [1, 2, 3]) for (let i = 0; i < 40; i++) {
    const { cases } = planRound(level, { rng, seen: { tree: 9 } });
    const rescue = cases.filter((c) => c.kind === 'tree' || c.kind === 'house');
    assert.equal(rescue.length, level >= 2 ? 1 : 0);
    if (level >= 2) {
      assert.equal(rescue[0].kind, 'house');
      assert.ok(rescue[0].house.street.includes(rescue[0].house.color));
      assert.equal(rescue[0].fires, undefined);
    }
  }
});

test('SPEC-fire2 FF3 — lượt: mức 1 = 2 dập lửa + An toàn; mức 2–3 = 1 dập lửa + 1 cứu + An toàn; An toàn luôn cuối, chỉ một; mức 3 có bấm 114', () => {
  const rng = seeded(21);
  for (const level of [1, 2, 3]) for (let i = 0; i < 60; i++) {
    const { cases } = planRound(level, { rng });
    assert.equal(cases.length, 3);
    assert.equal(cases[2].kind, 'safety');
    assert.equal(cases.filter((c) => c.kind === 'safety').length, 1);
    assert.equal(cases[2].dial, level >= 3);
    const kinds = cases.slice(0, 2).map((c) => c.kind).sort();
    if (level === 1) assert.deepEqual(kinds, ['fire', 'fire']);
    else assert.ok(kinds.includes('fire') && (kinds.includes('tree') || kinds.includes('house')), kinds.join());
    assert.equal(new Set(cases.slice(0, 2).map((c) => c.resident)).size, 2);
  }
});

test('SPEC-fire2 FF3 — đồ An toàn: 2 nóng + 1 an toàn, không lặp; câu gọi đúng tên đồ, không có chỗ trống', () => {
  const rng = seeded(8);
  for (let i = 0; i < 60; i++) {
    const items = planSafety({ rng });
    assert.equal(items.length, 3);
    assert.equal(new Set(items).size, 3);
    assert.equal(items.filter((id) => SAFETY_BY.get(id).hot).length, 2);
  }
  assert.equal(lookLine('candle')[0], 'Look! A candle. Can we touch it?');
  assert.equal(lookLine('apple')[0], 'Look! An apple. Can we touch it?');
  assert.equal(safetyRightLine('pan')[0], "That's right! The pan is hot. Don't touch!");
  assert.equal(safetyRightLine('teddy')[0], 'Yes! You can touch the teddy!');
  assert.equal(safetyWrongLine('tea')[0], "Oh no! The tea is hot. Don't touch!");
  assert.equal(safetyWrongLine('ball')[0], "It's okay! You can touch the ball!");
  assert.equal(wrongKeyLine(5, 1)[0], "That's five. Press one!");
  for (const x of SAFETY_ITEMS) for (const [en, vi] of [lookLine(x.id), safetyRightLine(x.id), safetyWrongLine(x.id)]) {
    assert.ok(en && vi && !/undefined/.test(en + vi), en);
  }
});

test('SPEC-art ART2 — ảnh lưới chú lính cứu hỏa: 6 ô đúng thứ tự prompt; chỗ dán mũ / áo / ủng nằm trong khung, từ trên xuống', () => {
  assert.deepEqual(FIRE_GEAR_FRAMES, ['plain', 'full', 'helmet', 'jacket', 'boots', 'spray']);
  assert.ok(FIRE_GEAR_PROMPT.includes('3x2 grid'));
  for (const [i, line] of ['1)', '2)', '3)', '4)', '5)', '6)'].entries()) assert.ok(FIRE_GEAR_PROMPT.includes(line), FIRE_GEAR_FRAMES[i]);
  for (const a of Object.values(GEAR_ANCHOR)) assert.ok(a.left >= 0 && a.left + a.width <= 100 && a.top >= 0 && a.top < 100);
  assert.ok(GEAR_ANCHOR.helmet.top < GEAR_ANCHOR.jacket.top && GEAR_ANCHOR.jacket.top < GEAR_ANCHOR.boots.top);
});
