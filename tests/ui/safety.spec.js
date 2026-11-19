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
  await page.evaluate(() => window.kidEnglish.setSetting('safetyGame', { level: 1, rounds: 0, lock: null, off: ['habits', 'kitchen', 'home', 'road', 'stranger', 'fire'] }));
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
