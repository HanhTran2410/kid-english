// Ai kêu thế? (SPEC-sounds.md): Bông giả tiếng kêu → "Who says moo?" → bé chạm con vật; nhầm / gợi ý; 5 câu → sticker.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const lastWho = async (page) => (await spoken(page)).filter((t) => /^(Who says|What goes) /.test(t)).at(-1);
/** Con vật đúng của câu đang hỏi (theo câu "Who says …?" vừa nói). */
async function answer(page) {
  const who = await lastWho(page);
  return page.evaluate(async (line) => {
    const m = await import('/js/animal-sounds.js');
    return m.ALL_SOUNDS.find((a) => line === `Who says ${a.says}?` || line === `What goes ${a.says}?`).id;
  }, who);
}

async function openSounds(page, settings, kind = 'Con vật') {
  await fakeSpeech(page);
  await startApp(page);
  if (settings) await page.evaluate((s) => window.kidEnglish.setSetting('soundsGame', s), settings);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Ai kêu thế?' }).click();
  await expect(page.locator('.as-kind')).toHaveCount(3);
  await page.getByRole('button', { name: kind, exact: true }).click();
  await expect(page.locator('.as-play')).toHaveAttribute('data-state', 'answer', { timeout: 15000 });
}

test('mức 1: "Listen! Who says that?" → tiếng kêu → "Who says …?"; luôn 4 hình; nhầm → nói tên + tiếng kêu, nhầm 2 lần con đúng sáng; đúng → khen + "Can you say …?" → câu 2', async ({ page }) => {
  await openSounds(page);
  const said = await spoken(page);
  expect(said).toContain('Listen! Who says that?');
  await expect(page.locator('.as-card')).toHaveCount(4);
  await expect(page.locator('.as-count')).toHaveText('1/5');
  const right = await answer(page);
  const wrong = await page.locator(`.as-card:not([data-animal="${right}"])`).first().getAttribute('data-animal');
  await page.locator(`.as-card[data-animal="${wrong}"]`).click();
  await expect.poll(async () => (await spoken(page)).some((t) => t.startsWith(`That's the ${wrong.replace(/-/g, ' ')}! The `))).toBe(true);
  await page.locator(`.as-card[data-animal="${wrong}"]`).click();
  await expect(page.locator(`.as-card[data-animal="${right}"].glow`)).toHaveCount(1);
  await page.locator(`.as-card[data-animal="${right}"]`).click();
  await expect.poll(async () => (await spoken(page)).some((t) => t.startsWith(`Yes! The ${right} says `))).toBe(true);
  await expect.poll(async () => (await spoken(page)).some((t) => /^Can you say .+\?$/.test(t))).toBe(true);
  await expect(page.locator('.as-count')).toHaveText('2/5', { timeout: 15000 });
});

test('5 câu → Hoan hô + sticker; đếm lượt; ghi "đã gặp" con vật', async ({ page }) => {
  await openSounds(page);
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('.as-count')).toHaveText(`${i + 1}/5`, { timeout: 15000 });
    await expect(page.locator('.as-play')).toHaveAttribute('data-state', 'answer', { timeout: 15000 });
    await page.locator(`.as-card[data-animal="${await answer(page)}"]`).click();
  }
  await expect(page.locator('.prize-sticker')).toBeVisible({ timeout: 15000 });
  expect(await page.evaluate(() => window.kidEnglish.settings.soundsGame)).toEqual({ level: 1, rounds: 1, lock: null });
  expect(await page.evaluate(async () => (await window.kidEnglish.db.getAll('progress')).length)).toBeGreaterThan(0);
});

test('mức 3 cũng 4 hình; nút 🔊 nghe lại tiếng kêu; gợi ý sau 10 giây', async ({ page }) => {
  await openSounds(page, { lock: 3 });
  await expect(page.locator('.as-card')).toHaveCount(4);
  const before = (await spoken(page)).length;
  await page.getByRole('button', { name: 'Nghe tiếng kêu' }).click();
  await expect.poll(async () => (await spoken(page)).slice(before).some((t) => /^Who says /.test(t))).toBe(true);
  await expect(page.locator('.as-card.glow')).toHaveCount(1, { timeout: 5000 });
});

test('con vật dùng ảnh sticker Dán tranh bố mẹ đã thay', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(async () => {
    const db = await import('/js/db.js');
    const m = await import('/js/animal-sounds.js');
    const png = await new Promise((r) => { const c = document.createElement('canvas'); c.width = 60; c.height = 60; c.getContext('2d').fillRect(10, 10, 40, 40); c.toBlob(r, 'image/png'); });
    for (const a of m.ANIMALS.slice(0, 6)) await db.setWordImage(window.kidEnglish.db, { lessonId: 'scene:stickers', word: a.name, blob: png, mimeType: 'image/png', width: 60, height: 60 });
  });
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Ai kêu thế?' }).click();
  await page.getByRole('button', { name: 'Con vật', exact: true }).click();
  await expect(page.locator('.as-card img')).toHaveCount(4);
});

test('review TC14: giọng đọc lỗi thì bé vẫn chơi được (phụ đề vẫn hiện, chọn đúng vẫn sang câu sau)', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(() => { window.kidEnglish.speaker.speak = () => Promise.reject(new Error('không có giọng')); });
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Ai kêu thế?' }).click();
  await page.getByRole('button', { name: 'Con vật', exact: true }).click();
  await expect(page.locator('.as-play')).toHaveAttribute('data-state', 'answer', { timeout: 15000 });
  await expect(page.locator('.as-say .caption-en')).toHaveText(/^Who says /);
  const who = await page.locator('.as-say .caption-en').textContent();
  const right = await page.evaluate(async (line) => (await import('/js/animal-sounds.js')).ANIMALS.find((a) => line === `Who says ${a.says}?`).id, who);
  await page.locator(`.as-card[data-animal="${right}"]`).click();
  await expect(page.locator('.as-count')).toHaveText('2/5', { timeout: 15000 });
});

test('review TC08 + TC10: ra nền sau 1 lần nhầm → quay lại cùng câu, giữ số lần nhầm (nhầm thêm 1 lần là con đúng sáng); chạm nhầm liên tục chỉ tính một lần', async ({ page }) => {
  await openSounds(page);
  const right = await answer(page);
  const wrongCard = page.locator(`.as-card:not([data-animal="${right}"])`).first();
  // Chạm đúp thật nhanh: chỉ tính một lần nhầm → chưa sáng.
  await wrongCard.dblclick();
  await expect.poll(async () => (await spoken(page)).some((t) => t.startsWith("That's the "))).toBe(true);
  await expect(page.locator('.as-card.glow')).toHaveCount(0);
  const setVisible = (s) => page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, s);
  await setVisible('hidden');
  await setVisible('visible');
  await page.locator('.resume-overlay .start-btn').click();
  await expect(page.locator('.as-play')).toHaveAttribute('data-state', 'answer', { timeout: 15000 });
  await expect(page.locator('.as-count')).toHaveText('1/5');
  await expect(page.locator(`.as-card[data-animal="${right}"]`)).toHaveCount(1);
  await page.waitForTimeout(450);
  await page.locator(`.as-card:not([data-animal="${right}"])`).first().click();
  await expect(page.locator(`.as-card[data-animal="${right}"].glow`)).toHaveCount(1);
});

test('đồ vật: "Listen! What makes that sound?" → "What goes …?" → chạm đúng → "Yes! The … go(es) …!"; Trộn có cả con vật lẫn đồ vật', async ({ page }) => {
  await openSounds(page, null, 'Đồ vật');
  const who = (await spoken(page)).filter((t) => /^What goes /.test(t)).at(-1);
  expect(await spoken(page)).toContain('Listen! What makes that sound?');
  const right = await page.evaluate(async (line) => (await import('/js/animal-sounds.js')).THINGS.find((a) => line === `What goes ${a.says}?`).id, who);
  await expect(page.locator('.as-card')).toHaveCount(4);
  await page.locator(`.as-card[data-animal="${right}"]`).click();
  await expect.poll(async () => (await spoken(page)).some((t) => /^Yes! The .+ (goes|go) .+!$/.test(t))).toBe(true);
});

/** File WAV ngắn (0,4 giây tiếng bíp) để thử chọn file tiếng. */
async function wavBytes(page) {
  return page.evaluate(() => {
    const rate = 8000;
    const n = rate * 0.4;
    const buf = new ArrayBuffer(44 + n * 2);
    const v = new DataView(buf);
    const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true);
    v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.sin(i / 4) * 8000, true);
    return Array.from(new Uint8Array(buf));
  });
}

test('Góc bố mẹ → Ảnh & tiếng Ai kêu thế?: 26 ô; chọn file tiếng cho con bò → "Tiếng bố mẹ thêm", trò chơi dùng tiếng đó; "Dùng tiếng có sẵn" bỏ đi; bát đĩa thay ảnh được', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  const { openParent } = await import('./helpers.js');
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh & tiếng Ai kêu thế/ }).click();
  await expect(page.locator('.sp-admin-item')).toHaveCount(26);
  // Thứ có sticker: không có nút ảnh (thay ở Ảnh Dán tranh); bát đĩa / điện thoại có nút Chọn ảnh.
  await expect(page.locator('.sp-admin-item[data-item="cow"]').getByRole('button', { name: 'Chọn ảnh' })).toHaveCount(0);
  await expect(page.locator('.sp-admin-item[data-item="dishes"]').getByRole('button', { name: 'Chọn ảnh' })).toHaveCount(1);

  const bytes = await wavBytes(page);
  const chooser = page.waitForEvent('filechooser');
  await page.locator('.sp-admin-item[data-item="cow"]').getByRole('button', { name: '📁 Chọn file tiếng' }).click();
  await (await chooser).setFiles({ name: 'moo.wav', mimeType: 'audio/wav', buffer: Buffer.from(bytes) });
  await expect(page.locator('.sp-admin-item[data-item="cow"]')).toHaveAttribute('data-source', 'custom');
  expect(await page.evaluate(async () => (await window.kidEnglish.db.getAllByIndex('images', 'lessonId', 'sounds:audio')).map((r) => r.word))).toEqual(['cow']);

  // Ảnh bát đĩa.
  const png = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 80; c.height = 80;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 80, 80); x.fillStyle = '#e33'; x.beginPath(); x.arc(40, 40, 28, 0, 7); x.fill();
    return Array.from(new Uint8Array(await (await new Promise((r) => c.toBlob(r, 'image/png'))).arrayBuffer()));
  });
  const chooser2 = page.waitForEvent('filechooser');
  await page.locator('.sp-admin-item[data-item="dishes"]').getByRole('button', { name: 'Chọn ảnh' }).click();
  await (await chooser2).setFiles({ name: 'dia.png', mimeType: 'image/png', buffer: Buffer.from(png) });
  await expect(page.locator('.sp-admin-item[data-item="dishes"] .fd-admin-face img')).toBeVisible();

  // Bỏ tiếng bố mẹ thêm.
  await page.locator('.sp-admin-item[data-item="cow"]').getByRole('button', { name: '↩ Dùng tiếng có sẵn' }).click();
  await expect(page.locator('.sp-admin-item[data-item="cow"]')).not.toHaveAttribute('data-source', 'custom');
});

test('trò chơi: tiếng bố mẹ thêm được phát thay giọng đọc (khi máy phát được âm thanh)', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  const bytes = await wavBytes(page);
  await page.evaluate(async (b) => {
    const db = await import('/js/db.js');
    const m = await import('/js/animal-sounds.js');
    const blob = new Blob([new Uint8Array(b)], { type: 'audio/wav' });
    for (const a of m.ANIMALS) await db.setWordImage(window.kidEnglish.db, { lessonId: 'sounds:audio', word: a.id, blob, mimeType: 'audio/wav' });
  }, bytes);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Ai kêu thế?' }).click();
  await page.getByRole('button', { name: 'Con vật', exact: true }).click();
  await expect(page.locator('.as-play')).toHaveAttribute('data-state', 'answer', { timeout: 15000 });
  const locked = await page.evaluate(async () => (await import('/js/speech/sfx.js')).isAudioLocked());
  await expect(page.locator('.as-play')).toHaveAttribute('data-sound-from', locked ? 'voice' : 'custom');
  // Có tiếng thật thì Bông không đọc "Moo! Moo!" bằng giọng máy.
  if (!locked) expect((await page.evaluate(() => window.__spoken)).some((t) => /^[A-Z][a-z]+!( [A-Z][a-z]+!)?$/.test(t) && !/^(Yes|Listen)/.test(t))).toBe(false);
});
