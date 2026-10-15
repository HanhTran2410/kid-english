// Góc trò chơi + Dán tranh (SPEC-scenes.md): chọn tranh, kéo sticker theo chủ đề vào tranh, Bông nói câu có giới từ,
// giao việc, lưu tranh; Góc bố mẹ thay ảnh sticker / ảnh tranh.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());
const lastSpoken = async (page) => (await spoken(page)).at(-1);

/** Một điểm thuộc đúng chỗ `zoneId` của tranh (tọa độ màn hình): tâm vùng, hoặc dò lưới nếu tâm rơi vào chỗ khác. */
async function zonePoint(page, sceneId, zoneId) {
  const pct = await page.evaluate(async ([sceneId, zoneId]) => {
    const { SCENE_BY_ID, zoneAt, zoneBox } = await import('/js/sticker-scenes.js');
    const scene = SCENE_BY_ID.get(sceneId);
    const b = zoneBox(scene.zones.find((z) => z.id === zoneId));
    const c = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    if (zoneAt(scene, c.x, c.y).id === zoneId) return c;
    for (let x = 2; x < 98; x += 2) for (let y = 2; y < 98; y += 2) if (zoneAt(scene, x, y).id === zoneId) return { x, y };
    return null;
  }, [sceneId, zoneId]);
  const r = await page.locator('.sp-scene').boundingBox();
  return { x: r.x + (pct.x / 100) * r.width, y: r.y + (pct.y / 100) * r.height };
}

async function drag(page, from, to) {
  const a = 'x' in from ? from : await from.boundingBox().then((b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 }));
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(a.x, a.y - 30, { steps: 3 });
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await page.mouse.up();
}

async function openScene(page, name) {
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Dán tranh' }).click();
  await page.getByRole('button', { name }).click();
  await expect(page.locator('.tray-sticker').first()).toBeVisible();
}

test('góc trò chơi: thẻ Dán tranh, Chọn từ, Chọn số; Dán tranh có 7 tranh, mỗi tranh đủ bộ sticker theo chủ đề', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await expect(page.getByRole('button', { name: 'Dán tranh' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chọn từ' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chọn số', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Dán tranh' }).click();
  await expect(page.locator('.sp-card')).toHaveCount(7);
  // Không cần sticker trong album: tranh nào cũng có đủ bộ sticker theo chủ đề.
  await page.getByRole('button', { name: 'Bãi biển' }).click();
  await expect(page.locator('.tray-sticker')).toHaveCount(16);
  await expect(page.getByRole('button', { name: 'Shell' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fish' })).toBeVisible();
  await expect.poll(() => spoken(page)).toContain("Let's play at the beach!");
});

test('dán tranh: kéo vào tranh, chạm chọn → chạm chỗ, dán nhiều bản, tự giao việc sau 3 lần dán, kéo về khay, lưu lại', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openScene(page, 'Nông trại');
  await expect(page.locator('.tray-sticker.hint')).toHaveCount(1);

  // 1. Kéo cow lên cây.
  await drag(page, page.getByRole('button', { name: 'Cow' }), await zonePoint(page, 'farm', 'tree'));
  await expect(page.locator('.placed[data-sticker="cow"]')).toHaveAttribute('data-zone', 'tree');
  await expect.poll(() => spoken(page)).toContain('The cow is in the tree!');

  // 2. Chạm chọn duck → chạm vào ao.
  await page.getByRole('button', { name: 'Duck' }).click();
  await expect(page.locator('.tray-sticker.selected')).toHaveAttribute('data-sticker', 'duck');
  const water = await zonePoint(page, 'farm', 'water');
  await page.mouse.click(water.x, water.y);
  await expect(page.locator('.placed[data-sticker="duck"]')).toHaveAttribute('data-zone', 'water');
  await expect.poll(() => spoken(page)).toContain('The duck is in the water!');

  // 3. Dán thêm một con duck nữa (không giới hạn số bản) → lần dán thứ 3: Bông tự giao việc.
  await drag(page, page.locator('.tray-sticker[data-sticker="duck"]'), await zonePoint(page, 'farm', 'barn'));
  await expect(page.locator('.placed[data-sticker="duck"]')).toHaveCount(2);
  await expect(page.locator('.zone-target')).toHaveCount(1);
  const sid = await page.locator('.sp-request').getAttribute('data-sticker');
  const zid = await page.locator('.zone-target').getAttribute('data-zone');
  await expect.poll(() => lastSpoken(page)).toMatch(/^Put the [a-z ]+ (in|on|under) the /);

  // 4. Khay tự cuộn tới sticker cần tìm; làm đúng việc (kéo từ khay) → khen, hết việc.
  await expect(page.locator(`.tray-sticker[data-sticker="${sid}"]`)).toBeInViewport({ ratio: 0.9 });
  await drag(page, page.locator(`.tray-sticker[data-sticker="${sid}"]`), await zonePoint(page, 'farm', zid));
  await expect.poll(() => lastSpoken(page)).toMatch(/^Yay! The /);
  await expect(page.locator('.zone-target')).toHaveCount(0);
  await expect(page.locator('.sp-request')).toBeHidden();

  // 5. Chạm sticker đã dán: Bông nói lại câu.
  await page.locator('.placed[data-sticker="cow"]').first().click();
  await expect.poll(() => lastSpoken(page)).toMatch(/^The cow is /);

  // 6. Kéo cow vào khay → gỡ khỏi tranh.
  const cows = await page.locator('.placed[data-sticker="cow"]').count();
  const tray = await page.locator('.sp-tray').boundingBox();
  await drag(page, page.locator('.placed[data-sticker="cow"]').first(), { x: tray.x + tray.width / 2, y: tray.y + tray.height / 2 });
  await expect(page.locator('.placed[data-sticker="cow"]')).toHaveCount(cows - 1);

  // 7. Về màn chọn tranh: Nông trại có số sticker đã dán; tranh khác trống; mở lại vẫn còn.
  const total = await page.locator('.placed').count();
  await page.getByRole('button', { name: 'Chọn tranh khác' }).click();
  await expect(page.locator('.sp-card[data-scene="farm"] .sp-thumb-count')).toHaveText(String(total));
  await expect(page.locator('.sp-card[data-scene="farm"]')).toHaveClass(/last/);
  await page.getByRole('button', { name: 'Phòng ngủ' }).click();
  await expect(page.locator('.tray-sticker').first()).toBeVisible();
  await expect(page.locator('.placed')).toHaveCount(0);
  await page.getByRole('button', { name: 'Chọn tranh khác' }).click();
  await page.getByRole('button', { name: 'Nông trại' }).click();
  await expect(page.locator('.placed[data-sticker="duck"]')).toHaveCount(2);
});

test('dán tranh: thả ngoài tranh và ngoài khay → về chỗ cũ; chạm Bông lần 2 không đổi việc; sticker khác vào đúng chỗ không tính xong', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(() => window.kidEnglish.setSetting('stickerScenes', { last: 'farm', farm: [{ s: 'cow', x: 17, y: 25 }] }));
  await openScene(page, 'Nông trại');
  const cow = page.locator('.placed[data-sticker="cow"]');
  await expect(cow).toHaveAttribute('data-zone', 'tree');

  const title = await page.locator('.sp-title').boundingBox();
  await drag(page, cow, { x: title.x + title.width / 2, y: title.y + title.height / 2 });
  await expect(cow).toHaveAttribute('data-zone', 'tree');
  await expect(cow).not.toHaveClass(/lifted/);

  await page.getByRole('button', { name: 'Bông giao việc' }).click();
  const zid = await page.locator('.zone-target').getAttribute('data-zone');
  const sid = await page.locator('.sp-request').getAttribute('data-sticker');
  await page.getByRole('button', { name: 'Bông giao việc' }).click();
  await expect(page.locator('.zone-target')).toHaveAttribute('data-zone', zid);
  await expect(page.locator('.sp-request')).toHaveAttribute('data-sticker', sid);

  const other = sid === 'pig' ? 'horse' : 'pig';
  await page.locator(`.tray-sticker[data-sticker="${other}"]`).scrollIntoViewIfNeeded();
  await drag(page, page.locator(`.tray-sticker[data-sticker="${other}"]`), await zonePoint(page, 'farm', zid));
  await expect.poll(() => lastSpoken(page)).toMatch(new RegExp(`^The ${other} is `));
  await expect(page.locator('.zone-target')).toHaveAttribute('data-zone', zid);
  await expect(page.locator('.sp-request')).toBeVisible();
});

/** Ảnh thử: nền trắng, một hình tròn đỏ viền đen ở giữa (PNG). */
async function testImage(page, width, height) {
  const b64 = await page.evaluate(([w, hgt]) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = hgt;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, hgt);
    ctx.fillStyle = '#e33';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(4, w / 40);
    ctx.beginPath();
    ctx.arc(w / 2, hgt / 2, Math.min(w, hgt) / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    return c.toDataURL('image/png').split(',')[1];
  }, [width, height]);
  return { name: 'test.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') };
}

test('Góc bố mẹ: thay ảnh một sticker (tự bỏ nền trắng) và ảnh tranh → trò chơi dùng ảnh mới', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Dán tranh/ }).click();
  await expect(page.locator('.menu-item')).toHaveCount(7);
  await page.getByRole('button', { name: /Nông trại/ }).click();

  // Copy prompt ảnh tranh có bố cục theo %.
  await page.evaluate(() => {
    window.__copied = '';
    navigator.clipboard.writeText = async (t) => { window.__copied = t; };
  });
  await page.getByRole('button', { name: 'Copy prompt ảnh tranh' }).click();
  await expect.poll(() => page.evaluate(() => window.__copied)).toContain('A small blue pond\n- Position: x = 35%–73%, y = 76%–94%');

  // Ảnh một sticker: cow.
  const cowItem = page.locator('.sp-admin-item').filter({ has: page.getByText('cow', { exact: true }) });
  const chooser = page.waitForEvent('filechooser');
  await cowItem.getByRole('button', { name: 'Chọn ảnh' }).click();
  await (await chooser).setFiles(await testImage(page, 400, 400));
  await expect(page.locator('.sp-admin-item').filter({ has: page.getByText('cow', { exact: true }) }).locator('img.sp-img')).toBeVisible();
  const saved = await page.evaluate(async () => {
    const list = await window.kidEnglish.db.getAllByIndex('images', 'lessonId', 'scene:stickers');
    return list.map((r) => ({ word: r.word, mimeType: r.mimeType, width: r.width, height: r.height }));
  });
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ word: 'cow', mimeType: 'image/png' });
  expect(saved[0].width).toBeLessThan(300); // đã cắt sát hình (bỏ nền)

  // Ảnh tranh: ảnh 16:10 → cắt về 4:3, xem trước có khung các chỗ, lưu.
  const bgChooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Chọn ảnh tranh' }).click();
  await (await bgChooser).setFiles(await testImage(page, 1600, 1000));
  await expect(page.getByRole('button', { name: 'Lưu ảnh tranh này' })).toBeVisible();
  await expect(page.locator('.grid-preview .sp-admin-zone')).toHaveCount(5);
  await page.getByRole('button', { name: 'Lưu ảnh tranh này' }).click();
  await expect(page.getByRole('button', { name: /Xóa ảnh \(dùng hình vẽ sẵn\)/ })).toBeVisible();
  const bg = await page.evaluate(async () => (await window.kidEnglish.db.getAllByIndex('images', 'lessonId', 'scene:bg'))[0]);
  expect(bg.word).toBe('farm');
  expect(Math.round((bg.width / bg.height) * 100)).toBe(133);

  // Ảnh sticker không bị dùng cho từ "cow" của bài học.
  const forLesson = await page.evaluate(async () => {
    const { latestImageForWord } = await import('/js/db.js');
    return latestImageForWord(window.kidEnglish.db, 'cow');
  });
  expect(forLesson).toBeNull();

  // Trò chơi dùng ảnh mới.
  await page.evaluate(() => window.kidEnglish.go('home'));
  await openScene(page, 'Nông trại');
  await expect(page.locator('.sp-art img.sp-bg')).toBeVisible();
  await expect(page.locator('.tray-sticker[data-sticker="cow"] img.sp-img')).toBeVisible();
  await expect(page.locator('.tray-sticker[data-sticker="pig"] img')).toHaveCount(0);
  await drag(page, page.locator('.tray-sticker[data-sticker="cow"]'), await zonePoint(page, 'farm', 'grass'));
  await expect(page.locator('.placed[data-sticker="cow"] img.sp-img')).toBeVisible();
});
