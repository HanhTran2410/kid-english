// Bài từ vựng hấp dẫn hơn (SPEC-words-play.md): ló dần trước thẻ từ, truyện chạm được, trang The end, tiếng khi chạm.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, playThrough, openParent } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const lastSpoken = async (page) => (await spoken(page)).at(-1);

/** Ghi lại các phần tử đã từng hiện ra (ở chế độ test mọi thứ chạy rất nhanh). */
async function watch(page, selectors) {
  await page.evaluate((sels) => {
    window.__seen = {};
    new MutationObserver(() => {
      for (const s of sels) {
        const n = document.querySelectorAll(s).length;
        if (n) window.__seen[s] = Math.max(window.__seen[s] ?? 0, n);
      }
    }).observe(document.body, { childList: true, subtree: true, attributes: true });
  }, selectors);
}
const seen = (page) => page.evaluate(() => window.__seen);

async function lessonId(page, title = 'Animals') {
  return page.evaluate(async (t) => (await window.kidEnglish.db.getAll('lessons')).find((l) => l.title === t).id, title);
}

test('học hết bài: thẻ từ có màn ló dần (bong bóng 3×3, rèm, hình bóng), truyện có nhân vật + lượt Tìm, trang The end, rồi quà', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await watch(page, ['.rv-cover.bubbles .rv-bubble', '.rv-cover.curtain', '.rv-cover.silhouette', '.story-actor', '.story-end-title']);
  await page.getByRole('button', { name: 'Từ vựng' }).click();
  await page.getByRole('button', { name: 'Animals', exact: true }).click();
  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();
  const s = await seen(page);
  expect(s['.rv-cover.bubbles .rv-bubble']).toBe(9);
  expect(s['.rv-cover.curtain']).toBeGreaterThan(0);
  expect(s['.rv-cover.silhouette']).toBeGreaterThan(0);
  expect(s['.story-actor']).toBeGreaterThan(0);
  expect(s['.story-end-title']).toBe(1);
  const said = await spoken(page);
  expect(said).toContain("Ooh! What's hiding here?");
  expect(said).toContain('Tap, tap, tap!');
  expect(said.filter((t) => /^Where's the [a-z ]+\? Tap the [a-z ]+!$/.test(t)).length).toBeLessThanOrEqual(2);
  expect(said.some((t) => /^Where's the /.test(t))).toBe(true);
  expect(said).toContain('The end! Bye-bye, friends!');
});

test('ló dần (tốc độ thật): chạm bong bóng → nổ; ▶ chỉ mở hết hình (vẫn ở thẻ đó, chữ hiện ra), không bỏ cả thẻ', async ({ page }) => {
  await fakeSpeech(page);
  await page.goto('/?nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click({ force: true });
  await page.getByRole('button', { name: 'Từ vựng' }).click({ force: true });
  await page.getByRole('button', { name: 'Animals', exact: true }).click({ force: true });
  const bubble = page.locator('.rv-bubble').nth(4);
  await expect(bubble).toBeVisible();
  await expect(page.locator('.word-label')).toHaveClass(/rv-hidden/);
  await bubble.dispatchEvent('pointerdown');
  await expect(bubble).toHaveClass(/open/);
  await page.locator('.next-btn').click({ force: true });
  await expect(page.locator('.rv-cover')).toHaveCount(0);
  await expect(page.locator('.word-label')).toHaveText('dog');
  await expect(page.locator('.word-label')).not.toHaveClass(/rv-hidden/);
  await expect.poll(() => spoken(page)).toContain('dog!'); // thẻ từ chạy tiếp như cũ
});

test('tắt "ló dần" trong Cài đặt: thẻ từ hiện hình ngay như trước', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: /Cài đặt/ }).click();
  const box = page.getByRole('checkbox', { name: /ló dần/ });
  await expect(box).toBeChecked();
  await box.uncheck();
  await expect.poll(() => page.evaluate(() => window.kidEnglish.settings.wordReveal)).toBe(false);
  await watch(page, ['.rv-cover']);
  await page.evaluate(() => window.kidEnglish.go('lessons'));
  await page.getByRole('button', { name: 'Animals', exact: true }).click();
  await expect(page.locator('.word-label')).toHaveText('dog');
  await page.waitForTimeout(300);
  expect((await seen(page))['.rv-cover']).toBeUndefined();
});

test('truyện chạm được (tốc độ thật): lượt Tìm — chạm nhân vật khác thì nó kêu, chạm đúng thì khen; chạm chữ thì Bông đọc chữ đó', async ({ page }) => {
  await fakeSpeech(page);
  await page.goto('/?nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click({ force: true });
  await page.getByRole('button', { name: 'Từ vựng' }).waitFor();
  const id = await lessonId(page);
  await page.evaluate(async (lid) => {
    const db = window.kidEnglish.db;
    const l = await db.get('lessons', lid);
    l.resume = { stage: 'story', index: 0, savedAt: Date.now() };
    await db.put('lessons', l);
    window.kidEnglish.go('lesson', { lessonId: lid, start: 'resume' });
  }, id);
  // "On the farm, the cow says moo!" → nhân vật cow; có repeat (Moo moo!) rồi lượt Tìm.
  await expect(page.locator('.story-actor[data-word="cow"]')).toBeVisible();
  await expect.poll(() => lastSpoken(page), { timeout: 20000 }).toBe("Where's the cow? Tap the cow!");
  const other = page.locator('.story-actor.extra');
  await expect(other).toHaveCount(1);
  const otherWord = await other.getAttribute('data-word');
  await other.dispatchEvent('pointerdown');
  await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(new RegExp(`That's the ${otherWord}!$`)));
  // Chạm chữ "farm," (trong lúc chờ lượt Tìm) → Bông đọc "farm" (không dấu câu).
  await page.locator('.sw', { hasText: 'farm,' }).dispatchEvent('pointerdown');
  await expect.poll(() => spoken(page)).toContain('farm');
  await page.locator('.story-actor[data-word="cow"]').dispatchEvent('pointerdown');
  await expect.poll(() => spoken(page)).toContain('Moo moo! Yes! The cow!');
});

test('Quản lý bài: sửa "tiếng khi chạm" của từ → lưu vào bài, nghe thử; để trống thì dùng tiếng có sẵn', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  const id = await lessonId(page);
  await openParent(page);
  await page.evaluate((lid) => window.kidEnglish.go('parent', { view: 'lesson', lessonId: lid }), id);
  const input = page.getByLabel('Tiếng khi chạm: dog');
  await expect(input).toHaveAttribute('placeholder', 'Woof woof!');
  await input.fill('Bow wow!');
  await input.press('Enter');
  await input.blur();
  await expect.poll(() => page.evaluate(async (lid) => (await window.kidEnglish.db.get('lessons', lid)).words.find((w) => w.en === 'dog').sound, id)).toBe('Bow wow!');
  await page.getByRole('button', { name: 'Nghe tiếng khi chạm dog' }).click();
  await expect.poll(() => lastSpoken(page)).toBe('Bow wow!');
  await input.fill('');
  await input.blur();
  await expect.poll(() => page.evaluate(async (lid) => (await window.kidEnglish.db.get('lessons', lid)).words.find((w) => w.en === 'dog').sound ?? null, id)).toBeNull();
});
