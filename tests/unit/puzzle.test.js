// Ghép hình cùng Bông (SPEC-puzzle.md): dữ liệu 10 hình, điểm neo + bán kính hút, lưới, số mảnh theo bộ đếm,
// cắt vuông, câu nói.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PICTURE_BY_ID } from '../../app/js/coloring.js';
import {
  PART_PUZZLES, partPuzzle, judgeDrop, gridCells, piecesForNext, cleanPuzzleState, afterDone, cropSquare, withArticle,
  makeLine, whereLine, yesPartLine, doneLine, familyDoneLine, cleanPuzzlePhotos,
} from '../../app/js/puzzle.js';

test('25 hình ghép bộ phận: mảnh / vẽ sẵn là bộ phận có thật, phủ đủ các phần; mỗi mảnh ≥ 20/200; bỏ mặt trời', () => {
  assert.equal(PART_PUZZLES.length, 25);
  assert.ok(!PART_PUZZLES.some((p) => p.picture === 'sun'));
  for (const def of PART_PUZZLES) {
    const pic = PICTURE_BY_ID.get(def.picture);
    const ids = pic.parts.map((p) => p.id);
    for (const id of [...def.order, ...def.fixed]) assert.ok(ids.includes(id), `${def.picture}.${id}`);
    assert.deepEqual([...def.order, ...def.fixed].sort(), [...ids].sort(), `${def.picture}: mỗi bộ phận là mảnh hoặc vẽ sẵn`);
    assert.equal(new Set(def.order).size, def.order.length);
    for (const id of def.order) {
      const [x, y, w, h] = def.box[id];
      assert.ok(Math.min(w, h) >= 20, `${def.picture}.${id} nhỏ quá: ${w}×${h}`);
      assert.ok(x >= 0 && y >= 0 && x + w <= 200 && y + h <= 200, `${def.picture}.${id}`);
      assert.ok(!pic.parts.find((p) => p.id === id).line, `${def.picture}.${id} là nét`);
    }
  }
  // Cuống hoa 10/200 → vẽ sẵn.
  assert.ok(PART_PUZZLES.find((p) => p.picture === 'flower').fixed.includes('stem'));
});

test('xe hơi: mảnh thân xe gọi là "body / thân xe"; does / do theo số ít / nhiều', () => {
  const car = partPuzzle('car');
  const body = car.pieces.find((p) => p.id === 'car');
  assert.equal(body.en, 'body');
  assert.equal(body.vi, 'thân xe');
  assert.deepEqual(whereLine(body), ['Where does the body go?', 'Thân xe ở đâu nhỉ?']);
  assert.deepEqual(whereLine(car.pieces.find((p) => p.id === 'wheels')), ['Where do the wheels go?', 'Bánh xe ở đâu nhỉ?']);
  const fly = partPuzzle('butterfly');
  assert.deepEqual(whereLine(fly.pieces.find((p) => p.id === 'wings')), ['Where do the wings go?', 'Cái cánh ở đâu nhỉ?']);
  assert.deepEqual(yesPartLine(fly.pieces.find((p) => p.id === 'head')), ['Yes! The head!', 'Đúng rồi! Cái đầu!']);
  assert.deepEqual(makeLine(fly.pic), ["Let's make a butterfly!", 'Mình ghép con bướm nhé!']);
  assert.deepEqual(doneLine(fly.pic), ["Wow! It's a butterfly!", 'Oa! Con bướm đây rồi!']);
  assert.deepEqual(doneLine(partPuzzle('ice-cream').pic), ["Wow! It's an ice cream!", 'Oa! Cây kem đây rồi!']);
});

test('điểm neo: chỉ khớp ở chỗ của CHÍNH mảnh; vào chỗ trống của mảnh khác là sai; ngoài mọi bán kính là không tính', () => {
  const targets = partPuzzle('flower').pieces.map((p) => ({ ...p, placed: false }));
  const petals = targets.find((t) => t.id === 'petals');
  const middle = targets.find((t) => t.id === 'middle');
  // Nhụy và cánh hoa trùng tâm: kéo cái nào vào giữa cũng đúng cái đó, không nhầm.
  assert.equal(judgeDrop(targets, 'middle', middle.anchor), 'right');
  assert.equal(judgeDrop(targets, 'petals', middle.anchor), 'right');
  const leaves = targets.find((t) => t.id === 'leaves');
  assert.equal(judgeDrop(targets, 'middle', leaves.anchor), 'wrong');
  assert.equal(judgeDrop(targets, 'middle', { x: 5, y: 195 }), 'none');
  // Chỗ đã có mảnh thì không còn là "chỗ trống của mảnh khác".
  leaves.placed = true;
  assert.equal(judgeDrop(targets, 'middle', leaves.anchor), 'none');
  assert.ok(petals.radius >= 28);
});

test('lưới 2 / 4 / 6 / 9: đúng số mảnh, phủ kín khung, không chồng; 6 mảnh là 2 cột × 3 hàng', () => {
  for (const n of [2, 4, 6, 9]) {
    const cells = gridCells(n);
    assert.equal(cells.length, n);
    const area = cells.reduce((s, c) => s + c.box[2] * c.box[3], 0);
    assert.ok(Math.abs(area - 1) < 1e-9, `${n}: phủ kín`);
    for (const a of cells) {
      for (const b of cells) {
        if (a === b) continue;
        const overlapX = Math.min(a.box[0] + a.box[2], b.box[0] + b.box[2]) - Math.max(a.box[0], b.box[0]);
        const overlapY = Math.min(a.box[1] + a.box[3], b.box[1] + b.box[3]) - Math.max(a.box[1], b.box[1]);
        assert.ok(overlapX <= 1e-9 || overlapY <= 1e-9, `${n}: ${a.id} chồng ${b.id}`);
      }
    }
    // Thả đúng tâm ô của mảnh đó là đúng; tâm ô bên cạnh là sai.
    const t = cells.map((c) => ({ ...c, placed: false }));
    assert.equal(judgeDrop(t, t[0].id, t[0].anchor), 'right');
    assert.equal(judgeDrop(t, t[0].id, t[1].anchor), 'wrong');
  }
  assert.deepEqual([gridCells(6)[0].cols, gridCells(6)[0].rows], [2, 3]);
});

test('số mảnh tranh kế tiếp: 2 tranh 2 mảnh → 4 tranh 4 mảnh → 5 tranh 6 mảnh → 9; khóa mức vẫn đếm', () => {
  let s = cleanPuzzleState(null);
  assert.deepEqual(s, { mode: 'parts', gridDone: { 2: 0, 4: 0, 6: 0, 9: 0 }, lock: null, done: {} });
  const seq = [];
  for (let i = 0; i < 13; i++) {
    const n = piecesForNext(s);
    seq.push(n);
    s = afterDone(s, `grid:svg:x${i}`, n);
  }
  assert.deepEqual(seq, [2, 2, 4, 4, 4, 4, 6, 6, 6, 6, 6, 9, 9]);
  // Tranh 2 mảnh chỉ tăng bộ đếm 2.
  const two = afterDone(cleanPuzzleState(null), 'k', 2);
  assert.deepEqual(two.gridDone, { 2: 1, 4: 0, 6: 0, 9: 0 });
  assert.deepEqual(two.done, { k: true });
  // Khóa mức: số mảnh theo mức, bộ đếm vẫn tăng; mở khóa thì tính lại theo bộ đếm.
  let locked = { ...cleanPuzzleState(null), lock: 1 };
  assert.equal(piecesForNext(locked), 2);
  locked = afterDone(afterDone(locked, 'a', 2), 'b', 2);
  assert.equal(piecesForNext(locked), 4);
  for (let i = 0; i < 6; i++) locked = afterDone(locked, `c${i}`, 4);
  assert.equal(piecesForNext(locked), 4, 'khóa mức 1: vẫn 4 mảnh');
  assert.equal(locked.gridDone[4], 6);
  assert.equal(piecesForNext({ ...locked, lock: null }), 6);
  assert.equal(piecesForNext({ ...locked, lock: 3 }), 9);
  // Ghép bộ phận: chỉ đánh dấu ✨, không đụng bộ đếm.
  assert.deepEqual(afterDone(cleanPuzzleState(null), 'parts:cat').gridDone, { 2: 0, 4: 0, 6: 0, 9: 0 });
  assert.deepEqual(cleanPuzzleState({ mode: 'grid', gridDone: { 2: -1, 4: 'x' }, lock: 7, done: { a: true, b: 1 } }),
    { mode: 'grid', gridDone: { 2: 0, 4: 0, 6: 0, 9: 0 }, lock: null, done: { a: true } });
});

test('cắt vuông: ảnh dọc / ngang theo đầu / giữa / cuối', () => {
  assert.deepEqual(cropSquare(600, 1000, 'start'), { sx: 0, sy: 0, size: 600 });
  assert.deepEqual(cropSquare(600, 1000, 'center'), { sx: 0, sy: 200, size: 600 });
  assert.deepEqual(cropSquare(600, 1000, 'end'), { sx: 0, sy: 400, size: 600 });
  assert.deepEqual(cropSquare(1000, 600, 'start'), { sx: 0, sy: 0, size: 600 });
  assert.deepEqual(cropSquare(1000, 600, 'end'), { sx: 400, sy: 0, size: 600 });
  assert.deepEqual(cropSquare(500, 500, 'end'), { sx: 0, sy: 0, size: 500 });
});

test('câu ghép xong: mạo từ a / an, số nhiều, không đếm được, tiếng kêu; gia đình; không có tên', () => {
  assert.equal(withArticle('cow'), 'a cow');
  assert.equal(withArticle('apple'), 'an apple');
  assert.equal(withArticle('milk'), 'milk');
  assert.deepEqual(doneLine({ en: 'cow', vi: 'con bò', sound: 'Moo moo!' }), ["Wow! It's a cow! Moo moo!", 'Oa! Con bò đây rồi!']);
  assert.deepEqual(doneLine({ en: 'grapes', vi: 'chùm nho' }), ["Wow! They're grapes!", 'Oa! Chùm nho đây rồi!']);
  assert.deepEqual(doneLine({ en: '', vi: '' }), ['Wow! You did it!', 'Oa! Con ghép xong rồi!']);
  assert.deepEqual(familyDoneLine({ id: 'mummy', en: 'Mummy', vi: 'Mẹ' }), ["Wow! It's Mummy!", 'Oa! Mẹ đây rồi!']);
  assert.deepEqual(familyDoneLine({ id: 'me', en: 'you', vi: 'con' }), ["Wow! It's you!", 'Oa! Con đây rồi!']);
});

test('ảnh bố mẹ thêm: bỏ mục hỏng / trùng mã, vị trí cắt mặc định giữa', () => {
  assert.deepEqual(cleanPuzzlePhotos([
    { id: 'p-1', en: 'Rainbow ', vi: 'cầu vồng', crop: 'start' }, { id: 'p-1', en: 'x' }, { id: 'bad', en: 'y' }, null, { id: 'p-2', crop: 'zzz' },
  ]), [{ id: 'p-1', en: 'Rainbow', vi: 'cầu vồng', crop: 'start' }, { id: 'p-2', en: '', vi: '', crop: 'center' }]);
  assert.deepEqual(cleanPuzzlePhotos('hỏng'), []);
});
