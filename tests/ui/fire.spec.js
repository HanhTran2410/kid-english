// 🚒 Lính cứu hỏa (SPEC-jobs.md mục 7): chạm từng ngọn lửa, Bông đếm; mức 2 hỏi số + ca cây; mức 3 lửa theo chỗ.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const saidSince = async (page, n, re) => (await spoken(page)).slice(n).some((t) => re.test(t));
const play = (page) => page.locator('.fr-play');
const ACTIVE = /spray|count|tree|knock|open|safety|dial/;
const setVisible = (page, v) => page.evaluate((state) => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}, v);

async function enterFire(page, settings) {
  await fakeSpeech(page);
  await startApp(page);
  if (settings) await page.evaluate((s) => window.kidEnglish.setSetting('fireGame', s), settings);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Lính cứu hỏa' }).click();
  await expect(play(page)).toHaveAttribute('data-state', 'dress', { timeout: 15000 });
}
/** Mặc đủ 3 món (đúng món Bông gọi nếu có). */
async function dressUp(page) {
  await expect(play(page)).toHaveAttribute('data-state', 'dress', { timeout: 15000 });
  for (;;) {
    const worn = await page.locator('.ff-dress .ff-wear.ff-on').count();
    const want = await page.locator('.fr-scene').getAttribute('data-want');
    await page.locator(want ? `.jb-tray [data-item="${want}"]` : '.jb-tray [data-item="helmet"], .jb-tray [data-item="jacket"], .jb-tray [data-item="boots"]').first().click();
    if (worn >= 2) return; // món cuối: sang phố ngay
    await expect(page.locator('.ff-dress .ff-wear.ff-on')).toHaveCount(worn + 1, { timeout: 15000 });
    await expect(play(page)).toHaveAttribute('data-state', 'dress', { timeout: 15000 });
  }
}
/** Đang ở phố: chạm đúng nhà. */
async function arrive(page) {
  await expect(play(page)).toHaveAttribute('data-state', /drive|tree/, { timeout: 15000 });
  if ((await play(page).getAttribute('data-state')) !== 'drive') return;
  const color = await page.locator('.fr-street').getAttribute('data-color');
  await page.locator(`.fr-home[data-color="${color}"]`).click();
}
/** Ca An toàn: trả lời đúng từng đồ, mức 3 bấm 1-1-4. */
async function safetyCase(page) {
  for (let i = 0; i < 20; i++) {
    await expect(play(page)).toHaveAttribute('data-state', /safety|dial|busy|done|enter/, { timeout: 15000 });
    const st = await play(page).getAttribute('data-state');
    if (st === 'done' || (await page.locator('.prize-sticker').isVisible())) return;
    if (st === 'safety') {
      const hot = await page.locator('.fr-safety').getAttribute('data-hot');
      const n = await page.locator('.fr-yn.right').count();
      await page.locator(`.fr-yn[data-answer="${hot === 'true' ? 'no' : 'yes'}"]`).click();
      await expect(page.locator('.fr-yn.right')).toHaveCount(n + 1, { timeout: 15000 }).catch(() => {});
    } else if (st === 'dial') {
      const next = await page.locator('.fr-safety').getAttribute('data-next');
      if (next) await page.locator(`.fr-key[data-n="${next}"]`).click();
    }
    await page.waitForTimeout(200);
  }
}
/** Ca cứu trong nhà: gõ cửa rồi mở cửa. */
async function rescueHouse(page) {
  if ((await play(page).getAttribute('data-state')) === 'knock') {
    await page.locator('.fr-door').click();
    await expect(play(page)).toHaveAttribute('data-state', 'open', { timeout: 15000 });
  }
  await page.locator('.fr-door').click();
}
/** Đầu ca: (lái xe tới nhà nếu đang ở phố) rồi chờ tới bước làm việc. */
async function ready(page) {
  await expect(play(page)).toHaveAttribute('data-state', /drive|spray|count|tree|knock|open|safety|dial/, { timeout: 15000 });
  if ((await play(page).getAttribute('data-state')) === 'drive') await arrive(page);
  await expect(play(page)).toHaveAttribute('data-state', ACTIVE, { timeout: 15000 });
}
async function openFire(page, settings) {
  await enterFire(page, settings);
  await dressUp(page);
  await arrive(page);
  await expect(play(page)).toHaveAttribute('data-state', ACTIVE, { timeout: 15000 });
}
/** Làm xong ca đang mở: (lái xe tới nhà,) dập lửa (theo thứ tự gọi nếu có), chọn đúng số, hoặc dựng thang. */
async function doCase(page, i) {
  await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', /drive|spray|count|tree|knock|open|safety|dial/, { timeout: 15000 });
  if ((await play(page).getAttribute('data-state')) === 'drive') await arrive(page);
  await expect(play(page)).toHaveAttribute('data-state', ACTIVE, { timeout: 15000 });
  if ((await page.locator('.fr-scene').getAttribute('data-kind')) === 'safety') {
    await safetyCase(page);
    return;
  }
  if ((await page.locator('.fr-scene').getAttribute('data-kind')) === 'tree') {
    await page.locator('.jb-tray .dr-item').click();
    return;
  }
  if ((await page.locator('.fr-scene').getAttribute('data-kind')) === 'house') {
    await rescueHouse(page);
    return;
  }
  const n = await page.locator('.fr-fire').count();
  for (let k = 0; k < n; k++) {
    const want = await page.locator('.fr-scene').getAttribute('data-target');
    await page.locator(want ? `.fr-fire[data-id="${want}"]` : '.fr-fire:not(.out)').first().click();
    // Ngọn cuối: ca có thể đã sang ca sau ngay (chế độ chạy nhanh) — không đếm trên cảnh cũ.
    if (k < n - 1) await expect(page.locator('.fr-fire.out')).toHaveCount(k + 1, { timeout: 15000 });
  }
  const level = (await page.evaluate(() => window.kidEnglish.settings.fireGame))?.level ?? 1;
  if (level === 2) {
    await expect(play(page)).toHaveAttribute('data-state', 'count', { timeout: 15000 });
    await page.locator(`.fr-number[data-n="${n}"]`).click();
  }
}

test('mức 1: chạm từng ngọn lửa → Bông đếm; JOBS-07 — hết lửa câu đúng số ít / nhiều; chạm đúp một ngọn chỉ đếm một lần; bạn thú cảm ơn → ca 2', async ({ page }) => {
  await openFire(page);
  await expect.poll(() => spoken(page)).toContain("A little fire! Let's put it out!");
  const n = await page.locator('.fr-fire').count();
  expect(n >= 1 && n <= 3).toBe(true);
  const before = (await spoken(page)).length;
  await page.locator('.fr-fire').first().dblclick();
  await expect.poll(() => saidSince(page, before, /^One!$/)).toBe(true);
  // Ca chỉ có 1 ngọn: chạm xong là sang ca sau ngay (chế độ chạy nhanh) — không kiểm ngọn đã tắt trên cảnh cũ.
  if (n > 1) await expect(page.locator('.fr-fire.out')).toHaveCount(1);
  for (let k = 1; k < n; k++) {
    await page.locator('.fr-fire:not(.out)').first().click();
    await expect(page.locator('.fr-fire.out')).toHaveCount(k + 1, { timeout: 15000 });
  }
  await expect.poll(() => saidSince(page, before, new RegExp(`^${['One fire', 'Two fires', 'Three fires'][n - 1]}! All gone!$`)), { timeout: 15000 }).toBe(true);
  expect(await saidSince(page, before, new RegExp(`^${['Two', 'Three', 'Four'][n - 1]}!$`))).toBe(false);
  await expect.poll(() => saidSince(page, before, /^Thank you, firefighter!$/), { timeout: 15000 }).toBe(true);
  await expect(page.locator('.jb-count')).toHaveText('2/3', { timeout: 15000 });
});

test('3 ca → Hoan hô + sticker; đếm lượt', async ({ page }) => {
  await openFire(page);
  for (let i = 0; i < 3; i++) await doCase(page, i);
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.done-btn')).toBeInViewport({ ratio: 1, timeout: 15000 });
  expect((await page.evaluate(() => window.kidEnglish.settings.fireGame)).rounds).toBe(1);
});

test('mức 2: hết lửa hỏi "How many fires?" — 3 thẻ số, chọn nhầm → đếm lại, chọn đúng → "Yes! N fires!"; có một ca cứu bạn trên cây bằng thang', async ({ page }) => {
  await openFire(page, { level: 2, rounds: 0, lock: 2, seen: { house: 9 } });
  let sawTree = false;
  let checkedWrong = false;
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
    await ready(page);
    if ((await page.locator('.fr-scene').getAttribute('data-kind')) === 'safety') {
      await doCase(page, i);
      continue;
    }
    if ((await page.locator('.fr-scene').getAttribute('data-kind')) === 'tree') {
      sawTree = true;
      const n = (await spoken(page)).length;
      await page.locator('.jb-tray .dr-item').click();
      await expect.poll(() => saidSince(page, n, /^Thank you! I am down!$/), { timeout: 15000 }).toBe(true);
      continue;
    }
    const n = await page.locator('.fr-fire').count();
    for (let k = 0; k < n; k++) {
      await page.locator('.fr-fire:not(.out)').first().click();
      await expect(page.locator('.fr-fire.out')).toHaveCount(k + 1, { timeout: 15000 });
    }
    await expect(play(page)).toHaveAttribute('data-state', 'count', { timeout: 15000 });
    await expect(page.locator('.fr-number')).toHaveCount(3);
    if (!checkedWrong) {
      checkedWrong = true;
      const before = (await spoken(page)).length;
      await page.locator(`.fr-number:not([data-n="${n}"])`).first().click();
      await expect.poll(() => saidSince(page, before, /^That's \w+\. Let's count again!$/)).toBe(true);
    }
    const before = (await spoken(page)).length;
    await page.locator(`.fr-number[data-n="${n}"]`).click();
    await expect.poll(() => saidSince(page, before, /^Yes! \w+ fires?!$/)).toBe(true);
  }
  expect(sawTree).toBe(true);
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
});

test('mức 3: Bông gọi chỗ lửa; chạm ngọn khác → "The fire … first!"; dập đúng thứ tự thì xong', async ({ page }) => {
  await openFire(page, { level: 3, rounds: 0, lock: 3, seen: {} });
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
    await ready(page);
    if ((await page.locator('.fr-scene').getAttribute('data-kind')) === 'fire') {
      await expect.poll(async () => (await spoken(page)).some((t) => /^The fire is (on the roof|in the window|by the door)!$/.test(t))).toBe(true);
      const want = await page.locator('.fr-scene').getAttribute('data-target');
      const n = (await spoken(page)).length;
      // Chạm khi Bông đang nói thì không tính — chạm lại tới khi Bông nhắc.
      await expect(async () => {
        await page.locator(`.fr-fire:not([data-id="${want}"])`).first().click();
        expect(await saidSince(page, n, /^The fire (on the roof|in the window|by the door) first!$/)).toBe(true);
      }).toPass({ timeout: 15000 });
      await expect(page.locator('.fr-fire.out')).toHaveCount(0);
    }
    await doCase(page, i);
  }
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
});

test('chạm lính cứu hỏa (vòi): lính cứu hỏa giật, tia nước bắn tới ngọn lửa và lửa tắt, Bông đếm; mức 3 phun đúng ngọn Bông gọi', async ({ page }) => {
  await openFire(page, { level: 3, rounds: 0, lock: 3, seen: {} });
  await expect(page.locator('.jb-count')).toHaveText('1/3', { timeout: 15000 });
  if ((await page.locator('.fr-scene').getAttribute('data-kind')) !== 'fire') return; // ca cây: phần khác đã kiểm
  const want = await page.locator('.fr-scene').getAttribute('data-target');
  const before = (await spoken(page)).length;
  // Tia nước chỉ hiện thoáng qua (chế độ chạy nhanh): ghi lại lúc nó được thêm vào.
  await page.evaluate(() => {
    window.__jets = 0;
    new MutationObserver((list) => list.forEach((m) => m.addedNodes.forEach((n) => { if (n.classList?.contains('fr-jet')) window.__jets += 1; })))
      .observe(document.querySelector('.fr-stage'), { childList: true });
  });
  await page.getByRole('button', { name: 'Vòi phun nước' }).click();
  await expect(page.locator('.fr-hose')).toHaveClass(/spraying/);
  await expect.poll(() => page.evaluate(() => window.__jets)).toBe(1);
  await expect(page.locator(`.fr-fire[data-id="${want}"]`)).toHaveClass(/out/, { timeout: 15000 });
  await expect.poll(() => saidSince(page, before, /^One!$/)).toBe(true);
  expect(await saidSince(page, before, /first!$/)).toBe(false);
});

test('chạm ngọn lửa ngay lúc Bông đang báo cháy: lửa vẫn tắt (không bị bỏ qua)', async ({ page }) => {
  await fakeSpeech(page);
  // Câu báo cháy nói lâu (3 giây) như giọng thật — bé chạm trong lúc Bông còn đang nói.
  await page.addInitScript(() => {
    const synth = window.speechSynthesis;
    const speak = synth.speak.bind(synth);
    synth.speak = (u) => {
      if (!/little fire/.test(u.text)) return speak(u);
      window.__spoken.push(u.text);
      setTimeout(() => u.onend?.(), 3000);
    };
  });
  await startApp(page);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Lính cứu hỏa' }).click();
  await dressUp(page);
  await arrive(page);
  await expect.poll(() => spoken(page)).toContain("A little fire! Let's put it out!");
  await page.locator('.fr-fire').first().click();
  await expect(page.locator('.fr-fire.out, .jb-count:text("2/3")').first()).toBeVisible({ timeout: 2500 });
});

for (const [w, hgt] of [[390, 760], [844, 390], [1024, 600], [1280, 720], [768, 1024]]) {
  test(`bạn thú không che ngọn lửa (${w}×${hgt}): điểm giữa mọi ngọn lửa bấm trúng chính ngọn lửa đó`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: hgt });
    await openFire(page, { level: 2, rounds: 0, lock: 2, seen: {} });
    for (let i = 0; i < 3; i++) {
      await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
      await ready(page);
      if ((await page.locator('.fr-scene').getAttribute('data-kind')) === 'fire') {
        const hits = await page.locator('.fr-fire').evaluateAll((els) => els.map((el) => {
          const r = el.getBoundingClientRect();
          return [el.dataset.spot, document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('.fr-fire') === el];
        }));
        expect(hits.filter(([, ok]) => !ok)).toEqual([]);
      }
      await doCase(page, i);
    }
  });
}

// ---------- SPEC-fire2 FF1: mặc đồ + lái xe tới đúng nhà ----------
test('FF1 mức 1: mặc đồ thứ tự tùy bé ("Boots on!"… "I\'m ready! Let\'s go!"); phố 3 nhà khác màu, nhà đúng có khói; nhầm nhà → "That\'s the … house"; đúng → xe tới, nhà của ca cùng màu; ghi màu đã gặp', async ({ page }) => {
  await enterFire(page, { level: 1, rounds: 0, lock: 1, seen: {} });
  await expect.poll(() => spoken(page)).toContain('Put on your firefighter clothes!');
  await expect(page.locator('.jb-tray .dr-item')).toHaveCount(3);
  for (const [item, line] of [['boots', 'Boots on!'], ['helmet', 'Helmet on!'], ['jacket', 'Jacket on!']]) {
    await page.locator(`.jb-tray [data-item="${item}"]`).click();
    await expect.poll(() => spoken(page)).toContain(line);
  }
  await expect.poll(() => spoken(page)).toContain("I'm ready! Let's go!");
  await expect(play(page)).toHaveAttribute('data-state', 'drive', { timeout: 15000 });
  const color = await page.locator('.fr-street').getAttribute('data-color');
  const colors = await page.locator('.fr-home').evaluateAll((els) => els.map((e) => e.dataset.color));
  expect(colors).toHaveLength(3);
  expect(new Set(colors).size).toBe(3);
  expect(colors).toContain(color);
  await expect(page.locator('.fr-home .fr-smoke')).toHaveCount(1);
  await expect(page.locator(`.fr-home[data-color="${color}"] .fr-smoke`)).toHaveCount(1);
  await expect.poll(() => spoken(page)).toContain(`Nee-naw! Go to the ${color} house!`);
  // Còi xe: chạm lúc nào cũng được, không tính lượt.
  await page.getByRole('button', { name: 'Xe cứu hỏa' }).click();
  await expect(page.locator('.fr-truck')).toHaveClass(/honk/);
  await expect(play(page)).toHaveAttribute('data-state', 'drive');
  const wrong = colors.find((c) => c !== color);
  await expect(async () => {
    await page.locator(`.fr-home[data-color="${wrong}"]`).click();
    expect(await spoken(page)).toContain(`That's the ${wrong} house. Go to the ${color} house!`);
  }).toPass({ timeout: 15000 });
  await page.locator(`.fr-home[data-color="${color}"]`).click();
  await expect(play(page)).toHaveAttribute('data-state', ACTIVE, { timeout: 15000 });
  await expect(page.locator('.fr-street')).toBeHidden();
  await expect(page.locator('.fr-hose')).toBeVisible();
  // Nhầm một lần trước khi chọn đúng: không ghi màu "đã gặp" (chỉ ghi khi đúng ngay lần đầu).
  expect(await page.evaluate((c) => window.kidEnglish.db.get('progress', c), color)).toBeFalsy();
});

test('FF1 mức 2: Bông gọi từng món — mặc nhầm thứ tự → "… first!", món chưa mặc; chọn nhà đúng ngay lần đầu → ghi màu đã gặp; chơi hết lượt → sticker', async ({ page }) => {
  await enterFire(page, { level: 2, rounds: 0, lock: 2, seen: {} });
  const want = await page.locator('.fr-scene').getAttribute('data-want');
  expect(['helmet', 'jacket', 'boots']).toContain(want);
  const other = ['helmet', 'jacket', 'boots'].find((g) => g !== want);
  await expect(async () => {
    await page.locator(`.jb-tray [data-item="${other}"]`).click();
    expect((await spoken(page)).some((t) => / first!$/.test(t))).toBe(true);
  }).toPass({ timeout: 15000 });
  await expect(page.locator('.ff-dress .ff-wear.ff-on')).toHaveCount(0);
  await dressUp(page);
  let colored = null;
  for (let i = 0; i < 3; i++) {
    await expect(play(page)).toHaveAttribute('data-state', /drive|tree|safety/, { timeout: 15000 });
    if (!colored && (await play(page).getAttribute('data-state')) === 'drive') colored = await page.locator('.fr-street').getAttribute('data-color');
    await doCase(page, i);
  }
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
  expect((await page.evaluate((c) => window.kidEnglish.db.get('progress', c), colored))?.practiceCount).toBeGreaterThan(0);
});

test('FF1 mức 3: khay có thêm món lạ → "Not the …!"; phố không có khói (chỉ nghe màu)', async ({ page }) => {
  await enterFire(page, { level: 3, rounds: 0, lock: 3, seen: {} });
  await expect(page.locator('.jb-tray .dr-item')).toHaveCount(4);
  const odd = await page.locator('.jb-tray .dr-item').evaluateAll((els) => els.map((e) => e.dataset.item).find((id) => !['helmet', 'jacket', 'boots'].includes(id)));
  expect(['swimsuit', 'flipflops']).toContain(odd);
  await expect(async () => {
    await page.locator(`.jb-tray [data-item="${odd}"]`).click();
    expect((await spoken(page)).some((t) => /^Not the (swimsuit|flip-flops)! We need the (helmet|jacket|boots)!$/.test(t))).toBe(true);
  }).toPass({ timeout: 15000 });
  await dressUp(page);
  for (let i = 0; i < 3; i++) {
    await expect(play(page)).toHaveAttribute('data-state', /drive|tree/, { timeout: 15000 });
    if ((await play(page).getAttribute('data-state')) === 'drive') {
      await expect(page.locator('.fr-smoke')).toHaveCount(0);
      break;
    }
    await doCase(page, i);
  }
});

test('FF1: ra nền giữa lúc mặc đồ rồi quay lại → giữ món đã mặc; ra nền lúc ở phố → quay lại vẫn ở phố, cùng nhà cần tới', async ({ page }) => {
  await enterFire(page, { level: 1, rounds: 0, lock: 1, seen: {} });
  await page.locator('.jb-tray [data-item="helmet"]').click();
  await expect(page.locator('.ff-dress .ff-wear.ff-on')).toHaveCount(1, { timeout: 15000 });
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'dress', { timeout: 15000 });
  await expect(page.locator('.ff-dress [data-gear="helmet"]')).toHaveClass(/ff-on/);
  await expect(page.locator('.jb-tray .dr-item')).toHaveCount(2);
  await dressUp(page);
  await expect(play(page)).toHaveAttribute('data-state', 'drive', { timeout: 15000 });
  const color = await page.locator('.fr-street').getAttribute('data-color');
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'drive', { timeout: 15000 });
  await expect(page.locator('.fr-street')).toHaveAttribute('data-color', color);
});

// ---------- SPEC-fire2 FF2: cứu bạn thú trong nhà ----------
test('FF2: mức 2 ít gặp ca trong nhà → ca cứu là trong nhà; lái xe tới nhà, "Help! The door is stuck!"; chạm cửa sổ → cửa nhún, không tính nhầm; gõ cửa → "Knock, knock!"; ra nền rồi quay lại vẫn ở bước mở cửa; mở cửa → "I\'m safe!"; hết lượt ghi seen.house', async ({ page }) => {
  await openFire(page, { level: 2, rounds: 0, lock: 2, seen: { tree: 5 } });
  let saw = false;
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
    await ready(page);
    if ((await page.locator('.fr-scene').getAttribute('data-kind')) !== 'house') {
      expect(['fire', 'safety']).toContain(await page.locator('.fr-scene').getAttribute('data-kind'));
      await doCase(page, i);
      continue;
    }
    saw = true;
    await expect.poll(() => spoken(page)).toContain('Help! The door is stuck!');
    await expect(play(page)).toHaveAttribute('data-state', 'knock');
    await expect(page.locator('.fr-house rect').nth(1)).toHaveAttribute('fill', /#/);
    const n = (await spoken(page)).length;
    await page.locator('.fr-peek').click();
    await expect(page.locator('.fr-door')).toHaveClass(/nudge/);
    await expect(play(page)).toHaveAttribute('data-state', 'knock');
    await expect(async () => {
      await page.locator('.fr-door').click();
      expect(await saidSince(page, n, /^Knock, knock!$/)).toBe(true);
    }).toPass({ timeout: 15000 });
    await expect(play(page)).toHaveAttribute('data-state', 'open');
    await setVisible(page, 'hidden');
    await setVisible(page, 'visible');
    await page.locator('.resume-overlay .start-btn').click();
    await expect(play(page)).toHaveAttribute('data-state', 'open', { timeout: 15000 });
    await page.locator('.fr-door').click();
    await expect.poll(() => spoken(page)).toContain("I'm safe! Thank you, firefighter!");
  }
  expect(saw).toBe(true);
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
  expect((await page.evaluate(() => window.kidEnglish.settings.fireGame)).seen).toMatchObject({ tree: 5, house: 1 });
});

// ---------- SPEC-fire2 FF3: An toàn với lửa ----------
test('FF3 mức 1: lượt = 2 ca dập lửa + ca An toàn cuối; "Some things are hot…"; 3 đồ (2 nóng + 1 an toàn); nhầm → câu nhầm gọi tên đồ + nút đúng nhún; kết "tell a grown-up"; không có điện thoại → sticker', async ({ page }) => {
  await openFire(page, { level: 1, rounds: 0, lock: 1, seen: {} });
  for (let i = 0; i < 2; i++) {
    await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
    await ready(page);
    expect(await page.locator('.fr-scene').getAttribute('data-kind')).toBe('fire');
    await doCase(page, i);
  }
  await expect(page.locator('.jb-count')).toHaveText('3/3', { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'safety', { timeout: 15000 });
  expect(await page.locator('.fr-scene').getAttribute('data-kind')).toBe('safety');
  expect(await spoken(page)).toContain("Some things are hot. Let's be safe!");
  const hots = [];
  for (let k = 0; k < 3; k++) {
    await expect(play(page)).toHaveAttribute('data-state', 'safety', { timeout: 15000 });
    await expect(page.locator('.fr-yn.right')).toHaveCount(0);
    const hot = (await page.locator('.fr-safety').getAttribute('data-hot')) === 'true';
    const name = await page.locator('.fr-thing').getAttribute('aria-label');
    hots.push(hot);
    await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(/^Look! An? .+\. Can we touch it\?$/));
    if (k === 0) {
      const n = (await spoken(page)).length;
      await expect(async () => {
        await page.locator(`.fr-yn[data-answer="${hot ? 'yes' : 'no'}"]`).click();
        expect(await saidSince(page, n, hot ? new RegExp(`^Oh no! The ${name} is hot\\. Don't touch!$`) : new RegExp(`^It's okay! You can touch the ${name}!$`))).toBe(true);
      }).toPass({ timeout: 15000 });
      await expect(page.locator(`.fr-yn[data-answer="${hot ? 'no' : 'yes'}"]`)).toHaveClass(/nudge/);
      await expect(play(page)).toHaveAttribute('data-state', 'safety');
    }
    const n = (await spoken(page)).length;
    await page.locator(`.fr-yn[data-answer="${hot ? 'no' : 'yes'}"]`).click();
    await expect.poll(() => saidSince(page, n, hot ? new RegExp(`^That's right! The ${name} is hot\\. Don't touch!$`) : new RegExp(`^Yes! You can touch the ${name}!$`))).toBe(true);
  }
  expect(hots.filter(Boolean)).toHaveLength(2);
  await expect.poll(() => spoken(page)).toContain('If you see a fire, tell a grown-up!');
  await expect(page.locator('.fr-phone')).toHaveCount(0);
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
});

test('FF3 mức 3: sau 3 đồ là điện thoại 114 — phím cần bấm sáng; bấm nhầm → "That\'s five. Press one!", không tăng số; ra nền sau "11" quay lại vẫn "11"; bấm 4 → "Fire station! We\'re coming!" → sticker', async ({ page }) => {
  await openFire(page, { level: 3, rounds: 0, lock: 3, seen: {} });
  for (let i = 0; i < 2; i++) await doCase(page, i);
  await expect(page.locator('.jb-count')).toHaveText('3/3', { timeout: 15000 });
  for (let k = 0; k < 3; k++) {
    await expect(play(page)).toHaveAttribute('data-state', 'safety', { timeout: 15000 });
    await expect(page.locator('.fr-yn.right')).toHaveCount(0);
    const hot = (await page.locator('.fr-safety').getAttribute('data-hot')) === 'true';
    await page.locator(`.fr-yn[data-answer="${hot ? 'no' : 'yes'}"]`).click();
    await expect(page.locator('.fr-yn.right')).toHaveCount(1, { timeout: 15000 }).catch(() => {});
  }
  await expect(play(page)).toHaveAttribute('data-state', 'dial', { timeout: 15000 });
  await expect.poll(() => spoken(page)).toContain('Grown-ups call one… one… four!');
  await expect(page.locator('.fr-key.lit')).toHaveAttribute('data-n', '1');
  const n = (await spoken(page)).length;
  await expect(async () => {
    await page.locator('.fr-key[data-n="5"]').click();
    expect(await saidSince(page, n, /^That's five\. Press one!$/)).toBe(true);
  }).toPass({ timeout: 15000 });
  await expect(page.locator('.fr-display')).toHaveText('');
  await page.locator('.fr-key[data-n="1"]').click();
  await expect(page.locator('.fr-display')).toHaveText('1');
  await page.locator('.fr-key[data-n="1"]').click();
  await expect(page.locator('.fr-display')).toHaveText('11');
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'dial', { timeout: 15000 });
  await expect(page.locator('.fr-display')).toHaveText('11');
  await expect(page.locator('.fr-key.lit')).toHaveAttribute('data-n', '4');
  await page.locator('.fr-key[data-n="4"]').click();
  await expect.poll(() => spoken(page)).toContain("Fire station! We're coming!");
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
});
