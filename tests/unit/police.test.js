// Cảnh sát giúp bạn (SPEC-jobs.md mục 6): mỗi yêu cầu khớp đúng một đồ / bạn; câu nói.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FRIEND_LOOK, planRound, makeToyCase, matches, lostLine, describeLine, foundLine, wrongLine,
  makeTrafficCase, makeItLine, lightRightLine, lightWrongLine, TRAFFIC_STEPS, CROSS_STEPS, crossStepLine,
  makeFriendCase, CLOTHES_COLORS,
} from '../../app/js/jobs/police.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
/** Lượt như trước SPEC-jobs4 (không có ca ngã tư) — cho các test thành phần lượt cũ. */
function planOld(level, opts) {
  globalThis.__kidTest = { policeJunctionAt: -1 };
  try {
    return planRound(level, opts);
  } finally {
    delete globalThis.__kidTest;
  }
}

test('một lượt: 3 ca, người hỏi khác nhau, hai ca liền nhau không cùng loại đồ; mức 3 đúng một ca tìm bạn; mọi ca có đúng một đáp án', () => {
  const rng = seeded(6);
  for (const level of [1, 2, 3]) for (let i = 0; i < 80; i++) {
    const { cases } = planOld(level, { rng });
    assert.equal(cases.length, 3);
    assert.equal(new Set(cases.map((c) => c.asker)).size, 3);
    assert.equal(cases.filter((c) => c.kind === 'friend').length, level >= 3 ? 1 : 0);
    assert.equal(cases.filter((c) => c.kind === 'traffic').length, 1);
    const toys = cases.filter((c) => c.kind === 'toy');
    for (let k = 1; k < cases.length; k++) {
      if (cases[k].kind === 'toy' && cases[k - 1].kind === 'toy') assert.notEqual(cases[k].toy, cases[k - 1].toy);
    }
    for (const c of cases.filter((x) => x.kind !== 'traffic' && x.kind !== 'cross')) {
      assert.equal(matches(c, level).length, 1, `mức ${level}: ${JSON.stringify(c)}`);
      if (c.kind === 'friend') assert.ok(!c.items.some((x) => x.friend === c.asker));
    }
    for (const c of toys) {
      if (level === 1) assert.equal(c.items.length, 3);
      else {
        assert.equal(c.items.length, 4);
        assert.equal(new Set(c.items.map((x) => `${x.color}:${x.size}`)).size, 4);
      }
      if (level >= 3) assert.ok(c.items.find((x) => x.id === c.target).hidden);
      else assert.ok(c.items.every((x) => !x.hidden));
    }
  }
  assert.equal(new Set(Object.values(FRIEND_LOOK).map((f) => `${f.size}:${f.color}`)).size, 4);
});

test('câu: mất đồ, mô tả theo mức, tìm thấy, chạm nhầm; tìm bạn bị lạc', () => {
  const c1 = { kind: 'toy', toy: 'ball', items: [{ id: 't0', color: 'red', size: 'big' }, { id: 't1', color: 'blue', size: 'big' }], target: 't0' };
  assert.equal(lostLine(c1)[0], 'Oh no! I lost my ball!');
  assert.equal(describeLine(c1, 1)[0], "It's red!");
  assert.equal(wrongLine(c1, 't1', 1)[0], 'Hmm, that ball is blue. Mine is red!');
  assert.equal(foundLine(c1)[0], 'My ball! Thank you, officer!');
  const c2 = { ...c1, items: [{ id: 't0', color: 'red', size: 'big' }, { id: 't1', color: 'red', size: 'small' }] };
  assert.equal(describeLine(c2, 2)[0], "It's big and red!");
  assert.equal(wrongLine(c2, 't1', 2)[0], 'Hmm, that ball is small and red. Mine is big and red!');
  const f = { kind: 'friend', asker: 'kitty', items: [{ id: 'f0', friend: 'teddy' }, { id: 'f1', friend: 'puppy' }], target: 'f0' };
  assert.equal(lostLine(f)[0], 'Oh no! I lost my friend!');
  assert.equal(describeLine(f, 3)[0], "He's big and brown!");
  assert.equal(wrongLine(f, 'f1', 3)[0], "That's Puppy! My friend is big and brown!");
  assert.equal(foundLine(f)[0], 'There you are! Thank you, officer!');
  for (let i = 0; i < 30; i++) {
    const c = makeToyCase(3, { rng: seeded(i + 2) });
    for (const x of c.items) for (const [en, vi] of [describeLine(c, 3), wrongLine(c, x.id, 3)]) assert.ok(en && vi && !/undefined/.test(en + vi), en);
  }
});

test('SPEC-jobs2 PL1 — ca đèn giao thông: 3 lượt; mức 1 xanh / đỏ xen kẽ; mức 2 có cả bạn qua đường (đỏ) và vạch trống (xanh); mức 3 thêm một lượt vàng', () => {
  const rng = seeded(17);
  for (let i = 0; i < 60; i++) {
    const s1 = makeTrafficCase(1, { rng }).steps;
    assert.equal(s1.length, TRAFFIC_STEPS);
    assert.ok(s1.every((s) => ['green', 'red'].includes(s.want) && !s.crossing));
    assert.notEqual(s1[0].want, s1[1].want);
    assert.notEqual(s1[1].want, s1[2].want);
    const s2 = makeTrafficCase(2, { rng }).steps;
    assert.ok(s2.some((s) => s.crossing) && s2.some((s) => !s.crossing));
    assert.ok(s2.every((s) => s.want === (s.crossing ? 'red' : 'green')));
    const s3 = makeTrafficCase(3, { rng }).steps;
    assert.equal(s3.filter((s) => s.want === 'yellow').length, 1);
    assert.ok(s3.some((s) => s.want === 'red' && s.crossing));
    assert.ok(s3.some((s) => s.want === 'green' && !s.crossing));
  }
  assert.equal(makeItLine('green')[0], 'Make it green!');
  assert.equal(lightRightLine({ want: 'green' })[0], 'Green — go!');
  assert.equal(lightRightLine({ want: 'red', crossing: true })[0], 'Red — stop! A friend is crossing.');
  assert.equal(lightWrongLine({ want: 'red', crossing: true }, 'green', 2)[0], 'Wait! A friend is crossing!');
  assert.equal(lightWrongLine({ want: 'green', crossing: false }, 'red', 2)[0], 'The road is clear. Make it green!');
  assert.equal(lightWrongLine({ want: 'red' }, 'green', 1)[0], "That's green. Make it red!");
});

test('SPEC-jobs2 PL2a — ca giúp bạn qua đường: mức 1 không có; mức 2–3 đúng một ca; mức 3 = tìm bạn + đèn + qua đường; thứ tự bước cố định', () => {
  const rng = seeded(19);
  for (const level of [1, 2, 3]) for (let i = 0; i < 60; i++) {
    const { cases } = planOld(level, { rng });
    assert.equal(cases.filter((c) => c.kind === 'cross').length, level >= 2 ? 1 : 0);
    assert.equal(cases.filter((c) => c.kind === 'traffic').length, 1);
    if (level >= 3) assert.deepEqual(new Set(cases.map((c) => c.kind)), new Set(['friend', 'traffic', 'cross']));
  }
  assert.deepEqual(CROSS_STEPS, ['look-left', 'look-right', 'press', 'check', 'go']);
  assert.equal(crossStepLine('look-left')[0], 'Stop! Look left!');
  assert.equal(crossStepLine('press')[0], 'Press the button. Wait for the green light!');
  assert.equal(crossStepLine('go')[0], "All clear! Let's cross together!");
});

test('SPEC-jobs2 PL2b — bạn bị lạc theo quần áo: đúng một bạn khớp cả mũ + giày, một bạn cùng mũ khác giày, một bạn cùng giày khác mũ; câu trung tính; câu nhầm nói món khác đầu tiên', () => {
  const rng = seeded(53);
  for (let i = 0; i < 80; i++) {
    const c = makeFriendCase('teddy', { rng });
    const t = c.items.find((x) => x.id === c.target);
    assert.equal(c.items.length, 3);
    assert.ok(c.items.every((x) => CLOTHES_COLORS.includes(x.hat) && CLOTHES_COLORS.includes(x.shoes)));
    assert.equal(matches(c, 3).length, 1);
    const others = c.items.filter((x) => x.id !== c.target);
    assert.ok(others.some((x) => x.hat === t.hat && x.shoes !== t.shoes));
    assert.ok(others.some((x) => x.shoes === t.shoes && x.hat !== t.hat));
  }
  const c = {
    kind: 'friend', asker: 'teddy', target: 'f0',
    items: [{ id: 'f0', friend: 'kitty', hat: 'red', shoes: 'blue' }, { id: 'f1', friend: 'puppy', hat: 'green', shoes: 'blue' }, { id: 'f2', friend: 'piggy', hat: 'red', shoes: 'yellow' }],
  };
  assert.equal(describeLine(c, 3)[0], 'My friend has a red hat and blue shoes.');
  assert.ok(!/\b(he|she)\b/i.test(describeLine(c, 3)[0]));
  assert.equal(wrongLine(c, 'f1', 3)[0], 'That friend has a green hat. My friend has a red hat!');
  assert.equal(wrongLine(c, 'f2', 3)[0], 'That friend has yellow shoes. My friend has blue shoes!');
});

// ---------- SPEC-jobs4 mục 10 (PL3): điều khiển ngã tư ----------
test('PL3 — 500 seed mỗi mức: đúng một ca ngã tư mỗi lượt (mức 1–2 thay ca tìm đồ; mức 3 lượt chẵn thay ca tìm bạn, lượt lẻ thay ca qua đường); lượt vẫn 3 ca, vẫn có ca đèn', async () => {
  for (const level of [1, 2, 3]) {
    const rng = seeded(1000 + level);
    for (let i = 0; i < 500; i++) {
      const rounds = i % 3;
      const kinds = planRound(level, { rng, rounds }).cases.map((c) => c.kind);
      assert.equal(kinds.length, 3);
      assert.equal(kinds.filter((k) => k === 'junction').length, 1);
      assert.equal(kinds.filter((k) => k === 'traffic').length, 1);
      if (level === 1) assert.equal(kinds.filter((k) => k === 'toy').length, 1);
      if (level === 2) assert.deepEqual(kinds.filter((k) => k !== 'junction').sort(), ['cross', 'traffic']);
      if (level === 3) assert.deepEqual(kinds.filter((k) => k !== 'junction').sort(), (rounds % 2 === 0 ? ['cross', 'traffic'] : ['friend', 'traffic']));
    }
  }
});

test('PL3 — ca ngã tư 500 seed mỗi mức: xe theo mức; mỗi lệnh khớp đúng một xe ở đúng trạng thái; xe đã đi không gọi lại; mức 3 Go → Stop (xe đạp) → Go → Go (xe đạp)', async () => {
  const { makeJunctionCase, junctionStates, junctionMatches, ARMS } = await import('../../app/js/jobs/police.js');
  for (const level of [1, 2, 3]) {
    const rng = seeded(1100 + level);
    for (let i = 0; i < 500; i++) {
      const c = makeJunctionCase(level, { rng });
      const main = c.vehicles.filter((v) => !v.extra);
      assert.equal(main.length, level <= 1 ? 3 : 4);
      assert.equal(new Set(main.map((v) => v.arm)).size, main.length);
      assert.ok(main.every((v) => ARMS.includes(v.arm)));
      if (level <= 1) assert.deepEqual(main.map((v) => v.type).sort(), ['bike', 'bus', 'car']);
      else {
        assert.equal(new Set(main.map((v) => `${v.type}:${v.color}`)).size, 4);
        assert.equal(new Set(main.map((v) => v.type)).size, 2);
        assert.equal(new Set(main.map((v) => v.color)).size, 2);
      }
      if (level >= 3) {
        assert.ok(main.every((v) => v.type !== 'bike'));
        assert.deepEqual(c.orders.map((o) => o.cmd), ['go', 'stop', 'go', 'go']);
        const bike = c.vehicles.find((v) => v.extra);
        assert.equal(bike.type, 'bike');
        assert.equal(c.orders[1].id, bike.id);
        assert.equal(c.orders[3].id, bike.id);
        assert.equal(bike.arm, main.find((v) => v.id === c.orders[0].id).arm, 'xe đạp đi tới từ ngả xe vừa đi');
        assert.equal(junctionStates(c, 0)[bike.id], 'hidden');
        assert.equal(junctionStates(c, 1)[bike.id], 'coming');
        assert.equal(junctionStates(c, 2)[bike.id], 'stopped');
        assert.equal(junctionStates(c, 3)[bike.id], 'stopped');
      } else assert.ok(c.orders.every((o) => o.cmd === 'go'));
      assert.equal(c.orders.length, level >= 3 ? 4 : 3);
      const gone = new Set();
      c.orders.forEach((o, k) => {
        assert.deepEqual(junctionMatches(c, k, level).map((v) => v.id), [o.id], `mức ${level} lệnh ${k}`);
        assert.ok(!gone.has(o.id));
        if (o.cmd === 'go') gone.add(o.id);
      });
    }
  }
});

test('PL3 — câu: "The bus, go!" / "The red car, go!" / "The bike, stop!" / "Now the blue bus, go!"; nhầm "That\'s the blue car. The red car, go!"', async () => {
  const m = await import('../../app/js/jobs/police.js');
  const bus = { id: 'v0', type: 'bus', color: 'yellow' };
  const redCar = { id: 'v1', type: 'car', color: 'red' };
  const blueCar = { id: 'v2', type: 'car', color: 'blue' };
  const bike = { id: 'v4', type: 'bike', color: 'green', extra: true };
  assert.equal(m.orderLine({ cmd: 'go' }, bus, 1)[0], 'The bus, go!');
  assert.equal(m.orderLine({ cmd: 'go' }, redCar, 2)[0], 'The red car, go!');
  assert.equal(m.orderLine({ cmd: 'stop' }, bike, 3)[0], 'The bike, stop!');
  assert.equal(m.orderLine({ cmd: 'go' }, { ...bus, color: 'blue' }, 3, true)[0], 'Now the blue bus, go!');
  assert.equal(m.junctionWrongLine(blueCar, { cmd: 'go' }, redCar, 2)[0], "That's the blue car. The red car, go!");
  assert.equal(m.junctionWrongLine(redCar, { cmd: 'stop' }, bike, 3)[0], "That's the red car. The bike, stop!");
  for (const v of [bus, redCar, bike]) for (const lv of [1, 2, 3]) for (const cmd of ['go', 'stop']) {
    const [en, vi] = m.orderLine({ cmd }, v, lv, lv === 3);
    assert.ok(en && vi && !/undefined/.test(en + vi), en);
  }
  assert.equal(m.HELP_CARS_LINE[0], "Let's help the cars!");
  assert.equal(m.BEEP_THANKS_LINE[0], 'Beep beep! Thank you!');
  assert.equal(m.JUNCTION_DONE_LINE[0], 'Good job, officer!');
});
