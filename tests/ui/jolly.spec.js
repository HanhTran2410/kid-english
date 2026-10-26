// Âm & ghép vần — Jolly Phonics (SPEC-jolly.md): gặp âm (âm rời phát từ FILE, không đọc bằng giọng máy), nghe âm đầu,
// tìm chữ, ghép âm; tab Sounds trong Phonics; tiến độ sound:.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const stage = (page) => page.locator('main.stage');

async function openLesson(page, title) {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Chữ cái' }).click();
  await page.getByRole('button', { name: /Sounds/ }).first().click();
  await expect(page.locator('.lesson-card[aria-label^="Letters "]')).toHaveCount(0);
  await expect(page.locator('.lesson-card')).toHaveCount(3);
  await page.getByRole('button', { name: title, exact: true }).click();
}

/** Trả lời đúng mọi câu tới khi xong bài (đáp án đọc từ màn hình). */
async function playJolly(page) {
  for (let i = 0; i < 400; i++) {
    if (await page.locator('.done-btn').isVisible()) return;
    const big = page.locator('.jolly-big');
    if (await big.isVisible().catch(() => false)) await big.click({ timeout: 500 }).catch(() => {});
    const area = page.locator('.blend-area');
    if (await area.isVisible().catch(() => false)) {
      const w = await area.getAttribute('data-word');
      const btn = page.locator(`.blend-area .find-choice[data-word="${w}"]`);
      if (await btn.isVisible().catch(() => false)) await btn.click({ timeout: 500 }).catch(() => {});
    }
    const card = page.locator('.phonics-card');
    if (await card.isVisible().catch(() => false)) {
      const s = await stage(page).getAttribute('data-last-sound');
      const pic = page.locator(`.phonics-card .find-choice[data-word^="${s}"]`);
      if (s && await pic.count()) await pic.first().click({ timeout: 500 }).catch(() => {});
      const letter = page.locator(`.phonics-card .letter-choice[data-sound="${s}"]`);
      if (s && await letter.count()) await letter.first().click({ timeout: 500 }).catch(() => {});
    }
    await page.waitForTimeout(150);
  }
  throw new Error('Không học hết được bài');
}

test('tab Sounds có 3 bài; bài "Sounds s a t": gặp âm phát file (không đọc âm rời bằng giọng máy), nghe âm đầu, tìm chữ, ghép âm → sticker; tiến độ sound:s', async ({ page }) => {
  await openLesson(page, 'Sounds s a t');
  await expect(page.locator('.jolly-big')).toHaveText('s');
  await expect(page.locator('.jolly-action')).toContainText('rắn');
  await expect(stage(page)).toHaveAttribute('data-sound-from', 'file', { timeout: 15000 });
  await expect.poll(async () => Number(await stage(page).getAttribute('data-sound-count'))).toBeGreaterThanOrEqual(2);
  expect(await spoken(page)).toContain("Listen! Here's a new sound!");
  expect(await spoken(page)).toContain('The snake says');
  await playJolly(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();
  const said = await spoken(page);
  expect(said).toContain('Which one starts with');
  expect(said).toContain('Find the letter for');
  expect(said).toContain('Sat!');
  // Không bao giờ đọc âm rời / chữ cái đứng một mình bằng giọng máy.
  expect(said.filter((t) => /^\/?[satipn]\/?[.!?]?$/i.test(t.trim()) || /\/[satipn]\//.test(t))).toEqual([]);
  const keys = await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).map((p) => p.word));
  for (const k of ['sound:s', 'sound:a', 'sound:t']) expect(keys).toContain(k);
  expect(keys.some((k) => k.startsWith('letter:'))).toBe(false);
  // Góc bố mẹ: hàng "Âm (Jolly)" ở Bé đã học (không lẫn vào từ vựng); trang bài có tiến độ từng âm.
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: /Bé đã học/ }).click();
  await expect(page.getByRole('heading', { name: /Âm \(Jolly\)/ })).toBeVisible();
  await expect(page.getByText('âm /s/', { exact: true })).toBeVisible();
  await expect(page.getByText('sound:s')).toHaveCount(0);
});

test('bài "Blend it!": nghe các âm (thẻ chữ sáng theo) → chọn hình đúng; chọn nhầm → nghe lại; xong → sticker', async ({ page }) => {
  await openLesson(page, 'Blend it! s a t i p n');
  await expect(page.locator('.blend-tile')).toHaveCount(2, { timeout: 15000 });
  // Lượt có hình đầu tiên: chọn nhầm một lần.
  await expect(page.locator('.blend-area .find-choice').first()).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.replay-btn')).toBeVisible({ timeout: 15000 });
  const w = await page.locator('.blend-area').getAttribute('data-word');
  const n0 = (await spoken(page)).length;
  // Bé chạm khi Bông đang nói thì không tính — chạm lại tới khi Bông trả lời.
  await expect(async () => {
    await page.locator(`.blend-area .find-choice:not([data-word="${w}"])`).first().click();
    expect((await spoken(page)).slice(n0).some((t) => /^That's \w+\. Listen again!$/.test(t))).toBe(true);
  }).toPass({ timeout: 15000 });
  await playJolly(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();
});

test('nút 🔊 nghe lại câu hỏi có âm rời: phát lại FILE âm, không đọc chữ bằng giọng máy', async ({ page }) => {
  await openLesson(page, 'Sounds s a t');
  await expect(page.locator('.replay-btn')).toBeVisible({ timeout: 30000 });
  await page.locator('.jolly-big').click();
  await expect(page.locator('.phonics-card .find-choice')).toHaveCount(3, { timeout: 15000 });
  await expect(page.locator('.replay-btn')).toBeVisible({ timeout: 15000 });
  const before = Number(await stage(page).getAttribute('data-sound-count'));
  await page.waitForTimeout(800);
  await page.locator('.replay-btn').click();
  await expect.poll(async () => Number(await stage(page).getAttribute('data-sound-count'))).toBeGreaterThan(before);
  expect((await spoken(page)).some((t) => /\/s\//.test(t))).toBe(false);
});
