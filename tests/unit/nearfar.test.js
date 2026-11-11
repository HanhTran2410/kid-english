// Mẫu câu "Gần – xa" (SPEC-patterns2.md mục 4, P2): vùng của tranh, mạo từ, ghép câu, nhận câu, câu hỏi phần B, kiểm tra bài.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NEAR_FAR_ZONES, ARTICLES, NEAR_VI, EXTRA_ITEMS, nearItem, nearSentence, nearSentenceVi, nearKey, pairItems, nearLevel,
  planNearQuestions, nearPlan, buildNearSteps, validateNearFarLesson, builtInNearFarLessons, isNearFarLesson, NEAR_TOPIC,
} from '../../app/js/patterns2.js';
import { SCENE_BY_ID } from '../../app/js/sticker-scenes.js';
import { LEVEL } from '../../app/js/patterns.js';
import { parseLesson } from '../../app/js/lesson.js';
import { wordRecords, emptyProgress } from '../../app/js/progress.js';

const box = ([x, y, w, h]) => ({ l: x, t: y, r: x + w, b: y + h });
const overlap = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

test('NF-02: vùng của 14 tranh — trong tranh, không chồng nhau, vùng xa ở nửa trên, vùng gần ở phần ba dưới, chỗ Bông ngoài hai vùng', () => {
  assert.deepEqual(Object.keys(NEAR_FAR_ZONES).sort(), [...SCENE_BY_ID.keys()].sort(), 'mọi tranh của Dán tranh đều dùng được');
  for (const [id, z] of Object.entries(NEAR_FAR_ZONES)) {
    assert.ok(SCENE_BY_ID.has(id), id);
    const [near, far, bong] = [box(z.near), box(z.far), box(z.bong)];
    for (const b of [near, far, bong]) assert.ok(b.l >= 0 && b.t >= 0 && b.r <= 400 && b.b <= 300, `${id} trong tranh`);
    assert.ok(!overlap(near, far) && !overlap(near, bong) && !overlap(far, bong), `${id} không chồng nhau`);
    assert.ok((far.t + far.b) / 2 < 150, `${id}: vùng xa ở nửa trên`);
    assert.ok(near.t >= 200, `${id}: vùng gần ở phần ba dưới`);
    assert.ok(far.b <= near.t, `${id}: vùng xa cao hơn vùng gần`);
  }
});

test('mạo từ và tiếng Việt: mọi sticker của 14 tranh đều có trong bảng (trừ đồ số nhiều)', () => {
  for (const id of Object.keys(NEAR_FAR_ZONES)) {
    for (const it of SCENE_BY_ID.get(id).items) {
      if (['sunglasses', 'socks', 'grapes', 'scissors'].includes(it.name)) continue;
      assert.ok(['a', 'an', 'the', 'none'].includes(ARTICLES[it.name]), `${it.name} có mạo từ`);
      assert.ok(NEAR_VI[it.name], `${it.name} có tiếng Việt`);
    }
  }
});

test('DATA-07: 14 bài có sẵn hợp lệ — đồ có trong tranh hoặc đồ thêm, có mạo từ, không trùng, tab "This and that"', () => {
  const lessons = builtInNearFarLessons();
  assert.equal(lessons.length, 14);
  assert.deepEqual(lessons.map((l) => l.scene).sort(), Object.keys(NEAR_FAR_ZONES).sort(), 'mỗi tranh một bài');
  for (const l of lessons) {
    assert.ok(isNearFarLesson(l));
    assert.equal(l.topic, NEAR_TOPIC);
    const v = validateNearFarLesson(l);
    assert.ok(v.ok, `${l.title}: ${v.errors.join('; ')}`);
    const ids = l.pairs.flatMap((p) => [p.near, p.far]);
    assert.equal(new Set(ids).size, 6);
    for (const p of l.pairs) {
      const { near, far } = pairItems(p);
      assert.ok(near && far && near.article && far.article);
    }
  }
});

test('NF-04: câu ghép theo mạo từ — a / an / the / none; tiếng Việt Đây là / Kia là', () => {
  assert.equal(nearSentence('this', nearItem('flower')), 'This is a flower.');
  assert.equal(nearSentence('that', nearItem('egg')), 'That is an egg.');
  assert.equal(nearSentence('that', nearItem('sun')), 'That is the sun.');
  assert.equal(nearSentence('this', nearItem('ice-cream')), 'This is ice cream.');
  assert.equal(nearSentence('this', nearItem('flower', 'the')), 'This is the flower.', 'mạo từ riêng của bài thắng bảng');
  assert.equal(nearSentenceVi('this', nearItem('flower')), 'Đây là bông hoa.');
  assert.equal(nearSentenceVi('that', nearItem('tree')), 'Kia là cái cây.');
  assert.equal(EXTRA_ITEMS.sun.article, 'the');
  assert.equal(nearKey('that', nearItem('palm-tree')), 'near:that|palm tree');
});

test('NF-05 / NF-06: nhận câu — cả câu, "It is …", nói nhầm this / that, chỉ tên đồ', () => {
  const kite = nearItem('kite');
  assert.deepEqual(nearLevel(['that is a kite'], 'that', kite), { level: LEVEL.FULL, swapped: false });
  assert.deepEqual(nearLevel(["that's a kite"], 'that', kite), { level: LEVEL.FULL, swapped: false });
  assert.deepEqual(nearLevel(['that is kite'], 'that', kite), { level: LEVEL.FULL, swapped: false }, 'mạo từ không bắt buộc');
  assert.deepEqual(nearLevel(['it is a kite'], 'that', kite), { level: LEVEL.PARTIAL, swapped: false });
  assert.deepEqual(nearLevel(['this is a kite'], 'that', kite), { level: LEVEL.PARTIAL, swapped: true });
  assert.deepEqual(nearLevel(['kite'], 'that', kite), { level: LEVEL.KEYWORD, swapped: false });
  assert.equal(nearLevel(['that is a ball'], 'that', kite).level, LEVEL.NONE);
  assert.equal(nearLevel(['this is a palm tree'], 'this', nearItem('palm-tree')).level, LEVEL.FULL);
  // Phương án tốt nhất thắng.
  assert.deepEqual(nearLevel(['this is a kite', 'that is a kite'], 'that', kite), { level: LEVEL.FULL, swapped: false });
});

test('phần B: 4 câu — 2 this (đồ gần), 2 that (đồ xa), xen kẽ; ưu tiên đồ chưa có sao', () => {
  const [park] = builtInNearFarLessons();
  const records = new Map([
    [nearKey('this', nearItem('flower')), { ...emptyProgress('x'), mastery: 2 }],
    [nearKey('that', nearItem('tree')), { ...emptyProgress('x'), mastery: 1 }],
  ]);
  for (let i = 0; i < 50; i++) {
    const qs = planNearQuestions(park, records);
    assert.deepEqual(qs.map((q) => q.which), ['this', 'that', 'this', 'that']);
    assert.ok(!qs.some((q) => q.which === 'this' && q.pair === 0), 'flower đã có sao: không hỏi');
    assert.ok(!qs.some((q) => q.which === 'that' && q.pair === 0), 'tree đã có sao: không hỏi');
    assert.notEqual(qs[0].pair, qs[2].pair);
  }
  const saved = { questions: [{ which: 'this', pair: 2 }, { which: 'that', pair: 2 }, { which: 'this', pair: 1 }, { which: 'that', pair: 0 }] };
  // Kế hoạch lưu từ P2 (chưa có phần C): giữ câu hỏi, thêm phần C; đã đủ thì dùng lại y nguyên.
  const upgraded = nearPlan(park, { saved });
  assert.deepEqual(upgraded.questions, saved.questions);
  assert.equal(upgraded.bring.length, 2);
  assert.equal(nearPlan(park, { saved: upgraded }), upgraded, 'Học tiếp dùng lại kế hoạch đã lưu');
  assert.notEqual(nearPlan(park, { saved: { questions: [{ which: 'here', pair: 9 }] } }), null);
  assert.deepEqual(buildNearSteps(park).map((s) => s.stage), ['watch', 'watch', 'watch', 'ask', 'ask', 'ask', 'ask', 'bring', 'bring', 'song']);
});

test('DATA-02 / DATA-05: báo lỗi rõ — sticker không có trong tranh, trùng đồ, số nhiều, sai số cặp, tranh chưa có vùng', () => {
  const base = { style: 'nearFar', kind: 'patterns', title: 'X', scene: 'park' };
  const errs = (raw) => validateNearFarLesson({ ...base, ...raw }).errors.join(' | ');
  assert.match(errs({ pairs: [{ near: 'unicorn', far: 'tree' }, { near: 'ball', far: 'kite' }, { near: 'dog', far: 'bird' }] }), /Sticker "unicorn" không có trong tranh Park/);
  assert.match(errs({ pairs: [{ near: 'flower', far: 'tree' }, { near: 'flower', far: 'kite' }, { near: 'dog', far: 'bird' }] }), /"flower" có ở 2 cặp/);
  assert.match(errs({ scene: 'beach', pairs: [{ near: 'sunglasses', far: 'boat' }, { near: 'crab', far: 'dolphin' }, { near: 'shell', far: 'whale' }] }), /số nhiều/);
  assert.match(errs({ pairs: [{ near: 'flower', far: 'tree' }] }), /Bài có 1 cặp\. Mỗi bài đúng 3 cặp/);
  assert.match(errs({ scene: 'zoo', pairs: [] }), /Tranh "zoo" chưa dùng được/);
  assert.match(errs({ pairs: [{ near: 'flower', far: 'tree', farArticle: 'some' }, { near: 'ball', far: 'kite' }, { near: 'dog', far: 'bird' }] }), /article "some" không hợp lệ/);
});

test('dán bài JSON kiểu nearFar → parseLesson kiểm tra bằng validateNearFarLesson; tiến độ near: không lẫn từ vựng', () => {
  const r = parseLesson(JSON.stringify({ kind: 'patterns', style: 'nearFar', title: 'My park', scene: 'park', pairs: [{ near: 'flower', far: 'sun' }, { near: 'ball', far: 'kite' }, { near: 'dog', far: 'bird' }] }));
  assert.ok(r.ok, r.errors.join('; '));
  assert.equal(r.lesson.style, 'nearFar');
  assert.equal(nearSentence('that', pairItems(r.lesson.pairs[0]).far), 'That is the sun.');
  const records = [{ ...emptyProgress('near:this|flower'), word: 'near:this|flower' }, emptyProgress('cow')];
  assert.deepEqual(wordRecords(records).map((x) => x.word), ['cow']);
});
