// 🦸 Siêu nhân an toàn (SPEC-safety.md, S1 0.84.0): bốc lượt theo thứ tự ưu tiên mục 2.1 (500 seed), chủ đề ưu tiên,
// dữ liệu lưu (seen / firstOk / huy hiệu), cảnh mức 2, câu nói hợp bé 3 tuổi, bé không bao giờ kéo đồ nguy hiểm.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RULES, RULE_BY_ID, TOPICS, TOPIC_IDS, ADULTS, DANGEROUS, MAX_LEVEL, DEFAULT_FOCUS,
  planRound, adjacentSame, cleanSafetyState, afterRule, badgeOf, sceneStart, sceneAt, applyOps, allLines, rightLines,
} from '../../app/js/jobs/safety.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const kinds = (plan) => plan.map((p) => RULE_BY_ID.get(p.id).kind);
const topicsOf = (plan) => plan.map((p) => RULE_BY_ID.get(p.id).topic);
/** Xếp lại được để không có hai chủ đề liền nhau không (đếm chủ đề nhiều nhất ≤ ⌈n / 2⌉). */
const avoidable = (plan) => {
  const n = plan.length;
  const counts = {};
  for (const t of topicsOf(plan)) counts[t] = (counts[t] ?? 0) + 1;
  return Math.max(...Object.values(counts)) <= Math.ceil(n / 2);
};

test('bảng tình huống: S1 có 6 chủ đề, 28 tình huống (18 🚫 + 10 ✅); mã duy nhất; mọi chủ đề có cả 🚫 lẫn ✅', () => {
  assert.deepEqual(TOPIC_IDS, ['habits', 'kitchen', 'home', 'road', 'stranger', 'fire']);
  assert.equal(RULES.length, 28);
  assert.equal(RULES.filter((r) => r.kind === 'no').length, 18);
  assert.equal(new Set(RULES.map((r) => r.id)).size, RULES.length);
  for (const t of TOPIC_IDS) {
    assert.ok(RULES.some((r) => r.topic === t && r.kind === 'no'), t);
    assert.ok(RULES.some((r) => r.topic === t && r.kind === 'yes'), t);
    assert.ok(TOPICS[t].emoji && TOPICS[t].vi);
  }
  assert.equal(MAX_LEVEL, 2);
});

test('SAFE (unit): 500 seed — bật đủ chủ đề, không ưu tiên: 5 tình huống, 3 🚫 + 2 ✅, không lặp, không hai chủ đề liền nhau', () => {
  const rng = seeded(7);
  for (let i = 0; i < 500; i++) {
    const plan = planRound({ rng, focus: null });
    assert.equal(plan.length, 5);
    assert.equal(new Set(plan.map((p) => p.id)).size, 5);
    assert.deepEqual(kinds(plan).sort(), ['no', 'no', 'no', 'yes', 'yes']);
    assert.equal(adjacentSame(plan.map((p) => RULE_BY_ID.get(p.id))), 0);
    // Thẻ an toàn trái / phải (mức 2) lệch nhau tối đa 1.
    const left = plan.filter((p) => p.safeLeft).length;
    assert.ok(Math.abs(left - (plan.length - left)) <= 1);
  }
});

test('SAFE-26 (unit): chủ đề ưu tiên 🌙 (mặc định): lượt nào cũng đúng 1 🌙 🚫 + 1 🌙 ✅, vẫn 3 🚫 + 2 ✅; chủ đề ưu tiên đang tắt thì không áp dụng', () => {
  assert.equal(DEFAULT_FOCUS, 'habits');
  assert.equal(cleanSafetyState({}).focus, 'habits');
  const rng = seeded(3);
  for (let i = 0; i < 500; i++) {
    const plan = planRound({ rng, focus: 'habits' });
    const habits = plan.map((p) => RULE_BY_ID.get(p.id)).filter((r) => r.topic === 'habits');
    assert.deepEqual(habits.map((r) => r.kind).sort(), ['no', 'yes']);
    assert.deepEqual(kinds(plan).sort(), ['no', 'no', 'no', 'yes', 'yes']);
    assert.equal(adjacentSame(plan.map((p) => RULE_BY_ID.get(p.id))), 0);
  }
  for (let i = 0; i < 200; i++) {
    const plan = planRound({ rng, focus: 'habits', off: ['habits'] });
    assert.ok(!topicsOf(plan).includes('habits'));
    assert.equal(plan.length, 5);
  }
});

test('SAFE-27 (unit): "Không ưu tiên" — có lượt không có 🌙', () => {
  const rng = seeded(5);
  let without = 0;
  for (let i = 0; i < 200; i++) if (!topicsOf(planRound({ rng, focus: null })).includes('habits')) without += 1;
  assert.ok(without > 0);
});

test('mục 2.1: chỉ bật một chủ đề — độ dài = min(5, N), bù loại thiếu, có ✅ thì ≥ 1 ✅; N < 3 thì không có lượt', () => {
  const rng = seeded(11);
  for (const only of TOPIC_IDS) {
    const off = TOPIC_IDS.filter((t) => t !== only);
    const pool = RULES.filter((r) => r.topic === only);
    for (let i = 0; i < 100; i++) {
      const plan = planRound({ rng, off, focus: DEFAULT_FOCUS });
      if (pool.length < 3) {
        assert.equal(plan, null);
        continue;
      }
      assert.equal(plan.length, Math.min(5, pool.length), only);
      assert.ok(topicsOf(plan).every((t) => t === only));
      assert.equal(new Set(plan.map((p) => p.id)).size, plan.length);
      assert.ok(kinds(plan).includes('yes'));
      // 🚦 có 2 🚫 + 3 ✅: thiếu 🚫 thì bù ✅ (SAFE-17).
      if (only === 'road') assert.deepEqual(kinds(plan).sort(), ['no', 'no', 'yes', 'yes', 'yes']);
    }
  }
  // Mọi chủ đề tắt → không có lượt (SAFE-11, SAFE-18).
  assert.equal(planRound({ off: TOPIC_IDS }), null);
  // Nguồn chỉ 2 tình huống (giả) → không có lượt; 3 → lượt 3.
  const two = RULES.filter((r) => r.topic === 'kitchen').slice(0, 2);
  assert.equal(planRound({ rules: two }), null);
  const three = [...two, RULES.find((r) => r.id === 'socket')];
  assert.equal(planRound({ rules: three, rng }).length, 3);
});

test('mục 2.1: trùng chủ đề liền nhau chỉ khi không thể tránh (500 seed, tắt ngẫu nhiên vài chủ đề)', () => {
  const rng = seeded(13);
  for (let i = 0; i < 500; i++) {
    const off = TOPIC_IDS.filter(() => rng() < 0.4);
    const plan = planRound({ rng, off, focus: rng() < 0.5 ? DEFAULT_FOCUS : null });
    if (!plan) continue;
    assert.ok(topicsOf(plan).every((t) => !off.includes(t)));
    if (avoidable(plan)) assert.equal(adjacentSame(plan.map((p) => RULE_BY_ID.get(p.id))), 0, JSON.stringify(topicsOf(plan)));
  }
});

test('ít gặp trước: bật đủ chủ đề, không ưu tiên, chơi 6 lượt liền thì mọi tình huống đã gặp', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const rng = seeded(seed);
    let state = cleanSafetyState({ focus: null });
    for (let round = 0; round < 6; round++) {
      for (const { id } of planRound({ rng, focus: state.focus, seen: state.seen })) state = afterRule(state, id, { firstTry: true });
    }
    // 6 lượt × 3 🚫 = 18 = số 🚫; ✅ 6 × 2 = 12 ≥ 10.
    assert.equal(Object.keys(state.seen).length, RULES.length, `seed ${seed}`);
  }
});

test('dữ liệu lưu: cleanSafetyState làm sạch mã lạ / hỏng; afterRule: seen +1 đúng một lần, firstOk không bao giờ mất', () => {
  const s = cleanSafetyState({
    level: 9, rounds: -1, lock: 2, seen: { knife: 2, nope: 3, tv: 'x' }, firstOk: { knife: true, stove: 'yes', ghost: true },
    off: ['road', 'road', 'moon'], focus: 'moon',
  });
  assert.deepEqual(s, { level: 2, rounds: 0, lock: 2, seen: { knife: 2 }, firstOk: { knife: true }, off: ['road'], focus: 'habits' });
  assert.equal(cleanSafetyState({ focus: null }).focus, null);
  assert.equal(cleanSafetyState(null).level, 1);
  assert.equal(cleanSafetyState({ level: 3 }).level, 1); // S1 chỉ có mức 1–2

  let st = cleanSafetyState({});
  st = afterRule(st, 'knife', { firstTry: false });
  assert.equal(st.seen.knife, 1);
  assert.equal(st.firstOk.knife, undefined);
  st = afterRule(st, 'knife', { firstTry: true });
  assert.equal(st.seen.knife, 2);
  assert.equal(st.firstOk.knife, true);
  st = afterRule(st, 'knife', { firstTry: false }); // SAFE-23: chơi sai sau đó vẫn giữ
  assert.equal(st.firstOk.knife, true);
});

test('huy hiệu (badgeOf): mở khi mọi tình huống của chủ đề đã firstOk; thêm tình huống giả vào chủ đề chưa có thì chưa mở', () => {
  let st = cleanSafetyState({});
  const road = RULES.filter((r) => r.topic === 'road');
  for (const r of road.slice(0, -1)) st = afterRule(st, r.id, { firstTry: true });
  assert.equal(badgeOf(st, 'road'), false);
  st = afterRule(st, road.at(-1).id, { firstTry: true });
  assert.equal(badgeOf(st, 'road'), true);
  st = afterRule(st, road[0].id, { firstTry: false });
  assert.equal(badgeOf(st, 'road'), true);
  assert.equal(badgeOf(st, 'kitchen'), false);
  const extra = [...RULES, { id: 'new-road', topic: 'road' }];
  assert.equal(badgeOf(st, 'road', extra), false);
});

test('câu nói hợp bé 3 tuổi (review 3+): không rỗng; câu hỏi ≤ 7 từ; câu giải thích ≤ 7 từ; câu nhắc lại ≤ 4 từ; không grown-up; người lạ không he / she', () => {
  const words = (s) => s.trim().split(/\s+/).length;
  for (const r of RULES) {
    for (const [en, vi] of allLines(r)) {
      assert.ok(en.trim() && vi.trim(), r.id);
      assert.doesNotMatch(en, /grown-?up/i, r.id);
    }
    assert.ok(words(r.ask[0]) <= 7, `${r.id}: ${r.ask[0]}`);
    assert.ok(words(r.why[0]) <= 7, `${r.id}: ${r.why[0]}`);
    assert.ok(words(r.short[0]) <= 4, `${r.id}: ${r.short[0]}`);
    if (r.topic === 'stranger') for (const [en] of allLines(r)) assert.doesNotMatch(en, /\b(he|she|him|her)\b/i, r.id);
    // 🚫: câu giải thích có việc nên làm (không chỉ "No!").
    if (r.kind === 'no') assert.ok(words(r.why[0]) >= 3, r.id);
    assert.deepEqual(rightLines(r).at(-1), r.why);
  }
  // Thuốc không gọi là kẹo (review 3+).
  assert.doesNotMatch(RULE_BY_ID.get('medicine').ask[0], /candy/i);
});

test('mục 5 + review 3+: bé không bao giờ kéo đồ nguy hiểm / đồ nhỏ; kéo chỉ là Bông hoặc mũ bảo hiểm; chỗ chạm / kéo có trong cảnh', () => {
  for (const r of RULES) {
    const ids = new Set(sceneStart(r).map((s) => s.id));
    assert.ok(ids.has(r.fix.target), `${r.id}: ${r.fix.target}`);
    assert.ok(!DANGEROUS.has(r.fix.target) || ADULTS.has(r.fix.target), r.id);
    if (r.fix.how === 'drag') {
      assert.ok(ids.has(r.fix.item), r.id);
      assert.ok(['bong', 'helmet'].includes(r.fix.item), `${r.id}: kéo ${r.fix.item}`);
    } else assert.equal(r.fix.how, 'tap');
  }
});

test('mức 2 (sceneAt): tranh nguy hiểm không có bố mẹ, Bông đứng trước đồ vật; tranh an toàn khác tranh nguy hiểm; không ai ra ngoài khung', () => {
  for (const r of RULES) {
    const risky = sceneAt(r, 'risky');
    const safe = sceneAt(r, 'safe');
    assert.ok(risky.sprites.filter((s) => ADULTS.has(s.k)).every((s) => s.hidden), r.id);
    assert.equal(risky.sprites.find((s) => s.id === 'bong').x, r.walk);
    assert.notDeepEqual(JSON.stringify(safe), JSON.stringify(risky), r.id);
    for (const s of safe.sprites.filter((p) => !p.hidden && (p.id === 'bong' || ADULTS.has(p.k)))) assert.ok(s.x >= 0 && s.x <= 100, `${r.id}: ${s.id} x = ${s.x}`);
  }
  // Thao tác `done` chạy được trên cảnh (mọi id có thật).
  for (const r of RULES) {
    const ids = new Set(sceneStart(r).map((s) => s.id));
    for (const [op, id] of r.done) if (op !== 'scene') assert.ok(ids.has(id), `${r.id}: ${id}`);
  }
  const { sprites, scene } = applyOps(sceneStart(RULE_BY_ID.get('bedtime')), RULE_BY_ID.get('bedtime').done);
  assert.deepEqual(scene, ['dark']);
  assert.match(sprites.find((s) => s.id === 'bong').cls, /sleep/);
});
