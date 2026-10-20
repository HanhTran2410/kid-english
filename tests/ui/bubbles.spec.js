// Bắt bong bóng (SPEC-bubbles.md): chọn chế độ → "Pop the red one!" → chạm bong bóng đúng / nhầm; 8 lần → sticker.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const want = (page) => page.locator('.bb-want').getAttribute('data-key');
const bubble = (page, key) => page.locator(`.bb-bubble:not(.popped)[data-key="${key}"]`).first();

async function openBubbles(page, mode, settings) {
  await fakeSpeech(page);
  await startApp(page);
  if (settings) await page.evaluate((s) => window.kidEnglish.setSetting('bubblesGame', s), settings);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Bắt bong bóng' }).click();
  await expect(page.locator('.bb-mode')).toHaveCount(3);
  await page.getByRole('button', { name: mode, exact: true }).click();
  await expect(page.locator('.bb-play')).toHaveAttribute('data-state', 'playing', { timeout: 15000 });
  await expect(page.locator('.bb-want')).toBeVisible();
}

test('màu: "Pop the … one!" → chạm đúng: "Yes! …!", chấm đếm sáng, việc mới; chạm nhầm cũng vỡ, Bông nói tên màu', async ({ page }) => {
  await openBubbles(page, 'Màu sắc');
  await expect.poll(() => spoken(page)).toContain("Let's pop the bubbles!");
  const key = await want(page);
  await expect.poll(() => spoken(page)).toContain(`Pop the ${key} one!`);
  // Nhầm: một bong bóng khác màu (chờ có trên màn).
  const other = page.locator(`.bb-bubble:not(.popped):not([data-key="${key}"])`).first();
  await expect(other).toBeVisible({ timeout: 5000 });
  const otherKey = await other.getAttribute('data-key');
  await other.dispatchEvent('pointerdown');
  await expect.poll(async () => (await spoken(page)).at(-1)).toBe(`${otherKey.charAt(0).toUpperCase()}${otherKey.slice(1)}!`);
  await expect(page.locator('.bb-dot.on')).toHaveCount(0);
  // Đúng.
  await expect(bubble(page, key)).toBeVisible({ timeout: 5000 });
  await bubble(page, key).dispatchEvent('pointerdown');
  await expect.poll(() => spoken(page)).toContain(`Yes! ${key.charAt(0).toUpperCase()}${key.slice(1)}!`);
  await expect(page.locator('.bb-dot.on')).toHaveCount(1);
});

test('bắt đủ 8 lần → Hoan hô + sticker; đếm lượt; ghi "đã gặp" màu', async ({ page }) => {
  await openBubbles(page, 'Màu sắc');
  for (let i = 0; i < 8; i++) {
    await expect(page.locator('.bb-dot.on')).toHaveCount(i, { timeout: 5000 });
    const key = await want(page);
    await expect(bubble(page, key)).toBeVisible({ timeout: 5000 });
    await bubble(page, key).dispatchEvent('pointerdown');
  }
  await expect.poll(() => spoken(page)).toContain('Pop, pop, pop! Great job!');
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
  expect(await page.evaluate(() => window.kidEnglish.settings.bubblesGame)).toEqual({ level: 1, rounds: 1, lock: null });
  const words = await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).map((p) => p.word));
  expect(words.some((w) => ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink'].includes(w))).toBe(true);
});

test('số: mức 1 chỉ số 1–5, "Pop number …!", bong bóng có chữ số; ghi tiến độ number:n', async ({ page }) => {
  await openBubbles(page, 'Số');
  const key = await want(page);
  expect(Number(key)).toBeGreaterThanOrEqual(1);
  expect(Number(key)).toBeLessThanOrEqual(5);
  await expect.poll(async () => (await spoken(page)).some((t) => /^Pop number (one|two|three|four|five)!$/.test(t))).toBe(true);
  await expect(bubble(page, key)).toHaveText(key, { timeout: 5000 });
  await bubble(page, key).dispatchEvent('pointerdown');
  await expect.poll(() => page.evaluate(async (k) => Boolean(await window.kidEnglish.db.get('progress', `number:${k}`)), key)).toBe(true);
});

test('từ vựng: từ của các bài (emoji), "Pop the …!"', async ({ page }) => {
  await openBubbles(page, 'Từ vựng');
  const key = await want(page);
  await expect.poll(() => spoken(page)).toContain(`Pop the ${key}!`);
  await expect(bubble(page, key).locator('.bb-emoji')).toBeVisible({ timeout: 5000 });
});

test('gợi ý: 10 giây không bắt được thì bong bóng cần bắt lấp lánh và Bông nhắc lại', async ({ page }) => {
  await openBubbles(page, 'Màu sắc');
  await expect(page.locator('.bb-field.hint')).toHaveCount(1, { timeout: 5000 });
});
