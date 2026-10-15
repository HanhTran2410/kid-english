// Mục Phonics (SPEC-phonics.md): sơ đồ tư duy, tìm từ đúng âm, chữ hoa – chữ thường, nghe từ chọn chữ, bắt bóng chữ.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, playThrough, openParent } from './helpers.js';

const spoken = (page) => page.evaluate(() => window.__spoken);

test.beforeEach(async ({ page }) => {
  await fakeSpeech(page);
});

test('màn hình chính có nút Chữ cái; 5 bài A–Z; sơ đồ chữ A: nhánh mọc ra, chạm từ nào Bông đọc từ đó', async ({ page }) => {
  await startApp(page);
  await page.getByRole('button', { name: 'Chữ cái' }).click();
  await expect(page.locator('.lesson-card')).toHaveCount(5);
  await expect(page.locator('.lesson-card').first()).toHaveAttribute('aria-label', 'Letters A–F');
  await expect(page.locator('.lesson-card').first().locator('.lesson-words')).toHaveText('A B C D E F');
  await page.getByRole('button', { name: 'Letters A–F', exact: true }).click();

  await expect(page.locator('.mind-center')).toBeVisible();
  await expect(page.locator('.mind-word')).toHaveCount(6);
  await expect(page.locator('.mind-word.shown')).toHaveCount(6);
  await expect(page.locator('.mind-word').first().locator('.hl')).toHaveText('a');
  // Bé chạm khám phá: chạm "apple" → Bông đọc "A, apple!".
  await page.getByRole('button', { name: 'apple', exact: true }).click({ force: true });
  await expect.poll(async () => (await spoken(page)).includes('A, apple!')).toBe(true);
  // Chạm chữ giữa: nghe lại câu giới thiệu.
  await page.locator('.mind-center').click({ force: true });
  await expect.poll(async () => (await spoken(page)).filter((t) => t === 'A! A is for ant!').length).toBeGreaterThanOrEqual(2);

  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();
  const said = await spoken(page);
  for (const line of ['A! A is for ant!', 'Ant!', 'Your turn! Tap a picture!', 'Great! You found all the A words!',
    'Which one starts with B?', "Let's pop the balloons!", 'Hooray! You popped them all!']) {
    expect(said).toContain(line);
  }
  expect(said.some((t) => /^Big [A-F]\. Find the small [A-F]!$/.test(t))).toBe(true);
  expect(said.some((t) => /! Which letter\?$/.test(t))).toBe(true);
  expect(said.some((t) => /^Pop the [A-F]!$/.test(t))).toBe(true);
  expect(said.join(' ')).not.toMatch(/wrong/i);
  // Tiến độ chữ lưu riêng (letter:a), không trừ sao.
  const a = await page.evaluate(async () => window.kidEnglish.db.get('progress', 'letter:a'));
  expect(a.practiceCount).toBeGreaterThan(0);
  expect(a.mastery).toBeGreaterThanOrEqual(0);
});

test('Ôn tập có câu hỏi chữ cái khi bé đã học chữ', async ({ page }) => {
  await startApp(page);
  await page.evaluate(async () => {
    for (const l of ['a', 'b', 'c']) await window.kidEnglish.db.put('progress', { word: `letter:${l}`, emoji: '🔤', mastery: 0, practiceCount: 1, lastPracticedAt: Date.now() });
  });
  await page.goto('/?fast&nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.getByRole('button', { name: 'Ôn tập' }).click();
  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();
  const said = await spoken(page);
  expect(said.some((t) => /^Big [ABC]\. Find the small [ABC]!$/.test(t) || /! Which letter\?$/.test(t))).toBe(true);
});

test('Góc bố mẹ: trang bài chữ cái có tiến độ từng chữ và ảnh lưới cho từng chữ', async ({ page }) => {
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Quản lý bài' }).click();
  await expect(page.locator('.lesson-meta').filter({ hasText: '🔤 Chữ cái' })).toHaveCount(5);
  await page.getByRole('button', { name: /Letters A–F/ }).click();
  await expect(page.getByRole('heading', { name: 'Tiến độ từng chữ' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Ảnh chữ Aa/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Ảnh chữ Ff/ })).toBeVisible();
});

test('theo review: chạm được ngay khi nhánh đang mọc (dừng đọc lần lượt, đọc từ bé chạm); chữ đã học thì sơ đồ mở ngay', async ({ page }) => {
  // Tốc độ thật (không ?fast) để kịp chạm khi nhánh đang mọc.
  await page.goto('/?nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click({ force: true });
  await page.getByRole('button', { name: 'Chữ cái' }).click({ force: true });
  await page.getByRole('button', { name: 'Letters A–F', exact: true }).click({ force: true });
  const ant = page.getByRole('button', { name: 'ant', exact: true });
  await expect(ant).toHaveClass(/shown/);
  await ant.dispatchEvent('click');
  await expect.poll(async () => (await spoken(page)).includes('A, ant!')).toBe(true);
  await expect(page.locator('.mind-word.shown')).toHaveCount(6);
  expect(await spoken(page)).not.toContain('Axe!');

  // Lần sau (chữ A đã học — tiến độ còn trên máy): mở ngay cả 6 nhánh, không đọc lần lượt từng từ.
  await page.goto('/?fast&nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click({ force: true });
  await page.getByRole('button', { name: 'Chữ cái' }).click({ force: true });
  await page.getByRole('button', { name: 'Letters A–F', exact: true }).click({ force: true });
  await page.getByRole('button', { name: 'Học lại' }).click({ force: true, timeout: 3000 }).catch(() => {});
  await expect(page.locator('.mind-word.shown')).toHaveCount(6);
  await expect.poll(async () => (await spoken(page)).includes('Your turn! Tap a picture!')).toBe(true);
  const said = await spoken(page);
  expect(said.slice(0, said.indexOf('Your turn! Tap a picture!'))).toEqual(['A! A is for ant!']);
});

test('máy cũ: bài phonics có sẵn tự cập nhật bộ từ mới (bỏ "orange" khỏi chữ O), giữ tên và tiến độ', async ({ page }) => {
  await startApp(page);
  await page.evaluate(async () => {
    const db = window.kidEnglish.db;
    const lesson = (await db.getAll('lessons')).find((l) => l.builtin === 'phonics-m-r');
    const o = lesson.letters.find((l) => l.letter === 'o');
    o.words.splice(1, 0, { en: 'orange', emoji: '🍊' });
    lesson.title = 'Chữ M–R của bé';
    lesson.timesCompleted = 3;
    await db.put('lessons', lesson);
  });
  await page.reload();
  await expect.poll(() => page.evaluate(async () => {
    const lesson = (await window.kidEnglish.db.getAll('lessons')).find((l) => l.builtin === 'phonics-m-r');
    return [lesson.letters.find((l) => l.letter === 'o').words.map((w) => w.en).join(','), lesson.title, lesson.timesCompleted];
  })).toEqual(['octopus,ox,otter,olive', 'Chữ M–R của bé', 3]);
});

test('ảnh thật (512px) trong sơ đồ nằm gọn trong thẻ, thẻ có ảnh cùng cỡ thẻ emoji, không đè lên chữ', async ({ page }) => {
  await startApp(page);
  await page.evaluate(async () => {
    const { setWordImage } = await import('/js/db.js');
    const db = window.kidEnglish.db;
    const lesson = (await db.getAll('lessons')).find((l) => l.builtin === 'phonics-a-f');
    const c = document.createElement('canvas'); c.width = 512; c.height = 512;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 512, 512); g.fillStyle = '#e33'; g.fillRect(60, 60, 392, 392);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg'));
    await setWordImage(db, { lessonId: lesson.id, word: 'ant', blob, mimeType: 'image/jpeg', width: 512, height: 512 });
  });
  await page.getByRole('button', { name: 'Chữ cái' }).click();
  await page.getByRole('button', { name: 'Letters A–F', exact: true }).click();
  const ant = page.getByRole('button', { name: 'ant', exact: true });
  await expect(ant.locator('img')).toBeVisible();
  await expect(page.locator('.mind-word.shown')).toHaveCount(6);
  const box = (l) => l.boundingBox();
  // Thẻ mọc ra có hiệu ứng: đợi thẻ "ant" và "axe" cùng cỡ (hết hiệu ứng) rồi mới đo — tránh test chập chờn.
  const axe = page.getByRole('button', { name: 'axe', exact: true });
  await expect.poll(async () => {
    const [a, b] = await Promise.all([box(ant), box(axe)]);
    return Math.abs(a.width - b.width) < 3 && Math.abs(a.height - b.height) < 3;
  }, { timeout: 5000 }).toBe(true);
  const [card, img, label, other] = await Promise.all([box(ant), box(ant.locator('img')), box(ant.locator('.word-label')),
    box(page.getByRole('button', { name: 'axe', exact: true }))]);
  expect(Math.abs(card.width - other.width)).toBeLessThan(3);
  expect(Math.abs(card.height - other.height)).toBeLessThan(3);
  expect(img.x).toBeGreaterThanOrEqual(card.x - 1);
  expect(img.x + img.width).toBeLessThanOrEqual(card.x + card.width + 1);
  expect(img.y + img.height).toBeLessThanOrEqual(label.y + 1);
});

test('thẻ bài phonics: có ảnh đã thêm thì dùng ảnh làm bìa (thay emoji); bài chưa có ảnh vẫn là emoji', async ({ page }) => {
  await startApp(page);
  await page.evaluate(async () => {
    const { setWordImage } = await import('/js/db.js');
    const db = window.kidEnglish.db;
    const lesson = (await db.getAll('lessons')).find((l) => l.builtin === 'phonics-a-f');
    for (const word of ['bear', 'bus']) {
      const c = document.createElement('canvas'); c.width = 64; c.height = 64;
      c.getContext('2d').fillRect(0, 0, 64, 64);
      const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
      await setWordImage(db, { lessonId: lesson.id, word, blob, mimeType: 'image/png', width: 64, height: 64 });
    }
  });
  await page.getByRole('button', { name: 'Chữ cái' }).click();
  const af = page.locator('.lesson-card[aria-label="Letters A–F"]');
  await expect(af.locator('img')).toBeVisible();
  expect(['bear', 'bus']).toContain(await af.getAttribute('data-cover'));
  await expect(page.locator('.lesson-card[aria-label="Letters G–L"] img')).toHaveCount(0);
});
