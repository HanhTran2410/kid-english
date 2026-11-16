// Nhiệm vụ mới cho các nghề (SPEC-jobs4.md). 0.71.0: 👩‍🌾 Nông trại — ca D trời hôm nay (2.1), Good night (2.2).
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const play = (page) => page.locator('.jb-play');
const FOOD = { cow: 'hay', sheep: 'grass', horse: 'carrot', chicken: 'corn', pig: 'apple', duck: 'seeds' };
const FARM_STATES = /^(door|feed|eggs|count|pick|wcard|help|night)$/;

async function openJob(page, job, level, rounds = 0) {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(([j, l, r]) => window.kidEnglish.setSetting(`${j}Game`, { level: l, rounds: r, lock: null, seen: {} }), [job, level, rounds]);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.locator(`.jb-job-${job}`).click();
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

/** Giải bước đang chờ của Nông trại (đọc các thuộc tính chỉ để test). */
async function solveFarm(page) {
  const s = await play(page).getAttribute('data-state');
  if (s === 'door') return page.locator(`.fm-door[data-animal="${await page.locator('.fm-doors').getAttribute('data-target')}"]`).click();
  if (s === 'feed') return tapTray(page, FOOD[await page.locator('.fm-animal').getAttribute('data-animal')]);
  if (s === 'eggs') {
    const hen = page.locator('.fm-hen:not(.up)');
    if (await hen.count()) return hen.first().click();
    const ask = await page.locator('.fm-nests').getAttribute('data-ask');
    return page.locator(`.fm-egg:not(.taken)${ask ? `[data-color="${ask}"]` : ''}`).first().click();
  }
  if (s === 'count') return page.locator(`.fm-card[data-n="${await page.locator('.fm-basket-in .fm-in').count()}"]`).click();
  if (s === 'pick') return page.locator('.fm-apple.match:not(.taken)').first().click();
  if (s === 'wcard') return page.locator(`.fm-wcard[data-w="${await page.locator('.fm-wcards').getAttribute('data-target')}"]`).click();
  if (s === 'help') return page.locator(`.fm-help[data-item="${await page.locator('.fm-helps').getAttribute('data-target')}"]`).click();
  if (s === 'night') {
    const target = await page.locator('.fm-yard').getAttribute('data-target');
    return page.locator(target ? `.fm-sleep[data-animal="${target}"]` : '.fm-sleep:not(.in)').first().click();
  }
}
/** Chơi tới khi trạng thái khớp `re` (giải mọi bước khác). */
async function playUntil(page, re) {
  for (let i = 0; i < 80; i++) {
    const s = await play(page).getAttribute('data-state');
    if (re.test(s)) return;
    if (FARM_STATES.test(s)) await solveFarm(page);
    await page.waitForTimeout(150);
  }
  throw new Error(`không tới được ${re}`);
}

test('Nông trại mức 1: ca D (A + B + D) — chạm đồ không sáng chỉ làm đồ đúng nhún, không tính nhầm (JOBS4-01); Good night chạm 2 lần một con chỉ đếm một lần (JOBS4-14); hết lượt → sticker', async ({ page }) => {
  await openJob(page, 'farm', 1);
  await playUntil(page, /^help$/);
  await expect(page.locator('.fm-sky')).toBeVisible();
  const right = await page.locator('.fm-helps').getAttribute('data-target');
  await expect(page.locator(`.fm-help.glow[data-item="${right}"]`)).toHaveCount(1);
  await page.locator(`.fm-help:not([data-item="${right}"])`).first().click();
  await expect(page.locator(`.fm-help[data-item="${right}"]`)).toHaveClass(/nudge/);
  expect((await spoken(page)).some((t) => /^That's the \w+\. It's/.test(t))).toBe(false);
  await solveFarm(page);
  await expect.poll(() => spoken(page)).toContain('Thank you!');
  await stateIs(page, 'night');
  await expect.poll(() => spoken(page)).toContain('Good night, farm! Time for bed!');
  await expect(page.locator('.fm-sleep')).toHaveCount(3);
  const first = page.locator('.fm-sleep').first();
  await first.click();
  await first.click({ force: true }).catch(() => {});
  await expect.poll(async () => (await spoken(page)).filter((t) => t === 'One!').length).toBe(1);
  await expect(page.locator('.fm-sleep.in')).toHaveCount(1);
  expect((await spoken(page)).includes('Two!')).toBe(false);
  for (let i = 0; i < 20 && !(await page.locator('.jb-play.jb-done').count()); i++) {
    if ((await play(page).getAttribute('data-state')) === 'night') await solveFarm(page);
    await page.waitForTimeout(150);
  }
  await done(page);
  expect(await spoken(page)).toContain('Shh! Good night!');
  expect((await page.evaluate(() => window.kidEnglish.settings.farmGame)).rounds).toBe(1);
});

test('Nông trại mức 2: ca D — nhầm đồ → "That\'s the … . It\'s … ! … , please!" (tính nhầm); B / C luân phiên theo rounds', async ({ page }) => {
  await openJob(page, 'farm', 2, 1);
  await playUntil(page, /^help$/);
  const right = await page.locator('.fm-helps').getAttribute('data-target');
  await expect(page.locator('.fm-help.glow')).toHaveCount(0);
  await page.locator(`.fm-help:not([data-item="${right}"])`).first().click();
  await expect.poll(async () => (await spoken(page)).some((t) => /^That's the \w+\. It's \w+! .+, please!$/.test(t))).toBe(true);
  await solveFarm(page);
  await expect.poll(() => spoken(page)).toContain('Thank you!');
  // rounds = 1 → ca C (hái quả) thay ca B.
  await playUntil(page, /^night$/);
  expect((await spoken(page)).some((t) => /^Pick the \w+ apples!$/.test(t))).toBe(true);
});

test('Nông trại mức 3: thẻ thời tiết sai → "That\'s … . Look at …" (JOBS4-02); đúng rồi ra nền → quay lại ở bước chọn đồ, không hỏi lại thẻ (JOBS4-03)', async ({ page }) => {
  await openJob(page, 'farm', 3);
  await playUntil(page, /^wcard$/);
  await expect(page.locator('.fm-wcard')).toHaveCount(3);
  const target = await page.locator('.fm-wcards').getAttribute('data-target');
  await page.locator(`.fm-wcard:not([data-w="${target}"])`).first().click();
  await expect.poll(async () => (await spoken(page)).some((t) => /^That's \w+\. Look at the/.test(t))).toBe(true);
  await stateIs(page, 'wcard');
  await page.locator(`.fm-wcard[data-w="${target}"]`).click();
  await stateIs(page, 'help');
  await expect(page.locator('.fm-wcards')).toBeHidden();
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await stateIs(page, 'help');
  await expect(page.locator('.fm-wcards')).toBeHidden();
  expect((await spoken(page)).filter((t) => t === "What's the weather?").length).toBe(1);
});

test('Nông trại mức 3: Good night gọi bằng tiếng kêu — chạm nhầm con → bác hỏi lại "Who says …? Go in!", con đó vẫn ở ngoài (JOBS4-15)', async ({ page }) => {
  await openJob(page, 'farm', 3);
  await playUntil(page, /^night$/);
  await expect.poll(async () => (await spoken(page)).some((t) => /^Who says \w+\? Go in!$/.test(t))).toBe(true);
  const target = await page.locator('.fm-yard').getAttribute('data-target');
  const call = (await spoken(page)).find((t) => /^Who says \w+\? Go in!$/.test(t));
  const wrong = page.locator(`.fm-sleep:not([data-animal="${target}"])`).first();
  // Câu gọi có thể đã được nhắc (10 giây, chế độ nhanh) — đếm từ lúc chạm nhầm.
  const before = (await spoken(page)).filter((t) => t === call).length;
  await wrong.click();
  await expect.poll(async () => (await spoken(page)).filter((t) => t === call).length).toBeGreaterThan(before);
  await expect(wrong).not.toHaveClass(/\bin\b/);
  await page.locator(`.fm-sleep[data-animal="${target}"]`).click();
  await expect(page.locator(`.fm-sleep[data-animal="${target}"]`)).toHaveClass(/\bin\b/);
});

// ---------- 0.72.0: 👨‍🍳 Đầu bếp nhí — ca D món nóng, món lạnh (3.1), dọn bếp (3.2) ----------
const TOOL = { pour: 'milk', crack: 'egg', mix: 'spoon' };
const HOT_DISH = { soup: true, 'hot-milk': true, 'ice-cream': false, 'cold-milk': false, 'cold-water': false };
/** Giải bước đang chờ của Đầu bếp. */
async function solveChef(page) {
  const s = await play(page).getAttribute('data-state');
  if (s === 'wash') return page.locator('.cf-sink').click();
  if (s === 'layer') return tapTray(page, await page.locator('.cf-plate').getAttribute('data-next'));
  if (s === 'serve') return page.locator('.cf-plate:visible, .cf-cake:visible').first().click();
  if (s === 'bake') {
    const want = await page.locator('.cf-tools').getAttribute('data-want');
    return want === 'bake' ? page.locator('.cf-bowl').click() : page.locator(`.cf-tool[data-tool="${TOOL[want]}"]`).click();
  }
  if (s === 'decor') {
    const want = (await page.locator('.cf-cake').getAttribute('data-want')).split(',').map((x) => x.split(':')[0]);
    for (const id of want) if (!(await page.locator(`.jb-tray [data-item="${id}"].full`).count())) return tapTray(page, id);
  }
  if (s === 'temp') return tapTray(page, await page.locator('.cf-plate').getAttribute('data-dish'));
  if (s === 'clean') {
    const target = await page.locator('.cf-clean').getAttribute('data-target');
    const item = page.locator(`.cf-citem[data-item="${target}"]`);
    if (await page.locator('.jb-play').evaluate(() => window.kidEnglish.settings.chefGame.level) >= 3 && !(await item.evaluate((el) => el.classList.contains('sel')))) return item.click();
    return page.locator(`.cf-place[data-place="${await page.locator('.cf-clean').getAttribute('data-place')}"]`).click();
  }
}
async function playChefUntil(page, re) {
  for (let i = 0; i < 120; i++) {
    const s = await play(page).getAttribute('data-state');
    if (re.test(s)) return;
    if (/^(wash|layer|serve|bake|decor|temp|clean)$/.test(s)) await solveChef(page);
    await page.waitForTimeout(150);
  }
  throw new Error(`không tới được ${re}`);
}

test('Đầu bếp mức 1 lượt lẻ: ca D thay bánh mì kẹp (JOBS4-06) — khách lạnh / nóng, món đúng nhún, chạm món sai không tính nhầm; đưa món nóng "Hot! Careful!" → "Phew, phew!", món lạnh "Brr! Yummy!" (JOBS4-05); không có dọn bếp', async ({ page }) => {
  await openJob(page, 'chef', 1, 0);
  await playChefUntil(page, /^temp$/);
  await expect(page.locator('.cf-customer')).toHaveAttribute('data-feel', /^(hot|cold)$/);
  await expect(page.locator('.jb-tray [data-item]')).toHaveCount(2);
  const dish = await page.locator('.cf-plate').getAttribute('data-dish');
  await tapTray(page, (await page.locator(`.jb-tray [data-item]:not([data-item="${dish}"])`).getAttribute('data-item')));
  await page.waitForTimeout(300);
  expect((await spoken(page)).some((t) => /^That's /.test(t))).toBe(false);
  await tapTray(page, dish);
  await stateIs(page, 'serve');
  await page.locator('.cf-plate').click();
  if (HOT_DISH[dish]) {
    await expect.poll(() => spoken(page)).toEqual(expect.arrayContaining(['Hot! Careful!', 'Phew, phew!', 'Yummy! Thank you!']));
  } else {
    await expect.poll(() => spoken(page)).toContain('Brr! Yummy!');
    expect(await spoken(page)).not.toContain('Hot! Careful!');
  }
  for (let i = 0; i < 80 && !(await page.locator('.jb-play.jb-done').count()); i++) {
    if (/^(wash|layer|serve|bake|decor|temp)$/.test(await play(page).getAttribute('data-state'))) await solveChef(page);
    await page.waitForTimeout(150);
  }
  await done(page);
  expect(await spoken(page)).not.toContain('Clean up time!');
  expect((await spoken(page)).some((t) => /^Bread!$/.test(t))).toBe(false); // không có bánh mì kẹp
});

test('Đầu bếp mức 3: khách gọi "Hot milk, please!" kiểu — chọn món cùng loại khác nóng / lạnh → câu nhầm, món về khay (JOBS4-04)', async ({ page }) => {
  await openJob(page, 'chef', 3, 0);
  await playChefUntil(page, /^temp$/);
  await expect(page.locator('.jb-tray [data-item]')).toHaveCount(4);
  const dish = await page.locator('.cf-plate').getAttribute('data-dish');
  const wrong = await page.locator(`.jb-tray [data-item]:not([data-item="${dish}"])`).first().getAttribute('data-item');
  await tapTray(page, wrong);
  await expect.poll(async () => (await spoken(page)).some((t) => /^That's [\w ]+\. [\w ]+, please!$/.test(t))).toBe(true);
  await expect(page.locator('.cf-stack .cf-dish')).toHaveCount(0);
  await stateIs(page, 'temp');
});

test('Đầu bếp mức 3 dọn bếp: chạm chỗ khi chưa chọn đồ — không tính nhầm, nhắc lại (JOBS4-16); chọn đồ rồi chạm chỗ sai → "That\'s the … . In the …, please!"; xong → "All clean! Good job!" → sticker; ra nền giữa dọn bếp quay lại đúng đồ', async ({ page }) => {
  await openJob(page, 'chef', 3, 1);
  await playChefUntil(page, /^clean$/);
  await expect(page.locator('.cf-citem')).toHaveCount(3);
  await expect.poll(async () => (await spoken(page)).some((t) => /^Put the \w+ in the \w+!$/.test(t))).toBe(true);
  const ask = (await spoken(page)).find((t) => /^Put the \w+ in the \w+!$/.test(t));
  const target = await page.locator('.cf-clean').getAttribute('data-target');
  const place = await page.locator('.cf-clean').getAttribute('data-place');
  await page.locator(`.cf-place[data-place="${place}"]`).click();
  await expect.poll(async () => (await spoken(page)).filter((t) => t === ask).length).toBe(2);
  await expect(page.locator(`.cf-citem[data-item="${target}"]`)).not.toHaveClass(/\bin\b/);
  await page.locator(`.cf-citem[data-item="${target}"]`).click();
  await expect(page.locator(`.cf-citem[data-item="${target}"]`)).toHaveClass(/\bsel\b/);
  await page.locator(`.cf-place:not([data-place="${place}"])`).first().click();
  await expect.poll(async () => (await spoken(page)).some((t) => /^That's the \w+\. In the \w+, please!$/.test(t))).toBe(true);
  await expect(page.locator(`.cf-citem[data-item="${target}"]`)).toHaveClass(/\bsel\b/);
  await page.locator(`.cf-place[data-place="${place}"]`).click();
  await expect(page.locator(`.cf-citem[data-item="${target}"]`)).toHaveClass(/\bin\b/);
  await stateIs(page, 'clean');
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await stateIs(page, 'clean');
  await expect(page.locator(`.cf-citem[data-item="${target}"]`)).toHaveClass(/\bin\b/);
  expect((await spoken(page)).filter((t) => t === 'Clean up time!').length).toBe(1);
  await playChefUntil(page, /^done$/).catch(() => {});
  await done(page);
  expect(await spoken(page)).toContain('All clean! Good job!');
});
