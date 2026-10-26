// Ảnh lưới cảnh (SPEC-art): khung phần có hình của một ô — để bỏ lề trắng không đều do AI vẽ ô lệch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contentBox } from '../../app/js/image.js';

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
