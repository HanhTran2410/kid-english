// Đếm hình mới (SPEC-shapes2.md): hình mới rõ dáng (phân loại lại từ tọa độ), hình không che nhau, hình thang được hỏi
// đáy dài ở dưới, đáp án đếm từ hình vẽ, chọn câu, câu nói (nhận dạng, đếm góc, nhắc), thẻ mẫu có chấm góc.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  KINDS, PICTURES, PICTURES2, PICTURE_BY_ID, bbox, countOf, questionPool, buildShapeQuestions, classifyShape, containsPoint,
  longBottom, isConfusable, sampleSvg, pictureSvg, maxAnswer, thisIsLine, otherShapeLine, howManyLine, totalLine, idLine, cornerLine,
  remindLine, findOneLine, MIN_SIDE_HARD, POLY_MIN,
} from '../../app/js/shapes.js';

const NEW_KINDS = Object.keys(KINDS).filter((k) => KINDS[k].set === 2);
const inside = (a, b) => a[0] >= b[0] && a[1] >= b[1] && a[0] + a[2] <= b[0] + b[2] && a[1] + a[3] <= b[1] + b[3];
const poly = (kind, points) => ({ id: 'x', kind, points });

test('8 loại hình mới (4 mức 1, 4 mức 2); 14 tranh, mã tranh không trùng với Đếm hình', () => {
  assert.deepEqual(NEW_KINDS, ['oval', 'diamond', 'trapezoid', 'parallelogram', 'pentagon', 'hexagon', 'octagon', 'semicircle']);
  assert.deepEqual(NEW_KINDS.filter((k) => KINDS[k].level === 1), ['oval', 'diamond', 'trapezoid', 'parallelogram']);
  assert.equal(PICTURES2.length, 14);
  assert.equal(PICTURES2.filter((p) => p.ask[1]).length, 9);
  assert.equal(PICTURE_BY_ID.size, PICTURES.length + PICTURES2.length);
  assert.deepEqual({ pentagon: KINDS.pentagon.cornerIntro, hexagon: KINDS.hexagon.cornerIntro, octagon: KINDS.octagon.cornerIntro }, { pentagon: 5, hexagon: 6, octagon: 8 });
});

test('phân loại lại: mọi hình trong tranh mới đúng loại đã ghi; nằm trong khung; không quá nhỏ', () => {
  for (const pic of PICTURES2) {
    assert.equal(new Set(pic.shapes.map((s) => s.id)).size, pic.shapes.length, pic.id);
    for (const s of pic.shapes) {
      assert.equal(classifyShape(s), s.kind, `${pic.id}.${s.id}`);
      const [x, y, w, h] = bbox(s);
      assert.ok(x >= 0 && y >= 0 && x + w <= 200 && y + h <= 200, `${pic.id}.${s.id} ra ngoài khung`);
      assert.ok(Math.min(w, h) >= MIN_SIDE_HARD, `${pic.id}.${s.id} nhỏ quá`);
      if (KINDS[s.kind].cornerIntro) assert.ok(Math.min(w, h) >= POLY_MIN, `${pic.id}.${s.id} nhỏ, khó thấy góc`);
    }
  }
});

test('phân loại lại: ca âm — vuông xoay 45° vẫn là vuông, hình "lưng chừng" bị loại', () => {
  assert.equal(classifyShape(poly('diamond', [[50, 10], [90, 50], [50, 90], [10, 50]])), 'square');
  // Bình hành nghiêng 10° (gần chữ nhật), nghiêng 30° nhưng gần hình thoi.
  const lean = (deg, w, h) => {
    const dx = h * Math.tan((deg * Math.PI) / 180);
    return poly('parallelogram', [[dx, 0], [dx + w, 0], [w, h], [0, h]]);
  };
  assert.equal(classifyShape(lean(30, 60, 30)), 'parallelogram');
  assert.equal(classifyShape(lean(10, 60, 30)), null);
  assert.equal(classifyShape(lean(30, 36, 30)), null);
  // Thang: đáy trên 0,9 đáy dưới (gần chữ nhật) / 0,5 (rõ).
  assert.equal(classifyShape(poly('trapezoid', [[5, 0], [95, 0], [100, 50], [0, 50]])), null);
  assert.equal(classifyShape(poly('trapezoid', [[25, 0], [75, 0], [100, 50], [0, 50]])), 'trapezoid');
  // Bầu dục tỉ lệ 1,1 (gần tròn) / 1,5.
  assert.equal(classifyShape({ id: 'x', kind: 'oval', c: [50, 50], rx: 33, ry: 30 }), null);
  assert.equal(classifyShape({ id: 'x', kind: 'oval', c: [50, 50], rx: 45, ry: 30 }), 'oval');
  // Thoi quá "vuông" (đường chéo 1,1).
  assert.equal(classifyShape(poly('diamond', [[50, 6], [90, 50], [50, 94], [10, 50]])), null);
});

test('hình vuông trong tranh mới luôn đặt thẳng; hình thang ở tranh có hỏi thang luôn đáy dài ở dưới', () => {
  for (const pic of PICTURES2) {
    for (const s of pic.shapes.filter((x) => x.kind === 'square')) assert.ok(s.rect, `${pic.id}.${s.id} phải là hình vuông đặt thẳng`);
    const asksTrapezoid = Object.values(pic.ask).some((list) => list.includes('trapezoid'));
    if (!asksTrapezoid) continue;
    for (const s of pic.shapes.filter((x) => x.kind === 'trapezoid')) assert.ok(longBottom(s), `${pic.id}.${s.id} lật ngược`);
  }
});

test('hình không che nhau: tách rời / chạm cạnh, hoặc nằm trọn trong hình vẽ trước nó', () => {
  // Lấy mẫu điểm; "bên trong chắc chắn" = điểm và 4 điểm lân cận 1,5 đều trong hình (bỏ qua cạnh chung).
  const deep = (s, x, y) => [[0, 0], [1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]].every(([dx, dy]) => containsPoint(s, x + dx, y + dy));
  for (const pic of PICTURES2) {
    for (const [i, a] of pic.shapes.entries()) {
      for (const b of pic.shapes.slice(i + 1)) {
        const [ax, ay, aw, ah] = bbox(a);
        const [bx, by, bw, bh] = bbox(b);
        if (ax > bx + bw || bx > ax + aw || ay > by + bh || by > ay + ah) continue;
        let both = 0;
        let bOutside = 0;
        for (let x = Math.floor(bx) + 0.5; x <= bx + bw; x++) {
          for (let y = Math.floor(by) + 0.5; y <= by + bh; y++) {
            if (!deep(b, x, y)) continue;
            if (deep(a, x, y)) both++;
            if (!containsPoint(a, x, y)) bOutside++;
          }
        }
        assert.ok(both === 0 || bOutside === 0, `${pic.id}: ${b.id} che một phần ${a.id}`);
      }
    }
    // Không lồng hai hình cùng loại (như Đếm hình).
    for (const s of pic.shapes) {
      for (const o of pic.shapes) if (o !== s && o.kind === s.kind) assert.ok(!inside(bbox(s), bbox(o)), `${pic.id}: ${s.id} trong ${o.id}`);
    }
  }
});

test('mỗi tranh mức 1 có hình dễ nhầm với loại được hỏi', () => {
  for (const pic of PICTURES2) {
    for (const kind of pic.ask[1] ?? []) assert.ok(pic.shapes.some((s) => isConfusable(kind, s.kind)), `${pic.id}: hỏi ${kind} mà không có hình dễ nhầm`);
  }
  assert.equal(isConfusable('parallelogram', 'rectangle'), true);
  assert.equal(isConfusable('parallelogram', 'circle'), false);
});

test('đáp án đếm từ hình vẽ; mức 1 chỉ hỏi 4 hình mức 1 (đáp án 1–5, đủ 1, 2, 3, 4, 5); mức 2 có đủ 8 hình, đến 10; không hỏi hình cũ', () => {
  assert.equal(countOf(PICTURE_BY_ID.get('racecar'), 'parallelogram'), 3);
  assert.equal(countOf(PICTURE_BY_ID.get('beehive'), 'hexagon'), 7);
  const pool1 = questionPool(1, 2);
  const pool2 = questionPool(2, 2);
  assert.deepEqual([...new Set(pool1.map((q) => q.kind))].sort(), ['diamond', 'oval', 'parallelogram', 'trapezoid']);
  assert.deepEqual([...new Set(pool1.map((q) => q.n))].sort(), [1, 2, 3, 4, 5]);
  assert.deepEqual([...new Set(pool2.map((q) => q.kind))].sort(), [...NEW_KINDS].sort());
  for (const [level, pool] of [[1, pool1], [2, pool2]]) {
    for (const q of pool) {
      assert.equal(q.n, countOf(PICTURE_BY_ID.get(q.picture), q.kind));
      assert.ok(q.n >= 1 && q.n <= maxAnswer(level));
      assert.equal(KINDS[q.kind].set, 2, `${q.picture}: hỏi hình cũ ${q.kind}`);
    }
  }
  // Mức 2 dùng cả 14 tranh; Đếm hình cũ không lẫn tranh mới.
  assert.equal(new Set(pool2.map((q) => q.picture)).size, 14);
  assert.ok(questionPool(2).every((q) => KINDS[q.kind].set === 1 && PICTURES.some((p) => p.id === q.picture)));
});

test('chọn câu: mức 1 không lặp tranh, đủ 4 loại; mức 2 ≥ 2 câu hình mức 2, không quay lại tranh đã dùng', () => {
  for (let i = 0; i < 60; i++) {
    const qs = buildShapeQuestions(1, new Map(), { set: 2 });
    assert.equal(qs.length, 5);
    assert.equal(new Set(qs.map((q) => q.picture)).size, 5);
    assert.equal(new Set(qs.map((q) => q.kind)).size, 4);
    const byN = qs.reduce((m, q) => m.set(q.n, (m.get(q.n) ?? 0) + 1), new Map());
    assert.ok([...byN.values()].every((c) => c <= 2));
  }
  for (let i = 0; i < 60; i++) {
    const qs = buildShapeQuestions(2, new Map(), { set: 2 });
    assert.equal(qs.length, 5);
    assert.ok(qs.filter((q) => KINDS[q.kind].level === 2).length >= 2, JSON.stringify(qs));
    const order = qs.map((q) => q.picture).filter((p, k, a) => p !== a[k - 1]);
    assert.equal(new Set(order).size, order.length);
  }
});

test('câu nói: mạo từ, số ít / nhiều, câu nhận dạng, đếm góc (mẫu chung), câu nhắc', () => {
  assert.deepEqual(thisIsLine('oval'), ['This is an oval!', 'Đây là hình bầu dục!']);
  assert.deepEqual(otherShapeLine('octagon'), ["That's an octagon!", 'Đó là hình bát giác!']);
  assert.deepEqual(findOneLine('hexagon'), ['Find a hexagon!', 'Tìm hình lục giác nào!']);
  assert.deepEqual(howManyLine('semicircle'), ['How many semicircles?', 'Có bao nhiêu nửa hình tròn?']);
  assert.deepEqual(totalLine('octagon', 1), ['One octagon! Great counting!', 'Một hình bát giác! Con đếm giỏi quá!']);
  assert.deepEqual(totalLine('octagon', 3), ['Three octagons! Great counting!', 'Ba hình bát giác! Con đếm giỏi quá!']);
  assert.deepEqual(idLine('diamond'), ['Pointy top, pointy bottom!', 'Nhọn ở trên, nhọn ở dưới!']);
  assert.deepEqual(idLine('trapezoid'), ['Short top, long bottom!', 'Cạnh trên ngắn, cạnh dưới dài!']);
  assert.deepEqual(cornerLine('pentagon'), ['A pentagon has five corners!', 'Hình ngũ giác có năm góc!']);
  assert.deepEqual(cornerLine('hexagon'), ['A hexagon has six corners!', 'Hình lục giác có sáu góc!']);
  assert.deepEqual(cornerLine('octagon'), ['An octagon has eight corners!', 'Hình bát giác có tám góc!']);
  assert.deepEqual(idLine('octagon'), cornerLine('octagon'));
  assert.deepEqual(remindLine('parallelogram'), ['Find the parallelograms! It leans over!', 'Tìm hình bình hành nào! Hình này nghiêng sang một bên!']);
  assert.equal(idLine('circle'), null);
  for (const k of NEW_KINDS) assert.ok(idLine(k), k);
});

test('thẻ mẫu: dáng chuẩn đúng loại; hình nhiều góc có đúng số chấm góc', () => {
  for (const k of NEW_KINDS) {
    const svg = sampleSvg(k);
    assert.match(svg, new RegExp(`data-kind="${k}"`));
    assert.equal((svg.match(/class="sc-corner"/g) ?? []).length, KINDS[k].cornerIntro ?? 0, k);
  }
});

test('tranh SVG có mọi hình (data-shape) — bầu dục là ellipse, nửa tròn là path, đa giác là polygon', () => {
  for (const pic of PICTURES2) {
    const svg = pictureSvg(pic);
    for (const s of pic.shapes) assert.match(svg, new RegExp(`data-shape="${s.id}" data-kind="${s.kind}"`));
  }
  assert.match(pictureSvg(PICTURE_BY_ID.get('eggs')), /<ellipse data-shape="egg1"/);
  assert.match(pictureSvg(PICTURE_BY_ID.get('turtle')), /<path data-shape="shell"[^>]* d="M32 120 A68 68 0 0 1 168 120 Z"/);
});
