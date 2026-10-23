// 📮 Bưu tá (SPEC-jobs.md mục 4): "This letter is for the red house!" → bé chạm / kéo thư vào đúng nhà; 5 thư → sticker.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const saidSince = async (page, n, re) => (await spoken(page)).slice(n).some((t) => re.test(t));
const play = (page) => page.locator('.ps-play');

async function openPost(page, settings) {
  await fakeSpeech(page);
  await startApp(page);
  if (settings) await page.evaluate((s) => window.kidEnglish.setSetting('postGame', s), settings);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  // JOBS-01: chỉ hiện các nghề trong danh sách được bật.
  await expect(page.locator('.jb-job')).toHaveCount(await page.evaluate(async () => (await import('/js/screens/jobs.js')).JOBS.length));
  await page.getByRole('button', { name: 'Bưu tá' }).click();
  await expect(play(page)).toHaveAttribute('data-state', 'deliver', { timeout: 15000 });
}

/** Nhà đúng của thư đang đưa (theo câu "This letter is for …!" vừa nói). */
async function targetHouse(page) {
  const line = (await spoken(page)).filter((t) => /^This letter is for .+!$/.test(t)).at(-1);
  const what = line.match(/^This letter is for (.+)!$/)[1];
  let m = what.match(/^the (\w+) house$/);
  if (m) return page.locator(`.ps-house[data-color="${m[1]}"]`);
  m = what.match(/^house number (\w+)$/);
  if (m) return page.locator(`.ps-house[data-number="${['zero', 'one', 'two', 'three', 'four', 'five'].indexOf(m[1])}"]`);
  const id = await page.evaluate(async (name) => (await import('/js/doctor.js')).PATIENTS.find((p) => p.name === name).id, what);
  return page.locator(`.ps-house[data-resident="${id}"]`);
}
async function deliverOne(page, i) {
  await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/5`, { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'deliver', { timeout: 15000 });
  await (await targetHouse(page)).click();
}

test('mức 1: 3 nhà khác màu; nhầm nhà → "Not for me! This is the … house.", nhà đúng nhún, vẫn thư đó; đúng → cảm ơn → thư 2', async ({ page }) => {
  await openPost(page);
  await expect(page.locator('.ps-house')).toHaveCount(3);
  expect(await spoken(page)).toContain('Take the letter to the house!');
  await expect(page.locator('.jb-count')).toHaveText('1/5');
  const target = await targetHouse(page);
  const color = await target.getAttribute('data-color');
  const wrong = page.locator(`.ps-house:not([data-color="${color}"])`).first();
  const wrongColor = await wrong.getAttribute('data-color');
  let n = (await spoken(page)).length;
  await wrong.click();
  await expect.poll(() => saidSince(page, n, new RegExp(`^Not for me! This is the ${wrongColor} house\\.$`))).toBe(true);
  await expect(page.locator(`.ps-house[data-color="${color}"].nudge`)).toHaveCount(1);
  await expect(page.locator('.jb-count')).toHaveText('1/5');
  n = (await spoken(page)).length;
  await target.click();
  await expect.poll(() => saidSince(page, n, /^A letter for me! Thank you!$/)).toBe(true);
  await expect(page.locator('.jb-count')).toHaveText('2/5', { timeout: 15000 });
});

test('5 thư → Hoan hô + sticker; đếm lượt; ghi "đã gặp" màu', async ({ page }) => {
  await openPost(page);
  const colors = [];
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/5`, { timeout: 15000 });
    await expect(play(page)).toHaveAttribute('data-state', 'deliver', { timeout: 15000 });
    const t = await targetHouse(page);
    colors.push(await t.getAttribute('data-color'));
    await t.click();
  }
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
  expect((await page.evaluate(() => window.kidEnglish.settings.postGame)).rounds).toBe(1);
  const words = await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).map((p) => p.word));
  for (const c of colors) expect(words).toContain(c);
});

test('mức 2: 4 nhà cùng màu, theo số nhà; kéo thư vào nhà đúng cũng được; ra nền rồi quay lại vẫn thư đó', async ({ page }) => {
  await openPost(page, { level: 2, rounds: 0, lock: 2, seen: {} });
  await expect(page.locator('.ps-house')).toHaveCount(4);
  expect(new Set(await page.locator('.ps-house').evaluateAll((els) => els.map((e) => e.dataset.color))).size).toBe(1);
  await deliverOne(page, 0);
  await expect(page.locator('.jb-count')).toHaveText('2/5', { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'deliver', { timeout: 15000 });
  const setVisible = (s) => page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, s);
  const before = await (await targetHouse(page)).getAttribute('data-number');
  await setVisible('hidden');
  await setVisible('visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'deliver', { timeout: 15000 });
  await expect(page.locator('.jb-count')).toHaveText('2/5');
  expect(await (await targetHouse(page)).getAttribute('data-number')).toBe(before);
  // Kéo thư từ túi vào nhà đúng.
  const letter = await page.locator('.jb-tray .dr-item').boundingBox();
  const house = await (await targetHouse(page)).boundingBox();
  const n = (await spoken(page)).length;
  await page.mouse.move(letter.x + letter.width / 2, letter.y + letter.height / 2);
  await page.mouse.down();
  await page.mouse.move(house.x + house.width / 2, house.y + house.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => saidSince(page, n, /^A letter for me! Thank you!$/)).toBe(true);
  await expect(page.locator('.jb-count')).toHaveText('3/5', { timeout: 15000 });
});

test('mức 3: nhà có bạn thú ở cửa sổ, thư theo màu / số / tên; đưa hết 5 thư được', async ({ page }) => {
  await openPost(page, { level: 3, rounds: 0, lock: 3, seen: {} });
  await expect(page.locator('.ps-house .ps-window')).toHaveCount(4);
  const lines = new Set();
  for (let i = 0; i < 5; i++) {
    await deliverOne(page, i);
    lines.add((await spoken(page)).filter((t) => /^This letter is for /.test(t)).at(-1).replace(/^This letter is for (the \w+ house|house number \w+|\w+)!$/, (_, w) => (w.startsWith('the ') ? 'color' : w.startsWith('house') ? 'number' : 'name')));
  }
  expect(lines.size).toBe(3);
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
});
