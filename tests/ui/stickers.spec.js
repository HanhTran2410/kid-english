// Bộ sưu tập 100 sticker chia 5 album (bé đã đủ 40 sticker cũ thì sang album 3).
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

test('đủ 40 sticker cũ: màn sticker mở album 3, album 1–2 có ✅, xem lại được album cũ; học xong được sticker mới ở album 3', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  const old = await page.evaluate(async () => {
    const { STICKERS } = await import('/js/stickers.js');
    for (const s of STICKERS.slice(0, 40)) await window.kidEnglish.db.put('stickers', { id: s.id, firstEarnedAt: Date.now(), count: 1 });
    return STICKERS.slice(40, 60).map((s) => s.name);
  });

  await page.getByRole('button', { name: 'Sticker của bé' }).click();
  await expect(page.locator('.sticker-count')).toHaveText('40/100');
  await expect(page.locator('.album-tab')).toHaveCount(5);
  await expect(page.locator('.album-tab.active')).toHaveAttribute('aria-label', 'Album 3');
  await expect(page.locator('.album-tab.full')).toHaveCount(2);
  await expect(page.locator('.sticker')).toHaveCount(20);
  await expect(page.locator('.sticker.missing')).toHaveCount(20);

  await page.getByRole('button', { name: 'Album 1' }).click();
  await expect(page.locator('.sticker.owned')).toHaveCount(20);
  await page.getByRole('button', { name: 'Lion' }).click();
  expect(await page.evaluate(() => window.__spoken.at(-1))).toBe('Lion!');

  // Học xong một bài → sticker mới thuộc album 3.
  await page.locator('.home-btn-small').click();
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  const { playThrough } = await import('./helpers.js');
  await playThrough(page);
  const prize = await page.locator('.prize-sticker').getAttribute('aria-label');
  expect(old).toContain(prize);
});
