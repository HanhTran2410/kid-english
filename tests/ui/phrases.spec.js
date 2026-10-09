// Test giao diện mục "Câu nói hằng ngày" (SPEC-v1.0, giai đoạn 1.0-a).
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent, playThrough } from './helpers.js';

const FENCE = '```';
const PASTED = `Here is your lesson:
${FENCE}json
{
  "version": 2, "kind": "phrases", "title": "Going out", "emoji": "🚪", "routine": true,
  "phrases": [
    { "id": "p1", "en": "Put on your shoes", "vi": "Đi giày", "emoji": "👟", "motion": "put-on", "requiredKeywords": ["put on"], "keywords": ["shoes"], "chunks": ["Put on", "your shoes"] },
    { "id": "p2", "en": "Open the door", "vi": "Mở cửa", "emoji": "🚪", "motion": "open", "requiredKeywords": ["open"], "keywords": ["door"] },
    { "id": "p3", "en": "Let's go", "vi": "Đi thôi", "emoji": "🚶", "motion": "dance" }
  ],
  "commands": ["p1", "p2"]
}
${FENCE}`;

const progressOf = (page, key) => page.evaluate(async (k) => (await window.kidEnglish.db.get('progress', k)) ?? null, key);

test.beforeEach(async ({ page }) => {
  await fakeSpeech(page);
});

test('màn hình chính có nút Phrases; học hết bài Morning: xem → làm theo → nói theo → chọn hình → Hoan hô', async ({ page }) => {
  await startApp(page);
  await expect(page.getByText('Phrases', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Câu nói' }).click();
  // Danh sách bài câu chỉ có bài câu, không lẫn bài từ vựng.
  await expect(page.locator('.lesson-card')).toHaveCount(1);
  const card = page.getByRole('button', { name: 'Morning', exact: true });
  await expect(card.locator('.lesson-words')).toHaveText('⏰🧼🪥👕');
  await card.click();

  await expect(page.locator('.scene')).toBeVisible();
  await expect(page.locator('.phrase-text')).toHaveText('Wake up');
  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();

  const spoken = await page.evaluate(() => window.__spoken);
  for (const line of ['Wash', 'your face', 'Wash your face!', 'Your turn! Wash your face!', 'Can you say: Wash your face?']) {
    expect(spoken).toContain(line);
  }
  expect(spoken.some((t) => t.startsWith('Which one is:'))).toBe(true);
  expect(spoken.join(' ')).not.toMatch(/wrong/i);

  await page.locator('.done-btn').click();
  await page.getByRole('button', { name: 'Câu nói' }).click();
  await expect(page.getByRole('button', { name: 'Morning', exact: true }).locator('.lesson-stars')).toHaveText('⭐');

  // Tiến độ câu lưu riêng (khóa phrase:…), không lẫn vào phần từ vựng.
  expect(await progressOf(page, 'phrase:wash your face')).not.toBeNull();
  await page.getByRole('button', { name: 'Về màn hình chính' }).click();
  await expect(page.getByRole('button', { name: 'Ôn tập' })).toHaveClass(/disabled/);
});

test('chạm ✔ nhiều lần chỉ +1; chọn sai không trừ sao, chỉ ghi lịch sử', async ({ page }) => {
  await startApp(page);
  await page.getByRole('button', { name: 'Câu nói' }).click();
  await page.getByRole('button', { name: 'Morning', exact: true }).click();
  const did = page.locator('.did-btn');
  await did.waitFor({ timeout: 20000 });
  for (let i = 0; i < 3; i++) await did.click({ force: true, timeout: 1000 }).catch(() => {});
  await expect.poll(async () => (await progressOf(page, 'phrase:wake up'))?.mastery).toBe(1);

  // Đặt sẵn 2⭐ cho mọi câu rồi nhảy tới trò chọn hình, chọn sai trước.
  await page.evaluate(async () => {
    const db = window.kidEnglish.db;
    for (const p of ['wake up', 'wash your face', 'brush your teeth', 'put on your shirt']) {
      const rec = (await db.get('progress', `phrase:${p}`)) ?? { word: `phrase:${p}`, emoji: '', practiceCount: 1, lastPracticedAt: 1 };
      await db.put('progress', { ...rec, mastery: 2 });
    }
  });
  const next = page.getByRole('button', { name: 'Tiếp' });
  for (let i = 0; i < 40 && !(await page.locator('.phrase-choice').first().isVisible()); i++) {
    await next.click();
    await page.waitForTimeout(80);
  }
  await expect.poll(() => page.evaluate(() => window.kidEnglish.speaker.speaking)).toBe(false);
  const ask = await page.evaluate(() => window.__spoken.filter((t) => t.startsWith('Which one is:')).at(-1));
  const answer = ask.replace('Which one is: ', '').replace(/\?$/, '');
  await page.locator(`.phrase-choice:not([aria-label="${answer}"])`).first().click();
  const key = `phrase:${answer.toLowerCase()}`;
  await expect.poll(async () => (await progressOf(page, key))?.attempts?.wrong ?? 0).toBe(1);
  expect((await progressOf(page, key)).mastery).toBe(2);
});

test('không có mic: bài câu vẫn chạy hết (chế độ chỉ nghe)', async ({ page }) => {
  await fakeSpeech(page, { mic: false });
  await startApp(page);
  await page.getByRole('button', { name: 'Câu nói' }).click();
  await page.getByRole('button', { name: 'Morning', exact: true }).click();
  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();
  const spoken = await page.evaluate(() => window.__spoken);
  expect(spoken).toContain('Your turn!');
  expect(spoken).not.toContain("Let's try!");
});

test('Góc bố mẹ: tạo bài câu (copy prompt), dán bài, xem trước, lưu, đổi hiệu ứng', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Tạo bài câu' }).click();
  await page.getByRole('button', { name: 'Going out' }).click();
  await page.getByRole('button', { name: 'Copy prompt' }).click();
  await expect(page.getByRole('status')).toContainText('Đã copy prompt');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/situation: "Going out"/);
  expect(copied).toMatch(/Do NOT repeat them: wake up/);

  await page.getByRole('button', { name: 'Đã có bài từ AI → Dán bài' }).click();
  await page.getByPlaceholder(/Dán toàn bộ câu trả lời/).fill(PASTED);
  await page.getByRole('button', { name: 'Kiểm tra bài' }).click();
  await expect(page.getByText(/hiệu ứng "dance" không có/)).toBeVisible();
  await expect(page.locator('.preview .phrase-admin')).toHaveCount(3);
  await page.getByRole('button', { name: 'Lưu bài' }).click();

  // Trang bài câu: đổi hiệu ứng câu 3, có "Câu dùng trong ngày".
  await expect(page.getByLabel('Hiệu ứng của câu 3')).toHaveValue('none');
  await page.getByLabel('Hiệu ứng của câu 3').selectOption('go');
  await expect(page.locator('.daily-phrases')).toContainText('Open the door — Mở cửa');
  await expect.poll(() => page.evaluate(async () => (await window.kidEnglish.db.getAll('lessons')).find((l) => l.title === 'Going out')?.phrases[2].motion)).toBe('go');
  const saved = await page.evaluate(async () => (await window.kidEnglish.db.getAll('lessons')).find((l) => l.title === 'Going out'));
  expect(saved.kind).toBe('phrases');
  expect(saved.topic).toBe('Going out');

  // Bé thấy bài mới trong mục Câu nói, có tab chủ đề (2 chủ đề).
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: 'Về màn hình của bé' }).click();
  await page.getByRole('button', { name: 'Câu nói' }).click();
  await expect(page.locator('.topic-tab')).toHaveText(['⭐All', '🚪Going out', '🌅Morning']);
});

test('khung hình (flipbook): ảnh lưới 3×4 → cắt → xem trước → lưu → khi học phát flipbook thay cho cảnh emoji', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await startApp(page);
  // Ảnh lưới giống AI vẽ: 3 cột (bước) × 4 hàng (câu), nền trắng, đường kẻ xám; mỗi ô một màu riêng.
  const png = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 900; c.height = 1200;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 900, 1200);
    g.strokeStyle = '#e4e4e4'; g.lineWidth = 6;
    for (const x of [300, 600]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1200); g.stroke(); }
    for (const y of [300, 600, 900]) { g.beginPath(); g.moveTo(0, y); g.lineTo(900, y); g.stroke(); }
    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 3; col++) {
        g.fillStyle = `hsl(${r * 90}, 70%, ${35 + col * 15}%)`;
        g.beginPath(); g.arc(col * 300 + 150, r * 300 + 150, 90, 0, Math.PI * 2); g.fill();
      }
    }
    return c.toDataURL('image/png').split(',')[1];
  });
  await openParent(page);
  await page.getByRole('button', { name: 'Quản lý bài' }).click();
  await page.getByRole('button', { name: /Morning/ }).click();

  const frames = page.locator('section', { hasText: 'Khung hình (flipbook)' });
  await expect(frames.getByText('Cả bài: 4 câu → lưới 3 cột × 4 hàng')).toBeVisible();
  await frames.getByRole('button', { name: 'Copy prompt khung hình' }).first().click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/### ROW 2 — WASH YOUR FACE/);
  expect(copied).toMatch(/Setting that stays IDENTICAL.*alarm clock/);
  expect(copied).toMatch(/FINAL CHECK: exactly 12 equal cells/);

  await frames.locator('input[type=file]').first().setInputFiles({ name: 'frames.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await expect(page.getByLabel('Kiểu lưới khung hình')).toHaveValue('3x4');
  await expect(frames.locator('.grid-cell')).toHaveCount(12);
  await expect(frames.locator('details.frames-single .frames-group')).toHaveCount(4);
  await expect(page.getByLabel('Khung cho ô 4')).toHaveValue('p2:0');
  await expect(frames.locator('.flip-preview')).toHaveCount(4);
  await frames.getByRole('button', { name: 'Lưu khung hình' }).click();
  await expect(page.getByText('🎞️ 3 khung hình')).toHaveCount(4);

  const stored = await page.evaluate(async () => {
    const lesson = (await window.kidEnglish.db.getAll('lessons')).find((l) => l.title === 'Morning');
    const sets = await window.kidEnglish.db.getAllByIndex('frameSets', 'lessonId', lesson.id);
    return sets.map((s) => [s.phraseId, s.frames.length]).sort();
  });
  expect(stored).toEqual([['p1', 3], ['p2', 3], ['p3', 3], ['p4', 3]]);

  // Khi bé học: phát flipbook (3 khung ảnh) thay cho cảnh Bông + emoji.
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: 'Về màn hình của bé' }).click();
  await page.getByRole('button', { name: 'Câu nói' }).click();
  await page.getByRole('button', { name: 'Morning', exact: true }).click();
  await expect(page.locator('.scene.flipbook .flip-frame')).toHaveCount(3);
  await expect(page.locator('.scene-object')).toHaveCount(0);
  await playThrough(page);
  await expect(page.locator('.prize-sticker')).toBeVisible();
});
