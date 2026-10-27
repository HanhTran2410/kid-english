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
        const name = (el) => el.dataset.pupil ?? el.dataset.customer ?? el.dataset.patient ?? [...el.classList].find((c) => /^(jb-host|tc-desk|tc-student|sh-customer|dr-patient)$/.test(c));
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

  test('ROLE-04 + ROLE-05 + ROLE-06 Cô giáo nhí: cô giáo nói → bàn cô giáo sáng, lớp không sáng; cả lớp chào → mọi bạn sáng, một phụ đề giữa; điểm danh: các bạn (bé cần chạm) không bị mờ', async ({ page }) => {
    await slowSpeech(page, 250);
    await openJob(page, 'Cô giáo nhí');
    await expect.poll(() => rolesAt(page, 'Ring the bell, teacher!')).toMatchObject({ speaking: ['tc-student'] });
    await page.locator('.tc-bell').click();
    await expect.poll(() => rolesAt(page, 'Good morning, class!')).toMatchObject({ speaking: ['tc-desk'], side: 'left' });
    const morning = await (async () => { await expect.poll(() => rolesAt(page, 'Good morning, teacher!')).toBeTruthy(); return rolesAt(page, 'Good morning, teacher!'); })();
    expect(morning.speaking.length).toBe(3);
    expect(morning.speaking).not.toContain('tc-desk');
    expect(morning.side).toBe('center');
    await expect.poll(() => page.evaluate(() => window.__roles.find((r) => /^Where's /.test(r.text)))).toBeTruthy();
    const where = await page.evaluate(() => window.__roles.find((r) => /^Where's /.test(r.text)));
    expect(where.speaking).toEqual(['tc-student']);
    expect(where.quiet).toEqual(['tc-desk']); // các bạn không mờ lúc điểm danh
  });

  test('ROLE-01 Bác sĩ nhí: Bông bác sĩ (huy hiệu 🩺) bên trái; bệnh nhân nói thì bệnh nhân sáng, Bông mờ; bệnh nhân không bao giờ bị mờ', async ({ page }) => {
    await slowSpeech(page, 200);
    await openJob(page, 'Bác sĩ nhí');
    await expect(page.locator('.jb-host .jb-host-badge')).toHaveText('🩺');
    // Rửa tay: chạm món đúng theo thứ tự cho tới khi bệnh nhân vào.
    for (let g = 0; g < 40 && !(await page.evaluate(() => window.__spoken.includes('Hello, doctor!'))); g++) {
      if ((await page.locator('.dr-play').getAttribute('data-state')) === 'wash') {
        const want = await page.locator('.dr-wash').getAttribute('data-want').catch(() => null);
        const item = want ? page.locator(`.jb-tray .dr-item[data-item="${want}"]`) : page.locator('.jb-tray .dr-item').first();
        await item.click({ timeout: 1000 }).catch(() => {});
      }
      await page.waitForTimeout(250);
    }
    await expect.poll(() => rolesAt(page, 'Hello, doctor!'), { timeout: 15000 }).toBeTruthy();
    const hello = await rolesAt(page, 'Hello, doctor!');
    expect(hello.speaking).toHaveLength(1);
    expect(hello.speaking[0]).not.toBe('jb-host');
    expect(hello.quiet).toEqual(['jb-host']);
    const all = await page.evaluate(() => window.__roles);
    expect(all.every((r) => r.quiet.every((q) => q === 'jb-host'))).toBe(true);
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
