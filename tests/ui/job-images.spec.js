// Ảnh nền Đóng vai (SPEC-jobs.md mục 8): Góc bố mẹ → Ảnh Đóng vai; ảnh nền hiện trong trò chơi của nghề đó.
// Cài đặt → khóa mức từng nghề (J6).
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

const addBg = (page, word) => page.evaluate(async (w) => {
  const db = await import('/js/db.js');
  const png = await new Promise((r) => { const c = document.createElement('canvas'); c.width = 80; c.height = 60; c.getContext('2d').fillRect(0, 0, 80, 60); c.toBlob(r, 'image/png'); });
  await db.setWordImage(window.kidEnglish.db, { lessonId: 'jobs:bg', word: w, blob: png, mimeType: 'image/png', width: 80, height: 60 });
}, word);
const bgWords = (page) => page.evaluate(async () => (await window.kidEnglish.db.getAllByIndex('images', 'lessonId', 'jobs:bg')).map((i) => i.word).sort());

test('Góc bố mẹ → Ảnh Đóng vai: 5 nghề, nghề có ảnh hiện ảnh + "Dùng nền vẽ sẵn" bỏ ảnh', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await addBg(page, 'post');
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Đóng vai/ }).click();
  await expect(page.locator('.jb-admin-job')).toHaveCount(5);
  await expect(page.locator('.jb-admin-job[data-job="post"] img')).toHaveCount(1);
  await expect(page.locator('.jb-admin-job[data-job="shop"] img')).toHaveCount(0);
  await page.locator('.jb-admin-job[data-job="post"]').getByRole('button', { name: 'Dùng nền vẽ sẵn' }).click();
  await expect.poll(() => bgWords(page)).toEqual([]);
});

test('ảnh nền bố mẹ thêm hiện trong trò chơi (Bưu tá), nghề khác vẫn nền vẽ sẵn', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await addBg(page, 'post');
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Bưu tá' }).click();
  await expect(page.locator('.ps-stage.has-bg')).toHaveCount(1, { timeout: 15000 });
  await page.getByRole('button', { name: 'Chọn nghề' }).click();
  await page.getByRole('button', { name: 'Bán hàng' }).click();
  await expect(page.locator('.sh-play')).toHaveAttribute('data-state', /stock|enter|order/, { timeout: 15000 });
  await expect(page.locator('.sh-stage.has-bg')).toHaveCount(0);
});

test('J6: Cài đặt → khóa mức Bưu tá ở mức 2 → lưu postGame { level: 2, lock: 2 }, vào trò là 4 nhà cùng màu', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: /Cài đặt/ }).click();
  await page.getByLabel('Mức chơi Bưu tá').selectOption('2');
  await expect.poll(() => page.evaluate(() => window.kidEnglish.settings.postGame)).toMatchObject({ level: 2, lock: 2 });
  await expect(page.getByLabel('Mức chơi Lính cứu hỏa')).toBeVisible();
  await page.evaluate(() => window.kidEnglish.go('play'));
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Bưu tá' }).click();
  await expect(page.locator('.ps-house')).toHaveCount(4, { timeout: 15000 });
  expect(new Set(await page.locator('.ps-house').evaluateAll((els) => els.map((e) => e.dataset.color))).size).toBe(1);
});
