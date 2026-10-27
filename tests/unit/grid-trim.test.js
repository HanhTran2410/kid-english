// Ảnh lưới cảnh (SPEC-art): khung phần có hình của một ô — để bỏ lề trắng không đều do AI vẽ ô lệch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contentBox, innerBox } from '../../app/js/image.js';

/** Ảnh RGBA trắng w × h, tô màu ô chữ nhật [x0, x1) × [y0, y1). */
function img(w, h, rect) {
  const a = new Uint8ClampedArray(w * h * 4).fill(255);
  if (rect) {
    for (let y = rect[1]; y < rect[3]; y++) for (let x = rect[0]; x < rect[2]; x++) {
      const i = (y * w + x) * 4;
      a[i] = 200; a[i + 1] = 60; a[i + 2] = 60;
    }
  }
  return a;
}

test('contentBox: khung đúng phần có hình (có đệm), cả ảnh trắng → null, điểm gần trắng / trong suốt không tính', () => {
  assert.deepEqual(contentBox(img(100, 100, [20, 30, 60, 80]), 100, 100, { pad: 0 }), { x: 20, y: 30, w: 40, h: 50 });
  assert.deepEqual(contentBox(img(100, 100, [20, 30, 60, 80]), 100, 100, { pad: 0.02 }), { x: 18, y: 28, w: 44, h: 54 });
  assert.equal(contentBox(img(50, 40), 50, 40), null);
  // Đệm không vượt mép ảnh.
  assert.deepEqual(contentBox(img(100, 100, [0, 0, 100, 100]), 100, 100), { x: 0, y: 0, w: 100, h: 100 });
  // Điểm gần trắng (≥ 235) và điểm trong suốt bị bỏ qua.
  const a = img(10, 10);
  a[(5 * 10 + 5) * 4] = 240; a[(5 * 10 + 5) * 4 + 1] = 240; a[(5 * 10 + 5) * 4 + 2] = 240;
  a[(2 * 10 + 2) * 4] = 0; a[(2 * 10 + 2) * 4 + 3] = 0;
  assert.equal(contentBox(a, 10, 10), null);
});

test('innerBox: ô có khung thẻ (viền + hình nhỏ bên trong) → lấy khung hình bên trong; ảnh tràn kín ô → giữ khung cũ', () => {
  // Thẻ 100 × 100: viền xám 2px ở mép, hình đỏ nhỏ 30..70.
  const w = 100;
  const a = new Uint8ClampedArray(w * w * 4).fill(250);
  for (let i = 3; i < a.length; i += 4) a[i] = 255;
  const paint = (x, y, v) => { const i = (y * w + x) * 4; a[i] = v[0]; a[i + 1] = v[1]; a[i + 2] = v[2]; };
  for (let k = 0; k < w; k++) for (const t of [0, 1, 98, 99]) { paint(k, t, [180, 180, 180]); paint(t, k, [180, 180, 180]); }
  for (let y = 30; y < 70; y++) for (let x = 30; x < 70; x++) paint(x, y, [220, 40, 40]);
  const outer = contentBox(a, w, w, { pad: 0 });
  assert.deepEqual(outer, { x: 0, y: 0, w: 100, h: 100 });
  const inner = innerBox(a, w, w, outer);
  assert.ok(inner.x >= 26 && inner.y >= 26 && inner.x + inner.w <= 74 && inner.y + inner.h <= 74, JSON.stringify(inner));
  // Ảnh tràn kín ô (không có khung) → giữ nguyên.
  const full = new Uint8ClampedArray(w * w * 4).fill(120);
  assert.deepEqual(innerBox(full, w, w, { x: 0, y: 0, w: 100, h: 100 }), { x: 0, y: 0, w: 100, h: 100 });
  assert.equal(innerBox(full, w, w, null), null);
});
