// Trò chơi Mặc đồ (SPEC-dressup.md): chọn bé → chạm / kéo đồ mặc, kéo ra cởi, thay đồ cùng chỗ, câu nói,
// Bông giao việc, cởi hết, nhớ bộ đồ của từng bé.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const lastSpoken = async (page) => (await spoken(page)).at(-1);
// Món đang mặc (cả món không thấy ở mặt đang xem, ví dụ kính khi quay lưng).
const worn = (page) => page.evaluate(() => (document.querySelector('.du-doll').dataset.worn || '').split(' ').filter(Boolean).sort());
const view = (page) => page.locator('.du-doll').getAttribute('data-view');

async function drag(page, from, to) {
  const a = await from.boundingBox().then((b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 }));
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(a.x, a.y - 30, { steps: 3 });
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await page.mouse.up();
}
const cloth = (page, id) => page.locator(`.du-cloth[data-item="${id}"]`);

async function openDressUp(page, kid) {
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Mặc đồ' }).click();
  await page.getByRole('button', { name: kid }).click();
  await expect(page.locator('.du-doll')).toBeVisible();
}

test('mặc đồ: chọn bé gái → chạm áo phông, kéo quần bò, thay áo, váy thay áo + quần, kéo ra cởi; câu nói đúng', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Mặc đồ' }).click();
  await expect.poll(() => spoken(page)).toContain('Who do you want to dress?');
  await page.getByRole('button', { name: 'Bé gái' }).click();
  await expect(page.locator('.du-doll')).toHaveAttribute('data-kid', 'girl');
  await expect.poll(() => spoken(page)).toContain("Let's get dressed!");
  await expect(page.locator('.du-cloth')).toHaveCount(24); // tủ đồ bé gái: đồ riêng bé gái + đồ chung

  // Chạm áo phông → mặc.
  await cloth(page, 't-shirt').click();
  await expect.poll(() => worn(page)).toEqual(['t-shirt']);
  await expect.poll(() => lastSpoken(page)).toBe("I'm wearing a T-shirt!");
  await expect(cloth(page, 't-shirt')).toHaveClass(/on/);

  // Kéo quần bò vào người bạn nhỏ.
  const doll = await page.locator('.du-doll').boundingBox();
  await drag(page, cloth(page, 'jeans'), { x: doll.x + doll.width / 2, y: doll.y + doll.height / 2 });
  await expect.poll(() => worn(page)).toEqual(['jeans', 't-shirt']);
  await expect.poll(() => lastSpoken(page)).toBe("I'm wearing jeans!");

  // Áo sơ mi thay áo phông (cùng chỗ).
  await cloth(page, 'shirt').click();
  await expect.poll(() => worn(page)).toEqual(['jeans', 'shirt']);

  // Váy thay cả áo và quần; giày đủ đôi.
  await cloth(page, 'dress').click();
  await cloth(page, 'boots').scrollIntoViewIfNeeded();
  await cloth(page, 'boots').click();
  await expect.poll(() => worn(page)).toEqual(['boots', 'dress']);
  await expect.poll(() => lastSpoken(page)).toMatch(/^(I'm wearing boots!|Put on your|It's|Let's)/);

  // Kéo váy ra khỏi người → cởi.
  const box = await page.locator('.du-piece[data-item="dress"]').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.7);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.7 - 30, { steps: 3 });
  await page.mouse.move(doll.x + doll.width + 150, doll.y + doll.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => worn(page)).toEqual(['boots']);
  await expect.poll(() => spoken(page)).toContain('I took off my dress!');
});

test('mặc đồ: Bông giao việc có ngữ cảnh → mặc đúng → khen; 🧹 cởi hết hỏi lại; mỗi bé nhớ bộ đồ riêng', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openDressUp(page, 'Bé trai');
  await page.getByRole('button', { name: 'Bông giao việc' }).click();
  const want = await page.locator('.sp-request').getAttribute('data-item');
  await expect.poll(() => lastSpoken(page)).toMatch(/(Put on|Take) your /);
  await expect(cloth(page, want)).toHaveClass(/wanted/);
  await expect(cloth(page, want)).toBeInViewport({ ratio: 0.9 });
  // Chạm Bông lần 2: cùng việc.
  await page.getByRole('button', { name: 'Bông giao việc' }).click();
  await expect(page.locator('.sp-request')).toHaveAttribute('data-item', want);
  await cloth(page, want).click();
  await expect.poll(() => lastSpoken(page)).toMatch(/^Yay! I/);
  await expect(page.locator('.sp-request')).toBeHidden();

  // Cởi hết: ✖ thì giữ, ✔ thì cởi.
  await page.getByRole('button', { name: 'Cởi hết' }).click();
  await page.getByRole('button', { name: 'Không cởi' }).click();
  await expect.poll(() => worn(page)).toEqual([want]);
  await page.getByRole('button', { name: 'Cởi hết' }).click();
  await page.getByRole('button', { name: 'Cởi hết đồ' }).click();
  await expect.poll(() => worn(page)).toEqual([]);

  // Bé trai mặc mũ, đổi sang bé gái mặc kính; quay lại bé trai vẫn đội mũ.
  await cloth(page, 'cap').click();
  await page.getByRole('button', { name: 'Đổi bé' }).click();
  await page.getByRole('button', { name: 'Bé gái' }).click();
  await cloth(page, 'glasses').scrollIntoViewIfNeeded();
  await cloth(page, 'glasses').click();
  await expect.poll(() => worn(page)).toEqual(['glasses']);
  await page.getByRole('button', { name: 'Đổi bé' }).click();
  await expect(page.locator('.du-kid.last')).toHaveAttribute('aria-label', 'Bé gái');
  await page.getByRole('button', { name: 'Bé trai' }).click();
  await expect.poll(() => worn(page)).toEqual(['cap']);
});

test('mặc đồ: chạm bạn nhỏ để xoay người; đeo ba lô thì tự quay lưng (thấy cả ba lô), đeo kính khi đang quay lưng thì tự quay lại', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openDressUp(page, 'Bé trai');
  await expect.poll(() => view(page)).toBe('front');
  const doll = await page.locator('.du-doll').boundingBox();
  await page.mouse.click(doll.x + doll.width / 2, doll.y + doll.height * 0.45);
  await expect.poll(() => view(page)).toBe('back');
  await expect.poll(() => lastSpoken(page)).toBe('Turn around!');
  await page.getByRole('button', { name: 'Xoay người' }).click();
  await expect.poll(() => view(page)).toBe('front');

  // Ba lô: mặt trước chỉ có quai; vừa đeo thì quay lưng.
  await cloth(page, 'backpack').scrollIntoViewIfNeeded();
  await cloth(page, 'backpack').click();
  await expect.poll(() => view(page)).toBe('back');
  await expect(page.locator('.du-art [data-item="backpack"] rect').first()).toBeVisible();
  await expect.poll(() => lastSpoken(page)).toBe("I'm wearing a backpack!");

  // Đang quay lưng mà đeo kính: quay lại để thấy kính.
  await cloth(page, 'glasses').scrollIntoViewIfNeeded();
  await cloth(page, 'glasses').click();
  await expect.poll(() => view(page)).toBe('front');
  await expect(page.locator('.du-art [data-item="glasses"]')).toHaveCount(1);
  await expect.poll(() => worn(page)).toEqual(['backpack', 'glasses']);
});

/** Ảnh thử: nền trắng, hình chữ nhật đỏ viền đen ở giữa (PNG). */
async function testImage(page) {
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 300;
    c.height = 300;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 300, 300);
    ctx.fillStyle = '#e33';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 8;
    ctx.fillRect(70, 50, 160, 200);
    ctx.strokeRect(70, 50, 160, 200);
    return c.toDataURL('image/png').split(',')[1];
  });
  return { name: 'cloth.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') };
}

test('mặc đồ: tủ đồ riêng — bé trai không thấy váy / nơ, có cà vạt; bé gái có váy, chân váy, không có cà vạt', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openDressUp(page, 'Bé trai');
  await expect(page.locator('.du-cloth')).toHaveCount(20);
  await expect(cloth(page, 'tie')).toHaveCount(1);
  await expect(cloth(page, 'dress')).toHaveCount(0);
  await expect(cloth(page, 'bow')).toHaveCount(0);
  await page.getByRole('button', { name: 'Đổi bé' }).click();
  await page.getByRole('button', { name: 'Bé gái' }).click();
  await expect(page.locator('.du-cloth')).toHaveCount(24);
  await expect(cloth(page, 'skirt')).toHaveCount(1);
  await expect(cloth(page, 'tie')).toHaveCount(0);
  await cloth(page, 'socks').scrollIntoViewIfNeeded();
  await cloth(page, 'socks').click();
  await expect.poll(() => lastSpoken(page)).toBe("I'm wearing socks!");
});

test('Góc bố mẹ → Đồ Mặc đồ: thêm đồ mới cho bé trai (có ảnh) → chỉ bé trai thấy, mặc được, câu đúng; thay ảnh áo phông → trò chơi dùng ảnh', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  const { openParent } = await import('./helpers.js');
  await openParent(page);
  await page.getByRole('button', { name: /Đồ Mặc đồ/ }).click();
  await expect(page.getByRole('heading', { name: /Đồ riêng bé gái/ })).toBeVisible();

  // Thêm "raincoat" (áo khoác) cho bé trai.
  await page.getByLabel(/Tên tiếng Anh/).fill('raincoat');
  await page.getByLabel(/Tên tiếng Việt/).fill('áo mưa');
  await page.getByLabel('Mặc ở đâu').selectOption('outer');
  await page.getByLabel('Dành cho').selectOption('boy');
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Chọn ảnh & thêm vào tủ đồ' }).click();
  await (await chooser).setFiles(await testImage(page));
  await expect(page.locator('.sp-admin-item', { hasText: 'raincoat' })).toBeVisible();
  const custom = await page.evaluate(() => window.kidEnglish.settings.dressUpCustom);
  expect(custom).toHaveLength(1);
  expect(custom[0]).toMatchObject({ name: 'raincoat', vi: 'áo mưa', slot: 'outer', kids: ['boy'] });
  const id = custom[0].id;

  // Thêm một kiểu váy khác cho bé gái: "＋ Kiểu khác" ở món váy điền sẵn tên / chỗ / dành cho.
  await page.locator('.sp-admin-item[data-item="dress"]').getByRole('button', { name: '＋ Kiểu khác' }).click();
  await expect(page.getByLabel(/Tên tiếng Anh/)).toHaveValue('dress');
  await expect(page.getByLabel('Mặc ở đâu')).toHaveValue('dress');
  await expect(page.getByLabel('Dành cho')).toHaveValue('girl');
  await page.getByLabel(/Tên tiếng Việt/).fill('váy hoa');
  const chooserV = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Chọn ảnh & thêm vào tủ đồ' }).click();
  await (await chooserV).setFiles(await testImage(page));
  await expect(page.getByText(/2 kiểu "dress"/)).toBeVisible();
  await expect(page.locator('.sp-admin-item', { hasText: 'váy hoa' })).toBeVisible();

  // Thay ảnh áo phông.
  const tshirt = page.locator('.sp-admin-item[data-item="t-shirt"]');
  const chooser2 = page.waitForEvent('filechooser');
  await tshirt.getByRole('button', { name: 'Chọn ảnh' }).click();
  await (await chooser2).setFiles(await testImage(page));
  await expect(page.locator('.sp-admin-item[data-item="t-shirt"] image')).toHaveCount(1);

  // Trò chơi: bé trai có raincoat (ảnh), mặc được; bé gái không có.
  await page.evaluate(() => window.kidEnglish.go('home'));
  await openDressUp(page, 'Bé trai');
  await expect(cloth(page, id)).toHaveCount(1);
  await expect(cloth(page, 't-shirt').locator('image')).toHaveCount(1);
  await cloth(page, id).scrollIntoViewIfNeeded();
  await cloth(page, id).click();
  await expect.poll(() => lastSpoken(page)).toBe("I'm wearing a raincoat!");
  await expect(page.locator(`.du-art [data-item="${id}"] image`)).toHaveCount(1);
  await page.getByRole('button', { name: 'Đổi bé' }).click();
  await page.getByRole('button', { name: 'Bé gái' }).click();
  await expect(cloth(page, id)).toHaveCount(0);
  // Bé gái có 2 kiểu váy; mặc kiểu váy hoa thì bé nghe "I'm wearing a dress!".
  await expect(page.getByRole('button', { name: 'Dress', exact: true })).toHaveCount(2);
  const variant = (await page.evaluate(() => window.kidEnglish.settings.dressUpCustom)).find((c) => c.vi === 'váy hoa').id;
  await cloth(page, variant).scrollIntoViewIfNeeded();
  await cloth(page, variant).click();
  await expect.poll(() => lastSpoken(page)).toBe("I'm wearing a dress!");
});
