// 👷 Thợ xây (SPEC-jobs3.md mục 6, SPEC-jobs4.md mục 4): kế hoạch lượt thỏa bất biến (500 seed mỗi mức), hình mới chỉ khi đã
// chơi Đếm hình mới; ca C sơn nhà của ca A, ca D xây tháp (mẫu AB / AAB), B / D luân phiên.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  planRound, fallbackPlan, caseOk, caseActions, pieceFits, SHAPES, playedShapes2,
  partAskLine, partDoneLine, pieceWrongLine, holeAskLine, blockWrongLine,
  paintOk, towerOk, towerWant, bucketsOf, roadOrTower, makeTowerCase,
  paintColorLine, paintAskLine, bucketWrongLine, partWrongLine, towerAskLine, blockColorWrongLine, patternLine,
} from '../../app/js/jobs/build.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const isNew = (shape) => SHAPES[shape].set === 2;

test('500 seed mỗi mức (có / chưa chơi Đếm hình mới): A + (B / D) + C (JOBS4-19), bất biến, ≤ 5 thao tác con', () => {
  for (const shapes2 of [false, true]) {
    for (const level of [1, 2, 3]) {
      const rng = seeded(level * 3 + (shapes2 ? 1 : 0));
      let sawNew = false;
      for (let i = 0; i < 500; i++) {
        const rounds = i % 2;
        const { cases, customers } = planRound(level, { rng, shapes2, rounds });
        assert.deepEqual(cases.map((c) => c.kind), ['house', rounds === 0 ? 'road' : 'tower', 'paint']);
        assert.equal(customers[2], customers[0], 'ca sơn nhà cùng bạn thú với ca xây nhà');
        assert.ok(paintOk(cases[2], cases[0], level), JSON.stringify(cases[2]));
        for (const c of cases) {
          if (c.kind !== 'paint') assert.ok(caseOk(c, level, { shapes2 }), `mức ${level}: ${JSON.stringify(c)}`);
          assert.ok(caseActions(c) <= 5);
          if (c.kind === 'paint' || c.kind === 'tower') continue;
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
  for (const level of [1, 2, 3]) {
    for (const rounds of [0, 1]) {
      const f = fallbackPlan(level, rounds);
      for (const c of f.cases) if (c.kind !== 'paint') assert.ok(caseOk(c, level), `${level} ${c.kind}`);
      assert.ok(paintOk(f.cases[2], f.cases[0], level));
    }
  }
});

test('ca C sơn nhà: màu gọi khác màu hiện tại, chỉ hỏi phần có trong nhà, mức 3 nhà có 2 cửa sổ to / nhỏ và có hỏi cửa sổ', () => {
  for (const level of [1, 2, 3]) {
    const rng = seeded(level * 41);
    for (let i = 0; i < 500; i++) {
      const [house, , paint] = planRound(level, { rng }).cases;
      const partOf = (id) => house.parts.find((p) => p.id === id);
      assert.equal(paint.asks.length, level <= 1 ? 3 : 2);
      paint.asks.forEach((a, k) => {
        assert.ok(partOf(a.id));
        assert.notEqual(a.color, partOf(a.id).color);
        assert.ok(bucketsOf(paint, k).includes(a.color));
        assert.equal(bucketsOf(paint, k).length, level <= 1 ? 3 : 4);
      });
      if (level >= 3) {
        const wins = house.parts.filter((p) => p.part === 'window');
        assert.deepEqual(wins.map((w) => w.size).sort(), ['big', 'small']);
        assert.ok(paint.asks.some((a) => partOf(a.id).part === 'window'));
      }
    }
  }
});

test('ca D xây tháp: mức 1 một màu 1–3; mức 2 đủ khối đúng màu + màu kia; mức 3 mẫu AB có sẵn 4, AAB có sẵn 3 (JOBS4-30)', () => {
  for (const level of [1, 2, 3]) {
    const rng = seeded(level * 13);
    const seenPatterns = new Set();
    for (let i = 0; i < 500; i++) {
      const c = makeTowerCase(level, { rng });
      assert.ok(towerOk(c, level), JSON.stringify(c));
      if (level >= 3) {
        seenPatterns.add(c.pattern);
        assert.equal(c.base.length, c.pattern === 'AB' ? 4 : 3);
        if (c.pattern === 'AAB') assert.deepEqual(c.next, [c.base[0], c.base[0]]);
        else assert.deepEqual(c.next, [c.base[0], c.base[1]]);
        assert.equal(towerWant(c, 0), c.next[0]);
        assert.equal(towerWant(c, 1), c.next[1]);
      }
    }
    if (level >= 3) assert.deepEqual([...seenPatterns].sort(), ['AAB', 'AB']);
  }
  assert.equal(roadOrTower(0), 'road');
  assert.equal(roadOrTower(1), 'tower');
});

test('câu ca C, ca D', () => {
  const win = { part: 'window', size: 'small' };
  const door = { part: 'door', size: 'small' };
  assert.equal(paintColorLine('red')[0], 'Red, please!');
  assert.equal(paintAskLine(door, 'blue', 2)[0], 'Paint the door blue!');
  assert.equal(paintAskLine(win, 'yellow', 3)[0], 'Paint the small window yellow!');
  assert.equal(paintAskLine({ part: 'roof' }, 'green', 3, true)[0], 'Now paint the roof green!');
  assert.equal(bucketWrongLine('yellow', 'blue')[0], "That's yellow. Blue, please!");
  assert.equal(partWrongLine({ part: 'wall' }, door, 2)[0], "That's the wall. The door, please!");
  assert.equal(partWrongLine({ part: 'window', size: 'big' }, win, 3)[0], "That's the big window. The small window, please!");
  assert.equal(towerAskLine({ n: 3, piles: ['red'], color: 'red', next: null })[0], 'Three blocks, please!');
  assert.equal(towerAskLine({ n: 1, piles: ['red'], color: 'red', next: null })[0], 'One block, please!');
  assert.equal(towerAskLine({ n: 4, piles: ['yellow', 'blue'], color: 'yellow', next: null })[0], 'Four yellow blocks, please!');
  assert.equal(towerAskLine({ n: 2, next: ['red', 'blue'] })[0], 'What comes next?');
  assert.equal(blockColorWrongLine('blue', 'yellow')[0], "That's a blue block. Yellow blocks, please!");
  assert.equal(patternLine(['red', 'red', 'blue', 'red'])[0], 'Red, red, blue, red!');
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
