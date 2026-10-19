// Đếm hình (SPEC-shapes.md): khởi động "Find a …!", chạm đếm (huy hiệu số, không đếm trùng), chạm hình khác nói tên hình,
// gợi ý 10 giây, tổng kết, 5 câu + sticker, mức 2 chọn thẻ số, chơi tiếp sau khi app ra nền, giảm chuyển động.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const card = (page) => page.locator('.sc-card');
const question = async (page) => ({ picture: await card(page).getAttribute('data-picture'), kind: await card(page).getAttribute('data-kind') });
const targets = (page, kind) => page.locator(`.sc-pic [data-kind="${kind}"]:not(.sc-pad)`);
/** Chạm một hình (bắn click thẳng vào phần tử SVG — không phụ thuộc vị trí trên màn). */
const tapShape = (page, sel, times = 1) => page.evaluate(({ s, n }) => {
  const el = document.querySelector(s);
  for (let i = 0; i < n; i++) el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, { s: sel, n: times });
const plural = { circle: 'circles', square: 'squares', triangle: 'triangles', rectangle: 'rectangles', star: 'stars', heart: 'hearts' };
const NUM = ['zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

async function openShapes(page, settings) {
  await fakeSpeech(page);
  await startApp(page);
  if (settings) await page.evaluate((s) => window.kidEnglish.setSetting('shapeCount', s), settings);
  await page.getByRole('button', { name: 'Số đếm' }).click();
  await page.getByRole('button', { name: 'Count the shapes' }).click();
  await expect(card(page)).toBeVisible();
}
/** Nếu đang ở bước khởi động "Find a …!" thì chạm một hình đúng loại. */
async function passWarmup(page, kind) {
  const said = await spoken(page);
  if (said.at(-1)?.startsWith('Find a') || said.at(-1)?.startsWith('Find an')) {
    await tapShape(page, `.sc-pic [data-kind="${kind}"]:not(.sc-pad)`);
  }
}
test('một câu: khởi động "Find a …!", chạm hình khác nói tên hình, chạm đếm có huy hiệu số, chạm lại không đếm trùng, tổng kết', async ({ page }) => {
  await openShapes(page);
  const { picture, kind } = await question(page);
  // Câu đầu: bé chưa gặp loại hình này → "This is a …!" + "Find a …!".
  await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(/^This is an? [a-z]+!$/));
  await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(/^Find an? [a-z]+!$/));
  await tapShape(page, `.sc-pic [data-kind="${kind}"]:not(.sc-pad)`);
  await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(/^Yes! An? [A-Za-z]+!$/));
  await expect.poll(() => spoken(page)).toContain(`How many ${plural[kind]}?`);
  expect((await spoken(page))).toContainEqual(expect.stringMatching(/^Look! /));

  // Chạm hình khác loại (nếu tranh có) → nói tên hình, không đếm.
  const other = page.locator(`.sc-pic [data-shape]:not(.sc-pad):not([data-kind="${kind}"])`).first();
  if (await other.count()) {
    const otherKind = await other.getAttribute('data-kind');
    await other.dispatchEvent('click');
    await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(new RegExp(`^That's an? ${otherKind}!$`)));
    await expect(page.locator('.sc-counter')).toHaveText('0');
  }

  // Đếm: hình đầu chạm 3 lần liền → chỉ đếm 1; chạm lại → "That's one!".
  const ids = await targets(page, kind).evaluateAll((els) => els.map((e) => e.dataset.shape));
  await tapShape(page, `.sc-pic [data-shape="${ids[0]}"]:not(.sc-pad)`, 3);
  await expect(page.locator('.sc-counter')).toHaveText('1');
  // Tranh chỉ có 1 hình đúng loại thì lần chạm đầu đã xong câu; còn lại thì chạm lại phải nói "That's one!".
  if (ids.length > 1) {
    await expect(page.locator('.sc-badge')).toHaveCount(1);
    expect(await spoken(page)).toContain("That's one!");
  }
  for (const id of ids.slice(1)) await tapShape(page, `.sc-pic [data-shape="${id}"]:not(.sc-pad)`);
  const n = ids.length;
  await expect(page.locator('.sc-badge')).toHaveCount(n);
  const total = `${NUM[n]} ${n === 1 ? kind : plural[kind]}! Great counting!`;
  await expect.poll(() => spoken(page)).toContain(total);
  // Đáp án đúng bằng số hình vẽ trong dữ liệu.
  const expected = await page.evaluate(async ({ p, k }) => {
    const m = await import('/js/shapes.js');
    return m.countOf(m.PICTURE_BY_ID.get(p), k);
  }, { p: picture, k: kind });
  expect(n).toBe(expected);
});

test('lượt 5 câu → sticker; tiến độ số tăng; ghi lượt + loại hình đã gặp; chạm nhanh không đếm trùng', async ({ page }) => {
  await openShapes(page);
  for (let q = 0; q < 5; q++) {
    await expect(card(page)).toBeVisible();
    const { kind } = await question(page);
    await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(/^(How many|Find an? )/));
    await passWarmup(page, kind);
    await expect.poll(async () => (await spoken(page)).at(-1)).toMatch(/^How many /);
    const before = (await spoken(page)).filter((t) => /Great counting!$/.test(t)).length;
    const ids = await targets(page, kind).evaluateAll((els) => els.map((e) => e.dataset.shape));
    // Chạm mọi hình 2 lần trong cùng một nhịp: chỉ đếm mỗi hình một lần.
    await page.evaluate((list) => {
      for (const id of [...list, ...list]) document.querySelector(`.sc-pic [data-shape="${id}"]:not(.sc-pad)`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }, ids);
    await expect.poll(async () => (await spoken(page)).filter((t) => /Great counting!$/.test(t)).length).toBe(before + 1);
    // Tổng Bông đọc = số hình (mỗi hình chỉ đếm một lần dù bị chạm 2 lần).
    const total = (await spoken(page)).filter((t) => /Great counting!$/.test(t)).at(-1);
    expect(total.startsWith(`${NUM[ids.length]} `)).toBe(true);
  }
  await expect(page.locator('.prize-sticker')).toBeVisible();
  const st = await page.evaluate(() => window.kidEnglish.settings.shapeCount);
  expect(st.rounds).toBe(1);
  expect(st.seen.length).toBeGreaterThanOrEqual(2);
  const nums = await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).filter((r) => r.word.startsWith('number:')).length);
  expect(nums).toBeGreaterThan(0);
});

test('gợi ý: 10 giây không chạm thì một hình chưa đếm lấp lánh', async ({ page }) => {
  await openShapes(page, { seen: ['circle', 'square', 'triangle'] }); // không khởi động
  const { kind } = await question(page);
  await expect.poll(() => spoken(page)).toContain(`How many ${plural[kind]}?`);
  await expect(page.locator(`.sc-pic [data-kind="${kind}"].sc-hint`)).toHaveCount(1, { timeout: 3000 });
});

test('mức 2: đếm xong → 3 thẻ số; chọn sai "That\'s … Try again!", chọn đúng "Yes! …!"', async ({ page }) => {
  await openShapes(page, { lock: 2, seen: ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart'] });
  const { kind } = await question(page);
  await expect.poll(() => spoken(page)).toContain(`How many ${plural[kind]}?`);
  const ids = await targets(page, kind).evaluateAll((els) => els.map((e) => e.dataset.shape));
  for (const id of ids) await tapShape(page, `.sc-pic [data-shape="${id}"]:not(.sc-pad)`);
  await expect(page.locator('.sc-choices .numeral-choice')).toHaveCount(3);
  const n = ids.length;
  const wrongBtn = page.locator(`.sc-choices .numeral-choice:not([data-n="${n}"])`).first();
  const m = Number(await wrongBtn.getAttribute('data-n'));
  await wrongBtn.click();
  await expect.poll(() => spoken(page)).toContain(`That's ${NUM[m].toLowerCase()}. Try again!`);
  await page.locator(`.sc-choices .numeral-choice[data-n="${n}"]`).click();
  await expect.poll(() => spoken(page)).toContain(`Yes! ${NUM[n]}!`);
});

test('app ra nền rồi quay lại: chơi tiếp đúng câu đang làm (không về câu 1)', async ({ page }) => {
  await openShapes(page, { seen: ['circle', 'square', 'triangle'] });
  // Làm xong câu 1.
  let q = await question(page);
  await expect.poll(() => spoken(page)).toContain(`How many ${plural[q.kind]}?`);
  for (const id of await targets(page, q.kind).evaluateAll((els) => els.map((e) => e.dataset.shape))) {
    await tapShape(page, `.sc-pic [data-shape="${id}"]:not(.sc-pad)`);
  }
  await expect.poll(async () => JSON.stringify(await question(page))).not.toBe(JSON.stringify(q));
  q = await question(page);
  const setVisible = (s) => page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, s);
  await setVisible('hidden');
  await setVisible('visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(card(page)).toBeVisible();
  expect(await question(page)).toEqual(q);
});

test('giảm chuyển động: gợi ý không lấp lánh động (viền đứng yên)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openShapes(page, { seen: ['circle', 'square', 'triangle'] });
  const { kind } = await question(page);
  const hint = page.locator(`.sc-pic [data-kind="${kind}"].sc-hint`);
  await expect(hint).toHaveCount(1, { timeout: 3000 });
  expect(await hint.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});
