// 📮 Bưu tá (SPEC-jobs.md mục 4): "This letter is for the red house!" → bé chạm / kéo thư vào đúng nhà; 5 thư → sticker.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const saidSince = async (page, n, re) => (await spoken(page)).slice(n).some((t) => re.test(t));
const play = (page) => page.locator('.ps-play');

async function openPost(page, settings, { parcelAt = 4, stamp = true } = {}) {
  await fakeSpeech(page);
  await page.addInitScript((n) => { window.__kidTest = { postParcelAt: n }; }, parcelAt);
  await startApp(page);
  if (settings) await page.evaluate((s) => window.kidEnglish.setSetting('postGame', s), settings);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  // JOBS-01: chỉ hiện các nghề trong danh sách được bật.
  await expect(page.locator('.jb-job')).toHaveCount(await page.evaluate(async () => (await import('/js/screens/jobs.js')).JOBS.length));
  await page.getByRole('button', { name: 'Bưu tá' }).click();
  await expect(play(page)).toHaveAttribute('data-state', 'stamp', { timeout: 15000 });
  if (!stamp) return;
  await doStamps(page);
  await expect(play(page)).toHaveAttribute('data-state', 'deliver', { timeout: 15000 });
}
/** SPEC-jobs2 PO1: dán tem đúng (đọc `data-answer` của bàn) cho đủ 3 thư. */
async function doStamps(page) {
  for (let i = 0; i < 3; i++) {
    await expect(play(page)).toHaveAttribute('data-state', 'stamp', { timeout: 15000 });
    await expect(page.locator('.ps-envelope[data-stamped="true"]')).toHaveCount(i, { timeout: 15000 });
    await page.locator(`.jb-tray .dr-item[data-item="${await page.locator('.ps-desk').getAttribute('data-answer')}"]`).click();
  }
}
/** SPEC-jobs2 PO1: tới nhà — gõ cửa, (mức 3) trả lời câu đoán, mở hộp. */
async function doVisit(page) {
  await expect(play(page)).toHaveAttribute('data-state', 'knock', { timeout: 15000 });
  await page.locator('.ps-big-door').click();
  await expect(play(page)).toHaveAttribute('data-state', /guess|open/, { timeout: 15000 });
  if ((await play(page).getAttribute('data-state')) === 'guess') {
    const v = page.locator('.ps-visit');
    const yes = (await v.getAttribute('data-item')) === (await v.getAttribute('data-guess'));
    await page.locator('.ps-thumb').nth(yes ? 0 : 1).click();
    await expect(play(page)).toHaveAttribute('data-state', 'open', { timeout: 15000 });
  }
  await page.locator('.ps-box').click();
}

/** Nhà đúng của thư đang đưa (theo câu "This letter is for …!" vừa nói). */
async function targetHouse(page) {
  const line = (await spoken(page)).filter((t) => /^(This letter|A parcel) is for .+!$|^A parcel for .+!$/.test(t)).at(-1);
  const what = line.match(/^(?:This letter is|A parcel) for (.+)!$/)[1];
  let m = what.match(/^the (\w+) house$/);
  if (m) return page.locator(`.ps-house[data-color="${m[1]}"]`);
  m = what.match(/^house number (\w+)$/);
  if (m) return page.locator(`.ps-house[data-number="${['zero', 'one', 'two', 'three', 'four', 'five'].indexOf(m[1])}"]`);
  const id = await page.evaluate(async (name) => (await import('/js/doctor.js')).PATIENTS.find((p) => p.name === name).id, what);
  return page.locator(`.ps-house[data-resident="${id}"]`);
}
async function deliverOne(page, i) {
  await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/5`, { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'deliver', { timeout: 15000 });
  const isParcel = await page.locator('.jb-tray .dr-item[data-item="parcel"]').count();
  await (await targetHouse(page)).click();
  if (isParcel) await doVisit(page);
}

test('mức 1: 3 nhà khác màu; nhầm nhà → "Not for me! This is the … house.", nhà đúng nhún, vẫn thư đó; đúng → cảm ơn → thư 2', async ({ page }) => {
  await openPost(page);
  await expect(page.locator('.ps-house')).toHaveCount(3);
  expect(await spoken(page)).toContain('Take the letter to the house!');
  await expect(page.locator('.jb-count')).toHaveText('1/5');
  const target = await targetHouse(page);
  const color = await target.getAttribute('data-color');
  const wrong = page.locator(`.ps-house:not([data-color="${color}"])`).first();
  const wrongColor = await wrong.getAttribute('data-color');
  let n = (await spoken(page)).length;
  await wrong.click();
  await expect.poll(() => saidSince(page, n, new RegExp(`^Not for me! This is the ${wrongColor} house\\.$`))).toBe(true);
  await expect(page.locator(`.ps-house[data-color="${color}"].nudge`)).toHaveCount(1);
  await expect(page.locator('.jb-count')).toHaveText('1/5');
  n = (await spoken(page)).length;
  await target.click();
  await expect.poll(() => saidSince(page, n, /^A letter for me! Thank you!$/)).toBe(true);
  await expect(page.locator('.jb-count')).toHaveText('2/5', { timeout: 15000 });
});

test('5 thư → Hoan hô + sticker; đếm lượt; ghi "đã gặp" màu', async ({ page }) => {
  await openPost(page);
  const colors = [];
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/5`, { timeout: 15000 });
    await expect(play(page)).toHaveAttribute('data-state', 'deliver', { timeout: 15000 });
    colors.push(await (await targetHouse(page)).getAttribute('data-color'));
    await deliverOne(page, i);
  }
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
  expect((await page.evaluate(() => window.kidEnglish.settings.postGame)).rounds).toBe(1);
  const words = await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).map((p) => p.word));
  for (const c of colors) expect(words).toContain(c);
});

test('mức 2: 4 nhà cùng màu, theo số nhà; kéo thư vào nhà đúng cũng được; ra nền rồi quay lại vẫn thư đó', async ({ page }) => {
  await openPost(page, { level: 2, rounds: 0, lock: 2, seen: {} });
  await expect(page.locator('.ps-house')).toHaveCount(4);
  expect(new Set(await page.locator('.ps-house').evaluateAll((els) => els.map((e) => e.dataset.color))).size).toBe(1);
  await deliverOne(page, 0);
  await expect(page.locator('.jb-count')).toHaveText('2/5', { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'deliver', { timeout: 15000 });
  const setVisible = (s) => page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, s);
  const before = await (await targetHouse(page)).getAttribute('data-number');
  await setVisible('hidden');
  await setVisible('visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'deliver', { timeout: 15000 });
  await expect(page.locator('.jb-count')).toHaveText('2/5');
  expect(await (await targetHouse(page)).getAttribute('data-number')).toBe(before);
  // Kéo thư từ túi vào nhà đúng.
  const letter = await page.locator('.jb-tray .dr-item').boundingBox();
  const house = await (await targetHouse(page)).boundingBox();
  const n = (await spoken(page)).length;
  await page.mouse.move(letter.x + letter.width / 2, letter.y + letter.height / 2);
  await page.mouse.down();
  await page.mouse.move(house.x + house.width / 2, house.y + house.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => saidSince(page, n, /^A letter for me! Thank you!$/)).toBe(true);
  await expect(page.locator('.jb-count')).toHaveText('3/5', { timeout: 15000 });
});

test('mức 3: nhà có bạn thú ở cửa sổ, thư theo màu / số / tên; đưa hết 5 thư được', async ({ page }) => {
  await openPost(page, { level: 3, rounds: 0, lock: 3, seen: {} });
  await expect(page.locator('.ps-house .ps-window')).toHaveCount(4);
  const lines = new Set();
  for (let i = 0; i < 5; i++) {
    await deliverOne(page, i);
    lines.add((await spoken(page)).filter((t) => /^(This letter is for|A parcel for) /.test(t)).at(-1).replace(/^(?:This letter is for|A parcel for) (the \w+ house|house number \w+|\w+)!$/, (_, w) => (w.startsWith('the ') ? 'color' : w.startsWith('house') ? 'number' : 'name')));
  }
  expect(lines.size).toBe(3);
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
});

// ---------- SPEC-jobs2 PO1: dán tem + giao bưu kiện ----------
const setVisible = (page, s) => page.evaluate((v) => {
  Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}, s);
const stamped = (page) => page.locator('.ps-envelope[data-stamped="true"]');

test('PO1 mức 1: dán tem — 3 phong bì, 3 tem, tem nào cũng được, Bông nói tên tem ("A red star stamp!"); đủ 3 → "Ready to go!" → thư 1', async ({ page }) => {
  await openPost(page, null, { stamp: false });
  await expect(page.locator('.ps-envelope')).toHaveCount(3);
  await expect(page.locator('.jb-tray .dr-item')).toHaveCount(3);
  await expect.poll(() => spoken(page)).toContain("Let's put stamps on the letters!");
  await expect.poll(() => spoken(page)).toContain('Pick a stamp!');
  for (let i = 0; i < 3; i++) {
    await expect(play(page)).toHaveAttribute('data-state', 'stamp', { timeout: 15000 });
    await expect(stamped(page)).toHaveCount(i, { timeout: 15000 });
    const id = await page.locator('.jb-tray .dr-item').nth(i).getAttribute('data-item');
    const [, color, shape] = id.match(/^st-(\w+)-(\w+)$/);
    const n = (await spoken(page)).length;
    await page.locator(`.jb-tray .dr-item[data-item="${id}"]`).click();
    await expect.poll(() => saidSince(page, n, new RegExp(`^A ${color} ${shape} stamp!$`))).toBe(true);
  }
  await expect(stamped(page)).toHaveCount(3);
  await expect.poll(() => spoken(page)).toContain('Ready to go!');
  await expect(play(page)).toHaveAttribute('data-state', 'deliver', { timeout: 15000 });
  await expect(page.locator('.ps-desk')).toBeHidden();
  await expect(page.locator('.jb-count')).toHaveText('1/5');
});

test('PO1 mức 2: "A heart stamp, please!" — tem sai → "That\'s a … stamp. A … stamp, please!" (nhầm); đúng ngay lần đầu ghi đã gặp hình; ra nền giữa lúc dán → giữ thư đã dán', async ({ page }) => {
  await openPost(page, { level: 2, rounds: 0, lock: 2, seen: {} }, { stamp: false });
  await expect(page.locator('.jb-tray .dr-item')).toHaveCount(3);
  const answer = await page.locator('.ps-desk').getAttribute('data-answer');
  const shape = answer.split('-')[2];
  await expect.poll(() => spoken(page)).toContain(`A ${shape} stamp, please!`);
  const wrong = await page.locator(`.jb-tray .dr-item:not([data-item="${answer}"])`).first().getAttribute('data-item');
  const [, wc, ws] = wrong.match(/^st-(\w+)-(\w+)$/);
  let n = (await spoken(page)).length;
  await page.locator(`.jb-tray .dr-item[data-item="${wrong}"]`).click();
  await expect.poll(() => saidSince(page, n, new RegExp(`^That's a ${wc} ${ws} stamp\\. A ${shape} stamp, please!$`))).toBe(true);
  await page.locator(`.jb-tray .dr-item[data-item="${answer}"]`).click();
  await expect(stamped(page)).toHaveCount(1, { timeout: 15000 });
  // Thư 2: đúng ngay → ghi đã gặp hình.
  await expect(play(page)).toHaveAttribute('data-state', 'stamp', { timeout: 15000 });
  const answer2 = await page.locator('.ps-desk').getAttribute('data-answer');
  await page.locator(`.jb-tray .dr-item[data-item="${answer2}"]`).click();
  await expect.poll(() => page.evaluate(async (w) => (await window.kidEnglish.db.getAll('progress')).some((p) => p.word === w), answer2.split('-')[2])).toBe(true);
  await expect(stamped(page)).toHaveCount(2, { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'stamp', { timeout: 15000 });
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'stamp', { timeout: 15000 });
  await expect(stamped(page)).toHaveCount(2);
  n = (await spoken(page)).length;
  await page.locator(`.jb-tray .dr-item[data-item="${await page.locator('.ps-desk').getAttribute('data-answer')}"]`).click();
  await expect.poll(() => saidSince(page, n, /^Ready to go!$/), { timeout: 15000 }).toBe(true);
});

test('PO1 mức 3: 4 tem, "A blue circle stamp, please!" (hình + màu)', async ({ page }) => {
  await openPost(page, { level: 3, rounds: 0, lock: 3, seen: {} }, { stamp: false });
  await expect(page.locator('.jb-tray .dr-item')).toHaveCount(4);
  const [, color, shape] = (await page.locator('.ps-desk').getAttribute('data-answer')).match(/^st-(\w+)-(\w+)$/);
  await expect.poll(() => spoken(page)).toContain(`A ${color} ${shape} stamp, please!`);
  await doStamps(page);
  await expect(play(page)).toHaveAttribute('data-state', 'deliver', { timeout: 15000 });
});

test('PO1 bưu kiện mức 1: đồ trong hộp là từ bé đã học ("an egg"); "A parcel for …!" → nhà đúng → "Knock on the door!"; chạm hộp trước: cửa nhún; gõ cửa → "Knock, knock!" → "A parcel! What\'s inside?" → mở hộp → "It\'s an egg!" → "An egg! Thank you!"', async ({ page }) => {
  await fakeSpeech(page);
  await page.addInitScript(() => { window.__kidTest = { postParcelAt: 0 }; });
  await startApp(page);
  await page.evaluate(() => window.kidEnglish.db.put('progress', { word: 'egg', emoji: '🥚', mastery: 1, practiceCount: 2, lastPracticedAt: Date.now(), lastVoiceDay: null }));
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Bưu tá' }).click();
  await doStamps(page);
  await expect(play(page)).toHaveAttribute('data-state', 'deliver', { timeout: 15000 });
  await expect(page.locator('.jb-tray .dr-item[data-item="parcel"]')).toHaveCount(1);
  await expect.poll(async () => (await spoken(page)).some((t) => /^A parcel for the \w+ house!$/.test(t))).toBe(true);
  await (await targetHouse(page)).click();
  await expect(play(page)).toHaveAttribute('data-state', 'knock', { timeout: 15000 });
  await expect(page.locator('.ps-visit')).toBeVisible();
  await expect(page.locator('.ps-visit')).toHaveAttribute('data-item', 'egg');
  await expect.poll(() => spoken(page)).toContain('Knock on the door!');
  await page.locator('.ps-box').click();
  await expect(page.locator('.ps-big-door')).toHaveClass(/nudge/);
  await expect(play(page)).toHaveAttribute('data-state', 'knock');
  await page.locator('.ps-big-door').click();
  await expect.poll(() => spoken(page)).toContain('Knock, knock!');
  await expect.poll(() => spoken(page)).toContain("A parcel! What's inside?");
  await expect(play(page)).toHaveAttribute('data-state', 'open', { timeout: 15000 });
  const n = (await spoken(page)).length;
  await page.locator('.ps-box').click();
  await expect(page.locator('.ps-item')).toBeVisible();
  await expect.poll(() => saidSince(page, n, /^It's an egg!$/)).toBe(true);
  await expect.poll(() => saidSince(page, n, /^An egg! Thank you!$/), { timeout: 15000 }).toBe(true);
  await expect(page.locator('.jb-count')).toHaveText('2/5', { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'deliver', { timeout: 15000 });
  await expect(page.locator('.ps-visit')).toBeHidden();
});

test('PO1 bưu kiện mức 3: bạn thú đoán "Is it a …?" → 👍 / 👎 sai → "Look at the picture on the box!" (nhầm); ra nền giữa lúc đoán → vẫn bước đoán; đúng → "Yes! / No? Let\'s look!" → mở hộp', async ({ page }) => {
  await openPost(page, { level: 3, rounds: 0, lock: 3, seen: {} }, { parcelAt: 0 });
  await (await targetHouse(page)).click();
  await expect(play(page)).toHaveAttribute('data-state', 'knock', { timeout: 15000 });
  await page.locator('.ps-big-door').click();
  await expect(play(page)).toHaveAttribute('data-state', 'guess', { timeout: 15000 });
  const v = page.locator('.ps-visit');
  const guess = await v.getAttribute('data-guess');
  const yes = (await v.getAttribute('data-item')) === guess;
  await expect.poll(async () => (await spoken(page)).some((t) => new RegExp(`^Is it an? ${guess}\\?$`).test(t))).toBe(true);
  let n = (await spoken(page)).length;
  await page.locator('.ps-thumb').nth(yes ? 1 : 0).click();
  await expect.poll(() => saidSince(page, n, /^Look at the picture on the box!$/)).toBe(true);
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'guess', { timeout: 15000 });
  n = (await spoken(page)).length;
  await page.locator('.ps-thumb').nth(yes ? 0 : 1).click();
  await expect.poll(() => saidSince(page, n, yes ? /^Yes! Let's look!$/ : /^No\? Let's look!$/)).toBe(true);
  await expect(play(page)).toHaveAttribute('data-state', 'open', { timeout: 15000 });
  await page.locator('.ps-box').click();
  await expect(page.locator('.jb-count')).toHaveText('2/5', { timeout: 15000 });
});
