// SPEC-roles: Đóng vai — hai bên rõ ràng, ai nói người đó sáng (`speaking`), vai khác mờ nhẹ (`quiet`, trừ thứ bé cần chạm);
// phụ đề lệch về phía người nói (màn ngang) / giữa (màn dọc).
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp } from './helpers.js';

/** Giọng giả đọc chậm (để thấy lúc đang nói) + ghi lại ai sáng / ai mờ mỗi khi có câu mới. */
async function slowSpeech(page, ms = 400) {
  await fakeSpeech(page);
  await page.addInitScript((d) => {
    window.__roles = [];
    const s = window.speechSynthesis;
    s.speak = (u) => {
      window.__spoken.push(u.text);
      // Đợi kit gắn lớp xong (cùng nhịp) rồi chụp trạng thái các vai.
      setTimeout(() => {
        const name = (el) => el.dataset.pupil ?? el.dataset.customer ?? el.dataset.patient ?? [...el.classList].find((c) => /^(jb-host|tc-desk|tc-student|sh-customer|dr-patient|pl-asker|pl-walker|pl-car)$/.test(c));
        window.__roles.push({
          text: u.text,
          speaking: [...document.querySelectorAll('.jb-role.speaking')].map(name),
          quiet: [...document.querySelectorAll('.jb-role.quiet')].map(name),
          side: document.querySelector('.jb-say .sp-caption')?.dataset.side ?? '',
        });
      }, 0);
      setTimeout(() => u.onend?.(), d);
    };
  }, ms);
}
const rolesAt = (page, text) => page.evaluate((t) => window.__roles.filter((r) => r.text === t).at(-1), text);
async function openJob(page, name) {
  await startApp(page);
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name }).click();
}

test.describe('màn ngang 1180×820', () => {
  test.use({ viewport: { width: 1180, height: 820 } });

  test('ROLE-01 Bán hàng: Bông bên trái sáng khi Bông nói, khách mờ; khách nói thì khách sáng, Bông mờ; phụ đề lệch về phía người nói; hết câu không còn lớp', async ({ page }) => {
    await slowSpeech(page, 250);
    await openJob(page, 'Bán hàng');
    await expect(page.locator('.jb-host')).toBeVisible();
    await expect.poll(() => rolesAt(page, "Let's fill the shop! Tap the food.")).toMatchObject({ speaking: ['jb-host'], side: 'left' });
    const items = page.locator('.jb-tray .dr-item');
    for (let i = 0; i < 3; i++) {
      await expect(page.locator('.sh-play')).toHaveAttribute('data-state', 'stock', { timeout: 15000 });
      const left = await items.count();
      await items.first().click();
      await expect.poll(async () => (await page.locator('.sh-play').getAttribute('data-state')) !== 'stock' || (await items.count()) === left - 1, { timeout: 15000 }).toBe(true);
    }
    const ask = await page.evaluate(() => new Promise((res) => {
      const t = setInterval(() => { const r = window.__roles.find((x) => /^Can I have /.test(x.text)); if (r) { clearInterval(t); res(r); } }, 50);
    }));
    expect(ask.speaking).toHaveLength(1);
    expect(ask.speaking[0]).not.toBe('jb-host');
    expect(ask.quiet).toEqual(['jb-host']);
    expect(ask.side).toBe('right');
    await expect(page.locator('.sh-play')).toHaveAttribute('data-state', 'order', { timeout: 15000 });
    await expect(page.locator('.jb-role.speaking, .jb-role.quiet')).toHaveCount(0, { timeout: 15000 });
  });

  test('ROLE-03 + ROLE-10: 🧹 giữa lúc đang nói → không còn vai nào sáng / mờ kẹt; Bông nói lại thì chỉ Bông sáng', async ({ page }) => {
    await slowSpeech(page, 1500);
    await openJob(page, 'Bán hàng');
    await expect(page.locator('.jb-host.speaking')).toHaveCount(1, { timeout: 15000 });
    await page.getByRole('button', { name: 'Bán lại' }).click();
    await expect(page.locator('.jb-host.speaking')).toHaveCount(1, { timeout: 15000 });
    await expect(page.locator('.jb-role.speaking')).toHaveCount(1);
  });

  test('ROLE-04 + ROLE-05 + ROLE-06 Cô giáo nhí: cô giáo nói → bàn cô giáo sáng, lớp không sáng; cả lớp chào → mọi bạn + bạn học sinh sáng, một phụ đề giữa; điểm danh do cô giáo gọi, các bạn (bé cần chạm) không bị mờ', async ({ page }) => {
    await slowSpeech(page, 250);
    await openJob(page, 'Cô giáo nhí');
    await expect.poll(() => rolesAt(page, 'Ring the bell, teacher!')).toMatchObject({ speaking: ['tc-student'] });
    await page.locator('.tc-bell').click();
    await expect.poll(() => rolesAt(page, 'Good morning, class!')).toMatchObject({ speaking: ['tc-desk'], side: 'left' });
    const morning = await (async () => { await expect.poll(() => rolesAt(page, 'Good morning, teacher!')).toBeTruthy(); return rolesAt(page, 'Good morning, teacher!'); })();
    expect(morning.speaking.length).toBe(4); // 3 bạn + bạn học sinh (cũng là học trò của lớp)
    expect(morning.speaking).toContain('tc-student');
    expect(morning.speaking).not.toContain('tc-desk');
    expect(morning.side).toBe('center');
    await expect.poll(() => page.evaluate(() => window.__roles.find((r) => /^Where's /.test(r.text)))).toBeTruthy();
    const where = await page.evaluate(() => window.__roles.find((r) => /^Where's /.test(r.text)));
    expect(where.speaking).toEqual(['tc-desk']); // cô giáo điểm danh
    expect(where.quiet).toEqual(['tc-student']); // các bạn không mờ lúc điểm danh
  });

  test('ROLE-01 Bác sĩ nhí: chú bác sĩ (vẽ sẵn) bên trái; bệnh nhân nói thì bệnh nhân sáng, Bông mờ; bệnh nhân không bao giờ bị mờ', async ({ page }) => {
    await slowSpeech(page, 200);
    await page.addInitScript(() => { window.__kidTest = { doctorNewAt: 2 }; }); // ca đầu là ca bệnh ("Hello, doctor!")
    await openJob(page, 'Bác sĩ nhí');
    await expect(page.locator('.jb-host[data-host="doctor"] svg.dr-doctor')).toHaveCount(1);
    // Rửa tay đúng thứ tự (xà phòng → nước → khăn) cho tới khi bệnh nhân vào.
    await expect(page.locator('.dr-play')).toHaveAttribute('data-state', 'wash', { timeout: 15000 });
    for (const id of ['soap', 'rinse', 'towel', 'gloves']) {
      const item = page.locator(`.dr-item[data-item="${id}"]`);
      if (!(await item.count())) continue;
      await item.click();
      await expect(item).toHaveCount(0, { timeout: 15000 });
    }
    await expect.poll(() => rolesAt(page, 'Hello, doctor!'), { timeout: 15000 }).toBeTruthy();
    const hello = await rolesAt(page, 'Hello, doctor!');
    expect(hello.speaking).toHaveLength(1);
    expect(hello.speaking[0]).not.toBe('jb-host');
    expect(hello.quiet).toEqual(['jb-host']);
    const all = await page.evaluate(() => window.__roles);
    expect(all.every((r) => r.quiet.every((q) => q === 'jb-host'))).toBe(true);
  });

  /** Vào Cảnh sát ở mức `level`, cố định chỗ ca đèn / ca qua đường. */
  async function openPoliceAt(page, level, trafficAt, crossAt) {
    await page.addInitScript(([t, c]) => { window.__kidTest = { policeTrafficAt: t, policeCrossAt: c }; }, [trafficAt, crossAt]);
    await startApp(page);
    await page.evaluate((l) => window.kidEnglish.setSetting('policeGame', { level: l, rounds: 0, lock: l, seen: {} }), level);
    await page.getByRole('button', { name: 'Trò chơi' }).click();
    await page.getByRole('button', { name: 'Đóng vai' }).click();
    await page.getByRole('button', { name: 'Cảnh sát giúp bạn' }).click();
  }

  test('ROLE-01 Cảnh sát: chú cảnh sát (vẽ sẵn) bên trái nói "Hello! Can I help you?" → chú sáng, bạn thú mờ; bạn thú kể mất đồ → bạn thú sáng; phụ đề câu chú hiện 👮', async ({ page }) => {
    await slowSpeech(page, 200);
    await openPoliceAt(page, 1, 2, undefined);
    await expect(page.locator('.jb-host[data-host="police"] svg.jb-police')).toHaveCount(1);
    await expect(page.locator('.pl-stage')).toHaveAttribute('data-scene', 'park');
    await expect.poll(() => rolesAt(page, 'Hello! Can I help you?'), { timeout: 15000 }).toMatchObject({ speaking: ['jb-host'], quiet: ['pl-asker'], side: 'left' });
    await expect.poll(async () => (await page.evaluate(() => window.__roles)).find((r) => /^Oh no! I lost my/.test(r.text)), { timeout: 15000 })
      .toMatchObject({ speaking: ['pl-asker'], quiet: ['jb-host'] });
    await expect(page.locator('.pl-play')).toHaveAttribute('data-state', 'find', { timeout: 15000 });
    // Chú cảnh sát, bạn thú, đồ không chồng lên nhau.
    const box = (sel) => page.locator(sel).first().boundingBox();
    const host = await box('.jb-host');
    const asker = await box('.pl-asker');
    expect(host.x + host.width).toBeLessThanOrEqual(asker.x + asker.width * 0.15);
    for (const item of await page.locator('.pl-item').all()) {
      const b = await item.boundingBox();
      expect(b.x).toBeGreaterThanOrEqual(asker.x + asker.width * 0.85);
    }
    if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/police-park.png` });
  });

  test('ROLE-01 Cảnh sát qua đường: bạn thú nhờ → bạn thú sáng, chú mờ; chú nói "Stop! Look left!" → chú sáng, bạn thú (bé cần chạm) không mờ; chú lên góc trên', async ({ page }) => {
    await slowSpeech(page, 200);
    await openPoliceAt(page, 2, 2, 0);
    await expect(page.locator('.pl-stage')).toHaveAttribute('data-scene', 'road', { timeout: 15000 });
    await expect.poll(() => rolesAt(page, 'Can you help me cross the road?'), { timeout: 15000 }).toMatchObject({ speaking: ['pl-walker'] });
    expect((await rolesAt(page, 'Can you help me cross the road?')).quiet).toContain('jb-host');
    await expect.poll(() => rolesAt(page, 'Stop! Look left!'), { timeout: 15000 }).toMatchObject({ speaking: ['jb-host'] });
    expect((await rolesAt(page, 'Stop! Look left!')).quiet).not.toContain('pl-walker');
    const host = await page.locator('.jb-host').boundingBox();
    const road = await page.locator('.pl-road').boundingBox();
    expect(host.y + host.height).toBeLessThanOrEqual(road.y);
    if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/police-road.png` });
  });
});

test.describe('màn dọc 390×760', () => {
  test.use({ viewport: { width: 390, height: 760 } });
  test('ROLE-08: phụ đề luôn giữa (không lệch), người nói vẫn sáng', async ({ page }) => {
    await slowSpeech(page, 250);
    await openJob(page, 'Bán hàng');
    await expect.poll(() => rolesAt(page, "Let's fill the shop! Tap the food.")).toMatchObject({ speaking: ['jb-host'], side: 'center' });
  });
});

test('ROLE-11: trò chưa khai báo vai (Bưu tá) chạy như cũ — không có lớp vai, phụ đề giữa', async ({ page }) => {
  await slowSpeech(page, 150);
  await openJob(page, 'Bưu tá');
  await expect.poll(() => page.evaluate(() => window.__spoken.length)).toBeGreaterThan(0);
  await expect(page.locator('.jb-role')).toHaveCount(0);
  await expect(page.locator('.jb-host')).toHaveCount(0);
});

// ---------- SPEC-roles mục 9: người bên trái (cô bán hàng, chú bác sĩ, cô giáo) — vẽ sẵn, bố mẹ thay ảnh được ----------
const pngBlob = (page) => page.evaluate(async () => {
  const c = document.createElement('canvas');
  c.width = 120;
  c.height = 120;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 120, 120);
  g.fillStyle = '#e64980';
  g.fillRect(30, 20, 60, 90);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  return Array.from(new Uint8Array(await blob.arrayBuffer()));
});

test('vẽ sẵn: Bán hàng có cô bán hàng, Cô giáo nhí có cô giáo ở bàn, phụ đề câu cô bán hàng hiện 👩', async ({ page }) => {
  await fakeSpeech(page);
  await openJob(page, 'Bán hàng');
  await expect(page.locator('.jb-host[data-host="seller"] svg.jb-seller')).toHaveCount(1);
  await expect(page.locator('.jb-say .sp-caption[data-who="bong"] .jb-who')).toHaveText('👩', { timeout: 15000 });
  await page.getByRole('button', { name: 'Chọn nghề' }).click();
  await page.getByRole('button', { name: 'Cô giáo nhí' }).click();
  await expect(page.locator('.tc-desk svg.jb-teacher')).toHaveCount(1);
  await expect(page.locator('.tc-student svg.jb-student')).toHaveCount(1); // vai học trò: bạn học sinh (không còn Bông)
  await expect(page.locator('.jb-say .sp-caption[data-who="bong"] .jb-who')).toHaveText('🧒', { timeout: 15000 });
});

test('Góc bố mẹ → Ảnh Đóng vai: chọn ảnh cô bán hàng → trò Bán hàng dùng ảnh; "Dùng hình vẽ sẵn" quay về hình vẽ', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  const { openParent } = await import('./helpers.js');
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Đóng vai/ }).click();
  const shopBox = page.locator('.jb-admin-person[data-person="shop"]');
  await expect(shopBox.locator('svg.jb-seller')).toHaveCount(1);
  await expect(page.locator('.jb-admin-person[data-person="teacher"] svg.jb-teacher')).toHaveCount(1);
  await expect(page.locator('.jb-admin-person[data-person="student"] svg.jb-student')).toHaveCount(1);
  await expect(page.locator('.jb-admin-person[data-person="police"] svg.jb-police')).toHaveCount(1);
  const bytes = await pngBlob(page);
  await shopBox.locator('input[type=file]').setInputFiles({ name: 'seller.png', mimeType: 'image/png', buffer: Buffer.from(bytes) });
  await expect(page.locator('.jb-admin-person[data-person="shop"] img.jb-person-preview')).toHaveCount(1, { timeout: 15000 });
  await page.locator('.child-top .sp-back, .parent-top button').first().click().catch(() => {});
  await page.goto('/?nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Bán hàng' }).click();
  await expect(page.locator('.jb-host img.jb-host-img')).toHaveCount(1, { timeout: 15000 });
  // Quay về hình vẽ sẵn.
  await page.evaluate(async () => (await import('/js/db.js')).removeWordImage(window.kidEnglish.db, 'jobs:people', 'shop'));
  await page.getByRole('button', { name: 'Chọn nghề' }).click();
  await page.getByRole('button', { name: 'Bán hàng' }).click();
  await expect(page.locator('.jb-host svg.jb-seller')).toHaveCount(1, { timeout: 15000 });
});

test('Góc bố mẹ → Ảnh Bác sĩ nhí có ô "Chú bác sĩ"; ảnh bố mẹ thêm thay hình chú bác sĩ trong trò chơi', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  const { openParent } = await import('./helpers.js');
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Bác sĩ nhí/ }).click();
  const box = page.locator('.jb-admin-person[data-person="doctor"]');
  await expect(box.locator('svg.dr-doctor')).toHaveCount(1);
  await box.locator('input[type=file]').setInputFiles({ name: 'doctor.png', mimeType: 'image/png', buffer: Buffer.from(await pngBlob(page)) });
  await expect(page.locator('.jb-admin-person[data-person="doctor"] img.jb-person-preview')).toHaveCount(1, { timeout: 15000 });
  await page.goto('/?nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Bác sĩ nhí' }).click();
  await expect(page.locator('.jb-host img.jb-host-img')).toHaveCount(1, { timeout: 15000 });
});

test('Góc bố mẹ → Ảnh Đóng vai: ảnh chú cảnh sát bố mẹ thêm thay hình vẽ trong trò Cảnh sát', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  const { openParent } = await import('./helpers.js');
  await openParent(page);
  await page.getByRole('button', { name: /Ảnh Đóng vai/ }).click();
  const box = page.locator('.jb-admin-person[data-person="police"]');
  await box.locator('input[type=file]').setInputFiles({ name: 'police.png', mimeType: 'image/png', buffer: Buffer.from(await pngBlob(page)) });
  await expect(page.locator('.jb-admin-person[data-person="police"] img.jb-person-preview')).toHaveCount(1, { timeout: 15000 });
  await page.goto('/?nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.getByRole('button', { name: 'Trò chơi' }).click();
  await page.getByRole('button', { name: 'Đóng vai' }).click();
  await page.getByRole('button', { name: 'Cảnh sát giúp bạn' }).click();
  await expect(page.locator('.jb-host img.jb-host-img')).toHaveCount(1, { timeout: 15000 });
});

test.describe('Cảnh sát màn dọc 390×760', () => {
  test.use({ viewport: { width: 390, height: 760 } });
  test('chú cảnh sát góc dưới trái, không đè bạn thú / đồ', async ({ page }) => {
    await fakeSpeech(page);
    await page.addInitScript(() => { window.__kidTest = { policeTrafficAt: 2 }; });
    await startApp(page);
    await page.getByRole('button', { name: 'Trò chơi' }).click();
    await page.getByRole('button', { name: 'Đóng vai' }).click();
    await page.getByRole('button', { name: 'Cảnh sát giúp bạn' }).click();
    await expect(page.locator('.pl-play')).toHaveAttribute('data-state', 'find', { timeout: 15000 });
    const host = await page.locator('.jb-host').boundingBox();
    const asker = await page.locator('.pl-asker').boundingBox();
    expect(host.x + host.width).toBeLessThanOrEqual(asker.x + asker.width * 0.2);
    for (const item of await page.locator('.pl-item').all()) {
      const b = await item.boundingBox();
      expect(b.y + b.height <= host.y || b.x >= host.x + host.width).toBe(true);
    }
    if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/police-portrait.png` });
  });
});
