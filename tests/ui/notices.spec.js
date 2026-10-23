// Chuông thông báo (SPEC-drive.md mục 10) ở màn hình chính: bài mới trong Thư viện bài, bản app mới.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const check = (page) => page.evaluate(async () => (await import('/js/notices.js')).checkNotices(window.kidEnglish).then((s) => s.lessons.length));

test('lần đầu không có chuông (cả thư viện hiện có làm mốc); có bài mới → 🔔 1 ở màn hình chính → Nhập → bài vào máy, chuông ẩn', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  expect(await check(page)).toBe(0);
  await expect(page.locator('.home-top .notice-bell')).toBeHidden();
  // Giả sử 26-vehicles.zip vừa được tải lên thư viện (máy này chưa thấy).
  await page.evaluate(() => window.kidEnglish.setSetting('librarySeen', window.kidEnglish.settings.librarySeen.filter((k) => !k.startsWith('26-vehicles.zip|'))));
  expect(await check(page)).toBe(1);
  const bell = page.locator('.home-top .notice-bell');
  await expect(bell).toBeVisible();
  await expect(bell.locator('.notice-badge')).toHaveText('1');
  await bell.click();
  const row = page.locator('.notice-row[data-file="26-vehicles.zip"]');
  await expect(row).toContainText('Vehicles');
  await row.getByRole('button', { name: 'Nhập' }).click();
  await expect.poll(() => page.evaluate(async () => (await window.kidEnglish.db.getAll('lessons')).some((l) => l.title === 'Vehicles'))).toBe(true);
  await expect(page.locator('.notice-panel')).toContainText('Không có thông báo mới.');
  await expect(bell).toBeHidden();
});

test('có bản app mới → chuông báo "Có bản mới …" + nút Cập nhật ngay; "Để sau" với bài mới thì không báo lại', async ({ page }) => {
  await page.route('**/sw.js', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: "const VERSION = '99.0.0';" }));
  await fakeSpeech(page);
  await startApp(page);
  await check(page);
  await page.evaluate(() => window.kidEnglish.setSetting('librarySeen', window.kidEnglish.settings.librarySeen.slice(2)));
  await check(page);
  const bell = page.locator('.home-top .notice-bell');
  await expect(bell.locator('.notice-badge')).toHaveText('3');
  await bell.click();
  await expect(page.locator('.notice-update')).toContainText('Có bản mới 99.0.0');
  await expect(page.getByRole('button', { name: 'Cập nhật ngay' })).toBeVisible();
  await page.getByRole('button', { name: 'Để sau' }).click();
  await expect(bell.locator('.notice-badge')).toHaveText('1');
  expect(await check(page)).toBe(0);
});
