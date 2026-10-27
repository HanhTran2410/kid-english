// Cảnh sát giúp bạn (SPEC-jobs.md mục 6): mỗi yêu cầu khớp đúng một đồ / bạn; câu nói.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FRIEND_LOOK, planRound, makeToyCase, matches, lostLine, describeLine, foundLine, wrongLine,
  makeTrafficCase, makeItLine, lightRightLine, lightWrongLine, TRAFFIC_STEPS, CROSS_STEPS, crossStepLine,
} from '../../app/js/jobs/police.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

test('một lượt: 3 ca, người hỏi khác nhau, hai ca liền nhau không cùng loại đồ; mức 3 đúng một ca tìm bạn; mọi ca có đúng một đáp án', () => {
  const rng = seeded(6);
  for (const level of [1, 2, 3]) for (let i = 0; i < 80; i++) {
    const { cases } = planRound(level, { rng });
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
    const { cases } = planRound(level, { rng });
    assert.equal(cases.filter((c) => c.kind === 'cross').length, level >= 2 ? 1 : 0);
    assert.equal(cases.filter((c) => c.kind === 'traffic').length, 1);
    if (level >= 3) assert.deepEqual(new Set(cases.map((c) => c.kind)), new Set(['friend', 'traffic', 'cross']));
  }
  assert.deepEqual(CROSS_STEPS, ['look-left', 'look-right', 'press', 'check', 'go']);
  assert.equal(crossStepLine('look-left')[0], 'Stop! Look left!');
  assert.equal(crossStepLine('press')[0], 'Press the button. Wait for the green light!');
  assert.equal(crossStepLine('go')[0], "All clear! Let's cross together!");
});
