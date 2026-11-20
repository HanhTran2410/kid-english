// 🦸 Siêu nhân an toàn (SPEC-safety.md, S1 0.84.0, S2 0.85.0): bốc lượt theo thứ tự ưu tiên mục 2.1 (500 seed), chủ đề ưu tiên,
// dữ liệu lưu (seen / firstOk / huy hiệu), cảnh mức 2, câu nói hợp bé 3 tuổi, bé không bao giờ kéo đồ nguy hiểm;
// S2: chủ đề 🛒 💧 🐕, mức 3 chỉ qua khóa mức, chuyện 2 bước (planStory), "Say it!" (từ khóa), gợi ý cho bố mẹ, ảnh thay được.
// 0.87.0 (SPEC-body): chủ đề 🫶 bố mẹ tự bật (optIn), tối đa 2 / lượt, không 3 ✋ liền nhau, huy hiệu chỉ khi bật.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RULES, RULE_BY_ID, TOPICS, TOPIC_IDS, ADULTS, DANGEROUS, MAX_LEVEL, AUTO_MAX_LEVEL, DEFAULT_FOCUS, STORIES, STORY_COUNT, TIPS,
  SAFETY_ITEMS, SAFETY_SCENES, SAFETY_PEOPLE, planRound, planStory, adjacentSame, cleanSafetyState, afterRule, badgeOf, badgesOf,
  sceneStart, sceneAt, applyOps, allLines, rightLines, sayKeywords, OPT_IN_TOPICS, offTopics, shownTopics, kindRuns, BODY_IF_TOLD, BODY_DONT_SAY,
} from '../../app/js/jobs/safety.js';
import { afterJobRound } from '../../app/js/jobs/levels.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const kinds = (plan) => plan.map((p) => RULE_BY_ID.get(p.id).kind);
const topicsOf = (plan) => plan.map((p) => RULE_BY_ID.get(p.id).topic);
/** Tình huống thường (không tính chủ đề bố mẹ tự bật). */
const BASE = RULES.filter((r) => !OPT_IN_TOPICS.includes(r.topic));
const BODY = RULES.filter((r) => r.topic === 'body');
/** Xếp lại được để không có hai chủ đề liền nhau không (đếm chủ đề nhiều nhất ≤ ⌈n / 2⌉). */
const avoidable = (plan) => {
  const n = plan.length;
  const counts = {};
  for (const t of topicsOf(plan)) counts[t] = (counts[t] ?? 0) + 1;
  return Math.max(...Object.values(counts)) <= Math.ceil(n / 2);
};

test('bảng tình huống: 9 chủ đề thường, 38 tình huống (25 🚫 + 13 ✅) + 🫶 bố mẹ bật (6); mã duy nhất; chủ đề nào cũng có cả 🚫 và ✅; có pond-toy', () => {
  assert.deepEqual(TOPIC_IDS, ['habits', 'kitchen', 'home', 'road', 'stranger', 'fire', 'shop', 'water', 'dog', 'body']);
  assert.deepEqual(OPT_IN_TOPICS, ['body']);
  assert.equal(BASE.length, 38);
  assert.equal(BASE.filter((r) => r.kind === 'no').length, 25);
  assert.equal(new Set(RULES.map((r) => r.id)).size, RULES.length);
  for (const t of TOPIC_IDS) {
    assert.ok(RULES.some((r) => r.topic === t && r.kind === 'no'), t);
    assert.ok(RULES.some((r) => r.topic === t && r.kind === 'yes'), t);
    assert.ok(RULES.filter((r) => r.topic === t).length >= 3, t); // bật riêng một chủ đề vẫn đủ một lượt
    assert.ok(TOPICS[t].emoji && TOPICS[t].vi && TOPICS[t].en);
  }
  assert.deepEqual(RULES.filter((r) => r.topic === 'water').map((r) => r.id).sort(), ['pond', 'pond-toy', 'pool-alone', 'swim-with']);
  assert.equal(RULE_BY_ID.get('pond-toy').fix.target, 'daddy'); // đồ rơi xuống nước: gọi bố, không tự lấy
  assert.deepEqual(RULES.filter((r) => r.topic === 'dog').map((r) => r.id), ['dog', 'dog-eat', 'dog-still']);
  assert.equal(MAX_LEVEL, 3);
  assert.equal(AUTO_MAX_LEVEL, 2);
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

test('ít gặp trước: bật đủ chủ đề, không ưu tiên, chơi 9 lượt liền thì mọi tình huống đã gặp', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const rng = seeded(seed);
    let state = cleanSafetyState({ focus: null });
    for (let round = 0; round < 9; round++) {
      for (const { id } of planRound({ rng, focus: state.focus, seen: state.seen })) state = afterRule(state, id, { firstTry: true });
    }
    assert.ok(!Object.keys(state.seen).some((id) => RULE_BY_ID.get(id).topic === 'body'), 'chưa bật 🫶');
    // 9 lượt × 3 🚫 = 27 ≥ 25 🚫; ✅ 9 × 2 = 18 ≥ 13.
    assert.equal(Object.keys(state.seen).length, BASE.length, `seed ${seed}`);
  }
});

test('dữ liệu lưu: cleanSafetyState làm sạch mã lạ / hỏng; afterRule: seen +1 đúng một lần, firstOk không bao giờ mất', () => {
  const s = cleanSafetyState({
    level: 9, rounds: -1, lock: 2, seen: { knife: 2, nope: 3, tv: 'x' }, firstOk: { knife: true, stove: 'yes', ghost: true },
    off: ['road', 'road', 'moon'], focus: 'moon',
  });
  assert.deepEqual(s, { level: 2, rounds: 0, lock: 2, seen: { knife: 2 }, firstOk: { knife: true }, off: ['road'], focus: 'habits', optIn: [] });
  assert.equal(cleanSafetyState({ focus: null }).focus, null);
  assert.equal(cleanSafetyState(null).level, 1);
  assert.equal(cleanSafetyState({ level: 3 }).level, 1); // mức 3 không tự lên: chỉ qua khóa mức
  assert.equal(cleanSafetyState({ level: 2, lock: 3 }).level, 3);
  assert.equal(cleanSafetyState({ lock: 4 }).lock, null);

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

test('mục 5 + review 3+: bé không bao giờ kéo đồ nguy hiểm / đồ nhỏ; kéo chỉ là Bông, mũ bảo hiểm hoặc khăn tắm; chỗ chạm / kéo có trong cảnh', () => {
  for (const r of RULES) {
    const ids = new Set(sceneStart(r).map((s) => s.id));
    assert.ok(ids.has(r.fix.target), `${r.id}: ${r.fix.target}`);
    assert.ok(!DANGEROUS.has(r.fix.target) || ADULTS.has(r.fix.target), r.id);
    if (r.fix.how === 'drag') {
      assert.ok(ids.has(r.fix.item), r.id);
      assert.ok(['bong', 'helmet', 'towel'].includes(r.fix.item), `${r.id}: kéo ${r.fix.item}`);
    } else assert.equal(r.fix.how, 'tap');
  }
});

test('mức 2 (sceneAt): tranh nguy hiểm không có bố mẹ, Bông đứng trước đồ vật; tranh an toàn khác tranh nguy hiểm; không ai ra ngoài khung', () => {
  for (const r of RULES) {
    const risky = sceneAt(r, 'risky');
    const safe = sceneAt(r, 'safe');
    assert.ok(risky.sprites.filter((s) => ADULTS.has(s.k)).every((s) => s.hidden), r.id);
    // `risky`: tranh chưa an toàn riêng (lost: Bông đi lang thang xa quầy).
    if (!r.risky) assert.equal(risky.sprites.find((s) => s.id === 'bong').x, r.walk);
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

test('S2 mức 3: không tự lên mức 3 (afterJobRound tối đa mức 2); khóa mức 3 thì giữ mức 3', () => {
  let st = cleanSafetyState({ level: 2, rounds: 2 });
  for (let i = 0; i < 6; i++) st = afterJobRound(st, { maxLevel: AUTO_MAX_LEVEL });
  assert.equal(st.level, 2);
  st = afterJobRound(cleanSafetyState({ lock: 3 }), { maxLevel: AUTO_MAX_LEVEL });
  assert.equal(st.level, 3);
});

test('S2 chuyện 2 bước: cùng chủ đề, không trùng tình huống; planStory 500 seed: 2 chuyện khác chủ đề, 4 bước, bước 1 rồi 2, trái / phải cân bằng', () => {
  for (const [a, b] of STORIES) {
    assert.ok(RULE_BY_ID.has(a) && RULE_BY_ID.has(b), `${a} ${b}`);
    assert.equal(RULE_BY_ID.get(a).topic, RULE_BY_ID.get(b).topic);
  }
  const rng = seeded(17);
  for (let i = 0; i < 500; i++) {
    const plan = planStory({ rng, focus: rng() < 0.5 ? 'habits' : null });
    assert.equal(plan.length, STORY_COUNT * 2);
    assert.equal(new Set(plan.map((p) => p.id)).size, plan.length);
    assert.deepEqual(plan.map((p) => p.step), [1, 2, 1, 2]);
    assert.deepEqual(plan.map((p) => p.story), [0, 0, 1, 1]);
    const t = topicsOf(plan);
    assert.equal(t[0], t[1]);
    assert.notEqual(t[0], t[2]);
    assert.equal(plan.filter((p) => p.safeLeft).length, 2);
  }
  // Chủ đề ưu tiên đang bật: chuyện đầu là của chủ đề đó.
  for (let i = 0; i < 100; i++) assert.equal(RULE_BY_ID.get(planStory({ rng, focus: 'water' })[0].id).topic, 'water');
  // Tắt chủ đề: không có chuyện nào của chủ đề đó; không đủ 2 chuyện thì null (màn chơi dùng lượt thường).
  for (let i = 0; i < 100; i++) assert.ok(!topicsOf(planStory({ rng, off: ['fire', 'water'] })).some((x) => x === 'fire' || x === 'water'));
  assert.equal(planStory({ off: TOPIC_IDS.filter((x) => x !== 'road') }), null); // 2 chuyện 🚦 cùng chủ đề → không đủ
  // Ít gặp trước.
  const seen = Object.fromEntries(RULES.map((r) => [r.id, 5]));
  seen['pond'] = 0;
  seen['pond-toy'] = 0;
  assert.equal(planStory({ rng, seen, focus: null })[0].id, 'pond');
});

test('S2 "Say it!": từ khóa của câu nhắc lại ngắn — từ ≥ 3 chữ cái, chữ thường, không trùng; tình huống nào cũng có từ khóa', () => {
  assert.deepEqual(sayKeywords(RULE_BY_ID.get('pond-toy')), ['stay', 'back', 'call', 'daddy']);
  assert.deepEqual(sayKeywords(RULE_BY_ID.get('stove')), ['hot', 'stay', 'back']);
  for (const r of RULES) assert.ok(sayKeywords(r).length > 0, r.id);
});

test('S2 huy hiệu (badgesOf): thứ tự chủ đề; 🐕 cần đủ 3 tình huống đúng ngay lần đầu', () => {
  let st = cleanSafetyState({});
  assert.deepEqual(badgesOf(st), []);
  st = afterRule(st, 'dog', { firstTry: true });
  st = afterRule(st, 'dog-eat', { firstTry: true });
  assert.deepEqual(badgesOf(st), []);
  st = afterRule(st, 'dog-still', { firstTry: true });
  for (const r of RULES.filter((x) => x.topic === 'kitchen')) st = afterRule(st, r.id, { firstTry: true });
  assert.deepEqual(badgesOf(st), ['kitchen', 'dog']);
});

test('S2 Góc bố mẹ: tình huống nào cũng có gợi ý "Nói thêm với bé"; mọi đồ vật trong cảnh (trừ hiệu ứng nhỏ) có mục ảnh; cảnh nào cũng có prompt nền', () => {
  for (const r of RULES) assert.ok(TIPS[r.id]?.length > 20, r.id);
  assert.deepEqual(Object.keys(TIPS).sort(), RULES.map((r) => r.id).sort());
  // 🫶: bong bóng, bàn tay đập tay là hiệu ứng (không có mục ảnh — SPEC-body mục 6).
  const effects = new Set(['line', 'rug', 'bubbles', 'cover', 'hands', 'belt', 'hug', 'exit', 'hugbub', 'shhbub', 'askbub', 'five']);
  const kinds = new Set(RULES.flatMap((r) => r.set.map((s) => s.k)));
  for (const k of kinds) if (!ADULTS.has(k) && !effects.has(k)) assert.ok(SAFETY_ITEMS.some((it) => it.id === k), k);
  for (const sc of new Set(RULES.map((r) => r.scene))) assert.ok(SAFETY_SCENES.some((s) => s.id === sc), sc);
  assert.deepEqual(SAFETY_PEOPLE.map((p) => p.id), ['bong', 'mummy', 'daddy']);
});

// ---------- 🫶 Cơ thể của bé (SPEC-body, 0.87.0) ----------
test('BODY: 6 tình huống (3 👍 private / bath-help / doctor + 3 ✋ hug-no / secret / no-touch); gentle; câu nhẹ, không dọa; không người lạ; chỉ bố mẹ', () => {
  assert.deepEqual(BODY.map((r) => [r.id, r.kind]), [
    ['private', 'yes'], ['bath-help', 'yes'], ['doctor', 'yes'], ['hug-no', 'no'], ['secret', 'no'], ['no-touch', 'no'],
  ]);
  for (const r of BODY) {
    assert.equal(r.gentle, true, r.id);
    for (const [en] of [...allLines(r), ...(r.after ? [r.after] : [])]) assert.doesNotMatch(en, /\b(bad|scary|hurt|stranger)\b/i, r.id);
    for (const s of sceneStart(r)) assert.ok(s.k === 'bong' || ADULTS.has(s.k) || s.k !== 'stranger', `${r.id}: ${s.k}`);
    assert.ok(!sceneStart(r).some((s) => s.k === 'stranger'), r.id);
    assert.deepEqual(rightLines(r), [r.why]); // không "Oops!"
  }
  assert.equal(RULE_BY_ID.get('bath-help').set.find((s) => ADULTS.has(s.k)).k, 'mummy');
  assert.equal(RULE_BY_ID.get('doctor').set.find((s) => ADULTS.has(s.k)).k, 'daddy');
  assert.match(RULE_BY_ID.get('no-touch').after[1], /Không phải lỗi của con/);
  assert.match(RULE_BY_ID.get('secret').after[1], /Không phải lỗi của con/);
  assert.ok(STORIES.every((p) => p.every((id) => RULE_BY_ID.get(id).topic !== 'body')));
  assert.equal(BODY_IF_TOLD.length, 8);
  assert.ok(BODY_IF_TOLD.some((t) => t.includes('111')));
  assert.ok(BODY_DONT_SAY.length >= 4);
});

test('BODY nâng cấp: state 0.86.0 (không optIn) → 🫶 tắt, mọi trường khác giữ; optIn giữ qua cleanSafetyState; mã lạ bỏ; 🫶 không là chủ đề ưu tiên', () => {
  const old = { level: 2, rounds: 4, lock: null, seen: { knife: 3 }, firstOk: { knife: true }, off: ['road'], focus: 'kitchen' };
  const s = cleanSafetyState(old);
  assert.deepEqual(s, { ...old, optIn: [] });
  assert.deepEqual(offTopics(s), ['road', 'body']);
  assert.deepEqual(shownTopics(s), TOPIC_IDS.filter((t) => t !== 'body'));
  const on = cleanSafetyState({ ...old, optIn: ['body', 'body', 'moon'] });
  assert.deepEqual(on.optIn, ['body']);
  assert.deepEqual(offTopics(on), ['road']);
  assert.deepEqual(cleanSafetyState(on), on);
  assert.equal(cleanSafetyState({ focus: 'body', optIn: ['body'] }).focus, 'habits');
});

test('BODY bốc lượt (500 seed): chưa bật → không có 🫶; bật đủ → ≤ 2 🫶 / lượt, vẫn 5 tình huống; chỉ bật 🫶 → 5, 3 ✋ + 2 👍, không 3 ✋ liền; planStory không có 🫶', () => {
  const rng = seeded(23);
  for (let i = 0; i < 500; i++) {
    assert.ok(!topicsOf(planRound({ rng, focus: 'habits' })).includes('body'));
    const plan = planRound({ rng, off: [], focus: rng() < 0.5 ? 'habits' : null, seen: { private: 0 } });
    assert.equal(plan.length, 5);
    assert.ok(topicsOf(plan).filter((t) => t === 'body').length <= 2, JSON.stringify(topicsOf(plan)));
    const only = planRound({ rng, off: TOPIC_IDS.filter((t) => t !== 'body') });
    assert.equal(only.length, 5);
    assert.deepEqual(kinds(only).sort(), ['no', 'no', 'no', 'yes', 'yes']);
    assert.equal(kindRuns(only.map((p) => RULE_BY_ID.get(p.id))), 0, JSON.stringify(kinds(only)));
    assert.ok(!topicsOf(planStory({ rng, off: [] }) ?? []).includes('body'));
  }
  // Ít gặp trước: 🫶 chưa gặp lần nào nhưng vẫn chỉ 2.
  const seen = Object.fromEntries(BASE.map((r) => [r.id, 5]));
  assert.equal(topicsOf(planRound({ rng, off: [], seen })).filter((t) => t === 'body').length, 2);
  // 🫶 + một chủ đề 1–2 tình huống còn bật: dưới 3 tình huống dùng được thì không có lượt.
  assert.equal(planRound({ rules: [...BODY, RULES[0]], off: [] })?.length, 3);
});

test('BODY huy hiệu: chỉ tính khi đang bật; tắt rồi bật lại → huy hiệu, firstOk còn nguyên', () => {
  let st = cleanSafetyState({ optIn: ['body'] });
  for (const r of BODY) st = afterRule(st, r.id, { firstTry: true });
  assert.deepEqual(badgesOf(st), ['body']);
  const offAgain = cleanSafetyState({ ...st, optIn: [] });
  assert.deepEqual(badgesOf(offAgain), []);
  assert.equal(offAgain.firstOk['no-touch'], true);
  assert.deepEqual(badgesOf(cleanSafetyState({ ...offAgain, optIn: ['body'] })), ['body']);
});
