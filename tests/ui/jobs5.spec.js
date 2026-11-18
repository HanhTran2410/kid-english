// 👨‍🍳 Đầu bếp nhí — ca E "Bé đói rồi!" (SPEC-jobs5.md, 0.82.0): bụng kêu → (mức 3) chọn mặt → thực đơn → nấu cơm nắm /
// salad / pizza (0.83.0) → ăn cùng Bông; ca E thay bánh nướng ở lượt rounds % 3 = 2, là ca nghề cuối trước dọn bếp.
// Lượt nói (0.83.0, mục 5): chỉ khi bật "Cho bé nói khi chơi nghề"; test giả kết quả nghe bằng window.__kidTest.chefTalkResult.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const play = (page) => page.locator('.jb-play');
const TOOL = { pour: 'milk', crack: 'egg', mix: 'spoon' };
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
const level = (page) => page.evaluate(() => window.kidEnglish.settings.chefGame.level);

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
async function finish(page, dish) {
  for (let i = 0; i < 160 && !(await page.locator('.jb-play.jb-done').count()); i++) {
    if (/^(wash|layer|serve|bake|decor|temp|clean|feel|menu|fruit|topping|cook|eat)$/.test(await play(page).getAttribute('data-state'))) await solve(page, dish);
    await page.waitForTimeout(150);
  }
  await done(page);
}

test('JOBS5-01, 07, 10: mức 1 lượt rounds 2 — bánh mì kẹp + trang trí + ca E cuối (không bánh nướng); Bông "Yes! I\'m hungry!"; 2 thẻ (món ít làm nhất), chọn thẻ nào cũng được; cơm nắm 2 bước, chạm đồ không sáng không tính nhầm; ăn 3 miếng → "Yummy! I\'m full!" → sticker', async ({ page }) => {
  await openChef(page, 1, 2);
  await playUntil(page, /^menu$/);
  expect(await spoken(page)).toEqual(expect.arrayContaining(['Are you hungry?', "Yes! I'm hungry!", 'What do you want?', 'A rice ball?', 'A pizza?']));
  expect(await spoken(page)).not.toContain('A fruit salad?'); // salad đã làm nhiều → không lên thực đơn mức 1
  expect(await spoken(page)).not.toContain('Pour!'); // lượt có ca E không có bánh nướng
  expect((await spoken(page)).some((t) => /^Bread!$/.test(t))).toBe(true); // có bánh mì kẹp
  await expect(page.locator('.cf-mcard')).toHaveCount(2);
  await expect(page.locator('.cf-bong')).toBeVisible();
  await page.locator('.cf-mcard[data-dish="rice-ball"]').click();
  await stateIs(page, 'cook');
  await expect.poll(() => spoken(page)).toContain("A rice ball! Let's make it!");
  await expect(page.locator('.cf-ktools .cf-tool')).toHaveCount(2);
  await expect(page.locator('.cf-ktools .cf-tool[data-tool="rice"]')).toHaveClass(/\blit\b/);
  await page.locator('.cf-ktools .cf-tool[data-tool="gloves"]').click();
  await page.waitForTimeout(300);
  expect((await spoken(page)).some((t) => /^Those are /.test(t))).toBe(false);
  await page.locator('.cf-ktools .cf-tool[data-tool="rice"]').click();
  await expect.poll(() => spoken(page)).toContain('Scoop!');
  await playUntil(page, /^eat$/);
  await expect(page.locator('.cf-plate .cf-eat')).toHaveCount(1);
  for (let i = 0; i < 3; i++) await page.locator('.cf-plate').click();
  await expect.poll(() => spoken(page)).toEqual(expect.arrayContaining(['Yummy?', 'Yummy!', "I'm full!"]));
  await done(page);
  expect(await spoken(page)).not.toContain('Clean up time!');
});

test('JOBS5-02, 12: mức 3 chạm 😴 — "That\'s sleepy." + bụng kêu + "Listen! How do you feel?", thẻ còn nguyên, chưa có thực đơn; chọn lại 😋 → thực đơn 3 thẻ', async ({ page }) => {
  await openChef(page, 3, 2);
  await playUntil(page, /^feel$/);
  await expect(page.locator('.cf-feel')).toHaveCount(3);
  await page.locator('.cf-feel[data-feel="sleepy"]').click();
  await expect.poll(() => spoken(page)).toEqual(expect.arrayContaining(["That's sleepy.", 'Listen! How do you feel?']));
  await expect(page.locator('.cf-feel')).toHaveCount(3);
  await expect(page.locator('.cf-menu')).toBeHidden();
  await stateIs(page, 'feel');
  await page.locator('.cf-feel[data-feel="hungry"]').click();
  await stateIs(page, 'menu');
  await expect.poll(() => spoken(page)).toContain("You're hungry! Let's cook!");
  await expect(page.locator('.cf-mcard')).toHaveCount(3);
});

test('JOBS5-03: mức 2 cơm nắm — chạm đồ nhiễu ở bước scoop → "That\'s the milk. Scoop the rice!" (hoặc trứng), không làm bước; xong 3 bước', async ({ page }) => {
  await openChef(page, 2, 2);
  await playUntil(page, /^menu$/);
  await page.locator('.cf-mcard[data-dish="rice-ball"]').click();
  await stateIs(page, 'cook');
  await expect(page.locator('.cf-ktools .cf-tool')).toHaveCount(4);
  const extra = await page.locator('.cf-ktools .cf-tool[data-tool="milk"], .cf-ktools .cf-tool[data-tool="egg"]').getAttribute('data-tool');
  await page.locator(`.cf-ktools .cf-tool[data-tool="${extra}"]`).click();
  await expect.poll(() => spoken(page)).toContain(`That's the ${extra}. Scoop the rice!`);
  await expect(page.locator('.cf-work')).toHaveAttribute('data-step', '0');
  await playUntil(page, /^eat$/);
  expect(await spoken(page)).toEqual(expect.arrayContaining(['Scoop!', 'Squeeze, squeeze, squeeze!', 'Wrap!']));
  await expect(page.locator('.cf-plate .cf-rb-nori')).toHaveCount(1);
});

test('JOBS5-04: mức 3 cơm nắm — chú nói cả chuỗi một lần; chạm rong biển trước → "First, scoop the rice!", không đọc lại cả chuỗi', async ({ page }) => {
  await openChef(page, 3, 2);
  await playUntil(page, /^menu$/);
  await page.locator('.cf-mcard[data-dish="rice-ball"]').click();
  const chain = 'First, scoop the rice. Then, squeeze. Then, wrap it!';
  await expect.poll(() => spoken(page)).toContain(chain);
  await stateIs(page, 'cook');
  await page.locator('.cf-ktools .cf-tool[data-tool="seaweed"]').click();
  await expect.poll(() => spoken(page)).toContain('First, scoop the rice!');
  expect((await spoken(page)).filter((t) => t === chain).length).toBe(1);
  await page.locator('.cf-ktools .cf-tool[data-tool="rice"]').click();
  await expect(page.locator('.cf-work')).toHaveAttribute('data-step', '1');
  await page.locator('.cf-ktools .cf-tool[data-tool="seaweed"]').click();
  await expect.poll(() => spoken(page)).toContain('Now, squeeze!');
});

test('JOBS5-05, 20: mức 3 salad — thả quả "No" → "No …, please!", quả không vào bát; bóc chuối ngay sau khi chuối vào bát; dọn bếp không có cái bát', async ({ page }) => {
  await openChef(page, 3, 2);
  await playUntil(page, /^menu$/, 'salad');
  await page.locator('.cf-mcard[data-dish="salad"]').click();
  await stateIs(page, 'fruit');
  await expect.poll(async () => (await spoken(page)).some((t) => /^Banana and \w+, please! No \w+!$/.test(t))).toBe(true);
  const no = (await spoken(page)).find((t) => /No \w+!$/.test(t)).match(/No (\w+)!$/)[1];
  const noId = await page.evaluate((w) => [...document.querySelectorAll('.jb-tray [data-item]')].map((el) => el.dataset.item)
    .find((id) => w.startsWith(id.slice(0, 4))), no);
  await tapTray(page, noId);
  await expect.poll(() => spoken(page)).toContain(`No ${no}, please!`);
  await expect(page.locator('.cf-work .cf-sfruit, .cf-work .cf-sbanana')).toHaveCount(0);
  await tapTray(page, 'banana');
  await stateIs(page, 'cook');
  await expect(page.locator('.cf-work')).toHaveAttribute('data-want', 'peel');
  await page.locator('.cf-sbanana').click();
  await expect.poll(() => spoken(page)).toContain('Peel!');
  await playUntil(page, /^clean$/, 'salad');
  await expect(page.locator('.cf-citem[data-item="bowl"]')).toHaveCount(0);
  await finish(page, 'salad');
});

test('JOBS5-11: mức 2 salad — chọn quả kia trước rồi chuối → bóc ngay, trộn cuối', async ({ page }) => {
  await openChef(page, 2, 2);
  await playUntil(page, /^menu$/, 'salad');
  await page.locator('.cf-mcard[data-dish="salad"]').click();
  await stateIs(page, 'fruit');
  const other = (await page.locator('.cf-work').getAttribute('data-missing')).split(',').find((f) => f !== 'banana');
  await tapTray(page, other);
  await stateIs(page, 'fruit');
  await expect(page.locator('.cf-work .cf-sfruit')).toHaveCount(1);
  await tapTray(page, 'banana');
  await stateIs(page, 'cook');
  await expect(page.locator('.cf-work')).toHaveAttribute('data-want', 'peel');
  await page.locator('.cf-ktools .cf-tool[data-tool="spoon"]').click();
  await expect.poll(() => spoken(page)).toContain("That's the spoon. Peel the banana!");
  await page.locator('.cf-sbanana').click();
  await expect(page.locator('.cf-work')).toHaveAttribute('data-want', 'mix', { timeout: 10000 });
  await page.locator('.cf-ktools .cf-tool[data-tool="spoon"]').click();
  await stateIs(page, 'eat');
});

test('JOBS5-08, 18: ra nền giữa lúc nấu → quay lại đúng món, đúng bước, không hỏi lại thực đơn; ra nền khi đã ăn 1 miếng → đĩa còn 2 miếng', async ({ page }) => {
  await openChef(page, 2, 2);
  await playUntil(page, /^menu$/);
  await page.locator('.cf-mcard[data-dish="rice-ball"]').click();
  await stateIs(page, 'cook');
  await page.locator('.cf-ktools .cf-tool[data-tool="rice"]').click();
  await expect(page.locator('.cf-work')).toHaveAttribute('data-want', 'squeeze', { timeout: 10000 });
  await stateIs(page, 'cook');
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await stateIs(page, 'cook');
  await expect(page.locator('.cf-work')).toHaveAttribute('data-want', 'squeeze');
  await expect(page.locator('.cf-menu')).toBeHidden();
  expect((await spoken(page)).filter((t) => t === 'What do you want?').length).toBe(1);
  await playUntil(page, /^eat$/);
  await page.locator('.cf-plate').click();
  await expect(page.locator('.cf-plate')).toHaveAttribute('data-bites', '1');
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await stateIs(page, 'eat');
  await expect(page.locator('.cf-plate')).toHaveAttribute('data-bites', '1');
  await page.locator('.cf-plate').click();
  await page.locator('.cf-plate').click();
  await expect.poll(() => spoken(page)).toContain("I'm full!");
});

test('JOBS5-07: ăn — không chạm thì món tự hết sau 5 giây', async ({ page }) => {
  await openChef(page, 1, 2);
  await playUntil(page, /^eat$/);
  await expect.poll(() => spoken(page), { timeout: 15000 }).toContain("I'm full!");
});

test('JOBS5-06: mức 2 pizza — phết sốt, rắc phô mai, nhân sai loại → "That\'s a/an … . Tomatoes, please!"; vào lò; bánh nóng chạm → "Hot! Wait!" không tính nhầm, tự ra đĩa', async ({ page }) => {
  await openChef(page, 2, 2);
  await playUntil(page, /^menu$/, 'pizza');
  await expect(page.locator('.cf-mcard')).toHaveCount(3);
  await page.locator('.cf-mcard[data-dish="pizza"]').click();
  await stateIs(page, 'cook');
  await expect.poll(() => spoken(page)).toContain('Spread the sauce!');
  await page.locator('.cf-ktools .cf-tool[data-tool="cheese"]').click();
  await expect.poll(() => spoken(page)).toContain("That's the cheese. Spread the sauce!");
  await page.locator('.cf-ktools .cf-tool[data-tool="sauce"]').click();
  await expect(page.locator('.cf-pz')).toHaveAttribute('data-sauce', 'true');
  await expect.poll(() => spoken(page)).toContain('Sprinkle the cheese!');
  await stateIs(page, 'cook');
  await page.locator('.cf-ktools .cf-tool[data-tool="cheese"]').click();
  await stateIs(page, 'topping');
  const [want] = (await page.locator('.cf-work').getAttribute('data-tops')).split(',').map((x) => x.split(':')[0]);
  const other = await page.locator(`.jb-tray [data-item]:not([data-item="${want}"])`).getAttribute('data-item');
  await tapTray(page, other);
  await expect.poll(async () => (await spoken(page)).some((t) => /^That's an? \w+\. \w+, please!$/.test(t))).toBe(true);
  await expect(page.locator('.cf-pz-top')).toHaveCount(0);
  await tapTray(page, want);
  await expect(page.locator('.cf-pz-top')).toHaveCount(1);
  await tapTray(page, want);
  await stateIs(page, 'cook');
  await expect(page.locator('.cf-work')).toHaveAttribute('data-want', 'bake');
  // Chế độ chạy nhanh: bánh nóng rất ngắn — chạm bánh ngay lúc vừa sang "hot" (theo dõi data-state), rồi đếm "Hot! Wait!".
  await page.evaluate(() => {
    const root = document.querySelector('.jb-play');
    new MutationObserver((_, obs) => {
      if (root.dataset.state !== 'hot') return;
      obs.disconnect();
      window.__wrongsBefore = document.querySelectorAll('.boing').length;
      document.querySelector('.cf-work').click();
      window.__hotTapped = true;
    }).observe(root, { attributes: true, attributeFilter: ['data-state'] });
  });
  await page.locator('.cf-oven').click();
  await expect.poll(() => page.evaluate(() => window.__hotTapped === true)).toBe(true);
  await expect.poll(async () => (await spoken(page)).filter((t) => t === 'Hot! Wait!').length).toBeGreaterThanOrEqual(2);
  await stateIs(page, /^(hot|busy|eat)$/);
  await stateIs(page, 'eat');
  // Ra nền lúc ăn: quay lại vẫn đúng món (pizza) trên đĩa.
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await stateIs(page, 'eat');
  await expect(page.locator('.cf-plate .cf-pz')).toHaveCount(1);
});

test('mức 1 pizza: 3 bước, đồ đang cần sáng (cả lò nướng), không có nhân', async ({ page }) => {
  await openChef(page, 1, 2);
  await playUntil(page, /^menu$/, 'pizza');
  await page.locator('.cf-mcard[data-dish="pizza"]').click();
  await stateIs(page, 'cook');
  await expect(page.locator('.cf-ktools .cf-tool')).toHaveCount(2);
  await expect(page.locator('.cf-ktools .cf-tool[data-tool="sauce"]')).toHaveClass(/\blit\b/);
  await page.locator('.cf-ktools .cf-tool[data-tool="sauce"]').click();
  await page.locator('.cf-ktools .cf-tool[data-tool="cheese"]').click({ timeout: 10000 });
  await expect(page.locator('.cf-oven')).toHaveClass(/\blit\b/, { timeout: 10000 });
  await page.locator('.cf-oven').click();
  await stateIs(page, 'eat');
  expect(await spoken(page)).toEqual(expect.arrayContaining(['Spread!', 'Sprinkle!', 'Bake!', 'Hot! Wait!']));
});

test('JOBS5-09: lượt nói bật — KHỚP → "Great talking!" + ⭐; không có lượt nói khi chưa bật', async ({ page }) => {
  await openChef(page, 2, 2, { talk: true, talkResult: 'match' });
  await playUntil(page, /^menu$/);
  // Mức 2: Bông nói mẫu "Yes! I'm hungry!" rồi mời bé nói "I'm hungry!".
  expect(await spoken(page)).toEqual(expect.arrayContaining(["Yes! I'm hungry!", "I'm hungry!", 'Great talking!']));
  await page.locator('.cf-mcard[data-dish="rice-ball"]').click();
  await expect.poll(() => spoken(page)).toEqual(expect.arrayContaining(['A rice ball!', 'Rice ball, please!', "Let's make it!"]));
  await stateIs(page, 'cook');
  expect((await spoken(page)).filter((t) => t === 'Great talking!').length).toBe(2);
  const seen = await page.evaluate(() => window.kidEnglish.settings.chefGame.seen);
  expect(seen['talk:chef'] ?? 0).toBe(0); // ghi khi xong lượt
});

test('JOBS5-09, 16: lượt nói — CÓ TIẾNG → "Good!" + câu đúng; IM LẶNG → chú nói thay; không lần nào tính nhầm', async ({ page }) => {
  await openChef(page, 3, 2, { talk: true, talkResult: 'voice' });
  await playUntil(page, /^menu$/);
  expect(await spoken(page)).not.toContain('Good!'); // mức 3 không có lượt nói "I'm hungry!"
  await page.locator('.cf-mcard[data-dish="pizza"]').click();
  await expect.poll(() => spoken(page)).toEqual(expect.arrayContaining(['Pizza, please!', 'Good!', "Let's make it!"]));
  expect((await spoken(page)).filter((t) => t === 'Pizza, please!').length).toBe(2);
  await stateIs(page, 'cook');
});

test('JOBS5-16: lượt nói IM LẶNG → chú nói thay rồi tự đi tiếp', async ({ page }) => {
  await openChef(page, 2, 2, { talk: true, talkResult: 'silent' });
  await playUntil(page, /^menu$/);
  await page.locator('.cf-mcard[data-dish="rice-ball"]').click();
  await stateIs(page, 'cook');
  expect((await spoken(page)).filter((t) => t === 'Rice ball, please!').length).toBe(2);
  expect(await spoken(page)).not.toContain('Good!');
});

test('JOBS5-15: lượt nói — mic / nhận dạng báo lỗi giữa lượt → đi tiếp ngay, không kẹt', async ({ page }) => {
  await openChef(page, 2, 2, { talk: true, talkResult: 'error' });
  await playUntil(page, /^menu$/);
  await page.locator('.cf-mcard[data-dish="rice-ball"]').click();
  await stateIs(page, 'cook');
  expect(await spoken(page)).toContain("Let's make it!");
  expect(await spoken(page)).not.toContain('Great talking!');
});

test('JOBS5-13: ô lượt nói bật nhưng mic bị từ chối → không có lượt nói, không hỏi lại quyền', async ({ page }) => {
  await openChef(page, 2, 2, { talk: true, mic: false });
  await playUntil(page, /^menu$/);
  await page.locator('.cf-mcard[data-dish="rice-ball"]').click();
  await stateIs(page, 'cook');
  expect(await spoken(page)).toContain("A rice ball! Let's make it!");
  expect(await spoken(page)).not.toContain('Rice ball, please!');
});

test('Cài đặt → Đóng vai nghề: ô "Cho bé nói khi chơi nghề" mặc định tắt, bật được', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  expect(await page.evaluate(() => window.kidEnglish.settings.jobsTalk)).toBe(false);
  await page.evaluate(() => window.kidEnglish.go('parent', { view: 'settings' }));
  const box = page.getByRole('checkbox', { name: /Cho bé nói khi chơi nghề/ });
  await expect(box).not.toBeChecked();
  await box.check();
  await expect.poll(() => page.evaluate(() => window.kidEnglish.settings.jobsTalk)).toBe(true);
});

test('JOBS5-19: ra nền đúng lúc pizza đang nóng → quay lại chạy lại hơi nóng ("Hot! Wait!") rồi bánh ra đĩa', async ({ page }) => {
  await openChef(page, 1, 2);
  await playUntil(page, /^menu$/, 'pizza');
  await page.locator('.cf-mcard[data-dish="pizza"]').click();
  await playUntil(page, /^cook$/, 'pizza');
  // Ra nền ngay lúc vừa sang "hot" (chế độ chạy nhanh: bánh nóng rất ngắn).
  await page.evaluate(() => {
    const root = document.querySelector('.jb-play');
    new MutationObserver((_, obs) => {
      if (root.dataset.state !== 'hot') return;
      obs.disconnect();
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      window.__hidAtHot = true;
    }).observe(root, { attributes: true, attributeFilter: ['data-state'] });
  });
  for (let i = 0; i < 40 && !(await page.evaluate(() => window.__hidAtHot === true)); i++) {
    if ((await play(page).getAttribute('data-state')) === 'cook') await solve(page, 'pizza');
    await page.waitForTimeout(150);
  }
  const hot = (await spoken(page)).filter((t) => t === 'Hot! Wait!').length;
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await stateIs(page, 'eat');
  expect((await spoken(page)).filter((t) => t === 'Hot! Wait!').length).toBeGreaterThan(hot);
  await expect(page.locator('.cf-plate .cf-pz')).toHaveCount(1);
});
