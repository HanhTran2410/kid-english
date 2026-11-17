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

// ---------- 0.73.0: 👷 Thợ xây — ca C sơn nhà (4.1), ca D xây tháp (4.2) ----------
/** Giải bước đang chờ của Thợ xây. */
async function solveBuild(page) {
  const s = await play(page).getAttribute('data-state');
  if (s === 'helmet') return page.locator('.bd-helmet').click();
  if (s === 'part') {
    for (const id of (await page.locator('.bd-plan').getAttribute('data-want')).split(',')) {
      const item = page.locator(`.jb-tray [data-item="${id}:ok"]`);
      if (await item.count()) return tapTray(page, `${id}:ok`);
    }
  }
  if (s === 'hole') return page.locator(`.bd-block[data-shape="${await page.locator('.bd-hole').getAttribute('data-shape')}"]`).click();
  if (s === 'paint') {
    if (!(await page.locator('.bd-brush.dipped').count()) ) {
      await page.locator(`.bd-bucket[data-color="${await page.locator('.bd-paints').getAttribute('data-want')}"]`).click();
      if (await page.locator('.bd-brush').isHidden()) return; // mức 1: cọ tự quét
    }
    return page.locator(`.bd-slot[data-id="${await page.locator('.bd-plan').getAttribute('data-want')}"]`).dispatchEvent('click');
  }
  if (s === 'tower') return page.locator(`.bd-pile[data-color="${await page.locator('.bd-tower').getAttribute('data-want')}"]`).click();
}
async function playBuildUntil(page, re) {
  for (let i = 0; i < 120; i++) {
    const s = await play(page).getAttribute('data-state');
    if (re.test(s)) return;
    if (/^(helmet|part|hole|paint|tower)$/.test(s)) await solveBuild(page);
    await page.waitForTimeout(150);
  }
  throw new Error(`không tới được ${re}`);
}

test('Thợ xây mức 1: A + B + C — sơn chính ngôi nhà vừa xây, phần đang sơn sáng viền, chọn thùng là cọ tự quét; hết lượt → sticker', async ({ page }) => {
  await openJob(page, 'build', 1, 0);
  await playBuildUntil(page, /^paint$/);
  await expect.poll(() => spoken(page)).toContain('Paint my house, please!');
  await expect(page.locator('.bd-slot')).toHaveCount(3);
  await expect(page.locator('.bd-slot.lit')).toHaveCount(1);
  await expect(page.locator('.bd-bucket')).toHaveCount(3);
  const want = await page.locator('.bd-paints').getAttribute('data-want');
  await expect.poll(() => spoken(page)).toContain(`${want[0].toUpperCase()}${want.slice(1)}, please!`);
  for (let i = 0; i < 40 && !(await page.locator('.jb-play.jb-done').count()); i++) {
    if ((await play(page).getAttribute('data-state')) === 'paint') await solveBuild(page);
    await page.waitForTimeout(150);
  }
  await done(page);
  expect(await spoken(page)).toContain('My beautiful house!');
});

test('Thợ xây mức 2 sơn nhà: chạm phần khi cọ chưa có màu — không tính nhầm (JOBS4-07); có màu rồi chạm sai phần → "That\'s the … . The …, please!", phần đó không đổi màu, cọ giữ màu (JOBS4-08); ra nền giữa ca C giữ phần đã sơn + cọ (JOBS4-09)', async ({ page }) => {
  await openJob(page, 'build', 2, 0);
  await playBuildUntil(page, /^paint$/);
  const target = await page.locator('.bd-plan').getAttribute('data-want');
  const color = await page.locator('.bd-paints').getAttribute('data-want');
  const other = page.locator(`.bd-slot:not([data-id="${target}"])`).first();
  const otherId = await other.getAttribute('data-id');
  const otherHtml = await other.innerHTML();
  await page.locator(`.bd-slot[data-id="${target}"]`).dispatchEvent('click');
  await page.waitForTimeout(300);
  expect((await spoken(page)).some((t) => /^That's the /.test(t))).toBe(false);
  await page.locator(`.bd-bucket[data-color="${color}"]`).click();
  await expect(page.locator('.bd-brush.dipped')).toHaveCount(1);
  await page.locator(`.bd-slot[data-id="${otherId}"]`).dispatchEvent('click');
  await expect.poll(async () => (await spoken(page)).some((t) => /^That's the \w+\. The \w+, please!$/.test(t))).toBe(true);
  expect(await page.locator(`.bd-slot[data-id="${otherId}"]`).innerHTML()).toBe(otherHtml);
  await expect(page.locator('.bd-brush.dipped')).toHaveCount(1);
  await page.locator(`.bd-slot[data-id="${target}"]`).dispatchEvent('click');
  await expect(page.locator('.bd-plan')).not.toHaveAttribute('data-want', target);
  const painted = await page.locator(`.bd-slot[data-id="${target}"]`).innerHTML();
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await stateIs(page, 'paint');
  expect(await page.locator(`.bd-slot[data-id="${target}"]`).innerHTML()).toBe(painted);
});

test('Thợ xây mức 3 xây tháp (lượt chẵn — JOBS4-19): mẫu lặp, đặt sai màu → chú đọc lại mẫu, tính nhầm, tháp giữ nguyên (JOBS4-18); đặt đúng 2 khối → cờ, "Hooray! A tall tower!"', async ({ page }) => {
  await openJob(page, 'build', 3, 1);
  await playBuildUntil(page, /^tower$/);
  await expect.poll(() => spoken(page)).toContain('What comes next?');
  const base = await page.locator('.bd-tblock').count();
  expect([3, 4]).toContain(base);
  const want = await page.locator('.bd-tower').getAttribute('data-want');
  await page.locator(`.bd-pile:not([data-color="${want}"])`).first().click();
  await expect.poll(async () => (await spoken(page)).filter((t) => t === 'What comes next?').length).toBeGreaterThan(1);
  await expect(page.locator('.bd-tblock')).toHaveCount(base);
  await solveBuild(page);
  await expect(page.locator('.bd-tblock')).toHaveCount(base + 1);
  await expect.poll(async () => (await spoken(page)).some((t) => new RegExp(`^${want[0].toUpperCase()}`).test(t) && t.split(', ').length === base + 1)).toBe(true);
  await page.waitForTimeout(200);
  await solveBuild(page);
  await expect(page.locator('.bd-tower.done')).toHaveCount(1);
  await expect.poll(() => spoken(page)).toContain('Hooray! A tall tower!');
});

// ---------- 0.74.0: 🚌 Xe buýt — thời tiết trên đường (5.2), đồ bỏ quên (5.1) ----------
const BUS_STATES = /^(horn|belt|map|green|pick|wcard|wbtn|lost)$/;
/** Giải bước đang chờ của Xe buýt; `skip`: các trạng thái để test tự xử lý. */
async function solveBus(page, skip = []) {
  const s = await play(page).getAttribute('data-state');
  if (skip.includes(s)) return s;
  if (s === 'horn') await page.locator('.bs-wheel').click();
  else if (s === 'belt') await page.locator('.bs-belt').click();
  else if (s === 'map') await page.locator(`.bs-map-stop[data-color="${await page.locator('.bs-map').getAttribute('data-want')}"]`).click();
  else if (s === 'green') await page.locator('.bs-pedal').click();
  else if (s === 'pick' || s === 'lost') {
    const id = await page.locator('.bs-queue').getAttribute('data-want');
    if (id) await page.locator(`.bs-queue [data-id="${id}"]`).click();
  } else if (s === 'wcard') await page.locator(`.bs-wcard[data-weather="${await page.locator('.bs-wcards').getAttribute('data-want')}"]`).click();
  else if (s === 'wbtn') await page.locator(`.bs-fix[data-fix="${await page.locator('.bs-dash').getAttribute('data-want')}"]`).click();
  return s;
}
async function playBusUntil(page, re, skip = []) {
  for (let i = 0; i < 80; i++) {
    const s = await play(page).getAttribute('data-state');
    if (re.test(s ?? '')) return;
    if (BUS_STATES.test(s ?? '')) {
      await solveBus(page, skip);
      await expect(play(page)).not.toHaveAttribute('data-state', s, { timeout: 15000 }).catch(() => {});
    } else await page.waitForTimeout(150);
  }
  throw new Error(`không tới ${re}`);
}

test('Xe buýt mức 1: thời tiết giữa trạm 1 và 2 — xe đỗ, nút đúng sáng, chạm nút khác không tính nhầm; không có đồ bỏ quên, hết lượt → sticker', async ({ page }) => {
  await openJob(page, 'bus', 1);
  await playBusUntil(page, /^wbtn$/);
  await expect(page.locator('.bs-play .jb-count')).toHaveText('2/3');
  await expect(page.locator('.bs-stage')).toHaveClass(/parked/);
  const want = await page.locator('.bs-dash').getAttribute('data-want');
  await expect(page.locator(`.bs-fix[data-fix="${want}"]`)).toHaveClass(/lit/);
  await expect(page.locator('.bs-fix.lit')).toHaveCount(1);
  expect(await page.locator('.bs-sky').getAttribute('data-weather')).toBeTruthy();
  await expect.poll(async () => (await spoken(page)).some((t) => /^It's \w+! (Wipers on|Sunglasses on|Windows up)!$/.test(t))).toBe(true);
  await page.locator(`.bs-fix:not([data-fix="${want}"])`).first().click();
  await page.waitForTimeout(300);
  expect((await spoken(page)).some((t) => t.startsWith("That's the"))).toBe(false);
  await stateIs(page, 'wbtn');
  await solveBus(page);
  await expect.poll(() => spoken(page)).toContain("Good job! Let's go!");
  await playBusUntil(page, /^done$/);
  await expect(page.locator('.jb-play.jb-done')).toHaveCount(1);
  expect((await spoken(page)).some((t) => /^Oh! /.test(t))).toBe(false);
  expect((await page.evaluate(() => window.kidEnglish.settings.busGame)).seen[want]).toBe(1);
});

test('Xe buýt mức 2: chạm nút sai → "That\'s the … . It\'s …! …!", tính nhầm, xe vẫn đỗ (JOBS4-20); đồ bỏ quên — người bỏ quên thiếu dấu hiệu, chạm người khác → "Not mine!" (JOBS4-10); trả đúng → "My …! Thank you!" → sticker', async ({ page }) => {
  await openJob(page, 'bus', 2);
  await playBusUntil(page, /^wbtn$/);
  const want = await page.locator('.bs-dash').getAttribute('data-want');
  await expect(page.locator('.bs-fix.lit')).toHaveCount(0);
  await page.locator(`.bs-fix:not([data-fix="${want}"])`).first().click();
  await expect.poll(async () => (await spoken(page)).some((t) => /^That's the \w+\. It's \w+! [\w ]+!$/.test(t))).toBe(true);
  await stateIs(page, 'wbtn');
  await expect(page.locator('.bs-stage')).toHaveClass(/parked/);
  await playBusUntil(page, /^lost$/);
  await expect(page.locator('.bs-queue .bs-person')).toHaveCount(2);
  const owner = await page.locator('.bs-queue').getAttribute('data-want');
  const item = await page.locator(`.bs-queue [data-id="${owner}"]`).getAttribute('data-without');
  expect(['glasses', 'hat', 'bag']).toContain(item);
  await expect(page.locator(`.bs-seat [data-item="${item}"]`)).toHaveCount(1);
  await expect(page.locator('.bs-queue [data-without=""]')).toHaveCount(1);
  await expect.poll(async () => (await spoken(page)).some((t) => t.startsWith('Oh! ') && [`Whose ${item} is this?`, `Whose ${item} are these?`].some((q) => t.endsWith(q)))).toBe(true);
  await page.locator(`.bs-queue .bs-person:not([data-id="${owner}"])`).click();
  await expect.poll(async () => (await spoken(page)).some((t) => t === 'Not mine!' || t === 'Goo-goo!')).toBe(true); // em bé: "Goo-goo!"
  await stateIs(page, 'lost');
  await solveBus(page);
  await expect.poll(() => spoken(page)).toContain(`My ${item}! Thank you!`);
  await done(page);
  expect((await page.evaluate(() => window.kidEnglish.settings.busGame)).seen[item]).toBeUndefined(); // nhầm rồi: không ghi
});

test('Xe buýt mức 3: thẻ thời tiết sai → "That\'s … . Look outside!", đúng rồi ra nền → xe vẫn đỗ, cảnh còn, ở bước chọn nút (JOBS4-21); đèn đỏ không ở chặng 1 → 2; đồ bỏ quên bé không chạm → người đúng tự lấy, không ghi (JOBS4-12)', async ({ page }) => {
  await openJob(page, 'bus', 3);
  await playBusUntil(page, /^wcard$/);
  expect((await spoken(page)).filter((t) => t === 'Red light! Stop!').length).toBe(0);
  await expect(page.locator('.bs-dash')).toBeHidden();
  const w = await page.locator('.bs-wcards').getAttribute('data-want');
  await page.locator(`.bs-wcard:not([data-weather="${w}"])`).first().click();
  await expect.poll(async () => (await spoken(page)).some((t) => /^That's \w+\. Look outside! What's the weather\?$/.test(t))).toBe(true);
  await page.locator(`.bs-wcard[data-weather="${w}"]`).click();
  await stateIs(page, 'wbtn');
  const asks = (await spoken(page)).filter((t) => t === "What's the weather?").length;
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await stateIs(page, 'wbtn');
  await expect(page.locator('.bs-stage')).toHaveClass(/parked/);
  await expect(page.locator('.bs-sky')).toHaveAttribute('data-weather', w);
  await expect(page.locator('.bs-wcards')).toBeHidden();
  expect((await spoken(page)).filter((t) => t === "What's the weather?").length).toBe(asks); // không hỏi thẻ lại
  await playBusUntil(page, /^lost$/);
  const items = await page.locator('.bs-seat .bs-item').evaluateAll((els) => els.map((e) => e.dataset.item));
  expect(items.length).toBeGreaterThanOrEqual(1);
  await expect.poll(async () => (await spoken(page)).some((t) => /^Oh! An? \w+! It's \w+'s \w+!$/.test(t))).toBe(true);
  await expect(page.locator('.jb-play.jb-done')).toHaveCount(1, { timeout: 60000 });
  expect((await spoken(page)).filter((t) => /^(My \w+|Baby's \w+)! Thank you!$/.test(t)).length).toBe(items.length);
  const seen = (await page.evaluate(() => window.kidEnglish.settings.busGame)).seen;
  for (const item of items) expect(seen[item]).toBeUndefined();
});

// ---------- 0.75.0: 🩺 Bác sĩ nhí — Dỗ bạn thú (SPEC-jobs4 mục 6) ----------
const HELP = { scared: 'c-teddy', sad: 'c-hug', sleepy: 'c-pillow', hungry: 'c-apple' };
const FEEL_EN = { scared: "I'm scared!", sad: "I'm sad.", sleepy: "I'm sleepy…", hungry: "I'm hungry!" };
const DOC_STATES = /^(wash|feel|comfort|touch|check|treat|measure|howmany|taller|point|glasses|sticker)$/;
/** Ca bệnh đầu lượt có việc dỗ (ca mới đo / khám mắt ở cuối lượt). */
const pinComfort = (page) => page.addInitScript(() => { window.__kidTest = { doctorNewAt: 2, doctorComfortAt: 0 }; });
const feelCount = (page, f) => page.evaluate(async (w) => (await window.kidEnglish.db.getAll('progress'))
  .filter((p) => p.word === w).reduce((a, p) => a + (p.practiceCount ?? 0), 0), f);
const trayIds = (page) => page.locator('.jb-tray [data-item]').evaluateAll((els) => els.map((e) => e.dataset.item));
/** Giải bước đang chờ của Bác sĩ nhí (đọc các thuộc tính chỉ để test). */
async function solveDoctor(page, level) {
  const s = await play(page).getAttribute('data-state');
  const pt = page.locator('.dr-patient');
  if (s === 'wash') {
    const items = await trayIds(page);
    const id = ['soap', 'rinse', 'towel', 'gloves'].find((x) => items.includes(x));
    if (id) await tapTray(page, id);
  } else if (s === 'feel') await page.locator(`.dr-feel[data-feel="${await pt.getAttribute('data-feel')}"]`).click();
  else if (s === 'comfort') await tapTray(page, HELP[await pt.getAttribute('data-feel')]);
  else if (['touch', 'check', 'treat'].includes(s)) {
    const id = await pt.getAttribute('data-case');
    const step = await page.evaluate(async ([caseId, lv, type]) => {
      const m = await import('/js/doctor.js');
      return m.stepsFor(m.CASE_BY_ID.get(caseId), lv).find((x) => x.type === type);
    }, [id, level, s]);
    if (s === 'touch') await page.locator(`.dr-spot[data-region="${step.target}"]`).first().click();
    else await tapTray(page, step.item);
  } else if (s === 'measure') {
    const heights = (await page.locator('.dr-measure').getAttribute('data-heights')).split(',').map(Number);
    const lit = await page.locator('.dr-block.lit').count();
    const w = lit >= heights[0] ? 1 : 0;
    await page.locator(`.dr-block[data-who="${w}"][data-i="${w ? lit - heights[0] : lit}"]`).click();
  } else if (s === 'howmany') await tapTray(page, `n-${(await page.locator('.dr-measure').getAttribute('data-heights')).split(',')[0]}`);
  else if (s === 'taller') {
    const [a, b] = (await page.locator('.dr-measure').getAttribute('data-heights')).split(',').map(Number);
    await page.locator(`.dr-measure-pet[data-who="${a > b ? 0 : 1}"]`).click();
  } else if (s === 'point') await page.locator(`.dr-eye-pic[data-word="${await page.locator('.dr-eyes').getAttribute('data-ask')}"]`).click();
  else if (s === 'glasses') await tapTray(page, 'glasses');
  else if (s === 'sticker') {
    const want = await pt.getAttribute('data-want');
    const ids = (await trayIds(page)).filter((x) => x.startsWith('st-'));
    await tapTray(page, want ? ids.find((x) => x.startsWith(`st-${want}`)) : ids[0]);
  }
  return s;
}
/** Dấu bước hiện tại (đổi sau mỗi thao tác đúng). */
const docKey = async (page) => [await play(page).getAttribute('data-state'), (await trayIds(page)).join(','),
  await page.locator('.dr-block.lit').count(), await page.locator('.dr-eyes').getAttribute('data-ask')].join('|');
async function playDoctorUntil(page, level, re) {
  for (let i = 0; i < 150; i++) {
    const s = await play(page).getAttribute('data-state');
    if (re.test(s ?? '')) return;
    if (DOC_STATES.test(s ?? '')) {
      const key = await docKey(page);
      await solveDoctor(page, level);
      await expect.poll(() => docKey(page), { timeout: 15000 }).not.toBe(key).catch(() => {});
    } else await page.waitForTimeout(150);
  }
  throw new Error(`không tới ${re}`);
}

test('Bác sĩ mức 1: ca đầu có việc dỗ — bạn thú sợ / buồn, đứng lệch khỏi giường, đồ đúng sáng; chạm đồ khác chỉ làm đồ đúng nhún, không tính nhầm; đưa đúng → "Thank you! I\'m happy now!" → ca bệnh như cũ; cả lượt một lần dỗ → sticker', async ({ page }) => {
  await pinComfort(page);
  await openJob(page, 'doctor', 1);
  await playDoctorUntil(page, 1, /^comfort$/);
  const pt = page.locator('.dr-patient');
  const feel = await pt.getAttribute('data-feel');
  expect(['scared', 'sad']).toContain(feel);
  await expect(pt).toHaveClass(/upset/);
  const want = HELP[feel];
  await expect(page.locator(`.jb-tray [data-item="${want}"]`)).toHaveClass(/hint/);
  await expect(page.locator('.jb-tray [data-item]')).toHaveCount(3);
  await expect.poll(async () => (await spoken(page)).includes({ scared: "Don't be scared! Here's a teddy!", sad: 'A big hug!' }[feel])).toBe(true);
  expect((await spoken(page)).includes(FEEL_EN[feel])).toBe(true);
  await tapTray(page, (await trayIds(page)).find((x) => x !== want));
  await page.waitForTimeout(400);
  await expect(play(page)).toHaveAttribute('data-state', 'comfort');
  expect((await spoken(page)).some((t) => /^That's an? /.test(t))).toBe(false);
  await tapTray(page, want);
  await stateIs(page, /^(touch|treat)$/);
  await expect(pt).not.toHaveClass(/upset/);
  expect(await pt.getAttribute('data-feel')).toBeNull();
  expect((await spoken(page)).filter((t) => t === "Thank you! I'm happy now!").length).toBe(1);
  expect(await feelCount(page, feel)).toBe(0); // mức 1: không ghi Feelings
  await playDoctorUntil(page, 1, /^done$/);
  await done(page);
  expect((await spoken(page)).filter((t) => t === "Thank you! I'm happy now!").length).toBe(1);
  expect((await page.evaluate(() => window.kidEnglish.settings.doctorGame)).seen[`feel:${feel}`]).toBe(1);
});

test('Bác sĩ mức 2: bạn nói cảm xúc, chạm đồ sai → "That\'s a … . I\'m …!", tính nhầm, ca bệnh chưa bắt đầu (JOBS4-22); đúng rồi ra nền → quay lại ở ca bệnh, không dỗ lại, Feelings không ghi (đã nhầm) (JOBS4-23)', async ({ page }) => {
  await pinComfort(page);
  await openJob(page, 'doctor', 2);
  await playDoctorUntil(page, 2, /^comfort$/);
  const pt = page.locator('.dr-patient');
  const feel = await pt.getAttribute('data-feel');
  const want = HELP[feel];
  await expect(page.locator(`.jb-tray [data-item="${want}"]`)).not.toHaveClass(/hint/);
  await tapTray(page, (await trayIds(page)).find((x) => x !== want));
  await expect.poll(async () => (await spoken(page)).some((t) => t.startsWith("That's a") && t.endsWith(FEEL_EN[feel]))).toBe(true);
  await expect(play(page)).toHaveAttribute('data-state', 'comfort');
  await tapTray(page, want);
  await stateIs(page, /^(touch|check|treat)$/);
  const st = await play(page).getAttribute('data-state');
  const caseId = await pt.getAttribute('data-case');
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await stateIs(page, st);
  await expect(pt).toHaveAttribute('data-case', caseId);
  await expect(pt).not.toHaveClass(/upset/);
  await page.waitForTimeout(500);
  expect((await spoken(page)).filter((t) => t === FEEL_EN[feel]).length).toBe(1);
  expect(await feelCount(page, feel)).toBe(0);
});

test('Bác sĩ mức 3: bạn không nói cảm xúc — "How does … feel?" + 3 thẻ mặt; thẻ sai → "That\'s … . Look at …!"; đúng → "… is …!", đồ hiện sau; ra nền ở bước đồ → không hỏi thẻ lại; đã nhầm thì không ghi Feelings', async ({ page }) => {
  await pinComfort(page);
  await openJob(page, 'doctor', 3);
  await playDoctorUntil(page, 3, /^feel$/);
  const pt = page.locator('.dr-patient');
  const feel = await pt.getAttribute('data-feel');
  const name = await page.evaluate(async (id) => (await import('/js/doctor.js')).PATIENT_BY_ID.get(id).name, await pt.getAttribute('data-patient'));
  await expect(page.locator('.dr-feel')).toHaveCount(3);
  await expect(page.locator('.jb-tray [data-item]')).toHaveCount(0);
  await expect.poll(async () => (await spoken(page)).includes(`How does ${name} feel?`)).toBe(true);
  expect((await spoken(page)).some((t) => /^I'm (scared|sad|sleepy|hungry)/.test(t))).toBe(false);
  await page.locator(`.dr-feel:not([data-feel="${feel}"])`).first().click();
  await expect.poll(async () => (await spoken(page)).some((t) => t.startsWith("That's ") && t.endsWith(`. Look at ${name}!`))).toBe(true);
  await page.locator(`.dr-feel[data-feel="${feel}"]`).click();
  await stateIs(page, 'comfort');
  await expect(page.locator('.jb-tray [data-item]')).toHaveCount(3);
  await expect(page.locator(`.dr-feel[data-feel="${feel}"]`)).toHaveClass(/picked/);
  await expect.poll(async () => (await spoken(page)).includes(`${name} is ${feel}!`)).toBe(true);
  const asks = (await spoken(page)).filter((t) => t === `How does ${name} feel?`).length;
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await stateIs(page, 'comfort');
  expect((await spoken(page)).filter((t) => t === `How does ${name} feel?`).length).toBe(asks); // không hỏi thẻ lại
  await tapTray(page, HELP[feel]);
  await stateIs(page, /^(touch|check|treat)$/);
  expect(await feelCount(page, feel)).toBe(0);
  await playDoctorUntil(page, 3, /^done$/);
  await done(page);
});

test('Bác sĩ mức 3: chọn đúng thẻ ngay lần đầu → ghi Feelings "đã gặp" một lần; 🧹 khám lại dỗ lại nhưng không ghi lần hai', async ({ page }) => {
  await pinComfort(page);
  await openJob(page, 'doctor', 3);
  await playDoctorUntil(page, 3, /^feel$/);
  const feel = await page.locator('.dr-patient').getAttribute('data-feel');
  await page.locator(`.dr-feel[data-feel="${feel}"]`).click();
  await stateIs(page, 'comfort');
  await expect.poll(() => feelCount(page, feel)).toBe(1);
  await tapTray(page, HELP[feel]);
  await stateIs(page, /^(touch|check|treat)$/);
  await page.getByRole('button', { name: 'Khám lại' }).click();
  await playDoctorUntil(page, 3, /^feel$/);
  await page.locator(`.dr-feel[data-feel="${feel}"]`).click();
  await stateIs(page, 'comfort');
  await page.waitForTimeout(300);
  expect(await feelCount(page, feel)).toBe(1);
});

// ---------- 0.76.0: 🛒 Bán hàng — Quầy đồ theo thời tiết (SPEC-jobs4 mục 7) ----------
const WEAR_OF = { rainy: 'umbrella', sunny: 'sunglasses', cold: 'scarf', hot: 'fan' };
const SHOP_STATES = /^(stock|order|coins|bag|give|blend-add|blend-ready|wcard)$/;
const shopWeather = (page) => page.locator('.sh-window').getAttribute('data-weather');
const wordCount = (page, w) => page.evaluate(async (x) => (await window.kidEnglish.db.getAll('progress'))
  .filter((p) => p.word === x).reduce((a, p) => a + (p.practiceCount ?? 0), 0), w);
/** Giải bước đang chờ của Bán hàng (đọc các thuộc tính chỉ để test). */
async function solveShop(page) {
  const s = await play(page).getAttribute('data-state');
  if (s === 'stock') {
    const item = page.locator('.jb-tray .dr-item').first();
    const g = await item.getAttribute('data-group');
    await item.click();
    if (await page.locator('.jb-tray .dr-item.picked').count()) await page.locator(`.sh-basket[data-group="${g}"]`).click();
  } else if (s === 'order' || s === 'blend-add') {
    const id = await page.locator('.sh-wish-item[data-done="false"]').first().getAttribute('data-food');
    await tapTray(page, id);
  } else if (s === 'blend-ready') await page.locator('.sh-blend-btn').click();
  else if (s === 'coins') { if (await page.locator('.sh-coin').count()) await page.locator('.sh-coin').first().click(); }
  else if (s === 'bag') await page.locator('.sh-bag').click();
  else if (s === 'give') await page.locator('.sh-customer').click();
  else if (s === 'wcard') await page.locator(`.sh-wcard[data-weather="${await shopWeather(page)}"]`).click();
  return s;
}
const shopKey = async (page) => [await play(page).getAttribute('data-state'), await page.locator('.jb-tray .dr-item').count(),
  await page.locator('.sh-wish-item[data-done="false"]').count(), await page.locator('.sh-coin').count(), await page.locator('.jb-count').textContent()].join('|');
async function playShopUntil(page, re) {
  for (let i = 0; i < 150; i++) {
    const s = await play(page).getAttribute('data-state');
    if (re.test(s ?? '')) return;
    if (SHOP_STATES.test(s ?? '')) {
      const key = await shopKey(page);
      await solveShop(page);
      await expect.poll(() => shopKey(page), { timeout: 15000 }).not.toBe(key).catch(() => {});
    } else await page.waitForTimeout(150);
  }
  throw new Error(`không tới ${re}`);
}
/** Chơi tới ca thời tiết (khách thứ hai) đang chờ bước `re`. */
async function toWeatherCase(page, re) {
  for (let i = 0; i < 150; i++) {
    const s = await play(page).getAttribute('data-state');
    if (re.test(s ?? '') && await page.locator('.sh-window').isVisible()) return;
    if (SHOP_STATES.test(s ?? '')) {
      const key = await shopKey(page);
      await solveShop(page);
      await expect.poll(() => shopKey(page), { timeout: 15000 }).not.toBe(key).catch(() => {});
    } else await page.waitForTimeout(150);
  }
  throw new Error('không tới ca thời tiết');
}

test('Bán hàng mức 1: khách thứ hai — cửa sổ thấy trời, "It\'s …! Can I have …, please?" + bong bóng món; kệ 2 đồ dùng; nhầm → "That\'s … . It\'s …!"; đưa túi → khách dùng đồ, "Thank you! Now I\'m ready!" → sticker', async ({ page }) => {
  await openJob(page, 'shop', 1);
  await toWeatherCase(page, /^order$/);
  await expect(page.locator('.jb-count')).toHaveText('2/3');
  const w = await shopWeather(page);
  const item = WEAR_OF[w];
  expect((await spoken(page)).some((t) => t.startsWith('Can I have '))).toBe(true); // ca đầu: khách đồ ăn
  await expect.poll(async () => (await spoken(page)).some((t) => t.startsWith(`It's ${w}! Can I have `))).toBe(true);
  await expect(page.locator(`.sh-wish-item[data-food="${item}"]`)).toBeVisible();
  const tray = await page.locator('.jb-tray [data-item]').evaluateAll((els) => els.map((e) => e.dataset.item));
  expect(tray).toHaveLength(2);
  expect(tray).toContain(item);
  await tapTray(page, tray.find((x) => x !== item));
  await expect.poll(async () => (await spoken(page)).some((t) => /^(That's an?|Those are) \w+\. It's \w+!$/.test(t) && t.endsWith(`It's ${w}!`))).toBe(true);
  await expect(play(page)).toHaveAttribute('data-state', 'order');
  await expect(page.locator('.jb-tray [data-item]')).toHaveCount(2);
  await tapTray(page, item);
  await playShopUntil(page, /^thanks$/);
  await expect(page.locator(`.sh-customer .sh-worn[data-item="${item}"]`)).toHaveCount(1);
  await expect.poll(async () => (await spoken(page)).includes("Thank you! Now I'm ready!")).toBe(true);
  await playShopUntil(page, /^done$/);
  await done(page);
  expect((await page.evaluate(() => window.kidEnglish.settings.shopGame)).seen[item]).toBe(1);
});

test('Bán hàng mức 2: khách chỉ nói thời tiết "It\'s …! Can you help me?", kệ 3 món không sáng; đưa sai → "That\'s … . It\'s …!", tính nhầm, món về kệ (JOBS4-24); đúng → trả 1 xu + đưa túi như ca thường; đã nhầm thì không ghi Weather', async ({ page }) => {
  await openJob(page, 'shop', 2);
  await toWeatherCase(page, /^order$/);
  const w = await shopWeather(page);
  const item = WEAR_OF[w];
  await expect.poll(async () => (await spoken(page)).includes(`It's ${w}! Can you help me?`)).toBe(true);
  await expect(page.locator('.sh-wish')).toBeHidden();
  const tray = await page.locator('.jb-tray [data-item]').evaluateAll((els) => els.map((e) => e.dataset.item));
  expect(tray).toHaveLength(3);
  await expect(page.locator('.jb-tray .dr-item.hint')).toHaveCount(0);
  const wrong = tray.find((x) => x !== item);
  await tapTray(page, wrong);
  await expect.poll(async () => (await spoken(page)).some((t) => t.endsWith(`. It's ${w}!`) && /^(That's|Those are)/.test(t))).toBe(true);
  await expect(page.locator(`.jb-tray [data-item="${wrong}"]`)).toHaveCount(1);
  await expect(play(page)).toHaveAttribute('data-state', 'order');
  await tapTray(page, item);
  await stateIs(page, 'coins');
  await expect(page.locator('.sh-coin')).toHaveCount(1);
  await playShopUntil(page, /^give$/);
  await page.locator('.sh-customer').click();
  await expect.poll(async () => (await spoken(page)).includes("Thank you! Now I'm ready!")).toBe(true);
  expect(await wordCount(page, w)).toBe(0);
});

test('Bán hàng mức 3: "Look outside! What\'s the weather?" + 3 thẻ, kệ chưa hiện; thẻ sai → "That\'s … . Look outside!"; đúng → thẻ dán lên cửa sổ, "Yes! It\'s …!" + "What do I need?"; chọn sai món chỉ nhắc bước 2 (JOBS4-35); ra nền → quay lại bước chọn món', async ({ page }) => {
  await openJob(page, 'shop', 3);
  await toWeatherCase(page, /^wcard$/);
  const w = await shopWeather(page);
  const item = WEAR_OF[w];
  await expect(page.locator('.sh-wcard')).toHaveCount(3);
  await expect(page.locator('.jb-tray [data-item]')).toHaveCount(0);
  await expect.poll(async () => (await spoken(page)).includes("Look outside! What's the weather?")).toBe(true);
  await page.locator(`.sh-wcard:not([data-weather="${w}"])`).first().click();
  await expect.poll(async () => (await spoken(page)).some((t) => /^That's \w+\. Look outside!$/.test(t))).toBe(true);
  await page.locator(`.sh-wcard[data-weather="${w}"]`).click();
  await stateIs(page, 'order');
  await expect(page.locator('.sh-window-card')).toHaveCount(1);
  await expect(page.locator('.sh-wcards')).toBeHidden();
  await expect(page.locator('.jb-tray [data-item]')).toHaveCount(4);
  await expect.poll(async () => (await spoken(page)).includes(`Yes! It's ${w}!`)).toBe(true);
  await expect.poll(async () => (await spoken(page)).includes('What do I need?')).toBe(true);
  const asks = (await spoken(page)).filter((t) => t === "Look outside! What's the weather?").length;
  await tapTray(page, (await page.locator('.jb-tray [data-item]').evaluateAll((els) => els.map((e) => e.dataset.item))).find((x) => x !== item));
  await expect.poll(async () => (await spoken(page)).some((t) => t.endsWith(`. It's ${w}!`) && /^(That's|Those are)/.test(t))).toBe(true);
  await expect(play(page)).toHaveAttribute('data-state', 'order');
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await stateIs(page, 'order');
  await expect(page.locator('.sh-wcards')).toBeHidden();
  await expect(page.locator('.sh-window-card')).toHaveCount(1);
  await expect(page.locator('.jb-tray [data-item]')).toHaveCount(4);
  expect((await spoken(page)).filter((t) => t === "Look outside! What's the weather?").length).toBe(asks);
  expect(await wordCount(page, w)).toBe(0);
  await tapTray(page, item);
  await playShopUntil(page, /^done$/);
  await done(page);
});

test('Bán hàng mức 3: chọn đúng thẻ ngay lần đầu → ghi từ Weather "đã gặp" một lần', async ({ page }) => {
  await openJob(page, 'shop', 3);
  await toWeatherCase(page, /^wcard$/);
  const w = await shopWeather(page);
  await page.locator(`.sh-wcard[data-weather="${w}"]`).click();
  await stateIs(page, 'order');
  await expect.poll(() => wordCount(page, w)).toBe(1);
});

// ---------- 0.77.0: 📮 Bưu tá — Chọn xe đưa thư (SPEC-jobs4 mục 8) ----------
async function openPost4(page, level, seen = {}) {
  await page.addInitScript(() => { window.__kidTest = { postParcelAt: 4, postVehicleAt: 1 }; });
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(([l, s]) => window.kidEnglish.setSetting('postGame', { level: l, rounds: 0, lock: null, seen: s }), [level, seen]);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.locator('.jb-job-post').click();
  await expect(play(page)).toBeVisible();
}
/** Dán 3 tem, đưa thư đầu → tới ca chọn xe (thư thứ hai). */
async function toFarCase(page) {
  for (let i = 0; i < 3; i++) {
    await stateIs(page, 'stamp');
    await expect(page.locator('.ps-envelope[data-stamped="true"]')).toHaveCount(i, { timeout: 15000 });
    await page.locator(`.jb-tray .dr-item[data-item="${await page.locator('.ps-desk').getAttribute('data-answer')}"]`).click();
  }
  await stateIs(page, 'deliver');
  const line = (await spoken(page)).filter((t) => /^This letter is for .+!$/.test(t)).at(-1);
  const what = line.match(/^This letter is for (.+)!$/)[1];
  let m = what.match(/^the (\w+) house$/);
  let house;
  if (m) house = page.locator(`.ps-house[data-color="${m[1]}"]`);
  else if ((m = what.match(/^house number (\w+)$/))) house = page.locator(`.ps-house[data-number="${['zero', 'one', 'two', 'three', 'four', 'five'].indexOf(m[1])}"]`);
  else {
    const id = await page.evaluate(async (name) => (await import('/js/doctor.js')).PATIENTS.find((p) => p.name === name).id, what);
    house = page.locator(`.ps-house[data-resident="${id}"]`);
  }
  await house.click();
  await stateIs(page, 'vehicle');
  await expect(page.locator('.ps-far')).toBeVisible();
  await expect(page.locator('.jb-count')).toHaveText('2/5');
}
const TEACH = { island: 'The sea! A boat!', city: 'The mountains! A plane!', station: 'The train tracks! A train!', park: 'The park! A bike!' };

test('Bưu tá mức 1: thư thứ hai đi xa — bản đồ, "Let\'s go by …!", xe đúng sáng, khay 2 xe; chạm xe khác → "That\'s a … . By …, please!", không tính nhầm; đúng → xe chở thư đi, câu dạy, "A letter for me! Thank you!" → thư 3; seen nơi nhận', async ({ page }) => {
  await openPost4(page, 1);
  await toFarCase(page);
  const far = page.locator('.ps-far');
  const place = await far.getAttribute('data-place');
  const v = await far.getAttribute('data-vehicle');
  await expect.poll(() => spoken(page)).toContain(`Let's go by ${v}!`);
  await expect(page.locator('.jb-tray [data-item]')).toHaveCount(2);
  await expect(page.locator(`.jb-tray .dr-item.hint[data-item="${v}"]`)).toHaveCount(1);
  const wrong = await page.locator(`.jb-tray [data-item]:not([data-item="${v}"])`).getAttribute('data-item');
  await tapTray(page, wrong);
  await expect.poll(() => spoken(page)).toContain(`That's a ${wrong}. By ${v}, please!`);
  await stateIs(page, 'vehicle');
  await expect(page.locator('.jb-tray [data-item]')).toHaveCount(2);
  await expect(page.locator('.ps-ride')).toBeHidden();
  await tapTray(page, v);
  await expect(page.locator(`.ps-ride[data-vehicle="${v}"]`)).toBeVisible();
  await expect.poll(() => spoken(page), { timeout: 15000 }).toContain(TEACH[place]);
  await expect.poll(() => spoken(page), { timeout: 15000 }).toContain('A letter for me! Thank you!');
  await expect(page.locator('.jb-count')).toHaveText('3/5', { timeout: 15000 });
  await stateIs(page, 'deliver');
  await expect(far).toBeHidden();
  expect((await page.evaluate(() => window.kidEnglish.settings.postGame)).seen[place]).toBe(1);
});

test('Bưu tá mức 2: "By …, please!", khay 3 xe không sáng; chọn sai → xe chạy tới mép rồi dừng, "That\'s a … . By …, please!", về khay; đã nhầm thì không ghi Vehicles', async ({ page }) => {
  await openPost4(page, 2);
  await toFarCase(page);
  const v = await page.locator('.ps-far').getAttribute('data-vehicle');
  await expect.poll(() => spoken(page)).toContain(`By ${v}, please!`);
  await expect(page.locator('.jb-tray [data-item]')).toHaveCount(3);
  await expect(page.locator('.jb-tray .dr-item.hint')).toHaveCount(0);
  const wrong = await page.locator(`.jb-tray [data-item]:not([data-item="${v}"])`).first().getAttribute('data-item');
  await tapTray(page, wrong);
  await expect(page.locator(`.ps-ride[data-vehicle="${wrong}"]`)).toBeVisible();
  await expect.poll(() => spoken(page)).toContain(`That's a ${wrong}. By ${v}, please!`);
  await stateIs(page, 'vehicle');
  await expect(page.locator(`.jb-tray [data-item="${wrong}"]`)).toBeVisible();
  await tapTray(page, v);
  await expect(page.locator('.jb-count')).toHaveText('3/5', { timeout: 15000 });
  expect(await wordCount(page, v)).toBe(0);
});

test('Bưu tá mức 3 (JOBS4-25): nơi nhận là đảo, chọn ô tô → ô tô dừng ở mép biển, "Oops! A car can\'t go on the sea!" + Bông chỉ biển "The sea! A boat!" rồi hỏi lại; ra nền → quay lại bước chọn xe; đúng → "By boat! Good idea!"', async ({ page }) => {
  await openPost4(page, 3, { island: 1 });
  await toFarCase(page);
  await expect(page.locator('.ps-far')).toHaveAttribute('data-place', 'island');
  const ask = 'This letter goes to the island! How do we go?';
  await expect.poll(() => spoken(page)).toContain(ask);
  expect(await spoken(page)).not.toContain('The sea! A boat!'); // nơi đã gặp: không dạy trước
  await expect(page.locator('.jb-tray [data-item]')).toHaveCount(4);
  await expect(page.locator('.jb-tray [data-item="plane"]')).toHaveCount(0);
  await tapTray(page, 'car');
  await expect(page.locator('.ps-ride[data-vehicle="car"]')).toBeVisible();
  await expect.poll(() => spoken(page)).toContain("Oops! A car can't go on the sea!");
  await expect(page.locator('.ps-point.show')).toHaveCount(1, { timeout: 15000 });
  await expect.poll(() => spoken(page)).toContain('The sea! A boat!');
  await expect.poll(async () => { const t = await spoken(page); const k = t.lastIndexOf('The sea! A boat!'); return k > t.indexOf("Oops! A car can't go on the sea!") && t.slice(k + 1).includes(ask); }).toBe(true);
  await stateIs(page, 'vehicle');
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await stateIs(page, 'vehicle');
  await expect(page.locator('.ps-far')).toHaveAttribute('data-place', 'island');
  await expect(page.locator('.jb-tray [data-item]')).toHaveCount(4);
  expect(await wordCount(page, 'boat')).toBe(0);
  await tapTray(page, 'boat');
  await expect.poll(() => spoken(page), { timeout: 15000 }).toContain('By boat! Good idea!');
  await expect(page.locator('.jb-count')).toHaveText('3/5', { timeout: 15000 });
  expect(await wordCount(page, 'boat')).toBe(0);
});

test('Bưu tá mức 3: nơi chưa gặp → Bông dạy trước rồi mới hỏi; chọn đúng ngay lần đầu → ghi từ Vehicles một lần', async ({ page }) => {
  await openPost4(page, 3);
  await toFarCase(page);
  const far = page.locator('.ps-far');
  const place = await far.getAttribute('data-place');
  const v = await far.getAttribute('data-vehicle');
  await expect.poll(async () => (await spoken(page)).some((t) => /^This letter goes to .+! How do we go\?$/.test(t))).toBe(true);
  const said = await spoken(page);
  expect(said.indexOf(TEACH[place])).toBeGreaterThan(-1);
  expect(said.indexOf(TEACH[place])).toBeLessThan(said.findIndex((t) => /How do we go\?$/.test(t)));
  await tapTray(page, v);
  await expect.poll(() => spoken(page), { timeout: 15000 }).toContain(`By ${v}! Good idea!`);
  await expect.poll(() => wordCount(page, v)).toBe(1);
});

// ---------- 0.78.0: 👩‍🏫 Cô giáo nhí — Bảng thời tiết (SPEC-jobs4 mục 9) ----------
async function openTeacher4(page, level) {
  await page.addInitScript(() => { window.__kidTest = { teacherActionsAt: 4 }; });
  await openJob(page, 'teacher', level);
}
/** Rung chuông + điểm danh → tới bảng thời tiết. */
async function toWeatherBoard(page) {
  await stateIs(page, 'bell');
  await page.locator('.tc-bell').click();
  for (let i = 0; i < 6; i++) {
    await stateIs(page, /^(roll|wcard)$/);
    if ((await play(page).getAttribute('data-state')) === 'wcard') break;
    const id = await page.locator('.tc-picture').getAttribute('data-word');
    await expect(page.locator(`.tc-pupil[data-pupil="${id}"]`)).toHaveAttribute('data-here', 'false');
    await page.locator(`.tc-pupil[data-pupil="${id}"]`).click();
    await expect(page.locator(`.tc-pupil[data-pupil="${id}"]`)).toHaveAttribute('data-here', 'true', { timeout: 15000 }).catch(() => {});
  }
  await stateIs(page, 'wcard');
  await expect(page.locator('.tc-window')).toBeVisible();
  await expect(page.locator('.tc-wboard')).toBeVisible();
  return page.locator('.tc-window').getAttribute('data-weather');
}
const its = (w) => `It's ${w}!`;
const countSaid = async (page, t) => (await spoken(page)).filter((x) => x === t).length;

test('Cô giáo mức 1 (JOBS4-26): sau điểm danh — cửa sổ thấy trời, "How\'s the weather today?" + Bông "It\'s …!", 2 thẻ, thẻ đúng sáng; chạm thẻ khác → thẻ đúng nhún, không tính nhầm; đúng → thẻ lên bảng, cả lớp "It\'s …!", "Let\'s start class!"; thẻ ở lại suốt lượt', async ({ page }) => {
  await openTeacher4(page, 1);
  const w = await toWeatherBoard(page);
  await expect.poll(() => spoken(page)).toContain("How's the weather today?");
  await expect.poll(() => spoken(page)).toContain(its(w));
  await expect(page.locator('.tc-wcard')).toHaveCount(2);
  await expect(page.locator(`.tc-wcard.hint[data-weather="${w}"]`)).toHaveCount(1);
  await expect(page.locator('.tc-wboard')).toHaveAttribute('data-filled', 'false');
  await page.locator(`.tc-wcard:not([data-weather="${w}"])`).click();
  await expect(page.locator(`.tc-wcard[data-weather="${w}"]`)).toHaveClass(/nudge/);
  expect((await spoken(page)).some((t) => /Look outside!$/.test(t))).toBe(false);
  await stateIs(page, 'wcard');
  await page.locator(`.tc-wcard[data-weather="${w}"]`).click();
  await expect.poll(() => spoken(page)).toContain("Let's start class!");
  const said = await spoken(page);
  expect(said[said.indexOf("Let's start class!") - 1]).toBe(its(w)); // cả lớp nói ngay trước
  await stateIs(page, /^(claim|judge|act)$/);
  await expect(page.locator('.tc-wboard')).toHaveAttribute('data-filled', 'true');
  await expect(page.locator('.tc-wslot-label')).toHaveText(w);
  await expect(page.locator('.tc-window')).toBeVisible();
  expect((await page.evaluate(() => window.kidEnglish.settings.teacherGame)).seen[w]).toBe(1);
});

test('Cô giáo mức 2: một bạn trong lớp nói "It\'s …!", 3 thẻ không sáng; thẻ sai → rơi về, "That\'s … . Look outside!", tính nhầm; ra nền → quay lại bước chọn thẻ; đã nhầm thì không ghi Weather', async ({ page }) => {
  await openTeacher4(page, 2);
  const w = await toWeatherBoard(page);
  await expect.poll(() => spoken(page)).toContain(its(w));
  await expect(page.locator('.tc-wcard')).toHaveCount(3);
  await expect(page.locator('.tc-wcard.hint')).toHaveCount(0);
  const wrong = await page.locator(`.tc-wcard:not([data-weather="${w}"])`).first().getAttribute('data-weather');
  await page.locator(`.tc-wcard[data-weather="${wrong}"]`).click();
  await expect.poll(() => spoken(page)).toContain(`That's ${wrong}. Look outside!`);
  await stateIs(page, 'wcard');
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await stateIs(page, 'wcard');
  await expect(page.locator('.tc-wcard')).toHaveCount(3);
  await expect(page.locator('.tc-window')).toHaveAttribute('data-weather', w);
  await page.locator(`.tc-wcard[data-weather="${w}"]`).click();
  await expect.poll(() => spoken(page)).toContain("Let's start class!");
  await expect(page.locator('.tc-wboard')).toHaveAttribute('data-filled', 'true');
  expect(await wordCount(page, w)).toBe(0);
});

test('Cô giáo mức 3: không ai nói thời tiết, 4 thẻ; đúng ngay lần đầu → cả lớp "It\'s …!", ghi từ Weather một lần', async ({ page }) => {
  await openTeacher4(page, 3);
  const w = await toWeatherBoard(page);
  await expect.poll(() => spoken(page)).toContain("How's the weather today?");
  await expect(page.locator('.tc-wcard')).toHaveCount(4);
  expect(await spoken(page)).not.toContain(its(w));
  await page.locator(`.tc-wcard[data-weather="${w}"]`).click();
  await expect.poll(() => countSaid(page, its(w))).toBe(1);
  await expect.poll(() => spoken(page)).toContain("Let's start class!");
  await expect.poll(() => wordCount(page, w)).toBe(1);
});

// ---------- 0.79.0: 👮 Cảnh sát — Điều khiển ngã tư (SPEC-jobs4 mục 10) ----------
async function openPolice4(page, level) {
  await page.addInitScript(() => { window.__kidTest = { policeJunctionAt: 0, policeTrafficAt: 2, policeCrossAt: 1 }; });
  await openJob(page, 'police', level);
  await stateIs(page, 'junction');
  await expect(page.locator('.pl-junction')).toBeVisible();
}
const jOrder = async (page) => (await page.locator('.pl-junction').getAttribute('data-order')).split(':');
const jName = async (page, id, level) => {
  const v = page.locator(`.pl-jv[data-id="${id}"]`);
  const type = await v.getAttribute('data-type');
  return level >= 2 && !(level >= 3 && type === 'bike') ? `${await v.getAttribute('data-color')} ${type}` : type;
};
/** Chạm đúng xe của lệnh hiện tại, chờ sang lệnh sau (hoặc hết ca). */
async function solveJunction(page) {
  const before = await page.locator('.pl-junction').getAttribute('data-order');
  const [, id] = before.split(':');
  await page.locator(`.pl-jv[data-id="${id}"]`).click();
  await expect.poll(async () => (await page.locator('.pl-junction').isVisible()) && (await page.locator('.pl-junction').getAttribute('data-order')) !== before
    && (await play(page).getAttribute('data-state')) === 'junction' || !(await page.locator('.pl-junction').isVisible()), { timeout: 15000 }).toBe(true);
}

test('Cảnh sát mức 1: ngã tư — "Let\'s help the cars!", 3 xe khác loại, xe được gọi nhún; chạm xe khác → bấm còi, "That\'s the … . The …, go!", không chạy; đúng → xe chạy ra khỏi màn, "Beep beep! Thank you!"; hết xe → "Good job, officer!"', async ({ page }) => {
  await openPolice4(page, 1);
  await expect.poll(() => spoken(page)).toContain("Let's help the cars!");
  await expect(page.locator('.pl-jv')).toHaveCount(3);
  expect((await page.locator('.pl-jv').evaluateAll((els) => els.map((e) => e.dataset.type))).sort()).toEqual(['bike', 'bus', 'car']);
  const [, id] = await jOrder(page);
  const want = await jName(page, id, 1);
  await expect.poll(() => spoken(page)).toContain(`The ${want}, go!`);
  await expect(page.locator(`.pl-jv.called[data-id="${id}"]`)).toHaveCount(1);
  const other = page.locator(`.pl-jv:not([data-id="${id}"])`).first();
  const otherName = await jName(page, await other.getAttribute('data-id'), 1);
  await other.click();
  await expect.poll(() => spoken(page)).toContain(`That's the ${otherName}. The ${want}, go!`);
  await expect(page.locator('.pl-jv[data-state="go"]')).toHaveCount(0);
  await stateIs(page, 'junction');
  await page.locator(`.pl-jv[data-id="${id}"]`).click();
  await expect(page.locator(`.pl-jv[data-id="${id}"]`)).toHaveAttribute('data-state', 'go');
  await expect.poll(() => spoken(page)).toContain('Beep beep! Thank you!');
  await stateIs(page, 'junction');
  await expect(page.locator('.pl-jv')).toHaveCount(2);
  await solveJunction(page);
  await solveJunction(page);
  await expect.poll(() => spoken(page), { timeout: 15000 }).toContain('Good job, officer!');
  await expect(page.locator('.jb-count')).toHaveText('2/3', { timeout: 15000 });
});

test('Cảnh sát mức 2 (JOBS4-27): 4 xe 2 loại × 2 màu, không nhún; gọi "The red car, go!" mà chạm xe cùng loại khác màu → bấm còi, không chạy, "That\'s the blue car. The red car, go!", tính nhầm; không có hai xe cùng chạy', async ({ page }) => {
  await openPolice4(page, 2);
  await expect(page.locator('.pl-jv')).toHaveCount(4);
  await expect(page.locator('.pl-jv.called')).toHaveCount(0);
  const [, id] = await jOrder(page);
  const want = await jName(page, id, 2);
  await expect.poll(() => spoken(page)).toContain(`The ${want}, go!`);
  const type = await page.locator(`.pl-jv[data-id="${id}"]`).getAttribute('data-type');
  const twin = page.locator(`.pl-jv[data-type="${type}"]:not([data-id="${id}"])`);
  const twinName = await jName(page, await twin.getAttribute('data-id'), 2);
  await twin.click();
  await expect(twin).toHaveClass(/honk/);
  await expect.poll(() => spoken(page)).toContain(`That's the ${twinName}. The ${want}, go!`);
  await expect(page.locator('.pl-jv[data-state="go"]')).toHaveCount(0);
  await page.locator(`.pl-jv[data-id="${id}"]`).click();
  await page.locator(`.pl-jv:not([data-id="${id}"])`).first().click({ force: true }); // chạm thêm lúc xe đang chạy: không nhận
  await expect(page.locator('.pl-jv[data-state="go"]')).toHaveCount(1);
  expect(await wordCount(page, type)).toBe(0);
  await stateIs(page, 'junction');
  await solveJunction(page);
  await solveJunction(page);
  await expect.poll(() => spoken(page), { timeout: 15000 }).toContain('Good job, officer!');
});

test('Cảnh sát mức 3 (JOBS4-36): Go → "The bike, stop!" — xe đạp đi tới; chạm xe đang chờ → "That\'s the … . The bike, stop!"; chạm xe đạp → dừng trước vạch, không tự chạy; ra nền → xe đạp vẫn dừng; "Now the …, go!"; cuối "The bike, go!" → xe đạp đi', async ({ page }) => {
  await openPolice4(page, 3);
  await expect(page.locator('.pl-jv')).toHaveCount(4);
  await expect(page.locator('.pl-jv[data-type="bike"]')).toHaveCount(0);
  const [, first] = await jOrder(page);
  const firstName = await jName(page, first, 3);
  await expect.poll(() => spoken(page)).toContain(`The ${firstName}, go!`);
  await page.locator(`.pl-jv[data-id="${first}"]`).click();
  await expect.poll(async () => (await jOrder(page))[0], { timeout: 15000 }).toBe('stop');
  await stateIs(page, 'junction');
  const bike = page.locator('.pl-jv[data-type="bike"]');
  await expect(bike).toHaveAttribute('data-state', 'coming');
  await expect.poll(() => spoken(page)).toContain('The bike, stop!');
  const waiting = page.locator('.pl-jv[data-state="waiting"]').first();
  const waitingName = await jName(page, await waiting.getAttribute('data-id'), 3);
  await waiting.click();
  await expect.poll(() => spoken(page)).toContain(`That's the ${waitingName}. The bike, stop!`);
  await expect(bike).toHaveAttribute('data-state', 'coming');
  await bike.click();
  await expect(bike).toHaveAttribute('data-state', 'stopped');
  await expect.poll(async () => (await jOrder(page))[0], { timeout: 15000 }).toBe('go');
  await stateIs(page, 'junction');
  const [, second] = await jOrder(page);
  const secondName = await jName(page, second, 3);
  await expect.poll(() => spoken(page)).toContain(`Now the ${secondName}, go!`);
  await bike.click();
  await expect.poll(() => spoken(page)).toContain(`That's the bike. Now the ${secondName}, go!`);
  await expect(bike).toHaveAttribute('data-state', 'stopped');
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await stateIs(page, 'junction');
  await expect(page.locator('.pl-jv[data-type="bike"]')).toHaveAttribute('data-state', 'stopped');
  expect(await page.locator('.pl-junction').getAttribute('data-order')).toBe(`go:${second}`);
  await page.locator(`.pl-jv[data-id="${second}"]`).click();
  await expect.poll(async () => (await jOrder(page)).join(':'), { timeout: 15000 }).toBe(`go:${await page.locator('.pl-jv[data-type="bike"]').getAttribute('data-id')}`);
  await expect.poll(() => spoken(page)).toContain('The bike, go!');
  await stateIs(page, 'junction');
  await page.locator('.pl-jv[data-type="bike"]').click();
  await expect(page.locator('.pl-jv[data-type="bike"]')).toHaveAttribute('data-state', 'go');
  await expect.poll(() => spoken(page), { timeout: 15000 }).toContain('Good job, officer!');
});

test('Cảnh sát mức 3: chạm đúng ngay lần đầu → ghi loại xe + màu (Vehicles, Colors)', async ({ page }) => {
  await openPolice4(page, 3);
  const [, first] = await jOrder(page);
  const v = page.locator(`.pl-jv[data-id="${first}"]`);
  const type = await v.getAttribute('data-type');
  const color = await v.getAttribute('data-color');
  await v.click();
  await expect.poll(() => wordCount(page, type)).toBe(1);
  await expect.poll(() => wordCount(page, color)).toBe(1);
});
