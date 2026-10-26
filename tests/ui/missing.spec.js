// Tìm đồ còn thiếu (SPEC-missing.md): tranh đầy đủ → bóng trắng → kéo đồ đúng vào bóng; sai 2 cấp; đồ nhiễu; chạm đồ / bóng;
// gợi ý; 5 tranh → sticker; ảnh Dán tranh + cảnh riêng; ra nền giữ đồ đã đặt; Góc bố mẹ.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const waitState = (page, s) => expect(page.locator('.ms-play')).toHaveAttribute('data-state', s, { timeout: 15000 });
const holes = (page) => page.locator('.ms-item.ms-ghost').evaluateAll((els) => els.map((e) => e.dataset.hole));
const piece = (page, key) => page.locator(`.ms-piece[data-key="${key}"]`);

/** Kéo đồ trong khay tới tâm một phần tử (bóng) hoặc một điểm bất kỳ. */
async function drag(page, key, to) {
  const a = await piece(page, key).boundingBox();
  const b = typeof to === 'string' ? await page.locator(to).boundingBox() : to;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + (b.width ?? 0) / 2, b.y + (b.height ?? 0) / 2, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(60);
}
const holeSel = (key) => `.ms-item[data-hole="${key}"]`;

async function openMissing(page, settings) {
  await fakeSpeech(page);
  await startApp(page);
  if (settings) await page.evaluate((s) => window.kidEnglish.setSetting('missingGame', s), settings);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Tìm đồ còn thiếu' }).click();
  await expect(page.locator('.ms-item.ms-ghost').first()).toBeVisible();
  await waitState(page, 'playing');
}
async function solve(page) {
  for (const key of await holes(page)) {
    await expect(piece(page, key)).toBeVisible();
    await drag(page, key, holeSel(key));
  }
  await waitState(page, 'done');
}

test('mức 1: một bóng trắng, khay một đồ; "Oh no!… What\'s missing?"; kéo vào bóng → "Yes! The …!"; đủ → "Everything is back!" → tranh 2', async ({ page }) => {
  await openMissing(page);
  expect(await holes(page)).toHaveLength(1);
  await expect(page.locator('.ms-piece')).toHaveCount(1);
  await expect.poll(() => spoken(page)).toContain('Oh no! Something is missing!');
  await expect.poll(() => spoken(page)).toContain("What's missing?");
  const [key] = await holes(page);
  // Bóng là chính hình đồ vật (cùng emoji / ảnh), phủ trắng.
  // Tranh nền tuyết (data-ghost="dark") dùng bóng xám đậm thay vì trắng.
  const dark = (await page.locator('.ms-scene').getAttribute('data-ghost')) === 'dark';
  const filter = await page.locator(`${holeSel(key)} > *`).evaluate((el) => getComputedStyle(el).filter);
  expect(filter).toContain('brightness(0)');
  if (!dark) expect(filter).toContain('invert(1)');
  const name = await piece(page, key).getAttribute('aria-label');
  await drag(page, key, holeSel(key));
  await waitState(page, 'done');
  await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(new RegExp(`Everything is back! Great job!$`)));
  expect(await spoken(page)).toContain(`Yes! The ${name}!`);
  await expect(page.locator('.ms-item.ms-ghost')).toHaveCount(0);
  await expect(page.locator('.ms-count')).toHaveText('1/5');
  await page.getByRole('button', { name: '➡️ Next' }).click();
  await expect(page.locator('.ms-count')).toHaveText('2/5');
});

test('mức 2: kéo đồ vào bóng của đồ khác → "not there", lần 2 bóng đúng sáng; đồ lạ → "doesn\'t belong here"; thả ra ngoài không nói gì', async ({ page }) => {
  await openMissing(page, { lock: 2 });
  const [a, b] = await holes(page);
  expect(b).toBeTruthy();
  await expect(page.locator('.ms-piece')).toHaveCount(3);
  await drag(page, a, holeSel(b));
  await expect.poll(() => spoken(page)).toContain('Hmm, not there! Try again!');
  await expect(piece(page, a)).toBeVisible();
  await drag(page, a, holeSel(b));
  await expect(page.locator(`${holeSel(a)}.glow`)).toHaveCount(1);
  const dis = await page.locator('.ms-piece[data-distractor="1"]').getAttribute('data-key');
  await drag(page, dis, holeSel(a));
  await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(/(It doesn't|They don't) belong here!$/));
  const before = (await spoken(page)).length;
  await drag(page, a, { x: 5, y: 5 });
  await page.waitForTimeout(150);
  expect((await spoken(page)).slice(before).some((t) => /not there|belong/.test(t))).toBe(false);
  // Chạm đồ trong khay → Bông nói tên; chạm bóng → "What goes here?".
  await piece(page, a).click();
  await expect.poll(async () => (await spoken(page)).at(-1)).toMatch(/^(A|An) [a-z ]+!$|^[A-Z][a-z ]+!$/);
  await page.locator(holeSel(b)).click();
  await expect.poll(() => spoken(page)).toContain('What goes here?');
  await drag(page, a, holeSel(a));
  await drag(page, b, holeSel(b));
  await waitState(page, 'done');
});

test('Next luôn hiện: đang chơi bấm Next thì bỏ qua tranh (không khen, không ghi tiến độ); xong tranh thì Next nhún', async ({ page }) => {
  await openMissing(page);
  const next = page.getByRole('button', { name: '➡️ Next' });
  await expect(next).toBeVisible();
  await expect(next).not.toHaveClass(/ready/);
  const first = await page.locator('.ms-scene').getAttribute('data-picture');
  await next.click();
  await expect(page.locator('.ms-count')).toHaveText('2/5');
  await expect(page.locator('.ms-scene')).not.toHaveAttribute('data-picture', first);
  expect((await spoken(page)).some((t) => /Everything is back/.test(t))).toBe(false);
  expect(await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).length)).toBe(0);
  // Bỏ qua ngay lúc đang xem tranh đầy đủ cũng được.
  await next.click();
  await expect(page.locator('.ms-count')).toHaveText('3/5');
  await waitState(page, 'playing');
  await expect(page.locator('.ms-item.ms-ghost').first()).toBeVisible();
  await solve(page);
  await expect(next).toHaveClass(/ready/);
});

test('chạm đồ đang có trong tranh (không thiếu) → đồ nhún, Bông đọc tên; không ghi tiến độ', async ({ page }) => {
  await openMissing(page);
  await expect.poll(() => spoken(page)).toContain("What's missing?");
  const still = page.locator('.ms-item:not(.ms-ghost)').first();
  const id = await still.getAttribute('data-item');
  await still.click();
  await expect(still).toHaveClass(/bounce/);
  const name = await page.evaluate(async ({ id, pic }) => {
    const m = await import('/js/missing.js');
    return m.itemOf(m.sceneOf(m.PICTURE_BY_ID.get(pic).scene), id).name;
  }, { id, pic: await page.locator('.ms-scene').getAttribute('data-picture') });
  await expect.poll(async () => (await spoken(page)).at(-1).toLowerCase()).toContain(name.toLowerCase());
  expect(await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).length)).toBe(0);
});

test('gợi ý: 10 giây không làm gì thì bóng còn trống lấp lánh', async ({ page }) => {
  await openMissing(page);
  const [key] = await holes(page);
  await expect(page.locator(`${holeSel(key)}.glow`)).toHaveCount(1, { timeout: 4000 });
});

test('5 tranh → Hoan hô + sticker; đếm lượt để lên mức; ghi "đã gặp" từ', async ({ page }) => {
  await openMissing(page);
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('.ms-count')).toHaveText(`${i + 1}/5`);
    await expect(page.locator('.ms-item.ms-ghost').first()).toBeVisible();
    await solve(page);
    await page.getByRole('button', { name: '➡️ Next' }).click();
  }
  await expect(page.locator('.prize-sticker')).toBeVisible();
  expect(await page.evaluate(() => window.kidEnglish.settings.missingGame)).toEqual({ level: 1, rounds: 1, lock: null });
  expect(await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).length)).toBeGreaterThan(0);
});

test('mức 3: vẫn xem tranh đầy đủ trước (khay trống, chưa có bóng), rồi 3 bóng mờ hơn; 2 đồ lạ', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(() => window.kidEnglish.setSetting('missingGame', { lock: 3 }));
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Tìm đồ còn thiếu' }).click();
  await expect(page.locator('.ms-item').first()).toBeVisible();
  expect(await page.locator('.ms-item.ms-ghost').count()).toBe(0);
  expect(await page.locator('.ms-piece').count()).toBe(0);
  await waitState(page, 'playing');
  await expect(page.locator('.ms-item.ms-ghost').first()).toBeVisible();
  expect(await holes(page)).toHaveLength(3);
  await expect(page.locator('.ms-item.ms-ghost.faint')).toHaveCount(3);
  await expect(page.locator('.ms-piece[data-distractor="1"]')).toHaveCount(2);
});

test('app ra nền rồi quay lại: giữ tranh và đồ đã đặt', async ({ page }) => {
  await openMissing(page, { lock: 2 });
  const picture = await page.locator('.ms-scene').getAttribute('data-picture');
  const [a, b] = await holes(page);
  await drag(page, a, holeSel(a));
  await expect(page.locator('.ms-item.ms-ghost')).toHaveCount(1);
  const setVisible = (s) => page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, s);
  await setVisible('hidden');
  await setVisible('visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(page.locator('.ms-scene')).toHaveAttribute('data-picture', picture);
  expect(await holes(page)).toEqual([b]);
  await expect(piece(page, a)).toHaveCount(0);
});

test('ảnh: cảnh Dán tranh dùng sticker Dán tranh, cảnh riêng dùng ảnh "missing:items"; không có thì emoji', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  const r = await page.evaluate(async () => {
    const db = await import('/js/db.js');
    const app = window.kidEnglish;
    const png = await new Promise((res) => { const c = document.createElement('canvas'); c.width = 60; c.height = 60; c.getContext('2d').fillRect(10, 10, 40, 40); c.toBlob(res, 'image/png'); });
    await db.setWordImage(app.db, { lessonId: 'scene:stickers', word: 'spoon', blob: png, mimeType: 'image/png', width: 60, height: 60 });
    await db.setWordImage(app.db, { lessonId: 'missing:items', word: 'chopsticks', blob: png, mimeType: 'image/png', width: 60, height: 60 });
    const m = await import('/js/screens/missing.js');
    const images = await m.loadMissingImages(app);
    return {
      sticker: m.itemFace({ id: 'spoon', name: 'spoon', emoji: '🥄' }, images, false).tagName,
      own: m.itemFace({ id: 'chopsticks', name: 'chopsticks', emoji: '🥢' }, images, true).tagName,
      emoji: m.itemFace({ id: 'bowl', name: 'bowl', emoji: '🍚' }, images, true).tagName,
      ownNotSticker: m.itemFace({ id: 'spoon', name: 'spoon', emoji: '🥄' }, images, true).tagName,
    };
  });
  expect(r).toEqual({ sticker: 'IMG', own: 'IMG', emoji: 'SPAN', ownNotSticker: 'SPAN' });
  // Bóng trắng: ảnh có nền trong suốt giữ ảnh; ảnh nền đục (phủ trắng sẽ thành ô chữ nhật) → bóng dùng emoji.
  const ghost = await page.evaluate(async () => {
    const db = await import('/js/db.js');
    const app = window.kidEnglish;
    const opaque = await new Promise((res) => { const c = document.createElement('canvas'); c.width = 60; c.height = 60; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 60, 60); x.fillStyle = '#000'; x.fillRect(20, 20, 20, 20); c.toBlob(res, 'image/png'); });
    await db.setWordImage(app.db, { lessonId: 'scene:stickers', word: 'cup', blob: opaque, mimeType: 'image/png', width: 60, height: 60 });
    const m = await import('/js/screens/missing.js');
    const images = await m.loadMissingImages(app);
    const a = m.itemFace({ id: 'spoon', name: 'spoon', emoji: '🥄' }, images, false, { ghost: true });
    const b = m.itemFace({ id: 'cup', name: 'cup', emoji: '🥛' }, images, false, { ghost: true });
    const wrap = document.createElement('div');
    wrap.append(a, b);
    document.body.append(wrap);
    await new Promise((r) => setTimeout(r, 300));
    const out = [...wrap.children].map((el) => el.tagName);
    wrap.remove();
    return out;
  });
  expect(ghost).toEqual(['IMG', 'SPAN']);
});

test('Góc bố mẹ → Ảnh Tìm đồ còn thiếu: 4 cảnh riêng; dùng lại sticker "spoon" của Dán tranh; ảnh nền "Chưa khớp" không lưu, "Khớp" thì lưu', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(async () => {
    const db = await import('/js/db.js');
    const png = await new Promise((res) => { const c = document.createElement('canvas'); c.width = 60; c.height = 60; c.getContext('2d').fillRect(10, 10, 40, 40); c.toBlob(res, 'image/png'); });
    await db.setWordImage(window.kidEnglish.db, { lessonId: 'scene:stickers', word: 'spoon', blob: png, mimeType: 'image/png', width: 60, height: 60 });
  });
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Tìm đồ còn thiếu/ }).click();
  await expect(page.locator('.ms-admin-scene')).toHaveCount(4);
  await page.getByRole('button', { name: /^Dùng lại ảnh đã có \(\d+ món\)$/ }).click();
  await expect(page.locator('.ms-admin-scene[data-scene="meal"]')).toBeVisible();
  await expect.poll(() => page.evaluate(async () => Boolean(await (await import('/js/db.js')).getWordImage(window.kidEnglish.db, 'missing:items', 'spoon')))).toBe(true);
  // Ảnh đồ vật nằm gọn trong ô 64 px (trước đây ảnh hiện to bằng kích thước gốc, tràn ra cả trang).
  const thumb = page.locator('.ms-admin-scene[data-scene="meal"]').locator('xpath=ancestor::section[1]').locator('.fd-admin-face img').first();
  await expect(thumb).toBeVisible();
  const box = await thumb.boundingBox();
  expect(box.width).toBeLessThanOrEqual(64);
  expect(box.height).toBeLessThanOrEqual(64);

  const bg = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 800;
    c.height = 600;
    c.getContext('2d').fillStyle = '#ffd8a8';
    c.getContext('2d').fillRect(0, 0, 800, 600);
    return Array.from(new Uint8Array(await (await new Promise((r) => c.toBlob(r, 'image/png'))).arrayBuffer()));
  });
  const choose = async () => {
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Chọn ảnh nền' }).first().click();
    await (await chooser).setFiles({ name: 'nen.png', mimeType: 'image/png', buffer: Buffer.from(bg) });
  };
  const saved = () => page.evaluate(async () => Boolean(await (await import('/js/db.js')).getWordImage(window.kidEnglish.db, 'missing:bg', 'meal')));
  await choose();
  await page.getByRole('button', { name: '✖ Chưa khớp' }).click();
  expect(await saved()).toBe(false);
  await choose();
  await page.getByRole('button', { name: '✔ Khớp — lưu ảnh này' }).click();
  await expect.poll(saved).toBe(true);
});

test('giảm chuyển động: bóng không nhấp nháy', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openMissing(page);
  const [key] = await holes(page);
  expect(await page.locator(`${holeSel(key)} > *`).evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});
