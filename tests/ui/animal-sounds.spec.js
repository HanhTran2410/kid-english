// Ai kêu thế? (SPEC-sounds.md): Bông giả tiếng kêu → "Who says moo?" → bé chạm con vật; nhầm / gợi ý; 5 câu → sticker.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const lastWho = async (page) => (await spoken(page)).filter((t) => /^Who says /.test(t)).at(-1);
/** Con vật đúng của câu đang hỏi (theo câu "Who says …?" vừa nói). */
async function answer(page) {
  const who = await lastWho(page);
  return page.evaluate(async (line) => {
    const m = await import('/js/animal-sounds.js');
    return m.ANIMALS.find((a) => line === `Who says ${a.says}?`).id;
  }, who);
}

async function openSounds(page, settings) {
  await fakeSpeech(page);
  await startApp(page);
  if (settings) await page.evaluate((s) => window.kidEnglish.setSetting('soundsGame', s), settings);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Ai kêu thế?' }).click();
  await expect(page.locator('.as-play')).toHaveAttribute('data-state', 'answer', { timeout: 15000 });
}

test('mức 1: "Listen! Who says that?" → giả tiếng kêu → "Who says …?"; 2 con để chọn; nhầm → nói tên + tiếng kêu, nhầm 2 lần con đúng sáng; đúng → khen + "Can you say …?" → câu 2', async ({ page }) => {
  await openSounds(page);
  const said = await spoken(page);
  expect(said).toContain('Listen! Who says that?');
  await expect(page.locator('.as-card')).toHaveCount(2);
  await expect(page.locator('.as-count')).toHaveText('1/5');
  const right = await answer(page);
  const wrong = await page.locator(`.as-card:not([data-animal="${right}"])`).getAttribute('data-animal');
  await page.locator(`.as-card[data-animal="${wrong}"]`).click();
  await expect.poll(async () => (await spoken(page)).some((t) => t.startsWith(`That's the ${wrong.replace(/-/g, ' ')}! The `))).toBe(true);
  await page.locator(`.as-card[data-animal="${wrong}"]`).click();
  await expect(page.locator(`.as-card[data-animal="${right}"].glow`)).toHaveCount(1);
  await page.locator(`.as-card[data-animal="${right}"]`).click();
  await expect.poll(async () => (await spoken(page)).some((t) => t.startsWith(`Yes! The ${right} says `))).toBe(true);
  await expect.poll(async () => (await spoken(page)).some((t) => /^Can you say .+\?$/.test(t))).toBe(true);
  await expect(page.locator('.as-count')).toHaveText('2/5', { timeout: 15000 });
});

test('5 câu → Hoan hô + sticker; đếm lượt; ghi "đã gặp" con vật', async ({ page }) => {
  await openSounds(page);
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('.as-count')).toHaveText(`${i + 1}/5`, { timeout: 15000 });
    await expect(page.locator('.as-play')).toHaveAttribute('data-state', 'answer', { timeout: 15000 });
    await page.locator(`.as-card[data-animal="${await answer(page)}"]`).click();
  }
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
  expect(await page.evaluate(() => window.kidEnglish.settings.soundsGame)).toEqual({ level: 1, rounds: 1, lock: null });
  expect(await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).length)).toBeGreaterThan(0);
});

test('mức 3 có 4 con để chọn; nút 🔊 nghe lại tiếng kêu; gợi ý sau 10 giây', async ({ page }) => {
  await openSounds(page, { lock: 3 });
  await expect(page.locator('.as-card')).toHaveCount(4);
  const before = (await spoken(page)).length;
  await page.getByRole('button', { name: 'Nghe tiếng kêu' }).click();
  await expect.poll(async () => (await spoken(page)).slice(before).some((t) => /^Who says /.test(t))).toBe(true);
  await expect(page.locator('.as-card.glow')).toHaveCount(1, { timeout: 5000 });
});

test('con vật dùng ảnh sticker Dán tranh bố mẹ đã thay', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(async () => {
    const db = await import('/js/db.js');
    const m = await import('/js/animal-sounds.js');
    const png = await new Promise((r) => { const c = document.createElement('canvas'); c.width = 60; c.height = 60; c.getContext('2d').fillRect(10, 10, 40, 40); c.toBlob(r, 'image/png'); });
    for (const a of m.ANIMALS.slice(0, 6)) await db.setWordImage(window.kidEnglish.db, { lessonId: 'scene:stickers', word: a.name, blob: png, mimeType: 'image/png', width: 60, height: 60 });
  });
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Ai kêu thế?' }).click();
  await expect(page.locator('.as-card img')).toHaveCount(2);
});

test('review TC14: giọng đọc lỗi thì bé vẫn chơi được (phụ đề vẫn hiện, chọn đúng vẫn sang câu sau)', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(() => { window.kidEnglish.speaker.speak = () => Promise.reject(new Error('không có giọng')); });
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Ai kêu thế?' }).click();
  await expect(page.locator('.as-play')).toHaveAttribute('data-state', 'answer', { timeout: 15000 });
  await expect(page.locator('.as-say .caption-en')).toHaveText(/^Who says /);
  const who = await page.locator('.as-say .caption-en').textContent();
  const right = await page.evaluate(async (line) => (await import('/js/animal-sounds.js')).ANIMALS.find((a) => line === `Who says ${a.says}?`).id, who);
  await page.locator(`.as-card[data-animal="${right}"]`).click();
  await expect(page.locator('.as-count')).toHaveText('2/5', { timeout: 15000 });
});

test('review TC08 + TC10: ra nền sau 1 lần nhầm → quay lại cùng câu, giữ số lần nhầm (nhầm thêm 1 lần là con đúng sáng); chạm nhầm liên tục chỉ tính một lần', async ({ page }) => {
  await openSounds(page);
  const right = await answer(page);
  const wrongCard = page.locator(`.as-card:not([data-animal="${right}"])`);
  // Chạm đúp thật nhanh: chỉ tính một lần nhầm → chưa sáng.
  await wrongCard.dblclick();
  await expect.poll(async () => (await spoken(page)).some((t) => t.startsWith("That's the "))).toBe(true);
  await expect(page.locator('.as-card.glow')).toHaveCount(0);
  const setVisible = (s) => page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, s);
  await setVisible('hidden');
  await setVisible('visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(page.locator('.as-play')).toHaveAttribute('data-state', 'answer', { timeout: 15000 });
  await expect(page.locator('.as-count')).toHaveText('1/5');
  await expect(page.locator(`.as-card[data-animal="${right}"]`)).toHaveCount(1);
  await page.waitForTimeout(450);
  await page.locator(`.as-card:not([data-animal="${right}"])`).click();
  await expect(page.locator(`.as-card[data-animal="${right}"].glow`)).toHaveCount(1);
});
