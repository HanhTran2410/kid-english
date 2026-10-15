// Dán tranh (SPEC-scenes.md): chỗ trong tranh, câu Bông nói, dọn dữ liệu, Bông giao việc.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCENES, SCENE_BY_ID, SCENE_W, SCENE_H, MAX_PER_SCENE,
  zoneAt, zoneBox, placedSentence, requestSentence, ownedStickers, remaining, cleanPlacements, pickRequest,
} from '../../app/js/sticker-scenes.js';
import { STICKER_BY_ID } from '../../app/js/stickers.js';

const own = (...ids) => Object.fromEntries(ids.map((id, i) => [id, { id, count: 1, firstEarnedAt: i + 1 }]));
const center = (zone) => {
  const b = zoneBox(zone);
  return [b.left + b.width / 2, b.top + b.height / 2];
};

test('3 tranh; mã chỗ không trùng; vùng nằm trong tranh; câu có giới từ in / on / under', () => {
  assert.deepEqual(SCENES.map((s) => s.id), ['farm', 'beach', 'bedroom']);
  for (const scene of SCENES) {
    const ids = scene.zones.map((z) => z.id);
    assert.equal(new Set(ids).size, ids.length, scene.id);
    for (const z of scene.zones) {
      const [x, y, w, h] = z.rect;
      assert.ok(x >= 0 && y >= 0 && x + w <= SCENE_W && y + h <= SCENE_H, `${scene.id}/${z.id}`);
      assert.match(z.en, /^(in|on|under) the [a-z]+$/, z.en);
      assert.ok(z.vi, `${scene.id}/${z.id} thiếu tiếng Việt`);
    }
  }
});

test('mọi điểm trong tranh đều thuộc một chỗ; tâm của mỗi chỗ trả về đúng chỗ đó', () => {
  for (const scene of SCENES) {
    for (let x = 0; x <= 100; x += 2.5) {
      for (let y = 0; y <= 100; y += 2.5) {
        const inside = scene.zones.some(({ rect: [zx, zy, w, h] }) => {
          const px = (x / 100) * SCENE_W;
          const py = (y / 100) * SCENE_H;
          return px >= zx && px <= zx + w && py >= zy && py <= zy + h;
        });
        assert.ok(inside, `${scene.id} (${x}, ${y}) không thuộc chỗ nào`);
      }
    }
    for (const z of scene.zones.slice(0, -2)) assert.equal(zoneAt(scene, ...center(z)).id, z.id, `${scene.id}/${z.id}`);
  }
});

test('một số điểm tiêu biểu', () => {
  const farm = SCENE_BY_ID.get('farm');
  assert.equal(zoneAt(farm, 17, 25).id, 'tree');
  assert.equal(zoneAt(farm, 10, 65).id, 'under-tree');
  assert.equal(zoneAt(farm, 54, 85).id, 'water');
  assert.equal(zoneAt(farm, 50, 10).id, 'sky');
  const bedroom = SCENE_BY_ID.get('bedroom');
  assert.equal(zoneAt(bedroom, 75, 75).id, 'under-bed');
  assert.equal(zoneAt(bedroom, 75, 55).id, 'bed');
  assert.equal(zoneAt(bedroom, 50, 95).id, 'floor');
});

test('câu: is / are, câu giao việc', () => {
  const tree = SCENE_BY_ID.get('farm').zones.find((z) => z.id === 'tree');
  assert.equal(placedSentence(STICKER_BY_ID.get('lion'), tree), 'The lion is in the tree!');
  assert.equal(placedSentence(STICKER_BY_ID.get('grapes'), tree), 'The grapes are in the tree!');
  assert.equal(placedSentence(STICKER_BY_ID.get('ice-cream'), tree), 'The ice cream is in the tree!');
  const water = SCENE_BY_ID.get('beach').zones.find((z) => z.id === 'water');
  assert.equal(requestSentence(STICKER_BY_ID.get('duck'), water), 'Put the duck in the water!');
});

test('khay: sticker mới nhận đứng đầu; số còn lại theo số đã dán', () => {
  const owned = own('lion', 'duck', 'cake');
  owned.duck.count = 3;
  assert.deepEqual(ownedStickers(owned).map((s) => s.id), ['cake', 'duck', 'lion']);
  assert.deepEqual(ownedStickers({}), []);
  const placed = [{ s: 'duck', x: 10, y: 10 }, { s: 'duck', x: 20, y: 20 }];
  assert.equal(remaining(owned, placed, 'duck'), 1);
  assert.equal(remaining(owned, placed, 'lion'), 1);
  assert.equal(remaining(owned, placed, 'tiger'), 0);
});

test('dọn tranh: bỏ sticker không còn, vượt số đang có, dữ liệu hỏng; giới hạn 30; kẹp tọa độ', () => {
  const owned = own('lion', 'duck');
  const list = [
    { s: 'lion', x: 10, y: 10 },
    { s: 'lion', x: 20, y: 20 }, // chỉ có 1 lion
    { s: 'tiger', x: 30, y: 30 }, // không có
    { s: 'nope', x: 30, y: 30 },
    { s: 'duck', x: 'a', y: 1 },
    null,
    { s: 'duck', x: 120, y: -5 },
  ];
  assert.deepEqual(cleanPlacements(list, owned), [{ s: 'lion', x: 10, y: 10 }, { s: 'duck', x: 100, y: 0 }]);
  assert.deepEqual(cleanPlacements(undefined, owned), []);
  const many = { duck: { count: 50, firstEarnedAt: 1 } };
  assert.equal(cleanPlacements(Array.from({ length: 40 }, () => ({ s: 'duck', x: 50, y: 50 })), many).length, MAX_PER_SCENE);
});

test('giao việc: chỉ sticker bé có, không trùng chỗ sticker đang đứng, không lặp việc vừa xong', () => {
  const farm = SCENE_BY_ID.get('farm');
  assert.equal(pickRequest(farm, {}, []), null);
  const owned = own('lion', 'duck');
  const placed = [{ s: 'duck', x: 54, y: 85 }]; // duck đang ở dưới nước
  for (let i = 0; i < 200; i++) {
    const r = pickRequest(farm, owned, placed);
    assert.ok(['lion', 'duck'].includes(r.sticker.id));
    if (r.sticker.id === 'duck') assert.notEqual(r.zone.id, 'water');
  }
  const last = { sticker: STICKER_BY_ID.get('lion'), zone: farm.zones[0] };
  for (let i = 0; i < 100; i++) {
    const r = pickRequest(farm, owned, placed, last);
    assert.equal(r.sticker.id, 'duck');
    assert.notEqual(r.zone.id, last.zone.id);
  }
  // Chỉ có 1 sticker: vẫn giao được (cùng sticker, chỗ khác).
  const one = pickRequest(farm, own('lion'), [], { sticker: STICKER_BY_ID.get('lion'), zone: farm.zones[0] });
  assert.equal(one.sticker.id, 'lion');
  assert.notEqual(one.zone.id, farm.zones[0].id);
});

test('ranh giới giữa hai chỗ: chỗ đứng trước trong danh sách thắng (kết quả ổn định)', () => {
  const farm = SCENE_BY_ID.get('farm');
  // Đáy tán cây (y = 150) cũng là đỉnh "under the tree" → tính "in the tree".
  assert.equal(zoneAt(farm, (60 / SCENE_W) * 100, (150 / SCENE_H) * 100).id, 'tree');
  // Ngay dưới đó là "under the tree"; mái chuồng (y = 122) chạm thân chuồng → tính mái.
  assert.equal(zoneAt(farm, (60 / SCENE_W) * 100, (151 / SCENE_H) * 100).id, 'under-tree');
  assert.equal(zoneAt(farm, (300 / SCENE_W) * 100, (122 / SCENE_H) * 100).id, 'roof');
  const bedroom = SCENE_BY_ID.get('bedroom');
  assert.equal(zoneAt(bedroom, (300 / SCENE_W) * 100, (204 / SCENE_H) * 100).id, 'bed');
  assert.equal(zoneAt(bedroom, (300 / SCENE_W) * 100, (206 / SCENE_H) * 100).id, 'under-bed');
  // Góc tranh luôn có chỗ.
  for (const scene of SCENES) for (const [x, y] of [[0, 0], [100, 0], [0, 100], [100, 100]]) assert.ok(zoneAt(scene, x, y));
});

test('mọi sticker × mọi chỗ: câu đúng mẫu; chỉ grapes, fries, pancakes dùng are', async () => {
  const { STICKERS } = await import('../../app/js/stickers.js');
  const plural = new Set();
  for (const scene of SCENES) {
    for (const zone of scene.zones) {
      for (const s of STICKERS) {
        const line = placedSentence(s, zone);
        assert.match(line, /^The [a-z ]+ (is|are) (in|on|under) the [a-z]+!$/, line);
        if (line.includes(' are ')) plural.add(s.name);
        assert.match(requestSentence(s, zone), /^Put the [a-z ]+ (in|on|under) the [a-z]+!$/);
      }
    }
  }
  assert.deepEqual([...plural].sort(), ['fries', 'grapes', 'pancakes']);
});

test('giao việc: không còn cặp làm được → null; tranh đủ 30 thì chỉ giao sticker đang có trong tranh', () => {
  const farm = SCENE_BY_ID.get('farm');
  // lion ×7 đứng ở cả 7 chỗ → không còn việc.
  const owned = { lion: { count: 7, firstEarnedAt: 1 } };
  // Mỗi chỗ một điểm thuộc đúng chỗ đó (tâm vùng nền có thể rơi vào vùng nhỏ, nên dò lưới).
  const everywhere = farm.zones.map((z) => {
    for (let x = 1; x < 100; x += 2) for (let y = 1; y < 100; y += 2) if (zoneAt(farm, x, y).id === z.id) return { s: 'lion', x, y };
    throw new Error(z.id);
  });
  assert.equal(new Set(everywhere.map((p) => zoneAt(farm, p.x, p.y).id)).size, farm.zones.length);
  assert.equal(pickRequest(farm, owned, everywhere), null);
  // Tranh đủ 30 duck, bé còn lion chưa dán → không giao lion (không dán thêm được), chỉ giao duck.
  const full = Array.from({ length: MAX_PER_SCENE }, () => ({ s: 'duck', x: 54, y: 85 }));
  const owned2 = { duck: { count: 30, firstEarnedAt: 1 }, lion: { count: 1, firstEarnedAt: 2 } };
  for (let i = 0; i < 50; i++) {
    const r = pickRequest(farm, owned2, full);
    assert.equal(r.sticker.id, 'duck');
    assert.notEqual(r.zone.id, 'water');
  }
});
