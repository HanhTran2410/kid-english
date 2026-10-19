// Bông trốn tìm (SPEC-hide.md): đếm → tìm (nhầm + bất ngờ, tai gợi ý) → tìm thấy; túi giới từ; chạm khi đang đếm;
// đổi phòng; đổi vai (có / không tên); giảm chuyển động; quay lại sau khi app ra nền.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const state = (page) => page.locator('.hs-play').getAttribute('data-state');
const waitState = (page, s, timeout = 15000) => expect(page.locator('.hs-play')).toHaveAttribute('data-state', s, { timeout });
const hidden = (page) => page.locator('.hs-scene').getAttribute('data-hide');
const roomId = (page) => page.locator('.hs-scene').getAttribute('data-room');

/** Điểm trên màn hình của một chỗ nấp (điểm không bị ô nhỏ hơn che). */
const spotXY = (page, id) => page.evaluate(async (spotId) => {
  const m = await import('/js/hide-seek.js');
  const scene = document.querySelector('.hs-scene');
  const p = m.spotPoint(m.ROOM_BY_ID.get(scene.dataset.room), spotId);
  const r = scene.getBoundingClientRect();
  return { x: r.left + (p.x / m.W) * r.width, y: r.top + (p.y / m.H) * r.height };
}, id);
async function tapSpot(page, id) {
  const { x, y } = await spotXY(page, id);
  await page.mouse.click(x, y);
}
const spotsOf = (page) => page.evaluate(async () => {
  const m = await import('/js/hide-seek.js');
  return m.ROOM_BY_ID.get(document.querySelector('.hs-scene').dataset.room).spots.map((s) => ({ id: s.id, phrase: s.phrase }));
});
async function wrongSpot(page, n = 0) {
  const hide = await hidden(page);
  return (await spotsOf(page)).filter((s) => s.id !== hide)[n];
}

async function openHide(page, settings = {}) {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(async (s) => { for (const [k, v] of Object.entries(s)) await window.kidEnglish.setSetting(k, v); }, settings);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Bông trốn tìm' }).click();
  await waitState(page, 'searching');
}

test('một lượt: mở đầu, đếm 1–5, "Where is Bông?"; chạm nhầm → bất ngờ rồi "Not …!"; chạm đúng → Peekaboo, cụm giới từ, khóa chạm', async ({ page }) => {
  await openHide(page);
  const said = await spoken(page);
  expect(said).toContain("Let's play hide and seek! Close your eyes!");
  expect(said.filter((t) => /^(One|Two|Three|Four|Five)!$/.test(t))).toEqual(['One!', 'Two!', 'Three!', 'Four!', 'Five!']);
  expect(said).toContain('Ready or not, here I come! Where is Bông?');
  // Mức Dễ: tai thò ra ngay, đúng chỗ Bông nấp.
  const hide = await hidden(page);
  await expect(page.locator('.hs-ears')).toBeVisible();
  await expect(page.locator('.hs-ears')).toHaveAttribute('data-spot', hide);

  const wrong = await wrongSpot(page);
  await tapSpot(page, wrong.id);
  await expect(page.locator('.hs-surprise')).toHaveCount(1);
  await expect.poll(() => spoken(page)).toContainEqual(expect.stringMatching(new RegExp(`^Not ${wrong.phrase}!( Hee hee!)?$`)));
  await expect(page.locator('.hs-bong')).toBeHidden(); // Bông vẫn trốn

  const right = (await spotsOf(page)).find((s) => s.id === hide);
  await tapSpot(page, hide);
  await waitState(page, 'found');
  await expect.poll(() => spoken(page)).toContain(`I'm ${right.phrase}!`);
  expect(await spoken(page)).toContain('Peekaboo! You found me!');
  await expect(page.locator('.hs-bong')).toBeVisible();
  await expect(page.locator('.hs-ears')).toBeHidden();
  await expect(page.locator('.hs-phrase')).toHaveText(right.phrase);
  await expect(page.locator('.hs-prep')).toHaveText(right.phrase.match(/^(next to|in|under|behind)/)[1]);
  await expect(page.getByRole('button', { name: '🔁 Again!' })).toBeVisible();
  // Đã tìm thấy: chạm chỗ khác không có câu nhầm.
  const before = (await spoken(page)).length;
  await tapSpot(page, wrong.id);
  await page.waitForTimeout(200);
  expect((await spoken(page)).slice(before).some((t) => t.startsWith('Not '))).toBe(false);
});

test('HS-01: chơi nhiều lượt liên tiếp không lặp chỗ nấp; đếm số lượt', async ({ page }) => {
  await openHide(page);
  const seen = [];
  for (let i = 0; i < 6; i++) {
    await waitState(page, 'searching');
    const hide = await hidden(page);
    if (seen.length) expect(hide).not.toBe(seen.at(-1));
    seen.push(hide);
    await tapSpot(page, hide);
    await expect(page.getByRole('button', { name: '🔁 Again!' })).toBeVisible();
    await page.getByRole('button', { name: '🔁 Again!' }).click();
  }
  expect(await page.evaluate(() => window.kidEnglish.settings.hideSeek.rounds)).toBe(6);
});

test('HS-02: chạm nhầm liên tục nhiều chỗ → chỉ có câu của lần chạm cuối', async ({ page }) => {
  await openHide(page);
  const a = await wrongSpot(page, 0);
  const b = await wrongSpot(page, 1);
  const c = await wrongSpot(page, 2);
  const pts = [await spotXY(page, a.id), await spotXY(page, b.id), await spotXY(page, c.id)];
  const before = (await spoken(page)).length;
  await page.evaluate((list) => {
    const scene = document.querySelector('.hs-scene');
    for (const p of list) scene.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: p.x, clientY: p.y }));
  }, pts);
  await expect.poll(async () => (await spoken(page)).slice(before).filter((t) => t.startsWith('Not ')).length).toBe(1);
  await page.waitForTimeout(300);
  const nots = (await spoken(page)).slice(before).filter((t) => t.startsWith('Not '));
  expect(nots).toHaveLength(1);
  expect(nots[0]).toMatch(new RegExp(`^Not ${c.phrase}!`));
  expect(await state(page)).toBe('searching');
});

test('HS-03 (tốc độ thật): đang đếm thì chạm phòng không có tác dụng; chạm Bông → sang tìm ngay, một lần', async ({ page }) => {
  await fakeSpeech(page);
  // Giọng giả đọc mỗi câu 300 ms (mặc định 5 ms): để kịp chạm khi đang đếm.
  await page.addInitScript(() => {
    const speak = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = (u) => {
      const end = u.onend;
      u.onend = null;
      speak(u);
      setTimeout(() => end?.(), 300);
    };
  });
  await page.goto('/?nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click({ force: true });
  await page.getByRole('button', { name: 'Từ vựng' }).waitFor();
  await page.evaluate(() => window.kidEnglish.setSetting('hideSeek', { count: 10 }));
  await page.evaluate(() => window.kidEnglish.go('hide-seek'));
  await waitState(page, 'counting');
  await tapSpot(page, 'bed');
  expect(await state(page)).toBe('counting');
  await page.getByRole('button', { name: 'Bông', exact: true }).click();
  await page.getByRole('button', { name: 'Bông', exact: true }).click();
  await waitState(page, 'searching', 5000);
  await page.waitForTimeout(500);
  const said = await spoken(page);
  expect(said.filter((t) => t === 'Ready or not, here I come! Where is Bông?')).toHaveLength(1);
  expect(said).not.toContain('Ten!');
});

test('HS-04: đổi phòng giữa lúc đang nói → lượt mới ở phòng mới, chỗ nấp thuộc phòng mới', async ({ page }) => {
  await openHide(page);
  await page.getByRole('button', { name: 'Đổi phòng' }).click();
  await page.getByRole('button', { name: 'khu vườn' }).click();
  await expect.poll(() => roomId(page)).toBe('garden');
  await waitState(page, 'searching');
  const ids = (await spotsOf(page)).map((s) => s.id);
  expect(ids).toContain(await hidden(page));
  expect(await page.evaluate(() => window.kidEnglish.settings.hideSeek.room)).toBe('garden');
  await tapSpot(page, await hidden(page));
  await waitState(page, 'found');
});

test('HS-05: mức Thường — chưa có tai; 2 lần nhầm thì tai hiện; không chạm 10 giây cũng hiện tai', async ({ page }) => {
  await openHide(page, { hideSeek: { level: 'normal' } });
  await expect(page.locator('.hs-ears')).toBeHidden();
  await tapSpot(page, (await wrongSpot(page, 0)).id);
  await page.waitForTimeout(100);
  await expect(page.locator('.hs-ears')).toBeHidden();
  await tapSpot(page, (await wrongSpot(page, 1)).id);
  await expect(page.locator('.hs-ears')).toBeVisible();
  // Lượt mới: không chạm 10 giây (chế độ nhanh: 0,2 giây) → tai hiện.
  await tapSpot(page, await hidden(page));
  await page.getByRole('button', { name: '🔁 Again!' }).click();
  await waitState(page, 'searching');
  await expect(page.locator('.hs-ears')).toBeHidden();
  await expect(page.locator('.hs-ears')).toBeVisible({ timeout: 3000 });
});

async function swapRound(page) {
  await tapSpot(page, await hidden(page));
  await expect(page.getByRole('button', { name: 'Đổi vai' })).toBeVisible();
  await page.getByRole('button', { name: 'Đổi vai' }).click();
  await waitState(page, 'childHiding');
}

test('HS-06: đổi vai có tên Na — bé chạm hộp → "Is Na … ?" … "Found you! You\'re in the box!" → về lượt bé tìm', async ({ page }) => {
  await openHide(page, { childProfile: { name: 'Na', age: 3, family: [] } });
  await swapRound(page);
  expect(await spoken(page)).toContain("Now you hide! I'll close my eyes.");
  await expect(page.locator('.hs-kid')).toBeVisible();
  await tapSpot(page, 'box');
  await expect.poll(() => spoken(page), { timeout: 10000 }).toContain("Found you! You're in the box!");
  const said = await spoken(page);
  const asks = said.filter((t) => /^(Is Na|Are you) /.test(t));
  expect(asks.length).toBeGreaterThanOrEqual(1);
  expect(asks.length).toBeLessThanOrEqual(3);
  expect(asks.at(-1)).toBe('Is Na in the box?');
  expect(asks.every((t) => t.startsWith('Is Na '))).toBe(true);
  expect(said.filter((t) => t === 'No!')).toHaveLength(asks.length - 1);
  await expect.poll(() => spoken(page)).toContain('Your turn to find me!');
  await waitState(page, 'searching');
});

test('HS-07: đổi vai chưa có tên → "Are you … ?"; kéo hình bé vào chỗ nấp cũng được', async ({ page }) => {
  await openHide(page);
  await swapRound(page);
  const kid = await page.locator('.hs-kid').boundingBox();
  const to = await spotXY(page, 'wardrobe');
  await page.mouse.move(kid.x + kid.width / 2, kid.y + kid.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => spoken(page), { timeout: 10000 }).toContain("Found you! You're in the wardrobe!");
  expect(await spoken(page)).toContain('Are you in the wardrobe?');
  expect((await spoken(page)).some((t) => t.startsWith('Is '))).toBe(false);
});

test('sau 3 lượt Bông gợi ý đổi vai; tắt đổi vai trong Cài đặt thì không có nút / gợi ý', async ({ page }) => {
  await openHide(page);
  for (let i = 0; i < 3; i++) {
    await waitState(page, 'searching');
    await tapSpot(page, await hidden(page));
    await expect(page.getByRole('button', { name: '🔁 Again!' })).toBeVisible();
    if (i < 2) await page.getByRole('button', { name: '🔁 Again!' }).click();
  }
  await expect.poll(() => spoken(page)).toContain('Now you hide!');
  await expect(page.getByRole('button', { name: '🙋 Đổi vai' })).toBeVisible();

  await page.evaluate(() => window.kidEnglish.go('home'));
  await openParent(page);
  await page.getByRole('button', { name: /Cài đặt/ }).click();
  await page.getByRole('checkbox', { name: /Đổi vai/ }).uncheck();
  await expect.poll(() => page.evaluate(() => window.kidEnglish.settings.hideSeekSwap)).toBe(false);
  await page.evaluate(() => window.kidEnglish.go('hide-seek'));
  await waitState(page, 'searching');
  await tapSpot(page, await hidden(page));
  await expect(page.getByRole('button', { name: '🔁 Again!' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đổi vai' })).toBeHidden();
});

test('HS-11: máy bật giảm chuyển động → tai đứng yên, chỗ nấp không rung', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHide(page);
  await expect(page.locator('.hs-ears')).toBeVisible();
  expect(await page.locator('.hs-ears').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  await tapSpot(page, (await wrongSpot(page)).id);
  expect(await page.locator('.hs-spot.wiggle').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});

test('HS-12: app ra nền khi đang tìm → quay lại vẫn tìm, cùng chỗ nấp, Bông hỏi lại "Where is Bông?"', async ({ page }) => {
  await openHide(page);
  const hide = await hidden(page);
  const setVisible = (s) => page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, s);
  await setVisible('hidden');
  await setVisible('visible');
  await page.locator('.resume-overlay .start-btn').click();
  await waitState(page, 'searching');
  expect(await hidden(page)).toBe(hide);
  await expect.poll(() => spoken(page)).toContain('Where is Bông?');
});

// ---------- Ảnh thay được (H3) ----------
const pngBytes = (page, color, w = 80, hgt = 80) => page.evaluate(async ({ c, w: cw, h: ch }) => {
  const cv = document.createElement('canvas');
  cv.width = cw;
  cv.height = ch;
  const g = cv.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, cw, ch);
  g.fillStyle = c;
  g.fillRect(cw * 0.15, ch * 0.15, cw * 0.7, ch * 0.7);
  return Array.from(new Uint8Array(await (await new Promise((r) => cv.toBlob(r, 'image/png'))).arrayBuffer()));
}, { c: color, w, h: hgt });
const putImage = (page, lessonId, word, bytes) => page.evaluate(async ({ l, w, b }) => {
  const { setWordImage } = await import('/js/db.js');
  await setWordImage(window.kidEnglish.db, { lessonId: l, word: w, blob: new Blob([new Uint8Array(b)], { type: 'image/png' }), mimeType: 'image/png', width: 80, height: 80 });
}, { l: lessonId, w: word, b: bytes });

test('HS-08: có ảnh Bông "boo" nhưng thiếu "peek" → ú òa dùng ảnh, tai dùng hình vẽ; ảnh "boo" hỏng thì về hình vẽ', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await putImage(page, 'hide:bong', 'boo', await pngBytes(page, '#ffd166'));
  await page.evaluate(() => window.kidEnglish.go('hide-seek'));
  await waitState(page, 'searching');
  await expect(page.locator('.hs-ears svg')).toBeVisible();
  await tapSpot(page, await hidden(page));
  await waitState(page, 'found');
  await expect(page.locator('.hs-bong img')).toBeVisible();
  // Ảnh "boo" hỏng → lượt sau Bông ú òa bằng hình vẽ (không khung trống).
  await putImage(page, 'hide:bong', 'boo', [1, 2, 3]);
  await page.evaluate(() => window.kidEnglish.go('hide-seek'));
  await waitState(page, 'searching');
  await tapSpot(page, await hidden(page));
  await waitState(page, 'found');
  await expect(page.locator('.hs-bong svg.bong-svg')).toBeVisible();
});

test('ảnh phòng: "Chưa khớp" không lưu, "Khớp" thì lưu và hiện trong trò chơi; HS-09: bỏ ảnh thì về tranh vẽ, chơi bình thường', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Trốn tìm/ }).click();
  await expect(page.locator('.hs-admin-scene[data-room="bedroom"] .sp-admin-zone')).toHaveCount(6);
  const file = { name: 'phong.png', mimeType: 'image/png', buffer: Buffer.from(await pngBytes(page, '#b197fc', 800, 600)) };
  const choose = async () => {
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Chọn ảnh phòng' }).first().click();
    await (await chooser).setFiles(file);
  };
  await choose();
  await page.getByRole('button', { name: '✖ Chưa khớp' }).click();
  const saved = () => page.evaluate(async () => Boolean(await (await import('/js/db.js')).getWordImage(window.kidEnglish.db, 'hide:bg', 'bedroom')));
  expect(await saved()).toBe(false);
  await choose();
  await page.getByRole('button', { name: '✔ Khớp — lưu ảnh này' }).click();
  await expect.poll(saved).toBe(true);
  await page.evaluate(() => window.kidEnglish.setSetting('hideSeek', { room: 'bedroom' }));
  await page.evaluate(() => window.kidEnglish.go('hide-seek'));
  await waitState(page, 'searching');
  await expect(page.locator('.hs-bg img.hs-bg-img')).toBeVisible();

  // HS-09: bỏ ảnh phòng → tranh vẽ sẵn, vẫn chơi được.
  await page.evaluate(() => window.kidEnglish.go('parent', { view: 'hide' }));
  await page.getByRole('button', { name: 'Dùng tranh vẽ sẵn' }).click();
  await expect.poll(saved).toBe(false);
  await page.evaluate(() => window.kidEnglish.go('hide-seek'));
  await waitState(page, 'searching');
  await expect(page.locator('.hs-bg svg')).toBeVisible();
  await tapSpot(page, await hidden(page));
  await waitState(page, 'found');
});

test('ảnh bất ngờ: "Dùng lại ảnh đã có" lấy cả sticker Dán tranh + ảnh bài học; chọn ảnh khác ở từng món; mỗi món chỉ một bản, ảnh gốc không đổi', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  const lessonId = await page.evaluate(async () => (await window.kidEnglish.db.getAll('lessons'))[0].id);
  await putImage(page, lessonId, 'cat', await pngBytes(page, '#ff8787'));
  await putImage(page, 'scene:stickers', 'cat', await pngBytes(page, '#ffa94d'));
  await putImage(page, 'scene:stickers', 'duck', await pngBytes(page, '#ffd43b'));
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Trốn tìm/ }).click();

  // Dùng lại hàng loạt: 2 món chưa có ảnh (cat, duck); cat lấy sticker trước (đã bỏ nền), duck chỉ có sticker.
  await page.getByRole('button', { name: 'Dùng lại ảnh đã có (2 món)' }).click();
  await expect(page.locator('.sp-admin-item[data-surprise="cat"] img')).toBeVisible();
  await expect(page.locator('.sp-admin-item[data-surprise="duck"] img')).toBeVisible();
  const sameAs = (word, source) => page.evaluate(async ({ w, l }) => {
    const db = await import('/js/db.js');
    const app = window.kidEnglish;
    const a = await db.getWordImage(app.db, 'hide:items', w);
    const b = await db.getWordImage(app.db, l, w);
    return a.data.byteLength === b.data.byteLength;
  }, { w: word, l: source });
  expect(await sameAs('duck', 'scene:stickers')).toBe(true); // sticker sao chép nguyên (không bỏ nền lần nữa)
  expect(await sameAs('cat', 'scene:stickers')).toBe(true);
  await expect(page.getByRole('button', { name: /^Dùng lại ảnh đã có/ })).toHaveCount(0); // hết món cần dùng lại

  // Chọn ảnh khác cho cat: danh sách có sticker Dán tranh + ảnh bài học; chọn ảnh bài học.
  const cat = page.locator('.sp-admin-item[data-surprise="cat"]');
  await cat.getByRole('button', { name: 'Ảnh có sẵn (2)…' }).click();
  await expect(cat.locator('.fd-admin-cand')).toHaveCount(2);
  await expect(cat.locator('.fd-admin-cand').first()).toHaveAttribute('data-source', 'sticker');
  await cat.locator('.fd-admin-cand[data-source="lesson"]').click();
  await expect.poll(() => sameAs('cat', 'scene:stickers')).toBe(false);

  const r = await page.evaluate(async (l) => {
    const db = await import('/js/db.js');
    const app = window.kidEnglish;
    const copies = (await app.db.getAllByIndex('images', 'lessonId', 'hide:items')).filter((i) => i.word === 'cat').length;
    const original = Boolean(await db.getWordImage(app.db, l, 'cat')) && Boolean(await db.getWordImage(app.db, 'scene:stickers', 'cat'));
    await db.removeWordImage(app.db, l, 'cat');
    return { copies, original, vocab: await db.latestImageForWord(app.db, 'cat') };
  }, lessonId);
  expect(r).toEqual({ copies: 1, original: true, vocab: null });

  // Ảnh bất ngờ hiện trong trò chơi khi chạm nhầm.
  await page.evaluate(() => window.kidEnglish.setSetting('hideSeek', { room: 'bedroom' }));
  await page.evaluate(() => window.kidEnglish.go('hide-seek'));
  await waitState(page, 'searching');
  for (let i = 0; i < 3; i++) {
    await tapSpot(page, (await wrongSpot(page, i)).id);
    if (await page.locator('.hs-surprise[data-surprise="cat"] img').count()) break;
  }
  await expect(page.locator('.hs-surprise[data-surprise="cat"] img')).toHaveCount(1);
});

test('HS-10: bé chơi đổi vai bằng ảnh của bé (Hồ sơ) → gói chia sẻ Trốn tìm và gói bài không có ảnh profile:', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: /Hồ sơ của bé/ }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Ảnh của bé' }).click();
  await (await chooser).setFiles({ name: 'be.png', mimeType: 'image/png', buffer: Buffer.from(await pngBytes(page, '#74c0fc')) });
  await expect.poll(() => page.evaluate(async () => Boolean(await (await import('/js/db.js')).getWordImage(window.kidEnglish.db, 'profile:family', 'family:me')))).toBe(true);
  await putImage(page, 'hide:bg', 'garden', await pngBytes(page, '#b2f2bb', 400, 300));

  await page.evaluate(() => window.kidEnglish.go('hide-seek'));
  await waitState(page, 'searching');
  await tapSpot(page, await hidden(page));
  await page.getByRole('button', { name: 'Đổi vai' }).click();
  await waitState(page, 'childHiding');
  await expect(page.locator('.hs-kid img')).toBeVisible();

  const packs = await page.evaluate(async () => {
    const { createBackup, readBackup } = await import('/js/backup.js');
    const app = window.kidEnglish;
    const lessonId = (await app.db.getAll('lessons'))[0].id;
    const game = await readBackup((await createBackup(app.db, { lessonIds: ['hide:bg', 'hide:bong', 'hide:items'] })).blob);
    const lesson = await readBackup((await createBackup(app.db, { lessonIds: [lessonId] })).blob);
    const full = await readBackup((await createBackup(app.db, {})).blob);
    const prof = (p) => p.images.filter((i) => String(i.lessonId).startsWith('profile:')).length;
    return { game: prof(game), gameImages: game.images.length, lesson: prof(lesson), full: prof(full) };
  });
  expect(packs).toEqual({ game: 0, gameImages: 1, lesson: 0, full: 1 });
});
