// Trò chơi Mặc đồ (SPEC-dressup.md): tủ đồ, mặc / thay đồ, câu nói, giao việc, dọn dữ liệu.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEMS, ITEM_BY_ID, SLOTS, SLOT_BY_ID, DOLL_W, DOLL_H, wear, cleanOutfit, layerOrder, itemArt, itemIcon, visibleIn, viewFor,
  wearSentence, takeOffSentence, requestSentence, wearVi, takeOffVi, pickRequest, dollSvg,
} from '../../app/js/dress-up.js';

test('tủ đồ: 21 món, mã không trùng, món nào cũng có chỗ, tên Việt, hình vẽ mặt trước, khung biểu tượng nằm trong khung bạn nhỏ', () => {
  assert.equal(ITEMS.length, 21);
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
