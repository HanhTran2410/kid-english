// Bông trốn tìm (SPEC-hide.md): dữ liệu phòng, vùng chạm, câu nói, túi giới từ, Bông đoán, tai, prompt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  W, H, PREPS, ROOMS, ROOM_BY_ID, spotAt, spotPoint, earsBox, roomSvg, roomPreps, nextHide, seekPlan, surpriseFor,
  notLine, foundLines, askLine, foundChildLine, surpriseLine, cleanHideState, roomPrompt,
} from '../../app/js/hide-seek.js';

const room = (id) => ROOM_BY_ID.get(id);
const spotOf = (r, id) => room(r).spots.find((s) => s.id === id);

test('5 phòng, mỗi phòng 4–6 chỗ nấp, mã không trùng, đủ in / under / behind, có next to; cụm bắt đầu đúng giới từ', () => {
  assert.deepEqual(ROOMS.map((r) => r.id), ['bedroom', 'living-room', 'kitchen', 'bathroom', 'garden']);
  for (const r of ROOMS) {
    assert.ok(r.spots.length >= 4 && r.spots.length <= 6, `${r.id}: ${r.spots.length}`);
    assert.equal(new Set(r.spots.map((s) => s.id)).size, r.spots.length, r.id);
    for (const p of ['in', 'under', 'behind', 'next to']) assert.ok(r.spots.some((s) => s.prep === p), `${r.id} thiếu ${p}`);
    for (const s of r.spots) {
      assert.ok(PREPS.includes(s.prep), `${r.id}.${s.id}`);
      assert.ok(s.phrase.startsWith(`${s.prep} the `), `${r.id}.${s.id}: ${s.phrase}`);
      assert.ok(s.phraseVi && s.thing && s.thingVi && s.emoji, `${r.id}.${s.id}`);
      assert.ok(['top', 'bottom', 'left', 'right'].includes(s.peek), `${r.id}.${s.id}`);
    }
    assert.ok(r.surprises.length >= 3, r.id);
  }
});

test('vùng chạm: ô nằm trong 400×300, không trùng nhau hoàn toàn, ô nào cũng còn chỗ chạm được; ô nhỏ hơn thắng', () => {
  for (const r of ROOMS) {
    const seen = new Set();
    for (const s of r.spots) {
      const [x, y, w, h] = s.rect;
      assert.ok(x >= 0 && y >= 0 && x + w <= W && y + h <= H, `${r.id}.${s.id} ra ngoài khung`);
      assert.ok(!seen.has(s.rect.join()), `${r.id}.${s.id} trùng ô`);
      seen.add(s.rect.join());
      const p = spotPoint(r, s.id);
      assert.ok(p, `${r.id}.${s.id} bị che hết`);
      assert.equal(spotAt(r, p.x, p.y).id, s.id);
    }
  }
  // Chăn nằm trên giường: chạm chăn là chăn, chạm chân giường là giường.
  assert.equal(spotAt(room('bedroom'), 210, 175).id, 'blanket');
  assert.equal(spotAt(room('bedroom'), 140, 230).id, 'bed');
  assert.equal(spotAt(room('bedroom'), 5, 295), null);
});

test('tai: luôn nằm trong khung tranh, đặt theo phía thò ra', () => {
  for (const r of ROOMS) {
    for (const s of r.spots) {
      const [x, y, w, h] = earsBox(s);
      assert.ok(x >= 0 && y >= 0 && x + w <= W && y + h <= H, `${r.id}.${s.id}`);
    }
  }
  const bed = spotOf('bedroom', 'bed');
  assert.ok(earsBox(bed)[1] > bed.rect[1] + bed.rect[3] / 2, 'dưới gầm giường: tai ở mép dưới');
  const box = spotOf('bedroom', 'box');
  assert.ok(earsBox(box)[1] < box.rect[1], 'trong hộp: tai mọc lên trên hộp');
});

test('câu nói đúng cho mọi chỗ của 5 phòng: nhầm, tìm thấy, Bông hỏi có tên / không tên, Bông thấy bé', () => {
  for (const r of ROOMS) {
    for (const s of r.spots) {
      assert.deepEqual(notLine(s), [`Not ${s.phrase}!`, `Không phải ${s.phraseVi}!`]);
      assert.deepEqual(foundLines(s)[1], [`I'm ${s.phrase}!`, `Bông trốn ${s.phraseVi}!`]);
      assert.deepEqual(askLine(s, 'Na'), [`Is Na ${s.phrase}?`, `Na có trốn ${s.phraseVi} không?`]);
      assert.deepEqual(askLine(s, ''), [`Are you ${s.phrase}?`, `Con có trốn ${s.phraseVi} không?`]);
      assert.deepEqual(foundChildLine(s), [`Found you! You're ${s.phrase}!`, `Tìm thấy rồi! Con trốn ${s.phraseVi}!`]);
    }
  }
  const bed = spotOf('bedroom', 'bed');
  assert.deepEqual(notLine(bed, true), ['Not under the bed! Hee hee!', 'Không phải dưới gầm giường!']);
  assert.deepEqual(foundLines(bed)[0], ['Peekaboo! You found me!', 'Ú òa! Con tìm thấy Bông rồi!']);
  assert.deepEqual(askLine(spotOf('living-room', 'tv'), '  '), ['Are you next to the TV?', 'Con có trốn cạnh cái ti vi không?']);
  assert.deepEqual(surpriseLine(room('bedroom').surprises[2]), ['A cat!', 'Con mèo!']);
});

test('túi giới từ: không trùng chỗ hai lượt liền (kể cả lúc đổ túi), giới từ nào cũng gặp đều; đổi phòng thì túi mới', () => {
  for (const r of ROOMS) {
    const k = roomPreps(r).length;
    let state = { bag: [], last: null };
    const preps = [];
    for (let i = 0; i < 60; i++) {
      const { spot, bag } = nextHide(r, state);
      assert.notEqual(spot.id, state.last, `${r.id} lặp chỗ ở lượt ${i}`);
      preps.push(spot.prep);
      state = { bag, last: spot.id };
    }
    // Mọi đoạn 2k lượt liên tiếp đều có đủ các giới từ của phòng.
    for (let i = 0; i + 2 * k <= preps.length; i++) {
      const win = new Set(preps.slice(i, i + 2 * k));
      for (const p of roomPreps(r)) assert.ok(win.has(p), `${r.id}: thiếu ${p} trong đoạn ${i}`);
    }
    // Vòng túi đầu tiên: mỗi giới từ đúng một lần.
    assert.equal(new Set(preps.slice(0, k)).size, k, r.id);
  }
  // Túi của phòng khác: giới từ không có trong phòng bị bỏ.
  const { bag } = nextHide(room('kitchen'), { bag: ['xyz', 'in'], last: null }, () => 0);
  assert.ok(!bag.includes('xyz'));
});

test('Bông đi tìm bé: 0–2 chỗ sai khác nhau, chỗ cuối luôn đúng; tối đa 3 chỗ', () => {
  for (let i = 0; i < 50; i++) {
    const plan = seekPlan(room('bedroom'), 'box');
    assert.ok(plan.length >= 1 && plan.length <= 3);
    assert.equal(plan.at(-1).id, 'box');
    assert.equal(new Set(plan.map((s) => s.id)).size, plan.length);
  }
  assert.equal(seekPlan(room('bedroom'), 'box', () => 0).length, 1);
  assert.equal(seekPlan(room('bedroom'), 'box', () => 0.99).length, 3);
});

test('bất ngờ: không lặp trong lượt, hết thì xoay vòng; cài đặt hỏng về mặc định (Dễ, đếm 5)', () => {
  const r = room('bedroom');
  assert.deepEqual([0, 1, 2, 3].map((k) => surpriseFor(r, k, 1).id), ['sock', 'cat', 'teddy', 'sock']);
  assert.deepEqual(cleanHideState(null), { room: 'bedroom', level: 'easy', count: 5, rounds: 0 });
  assert.deepEqual(cleanHideState({ room: 'garden', level: 'normal', count: 10, rounds: 4 }), { room: 'garden', level: 'normal', count: 10, rounds: 4 });
  assert.deepEqual(cleanHideState({ room: 'moon', level: 'x', count: 7, rounds: -2 }), { room: 'bedroom', level: 'easy', count: 5, rounds: 0 });
});

test('tranh SVG vẽ mọi đồ vật; prompt ảnh phòng nêu đủ đồ vật + vị trí %, không chữ, không con vật', () => {
  for (const r of ROOMS) {
    assert.ok(roomSvg(r).length > 500, r.id);
    const p = roomPrompt(r);
    for (const s of r.spots) assert.match(p, new RegExp(`${s.thing}: x = \\d+%–\\d+%, y = \\d+%–\\d+%`, 'i'), `${r.id}.${s.id}`);
    assert.match(p, /NEVER write any text/);
    assert.match(p, /No people, no animals/);
    assert.match(roomPrompt(r, { reference: true }), /REFERENCE LAYOUT IMAGE/);
  }
});
