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

test('review BG-05: chạm nhiều lần vào cùng một quả đúng chỉ tính một lần bắt', async ({ page }) => {
  await openBubbles(page, 'Màu sắc');
  const key = await want(page);
  const b = bubble(page, key);
  await expect(b).toBeVisible({ timeout: 5000 });
  const id = await b.getAttribute('data-id');
  const same = page.locator(`.bb-bubble[data-id="${id}"]`);
  await same.dispatchEvent('pointerdown');
  await same.dispatchEvent('pointerdown').catch(() => {});
  await same.dispatchEvent('pointerdown').catch(() => {});
  await expect(page.locator('.bb-dot.on')).toHaveCount(1);
  await page.waitForTimeout(300);
  await expect(page.locator('.bb-dot.on')).toHaveCount(1);
});

test('review BG-11: giọng đọc lỗi vẫn chơi được (thẻ cần bắt + phụ đề), bắt đúng vẫn tính', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(() => { window.kidEnglish.speaker.speak = () => Promise.reject(new Error('không có giọng')); });
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Bắt bong bóng' }).click();
  await page.getByRole('button', { name: 'Màu sắc', exact: true }).click();
  await expect(page.locator('.bb-want')).toBeVisible({ timeout: 15000 });
  const key = await want(page);
  await expect(bubble(page, key)).toBeVisible({ timeout: 5000 });
  await bubble(page, key).dispatchEvent('pointerdown');
  await expect(page.locator('.bb-dot.on')).toHaveCount(1);
});

test('review BG-10: app ra nền rồi quay lại → chơi tiếp đúng ván (giữ số đã bắt, cùng thứ cần bắt)', async ({ page }) => {
  await openBubbles(page, 'Màu sắc');
  const key = await want(page);
  await expect(bubble(page, key)).toBeVisible({ timeout: 5000 });
  await bubble(page, key).dispatchEvent('pointerdown');
  await expect(page.locator('.bb-dot.on')).toHaveCount(1);
  const next = await want(page);
  const setVisible = (s) => page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, s);
  await setVisible('hidden');
  await setVisible('visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(page.locator('.bb-play')).toHaveAttribute('data-state', 'playing', { timeout: 15000 });
  await expect(page.locator('.bb-dot.on')).toHaveCount(1);
  expect(await want(page)).toBe(next);
});

test('từ vựng: bong bóng dùng ảnh bố mẹ đã thêm ở bài học (chưa có thì emoji)', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(async () => {
    const db = await import('/js/db.js');
    const png = await new Promise((r) => { const c = document.createElement('canvas'); c.width = 60; c.height = 60; c.getContext('2d').fillRect(10, 10, 40, 40); c.toBlob(r, 'image/png'); });
    for (const l of await window.kidEnglish.db.getAll('lessons')) {
      if (!Array.isArray(l.words)) continue;
      for (const w of l.words) await db.setWordImage(window.kidEnglish.db, { lessonId: l.id, word: w.en, blob: png, mimeType: 'image/png', width: 60, height: 60 });
    }
  });
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Bắt bong bóng' }).click();
  await page.getByRole('button', { name: 'Từ vựng', exact: true }).click();
  await expect(page.locator('.bb-want img.bb-img')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.bb-bubble img.bb-img').first()).toBeVisible({ timeout: 5000 });
});
