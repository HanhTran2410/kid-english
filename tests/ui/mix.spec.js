// Ôn tập chung, Học cùng Bông chung và Trò chơi tổng hợp (SPEC-mix.md).
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, playThrough } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken);
const allProgress = (page) => page.evaluate(async () => window.kidEnglish.db.getAll('progress'));

/** Giả như bé đã học: một câu nói và vài số (không học từ vựng). */
async function seedLearned(page, keys) {
  await page.evaluate(async (list) => {
    for (const [word, emoji, mastery] of list) {
      await window.kidEnglish.db.put('progress', { word, emoji, mastery, practiceCount: 1, lastPracticedAt: Date.now(), lastVoiceDay: null });
    }
  }, keys);
}

const PHRASE_AND_NUMBERS = [
  ['phrase:wash your face', '🧼', 1],
  ['phrase:wake up', '⏰', 0],
  ['number:3', '🍎', 0],
  ['number:4', '🦆', 1],
];

test.beforeEach(async ({ page }) => {
  await fakeSpeech(page);
});

test('Trò chơi tổng hợp: 10 câu từ mọi bài kể cả chưa học, chỉ chạm chọn, không bật mic, không cộng sao cho mục đoán trúng', async ({ page }) => {
  await startApp(page);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Chọn từ' }).click();
  await expect(page.locator('.choice').first()).toBeVisible();
  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();

  const said = await spoken(page);
  const questions = said.filter((t) => /^(Where is the|Which one is|Find number|How many)/.test(t));
  expect(new Set(questions.map((q) => q.split(' ').slice(0, 2).join(' '))).size).toBeGreaterThanOrEqual(2);
  for (const t of ["What's this?", 'Now you say it!', 'Your turn!']) expect(said).not.toContain(t);
  expect(said.join(' ')).not.toMatch(/Can you say|wrong/i);

  // Bé chưa học gì: mọi mục được ghi "đã gặp" nhưng không có sao (đoán trúng không tính là thuộc).
  const records = await allProgress(page);
  expect(records.length).toBeGreaterThanOrEqual(5);
  for (const r of records) expect(r.mastery).toBe(0);

  // Đã gặp trong trò chơi → nút Ôn tập sáng.
  await page.locator('.done-btn').click();
  await expect(page.getByRole('button', { name: 'Ôn tập' })).not.toHaveClass(/disabled/);
});

test('Ôn tập chung: chỉ học câu và số (chưa học từ vựng) thì nút ⭐ vẫn sáng, có câu hỏi câu nói và số đếm', async ({ page }) => {
  await startApp(page);
  await seedLearned(page, PHRASE_AND_NUMBERS);
  await page.goto('/?fast&nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  const review = page.getByRole('button', { name: 'Ôn tập' });
  await expect(review).not.toHaveClass(/disabled/);
  await review.click();
  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();

  const said = await spoken(page);
  expect(said.some((t) => /^Which one is: (Wash your face|Wake up)\?$/.test(t))).toBe(true);
  expect(said.some((t) => /^(Find number (three|four)!|How many (apples|ducks)\?)$/.test(t))).toBe(true);
  // Chỉ hỏi mục đã học: không hỏi câu / số bé chưa học.
  expect(said.some((t) => /Which one is: (Brush your teeth|Put on your shirt)\?/.test(t))).toBe(false);
});

test('Học cùng Bông: có lượt câu nói (làm theo + nói) và lượt số đếm (How many…?)', async ({ page }) => {
  await startApp(page);
  await seedLearned(page, PHRASE_AND_NUMBERS);
  await page.goto('/?fast&nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.getByRole('button', { name: 'Nói chuyện với Bông' }).click();
  await page.getByRole('button', { name: 'Ôn từ đã học' }).click();
  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();

  const said = await spoken(page);
  expect(said.some((t) => /^Your turn! (Wash your face|Wake up)!$/.test(t))).toBe(true);
  expect(said.some((t) => /^How many (apples|ducks)\?$/.test(t))).toBe(true);
  // Từ vựng vẫn có (bài từ vựng có sẵn): câu hỏi của bài kèm "Say: …", hoặc "What's this?" / "What color…".
  expect(said.some((t) => /^(What's this\?|What color|Say: )/.test(t))).toBe(true);
});
