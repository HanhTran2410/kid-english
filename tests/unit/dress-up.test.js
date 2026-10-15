// Trò chơi Mặc đồ (SPEC-dressup.md): tủ đồ, mặc / thay đồ, câu nói, giao việc, dọn dữ liệu.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEMS, ITEM_BY_ID, SLOTS, SLOT_BY_ID, DOLL_W, DOLL_H, itemBoxes, wear, cleanOutfit, layerOrder,
  wearSentence, takeOffSentence, requestSentence, wearVi, takeOffVi, pickRequest, dollSvg,
} from '../../app/js/dress-up.js';

test('tủ đồ: 21 món, mã không trùng, món nào cũng có chỗ, tên Việt, emoji; vùng vẽ nằm trong khung bạn nhỏ', () => {
  assert.equal(ITEMS.length, 21);
  assert.equal(new Set(ITEMS.map((i) => i.id)).size, ITEMS.length);
  for (const it of ITEMS) {
    assert.ok(SLOT_BY_ID.has(it.slot), it.id);
    assert.ok(it.vi && it.emoji, it.id);
    for (const [x, y, w, h] of [it.rect ?? SLOT_BY_ID.get(it.slot).rect]) {
      assert.ok(x >= 0 && y >= 0 && x + w <= DOLL_W && y + h <= DOLL_H, it.id);
    }
  }
  for (const s of SLOTS) assert.ok(s.verb, s.id);
  // Giày: hai chiếc, chiếc thứ hai lật ngược.
  const shoes = itemBoxes(ITEM_BY_ID.get('boots'));
  assert.equal(shoes.length, 2);
  assert.ok(!shoes[0].mirror && shoes[1].mirror);
  assert.equal(itemBoxes(ITEM_BY_ID.get('cap')).length, 1);
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
  assert.deepEqual(layerOrder(['cap', 'coat', 'jeans', 't-shirt', 'backpack']), ['backpack', 'jeans', 't-shirt', 'coat', 'cap']);
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

test('bạn nhỏ: bé trai và bé gái khác tóc, cùng khung 200 × 400', () => {
  const boy = dollSvg('boy');
  const girl = dollSvg('girl');
  assert.notEqual(boy, girl);
  for (const svg of [boy, girl]) assert.match(svg, /viewBox="0 0 200 400"/);
});
