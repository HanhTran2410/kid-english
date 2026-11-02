// 👷 Thợ xây (SPEC-jobs3.md mục 6): kế hoạch lượt thỏa bất biến (500 seed mỗi mức), hình mới chỉ khi đã chơi Đếm hình mới.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  planRound, fallbackPlan, caseOk, caseActions, pieceFits, SHAPES, playedShapes2,
  partAskLine, partDoneLine, pieceWrongLine, holeAskLine, blockWrongLine,
} from '../../app/js/jobs/build.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const isNew = (shape) => SHAPES[shape].set === 2;

test('500 seed mỗi mức (có / chưa chơi Đếm hình mới): A + B + A, bất biến, ≤ 5 thao tác con', () => {
  for (const shapes2 of [false, true]) {
    for (const level of [1, 2, 3]) {
      const rng = seeded(level * 3 + (shapes2 ? 1 : 0));
      let sawNew = false;
      for (let i = 0; i < 500; i++) {
        const { cases } = planRound(level, { rng, shapes2 });
        assert.deepEqual(cases.map((c) => c.kind), ['house', 'road', 'house']);
        for (const c of cases) {
          assert.ok(caseOk(c, level, { shapes2 }), `mức ${level}: ${JSON.stringify(c)}`);
          assert.ok(caseActions(c) <= 5);
          const shapes = c.kind === 'road' ? c.blocks : [...c.parts.map((p) => p.shape), ...(c.pieces ?? []).flat().map((p) => p.shape)];
          if (shapes.some(isNew)) sawNew = true;
          // JOBS3-09: chưa chơi Đếm hình mới thì không có hình thang / thoi / lục giác / nửa tròn / bình hành.
          if (!shapes2 || level < 3) assert.ok(!shapes.some(isNew), `mức ${level}: ${shapes}`);
        }
        const house = cases[0];
        if (level === 3) {
          const windows = house.parts.filter((p) => p.part === 'window');
          assert.equal(windows.length, 2);
          assert.deepEqual(house.steps.at(-1), windows.map((p) => p.id));
        }
      }
      assert.equal(sawNew, shapes2 && level === 3);
    }
  }
  for (const level of [1, 2, 3]) for (const c of fallbackPlan(level).cases) assert.ok(caseOk(c, level));
});

test('mức 2: đúng dáng sai màu không khớp; mức 3: đúng dáng sai cỡ không khớp', () => {
  const part = { shape: 'triangle', color: 'red', size: 'big' };
  assert.ok(pieceFits(1, part, { shape: 'triangle', color: 'blue', size: 'small' }));
  assert.ok(!pieceFits(2, part, { shape: 'triangle', color: 'blue', size: 'big' }));
  assert.ok(pieceFits(2, part, { shape: 'triangle', color: 'red', size: 'big' }));
  assert.ok(!pieceFits(3, part, { shape: 'triangle', color: 'red', size: 'small' }));
  assert.ok(!pieceFits(3, part, { shape: 'square', color: 'red', size: 'big' }));
});

test('câu nói theo mức; đã chơi Đếm hình mới', () => {
  const roof = { part: 'roof', shape: 'triangle', color: 'red', size: 'big' };
  assert.equal(partAskLine(1, [roof])[0], 'Triangle, please!');
  assert.equal(partAskLine(2, [roof])[0], 'A red triangle, please!');
  assert.equal(partAskLine(3, [roof])[0], 'A big triangle, please!');
  const w = { part: 'window', shape: 'square', color: 'blue', size: 'small' };
  assert.equal(partAskLine(3, [w, w])[0], 'Two square windows, please!');
  assert.equal(partDoneLine(roof)[0], 'A triangle! The roof!');
  assert.equal(partDoneLine(w, 2)[0], 'Two squares! The windows!');
  assert.equal(pieceWrongLine(1, [roof], { shape: 'circle', color: 'red', size: 'big' })[0], "That's a circle. Triangle, please!");
  assert.equal(pieceWrongLine(2, [roof], { shape: 'triangle', color: 'blue', size: 'big' })[0], "That's a blue triangle. A red triangle, please!");
  assert.equal(pieceWrongLine(3, [roof], { shape: 'triangle', color: 'red', size: 'small' })[0], "That's a small triangle. A big triangle, please!");
  assert.equal(holeAskLine('square')[0], 'Square, please!');
  assert.equal(blockWrongLine('circle', 'square')[0], "That's a circle. Square, please!");
  assert.equal(playedShapes2(null), false);
  assert.equal(playedShapes2({ level: 1, rounds: 0, seen: [] }), false);
  assert.equal(playedShapes2({ level: 1, rounds: 1, seen: [] }), true);
  assert.equal(playedShapes2({ level: 1, rounds: 0, seen: ['oval'] }), true);
});
