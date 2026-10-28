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

test('máy có 2 giọng tiếng Anh (Cô giáo nhí): cô giáo (người lớn) giọng chính; bạn học sinh, cả lớp, các bạn giọng thứ hai; phụ đề của nhân vật khác viền xanh', async ({ page }) => {
  await openTeacher(page, { altVoice: true });
  await expect.poll(() => page.evaluate(() => window.__spoken)).toContain('Ring the bell, teacher!');
  expect(await voiceOf(page, 'Ring the bell, teacher!')).toBe('Test English Two');
  await expect(page.locator('.sp-caption')).toHaveAttribute('data-who', 'bong');
  await page.locator('.tc-bell').click();
  await expect.poll(() => page.evaluate(() => window.__spoken)).toContain('Good morning, teacher!');
  expect(await voiceOf(page, 'Good morning, class!')).toBe('Test English');
  expect(await voiceOf(page, 'Good morning, teacher!')).toBe('Test English Two');
  await expect.poll(async () => page.evaluate(() => window.__spoken.some((t) => /^Where's \w+\?$/.test(t)))).toBe(true);
  const where = await page.evaluate(() => window.__spoken.find((t) => /^Where's \w+\?$/.test(t)));
  expect(await voiceOf(page, where)).toBe('Test English'); // cô giáo điểm danh
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

test('máy chỉ có 1 giọng tiếng Anh (Cô giáo nhí): cô giáo giọng thường, bạn học sinh / cả lớp cao giọng hơn', async ({ page }) => {
  await openTeacher(page);
  await page.locator('.tc-bell').click();
  await expect.poll(() => page.evaluate(() => window.__spoken)).toContain('Good morning, teacher!');
  const pitchOf = (line) => page.evaluate((t) => window.__pitches[window.__spoken.lastIndexOf(t)], line);
  expect(await pitchOf('Ring the bell, teacher!')).toBeGreaterThan(1);
  expect(await pitchOf('Good morning, class!')).toBe(1);
  expect(await pitchOf('Good morning, teacher!')).toBeGreaterThan(1);
});
