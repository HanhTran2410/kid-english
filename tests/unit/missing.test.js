// Tìm đồ còn thiếu (SPEC-missing.md): bố cục tranh, chọn đồ thiếu / đồ nhiễu, nhận đúng / sai, câu nói, mức, prompt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENES } from '../../app/js/sticker-scenes.js';
import {
  W, H, LEVELS, PICTURES, PICTURE_BY_ID, OWN_SCENES, sceneOf, itemOf, pickMissing, pickDistractors, roundPictures, judgeDrop,
  cleanMissingState, afterMissingRound, near, dropRadius, withArticle, yesLine, nameLine, notBelongLine, allBackLine, ownScenePrompt,
} from '../../app/js/missing.js';

test('13 tranh (9 cảnh Dán tranh + 4 cảnh riêng); đồ vật có thật trong cảnh, trong khung, không chồng nhau, đủ to', () => {
  assert.equal(PICTURES.length, 13);
  assert.equal(OWN_SCENES.length, 4);
  assert.deepEqual(PICTURES.filter((p) => sceneOf(p.scene).own).map((p) => p.scene).sort(), ['bath', 'meal', 'picnic', 'study']);
  for (const p of PICTURES) {
    const sc = sceneOf(p.scene);
    assert.ok(sc, p.id);
    assert.ok(p.items.length >= 5, `${p.id}: ${p.items.length} đồ`);
    assert.equal(new Set(p.items.map((s) => s.item)).size, p.items.length, `${p.id}: trùng đồ`);
    for (const s of p.items) {
      assert.ok(itemOf(sc, s.item), `${p.id}: ${s.item} không có trong cảnh ${sc.id}`);
      assert.ok(s.size >= 36, `${p.id}.${s.item} nhỏ quá`);
      assert.ok(s.x - s.size / 2 >= 0 && s.y - s.size / 2 >= 0 && s.x + s.size / 2 <= W && s.y + s.size / 2 <= H, `${p.id}.${s.item} ra ngoài khung`);
      for (const o of p.items) {
        if (o === s) continue;
        assert.ok(Math.hypot(s.x - o.x, s.y - o.y) >= (s.size + o.size) / 2 * 0.85, `${p.id}: ${s.item} đè ${o.item}`);
      }
    }
  }
});

test('đồ thiếu theo mức (1 / 2 / 3): không trùng tên, không sát nhau, ưu tiên đồ bé ít gặp', () => {
  for (const level of [1, 2, 3]) {
    for (const p of PICTURES) {
      for (let i = 0; i < 10; i++) {
        const miss = pickMissing(p, LEVELS[level].missing);
        assert.equal(miss.length, LEVELS[level].missing, `${p.id} mức ${level}`);
        const sc = sceneOf(p.scene);
        assert.equal(new Set(miss.map((s) => itemOf(sc, s.item).name)).size, miss.length);
        for (const a of miss) for (const b of miss) if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 1.2 * (a.size + b.size) / 2, `${p.id}: ${a.item} sát ${b.item}`);
      }
    }
  }
  // Không đủ đồ thỏa "không sát nhau" thì chọn ít hơn, không chọn bóng sát nhau.
  const tight = { id: 't', scene: 'kitchen', items: [{ item: 'cup', x: 100, y: 100, size: 50 }, { item: 'spoon', x: 140, y: 100, size: 50 }, { item: 'apple', x: 120, y: 140, size: 50 }] };
  assert.equal(pickMissing(tight, 3).length, 1);
  assert.equal(near({ x: 0, y: 0, size: 50 }, { x: 59, y: 0, size: 50 }), true);
  assert.equal(near({ x: 0, y: 0, size: 50 }, { x: 60, y: 0, size: 50 }), false);
  // Bé đã gặp nhiều mọi đồ trừ "spoon" → thìa luôn bị chọn.
  const meal = PICTURE_BY_ID.get('kitchen-meal');
  const seen = new Map(meal.items.map((s) => [itemOf(sceneOf('kitchen'), s.item).name, 9]));
  seen.set('spoon', 0);
  for (let i = 0; i < 10; i++) assert.equal(pickMissing(meal, 1, { seen })[0].item, 'spoon');
});

test('đồ nhiễu: luôn từ cảnh khác, không trùng tên với đồ trong tranh, không trùng nhau', () => {
  for (const p of PICTURES) {
    const sc = sceneOf(p.scene);
    const names = new Set(p.items.map((s) => itemOf(sc, s.item).name));
    for (let i = 0; i < 10; i++) {
      const dis = pickDistractors(p, 2);
      assert.equal(dis.length, 2);
      assert.ok(dis.every((x) => x.scene !== sc.id && !names.has(x.name)), p.id);
      assert.notEqual(dis[0].name, dis[1].name);
    }
  }
  assert.deepEqual(pickDistractors(PICTURES[0], 0), []);
  assert.ok([...SCENES, ...OWN_SCENES].length >= 11);
});

test('nhận đúng / sai / không tính: đúng ở bóng của chính đồ đó; vào bóng khác là sai; đồ nhiễu thả trong tranh là sai', () => {
  const holes = [{ key: 'spoon', x: 232, y: 152, size: 42, filled: false }, { key: 'cup', x: 186, y: 152, size: 44, filled: false }];
  assert.equal(judgeDrop(holes, 'spoon', { x: 236, y: 150 }), 'right');
  assert.equal(judgeDrop(holes, 'spoon', { x: 186, y: 152 }), 'wrong');
  assert.equal(judgeDrop(holes, 'spoon', { x: 40, y: 280 }), 'none');
  assert.equal(judgeDrop(holes, 'x:sock', { x: 232, y: 152 }, true), 'wrong');
  assert.equal(judgeDrop(holes, 'x:sock', { x: 420, y: 150 }, true), 'none');
  // Vùng nhận chồng nhau: bóng gần nhất (chuẩn hóa theo bán kính) quyết định, không phải thứ tự mảng.
  const overlap = [{ key: 'b', x: 230, y: 150, size: 60, filled: false }, { key: 'a', x: 200, y: 150, size: 60, filled: false }];
  assert.equal(dropRadius(60), 28);
  assert.equal(judgeDrop(overlap, 'a', { x: 212, y: 150 }), 'right');
  assert.equal(judgeDrop(overlap, 'b', { x: 212, y: 150 }), 'wrong');
  assert.equal(judgeDrop([...overlap].reverse(), 'a', { x: 212, y: 150 }), 'right');
  // Dạng bóng của màn chơi: { key, filled, slot: { x, y, size } }.
  assert.equal(judgeDrop([{ key: 'spoon', filled: false, slot: { x: 232, y: 152, size: 42 } }], 'spoon', { x: 236, y: 150 }), 'right');
  holes[1].filled = true;
  assert.equal(judgeDrop(holes, 'spoon', { x: 186, y: 152 }), 'none', 'bóng đã có đồ thì không còn là "chỗ của đồ khác"');
});

test('câu nói: mạo từ, danh từ luôn số nhiều, không đếm được; đọc lại tên khi đủ', () => {
  assert.equal(withArticle('spoon'), 'a spoon');
  assert.equal(withArticle('apple'), 'an apple');
  assert.equal(withArticle('socks'), 'socks');
  assert.equal(withArticle('milk'), 'milk');
  assert.deepEqual(yesLine({ name: 'spoon', vi: 'cái thìa' }), ['Yes! The spoon!', 'Đúng rồi! Cái thìa!']);
  assert.deepEqual(nameLine({ name: 'egg' }), ['An egg!', 'Egg!']);
  assert.deepEqual(notBelongLine({ name: 'sock', vi: 'chiếc tất' }), ["That's a sock! It doesn't belong here!", 'Đó là chiếc tất! Không ở đây đâu!']);
  assert.deepEqual(notBelongLine({ name: 'socks' })[0], "Those are socks! They don't belong here!");
  assert.deepEqual(allBackLine([{ name: 'spoon' }, { name: 'cup' }]), ['Spoon! Cup! Everything is back! Great job!', 'Đủ cả rồi! Giỏi quá!']);
});

test('lượt 5 tranh không lặp; mức: lên sau 3 lượt (tối đa 3), khóa mức thì giữ; dữ liệu hỏng về mức 1', () => {
  for (let i = 0; i < 20; i++) {
    const order = roundPictures();
    assert.equal(order.length, 5);
    assert.equal(new Set(order).size, 5);
  }
  let s = cleanMissingState(null);
  assert.deepEqual(s, { level: 1, rounds: 0, lock: null });
  for (let i = 0; i < 3; i++) s = afterMissingRound(s);
  assert.equal(s.level, 2);
  for (let i = 0; i < 3; i++) s = afterMissingRound(s);
  assert.equal(s.level, 3);
  for (let i = 0; i < 3; i++) s = afterMissingRound(s);
  assert.equal(s.level, 3);
  assert.equal(afterMissingRound(afterMissingRound(afterMissingRound(cleanMissingState({ lock: 1 })))).level, 1);
  assert.deepEqual(cleanMissingState({ level: 7, rounds: -1, lock: 'x' }), { level: 1, rounds: 0, lock: null });
});

test('prompt ảnh nền cảnh riêng: chừa trống đúng các chỗ đặt đồ, không vẽ đồ vật, không chữ', () => {
  for (const sc of OWN_SCENES) {
    const p = ownScenePrompt(sc);
    const spots = PICTURES.filter((x) => x.scene === sc.id).flatMap((x) => x.items).length;
    assert.ok((p.match(/^- x = /gm) ?? []).length >= Math.min(spots, 1), sc.id);
    assert.match(p, /NEVER write any text/);
    assert.match(p, /do NOT draw any objects/);
    assert.match(ownScenePrompt(sc, { reference: true }), /REFERENCE LAYOUT IMAGE/);
  }
});
