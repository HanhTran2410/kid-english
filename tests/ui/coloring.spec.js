// Trò Tô màu (SPEC-coloring.md): chọn nhóm → chọn hình → chọn màu, chạm phần để tô; Bông giao việc, nhắc màu,
// hoan hô khi xong hình; lưu màu; vùng chạm; số / chữ cái.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const part = (page, id) => page.locator(`.cl-paper [data-part="${id}"]`);
const want = async (page) => {
  const card = page.locator('.cl-request');
  return { part: await card.getAttribute('data-want-part'), color: await card.getAttribute('data-want-color') };
};
/** Chạm chuột thật vào điểm (x, y) theo tọa độ hình 200×200 — kiểm tra đúng vùng chạm. */
async function tapAt(page, x, y) {
  const box = await page.locator('.cl-paper svg').boundingBox();
  await page.mouse.click(box.x + (x / 200) * box.width, box.y + (y / 200) * box.height);
}
const pickColor = (page, id) => page.locator(`.cl-swatch[data-color="${id}"]`).click();
const colorOf = (page, id) => part(page, id).getAttribute('data-color');

async function openColoring(page) {
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Tô màu' }).click();
  await expect(page.locator('.cl-card').first()).toBeVisible();
}
async function openPicture(page, tab, name) {
  await page.getByRole('tab', { name: tab, exact: true }).click();
  await page.getByRole('button', { name, exact: true }).click();
  await expect(page.locator('.cl-paper svg')).toBeVisible();
}

test('tô bướm: giao việc → khác màu thì "Now try …" + gợi ý màu, việc giữ nguyên → đúng màu thì hoan hô, việc mới; tô phần khác không đổi việc', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openColoring(page);
  await expect(page.locator('.cl-card')).toHaveCount(15);
  await openPicture(page, 'Con vật', 'Con bướm');
  await expect.poll(() => spoken(page)).toContain("Let's color the butterfly!");
  const task = await want(page);
  expect(task.part).toBeTruthy();
  await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(new RegExp(`^Color the .+ ${task.color}!$`)));

  // Khác màu trên đúng phần: vẫn tô, nhắc màu cần tìm, màu đó mới nhấp nháy; việc chưa xong.
  await expect(page.locator('.cl-swatch.wanted')).toHaveCount(0);
  const other = task.color === 'red' ? 'blue' : 'red';
  await pickColor(page, other);
  await expect(page.locator(`.cl-swatch[data-color="${other}"]`)).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.cl-swatch[aria-checked="true"]')).toHaveCount(1);
  await part(page, task.part).dispatchEvent('click');
  expect(await colorOf(page, task.part)).toBe(other);
  await expect.poll(() => spoken(page)).toContain(`Now try ${task.color}!`);
  await expect(page.locator(`.cl-swatch[data-color="${task.color}"]`)).toHaveClass(/wanted/);
  expect(await want(page)).toEqual(task);

  // Tô phần khác: việc giữ nguyên.
  const otherPart = ['wings', 'body', 'head', 'antennae'].find((p) => p !== task.part);
  await part(page, otherPart).dispatchEvent('click');
  expect(await want(page)).toEqual(task);

  // Đúng màu: hoan hô (một câu "Yay! …"), việc mới là phần khác.
  await pickColor(page, task.color);
  await expect.poll(() => spoken(page)).toContain(`${task.color[0].toUpperCase()}${task.color.slice(1)}!`);
  await part(page, task.part).dispatchEvent('click');
  await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(new RegExp(`^Yay! The .+ ${task.color}!$`)));
  await expect.poll(() => want(page).then((w) => w.part)).not.toBe(task.part);
  await expect(page.locator('.cl-swatch.wanted')).toHaveCount(0);
});

test('vùng chạm: chạm cửa sổ chỉ tô cửa sổ, chạm thân xe tô thân xe, chạm nét trang trí tô phần bên dưới, chạm nền ngoài hình không tô gì', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openColoring(page);
  await openPicture(page, 'Đồ vật', 'Ô tô');
  await pickColor(page, 'blue');
  await tapAt(page, 100, 84); // cửa sổ trước
  expect(await colorOf(page, 'windows')).toBe('blue');
  expect(await colorOf(page, 'car')).toBe('');
  await pickColor(page, 'red');
  await tapAt(page, 60, 122); // thân xe
  expect(await colorOf(page, 'car')).toBe('red');
  expect(await colorOf(page, 'windows')).toBe('blue');
  await pickColor(page, 'green');
  await tapAt(page, 114, 118); // nét cửa xe (trang trí) nằm trên thân xe
  expect(await colorOf(page, 'car')).toBe('green');
  await pickColor(page, 'yellow');
  await tapAt(page, 8, 8); // nền
  for (const id of ['car', 'windows', 'wheels', 'light']) expect(await colorOf(page, id)).not.toBe('yellow');
  // Phần nhiều đối tượng: chạm một bánh là tô cả hai bánh.
  await pickColor(page, 'black');
  await tapAt(page, 56, 152);
  expect(await colorOf(page, 'wheels')).toBe('black');
  await expect(part(page, 'wheels')).toHaveAttribute('style', /fill: ?(rgb\(63, 63, 70\)|#3f3f46)/);
});

test('tô hết bướm → "Wow! A beautiful butterfly!"; thẻ có ✨ và đúng màu; mở lại app vẫn còn màu; trắng là tẩy; 🧹 xóa hết', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openColoring(page);
  await openPicture(page, 'Con vật', 'Con bướm');
  await pickColor(page, 'black');
  await tapAt(page, 84, 22); // râu (phần nét)
  await tapAt(page, 100, 120); // thân
  await tapAt(page, 100, 38); // đầu
  await pickColor(page, 'purple');
  await tapAt(page, 40, 72); // cánh
  expect(await colorOf(page, 'antennae')).toBe('black');
  expect(await colorOf(page, 'wings')).toBe('purple');
  await expect.poll(() => spoken(page)).toContain('Wow! A beautiful butterfly!');

  await page.getByRole('button', { name: 'Chọn hình khác' }).click();
  const card = page.locator('.cl-card[data-pic="butterfly"]');
  await expect(card.locator('.cl-done')).toHaveText('✨');
  await expect(card.locator('[data-part="wings"]')).toHaveAttribute('data-color', 'purple');

  // Mở lại app: màu còn nguyên.
  await page.goto('/?fast&nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await openColoring(page);
  await page.getByRole('button', { name: 'Con bướm', exact: true }).click();
  expect(await colorOf(page, 'wings')).toBe('purple');

  // Trắng = tẩy: phần về chưa tô; hình không còn "xong".
  await pickColor(page, 'white');
  await tapAt(page, 40, 72);
  expect(await colorOf(page, 'wings')).toBe('');
  await expect.poll(() => page.evaluate(() => window.kidEnglish.settings.coloring.butterfly.wings ?? null)).toBeNull();

  await page.getByRole('button', { name: 'Tô lại' }).click();
  await page.getByRole('button', { name: 'Xóa hết màu' }).click();
  for (const id of ['wings', 'body', 'head', 'antennae']) expect(await colorOf(page, id)).toBe('');
  await expect.poll(() => spoken(page)).toContain("Let's start again!");
  await expect(page.getByRole('button', { name: 'Tô lại' })).toBeHidden();
});

test('chạm Bông: bỏ việc đang giao, giao đúng một việc mới mỗi lần chạm; hết việc hợp lệ thì tô tự do', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openColoring(page);
  await openPicture(page, 'Đồ vật', 'Ông mặt trời'); // 2 phần: rays, sun
  const first = await want(page);
  const before = (await spoken(page)).length;
  await page.getByRole('button', { name: 'Bông giao việc' }).click();
  await expect.poll(() => want(page).then((w) => w.part)).not.toBe(first.part);
  await page.waitForTimeout(300);
  expect((await spoken(page)).slice(before).filter((t) => /^Color the /.test(t)).length).toBe(1);
  // Làm đúng việc còn lại → hết việc (việc đã bỏ không quay lại) → tô tự do, không kẹt.
  for (let i = 0; i < 2 && await page.locator('.cl-request').isVisible(); i++) {
    const w = await want(page);
    await pickColor(page, w.color);
    await part(page, w.part).dispatchEvent('click');
  }
  await expect.poll(() => spoken(page)).toContain('Color anything you like!');
  await expect(page.locator('.cl-request')).toBeHidden();
});

test('số 3: có 3 ngôi sao, chạm một sao tô cả nhóm, Bông đếm; nhóm Chữ cái có 26 thẻ, chữ hoa / thường tô riêng; nhớ nhóm đang xem', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openColoring(page);
  await page.getByRole('tab', { name: 'Số', exact: true }).click();
  await expect(page.locator('.cl-card')).toHaveCount(10);
  await page.getByRole('button', { name: 'Số 3', exact: true }).click();
  await expect(part(page, 'stars').locator('polygon')).toHaveCount(3);
  await pickColor(page, 'yellow');
  await part(page, 'stars').locator('polygon').first().dispatchEvent('click');
  expect(await colorOf(page, 'stars')).toBe('yellow');
  await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(/^(Yay! )?One, two, three! The three stars are yellow!$/));

  await page.getByRole('button', { name: 'Chọn hình khác' }).click();
  await page.getByRole('tab', { name: 'Chữ cái', exact: true }).click();
  await expect(page.locator('.cl-card')).toHaveCount(26);
  await page.getByRole('button', { name: 'Chữ A', exact: true }).click();
  await pickColor(page, 'red');
  await part(page, 'big').dispatchEvent('click');
  expect(await colorOf(page, 'big')).toBe('red');
  expect(await colorOf(page, 'small')).toBe('');
  await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(/The big A is red!$/));

  // Nhớ nhóm: ra Góc trò chơi rồi vào lại vẫn ở Chữ cái.
  await page.evaluate(() => window.kidEnglish.go('play'));
  await page.getByRole('button', { name: 'Tô màu' }).click();
  await expect(page.getByRole('tab', { name: 'Chữ cái', exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('dữ liệu màu hỏng / mã lạ không làm lỗi: thẻ vẫn hiện, phần lạ bị bỏ', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(() => window.kidEnglish.setSetting('coloring', {
    butterfly: { wings: 'gold', tail: 'red', body: 'pink' }, nope: { a: 'red' }, fish: 'hỏng', cat: null,
  }));
  await openColoring(page);
  await expect(page.locator('.cl-card')).toHaveCount(15);
  await page.getByRole('button', { name: 'Con bướm', exact: true }).click();
  expect(await colorOf(page, 'wings')).toBe('');
  expect(await colorOf(page, 'body')).toBe('pink');
  await page.getByRole('button', { name: 'Chọn hình khác' }).click();
  await page.getByRole('button', { name: 'Con cá', exact: true }).click();
  await expect(part(page, 'body')).toBeVisible();
  expect(errors).toEqual([]);
});
