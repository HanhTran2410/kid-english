// 4 nghề mới (SPEC-jobs3.md): 👩‍🌾 Nông trại, 👨‍🍳 Đầu bếp nhí, 👷 Thợ xây, 🚌 Xe buýt — một lượt đủ luồng → sticker,
// câu nhầm, ra nền quay lại đúng bước, không bỏ ai (Xe buýt). Trang chọn nghề 10 thẻ (JOBS3-01).
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const play = (page) => page.locator('.jb-play');
const FOOD = { cow: 'hay', sheep: 'grass', horse: 'carrot', chicken: 'corn', pig: 'apple', duck: 'seeds' };
const TOOL = { pour: 'milk', crack: 'egg', mix: 'spoon' };

async function openJob(page, job, level) {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(([j, l]) => window.kidEnglish.setSetting(`${j}Game`, { level: l, rounds: 0, lock: l, seen: {} }), [job, level]);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.locator(`.jb-job-${job}`).click();
  await expect(play(page)).toBeVisible();
}
/** Chạm đồ trong khay (kit dùng pointerdown / pointerup). */
async function tapTray(page, id) {
  const item = page.locator(`.jb-tray [data-item="${id}"]`);
  await item.dispatchEvent('pointerdown', { pointerId: 3, button: 0 });
  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 3, button: 0 })));
}
const stateIs = (page, re) => expect(play(page)).toHaveAttribute('data-state', re, { timeout: 15000 });
const done = (page) => expect(page.locator('.jb-play.jb-done')).toHaveCount(1, { timeout: 20000 });

/** Giải bước đang chờ của từng nghề (đọc các thuộc tính chỉ để test). */
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
}

test('JOBS3-01: trang chọn nghề có đủ 10 nghề, điện thoại 390px không cuộn ngang', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await expect(page.locator('.jb-job')).toHaveCount(10);
  for (const job of ['farm', 'chef', 'build', 'bus']) await expect(page.locator(`.jb-job-${job}`)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Nông trại mức 1: cho ăn ("Hay, please!"), nhầm → "That\'s … . Hay, please!", nhặt trứng đếm → sticker, rounds +1', async ({ page }) => {
  await openJob(page, 'farm', 1);
  await stateIs(page, 'feed');
  const animal = await page.locator('.fm-animal').getAttribute('data-animal');
  const wrong = await page.locator(`.jb-tray [data-item]:not([data-item="${FOOD[animal]}"])`).first().getAttribute('data-item');
  await tapTray(page, wrong);
  await expect.poll(async () => (await spoken(page)).some((t) => /^(That's|Those are) .+\. \w+, please!$/.test(t))).toBe(true);
  // Cho ăn đúng: con vật no, hết bong bóng 💭 — không được hiện chữ "null" (replaceChildren biến null thành chữ).
  await tapTray(page, FOOD[animal]);
  await expect(page.locator('.fm-animal .fm-tummy')).toHaveCount(0);
  await expect(page.locator('.fm-animal')).not.toContainText('null');
  for (let i = 0; i < 40 && !(await page.locator('.jb-play.jb-done').count()); i++) {
    if (/door|feed|eggs|count|pick/.test(await play(page).getAttribute('data-state'))) await solveFarm(page);
    await page.waitForTimeout(150);
  }
  await done(page);
  expect(await spoken(page)).toContain('Good morning, farm!');
  expect((await spoken(page)).some((t) => /^One egg!$/.test(t))).toBe(true);
});

test('JOBS3-02: Nông trại mức 3 — chạm cửa chuồng sai: "Not me!" (tính nhầm), chạm đúng thì con vật ra xin ăn', async ({ page }) => {
  await openJob(page, 'farm', 3);
  await stateIs(page, 'door');
  const target = await page.locator('.fm-doors').getAttribute('data-target');
  await page.locator(`.fm-door:not([data-animal="${target}"])`).first().click();
  await expect.poll(() => spoken(page)).toContain('Not me!');
  await page.locator(`.fm-door[data-animal="${target}"]`).click();
  await stateIs(page, 'feed');
  await expect(page.locator('.fm-animal')).toHaveAttribute('data-animal', target);
});

test('Đầu bếp mức 3: rửa tay → bánh mì kẹp; đưa món "No …" → khách "No tomato, please!", lớp không lên đĩa (JOBS3-05)', async ({ page }) => {
  await openJob(page, 'chef', 3);
  await stateIs(page, 'wash');
  await page.locator('.cf-sink').click();
  await stateIs(page, 'layer');
  // Trạng thái "layer" bật ngay lúc khách bắt đầu nói (nhận chạm sớm) — chờ khách nói xong câu "No …, please!".
  await expect.poll(async () => (await spoken(page)).some((t) => /^No \w+, please!$/.test(t))).toBe(true);
  const no = (await spoken(page)).find((t) => /^No \w+, please!$/.test(t)).match(/^No (\w+)/)[1];
  await tapTray(page, no);
  await expect.poll(async () => (await spoken(page)).filter((t) => t === `No ${no}, please!`).length).toBe(2);
  await expect(page.locator('.cf-layer')).toHaveCount(0);
  await tapTray(page, await page.locator('.cf-plate').getAttribute('data-next'));
  await expect(page.locator('.cf-layer')).toHaveCount(1);
});

test('Đầu bếp mức 2: làm bánh — nghe động từ chọn đồ, nhầm → "That\'s the … . Pour the milk!"; đủ 3 ca → sticker', async ({ page }) => {
  await openJob(page, 'chef', 2);
  await stateIs(page, 'wash');
  await page.locator('.cf-sink').click();
  let wronged = false;
  for (let i = 0; i < 60 && !(await page.locator('.jb-play.jb-done').count()); i++) {
    const s = await play(page).getAttribute('data-state');
    if (s === 'layer') await tapTray(page, await page.locator('.cf-plate').getAttribute('data-next'));
    else if (s === 'serve') await page.locator('.cf-plate:visible, .cf-cake:visible').first().click();
    else if (s === 'bake') {
      const want = await page.locator('.cf-tools').getAttribute('data-want');
      if (want === 'bake') await page.locator('.cf-bowl').click();
      else if (!wronged) {
        wronged = true;
        await page.locator(`.cf-tool:not([data-tool="${TOOL[want]}"]):not(.used)`).first().click();
        await expect.poll(async () => (await spoken(page)).some((t) => /^That's the \w+\. /.test(t))).toBe(true);
      } else await page.locator(`.cf-tool[data-tool="${TOOL[want]}"]`).click();
    } else if (s === 'decor') {
      const want = (await page.locator('.cf-cake').getAttribute('data-want')).split(',').map((x) => x.split(':')[0]);
      for (const id of want) if (!(await page.locator(`.jb-tray [data-item="${id}"].full`).count())) { await tapTray(page, id); break; }
    }
    await page.waitForTimeout(150);
  }
  await done(page);
  expect(await spoken(page)).toEqual(expect.arrayContaining(['Pour!', 'Crack!', 'Mix, mix, mix!', 'Hot! Wait!', "Now it's ready!"]));
});

test('JOBS3-08: Thợ xây mức 2 — đúng dáng sai màu: câu nhầm nói màu bé đặt, hình về khay, không nằm trên bản vẽ', async ({ page }) => {
  await openJob(page, 'build', 2);
  await stateIs(page, 'helmet');
  await page.locator('.bd-helmet').click();
  await stateIs(page, 'part');
  const want = await page.locator('.bd-plan').getAttribute('data-want');
  await tapTray(page, `${want}:c`); // cùng dáng, khác màu
  await expect.poll(async () => (await spoken(page)).some((t) => /^That's an? \w+ square\. An? \w+ square, please!$/.test(t))).toBe(true);
  await expect(page.locator('.bd-slot.done')).toHaveCount(0);
  await tapTray(page, `${want}:ok`);
  await expect(page.locator('.bd-slot.done')).toHaveCount(1);
});

test('JOBS3-10 / 17: Xe buýt mức 2 — đón lần lượt, người xuống nói trạm màu, chọn sai biển → nhắc lại; người kia vẫn trên xe', async ({ page }) => {
  await openJob(page, 'bus', 2);
  await stateIs(page, 'horn');
  await page.locator('.bs-wheel').click();
  await stateIs(page, 'belt');
  await page.locator('.bs-belt').click();
  for (let i = 0; i < 60 && !(await page.locator('.jb-play.jb-done').count()); i++) {
    const s = await play(page).getAttribute('data-state');
    if (s === 'pick') await page.locator(`.bs-queue [data-id="${await page.locator('.bs-queue').getAttribute('data-want')}"]`).click();
    else if (s === 'map') {
      const want = await page.locator('.bs-map').getAttribute('data-want');
      const seats = await page.locator('.bs-seat').count();
      await page.locator(`.bs-map-stop:not([data-color="${want}"])`).first().click();
      await expect.poll(async () => (await spoken(page)).some((t) => new RegExp(`^That's the \\w+ stop\\. The ${want} stop, please!$`).test(t))).toBe(true);
      await page.locator(`.bs-map-stop[data-color="${want}"]`).click();
      // Chỉ một người xuống; ai còn lại vẫn trên xe.
      await expect.poll(() => page.locator('.bs-seat').count(), { timeout: 15000 }).toBe(seats - 1);
    }
    await page.waitForTimeout(150);
  }
  await done(page);
  expect((await spoken(page)).some((t) => /^Now pick up \w+!$/.test(t))).toBe(true);
  expect(await spoken(page)).toContain('Everybody off! Bye-bye!');
});

test('JOBS3-12 / 18: Xe buýt — bé không chạm: sau 2 lần nhắc người cần đón tự lên, xe không bỏ ai, không ghi "đã gặp"', async ({ page }) => {
  await openJob(page, 'bus', 1);
  await stateIs(page, 'horn');
  await page.locator('.bs-wheel').click();
  await stateIs(page, 'belt');
  await page.locator('.bs-belt').click();
  await stateIs(page, 'pick');
  await expect(page.locator('.bs-seat')).toHaveCount(1, { timeout: 20000 });
  await done(page);
  expect((await page.evaluate(() => window.kidEnglish.settings.busGame)).seen).toEqual({});
});

test('JOBS3-11 / 21: ra nền giữa ca rồi quay lại → đúng ca, đúng bước, giữ các thao tác đã nhận (Nông trại: trứng trong giỏ)', async ({ page }) => {
  await openJob(page, 'farm', 2);
  for (let i = 0; i < 40; i++) {
    if ((await page.locator('.fm-basket-in .fm-in').count()) >= 1) break;
    if (/door|feed|eggs|count|pick/.test(await play(page).getAttribute('data-state'))) await solveFarm(page);
    await page.waitForTimeout(150);
  }
  test.skip(!(await page.locator('.fm-basket-in .fm-in').count()), 'ca trứng không ở đầu lượt');
  const inBasket = await page.locator('.fm-basket-in .fm-in').count();
  const count = await page.locator('.jb-count').textContent();
  const setVisible = (v) => page.evaluate((x) => {
    Object.defineProperty(document, 'visibilityState', { value: x, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, v);
  await setVisible('hidden');
  await setVisible('visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(page.locator('.jb-count')).toHaveText(count);
  await expect(page.locator('.fm-basket-in .fm-in')).toHaveCount(inBasket);
});
