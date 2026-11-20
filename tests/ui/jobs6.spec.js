// SPEC-jobs6 (0.88.0) — 👨‍🍳 Đầu bếp nhí mức 3: bé nói tên món để chọn (vừa nói vừa chạm). Test giả kết quả nhận dạng bằng
// window.__kidTest.chefTalkResult = { text, delay?, error? }; chuỗi ('voice' / 'match'…) là kiểu cũ của lượt nói.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const play = (page) => page.locator('.jb-play');
const E_TOOL = { scoop: 'rice', squeeze: 'gloves', wrap: 'seaweed', mix: 'spoon', spread: 'sauce', sprinkle: 'cheese' };

/** `seen`: mức 1 thực đơn có 2 món ít làm nhất — mặc định cho salad "đã làm nhiều" để thực đơn là cơm nắm + pizza. */
async function openChef(page, level, rounds = 2, { seen = { 'dish:salad': 5 }, talk = false, talkResult = null, mic = true } = {}) {
  if (talkResult) await page.addInitScript((r) => { window.__kidTest = { chefTalkResult: r }; }, talkResult);
  await fakeSpeech(page, { mic });
  await startApp(page);
  await page.evaluate(([l, r, s]) => window.kidEnglish.setSetting('chefGame', { level: l, rounds: r, lock: null, seen: s }), [level, rounds, seen]);
  if (talk) await page.evaluate(() => window.kidEnglish.setSetting('jobsTalk', true));
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.locator('.jb-job-chef').click();
  await expect(play(page)).toBeVisible();
}
async function tapTray(page, id) {
  const item = page.locator(`.jb-tray [data-item="${id}"]`);
  await item.dispatchEvent('pointerdown', { pointerId: 3, button: 0 });
  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 3, button: 0 })));
}
const stateIs = (page, re) => expect(play(page)).toHaveAttribute('data-state', re, { timeout: 15000 });
const done = (page) => expect(page.locator('.jb-play.jb-done')).toHaveCount(1, { timeout: 20000 });
const setVisible = (page, v) => page.evaluate((x) => {
  Object.defineProperty(document, 'visibilityState', { value: x, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}, v);

/** Giải bước đang chờ (đọc các thuộc tính chỉ để test). `dish`: món chọn ở thực đơn. */
async function solve(page, dish = 'rice-ball') {
  const s = await play(page).getAttribute('data-state');
  if (s === 'wash') return page.locator('.cf-sink').click();
  if (s === 'layer') return tapTray(page, await page.locator('.cf-plate').getAttribute('data-next'));
  if (s === 'serve') return page.locator('.cf-plate:visible, .cf-cake:visible').first().click();
  if (s === 'bake') {
    const want = await page.locator('.cf-tools').getAttribute('data-want');
    return want === 'bake' ? page.locator('.cf-bowl').click() : page.locator(`.cf-tools .cf-tool[data-tool="${TOOL[want]}"]`).click();
  }
  if (s === 'decor') {
    const want = (await page.locator('.cf-cake').getAttribute('data-want')).split(',').map((x) => x.split(':')[0]);
    for (const id of want) if (!(await page.locator(`.jb-tray [data-item="${id}"].full`).count())) return tapTray(page, id);
  }
  if (s === 'temp') return tapTray(page, await page.locator('.cf-plate').getAttribute('data-dish'));
  if (s === 'clean') {
    const target = await page.locator('.cf-clean').getAttribute('data-target');
    const item = page.locator(`.cf-citem[data-item="${target}"]`);
    if (await level(page) >= 3 && !(await item.evaluate((el) => el.classList.contains('sel')))) return item.click();
    return page.locator(`.cf-place[data-place="${await page.locator('.cf-clean').getAttribute('data-place')}"]`).click();
  }
  if (s === 'feel') return page.locator('.cf-feel[data-feel="hungry"]').click();
  if (s === 'menu') return page.locator(`.cf-mcard[data-dish="${dish}"]`).click();
  if (s === 'fruit') return tapTray(page, (await page.locator('.cf-work').getAttribute('data-missing')).split(',')[0]);
  if (s === 'topping') {
    const want = (await page.locator('.cf-work').getAttribute('data-tops')).split(',').map((x) => x.split(':')[0]);
    for (const id of want) if (!(await page.locator(`.jb-tray [data-item="${id}"].full`).count())) return tapTray(page, id);
  }
  if (s === 'cook') {
    const want = await page.locator('.cf-work').getAttribute('data-want');
    if (want === 'bake') return page.locator('.cf-oven').click();
    return want === 'peel' ? page.locator('.cf-sbanana').click() : page.locator(`.cf-ktools .cf-tool[data-tool="${E_TOOL[want]}"]`).click();
  }
  if (s === 'eat') return page.locator('.cf-plate').click();
}
async function playUntil(page, re, dish) {
  for (let i = 0; i < 160; i++) {
    const s = await play(page).getAttribute('data-state');
    if (re.test(s)) return;
    if (/^(wash|layer|serve|bake|decor|temp|clean|feel|menu|fruit|topping|cook|eat)$/.test(s)) await solve(page, dish);
    await page.waitForTimeout(150);
  }
  throw new Error(`không tới được ${re}`);
}
const TOOL = { pour: 'milk', crack: 'egg', mix: 'spoon' };
const level = (page) => page.evaluate(() => window.kidEnglish.settings.chefGame.level);
const card = (page, dish) => page.locator(`.cf-mcard[data-dish="${dish}"]`);

test('JOBS6-01: mức 3 nói "pizza please" → chọn pizza, "Pizza! Great talking!" + ⭐; không có lượt nói sau đó', async ({ page }) => {
  await openChef(page, 3, 2, { talk: true, talkResult: { text: 'pizza please' } });
  await playUntil(page, /^menu$/);
  await stateIs(page, 'cook');
  expect(await spoken(page)).toEqual(expect.arrayContaining(['Say it, or touch it!', 'Pizza! Great talking!']));
  await expect(page.locator('.cf-work')).toHaveAttribute('data-dish', 'pizza');
  expect(await spoken(page)).not.toContain('Pizza, please!');
  expect(await spoken(page)).not.toContain('Touch one!');
});

test('JOBS6-02: chạm thẻ lúc đang nghe → chọn theo chạm, kết quả nghe về sau bị bỏ, không có lượt nói', async ({ page }) => {
  await openChef(page, 3, 2, { talk: true, talkResult: { text: 'pizza', delay: 2500 } });
  await playUntil(page, /^menu$/);
  await expect(page.locator('.cf-mic')).toBeVisible({ timeout: 10000 });
  await card(page, 'rice-ball').click();
  await expect(page.locator('.cf-mic')).toBeHidden();
  await stateIs(page, 'cook');
  await page.waitForTimeout(3000);
  await expect(page.locator('.cf-work')).toHaveAttribute('data-dish', 'rice-ball');
  expect(await spoken(page)).not.toContain('Pizza! Great talking!');
  expect(await spoken(page)).not.toContain('Rice ball, please!');
});

test('JOBS6-03: nói tên món không có ("I like cake") → "Touch one!", không nghe lại, chạm để chọn; không tính nhầm', async ({ page }) => {
  await openChef(page, 3, 2, { talk: true, talkResult: { text: 'I like cake' } });
  await playUntil(page, /^menu$/);
  await expect.poll(() => spoken(page), { timeout: 10000 }).toContain('Touch one!');
  await expect(page.locator('.cf-mic')).toBeHidden();
  await stateIs(page, 'menu');
  await card(page, 'salad').click();
  await stateIs(page, /^(cook|fruit)$/);
  await expect(page.locator('.cf-work')).toHaveAttribute('data-dish', 'salad');
  const s = await spoken(page);
  expect(s.filter((t) => t === 'Touch one!').length).toBe(1);
  expect(s.filter((t) => t === 'Say it, or touch it!').length).toBe(1);
  expect(s).not.toContain('Great talking!');
});

test('JOBS6-04: mic / nhận dạng lỗi lúc nghe → "Touch one!", chạm vẫn chọn được', async ({ page }) => {
  await openChef(page, 3, 2, { talk: true, talkResult: { error: true } });
  await playUntil(page, /^menu$/);
  await expect.poll(() => spoken(page), { timeout: 10000 }).toContain('Touch one!');
  await card(page, 'pizza').click();
  await stateIs(page, 'cook');
  await expect(page.locator('.cf-work')).toHaveAttribute('data-dish', 'pizza');
});

test('JOBS6-05: thiếu điều kiện (lượt nói tắt / mức 2) → không nghe ở thực đơn, chọn bằng chạm như cũ', async ({ page }) => {
  await openChef(page, 3, 2, { talk: false, talkResult: { text: 'pizza' } });
  await playUntil(page, /^menu$/);
  await page.waitForTimeout(800);
  await expect(page.locator('.cf-mic')).toBeHidden();
  await card(page, 'rice-ball').click();
  await stateIs(page, 'cook');
  expect(await spoken(page)).not.toContain('Say it, or touch it!');
  await expect(page.locator('.cf-work')).toHaveAttribute('data-dish', 'rice-ball');
});

test('JOBS6-05b: mức 2 lượt nói bật → thực đơn không nghe, chạm rồi lượt nói như cũ', async ({ page }) => {
  await openChef(page, 2, 2, { talk: true, talkResult: { text: 'pizza' } });
  await playUntil(page, /^menu$/);
  await page.waitForTimeout(800);
  expect(await spoken(page)).not.toContain('Say it, or touch it!');
  await card(page, 'pizza').click();
  await stateIs(page, 'cook');
  expect(await spoken(page)).toContain('Pizza, please!');
});

test('JOBS6-06: ra nền lúc đang nghe → quay lại hiện thẻ chờ chạm, không nghe lại', async ({ page }) => {
  await openChef(page, 3, 2, { talk: true, talkResult: { text: 'pizza', delay: 4000 } });
  await playUntil(page, /^menu$/);
  await expect(page.locator('.cf-mic')).toBeVisible({ timeout: 10000 });
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await stateIs(page, 'menu');
  await expect(page.locator('.cf-mcard')).toHaveCount(3);
  await page.waitForTimeout(4500);
  await expect(page.locator('.cf-mic')).toBeHidden();
  await stateIs(page, 'menu');
  expect((await spoken(page)).filter((t) => t === 'Say it, or touch it!').length).toBe(1);
  await card(page, 'salad').click();
  await stateIs(page, /^(cook|fruit)$/);
  await expect(page.locator('.cf-work')).toHaveAttribute('data-dish', 'salad');
});
