// Cho Bông ăn (SPEC-feed.md): xin món, kéo / chạm đưa món, nhầm + gợi ý, khóa thao tác (không tính trùng), no bụng → vòng mới,
// mức đếm, bất ngờ vui, 🧹 giữa lúc nhận món, quay lại sau khi app ra nền.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const wanted = (page) => page.locator('.fd-wish').getAttribute('data-food');
const belly = async (page) => Number(await page.locator('.fd-belly').getAttribute('data-belly'));
const ready = (page) => expect(page.locator('.fd-play')).toHaveAttribute('data-state', 'requesting');
const item = (page, id) => page.locator(`.fd-food[data-food="${id}"]`);
const trayIds = (page) => page.locator('.fd-food').evaluateAll((els) => els.map((e) => e.dataset.food));
async function wrongId(page) {
  const want = await wanted(page);
  return (await trayIds(page)).find((id) => id !== want && !['sock', 'shoe', 'teddy', 'ball'].includes(id));
}
/** Chạm một món (không kéo) — bắn sự kiện thẳng, gọi nhiều lần liên tiếp trong cùng một nhịp được. */
const tapNow = (page, id, times = 1) => page.evaluate(({ id: foodId, times: n }) => {
  const el = document.querySelector(`.fd-food[data-food="${foodId}"]`);
  for (let i = 0; i < n; i++) {
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, button: 0 }));
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, button: 0 }));
  }
}, { id, times });

async function openFeed(page, settings) {
  await fakeSpeech(page);
  await startApp(page);
  if (settings) await page.evaluate(async (s) => { for (const [k, v] of Object.entries(s)) await window.kidEnglish.setSetting(k, v); }, settings);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Cho Bông ăn' }).click();
  await ready(page);
}

test('kéo đúng món vào Bông → "Yummy! Thank you!", bụng +1, lượt mới khác món vừa xin; thả ra ngoài không tính gì', async ({ page }) => {
  await openFeed(page);
  await expect.poll(() => spoken(page)).toContain("I'm hungry!");
  const want = await wanted(page);
  await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(/^I want (a|an|some) [a-z ]+!$/));
  await expect(page.locator('.fd-food')).toHaveCount(3);

  // Thả ra ngoài: món về khay, bụng không đổi, Bông không nói câu nhầm.
  const a = await item(page, want).boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(20, 300, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  expect(await belly(page)).toBe(0);
  expect((await spoken(page)).some((t) => t.startsWith('Hmm'))).toBe(false);

  // Kéo vào Bông: miệng há khi vào vùng thả, thả → ăn.
  const b = await page.locator('.fd-bong').boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await expect(page.locator('.fd-bong')).toHaveAttribute('data-pose', 'open');
  await page.mouse.up();
  await expect.poll(() => belly(page)).toBe(1);
  await expect.poll(() => spoken(page)).toContain('Yummy! Thank you!');
  await ready(page);
  expect(await wanted(page)).not.toBe(want);
});

test('đưa nhầm: câu nhầm, bụng không đổi; lần nhầm thứ 2 trong lượt mới gợi ý; sang lượt mới hết gợi ý', async ({ page }) => {
  await openFeed(page);
  const want = await wanted(page);
  const other = await wrongId(page);
  await tapNow(page, other);
  await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(/^Hmm, (that's|those are) .+! I want .+!$/));
  await ready(page);
  expect(await belly(page)).toBe(0);
  await expect(item(page, want)).not.toHaveClass(/hint/);
  await tapNow(page, other);
  await ready(page);
  await expect(item(page, want)).toHaveClass(/hint/);
  await tapNow(page, want);
  await expect.poll(() => belly(page)).toBe(1);
  await ready(page);
  await expect(page.locator('.fd-food.hint')).toHaveCount(0);
});

test('khóa thao tác: chạm liên tiếp cùng món / trong lúc Bông đang nhận món chỉ tính một lần', async ({ page }) => {
  await openFeed(page);
  const want = await wanted(page);
  await tapNow(page, want, 4);
  await ready(page);
  await page.waitForTimeout(300);
  expect(await belly(page)).toBe(1);
  expect((await spoken(page)).filter((t) => t === 'Yummy! Thank you!').length).toBe(1);
});

test('5 đơn vị → khóa → "I\'m full! Burp! Thank you!" → ngủ → vòng mới bụng rỗng, đếm vòng để lên mức', async ({ page }) => {
  await openFeed(page);
  for (let i = 0; i < 5; i++) {
    await ready(page);
    await tapNow(page, await wanted(page));
    await expect.poll(() => belly(page)).toBe(i + 1);
  }
  await expect.poll(() => spoken(page)).toContain("I'm full! Burp! Thank you!");
  await expect.poll(() => spoken(page)).toContain("I'm hungry again!");
  await ready(page);
  expect(await belly(page)).toBe(0);
  expect(await page.evaluate(() => window.kidEnglish.settings.feed)).toEqual({ level: 1, rounds: 1, lock: null });
});

test('mức 3: "I want two cookies!" — từng cái một, bộ đếm 1/2, nhầm giữa chừng giữ số đã đếm, đủ mới cảm ơn', async ({ page }) => {
  await openFeed(page, { feed: { level: 3, rounds: 0 } });
  await expect(page.locator('.fd-food')).toHaveCount(4);
  const want = await wanted(page);
  await expect(page.locator('.fd-wish')).toHaveAttribute('data-count', '2');
  await expect(page.locator('.fd-count')).toHaveText('0/2');
  await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(/^I want two [a-z ]+s!$/));
  await tapNow(page, want);
  await expect.poll(() => spoken(page)).toContain('One!');
  await ready(page);
  await expect(page.locator('.fd-count')).toHaveText('1/2');
  expect(await belly(page)).toBe(1);
  expect(await spoken(page)).not.toContain('Yummy! Thank you!');
  await tapNow(page, await wrongId(page));
  await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(/^Hmm, that's an? [a-z ]+! I want one more [a-z ]+!$/));
  await ready(page);
  await expect(page.locator('.fd-count')).toHaveText('1/2');
  await tapNow(page, want);
  await expect.poll(() => spoken(page)).toContain('Two! Yummy! Thank you!');
  await expect.poll(() => belly(page)).toBe(2);
});

test('bất ngờ vui (mức 2): đưa đồ không ăn được → "Yuck! … I can\'t eat …", bụng không đổi; tắt trong Cài đặt thì không có', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await openFeed(page, { feed: { level: 2, rounds: 0 } });
  await expect(page.locator('.fd-food')).toHaveCount(5);
  const silly = (await trayIds(page)).find((id) => ['sock', 'shoe', 'teddy', 'ball'].includes(id));
  expect(silly).toBeTruthy();
  await tapNow(page, silly);
  await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(/^Yuck! An? [a-z]+! I can't eat an? [a-z]+!$/));
  await ready(page);
  expect(await belly(page)).toBe(0);

  await page.evaluate(() => window.kidEnglish.setSetting('feedSilly', false));
  await page.getByRole('button', { name: 'Về trò chơi' }).click();
  await page.getByRole('button', { name: 'Cho Bông ăn' }).click();
  await ready(page);
  expect((await trayIds(page)).some((id) => ['sock', 'shoe', 'teddy', 'ball'].includes(id))).toBe(false);
});

test('🧹 ngay lúc Bông đang nhận món: hẹn giờ cũ không làm bụng vòng mới tăng', async ({ page }) => {
  await openFeed(page);
  const want = await wanted(page);
  await page.evaluate((id) => {
    const el = document.querySelector(`.fd-food[data-food="${id}"]`);
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, button: 0 }));
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, button: 0 }));
    document.querySelector('[aria-label="Chơi lại"]').click();
  }, want);
  await page.waitForTimeout(500);
  await ready(page);
  expect(await belly(page)).toBe(0);
});

test('app ra nền giữa vòng rồi quay lại: chơi tiếp đúng lượt, bụng giữ nguyên', async ({ page }) => {
  await openFeed(page);
  await tapNow(page, await wanted(page));
  await expect.poll(() => belly(page)).toBe(1);
  await ready(page);
  await tapNow(page, await wanted(page));
  await expect.poll(() => belly(page)).toBe(2);
  await ready(page);
  const want = await wanted(page);
  const setVisible = (s) => page.evaluate((state) => {
    Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, s);
  await setVisible('hidden');
  await setVisible('visible');
  await page.locator('.resume-overlay .start-btn').click();
  await ready(page);
  expect(await belly(page)).toBe(2);
  expect(await wanted(page)).toBe(want);
});

test('Cài đặt: khóa mức 3 → vào game là mức đếm; tắt bất ngờ vui', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: /Cài đặt/ }).click();
  await page.getByRole('combobox', { name: /^Mức chơi Cho Bông ăn/ }).selectOption('3');
  await expect.poll(() => page.evaluate(() => window.kidEnglish.settings.feed?.lock)).toBe(3);
  const box = page.getByRole('checkbox', { name: /Bất ngờ vui/ });
  await expect(box).toBeChecked();
  await box.uncheck();
  await expect.poll(() => page.evaluate(() => window.kidEnglish.settings.feedSilly)).toBe(false);
  await page.evaluate(() => window.kidEnglish.go('feed'));
  await ready(page);
  await expect(page.locator('.fd-food')).toHaveCount(4);
});

// ---------- Ảnh thay được (F3) ----------
const png = (page, color) => page.evaluate(async (c) => {
  const cv = document.createElement('canvas');
  cv.width = 80;
  cv.height = 80;
  const g = cv.getContext('2d');
  g.fillStyle = c;
  g.fillRect(10, 10, 60, 60);
  return Array.from(new Uint8Array(await (await new Promise((r) => cv.toBlob(r, 'image/png'))).arrayBuffer()));
}, color);
const putImage = (page, lessonId, word, bytes, type = 'image/png') => page.evaluate(async ({ lessonId: l, word: w, bytes: b, type: t }) => {
  const { setWordImage } = await import('/js/db.js');
  await setWordImage(window.kidEnglish.db, { lessonId: l, word: w, blob: new Blob([new Uint8Array(b)], { type: t }), mimeType: t, width: 80, height: 80 });
}, { lessonId, word, bytes, type });

test('dùng lại ảnh bài học: sao chép sang trò chơi (xóa ảnh bài học thì trò chơi vẫn còn), hiện trong khay; ảnh feed: không lẫn vào từ vựng', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; }); // khay mức 1: apple, carrot, bread
  await fakeSpeech(page);
  await startApp(page);
  const lessonId = await page.evaluate(async () => (await window.kidEnglish.db.getAll('lessons'))[0].id);
  await putImage(page, lessonId, 'apple', await png(page, '#e53935'));
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Cho Bông ăn/ }).click();
  await page.getByRole('button', { name: /^Dùng lại ảnh đã có \(1 món\)$/ }).click();
  await expect(page.locator('.sp-admin-item[data-food="apple"] img.fd-face')).toBeVisible();
  // Xóa ảnh bài học: trò chơi vẫn còn ảnh (đã sao chép), và ảnh trò chơi không bị lấy làm ảnh từ vựng.
  const left = await page.evaluate(async (l) => {
    const db = await import('/js/db.js');
    await db.removeWordImage(window.kidEnglish.db, l, 'apple');
    return { game: Boolean(await db.getWordImage(window.kidEnglish.db, 'feed:food', 'apple')), vocab: await db.latestImageForWord(window.kidEnglish.db, 'apple') };
  }, lessonId);
  expect(left).toEqual({ game: true, vocab: null });
  await page.evaluate(() => window.kidEnglish.go('feed'));
  await ready(page);
  await expect(item(page, 'apple').locator('img.fd-face')).toBeVisible();
  await expect(item(page, 'carrot').locator('.fd-face.emoji')).toHaveText('🥕');
});

test('ảnh Bông theo tư thế: có ảnh "hungry" thì dùng ảnh; ảnh hỏng thì về Bông vẽ sẵn (không khung trống)', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await putImage(page, 'feed:bong', 'hungry', await png(page, '#ffd166'));
  await page.evaluate(() => window.kidEnglish.go('feed'));
  await ready(page);
  await expect(page.locator('.fd-bong img.fd-bong-img')).toBeVisible();
  await putImage(page, 'feed:bong', 'hungry', [1, 2, 3, 4], 'image/png');
  await page.evaluate(() => window.kidEnglish.go('feed'));
  await ready(page);
  await expect(page.locator('.fd-bong svg.bong-svg')).toBeVisible();
});

test('thêm món riêng (mango, đếm được) → có trong cài đặt, đúng a / số nhiều; chia sẻ sang máy khác đủ ảnh + món', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Cho Bông ăn/ }).click();
  await page.getByLabel(/Tên tiếng Anh/).fill('Mango');
  await page.getByLabel(/Tên tiếng Việt/).fill('quả xoài');
  await page.getByRole('button', { name: 'Thêm (dùng 🍽️)' }).click();
  await expect.poll(() => page.evaluate(() => window.kidEnglish.settings.feedCustom?.[0])).toMatchObject({ en: 'mango', vi: 'quả xoài', kind: 'food', grammar: 'count', article: 'a', plural: 'mangos' });
  const id = await page.evaluate(() => window.kidEnglish.settings.feedCustom[0].id);
  await expect(page.locator(`.sp-admin-item[data-food="${id}"]`)).toBeVisible();
  await putImage(page, 'feed:food', id, await png(page, '#ffb300'));
  await putImage(page, 'feed:food', 'banana', await png(page, '#fdd835'));

  // Gói chia sẻ có ảnh + món thêm; "máy khác" (xóa sạch rồi nhập lại) nhận đủ.
  const got = await page.evaluate(async () => {
    const app = window.kidEnglish;
    const { createBackup, readBackup } = await import('/js/backup.js');
    const { acceptFeedPayload } = await import('/js/screens/parent/feed.js');
    const db = await import('/js/db.js');
    const made = await createBackup(app.db, { lessonIds: ['feed:food', 'feed:bong', 'feed:bg'], settingsKeys: ['feedCustom'] });
    const payload = await readBackup(made.blob);
    const customId = app.settings.feedCustom[0].id;
    await db.removeWordImage(app.db, 'feed:food', customId);
    await db.removeWordImage(app.db, 'feed:food', 'banana');
    await app.setSetting('feedCustom', []);
    const res = await acceptFeedPayload(app, payload);
    return { res, foods: app.settings.feedCustom.map((f) => f.en), img: Boolean(await db.getWordImage(app.db, 'feed:food', customId)), lessons: payload.lessons.length };
  });
  expect(got).toEqual({ res: { images: 2, foods: 1 }, foods: ['mango'], img: true, lessons: 0 });
});

test('Góc bố mẹ → Ảnh Cho Bông ăn: ảnh lưới chỉ gồm món CHƯA có ảnh (prompt bỏ món đã có); đủ ảnh thì lưới "vẽ lại" thu gọn', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  const { all, label } = await page.evaluate(async () => {
    const { BUILTIN_FOODS } = await import('/js/feed.js');
    return { all: BUILTIN_FOODS.map((f) => f.id), label: Object.fromEntries(BUILTIN_FOODS.map((f) => [f.id, f.en])) };
  });
  const save = (ids) => page.evaluate(async (list) => {
    const { setWordImage } = await import('/js/db.js');
    const blob = await new Promise((r) => { const c = document.createElement('canvas'); c.width = 40; c.height = 40; c.getContext('2d').fillRect(5, 5, 30, 30); c.toBlob(r, 'image/png'); });
    for (const word of list) await setWordImage(window.kidEnglish.db, { lessonId: 'feed:food', word, blob, mimeType: 'image/png', width: 40, height: 40 });
  }, ids);
  // Còn thiếu đúng 2 món.
  const [a, b] = all.slice(-2);
  await save(all.slice(0, -2));
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Cho Bông ăn/ }).click();
  await expect(page.getByRole('heading', { name: /^Ảnh lưới — 2 món chưa có ảnh/ })).toBeVisible();
  await page.evaluate(() => {
    window.__copied = '';
    navigator.clipboard.writeText = async (t) => { window.__copied = t; };
  });
  await page.locator('section', { has: page.getByRole('heading', { name: /2 món chưa có ảnh/ }) }).getByRole('button', { name: 'Copy prompt ảnh lưới' }).click();
  await expect.poll(() => page.evaluate(() => window.__copied)).not.toBe('');
  const copied = await page.evaluate(() => window.__copied);
  expect(copied.toLowerCase()).toContain(label[a].toLowerCase());
  expect(copied.toLowerCase()).toContain(label[b].toLowerCase());
  expect(copied.toLowerCase()).not.toContain(`${label[all[0]].toLowerCase()}:`);

  // Đủ ảnh: không còn lưới "chưa có ảnh", chỉ còn mục thu gọn "vẽ lại".
  await save([a, b]);
  await page.reload();
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Cho Bông ăn/ }).click();
  await expect(page.getByText(new RegExp(`đã đủ ảnh cho cả ${all.length} món`))).toBeVisible();
  await expect(page.getByRole('heading', { name: /món chưa có ảnh/ })).toHaveCount(0);
});
