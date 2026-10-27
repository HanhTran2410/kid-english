// Trò chơi Mặc đồ (SPEC-dressup.md): tủ đồ, mặc / thay đồ, câu nói, giao việc, dọn dữ liệu.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEMS, ITEM_BY_ID, SLOTS, SLOT_BY_ID, DOLL_W, DOLL_H, wear, cleanOutfit, layerOrder, itemArt, itemIcon, visibleIn, viewFor,
  wardrobeFor, setCustomItems, imageKey, itemBox, sameWord, isPlural,
  wearSentence, takeOffSentence, requestSentence, wearVi, takeOffVi, pickRequest, dollSvg,
  placeImage, aspectGap, STRETCH_MAX, FIT_LIMITS,
} from '../../app/js/dress-up.js';

test('tủ đồ có sẵn: 26 món, mã không trùng, món nào cũng có chỗ, tên Việt, hình vẽ mặt trước, khung biểu tượng nằm trong khung bạn nhỏ', () => {
  assert.equal(ITEMS.length, 26);
  assert.equal(new Set(ITEMS.map((i) => i.id)).size, ITEMS.length);
  for (const it of ITEMS) {
    assert.ok(SLOT_BY_ID.has(it.slot), it.id);
    assert.ok(it.vi && it.emoji, it.id);
    assert.ok(it.art?.front?.includes('<'), `${it.id} thiếu hình vẽ`);
    const [x, y, w, h] = it.art.box;
    assert.ok(x >= 0 && y >= 0 && x + w <= DOLL_W && y + h <= DOLL_H, it.id);
    assert.match(itemIcon(it), /^<svg viewBox="\d+ \d+ \d+ \d+"/);
  }
  for (const s of SLOTS) assert.ok(s.verb, s.id);
});

test('mặt trước / sau: ba lô chỉ thấy quai ở trước, cả ba lô ở sau và vừa đeo thì quay lưng; kính chỉ thấy ở trước; ô đổi tay khi quay lưng', () => {
  const backpack = ITEM_BY_ID.get('backpack');
  assert.notEqual(itemArt(backpack, 'front'), itemArt(backpack, 'back'));
  assert.match(itemArt(backpack, 'back'), /<rect/);
  assert.equal(viewFor(backpack, 'front'), 'back');
  const glasses = ITEM_BY_ID.get('glasses');
  assert.ok(visibleIn(glasses, 'front') && !visibleIn(glasses, 'back'));
  assert.equal(viewFor(glasses, 'back'), 'front');
  assert.equal(viewFor(ITEM_BY_ID.get('t-shirt'), 'back'), 'back'); // áo thấy cả hai mặt: không xoay
  assert.ok(itemArt(ITEM_BY_ID.get('umbrella'), 'back').includes('scale(-1 1)'));
  // Mỗi món vẽ thành một nhóm data-item; kính không có ở mặt sau.
  const front = dollSvg('girl', 'front', ['glasses', 'dress']);
  const back = dollSvg('girl', 'back', ['glasses', 'dress']);
  assert.match(front, /data-item="glasses"/);
  assert.doesNotMatch(back, /data-item="glasses"/);
  assert.match(back, /data-item="dress"/);
});

test('mặc: cùng chỗ thì thay món cũ; váy ↔ áo / quần; áo khoác mặc ngoài áo hoặc váy được', () => {
  let r = wear([], 't-shirt');
  assert.deepEqual(r, { outfit: ['t-shirt'], removed: [] });
  r = wear(['t-shirt', 'jeans'], 'shirt');
  assert.deepEqual(r.outfit, ['jeans', 'shirt']);
  assert.deepEqual(r.removed, ['t-shirt']);
  r = wear(['t-shirt', 'jeans', 'cap'], 'dress');
  assert.deepEqual(r.outfit, ['cap', 'dress']);
  assert.deepEqual(r.removed.sort(), ['jeans', 't-shirt']);
  r = wear(['dress', 'coat'], 'shorts');
  assert.deepEqual(r.outfit, ['coat', 'shorts']);
  assert.deepEqual(wear(['dress'], 'coat').outfit, ['dress', 'coat']);
  assert.deepEqual(wear(['t-shirt'], 'coat').outfit, ['t-shirt', 'coat']);
  assert.deepEqual(wear(['cap'], 'bow').outfit, ['bow']); // nơ và mũ cùng chỗ đầu
  assert.deepEqual(wear(['cap'], 'cap').outfit, ['cap']); // mặc lại món đang mặc: không trùng
  assert.deepEqual(wear(['cap'], 'nope').outfit, ['cap']);
});

test('dọn bộ đồ đã lưu: bỏ mã lạ / trùng, món sau thắng khi xung đột; thứ tự lớp dưới → trên', () => {
  assert.deepEqual(cleanOutfit(['t-shirt', 'x', 'jeans', 'dress', 'cap', 'cap']), ['dress', 'cap']);
  assert.deepEqual(cleanOutfit(undefined), []);
  // Ba lô vẽ đè lên áo khoác (quai trên vai ở mặt trước, cả ba lô ở mặt sau).
  assert.deepEqual(layerOrder(['cap', 'coat', 'jeans', 't-shirt', 'backpack']), ['jeans', 't-shirt', 'coat', 'backpack', 'cap']);
});

test('câu: a / không "a" cho số nhiều, cởi, giao việc có ngữ cảnh; phụ đề đúng động từ', () => {
  assert.equal(wearSentence(ITEM_BY_ID.get('t-shirt')), "I'm wearing a T-shirt!");
  assert.equal(wearSentence(ITEM_BY_ID.get('boots')), "I'm wearing boots!");
  assert.equal(wearSentence(ITEM_BY_ID.get('sunglasses')), "I'm wearing sunglasses!");
  assert.equal(wearSentence(ITEM_BY_ID.get('sun-hat')), "I'm wearing a sun hat!");
  assert.equal(takeOffSentence(ITEM_BY_ID.get('cap')), 'I took off my cap!');
  assert.equal(requestSentence(ITEM_BY_ID.get('scarf')), "It's cold! Put on your scarf!");
  assert.equal(requestSentence(ITEM_BY_ID.get('umbrella')), "It's raining! Take your umbrella!");
  assert.equal(wearSentence(ITEM_BY_ID.get('umbrella')), 'I have an umbrella!');
  assert.equal(takeOffSentence(ITEM_BY_ID.get('umbrella')), 'I put down my umbrella!');
  assert.equal(requestSentence(ITEM_BY_ID.get('t-shirt')), 'Put on your T-shirt!');
  assert.equal(wearVi(ITEM_BY_ID.get('helmet')), '⛑️ Mình đội mũ bảo hiểm');
  assert.equal(wearVi(ITEM_BY_ID.get('boots')), '👢 Mình đi ủng');
  assert.equal(takeOffVi(ITEM_BY_ID.get('scarf')), '🧣 Mình cởi khăn quàng ra');
  for (const it of ITEMS) assert.match(wearSentence(it), /^(I'm wearing|I have) (an? )?[A-Za-z -]+!$/);
});

test('giao việc: chỉ món chưa mặc, khác việc vừa xong; mặc hết → null', () => {
  const outfit = ['t-shirt', 'jeans'];
  for (let i = 0; i < 200; i++) assert.ok(!outfit.includes(pickRequest(outfit).id));
  const last = ITEM_BY_ID.get('cap');
  for (let i = 0; i < 200; i++) assert.notEqual(pickRequest(outfit, last).id, 'cap');
  assert.equal(pickRequest(ITEMS.map((i) => i.id)), null);
  // Còn đúng 1 món chưa mặc và đó là món vừa giao: vẫn giao lại được.
  const allButCap = ITEMS.map((i) => i.id).filter((id) => id !== 'cap');
  assert.equal(pickRequest(allButCap, last).id, 'cap');
});

test('bạn nhỏ: bé trai và bé gái khác tóc; mặt trước có mặt (mắt), mặt sau không; cùng khung 200 × 400', () => {
  for (const kid of ['boy', 'girl']) for (const v of ['front', 'back']) assert.match(dollSvg(kid, v), /viewBox="0 0 200 400"/);
  assert.notEqual(dollSvg('boy'), dollSvg('girl'));
  assert.notEqual(dollSvg('boy', 'back'), dollSvg('girl', 'back'));
  assert.match(dollSvg('boy', 'front'), /<ellipse cx="85" cy="74"/);
  assert.doesNotMatch(dollSvg('boy', 'back'), /<ellipse cx="85" cy="74"/);
  // Sau lưng: tóc vẽ đè lên áo, dưới ba lô.
  const back = dollSvg('girl', 'back', ['coat', 'backpack']);
  const hair = back.indexOf('<circle cx="100" cy="70" r="43"');
  assert.ok(back.indexOf('data-item="coat"') < hair && hair < back.indexOf('data-item="backpack"'));
});

test('tủ đồ riêng: bé trai không có váy / nơ, bé gái không có cà vạt / quần bơi; đồ chung có cho cả hai; bộ đồ cũ bỏ món không phải của bé', () => {
  const boy = wardrobeFor('boy').map((i) => i.id);
  const girl = wardrobeFor('girl').map((i) => i.id);
  for (const id of ['dress', 'skirt', 'swimsuit', 'bow', 'crown', 'sun-hat']) {
    assert.ok(girl.includes(id) && !boy.includes(id), id);
  }
  for (const id of ['tie', 'swim-shorts']) assert.ok(boy.includes(id) && !girl.includes(id), id);
  for (const id of ['t-shirt', 'jeans', 'socks', 'sneakers', 'backpack', 'umbrella']) assert.ok(boy.includes(id) && girl.includes(id), id);
  assert.deepEqual(cleanOutfit(['t-shirt', 'skirt', 'bow'], 'boy'), ['t-shirt']);
  assert.deepEqual(cleanOutfit(['t-shirt', 'skirt', 'bow'], 'girl'), ['t-shirt', 'skirt', 'bow']);
  // Chân váy là "quần": thay quần bò; tất mặc cùng giày.
  assert.deepEqual(wear(['jeans', 'sneakers'], 'skirt').outfit, ['sneakers', 'skirt']);
  assert.deepEqual(wear(['sneakers'], 'socks').outfit, ['sneakers', 'socks']);
  assert.equal(wearSentence(ITEM_BY_ID.get('socks')), "I'm wearing socks!");
  assert.equal(wearSentence(ITEM_BY_ID.get('swim-shorts')), "I'm wearing swim shorts!");
  assert.equal(wearSentence(ITEM_BY_ID.get('tie')), "I'm wearing a tie!");
  assert.ok(!visibleIn(ITEM_BY_ID.get('tie'), 'back'));
  assert.ok(!isPlural(ITEM_BY_ID.get('dress')) && isPlural(ITEM_BY_ID.get('socks')));
});

test('đồ bố mẹ thêm: nạp từ cài đặt, đúng chỗ / đúng bé, bỏ món hỏng hoặc trùng tên; nạp lại thì thay danh sách cũ', () => {
  try {
    setCustomItems([
      { id: 'c-1', name: 'raincoat', vi: 'áo mưa', slot: 'outer', kids: ['boy'] },
      { id: 'c-2', name: 'pajamas', vi: 'đồ ngủ', slot: 'dress', kids: ['girl', 'boy'], plural: true },
      { id: 'c-3', name: 'T-shirt', vi: 'áo phông kẻ', slot: 'top' }, // cùng tên món có sẵn: một kiểu khác
      { id: 'c-4', name: 'x', slot: 'nowhere' }, // chỗ mặc không có
      { name: 'no id', slot: 'top' },
    ]);
    assert.equal(ITEMS.length, 29);
    // Kiểu khác cùng tên: ảnh riêng (khóa theo mã), bé nghe cùng câu, Bông bảo mặc áo phông thì kiểu nào cũng đúng.
    const striped = ITEM_BY_ID.get('c-3');
    assert.equal(imageKey(striped), 'c-3');
    assert.equal(imageKey(ITEM_BY_ID.get('t-shirt')), 't-shirt');
    assert.equal(wearSentence(striped), "I'm wearing a T-shirt!");
    assert.ok(sameWord(striped, ITEM_BY_ID.get('t-shirt')) && !sameWord(striped, ITEM_BY_ID.get('shirt')));
    assert.deepEqual(wear(['t-shirt'], 'c-3').outfit, ['c-3']); // cùng chỗ: thay kiểu cũ
    const raincoat = ITEM_BY_ID.get('c-1');
    assert.ok(raincoat.custom && raincoat.art === null);
    assert.ok(wardrobeFor('boy').includes(raincoat) && !wardrobeFor('girl').includes(raincoat));
    assert.equal(wearSentence(raincoat), "I'm wearing a raincoat!");
    assert.equal(wearSentence(ITEM_BY_ID.get('c-2')), "I'm wearing pajamas!");
    assert.deepEqual(itemBox(raincoat), SLOT_BY_ID.get('outer').box);
    // Váy liền thêm vào cũng thay áo + quần như váy có sẵn.
    assert.deepEqual(wear(['t-shirt', 'jeans'], 'c-2').outfit, ['c-2']);
    // Đồ thêm cần ảnh: không có ảnh thì không vẽ lên người, biểu tượng là emoji của chỗ mặc.
    assert.equal(itemArt(raincoat, 'front'), '');
    assert.match(itemIcon(raincoat), /🧥/);
    const images = new Map([[imageKey(raincoat), 'blob:raincoat']]);
    assert.match(itemArt(raincoat, 'front', images), /<image href="blob:raincoat" x="32.0" y="108.0" width="136.0" height="154.0" preserveAspectRatio="xMidYMin meet"/);
    assert.match(dollSvg('boy', 'front', ['c-1'], images), /data-item="c-1"/);
    setCustomItems([{ id: 'c-9', name: 'tutu', slot: 'bottom', kids: ['girl'] }]);
    assert.equal(ITEMS.length, 27);
    assert.ok(!ITEM_BY_ID.has('c-3'));
    assert.ok(!ITEM_BY_ID.has('c-1') && ITEM_BY_ID.has('c-9'));
  } finally {
    setCustomItems([]);
  }
  assert.equal(ITEMS.length, 26);
});

test('ảnh bố mẹ thay cho món có sẵn: đặt vừa khung món đó; kính không hiện khi quay lưng; ba lô: quai ở trước, ảnh ở sau; ô đổi tay', () => {
  const map = (id, url) => new Map([[imageKey(ITEM_BY_ID.get(id)), url]]);
  const tshirt = ITEM_BY_ID.get('t-shirt');
  assert.match(itemArt(tshirt, 'front', map('t-shirt', 'u1')), /<image href="u1" x="36.0" y="110.0" width="128.0" height="110.0"/);
  assert.match(itemArt(tshirt, 'back', map('t-shirt', 'u1')), /href="u1"/);
  assert.equal(itemArt(ITEM_BY_ID.get('glasses'), 'back', map('glasses', 'u2')), '');
  const bp = ITEM_BY_ID.get('backpack');
  assert.doesNotMatch(itemArt(bp, 'front', map('backpack', 'u3')), /<image/);
  assert.match(itemArt(bp, 'back', map('backpack', 'u3')), /href="u3"/);
  assert.match(itemArt(ITEM_BY_ID.get('umbrella'), 'back', map('umbrella', 'u4')), /scale\(-1 1\)[\s\S]*href="u4"/);
  assert.match(itemIcon(tshirt, map('t-shirt', 'u1')), /viewBox="0 0 100 100"[\s\S]*href="u1"/);
});

test('SPEC-dressup2 — đặt ảnh tự tạo: đồ mặc thân lệch tỉ lệ ≤ 40% thì kéo vừa khung, lệch hơn giữ tỉ lệ căn trên; giày / mũ căn dưới; phụ kiện căn giữa', () => {
  assert.equal(aspectGap(1, 1), 0);
  assert.ok(Math.abs(aspectGap(1.4, 1) - 0.4) < 1e-9);
  assert.equal(aspectGap(1, 2), 1);
  const shirt = ITEM_BY_ID.get('shirt');
  const [x, y, w, h] = itemBox(shirt);
  // D04: ảnh áo vuông (khung áo hơi ngang) → kéo vừa đúng khung, phủ cả tay.
  assert.deepEqual(placeImage(shirt, { w: 300, h: 300 }), { x, y: y + 6, w, h: h - 6, par: 'none' }); // cổ áo dưới cằm
  // D05: ảnh quần thấp, lệch nhiều → giữ tỉ lệ, cạp bám eo (căn trên).
  const jeans = ITEM_BY_ID.get('jeans');
  const [, , jw, jh] = itemBox(jeans);
  assert.ok(aspectGap(300 / 200, jw / jh) > STRETCH_MAX);
  assert.equal(placeImage(jeans, { w: 300, h: 200 }).par, 'xMidYMin meet');
  assert.equal(placeImage(jeans, { w: jw * 3, h: jh * 3 }).par, 'none');
  assert.equal(placeImage(ITEM_BY_ID.get('socks'), { w: 900, h: 100 }).par, 'xMidYMax meet');
  assert.equal(placeImage(ITEM_BY_ID.get('sneakers') ?? ITEMS.find((i) => i.slot === 'feet'), { w: 100, h: 40 }).par, 'xMidYMax meet');
  assert.equal(placeImage(ITEMS.find((i) => i.slot === 'head'), { w: 100, h: 60 }).par, 'xMidYMax meet');
  assert.equal(placeImage(ITEMS.find((i) => i.slot === 'eyes'), { w: 100, h: 30 }).par, 'xMidYMid meet');
  // Không biết kích thước ảnh (dữ liệu cũ): đồ mặc thân giữ tỉ lệ, căn trên.
  assert.equal(placeImage(shirt).par, 'xMidYMin meet');
});

test('SPEC-dressup2 — "Căn lại": dịch / phóng to quanh tâm khung, có giới hạn; itemArt dùng đúng chỗ đặt', () => {
  const shirt = ITEM_BY_ID.get('shirt');
  const [x, y, w, h] = itemBox(shirt);
  const p = placeImage(shirt, { w: 300, h: 300 }, { dx: 8, dy: -4, scale: 1.5 });
  assert.ok(Math.abs(p.w - w * 1.5) < 1e-9 && Math.abs(p.h - (h - 6) * 1.5) < 1e-9);
  assert.ok(Math.abs(p.x + p.w / 2 - (x + w / 2 + 8)) < 1e-9);
  assert.ok(Math.abs(p.y + p.h / 2 - (y + 6 + (h - 6) / 2 - 4)) < 1e-9);
  const big = placeImage(shirt, null, { dx: 999, dy: -999, scale: 9 });
  assert.ok(Math.abs(big.w - w * FIT_LIMITS.max) < 1e-9);
  assert.ok(Math.abs(big.x + big.w / 2 - (x + w / 2 + FIT_LIMITS.move)) < 1e-9);
  const images = new Map([[imageKey(shirt), 'blob:shirt']]);
  images.dims = new Map([[imageKey(shirt), { w: 300, h: 300 }]]);
  const art = itemArt(shirt, 'front', images);
  assert.match(art, /preserveAspectRatio="none"/);
  assert.match(art, new RegExp(`width="${w.toFixed(1)}" height="${(h - 6).toFixed(1)}"`));
});

test('SPEC-dressup2 — 3D giả: chỉ thêm lớp / bộ lọc hiển thị khi bật; tắt thì không có bộ lọc', () => {
  const on = dollSvg('girl', 'front', ['shirt'], null, { toy3d: true });
  const off = dollSvg('girl', 'front', ['shirt'], null);
  assert.match(on, /class="du-svg du-3d"/);
  assert.match(on, /<filter id="du-toy3d"/);
  assert.doesNotMatch(off, /du-toy3d|du-3d/);
  assert.match(off, /class="du-ground"/);
});
