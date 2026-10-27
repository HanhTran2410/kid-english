// 👮 Cảnh sát giúp bạn (SPEC-jobs.md mục 6): bạn thú mất đồ, bé chạm đúng đồ theo màu / cỡ; mức 3 bụi cây (JOBS-06), tìm bạn.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const saidSince = async (page, n, re) => (await spoken(page)).slice(n).some((t) => re.test(t));
const play = (page) => page.locator('.pl-play');
const target = async (page) => page.locator(`.pl-item[data-id="${await page.locator('.pl-park').getAttribute('data-target')}"]`);

async function openPolice(page, settings, trafficAt = 2, crossAt = 1) {
  await fakeSpeech(page);
  await page.addInitScript(([t, c]) => { window.__kidTest = { policeTrafficAt: t, policeCrossAt: c }; }, [trafficAt, crossAt]);
  await startApp(page);
  if (settings) await page.evaluate((s) => window.kidEnglish.setSetting('policeGame', s), settings);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await expect(page.locator('.jb-job')).toHaveCount(await page.evaluate(async () => (await import('/js/screens/jobs.js')).JOBS.length));
  await page.getByRole('button', { name: 'Cảnh sát giúp bạn' }).click();
  await expect(play(page)).toHaveAttribute('data-state', /find|ask|look-left/, { timeout: 15000 });
}
/** SPEC-jobs2 PL2a: giúp bạn qua đường đúng thứ tự. */
async function solveCross(page) {
  await expect(play(page)).toHaveAttribute('data-state', 'look-left', { timeout: 15000 });
  await page.locator('.pl-arrow[data-dir="left"]').click();
  await expect(play(page)).toHaveAttribute('data-state', 'look-right', { timeout: 15000 });
  await page.locator('.pl-arrow[data-dir="right"]').click();
  await expect(play(page)).toHaveAttribute('data-state', 'press', { timeout: 15000 });
  await page.locator('.pl-press').click();
  await expect(play(page)).toHaveAttribute('data-state', 'go', { timeout: 15000 });
  await page.locator('.pl-walker').click();
}
/** Ca đèn giao thông: bật đúng đèn từng lượt (đọc `data-want`) tới hết ca. */
async function solveTraffic(page) {
  const tr = page.locator('.pl-traffic');
  for (let i = 0; i < 3; i++) {
    await expect(tr).toHaveAttribute('data-step', String(i), { timeout: 15000 });
    await expect(play(page)).toHaveAttribute('data-state', 'ask', { timeout: 15000 });
    await page.locator(`.pl-lamp[data-color="${await tr.getAttribute('data-want')}"]`).click();
  }
}
/** Tìm đúng đồ của ca đang mở (chạm bụi che nó trước nếu có). */
async function findOne(page, i) {
  await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', /find|ask|look-left/, { timeout: 15000 });
  if ((await play(page).getAttribute('data-state')) === 'ask') return solveTraffic(page);
  if ((await play(page).getAttribute('data-state')) === 'look-left') return solveCross(page);
  const id = await page.locator('.pl-park').getAttribute('data-target');
  const bush = page.locator(`.pl-bush[data-cover="${id}"]`);
  if (await page.locator(`.pl-bush[data-cover="${id}"]:not(.moved)`).count()) {
    await bush.click();
    await expect(bush).toHaveClass(/moved/);
  }
  await (await target(page)).click();
}

test("mức 1: mất đồ + \"It's red!\"; chạm nhầm → \"Hmm, that … is blue. Mine is red!\", đồ đúng nhún; chạm đúng → cảm ơn → ca 2", async ({ page }) => {
  await openPolice(page);
  const said = await spoken(page);
  expect(said).toContain('Hello! Can I help you?');
  expect(said.some((t) => /^Oh no! I lost my \w+!$/.test(t))).toBe(true);
  expect(said.some((t) => /^It's (red|blue|yellow|green|pink|orange)!$/.test(t))).toBe(true);
  await expect(page.locator('.pl-item')).toHaveCount(3);
  const t = await target(page);
  const wrong = page.locator(`.pl-item:not([data-id="${await t.getAttribute('data-id')}"])`).first();
  let n = (await spoken(page)).length;
  await wrong.click();
  await expect.poll(() => saidSince(page, n, /^Hmm, that \w+ is \w+\. Mine is \w+!$/)).toBe(true);
  await expect(t).toHaveClass(/nudge/);
  n = (await spoken(page)).length;
  await t.click();
  await expect.poll(() => saidSince(page, n, /^My \w+! Thank you, officer!$/)).toBe(true);
  await expect(page.locator('.jb-count')).toHaveText('2/3', { timeout: 15000 });
});

test('3 ca → Hoan hô + sticker; đếm lượt; ghi "đã gặp" màu', async ({ page }) => {
  await openPolice(page);
  for (let i = 0; i < 3; i++) await findOne(page, i);
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.done-btn')).toBeInViewport({ ratio: 1, timeout: 15000 });
  expect((await page.evaluate(() => window.kidEnglish.settings.policeGame)).rounds).toBe(1);
  const words = await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).map((p) => p.word));
  expect(words.some((w) => ['red', 'blue', 'yellow', 'green', 'pink', 'orange'].includes(w))).toBe(true);
});

test("mức 2: 4 đồ đủ 2 màu × 2 cỡ, mô tả \"It's big and blue!\"; ra nền rồi quay lại cùng ca", async ({ page }) => {
  await openPolice(page, { level: 2, rounds: 0, lock: 2, seen: {} });
  await expect(page.locator('.pl-item')).toHaveCount(4);
  const combos = await page.locator('.pl-item').evaluateAll((els) => els.map((e) => `${e.dataset.color}:${e.dataset.size}`));
  expect(new Set(combos).size).toBe(4);
  expect((await spoken(page)).some((t) => /^It's (big|small) and \w+!$/.test(t))).toBe(true);
  const asker = await page.locator('.pl-asker').getAttribute('data-asker');
  const setVisible = (s) => page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, s);
  await setVisible('hidden');
  await setVisible('visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'find', { timeout: 15000 });
  await expect(page.locator('.pl-asker')).toHaveAttribute('data-asker', asker);
  await findOne(page, 0);
  await expect(page.locator('.jb-count')).toHaveText('2/3', { timeout: 15000 });
});

test('JOBS-06 — mức 3: chạm bụi cây thì đồ lộ ra, không tính nhầm; có ca tìm bạn bị lạc; chơi hết lượt', async ({ page }) => {
  await openPolice(page, { level: 3, rounds: 0, lock: 3, seen: {} });
  let sawFriend = false;
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.jb-count')).toHaveText(`${i + 1}/3`, { timeout: 15000 });
    await expect(play(page)).toHaveAttribute('data-state', /find|ask|look-left/, { timeout: 15000 });
    if ((await play(page).getAttribute('data-state')) === 'ask') {
      await solveTraffic(page);
      continue;
    }
    if ((await play(page).getAttribute('data-state')) === 'look-left') {
      await solveCross(page);
      continue;
    }
    if (await page.locator('.pl-item[data-friend]:not([data-friend=""])').count()) sawFriend = true;
    const id = await page.locator('.pl-park').getAttribute('data-target');
    // Chạm một bụi cây không che đồ cần tìm (nếu có): không có câu nhầm.
    const others = page.locator(`.pl-bush:not([data-cover="${id}"]):not(.moved)`);
    const cover = (await others.count()) ? await others.first().getAttribute('data-cover') : null;
    const other = page.locator(`.pl-bush[data-cover="${cover}"]`);
    const n = (await spoken(page)).length;
    if (cover) {
      await other.click();
      await expect(other).toHaveClass(/moved/);
      await page.waitForTimeout(200);
      expect(await saidSince(page, n, /^(Hmm, that|That's \w+! My friend)/)).toBe(false);
    }
    await findOne(page, i);
  }
  expect(sawFriend).toBe(true);
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
});

// ---------- SPEC-jobs2 PL1: ca đèn giao thông ----------
const want = (page) => page.locator('.pl-traffic').getAttribute('data-want');
const step = (page) => page.locator('.pl-traffic').getAttribute('data-step');
const setVisible = (page, s) => page.evaluate((v) => {
  Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}, s);

test('PL1 mức 1: "You are the traffic police!" → "Make it green/red!"; chạm nhầm → "That\'s … Make it …!", đèn đúng nhún sau 2 lần nhầm; đúng → đèn sáng, xe chạy / dừng; 3 lượt → ca sau; ghi "đã gặp" màu đèn', async ({ page }) => {
  await openPolice(page, null, 0);
  await expect(play(page)).toHaveAttribute('data-state', 'ask', { timeout: 15000 });
  await expect(page.locator('.pl-lamp')).toHaveCount(3);
  await expect(page.locator('.pl-park')).toBeHidden();
  expect(await spoken(page)).toContain('You are the traffic police!');
  const w = await want(page);
  await expect.poll(() => spoken(page)).toContain(`Make it ${w}!`);
  const wrong = w === 'green' ? 'red' : 'green';
  let n = (await spoken(page)).length;
  await page.locator(`.pl-lamp[data-color="${wrong}"]`).click();
  await expect.poll(() => saidSince(page, n, new RegExp(`^That's ${wrong}\\. Make it ${w}!$`))).toBe(true);
  await page.locator('.pl-lamp[data-color="yellow"]').click();
  await expect(page.locator(`.pl-lamp[data-color="${w}"]`)).toHaveClass(/nudge/);
  n = (await spoken(page)).length;
  // Ghi lại lúc đèn sáng / xe chạy (máy chậm: lượt sau có thể đã vẽ lại trước khi test kịp đọc).
  await page.evaluate(() => {
    window.__lit = [];
    new MutationObserver(() => {
      for (const el of document.querySelectorAll('.pl-lamp.on, .pl-car.go')) window.__lit.push(el.dataset.color ?? 'go');
    }).observe(document.querySelector('.pl-traffic'), { subtree: true, attributes: true, attributeFilter: ['class'] });
  });
  await page.locator(`.pl-lamp[data-color="${w}"]`).click();
  await expect.poll(() => page.evaluate(() => window.__lit)).toContain(w);
  if (w === 'green') expect(await page.evaluate(() => window.__lit)).toContain('go');
  else expect(await page.evaluate(() => window.__lit)).not.toContain('go');
  await expect.poll(() => saidSince(page, n, w === 'green' ? /^Green — go!$/ : /^Red — stop!$/)).toBe(true);
  // Lượt 2, 3 (đúng ngay) → hết ca.
  for (let i = 1; i < 3; i++) {
    await expect.poll(() => step(page), { timeout: 15000 }).toBe(String(i));
    await expect(play(page)).toHaveAttribute('data-state', 'ask', { timeout: 15000 });
    await page.locator(`.pl-lamp[data-color="${await want(page)}"]`).click();
  }
  await expect.poll(() => spoken(page)).toContain('Great job, traffic police!');
  await expect(page.locator('.jb-count')).toHaveText('2/3', { timeout: 15000 });
  await expect(play(page)).toHaveAttribute('data-state', 'find', { timeout: 15000 });
  await expect(page.locator('.pl-traffic')).toBeHidden();
  const words = await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).map((p) => p.word));
  expect(words.some((x) => ['red', 'green'].includes(x))).toBe(true);
});

test('PL1 mức 2: xe hỏi "Can I go?"; có bạn trên vạch kẻ mà bật xanh → "Wait! A friend is crossing!"; vạch trống mà bật đỏ → "The road is clear. Make it green!"; ra nền giữa ca → quay lại cùng lượt', async ({ page }) => {
  await openPolice(page, { level: 2, rounds: 0, lock: 2, seen: {} }, 0);
  await expect(play(page)).toHaveAttribute('data-state', 'ask', { timeout: 15000 });
  await expect.poll(() => spoken(page)).toContain('Can I go?');
  let sawCrossing = false;
  let sawClear = false;
  for (let i = 0; i < 3; i++) {
    await expect.poll(() => step(page), { timeout: 15000 }).toBe(String(i));
    await expect(play(page)).toHaveAttribute('data-state', 'ask', { timeout: 15000 });
    const crossing = (await page.locator('.pl-traffic').getAttribute('data-crossing')) === 'true';
    await expect(page.locator('.pl-walker')).toBeVisible({ visible: crossing });
    const n = (await spoken(page)).length;
    if (crossing && !sawCrossing) {
      sawCrossing = true;
      await page.locator('.pl-lamp[data-color="green"]').click();
      await expect.poll(() => saidSince(page, n, /^Wait! A friend is crossing!$/)).toBe(true);
    } else if (!crossing && !sawClear) {
      sawClear = true;
      await page.locator('.pl-lamp[data-color="red"]').click();
      await expect.poll(() => saidSince(page, n, /^The road is clear\. Make it green!$/)).toBe(true);
    }
    if (i === 1) {
      await setVisible(page, 'hidden');
      await setVisible(page, 'visible');
      await page.locator('.resume-overlay .start-btn').click();
      await expect(play(page)).toHaveAttribute('data-state', 'ask', { timeout: 15000 });
      await expect(page.locator('.pl-traffic')).toHaveAttribute('data-step', '1');
    }
    const m = (await spoken(page)).length;
    await page.locator(`.pl-lamp[data-color="${crossing ? 'red' : 'green'}"]`).click();
    await expect.poll(() => saidSince(page, m, crossing ? /^Red — stop! A friend is crossing\.$/ : /^Green — go!$/)).toBe(true);
  }
  expect(sawCrossing && sawClear).toBe(true);
  await expect(page.locator('.jb-count')).toHaveText('2/3', { timeout: 15000 });
});

test('PL1 mức 3: một lượt "The light is changing. Make it yellow!" → bật vàng → "Yellow — slow down!"', async ({ page }) => {
  await openPolice(page, { level: 3, rounds: 0, lock: 3, seen: {} }, 0);
  let sawYellow = false;
  for (let i = 0; i < 3; i++) {
    await expect.poll(() => step(page), { timeout: 15000 }).toBe(String(i));
    await expect(play(page)).toHaveAttribute('data-state', 'ask', { timeout: 15000 });
    const w = await want(page);
    const n = (await spoken(page)).length;
    await page.evaluate(() => {
      window.__slow = false;
      new MutationObserver(() => { if (document.querySelector('.pl-car.slow')) window.__slow = true; })
        .observe(document.querySelector('.pl-car'), { attributes: true, attributeFilter: ['class'] });
    });
    await page.locator(`.pl-lamp[data-color="${w}"]`).click();
    if (w === 'yellow') {
      sawYellow = true;
      await expect.poll(() => page.evaluate(() => window.__slow)).toBe(true);
      expect(await spoken(page)).toContain('The light is changing. Make it yellow!');
      await expect.poll(() => saidSince(page, n, /^Yellow — slow down!$/)).toBe(true);
    }
  }
  expect(sawYellow).toBe(true);
  await expect(page.locator('.jb-count')).toHaveText('2/3', { timeout: 15000 });
});

// ---------- SPEC-jobs2 PL2a: giúp bạn qua đường ----------
test('PL2a mức 2: "Can you help me cross the road?" → nhìn trái → nhìn phải → bấm nút (đèn người đi bộ xanh, đèn xe đỏ) → tự nhìn lại → chạm bạn → qua đường; sai thứ tự → Bông nói lại câu của bước (nhầm); nút đã bấm không tính', async ({ page }) => {
  await openPolice(page, { level: 2, rounds: 0, lock: 2, seen: {} }, 2, 0);
  await expect(play(page)).toHaveAttribute('data-state', 'look-left', { timeout: 15000 });
  await expect(page.locator('.pl-traffic')).toHaveAttribute('data-mode', 'cross');
  expect(await spoken(page)).toContain('Can you help me cross the road?');
  await expect.poll(() => spoken(page)).toContain('Stop! Look left!');
  const lefts = async () => (await spoken(page)).filter((t) => t === 'Stop! Look left!').length;
  let before = await lefts();
  await page.locator('.pl-arrow[data-dir="right"]').click();
  await expect.poll(lefts).toBe(before + 1);
  await expect(play(page)).toHaveAttribute('data-state', 'look-left');
  before = await lefts();
  await page.locator('.pl-walker').click();
  await expect.poll(lefts).toBe(before + 1);
  await expect(page.locator('.pl-arrow[data-dir="left"]')).toHaveClass(/nudge/);
  let n = (await spoken(page)).length;
  await page.locator('.pl-arrow[data-dir="left"]').click();
  await expect.poll(() => saidSince(page, n, /^No cars!$/)).toBe(true);
  await expect(play(page)).toHaveAttribute('data-state', 'look-right', { timeout: 15000 });
  await expect.poll(() => spoken(page)).toContain('Look right!');
  n = (await spoken(page)).length;
  await page.locator('.pl-press').click();
  await expect.poll(() => saidSince(page, n, /^Look right!$/)).toBe(true);
  await page.locator('.pl-arrow[data-dir="right"]').click();
  await expect(play(page)).toHaveAttribute('data-state', 'press', { timeout: 15000 });
  await expect.poll(() => spoken(page)).toContain('Press the button. Wait for the green light!');
  await expect(page.locator('.pl-walk-light')).toHaveAttribute('data-on', 'red');
  await page.locator('.pl-press').click();
  await expect(page.locator('.pl-walk-light')).toHaveAttribute('data-on', 'green', { timeout: 15000 });
  await expect(page.locator('.pl-lamp[data-color="red"]')).toHaveClass(/on/);
  await expect.poll(() => spoken(page)).toContain('Green light! Look left and right again!');
  await expect(play(page)).toHaveAttribute('data-state', 'go', { timeout: 15000 });
  await expect.poll(() => spoken(page)).toContain("All clear! Let's cross together!");
  n = (await spoken(page)).length;
  await page.locator('.pl-press').click();
  await page.waitForTimeout(300);
  expect(await saidSince(page, n, /^(Press the button|Stop! Look left|Look right|Green light)/)).toBe(false);
  await page.locator('.pl-walker').click();
  await expect.poll(() => saidSince(page, n, /^Thank you, officer!$/)).toBe(true);
  await expect(page.locator('.jb-count')).toHaveText('2/3', { timeout: 15000 });
});

test('PL2a: ra nền ở bước bấm nút → quay lại vẫn bước bấm nút (đã nhìn hai phía); mức 3 có đủ tìm bạn + đèn + qua đường, chơi hết lượt', async ({ page }) => {
  await openPolice(page, { level: 3, rounds: 0, lock: 3, seen: {} }, 2, 0);
  await expect(play(page)).toHaveAttribute('data-state', 'look-left', { timeout: 15000 });
  await page.locator('.pl-arrow[data-dir="left"]').click();
  await expect(play(page)).toHaveAttribute('data-state', 'look-right', { timeout: 15000 });
  await page.locator('.pl-arrow[data-dir="right"]').click();
  await expect(play(page)).toHaveAttribute('data-state', 'press', { timeout: 15000 });
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(play(page)).toHaveAttribute('data-state', 'press', { timeout: 15000 });
  await expect(page.locator('.pl-traffic')).toHaveAttribute('data-step', 'press');
  await page.locator('.pl-press').click();
  await expect(play(page)).toHaveAttribute('data-state', 'go', { timeout: 15000 });
  await page.locator('.pl-walker').click();
  await findOne(page, 1);
  await findOne(page, 2);
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
});

// ---------- SPEC-jobs2 PL2b: tìm bạn bị lạc theo quần áo ----------
/** Mức 3, ca 1 là tìm bạn (đèn ở ca 3, qua đường ở ca 2): mở hết bụi cây. */
async function openFriendCase(page) {
  await openPolice(page, { level: 3, rounds: 0, lock: 3, seen: {} }, 2, 1);
  await expect(play(page)).toHaveAttribute('data-state', 'find', { timeout: 15000 });
  await expect(page.locator('.pl-item[data-hat]:not([data-hat=""])')).toHaveCount(3);
  for (const cover of await page.locator('.pl-bush:not(.moved)').evaluateAll((els) => els.map((e) => e.dataset.cover))) {
    const bush = page.locator(`.pl-bush[data-cover="${cover}"]`);
    await bush.click();
    await expect(bush).toHaveClass(/moved/);
  }
}

test('PL2b mức 3: bạn bị lạc đội mũ + đi giày — "My friend has a … hat and … shoes."; chọn đúng ngay → "There you are!", ghi đã gặp hat / shoes', async ({ page }) => {
  await openFriendCase(page);
  const t = await target(page);
  const [hat, shoes] = [await t.getAttribute('data-hat'), await t.getAttribute('data-shoes')];
  expect(await spoken(page)).toContain(`My friend has a ${hat} hat and ${shoes} shoes.`);
  await expect(t.locator('.pl-clothes')).toHaveCount(1);
  const n = (await spoken(page)).length;
  await t.click();
  await expect.poll(() => saidSince(page, n, /^There you are! Thank you, officer!$/)).toBe(true);
  await expect.poll(() => page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).map((p) => p.word).filter((w) => w === 'hat' || w === 'shoes').sort())).toEqual(['hat', 'shoes']);
});

test('PL2b mức 3: chọn nhầm bạn → "That friend has a … hat. My friend has a … hat!" / "… shoes …" (món khác đầu tiên); nhầm rồi đúng thì không ghi quần áo', async ({ page }) => {
  await openFriendCase(page);
  const t = await target(page);
  const [hat, shoes] = [await t.getAttribute('data-hat'), await t.getAttribute('data-shoes')];
  const sameHat = page.locator(`.pl-item[data-hat="${hat}"]:not([data-id="${await t.getAttribute('data-id')}"])`);
  const otherShoes = await sameHat.getAttribute('data-shoes');
  let n = (await spoken(page)).length;
  await sameHat.click();
  await expect.poll(() => saidSince(page, n, new RegExp(`^That friend has ${otherShoes} shoes\\. My friend has ${shoes} shoes!$`))).toBe(true);
  const sameShoes = page.locator(`.pl-item[data-shoes="${shoes}"]:not([data-id="${await t.getAttribute('data-id')}"])`);
  const otherHat = await sameShoes.getAttribute('data-hat');
  n = (await spoken(page)).length;
  await page.waitForTimeout(450);
  await sameShoes.click();
  await expect.poll(() => saidSince(page, n, new RegExp(`^That friend has a ${otherHat} hat\\. My friend has a ${hat} hat!$`))).toBe(true);
  await t.click();
  await expect(page.locator('.jb-count')).toHaveText('2/3', { timeout: 15000 });
  expect(await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).some((p) => p.word === 'hat'))).toBe(false);
});
