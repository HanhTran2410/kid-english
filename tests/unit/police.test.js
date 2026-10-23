// Cảnh sát giúp bạn (SPEC-jobs.md mục 6): mỗi yêu cầu khớp đúng một đồ / bạn; câu nói.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FRIEND_LOOK, planRound, makeToyCase, matches, lostLine, describeLine, foundLine, wrongLine } from '../../app/js/jobs/police.js';

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
    const toys = cases.filter((c) => c.kind === 'toy');
    for (let k = 1; k < cases.length; k++) {
      if (cases[k].kind === 'toy' && cases[k - 1].kind === 'toy') assert.notEqual(cases[k].toy, cases[k - 1].toy);
    }
    for (const c of cases) {
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
