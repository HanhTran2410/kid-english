// 🚌 Bác tài xe buýt (SPEC-jobs3.md mục 7): kế hoạch tuyến thỏa bất biến (500 seed mỗi mức), máy trạng thái hành khách.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  planRound, planOk, fallbackPlan, alightAt, boardAt, ridersAt, stopActions, MEMBERS, END, MAX_RIDERS,
  initialStates, board, alight, riding, pickUpLine, myStopLine, stopWrongLine, notMeLine,
} from '../../app/js/jobs/bus.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

test('500 seed mỗi mức: mỗi người một trạm lên / một trạm xuống, mỗi trạm ≤ 1 người xuống, ≤ 3 người trên xe, mô tả khớp đúng một người', () => {
  for (const level of [1, 2, 3]) {
    const rng = seeded(level * 5);
    for (let i = 0; i < 500; i++) {
      const plan = planRound(level, { rng });
      assert.ok(planOk(plan, level), `mức ${level}: ${JSON.stringify(plan)}`);
      for (let k = 1; k <= 3; k++) {
        assert.ok(alightAt(plan, k).length <= 1);
        assert.ok(ridersAt(plan, k) + boardAt(plan, k).length <= MAX_RIDERS);
        assert.ok(stopActions(plan, level, k) <= 5);
        if (level !== 2) assert.equal(boardAt(plan, k).length, 1);
      }
      if (level === 1) assert.ok(plan.passengers.every((p) => p.alightStop === END));
      else {
        assert.equal(alightAt(plan, 2).length, 1);
        assert.equal(alightAt(plan, 3).length, 1);
        assert.ok(plan.passengers.every((p) => p.alightStop === END || !MEMBERS[p.member].baby), 'em bé không tự nói "My stop"');
      }
      assert.equal(plan.lightBefore != null, level >= 3);
      assert.ok(!plan.stops.includes(plan.mapExtra));
    }
  }
  for (const level of [1, 2, 3]) assert.ok(planOk(fallbackPlan(level), level));
  // Không phải lúc nào cũng rơi về kế hoạch cố định.
  for (const level of [1, 2, 3]) {
    const rng = seeded(level + 40);
    const plans = Array.from({ length: 60 }, () => JSON.stringify(planRound(level, { rng })));
    assert.ok(new Set(plans).size > 40, `mức ${level}: quá nhiều kế hoạch trùng`);
    assert.ok(!plans.includes(JSON.stringify(fallbackPlan(level))) || new Set(plans).size > 50);
  }
});

test('máy trạng thái: waiting → riding (đúng trạm) → off (đúng trạm xuống / bến cuối); JOBS3-17 người kia vẫn trên xe', () => {
  const plan = fallbackPlan(2);
  let st = initialStates(plan);
  st = board(st, plan, 'p1', 1, 'child'); // sai trạm: không đổi
  assert.equal(st.p1.state, 'waiting');
  st = board(st, plan, 'p0', 1, 'child');
  st = board(st, plan, 'p0', 1, 'child'); // chạm lại: không đổi
  assert.deepEqual(st.p0, { state: 'riding', by: 'child' });
  st = board(st, plan, 'p1', 2, 'auto'); // JOBS3-18: tự lên — ghi rõ 'auto'
  assert.deepEqual(st.p1, { state: 'riding', by: 'auto' });
  st = alight(st, plan, 2);
  assert.equal(st.p0.state, 'off');
  assert.equal(st.p1.state, 'riding');
  assert.deepEqual(riding(st), ['p1']);
  st = alight(st, plan, END);
  assert.equal(riding(st).length, 0);
});

test('câu nói', () => {
  const g = { member: 'grandma', mood: 'happy' };
  assert.equal(pickUpLine(g, 1)[0], 'Pick up Grandma!');
  assert.equal(pickUpLine({ member: 'baby', mood: 'happy' }, 2, true)[0], 'Now pick up Baby!');
  assert.equal(pickUpLine({ member: 'baby', mood: 'sleepy' }, 3)[0], 'Pick up the sleepy baby!');
  assert.equal(pickUpLine({ member: 'grandpa', mood: 'sad' }, 3)[0], 'Pick up the sad grandpa!');
  assert.equal(myStopLine('yellow')[0], 'My stop, please! The yellow stop!');
  assert.equal(stopWrongLine('blue', 'yellow')[0], "That's the blue stop. The yellow stop, please!");
  assert.equal(notMeLine({ member: 'grandpa', mood: 'happy' }, 1)[0], "Not me! I'm Grandpa!");
  assert.equal(notMeLine({ member: 'baby', mood: 'happy' }, 1)[0], 'Goo-goo!');
  assert.equal(notMeLine({ member: 'baby', mood: 'happy' }, 3)[0], "Not me! I'm happy!");
});
