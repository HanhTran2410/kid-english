// Dán tranh (SPEC-scenes.md): tranh và chỗ, bộ sticker theo chủ đề, câu Bông nói, dọn dữ liệu, giao việc, prompt ảnh,
// cắt nền sticker, cắt ảnh tranh 4:3.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCENES, SCENE_BY_ID, ITEM_BY_ID, SCENE_W, SCENE_H, MAX_PER_SCENE,
  zoneAt, zoneBox, placedSentence, requestSentence, cleanPlacements, pickRequest, sceneBackgroundPrompt, isSceneImage,
} from '../../app/js/sticker-scenes.js';
import { whiteBackgroundAlpha, coverCrop, gridShape } from '../../app/js/image.js';

const center = (zone) => {
  const b = zoneBox(zone);
  return [b.left + b.width / 2, b.top + b.height / 2];
};
/** Một điểm thuộc đúng chỗ `zone` (tâm vùng nền có thể rơi vào vùng nhỏ, nên dò lưới). */
const pointIn = (scene, zone) => {
  for (let x = 1; x < 100; x += 2) for (let y = 1; y < 100; y += 2) if (zoneAt(scene, x, y).id === zone.id) return [x, y];
  throw new Error(`${scene.id}/${zone.id} không có điểm nào`);
};

test('7 tranh; mã chỗ không trùng; vùng nằm trong tranh; câu có giới từ in / on / under', () => {
  assert.deepEqual(SCENES.map((s) => s.id), ['farm', 'beach', 'bedroom', 'park', 'kitchen', 'space', 'jungle']);
  for (const scene of SCENES) {
    const ids = scene.zones.map((z) => z.id);
    assert.equal(new Set(ids).size, ids.length, scene.id);
    assert.ok(scene.svg.includes('<'), `${scene.id} thiếu hình vẽ`);
    for (const z of scene.zones) {
      const [x, y, w, h] = z.rect;
      assert.ok(x >= 0 && y >= 0 && x + w <= SCENE_W && y + h <= SCENE_H, `${scene.id}/${z.id}`);
      assert.match(z.en, /^(in|on|under) (the )?[a-z]+$/, z.en);
      assert.ok(z.vi && z.draw, `${scene.id}/${z.id} thiếu tiếng Việt / mô tả vẽ`);
      pointIn(scene, z); // chỗ nào cũng chạm tới được
    }
  }
});

test('bộ sticker theo chủ đề: 12–16 sticker mỗi tranh (vừa ảnh lưới 4 × 4), không trùng trong tranh; cùng tên dùng chung mã', () => {
  for (const scene of SCENES) {
    assert.ok(scene.items.length >= 12 && scene.items.length <= 16, scene.id);
    assert.equal(new Set(scene.items.map((i) => i.id)).size, scene.items.length, scene.id);
    const shape = gridShape(scene.items.length);
    assert.ok(shape.cols * shape.rows >= scene.items.length);
    for (const it of scene.items) {
      assert.ok(it.emoji && it.name === it.name.toLowerCase(), it.name);
      assert.equal(ITEM_BY_ID.get(it.id).name, it.name);
    }
  }
  // Bãi biển có ốc, cá; nông trại có bò.
  const names = (id) => SCENE_BY_ID.get(id).items.map((i) => i.name);
  assert.ok(names('beach').includes('shell') && names('beach').includes('fish'));
  assert.ok(names('farm').includes('cow'));
  // Sticker có ở nhiều tranh (cat) dùng chung một emoji (một ảnh).
  const cats = SCENES.flatMap((s) => s.items).filter((i) => i.id === 'cat');
  assert.ok(cats.length >= 2 && new Set(cats.map((c) => c.emoji)).size === 1);
});

test('mọi điểm trong tranh đều thuộc một chỗ; tâm của mỗi chỗ nhỏ trả về đúng chỗ đó', () => {
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
  }
  for (const id of ['farm', 'beach', 'bedroom']) {
    const scene = SCENE_BY_ID.get(id);
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
  assert.equal(zoneAt(SCENE_BY_ID.get('space'), 83, 40).id, 'rocket');
  assert.equal(zoneAt(SCENE_BY_ID.get('space'), 60, 20).id, 'space');
  assert.equal(zoneAt(SCENE_BY_ID.get('kitchen'), 73, 54).id, 'pot');
});

test('ranh giới giữa hai chỗ: chỗ đứng trước trong danh sách thắng (kết quả ổn định)', () => {
  const farm = SCENE_BY_ID.get('farm');
  assert.equal(zoneAt(farm, (60 / SCENE_W) * 100, (150 / SCENE_H) * 100).id, 'tree');
  assert.equal(zoneAt(farm, (60 / SCENE_W) * 100, (151 / SCENE_H) * 100).id, 'under-tree');
  assert.equal(zoneAt(farm, (300 / SCENE_W) * 100, (122 / SCENE_H) * 100).id, 'roof');
  const bedroom = SCENE_BY_ID.get('bedroom');
  assert.equal(zoneAt(bedroom, (300 / SCENE_W) * 100, (204 / SCENE_H) * 100).id, 'bed');
  assert.equal(zoneAt(bedroom, (300 / SCENE_W) * 100, (206 / SCENE_H) * 100).id, 'under-bed');
  for (const scene of SCENES) for (const [x, y] of [[0, 0], [100, 0], [0, 100], [100, 100]]) assert.ok(zoneAt(scene, x, y));
});

test('mọi sticker × mọi chỗ của tranh: câu đúng mẫu; chỉ grapes / socks / sunglasses dùng are', () => {
  const plural = new Set();
  for (const scene of SCENES) {
    for (const zone of scene.zones) {
      for (const s of scene.items) {
        const line = placedSentence(s, zone);
        assert.match(line, /^The [a-z ]+ (is|are) (in|on|under) (the )?[a-z]+!$/, line);
        if (line.includes(' are ')) plural.add(s.name);
        assert.match(requestSentence(s, zone), /^Put the [a-z ]+ (in|on|under) (the )?[a-z]+!$/);
      }
    }
  }
  assert.deepEqual([...plural].sort(), ['grapes', 'socks', 'sunglasses']);
  const tree = SCENE_BY_ID.get('jungle').zones.find((z) => z.id === 'tree');
  assert.equal(placedSentence(ITEM_BY_ID.get('monkey'), tree), 'The monkey is in the tree!');
});

test('dọn tranh: bỏ mã không có, dữ liệu hỏng; giới hạn 30; kẹp tọa độ; dữ liệu 0.11 (sticker album) có tên trùng vẫn giữ', () => {
  const list = [
    { s: 'cow', x: 10, y: 10 },
    { s: 'cow', x: 20, y: 20 }, // dán nhiều bản cùng loại được
    { s: 'nope', x: 30, y: 30 },
    { s: 'duck', x: 'a', y: 1 },
    null,
    { s: 'duck', x: 120, y: -5 },
    { s: 'lion', x: 50, y: 50 }, // sticker album cũ — có trong Rừng xanh
    { s: 'unicorn', x: 50, y: 50 }, // sticker album cũ — không có ở tranh nào
  ];
  assert.deepEqual(cleanPlacements(list), [
    { s: 'cow', x: 10, y: 10 }, { s: 'cow', x: 20, y: 20 }, { s: 'duck', x: 100, y: 0 }, { s: 'lion', x: 50, y: 50 },
  ]);
  assert.deepEqual(cleanPlacements(undefined), []);
  assert.equal(cleanPlacements(Array.from({ length: 40 }, () => ({ s: 'duck', x: 50, y: 50 }))).length, MAX_PER_SCENE);
});

test('giao việc: chỉ sticker của tranh, không trùng chỗ sticker đang đứng, không lặp việc vừa xong', () => {
  const farm = SCENE_BY_ID.get('farm');
  const ids = new Set(farm.items.map((i) => i.id));
  const placed = [{ s: 'duck', x: 54, y: 85 }]; // duck đang ở trong nước
  for (let i = 0; i < 300; i++) {
    const r = pickRequest(farm, placed);
    assert.ok(ids.has(r.sticker.id));
    if (r.sticker.id === 'duck') assert.notEqual(r.zone.id, 'water');
  }
  const last = { sticker: ITEM_BY_ID.get('cow'), zone: farm.zones[0] };
  for (let i = 0; i < 100; i++) {
    const r = pickRequest(farm, placed, last);
    assert.notEqual(r.sticker.id, 'cow');
    assert.notEqual(r.zone.id, last.zone.id);
  }
});

test('giao việc: tranh đủ 30 thì chỉ giao sticker đang có trong tranh; không còn việc → null', () => {
  const farm = SCENE_BY_ID.get('farm');
  const full = Array.from({ length: MAX_PER_SCENE }, () => ({ s: 'duck', x: 54, y: 85 }));
  for (let i = 0; i < 50; i++) {
    const r = pickRequest(farm, full);
    assert.equal(r.sticker.id, 'duck');
    assert.notEqual(r.zone.id, 'water');
  }
  // Tranh đầy, chỉ có duck, và duck đã đứng ở mọi chỗ → không còn việc.
  const everywhere = farm.zones.map((z) => {
    const [x, y] = pointIn(farm, z);
    return { s: 'duck', x, y };
  });
  const filled = [...everywhere, ...Array.from({ length: MAX_PER_SCENE - everywhere.length }, () => everywhere[0])];
  assert.equal(pickRequest(farm, filled), null);
});

test('prompt ảnh tranh: có đủ các chỗ kèm vị trí %, cấm chữ và con vật', () => {
  for (const scene of SCENES) {
    const p = sceneBackgroundPrompt(scene);
    assert.match(p, /4:3/);
    assert.match(p, /no text/i);
    assert.match(p, /no animals/i);
    for (const z of scene.zones) assert.ok(p.includes(z.draw.charAt(0).toUpperCase() + z.draw.slice(1)), `${scene.id}/${z.id}`);
  }
  const farm = sceneBackgroundPrompt(SCENE_BY_ID.get('farm'));
  assert.ok(farm.includes('E. A small blue pond\n- Position: x = 35%–73%, y = 76%–94%.'));
  assert.match(farm, /across the full width, y = 0%–53%, wherever not occupied/);
});

test('prompt ảnh tranh theo review: đủ 4 phần, thứ tự lớp, chỗ nối liền, danh sách không vẽ thêm, không cấm chính vật của tranh', () => {
  for (const scene of SCENES) {
    const p = sceneBackgroundPrompt(scene);
    for (const head of ['1. EXACT COMPOSITION AND PLACEMENT', '2. STICKER-PLACEMENT REQUIREMENTS', '3. VISUAL STYLE', '4. STRICT EXCLUSIONS']) assert.ok(p.includes(head), `${scene.id}: ${head}`);
    assert.match(p, /Layer order: the background areas/);
    assert.match(p, /- Do not add: /, scene.id);
    assert.match(p, /other than the main objects listed above/); // tên lửa, thuyền, nồi… không bị cấm
    assert.ok(!/undefined|null/.test(p), scene.id);
  }
  const farm = sceneBackgroundPrompt(SCENE_BY_ID.get('farm'));
  assert.match(farm, /A\. The red triangular roof of the barn[\s\S]*It must connect directly to B /);
  assert.ok(farm.includes('except the connected parts (A–B, C–D)'));
  assert.match(sceneBackgroundPrompt(SCENE_BY_ID.get('bedroom')), /under the bed[\s\S]*It must connect directly to A \(the top of a bed/);
});

test('ảnh của Dán tranh không lẫn với ảnh bài học', () => {
  assert.ok(isSceneImage({ lessonId: 'scene:stickers' }));
  assert.ok(isSceneImage({ lessonId: 'scene:bg' }));
  assert.ok(!isSceneImage({ lessonId: '1234-abcd' }));
});

test('bỏ nền trắng: nền nối với mép trong suốt, chỗ trắng nằm trong viền giữ nguyên, mép sáng vừa trong suốt một phần', () => {
  // Ảnh 7 × 7: nền trắng, khung đen ở giữa, trong khung là điểm trắng (như mắt), một điểm xám nhạt ở mép ảnh.
  const w = 7;
  const hgt = 7;
  const px = [];
  for (let y = 0; y < hgt; y++) {
    for (let x = 0; x < w; x++) {
      const ring = x >= 1 && x <= 5 && y >= 1 && y <= 5 && (x === 1 || x === 5 || y === 1 || y === 5);
      const v = ring ? 30 : 255;
      px.push(v, v, v, 255);
    }
  }
  const at = (x, y) => (y * w + x) * 4;
  px.splice(at(0, 3), 3, 220, 220, 220); // mép khử răng cưa
  const alpha = whiteBackgroundAlpha(px, w, hgt);
  const a = (x, y) => alpha[y * w + x];
  assert.equal(a(0, 0), 0); // nền
  assert.equal(a(3, 3), 255); // trắng trong viền giữ nguyên
  assert.equal(a(1, 1), 255); // viền
  assert.ok(a(0, 3) > 0 && a(0, 3) < 255); // mép sáng vừa
});

test('cắt ảnh tranh 4:3: cắt giữa, bỏ bớt hai bên hoặc trên dưới', () => {
  assert.deepEqual(coverCrop(1600, 1200, 4 / 3), { sx: 0, sy: 0, sw: 1600, sh: 1200 });
  assert.deepEqual(coverCrop(1024, 1024, 4 / 3), { sx: 0, sy: 128, sw: 1024, sh: 768 });
  const wide = coverCrop(1920, 1080, 4 / 3);
  assert.equal(wide.sw, 1440);
  assert.equal(wide.sx, 240);
});
