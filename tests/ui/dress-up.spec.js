// Trò chơi Mặc đồ (SPEC-dressup.md): chọn bé → chạm / kéo đồ mặc, kéo ra cởi, thay đồ cùng chỗ, câu nói,
// Bông giao việc, cởi hết, nhớ bộ đồ của từng bé.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const lastSpoken = async (page) => (await spoken(page)).at(-1);
const worn = (page) => page.evaluate(() => [...new Set([...document.querySelectorAll('.du-piece')].map((e) => e.dataset.item))].sort());

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
  await expect(page.locator('.du-cloth')).toHaveCount(21);

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
  await expect(page.locator('.du-piece[data-item="boots"]')).toHaveCount(2);
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
