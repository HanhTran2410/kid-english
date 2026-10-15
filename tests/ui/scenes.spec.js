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

  // 5. Chạm sticker đã dán: Bông nói lại câu. Dùng sticker dán sau cùng (nằm trên cùng — sticker của việc vừa xong
  // có thể đè lên cow nếu Bông giao việc "in the tree").
  const top = page.locator('.placed').last();
  const topName = await top.getAttribute('data-sticker');
  await top.click();
  await expect.poll(() => lastSpoken(page)).toMatch(new RegExp(`^The ${topName.replace(/-/g, ' ')} (is|are) `));

  // 6. Kéo sticker đó vào khay → gỡ khỏi tranh.
  const before = await page.locator('.placed').count();
  const tray = await page.locator('.sp-tray').boundingBox();
  await drag(page, top, { x: tray.x + tray.width / 2, y: tray.y + tray.height / 2 });
  await expect(page.locator('.placed')).toHaveCount(before - 1);

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
  await expect(page.locator('.placed')).toHaveCount(total);
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
  await page.getByRole('button', { name: 'Copy prompt không cần ảnh mẫu' }).click();
  await expect.poll(() => page.evaluate(() => window.__copied)).toContain('A small blue pond\n- Position: x = 35%–73%, y = 76%–94%');

  // Prompt kèm ảnh mẫu + ảnh bố cục mẫu (PNG 1600 × 1200 từ hình vẽ sẵn).
  await page.getByRole('button', { name: '2. Copy prompt kèm ảnh mẫu' }).click();
  await expect.poll(() => page.evaluate(() => window.__copied)).toMatch(/^I attached a REFERENCE LAYOUT IMAGE/);
  await expect(page.getByRole('button', { name: '1. Tải ảnh bố cục mẫu' })).toBeEnabled();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '1. Tải ảnh bố cục mẫu' }).click();
  expect((await download).suggestedFilename()).toBe('bo-cuc-farm.png');
  const layout = await page.evaluate(async () => {
    const { layoutImage } = await import('/js/screens/parent/scenes.js');
    const { SCENE_BY_ID } = await import('/js/sticker-scenes.js');
    const blob = await layoutImage(SCENE_BY_ID.get('farm'));
    const bmp = await createImageBitmap(blob);
    return { type: blob.type, w: bmp.width, h: bmp.height };
  });
  expect(layout).toEqual({ type: 'image/png', w: 1600, h: 1200 });

  // Ảnh một sticker: cow.
  await page.getByText('Thay từng sticker').click(); // mở mục thu gọn
  const cowItem = page.locator('.sp-admin-item').filter({ has: page.getByText('cow', { exact: true }) });
  const chooser = page.waitForEvent('filechooser');
  await cowItem.getByRole('button', { name: 'Chọn ảnh' }).click();
  await (await chooser).setFiles(await testImage(page, 400, 400));
  await expect(page.locator('.sp-admin-item').filter({ has: page.getByText('cow', { exact: true }) }).locator('img.sp-img')).toHaveCount(1);
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

test('Góc bố mẹ: dùng lại ảnh có sẵn ở bài học làm sticker (tự bỏ nền); ảnh lưới chỉ gồm sticker còn thiếu ảnh', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  // Ảnh "cow" và "apple" bố mẹ đã thêm ở bài học (nền trắng, hình có viền đậm).
  await page.evaluate(async () => {
    const { setWordImage } = await import('/js/db.js');
    for (const word of ['cow', 'apple']) {
      const c = document.createElement('canvas');
      c.width = 300;
      c.height = 300;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 300, 300);
      ctx.fillStyle = '#e33';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(150, 150, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
      await setWordImage(window.kidEnglish.db, { lessonId: 'lesson-animals', word, blob, mimeType: 'image/jpeg', width: 300, height: 300 });
    }
  });
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Dán tranh/ }).click();
  // Trang danh sách: dùng lại cho cả 7 tranh (cow ở Nông trại; apple ở Nông trại + Nhà bếp → 1 ảnh).
  await expect(page.getByRole('button', { name: 'Dùng lại 2 ảnh' })).toBeVisible();
  await page.getByRole('button', { name: 'Dùng lại 2 ảnh' }).click();
  await expect(page.getByText(/Không có ảnh nào trong bài học trùng tên sticker/)).toBeVisible();
  const saved = await page.evaluate(async () => (await window.kidEnglish.db.getAllByIndex('images', 'lessonId', 'scene:stickers'))
    .map((r) => [r.word, r.mimeType]).sort());
  expect(saved).toEqual([['apple', 'image/png'], ['cow', 'image/png']]);
  // Ảnh bài học vẫn còn nguyên (không bị chuyển đi).
  expect(await page.evaluate(async () => (await window.kidEnglish.db.getAllByIndex('images', 'lessonId', 'lesson-animals')).length)).toBe(2);

  // Trang Nông trại: 2/16 đã có ảnh; ảnh lưới chỉ cho 14 sticker còn thiếu.
  await page.getByRole('button', { name: /Nông trại/ }).click();
  await expect(page.getByRole('heading', { name: 'Ảnh sticker — 2/16 đã có ảnh' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Ảnh lưới — 1 ảnh cho 14 sticker chưa có ảnh/ })).toBeVisible();
  await page.evaluate(() => {
    window.__copied = '';
    navigator.clipboard.writeText = async (t) => { window.__copied = t; };
  });
  await page.getByRole('button', { name: 'Copy prompt ảnh lưới' }).click();
  await expect.poll(() => page.evaluate(() => window.__copied)).toMatch(/4-column × 4-row/);
  const copied = await page.evaluate(() => window.__copied);
  expect(copied).not.toMatch(/— Cow:/);
  expect(copied).toMatch(/— Pig:/);
});

test('dán tranh: nút 🧹 dán lại từ đầu — hỏi lại, ✖ thì giữ, ✔ thì xóa hết tranh này (tranh khác giữ nguyên)', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(() => window.kidEnglish.setSetting('stickerScenes', {
    last: 'farm', farm: [{ s: 'cow', x: 17, y: 25 }, { s: 'duck', x: 54, y: 85 }], beach: [{ s: 'fish', x: 50, y: 40 }],
  }));
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Dán tranh' }).click();
  await page.getByRole('button', { name: 'Bãi biển' }).click();
  await expect(page.locator('.placed')).toHaveCount(1);
  await page.getByRole('button', { name: 'Chọn tranh khác' }).click();
  await page.getByRole('button', { name: 'Nông trại' }).click();
  await expect(page.locator('.placed')).toHaveCount(2);

  await page.getByRole('button', { name: 'Dán lại từ đầu' }).click();
  await expect.poll(() => lastSpoken(page)).toBe('Start again?');
  await page.getByRole('button', { name: 'Không xóa' }).click();
  await expect(page.locator('.placed')).toHaveCount(2);

  await page.getByRole('button', { name: 'Dán lại từ đầu' }).click();
  await page.getByRole('button', { name: 'Xóa hết, dán lại' }).click();
  await expect(page.locator('.placed')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Dán lại từ đầu' })).toBeHidden();
  await expect.poll(() => lastSpoken(page)).toBe("Let's start again!");
  const saved = await page.evaluate(() => window.kidEnglish.settings.stickerScenes);
  expect(saved.farm).toEqual([]);
  expect(saved.beach).toHaveLength(1);
});

test('dùng lại ảnh cho bài từ vựng: từ bài này chưa có ảnh thì lấy ảnh mới nhất ở bài khác; ảnh của chính bài được ưu tiên; ảnh gia đình thật và ảnh sticker không bị lấy', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  const result = await page.evaluate(async () => {
    const { setWordImage, latestImageForWord } = await import('/js/db.js');
    const { loadLessonVisuals } = await import('/js/player/visuals.js');
    const db = window.kidEnglish.db;
    const png = async (color) => {
      const c = document.createElement('canvas');
      c.width = 10;
      c.height = 10;
      const ctx = c.getContext('2d');
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 10, 10);
      return new Promise((r) => c.toBlob(r, 'image/png'));
    };
    const put = async (lessonId, word, color, at) => setWordImage(db, { lessonId, word, blob: await png(color), mimeType: 'image/png', width: 10, height: 10 }, at);
    await put('lesson-fruits', 'apple', 'red', 1000);
    await put('lesson-snacks', 'apple', 'green', 2000); // mới hơn
    await put('lesson-food', 'bread', 'brown', 500); // ảnh của chính bài Food
    await put('lesson-other', 'bread', 'yellow', 3000);
    await put('profile:family', 'mummy', 'pink', 4000);
    await put('scene:stickers', 'banana', 'yellow', 4000);
    const food = { id: 'lesson-food', words: [{ en: 'apple', emoji: '🍎' }, { en: 'bread', emoji: '🍞' }, { en: 'banana', emoji: '🍌' }, { en: 'mummy', emoji: '👩' }] };
    const visuals = await loadLessonVisuals(db, food);
    const colorOf = async (word) => {
      const url = visuals.get(word).url;
      if (!url) return null;
      const bmp = await createImageBitmap(await (await fetch(url)).blob());
      const c = document.createElement('canvas');
      c.width = 1;
      c.height = 1;
      const ctx = c.getContext('2d');
      ctx.drawImage(bmp, 0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)].join(',');
    };
    return {
      apple: await colorOf('apple'), bread: await colorOf('bread'), banana: await colorOf('banana'), mummy: await colorOf('mummy'),
      mummyLatest: await latestImageForWord(db, 'mummy'),
    };
  });
  expect(result.apple).toBe('0,128,0'); // ảnh mới nhất ở bài khác (green)
  expect(result.bread).toBe('165,42,42'); // ảnh của chính bài (brown), dù bài khác có ảnh mới hơn
  expect(result.banana).toBeNull(); // ảnh sticker không dùng cho bài học
  expect(result.mummy).toBeNull(); // ảnh gia đình thật không dùng cho bài khác
  expect(result.mummyLatest).toBeNull();
});

test('chia sẻ ảnh Dán tranh: tạo file .zip chỉ gồm ảnh sticker + ảnh tranh → máy khác nhập từ file (ở Ảnh Dán tranh hoặc Quản lý bài)', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(async () => {
    const { setWordImage } = await import('/js/db.js');
    const png = async (color) => {
      const c = document.createElement('canvas');
      c.width = 10;
      c.height = 10;
      const ctx = c.getContext('2d');
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 10, 10);
      return new Promise((r) => c.toBlob(r, 'image/png'));
    };
    const db = window.kidEnglish.db;
    await setWordImage(db, { lessonId: 'scene:stickers', word: 'cow', blob: await png('red'), mimeType: 'image/png', width: 10, height: 10 });
    await setWordImage(db, { lessonId: 'scene:bg', word: 'farm', blob: await png('green'), mimeType: 'image/png', width: 10, height: 10 });
    await setWordImage(db, { lessonId: 'lesson-x', word: 'apple', blob: await png('blue'), mimeType: 'image/png', width: 10, height: 10 });
    await window.kidEnglish.setSetting('stickerScenes', { last: 'farm', farm: [{ s: 'cow', x: 10, y: 10 }] });
  });
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Dán tranh/ }).click();
  await expect(page.getByText(/Máy này có 2 ảnh Dán tranh/)).toBeVisible();
  await page.getByRole('button', { name: '1. Tạo file ảnh' }).click();
  await expect(page.getByText(/Đã tạo dan-tranh-anh-.*\.zip \(2 ảnh\)/)).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '2. Gửi file' }).click();
  const file = await (await download).path();
  expect((await download).suggestedFilename()).toMatch(/^dan-tranh-anh-\d{4}-\d{2}-\d{2}\.zip$/);

  // "Máy khác": xóa ảnh Dán tranh rồi nhập lại từ file.
  const clear = () => page.evaluate(async () => {
    const db = window.kidEnglish.db;
    for (const id of ['scene:stickers', 'scene:bg']) for (const img of await db.getAllByIndex('images', 'lessonId', id)) await db.delete('images', img.id);
  });
  const sceneWords = () => page.evaluate(async () => {
    const db = window.kidEnglish.db;
    const all = [...await db.getAllByIndex('images', 'lessonId', 'scene:stickers'), ...await db.getAllByIndex('images', 'lessonId', 'scene:bg')];
    return all.map((i) => `${i.lessonId}|${i.word}`).sort();
  });
  await clear();
  await page.evaluate(() => window.kidEnglish.go('parent', { view: 'scenes' }));
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Nhập ảnh từ file' }).click();
  await (await chooser).setFiles(file);
  await expect(page.getByText(/Máy này có 2 ảnh Dán tranh/)).toBeVisible();
  expect(await sceneWords()).toEqual(['scene:bg|farm', 'scene:stickers|cow']);
  // File chỉ gồm ảnh Dán tranh: không mang theo ảnh bài học, không đổi tranh bé đã dán.
  expect(await page.evaluate(async () => (await window.kidEnglish.db.getAllByIndex('images', 'word', 'apple')).length)).toBe(1);
  expect(await page.evaluate(() => window.kidEnglish.settings.stickerScenes.farm.length)).toBe(1);

  // Nhập ở Quản lý bài cũng được.
  await clear();
  await page.evaluate(() => window.kidEnglish.go('parent', { view: 'lessons' }));
  const chooser2 = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Nhập bài từ file' }).click();
  await (await chooser2).setFiles(file);
  await expect(page.getByText('Đã nhận 2 ảnh Dán tranh.', { exact: true })).toBeVisible();
  await expect.poll(sceneWords).toEqual(['scene:bg|farm', 'scene:stickers|cow']);
});
