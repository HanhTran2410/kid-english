// Dán tranh (SPEC-scenes.md): kéo sticker vào tranh, Bông nói câu có giới từ, giao việc, lưu tranh.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken.slice());

/** Điểm giữa của một chỗ trong tranh (tọa độ màn hình). */
async function zonePoint(page, sceneId, zoneId) {
  const box = await page.evaluate(async ([sceneId, zoneId]) => {
    const { SCENE_BY_ID, zoneBox } = await import('/js/sticker-scenes.js');
    return zoneBox(SCENE_BY_ID.get(sceneId).zones.find((z) => z.id === zoneId));
  }, [sceneId, zoneId]);
  const r = await page.locator('.sp-scene').boundingBox();
  return { x: r.x + ((box.left + box.width / 2) / 100) * r.width, y: r.y + ((box.top + box.height / 2) / 100) * r.height };
}

async function drag(page, from, to) {
  const a = 'x' in from ? from : await from.boundingBox().then((b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 }));
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(a.x, a.y - 30, { steps: 3 });
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await page.mouse.up();
}

test('dán tranh: kéo vào tranh, chạm chọn → chạm chỗ, Bông giao việc, kéo ra ngoài, lưu lại', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(async () => {
    const db = window.kidEnglish.db;
    await db.put('stickers', { id: 'lion', firstEarnedAt: 1, count: 1 });
    await db.put('stickers', { id: 'duck', firstEarnedAt: 2, count: 2 });
  });

  await page.getByRole('button', { name: 'Sticker của bé' }).click();
  await page.getByRole('button', { name: 'Dán tranh' }).click();
  await expect(page.locator('.sp-scene[data-scene="farm"]')).toBeVisible();
  await expect.poll(() => spoken(page)).toContain("Let's play on the farm!");
  // Khay: sticker mới nhận đứng đầu, có ngón tay gợi ý; duck ×2 hiện số còn lại.
  await expect(page.locator('.tray-sticker')).toHaveCount(2);
  await expect(page.locator('.tray-sticker').first()).toHaveAttribute('data-sticker', 'duck');
  await expect(page.locator('.tray-sticker.hint')).toHaveCount(1);
  await expect(page.locator('.tray-sticker[data-sticker="duck"] .tray-left')).toHaveText('2');

  // 1. Kéo lion lên cây.
  await drag(page, page.getByRole('button', { name: 'Lion' }), await zonePoint(page, 'farm', 'tree'));
  await expect(page.locator('.placed[data-sticker="lion"]')).toHaveAttribute('data-zone', 'tree');
  await expect.poll(() => spoken(page)).toContain('The lion is in the tree!');
  await expect(page.locator('.tray-sticker[data-sticker="lion"]')).toHaveClass(/used-up/);

  // 2. Chạm chọn duck → chạm vào ao.
  await page.getByRole('button', { name: 'Duck' }).click();
  await expect(page.locator('.tray-sticker.selected')).toHaveAttribute('data-sticker', 'duck');
  const water = await zonePoint(page, 'farm', 'water');
  await page.mouse.click(water.x, water.y);
  await expect(page.locator('.placed[data-sticker="duck"]')).toHaveAttribute('data-zone', 'water');
  await expect.poll(() => spoken(page)).toContain('The duck is in the water!');
  await expect(page.locator('.tray-sticker[data-sticker="duck"] .tray-left')).toHaveText('1');

  // 3. Chạm sticker đã dán: Bông nói lại câu.
  await page.locator('.placed[data-sticker="lion"]').click();
  await expect.poll(async () => (await spoken(page)).at(-1)).toBe('The lion is in the tree!');

  // 4. Chạm Bông → giao việc, chỗ cần đặt nhấp nháy; làm đúng → khen.
  await page.getByRole('button', { name: 'Bông giao việc' }).click();
  await expect(page.locator('.zone-target')).toHaveCount(1);
  await expect(page.locator('.sp-request')).toBeVisible();
  const sid = await page.locator('.sp-request').getAttribute('data-sticker');
  const zid = await page.locator('.zone-target').getAttribute('data-zone');
  await expect.poll(async () => (await spoken(page)).at(-1)).toMatch(new RegExp(`^Put the ${sid} (in|on|under) the `));
  await drag(page, page.locator(`.placed[data-sticker="${sid}"]`).first(), await zonePoint(page, 'farm', zid));
  await expect.poll(async () => (await spoken(page)).at(-1)).toMatch(new RegExp(`^Yay! The ${sid} is `));
  await expect(page.locator('.zone-target')).toHaveCount(0);
  await expect(page.locator('.sp-request')).toBeHidden();

  // 5. Kéo lion ra ngoài tranh → về khay.
  const tray = await page.locator('.sp-tray').boundingBox();
  await drag(page, page.locator('.placed[data-sticker="lion"]'), { x: tray.x + tray.width / 2, y: tray.y + tray.height / 2 });
  await expect(page.locator('.placed[data-sticker="lion"]')).toHaveCount(0);
  await expect(page.locator('.tray-sticker[data-sticker="lion"]')).not.toHaveClass(/used-up/);

  // 6. Đổi tranh rồi quay lại: tranh nông trại vẫn còn duck; mở lại màn thì vào tranh vừa chơi.
  await page.getByRole('button', { name: 'Phòng ngủ' }).click();
  await expect(page.locator('.sp-scene[data-scene="bedroom"] .placed')).toHaveCount(0);
  await expect.poll(() => spoken(page)).toContain("Let's play in the bedroom!");
  await page.getByRole('button', { name: 'Nông trại' }).click();
  await expect(page.locator('.placed[data-sticker="duck"]')).toHaveCount(1);
  await page.locator('.home-btn-small').click();
  await page.getByRole('button', { name: 'Sticker của bé' }).click();
  await page.getByRole('button', { name: 'Dán tranh' }).click();
  await expect(page.locator('.sp-scene[data-scene="farm"] .placed[data-sticker="duck"]')).toHaveCount(1);
});

test('dán tranh khi chưa có sticker: khay trống, chạm Bông → "Let\'s learn a lesson first!"', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Sticker của bé' }).click();
  await page.getByRole('button', { name: 'Dán tranh' }).click();
  await expect(page.locator('.tray-empty')).toBeVisible();
  await page.getByRole('button', { name: 'Bông giao việc' }).click();
  await expect.poll(async () => (await spoken(page)).at(-1)).toBe("Let's learn a lesson first!");
});

test('dán tranh: thả ngoài tranh và ngoài khay → sticker về chỗ cũ; chạm Bông lần 2 không đổi việc; sticker khác vào đúng chỗ không tính xong', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await page.evaluate(async () => {
    const db = window.kidEnglish.db;
    await db.put('stickers', { id: 'lion', firstEarnedAt: 1, count: 1 });
    await db.put('stickers', { id: 'duck', firstEarnedAt: 2, count: 1 });
    await window.kidEnglish.setSetting('stickerScenes', { last: 'farm', farm: [{ s: 'lion', x: 17, y: 25 }] });
  });
  await page.getByRole('button', { name: 'Sticker của bé' }).click();
  await page.getByRole('button', { name: 'Dán tranh' }).click();
  const lion = page.locator('.placed[data-sticker="lion"]');
  await expect(lion).toHaveAttribute('data-zone', 'tree');

  // Thả lên thanh trên cùng (ngoài tranh, ngoài khay): lion quay về cây, không mất.
  const top = await page.locator('.sp-tabs').boundingBox();
  await drag(page, lion, { x: top.x + top.width + 40, y: top.y + top.height / 2 });
  await expect(lion).toHaveAttribute('data-zone', 'tree');
  await expect(lion).not.toHaveClass(/lifted/);

  // Chạm Bông 2 lần: cùng một việc.
  await page.getByRole('button', { name: 'Bông giao việc' }).click();
  const zid = await page.locator('.zone-target').getAttribute('data-zone');
  const sid = await page.locator('.sp-request').getAttribute('data-sticker');
  await page.getByRole('button', { name: 'Bông giao việc' }).click();
  await expect(page.locator('.zone-target')).toHaveAttribute('data-zone', zid);
  await expect(page.locator('.sp-request')).toHaveAttribute('data-sticker', sid);

  // Sticker khác đặt vào đúng chỗ: chỉ mô tả, việc vẫn còn.
  const other = sid === 'lion' ? 'duck' : 'lion';
  const target = await zonePoint(page, 'farm', zid);
  const from = other === 'lion' ? lion : page.getByRole('button', { name: 'Duck' });
  await drag(page, from, target);
  await expect.poll(async () => (await spoken(page)).at(-1)).toMatch(new RegExp(`^The ${other} is `));
  await expect(page.locator('.zone-target')).toHaveAttribute('data-zone', zid);
  await expect(page.locator('.sp-request')).toBeVisible();
});
