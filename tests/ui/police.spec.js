// 👮 Cảnh sát giúp bạn (SPEC-jobs.md mục 6): bạn thú mất đồ, bé chạm đúng đồ theo màu / cỡ; mức 3 bụi cây (JOBS-06), tìm bạn.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const saidSince = async (page, n, re) => (await spoken(page)).slice(n).some((t) => re.test(t));
const play = (page) => page.locator('.pl-play');
const target = async (page) => page.locator(`.pl-item[data-id="${await page.locator('.pl-park').getAttribute('data-target')}"]`);

async function openPolice(page, settings) {
  await fakeSpeech(page);
  await startApp(page);
  if (settings) await page.evaluate((s) => window.kidEnglish.setSetting('policeGame', s), settings);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await expect(page.locator('.jb-job')).toHaveCount(await page.evaluate(async () => (await import('/js/screens/jobs.js')).JOBS.length));
  await page.getByRole('button', { name: 'Cảnh sát giúp bạn' }).click();
  await expect(play(page)).toHaveAttribute('data-state', 'find', { timeout: 15000 });
}
/** Tìm đúng đồ của ca đang mở (chạm bụi che nó trước nếu có). */
async function findOne(page, i) {
  await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'find', { timeout: 15000 });
  const id = await page.locator('.pl-park').getAttribute('data-target');
  const bush = page.locator(`.pl-bush[data-cover="${id}"]`);
  if (await page.locator(`.pl-bush[data-cover="${id}"]:not(.moved)`).count()) {
    await bush.click();
    await expect(bush).toHaveClass(/moved/);
  }
  await (await target(page)).click();
}

test("mức 1: mất đồ + \"It's red!\"; chạm nhầm → \"Hmm, that … is blue. Mine is red!\", đồ đúng nhún; chạm đúng → cảm ơn → ca 2", async ({ page }) => {
  await openPolice(page);
  const said = await spoken(page);
  expect(said).toContain('Hello! Can I help you?');
  expect(said.some((t) => /^Oh no! I lost my \w+!$/.test(t))).toBe(true);
  expect(said.some((t) => /^It's (red|blue|yellow|green|pink|orange)!$/.test(t))).toBe(true);
  await expect(page.locator('.pl-item')).toHaveCount(3);
  const t = await target(page);
  const wrong = page.locator(`.pl-item:not([data-id="${await t.getAttribute('data-id')}"])`).first();
  let n = (await spoken(page)).length;
  await wrong.click();
  await expect.poll(() => saidSince(page, n, /^Hmm, that \w+ is \w+\. Mine is \w+!$/)).toBe(true);
  await expect(t).toHaveClass(/nudge/);
  n = (await spoken(page)).length;
  await t.click();
  await expect.poll(() => saidSince(page, n, /^My \w+! Thank you, officer!$/)).toBe(true);
  await expect(page.locator('.jb-count')).toHaveText('2/3', { timeout: 15000 });
});

test('3 ca → Hoan hô + sticker; đếm lượt; ghi "đã gặp" màu', async ({ page }) => {
  await openPolice(page);
  for (let i = 0; i < 3; i++) await findOne(page, i);
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.done-btn')).toBeInViewport({ ratio: 1, timeout: 15000 });
  expect((await page.evaluate(() => window.kidEnglish.settings.policeGame)).rounds).toBe(1);
  const words = await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).map((p) => p.word));
  expect(words.some((w) => ['red', 'blue', 'yellow', 'green', 'pink', 'orange'].includes(w))).toBe(true);
});

test("mức 2: 4 đồ đủ 2 màu × 2 cỡ, mô tả \"It's big and blue!\"; ra nền rồi quay lại cùng ca", async ({ page }) => {
  await openPolice(page, { level: 2, rounds: 0, lock: 2, seen: {} });
  await expect(page.locator('.pl-item')).toHaveCount(4);
  const combos = await page.locator('.pl-item').evaluateAll((els) => els.map((e) => `${e.dataset.color}:${e.dataset.size}`));
  expect(new Set(combos).size).toBe(4);
  expect((await spoken(page)).some((t) => /^It's (big|small) and \w+!$/.test(t))).toBe(true);
  const asker = await page.locator('.pl-asker').getAttribute('data-asker');
  const setVisible = (s) => page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, s);
  await setVisible('hidden');
  await setVisible('visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'find', { timeout: 15000 });
  await expect(page.locator('.pl-asker')).toHaveAttribute('data-asker', asker);
  await findOne(page, 0);
  await expect(page.locator('.jb-count')).toHaveText('2/3', { timeout: 15000 });
});

test('JOBS-06 — mức 3: chạm bụi cây thì đồ lộ ra, không tính nhầm; có ca tìm bạn bị lạc; chơi hết lượt', async ({ page }) => {
  await openPolice(page, { level: 3, rounds: 0, lock: 3, seen: {} });
  let sawFriend = false;
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
    await expect(play(page)).toHaveAttribute('data-state', 'find', { timeout: 15000 });
    if (await page.locator('.pl-item[data-friend]:not([data-friend=""])').count()) sawFriend = true;
    const id = await page.locator('.pl-park').getAttribute('data-target');
    // Chạm một bụi cây không che đồ cần tìm (nếu có): không có câu nhầm.
    const others = page.locator(`.pl-bush:not([data-cover="${id}"]):not(.moved)`);
    const cover = (await others.count()) ? await others.first().getAttribute('data-cover') : null;
    const other = page.locator(`.pl-bush[data-cover="${cover}"]`);
    const n = (await spoken(page)).length;
    if (cover) {
      await other.click();
      await expect(other).toHaveClass(/moved/);
      await page.waitForTimeout(200);
      expect(await saidSince(page, n, /^(Hmm, that|That's \w+! My friend)/)).toBe(false);
    }
    await findOne(page, i);
  }
  expect(sawFriend).toBe(true);
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
});
