// 🦸 Siêu nhân an toàn (SPEC-safety.md, S1 0.84.0): Bông hỏi, bé chạm ✋ No / 👍 Yes (mức 1) hoặc chọn tranh an toàn
// (mức 2); đúng → câu giải thích (+ giọng tiếng Việt) → thao tác sửa → ⭐; nhầm: Bông đứng sững, gợi ý, không âm "sai".
// Test cố định tình huống bằng window.__kidTest.safetyPlan.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const play = (page) => page.locator('.sf-play');
const stateIs = (page, s) => expect(play(page)).toHaveAttribute('data-state', s, { timeout: 15000 });
const ruleIs = (page, id) => expect(play(page)).toHaveAttribute('data-rule', id, { timeout: 15000 });
const game = (page) => page.evaluate(() => window.kidEnglish.settings.safetyGame);
const setVisible = (page, v) => page.evaluate((x) => {
  Object.defineProperty(document, 'visibilityState', { value: x, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}, v);
const progressOf = (page, id) => page.evaluate((k) => window.kidEnglish.db.get('progress', `safe:${k}`), id);

/** Mở trò; `ids`: cố định tình huống (null = bốc thật); `state`: safetyGame lưu sẵn; `vi`: giọng tiếng Việt. */
async function openSafety(page, { ids = null, level = 1, state = {}, vi = true } = {}) {
  if (ids) await page.addInitScript((list) => { window.__kidTest = { safetyPlan: list.map((id, i) => ({ id, safeLeft: i % 2 === 0 })) }; }, ids);
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(([l, s]) => window.kidEnglish.setSetting('safetyGame', { level: l, rounds: 0, lock: null, ...s }), [level, state]);
  if (!vi) await page.evaluate(() => window.kidEnglish.setSetting('safetyVi', false));
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Siêu nhân an toàn' }).click();
  await expect(play(page)).toBeVisible();
}
/** Làm xong tình huống đang chơi (chọn đúng + thao tác sửa). */
async function solve(page) {
  const s = await play(page).getAttribute('data-state');
  if (s === 'ask') return page.locator(`.sf-btn[data-answer="${await play(page).getAttribute('data-kind')}"]`).click();
  if (s === 'pick') return page.locator('.sf-card[data-safe="true"]').click();
  if (s === 'fix') return page.locator((await page.locator('.sf-sp.sf-drag').count()) ? '.sf-sp.sf-drag' : '.sf-sp.sf-target').first().click();
}
async function finish(page) {
  for (let i = 0; i < 200 && !(await page.locator('.sf-play.jb-done').count()); i++) {
    if (/^(ask|pick|fix)$/.test(await play(page).getAttribute('data-state'))) await solve(page);
    await page.waitForTimeout(120);
  }
  await expect(page.locator('.sf-play.jb-done')).toHaveCount(1, { timeout: 20000 });
}

test('SAFE-01, 13: mức 1 dao — Bông hỏi, chạm ✋ No → "Oops!" + câu giải thích (+ tiếng Việt) → chạm mẹ → mẹ cất dao → ⭐; ghi seen / firstOk / tiến độ', async ({ page }) => {
  await openSafety(page, { ids: ['knife', 'tv-long', 'helmet'] });
  await ruleIs(page, 'knife');
  await stateIs(page, 'ask');
  await expect(page.locator('.sf-btn')).toHaveCount(2);
  await expect.poll(() => spoken(page)).toContain('A knife! Can I touch it?');
  await page.locator('.sf-btn[data-answer="no"]').click();
  await stateIs(page, 'fix');
  const said = await spoken(page);
  expect(said).toContain('Oops!');
  expect(said).toContain('No! Sharp! Call Mommy.');
  expect(said).toContain('Không! Dao sắc lắm! Gọi mẹ nhé.'); // giọng tiếng Việt (mặc định bật)
  await expect(page.locator('.sf-sp.sf-mummy')).toHaveClass(/sf-target/);
  await expect(page.locator('.sf-hand')).toBeVisible(); // mức 1: bàn tay 👆 chỉ
  await page.locator('.sf-sp.sf-mummy').click();
  await expect.poll(() => spoken(page)).toContain('Sharp! Call Mommy.');
  await ruleIs(page, 'tv-long');
  await expect(page.locator('.sf-star.on')).toHaveCount(1);
  const g = await game(page);
  expect(g.seen.knife).toBe(1);
  expect(g.firstOk.knife).toBe(true);
  await expect.poll(() => progressOf(page, 'knife')).toMatchObject({ mastery: 1 });
});

test('SAFE-02, 13: mức 1 dao, chạm 👍 Yes → Bông đứng sững trước dao (không chạm), gợi ý, tính nhầm; lần 2 nói đáp án; đúng rồi không có firstOk, không trừ', async ({ page }) => {
  await openSafety(page, { ids: ['knife', 'tv-long', 'helmet'] });
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="yes"]').click();
  await expect.poll(() => spoken(page)).toContain("Hmm… wait! It's sharp!");
  await expect(page.locator('.sf-sp.sf-bong')).toHaveClass(/freeze/);
  // Bông không bao giờ tới chỗ con dao.
  const bong = await page.locator('.sf-sp.sf-bong').boundingBox();
  const knife = await page.locator('.sf-sp.sf-knife').boundingBox();
  expect(bong.x + bong.width).toBeLessThan(knife.x + knife.width / 2);
  await stateIs(page, 'ask');
  await expect(page.locator('.sf-btn[data-answer="no"]')).toBeEnabled();
  await page.waitForTimeout(500);
  await page.locator('.sf-btn[data-answer="yes"]').click();
  await expect.poll(() => spoken(page)).toContain('Tap No!');
  await page.locator('.sf-btn[data-answer="no"]').click();
  await stateIs(page, 'fix');
  await page.locator('.sf-sp.sf-mummy').click();
  await ruleIs(page, 'tv-long');
  const g = await game(page);
  expect(g.seen.knife).toBe(1);
  expect(g.firstOk.knife).toBeUndefined();
  await expect.poll(async () => (await progressOf(page, 'knife'))?.attempts).toEqual({ right: 0, wrong: 1 });
  expect((await progressOf(page, 'knife')).mastery).toBe(0);
});

test('SAFE-03: mức 1 mũ bảo hiểm (việc nên làm), chạm ✋ No → "It\'s OK! A helmet keeps me safe.", hỏi lại; 👍 Yes → kéo mũ lên đầu Bông → bố tới, "click"', async ({ page }) => {
  await openSafety(page, { ids: ['helmet', 'knife', 'tv-long'] });
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="no"]').click();
  await expect.poll(() => spoken(page)).toContain("It's OK! A helmet keeps me safe.");
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="yes"]').click();
  await stateIs(page, 'fix');
  expect(await spoken(page)).toContain('Yes! Helmet on!');
  // Kéo mũ thật (thả lên Bông).
  await page.waitForTimeout(600); // Bông hết nhún
  const helmet = await page.locator('.sf-sp.sf-helmet').boundingBox();
  await page.mouse.move(helmet.x + helmet.width / 2, helmet.y + helmet.height / 2);
  await page.mouse.down();
  const bong = await page.locator('.sf-sp.sf-bong').boundingBox();
  await page.mouse.move(bong.x + bong.width / 2, bong.y + bong.height / 2, { steps: 8 });
  await page.mouse.up();
  // Chế độ nhanh: mũ đội xong là sang tình huống sau ngay — kiểm tra câu nhắc lại + seen (không bắt class đang đổi).
  await expect.poll(() => spoken(page)).toContain('Helmet on! Click!');
  await ruleIs(page, 'knife');
  expect((await game(page)).seen.helmet).toBe(1);
});

test('SAFE-04: mức 1, bé không chạm gì → Bông tự dừng trước đồ vật, "Should I?"; không tính nhầm', async ({ page }) => {
  await openSafety(page, { ids: ['tv-long', 'knife', 'helmet'] });
  await expect.poll(() => spoken(page), { timeout: 15000 }).toContain('Should I?');
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="no"]').click();
  await stateIs(page, 'fix');
  await page.locator('.sf-sp.sf-tv').click();
  await ruleIs(page, 'knife');
  expect((await game(page)).firstOk['tv-long']).toBe(true);
});

test('SAFE-05, 25: thao tác sửa — chạm chỗ khác không tính nhầm, Bông nhắc việc cần làm; bé không làm gì thì nhắc tối đa 3 lần, không làm hộ', async ({ page }) => {
  await openSafety(page, { ids: ['knife', 'tv-long', 'helmet'] });
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="no"]').click();
  await stateIs(page, 'fix');
  const before = (await spoken(page)).filter((t) => t === 'Call Mommy! Tap Mommy.').length;
  await page.locator('.sf-sp.sf-counter').click();
  await expect.poll(async () => (await spoken(page)).filter((t) => t === 'Call Mommy! Tap Mommy.').length).toBe(before + 1);
  // Chờ (chế độ nhanh): nhắc thêm tối đa 3 lần rồi thôi; vẫn ở bước sửa.
  await page.waitForTimeout(3000);
  const after = (await spoken(page)).filter((t) => t === 'Call Mommy! Tap Mommy.').length;
  expect(after).toBeLessThanOrEqual(before + 1 + 3);
  await stateIs(page, 'fix');
  await page.locator('.sf-sp.sf-mummy').click();
  await ruleIs(page, 'tv-long');
  expect((await game(page)).firstOk.knife).toBe(true); // nhầm ở bước sửa không tính
});

test('SAFE-06: mức 2 — hai tranh to bằng nhau; tranh chưa an toàn không có bố mẹ; chạm tranh đó → rung, mờ, gợi ý, tính nhầm; chạm tranh an toàn → sửa', async ({ page }) => {
  await openSafety(page, { ids: ['cross-alone', 'tv-long', 'helmet'], level: 2 });
  await ruleIs(page, 'cross-alone');
  await stateIs(page, 'pick');
  await expect(page.locator('.sf-card')).toHaveCount(2);
  await expect(page.locator('.jb-tray')).toHaveClass(/off/); // mức 2 không có nút No / Yes
  const [a, b] = await page.locator('.sf-card').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width));
  expect(Math.abs(a - b)).toBeLessThan(2);
  await expect(page.locator('.sf-card[data-safe="false"] .sf-sp.sf-mummy')).toBeHidden();
  await expect(page.locator('.sf-card[data-safe="true"] .sf-sp.sf-mummy')).toBeVisible();
  await page.locator('.sf-card[data-safe="false"]').click();
  await expect.poll(() => spoken(page)).toContain('Hmm… alone? Look again!');
  await expect(page.locator('.sf-card[data-safe="false"]')).toHaveClass(/dim/);
  await page.locator('.sf-card[data-safe="true"]').click();
  await stateIs(page, 'fix');
  expect(await spoken(page)).toContain("No! Hold Mommy's hand.");
  await page.locator('.sf-sp.sf-mummy').click();
  await ruleIs(page, 'tv-long');
  expect((await game(page)).firstOk['cross-alone']).toBeUndefined();
});

test('SAFE-09: bốc thật, đủ 5 tình huống (ưu tiên 🌙: có 2 tình huống 🌙) → 5 ⭐, "Thank you, Safety Hero!" → sticker; rounds +1', async ({ page }) => {
  await openSafety(page);
  await stateIs(page, 'ask');
  await expect(page.locator('.sf-star')).toHaveCount(5);
  const seenRules = new Set();
  for (let i = 0; i < 200 && !(await page.locator('.sf-play.jb-done').count()); i++) {
    seenRules.add(await play(page).getAttribute('data-rule'));
    if (/^(ask|pick|fix)$/.test(await play(page).getAttribute('data-state'))) await solve(page);
    await page.waitForTimeout(120);
  }
  await expect(page.locator('.sf-play.jb-done')).toHaveCount(1, { timeout: 20000 });
  expect(await spoken(page)).toContain('Thank you, Safety Hero!');
  const g = await game(page);
  expect(g.rounds).toBe(1);
  expect(Object.keys(g.seen)).toHaveLength(5);
  expect(['tv-long', 'video-bed', 'stay-up', 'tv-timer', 'bedtime'].filter((id) => g.seen[id])).toHaveLength(2);
});

test('SAFE-10, 11, 18: tắt 🚪 → không gặp người lạ; tắt gần hết (còn < 3 tình huống) → thẻ báo bố mẹ, không vào lượt', async ({ page }) => {
  await openSafety(page, { state: { off: ['stranger'], focus: null } });
  await finish(page);
  const g = await game(page);
  expect(Object.keys(g.seen).filter((id) => ['door', 'candy', 'go-with', 'tell'].includes(id))).toHaveLength(0);
  // Tắt hết chủ đề (chủ đề nào cũng có ≥ 3 tình huống).
  await page.evaluate(() => window.kidEnglish.setSetting('safetyGame', { level: 1, rounds: 0, lock: null, off: ['habits', 'kitchen', 'home', 'road', 'stranger', 'fire', 'shop', 'water', 'dog'] }));
  await page.evaluate(() => window.kidEnglish.go('safety'));
  await stateIs(page, 'empty');
  await expect(page.locator('.sf-empty')).toHaveText('Bố mẹ bật thêm chủ đề trong Cài đặt nhé');
  await expect(page.locator('.jb-tray')).toHaveClass(/off/);
});

test('SAFE-12, 24, 20: ra nền ở bước sửa → quay lại đúng tình huống, đúng bước, đúng mức cũ (dù bố mẹ vừa khóa mức 2); seen chỉ +1', async ({ page }) => {
  await openSafety(page, { ids: ['stove', 'knife', 'tv-long'] });
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="no"]').click();
  await stateIs(page, 'fix');
  await setVisible(page, 'hidden');
  await page.evaluate(() => window.kidEnglish.setSetting('safetyGame', { ...window.kidEnglish.settings.safetyGame, lock: 2, level: 2 }));
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await ruleIs(page, 'stove');
  await stateIs(page, 'fix');
  await expect(page.locator('.jb-tray')).toHaveClass(/off/);
  await page.locator('.sf-sp.sf-bong').click(); // chạm Bông (không kéo) cũng được
  await ruleIs(page, 'knife');
  await stateIs(page, 'ask'); // lượt dở vẫn mức 1 (nút No / Yes)
  expect((await game(page)).seen.stove).toBe(1);
});

test('SAFE-21: ra nền khi Bông đang nói → quay lại nói lại câu hỏi của bước, không kẹt', async ({ page }) => {
  await openSafety(page, { ids: ['tv-long', 'knife', 'helmet'] });
  await ruleIs(page, 'tv-long');
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  const n = (await spoken(page)).filter((t) => t === 'One more cartoon?').length;
  await page.locator('.resume-overlay .start-btn').click();
  await expect.poll(async () => (await spoken(page)).filter((t) => t === 'One more cartoon?').length).toBe(n + 1);
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="no"]').click();
  await stateIs(page, 'fix');
});

test('giọng tiếng Việt tắt trong Cài đặt → chỉ nói tiếng Anh; cảnh cháy: chuông + khói, chạm Bông để cúi thấp', async ({ page }) => {
  await openSafety(page, { ids: ['fire-low', 'knife', 'tv-long'], vi: false });
  await ruleIs(page, 'fire-low');
  await expect(page.locator('.sf-scene')).toHaveAttribute('data-scene', 'smoke');
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="yes"]').click();
  await stateIs(page, 'fix');
  const said = await spoken(page);
  expect(said).toContain('Yes! Get low. Cover your mouth.');
  expect(said).not.toContain('Đúng rồi! Cúi thấp. Che miệng lại.');
  await page.locator('.sf-sp.sf-bong').click();
  await expect(page.locator('.sf-sp.sf-bong')).toHaveClass(/low/);
  await ruleIs(page, 'knife');
});

test('SAFE-15: màn 390 px dọc — hai nút và hai tranh không tràn, cảnh không đè nút', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openSafety(page, { ids: ['knife', 'helmet', 'tv-long'] });
  await stateIs(page, 'ask');
  for (const b of await page.locator('.sf-btn').all()) {
    const box = await b.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    expect(box.height).toBeGreaterThanOrEqual(88);
  }
  const scene = await page.locator('.sf-scene').boundingBox();
  const btn = await page.locator('.sf-btn').first().boundingBox();
  expect(scene.y + scene.height).toBeLessThanOrEqual(btn.y);
  await page.evaluate(() => window.kidEnglish.setSetting('safetyGame', { level: 2, rounds: 0, lock: 2 }));
  await page.evaluate(() => window.kidEnglish.go('safety'));
  await stateIs(page, 'pick');
  for (const c of await page.locator('.sf-card').all()) {
    const box = await c.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  }
});

test('Cài đặt: mục Siêu nhân an toàn — tắt chủ đề, chủ đề ưu tiên, giọng tiếng Việt, khóa mức', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(() => window.kidEnglish.go('parent', { view: 'settings' }));
  const sec = page.locator('section.panel', { has: page.locator('h2', { hasText: 'Siêu nhân an toàn' }) });
  await expect(sec).toBeVisible();
  await sec.locator('input[data-topic="stranger"]').uncheck();
  await expect.poll(() => game(page)).toMatchObject({ off: ['stranger'] });
  await sec.locator('select').nth(1).selectOption('none');
  await expect.poll(async () => (await game(page)).focus).toBeNull();
  await sec.locator('select').nth(0).selectOption('1');
  await expect.poll(async () => (await game(page)).lock).toBe(1);
  await sec.getByLabel('Bông nói thêm câu tiếng Việt (câu hỏi, câu giải thích, việc cần làm)').uncheck();
  await expect.poll(() => page.evaluate(() => window.kidEnglish.settings.safetyVi)).toBe(false);
});

// ---------- S2 (0.85.0): 🛒 💧 🐕, mức 3 (chuyện 2 bước), "Say it!", album huy hiệu, ảnh của bố mẹ, trang bố mẹ ----------
/** Mở trò với kế hoạch đầy đủ (có story / step) và cờ test khác (`kidTest`). */
async function openPlan(page, plan, { state = {}, kidTest = {}, talk = false } = {}) {
  await page.addInitScript(([p, k]) => { window.__kidTest = { safetyPlan: p, ...k }; }, [plan, kidTest]);
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate((s) => window.kidEnglish.setSetting('safetyGame', { level: 1, rounds: 0, lock: null, ...s }), state);
  if (talk) await page.evaluate(() => window.kidEnglish.setSetting('safetyTalk', true));
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Siêu nhân an toàn' }).click();
  await expect(play(page)).toBeVisible();
}
const STORY_PLAN = [
  { id: 'pond', safeLeft: true, story: 0, step: 1 }, { id: 'pond-toy', safeLeft: false, story: 0, step: 2 },
  { id: 'tv-timer', safeLeft: false, story: 1, step: 1 }, { id: 'bedtime', safeLeft: true, story: 1, step: 2 },
];

test('SAFE-S2-01: mức 1 đồ chơi rơi xuống ao — chạm ✋ No → "No! Stay back. Call Daddy." → chạm bố; 🐕 chạm mẹ; 🛒 lost chạm quầy', async ({ page }) => {
  await openSafety(page, { ids: ['pond-toy', 'dog', 'lost'] });
  await ruleIs(page, 'pond-toy');
  await expect(page.locator('.sf-stage > .sf-scene')).toHaveAttribute('data-scene', 'pond');
  await expect.poll(() => spoken(page)).toContain('My toy! Can I get it?');
  await page.locator('.sf-btn[data-answer="no"]').click();
  await stateIs(page, 'fix');
  expect(await spoken(page)).toContain('No! Stay back. Call Daddy.');
  await expect(page.locator('.sf-sp.sf-daddy')).toHaveClass(/sf-target/);
  await page.locator('.sf-sp.sf-daddy').click();
  await expect.poll(() => spoken(page)).toContain('Stay back! Call Daddy.');
  await ruleIs(page, 'dog');
  expect((await game(page)).seen['pond-toy']).toBe(1);
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="no"]').click();
  await stateIs(page, 'fix');
  await page.locator('.sf-sp.sf-mummy').click();
  await ruleIs(page, 'lost');
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="yes"]').click();
  await stateIs(page, 'fix');
  await expect(page.locator('.sf-sp.sf-desk')).toHaveClass(/sf-target/);
  await page.locator('.sf-sp.sf-desk').click();
  await expect(page.locator('.sf-play.jb-done')).toHaveCount(1, { timeout: 20000 });
});

test('SAFE-S2-02: mức 3 (bố mẹ khóa) — "Story time!", chọn tranh; bước 2 "What next?" + hình nhắc lại bước 1; 4 ⭐; giữ mức 3; không có "Say it!" khi chưa bật', async ({ page }) => {
  await openPlan(page, STORY_PLAN, { state: { level: 3, lock: 3 } });
  await ruleIs(page, 'pond');
  await expect.poll(() => spoken(page)).toContain('Story time!');
  await stateIs(page, 'pick');
  await expect(page.locator('.sf-card')).toHaveCount(2);
  await expect(page.locator('.jb-tray')).toHaveClass(/off/);
  await expect(page.locator('.sf-recap')).toBeHidden(); // bước 1: chưa có hình nhắc lại
  await solve(page);
  await stateIs(page, 'fix');
  await solve(page);
  await ruleIs(page, 'pond-toy');
  await expect.poll(() => spoken(page)).toContain('What next?');
  await expect(page.locator('.sf-recap')).toBeVisible();
  await expect(page.locator('.sf-recap .sf-scene')).toHaveAttribute('data-scene', 'pond');
  await stateIs(page, 'pick');
  await expect(page.locator('.sf-recap')).toBeHidden(); // lúc chọn tranh: ẩn để không che tranh
  await finish(page);
  const said = await spoken(page);
  expect(said.filter((t) => t === 'Story time!').length).toBe(2);
  expect(said).toContain('Good night!'); // câu nhắc lại của bước cuối (bedtime)
  const seen = (await game(page)).seen;
  expect(STORY_PLAN.map((p) => seen[p.id])).toEqual([1, 1, 1, 1]);
  expect(said).not.toContain('Say it!');
  await expect.poll(() => game(page)).toMatchObject({ level: 3, lock: 3 });
});

test('SAFE-S2-03: "Say it!" (mức 3, bố mẹ bật) — Bông nói câu ngắn, nghe; khớp → "Great talking!"; ⭐ / tiến độ như thường', async ({ page }) => {
  await openPlan(page, STORY_PLAN, { state: { level: 3, lock: 3 }, talk: true, kidTest: { safetyTalkResult: 'match' } });
  await ruleIs(page, 'pond');
  await stateIs(page, 'pick');
  await solve(page);
  await stateIs(page, 'fix');
  await solve(page);
  await expect.poll(() => spoken(page)).toContain('Great talking!');
  const said = await spoken(page);
  expect(said.lastIndexOf('Say it!')).toBeGreaterThan(said.indexOf('Stay back!'));
  await ruleIs(page, 'pond-toy');
  await expect(page.locator('.sf-star.on')).toHaveCount(1);
  await expect.poll(() => progressOf(page, 'pond')).toMatchObject({ mastery: 1 });
});

test('SAFE-S2-04: "Say it!" lỗi mic → bỏ qua, chơi tiếp', async ({ page }) => {
  await openPlan(page, STORY_PLAN, { state: { level: 3, lock: 3 }, talk: true, kidTest: { safetyTalkResult: 'error' } });
  await stateIs(page, 'pick');
  await solve(page);
  await stateIs(page, 'fix');
  await solve(page);
  await ruleIs(page, 'pond-toy');
  const said = await spoken(page);
  expect(said).toContain('Say it!');
  expect(said).not.toContain('Great talking!');
});

test('SAFE-S2-05: album huy hiệu — chủ đề 🍳 đủ firstOk sau lượt → huy hiệu mới nảy lên, "A new badge!"', async ({ page }) => {
  const firstOk = { stove: true, medicine: true, 'wash-hands': true };
  await openSafety(page, { ids: ['knife', 'tv-long', 'helmet'], state: { firstOk } });
  // Album hiện sau "Thank you, Safety Hero!", trước màn hoan hô (chế độ nhanh: rất ngắn) — ghi lại lúc album hiện.
  await page.evaluate(() => {
    window.__album = null;
    new MutationObserver(() => {
      const el = document.querySelector('.sf-album:not([hidden])');
      if (el && !window.__album) {
        window.__album = [...el.querySelectorAll('.sf-badge')].map((x) => ({ topic: x.dataset.topic, on: x.classList.contains('on'), fresh: x.classList.contains('new') }));
      }
    }).observe(document.body, { subtree: true, childList: true, attributes: true });
  });
  await finish(page);
  await expect.poll(() => spoken(page)).toContain('A new badge!');
  const album = await page.evaluate(() => window.__album);
  expect(album).toHaveLength(9);
  expect(album.filter((x) => x.on).map((x) => x.topic)).toEqual(['kitchen']);
  expect(album.filter((x) => x.fresh).map((x) => x.topic)).toEqual(['kitchen']);
  expect((await game(page)).firstOk.knife).toBe(true);
});

test('SAFE-S2-06: ảnh của bố mẹ — Bông, con dao và nền bếp dùng ảnh đã thay; chưa thay thì vẫn hình vẽ; chạm vẫn đúng chỗ', async ({ page }) => {
  await page.addInitScript(() => { window.__kidTest = { safetyPlan: [{ id: 'knife', safeLeft: true }, { id: 'tv-long', safeLeft: false }, { id: 'helmet', safeLeft: true }] }; });
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(async () => {
    const db = await import('/js/db.js');
    const png = await new Promise((r) => { const c = document.createElement('canvas'); c.width = 60; c.height = 60; c.getContext('2d').fillRect(10, 10, 40, 40); c.toBlob(r, 'image/png'); });
    for (const [lessonId, word] of [['safety:people', 'bong'], ['safety:bg', 'kitchen'], ['safety:items', 'knife']]) {
      await db.setWordImage(window.kidEnglish.db, { lessonId, word, blob: png, mimeType: 'image/png', width: 60, height: 60 });
    }
  });
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Siêu nhân an toàn' }).click();
  await ruleIs(page, 'knife');
  await expect(page.locator('.sf-sp.sf-bong img.sf-img')).toHaveCount(1);
  await expect(page.locator('.sf-sp.sf-knife img.sf-img')).toHaveCount(1);
  await expect(page.locator('.sf-sp.sf-mummy svg')).toHaveCount(1);
  await expect(page.locator('.sf-stage > .sf-scene')).toHaveClass(/pic/);
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="no"]').click();
  await stateIs(page, 'fix');
  await page.locator('.sf-sp.sf-mummy').click();
  await ruleIs(page, 'tv-long');
  await expect(page.locator('.sf-stage > .sf-scene')).not.toHaveClass(/pic/); // phòng khách chưa có ảnh nền
});

test('SAFE-S2-07: Góc bố mẹ — mức 3 + "Say it!" trong Cài đặt; trang "Nói thêm với bé"; trang ảnh; nhóm tiến độ Siêu nhân an toàn', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(() => window.kidEnglish.go('parent', { view: 'settings' }));
  await page.locator('select:has(option:text("chuyện 2 bước"))').selectOption('3');
  await expect.poll(() => game(page)).toMatchObject({ level: 3, lock: 3 });
  await page.getByText('Lượt "Say it!" ở mức 3').click();
  await expect.poll(() => page.evaluate(() => window.kidEnglish.settings.safetyTalk)).toBe(true);
  await page.getByRole('button', { name: '💬 Nói thêm với bé…' }).click();
  await expect(page.locator('.sf-tips li[data-rule="pond-toy"]')).toContainText('bố mẹ lấy');
  await expect(page.locator('.sf-tips li')).toHaveCount(44); // 38 + 6 🫶 (trang gợi ý luôn có 🫶 để bố mẹ đọc trước khi bật)
  await page.evaluate(() => window.kidEnglish.go('parent', { view: 'safety-images' }));
  await expect(page.locator('.sp-admin-item[data-item="dog"]')).toBeVisible();
  await expect(page.locator('.jb-admin-person[data-person="bong"]')).toBeVisible();
  await expect(page.locator('.jb-admin-job[data-scene="pool"]')).toBeVisible();
  await page.evaluate(async () => {
    const t = await import('/js/player/track.js');
    await t.markPhrasePick(window.kidEnglish, 'safe:dog', '🐕', { firstTry: true, award: true });
    await window.kidEnglish.setSetting('safetyGame', { level: 1, rounds: 0, lock: null, firstOk: { dog: true, 'dog-eat': true, 'dog-still': true } });
  });
  await page.evaluate(() => window.kidEnglish.go('parent', { view: 'progress' }));
  await expect(page.getByText(/Siêu nhân an toàn — 1\/38 tình huống đã chơi · huy hiệu 1\/9/)).toBeVisible();
  await expect(page.locator('.progress-list').getByText('Wait! Stay with Mommy.', { exact: false })).toBeVisible();
});

// ---------- 🐕 thêm (0.86.0): chó đang ăn (🚫), chó chạy lại thì đứng yên (✅), chuyện 🐕 → đứng yên ----------
test('SAFE-D-01: mức 1 — chó đang ăn: ✋ → "No! Let the doggy eat." → chạm mẹ; chó chạy lại: 👍 → chạm Bông → đứng yên, chó đi, mẹ tới', async ({ page }) => {
  await openSafety(page, { ids: ['dog-eat', 'dog-still', 'knife'] });
  await ruleIs(page, 'dog-eat');
  await expect(page.locator('.sf-sp.sf-bowl')).toBeVisible();
  await expect.poll(() => spoken(page)).toContain('Doggy is eating. Can I pet it?');
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="no"]').click();
  await stateIs(page, 'fix');
  expect(await spoken(page)).toContain('No! Let the doggy eat.');
  await page.locator('.sf-sp.sf-mummy').click();
  await ruleIs(page, 'dog-still');
  await expect.poll(() => spoken(page)).toContain("Doggy's coming! Stand still?");
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="yes"]').click();
  await stateIs(page, 'fix');
  expect(await spoken(page)).toContain('Yes! Stand still like a tree.');
  await expect(page.locator('.sf-sp.sf-bong')).toHaveClass(/sf-target/);
  await page.locator('.sf-sp.sf-bong').click();
  await expect(page.locator('.sf-sp.sf-bong')).toHaveClass(/still/);
  await expect.poll(() => spoken(page)).toContain('Stand still!');
  await ruleIs(page, 'knife');
  const g = await game(page);
  expect(g.seen['dog-eat']).toBe(1);
  expect(g.firstOk['dog-still']).toBe(true);
});

test('SAFE-D-02: mức 3 — chuyện 🐕: bước 1 không vuốt chó lạ, bước 2 "What next?" chó chạy lại → chọn tranh đứng yên', async ({ page }) => {
  await openPlan(page, [
    { id: 'dog', safeLeft: true, story: 0, step: 1 }, { id: 'dog-still', safeLeft: false, story: 0, step: 2 },
    { id: 'knife', safeLeft: true, story: 1, step: 1 }, { id: 'wash-hands', safeLeft: false, story: 1, step: 2 },
  ], { state: { level: 3, lock: 3 } });
  await ruleIs(page, 'dog');
  await stateIs(page, 'pick');
  await solve(page);
  await stateIs(page, 'fix');
  await solve(page);
  await ruleIs(page, 'dog-still');
  await expect.poll(() => spoken(page)).toContain('What next?');
  await stateIs(page, 'pick');
  await expect(page.locator('.sf-card')).toHaveCount(2);
  await page.locator('.sf-card[data-safe="false"]').click(); // tranh Bông bỏ chạy (chưa an toàn)
  await expect.poll(() => spoken(page)).toContain('Hmm… running away? Look again!');
  await solve(page);
  await stateIs(page, 'fix');
  await solve(page);
  await ruleIs(page, 'knife');
  expect((await game(page)).seen['dog-still']).toBe(1);
});

// ---------- 🫶 Cơ thể của bé (SPEC-body, 0.87.0): bố mẹ bật, luôn No / Yes, tiếng Việt luôn đọc ----------
const BODY_ON = { optIn: ['body'] };

test('BODY-01: mặc định không gặp 🫶; Cài đặt có dòng tắt; bật → hộp xác nhận: Thôi → vẫn tắt, Bật → optIn có body', async ({ page }) => {
  await openSafety(page, { state: { focus: null } });
  await finish(page);
  const g = await game(page);
  expect(Object.keys(g.seen).filter((id) => ['private', 'bath-help', 'doctor', 'hug-no', 'secret', 'no-touch'].includes(id))).toHaveLength(0);
  await page.evaluate(() => window.kidEnglish.go('parent', { view: 'settings' }));
  const box = page.locator('input[data-topic="body"]');
  await expect(box).not.toBeChecked();
  await expect(page.getByText('Cơ thể của bé (tắt — bố mẹ bật khi sẵn sàng)')).toBeVisible();
  await expect(page.locator('select option[value="body"]')).toHaveCount(0); // không là chủ đề ưu tiên
  await box.click();
  await expect(page.locator('.dialog')).toContainText('cơ thể của bé là của bé');
  await page.locator('.dialog').getByRole('button', { name: 'Thôi' }).click();
  await expect(box).not.toBeChecked();
  expect((await game(page)).optIn ?? []).toEqual([]);
  await box.click();
  await page.locator('.dialog').getByRole('button', { name: 'Bật' }).click();
  await expect.poll(async () => (await game(page)).optIn).toEqual(['body']);
  await expect(box).toBeChecked();
  expect((await game(page)).off).toEqual(g.off); // không đụng chủ đề khác
  await box.click(); // tắt: không hỏi
  await expect.poll(async () => (await game(page)).optIn).toEqual([]);
});

test('BODY-02: no-touch — tiếng Việt đọc dù tắt giọng Việt; ✋ → "No! Say NO. Tell Mommy." (không "Oops!") → chạm mẹ → ôm + "không phải lỗi của con"', async ({ page }) => {
  await openSafety(page, { ids: ['no-touch', 'knife', 'private'], state: BODY_ON, vi: false });
  await ruleIs(page, 'no-touch');
  await expect(page.locator('.sf-sp.sf-askbub')).toBeVisible();
  await expect.poll(() => spoken(page)).toContain('Có người chạm vào chỗ đồ bơi che của tớ. Được không?');
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="no"]').click();
  await stateIs(page, 'fix');
  let said = await spoken(page);
  expect(said).toContain('No! Say NO. Tell Mommy.');
  expect(said).toContain('Không! Nói thật to: Không! Rồi kể với bố mẹ, hoặc người lớn con tin.');
  expect(said).not.toContain('Oops!');
  await page.locator('.sf-sp.sf-mummy').click();
  await expect.poll(() => spoken(page)).toContain('Con kể là đúng rồi. Không phải lỗi của con.');
  await ruleIs(page, 'knife');
  await expect.poll(() => spoken(page)).toContain('A knife! Can I touch it?');
  said = await spoken(page);
  expect(said.filter((t) => /Con dao/.test(t))).toHaveLength(0); // tình huống thường: vẫn theo cài đặt (tắt giọng Việt)
  expect((await game(page)).firstOk['no-touch']).toBe(true);
});

test('BODY-03: hug-no → ✋ → chạm bàn tay (đập tay); private: chọn nhầm → câu nhắc nhẹ, không âm sai → 👍 → kéo khăn lên Bông', async ({ page }) => {
  await openSafety(page, { ids: ['hug-no', 'private', 'knife'], state: BODY_ON });
  await ruleIs(page, 'hug-no');
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="no"]').click();
  await stateIs(page, 'fix');
  await expect(page.locator('.sf-sp.sf-five')).toBeVisible();
  await expect(page.locator('.sf-sp.sf-five')).toHaveClass(/sf-target/);
  await page.locator('.sf-sp.sf-five').click();
  await expect.poll(() => spoken(page)).toContain('High five!');
  await ruleIs(page, 'private');
  await expect(page.locator('.sf-sp.sf-bong')).toHaveClass(/swim/);
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="no"]').click();
  await expect.poll(() => spoken(page)).toContain("It's OK! My body is mine.");
  await page.locator('.sf-btn[data-answer="yes"]').click();
  await stateIs(page, 'fix');
  await expect(page.locator('.sf-sp.sf-towel')).toHaveClass(/sf-drag/);
  await solve(page);
  await expect.poll(() => spoken(page)).toContain('My body is mine!');
  await ruleIs(page, 'knife');
  const g = await game(page);
  expect(g.seen.private).toBe(1);
  expect(g.firstOk.private).toBeUndefined();
});

test('BODY-04: mức 2 — tình huống 🫶 vẫn nút No / Yes (không thẻ tranh); tình huống thường vẫn chọn tranh', async ({ page }) => {
  await openSafety(page, { ids: ['secret', 'knife', 'doctor'], state: { ...BODY_ON, level: 2, lock: 2 } });
  await ruleIs(page, 'secret');
  await stateIs(page, 'ask');
  await expect(page.locator('.sf-card')).toHaveCount(0);
  await expect(page.locator('.jb-tray')).not.toHaveClass(/off/);
  await page.locator('.sf-btn[data-answer="no"]').click();
  await stateIs(page, 'fix');
  await page.locator('.sf-sp.sf-mummy').click();
  await ruleIs(page, 'knife');
  await stateIs(page, 'pick');
  await expect(page.locator('.sf-card')).toHaveCount(2);
  await solve(page);
  await stateIs(page, 'fix');
  await solve(page);
  await ruleIs(page, 'doctor');
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="yes"]').click();
  await stateIs(page, 'fix');
  await page.locator('.sf-sp.sf-daddy').click();
  await expect.poll(() => spoken(page)).toContain('Daddy is here!');
});

test('BODY-05: album 10 ô khi bật (huy hiệu 🫶 mới); tắt lại → huy hiệu ẩn, firstOk còn; trang gợi ý có "Nếu bé kể với bạn", "Bố mẹ không nên nói"', async ({ page }) => {
  const firstOk = { 'hug-no': true, secret: true, 'no-touch': true };
  await openSafety(page, { ids: ['private', 'bath-help', 'doctor'], state: { ...BODY_ON, firstOk } });
  await page.evaluate(() => {
    window.__album = null;
    new MutationObserver(() => {
      const el = document.querySelector('.sf-album:not([hidden])');
      if (el && !window.__album) window.__album = [...el.querySelectorAll('.sf-badge')].map((x) => ({ topic: x.dataset.topic, fresh: x.classList.contains('new') }));
    }).observe(document.body, { subtree: true, childList: true, attributes: true });
  });
  await finish(page);
  await expect.poll(() => spoken(page)).toContain('A new badge!');
  const album = await page.evaluate(() => window.__album);
  expect(album).toHaveLength(10);
  expect(album.filter((x) => x.fresh).map((x) => x.topic)).toEqual(['body']);
  await page.evaluate(() => window.kidEnglish.go('parent', { view: 'settings' }));
  await expect(page.getByText(/Huy hiệu: 1\/10/)).toBeVisible();
  await page.locator('input[data-topic="body"]').click(); // tắt lại
  await expect.poll(async () => (await game(page)).optIn).toEqual([]);
  await page.evaluate(() => window.kidEnglish.go('parent', { view: 'settings' }));
  await expect(page.getByText(/Huy hiệu: 0\/9/)).toBeVisible();
  expect((await game(page)).firstOk.private).toBe(true);
  await page.evaluate(() => window.kidEnglish.go('parent', { view: 'safety-tips' }));
  await expect(page.getByRole('heading', { name: 'Nếu bé kể với bạn' })).toBeVisible();
  await expect(page.locator('.sf-told li')).toHaveCount(8);
  await expect(page.locator('.sf-told')).toContainText('111');
  await expect(page.locator('.sf-dont li')).toHaveCount(4);
});

test('BODY-06: ra nền giữa lượt có 2 tình huống 🫶 → vào lại đúng tình huống, đúng bước, kế hoạch giữ nguyên', async ({ page }) => {
  await openSafety(page, { ids: ['secret', 'knife', 'no-touch'], state: BODY_ON });
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="no"]').click();
  await stateIs(page, 'fix');
  await setVisible(page, 'hidden');
  await setVisible(page, 'visible');
  await page.locator('.resume-overlay .start-btn').click();
  await ruleIs(page, 'secret');
  await stateIs(page, 'fix');
  await page.locator('.sf-sp.sf-mummy').click();
  await ruleIs(page, 'knife');
  await solve(page);
  await stateIs(page, 'fix');
  await solve(page);
  await ruleIs(page, 'no-touch');
  expect((await game(page)).seen.secret).toBe(1);
});

test('BODY-07: ảnh bố mẹ thay bồn tắm, nền phòng tắm → câu, đáp án, thao tác không đổi', async ({ page }) => {
  await page.addInitScript(() => { window.__kidTest = { safetyPlan: [{ id: 'bath-help', safeLeft: true }, { id: 'knife', safeLeft: true }, { id: 'tv-long', safeLeft: false }] }; });
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(async () => {
    const db = await import('/js/db.js');
    const png = await new Promise((r) => { const c = document.createElement('canvas'); c.width = 60; c.height = 30; c.getContext('2d').fillRect(5, 5, 50, 20); c.toBlob(r, 'image/png'); });
    for (const [lessonId, word] of [['safety:items', 'tub'], ['safety:bg', 'bath']]) {
      await db.setWordImage(window.kidEnglish.db, { lessonId, word, blob: png, mimeType: 'image/png', width: 60, height: 30 });
    }
    await window.kidEnglish.setSetting('safetyGame', { level: 1, rounds: 0, lock: null, optIn: ['body'] });
  });
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Siêu nhân an toàn' }).click();
  await ruleIs(page, 'bath-help');
  await expect(page.locator('.sf-sp.sf-tub img.sf-img')).toHaveCount(1);
  await expect(page.locator('.sf-stage > .sf-scene')).toHaveClass(/pic/);
  await expect.poll(() => spoken(page)).toContain('Mommy helps me wash. OK?');
  await stateIs(page, 'ask');
  await page.locator('.sf-btn[data-answer="yes"]').click();
  await stateIs(page, 'fix');
  await page.locator('.sf-sp.sf-duck').click();
  await expect.poll(() => spoken(page)).toContain('Mommy helps!');
  await ruleIs(page, 'knife');
});
