// Ghép hình cùng Bông (SPEC-puzzle.md): ghép bộ phận (điểm neo, đúng / sai 2 cấp, màu đã tô, hoàn thành một lần,
// ra nền giữ mảnh), ghép tranh (nhóm, số mảnh theo bộ đếm, tiếng kêu, xóa ảnh nguồn), ảnh gia đình + ảnh bố mẹ thêm.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const state = (page) => page.locator('.pz-play').getAttribute('data-state');
const waitState = (page, s) => expect(page.locator('.pz-play')).toHaveAttribute('data-state', s, { timeout: 15000 });
const piece = (page, id) => page.locator(`.pz-piece[data-piece="${id}"]`);

/** Kéo mảnh tới điểm (x, y) theo tọa độ khung (ghép bộ phận: 200; ghép tranh: 1). */
async function dragPiece(page, id, x, y, units = 200) {
  const a = await piece(page, id).boundingBox();
  const b = await page.locator('.pz-board').boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + (x / units) * b.width, b.y + (y / units) * b.height, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(60);
}
const anchors = (page, pic) => page.evaluate(async (id) => {
  const m = await import('/js/puzzle.js');
  return Object.fromEntries(m.partPuzzle(id).pieces.map((p) => [p.id, p.anchor]));
}, pic);
const cellAnchors = (page, n) => page.evaluate(async (k) => {
  const m = await import('/js/puzzle.js');
  return Object.fromEntries(m.gridCells(k).map((c) => [c.id, c.anchor]));
}, n);
async function completeParts(page, pic) {
  const at = await anchors(page, pic);
  for (const [id, p] of Object.entries(at)) {
    await expect(piece(page, id)).toBeVisible();
    await dragPiece(page, id, p.x, p.y);
  }
}
async function completeGrid(page) {
  const n = Number(await page.locator('.pz-play').getAttribute('data-pieces'));
  const at = await cellAnchors(page, n);
  for (const [id, p] of Object.entries(at)) {
    await expect(piece(page, id)).toBeVisible();
    await dragPiece(page, id, p.x, p.y, 1);
  }
  return n;
}
async function openParts(page, name = 'con bướm') {
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Ghép hình' }).click();
  await page.getByRole('button', { name: 'Ghép bộ phận' }).click();
  await page.getByRole('button', { name, exact: true }).click();
  await waitState(page, 'playing');
}
const fill = (page, id) => piece(page, id).locator('[data-part] ').first().getAttribute('fill');

test('P1a bướm: Bông hỏi, mảnh mang màu đã tô (phần chưa tô màu mặc định), sai 2 cấp, đúng thì khớp + hỏi tiếp, xong một lần, ✨', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(() => window.kidEnglish.setSetting('coloring', { butterfly: { wings: 'pink' } }));
  await openParts(page);
  await expect.poll(() => spoken(page)).toContain("Let's make a butterfly!");
  await expect.poll(() => spoken(page)).toContain('Where does the body go?');
  await expect(page.locator('.pz-piece')).toHaveCount(3);
  expect(await fill(page, 'wings')).toBe('#f9a8d4'); // hồng bé đã tô
  expect(await fill(page, 'body')).toBe('#3f3f46'); // chưa tô: màu mặc định (đen)

  const at = await anchors(page, 'butterfly');
  // Sai lần 1 → "Oops!", lần 2 → "Look! Here!" + chỗ đúng sáng; mảnh về khay.
  await dragPiece(page, 'body', at.wings.x - 60, at.wings.y);
  await expect.poll(() => spoken(page)).toContain('Oops! Try again!');
  await expect(piece(page, 'body')).toBeVisible();
  await dragPiece(page, 'body', at.wings.x - 60, at.wings.y);
  await expect.poll(() => spoken(page)).toContain('Look! Here!');
  await expect(page.locator('.pz-board [data-slot="body"].glow')).toHaveCount(1);
  // Thả ra chỗ không có gì: không nói câu sai.
  const before = (await spoken(page)).filter((t) => /^(Oops|Look)/.test(t)).length;
  await dragPiece(page, 'body', 3, 197);
  expect((await spoken(page)).filter((t) => /^(Oops|Look)/.test(t)).length).toBe(before);

  await dragPiece(page, 'body', at.body.x, at.body.y);
  await expect.poll(() => spoken(page)).toContain('Yes! The body!');
  await expect(page.locator('.pz-board [data-part="body"]')).toHaveCount(1);
  await expect(page.locator('.pz-piece')).toHaveCount(2);
  await expect.poll(() => spoken(page)).toContain('Where do the wings go?');
  await dragPiece(page, 'head', at.head.x, at.head.y); // mảnh khác (không phải mảnh đang hỏi) đúng chỗ cũng được khen
  await expect.poll(() => spoken(page)).toContain('Yes! The head!');
  await dragPiece(page, 'wings', at.wings.x, at.wings.y);
  await waitState(page, 'done');
  await expect.poll(() => spoken(page)).toContain("Wow! It's a butterfly!");
  await expect(page.getByRole('button', { name: '➡️ Next' })).toBeVisible();
  expect((await spoken(page)).filter((t) => t === "Wow! It's a butterfly!")).toHaveLength(1);
  expect(await page.evaluate(() => window.kidEnglish.settings.puzzle.done['parts:butterfly'])).toBe(true);

  // PU-09: bấm Next liên tục → chỉ một lượt mới (con chim).
  await page.evaluate(() => { const b = document.querySelector('.pz-next'); b.click(); b.click(); b.click(); });
  await waitState(page, 'playing');
  await page.waitForTimeout(200);
  expect((await spoken(page)).filter((t) => t === "Let's make a bird!")).toHaveLength(1);
  await page.getByRole('button', { name: 'Chọn hình khác' }).click();
  await expect(page.locator('.pz-card[data-card="parts:butterfly"] .pz-done')).toHaveText('✨');
});

test('chạm mảnh (không kéo): Bông nói tên mảnh, chỗ đúng sáng, mảnh không tự đặt', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openParts(page);
  await piece(page, 'wings').click();
  await expect.poll(() => spoken(page)).toContain('The wings!');
  await expect(page.locator('.pz-board [data-slot="wings"].glow')).toHaveCount(1);
  await expect(page.locator('.pz-piece')).toHaveCount(3);
});

test('P1b: cả 10 hình ghép được; khung bao trong dữ liệu khớp SVG thật (PU-02); câu "does / do" đúng', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  const diff = await page.evaluate(async () => {
    const c = await import('/js/coloring.js');
    const m = await import('/js/puzzle.js');
    let worst = 0;
    for (const def of m.PART_PUZZLES) {
      const div = document.createElement('div');
      div.style.cssText = 'position:fixed;left:0;top:0;width:200px;height:200px';
      div.innerHTML = c.pictureSvg(c.PICTURE_BY_ID.get(def.picture), {});
      document.body.append(div);
      for (const id of def.order) {
        const b = div.querySelector(`[data-part="${id}"]`).getBBox();
        const box = def.box[id];
        worst = Math.max(worst, Math.abs(b.x - box[0]), Math.abs(b.y - box[1]), Math.abs(b.width - box[2]), Math.abs(b.height - box[3]));
      }
      div.remove();
    }
    return worst;
  });
  expect(diff).toBeLessThanOrEqual(1);
  const pics = await page.evaluate(async () => (await import('/js/puzzle.js')).PART_PUZZLES.map((p) => p.picture));
  for (const pic of pics) {
    await page.evaluate((id) => window.kidEnglish.go('puzzle-play', { mode: 'parts', card: `parts:${id}` }), pic);
    await waitState(page, 'playing');
    await completeParts(page, pic);
    await waitState(page, 'done');
  }
  const said = await spoken(page);
  expect(said).toContain("Wow! It's a car!");
  expect(said).toContain('Where does the body go?');
  expect(said).toContain('Where do the wheels go?');
  expect(said).toContain("Wow! It's an ice cream!");
});

test('PU-04: đổi màu ở Tô màu → lượt ghép mới đọc màu mới nhất; dữ liệu Tô màu hỏng vẫn chơi bằng màu mặc định', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(() => window.kidEnglish.setSetting('coloring', { butterfly: { wings: 'pink' } }));
  await page.evaluate(() => window.kidEnglish.go('puzzle-play', { mode: 'parts', card: 'parts:butterfly' }));
  await waitState(page, 'playing');
  expect(await fill(page, 'wings')).toBe('#f9a8d4');
  await page.evaluate(() => window.kidEnglish.setSetting('coloring', { butterfly: { wings: 'blue' } }));
  await page.getByRole('button', { name: 'Ghép lại' }).click();
  await page.evaluate(() => window.kidEnglish.go('puzzle-play', { mode: 'parts', card: 'parts:butterfly' }));
  await waitState(page, 'playing');
  expect(await fill(page, 'wings')).toBe('#60a5fa');
  await page.evaluate(() => window.kidEnglish.setSetting('coloring', 'hỏng'));
  await page.evaluate(() => window.kidEnglish.go('puzzle-play', { mode: 'parts', card: 'parts:butterfly' }));
  await waitState(page, 'playing');
  expect(await fill(page, 'wings')).toBe('#f9a8d4'); // màu mặc định của cánh
});

test('ra nền rồi quay lại giữ mảnh đã đặt; 🧩 rồi mở lại hình thì ghép từ đầu', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openParts(page);
  const at = await anchors(page, 'butterfly');
  await dragPiece(page, 'body', at.body.x, at.body.y);
  await expect(page.locator('.pz-piece')).toHaveCount(2);
  const setVisible = (s) => page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, s);
  await setVisible('hidden');
  await setVisible('visible');
  await page.locator('.resume-overlay .start-btn').click();
  await waitState(page, 'playing');
  await expect(page.locator('.pz-board [data-part="body"]')).toHaveCount(1);
  await expect(page.locator('.pz-piece')).toHaveCount(2);
  await page.getByRole('button', { name: 'Chọn hình khác' }).click();
  await page.getByRole('button', { name: 'con bướm', exact: true }).click();
  await waitState(page, 'playing');
  await expect(page.locator('.pz-piece')).toHaveCount(3);
});

test('PU-11 giảm chuyển động: hoàn thành không có hoạt ảnh; PU-12 điện thoại: mảnh ≥ 64 px, khung ≥ 280 px', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(() => window.kidEnglish.go('puzzle-play', { mode: 'parts', card: 'parts:fish' }));
  await waitState(page, 'playing');
  const box = await piece(page, 'body').boundingBox();
  expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(64);
  const board = await page.locator('.pz-board').boundingBox();
  expect(board.width).toBeGreaterThanOrEqual(280);
  await completeParts(page, 'fish');
  await waitState(page, 'done');
  expect(await page.locator('.pz-frame').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  expect(await page.locator('.pz-board').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});

// ---------- Ghép cả bức tranh ----------
const pngBytes = (page, color, w = 400, hh = 400) => page.evaluate(async ({ c, w: cw, h: ch }) => {
  const cv = document.createElement('canvas');
  cv.width = cw;
  cv.height = ch;
  const g = cv.getContext('2d');
  g.fillStyle = c;
  g.fillRect(0, 0, cw, ch);
  return Array.from(new Uint8Array(await (await new Promise((r) => cv.toBlob(r, 'image/png'))).arrayBuffer()));
}, { c: color, w, h: hh });
const putImage = (page, lessonId, word, bytes, w = 400, hh = 400) => page.evaluate(async ({ l, wd, b, w: iw, h: ih }) => {
  const { setWordImage } = await import('/js/db.js');
  await setWordImage(window.kidEnglish.db, { lessonId: l, word: wd, blob: new Blob([new Uint8Array(b)], { type: 'image/png' }), mimeType: 'image/png', width: iw, height: ih });
}, { l: lessonId, wd: word, b: bytes, w, h: hh });

test('P2: máy chưa có ảnh vẫn có nhóm "Con vật và đồ vật"; tranh đầu 2 mảnh; xong +1 bộ đếm 2 (PU-05); lên mức chỉ từ tranh kế tiếp (PU-06)', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(() => window.kidEnglish.setSetting('puzzle', { gridDone: { 2: 1 } }));
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Ghép hình' }).click();
  await page.getByRole('button', { name: 'Ghép cả bức tranh' }).click();
  await expect(page.locator('.pz-group[data-group="svg"] .pz-card')).toHaveCount(25);
  await expect(page.locator('.pz-group[data-group="words"]')).toHaveCount(0);
  await page.locator('.pz-card[data-card="grid:svg:butterfly"]').click();
  await waitState(page, 'playing');
  expect(await page.locator('.pz-play').getAttribute('data-pieces')).toBe('2');
  // Sai: ô kia → Oops.
  const at = await cellAnchors(page, 2);
  await dragPiece(page, 'c0-0', at['c0-1'].x, at['c0-1'].y, 1);
  await expect.poll(() => spoken(page)).toContain('Oops! Try again!');
  await completeGrid(page);
  await waitState(page, 'done');
  await expect.poll(() => spoken(page)).toContain("Wow! It's a butterfly!");
  expect(await page.evaluate(() => window.kidEnglish.settings.puzzle.gridDone)).toEqual({ 2: 2, 4: 0, 6: 0, 9: 0 });
  expect(await page.locator('.pz-play').getAttribute('data-pieces')).toBe('2'); // tranh đang chơi giữ số mảnh
  await page.getByRole('button', { name: '➡️ Next' }).click();
  await waitState(page, 'playing');
  expect(await page.locator('.pz-play').getAttribute('data-pieces')).toBe('4');
  await completeGrid(page);
  await waitState(page, 'done');
});

test('P2 từ vựng: ảnh "cow" của bài học → ghép xong "Wow! It\'s a cow! Moo moo!"; xóa ảnh nguồn thì thẻ biến mất (PU-07); khóa mức 3 → 9 mảnh', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  const lessonId = await page.evaluate(async () => (await window.kidEnglish.db.getAll('lessons')).find((l) => (l.words ?? []).some((w) => w.en === 'cow')).id);
  await putImage(page, lessonId, 'cow', await pngBytes(page, '#ffd8a8'));
  await putImage(page, lessonId, 'dog', await pngBytes(page, '#d0bfff', 120, 120), 120, 120); // nhỏ quá: không hiện
  await page.evaluate(() => window.kidEnglish.go('puzzle-list', { mode: 'grid' }));
  await expect(page.locator('.pz-card[data-card="grid:word:cow"]')).toBeVisible();
  await expect(page.locator('.pz-card[data-card="grid:word:dog"]')).toHaveCount(0);
  await page.locator('.pz-card[data-card="grid:word:cow"]').click();
  await waitState(page, 'playing');
  await completeGrid(page);
  await expect.poll(() => spoken(page)).toContain("Wow! It's a cow! Moo moo!");

  await page.evaluate(async (l) => (await import('/js/db.js')).removeWordImage(window.kidEnglish.db, l, 'cow'), lessonId);
  await page.evaluate(() => window.kidEnglish.go('puzzle-list', { mode: 'grid' }));
  await expect(page.locator('.pz-group[data-group="svg"]')).toBeVisible();
  await expect(page.locator('.pz-card[data-card="grid:word:cow"]')).toHaveCount(0);

  await page.evaluate(() => window.kidEnglish.setSetting('puzzle', { lock: 3 }));
  await page.evaluate(() => window.kidEnglish.go('puzzle-play', { mode: 'grid', card: 'grid:svg:cat' }));
  await waitState(page, 'playing');
  expect(await page.locator('.pz-play').getAttribute('data-pieces')).toBe('9');
  await expect(page.locator('.pz-piece')).toHaveCount(9);
});

// ---------- P3: gia đình, ảnh bố mẹ thêm ----------
test('P3: ảnh gia đình trong nhóm Gia đình, chỉnh vị trí cắt ở Góc bố mẹ (PU-08), xong "Wow! It\'s Mummy!"; tắt nhóm thì ẩn', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await putImage(page, 'profile:family', 'family:mummy', await pngBytes(page, '#ffc9c9', 400, 700), 400, 700);
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Ghép hình/ }).click();
  const item = page.locator('.pz-admin-item', { hasText: 'Mẹ' });
  await expect(item.locator('canvas')).toBeVisible();
  await item.getByRole('button', { name: '⬆ Đầu' }).click();
  await expect.poll(() => page.evaluate(() => window.kidEnglish.settings.puzzleCrop?.mummy)).toBe('start');

  await page.evaluate(() => window.kidEnglish.go('puzzle-list', { mode: 'grid' }));
  await expect(page.locator('.pz-group[data-group="family"] .pz-card')).toHaveCount(1);
  await page.locator('.pz-card[data-card="grid:family:mummy"]').click();
  await waitState(page, 'playing');
  await completeGrid(page);
  await expect.poll(() => spoken(page)).toContain("Wow! It's Mummy!");

  await page.evaluate(() => window.kidEnglish.setSetting('puzzleFamily', false));
  await page.evaluate(() => window.kidEnglish.go('puzzle-list', { mode: 'grid' }));
  await expect(page.locator('.pz-group[data-group="svg"]')).toBeVisible();
  await expect(page.locator('.pz-group[data-group="family"]')).toHaveCount(0);
});

test('P3: thêm ảnh ghép riêng (tên "rainbow") → ghép được; gói chia sẻ có ảnh + tên, KHÔNG có ảnh gia đình; nhập lại máy khác đủ (PU-10)', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await putImage(page, 'profile:family', 'family:daddy', await pngBytes(page, '#a5d8ff'));
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Ghép hình/ }).click();
  await page.getByLabel(/Tên tiếng Anh/).fill('rainbow');
  await page.getByLabel(/Tên tiếng Việt/).fill('cầu vồng');
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Chọn ảnh' }).click();
  await (await chooser).setFiles({ name: 'cv.png', mimeType: 'image/png', buffer: Buffer.from(await pngBytes(page, '#ffd43b', 600, 400)) });
  await expect.poll(() => page.evaluate(() => (window.kidEnglish.settings.puzzlePhotos ?? []).length)).toBe(1);

  await page.evaluate(() => window.kidEnglish.go('puzzle-list', { mode: 'grid' }));
  const card = page.locator('.pz-group[data-group="photos"] .pz-card');
  await expect(card).toHaveCount(1);
  await card.click();
  await waitState(page, 'playing');
  await completeGrid(page);
  await expect.poll(() => spoken(page)).toContain("Wow! It's a rainbow!");

  const got = await page.evaluate(async () => {
    const app = window.kidEnglish;
    const { createBackup, readBackup } = await import('/js/backup.js');
    const { acceptPuzzlePayload } = await import('/js/screens/parent/puzzle.js');
    const db = await import('/js/db.js');
    const pack = await readBackup((await createBackup(app.db, { lessonIds: ['puzzle:photos'], settingsKeys: ['puzzlePhotos'] })).blob);
    const prof = pack.images.filter((i) => String(i.lessonId).startsWith('profile:')).length;
    const id = app.settings.puzzlePhotos[0].id;
    await db.removeWordImage(app.db, 'puzzle:photos', id);
    await app.setSetting('puzzlePhotos', []);
    const res = await acceptPuzzlePayload(app, pack);
    return { prof, images: pack.images.length, res, list: app.settings.puzzlePhotos.map((p) => p.en), back: Boolean(await db.getWordImage(app.db, 'puzzle:photos', id)) };
  });
  expect(got).toEqual({ prof: 0, images: 1, res: { images: 1, photos: 1 }, list: ['rainbow'], back: true });
});
