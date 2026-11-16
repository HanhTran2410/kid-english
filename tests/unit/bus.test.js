// 🚌 Bác tài xe buýt (SPEC-jobs3.md mục 7): kế hoạch tuyến thỏa bất biến (500 seed mỗi mức), máy trạng thái hành khách.
// SPEC-jobs4 mục 5: thời tiết trên đường, đèn đỏ không ở chặng 1 → 2, đồ bỏ quên ở bến cuối (JOBS4-33).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  planRound, planOk, fallbackPlan, alightAt, boardAt, ridersAt, stopActions, MEMBERS, END, MAX_RIDERS,
  initialStates, board, alight, riding, pickUpLine, myStopLine, stopWrongLine, notMeLine,
  WEATHERS, SIGN, ITEM3, walkersOf, lostOk, weatherFixLine, fixWrongLine, cardWrongLine, lostAskLine, lostThanksLine,
} from '../../app/js/jobs/bus.js';
import { familySvg } from '../../app/js/jobs/family.js';

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
        if (level === 1) assert.equal(boardAt(plan, k).length, 1);
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

test('JOBS4-33 / U3: 500 seed mỗi mức — thời tiết, đèn đỏ mức 3 không ở chặng 1 → 2, đồ bỏ quên', () => {
  for (const level of [1, 2, 3]) {
    const rng = seeded(level * 17);
    const weathers = new Set();
    let two = 0;
    for (let i = 0; i < 500; i++) {
      const plan = planRound(level, { rng });
      assert.ok(WEATHERS.includes(plan.weather));
      weathers.add(plan.weather);
      if (level >= 3) assert.ok([3, END].includes(plan.lightBefore));
      const walkers = walkersOf(plan);
      if (level === 1) assert.deepEqual(plan.lost, []);
      else {
        assert.ok(walkers.length >= 2, 'vỉa hè luôn ≥ 2 người');
        assert.ok(lostOk(plan, level));
      }
      if (level === 2) {
        assert.equal(plan.lost.length, 1);
        const owner = walkers.find((p) => p.id === plan.lost[0].owner);
        assert.ok(['grandma', 'grandpa', 'mummy'].includes(owner.member));
        assert.equal(plan.lost[0].item, SIGN[owner.member]);
      }
      if (level === 3) {
        assert.ok(plan.lost.length >= 1 && plan.lost.length <= 2);
        if (plan.lost.length === 2) two += 1;
        for (const l of plan.lost) assert.equal(l.item, ITEM3[walkers.find((p) => p.id === l.owner).member]);
      }
    }
    assert.equal(weathers.size, 3, 'thời tiết bốc đều');
    if (level === 3) assert.ok(two > 100 && two < 400);
  }
  // Ưu tiên nút bé ít gặp.
  const seen = { wipers: 5, sunglasses: 5 };
  for (let i = 0; i < 50; i++) assert.equal(planRound(2, { rng: seeded(i + 1), seen }).weather, 'cold');
});

test('JOBS4-11: vỉa hè chỉ 1 người thì không có đồ bỏ quên (mức 3); mức 2 thiếu người có dấu hiệu thì kế hoạch không hợp lệ', () => {
  const plan = fallbackPlan(3);
  const one = { ...plan, passengers: plan.passengers.map((p) => (p.id === 'p3' ? { ...p, alightStop: 3 } : p)) };
  assert.equal(walkersOf(one).length, 1);
  assert.ok(lostOk({ ...one, lost: [] }, 3));
  assert.ok(!lostOk(one, 3));
  const f2 = fallbackPlan(2);
  assert.ok(!lostOk({ ...f2, lost: [{ owner: 'p2', item: 'teddy' }] }, 2), 'sister không có dấu hiệu bỏ quên được');
  assert.ok(!lostOk({ ...f2, lost: [] }, 2));
  assert.ok(!lostOk({ ...fallbackPlan(1), lost: [{ owner: 'p2', item: 'teddy' }] }, 1));
});

test('mức 2: người bỏ quên thiếu đúng dấu hiệu trên hình (JOBS4-10 — bà mất kính, ông vẫn đeo kính)', () => {
  const glasses = (svg) => (svg.match(/r="10" fill="none"/g) ?? []).length;
  assert.equal(glasses(familySvg('grandma')), 2);
  assert.equal(glasses(familySvg('grandma', 'happy', '', 'glasses')), 0);
  assert.equal(glasses(familySvg('grandpa')), 2);
  assert.ok(familySvg('grandpa').includes('#c92a2a') && !familySvg('grandpa', 'happy', '', 'hat').includes('#c92a2a'));
  assert.ok(familySvg('mummy').includes('#ffd43b') && !familySvg('mummy', 'happy', '', 'bag').includes('#ffd43b'));
});

test('câu thời tiết, đồ bỏ quên', () => {
  assert.equal(weatherFixLine('rainy')[0], "It's rainy! Wipers on!");
  assert.equal(weatherFixLine('cold')[0], "It's cold! Windows up!");
  assert.equal(fixWrongLine('sunglasses', 'rainy')[0], "That's the sunglasses. It's rainy! Wipers!");
  assert.equal(fixWrongLine('windows', 'rainy')[0], "That's the window. It's rainy! Wipers!");
  assert.equal(cardWrongLine('sunny')[0], "That's sunny. Look outside! What's the weather?");
  assert.equal(lostAskLine({ item: 'hat', member: 'grandpa' }, 2)[0], 'Oh! A hat! Whose hat is this?');
  assert.equal(lostAskLine({ item: 'glasses', member: 'grandma' }, 2)[0], 'Oh! Glasses! Whose glasses are these?');
  assert.equal(lostAskLine({ item: 'umbrella', member: 'grandpa' }, 3)[0], "Oh! An umbrella! It's Grandpa's umbrella!");
  assert.equal(lostAskLine({ item: 'teddy', member: 'sister' }, 3, true)[0], "Now… It's Sister's teddy!");
  assert.equal(lostThanksLine('hat', 'grandpa')[0], 'My hat! Thank you!');
  assert.equal(lostThanksLine('bottle', 'baby')[0], "Baby's bottle! Thank you!");
});
