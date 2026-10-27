// Đóng vai nghề (SPEC-jobs.md): trang chọn nghề; 🛒 Bán hàng — khách gọi món, bé đưa đúng món; mức 2+ trả xu.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const saidSince = async (page, n, re) => (await spoken(page)).slice(n).some((t) => re.test(t));
const play = (page) => page.locator('.sh-play');

async function openShop(page, settings, { stock = true, smoothieAt = 2 } = {}) {
  await fakeSpeech(page);
  await page.addInitScript((n) => { window.__kidTest = { shopSmoothieAt: n }; }, smoothieAt);
  await startApp(page);
  if (settings) await page.evaluate((s) => window.kidEnglish.setSetting('shopGame', s), settings);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  // JOBS-01: chỉ hiện các nghề trong danh sách được bật.
  await expect(page.locator('.jb-job')).toHaveCount(await page.evaluate(async () => (await import('/js/screens/jobs.js')).JOBS.length));
  await expect.poll(async () => (await spoken(page)).includes('What do you want to be today?')).toBe(true);
  await page.getByRole('button', { name: 'Bán hàng' }).click();
  await expect(play(page)).toHaveAttribute('data-state', 'stock', { timeout: 15000 });
  if (stock) await toOrder(page);
}
/** SPEC-jobs2 SH1: bày hết thùng hàng (chạm món; mức 2–3 rồi chạm đúng giỏ). */
async function doStock(page) {
  const items = page.locator('.jb-tray .dr-item');
  const total = await items.count();
  for (let i = 0; i < total; i++) {
    await expect(play(page)).toHaveAttribute('data-state', 'stock', { timeout: 15000 });
    const left = await items.count();
    const item = items.first();
    const g = await item.getAttribute('data-group');
    await item.click();
    if (await page.locator('.jb-tray .dr-item.picked').count()) await page.locator(`.sh-basket[data-group="${g}"]`).click();
    // Món cuối: khay đổi sang kệ hàng của khách.
    await expect.poll(async () => (await play(page).getAttribute('data-state')) !== 'stock' || (await items.count()) === left - 1, { timeout: 15000 }).toBe(true);
  }
}
/** Bày kệ (nếu đang bày) rồi chờ khách gọi món. */
async function toOrder(page) {
  await expect(play(page)).toHaveAttribute('data-state', /stock|order/, { timeout: 15000 });
  if ((await play(page).getAttribute('data-state')) === 'stock') await doStock(page);
  await expect(play(page)).toHaveAttribute('data-state', /^(order|blend-add)$/, { timeout: 15000 });
}
/** SPEC-jobs2 SH1: bỏ đồ vào túi, đưa túi cho khách. */
async function doBag(page) {
  await expect(play(page)).toHaveAttribute('data-state', 'bag', { timeout: 15000 });
  await page.locator('.sh-bag').click();
  await expect(play(page)).toHaveAttribute('data-state', 'give', { timeout: 15000 });
  await page.locator('.sh-customer').click();
}
/** Món khách đang gọi (bong bóng luôn có đủ món, kể cả khi đang ẩn ở mức 2–3). */
const order = (page) => page.locator('.sh-wish-item').evaluateAll((els) => els.map((e) => ({
  id: e.dataset.food, count: Number((e.querySelector('.sh-wish-count')?.textContent ?? '0/1').split('/')[1]),
})));

/** Đưa đủ món cho khách đang gọi (chạm từng cái, chờ nhận xong mới chạm tiếp). */
async function serve(page) {
  for (const o of await order(page)) {
    for (let i = 0; i < o.count; i++) {
      await expect(play(page)).toHaveAttribute('data-state', 'order', { timeout: 15000 });
      await page.locator(`.jb-tray .dr-item[data-item="${o.id}"]`).click();
    }
  }
}

test('trang chọn nghề; mức 1: chào, gọi món, đưa nhầm → câu nhầm + bong bóng, món đúng nhún; đưa đúng → "Here you are!" → cảm ơn → khách 2', async ({ page }) => {
  await openShop(page);
  expect(await spoken(page)).toContain('Hello! Welcome to our shop!');
  await expect(page.locator('.jb-count')).toHaveText('1/3');
  await expect(page.locator('.jb-tray .dr-item')).toHaveCount(3);
  await expect(page.locator('.sh-wish')).toBeVisible();
  const [o] = await order(page);
  expect(await spoken(page)).toContain(await page.evaluate(async (id) => {
    const feed = await import('/js/feed.js');
    const f = feed.BUILTIN_FOODS.find((x) => x.id === id);
    return `Can I have ${feed.requestPhrase(f)}, please?`;
  }, o.id));
  const wrong = await page.locator(`.jb-tray .dr-item:not([data-item="${o.id}"])`).first().getAttribute('data-item');
  let n = (await spoken(page)).length;
  await page.locator(`.jb-tray .dr-item[data-item="${wrong}"]`).click();
  await expect.poll(() => saidSince(page, n, /^Hmm, (that's|those are) .+\. Can I have .+, please\?$/)).toBe(true);
  await expect(page.locator(`.jb-tray .dr-item[data-item="${o.id}"].hint`)).toHaveCount(1);
  n = (await spoken(page)).length;
  await page.locator(`.jb-tray .dr-item[data-item="${o.id}"]`).click();
  await expect.poll(() => saidSince(page, n, /^Here you are!$/)).toBe(true);
  await doBag(page);
  await expect.poll(() => saidSince(page, n, /^Bye-bye!$/), { timeout: 15000 }).toBe(true);
  expect(await saidSince(page, n, /coin/)).toBe(false); // mức 1 không có xu
  await expect(page.locator('.jb-count')).toHaveText('2/3', { timeout: 15000 });
});

test('3 khách → Hoan hô + sticker; đếm lượt', async ({ page }) => {
  await openShop(page);
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
    await serve(page);
    await doBag(page);
  }
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
  // Màn hoan hô không bị cắt: hộp quà và nút ✔ nằm trọn trong màn hình.
  await expect(page.locator('.done-btn')).toBeInViewport({ ratio: 1, timeout: 15000 });
  await expect(page.locator('.gift')).toBeInViewport({ ratio: 1 });
  expect((await page.evaluate(() => window.kidEnglish.settings.shopGame)).rounds).toBe(1);
});

test('mức 2: trả xu: bỏ từng xu vào két, Bông đếm, đủ xu thì cảm ơn; ra nền giữa lúc trả xu → quay lại vẫn ở bước trả xu', async ({ page }) => {
  await openShop(page, { level: 2, rounds: 0, lock: 2, seen: {} });
  await expect(page.locator('.jb-tray .dr-item')).toHaveCount(5);
  await serve(page);
  await expect(play(page)).toHaveAttribute('data-state', 'coins', { timeout: 15000 });
  const total = await page.locator('.sh-coin').count();
  expect(total).toBeGreaterThanOrEqual(1);
  const n = (await spoken(page)).length;
  await page.locator('.sh-coin').first().click();
  await expect.poll(() => saidSince(page, n, /^One coin!$/)).toBe(true);
  if (total > 1) {
    const setVisible = (s) => page.evaluate((v) => {
      Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    }, s);
    await setVisible('hidden');
    await setVisible('visible');
    await page.locator('.resume-overlay .start-btn').click();
    await expect(play(page)).toHaveAttribute('data-state', 'coins', { timeout: 15000 });
    await expect(page.locator('.sh-coin')).toHaveCount(total - 1);
    await expect(page.locator('.jb-count')).toHaveText('1/3');
  }
  while (await page.locator('.sh-coin').count()) {
    await expect(play(page)).toHaveAttribute('data-state', 'coins', { timeout: 15000 });
    await page.locator('.sh-coin').first().click();
    await page.waitForTimeout(100);
  }
  await doBag(page);
  await expect.poll(async () => (await spoken(page)).includes('Have a nice day!'), { timeout: 15000 }).toBe(true);
  await expect(page.locator('.jb-count')).toHaveText('2/3', { timeout: 15000 });
});

test('mức 3: khách gọi hai món, đưa một món thì khách gọi tiếp phần còn lại, có ✓ ở bong bóng', async ({ page }) => {
  await openShop(page, { level: 3, rounds: 0, lock: 3, seen: {} });
  const items = await order(page);
  expect(items.length).toBe(2);
  const n = (await spoken(page)).length;
  await page.locator(`.jb-tray .dr-item[data-item="${items[0].id}"]`).click();
  await expect(page.locator(`.sh-wish-item[data-food="${items[0].id}"][data-done="true"]`)).toHaveCount(1, { timeout: 15000 });
  await expect.poll(() => saidSince(page, n, /^Can I have .+, please\?$/)).toBe(true);
  await expect(play(page)).toHaveAttribute('data-state', 'order', { timeout: 15000 });
});

test('kệ dùng ảnh món Cho Bông ăn bố mẹ đã thay', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(async () => {
    const db = await import('/js/db.js');
    const feed = await import('/js/feed.js');
    const png = await new Promise((r) => { const c = document.createElement('canvas'); c.width = 60; c.height = 60; c.getContext('2d').fillRect(10, 10, 40, 40); c.toBlob(r, 'image/png'); });
    for (const f of feed.BUILTIN_FOODS.filter((x) => x.easy)) await db.setWordImage(window.kidEnglish.db, { lessonId: 'feed:food', word: f.id, blob: png, mimeType: 'image/png', width: 60, height: 60 });
  });
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Bán hàng' }).click();
  await toOrder(page);
  await expect(page.locator('.jb-tray .dr-item img')).toHaveCount(3);
});

// ---------- Theo review spec (JOBS-xx) ----------
const setVisible = (page, s) => page.evaluate((v) => {
  Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}, s);
const practice = (page, word) => page.evaluate(async (w) => (await window.kidEnglish.db.getAll('progress')).find((p) => p.word === w)?.practiceCount ?? 0, word);

test('JOBS-02: mức 2 khách mua nhiều cái — đưa cái đầu chưa xong bước (vẫn gọi tiếp), đủ số mới "Here you are!"', async ({ page }) => {
  await openShop(page, { level: 2, rounds: 0, lock: 2, seen: {} });
  // Kế hoạch ngẫu nhiên: mở lại tới khi khách đầu mua ≥ 2 cái.
  for (let i = 0; i < 15 && (await order(page))[0].count < 2; i++) {
    await page.getByRole('button', { name: 'Chọn nghề' }).click();
    await page.getByRole('button', { name: 'Bán hàng' }).click();
    await toOrder(page);
  }
  const [o] = await order(page);
  expect(o.count).toBeGreaterThanOrEqual(2);
  const n = (await spoken(page)).length;
  await page.locator(`.jb-tray .dr-item[data-item="${o.id}"]`).click();
  await expect.poll(() => saidSince(page, n, /^One!$/)).toBe(true);
  await expect(play(page)).toHaveAttribute('data-state', 'order', { timeout: 15000 });
  await expect.poll(() => saidSince(page, n, /^Can I have (one|two) more .+, please\?$/)).toBe(true);
  expect(await saidSince(page, n, /^Here you are!$/)).toBe(false);
  for (let i = 1; i < o.count; i++) {
    await expect(play(page)).toHaveAttribute('data-state', 'order', { timeout: 15000 });
    await page.locator(`.jb-tray .dr-item[data-item="${o.id}"]`).click();
  }
  await expect.poll(() => saidSince(page, n, /^Here you are!$/), { timeout: 15000 }).toBe(true);
});

test('JOBS-03 + JOBS-10: mức 3 đưa món thứ hai trước vẫn được; ra nền sau khi đưa một món → quay lại món đó vẫn ✓, đưa món còn lại là xong', async ({ page }) => {
  await openShop(page, { level: 3, rounds: 0, lock: 3, seen: {} });
  const [a, b] = await order(page);
  await page.locator(`.jb-tray .dr-item[data-item="${b.id}"]`).click();
  await expect(page.locator(`.sh-wish-item[data-food="${b.id}"][data-done="true"]`)).toHaveCount(1, { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'order', { timeout: 15000 });
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'order', { timeout: 15000 });
  await expect(page.locator(`.sh-wish-item[data-food="${b.id}"][data-done="true"]`)).toHaveCount(1);
  await expect(page.locator(`.sh-wish-item[data-food="${a.id}"][data-done="false"]`)).toHaveCount(1);
  // Đưa lại món đã đủ: "I have that already!", không xong bước.
  const n = (await spoken(page)).length;
  await page.locator(`.jb-tray .dr-item[data-item="${b.id}"]`).click();
  await expect.poll(() => saidSince(page, n, /^I have that already! /)).toBe(true);
  await page.locator(`.jb-tray .dr-item[data-item="${a.id}"]`).click();
  await expect(play(page)).toHaveAttribute('data-state', 'coins', { timeout: 15000 });
  await expect(page.locator('.sh-coin')).toHaveCount(2);
});

test('JOBS-09: 🧹 ngay sau khi đưa đúng (đang bay / đang nói) — việc cũ không chạy tiếp; chơi lại cùng khách; "đã gặp" không ghi lần hai', async ({ page }) => {
  await openShop(page);
  const [o] = await order(page);
  const word = await page.evaluate(async (id) => (await import('/js/feed.js')).BUILTIN_FOODS.find((f) => f.id === id).en, o.id);
  const customer = await page.locator('.sh-customer').getAttribute('data-customer');
  await page.locator(`.jb-tray .dr-item[data-item="${o.id}"]`).click();
  await page.getByRole('button', { name: 'Bán lại' }).click();
  const n = (await spoken(page)).length;
  await expect(play(page)).toHaveAttribute('data-state', 'order', { timeout: 15000 });
  await expect(page.locator('.sh-customer')).toHaveAttribute('data-customer', customer);
  await expect(page.locator('.jb-count')).toHaveText('1/3');
  await page.waitForTimeout(500);
  expect(await saidSince(page, n, /^(Here you are!|Put it in the bag!)$/)).toBe(false);
  const before = await practice(page, word);
  await page.locator(`.jb-tray .dr-item[data-item="${o.id}"]`).click();
  await expect.poll(() => saidSince(page, n, /^Put it in the bag!$/), { timeout: 15000 }).toBe(true);
  expect(await practice(page, word)).toBe(before);
});

// ---------- SPEC-jobs2 SH1: bày kệ + đưa túi ----------
const groupOf = (page, id) => page.locator(`.jb-tray .dr-item[data-item="${id}"]`).getAttribute('data-group');

test('SH1 mức 1: bày kệ — 3 món, 2 giỏ Fruit / Drinks; chạm món → vào đúng giỏ + "… are fruit!" / "… is a drink!", không có nhầm; đủ → "The shop is open!" → khách đầu', async ({ page }) => {
  await openShop(page, null, { stock: false });
  await expect(page.locator('.sh-basket')).toHaveCount(2);
  await expect(page.locator('.jb-tray .dr-item')).toHaveCount(3);
  await expect(page.locator('.sh-customer')).toBeHidden();
  await expect.poll(() => spoken(page)).toContain("Let's fill the shop! Tap the food.");
  const ids = await page.locator('.jb-tray .dr-item').evaluateAll((els) => els.map((e) => [e.dataset.item, e.dataset.group]));
  for (const [id, g] of ids) {
    await expect(play(page)).toHaveAttribute('data-state', 'stock', { timeout: 15000 });
    const n = (await spoken(page)).length;
    await page.locator(`.jb-tray .dr-item[data-item="${id}"]`).click();
    await expect(page.locator(`.sh-basket[data-group="${g}"] .sh-basket-in > *`)).not.toHaveCount(0, { timeout: 15000 });
    await expect.poll(() => saidSince(page, n, g === 'drink' ? /^\w+ is a drink!$/ : /^\w+ (is|are) fruit!$/)).toBe(true);
  }
  expect(await saidSince(page, 0, /basket\.$/)).toBe(false);
  await expect.poll(() => spoken(page)).toContain('The shop is open!');
  await expect(play(page)).toHaveAttribute('data-state', 'order', { timeout: 15000 });
  await expect(page.locator('.sh-customer')).toBeVisible();
  await expect(page.locator('.sh-baskets')).toBeHidden();
  await expect(page.locator('.jb-count')).toHaveText('1/3');
});

test('SH1 mức 2: chạm món rồi chạm giỏ sai → "… Put it in the … basket." (nhầm); kéo món thả vào giỏ đúng được; ra nền giữa lúc bày → quay lại giữ món đã bày', async ({ page }) => {
  await openShop(page, { level: 2, rounds: 0, lock: 2, seen: {} }, { stock: false });
  await expect(page.locator('.sh-basket')).toHaveCount(2);
  await expect(page.locator('.jb-tray .dr-item')).toHaveCount(4);
  const first = await page.locator('.jb-tray .dr-item').first().getAttribute('data-item');
  const g = await groupOf(page, first);
  const other = g === 'fruit' ? 'drink' : 'fruit';
  await page.locator(`.jb-tray .dr-item[data-item="${first}"]`).click();
  await expect(page.locator(`.jb-tray .dr-item[data-item="${first}"]`)).toHaveClass(/picked/);
  const n = (await spoken(page)).length;
  await page.locator(`.sh-basket[data-group="${other}"]`).click();
  await expect.poll(() => saidSince(page, n, new RegExp(`Put it in the ${g === 'fruit' ? 'fruit' : 'drinks'} basket\\.$`))).toBe(true);
  await page.locator(`.sh-basket[data-group="${g}"]`).click();
  await expect(page.locator('.jb-tray .dr-item')).toHaveCount(3, { timeout: 15000 });
  // Kéo thả món thứ hai vào giỏ đúng.
  await expect(play(page)).toHaveAttribute('data-state', 'stock', { timeout: 15000 });
  const second = await page.locator('.jb-tray .dr-item').first().getAttribute('data-item');
  const g2 = await groupOf(page, second);
  const from = await page.locator(`.jb-tray .dr-item[data-item="${second}"]`).boundingBox();
  const to = await page.locator(`.sh-basket[data-group="${g2}"]`).boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('.jb-tray .dr-item')).toHaveCount(2, { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'stock', { timeout: 15000 });
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'stock', { timeout: 15000 });
  await expect(page.locator('.jb-tray .dr-item')).toHaveCount(2);
  await expect(page.locator('.sh-basket .sh-basket-in > *')).toHaveCount(2);
  await toOrder(page);
});

test('SH1 mức 3: thêm giỏ "Other food" — 3 giỏ, thùng có món của cả 3 nhóm', async ({ page }) => {
  await openShop(page, { level: 3, rounds: 0, lock: 3, seen: {} }, { stock: false });
  await expect(page.locator('.sh-basket')).toHaveCount(3);
  await expect(page.locator('.sh-basket[data-group="other"]')).toContainText('Other food');
  const groups = await page.locator('.jb-tray .dr-item').evaluateAll((els) => els.map((e) => e.dataset.group));
  expect(new Set(groups)).toEqual(new Set(['fruit', 'drink', 'other']));
  await toOrder(page);
});

test('SH1 đưa túi: "Put it in the bag!" → chạm khách trước: túi nhún, không nhầm; chạm túi → "Give it to …!"; ra nền → vẫn bước đưa túi; chạm khách → "Thank you!" → "Have a nice day!" → "You too!" → "Bye-bye!"', async ({ page }) => {
  await openShop(page);
  await serve(page);
  await expect(play(page)).toHaveAttribute('data-state', 'bag', { timeout: 15000 });
  await expect.poll(() => spoken(page)).toContain('Put it in the bag!');
  await expect(page.locator('.sh-bag')).toBeVisible();
  await page.locator('.sh-customer').click();
  await expect(page.locator('.sh-bag')).toHaveClass(/nudge/);
  await expect(play(page)).toHaveAttribute('data-state', 'bag');
  await page.locator('.sh-bag').click();
  await expect(play(page)).toHaveAttribute('data-state', 'give', { timeout: 15000 });
  const name = await page.evaluate(async (id) => (await import('/js/doctor.js')).PATIENT_BY_ID.get(id).name, await page.locator('.sh-customer').getAttribute('data-customer'));
  await expect.poll(() => spoken(page)).toContain(`Give it to ${name}!`);
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'give', { timeout: 15000 });
  await expect(page.locator('.sh-bag')).toHaveClass(/full/);
  const n = (await spoken(page)).length;
  await page.locator('.sh-customer').click();
  await expect.poll(async () => (await spoken(page)).slice(n).filter((t) => /^(Thank you!|Have a nice day!|You too!|Bye-bye!)$/.test(t)), { timeout: 15000 })
    .toEqual(['Thank you!', 'Have a nice day!', 'You too!', 'Bye-bye!']);
  await expect(page.locator('.jb-count')).toHaveText('2/3', { timeout: 15000 });
});

// ---------- SPEC-jobs2 SH2: quầy sinh tố ----------
test('SH2 mức 2: "Can I have a … smoothie, please?" — bấm máy xay khi chưa có quả → "We need …!" (không nhầm); quả sai → "That\'s …. I want …!"; đủ quả → bấm máy → "And some milk!" → ly sinh tố → "Yummy! Thank you!" → trả xu → túi', async ({ page }) => {
  await openShop(page, { level: 2, rounds: 0, lock: 2, seen: {} }, { stock: true, smoothieAt: 0 });
  await expect(play(page)).toHaveAttribute('data-state', 'blend-add', { timeout: 15000 });
  await expect(page.locator('.sh-blender')).toBeVisible();
  await expect(page.locator('.jb-tray .dr-item')).toHaveCount(3);
  const [o] = await order(page);
  await expect.poll(() => spoken(page)).toContain(`Can I have a${/^[aeiou]/.test(o.id) ? 'n' : ''} ${o.id} smoothie, please?`);
  let n = (await spoken(page)).length;
  await page.locator('.sh-blend-btn').click();
  await expect.poll(() => saidSince(page, n, new RegExp(`^We need ${o.id}!$`))).toBe(true);
  await expect(play(page)).toHaveAttribute('data-state', 'blend-add');
  const wrong = await page.locator(`.jb-tray .dr-item:not([data-item="${o.id}"])`).first().getAttribute('data-item');
  n = (await spoken(page)).length;
  await page.locator(`.jb-tray .dr-item[data-item="${wrong}"]`).click();
  await expect.poll(() => saidSince(page, n, new RegExp(`^That's (an? )?${wrong}\\. I want ${o.id}!$`))).toBe(true);
  await page.locator(`.jb-tray .dr-item[data-item="${o.id}"]`).click();
  await expect(play(page)).toHaveAttribute('data-state', 'blend-ready', { timeout: 15000 });
  await expect(page.locator('.sh-jar > *')).toHaveCount(1);
  await expect.poll(() => spoken(page)).toContain('Press the button!');
  n = (await spoken(page)).length;
  await page.locator('.sh-blend-btn').click();
  await expect.poll(() => saidSince(page, n, /^And some milk!$/)).toBe(true);
  await expect(page.locator('.sh-cup')).toHaveAttribute('data-fruits', o.id, { timeout: 15000 });
  await expect.poll(() => saidSince(page, n, new RegExp(`^Here you are! An? ${o.id} smoothie!$`))).toBe(true);
  await expect.poll(() => saidSince(page, n, /^Yummy! Thank you!$/)).toBe(true);
  await expect(play(page)).toHaveAttribute('data-state', 'coins', { timeout: 15000 });
  await expect(page.locator('.sh-coin')).toHaveCount(1);
  await page.locator('.sh-coin').click();
  await doBag(page);
  await expect(page.locator('.jb-count')).toHaveText('2/3', { timeout: 15000 });
  await expect(page.locator('.sh-blender')).toBeHidden();
});

test('SH2 mức 3: sinh tố hai quả — ly hai lớp màu; ra nền sau khi bỏ quả đầu → quay lại cối vẫn có quả đó', async ({ page }) => {
  await openShop(page, { level: 3, rounds: 0, lock: 3, seen: {} }, { stock: true, smoothieAt: 0 });
  await expect(play(page)).toHaveAttribute('data-state', 'blend-add', { timeout: 15000 });
  await expect(page.locator('.jb-tray .dr-item')).toHaveCount(4);
  const [a, b] = await order(page);
  await expect.poll(() => spoken(page)).toContain(`Can I have a${/^[aeiou]/.test(a.id) ? 'n' : ''} ${a.id} and ${b.id} smoothie, please?`);
  await page.locator(`.jb-tray .dr-item[data-item="${a.id}"]`).click();
  await expect(page.locator('.sh-jar > *')).toHaveCount(1, { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'blend-add', { timeout: 15000 });
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'blend-add', { timeout: 15000 });
  await expect(page.locator('.sh-jar > *')).toHaveCount(1);
  await page.locator(`.jb-tray .dr-item[data-item="${b.id}"]`).click();
  await expect(play(page)).toHaveAttribute('data-state', 'blend-ready', { timeout: 15000 });
  await page.locator('.sh-blend-btn').click();
  await expect(page.locator('.sh-cup')).toHaveAttribute('data-fruits', `${a.id} ${b.id}`, { timeout: 15000 });
  const [c1, c2] = await page.locator('.sh-cup').evaluate((el) => [getComputedStyle(el.querySelector('.sh-cup-bottom')).backgroundColor, getComputedStyle(el.querySelector('.sh-cup-top')).backgroundColor]);
  expect(c1).not.toBe(c2);
  await expect(play(page)).toHaveAttribute('data-state', 'coins', { timeout: 15000 });
});

// ---------- Đồ trên quầy → túi → khách ----------
test('đưa món: món đặt lên quầy (không bay thẳng tới khách); chạm túi → đồ trên quầy vào túi (quầy trống) → đưa túi cho khách', async ({ page }) => {
  await openShop(page);
  const [o] = await order(page);
  await page.locator(`.jb-tray .dr-item[data-item="${o.id}"]`).click();
  await expect(page.locator(`.sh-goods .sh-good[data-food="${o.id}"]`)).toHaveCount(1, { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'bag', { timeout: 15000 });
  await expect(page.locator('.sh-goods .sh-good')).toHaveCount(1);
  await page.locator('.sh-bag').click();
  await expect(play(page)).toHaveAttribute('data-state', 'give', { timeout: 15000 });
  await expect(page.locator('.sh-goods .sh-good')).toHaveCount(0);
  await page.locator('.sh-customer').click();
  await expect(page.locator('.jb-count')).toHaveText('2/3', { timeout: 15000 });
  await expect(page.locator('.sh-goods .sh-good')).toHaveCount(0);
});

test('ảnh món trong bong bóng luôn nằm gọn trong ô (ảnh dọc to không tràn)', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(async () => {
    const db = await import('/js/db.js');
    const feed = await import('/js/feed.js');
    const c = document.createElement('canvas'); c.width = 600; c.height = 900;
    const g = c.getContext('2d'); g.fillStyle = '#ff922b'; g.fillRect(150, 50, 300, 800);
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    for (const f of feed.BUILTIN_FOODS.filter((x) => x.easy)) await db.setWordImage(window.kidEnglish.db, { lessonId: 'feed:food', word: f.id, blob, mimeType: 'image/png', width: 600, height: 900 });
  });
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Bán hàng' }).click();
  await toOrder(page);
  const [item, face] = await Promise.all(['.sh-wish-item', '.sh-wish-item .sh-wish-face'].map((s) => page.locator(s).first().boundingBox()));
  expect(face.width).toBeLessThanOrEqual(item.width + 0.5);
  expect(face.height).toBeLessThanOrEqual(item.height + 0.5);
});
