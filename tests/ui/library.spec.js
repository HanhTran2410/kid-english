// Thư viện bài trên GitHub (SPEC-drive.md mục 8): Quản lý bài → 📚 Thư viện bài → Nhập; nhập bằng link GitHub.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

async function openLessons(page) {
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: /Quản lý bài/ }).click();
}
const titles = (page) => page.evaluate(async () => (await window.kidEnglish.db.getAll('lessons')).map((l) => l.title));

test('📚 Thư viện bài: liệt kê các file trong shared/index.json; "Nhập" thêm bài vào máy, hiện "Đã có" khi mở lại', async ({ page }) => {
  await openLessons(page);
  await page.getByRole('button', { name: '📚 Thư viện bài' }).click();
  const count = await page.evaluate(async () => (await (await fetch('shared/index.json')).json()).files.length);
  await expect(page.locator('.shared-item')).toHaveCount(count);
  const row = page.locator('.shared-item[data-file="09-wild-animals.zip"]');
  await row.getByRole('button', { name: 'Nhập' }).click();
  await expect.poll(() => titles(page)).toContain('Wild Animals');
  await page.getByRole('button', { name: '📚 Thư viện bài' }).click();
  await expect(page.locator('.shared-item[data-file="09-wild-animals.zip"] .shared-status')).toHaveText('✓ Đã có');
});

test('Nhập bài từ link: dán link file .zip trên trang app là nhập được', async ({ page }) => {
  await openLessons(page);
  await page.getByRole('button', { name: 'Nhập bài từ link' }).click();
  await page.getByRole('textbox', { name: 'Link bài học' }).fill(new URL('shared/12-fruits.zip', page.url()).href);
  await page.getByRole('button', { name: 'Nhập', exact: true }).click();
  await expect.poll(() => titles(page)).toContain('Fruits');
});

test('mở app bằng link nhập bài #zip= → Quản lý bài điền sẵn link', async ({ page }) => {
  await fakeSpeech(page);
  await page.goto(`/?fast&nosw#zip=${encodeURIComponent('shared/13-more-fruits.zip')}`);
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.getByRole('button', { name: 'Từ vựng' }).waitFor();
  await openParent(page);
  await page.getByRole('button', { name: /Quản lý bài/ }).click();
  await expect(page.getByRole('textbox', { name: 'Link bài học' })).toHaveValue(/#zip=shared%2F13-more-fruits\.zip/);
  await page.getByRole('button', { name: 'Nhập', exact: true }).click();
  await expect.poll(() => titles(page)).toContain('More Fruits');
});
