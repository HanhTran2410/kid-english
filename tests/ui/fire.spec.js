// 🚒 Lính cứu hỏa (SPEC-jobs.md mục 7): chạm từng ngọn lửa, Bông đếm; mức 2 hỏi số + ca cây; mức 3 lửa theo chỗ.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const saidSince = async (page, n, re) => (await spoken(page)).slice(n).some((t) => re.test(t));
const play = (page) => page.locator('.fr-play');
const ACTIVE = /spray|count|tree/;

async function openFire(page, settings) {
  await fakeSpeech(page);
  await startApp(page);
  if (settings) await page.evaluate((s) => window.kidEnglish.setSetting('fireGame', s), settings);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Lính cứu hỏa' }).click();
  await expect(play(page)).toHaveAttribute('data-state', ACTIVE, { timeout: 15000 });
}
/** Làm xong ca đang mở: dập lửa (theo thứ tự gọi nếu có), chọn đúng số, hoặc dựng thang. */
async function doCase(page, i) {
  await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', ACTIVE, { timeout: 15000 });
  if ((await page.locator('.fr-scene').getAttribute('data-kind')) === 'tree') {
    await page.locator('.jb-tray .dr-item').click();
    return;
  }
  const n = await page.locator('.fr-fire').count();
  for (let k = 0; k < n; k++) {
    const want = await page.locator('.fr-scene').getAttribute('data-target');
    await page.locator(want ? `.fr-fire[data-id="${want}"]` : '.fr-fire:not(.out)').first().click();
    // Ngọn cuối: ca có thể đã sang ca sau ngay (chế độ chạy nhanh) — không đếm trên cảnh cũ.
    if (k < n - 1) await expect(page.locator('.fr-fire.out')).toHaveCount(k + 1, { timeout: 15000 });
  }
  const level = (await page.evaluate(() => window.kidEnglish.settings.fireGame))?.level ?? 1;
  if (level === 2) {
    await expect(play(page)).toHaveAttribute('data-state', 'count', { timeout: 15000 });
    await page.locator(`.fr-number[data-n="${n}"]`).click();
  }
}

test('mức 1: chạm từng ngọn lửa → Bông đếm; JOBS-07 — hết lửa câu đúng số ít / nhiều; chạm đúp một ngọn chỉ đếm một lần; bạn thú cảm ơn → ca 2', async ({ page }) => {
  await openFire(page);
  expect(await spoken(page)).toContain("A little fire! Let's put it out!");
  const n = await page.locator('.fr-fire').count();
  expect(n >= 1 && n <= 3).toBe(true);
  const before = (await spoken(page)).length;
  await page.locator('.fr-fire').first().dblclick();
  await expect.poll(() => saidSince(page, before, /^One!$/)).toBe(true);
  // Ca chỉ có 1 ngọn: chạm xong là sang ca sau ngay (chế độ chạy nhanh) — không kiểm ngọn đã tắt trên cảnh cũ.
  if (n > 1) await expect(page.locator('.fr-fire.out')).toHaveCount(1);
  for (let k = 1; k < n; k++) {
    await page.locator('.fr-fire:not(.out)').first().click();
    await expect(page.locator('.fr-fire.out')).toHaveCount(k + 1, { timeout: 15000 });
  }
  await expect.poll(() => saidSince(page, before, new RegExp(`^${['One fire', 'Two fires', 'Three fires'][n - 1]}! All gone!$`)), { timeout: 15000 }).toBe(true);
  expect(await saidSince(page, before, new RegExp(`^${['Two', 'Three', 'Four'][n - 1]}!$`))).toBe(false);
  await expect.poll(() => saidSince(page, before, /^Thank you, firefighter!$/), { timeout: 15000 }).toBe(true);
  await expect(page.locator('.jb-count')).toHaveText('2/3', { timeout: 15000 });
});

test('3 ca → Hoan hô + sticker; đếm lượt', async ({ page }) => {
  await openFire(page);
  for (let i = 0; i < 3; i++) await doCase(page, i);
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.done-btn')).toBeInViewport({ ratio: 1, timeout: 15000 });
  expect((await page.evaluate(() => window.kidEnglish.settings.fireGame)).rounds).toBe(1);
});

test('mức 2: hết lửa hỏi "How many fires?" — 3 thẻ số, chọn nhầm → đếm lại, chọn đúng → "Yes! N fires!"; có một ca cứu bạn trên cây bằng thang', async ({ page }) => {
  await openFire(page, { level: 2, rounds: 0, lock: 2, seen: {} });
  let sawTree = false;
  let checkedWrong = false;
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
    await expect(play(page)).toHaveAttribute('data-state', ACTIVE, { timeout: 15000 });
    if ((await page.locator('.fr-scene').getAttribute('data-kind')) === 'tree') {
      sawTree = true;
      const n = (await spoken(page)).length;
      await page.locator('.jb-tray .dr-item').click();
      await expect.poll(() => saidSince(page, n, /^Thank you! I am down!$/), { timeout: 15000 }).toBe(true);
      continue;
    }
    const n = await page.locator('.fr-fire').count();
    for (let k = 0; k < n; k++) {
      await page.locator('.fr-fire:not(.out)').first().click();
      await expect(page.locator('.fr-fire.out')).toHaveCount(k + 1, { timeout: 15000 });
    }
    await expect(play(page)).toHaveAttribute('data-state', 'count', { timeout: 15000 });
    await expect(page.locator('.fr-number')).toHaveCount(3);
    if (!checkedWrong) {
      checkedWrong = true;
      const before = (await spoken(page)).length;
      await page.locator(`.fr-number:not([data-n="${n}"])`).first().click();
      await expect.poll(() => saidSince(page, before, /^That's \w+\. Let's count again!$/)).toBe(true);
    }
    const before = (await spoken(page)).length;
    await page.locator(`.fr-number[data-n="${n}"]`).click();
    await expect.poll(() => saidSince(page, before, /^Yes! \w+ fires?!$/)).toBe(true);
  }
  expect(sawTree).toBe(true);
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
});

test('mức 3: Bông gọi chỗ lửa; chạm ngọn khác → "The fire … first!"; dập đúng thứ tự thì xong', async ({ page }) => {
  await openFire(page, { level: 3, rounds: 0, lock: 3, seen: {} });
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
    await expect(play(page)).toHaveAttribute('data-state', ACTIVE, { timeout: 15000 });
    if ((await page.locator('.fr-scene').getAttribute('data-kind')) === 'fire') {
      expect((await spoken(page)).some((t) => /^The fire is (on the roof|in the window|by the door)!$/.test(t))).toBe(true);
      const want = await page.locator('.fr-scene').getAttribute('data-target');
      const n = (await spoken(page)).length;
      await page.locator(`.fr-fire:not([data-id="${want}"])`).first().click();
      await expect.poll(() => saidSince(page, n, /^The fire (on the roof|in the window|by the door) first!$/)).toBe(true);
      await expect(page.locator('.fr-fire.out')).toHaveCount(0);
    }
    await doCase(page, i);
  }
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
});
