// Đếm hình mới (SPEC-shapes2.md): thẻ "More shapes" sau Đếm hình, giới thiệu hình (câu nhận dạng / đếm góc trên thẻ mẫu),
// chạm hình dễ nhầm nháy cùng thẻ mẫu, lần nhầm tính theo hình khác nhau + nhắc một lần, mức riêng (shapeCount2), ▶ khi đang đếm góc.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const card = (page) => page.locator('.sc-card');
const question = async (page) => ({ picture: await card(page).getAttribute('data-picture'), kind: await card(page).getAttribute('data-kind') });
const tapShape = (page, sel) => page.evaluate((s) => document.querySelector(s).dispatchEvent(new MouseEvent('click', { bubbles: true })), sel);
const shapeSel = (id) => `.sc-pic [data-shape="${id}"]:not(.sc-pad)`;
const ids = (page, sel) => page.locator(sel).evaluateAll((els) => els.map((e) => e.dataset.shape));
const PLURAL = { oval: 'ovals', diamond: 'diamonds', trapezoid: 'trapezoids', parallelogram: 'parallelograms', pentagon: 'pentagons', hexagon: 'hexagons', octagon: 'octagons', semicircle: 'semicircles' };
const LEVEL1 = ['oval', 'diamond', 'trapezoid', 'parallelogram'];
const ALL = Object.keys(PLURAL);

async function openMoreShapes(page, settings) {
  await fakeSpeech(page);
  await startApp(page);
  if (settings) await page.evaluate((s) => window.kidEnglish.setSetting('shapeCount2', s), settings);
  await page.getByRole('button', { name: 'Số đếm' }).click();
  await page.getByRole('button', { name: 'More shapes' }).click();
  await expect(card(page)).toBeVisible();
}
/** Chờ Bông hỏi "How many …?" của câu đang hiện. */
async function asked(page) {
  const q = await question(page);
  await expect.poll(async () => (await spoken(page)).at(-1), { timeout: 15_000 }).toBe(`How many ${PLURAL[q.kind]}?`);
  return q;
}

test('thẻ More shapes nằm sau Count the shapes; câu đầu: This is …, câu nhận dạng, Find a …, rồi đếm', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Số đếm' }).click();
  // Danh sách bài số: "More shapes" ngay sau "Count the shapes". Thẻ được dựng dần (mỗi thẻ tra ảnh bìa): chờ đủ thẻ rồi mới đọc.
  await expect(page.locator('.lesson-card[aria-label="More shapes"]')).toBeVisible();
  const titles = await page.locator('.lesson-card').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  expect(titles.indexOf('More shapes')).toBe(titles.indexOf('Count the shapes') + 1);
  await page.getByRole('button', { name: 'More shapes' }).click();
  await expect(card(page)).toBeVisible();
  const { kind } = await question(page);
  expect(LEVEL1).toContain(kind);
  await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(/^This is an? [a-z]+!$/));
  const idLines = ['It leans over!', 'Pointy top, pointy bottom!', 'Short top, long bottom!', "It's like an egg!"];
  await expect.poll(async () => (await spoken(page)).filter((t) => idLines.includes(t)).length).toBe(1);
  await expect.poll(async () => (await spoken(page)).at(-1)).toMatch(/^Find an? [a-z]+!$/);
  await tapShape(page, `.sc-pic [data-kind="${kind}"]:not(.sc-pad)`);
  await asked(page);
  const list = await ids(page, `.sc-pic [data-kind="${kind}"]:not(.sc-pad)`);
  // Đếm tới hình trước hình cuối: mỗi hình một huy hiệu số (chạm hình cuối là app khen rồi sang câu sau ngay).
  for (const id of list.slice(0, -1)) await tapShape(page, shapeSel(id));
  await expect(page.locator('.sc-badge')).toHaveCount(list.length - 1);
  await tapShape(page, shapeSel(list.at(-1)));
  await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(/Great counting!$/));
});

test('chạm nhầm: hình dễ nhầm nháy cùng thẻ mẫu; chạm lại cùng hình không tính; 3 hình sai khác nhau thì nhắc một lần', async ({ page }) => {
  await openMoreShapes(page, { seen: LEVEL1 });
  // Tìm câu có ít nhất 3 hình sai (bỏ qua câu khác bằng ▶).
  let q;
  let wrong;
  for (let tries = 0; tries < 5; tries++) {
    q = await asked(page);
    wrong = await ids(page, `.sc-pic [data-shape]:not(.sc-pad):not([data-kind="${q.kind}"])`);
    if (wrong.length >= 3) break;
    await page.locator('.next-btn').click();
    await expect.poll(async () => JSON.stringify(await question(page))).not.toBe(JSON.stringify(q));
  }
  expect(wrong.length).toBeGreaterThanOrEqual(3);
  const kindOf = (id) => page.locator(shapeSel(id)).getAttribute('data-kind');
  // Hình dễ nhầm đầu tiên (nếu có) → nháy cùng thẻ mẫu.
  const confuse = { oval: ['circle'], diamond: ['square'], trapezoid: ['rectangle', 'triangle'], parallelogram: ['rectangle', 'diamond'] }[q.kind];
  const order = [...wrong];
  for (const id of wrong) if (confuse.includes(await kindOf(id))) order.unshift(order.splice(order.indexOf(id), 1)[0]);
  const [a, b, c] = order;
  await tapShape(page, shapeSel(a));
  await expect.poll(() => spoken(page)).toContain(`That's ${/^[aeiou]/.test(await kindOf(a)) ? 'an' : 'a'} ${await kindOf(a)}!`);
  if (confuse.includes(await kindOf(a))) {
    await expect(page.locator(`${shapeSel(a)}.sc-compare`)).toHaveCount(1);
    await expect(page.locator('.sc-target.sc-compare')).toHaveCount(1);
  }
  // A lần nữa, rồi B: mới 2 lần nhầm → chưa nhắc.
  await tapShape(page, shapeSel(a));
  await tapShape(page, shapeSel(b));
  await page.waitForTimeout(300);
  const remind = /^Find the [a-z]+! /;
  expect((await spoken(page)).filter((t) => remind.test(t))).toHaveLength(0);
  await expect(page.locator('.sc-counter')).toHaveText('0');
  // C: 3 hình sai khác nhau → nhắc; hình sai thứ 4 / chạm lại không nhắc nữa.
  await tapShape(page, shapeSel(c));
  await expect.poll(async () => (await spoken(page)).filter((t) => remind.test(t)).length).toBe(1);
  for (const id of wrong) await tapShape(page, shapeSel(id));
  await page.waitForTimeout(300);
  expect((await spoken(page)).filter((t) => remind.test(t))).toHaveLength(1);
});

test('mức 2 (khóa): hình nhiều góc lần đầu trong lượt → góc trên thẻ mẫu sáng lần lượt + "… has N corners!"; mức riêng', async ({ page }) => {
  await openMoreShapes(page, { lock: 2, seen: ALL });
  const corners = { pentagon: 5, hexagon: 6, octagon: 8 };
  const said = new Set();
  for (let step = 0; step < 5; step++) {
    const q = await asked(page);
    if (corners[q.kind] && !said.has(q.kind)) {
      said.add(q.kind);
      const word = { 5: 'five', 6: 'six', 8: 'eight' }[corners[q.kind]];
      expect(await spoken(page)).toContainEqual(expect.stringMatching(new RegExp(`^An? ${q.kind} has ${word} corners!$`)));
      await expect(page.locator('.sc-target .sc-corner')).toHaveCount(corners[q.kind]);
      await expect(page.locator('.sc-target .sc-corner.lit')).toHaveCount(corners[q.kind]);
    }
    for (const id of await ids(page, `.sc-pic [data-kind="${q.kind}"]:not(.sc-pad)`)) await tapShape(page, shapeSel(id));
    await expect(page.locator('.sc-choices .numeral-choice')).toHaveCount(3);
    await page.locator('.next-btn').click();
    if (step < 4) await expect.poll(async () => JSON.stringify(await question(page))).not.toBe(JSON.stringify(q));
  }
  expect(said.size).toBeGreaterThanOrEqual(1);
  // Mức của Đếm hình cũ không bị đụng tới.
  expect(await page.evaluate(() => window.kidEnglish.settings.shapeCount)).toBeFalsy();
});

test('▶ khi đang đếm góc: sang câu sau ngay, không đếm tiếp', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate((s) => window.kidEnglish.setSetting('shapeCount2', s), { lock: 2, seen: ALL });
  // Giữ câu "One!" lại tới khi bị hủy (▶), để chạm ▶ đúng lúc đang đếm góc. Phải chặn ở `speaker.speak`: giọng đọc
  // của máy không báo đọc xong thì app vẫn tự đi tiếp sau một lúc (để bé không bị kẹt). Cài TRƯỚC khi mở bài: câu hỏi
  // đầu có thể là hình nhiều góc, mở bài rồi mới cài thì Bông đã đếm xong.
  await page.evaluate(() => {
    const sp = window.kidEnglish.speaker;
    const speak = sp.speak.bind(sp);
    sp.speak = (text, opts = {}) => {
      if (text !== 'One!') return speak(text, opts);
      window.__spoken.push(text);
      return new Promise((_, reject) => opts.signal?.addEventListener('abort', () => reject(new DOMException('Đã dừng', 'AbortError')), { once: true }));
    };
  });
  await page.getByRole('button', { name: 'Số đếm' }).click();
  await page.getByRole('button', { name: 'More shapes' }).click();
  await expect(card(page)).toBeVisible();
  // Bỏ qua tới câu có hình nhiều góc đang được đếm góc.
  for (let tries = 0; tries < 5; tries++) {
    const q = await question(page);
    if (['pentagon', 'hexagon', 'octagon'].includes(q.kind)) {
      await expect.poll(async () => (await spoken(page)).at(-1)).toBe('One!');
      const before = (await spoken(page)).length;
      await page.locator('.next-btn').click();
      await expect.poll(async () => JSON.stringify(await question(page))).not.toBe(JSON.stringify(q));
      const after = (await spoken(page)).slice(before);
      expect(after).not.toContain('Two!');
      return;
    }
    await page.locator('.next-btn').click();
    await expect.poll(async () => JSON.stringify(await question(page))).not.toBe(JSON.stringify(q));
  }
  throw new Error('không gặp câu hình nhiều góc');
});

test('lượt 5 câu → sticker; ghi lượt vào shapeCount2 (không phải shapeCount)', async ({ page }) => {
  await openMoreShapes(page, { seen: LEVEL1 });
  for (let step = 0; step < 5; step++) {
    const q = await asked(page);
    for (const id of await ids(page, `.sc-pic [data-kind="${q.kind}"]:not(.sc-pad)`)) await tapShape(page, shapeSel(id));
    await expect.poll(async () => (await spoken(page)).filter((t) => /Great counting!$/.test(t)).length).toBe(step + 1);
  }
  await expect(page.locator('.prize-sticker')).toBeVisible();
  expect((await page.evaluate(() => window.kidEnglish.settings.shapeCount2)).rounds).toBe(1);
  expect(await page.evaluate(() => window.kidEnglish.settings.shapeCount)).toBeFalsy();
});
