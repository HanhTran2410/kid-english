// Test giao diện mục "Số đếm" (SPEC-numbers.md).
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, playThrough, openParent } from './helpers.js';

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
  await expect(page.locator('.lesson-card')).toHaveCount(4);
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
  await page.locator('.home-btn-small').click();
  // So với chỗ dừng app ĐÃ LƯU (chế độ chạy nhanh đổi bước trong vài ms, chữ số trên màn hình lúc bấm 🏠 có thể là bước trước).
  const saved = await page.evaluate(async () => {
    const lesson = (await window.kidEnglish.db.getAll('lessons')).find((l) => l.title === 'Count 1–10');
    return lesson.resume ? String(lesson.numbers[lesson.resume.index].n) : null;
  });
  expect(Number(saved)).toBeGreaterThanOrEqual(2);
  await page.getByRole('button', { name: 'Số đếm' }).click();
  await page.getByRole('button', { name: 'Count 1–10', exact: true }).click();
  // Ghi lại chữ số ĐẦU TIÊN hiện ra (chế độ chạy nhanh có thể sang số sau trước khi kịp đọc màn hình).
  await page.evaluate(() => {
    window.__firstNumeral = null;
    new MutationObserver((_, obs) => {
      const n = document.querySelector('.number-card .numeral');
      if (n) {
        window.__firstNumeral = n.textContent;
        obs.disconnect();
      }
    }).observe(document.body, { childList: true, subtree: true });
  });
  await page.getByRole('button', { name: 'Học tiếp' }).click();
  await expect.poll(() => page.evaluate(() => window.__firstNumeral)).toBe(saved);
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

test('bài Đếm 11–20: khung 10 + đếm tiếp "Ten! Eleven…", bé chỉ chạm đếm phần thêm', async ({ page }) => {
  await startApp(page);
  await page.getByRole('button', { name: 'Số đếm' }).click();
  // Bài số xếp theo thứ tự bài: 1–10 trước 11–20.
  await expect(page.locator('.lesson-card').first()).toHaveAttribute('aria-label', 'Count 1–10');
  await autoTapCount(page);
  await page.getByRole('button', { name: 'Count 11–20', exact: true }).click();
  await expect(page.locator('.number-card .numeral')).toHaveText('11');
  await expect(page.locator('.number-card .ten-frame .count-item')).toHaveCount(10);
  await expect(page.locator('.number-card .count-item:not(.in-ten)')).toHaveCount(1);
  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();

  const spoken = await page.evaluate(() => window.__spoken);
  for (const line of ['Ten!', 'Eleven', 'Eleven bees!', 'Ten! Your turn! Tap and count!', 'Twelve eggs! Great counting!',
    'Twenty leaves!']) {
    expect(spoken).toContain(line);
  }
  expect(spoken.some((t) => /^Where are (thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty) \w+/.test(t))).toBe(true);
  // Không đếm lại 1–10 ở bài 11–20.
  expect(spoken).not.toContain('One');
  expect((await page.evaluate(async () => window.kidEnglish.db.get('progress', 'number:12'))).mastery).toBeGreaterThanOrEqual(1);
});

test('ảnh đồ vật: bố mẹ thêm ảnh lưới cho bài số → khi học hiện ảnh thay emoji', async ({ page }) => {
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Quản lý bài' }).click();
  await page.getByRole('button', { name: /Count 1–10/ }).click();
  const heading = page.getByRole('heading', { name: /Ảnh đồ vật/ });
  await expect(heading).toBeVisible();
  const [, cols, rows] = (await heading.textContent()).match(/(\d)×(\d)/).map(Number);

  // Ảnh lưới giống AI vẽ: nền trắng, đường kẻ xám nhạt, mỗi ô một hình tròn màu.
  const png = await page.evaluate(async ([cols, rows]) => {
    const size = 200;
    const c = document.createElement('canvas');
    c.width = cols * size; c.height = rows * size;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = '#e4e4e4';
    g.lineWidth = 5;
    for (let i = 1; i < cols; i++) { g.beginPath(); g.moveTo(i * size, 0); g.lineTo(i * size, c.height); g.stroke(); }
    for (let i = 1; i < rows; i++) { g.beginPath(); g.moveTo(0, i * size); g.lineTo(c.width, i * size); g.stroke(); }
    for (let i = 0; i < 10; i++) {
      g.fillStyle = `hsl(${i * 36}, 80%, 50%)`;
      g.beginPath();
      g.arc((i % cols) * size + size / 2, Math.floor(i / cols) * size + size / 2, 60, 0, Math.PI * 2);
      g.fill();
    }
    return c.toDataURL('image/png').split(',')[1];
  }, [cols, rows]);
  await page.locator('section', { hasText: 'Ảnh đồ vật' }).locator('input[type=file]')
    .setInputFiles({ name: 'items.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await expect(page.getByLabel('Từ cho ô 1', { exact: true })).toHaveValue('balloon');
  await page.getByRole('button', { name: 'Lưu các ảnh này' }).click();
  // Trang bài hiện ảnh nhỏ thay emoji.
  await expect(page.locator('img.p-thumb').first()).toBeVisible();

  await page.goto('/?fast&nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.getByRole('button', { name: 'Số đếm' }).click();
  await page.getByRole('button', { name: 'Count 1–10', exact: true }).click();
  await expect(page.locator('.number-card .count-img')).toHaveCount(1);
  await expect(page.locator('.number-card .count-img')).toHaveJSProperty('complete', true);

  // Trò Chọn số dùng ảnh đồ vật của bài đếm (câu thứ 2 là kiểu "How many…?" có đồ vật).
  await page.locator('.home-btn-small').click();
  await page.getByRole('button', { name: 'Số đếm' }).click();
  await page.getByRole('button', { name: 'Number game', exact: true }).click();
  await expect(page.locator('.numeral-choice')).toHaveCount(3);
  await page.locator('.next-btn').click();
  await expect(page.locator('.game-card .count-img').first()).toBeVisible();
});

test('trò Chọn số 11–20: thẻ riêng, chỉ hỏi số 11–20, có Hoan hô', async ({ page }) => {
  await startApp(page);
  await page.getByRole('button', { name: 'Số đếm' }).click();
  await expect(page.locator('.lesson-card').last()).toHaveAttribute('aria-label', 'Number game 11–20');
  await page.getByRole('button', { name: 'Number game 11–20', exact: true }).click();
  await expect(page.locator('.numeral-choice')).toHaveCount(3);
  for (const t of await page.locator('.numeral-choice').allTextContents()) expect(Number(t)).toBeGreaterThanOrEqual(11);
  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();
  const spoken = await page.evaluate(() => window.__spoken);
  const asked = spoken.filter((t) => /^(Find number|How many)/.test(t));
  expect(asked.length).toBeGreaterThanOrEqual(8);
  for (const q of asked) expect(q).toMatch(/eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|bees|eggs|cookies|strawberries|butterflies|shells|candies|balls|cupcakes|leaves/);
});
