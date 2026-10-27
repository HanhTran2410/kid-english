// Đóng vai: nhân vật khác Bông (cô giáo, cả lớp, bạn thú…) nói giọng thứ hai; phụ đề viền khác màu theo người nói.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const voiceOf = (page, line) => page.evaluate((t) => window.__voiceNames[window.__spoken.lastIndexOf(t)], line);

async function openTeacher(page, opts) {
  await fakeSpeech(page, opts);
  await startApp(page);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Cô giáo nhí' }).click();
  await expect(page.locator('.tc-play')).toHaveAttribute('data-state', 'bell', { timeout: 15000 });
}

test('máy có 2 giọng tiếng Anh: Bông giọng chính, cô giáo / cả lớp giọng thứ hai; phụ đề của nhân vật khác Bông viền xanh', async ({ page }) => {
  await openTeacher(page, { altVoice: true });
  await expect.poll(() => page.evaluate(() => window.__spoken)).toContain('Ring the bell, teacher!');
  expect(await voiceOf(page, 'Ring the bell, teacher!')).toBe('Test English');
  await expect(page.locator('.sp-caption')).toHaveAttribute('data-who', 'bong');
  await page.locator('.tc-bell').click();
  await expect.poll(() => page.evaluate(() => window.__spoken)).toContain('Good morning, teacher!');
  expect(await voiceOf(page, 'Good morning, class!')).toBe('Test English Two');
  expect(await voiceOf(page, 'Good morning, teacher!')).toBe('Test English Two');
  await expect.poll(async () => page.evaluate(() => window.__spoken.some((t) => /^Where's \w+\?$/.test(t)))).toBe(true);
  await page.evaluate(() => {
    // Phụ đề lúc một bạn nói: viền xanh (khác viền vàng của Bông).
    window.__capBorder = null;
    new MutationObserver(() => {
      const c = document.querySelector('.sp-caption:not([data-who="bong"])');
      if (c) window.__capBorder = getComputedStyle(c).borderTopColor;
    }).observe(document.body, { childList: true, subtree: true });
  });
  await page.locator(`.tc-pupil[data-pupil="${await page.locator('.tc-picture').getAttribute('data-word')}"]`).click();
  await expect.poll(() => page.evaluate(() => window.__capBorder)).toBe('rgb(77, 171, 247)');
});

test('máy chỉ có 1 giọng tiếng Anh: nhân vật khác Bông nói cao giọng hơn', async ({ page }) => {
  await openTeacher(page);
  await page.locator('.tc-bell').click();
  await expect.poll(() => page.evaluate(() => window.__spoken)).toContain('Good morning, teacher!');
  const pitchOf = (line) => page.evaluate((t) => window.__pitches[window.__spoken.lastIndexOf(t)], line);
  expect(await pitchOf('Ring the bell, teacher!')).toBe(1);
  expect(await pitchOf('Good morning, class!')).toBeGreaterThan(1);
});
