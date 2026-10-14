// Nút 🔊 nghe lại câu hỏi: chỉ hiện khi Bông đang chờ bé trả lời, chạm thì Bông đọc lại đúng câu hỏi.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, playThrough } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken);

test.beforeEach(async ({ page }) => {
  await fakeSpeech(page);
});

test('ôn tập: bé chạm 🔊 thì Bông đọc lại câu hỏi "Where is the …?"', async ({ page }) => {
  await startApp(page);
  await page.getByRole('button', { name: 'Từ vựng' }).click();
  await page.getByRole('button', { name: 'Animals', exact: true }).click();
  await playThrough(page);
  await page.locator('.done-btn').click();

  await page.getByRole('button', { name: 'Ôn tập' }).click();
  const replay = page.getByRole('button', { name: 'Nghe lại câu hỏi' });
  await expect(page.locator('.choice').first()).toBeVisible();
  await expect(replay).toBeVisible();
  const question = (await spoken(page)).findLast((t) => /^(Where is the|Which one is)/.test(t));
  expect(question).toBeTruthy();

  const before = (await spoken(page)).filter((t) => t === question).length;
  await replay.click();
  await expect.poll(async () => (await spoken(page)).filter((t) => t === question).length).toBe(before + 1);

  // Trả lời xong thì nút ẩn đi.
  const answer = question.replace(/^Where is the |^Which one is |\?$/g, '');
  await page.locator(`.choice[data-word="${answer}"]`).click();
  await expect(replay).toBeHidden();
});

test('bài câu: không có câu hỏi thì không có 🔊; tới lượt bé làm theo thì chạm 🔊 nghe lại "Your turn! …"', async ({ page }) => {
  // Tốc độ thật (không ?fast): bước làm theo chờ bé 15 giây như trên máy.
  await page.goto('/?nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click({ force: true });
  await page.getByRole('button', { name: 'Câu nói' }).click({ force: true });
  await page.getByRole('button', { name: 'Morning', exact: true }).click();
  const replay = page.getByRole('button', { name: 'Nghe lại câu hỏi' });
  await expect(page.locator('.stage[data-stage="watch"]')).toBeVisible();
  await expect(replay).toBeHidden();

  await expect(page.locator('.did-btn')).toBeVisible();
  await expect(replay).toBeVisible();
  await replay.click();
  await expect.poll(async () => (await spoken(page)).filter((t) => t === 'Your turn! Wake up!').length).toBe(2);
  await page.locator('.did-btn').click({ force: true });
  await expect(replay).toBeHidden();
});

test('chạm 🔊: hiện phụ đề tiếng Anh + tiếng Việt (có nghĩa của từ), chạm vào thì ẩn, tự ẩn sau ~5 giây; không chạm loa thì không có phụ đề', async ({ page }) => {
  await startApp(page);
  await page.getByRole('button', { name: 'Từ vựng' }).click();
  await page.getByRole('button', { name: 'Animals', exact: true }).click();
  await playThrough(page);
  await page.locator('.done-btn').click();
  await page.getByRole('button', { name: 'Ôn tập' }).click();
  const replay = page.getByRole('button', { name: 'Nghe lại câu hỏi' });
  await expect(replay).toBeVisible();
  const caption = page.getByRole('button', { name: 'Phụ đề câu hỏi' });
  await expect(caption).toHaveCount(0);

  const question = (await spoken(page)).findLast((t) => /^(Where is the|Which one is)/.test(t));
  const word = question.replace(/^Where is the |^Which one is |\?$/g, '');
  const vi = await page.evaluate(async (w) => {
    const lesson = (await window.kidEnglish.db.getAll('lessons')).find((l) => l.title === 'Animals');
    return lesson.words.find((x) => x.en === w).vi;
  }, word);
  await replay.click();
  await expect(caption.locator('.caption-en')).toHaveText(question);
  await expect(caption.locator('.caption-vi')).toContainText(`"${word}" (${vi})`);
  await caption.click();
  await expect(caption).toHaveCount(0);

  await replay.click();
  await expect(caption).toBeVisible();
  await page.waitForTimeout(5600);
  await expect(caption).toHaveCount(0);
});
