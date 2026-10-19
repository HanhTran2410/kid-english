// Đếm hình (SPEC-shapes.md): dữ liệu tranh, đáp án, quy tắc vẽ, chọn câu, câu nói, mức.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  KINDS, KIND_IDS, PICTURES, PICTURE_BY_ID, bbox, countOf, questionPool, buildShapeQuestions, cleanShapeState, afterShapeRound,
  lookLine, howManyLine, otherShapeLine, totalLine, thisIsLine, findOneLine, againLine, hitPadSvg, pictureSvg, maxAnswer,
  MIN_SIDE, MIN_SIDE_HARD, RECT_RATIO,
} from '../../app/js/shapes.js';

const inside = (a, b) => a[0] >= b[0] && a[1] >= b[1] && a[0] + a[2] <= b[0] + b[2] && a[1] + a[3] <= b[1] + b[3];

test('12 tranh; mỗi hình đúng một loại hợp lệ, mã không trùng, nằm trong khung 200', () => {
  assert.equal(PICTURES.length, 12);
  for (const pic of PICTURES) {
    assert.equal(new Set(pic.shapes.map((s) => s.id)).size, pic.shapes.length, pic.id);
    for (const s of pic.shapes) {
      assert.ok(KIND_IDS.includes(s.kind), `${pic.id}.${s.id}`);
      const [x, y, w, h] = bbox(s);
      assert.ok(x >= 0 && y >= 0 && x + w <= 200 && y + h <= 200, `${pic.id}.${s.id} ra ngoài khung`);
    }
  }
});

test('quy tắc vẽ: hình vuông là vuông, hình chữ nhật dài rõ (≥ 1,6), không lồng hai hình cùng loại; hình nhỏ có vùng chạm nới', () => {
  for (const pic of PICTURES) {
    for (const s of pic.shapes) {
      const [, , w, h] = bbox(s);
      if (s.kind === 'square') assert.equal(w, h, `${pic.id}.${s.id}`);
      if (s.kind === 'rectangle') assert.ok(Math.max(w, h) / Math.min(w, h) >= RECT_RATIO, `${pic.id}.${s.id}: ${w}×${h}`);
      assert.ok(Math.min(w, h) >= MIN_SIDE_HARD, `${pic.id}.${s.id} nhỏ quá`);
      if (Math.min(w, h) < MIN_SIDE) assert.match(hitPadSvg(s), /sc-pad/, `${pic.id}.${s.id} cần vùng chạm nới`);
      else assert.equal(hitPadSvg(s), '');
      for (const o of pic.shapes) {
        if (o === s || o.kind !== s.kind) continue;
        assert.ok(!inside(bbox(s), bbox(o)), `${pic.id}: ${s.id} nằm trong ${o.id} (cùng loại ${s.kind})`);
      }
    }
  }
});

test('đáp án đếm từ hình vẽ, đúng ví dụ thuyền (3 tam giác); mức 1 hỏi 1–5 loại tròn / vuông / tam giác, mức 2 đến 10', () => {
  const boat = PICTURE_BY_ID.get('boat');
  assert.equal(countOf(boat, 'triangle'), 3);
  assert.equal(countOf(boat, 'circle'), 2);
  for (const level of [1, 2]) {
    const pool = questionPool(level);
    assert.ok(pool.length >= 8, `mức ${level}: ${pool.length} câu`);
    for (const q of pool) {
      assert.equal(q.n, countOf(PICTURE_BY_ID.get(q.picture), q.kind));
      assert.ok(q.n >= 1 && q.n <= maxAnswer(level), `${q.picture}.${q.kind} = ${q.n}`);
      assert.ok(KINDS[q.kind].level <= level, `${q.picture}: ${q.kind} chưa tới mức ${level}`);
    }
  }
  assert.ok(questionPool(1).every((q) => ['circle', 'square', 'triangle'].includes(q.kind)));
  const kinds2 = new Set(questionPool(2).map((q) => q.kind));
  for (const k of ['rectangle', 'star', 'heart']) assert.ok(kinds2.has(k), `mức 2 thiếu ${k}`);
  // Mọi tranh đều được hỏi ở ít nhất một mức.
  for (const pic of PICTURES) assert.ok(questionPool(1).concat(questionPool(2)).some((q) => q.picture === pic.id), pic.id);
});

test('chọn câu: 5 câu, mức 1 không lặp tranh, không quá 2 câu cùng đáp án, có đủ 3 loại hình; mức 2 hỏi 2 loại liền trên một tranh', () => {
  for (let i = 0; i < 40; i++) {
    const qs = buildShapeQuestions(1);
    assert.equal(qs.length, 5);
    assert.equal(new Set(qs.map((q) => q.picture)).size, 5);
    const byN = qs.reduce((m, q) => m.set(q.n, (m.get(q.n) ?? 0) + 1), new Map());
    assert.ok([...byN.values()].every((c) => c <= 2));
    assert.equal(new Set(qs.map((q) => q.kind)).size, 3);
  }
  for (let i = 0; i < 40; i++) {
    const qs = buildShapeQuestions(2);
    assert.equal(qs.length, 5);
    assert.ok(qs.some((q, k) => k && qs[k - 1].picture === q.picture), 'mức 2 có tranh hỏi 2 loại');
    // Tranh không lặp lại sau khi đã chuyển sang tranh khác.
    const order = qs.map((q) => q.picture).filter((p, k, a) => p !== a[k - 1]);
    assert.equal(new Set(order).size, order.length);
  }
  // Ưu tiên số ít sao: số 3 nhiều sao thì ít bị hỏi.
  const mastery = new Map([[1, 0], [2, 0], [3, 5], [4, 0], [5, 0]]);
  let threes = 0;
  for (let i = 0; i < 30; i++) threes += buildShapeQuestions(1, mastery).filter((q) => q.n === 3).length;
  assert.ok(threes < 30 * 2, `số 3 bị hỏi ${threes} lần`);
});

test('câu nói: số ít / số nhiều, mạo từ, danh từ số nhiều của tranh', () => {
  assert.deepEqual(lookLine(PICTURE_BY_ID.get('boat')), ['Look! A boat!', 'Nhìn này! Cái thuyền!']);
  assert.deepEqual(lookLine(PICTURE_BY_ID.get('trees')), ['Look! Trees!', 'Nhìn này! Rừng thông!']);
  assert.deepEqual(howManyLine('triangle'), ['How many triangles?', 'Có bao nhiêu hình tam giác?']);
  assert.deepEqual(otherShapeLine('circle'), ["That's a circle!", 'Đó là hình tròn!']);
  assert.deepEqual(thisIsLine('triangle'), ['This is a triangle!', 'Đây là hình tam giác!']);
  assert.deepEqual(findOneLine('square'), ['Find a square!', 'Tìm hình vuông nào!']);
  assert.deepEqual(againLine(2), ["That's two!", 'Hình này là số 2!']);
  assert.deepEqual(totalLine('triangle', 3), ['Three triangles! Great counting!', 'Ba hình tam giác! Con đếm giỏi quá!']);
  assert.deepEqual(totalLine('circle', 1), ['One circle! Great counting!', 'Một hình tròn! Con đếm giỏi quá!']);
});

test('mức: tự lên 2 sau 3 lượt; khóa mức thì giữ; dữ liệu hỏng về mức 1', () => {
  let s = cleanShapeState(null);
  assert.deepEqual(s, { level: 1, rounds: 0, lock: null, seen: [] });
  s = afterShapeRound(afterShapeRound(s));
  assert.equal(s.level, 1);
  s = afterShapeRound(s);
  assert.deepEqual([s.level, s.rounds], [2, 0]);
  assert.equal(afterShapeRound(afterShapeRound(afterShapeRound(cleanShapeState({ lock: 1 })))).level, 1);
  assert.deepEqual(cleanShapeState({ level: 9, rounds: -3, lock: 'x', seen: ['circle', 'blob'] }), { level: 1, rounds: 0, lock: null, seen: ['circle'] });
  assert.equal(cleanShapeState({ level: 1, lock: 2 }).level, 2);
});

test('tranh SVG có mọi hình (data-shape) và nét trang trí không chạm được', () => {
  for (const pic of PICTURES) {
    const svg = pictureSvg(pic);
    for (const s of pic.shapes) assert.match(svg, new RegExp(`data-shape="${s.id}" data-kind="${s.kind}"`));
    assert.match(svg, /pointer-events="none">/);
  }
});
