// Chụp các màn hình chính ở kích thước iPhone và iPad để soi giao diện.
// Chạy server trước (node scripts/serve.mjs 4173), rồi: node scripts/screens.mjs [thư-mục-ảnh/]
import { chromium } from '@playwright/test';
import { fakeSpeech, hold } from '../tests/ui/helpers.js';

const out = process.argv[2] ?? 'test-results/screens/';
const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });

for (const [name, viewport] of [['iphone', { width: 390, height: 844 }], ['ipad', { width: 1180, height: 820 }]]) {
  const ctx = await browser.newContext({ viewport, permissions: ['microphone'], reducedMotion: 'reduce', hasTouch: name === 'iphone' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  page.on('console', (m) => m.type() === 'error' && console.log('[console]', m.text()));
  await fakeSpeech(page);
  const shot = (n) => page.screenshot({ path: `${out}${name}-${n}.png` });
  await page.goto('http://localhost:4173/?fast&nosw');
  await shot('1-start');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await shot('2-home');
  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.waitForTimeout(300);
  await shot('3-lessons');
  await page.getByRole('button', { name: 'Animals' }).click();
  await page.locator('.word-label').waitFor();
  await shot('4-word');
  await page.locator('.child-hint').waitFor({ timeout: 20000 });
  await shot('5-conversation');
  await page.locator('.choice').first().waitFor({ timeout: 30000 });
  await shot('6-quiz');
  await page.locator('.story-line').waitFor({ timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(100);
  await shot('7-story');
  await page.locator('.done-btn').waitFor({ timeout: 60000 }).catch(async () => {
    for (let i = 0; i < 50 && !(await page.locator('.done-btn').isVisible()); i++) {
      await page.locator('.choice').first().click({ timeout: 500 }).catch(() => {});
      await page.waitForTimeout(200);
    }
  });
  await shot('8-done');
  await page.locator('.done-btn').click();
  await page.getByRole('button', { name: 'Sticker' }).click();
  await shot('9-stickers');
  await hold(page, page.getByRole('button', { name: /Giữ để về màn hình chính/ }), 1800);
  await hold(page, page.getByRole('button', { name: /Góc bố mẹ/ }));
  await shot('10-parent');
  await page.getByRole('button', { name: 'Tạo bài học' }).click();
  await shot('11-create');
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: 'Bé đã học' }).click();
  await shot('12-progress');
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: 'Nghe lại giọng bé' }).click();
  await page.waitForTimeout(300);
  await shot('13-recordings');
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: 'Quản lý bài' }).click();
  await page.getByRole('button', { name: /Animals/ }).click();
  await shot('14-lesson-admin');
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: 'Sao lưu / Khôi phục' }).click();
  await shot('15-backup');
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: 'Cài đặt & chẩn đoán' }).click();
  await page.screenshot({ path: `${out}${name}-16-settings.png`, fullPage: true });
  await page.evaluate(() => {
    window.kidEnglish.session.usedMs = 99 * 60000;
    window.kidEnglish.go('home');
  });
  await shot('17-sleep');
  await ctx.close();
}
await browser.close();
console.log('xong');
