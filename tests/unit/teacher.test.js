// Cô giáo nhí (SPEC-jobs.md mục 5): chọn hình, câu sai thật sự sai, câu nói đúng ngữ pháp.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NOUNS, NOUN_BY_EN, planRound, wrongClaim, sayWhat, claimLine, fixLine, practiceWord, QUESTIONS_PER_ROUND,
  planLesson, CLASS_IDS, ACTIONS, ACTION_BY_ID, whereLine, notMeLine, canWeLine, cmdLine, wrongActionLine,
} from '../../app/js/jobs/teacher.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

test('một lượt: 5 hình không lặp, 2–3 câu sai; câu sai luôn khác hình thật', () => {
  const rng = seeded(3);
  for (const level of [1, 2, 3]) for (let i = 0; i < 80; i++) {
    const qs = planRound(level, { rng });
    assert.equal(qs.length, QUESTIONS_PER_ROUND);
    assert.equal(new Set(qs.map((q) => JSON.stringify(q.shown))).size, qs.length);
    const wrong = qs.filter((q) => !q.right);
    assert.ok(wrong.length >= 2 && wrong.length <= 3, `mức ${level}: ${wrong.length} câu sai`);
    for (const q of qs) assert.equal(same(q.shown, q.claim), q.right);
  }
});

test('câu sai theo mức: mức 1 khác nhóm, mức 2 cùng nhóm; mức 3 đổi đúng một thuộc tính (màu / số / đồ)', () => {
  const rng = seeded(8);
  for (let i = 0; i < 200; i++) {
    const noun = NOUNS[i % NOUNS.length];
    const shown = { kind: 'noun', en: noun.en };
    const c1 = wrongClaim(shown, 1, rng);
    assert.notEqual(NOUN_BY_EN.get(c1.en).group, noun.group);
    const c2 = wrongClaim(shown, 2, rng);
    assert.equal(NOUN_BY_EN.get(c2.en).group, noun.group);
    assert.notEqual(c2.en, noun.en);
    for (const s3 of [{ kind: 'color', thing: 'ball', color: 'red' }, { kind: 'count', thing: 'cat', n: 2 }]) {
      const c3 = wrongClaim(s3, 3, rng);
      const diff = Object.keys(s3).filter((k) => s3[k] !== c3[k]);
      assert.equal(diff.length, 1, JSON.stringify(c3));
    }
  }
});

test('ưu tiên từ bé đã học: đủ 5 từ đã học thì cả 5 hình đều là từ đó', () => {
  const known = new Set(['cat', 'dog', 'car', 'egg', 'nose']);
  for (let i = 0; i < 20; i++) {
    const qs = planRound(1, { known, rng: seeded(i + 1) });
    assert.deepEqual(new Set(qs.map((q) => q.shown.en)), known);
  }
});

test('câu nói đúng ngữ pháp: a / an / không mạo từ / They\'re; mức 3 màu + số ít / nhiều', () => {
  assert.equal(claimLine({ kind: 'noun', en: 'cat' })[0], "I know! It's a cat!");
  assert.equal(claimLine({ kind: 'noun', en: 'egg' })[0], "I know! It's an egg!");
  assert.equal(claimLine({ kind: 'noun', en: 'rice' })[0], "I know! It's rice!");
  assert.equal(claimLine({ kind: 'noun', en: 'eyes' })[0], "I know! They're eyes!");
  assert.equal(claimLine({ kind: 'color', thing: 'ball', color: 'red' })[0], "I know! It's a red ball!");
  assert.equal(claimLine({ kind: 'count', thing: 'cat', n: 1 })[0], 'I know! I see one cat!');
  assert.equal(claimLine({ kind: 'count', thing: 'apple', n: 3 })[0], 'I know! I see three apples!');
  assert.equal(fixLine({ kind: 'noun', en: 'dog' })[0], "It's a dog! Thank you, teacher!");
  assert.equal(practiceWord({ kind: 'noun', en: 'dog' }).en, 'dog');
  assert.equal(practiceWord({ kind: 'color', thing: 'ball', color: 'red' }), null);
  for (const n of NOUNS) for (const [en, vi] of [sayWhat({ kind: 'noun', en: n.en })]) assert.ok(en && vi && !/undefined/.test(en + vi), n.en);
});

test('SPEC-jobs2 TE1 — buổi học: lớp 3 bạn (mức 1) / 4 bạn (mức 2–3), điểm danh đủ mỗi bạn một lần; 5 việc = 4 hình (vẫn 2–3 câu Bông nói sai) + 1 ca hành động', () => {
  const rng = seeded(31);
  for (const level of [1, 2, 3]) for (let i = 0; i < 60; i++) {
    const { pupils, roll, items } = planLesson(level, { rng });
    assert.equal(pupils.length, level <= 1 ? 3 : 4);
    assert.ok(pupils.every((p) => CLASS_IDS.includes(p)));
    assert.deepEqual([...roll].sort(), [...pupils].sort());
    assert.equal(items.length, QUESTIONS_PER_ROUND);
    const acts = items.filter((x) => x.kind === 'actions');
    assert.equal(acts.length, 1);
    const wrong = items.filter((x) => x.kind !== 'actions' && !x.right).length;
    assert.ok(wrong >= 2 && wrong <= 3, `mức ${level}: ${wrong} câu sai`);
    const [a] = acts;
    if (level <= 1) {
      assert.deepEqual([...a.cards].sort(), ['clap', 'sit-down', 'stand-up']);
      assert.equal(a.asks, null);
    } else {
      assert.equal(a.cards.length, 5);
      assert.equal(a.asks.length, 3);
      assert.equal(new Set(a.asks).size, 3);
      assert.ok(a.asks.every((id) => a.cards.includes(id)));
      assert.ok(a.askers.every((p) => pupils.includes(p)));
    }
  }
});

test('SPEC-jobs2 TE1 — câu điểm danh / hành động', () => {
  assert.equal(whereLine('Kitty')[0], "Where's Kitty?");
  assert.equal(notMeLine('Puppy', 'Kitty')[0], "I'm Puppy! Kitty is over there!");
  assert.equal(canWeLine(ACTION_BY_ID.get('jump'))[0], 'Can we jump, teacher?');
  assert.equal(canWeLine(ACTION_BY_ID.get('clap'))[0], 'Can we clap our hands, teacher?');
  assert.equal(cmdLine(ACTION_BY_ID.get('stand-up'))[0], 'Stand up!');
  assert.equal(wrongActionLine(ACTION_BY_ID.get('clap'), ACTION_BY_ID.get('jump'))[0], "That's clap. We want to jump!");
  assert.equal(ACTIONS.length, 5);
});
