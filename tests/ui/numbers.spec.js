// Test giao diện mục "Số đếm" (SPEC-numbers.md).
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, playThrough } from './helpers.js';

const progressOf = (page, key) => page.evaluate(async (k) => (await window.kidEnglish.db.get('progress', k)) ?? null, key);

/** Giả làm bé: thẻ "chạm đếm" hiện ra là chạm lần lượt từng đồ vật (có lần chạm lại cái đã đếm). */
async function autoTapCount(page) {
  await page.evaluate(() => {
    new MutationObserver(() => {
      const card = document.querySelector('.number-card.your-turn:not([data-tapped])');
      if (!card) return;
      card.dataset.tapped = '1';
      const items = [...card.querySelectorAll('.count-item')];
      items[0].click();
      items[0].click(); // chạm lại cái đã đếm: không tính
      for (const item of items.slice(1)) item.click();
    }).observe(document.body, { childList: true, subtree: true });
  });
}

test.beforeEach(async ({ page }) => {
  await fakeSpeech(page);
});

test('màn hình chính có nút Số đếm; học hết bài Đếm 1–10: Bông đếm → bé chạm đếm → chọn nhóm → Hoan hô', async ({ page }) => {
  await startApp(page);
  await page.getByRole('button', { name: 'Số đếm' }).click();
  // Danh sách bài số: bài đếm và trò chơi, không lẫn bài từ vựng / bài câu.
  await expect(page.locator('.lesson-card')).toHaveCount(2);
  await autoTapCount(page);
  await page.getByRole('button', { name: 'Count 1–10', exact: true }).click();

  await expect(page.locator('.number-card .numeral')).toHaveText('1');
  await expect(page.locator('.number-card .count-item')).toHaveCount(1);
  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();

  const spoken = await page.evaluate(() => window.__spoken);
  for (const line of ["Let's count!", 'One', 'One balloon!', 'Your turn! Tap and count!', 'Two crayons! Great counting!',
    'Where are three apples?', 'Ten teddy bears!']) {
    expect(spoken).toContain(line);
  }
  // "Let's count!" chỉ nói một lần mỗi lượt học.
  expect(spoken.filter((t) => t === "Let's count!")).toHaveLength(1);
  expect(spoken.join(' ')).not.toMatch(/wrong/i);

  // Tiến độ số lưu riêng (number:n), bé chạm đếm đủ được +1.
  const three = await progressOf(page, 'number:3');
  expect(three.mastery).toBeGreaterThanOrEqual(1);
  expect(await progressOf(page, 'three')).toBeNull();
  await page.locator('.done-btn').click();
});

test('Học tiếp bài đếm từ đúng số đang dừng', async ({ page }) => {
  await startApp(page);
  await page.getByRole('button', { name: 'Số đếm' }).click();
  await autoTapCount(page);
  await page.getByRole('button', { name: 'Count 1–10', exact: true }).click();
  await expect(page.locator('.number-card .numeral')).toHaveText('1');
  // Bỏ qua vài bước rồi về nhà khi đang ở bước "xem Bông đếm" của một số ≥ 2.
  const counting = page.locator('.stage[data-stage="number-count"] .number-card .numeral');
  let shown = '1';
  for (let i = 0; i < 10 && shown === '1'; i++) {
    await page.locator('.next-btn').click();
    shown = await counting.textContent({ timeout: 5000 }).catch(() => '1');
  }
  const atHome = await page.evaluate(async () => {
    const n = document.querySelector('.number-card .numeral')?.textContent;
    document.querySelector('.home-btn-small').click();
    return n;
  });
  expect(Number(atHome)).toBeGreaterThanOrEqual(2);
  await page.getByRole('button', { name: 'Số đếm' }).click();
  await page.getByRole('button', { name: 'Count 1–10', exact: true }).click();
  await page.getByRole('button', { name: 'Học tiếp' }).click();
  await expect(page.locator('.number-card .numeral')).toHaveText(atHome);
});

test('trò chơi Chọn số: 2 kiểu câu, chọn sai không trừ sao, có Hoan hô', async ({ page }) => {
  await startApp(page);
  await page.getByRole('button', { name: 'Số đếm' }).click();
  await page.getByRole('button', { name: 'Number game', exact: true }).click();
  await expect(page.locator('.numeral-choice')).toHaveCount(3);
  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();

  const spoken = await page.evaluate(() => window.__spoken);
  expect(spoken.some((t) => /^Find number \w+!$/.test(t))).toBe(true);
  expect(spoken.some((t) => /^How many [\w ]+\?$/.test(t))).toBe(true);
  expect(spoken.join(' ')).not.toMatch(/wrong/i);
  // Không số nào bị trừ sao (bắt đầu từ 0, chỉ tăng).
  const records = await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).filter((r) => r.word.startsWith('number:')));
  expect(records.length).toBeGreaterThan(0);
  for (const r of records) expect(r.mastery).toBeGreaterThanOrEqual(0);
});

test('màn hình chính 7 nút (có 🎲 Trò chơi) vừa iPhone dọc, không phải cuộn', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 664 });
  await startApp(page);
  const buttons = page.locator('.home-grid .home-btn');
  await expect(buttons).toHaveCount(7);
  for (let i = 0; i < 7; i++) {
    const box = await buttons.nth(i).boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(664);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  }
});
